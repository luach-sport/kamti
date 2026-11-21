/* Saving the app data: two files written in turns, so a crash never loses everything. */
(function () {
  'use strict';
  const KM = window.KM;

  // The alarms, the mornings log and the settings live in a file in the app's private data folder. Two files are written in turns
  // (state-a / state-b) with a sequence number, so a crash mid-write never loses everything.
  const DIR = 'DATA';
  const BASE = 'kamti';
  const LS_KEY = 'kamti.state.v1';
  let seq = 0, slot = 'a';
  async function readFile(path) {
    try {
      const r = await KM.callRaw('Filesystem', 'readFile', { path: BASE + '/' + path, directory: DIR, encoding: 'utf8' });
      return r && typeof r.data === 'string' ? r.data : null;
    } catch (e) { return null; }
  }
  KM.loadState = async () => {
    if (KM.isNative()) {
      const docs = [];
      for (const s of ['a', 'b']) {
        const raw = await readFile('state-' + s + '.json');
        if (!raw) continue;
        try { const d = JSON.parse(raw); if (d && d.state) docs.push({ s, d }); } catch (e) { console.warn('state file', s, 'unreadable'); }
      }
      docs.sort((x, y) => (y.d.seq || 0) - (x.d.seq || 0));
      if (docs.length) {
        seq = docs[0].d.seq || 0;
        slot = docs[0].s === 'a' ? 'b' : 'a';
        return docs[0].d.state;
      }
      return null;
    }
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  };
  let saveTimer = null, writing = Promise.resolve();
  KM.saveState = (obj, now) => {
    const write = () => {
      saveTimer = null;
      const doc = { seq: ++seq, savedAt: Date.now(), app: KM.APP_ID, state: obj };
      const raw = JSON.stringify(doc);
      if (!KM.isNative()) { try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch (e) { console.warn('save', e); } return writing; }
      const target = 'state-' + slot + '.json';
      slot = slot === 'a' ? 'b' : 'a';
      writing = writing.then(() => KM.callRaw('Filesystem', 'writeFile', { path: BASE + '/' + target, data: raw, directory: DIR, encoding: 'utf8', recursive: true }))
        .catch((e) => console.warn('save failed', e && e.message));
      return writing;
    };
    clearTimeout(saveTimer);
    if (now) return write();
    saveTimer = setTimeout(write, 300);
    return writing;
  };
  KM.flushSave = () => { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; return KM.saveState(KM.state, true); } return writing; };
})();
