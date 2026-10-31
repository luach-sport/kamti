// Checks קמתי in a phone-sized browser: the time rules, the tasks' logic, the motion counting, and the whole
// morning (alarm → tasks → good morning → awake check), with the browser stand-in for Android (KM.AL.sim).
// Run: python3 -m http.server 8765 --directory www   then   node tests/app.test.mjs
import { createRequire } from 'node:module';
const require = createRequire(process.env.PW_FROM || '/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:8765/index.html';
let failed = 0, passed = 0;
const ok = (cond, name, extra) => { if (cond) passed++; else { failed++; console.log('FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); } };

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await (await browser.newContext({ viewport: { width: 360, height: 740 }, locale: 'he-IL', timezoneId: 'Asia/Jerusalem' })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(BASE);
await page.waitForTimeout(700);
const ev = (f, a) => page.evaluate(f, a);

// ---------- when an alarm rings ----------
const ring = await ev(() => {
  const K = window.__kamti.KM;
  const at = (y, mo, d, h, mi) => new Date(y, mo - 1, d, h, mi).getTime();
  const from = at(2026, 11, 1, 22, 47); // Sunday evening
  return {
    tomorrow: K.nextRing({ h: 6, m: 30, days: [0, 1, 2, 3, 4] }, from) === at(2026, 11, 2, 6, 30),
    friday: K.nextRing({ h: 7, m: 15, days: [5] }, from) === at(2026, 11, 6, 7, 15),
    once: K.nextRing({ h: 23, m: 0, days: [] }, from) === at(2026, 11, 1, 23, 0),
    onceTomorrow: K.nextRing({ h: 6, m: 0, days: [] }, from) === at(2026, 11, 2, 6, 0),
    skip: K.nextRing({ h: 6, m: 30, days: [0, 1, 2, 3, 4], skipUntil: at(2026, 11, 2, 6, 30) }, from) === at(2026, 11, 3, 6, 30),
    saturdayOnly: K.nextRing({ h: 8, m: 0, days: [6] }, from) === at(2026, 11, 7, 8, 0),
    days: [K.daysText([0, 1, 2, 3, 4, 5]), K.daysText([0, 1, 2, 3, 4, 5, 6]), K.daysText([]), K.daysText([1, 3])],
    until: [K.untilText(from + 7 * 3600e3 + 43 * 60e3, from), K.untilText(from + 3600e3 + 60e3, from), K.untilText(from + 2 * 3600e3, from), K.untilText(from + 5 * 60e3, from)]
  };
});
Object.entries(ring).forEach(([k, v]) => { if (typeof v === 'boolean') ok(v, 'nextRing ' + k); });
ok(ring.days.join('|') === 'א׳–ו׳|כל יום|פעם אחת|ב׳, ד׳', 'daysText', ring.days);
ok(ring.until.join('|') === 'בעוד 7 שעות ו-43 דקות|בעוד שעה ודקה|בעוד שעתיים|בעוד 5 דקות', 'untilText', ring.until);

// ---------- sums: always a whole, positive answer that fits the keypad ----------
const math = await ev(() => {
  const K = window.__kamti.KM, bad = [];
  for (const level of [1, 2, 3]) for (let i = 0; i < 400; i++) {
    const q = K.mathQuestion(level);
    const real = Function('return ' + q.q.replace(/×/g, '*').replace(/−/g, '-'))();
    if (real !== q.a || q.a < 0 || q.a > 99999 || !Number.isInteger(q.a)) bad.push([level, q]);
  }
  return bad.slice(0, 3);
});
ok(math.length === 0, 'math questions', math);

// ---------- typing compares without vowels and punctuation ----------
const typ = await ev(() => {
  const K = window.__kamti.KM;
  return [K.typeProgress('בוקר טוב! קמתי', 'בוקר טוב קמתי'), K.typeProgress('מודה אני', 'מוד'), K.typeProgress('מודה אני', 'מודא'), K.typeNorm('מוֹדֶה  אֲנִי,')];
});
ok(typ[0].ok === typ[0].total && !typ[0].wrong, 'type: punctuation ignored', typ[0]);
ok(typ[1].ok === 3 && !typ[1].wrong, 'type: partial', typ[1]);
ok(typ[2].wrong, 'type: mistake noticed', typ[2]);
ok(typ[3] === 'מודה אני', 'type: vowels removed', typ[3]);

// ---------- motion: steps and shakes from made-up sensor readings ----------
const motion = await ev(() => {
  const K = window.__kamti.KM, out = {};
  const run = (kind, gen, sec) => {
    let n = 0;
    const m = K.motionStart(kind, () => n++, null);
    for (let i = 0; i < sec * 60; i++) KM.motionFeed(gen(i / 60, i));
    m.stop();
    return n;
  };
  const KM = K;
  const noise = () => (Math.random() - 0.5) * 0.3;
  // walking: 1.8 steps a second, a bump of ±2.5 m/s² on top of gravity
  out.walk = run('steps', (t) => ({ t: t * 1000, mag: 9.81 + 2.5 * Math.sin(2 * Math.PI * 1.8 * t) + noise() }), 20);
  out.still = run('steps', (t) => ({ t: t * 1000, mag: 9.81 + noise() }), 20);
  out.shake = run('shake', (t) => ({ t: t * 1000, mag: 9.81, lin: 18 * Math.abs(Math.sin(2 * Math.PI * 2.5 * t)) }), 10);
  out.calm = run('shake', (t) => ({ t: t * 1000, mag: 9.81, lin: 1.5 + noise() }), 10);
  return out;
});
ok(motion.walk >= 32 && motion.walk <= 40, 'steps counted (expected ~36)', motion.walk);
ok(motion.still === 0, 'no steps when still', motion.still);
// Every flick counts (forth and back = 2), like a person counting shakes.
ok(motion.shake >= 45 && motion.shake <= 52, 'shakes counted (expected ~50)', motion.shake);
ok(motion.calm === 0, 'no shakes when calm', motion.calm);

// ---------- broken saved data never breaks the app ----------
const norm = await ev(() => {
  const K = window.__kamti.KM;
  const s = K.normalize({ alarms: [null, { h: 99, m: -5, days: [9, 1, 1], tasks: [{ type: 'nope' }, { type: 'math', count: 'x' }] }], log: 'x', settings: { theme: 'pink' } });
  return { n: s.alarms.length, h: s.alarms[0].h, m: s.alarms[0].m, days: s.alarms[0].days, tasks: s.alarms[0].tasks, theme: s.settings.theme };
});
ok(norm.n === 1 && norm.h === 23 && norm.m === 0 && norm.days.join() === '1' && norm.tasks.length === 1 && norm.tasks[0].count === 3 && norm.theme === 'system', 'normalize', norm);

// ---------- the whole morning ----------
await ev(() => window.__kamti.A['setup-done']());
await page.waitForTimeout(200);
ok(await ev(() => window.__kamti.KM.view() && window.__kamti.KM.view().name === 'edit'), 'first run opens a new alarm');
await ev(() => { const K = window.__kamti.KM; K.ui.draft.h = 6; K.ui.draft.m = 30; K.ui.draft.tasks = [{ type: 'math', level: 1, count: 2 }, { type: 'steps', count: 20 }]; K.ui.draft.check = 5; });
await ev(() => window.__kamti.A['edit-save']());
await page.waitForTimeout(300);
const saved = await ev(() => { const K = window.__kamti.KM; return { n: K.state.alarms.length, home: !!document.querySelector('.alarm-card'), sync: K.AL.sim.calls.filter((c) => c[0] === 'sync').length }; });
ok(saved.n === 1 && saved.home && saved.sync >= 1, 'alarm saved and sent to Android', saved);

await ev(() => { const K = window.__kamti.KM; K.AL.simSet({ mode: 'ring', alarmId: K.state.alarms[0].id, alarm: { check: 5 }, startedAt: Date.now(), snoozesLeft: 0 }); });
await page.waitForTimeout(200);
ok(await ev(() => document.body.classList.contains('ringing') && !!document.querySelector('[data-action="ring-start"]') && !document.querySelector('[data-action="ring-snooze"]')), 'ring screen, no snooze button');
await ev(() => window.__kamti.A['ring-start']());
for (let i = 0; i < 2; i++) {
  const ans = await ev(() => String(window.__kamti.KM.ring.ts.cur.a));
  for (const d of ans) await page.keyboard.press(d);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
}
ok(await ev(() => window.__kamti.KM.ring.tasks[window.__kamti.KM.ring.idx].type === 'steps'), 'sums solved with number keys, then steps');
// No motion sensor answers in a desktop browser → after 4 s the steps become sums.
await page.waitForTimeout(4500);
const fb = await ev(() => { const R = window.__kamti.KM.ring; return { type: R.tasks[R.idx].type, note: R.note }; });
ok(fb.type === 'math' && /חיישן/.test(fb.note), 'silent sensor → sums instead', fb);
for (let i = 0; i < 4; i++) {
  const ans = await ev(() => String(window.__kamti.KM.ring.ts.cur.a));
  for (const d of ans) await ev((k) => window.__kamti.KM.TASKS.math.key(window.__kamti.KM.ring.ts, k), d);
  await ev(() => window.__kamti.KM.TASKS.math.key(window.__kamti.KM.ring.ts, 'ok'));
}
await page.waitForTimeout(300);
const done = await ev(() => { const K = window.__kamti.KM; return { mode: K.ring.mode, checkAt: K.ring.checkAt, log: K.state.log.length, dismissed: K.AL.sim.calls.some((c) => c[0] === 'dismiss') }; });
ok(done.mode === 'done' && done.checkAt > Date.now() && done.log === 1 && done.dismissed, 'good morning, check set, logged', done);

await ev(() => { const K = window.__kamti.KM; K.AL.simSet({ mode: 'check', alarmId: K.state.alarms[0].id, startedAt: Date.now(), checkEndsAt: Date.now() + 60000 }); });
await page.waitForTimeout(200);
ok(await ev(() => !!document.querySelector('[data-action="check-confirm"]')), 'awake check shown');
await ev(() => window.__kamti.A['check-confirm']());
await page.waitForTimeout(200);
const after = await ev(() => { const K = window.__kamti.KM; return { mode: K.ring.mode, check: K.state.log[0].check }; });
ok(after.mode === 'awake' && after.check === 'ok', 'awake confirmed and logged', after);
await ev(() => window.__kamti.A['ring-close']());

// ---------- a one-time alarm that rang turns off ----------
await ev(() => { const K = window.__kamti.KM; const a = K.newAlarm(); a.id = 'once1'; a.days = []; K.state.alarms.push(a); K.AL.sim.state.firedOnce = ['once1']; });
await ev(() => window.__kamti.KM.syncAlarms());
ok(await ev(() => window.__kamti.KM.alarmById('once1').on === false), 'one-time alarm turned off after ringing');

// ---------- a device without camera or motion sensor ----------
await ev(() => { const K = window.__kamti.KM; K.ui.device = { camera: false, motion: false }; });
const blocked = await ev(() => { const K = window.__kamti.KM; return [K.taskBlocked('photo'), K.taskBlocked('steps'), K.taskBlocked('math')]; });
ok(blocked[0] && blocked[1] && !blocked[2], 'player without camera/sensor', blocked);

// ---------- every screen draws ----------
for (const tab of ['home', 'log', 'settings']) {
  await ev((t) => { const K = window.__kamti.KM; K.ui.stack = []; K.ui.tab = t; K.render(); }, tab);
  ok(await ev(() => document.querySelector('#screen').innerHTML.length > 200), 'tab ' + tab);
}
for (const sheet of ['taskPick', 'sound', 'snooze', 'check', 'feedback', 'update', 'shareApp']) {
  await ev((s) => { const K = window.__kamti.KM; K.ui.draft = K.copy(K.state.alarms[0]); K.openSheet(s, { i: 0, k: 'h' }); }, sheet);
  ok(await ev(() => !!document.querySelector('.sheet')), 'sheet ' + sheet);
  await ev(() => window.__kamti.KM.closeSheet());
}

ok(errors.length === 0, 'no page errors', errors.slice(0, 3));
console.log(failed ? '\n' + failed + ' failed, ' + passed + ' passed' : 'all ' + passed + ' checks passed');
await browser.close();
process.exit(failed ? 1 : 0);
