---
name: runbook-verify
description: Use before committing a change to the Jmix demo runbook or before presenting it — runs the tests, the screenshot set, the two-window smoke test and the external-requests check, and reports what failed.
---

# Verify the runbook

Run every step; report each as pass/fail with the evidence (command output or screenshot path). Do not claim success without running them.

1. **Tests:** `node --test`. All must pass.
2. **Two-window smoke:** `node tools/smoke.mjs` (or pass the deployed URL). Expect only `PASS` lines and exit code 0. It covers: stage renders, `P` opens the console, jump to A4, `J`×3 moves the step, the stage dock (`N`) shows the same step, a reload of both windows keeps block and step, no page errors or external requests.
3. **Screenshots:** take the set from the `runbook-screenshots` skill into a temp directory (not `docs/images` unless you are regenerating them), plus every block you changed. Open each image and check it against that skill's checklist.
4. **External requests:** `tools/shot.mjs` and `tools/smoke.mjs` print any request that leaves the page's origin; there must be none. Also `grep -nE "https?://" index.html app.js core.js` — only links, meta/OG tags and comments are allowed, never `src=`, `@import`, `url(` or `fetch`.
5. **Hard constraints in the diff** (`git diff`): no `console.log` in page files, keys read by `event.code`, new keys listed in the `?` dialog, colours via `:root` tokens, browser APIs guarded with `try/catch`, no regex lookbehind in `core.js`.
6. **Docs in sync:** if behaviour, keys, timings or content structure changed, both `README.md`/`README.en.md` and `docs/guide/{ru,en}` reflect it.

Before a live demo, additionally:

- `./demo check` with no FAIL: the infrastructure pre-flight (stand, keys, jar, database, screenshots); `./demo help` lists the other commands.
- Open the exact copy that will be presented (from disk, `file://`) and run `node tools/smoke.mjs /path/to/index.html`.
- Clear rehearsal data afterwards: in the console on a pre-flight block, press «Сбросить репетицию» under the checklist and press it again within 3 s (the smoke test uses its own browser profile, so it does not touch the presenter's).
- Walk through `docs/open-questions.md` and the pre-flight checklist in the console.
