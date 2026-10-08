# Открытые вопросы перед демо

Что агенты не смогли проверить по исходникам при подготовке контента. Закрыть при создании веток (spec §7) и на репетиции.

## Блоки A-pre, A0, A1

- [ ] Which agent runs the live A2 task (claude, codex, opencode, junie)? Swap the `command -v claude` action accordingly. The way to check its login and JetBrains MCP connection without showing the Context7 key is not specified.
- [ ] Jmix AI (Studio AI Assistant): the label «Jmix AI» is confirmed in jmix-studio (CubaTree.properties, Actions.aiPanel), and the runbook now calls it Jmix AI everywhere after one «Jmix AI (Studio AI Assistant)» on the A0 slide. Still open: what sign-in or licence the assistant needs. Verify on the demo machine.
- [ ] What does an unauthenticated GET on http://localhost:8091/b2b-crm/ return, 200 or 302? The notes accept either; confirm once at rehearsal.
- [ ] Why does `jmix --version` hang locally? The auto-update check is only a hypothesis. Reproduce with `jmix --no-update --version` and with JMIX_CLI_NO_AUTO_UPDATE=1.
- [ ] Skill count: the local toolkit v3 clone (origin/v3 last fetched 2026-09-03) has 21 skills, jmix-crm has 22. Does upstream v3 now ship jmix-migrate-theme-to-aura? Re-fetch and re-count before the demo.
- [ ] Jar strategy: both pre-flights (A-pre and B-pre) now copy the jar to ~/demo-jars/crm.jar and start every stand with STAND_JAR="$HOME/demo-jars/crm.jar" (review C5). Still open: keep the copy or switch to a separate worktree for demo/ai-app? Decide when the demo branches are prepared. If you choose the worktree, update the stands.sh paths in both pre-flights, A4 and A6.
- [x] The A3 command is now `jmix --no-update new crm-cli --non-interactive --template application --locales en,ru --path …`. A-pre runs the same command into /tmp/jmix-demo/crm-cli-ready (cache warm-up and offline fallback) and lists /tmp/jmix-demo, so a leftover crm-cli is caught before the demo (review C4).

## Блоки A2, A3

- [ ] A3 is now split: a mandatory 3-minute minimum (A3: `jmix new … --non-interactive`, `ls -a`, one Jmix AI question, exit point №1) and an optional 7-minute A3+ (CLI wizard up to Location and setup, «Ask AI about code»). Demo A is now 73 minutes core and 80 with options (review C1, C9); spec §3 is updated to match. Still open: time A3 (3 min) and A3+ (7 min) at rehearsal.
- [ ] A2: Generate Liquibase Changelog is now «если есть запас» only, and the inspection tabs are opened right after `git checkout demo/agent-task` (review C13). They cannot be opened in pre-flight because these files do not exist on main. Time A2 at rehearsal.

- [x] The A-pre checklist and spec §6 now check `jmix --help`: the CLI declares no --version option (the only match in src/main is ProcessBuilder("git", "--version")).
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
- [x] A-pre now has checklist items and actions for the CRM AI warm-up, `grep -cF 'executeQuery(jpql='` in application.log, the admin and alice dialogs recorded after the last stand reset, and the imported AI JPQL reports zip (review C6).
- [ ] Check at rehearsal that alice actually sees Администрирование → Отчёты → Запуск отчётов in the aura-light main view. The code analysis says yes, but it was not observed on a running stand.
- [ ] Check at rehearsal whether Q1 («Сколько у нас клиентов и кто топ-3 по сумме заказов?») goes through executeQuery or through a report. The system prompt prefers reports for complex aggregations, and if a report is used, no JPQL line appears.
- [ ] Capture the fallback screenshots at rehearsal into assets/ next to the runbook: a3-cli-command.png (the «CLI command:» line) and a Jmix AI answer (a3-*.png), a4-admin-q1.png and a4-alice-q1.png, a6-*.png for scenario steps 1, 3, 8 and 13, b4-*.png for the B4 CRM AI teaser. The runbook already opens them with `open ~/IdeaProjects/jmix-demo-runbook/assets/…` at the end of A3+, A4, A6 and B4, and both pre-flights list assets/ (review C15). If the runbook lives elsewhere on the demo machine, fix that path.
- [ ] Closing the live-generation copy without saving: the exact wording of the unsaved-changes dialog in the report designer was not verified.

## Блоки A6, A7

- [ ] demo-scenario.md:96 in jmix-crm (branch 50-dynmodel-ai-agent, base of demo/ai-app) still uses the next-contact date 24.09.2026, which is already past. The runbook now uses 01.12.2026 (review C18). Put the same date into the scenario when building demo/ai-app, and move both if the demo date shifts past November.
- [ ] A6 full version is now scenario steps 1, 2, 3, 8, 9, 13; steps 4–7 and 10–12 are reserve (review C2). Time the full version at rehearsal: five model turns at up to 4 minutes each (jmix.dynmodel.ai.turn-timeout=4m) can still overrun 15 minutes.

- [x] Prompts are copyable: an action line with «промпт из следующей строки» turns the next studio action into a copyable prompt (core.js classifyActions). Since review C3 every question for CRM AI, Jmix AI, the report designer and the B4 teaser uses this convention, not only A6.
- [x] A6.exit is now «Точка выхода №2: сократить до 8 минут — только шаги с меткой [8] (1, 3, 8, 9, 13)».
- [x] A-pre starts aura-dark with the same STAND_JAR (port 8092, JMX 9192, about 1 GB more memory) and checks that the A6 scenario result is there; the A6 rehearsal runs on aura-dark the day before (review C6).
- [x] A4 checks the stand with curl, not stands.sh status, so it works while the working copy is on main or demo/agent-task. The tail -f path to instances/aura-light/application.log is untracked and survives the checkout.
- [ ] demo/ai-app does not exist yet. Are the A5 report with AI JPQL and the other A4/A5 prerequisites seeded by code or data in the branch, or created by hand through the UI? This decides whether an aura-light reset loses them.
- [x] Fallback screenshots live in assets/ next to the runbook (see the capture item in «Блоки A4, A5»).
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

- [ ] B3 no longer builds the role live; it opens the ready role from b/04-role (review C8). Confirm the role class name in b/04-role and that it shows under Jmix tool window → Security (role classes are listed there per jmix-studio SecuritySection.kt), and that double-click opens the role editor with the Entities and User Interface tabs.

- [ ] The base package of crm-from-db is unknown. The B2 enum action uses '<базовый пакет>.entity.OrderStatus' and should be replaced with the real package once the repo exists.
- [ ] b/02-model must match what the presenter does live: the USER_ class renamed to Employee; enums OrderStatus (NEW=10, ACCEPTED=20, IN_PROGRESS=30, DONE=40) and InvoiceStatus; instance names for CONTACT, ORDER_ and INVOICE; and traits mapped (VERSION, CREATED_*, UPDATED_*).
- [ ] B-pre (b-intro.json, not this file) needs four items. 1) After each rehearsal, reset PostgreSQL to the dump; the exact command depends on how db/docker-compose.yml loads db/crm.sql. 2) Start b/01-empty once. 3) Create the user sales/sales with no roles. 4) Run the '\d client' check to confirm there is no rating column.
- [ ] Possible blocker for b/01-empty: the template's 010-init-user.xml inserts a SEC_ROLE_ASSIGNMENT row with ID 6c9e420a-2b7a-4c42-8654-a9027ee14083, and the jmix-crm dump already has a row with that ID (admin → administrator). The first start against the dump would hit a primary-key conflict. The dump's admin role code 'administrator' also does not exist in the new project. This must be resolved when preparing b/01-empty.
- [ ] Check on rehearsal that, after switching Client to CREATE_ONLY on b/03-views, Generate Liquibase Changelog shows only addColumn RATING. Extra FK, index or type differences for CLIENT are possible.
- [ ] Check on rehearsal that renaming the USER_ class to Employee in Table Mapping Editor also updates the type of CLIENT.accountManager, so nothing still references User1.
- [ ] The view ids crm_Client.list, crm_Client.detail and crm_Invoice.list assume Project id crm and Studio's default underscore separator (ProjectState.isGenerateEntityNameWithUnderscore = true).
- [ ] The psql '\d client' action makes the same assumptions as B-pre: compose service 'db' on the official postgres image, with POSTGRES_USER and POSTGRES_DB.

## Runbook

- [ ] After the rehearsal, block facts, steps and the timer stay in localStorage (`jmix-runbook/v1`); R clears only the current block, and there is no «reset demo» key. Before the demo, delete the key on the demo machine (DevTools → Application → Local Storage) or press R on every block that has a fact.
- [ ] Rehearse each demo once in mirror mode on the real projector: on blocks with long Studio steps (A5, A6, B2) the dock grows to 30% of the screen, so check that the slide stays readable at that size.
