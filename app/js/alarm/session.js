/* One morning: the alarm rings → the tasks one after another → "good morning" → (a few minutes later) "are you awake?".
   The Android side owns the sound and the lock; this file owns what is on screen and tells Android when you're done. */
(function () {
  'use strict';
  const KM = window.KM;
  const FALLBACK = { type: 'math', level: 2, count: 4 };

  const R = (KM.ring = { mode: 'idle' });
  KM.ringing = () => R.mode !== 'idle';

  // A task this phone can't do (no camera, no sensor, no photo saved) becomes sums, so you're never stuck.
  function usable(t) {
    if (KM.taskBlocked(t.type)) return Object.assign({}, FALLBACK, { why: KM.taskBlocked(t.type) });
    if (t.type === 'photo' && !(t.ref && t.ref.sig)) return Object.assign({}, FALLBACK, { why: 'לא נשמרה תמונה של המקום' });
    return t;
  }

  function alarmFor(st) {
    if (st.test && KM.ui.testAlarm) return KM.ui.testAlarm;
    const mine = st.alarmId && KM.alarmById(st.alarmId);
    if (mine) return mine;
    const snap = Object.assign({}, st.alarm || {});
    snap.tasks = (snap.tasks || []).map((x) => (typeof x === 'string' ? { type: x } : x));
    return KM.normalizeAlarm(snap) || KM.newAlarm();
  }

  function stopTask() {
    const t = R.tasks && R.tasks[R.idx], def = t && KM.TASKS[t.type];
    if (def && def.onHide && R.ts) { try { def.onHide(R.ts); } catch (e) { console.warn(e); } }
  }

  KM.ringBegin = (st) => {
    stopTask();
    const alarm = alarmFor(st);
    Object.assign(R, {
      mode: 'ring', key: st.startedAt || Date.now(), alarm, tasks: alarm.tasks.map(usable), idx: 0, ts: null,
      t0: st.ringAt || st.startedAt || Date.now(), snoozesLeft: +st.snoozesLeft || 0, snoozes: +st.snoozeCount || 0,
      test: !!st.test, round: +st.round || 0, note: '', checkAt: 0
    });
    if (R.round > 0) KM.logCheck(alarm.id, 'missed');
    KM.closeSheet();
    KM.render();
  };

  KM.taskStart = () => {
    const t = R.tasks[R.idx];
    R.mode = 'task';
    R.note = t.why ? 'במקום ' + (KM.TASK_INFO[(R.alarm.tasks[R.idx] || {}).type] || {}).name + ': ' + t.why : '';
    R.ts = KM.TASKS[t.type].init(t);
    KM.render();
    const def = KM.TASKS[t.type];
    if (def.onShow) def.onShow(R.ts);
  };

  KM.taskDone = () => {
    stopTask();
    KM.haptic();
    R.idx++;
    if (R.idx < R.tasks.length) KM.taskStart(); else KM.ringFinish();
  };

  // The task can't work here after all (sensor silent, camera refused): switch to sums.
  KM.taskFallback = (why) => {
    stopTask();
    R.tasks[R.idx] = Object.assign({}, FALLBACK, { why });
    KM.taskStart();
  };

  KM.ringFinish = async () => {
    R.mode = 'done'; R.doneAt = Date.now();
    KM.render();
    let res = null;
    try { res = await KM.AL.dismiss(); } catch (e) { console.warn('dismiss', e && e.message); }
    R.checkAt = (res && res.checkAt) || 0;
    if (!R.test) KM.logMorning(R);
    KM.render();
  };

  KM.ringSnooze = async () => {
    if (R.snoozesLeft <= 0 || R.mode !== 'ring') return;
    let res = null;
    try { res = await KM.AL.snooze(); } catch (e) { console.warn('snooze', e && e.message); }
    R.mode = 'idle';
    KM.render();
    if (res && res.until) KM.toast('השעון יחזור ב-' + KM.time(res.until), 4000);
  };

  KM.checkBegin = (st) => {
    stopTask();
    Object.assign(R, { mode: 'check', key: 'check' + (st.startedAt || ''), alarm: alarmFor(st), checkEndsAt: st.checkEndsAt || Date.now() + KM.CHECK_SECONDS * 1000 });
    KM.closeSheet();
    KM.render();
  };

  KM.checkConfirm = async () => {
    try { await KM.AL.confirmAwake(); } catch (e) { console.warn('confirm', e && e.message); }
    KM.logCheck(R.alarm && R.alarm.id, 'ok');
    R.mode = 'awake';
    KM.render();
  };

  KM.ringClose = () => { R.mode = 'idle'; KM.render(); };

  // Whatever Android says now (ringing, checking, nothing) – called on events, on start and on coming back.
  KM.onAlarmState = (st) => {
    if (!st) return;
    if (st.mode === 'ring') { if (R.key !== (st.startedAt || R.key) || R.mode === 'idle' || R.mode === 'check' || R.mode === 'awake') KM.ringBegin(st); return; }
    if (st.mode === 'check') { if (R.mode !== 'check') KM.checkBegin(st); return; }
    // Stopped by itself (an hour passed) or from elsewhere while the task was on screen.
    if (R.mode === 'ring' || R.mode === 'task' || R.mode === 'check') { stopTask(); R.mode = 'idle'; KM.render(); }
  };
})();
