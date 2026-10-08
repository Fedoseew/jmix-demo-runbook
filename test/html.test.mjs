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
