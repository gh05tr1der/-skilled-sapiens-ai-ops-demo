/*
 * Simulated AI. Everything here is deterministic and runs in the browser.
 * In production these functions would call real services (see docs/PRD.md,
 * "Simulated vs. real AI"): a WhatsApp AI agent grounded on One Source,
 * an LLM for rubric drafts and briefs, and meeting notes for recaps.
 * Keep the function names the same and swap the insides.
 */
window.App = window.App || {};

(function (App) {
  const STOP = new Set('a an the is are am i me my we our us you your of to for in on at and or can do does how what when where who will with be it this that from by as any have has had get got there please hi hello hey'.split(' '));

  const tokens = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
  // Share of the smaller token set found in the other one (0..1)
  const overlap = (a, b) => {
    if (!a.length || !b.length) return 0;
    const B = new Set(b);
    return a.filter((w) => B.has(w)).length / Math.min(a.length, b.length);
  };

  // Score knowledge-base pages against a question
  function searchKB(question, { includeHidden = false } = {}) {
    const q = String(question || '').toLowerCase();
    const qt = tokens(q);
    return App.state.kb
      .map((a) => {
        const hidden = App.sel.kbStatus(a) === 'overdue';
        let score = 0;
        (a.keywords || []).forEach((k) => { if (k.includes(' ') ? q.includes(k) : qt.includes(k)) score += 2; });
        score += overlap(qt, tokens(a.title + ' ' + a.body)) * 2;
        return { a, score, hidden };
      })
      .filter((x) => x.score >= 3 && (includeHidden || !x.hidden))
      .sort((x, y) => y.score - x.score);
  }

  const has = (t, re) => re.test(t);
  const days = (t) => { const m = t.match(/(\d+)\s*-?\s*days?/); return m ? m[1] : null; };

  // Main entry point for Ask Sapiens. Returns { kind, text, source?, handoff?, gap? }
  function respond(learner, text) {
    const t = String(text || '').toLowerCase();
    const said = /[.?!]$/.test(String(text).trim()) ? String(text).trim() : String(text).trim() + '.';
    const first = learner.first;
    const s = App.state;

    // 1. Explicit request for a person
    if (has(t, /\b(person|human|agent|someone|call me|talk to)\b/)) {
      return {
        kind: 'handoff', text: 'Sure, I\'ve asked a coordinator to message you. They usually reply within the hour.',
        handoff: { reason: 'Asked for a person', sensitive: false, summary: `${first} asked to talk to a person.`, suggested: `Hi ${first}, this is Neel from Skilled Sapiens. How can I help?` },
      };
    }

    // 2. Sensitive topics always go to people, even if One Source has a page
    const sensitive = [
      [/(refund|money back|cancel)/, 'Refund request', 'Policy: refunds are decided by operations (One Source: Refunds).', `Hi ${first}, thanks for telling us. I've shared your refund request with our operations team; they will reply within one working day.`],
      [/(extension|extend|more time|medical|sick|hospital)/, 'Extension request', 'Policy: extensions need the program manager\'s approval (One Source: Extensions, review overdue).', `Hi ${first}, sorry to hear that. I've asked your program manager to approve a ${days(t) || 'short'}${days(t) ? '-day' : ''} extension; you'll have an answer today.`],
      [/(complain|complaint|unfair|harass|rude)/, 'Complaint', 'Complaints go to the program manager the same day.', `Hi ${first}, I'm sorry about this. I've flagged it to your program manager, who will call you today.`],
    ];
    for (const [re, reason, policy, suggested] of sensitive) {
      if (has(t, re)) {
        return {
          kind: 'handoff', text: 'I\'ve passed this to a coordinator with your details. You\'ll hear back within 1 hour.',
          handoff: { reason, sensitive: true, summary: `${first} asks: "${said}" ${policy}`, suggested },
        };
      }
    }

    // 3. Questions about the learner's own record
    const report = App.sel.reportFor(learner.id);
    const mentor = learner.mentorId ? App.sel.mentor(learner.mentorId) : null;
    const due = learner.due ? App.ui.date(learner.due) : 'the date in the LMS';
    if (has(t, /(certificate|result|score|grade|marks)/) && !has(t, /verify/)) {
      if (!report) return { kind: 'status', source: 'Learner record', text: `You haven't submitted your Project 1 report yet. It's due ${due}; certificates issue within 72 hours of submission.` };
      if (report.status === 'in_review') return { kind: 'status', source: 'Learner record', text: `Your report arrived ${App.ui.clock(report.submittedAt)}. Certificates issue within 72 hours, so by ${App.ui.clock(report.submittedAt + 72 * App.ui.H)}.` };
      if (report.status === 'approved') return { kind: 'status', source: 'Learner record', text: `Your certificate ${report.certificateId} was issued ${App.ui.clock(report.approvedAt)}. Open Project to download it and read your feedback.` };
      return { kind: 'status', source: 'Learner record', text: 'Your evaluator returned the report with notes. Open Project to read them and upload a new version.' };
    }
    if (has(t, /\bmentor\b/) && !has(t, /(change|different|switch)/)) {
      if (mentor) return { kind: 'status', source: 'Learner record', text: `Your mentor is ${mentor.name} (${mentor.bio}). Your next review is ${mentor.slot}.` };
      return { kind: 'status', source: 'Learner record', text: `Your mentor will be confirmed within 48 hours of payment; it has been ${App.ui.dur(App.now() - learner.paidAt)} so far.` };
    }
    if (has(t, /(due|deadline|last date|submit by)/)) {
      return { kind: 'status', source: 'Learner record', text: `Your Project 1 report is due ${due}. Upload it from Project in the LMS.` };
    }
    if (has(t, /next (session|review|class|meeting)/)) {
      if (mentor) return { kind: 'status', source: 'Learner record', text: `Your next weekly review is ${mentor.slot} with ${mentor.name}. The join link is on your home page.` };
      return { kind: 'status', source: 'Learner record', text: 'Your sessions start once your mentor is confirmed (within 48 hours of payment).' };
    }

    // 4. Answer from One Source (only pages that are not overdue for review)
    const hits = searchKB(text);
    if (hits.length) {
      const a = hits[0].a;
      return { kind: 'answer', text: a.body, source: a.sourceLabel || a.title };
    }

    // 5. Not sure: never guess. Log the gap and hand off.
    const hiddenHit = searchKB(text, { includeHidden: true })[0];
    const note = hiddenHit ? ` The closest page ("${hiddenHit.a.title}") is overdue for review, so Ask Sapiens can't use it.` : ' No approved answer in One Source; added to the gap queue.';
    return {
      kind: 'handoff', gap: text,
      text: 'I don\'t have an approved answer for that yet, so I\'ve passed it to a coordinator. You\'ll hear back within 1 hour.',
      handoff: { reason: 'Unsure answer', sensitive: false, summary: `${first} asks: "${said}"${note}`, suggested: `Hi ${first}, good question. Let me check with the program team and get back to you within the hour.` },
    };
  }

  // Rank mentors for a learner: domain match, spare capacity and rating, with reasons in plain words
  function rankMentors(learner) {
    return App.state.mentors
      .map((m) => {
        const dom = m.domains.filter((d) => (learner.domains || []).includes(d));
        const free = 1 - m.load / m.capacity;
        let score = dom.length * 3 + free * 2 + (m.rating - 4.5) * 2;
        if (m.load >= m.capacity) score -= 10;
        const reasons = [];
        if (dom.length) reasons.push('same domain (' + dom.join(', ') + ')');
        else reasons.push('no domain match');
        if (free >= 0.5) reasons.push('light load'); else if (free <= 0.2) reasons.push('busy this month');
        reasons.push('free ' + m.slot);
        return { m, score, reasons };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((r, i) => Object.assign(r, { fit: i === 0 && r.score >= 4 ? 'Strong fit' : r.score >= 3 ? 'Good fit' : 'Possible' }));
  }

  App.ai = { tokens, overlap, searchKB, respond, rankMentors };
})(window.App);
