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

/** Выполняет несколько файлов проекта в одном контексте по порядку и возвращает его globalThis. */
export function loadScripts(relPaths, context = {}) {
  const ctx = vm.createContext({ console, ...context });
  ctx.globalThis = ctx;
  for (const relPath of relPaths) {
    vm.runInContext(readFileSync(resolve(root, relPath), 'utf8'), ctx, { filename: relPath });
  }
  return ctx;
}
