/*
 * State, persistence and every action that changes data.
 * Views never change state directly: they call App.do.* and then App.commit().
 */
window.App = window.App || {};

(function (App) {
  const KEY = 'ss-ai-ops-demo';
  const M = 60e3, H = 60 * M, D = 24 * H;

  // ---------- clock ----------
  // The demo clock can run ahead of real time ("+1 hour" button) to show timers and promises changing.
  App.now = () => Date.now() + (App.state ? App.state.clockOffset : 0);
  const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

  // ---------- persistence ----------
  App.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.version === App.SEED_VERSION) return s;
      }
    } catch (e) { /* storage blocked or corrupt: start fresh */ }
    return App.seed();
  };
  App.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(App.state)); } catch (e) { /* private mode: keep going in memory */ }
  };
  App.reset = function () {
    App.state = App.seed();
    App.do.startQualifier();
    App.save();
  };

  const S = () => App.state;
  const uid = (p) => p + Math.random().toString(36).slice(2, 8);
  const log = (who, text) => {
    S().log.unshift({ at: App.now(), who, text });
    S().log = S().log.slice(0, 40);
  };

  // ---------- selectors ----------
  App.sel = {
    learner: (id) => S().learners.find((l) => l.id === id),
    ananya: () => S().learners.find((l) => l.id === 'ananya'),
    mentor: (id) => S().mentors.find((m) => m.id === id),
    lead: (id) => S().leads.find((l) => l.id === id),
    report: (id) => S().reports.find((r) => r.id === id),
    reportFor: (learnerId) => S().reports.find((r) => r.learnerId === learnerId),
    waiting: () => S().learners.filter((l) => !l.mentorId).sort((a, b) => a.paidAt - b.paidAt),
    openHandoffs: () => S().handoffs.filter((h) => h.status === 'open').sort((a, b) => a.createdAt - b.createdAt),
    inReview: () => S().reports.filter((r) => r.status === 'in_review').sort((a, b) => a.submittedAt - b.submittedAt),
    chat: (id) => (S().chats[id] = S().chats[id] || []),
    kbStatus(a) {
      const today = isoDay(App.now());
      if (a.nextReview < today) return 'overdue';
      const days = (new Date(a.nextReview) - new Date(today)) / D;
      return days <= 14 ? 'due' : 'current';
    },
    reportTotal: (r, key = 'final') => Math.round((r.rubric.reduce((a, x) => a + Number(x[key] || 0), 0) / (r.rubric.length * 10)) * 100),
  };

  // ---------- WhatsApp qualifier script (persona: prospect) ----------
  App.QUALIFIER = [
    { key: 'consent', bot: 'Hi Ananya, thanks for joining the Unstop workshop on product careers. Three quick questions so the right counselor calls you. OK to message you here?', options: ['Yes', 'No'] },
    { key: 'goal', bot: 'What are you preparing for?', options: ['Summer placements', 'Final placements', 'Career switch'] },
    { key: 'domain', bot: 'Which domain interests you most?', options: ['Product', 'Marketing', 'Consulting', 'Finance', 'HR'] },
    { key: 'timing', bot: 'When do your placements start?', options: ['Within 4 weeks', '1–3 months', 'Later'] },
  ];
  const DOMAINS = { Product: ['product', 'fintech'], Marketing: ['marketing', 'brand'], Consulting: ['consulting', 'strategy'], Finance: ['finance', 'equity'], HR: ['hr'] };

  // Rule-based fit tier (the plan adds AI lead scoring from month 7, once there is outcome data)
  App.fitFor = (a) => {
    if (!a || !a.goal) return null;
    const placements = a.goal === 'Summer placements' || a.goal === 'Final placements';
    if (placements && a.timing !== 'Later') return 'High';
    if (a.goal === 'Career switch' && a.timing === 'Later') return 'Low';
    return 'Medium';
  };
  App.fitReason = (a) => {
    const f = App.fitFor(a);
    if (!f) return 'Not qualified yet: no WhatsApp answers.';
    if (f === 'High') return `Placements ${a.timing === 'Within 4 weeks' ? 'within 4 weeks' : 'in 1–3 months'}, in a domain we serve (${a.domain}).`;
    if (f === 'Low') return 'Career switch with no near-term deadline.';
    return a.timing === 'Later' ? 'Placements are further away.' : 'Career switch; worth a call this week.';
  };

  // ---------- actions ----------
  App.do = {
    // Prospect ------------------------------------------------------------
    startQualifier() {
      const q = S().qualifier;
      if (!q.messages.length) q.messages.push({ from: 'bot', text: App.QUALIFIER[0].bot, at: App.now() });
    },
    qualify(option) {
      const q = S().qualifier;
      const step = App.QUALIFIER[q.step];
      if (!step || q.done || q.declined) return;
      const now = App.now();
      q.messages.push({ from: 'me', text: option, at: now });
      q.answers[step.key] = option;
      if (step.key === 'consent' && option === 'No') {
        q.declined = true;
        q.messages.push({ from: 'bot', text: 'No problem, we won\'t message you again. Reply START any time if you change your mind.', at: now });
        return;
      }
      q.step += 1;
      if (q.step < App.QUALIFIER.length) {
        q.messages.push({ from: 'bot', text: App.QUALIFIER[q.step].bot, at: now });
        return;
      }
      // Finished: create the lead in the CRM
      q.done = true;
      const answers = { goal: q.answers.goal, domain: q.answers.domain, timing: q.answers.timing };
      const fit = App.fitFor(answers);
      q.messages.push({ from: 'bot', text: 'Thanks, Ananya! A counselor will call you within 15 minutes. Meanwhile, here is the program page:', at: now });
      q.messages.push({ from: 'bot', kind: 'link', at: now });
      S().leads = S().leads.filter((l) => l.id !== 'ld-ananya');
      S().leads.push({
        id: 'ld-ananya', name: 'Ananya R.', source: 'Unstop workshop', createdAt: now, stage: 'qualified', fit, answers, consent: true, firstContactAt: null,
        timeline: [[now - 3 * M, 'Joined the Unstop workshop'], [now, 'Qualified on WhatsApp (3 answers)']],
      });
      S().ui.lead = 'ld-ananya';
      S().minutesSaved += 2;
      log('WhatsApp', `Ananya qualified as ${fit} fit; lead created in the CRM`);
    },
    qualifyRestart() {
      S().qualifier = { step: 0, answers: {}, messages: [], done: false, declined: false };
      const lead = App.sel.lead('ld-ananya');
      if (lead && lead.stage !== 'enrolled') S().leads = S().leads.filter((l) => l.id !== 'ld-ananya');
      App.do.startQualifier();
    },
    autoQualify() {
      App.do.qualifyRestart();
      ['Yes', 'Summer placements', 'Product', 'Within 4 weeks'].forEach((o) => App.do.qualify(o));
    },

    // Counselor -----------------------------------------------------------
    leadCall(id) {
      const l = App.sel.lead(id); if (!l) return;
      const now = App.now();
      if (!l.firstContactAt) l.firstContactAt = now;
      l.timeline.push([now, 'Counselor called']);
      if (l.stage === 'new' || l.stage === 'qualified') l.stage = 'counseling';
      log('Counselor', `Called ${l.name} (${Math.max(1, Math.round((l.firstContactAt - l.createdAt) / M))} min after the lead came in)`);
    },
    leadWhatsApp(id) {
      const l = App.sel.lead(id); if (!l) return;
      const now = App.now();
      if (!l.firstContactAt) l.firstContactAt = now;
      l.timeline.push([now, 'Sent the program page on WhatsApp']);
      log('Counselor', `Sent ${l.name} the program page on WhatsApp`);
    },
    leadEnroll(id) {
      const l = App.sel.lead(id); if (!l || l.stage === 'enrolled') return;
      const now = App.now();
      if (!l.firstContactAt) l.firstContactAt = now;
      l.stage = 'enrolled';
      l.timeline.push([now, 'Paid and enrolled']);
      const domain = (l.answers && l.answers.domain) || 'Product';
      const isAnanya = id === 'ld-ananya';
      const lid = isAnanya ? 'ananya' : uid('l-');
      if (App.sel.learner(lid)) return;
      const first = l.name.split(' ')[0];
      S().learners.push({
        id: lid, name: l.name, first, program: App.PROGRAM_BY_DOMAIN[domain], cohort: 'Oct 2026', paidAt: now, mentorId: null, matchedAt: null,
        domains: DOMAINS[domain] || ['product'], attended: 0, due: isoDay(now + 16 * D), checks: {},
        group: isAnanya ? ['Ananya R.', 'Kunal S.', 'Diya M.'] : [l.name],
        brief: isAnanya
          ? { background: 'B.Com; 2 years as a business analyst at a bank; MBA year 1', goal: `${l.answers.goal || 'Summer placements'} in ${domain.toLowerCase()}, ideally fintech`, strengths: 'Excel models, user interviews', gaps: 'Market sizing, PRD writing', focus: 'PRD structure, guesstimates' }
          : { background: 'From the CV (sample)', goal: `${(l.answers && l.answers.goal) || 'Placements'} in ${domain.toLowerCase()}`, strengths: 'To confirm on the first call', gaps: 'To confirm on the first call', focus: 'Agree goals in the first session' },
      });
      App.sel.chat(lid).push({ id: uid('m'), from: 'bot', kind: 'notice', text: `Welcome to Skilled Sapiens, ${first}! Your mentor will be confirmed within 48 hours. Ask me anything about your live project, any time.`, at: now });
      S().ui.match = lid;
      log('Counselor', `${l.name} paid and enrolled; added to the mentor queue`);
    },

    // Program manager -----------------------------------------------------
    confirmMatch(learnerId, mentorId) {
      const l = App.sel.learner(learnerId), m = App.sel.mentor(mentorId);
      if (!l || !m || l.mentorId) return;
      const now = App.now();
      l.mentorId = m.id; l.matchedAt = now; l.matchedLive = true;
      m.load += 1;
      App.sel.chat(l.id).push({ id: uid('m'), from: 'bot', kind: 'notice', text: `You're matched with ${m.name} (${m.bio}). Your first review is ${m.slot}; the booking link is in your email.`, at: now });
      S().minutesSaved += 6;
      log('Program manager', `Confirmed ${m.name} for ${l.name}, ${App.ui.dur(now - l.paidAt)} after payment`);
    },
    confirmTop(learnerId) {
      const l = App.sel.learner(learnerId); if (!l) return;
      const top = App.ai.rankMentors(l)[0];
      if (top) App.do.confirmMatch(learnerId, top.m.id);
    },
    saveFocus(learnerId, text) {
      const l = App.sel.learner(learnerId); if (!l || !text) return;
      l.brief.focus = text;
      log('Program manager', `Edited ${l.first}'s brief`);
    },
    skipWeeks(learnerId) {
      const l = App.sel.learner(learnerId); if (!l) return;
      l.attended = Math.max(l.attended || 0, 3);
      log('Demo', `${l.first} attended weekly reviews 1–3 (skipped ahead)`);
    },
    publishRecap(id) {
      const r = S().recaps.find((x) => x.id === id); if (!r || r.status === 'published') return;
      r.status = 'published'; r.approvedAt = App.now();
      S().minutesSaved += 21;
      const a = App.sel.ananya();
      if (a) App.sel.chat('ananya').push({ id: uid('m'), from: 'bot', kind: 'notice', text: `Your week ${r.week} recap is ready in the LMS: summary, action items and key moments.`, at: App.now() });
      log('Program manager', `Checked and published the week ${r.week} recap`);
    },

    // Learner ---------------------------------------------------------------
    enrollAnanyaShortcut() {
      if (!S().qualifier.done || !App.sel.lead('ld-ananya')) App.do.autoQualify();
      App.do.leadCall('ld-ananya');
      App.do.leadEnroll('ld-ananya');
    },
    learnerSays(learnerId, text) {
      App.sel.chat(learnerId).push({ id: uid('m'), from: 'learner', text, at: App.now() });
    },
    sapiensReplies(learnerId, text) {
      const l = App.sel.learner(learnerId); if (!l) return;
      const now = App.now();
      const r = App.ai.respond(l, text);
      App.sel.chat(learnerId).push({ id: uid('m'), from: 'bot', kind: r.kind, text: r.text, source: r.source || null, at: now });
      if (r.kind === 'answer' || r.kind === 'status') {
        S().aiResolved.unshift({ q: text, source: r.source || 'Learner record', at: now, live: true });
        S().minutesSaved += 4;
      }
      if (r.gap) App.do.addGap(r.gap);
      if (r.handoff) {
        S().handoffs.push(Object.assign({ id: uid('h'), learnerId, question: text, createdAt: now, status: 'open' }, r.handoff));
        log('Ask Sapiens', `Handed ${l.first}'s question to a coordinator (${r.handoff.reason})`);
      }
    },
    ask(learnerId, text) { App.do.learnerSays(learnerId, text); App.do.sapiensReplies(learnerId, text); },
    rateAnswer(learnerId, msgId, good) {
      const m = App.sel.chat(learnerId).find((x) => x.id === msgId); if (!m || m.rated) return;
      m.rated = good ? 'up' : 'down';
      if (!good) { S().wrongLive = (S().wrongLive || 0) + 1; log('Ask Sapiens', 'A learner flagged an answer as wrong'); }
    },
    addGap(question) {
      const t = App.ai.tokens(question);
      const similar = S().gaps.find((g) => App.ai.overlap(t, App.ai.tokens(g.question)) >= 0.6);
      if (similar) similar.count += 1;
      else S().gaps.push({ id: uid('g'), question, count: 1 });
      S().gaps.sort((a, b) => b.count - a.count);
    },
    toggleCheck(learnerId, key) {
      const l = App.sel.learner(learnerId); if (!l) return;
      l.checks = l.checks || {};
      l.checks[key] = !l.checks[key];
    },
    rateRecap(learnerId, recapId, good) {
      const l = App.sel.learner(learnerId); if (!l) return;
      l.recapRatings = l.recapRatings || {};
      if (l.recapRatings[recapId]) return;
      l.recapRatings[recapId] = good ? 'yes' : 'no';
      S().history.ratings.push(good ? 5 : 3);
    },
    submitReport(learnerId, file) {
      const l = App.sel.learner(learnerId); if (!l) return;
      const old = App.sel.reportFor(learnerId);
      if (old && old.status !== 'returned') return; // one live submission at a time
      if (old) S().reports = S().reports.filter((r) => r !== old);
      const now = App.now();
      const rows = App.RUBRICS[l.program] || App.RUBRICS.default;
      const draft = S().ananyaDraft;
      const group = (l.group || [l.name]).length;
      S().reports.push({
        id: uid('r-'), learnerId, program: l.program, project: 'Project 1', group, copies: group, file, pages: 32, submittedAt: now, status: 'in_review',
        rubric: rows.map((label, i) => ({ label, ai: draft.scores[i] || 7, final: draft.scores[i] || 7, evidence: draft.evidence[i] || '' })),
        feedback: draft.feedback, originality: 'No concerns', notes: draft.notes,
      });
      App.sel.chat(learnerId).push({ id: uid('m'), from: 'bot', kind: 'notice', text: `Got it: ${file} arrived at ${App.ui.clock(now)}. ${group > 1 ? `Your teammates' copies were matched to one group report. ` : ''}Certificates issue within 72 hours.`, at: now });
      log(l.first, `Submitted ${file}${group > 1 ? ` (group of ${group}, copies matched)` : ''}`);
    },

    // Coordinator -----------------------------------------------------------
    sendHandoff(id, text) {
      const h = S().handoffs.find((x) => x.id === id); if (!h || h.status !== 'open') return;
      const now = App.now();
      h.status = 'sent'; h.reply = text || h.suggested; h.sentAt = now;
      App.sel.chat(h.learnerId).push({ id: uid('m'), from: 'staff', who: 'Neel, coordinator', text: h.reply, at: now });
      const l = App.sel.learner(h.learnerId);
      log('Coordinator', `Replied to ${l ? l.first : 'a learner'} ${App.ui.dur(now - h.createdAt)} after the hand-off`);
    },
    handoffToKB(id, title, body) {
      const h = S().handoffs.find((x) => x.id === id); if (!h || !title || !body) return;
      App.do.addArticle(title, body, 'Coordinator');
      h.addedToKB = true;
      log('Coordinator', `Added "${title}" to One Source`);
    },

    // Evaluator -------------------------------------------------------------
    setScore(reportId, idx, val) {
      const r = App.sel.report(reportId); if (!r || r.status !== 'in_review') return;
      const n = Math.max(0, Math.min(10, Math.round(Number(val))));
      if (!Number.isNaN(n)) r.rubric[idx].final = n;
    },
    setFeedback(reportId, text) {
      const r = App.sel.report(reportId); if (!r || r.status !== 'in_review') return;
      r.feedback = text;
    },
    approveReport(reportId) {
      const r = App.sel.report(reportId); if (!r || r.status !== 'in_review') return;
      const now = App.now();
      const l = App.sel.learner(r.learnerId);
      const code = r.program.split(/[ &]+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 3).toUpperCase();
      r.status = 'approved'; r.approvedAt = now; r.approvedLive = true;
      r.finalScore = App.sel.reportTotal(r);
      r.certificateId = `SS-${code}-26-${String(1000 + Math.floor(Math.random() * 9000))}`;
      S().minutesSaved += r.copies * 20 - 8 + 3;
      if (l) App.sel.chat(l.id).push({ id: uid('m'), from: 'bot', kind: 'notice', text: `Your certificate ${r.certificateId} is ready, with written feedback for each deliverable. Open Project in the LMS to download it.`, at: now });
      log('Evaluator', `Approved ${l ? l.first : ''}'s report (${r.finalScore}/100); certificate ${r.certificateId} issued`);
    },
    returnReport(reportId) {
      const r = App.sel.report(reportId); if (!r || r.status !== 'in_review') return;
      const l = App.sel.learner(r.learnerId);
      r.status = 'returned'; r.returnedAt = App.now();
      if (l) App.sel.chat(l.id).push({ id: uid('m'), from: 'bot', kind: 'notice', text: 'Your evaluator returned your report with notes. Open Project to read them and upload a new version.', at: App.now() });
      log('Evaluator', `Returned ${l ? l.first : ''}'s report with notes`);
    },

    // Knowledge owner -------------------------------------------------------
    addArticle(title, body, owner) {
      const a = { id: uid('k-'), title, collection: 'Live projects', owner: owner || 'Program manager', nextReview: isoDay(App.now() + 60 * D), sourceLabel: title, body, keywords: App.ai.tokens(title), added: true };
      S().kb.push(a);
      // Close any gap that asked the same thing
      const t = App.ai.tokens(title);
      S().gaps = S().gaps.filter((g) => App.ai.overlap(t, App.ai.tokens(g.question)) < 0.5);
      return a;
    },
    answerGap(gapId, title, body, owner) {
      const g = S().gaps.find((x) => x.id === gapId); if (!g || !body) return;
      App.do.addArticle(title || g.question, body, owner);
      S().gaps = S().gaps.filter((x) => x.id !== gapId);
      S().flags.gapAnswered = true;
      log('Knowledge owner', `Answered "${g.question}" (asked ${g.count}×); Ask Sapiens can use it now`);
    },
    markReviewed(id) {
      const a = S().kb.find((x) => x.id === id); if (!a) return;
      a.nextReview = isoDay(App.now() + 90 * D);
      log('Knowledge owner', `Reviewed "${a.title}"; visible to Ask Sapiens again`);
    },
    editArticle(id, body) {
      const a = S().kb.find((x) => x.id === id); if (!a || !body) return;
      a.body = body;
      log('Knowledge owner', `Edited "${a.title}"`);
    },
    approveFact(id, value) {
      const f = S().facts.find((x) => x.id === id); if (!f || !value) return;
      f.value = value; f.approvedAt = App.now();
      log('Knowledge owner', `Approved one public figure for ${f.label}: ${value}`);
    },

    // Demo controls ----------------------------------------------------------
    clockForward(ms) {
      S().clockOffset += ms;
      log('Demo', `Clock moved forward ${App.ui.dur(ms)}`);
    },
  };

  // ---------- metrics for the leadership dashboard ----------
  const median = (a) => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); const m = Math.floor(b.length / 2); return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  App.metrics = function () {
    const s = S(), now = App.now(), h = s.history;
    // Promise 1: reply within 1 hour (AI answers count as instant)
    let rk = h.replies.kept, rt = h.replies.total;
    const liveAI = s.aiResolved.filter((a) => a.live).length;
    rk += liveAI; rt += liveAI;
    s.handoffs.forEach((x) => {
      if (x.status === 'sent') { rt += 1; if (x.sentAt - x.createdAt <= H) rk += 1; }
      else if (now - x.createdAt > H) rt += 1;
    });
    // Promise 2: mentor within 48 hours of payment
    let mk = h.mentors.kept, mt = h.mentors.total;
    s.learners.forEach((l) => {
      if (l.matchedLive) { mt += 1; if (l.matchedAt - l.paidAt <= 48 * H) mk += 1; }
      else if (!l.mentorId && now - l.paidAt > 48 * H) mt += 1;
    });
    // Promise 3: certificate within 72 hours of submission
    let ck = h.certs.kept, ct = h.certs.total;
    const certHours = [...h.certHours];
    let agree = h.agreement.agree, agreeTotal = h.agreement.total;
    s.reports.forEach((r) => {
      if (r.approvedLive) {
        ct += 1; const hrs = (r.approvedAt - r.submittedAt) / H; if (hrs <= 72) ck += 1; certHours.push(hrs);
        r.rubric.forEach((x) => { agreeTotal += 1; if (Math.abs(x.final - x.ai) <= 1) agree += 1; });
      } else if (r.status === 'in_review' && now - r.submittedAt > 72 * H) ct += 1;
    });
    const aiToday = s.aiResolvedBase + s.aiResolved.length;
    const staffToday = s.staffHandledBase + s.handoffs.length;
    const ratings = h.ratings;
    const m = {
      reply: { kept: rk, total: rt }, mentor: { kept: mk, total: mt }, cert: { kept: ck, total: ct },
      promisesPct: Math.round(((rk + mk + ck) / Math.max(1, rt + mt + ct)) * 100),
      hoursSaved: (h.minutesSaved + s.minutesSaved) / 60,
      csat: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      agreementPct: Math.round((agree / Math.max(1, agreeTotal)) * 100),
      aiToday, staffToday,
      resolvedPct: Math.round((aiToday / Math.max(1, aiToday + staffToday)) * 100),
      wrong: h.wrongAnswers + (s.wrongLive || 0),
      firstReply: h.firstReplyMin,
      certMedian: Math.round(median(certHours)),
    };
    const band = (v, onPlan, watch) => (onPlan(v) ? 'On plan' : watch(v) ? 'Watch' : 'Act');
    m.scorecard = [
      ['Resolved without a person', m.resolvedPct + '%', band(m.resolvedPct, (v) => v >= 40, (v) => v >= 25)],
      ['Wrong answers per 50', String(m.wrong), band(m.wrong, (v) => v <= 1, (v) => v <= 3)],
      ['Median first reply', m.firstReply + ' min', band(m.firstReply, (v) => v < 5, (v) => v <= 60)],
      ['AI–evaluator agreement', m.agreementPct + '%', band(m.agreementPct, (v) => v >= 85, (v) => v >= 75)],
      ['Submission to certificate', m.certMedian + ' h', band(m.certMedian, (v) => v <= 72, (v) => v <= 96)],
      ['Learner CSAT', m.csat.toFixed(1), band(m.csat, (v) => v >= 4.3, (v) => v >= 4.0)],
    ];
    const acts = m.scorecard.filter((x) => x[2] === 'Act').length;
    const watches = m.scorecard.filter((x) => x[2] === 'Watch').length;
    m.decision = acts >= 3 ? ['Stop and rethink', 'red'] : acts >= 1 ? ['Correct: fix within 2 weeks', 'amber'] : watches ? ['On track: keep the pilot running', 'green'] : ['Scale to all 8 roles', 'green'];
    return m;
  };
})(window.App);
