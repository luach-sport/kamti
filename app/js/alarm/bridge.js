/* Talking to the Android side of the alarm (KamtiAlarmPlugin.java): scheduling, ringing, permissions, sounds.
   In a browser (the site's screenshots, tests) a small stand-in keeps the same answers in memory. */
(function () {
  'use strict';
  const KM = window.KM;
  const NAME = 'KamtiAlarm';

  // Browser stand-in. Scenes and tests change it directly (KM.AL.sim).
  const sim = {
    state: { mode: 'idle' },
    device: { camera: true, accel: true, sdk: 34, model: 'דפדפן' },
    perms: { notifications: true, exact: true, fullScreen: true, overlay: true, battery: true },
    calls: []
  };
  const listeners = [];
  const emit = (st) => listeners.forEach((cb) => { try { cb(st); } catch (e) { console.warn(e); } });

  async function call(method, args) {
    if (KM.isNative()) return KM.callRaw(NAME, method, args);
    sim.calls.push([method, args]);
    const s = sim.state;
    switch (method) {
      case 'getState': return Object.assign({ firedOnce: [] }, s);
      case 'device': return sim.device;
      case 'permissions': return sim.perms;
      case 'dismiss': {
        const check = s.alarm && s.mode === 'ring' && !s.test ? +s.alarm.check || 0 : 0;
        sim.state = check ? { mode: 'idle', checkAt: Date.now() + check * 60e3 } : { mode: 'idle' };
        return sim.state;
      }
      case 'snooze': sim.state = { mode: 'snooze', until: Date.now() + ((s.alarm && s.alarm.snoozeMin) || 5) * 60e3, alarmId: s.alarmId, alarm: s.alarm, snoozesLeft: (s.snoozesLeft || 1) - 1 }; return sim.state;
      case 'confirmAwake': sim.state = { mode: 'idle' }; return sim.state;
      case 'test': return { at: Date.now() + (args.delay || 5) * 1000 };
      case 'sync': return { next: 0 };
      case 'pickSound': return { cancelled: true };
      default: return {};
    }
  }

  KM.AL = {
    sim,
    on: (cb) => listeners.push(cb),
    emit,
    // Browser only: pretend Android says this (ringing, checking…), as the scenes and tests need.
    simSet: (st) => { sim.state = Object.assign({ firedOnce: [] }, st); emit(sim.state); },
    state: () => call('getState').catch(() => ({ mode: 'idle' })),
    sync: (alarms) => call('sync', { alarms }),
    dismiss: () => call('dismiss'),
    snooze: () => call('snooze'),
    confirmAwake: () => call('confirmAwake'),
    test: (alarm, delay) => call('test', { alarm, delay: delay || 5 }),
    device: () => call('device').catch(() => null),
    permissions: () => call('permissions').catch(() => null),
    request: (what) => call('request', { what }).catch((e) => { console.warn('request', what, e && e.message); return null; }),
    preview: (sound) => call('preview', { sound }).catch(() => null),
    stopPreview: () => call('stopPreview').catch(() => null),
    pickSound: () => call('pickSound')
  };

  // The native side tells us when the alarm starts, stops, snoozes or checks on you.
  KM.listenAlarm = () => { if (KM.isNative()) KM.listen(NAME, 'ringState', emit); };
})();
