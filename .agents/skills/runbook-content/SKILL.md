---
name: runbook-content
description: Use when adding or editing demo content in content.js of the Jmix demo runbook — blocks, slide bullets, notes, actions, the flow strip, short-version [8] steps or copyable prompts — and validating the result.
---

# Edit runbook content

All content is `globalThis.DEMOS` in `content.js` (`a` and `b`, each `{ title, blocks }`). Do not touch `core.js` or `app.js` for a content change. Reference: `docs/guide/en/content.md`.

## Rules (tests enforce most of them)

| Field | Rule |
|---|---|
| `id` | unique within the demo |
| `minutes` | integer; pre-flight is the first block with `pre: true` and `minutes: 0` |
| `optional`, `exit` | `exit` starts with «Точка выхода…:» |
| `slide` | 3–6 bullets (pre-flight: 4–12 checklist items), each ≤ 90 chars |
| `flow` | optional, 3–5 labels, each ≤ 24 chars; drawn under the title rule above the bullets |
| `notes` | ≥ 1 paragraph; each needs a lead ≤ 56 chars: first sentence, or up to ":", " — " or ")" |
| `actions` | `{ kind, text }`, kind ∈ `shell`, `git`, `url`, `studio`, `say` |

Conventions:

- Short version: put `[8]` at the start of `text`. `S` then keeps only those steps.
- Prompt: a `studio` step whose text contains «промпт из следующей строки» makes the next `studio` step a copyable prompt («два промпта» → next two). Every question to CRM AI, Jmix AI or the report designer must be a prompt. Mark `[8]` on the intro line, not on the prompt.
- Every `jmix` shell command uses `--no-update`; A-pre runs the same command as A3.
- Start each notes paragraph with a phrase naming its topic, e.g. «Прогон и сброс накануне. …».
- The last block of each demo (A7, B5) names `github.com/Fedoseew/jmix-demo-runbook`.

## Steps

1. Find the block: `grep -n 'id: "A4"' content.js`. Edit in place; keep the existing style (double quotes, one item per line).
2. If you change minutes, add/remove/reorder blocks or exit points: update the totals in `test/content.test.mjs`, the block tables and Gantt charts in `docs/guide/ru/demos.md` and `docs/guide/en/demos.md`, the demo descriptions in `README.md` / `README.en.md`, and "What this is" in `AGENTS.md`.
3. Run `node --test`. Fix the content, not the test, unless the rule itself changed.
4. Screenshot the stage of the block (index = position in the demo array, pre-flight = 0; A4 = 6, A6 = 8, B2 = 3):

   ```bash
   SHOT_DELAY_MS=3000 node tools/shot.mjs index.html /tmp/blk.png '{"demo":"a","index":6}' 1280 720
   ```

   Look for clipped last bullets (the stage shrinks text to 28px and then cuts), a `flow` strip that wraps to two lines, and awkward line breaks. For blocks with long Studio steps also shoot the dock: add `KeyN` as the last argument.
5. Console check when notes or actions changed: `'index.html?view=console'` at 1440 900 with `"steps":{"A4":3}` in the state.
