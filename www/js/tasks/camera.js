/* The camera inside the app (no camera app is opened, so the alarm screen stays in front).
   Used to save the place's photo when setting the alarm, and to photograph it again in the morning. */
(function () {
  'use strict';
  const KM = window.KM;
  const C = (KM.cam = { stream: null });

  // Starts the back camera into <video id=…>. Resolves to true, or false with C.error set.
  C.open = async (videoId) => {
    C.close();
    C.error = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { C.error = 'nocam'; return false; }
    try {
      C.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    } catch (e) {
      C.error = /NotAllowed|Permission|Security/i.test(String(e && (e.name || e.message))) ? 'denied' : 'nocam';
      return false;
    }
    const v = document.getElementById(videoId);
    if (!v) { C.close(); return false; }
    v.srcObject = C.stream;
    v.setAttribute('playsinline', ''); v.muted = true;
    try { await v.play(); } catch (e) { /* plays once visible */ }
    return true;
  };

  C.close = () => {
    if (C.stream) { try { C.stream.getTracks().forEach((t) => t.stop()); } catch (e) { /* already stopped */ } }
    C.stream = null;
  };

  // The current frame: { sig, thumb } (sig for comparing, thumb = small JPEG to show).
  C.grab = (videoId) => {
    const v = document.getElementById(videoId);
    if (!v || !v.videoWidth) return null;
    return KM.photoFrom(v, v.videoWidth, v.videoHeight);
  };

  // From any picture source (video, image, canvas): cut to 4:3 in the middle, then the signature and a thumbnail.
  KM.photoFrom = (src, w, h) => {
    const M = KM.match;
    let cw = w, ch = Math.round(w * 3 / 4);
    if (ch > h) { ch = h; cw = Math.round(h * 4 / 3); }
    const sx = Math.round((w - cw) / 2), sy = Math.round((h - ch) / 2);
    const small = document.createElement('canvas');
    small.width = M.W; small.height = M.H;
    const sc = small.getContext('2d', { willReadFrequently: true });
    sc.drawImage(src, sx, sy, cw, ch, 0, 0, M.W, M.H);
    const sig = M.signature(sc.getImageData(0, 0, M.W, M.H).data);
    const t = document.createElement('canvas');
    t.width = 240; t.height = 180;
    t.getContext('2d').drawImage(src, sx, sy, cw, ch, 0, 0, 240, 180);
    return { sig, thumb: t.toDataURL('image/jpeg', 0.72) };
  };

  C.errorText = () => (C.error === 'denied'
    ? 'אין אישור להשתמש במצלמה. אפשר לאשר בהגדרות הטלפון ← אפליקציות ← קמתי ← הרשאות.'
    : 'לא הצלחתי לפתוח את המצלמה.');
})();
