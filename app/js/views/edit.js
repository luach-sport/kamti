/* Alarm editor (a page over the tabs): time, days, name, the tasks, sound and the strict settings. Works on KM.ui.draft. */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc, icon } = KM;
  const V = KM.views;
  const ui = KM.ui;

  const col = (k, v) => '<div class="tp-col">' +
    '<button type="button" class="tp-arrow" data-action="tp" data-k="' + k + '" data-d="1" aria-label="' + (k === 'h' ? 'שעה אחת יותר' : 'דקה אחת יותר') + '">' + icon('up', 'lg') + '</button>' +
    '<button type="button" class="tp-num" data-action="open-sheet" data-sheet="pickTime" data-k="' + k + '" aria-label="' + (k === 'h' ? 'בחירת שעה' : 'בחירת דקות') + '">' + KM.p2(v) + '</button>' +
    '<button type="button" class="tp-arrow" data-action="tp" data-k="' + k + '" data-d="-1" aria-label="' + (k === 'h' ? 'שעה אחת פחות' : 'דקה אחת פחות') + '">' + icon('down', 'lg') + '</button></div>';

  V.timePicker = (d) => '<div class="time-picker ltr">' + col('h', d.h) + '<span class="tp-colon">:</span>' + col('m', d.m) + '</div>' +
    '<p class="tp-until" id="tpUntil">' + esc(V.untilLine(d)) + '</p>';
  V.untilLine = (d) => { const t = KM.nextRing(Object.assign({}, d, { skipUntil: 0 })); return t ? 'יצלצל ' + KM.untilText(t) : ''; };

  function days(d) {
    const presets = [{ k: '012345', l: 'א׳–ו׳' }, { k: '0123456', l: 'כל יום' }, { k: '', l: 'פעם אחת' }];
    const cur = d.days.slice().sort().join('');
    return '<div class="days-row" role="group" aria-label="ימים">' + KM.DAY_SHORT.map((x, i) =>
      '<button type="button" class="day" data-action="day" data-d="' + i + '" aria-pressed="' + (d.days.indexOf(i) >= 0) + '" aria-label="יום ' + KM.DAY_NAMES[i] + '">' + x.replace('׳', '') + '</button>').join('') + '</div>' +
      '<div class="chips">' + presets.map((p) => '<button type="button" class="chip sm' + (cur === p.k ? ' on' : '') + '" data-action="days-preset" data-k="' + p.k + '">' + p.l + '</button>').join('') +
      '<span class="days-txt">' + esc(KM.daysText(d.days)) + '</span></div>';
  }

  function taskRows(d) {
    let h = d.tasks.map((t, i) => {
      const info = KM.TASK_INFO[t.type], blocked = KM.taskBlocked(t.type);
      const sub = blocked ? blocked + ' – יוחלף בתרגילים' : KM.taskSummary(t);
      return '<div class="row task-row"><span class="num">' + (i + 1) + '</span>' +
        '<button type="button" class="grow plain" data-action="task-edit" data-i="' + i + '"><span class="t">' + icon(info.icon, 'sm') + esc(info.name) + '</span><span class="s' + (blocked || (t.type === 'photo' && !t.ref) ? ' warn' : '') + '">' + esc(sub) + '</span></button>' +
        (d.tasks.length > 1 ? '<button type="button" class="icon-btn" data-action="task-remove" data-i="' + i + '" aria-label="הסרת המשימה">' + icon('close', 'sm') + '</button>' : '') + '</div>';
    }).join('');
    if (d.tasks.length < 3) h += '<button type="button" class="row add-row" data-action="open-sheet" data-sheet="taskPick"><span class="lead accent">' + icon('plus') + '</span><span class="grow"><span class="t">הוספת משימה</span><span class="s">אפשר עד 3 משימות, אחת אחרי השנייה</span></span></button>';
    return h;
  }

  const navRow = (sheet, ic, label, value, sub) => '<button type="button" class="row" data-action="open-sheet" data-sheet="' + sheet + '"><span class="lead">' + icon(ic) + '</span>' +
    '<span class="grow"><span class="t">' + esc(label) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</span><span class="v">' + esc(value) + '</span><span class="chev">' + icon('chevL', 'sm') + '</span></button>';
  const swRow = (action, ic, label, sub, on) => '<div class="row"><span class="lead">' + icon(ic) + '</span><span class="grow"><span class="t">' + esc(label) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</span>' +
    '<button type="button" class="switch-hit" role="switch" aria-checked="' + !!on + '" data-action="' + action + '" aria-label="' + esc(label) + '"><span class="switch"></span></button></div>';

  V.snoozeText = (d) => (d.snooze ? (d.snooze === 1 ? 'פעם אחת' : d.snooze + ' פעמים') + ', ' + d.snoozeMin + ' דק׳' : 'בלי');
  V.checkText = (d) => (d.check ? 'אחרי ' + d.check + ' דק׳' : 'כבויה');

  V.edit = () => {
    const d = ui.draft;
    let h = '<div class="bar-top"><button type="button" class="icon-btn" data-action="edit-cancel" aria-label="חזרה">' + icon('back') + '</button>' +
      '<h1 class="grow">' + (ui.draftNew ? 'שעון חדש' : 'עריכת שעון') + '</h1><button type="button" class="text-btn" data-action="edit-save">שמירה</button></div>';
    h += V.timePicker(d);
    h += '<span class="section-label">ימים</span>' + days(d);
    h += '<div class="field"><label for="alabel">שם השעון (לא חובה)</label><input id="alabel" class="input" data-draft="label" maxlength="40" value="' + esc(d.label) + '" placeholder="למשל: תפילת שחרית"></div>';
    h += '<span class="section-label">משימות לכיבוי</span><div class="card list">' + taskRows(d) + '</div>';
    h += '<span class="section-label">צלצול</span><div class="card list">' +
      navRow('sound', 'music', 'צליל', KM.soundName(d.sound)) +
      swRow('toggle-vibrate', 'vibrate', 'רטט', '', d.vibrate) +
      navRow('snooze', 'repeat', 'דחייה (נודניק)', V.snoozeText(d), d.snooze ? 'אחרי הדחייה המשימה עדיין מחכה' : 'השעון לא נדחה. רק המשימה מכבה') +
      navRow('check', 'shield', 'בדיקת ערנות', V.checkText(d), 'אחרי שקמת: "אתה ער?". לא ענית תוך דקה? השעון חוזר') +
      '</div>';
    if (!ui.draftNew && d.days.length && d.on) {
      const t = KM.nextRing(Object.assign({}, d, { skipUntil: 0 }));
      h += '<div class="card list">' + swRow('toggle-skip', 'skip', 'דילוג על הפעם הבאה', t ? KM.dayLabel(t) + ' ב-' + KM.time(t) + ' לא יצלצל' : '', !!d.skipUntil) + '</div>';
    }
    h += '<div class="notice gray">' + icon('lock', 'sm') + '<span class="grow">כשהשעון מצלצל אין כפתור עצירה, הווליום נעול על מקסימום, וכפתורי הווליום ו"חזור" לא עובדים. רק המשימה מכבה אותו.</span></div>';
    h += '<button type="button" class="btn secondary" data-action="edit-test">' + icon('play') + 'נסה עכשיו (יצלצל בעוד 5 שניות)</button>';
    h += '<button type="button" class="btn" data-action="edit-save">' + icon('check') + 'שמירה</button>';
    if (!ui.draftNew) h += '<button type="button" class="btn danger" data-action="edit-delete">' + icon('trash') + 'מחיקת השעון</button>';
    return h;
  };
})();
