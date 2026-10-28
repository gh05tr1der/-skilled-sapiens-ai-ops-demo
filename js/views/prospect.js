/* Persona: prospect (L1). Ananya before she enrolls, answering the WhatsApp qualifier. */
(function (App) {
  const { esc, btn, chip, phone, notes, clock } = App.ui;

  App.views.prospect = {
    chat(s) {
      const q = s.qualifier;
      const body = q.messages.map((m) => {
        if (m.kind === 'link') {
          return `<a class="bubble bot link-card" href="https://skilledsapiens.com/live-project/" target="_blank" rel="noopener">
            <b>Corporate Live Projects</b><small>skilledsapiens.com · from ₹2,199</small></a>`;
        }
        return `<div class="bubble ${m.from === 'me' ? 'me' : 'bot'}">${esc(m.text)}<span class="meta">${clock(m.at)}</span></div>`;
      }).join('');

      const step = App.QUALIFIER[q.step];
      let footer = '';
      if (!q.done && !q.declined && step) {
        footer = `<div class="quick">${step.options.map((o) => btn(o, 'qualify', { v: o }, 'reply')).join('')}</div>
          <div class="fake-input">Tap an answer above</div>`;
      } else if (q.done) {
        const lead = App.sel.lead('ld-ananya');
        footer = `<div class="system-note">Lead created in the CRM: ${chip((lead && lead.fit ? lead.fit : 'High') + ' fit', 'dark')}</div>
          ${btn('Open the counselor\'s board', 'go', { persona: 'counselor', screen: 'leads' }, 'primary block')}`;
      } else {
        footer = btn('Start again', 'qualifyRestart', {}, 'secondary block');
      }

      return `<div class="layout-phone">
        ${phone({ title: 'Skilled Sapiens', sub: 'Business account · WhatsApp', body, footer, code: 'L1' })}
        ${notes([
          ['Consent first', 'Opt-in comes before any question; "No" ends the chat and nothing is stored.'],
          ['Tap, don\'t type', 'Three button questions. The answers go straight into the CRM.'],
          ['Fit tier by rule', 'Placements soon + a domain Skilled Sapiens serves = High fit. AI scoring comes in month 7, once there is outcome data.'],
          ['A clear next step', 'The lead is promised a call within 15 minutes and gets the right program page.'],
        ])}
      </div>`;
    },
  };

  Object.assign(App.actions, {
    qualify: (d) => { App.do.qualify(d.v); App.commit(); },
    qualifyRestart: () => { App.do.qualifyRestart(); App.commit(); },
  });
})(window.App);
