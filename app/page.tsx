"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getJobs } from "../lib/jobs";
import { calculateSkillGap } from "../lib/skillGap";

const skills = [
  { name: "JavaScript", level: 85 },
  { name: "React", level: 78 },
  { name: "Next.js", level: 72 },
  { name: "Node.js", level: 68 },
  { name: "SQL", level: 62 },
  { name: "Python", level: 55 },
];

const userSkills = [
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "SQL",
];

type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[];
  description: string;
  location: string;
  created_at: string;
};

const applications = [
  {
    company: "TechNova Solutions",
    role: "Junior Developer",
    status: "Interview",
  },
  {
    company: "Digital Labs",
    role: "Frontend Developer",
    status: "Applied",
  },
  {
    company: "Insight Analytics",
    role: "Data Analyst",
    status: "Wishlist",
  },
];

export default function Home() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobError, setJobError] = useState("");

  useEffect(() => {
    async function loadJobs() {
      setLoadingJobs(true);

      try {
        const data = await getJobs();
        setJobs((data || []) as Job[]);
      } catch (error) {
        console.error(error);
        setJobError("Unable to load jobs.");
      } finally {
        setLoadingJobs(false);
      }
    }

    loadJobs();
  }, []);

  const jobMatches = jobs.map((job) => {
    const requiredSkills = Array.isArray(job.required_skills)
      ? job.required_skills
      : [];

    const gap = calculateSkillGap(userSkills, requiredSkills);

    return {
      ...job,
      required_skills: requiredSkills,
      matchPercentage: gap.matchPercentage,
      matchedSkills: gap.matchedSkills,
      missingSkills: gap.missingSkills,
    };
  });

  const averageMatch =
    jobMatches.length > 0
      ? Math.round(
          jobMatches.reduce(
            (total, job) => total + job.matchPercentage,
            0
          ) / jobMatches.length
        )
      : 0;

  const topMissingSkills = Array.from(
    new Set(jobMatches.flatMap((job) => job.missingSkills))
  ).slice(0, 3);

  const goTo = (path: string) => {
    router.push(path);
  };

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 border-r border-white/10 bg-[#0b1728] p-5 md:block">

          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-xl font-bold text-slate-950">
              S
            </div>

            <div>
              <h1 className="text-xl font-bold">SkillTrack</h1>
              <p className="text-xs text-slate-400">
                Career Intelligence
              </p>
            </div>
          </div>

          <nav className="space-y-2">

            <button
              onClick={() => goTo("/")}
              className="flex w-full items-center gap-3 rounded-xl bg-cyan-500/15 px-4 py-3 text-left text-cyan-400 transition hover:bg-cyan-500/20"
            >
              <span className="text-lg">▦</span>
              Dashboard
            </button>

            <button
              onClick={() => goTo("/skills")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-lg">◎</span>
              My Skills
            </button>

            <button
              onClick={() => goTo("/skill-gap")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-lg">◈</span>
              Skill Gap
            </button>

            <button
              onClick={() => goTo("/jobs")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-lg">▣</span>
              Jobs
            </button>

            <button
              onClick={() => goTo("/applications")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-lg">✓</span>
              Applications
            </button>

          </nav>

          <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-xs text-slate-400">
              Profile completion
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700">
              <div className="h-full w-[82%] rounded-full bg-cyan-400" />
            </div>

            <p className="mt-2 text-sm font-semibold">
              82% complete
            </p>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white">
              ⚙ Settings
            </button>
          </div>

        </aside>

        {/* MAIN */}
        <section className="flex-1">

          {/* TOP BAR */}
          <header className="flex items-center justify-between border-b border-white/10 bg-[#0b1728]/80 px-5 py-5 backdrop-blur md:px-8">

            <div>
              <p className="text-sm text-slate-400">
                Career Dashboard
              </p>

              <h2 className="text-xl font-bold md:text-2xl">
                Welcome back, Raj 👋
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">
                🔔
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 font-bold">
                R
              </div>
            </div>

          </header>

          <div className="space-y-7 p-5 md:p-8">

            {/* HERO */}
            <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent p-6 md:p-8">

              <div className="max-w-3xl">

                <p className="mb-2 text-sm font-medium text-cyan-400">
                  YOUR CAREER JOURNEY
                </p>

                <h3 className="text-2xl font-bold md:text-4xl">
                  Turn your skills into your next opportunity.
                </h3>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                  Track your skills, discover career gaps, find
                  matching jobs and manage your applications — all in
                  one place.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <button
                    onClick={() => goTo("/skill-gap")}
                    className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Analyze Skill Gap
                  </button>

                  <button
                    onClick={() => goTo("/jobs")}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
                  >
                    Explore Jobs
                  </button>

                </div>
              </div>
            </div>

            {/* CAREER SNAPSHOT */}
            <div>

              <div className="mb-4">
                <h3 className="text-xl font-bold">
                  Career Snapshot
                </h3>

                <p className="text-sm text-slate-400">
                  Your current career progress
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5">
                  <p className="text-sm text-slate-400">
                    Skills Added
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {skills.length}
                  </p>

                  <p className="mt-2 text-xs text-cyan-400">
                    Active skills
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5">
                  <p className="text-sm text-slate-400">
                    Average Job Match
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {averageMatch}%
                  </p>

                  <p className="mt-2 text-xs text-green-400">
                    Based on current jobs
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5">
                  <p className="text-sm text-slate-400">
                    Applications
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    08
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    2 this week
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5">
                  <p className="text-sm text-slate-400">
                    Interviews
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    03
                  </p>

                  <p className="mt-2 text-xs text-yellow-400">
                    1 upcoming
                  </p>
                </div>

              </div>
            </div>

            {/* SKILLS + SKILL GAP */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* MY SKILLS */}
              <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">

                <div className="mb-6 flex items-center justify-between">

                  <div>
                    <h3 className="text-lg font-bold">
                      My Skills
                    </h3>

                    <p className="text-sm text-slate-400">
                      Current proficiency
                    </p>
                  </div>

                  <button
                    onClick={() => goTo("/skills")}
                    className="text-sm font-semibold text-cyan-400"
                  >
                    View all →
                  </button>

                </div>

                <div className="space-y-5">

                  {skills.map((skill) => (
                    <div key={skill.name}>

                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium">
                          {skill.name}
                        </span>

                        <span className="text-slate-400">
                          {skill.level}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">

                        <div
                          className="h-full rounded-full bg-cyan-400"
                          style={{
                            width: `${skill.level}%`,
                          }}
                        />

                      </div>

                    </div>
                  ))}

                </div>
              </div>

              {/* SKILL GAP */}
              <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">

                <div className="mb-5">
                  <h3 className="text-lg font-bold">
                    Skill Gap Analysis
                  </h3>

                  <p className="text-sm text-slate-400">
                    Skills you should improve next
                  </p>
                </div>

                <div className="flex items-center justify-center py-3">

                  <div className="flex h-40 w-40 items-center justify-center rounded-full border-[14px] border-cyan-400/20 border-t-cyan-400 border-r-cyan-400">

                    <div className="text-center">

                      <p className="text-3xl font-bold">
                        {averageMatch}%
                      </p>

                      <p className="text-xs text-slate-400">
                        Job Readiness
                      </p>

                    </div>

                  </div>

                </div>

                <div className="mt-4 space-y-3">

                  {topMissingSkills.length > 0 ? (
                    topMissingSkills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center justify-between rounded-xl bg-white/5 p-3"
                      >

                        <div>
                          <p className="font-medium">
                            {skill}
                          </p>

                          <p className="text-xs text-slate-400">
                            Required by recommended jobs
                          </p>
                        </div>

                        <span className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-400">
                          Missing
                        </span>

                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-green-500/10 p-4 text-center text-sm text-green-400">
                      Great! No major skill gaps found.
                    </div>
                  )}

                </div>

                <button
                  onClick={() => goTo("/skill-gap")}
                  className="mt-5 w-full rounded-xl border border-cyan-500/30 py-2.5 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/10"
                >
                  View Full Skill Gap →
                </button>

              </div>

            </div>

            {/* RECOMMENDED JOBS */}
            <div>

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h3 className="text-xl font-bold">
                    Recommended Jobs
                  </h3>

                  <p className="text-sm text-slate-400">
                    Jobs based on your current skills
                  </p>
                </div>

                <button
                  onClick={() => goTo("/jobs")}
                  className="text-sm font-semibold text-cyan-400"
                >
                  View all →
                </button>

              </div>

              {loadingJobs ? (
                <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-8 text-center text-slate-400">
                  Loading jobs from Supabase...
                </div>
              ) : jobError ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-400">
                  {jobError}
                </div>
              ) : jobs.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-8 text-center text-slate-400">
                  No jobs found in Supabase.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">

                  {jobMatches.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5 transition hover:-translate-y-1 hover:border-cyan-500/30"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="text-xs text-slate-500">
                            FULL TIME
                          </p>

                          <h4 className="mt-2 font-bold">
                            {job.title}
                          </h4>

                          <p className="mt-1 text-sm text-slate-400">
                            {job.company}
                          </p>

                        </div>

                        <div className="rounded-xl bg-green-500/10 px-3 py-2 text-center">

                          <p className="text-lg font-bold text-green-400">
                            {job.matchPercentage}%
                          </p>

                          <p className="text-[10px] text-green-400">
                            MATCH
                          </p>

                        </div>

                      </div>

                      <p className="mt-4 text-xs text-slate-500">
                        📍 {job.location}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">

                        {job.required_skills.map((skill) => {

                          const matched = job.matchedSkills.some(
                            (item) =>
                              item.toLowerCase() ===
                              skill.toLowerCase()
                          );

                          return (
                            <span
                              key={skill}
                              className={`rounded-lg px-2.5 py-1 text-xs ${
                                matched
                                  ? "bg-cyan-500/10 text-cyan-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {matched ? "✓ " : "✗ "}
                              {skill}
                            </span>
                          );
                        })}

                      </div>

                      {job.missingSkills.length > 0 && (
                        <div className="mt-4 rounded-xl bg-red-500/5 p-3">

                          <p className="text-xs font-semibold text-red-400">
                            Skills to improve
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {job.missingSkills.join(", ")}
                          </p>

                        </div>
                      )}

                      <button
                        onClick={() => goTo("/jobs")}
                        className="mt-5 w-full rounded-xl border border-cyan-500/30 py-2.5 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/10"
                      >
                        View Job
                      </button>

                    </div>
                  ))}

                </div>
              )}

            </div>

            {/* APPLICATION TRACKER */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <h3 className="text-lg font-bold">
                    Application Tracker
                  </h3>

                  <p className="text-sm text-slate-400">
                    Keep track of your job applications
                  </p>
                </div>

                <button
                  onClick={() => goTo("/applications")}
                  className="text-sm font-semibold text-cyan-400"
                >
                  Manage →
                </button>

              </div>

              <div className="grid gap-3 md:grid-cols-3">

                {applications.map((application) => (
                  <div
                    key={application.company}
                    className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <div>
                        <p className="font-semibold">
                          {application.role}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {application.company}
                        </p>
                      </div>

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs ${
                          application.status === "Interview"
                            ? "bg-green-500/10 text-green-400"
                            : application.status === "Applied"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {application.status}
                      </span>

                    </div>

                  </div>
                ))}

              </div>

            </div>

            {/* FOOTER */}
            <div className="border-t border-white/10 pt-6 text-center text-xs text-slate-500">
              SkillTrack • Smart Skill & Employment Tracking Platform
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}