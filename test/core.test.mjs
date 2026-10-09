import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScript, readText } from './load.mjs';

const { Runbook } = loadScript('core.js');
// Объекты из node:vm живут в другом realm: deepStrictEqual сравнивает прототипы,
// поэтому перед сравнением с литералом переводим значение в обычный объект.
const plain = v => JSON.parse(JSON.stringify(v));

test('clampIndex держит индекс в границах', () => {
  assert.equal(Runbook.clampIndex(7, 6), 5);
  assert.equal(Runbook.clampIndex(-1, 6), 0);
  assert.equal(Runbook.clampIndex(3, 6), 3);
  assert.equal(Runbook.clampIndex(0, 0), 0);
});

test('defaultState — демо A, блок 0, шагов и флагов нет', () => {
  assert.deepEqual(plain(Runbook.defaultState()), {
    demo: 'a', index: 0, steps: {}, short: false, light: false, indexByDemo: {},
  });
});

test('loadState возвращает дефолт, если storage бросает или пуст или битый', () => {
  const throwing = { getItem() { throw new Error('denied'); } };
  assert.deepEqual(Runbook.loadState(throwing), Runbook.defaultState());
  assert.deepEqual(Runbook.loadState({ getItem: () => null }), Runbook.defaultState());
  assert.deepEqual(Runbook.loadState({ getItem: () => '{oops' }), Runbook.defaultState());
});

test('loadState дополняет частично сохранённое состояние дефолтами', () => {
  const s = Runbook.loadState({ getItem: () => JSON.stringify({ demo: 'b', index: 2, notes: true }) });
  assert.equal(s.demo, 'b');
  assert.equal(s.index, 2);
  assert.deepEqual(plain(s.steps), {});
  assert.equal(s.short, false);
  assert.equal(s.light, false);
  assert.deepEqual(plain(s.indexByDemo), {});
  assert.equal('notes' in s, false);
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

test('actionLabel даёт подписи типам шагов, включая промпт', () => {
  assert.equal(Runbook.actionLabel('shell'), 'Терминал');
  assert.equal(Runbook.actionLabel('git'), 'Git');
  assert.equal(Runbook.actionLabel('url'), 'Ссылка');
  assert.equal(Runbook.actionLabel('studio'), 'Studio');
  assert.equal(Runbook.actionLabel('say'), 'Сказать');
  assert.equal(Runbook.actionLabel('prompt'), 'Промпт');
  assert.equal(Runbook.actionLabel('zzz'), 'zzz');
});

test('copyText возвращает true при успехе и false, если clipboard нет или бросает', async () => {
  let got = null;
  assert.equal(await Runbook.copyText('abc', { writeText: async t => { got = t; } }), true);
  assert.equal(got, 'abc');
  assert.equal(await Runbook.copyText('abc', { writeText: async () => { throw new Error('denied'); } }), false);
  assert.equal(await Runbook.copyText('abc', undefined), false);
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

test('loadState читает состояние времён таймера: timer и elapsed отбрасываются, остальное на месте', () => {
  const stored = {
    demo: 'a', index: 6, steps: { A4: 3 }, short: true, light: false, indexByDemo: { b: 2 },
    timer: { running: true, startedAt: 1_000_000, elapsedBefore: 42 },
    elapsed: { A0: 300, A1: 610 },
  };
  const s = Runbook.loadState({ getItem: () => JSON.stringify(stored) });
  assert.deepEqual(plain(s), { demo: 'a', index: 6, steps: { A4: 3 }, short: true, light: false, indexByDemo: { b: 2 } });
  const broken = Runbook.loadState({ getItem: () => JSON.stringify({ index: 2, timer: 'вчера', elapsed: [1, 2] }) });
  assert.deepEqual(plain(broken), { ...plain(Runbook.defaultState()), index: 2 });
});

test('loadState принимает шаги только как неотрицательные целые, флаги только true', () => {
  const s = Runbook.loadState({ getItem: () => JSON.stringify({
    steps: { A4: 3, A5: -1, A6: 2.5, A7: '4' }, short: 'yes', light: true,
  }) });
  assert.deepEqual(plain(s.steps), { A4: 3 });
  assert.equal(s.short, false);
  assert.equal(s.light, true);
  assert.deepEqual(Runbook.loadState({ getItem: () => 'null' }), Runbook.defaultState());
});

test('шрифт тезисов сцены не мельче 28px при ширине 1280', () => {
  assert.ok(Runbook.STAGE_FONT_MIN_CQW * 12.8 >= 28);
});

test('isCopyable: терминал, git, ссылка и промпт копируются, остальное нет', () => {
  for (const k of ['shell', 'git', 'url', 'prompt']) assert.equal(Runbook.isCopyable(k), true, k);
  for (const k of ['studio', 'say']) assert.equal(Runbook.isCopyable(k), false, k);
});

test('esc и typo: экранирование и неразрывные пробелы для сцены', () => {
  assert.equal(Runbook.esc('<a href="x">\'&'), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  assert.equal(Runbook.typo('Вопрос — ответ'), 'Вопрос — ответ');
  assert.equal(Runbook.typo('JPQL → ответ'), 'JPQL → ответ');
  assert.equal(Runbook.typo('данные в базе'), 'данные в базе');
  assert.equal(Runbook.typo('<b>'), '&lt;b&gt;');
});

test('splitLead берёт кратчайший законченный кусок не длиннее лимита', () => {
  assert.deepEqual(plain(Runbook.splitLead('Состояние до блока. Стенд запущен.')), ['Состояние до блока.', ' Стенд запущен.']);
  assert.deepEqual(plain(Runbook.splitLead('Где смотреть JPQL: в логе. Дальше')), ['Где смотреть JPQL:', ' в логе. Дальше']);
  assert.deepEqual(plain(Runbook.splitLead('Порядок (12 мин. детали) дальше. Ещё')), ['Порядок (12 мин. детали)', ' дальше. Ещё']);
  const long = 'а'.repeat(80) + '. Хвост';
  assert.deepEqual(plain(Runbook.splitLead(long)), ['', long]);
});

test('classifyActions: промпты после вводной строки, метка [8] и её наследование', () => {
  const steps = Runbook.classifyActions([
    { kind: 'studio', text: '[8] Шаг 1. AI-чат → вставить промпт из следующей строки → отправить' },
    { kind: 'studio', text: 'Создай сущность Сделка' },
    { kind: 'shell', text: 'ls -la' },
    { kind: 'studio', text: 'Шаг 2. вставить два промпта из следующих строк' },
    { kind: 'studio', text: 'Промпт 1' },
    { kind: 'studio', text: 'Промпт 2' },
    { kind: 'studio', text: 'Обычный шаг' },
  ]);
  assert.deepEqual(steps.map(s => s.kind), ['studio', 'prompt', 'shell', 'studio', 'prompt', 'prompt', 'studio']);
  assert.deepEqual(steps.map(s => s.short), [true, true, false, false, false, false, false]);
  assert.equal(steps[0].text, 'Шаг 1. AI-чат → вставить промпт из следующей строки → отправить');
  assert.equal(Runbook.hasShort(steps), true);
  assert.equal(Runbook.hasShort(steps.slice(2)), false);
});

test('nextStep: границы и пропуск шагов вне короткой версии', () => {
  const list = [{ short: true }, { short: false }, { short: false }, { short: true }, { short: false }];
  assert.equal(Runbook.nextStep(list, 0, 1, false), 1);
  assert.equal(Runbook.nextStep(list, 4, 1, false), 4);
  assert.equal(Runbook.nextStep(list, 0, -1, false), 0);
  assert.equal(Runbook.nextStep(list, 0, 1, true), 3);
  assert.equal(Runbook.nextStep(list, 3, 1, true), 3);
  assert.equal(Runbook.nextStep(list, 3, -1, true), 0);
});

test('stepOf читает шаг блока и держит его в границах', () => {
  const s = { steps: { A4: 3, A6: 99 } };
  assert.equal(Runbook.stepOf(s, 'A4', 15), 3);
  assert.equal(Runbook.stepOf(s, 'A5', 9), 0);
  assert.equal(Runbook.stepOf(s, 'A6', 32), 31);
});

test('agenda размечает пройденные, текущий и будущие блоки, опциональные и точки выхода', () => {
  const blocks = [{ id: 'p', pre: true, minutes: 0, title: 'P' }, { id: 'x', minutes: 10, title: 'X', exit: 'выход' }, { id: 'y', minutes: 5, optional: true, title: 'Y' }];
  const a = Runbook.agenda(blocks, 1);
  assert.deepEqual(a.map(i => i.state), ['done', 'cur', 'todo']);
  assert.equal(a[0].pre, true);
  assert.equal(a[1].exit, 'выход');
  assert.equal(a[1].minutes, 10);
  assert.equal(a[2].exit, null);
  assert.equal(a[2].optional, true);
});

test('syncChanges различает смену блока и шага', () => {
  const base = Runbook.defaultState();
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base, index: 2 })), { full: true, steps: false });
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base, light: true })), { full: true, steps: false });
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base, steps: { A4: 2 } })), { full: false, steps: true });
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base, short: true })), { full: false, steps: true });
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base })), { full: false, steps: false });
});

test('resetRehearsal: шаги, короткая версия и позиции демо — с начала; демо, блок и тема остаются; вход не меняется', () => {
  const before = { demo: 'b', index: 0, steps: { A4: 3, B2: 5 }, short: true, light: true, indexByDemo: { a: 6, b: 0 } };
  const snapshot = JSON.stringify(before);
  const after = Runbook.resetRehearsal(before);
  assert.deepEqual(plain(after), { demo: 'b', index: 0, steps: {}, short: false, light: true, indexByDemo: {} });
  assert.notEqual(after, before);
  assert.equal(JSON.stringify(before), snapshot);
  assert.deepEqual(plain(Runbook.syncChanges(before, after)), { full: false, steps: true });
  assert.equal(Runbook.resetRehearsal({ ...before, light: false }).light, false);
});

test('viewOf: консоль только по ?view=console', () => {
  assert.equal(Runbook.viewOf('?view=console'), 'console');
  assert.equal(Runbook.viewOf('?demo=b&view=console'), 'console');
  assert.equal(Runbook.viewOf(''), 'stage');
  assert.equal(Runbook.viewOf('?view=presenter'), 'stage');
  assert.equal(Runbook.viewOf('?view=consoles'), 'stage');
});

test('loadState: позиция по демо — только a/b и неотрицательные целые', () => {
  const s = Runbook.loadState({ getItem: () => JSON.stringify({ indexByDemo: { a: 3, b: -1, c: 2 } }) });
  assert.deepEqual(plain(s.indexByDemo), { a: 3 });
  const t = Runbook.loadState({ getItem: () => JSON.stringify({ indexByDemo: { b: 4.5, a: '2' } }) });
  assert.deepEqual(plain(t.indexByDemo), {});
});

test('typo: цепочка коротких слов держится вместе', () => {
  assert.equal(Runbook.typo('и в доме'), 'и\u00a0в\u00a0доме');
  assert.equal(Runbook.typo('(в базе)'), '(в\u00a0базе)');
  assert.equal(Runbook.typo('дом и в нём'), 'дом и\u00a0в\u00a0нём');
});

test('core.js без lookbehind: Safari до 16.4 не должен терять весь файл', () => {
  assert.ok(!/\(\?<[=!]/.test(readText('core.js')), 'в core.js есть lookbehind');
});

test('typo: слово через дефис не рвётся на строке', () => {
  assert.equal(Runbook.typo('новой CRM-системы'), 'новой <span class="nw">CRM-системы</span>');
  assert.equal(Runbook.typo('в ИИ-сгенерированный JPQL'), 'в\u00a0<span class="nw">ИИ-сгенерированный</span> JPQL');
  assert.equal(Runbook.typo('2 — 3'), '2\u00a0— 3');
});

test('splitLead: короткое первое предложение длинного абзаца становится лидом (C12)', () => {
  const long = 'x'.repeat(400);
  assert.equal(Runbook.splitLead(`Контроль времени. На 7-й минуте ${long}`)[0], 'Контроль времени.');
  assert.equal(Runbook.splitLead(`Инспекции, каждый раз Undo. ${long}`)[0], 'Инспекции, каждый раз Undo.');
  assert.equal(Runbook.splitLead(`Liquibase ↔ entity. ${long}`)[0], 'Liquibase ↔ entity.');
});

test('flowOf: полоса процесса только по контракту — 3–5 непустых подписей до 24 символов, иначе пусто', () => {
  const ok = ['База', 'Сущности', 'Экраны'];
  assert.deepEqual(plain(Runbook.flowOf({ flow: ok })), ok);
  assert.deepEqual(plain(Runbook.flowOf({ flow: ['1', '2', '3', '4', '5'] })), ['1', '2', '3', '4', '5']);
  for (const flow of [undefined, 'База → Экраны', ['А', 'Б'], ['1', '2', '3', '4', '5', '6'],
    ['База', ' ', 'Экраны'], ['База', 'x'.repeat(25), 'Экраны'], ['База', 7, 'Экраны']]) {
    assert.deepEqual(plain(Runbook.flowOf({ flow })), [], JSON.stringify(flow));
  }
  assert.deepEqual(plain(Runbook.flowOf(undefined)), []);
  assert.equal(Runbook.FLOW_LABEL_MAX, 24);
});
