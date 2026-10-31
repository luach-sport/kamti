/* Sharing the app with friends: a short personal message with the link to the app's site, or the app
   itself as an APK file (Bluetooth, WhatsApp, Nearby Share, file manager…).
   The APK file is the one installed on this phone, so it works without internet. If that copy can't be
   reached, the latest APK is downloaded from GitHub instead. */
(function () {
  'use strict';
  const KM = window.KM;
  const S = (KM.shareApp = {});
  const FILE = 'share/kamti.apk';

  S.text = 'היי! אני משתמש באפליקציה קמתי. זה שעון מעורר שלא נכבה עד שפותרים תרגיל, הולכים כמה צעדים או מנערים את הטלפון, ככה באמת קמים. עובד גם בלי אינטרנט. אשמח מאוד לשתף אותך:';
  S.message = () => S.text + '\n' + KM.SITE_URL;

  S.link = () => KM.shareText(S.message(), 'שיתוף קמתי');

  // Where Android installed this app: the line with base.apk in the process memory map.
  async function installedApk() {
    const r = await KM.callRaw('Filesystem', 'readFile', { path: '/proc/self/maps', encoding: 'utf8' });
    const m = String((r && r.data) || '').match(/(\/data\/app\/\S+?\/base\.apk)/);
    if (!m) throw new Error('no base.apk');
    return m[1];
  }

  async function prepareFile(onStatus) {
    try { await KM.callRaw('Filesystem', 'deleteFile', { path: FILE, directory: 'CACHE' }); } catch (e) { /* not there */ }
    await KM.fs.mkdir('share', 'CACHE');
    try {
      await KM.callRaw('Filesystem', 'copy', { from: await installedApk(), to: FILE, toDirectory: 'CACHE' });
    } catch (e) {
      console.warn('apk copy', e && (e.message || e));
      if (!KM.online()) throw new Error('offline');
      onStatus('מוריד את הקובץ…');
      await KM.callRaw('Filesystem', 'downloadFile', { url: KM.APK_URL, path: FILE, directory: 'CACHE', recursive: true });
    }
    const st = await KM.callRaw('Filesystem', 'stat', { path: FILE, directory: 'CACHE' });
    if (!st || st.size < 500000) throw new Error('small file');
    return (await KM.callRaw('Filesystem', 'getUri', { path: FILE, directory: 'CACHE' })).uri;
  }

  S.apk = async () => {
    if (!KM.isNative()) { window.open(KM.APK_URL, '_blank'); return true; }
    if (S.busy) return false;
    S.busy = true;
    KM.toast('מכין את הקובץ…', 8000);
    try {
      const uri = await prepareFile((t) => KM.toast(t, 30000));
      const t = KM.$('#toast-root'); if (t) t.innerHTML = '';
      await KM.callRaw('Share', 'share', { title: 'קמתי', text: S.message(), files: [uri], dialogTitle: 'שליחת האפליקציה כקובץ' });
      return true;
    } catch (e) {
      const msg = String(e && (e.message || e));
      if (/cancel/i.test(msg)) return false;
      console.warn('share apk', msg);
      KM.toast(msg === 'offline' ? 'אין אינטרנט כרגע. אפשר לשלוח קישור לאתר במקום' : 'לא הצלחתי להכין את הקובץ. אפשר לשלוח קישור לאתר במקום', 4000);
      return false;
    } finally {
      S.busy = false;
    }
  };
})();
