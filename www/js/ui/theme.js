/* Light / dark / follow the phone, including the phone's status bar colour. The ringing screen is always night-dark. */
(function () {
  'use strict';
  const KM = window.KM;
  const BG = { light: '#F4F3FA', dark: '#111019', ring: '#0D0B1E' };

  KM.resolvedTheme = () => {
    const t = KM.state.settings.theme;
    if (t === 'system') return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return t;
  };

  KM.applyTheme = () => {
    const ringing = document.body.classList.contains('ringing');
    const t = ringing ? 'dark' : KM.resolvedTheme();
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('kamti.theme', KM.state.settings.theme); } catch (e) { /* ignore */ }
    const bg = ringing ? BG.ring : BG[t];
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
    if (KM.isNative()) {
      KM.call('StatusBar', 'setBackgroundColor', { color: bg });
      KM.call('StatusBar', 'setStyle', { style: t === 'dark' ? 'DARK' : 'LIGHT' });
    }
  };

  KM.watchSystemTheme = () => {
    if (!window.matchMedia) return;
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (KM.state.settings.theme === 'system') KM.applyTheme(); }); } catch (e) { /* old WebView */ }
  };
})();
