'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AVATARS } from '../lib/profile';
import { useWallet } from '../lib/use-wallet';
import { modeDetails } from '../lib/questions';
import { MODES } from '../lib/rules';
import { TrophyCase } from './trophy-case';

export function ProfilePage() {
  const client = useWallet();
  const { profile, wallet } = client;
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [section, setSection] = useState<'overview' | 'edit'>('overview');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('star');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { setDisplayName(profile?.displayName ?? ''); setAvatar(profile?.avatar ?? 'star'); }, [profile]);
  const selectedAvatar = AVATARS.find(item => item.id === (profile?.avatar ?? 'star')) ?? AVATARS[0];

  async function request(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: object) {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not update your profile. Please retry.');
      setPassword(''); setVisiblePassword(false);
      if (method === 'DELETE') { setAuthMode('login'); setSection('overview'); }
      await client.refresh();
      setNotice(method === 'PATCH' ? 'Your profile has been updated.' : path.endsWith('/credentials') ? 'Your login is ready. Use your username and password next time.' : '');
    } catch (failure) { setError(failure instanceof Error && !(failure instanceof SyntaxError) ? failure.message : 'Could not connect. Please try again.'); }
    finally { setBusy(false); }
  }
  function authenticate(event: FormEvent<HTMLFormElement>, migrating = false) {
    event.preventDefault();
    void request(migrating ? '/api/profile/credentials' : authMode === 'register' ? '/api/profile' : '/api/profile/session', 'POST', { username, password });
  }
  function edit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void request('/api/profile', 'PATCH', { name: displayName, avatar }); }

  const credentials = (migrating = false) => <form className="account-form" onSubmit={event => authenticate(event, migrating)}>
    <fieldset disabled={busy || !client.ready}>
      <label htmlFor="account-username">Username</label>
      <input id="account-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={event => setUsername(event.target.value)} pattern="[A-Za-z0-9_]{3,20}" minLength={3} maxLength={20} required aria-describedby={authMode === 'register' || migrating ? 'username-help' : undefined} />
      {(authMode === 'register' || migrating) && <p id="username-help" className="field-help">3–20 letters, numbers or underscores. Usernames aren’t case-sensitive.</p>}
      <label htmlFor="account-password">Password</label>
      <div className="password-input"><input id="account-password" name="password" type={visiblePassword ? 'text' : 'password'} autoComplete={authMode === 'register' || migrating ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} minLength={10} maxLength={128} required aria-describedby={authMode === 'register' || migrating ? 'password-help' : undefined} /><button className="password-toggle" type="button" aria-label={visiblePassword ? 'Hide password' : 'Show password'} onClick={() => setVisiblePassword(!visiblePassword)}>{visiblePassword ? 'Hide' : 'Show'}</button></div>
      {(authMode === 'register' || migrating) && <p id="password-help" className="field-help">Use 10–128 characters. Spaces and passphrases are welcome.</p>}
      <button className="primary account-submit" type="submit">{busy ? 'Please wait…' : migrating ? 'Save my username & password' : authMode === 'register' ? 'Create account' : 'Sign in'}</button>
    </fieldset>
  </form>;

  return <div className="shell">
    <header className="site-header"><a className="wordmark" href="/"><span className="brand-icon" aria-hidden="true">✦</span>Telugu <strong>Dialogue Battle</strong></a><nav className="header-links" aria-label="Main"><a className="room-link" href="/">Play a game</a><a className="room-link" href="/rewards/">Rewards & coins</a></nav></header>
    <main id="main" className="player-page">
      {!client.ready ? <div className="account-card" role="status">Loading your player profile…</div> : !profile ? <section className="auth-layout">
        <div className="auth-story"><p className="eyebrow">YOUR PLACE IN TELUGU CINEMA</p><h1>Every fan has<br />a <em>story.</em></h1><p>Keep your coins, celebrate your best guesses and make every round count.</p><div className="auth-perks"><span>◉ 100 welcome coins</span><span>✦ Daily rewards & missions</span><span>★ Your own trophy shelf</span></div><a className="room-link" href="/?practice=1">Just exploring? Play free practice →</a></div>
        <div className="account-card"><div className="auth-tabs" aria-label="Account access"><button type="button" aria-pressed={authMode === 'login'} onClick={() => { setAuthMode('login'); setError(''); setPassword(''); }}>Sign in</button><button type="button" aria-pressed={authMode === 'register'} onClick={() => { setAuthMode('register'); setError(''); setPassword(''); }}>Create account</button></div><h2>{authMode === 'login' ? 'Welcome back.' : 'Join the front row.'}</h2><p className="clue">{authMode === 'login' ? 'Your username and password. That’s all you need.' : 'Choose your username and password to get started.'}</p>{credentials()}<p className="field-help">No email or phone number required. Password recovery isn’t available yet, so keep your password safe.</p></div>
      </section> : <>
        <section className="player-hero"><div className="player-identity"><span className="player-avatar" aria-label={selectedAvatar.name}>{selectedAvatar.icon}</span><div><p className="eyebrow">YOUR PLAYER PROFILE</p><h1>{profile.displayName}</h1><p>{profile.username ? '@' + profile.username : 'Set up your username below to keep this profile.'}</p></div></div><div className="player-actions"><a className="primary" href="/">Play a game →</a><button className="secondary" type="button" disabled={busy} onClick={() => void request('/api/profile/session', 'DELETE')}>Sign out</button></div></section>
        {!profile.username && <section className="account-card legacy-login"><p className="eyebrow">ONE QUICK SETUP</p><h2>Choose your new login.</h2><p className="clue">Set a username and password for this profile. Your existing coins, XP, game progress and trophies will stay with you.</p>{credentials(true)}</section>}
        {wallet && <><div className="player-stats"><div><span>Coin balance</span><strong>◉ {wallet.coins}</strong><a className="room-link" href="/rewards/">Rewards & refills</a></div><div><span>Total points</span><strong>{wallet.points.toLocaleString('en-IN')}</strong><small>From coin games</small></div><div><span>Games completed</span><strong>{wallet.gamesCompleted}</strong><small>All three game types</small></div><div><span>Accuracy</span><strong>{wallet.gamesCompleted ? Math.round(wallet.correct / (wallet.gamesCompleted * 5) * 100) : 0}%</strong><small>{wallet.correct} correct answers</small></div></div>
        <section className="player-level"><div><p className="eyebrow">LEVEL {wallet.level}</p><h2>{wallet.level < 3 ? 'Cinema explorer' : wallet.level < 6 ? 'Cinema enthusiast' : 'Cinema champion'}</h2></div><div><p>{wallet.xp} total XP · {250 - wallet.xpInLevel} XP to Level {wallet.level + 1}</p><progress value={wallet.xpInLevel} max={250} aria-label="Player level progress" /></div></section>
        <nav className="profile-sections" aria-label="Profile sections"><button aria-pressed={section === 'overview'} onClick={() => setSection('overview')}>Overview</button><button aria-pressed={section === 'edit'} onClick={() => setSection('edit')}>Edit profile</button></nav>
        {section === 'overview' ? <><section className="account-card"><div className="section-heading"><h2>Your cinema mix</h2><span className="clue">{wallet.daily.streak}-day reward streak</span></div><div className="cinema-mix">{MODES.map(mode => <div key={mode}><span>{modeDetails[mode].icon} {modeDetails[mode].title}</span><progress max={Math.max(1, wallet.gamesCompleted)} value={wallet.progress.games[mode]} aria-label={modeDetails[mode].title + ' completed games'} /><strong>{wallet.progress.games[mode]}</strong></div>)}</div>{!wallet.gamesCompleted && <p className="clue">Complete your first coin game to start building your cinema story.</p>}<a className="room-link" href="/rewards/">View today’s rewards and missions →</a></section><TrophyCase progress={wallet.progress} persistent account /></> : <section className="account-card"><h2>Make it yours.</h2><form className="account-form" onSubmit={edit}><fieldset disabled={busy}><label htmlFor="display-name">Display name</label><input id="display-name" value={displayName} onChange={event => setDisplayName(event.target.value)} minLength={2} maxLength={24} autoComplete="nickname" required /><p className="field-help">This is your player name. Your login username stays the same.</p><legend className="sr-only">Profile details</legend><fieldset className="avatar-picker"><legend>Choose an avatar</legend>{AVATARS.map(item => <label key={item.id} data-selected={avatar === item.id}><input type="radio" className="sr-only" name="avatar" value={item.id} checked={avatar === item.id} onChange={() => setAvatar(item.id)} /><span aria-hidden="true">{item.icon}</span><small>{item.name}</small></label>)}</fieldset><button className="primary account-submit" type="submit">{busy ? 'Saving…' : 'Save profile'}</button></fieldset></form></section>}</>}
      </>}
      {(error || notice || client.error) && <p className="wallet-notice" role={error || client.error ? 'alert' : 'status'}>{error || client.error || notice}</p>}
    </main><footer className="site-footer"><span>Your cinema. Your progress.</span><a className="room-link" href="/">Back to games</a></footer>
  </div>;
}
