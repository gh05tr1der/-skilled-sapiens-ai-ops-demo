/* Persona: program manager (S2). Mentor Match, plus checking AI recaps before learners see them. */
(function (App) {
  const { esc, btn, chip, dur, clock, date, notes, mark, empty, H } = App.ui;

  const waitChip = (ms) => chip(dur(ms), ms >= 40 * H ? 'red' : ms >= 24 * H ? 'amber' : 'green');

  App.views.manager = {
    match(s) {
      const now = App.now();
      const waiting = App.sel.waiting();
      const matched = s.learners.filter((l) => l.matchedLive).sort((a, b) => b.matchedAt - a.matchedAt);
      let l = App.sel.learner(s.ui.match);
      if (!l || l.mentorId) l = waiting.find((x) => x.id === 'ananya') || waiting[0];

      const queue = waiting.map((x) => `<button type="button" class="list-item ${l && l.id === x.id ? 'selected' : ''} ${x.id === 'ananya' ? 'spot' : ''}" data-action="selectMatch" data-id="${x.id}">
          <span><b>${esc(x.name)}</b><small>${esc(x.program)}</small></span>${waitChip(now - x.paidAt)}</button>`).join('') || '<p class="muted small pad">Everyone has a mentor.</p>';

      let center = '';
      let right = '';
      if (l) {
        const b = l.brief || {};
        const editing = s.ui.editFocus === l.id;
        center = `<div class="card">
          <div class="row between"><h3>Learner brief ${mark(2)}</h3>${editing ? '' : btn('Edit', 'editFocus', { id: l.id }, 'ghost small')}</div>
          <p class="muted small">AI draft from the CV and intake form</p>
          <dl class="kv">
            <dt>Learner</dt><dd>${esc(l.name)} · ${esc(l.program)} · ${esc(l.cohort)}</dd>
            <dt>Paid</dt><dd>${clock(l.paidAt)} · ${dur(now - l.paidAt)} ago</dd>
            <dt>Background</dt><dd>${esc(b.background)}</dd>
            <dt>Goal</dt><dd>${esc(b.goal)}</dd>
            <dt>Strengths</dt><dd>${esc(b.strengths)}</dd>
            <dt>Gaps</dt><dd>${esc(b.gaps)}</dd>
            <dt>Mentor focus</dt><dd>${editing ? `<form data-submit="saveFocus" class="row gap"><input type="hidden" name="id" value="${l.id}"><input name="focus" value="${esc(b.focus)}" aria-label="Mentor focus"><button class="btn primary small">Save</button></form>` : `<b>${esc(b.focus)}</b>`}</dd>
          </dl>
          <div class="row gap">${chip('CV.pdf', 'white')}${chip('Intake form', 'white')}</div>
        </div>`;
        const ranked = App.ai.rankMentors(l);
        right = `<div class="card">
          <h3>Suggested mentors ${mark(3)}</h3>
          <p class="muted small">Ranked by domain, spare capacity and rating</p>
          ${ranked.map((r, i) => `<div class="mentor ${i === 0 ? 'top' : ''}">
            <div class="row between"><span class="row gap"><span class="avatar">${App.ui.icon('user')}</span><span><b>${esc(r.m.name)}</b><small>${esc(r.m.bio)}</small></span></span>${chip(r.fit, i === 0 ? 'green' : r.fit === 'Good fit' ? 'amber' : 'grey')}</div>
            <p class="small">Why: ${esc(r.reasons.join('; '))}</p>
            <div class="row between small"><span class="row gap load">Load ${r.m.load}/${r.m.capacity} ${App.ui.bar((r.m.load / r.m.capacity) * 100, r.m.load / r.m.capacity >= 0.8 ? 'amber' : 'green')}${i === 0 ? mark(4) : ''}</span><span>${App.ui.icon('star', 'gold')} ${r.m.rating}</span></div>
            ${btn('Confirm ' + r.m.name, 'confirmMatch', { id: l.id, mentor: r.m.id }, i === 0 ? 'primary block' : 'secondary block')}
          </div>`).join('')}
          <p class="small muted">${mark(5)} No match is made until you confirm. ${mark(6)} Confirming sends the booking link, a WhatsApp intro and the brief.</p>
        </div>`;
      }

      const matchedList = matched.length ? `<div class="card"><h3>Matched in this demo</h3><ul class="plain">${matched.map((x) => {
        const m = App.sel.mentor(x.mentorId); const t = x.matchedAt - x.paidAt;
        return `<li class="row between wrap"><span><b>${esc(x.name)}</b> → ${esc(m ? m.name : '')}</span>${chip(dur(t) + ' after payment', t <= 48 * H ? 'green' : 'red')}</li>`;
      }).join('')}</ul></div>` : '';

      return `<div class="layout-3">
        <div class="stack"><div class="card"><h3>Waiting for a mentor · ${waiting.length} ${mark(1)}</h3><p class="muted small">Promise: mentor within 48 hours of payment</p><div class="list">${queue}</div></div>${matchedList}</div>
        <div class="stack">${center || empty('Queue is clear', 'Every learner has a mentor. New enrollments from the counselor appear here.', btn('Open the lead pipeline', 'go', { persona: 'counselor', screen: 'leads' }, 'secondary'))}</div>
        <div class="stack">${right}
          ${notes([
            ['Most urgent first', 'Sorted by hours since payment: amber at 24 h, red at 40 h.'],
            ['One-page learner brief', 'Drafted by AI from the CV and intake form; the manager can edit it.'],
            ['Ranked suggestions', 'Domain, load and rating, with the reason in plain words.'],
            ['Load and rating', 'Keeps the most popular mentors from being overloaded.'],
            ['A person confirms', 'AI suggests; the program manager decides.'],
            ['Everything sent at once', 'Booking link, intro and brief go out; the learner record updates.'],
          ])}</div>
      </div>`;
    },

    recaps(s) {
      const drafts = s.recaps.filter((r) => r.status === 'draft');
      const pub = s.recaps.filter((r) => r.status === 'published').sort((a, b) => b.week - a.week);
      const recapCard = (r, draft) => `<article class="card recap ${draft ? 'draft' : ''}">
        <div class="row between"><h3>${esc(r.title)}</h3>${draft ? chip('AI draft · waiting for you', 'amber') : chip('Published', 'green')}</div>
        <p class="muted small">${esc(r.cohort)} · ${date(r.date)} · ${r.mins} min · ${esc(r.mentor)}</p>
        <div class="grid-3">
          <div><h4>Summary</h4><ul>${r.summary.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
          <div><h4>Action items</h4><ul>${r.actions.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
          <div><h4>Key moments</h4><ul class="plain">${r.moments.map(([t, x]) => `<li>${chip(t, 'dark')} ${esc(x)}</li>`).join('')}</ul></div>
        </div>
        ${draft ? `<div class="row gap">${btn('Publish to learners', 'publishRecap', { id: r.id })}<span class="muted small">Drafted from the Meet notes. Check it, then publish.</span></div>` : ''}
      </article>`;
      return `<div class="layout-side">
        <div class="stack">
          <div class="toolbar card"><h2>Recaps to check</h2><span class="muted">${drafts.length} waiting · promise: recap within 2 hours of the session</span></div>
          ${drafts.map((r) => recapCard(r, true)).join('') || empty('Nothing to check', 'All recaps are published.')}
          ${pub.map((r) => recapCard(r, false)).join('')}
        </div>
        ${notes([
          ['AI drafts, a person publishes', 'Meet or Fireflies notes become a draft; the program manager checks it first.'],
          ['Same shape every week', 'Summary, action items and time-stamped moments, so learners can catch up in five minutes.'],
          ['Consent', 'Sessions are recorded with consent; the notice is shown at the start of each call.'],
        ])}
      </div>`;
    },
  };

  Object.assign(App.actions, {
    selectMatch: (d) => { App.state.ui.match = d.id; App.state.ui.editFocus = null; App.commit(); },
    editFocus: (d) => { App.state.ui.editFocus = d.id; App.commit(); },
    saveFocus: (f) => { App.do.saveFocus(f.id, f.focus); App.state.ui.editFocus = null; App.commit(); },
    confirmMatch: (d) => {
      const m = App.sel.mentor(d.mentor), l = App.sel.learner(d.id);
      App.do.confirmMatch(d.id, d.mentor); App.commit();
      if (m && l) App.ui.toast(`${m.name} confirmed for ${l.first}. Booking link and WhatsApp intro sent.`);
    },
    publishRecap: (d) => { App.do.publishRecap(d.id); App.commit(); App.ui.toast('Recap published to learners.'); },
  });
})(window.App);
