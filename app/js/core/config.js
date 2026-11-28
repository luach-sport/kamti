/* App identity, version and where feedback messages go. */
(function () {
  'use strict';
  const KM = (window.KM = window.KM || {});

  KM.VERSION = window.KAMTI_VERSION || { version: '1.0', build: 'dev' };
  KM.APP_ID = 'com.luachsport.kamti';
  KM.REPO = 'luach-sport/kamti';
  KM.SITE_URL = 'https://luach-sport.github.io/kamti/';
  // Feedback goes to the developer's own Google Apps Script (shared with MyCar and שמרתי), which e-mails only
  // the developer and says which app the message came from. No e-mail address ships in the app.
  KM.FEEDBACK_URL = 'https://script.google.com/macros/s/AKfycbwuxeoRQSIFoCfTrJqJ_QUeF1JANm0H4PY5Mc00Ns8hBm9K8lvJ2S5hBYQOVtA3lZX1lw/exec';
  KM.FEEDBACK_KEY = 'mc_9-ATPT_LPmYj188PGtCksaLh';
  KM.FEEDBACK_APP = 'kamti';
  // Nobody stopped it: the alarm gives up after this long (so it doesn't ring all day in an empty house).
  KM.AUTO_STOP_MIN = 60;
  // How long the "are you awake?" check waits for the button before the alarm comes back.
  KM.CHECK_SECONDS = 60;
})();
