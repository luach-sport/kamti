/* Task: type a sentence ("מודה אני", or a short good-morning sentence that changes every day). */
(function () {
  'use strict';
  const KM = window.KM;
  const { esc } = KM;

  KM.MODEH = 'מודה אני לפניך מלך חי וקיים שהחזרת בי נשמתי בחמלה רבה אמונתך';
  KM.MORNING_LINES = [
    'בוקר טוב! קמתי ואני ער לגמרי',
    'היום הולך להיות יום טוב ומוצלח',
    'אני קם עכשיו ולא חוזר למיטה',
    'כל התחלה קשה, אבל אני כבר ער',
    'קמתי בזמן ואני מוכן ליום חדש',
    'עוד רגע שותים משהו חם ומתחילים',
    'השמש זורחת ואני כבר על הרגליים'
  ];

  // Compare loosely: no vowel marks, no punctuation, one space between words.
  KM.typeNorm = (s) => String(s || '').replace(/[֑-ׇ]/g, '').replace(/[^א-תa-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

  // How much of the target is already typed correctly (in normalized letters).
  KM.typeProgress = (target, typed) => {
    const a = KM.typeNorm(target), b = KM.typeNorm(typed);
    let i = 0;
    while (i < b.length && i < a.length && a[i] === b[i]) i++;
    return { ok: i, total: a.length, wrong: b.length > i };
  };

  function marked(target, ok) {
    // Highlight the correct part of the target, word by word.
    const words = KM.typeNorm(target).split(' ');
    let pos = 0;
    return words.map((w) => {
      const start = pos; pos += w.length + 1;
      const cls = ok >= start + w.length ? 'done' : ok > start ? 'part' : '';
      return '<span class="' + cls + '">' + esc(w) + '</span>';
    }).join(' ');
  }

  KM.TASKS.type = {
    init: (cfg) => {
      const day = Math.floor(Date.now() / 864e5);
      const text = cfg.text === 'modeh' ? KM.MODEH : KM.MORNING_LINES[day % KM.MORNING_LINES.length];
      return { cfg, text, typed: '' };
    },
    render: (s) => {
      const p = KM.typeProgress(s.text, s.typed);
      return '<p class="task-lead">הקלד את המשפט</p>' +
        '<div class="type-target" id="typeTarget">' + marked(s.text, p.ok) + '</div>' +
        '<textarea class="input type-in" id="typeIn" data-type-in="1" rows="3" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="מקלידים כאן…">' + esc(s.typed) + '</textarea>' +
        '<p class="task-msg" id="typeMsg">' + (p.wrong ? 'יש טעות. מחק עד המקום המסומן והמשך' : 'בלי ניקוד ובלי סימני פיסוק') + '</p>';
    },
    onShow: () => { const t = KM.$('#typeIn'); if (t) setTimeout(() => t.focus(), 150); },
    input: (s, value) => {
      s.typed = value;
      const p = KM.typeProgress(s.text, s.typed);
      if (p.ok >= p.total && !p.wrong) { KM.taskDone(); return; }
      const tgt = KM.$('#typeTarget'); if (tgt) tgt.innerHTML = marked(s.text, p.ok);
      const m = KM.$('#typeMsg'); if (m) m.textContent = p.wrong ? 'יש טעות. מחק עד המקום המסומן והמשך' : 'בלי ניקוד ובלי סימני פיסוק';
    }
  };
})();
