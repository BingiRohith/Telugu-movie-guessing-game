import { modeDetails, questions } from '../../lib/questions';
import { MODES } from '../../lib/rules';
import { SourcePreview } from '../../components/source-preview';

export const metadata = { title: 'Client review | Telugu Dialogue Battle' };

export default function ReviewPage() {
  return <div className="shell">
    <header className="site-header"><a className="wordmark" href="/">✦ Telugu <strong>Dialogue Battle</strong></a><a className="room-link" href="/">Play the game →</a></header>
    <main className="review-guide" id="main">
      <p className="eyebrow">CLIENT REVIEW · 11 NOVEMBER 2026 · TELUGU FIRST</p>
      <h1>Three ways to know<br />your cinema.</h1>
      <p>18 questions across 12 Telugu films from 2000–2026. Five rounds per game, Normal 20s or Quick 10s, account-linked coins, XP and trophies. Free practice is always available.</p>
      <h2>Review in five minutes</h2>
      <ol>
        <li>Create an account with a username and password, then open the wallet for 100 welcome coins. Existing signed-in players can set up their login on the profile page and keep their rewards. Or play free practice without an account.</li>
        <li>Open the game, select Music, Dialogue or Song, then choose a 10-coin game to earn rewards or free practice for no rewards.</li>
        <li>Play the official video in the listening step. The answer timer stays paused.</li>
        <li>Select “Start answer timer”. The video closes; select an answer within 20 or 10 seconds.</li>
        <li>Review the correct answer and source, then complete all five rounds. Coin-game rewards save on the fifth answer; the results show earned coins, XP and trophies.</li>
        <li>Open Daily rewards to claim a daily bonus, inspect missions and try the clearly labelled ₹0 test checkout. Reload to verify persistence, and pause/resume a coin game without another charge.</li>
      </ol>
      <div className="review-grid">
        <section className="review-card"><h3>What is ready</h3><p>Three solo game types, publisher media, timed answers, results and four trophies. Server-stored coin wallet, seven-day rewards, three daily missions, XP levels, resumable coin games and test refills. Song rounds sample five of eight questions.</p><a className="room-link" href="/rewards/">Explore rewards & coins →</a></section>
        <section className="review-card"><h3>Playback and review limits</h3><p>Internet and access to YouTube are required. Publisher titles and video images stay visible and can reveal answers. Ads, regional restrictions or embedding blocks may interrupt playback; each round has an official source link and text clue. Dialogue includes studio trailers and a released scene, rather than isolated audio snippets.</p></section>
        <section className="review-card"><h3>Before a public game launch</h3><p>This is a client review listening edition. A blind audio quiz needs permitted standalone excerpts and a larger catalog. Points reward answers, with no viewing requirement. Coin-game rewards follow your profile across signed-in devices. Refills are simulated; no real payment provider or real purchases are enabled.</p></section>
      </div>
      <h2>Source catalog</h2>
      <p>Links below reveal the answers. These are original publisher releases, not sample recordings. Each entry records the film year; upload and soundtrack dates may differ. Availability must be checked again before sharing a review.</p>
      {MODES.map(mode => <section key={mode} aria-labelledby={`${mode}-catalog`}>
        <h2 id={`${mode}-catalog`}>{modeDetails[mode].title} · {questions[mode].length} questions</h2>
        <div className="review-grid">{questions[mode].map(item => <article className="review-card" key={item.id}>
          <p className="eyebrow">{item.year} · {modeDetails[mode].title}</p><h3>{item.film}</h3>
          <p>{item.clip.title}</p><p>{item.clip.credit}</p>
          <a className="room-link" href={item.clip.source} target="_blank" rel="noopener noreferrer">Open publisher video ↗</a>
          <SourcePreview videoId={item.clip.videoId} title={item.clip.title} />
        </article>)}</div>
      </section>)}
    </main>
    <footer className="site-footer"><span>Local client review · No paid APIs</span><a className="room-link" href="/">Back to game</a></footer>
  </div>;
}
