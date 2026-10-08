// Two-window smoke test: stage + console stay in sync through localStorage and survive a reload.
// usage: node tools/smoke.mjs [url|path]   (default: index.html next to this folder)
// Prints PASS/FAIL per check; exit code 1 if any check fails.
import { fileURLToPath } from 'node:url';
import { launch, toUrl, watch } from './browser.mjs';

const STORAGE_KEY = 'jmix-runbook/v1';
const BLOCK = 'A4';
const STEPS_FORWARD = 3;
const SYNC_MS = 300;

const url = toUrl(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)));
let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  const stage = await context.newPage();
  watch(stage, url, problems);
  await stage.goto(url);
  check('stage renders a slide', await stage.locator('.stage').count() > 0);

  const [cons] = await Promise.all([context.waitForEvent('page'), stage.keyboard.press('KeyP')]);
  watch(cons, url, problems);
  await cons.waitForSelector('.console');
  check('P opens the console window', /[?&]view=console/.test(cons.url()), cons.url());

  const go = cons.locator('.ag-seg', { has: cons.locator('b', { hasText: new RegExp(`^${BLOCK}$`) }) });
  await go.click();
  await stage.waitForTimeout(SYNC_MS);
  const title = p => p.evaluate(() => document.title);
  check(`console jumps to ${BLOCK}`, (await title(cons)).startsWith(BLOCK), await title(cons));
  check(`stage follows to ${BLOCK}`, (await title(stage)).startsWith(BLOCK), await title(stage));

  await cons.keyboard.press('KeyT');
  for (let i = 0; i < STEPS_FORWARD; i++) await cons.keyboard.press('KeyJ');
  await stage.waitForTimeout(SYNC_MS);
  const saved = await cons.evaluate(k => JSON.parse(localStorage.getItem(k)), STORAGE_KEY);
  check('T starts the timer', saved?.timer?.running === true);
  const activeStep = () => cons.locator('.steps .step.active').getAttribute('data-step');
  check(`J×${STEPS_FORWARD} moves the console step`, await activeStep() === String(STEPS_FORWARD), `step ${await activeStep()}`);

  await stage.keyboard.press('KeyN');
  const dockStep = () => stage.locator('[data-dock-main] .s-n').innerText();
  const want = String(STEPS_FORWARD + 1).padStart(2, '0');
  check('stage dock shows the same step', (await dockStep()).startsWith(want), await dockStep());

  await Promise.all([stage.reload(), cons.reload()]);
  await cons.waitForSelector('.console');
  await stage.waitForSelector('.dock');
  const after = await cons.evaluate(k => JSON.parse(localStorage.getItem(k)), STORAGE_KEY);
  check('reload keeps the block', (await title(cons)).startsWith(BLOCK) && (await title(stage)).startsWith(BLOCK));
  check('reload keeps the step', await activeStep() === String(STEPS_FORWARD) && (await dockStep()).startsWith(want));
  check('reload keeps the timer running', after?.timer?.running === true);
  check('no page errors or external requests', problems.length === 0, problems.join('; '));
} catch (e) {
  check('smoke run', false, e.message.split('\n')[0]);
} finally {
  await browser.close();
}
process.exitCode = failed ? 1 : 0;
