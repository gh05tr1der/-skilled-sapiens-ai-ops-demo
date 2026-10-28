/* Persona: founder (M1). Promises kept, hours saved, live queues and the Day-30 pilot scorecard. */
(function (App) {
  const { esc, btn, chip, dur, clock, notes, mark, bar, H } = App.ui;
  const KIND = { 'On plan': 'green', Watch: 'amber', Act: 'red' };

  App.views.founder = {
    dash(s) {
      const now = App.now();
      const m = App.metrics();
      const pct = (o) => Math.round((o.kept / Math.max(1, o.total)) * 100);
      const open = App.sel.openHandoffs(), rev = App.sel.inReview(), wait = App.sel.waiting();
      const oldest = (arr, key) => (arr.length ? now - Math.min(...arr.map((x) => x[key])) : 0);
      const nearest = rev.length ? Math.min(...rev.map((r) => 72 * H - (now - r.submittedAt))) : null;
      const stages = ['new', 'qualified', 'counseling', 'enrolled'];
      const counts = stages.map((st, i) => s.leads.filter((l) => stages.indexOf(l.stage) >= i).length);
      const contacted = s.leads.filter((l) => l.firstContactAt).map((l) => l.firstContactAt - l.createdAt).sort((a, b) => a - b);
      const med = contacted.length ? contacted[Math.floor(contacted.length / 2)] : 0;

      const tiles = [
        ['Promises kept on time', m.promisesPct + '%', 'Target ≥ 90% by month 6', 1],
        ['Staff hours saved this week', m.hoursSaved.toFixed(1) + ' h', `≈ ${(m.hoursSaved * 52 / 1800).toFixed(1)} roles a year at this pace`, 2],
        ['Learner CSAT', m.csat.toFixed(1) + ' / 5', 'Guardrail: at or above baseline', 0],
        ['AI–evaluator agreement', m.agreementPct + '%', 'Guardrail: ≥ 85%', 0],
      ].map(([a, b, c, k], i) => `<div class="kpi ${i === 0 ? 'star' : ''}">${k ? mark(k) : ''}<small>${esc(a)}</small><b>${esc(b)}</b><span>${esc(c)}</span></div>`).join('');

      const promises = [['Reply within 1 hour', m.reply], ['Mentor within 48 hours', m.mentor], ['Certificate within 72 hours', m.cert]].map(([a, o]) => {
        const p = pct(o);
        return `<li><span>${esc(a)}</span>${bar(p, p >= 90 ? 'green' : p >= 80 ? 'amber' : 'red')}<b>${p}%</b><small class="muted">${o.kept}/${o.total}</small></li>`;
      }).join('');

      const queues = [
        [`Hand-offs waiting: ${open.length}`, open.length ? 'oldest ' + dur(oldest(open, 'createdAt')) : 'none', open.length && oldest(open, 'createdAt') > H ? 'red' : open.length ? 'amber' : 'green', 'coordinator', 'inbox'],
        [`Reports in review: ${rev.length}`, nearest == null ? 'none' : nearest > 0 ? 'nearest: ' + dur(nearest) + ' left' : 'one is past 72 h', nearest != null && nearest < 24 * H ? 'red' : rev.length ? 'amber' : 'green', 'evaluator', 'review'],
        [`Learners without a mentor: ${wait.length}`, wait.length ? 'oldest ' + dur(oldest(wait, 'paidAt')) : 'none', wait.length && oldest(wait, 'paidAt') > 40 * H ? 'red' : wait.length ? 'amber' : 'green', 'manager', 'match'],
      ].map(([a, b, k, p, sc]) => `<li class="row between"><span>${esc(a)}</span><span class="row gap">${chip(b, k)}${btn('Open', 'go', { persona: p, screen: sc }, 'ghost small')}</span></li>`).join('');

      const funnel = ['Leads', 'Qualified', 'Counseling', 'Enrolled'].map((a, i) => `<li><span>${a}</span>${bar((counts[i] / Math.max(1, counts[0])) * 100, ['grey', 'dark', 'deep', 'red'][i])}<b>${counts[i]}</b></li>`).join('');

      return `<div class="layout-side">
        <div class="stack">
          <div class="toolbar card"><h2>Leadership dashboard</h2><span class="muted small">This week · all programs · sample numbers that move as you use the other personas</span></div>
          <div class="kpis">${tiles}</div>
          <div class="grid-2">
            <div class="card"><h3>Promises this week ${mark(3)}</h3><ul class="meter">${promises}</ul></div>
            <div class="card"><div class="row between"><h3>Day-30 pilot scorecard ${mark(4)}</h3>${chip(m.decision[0], m.decision[1])}</div>
              <table class="tbl compact"><tbody>${m.scorecard.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td class="num"><b>${esc(b)}</b></td><td>${chip(c, KIND[c])}</td></tr>`).join('')}</tbody></table>
              <p class="small muted">Rule: all on plan → scale to all 8 roles · any Act → fix within 2 weeks · 3 or more Act → stop and rethink.</p></div>
            <div class="card"><h3>Queues right now ${mark(5)}</h3><ul class="plain">${queues}</ul></div>
            <div class="card"><div class="row between"><h3>Lead funnel ${mark(6)}</h3>${chip('Median first contact: ' + dur(med), 'green')}</div><ul class="meter">${funnel}</ul></div>
          </div>
          <div class="card"><h3>What just happened</h3><ul class="feed">${s.log.slice(0, 8).map((x) => `<li><span class="muted small">${clock(x.at)}</span> <b>${esc(x.who)}</b> ${esc(x.text)}</li>`).join('') || '<li class="muted">Use the other personas: their actions show up here.</li>'}</ul></div>
        </div>
        ${notes([
          ['North star', 'The share of learner promises kept on time: reply, mentor and certificate.'],
          ['Counter-metric', 'Staff hours saved, so speed is not bought with overtime.'],
          ['Promise breakdown', 'Each promise against its target; try "+1 hour" in the top bar to watch them slip.'],
          ['Pilot scorecard', 'On plan, Watch or Act, with the decision rule written before the pilot.'],
          ['Live queues', 'Where a promise is about to break, with a link to fix it.'],
          ['Funnel', 'Leads to enrollments, with first-contact time.'],
        ])}
      </div>`;
    },
  };
})(window.App);
