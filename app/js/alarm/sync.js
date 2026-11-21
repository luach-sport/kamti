/* Keeps the Android alarm schedule the same as the alarms in the app, and reads what the phone can do. */
(function () {
  'use strict';
  const KM = window.KM;

  // What the Android side needs to ring an alarm on its own, even when the app is closed.
  KM.alarmPayload = (a) => ({
    id: a.id, on: !!a.on, h: a.h, m: a.m, days: a.days, skipUntil: a.skipUntil || 0, label: a.label,
    sound: a.sound, vibrate: a.vibrate, snooze: a.snooze, snoozeMin: a.snoozeMin, check: a.check,
    tasks: a.tasks.map((t) => t.type)
  });

  // One-time alarms that already rang (Android turned them off) are turned off here too. Returns true if any changed.
  KM.applyFired = (st) => {
    let changed = false;
    ((st && st.firedOnce) || []).forEach((id) => { const a = KM.alarmById(id); if (a && !a.days.length && a.on) { a.on = false; changed = true; } });
    if (changed) KM.save();
    return changed;
  };

  // Android keeps its own copy of the alarms (to ring with the app closed). Before replacing it, take in what
  // it changed itself (one-time alarms that rang), so they don't come back on.
  KM.syncAlarms = async () => {
    try {
      KM.applyFired(await KM.AL.state());
      return await KM.AL.sync(KM.state.alarms.map(KM.alarmPayload));
    } catch (e) { console.warn('sync', e && e.message); return null; }
  };

  // Camera, motion sensor and permissions of this phone or player.
  KM.loadDevice = async () => {
    const d = await KM.AL.device();
    if (d) KM.ui.device = { camera: !!d.camera, motion: d.accel !== false, sdk: +d.sdk || 0, model: d.model || '' };
    KM.ui.perms = await KM.AL.permissions();
  };

  // The permissions that matter, in order. null = not needed on this Android version.
  KM.PERMS = [
    { key: 'notifications', icon: 'bell', name: 'התראות', why: 'כדי שהשעון יופיע על המסך כשהוא מצלצל', must: true },
    { key: 'exact', icon: 'clock', name: 'שעונים מעוררים', why: 'כדי שהשעון יצלצל בדיוק בזמן, גם כשהטלפון ישן', must: true },
    { key: 'fullScreen', icon: 'phone', name: 'מסך מלא מעל הנעילה', why: 'כדי שהמשימה תופיע גם כשהטלפון נעול', must: true },
    { key: 'overlay', icon: 'layers', name: 'הצגה מעל אפליקציות אחרות', why: 'כדי שהשעון יחזור למסך אם יוצאים ממנו באמצע', must: false },
    { key: 'battery', icon: 'battery', name: 'בלי הגבלת סוללה', why: 'כדי שהטלפון לא ירדים את קמתי בלילה', must: false }
  ];
  KM.permMissing = (onlyMust) => {
    const p = KM.ui.perms;
    if (!p) return [];
    return KM.PERMS.filter((x) => p[x.key] === false && (!onlyMust || x.must));
  };
})();
