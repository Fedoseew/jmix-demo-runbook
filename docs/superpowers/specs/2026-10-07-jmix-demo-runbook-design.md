# Jmix Demo Runbook — дизайн

Дата: 2026-10-07. Статус: на ревью.

## 1. Цель

Два офлайн-демо Jmix для одного заказчика, две аудитории:

- **Группа A** — разработчики с ~годом опыта на Jmix. Тема: AI при разработке на Jmix и AI внутри Jmix-приложений. 60–90 минут.
- **Группа B** — разработчики, только начинающие с Jmix. Тема: что такое Jmix, где уместен, как создать проект, быстрое приложение из существующей БД. 40–60 минут.

Успех: минимум живой генерации кода на сцене, каждый шаг заранее подготовлен в ветке/стенде, переключение между шагами без пауз, у докладчика под рукой заметки, команды и таймер.

Деливерабл этой итерации: **план обоих демо + локальный HTML-runbook**. Демо-репозитории и ветки — следующая итерация (раздел 7 фиксирует, что именно).

## 2. Опорные факты (проверено локально 2026-10-07)

- `jmix-crm` `main` — Jmix 3.0.3, add-ons: aitools, reports, audit, appsettings; Spring AI OpenAI. Workspace «CRM AI» уже есть. Toolkit установлен (`.skills`, `.claude`, `.junie`, `.agents`).
- `jmix-crm` ветка `50-dynmodel-ai-agent` (tabbed-вариант не используем) — Jmix + Jmix Premium `3.1.999-SNAPSHOT` из local Maven. Add-ons: aitools, aichat, dynmodel, dynmodel-ai. Стенды `aura-light` :8091 … `aura-rtl` :8095 (используем `aura-light`; `aura-dark` :8092 — на Claude при `ANTHROPIC_API_KEY`), `OPENROUTER_API_KEY` (опц. `ANTHROPIC_API_KEY`), логин `admin/admin`, `demo/dynmodel-ai-agent/README.md` с готовыми сценариями.
- Reports band type **AI-generated JPQL** (`DataSetType.LLM`) — только в Jmix master (3.1), в 3.0.3 нет. Промпт → JPQL генерируется при авторинге через Text-to-Data Query из aitools, одна попытка исправления, запрос сохраняется с отчётом; запуск отчёта выполняет сохранённый JPQL через `DataManager` с правами текущего пользователя, модель на запуске не нужна.
- aitools data-load: генерация + валидация JPQL, проверка READ на весь граф запроса, row-level policies, `@ExcludeFromAi`, `@Secret`, non-persistent атрибуты скрыты.
- `jmix-agent-toolkit`: 22 skills (`content/skills/*`), guidelines-block, install wizard (CLI `install.sh` и Studio 3.0+ «AI Agents Toolkit»), регистрация MCP, Playwright.
- `jmix-cli`: wizard, те же шаблоны что Studio, bundled JRE. Локально `jmix --version` зависает — проверить до демо.
- CRM работает на HSQLDB file (`.jmix/hsqldb/b2b-crm`) — для reverse engineering заменяем на PostgreSQL в Docker с дампом.

## 3. Демо A — «AI × Jmix» (ядро 60, опции до 90)

| # | Блок | Мин | Опц. | Содержание | Действия докладчика |
|---|---|---|---|---|---|
| A-pre | Pre-flight | — | | Чек-лист из раздела 6 | до начала |
| A0 | Карта «AI × Jmix» | 5 | | Две оси: AI пишет Jmix-код / AI живёт внутри приложения. Почему Jmix хорош для vibe coding: метаданные, декларативный XML, security by default, server-side Vaadin, Studio inspections, Spring | слайд |
| A1 | Окружение агента | 10 | | jmix-agent-toolkit: install wizard (CLI и Studio), что появилось в проекте: skills, guidelines-block, MCP, Playwright. Guardrail-skills: `jmix-ide-static-analysis`, `jmix-verify-bootrun`, `jmix-verify-api-symbol`. Рекомендации по окружению: отдельная ветка, bootRun-проверка, не давать агенту prod-ключи | открыть `jmix-crm` `main`, показать `.skills`, `AGENTS.md`, `jmix` skill |
| A2 | Агент делает фичу | 15 | | Промпт «сущность + list/detail + роль + тест» на jmix-crm. Live-старт 2–3 мин, затем `git checkout demo/agent-task` с готовым результатом. Где фреймворк поймал ошибку: Studio inspection, Liquibase diff, роль без policy → данных нет, Bean Validation, Vaadin не даёт обойти серверную логику | терминал + Studio |
| A3 | Jmix CLI + Studio AI Assistant | 10 | да | `jmix` из скрипта/агента без wizard; AI Assistant в Studio. **Точка выхода №1** | терминал, Studio |
| A4 | AI внутри: CRM AI | 12 | | aitools data-load: вопрос → JPQL → валидация → ответ. Row-level security: admin vs manager — разные ответы на один вопрос. `@ExcludeFromAi`/`@Secret`. Ссылки на записи, отчёты из чата | стенд `aura-light` :8091 |
| A5 | AI JPQL в отчётах | 8 | | Report designer → band → тип «AI-generated JPQL» → промпт → сгенерированный JPQL виден и редактируем → параметры отчёта = named params → запуск под manager: права применяются, модель не нужна | тот же стенд, Reports |
| A6 | Dynamic Model AI | 15 | | Описание → план → review → Apply → экраны в меню сразу. Границы: отказ читать бизнес-данные, отказ менять тип поля. Сценарии из README ветки. **Точка выхода №2** (сократить до 8) | тот же стенд, Admin → Dynamic model settings → AI |
| A7 | Итоги + Q&A | 5–10 | | Что из показанного 3.0, что 3.1 preview. Как начать завтра: toolkit в проект, ссылки | слайд |

Ядро без A3 = 70 мин с Q&A 5. С A3 и полным A6 = 85–90.

## 4. Демо B — «Jmix с нуля» (ядро 45, опции до 60)

| # | Блок | Мин | Опц. | Содержание | Действия |
|---|---|---|---|---|---|
| B-pre | Pre-flight | — | | раздел 6 | |
| B0 | Что такое Jmix | 8 | | Spring Boot + Vaadin Flow + JPA; Studio + Framework + add-ons. Где хорош: back-office, ERP/CRM-подобные, много форм/таблиц/ролей, быстрый старт. Где не стоит: публичные high-load, мобильные, pixel-perfect маркетинг. Лицензии кратко | слайд |
| B1 | Проект двумя путями | 7 | | Studio New Project и `jmix` CLI — одни шаблоны. Структура проекта, запуск, логин | Studio, терминал |
| B2 | Приложение из существующей БД | 15 | | PostgreSQL с CRM-схемой и данными уже поднят. Studio → Data Store → Generate Model from DB → Client, Contact, Category, Product, Order, OrderLine → entities со связями → Create Views (list+detail) → run: данные на экране. Liquibase не трогает существующие таблицы | Studio, `git checkout b/02-model`, `b/03-views` |
| B3 | Доработка руками | 10 | | Атрибут `rating` в Client → Studio генерит changelog → поле в detail через дизайнер → resource role «manager: Clients read-only» → логин менеджером | Studio, `b/04-role` |
| B4 | Мост к AI | 5–10 | да | Toolkit установлен, один промпт «list view для Invoice» → результат из ветки; 3 мин CRM AI как тизер части A | `b/05-agent`, стенд :8091 |
| B5 | Итоги | 5 | | Доки, trial, с чего начать | слайд |

## 5. HTML-runbook

### 5.1 Ограничения

- Один файл `index.html`, открывается с диска (`file://`), **ноль внешних запросов** (офлайн-зал). Системные шрифты.
- Контент — JS-объект `DEMOS` в этом же файле, правится руками.
- Тёмная тема, крупный шрифт под проектор (слайд ≥ 28px, заметки ≥ 18px).
- Клавиатурная навигация обязательна; контраст текста ≥ 4.5:1.

### 5.2 Модель данных

```js
DEMOS = {
  a: { title, totalMin, blocks: [Block] },
  b: { title, totalMin, blocks: [Block] }
}
Block = {
  id: 'A2', title, minutes, optional?: true, exit?: 'текст точки выхода',
  slide: ['буллет', ...],          // 3–6, крупно, для зала
  notes: ['абзац', ...],           // заметки докладчика
  actions: [Action]                // что делать руками
}
Action = { kind: 'shell'|'git'|'url'|'studio'|'say', text }
```

`shell`/`git` — моноширинно + кнопка copy; `url` — ссылка (открывается в новой вкладке); `studio` — путь по меню Studio; `say` — ключевая фраза.

### 5.3 UI

- **Шапка:** переключатель A/B; таймер текущего блока (план → обратный отсчёт, красный при перерасходе); сумма план/факт по демо.
- **Слева:** список блоков: номер, название, минуты, бейдж «опц.», маркер выхода. Клик — переход. Активный подсвечен.
- **Центр:** слайд: заголовок + буллеты.
- **Режим докладчика** (клавиша `N`): под слайдом заметки и действия с copy-кнопками. Проектор зеркалится, поэтому синхронизация двух окон не делается.
- **Клавиши:** `←`/`→` блок, `N` заметки, `T` таймер старт/пауза, `R` сброс таймера блока, `F` fullscreen, `1`/`2` демо A/B.
- **localStorage:** текущее демо, блок, состояние таймера, флаг заметок. F5 не сбивает. Чтение/запись в try/catch.
- Copy: `navigator.clipboard`, fallback — выделение текста. `file://` в Chrome — secure context, работает.

### 5.4 Что сознательно не делаем

Синхронизация окон, анимации/переходы, печать, экспорт, подсветка синтаксиса, внешние библиотеки.

## 6. Pre-flight чек-лист (блок «pre» в обоих демо)

- JDK 21 в `PATH`; Docker запущен; `docker compose up -d` для PostgreSQL с дампом (демо B).
- Prebuilt jar'ы стендов `jmix-crm` ветки `demo/ai-app` собраны заранее — SNAPSHOT на месте не собирать.
- Ключи экспортированы: `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `SPRING_AI_OPENAI_APIKEY`.
- Studio открыт на `jmix-crm` и на проекте B; индексация завершена.
- `jmix --version` отвечает.
- **Интернет:** AI-блоки (A4–A6, B4) требуют доступ к LLM. Проверить Wi-Fi зала или hotspot. Fallback — скриншоты ответов, вложенные в runbook как ссылки на локальные файлы.
- Браузер: вкладки стенда и runbook открыты, zoom выставлен.

## 7. Репозитории и ветки (следующая итерация, вне объёма этой)

- `jmix-crm` ветка `demo/ai-app` от `50-dynmodel-ai-agent`: стенды, демо-данные под сценарии A4–A6, пример `@ExcludeFromAi`, отчёт с AI JPQL. Build по README ветки, jar'ы в `build/libs`.
- `jmix-crm` ветка `demo/agent-task` от `main`: результат агентской задачи A2 одним коммитом + промпт в `demo/PROMPT.md`.
- Новый репо `crm-from-db`: `db/docker-compose.yml` + `db/crm.sql` (PostgreSQL-дамп схемы и демо-данных CRM), ветки `b/01-empty` → `b/02-model` → `b/03-views` → `b/04-role` → `b/05-agent`.
- Runbook ссылается на ветки и порты по именам из этого раздела.

## 8. Проверка runbook

- Открыть `index.html` с диска: DevTools → Network пуст, Console без ошибок.
- `←`/`→`, клик по списку, `1`/`2`, `N`, `T`/`R`, `F` работают.
- Таймер: обратный отсчёт, красный после нуля, пауза/сброс.
- Copy кладёт команду в буфер.
- F5 восстанавливает демо/блок/таймер/заметки.
- Сумма минут блоков совпадает с планом из разделов 3–4.

## 9. Риски

| Риск | Митигация |
|---|---|
| Нет интернета на площадке | hotspot; скриншоты/видео ответов в runbook |
| SNAPSHOT-стенд не собирается перед демо | jar'ы собраны заранее и проверены за день |
| Live-агент в A2 ушёл не туда | таймбокс 3 мин, затем `checkout demo/agent-task` |
| Studio reverse engineering споткнётся на типах | дамп проверен заранее, ветка `b/02-model` как fallback |
| Перерасход времени | точки выхода A3, A6, B4; таймер |
