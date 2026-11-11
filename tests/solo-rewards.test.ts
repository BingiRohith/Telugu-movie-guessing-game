import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addGame, EMPTY_PROGRESS, newTrophies } from '../lib/solo-rewards.ts';

test('solo points accumulate and each trophy unlocks only when earned', () => {
  const first = addGame(EMPTY_PROGRESS, { mode: 'music', points: 420, correct: 5 });
  assert.deepEqual(newTrophies(EMPTY_PROGRESS, first).map(({ id }) => id), ['first-show', 'perfect-guess']);

  const second = addGame(first, { mode: 'dialogue', points: 500, correct: 5 });
  assert.deepEqual(newTrophies(first, second), []);

  const third = addGame(second, { mode: 'song', points: 80, correct: 1 });
  assert.equal(third.points, 1000);
  assert.deepEqual(newTrophies(second, third).map(({ id }) => id), ['triple-feature', 'cinema-club']);
  assert.equal(EMPTY_PROGRESS.points, 0);
});
