/* Mornings tab: how long it took to get up, snoozes, and the awake checks. */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc, icon } = KM;
  const V = KM.views;

  const stat = (n, label, ic) => '<div class="stat"><span class="stat-ic">' + icon(ic, 'sm') + '</span><b>' + n + '</b><span>' + label + '</span></div>';

  function row(l) {
    const mins = KM.logMinutes(l);
    const badges = [];
    if (l.snoozes) badges.push('<span class="badge amber">' + icon('repeat', 'xs') + (l.snoozes === 1 ? 'דחייה' : l.snoozes + ' דחיות') + '</span>');
    if (l.check === 'ok') badges.push('<span class="badge green">' + icon('shield', 'xs') + 'עבר בדיקה</span>');
    if (l.check === 'missed') badges.push('<span class="badge red">' + icon('alert', 'xs') + 'נרדם שוב</span>');
    return '<div class="row log-row"><span class="log-day"><b>' + esc(KM.dayLabel(l.rangAt)) + '</b><span>צלצל ' + KM.time(l.rangAt) + ' · קמת ' + KM.time(l.doneAt) + (l.label ? ' · ' + esc(l.label) : '') + '</span>' +
      (badges.length ? '<span class="badges">' + badges.join('') + '</span>' : '') + '</span>' +
      '<span class="log-min' + (mins <= 2 ? ' fast' : mins >= 10 ? ' slow' : '') + '"><b>' + (mins < 1 ? '‎<1' : mins) + '</b><small>דק׳</small></span></div>';
  }

  V.log = () => {
    let h = '<header class="top"><h1 class="h1">הבקרים שלי</h1></header>';
    const log = KM.state.log.slice().reverse();
    if (!log.length) {
      return h + '<div class="empty">' + V.sunArt() + '<h2>עוד אין בקרים ביומן</h2><p>אחרי הבוקר הראשון עם קמתי יופיע כאן כמה זמן לקח לך לקום, כמה פעמים דחית, ואם עברת את בדיקת הערנות.</p></div>';
    }
    const s = KM.logStats();
    h += '<div class="stats">' + stat(s.week, 'בקרים השבוע', 'calendar') + stat(s.avg < 1 ? '‎<1' : s.avg, 'דקות בממוצע לקום', 'clock') +
      stat(s.checks ? s.checksOk + '/' + s.checks : '–', 'בדיקות ערנות', 'shield') + '</div>';
    h += '<div class="card list">' + log.slice(0, 30).map(row).join('') + '</div>';
    h += '<p class="fine" style="text-align:center">הזמן נמדד מהצלצול הראשון ועד שסיימת את המשימות. היומן נשמר רק בטלפון.</p>';
    return h;
  };
})();
