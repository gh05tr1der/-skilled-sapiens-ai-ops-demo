/* Persona: coordinator (S3). Support inbox: only what Ask Sapiens could not settle. */
(function (App) {
  const { esc, btn, chip, dur, clock, notes, mark, empty, H, M } = App.ui;

  const waitChip = (ms) => chip(dur(ms), ms > H ? 'red' : ms > 30 * M ? 'amber' : 'green');

  App.views.coordinator = {
    inbox(s) {
      const now = App.now();
      const open = App.sel.openHandoffs();
      const tab = s.ui.inboxTab || 'open';
      const m = App.metrics();
      let h = s.handoffs.find((x) => x.id === s.ui.handoff && x.status === 'open') || open.find((x) => x.learnerId === 'ananya') || open[0];
      if (tab !== 'open') h = null;

      const list = tab === 'open'
        ? open.map((x) => {
          const l = App.sel.learner(x.learnerId);
          return `<button type="button" class="list-item ${h && h.id === x.id ? 'selected' : ''} ${x.learnerId === 'ananya' ? 'spot' : ''}" data-action="selectHandoff" data-id="${x.id}">
            <span><b>${esc(l ? l.name : 'Learner')}</b><small>${esc(x.reason)}</small></span>${waitChip(now - x.createdAt)}</button>`;
        }).join('') || '<p class="muted small pad">Nothing waiting. Ask Sapiens is handling the rest.</p>'
        : s.aiResolved.map((a) => `<div class="list-item static"><span><b>${esc(a.q)}</b><small>${esc(a.source)} · ${clock(a.at)}</small></span>${chip('AI', 'green')}</div>`).join('');

      let detail = '';
      if (h) {
        const l = App.sel.learner(h.learnerId) || {};
        const mentor = l.mentorId ? App.sel.mentor(l.mentorId) : null;
        const report = App.sel.reportFor(l.id);
        const kbOpen = s.ui.kbForm === h.id;
        detail = `<div class="card">
          <h3>${esc(l.name)} · ${esc(l.program || '')}</h3>
          <p class="quote">"${esc(h.question)}"</p>
          <div class="callout amber"><b class="eyebrow">AI summary ${mark(2)}</b>${esc(h.summary)}</div>
          <form data-submit="sendHandoff">
            <input type="hidden" name="id" value="${h.id}">
            <label class="lbl" for="reply">Suggested reply (edit before sending) ${mark(3)}</label>
            <textarea id="reply" name="reply" rows="4">${esc(h.suggested)}</textarea>
            <div class="row gap wrap"><button class="btn primary">Send to ${esc(l.first || 'learner')}</button>${btn('Show the full chat', 'showChat', { id: l.id }, 'ghost small')}</div>
          </form>
          ${h.sensitive ? `<p class="small muted">${mark(4)} Policy decisions (refunds, extensions, complaints) stay with people, so this one is not added to One Source.</p>`
            : kbOpen ? `<form data-submit="handoffToKB" class="kb-form"><input type="hidden" name="id" value="${h.id}">
                <label class="lbl">Page title</label><input name="title" value="${esc(h.question.replace(/\?$/, ''))}">
                <label class="lbl">Approved answer</label><textarea name="body" rows="3" placeholder="Write the answer every learner should get"></textarea>
                <div class="row gap"><button class="btn primary small">Add to One Source</button>${btn('Cancel', 'kbFormClose', {}, 'ghost small')}</div></form>`
            : `<p>${btn('+ Add this answer to One Source', 'kbFormOpen', { id: h.id }, 'link')} ${mark(4)}</p>`}
        </div>
        <div class="card"><h4>Learner record</h4><dl class="kv small">
          <dt>Program</dt><dd>${esc(l.program || '')}</dd><dt>Cohort</dt><dd>${esc(l.cohort || '')}</dd>
          <dt>Payment</dt><dd>Paid ${l.paidAt ? clock(l.paidAt) : ''}</dd><dt>Mentor</dt><dd>${mentor ? esc(mentor.name) : 'Not yet'}</dd>
          <dt>Report</dt><dd>${report ? esc(report.status.replace('_', ' ')) : 'Not submitted'}</dd><dt>Chats</dt><dd>${App.sel.chat(l.id).filter((x) => x.from === 'learner').length} questions</dd></dl></div>`;
      }

      return `<div class="layout-3">
        <div class="stack"><div class="card">
          <div class="tabs small">${btn(`Needs a person · ${open.length}`, 'inboxTab', { tab: 'open' }, tab === 'open' ? 'tab active' : 'tab')}${btn(`AI-resolved · ${s.aiResolved.length}`, 'inboxTab', { tab: 'ai' }, tab === 'ai' ? 'tab active' : 'tab')}</div>
          <p class="muted small">${mark(1)} Today: AI answered ${m.aiToday} of ${m.aiToday + m.staffToday} questions (${m.resolvedPct}%). Promise: a person replies within 1 hour.</p>
          <div class="list">${list}</div></div></div>
        <div class="stack">${detail || (tab === 'open' ? empty('Inbox clear', 'Everything Ask Sapiens could not settle has been answered.', btn('Ask something as Ananya', 'go', { persona: 'learner', screen: 'ask' }, 'secondary')) : empty('AI-resolved questions', 'These were answered from One Source or the learner record, with no person involved.'))}</div>
        ${notes([
          ['Only what AI can\'t settle', 'The queue holds hand-offs, sorted by wait, with timers: amber at 30 min, red after 1 hour.'],
          ['Read one paragraph', 'The AI summary gives the question, the learner\'s context and the relevant policy.'],
          ['Edit, then send', 'The suggested reply is a draft; the coordinator owns what goes out.'],
          ['Close the gap', 'Answers to new questions can go straight into One Source, so Ask Sapiens answers them next time.'],
        ])}
      </div>`;
    },
  };

  Object.assign(App.actions, {
    selectHandoff: (d) => { App.state.ui.handoff = d.id; App.state.ui.kbForm = null; App.commit(); },
    inboxTab: (d) => { App.state.ui.inboxTab = d.tab; App.commit(); },
    sendHandoff: (f) => {
      const h = App.state.handoffs.find((x) => x.id === f.id); const l = h && App.sel.learner(h.learnerId);
      App.do.sendHandoff(f.id, f.reply); App.commit();
      App.ui.toast(`Reply sent to ${l ? l.first : 'the learner'} on WhatsApp.`);
    },
    kbFormOpen: (d) => { App.state.ui.kbForm = d.id; App.commit(); },
    kbFormClose: () => { App.state.ui.kbForm = null; App.commit(); },
    handoffToKB: (f) => {
      if (!f.body || !f.body.trim()) { App.ui.toast('Write the answer first.'); return; }
      App.do.handoffToKB(f.id, f.title, f.body.trim()); App.state.ui.kbForm = null; App.commit();
      App.ui.toast('Added to One Source. Ask Sapiens can use it now.');
    },
    showChat: (d) => {
      const chat = App.sel.chat(d.id);
      App.ui.modal('Full chat', `<div class="chat-log">${chat.map((m) => `<p><b>${m.from === 'learner' ? 'Learner' : m.from === 'staff' ? esc(m.who) : 'Ask Sapiens'}:</b> ${esc(m.text)} <small class="muted">${clock(m.at)}</small></p>`).join('') || '<p class="muted">No messages.</p>'}</div>`);
    },
  });
})(window.App);
