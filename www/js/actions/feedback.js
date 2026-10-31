/* Feedback form actions: type, send, try again. */
(function () {
  'use strict';
  const KM = window.KM;
  const A = KM.A;
  const ui = KM.ui;

  A['fb-type'] = (el) => { ui.form.type = el.dataset.v; KM.renderSheet(); };
  A['feedback-retry'] = async () => {
    if (!KM.online()) { KM.toast('אין חיבור כרגע'); return; }
    const n = await KM.flushOutbox();
    KM.toast(n ? 'נשלח. תודה!' : 'עדיין לא הצלחתי לשלוח. ננסה שוב לבד.');
  };
  A['send-feedback'] = async () => {
    if (KM.feedbackBusy()) return;
    const f = ui.form, err = KM.feedbackErrors(f);
    f.err = err;
    if (Object.keys(err).length) { KM.renderSheet(); return; }
    KM.state.profile = { name: f.name.trim(), email: f.email.trim() };
    KM.state.outbox.push({ id: KM.uid(), ts: Date.now(), type: f.type, name: f.name.trim(), email: f.email.trim(), message: f.message.trim(), status: 'pending' });
    KM.state.outbox = KM.state.outbox.slice(-30);
    KM.save();
    f.message = ''; f.err = {};
    KM.renderSheet();
    if (!KM.online()) { KM.toast('נשמר. הפנייה תישלח כשיחזור האינטרנט'); return; }
    KM.toast('שולח…', 8000);
    const n = await KM.flushOutbox();
    KM.toast(n ? 'תודה! הפנייה נשלחה' : 'לא הצלחתי לשלוח כרגע. ננסה שוב לבד.');
  };
})();
