/* Persona: evaluator (S4). Review Desk: AI drafts against the rubric, a person approves. */
(function (App) {
  const { esc, btn, chip, dur, clock, notes, mark, empty, icon, H } = App.ui;

  function leftChip(r, now) {
    const left = 72 * H - (now - r.submittedAt);
    if (left <= 0) return chip('Over 72 h', 'red');
    return chip(dur(left) + ' left', left < 24 * H ? 'red' : left < 48 * H ? 'amber' : 'green');
  }

  App.views.evaluator = {
    review(s) {
      const now = App.now();
      const queue = App.sel.inReview().sort((a, b) => a.submittedAt - b.submittedAt);
      const done = s.reports.filter((r) => r.approvedLive || r.status === 'returned').sort((a, b) => (b.approvedAt || b.returnedAt) - (a.approvedAt || a.returnedAt));
      let r = queue.find((x) => x.id === s.ui.report) || queue.find((x) => x.learnerId === 'ananya') || queue[0];

      const list = queue.map((x) => {
        const l = App.sel.learner(x.learnerId);
        return `<button type="button" class="list-item ${r && r.id === x.id ? 'selected' : ''} ${x.learnerId === 'ananya' ? 'spot' : ''}" data-action="selectReport" data-id="${x.id}">
          <span><b>${esc(x.program)} · ${esc(x.project)}</b><small>${esc(l ? l.name : '')} · ${x.group > 1 ? 'group of ' + x.group : 'solo'}</small></span>${leftChip(x, now)}</button>`;
      }).join('') || '<p class="muted small pad">Queue is clear.</p>';

      let detail = '';
      if (r) {
        const l = App.sel.learner(r.learnerId) || {};
        const ai = App.sel.reportTotal(r, 'ai'), fin = App.sel.reportTotal(r, 'final');
        detail = `<div class="card">
          <div class="row between wrap"><h3>${esc(l.name)} · ${esc(r.program)} · ${esc(r.project)}</h3>${leftChip(r, now)}</div>
          <div class="row gap wrap">${chip(r.file + ' · ' + r.pages + ' pages', 'white')}${r.copies > 1 ? chip(`${r.copies} copies matched → 1 group report`, 'grey') : ''} ${mark(2)}${btn('Open report', 'demoNote', { msg: 'In the real product this opens the report in the LMS viewer, with evidence pages highlighted.' }, 'ghost small')}</div>
          <div class="review-main">
            <div>
              <h4>Rubric · AI draft ${mark(3)}</h4>
              <table class="rubric"><thead><tr><th>Deliverable</th><th>AI</th><th>Final</th><th>Evidence</th></tr></thead><tbody>
              ${r.rubric.map((x, i) => `<tr class="${Math.abs(x.final - x.ai) > 1 ? 'diff' : ''}"><td>${esc(x.label)}</td><td class="num">${x.ai}</td>
                <td><input type="number" min="0" max="10" value="${x.final}" data-change="setScore" data-id="${r.id}" data-idx="${i}" aria-label="Final score for ${esc(x.label)}"></td><td class="muted small">${esc(x.evidence)}</td></tr>`).join('')}
              </tbody></table>
              <p class="row between"><span>AI draft <b>${ai}</b> / 100</span><span>Final <b>${fin}</b> / 100</span></p>
            </div>
          </div>
          <label class="lbl" for="fb">Feedback for the learner (AI draft, editable) ${mark(4)}</label>
          <textarea id="fb" rows="3" data-change="setFeedback" data-id="${r.id}">${esc(r.feedback)}</textarea>
          <p>${chip('Originality: ' + r.originality, /no concerns/i.test(r.originality) ? 'green' : 'amber')} <span class="small muted">A signal to look closer, never an automatic penalty ${mark(5)}</span></p>
          <div class="row gap wrap">${btn('Approve and issue certificate', 'approveReport', { id: r.id })}${btn('Return with notes', 'returnReport', { id: r.id }, 'secondary')}${mark(6)}</div>
        </div>`;
      }

      const doneList = done.length ? `<div class="card"><h4>Done in this demo</h4><ul class="plain">${done.map((x) => {
        const l = App.sel.learner(x.learnerId);
        return `<li class="row between"><span>${esc(l ? l.name : '')} · ${x.status === 'approved' ? x.finalScore + '/100' : 'returned'}</span>${x.status === 'approved' ? chip(dur(x.approvedAt - x.submittedAt) + ' to certificate', x.approvedAt - x.submittedAt <= 72 * H ? 'green' : 'red') : chip('Returned', 'amber')}</li>`;
      }).join('')}</ul></div>` : '';

      return `<div class="layout-3">
        <div class="stack"><div class="card"><h3>To review · ${queue.length} ${mark(1)}</h3><p class="muted small">Promise: certificate within 72 hours of submission</p><div class="list">${list}</div></div>${doneList}</div>
        <div class="stack">${detail || empty('Queue is clear', 'New submissions appear here with an AI draft ready.', btn('Submit Ananya\'s report', 'go', { persona: 'learner', screen: 'project' }, 'secondary'))}</div>
        ${notes([
          ['Deadline queue', 'Sorted by time left on the 72-hour promise.'],
          ['Copies matched', 'Group copies are merged, so one report is read once.'],
          ['Rubric draft', 'A score per deliverable with the page it came from. Rows where you differ by more than 1 point are highlighted.'],
          ['Editable feedback', 'AI drafts it; the evaluator edits and owns it.'],
          ['Originality signal', 'Flags passages to check, never a penalty on its own.'],
          ['A person approves', 'Approval issues the certificate automatically and tells the learner.'],
        ])}
      </div>`;
    },
  };

  Object.assign(App.actions, {
    selectReport: (d) => { App.state.ui.report = d.id; App.commit(); },
    setScore: (d, el) => { App.do.setScore(d.id, Number(d.idx), el.value); App.commit(); },
    setFeedback: (d, el) => { App.do.setFeedback(d.id, el.value); App.save(); },
    approveReport: (d) => {
      const fb = document.getElementById('fb'); if (fb) App.do.setFeedback(d.id, fb.value);
      App.do.approveReport(d.id); App.commit();
      const r = App.sel.report(d.id); App.ui.toast(`Approved. Certificate ${r ? r.certificateId : ''} issued and the learner notified.`);
    },
    returnReport: (d) => {
      const fb = document.getElementById('fb'); if (fb) App.do.setFeedback(d.id, fb.value);
      App.do.returnReport(d.id); App.commit(); App.ui.toast('Returned to the learner with your notes.');
    },
  });
})(window.App);
