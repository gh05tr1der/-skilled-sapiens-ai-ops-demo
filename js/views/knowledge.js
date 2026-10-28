/* Persona: knowledge owner (S5). One Source: every answer, policy and public figure in one place. */
(function (App) {
  const { esc, btn, chip, date, notes, mark, icon } = App.ui;
  const STATUS = { current: ['Current', 'green'], due: ['Due soon', 'amber'], overdue: ['Overdue', 'red'] };

  App.views.knowledge = {
    kb(s) {
      const coll = s.ui.coll || 'All';
      const q = s.ui.kbQuery || '';
      const collections = ['All', ...new Set(s.kb.map((a) => a.collection))];
      const pages = s.kb.filter((a) => coll === 'All' || a.collection === coll).sort((a, b) => a.nextReview.localeCompare(b.nextReview));
      const open = s.kb.find((a) => a.id === s.ui.article);
      const gapForm = s.ui.gapForm;
      const overdue = s.kb.filter((a) => App.sel.kbStatus(a) === 'overdue').length;

      let answer = '';
      if (q) {
        const hit = App.ai.searchKB(q)[0];
        const hidden = !hit && App.ai.searchKB(q, { includeHidden: true })[0];
        answer = hit
          ? `<div class="callout amber"><b class="eyebrow">AI answer</b><b>${esc(hit.a.body)}</b><small>${esc(hit.a.sourceLabel || hit.a.title)} · owner: ${esc(hit.a.owner)}</small></div>`
          : hidden ? `<div class="callout red"><b>Only an overdue page matches ("${esc(hidden.a.title)}").</b> Review it to make it usable again.</div>`
            : '<div class="callout grey">No approved answer. Learners asking this get a hand-off, and it lands in the gap queue.</div>';
      }

      const rows = pages.map((a) => {
        const [lab, kind] = STATUS[App.sel.kbStatus(a)];
        return `<tr class="${open && open.id === a.id ? 'selected' : ''}" data-action="openArticle" data-id="${a.id}"><td><b>${esc(a.title)}</b>${a.added ? ' ' + chip('New', 'green') : ''}</td><td>${esc(a.owner)}</td><td>${App.ui.dshort(a.nextReview)}</td><td>${chip(lab, kind)}</td></tr>`;
      }).join('');

      const detail = open ? `<div class="card">
        <div class="row between"><h3>${esc(open.title)}</h3>${chip(STATUS[App.sel.kbStatus(open)][0], STATUS[App.sel.kbStatus(open)][1])}</div>
        <p class="small muted">${esc(open.collection)} · owner: ${esc(open.owner)} · next review ${date(open.nextReview)}</p>
        ${s.ui.editArticle === open.id ? `<form data-submit="saveArticle"><input type="hidden" name="id" value="${open.id}"><textarea name="body" rows="4">${esc(open.body)}</textarea><div class="row gap"><button class="btn primary small">Save</button>${btn('Cancel', 'cancelEdit', {}, 'ghost small')}</div></form>`
          : `<p>${esc(open.body)}</p><div class="row gap wrap">${btn('Mark reviewed (+90 days)', 'markReviewed', { id: open.id })}${btn('Edit', 'editArticle', { id: open.id }, 'secondary')}${btn('Close', 'closeArticle', {}, 'ghost')}</div>`}
      </div>` : '';

      const facts = s.facts.map((f) => `<li class="row between">${esc(f.label)} ${f.value ? `<b>${esc(f.value)}</b>`
        : `<form data-submit="approveFact" class="row gap"><input type="hidden" name="id" value="${f.id}"><input name="value" placeholder="One figure" aria-label="${esc(f.label)}" size="7"><button class="btn secondary small">Approve</button></form>`}</li>`).join('');

      const gaps = s.gaps.map((g) => gapForm === g.id
        ? `<li class="gap-form"><form data-submit="answerGap"><input type="hidden" name="id" value="${g.id}"><b>${esc(g.question)}</b>
            <textarea name="body" rows="3" placeholder="The approved answer every learner should get"></textarea>
            <label class="lbl">Owner</label><select name="owner"><option>Program manager</option><option>Operations</option><option>Mentor lead</option><option>Founder</option></select>
            <div class="row gap"><button class="btn primary small">Publish</button>${btn('Cancel', 'gapFormClose', {}, 'ghost small')}</div></form></li>`
        : `<li class="row between"><span>${esc(g.question)}</span><span class="row gap">${chip(g.count + '×')}${btn('Answer', 'gapFormOpen', { id: g.id }, 'secondary small')}</span></li>`).join('') || '<li class="muted small">No open questions.</li>';

      return `<div class="layout-3 kb-layout">
        <div class="card"><h3>Collections</h3><div class="list">${collections.map((c) => btn(`${c}${c === 'All' ? '' : ' · ' + s.kb.filter((a) => a.collection === c).length}`, 'setColl', { c }, coll === c ? 'nav active' : 'nav')).join('')}</div></div>
        <div class="stack">
          <form data-submit="kbSearch" class="search card"><span class="search-field">${icon('compass')}<input name="q" value="${esc(q)}" placeholder="Ask the knowledge base, e.g. group submission rules" aria-label="Search One Source"></span><button class="btn primary small">Ask</button>${mark(1)}</form>
          ${answer}
          ${detail}
          <div class="card"><div class="row between"><h3>Pages ${mark(2)}</h3>${overdue ? chip(overdue + ' overdue', 'red') : chip('All in date', 'green')}</div>
            <table class="tbl clickable"><thead><tr><th>Page</th><th>Owner</th><th>Next review</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
            <p class="callout red small">${mark(3)} Overdue pages are hidden from Ask Sapiens until someone reviews them.</p></div>
        </div>
        <div class="stack">
          <div class="card"><h3>Approved facts sheet ${mark(4)}</h3><p class="small muted">One set of public figures for the website, Ask Sapiens and decks. The site shows several numbers today.</p><ul class="plain facts">${facts}</ul></div>
          <div class="card"><h3>Unanswered questions ${mark(5)}</h3><p class="small muted">From Ask Sapiens, most asked first</p><ul class="plain gaps">${gaps}</ul><p class="small muted">${mark(6)} A published answer is live for staff and Ask Sapiens at once.</p></div>
          ${notes([
            ['Ask, don\'t browse', 'Staff get the answer plus the page behind it.'],
            ['One owner per page', 'Every policy has a named person and a review date.'],
            ['Review dates', 'Overdue pages turn red and are hidden from the assistant.'],
            ['Approved facts sheet', 'Ends the conflicting partner and mentor numbers on the site.'],
            ['Gap queue', 'What learners asked that had no answer, most asked first.'],
            ['Write once', 'Ask Sapiens can answer it straight away; try it as Ananya.'],
          ])}
        </div>
      </div>`;
    },
  };

  Object.assign(App.actions, {
    setColl: (d) => { App.state.ui.coll = d.c; App.commit(); },
    kbSearch: (f) => { App.state.ui.kbQuery = (f.q || '').trim(); App.commit(); },
    openArticle: (d) => { App.state.ui.article = d.id; App.state.ui.editArticle = null; App.commit(); },
    closeArticle: () => { App.state.ui.article = null; App.commit(); },
    editArticle: (d) => { App.state.ui.editArticle = d.id; App.commit(); },
    cancelEdit: () => { App.state.ui.editArticle = null; App.commit(); },
    saveArticle: (f) => { App.do.editArticle(f.id, (f.body || '').trim()); App.state.ui.editArticle = null; App.commit(); App.ui.toast('Page updated.'); },
    markReviewed: (d) => { App.do.markReviewed(d.id); App.commit(); App.ui.toast('Reviewed. The page is visible to Ask Sapiens again.'); },
    approveFact: (f) => { if (!(f.value || '').trim()) return App.ui.toast('Enter the one figure to publish.'); App.do.approveFact(f.id, f.value.trim()); App.commit(); },
    gapFormOpen: (d) => { App.state.ui.gapForm = d.id; App.commit(); },
    gapFormClose: () => { App.state.ui.gapForm = null; App.commit(); },
    answerGap: (f) => {
      if (!(f.body || '').trim()) { App.ui.toast('Write the answer first.'); return; }
      const g = App.state.gaps.find((x) => x.id === f.id);
      App.do.answerGap(f.id, g ? g.question.replace(/\?$/, '') : '', f.body.trim(), f.owner);
      App.state.ui.gapForm = null; App.commit();
      App.ui.toast('Published. Ask Sapiens can answer this now.');
    },
  });
})(window.App);
