# PRD: Skilled Sapiens AI Operations, Demo and Pilot

*Automate the glue, protect the mentor.* This is the text version; the full version with wireframes is [`PRD.pdf`](PRD.pdf).

| | |
|---|---|
| **Prepared for** | The Skilled Sapiens leadership team |
| **Prepared by** | Subhranil Hazra, IIM Lucknow · Live Project 1, Certified Product Manager (Product & Brand Management) |
| **Version** | v1 for review · 28 October 2026 |
| **Based on** | The Live Project 1 report, *AI Product Strategy for Operational Optimization at Skilled Sapiens* |
| **Companion** | A clickable demo website: eight personas sharing one learner record, sample data only |

## 1. Summary

**Problem.** Skilled Sapiens sells mentor time at low prices. Around every mentor hour sits manual work spread across about nine tools. Public promises are kept by people remembering to keep them: 24×7 mentor access, a mentor within 7 days, and a certificate 3–4 days after evaluation. The root cause: **nobody owns the learner's record.**

**Solution.** First build one learner record (a CRM) and one knowledge base (One Source). Then add six AI-assisted products: Ask Sapiens, Review Desk, One Funnel, Mentor Match, One Source and Session recaps. AI drafts; people decide.

## 2. Goals and non-goals

- **Demo goals:**
  - Show the pilot journey across 8 personas in under 10 minutes.
  - Let the team try every screen.
  - Settle open questions before any tool set-up.
- **Pilot goals (Day 30, one Product & Brand Manager cohort):**
  - ≥ 40% of questions resolved without a person.
  - ≥ 85% agreement between AI draft grades and evaluator grades.
  - ≤ 72 h from submission to certificate.
  - CSAT ≥ 4.3.
- **Non-goals:**
  - No real learner data in the demo.
  - AI never gives final grades, confirms mentors, or decides refunds or extensions.
  - No custom model training.

## 3. Personas

| Persona | Job to be done | Screens |
|---|---|---|
| Ananya, prospect | Find the right program without waiting | L1 WhatsApp qualifier |
| Ananya, learner | Know where I stand; quick answers; certificate on time | L2 Home, L3 Recaps, L4 Ask Sapiens, L5 Project |
| Counselor | Call every good lead within 15 minutes | S1 Lead pipeline |
| Program manager | Mentor within 48 hours; publish recaps | S2 Mentor Match |
| Coordinator | Handle only what AI can't | S3 Support inbox |
| Evaluator | Grade fairly in less time | S4 Review Desk |
| Knowledge owner | One correct answer, everywhere | S5 One Source |
| Founder | Are promises kept, and at what cost? | M1 Dashboard |

## 4. Scope

| Product | Screens | Pilot |
|---|---|---|
| One Funnel | L1, S1 | Live from month 1 |
| Mentor Match | S2 | Month 4 |
| Ask Sapiens | L4, S3 | Live (process questions) |
| Session recaps | L3, S2 | Live |
| Review Desk | S4, L5 | Shadow mode first |
| One Source | S5 | Live (prerequisite) |
| Dashboard | M1 | Weekly view |

## 5. User stories and acceptance criteria

1. **Prospect:** consent first; three tap-to-answer questions create a CRM lead with a fit tier.
2. **Counselor:** every source on one board; uncontacted leads turn red after 15 minutes.
3. **Counselor:** enrolling creates the learner record and queues the learner for a mentor.
4. **Program manager:** the queue is sorted by wait; a brief and the top 3 mentors with reasons; nothing happens until confirmed.
5. **Learner:** home shows progress, next session, promises and the latest recap.
6. **Learner:** record questions are answered from the record; others only from in-date One Source pages, naming the source.
7. **Learner:** refunds, extensions, complaints and unknown questions go to a person, with a summary and a suggested reply.
8. **Coordinator:** edit and send the suggested reply; the learner sees it in the same chat.
9. **Learner:** .pptx or .docx only; each member uploads from their own account; group copies are matched.
10. **Evaluator:** AI rubric scores with evidence; any score and the feedback can be edited; approval issues the certificate.
11. **Knowledge owner:** overdue pages are hidden from the assistant; answering a gap makes it available at once.
12. **Founder:** promises kept, hours saved, live queues and the scorecard with its decision rule.

## 6. Rules the product must follow

- **Disclose AI**, and let learners reach a person at any time.
- **Answer from sources only:** the learner record, or in-date One Source pages.
- **People decide** grades, matches, refunds, extensions and complaints.
- **Never guess:** hand off and log the gap.
- **Get consent** before WhatsApp questions and before recording sessions (DPDP).
- **No Pulse data used to sell.**
- **One approved set of public figures.**

## 7. What the demo simulates, and what the pilot uses

| Demo (sample data) | Pilot (starter stack, ≈ ₹26,800 a month) |
|---|---|
| Ask Sapiens on a sample knowledge base | AiSensy WhatsApp AI Agent and an LMS widget, grounded on One Source |
| Sample One Source pages | Notion Business knowledge base |
| Sample lead board | Zoho CRM, with Razorpay and forms linked through Zapier |
| Rubric drafts prepared in advance | An LLM (Claude API) with the project rubric |
| Certificate card | Certifier |
| Recap drafts | Google Meet notes or Fireflies |
| Dashboard | Looker Studio on CRM exports |

## 8. Metrics

- **North star:** promises kept on time (reply ≤ 1 h, mentor ≤ 48 h, certificate ≤ 72 h); ≥ 90% by month 6.
- **Counter-metric:** staff hours per learner; −30% by month 12.
- **Day-30 scorecard:**

| Metric | On plan |
|---|---|
| Resolved without a person | ≥ 40% |
| Wrong answers per 50 | ≤ 1 |
| Median first reply | < 5 min |
| AI–evaluator agreement | ≥ 85% |
| Submission to certificate | ≤ 72 h |
| CSAT | ≥ 4.3 |

**Decision rule:** all on plan → scale to all 8 roles; any in Act → fix within 2 weeks; 3 or more in Act → stop.

## 9. Delivery plan

| When | What happens |
|---|---|
| Week 0 | Demo walk-through; feedback captured |
| Week 1 | Six baseline numbers; real policies and the approved facts sheet |
| Week 2 | AiSensy, Zoho CRM, Zapier and Notion set up; One Source drafted |
| Week 3 | Rubric written and tested on 20 past reports |
| Week 4 | Pilot cohort starts |
| Day 30 | Scorecard review: scale, correct or stop |

The pilot costs about ₹3,200 of new tools for the month.

## 10. Decisions requested from Skilled Sapiens

1. Approve the one-cohort pilot and its Day-30 decision rule.
2. Share the six baseline numbers.
3. Confirm refund, extension, LOR and EMI policies, and approve one set of public figures.
4. Name a pilot coordinator, an evaluation lead and a One Source owner.
5. Try the demo and send feedback.
