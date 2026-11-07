/* Small helpers: escaping, ids, timing, numbers, random. */
(function () {
  'use strict';
  const KM = window.KM;

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  KM.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  KM.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  KM.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  KM.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  KM.isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
  KM.fmt = (n) => new Intl.NumberFormat('he-IL').format(n);
  KM.isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  KM.str = (v, n) => String(v == null ? '' : v).slice(0, n);
  KM.clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  KM.int = (v, def, min, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? KM.clamp(n, min, max) : def; };
  KM.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  KM.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  KM.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  KM.copy = (o) => JSON.parse(JSON.stringify(o));
})();
