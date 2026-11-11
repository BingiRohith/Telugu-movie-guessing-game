import assert from 'node:assert/strict';
import { test } from 'node:test';
import { questions, selectQuestions } from '../lib/questions.ts';
import { MODES, PACES, ROUND_COUNT, pointsForAnswer } from '../lib/rules.ts';

test('both paces award the same relative speed bands and reject the deadline', () => {
  assert.deepEqual(PACES, { normal: 20, quick: 10 });
  for (const pace of ['normal', 'quick'] as const) {
    const limit = PACES[pace] * 1000;
    assert.equal(pointsForAnswer(true, 0, pace), 100);
    assert.equal(pointsForAnswer(true, limit / 3, pace), 100);
    assert.equal(pointsForAnswer(true, limit / 3 + 1, pace), 80);
    assert.equal(pointsForAnswer(true, limit * 2 / 3, pace), 80);
    assert.equal(pointsForAnswer(true, limit * 2 / 3 + 1, pace), 60);
    assert.equal(pointsForAnswer(true, limit - 1, pace), 60);
    assert.equal(pointsForAnswer(true, limit, pace), 0);
    assert.equal(pointsForAnswer(true, -1, pace), 0);
    assert.equal(pointsForAnswer(false, 0, pace), 0);
  }
});

test('cinema catalog contains modern publisher sources and five distinct questions per game', () => {
  const ids = new Set<string>();
  for (const mode of MODES) {
    assert.ok(questions[mode].length >= ROUND_COUNT);
    for (const question of questions[mode]) {
      assert.ok(!ids.has(question.id));
      ids.add(question.id);
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(question.options[question.answer]);
      assert.ok(question.clue);
      assert.match(question.clip.videoId, /^[\w-]{11}$/);
      assert.equal(question.clip.source, 'https://www.youtube.com/watch?v=' + question.clip.videoId);
      assert.ok(question.year >= 2000 && question.year <= 2026);
      assert.ok(question.film && question.clip.credit && question.clip.title);
    }
    const selected = selectQuestions(mode, () => 0.25);
    assert.equal(selected.length, ROUND_COUNT);
    assert.equal(new Set(selected.map(question => question.id)).size, ROUND_COUNT);
    assert.ok(selected.every(question => questions[mode].includes(question)));
  }
  assert.ok(Object.values(questions).flat().some(q => q.year === 2000));
  assert.ok(Object.values(questions).flat().some(q => q.year === 2026));
});
