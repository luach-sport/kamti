/* The alarm editor: time, days, tasks, sound, snooze, check, skip, save / test / delete. Changes KM.ui.draft. */
(function () {
  'use strict';
  const KM = window.KM;
  const A = KM.A;
  const ui = KM.ui;

  // Arrows change the time in place (no full redraw), so holding an arrow keeps repeating.
  A.tp = (el) => {
    const d = ui.draft, k = el.dataset.k, step = +el.dataset.d;
    if (k === 'h') d.h = (d.h + step + 24) % 24; else d.m = (d.m + step + 60) % 60;
    const nums = document.querySelectorAll('.tp-num');
    if (nums[0]) nums[0].textContent = KM.p2(d.h);
    if (nums[1]) nums[1].textContent = KM.p2(d.m);
    const u = KM.$('#tpUntil'); if (u) u.textContent = KM.views.untilLine(d);
  };
  A['pick-time'] = (el) => { ui.draft[el.dataset.k] = +el.dataset.v; KM.closeSheet(); KM.render(true); };

  A.day = (el) => {
    const d = ui.draft, n = +el.dataset.d, i = d.days.indexOf(n);
    if (i >= 0) d.days.splice(i, 1); else d.days.push(n);
    d.days.sort();
    d.skipUntil = 0;
    KM.render(true);
  };
  A['days-preset'] = (el) => { ui.draft.days = el.dataset.k.split('').filter(Boolean).map(Number); ui.draft.skipUntil = 0; KM.render(true); };

  A['set-draft'] = (el) => {
    ui.draft[el.dataset.k] = +el.dataset.v;
    if (ui.sheet) KM.renderSheet();
    KM.render(true);
  };
  A['toggle-vibrate'] = () => { ui.draft.vibrate = !ui.draft.vibrate; KM.render(true); };
  A['toggle-skip'] = () => {
    const d = ui.draft;
    d.skipUntil = d.skipUntil ? 0 : KM.nextRing(Object.assign({}, d, { skipUntil: 0 }));
    KM.render(true);
  };

  // ---------- Tasks ----------
  A['task-add'] = (el) => {
    const type = el.dataset.v;
    if (KM.taskBlocked(type) || ui.draft.tasks.length >= 3) return;
    ui.draft.tasks.push(Object.assign({ type }, KM.TASK_INFO[type].defaults));
    const i = ui.draft.tasks.length - 1;
    KM.render(true);
    if (type === 'photo') KM.openSheet('photoSetup', { i });
    else KM.openSheet('taskCfg', { i });
  };
  A['task-edit'] = (el) => KM.openSheet('taskCfg', { i: +el.dataset.i });
  A['task-remove'] = (el) => { if (ui.draft.tasks.length > 1) { ui.draft.tasks.splice(+el.dataset.i, 1); KM.render(true); } };
  A['task-opt'] = (el) => {
    const t = ui.draft.tasks[ui.sheet.data.i], k = el.dataset.k, v = el.dataset.v;
    t[k] = typeof KM.TASK_INFO[t.type].defaults[k] === 'number' ? +v : v;
    KM.renderSheet(); KM.render(true);
  };
  A['open-photo'] = (el) => KM.openSheet('photoSetup', { i: +el.dataset.i });

  // ---------- Sound ----------
  A['sound-pick'] = async (el) => {
    const kind = el.dataset.kind;
    if (kind === 'file') {
      let r = null;
      try { r = await KM.AL.pickSound(); } catch (e) { r = null; }
      if (!r || r.cancelled || !r.uri) { if (r && !r.cancelled) KM.toast('לא הצלחתי לפתוח את הקובץ'); return; }
      ui.draft.sound = { kind: 'file', uri: r.uri, name: KM.clip(r.name || 'קובץ מהטלפון', 60) };
    } else ui.draft.sound = kind === 'phone' ? { kind: 'phone' } : { kind: 'builtin', id: el.dataset.v };
    KM.renderSheet(); KM.render(true);
  };
  A['sound-preview'] = (el) => {
    const kind = el.dataset.kind;
    const s = kind === 'file' ? ui.draft.sound : kind === 'phone' ? { kind: 'phone' } : { kind: 'builtin', id: el.dataset.v };
    KM.AL.preview(s);
    if (!KM.isNative()) KM.toast('ההשמעה עובדת באפליקציה בטלפון');
  };

  // ---------- Save / cancel / test / delete ----------
  function problem(d) {
    const i = d.tasks.findIndex((t) => t.type === 'photo' && !t.ref);
    if (i >= 0) { KM.openSheet('photoSetup', { i }); return 'צריך לצלם את המקום לפני השמירה'; }
    return '';
  }

  A['edit-save'] = async () => {
    const d = ui.draft, err = problem(d);
    if (err) { KM.toast(err); return; }
    const a = KM.normalizeAlarm(Object.assign({}, d, { on: true }));
    const i = KM.state.alarms.findIndex((x) => x.id === a.id);
    if (i >= 0) KM.state.alarms[i] = a; else KM.state.alarms.push(a);
    KM.save();
    ui.draft = null;
    KM.closeSheet();
    ui.stack = [];
    ui.tab = 'home';
    KM.render();
    await KM.syncAlarms();
    KM.toast('השעון יצלצל ' + KM.untilText(KM.nextRing(a)), 3500);
  };
  A['edit-cancel'] = () => { ui.draft = null; KM.closeSheet(); KM.popView(); };
  A['edit-test'] = () => {
    const err = problem(ui.draft);
    if (err) { KM.toast(err); return; }
    KM.testAlarm(ui.draft);
  };
  A['edit-delete'] = () => KM.openSheet('deleteAlarm');
  A['edit-delete-yes'] = async () => {
    KM.state.alarms = KM.state.alarms.filter((a) => a.id !== ui.draft.id);
    KM.save();
    ui.draft = null;
    KM.closeSheet();
    ui.stack = [];
    KM.render();
    await KM.syncAlarms();
    KM.toast('השעון נמחק');
  };
})();
