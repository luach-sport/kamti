/* Bottom sheets (dialogs). Each sheet in js/sheets/ has: title(), render(), and optional init(), onClose(), onShow(), full. */
(function () {
  'use strict';
  const KM = window.KM;
  const ui = KM.ui;
  const SHEETS = KM.SHEETS;

  KM.openSheet = (name, data) => {
    if (ui.sheet) KM.closeSheet();
    ui.sheet = { name, data: data || {} };
    if (SHEETS[name].init) SHEETS[name].init(ui.sheet.data);
    KM.renderSheet();
    const first = KM.$('#sheet-root [autofocus]');
    if (first) setTimeout(() => first.focus(), 80);
    if (SHEETS[name].onShow) SHEETS[name].onShow(ui.sheet.data);
  };

  KM.closeSheet = () => {
    if (!ui.sheet) return;
    const def = SHEETS[ui.sheet.name];
    ui.sheet = null;
    if (def.onClose) def.onClose();
    KM.$('#sheet-root').innerHTML = '';
  };

  KM.renderSheet = () => {
    const root = KM.$('#sheet-root');
    if (!ui.sheet) { root.innerHTML = ''; return; }
    const def = SHEETS[ui.sheet.name];
    const body = def.render(ui.sheet.data);
    const prev = root.querySelector('.sheet');
    const st = prev ? prev.scrollTop : 0;
    const title = def.title(ui.sheet.data);
    root.innerHTML = '<div class="sheet-wrap"><div class="sheet-backdrop" data-action="close-sheet"></div>' +
      '<div class="sheet' + (def.full ? ' full' : '') + '" role="dialog" aria-modal="true" aria-label="' + KM.esc(title) + '">' +
      '<div class="grabber" aria-hidden="true"></div>' +
      '<div class="sheet-head"><button type="button" class="icon-btn" aria-label="סגירה" data-action="close-sheet">' + KM.icon('close') + '</button><h2>' + KM.esc(title) + '</h2></div>' +
      body + '</div></div>';
    if (prev) {
      const s = root.querySelector('.sheet');
      if (s) { s.style.animation = 'none'; s.scrollTop = st; const b = root.querySelector('.sheet-backdrop'); if (b) b.style.animation = 'none'; }
    }
  };
  KM.sheetIs = (name) => !!ui.sheet && ui.sheet.name === name;

  // A list row that can be picked (used by several sheets).
  KM.pickRow = (action, v, label, on, sub, extra) => '<button type="button" class="row" data-action="' + action + '" data-v="' + KM.esc(v) + '" aria-pressed="' + on + '"' + (extra || '') + '>' +
    '<span class="grow"><span class="t">' + KM.esc(label) + '</span>' + (sub ? '<span class="s">' + KM.esc(sub) + '</span>' : '') + '</span>' + (on ? '<span class="check">' + KM.icon('check') + '</span>' : '') + '</button>';
})();
