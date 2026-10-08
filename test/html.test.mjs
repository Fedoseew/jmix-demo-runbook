import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readText } from './load.mjs';

const html = readText('index.html');

test('нет внешних ресурсов', () => {
  assert.ok(!/<script[^>]+src=["']https?:/i.test(html), 'внешний script');
  assert.ok(!/<link[^>]+href=["']https?:/i.test(html), 'внешний link');
  assert.ok(!/@import\s+url\(\s*["']?https?:/i.test(html), 'внешний @import');
  assert.ok(!/fonts\.googleapis|cdn\./i.test(html), 'CDN/шрифты');
});

const EXTERNAL = /\bfetch\(|XMLHttpRequest|\bimport\(|src=["']?(https?:)?\/\/|url\(\s*["']?(https?:)?\/\//i;
for (const file of ['index.html', 'app.js', 'content.js']) {
  // ponytail: content.js проверяет test/content.test.mjs; здесь только сетевые вызовы, если файл уже есть.
  const exists = existsSync(new URL(`../${file}`, import.meta.url));
  test(`${file}: нет сетевых запросов`, { skip: !exists && 'файла нет' }, () => {
    assert.ok(!EXTERNAL.test(readText(file)), `${file}: ${readText(file).match(EXTERNAL)?.[0]}`);
  });
}

test('подключает content.js, core.js и app.js относительными путями, в этом порядке', () => {
  const c = html.indexOf('src="./content.js"');
  const k = html.indexOf('src="./core.js"');
  const a = html.indexOf('src="./app.js"');
  assert.ok(c > -1 && k > c && a > k);
});

test('базовые атрибуты документа', () => {
  assert.ok(/<html[^>]+lang="ru"/.test(html));
  assert.ok(/<meta[^>]+charset="utf-8"/i.test(html));
  assert.ok(/<meta[^>]+name="viewport"/.test(html));
  assert.ok(/<title>[^<]+<\/title>/.test(html));
});

test('есть корень, статус и SVG-спрайт с логотипом и иконками шагов', () => {
  for (const id of ['app', 'status']) assert.ok(html.includes(`id="${id}"`), `нет id="${id}"`);
  for (const id of ['logo', 'logo-mark', 'i-shell', 'i-git', 'i-url', 'i-studio', 'i-say', 'i-prompt', 'i-copy', 'i-check', 'i-chev', 'i-exit']) {
    assert.ok(html.includes(`id="${id}"`), `нет символа ${id}`);
  }
});

const cssVar = name => html.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();

// WCAG 2.x relative luminance / contrast ratio.
const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('контраст цветов текста ≥ 4.5:1 на всех фонах консоли', () => {
  for (const fg of ['ink', 'muted', 'white', 'yellow', 'pink-text', 'green', 'cyan']) {
    for (const bg of ['bg', 'panel', 'panel-2']) {
      const ratio = contrast(cssVar(fg), cssVar(bg));
      assert.ok(ratio >= 4.5, `--${fg} на --${bg}: ${ratio.toFixed(2)}`);
    }
  }
});

test('текст консоли не мельче 14px (spec §10.5)', () => {
  const from = html.indexOf('КОНСОЛЬ ДОКЛАДЧИКА');
  assert.ok(from > -1, 'нет раздела CSS консоли');
  const css = html.slice(from, html.indexOf('</style>'));
  const sizes = [
    ...[...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => m[1]),
    ...[...css.matchAll(/font:\s*\d+\s+(\d+(?:\.\d+)?)px/g)].map(m => m[1]),
  ].map(Number);
  assert.ok(sizes.length > 20, `нашлось только ${sizes.length} размеров`);
  assert.deepEqual(sizes.filter(px => px < 14), []);
});

test('текст панели зеркала не мельче 18px (spec §10.5)', () => {
  const from = html.indexOf('ПАНЕЛЬ ДЛЯ ЗЕРКАЛА');
  assert.ok(from > -1, 'нет раздела CSS панели');
  const css = html.slice(from, html.indexOf('</style>'));
  const sizes = [
    ...[...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => m[1]),
    ...[...css.matchAll(/font:\s*\d+\s+(\d+(?:\.\d+)?)px/g)].map(m => m[1]),
  ].map(Number);
  assert.ok(sizes.length >= 6, `нашлось только ${sizes.length} размеров`);
  assert.deepEqual(sizes.filter(px => px < 18), []);
});

test('клавиша C в кнопке копирования панели перебивает 14px консоли (spec §10.5)', () => {
  const rule = html.match(/\.dock \.copy \.ck\s*\{([^}]*)\}/);
  assert.ok(rule, 'нет правила .dock .copy .ck');
  const px = rule[1].match(/font-size:\s*(\d+(?:\.\d+)?)px/);
  assert.ok(px, '.dock .copy .ck не задаёт font-size: сработает 14px из .copy .ck');
  assert.ok(Number(px[1]) >= 18, `.dock .copy .ck: ${px[1]}px`);
});

const cssRule = selector => html.match(new RegExp(`${selector.replace(/[.*]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1];

test('панель зеркала не показывает перерасход: без минуса и розового (spec §10.1)', () => {
  const from = html.indexOf('ПАНЕЛЬ ДЛЯ ЗЕРКАЛА');
  assert.doesNotMatch(html.slice(from, html.indexOf('</style>')), /\.late\b/);
  const paint = readText('app.js').match(/function paintDockTimer[\s\S]*?\n  \}/)?.[0];
  assert.ok(paint, 'нет paintDockTimer');
  assert.doesNotMatch(paint, /late/);
  assert.match(paint, /Math\.max\(0,/);
});

test('панель: текущий шаг Studio и реплика не обрезаются, копируемый — до 3 строк, «Далее» — строка', () => {
  assert.doesNotMatch(cssRule('.d-txt') ?? '', /line-clamp/);
  assert.ok(!/\.d-cur[^{]*\{[^}]*line-clamp/.test(html), '.d-cur обрезается');
  assert.match(cssRule('.d-txt.clip') ?? '', /-webkit-line-clamp:\s*3/);
  assert.match(html, /\.d-nx\s*\{[^}]*-webkit-line-clamp:\s*1/);
  assert.match(cssRule('.dock') ?? '', /max-height:\s*30vh/);
  const app = readText('app.js');
  assert.match(app, /dockText\(a, copyable \? 'd-cur clip' : 'd-cur'\)/);
});

test('светлая панель зеркала: контраст текста ≥ 4.5:1 (spec §10.5)', () => {
  const rule = html.match(/body\.light \.dock\s*\{([^}]*)\}/)?.[1];
  assert.ok(rule, 'нет body.light .dock');
  const tok = name => rule.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`))?.[1];
  for (const fg of ['ink', 'muted', 'white', 'cyan']) {
    for (const bg of ['bg', 'panel', 'panel-2']) {
      assert.ok(tok(fg) && tok(bg), `нет --${fg} или --${bg}`);
      const ratio = contrast(tok(fg), tok(bg));
      assert.ok(ratio >= 4.5, `светлая панель: --${fg} на --${bg}: ${ratio.toFixed(2)}`);
    }
  }
});

test('подсказка клавиш сцены — по движению мыши, а не пока курсор над слайдом', () => {
  assert.doesNotMatch(html, /\.stage:hover\s+\.st-hint/);
  assert.match(html, /html\.pointer body\.view-stage \.st-hint\s*\{\s*opacity:\s*1/);
  assert.match(html, /:root:fullscreen:not\(\.pointer\) body\.view-stage\s*\{\s*cursor:\s*none/);
});

test('подсказка клавиш сцены — в строке шапки, не над пунктами слайда', () => {
  const rule = cssRule('.st-hint') ?? '';
  assert.doesNotMatch(rule, /bottom:\s*4cqw/, 'в низу слайда пилюля ложится на последний пункт (A4, A5)');
  assert.match(rule, /top:\s*3\.3cqw/, 'подсказка — в строке счётчика и логотипа');
});

test('перерасход в консоли красит и полосу блока', () => {
  assert.match(cssRule('.t-bar.late i') ?? '', /background:\s*var\(--pink\)/);
});

test('светлая сцена: «сейчас» на полосе ярче «пройдено» (.42)', () => {
  const alpha = Number(cssRule('.stage.light .st-seg.cur')?.match(/rgb\(253 180 43 \/ (\.\d+)\)/)?.[1]);
  assert.ok(alpha > 0.42, `альфа ${alpha}`);
});

test('сегмент «сейчас» на полосе сцены виден и при 0% (spec §10.1)', () => {
  const rule = cssRule('.st-seg.cur');
  assert.ok(rule, 'нет правила .st-seg.cur');
  assert.match(rule, /background:\s*rgb\(253 180 43 \/ \.\d+\)/);
});

// U10: в зеркале консоли нет, а легенда панели и подсказка сцены показывают не все клавиши.
test('справка «?» перечисляет каждую клавишу, которую читает app.js (U10)', () => {
  const app = readText('app.js');
  const codes = new Set([...app.matchAll(/\b(Key[A-Z]|Digit\d|Arrow(?:Left|Right)|Space|Slash)\b/g)].map(m => m[1]));
  assert.ok(codes.has('Slash'), 'app.js не читает Slash (?)');
  const label = c => ({ ArrowLeft: '←', ArrowRight: '→', Space: 'Space', Slash: '?' }[c] ?? c.replace(/^(Key|Digit)/, ''));
  const dialog = html.match(/<dialog id="keys"[\s\S]*?<\/dialog>/)?.[0];
  assert.ok(dialog, 'нет <dialog id="keys">');
  const missing = [...codes].map(label).filter(k => !dialog.includes(`<kbd>${k}</kbd>`));
  assert.deepEqual(missing, []);
  assert.match(app, /st-hint[^\n]*<kbd>\?<\/kbd>/, 'подсказка сцены не называет ?');
  assert.match(app, /d-legend[^\n]*<kbd>\?<\/kbd>/, 'легенда панели не называет ?');
});

const appSrc = readText('app.js');
const fnSrc = name => appSrc.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n  \\}`))?.[0] ?? '';

test('meta description и Open Graph: превью ссылки, без внешних запросов', () => {
  const meta = (attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]+)">`))?.[1];
  assert.ok(meta('name', 'description')?.length > 50, 'нет description');
  assert.ok(meta('property', 'og:title'), 'нет og:title');
  assert.ok(meta('property', 'og:description')?.length > 50, 'нет og:description');
  assert.equal(meta('property', 'og:type'), 'website');
  assert.equal(meta('property', 'og:url'), 'https://fedoseew.github.io/jmix-demo-runbook/');
  assert.equal(meta('property', 'og:image'), 'https://fedoseew.github.io/jmix-demo-runbook/docs/images/stage.jpg');
});

test('заставка: QR репозитория из спрайта (офлайн) и подпись с адресом', () => {
  assert.match(html, /<symbol id="qr-repo" viewBox="0 0 41 41"/);
  assert.match(fnSrc('stageHTML'), /<use href="#qr-repo"\/>/);
  assert.match(fnSrc('stageHTML'), /github\.com\/Fedoseew\/<wbr>jmix-demo-runbook/);
  const w = Number(cssRule('.h-qr')?.match(/width:\s*(\d+(?:\.\d+)?)cqw/)?.[1]);
  assert.ok(w >= 16, `QR ${w}cqw: мелкий для зала`);
});

test('консоль: ссылка на GitHub в шапке открывается в новой вкладке; на сцене ссылок нет', () => {
  assert.match(fnSrc('consoleHTML'), /<a class="c-gh" href="https:\/\/github\.com\/Fedoseew\/jmix-demo-runbook" target="_blank" rel="noopener"/);
  assert.doesNotMatch(fnSrc('stageHTML'), /<a\s/);
  assert.ok(html.includes('id="i-github"'), 'нет иконки i-github');
});

test('шапка шагов A6: счётчик не сжимается, подсказка уступает место тумблеру 8′ (1024–1279px)', () => {
  assert.match(html, /\.acts \.col-head \.count \{ flex-shrink: 0; \}/);
  assert.match(html, /@media \(max-width: 1279px\) \{ \.acts \.col-head \.hint \.sp \{ display: none; \} \}/);
  assert.match(html, /@media \(max-width: 1119px\) \{ \.acts \.col-head:has\(\.tgl\) \.hint \{ display: none; \} \}/);
  assert.match(fnSrc('actionsHTML'), /<span class="sp">/);
});

test('полоса процесса — под чертой заголовка; на светлой сцене стрелки ≥ 3:1 к фону (WCAG 1.4.11)', () => {
  assert.match(fnSrc('stageHTML'), /st-rule"><\/div>\$\{flow\}<ul class="st-list"/);
  const arrow = cssRule('.stage.light')?.match(/--s-arrow:\s*(#[0-9A-Fa-f]{6})/)?.[1];
  assert.ok(arrow, 'нет --s-arrow у .stage.light');
  for (const bg of ['#FFFFFF', '#ECEDF6']) assert.ok(contrast(arrow, bg) >= 3, `${arrow} на ${bg}: ${contrast(arrow, bg).toFixed(2)}`);
});
