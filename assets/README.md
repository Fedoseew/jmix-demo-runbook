**Русский** · [English](#english)

# Скриншоты-fallback

Запасные скриншоты для AI-шагов демо, когда нет сети, ключа или стенда. Runbook открывает их последними действиями блоков (`open ~/IdeaProjects/jmix-demo-runbook/assets/…`), а pre-flight обоих демо проверяет папку командой `ls`. На скриншотах данные стенда, поэтому сами PNG в `.gitignore` и в репозиторий не попадают; в git лежит только этот файл.

Снимать после последнего сброса стенда, когда уже импортированы отчёты A5 и пройден сценарий A6 на `aura-dark` (абзац «Fallback'и A4–A6» в A-pre).

## Файлы

| Файл | Блок | Что на нём | Как снять |
|---|---|---|---|
| `a3-jmix-ai.png` | A3 | ответ Jmix AI в Studio на «Как в Jmix 3 показать менеджеру только договоры его клиентов?» | вручную |
| `a3-cli-command.png` | A3+ | строка «CLI command:» после полной генерации в мастере `jmix --no-update` | вручную |
| `a4-admin-q1.png` … `a4-admin-q4.png` | A4 | ответы CRM AI под admin на вопросы 1–4 (4 — с Connelly LLC в контексте) | скрипт, часть `a4` |
| `a4-alice-q1.png`, `a4-alice-q2.png` | A4 | те же вопросы 1–2 под alice: только её клиенты | скрипт, часть `a4` |
| `a5-ai-jpql-query.png` | A5 | полоса отчёта «Выручка клиентов (AI JPQL)»: промпт, сохранённый JPQL, колонки | скрипт, часть `a5` |
| `a5-admin-result.png`, `a5-alice-result.png` | A5 | запуск этого отчёта с 01.01.2024 по 31.12.2026 под admin и alice: на скриншоте видны первые строки без итога, у alice в списке только её клиенты (нет, например, Hackett, Corkery and Mraz и Batz-Goldner) | скрипт, часть `a5` |
| `a6-step1.png`, `a6-step3.png`, `a6-step8.png`, `a6-step13.png` | A6 | шаги 1, 3, 8 и 13 сценария | вручную, на репетиции на `aura-dark` |
| `a6-result-menu.png`, `a6-result-deals.png` | A6 | итог сценария: «Каталог» с «Демо-клиентами» и «Демо-сделками», список сделок с «Первой поставкой» | скрипт, часть `a6` |
| `b4-admin-revenue.png` | B4 | ответ CRM AI на вопрос тизера про лидеров по выручке | скрипт, часть `b4` |

## Что уже снято

Состояние на 9 октября 2026, ноутбук докладчика, настройка только с ключом OpenAI (`SPRING_AI_OPENAI_APIKEY`; CRM AI и агент Dynamic Model на `gpt-5.4`). Все снимки открыты и проверены.

| Файлы | Когда и как | Что проверено |
|---|---|---|
| `a4-*.png`, `b4-admin-revenue.png` | 8 октября, 23:55–23:57, скрипт, части `a4` и `b4` | admin: 30 клиентов, топ-3 Hackett, Corkery and Mraz / Batz-Goldner / Connelly LLC, «Новый»/«Принят» 25/40; alice: 13, 13/19; Client 360 по Connelly LLC; названия диалогов модель пишет по-английски |
| `a5-*.png` | 9 октября, 01:05, скрипт, часть `a5`, на свежем `aura-light` сразу после импорта архива | в меню нет «Демо-…»; сохранённый JPQL с колонками clientName, ordersCount, ordersTotal; отчёт под admin и alice |
| `a6-step1.png`, `a6-step3.png`, `a6-step8.png`, `a6-step13.png` | 9 октября, 01:12, скриптовый прогон полного сценария A6 с резервными шагами 10–11 на свежем `aura-dark` (скрипт вне репозитория) | план: 2 сущности, 12 изменений; атрибуты DemoDeal; «Изменения применены» без всплывающего уведомления; оба отказа шага 13. Шаг 13 снят после шагов 10–11, поэтому в меню уже есть «Демо-причины отказа» |
| `a6-result-menu.png`, `a6-result-deals.png` | 9 октября, 01:12, скрипт, часть `a6` | «Каталог» с «Демо-сделками», «Демо-клиентами», «Демо-причинами отказа»; «Первая поставка», Север, 12 500,50, 01.12.2026, «Срочно» — Да |

Нет `a3-jmix-ai.png` и `a3-cli-command.png`: их снимают только вручную (ниже). Базы стендов тех прогонов удалены вместе с временными рабочими копиями, поэтому диалоги A4, импорт A5 и прогон A6 на рабочей копии докладчика нужно повторить (абзац «Fallback'и A4–A6» в A-pre); сами PNG остаются годными.

## Скрипт

`tools/capture-fallbacks.mjs` входит на стенд в браузере (Playwright, как `tools/shot.mjs`), задаёт вопросы и сохраняет скриншоты 1440×900 сюда. Части:

- `a4` и `b4` спрашивают CRM AI. Каждый вопрос идёт в новом диалоге, поэтому заодно появляются диалоги в «Истории» admin и alice, которые pre-flight A-pre проверяет как основной запасной вариант A4. Нужен `SPRING_AI_OPENAI_APIKEY`. Скрипт проверяет только, что переменная задана в его оболочке, и значение не печатает. Стенд читает ключ при своём старте, поэтому стартуйте его из той же оболочки. Если стенд поднят без ключа, CRM AI показывает «Ключ OpenAI API не настроен», и скрипт останавливается с этим сообщением.
- `a5` модель не вызывает: открывает сохранённый запрос и запускает отчёт под admin и alice. Отчёты нужно сначала импортировать (действие A-pre). Архив повторно не импортирует: импорт затёр бы сохранённое на стенде.
- `a6` модель не вызывает: снимает итог сценария на `aura-dark` (`:8092`). Если «Демо-сделок» в «Каталоге» нет, сначала пройдите сценарий там. Сценарий ведёт агент Dynamic Model: без `OPENROUTER_API_KEY` он работает на том же `SPRING_AI_OPENAI_APIKEY` (`gpt-5.4`).

```bash
cd ~/IdeaProjects/jmix-demo-runbook
node tools/capture-fallbacks.mjs            # все части: a4 b4 a5 a6
node tools/capture-fallbacks.mjs a5 a6      # без ключа OpenAI
```

Переменные окружения: `STAND_URL` (по умолчанию `http://localhost:8091/b2b-crm/`), `A6_STAND_URL` (`http://localhost:8092/b2b-crm/`), `ASSETS_DIR` (эта папка), `ANSWER_TIMEOUT_S` (300 секунд на ответ), а также `PLAYWRIGHT_MODULE` и `CHROME_PATH`, как у остальных инструментов (см. `AGENTS.md`). Скрипт печатает путь каждого сохранённого файла, а упавшую часть — строкой `FAIL <часть>: причина`. Если что-то упало, код выхода 1. Остальные части при этом всё равно выполняются. Модель недетерминирована, поэтому каждый снимок нужно просмотреть: длинный ответ может не поместиться в окно, а странный ответ лучше переснять.

## Вручную

На macOS: Cmd+Shift+4, затем пробел и щелчок по окну; или Cmd+Shift+5. Файл сохранить сюда под именем из таблицы.

- `a3-jmix-ai.png`: в Studio открыть Jmix tool window → Help → Jmix AI, снять выделение в редакторе и задать вопрос из A3. Снять, когда ответ дописан.
- `a3-cli-command.png`: в пустой папке выполнить `(mkdir -p /tmp/jmix-demo/wizard && cd /tmp/jmix-demo/wizard && jmix --no-update)` и довести мастер до конца. Снять терминал со строкой «CLI command:». Созданный проект потом удалить.
- `a6-step*.png`: во время прогона сценария A6 на `aura-dark` накануне. Шаг 1 снимать, когда в «Рабочей области» появилось «Проверьте предложенный план». Шаг 3 — после «Проверить визуально». Шаг 8 — после «Изменения применены» в чате, с «Каталогом» в меню. Шаг 13 — после обоих ответов агента.

---

## English

**[Русский](#скриншоты-fallback)** · English

Fallback screenshots for the AI steps of the demos, for when there is no network, no key or no stand. The runbook opens them in the last action of a block (`open ~/IdeaProjects/jmix-demo-runbook/assets/…`), and the pre-flight of both demos lists this folder with `ls`. The screenshots show stand data, so the PNG files are git-ignored; only this file is tracked.

Capture them after the last stand reset, once the A5 reports are imported and the A6 scenario has been run on `aura-dark` (the «Fallback'и A4–A6» paragraph of A-pre).

### Files

| File | Block | Shows | How |
|---|---|---|---|
| `a3-jmix-ai.png` | A3 | the Jmix AI answer in Studio to «Как в Jmix 3 показать менеджеру только договоры его клиентов?» | by hand |
| `a3-cli-command.png` | A3+ | the «CLI command:» line after a complete generation in the `jmix --no-update` wizard | by hand |
| `a4-admin-q1.png` … `a4-admin-q4.png` | A4 | CRM AI answers as admin to questions 1–4 (4 with Connelly LLC in the context) | script, part `a4` |
| `a4-alice-q1.png`, `a4-alice-q2.png` | A4 | questions 1–2 as alice: only her clients | script, part `a4` |
| `a5-ai-jpql-query.png` | A5 | the band of «Выручка клиентов (AI JPQL)»: prompt, stored JPQL, columns | script, part `a5` |
| `a5-admin-result.png`, `a5-alice-result.png` | A5 | that report run for 01.01.2024–31.12.2026 as admin and alice: the shots show the first rows without a total; alice's list holds only her clients (for example, no Hackett, Corkery and Mraz or Batz-Goldner) | script, part `a5` |
| `a6-step1.png`, `a6-step3.png`, `a6-step8.png`, `a6-step13.png` | A6 | scenario steps 1, 3, 8 and 13 | by hand, at the rehearsal on `aura-dark` |
| `a6-result-menu.png`, `a6-result-deals.png` | A6 | the scenario result: «Каталог» with «Демо-клиенты» and «Демо-сделки», the deal list with «Первая поставка» | script, part `a6` |
| `b4-admin-revenue.png` | B4 | the CRM AI answer to the teaser question about revenue leaders | script, part `b4` |

### What is captured

As of 9 October 2026 on the presenter's laptop, in the OpenAI-only setup (`SPRING_AI_OPENAI_APIKEY`; CRM AI and the Dynamic Model agent on `gpt-5.4`). Every shot was opened and checked.

| Files | When and how | Checked |
|---|---|---|
| `a4-*.png`, `b4-admin-revenue.png` | 8 October, 23:55–23:57, script, parts `a4` and `b4` | admin: 30 clients, top-3 Hackett, Corkery and Mraz / Batz-Goldner / Connelly LLC, «Новый»/«Принят» 25/40; alice: 13, 13/19; Client 360 for Connelly LLC; the model names the dialogs in English |
| `a5-*.png` | 9 October, 01:05, script, part `a5`, on a fresh `aura-light` right after the archive import | no «Демо-…» in the menu; the stored JPQL with columns clientName, ordersCount, ordersTotal; the report as admin and as alice |
| `a6-step1.png`, `a6-step3.png`, `a6-step8.png`, `a6-step13.png` | 9 October, 01:12, a scripted run of the full A6 scenario with reserve steps 10–11 on a fresh `aura-dark` (the script is not in this repository) | plan: 2 entities, 12 changes; the DemoDeal attributes; «Изменения применены» without a toast; both step 13 refusals. Step 13 was taken after steps 10–11, so the menu already has «Демо-причины отказа» |
| `a6-result-menu.png`, `a6-result-deals.png` | 9 October, 01:12, script, part `a6` | «Каталог» with «Демо-сделки», «Демо-клиенты», «Демо-причины отказа»; «Первая поставка», Север, 12 500,50, 01.12.2026, «Срочно» Да |

Missing: `a3-jmix-ai.png` and `a3-cli-command.png`, which are taken by hand only (below). The stand databases of those runs were removed with their temporary working copies, so the A4 dialogs, the A5 import and the A6 run have to be repeated on the presenter's checkout (the «Fallback'и A4–A6» paragraph of A-pre); the PNG files stay valid.

### Script

`tools/capture-fallbacks.mjs` logs in to the stand in a browser (Playwright, like `tools/shot.mjs`), asks the questions and saves 1440×900 screenshots here. The parts:

- `a4` and `b4` ask CRM AI. Each question goes to a new dialog, so the script also creates the admin and alice dialogs in «История» that the A-pre pre-flight checks as the main A4 fallback. They need `SPRING_AI_OPENAI_APIKEY`. The script only checks that the variable is set in its own shell and never prints the value. The stand reads the key when it starts, so start it from the same shell. If the stand runs without the key, CRM AI shows «Ключ OpenAI API не настроен» and the script stops with that message.
- `a5` makes no model call: it opens the stored query and runs the report as admin and as alice. Import the reports first (an A-pre action). The script does not import the archive again, since that would overwrite what was saved on the stand.
- `a6` makes no model call: it captures the scenario result on `aura-dark` (`:8092`). If «Демо-сделки» is missing from «Каталог», run the scenario there first. The Dynamic Model agent runs that scenario: without `OPENROUTER_API_KEY` it uses the same `SPRING_AI_OPENAI_APIKEY` (`gpt-5.4`).

```bash
cd ~/IdeaProjects/jmix-demo-runbook
node tools/capture-fallbacks.mjs            # every part: a4 b4 a5 a6
node tools/capture-fallbacks.mjs a5 a6      # without an OpenAI key
```

Environment: `STAND_URL` (default `http://localhost:8091/b2b-crm/`), `A6_STAND_URL` (`http://localhost:8092/b2b-crm/`), `ASSETS_DIR` (this folder), `ANSWER_TIMEOUT_S` (300 seconds per answer), plus `PLAYWRIGHT_MODULE` and `CHROME_PATH` as for the other tools (see `AGENTS.md`). The script prints the path of every file it saves and reports a failed part as `FAIL <part>: reason`. If anything failed, the exit code is 1. The other parts still run. The model is not deterministic, so look at every shot: a long answer may not fit the window, and an odd answer is better captured again.

### By hand

On macOS: Cmd+Shift+4, then Space and a click on the window; or Cmd+Shift+5. Save the file here under the name from the table.

- `a3-jmix-ai.png`: in Studio open Jmix tool window → Help → Jmix AI, clear the editor selection and ask the A3 question. Capture once the answer is complete.
- `a3-cli-command.png`: in an empty folder run `(mkdir -p /tmp/jmix-demo/wizard && cd /tmp/jmix-demo/wizard && jmix --no-update)` and finish the wizard. Capture the terminal with the «CLI command:» line. Delete the generated project afterwards.
- `a6-step*.png`: while running the A6 scenario on `aura-dark` the day before. Capture step 1 once «Проверьте предложенный план» appears in «Рабочая область», step 3 after «Проверить визуально», step 8 after «Изменения применены» in the chat, with «Каталог» in the menu, and step 13 after both agent answers.
