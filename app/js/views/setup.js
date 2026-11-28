/* Setup page: the permissions an alarm needs, one button each, and what this phone or player can do.
   Shown on first open, and from Settings or the home warning. */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc, icon } = KM;
  const V = KM.views;

  function permRow(p, val) {
    const ok = val === true;
    return '<div class="row perm-row"><span class="tile' + (ok ? ' ok' : p.must ? ' must' : '') + '">' + icon(ok ? 'check' : p.icon) + '</span>' +
      '<span class="grow"><span class="t">' + esc(p.name) + (p.must ? '' : ' <small class="opt">מומלץ</small>') + '</span><span class="s">' + esc(p.why) + '</span></span>' +
      (ok ? '<span class="perm-ok">מאושר</span>' : '<button type="button" class="btn small" data-action="perm-ask" data-k="' + p.key + '">אישור</button>') + '</div>';
  }

  V.setup = () => {
    const perms = KM.ui.perms || {}, dev = KM.ui.device, first = !KM.state.setupDone;
    let h = '<div class="bar-top">' + (first ? '' : '<button type="button" class="icon-btn" data-action="back" aria-label="חזרה">' + icon('back') + '</button>') +
      '<h1 class="grow">' + (first ? '' : 'אישורים מהטלפון') + '</h1></div>';
    if (first) h += '<div class="setup-hero">' + KM.logo(72) + '<h1>ברוכים הבאים לקמתי</h1><p>השעון המעורר שלא נכבה עד שקמים באמת. כמה אישורים מהטלפון, ואף בוקר לא מתפספס.</p></div>';
    else h += '<p class="fine" style="font-size:14px">כל אישור פותח מסך של הטלפון. מאשרים שם וחוזרים לכאן.</p>';
    const rows = KM.PERMS.filter((p) => perms[p.key] === true || perms[p.key] === false);
    h += rows.length ? '<div class="card list">' + rows.map((p) => permRow(p, perms[p.key])).join('') + '</div>'
      : '<div class="notice green">' + icon('check', 'sm') + '<span class="grow">אין צורך באישורים מיוחדים במכשיר הזה.</span></div>';
    h += '<div class="notice gray">' + icon('phone', 'sm') + '<span class="grow"><b>במכשיר הזה:</b> ' + (dev.camera ? 'יש מצלמה' : 'אין מצלמה, ולכן משימת הצילום לא תופיע') + ' · ' +
      (dev.motion ? 'יש חיישן תנועה' : 'אין חיישן תנועה, ולכן הליכה וניעור לא יופיעו') + '. בנגן או בטלפון כשר חלק ממסכי האישור אולי לא קיימים. מה שלא מופיע כאן לא נדרש.</span></div>';
    h += '<button type="button" class="btn" data-action="setup-done">' + (first ? icon('alarm') + 'ממשיכים ליצירת שעון' : icon('check') + 'סיום') + '</button>';
    if (first && KM.permMissing(true).length) h += '<p class="fine" style="text-align:center">אפשר לאשר גם אחר כך מההגדרות. עד אז השעון אולי לא יופיע בזמן.</p>';
    return h;
  };
})();
