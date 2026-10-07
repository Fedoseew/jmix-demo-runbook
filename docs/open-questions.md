# Открытые вопросы перед демо

Что агенты не смогли проверить по исходникам при подготовке контента. Закрыть при создании веток (spec §7) и на репетиции.

## Блоки A-pre, A0, A1

- [ ] Which agent runs the live A2 task (claude, codex, opencode, junie)? Swap the `command -v claude` action accordingly. The way to check its login and JetBrains MCP connection without showing the Context7 key is not specified.
- [ ] Studio AI Assistant: is tool window id «Jmix AI» also the label the user sees, and what sign-in or licence does the assistant need? Verify on the demo machine.
- [ ] What does an unauthenticated GET on http://localhost:8091/b2b-crm/ return, 200 or 302? The notes accept either; confirm once at rehearsal.
- [ ] Why does `jmix --version` hang locally? The auto-update check is only a hypothesis. Reproduce with `jmix --no-update --version` and with JMIX_CLI_NO_AUTO_UPDATE=1.
- [ ] Skill count: the local toolkit v3 clone (origin/v3 last fetched 2026-09-03) has 21 skills, jmix-crm has 22. Does upstream v3 now ship jmix-migrate-theme-to-aura? Re-fetch and re-count before the demo.
- [ ] Jar strategy: a jar copy in ~/demo-jars (now the default in the actions) or a separate worktree for demo/ai-app? Decide when the demo branches are prepared. If you choose the worktree, update the stands.sh paths in the actions.
- [ ] The exact A3 `jmix --no-update new ... --non-interactive` command lives in the A3 block. Run that same command the day before so the templates get cached.

## Блоки A2, A3

- [ ] The A-pre pre-flight checklist and spec section 6 still say «jmix --version отвечает». The CLI declares no --version option (the only match in src/main is ProcessBuilder("git", "--version")). Switch them to `jmix --help` in the other part file and in the spec.
- [ ] Rehearsal check: in a Flow UI detail view, does a broken property on a formLayout field show exactly «Property path "…" is invalid for entity class "…"»? FlowDataContainerPropertyReferenceProvider creates non-soft EntityPropertyPathReference; the registration path for every field type was not traced.
- [ ] Rehearsal check: Generate Liquibase Changelog with the app of the same working copy running. Does the HSQLDB file lock block the diff? This is expected from standard HSQLDB behavior but was not reproduced.
- [ ] Rehearsal check: does Claude Code ask to trust the folder again when ~/IdeaProjects/jmix-crm-live is recreated at the same path?
- [ ] Check the IntelliJ editor-tab menu item name «Split Right» in the IDE version used on stage.
- [ ] When recording demo/agent-task, check what the commit contains: get_file_problems verdicts per file (not only the compileJava fallback), the @UiTest for Contract.list and Contract.detail, the Contract @JpqlRowLevelPolicy in OnlyMyAccountsRole, and whether ContractManagerRole uses CrmConstants.ViewIds constants or literals.
- [ ] The Jmix tool window path «Data Stores → Main Data Store → Generate Liquibase Changelog» comes from the earlier draft. Only the action text «Generate Liquibase Changelog» and the «already synced» message were verified in Studio sources; check the tree node label in rehearsal.

## Блоки A4, A5

- [ ] When building demo/ai-app: set logging.level.io.jmix.aitools.dataload=DEBUG in application.properties. It is INFO on 50-dynmodel-ai-agent, and without DEBUG the JPQL lines will not appear in the log.
- [ ] When building demo/ai-app: annotate Contact.phone and Contact.email with @ExcludeFromAi (io.jmix.aitools). The spec only says «пример @ExcludeFromAi», and the A4 git show action and the optional contacts question both depend on this exact choice.
- [ ] When building demo/ai-app: fix the name and path of the exported report zip. Create both reports, «Выручка клиентов (AI JPQL)» and «Выручка клиентов (живая генерация)», with fromDate/toDate and a «Таблица» template. Check at rehearsal that a TABLE template renders an LLM data set band and that import restores the stored query.
- [ ] Cross-part (A-pre in a-intro.json): add these steps after ./stands.sh start: open CRM AI with no red API-key notification, ask a warm-up question, see executeQuery(jpql= in the log, record the admin and alice conversations after the last stand reset, and import the AI JPQL reports zip.
- [ ] Check at rehearsal that alice actually sees Администрирование → Отчёты → Запуск отчётов in the aura-light main view. The code analysis says yes, but it was not observed on a running stand.
- [ ] Check at rehearsal whether Q1 («Сколько у нас клиентов и кто топ-3 по сумме заказов?») goes through executeQuery or through a report. The system prompt prefers reports for complex aggregations, and if a report is used, no JPQL line appears.
- [ ] The fallback screenshot files (assets/a4-admin-q1.png, assets/a4-alice-q1.png) are example names. They do not exist yet and must be captured and linked from the runbook.
- [ ] Closing the live-generation copy without saving: the exact wording of the unsaved-changes dialog in the report designer was not verified.

## Блоки A6, A7

- [ ] app.js line 213: copyable is shell/git/url only. A6 prompts are now standalone studio actions holding only the prompt text. Should 'studio' be added to the copyable kinds, or a 'prompt' flag introduced? Otherwise the presenter must mouse-select prompts of up to about 600 characters.
- [ ] When merging into content.js, should A6.exit be changed from the plan skeleton's 'только шаги 1–5 сценария' (wrong: scenario steps 1–5 never reach Apply) to something like 'Точка выхода №2: 8 минут — только действия с меткой [8] (шаги сценария 1, 3, 8, 9, 13)'?
- [ ] Should A-pre (a-intro.json) also start the fallback stand ('./stands.sh start aura-dark', port 8092, JMX 9192, about 1 GB more memory) and should the A6 rehearsal be moved there? A6 now assumes a ready result on aura-dark.
- [ ] A4 (a-app-ai.json) still has the action '~/IdeaProjects/jmix-crm/demo/dynmodel-ai-agent/stands.sh status aura-light'. It fails when the working copy is on main or demo/agent-task, which is the state after A-pre and A2. It needs the same fix (drop it, use a curl check, or use a separate worktree), consistent across A-pre, A2, A4 and the tail -f log path.
- [ ] demo/ai-app does not exist yet. Are the A5 report with AI JPQL and the other A4/A5 prerequisites seeded by code or data in the branch, or created by hand through the UI? This decides whether an aura-light reset loses them.
- [ ] Where will the A6 fallback screenshots or recording live (a path relative to the runbook)? Spec §6 requires local-file links.
- [ ] Is CRM AI enabled on https://demo.jmix.io/b2b-crm/login? Nothing local confirms it (application-online.properties has no spring.ai settings). Check before the event.
- [ ] At rehearsal, check the actual projector width and zoom against the 60rem container threshold of the settings view. Also find the exact label of the CRM main-menu collapse control (not verified).

## Блоки B-pre, B0, B1

- [ ] The run configuration name 'Crm-from-db Jmix Application' assumes the Gradle module (rootProject.name) of crm-from-db is 'crm-from-db'. Confirm in the IDE once the repo exists.
- [ ] The Jmix tool window node for the module ('crm-from-db') above Data Stores comes from Studio sources. The public docs show Data Stores as a top-level section. Check the tree on screen before the demo.
- [ ] The docker compose service name, POSTGRES_USER and POSTGRES_DB in the psql check need confirming when crm-from-db is created.
- [ ] Put the crm-from-db build rationale in its README or the prep plan: b/01-empty is generated with Project id crm (CRM_USER, so no clash with USER_), and db/crm.sql is dumped without Jmix service tables (SEC_*, DATABASECHANGELOG, DATABASECHANGELOGLOCK and others). The SEC_ROLE_ASSIGNMENT ID 6c9e420a-2b7a-4c42-8654-a9027ee14083 from template changeSet 4 also exists in jmix-crm.
- [ ] Studio wizard offline behaviour: the version list warm-up is verified in code (in-memory, 24h). The sources don't show whether the template-step and Finish screens also need network in a warmed-up session. Do a rehearsal with the network turned off.
- [ ] When nothing is selected at 'What's next?' in the CLI, check whether a plain Enter confirms an empty selection, or whether the TUI requires a toggle. The code only shows that an empty result opens the file manager.

## Блоки B2–B5

- [ ] The base package of crm-from-db is unknown. The B2 enum action uses '<базовый пакет>.entity.OrderStatus' and should be replaced with the real package once the repo exists.
- [ ] b/02-model must match what the presenter does live: the USER_ class renamed to Employee; enums OrderStatus (NEW=10, ACCEPTED=20, IN_PROGRESS=30, DONE=40) and InvoiceStatus; instance names for CONTACT, ORDER_ and INVOICE; and traits mapped (VERSION, CREATED_*, UPDATED_*).
- [ ] B-pre (b-intro.json, not this file) needs four items. 1) After each rehearsal, reset PostgreSQL to the dump; the exact command depends on how db/docker-compose.yml loads db/crm.sql. 2) Start b/01-empty once. 3) Create the user sales/sales with no roles. 4) Run the '\d client' check to confirm there is no rating column.
- [ ] Possible blocker for b/01-empty: the template's 010-init-user.xml inserts a SEC_ROLE_ASSIGNMENT row with ID 6c9e420a-2b7a-4c42-8654-a9027ee14083, and the jmix-crm dump already has a row with that ID (admin → administrator). The first start against the dump would hit a primary-key conflict. The dump's admin role code 'administrator' also does not exist in the new project. This must be resolved when preparing b/01-empty.
- [ ] Check on rehearsal that, after switching Client to CREATE_ONLY on b/03-views, Generate Liquibase Changelog shows only addColumn RATING. Extra FK, index or type differences for CLIENT are possible.
- [ ] Check on rehearsal that renaming the USER_ class to Employee in Table Mapping Editor also updates the type of CLIENT.accountManager, so nothing still references User1.
- [ ] The view ids crm_Client.list, crm_Client.detail and crm_Invoice.list assume Project id crm and Studio's default underscore separator (ProjectState.isGenerateEntityNameWithUnderscore = true).
- [ ] The psql '\d client' action makes the same assumptions as B-pre: compose service 'db' on the official postgres image, with POSTGRES_USER and POSTGRES_DB.
