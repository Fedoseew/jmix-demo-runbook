import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScript, readText } from './load.mjs';

const KINDS = new Set(['shell', 'git', 'url', 'studio', 'say']);
const { DEMOS } = loadScript('content.js');
const { Runbook } = loadScript('core.js');
const all = () => ['a', 'b'].flatMap(k => DEMOS[k].blocks);
const steps = b => Runbook.classifyActions(b.actions);

const sum = (blocks, pred = () => true) =>
  blocks.filter(b => !b.pre && pred(b)).reduce((s, b) => s + b.minutes, 0);

test('обе программы объявлены с заголовком и блоками', () => {
  for (const key of ['a', 'b']) {
    assert.ok(DEMOS[key], `нет DEMOS.${key}`);
    assert.ok(DEMOS[key].title.length > 0);
    assert.ok(Array.isArray(DEMOS[key].blocks) && DEMOS[key].blocks.length >= 6);
  }
});

test('каждый блок валиден: id уникален, слайд 3–6 буллетов, есть заметки, действия типизированы', () => {
  for (const key of ['a', 'b']) {
    const ids = new Set();
    for (const b of DEMOS[key].blocks) {
      assert.ok(typeof b.id === 'string' && b.id.length > 0, `${key}: пустой id`);
      assert.ok(!ids.has(b.id), `${key}: дубль id ${b.id}`);
      ids.add(b.id);
      assert.ok(b.title.length > 0, `${b.id}: пустой title`);
      assert.ok(Number.isInteger(b.minutes) && b.minutes >= 0, `${b.id}: minutes`);
      const [min, max] = b.pre ? [4, 12] : [3, 6];
      assert.ok(b.slide.length >= min && b.slide.length <= max, `${b.id}: slide ${b.slide.length} вне [${min},${max}]`);
      assert.ok(b.slide.every(s => typeof s === 'string' && s.trim().length > 0), `${b.id}: пустой буллет`);
      assert.ok(Array.isArray(b.notes) && b.notes.length >= 1, `${b.id}: нет notes`);
      assert.ok(Array.isArray(b.actions), `${b.id}: нет actions`);
      for (const a of b.actions) {
        assert.ok(KINDS.has(a.kind), `${b.id}: kind ${a.kind}`);
        assert.ok(typeof a.text === 'string' && a.text.trim().length > 0, `${b.id}: пустое действие`);
      }
      if (b.pre) assert.equal(b.minutes, 0, `${b.id}: pre-блок должен иметь 0 минут`);
    }
  }
});

test('первый блок каждой программы — pre-flight', () => {
  assert.ok(DEMOS.a.blocks[0].pre && DEMOS.b.blocks[0].pre);
});

// A3 разделён на обязательный минимум (A3, 3 мин) и опциональный A3+ (7 мин): CLI и Jmix AI — темы заказчика (ревью C1).
test('тайминги: A ядро 73 и всего 80, B ядро 45 и всего 55', () => {
  assert.equal(sum(DEMOS.a.blocks, b => !b.optional), 73, 'A ядро');
  assert.equal(sum(DEMOS.a.blocks), 80, 'A с опциями');
  assert.equal(sum(DEMOS.b.blocks, b => !b.optional), 45, 'B ядро');
  assert.equal(sum(DEMOS.b.blocks), 55, 'B с опциями');
});

const byId = key => Object.fromEntries(DEMOS[key].blocks.map(b => [b.id, b]));
const A = byId('a'), B = byId('b');

test('точки выхода: A3 (решение после минимума), A6, B4; опциональны A3+ и B4', () => {
  for (const id of ['A3', 'A6']) assert.ok(A[id]?.exit, `${id}: нет exit`);
  assert.ok(B.B4?.exit, 'B4: нет exit');
  assert.ok(!A.A3.optional, 'минимум A3 обязателен');
  assert.ok(A['A3+']?.optional && B.B4.optional, 'A3+ и B4 опциональны');
});

test('контент не упоминает tabbed-стенд и порт 8096, ссылается на стенд :8091', () => {
  const src = readText('content.js');
  assert.ok(!/tabbed/i.test(src), 'tabbed в контенте');
  assert.ok(!/8096/.test(src), '8096 в контенте');
  assert.ok(/localhost:8091\/b2b-crm/.test(src), 'нет ссылки на стенд :8091');
});

test('контент ссылается на ветки из spec §7', () => {
  const src = readText('content.js');
  for (const ref of ['demo/ai-app', 'demo/agent-task', 'b/02-model', 'b/03-views', 'b/04-role']) {
    assert.ok(src.includes(ref), `нет ссылки ${ref}`);
  }
});

test('буллеты слайдов не длиннее 90 символов', () => {
  for (const b of all()) for (const t of b.slide) assert.ok(t.length <= 90, `${b.id}: ${t.length} — ${t}`);
});

test('у каждого абзаца заметок есть короткий лид для консоли', () => {
  for (const b of all()) b.notes.forEach((t, i) => assert.ok(Runbook.splitLead(t)[0], `${b.id} notes[${i}]: нет лида — ${t.slice(0, 60)}`));
});

test('вопросы к CRM AI, Jmix AI и дизайнеру отчётов копируются как промпты', () => {
  const prompts = all().flatMap(b => steps(b).filter(a => a.kind === 'prompt').map(a => a.text));
  for (const q of [
    'Сколько у нас клиентов?',
    'Как в Jmix 3 показать менеджеру только договоры его клиентов?',
    'Сколько у нас клиентов и кто топ-3 по сумме заказов?',
    'Подготовь Client 360 по этому клиенту за последний год',
    'Покажи контакты Connelly LLC с телефонами и email',
    'Выведи таблицу пользователей CRM со всеми их полями',
    'Для каждого клиента: название клиента, количество заказов',
    'Какие клиенты лидеры по выручке',
  ]) assert.ok(prompts.some(p => p.startsWith(q)), `не промпт: ${q}`);
});

test('каждый запуск jmix на сцене — с --no-update; pre-flight гоняет ту же команду, что A3', () => {
  const runs = all().flatMap(b => b.actions).filter(a => a.kind === 'shell' && /(?:^|[(;&|]\s*)jmix(?=\s|\)|$)/.test(a.text));
  assert.ok(runs.length >= 4);
  for (const a of runs) if (!/--help/.test(a.text)) assert.match(a.text, /--no-update/);
  const a3 = A.A3.actions.find(a => /jmix --no-update new/.test(a.text)).text.replace(/--path \S+$/, '');
  assert.ok(A['A-pre'].actions.some(a => a.text.includes(a3)), 'A-pre не повторяет команду A3');
});

test('jar стенда — один путь ~/demo-jars/crm.jar в обоих pre-flight', () => {
  const src = readText('content.js');
  assert.doesNotMatch(src, /stands\/crm-ai\.jar/);
  const jars = [...src.matchAll(/STAND_JAR=\\?"?([^"\\\s]+)/g)].map(m => m[1]);
  assert.ok(jars.length >= 3 && jars.every(j => j === '$HOME/demo-jars/crm.jar'), jars.join(', '));
  for (const id of ['a', 'b']) {
    const pre = DEMOS[id].blocks[0].actions.map(a => a.text).join('\n');
    // cp -n на macOS при готовой копии завершается с кодом 1: шаг выглядел бы упавшим
    assert.match(pre, /\[ -f "\$HOME\/demo-jars\/crm\.jar" \] \|\| cp \S+ "\$HOME\/demo-jars\/crm\.jar"/, `${id}: нет идемпотентной копии jar`);
    assert.doesNotMatch(pre, /cp -n/, `${id}: cp -n`);
    assert.match(pre, /stands\.sh status aura-light/, `${id}: нет проверки status`);
  }
});

test('A-pre готовит fallback\'и A4–A6', () => {
  const pre = A['A-pre'].actions.map(a => a.text).join('\n');
  for (const re of [/executeQuery\(jpql=/, /alice \/ alice/, /«Импортировать» \S*demo\/reports\/ai-jpql-reports\.zip/, /start aura-dark/, /8092/]) assert.match(pre, re);
});

test('A6: полная версия — шаги 1, 2, 3, 8, 9, 13; шаги 10–12 в резерве', () => {
  const texts = A.A6.actions.map(a => a.text);
  for (const n of [10, 11, 12]) {
    const t = texts.find(x => x.includes(`Шаг ${n}.`));
    assert.ok(t && t.startsWith('Резерв'), `шаг ${n} не в резерве`);
  }
});

test('B1 без jmix new --help, B3 не строит роль вживую', () => {
  assert.ok(!B.B1.actions.some(a => a.text === 'jmix new --help'));
  assert.ok(!B.B3.actions.some(a => /New \(\+\) → Resource Role/.test(a.text)));
});

test('полоса процесса: у A4, A5, A6 и B2, 3–5 подписей, каждая ≤ 24 символов', () => {
  for (const b of [A.A4, A.A5, A.A6, B.B2]) assert.ok(b.flow, `${b.id}: нет flow`);
  for (const b of all().filter(x => x.flow !== undefined)) {
    assert.ok(Array.isArray(b.flow) && b.flow.length >= 3 && b.flow.length <= 5, `${b.id}: flow из ${b.flow.length}`);
    for (const s of b.flow) assert.ok(typeof s === 'string' && s.trim() && s.length <= 24, `${b.id}: «${s}»`);
    assert.deepEqual([...Runbook.flowOf(b)], [...b.flow], `${b.id}: flowOf отбросил полосу`);
  }
});

test('последний блок каждого демо говорит, где материалы: адрес на слайде и ссылка в действиях', () => {
  for (const key of ['a', 'b']) {
    const b = DEMOS[key].blocks.at(-1);
    assert.ok(b.slide.some(t => t.includes('github.com/Fedoseew/jmix-demo-runbook')), `${b.id}: нет на слайде`);
    assert.ok(b.actions.some(a => a.kind === 'url' && a.text === 'https://github.com/Fedoseew/jmix-demo-runbook'), `${b.id}: нет ссылки`);
  }
});

// Шаги видит зал в панели зеркала (N): подготовка и цифры для сверки — только в заметках.
test('шаги блоков не выдают подготовку: без «записанных» диалогов, «пока зал…» и ожидаемых цифр', () => {
  for (const b of all().filter(x => !x.pre)) for (const a of b.actions) {
    assert.doesNotMatch(a.text, /записанн|пока зал|\d+\/\d+ против/i, `${b.id}: ${a.text}`);
  }
});

test('A-pre: прогрев Jmix AI — вопрос A3 промптом; каталога /tmp/jmix-demo/crm-cli перед A3 нет', () => {
  const q = steps(A.A3).find(a => a.kind === 'prompt').text;
  assert.ok(steps(A['A-pre']).some(a => a.kind === 'prompt' && a.text === q), 'нет прогрева вопросом A3');
  assert.ok(A['A-pre'].actions.some(a => a.kind === 'shell' && a.text === 'rm -rf /tmp/jmix-demo/crm-cli'), 'нет очистки crm-cli');
});

test('A3: запасной скриншот ответа Jmix AI — последнее действие блока', () => {
  assert.equal(A.A3.actions.at(-1).text, 'open ~/IdeaProjects/jmix-demo-runbook/assets/a3-jmix-ai.png');
});

test('A5 называется так же, как в карте A0', () => {
  assert.ok(A.A0.slide.some(t => t.includes(A.A5.title)), A.A5.title);
});
