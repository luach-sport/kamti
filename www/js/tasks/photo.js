/* Task: photograph the same place you saved when setting the alarm (the sink, the kettle, the front door).
   After 3 photos that don't match, you may switch to sums instead, so a dark morning never traps you. */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc, icon } = KM;
  const FAILS_BEFORE_ESCAPE = 3;

  function msg(s) {
    if (s.phase === 'checking') return 'בודק…';
    if (s.phase === 'nomatch') return 'זה לא נראה אותו מקום. עמוד כמו בתמונה הקטנה ונסה שוב.';
    return 'כוון את הטלפון כמו בתמונה הקטנה ולחץ "צילום"';
  }

  function controls(s) {
    let h = '<p class="task-msg' + (s.phase === 'nomatch' ? ' bad' : '') + '">' + msg(s) + '</p>' +
      '<button type="button" class="btn ring-btn" data-action="photo-shoot"' + (s.phase === 'checking' ? ' aria-disabled="true"' : '') + '>' + icon('camera') + 'צילום</button>';
    if (s.fails >= FAILS_BEFORE_ESCAPE) h += '<button type="button" class="btn ghost light" data-action="photo-escape">לא מצליח? פתור 5 תרגילים במקום</button>';
    return h;
  }

  KM.TASKS.photo = {
    init: (cfg) => ({ cfg, phase: 'cam', fails: 0 }),
    render: (s) => '<p class="task-lead">צלם את ' + esc(s.cfg.place || 'המקום ששמרת') + '</p>' +
      '<div class="cam-box"><video id="camv" autoplay muted playsinline></video>' +
      (s.cfg.ref && s.cfg.ref.thumb ? '<img class="cam-ref" src="' + esc(s.cfg.ref.thumb) + '" alt="התמונה ששמרת">' : '') + '</div>' +
      '<div id="photoCtl" class="photo-ctl">' + controls(s) + '</div>',
    onShow: async (s) => {
      const ok = await KM.cam.open('camv');
      if (!ok && KM.ring.ts === s) KM.taskFallback(KM.cam.error === 'denied' ? 'אין אישור למצלמה' : 'המצלמה לא נפתחה');
    },
    onHide: () => KM.cam.close(),
    shoot: async (s) => {
      if (s.phase === 'checking') return;
      const shot = KM.cam.grab('camv');
      if (!shot) return;
      s.phase = 'checking'; KM.part('photoCtl', controls(s));
      await KM.sleep(30);
      const score = KM.match.similarity(s.cfg.ref.sig, shot.sig);
      s.lastScore = score;
      if (score >= KM.match.PASS) { KM.taskDone(); return; }
      s.fails++; s.phase = 'nomatch';
      KM.part('photoCtl', controls(s));
    }
  };

  KM.A['photo-shoot'] = () => { const R = KM.ring; if (R.ts && R.tasks[R.idx].type === 'photo') KM.TASKS.photo.shoot(R.ts); };
  KM.A['photo-escape'] = () => {
    const R = KM.ring;
    if (!R.ts || R.ts.fails < FAILS_BEFORE_ESCAPE) return;
    KM.taskFallback('הצילום לא הצליח');
    R.tasks[R.idx].count = 5;
    R.ts.cfg.count = 5;
    KM.render();
  };
})();
