/* Comparing two photos of the same place, on the phone, without internet.
   A photo becomes a small grey picture (64×48) plus a colour summary. Two photos match when their edges line
   up (allowing the phone to be held a little differently) and the colours are similar. Light changes
   (morning vs. evening) matter little, because edges and normalised brightness are compared, not raw colour. */
(function (root) {
  'use strict';
  const W = 64, H = 48;

  // rgba: Uint8ClampedArray of a W×H image → { g: grey 0..255 (W*H), hist: 64 colour bins (sum 1) }
  function signature(rgba) {
    const g = new Array(W * H), hist = new Array(64).fill(0);
    for (let i = 0, p = 0; i < W * H; i++, p += 4) {
      const r = rgba[p], gr = rgba[p + 1], b = rgba[p + 2];
      g[i] = Math.round(0.299 * r + 0.587 * gr + 0.114 * b);
      hist[(r >> 6) * 16 + (gr >> 6) * 4 + (b >> 6)]++;
    }
    return { g: blur(g), hist: hist.map((x) => Math.round((x / (W * H)) * 1000) / 1000) };
  }

  function blur(a) {
    const o = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < W && yy < H) { s += a[yy * W + xx]; n++; }
      }
      o[y * W + x] = Math.round(s / n);
    }
    return o;
  }

  function edges(a) {
    const o = new Array(W * H).fill(0);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx = a[i - W + 1] + 2 * a[i + 1] + a[i + W + 1] - a[i - W - 1] - 2 * a[i - 1] - a[i + W - 1];
      const gy = a[i + W - 1] + 2 * a[i + W] + a[i + W + 1] - a[i - W - 1] - 2 * a[i - W] - a[i - W + 1];
      o[i] = Math.sqrt(gx * gx + gy * gy);
    }
    return o;
  }

  // Normalised correlation of a and b with b shifted by (dx, dy), over the part where they overlap.
  function ncc(a, b, dx, dy) {
    let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
    for (let y = 2; y < H - 2; y++) {
      const yb = y + dy;
      if (yb < 2 || yb >= H - 2) continue;
      for (let x = 2; x < W - 2; x++) {
        const xb = x + dx;
        if (xb < 2 || xb >= W - 2) continue;
        const va = a[y * W + x], vb = b[yb * W + xb];
        sa += va; sb += vb; saa += va * va; sbb += vb * vb; sab += va * vb; n++;
      }
    }
    if (n < 200) return 0;
    const cov = sab - (sa * sb) / n, va = saa - (sa * sa) / n, vb = sbb - (sb * sb) / n;
    if (va <= 1e-6 || vb <= 1e-6) return 0;
    return cov / Math.sqrt(va * vb);
  }

  function best(a, b, r) {
    let m = -1;
    for (let dy = -r; dy <= r; dy += 1) for (let dx = -r; dx <= r; dx += 1) { const c = ncc(a, b, dx, dy); if (c > m) m = c; }
    return m;
  }

  // The picture zoomed in or out around its centre (a step closer or farther) and turned a little (the phone held at an angle).
  function transformed(a, s, deg) {
    if (s === 1 && !deg) return a;
    const o = new Array(W * H), cx = (W - 1) / 2, cy = (H - 1) / 2;
    const r = (deg * Math.PI) / 180, cos = Math.cos(r) / s, sin = Math.sin(r) / s;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x - cx, dy = y - cy;
      const sx = Math.min(W - 1.001, Math.max(0, cos * dx - sin * dy + cx)), sy = Math.min(H - 1.001, Math.max(0, sin * dx + cos * dy + cy));
      const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0, i = y0 * W + x0;
      o[y * W + x] = (a[i] * (1 - fx) + a[i + 1] * fx) * (1 - fy) + (a[i + W] * (1 - fx) + a[i + W + 1] * fx) * fy;
    }
    return o;
  }

  // 0..1 – how sure we are that both photos show the same place.
  function similarity(ref, shot) {
    if (!ref || !shot || !ref.g || !shot.g || ref.g.length !== W * H || shot.g.length !== W * H) return 0;
    const refEdges = edges(ref.g);
    let shape = 0;
    [0.9, 1, 1.11].forEach((s) => [-5, 0, 5].forEach((deg) => {
      const g = transformed(shot.g, s, deg);
      const v = 0.6 * Math.max(0, best(refEdges, edges(g), 4)) + 0.4 * Math.max(0, best(ref.g, g, 4));
      if (v > shape) shape = v;
    }));
    let hist = 0;
    if (ref.hist && shot.hist) for (let i = 0; i < 64; i++) hist += Math.min(ref.hist[i] || 0, shot.hist[i] || 0);
    return Math.round((0.9 * shape + 0.1 * hist) * 1000) / 1000;
  }

  // A flat, dark or blurry picture (a blanket, a ceiling, the lens covered) can't be a reference.
  function detail(sig) {
    if (!sig || !sig.g) return 0;
    const e = edges(sig.g);
    return Math.round(e.reduce((s, v) => s + v, 0) / e.length);
  }

  const api = { W, H, signature, similarity, detail, PASS: 0.5, MIN_DETAIL: 10 };
  if (root.KM) root.KM.match = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
