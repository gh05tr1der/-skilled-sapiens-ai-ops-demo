/* Persona: counselor (S1). One board for every lead, with a 15-minute first-contact clock. */
(function (App) {
  const { esc, btn, chip, dur, clock, notes, M } = App.ui;
  const COLS = [['new', 'New'], ['qualified', 'Qualified'], ['counseling', 'Counseling'], ['enrolled', 'Enrolled']];
  const fitChip = (f) => (f ? chip(f + ' fit', f === 'High' ? 'dark' : f === 'Medium' ? 'amber' : 'grey') : chip('Not qualified', 'grey'));

  function timerChip(l, now) {
    if (l.stage === 'enrolled') return '';
    if (l.firstContactAt) return chip('Called in ' + dur(l.firstContactAt - l.createdAt), 'grey');
    const waited = now - l.createdAt;
    return chip(dur(waited), waited > 15 * M ? 'red' : waited > 10 * M ? 'amber' : 'green');
  }

  function drawer(l, now) {
    if (!l) return `<div class="drawer card muted-box"><p>Select a lead to see the WhatsApp answers, fit tier and next step.</p></div>`;
    const a = l.answers || {};
    const answers = a.goal ? `${esc(a.goal)} · ${esc(a.domain)} · ${esc(a.timing)}` : 'No WhatsApp answers yet';
    let next = 'Call now';
    if (l.stage === 'enrolled') next = 'Enrolled: now in the mentor queue';
    else if (l.firstContactAt) next = 'Share the payment link and follow up';
    else if (a.timing === 'Within 4 weeks') next = 'Call now: placements in under 4 weeks';
    const late = !l.firstContactAt && l.stage !== 'enrolled' && now - l.createdAt > 15 * M;
    return `<div class="drawer card">
      <div class="row between"><h3>${esc(l.name)}</h3>${App.ui.mark(3)}</div>
      <p class="muted small">${esc(l.source)} · came in ${clock(l.createdAt)}</p>
      <div class="row gap wrap">${chip(l.consent ? 'Consent given' : 'No consent yet', l.consent ? 'green' : 'grey')}${fitChip(l.fit)}${late ? chip('Over 15 min', 'red') : ''}</div>
      <dl class="kv">
        <dt>Answers</dt><dd>${answers}</dd>
        <dt>Why this fit</dt><dd>${esc(App.fitReason(a))}</dd>
        <dt>Next step</dt><dd><b>${esc(next)}</b></dd>
      </dl>
      ${l.stage !== 'enrolled' ? `<div class="row gap wrap">${btn('Call', 'leadCall', { id: l.id })}${btn('Send program page', 'leadWhatsApp', { id: l.id }, 'secondary')}</div>
      <div class="row gap">${btn('Mark paid and enrolled', 'leadEnroll', { id: l.id }, 'secondary block')}${App.ui.mark(4)}</div>` : `<div class="row">${btn('Open Mentor Match', 'go', { persona: 'manager', screen: 'match' }, 'secondary block')}</div>`}
      <h4>Timeline</h4>
      <ul class="timeline">${l.timeline.map(([t, x]) => `<li><span>${clock(t)}</span>${esc(x)}</li>`).join('')}</ul>
    </div>`;
  }

  App.views.counselor = {
    leads(s) {
      const now = App.now();
      const sel = App.sel.lead(s.ui.lead);
      const contacted = s.leads.filter((l) => l.firstContactAt).map((l) => l.firstContactAt - l.createdAt).sort((a, b) => a - b);
      const med = contacted.length ? contacted[Math.floor(contacted.length / 2)] : 0;
      const lateCount = s.leads.filter((l) => !l.firstContactAt && l.stage !== 'enrolled' && now - l.createdAt > 15 * M).length;

      const card = (l) => `<button type="button" class="lead-card ${sel && sel.id === l.id ? 'selected' : ''} ${l.id === 'ld-ananya' ? 'spot' : ''}" data-action="selectLead" data-id="${l.id}">
          <b>${esc(l.name)}</b><small>${esc(l.source)}</small>
          <span class="row gap wrap">${fitChip(l.fit)}${timerChip(l, now)}</span>${l.note ? `<small class="note">${esc(l.note)}</small>` : ''}</button>`;
      const cols = COLS.map(([k, label], ci) => {
        let items = s.leads.filter((l) => l.stage === k).sort((a, b) => a.createdAt - b.createdAt);
        if (k === 'enrolled') items = items.reverse();
        return `<div class="kcol"><div class="kcol-head">${label} · ${items.length}${ci === 0 ? ' ' + App.ui.mark(2) : ''}</div>${items.map(card).join('') || '<p class="muted small pad">Nothing here</p>'}</div>`;
      }).join('');

      return `<div class="layout-side">
        <div class="stack">
          <div class="toolbar card">
            <h2>Lead pipeline</h2>
            <div class="row gap wrap">${chip('Median first contact: ' + dur(med), 'green')}${chip('Waiting over 15 min: ' + lateCount, lateCount ? 'red' : 'grey')}</div>
          </div>
          <div class="sources card"><span class="muted small">Every source lands on one board ${App.ui.mark(1)}</span>
            <span class="row gap wrap">${['Website form', 'Razorpay', 'WhatsApp', 'Unstop workshops', 'Instagram', '4 inboxes'].map((x) => chip(x)).join('')}</span></div>
          <div class="kanban">${cols}</div>
        </div>
        <div class="stack">${drawer(sel, now)}
          ${notes([
            ['One board for every lead', 'Website, Razorpay, WhatsApp, Unstop, Instagram and the four inboxes feed one CRM.'],
            ['15-minute clock', 'Green, then amber at 10 minutes, red after 15, and the lead counts as late on the dashboard.'],
            ['Answers before the call', 'The counselor sees the WhatsApp answers and the fit reason before dialling.'],
            ['Enrolling starts the record', 'Marking a lead as paid creates the learner record and puts them in the mentor queue.'],
          ])}</div>
      </div>`;
    },
  };

  Object.assign(App.actions, {
    selectLead: (d) => { App.state.ui.lead = d.id; App.commit(); },
    leadCall: (d) => { App.do.leadCall(d.id); App.commit(); App.ui.toast('Call logged. First-contact time recorded in the CRM.'); },
    leadWhatsApp: (d) => { App.do.leadWhatsApp(d.id); App.commit(); App.ui.toast('Program page sent on WhatsApp.'); },
    leadEnroll: (d) => { App.do.leadEnroll(d.id); App.commit(); App.ui.toast('Enrolled: learner record created and added to the mentor queue.'); },
  });
})(window.App);
