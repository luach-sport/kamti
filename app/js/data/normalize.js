/* Checks saved data (or a file from an older version) and fills in anything missing, so the app never breaks. */
(function () {
  'use strict';
  const KM = window.KM;
  const { isObj, int, str } = KM;

  KM.normalizeTask = (t) => {
    if (!isObj(t) || !KM.TASK_INFO[t.type]) return null;
    const info = KM.TASK_INFO[t.type];
    const out = Object.assign({}, info.defaults, { type: t.type });
    Object.keys(info.defaults).forEach((k) => {
      const d = info.defaults[k];
      if (typeof d === 'number') out[k] = int(t[k], d, 0, 999);
      else if (typeof d === 'string') out[k] = str(t[k] == null ? d : t[k], 200);
    });
    const sig = t.type === 'photo' && isObj(t.ref) && isObj(t.ref.sig) ? t.ref.sig : null;
    if (sig && Array.isArray(sig.g) && sig.g.length === KM.match.W * KM.match.H) {
      out.ref = { sig: { g: sig.g.map((v) => Math.round(+v || 0)), hist: (Array.isArray(sig.hist) ? sig.hist : []).slice(0, 64).map((v) => +v || 0) }, thumb: str(t.ref.thumb, 60000), at: +t.ref.at || 0 };
    }
    return out;
  };

  KM.normalizeSound = (s) => {
    if (isObj(s) && s.kind === 'phone') return { kind: 'phone' };
    if (isObj(s) && s.kind === 'file' && s.uri) return { kind: 'file', uri: str(s.uri, 1000), name: str(s.name, 80) };
    const id = isObj(s) && KM.SOUNDS.some((x) => x.id === s.id) ? s.id : 'classic';
    return { kind: 'builtin', id };
  };

  KM.normalizeAlarm = (a) => {
    if (!isObj(a)) return null;
    const def = KM.newAlarm();
    const days = Array.isArray(a.days) ? [...new Set(a.days.map(Number).filter((d) => d >= 0 && d <= 6))].sort() : def.days;
    let tasks = (Array.isArray(a.tasks) ? a.tasks : []).map(KM.normalizeTask).filter(Boolean).slice(0, 3);
    if (!tasks.length) tasks = def.tasks;
    return {
      id: str(a.id || KM.uid(), 40), on: a.on !== false,
      h: int(a.h, def.h, 0, 23), m: int(a.m, def.m, 0, 59), days, label: KM.clip(a.label, 40),
      tasks, sound: KM.normalizeSound(a.sound), vibrate: a.vibrate !== false,
      snooze: int(a.snooze, 0, 0, 3), snoozeMin: int(a.snoozeMin, 5, 1, 30), check: int(a.check, 5, 0, 30),
      skipUntil: +a.skipUntil > Date.now() ? +a.skipUntil : 0, createdAt: +a.createdAt || Date.now()
    };
  };

  KM.normalize = (raw) => {
    const d = KM.defaults();
    if (!isObj(raw)) return d;
    const s = isObj(raw.settings) ? raw.settings : {};
    d.createdAt = +raw.createdAt || d.createdAt;
    d.setupDone = !!raw.setupDone;
    d.settings.theme = ['light', 'dark', 'system'].indexOf(s.theme) >= 0 ? s.theme : 'system';
    d.alarms = (Array.isArray(raw.alarms) ? raw.alarms : []).map(KM.normalizeAlarm).filter(Boolean).slice(0, 40);
    d.log = (Array.isArray(raw.log) ? raw.log : []).filter((l) => isObj(l) && +l.rangAt > 0).slice(-90);
    d.outbox = (Array.isArray(raw.outbox) ? raw.outbox : []).filter((m) => isObj(m) && m.message).slice(-30);
    if (isObj(raw.profile)) d.profile = { name: str(raw.profile.name, 60), email: str(raw.profile.email, 120) };
    d.updateSeen = +raw.updateSeen || 0;
    return d;
  };
})();
