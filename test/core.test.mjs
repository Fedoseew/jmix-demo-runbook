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

test('defaultState — демо A, блок 0, таймер стоит, шагов и флагов нет', () => {
  assert.deepEqual(plain(Runbook.defaultState()), {
    demo: 'a', index: 0,
    timer: { running: false, startedAt: null, elapsedBefore: 0 },
    elapsed: {}, steps: {}, short: false, light: false, indexByDemo: {},
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

test('pace считает только блоки с фактом и не больше плана текущего блока', () => {
  const blocks = [
    { id: 'p', pre: true, minutes: 0 }, { id: 'x', minutes: 10 },
    { id: 'o', minutes: 5, optional: true }, { id: 'y', minutes: 8 }, { id: 'z', minutes: 4 },
  ];
  assert.deepEqual(plain(Runbook.pace(blocks, 3, { x: 660 }, 120)), { plan: 720, fact: 780, delta: 60 });
  assert.deepEqual(plain(Runbook.pace(blocks, 3, { x: 660, o: 300 }, 120)), { plan: 1020, fact: 1080, delta: 60 });
  assert.deepEqual(plain(Runbook.pace(blocks, 3, { x: 660 }, 600)), { plan: 1080, fact: 1260, delta: 180 });
  assert.deepEqual(plain(Runbook.pace(blocks, 0, {}, 0)), { plan: 0, fact: 0, delta: 0 });
});

test('agenda размечает пройденные, текущий и будущие блоки с фактом и перерасходом', () => {
  const blocks = [{ id: 'p', pre: true, minutes: 0, title: 'P' }, { id: 'x', minutes: 10, title: 'X', exit: 'выход' }, { id: 'y', minutes: 5, optional: true, title: 'Y' }];
  const a = Runbook.agenda(blocks, 1, { p: 30, x: 700 });
  assert.deepEqual(a.map(i => i.state), ['done', 'cur', 'todo']);
  assert.equal(a[0].over, null);
  assert.equal(a[1].fact, 700);
  assert.equal(a[1].over, 100);
  assert.equal(a[1].exit, 'выход');
  assert.equal(a[2].fact, null);
  assert.equal(a[2].optional, true);
});

test('syncChanges различает смену блока, шага и таймера', () => {
  const base = Runbook.defaultState();
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base, index: 2 })), { full: true, steps: false, timer: false });
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base, light: true })), { full: true, steps: false, timer: false });
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base, steps: { A4: 2 } })), { full: false, steps: true, timer: false });
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base, short: true })), { full: false, steps: true, timer: false });
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base, elapsed: { A4: 5 } })), { full: false, steps: false, timer: true });
  assert.deepEqual(plain(Runbook.syncChanges(base, { ...base, timer: { running: true, startedAt: 1, elapsedBefore: 0 } })), { full: false, steps: false, timer: true });
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

const A1 = { id: 'A1', minutes: 10 }, A2 = { id: 'A2', minutes: 15 }, PRE = { id: 'A-pre', minutes: 0, pre: true };
const T0 = 1_000_000;
const running = (startedAt, elapsedBefore = 0) => ({ running: true, startedAt, elapsedBefore });
const paused = elapsedBefore => ({ running: false, startedAt: null, elapsedBefore });

test('leaveBlock: идущий таймер не встаёт при переходе, время блока уходит в факт', () => {
  const s = { ...Runbook.defaultState(), timer: running(T0) };
  assert.deepEqual(plain(Runbook.leaveBlock(s, A1, A2, T0 + 600_000)),
    { elapsed: { A1: 600 }, timer: running(T0 + 600_000) });
});

test('leaveBlock: на блок, где уже был факт, таймер идёт дальше от него', () => {
  const s = { ...Runbook.defaultState(), elapsed: { A1: 600 }, timer: running(T0, 0) };
  assert.deepEqual(plain(Runbook.leaveBlock(s, A2, A1, T0 + 60_000)),
    { elapsed: { A1: 600, A2: 60 }, timer: running(T0 + 60_000, 600) });
});

test('leaveBlock: пауза сохраняется — переход между блоками таймер не запускает', () => {
  const s = { ...Runbook.defaultState(), elapsed: { A1: 300, A2: 90 }, timer: paused(300) };
  assert.deepEqual(plain(Runbook.leaveBlock(s, A1, A2, T0)),
    { elapsed: { A1: 300, A2: 90 }, timer: paused(90) });
});

const DEMO_A = [PRE, A1, A2];

test('leaveBlock: с заставки на первый блок таймер стартует, на заставке стоит', () => {
  const s = Runbook.defaultState();
  assert.deepEqual(plain(Runbook.leaveBlock(s, PRE, A1, T0, DEMO_A)), { elapsed: {}, timer: running(T0) });
  const r = { ...s, timer: running(T0) };
  assert.deepEqual(plain(Runbook.leaveBlock(r, A1, PRE, T0 + 120_000, DEMO_A)),
    { elapsed: { A1: 120 }, timer: paused(0) });
});

test('leaveBlock: с заставки щелчком по повестке не на первый блок — таймер стоит, факта нет', () => {
  const s = Runbook.defaultState();
  const r = Runbook.leaveBlock(s, PRE, A2, T0, DEMO_A);
  assert.deepEqual(plain(r), { elapsed: {}, timer: paused(0) });
  const back = Runbook.leaveBlock({ ...s, ...r }, A2, PRE, T0 + 120_000, DEMO_A);
  assert.deepEqual(plain(back), { elapsed: {}, timer: paused(0) });
});

test('leaveBlock: 2 → 1 через заставку другого демо паузу не снимает', () => {
  const A6 = { id: 'A6', minutes: 12 }, BPRE = { id: 'B-pre', minutes: 0, pre: true }, B1 = { id: 'B1', minutes: 5 };
  const s = { ...Runbook.defaultState(), elapsed: { A6: 300 }, timer: paused(300) };
  const onB = { ...s, ...Runbook.leaveBlock(s, A6, BPRE, T0, [PRE, A1, A6]) };
  assert.deepEqual(plain(Runbook.leaveBlock(onB, BPRE, A6, T0 + 5_000, [BPRE, B1])),
    { elapsed: { A6: 300 }, timer: paused(300) });
});

test('leaveBlock: блок, пролистанный быстрее SKIP_SEC, факта не получает и в темп не идёт', () => {
  const s = { ...Runbook.defaultState(), timer: running(T0) };
  const r = Runbook.leaveBlock(s, A1, A2, T0 + (Runbook.SKIP_SEC - 1) * 1000);
  assert.deepEqual(plain(r.elapsed), {});
  assert.equal(Runbook.pace([A1, A2], 1, r.elapsed, 0).plan, 0);
  const stale = { ...s, elapsed: { A1: 5 }, timer: paused(5) };
  assert.deepEqual(plain(Runbook.leaveBlock(stale, A1, A2, T0).elapsed), {});
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
