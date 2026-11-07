/* Sheets for an alarm's settings: sound, snooze, the awake check, picking an hour or minutes, deleting. */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc, icon } = KM;
  const ui = KM.ui;

  KM.SHEETS.sound = {
    title: () => 'צליל',
    render: () => {
      const s = ui.draft.sound;
      const row = (kind, id, label, sub) => {
        const on = s.kind === kind && (kind !== 'builtin' || s.id === id);
        return '<div class="row snd-row"><button type="button" class="grow plain" data-action="sound-pick" data-kind="' + kind + '" data-v="' + (id || '') + '" aria-pressed="' + on + '"><span class="t">' + esc(label) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</button>' +
          (on ? '<span class="check">' + icon('check') + '</span>' : '') +
          (kind !== 'file' || s.kind === 'file' ? '<button type="button" class="icon-btn" data-action="sound-preview" data-kind="' + kind + '" data-v="' + (id || '') + '" aria-label="השמעה">' + icon('play', 'sm') + '</button>' : '') + '</div>';
      };
      return '<div class="card list pick-list">' + KM.SOUNDS.map((x) => row('builtin', x.id, x.name)).join('') +
        row('phone', '', 'הצלצול של הטלפון', 'הצליל שמוגדר בטלפון לשעונים מעוררים') +
        row('file', '', s.kind === 'file' ? 'שיר מהטלפון: ' + (s.name || 'קובץ') : 'שיר או הקלטה מהטלפון…', 'בוחרים קובץ שמע מהתיקיות של הטלפון') + '</div>' +
        '<p class="fine">ההשמעה כאן בעוצמה של הטלפון. כשהשעון מצלצל באמת, העוצמה עולה למקסימום וננעלת.</p>' +
        '<button type="button" class="btn" data-action="close-sheet">' + icon('check') + 'סיום</button>';
    },
    onClose: () => KM.AL.stopPreview()
  };

  KM.SHEETS.snooze = {
    title: () => 'דחייה (נודניק)',
    render: () => {
      const d = ui.draft;
      return '<p class="fine" style="font-size:14px">בלי דחייה, רק המשימה מכבה את השעון. אם מאפשרים, אפשר לדחות כמה פעמים, והמשימה עדיין מחכה בסוף.</p>' +
        '<span class="section-label">כמה פעמים מותר לדחות</span><div class="seg">' + [0, 1, 2, 3].map((n) => '<button type="button" data-action="set-draft" data-k="snooze" data-v="' + n + '" aria-pressed="' + (d.snooze === n) + '">' + (n ? n : 'בלי') + '</button>').join('') + '</div>' +
        (d.snooze ? '<span class="section-label">לכמה זמן</span><div class="seg">' + [3, 5, 10].map((n) => '<button type="button" data-action="set-draft" data-k="snoozeMin" data-v="' + n + '" aria-pressed="' + (d.snoozeMin === n) + '">' + n + ' דק׳</button>').join('') + '</div>' : '') +
        '<button type="button" class="btn" data-action="close-sheet">' + icon('check') + 'סיום</button>';
    }
  };

  KM.SHEETS.check = {
    title: () => 'בדיקת ערנות',
    render: () => {
      const d = ui.draft;
      return '<p class="fine" style="font-size:14px">כמה דקות אחרי שסיימת את המשימה, קופץ מסך "אתה עדיין ער?" עם צפצוף. יש דקה ללחוץ "כן, אני ער!". לא לחצת? השעון חוזר לצלצל במלוא העוצמה, עם המשימה.</p>' +
        '<div class="card list pick-list">' + [0, 3, 5, 10, 15].map((n) => KM.pickRow('set-draft', n, n ? 'אחרי ' + n + ' דקות' : 'כבויה', d.check === n, n === 5 ? 'מומלץ' : '', ' data-k="check"')).join('') + '</div>' +
        '<button type="button" class="btn" data-action="close-sheet">' + icon('check') + 'סיום</button>';
    }
  };

  // data: { k: 'h' | 'm' }
  KM.SHEETS.pickTime = {
    title: (d) => (d.k === 'h' ? 'בחירת שעה' : 'בחירת דקות'),
    render: (d) => {
      const vals = [];
      if (d.k === 'h') for (let i = 0; i < 24; i++) vals.push(i); else for (let i = 0; i < 60; i += 5) vals.push(i);
      const cur = ui.draft[d.k];
      return '<div class="num-grid ltr' + (d.k === 'h' ? ' h' : '') + '">' + vals.map((v) => '<button type="button" data-action="pick-time" data-k="' + d.k + '" data-v="' + v + '" aria-pressed="' + (cur === v) + '">' + KM.p2(v) + '</button>').join('') + '</div>' +
        (d.k === 'm' ? '<p class="fine">לדקה מדויקת אפשר ללחוץ על החיצים מעל ומתחת למספר.</p>' : '');
    }
  };

  KM.SHEETS.deleteAlarm = {
    title: () => 'למחוק את השעון?',
    render: () => '<p class="fine" style="font-size:15px">השעון של ' + KM.hm(ui.draft.h, ui.draft.m) + (ui.draft.label ? ' (' + esc(ui.draft.label) + ')' : '') + ' יימחק ולא יצלצל יותר.</p>' +
      '<div class="btn-row"><button type="button" class="btn secondary" data-action="close-sheet">ביטול</button><button type="button" class="btn danger" data-action="edit-delete-yes">' + icon('trash') + 'מחיקה</button></div>'
  };
})();
