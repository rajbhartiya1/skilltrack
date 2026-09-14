"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  calculateSkillGap,
  UserSkill,
} from "../../../lib/skillGap";

type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[] | null;
  description: string | null;
  location: string | null;
  created_at?: string;
};

type Profile = {
  full_name: string | null;
  skills: UserSkill[] | null;
};

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadJob() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const { data: jobData, error: jobError } =
          await supabase
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .maybeSingle();

        if (jobError) {
          console.error(
            "Job loading error:",
            jobError.message
          );
        }

        if (jobData) {
          setJob(jobData as Job);
        }

        const { data: profileData } =
          await supabase
            .from("profiles")
            .select("full_name, skills")
            .eq("id", user.id)
            .maybeSingle();

        const profile =
          profileData as Profile | null;

        if (Array.isArray(profile?.skills)) {
          setSkills(profile.skills);
        }

        const { data: existingApplication } =
          await supabase
            .from("applications")
            .select("status")
            .eq("user_id", user.id)
            .eq("job_id", jobId)
            .maybeSingle();

        if (existingApplication) {
          setApplicationStatus(
            existingApplication.status
          );
        }
      } catch (error) {
        console.error(
          "Job details error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />

          <p className="mt-5 text-sm text-slate-400">
            Loading job intelligence...
          </p>
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-[#07111f] p-6 text-white">
        <div className="mx-auto max-w-3xl py-20 text-center">
          <div className="text-6xl">
            🔍
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Job not found
          </h1>

          <p className="mt-3 text-slate-500">
            This opportunity is unavailable or may have
            been removed.
          </p>

          <Link
            href="/jobs"
            className="mt-7 inline-block rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950"
          >
            ← Back to Jobs
          </Link>
        </div>
      </main>
    );
  }

  /*
   * IMPORTANT:
   * After the null check above, create a stable
   * non-null reference for TypeScript.
   */
  const currentJob: Job = job;

  const analysis = calculateSkillGap(
    skills,
    currentJob.required_skills || []
  );

  const matchPercentage =
    analysis.matchPercentage;

  const requiredSkills =
    currentJob.required_skills || [];

  const totalSkills =
    requiredSkills.length;

  const matchedPercentage =
    totalSkills === 0
      ? 0
      : Math.round(
          (analysis.matchedSkills.length /
            totalSkills) *
            100
        );

  const improvingPercentage =
    totalSkills === 0
      ? 0
      : Math.round(
          (analysis.improvingSkills.length /
            totalSkills) *
            100
        );

  const missingPercentage =
    totalSkills === 0
      ? 0
      : Math.round(
          (analysis.missingSkills.length /
            totalSkills) *
            100
        );

  function getMatchLabel(value: number) {
    if (value >= 85) {
      return "Excellent Match";
    }

    if (value >= 70) {
      return "Strong Match";
    }

    if (value >= 50) {
      return "Potential Match";
    }

    return "Needs Development";
  }

  function getMatchStyle(value: number) {
    if (value >= 85) {
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    }

    if (value >= 70) {
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
    }

    if (value >= 50) {
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    }

    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  async function handleApplication(
    status: "Wishlist" | "Applied"
  ) {
    setActionLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (applicationStatus) {
        alert(
          `This job is already in your Applications with status: ${applicationStatus}`
        );
        return;
      }

      const { error } =
        await supabase
          .from("applications")
          .insert({
            user_id: user.id,
            job_id: currentJob.id,
            status,
          });

      if (error) {
        alert(error.message);
        return;
      }

      setApplicationStatus(status);

      alert(
        status === "Applied"
          ? "Application submitted successfully!"
          : "Job saved to your wishlist!"
      );
    } catch (error) {
      console.error(
        "Application error:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* NAVBAR */}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-2xl font-black"
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
      className="flex items-center gap-2 py-3 transition hover:text-cyan-400"
    >
      AI Career
      <span className="text-[10px] transition-transform duration-200 group-hover:rotate-180">
        ▼
      </span>
    </button>

    <div className="pointer-events-none absolute left-1/2 top-full z-[100] w-80 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/10 bg-[#0b1728] p-2 opacity-0 shadow-2xl shadow-cyan-500/10 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">

      <Link
  href="/ai-assistant"
  className="block rounded-xl px-4 py-3 transition hover:bg-cyan-400/10"
>
  <div className="font-semibold text-white">
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
          Find the best career path for your skills
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
          Discover missing and improving skills
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
          Build your personalized career roadmap
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
          Check your resume and ATS readiness
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
          Practice interview questions
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
            href="/applications"
            className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300"
          >
            My Applications
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* BACK */}

        <Link
          href="/jobs"
          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
        >
          ← Back to Jobs
        </Link>

        {/* HERO */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-[#0d1b2e] to-purple-500/10">
          <div className="p-8 md:p-10">
            <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-center">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
                  {currentJob.company}
                </p>

                <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                  {currentJob.title}
                </h1>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
                    📍{" "}
                    {currentJob.location ||
                      "India"}
                  </span>

                  <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
                    💼 Technology
                  </span>

                  <span
                    className={`rounded-xl border px-4 py-2 text-sm font-bold ${getMatchStyle(
                      matchPercentage
                    )}`}
                  >
                    {matchPercentage}% Match
                  </span>
                </div>

                <p className="mt-7 max-w-2xl text-sm leading-7 text-slate-400">
                  {currentJob.description ||
                    "Explore this opportunity and compare your current skills with the job requirements."}
                </p>
              </div>

              {/* MATCH CIRCLE */}

              <div className="flex shrink-0 flex-col items-center">
                <div className="flex h-48 w-48 items-center justify-center rounded-full border-[10px] border-cyan-400/15 bg-cyan-400/5">
                  <div className="text-center">
                    <p className="text-5xl font-black text-cyan-400">
                      {matchPercentage}%
                    </p>

                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Your Match
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm font-bold text-slate-300">
                  {getMatchLabel(
                    matchPercentage
                  )}
                </p>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {applicationStatus ? (
                <Link
                  href="/applications"
                  className="flex-1 rounded-xl bg-emerald-400 px-6 py-4 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  ✓ {applicationStatus} — View Application
                </Link>
              ) : (
                <>
                  <button
                    onClick={() =>
                      handleApplication(
                        "Applied"
                      )
                    }
                    disabled={actionLoading}
                    className="flex-1 rounded-xl bg-cyan-400 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Apply Now →"}
                  </button>

                  <button
                    onClick={() =>
                      handleApplication(
                        "Wishlist"
                      )
                    }
                    disabled={actionLoading}
                    className="flex-1 rounded-xl border border-purple-400/20 bg-purple-400/10 px-6 py-4 text-sm font-black text-purple-300 transition hover:bg-purple-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ♡ Add to Wishlist
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* QUICK STATS */}

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-cyan-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Match Score
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-400">
              {matchPercentage}%
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Skills Ready
            </p>

            <p className="mt-3 text-4xl font-black text-emerald-400">
              {analysis.matchedSkills.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Skills to Improve
            </p>

            <p className="mt-3 text-4xl font-black text-yellow-400">
              {analysis.improvingSkills.length}
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Skills Missing
            </p>

            <p className="mt-3 text-4xl font-black text-red-400">
              {analysis.missingSkills.length}
            </p>
          </div>
        </section>

        {/* SKILL ANALYSIS */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0d1b2e] p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
              SMART SKILL ANALYSIS
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Your compatibility breakdown
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              SkillTrack compares your proficiency with the
              requirements for this position.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {/* READY */}

            <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-300">
                  ✓ Ready
                </span>

                <span className="font-black text-emerald-300">
                  {matchedPercentage}%
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{
                    width: `${matchedPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-600">
                Skills where your proficiency meets the target
                level.
              </p>
            </div>

            {/* IMPROVE */}

            <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-yellow-300">
                  ↗ Improve
                </span>

                <span className="font-black text-yellow-300">
                  {improvingPercentage}%
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{
                    width: `${improvingPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-600">
                Skills you already have but should strengthen.
              </p>
            </div>

            {/* LEARN */}

            <div className="rounded-2xl border border-red-400/10 bg-red-400/5 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-red-300">
                  + Learn
                </span>

                <span className="font-black text-red-300">
                  {missingPercentage}%
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{
                    width: `${missingPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-600">
                Skills currently missing from your profile.
              </p>
            </div>
          </div>
        </section>

        {/* MATCHED SKILLS */}

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-emerald-400/10 bg-[#0d1b2e] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              YOUR STRENGTHS
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Skills You Already Have
            </h2>

            <div className="mt-6 space-y-3">
              {analysis.matchedSkills.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">
                  No required skills currently meet the target
                  proficiency.
                </div>
              ) : (
                analysis.matchedSkills.map(
                  (skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-3 rounded-xl bg-emerald-400/5 p-4"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                        ✓
                      </span>

                      <span className="text-sm font-semibold">
                        {skill}
                      </span>

                      <span className="ml-auto text-xs font-bold text-emerald-400">
                        Ready
                      </span>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {/* IMPROVING */}

          <div className="rounded-3xl border border-yellow-400/10 bg-[#0d1b2e] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
              DEVELOPMENT AREAS
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Skills To Improve
            </h2>

            <div className="mt-6 space-y-3">
              {analysis.improvingSkills.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">
                  No immediate improvement areas.
                </div>
              ) : (
                analysis.improvingSkills.map(
                  (skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-3 rounded-xl bg-yellow-400/5 p-4"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-300">
                        ↗
                      </span>

                      <span className="text-sm font-semibold">
                        {skill}
                      </span>

                      <span className="ml-auto text-xs font-bold text-yellow-400">
                        Improve
                      </span>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </section>

        {/* MISSING SKILLS */}

        <section className="mt-6 rounded-3xl border border-red-400/10 bg-[#0d1b2e] p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                PRIORITY LEARNING
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Skills You Need To Learn
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Developing these skills can increase your compatibility
                with this position.
              </p>
            </div>

            <Link
              href="/profile"
              className="text-sm font-bold text-cyan-400 hover:text-cyan-300"
            >
              Update Profile →
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.missingSkills.length ===
            0 ? (
              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-6 text-sm text-emerald-300 sm:col-span-2 lg:col-span-3">
                🎉 You have all the required skills for this
                position.
              </div>
            ) : (
              analysis.missingSkills.map(
                (skill, index) => (
                  <div
                    key={skill}
                    className="rounded-2xl border border-red-400/10 bg-red-400/5 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10 font-black text-red-300">
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-sm font-bold">
                          {skill}
                        </p>

                        <p className="mt-1 text-[10px] uppercase tracking-wider text-red-400">
                          Priority Skill
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </section>

        {/* ALL REQUIRED SKILLS */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0d1b2e] p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            ROLE REQUIREMENTS
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Complete Skill Requirements
          </h2>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {requiredSkills.map(
              (skill) => {
                const matched =
                  analysis.matchedSkills.includes(
                    skill
                  );

                const improving =
                  analysis.improvingSkills.includes(
                    skill
                  );

                return (
                  <div
                    key={skill}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">
                        {skill}
                      </span>

                      {matched ? (
                        <span className="shrink-0 text-xs font-bold text-emerald-400">
                          ✓ Ready
                        </span>
                      ) : improving ? (
                        <span className="shrink-0 text-xs font-bold text-yellow-400">
                          ↗ Improve
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs font-bold text-red-400">
                          + Learn
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* FINAL CTA */}

        <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-cyan-400/5 p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            SMART CAREER DECISION
          </p>

          <h2 className="mt-3 text-2xl font-black md:text-3xl">
            {matchPercentage >= 70
              ? "You're ready to make your move."
              : "Build your skills and increase your match."}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            SkillTrack helps you understand not just whether a
            job exists, but how prepared you are for it.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/recommendations"
              className="rounded-xl bg-purple-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-purple-300"
            >
              🧠 More Career Recommendations
            </Link>

            <Link
              href="/applications"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold transition hover:bg-white/10"
            >
              View Applications →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}