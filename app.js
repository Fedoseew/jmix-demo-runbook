// app.js — логика runbook. Чистые функции на globalThis.Runbook, DOM — в init().
(function () {
  const STORAGE_KEY = 'jmix-runbook/v1';

  function clampIndex(i, len) {
    if (len <= 0) return 0;
    return Math.min(Math.max(i, 0), len - 1);
  }

  function defaultState() {
    return {
      demo: 'a', index: 0, notes: false,
      timer: { running: false, startedAt: null, elapsedBefore: 0 },
      elapsed: {},
    };
  }

  function loadState(storage) {
    const d = defaultState();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return d;
      const s = JSON.parse(raw);
      const t = s.timer || {};
      // Хранилище — внешние данные: строка вместо числа сломала бы арифметику таймера и факта.
      const running = t.running === true && Number.isFinite(t.startedAt);
      return {
        demo: s.demo === 'b' ? 'b' : 'a',
        index: Number.isInteger(s.index) ? s.index : d.index,
        notes: Boolean(s.notes),
        timer: {
          running,
          startedAt: running ? t.startedAt : null,
          elapsedBefore: Number.isFinite(t.elapsedBefore) ? t.elapsedBefore : 0,
        },
        elapsed: Object.fromEntries(Object.entries(s.elapsed || {}).filter(([, v]) => Number.isFinite(v))),
      };
    } catch (_) {
      return d;
    }
  }

  function saveState(storage, state) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* storage недоступен — работаем без него */ }
  }

  function shouldHandleKey(ev) {
    const tag = ev && ev.target && ev.target.tagName;
    return !(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');
  }

  function totals(blocks) {
    const real = blocks.filter(b => !b.pre);
    return {
      core: real.filter(b => !b.optional).reduce((s, b) => s + b.minutes, 0),
      all: real.reduce((s, b) => s + b.minutes, 0),
    };
  }

  const ACTION_LABELS = { shell: 'терминал', git: 'git', url: 'ссылка', studio: 'Studio', say: 'сказать' };
  function actionLabel(kind) { return ACTION_LABELS[kind] || kind; }

  async function copyText(text, clipboard) {
    if (!clipboard || typeof clipboard.writeText !== 'function') return false;
    try { await clipboard.writeText(text); return true; } catch (_) { return false; }
  }

  // --- таймер (Task 4 расширяет) ---
  function fmt(sec) {
    const s = Math.abs(Math.round(sec));
    const sign = sec < 0 && s > 0 ? '-' : '';
    const m = Math.floor(s / 60), r = s % 60;
    return `${sign}${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }
  function elapsedNow(timer, now) {
    return timer.elapsedBefore + (timer.running && timer.startedAt != null ? (now - timer.startedAt) / 1000 : 0);
  }
  function remaining(plannedMin, elapsedSec) { return plannedMin * 60 - elapsedSec; }

  // Факт по демо: сохранённое время блоков, для текущего блока — живое время таймера.
  function factTotal(blocks, elapsed, currentId, liveSec) {
    return blocks.reduce((s, b) => s + (b.id === currentId ? liveSec : (elapsed[b.id] || 0)), 0);
  }

  // Fullscreen API возвращает промис, который отклоняется (нет жеста, iframe, запрет) — глотаем.
  async function toggleFullscreen(doc) {
    try {
      if (doc.fullscreenElement) await doc.exitFullscreen();
      else await doc.documentElement.requestFullscreen();
      return true;
    } catch (_) {
      return false;
    }
  }

  globalThis.Runbook = { clampIndex, defaultState, loadState, saveState, shouldHandleKey, totals, fmt, elapsedNow, remaining, factTotal, toggleFullscreen, actionLabel, copyText };

  if (typeof document === 'undefined') return;

  // ---------------- DOM ----------------
  const $ = id => document.getElementById(id);
  const storage = (() => { try { return window.localStorage; } catch (_) { return { getItem: () => null, setItem() {} }; } })();
  let state = loadState(storage);
  let tick = null;
  let statusTimer = null;
  let undoReset = null;   // { id, sec, until } — второе R в течение UNDO_MS возвращает сброшенное время
  const lastIndex = {};   // ponytail: позиция в другом демо живёт до перезагрузки, формат State не трогаем
  const STATUS_MS = 3000;
  const UNDO_MS = 3000;
  const COPY_LABEL = 'Копировать';
  const NO_CONTENT = 'content.js не загрузился или содержит ошибку — запустите node --test test/';

  function demo() { return DEMOS[state.demo]; }
  function block() { return demo().blocks[state.index]; }
  function persist() { saveState(storage, state); }

  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const c of children) n.append(c);
    return n;
  }

  function renderTabs() {
    const tabs = $('demoTabs'); tabs.replaceChildren();
    for (const key of ['a', 'b']) {
      tabs.append(el('button', { type: 'button', 'data-key': `tab-${key}`, 'aria-pressed': String(state.demo === key), text: DEMOS[key].title, onclick: () => switchDemo(key) }));
    }
  }

  function renderList() {
    const ul = $('blockList'); ul.replaceChildren();
    demo().blocks.forEach((b, i) => {
      const tags = [];
      if (b.optional) tags.push(el('span', { class: 'tag opt', text: 'опц.' }));
      if (b.exit) tags.push(el('span', { class: 'tag exit', text: 'точка выхода' }));
      if (state.elapsed[b.id] > 0) tags.push(el('span', { class: 'tag done', text: fmt(state.elapsed[b.id]) }));
      ul.append(el('li', {}, [el('button', {
        type: 'button', class: 'block', 'data-key': `block-${b.id}`,
        'aria-current': i === state.index ? 'step' : 'false', onclick: () => goTo(i),
      }, [
        el('span', { text: `${b.id} · ${b.title}` }),
        el('span', { class: 'min', text: b.pre ? '—' : `${b.minutes} мин` }),
        el('span', { class: 'tags' }, tags),
      ])]));
    });
  }

  function renderSlide() {
    const b = block();
    $('blockMeta').textContent = b.pre ? 'Подготовка' : `Блок ${b.id} · план ${b.minutes} мин${b.optional ? ' · опционально' : ''}`;
    $('slideTitle').textContent = b.title;
    $('slideBullets').replaceChildren(...b.slide.map(s => el('li', { text: s })));
    const ex = $('exit'); ex.hidden = !b.exit; ex.textContent = b.exit || '';
    renderPresenter(b); // Task 3
  }

  function renderTotals() {
    const t = totals(demo().blocks);
    const fact = factTotal(demo().blocks, state.elapsed, block().id, elapsedNow(state.timer, Date.now()));
    $('totals').textContent = `план ${t.core} мин (с опц. ${t.all}) · факт ${fmt(fact)}`;
  }

  // render() пересобирает кнопки, поэтому фокус переносим на новый элемент с тем же data-key.
  // Фокус на вкладке/блоке следует за текущим выбором, иначе Space на старой кнопке вернул бы назад.
  function render() {
    const key = document.activeElement?.dataset?.key;
    renderTabs(); renderList(); renderSlide(); renderTotals(); renderTimer(); persist();
    if (!key) return;
    const target = key.startsWith('tab-') ? `tab-${state.demo}` : key.startsWith('block-') ? `block-${block().id}` : key;
    [...document.querySelectorAll('[data-key]')].find(n => n.dataset.key === target)?.focus();
  }

  function announce(msg) {
    const s = $('status');
    s.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { s.textContent = ''; }, STATUS_MS);
  }

  function goTo(i) {
    const next = clampIndex(i, demo().blocks.length);
    if (next === state.index) return;  // →/← на крайнем блоке не должны ставить таймер на паузу
    stopTimerIntoElapsed();            // фиксируем время текущего блока
    state.index = next;
    state.timer = { running: false, startedAt: null, elapsedBefore: state.elapsed[block().id] || 0 };
    render();
  }
  function switchDemo(key) {
    if (state.demo === key) return;
    stopTimerIntoElapsed();
    lastIndex[state.demo] = state.index;
    state.demo = key;
    state.index = clampIndex(lastIndex[key] ?? state.index, demo().blocks.length);
    state.timer = { running: false, startedAt: null, elapsedBefore: state.elapsed[block().id] || 0 };
    render();
  }

  function renderPresenter(b) {
    const p = $('presenter');
    p.hidden = !state.notes;
    if (p.hidden) return;
    $('notes').replaceChildren(...b.notes.map(t => el('p', { text: t })));
    $('actions').replaceChildren(...b.actions.map((a, i) => {
      const body = a.kind === 'url'
        ? el('a', { href: a.text, target: '_blank', rel: 'noopener', 'data-key': `link-${b.id}-${i}`, text: a.text })
        : a.kind === 'say' ? el('span', { class: 'say', text: a.text })
        : el('code', { text: a.text });
      const copyable = a.kind === 'shell' || a.kind === 'git' || a.kind === 'url';
      const btn = copyable ? el('button', {
        type: 'button', 'data-key': `copy-${b.id}-${i}`, 'aria-label': `${COPY_LABEL}: ${a.text}`, text: COPY_LABEL,
        onclick: async ev => {
          ev.stopPropagation();
          let ok = await copyText(a.text, navigator.clipboard);
          if (!ok) {
            const r = document.createRange(); r.selectNodeContents(body); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
            // ponytail: execCommand устарел, но копирует там, где Clipboard API запрещён политикой страницы
            try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
          }
          const msg = ok ? 'Скопировано' : 'Выделено';
          btn.textContent = msg;
          btn.classList.toggle('copied', ok);
          announce(msg);
          setTimeout(() => { btn.textContent = COPY_LABEL; btn.classList.remove('copied'); }, 1500);
        },
      }) : el('span');
      return el('div', { class: 'action' }, [el('span', { class: 'kind', text: actionLabel(a.kind) }), body, btn]);
    }));
  }

  function renderTimer() {
    const b = block();
    const t = $('timer');
    t.classList.toggle('hidden', b.minutes === 0);
    if (b.minutes === 0) { stopTick(); return; }
    const rem = remaining(b.minutes, elapsedNow(state.timer, Date.now()));
    t.textContent = fmt(rem);
    t.classList.toggle('over', Math.round(rem) < 0); // красный — только когда на табло уже «-00:01»
    t.classList.toggle('running', state.timer.running);
    if (state.timer.running && !tick) tick = setInterval(onTick, 500);
    if (!state.timer.running) stopTick();
  }
  function onTick() { renderTimer(); renderTotals(); }
  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }

  function stopTimerIntoElapsed() {
    const b = block();
    const sec = Math.round(elapsedNow(state.timer, Date.now()));
    if (sec > 0) state.elapsed[b.id] = sec;
    state.timer = { running: false, startedAt: null, elapsedBefore: sec };
    stopTick();
  }

  function toggleTimer() {
    if (block().minutes === 0) return;
    undoReset = null; // после T отмена сброса затёрла бы новое время блока
    if (state.timer.running) {
      stopTimerIntoElapsed();
    } else {
      state.timer = { running: true, startedAt: Date.now(), elapsedBefore: state.elapsed[block().id] || 0 };
    }
    render();
  }

  // R без модификатора легко нажать случайно — повторное R в течение UNDO_MS возвращает время блока.
  function resetTimer() {
    const id = block().id;
    stopTick();
    if (undoReset && undoReset.id === id && Date.now() < undoReset.until) {
      const { sec } = undoReset;
      undoReset = null;
      if (sec > 0) state.elapsed[id] = sec;
      state.timer = { running: false, startedAt: null, elapsedBefore: sec };
      announce('Сброс отменён');
    } else {
      undoReset = { id, sec: Math.round(elapsedNow(state.timer, Date.now())), until: Date.now() + UNDO_MS };
      delete state.elapsed[id];
      state.timer = { running: false, startedAt: null, elapsedBefore: 0 };
      announce('Таймер блока сброшен — R ещё раз в течение 3 с вернёт время');
    }
    render();
  }

  function onKey(ev) {
    if (!shouldHandleKey(ev) || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const k = ev.key;
    if (k === 'ArrowRight') goTo(state.index + 1);
    else if (k === 'ArrowLeft') goTo(state.index - 1);
    else if (k === '1') switchDemo('a');
    else if (k === '2') switchDemo('b');
    else if (k === 'n' || k === 'N' || k === 'т' || k === 'Т') { state.notes = !state.notes; render(); }
    else if (k === 't' || k === 'T' || k === 'е' || k === 'Е') toggleTimer();
    else if (k === 'r' || k === 'R' || k === 'к' || k === 'К') resetTimer();
    else if (k === 'f' || k === 'F' || k === 'а' || k === 'А') toggleFullscreen(document);
    else return;
    ev.preventDefault();
  }

  function init() {
    // content.js правится руками: без этой проверки синтаксическая ошибка в нём даёт пустой тёмный экран.
    if (!globalThis.DEMOS?.a || !globalThis.DEMOS?.b) { document.body.textContent = NO_CONTENT; return; }
    state.index = clampIndex(state.index, demo().blocks.length);
    document.addEventListener('keydown', onKey);
    render();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
