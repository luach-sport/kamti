/* Buttons on the ringing screen: start the tasks, snooze (when allowed), close "good morning", "I'm awake". */
(function () {
  'use strict';
  const KM = window.KM;
  const A = KM.A;

  A['ring-start'] = () => { if (KM.ring.mode === 'ring') KM.taskStart(); };
  A['ring-snooze'] = () => KM.ringSnooze();
  A['ring-close'] = () => KM.ringClose();
  A['check-confirm'] = () => { if (KM.ring.mode === 'check') KM.checkConfirm(); };
})();
