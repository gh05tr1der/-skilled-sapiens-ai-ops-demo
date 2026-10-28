/* Persona: learner (L2–L5). Ananya's home, Ask Sapiens, recaps and project result. */
(function (App) {
  const { esc, btn, chip, dur, clock, date, notes, mark, empty, phone, icon, H } = App.ui;

  const SUGGESTIONS = [
    'Can one of us submit for the whole group?',
    'I need a 3-day extension, medical reason.',
    'When will my certificate come?',
    'What file format should the report be?',
    'Who is my mentor?',
    'Can I switch roles mid-project?',
  ];

  function notEnrolled() {
    return empty('Ananya hasn\'t enrolled yet',
      'Her journey starts as a lead on WhatsApp. Play it from the start, or skip straight to an enrolled learner.',
      btn('Start on WhatsApp', 'go', { persona: 'prospect', screen: 'chat' }) + btn('Enroll Ananya now (shortcut)', 'enrollShortcut', {}, 'secondary'));
  }

  function stepper(l, report) {
    const steps = [
      ['Paid', 'done'],
      [l.mentorId ? 'Mentor matched' : 'Mentor (waiting)', l.mentorId ? 'done' : 'current'],
      [`Weekly reviews ${Math.min(l.attended || 0, 4)} of 4`, (l.attended || 0) >= 4 || report ? 'done' : l.mentorId ? 'current' : ''],
      [report ? (report.status === 'returned' ? 'Report returned' : 'Report submitted') : 'Report', report ? (report.status === 'returned' ? 'current' : 'done') : (l.attended || 0) >= 3 ? 'current' : ''],
      ['Certificate', report && report.status === 'approved' ? 'done' : report && report.status === 'in_review' ? 'current' : ''],
    ];
    return `<ol class="stepper">${steps.map(([t, st]) => `<li class="${st}"><span class="dot">${st === 'done' ? icon('check') : ''}</span><span>${esc(t)}</span></li>`).join('')}</ol>`;
  }

  App.views.learner = {
    home(s) {
      const l = App.sel.ananya();
      if (!l) return notEnrolled();
      const now = App.now();
      const m = l.mentorId ? App.sel.mentor(l.mentorId) : null;
      const report = App.sel.reportFor(l.id);
      const latest = s.recaps.filter((r) => r.status === 'published').sort((a, b) => b.week - a.week)[0];
      const chat = App.sel.chat(l.id);
      const asked = chat.some((x) => x.from === 'learner');

      const mentorPromise = m ? chip('Met · ' + dur(l.matchedAt - l.paidAt), l.matchedAt - l.paidAt <= 48 * H ? 'green' : 'red') : chip(dur(now - l.paidAt) + ' of 48 h', now - l.paidAt > 48 * H ? 'red' : 'amber');
      let certPromise = chip('After you submit', 'grey');
      if (report && report.status === 'in_review') { const left = 72 * H - (now - report.submittedAt); certPromise = chip(left > 0 ? dur(left) + ' left' : 'Late', left > 0 ? 'amber' : 'red'); }
      if (report && report.status === 'approved') certPromise = chip('Met · ' + dur(report.approvedAt - report.submittedAt), report.approvedAt - report.submittedAt <= 72 * H ? 'green' : 'red');

      const next = m
        ? `<b>Week ${Math.min((l.attended || 0) + 1, 4)} review</b><p class="small">${esc(m.slot)} · ${esc(m.name)}</p>${btn('Join on Meet', 'joinMeet')}`
        : `<b>Waiting for your mentor</b><p class="small">Promise: confirmed within 48 hours of payment</p>`;

      return `<div class="layout-side">
        <div class="stack">
          <div class="card hello">
            <div class="row between wrap"><div><h2>Hi ${esc(l.first)}</h2><p class="muted">${esc(l.program)} · ${esc(l.cohort)} cohort</p></div>${mark(1)}</div>
            ${stepper(l, report)}
            ${m && (l.attended || 0) < 3 ? `<div class="demo-skip">${btn('Skip ahead 3 weeks (demo)', 'skipWeeks', {}, 'ghost small')}<span class="muted small">Marks weekly reviews 1–3 as attended so you can try the report and certificate.</span></div>` : ''}
          </div>
          <div class="grid-2">
            <div class="card"><div class="row between"><h4 class="eyebrow">Next session</h4>${mark(2)}</div>${next}</div>
            <div class="card"><div class="row between"><h4 class="eyebrow">Our promises to you</h4>${mark(3)}</div>
              <ul class="promises">
                <li><span>Reply in under 5 min</span>${asked ? chip('Met', 'green') : chip('Ask anything', 'grey')}</li>
                <li><span>Mentor within 48 h</span>${mentorPromise}</li>
                <li><span>Certificate within 72 h</span>${certPromise}</li>
              </ul></div>
            <div class="card"><div class="row between"><h4 class="eyebrow">Latest recap</h4>${mark(4)}</div>
              ${latest ? `<b>${esc(latest.title)}</b><p class="small muted">${date(latest.date)} · ${latest.mins} min</p>${btn('Open recap', 'openRecap', { id: latest.id }, 'secondary')}` : '<p class="small">No recaps yet.</p>'}</div>
            <div class="card"><div class="row between"><h4 class="eyebrow">Project 1 report</h4>${mark(5)}</div>
              ${report ? `<b>${report.status === 'approved' ? 'Certificate issued' : report.status === 'returned' ? 'Returned with notes' : 'In review'}</b><p class="small muted">${esc(report.file)}</p>${btn('Open project', 'go', { persona: 'learner', screen: 'project' }, 'secondary')}`
                : `<b>Due ${date(l.due)}</b><p class="small muted">Each member uploads from their own account</p>${btn('Upload report', 'go', { persona: 'learner', screen: 'project' })}`}</div>
          </div>
          <div class="row end">${mark(6)}${btn('Ask Sapiens', 'go', { persona: 'learner', screen: 'ask' }, 'primary pill')}</div>
        </div>
        ${notes([
          ['Where I stand', 'Progress is read live from the learner record.'],
          ['What\'s next', 'Next session with the join link; no hunting through WhatsApp.'],
          ['Promises, visible', 'Each promise and whether it was met.'],
          ['Five-minute catch-up', 'Recap, actions and time-stamped moments within 2 hours.'],
          ['Own-account upload', 'Each group member submits from their own login.'],
          ['Help on every page', 'Opens the same Ask Sapiens assistant as WhatsApp.'],
        ])}
      </div>`;
    },

    ask(s) {
      const l = App.sel.ananya();
      if (!l) return notEnrolled();
      const chat = App.sel.chat(l.id);
      const body = `<div class="system-note">AI assistant · answers cite their source · type "person" to reach a human ${mark(1)}</div>` + chat.map((m) => {
        if (m.from === 'learner') return `<div class="bubble me">${esc(m.text)}<span class="meta">${clock(m.at)}</span></div>`;
        if (m.from === 'staff') return `<div class="bubble staff"><b class="who">${esc(m.who)}</b>${esc(m.text)}<span class="meta">${clock(m.at)}</span></div>`;
        const src = m.source ? `<span class="src ${m.kind === 'status' ? 'green' : ''}">${m.kind === 'status' ? 'From your learner record' : 'Source: ' + esc(m.source)}</span>` : '';
        const rate = m.kind === 'answer' || m.kind === 'status'
          ? `<span class="rate">${m.rated ? (m.rated === 'up' ? 'Thanks for the feedback' : 'Flagged as wrong; a coordinator will check') : `${btn('Helpful', 'rateAnswer', { id: m.id, good: 1 }, 'link small')}${btn('Wrong', 'rateAnswer', { id: m.id, good: 0 }, 'link small')}`}</span>` : '';
        const tag = m.kind === 'handoff' ? '<span class="src amber">Passed to a person</span>' : '';
        return `<div class="bubble bot">${esc(m.text)}${src}${tag}${rate}<span class="meta">${clock(m.at)}</span></div>`;
      }).join('') + (s.ui.typing ? '<div class="bubble bot typing"><span></span><span></span><span></span></div>' : '');
      const footer = `<div class="quick scroll">${SUGGESTIONS.map((q) => btn(q, 'askSuggest', { q }, 'reply')).join('')}</div>
        <form data-submit="ask" class="chat-input"><input name="q" placeholder="Ask about your live project" autocomplete="off" aria-label="Message"><button class="icon-btn send" aria-label="Send">${icon('send')}</button></form>`;
      return `<div class="layout-phone">
        ${phone({ title: 'Ask Sapiens', sub: 'AI assistant · WhatsApp and the LMS', body, footer, code: 'L4' })}
        ${notes([
          ['Says it\'s AI', 'Disclosed up front; "person" always reaches a human.'],
          ['Knows the learner', 'Certificate, mentor and deadline questions are answered from the learner record.'],
          ['Cites its source', 'Other answers come only from One Source pages that are in date, and name the page.'],
          ['Hands off cleanly', 'Refunds, extensions, complaints and anything it is unsure of go to a coordinator, with a summary.'],
          ['Learns from gaps', 'Unanswered questions go to the knowledge owner\'s gap queue.'],
        ], 'Try these')}
      </div>`;
    },

    recaps(s) {
      const l = App.sel.ananya();
      if (!l) return notEnrolled();
      const pub = s.recaps.filter((r) => r.status === 'published').sort((a, b) => b.week - a.week);
      const pending = s.recaps.filter((r) => r.status === 'draft');
      const open = s.recaps.find((r) => r.id === s.ui.recap && r.status === 'published') || pub[0];
      const list = pub.map((r) => `<button type="button" class="list-item ${open && open.id === r.id ? 'selected' : ''}" data-action="openRecap" data-id="${r.id}"><span><b>Week ${r.week}</b><small>${esc(r.title.split(': ')[1] || r.title)}</small></span></button>`).join('')
        + pending.map((r) => `<div class="list-item disabled"><span><b>Week ${r.week}</b><small>Being checked by the program manager</small></span>${chip('Soon', 'amber')}</div>`).join('');
      let detail = '';
      if (open) {
        const rated = (l.recapRatings || {})[open.id];
        detail = `<article class="card recap-view">
          <div class="row between wrap"><h2>${esc(open.title)}</h2>${mark(1)}</div>
          <p class="muted small">${date(open.date)} · ${open.mins} min · ${esc(open.mentor)}</p>
          ${chip('AI summary, checked by the program manager', 'amber')}
          <h4>Summary</h4><ul>${open.summary.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <h4>Action items</h4><ul class="checks">${open.actions.map((x, i) => {
            const k = open.id + ':' + i, on = (l.checks || {})[k];
            return `<li><label><input type="checkbox" data-change="toggleCheck" data-key="${k}" ${on ? 'checked' : ''}> ${esc(x)}</label></li>`;
          }).join('')}</ul>
          <h4>Key moments</h4><ul class="plain moments">${open.moments.map(([t, x]) => `<li>${btn('▶ ' + t, 'playMoment', { t }, 'dark small')} ${esc(x)}</li>`).join('')}</ul>
          <div class="row between wrap foot"><span class="row gap">Useful? ${rated ? chip('Thanks', 'green') : btn('Yes', 'rateRecap', { id: open.id, good: 1 }, 'secondary small') + btn('No', 'rateRecap', { id: open.id, good: 0 }, 'secondary small')}</span><span class="muted small">Recorded with consent</span></div>
        </article>`;
      }
      return `<div class="layout-3 recaps-layout">
        <div class="card"><h3>Weekly recaps</h3><div class="list">${list}</div></div>
        <div>${detail || empty('No recaps yet', 'Recaps appear here once the program manager publishes them.')}</div>
        ${notes([
          ['Five-minute catch-up', 'Summary, actions and key moments, posted within 2 hours.'],
          ['Checked by a person', 'The program manager publishes each AI draft; unpublished weeks show as "being checked".'],
          ['Fewer repeat questions', 'Learners who miss a session catch up here instead of asking on WhatsApp.'],
        ])}
      </div>`;
    },

    project(s) {
      const l = App.sel.ananya();
      if (!l) return notEnrolled();
      const now = App.now();
      const r = App.sel.reportFor(l.id);
      if (r && r.status === 'approved' && !s.flags.sawCertificate) { s.flags.sawCertificate = true; App.save(); }
      const group = l.group || [l.name];

      let main;
      if (!r || r.status === 'returned') {
        main = `<div class="card upload">
          <div class="row between"><h2>Project 1 report</h2>${mark(1)}</div>
          <p>Due <b>${date(l.due)}</b> · ${esc(l.program)}</p>
          ${r && r.status === 'returned' ? `<div class="callout amber"><b>Returned with notes:</b> ${esc(r.feedback)}</div>` : ''}
          <p class="small muted">Group of ${group.length}: ${esc(group.join(', '))}. Each member uploads the same report from their own account.</p>
          <label class="drop"><input type="file" accept=".pptx,.docx" data-change="pickFile"><span>${icon('file')} Choose a PowerPoint or Word file</span></label>
          <p class="small muted">Only .pptx and .docx files are accepted. The file stays in your browser; this demo only reads its name.</p>
          <div class="row gap">${btn('Use the sample file', 'submitSample')}</div>
        </div>`;
      } else {
        const deadline = r.submittedAt + 72 * H;
        const approved = r.status === 'approved';
        const steps = [
          ['Submitted', clock(r.submittedAt), true],
          [r.copies > 1 ? `${r.copies} copies matched to one report` : 'Received', clock(r.submittedAt + 60e3), true],
          ['Reviewed by an evaluator', approved ? clock(r.approvedAt) : `Due by ${clock(deadline)}`, approved],
          ['Certificate issued', approved ? clock(r.approvedAt + 60e3) : dur(Math.max(0, deadline - now)) + ' left on the promise', approved],
        ];
        main = `<div class="card">
          <div class="row between"><h2>Project 1 · ${esc(r.program)}</h2>${mark(2)}</div>
          <p class="muted small">${esc(r.file)}</p>
          <ol class="vtrack">${steps.map(([a, b, d]) => `<li class="${d ? 'done' : ''}"><span class="dot">${d ? icon('check') : ''}</span><span><b>${esc(a)}</b><small>${esc(b)}</small></span></li>`).join('')}</ol>
          ${approved ? `<h3>Score ${r.finalScore} / 100</h3>
            <h4>Feedback</h4><p>${esc(r.feedback)}</p>
            <ul>${r.rubric.filter((x) => (r.notes || {})[x.label]).map((x) => `<li><b>${esc(x.label)}:</b> ${esc(r.notes[x.label])}</li>`).join('')}</ul>` : '<p class="small muted">An evaluator checks the AI draft and approves; the certificate is issued automatically on approval.</p>'}
        </div>`;
        if (approved) {
          main += `<div class="certificate" id="certificate">
            <small>CERTIFICATE OF COMPLETION · SAMPLE</small>
            <h3>Corporate Live Project</h3>
            <p>awarded to</p><h2>${esc(l.name)}</h2>
            <p>${esc(r.program)} · ${esc(l.cohort)} cohort</p>
            <div class="row between"><span>ID <b>${esc(r.certificateId)}</b></span><span>Issued ${clock(r.approvedAt)}</span></div>
            ${mark(3)}
          </div>
          <div class="row gap wrap">${btn('Verify', 'verifyCert', { id: r.id })}${btn('Download (demo)', 'demoNote', { msg: 'In the real product this downloads a PDF from Certifier.' }, 'secondary')}${btn('Add to LinkedIn (demo)', 'demoNote', { msg: 'In the real product this opens LinkedIn\'s add-certification form.' }, 'secondary')}</div>`;
        }
      }
      return `<div class="layout-side">
        <div class="stack">${main}</div>
        ${notes([
          ['Own-account upload', 'PowerPoint or Word only, from each member\'s own login, as the guidelines require.'],
          ['Promise tracker', 'The learner sees each step and how long is left on the 72-hour promise.'],
          ['Certificate on approval', 'Issued automatically with a verifiable ID, plus written feedback per deliverable.'],
        ])}
      </div>`;
    },
  };

  function ask(text) {
    const t = String(text || '').trim(); if (!t) return;
    App.do.learnerSays('ananya', t);
    App.state.ui.typing = true;
    App.commit();
    setTimeout(() => { App.state.ui.typing = false; App.do.sapiensReplies('ananya', t); App.commit(); }, 450);
  }

  Object.assign(App.actions, {
    enrollShortcut: () => { App.do.enrollAnanyaShortcut(); App.commit(); App.ui.toast('Ananya enrolled. She is now in the mentor queue.'); },
    skipWeeks: () => { App.do.skipWeeks('ananya'); App.commit(); },
    joinMeet: () => App.ui.toast('In the real product this opens the Google Meet link.'),
    askSuggest: (d) => ask(d.q),
    ask: (f, form) => { ask(f.q); },
    rateAnswer: (d) => { App.do.rateAnswer('ananya', d.id, d.good === '1'); App.commit(); },
    openRecap: (d) => { App.state.ui.recap = d.id; App.go('learner', 'recaps'); },
    toggleCheck: (d) => { App.do.toggleCheck('ananya', d.key); App.commit(); },
    rateRecap: (d) => { App.do.rateRecap('ananya', d.id, d.good === '1'); App.commit(); },
    playMoment: (d) => App.ui.toast(`In the real product this jumps to ${d.t} in the recording.`),
    pickFile: (d, el) => {
      const f = el.files && el.files[0]; if (!f) return;
      if (!/\.(pptx|docx)$/i.test(f.name)) { App.ui.toast('Only PowerPoint (.pptx) or Word (.docx) files are accepted.'); el.value = ''; return; }
      App.do.submitReport('ananya', f.name); App.commit(); App.ui.toast('Report submitted. It is now in the evaluator\'s queue.');
    },
    submitSample: () => { App.do.submitReport('ananya', 'PBM_Project1_GroupA.pptx'); App.commit(); App.ui.toast('Report submitted. It is now in the evaluator\'s queue.'); },
    verifyCert: (d) => {
      const r = App.sel.report(d.id); if (!r) return;
      App.ui.modal('Certificate check', `<p class="callout green"><b>Valid.</b> ${esc(r.certificateId)} was issued to ${esc((App.sel.learner(r.learnerId) || {}).name)} for ${esc(r.program)} on ${clock(r.approvedAt)}.</p><p class="small muted">In the real product this is the public "Verify your certificate" page.</p>`);
    },
    demoNote: (d) => App.ui.toast(d.msg),
  });
})(window.App);
