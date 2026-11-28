/* Settings tab: look, permissions, a test ring, feedback, updates, sharing and the credit. */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc, icon } = KM;
  const V = KM.views;

  const navRow = (action, ic, label, sub, value, extra) => '<button type="button" class="row" data-action="' + action + '"' + (extra || '') + '>' + (ic ? '<span class="lead' + (ic === 'alert' ? ' warn' : '') + '">' + icon(ic) + '</span>' : '') +
    '<span class="grow"><span class="t">' + esc(label) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</span>' + (value ? '<span class="v">' + esc(value) + '</span>' : '') + '<span class="chev">' + icon('chevL', 'sm') + '</span></button>';

  V.settings = () => {
    const st = KM.state.settings, dev = KM.ui.device;
    const themes = [{ v: 'light', l: 'בהיר' }, { v: 'dark', l: 'כהה' }, { v: 'system', l: 'לפי הטלפון' }];
    const miss = KM.permMissing(false), must = KM.permMissing(true);
    let h = '<header class="top"><h1 class="h1">הגדרות</h1></header>';
    h += '<span class="section-label">מראה</span><div class="seg" role="group" aria-label="מראה">' + themes.map((t) => '<button type="button" data-action="set-theme" data-v="' + t.v + '" aria-pressed="' + (st.theme === t.v) + '">' + t.l + '</button>').join('') + '</div>';
    h += '<span class="section-label">שהשעון יעבוד תמיד</span><div class="card list">' +
      navRow('open-setup', must.length ? 'alert' : 'shield', 'אישורים מהטלפון', must.length ? 'חסר: ' + must.map((m) => m.name).join(', ') : miss.length ? 'הכל עובד. אפשר לאשר עוד ' + miss.length + ' לחיזוק' : 'הכל מאושר') +
      navRow('test-quick', 'play', 'צלצול לניסיון', 'יצלצל בעוד 5 שניות עם תרגיל קל אחד') +
      '</div>';
    h += '<p class="fine dev-line">' + icon('phone', 'xs') + 'במכשיר הזה: ' + (dev.camera ? 'יש מצלמה' : 'אין מצלמה') + ' · ' + (dev.motion ? 'יש חיישן תנועה' : 'אין חיישן תנועה') + (dev.model ? ' · ' + esc(dev.model) : '') + '</p>';
    h += '<span class="section-label">כללי</span><div class="card list">' +
      navRow('open-sheet', 'message', 'פנייה / הצעת ייעול', 'מה להוסיף? מה לשפר? הפנייה מגיעה ישירות למפתח', '', ' data-sheet="feedback"') +
      V.updateRow() +
      navRow('open-sheet', 'share', 'שיתוף האפליקציה', 'קישור לאתר, או הקובץ עצמו בבלוטות\' ובוואטסאפ', '', ' data-sheet="shareApp"') +
      navRow('open-url', 'book', 'אתר ההסבר', 'כל המסכים והכפתורים, עם צילומים', '', ' data-url="' + esc(KM.SITE_URL) + '"') +
      '</div>';
    h += '<div class="credit">' + KM.logo(44) + '<span class="n">קמתי · גרסה ' + esc(KM.VERSION.version) + (KM.VERSION.build && KM.VERSION.build !== 'dev' ? ' (בנייה ' + esc(KM.VERSION.build) + ')' : '') + '</span><span class="by">פותח על ידי <b>Itzko</b></span></div>';
    return h;
  };

  V.updateRow = () => {
    const U = KM.update;
    if (!KM.canSelfUpdate()) return '';
    if (U.info) return navRow('open-sheet', 'sparkle', 'יש גרסה חדשה: ' + U.info.version + ' (בנייה ' + U.info.build + ')', 'לחיצה לעדכון', '', ' data-sheet="update"');
    return navRow('check-update', 'refresh', U.state === 'checking' ? 'בודק…' : 'בדיקת עדכונים', 'אצלך גרסה ' + KM.VERSION.version + ' (בנייה ' + KM.VERSION.build + ')');
  };
})();
