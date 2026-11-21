/* Drawing the current screen: the alarm when it rings (over everything), a page on top (alarm editor, setup),
   or a tab (alarms, mornings log, settings). */
(function () {
  'use strict';
  const KM = window.KM;
  const ui = KM.ui;

  const scrollKey = () => { const v = KM.view(); return v ? v.name + (v.id || '') : 'tab-' + ui.tab; };

  function screenHtml() {
    const V = KM.views, v = KM.view();
    if (v && v.name === 'edit') return V.edit();
    if (v && v.name === 'setup') return V.setup();
    if (ui.tab === 'log') return V.log();
    if (ui.tab === 'settings') return V.settings();
    return V.home();
  }

  // Screens that keep live parts (camera picture, typing) are not redrawn while the same task is on.
  const LIVE = { photo: 1, type: 1 };
  function ringKey() {
    const R = KM.ring, t = R.tasks && R.tasks[R.idx];
    return 'ring:' + R.key + ':' + R.mode + ':' + R.idx + ':' + (t ? t.type : '');
  }

  // keepScroll: true = stay where you are, 'restore' = back to where this screen was left, else top.
  KM.render = (keepScroll) => {
    const main = KM.$('#screen');
    if (KM.ringing()) {
      const key = ringKey(), t = KM.ring.tasks && KM.ring.tasks[KM.ring.idx];
      if (KM.ring.mode === 'task' && t && LIVE[t.type] && main.dataset.key === key) return;
      document.body.classList.add('ringing', 'no-tabs');
      main.classList.add('pushed');
      main.innerHTML = KM.views.ring();
      main.dataset.key = key;
      KM.$('#fab-root').innerHTML = '';
      KM.applyTheme();
      return;
    }
    const wasRinging = document.body.classList.contains('ringing');
    document.body.classList.remove('ringing');
    if (wasRinging) KM.applyTheme();
    const v = KM.view();
    const prevKey = main.dataset.key;
    if (prevKey && !prevKey.startsWith('ring:')) ui.scroll[prevKey] = window.scrollY;
    document.body.classList.toggle('no-tabs', !!v);
    main.classList.toggle('pushed', !!v);
    main.innerHTML = screenHtml();
    const key = scrollKey();
    main.dataset.key = key;
    KM.$('#fab-root').innerHTML = !v && ui.tab === 'home' && KM.state.alarms.length ? KM.views.fab() : '';
    document.querySelectorAll('#tabs button[data-tab]').forEach((b) => {
      if (b.getAttribute('data-tab') === ui.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (keepScroll === true && prevKey === key) window.scrollTo(0, ui.scroll[key] || 0);
    else if (keepScroll === 'restore') window.scrollTo(0, ui.scroll[key] || 0);
    else window.scrollTo(0, 0);
  };

  KM.pushView = (v) => { ui.scroll[scrollKey()] = window.scrollY; ui.stack.push(v); KM.render(); };
  KM.popView = () => { ui.stack.pop(); KM.render('restore'); };
  // Replaces just one part of the screen (keeps typing focus, the camera and scroll).
  KM.part = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
})();
