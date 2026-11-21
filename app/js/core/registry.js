/* Registries the other files fill in: screens (views), bottom sheets (SHEETS), button actions (A) and tasks (TASKS). */
(function () {
  'use strict';
  const KM = window.KM;
  KM.views = KM.views || {};
  KM.SHEETS = KM.SHEETS || {};
  KM.A = KM.A || {};
  KM.TASKS = KM.TASKS || {};
  KM.$ = (sel, root) => (root || document).querySelector(sel);
})();
