/* Starting data: a new alarm, the app's empty data, and the built-in sounds. */
(function () {
  'use strict';
  const KM = window.KM;

  // Sounds made for קמתי (tools/make-sounds.py → android-res/raw). "phone" = the phone's own alarm sound,
  // "file" = a song or recording the user picked from the phone's files.
  KM.SOUNDS = [
    { id: 'classic', name: 'צפצוף קלאסי' },
    { id: 'rise', name: 'מנגינה עולה' },
    { id: 'bell', name: 'פעמונים' },
    { id: 'siren', name: 'סירנה' },
    { id: 'digital', name: 'שעון דיגיטלי' }
  ];
  KM.soundName = (s) => {
    if (!s || s.kind === 'builtin') { const b = KM.SOUNDS.find((x) => x.id === (s && s.id)); return b ? b.name : KM.SOUNDS[0].name; }
    if (s.kind === 'phone') return 'הצלצול של הטלפון';
    return s.name || 'קובץ מהטלפון';
  };

  // A fresh alarm: the next half hour, Sunday–Friday, three easy sums, check 5 minutes after.
  KM.newAlarm = () => {
    const d = new Date(Date.now() + 8 * 3600e3);
    let h = d.getHours(), m = d.getMinutes() < 30 ? 30 : 0;
    if (m === 0) h = (h + 1) % 24;
    if (h < 4 || h > 10) { h = 6; m = 30; }
    return {
      id: KM.uid(), on: true, h, m, days: [0, 1, 2, 3, 4, 5], label: '',
      tasks: [{ type: 'math', level: 1, count: 3 }],
      sound: { kind: 'builtin', id: 'classic' }, vibrate: true,
      snooze: 0, snoozeMin: 5, check: 5, skipUntil: 0, createdAt: Date.now()
    };
  };

  KM.defaults = () => ({
    v: 1, createdAt: Date.now(), setupDone: false,
    settings: { theme: 'system' },
    alarms: [], log: [],
    outbox: [], profile: { name: '', email: '' }, updateSeen: 0
  });
})();
