import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScript } from './load.mjs';

const { Runbook } = loadScript('app.js');
// Объекты из node:vm живут в другом realm: deepStrictEqual сравнивает прототипы,
// поэтому перед сравнением с литералом переводим значение в обычный объект.
const plain = v => JSON.parse(JSON.stringify(v));

test('clampIndex держит индекс в границах', () => {
  assert.equal(Runbook.clampIndex(7, 6), 5);
  assert.equal(Runbook.clampIndex(-1, 6), 0);
  assert.equal(Runbook.clampIndex(3, 6), 3);
  assert.equal(Runbook.clampIndex(0, 0), 0);
});

test('defaultState — демо A, блок 0, заметки скрыты, таймер стоит', () => {
  const s = Runbook.defaultState();
  assert.deepEqual(plain(s), {
    demo: 'a', index: 0, notes: false,
    timer: { running: false, startedAt: null, elapsedBefore: 0 },
    elapsed: {},
  });
});

test('loadState возвращает дефолт, если storage бросает или пуст или битый', () => {
  const throwing = { getItem() { throw new Error('denied'); } };
  assert.deepEqual(Runbook.loadState(throwing), Runbook.defaultState());
  assert.deepEqual(Runbook.loadState({ getItem: () => null }), Runbook.defaultState());
  assert.deepEqual(Runbook.loadState({ getItem: () => '{oops' }), Runbook.defaultState());
});

test('loadState дополняет частично сохранённое состояние дефолтами', () => {
  const s = Runbook.loadState({ getItem: () => JSON.stringify({ demo: 'b', index: 2 }) });
  assert.equal(s.demo, 'b');
  assert.equal(s.index, 2);
  assert.equal(s.notes, false);
  assert.deepEqual(plain(s.timer), { running: false, startedAt: null, elapsedBefore: 0 });
});

test('saveState пишет JSON под ключом и молчит при ошибке', () => {
  const written = {};
  Runbook.saveState({ setItem: (k, v) => { written[k] = v; } }, Runbook.defaultState());
  assert.equal(Object.keys(written)[0], 'jmix-runbook/v1');
  assert.deepEqual(JSON.parse(written['jmix-runbook/v1']), plain(Runbook.defaultState()));
  assert.doesNotThrow(() => Runbook.saveState({ setItem() { throw new Error('full'); } }, Runbook.defaultState()));
});

test('shouldHandleKey — false для полей ввода, true для остального', () => {
  assert.equal(Runbook.shouldHandleKey({ target: { tagName: 'INPUT' } }), false);
  assert.equal(Runbook.shouldHandleKey({ target: { tagName: 'TEXTAREA' } }), false);
  assert.equal(Runbook.shouldHandleKey({ target: { tagName: 'BUTTON' } }), true);
  assert.equal(Runbook.shouldHandleKey({ target: { tagName: 'BODY' } }), true);
  assert.equal(Runbook.shouldHandleKey({}), true);
});

test('totals считает ядро и всё, игнорируя pre', () => {
  const blocks = [
    { id: 'p', minutes: 0, pre: true },
    { id: 'x', minutes: 10 },
    { id: 'y', minutes: 5, optional: true },
  ];
  assert.deepEqual(plain(Runbook.totals(blocks)), { core: 10, all: 15 });
});

test('actionLabel даёт русские подписи типам действий', () => {
  assert.equal(Runbook.actionLabel('shell'), 'терминал');
  assert.equal(Runbook.actionLabel('git'), 'git');
  assert.equal(Runbook.actionLabel('url'), 'ссылка');
  assert.equal(Runbook.actionLabel('studio'), 'Studio');
  assert.equal(Runbook.actionLabel('say'), 'сказать');
  assert.equal(Runbook.actionLabel('zzz'), 'zzz');
});

test('copyText возвращает true при успехе и false, если clipboard нет или бросает', async () => {
  let got = null;
  assert.equal(await Runbook.copyText('abc', { writeText: async t => { got = t; } }), true);
  assert.equal(got, 'abc');
  assert.equal(await Runbook.copyText('abc', { writeText: async () => { throw new Error('denied'); } }), false);
  assert.equal(await Runbook.copyText('abc', undefined), false);
});

test('fmt форматирует секунды как mm:ss со знаком', () => {
  assert.equal(Runbook.fmt(0), '00:00');
  assert.equal(Runbook.fmt(65), '01:05');
  assert.equal(Runbook.fmt(-80), '-01:20');
  assert.equal(Runbook.fmt(3600), '60:00');
});

test('fmt не печатает «-00:00», если значение округляется до нуля', () => {
  assert.equal(Runbook.fmt(-0.4), '00:00');
  assert.equal(Runbook.fmt(-0), '00:00');
  assert.equal(Runbook.fmt(-0.6), '-00:01');
});

test('elapsedNow учитывает время с startedAt, даже если вкладка была закрыта', () => {
  const t = { running: true, startedAt: 1_000_000, elapsedBefore: 30 };
  assert.equal(Runbook.elapsedNow(t, 1_000_000 + 90_000), 120);
  assert.equal(Runbook.elapsedNow({ running: false, startedAt: null, elapsedBefore: 30 }, 5_000_000), 30);
});

test('remaining — план минус факт, 0 для pre-блока без времени', () => {
  assert.equal(Runbook.remaining(10, 0), 600);
  assert.equal(Runbook.remaining(10, 660), -60);
  assert.equal(Runbook.remaining(0, 0), 0);
});

test('factTotal суммирует факт блоков демо, для текущего — живое время таймера', () => {
  const blocks = [{ id: 'x' }, { id: 'y' }];
  const elapsed = { x: 60, y: 30, Z: 999 };
  assert.equal(Runbook.factTotal(blocks, elapsed, 'y', 90), 150);
  assert.equal(Runbook.factTotal(blocks, elapsed, 'y', 0), 60);
  assert.equal(Runbook.factTotal(blocks, {}, 'x', 12), 12);
});

test('toggleFullscreen не роняет промис, если браузер отказал или API нет', async () => {
  const rejecting = {
    fullscreenElement: null,
    documentElement: { requestFullscreen: () => Promise.reject(new Error('denied')) },
  };
  assert.equal(await Runbook.toggleFullscreen(rejecting), false);
  const exitRejecting = { fullscreenElement: {}, exitFullscreen: () => Promise.reject(new Error('nope')) };
  assert.equal(await Runbook.toggleFullscreen(exitRejecting), false);
  assert.equal(await Runbook.toggleFullscreen({ fullscreenElement: null, documentElement: {} }), false);
  let entered = false;
  const ok = { fullscreenElement: null, documentElement: { requestFullscreen: async () => { entered = true; } } };
  assert.equal(await Runbook.toggleFullscreen(ok), true);
  assert.ok(entered);
});

test('loadState отбрасывает значения таймера и факта с неверными типами', () => {
  const stored = {
    timer: { running: true, startedAt: 'вчера', elapsedBefore: '12' },
    elapsed: { A0: '12', A1: 30, A2: null, A3: NaN },
  };
  const s = Runbook.loadState({ getItem: () => JSON.stringify(stored) });
  assert.deepEqual(plain(s.timer), { running: false, startedAt: null, elapsedBefore: 0 });
  assert.deepEqual(plain(s.elapsed), { A1: 30 });
  assert.equal(Runbook.elapsedNow(s.timer, Date.now()), 0);
});

test('loadState сохраняет корректно запущенный таймер', () => {
  const timer = { running: true, startedAt: 1_000_000, elapsedBefore: 42 };
  const s = Runbook.loadState({ getItem: () => JSON.stringify({ timer }) });
  assert.deepEqual(plain(s.timer), timer);
});

test('без DEMOS (content.js не загрузился) страница пишет причину, а не падает', () => {
  let onReady = null;
  const body = { textContent: '' };
  const document = { body, addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') onReady = fn; } };
  loadScript('app.js', { document });
  assert.doesNotThrow(() => onReady());
  assert.match(body.textContent, /content\.js/);
});
