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
