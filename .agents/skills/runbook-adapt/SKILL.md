---
name: runbook-adapt
description: Use when forking the Jmix demo runbook for a different talk or demo — replacing the content, titles, brand colours, logo, QR code, links and metadata, adjusting the tests, and deploying the result to GitHub Pages.
---

# Adapt the runbook for your own demo

Human-readable version: `docs/guide/en/content.md` → "Your own runbook from this one".

1. **Content.** Rewrite `content.js` with two demos keyed `a` and `b` (the `1`/`2` keys and the console switch need both). `title` reads «Демо A — <name>»; the stage shows the part after the last "—". First block of each demo: pre-flight (`pre: true`, `minutes: 0`, checklist in `slide`). Follow the `runbook-content` skill for field rules.
2. **Tests.** In `test/content.test.mjs` keep the generic rules (block shape, slide size, bullet length, leads, `flow` limits, `--no-update` if you use Jmix CLI). Replace or delete demo-specific ones: at least 6 blocks per demo, minute totals, exit points (A3, A6, B4) and optional blocks, the `:8091` stand / no port 8096, branch names, specific prompts, the A3 command in pre-flight, the stand jar path, A-pre fallbacks and the Jmix AI warm-up, the A3 fallback screenshot, A6 steps, B1/B3, which blocks have `flow`, A5 named as in the A0 map, the materials link. In `test/html.test.mjs`: the repository caption under the QR (`stageHTML`), the QR symbol viewBox `0 0 41 41`, the console GitHub link (`consoleHTML`), `og:url` and `og:image`. `node --test` must pass.
3. **Brand.** Edit the tokens in `:root` at the top of `index.html` (`--navy`, `--yellow`, `--pink`, `--green`, `--cyan`, `--ink`, backgrounds) and the `.stage` gradient. Replace the `#logo` and `#logo-mark` groups in the SVG sprite. `node --test` re-checks contrast.
4. **QR and links.** Generate the QR for your repository:

   ```bash
   npx qrcode -t svg -o /tmp/qr.svg "https://github.com/<you>/<repo>"
   ```

   Copy its `viewBox` and both `<path>` elements into `<symbol id="qr-repo">` in `index.html` (recolour the dark modules to a palette token colour if you like; keep the white quiet zone). A shorter or longer URL gives a different QR version: if the new `viewBox` is not `0 0 41 41`, update the number in the `<svg class="h-qr" viewBox=…>` in `app.js` (`stageHTML`) and in the `qr-repo` assertion in `test/html.test.mjs`, or `node --test` fails. Replace the old address everywhere, including lower-case `fedoseew.github.io` (og tags, READMEs, `AGENTS.md`, tests, skills): `grep -rni fedoseew . --exclude-dir=superpowers --exclude-dir=.git`.
5. **Metadata.** In `index.html`: `<title>`, `meta description`, `og:title`, `og:description`, `og:url`, `og:image`.
6. **Storage keys.** If several runbooks live under one `<you>.github.io` origin, change `STORAGE_KEY` in `core.js` and `DOCK_KEY`, `BEAT_KEY` in `app.js` so they don't share state.
7. **UI language.** Labels are Russian strings in `app.js`, `index.html` and `KIND_LABELS` in `core.js`. For non-Russian content also change `PROMPT_INTRO` and the «два промпта» check in `core.js`.
8. **Docs.** Rewrite `README.md`/`README.en.md` and `docs/guide/*/demos.md` for your demos; regenerate `docs/images` (`runbook-screenshots` skill).
9. **Verify:** `runbook-verify` skill.
10. **Deploy:** GitHub → Settings → Pages → Deploy from a branch → `main`, `/ (root)`. Keep `.nojekyll`. The site appears at `https://<you>.github.io/<repo>/`; then run `node tools/smoke.mjs https://<you>.github.io/<repo>/`.
