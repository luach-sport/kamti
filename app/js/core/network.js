/* Online / offline status. */
(function () {
  'use strict';
  const KM = window.KM;

  let online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const netListeners = [];
  KM.online = () => online;
  KM.onNetwork = (cb) => netListeners.push(cb);
  function setOnline(v) {
    v = !!v;
    if (v === online) return;
    online = v;
    netListeners.forEach((cb) => { try { cb(v); } catch (e) { console.warn(e); } });
  }
  KM.initNetwork = async () => {
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    if (KM.isNative()) {
      const st = await KM.call('Network', 'getStatus');
      if (st && typeof st.connected === 'boolean') online = st.connected;
      KM.listen('Network', 'networkStatusChange', (s) => setOnline(s && s.connected));
    }
  };
})();
