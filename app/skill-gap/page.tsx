"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJobs } from "../../lib/jobs";
import { calculateSkillGap } from "../../lib/skillGap";

type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[];
  description: string;
  location: string;
};

type JobAnalysis = Job & {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
};

const userSkills = [
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "SQL",
];

export default function SkillGapPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await getJobs();
        setJobs((data || []) as Job[]);
      } catch (err) {
        console.error(err);
        setError("Unable to load job data.");
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  const analyses: JobAnalysis[] = jobs.map((job) => {
    const requiredSkills = Array.isArray(job.required_skills)
      ? job.required_skills
      : [];

    const result = calculateSkillGap(
      userSkills,
      requiredSkills
    );

    return {
      ...job,
      required_skills: requiredSkills,
      matchPercentage: result.matchPercentage,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
    };
  });

  const overallMatch =
    analyses.length > 0
      ? Math.round(
          analyses.reduce(
            (total, job) => total + job.matchPercentage,
            0
          ) / analyses.length
        )
      : 0;

  const allMissingSkills = Array.from(
    new Set(
      analyses.flatMap((job) => job.missingSkills)
    )
  );

  const skillFrequency: Record<string, number> = {};

  analyses.forEach((job) => {
    job.missingSkills.forEach((skill) => {
      skillFrequency[skill] =
        (skillFrequency[skill] || 0) + 1;
    });
  });

  const prioritySkills = [...allMissingSkills]
    .sort(
      (a, b) =>
        (skillFrequency[b] || 0) -
        (skillFrequency[a] || 0)
    )
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 border-r border-white/10 bg-[#0b1728] p-5 md:block">

          <div className="mb-10 flex items-center gap-3">

            <Link href="/">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-xl font-bold text-slate-950">
                S
              </div>
            </Link>

            <div>
              <h1 className="text-xl font-bold">
                SkillTrack
              </h1>

              <p className="text-xs text-slate-400">
                Career Intelligence
              </p>
            </div>

          </div>

          <nav className="space-y-2">

            <Link
              href="/"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-lg">▦</span>
              Dashboard
            </Link>

            <Link
              href="/skills"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-lg">◎</span>
              My Skills
            </Link>

            <Link
              href="/skill-gap"
              className="flex w-full items-center gap-3 rounded-xl bg-cyan-500/15 px-4 py-3 text-cyan-400"
            >
              <span className="text-lg">◈</span>
              Skill Gap
            </Link>

            <Link
              href="/jobs"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-lg">▣</span>
              Jobs
            </Link>

            <Link
              href="/applications"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-lg">✓</span>
              Applications
            </Link>

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

        </aside>

        {/* MAIN */}
        <section className="flex-1">

          {/* HEADER */}
          <header className="flex items-center justify-between border-b border-white/10 bg-[#0b1728]/80 px-5 py-5 backdrop-blur md:px-8">

            <div>
              <p className="text-sm text-slate-400">
                Career Intelligence
              </p>

              <h2 className="text-xl font-bold md:text-2xl">
                Skill Gap Analysis
              </h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 font-bold">
              R
            </div>

          </header>

          <div className="space-y-7 p-5 md:p-8">

            {/* INTRO */}
            <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent p-6 md:p-8">

              <p className="text-sm font-medium text-cyan-400">
                CAREER ANALYSIS
              </p>

              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                Identify your skill gaps.
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                We compare your current skills with the skills
                required by available jobs and show you exactly
                what you should improve.
              </p>

            </div>

            {/* OVERVIEW */}
            <div className="grid gap-4 md:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">

                <p className="text-sm text-slate-400">
                  Overall Job Readiness
                </p>

                <p className="mt-2 text-4xl font-bold text-cyan-400">
                  {overallMatch}%
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Average match across available jobs
                </p>

              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">

                <p className="text-sm text-slate-400">
                  Current Skills
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {userSkills.length}
                </p>

                <p className="mt-2 text-xs text-green-400">
                  Skills in your profile
                </p>

              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">

                <p className="text-sm text-slate-400">
                  Skills To Improve
                </p>

                <p className="mt-2 text-4xl font-bold text-red-400">
                  {allMissingSkills.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Missing from available jobs
                </p>

              </div>

            </div>

            {/* PRIORITY SKILLS */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">

              <div className="mb-6">

                <h3 className="text-xl font-bold">
                  Priority Skills
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  These skills can improve your job opportunities.
                </p>

              </div>

              {loading ? (
                <p className="text-slate-400">
                  Analyzing your skills...
                </p>
              ) : error ? (
                <p className="text-red-400">
                  {error}
                </p>
              ) : prioritySkills.length === 0 ? (
                <div className="rounded-xl bg-green-500/10 p-5 text-center text-green-400">
                  🎉 Great! No major skill gaps found.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">

                  {prioritySkills.map((skill, index) => (
                    <div
                      key={skill}
                      className="rounded-xl border border-red-500/10 bg-red-500/5 p-4"
                    >

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-sm font-bold text-red-400">
                            {index + 1}
                          </div>

                          <span className="font-semibold">
                            {skill}
                          </span>

                        </div>

                        <span className="text-xs text-red-400">
                          Improve
                        </span>

                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        Required by{" "}
                        {skillFrequency[skill]}{" "}
                        available job
                        {skillFrequency[skill] !== 1
                          ? "s"
                          : ""}
                        .
                      </p>

                    </div>
                  ))}

                </div>
              )}

            </div>

            {/* JOB ANALYSIS */}
            <div>

              <div className="mb-5">

                <h3 className="text-xl font-bold">
                  Job-by-Job Analysis
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  See exactly how your skills match each job.
                </p>

              </div>

              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-8 text-center text-slate-400">
                  Loading job analysis...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-400">
                  {error}
                </div>
              ) : analyses.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-8 text-center text-slate-400">
                  No jobs available for analysis.
                </div>
              ) : (
                <div className="space-y-5">

                  {analyses.map((job) => (

                    <div
                      key={job.id}
                      className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6"
                    >

                      {/* JOB HEADER */}
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                        <div>

                          <p className="text-sm text-cyan-400">
                            {job.company}
                          </p>

                          <h4 className="mt-1 text-xl font-bold">
                            {job.title}
                          </h4>

                          <p className="mt-1 text-xs text-slate-500">
                            📍 {job.location || "India"}
                          </p>

                        </div>

                        <div className="rounded-2xl bg-green-500/10 px-6 py-4 text-center">

                          <p className="text-3xl font-bold text-green-400">
                            {job.matchPercentage}%
                          </p>

                          <p className="text-xs text-green-400">
                            SKILL MATCH
                          </p>

                        </div>

                      </div>

                      {/* PROGRESS */}
                      <div className="mt-6">

                        <div className="mb-2 flex justify-between text-xs">

                          <span className="text-slate-400">
                            Match Score
                          </span>

                          <span className="text-slate-300">
                            {job.matchPercentage}%
                          </span>

                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                          <div
                            className="h-full rounded-full bg-cyan-400 transition-all"
                            style={{
                              width: `${job.matchPercentage}%`,
                            }}
                          />

                        </div>

                      </div>

                      {/* MATCHED + MISSING */}
                      <div className="mt-6 grid gap-5 md:grid-cols-2">

                        <div>

                          <h5 className="mb-3 text-sm font-semibold text-green-400">
                            ✓ Skills You Have
                          </h5>

                          {job.matchedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">

                              {job.matchedSkills.map(
                                (skill) => (
                                  <span
                                    key={skill}
                                    className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs text-green-400"
                                  >
                                    ✓ {skill}
                                  </span>
                                )
                              )}

                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">
                              No matching skills yet.
                            </p>
                          )}

                        </div>

                        <div>

                          <h5 className="mb-3 text-sm font-semibold text-red-400">
                            ✗ Skills To Improve
                          </h5>

                          {job.missingSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">

                              {job.missingSkills.map(
                                (skill) => (
                                  <span
                                    key={skill}
                                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400"
                                  >
                                    ✗ {skill}
                                  </span>
                                )
                              )}

                            </div>
                          ) : (
                            <p className="text-xs text-green-400">
                              You have all required skills.
                            </p>
                          )}

                        </div>

                      </div>

                    </div>

                  ))}

                </div>
              )}

            </div>

            {/* CURRENT SKILLS */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">

              <div className="mb-5">

                <h3 className="text-lg font-bold">
                  Your Current Skills
                </h3>

                <p className="text-sm text-slate-400">
                  Skills currently used for the analysis.
                </p>

              </div>

              <div className="flex flex-wrap gap-3">

                {userSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300"
                  >
                    ✓ {skill}
                  </span>
                ))}

              </div>

            </div>

            {/* BACK */}
            <Link
              href="/"
              className="inline-block text-sm font-semibold text-cyan-400 hover:text-cyan-300"
            >
              ← Back to Dashboard
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}