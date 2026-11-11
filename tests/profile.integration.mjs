import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8787');
async function call(path, method = 'GET', body, session) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (session) headers.Cookie = session;
  const response = await fetch(new URL(path, base), { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, payload: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
const username = 'profile_' + randomUUID().slice(0, 8);
const password = randomUUID() + '-Review!';
const sessions = [];
try {
  assert.equal((await call('/api/profile', 'POST', { username, password: 'short' })).status, 400);
  assert.equal((await call('/api/profile', 'POST', { username: '<script>', password })).status, 400);
  const registrations = await Promise.all([call('/api/profile', 'POST', { username: username.toUpperCase(), password }), call('/api/profile', 'POST', { username, password })]);
  assert.deepEqual(registrations.map(item => item.status).sort(), [201, 409]);
  const created = registrations.find(item => item.status === 201);
  sessions.push(created.cookie);
  assert.equal(created.payload.profile.username, username);
  assert.equal(created.payload.profile.displayName, username);
  assert.equal('key' in created.payload, false);
  assert.equal('password' in created.payload.profile, false);
  assert.equal((await call('/api/profile')).payload.profile, null);
  const originalId = created.payload.profile.id;
  const initialWallet = await call('/api/economy', 'GET', undefined, created.cookie);
  assert.equal(initialWallet.payload.wallet.coins, 100);
  const reward = await call('/api/economy', 'POST', { type: 'daily' }, created.cookie);
  assert.equal(reward.payload.wallet.coins, 110);
  const edited = await call('/api/profile', 'PATCH', { name: 'తెలుగు అభిమాని', avatar: 'headphones' }, created.cookie);
  assert.equal(edited.status, 200);
  assert.equal(edited.payload.profile.id, originalId);
  assert.equal(edited.payload.profile.displayName, 'తెలుగు అభిమాని');
  assert.equal(edited.payload.profile.avatar, 'headphones');
  assert.equal((await call('/api/profile', 'PATCH', { name: '<script>', avatar: 'headphones' }, created.cookie)).status, 400);
  assert.equal((await call('/api/profile', 'PATCH', { name: 'Other', avatar: 'invalid' }, created.cookie)).status, 400);
  assert.equal((await call('/api/profile', 'PATCH', { name: 'Other', avatar: 'star' })).status, 401);
  const badLogin = await call('/api/profile/session', 'POST', { username, password: password + 'x' });
  assert.equal(badLogin.status, 401);
  assert.equal((await call('/api/profile/session', 'POST', { key: originalId + '.old-key' })).status, 401);
  const restored = await call('/api/profile/session', 'POST', { username: username.toUpperCase(), password });
  assert.equal(restored.status, 200);
  sessions.push(restored.cookie);
  assert.equal(restored.payload.profile.id, originalId);
  assert.equal(restored.payload.profile.displayName, 'తెలుగు అభిమాని');
  assert.equal((await call('/api/economy', 'GET', undefined, restored.cookie)).payload.wallet.coins, 110);
  assert.equal((await call('/api/profile/credentials', 'POST', { username: 'another_' + randomUUID().slice(0, 6), password }, restored.cookie)).status, 409);
  await call('/api/profile/session', 'DELETE', undefined, created.cookie);
  assert.equal((await call('/api/profile', 'GET', undefined, created.cookie)).payload.profile, null);
  assert.equal((await call('/api/profile', 'GET', undefined, restored.cookie)).payload.profile.id, originalId);
  const unknown = 'missing_' + randomUUID().slice(0, 8);
  for (let index = 0; index < 8; index++) assert.equal((await call('/api/profile/session', 'POST', { username: unknown, password })).status, 401);
  assert.equal((await call('/api/profile/session', 'POST', { username: unknown, password })).status, 429);
  console.log('Profile integration passed: concurrent username uniqueness, case-insensitive password login, old-key rejection, profile editing, wallet preservation across sessions, validation and login throttling.');
} finally {
  for (const session of sessions.filter(Boolean)) await call('/api/profile/session', 'DELETE', undefined, session);
}
