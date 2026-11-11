import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyEconomy, dayKey, newWallet, walletView } from '../lib/economy.ts';
import { questions } from '../lib/questions.ts';

const morning = Date.parse('2026-11-11T03:00:00Z');
function complete(wallet: ReturnType<typeof newWallet>, mode: 'music' | 'song', now: number, perfect = true) {
  const id = crypto.randomUUID();
  const game = applyEconomy(wallet, { type: 'start', mode, pace: 'quick', requestId: id }, now).game!;
  for (let round = 0; round < 5; round++) {
    const time = now + round * 12000;
    applyEconomy(wallet, { type: 'ready', gameId: id, round }, time);
    const question = questions[mode].find(item => item.id === game.questionIds[round])!;
    applyEconomy(wallet, { type: 'answer', gameId: id, round, choice: perfect ? question.answer : (question.answer + 1) % 4 }, time + 1000);
  }
  return game;
}

test('daily rewards use midnight IST, survive missed days, and cannot be double claimed', () => {
  const wallet = newWallet(morning);
  assert.equal(wallet.coins, 100);
  applyEconomy(wallet, { type: 'daily' }, morning);
  applyEconomy(wallet, { type: 'daily' }, morning + 1000);
  assert.equal(wallet.coins, 110);
  assert.equal(wallet.dailyClaims, 1);
  const nextDay = Date.parse('2026-11-11T18:30:00Z');
  assert.equal(dayKey(nextDay - 1), '2026-11-11');
  assert.equal(dayKey(nextDay), '2026-11-12');
  applyEconomy(wallet, { type: 'daily' }, nextDay);
  assert.equal(wallet.coins, 125);
  assert.equal(wallet.dailyStreak, 2);
  applyEconomy(wallet, { type: 'daily' }, nextDay + 3 * 86400000);
  assert.equal(wallet.coins, 140);
  assert.equal(wallet.dailyStreak, 1);
  assert.equal(wallet.dailyClaims, 3);
  assert.equal(walletView(wallet, nextDay + 3 * 86400000, false).daily.index, 3);
});

test('server scoring commits game rewards once, mission claims once, and advances XP and trophies', () => {
  const wallet = newWallet(morning);
  const game = complete(wallet, 'music', morning);
  assert.equal(wallet.coins, 105); // -10 entry +10 first game +5 perfect
  assert.equal(wallet.xp, 70);
  assert.equal(wallet.points, 500);
  assert.equal(wallet.progress.perfect, true);
  assert.equal(wallet.day.correct, 5);
  applyEconomy(wallet, { type: 'answer', gameId: game.id, round: 4, choice: 0 }, morning + 60000);
  assert.equal(wallet.xp, 70);
  assert.equal(wallet.coins, 105);
  applyEconomy(wallet, { type: 'mission', mission: 'correct-three' }, morning + 61000);
  applyEconomy(wallet, { type: 'mission', mission: 'correct-three' }, morning + 62000);
  assert.equal(wallet.coins, 110);
  assert.throws(() => applyEconomy(wallet, { type: 'mission', mission: 'two-modes' }, morning + 63000), /Complete this mission/);
  complete(wallet, 'song', morning + 100000, false);
  assert.equal(wallet.coins, 100);
  assert.equal(wallet.xp, 90);
  applyEconomy(wallet, { type: 'mission', mission: 'two-modes' }, morning + 200000);
  applyEconomy(wallet, { type: 'mission', mission: 'two-games' }, morning + 200000);
  assert.equal(wallet.coins, 120);
});

test('entry costs, resume, deadline, abandonment and disabled checkout are enforced', () => {
  const wallet = newWallet(morning);
  wallet.coins = 0;
  assert.throws(() => applyEconomy(wallet, { type: 'start', mode: 'music', pace: 'quick', requestId: crypto.randomUUID() }, morning), /need 10 coins/);
  assert.throws(() => applyEconomy(wallet, { type: 'purchase', pack: 'small', requestId: crypto.randomUUID() }, morning), /not enabled/);
  assert.equal(wallet.coins, 0);
  applyEconomy(wallet, { type: 'purchase', pack: 'small', requestId: crypto.randomUUID() }, morning, true);
  const id = crypto.randomUUID();
  const action = { type: 'start' as const, mode: 'music' as const, pace: 'quick' as const, requestId: id };
  const game = applyEconomy(wallet, action, morning).game!;
  applyEconomy(wallet, action, morning + 1);
  assert.equal(wallet.coins, 90);
  assert.throws(() => applyEconomy(wallet, { ...action, requestId: crypto.randomUUID() }, morning), /unfinished/);
  assert.throws(() => applyEconomy(wallet, { type: 'answer', gameId: id, round: 0, choice: 0 }, morning), /timer first/);
  applyEconomy(wallet, { type: 'ready', gameId: id, round: 0 }, morning);
  applyEconomy(wallet, { type: 'ready', gameId: id, round: 0 }, morning + 3000);
  assert.equal(game.readyAt, morning);
  const answer = questions.music.find(item => item.id === game.questionIds[0])!.answer;
  applyEconomy(wallet, { type: 'answer', gameId: id, round: 0, choice: answer }, morning + 10000);
  assert.deepEqual(game.answers[0], { questionId: game.questionIds[0], choice: null, points: 0 });
  applyEconomy(wallet, { type: 'abandon', gameId: id }, morning + 11000);
  assert.equal(wallet.coins, 90);
  assert.equal(wallet.xp, 0);
  assert.equal(walletView(wallet, morning, false).activeGame, null);
});

test('an unfinished game expires after 24 hours and daily mission progress resets', () => {
  const wallet = newWallet(morning);
  complete(wallet, 'song', morning);
  const id = crypto.randomUUID();
  applyEconomy(wallet, { type: 'start', mode: 'music', pace: 'normal', requestId: id }, morning + 100000);
  const result = applyEconomy(wallet, { type: 'view' }, morning + 2 * 86400000);
  assert.equal(result.wallet.activeGame, null);
  assert.ok(result.wallet.missions.every(mission => mission.progress === 0 && !mission.claimed));
  assert.equal(result.wallet.gamesCompleted, 1);
  assert.equal(result.wallet.progress.games.song, 1);
});

test('the seven-claim calendar cycles and XP advances levels without spending coins', () => {
  const wallet = newWallet(morning);
  for (let index = 0; index < 7; index++) applyEconomy(wallet, { type: 'daily' }, morning + index * 86400000);
  assert.equal(wallet.coins, 235);
  assert.equal(walletView(wallet, morning + 7 * 86400000, false).daily.index, 0);
  assert.equal(wallet.dailyStreak, 7);
  for (let index = 0; index < 4; index++) complete(wallet, 'music', morning + 7 * 86400000 + index * 100000);
  const view = walletView(wallet, morning + 7 * 86400000 + 500000, false);
  assert.equal(view.xp, 280);
  assert.equal(view.level, 2);
  assert.equal(view.xpInLevel, 30);
});
