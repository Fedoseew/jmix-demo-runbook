# Jmix Demo Runbook — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Локальный офлайн HTML-runbook для двух демо Jmix (A «AI × Jmix», B «Jmix с нуля») со слайдами, заметками докладчика, командами с копированием и таймером блоков.

**Architecture:** Три файла в одной папке без зависимостей: `content.js` объявляет `globalThis.DEMOS` (данные обоих демо), `app.js` содержит чистые функции (таймер, навигация, суммы, состояние) и DOM-рендер, `index.html` — разметка и CSS. Чистые функции и контент тестируются в Node через `node:test` + `node:vm`; DOM проверяется вручную в браузере по чек-листу spec §8.

**Tech Stack:** HTML5, CSS, vanilla JS (ES2022), Node 26 `node:test`. Никаких npm-зависимостей и внешних запросов.

**Spec:** `docs/superpowers/specs/2026-10-07-jmix-demo-runbook-design.md`

## Global Constraints

- Ноль внешних запросов: ни одного `<script src="http…">`, `<link href="http…">`, `@import url(http…)`, `fetch(`. Системные шрифты.
- Работает с `file://` — только относительные пути `./app.js`, `./content.js`.
- Тёмная тема; слайд ≥ 28px, заметки ≥ 18px; контраст текста ≥ 4.5:1 (текст `#e8e8e8` на фоне `#121417`).
- Клавиши: `←`/`→` блок, `N` заметки, `T` таймер старт/пауза, `R` сброс таймера блока, `F` fullscreen, `1`/`2` демо A/B.
- Все обращения к `localStorage` и `navigator.clipboard` — в `try/catch`, страница работает и без них.
- Язык интерфейса и контента — русский. Технические имена (skills, порты, ветки) — как в spec §2, §7.
- Стенд AI-части — `aura-light` на `http://localhost:8091/b2b-crm/`, логин `admin/admin`. Слов «tabbed» и порта `8096` в контенте быть не должно.
- Ветки и репозитории в контенте — строго по spec §7: `demo/ai-app`, `demo/agent-task`, `crm-from-db` с `b/01-empty … b/05-agent`.
- Тайминги блоков — строго по spec §3–§4. Суммы: A ядро 70 (A7 = 5), A с опцией A3 = 80; B ядро 45, B с опцией B4 (= 10) = 55.
- Коммиты: `<type>: <description>`, без строк атрибуции (глобальная настройка пользователя).

## Review Focus

1. `localStorage` недоступен (приватное окно, `file://` в Safari) — страница должна открыться на демо A, блок 0, без ошибок в консоли. Тест: `loadState` возвращает дефолт при бросающем storage (Task 2).
2. Таймер запущен, страница перезагружена — отсчёт продолжается с учётом времени, прошедшего пока вкладка была закрыта, а не с нуля. Тест: `elapsedNow` с `startedAt` в прошлом (Task 4).
3. Блок с `minutes: 0` (pre-flight) — таймер не должен показывать «−00:00» красным сразу; у pre-блока таймер скрыт. Тест: `remaining(0, 0) === 0` и рендер скрывает таймер при `minutes === 0` (Task 4).
4. Клавиши нажаты, пока фокус в поле/кнопке — `←`/`→` не должны перехватываться, если фокус в `input`/`textarea`; copy-кнопка по `Enter` не должна переключать блок. Тест: `shouldHandleKey(event)` возвращает `false` для `target.tagName === 'INPUT'` (Task 2).
5. Переключение демо `1`→`2` — индекс блока из демо A (например 7) выходит за длину демо B (6 блоков) → `clampIndex` обязателен при переключении. Тест: `clampIndex(7, 6) === 5` (Task 2).

---

### Task 1: Контент обоих демо (`content.js`) с тестом инвариантов

**Files:**
- Create: `content.js`
- Create: `test/content.test.mjs`
- Create: `test/load.mjs` (хелпер загрузки файла в `node:vm`)

**Interfaces:**
- Produces: `globalThis.DEMOS = { a: Demo, b: Demo }`, где
  `Demo = { title: string, blocks: Block[] }`,
  `Block = { id: string, title: string, minutes: number, optional?: true, pre?: true, exit?: string, slide: string[], notes: string[], actions: Action[] }`,
  `Action = { kind: 'shell'|'git'|'url'|'studio'|'say', text: string }`.
- Consumes: ничего.

Источники фактов для `notes` и `actions` (читать перед написанием, не писать из памяти):
- `~/IdeaProjects/jmix-agent-toolkit/README.md`, `content/skills/jmix/SKILL.md`, список папок `content/skills/` (22 skills), `install.sh` — команды установки, MCP (JetBrains, Context7), Playwright.
- `~/IdeaProjects/jmix-cli/README.md` — установка, `jmix` wizard, неинтерактивный режим.
- `~/IdeaProjects/jmix-crm/README.md` (+ `readme/README_ru.md`) — CRM AI, аккаунты, демо-данные, доменная модель.
- `git -C ~/IdeaProjects/jmix-crm show 50-dynmodel-ai-agent:demo/dynmodel-ai-agent/README_ru.md` и `…:demo/dynmodel-ai-agent/scenarios/demo-scenario.md` — стенды, ключи, 13 шагов сценария, границы агента.
- `~/IdeaProjects/jmix-all/docs/features/aitools/README.md` — data-load, `@ExcludeFromAi`, `@Secret`, access checks.
- `~/IdeaProjects/jmix-all/docs/features/reports-llm-data-query/README.md`, `specs/designer.md` — тип «AI-generated JPQL», генерация при авторинге, запуск без модели.
- Spec §2–§4, §6, §7 — тайминги, ветки, порты, чек-лист.

- [ ] **Step 1: Хелпер загрузки файла в vm**

```js
// test/load.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Выполняет файл проекта в изолированном контексте и возвращает его globalThis. */
export function loadScript(relPath, context = {}) {
  const code = readFileSync(resolve(root, relPath), 'utf8');
  const ctx = vm.createContext({ console, ...context });
  ctx.globalThis = ctx;
  vm.runInContext(code, ctx, { filename: relPath });
  return ctx;
}

export function readText(relPath) {
  return readFileSync(resolve(root, relPath), 'utf8');
}
```

- [ ] **Step 2: Падающий тест инвариантов контента**

```js
// test/content.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScript, readText } from './load.mjs';

const KINDS = new Set(['shell', 'git', 'url', 'studio', 'say']);
const { DEMOS } = loadScript('content.js');

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

test('тайминги совпадают со spec §3–§4', () => {
  assert.equal(sum(DEMOS.a.blocks, b => !b.optional), 70, 'A ядро');
  assert.equal(sum(DEMOS.a.blocks), 80, 'A с опциями');
  assert.equal(sum(DEMOS.b.blocks, b => !b.optional), 45, 'B ядро');
  assert.equal(sum(DEMOS.b.blocks), 55, 'B с опциями');
});

test('точки выхода отмечены на A3, A6, B4', () => {
  const byId = key => Object.fromEntries(DEMOS[key].blocks.map(b => [b.id, b]));
  const a = byId('a'), b = byId('b');
  for (const id of ['A3', 'A6']) assert.ok(a[id]?.exit, `${id}: нет exit`);
  assert.ok(b.B4?.exit, 'B4: нет exit');
  assert.ok(a.A3.optional && b.B4.optional, 'A3 и B4 опциональны');
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
```

- [ ] **Step 3: Запустить тест — должен упасть**

Run: `node --test test/content.test.mjs`
Expected: FAIL — `ENOENT … content.js`.

- [ ] **Step 4: Написать `content.js`**

Каркас обязателен ровно такой (id, minutes, optional, pre, exit). Тексты `slide`/`notes`/`actions` — по spec §3–§4, §6 и источникам выше; на каждый блок: 3–6 буллетов слайда, 2–6 абзацев заметок (что сказать, на что обратить внимание, где типичная ошибка), действия — конкретные команды/URL/пути по меню.

```js
// content.js — данные runbook. Правится руками, проверяется `node --test`.
globalThis.DEMOS = {
  a: {
    title: 'Демо A — AI × Jmix',
    blocks: [
      { id: 'A-pre', title: 'Pre-flight', minutes: 0, pre: true,
        slide: [ /* чек-лист spec §6: JDK 21, Docker, jar'ы стендов, ключи, Studio, jmix --version, интернет/hotspot, вкладки браузера */ ],
        notes: [ /* главный риск — интернет для LLM; fallback — скриншоты */ ],
        actions: [
          { kind: 'shell', text: 'java -version && docker info >/dev/null && echo OK' },
          { kind: 'shell', text: 'echo $OPENROUTER_API_KEY | cut -c1-6; echo $SPRING_AI_OPENAI_APIKEY | cut -c1-6' },
          { kind: 'shell', text: 'cd ~/IdeaProjects/jmix-crm && git checkout demo/ai-app && ./stands.sh start aura-light' },
          { kind: 'url',   text: 'http://localhost:8091/b2b-crm/' },
          { kind: 'shell', text: 'jmix --version' },
        ] },
      { id: 'A0', title: 'Карта «AI × Jmix»', minutes: 5, slide: [], notes: [], actions: [] },
      { id: 'A1', title: 'Окружение агента: jmix-agent-toolkit', minutes: 10, slide: [], notes: [], actions: [
          { kind: 'shell', text: 'cd ~/IdeaProjects/jmix-crm && git checkout main && ls .skills && sed -n 1,40p AGENTS.md' },
          { kind: 'shell', text: 'curl -fsSL https://raw.githubusercontent.com/jmix-framework/jmix-agent-toolkit/main/install.sh | bash' },
          { kind: 'studio', text: 'Jmix tool window → Settings → AI Agents Toolkit' },
        ] },
      { id: 'A2', title: 'Агент делает фичу', minutes: 15, slide: [], notes: [], actions: [
          { kind: 'say', text: 'Таймбокс live-агента — 3 минуты, затем checkout готового результата' },
          { kind: 'git', text: 'git checkout demo/agent-task && git log --oneline -3' },
        ] },
      { id: 'A3', title: 'Jmix CLI и Studio AI Assistant', minutes: 10, optional: true,
        exit: 'Точка выхода №1: при отставании пропустить блок целиком', slide: [], notes: [], actions: [
          { kind: 'shell', text: 'jmix' },
        ] },
      { id: 'A4', title: 'AI внутри приложения: CRM AI', minutes: 12, slide: [], notes: [], actions: [
          { kind: 'url', text: 'http://localhost:8091/b2b-crm/' },
          { kind: 'say', text: 'Один вопрос под admin, тот же вопрос под manager — разные ответы' },
        ] },
      { id: 'A5', title: 'AI-generated JPQL в отчётах', minutes: 8, slide: [], notes: [], actions: [
          { kind: 'studio', text: 'Reports → Report → band → Data set type: AI-generated JPQL → Generate' },
        ] },
      { id: 'A6', title: 'Dynamic Model AI', minutes: 15,
        exit: 'Точка выхода №2: сократить до 8 минут — только шаги 1–5 сценария', slide: [], notes: [], actions: [
          { kind: 'studio', text: 'Admin → Настройки динамической модели → переключатель AI' },
        ] },
      { id: 'A7', title: 'Итоги и Q&A', minutes: 5, slide: [], notes: [], actions: [] },
    ],
  },
  b: {
    title: 'Демо B — Jmix с нуля',
    blocks: [
      { id: 'B-pre', title: 'Pre-flight', minutes: 0, pre: true, slide: [], notes: [], actions: [
          { kind: 'shell', text: 'cd ~/IdeaProjects/crm-from-db && docker compose -f db/docker-compose.yml up -d' },
          { kind: 'git', text: 'git checkout b/01-empty' },
        ] },
      { id: 'B0', title: 'Что такое Jmix', minutes: 8, slide: [], notes: [], actions: [] },
      { id: 'B1', title: 'Проект двумя путями: Studio и CLI', minutes: 7, slide: [], notes: [], actions: [
          { kind: 'shell', text: 'jmix' },
          { kind: 'studio', text: 'File → New → Project → Jmix Project' },
        ] },
      { id: 'B2', title: 'Приложение из существующей БД', minutes: 15, slide: [], notes: [], actions: [
          { kind: 'studio', text: 'Jmix → Data Stores → Main Data Store → Generate Model' },
          { kind: 'git', text: 'git checkout b/02-model' },
          { kind: 'git', text: 'git checkout b/03-views' },
        ] },
      { id: 'B3', title: 'Доработка руками в Studio', minutes: 10, slide: [], notes: [], actions: [
          { kind: 'git', text: 'git checkout b/04-role' },
        ] },
      { id: 'B4', title: 'Мост к AI', minutes: 10, optional: true,
        exit: 'Точка выхода: при отставании — только 3 минуты CRM AI', slide: [], notes: [], actions: [
          { kind: 'git', text: 'git checkout b/05-agent' },
          { kind: 'url', text: 'http://localhost:8091/b2b-crm/' },
        ] },
      { id: 'B5', title: 'Итоги', minutes: 5, slide: [], notes: [], actions: [] },
    ],
  },
};
```

Обязательные факты в заметках (проверяются ревьюером по источникам):
- A1: 22 skills в `content/skills/`; хаб-skill `jmix` «читать первым»; guardrail-skills `jmix-ide-static-analysis`, `jmix-verify-bootrun`, `jmix-verify-api-symbol`; MCP JetBrains (`Settings → Tools → MCP Server`) и Context7; Playwright через `npx @playwright/cli`.
- A4: data-load генерирует и валидирует JPQL, проверяет READ на весь граф запроса, применяет row-level policies; `@ExcludeFromAi` — code-level граница, не переопределяется свойствами; `@Secret` блокируется везде.
- A5: тип band «AI-generated JPQL»; запрос генерируется при авторинге, одна попытка исправления, хранится с отчётом; запуск выполняет сохранённый JPQL через `DataManager` с правами пользователя, модель не нужна; параметры отчёта = named JPQL params; есть только в 3.1.
- A6: агент сам не публикует, человек жмёт «Применить»; этапы Request → Plan → Prepare → Review → Apply; границы: не читает бизнес-данные, не меняет тип опубликованного поля; DeepSeek Flash может отвечать по-разному — повторить запрос; перед новой задачей очистить диалог.
- B2: Studio генерирует entities из таблиц с связями; Liquibase не трогает существующие таблицы; показать `@InstanceName`, маппинг enum.

- [ ] **Step 5: Запустить тест — должен пройти**

Run: `node --test test/content.test.mjs`
Expected: PASS, все 7 тестов.

- [ ] **Step 6: Commit**

```bash
git add content.js test/load.mjs test/content.test.mjs
git commit -m "feat: add runbook content for demos A and B with invariants test"
```

---

### Task 2: Каркас страницы, список блоков, слайд, переключение A/B, навигация клавишами, состояние

**Files:**
- Create: `index.html`
- Create: `app.js`
- Create: `test/app.test.mjs`
- Create: `test/html.test.mjs`

**Interfaces:**
- Consumes: `globalThis.DEMOS` из Task 1.
- Produces (на `globalThis.Runbook`, чистые функции, без DOM):
  `clampIndex(i: number, len: number): number`,
  `defaultState(): State`,
  `loadState(storage): State`, `saveState(storage, state: State): void`,
  `shouldHandleKey(ev: {target?: {tagName?: string}}): boolean`,
  `totals(blocks: Block[]): { core: number, all: number }`.
  `State = { demo: 'a'|'b', index: number, notes: boolean, timer: { running: boolean, startedAt: number|null, elapsedBefore: number }, elapsed: Record<string, number> }`.
  Ключ хранилища: `'jmix-runbook/v1'`.
- DOM: `app.js` при наличии `document` вызывает `init()` на `DOMContentLoaded`.

- [ ] **Step 1: Падающие тесты чистых функций**

```js
// test/app.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScript } from './load.mjs';

const { Runbook } = loadScript('app.js');

test('clampIndex держит индекс в границах', () => {
  assert.equal(Runbook.clampIndex(7, 6), 5);
  assert.equal(Runbook.clampIndex(-1, 6), 0);
  assert.equal(Runbook.clampIndex(3, 6), 3);
  assert.equal(Runbook.clampIndex(0, 0), 0);
});

test('defaultState — демо A, блок 0, заметки скрыты, таймер стоит', () => {
  const s = Runbook.defaultState();
  assert.deepEqual(s, {
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
  assert.deepEqual(s.timer, { running: false, startedAt: null, elapsedBefore: 0 });
});

test('saveState пишет JSON под ключом и молчит при ошибке', () => {
  const written = {};
  Runbook.saveState({ setItem: (k, v) => { written[k] = v; } }, Runbook.defaultState());
  assert.equal(Object.keys(written)[0], 'jmix-runbook/v1');
  assert.deepEqual(JSON.parse(written['jmix-runbook/v1']), Runbook.defaultState());
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
  assert.deepEqual(Runbook.totals(blocks), { core: 10, all: 15 });
});
```

- [ ] **Step 2: Падающий статический тест HTML**

```js
// test/html.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readText } from './load.mjs';

const html = readText('index.html');

test('нет внешних ресурсов', () => {
  assert.ok(!/<script[^>]+src=["']https?:/i.test(html), 'внешний script');
  assert.ok(!/<link[^>]+href=["']https?:/i.test(html), 'внешний link');
  assert.ok(!/@import\s+url\(\s*["']?https?:/i.test(html), 'внешний @import');
  assert.ok(!/fonts\.googleapis|cdn\./i.test(html), 'CDN/шрифты');
});

test('подключает content.js и app.js относительными путями, в этом порядке', () => {
  const c = html.indexOf('src="./content.js"');
  const a = html.indexOf('src="./app.js"');
  assert.ok(c > -1 && a > -1 && c < a);
});

test('базовые атрибуты документа', () => {
  assert.ok(/<html[^>]+lang="ru"/.test(html));
  assert.ok(/<meta[^>]+charset="utf-8"/i.test(html));
  assert.ok(/<meta[^>]+name="viewport"/.test(html));
  assert.ok(/<title>[^<]+<\/title>/.test(html));
});

test('есть контейнеры, на которые ссылается app.js', () => {
  for (const id of ['demoTabs', 'blockList', 'slideTitle', 'slideBullets', 'presenter', 'notes', 'actions', 'timer', 'totals', 'blockMeta', 'help']) {
    assert.ok(html.includes(`id="${id}"`), `нет id="${id}"`);
  }
});
```

- [ ] **Step 3: Запустить тесты — должны упасть**

Run: `node --test test/`
Expected: `app.test.mjs` и `html.test.mjs` FAIL (ENOENT), `content.test.mjs` PASS.

- [ ] **Step 4: Написать `index.html`**

```html
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jmix Demo Runbook</title>
<style>
  :root {
    --bg: #121417; --panel: #1b1f24; --panel-2: #22272e; --text: #e8e8e8; --muted: #a0a8b3;
    --accent: #5ac8fa; --ok: #4cd964; --warn: #ffcc00; --bad: #ff453a; --border: #2d333b;
    --slide-size: 32px; --notes-size: 19px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { display: grid; grid-template-rows: 56px 1fr; grid-template-columns: 340px 1fr; height: 100vh; }
  header { grid-column: 1 / -1; display: flex; align-items: center; gap: 24px; padding: 0 16px;
    background: var(--panel); border-bottom: 1px solid var(--border); }
  #demoTabs button { background: transparent; color: var(--muted); border: 1px solid var(--border);
    border-radius: 8px; padding: 6px 14px; font-size: 16px; cursor: pointer; }
  #demoTabs button[aria-pressed="true"] { color: var(--text); border-color: var(--accent); }
  #timer { font-variant-numeric: tabular-nums; font-size: 28px; font-weight: 600; min-width: 120px; }
  #timer.over { color: var(--bad); }
  #timer.running { color: var(--ok); }
  #timer.hidden { visibility: hidden; }
  #totals { color: var(--muted); font-size: 15px; margin-left: auto; }
  #help { color: var(--muted); font-size: 13px; }
  kbd { background: var(--panel-2); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; font-size: 12px; }
  nav { background: var(--panel); border-right: 1px solid var(--border); overflow-y: auto; }
  #blockList { list-style: none; margin: 0; padding: 8px; }
  #blockList li { display: grid; grid-template-columns: 1fr auto; gap: 4px 8px; padding: 10px 12px; border-radius: 8px;
    cursor: pointer; font-size: 16px; }
  #blockList li:hover { background: var(--panel-2); }
  #blockList li[aria-current="true"] { background: var(--panel-2); outline: 2px solid var(--accent); }
  #blockList .min { color: var(--muted); font-variant-numeric: tabular-nums; }
  #blockList .tags { grid-column: 1 / -1; display: flex; gap: 6px; }
  .tag { font-size: 12px; padding: 1px 8px; border-radius: 999px; border: 1px solid var(--border); color: var(--muted); }
  .tag.opt { border-color: var(--warn); color: var(--warn); }
  .tag.exit { border-color: var(--bad); color: var(--bad); }
  .tag.done { border-color: var(--ok); color: var(--ok); }
  main { overflow-y: auto; padding: 32px 48px; display: flex; flex-direction: column; gap: 24px; }
  #blockMeta { color: var(--muted); font-size: 16px; }
  #slideTitle { font-size: calc(var(--slide-size) * 1.4); margin: 0; line-height: 1.15; }
  #slideBullets { font-size: var(--slide-size); line-height: 1.35; padding-left: 1.1em; margin: 0; }
  #slideBullets li { margin: 0.35em 0; }
  #exit { color: var(--bad); font-size: 18px; }
  #presenter { border-top: 1px solid var(--border); padding-top: 20px; font-size: var(--notes-size); line-height: 1.45; }
  #presenter[hidden] { display: none; }
  #notes p { margin: 0 0 0.8em; }
  #actions { display: flex; flex-direction: column; gap: 10px; }
  .action { display: grid; grid-template-columns: 90px 1fr auto; gap: 12px; align-items: center;
    background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
  .action .kind { color: var(--muted); font-size: 13px; text-transform: uppercase; letter-spacing: .05em; }
  .action code, .action a { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 17px;
    word-break: break-all; color: var(--text); }
  .action a { color: var(--accent); }
  .action .say { font-style: italic; }
  .action button { background: var(--panel-2); color: var(--text); border: 1px solid var(--border); border-radius: 6px;
    padding: 6px 12px; cursor: pointer; font-size: 14px; }
  .action button.copied { border-color: var(--ok); color: var(--ok); }
  @media (max-width: 900px) { body { grid-template-columns: 1fr; grid-template-rows: 56px auto 1fr; }
    nav { border-right: 0; border-bottom: 1px solid var(--border); max-height: 30vh; } main { padding: 16px; } }
</style>
</head>
<body>
<header>
  <div id="demoTabs" role="group" aria-label="Демо"></div>
  <div id="timer" aria-live="off">00:00</div>
  <div id="totals"></div>
  <div id="help">
    <kbd>←</kbd><kbd>→</kbd> блок · <kbd>N</kbd> заметки · <kbd>T</kbd> таймер · <kbd>R</kbd> сброс · <kbd>F</kbd> экран · <kbd>1</kbd><kbd>2</kbd> демо
  </div>
</header>
<nav><ul id="blockList"></ul></nav>
<main>
  <div id="blockMeta"></div>
  <h1 id="slideTitle"></h1>
  <ul id="slideBullets"></ul>
  <div id="exit" hidden></div>
  <section id="presenter" hidden>
    <div id="notes"></div>
    <div id="actions"></div>
  </section>
</main>
<script src="./content.js"></script>
<script src="./app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Написать `app.js` — чистые функции + рендер списка/слайда + клавиши (таймер и презентер — Task 3–4, но заглушки функций нужны уже сейчас)**

```js
// app.js — логика runbook. Чистые функции на globalThis.Runbook, DOM — в init().
(function () {
  const STORAGE_KEY = 'jmix-runbook/v1';

  function clampIndex(i, len) {
    if (len <= 0) return 0;
    return Math.min(Math.max(i, 0), len - 1);
  }

  function defaultState() {
    return {
      demo: 'a', index: 0, notes: false,
      timer: { running: false, startedAt: null, elapsedBefore: 0 },
      elapsed: {},
    };
  }

  function loadState(storage) {
    const d = defaultState();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return d;
      const s = JSON.parse(raw);
      return {
        demo: s.demo === 'b' ? 'b' : 'a',
        index: Number.isInteger(s.index) ? s.index : d.index,
        notes: Boolean(s.notes),
        timer: { ...d.timer, ...(s.timer || {}) },
        elapsed: typeof s.elapsed === 'object' && s.elapsed ? s.elapsed : {},
      };
    } catch (_) {
      return d;
    }
  }

  function saveState(storage, state) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* storage недоступен — работаем без него */ }
  }

  function shouldHandleKey(ev) {
    const tag = ev && ev.target && ev.target.tagName;
    return !(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');
  }

  function totals(blocks) {
    const real = blocks.filter(b => !b.pre);
    return {
      core: real.filter(b => !b.optional).reduce((s, b) => s + b.minutes, 0),
      all: real.reduce((s, b) => s + b.minutes, 0),
    };
  }

  // --- таймер (Task 4 расширяет) ---
  function fmt(sec) {
    const sign = sec < 0 ? '-' : '';
    const s = Math.abs(Math.round(sec));
    const m = Math.floor(s / 60), r = s % 60;
    return `${sign}${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }
  function elapsedNow(timer, now) {
    return timer.elapsedBefore + (timer.running && timer.startedAt != null ? (now - timer.startedAt) / 1000 : 0);
  }
  function remaining(plannedMin, elapsedSec) { return plannedMin * 60 - elapsedSec; }

  globalThis.Runbook = { clampIndex, defaultState, loadState, saveState, shouldHandleKey, totals, fmt, elapsedNow, remaining };

  if (typeof document === 'undefined') return;

  // ---------------- DOM ----------------
  const $ = id => document.getElementById(id);
  const storage = (() => { try { return window.localStorage; } catch (_) { return { getItem: () => null, setItem() {} }; } })();
  let state = loadState(storage);
  let tick = null;

  function demo() { return DEMOS[state.demo]; }
  function block() { return demo().blocks[state.index]; }
  function persist() { saveState(storage, state); }

  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const c of children) n.append(c);
    return n;
  }

  function renderTabs() {
    const tabs = $('demoTabs'); tabs.replaceChildren();
    for (const key of ['a', 'b']) {
      tabs.append(el('button', { 'aria-pressed': String(state.demo === key), text: DEMOS[key].title, onclick: () => switchDemo(key) }));
    }
  }

  function renderList() {
    const ul = $('blockList'); ul.replaceChildren();
    demo().blocks.forEach((b, i) => {
      const tags = [];
      if (b.optional) tags.push(el('span', { class: 'tag opt', text: 'опц.' }));
      if (b.exit) tags.push(el('span', { class: 'tag exit', text: 'точка выхода' }));
      if (state.elapsed[b.id] > 0) tags.push(el('span', { class: 'tag done', text: fmt(state.elapsed[b.id]) }));
      ul.append(el('li', { 'aria-current': String(i === state.index), onclick: () => goTo(i) }, [
        el('span', { text: `${b.id} · ${b.title}` }),
        el('span', { class: 'min', text: b.pre ? '—' : `${b.minutes} мин` }),
        el('div', { class: 'tags' }, tags),
      ]));
    });
  }

  function renderSlide() {
    const b = block();
    $('blockMeta').textContent = b.pre ? 'Подготовка' : `Блок ${b.id} · план ${b.minutes} мин${b.optional ? ' · опционально' : ''}`;
    $('slideTitle').textContent = b.title;
    $('slideBullets').replaceChildren(...b.slide.map(s => el('li', { text: s })));
    const ex = $('exit'); ex.hidden = !b.exit; ex.textContent = b.exit || '';
    renderPresenter(b); // Task 3
  }

  function renderTotals() {
    const t = totals(demo().blocks);
    const fact = Object.entries(state.elapsed)
      .filter(([id]) => demo().blocks.some(b => b.id === id))
      .reduce((s, [, sec]) => s + sec, 0);
    $('totals').textContent = `план ${t.core} мин (с опц. ${t.all}) · факт ${fmt(fact)}`;
  }

  function render() { renderTabs(); renderList(); renderSlide(); renderTotals(); renderTimer(); persist(); }

  function goTo(i) {
    stopTimerIntoElapsed();            // Task 4: фиксируем время текущего блока
    state.index = clampIndex(i, demo().blocks.length);
    state.timer = { running: false, startedAt: null, elapsedBefore: state.elapsed[block().id] || 0 };
    render();
  }
  function switchDemo(key) {
    if (state.demo === key) return;
    stopTimerIntoElapsed();
    state.demo = key;
    state.index = clampIndex(state.index, demo().blocks.length);
    state.timer = { running: false, startedAt: null, elapsedBefore: state.elapsed[block().id] || 0 };
    render();
  }

  // Заглушки — реализуются в Task 3 и Task 4
  function renderPresenter() {}
  function renderTimer() {}
  function stopTimerIntoElapsed() {}
  function toggleTimer() {}
  function resetTimer() {}

  function onKey(ev) {
    if (!shouldHandleKey(ev) || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const k = ev.key;
    if (k === 'ArrowRight') goTo(state.index + 1);
    else if (k === 'ArrowLeft') goTo(state.index - 1);
    else if (k === '1') switchDemo('a');
    else if (k === '2') switchDemo('b');
    else if (k === 'n' || k === 'N' || k === 'т' || k === 'Т') { state.notes = !state.notes; render(); }
    else if (k === 't' || k === 'T' || k === 'е' || k === 'Е') toggleTimer();
    else if (k === 'r' || k === 'R' || k === 'к' || k === 'К') resetTimer();
    else if (k === 'f' || k === 'F' || k === 'а' || k === 'А') {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.();
    } else return;
    ev.preventDefault();
  }

  function init() {
    state.index = clampIndex(state.index, demo().blocks.length);
    document.addEventListener('keydown', onKey);
    render();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
```

Примечание: русская раскладка — `N`→`т`, `T`→`е`, `R`→`к`, `F`→`а`; обрабатываем обе, чтобы докладчик не переключал раскладку.

- [ ] **Step 6: Запустить тесты — должны пройти**

Run: `node --test test/`
Expected: PASS — все файлы.

- [ ] **Step 7: Ручная проверка в браузере**

Открыть `index.html` с диска (двойной клик или `open index.html`). Проверить: список блоков демо A, слайд блока `A-pre`, `→` переходит на `A0`, `2` переключает на демо B с индексом в границах, `1` возвращает, клик по блоку в списке работает, DevTools → Network: только `index.html`, `content.js`, `app.js`; Console пуста.

- [ ] **Step 8: Commit**

```bash
git add index.html app.js test/app.test.mjs test/html.test.mjs
git commit -m "feat: runbook shell with block list, slide, demo switch and keyboard navigation"
```

---

### Task 3: Режим докладчика — заметки и действия с копированием

**Files:**
- Modify: `app.js` (заменить заглушку `renderPresenter`, добавить `copyText`, `actionLabel`)
- Modify: `test/app.test.mjs` (добавить тесты)

**Interfaces:**
- Consumes: `Block.notes`, `Block.actions` (Task 1), `state.notes` (Task 2).
- Produces на `Runbook`: `actionLabel(kind: string): string` — подпись типа действия; `copyText(text: string, clipboard?: {writeText(t): Promise<void>}): Promise<boolean>`.

- [ ] **Step 1: Падающие тесты**

Добавить в `test/app.test.mjs`:

```js
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
```

- [ ] **Step 2: Запустить — должны упасть**

Run: `node --test test/app.test.mjs`
Expected: FAIL — `Runbook.actionLabel is not a function`.

- [ ] **Step 3: Реализация**

В `app.js` рядом с чистыми функциями:

```js
  const ACTION_LABELS = { shell: 'терминал', git: 'git', url: 'ссылка', studio: 'Studio', say: 'сказать' };
  function actionLabel(kind) { return ACTION_LABELS[kind] || kind; }

  async function copyText(text, clipboard) {
    if (!clipboard || typeof clipboard.writeText !== 'function') return false;
    try { await clipboard.writeText(text); return true; } catch (_) { return false; }
  }
```

Добавить `actionLabel, copyText` в `globalThis.Runbook`. Заменить заглушку `renderPresenter`:

```js
  function renderPresenter(b) {
    const p = $('presenter');
    p.hidden = !state.notes;
    if (p.hidden) return;
    $('notes').replaceChildren(...b.notes.map(t => el('p', { text: t })));
    $('actions').replaceChildren(...b.actions.map(a => {
      const body = a.kind === 'url'
        ? el('a', { href: a.text, target: '_blank', rel: 'noopener', text: a.text })
        : a.kind === 'say' ? el('span', { class: 'say', text: a.text })
        : el('code', { text: a.text });
      const copyable = a.kind === 'shell' || a.kind === 'git' || a.kind === 'url';
      const btn = copyable ? el('button', { type: 'button', text: 'Copy', onclick: async ev => {
        ev.stopPropagation();
        const ok = await copyText(a.text, navigator.clipboard);
        if (!ok) { const r = document.createRange(); r.selectNodeContents(body); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
        btn.textContent = ok ? 'Скопировано' : 'Выделено';
        btn.classList.toggle('copied', ok);
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
      } }) : el('span');
      return el('div', { class: 'action' }, [el('span', { class: 'kind', text: actionLabel(a.kind) }), body, btn]);
    }));
  }
```

- [ ] **Step 4: Запустить тесты — должны пройти**

Run: `node --test test/`
Expected: PASS.

- [ ] **Step 5: Ручная проверка**

Открыть `index.html`, нажать `N`: под слайдом появляются заметки и действия; `Copy` у shell/git/url кладёт текст в буфер (вставить в терминал); у `say`/`studio` кнопки нет; `url` открывается в новой вкладке; повторное `N` скрывает; F5 сохраняет режим.

- [ ] **Step 6: Commit**

```bash
git add app.js test/app.test.mjs
git commit -m "feat: presenter mode with notes and copyable actions"
```

---

### Task 4: Таймер блока, перерасход, факт по демо, сброс, персистентность

**Files:**
- Modify: `app.js` (заменить заглушки `renderTimer`, `stopTimerIntoElapsed`, `toggleTimer`, `resetTimer`)
- Modify: `test/app.test.mjs`

**Interfaces:**
- Consumes: `state.timer`, `state.elapsed`, `Block.minutes` (Task 1–2); `fmt`, `elapsedNow`, `remaining` уже на `Runbook`.
- Produces: поведение — `T` старт/пауза, `R` сброс текущего блока (обнуляет `elapsed[block.id]`), переход на другой блок ставит таймер на паузу и записывает `elapsed`; при `minutes === 0` таймер скрыт.

- [ ] **Step 1: Падающие тесты чистых функций таймера**

Добавить в `test/app.test.mjs`:

```js
test('fmt форматирует секунды как mm:ss со знаком', () => {
  assert.equal(Runbook.fmt(0), '00:00');
  assert.equal(Runbook.fmt(65), '01:05');
  assert.equal(Runbook.fmt(-80), '-01:20');
  assert.equal(Runbook.fmt(3600), '60:00');
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
```

- [ ] **Step 2: Запустить — `fmt`/`elapsedNow`/`remaining` уже есть из Task 2, тесты должны ПРОЙТИ сразу; если падают — исправить функции, не тесты**

Run: `node --test test/app.test.mjs`
Expected: PASS.

- [ ] **Step 3: Реализация DOM-части таймера**

Заменить заглушки в `app.js`:

```js
  function renderTimer() {
    const b = block();
    const t = $('timer');
    t.classList.toggle('hidden', b.minutes === 0);
    if (b.minutes === 0) { stopTick(); return; }
    const rem = remaining(b.minutes, elapsedNow(state.timer, Date.now()));
    t.textContent = fmt(rem);
    t.classList.toggle('over', rem < 0);
    t.classList.toggle('running', state.timer.running);
    if (state.timer.running && !tick) tick = setInterval(renderTimer, 500);
    if (!state.timer.running) stopTick();
  }
  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }

  function stopTimerIntoElapsed() {
    const b = block();
    const sec = Math.round(elapsedNow(state.timer, Date.now()));
    if (sec > 0) state.elapsed[b.id] = sec;
    state.timer = { running: false, startedAt: null, elapsedBefore: sec };
    stopTick();
  }

  function toggleTimer() {
    if (block().minutes === 0) return;
    if (state.timer.running) {
      stopTimerIntoElapsed();
    } else {
      state.timer = { running: true, startedAt: Date.now(), elapsedBefore: state.elapsed[block().id] || 0 };
    }
    render();
  }

  function resetTimer() {
    delete state.elapsed[block().id];
    state.timer = { running: false, startedAt: null, elapsedBefore: 0 };
    stopTick();
    render();
  }
```

В `init()` перед `render()` добавить восстановление запущенного таймера после F5: ничего дополнительно не нужно — `state.timer.running` и `startedAt` уже в localStorage, `renderTimer` сам запустит `setInterval`.

- [ ] **Step 4: Запустить все тесты**

Run: `node --test test/`
Expected: PASS.

- [ ] **Step 5: Ручная проверка**

На блоке `A0`: `T` — отсчёт идёт от `05:00` вниз, цифры зелёные; `T` — пауза; `R` — снова `05:00`; подождать перерасход (временно поставить блоку 0 минут нельзя — вместо этого на `A7` подождать или проверить `fmt(-80)` тестом) — при отрицательном остатке цифры красные; `→` на `A1` — у `A0` в списке появился зелёный бейдж с фактом, в шапке «факт» увеличился; `T`, затем F5 — таймер продолжает идти; на `A-pre` таймер скрыт.

- [ ] **Step 6: Commit**

```bash
git add app.js test/app.test.mjs
git commit -m "feat: block timer with overrun, per-block elapsed and persistence"
```

---

### Task 5: README, финальная проверка по spec §8, коммит

**Files:**
- Create: `README.md`
- Modify: `content.js` при необходимости (правки по итогам прогона)

**Interfaces:**
- Consumes: всё выше.
- Produces: готовая папка `jmix-demo-runbook/`, которую можно перенести куда угодно.

- [ ] **Step 1: README**

```markdown
# Jmix Demo Runbook

Офлайн-runbook двух демо Jmix: **A — AI × Jmix** (60–90 мин) и **B — Jmix с нуля** (40–60 мин).

## Запуск

Открыть `index.html` в браузере с диска. Интернет не нужен.

## Клавиши

| Клавиша | Действие |
|---|---|
| `←` / `→` | предыдущий / следующий блок |
| `N` (`т`) | показать/скрыть заметки докладчика и команды |
| `T` (`е`) | таймер блока: старт / пауза |
| `R` (`к`) | сбросить таймер текущего блока |
| `F` (`а`) | полный экран |
| `1` / `2` | демо A / демо B |

Состояние (демо, блок, таймер, заметки) хранится в `localStorage` и переживает F5.

## Как править контент

Всё содержимое — в `content.js`, объект `DEMOS`. У блока: `id`, `title`, `minutes`, `optional`, `exit`, `slide` (3–6 буллетов), `notes`, `actions` (`shell` | `git` | `url` | `studio` | `say`). После правки:

```bash
node --test test/
```

Тест проверяет суммы минут, уникальность id, размер слайдов и ссылки на ветки/стенд из spec.

## Документы

- Spec: `docs/superpowers/specs/2026-10-07-jmix-demo-runbook-design.md`
- План: `docs/superpowers/plans/2026-10-07-jmix-demo-runbook.md`
```

- [ ] **Step 2: Прогон чек-листа spec §8**

Открыть `index.html` с диска и отметить:
- DevTools → Network: только три локальных файла; Console без ошибок.
- `←`/`→`, клик по списку, `1`/`2`, `N`, `T`/`R`, `F` — работают.
- Таймер: обратный отсчёт, красный после нуля, пауза/сброс.
- Copy кладёт команду в буфер.
- F5 восстанавливает демо/блок/таймер/заметки.
- `node --test test/` — зелёный; суммы минут = spec.

Найденные расхождения в текстах — править в `content.js`, перезапускать тесты.

- [ ] **Step 3: Commit**

```bash
git add README.md content.js
git commit -m "docs: add runbook README and finalize content after manual pass"
```
