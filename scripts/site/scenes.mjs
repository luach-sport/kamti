// The screenshots on קמתי's site, taken by the Itzko site kit (kit/lib/shots.mjs in luach-sport/itzko).
// The app runs in a browser there, so Android's side is the stand-in in js/alarm/bridge.js (KM.AL.sim / simSet).
// The clock is fixed: the evening before (22:47) for the alarm screens, and 06:30 for the ringing ones.
const evening = () => { const d = new Date(); d.setHours(22, 47, 0, 0); return d; };
const morning = (m) => { const d = new Date(); d.setHours(6, 30 + (m || 0), 20, 0); return d; };

// Example alarms and two weeks of mornings (made relative to "now", so the dates always look current).
const SEED = `(() => {
  const now = Date.now(), day = 864e5;
  const dayStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const alarms = [
    { id: 'a1', on: true, h: 6, m: 30, days: [0, 1, 2, 3, 4], label: 'תפילת שחרית', tasks: [{ type: 'math', level: 1, count: 3 }, { type: 'steps', count: 30 }], sound: { kind: 'builtin', id: 'classic' }, vibrate: true, snooze: 0, snoozeMin: 5, check: 5, skipUntil: 0, createdAt: now - 20 * day },
    { id: 'a2', on: true, h: 7, m: 15, days: [5], label: 'יום שישי', tasks: [{ type: 'type', text: 'modeh' }], sound: { kind: 'builtin', id: 'rise' }, vibrate: true, snooze: 1, snoozeMin: 5, check: 0, skipUntil: 0, createdAt: now - 20 * day },
    { id: 'a3', on: false, h: 5, m: 45, days: [0, 1, 2, 3, 4, 5], label: 'הנץ', tasks: [{ type: 'memory', len: 4, rounds: 2 }, { type: 'shake', count: 30 }], sound: { kind: 'builtin', id: 'bell' }, vibrate: true, snooze: 0, snoozeMin: 5, check: 10, skipUntil: 0, createdAt: now - 9 * day }
  ];
  const mins = [3, 1, 2, 6, 2, 4, 1, 12, 2, 3, 1, 2], log = [];
  mins.forEach((m, i) => {
    const t = dayStart(now - (i + 1) * day) + 6.5 * 3600e3;
    if (new Date(t).getDay() === 6) return;
    log.unshift({ id: 'l' + i, alarmId: 'a1', label: 'תפילת שחרית', rangAt: t, doneAt: t + m * 60e3, snoozes: m > 10 ? 1 : 0, tasks: ['math', 'steps'], check: i === 7 ? 'missed' : 'ok' });
  });
  return { v: 1, createdAt: now - 20 * day, setupDone: true, settings: { theme: 'light' }, alarms, log, outbox: [], profile: { name: '', email: '' }, updateSeen: 999999 };
})()`;

export async function prepare(page, { info }) {
  await page.clock.setFixedTime(evening());
  await page.evaluate((seed) => { localStorage.setItem('kamti.theme', 'light'); localStorage.setItem('kamti.state.v1', JSON.stringify(eval(seed))); }, SEED);
  await page.reload();
  await page.waitForTimeout(1500);
  return { info };
}

export const reset = () => {
  const K = window.__kamti.KM;
  K.closeSheet();
  K.AL.simSet({ mode: 'idle' });
  K.ring.mode = 'idle';
  K.ui.stack = []; K.ui.tab = 'home'; K.ui.draft = null;
  K.render();
  window.scrollTo(0, 0);
};

const scene = (name, body, extra) => Object.assign({ name, set: new Function('arg', 'const K = window.__kamti.KM, ui = K.ui; ' + body) }, extra || {});

// Ringing scenes: set the morning clock first, then make Android "ring" alarm a1.
const ringing = (name, after, extra) => Object.assign({
  name,
  run: async (page) => {
    await page.clock.setFixedTime(morning(name === 'done' ? 3 : 0));
    await page.evaluate((body) => {
      const K = window.__kamti.KM;
      K.AL.simSet({ mode: 'ring', alarmId: 'a1', alarm: { id: 'a1', check: 5, snoozeMin: 5 }, startedAt: Date.now() - 20000, ringAt: Date.now() - 20000, snoozesLeft: 0 });
      new Function('K', body)(K);
    }, after || '');
    await page.waitForTimeout(500);
  }
}, extra || {});

export const SCENES = [
  scene('home', 'K.render();'),
  scene('edit', "K.openEditor(K.alarmById('a1'), false);"),
  scene('edit-end', "K.openEditor(K.alarmById('a1'), false);", { scroll: 'bottom' }),
  scene('task-pick', "K.openEditor(K.alarmById('a1'), false); K.openSheet('taskPick');", { wait: 700 }),
  scene('check-sheet', "K.openEditor(K.alarmById('a1'), false); K.openSheet('check');", { wait: 700 }),
  ringing('ring'),
  ringing('math', "K.taskStart(); K.ring.ts.cur = { q: '23 + 48', a: 71 }; K.TASKS.math.key(K.ring.ts, '7'); K.render();"),
  ringing('steps', "K.taskStart(); K.ring.ts.n = 99; K.taskDone(); K.ring.ts.done = 12; K.ring.ts.mover && K.ring.ts.mover.stop(); K.render();"),
  ringing('type', `K.ring.tasks = [{ type: 'type', text: 'modeh' }]; K.taskStart();
    const el = document.querySelector('#typeIn'); el.value = 'מודה אני לפניך מלך חי'; el.dispatchEvent(new Event('input', { bubbles: true })); el.blur();`),
  ringing('memory', `K.ring.tasks = [{ type: 'memory', len: 4, rounds: 2 }]; K.taskStart();
    const s = K.ring.ts; s.dead = true; clearTimeout(s.timer); s.phase = 'input'; s.pos = 2; s.lit = -1; s.good = s.seq[1]; K.render();`),
  ringing('done', 'K.ring.t0 = Date.now() - 3 * 60e3; K.ringFinish();', { wait: 600 }),
  scene('check', "K.AL.simSet({ mode: 'check', alarmId: 'a1', startedAt: Date.now() - 18000, checkEndsAt: Date.now() + 42000 });", { wait: 600 }),
  scene('setup', "K.ui.perms = { notifications: true, exact: true, fullScreen: true, overlay: false, battery: false }; K.pushView({ name: 'setup' });"),
  scene('log', "ui.tab = 'log'; K.render();"),
  scene('settings', "ui.tab = 'settings'; K.render();"),
  scene('settings-end', "ui.tab = 'settings'; K.render();", { scroll: 'bottom' }),
  scene('share-app', "ui.tab = 'settings'; K.render(); K.openSheet('shareApp');", { wait: 700 }),
  scene('feedback', "ui.tab = 'settings'; K.render(); K.state.profile = { name: 'דני כהן', email: 'dani@example.com' }; K.openSheet('feedback');",
    { fill: ['#fbm', 'הייתי רוצה משימה של חידות טריוויה'], wait: 600 }),
  scene('update', `ui.tab = 'settings'; K.render();
    const b = parseInt(arg.info.build, 10) || 2;
    K.VERSION.build = String(b - 1 > 0 ? b - 1 : b);
    K.update.info = { version: arg.info.version || '1.0', build: b, notes: (arg.info.notes || []).slice(0, 4), inApp: true };
    K.openSheet('update');`, { wait: 700 })
];
