/* Tasks: walking (steps) and shaking the phone. Both count with the motion sensor (tasks/motion.js);
   if the sensor stays silent, the task becomes sums. */
(function () {
  'use strict';
  const KM = window.KM;
  const { icon } = KM;

  function ring(done, total, label, ic) {
    const pct = Math.min(1, done / total), C = 2 * Math.PI * 54;
    return '<div class="move-ring" id="moveRing">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="track"/><circle cx="60" cy="60" r="54" class="fill" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct)).toFixed(1) + '"/></svg>' +
      '<div class="move-in">' + icon(ic, 'lg') + '<b id="moveLeft">' + Math.max(0, total - done) + '</b><span>' + label + '</span></div></div>';
  }

  function make(kind, ic, verb, left, hint) {
    return {
      init: (cfg) => ({ cfg, done: 0, mover: null }),
      render: (s) => '<p class="task-lead">' + verb + '</p>' + ring(s.done, s.cfg.count, left, ic) +
        '<p class="task-msg">' + hint + '</p>',
      onShow: (s) => {
        s.mover = KM.motionStart(kind, () => {
          s.done++;
          if (s.done >= s.cfg.count) { KM.taskDone(); return; }
          // Only the numbers change, so the screen doesn't flicker on every step.
          const C = 2 * Math.PI * 54, f = KM.$('#moveRing .fill'), n = KM.$('#moveLeft');
          if (f) f.setAttribute('stroke-dashoffset', (C * (1 - s.done / s.cfg.count)).toFixed(1));
          if (n) n.textContent = String(s.cfg.count - s.done);
        }, () => KM.taskFallback('חיישן התנועה לא עונה'));
      },
      onHide: (s) => { if (s.mover) s.mover.stop(); s.mover = null; }
    };
  }

  KM.TASKS.steps = make('steps', 'steps', 'קום מהמיטה ולך עם הטלפון ביד', 'צעדים נשארו', 'הולכים רגיל, הטלפון ביד או בכיס. כל צעד נספר.');
  KM.TASKS.shake = make('shake', 'shake', 'נער את הטלפון חזק', 'ניעורים נשארו', 'אחוז חזק בטלפון ונער אותו קדימה ואחורה.');
})();
