import type { Progress } from '../lib/solo-rewards';
import { TROPHIES } from '../lib/solo-rewards';

export function TrophyCase({ progress, persistent, account = false }: { progress: Progress; persistent: boolean; account?: boolean }) {
  const unlocked = TROPHIES.filter((trophy) => trophy.earned(progress)).length;
  return (
    <section className="setup" aria-labelledby="trophy-title">
      <div className="section-heading">
        <div><p className="eyebrow">SOLO REWARDS</p><h2 id="trophy-title">Trophy case</h2></div>
        <p>{unlocked} / {TROPHIES.length} unlocked</p>
      </div>
      <p className="trophy-total"><strong>{progress.points.toLocaleString('en-IN')}</strong> total points</p>
      <ul className="trophy-grid">
        {TROPHIES.map((trophy) => {
          const earned = trophy.earned(progress);
          return (
            <li className="trophy-card" data-earned={earned} key={trophy.id}>
              <span className="trophy-icon" aria-hidden="true">{trophy.icon}</span>
              <div><strong>{trophy.name}</strong><p>{trophy.description}</p><small>{earned ? 'Unlocked' : 'Locked'}</small></div>
            </li>
          );
        })}
      </ul>
      <p className="demo-note">{account ? 'Coin-game points and trophies are saved to your profile across signed-in devices.' : persistent ? 'Earlier practice points and trophies are saved in this browser. New coin-game rewards belong to your profile.' : 'Browser storage is unavailable. Sign in to save coin-game rewards.'}</p>
    </section>
  );
}
