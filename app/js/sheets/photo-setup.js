/* Saving the place to photograph in the morning: live camera → photo → a name for the place. */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc, icon } = KM;
  const ui = KM.ui;

  function body() {
    const f = ui.form;
    if (f.err) return '<div class="notice accent">' + icon('alert', 'sm') + '<span class="grow">' + esc(f.err) + '</span></div>';
    if (!f.shot) {
      return '<div class="cam-box setup"><video id="camset" autoplay muted playsinline></video></div>' +
        '<p class="fine" style="font-size:13px">בחרו מקום רחוק מהמיטה עם פרטים ברורים: הכיור, הקומקום, המקרר, הדלת. כדאי לצלם באור שיהיה בבוקר.</p>' +
        '<button type="button" class="btn" data-action="photo-take">' + icon('camera') + 'צילום</button>';
    }
    return '<div class="cam-box setup"><img src="' + esc(f.shot.thumb) + '" alt="התמונה שצולמה"></div>' +
      (f.lowDetail ? '<div class="notice accent">' + icon('alert', 'sm') + '<span class="grow">התמונה חשוכה או ריקה מדי. צלמו משהו עם יותר פרטים, אחרת יהיה קשה לזהות אותו בבוקר.</span></div>' : '') +
      '<div class="field"><label for="pplace">מה צילמתם?</label><input id="pplace" class="input" data-f="place" maxlength="30" value="' + esc(f.place) + '" placeholder="למשל: הכיור במטבח"></div>' +
      '<div class="btn-row"><button type="button" class="btn secondary" data-action="photo-retake">' + icon('refresh') + 'שוב</button>' +
      '<button type="button" class="btn" data-action="photo-save"' + (f.lowDetail ? ' aria-disabled="true"' : '') + '>' + icon('check') + 'שמירה</button></div>';
  }

  KM.SHEETS.photoSetup = {
    full: true,
    title: () => 'צילום המקום',
    init: (d) => { const t = ui.draft.tasks[d.i]; ui.form = { i: d.i, place: t.place || '', shot: null, err: '', lowDetail: false }; },
    render: () => body(),
    onShow: () => KM.photoSetupCamera(),
    onClose: () => KM.cam.close()
  };

  KM.photoSetupCamera = async () => {
    const ok = await KM.cam.open('camset');
    if (!ok && KM.sheetIs('photoSetup')) { ui.form.err = KM.cam.errorText(); KM.renderSheet(); }
  };

  KM.A['photo-take'] = () => {
    const shot = KM.cam.grab('camset');
    if (!shot) return;
    KM.cam.close();
    ui.form.shot = shot;
    ui.form.lowDetail = KM.match.detail(shot.sig) < KM.match.MIN_DETAIL;
    KM.renderSheet();
  };
  KM.A['photo-retake'] = () => { ui.form.shot = null; ui.form.lowDetail = false; KM.renderSheet(); KM.photoSetupCamera(); };
  KM.A['photo-save'] = () => {
    const f = ui.form, t = ui.draft.tasks[f.i];
    if (!f.shot || f.lowDetail || !t) return;
    t.ref = { sig: f.shot.sig, thumb: f.shot.thumb, at: Date.now() };
    t.place = KM.clip(f.place, 30);
    KM.openSheet('taskCfg', { i: f.i });
    KM.render(true);
    KM.toast('המקום נשמר');
  };
})();
