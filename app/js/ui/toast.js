/* Short messages at the bottom of the screen. */
(function () {
  'use strict';
  const KM = window.KM;
  let timer;

  KM.toast = (msg, ms) => {
    const root = KM.$('#toast-root');
    root.innerHTML = '<div class="toast">' + KM.esc(msg) + '</div>';
    clearTimeout(timer);
    timer = setTimeout(() => { root.innerHTML = ''; }, ms || 2600);
  };
})();
