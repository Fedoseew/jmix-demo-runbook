import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScripts } from './load.mjs';

test('без DEMOS (content.js не загрузился) страница пишет причину, а не падает', () => {
  let onReady = null;
  const body = { textContent: '' };
  const document = { body, addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') onReady = fn; } };
  loadScripts(['core.js', 'app.js'], { document, location: { search: '' } });
  assert.doesNotThrow(() => onReady());
  assert.match(body.textContent, /content\.js/);
});

test('без Runbook (core.js не загрузился или упал в старом браузере) страница пишет причину', () => {
  let onReady = null;
  const body = { textContent: '' };
  const document = { body, addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') onReady = fn; } };
  loadScripts(['app.js'], { document, location: { search: '' }, DEMOS: { a: {}, b: {} } });
  assert.doesNotThrow(() => onReady());
  assert.match(body.textContent, /core\.js/);
});
