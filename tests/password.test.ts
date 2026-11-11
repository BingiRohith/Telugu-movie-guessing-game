import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashPassword, verifyPassword, validPassword } from '../lib/password.ts';
import { USERNAME_PATTERN, DISPLAY_NAME_PATTERN } from '../lib/profile.ts';

test('password records are salted, slow hashes; validation preserves password spaces and case', async () => {
  const password = ' Telugu movie fan 2026! ';
  assert.equal(validPassword('short'), false);
  assert.equal(validPassword('x'.repeat(129)), false);
  assert.equal(validPassword(password), true);
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.digest, second.digest);
  assert.equal(first.iterations, 600000);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password.trim(), first), false);
  assert.equal(await verifyPassword(password.toLowerCase(), first), false);
  assert.equal(USERNAME_PATTERN.test('cinema_fan26'), true);
  assert.equal(USERNAME_PATTERN.test('invalid name'), false);
  assert.equal(DISPLAY_NAME_PATTERN.test('తెలుగు అభిమాని'), true);
});
