/* The screen while the alarm rings, the tasks, "good morning", and the "are you awake?" check.
   Always night-dark, over everything (no tabs). There is no stop button on purpose. */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc, icon } = KM;
  const V = KM.views;
  const R = KM.ring;

  const sky = () => '<div class="ring-sky" aria-hidden="true"><svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMax slice">' +
    '<defs><radialGradient id="glow" cx="50%" cy="100%" r="60%"><stop offset="0" stop-color="#FF9F43" stop-opacity=".75"/><stop offset="1" stop-color="#FF9F43" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="320" height="120" fill="url(#glow)"/><path class="ring-sun" d="M120 120a40 40 0 0 1 80 0Z" fill="#FFC93C"/></svg></div>';

  function ringScreen() {
    const a = R.alarm || {};
    let h = '<div class="ring-screen">' + sky() +
      '<div class="ring-now ltr" id="ringNow">' + KM.time(Date.now()) + '</div>' +
      '<div class="ring-label">' + esc(a.label || 'בוקר טוב! הגיע הזמן לקום') + '</div>' +
      '<div class="ring-card"><span class="rc-k">כדי לכבות את השעון:</span><ol class="rc-list">' +
      R.tasks.map((t) => '<li>' + icon(KM.TASK_INFO[t.type].icon, 'sm') + '<span>' + esc(KM.taskName(t)) + '<small>' + esc(KM.taskSummary(t)) + '</small></span></li>').join('') +
      '</ol></div>' +
      '<button type="button" class="btn ring-btn big" data-action="ring-start" autofocus>' + icon('sunrise') + 'מתחילים</button>';
    if (R.snoozesLeft > 0) h += '<button type="button" class="btn ghost light" data-action="ring-snooze">' + icon('repeat', 'sm') + 'דחייה ל-' + (a.snoozeMin || 5) + ' דקות (' + (R.snoozesLeft === 1 ? 'נשארה אחת' : 'נשארו ' + R.snoozesLeft) + ')</button>';
    h += '<p class="ring-foot">' + icon('lock', 'xs') + (R.test ? 'צלצול ניסיון. גם הוא נכבה רק אחרי המשימה.' : 'השעון ימשיך לצלצל עד שתסיים את המשימה') + '</p></div>';
    return h;
  }

  function taskScreen() {
    const t = R.tasks[R.idx], info = KM.TASK_INFO[t.type];
    const dots = R.tasks.map((x, i) => '<i class="' + (i < R.idx ? 'done' : i === R.idx ? 'cur' : '') + '"></i>').join('');
    return '<div class="ring-screen task">' +
      '<div class="task-top"><span class="ltr">' + KM.time(Date.now()) + '</span>' + (R.tasks.length > 1 ? '<span class="task-dots" aria-label="משימה ' + (R.idx + 1) + ' מתוך ' + R.tasks.length + '">' + dots + '</span>' : '') + '</div>' +
      '<div class="task-head"><span class="task-ic">' + icon(info.icon) + '</span><h1>' + esc(info.name) + '</h1></div>' +
      (R.note ? '<div class="ring-note">' + icon('info', 'xs') + esc(R.note) + '</div>' : '') +
      '<div class="task-body">' + KM.TASKS[t.type].render(R.ts) + '</div>' +
      '<p class="ring-foot">' + icon('lock', 'xs') + 'השעון ימשיך לצלצל עד שתסיים</p></div>';
  }

  function doneScreen() {
    const mins = R.doneAt ? Math.max(0, Math.round((R.doneAt - R.t0) / 60e3)) : 0;
    let h = '<div class="ring-screen done">' + sky() + '<div class="done-badge">' + icon('check', 'lg') + '</div>' +
      '<h1 class="done-h">קמת! בוקר טוב</h1>' +
      '<p class="done-sub">' + (mins < 1 ? 'קמת תוך פחות מדקה' : 'קמת תוך ' + KM.minutesText(mins)) + (R.snoozes ? ' (עם ' + (R.snoozes === 1 ? 'דחייה אחת' : R.snoozes + ' דחיות') + ')' : '') + '</p>' +
      '<div class="ring-card modeh"><span class="rc-k">מודה אני</span><p>' + esc(KM.MODEH) + '</p></div>';
    if (R.checkAt) h += '<p class="done-check">' + icon('shield', 'sm') + 'בעוד ' + KM.minutesText(Math.max(1, Math.round((R.checkAt - Date.now()) / 60e3))) + ' נבדוק שאתה עדיין ער. אל תחזור למיטה!</p>';
    h += '<button type="button" class="btn ring-btn" data-action="ring-close">יום טוב</button></div>';
    return h;
  }

  V.checkLeft = () => Math.max(0, Math.ceil((R.checkEndsAt - Date.now()) / 1000));
  function checkScreen() {
    const left = V.checkLeft(), C = 2 * Math.PI * 54;
    return '<div class="ring-screen check">' + sky() +
      '<h1 class="done-h">אתה עדיין ער?</h1>' +
      '<div class="move-ring check-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="track"/><circle cx="60" cy="60" r="54" class="fill" id="checkArc" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - left / KM.CHECK_SECONDS)).toFixed(1) + '"/></svg>' +
      '<div class="move-in"><b id="checkLeft">' + left + '</b><span>שניות</span></div></div>' +
      '<button type="button" class="btn ring-btn big" data-action="check-confirm" autofocus>' + icon('sun') + 'כן, אני ער!</button>' +
      '<p class="ring-foot">אם לא תלחץ עד שהזמן נגמר, השעון יחזור לצלצל עם המשימה</p></div>';
  }

  function awakeScreen() {
    return '<div class="ring-screen done">' + sky() + '<div class="done-badge">' + icon('sun', 'lg') + '</div>' +
      '<h1 class="done-h">מעולה, אתה ער!</h1><p class="done-sub">שיהיה יום מצוין</p>' +
      '<button type="button" class="btn ring-btn" data-action="ring-close">סגירה</button></div>';
  }

  V.ring = () => {
    if (R.mode === 'task') return taskScreen();
    if (R.mode === 'done') return doneScreen();
    if (R.mode === 'check') return checkScreen();
    if (R.mode === 'awake') return awakeScreen();
    return ringScreen();
  };

  // Called every second while something on the ring screen counts (clock, check countdown).
  V.ringTick = () => {
    if (R.mode === 'check') {
      const left = V.checkLeft(), C = 2 * Math.PI * 54, n = KM.$('#checkLeft'), arc = KM.$('#checkArc');
      if (n) n.textContent = String(left);
      if (arc) arc.setAttribute('stroke-dashoffset', (C * (1 - left / KM.CHECK_SECONDS)).toFixed(1));
    } else if (R.mode === 'ring') {
      const el = KM.$('#ringNow'); if (el) el.textContent = KM.time(Date.now());
    }
  };
})();
