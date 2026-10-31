/* The app's data (KM.state) and what is on screen (KM.ui), with small lookups used everywhere. */
(function () {
  'use strict';
  const KM = window.KM;

  KM.save = (now) => KM.saveState(KM.state, now);
  KM.alarmById = (id) => KM.state.alarms.find((a) => a.id === id) || null;
  KM.sortedAlarms = () => KM.state.alarms.slice().sort((a, b) => (a.h * 60 + a.m) - (b.h * 60 + b.m));

  // The alarm that rings first from now: { alarm, at } or null.
  KM.nextAlarm = (now) => {
    let best = null;
    KM.state.alarms.forEach((a) => {
      if (!a.on) return;
      const at = KM.nextRing(a, now);
      if (at && (!best || at < best.at)) best = { alarm: a, at };
    });
    return best;
  };

  KM.ui = {
    tab: 'home', stack: [], scroll: {}, sheet: null, form: {}, draft: null,
    device: { camera: false, motion: true, sdk: 0 }, perms: null
  };
  KM.view = () => KM.ui.stack[KM.ui.stack.length - 1] || null;
})();
