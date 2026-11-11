import { questions, selectQuestions } from './questions.ts';
import { MODES, PACES, pointsForAnswer, type Mode, type Pace } from './rules.ts';
import { addGame, EMPTY_PROGRESS, type Progress } from './solo-rewards.ts';

export const GAME_COST = 10;
export const DAILY_COINS = [10, 15, 15, 20, 20, 25, 30] as const;
export const COIN_PACKS = [{ id: 'small', coins: 100 }, { id: 'medium', coins: 300 }, { id: 'large', coins: 750 }] as const;
export type GameAnswer = { questionId: string; choice: number | null; points: number };
export type CoinGame = { id: string; mode: Mode; pace: Pace; questionIds: string[]; answers: GameAnswer[]; startedAt: number; readyAt: number | null; finished: boolean; abandoned: boolean; coinsEarned: number; xpEarned: number };
export type MissionId = 'correct-three' | 'two-games' | 'two-modes';
type DayStats = { date: string; correct: number; games: number; modes: Mode[]; claimed: MissionId[] };
export type WalletRecord = {
  version: 1; revision: number; coins: number; xp: number; points: number; gamesCompleted: number; correct: number;
  lastDaily: string | null; dailyClaims: number; dailyStreak: number; day: DayStats; games: CoinGame[];
  progress: Progress;
  ledger: { id: string; label: string; coins: number; at: number }[];
};
export type EconomyAction =
  | { type: 'view' }
  | { type: 'daily' }
  | { type: 'mission'; mission: MissionId }
  | { type: 'purchase'; pack: string; requestId: string }
  | { type: 'start'; mode: Mode; pace: Pace; requestId: string }
  | { type: 'ready'; gameId: string; round: number }
  | { type: 'answer'; gameId: string; round: number; choice: number | null }
  | { type: 'abandon'; gameId: string };

export class EconomyError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export function dayKey(now: number) { return new Date(now + 330 * 60000).toISOString().slice(0, 10); }
function emptyDay(now: number): DayStats { return { date: dayKey(now), correct: 0, games: 0, modes: [], claimed: [] }; }
export function newWallet(now: number): WalletRecord {
  return { version: 1, revision: 0, coins: 100, xp: 0, points: 0, gamesCompleted: 0, correct: 0, progress: structuredClone(EMPTY_PROGRESS), lastDaily: null, dailyClaims: 0, dailyStreak: 0, day: emptyDay(now), games: [], ledger: [{ id: crypto.randomUUID(), label: 'Welcome bonus', coins: 100, at: now }] };
}
function addCoins(wallet: WalletRecord, coins: number, label: string, now: number) {
  if (wallet.coins + coins < 0) throw new EconomyError('You need 10 coins for a coin game. Claim a reward, refill, or play free practice.', 402);
  if (wallet.coins + coins > 1000000) throw new EconomyError('Your review wallet has reached its coin limit.');
  wallet.coins += coins;
  wallet.ledger.unshift({ id: crypto.randomUUID(), coins, label, at: now });
  wallet.ledger = wallet.ledger.slice(0, 40);
}
export function missions(wallet: WalletRecord) {
  return [
    { id: 'correct-three' as const, title: 'Sharp ears', description: 'Guess 3 answers correctly in coin games.', progress: Math.min(3, wallet.day.correct), target: 3, reward: 5 },
    { id: 'two-games' as const, title: 'Double feature', description: 'Complete 2 coin games today.', progress: Math.min(2, wallet.day.games), target: 2, reward: 10 },
    { id: 'two-modes' as const, title: 'Explore Telugu cinema', description: 'Complete coin games in 2 different modes.', progress: Math.min(2, wallet.day.modes.length), target: 2, reward: 10 },
  ].map(mission => ({ ...mission, claimed: wallet.day.claimed.includes(mission.id) }));
}
export function walletView(wallet: WalletRecord, now: number, testCheckout: boolean) {
  const activeGame = wallet.games.find(game => !game.finished && !game.abandoned) ?? null;
  return {
    revision: wallet.revision, coins: wallet.coins, xp: wallet.xp, level: Math.floor(wallet.xp / 250) + 1, xpInLevel: wallet.xp % 250,
    points: wallet.points, gamesCompleted: wallet.gamesCompleted, correct: wallet.correct, progress: wallet.progress,
    daily: { canClaim: wallet.lastDaily !== dayKey(now), index: wallet.dailyClaims % 7, streak: wallet.dailyStreak, nextReset: new Date((Math.floor((now + 330 * 60000) / 86400000) + 1) * 86400000 - 330 * 60000).toISOString() },
    missions: missions(wallet), ledger: wallet.ledger, activeGame, testCheckout,
  };
}
export type WalletView = ReturnType<typeof walletView>;
export type EconomyResponse = { wallet: WalletView; game?: CoinGame; serverNow: number };

// Runs inside the profile Durable Object's storage transaction. Only the server supplies now.
export function applyEconomy(wallet: WalletRecord, action: EconomyAction, now: number, testCheckout = false): EconomyResponse {
  if (wallet.day.date !== dayKey(now)) wallet.day = emptyDay(now);
  // Expired interrupted games never earn rewards; their initial entry cost stays spent.
  for (const game of wallet.games) if (!game.finished && !game.abandoned && now - game.startedAt > 24 * 60 * 60 * 1000) game.abandoned = true;
  let game: CoinGame | undefined;
  if (action.type === 'daily') {
    if (wallet.lastDaily !== dayKey(now)) {
      addCoins(wallet, DAILY_COINS[wallet.dailyClaims % 7], 'Daily reward · day ' + (wallet.dailyClaims % 7 + 1), now);
      wallet.dailyStreak = wallet.lastDaily === dayKey(now - 86400000) ? wallet.dailyStreak + 1 : 1;
      wallet.lastDaily = dayKey(now);
      wallet.dailyClaims++;
    }
  } else if (action.type === 'mission') {
    const mission = missions(wallet).find(item => item.id === action.mission);
    if (!mission) throw new EconomyError('Unknown mission.');
    if (!mission.claimed) {
      if (mission.progress < mission.target) throw new EconomyError('Complete this mission before claiming its coins.', 409);
      addCoins(wallet, mission.reward, 'Mission · ' + mission.title, now);
      wallet.day.claimed.push(mission.id);
    }
  } else if (action.type === 'purchase') {
    if (!testCheckout) throw new EconomyError('Purchases are not enabled. No payment provider is connected.', 403);
    const pack = COIN_PACKS.find(item => item.id === action.pack);
    if (!pack) throw new EconomyError('Unknown coin pack.');
    addCoins(wallet, pack.coins, 'Test refill · no payment', now);
  } else if (action.type === 'start') {
    if (!MODES.includes(action.mode) || !(action.pace in PACES)) throw new EconomyError('Choose a valid game and pace.');
    game = wallet.games.find(item => item.id === action.requestId);
    if (!game) {
      if (wallet.games.some(item => !item.finished && !item.abandoned)) throw new EconomyError('Resume or end your unfinished coin game first.', 409);
      addCoins(wallet, -GAME_COST, 'Coin game · ' + action.mode, now);
      game = { id: action.requestId, mode: action.mode, pace: action.pace, questionIds: selectQuestions(action.mode).map(item => item.id), answers: [], startedAt: now, readyAt: null, finished: false, abandoned: false, coinsEarned: 0, xpEarned: 0 };
      wallet.games = [...wallet.games.slice(-11), game];
    }
  } else if (action.type === 'ready' || action.type === 'answer' || action.type === 'abandon') {
    game = wallet.games.find(item => item.id === action.gameId);
    if (!game) throw new EconomyError('This game is no longer available.', 404);
    if (action.type === 'abandon') {
      if (!game.finished) game.abandoned = true;
    } else {
      if (!Number.isInteger(action.round) || action.round < 0 || action.round >= 5) throw new EconomyError('Invalid round.');
      if (action.round < game.answers.length) return { wallet: walletView(wallet, now, testCheckout), game, serverNow: now };
      if (game.finished || game.abandoned || action.round !== game.answers.length) throw new EconomyError('This round is not active.', 409);
      if (action.type === 'ready') {
        game.readyAt ??= now;
      } else {
        if (action.choice !== null && (!Number.isInteger(action.choice) || action.choice < 0 || action.choice > 3)) throw new EconomyError('Invalid answer.');
        if (game.readyAt === null) throw new EconomyError('Start the answer timer first.', 409);
        const question = questions[game.mode].find(item => item.id === game!.questionIds[action.round]);
        if (!question) throw new EconomyError('Question unavailable.', 409);
        const elapsed = Math.max(0, now - game.readyAt);
        const choice = elapsed < PACES[game.pace] * 1000 ? action.choice : null;
        const points = pointsForAnswer(choice === question.answer, elapsed, game.pace);
        game.answers.push({ questionId: question.id, choice, points });
        game.readyAt = null;
        // Mission progress is committed with the completed game, never from client totals.
        if (game.answers.length === 5) {
          const correct = game.answers.filter(answer => answer.points > 0).length;
          game.finished = true;
          game.xpEarned = 20 + correct * 10;
          game.coinsEarned = (wallet.day.games === 0 ? 10 : 0) + (correct === 5 ? 5 : 0);
          if (wallet.day.games === 0) addCoins(wallet, 10, 'First completed game today', now);
          if (correct === 5) addCoins(wallet, 5, 'Perfect game bonus', now);
          wallet.xp += game.xpEarned;
          wallet.correct += correct;
          wallet.points += game.answers.reduce((sum, answer) => sum + answer.points, 0);
          wallet.progress = addGame(wallet.progress, { mode: game.mode, correct, points: game.answers.reduce((sum, answer) => sum + answer.points, 0) });
          wallet.gamesCompleted++;
          wallet.day.games++;
          wallet.day.correct += correct;
          if (!wallet.day.modes.includes(game.mode)) wallet.day.modes.push(game.mode);
        }
      }
    }
  }
  return { wallet: walletView(wallet, now, testCheckout), game, serverNow: now };
}

export function validAction(value: unknown): value is EconomyAction {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  const uuid = (id: unknown) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
  switch (item.type) {
    case 'daily': return true;
    case 'mission': return ['correct-three', 'two-games', 'two-modes'].includes(String(item.mission));
    case 'purchase': return uuid(item.requestId) && COIN_PACKS.some(pack => pack.id === item.pack);
    case 'start': return uuid(item.requestId) && MODES.some(mode => mode === item.mode) && (item.pace === 'normal' || item.pace === 'quick');
    case 'abandon': return uuid(item.gameId);
    case 'ready': return uuid(item.gameId) && Number.isInteger(item.round) && Number(item.round) >= 0 && Number(item.round) < 5;
    case 'answer': return uuid(item.gameId) && Number.isInteger(item.round) && Number(item.round) >= 0 && Number(item.round) < 5 && (item.choice === null || Number.isInteger(item.choice) && Number(item.choice) >= 0 && Number(item.choice) <= 3);
    default: return false;
  }
}
