import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { questions } from '../lib/questions.ts';

const base = process.argv[2] ?? 'http://127.0.0.1:8787';
async function call(path, body, session, method = body ? 'POST' : 'GET') {
  const response = await fetch(base + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(session ? { Cookie: session } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
async function account() {
  const username = 'wallet_' + randomUUID().slice(0, 8);
  const password = randomUUID() + '-Wallet!';
  const created = await call('/api/profile', { username, password });
  assert.equal(created.status, 201);
  return { cookie: created.cookie, username, password };
}
const sessions = [];
try {
  assert.equal((await call('/api/economy')).status, 401);
  const user = await account(); sessions.push(user.cookie);
  const initial = await call('/api/economy', undefined, user.cookie);
  assert.equal(initial.data.wallet.coins, 100);
  assert.equal(initial.data.wallet.testCheckout, true);
  const claims = await Promise.all(Array.from({ length: 8 }, () => call('/api/economy', { type: 'daily' }, user.cookie)));
  assert.ok(claims.every(result => result.status === 200 && result.data.wallet.coins === 110));
  const purchaseId = randomUUID();
  const purchases = await Promise.all(Array.from({ length: 8 }, () => call('/api/economy', { type: 'purchase', pack: 'small', requestId: purchaseId, coins: 999999 }, user.cookie)));
  assert.ok(purchases.every(result => result.status === 200 && result.data.wallet.coins === 210));
  assert.equal((await call('/api/economy', { type: 'purchase', pack: 'large', requestId: purchaseId }, user.cookie)).status, 409);
  assert.equal((await call('/api/economy', { type: 'purchase', pack: 'invalid', requestId: randomUUID() }, user.cookie)).status, 400);
  const id = randomUUID();
  const starts = await Promise.all(Array.from({ length: 8 }, () => call('/api/economy', { type: 'start', mode: 'music', pace: 'quick', requestId: id }, user.cookie)));
  assert.ok(starts.every(result => result.status === 200 && result.data.wallet.coins === 200));
  assert.equal(new Set(starts.map(result => result.data.game.id)).size, 1);
  assert.equal((await call('/api/economy', { type: 'start', mode: 'song', pace: 'normal', requestId: randomUUID() }, user.cookie)).status, 409);
  assert.equal((await call('/api/economy', { type: 'answer', gameId: id, round: 0, choice: 0 }, user.cookie)).status, 409);
  const secondSession = await call('/api/profile/session', { username: user.username, password: user.password }); sessions.push(secondSession.cookie);
  assert.equal((await call('/api/economy', undefined, secondSession.cookie)).data.wallet.activeGame.id, id);
  async function finish(game, correct) {
    let result;
    for (let round = 0; round < 5; round++) {
      const ready = await call('/api/economy', { type: 'ready', gameId: game.id, round }, user.cookie);
      assert.equal(ready.status, 200, JSON.stringify(ready.data));
      const replayReady = await call('/api/economy', { type: 'ready', gameId: game.id, round }, secondSession.cookie);
      assert.equal(replayReady.data.game.readyAt, ready.data.game.readyAt);
      const answer = questions[game.mode].find(question => question.id === game.questionIds[round]).answer;
      const action = { type: 'answer', gameId: game.id, round, choice: correct ? answer : (answer + 1) % 4, points: 999999 };
      const repeated = await Promise.all([call('/api/economy', action, user.cookie), call('/api/economy', action, secondSession.cookie)]);
      assert.ok(repeated.every(item => item.status === 200));
      result = repeated[1];
    }
    return result;
  }
  const completed = await finish(starts[0].data.game, true);
  assert.equal(completed.data.wallet.coins, 215);
  assert.equal(completed.data.wallet.xp, 70);
  assert.equal(completed.data.wallet.points, 500);
  assert.equal(completed.data.wallet.activeGame, null);
  assert.equal(completed.data.wallet.progress.perfect, true);
  const missions = await Promise.all(Array.from({ length: 4 }, () => call('/api/economy', { type: 'mission', mission: 'correct-three' }, user.cookie)));
  assert.ok(missions.every(item => item.data.wallet.coins === 220));
  assert.equal((await call('/api/economy', { type: 'mission', mission: 'two-modes' }, user.cookie)).status, 409);
  const secondGame = await call('/api/economy', { type: 'start', mode: 'song', pace: 'normal', requestId: randomUUID() }, user.cookie);
  const secondFinished = await finish(secondGame.data.game, false);
  assert.equal(secondFinished.data.wallet.coins, 210);
  assert.equal(secondFinished.data.wallet.xp, 90);
  await call('/api/economy', { type: 'mission', mission: 'two-games' }, user.cookie);
  const allMissions = await call('/api/economy', { type: 'mission', mission: 'two-modes' }, user.cookie);
  assert.equal(allMissions.data.wallet.coins, 230);
  assert.ok(allMissions.data.wallet.missions.every(mission => mission.claimed));
  const poor = await account(); sessions.push(poor.cookie);
  for (let index = 0; index < 10; index++) {
    const start = await call('/api/economy', { type: 'start', mode: 'dialogue', pace: 'normal', requestId: randomUUID() }, poor.cookie);
    assert.equal(start.status, 200);
    await call('/api/economy', { type: 'abandon', gameId: start.data.game.id }, poor.cookie);
  }
  const denied = await call('/api/economy', { type: 'start', mode: 'music', pace: 'normal', requestId: randomUUID() }, poor.cookie);
  assert.equal(denied.status, 402);
  assert.equal((await call('/api/economy', undefined, poor.cookie)).data.wallet.coins, 0);
  assert.equal((await fetch(base + '/?practice=1')).status, 200);
  const restored = await call('/api/economy', { type: 'daily' }, poor.cookie);
  assert.equal(restored.data.wallet.coins, 10);
  const crossOrigin = await fetch(base + '/api/economy', { method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json', Cookie: poor.cookie }, body: JSON.stringify({ type: 'daily' }) });
  assert.equal(crossOrigin.status, 403);
  console.log('Economy integration passed: welcome, concurrent daily/refill/start/answer/mission retries, channel-independent account sync, server scoring, XP/trophies, zero-balance rejection and reward refill, origin protection.');
} finally {
  for (const cookie of sessions.filter(Boolean)) await call('/api/profile/session', undefined, cookie, 'DELETE');
}
