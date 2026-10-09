// core.js — чистая логика runbook без DOM. Подключается после content.js и до app.js, тестируется в Node.
(function () {
  const STORAGE_KEY = 'jmix-runbook/v1';
  const LEAD_MAX = 56;
  const STAGE_FONT_MIN_CQW = 2.19; // 28px при ширине сцены 1280
  const KIND_LABELS = { shell: 'Терминал', git: 'Git', url: 'Ссылка', studio: 'Studio', say: 'Сказать', prompt: 'Промпт' };
  const COPYABLE = new Set(['shell', 'git', 'url', 'prompt']);
  const PROMPT_INTRO = /промпт[а-яё]* из следующ/i;
  const SHORT_MARK = /^\[8\]\s*/;
  const FLOW_MIN = 3, FLOW_MAX = 5, FLOW_LABEL_MAX = 24;

  function clampIndex(i, len) {
    if (len <= 0) return 0;
    return Math.min(Math.max(i, 0), len - 1);
  }

  function defaultState() {
    return { demo: 'a', index: 0, steps: {}, short: false, light: false, indexByDemo: {} };
  }

  const pick = (obj, ok) =>
    Object.fromEntries(Object.entries(obj && typeof obj === 'object' ? obj : {}).filter(([, v]) => ok(v)));

  // Хранилище — внешние данные: проверяем каждый тип, лишние поля старых версий (timer, elapsed) отбрасываем.
  function loadState(storage) {
    const d = defaultState();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return d;
      const s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return d;
      return {
        demo: s.demo === 'b' ? 'b' : 'a',
        index: Number.isInteger(s.index) ? s.index : d.index,
        steps: pick(s.steps, v => Number.isInteger(v) && v >= 0),
        short: s.short === true,
        light: s.light === true,
        indexByDemo: pick({ a: s.indexByDemo?.a, b: s.indexByDemo?.b }, v => Number.isInteger(v) && v >= 0),
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
  // Типографика сцены: тире не начинает строку, после стрелки нет переноса, короткие слова держатся за следующее,
  // слово через дефис («CRM-система») не рвётся. Без lookbehind: в Safari до 16.4 он ронял бы весь core.js.
  const SHORT_WORD = /(^|[\s(«])([а-яё]{1,2}|без|для|при|над|под|про)[^\S\u00a0]/giu;
  function glueShortWords(s) {
    // совпадение съедает пробел перед следующим словом — повтор доклеивает цепочки «и в доме»
    for (let prev = ''; prev !== s;) { prev = s; s = s.replace(SHORT_WORD, '$1$2\u00a0'); }
    return s;
  }
  const typo = s => glueShortWords(esc(s)
    .replace(/ — /g, '\u00a0— ')
    .replace(/ → /g, ' →\u00a0'))
    .replace(/[\p{L}\d]+(?:-[\p{L}\d]+)+/gu, '<span class="nw">$&</span>');

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

  // Полоса процесса под заголовком слайда (block.flow): 3–5 коротких подписей. Контент правят руками —
  // полоса не по контракту не рисуется, а не ломает вёрстку слайда.
  function flowOf(block) {
    const f = block && block.flow;
    const ok = Array.isArray(f) && f.length >= FLOW_MIN && f.length <= FLOW_MAX
      && f.every(s => typeof s === 'string' && s.trim().length > 0 && s.length <= FLOW_LABEL_MAX);
    return ok ? f : [];
  }

  function nextStep(list, step, dir, shortOnly) {
    let i = step + dir;
    while (shortOnly && list[i] && !list[i].short) i += dir;
    return i < 0 || i >= list.length ? step : i;
  }

  const stepOf = (state, blockId, len) => clampIndex(state.steps[blockId] ?? 0, len);

  function agenda(blocks, index) {
    return blocks.map((b, i) => ({
      id: b.id, title: b.title, minutes: b.minutes,
      pre: Boolean(b.pre), optional: Boolean(b.optional), exit: b.exit || null,
      state: i < index ? 'done' : i === index ? 'cur' : 'todo',
    }));
  }

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function syncChanges(prev, next) {
    return {
      full: prev.demo !== next.demo || prev.index !== next.index || prev.light !== next.light,
      steps: !same(prev.steps, next.steps) || prev.short !== next.short,
    };
  }

  // ponytail: без URLSearchParams — его нет в node:vm, а нужен один параметр
  const viewOf = search => (/(?:^|[?&])view=console(?:&|$)/.test(String(search)) ? 'console' : 'stage');

  globalThis.Runbook = {
    STORAGE_KEY, LEAD_MAX, STAGE_FONT_MIN_CQW, KIND_LABELS, FLOW_LABEL_MAX,
    clampIndex, defaultState, loadState, saveState, shouldHandleKey, totals,
    toggleFullscreen, copyText,
    actionLabel, isCopyable, esc, typo, splitLead, classifyActions, hasShort,
    nextStep, stepOf, agenda, syncChanges, viewOf, flowOf,
  };
})();
