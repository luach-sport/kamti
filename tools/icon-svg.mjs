// קמתי icon artwork: a yellow sun rising over a white horizon, on violet.
// Same drawing as KM.logo in www/js/core/icons.js (120x120 box). Helpers build every size/shape the app needs.
export const COLORS = { bg: '#5B3DF5', sun: '#FFC93C', line: '#FFFFFF' };

// Glyph in the 120x120 box: half sun centred at (60,76), five rays, the horizon at y 86 and a softer line under it.
export function glyph() {
  return `<path d="M36 76a24 24 0 0 1 48 0Z" fill="${COLORS.sun}"/>` +
    `<path d="M60 44v-8M82.6 53.4l5.7-5.7M37.4 53.4l-5.7-5.7M90.1 65l7.5-2.7M29.9 65l-7.5-2.7" stroke="${COLORS.sun}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M24 86h72" stroke="${COLORS.line}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M42 98h36" stroke="${COLORS.line}" stroke-opacity=".55" stroke-width="6" stroke-linecap="round"/>`;
}

// shape: 'square' (rounded square), 'circle', 'none' (transparent: adaptive-icon foreground)
// scale: glyph size relative to the drawing (1 = as drawn)
export function iconSvg({ size = 1024, shape = 'square', scale = 1 } = {}) {
  let bg = '';
  if (shape === 'square') bg = `<rect width="120" height="120" rx="30" fill="${COLORS.bg}"/>`;
  else if (shape === 'circle') bg = `<circle cx="60" cy="60" r="60" fill="${COLORS.bg}"/>`;
  const g = `<g transform="translate(60 60) scale(${scale}) translate(-60 -67)">${glyph()}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120">${bg}${g}</svg>`;
}

// The small white icon in the status bar while the alarm rings (Android draws it in one colour).
export function statusSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120"><g transform="translate(60 60) scale(1.15) translate(-60 -67)">` +
    `<path d="M36 76a24 24 0 0 1 48 0Z" fill="#fff"/><path d="M60 44v-8M82.6 53.4l5.7-5.7M37.4 53.4l-5.7-5.7" stroke="#fff" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M24 86h72" stroke="#fff" stroke-width="8" stroke-linecap="round"/></g></svg>`;
}
