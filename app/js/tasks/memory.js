/* Task: memory. Squares light up one after another; then you tap them in the same order. */
(function () {
  'use strict';
  const KM = window.KM;
  const SHOW_MS = 650, GAP_MS = 220;

  function newSeq(len) {
    const seq = [];
    while (seq.length < len) { const c = KM.rand(0, 8); if (c !== seq[seq.length - 1]) seq.push(c); }
    return seq;
  }

  function play(s) {
    s.phase = 'show'; s.pos = 0; s.lit = -1;
    KM.render();
    const step = (i) => {
      if (s.dead) return;
      if (i >= s.seq.length) { s.phase = 'input'; s.lit = -1; KM.render(); return; }
      s.lit = s.seq[i]; KM.render();
      s.timer = setTimeout(() => { s.lit = -1; KM.render(); s.timer = setTimeout(() => step(i + 1), GAP_MS); }, SHOW_MS);
    };
    s.timer = setTimeout(() => step(0), 700);
  }

  KM.TASKS.memory = {
    init: (cfg) => ({ cfg, round: 0, seq: newSeq(cfg.len), phase: 'show', pos: 0, lit: -1, bad: -1, good: -1 }),
    render: (s) => {
      const lead = s.phase === 'show' ? 'שים לב לסדר…' : s.phase === 'wrong' ? 'לא נכון. מסתכלים שוב' : 'עכשיו לחץ באותו סדר';
      let cells = '';
      for (let i = 0; i < 9; i++) {
        const cls = s.lit === i ? ' lit' : s.bad === i ? ' bad' : s.good === i ? ' good' : '';
        cells += '<button type="button" class="mem-cell' + cls + '" data-action="mem-tap" data-c="' + i + '"' + (s.phase !== 'input' ? ' aria-disabled="true"' : '') + ' aria-label="ריבוע ' + (i + 1) + '"></button>';
      }
      return '<div class="task-count">סבב ' + (s.round + 1) + ' מתוך ' + s.cfg.rounds + '</div>' +
        '<p class="task-lead">' + lead + '</p><div class="mem-grid">' + cells + '</div>' +
        '<p class="task-msg">' + (s.phase === 'input' ? s.pos + ' מתוך ' + s.seq.length : '&nbsp;') + '</p>';
    },
    onShow: (s) => play(s),
    onHide: (s) => { s.dead = true; clearTimeout(s.timer); },
    tap: (s, c) => {
      if (s.phase !== 'input') return;
      s.bad = -1; s.good = -1;
      if (c === s.seq[s.pos]) {
        s.pos++; s.good = c;
        if (s.pos >= s.seq.length) {
          s.round++;
          if (s.round >= s.cfg.rounds) { KM.taskDone(); return; }
          s.seq = newSeq(s.cfg.len); s.phase = 'show'; KM.render();
          s.timer = setTimeout(() => play(s), 500);
          return;
        }
        KM.render();
        clearTimeout(s.flashT); s.flashT = setTimeout(() => { if (s.good === c) { s.good = -1; KM.render(); } }, 250);
      } else {
        s.bad = c; s.phase = 'wrong'; KM.render();
        s.timer = setTimeout(() => { s.bad = -1; s.seq = newSeq(s.cfg.len); play(s); }, 900);
      }
    }
  };

  KM.A['mem-tap'] = (el) => { const R = KM.ring; if (R.ts && R.tasks[R.idx].type === 'memory') KM.TASKS.memory.tap(R.ts, +el.dataset.c); };
})();
