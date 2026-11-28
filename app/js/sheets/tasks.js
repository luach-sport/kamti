/* Sheets for the tasks: choosing a task to add, and a task's settings (level, how many). */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc, icon } = KM;
  const ui = KM.ui;

  KM.SHEETS.taskPick = {
    title: () => 'איזו משימה?',
    render: () => '<p class="fine" style="font-size:14px">המשימה היא מה שמכבה את השעון. כולן קלות, אבל אי אפשר לעשות אותן מתוך שינה.</p>' +
      '<div class="card list">' + KM.TASK_ORDER.map((type) => {
        const info = KM.TASK_INFO[type], blocked = KM.taskBlocked(type);
        return '<button type="button" class="row" data-action="task-add" data-v="' + type + '"' + (blocked ? ' aria-disabled="true"' : '') + '>' +
          '<span class="tile task-tile">' + icon(info.icon) + '</span><span class="grow"><span class="t b">' + esc(info.name) + '</span><span class="s">' + esc(blocked || info.desc) + '</span></span>' +
          (blocked ? '' : '<span class="chev">' + icon('plus', 'sm') + '</span>') + '</button>';
      }).join('') + '</div>'
  };

  // data: { i } = which task of the draft.
  KM.SHEETS.taskCfg = {
    title: (d) => KM.TASK_INFO[ui.draft.tasks[d.i].type].name,
    render: (d) => {
      const t = ui.draft.tasks[d.i], info = KM.TASK_INFO[t.type];
      let h = '<div class="task-hero"><span class="tile task-tile big">' + icon(info.icon, 'lg') + '</span><p>' + esc(info.desc) + '</p></div>';
      (KM.TASK_OPTIONS[t.type] || []).forEach((o) => {
        h += '<span class="section-label">' + esc(o.label) + '</span>';
        if (o.values.some((v) => v.s)) {
          h += '<div class="card list pick-list">' + o.values.map((v) => KM.pickRow('task-opt', v.v, v.l, t[o.key] === v.v, v.s, ' data-k="' + o.key + '"')).join('') + '</div>';
        } else {
          h += '<div class="seg" role="group" aria-label="' + esc(o.label) + '">' + o.values.map((v) => '<button type="button" data-action="task-opt" data-k="' + o.key + '" data-v="' + v.v + '" aria-pressed="' + (t[o.key] === v.v) + '">' + esc(v.l) + '</button>').join('') + '</div>';
        }
      });
      if (t.type === 'photo') {
        h += t.ref
          ? '<div class="card pad photo-ref"><img src="' + esc(t.ref.thumb) + '" alt="התמונה ששמרת"><span class="grow"><b>' + esc(t.place || 'המקום ששמרת') + '</b><span class="fine">בבוקר צריך לצלם את אותו מקום, מאותה זווית בערך.</span></span></div>' +
            '<button type="button" class="btn secondary" data-action="open-photo" data-i="' + d.i + '">' + icon('camera') + 'צילום מחדש</button>'
          : '<button type="button" class="btn" data-action="open-photo" data-i="' + d.i + '">' + icon('camera') + 'צילום המקום עכשיו</button>';
      }
      if (t.type === 'steps' || t.type === 'shake') h += '<p class="fine">אם חיישן התנועה לא יענה בבוקר, המשימה תתחלף לבד לתרגילי חשבון, כדי שלא תיתקע.</p>';
      if (t.type === 'type') h += '<p class="fine">משווים בלי ניקוד ובלי סימני פיסוק. בטלפון עם מקשים אפשר להקליד גם במקלדת של הטלפון.</p>';
      h += '<button type="button" class="btn" data-action="close-sheet">' + icon('check') + 'סיום</button>';
      return h;
    }
  };
})();
