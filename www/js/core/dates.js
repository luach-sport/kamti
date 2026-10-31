/* Times and days in Hebrew, and when an alarm rings next (the same rule as the Android side, AlarmMath.java). */
(function () {
  'use strict';
  const KM = window.KM;

  const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  KM.DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  KM.DAY_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const p2 = (n) => String(n).padStart(2, '0');
  KM.p2 = p2;
  KM.hm = (h, m) => p2(h) + ':' + p2(m);
  KM.time = (ts) => { const d = new Date(ts); return KM.hm(d.getHours(), d.getMinutes()); };
  KM.dayStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  KM.dateFull = (ts) => { const d = new Date(ts); return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear(); };
  KM.dayName = (ts) => { const d = new Date(ts).getDay(); return d === 6 ? 'שבת' : 'יום ' + KM.DAY_NAMES[d]; };
  KM.dayLabel = (ts) => {
    const t = KM.dayStart(ts), today = KM.dayStart(Date.now());
    if (t === today) return 'היום';
    if (t === today - 864e5) return 'אתמול';
    if (t === today + 864e5) return 'מחר';
    const d = new Date(ts);
    return KM.dayName(ts) + ', ' + d.getDate() + ' ב' + MONTHS[d.getMonth()];
  };

  // Next time this alarm rings after `from` (ms), or 0. days: 0 = Sunday … 6 = Saturday; empty = once.
  KM.nextRing = (a, from) => {
    from = from || Date.now();
    if (!a) return 0;
    const days = Array.isArray(a.days) ? a.days : [];
    const base = new Date(from);
    base.setHours(0, 0, 0, 0);
    for (let d = 0; d <= 15; d++) {
      const c = new Date(base.getTime());
      c.setDate(base.getDate() + d);
      c.setHours(a.h, a.m, 0, 0);
      const t = c.getTime();
      if (t <= from) continue;
      if (a.skipUntil && t <= a.skipUntil) continue;
      if (days.length && days.indexOf(c.getDay()) < 0) continue;
      return t;
    }
    return 0;
  };

  // "כל יום", "א׳–ה׳", "א׳–ו׳", "ב׳, ד׳, ו׳", "פעם אחת".
  KM.daysText = (days) => {
    const d = (days || []).slice().sort((x, y) => x - y);
    if (!d.length) return 'פעם אחת';
    if (d.length === 7) return 'כל יום';
    const key = d.join('');
    if (key === '012345') return 'א׳–ו׳';
    if (key === '01234') return 'א׳–ה׳';
    if (key === '06') return 'סופ״ש';
    return d.map((x) => KM.DAY_SHORT[x]).join(', ');
  };

  const hours = (h) => (h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : h + ' שעות');
  const mins = (m) => (m === 1 ? 'דקה' : m + ' דקות');
  // "בעוד 7 שעות ו-12 דקות" / "מחר ב-06:30" / "ביום שלישי ב-06:30"
  KM.untilText = (t, now) => {
    now = now || Date.now();
    const diff = t - now;
    if (diff <= 0) return 'עכשיו';
    const total = Math.ceil(diff / 60e3);
    if (total < 1) return 'בעוד פחות מדקה';
    if (diff >= 20 * 3600e3) {
      const label = KM.dayLabel(t);
      return (label === 'מחר' ? 'מחר' : label === 'היום' ? 'היום' : 'ב' + KM.dayName(t)) + ' ב-' + KM.time(t);
    }
    const h = Math.floor(total / 60), m = total % 60;
    if (!h) return 'בעוד ' + mins(m);
    if (!m) return 'בעוד ' + hours(h);
    return 'בעוד ' + hours(h) + (m === 1 ? ' ודקה' : ' ו-' + mins(m));
  };
  KM.minutesText = mins;
  KM.secondsText = (s) => (s < 60 ? s + ' שניות' : Math.round(s / 60) === 1 ? 'דקה' : Math.round(s / 60) + ' דקות');
})();
