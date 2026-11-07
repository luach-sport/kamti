/* Taps, typing, number keys and holding the time arrows. Every button has data-action="name"; its function is KM.A[name]. */
(function () {
  'use strict';
  const KM = window.KM;
  const ui = KM.ui;
  let repeated = false;

  function onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = KM.A[el.dataset.action];
    if (!fn) return;
    e.preventDefault();
    if (el.getAttribute('aria-disabled') === 'true' || el.disabled) return;
    if (repeated && el.dataset.action === 'tp') { repeated = false; return; }
    fn(el, e);
  }

  function onInput(e) {
    const el = e.target;
    if (el.dataset.typeIn) { const R = KM.ring; if (R.ts && R.mode === 'task' && R.tasks[R.idx].type === 'type') KM.TASKS.type.input(R.ts, el.value); return; }
    if (el.dataset.draft && ui.draft) { ui.draft[el.dataset.draft] = el.value; return; }
    if (el.dataset.f && ui.sheet) ui.form[el.dataset.f] = el.value;
  }

  // Number keys (keypad phones, players, a keyboard) work in the sums task too.
  function onKey(e) {
    const R = KM.ring;
    if (R.mode === 'task' && R.ts && R.tasks[R.idx].type === 'math' && !(e.target && /input|textarea/i.test(e.target.tagName))) {
      let k = null;
      if (/^[0-9]$/.test(e.key)) k = e.key;
      else if (e.key === 'Backspace') k = 'del';
      else if (e.key === 'Enter') k = 'ok';
      if (k) { e.preventDefault(); KM.TASKS.math.key(R.ts, k); return; }
    }
    if (e.key === 'Escape' && ui.sheet && !KM.ringing()) KM.closeSheet();
  }

  // Holding an arrow of the time picker keeps changing the time.
  let holdT = null, rptT = null;
  function stopHold() { clearTimeout(holdT); clearInterval(rptT); holdT = rptT = null; }
  function onDown(e) {
    const el = e.target.closest('[data-action="tp"]');
    if (!el) return;
    stopHold(); repeated = false;
    holdT = setTimeout(() => { rptT = setInterval(() => { repeated = true; KM.A.tp(el); }, 90); }, 420);
  }

  KM.bindEvents = () => {
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => document.addEventListener(t, stopHold));
  };
})();
