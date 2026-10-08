# AGENTS.md

Instructions for AI coding agents working in this repository.

## What this is

An offline presenter runbook for two live Jmix demos: A "AI × Jmix" (73 min core, 80 with the optional A3+) and B "Jmix с нуля" (45 / 55 with the optional B4). One static page with three views: the **stage** for the audience (default), the presenter **console** (`?view=console`, opened with `P`), and the **mirror dock** at the bottom of the stage (`N`). Live at https://fedoseew.github.io/jmix-demo-runbook/ (GitHub Pages from `main`, root). No build step, no dependencies. Content and UI are in Russian.

## Layout

| Path | Purpose |
|---|---|
| `index.html` | markup, all CSS (palette tokens in `:root`), SVG sprite (logo, step icons, `#qr-repo`), `?` key reference (`<dialog id="keys">`), meta and Open Graph tags |
| `content.js` | `globalThis.DEMOS`: both demos' blocks (slides, notes, actions) |
| `core.js` | `globalThis.Runbook`: pure logic without the DOM, tested in Node |
| `app.js` | DOM: stage, console, dock, keys, copy, timer painting, two-window sync |
| `test/*.test.mjs` | `node --test`, no dependencies; `test/load.mjs` runs project files in `node:vm` |
| `tools/` | `shot.mjs` screenshots, `smoke.mjs` two-window smoke test, `browser.mjs` shared Playwright launcher |
| `docs/guide/{ru,en}/` | user guides: `usage`, `demos`, `content`, `architecture` |
| `docs/superpowers/` | spec and plans. History: do not move or rewrite. Spec §10–11 is the UI contract |
| `docs/open-questions.md` | things to verify at rehearsal |
| `.agents/skills/` | agent skills, linked from `.claude/skills/` |

## Commands

```bash
node --test                                    # all tests; run after every change
node tools/shot.mjs <url|path> <out.png|.jpg> [stateJSON|-] [w] [h] [KeyN,KeyJ,...]
node tools/smoke.mjs [url|path]                # PASS/FAIL lines, exit 1 on failure
```

The tools resolve Playwright from `PLAYWRIGHT_MODULE` (a module path such as `/…/node_modules/playwright-core/index.mjs`, or a package name), else `playwright`, else `playwright-core`; the browser from `CHROME_PATH` if set. Without either: `npm i --no-save playwright && npx playwright install chromium` (`node_modules/` is git-ignored). Never install anything globally.

## Hard constraints

- **Zero external requests.** No CDN, web fonts, `fetch`, `XMLHttpRequest` or dynamic `import()` in page files; system fonts only. Meta/OG tags and plain links are fine. `test/html.test.mjs` checks `index.html`, `app.js` and `content.js` (not `core.js`; keep it clean by hand).
- **Works from `file://`.** Scripts load by relative paths in the order `content.js`, `core.js`, `app.js`. No modules, no server assumptions.
- **No regex lookbehind in `core.js`** (Safari before 16.4 rejects the whole file).
- **Palette tokens only.** Jmix colours `#17124B`, `#FDB42B`, `#FC1264`, `#41B883`, text `#DBDDE1`, defined once in `:root`; reuse tokens instead of new literals.
- **Contrast** of text at least 4.5:1 on console and light-dock backgrounds (tested).
- **Font floors:** stage bullets at least 28px at 1280 wide (`2.19cqw`); console at least 14px; dock and `?` reference at least 18px (the audience sees them).
- **Keys by `event.code`**, never `event.key`, so any layout works. Every key `app.js` handles must appear in the `?` dialog (tested). Ignore auto-repeat and modifier combos.
- **Guard browser APIs:** `localStorage`, `sessionStorage`, clipboard, fullscreen and `window.open` go through `try/catch` or a checked result.
- **No `console.log`** in page code (`app.js`, `core.js`, `content.js`). The CLI tools in `tools/` may print.
- **Immutable state:** every change builds a new state object; `Runbook.loadState` validates every field read from storage.
- **The audience sees the stage and the dock:** no notes, overrun or debug messages there.

## Content conventions

Full reference: `docs/guide/en/content.md`.

- Block: `id`, `title`, `minutes`, optional `optional`, `pre`, `exit`, `flow`, plus `slide`, `notes`, `actions`. Pre-flight is the first block of each demo, with `minutes: 0`.
- `slide`: 3–6 bullets (4–12 checklist items for pre-flight), each at most 90 characters.
- `flow`: optional, 3–5 labels of at most 24 characters, drawn as a process strip under the title rule (used on A4, A5, A6, B2). Bullets must still fit at 28px at 1280×720.
- `notes`: each paragraph needs a lead for the console: the first sentence, or text up to ":", " — " or ")", at most 56 characters.
- `actions[].kind`: `shell`, `git`, `url`, `studio`, `say`.
- `[8]` at the start of an action's text marks the short version (`S`).
- A `studio` action containing «промпт из следующей строки» turns the next `studio` action into a copyable prompt («два промпта» for two). Every question to a model is such a prompt.
- Every `jmix` command on stage uses `--no-update`.
- When minutes, titles, exit points or block order change, update `docs/guide/{ru,en}/demos.md` (tables and Gantt charts), the minute totals in the tests, the demo descriptions in `README.md` / `README.en.md`, and "What this is" above.

## Testing expectations

- `node --test` passes before any commit.
- Logic goes into `core.js` with a test in `test/core.test.mjs` first; `app.js` stays DOM glue.
- UI or content change: screenshot the affected views with `tools/shot.mjs` at 1280×720 (stage, dock) and 1440×900 (console) and look at them; run `tools/smoke.mjs`. Both print page errors and external requests.
- Regenerate `docs/images/*.jpg` when the UI they show changes (see the `runbook-screenshots` skill).

## Docs layout

- `README.md` (Russian, default) and `README.en.md` mirror each other; so do `docs/guide/ru/*` and `docs/guide/en/*`. Change both languages in the same commit.
- Mermaid diagrams in the guides must render on GitHub: keep to `flowchart`, `sequenceDiagram`, `gantt`.
- Check that new links return 200: `curl -s -o /dev/null -w '%{http_code}' -L <url>`. There is no automated link checker.

## Git

Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`. One logical change per commit. Do not commit `node_modules/`, scratch screenshots, `sketches/`, or `assets/` (rehearsal fallback screenshots with stand data; local only, git-ignored).

## Skills

In `.agents/skills/` (also visible as `.claude/skills/`):

- `runbook-content`: add or edit blocks, slides, notes, actions, `flow`, the short version and prompts, then validate.
- `runbook-screenshots`: take screenshots with `tools/shot.mjs`: states, key codes, viewports, the `docs/images` set, what to look for.
- `runbook-verify`: checks before a commit or a demo: tests, screenshots, two-window smoke, external requests.
- `runbook-adapt`: fork the runbook for your own demo: content, titles, brand tokens, QR, deploy to GitHub Pages.

`.claude/skills/<name>` are relative symlinks to `.agents/skills/<name>`; keep them. On Windows, enable symlinks before cloning (`git config --global core.symlinks true` with Developer Mode on, or `git clone -c core.symlinks=true …`), or copy `.agents/skills/*` into `.claude/skills/`. Otherwise Git checks the links out as small text files and Claude Code does not find the skills.
