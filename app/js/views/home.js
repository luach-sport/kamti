/* Alarms tab: the next alarm, a warning when a permission is missing, and the list of alarms. */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc, icon } = KM;
  const V = KM.views;

  function nextCard() {
    const n = KM.nextAlarm();
    if (!n) {
      return '<section class="next-card off"><span class="next-k">אין שעון פעיל</span><p class="next-sub">' +
        (KM.state.alarms.length ? 'כל השעונים כבויים. מדליקים בלחיצה על המתג.' : 'מוסיפים שעון, בוחרים משימה, והולכים לישון בשקט.') + '</p></section>';
    }
    return '<section class="next-card" aria-label="השעון הבא">' +
      '<span class="next-k">' + icon('alarm', 'sm') + 'השעון הבא</span>' +
      '<b class="next-time ltr">' + KM.time(n.at) + '</b>' +
      '<span class="next-sub">' + esc(KM.untilText(n.at)) + (n.alarm.label ? ' · ' + esc(n.alarm.label) : '') + '</span>' +
      '<span class="next-tasks">' + n.alarm.tasks.map((t) => '<span class="nt">' + icon(KM.TASK_INFO[t.type].icon, 'xs') + esc(KM.taskName(t)) + '</span>').join('') + '</span>' +
      '</section>';
  }

  function permBanner() {
    const miss = KM.permMissing(true);
    if (!miss.length) return '';
    return '<button type="button" class="banner warn" data-action="open-setup"><span class="ic">' + icon('alert') + '</span>' +
      '<span class="txt"><span class="t">' + (miss.length === 1 ? 'חסר אישור אחד' : 'חסרים ' + miss.length + ' אישורים') + ' כדי שהשעון יצלצל</span>' +
      '<span class="s">' + esc(miss.map((m) => m.name).join(', ')) + '</span></span><span class="go">לאשר</span></button>';
  }

  function dayDots(a) {
    return '<span class="day-dots" aria-hidden="true">' + KM.DAY_SHORT.map((d, i) => '<i' + (a.days.indexOf(i) >= 0 ? ' class="on"' : '') + '>' + d.replace('׳', '') + '</i>').join('') + '</span>';
  }

  function card(a) {
    const next = a.on ? KM.nextRing(a) : 0;
    const sub = a.on ? (a.skipUntil ? 'מדלג על הפעם הבאה · ' : '') + KM.untilText(next) : 'כבוי';
    return '<article class="alarm-card' + (a.on ? '' : ' off') + '">' +
      '<button type="button" class="alarm-main" data-action="edit-alarm" data-id="' + esc(a.id) + '" aria-label="עריכת השעון ' + KM.hm(a.h, a.m) + '">' +
      '<span class="alarm-time ltr">' + KM.hm(a.h, a.m) + '</span>' +
      '<span class="alarm-meta">' + (a.days.length ? dayDots(a) : '<span class="once">פעם אחת</span>') + (a.label ? '<span class="lbl">' + esc(a.label) + '</span>' : '') + '</span>' +
      '<span class="alarm-sub">' + a.tasks.map((t) => icon(KM.TASK_INFO[t.type].icon, 'xs')).join('') + '<span>' + esc(sub) + '</span></span>' +
      '</button>' +
      '<button type="button" class="switch-hit" role="switch" aria-checked="' + a.on + '" data-action="toggle-alarm" data-id="' + esc(a.id) + '" aria-label="הפעלת השעון ' + KM.hm(a.h, a.m) + '"><span class="switch"></span></button>' +
      '</article>';
  }

  V.home = () => {
    let h = '<header class="top"><div class="brand">' + KM.logo(34) + '<h1 class="h1">קמתי</h1></div>' +
      '<span class="top-date">' + esc(KM.dayName(Date.now())) + ' · ' + KM.time(Date.now()) + '</span></header>';
    h += permBanner();
    h += nextCard();
    const list = KM.sortedAlarms();
    if (!list.length) {
      h += '<div class="empty">' + KM.views.sunArt() + '<h2>עוד אין שעונים</h2><p>שעון של קמתי לא נכבה בלחיצה: צריך לפתור תרגיל, ללכת כמה צעדים או לנער את הטלפון. ככה באמת קמים.</p>' +
        '<button type="button" class="btn" data-action="new-alarm">' + icon('plus') + 'שעון ראשון</button></div>';
      return h;
    }
    h += '<div class="sec-head"><h2>השעונים</h2><span>' + (list.length === 1 ? 'שעון אחד' : list.length + ' שעונים') + '</span></div>';
    h += '<div class="alarm-list">' + list.map(card).join('') + '</div>';
    return h;
  };

  V.fab = () => '<button type="button" class="fab" data-action="new-alarm" aria-label="שעון חדש">' + icon('plus') + '<span>שעון חדש</span></button>';

  // A small sunrise drawing for empty screens.
  V.sunArt = () => '<svg class="sun-art" viewBox="0 0 160 100" aria-hidden="true"><path d="M44 74a36 36 0 0 1 72 0Z" fill="#FFC93C"/>' +
    '<path d="M80 26V14M113 41l8-8M47 41l-8-8M125 60l11-4M35 60l-11-4" stroke="#FFC93C" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M18 84h124" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M46 96h68" stroke="currentColor" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/></svg>';
})();
