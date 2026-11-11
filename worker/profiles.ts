import { DurableObject } from 'cloudflare:workers';
import { AVATARS, DISPLAY_NAME_PATTERN, USERNAME_PATTERN, type PlayerProfile } from '../lib/profile.ts';
import { hashPassword, verifyPassword, dummyPasswordCheck, validPassword, type PasswordRecord } from '../lib/password.ts';
import { applyEconomy, EconomyError, newWallet, validAction, type EconomyAction, type WalletRecord } from '../lib/economy.ts';

const COOKIE = 'tdb_session';
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const MAX_SESSIONS = 5;
const CREDENTIAL = /^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})$/;

type Session = { hash: string; expires: number };
type Record = { profile: PlayerProfile; keyHash?: string; password?: PasswordRecord; sessions: Session[] };
type ProfileNamespace = DurableObjectNamespace<ProfileAccount>;

function secret() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function hash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function sameHash(left: string, right: string) {
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

function cookie(request: Request, value: string, seconds: number) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return COOKIE + '=' + value + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + seconds + secure;
}

function sessionParts(request: Request) {
  const value = request.headers.get('Cookie')?.split(';')
    .map((item) => item.trim()).find((item) => item.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  return value ? CREDENTIAL.exec(value) : null;
}

function reply(body: unknown, status = 200, sessionCookie?: string) {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (sessionCookie) headers.set('Set-Cookie', sessionCookie);
  return Response.json(body, { status, headers });
}

export async function signedInProfile(request: Request, profiles: ProfileNamespace) {
  const parts = sessionParts(request);
  if (!parts) return null;
  return profiles.getByName(parts[1]).profileForSession(await hash(parts[2]));
}

export async function profileRequest(request: Request, profiles: ProfileNamespace, path: string) {
  if (path === '/api/profile' && request.method === 'GET') return reply({ profile: await signedInProfile(request, profiles) });
  if (path === '/api/profile/session' && request.method === 'DELETE') {
    const parts = sessionParts(request);
    if (parts) await profiles.getByName(parts[1]).revoke(await hash(parts[2]));
    return reply({ profile: null }, 200, cookie(request, '', 0));
  }
  if (!['POST', 'PATCH'].includes(request.method)) return reply({ error: 'Method not allowed.' }, 405);
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reply({ error: 'Send a JSON request.' }, 415);
  const text = await request.text();
  if (text.length > 2048) return reply({ error: 'Request too large.' }, 413);
  let body: { username?: unknown; password?: unknown; name?: unknown; avatar?: unknown };
  try { body = JSON.parse(text); } catch { return reply({ error: 'Invalid JSON.' }, 400); }
  if (!body || typeof body !== 'object') return reply({ error: 'Invalid request.' }, 400);
  const signedIn = await signedInProfile(request, profiles);
  const parts = sessionParts(request);
  if (request.method === 'PATCH' && path === '/api/profile') {
    if (!signedIn || !parts) return reply({ error: 'Please sign in.' }, 401);
    const displayName = typeof body.name === 'string' ? body.name.trim().normalize('NFC') : '';
    if (!DISPLAY_NAME_PATTERN.test(displayName) || !AVATARS.some(avatar => avatar.id === body.avatar)) return reply({ error: 'Choose an avatar and a display name with 2–24 characters.' }, 400);
    const profile = await profiles.getByName(signedIn.id).updateDetails(await hash(parts[2]), displayName, String(body.avatar));
    return profile ? reply({ profile }) : reply({ error: 'Please sign in again.' }, 401);
  }
  if (request.method !== 'POST' || !['/api/profile', '/api/profile/session', '/api/profile/credentials'].includes(path)) return reply({ error: 'Not found.' }, 404);
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = body.password;
  if (!USERNAME_PATTERN.test(username) || !validPassword(password)) return reply({ error: path === '/api/profile/session' ? 'Incorrect username or password.' : 'Use a username with 3–20 letters, numbers or underscores, and a password with 10–128 characters.' }, path === '/api/profile/session' ? 401 : 400);
  const index = profiles.getByName('username:' + username);
  if (path === '/api/profile/session') {
    if (signedIn) return reply({ error: 'Sign out before switching accounts.' }, 409);
    const session = secret();
    const result = await index.loginByUsername(password, await hash(session));
    if (result.limited) return reply({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
    if (!result.profile) return reply({ error: 'Incorrect username or password.' }, 401);
    return reply({ profile: result.profile }, 200, cookie(request, result.profile.id + '.' + session, SESSION_SECONDS));
  }
  if (path === '/api/profile/credentials') {
    if (!signedIn || !parts) return reply({ error: 'Sign in to your existing profile first.' }, 401);
    if (signedIn.username) return reply({ error: 'Your username and password are already set.' }, 409);
    const profile = await index.claimLogin(signedIn.id, username, await hashPassword(password), await hash(parts[2]));
    return profile ? reply({ profile }) : reply({ error: 'That username is unavailable, or your session has expired. Refresh and try again.' }, 409);
  }
  if (signedIn) return reply({ error: 'Sign out before creating another profile.' }, 409);
  const session = secret();
  const profile: PlayerProfile = { id: crypto.randomUUID(), username, displayName: username, avatar: 'star', createdAt: Date.now() };
  const created = await index.registerUsername(profile, await hashPassword(password), await hash(session));
  if (!created) return reply({ error: 'That username is already taken. Try another.' }, 409);
  return reply({ profile: created }, 201, cookie(request, created.id + '.' + session, SESSION_SECONDS));
}

export async function economyRequest(request: Request, profiles: ProfileNamespace, testCheckout: boolean) {
  const profile = await signedInProfile(request, profiles);
  if (!profile) return reply({ error: 'Create a profile or sign in to use coins and daily rewards.' }, 401);
  let action: EconomyAction = { type: 'view' };
  if (request.method !== 'GET') {
    if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reply({ error: 'Send a JSON request.' }, 415);
    const text = await request.text();
    if (text.length > 2048) return reply({ error: 'Request too large.' }, 413);
    let body: unknown;
    try { body = JSON.parse(text); } catch { return reply({ error: 'Invalid JSON.' }, 400); }
    if (!validAction(body)) return reply({ error: 'Invalid wallet action.' }, 400);
    action = body;
  }
  const result = await profiles.getByName(profile.id).economy(action, testCheckout);
  return result.ok ? reply({ ...result.data, profile }) : reply({ error: result.error }, result.status);
}

export class ProfileAccount extends DurableObject<{ PROFILES: ProfileNamespace }> {
  async registerUsername(profile: PlayerProfile, password: PasswordRecord, sessionHash: string) {
    return this.ctx.blockConcurrencyWhile(async () => {
      if (await this.ctx.storage.get('username-owner')) return null;
      const initialized = await this.env.PROFILES.getByName(profile.id).initializePassword(profile, password, sessionHash);
      if (!initialized) return null;
      await this.ctx.storage.put('username-owner', profile.id);
      return profile;
    });
  }

  async claimLogin(profileId: string, username: string, password: PasswordRecord, sessionHash: string) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const owner = await this.ctx.storage.get<string>('username-owner');
      if (owner && owner !== profileId) return null;
      // Reserve before migration so a retry can recover after a worker restart.
      await this.ctx.storage.put('username-owner', profileId);
      const profile = await this.env.PROFILES.getByName(profileId).configureLogin(username, password, sessionHash);
      if (!profile) {
        if (!owner) await this.ctx.storage.delete('username-owner');
        return null;
      }
      return profile;
    });
  }

  async loginByUsername(password: string, sessionHash: string) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const now = Date.now();
      let failures = await this.ctx.storage.get<{ count: number; since: number }>('login-failures') ?? { count: 0, since: now };
      if (now - failures.since >= 15 * 60000) failures = { count: 0, since: now };
      if (failures.count >= 8) return { profile: null, limited: true };
      const owner = await this.ctx.storage.get<string>('username-owner');
      let profile: PlayerProfile | null = null;
      if (owner) profile = await this.env.PROFILES.getByName(owner).passwordSignIn(password, sessionHash);
      else await dummyPasswordCheck(password);
      await this.ctx.storage.put('login-failures', profile ? { count: 0, since: now } : { count: failures.count + 1, since: failures.since });
      return { profile, limited: false };
    });
  }

  async initializePassword(profile: PlayerProfile, password: PasswordRecord, sessionHash: string) {
    return this.ctx.storage.transaction(async txn => {
      if (await txn.get('account')) return false;
      await txn.put<Record>('account', { profile, password, sessions: [this.session(sessionHash)] });
      return true;
    });
  }

  async configureLogin(username: string, password: PasswordRecord, sessionHash: string) {
    return this.ctx.storage.transaction(async txn => {
      const record = await txn.get<Record>('account');
      if (!record || record.password || !record.sessions.some(session => sameHash(session.hash, sessionHash) && session.expires > Date.now())) return null;
      record.profile = { ...record.profile, username, avatar: record.profile.avatar ?? 'star' };
      record.password = password;
      delete record.keyHash;
      record.sessions = record.sessions.filter(session => sameHash(session.hash, sessionHash));
      await txn.put('account', record);
      return record.profile;
    });
  }

  async passwordSignIn(password: string, sessionHash: string) {
    return this.ctx.storage.transaction(async txn => {
      const record = await txn.get<Record>('account');
      if (!record?.password || !await verifyPassword(password, record.password)) return null;
      record.sessions = [...record.sessions.filter(session => session.expires > Date.now()), this.session(sessionHash)].slice(-MAX_SESSIONS);
      await txn.put('account', record);
      return record.profile;
    });
  }

  async updateDetails(sessionHash: string, displayName: string, avatar: string) {
    return this.ctx.storage.transaction(async txn => {
      const record = await txn.get<Record>('account');
      if (!record || !record.sessions.some(session => sameHash(session.hash, sessionHash) && session.expires > Date.now())) return null;
      record.profile = { ...record.profile, displayName, avatar };
      await txn.put('account', record);
      return record.profile;
    });
  }
  async economy(action: EconomyAction, testCheckout: boolean) {
    try {
      const data = await this.ctx.storage.transaction(async txn => {
        const now = Date.now();
        const wallet = await txn.get<WalletRecord>('wallet:v1') ?? newWallet(now);
        wallet.revision = (wallet.revision ?? 0) + 1;
        const current = applyEconomy(wallet, { type: 'view' }, now, testCheckout);
        const receiptKey = action.type === 'purchase' || action.type === 'start' ? 'wallet-receipt:' + action.requestId : null;
        if (receiptKey) {
          const receipt = await txn.get<string>(receiptKey);
          if (receipt) {
            if (receipt !== JSON.stringify(action)) throw new EconomyError('This request ID was already used for a different action.', 409);
            const game = action.type === 'start' ? wallet.games.find(item => item.id === action.requestId) : undefined;
            if (action.type === 'start' && !game) throw new EconomyError('This older game has ended. Start a new game.', 409);
            await txn.put('wallet:v1', wallet);
            return { ...current, game };
          }
        }
        const result = applyEconomy(wallet, action, now, testCheckout);
        await txn.put('wallet:v1', wallet);
        if (receiptKey) await txn.put(receiptKey, JSON.stringify(action));
        return result;
      });
      return { ok: true as const, data };
    } catch (error) {
      if (error instanceof EconomyError) return { ok: false as const, status: error.status, error: error.message };
      throw error;
    }
  }

  async profileForSession(sessionHash: string) {
    const record = await this.ctx.storage.get<Record>('account');
    return record?.sessions.some((session) => sameHash(sessionHash, session.hash) && session.expires > Date.now())
      ? record.profile : null;
  }

  async revoke(sessionHash: string) {
    await this.ctx.storage.transaction(async (txn) => {
      const record = await txn.get<Record>('account');
      if (!record) return;
      record.sessions = record.sessions.filter((session) => !sameHash(sessionHash, session.hash));
      await txn.put('account', record);
    });
  }

  private session(sessionHash: string) {
    return { hash: sessionHash, expires: Date.now() + SESSION_SECONDS * 1000 };
  }
}
