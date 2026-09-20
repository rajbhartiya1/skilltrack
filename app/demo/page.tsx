"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  skills: string[];
  match: number;
};

const demoJobs: Job[] = [
  {
    id: 1,
    title: "Full Stack Developer",
    company: "SkillTrack Technologies",
    location: "India",
    skills: ["React", "Next.js", "Node.js", "TypeScript", "SQL"],
    match: 80,
  },
  {
    id: 2,
    title: "Frontend Developer",
    company: "Tech Solutions India",
    location: "Remote",
    skills: ["React", "JavaScript", "HTML", "CSS", "TypeScript"],
    match: 75,
  },
  {
    id: 3,
    title: "Data Analyst",
    company: "DataWorks",
    location: "India",
    skills: ["Python", "SQL", "Excel", "Power BI"],
    match: 68,
  },
  {
    id: 4,
    title: "AI Engineer",
    company: "AI Labs",
    location: "Bengaluru",
    skills: ["Python", "Machine Learning", "AI", "SQL"],
    match: 62,
  },
  {
    id: 5,
    title: "Backend Developer",
    company: "CloudTech",
    location: "Remote",
    skills: ["Node.js", "Python", "SQL", "APIs"],
    match: 60,
  },
];

const demoSkills = [
  { name: "JavaScript", level: 85 },
  { name: "React", level: 78 },
  { name: "Next.js", level: 72 },
  { name: "TypeScript", level: 65 },
  { name: "SQL", level: 60 },
  { name: "Node.js", level: 55 },
];

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "jobs" | "applications" | "skills"
  >("overview");

  const [applications, setApplications] = useState<number[]>([1]);

  const appliedJobs = useMemo(
    () => demoJobs.filter((job) => applications.includes(job.id)),
    [applications]
  );

  function applyJob(jobId: number) {
    if (!applications.includes(jobId)) {
      setApplications((current) => [...current, jobId]);
    }
  }

  return (
    <main className="min-h-screen bg-[#071426] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071426]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            href="/demo"
            className="text-2xl font-black tracking-tight"
          >
            Skill
            <span className="text-blue-500">Track</span>
            <span className="ml-2 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-bold text-blue-400">
              DEMO
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-400 sm:block">
              Public Demo Mode
            </span>

            <Link
              href="/login"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/5"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden min-h-[calc(100vh-73px)] w-64 border-r border-white/10 p-5 md:block">
          <div className="mb-6 rounded-2xl border border-blue-400/10 bg-blue-500/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Demo Account
            </p>

            <p className="mt-2 font-bold">Raj Bhartiya</p>

            <p className="mt-1 text-xs text-slate-500">
              Full Stack Developer
            </p>
          </div>

          <nav className="space-y-2">
            {[
              ["overview", "Overview"],
              ["jobs", "Matching Jobs"],
              ["applications", "Applications"],
              ["skills", "Skills Profile"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() =>
                  setActiveTab(
                    id as
                      | "overview"
                      | "jobs"
                      | "applications"
                      | "skills"
                  )
                }
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                  activeTab === id
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">
            <p className="text-xs font-bold text-emerald-400">
              LIVE DEMO
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              No login required. This demo uses sample career data.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-5 sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-400">
              SkillTrack Demo
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Welcome back, Raj 👋
            </h1>

            <p className="mt-2 text-slate-400">
              Explore how SkillTrack connects skills with employment
              opportunities.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#0D2038] p-5">
              <p className="text-xs font-bold text-slate-500">
                SKILL MATCH
              </p>
              <p className="mt-2 text-3xl font-black text-blue-400">
                80%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Average job match
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0D2038] p-5">
              <p className="text-xs font-bold text-slate-500">
                SKILLS
              </p>
              <p className="mt-2 text-3xl font-black">
                {demoSkills.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Skills tracked
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0D2038] p-5">
              <p className="text-xs font-bold text-slate-500">
                JOBS
              </p>
              <p className="mt-2 text-3xl font-black">
                83
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Opportunities
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0D2038] p-5">
              <p className="text-xs font-bold text-slate-500">
                APPLICATIONS
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-400">
                {applications.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Demo applications
              </p>
            </div>
          </div>

          <div className="mb-8 flex gap-2 overflow-x-auto md:hidden">
            {[
              ["overview", "Overview"],
              ["jobs", "Jobs"],
              ["applications", "Applications"],
              ["skills", "Skills"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() =>
                  setActiveTab(
                    id as
                      | "overview"
                      | "jobs"
                      | "applications"
                      | "skills"
                  )
                }
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${
                  activeTab === id
                    ? "bg-blue-600"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-[#0D2038] p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-bold text-blue-400">
                      CAREER INSIGHT
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Your strongest path is Full Stack Development
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      Your current skills show a strong match with
                      modern web development roles. Improving Node.js
                      and SQL can increase your job readiness.
                    </p>
                  </div>

                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-blue-500/30 bg-blue-500/10">
                    <span className="text-2xl font-black text-blue-400">
                      80%
                    </span>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black">
                    Recommended Jobs
                  </h2>

                  <button
                    onClick={() => setActiveTab("jobs")}
                    className="text-sm font-bold text-blue-400"
                  >
                    View all
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {demoJobs.slice(0, 2).map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      applied={applications.includes(job.id)}
                      onApply={applyJob}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "jobs" && (
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-black">
                  Matching Jobs
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Jobs matched against your current skills.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {demoJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    applied={applications.includes(job.id)}
                    onApply={applyJob}
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === "applications" && (
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-black">
                  Application Tracker
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Track your demo job applications.
                </p>
              </div>

              {appliedJobs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-[#0D2038] p-10 text-center">
                  <p className="font-bold">
                    No applications yet
                  </p>

                  <button
                    onClick={() => setActiveTab("jobs")}
                    className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold"
                  >
                    Explore Jobs
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {appliedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-white/10 bg-[#0D2038] p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="font-black">
                            {job.title}
                          </h3>

                          <p className="mt-1 text-sm text-slate-400">
                            {job.company} · {job.location}
                          </p>
                        </div>

                        <span className="w-fit rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
                          Applied
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "skills" && (
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-black">
                  Skills Profile
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Your current skill levels and improvement areas.
                </p>
              </div>

              <div className="grid gap-4">
                {demoSkills.map((skill) => (
                  <div
                    key={skill.name}
                    className="rounded-2xl border border-white/10 bg-[#0D2038] p-5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-bold">
                        {skill.name}
                      </span>

                      <span className="text-sm font-black text-blue-400">
                        {skill.level}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <footer className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-600">
            SkillTrack • Hackathon Demo • Sample data
          </footer>
        </section>
      </div>
    </main>
  );
}

function JobCard({
  job,
  applied,
  onApply,
}: {
  job: Job;
  applied: boolean;
  onApply: (jobId: number) => void;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0D2038] p-5 transition hover:border-blue-500/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black">
            {job.title}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {job.company} · {job.location}
          </p>
        </div>

        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-400">
          {job.match}% Match
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {job.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-400"
          >
            {skill}
          </span>
        ))}
      </div>

      <button
        onClick={() => onApply(job.id)}
        disabled={applied}
        className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-emerald-600"
      >
        {applied ? "✓ Applied" : "Apply Now"}
      </button>
    </article>
  );
}
