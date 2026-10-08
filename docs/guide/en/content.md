[Русский](../ru/content.md) · **English** · [← README](../../../README.en.md)

# Editing the content

All demo text (slides, notes, steps) lives in one file, `content.js`, in the `globalThis.DEMOS` object. You don't need to touch the code (`core.js`, `app.js`) to change content. Run `node --test` after every edit.

- [The DEMOS schema](#the-demos-schema)
- [Block fields](#block-fields)
- [Step kinds](#step-kinds)
- [Conventions](#conventions)
- [Checking your changes](#checking-your-changes)
- [Your own runbook from this one](#your-own-runbook-from-this-one)
- [Publishing on GitHub Pages](#publishing-on-github-pages)

## The DEMOS schema

```js
globalThis.DEMOS = {
  a: { title: 'Демо A — AI × Jmix', blocks: [Block, ...] },
  b: { title: 'Демо B — Jmix с нуля', blocks: [Block, ...] },
};

Block = {
  id: 'A4',                    // unique within the demo, seen by the presenter
  title: 'AI внутри приложения: CRM AI',
  minutes: 12,                 // planned length; 0 for pre-flight
  optional: true,              // optional: marks an optional block
  pre: true,                   // optional: pre-flight (the first block of a demo)
  exit: 'Точка выхода №1: при отставании — …',  // optional
  flow: ['Вопрос словами', 'JPQL от модели', 'Валидация'],  // optional, 3–5 labels
  slide: ['bullet for the audience', ...],       // 3–6 bullets; 4–12 checklist items for pre-flight
  notes: ['notes paragraph', ...],               // for the presenter, at least one
  actions: [{ kind: 'shell', text: 'curl -s …' }, ...],
};
```

The runbook expects exactly two demos, keyed `a` and `b`: the `1` / `2` keys and the console switch depend on them. The demo name on the stage is the part of `title` after the last "—".

## Block fields

| Field | Where it shows | Rules |
|---|---|---|
| `id` | the console counter and agenda, the mirror dock | unique within the demo |
| `title` | slide title, agenda, the «Далее» (next) card | keep it short: long titles wrap on the slide |
| `minutes` | block timer, agenda, demo totals | integer; 0 for pre-flight |
| `optional` | a hatched segment in the agenda, the «опц.» tag in the next card | totals count the core without optional blocks |
| `pre` | holding slide on the stage, checklist in the console | first block only; `slide` holds the checklist items |
| `exit` | agenda marker, a line under the timer, highlighted when behind | starts with «Точка выхода…:»; the console shows the text after the colon |
| `flow` | a process strip on the stage under the yellow rule, above the bullets: label chips joined by arrows | 3–5 labels of at most 24 characters each; a strip that breaks the rules is not drawn. Used on A4, A5, A6 and B2 today |
| `slide` | bullets on the stage | 3–6 bullets, each at most 90 characters |
| `notes` | the console notes column: a bold lead plus the collapsed rest | every paragraph needs a lead (see below) |
| `actions` | the console steps column, the next card, the mirror dock | `kind` from the table below, non-empty `text` |

Bullets start at 32px on a 1280-wide stage and shrink when they don't fit, but never below 28px (`2.19cqw`). A `flow` strip takes some of the height, so check the slide with a screenshot after adding one (see [Checking your changes](#checking-your-changes)).

## Step kinds

| `kind` | In the console | Copyable |
|---|---|---|
| `shell` | monospace, «Терминал» | yes |
| `git` | monospace, «Git» | yes |
| `url` | a link, opens in a new tab | yes |
| `studio` | a Studio menu path; " → " arrows are the line-break points | no |
| `say` | a line for the audience | no |
| — (`prompt`) | a question to a model; derived from a `studio` step after an intro line | yes |

## Conventions

The conventions match Russian phrases because the content is in Russian. For content in another language, change `PROMPT_INTRO` and the «два промпта» check in `classifyActions` in `core.js`.

**Short version: the `[8]` mark.** The mark at the start of `text` puts the step into the short version: the UI shows an «8′» badge and the copied text drops the mark. `S` keeps only those steps in the block. Today only A6 has one (exit point 2).

```js
{ kind: 'studio', text: '[8] Шаг 1. AI-чат → вставить промпт из следующей строки → отправить' },
```

**Prompts: «промпт из следующей строки» ("prompt on the next line").** Questions to a model are never typed live. A step whose text contains «промпт из следующей строки» turns the next `studio` action into a copyable prompt; «два промпта» ("two prompts") turns the next two. A prompt is in the short version when its intro step is, so put `[8]` on the intro line only.

```js
{ kind: 'studio', text: 'CRM AI → вопрос 1 живьём — промпт из следующей строки → строка executeQuery(jpql=…) в терминале' },
{ kind: 'studio', text: 'Сколько у нас клиентов и кто топ-3 по сумме заказов?' },
```

**Note leads.** A collapsed paragraph in the console starts with a bold lead: the shortest complete piece of at most 56 characters, i.e. the first sentence, or the text up to ":", up to " — " or up to ")". Without a lead the paragraph loses its bold start and the test fails. Start each paragraph with a phrase that names its topic: «Прогон и сброс накануне. …», «Агент и промпт A2. …».

**Slide bullets** are at most 90 characters, no filler. On the stage, hyphenated words never break across lines and short prepositions stick to the next word.

**`jmix` commands** on stage always use `--no-update`, and pre-flight runs the same command as A3 (a test checks both).

**Where the materials are.** The last block of each demo (A7, B5) puts the repository address on the slide; the pre-flight holding slide shows it as a QR code.

## Checking your changes

```bash
node --test
```

The tests (`test/*.test.mjs`, no dependencies) check:

- content: minute totals (A 73 / 80, B 45 / 55), exit points, unique ids, slide sizes, bullet length, note leads, prompts for model questions, `--no-update`, branches and the stand from the spec, the `flow` rules;
- `core.js` logic: state, the timer across block changes, steps, the short version, pace, sync, typography;
- `index.html` markup: no external resources, text contrast of at least 4.5:1, font size floors, the `?` reference lists every key `app.js` reads.

To eyeball a block, take a screenshot ([tools/shot.mjs](architecture.md#tools)):

```bash
node tools/shot.mjs index.html /tmp/a4.png '{"demo":"a","index":6}' 1280 720
```

`index` is the block's position in the demo array, counting pre-flight as 0 (A4 is 6). Before a commit or a demo, see the [runbook-verify](../../../.agents/skills/runbook-verify/SKILL.md) skill.

## Your own runbook from this one

1. **Fork** the repository and clone it.
2. **Content.** Replace `content.js` with your own demos `a` and `b`. Pre-flight is the first block of each.
3. **Tests.** Keep the general rules in `test/content.test.mjs` (block shape, slide size, bullet length, leads, step kinds, `flow` limits). Replace or delete the rules specific to these demos:
   - `test/content.test.mjs`: at least 6 blocks per demo, minute totals, exit points A3, A6, B4 and the optional A3+, B4, the `:8091` stand (no port 8096), branches from the spec, specific prompts, the A3 command in pre-flight, the stand jar, A-pre (A4–A6 fallbacks, the Jmix AI warm-up), the A3 fallback screenshot, A6 steps, B1/B3, which blocks have `flow`, the A5 title matching the A0 map, the materials link;
   - `test/html.test.mjs`: the address under the QR on the holding slide, the QR symbol viewBox `0 0 41 41`, the GitHub link in the console header, `og:url` and `og:image`.
4. **Brand.** Colours are tokens in `:root` at the top of `index.html`: `--navy`, `--yellow`, `--pink`, `--pink-text`, `--green`, `--cyan`; text `--ink`, `--white`, `--muted`; backgrounds and lines `--bg`, `--panel`, `--panel-2`, `--line`, `--line-hi`, `--code-bg`. The stage background is the gradient in the `.stage` rule, and its colours are the `--s-*` tokens in the same rule; the light stage is `.stage.light`. After changing them, `node --test` checks contrast. The logo is the `#logo` and `#logo-mark` groups in the SVG sprite at the end of `index.html`.
5. **Repository address.** The QR code is the `#qr-repo` symbol in the `index.html` sprite. Generate a new one (it stays offline once generated):

   ```bash
   npx qrcode -t svg -o /tmp/qr.svg "https://github.com/<you>/<repo>"
   ```

   Copy the `viewBox` and both `<path>` elements from `/tmp/qr.svg` (outside the repository, so it is not committed by mistake) into `<symbol id="qr-repo">`. The QR size depends on the address length: if the new `viewBox` is not `0 0 41 41`, update that number in the `<svg class="h-qr">` in `app.js` (`stageHTML`) and in `test/html.test.mjs` too. The old address appears in `app.js` (the caption under the QR, the GitHub link in the console header), `content.js` (the last blocks), `index.html` (`og:url`, `og:image`), the tests, the READMEs, the guides, `AGENTS.md` and the skills, sometimes in lower case (`fedoseew.github.io`). Find every place:

   ```bash
   grep -rni fedoseew . --exclude-dir=superpowers --exclude-dir=.git
   ```
6. **Metadata.** In the `index.html` `<head>`: `<title>`, `description`, `og:title`, `og:description`, `og:url`, `og:image`.
7. **Storage key.** All of one user's GitHub Pages projects share an origin (`<you>.github.io`) and therefore `localStorage`. If you host more than one runbook, change `STORAGE_KEY` in `core.js` and `DOCK_KEY`, `BEAT_KEY` in `app.js`.
8. **UI language.** Console, dock and help labels are Russian strings in `app.js` and `index.html`, and the step kind names are `KIND_LABELS` in `core.js`; translate them there.

Step by step for an AI agent: the [runbook-adapt](../../../.agents/skills/runbook-adapt/SKILL.md) skill. The skills live in `.agents/skills/`, and `.claude/skills/` holds symlinks to them. On Windows, enable symlinks before cloning (`git config --global core.symlinks true` with Developer Mode on) or copy `.agents/skills/*` into `.claude/skills/`; otherwise Git checks the links out as text files and Claude Code does not see the skills.

## Publishing on GitHub Pages

1. Settings → Pages → Build and deployment → Source: **Deploy from a branch**, branch `main`, folder `/ (root)` → Save.
2. A minute or two later the site is at `https://<you>.github.io/<repo>/`. The `.nojekyll` file in the root turns Jekyll off, so files are served as they are.
3. Update `og:url` and `og:image` in `index.html` to the new address.

There is no build step: whatever is on `main` is what gets published.

---

Next: [running a demo](usage.md) · [demos A and B](demos.md) · [architecture](architecture.md)
