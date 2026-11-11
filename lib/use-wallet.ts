'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EconomyAction, EconomyResponse, WalletView } from './economy';
import type { PlayerProfile } from './profile';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const accountId = useRef<string | null>(null);
  const accept = useCallback((data: EconomyResponse & { profile: PlayerProfile }) => {
    const changed = accountId.current !== data.profile.id;
    accountId.current = data.profile.id;
    setWallet(previous => changed || !previous || previous.revision <= data.wallet.revision ? data.wallet : previous);
    setProfile(data.profile);
  }, []);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/economy', { cache: 'no-store' });
      if (response.status === 401) { accountId.current = null; setWallet(null); setProfile(null); return; }
      if (!response.ok) throw new Error('Rewards are unavailable. You can still play free practice.');
      const data = await response.json() as EconomyResponse & { profile: PlayerProfile };
      accept(data);
      setError('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not load rewards.'); }
    finally { setReady(true); }
  }, [accept]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const sync = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [refresh]);
  const update = useCallback(async (action: EconomyAction) => {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/economy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action) });
      const data = await response.json() as EconomyResponse & { profile: PlayerProfile; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not update rewards. Retry safely.');
      accept(data);
      return data;
    } catch (failure) {
      const message = failure instanceof Error && !(failure instanceof SyntaxError) ? failure.message : 'Connection interrupted. Please retry.';
      setError(message); throw new Error(message);
    } finally { setBusy(false); }
  }, [accept]);
  return { wallet, profile, ready, busy, error, update, refresh };
}
export type WalletClient = ReturnType<typeof useWallet>;
