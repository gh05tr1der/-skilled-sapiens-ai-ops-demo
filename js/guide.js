/*
 * Guided demo: the 12-step story from the report's screen map.
 * Each step knows when it is done, and how to fast-forward to it ("ensure"),
 * so a presenter can jump straight to any scene.
 */
window.App = window.App || {};

(function (App) {
  const A = () => App.sel.ananya();
  const ananyaHandoff = () => App.state.handoffs.find((h) => h.learnerId === 'ananya');

  App.guideSteps = [
    { persona: 'prospect', screen: 'chat', title: 'Lead qualifies on WhatsApp', hint: 'Answer as Ananya: Yes → Summer placements → Product → Within 4 weeks.',
      done: () => App.state.qualifier.done && !!App.sel.lead('ld-ananya'), ensure: () => App.do.autoQualify() },
    { persona: 'counselor', screen: 'leads', title: 'Counselor calls and enrolls', hint: 'Open Ananya\'s card under Qualified, click Call, then "Mark paid and enrolled".',
      done: () => !!A(), ensure: () => { App.do.leadCall('ld-ananya'); App.do.leadEnroll('ld-ananya'); } },
    { persona: 'manager', screen: 'match', title: 'Mentor confirmed', hint: 'Ananya is in the queue. Read the AI brief, then confirm the top suggestion.',
      done: () => !!(A() && A().mentorId), ensure: () => App.do.confirmTop('ananya') },
    { persona: 'learner', screen: 'home', title: 'Learner sees her journey', hint: 'Ananya\'s home shows her mentor and the promises. Click "Skip ahead 3 weeks" to reach week 4.',
      done: () => !!(A() && A().attended >= 3), ensure: () => App.do.skipWeeks('ananya') },
    { persona: 'manager', screen: 'recaps', title: 'Recap checked and published', hint: 'Read the AI draft of the week 3 recap and publish it.',
      done: () => App.state.recaps.every((r) => r.status === 'published'), ensure: () => App.state.recaps.forEach((r) => App.do.publishRecap(r.id)) },
    { persona: 'learner', screen: 'ask', title: 'Ask Sapiens answers or hands off', hint: 'Tap "Can one of us submit for the whole group?", then "I need a 3-day extension, medical reason."',
      done: () => !!ananyaHandoff(), ensure: () => { App.do.ask('ananya', 'Can one of us submit for the whole group?'); App.do.ask('ananya', 'I need a 3-day extension, medical reason.'); } },
    { persona: 'coordinator', screen: 'inbox', title: 'Coordinator replies', hint: 'Open Ananya\'s extension request, read the AI summary and send the suggested reply.',
      done: () => !!(ananyaHandoff() && App.state.handoffs.some((h) => h.learnerId === 'ananya' && h.status === 'sent')),
      ensure: () => { const h = App.state.handoffs.find((x) => x.learnerId === 'ananya' && x.status === 'open'); if (h) App.do.sendHandoff(h.id, h.suggested); } },
    { persona: 'learner', screen: 'project', title: 'Report submitted', hint: 'Upload the Project 1 report: use the sample file, or pick any .pptx or .docx.',
      done: () => !!App.sel.reportFor('ananya'), ensure: () => App.do.submitReport('ananya', 'PBM_Project1_GroupA.pptx') },
    { persona: 'evaluator', screen: 'review', title: 'Report reviewed', hint: 'Ananya\'s group report has an AI draft. Change a score if you disagree, then approve.',
      done: () => (App.sel.reportFor('ananya') || {}).status === 'approved', ensure: () => { const r = App.sel.reportFor('ananya'); if (r) App.do.approveReport(r.id); } },
    { persona: 'learner', screen: 'project', title: 'Certificate and feedback', hint: 'The certificate and feedback are ready. Click Verify to check the ID.',
      done: () => !!App.state.flags.sawCertificate, ensure: () => { App.state.flags.sawCertificate = true; } },
    { persona: 'knowledge', screen: 'kb', title: 'Knowledge gap closed', hint: 'Answer the most-asked open question. Then ask it as Ananya: Ask Sapiens now knows.',
      done: () => !!App.state.flags.gapAnswered,
      ensure: () => { const g = App.state.gaps[0]; if (g) App.do.answerGap(g.id, g.question.replace(/\?$/, ''), 'Yes, once, before week 2, with your program manager\'s approval. Ask a coordinator to arrange it.', 'Program manager'); else App.state.flags.gapAnswered = true; } },
    { persona: 'founder', screen: 'dash', title: 'Leadership checks promises', hint: 'Promises kept, hours saved, live queues and the pilot scorecard all reflect what you just did. Try "+1 hour".',
      done: () => !!App.state.flags.sawDashboard, ensure: () => { App.state.flags.sawDashboard = true; } },
  ];

  App.guideCurrent = () => {
    const i = App.guideSteps.findIndex((st) => !st.done());
    return i === -1 ? App.guideSteps.length : i;
  };

  // Jump to step i, fast-forwarding any earlier step that is not done yet
  App.guideGo = (i) => {
    for (let j = 0; j < i; j++) if (!App.guideSteps[j].done()) App.guideSteps[j].ensure();
    const st = App.guideSteps[i];
    App.go(st.persona, st.screen);
  };

  App.renderGuide = () => {
    const el = document.getElementById('guide');
    const s = App.state;
    el.hidden = !s.guideOpen;
    document.body.classList.toggle('guide-open', !!s.guideOpen);
    if (!s.guideOpen) return;
    const { icon } = App.ui;
    el.innerHTML = `<div class="guide-head"><h3>${icon('compass')} Guided demo</h3><button type="button" class="icon-btn" data-action="toggleGuide" aria-label="Close guide">${icon('x')}</button></div>` + App.guideList();
  };

  // The list of steps (used in the side panel, and in a pop-up on smaller screens)
  App.guideList = () => {
    const cur = App.guideCurrent();
    const { esc, icon, btn } = App.ui;
    const P = Object.fromEntries(App.personas.map((p) => [p.id, p]));
    return `<p class="small muted">Ananya's journey across eight personas. Click any step to jump there; earlier steps are completed for you.</p>
      <ol class="steps">${App.guideSteps.map((st, i) => {
        const d = st.done(), c = i === cur;
        return `<li class="${d ? 'done' : ''} ${c ? 'current' : ''}"><button type="button" data-action="guideGo" data-i="${i}">
          <span class="n">${d ? icon('check') : i + 1}</span><span><b>${esc(st.title)}</b><small>${esc(P[st.persona].role)}${c ? ' · ' + esc(st.hint) : ''}</small></span></button></li>`;
      }).join('')}</ol>
      ${cur >= App.guideSteps.length ? `<p class="callout green small">Story complete. Reset to run it again.</p>` : ''}
      <div class="row gap">${btn('Reset demo', 'reset', {}, 'secondary small')}</div>`;
  };

  // Banner at the top of the current screen when the next step happens here
  App.guideBanner = () => {
    const s = App.state;
    if (!s.guideOpen) return '';
    const cur = App.guideCurrent();
    if (cur >= App.guideSteps.length) return '';
    const st = App.guideSteps[cur];
    const { esc, btn } = App.ui;
    const P = App.personas.find((p) => p.id === st.persona);
    if (st.persona === s.persona && st.screen === s.screen) {
      return `<div class="banner"><span class="tag">Step ${cur + 1} of ${App.guideSteps.length}</span><span class="grow">${esc(st.hint)}</span>${btn('Hide', 'hideGuide', {}, 'ghost small')}</div>`;
    }
    return `<div class="banner muted-banner"><span class="tag">Next: step ${cur + 1}</span><span>${esc(st.title)} (${esc(P.role)})</span>${btn('Take me there', 'guideGo', { i: cur }, 'primary small')}<span class="grow"></span>${btn('Hide', 'hideGuide', {}, 'ghost small')}</div>`;
  };

  Object.assign(App.actions, {
    guideGo: (d) => { App.ui.closeModal(); App.guideGo(Number(d.i)); },
    hideGuide: () => { App.state.guideOpen = false; App.commit(); App.ui.toast('Guide hidden. Click "Guided demo" in the top bar to bring it back.'); },
    toggleGuide: () => {
      // On smaller screens the steps open in a pop-up; the banner above each screen shows the next step
      if (window.matchMedia('(max-width: 1280px)').matches) {
        App.state.guideOpen = true; App.commit();
        App.ui.modal('Guided demo', App.guideList());
        return;
      }
      App.state.guideOpen = !App.state.guideOpen; App.commit();
    },
  });
})(window.App);
