/*
 * App shell: personas, routing (#/persona/screen), rendering and event wiring.
 * Load order (see index.html): data → store → ai → ui → views → guide → app.
 */
window.App = window.App || {};

(function (App) {
  const { esc, icon, btn, toast, closeModal, clock, H } = App.ui;

  App.personas = [
    { id: 'prospect', name: 'Ananya', role: 'Lead on WhatsApp', icon: 'whatsapp', group: 'Learner', screens: [['chat', 'WhatsApp qualifier', 'L1']] },
    { id: 'learner', name: 'Ananya', role: 'Learner', icon: 'user', group: 'Learner', screens: [['home', 'Home', 'L2'], ['recaps', 'Recaps', 'L3'], ['ask', 'Ask Sapiens', 'L4'], ['project', 'Project', 'L5']] },
    { id: 'counselor', name: 'Riya', role: 'Counselor', icon: 'funnel', group: 'Staff', screens: [['leads', 'Lead pipeline', 'S1']] },
    { id: 'manager', name: 'Vikram', role: 'Program manager', icon: 'users', group: 'Staff', screens: [['match', 'Mentor Match', 'S2'], ['recaps', 'Recaps to check', 'S2']] },
    { id: 'coordinator', name: 'Neel', role: 'Coordinator', icon: 'inbox', group: 'Staff', screens: [['inbox', 'Support inbox', 'S3']] },
    { id: 'evaluator', name: 'Kavya', role: 'Evaluator', icon: 'clip', group: 'Staff', screens: [['review', 'Review Desk', 'S4']] },
    { id: 'knowledge', name: 'Farah', role: 'Knowledge owner', icon: 'book', group: 'Staff', screens: [['kb', 'One Source', 'S5']] },
    { id: 'founder', name: 'Founder', role: 'Leadership', icon: 'chart', group: 'Leadership', screens: [['dash', 'Dashboard', 'M1']] },
  ];
  const persona = (id) => App.personas.find((p) => p.id === id) || App.personas[0];

  // Small badge counts on the persona bar, so you can see work arriving
  function badge(id) {
    const s = App.state;
    if (id === 'counselor') return s.leads.filter((l) => !l.firstContactAt && l.stage !== 'enrolled').length;
    if (id === 'manager') return App.sel.waiting().length + s.recaps.filter((r) => r.status === 'draft').length;
    if (id === 'coordinator') return App.sel.openHandoffs().length;
    if (id === 'evaluator') return App.sel.inReview().length;
    if (id === 'knowledge') return s.gaps.length + s.kb.filter((a) => App.sel.kbStatus(a) === 'overdue').length;
    return 0;
  }

  // ---------- routing ----------
  App.go = function (personaId, screen) {
    const p = persona(personaId);
    const sc = p.screens.find((x) => x[0] === screen) ? screen : p.screens[0][0];
    App.state.persona = p.id;
    App.state.screen = sc;
    // Flags the guided demo uses
    if (p.id === 'founder') {
      const last = App.guideSteps.length - 1;
      if (App.guideSteps.slice(0, last).every((st) => st.done())) App.state.flags.sawDashboard = true;
    }
    const hash = `#/${p.id}/${sc}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    App.commit();
    window.scrollTo({ top: 0 });
  };
  function fromHash() {
    const m = location.hash.match(/^#\/([a-z]+)\/([a-z]+)/);
    if (m) { App.state.persona = persona(m[1]).id; App.state.screen = m[2]; }
  }

  // ---------- render ----------
  App.commit = function () { App.save(); App.render(); };

  App.render = function () {
    const s = App.state;
    const p = persona(s.persona);
    if (!p.screens.find((x) => x[0] === s.screen)) s.screen = p.screens[0][0];

    document.getElementById('clock').innerHTML = `${icon('clock')} ${clock(App.now())}${s.clockOffset ? ` <span class="ahead">+${Math.round(s.clockOffset / H)} h</span>` : ''}`;

    document.getElementById('personas').innerHTML = App.personas.map((x) => {
      const n = badge(x.id);
      return `<button type="button" class="persona ${x.id === p.id ? 'active' : ''}" data-action="go" data-persona="${x.id}" aria-pressed="${x.id === p.id}">
        <span class="p-ico">${icon(x.icon)}</span><span class="p-txt"><b>${esc(x.name)}</b><small>${esc(x.role)}</small></span>${n ? `<span class="count">${n}</span>` : ''}</button>`;
    }).join('');

    const tabs = p.screens.length > 1
      ? `<nav class="screen-tabs" aria-label="Screens">${p.screens.map(([id, label, code]) => `<button type="button" class="tab ${id === s.screen ? 'active' : ''}" data-action="go" data-persona="${p.id}" data-screen="${id}">${esc(label)} <small>${code}</small></button>`).join('')}</nav>`
      : `<nav class="screen-tabs"><span class="tab active static">${esc(p.screens[0][1])} <small>${p.screens[0][2]}</small></span></nav>`;

    let view = '';
    try {
      view = App.views[p.id][s.screen](s);
    } catch (e) {
      console.error(e);
      view = `<div class="card"><h3>Something went wrong on this screen.</h3><p class="muted">${esc(e.message)}</p>${btn('Reset demo', 'reset')}</div>`;
    }

    document.getElementById('app').innerHTML = `${App.guideBanner()}
      <div class="screen-head"><div><h1>${esc(p.name)} <span class="muted">· ${esc(p.role)}</span></h1></div>${tabs}</div>${view}`;

    App.renderGuide();
    document.querySelectorAll('[data-scroll="bottom"]').forEach((el) => { el.scrollTop = el.scrollHeight; });
  };

  // ---------- global actions ----------
  Object.assign(App.actions, {
    go: (d) => App.go(d.persona, d.screen),
    reset: () => {
      if (!confirm('Reset the demo to the start? Everything you did will be cleared.')) return;
      App.reset(); App.go('prospect', 'chat'); toast('Demo reset. Ananya is a new lead again.');
    },
    forward: () => { App.do.clockForward(H); App.commit(); toast('Clock moved forward 1 hour. Watch the timers and promises.'); },
    closeModal: () => closeModal(),
  });

  // ---------- events (one delegated listener per event type) ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) { if (e.target.id === 'modal') closeModal(); return; }
    const fn = App.actions[el.dataset.action];
    if (!fn) { console.warn('No action named', el.dataset.action); return; }
    e.preventDefault();
    fn(Object.assign({}, el.dataset), el, e);
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-submit]');
    if (!form) return;
    e.preventDefault();
    const fn = App.actions[form.dataset.submit];
    if (fn) fn(Object.fromEntries(new FormData(form)), form, e);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const fn = App.actions[el.dataset.change];
    if (fn) fn(Object.assign({}, el.dataset), el, e);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('hashchange', () => { fromHash(); App.render(); });

  // Refresh timers every 30 s, unless someone is typing
  setInterval(() => {
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    if (!document.getElementById('modal').hidden) return;
    App.render();
  }, 30e3);

  // ---------- boot ----------
  App.state = App.load();
  App.do.startQualifier();
  fromHash();
  App.save();
  App.render();
})(window.App);
