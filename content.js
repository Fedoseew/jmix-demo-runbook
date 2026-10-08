// content.js — данные runbook обоих демо. Правится руками, проверяется `node --test`.
globalThis.DEMOS = {
  a: {
    title: "Демо A — AI × Jmix",
    blocks: [
      {
        id: "A-pre",
        title: "Pre-flight",
        minutes: 0,
        pre: true,
        slide: [
          "Накануне: ./demo setup — worktree jmix-crm-stand, jar ~/demo-jars/crm.jar, crm-from-db",
          "После репетиции: ./demo reset и ./demo prepare — свежая база, диалоги A4, скриншоты",
          "Стенд: ./demo up a или в IDEA «Stand aura-light (OpenAI)» — один из двух, не оба",
          "./demo check a без FAIL: JDK, ключ (и в стенде), :8091, отчёты A5, JPQL, jmix-crm на main",
          "localhost:8091/b2b-crm/, admin / admin, в меню есть Настройки динамической модели",
          "CRM AI: в Истории диалоги admin (1–4) и alice (1–2)",
          "Промпт A2 в буфере; worktree jmix-crm-live и ветки demo/live-run с репетиции нет",
          "Studio: индексация завершена, MCP Server включён, Jmix AI ответил на пробный вопрос",
          "Агент для A2 запускается, залогинен, видит JetBrains MCP — проверено не на проекторе",
          "Jmix CLI: A3 с --no-update прогнана в crm-cli-ready; каталога crm-cli нет",
          "Интернет и hotspot проверены; вкладки стенда и runbook, zoom под проектор"
        ],
        notes: [
          "Сборка накануне — ./demo setup. Команда из папки runbook (~/IdeaProjects/jmix-demo-runbook) готовит всё, что собирается: создаёт worktree ~/IdeaProjects/jmix-crm-stand на ветке demo/ai-app (из jmix-crm; сам jmix-crm всё время на main — на нём идут A1 и A2), собирает в нём ./gradlew bootJar и атомарно копирует jar в ~/demo-jars/crm.jar (через crm.jar.new и mv), клонирует crm-from-db, если его нет, и переключает его на b/01-empty (если нет локальных правок), ставит Playwright с Chromium в node_modules runbook, если их нет (для ./demo prepare). Пока стенд работает, setup отказывается: стенд читает классы из своего jar — сначала ./demo down. Ветка собирается против Jmix и Jmix Premium 3.1.999-SNAPSHOT из local Maven; если их там нет, setup печатает команды публикации из README ветки (demo/dynmodel-ai-agent/README.md, Build, шаги 2–3) и завершается с кодом 1. SNAPSHOT на площадке не пересобрать: нужен доступ к Jmix Premium и время. Worktree jmix-crm-stand открыть в IntelliJ IDEA отдельным проектом: в нём run-конфигурация «Stand aura-light (OpenAI)»; соседняя «CRM APP» — не стенд и заняла бы порт 8080 демо B, её не запускать.",
          "Два способа запустить стенд. ./demo up a запускает stands.sh start aura-light из worktree с STAND_JAR=\"$HOME/demo-jars/crm.jar\" и STAND_PROVIDER=openai (агент всегда на OpenAI, как в run-конфигурации) и ждёт HTTP 302 — редирект на вход (до 120 с; свежий стенд на репетиции отвечал через 16–23 с после start, с отчётами — около 25 с). В IntelliJ IDEA, в проекте jmix-crm-stand, run-конфигурация «Stand aura-light (OpenAI)» запускает то же приложение из исходников с теми же аргументами (перед запуском Make). Оба способа используют порт 8091, JMX-порт 9191, базу и лог в demo/dynmodel-ai-agent/instances/aura-light этого worktree, поэтому ./demo status, check, logs, down и reset работают с любым, а стенд из IDEA ./demo up a видит по занятому порту и второй не стартует. Запускать один из двух. Нужны свободные 8091 и 9191 и около 1 ГБ памяти; стенд слушает только 127.0.0.1.",
          "Остановка и сброс. Останавливать только ./demo down или одним нажатием Stop в IDEA: корректная остановка через JMX сохраняет базу HSQL. После kill -9 или перезагрузки без остановки стенд виснет на старте с «Waiting for changelog lock» — тогда сразу, до прихода зала, ./demo reset. reset спрашивает подтверждение (-y — без вопроса), останавливает стенд, удаляет instances/aura-light и стартует свежий стенд с демо-данными CRM; если стенд был запущен из IDEA, после удаления запустить run-конфигурацию снова. Отчёты A5 стенд импортирует сам при старте, если их нет (в логе строка «AI JPQL demo reports imported…»), ручного импорта нет; диалоги A4 после сброса записывает ./demo prepare.",
          "Прогон и fallback'и накануне. Прогнать A4–A6 на стенде, затем ./demo reset и ./demo prepare: всё, на что опираются запасные варианты, создаётся после последнего сброса. prepare (стенд поднят, ключ в окружении) запускает tools/capture-fallbacks.mjs a4 b4 a5: задаёт вопросы A4 под admin (1–4) и alice (1–2) — это и прогрев, и диалоги в «Истории», основной запасной вариант A4, — вопрос тизера B4, открывает и запускает отчёт A5 и обновляет скриншоты в assets/ (Playwright ставит ./demo setup; каждый снимок просмотреть). Запасной вариант A6 — готовые скриншоты assets/a6-*.png, второго стенда нет; a3-*.png снимаются руками (assets/README.md). Команду A3 один раз выполнить в запасной каталог: jmix --no-update new crm-cli --non-interactive --template application --locales en,ru --path /tmp/jmix-demo/crm-cli-ready. По README CLI офлайн работает только с шаблонами, закешированными в ~/.jmix/, а готовый каталог — запасной вариант A3 без сети. Каталога /tmp/jmix-demo/crm-cli быть не должно (его удаляет действие rm -rf): в него A3 генерирует проект на сцене, а непустой каталог неинтерактивный режим отклоняет.",
          "Автоматический pre-flight — ./demo check a. Таблица PASS / WARN / FAIL: java и javac 21+, SPRING_AI_OPENAI_APIKEY (только наличие), jmix --no-update --help, worktree и jar (WARN, если jar старше головы demo/ai-app: ./demo setup), стенд :8091 с HTTP 302 и тем, кто его запустил, ключи в самом стенде (tools/StandKeyCheck.java спрашивает стенд по JMX 9191 и печатает только set или missing для spring.ai.openai.api-key и crm.dynmodel.api-key: FAIL — стенд стартовал без ключа, ./demo down и ./demo up a из терминала с ключом или перезапуск IDEA), строка импорта отчётов A5 и строки executeQuery(jpql= в логе (их пишет ./demo prepare; 0 после prepare — стенд не из demo/ai-app), jmix-crm на main с чистыми tracked-файлами, ветка demo/agent-task, остатки jmix-crm-live с репетиции, Playwright для ./demo prepare, скриншоты в assets/ (нет файла — WARN: это запасные варианты). Код выхода 1, если есть FAIL; каждая строка FAIL говорит, что сделать. В день демо: ./demo up a, ./demo check a, затем ручные пункты ниже.",
          "Ключ OpenAI. Обязателен один ключ — SPRING_AI_OPENAI_APIKEY: им пользуются CRM AI-ассистент (spring.ai.openai.api-key в application.properties ветки 50-dynmodel-ai-agent, модель gpt-5.4) и агент Dynamic Model (gpt-5.4 на api.openai.com, своё подключение crm.dynmodel.*). stands.sh передаёт ключ агенту через окружение, run-конфигурация IDEA — плейсхолдером ${SPRING_AI_OPENAI_APIKEY:setup-required}, который Spring берёт из окружения (умолчание :setup-required не убирать: голый ${SPRING_AI_OPENAI_APIKEY} IDEA подставляет сама из своего окружения, и значение ключа попало бы в командную строку java — в ps и в заголовок консоли Run на проекторе): значение не записано нигде и на экран не выводится, ./demo проверяет только наличие. JVM стенда читает окружение при старте: ключ, добавленный позже, требует ./demo down и ./demo up a из терминала с ключом. IDEA на macOS берёт окружение login shell при своём запуске: после правки ~/.zshrc перезапустить IDEA. Без ключа ./demo up a не стартует стенд; стенд из IDEA стартует, но CRM AI показывает «Ключ OpenAI API не настроен…», агент отвечает ошибкой модели, а ./demo check a показывает FAIL в строках ключа стенда. ./demo up a и run-конфигурация всегда запускают агента на OpenAI; OPENROUTER_API_KEY на них не влияет.",
          "Проверка стенда руками. Вход admin / admin: в меню должен быть Администрирование → Настройки динамической модели (в английском UI Admin → Dynamic model settings) — признак сборки 3.1; если пункта нет, стенд поднят не с тем jar: ./demo setup, затем ./demo down и ./demo up a. Попал ли ключ в процесс стенда (важно для стенда из IDEA, запущенной до правки ~/.zshrc), ./demo check a спрашивает у самого стенда; руками смотреть уведомление в CRM AI не нужно. Прогрев и строки executeQuery(jpql= делает ./demo prepare, их проверяет ./demo check a. Затем «История» CRM AI: диалоги admin и, в приватном окне, alice; нет — ./demo prepare.",
          "Агент и промпт A2. Агент для A2 (claude, codex, opencode или junie — какой выбран) запустить, убедиться, что он залогинен и видит JetBrains MCP, — не на проекторе: ключ Context7 по README передаётся аргументом команды регистрации MCP и хранится в конфиге агента, поэтому список MCP-серверов и конфиг агента на экран не выводим. Промпт A2 есть только в demo/PROMPT.md ветки demo/agent-task — скопировать в буфер (действие с pbcopy) или держать открытым в отдельном окне. Worktree ~/IdeaProjects/jmix-crm-live и ветку demo/live-run с репетиции убрать заранее (./demo check a предупреждает о них; действие с worktree remove), иначе worktree add в A2 упадёт.",
          "Studio и jmix-crm. jmix-crm всё время на main: стенд живёт в отдельном worktree jmix-crm-stand, поэтому checkout в A2 его не трогает, а Studio перед A1 не пересинхронизирует Gradle из-за смены версии Jmix. Studio открыта на ~/IdeaProjects/jmix-crm, индексация завершена; ./demo check a проверяет main, чистые tracked-файлы и ветку demo/agent-task. Если в git status только M src/main/bundles/dev.bundle — это след запуска приложения в dev-режиме: git checkout -- src/main/bundles/dev.bundle. Settings → Tools → MCP Server: Enable MCP Server — флажок; если уже отмечен, не кликать, иначе MCP выключится прямо перед A2. Jmix AI (tool window в Studio): открыть и задать один пробный вопрос; что нужно для входа в Jmix AI, проверить заранее.",
          "Jmix CLI. В исходниках jmix-cli опции --version нет: jmix знает подкоманды new и update, флаги --no-update и -h/--help; jmix --help отвечается локально без проверки обновлений (./demo check проверяет jmix --no-update --help). Установленная сборка CLI (не в CI, без JMIX_CLI_NO_AUTO_UPDATE=1 и не чаще раза в 10 минут) перед другими командами проверяет новый релиз и может скачать и установить его — возможная, но не подтверждённая причина того, что jmix --version локально зависал; точную причину проверить заранее. Накануне осознанно выполнить jmix update; на сцене каждая команда jmix идёт с --no-update (флаг принимается и до, и после подкоманды) или в терминале выставлен JMIX_CLI_NO_AUTO_UPDATE=1.",
          "Сеть и браузер. LLM-вызовы идут наружу: и агент Dynamic Model, и CRM AI — в OpenAI (api.openai.com); проверить Wi-Fi зала, держать hotspot. Скриншоты-fallback лежат в assets/ рядом с runbook: a3-*.png (строка «CLI command:», ответ Jmix AI), a4-*.png, a5-*.png, a6-*.png — их снимают на репетиции (полный список и способ — assets/README.md), наличие проверяет ./demo check a. Вкладки: стенд с входом admin / admin и runbook, zoom под проектор, в Studio крупный шрифт. gpt-5.4 иногда отвечает на тот же запрос по-разному, чаще в мелочах: подписи полей со строчной буквы («телефон» вместо «Телефон») — не ошибка, продолжать; странный по сути ответ — просто повторить; после перезагрузки страницы режим AI в настройках динамической модели не восстанавливается — выбрать его снова."
        ],
        actions: [
          {
            kind: "shell",
            text: "cd ~/IdeaProjects/jmix-demo-runbook && ./demo setup"
          },
          {
            kind: "shell",
            text: "./demo up a"
          },
          {
            kind: "studio",
            text: "Или IDEA вместо ./demo up a: File → Open → ~/IdeaProjects/jmix-crm-stand → Run «Stand aura-light (OpenAI)»"
          },
          {
            kind: "shell",
            text: "./demo reset"
          },
          {
            kind: "shell",
            text: "./demo prepare"
          },
          {
            kind: "shell",
            text: "./demo check a"
          },
          {
            kind: "url",
            text: "http://localhost:8091/b2b-crm/"
          },
          {
            kind: "studio",
            text: "Стенд → вход admin / admin → меню Администрирование → Настройки динамической модели (EN: Admin → Dynamic model settings; пункт есть = сборка 3.1)"
          },
          {
            kind: "studio",
            text: "Стенд → CRM AI → История: диалоги admin с вопросами 1–4 из A4; приватное окно → alice / alice → История: вопросы 1–2; нет — ./demo prepare"
          },
          {
            kind: "git",
            text: "git -C ~/IdeaProjects/jmix-crm worktree remove --force ~/IdeaProjects/jmix-crm-live; git -C ~/IdeaProjects/jmix-crm branch -D demo/live-run"
          },
          {
            kind: "shell",
            text: "git -C ~/IdeaProjects/jmix-crm show demo/agent-task:demo/PROMPT.md | pbcopy"
          },
          {
            kind: "studio",
            text: "Settings → Tools → MCP Server → Enable MCP Server: только убедиться, что отмечен (не кликать)"
          },
          {
            kind: "studio",
            text: "Tool window Jmix AI (выделение в редакторе снять) → пробный вопрос — промпт из следующей строки"
          },
          {
            kind: "studio",
            text: "Как в Jmix 3 показать менеджеру только договоры его клиентов?"
          },
          {
            kind: "shell",
            text: "command -v claude"
          },
          {
            kind: "shell",
            text: "mkdir -p /tmp/jmix-demo && jmix --no-update new crm-cli --non-interactive --template application --locales en,ru --path /tmp/jmix-demo/crm-cli-ready"
          },
          {
            kind: "shell",
            text: "rm -rf /tmp/jmix-demo/crm-cli"
          }
        ]
      },
      {
        id: "A0",
        title: "Карта «AI × Jmix»",
        minutes: 5,
        slide: [
          "Ось 1: AI пишет Jmix-код — toolkit, агент, Jmix CLI, Jmix AI (Studio AI Assistant)",
          "Ось 2: AI внутри приложения — CRM AI, AI JPQL в отчётах, Dynamic Model AI",
          "Spring Boot знаком моделям; метаданные и XSD ловят ошибки до запуска",
          "Security by default: без ролей нет ни данных, ни UI; resource и row-level роли",
          "Vaadin Flow: UI на типизированной Java, без второго стека и REST-слоя",
          "Честно: агент уверенно выдумывает API — ловим инспекциями, тестами и ревью"
        ],
        notes: [
          "Карта на 5 минут. Две оси: первая — AI помогает писать Jmix-код (A1–A3: toolkit, агент делает фичу, Jmix CLI и Jmix AI — так в IDE называется Studio AI Assistant), вторая — AI работает внутри Jmix-приложения (A4–A6 на стенде b2b-crm). Сразу проговорить версии: toolkit и Jmix CLI работают с Jmix 3 уже сейчас; add-on AI Tools, на котором построен CRM-ассистент, есть в выпущенной 3.0 — ветка main jmix-crm на 3.0.3 его использует; AI-generated JPQL в отчётах и Dynamic Model AI с AI-чатом — это Jmix 3.1, она ещё не выпущена, стенд собран на 3.1.999-SNAPSHOT, то есть это preview.",
          "Почему Jmix удобен агенту. Каждый пункт — о том, где ошибка агента становится видимой. Метаданные: сущности с @JmixEntity и fetch plans — фреймворк знает каждый атрибут, забытая аннотация падает сразу («MetaClass not found» при старте контекста), незагруженный атрибут подсвечивает инспекция. XML-экраны описаны схемами (view.xsd, layout.xsd): инспекции Studio ловят неразрешённые msg://, неверные property path и пропавшие data containers — то, чего не видит компилятор; агент получает их через JetBrains MCP. Spring Boot моделям хорошо знаком, и большая часть кода — обычный Spring. Liquibase changelog — обычный файл в diff, его ревьюит человек.",
          "Security by default. Без resource roles пользователь не видит ни данных, ни UI; модель аддитивная, deny-политик нет: resource role — что можно делать, row-level role — какие строки видны. Для агента это значит: сущность без политики в роли обычный пользователь просто не увидит — ошибка заметна сразу и не становится утечкой. Vaadin Flow: UI — типизированная Java в той же JVM, что и бэкенд; второго JS/TS-стека и REST-слоя, который агент мог бы забыть защитить, нет. Источник, если спросят, — docs.jmix.io, Security → Resource Roles; на сцене не открываем.",
          "Честные ограничения. Skills из toolkit прямо пишут агенту: твои знания Jmix и Vaadin ненадёжны — модели уверенно выдумывают имена API (например, JmixButton.ClickEvent или io.jmix.flowui.dialogs.Dialogs). compileJava не видит ошибок в XML-дескрипторах, зелёный clean test не доказывает, что экран открывается, а инспекция может пропустить неизвестный компонент или атрибут. Attribute-политики применяют UI и сериализация, а не DataManager: сервис, написанный агентом, может записать атрибут, которого роль не даёт. Несуществующая CSS-переменная (--lumo-* в теме Aura) молча игнорируется, а код вне запроса пользователя — планировщики, @Async — гейты сами по себе не проверяют.",
          "Вывод и переход. Фреймворк не делает агента безошибочным — он сужает пространство ошибок и делает их видимыми раньше продакшена: в IDE, в тесте, на пустом экране без прав. Остальное закрывают окружение и дисциплина — об этом следующий блок про jmix-agent-toolkit. Не обещать залу, что AI сам напишет приложение."
        ],
        actions: [
          {
            kind: "say",
            text: "Две оси: AI помогает писать Jmix-код и AI работает внутри Jmix-приложения"
          },
          {
            kind: "say",
            text: "Toolkit и CRM-ассистент — уже сейчас; AI-JPQL и Dynamic Model AI — Jmix 3.1 preview"
          },
          {
            kind: "say",
            text: "Без ролей пользователь не видит ни данных, ни UI — так по умолчанию"
          },
          {
            kind: "say",
            text: "Фреймворк не делает агента безошибочным, он делает ошибки видимыми раньше"
          }
        ]
      },
      {
        id: "A1",
        title: "Окружение агента: jmix-agent-toolkit",
        minutes: 10,
        slide: [
          "jmix-agent-toolkit: 20+ skills, блок guidelines, MCP и Playwright для агента",
          "Установка: Studio 3.0+ (Settings → AI Agents Toolkit) или мастер install.sh",
          "Хаб-skill jmix читается первым: задача → артефакты → нужный skill → гейты",
          "Гейты: jmix-verify-api-symbol, jmix-ide-static-analysis, jmix-verify-bootrun",
          "JetBrains MCP: агент сам запускает инспекции IDE — проект держим открытым",
          "Отдельная ветка, тестовая БД, без prod-ключей, ревью diff и доказательств гейтов"
        ],
        notes: [
          "Тайминг 10 минут: установка 2, файлы в репозитории 2, хаб-skill 2, guardrails 3, окружение 1. Если отстаём — всё с пометкой «если спросят» пропускаем. Что это: jmix-agent-toolkit — открытый репозиторий jmix-framework/jmix-agent-toolkit, на каждую мажорную версию Jmix своя ветка (v3 для Jmix 3), в content/ лежат guidelines-block.md и skills/. Проекты, созданные Jmix CLI, получают toolkit по умолчанию (отключается флагом --no-agents-toolkit) — это видно в A3. Если спросят: установщик поддерживает агентов claude, codex, opencode, junie; мастер идёт в 5 шагов — [1/5] skills локально в .skills проекта или глобально в ~/.agents/.jmix/skills/v3, [2/5] блок guidelines, [3/5] JetBrains MCP, [4/5] Context7 MCP (нужен API-ключ, без него шаг пропускается), [5/5] Playwright через npx @playwright/cli (нужен Node.js); для скриптов есть подкоманды install.sh skills, agents-md, mcp-jetbrains, mcp-context7, playwright с обязательным --agents.",
          "Как показать установку. Установщик живьём не запускаем: он меняет файлы проекта, скачивает содержимое с GitHub и задаёт вопросы, а терминал стоит в jmix-crm прямо перед A2 — повторная установка оставит diff, который увидит агент. Поэтому первое действие только печатает через echo команду из раздела README «Quick CLI Installation»; итог установки — запись или скриншот сводки «=== Setup complete ===». В Studio 3.0+: Jmix tool window → меню Settings → AI Agents Toolkit... — пошаговый диалог «Step N of M» с «Command to run:» и кнопками Run, Skip, Next; показать первый шаг и закрыть по Cancel, Run не нажимать. Studio скачивает метаданные установщика с GitHub, без интернета диалог покажет ошибку — тогда скриншот.",
          "Что появилось в проекте (jmix-crm, main). ls -d показывает .skills, .claude, .agents, .junie, AGENTS.md, CLAUDE.md. В .skills — 22 папки skills, это общее хранилище. .claude/skills, .agents/skills и .junie/skills — обычные папки, в них каждая skill-папка — отдельный симлинк на .skills/<skill> (на экране jmix -> ../../.skills/jmix): агенты не сканируют вложенные папки, поэтому README toolkit требует линковать каждый skill, а не всю папку skills одной ссылкой. Всё закоммичено — вся команда и все агенты работают по одним правилам. AGENTS.md и .junie/guidelines.md содержат только размеченный блок между <!-- BEGIN jmix-agent-toolkit --> и <!-- END jmix-agent-toolkit -->, свой текст вне маркеров при переустановке сохраняется; CLAUDE.md — одна строка @AGENTS.md. Регистрация MCP лежит в пользовательском конфиге агента, а не в репозитории; список MCP и конфиг агента не показывать — там ключ Context7. Playwright-skills мастер всегда ставит глобально (~/.agents/.playwright/skills и ссылки в папках агентов в домашнем каталоге), поэтому в репозитории их нет. Число skills: в jmix-crm 22, столько же и тех же в upstream v3 (0b4386b, 8 октября 2026), включая jmix-migrate-theme-to-aura; перед демо пересчитать по upstream v3.",
          "Хаб-skill jmix. Блок guidelines говорит агенту одно: прежде чем менять любой файл, прочитай skill jmix. Открыть .skills/jmix/SKILL.md и показать только два раздела: Step 0 — разложить задачу на артефакты и прочитать нужный skill до написания кода; таблицу Closing a task — three gates. Если спросят: Skill routing (какой skill отвечает за сущность, list и detail view, роль, changelog, тест), правило «skill важнее примера кода из плана», запрет использовать bootRun как проверку — он не завершается и вешает агента, File-write trap — 0-байтовый класс роли или дескриптор компиляция не ловит.",
          "Guardrail-skills. jmix-verify-api-symbol: перед любым классом, константой, событием или методом, которого агент ещё не видел в проекте, убедиться, что он существует — Context7, поиск символа в IDE, рабочий пример в коде; в skill есть список типичных выдумок. jmix-ide-static-analysis: инспекция IDE по каждому изменённому файлу через JetBrains MCP (get_file_problems), включая предупреждения — только она ловит неразрешённые msg://, неверные property path и отсутствующие data containers в *-view.xml; пустому результату не верить, пока не подтверждено, что инспектировался нужный проект; compileJava к XML слеп. jmix-verify-bootrun: Gate 2 — ./gradlew --no-daemon clean test, «Tests run: 0» проходом не считается; Gate 3 — пройти каждый созданный экран в браузере (например, через Playwright) или написать @UiTest. Если спросят: javap по jar из кэша Gradle именно той версии, что закреплена в проекте (не новейшего SNAPSHOT); Context7-библиотека /jmix-framework/jmix-context7; данные для обхода экранов — во временную HSQLDB через --main.datasource.url, а не в рабочую базу.",
          "Рекомендации к окружению (1 минута). Отдельная ветка на задачу; если worktree — открыть его в IDE как отдельный проект, иначе инспекции возвращают мусор (skill требует, чтобы git rev-parse --show-toplevel совпадал с корнем проекта в IDE). IDE с проектом открыта, MCP Server включён. Агент сам прогоняет гейты, но в отчёте нужны доказательства по каждому файлу и экрану — ответ «BUILD SUCCESSFUL, all done» skill прямо называет не-ответом. Агенту — только dev-ключи и тестовая база, никаких production-учёток; diff смотрит человек, тесты запускает сам. Пример из skill jmix-verify-bootrun: не пересобирать checkout, из jar которого работает приложение, — поэтому стенд запущен из копии jar вне репозитория."
        ],
        actions: [
          {
            kind: "shell",
            text: "echo 'curl -fsSL https://raw.githubusercontent.com/jmix-framework/jmix-agent-toolkit/v3/install.sh | bash'"
          },
          {
            kind: "studio",
            text: "Jmix tool window → Settings → AI Agents Toolkit... → показать Step 1 и Command to run → Cancel (Run не нажимать)"
          },
          {
            kind: "shell",
            text: "cd ~/IdeaProjects/jmix-crm && ls -d .skills .claude .agents .junie AGENTS.md CLAUDE.md"
          },
          {
            kind: "shell",
            text: "ls ~/IdeaProjects/jmix-crm/.skills"
          },
          {
            kind: "shell",
            text: "ls ~/IdeaProjects/jmix-crm/.skills | wc -l"
          },
          {
            kind: "shell",
            text: "ls -l ~/IdeaProjects/jmix-crm/.claude/skills | head -5"
          },
          {
            kind: "shell",
            text: "cat ~/IdeaProjects/jmix-crm/AGENTS.md"
          },
          {
            kind: "shell",
            text: "cat ~/IdeaProjects/jmix-crm/CLAUDE.md"
          },
          {
            kind: "studio",
            text: "Project tool window → .skills → jmix → SKILL.md → Step 0 и Closing a task — three gates"
          },
          {
            kind: "say",
            text: "Агент сначала читает skill jmix, а не свою память о Jmix"
          },
          {
            kind: "studio",
            text: "Settings → Tools → MCP Server → Enable MCP Server: только показать, что отмечен (не кликать)"
          },
          {
            kind: "say",
            text: "Skills — это правила, гейты — доказательства; без доказательств задача не закрыта"
          }
        ]
      },
      {
        id: "A2",
        title: "Агент делает фичу",
        minutes: 15,
        slide: [
          "Задача: договоры Contract — сущность, список, карточка, роль и тест в jmix-crm",
          "Агент идёт по skills toolkit: jmix → create-entity → views → role → test",
          "Live — 3 минуты, затем готовый результат из ветки demo/agent-task",
          "Инспекции Studio ловят ошибки в XML, fetch plan и ролях, а компилятор — нет",
          "Без политик роль не видит ни меню, ни данных — security by default",
          "Bean Validation срабатывает и в карточке, и при DataManager.save"
        ],
        notes: [
          "Цель блока: показать, что агент на Jmix пишет код не «по памяти», а по правилам фреймворка, и что сам Jmix страхует от типичных ошибок. Проект — jmix-crm, ветка main: релизный Jmix 3.0.3, toolkit уже установлен (.skills, CLAUDE.md ссылается на AGENTS.md, а блок jmix-agent-toolkit в нём требует сначала прочитать skill jmix). Фича — договоры с клиентами: в доменной модели CRM их нет, и это ровно тот набор, на котором агенты обычно ошибаются: сущность, changelog, два экрана, роль, тест.",
          "Промпт для demo/PROMPT.md. На сцене не читать целиком — только назвать четыре пункта: «Добавь в B2B CRM договоры с клиентами. 1) Сущность Contract в пакете com.company.crm.model.contract, наследник FullAuditEntity: client — обязательная ссылка на Client; number — обязательный уникальный номер до 50 символов; signedDate — обязательная дата подписания; validUntil — дата окончания; amount — сумма, не может быть отрицательной, тот же тип данных, что у Payment.amount; comment — длинный текст. Liquibase changelog 050-contract.xml рядом с существующими 010–040. 2) Экраны Contract.list и Contract.detail в пакете com.company.crm.view.contract, пункт меню contracts сразу после clients, подписи для всех языков проекта. 3) Ресурсная роль ContractManagerRole с кодом contract-manager: полный доступ к Contract, политики экранов и меню; ManagerRole её расширяет. Row-level политика для Contract в OnlyMyAccountsRole по client.accountManager, как у Invoice. 4) Тесты в пакете com.company.crm.test.contract: интеграционный — менеджер создаёт и читает договор, договор с отрицательной суммой не сохраняется, пользователь только с UiMinimalRole получает пустой список договоров; UI-тест на базе AbstractUiTest — Contract.list и Contract.detail открываются. Закрой задачу тремя гейтами из skill jmix; Gate 3 — через этот UI-тест, приложение (bootRun) не запускай. Перечисли доказательства по гейтам в сообщении коммита. Результат — один коммит.»",
          "Live-старт — во второй вкладке терминала и в отдельном worktree от main (ветка demo/live-run): основная копия остаётся чистой, и checkout готовой ветки в первой вкладке не упрётся в незакоммиченные файлы. Это и есть рекомендованный guardrail: агент работает в своей ветке, разрешения на команды подтверждаем руками, prod-ключей агенту не даём. Что показать за 3 минуты: агент первым открывает skill jmix и по Step 0 составляет список артефактов, затем читает skill на каждый — jmix-create-entity, jmix-create-liquibase-changelog, jmix-create-list-view, jmix-create-detail-view, jmix-create-resource-role, jmix-add-i18n-keys, jmix-create-test. Рассказать про три гейта skill jmix: Gate 1 — jmix-verify-api-symbol и jmix-ide-static-analysis (основной путь — инспекции IDE через JetBrains MCP, get_file_problems; без подключения — compileJava и механические проверки дескрипторов); Gate 2 — jmix-verify-bootrun: ./gradlew --no-daemon clean test, bootRun как Gate 2 запрещён, потому что не завершается; Gate 3 — каждый новый экран надо реально открыть: render walk браузерным инструментом или headless @UiTest, поэтому в промпте UI-тест. По таймеру — Esc во вкладке агента, чтобы прервать ход, не дожидаясь кода; вкладку оставить и вернуться в первую.",
          "Готовая ветка. В первой вкладке, в основной копии ~/IdeaProjects/jmix-crm: git checkout demo/agent-task и git log --oneline -3 — сверху коммит агента (feat: add client contracts…), под ним коммит с промптом demo/PROMPT.md, третьей строкой — коммит main, от которого ответвлена ветка. git diff --stat main...demo/agent-task — пройтись по списку: Contract, 050-contract.xml, контроллеры и дескрипторы экранов, ContractManagerRole, правки ManagerRole и OnlyMyAccountsRole, CrmConstants (id экранов), menu.xml и messages, тесты и DataCleaner (порядок очистки из-за FK на Client); demo/PROMPT.md — сам промпт. Сообщение коммита — отчёт по гейтам: skill jmix требует вердикт статической проверки по каждому файлу и способ проверки каждого нового экрана. Пока зал читает diff, открыть вкладки: contract-detail-view.xml, ContractManagerRole.java, Contract.java и 050-contract.xml, ContractIntegrationTest.java. В pre-flight их не открыть: до checkout этих файлов на main нет.",
          "Контроль времени. К 7-й минуте блока на экране diff. Если отстаём — пропустить третью инспекцию (роль), оговорки сократить до одной фразы про row-level. Generate Liquibase Changelog — только если есть запас: условия и риски — в абзаце «Liquibase ↔ entity».",
          "Инспекции, каждый раз Undo. В contract-detail-view.xml у поля в formLayout испортить property (например, numbr) — значение подсветится красным как неразрешённая ссылка: «Property path \"numbr\" is invalid for entity class \"Contract\"»; в fetchPlan того же файла убрать property client — подсветится атрибут property поля client: «Jmix: This attribute is not included into the fetch plan»; в ContractManagerRole в @ViewPolicy вписать строкой \"Contract.lst\" вместо id или константы списка — аннотация подсветится: «View Contract.lst does not exist.» (инспекция Role policy refers to a missing view); рядом второе предупреждение «View contracts contained in @MenuPolicy must be in @ViewPolicy.» — пункт меню остался без политики экрана. Важно: агент, скорее всего, возьмёт константы CrmConstants.ViewIds, как в ManagerRole, — правка самой константы меняет id и у контроллера, и у политики, поэтому инспекцию не вызовет. Компилятор всего этого не видит; агент получает те же инспекции через JetBrains MCP, когда IDE открыта на его рабочей копии.",
          "Liquibase ↔ entity. Contract.java и 050-contract.xml рядом (Split Right) — nullable, length, unique, precision и scale должны совпасть (Constraint Audit в jmix-create-entity); unique у Contract не в @Column, а в @Table(indexes = @Index(name = \"IDX_CONTRACT_ON_NUMBER\", unique = true)) — против createIndex unique=\"true\" во втором changeSet. Если есть запас — Studio сравнивает модель с БД через Generate Liquibase Changelog и при совпадении пишет «The database is already synced with model.» Шаг рискованный, поэтому не по умолчанию: функция Studio по подписке, требует БД этой ветки (HSQLDB-файл .jmix/hsqldb/b2b-crm основной копии: на репетиции один раз запустить приложение на demo/agent-task, чтобы 050-contract.xml применился к этой базе), а само приложение этой копии в момент сравнения должно быть остановлено — файловая HSQLDB держит блокировку (проверить на репетиции); если не работает — сравнить changelog и entity глазами. Запуск приложения в dev-режиме пересобирает dev bundle Vaadin (npm install): после остановки выполнить git checkout -- src/main/bundles/dev.bundle и удалить package.json, package-lock.json, tsconfig.json, types.d.ts, vite.config.ts и .vaadin-node-tasks.lock, если они появились, иначе git status --short --untracked-files=no в pre-flight не пуст.",
          "Security by default: модель ролей аддитивная, запретов нет — нет политики, нет доступа. Роль без EntityPolicy не падает с ошибкой, а не видит данные: DataManager отменяет загрузку и возвращает пустой список (DataStoreCrudListener), без ViewPolicy и MenuPolicy экрана нет в меню и он не открывается. Открыть тест агента: метод с пользователем только с UiMinimalRole ожидает пустой список. Bean Validation: @PositiveOrZero на amount срабатывает и в карточке (StandardDetailView валидирует перед сохранением), и при DataManager.save — Jmix настраивает JPA с jakarta.persistence.validation.mode=AUTO, поэтому save бросает jakarta.validation.ConstraintViolationException из prePersist, а строка не сохраняется; в том же тесте — метод contractWithNegativeAmountIsNotSaved. Server-side Vaadin: экран — Java-контроллер и XML на сервере, данные грузятся через DataManager с правами пользователя; отдельного REST- или JS-слоя, где агент мог бы забыть проверку, нет. Честно сказать, чего фреймворк не ловит: забытая row-level политика означает «видно больше», а не «не видно», поэтому OnlyMyAccountsRole названа в промпте явно; attribute-политики применяют UI и сериализация, но не DataManager; несуществующий CSS-токен темы не ловит ни одна статическая проверка (skill jmix-style-ui).",
          "Подводные камни. Агент ушёл не туда или сеть тормозит — не ждать, сразу checkout готовой ветки. Checkout ругается на изменения — значит, live запускали не в worktree: git stash -u и повторить. Worktree ~/IdeaProjects/jmix-crm-live и ветку demo/live-run с репетиции убрать заранее, иначе worktree add упадёт; в крайнем случае взять другое имя. Worktree можно создать и до начала сессии — тогда команду worktree add на сцене пропустить. При первом запуске в новом каталоге Claude Code может спросить, доверять ли папке, — подтвердить; на репетиции проверить, повторяется ли вопрос для того же пути.",
          "MCP и инспекции. В live-worktree MCP-инспекции не авторитетны: IDE открыта на основной копии, а jmix-ide-static-analysis сверяет git toplevel файла с корнем проекта IDE, — поэтому гейты показываем только на готовой ветке. Ветка demo/agent-task записана в копии, открытой в Studio с включённым MCP Server (Settings → Tools → MCP Server): в сообщении коммита — вердикт get_file_problems по каждому файлу и UI-тест ContractViewsUiTest для Contract.list и Contract.detail. Studio должна быть открыта на ~/IdeaProjects/jmix-crm с завершёнными Gradle sync и индексацией, иначе инспекции не подсветятся: пока Studio не загрузила модель проекта, в *-view.xml на xmlns висит «URI is not registered», а испорченный property не подсвечивается. Стенд :8091 работает из отдельного worktree ~/IdeaProjects/jmix-crm-stand (ветка demo/ai-app), поэтому checkout в A2 его не трогает."
        ],
        actions: [
          {
            kind: "say",
            text: "Агент работает вживую три минуты, дальше — готовый результат из ветки"
          },
          {
            kind: "shell",
            text: "git -C ~/IdeaProjects/jmix-crm show demo/agent-task:demo/PROMPT.md"
          },
          {
            kind: "git",
            text: "git -C ~/IdeaProjects/jmix-crm worktree add -b demo/live-run ~/IdeaProjects/jmix-crm-live main"
          },
          {
            kind: "shell",
            text: "cd ~/IdeaProjects/jmix-crm-live && claude \"$(git show demo/agent-task:demo/PROMPT.md)\""
          },
          {
            kind: "say",
            text: "Агент сначала читает skill jmix и раскладывает задачу на артефакты, а не пишет по памяти"
          },
          {
            kind: "shell",
            text: "cd ~/IdeaProjects/jmix-crm"
          },
          {
            kind: "git",
            text: "git checkout demo/agent-task && git log --oneline -3"
          },
          {
            kind: "git",
            text: "git diff --stat main...demo/agent-task"
          },
          {
            kind: "git",
            text: "git log -1 --format=%B"
          },
          {
            kind: "studio",
            text: "Открыть вкладки: contract-detail-view.xml, ContractManagerRole.java, Contract.java, 050-contract.xml, ContractIntegrationTest.java (Navigate → File…)"
          },
          {
            kind: "studio",
            text: "Вкладка contract-detail-view.xml → у поля в formLayout испортить property → «Property path … is invalid for entity class …» → Undo"
          },
          {
            kind: "studio",
            text: "contract-detail-view.xml → fetchPlan → убрать property client → поле client: «Jmix: This attribute is not included into the fetch plan» → Undo"
          },
          {
            kind: "studio",
            text: "ContractManagerRole.java → @ViewPolicy → вписать строку \"Contract.lst\" вместо id списка → «View Contract.lst does not exist.» → Undo"
          },
          {
            kind: "studio",
            text: "Вкладка Contract.java → Split Right → 050-contract.xml: nullable, length, unique, precision совпадают"
          },
          {
            kind: "studio",
            text: "Если есть запас: Jmix tool window → Data Stores → Main Data Store → правый клик → Generate Liquibase Changelog"
          },
          {
            kind: "studio",
            text: "Вкладка ContractIntegrationTest → userWithOnlyUiMinimalRoleGetsEmptyContractList: пустой список; contractWithNegativeAmountIsNotSaved: не сохраняется"
          },
          {
            kind: "say",
            text: "Ошибка в роли у Jmix — это «ничего не видно», а не «видно всё»; исключение — забытая row-level политика"
          }
        ]
      },
      {
        id: "A3",
        title: "Jmix CLI и Jmix AI",
        minutes: 3,
        exit: "Точка выхода №1: при отставании — после вопроса Jmix AI сразу к A4, A3+ пропустить",
        slide: [
          "Jmix CLI: новый проект без IDE — те же шаблоны, что в Studio",
          "jmix new … --non-interactive: одна команда для скриптов, CI и AI-агентов",
          "В новом проекте сразу Agent Toolkit: .skills и guidelines для агентов",
          "Jmix AI в Studio: чат по документации Jmix; код — приложенный или выделенный"
        ],
        notes: [
          "Минимум за 3 минуты. Одна команда jmix new в неинтерактивном режиме, ls -a по результату и один вопрос Jmix AI; мастер CLI и «Ask AI about code» — в опциональном A3+. Точка выхода №1: при отставании после ответа Jmix AI сразу к A4. Jmix CLI ставится заранее, на сцене не устанавливаем (для справки: curl -fsSL https://github.com/jmix-framework/jmix-cli/releases/latest/download/install.sh | bash). CLI несёт свой Java runtime — для запуска самой утилиты JDK не нужен; для сборки сгенерированного проекта нужен совместимый JDK. Шаблоны — те же, что у Studio (артефакт io.jmix.templates.studio:jmix-studio-templates), своего формата у CLI нет.",
          "Неинтерактивный режим. jmix new <name> --non-interactive — для скриптов, CI и агентов. Имя обязательно; по умолчанию проект создаётся в ./<name>, --path меняет каталог; непустой каталог в этом режиме отклоняется (нужен --force, он может перезаписать файлы — на сцене не используем). Add-ons ставятся только через --addons, --no-git пропускает git init, --no-agents-toolkit пропускает toolkit. По умолчанию берётся последняя стабильная версия Jmix, RC и snapshot — только с --include-unstable. --no-update обязателен: без него CLI может найти новый релиз, скачать его и перезапуститься прямо перед залом; ту же команду pre-flight выполнил в /tmp/jmix-demo/crm-cli-ready.",
          "Что показать в ls -a. По умолчанию в проект ставится Agent Toolkit из ветки под мажорную версию Jmix: guidelines для Claude, Codex, OpenCode и Junie и локальные skills в .skills. Связать с A1: это те же файлы, что в jmix-crm, — проект с первой минуты готов для агента. Установка toolkit скачивает установщик с GitHub; без сети CLI выдаёт предупреждение, проект не теряется.",
          "Jmix AI — панель Studio AI Assistant. Чат-ассистент по Jmix на естественном языке; по docs.jmix.io он использует RAG по официальной документации и UI-примерам и доступен зарегистрированным пользователям. Открыть: иконка Jmix AI на правой панели IDE или Jmix tool window → Help → Jmix AI. Нужны интернет и вход в Jmix account, без входа панель пишет «Jmix AI is not available». Код проекта он видит только приложенный и текущее выделение: выделение больше одного символа в активном редакторе уходит в контекст автоматически, поэтому перед общим вопросом снять выделение. Лимит сообщений виден в панели; по документации — 100 запросов за 30 дней.",
          "Вопрос для демо. «Как в Jmix 3 показать менеджеру только договоры его клиентов?» — ожидаем ответ про row-level роль и @JpqlRowLevelPolicy; промпт копируется из шага. Позиционирование одной фразой: Jmix AI — спросить и разобраться, агент с toolkit — внести изменение в проект, CLI — создать проект из скрипта или агентом.",
          "Подводные камни. Если /tmp/jmix-demo/crm-cli остался с репетиции, неинтерактивная генерация откажет — взять другое имя (pre-flight его удаляет и показывает содержимое /tmp/jmix-demo). Без сети генерация работает только с кешем ~/.jmix/; при сбое показать ls -a по /tmp/jmix-demo/crm-cli-ready — его pre-flight создал той же командой. Jmix AI без сети и входа не работает — держать скриншот ответа assets/a3-jmix-ai.png (последнее действие блока). Опция --version в исходниках CLI не объявлена — для проверки установки использовать jmix --help."
        ],
        actions: [
          {
            kind: "shell",
            text: "mkdir -p /tmp/jmix-demo && cd /tmp/jmix-demo"
          },
          {
            kind: "shell",
            text: "jmix --no-update new crm-cli --non-interactive --template application --locales en,ru --path /tmp/jmix-demo/crm-cli"
          },
          {
            kind: "shell",
            text: "ls -a /tmp/jmix-demo/crm-cli"
          },
          {
            kind: "say",
            text: "Одна команда — и новый проект уже с правилами Jmix для AI-агента"
          },
          {
            kind: "studio",
            text: "Jmix tool window → Help → Jmix AI (выделение в редакторе предварительно снять)"
          },
          {
            kind: "studio",
            text: "Jmix AI → вопрос — промпт из следующей строки"
          },
          {
            kind: "studio",
            text: "Как в Jmix 3 показать менеджеру только договоры его клиентов?"
          },
          {
            kind: "say",
            text: "Jmix AI — спросить и разобраться, агент — внести изменение, CLI — создать проект"
          },
          {
            kind: "shell",
            text: "open ~/IdeaProjects/jmix-demo-runbook/assets/a3-jmix-ai.png"
          }
        ]
      },
      {
        id: "A3+",
        title: "Мастер CLI и Ask AI about code",
        minutes: 7,
        optional: true,
        slide: [
          "jmix — мастер в терминале: версия, шаблон, языки, add-ons, Git и Agent Toolkit",
          "Add-ons с поиском по /, коммерческие помечены [$]",
          "В конце мастер печатает «CLI command:» — команду для скрипта или агента",
          "Jmix AI → Ask AI about code: вопрос про выделенный код проекта"
        ],
        notes: [
          "Блок опциональный. Идёт только при запасе времени; при отставании с A3 сразу переходим к A4. Шаблоны и каталог add-ons CLI кеширует в ~/.jmix/ — pre-flight их прогрел.",
          "Мастер. jmix --no-update без подкоманды открывает мастер: имя, репозиторий, версия Jmix, шаблон, пакет, project ID, тема, языки, add-ons, расположение и чек-лист настройки (Git и Agent Toolkit, оба включены по умолчанию). Фазы: General, Localization, Add-ons, Location and setup, Finishing up. Стрелки — выбор, Space — отметить, Enter — подтвердить, Esc — назад, q — выход; в текстовом поле выход — Ctrl+Q. В шаге add-ons показать поиск по /: коммерческие помечены [$] и требуют подписки и premiumRepoUser/premiumRepoPass в ~/.gradle/gradle.properties.",
          "Без генерации. Как в B1: проходим фазы до Location and setup и выходим по q — второй проект за блок не создаём. Строку «CLI command:» — эквивалентный jmix new … --non-interactive с зафиксированной версией Jmix — CLI печатает только после генерации, поэтому показываем её со скриншота репетиции (assets/a3-cli-command.png): она того же вида, что команда, выполненная в A3. Мастер запускаем в подоболочке из /tmp/jmix-demo, чтобы Location не положил проект в текущий репозиторий.",
          "Ask AI about code. Связать с A2: в OnlyMyAccountsRole.java (ветка demo/agent-task уже на экране) выделить политику для Contract, которую добавил агент → Alt+Enter → «Jmix: Ask AI about code» — откроется панель Jmix AI, выделение уйдёт контекстом с вопросом «Объясни приложенный блок кода» (язык вопроса зависит от региона). Код из ответа можно скопировать, вставить под курсор или создать из него файл — только по кнопке разработчика. Панель Jmix AI и действие AI Agents Toolkit (Jmix tool window → Settings) есть в релизной Studio для Jmix 3.0.",
          "Подводные камни. Без сети мастер работает только с кешем ~/.jmix/: если список версий пуст — не ждать, выйти по q и показать скриншот. Jmix AI без сети и входа не отвечает — держать скриншот ответа."
        ],
        actions: [
          {
            kind: "shell",
            text: "(cd /tmp/jmix-demo && jmix --no-update)"
          },
          {
            kind: "say",
            text: "В конце мастер печатает команду jmix new … --non-interactive — её можно отдать скрипту или агенту"
          },
          {
            kind: "shell",
            text: "open ~/IdeaProjects/jmix-demo-runbook/assets/a3-cli-command.png"
          },
          {
            kind: "studio",
            text: "OnlyMyAccountsRole.java → выделить @JpqlRowLevelPolicy для Contract → Alt+Enter → Jmix: Ask AI about code"
          }
        ]
      },
      {
        id: "A4",
        title: "AI внутри приложения: CRM AI",
        minutes: 12,
        flow: ["Вопрос", "JPQL от модели", "Валидация", "Права пользователя", "Ответ + ссылки"],
        slide: [
          "Запрос выполняется с правами текущего пользователя: READ на весь граф, row-level",
          "Один вопрос — разные ответы: admin видит всех клиентов, alice только своих",
          "@Secret (3.0.3) и @ExcludeFromAi (3.1 preview): атрибут закрыт для модели",
          "Контекст из сущностей CRM и файлов, отчёты Client 360 и Cashflow Risk прямо из чата",
          "История диалогов с автоназваниями, каждый видит только свои диалоги"
        ],
        notes: [
          "Состояние до блока. Стенд aura-light (ветка demo/ai-app от 50-dynmodel-ai-agent, Jmix 3.1.999-SNAPSHOT) запущен в pre-flight. CRM AI работает на модели Spring AI OpenAI: в application.properties ветки 50-dynmodel-ai-agent стоят spring.ai.model.chat=openai, spring.ai.openai.api-key=${SPRING_AI_OPENAI_APIKEY:<YOUR_API_KEY>} и модель gpt-5.4, а для названий диалогов crm.ai.small-model.model-id=gpt-5.4-nano. Тот же ключ питает и агента Dynamic Model (A6, тоже gpt-5.4, но через своё подключение). Наличие SPRING_AI_OPENAI_APIKEY проверяется в pre-flight, в той же сессии и до ./stands.sh start: проверка в терминале посреди демо ничего не говорит о процессе стенда. CRM AI проверяет ключ сам (CrmAiConfig.isAiIntegrationEnabled: пустой ключ или ключ с YOUR_API_KEY означает, что интеграция выключена). Без ключа при открытии CRM AI появится красное уведомление «Ключ OpenAI API не настроен…», поле ввода и подсказки будут заблокированы. Поэтому в pre-flight открыть CRM AI на стенде, убедиться, что уведомления нет, и задать прогревочный вопрос.",
          "Где смотреть JPQL. В чате запроса не видно: системный промпт CRM запрещает показывать пользователю технические детали. Запрос видно в логе стенда: строки executeQuery(jpql=…) и Access conditions applied пишутся на уровне DEBUG. В 50-dynmodel-ai-agent стоит logging.level.io.jmix.aitools.dataload=INFO, в demo/ai-app оно переключено на DEBUG (application.properties). На прогревочном вопросе в pre-flight убедиться, что строка executeQuery(jpql= появляется в логе. Стенд и его лог живут в отдельном worktree ~/IdeaProjects/jmix-crm-stand (demo/dynmodel-ai-agent/instances/aura-light/application.log), поэтому checkout demo/agent-task в jmix-crm после A2 их не трогает. Статус проверяем curl по порту: любой код, кроме 000, значит, что стенд отвечает (или ./demo status из папки runbook). tail открыть в самом начале блока во втором терминале, который видит зал: tail -f показывает только новые строки.",
          "Вход и вопрос 1, минуты 0–3. 0:00–1:00: терминал с tail, вход admin / admin, на экране входа выбрать Русский (ответ приходит на языке пользователя), главное меню → CRM AI. 1:00–3:00: вопрос 1 живьём: «Сколько у нас клиентов и кто топ-3 по сумме заказов?». Пока ждём, проговорить механику: AI Tools описывает модели доменную модель (aitls_getAvailableEntities, aitls_getDomainModelForEntities), модель пишет JPQL и вызывает aitls_executeQuery, запрос валидируется, проверяется доступ, и он выполняется через DataManager от имени пользователя. Системный промпт требует сначала искать отчёты (getAvailableReports), поэтому ответ — цепочка из нескольких вызовов и идёт не мгновенно. Показать строку executeQuery(jpql=…) в терминале.",
          "История и контекст, минуты 3–7. 3:00–4:30: «История» → диалоги, записанные после последнего сброса (их проверил pre-flight). Вопрос 2: «Сколько заказов в статусах «Новый» и «Принят» и на какую сумму?» (по мотивам примера из README про пресейл и ожидание оплаты). Вопрос 3: «Как часто покупает Connelly LLC? Покажи последние заказы со ссылками». Кликнуть ссылку на запись в ответе и обратить внимание на автоматически сгенерированные названия диалогов. 4:30–7:00: вопрос 4 живьём: «Добавить контекст → Добавить сущность CRM → Клиенты → Connelly LLC», затем «Подготовь Client 360 по этому клиенту за последний год». В CrmAiToolsConfig разрешены только Client 360 Report и Category Cashflow Risk Allocation Report. Показать «Загрузить файл(ы)» и панель «Контекст».",
          "Окно alice и границы, минуты 7–12. 7:00–10:00: alice (абзац «Безопасность»); ожидаемо в вопросе 2 заказов «Новый»/«Принят» у alice 13/19, у admin 25/40 — цифры только здесь: шаги в панели зеркала видит зал. 10:00–11:30: @ExcludeFromAi и @Secret (абзац «@Secret и @ExcludeFromAi»). 11:30–12:00: переход к A5. Опционально, если есть запас: вопросы про контакты и пользователей, бонус про Hackett.",
          "Безопасность. Открыть приватное окно, обычное оставить под admin: у стенда своя cookie сессии. Войти alice / alice и живьём задать вопрос 1 дословно. В терминале показать строку Access conditions applied: к запросу подмешано условие по accountManager. Она появляется, когда запрос читает больше одной сущности (join, как в вопросе 1); у запроса только по Client условие корневой сущности добавляет платформа, и этой строки нет. Вопрос 2 показать из диалога alice, записанного после последнего сброса. Ожидаемые цифры посчитаны по CSV демо-данных ветки. У admin 30 клиентов, топ-3: Hackett, Corkery and Mraz / Batz-Goldner / Connelly LLC. У alice 13 клиентов, топ-3: Connelly LLC / Bradtke, Kozey and Rosenbaum / Lubowitz Inc. Заказов «Новый»/«Принят» у admin 25/40, у alice 13/19. Причина: у alice ресурсная роль Manager и row-level роль Only My Accounts (only-my-accounts-rl). В demo/ai-app роль Manager читает User.id: условие сравнивает accountManager.id, а запрос значений проверяет права на каждый путь, и без этого join-запрос alice отклоняется. Для Client условие {E}.accountManager.id = :current_user_id. Order, Invoice, Contact (и ClientUserActivity) фильтруются через client.accountManager, OrderItem — через order.client.accountManager, Payment — через invoice.client.accountManager. Пользователь manager из README видит всех клиентов, для сравнения он не подходит. Диалогов admin в «Истории» alice нет: row-level роль ai-chat-user-rl, условие createdBy = :current_user_username. Бонус: под alice спросить про Hackett, Corkery and Mraz (клиент Robert Taylor) — ассистент его не найдёт. Цифры подтверждены живым прогоном 8 октября на gpt-5.4 (скриншоты a4-*.png); если базу стенда меняли, они поплывут.",
          "Защитные механизмы AI Tools — проговаривать во время ожидания ответов. READ проверяется для каждой сущности графа запроса: join, подзапросы, пути, а не только корень. Row-level JPQL-политики применяются ко всем сущностям графа, а запрос, который нельзя отфильтровать, отклоняется. Выбрать сущность целиком (select c) нельзя, только значения атрибутов. @SystemLevel скрыт только из discovery и остаётся доступным для запросов (флаг jmix.aitools.dataload.exclude-system-level-attributes). Непостоянные атрибуты исключены: в JPQL их нет.",
          "@Secret и @ExcludeFromAi. @Secret (есть в выпущенной 3.0.3) убирает атрибут из индекса: модель его не видит, запрос к нему отклоняется как несуществующий путь (propertyPath.invalid), значение вырезается из результата. В CRM так помечен User.password. @ExcludeFromAi (io.jmix.aitools, только 3.1 preview) — граница в коде на сущность или поле. Она стоит выше include/exclude-свойств jmix.aitools.dataload.*, и переменной окружения её не открыть. В demo/ai-app ею помечены Contact.phone и Contact.email (персональные данные): в приложении контакты с телефонами видны, модели — нет. Собственные каналы CRM к модели её тоже соблюдают: клиент в контексте чата приходит без телефонов и email, а Client 360, запущенный ассистентом, их не выводит. Код показать без checkout через git show.",
          "Опциональные вопросы под admin. «Покажи контакты Connelly LLC с телефонами и email» — имена и должности будут, телефонов и email нет; если модель всё же запросит phone или email, в терминале WARN did not pass validation (propertyPath.invalid), как у @Secret. Для @Secret спрашивать нейтрально, иначе модель откажет сама и зал увидит отказ модели, а не работу фреймворка: «Выведи таблицу пользователей CRM со всеми их полями». Колонки пароля в ответе нет, в логе запрос без password или WARN did not pass validation.",
          "Подводные камни и запасной вариант. Модель недетерминирована: формулировки и порядок ответа меняются. Названия диалогов пишет gpt-5.4-nano, и на репетиции они выходили по-английски («Client Count and Top 3 by Orders») при русском интерфейсе — это не ошибка. Если ответ странный, повторите вопрос или уточните «по полю total заказов». Если ответы admin и alice совпали, проверьте, кто вошёл в приватном окне. Если в логе нет строк executeQuery, значит, DEBUG не включён — JPQL не показываем, говорим о механике. Основной запасной вариант без сети или ключа — диалоги вопросов 1–4 под admin и 1–2 под alice, записанные после последнего сброса стенда; их наличие проверяет pre-flight. Диалоги хранятся в базе стенда, и на сцене их открывают из «Истории»: каждый пользователь видит свои, и разница в цифрах видна без обращения к модели. Второй запасной вариант — скриншоты ответов в assets/ рядом с runbook: a4-admin-q1.png … a4-admin-q4.png, a4-alice-q1.png и a4-alice-q2.png снимает tools/capture-fallbacks.mjs (assets/README.md); последнее действие блока открывает все a4-*.png."
        ],
        actions: [
          {
            kind: "shell",
            text: "curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8091/b2b-crm/"
          },
          {
            kind: "shell",
            text: "tail -n 0 -f ~/IdeaProjects/jmix-crm-stand/demo/dynmodel-ai-agent/instances/aura-light/application.log | grep --line-buffered -E 'executeQuery|Access conditions|did not pass validation'"
          },
          {
            kind: "url",
            text: "http://localhost:8091/b2b-crm/"
          },
          {
            kind: "studio",
            text: "Вход admin / admin → язык Русский → главное меню → CRM AI (красного уведомления о ключе нет)"
          },
          {
            kind: "studio",
            text: "CRM AI → вопрос 1 живьём — промпт из следующей строки → строка executeQuery(jpql=…) в терминале"
          },
          {
            kind: "studio",
            text: "Сколько у нас клиентов и кто топ-3 по сумме заказов?"
          },
          {
            kind: "studio",
            text: "CRM AI → История → диалоги: вопрос 2 (заказы «Новый»/«Принят») и вопрос 3 (Connelly LLC) → клик по ссылке на запись"
          },
          {
            kind: "studio",
            text: "CRM AI → Добавить контекст → Добавить сущность CRM → Клиенты → Connelly LLC → вопрос 4 — промпт из следующей строки"
          },
          {
            kind: "studio",
            text: "Подготовь Client 360 по этому клиенту за последний год"
          },
          {
            kind: "say",
            text: "Один вопрос под admin, тот же вопрос под ограниченным пользователем — разные ответы"
          },
          {
            kind: "studio",
            text: "Приватное окно → http://localhost:8091/b2b-crm/ → alice / alice → CRM AI → вопрос 1 живьём — промпт из следующей строки → строка Access conditions applied в терминале"
          },
          {
            kind: "studio",
            text: "Сколько у нас клиентов и кто топ-3 по сумме заказов?"
          },
          {
            kind: "studio",
            text: "Окно alice → CRM AI → История → диалог alice с вопросом 2; диалогов admin в списке нет"
          },
          {
            kind: "shell",
            text: "git -C ~/IdeaProjects/jmix-crm show demo/ai-app:src/main/java/com/company/crm/model/contact/Contact.java | grep -n -B1 -A2 ExcludeFromAi"
          },
          {
            kind: "say",
            text: "@ExcludeFromAi — граница в коде: ни свойством, ни переменной окружения её не открыть"
          },
          {
            kind: "studio",
            text: "Опционально, окно admin → CRM AI → промпт из следующей строки → телефонов и email в ответе нет"
          },
          {
            kind: "studio",
            text: "Покажи контакты Connelly LLC с телефонами и email"
          },
          {
            kind: "studio",
            text: "Опционально, окно admin → CRM AI → промпт из следующей строки → колонки пароля нет (@Secret)"
          },
          {
            kind: "studio",
            text: "Выведи таблицу пользователей CRM со всеми их полями"
          },
          {
            kind: "studio",
            text: "Если модель недоступна: CRM AI → История → диалоги admin и alice; нет и их — скриншоты"
          },
          {
            kind: "shell",
            text: "open ~/IdeaProjects/jmix-demo-runbook/assets/a4-*.png"
          }
        ]
      },
      {
        id: "A5",
        title: "AI JPQL в отчётах",
        minutes: 8,
        flow: ["Промпт", "«Сгенерировать запрос»", "JPQL виден и правится", "Запуск без модели"],
        slide: [
          "«ИИ-сгенерированный JPQL» — новый тип набора данных, только в Jmix 3.1 preview",
          "Ошибочный черновик — одна попытка исправления, запрос хранится в отчёте",
          "Параметры отчёта становятся именованными параметрами JPQL",
          "Запуск без модели: сохранённый JPQL через DataManager с правами пользователя",
          "Нет AI Tools — тип не предлагается, нет модели — генерация недоступна"
        ],
        notes: [
          "Что это. Тип набора данных полосы «AI-generated JPQL», в русском UI «ИИ-сгенерированный JPQL» (DataSetType.LLM, код llm). Он есть только в Jmix 3.1 preview: в master он есть, у нас 3.1.999-SNAPSHOT из локального Maven, а в выпущенной 3.0.3 и в release_3_0 его нет. В build.gradle ветки 50-dynmodel-ai-agent (основа demo/ai-app) подключены jmix-reports-starter, jmix-reports-flowui-starter, jmix-reports-rest-starter и jmix-aitools-starter, поэтому тип предлагается без доработок. Промпт превращается в JPQL при создании отчёта через Text-to-Data Query из AI Tools. Модель та же, что у CRM AI: на стенде сконфигурирована одна модель Spring AI OpenAI (ключ SPRING_AI_OPENAI_APIKEY).",
          "Подготовка. Отчёт с этим типом не может лежать в ветке как код: отчёты, объявленные в Java через @ReportDef (например Client 360 Report), этот тип использовать не могут, запрос хранится вместе с отчётом. Поэтому отчёт живёт только в базе стенда (HSQL в instances/aura-light), а сброс стенда его стирает. В demo/ai-app хранится экспорт отчётов: demo/reports/ai-jpql-reports.zip, он же лежит в jar стенда. Стенд импортирует архив сам при старте, если какого-то из двух отчётов нет (в логе «AI JPQL demo reports imported»): после ./demo reset отчёты возвращаются без ручного импорта, а при обычном рестарте сохранённое на стенде не затирается. Сохранённый запрос «(AI JPQL)» записан вручную в том формате, в котором его хранит генератор (ключа при подготовке ветки не было), и его оставляем: с gpt-5.4 «Сгенерировать запрос» обычно меняет колонки (на репетиции в 6 прогонах из 6 — orderCount и totalSum вместо ordersCount и ordersTotal, которые печатает шаблон), поэтому перегенерированный запрос не сохранять. Если запрос всё же перегенерирован и сохранён, экспортировать оба отчёта, заменить demo/reports/ai-jpql-reports.zip в demo/ai-app и прогнать AiJpqlReportsArchiveTest (так же написано в README ветки): сохранённый запрос переносится экспортом и импортом. В архиве два отчёта. «Выручка клиентов (AI JPQL)» — готовый, с сохранённым запросом, для запуска и запасного варианта. «Выручка клиентов (живая генерация)» — копия, на которой жмут «Сгенерировать запрос». В обоих параметры fromDate и toDate типа «Дата» и шаблон с типом вывода «Таблица», чтобы результат открылся в окне приложения, а не скачался файлом. Проверено при подготовке ветки: в диалоге запуска параметры называются «Дата с» и «Дата по», результат — таблица в окне приложения.",
          "Порядок показа (только на копии). Администрирование → Отчёты → Отчёты → «Выручка клиентов (живая генерация)». На вкладке «Полосы отчёта» выбрать полосу и в «Тип набора данных» выбрать «ИИ-сгенерированный JPQL» (в копии он уже выбран). В поле «Промпт» вставить: «Для каждого клиента: название клиента, количество заказов и сумма заказов (total) с датой заказа от fromDate до toDate; сортировка по сумме по убыванию». Нажать «Сгенерировать запрос»: gpt-5.4 отвечает за 6–7 с. Появится JPQL в «Сгенерированный запрос», рядом «Колонки», ниже пояснение и предупреждения. :fromDate и :toDate — параметры отчёта: при запуске они подставляются как именованные параметры JPQL, текст не переписывается. Карандаш «Изменить» открывает JPQL и колонки, галочка «Готово» закрывает правку. Колонки идут по позициям и должны совпадать с select. Если черновик модели невалиден, AI Tools даёт ровно одну попытку исправления. Если промпт поменяли после генерации, появится бейдж «Промпт изменён после генерации запроса». Повторная генерация перезаписывает ручную правку и может переименовать колонки, которые печатает шаблон. С gpt-5.4 так и выходит: на копии колонки получаются orderCount и totalSum, а шаблон печатает ordersCount и ordersTotal; предупреждения под пояснением — про inner join (клиенты без заказов не попадут) и группировку по c.name. Поэтому копию закрыть без сохранения («Отмена» → «Не сохранять»), а готовый отчёт не трогать: перегенерация на нём добавила бы предупреждение «…которые шаблон больше не сможет вывести: ordersCount, ordersTotal».",
          "Запуск и права. Открыть «Выручка клиентов (AI JPQL)» и нажать «Запустить отчёт» под admin. Затем в приватном окне alice из A4: Администрирование → Отчёты → Запуск отчётов (роль Manager включает ReportsRunRole с этим пунктом меню). Если пункта на экране нет, открыть маршрут report/run по ссылке. Отчёт без назначенных ролей доступен всем. Модель на запуске не вызывается: сохранённый JPQL выполняется через DataManager с правами текущего пользователя. READ проверяется для каждой сущности запроса, row-level политики применяются ко всем сущностям графа, атрибут без права чтения приходит как null. То, что нельзя отфильтровать (predicate-политика, сущность только в подзапросе), отклоняется. Ожидаемо admin увидит 30 клиентов, alice — 13 своих. Контраст для зала: обычные наборы JPQL и SQL идут через EntityManager или DataSource и таких ограничений не применяют. Даты в демо-данных — смещения от дня загрузки, поэтому диапазон берём широкий.",
          "Доступность. Без AI Tools (или при jmix.aitools.enabled=false, или jmix.aitools.dataload.enabled=false) тип не предлагается, но уже созданные отчёты этого типа запускаются. С AI Tools, но без настроенной модели тип есть, а «Сгенерировать запрос» недоступна. На стенде модель OpenAI сконфигурирована всегда (по умолчанию ключ — заглушка <YOUR_API_KEY>), поэтому без SPRING_AI_OPENAI_APIKEY кнопка активна, но генерация падает с ошибкой провайдера. Таймаут генерации задаёт jmix.reports.client.llm-query-generation-timeout, по умолчанию 120 с. Тип работает и в cross-tab полосе как набор ячеек: значения осей приходят list-параметрами для IN. Ограничения: нет streaming, «топ-N» берётся из промпта, шаблон и колонки могут разойтись без предупреждения.",
          "Запасной вариант. Если генерация зависла или нет сети, не ждите: закройте копию без сохранения, откройте «Выручка клиентов (AI JPQL)», покажите сохранённый запрос и запустите отчёт. Запуску модель не нужна, и это главный тезис блока. Оба отчёта стенд импортирует сам при старте, если их нет; ./demo check a видит импорт по логу. Не работает сам стенд — скриншоты assets/a5-*.png (последнее действие блока)."
        ],
        actions: [
          {
            kind: "studio",
            text: "Администрирование → Отчёты → Отчёты (Admin → Reports → Reports) → «Выручка клиентов (живая генерация)»"
          },
          {
            kind: "studio",
            text: "Отчёт → вкладка «Полосы отчёта» (Bands) → полоса → Тип набора данных: «ИИ-сгенерированный JPQL» (AI-generated JPQL) → поле «Промпт» — промпт из следующей строки"
          },
          {
            kind: "studio",
            text: "Для каждого клиента: название клиента, количество заказов и сумма заказов (total) с датой заказа от fromDate до toDate; сортировка по сумме по убыванию"
          },
          {
            kind: "studio",
            text: "«Сгенерировать запрос» (Generate query) → JPQL в «Сгенерированный запрос», рядом «Колонки», ниже пояснение"
          },
          {
            kind: "studio",
            text: "Сгенерированный запрос → «Изменить» (карандаш) → правка JPQL и «Колонки» → «Готово» → «Отмена» → «Не сохранять»"
          },
          {
            kind: "say",
            text: "Модель нужна только при создании отчёта, на запуске — сохранённый JPQL и права пользователя"
          },
          {
            kind: "studio",
            text: "«Выручка клиентов (AI JPQL)» → «Запустить отчёт» (внизу редактора) → «Дата с» 01.01.2024, «Дата по» 31.12.2026 → «Выполнить» → результат под admin"
          },
          {
            kind: "studio",
            text: "Окно alice → Администрирование → Отчёты → Запуск отчётов → «Выручка клиентов (AI JPQL)» → «Выполнить» → те же даты → только клиенты alice"
          },
          {
            kind: "url",
            text: "http://localhost:8091/b2b-crm/report/run"
          },
          {
            kind: "shell",
            text: "open ~/IdeaProjects/jmix-demo-runbook/assets/a5-*.png"
          }
        ]
      },
      {
        id: "A6",
        title: "Dynamic Model AI",
        minutes: 15,
        exit: "Точка выхода №2: сократить до 8 минут — только шаги с меткой [8] (1, 3, 8, 9, 13)",
        flow: ["Запрос", "План", "Подготовка", "Проверка", "Применение"],
        slide: [
          "Dynamic Model (Premium, есть в 3.0) + AI-агент и чат — Jmix 3.1 preview",
          "План можно дополнить; «Подтвердить план» и «Применить» нажимает только человек",
          "Новые экраны сразу в меню и готовы к данным — без кода и перевыпуска",
          "Границы: не читает бизнес-данные, не меняет тип опубликованного поля"
        ],
        notes: [
          "Что говорим. Dynamic Model — аддон Jmix Premium: работающее приложение получает новые сущности и экраны без перевыпуска. Сам аддон есть и в BOM Jmix 3.0. Новое в Jmix 3.1, который ещё не выпущен (это preview), — AI-агент Dynamic Model AI Builder (jmix-framework/jmix#5779) и чат-компонент jmix-aichat. Стенд aura-light (ветка demo/ai-app, Jmix и Jmix Premium 3.1.999-SNAPSHOT), агент работает на OpenAI gpt-5.4 (api.openai.com, тот же ключ, что у CRM AI, но своё подключение crm.dynmodel.*). Пока агент планирует (план шага 1 — около 20–30 с) или готовит изменения, говорим главное для разработчиков: публикация — не инструмент модели, а действие в UI. Агент не может вызвать Apply: ArchUnit-тест ApplyBoundaryArchTest запрещает коду агента вызывать applyAndSave, а миграции перед публикацией показывает родной диалог Dynamic Model. Тот же принцип, что во всём демо: рамки задаёт фреймворк, а не обещание модели.",
          "Накануне, не на сцене. Сценарий прогнать на репетиции, затем ./demo reset (свежая база с демо-данными CRM, отчёты A5 возвращаются сами) и ./demo prepare (диалоги A4). Сбрасывать до начала всего Demo A, а не между блоками. Запасной вариант A6 — скриншоты assets/a6-*.png: шаги 1, 3, 8, 13 и итог сценария (assets/README.md), второго стенда нет. Останавливать стенд только ./demo down или одним Stop в IDEA: после kill -9 он зависнет на старте с «Waiting for changelog lock». На репетиции проверить и раскладку: настройки динамической модели в режиме AI, разрешение проектора, выбранный zoom. Чат и «Рабочая область» должны стоять рядом; если экран настроек не шире 60rem, они встают друг под друга. Тогда свернуть главное меню приложения или уменьшить zoom этой вкладки; панель прячет кнопка «Свернуть рабочую область».",
          "Ход по шагам, 1–3. Нумерация — как в demo/dynmodel-ai-agent/scenarios/demo-scenario.md ветки; метка [8] — короткая версия. Промпты стоят в действиях отдельными строками, дословно из сценария: копировать строку целиком. Шаг 1: шкала над чатом на «План», в «Рабочей области» — «Проверьте предложенный план»; при наведении на поле видны подписи на всех языках; пока план ждёт, переключиться на «Визуальный» можно, но редактор там заблокирован: «Создать» и «Применить» неактивны. Шаг 2: план дополняется в том же чате, старый план по ссылке «План · …» открывается только для чтения. Шаг 3: после «Подтвердить план» шкала проходит «Подготовка» и «Проверка»; «Проверить визуально» показывает черновик, в меню приложения ещё ничего нет.",
          "Шаги 8, 9 и 13. Шаг 8: в «Визуальном» и «Коде» кнопка «Применить» стоит в шапке, а чат и шкала скрыты. Поэтому сначала вернуться в AI и нажать «Применить» внизу рабочей области: тогда видны список миграций, шкала до «Применения» и в чате «Изменения применены: …». Шаг 9: форма не даст сохранить клиента без названия, в сделке клиент показан названием. Шаг 13: агент объясняет, что не читает бизнес-данные, и отказывается менять тип опубликованного поля, объяснением или сообщением «Не удалось подготовить допустимый план» (gpt-5.4 на репетиции всегда отвечал объяснением, за 3–5 с); «Подтвердить план» не появляется. Резервные шаги 10–11: новый диалог расширяет модель; в окне «Шагов: N» «Создать сущность» идёт раньше «Добавить ссылку».",
          "Короткая версия, 8 минут (точка выхода №2): шаги 1, 3, 8, 9 и 13, то есть только действия с меткой [8]. Без шага 2 у сделки нет даты следующего контакта и «Срочно»: создать только «Север» и сделку «Первая поставка» с клиентом, суммой 12500,50 и причиной отказа. Перед шагом 13 вернуться в настройки динамической модели и снова выбрать AI: после ухода со страницы чат начинает новый диалог, ластик неактивен, чистить нечего. Полная версия, 15 минут: шаги 1, 2, 3, 8, 9, 13 — пять ходов модели и одно «Применить». Замер 9 октября на gpt-5.4 (скрипт, без рассказа): полная версия — 88–93 с действий, из них ожидание модели 51–55 с; короткая — 61 с, модель 28 с; резервные шаги 10–11 — ещё 27–35 с. По ходам: план шага 1 — 18–28 с, дополнение шага 2 — 22–26 с, новый диалог шага 10 — 17–25 с, «Подтвердить план» и «Применить» — 1–5 с, каждый ответ шага 13 — 3–5 с. Почти всё время блока — рассказ; ход дольше минуты — уже сбой, хотя лимиты стенда допускают до 4 минут на ход и до 24 шагов плана. Данные шага 9: «Север» (телефон +79000000001) и «Маяк»; сделка «Первая поставка» с клиентом «Север», датой 01.12.2026, суммой 12500,50, «Срочно» и причиной отказа «Не согласовали бюджет».",
          "Резервные шаги, если опережаете. Только в полной версии. Шаги 4–7 — до «Применить»: шаг 4 переставляет поле, которое добавил шаг 2; шаги 5–7 — ручной city в «Визуальном», правка подписи в «Коде» и вопрос агенту (он видит неопубликованные ручные правки, плана нет); тогда в шаге 9 у «Севера» указать город «Казань». Шаги 10–11 — после шага 9: новый диалог расширяет модель, второе «Применить». Шаг 12 — после шага 11. Каждый резервный шаг — ещё один ход модели или ручная работа на минуту-две.",
          "Подводные камни (README_ru, «Что стоит знать заранее»). Агент сам ничего не публикует, публикует человек кнопкой «Применить». Позицию поля просить отдельным запросом: внутри большого запроса на создание план иногда не удаётся подготовить. В длинном диалоге модель может начать путаться: перед новой задачей очистить диалог кнопкой с ластиком; неопубликованные изменения останутся в редакторе, если не отметить их отмену в подтверждении. gpt-5.4 иногда отвечает по-разному на один и тот же запрос, чаще в мелочах: подписи полей бывают со строчной буквы («название компании», «телефон», «сумма») — это не ошибка, продолжать; если ответ странный по сути, повторить запрос; на «Не удалось подготовить допустимый план» (на репетиции с gpt-5.4 ни разу) — повторить или разбить запрос. После обновления страницы режим AI не восстанавливается из адреса, в том числе при входе по адресу dynmod-settings: снова выбрать AI переключателем. Лимиты агента подняты в application.properties стенда: jmix.dynmodel.ai.max-plan-steps=24 и jmix.dynmodel.ai.turn-timeout=4m. Когда уходить на запасной вариант: после второго неудачного повтора одного шага или при отставании больше чем на 2 минуты. Тогда открыть скриншоты шагов 1, 3, 8, 13 и итога сценария из assets/ (последнее действие блока). Без интернета или без SPRING_AI_OPENAI_APIKEY агент на любой запрос отвечает ошибкой вызова модели, сразу на запасной вариант.",
          "Если спросят, как это устроено. В приложении стартеры io.jmix.dynmodel:jmix-dynmodel-ai-starter и jmix-dynmodel-ai-flowui-starter, changelog агента /io/jmix/dynmodelai/liquibase/changelog.xml; чат — компонент jmix-aichat, агент построен на Embabel. У агента своё подключение к модели (DynamicModelAgentConfiguration, свойства crm.dynmodel.*), независимое от CRM AI; настройки агента — jmix.dynmodel.ai.*, на стенде plan-approval-mode=MANUAL. Режим AI предлагается только пользователю с правом Apply динамической модели; собственных проверок прав у агента в первой версии нет. Диалоги и запуски пишутся в сущности dmagent_*, отдельного экрана нет: смотреть в Инспекторе сущностей /b2b-crm/datatl/entity-inspector. Ограничения 3.1: агент не расширяет впервые существующую сущность приложения, не создаёт для неё экраны и меню, не создаёт поля-перечисления и вычисляемые поля, поэтому в промпте «независимо от существующей CRM»."
        ],
        actions: [
          {
            kind: "url",
            text: "http://localhost:8091/b2b-crm/"
          },
          {
            kind: "studio",
            text: "Вход: admin / admin, язык «Русский» (если после A4/A5 ещё не вошли)"
          },
          {
            kind: "studio",
            text: "[8] Администрирование → Настройки динамической модели → переключатель режима → AI (ярлык — адрес ниже, AI всё равно выбрать переключателем)"
          },
          {
            kind: "url",
            text: "http://localhost:8091/b2b-crm/dynmod-settings"
          },
          {
            kind: "say",
            text: "Описываю словами, агент предлагает план — решение и публикация остаются за человеком"
          },
          {
            kind: "studio",
            text: "[8] Шаг 1. AI-чат → вставить промпт из следующей строки → отправить"
          },
          {
            kind: "studio",
            text: "Сделай отдельные «Демо-клиенты» и «Демо-сделки», независимо от существующей CRM. У демо-клиента нужны обязательное название компании и необязательный телефон длиной 30. У демо-сделки — обязательные название и демо-клиент, необязательные сумма и длинный текст «Причина отказа». Для обоих нужны список, карточка и пункт меню в существующем «Каталоге». Существующую CRM не меняй."
          },
          {
            kind: "studio",
            text: "[8] Шаг 1. Рабочая область → навести курсор на поле (подписи на всех языках) → «Визуальный»: «Создать» и «Применить» неактивны → вернуться в AI"
          },
          {
            kind: "studio",
            text: "Шаг 2. AI-чат → вставить промпт из следующей строки → отправить"
          },
          {
            kind: "studio",
            text: "Дополни этот план, сохранив всё предложенное. Демо-клиенту добавь длинные «Заметки о клиенте», а демо-сделке — дату следующего контакта и отметку «Срочно». Все три поля необязательные."
          },
          {
            kind: "studio",
            text: "Шаг 2. В прошлом ответе открыть ссылку «План · …» → старый план только для чтения"
          },
          {
            kind: "studio",
            text: "[8] Шаг 3. «Подтвердить план» → «Подготовка» → «Проверка» → «Проверить визуально»"
          },
          {
            kind: "say",
            text: "Это черновик: в меню приложения пока ничего не появилось"
          },
          {
            kind: "studio",
            text: "Резерв, только полная версия (нужен шаг 2). Шаг 4. Вернуться в AI → вставить промпт из следующей строки → отправить → «Подтвердить план»"
          },
          {
            kind: "studio",
            text: "В демо-сделке поставь дату следующего контакта непосредственно перед суммой. Больше ничего не меняй."
          },
          {
            kind: "studio",
            text: "Резерв, только полная версия. Шаги 5–6. «Визуальный» → демо-клиент → атрибут city (String, необязательный, City / Город) → «Код»: ru: \"Город\" → ru: \"Город доставки\""
          },
          {
            kind: "studio",
            text: "Резерв, только полная версия. Шаг 7. AI → вставить промпт из следующей строки → отправить"
          },
          {
            kind: "studio",
            text: "Ничего не меняй. Какие поля сейчас у демо-клиента и с какими русскими подписями? Есть ли город, и опубликовано ли это?"
          },
          {
            kind: "studio",
            text: "[8] Шаг 8. Вернуться в AI → «Применить» внизу рабочей области → «Применить изменения» → Каталог: «Демо-клиенты», «Демо-сделки»"
          },
          {
            kind: "studio",
            text: "[8] Шаг 9. Демо-клиенты → «Создать» → сохранить без названия (не даст) → «Север», «Маяк»; Демо-сделки → «Создать» → «Первая поставка»"
          },
          {
            kind: "studio",
            text: "[8] Администрирование → Настройки динамической модели → AI → при старом диалоге: ластик «Очистить диалог» → «Очистить диалог»"
          },
          {
            kind: "studio",
            text: "Резерв, только полная версия. Шаг 10. AI-чат → вставить промпт из следующей строки → отправить"
          },
          {
            kind: "studio",
            text: "Расширь наших демо-клиентов и демо-сделки, сохранив существующие поля, экраны и данные. Создай справочник «Демо-причины отказа»: обязательное название, список, карточка и меню в «Каталоге». В демо-сделку добавь необязательную ссылку «Причина из справочника» на этот справочник, старое текстовое поле причины оставь. Создай «Демо-участники сделки»: обязательная ссылка «Клиент» на демо-клиента и необязательная «Роль»; участнику нужна только карточка, без списка и меню. В демо-сделку добавь коллекцию «Участники». Пункт меню демо-сделок поставь перед демо-клиентами в «Каталоге»."
          },
          {
            kind: "studio",
            text: "Резерв, только полная версия. Шаг 11. «Подтвердить план» → ссылка «Шагов: N» → «Применить» → «Применить изменения» → Каталог: сделки перед клиентами"
          },
          {
            kind: "say",
            text: "Новый диалог расширил модель — старые поля, экраны и данные на месте"
          },
          {
            kind: "studio",
            text: "Резерв, только полная версия, после шага 11. Шаг 12. Справочник причин → «Не согласовали бюджет»; «Первая поставка» → причина из справочника → «Участники» → «Создать» → «Маяк», роль «Партнёр» → OK"
          },
          {
            kind: "studio",
            text: "[8] Шаг 13. Если ушли из настроек — снова Настройки динамической модели → AI; AI-чат → отправить по очереди два промпта из следующих строк"
          },
          {
            kind: "studio",
            text: "Не меняй модель. Посчитай сумму всех сделок клиента Север."
          },
          {
            kind: "studio",
            text: "Замени тип суммы в демо-сделке с десятичного числа на дату."
          },
          {
            kind: "say",
            text: "Агент не читает бизнес-данные и не делает небезопасных изменений опубликованной модели"
          },
          {
            kind: "studio",
            text: "Если агент недоступен или отстаём больше чем на 2 минуты: скриншоты шагов 1, 3, 8, 13 и итога сценария"
          },
          {
            kind: "shell",
            text: "open ~/IdeaProjects/jmix-demo-runbook/assets/a6-*.png"
          }
        ]
      },
      {
        id: "A7",
        title: "Итоги и Q&A",
        minutes: 5,
        slide: [
          "Уже доступно: AI Tools в 3.0 (CRM AI), Jmix AI в Studio, Agent Toolkit, Jmix CLI",
          "Jmix 3.1 preview: AI JPQL в отчётах, AI-агент Dynamic Model",
          "Завтра: toolkit в проект (Studio 3.0+ → AI Agents Toolkit) + JetBrains MCP",
          "Онлайн-демо B2B CRM: demo.jmix.io/b2b-crm",
          "GitHub: jmix-framework/jmix-agent-toolkit · jmix-cli · jmix-crm",
          "Материалы демо: github.com/Fedoseew/jmix-demo-runbook — и ваши вопросы"
        ],
        notes: [
          "Что из показанного где. Выпущено: ветка main jmix-crm живёт на Jmix 3.0.3 и уже подключает io.jmix.aitools:jmix-aitools-starter, то есть CRM AI из блока A4 с data-load (генерация и проверка JPQL под правами пользователя) работает на выпущенной версии. Agent Toolkit и Jmix CLI — не часть Jmix 3.0, а отдельные репозитории со своим циклом: toolkit для Jmix 3 берётся с ветки v3 и ставится из Studio 3.0+; CLI пока не дошёл до 1.0 (теги v0.x), ставится своим installer и несёт свою Java. Jmix AI — панель релизной Studio для Jmix 3.0. Preview, Jmix 3.1 (ещё не выпущен, master и 3.1.999-SNAPSHOT): тип набора данных полосы «AI-generated JPQL» в отчётах (DataSetType.LLM, в release_3_0 его нет), аннотация @ExcludeFromAi в AI Tools, AI-агент Dynamic Model (jmix-dynmodel-ai) и чат-компонент jmix-aichat. Сам Dynamic Model как аддон Premium есть и в 3.0, новое в 3.1 именно агент.",
          "Как начать завтра. Первое — toolkit в свой проект: в Studio окно Jmix → Settings → AI Agents Toolkit, мастер проведёт по шагам (skills, guidelines-блок, MCP-серверы, Playwright). Без Studio — install.sh из README репозитория; на сцене не запускать, только показать ссылку. Проекты, созданные Jmix CLI, получают toolkit сразу (отключается флагом --no-agents-toolkit). Второе — JetBrains MCP: в IntelliJ Settings → Tools → MCP Server → Enable MCP Server, проект держать открытым в IDE. Оба диалога уже показаны в A1, в IDE не возвращаемся. Третье — правила гигиены: агент работает в отдельной ветке, результат проверяется запуском приложения и инспекциями Studio, prod-ключи агенту не даём. Четвёртое — онлайн-демо B2B CRM, чтобы посмотреть само приложение; CRM AI — локально на jmix-crm main с ключом SPRING_AI_OPENAI_APIKEY, пункт меню CRM AI. Включён ли CRM AI в онлайн-демо, проверить перед встречей; если нет, так и сказать.",
          "Q&A: собирать вопросы, записывать их; на то, что требует проверки, ответить после встречи. Частые вопросы и короткие ответы. Когда 3.1 — дату не называть, следить за анонсами на jmix.io. Лицензии — Dynamic Model и AI Chat входят в Jmix Premium, AI Tools и Reports лежат в открытом репозитории фреймворка jmix-framework/jmix. Куда уходят данные — CRM AI выполняет запросы с правами текущего пользователя, @Secret-атрибуты закрыты, в 3.1 добавляется @ExcludeFromAi; агент Dynamic Model работает с описанием модели и бизнес-данные не читает (это было видно на шаге с отказом). Какая модель — CRM подключает Spring AI через OpenAI-стартер (gpt-5.4); агент Dynamic Model на стенде тоже работает на OpenAI gpt-5.4, но через своё подключение (crm.dynmodel.*), и его можно переключить на OpenRouter или Anthropic (свойство crm.dynmodel.provider).",
          "Если время вышло: оставить на экране слайд со ссылками, вопросы собрать в чат или после встречи. Ссылки на репозитории и онлайн-демо — в действиях ниже, открывать их из runbook, а не набирать вручную. Материалы встречи — этот runbook с заметками, шагами и ссылками обоих демо: github.com/Fedoseew/jmix-demo-runbook, туда же ведёт QR на заставке."
        ],
        actions: [
          {
            kind: "say",
            text: "Уже доступно: AI Tools в Jmix 3.0 и Jmix AI в Studio, плюс отдельные Agent Toolkit (ветка v3) и Jmix CLI; в 3.1 preview: AI JPQL в отчётах и AI-агент Dynamic Model"
          },
          {
            kind: "url",
            text: "https://github.com/jmix-framework/jmix-agent-toolkit"
          },
          {
            kind: "url",
            text: "https://github.com/jmix-framework/jmix-cli"
          },
          {
            kind: "url",
            text: "https://github.com/jmix-framework/jmix-crm"
          },
          {
            kind: "url",
            text: "https://demo.jmix.io/b2b-crm/login"
          },
          {
            kind: "url",
            text: "https://github.com/Fedoseew/jmix-demo-runbook"
          },
          {
            kind: "say",
            text: "Ваши вопросы — и что из этого вы попробуете первым?"
          }
        ]
      }
    ]
  },
  b: {
    title: "Демо B — Jmix с нуля",
    blocks: [
      {
        id: "B-pre",
        title: "Pre-flight",
        minutes: 0,
        pre: true,
        slide: [
          "./demo up b: PostgreSQL с дампом CRM на :5434 и стенд для B4 (или run-конфигурации IDEA)",
          "После репетиции B: ./demo reset b, запуск «crm-from-db app», пользователь sales / sales",
          "./demo check b без FAIL: Docker, 8 таблиц CRM, нет rating, sales без ролей, b/01-empty",
          "Studio открыт на crm-from-db, Gradle sync и индексация завершены",
          "Мастер Jmix Project открыт онлайн в этой сессии IDE: версии Jmix загрузились",
          "Main Data Store (PostgreSQL) → Test Connection успешен, подписка Studio активна",
          "Приложение запущено из IDEA («crm-from-db app», :8080), вход admin / admin проверен",
          "Jmix CLI отвечает, шаблоны уже в кэше ~/.jmix",
          "Для B4: стенд :8091 отвечает, ключ OpenAI задан, интернет или hotspot проверен",
          "Браузер: вкладки runbook, localhost:8080 и стенда, zoom под проектор"
        ],
        notes: [
          "Пройти чек-лист за 30–40 минут до начала. Инфраструктуру поднимает ./demo из папки runbook: ./demo up b, а ./demo check b в конце, когда приложение запущено; руками остаются Studio, приложение и браузер. Все команды демо B выполняются из ~/IdeaProjects/crm-from-db: после cd терминал остаётся в этой папке. CLI в B1 запускается в подоболочке в отдельной пустой папке, поэтому текущий каталог терминала не меняется. На глазах у зала ничего не скачиваем и не собираем впервые: Gradle-зависимости, фронтенд Vaadin и шаблоны Jmix CLI прогреваются полным прогоном демо накануне.",
          "База: ./demo up b (или в IDEA, проект crm-from-db, run-конфигурация «crm-from-db database» — Docker Compose с тем же db/docker-compose.yml, сервис db) поднимает PostgreSQL со схемой и данными CRM из db/crm.sql и ждёт, пока ответят таблицы. Сервис db на образе postgres:17.11, порт 5434 (5432 и 5433 заняты другими проектами), база и пользователь crm / crm. Дамп грузится только при первом старте, в пустой том; там же создаётся база crm_test для ./gradlew test. ./demo check b считает 8 таблиц CRM: client, contact, category, category_item (продукты), order_, order_item, invoice и user_ (пользователи CRM); после первого запуска приложения рядом появляются его собственные таблицы (crm_user, sec_* и другие). Если таблиц нет, демо B2 не начинать: fallback — ветка b/02-model и рассказ по коду. ./demo down останавливает базу, данные остаются в томе. После каждой репетиции B — ./demo reset b (спрашивает подтверждение, -y — без вопроса; приложение на :8080 сначала остановить): удаляет том, заново грузит дамп, ждёт таблицы и переключает чистый crm-from-db на b/01-empty. Затем один раз запустить «crm-from-db app» — оно создаёт свои таблицы — и создать пользователя без ролей: Users → Create, Username sales, пароль sales (нужен в B3). ./demo check b проверяет и это: колонки client.rating нет (после b/04-role она есть, и diff в B3 окажется пустым), пользователь sales есть и роли ему не назначены. В psql-проверке B3 флаг -P pager=off отключает пейджер, иначе длинный вывод откроется в less (выход по q).",
          "Обязательное условие: приложение b/01-empty стартует против дампа без ошибок Liquibase — проверено накануне и повторено здесь. Если старт падает, на месте не чинить: структуру проекта в B1 показываем по коду, дальше идём по веткам и скриншотам.",
          "Studio: открыть crm-from-db, дождаться Gradle sync и индексации. В Jmix tool window под узлом модуля crm-from-db есть раздел Data Stores → Main Data Store, двойной клик открывает свойства хранилища, там Test Connection — на b/01-empty это уже PostgreSQL с дампом. Мастер нового проекта Studio загружает список версий Jmix из репозитория (Loading Jmix Versions) и держит его только в памяти IDE, не дольше суток: при наличии сети в этой же сессии IDE открыть File → New → Project → Jmix Project, дождаться списка версий, дойти до выбора шаблона и нажать Cancel. Перезапуск IDE прогрев сбрасывает. Затем запустить приложение run-конфигурацией «crm-from-db app» (лежит в репозитории, .run/crm-from-db-app.run.xml: Spring Boot, порт 8080), войти admin / admin и оставить приложение работать: в B1 показываем его, а не стартуем вживую. Проверить подписку: без неё премиум-функции Studio (визуальные дизайнеры, генерация Liquibase changelog) работают только в малых проектах — до 10 сущностей и ролей; новым пользователям даётся trial Sprint на 28 дней.",
          "Jmix CLI: ./demo check b проверяет jmix --no-update --help — этот запуск обходится без проверки обновлений. Обычный запуск установленного CLI не чаще раза в 10 минут проверяет новый релиз и, если он вышел, скачивает его и перезапускается на новой версии — на сцене это выглядит как пауза и смена версии. Поэтому в зале только jmix --no-update (или export JMIX_CLI_NO_AUTO_UPDATE=1 в этом терминале). Шаблоны CLI кэширует в ~/.jmix/templates/, поэтому накануне запустить мастер хотя бы раз онлайн.",
          "Опционально для B4: стенд aura-light из демо A. ./demo up b поднимает его вместе с базой (или run-конфигурация «Stand aura-light (OpenAI)» в проекте jmix-crm-stand); jar собирает ./demo setup накануне, SNAPSHOT на месте не собирать. Ключ SPRING_AI_OPENAI_APIKEY питает CRM AI-ассистента (тизер B4) и агента Dynamic Model (gpt-5.4): экспортировать до ./demo up b, проверять только на наличие (./demo check b), значения на экран не выводить. Если стенд не ответил — ./demo logs. Адрес http://localhost:8091/b2b-crm/, вход admin / admin. Нет интернета — B4 пропускаем (точка выхода) или показываем скриншоты assets/b4-*.png."
        ],
        actions: [
          {
            kind: "shell",
            text: "cd ~/IdeaProjects/jmix-demo-runbook && ./demo up b"
          },
          {
            kind: "studio",
            text: "Или IDEA: проект crm-from-db → Run «crm-from-db database»; стенд B4 — Run «Stand aura-light (OpenAI)» в проекте jmix-crm-stand"
          },
          {
            kind: "shell",
            text: "./demo reset b"
          },
          {
            kind: "shell",
            text: "cd ~/IdeaProjects/crm-from-db"
          },
          {
            kind: "studio",
            text: "File → Open → ~/IdeaProjects/crm-from-db"
          },
          {
            kind: "studio",
            text: "File → New → Project → Jmix Project → дождаться списка Jmix version → Next → Cancel"
          },
          {
            kind: "studio",
            text: "Jmix tool window → crm-from-db → Data Stores → Main Data Store (двойной клик) → Test Connection"
          },
          {
            kind: "studio",
            text: "Run → Run 'crm-from-db app'"
          },
          {
            kind: "url",
            text: "http://localhost:8080"
          },
          {
            kind: "studio",
            text: "После ./demo reset b: admin / admin → Application → Users → Create → Username sales, пароль sales, без ролей → OK"
          },
          {
            kind: "shell",
            text: "~/IdeaProjects/jmix-demo-runbook/demo check b"
          },
          {
            kind: "url",
            text: "http://localhost:8091/b2b-crm/"
          }
        ]
      },
      {
        id: "B0",
        title: "Что такое Jmix",
        minutes: 8,
        slide: [
          "Full-stack фреймворк для бизнес-приложений: БД, UI и права в одном Java-проекте",
          "Spring Boot + Vaadin Flow (UI на сервере, в Java) + JPA/EclipseLink + Liquibase",
          "Jmix 3: Java 21, Spring Boot 4, Vaadin 25; Studio — плагин IntelliJ IDEA; add-ons",
          "Хорош: back-office, CRM/ERP-подобное, много форм, таблиц и ролей, legacy-БД",
          "Не для: публичных high-load B2C, нативного mobile, pixel-perfect сайтов, тяжёлых SPA",
          "Лицензии: фреймворк Apache 2.0; премиум Studio и коммерческие add-ons — подписка"
        ],
        notes: [
          "Открываем определением: Jmix — high-level full-stack фреймворк для корпоративных веб-приложений, построенный на Spring Boot. Один Java-проект содержит модель данных (JPA-сущности), UI (view: Java-класс плюс XML-дескриптор), права доступа (роли) и миграции БД (Liquibase). Всё, что работает в Spring Boot, работает и здесь: бины, конфигурация, сторонние библиотеки.",
          "Стек. UI — Vaadin Flow: компоненты и их состояние живут на сервере, код экранов пишется на Java, отдельный фронтенд писать не нужно; логика и проверки выполняются на сервере, браузер передаёт только события UI — меньше поверхности для обхода (права всё равно задаются ролями). Доступ к данным — JPA через EclipseLink (стартер jmix-eclipselink-starter); частый вопрос «почему не Hibernate» — отвечаем, что это выбор фреймворка, а работаем мы через DataManager и метаданные Jmix. Схема БД ведётся Liquibase-changelog'ами, которые Studio генерирует. Текущая мажорная линейка — Jmix 3: Java 21, Spring Boot 4, Vaadin 25. Проект в демо B — на релизной 3.0.x; AI-тизер в конце (B4) идёт на стенде 3.1 preview, об этом скажем отдельно.",
          "Инструменты. Jmix Studio — плагин для IntelliJ IDEA: создание и настройка проекта, дизайнер модели данных, генерация миграций, визуальный редактор view, навигация, автодополнение и инспекции, специфичные для Jmix. Jmix CLI создаёт проекты из терминала, скриптов и AI-агентов по тем же шаблонам. Add-ons (отчёты, аудит, BPM и другие) подключаются через Marketplace в любой момент жизни проекта.",
          "Где уместен: back-office и line-of-business приложения, CRM/ERP-подобные системы, внутренние data-centric инструменты, где много форм, таблиц, фильтров и ролей. Отдельно — модернизация legacy: есть существующая БД, из неё генерируем модель, это и покажем в B2. Где не стоит: публичные high-load B2C-сайты (состояние UI каждой сессии хранится на сервере), нативные мобильные приложения, pixel-perfect маркетинговые сайты, тяжёлые кастомные SPA. Это рекомендации по позиционированию, а не жёсткие запреты — так и говорим.",
          "Лицензии коротко, без цен: фреймворк открыт под Apache 2.0. Планы на jmix.io: Community (бесплатно: фреймворк, базовые инструменты IDE, 40+ бесплатных add-ons), Sprint (премиум-функции Studio — визуальные дизайнеры, генерация Liquibase changelog и др.; без подписки работают в малых проектах до 10 сущностей и ролей, trial 28 дней), Enterprise и BPM — плюс коммерческие add-ons (например Maps, BPM); точный состав планов — на сайте. На проектор выводим только docs.jmix.io/jmix/studio/subscription.html — там планы и ограничения без цен; страницу Subscription Plans and Prices на jmix.io не открываем, на ней цены. Цены и условия не обещаем со сцены; перед демо сверить формулировки с сайтом.",
          "Ссылки открываем только при сети. docs.jmix.io — если в зале есть интернет; нет сети — не ждём пустую вкладку: факты о лицензиях уже на слайде, просто проговариваем их; при желании заранее сохранить скриншот страницы подписки из документации рядом с runbook."
        ],
        actions: [
          {
            kind: "say",
            text: "Jmix — это Spring Boot-приложение: всё, что вы знаете о Spring, здесь работает"
          },
          {
            kind: "say",
            text: "UI пишется на Java и выполняется на сервере — отдельный фронтенд писать не нужно"
          },
          {
            kind: "url",
            text: "https://docs.jmix.io/jmix/studio/subscription.html"
          },
          {
            kind: "url",
            text: "https://docs.jmix.io"
          }
        ]
      },
      {
        id: "B1",
        title: "Проект двумя путями: Studio и CLI",
        minutes: 7,
        slide: [
          "Два пути, одни шаблоны: Studio (File → New → Project) и Jmix CLI (jmix)",
          "Studio: репозиторий, версия Jmix, JDK → шаблон → имя, пакет, Project id, тема, локали",
          "CLI: тот же мастер в терминале, плюс add-ons и Agent Toolkit на старте",
          "Для скриптов и агентов: jmix new <name> --non-interactive",
          "Внутри: build.gradle (плагин io.jmix + BOM), entity, view, security, Liquibase",
          "Запуск: ./gradlew bootRun → http://localhost:8080, вход admin / admin"
        ],
        notes: [
          "Studio: File → New → Project, в списке слева — Jmix Project («Create new Jmix project from template»). Первый шаг: Repository, Jmix version (берём последнюю стабильную; BETA и SNAPSHOT появляются только с Show unstable versions), Project JDK — 21, неподдерживаемый JDK Studio не примет. Второй шаг — шаблон: Full-Stack Application (Java) по умолчанию, рядом Kotlin-вариант, REST Service Application, Add-On (Java), Composite Project for Separate Repositories. Третий шаг: Project name, Project location, Base package, Project id (префикс сущностей, таблиц и бинов, до 7 символов), Project theme, Locales, Create Git Repository. Add-ons в мастере Studio не выбираются — их добавляют позже через Marketplace. Finish не жмём: синхронизация Gradle и индексация займут минуты — жмём Cancel и переходим к готовому проекту. Список версий мастер грузит из репозитория (Loading Jmix Versions); если сети нет и прогрев из pre-flight потерян (IDE перезапускали), список останется пустым и Next не нажать — не ждём: показываем скриншоты трёх экранов мастера или сразу переходим к CLI.",
          "CLI: команда jmix запускает мастер в терминале по тем же шаблонам, что Studio (артефакт jmix-studio-templates). Но CLI сразу может добавить add-ons, Git и Agent Toolkit, поэтому дерево файлов отличается от проекта из Studio. Фазы: General, Localization, Add-ons, Location and setup, Finishing up. Управление: стрелки, Space — отметить, Enter — подтвердить, Esc — назад, q — выход (в текстовых полях Ctrl+Q). В Add-ons есть поиск по /, коммерческие помечены [$]. В Location and setup — чек-лист Git и Agent Toolkit, оба включены по умолчанию: проект сразу готов для AI-агентов, это мост к B4. Строку CLI command: — эквивалентный jmix new … --non-interactive для скриптов и агентов — CLI печатает только после доведённой до конца генерации. Полный список опций — jmix new --help; на сцене его не запускаем.",
          "CLI запускаем одной командой в подоболочке: (mkdir -p ~/jmix-cli-demo && cd ~/jmix-cli-demo && jmix --no-update). Мастер работает в пустой папке, а терминал после выхода остаётся в ~/IdeaProjects/crm-from-db, и git checkout в B2 сработает. Из самого crm-from-db мастер не запускать: варианты Location (подкаталог проекта или текущая папка) положат новый проект внутрь демо-репо. --no-update обязателен: обычный запуск может найти новый релиз, скачать его и перезапуститься на новой версии прямо перед залом. Путь по умолчанию — без генерации: проходим фазы до Location and setup и выходим по q. Тогда CLI command: не появится — показываем команду со слайда (jmix new <name> --non-interactive) либо GIF docs/demo.gif из README jmix-cli.",
          "Полная генерация — по желанию. Доводим её до конца, только если есть сеть и запас около минуты: без add-ons, Location — подкаталог внутри ~/jmix-cli-demo; без сети снять Agent Toolkit в чек-листе Location and setup (флаг --no-agents-toolkit), иначе его установка упадёт с предупреждением. После итога CLI спрашивает What's next? с пунктами Open the project in <IDE> и Run the application (./gradlew bootRun). Run не выбирать: порт 8080 занят приложением crm-from-db. Open — только если хотим показать второй проект в новом окне IDE. Если ничего не выбрать, CLI всё равно откроет папку проекта в Finder — окно просто закрыть. Если CLI не найдёт совместимый JDK, он спросит, ставить ли Temurin, и по умолчанию предлагает да — отвечаем n.",
          "Структуру показываем на crm-from-db, ветка b/01-empty. build.gradle: плагин id 'io.jmix' и блок jmix { bomVersion } — BOM фиксирует согласованные версии всех модулей Jmix; версия Jmix записана в двух местах (в плагине и в bomVersion), их держат одинаковыми; стартеры jmix-core-starter, jmix-eclipselink-starter, jmix-flowui-starter, security и datatools. Пакеты: entity (User), security (FullAccessRole, UiMinimalRole), view (login, main, user) — каждый view это Java-класс плюс XML-дескриптор. Ресурсы: menu.xml, messages_<locale>.properties, liquibase/changelog.xml и changelog/010-init-user.xml, application.properties со свойствами main.datasource.*, main.liquibase.change-log и ui.login.defaultUsername/defaultPassword. Шаблон по умолчанию создаёт HSQLDB в .jmix/hsqldb, а в нашей ветке main.datasource уже смотрит на PostgreSQL с дампом; Project id crm даёт таблицу пользователей CRM_USER, поэтому она не конфликтует с USER_ из CRM.",
          "Запуск: приложение уже запущено в pre-flight run-конфигурацией «Crm-from-db Jmix Application» — живьём не перезапускаем, холодный старт Vaadin-приложения занимает заметное время. Показываем Run tool window с логом и переключаемся на вкладку http://localhost:8080, вход admin / admin (логин и пароль подставлены свойствами ui.login.* — удобство для разработки, не для prod). Из терминала то же делает ./gradlew bootRun — только упоминаем: второй экземпляр упадёт на занятом порту 8080. Последний шаг блока — Stop в Run tool window, иначе запуск b/02-model в B2 упрётся в тот же порт. Типичные проблемы: занят порт 8080, не тот JDK, нет сети для шаблонов CLI (тогда jmix --no-update и кэш ~/.jmix/templates)."
        ],
        actions: [
          {
            kind: "studio",
            text: "File → New → Project → Jmix Project"
          },
          {
            kind: "studio",
            text: "Repository, Jmix version, Project JDK 21 → Next → Full-Stack Application (Java) → Next → Project name, Base package, Project id, Locales → Cancel"
          },
          {
            kind: "shell",
            text: "(mkdir -p ~/jmix-cli-demo && cd ~/jmix-cli-demo && jmix --no-update)"
          },
          {
            kind: "say",
            text: "Studio и CLI используют одни и те же шаблоны; CLI сразу может добавить add-ons и Agent Toolkit для AI-агентов"
          },
          {
            kind: "studio",
            text: "Project tool window → build.gradle → src/main/java/…/entity, view, security → src/main/resources/…/liquibase/changelog.xml → application.properties"
          },
          {
            kind: "studio",
            text: "View → Tool Windows → Run → Crm-from-db Jmix Application"
          },
          {
            kind: "url",
            text: "http://localhost:8080"
          },
          {
            kind: "say",
            text: "Логин admin / admin подставлен свойствами ui.login.* — это удобство для разработки"
          },
          {
            kind: "studio",
            text: "Run tool window → Crm-from-db Jmix Application → Stop"
          }
        ]
      },
      {
        id: "B2",
        title: "Приложение из существующей БД",
        minutes: 15,
        flow: ["Существующая БД", "JPA-сущности", "Экраны", "Приложение с данными"],
        slide: [
          "Есть живая PostgreSQL со схемой и данными CRM, а кода приложения нет",
          "Studio: Generate Model from Database — JPA-сущности прямо из таблиц",
          "Внешние ключи → связи many-to-one, коды статусов → enum",
          "Существующие таблицы не трогаем: Liquibase-скрипты для них не генерируются",
          "Шаблон Entity list and detail views: список и карточка за минуту",
          "Запуск — и реальные данные из базы уже на экране"
        ],
        notes: [
          "Ветка b/01-empty — свежий Jmix-проект (Project id crm, релизная 3.0.x), Main Data Store уже смотрит в PostgreSQL с дампом CRM из db/crm.sql. Типичный случай: есть база legacy-системы, поверх неё нужен бэк-офис. Manage Data Store... — покажите тип PostgreSQL и URL; HSQLDB в файловом или in-memory режиме генерацию модели не поддерживает. Таймбокс: если к 9-й минуте блока вы ещё не на b/02-model — git stash push -u и сразу git checkout b/03-views, мастер экранов пропустить.",
          "Шаг 1 — выбор таблиц. Правый клик по Main Data Store → Generate Model from Database... Если Studio сначала предложит выполнить неприменённые changelog'и проекта, выберите отрепетированный вариант. Шаг 1: Refresh list; таблиц, уже занятых сущностями проекта (CRM_USER у User из шаблона, служебные таблицы Jmix), в списке нет. Отметьте CLIENT, CONTACT, CATEGORY, CATEGORY_ITEM (товары), ORDER_, ORDER_ITEM (строки заказа), INVOICE. Studio сама доотметит таблицы, на которые они ссылаются, в том числе USER_. Скажите залу: USER_ — пользователи CRM, менеджеры клиентов (CLIENT.ACCOUNT_MANAGER_ID), а не таблица входа нашего приложения CRM_USER; снять её отдельно нельзя, Studio снимет вместе с ней CLIENT. Шестерёнку Settings только откройте: пакет сущностей и Traits mapping (VERSION, CREATED_BY и т.п. → трейты Jmix). Поля трейтов пустые, вживую не заполняем — в эталонной b/02-model это сделано.",
          "Шаг 2 — таблица маппинга со статусами. Edit mapping открывает Table Mapping Editor: Class, Instance name column, DB Script Generation Mode, Column mappings. USER_: Studio назовёт класс User1, потому что User уже есть, — переименуйте в Employee, как в b/02-model. ORDER_: Instance name column = NUMBER; instance name — то, как запись выглядит в списках и выпадающих полях. STATUS → Edit Column Mapping → Map to: Enum: Studio предзаполняет Java Type как com.company.crmfromdb.entity.Status (базовый пакет проекта + entity), замените на com.company.crmfromdb.entity.OrderStatus, иначе INVOICE.STATUS попадёт в тот же Status. Значения enum на PostgreSQL дописывают в дизайнере перечисления; в b/02-model они уже есть: NEW=10, ACCEPTED=20, IN_PROGRESS=30, DONE=40; там же INVOICE.STATUS — enum InvoiceStatus (NEW=10, PENDING=20, OVERDUE=30, PAID=40). Внешние ключи стали атрибутами many-to-one.",
          "Главная фраза блока: существующие таблицы Studio не трогает. Каждая сущность из таблицы получает @DdlGeneration(value = DdlGeneration.DbScriptGenerationMode.DISABLED), Liquibase-скрипты для неё не генерируются, схемой владеет база; развивать таблицу из Jmix будем в B3. Шаг 3 (Views): снимите Create standard views → Create. Покажите Client.java: @Table, @ManyToOne на ссылках, @InstanceName, @DdlGeneration.",
          "Руками не доводим: git stash push -u (результат уходит в stash, ничего не удаляется) и git checkout b/02-model. Экраны: Client в entity designer → Views → Create view → Entity list and detail views → Next по шагам (имена, опции, fetch plan для list и detail; в 3.1 добавлен шаг фильтра) → Create. Остальные экраны из ветки: git stash push -u, git checkout b/03-views; у Invoice экранов намеренно нет — их сделает агент в B4. Run, http://localhost:8080, admin / admin → клиенты и заказы с данными из дампа.",
          "Подводные камни. Database Connection Is Slow — кнопка Skip. Статусы Unsupported PK type и Composite PK — таблицу не замапить; на дампе CRM их быть не должно, проверить на репетиции. Лимит без подписки: до 10 сущностей и до 10 ролей; здесь 9 сущностей (7 таблиц, Employee, User), поэтому лишних таблиц не отмечать и держать подписку или trial активной. Check Jmix Database перед запуском: в Changelog Preview жать Discard and run, в окне неприменённых changelog'ов — Skip changelog generation; Save and run и Delete and proceed не жать, Cancel отменит запуск. Fallback на сбой мастера: Cancel → git stash push -u -m \"B2 fallback\" → git checkout b/02-model."
        ],
        actions: [
          {
            kind: "shell",
            text: "cd ~/IdeaProjects/crm-from-db"
          },
          {
            kind: "git",
            text: "git status --short --branch"
          },
          {
            kind: "shell",
            text: "docker compose -f db/docker-compose.yml ps"
          },
          {
            kind: "studio",
            text: "Jmix tool window → Data Stores → Main Data Store → Manage Data Store... → показать тип PostgreSQL и URL"
          },
          {
            kind: "say",
            text: "База уже есть и живёт своей жизнью — Jmix подстраивается под неё, а не наоборот"
          },
          {
            kind: "studio",
            text: "Jmix tool window → Data Stores → Main Data Store → правый клик → Generate Model from Database..."
          },
          {
            kind: "studio",
            text: "Generate Model from Database → Refresh list → CLIENT, CONTACT, CATEGORY, CATEGORY_ITEM, ORDER_, ORDER_ITEM, INVOICE (USER_ Studio отметит сама) → Next"
          },
          {
            kind: "studio",
            text: "Mapping → USER_ → Edit mapping → Class: User1 заменить на Employee → OK"
          },
          {
            kind: "studio",
            text: "Mapping → ORDER_ → Edit mapping → Instance name column: NUMBER → Column mappings → STATUS → Edit Column Mapping → Map to: Enum → Java Type: com.company.crmfromdb.entity.OrderStatus → OK"
          },
          {
            kind: "studio",
            text: "Views → снять Create standard views → Create"
          },
          {
            kind: "say",
            text: "Существующие таблицы Studio не трогает: Liquibase-скриптов для них нет, схемой владеет база"
          },
          {
            kind: "git",
            text: "git stash push -u -m \"B2 live wizard\""
          },
          {
            kind: "git",
            text: "git checkout b/02-model"
          },
          {
            kind: "studio",
            text: "Jmix tool window → Data Model → Client → Views → Create view → Entity list and detail views → Next по шагам → Create"
          },
          {
            kind: "git",
            text: "git stash push -u -m \"B2 live views\""
          },
          {
            kind: "git",
            text: "git checkout b/03-views"
          },
          {
            kind: "studio",
            text: "Run → Run 'Crm-from-db Jmix Application' → если появится Changelog Preview: Discard and run"
          },
          {
            kind: "url",
            text: "http://localhost:8080"
          }
        ]
      },
      {
        id: "B3",
        title: "Доработка руками в Studio",
        minutes: 10,
        slide: [
          "Новый атрибут rating у Client — в дизайнере сущности, без ручного SQL",
          "Liquibase-changelog пишет Studio: одна новая колонка, остальная таблица цела",
          "Поле на экран: Add Attributes to Views, результат виден в дизайнере view",
          "Роль «Manager: Clients read-only»: Read на Client, доступ к view и меню",
          "Назначение роли в самом приложении: Users → Role assignments",
          "Менеджер видит клиентов, но Create и Remove недоступны, Edit стал Read"
        ],
        notes: [
          "Подготовка до демо, не на сцене. После каждой репетиции вернуть БД к состоянию дампа: ./demo reset b из папки runbook (docker compose down -v и up: db/crm.sql загружается только в пустой том; чистый crm-from-db переключается на b/01-empty). Затем один раз запустить b/01-empty и в приложении создать пользователя без ролей: Users → Create, Username sales, пароль sales. Без сброса diff окажется пустым, окно Execute and proceed не появится, а Add в Role assignments наткнётся на уже назначенные роли. Первая команда блока выводит таблицу CLIENT: колонки rating в ней быть не должно — это и пользователя sales без ролей проверяет ./demo check b.",
          "Продолжаем на b/03-views. Client получен из существующей таблицы и помечен DISABLED, поэтому Studio не пишет для него Liquibase. Чтобы развивать таблицу из Jmix: Client в entity designer → ссылка DDL Generation Settings → DB script generation mode: CREATE_ONLY. Режимы: CREATE_AND_DROP — полная генерация, включая удаление колонок; CREATE_ONLY — создаём недостающее, но ничего не удаляем; DISABLED — скрипты не генерируются. Для legacy-таблиц CREATE_ONLY — безопасный выбор. Attributes → + → New Attribute: rating, Integer, без Mandatory (в таблице уже есть строки). Затем Add Attributes to Views → rating для list и detail → OK; в дизайнере detail view в панели Jmix UI видно новое поле внутри formLayout.",
          "Liquibase: Main Data Store → правый клик → Generate Liquibase Changelog. Studio сравнивает модель с базой; ожидаем addColumn RATING для CLIENT. Покажите окно и закройте его — готовый changelog лежит в b/04-role. Если в diff попало лишнее (другие таблицы, CRM_USER, служебные), причиной может быть сущность без DISABLED, расхождение User с CRM_USER или неприменённые changelog'и проекта. На репетиции добиться diff только с RATING. Лицензия: генерация changelog и дизайнеры — premium-функции Studio, бесплатно они работают в проектах до 10 сущностей и до 10 ролей. В crm-from-db 9 сущностей и 2–3 роли, это в пределах лимита, но статус всё равно проверить заранее: Jmix tool window → Settings → Account Information.",
          "Чтобы не тратить время: git stash push -u и git checkout b/04-role — там CREATE_ONLY, rating, changelog, поле в view и готовая роль; покажите git diff --stat. Остановите приложение из B2 и нажмите Run: before-run задача увидит неприменённый changelog и предложит Execute and proceed — жмём его; пока приложение стартует — роль в редакторе (абзац «Роль показываем готовой»). Delete and proceed не нажимать, он удаляет changelog; если следом появится Changelog Preview — Discard and run. Повторите команду про CLIENT: колонка rating появилась. В приложении под admin: Application → Users → sales → Role assignments → Resource roles → Add → в диалоге Select resource roles отметить Manager: Clients read-only и UI: minimal access (без неё вход в UI невозможен) → Select → OK. Меню пользователя → Log out; на форме входа стереть подставленные admin / admin и войти как sales / sales.",
          "Роль показываем готовой из b/04-role. Вживую её не строим: в ветке она уже есть, и собирать её в дизайнере на глазах у зала — двойная работа. Пока приложение перезапускается, открыть её: Jmix tool window → Security → роль Manager: Clients read-only (код manager-clients-ro), двойной клик — редактор роли. Вкладка Entities: Client → Read; в Attributes Permissions строка [*] → View. Вкладка User Interface: crm_Client.list → Allow view и Allow in menu, crm_Client.detail → Allow view, иначе карточка не откроется. Префикс crm_ в id view даёт Project id crm. Подчеркните: модель доступа аддитивная, запрещающих политик нет — что не разрешено ни одной ролью, того у пользователя нет. Создаётся такая роль через Jmix tool window → New (+) → Resource Role... — это одна фраза, не показ.",
          "Что показать под sales: в меню только разрешённые пункты, в списке клиентов Create и Remove недоступны, кнопка Edit называется Read, карточка только для чтения, rating виден (колонка пока пустая: значения в дампе не заданы). Пусто после входа — проверить, что назначены обе роли; не открывается карточка — нет Allow view для crm_Client.detail. Fallback: всё уже лежит в b/04-role. Если пользователя sales нет — Users → Create (Username, Password, Confirm password) → OK; роли назначаются только сохранённому пользователю."
        ],
        actions: [
          {
            kind: "shell",
            text: "docker compose -f db/docker-compose.yml exec db sh -c 'psql -P pager=off -U \"${POSTGRES_USER:-postgres}\" -d \"${POSTGRES_DB:-${POSTGRES_USER:-postgres}}\" -c \"\\d client\"'"
          },
          {
            kind: "studio",
            text: "Jmix tool window → Data Model → Client → DDL Generation Settings → DB script generation mode: CREATE_ONLY → OK"
          },
          {
            kind: "studio",
            text: "Client → Attributes → + → New Attribute: rating, Integer → OK"
          },
          {
            kind: "studio",
            text: "Client → Add Attributes to Views → rating → OK"
          },
          {
            kind: "studio",
            text: "Jmix tool window → Data Stores → Main Data Store → правый клик → Generate Liquibase Changelog → показать addColumn RATING → закрыть"
          },
          {
            kind: "say",
            text: "Скрипт добавляет одну колонку RATING — остальное в таблице CLIENT Studio не трогает"
          },
          {
            kind: "git",
            text: "git stash push -u -m \"B3 live\""
          },
          {
            kind: "git",
            text: "git checkout b/04-role"
          },
          {
            kind: "git",
            text: "git diff --stat b/03-views b/04-role"
          },
          {
            kind: "studio",
            text: "Run tool window → Crm-from-db Jmix Application → Stop"
          },
          {
            kind: "studio",
            text: "Run → Run 'Crm-from-db Jmix Application' → Execute and proceed"
          },
          {
            kind: "studio",
            text: "Пока приложение стартует: Jmix tool window → Security → роль Manager: Clients read-only (двойной клик) → вкладки Entities (Client: Read, [*]: View) и User Interface (crm_Client.list, crm_Client.detail)"
          },
          {
            kind: "shell",
            text: "docker compose -f db/docker-compose.yml exec db sh -c 'psql -P pager=off -U \"${POSTGRES_USER:-postgres}\" -d \"${POSTGRES_DB:-${POSTGRES_USER:-postgres}}\" -c \"\\d client\"'"
          },
          {
            kind: "url",
            text: "http://localhost:8080"
          },
          {
            kind: "studio",
            text: "Application → Users → sales → Role assignments → Resource roles → Add → отметить Manager: Clients read-only, UI: minimal access → Select → OK"
          },
          {
            kind: "studio",
            text: "Меню пользователя → Log out → стереть admin / admin → войти sales / sales"
          },
          {
            kind: "say",
            text: "Под менеджером Create и Remove недоступны, Edit превратился в Read — права работают без единой строки проверок"
          }
        ]
      },
      {
        id: "B4",
        title: "Мост к AI",
        minutes: 10,
        optional: true,
        exit: "Точка выхода: при отставании — только 3 минуты CRM AI",
        slide: [
          "Тот же проект + jmix-agent-toolkit: skills и правила Jmix для AI-агента",
          "Один промпт: «Добавь list view для Invoice» — агент пишет по skills",
          "Самопроверка агента: инспекции IDE и тест, что приложение поднимается",
          "Результат уже в ветке b/05-agent — запускаем и смотрим",
          "Тизер: CRM AI отвечает на вопросы по данным с учётом прав пользователя",
          "Подробно про AI в Jmix — в демо «AI × Jmix»"
        ],
        notes: [
          "Блок опциональный. Точка выхода: при отставании пропустить агента и дать только 3 минуты CRM AI на стенде. Toolkit в crm-from-db установлен заранее, не на сцене: в Studio 3.0+ это Jmix tool window → Settings → AI Agents Toolkit..., в терминале — install.sh из репозитория jmix-framework/jmix-agent-toolkit (ветка v3 для Jmix 3). Он ставит skills — инструкции агенту по типовым задачам Jmix (общий skill jmix и, например, jmix-create-list-view, jmix-create-resource-role), добавляет блок в CLAUDE.md или AGENTS.md и по желанию подключает MCP-серверы, то есть внешние инструменты агента (IDE JetBrains, документация через Context7), и Playwright.",
          "Сценарий: показать промпт, при желании запустить агента вживую на 2 минуты, затем переключиться на готовый результат. Перед запуском агента остановите приложение из B3: самопроверка агента выполняет ./gradlew --no-daemon clean test и может поднять bootRun на порту 8080, а с работающим приложением это конфликт порта и каталога build. Тесты идут в базу crm_test того же контейнера PostgreSQL: базу не останавливать. Живой запуск имеет смысл, только если skills стоят глобально (по умолчанию install.sh кладёт их в ~/.agents/.jmix/skills/v3 со ссылками в ~/.claude/skills) — тогда агент видит их и на b/04-role. Команда claude с промптом в кавычках открывает интерактивную сессию Claude Code; для другого агента — его команда. После таймбокса остановите агента и проверьте lsof -i :8080: если порт держит оставленный агентом процесс, остановите его. Затем git stash push -u и git checkout b/05-agent.",
          "Результат агента. На b/05-agent два коммита: установка toolkit (.skills, ссылки в .claude/skills и .agents/skills, блок в CLAUDE.md и AGENTS.md) и работа агента; git diff --stat b/04-role b/05-agent -- src показывает только её: контроллер InvoiceListView и invoice-list-view.xml, пункт в menu.xml, ключ сообщения, ресурсную роль Manager: Invoices read-only с политиками entity, view и menu и UI-тест списка — ровно шаги skill jmix-create-list-view. Обратите внимание зала: skill требует, чтобы JPQL использовал имя сущности, а не таблицы, и чтобы доступ выдавался через @ViewPolicy и @MenuPolicy в ресурсной роли. Самопроверка: jmix-ide-static-analysis (инспекции IDE по каждому созданному файлу) и jmix-verify-bootrun (завершающийся gradle clean test, а не висящий bootRun).",
          "Run, вход admin / admin, Application → Invoices: код агента ничем не отличается от сгенерированного Studio — тот же контроллер, XML-дескриптор и пункт меню. Кнопок Create, Edit и Remove нет: агент сделал только список, detail view для Invoice нет, а skill запрещает действия без достижимого экрана. Ключевая мысль: агенту проще, когда фреймворк сам даёт безопасные умолчания — права, валидацию, серверный UI.",
          "Тизер CRM AI (3 минуты): стенд aura-light из ветки demo/ai-app уже запущен, http://localhost:8091/b2b-crm/, вход admin / admin. Пункт меню CRM AI → новый диалог → вопрос из README CRM, например про лидеров по выручке. В ответе есть ссылки на записи CRM. Одна фраза: ответ строится через aitools data-load — JPQL генерируется и валидируется, выполняется с правами текущего пользователя. Разные ответы под admin и alice, @ExcludeFromAi, AI JPQL в отчётах и Dynamic Model AI — в демо A.",
          "Риски: CRM AI ходит в OpenAI через SPRING_AI_OPENAI_APIKEY, и ключ должен быть в окружении процесса стенда в момент запуска; проверка в терминале показывает только текущую оболочку. Нет интернета — показать скриншот ответа (assets/b4-*.png, последнее действие блока). Стенд собран на Jmix 3.1 preview (SNAPSHOT), но сам CRM AI есть и в релизной ветке main на Jmix 3.0.3."
        ],
        actions: [
          {
            kind: "say",
            text: "Агенту — один промпт, дальше он работает по skills Jmix и сам себя проверяет"
          },
          {
            kind: "studio",
            text: "Run tool window → Crm-from-db Jmix Application → Stop"
          },
          {
            kind: "shell",
            text: "claude \"Добавь list view для сущности Invoice с пунктом меню. Следуй skill jmix и проверь себя через jmix-ide-static-analysis и jmix-verify-bootrun\""
          },
          {
            kind: "shell",
            text: "lsof -i :8080"
          },
          {
            kind: "git",
            text: "git stash push -u -m \"B4 live agent\""
          },
          {
            kind: "git",
            text: "git checkout b/05-agent"
          },
          {
            kind: "git",
            text: "git log --oneline -3"
          },
          {
            kind: "git",
            text: "git diff --stat b/04-role b/05-agent -- src"
          },
          {
            kind: "studio",
            text: "Run → Run 'Crm-from-db Jmix Application'"
          },
          {
            kind: "url",
            text: "http://localhost:8080"
          },
          {
            kind: "studio",
            text: "Вход admin / admin → Application → Invoices (crm_Invoice.list)"
          },
          {
            kind: "shell",
            text: "[ -n \"$SPRING_AI_OPENAI_APIKEY\" ] && echo \"SPRING_AI_OPENAI_APIKEY set\" || echo \"SPRING_AI_OPENAI_APIKEY MISSING\""
          },
          {
            kind: "shell",
            text: "curl -s -o /dev/null -w \"%{http_code}\\n\" http://localhost:8091/b2b-crm/"
          },
          {
            kind: "url",
            text: "http://localhost:8091/b2b-crm/"
          },
          {
            kind: "studio",
            text: "Стенд: вход admin / admin → меню CRM AI → новый диалог → промпт из следующей строки"
          },
          {
            kind: "studio",
            text: "Какие клиенты лидеры по выручке, а какие аутсайдеры — и по каким товарным категориям?"
          },
          {
            kind: "shell",
            text: "open ~/IdeaProjects/jmix-demo-runbook/assets/b4-*.png"
          }
        ]
      },
      {
        id: "B5",
        title: "Итоги",
        minutes: 5,
        slide: [
          "Документация и туториал: docs.jmix.io — начните с Tutorial и Guides",
          "Фреймворк — Apache 2.0; premium Studio — подписка, trial Sprint 28 дней",
          "Онлайн-демо B2B CRM: demo.jmix.io/b2b-crm, исходники на GitHub",
          "Вопросы — forum.jmix.io, обучение команды — jmix.io/training",
          "Материалы демо и runbook: github.com/Fedoseew/jmix-demo-runbook",
          "Шаг на завтра: копия своей БД → Generate Model → экраны → роль"
        ],
        notes: [
          "Итог одной фразой: из существующей базы получили приложение со связями, экранами, миграцией и ролью, почти не написав кода. Всё показанное в B2–B3 — возможности Studio на релизной линейке Jmix 3.0 (crm-from-db собран на 3.0.x, как сказано в B0). CRM AI тоже есть в 3.0, а AI-генерация JPQL в отчётах и Dynamic Model AI появятся в Jmix 3.1, который ещё не выпущен.",
          "Вкладки со ссылками открыть заранее. Так мы не зависим от сети: документация https://docs.jmix.io/jmix/intro.html, туториал из 9 глав https://docs.jmix.io/jmix/tutorial/index.html, гайды https://docs.jmix.io/jmix/guides.html, страница про генерацию модели из БД https://docs.jmix.io/jmix/studio/reverse-engineering.html, подписка и trial https://docs.jmix.io/jmix/studio/subscription.html, онлайн-демо https://demo.jmix.io/b2b-crm/login, форум https://forum.jmix.io/, обучение https://www.jmix.io/training/, материалы демо и этот runbook https://github.com/Fedoseew/jmix-demo-runbook (QR — на заставке), проект демо B со всеми ветками https://github.com/Fedoseew/crm-from-db.",
          "Про подписку честно: дизайнеры сущностей, view, ролей, меню, fetch plan, JPQL и генерация Liquibase-changelog — premium-функции Studio. Без подписки они доступны в небольших проектах: до 10 сущностей и до 10 ролей. При первом входе в Studio выдаётся trial Sprint на 28 дней, он работает в проектах любого размера. Статус подписки: Jmix tool window → Settings → Account Information. Фреймворк распространяется под Apache 2.0, как и большинство add-ons.",
          "Следующие шаги для группы: поставить Studio и пройти туториал; взять копию своей базы (не прод) и прогнать Generate Model from Database; посмотреть код B2B CRM на GitHub (jmix-framework/jmix-crm) как пример структуры большого приложения; кто хочет AI — поставить jmix-agent-toolkit в проект. Частый вопрос: можно ли подключить вторую базу — да, как Additional Data Store, и генерация модели работает и для неё. HSQLDB в файловом или in-memory режиме для генерации модели не подходит."
        ],
        actions: [
          {
            kind: "url",
            text: "https://docs.jmix.io/jmix/intro.html"
          },
          {
            kind: "url",
            text: "https://docs.jmix.io/jmix/tutorial/index.html"
          },
          {
            kind: "url",
            text: "https://docs.jmix.io/jmix/guides.html"
          },
          {
            kind: "url",
            text: "https://docs.jmix.io/jmix/studio/reverse-engineering.html"
          },
          {
            kind: "url",
            text: "https://docs.jmix.io/jmix/studio/subscription.html"
          },
          {
            kind: "url",
            text: "https://demo.jmix.io/b2b-crm/login"
          },
          {
            kind: "url",
            text: "https://github.com/jmix-framework/jmix-crm"
          },
          {
            kind: "url",
            text: "https://github.com/jmix-framework/jmix-agent-toolkit"
          },
          {
            kind: "url",
            text: "https://github.com/Fedoseew/jmix-demo-runbook"
          },
          {
            kind: "url",
            text: "https://github.com/Fedoseew/crm-from-db"
          },
          {
            kind: "url",
            text: "https://forum.jmix.io/"
          },
          {
            kind: "url",
            text: "https://www.jmix.io/training/"
          },
          {
            kind: "say",
            text: "Попробуйте на копии своей базы: Generate Model from Database — и первые экраны будут в тот же день"
          }
        ]
      }
    ]
  }
};
