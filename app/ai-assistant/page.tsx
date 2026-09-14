"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import {
  calculateSkillGap,
  UserSkill,
} from "../../lib/skillGap";

type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[] | null;
  description: string | null;
  location: string | null;
};

type Application = {
  id: string;
  status: string;
  job_id: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const suggestedQuestions = [
  "What is the best career for me?",
  "What skills should I learn next?",
  "How can I improve my job chances?",
  "Which jobs match my skills?",
];

export default function AIAssistantPage() {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    loadContext();
  }, []);

  async function loadContext() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);

      setMessages([
        {
          role: "assistant",
          text: "Please login first so I can analyze your career profile.",
        },
      ]);

      return;
    }

    const [profileResult, jobsResult, applicationsResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("skills")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("jobs")
          .select(
            "id, title, company, required_skills, description, location"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("applications")
          .select("id, status, job_id")
          .eq("user_id", user.id),
      ]);

    const rawSkills = profileResult.data?.skills;

    let normalizedSkills: UserSkill[] = [];

    if (Array.isArray(rawSkills)) {
      normalizedSkills = rawSkills
        .map((skill) => {
          if (typeof skill === "string") {
            return {
              name: skill,
              level: 70,
            };
          }

          if (
            skill &&
            typeof skill === "object" &&
            "name" in skill
          ) {
            return {
              name: String(skill.name),
              level:
                "level" in skill
                  ? Number(skill.level) || 0
                  : 70,
            };
          }

          return null;
        })
        .filter(Boolean) as UserSkill[];
    }

    setSkills(normalizedSkills);
    setJobs((jobsResult.data || []) as Job[]);
    setApplications(
      (applicationsResult.data || []) as Application[]
    );

    setMessages([
      {
        role: "assistant",
        text:
          normalizedSkills.length > 0
            ? `Hi! I'm your SkillTrack Career Assistant. I can see ${normalizedSkills.length} skills in your profile and ${jobsResult.data?.length || 0} job opportunities. Ask me anything about your career, skills, jobs, resume or interview preparation.`
            : "Hi! I'm your SkillTrack Career Assistant. Add some skills to your profile and I'll give you more personalized career guidance.",
      },
    ]);

    setLoading(false);
  }

  const analysis = useMemo(() => {
    if (!skills.length || !jobs.length) {
      return {
        bestCareer: "Explore Your Career",
        match: 0,
        matched: [] as string[],
        improving: [] as string[],
        missing: [] as string[],
        relatedJobs: [] as Job[],
      };
    }

    const analyzed = jobs.map((job) => {
      const result = calculateSkillGap(
        skills,
        job.required_skills || []
      );

      return {
        job,
        result,
      };
    });

    analyzed.sort(
      (a, b) =>
        b.result.matchPercentage -
        a.result.matchPercentage
    );

    const best = analyzed[0];

    const title = best?.job.title || "";

    let bestCareer = title;

    if (
      /frontend|front-end|web developer|ui developer/i.test(
        title
      )
    ) {
      bestCareer = "Frontend Development";
    } else if (
      /backend|back-end|server|node/i.test(title)
    ) {
      bestCareer = "Backend Development";
    } else if (
      /full stack|full-stack/i.test(title)
    ) {
      bestCareer = "Full Stack Development";
    } else if (
      /data analyst|business intelligence|bi developer/i.test(
        title
      )
    ) {
      bestCareer = "Data Analytics";
    } else if (
      /data scientist|machine learning|ml engineer|ai engineer/i.test(
        title
      )
    ) {
      bestCareer = "AI & Machine Learning";
    } else if (
      /cloud|devops|sre/i.test(title)
    ) {
      bestCareer = "Cloud & DevOps";
    } else if (
      /cyber|security|ethical hacker|penetration/i.test(
        title
      )
    ) {
      bestCareer = "Cybersecurity";
    } else if (
      /ui\/ux|designer|product designer/i.test(title)
    ) {
      bestCareer = "UI/UX & Product Design";
    }

    return {
      bestCareer,
      match: best.result.matchPercentage,
      matched: best.result.matchedSkills,
      improving: best.result.improvingSkills,
      missing: best.result.missingSkills,
      relatedJobs: analyzed
        .filter(
          (item) =>
            item.result.matchPercentage >=
            Math.max(30, best.result.matchPercentage - 15)
        )
        .slice(0, 6)
        .map((item) => item.job),
    };
  }, [skills, jobs]);

  function getMarketSkills() {
    const frequency = new Map<string, number>();

    jobs.forEach((job) => {
      (job.required_skills || []).forEach((skill) => {
        const key = skill.trim();

        if (!key) {
          return;
        }

        frequency.set(
          key,
          (frequency.get(key) || 0) + 1
        );
      });
    });

    const userSkillNames = new Set(
      skills.map((skill) =>
        skill.name.toLowerCase()
      )
    );

    return Array.from(frequency.entries())
      .filter(
        ([skill]) =>
          !userSkillNames.has(skill.toLowerCase())
      )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }

  function generateAnswer(question: string) {
    const q = question.toLowerCase().trim();

    if (!q) {
      return "Ask me something about your career, skills, jobs, resume or interview preparation.";
    }

    if (!skills.length) {
      return "Your profile does not have enough skills yet. Go to Profile, add your current skills with proficiency levels, and then come back here. I'll use those skills to create personalized career guidance.";
    }

    if (
      q.includes("best career") ||
      q.includes("career for me") ||
      q.includes("which career") ||
      q.includes("career path")
    ) {
      return `Based on your current profile, your strongest career direction is **${analysis.bestCareer}** with an estimated **${analysis.match}% match**.

Your strongest matched skills are ${
        analysis.matched.length
          ? analysis.matched.join(", ")
          : "still developing"
      }.

To become more job-ready, focus next on ${
        analysis.missing.length
          ? analysis.missing.slice(0, 4).join(", ")
          : analysis.improving.length
            ? analysis.improving
                .slice(0, 4)
                .join(", ")
            : "advanced project work"
      }.

I recommend checking Career Recommendations and then using Career Coach to build your roadmap.`;
    }

    if (
      q.includes("learn next") ||
      q.includes("next skill") ||
      q.includes("skills should") ||
      q.includes("what should i learn")
    ) {
      const marketSkills = getMarketSkills();

      const suggestions =
        analysis.missing.length > 0
          ? analysis.missing.slice(0, 5)
          : marketSkills.map(
              ([skill]) => skill
            );

      return `Your next learning priority should be:

1. **${suggestions[0] || "Build a strong project"}**
2. **${suggestions[1] || "Git & GitHub"}**
3. **${suggestions[2] || "TypeScript"}**
4. **${suggestions[3] || "SQL"}**

These recommendations are based on the skills required by jobs in your SkillTrack database.

Don't try to learn everything at once. Pick one high-impact skill, build a project with it, then move to the next.`;
    }

    if (
      q.includes("job") ||
      q.includes("opportunit") ||
      q.includes("match")
    ) {
      const topJobs = analysis.relatedJobs
        .slice(0, 5)
        .map(
          (job, index) =>
            `${index + 1}. **${job.title}** â€” ${job.company}`
        )
        .join("\n");

      return `I found **${analysis.relatedJobs.length} strong opportunities** based on your current skill profile.

Top matches:

${topJobs || "No strong job matches found yet."}

Your current strongest match is approximately **${analysis.match}%**.

Improve your missing skills and your matching percentage should increase.`;
    }

    if (
      q.includes("improve") ||
      q.includes("job chances") ||
      q.includes("get hired") ||
      q.includes("employment")
    ) {
      return `To improve your chances of getting hired, follow this order:

**1. Strengthen your profile**
Add accurate proficiency levels for every skill.

**2. Close high-priority skill gaps**
Focus on the skills repeatedly requested by your target jobs.

**3. Build proof**
Create 2â€“3 projects that demonstrate those skills.

**4. Improve your resume**
Use Resume Analyzer to identify missing skills and ATS issues.

**5. Practice interviews**
Use Interview Coach with your target career.

**6. Apply strategically**
Target jobs where your current match is already strong instead of applying randomly.`;
    }

    if (
      q.includes("resume") ||
      q.includes("cv")
    ) {
      return `For your resume, focus on showing evidence rather than only listing skills.

Your current target direction is **${analysis.bestCareer}**.

Your resume should clearly include:
- Your strongest technical skills
- 2â€“3 relevant projects
- Technologies used in each project
- Measurable project outcomes
- GitHub or portfolio links
- Education and certifications

Use **Resume Analyzer** in the AI Career menu to check your ATS readiness.`;
    }

    if (
      q.includes("interview") ||
      q.includes("prepare")
    ) {
      return `For interview preparation, I recommend this sequence:

**Step 1:** Choose your target career â€” ${analysis.bestCareer}

**Step 2:** Revise your strongest skills:
${analysis.matched.length ? analysis.matched.slice(0, 5).join(", ") : "Your current skills"}

**Step 3:** Study your skill gaps:
${analysis.missing.length ? analysis.missing.slice(0, 5).join(", ") : "No major gaps identified"}

**Step 4:** Practice role-specific questions using Interview Coach.

**Step 5:** Prepare 2 project explanations using the STAR structure.`;
    }

    if (
      q.includes("application") ||
      q.includes("applied")
    ) {
      return `You currently have **${applications.length} opportunities** in your employment tracker.

Current pipeline:

- Wishlist: ${
        applications.filter(
          (a) => a.status === "Wishlist"
        ).length
      }
- Applied: ${
        applications.filter(
          (a) => a.status === "Applied"
        ).length
      }
- Interview: ${
        applications.filter(
          (a) => a.status === "Interview"
        ).length
      }
- Offer: ${
        applications.filter(
          (a) => a.status === "Offer"
        ).length
      }

Keep your strongest opportunities moving from Applied â†’ Interview â†’ Offer.`;
    }

    return `Based on your current profile, I can help you with:

**Career**
Find your best career direction and roadmap.

**Skills**
Identify what to learn next and close skill gaps.

**Jobs**
Find opportunities that match your current skills.

**Resume**
Improve your resume and ATS readiness.

**Interview**
Prepare for role-specific interviews.

Try asking: **"What skills should I learn next?"**`;
  }

  async function sendMessage(
    event?: FormEvent<HTMLFormElement>,
    question?: string
  ) {
    event?.preventDefault();

    const text = (question ?? input).trim();

    if (!text || thinking) {
      return;
    }

    setInput("");

    setMessages((current) => [
      ...current,
      {
        role: "user",
        text,
      },
    ]);

    setThinking(true);

    try {
      const context = `
PROFILE SKILLS:
${skills.length
  ? skills
      .map((skill) => `${skill.name} (${skill.level}% proficiency)`)
      .join(", ")
  : "No skills added yet."}

CURRENT CAREER DIRECTION:
${analysis.bestCareer}

CURRENT PROFILE MATCH:
${analysis.match}%

MATCHED SKILLS:
${analysis.matched.length
  ? analysis.matched.join(", ")
  : "None"}

SKILLS TO IMPROVE:
${analysis.improving.length
  ? analysis.improving.join(", ")
  : "None"}

MISSING SKILLS:
${analysis.missing.length
  ? analysis.missing.join(", ")
  : "None"}

JOBS ANALYZED:
${jobs.length}

TOP RELATED JOBS:
${analysis.relatedJobs.length
  ? analysis.relatedJobs
      .slice(0, 8)
      .map(
        (job) =>
          `${job.title} at ${job.company} - ${job.location || "Location not specified"}`
      )
      .join("\n")
  : "No related jobs found."}

APPLICATIONS:
Total: ${applications.length}
Wishlist: ${
        applications.filter((a) => a.status === "Wishlist").length
      }
Applied: ${
        applications.filter((a) => a.status === "Applied").length
      }
Interview: ${
        applications.filter((a) => a.status === "Interview").length
      }
Offer: ${
        applications.filter((a) => a.status === "Offer").length
      }
`;

      const response = await fetch("/api/ai-career", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: text,
          context,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "AI service could not process the request."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            data?.answer ||
            "I could not generate an answer right now. Please try again.",
        },
      ]);
    } catch (error) {
      console.error("AI Assistant Error:", error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            "I'm having trouble connecting to the AI service right now. Please check your API configuration and try again.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function renderMessage(text: string) {
    const parts = text.split("\n");

    return (
      <div className="space-y-2">
        {parts.map((part, index) => {
          const html = part.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
          );

          return (
            <p
              key={index}
              dangerouslySetInnerHTML={{
                __html: html,
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#06101d] text-white">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Skill
            <span className="text-cyan-400">
              Track
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-slate-300 lg:flex">

            <Link
              href="/"
              className="transition hover:text-cyan-400"
            >
              Dashboard
            </Link>

            <Link
              href="/jobs"
              className="transition hover:text-cyan-400"
            >
              Jobs
            </Link>

            <div className="group relative">

              <button
                type="button"
                className="flex items-center gap-2 py-3 text-cyan-400"
              >
                AI Career
                <span className="text-[10px] transition-transform duration-200 group-hover:rotate-180">
                  ▼
                </span>
              </button>

              <div className="pointer-events-none absolute left-1/2 top-full z-[100] w-80 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/10 bg-[#0b1728] p-2 opacity-0 shadow-2xl shadow-cyan-500/10 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">

                <Link
                  href="/ai-assistant"
                  className="block rounded-xl bg-cyan-400/10 px-4 py-3"
                >
                  <div className="font-semibold text-cyan-300">
                    AI Career Assistant
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Ask personalized career questions
                  </div>
                </Link>

                <Link
                  href="/recommendations"
                  className="block rounded-xl px-4 py-3 transition hover:bg-cyan-400/10"
                >
                  <div className="font-semibold text-white">
                    Career Recommendations
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Discover your best career paths
                  </div>
                </Link>

                <Link
                  href="/skill-gap"
                  className="block rounded-xl px-4 py-3 transition hover:bg-cyan-400/10"
                >
                  <div className="font-semibold text-white">
                    Skill Gap Analysis
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Find missing and improving skills
                  </div>
                </Link>

                <Link
                  href="/career-coach"
                  className="block rounded-xl px-4 py-3 transition hover:bg-cyan-400/10"
                >
                  <div className="font-semibold text-white">
                    Career Coach
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Build your personalized roadmap
                  </div>
                </Link>

                <Link
                  href="/resume-analyzer"
                  className="block rounded-xl px-4 py-3 transition hover:bg-cyan-400/10"
                >
                  <div className="font-semibold text-white">
                    Resume Analyzer
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Check resume and ATS readiness
                  </div>
                </Link>

                <Link
                  href="/interview-coach"
                  className="block rounded-xl px-4 py-3 transition hover:bg-cyan-400/10"
                >
                  <div className="font-semibold text-white">
                    Interview Coach
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Practice role-based interviews
                  </div>
                </Link>

              </div>

            </div>

            <Link
              href="/applications"
              className="transition hover:text-cyan-400"
            >
              Applications
            </Link>

            <Link
              href="/profile"
              className="transition hover:text-cyan-400"
            >
              Profile
            </Link>

          </nav>

          <Link
            href="/profile"
            className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300"
          >
            My Profile
          </Link>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* HERO */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0b2030] via-[#0a1728] to-[#10142b] p-8 shadow-2xl shadow-cyan-500/5">

          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">

            <div>

              <div className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                AI Career Assistant
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Your personal
                <span className="block text-cyan-400">
                  career intelligence.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                Ask questions about careers, skills, jobs, resumes
                and interviews. SkillTrack analyzes your profile and
                job market data to guide your next move.
              </p>

            </div>

            <div className="rounded-3xl border border-white/10 bg-black/10 p-6">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Current Direction
              </p>

              <h2 className="mt-3 text-2xl font-black">
                {loading
                  ? "Analyzing..."
                  : analysis.bestCareer}
              </h2>

              <div className="mt-5 flex items-end justify-between">
                <span className="text-sm text-slate-500">
                  Profile match
                </span>

                <span className="text-3xl font-black text-cyan-400">
                  {loading
                    ? "--"
                    : `${analysis.match}%`}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                  style={{
                    width: `${analysis.match}%`,
                  }}
                />
              </div>

            </div>

          </div>

        </section>

        {/* MAIN */}
        <section className="grid gap-6 lg:grid-cols-[1fr_330px]">

          {/* CHAT */}
          <div className="flex min-h-[650px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#091524]">

            <div className="border-b border-white/10 px-6 py-5">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-xl font-black">
                    SkillTrack AI
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Personalized career guidance
                  </p>
                </div>

                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {loading
                    ? "Loading"
                    : "Profile Connected"}
                </div>

              </div>

            </div>

            {/* MESSAGES */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">

              {messages.map((message, index) => (

                <div
                  key={index}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-cyan-400 font-medium text-slate-950"
                        : "border border-white/10 bg-[#0e1e31] text-slate-300"
                    }`}
                  >
                    {renderMessage(message.text)}
                  </div>

                </div>

              ))}

              {thinking && (
                <div className="flex justify-start">

                  <div className="rounded-2xl border border-white/10 bg-[#0e1e31] px-5 py-4 text-sm text-slate-500">
                    SkillTrack AI is analyzing your profile...
                  </div>

                </div>
              )}

            </div>

            {/* SUGGESTIONS */}
            <div className="border-t border-white/10 px-6 py-4">

              <div className="mb-3 flex flex-wrap gap-2">

                {suggestedQuestions.map(
                  (question) => (
                    <button
                      key={question}
                      onClick={() =>
                        sendMessage(
                          undefined,
                          question
                        )
                      }
                      disabled={thinking}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300 disabled:opacity-40"
                    >
                      {question}
                    </button>
                  )
                )}

              </div>

              <form
                onSubmit={sendMessage}
                className="flex gap-3"
              >

                <input
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  placeholder="Ask anything about your career..."
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#07111f] px-5 py-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40"
                />

                <button
                  type="submit"
                  disabled={
                    thinking || !input.trim()
                  }
                  className="rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Ask
                </button>

              </form>

            </div>

          </div>

          {/* INSIGHTS */}
          <aside className="space-y-5">

            <div className="rounded-3xl border border-white/10 bg-[#091524] p-6">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                Your Context
              </p>

              <div className="mt-5 space-y-4">

                <div>
                  <p className="text-xs text-slate-600">
                    Profile Skills
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {skills.length}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600">
                    Jobs Analyzed
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {jobs.length}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600">
                    Applications
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {applications.length}
                  </p>
                </div>

              </div>

            </div>

            <div className="rounded-3xl border border-white/10 bg-[#091524] p-6">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                Recommended Skills
              </p>

              <div className="mt-5 space-y-2">

                {(
                  analysis.missing.length
                    ? analysis.missing
                    : getMarketSkills().map(
                        ([skill]) => skill
                      )
                )
                  .slice(0, 6)
                  .map((skill) => (

                    <div
                      key={skill}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                    >

                      <span className="text-sm text-slate-300">
                        {skill}
                      </span>

                      <span className="text-xs text-cyan-400">
                        Learn
                      </span>

                    </div>

                  ))}

              </div>

            </div>

            <Link
              href="/career-coach"
              className="block rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 transition hover:bg-cyan-400/15"
            >

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                Next Step
              </p>

              <h3 className="mt-2 text-lg font-black">
                Build your career roadmap
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Continue with Career Coach and turn your skill
                gaps into a structured learning plan.
              </p>

              <div className="mt-4 text-sm font-bold text-cyan-300">
                Open Career Coach â†’
              </div>

            </Link>

          </aside>

        </section>

      </div>

    </main>
  );
}

