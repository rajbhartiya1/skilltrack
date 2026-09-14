"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { calculateSkillGap, UserSkill } from "../../../lib/skillGap";

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
  const [applicationStatus, setApplicationStatus] = useState<
    string | null
  >(null);

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

        const { data: jobData, error: jobError } =
          await supabase
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .maybeSingle();

        if (jobError) {
          console.error(jobError.message);
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
      loadData();
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
          <div className="text-5xl">🔍</div>

          <h1 className="mt-5 text-3xl font-black">
            Job not found
          </h1>

          <p className="mt-3 text-slate-500">
            This opportunity may have been removed or is no
            longer available.
          </p>

          <Link
            href="/jobs"
            className="mt-7 inline-block rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950"
          >
            Back to Jobs
          </Link>
        </div>
      </main>
    );
  }

  const analysis = calculateSkillGap(
    skills,
    job.required_skills || []
  );

  const matchPercentage =
    analysis.matchPercentage;

  const totalSkills =
    job.required_skills?.length || 0;

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
    if (value >= 85) return "Excellent Match";
    if (value >= 70) return "Strong Match";
    if (value >= 50) return "Potential Match";
    return "Needs Development";
  }

  function getMatchStyle(value: number) {
    if (value >= 85) {
      return "text-emerald-300 border-emerald-400/30 bg-emerald-400/10";
    }

    if (value >= 70) {
      return "text-cyan-300 border-cyan-400/30 bg-cyan-400/10";
    }

    if (value >= 50) {
      return "text-yellow-300 border-yellow-400/30 bg-yellow-400/10";
    }

    return "text-red-300 border-red-400/30 bg-red-400/10";
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
            job_id: job.id,
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
      console.error(error);

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

          <nav className="hidden gap-6 text-sm text-slate-300 lg:flex">
            <Link href="/">Dashboard</Link>
            <Link href="/profile">Profile</Link>
            <Link
              href="/jobs"
              className="text-cyan-400"
            >
              Jobs
            </Link>
            <Link href="/skill-gap">
              Skill Gap
            </Link>
            <Link href="/recommendations">
              AI Career
            </Link>
            <Link href="/applications">
              Applications
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
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← Back to Jobs
        </Link>

        {/* HERO */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-[#0d1b2e] to-purple-500/10">
          <div className="p-8 md:p-10">
            <div className="flex flex-col justify-between gap-8 lg:flex-row">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
                  {job.company}
                </p>

                <h1 className="mt-4 text-4xl font-black md:text-5xl">
                  {job.title}
                </h1>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
                    📍 {job.location || "India"}
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
                  {job.description ||
                    "Explore this opportunity and compare your current skills with the requirements."}
                </p>
              </div>

              {/* MATCH */}

              <div className="flex shrink-0 flex-col items-center">
                <div className="flex h-44 w-44 items-center justify-center rounded-full border-[10px] border-cyan-400/15 bg-cyan-400/5">
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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {applicationStatus ? (
                <Link
                  href="/applications"
                  className="flex-1 rounded-xl bg-emerald-400 px-6 py-4 text-center text-sm font-black text-slate-950"
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
                    className="flex-1 rounded-xl bg-cyan-400 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
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
                    className="flex-1 rounded-xl border border-purple-400/20 bg-purple-400/10 px-6 py-4 text-sm font-black text-purple-300 transition hover:bg-purple-400/20 disabled:opacity-50"
                  >
                    ♡ Add to Wishlist
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* INTELLIGENCE */}

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* MATCH SCORE */}

          <div className="rounded-3xl border border-white/10 bg-[#0d1b2e] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              SMART MATCH
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Compatibility
            </h2>

            <div className="mt-7 h-4 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all"
                style={{
                  width: `${matchPercentage}%`,
                }}
              />
            </div>

            <div className="mt-4 flex items-end justify-between">
              <span className="text-3xl font-black text-cyan-400">
                {matchPercentage}%
              </span>

              <span className="text-xs text-slate-600">
                overall fit
              </span>
            </div>
          </div>

          {/* MATCHED */}

          <div className="rounded-3xl border border-emerald-400/10 bg-[#0d1b2e] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              MATCHED SKILLS
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {analysis.matchedSkills.length}
            </h2>

            <div className="mt-5 flex flex-wrap gap-2">
              {analysis.matchedSkills.length ===
              0 ? (
                <span className="text-sm text-slate-500">
                  No strong matches yet.
                </span>
              ) : (
                analysis.matchedSkills.map(
                  (skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300"
                    >
                      ✓ {skill}
                    </span>
                  )
                )
              )}
            </div>
          </div>

          {/* GAPS */}

          <div className="rounded-3xl border border-red-400/10 bg-[#0d1b2e] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              SKILL GAPS
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {analysis.missingSkills.length}
            </h2>

            <div className="mt-5 flex flex-wrap gap-2">
              {analysis.missingSkills.length ===
              0 ? (
                <span className="text-sm text-slate-500">
                  No major missing skills.
                </span>
              ) : (
                analysis.missingSkills.map(
                  (skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-red-400/10 px-3 py-2 text-xs text-red-300"
                    >
                      + {skill}
                    </span>
                  )
                )
              )}
            </div>
          </div>
        </section>

        {/* SKILL BREAKDOWN */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0d1b2e] p-7">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                SKILL ANALYSIS
              </p>

              <h2 className="mt-2 text-2xl font-black">
                How well do you fit this role?
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your profile compared with the employer's
                required skills.
              </p>
            </div>

            <span className="text-sm text-slate-500">
              {totalSkills} required skills
            </span>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {/* MATCHED */}

            <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-5">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-emerald-300">
                  Ready
                </span>

                <span className="text-sm font-black">
                  {matchedPercentage}%
                </span>
              </div>

              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{
                    width: `${matchedPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-600">
                Skills meeting the target proficiency.
              </p>
            </div>

            {/* IMPROVING */}

            <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-5">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-yellow-300">
                  Improve
                </span>

                <span className="text-sm font-black">
                  {improvingPercentage}%
                </span>
              </div>

              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{
                    width: `${improvingPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-600">
                Skills you have but need to strengthen.
              </p>
            </div>

            {/* MISSING */}

            <div className="rounded-2xl border border-red-400/10 bg-red-400/5 p-5">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-red-300">
                  Learn
                </span>

                <span className="text-sm font-black">
                  {missingPercentage}%
                </span>
              </div>

              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{
                    width: `${missingPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-600">
                Skills not yet present in your profile.
              </p>
            </div>
          </div>
        </section>

        {/* ALL REQUIRED SKILLS */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0d1b2e] p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            ROLE REQUIREMENTS
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Required Skills
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(job.required_skills || []).map(
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
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <span className="text-sm font-semibold">
                      {skill}
                    </span>

                    {matched ? (
                      <span className="text-xs font-bold text-emerald-400">
                        ✓ Ready
                      </span>
                    ) : improving ? (
                      <span className="text-xs font-bold text-yellow-400">
                        ↗ Improve
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-400">
                        + Learn
                      </span>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* CTA */}

        <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-cyan-400/5 p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            SMART CAREER DECISION
          </p>

          <h2 className="mt-3 text-2xl font-black md:text-3xl">
            {matchPercentage >= 70
              ? "You're ready to make your move."
              : "Build the skills needed for your next opportunity."}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            SkillTrack doesn't just show job openings — it
            helps you understand exactly how your current skills
            compare with the opportunity.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/recommendations"
              className="rounded-xl bg-purple-400 px-6 py-3 text-sm font-bold text-slate-950"
            >
              View Career Recommendations
            </Link>

            <Link
              href="/skill-gap"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold"
            >
              Analyze Skill Gap
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}