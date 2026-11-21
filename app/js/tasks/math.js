/* Task: sums. A big on-screen keypad (and the phone's number keys, for keypad phones and players). */
(function () {
  'use strict';
  const KM = window.KM;
  const { rand, esc, icon } = KM;

  // One question at a level: { q: '23 + 48', a: 71 }
  KM.mathQuestion = (level) => {
    if (level >= 3) {
      const a = rand(11, 19), b = rand(3, 9);
      if (Math.random() < 0.5) { const c = rand(11, 59); return { q: a + ' × ' + b + ' + ' + c, a: a * b + c }; }
      const c = rand(11, Math.min(59, a * b - 10));
      return { q: a + ' × ' + b + ' − ' + c, a: a * b - c };
    }
    if (level === 2) {
      const r = Math.random();
      if (r < 0.35) { const a = rand(4, 9), b = rand(4, 9); return { q: a + ' × ' + b, a: a * b }; }
      if (r < 0.7) { let a = rand(15, 69), b = rand(15, 39); if ((a % 10) + (b % 10) < 10) b = b - (b % 10) + (9 - (a % 10)) + rand(1, 3); return { q: a + ' + ' + b, a: a + b }; }
      const a = rand(52, 98), b = rand(17, 45); return { q: a + ' − ' + b, a: a - b };
    }
    if (Math.random() < 0.7) { const a = rand(11, 49), b = rand(11, 39); return { q: a + ' + ' + b, a: a + b }; }
    const a = rand(30, 89), b = rand(10, 29); return { q: a + ' − ' + b, a: a - b };
  };

  const MAX = 5;
  KM.TASKS.math = {
    init: (cfg) => ({ cfg, n: 0, cur: KM.mathQuestion(cfg.level), input: '', wrong: 0, flash: '' }),
    render: (s) => {
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
      return '<div class="task-count">תרגיל ' + (s.n + 1) + ' מתוך ' + s.cfg.count + '</div>' +
        '<div class="math-q ltr' + (s.flash ? ' ' + s.flash : '') + '" id="mathq"><span>' + esc(s.cur.q) + ' =</span><b class="ans">' + (esc(s.input) || '<i>?</i>') + '</b></div>' +
        '<p class="task-msg" id="mathmsg">' + (s.flash === 'bad' ? 'לא נכון, נסה שוב' : '&nbsp;') + '</p>' +
        '<div class="keypad ltr" role="group" aria-label="מקשי מספרים">' + keys.map((k) => k === 'del'
          ? '<button type="button" class="key fn" data-action="math-key" data-k="del" aria-label="מחיקה">' + icon('backspace') + '</button>'
          : k === 'ok' ? '<button type="button" class="key ok" data-action="math-key" data-k="ok" aria-label="בדיקה">' + icon('check') + '</button>'
          : '<button type="button" class="key" data-action="math-key" data-k="' + k + '">' + k + '</button>').join('') + '</div>';
    },
    key: (s, k) => {
      s.flash = '';
      if (k === 'del') s.input = s.input.slice(0, -1);
      else if (k === 'minus') s.input = s.input ? s.input : '-';
      else if (k !== 'ok') { if (s.input.length < MAX) s.input += k; }
      if (k === 'ok') {
        if (!s.input || s.input === '-') return;
        if (parseInt(s.input, 10) === s.cur.a) {
          s.n++;
          if (s.n >= s.cfg.count) { KM.taskDone(); return; }
          s.cur = KM.mathQuestion(s.cfg.level); s.input = ''; s.wrong = 0; s.flash = 'good';
        } else {
          s.wrong++; s.input = ''; s.flash = 'bad';
          if (s.wrong >= 3) { s.cur = KM.mathQuestion(s.cfg.level); s.wrong = 0; }
        }
      }
      KM.render();
    }
  };

  KM.A['math-key'] = (el) => { const R = KM.ring; if (R.ts && R.tasks[R.idx].type === 'math') KM.TASKS.math.key(R.ts, el.dataset.k); };
})();
