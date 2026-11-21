/* The tasks that stop the alarm: names, icons, settings to choose from, and which need a camera or a motion sensor. */
(function () {
  'use strict';
  const KM = window.KM;

  const LEVELS = { 1: 'קל', 2: 'בינוני', 3: 'קשה' };
  KM.TASK_ORDER = ['math', 'steps', 'shake', 'type', 'memory', 'order', 'photo'];
  KM.TASK_INFO = {
    math: {
      name: 'תרגילי חשבון', icon: 'calc', desc: 'פותרים כמה תרגילים קצרים', defaults: { level: 1, count: 3 },
      summary: (t) => (t.count === 1 ? 'תרגיל אחד' : t.count + ' תרגילים') + ' · ' + LEVELS[t.level]
    },
    steps: {
      name: 'הליכה', icon: 'steps', desc: 'קמים מהמיטה והולכים כמה צעדים', needs: 'motion', defaults: { count: 30 },
      summary: (t) => t.count + ' צעדים'
    },
    shake: {
      name: 'ניעור הטלפון', icon: 'shake', desc: 'מנערים את הטלפון חזק', needs: 'motion', defaults: { count: 30 },
      summary: (t) => t.count + ' ניעורים'
    },
    type: {
      name: 'הקלדת משפט', icon: 'keyboard', desc: 'מקלידים משפט שמופיע על המסך', defaults: { text: 'modeh' },
      summary: (t) => (t.text === 'modeh' ? '"מודה אני"' : 'משפט בוקר טוב, מתחלף')
    },
    memory: {
      name: 'משחק זיכרון', icon: 'memory', desc: 'זוכרים רצף של ריבועים ולוחצים עליו', defaults: { len: 4, rounds: 2 },
      summary: (t) => (t.rounds === 1 ? 'סבב אחד' : t.rounds + ' סבבים') + ' · רצף של ' + t.len
    },
    order: {
      name: 'מספרים לפי הסדר', icon: 'order', desc: 'לוחצים על המספרים מהקטן לגדול', defaults: { size: 12 },
      summary: (t) => 'מ-1 עד ' + t.size
    },
    photo: {
      name: 'צילום מקום בבית', icon: 'camera', desc: 'מצלמים מקום קבוע, למשל הכיור או הקומקום', needs: 'camera', defaults: { place: '' },
      summary: (t) => (t.ref ? 'לצלם: ' + (t.place || 'המקום ששמרת') : 'עוד לא צולם המקום')
    }
  };

  // The choices in each task's settings sheet.
  KM.TASK_OPTIONS = {
    math: [
      { key: 'level', label: 'רמה', values: [{ v: 1, l: 'קל', s: 'למשל 23 + 14' }, { v: 2, l: 'בינוני', s: 'למשל 47 + 38, או 7 × 8' }, { v: 3, l: 'קשה', s: 'למשל 14 × 3 + 27' }] },
      { key: 'count', label: 'כמה תרגילים', values: [1, 2, 3, 4, 5, 7, 10].map((v) => ({ v, l: String(v) })) }
    ],
    steps: [{ key: 'count', label: 'כמה צעדים', values: [15, 30, 50, 100].map((v) => ({ v, l: String(v) })) }],
    shake: [{ key: 'count', label: 'כמה ניעורים', values: [20, 30, 50, 80].map((v) => ({ v, l: String(v) })) }],
    type: [{ key: 'text', label: 'מה מקלידים', values: [{ v: 'modeh', l: 'מודה אני', s: 'מודה אני לפניך מלך חי וקיים…' }, { v: 'random', l: 'משפט בוקר טוב', s: 'משפט קצר שמתחלף כל בוקר' }] }],
    memory: [
      { key: 'len', label: 'אורך הרצף', values: [3, 4, 5, 6].map((v) => ({ v, l: String(v) })) },
      { key: 'rounds', label: 'כמה סבבים', values: [1, 2, 3].map((v) => ({ v, l: String(v) })) }
    ],
    order: [{ key: 'size', label: 'עד איזה מספר', values: [9, 12, 16].map((v) => ({ v, l: String(v) })) }],
    photo: []
  };

  // Can this phone (or player) do this task? Returns '' or the reason it can't.
  KM.taskBlocked = (type) => {
    const need = (KM.TASK_INFO[type] || {}).needs, dev = KM.ui.device;
    if (need === 'camera' && !dev.camera) return 'אין מצלמה במכשיר הזה';
    if (need === 'motion' && !dev.motion) return 'אין חיישן תנועה במכשיר הזה';
    return '';
  };
  KM.taskSummary = (t) => KM.TASK_INFO[t.type].summary(t);
  KM.taskName = (t) => KM.TASK_INFO[t.type].name;
})();
