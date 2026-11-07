/* The mornings log: when it rang, when you finished the tasks, snoozes, and whether you passed the awake check. */
(function () {
  'use strict';
  const KM = window.KM;

  KM.logMorning = (R) => {
    const a = R.alarm || {};
    KM.state.log.push({
      id: KM.uid(), alarmId: a.id || '', label: a.label || '', rangAt: R.t0, doneAt: R.doneAt || Date.now(),
      snoozes: R.snoozes || 0, tasks: (R.tasks || []).map((t) => t.type), check: a.check && R.checkAt ? 'pending' : ''
    });
    KM.state.log = KM.state.log.slice(-90);
    KM.save();
  };

  KM.logCheck = (alarmId, result) => {
    for (let i = KM.state.log.length - 1; i >= 0; i--) {
      const l = KM.state.log[i];
      if (l.alarmId === alarmId && l.check === 'pending') { l.check = result; KM.save(); return; }
    }
  };

  // Minutes from the first ring until the tasks were done (snoozes included).
  KM.logMinutes = (l) => Math.max(0, Math.round((l.doneAt - l.rangAt) / 60e3));

  KM.logStats = () => {
    const week = KM.state.log.filter((l) => l.rangAt > Date.now() - 7 * 864e5);
    const all = KM.state.log;
    const avg = all.length ? Math.round(all.reduce((s, l) => s + KM.logMinutes(l), 0) / all.length) : 0;
    const checks = all.filter((l) => l.check === 'ok' || l.check === 'missed');
    return {
      total: all.length, week: week.length, avg,
      checksOk: checks.filter((l) => l.check === 'ok').length, checks: checks.length,
      noSnooze: all.filter((l) => !l.snoozes).length
    };
  };
})();
