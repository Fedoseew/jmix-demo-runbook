// Screenshot of the runbook in a given state, after pressing keys.
// usage: node tools/shot.mjs <url|path> <out.png|out.jpg> [stateJSON|-] [width] [height] [codes]
//   stateJSON  object for localStorage['jmix-runbook/v1'], e.g. '{"demo":"a","index":6,"steps":{"A4":3}}'
//   codes      comma-separated KeyboardEvent.code values pressed after load, e.g. 'KeyN,KeyJ'
// A console URL (?view=console) gets a fresh stage heartbeat, so it shows the stage as online.
// env SHOT_DELAY_MS  pause before the shot, default 400; 3000 lets the stage key hint fade out.
// Prints the output path, then page errors and external requests (exit code 1 if there are any).
import { launch, toUrl, watch } from './browser.mjs';

const STORAGE_KEY = 'jmix-runbook/v1';
const BEAT_KEY = 'jmix-runbook/stage';
const JPEG_QUALITY = 82;
const KEY_PAUSE_MS = 120;
const SETTLE_MS = Number(process.env.SHOT_DELAY_MS) || 400;

const USAGE = 'usage: node tools/shot.mjs <url|path> <out.png|out.jpg> [stateJSON|-] [width] [height] [codes]';
const [target, out, state = '-', w = '1280', h = '720', codes = ''] = process.argv.slice(2);
const isSize = v => Number.isInteger(Number(v)) && Number(v) > 0;
if (!target || !out) {
  console.error(USAGE);
  process.exit(2);
}
if (!isSize(w) || !isSize(h)) {
  console.error(`width and height must be positive integers, got ${w} × ${h}\n${USAGE}`);
  process.exit(2);
}
if (state !== '-') {
  try { JSON.parse(state); } catch (e) { console.error(`stateJSON is not valid JSON: ${e.message}`); process.exit(2); }
}

const url = toUrl(target);
const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
  const problems = watch(page, url);
  await page.goto(url);
  const beat = /[?&]view=console\b/.test(url) ? BEAT_KEY : null;
  if (state !== '-' || beat) {
    await page.evaluate(([k, s, b]) => {
      if (s !== '-') localStorage.setItem(k, s);
      if (b) localStorage.setItem(b, String(Date.now()));
    }, [STORAGE_KEY, state, beat]);
    await page.reload();
  }
  for (const code of codes.split(',').filter(Boolean)) {
    await page.keyboard.press(code);
    await page.waitForTimeout(KEY_PAUSE_MS);
  }
  await page.waitForTimeout(SETTLE_MS);
  const jpeg = /\.jpe?g$/i.test(out);
  await page.screenshot({ path: out, type: jpeg ? 'jpeg' : 'png', ...(jpeg && { quality: JPEG_QUALITY }) });
  console.log(out);
  if (problems.length) { console.log(problems.join('\n')); process.exitCode = 1; }
} finally {
  await browser.close();
}
