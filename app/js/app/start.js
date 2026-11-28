/* Start-up: load the data, ask Android what's going on (ringing? checking?), draw the first screen, and keep
   listening: the alarm, coming back to the app, the back button, internet, new versions. */
(function () {
  'use strict';
  const KM = window.KM;
  const ui = KM.ui;

  async function readAlarmState() {
    const st = await KM.AL.state();
    if (KM.applyFired(st)) await KM.syncAlarms();
    KM.onAlarmState(st);
  }

  async function autoUpdateCheck() {
    if (KM.ringing()) return;
    const info = await KM.update.check(false);
    if (info && info.build > (KM.state.updateSeen || 0) && !ui.sheet && !KM.view() && !KM.ringing()) KM.openSheet('update');
  }
  function background() { KM.flushOutbox(); autoUpdateCheck(); }

  function listenToPhone() {
    KM.listenAlarm();
    KM.AL.on((st) => {
      if (KM.applyFired(st)) { KM.syncAlarms(); if (!KM.ringing()) KM.render(true); }
      KM.onAlarmState(st);
    });
    if (!KM.isNative()) return;
    KM.listen('App', 'backButton', KM.onBack);
    KM.listen('App', 'appStateChange', async (st) => {
      if (!(st && st.isActive)) { KM.flushSave(); return; }
      await readAlarmState();
      await KM.loadDevice();
      if (!KM.ringing() && !ui.sheet) KM.render(true);
      background();
    });
  }

  // Once a second: the ringing clock and the check countdown. Every 30 seconds: the "in 7 hours" lines.
  // While ringing, Android is asked again every few seconds, in case an event was missed.
  let ticks = 0;
  function tick() {
    ticks++;
    if (KM.ringing()) { KM.views.ringTick(); if (ticks % 4 === 0) KM.AL.state().then(KM.onAlarmState); return; }
    if (ticks % 30 === 0 && !ui.sheet && !KM.view() && ui.tab === 'home') KM.render(true);
  }

  async function init() {
    KM.bindEvents();
    await KM.initNetwork();
    KM.state = KM.normalize(await KM.loadState());
    KM.applyTheme();
    KM.watchSystemTheme();
    await KM.loadDevice();
    if (!KM.state.setupDone) ui.stack = [{ name: 'setup' }];
    KM.render();
    listenToPhone();
    await readAlarmState();
    await KM.syncAlarms();
    KM.onUpdate(() => {
      if (KM.sheetIs('update')) KM.renderSheet();
      else if (!ui.sheet && ui.tab === 'settings' && !KM.view() && !KM.ringing()) KM.render(true);
    });
    KM.onNetwork((on) => { if (KM.sheetIs('feedback')) KM.renderSheet(); if (on) background(); });
    setInterval(tick, 1000);
    background();
  }

  // Small test surface for automated checks and the site's screenshots.
  window.__kamti = {
    get ui() { return ui; }, get ring() { return KM.ring; }, A: KM.A, KM,
    render: KM.render, openSheet: KM.openSheet, closeSheet: KM.closeSheet, normalize: KM.normalize
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
