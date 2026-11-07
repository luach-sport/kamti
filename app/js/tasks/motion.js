/* The phone's motion sensor (accelerometer), shared by the walking and shaking tasks.
   Counts steps (a gentle rhythm of peaks) or shakes (sharp jolts). If the sensor never answers, says so,
   and the task turns into sums instead. */
(function () {
  'use strict';
  const KM = window.KM;
  const G = 9.81;

  function stepCounter(onCount) {
    let fast = G, slow = G, armed = true, last = 0;
    return (s) => {
      fast = fast * 0.75 + s.mag * 0.25;
      slow = slow * 0.97 + s.mag * 0.03;
      const d = fast - slow;
      if (armed && d > 1.3 && s.t - last > 300) { armed = false; last = s.t; onCount(); }
      else if (d < 0.25) armed = true;
    };
  }

  function shakeCounter(onCount) {
    let prev = null, last = 0;
    return (s) => {
      const jolt = s.lin != null ? s.lin : (prev == null ? 0 : Math.abs(s.mag - prev) * 2.2);
      prev = s.mag;
      if (jolt > 13 && s.t - last > 170) { last = s.t; onCount(); }
    };
  }

  // kind: 'steps' | 'shake'. Returns { stop() }. onSilent() when no reading came in 4 seconds.
  KM.motionStart = (kind, onCount, onSilent) => {
    const count = kind === 'steps' ? stepCounter(onCount) : shakeCounter(onCount);
    let got = false;
    const feed = (s) => { got = true; count(s); };
    const handler = (e) => {
      const g = e.accelerationIncludingGravity || {}, a = e.acceleration || {};
      if (g.x == null && a.x == null) return;
      const mag = g.x != null ? Math.hypot(g.x, g.y, g.z) : G + Math.hypot(a.x, a.y, a.z);
      const lin = a.x != null ? Math.hypot(a.x, a.y, a.z) : null;
      feed({ t: performance.now(), mag, lin });
    };
    window.addEventListener('devicemotion', handler);
    const silentTimer = setTimeout(() => { if (!got && onSilent) onSilent(); }, 4000);
    KM.motionFeed = feed; // tests and the site's screenshots feed readings through here
    return { stop: () => { window.removeEventListener('devicemotion', handler); clearTimeout(silentTimer); if (KM.motionFeed === feed) KM.motionFeed = null; } };
  };
})();
