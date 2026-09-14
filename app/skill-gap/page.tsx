"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getJobs } from "../../lib/jobs";
import {
  calculateSkillGap,
  UserSkill,
  SkillGapResult,
} from "../../lib/skillGap";

type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[] | null;
  description: string | null;
  location: string | null;
};

type Profile = {
  full_name: string | null;
  skills: UserSkill[] | null;
};

type JobAnalysis = Job & {
  analysis: SkillGapResult;
};

export default function SkillGapPage() {
  const [userName, setUserName] = useState("SkillTrack User");
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("full_name, skills")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
          console.error(
            "Profile error:",
            profileError.message
          );
        }

        const profileData = profile as Profile | null;

        if (profileData?.full_name) {
          setUserName(profileData.full_name);
        } else if (user.email) {
          setUserName(user.email.split("@")[0]);
        }

        if (Array.isArray(profileData?.skills)) {
          setSkills(profileData.skills);
        }

        const jobsData = await getJobs();

        setJobs(jobsData as Job[]);
      } catch (err) {
        console.error("Skill Gap loading error:", err);
        setError("Unable to load skill gap data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const jobAnalyses = useMemo<JobAnalysis[]>(() => {
    return jobs
      .map((job) => ({
        ...job,
        analysis: calculateSkillGap(
          skills,
          job.required_skills || []
        ),
      }))
      .sort(
        (a, b) =>
          b.analysis.matchPercentage -
          a.analysis.matchPercentage
      );
  }, [jobs, skills]);

  const overallReadiness = useMemo(() => {
    if (jobAnalyses.length === 0) {
      return 0;
    }

    const total = jobAnalyses.reduce(
      (sum, job) =>
        sum + job.analysis.matchPercentage,
      0
    );

    return Math.round(total / jobAnalyses.length);
  }, [jobAnalyses]);

  const strongSkills = useMemo(() => {
    return skills
      .filter((skill) => Number(skill.level) >= 70)
      .sort((a, b) => b.level - a.level)
      .slice(0, 8);
  }, [skills]);

  const improvingSkills = useMemo(() => {
    return skills
      .filter(
        (skill) =>
          Number(skill.level) > 0 &&
          Number(skill.level) < 70
      )
      .sort((a, b) => a.level - b.level)
      .slice(0, 8);
  }, [skills]);

  const missingSkills = useMemo(() => {
    const counts = new Map<string, number>();

    jobAnalyses.forEach((job) => {
      job.analysis.missingSkills.forEach((skill) => {
        counts.set(
          skill,
          (counts.get(skill) || 0) + 1
        );
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({
        skill,
        count,
      }));
  }, [jobAnalyses]);

  const bestJobs = jobAnalyses.slice(0, 5);

  function getReadinessLabel(value: number) {
    if (value >= 80) return "Excellent";
    if (value >= 65) return "Good";
    if (value >= 45) return "Needs Improvement";
    return "Beginner";
  }

  function getMatchClass(value: number) {
    if (value >= 80) {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }

    if (value >= 60) {
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
    }

    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />

          <p className="mt-4 text-slate-400">
            Analyzing your skills...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* Navbar */}
      <header className="border-b border-white/10 bg-[#07111f]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Skill<span className="text-cyan-400">Track</span>
          </Link>

          <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
            <Link
              href="/"
              className="hover:text-cyan-400"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="hover:text-cyan-400"
            >
              Profile
            </Link>

            <Link
              href="/jobs"
              className="hover:text-cyan-400"
            >
              Jobs
            </Link>

            <Link
              href="/skill-gap"
              className="text-cyan-400"
            >
              Skill Gap
            </Link>

            <Link
              href="/applications"
              className="hover:text-cyan-400"
            >
              Applications
            </Link>
          </nav>

          <Link
            href="/profile"
            className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300"
          >
            {userName}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <section className="mb-8">
          <Link
            href="/"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-5 text-4xl font-black">
            Skill Gap Analysis
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            See how your current skills compare with real job
            requirements and discover what you should improve next.
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-300">
            {error}
          </div>
        )}

        {/* Readiness */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-[#0d1b2e] p-7 lg:col-span-2">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Career Readiness
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  {getReadinessLabel(overallReadiness)}
                </h2>

                <p className="mt-2 max-w-xl text-sm text-slate-400">
                  Your readiness score is calculated by comparing
                  your current proficiency with the skills required
                  across available jobs.
                </p>
              </div>

              <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full border-8 border-cyan-400/20">
                <div className="text-center">
                  <p className="text-4xl font-black text-cyan-400">
                    {overallReadiness}%
                  </p>

                  <p className="text-xs text-slate-500">
                    Ready
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all"
                style={{
                  width: `${overallReadiness}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-7">
            <p className="text-sm text-slate-400">
              Skills Analyzed
            </p>

            <p className="mt-3 text-5xl font-black">
              {skills.length}
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  Strong
                </span>

                <span className="font-bold text-emerald-400">
                  {strongSkills.length}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">
                  Improving
                </span>

                <span className="font-bold text-yellow-400">
                  {improvingSkills.length}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">
                  Jobs Compared
                </span>

                <span className="font-bold text-cyan-400">
                  {jobs.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Strong + Improving */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Strong Skills ✅
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Skills where your proficiency is 70% or higher.
                </p>
              </div>

              <span className="text-2xl">💪</span>
            </div>

            <div className="mt-6 space-y-4">
              {strongSkills.length === 0 && (
                <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-slate-400">
                  Add skills with proficiency levels of 70%+
                  to see them here.
                </p>
              )}

              {strongSkills.map((skill) => (
                <div key={skill.name}>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-semibold">
                      {skill.name}
                    </span>

                    <span className="text-xs text-emerald-400">
                      {skill.level}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, skill.level)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Needs Improvement 🟡
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Existing skills that need more practice.
                </p>
              </div>

              <span className="text-2xl">📈</span>
            </div>

            <div className="mt-6 space-y-4">
              {improvingSkills.length === 0 && (
                <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-slate-400">
                  No improving skills detected.
                </p>
              )}

              {improvingSkills.map((skill) => (
                <div key={skill.name}>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-semibold">
                      {skill.name}
                    </span>

                    <span className="text-xs text-yellow-400">
                      {skill.level}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, skill.level)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Missing Skills */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Priority Skill Gaps 🔴
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Skills frequently required by jobs that are missing
                from your profile.
              </p>
            </div>

            <span className="text-2xl">🎯</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {missingSkills.length === 0 && (
              <div className="col-span-full rounded-xl bg-emerald-400/10 p-5 text-sm text-emerald-300">
                Great! No major missing skills were detected.
              </div>
            )}

            {missingSkills.map(({ skill, count }) => (
              <div
                key={skill}
                className="rounded-xl border border-red-400/10 bg-red-400/5 p-5"
              >
                <p className="font-bold text-red-300">
                  {skill}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Required by {count}{" "}
                  {count === 1 ? "job" : "jobs"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Best Jobs */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">
                Best Job Matches 💼
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Jobs ranked according to your current skill profile.
              </p>
            </div>

            <Link
              href="/jobs"
              className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Explore All Jobs →
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {bestJobs.length === 0 && (
              <p className="rounded-xl bg-white/[0.03] p-5 text-sm text-slate-400">
                No jobs available for analysis.
              </p>
            )}

            {bestJobs.map((job, index) => (
              <div
                key={job.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 font-black text-cyan-400">
                    #{index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-cyan-400">
                      {job.company}
                    </p>

                    <h3 className="mt-1 text-lg font-bold">
                      {job.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      📍 {job.location || "India"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.analysis.matchedSkills
                        .slice(0, 3)
                        .map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300"
                          >
                            ✓ {skill}
                          </span>
                        ))}

                      {job.analysis.improvingSkills
                        .slice(0, 2)
                        .map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-yellow-400/10 px-2.5 py-1 text-xs text-yellow-300"
                          >
                            ↗ {skill}
                          </span>
                        ))}

                      {job.analysis.missingSkills
                        .slice(0, 2)
                        .map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-red-400/10 px-2.5 py-1 text-xs text-red-300"
                          >
                            + {skill}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div
                    className={`rounded-xl border px-5 py-3 text-center ${getMatchClass(
                      job.analysis.matchPercentage
                    )}`}
                  >
                    <p className="text-2xl font-black">
                      {job.analysis.matchPercentage}%
                    </p>

                    <p className="text-[10px] uppercase tracking-wider">
                      Match
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Learning Recommendation */}
        <section className="mt-6 rounded-2xl border border-purple-400/20 bg-gradient-to-r from-purple-500/10 to-cyan-400/10 p-7">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-300">
                What To Learn Next
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Focus on your highest-impact skill gaps.
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Improving these skills can increase your compatibility
                with multiple available jobs.
              </p>
            </div>

            <Link
              href="/profile"
              className="whitespace-nowrap rounded-xl bg-purple-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-purple-300"
            >
              Improve My Skills →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}