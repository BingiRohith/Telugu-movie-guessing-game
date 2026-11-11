'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { modeDetails, questions, selectQuestions, type Question } from '../lib/questions';
import { readProgress } from '../lib/progress-store';
import { MODES, PACES, ROUND_COUNT, pointsForAnswer, type Mode, type Pace } from '../lib/rules';
import { EMPTY_PROGRESS, newTrophies } from '../lib/solo-rewards';
import { TrophyCase } from './trophy-case';
import { useWallet } from '../lib/use-wallet';
import { WalletPanel } from './wallet-panel';
import { GAME_COST, type CoinGame } from '../lib/economy';

type Phase = 'setup' | 'listening' | 'question' | 'review' | 'results';
type Result = { question: Question; choice: number | null; points: number };
const letters = ['A', 'B', 'C', 'D'];

export function Battle() {
  const economy = useWallet();
  const { wallet, busy: walletBusy, update: updateWallet } = economy;
  const [coinGame, setCoinGame] = useState<CoinGame | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<{ choice: number | null } | null>(null);
  const [showRefill, setShowRefill] = useState(false);
  const [gameError, setGameError] = useState('');
  const startRequest = useRef<string | null>(null);
  const beforeProgress = useRef(EMPTY_PROGRESS);
  const practiceAutoStarted = useRef(false);
  const [mode, setMode] = useState<Mode>('music');
  const [pace, setPace] = useState<Pace>('normal');
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [remaining, setRemaining] = useState<number>(PACES.normal);
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [persistent, setPersistent] = useState(true);
  const [progressReady, setProgressReady] = useState(false);
  const [unlocked, setUnlocked] = useState<ReturnType<typeof newTrophies>>([]);
  const [gameQuestions, setGameQuestions] = useState<readonly Question[]>(questions.music);
  const startTime = useRef(0);
  const locked = useRef(true);
  const focusTarget = useRef<HTMLHeadingElement>(null);

  const question = gameQuestions[round];
  const duration = PACES[pace];
  const score = results.reduce((total, result) => total + result.points, 0);
  const correctCount = results.filter(({ points }) => points > 0).length;
  const review = phase === 'review' ? results.at(-1) : undefined;

  useEffect(() => {
    let current = true;
    void readProgress().then((saved) => {
      if (current) setProgress(saved);
    }).catch(() => {
      if (current) setPersistent(false);
    }).finally(() => {
      if (current) setProgressReady(true);
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'setup') focusTarget.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (!progressReady || practiceAutoStarted.current || new URLSearchParams(window.location.search).get('practice') !== '1') return;
    practiceAutoStarted.current = true;
    setGameQuestions(selectQuestions('music'));
    setRound(0); setResults([]); setRemaining(PACES.normal);
    locked.current = true;
    setPhase('listening');
  }, [progressReady]);

  const submit = useCallback(async (choice: number | null) => {
    if (locked.current) return;
    locked.current = true;
    setGameError('');
    if (coinGame) {
      try {
        const data = await updateWallet({ type: 'answer', gameId: coinGame.id, round, choice });
        if (!data.game) throw new Error('Could not recover this round. Return home and resume your game.');
        setCoinGame(data.game);
        setResults(data.game.answers.map(answer => ({ question: questions[data.game!.mode].find(item => item.id === answer.questionId)!, choice: answer.choice, points: answer.points })));
        setPendingAnswer(null);
        setPhase('review');
      } catch (failure) {
        setGameError(failure instanceof Error ? failure.message : 'Could not save your answer.');
        setPendingAnswer({ choice });
      }
      return;
    }
    const elapsed = performance.now() - startTime.current;
    const accepted = elapsed < duration * 1000 ? choice : null;
    const points = pointsForAnswer(accepted === question.answer, elapsed, pace);

    setResults((previous) => [...previous, { question, choice: accepted, points }]);
    setPhase('review');
  }, [duration, pace, question, coinGame, round, updateWallet]);

  useEffect(() => {
    if (phase !== 'question') return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, duration * 1000 - (performance.now() - startTime.current));
      setRemaining(Math.ceil(left / 1000));
      if (left === 0) void submit(null);
    }, 100);
    return () => window.clearInterval(timer);
  }, [duration, phase, submit]);

  function openQuestion(index: number) {
    setRound(index);
    setRemaining(duration);
    locked.current = true;
    setPendingAnswer(null);
    setPhase('listening');
  }

  async function startAnswering() {
    setGameError('');
    if (coinGame) {
      const requestedAt = performance.now();
      try {
        const data = await updateWallet({ type: 'ready', gameId: coinGame.id, round });
        if (!data.game || data.game.readyAt === null) throw new Error('This round has changed. Return home and resume.');
        setCoinGame(data.game);
        const elapsed = data.serverNow - data.game.readyAt + (performance.now() - requestedAt) / 2;
        startTime.current = performance.now() - elapsed;
        setRemaining(Math.max(0, Math.ceil(duration - elapsed / 1000)));
        locked.current = false;
        setPhase('question');
      } catch (failure) { setGameError(failure instanceof Error ? failure.message : 'Could not start the timer. Retry safely.'); }
      return;
    }
    startTime.current = performance.now();
    locked.current = false;
    setPhase('question');
  }

  function enterCoinGame(game: CoinGame, serverNow: number) {
    setMode(game.mode); setPace(game.pace); setCoinGame(game);
    setGameQuestions(game.questionIds.map(id => questions[game.mode].find(item => item.id === id)!));
    setResults(game.answers.map(answer => ({ question: questions[game.mode].find(item => item.id === answer.questionId)!, choice: answer.choice, points: answer.points })));
    setRound(game.answers.length); setUnlocked([]); setPendingAnswer(null); setGameError('');
    const elapsed = game.readyAt === null ? 0 : Math.max(0, serverNow - game.readyAt);
    setRemaining(Math.max(0, Math.ceil(PACES[game.pace] - elapsed / 1000)));
    startTime.current = performance.now() - elapsed;
    locked.current = game.readyAt === null;
    setPhase(game.readyAt === null ? 'listening' : 'question');
  }

  async function resumeGame() {
    if (!wallet?.activeGame) return;
    beforeProgress.current = wallet.progress;
    const game = wallet.activeGame;
    try {
      if (game.readyAt !== null) {
        const data = await updateWallet({ type: 'ready', gameId: game.id, round: game.answers.length });
        if (data.game) enterCoinGame(data.game, data.serverNow);
      } else enterCoinGame(game, Date.now());
    } catch { /* Wallet error provides recovery instructions. */ }
  }

  async function startGame(paid = false) {
    if (walletBusy) return;
    setGameError(''); setShowRefill(false);
    if (paid) {
      if (!wallet || wallet.coins < GAME_COST) { setShowRefill(true); setPhase('setup'); return; }
      startRequest.current ??= crypto.randomUUID();
      beforeProgress.current = wallet.progress;
      try {
        const data = await updateWallet({ type: 'start', mode, pace, requestId: startRequest.current });
        if (!data.game) throw new Error('Could not start this game. Refresh your wallet.');
        startRequest.current = null;
        enterCoinGame(data.game, data.serverNow);
      } catch (failure) {
        setGameError(failure instanceof Error ? failure.message : 'Could not start your game. Retry safely.');
        void economy.refresh();
      }
      return;
    }
    setCoinGame(null);
    setGameQuestions(selectQuestions(mode));
    setResults([]);
    setUnlocked([]);
    openQuestion(0);
  }

  function finishGame() {
    if (results.length !== ROUND_COUNT) return;
    if (coinGame && wallet) setUnlocked(newTrophies(beforeProgress.current, wallet.progress));
    setPhase('results');
  }

  function returnHome() {
    locked.current = true;
    setPendingAnswer(null); setGameError('');
    setPhase('setup');
    void economy.refresh();
    requestAnimationFrame(() => focusTarget.current?.focus());
  }

  return (
    <div className="shell">
      <header className="site-header">
        <button type="button" className="wordmark" onClick={returnHome} disabled={walletBusy} aria-label="Telugu Dialogue Battle home">
          <span className="brand-icon" aria-hidden="true">✦</span>
          <span>Telugu <strong>Dialogue Battle</strong></span>
        </button>
        <nav className="header-links" aria-label="Main"><a className="room-link" href="/rewards/">◉ {wallet ? `${wallet.coins} coins` : 'Daily rewards'}</a><a className="room-link" href="/review/">Review guide</a><a className="room-link" href="/profile/">Player profile</a></nav>
      </header>

      <main id="main">
        {gameError && <p className="wallet-notice" role="alert">{gameError}</p>}
        {phase === 'setup' && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow"><span aria-hidden="true">✦</span> THE TELUGU CINEMA QUIZ</p>
                <h1 ref={focusTarget} tabIndex={-1}>Know your<br /><em>cinema?</em></h1>
                <p>From Badri to Peddi. Explore Telugu movie music, hit songs and dialogues, then test your memory in five solo rounds.</p>
                <p className="catalog-tag">2000–2026 · 12 films · 18 questions</p>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="disc-stage">
                  <div className="record-lights">{Array.from({ length: 8 }, (_, index) => <span key={index} />)}</div>
                  <div className="record"><div className="record-label"><span>తె</span></div></div>
                </div>
                <div className="record-caption">SIDE A <span /> TELUGU EDITION</div>
              </div>
            </section>

            <WalletPanel client={economy} compact />
            {wallet?.activeGame && <section className="resume-banner"><div><strong>Your {wallet.activeGame.mode} game is saved.</strong><p>Round {Math.min(5, wallet.activeGame.answers.length + 1)} of 5 · Resume without spending more coins. A started answer timer keeps running.</p></div><button className="primary" disabled={walletBusy} onClick={() => void resumeGame()}>Resume game</button><button className="secondary" disabled={walletBusy} onClick={() => void updateWallet({ type: 'abandon', gameId: wallet.activeGame!.id }).catch(() => {})}>End game · no refund</button></section>}
            <section className="setup" aria-labelledby="setup-title">
              <div className="section-heading">
                <div><p className="eyebrow">SOLO GUESSING</p><h2 id="setup-title">Pick your game</h2></div>
                <p>5 rounds <span aria-hidden="true">·</span> 4 choices each</p>
              </div>
              <fieldset className="mode-grid" disabled={!progressReady}>
                <legend className="sr-only">Game type</legend>
                {MODES.map((item) => (
                  <label className="mode-card" key={item} data-selected={item === mode}>
                    <input className="sr-only" type="radio" name="mode" checked={item === mode} onChange={() => setMode(item)} />
                    <span className="mode-top"><span className="mode-icon" aria-hidden="true">{modeDetails[item].icon}</span><span className="mode-index">{modeDetails[item].numeral}</span></span>
                    <span className="mode-title">{modeDetails[item].title} <small lang="te">{modeDetails[item].telugu}</small></span>
                    <span className="mode-copy">{modeDetails[item].subtitle}</span>
                  </label>
                ))}
              </fieldset>
              <div className="setup-actions">
                <fieldset className="pace-options" disabled={!progressReady}>
                  <legend className="sr-only">Time per question</legend>
                  {(['normal', 'quick'] as const).map((item) => (
                    <label key={item} data-selected={item === pace}>
                      <input className="sr-only" type="radio" name="pace" checked={item === pace} onChange={() => setPace(item)} />
                      {item === 'normal' ? 'Normal' : 'Quick'} <small>{PACES[item]}s</small>
                    </label>
                  ))}
                </fieldset>
                <div className="play-actions"><button className="secondary" type="button" onClick={() => void startGame(false)} disabled={!progressReady || walletBusy}>Free practice · 0 coins</button>{wallet && <button className="primary" type="button" onClick={() => void startGame(true)} disabled={!economy.ready || walletBusy || Boolean(wallet.activeGame)}>{wallet.coins < GAME_COST ? 'Get more coins' : `Play & earn · ${GAME_COST} coins`} <span aria-hidden="true">→</span></button>}</div>
              </div>
              {showRefill && <div className="refill-box" role="status"><h3>Not enough coins for a coin game.</h3><p>Claim an available daily reward or mission, try a test refill, or keep playing free practice.</p><a className="room-link" href="/rewards/">Open rewards & refills →</a></div>}
              <p className="demo-note">Coin games earn XP, mission progress, points and trophies. Entry coins are spent when the game starts. Free practice costs nothing and earns no wallet rewards.</p>
              <p className="demo-note">
                Client review edition · Official YouTube players require internet. Video titles may reveal answers. Listen first, then start your {duration}-second answer timer. Points reward correct answers only.
              </p>
            </section>
            {progressReady && <TrophyCase progress={wallet?.progress ?? progress} persistent={wallet ? true : persistent} account={Boolean(wallet)} />}
          </>
        )}

        {(phase === 'listening' || phase === 'question' || phase === 'review') && (
          <section className="game-panel" aria-label="Solo round">
            <div className="round-top">
              <p className="eyebrow">{coinGame ? 'Coin game' : 'Free practice'} / {modeDetails[mode].title} / {pace} / Round {round + 1} of {ROUND_COUNT}</p>
              <span className="score-pill">{score} pts</span>
            </div>
            <div className="timer" data-low={remaining <= 3}>
              <progress max={duration} value={remaining} aria-label="Time remaining" />
              <span>{phase === 'listening' ? 'Ready' : `${remaining}s`}</span>
            </div>
            <h1 className="game-title" tabIndex={-1} ref={focusTarget}>{review ? (review.choice === null ? 'Time is up' : review.points > 0 ? 'Correct!' : 'Incorrect') : question.prompt}</h1>
            <div className="clip-box">
              {phase === 'listening' && <>
                <p className="eyebrow">LISTEN FIRST · TIMER PAUSED</p>
                <iframe key={question.id} className="cinema-player" src={`https://www.youtube.com/embed/${question.clip.videoId}?playsinline=1`} title="Official movie media player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
                <p className="clue">Use the player’s play button. When ready, start the answer timer. The player closes while you answer.</p>
                <p className="clue">Player blocked? <a className="room-link" href={question.clip.source} target="_blank" rel="noopener noreferrer">Open official video on YouTube</a>, or use the text clue below. No points are awarded for viewing.</p>
                <button className="primary listen-ready" type="button" disabled={walletBusy} onClick={() => void startAnswering()}>{walletBusy ? 'Starting timer…' : `Start ${duration}s answer timer →`}</button>
              </>}
              {phase === 'question' && <p className="clue">Make your guess before the timer ends.</p>}
              <details open={Boolean(review) || undefined} key={question.id}>
                <summary>Text clue</summary>
                <p className="clue">{question.clue}</p>
              </details>
              {review && <p className="clue">
                {question.film} ({question.year}) · {question.clip.title}<br />{question.clip.credit}{' '}
                {question.clip.source && <a className="room-link" href={question.clip.source} target="_blank" rel="noreferrer">Source</a>}{' '}
              </p>}
            </div>

            {pendingAnswer && <div className="wallet-notice" role="status"><p>Your answer could not be confirmed. Retry to recover the saved result; rewards will not be duplicated.</p><button className="secondary" disabled={walletBusy} onClick={() => { locked.current = false; void submit(pendingAnswer.choice); }}>Retry saving answer</button></div>}

            <div className="answers" aria-label="Answer choices">
              {question.options.map((option, index) => {
                const correct = Boolean(review) && index === question.answer;
                const incorrect = Boolean(review) && review?.choice === index && !correct;
                return (
                  <button key={option} type="button" className="answer" disabled={phase !== 'question' || walletBusy || Boolean(pendingAnswer)} data-correct={correct} data-incorrect={incorrect} onClick={() => void submit(index)}>
                    <span className="letter" aria-hidden="true">{letters[index]}</span><span>{option}</span>
                    {correct && <span className="answer-badge">Correct answer</span>}
                    {incorrect && <span className="answer-badge">Your answer</span>}
                  </button>
                );
              })}
            </div>

            <div className="round-footer">
              <button className="secondary" type="button" disabled={walletBusy} onClick={returnHome}>{coinGame && !coinGame.finished ? 'Pause game' : 'Exit game'}</button>
              {review && (
                <button className="primary" type="button" onClick={() => round + 1 === ROUND_COUNT ? void finishGame() : openQuestion(round + 1)}>
                  {round + 1 === ROUND_COUNT ? 'See results' : 'Next question'} <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </section>
        )}

        {phase === 'results' && (
          <section className="game-panel results-panel" aria-labelledby="results-title">
            <p className="eyebrow">{modeDetails[mode].title} / {pace} / Game complete</p>
            <h1 id="results-title" className="game-title" tabIndex={-1} ref={focusTarget}>Your results</h1>
            <div className="result-stats">
              <div><strong>{score}<small> / {ROUND_COUNT * 100}</small></strong><span>Points</span></div>
              <div><strong>{correctCount}<small> / {ROUND_COUNT}</small></strong><span>Correct answers</span></div>
            </div>
            <div className="clip-box" role="status">
              <p className="eyebrow">{coinGame ? 'REWARDS SAVED TO YOUR PROFILE' : 'FREE PRACTICE COMPLETE'}</p>
              {coinGame && wallet ? <>
                  <p className="reward-earned">+{coinGame.coinsEarned} coins <span>·</span> +{coinGame.xpEarned} XP</p>
                  <p className="trophy-total"><strong>{wallet.points.toLocaleString('en-IN')}</strong> total points · Level {wallet.level}</p>
                  {unlocked.length > 0 && <p className="trophy-unlock">Trophies unlocked: {unlocked.map((trophy) => trophy.name).join(', ')}</p>}
                  <a className="room-link" href="/rewards/">Check your daily missions →</a>
                </> : <p>Good practice! No coins were spent. Play a coin game with your profile to earn XP, mission progress and trophies.</p>}
            </div>
            <ol className="result-list">
              {results.map(({ question: item, choice, points }, index) => (
                <li key={item.id}>
                  <span className="result-number">{index + 1}</span>
                  <div><strong>{item.options[item.answer]}</strong><span>{choice === null ? 'Timed out' : choice === item.answer ? 'Correct' : 'Your answer: ' + item.options[choice]}</span></div>
                  <span className="result-points">{points} pts</span>
                </li>
              ))}
            </ol>
            <div className="round-footer">
              <button className="secondary" type="button" disabled={walletBusy} onClick={returnHome}>Back to games</button>
              <button className="primary" type="button" disabled={walletBusy} onClick={() => void startGame(Boolean(coinGame))}>{coinGame ? 'Play again · 10 coins' : 'Practice again'} <span aria-hidden="true">→</span></button>
            </div>
          </section>
        )}
      </main>
      <footer className="site-footer"><span>Telugu Dialogue Battle</span><a className="room-link" href="/review/">Client review · Source catalog</a></footer>
    </div>
  );
}
