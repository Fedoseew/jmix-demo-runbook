import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8' });
const COMMANDS = ['setup', 'check', 'up', 'prepare', 'reset', 'down', 'status', 'logs', 'help'];

test('demo: bash принимает синтаксис', () => {
  const r = run('bash', ['-n', 'demo']);
  assert.equal(r.status, 0, r.stderr);
});

test('demo help перечисляет все подкоманды', () => {
  const r = run('./demo', ['help']);
  assert.equal(r.status, 0, r.stderr);
  const listed = [...r.stdout.matchAll(/^ {2}([a-z]+)\b/gm)].map(m => m[1]);
  assert.deepEqual(listed, COMMANDS);
});

test('demo: неизвестная подкоманда — справка в stderr и код 2', () => {
  const r = run('./demo', ['bogus']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Usage: \.\/demo/);
});

test('demo reset: a или b и -y; чужой аргумент — ошибка, «n» — отмена', () => {
  const bad = run('./demo', ['reset', 'bogus']);
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /reset \[a\|b\] \[-y\]/);
  const no = spawnSync('./demo', ['reset', 'a'], { cwd: root, encoding: 'utf8', input: 'n\n' });
  assert.equal(no.status, 1);
  assert.match(no.stderr, /cancelled/);
});
