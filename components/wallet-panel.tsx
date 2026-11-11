'use client';

import { useEffect, useRef, useState } from 'react';
import { COIN_PACKS, DAILY_COINS, GAME_COST } from '../lib/economy';
import type { WalletClient } from '../lib/use-wallet';

function resetLabel(value: string) { return new Date(value).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }) + ' IST'; }

export function WalletPanel({ client, compact = false }: { client: WalletClient; compact?: boolean }) {
  const { wallet, profile, ready, busy, error, update, refresh } = client;
  const [notice, setNotice] = useState('');
  const [pack, setPack] = useState<string | null>(null);
  const checkoutId = useRef<string | null>(null);
  // Refresh at the server-provided reset, including a page left open overnight.
  useEffect(() => {
    if (!wallet) return;
    const delay = Math.max(1000, new Date(wallet.daily.nextReset).getTime() - Date.now() + 1000);
    const timer = window.setTimeout(() => void refresh(), Math.min(delay, 86400000));
    return () => clearTimeout(timer);
  }, [wallet, refresh]);
  async function claimDaily() {
    try { const result = await update({ type: 'daily' }); setNotice(`Daily reward claimed. Your balance is ${result.wallet.coins} coins.`); } catch { /* Error is displayed by the wallet client. */ }
  }
  async function claimMission(mission: 'correct-three' | 'two-games' | 'two-modes') {
    try { await update({ type: 'mission', mission }); setNotice('Mission reward added to your wallet.'); } catch { /* Retain the retry button. */ }
  }
  async function refill() {
    if (!pack) return;
    checkoutId.current ??= crypto.randomUUID();
    try {
      const result = await update({ type: 'purchase', pack, requestId: checkoutId.current });
      setNotice(`Test refill complete. ${result.wallet.coins} coins available. No payment was taken.`);
      setPack(null); checkoutId.current = null;
    } catch { /* Keep the same request ID when retrying. */ }
  }
  if (!ready) return <section className="wallet-panel"><p role="status">Loading your rewards…</p></section>;
  if (!wallet) return <section className="wallet-panel welcome-wallet">
    <div><p className="eyebrow">YOUR NEXT FEATURE STARTS HERE</p><h2>100 welcome coins. A reason to return.</h2><p>Save your coin wallet, claim daily rewards and unlock missions with a player profile. Free practice is always available.</p></div>
    <a className="primary" href="/profile/">Create profile / Sign in →</a>
    {error && <p role="status" className="audio-status">{error}</p>}
  </section>;
  const selectedPack = COIN_PACKS.find(item => item.id === pack);
  return <section className="wallet-panel" aria-label="Coin wallet">
    <div className="section-heading"><div><p className="eyebrow">{profile?.displayName} · YOUR CINEMA JOURNEY</p><h2>{wallet.coins < GAME_COST ? 'Ready for a refill?' : 'Your next round is calling.'}</h2></div><span className="coin-balance">◉ {wallet.coins.toLocaleString('en-IN')} <small>coins</small></span></div>
    <div className="wallet-overview"><div className="level-meter"><strong>Level {wallet.level}</strong><span>{wallet.xpInLevel} / 250 XP to the next level</span><progress max={250} value={wallet.xpInLevel} aria-label="Level progress" /></div><div className="daily-cta"><span>{wallet.daily.canClaim ? `Daily reward ready · +${DAILY_COINS[wallet.daily.index]} coins` : `Daily reward claimed · next at ${resetLabel(wallet.daily.nextReset)}`}</span><button className="primary" type="button" onClick={() => void claimDaily()} disabled={busy || !wallet.daily.canClaim}>{wallet.daily.canClaim ? 'Claim daily reward' : 'Claimed today ✓'}</button></div></div>
    {compact ? <div className="wallet-links"><span>{wallet.gamesCompleted} games · {wallet.points} points · {wallet.daily.streak}-day claim streak</span><a className="room-link" href="/rewards/">Daily missions, rewards & refills →</a></div> : <>
      <h3 className="wallet-heading">Seven days of rewards</h3><p className="clue">One claim each day. Collected rewards stay yours, even if you miss a day. Your next calendar reward never resets.</p>
      <ol className="reward-calendar">{DAILY_COINS.map((coins, index) => <li key={index} data-current={index === wallet.daily.index}><span>Day {index + 1}</span><strong>◉ {coins}</strong><small>{index === (wallet.daily.index + 6) % 7 && !wallet.daily.canClaim ? 'Claimed today' : index === wallet.daily.index ? 'Next reward' : 'Daily bonus'}</small></li>)}</ol>
      <div className="section-heading"><h3 className="wallet-heading">Today’s missions</h3><span className="clue">Resets at midnight IST</span></div>
      <div className="mission-grid">{wallet.missions.map(mission => <article className="mission-card" key={mission.id}><p className="eyebrow">+{mission.reward} COINS</p><h4>{mission.title}</h4><p>{mission.description}</p><progress value={mission.progress} max={mission.target} aria-label={`${mission.title} progress`} /><div className="mission-footer"><span>{mission.progress} / {mission.target}</span><button className="secondary" disabled={busy || mission.claimed || mission.progress < mission.target} onClick={() => void claimMission(mission.id)}>{mission.claimed ? 'Claimed ✓' : mission.progress >= mission.target ? 'Claim coins' : 'In progress'}</button></div></article>)}</div>
      <section className="refill-box" aria-labelledby="refill-title"><p className="eyebrow">KEEP THE CINEMA GOING</p><h3 id="refill-title">{wallet.coins < GAME_COST ? 'You’re out of play credits.' : 'Coin refills'}</h3><p>A coin game costs {GAME_COST} coins. You can claim available rewards, return for tomorrow’s bonus, or play free practice for 0 coins.</p><a className="room-link" href="/?practice=1">Play free practice →</a>
        <p className="test-checkout-note">Client review checkout · No real money, payment details or purchase is involved.</p>
        <div className="pack-grid">{COIN_PACKS.map(item => <button className="coin-pack" key={item.id} type="button" disabled={busy || !wallet.testCheckout || Boolean(pack)} onClick={() => { setPack(item.id); checkoutId.current = crypto.randomUUID(); setNotice(''); }}><strong>◉ {item.coins}</strong><span>Test refill · ₹0</span></button>)}</div>
        {!wallet.testCheckout && <p className="clue">Test checkout is disabled on this server. Real purchases are not configured.</p>}
        {selectedPack && <section className="checkout-confirm" aria-label="Test refill confirmation"><h4>Confirm test refill</h4><p>{selectedPack.coins} review coins · ₹0 charged. This simulates a purchase for testing only.</p><div className="wallet-links"><button className="primary" disabled={busy} onClick={() => void refill()}>{busy ? 'Adding coins…' : 'Confirm test refill'}</button><button className="secondary" disabled={busy} onClick={() => { setPack(null); checkoutId.current = null; }}>Cancel</button></div></section>}
      </section>
      <details className="wallet-history"><summary>Wallet activity</summary><ul>{wallet.ledger.map(item => <li key={item.id}><span>{item.label}<small>{new Date(item.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</small></span><strong data-credit={item.coins > 0}>{item.coins > 0 ? '+' : ''}{item.coins}</strong></li>)}</ul></details>
      <p className="clue">First completed coin game each day: +10 coins. Perfect game: +5 coins. Completed coin game: 20 XP plus 10 XP per correct answer. Practice has no coin charges or reward earnings. Coin-game entries are spent on start; ending early does not refund them. An interrupted game can be resumed for up to 24 hours.</p>
    </>}
    {(notice || error) && <p className="wallet-notice" role="status">{error || notice}</p>}
  </section>;
}
