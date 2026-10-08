// core.js — чистая логика runbook без DOM. Подключается после content.js и до app.js, тестируется в Node.
(function () {
  const STORAGE_KEY = 'jmix-runbook/v1';
  const LEAD_MAX = 56;
  const STAGE_FONT_MIN_CQW = 2.19; // 28px при ширине сцены 1280
  const KIND_LABELS = { shell: 'Терминал', git: 'Git', url: 'Ссылка', studio: 'Studio', say: 'Сказать', prompt: 'Промпт' };
  const COPYABLE = new Set(['shell', 'git', 'url', 'prompt']);
  const PROMPT_INTRO = /промпт[а-яё]* из следующ/i;
  const SHORT_MARK = /^\[8\]\s*/;

  function clampIndex(i, len) {
    if (len <= 0) return 0;
    return Math.min(Math.max(i, 0), len - 1);
  }

  function defaultState() {
    return {
      demo: 'a', index: 0,
      timer: { running: false, startedAt: null, elapsedBefore: 0 },
      elapsed: {}, steps: {}, short: false, light: false,
    };
  }

  const pick = (obj, ok) =>
    Object.fromEntries(Object.entries(obj && typeof obj === 'object' ? obj : {}).filter(([, v]) => ok(v)));

  // Хранилище — внешние данные: проверяем каждый тип, лишние поля старых версий отбрасываем.
  function loadState(storage) {
    const d = defaultState();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return d;
      const s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return d;
      const t = s.timer || {};
      const running = t.running === true && Number.isFinite(t.startedAt);
      return {
        demo: s.demo === 'b' ? 'b' : 'a',
        index: Number.isInteger(s.index) ? s.index : d.index,
        timer: {
          running,
          startedAt: running ? t.startedAt : null,
          elapsedBefore: Number.isFinite(t.elapsedBefore) ? t.elapsedBefore : 0,
        },
        elapsed: pick(s.elapsed, Number.isFinite),
        steps: pick(s.steps, v => Number.isInteger(v) && v >= 0),
        short: s.short === true,
        light: s.light === true,
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

  async function copyText(text, clipboard) {
    if (!clipboard || typeof clipboard.writeText !== 'function') return false;
    try { await clipboard.writeText(text); return true; } catch (_) { return false; }
  }

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

  const actionLabel = kind => KIND_LABELS[kind] || kind;
  const isCopyable = kind => COPYABLE.has(kind);

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s).replace(/[&<>"']/g, c => ESC[c]);
  // Типографика сцены: тире не начинает строку, после стрелки нет переноса, короткие слова держатся за следующее.
  const typo = s => esc(s)
    .replace(/ — /g, ' — ')
    .replace(/ → /g, ' → ')
    .replace(/(?<=^|[\s(«])([а-яё]{1,2}|без|для|при|над|под|про)\s/giu, '$1 ');

  // Лид — кратчайший законченный кусок (предложение, «…:», до « — », до «)») не длиннее max и без
  // разорванных скобок и кавычек. Нет такого — лида нет, абзац показывается целиком.
  function splitLead(text, max = LEAD_MAX) {
    const balanced = c => c.split('(').length === c.split(')').length && c.split('«').length === c.split('»').length;
    const cuts = [/^.+?[.!?…](?=\s|$)/, /^.+?:(?=\s)/, /^.+?(?=\s—\s)/, /^.+?\)(?=[\s,])/]
      .map(re => text.match(re)?.[0])
      .filter(c => c && c.length <= max && balanced(c))
      .sort((x, y) => x.length - y.length);
    return cuts.length ? [cuts[0], text.slice(cuts[0].length)] : ['', text];
  }

  // Строка «… промпт из следующей строки …» превращает следующие studio-действия в промпты с копированием.
  // Промпт входит в короткую версию, если в неё входит вводящий его шаг.
  function classifyActions(actions) {
    let ahead = 0;
    let inherit = false;
    return actions.map(a => {
      const short = SHORT_MARK.test(a.text);
      const text = a.text.replace(SHORT_MARK, '');
      if (a.kind === 'studio' && ahead > 0) {
        ahead--;
        return { kind: 'prompt', text, short: inherit };
      }
      if (PROMPT_INTRO.test(text)) {
        ahead = /два промпта/i.test(text) ? 2 : 1;
        inherit = short;
      }
      return { kind: a.kind, text, short };
    });
  }

  const hasShort = list => list.some(a => a.short);

  function nextStep(list, step, dir, shortOnly) {
    let i = step + dir;
    while (shortOnly && list[i] && !list[i].short) i += dir;
    return i < 0 || i >= list.length ? step : i;
  }

  const stepOf = (state, blockId, len) => clampIndex(state.steps[blockId] ?? 0, len);

  // Темп к текущему моменту: только блоки, по которым есть факт, плюс текущий блок
  // (его план не больше заложенных минут, перерасход идёт в отставание).
  function pace(blocks, index, elapsed, liveSec) {
    const timed = blocks.slice(0, index).filter(b => !b.pre && (elapsed[b.id] || 0) > 0);
    const cur = blocks[index];
    const live = cur && !cur.pre ? liveSec : 0;
    const plan = timed.reduce((s, b) => s + b.minutes * 60, 0) + (cur && !cur.pre ? Math.min(liveSec, cur.minutes * 60) : 0);
    const fact = timed.reduce((s, b) => s + elapsed[b.id], 0) + live;
    return { plan, fact, delta: fact - plan };
  }

  function agenda(blocks, index, elapsed) {
    return blocks.map((b, i) => {
      const fact = elapsed[b.id] > 0 ? elapsed[b.id] : null;
      return {
        id: b.id, title: b.title, minutes: b.minutes,
        pre: Boolean(b.pre), optional: Boolean(b.optional), exit: b.exit || null,
        state: i < index ? 'done' : i === index ? 'cur' : 'todo',
        fact, over: fact != null && !b.pre ? fact - b.minutes * 60 : null,
      };
    });
  }

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function syncChanges(prev, next) {
    return {
      full: prev.demo !== next.demo || prev.index !== next.index || prev.light !== next.light,
      steps: !same(prev.steps, next.steps) || prev.short !== next.short,
      timer: !same(prev.timer, next.timer) || !same(prev.elapsed, next.elapsed),
    };
  }

  // ponytail: без URLSearchParams — его нет в node:vm, а нужен один параметр
  const viewOf = search => (/(?:^|[?&])view=console(?:&|$)/.test(String(search)) ? 'console' : 'stage');

  globalThis.Runbook = {
    STORAGE_KEY, LEAD_MAX, STAGE_FONT_MIN_CQW, KIND_LABELS,
    clampIndex, defaultState, loadState, saveState, shouldHandleKey, totals,
    fmt, elapsedNow, remaining, toggleFullscreen, copyText,
    actionLabel, isCopyable, esc, typo, splitLead, classifyActions, hasShort,
    nextStep, stepOf, pace, agenda, syncChanges, viewOf,
  };
})();
