/* Opening links, the Android share menu, a light vibration on taps. */
(function () {
  'use strict';
  const KM = window.KM;

  KM.openExternal = async (url) => {
    if (KM.isNative()) {
      try { await KM.callRaw('AppLauncher', 'openUrl', { url }); return true; } catch (e) { console.warn('openUrl', e && e.message); }
    }
    try { window.open(url, '_blank', 'noopener'); return true; } catch (e) { return false; }
  };
  KM.writeClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* older WebView */ }
    try {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      const ok = document.execCommand('copy');
      t.remove();
      return ok;
    } catch (e) { return false; }
  };
  KM.shareText = async (text, title) => {
    if (KM.isNative()) { try { await KM.callRaw('Share', 'share', { text, title, dialogTitle: title || 'שיתוף' }); return true; } catch (e) { return false; } }
    if (navigator.share) { try { await navigator.share({ text, title }); return true; } catch (e) { return false; } }
    const ok = await KM.writeClipboard(text);
    if (ok && KM.toast) KM.toast('הועתק ללוח');
    return ok;
  };
  KM.haptic = () => { if (KM.isNative()) KM.call('Haptics', 'impact', { style: 'LIGHT' }); };
})();
