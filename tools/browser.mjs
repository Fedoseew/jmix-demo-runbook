// Shared Chromium launcher for tools/shot.mjs and tools/smoke.mjs.
// Playwright: env PLAYWRIGHT_MODULE (path or package name), else `playwright`, else `playwright-core`.
// Browser: env CHROME_PATH (optional), else the browser Playwright installed.
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// An existing file (node_modules/playwright-core/index.mjs, ./x.mjs, /abs/x.mjs) is a path; anything else a package name.
const isPath = spec => isAbsolute(spec) || spec.startsWith('.') || existsSync(spec);
const asSpecifier = spec => (isPath(spec) ? pathToFileURL(resolve(spec)).href : spec);

async function loadPlaywright() {
  const spec = process.env.PLAYWRIGHT_MODULE;
  if (spec) return import(asSpecifier(spec));
  for (const name of ['playwright', 'playwright-core']) {
    try { return await import(name); } catch (_) { /* try the next one */ }
  }
  throw new Error('Playwright not found: run ./demo setup (or `npm i --no-save playwright && npx playwright install chromium` '
    + 'in the runbook folder), or set PLAYWRIGHT_MODULE=/path/to/playwright-core/index.mjs');
}

export async function launch() {
  const { chromium } = await loadPlaywright();
  return chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
}

// A local path (index.html, ./index.html?view=console, /abs/index.html) becomes a file:// URL; URLs pass through.
// ponytail: the scheme needs 2+ letters so a Windows drive letter (C:\...) counts as a path.
export function toUrl(arg) {
  if (/^[a-z][a-z0-9+.-]+:/i.test(arg)) return arg;
  const cut = arg.search(/[?#]/); // keep ?view=console out of the file name
  const path = cut < 0 ? arg : arg.slice(0, cut);
  return pathToFileURL(resolve(path)).href + (cut < 0 ? '' : arg.slice(cut));
}

// Collects page errors, console errors and requests that leave the page's own origin.
export function watch(page, url, problems = []) {
  const origin = new URL(url).origin;
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('request', r => {
    const u = r.url();
    if (!/^(file|data|blob|about):/.test(u) && !u.startsWith(origin)) problems.push(`external request: ${u}`);
  });
  return problems;
}
