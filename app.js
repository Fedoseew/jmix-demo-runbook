// app.js — DOM runbook: сцена, таймер, клавиши, синхронизация окон. Логика — в core.js (globalThis.Runbook).
// Состояние не мутируется: каждое изменение собирает новый объект. Обращения к window/localStorage/location —
// только из функций, которые вызывает DOMContentLoaded (тест загружает файл с фальшивым document).
(function () {
  'use strict';

  const STATUS_MS = 3000;
  const UNDO_MS = 3000;
  const TICK_MS = 500;
  const STAGE_FONT_START_CQW = 2.35;
  const STAGE_FONT_STEP_CQW = 0.04;
  const NO_CONTENT = 'content.js не загрузился — откройте index.html из папки runbook';

  // ---------------- состояние и хелперы ----------------
  let storage = null;
  let state = null;       // общее для окон: хранится в localStorage
  let view = 'stage';     // своё у окна: из URL, в localStorage не пишется
  let dockOpen = false;   // своё у окна (панель для зеркала, Task 4)
  let tick = null;
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

  function fitAll() {
    $('app').querySelectorAll('.stage').forEach(fitStage);
  }

  // ---------------- консоль и панель: заглушки Task 3–4 ----------------
  function consoleHTML() { return ''; }
  function dockHTML() { return ''; }
  function paintSteps() { /* Task 3–4: активный шаг и короткая версия без перерисовки */ }

  // ---------------- рендер ----------------
  function render() {
    document.body.className = 'view-' + view + (dockOpen ? ' dock-open' : '');
    $('app').innerHTML = view === 'console' ? consoleHTML() : stageHTML(true) + dockHTML();
    fitAll();
    paintSteps(false);
    paintTimer();
    ensureTick();
    document.title = `${block().id} · ${view === 'console' ? 'Консоль' : 'Сцена'} — Jmix Runbook`;
  }

  // Без перерисовки: ширина текущего сегмента полосы сцены; числа консоли и панели добавляют Task 3–4.
  function paintTimer() {
    const pct = progressPct(block());
    $('app').querySelectorAll('.st-seg.cur').forEach(seg => seg.style.setProperty('--p', `${pct}%`));
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
  function onKey(e) {
    if (!Runbook.shouldHandleKey(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space' && e.target.closest?.('button, summary, input, a')) return;
    switch (e.code) {
      case 'ArrowRight': go(state.index + 1); break;
      case 'ArrowLeft': go(state.index - 1); break;
      case 'Digit1': setDemo('a'); break;
      case 'Digit2': setDemo('b'); break;
      case 'KeyT': toggleTimer(); break;
      case 'KeyR': resetTimer(); break;
      case 'KeyF': Runbook.toggleFullscreen(document); break;
      case 'KeyL': state = { ...state, light: !state.light }; commit(); render(); break;
      default: return;
    }
    e.preventDefault();
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
    window.addEventListener('storage', onStorage);
    window.addEventListener('resize', fitAll);
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
