/* Task: tap the numbers from the smallest to the biggest, on a shuffled board. */
(function () {
  'use strict';
  const KM = window.KM;

  KM.TASKS.order = {
    init: (cfg) => {
      const nums = [];
      for (let i = 1; i <= cfg.size; i++) nums.push(i);
      return { cfg, board: KM.shuffle(nums), next: 1, bad: 0 };
    },
    render: (s) => {
      const cols = s.cfg.size === 16 ? 4 : s.cfg.size === 12 ? 3 : 3;
      return '<p class="task-lead">לחץ על ' + (s.next === 1 ? 'המספרים מ-1 והלאה' : 'המספר ' + s.next) + '</p>' +
        '<div class="order-grid ltr" style="--cols:' + cols + '">' + s.board.map((n) =>
          '<button type="button" class="order-cell' + (n < s.next ? ' done' : n === s.bad ? ' bad' : '') + '" data-action="order-tap" data-n="' + n + '"' + (n < s.next ? ' aria-disabled="true"' : '') + '>' + n + '</button>').join('') + '</div>' +
        '<p class="task-msg">' + (s.next - 1) + ' מתוך ' + s.cfg.size + '</p>';
    },
    tap: (s, n) => {
      if (n === s.next) {
        s.next++; s.bad = 0;
        if (s.next > s.cfg.size) { KM.taskDone(); return; }
      } else if (n > s.next) {
        s.bad = n;
        clearTimeout(s.t); s.t = setTimeout(() => { if (s.bad === n) { s.bad = 0; KM.render(); } }, 500);
      }
      KM.render();
    },
    onHide: (s) => clearTimeout(s.t)
  };

  KM.A['order-tap'] = (el) => { const R = KM.ring; if (R.ts && R.tasks[R.idx].type === 'order') KM.TASKS.order.tap(R.ts, +el.dataset.n); };
})();
