/* Moving around: tabs, back, sheets, links, the setup page, theme, updates and sharing the app. */
(function () {
  'use strict';
  const KM = window.KM;
  const A = KM.A;
  const ui = KM.ui;

  A.tab = (el) => { ui.tab = el.dataset.tab; ui.stack = []; KM.closeSheet(); KM.render('restore'); };
  A.back = () => KM.onBack();
  A['open-sheet'] = (el) => KM.openSheet(el.dataset.sheet, Object.assign({}, el.dataset));
  A['close-sheet'] = () => KM.closeSheet();
  A['open-url'] = (el) => KM.openExternal(el.dataset.url);

  // Android's back button: close a sheet, leave a page, go to the first tab, then leave the app.
  // While the alarm rings, Android itself swallows the button, so nothing here can stop it.
  KM.onBack = () => {
    if (KM.ringing()) return;
    if (ui.sheet) { KM.closeSheet(); return; }
    const v = KM.view();
    if (v && v.name === 'edit') { A['edit-cancel'](); return; }
    if (v && v.name === 'setup' && !KM.state.setupDone) { KM.call('App', 'minimizeApp'); return; }
    if (v) { KM.popView(); return; }
    if (ui.tab !== 'home') { ui.tab = 'home'; KM.render('restore'); return; }
    KM.call('App', 'minimizeApp');
  };

  // ---------- Setup & permissions ----------
  A['open-setup'] = async () => { await KM.loadDevice(); KM.pushView({ name: 'setup' }); };
  A['perm-ask'] = async (el) => {
    KM.ui.permAsked = el.dataset.k;
    await KM.AL.request(el.dataset.k);
    // Most permissions open a phone settings screen; the answer is read again when we come back (start.js).
    setTimeout(async () => { await KM.loadDevice(); if (KM.view() && KM.view().name === 'setup') KM.render(true); }, 1200);
  };
  A['setup-done'] = () => {
    const first = !KM.state.setupDone;
    KM.state.setupDone = true; KM.save();
    ui.stack = [];
    if (first && !KM.state.alarms.length) { A['new-alarm'](); return; }
    KM.render();
  };

  // ---------- Look ----------
  A['set-theme'] = (el) => { KM.state.settings.theme = el.dataset.v; KM.save(); KM.applyTheme(); KM.render(true); };

  // ---------- Updates ----------
  A['check-update'] = async () => {
    const info = await KM.update.check(true);
    if (info) KM.openSheet('update');
    else KM.toast(KM.update.error || 'יש לך את הגרסה האחרונה');
  };
  A['update-now'] = () => KM.update.apply();
  A['update-later'] = () => { const i = KM.update.info; if (i) { KM.state.updateSeen = i.build; KM.save(); } KM.closeSheet(); };

  // ---------- Share the app ----------
  A['share-app-link'] = () => KM.shareApp.link();
  A['share-app-apk'] = () => KM.shareApp.apk();
  A['share-app-copy'] = async () => { const ok = await KM.writeClipboard(KM.SITE_URL); KM.toast(ok ? 'הקישור הועתק' : 'לא הצלחתי להעתיק'); };

  // ---------- A quick test ring from Settings ----------
  A['test-quick'] = async () => {
    const a = KM.newAlarm();
    a.id = 'test'; a.label = 'צלצול ניסיון'; a.tasks = [{ type: 'math', level: 1, count: 1 }]; a.check = 0;
    await KM.testAlarm(a);
  };
})();
