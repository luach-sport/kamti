/* The alarms list: new alarm, edit, on/off, and the test ring. */
(function () {
  'use strict';
  const KM = window.KM;
  const A = KM.A;
  const ui = KM.ui;

  KM.openEditor = (alarm, isNew) => {
    ui.draft = KM.copy(alarm);
    ui.draftNew = !!isNew;
    KM.closeSheet();
    KM.pushView({ name: 'edit', id: alarm.id });
  };

  A['new-alarm'] = () => KM.openEditor(KM.newAlarm(), true);
  A['edit-alarm'] = (el) => { const a = KM.alarmById(el.dataset.id); if (a) KM.openEditor(a, false); };

  A['toggle-alarm'] = async (el) => {
    const a = KM.alarmById(el.dataset.id);
    if (!a) return;
    a.on = !a.on;
    if (a.on) a.skipUntil = 0;
    KM.save();
    KM.render(true);
    await KM.syncAlarms();
    if (a.on) KM.toast('יצלצל ' + KM.untilText(KM.nextRing(a)));
  };

  // Rings this alarm (as it is now) in 5 seconds, with all its tasks. A real ring: only the tasks stop it.
  KM.testAlarm = async (a) => {
    try {
      const payload = KM.alarmPayload(Object.assign({}, a, { check: 0 }));
      await KM.AL.test(payload, 5);
      KM.ui.testAlarm = KM.copy(a);
      KM.toast('השעון יצלצל בעוד 5 שניות', 4000);
      if (!KM.isNative()) setTimeout(() => KM.AL.simSet({ mode: 'ring', alarmId: a.id === 'test' ? '' : a.id, alarm: payload, startedAt: Date.now(), test: true, snoozesLeft: a.snooze }), 5000);
    } catch (e) {
      KM.toast('לא הצלחתי להפעיל צלצול ניסיון');
    }
  };
})();
