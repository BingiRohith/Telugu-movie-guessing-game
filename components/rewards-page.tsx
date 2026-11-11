'use client';
import { useWallet } from '../lib/use-wallet';
import { WalletPanel } from './wallet-panel';
import { TrophyCase } from './trophy-case';

export function RewardsPage() {
  const client = useWallet();
  return <div className="shell"><header className="site-header"><a className="wordmark" href="/">✦ Telugu <strong>Dialogue Battle</strong></a><nav className="header-links"><a className="room-link" href="/">Play a game</a><a className="room-link" href="/profile/">Player profile</a></nav></header><main id="main"><section className="rewards-hero"><p className="eyebrow">A LITTLE MORE CINEMA, EVERY DAY</p><h1>Your daily encore.</h1><p>Collect coins, complete missions and grow your cinema streak.</p></section><WalletPanel client={client} />{client.wallet && <TrophyCase progress={client.wallet.progress} persistent account />}</main><footer className="site-footer"><span>Rewards reset at midnight IST</span><a className="room-link" href="/">Back to games</a></footer></div>;
}
