/*
 * Seed data for the demo.
 * Everything here is SAMPLE data: no real learners, leads, mentors or policies.
 * Edit freely. If you change the shape of the data, bump SEED_VERSION so
 * browsers drop the copy they saved in localStorage.
 */
window.App = window.App || {};

App.SEED_VERSION = 4;

// Live-project roles, taken from the public Skilled Sapiens live-project page.
App.ROLES = [
  'Business Strategy & Growth Partner', 'Growth & Strategy Consultant', 'Product & Brand Manager',
  'Sales & Marketing Manager', 'Product Marketing', 'Digital Marketing Specialist', 'HR Manager',
  'Equity Research & Financial Modeling',
];

// Which program a lead is offered, based on the domain they pick on WhatsApp.
App.PROGRAM_BY_DOMAIN = {
  Product: 'Product & Brand Manager', Marketing: 'Sales & Marketing Manager', Consulting: 'Growth & Strategy Consultant',
  Finance: 'Equity Research & Financial Modeling', HR: 'HR Manager',
};

// Rubric rows per program (the Review Desk scores each row out of 10).
App.RUBRICS = {
  'Product & Brand Manager': ['D1 Opportunity assessment', 'D2 AI market research', 'D3 Prioritization', 'D4 Product recommendations', 'D5 Roadmap', 'D6 Success metrics', 'D7 Strategic recommendations'],
  'HR Manager': ['Problem diagnosis', 'Research', 'Recommendations', 'Implementation plan', 'Metrics'],
  'Growth & Strategy Consultant': ['Market sizing', 'Competitor analysis', 'Growth levers', 'Financials', 'Recommendation'],
  'Digital Marketing Specialist': ['Website and social audit', 'Audience', 'Channel plan', 'Content calendar', 'KPIs'],
  default: ['Problem', 'Analysis', 'Recommendations', 'Plan', 'Metrics'],
};

App.seed = function () {
  const now = Date.now();
  const M = 60e3, H = 60 * M, D = 24 * H;
  const day = (n) => new Date(now + n * D).toISOString().slice(0, 10);

  // A finished rubric draft: [label, aiScore, evidence]
  const rubric = (program, scores, evidence) =>
    (App.RUBRICS[program] || App.RUBRICS.default).map((label, i) => ({ label, ai: scores[i], final: scores[i], evidence: evidence[i] || '' }));

  return {
    version: App.SEED_VERSION,
    clockOffset: 0, // the "+1 hour" button adds to this
    persona: 'prospect',
    screen: 'chat',
    guideOpen: true,
    ui: {}, // which item is selected on each screen
    flags: {}, // small facts the guided demo checks (e.g. "saw the certificate")

    mentors: [
      { id: 'm1', name: 'Mentor A', bio: 'IIM alum · Product Manager at a fintech', domains: ['product', 'fintech'], load: 3, capacity: 6, rating: 4.8, slot: 'Thu 7:00 pm' },
      { id: 'm2', name: 'Mentor B', bio: 'IIT + IIM · Brand Manager, FMCG', domains: ['product', 'brand', 'marketing'], load: 5, capacity: 6, rating: 4.9, slot: 'Fri 8:00 pm' },
      { id: 'm3', name: 'Mentor C', bio: 'IIM alum · product consultant', domains: ['product', 'consulting'], load: 2, capacity: 6, rating: 4.6, slot: 'Mon 7:30 pm' },
      { id: 'm4', name: 'Mentor D', bio: 'IIM alum · strategy consultant', domains: ['consulting', 'strategy', 'growth'], load: 4, capacity: 6, rating: 4.7, slot: 'Wed 8:00 pm' },
      { id: 'm5', name: 'Mentor E', bio: 'XLRI alum · HR business partner', domains: ['hr'], load: 2, capacity: 6, rating: 4.8, slot: 'Tue 7:00 pm' },
      { id: 'm6', name: 'Mentor F', bio: 'IIM alum · equity research analyst', domains: ['finance', 'equity'], load: 3, capacity: 6, rating: 4.7, slot: 'Sat 11:00 am' },
      { id: 'm7', name: 'Mentor G', bio: 'Digital marketing lead, D2C brand', domains: ['digital', 'marketing'], load: 1, capacity: 6, rating: 4.5, slot: 'Thu 8:30 pm' },
    ],

    // Ananya is NOT here at the start: she is created when the counselor enrolls her.
    learners: [
      { id: 'dev', name: 'Dev K.', first: 'Dev', program: 'Equity Research & Financial Modeling', cohort: 'Oct 2026', paidAt: now - 44 * H, mentorId: null, matchedAt: null, domains: ['finance', 'equity'],
        brief: { background: 'B.Com (Hons); CFA Level 1 candidate; MBA year 1', goal: 'Summer internship in equity research', strengths: 'Valuation basics, Excel', gaps: 'Industry primers, report writing', focus: 'Sector selection; writing an initiation note' } },
      { id: 'priya', name: 'Priya S.', first: 'Priya', program: 'HR Manager', cohort: 'Oct 2026', paidAt: now - 31 * H, mentorId: null, matchedAt: null, domains: ['hr'],
        brief: { background: 'BBA; 1 year in talent acquisition at a staffing firm; MBA year 1', goal: 'HR generalist role in a manufacturing firm', strengths: 'Hiring operations', gaps: 'Compensation design, HR analytics', focus: 'Building an engagement survey and acting on it' } },
      { id: 'rahul', name: 'Rahul V.', first: 'Rahul', program: 'Growth & Strategy Consultant', cohort: 'Oct 2026', paidAt: now - 20 * H, mentorId: null, matchedAt: null, domains: ['consulting', 'strategy'],
        brief: { background: 'B.Tech (Mechanical); 2 years in operations at an auto component maker; MBA year 1', goal: 'Strategy consulting summer internship', strengths: 'Process thinking, data handling', gaps: 'Structuring, slide writing', focus: 'Issue trees and synthesis slides' } },
      { id: 'sara', name: 'Sara M.', first: 'Sara', program: 'Digital Marketing Specialist', cohort: 'Oct 2026', paidAt: now - 2 * H, mentorId: null, matchedAt: null, domains: ['digital', 'marketing'],
        brief: { background: 'BMS; runs a college fest Instagram page; MBA year 1', goal: 'Brand or digital marketing internship', strengths: 'Content, social media', gaps: 'Paid media, analytics', focus: 'Building a channel plan with a budget' } },
      // Learners already in progress (they own the reports and support chats below)
      { id: 'neha', name: 'Neha P.', first: 'Neha', program: 'HR Manager', cohort: 'Sep 2026', paidAt: now - 30 * D, mentorId: 'm5', matchedAt: now - 29 * D, domains: ['hr'], attended: 4 },
      { id: 'arjunt', name: 'Arjun T.', first: 'Arjun', program: 'Growth & Strategy Consultant', cohort: 'Sep 2026', paidAt: now - 33 * D, mentorId: 'm4', matchedAt: now - 32 * D, domains: ['consulting'], attended: 4 },
      { id: 'meerad', name: 'Meera D.', first: 'Meera', program: 'Digital Marketing Specialist', cohort: 'Sep 2026', paidAt: now - 31 * D, mentorId: 'm7', matchedAt: now - 30 * D, domains: ['digital'], attended: 4 },
      { id: 'karan', name: 'Karan S.', first: 'Karan', program: 'Sales & Marketing Manager', cohort: 'Oct 2026', paidAt: now - 9 * D, mentorId: 'm2', matchedAt: now - 8 * D, domains: ['marketing'], attended: 1 },
    ],

    leads: [
      { id: 'ld1', name: 'Arjun P.', source: 'Inbox: info@', createdAt: now - 18 * M, stage: 'new', fit: null, answers: {}, consent: null, firstContactAt: null, timeline: [[now - 18 * M, 'Emailed info@']] },
      { id: 'ld2', name: 'Sneha K.', source: 'Razorpay: left payment', createdAt: now - 5 * M, stage: 'new', fit: null, answers: {}, consent: null, firstContactAt: null, timeline: [[now - 5 * M, 'Left the Razorpay page before paying']] },
      { id: 'ld3', name: 'Rohan M.', source: 'Website form', createdAt: now - 2 * M, stage: 'new', fit: null, answers: {}, consent: true, firstContactAt: null, timeline: [[now - 2 * M, 'Filled the website form']] },
      { id: 'ld4', name: 'Isha N.', source: 'Instagram', createdAt: now - 1 * M, stage: 'new', fit: null, answers: {}, consent: null, firstContactAt: null, timeline: [[now - 1 * M, 'Messaged on Instagram']] },
      { id: 'ld5', name: 'Kabir S.', source: 'Instagram', createdAt: now - 9 * M, stage: 'qualified', fit: 'Medium', answers: { goal: 'Career switch', domain: 'Marketing', timing: 'Later' }, consent: true, firstContactAt: null, timeline: [[now - 9 * M, 'Qualified on WhatsApp']] },
      { id: 'ld6', name: 'Meera J.', source: 'Website form', createdAt: now - 3 * H, stage: 'counseling', fit: 'High', answers: { goal: 'Summer placements', domain: 'Consulting', timing: 'Within 4 weeks' }, consent: true, firstContactAt: now - 3 * H + 7 * M, note: 'Call booked 4 pm', timeline: [[now - 3 * H, 'Website form'], [now - 3 * H + 7 * M, 'Counselor called']] },
      { id: 'ld7', name: 'Ishaan T.', source: 'Razorpay', createdAt: now - 26 * H, stage: 'counseling', fit: 'Medium', answers: { goal: 'Final placements', domain: 'Finance', timing: '1–3 months' }, consent: true, firstContactAt: now - 26 * H + 12 * M, note: 'Follow-up Fri', timeline: [[now - 26 * H, 'Razorpay'], [now - 26 * H + 12 * M, 'Counselor called']] },
      { id: 'ld8', name: 'Tanvi G.', source: 'Unstop workshop', createdAt: now - 2 * D, stage: 'enrolled', fit: 'High', answers: {}, consent: true, firstContactAt: now - 2 * D + 6 * M, timeline: [] },
      { id: 'ld9', name: 'Om P.', source: 'Website form', createdAt: now - 3 * D, stage: 'enrolled', fit: 'High', answers: {}, consent: true, firstContactAt: now - 3 * D + 9 * M, timeline: [] },
      { id: 'ld10', name: 'Rhea S.', source: 'WhatsApp', createdAt: now - 4 * D, stage: 'enrolled', fit: 'Medium', answers: {}, consent: true, firstContactAt: now - 4 * D + 14 * M, timeline: [] },
    ],

    // The prospect's WhatsApp qualifier (persona: prospect)
    qualifier: { step: 0, answers: {}, messages: [], done: false, declined: false },

    // One Source knowledge base. nextReview is a date; pages past it are hidden from Ask Sapiens.
    kb: [
      { id: 'k-group', title: 'Group submissions', collection: 'Live projects', owner: 'Program manager', nextReview: day(33), sourceLabel: 'Live Project Guidelines, points 8–9',
        body: 'Each group member uploads the same report from their own LMS account. Reports sent by email, WhatsApp or a Drive link are not evaluated.',
        keywords: ['group', 'team', 'submit', 'submission', 'upload', 'whole', 'members', 'member', 'email', 'drive', 'one of us'] },
      { id: 'k-format', title: 'Report file format', collection: 'Live projects', owner: 'Program manager', nextReview: day(28), sourceLabel: 'Live Project Guidelines',
        body: 'Upload your report as a PowerPoint (.pptx) or Word (.docx) file. The LMS does not accept other formats.',
        keywords: ['format', 'pdf', 'pptx', 'docx', 'word', 'powerpoint', 'ppt', 'file', 'type'] },
      { id: 'k-cert', title: 'Certificates and timelines', collection: 'Certificates', owner: 'Operations', nextReview: day(10), sourceLabel: 'Certificates and timelines',
        body: 'During the pilot, certificates are issued within 72 hours of submission, once an evaluator approves the report. Every certificate has an ID that can be verified on the Skilled Sapiens website.',
        keywords: ['certificate', 'certificates', 'verify', 'issued', 'how long', 'days', 'id'] },
      { id: 'k-ext', title: 'Extensions', collection: 'Live projects', owner: 'Program manager', nextReview: day(-2), sourceLabel: 'Extensions',
        body: 'Deadline extensions need the program manager\'s approval. Ask Sapiens passes extension requests to a coordinator.',
        keywords: ['extension', 'extend', 'deadline', 'more time', 'late'] },
      { id: 'k-refund', title: 'Refunds', collection: 'Fees and refunds', owner: 'Founder', nextReview: day(34), sourceLabel: 'Refunds',
        body: 'Refund requests are decided by the operations team. Ask Sapiens always passes them to a person.',
        keywords: ['refund', 'money', 'back', 'cancel', 'cancellation'] },
      { id: 'k-mentor', title: 'Mentor allocation', collection: 'Mentors', owner: 'Mentor lead', nextReview: day(23), sourceLabel: 'Mentor allocation',
        body: 'A mentor is confirmed within 48 hours of payment. To ask for a different mentor, message a coordinator.',
        keywords: ['mentor', 'assigned', 'allocation', 'change', 'different', 'matched'] },
      { id: 'k-reviews', title: 'Weekly reviews and recaps', collection: 'Live projects', owner: 'Program manager', nextReview: day(40), sourceLabel: 'Weekly reviews and recaps',
        body: 'Each live project has a weekly review on Google Meet. A recap with action items is posted in the LMS within 2 hours of the session.',
        keywords: ['weekly', 'review', 'session', 'recording', 'recap', 'missed', 'meet', 'class'] },
      { id: 'k-doubt', title: 'Doubt sessions', collection: 'Live projects', owner: 'Program manager', nextReview: day(40), sourceLabel: 'Doubt sessions',
        body: 'You can book an on-demand one-to-one doubt session with a mentor from the LMS.',
        keywords: ['doubt', 'doubts', '1-1', 'one-to-one', 'book', 'stuck', 'help'] },
      { id: 'k-roles', title: 'Live-project roles', collection: 'Live projects', owner: 'Program manager', nextReview: day(50), sourceLabel: 'Live-project roles',
        body: 'Live projects run in 8 roles: ' + App.ROLES.join(', ') + '.',
        keywords: ['roles', 'role', 'domains', 'which', 'options', 'projects', 'available'] },
    ],

    // Approved public figures. null = not approved yet (the website currently shows conflicting numbers).
    facts: [
      { id: 'f1', label: 'Partner colleges', value: null },
      { id: 'f2', label: 'Mentors', value: null },
      { id: 'f3', label: 'Learners placed', value: null },
      { id: 'f4', label: 'Live-project learners', value: '4,000+' },
    ],

    // Questions Ask Sapiens could not answer, most asked first
    gaps: [
      { id: 'g1', question: 'Can I switch roles mid-project?', count: 14 },
      { id: 'g2', question: 'Is the LOR signed by my mentor?', count: 9 },
      { id: 'g3', question: 'Do you offer EMI?', count: 6 },
    ],

    chats: {}, // learnerId -> messages (Ananya's chat is created when she enrolls)

    handoffs: [
      { id: 'h1', learnerId: 'karan', question: 'I want a refund, the timings don\'t work for me anymore.', reason: 'Refund request', sensitive: true, createdAt: now - 12 * M, status: 'open',
        summary: 'Karan asks for a refund because the session timings no longer suit him. Policy: refunds are decided by operations (One Source: Refunds).',
        suggested: 'Hi Karan, thanks for telling us. I\'ve shared your refund request with our operations team; they will reply within one working day.' },
      { id: 'h2', learnerId: 'neha', question: 'Can we add a fifth member to our group?', reason: 'Unsure answer', sensitive: false, createdAt: now - 25 * M, status: 'open',
        summary: 'Neha asks whether her group can add a fifth member. No approved answer in One Source; added to the gap queue.',
        suggested: 'Hi Neha, good question. Let me check with the program team and get back to you within the hour.' },
    ],

    // Questions Ask Sapiens answered without a person today (seeded + live)
    aiResolved: [
      { q: 'What file format should the report be?', source: 'Report file format', at: now - 50 * M },
      { q: 'When is the next weekly review?', source: 'Learner record', at: now - 70 * M },
      { q: 'How do I book a doubt session?', source: 'Doubt sessions', at: now - 95 * M },
    ],
    aiResolvedBase: 38, // answered earlier today, not listed individually
    staffHandledBase: 46, // handled by people earlier today

    reports: [
      { id: 'r-neha', learnerId: 'neha', program: 'HR Manager', project: 'Project 1', group: 4, copies: 4, file: 'HR_Project1_GroupB.docx', pages: 26, submittedAt: now - 60 * H, status: 'in_review',
        rubric: rubric('HR Manager', [7, 8, 7, 6, 7], ['p. 3', 'p. 6', 'p. 12', 'p. 18', 'p. 22']), feedback: 'Solid diagnosis. The implementation plan needs owners, timing and a budget.', originality: 'No concerns' },
      { id: 'r-arjun', learnerId: 'arjunt', program: 'Growth & Strategy Consultant', project: 'Project 2', group: 1, copies: 1, file: 'Growth_Project2_ArjunT.pptx', pages: 24, submittedAt: now - 17 * H, status: 'in_review',
        rubric: rubric('Growth & Strategy Consultant', [8, 7, 8, 6, 8], ['slide 4', 'slide 7', 'slide 11', 'slide 16', 'slide 22']), feedback: 'Clear growth levers. Show how the financials were built and test one key assumption.', originality: 'No concerns' },
      { id: 'r-meera', learnerId: 'meerad', program: 'Digital Marketing Specialist', project: 'Project 1', group: 1, copies: 1, file: 'DigitalMarketing_P1_MeeraD.pptx', pages: 30, submittedAt: now - 12 * H, status: 'in_review',
        rubric: rubric('Digital Marketing Specialist', [8, 8, 7, 7, 6], ['slide 3', 'slide 6', 'slide 10', 'slide 17', 'slide 25']), feedback: 'Strong audit and audience work. Tie each KPI to a channel and a target.', originality: 'Similar wording to a public blog in 2 places (signal only)' },
    ],

    // The AI draft Ananya's report will get when she submits it (Product & Brand Manager, Project 1)
    ananyaDraft: {
      scores: [8, 8, 9, 8, 6, 8, 8],
      evidence: ['slide 4', 'slide 7', 'slide 9', 'slide 12', 'slide 15', 'slide 18', 'slide 21'],
      feedback: 'Clear prioritization logic and well-argued product picks. Extend the 6–12 month plan with owners and dates.',
      notes: { 'D3 Prioritization': 'Clear scoring logic', 'D5 Roadmap': 'Extend the 6–12 month plan with owners and dates' },
    },

    // Weekly review recaps for Ananya's cohort. Week 3 is an AI draft waiting for the program manager.
    recaps: [
      { id: 'w1', cohort: 'Product & Brand Manager · Oct 2026', week: 1, title: 'Week 1 review: kick-off and problem framing', date: day(-14), mins: 50, mentor: 'Mentor A', status: 'published',
        summary: ['Start from the business problem, not the tool', 'Map the learner journey before listing ideas', 'Week 2: bring three problem statements'],
        actions: ['Write three problem statements', 'Interview one past learner'], moments: [['04:10', 'Project brief'], ['18:30', 'Journey mapping'], ['41:00', 'Questions and answers']] },
      { id: 'w2', cohort: 'Product & Brand Manager · Oct 2026', week: 2, title: 'Week 2 review: market research', date: day(-7), mins: 45, mentor: 'Mentor A', status: 'published',
        summary: ['Compare tools on the same seven attributes', 'Price in INR where possible', 'Week 3: shortlist use cases'],
        actions: ['Fill the tool comparison table', 'Shortlist five use cases'], moments: [['06:20', 'Comparison template'], ['24:15', 'Pricing pitfalls'], ['38:50', 'Questions and answers']] },
      { id: 'w3', cohort: 'Product & Brand Manager · Oct 2026', week: 3, title: 'Week 3 review: PRD structure and guesstimates', date: day(-1), mins: 45, mentor: 'Mentor A', status: 'draft',
        summary: ['A PRD starts with the problem, the users and one success metric', 'Size markets top-down, then check bottom-up', 'Week 4: bring a one-page PRD draft'],
        actions: ['Draft a one-page PRD', 'Redo the guesstimate two ways', 'Book a doubt slot if stuck'], moments: [['08:15', 'PRD template'], ['22:40', 'Guesstimate walk-through'], ['39:05', 'Questions and answers']] },
    ],

    // Earlier this week, used by the leadership dashboard (live actions are added on top)
    history: {
      replies: { kept: 44, total: 46 },
      mentors: { kept: 10, total: 13 },
      certs: { kept: 19, total: 21 },
      agreement: { agree: 52, total: 60 },
      certHours: [48, 54, 61, 50, 66, 58, 70],
      firstReplyMin: 3,
      wrongAnswers: 2,
      ratings: [5, 4, 5, 4, 4, 5, 4, 5, 4, 4, 5, 4],
      minutesSaved: 2310, // ≈ 38.5 hours earlier this week
    },
    minutesSaved: 0, // added by live actions

    log: [],
  };
};
