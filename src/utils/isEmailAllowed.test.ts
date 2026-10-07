import { test } from 'node:test';
import assert from 'node:assert';
import { isEmailAllowed } from './auth';

test('isEmailAllowed', () => {
  // admin email
  assert.strictEqual(isEmailAllowed('devilknight2534@gmail.com', true), true);
  
  // admin email (custom via env)
  assert.strictEqual(isEmailAllowed('admin@example.com', true, 'admin@example.com,other@example.com'), true);
  assert.strictEqual(isEmailAllowed('devilknight2534@gmail.com', true, 'admin@example.com'), false); // if overridden, default is lost unless specified

  // college email
  assert.strictEqual(isEmailAllowed('student@mite.ac.in', true), true);
  assert.strictEqual(isEmailAllowed('director@mite.ac.in', true), true);

  // uppercase variants
  assert.strictEqual(isEmailAllowed('Devilknight2534@Gmail.com', true), true);
  assert.strictEqual(isEmailAllowed('STUDENT@MITE.AC.IN', true), true);

  // lookalike domains
  assert.strictEqual(isEmailAllowed('devilknight2534@gmail.com.evil.com', true), false);
  assert.strictEqual(isEmailAllowed('student@mite.ac.in.org', true), false);
  assert.strictEqual(isEmailAllowed('student@fakemite.ac.in', true), false);
  
  // other gmail
  assert.strictEqual(isEmailAllowed('karthikprabhu2534@gmail.com', true), false);

  // unverified email
  assert.strictEqual(isEmailAllowed('student@mite.ac.in', false), false);
  assert.strictEqual(isEmailAllowed('devilknight2534@gmail.com', false), false);
});
