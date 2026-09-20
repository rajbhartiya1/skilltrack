# SkillTrack - 6-Slide Presentation Script

Use this formal English narration as-is during the presentation.

## Presentation opening

Good morning everyone. We are presenting **SkillTrack**, a student-first platform for tracking skills, closing skill gaps and connecting skilling activity with real employment outcomes.

Our central idea is simple: a learner should not only know what they have learned; they should know what to do next, why that action matters, and whether it improved their employment journey.

---

## Slide 1 - The problem: the broken career pipeline

**Say:**

Students are learning through courses, projects and certificates, but the path from learning to employment is still fragmented. The first problem is visibility: a learner may have many certificates but may not know which skills employers actually value. The second problem is noisy job information: job descriptions use different terms, so a candidate cannot easily understand whether they are ready or what is missing. The third problem is that progress is not measured. Applications, interviews and feedback often remain in separate places, so learners repeat the same mistakes.

The important point is that the gap is not only a skill gap; it is also a signal gap. Learners need a clear connection between their current evidence, market requirements and the next practical step.

**Transition:**

This is the gap SkillTrack is designed to close.

---

## Slide 2 - The solution: one connected career loop

**Say:**

SkillTrack brings four signals into one journey: the learner profile, target job requirements, skill-gap analysis and employment outcomes.

First, the learner creates a profile using skills, projects, interests and preferences. Next, the platform compares that evidence with the requirements of a target role. It then identifies matched skills, missing skills and skills that are already improving. Finally, applications and outcomes are tracked so the next recommendation becomes more useful.

This creates a closed loop: profile, diagnose, act, apply and learn. Instead of giving a learner another list of courses or jobs, SkillTrack turns data into a ranked next action.

**Transition:**

The value of the platform comes from how this loop works in practice.

---

## Slide 3 - How it works: from profile to placement

**Say:**

The user journey has four steps.

Step one is Capture: we collect skills, projects, resume evidence, target roles and preferences. Step two is Diagnose: we compare the learner's current profile with a chosen role and calculate readiness. Step three is Act: we recommend the highest-value gap to improve, such as building an analytics case study or practicing experiment design. Step four is Learn: application movement, interview feedback and offer outcomes are recorded and used to recalibrate future recommendations.

This is important because the platform is organized around the next best action, not around a dashboard full of disconnected numbers. Each recommendation should answer three questions: what is missing, why does it matter, and what can I do next?

**Transition:**

Now let us look at the product experience a learner actually sees.

---

## Slide 4 - Product view: a dashboard built for decisions

**Say:**

This dashboard is designed for quick decisions. At the top, the learner sees a readiness score, the number of mapped target roles and applications currently in motion. These numbers are not meant to be decorative; each one answers a direct question.

The skill-cluster view shows where the learner is strong and where improvement will create the most opportunity. The recommendation panel then converts that insight into a concrete action. For example, the system may recommend building one analytics case study because it closes the largest gap across three target roles.

The learner can move from overview to recommendations, skill gap details, job matches and applications without losing context. This reduces tab switching and makes the career journey easier to understand.

**Transition:**

The most important intelligence appears when the system explains why a gap has priority.

---

## Slide 5 - Core technology: turning a gap into a focused plan

**Say slowly and clearly:**

Slide five explains the intelligence layer, which is the core of our solution.

The target role in this example is Product Analyst. The platform maps eight relevant skills and produces a readiness score of 72 percent. This score is not a random AI opinion. It is calculated by comparing the learner's evidence against the required skill set for the selected role. In a production version, we would also show the evidence and confidence behind every score.

The priority gap map separates skills by impact and current status. SQL and analytics are marked as high impact because they are both important for the target role and currently weak in the learner profile. Experiment design is a medium-priority gap, while stakeholder storytelling is already on track and product sense is strong.

The key design decision is prioritization. The learner does not receive ten generic learning links. The system selects the smallest set of actions that can improve readiness for multiple target roles. For example, one analytics case study can demonstrate data handling, problem framing, experimentation and communication at the same time.

The action plan should be measurable. It can contain a task, a completion condition, evidence to upload, a deadline and a reassessment step. After completion, the readiness score is recalculated. This gives the learner a visible before-and-after result.

**Possible question - How is the score calculated?**

We normalize the learner's evidence and job requirements into comparable skill categories. Each skill receives a current level and an importance weight for the selected role. The readiness score is the weighted coverage of required skills, while matched, improving and missing skills are kept visible so the number remains explainable.

**Possible question - Why use AI?**

AI helps parse resumes, projects and job descriptions into structured skills and recommendations. It does not get unrestricted control over the product. Outputs are schema-validated, checked against known fields and combined with deterministic scoring rules.

**Transition:**

A plan becomes meaningful only when we can see whether it changes employment outcomes.

---

## Slide 6 - Impact tracking and rollout

**Say slowly and clearly:**

Slide six closes the loop between skilling and employment. The application pipeline records movement from Wishlist to Applied, Interview and Offer. Every status change becomes a learning signal.

For the learner, this makes progress visible. They can see which applications are active, where an interview is pending and which skills were connected to a result. For institutions, the same data can show where learners are getting stuck. If many learners reach applications but not interviews, the intervention may need better resumes, projects or role matching. If learners reach interviews but not offers, interview preparation or employer feedback may be the priority.

The proposed impact measures are relevant applications, time spent searching, feedback-loop speed and placement movement. These should be treated as pilot hypotheses, not guaranteed results. We will establish a baseline, run a controlled campus pilot and compare outcomes before making a scale claim.

Our rollout has five gates. First, validate the core journey. Second, secure user data through authentication, row-level access control, server-only keys and upload limits. Third, test scoring, schemas and failure paths. Fourth, pilot with a real learner cohort and monitor feedback. Fifth, scale through live job data, institutional dashboards and employer or mentor integrations.

The outcome we want is not more activity; it is more relevant movement. SkillTrack should help a learner make one evidence-based next move and help institutions measure whether their skilling initiatives are working.

## Closing

To conclude, SkillTrack connects skills, opportunities and outcomes in one visible loop. It turns a vague question - what should I learn? - into a measurable decision - what should I do next, and did it help?

Our request is to test this prototype with real learners, validate the scoring and outcome signals, and improve the system with evidence. Thank you. Jai Hind.

---

## Quick delivery notes

- Total speaking time: approximately 6 to 8 minutes.
- Spend about 45 seconds on slides 1 to 4.
- Spend 90 seconds on slide 5 and 90 seconds on slide 6.
- On slides 5 and 6, point to the score, priority labels, pipeline stages and release gates while speaking.
- Do not present the impact percentages as already proven; call them pilot targets or hypotheses.
