// Fallback screenshots for demo A (and the B4 teaser) from the running demo/ai-app stand; see assets/README.md.
// `./demo prepare` runs the parts a4 b4 a5.
// usage: node tools/capture-fallbacks.mjs [a4] [b4] [a5] [a6]      (no arguments: all four)
//   a4  CRM AI questions 1–4 as admin and 1–2 as alice, each in a new dialog (they also stay in «История»)
//       → a4-admin-q1.png … a4-admin-q4.png, a4-alice-q1.png, a4-alice-q2.png      needs SPRING_AI_OPENAI_APIKEY
//   b4  the B4 teaser question as admin → b4-admin-revenue.png                    needs SPRING_AI_OPENAI_APIKEY
//   a5  «Выручка клиентов (AI JPQL)»: the stored query, a run as admin and as alice → a5-*.png   no model call
//   a6  the A6 result after a scenario run (before ./demo reset): «Каталог», «Демо-сделки» → a6-result-*.png   no model call
// A key is checked only for presence in this shell (the stand reads it at its own start) and never printed.
// env: STAND_URL (default http://localhost:8091/b2b-crm/), ASSETS_DIR (default assets/ next to tools/),
//      ANSWER_TIMEOUT_S (default 300)
// Prints one line per saved file; exit code 1 if any part failed.
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './browser.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const slash = u => (u.endsWith('/') ? u : `${u}/`);
const STAND = slash(process.env.STAND_URL || 'http://localhost:8091/b2b-crm/');
const ASSETS = process.env.ASSETS_DIR || join(root, 'assets');
const ANSWER_MS = (Number(process.env.ANSWER_TIMEOUT_S) || 300) * 1000;
const VIEWPORT = { width: 1440, height: 900 };
const SETTLE_MS = 1500;

// Questions exactly as content.js asks them (checked against content.js below).
const Q = {
  q1: 'Сколько у нас клиентов и кто топ-3 по сумме заказов?',
  q2: 'Сколько заказов в статусах «Новый» и «Принят» и на какую сумму?',
  q3: 'Как часто покупает Connelly LLC? Покажи последние заказы со ссылками',
  q4: 'Подготовь Client 360 по этому клиенту за последний год',
  b4: 'Какие клиенты лидеры по выручке, а какие аутсайдеры — и по каким товарным категориям?',
};
const Q4_CLIENT = 'Connelly LLC';
const REPORT = 'Выручка клиентов (AI JPQL)';
const DATES = ['01.01.2024', '31.12.2026'];
const A6_DEALS = 'Демо-сделки';
const A6_DEAL = 'Первая поставка';
const SHOWN_AS = { admin: 'admin', alice: 'Alice Brown' }; // the user menu shows these names
const NO_KEY = 'Ключ OpenAI API не настроен';
const ANSWER_ERROR = 'произошла техническая ошибка';

const PARTS = ['a4', 'b4', 'a5', 'a6'];
const args = process.argv.slice(2);
const bad = args.filter(a => !PARTS.includes(a));
if (bad.length) {
  console.error(`unknown part: ${bad.join(', ')}\nusage: node tools/capture-fallbacks.mjs [${PARTS.join('] [')}]`);
  process.exit(2);
}
const parts = args.length ? PARTS.filter(p => args.includes(p)) : PARTS;

const content = readFileSync(join(root, 'content.js'), 'utf8');
const drift = Object.values(Q).filter(q => !content.includes(q));
if (drift.length) {
  console.error(`content.js no longer asks:\n  ${drift.join('\n  ')}\nupdate Q in tools/capture-fallbacks.mjs`);
  process.exit(2);
}
if (parts.some(p => p === 'a4' || p === 'b4') && !process.env.SPRING_AI_OPENAI_APIKEY) {
  console.error('SPRING_AI_OPENAI_APIKEY is missing in this shell. Export it, restart the stand from this shell '
    + '(the stand reads the key at its start), then run again. Without a key: node tools/capture-fallbacks.mjs a5 a6');
  process.exit(1);
}

mkdirSync(ASSETS, { recursive: true });
const shot = async (page, name) => {
  await page.waitForTimeout(SETTLE_MS);
  await page.screenshot({ path: join(ASSETS, name) });
  console.log(join(ASSETS, name));
};

async function login(browser, base, user) {
  const page = await (await browser.newContext({ viewport: VIEWPORT, locale: 'ru-RU' })).newPage();
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
  } catch (e) {
    throw new Error(`${base} does not answer: start the stand first (${e.message.split('\n')[0]})`);
  }
  await page.locator('#usernameField input').waitFor({ timeout: 60000 });
  const locale = page.locator('#localeSelect');
  if (await locale.count() && !(await locale.innerText()).includes('Русский')) {
    await locale.click();
    await page.locator('vaadin-select-item', { hasText: 'Русский' }).first().click();
  }
  // The form prefills admin / admin once it is live; typing before that, or fill() alone, logs in as admin.
  await page.waitForFunction(() => document.querySelector('#usernameField input')?.value, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
  for (const field of ['#usernameField input', '#passwordField input']) {
    await page.locator(field).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.locator(field).pressSequentially(user);
    await page.keyboard.press('Tab');
  }
  await page.locator('#submitBtn').click();
  await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 30000 })
    .catch(() => { throw new Error(`login as ${user} / ${user} failed on ${base}`); });
  const who = (await page.locator('#userMenu').innerText().catch(() => '')).trim();
  if (who !== SHOWN_AS[user]) throw new Error(`logged in as «${who}» instead of «${SHOWN_AS[user]}» on ${base}`);
  return page;
}

const notifications = page => page.evaluate(() =>
  [...document.querySelectorAll('vaadin-notification-card')].map(n => n.innerText).join(' | '));

async function addClientToContext(page, client) {
  await page.locator('vaadin-menu-bar.ai-timeline-add-menu vaadin-menu-bar-button').first().click();
  await page.locator('vaadin-menu-bar-item:visible', { hasText: 'Добавить сущность CRM' }).first().hover();
  await page.locator('vaadin-menu-bar-item:visible').filter({ hasText: /^\s*Клиенты\s*$/ }).first().click();
  const search = page.locator('input[placeholder="Поиск по названию"]:visible').last();
  await search.fill(client);
  await search.press('Enter');
  await page.waitForFunction(name => [...document.querySelectorAll('vaadin-grid')].some(g => g.offsetParent && g.size === 1
    && [...g.querySelectorAll('vaadin-grid-cell-content')].some(c => c.textContent.includes(name))), client, { timeout: 15000 })
    .catch(() => { throw new Error(`client «${client}» not found in the lookup (stand data reset or changed?)`); });
  await page.locator('vaadin-grid-cell-content:visible vaadin-checkbox').nth(1).click(); // 0 is «select all»
  await page.locator('vaadin-button:visible', { hasText: 'Выбрать' }).last().click();
  // Typing while the lookup is still closing loses the message: wait until the dialog is gone.
  await page.locator('vaadin-dialog-overlay[opened]').waitFor({ state: 'detached', timeout: 15000 })
    .catch(() => { throw new Error(`the Clients lookup did not close after «Выбрать» (${client})`); });
}

// One question in a new dialog; resolves when the answer is in and the composer is enabled again.
async function ask(page, question, client) {
  await page.goto(new URL('ai-conversations', STAND).href);
  const input = page.locator('vaadin-text-area textarea:visible').first();
  await input.waitFor({ timeout: 30000 });
  await page.waitForTimeout(SETTLE_MS);
  if ((await notifications(page)).includes(NO_KEY) || await input.isDisabled()) {
    throw new Error(`CRM AI says «${NO_KEY}»: restart the stand from a shell with SPRING_AI_OPENAI_APIKEY exported`);
  }
  if (client) await addClientToContext(page, client);
  await input.fill(question);
  await input.press('Enter');
  await page.waitForURL(/\/ai-conversations\/[0-9a-f-]{36}/, { timeout: 30000 });
  await page.waitForFunction(() => {
    const t = document.querySelector('vaadin-text-area textarea');
    return document.querySelector('.ai-timeline-message-row-assistant') && t && !t.disabled;
  }, null, { timeout: ANSWER_MS, polling: 500 })
    .catch(() => { throw new Error(`no answer within ${ANSWER_MS / 1000} s: «${question}»`); });
  const answer = await page.locator('.ai-timeline-message-row-assistant').last().innerText();
  if (answer.includes(ANSWER_ERROR)) throw new Error(`CRM AI answered with an error (model or network): «${question}»`);
}

async function runReport(page) {
  const dates = page.locator('vaadin-dialog[opened]').last().locator('vaadin-date-picker input');
  await dates.first().waitFor({ timeout: 20000 });
  for (const [i, value] of DATES.entries()) {
    await dates.nth(i).fill(value);
    await dates.nth(i).press('Enter');
  }
  await page.locator('vaadin-button:visible', { hasText: 'Выполнить' }).last().click();
  await page.locator('vaadin-grid-cell-content:visible', { hasText: 'Сумма заказов' }).first().waitFor({ timeout: 60000 })
    .catch(() => { throw new Error(`«${REPORT}» showed no result table`); });
}

const run = {
  async a4(browser) {
    const admin = await login(browser, STAND, 'admin');
    for (const n of ['q1', 'q2', 'q3', 'q4']) {
      await ask(admin, Q[n], n === 'q4' ? Q4_CLIENT : null);
      await shot(admin, `a4-admin-${n}.png`);
    }
    const alice = await login(browser, STAND, 'alice');
    for (const n of ['q1', 'q2']) {
      await ask(alice, Q[n]);
      await shot(alice, `a4-alice-${n}.png`);
    }
  },
  async b4(browser) {
    const admin = await login(browser, STAND, 'admin');
    await ask(admin, Q.b4);
    await shot(admin, 'b4-admin-revenue.png');
  },
  async a5(browser) {
    const admin = await login(browser, STAND, 'admin');
    await admin.goto(new URL('report/reports', STAND).href);
    const row = admin.locator('vaadin-grid-cell-content', { hasText: REPORT }).first();
    await row.waitFor({ timeout: 20000 }).catch(() => {
      throw new Error(`no report «${REPORT}»: the stand imports it at start when it is missing; restart the stand (./demo down, ./demo up a)`);
    });
    await row.click();
    await admin.locator('#editBtn').click();
    await admin.locator('vaadin-tab', { hasText: 'Полосы' }).first().click();
    await admin.locator('text="clients" >> visible=true').first().click();
    await admin.getByText('Сгенерированный запрос').first().waitFor();
    await shot(admin, 'a5-ai-jpql-query.png');
    await admin.locator('vaadin-button', { hasText: 'Запустить отчёт' }).first().click();
    await runReport(admin);
    await shot(admin, 'a5-admin-result.png');
    // the editor is left without saving: the browser context is discarded at the end

    const alice = await login(browser, STAND, 'alice');
    await alice.goto(new URL('report/run', STAND).href);
    await alice.locator('vaadin-grid-cell-content', { hasText: REPORT }).first().click();
    await alice.locator('#runReport').click();
    await runReport(alice);
    await shot(alice, 'a5-alice-result.png');
  },
  async a6(browser) {
    const admin = await login(browser, STAND, 'admin');
    const catalog = admin.locator('text="Каталог" >> visible=true').first();
    await catalog.waitFor({ timeout: 20000 });
    const deals = admin.locator(`text="${A6_DEALS}" >> visible=true`).first();
    if (!(await deals.isVisible())) await catalog.click(); // the group may already be expanded; a click collapses it
    await deals.waitFor({ timeout: 10000 }).catch(() => {
      throw new Error(`no «${A6_DEALS}» in «Каталог» on ${STAND}: run the A6 scenario on the stand first`);
    });
    await shot(admin, 'a6-result-menu.png');
    await deals.click();
    await admin.locator('vaadin-grid-cell-content:visible', { hasText: A6_DEAL }).first().waitFor({ timeout: 20000 })
      .catch(() => { throw new Error(`«${A6_DEALS}» has no «${A6_DEAL}»: finish step 9 of the A6 scenario on the stand`); });
    await shot(admin, 'a6-result-deals.png');
  },
};

const browser = await launch().catch(e => {
  console.error(`FAIL browser: ${e.message.split('\n')[0]}`);
  process.exit(1);
});
let failed = 0;
try {
  for (const part of parts) {
    try {
      await run[part](browser);
    } catch (e) {
      failed++;
      console.error(`FAIL ${part}: ${e.message.split('\n')[0]}`);
    } finally {
      for (const context of browser.contexts()) await context.close();
    }
  }
} finally {
  await browser.close();
}
process.exitCode = failed ? 1 : 0;
