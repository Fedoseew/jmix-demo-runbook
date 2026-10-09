[Русский](../ru/rehearsal.md) · **English** · [← README](../../../README.en.md)

# Preparing and rehearsing

The order of work from the first setup to demo day. What each `./demo` command does is in [Demos A and B → What to prepare](demos.md#what-to-prepare); how to run the show is in [Running a demo](usage.md). Run the commands from the runbook folder.

## 1. Once, in advance

1. Add the OpenAI key to `~/.zshrc` as `SPRING_AI_OPENAI_APIKEY` and check that the terminal sees it: `[ -n "$SPRING_AI_OPENAI_APIKEY" ] && echo set`. IntelliJ IDEA reads the environment at start: restart it after editing `~/.zshrc`.
2. `./demo setup` — the `~/IdeaProjects/jmix-crm-stand` worktree on `demo/ai-app`, the stand jar, a clone of `crm-from-db`, Playwright. The build takes a few minutes.
3. `./demo check` — fix every FAIL as its row says; WARN rows can stay.

## 2. Rehearsing demo A

1. `./demo up a`, then `./demo prepare`: CRM AI warm-up, the A4 dialogs as admin and alice, fallback screenshots in `assets/`.
2. Open `index.html` and press `P` for the presenter console. Walk blocks A0–A7 step by step: `J` / `K` move a step, `C` copies a command.
3. Check live: in A4 the answers differ for admin and alice, A5 has both «Выручка клиентов» reports, the A6 scenario reaches «Применить».
4. At least once, start the stand from IntelliJ IDEA instead of `./demo up a`: project `~/IdeaProjects/jmix-crm-stand`, run configuration «Stand aura-light (OpenAI)». If `./demo check a` then passes, the configuration works.
5. Time every block: the runbook has no timer; the plan is the minutes in the agenda.

## 3. Rehearsing demo B

1. `./demo up b` — PostgreSQL on `:5434` (and the stand for the B4 teaser).
2. Open `~/IdeaProjects/crm-from-db` in the IDE and walk B1–B4 with the runbook. Branches `b/02-model` … `b/05-agent` are ready fallback points.
3. After the run, `./demo reset b`, then start «crm-from-db app» once and create the user `sales` / `sales`.

## 4. By hand only

The full checklist is in the [open questions](../../open-questions.md) (Russian). The main items:

- **A3 screenshots**: the Jmix AI answer in Studio and the `CLI command:` line of the CLI wizard — into `assets/` under the names in [assets/README.md](../../../assets/README.md).
- **Studio steps**: Generate Model from Database (B2), the filter labels (B2), the Security → Resource roles path (B3), the inspections (A2).
- **The venue**: projector or video call, second screen or mirror — see [Running a demo → Second screen or mirror](usage.md#second-screen-or-mirror).

## 5. The day before, after the last rehearsal

1. `./demo reset` and `./demo prepare`: a fresh stand database with no A6 leftovers, the A4 dialogs and screenshots recorded again.
2. `./demo reset b` if demo B was rehearsed after the previous reset.

## 6. Demo day

1. `./demo up a && ./demo check a`; before demo B, `./demo up b`.
2. Open the runbook, press `P`, drag the stage window to the projector, press `F`. If the projector only mirrors the screen, use the `N` dock instead of the console.
3. In the console on the pre-flight block, press «Сбросить репетицию» twice so the steps start from the beginning.
4. After the show, `./demo down`.

If something goes wrong: `./demo status` shows what runs where, `./demo logs jpql` shows the queries CRM AI sent to the database, and the rest is in [Running a demo → Troubleshooting](usage.md#troubleshooting).
