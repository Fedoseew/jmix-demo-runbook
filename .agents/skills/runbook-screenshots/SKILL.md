---
name: runbook-screenshots
description: Use when you need screenshots of the Jmix demo runbook — to check a UI or content change, or to regenerate docs/images — with tools/shot.mjs (states, key codes, viewports, where to save, what to look for).
---

# Runbook screenshots

```bash
node tools/shot.mjs <url|path> <out.png|out.jpg> [stateJSON|-] [width] [height] [codes]
```

- Playwright: env `PLAYWRIGHT_MODULE` (module path or package name), else `playwright`, else `playwright-core`. Browser: env `CHROME_PATH` (optional). If none is available: `npm i --no-save playwright && npx playwright install chromium`.
- `stateJSON` is written to `localStorage['jmix-runbook/v1']`, then the page reloads. Fields: `demo` (`"a"`/`"b"`), `index` (block position, pre-flight = 0), `steps` (`{"A4":3}`, zero-based), `short`, `light`, `timer`, `elapsed`.
- `codes`: comma-separated `KeyboardEvent.code` values pressed after load: `KeyN` dock, `KeyJ`/`KeyK` step, `KeyS` short version, `KeyL` light, `ArrowRight`/`ArrowLeft` block, `Slash` key reference, `KeyT` timer.
- `.jpg`/`.jpeg` → JPEG quality 82, otherwise PNG.
- A console URL (`'index.html?view=console'`, quote it in the shell) gets a fresh stage heartbeat, so the header shows «Сцена · на связи».
- `SHOT_DELAY_MS=3000` waits for the stage key hint (shown 2.5 s after load) to fade. Use it for every stage shot meant for docs.
- Exit code 1 and printed lines mean page errors or external requests: treat as a bug.

Block indexes: A: A-pre 0, A0 1, A1 2, A2 3, A3 4, A3+ 5, A4 6, A5 7, A6 8, A7 9. B: B-pre 0, B0 1, B1 2, B2 3, B3 4, B4 5, B5 6.

## Viewports

- Stage and dock: 1280×720 (the 28px font floor is defined at this width); also 1920×1080 for a projector check.
- Console: 1440×900 (the size `P` opens); at heights ≥ 800 the agenda shows two-line titles.

## The docs/images set

Where each is used: `stage.jpg` — README hero and `og:image`; `console.jpg` — README hero; `dock.jpg` — `docs/guide/*/usage.md` «Зеркало» / "Mirror"; `holding.jpg` — usage.md «Pre-flight»; `light.jpg` — usage.md «Клавиши» / "Keys" (the `L` key). All five are 1280×720: the README hero puts `stage.jpg` and `console.jpg` side by side, so both must be 16:9 (the console here is not the 1440×900 review size). Regenerate all five when the UI they show changes:

```bash
export SHOT_DELAY_MS=3000
node tools/shot.mjs index.html docs/images/stage.jpg   '{"demo":"a","index":6}' 1280 720
node tools/shot.mjs 'index.html?view=console' docs/images/console.jpg '{"demo":"a","index":6,"steps":{"A4":3}}' 1280 720
node tools/shot.mjs index.html docs/images/dock.jpg    '{"demo":"a","index":8,"steps":{"A6":5}}' 1280 720 KeyN
node tools/shot.mjs index.html docs/images/holding.jpg '{"demo":"a","index":0}' 1280 720
node tools/shot.mjs index.html docs/images/light.jpg   '{"demo":"a","index":6,"light":true}' 1280 720
```

Scratch shots go to a temp directory, never into the repo.

## What to look for

- Stage: last bullet not clipped; bullets not visibly smaller than neighbours' blocks; `flow` strip on one line; no hyphenated word split; counter and progress strip correct.
- Holding slide: agenda readable, QR crisp with a white quiet zone, repository URL visible.
- Dock: current step fully readable (Studio steps and lines to say are never truncated), slide still 16:9 and readable, no overrun or minus shown.
- Light stage: text contrast, the "now" segment brighter than "done".
- Console: active step in the top third, leads bold on one line, no text under 14px, GitHub link in the header.
