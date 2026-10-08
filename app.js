// app.js — DOM runbook: сцена, консоль докладчика, таймер, клавиши, синхронизация окон. Логика — в core.js (globalThis.Runbook).
// Состояние не мутируется: каждое изменение собирает новый объект. Обращения к window/localStorage/location —
// только из функций, которые вызывает DOMContentLoaded (тест загружает файл с фальшивым document).
(function () {
  'use strict';

  const STATUS_MS = 3000;
  const UNDO_MS = 3000;
  const TICK_MS = 500;
  const STAGE_FONT_START_CQW = 2.35;
  const STAGE_FONT_STEP_CQW = 0.04;
  const CLOCK_MS = 30000;
  const COPY_FLASH_MS = 1400;
  const NEXT_STEPS_SHOWN = 4;
  const STEP_TOP_RATIO = 0.28;  // активный шаг — в верхней трети колонки
  const STEP_TOP_GAP_PX = 6;
  const MONO_KINDS = new Set(['shell', 'git', 'url']);
  const NO_CONTENT = 'content.js не загрузился — откройте index.html из папки runbook';

  // ---------------- состояние и хелперы ----------------
  let storage = null;
  let state = null;       // общее для окон: хранится в localStorage
  let view = 'stage';     // своё у окна: из URL, в localStorage не пишется
  let dockOpen = false;   // своё у окна (панель для зеркала, Task 4)
  let tick = null;
  let clockTick = null;
  let statusTimer = null;
  let undoReset = null;   // { id, sec, until } — второе R в течение UNDO_MS возвращает сброшенное время
  const lastIndex = {};   // ponytail: позиция в другом демо живёт до перезагрузки, формат State не трогаем

  const $ = id => document.getElementById(id);
  const two = n => String(n).padStart(2, '0');
  const demoName = key => DEMOS[key].title.split('—').pop().trim();
  const logo = cls => `<svg class="${cls}" viewBox="0 0 156 48" role="img" aria-label="Jmix"><use href="#logo"/></svg>`;

  const blocks = () => DEMOS[state.demo].blocks;
  const block = () => blocks()[state.index];
  const steps = () => Runbook.classifyActions(block().actions);
  const stepIndex = () => Runbook.stepOf(state, block().id, steps().length);
  const live = () => Runbook.elapsedNow(state.timer, Date.now());
  const progressPct = b => (b.minutes ? Math.min(100, live() / (b.minutes * 60) * 100) : 0);
  const idleTimer = elapsedBefore => ({ running: false, startedAt: null, elapsedBefore });
  const withElapsed = (id, sec) => ({ ...state.elapsed, [id]: sec });
  const withoutElapsed = id => Object.fromEntries(Object.entries(state.elapsed).filter(([k]) => k !== id));

  function safeStorage() {
    try { return window.localStorage; } catch (_) { return { getItem: () => null, setItem() {} }; }
  }

  // Хранилище — внешние данные: индекс блока может не подойти к демо, поэтому зажимаем.
  function readState() {
    const s = Runbook.loadState(storage);
    return { ...s, index: Runbook.clampIndex(s.index, DEMOS[s.demo].blocks.length) };
  }

  function commit() { Runbook.saveState(storage, state); }

  function announce(msg) {
    const s = $('status');
    s.textContent = msg;
    s.classList.add('on');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => s.classList.remove('on'), STATUS_MS);
  }

  // ---------------- сцена: одна разметка для зала (и для миниатюры консоли) ----------------
  function stageHTML(main) {
    const b = block(), all = blocks();
    const talks = all.filter(x => !x.pre);
    // Залу — только пройдено / сейчас / впереди: опциональность и точки выхода видит лишь докладчик.
    const strip = talks.map(x => {
      const i = all.indexOf(x);
      const cls = i < state.index ? 'done' : i === state.index ? 'cur' : '';
      const p = cls === 'cur' ? `;--p:${progressPct(x)}%` : '';
      return `<span class="st-seg ${cls}" style="--m:${x.minutes}${p}"></span>`;
    }).join('');
    const inner = b.pre
      ? `<div class="h-hero">${logo('h-logo')}<p class="h-kicker">Живое демо</p><h1 class="h-title">${Runbook.typo(demoName(state.demo))}</h1>
           <div class="st-rule"></div><p class="h-when">Скоро начинаем</p></div>
         <div class="h-agenda"><p class="h-cap">Программа</p>
           <ol class="h-list">${talks.map((x, i) => `<li><span class="n">${two(i + 1)}</span><span>${Runbook.typo(x.title)}</span></li>`).join('')}</ol></div>`
      : `<div class="st-top"><span class="st-count"><b>${two(talks.indexOf(b) + 1)}</b> / ${two(talks.length)}</span><i></i><span>${Runbook.esc(demoName(state.demo))}</span>${logo('st-logo')}</div>
         <h1 class="st-title">${Runbook.typo(b.title)}</h1>
         <div class="st-rule"></div><ul class="st-list">${b.slide.map(t => `<li>${Runbook.typo(t)}</li>`).join('')}</ul>`;
    return `<section class="stage${b.pre ? ' hold' : ''}${state.light ? ' light' : ''}" aria-label="Слайд ${Runbook.esc(b.id)}">
      <svg class="st-wm" viewBox="0 0 48 48" aria-hidden="true"><use href="#logo-mark"/></svg>
      <div class="st-inner">${inner}</div>
      <div class="st-foot"><div class="st-strip" aria-hidden="true">${strip}</div></div>
      ${main ? '<div class="st-hint"><kbd>P</kbd> консоль · <kbd>N</kbd> панель · <kbd>L</kbd> светлая сцена</div>' : ''}
    </section>`;
  }

  // Keynote-подобное ужатие: если тезисы не влезают, уменьшаем шрифт, но не ниже STAGE_FONT_MIN_CQW.
  function fitStage(stage) {
    const list = stage.querySelector('.st-list');
    if (!list) return;
    let fs = STAGE_FONT_START_CQW;
    const apply = () => list.style.setProperty('--fs', `${fs}cqw`);
    const overflows = () => list.scrollHeight > list.clientHeight + 1 || list.scrollWidth > list.clientWidth + 1;
    apply();
    while (overflows() && fs > Runbook.STAGE_FONT_MIN_CQW) {
      fs = Math.max(Runbook.STAGE_FONT_MIN_CQW, Math.round((fs - STAGE_FONT_STEP_CQW) * 100) / 100);
      apply();
    }
  }

  // Жирный лид заметки обязан помещаться в одну строку; не помещается — становится «мягким» (без жирного).
  function fitLeads() {
    $('app').querySelectorAll('.n-lead').forEach(l => {
      l.classList.remove('soft');
      l.classList.toggle('soft', l.getClientRects().length > 1);
    });
  }

  function fitAll() {
    $('app').querySelectorAll('.stage').forEach(fitStage);
    fitLeads();
  }

  // ---------------- консоль докладчика ----------------
  const icon = (id, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#${id}"/></svg>`;
  const arrows = t => t.replace(/\s*→\s*/g, ' <span class="s-arr">→</span> '); // перенос — только после стрелки
  const clockText = () => { const d = new Date(); return `${two(d.getHours())}:${two(d.getMinutes())}`; };
  const copyBtn = (bi, si, withKey) =>
    `<button type="button" class="copy" data-copy="${bi}:${si}" aria-label="Копировать шаг ${two(si + 1)}" title="Копировать">${icon('i-copy')}${withKey ? '<kbd class="ck">C</kbd>' : ''}</button>`;
  // «Короткая версия» осмысленна только там, где в блоке есть шаги [8]: в остальных блоках S и J/K работают как обычно.
  const shortOn = () => state.short && Runbook.hasShort(steps());

  function agendaSegHTML(a, i) {
    const cls = ['ag-seg', a.state, a.pre && 'pre', a.optional && 'opt', a.exit && 'exit'].filter(Boolean).join(' ');
    const fact = a.fact != null ? ` · факт ${Runbook.fmt(a.fact)}${a.over != null ? ` (${a.over > 0 ? '+' : '-'}${Runbook.fmt(Math.abs(a.over))})` : ''}` : '';
    const tip = `${a.id} · ${a.title}${a.pre ? '' : ` · ${a.minutes} мин`}${a.optional ? ' · опционально' : ''}${a.exit ? ` · ${a.exit}` : ''}${fact}`;
    let l2;
    if (a.pre) l2 = `<div class="ag-l2">${{ todo: 'чек-лист', cur: 'идёт', done: 'готово' }[a.state]}</div>`;
    else if (a.state === 'done' && a.fact != null) {
      l2 = `<div class="ag-l2"><span class="f-lbl">факт </span><span class="${a.over > 0 ? 'over' : 'under'}">${Runbook.fmt(a.fact)}</span></div>`;
    } else if (a.state === 'cur') {
      // название, пока нет времени; с первой секунды — факт (его обновляет paintTimer)
      l2 = `<div class="ag-l2 title" data-ag="l2"><span data-ag="title">${Runbook.esc(a.title)}</span><span data-ag="fact" hidden><span class="f-lbl">факт </span><span data-ag="factv"></span></span></div>`;
    } else l2 = `<div class="ag-l2 title">${Runbook.esc(a.title)}</div>`;
    const mark = a.state === 'done' && !a.pre ? '<svg class="ok" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check"/></svg>' : '';
    return `<button type="button" class="${cls}" style="--m:${a.minutes}" data-go="${i}" title="${Runbook.esc(tip)}"${a.state === 'cur' ? ' aria-current="step"' : ''}>
      <div class="ag-l1">${mark}<b>${Runbook.esc(a.id)}</b>${a.pre ? '' : `<span class="m">${a.minutes}′</span>`}</div>${l2}${a.state === 'cur' ? '<i class="now"></i>' : ''}</button>`;
  }

  function agendaHTML() {
    const t = Runbook.totals(blocks());
    const list = Runbook.agenda(blocks(), state.index, state.elapsed);
    return `<section class="panel agenda" aria-label="Повестка">
      <div class="ag-head"><span class="cap">Повестка</span><span class="sum">${list.filter(a => !a.pre).length} блоков · ${t.core} мин + ${t.all - t.core} опц.</span>
        <span class="ag-legend"><span><i class="l-cur"></i>сейчас</span><span><i class="l-opt"></i>опционально</span><span><i class="l-exit"></i>точка выхода</span></span></div>
      <div class="ag-track">${list.map(agendaSegHTML).join('')}</div></section>`;
  }

  // Решение «сокращать или нет» — рядом с таймером; какой из двух текстов виден, решает paintTimer.
  function exitHTML(b) {
    if (!b.exit) return '';
    const short = Runbook.hasShort(steps());
    const what = Runbook.esc(short ? 'короткая версия' : b.exit.replace(/^Точка выхода[^:]*:\s*/, '').replace(/^при отставании\s*(—\s*)?/, ''));
    return `<p class="t-exit" data-t="exit">${icon('i-exit')}<span data-x="late" hidden><b>Отстаём</b> → ${what}</span><span data-x="ok">Точка выхода: ${what}</span>${short ? '<kbd>S</kbd>' : ''}</p>`;
  }

  function timerHTML(b) {
    if (b.pre) {
      const t = Runbook.totals(blocks());
      return `<section class="panel timer" aria-label="Чек-лист">
        <div class="t-row"><span class="cap">Чек-лист</span><span class="t-live wait">таймер стоит</span></div>
        <div class="t-big"><strong data-t="checked">0/${b.slide.length}</strong><span>пунктов</span></div>
        <div class="t-bar ok" data-t="bar"><i></i></div>
        <p class="t-idle">Зал видит заставку. Таймер стартует с первого блока: ${t.core} мин + ${t.all - t.core} опц.</p></section>`;
    }
    return `<section class="panel timer" aria-label="Таймер блока">
      <div class="t-row"><span class="cap">Блок ${Runbook.esc(b.id)} · осталось</span><span class="t-live" data-t="live">идёт</span></div>
      <div class="t-big"><strong data-t="left">${Runbook.fmt(b.minutes * 60)}</strong><span>из ${Runbook.fmt(b.minutes * 60)}</span></div>
      <div class="t-bar" data-t="bar"><i></i></div>
      <dl class="t-stats">
        <div><dt>План</dt><dd data-t="plan"></dd></div>
        <div><dt>Факт</dt><dd data-t="fact"></dd></div>
        <div><dt data-t="deltaLbl">Запас</dt><dd data-t="delta"></dd></div>
      </dl>${exitHTML(b)}</section>`;
  }

  function nextHTML() {
    const n = blocks()[state.index + 1];
    if (!n) {
      return `<section class="panel next" aria-label="Следующий блок"><div class="t-row"><span class="cap">Далее</span></div><div class="nx-title">Это последний блок</div>
        <div class="nx-head">Финал демо — вопросы и контакты</div></section>`;
    }
    const first = Runbook.classifyActions(n.actions).slice(0, NEXT_STEPS_SHOWN).map((a, i) => {
      const mono = MONO_KINDS.has(a.kind);
      return `<li class="nx-step k-${a.kind}">
        <span class="s-ic" title="${Runbook.actionLabel(a.kind)}">${icon('i-' + a.kind)}</span>
        <span class="nx-txt${mono ? ' mono' : ''}">${mono ? Runbook.esc(a.text) : arrows(Runbook.esc(a.text))}</span>
        ${Runbook.isCopyable(a.kind) ? copyBtn(state.index + 1, i, false) : '<span></span>'}</li>`;
    }).join('');
    return `<section class="panel next" aria-label="Следующий блок">
      <div class="t-row"><span class="cap">Далее · первые шаги</span><kbd>→</kbd></div>
      <div class="nx-head"><span class="chip">${Runbook.esc(n.id)}</span><span>${n.minutes} мин</span>${n.optional ? '<span class="tag opt">опц.</span>' : ''}${n.exit ? `<span class="tag exit">${icon('i-exit')}выход</span>` : ''}</div>
      <div class="nx-title">${Runbook.esc(n.title)}</div>
      <ol class="nx-steps">${first}</ol></section>`;
  }

  function notesHTML(b) {
    const checklist = b.pre
      ? `<ul class="pf-list">${b.slide.map(t => `<li><label><input type="checkbox"><span>${Runbook.esc(t)}</span></label></li>`).join('')}</ul>`
      : '';
    const notes = b.notes.map((t, i) => {
      const [lead, rest] = Runbook.splitLead(t);
      return `<details class="note"><summary><span class="n-i">${i + 1}</span><span class="n-text">${lead ? `<span class="n-lead">${Runbook.esc(lead)}</span>` : ''}<span class="n-rest">${Runbook.esc(rest)}</span></span>${icon('i-chev', 'chev')}</summary></details>`;
    }).join('');
    const count = b.pre ? `${b.slide.length} пунктов · ${b.notes.length} заметок` : `${b.notes.length} абзацев`;
    return `<section class="panel col" aria-label="Заметки">
      <div class="col-head"><h2>${b.pre ? 'Чек-лист' : 'Заметки'}</h2><span class="count">${count}</span><span class="spacer"></span><button type="button" class="ghost" data-expand>Раскрыть все</button></div>
      <div class="col-body">${checklist}<div class="notes">${notes}</div></div></section>`;
  }

  function stepBody(a) {
    const text = Runbook.esc(a.text);
    if (a.kind === 'shell' || a.kind === 'git') return `<code class="s-code">${text}</code>`;
    if (a.kind === 'url') return /^https?:\/\/\S+$/.test(a.text) ? `<a class="s-url" href="${text}" target="_blank" rel="noopener">${text}</a>` : `<span class="s-url">${text}</span>`;
    if (a.kind === 'prompt') return `<span class="s-prompt">${text}</span>`;
    const badge = a.short ? '<span class="b8" title="Входит в короткую версию (8 мин)">8′</span>' : '';
    return `<span class="s-text">${badge}${arrows(text)}</span>`;
  }

  function actionsHTML() {
    const list = steps();
    const items = list.map((a, i) => `<li class="step k-${a.kind}${a.short ? '' : ' full-only'}" data-step="${i}">
        <span class="s-n">${two(i + 1)}</span>
        <span class="s-ic" title="${Runbook.actionLabel(a.kind)}">${icon('i-' + a.kind)}</span>
        <div class="s-body">${stepBody(a)}</div>
        ${Runbook.isCopyable(a.kind) ? copyBtn(state.index, i, true) : '<span></span>'}
      </li>`).join('');
    const toggle = Runbook.hasShort(list)
      ? '<button type="button" class="tgl" data-short aria-pressed="false" title="Оставить только шаги короткой версии"><span class="b8">8′</span>короткая версия<kbd>S</kbd></button>'
      : '';
    return `<section class="panel col acts" aria-label="Действия">
      <div class="col-head"><h2>Действия</h2><span class="count">шаг <b data-stepno>1</b> / ${list.length}</span>
        <span class="hint"><kbd>J</kbd><kbd>K</kbd> шаг</span><span class="spacer"></span>${toggle}</div>
      <div class="col-body"><ol class="steps">${items}</ol></div></section>`;
  }

  function consoleHTML() {
    const b = block();
    const tabs = ['a', 'b'].map((k, i) => `<button type="button" data-demo="${k}" aria-pressed="${state.demo === k}"><kbd>${i + 1}</kbd>${Runbook.esc(demoName(k))}</button>`).join('');
    return `<div class="console">
      <header class="c-top">
        <div class="c-brand">${logo('')}<span class="cap">Консоль докладчика</span></div>
        <nav class="seg-ctl" aria-label="Демо">${tabs}</nav>
        <span class="c-pill"><i></i>Сцена<span>· второй экран</span></span>
        <div class="c-keys"><span><kbd>←</kbd><kbd>→</kbd> блок</span><span><kbd>J</kbd><kbd>K</kbd> шаг</span><span><kbd>C</kbd> копировать</span><span><kbd>T</kbd> таймер</span><span><kbd>1</kbd><kbd>2</kbd> демо</span><span class="c-clock" data-clock>${clockText()}</span></div>
      </header>
      ${agendaHTML()}
      <div class="c-main">
        <div class="c-left">
          ${timerHTML(b)}
          <section class="panel now-shot" aria-label="Сейчас на экране"><div class="t-row"><span class="cap">На экране зала</span><span class="t-live">в эфире</span></div>${stageHTML(false)}<div class="ns-title">${Runbook.esc(b.pre ? 'Заставка · скоро начинаем' : b.title)}</div></section>
          ${nextHTML()}
        </div>
        ${notesHTML(b)}
        ${actionsHTML()}
      </div>
    </div>`;
  }

  // Активный шаг и короткая версия — без перерисовки, чтобы не терять раскрытые заметки.
  function paintSteps(smooth) {
    const items = [...$('app').querySelectorAll('.steps .step')];
    if (!items.length) return;
    const cur = stepIndex();
    items.forEach((li, i) => {
      li.classList.toggle('done', i < cur);
      li.classList.toggle('active', i === cur);
      if (i === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('app').querySelector('.steps').classList.toggle('short-on', shortOn());
    $('app').querySelector('[data-short]')?.setAttribute('aria-pressed', String(shortOn()));
    $('app').querySelector('[data-stepno]').textContent = cur + 1;
    // активный шаг — в верхнюю треть колонки: сверху виден предыдущий контекст
    const body = items[0].closest('.col-body'), li = items[cur];
    const target = li.offsetTop - body.clientHeight * STEP_TOP_RATIO;
    const top = items.find(x => x.offsetTop >= target) || li;
    const behavior = smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto';
    body.scrollTo({ top: Math.max(0, top.offsetTop - STEP_TOP_GAP_PX), behavior });
  }

  function setStep(i) {
    if (i === stepIndex()) return;
    state = { ...state, steps: { ...state.steps, [block().id]: i } };
    commit();
    paintSteps(true);
  }

  const moveStep = dir => setStep(Runbook.nextStep(steps(), stepIndex(), dir, shortOn()));

  function toggleShort() {
    if (!Runbook.hasShort(steps())) return;
    state = { ...state, short: !state.short };
    commit();
    paintSteps(true);
  }

  // ---------------- копирование ----------------
  async function copyStep(bi, si) {
    const step = Runbook.classifyActions(blocks()[bi]?.actions || [])[si];
    if (!step || !Runbook.isCopyable(step.kind)) return;
    let ok = await Runbook.copyText(step.text, navigator.clipboard);
    if (!ok) ok = copyViaTextarea(step.text);
    announce(ok ? `Скопировано: шаг ${two(si + 1)}` : 'Буфер обмена недоступен — выделите текст вручную');
    if (ok) flashCopied(bi, si);
  }

  // ponytail: execCommand устарел, но копирует там, где Clipboard API запрещён политикой страницы
  function copyViaTextarea(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    ta.remove();
    return ok;
  }

  // Иконка кнопки на короткое время меняется на галочку.
  function flashCopied(bi, si) {
    const btns = [...$('app').querySelectorAll(`[data-copy="${bi}:${si}"]`)];
    const paint = on => btns.forEach(btn => {
      btn.classList.toggle('ok', on);
      btn.querySelector('use').setAttribute('href', on ? '#i-check' : '#i-copy');
    });
    paint(true);
    setTimeout(() => paint(false), COPY_FLASH_MS);
  }

  // ---------------- второе окно ----------------
  function openConsole() {
    let w = null;
    try { w = window.open('?view=console', 'jmix-runbook-console', 'popup,width=1440,height=900'); } catch (_) { w = null; }
    announce(w ? 'Консоль открыта — перетащите сцену на проектор и нажмите F'
               : 'Браузер заблокировал окно — откройте index.html?view=console вручную');
  }

  // ---------------- панель для зеркала: заглушка Task 4 ----------------
  function dockHTML() { return ''; }

  // ---------------- рендер ----------------
  function render() {
    document.body.className = 'view-' + view + (dockOpen ? ' dock-open' : '');
    $('app').innerHTML = view === 'console' ? consoleHTML() : stageHTML(true) + dockHTML();
    fitAll();
    paintSteps(false);
    paintTimer();
    ensureTick();
    ensureClock();
    document.title = `${block().id} · ${view === 'console' ? 'Консоль' : 'Сцена'} — Jmix Runbook`;
  }

  // Без перерисовки: полоса сцены (она есть и в миниатюре консоли), числа консоли; панель зеркала добавляет Task 4.
  function paintTimer() {
    const pct = progressPct(block());
    $('app').querySelectorAll('.st-seg.cur').forEach(seg => seg.style.setProperty('--p', `${pct}%`));
    if (view === 'console') paintConsoleTimer(pct);
  }

  const q = sel => $('app').querySelector(sel);
  const setText = (sel, text) => { const el = q(sel); if (el) el.textContent = text; };

  // Чек-лист живёт в DOM: число отмеченных считаем по чекбоксам.
  function paintChecklist() {
    const boxes = [...$('app').querySelectorAll('.pf-list input')];
    const done = boxes.filter(x => x.checked).length;
    setText('[data-t="checked"]', `${done}/${boxes.length}`);
    q('[data-t="bar"]')?.style.setProperty('--p', `${boxes.length ? done / boxes.length * 100 : 0}%`);
  }

  function paintPace(sec) {
    const { plan, fact, delta } = Runbook.pace(blocks(), state.index, state.elapsed, sec);
    const late = delta > 0;
    setText('[data-t="plan"]', Runbook.fmt(plan));
    setText('[data-t="fact"]', Runbook.fmt(fact));
    setText('[data-t="deltaLbl"]', late ? 'Отстаём' : 'Запас');
    setText('[data-t="delta"]', late ? `+${Runbook.fmt(delta)}` : Runbook.fmt(-delta));
    q('[data-t="delta"]').classList.toggle('late', late);
    const exit = q('[data-t="exit"]');
    if (!exit) return;
    exit.classList.toggle('late', late);
    exit.title = late ? `Отстаём на +${Runbook.fmt(delta)}` : '';
    exit.querySelector('[data-x="late"]').hidden = !late;
    exit.querySelector('[data-x="ok"]').hidden = late;
  }

  // Текущий сегмент повестки: полоса времени; название, пока времени нет, и факт — как только оно пошло.
  function paintAgendaCurrent(b, sec, pct) {
    q('.ag-seg.cur')?.style.setProperty('--p', `${pct}%`);
    const l2 = q('[data-ag="l2"]');
    if (!l2) return;
    const started = sec >= 1;
    l2.classList.toggle('title', !started);
    l2.querySelector('[data-ag="title"]').hidden = started;
    l2.querySelector('[data-ag="fact"]').hidden = !started;
    const value = l2.querySelector('[data-ag="factv"]');
    value.textContent = Runbook.fmt(sec);
    value.classList.toggle('over', sec > b.minutes * 60);
  }

  function paintConsoleTimer(pct) {
    const b = block(), sec = live();
    paintAgendaCurrent(b, sec, pct);
    if (b.pre) { paintChecklist(); return; }
    const left = Runbook.remaining(b.minutes, sec);
    setText('[data-t="live"]', state.timer.running ? 'идёт' : 'пауза');
    q('[data-t="live"]').classList.toggle('wait', !state.timer.running);
    setText('[data-t="left"]', Runbook.fmt(left));
    q('[data-t="left"]').classList.toggle('late', left < 0);
    q('[data-t="bar"]').style.setProperty('--p', `${pct}%`);
    paintPace(sec);
  }

  const paintClock = () => setText('[data-clock]', clockText());

  function ensureClock() {
    if (view === 'console' && !clockTick) clockTick = setInterval(paintClock, CLOCK_MS);
  }

  function ensureTick() {
    if (state.timer.running && !tick) tick = setInterval(paintTimer, TICK_MS);
    else if (!state.timer.running && tick) { clearInterval(tick); tick = null; }
  }

  // ---------------- таймер ----------------
  // Время текущего блока уходит в elapsed, таймер встаёт на паузу.
  function stopTimerIntoElapsed() {
    const sec = Math.round(live());
    state = { ...state, elapsed: sec > 0 ? withElapsed(block().id, sec) : state.elapsed, timer: idleTimer(sec) };
  }

  // Таймер и факт меняются без render(): в консоли он схлопнул бы раскрытые заметки.
  function commitTimer() { commit(); paintTimer(); ensureTick(); }

  function toggleTimer() {
    if (block().minutes === 0) return;
    undoReset = null; // после T отмена сброса затёрла бы новое время блока
    if (state.timer.running) stopTimerIntoElapsed();
    else state = { ...state, timer: { running: true, startedAt: Date.now(), elapsedBefore: state.elapsed[block().id] || 0 } };
    commitTimer();
  }

  // R без модификатора легко нажать случайно — повторное R в течение UNDO_MS возвращает время блока.
  function resetTimer() {
    const b = block();
    if (b.minutes === 0) return;
    const id = b.id;
    const now = Date.now();
    if (undoReset && undoReset.id === id && now < undoReset.until) {
      const { sec } = undoReset;
      undoReset = null;
      state = { ...state, elapsed: sec > 0 ? withElapsed(id, sec) : state.elapsed, timer: idleTimer(sec) };
      announce('Сброс отменён');
    } else {
      undoReset = { id, sec: Math.round(live()), until: now + UNDO_MS };
      state = { ...state, elapsed: withoutElapsed(id), timer: idleTimer(0) };
      announce('Таймер блока сброшен — R ещё раз в течение 3 с вернёт время');
    }
    commitTimer();
  }

  // ---------------- навигация ----------------
  function moveTo(patch) {
    stopTimerIntoElapsed();
    state = { ...state, ...patch };
    state = { ...state, timer: idleTimer(state.elapsed[block().id] || 0) };
    commit();
    render();
  }

  function go(i) {
    const next = Runbook.clampIndex(i, blocks().length);
    if (next === state.index) return; // →/← на крайнем блоке не должны ставить таймер на паузу
    moveTo({ index: next });
  }

  function setDemo(key) {
    if (state.demo === key) return;
    lastIndex[state.demo] = state.index;
    moveTo({ demo: key, index: Runbook.clampIndex(lastIndex[key] ?? state.index, DEMOS[key].blocks.length) });
  }

  // ---------------- клавиши и синхронизация окон ----------------
  // e.code — чтобы клавиши работали и в русской раскладке
  const CONSOLE_KEYS = {
    KeyJ: () => moveStep(1),
    Space: () => moveStep(1),
    KeyK: () => moveStep(-1),
    KeyC: () => copyStep(state.index, stepIndex()),
    KeyS: toggleShort,
  };

  function onKey(e) {
    if (!Runbook.shouldHandleKey(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space' && e.target.closest?.('button, summary, input, a')) return;
    if (view === 'console' && CONSOLE_KEYS[e.code]) {
      CONSOLE_KEYS[e.code]();
      e.preventDefault();
      return;
    }
    switch (e.code) {
      case 'ArrowRight': go(state.index + 1); break;
      case 'ArrowLeft': go(state.index - 1); break;
      case 'Digit1': setDemo('a'); break;
      case 'Digit2': setDemo('b'); break;
      case 'KeyT': toggleTimer(); break;
      case 'KeyR': resetTimer(); break;
      case 'KeyF': Runbook.toggleFullscreen(document); break;
      case 'KeyP': if (view !== 'stage') return; openConsole(); break;
      case 'KeyL': state = { ...state, light: !state.light }; commit(); render(); break;
      default: return;
    }
    e.preventDefault();
  }

  function toggleNotes(button) {
    const all = [...$('app').querySelectorAll('.note')];
    const open = !all.every(d => d.open);
    all.forEach(d => { d.open = open; });
    button.textContent = open ? 'Свернуть все' : 'Раскрыть все';
  }

  function onClick(e) {
    if (view !== 'console') return;
    const t = e.target.closest('[data-go],[data-demo],[data-copy],[data-expand],[data-short],[data-step]');
    if (!t || e.target.closest('a')) return;
    const d = t.dataset;
    if (d.go !== undefined) go(Number(d.go));
    else if (d.demo !== undefined) setDemo(d.demo);
    else if (d.copy !== undefined) copyStep(...d.copy.split(':').map(Number));
    else if (d.short !== undefined) toggleShort();
    else if (d.step !== undefined) setStep(Number(d.step));
    else toggleNotes(t);
    // Кнопка в фокусе после щелчка мышью перехватила бы Space (он не для кнопок) и нажала бы её снова.
    if (e.detail > 0) t.blur();
  }

  // Чекбокс в фокусе глушит все клавиши (shouldHandleKey): после щелчка мышью отдаём фокус обратно.
  function onChange(e) {
    if (!e.target.matches('.pf-list input')) return;
    paintChecklist();
    if (!e.target.matches(':focus-visible')) e.target.blur();
  }

  function onStorage(e) {
    if (e.key !== Runbook.STORAGE_KEY) return;
    const next = readState();
    const ch = Runbook.syncChanges(state, next);
    state = next;
    if (ch.full) { render(); return; }
    if (ch.steps) paintSteps(true);
    if (ch.timer) { paintTimer(); ensureTick(); }
  }

  // ---------------- инициализация ----------------
  function init() {
    // content.js правится руками: без этой проверки синтаксическая ошибка в нём даёт пустой тёмный экран.
    if (!globalThis.DEMOS?.a || !globalThis.DEMOS?.b) { document.body.textContent = NO_CONTENT; return; }
    storage = safeStorage();
    state = readState();
    view = Runbook.viewOf(location.search);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    window.addEventListener('storage', onStorage);
    window.addEventListener('resize', fitAll);
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
