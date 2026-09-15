"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import {
  calculateSkillGap,
  UserSkill,
} from "../../lib/skillGap";
import TopNav from "../../components/TopNav";

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
  skills: UserSkill[] | string[] | null;
};

type AnalyzedJob = Job & {
  matchPercentage: number;
  matchedSkills: string[];
  improvingSkills: string[];
  missingSkills: string[];
};

function normalizeSkills(
  skills: UserSkill[] | string[] | null
): UserSkill[] {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill) => {
      if (typeof skill === "string") {
        return {
          name: skill,
          level: 70,
        };
      }

      return {
        name:
          typeof skill.name === "string"
            ? skill.name
            : "",
        level: Math.max(
          0,
          Math.min(
            100,
            Number(skill.level) || 0
          )
        ),
      };
    })
    .filter(
      (skill) => skill.name.trim().length > 0
    );
}

export default function SkillGapPage() {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userName, setUserName] =
    useState("SkillTrack User");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("full_name, skills")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error(
            profileError.message
          );
        }

        const profile =
          profileData as Profile | null;

        setUserName(
          profile?.full_name ||
            user.email?.split("@")[0] ||
            "SkillTrack User"
        );

        setSkills(
          normalizeSkills(
            profile?.skills || []
          )
        );

        const {
          data: jobsData,
          error: jobsError,
        } = await supabase
          .from("jobs")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

        if (jobsError) {
          throw new Error(
            jobsError.message
          );
        }

        setJobs(
          (jobsData || []) as Job[]
        );
      } catch (err) {
        console.error(
          "Skill gap loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load skill gap data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const analyzedJobs =
    useMemo<AnalyzedJob[]>(() => {
      return jobs.map((job) => {
        const result =
          calculateSkillGap(
            skills,
            job.required_skills || []
          );

        return {
          ...job,
          matchPercentage:
            result.matchPercentage,
          matchedSkills:
            result.matchedSkills,
          improvingSkills:
            result.improvingSkills,
          missingSkills:
            result.missingSkills,
        };
      });
    }, [jobs, skills]);

  const marketSkills = useMemo(() => {
    const skillMap =
      new Map<string, number>();

    analyzedJobs.forEach((job) => {
      (job.required_skills || []).forEach(
        (skill) => {
          const cleanSkill =
            skill.trim();

          if (!cleanSkill) {
            return;
          }

          const key =
            cleanSkill.toLowerCase();

          skillMap.set(
            key,
            (skillMap.get(key) || 0) + 1
          );
        }
      );
    });

    return Array.from(
      skillMap.entries()
    )
      .map(([key, count]) => ({
        name: key,
        count,
      }))
      .sort(
        (a, b) =>
          b.count - a.count
      );
  }, [analyzedJobs]);

  const strongSkills = useMemo(() => {
    return [...skills]
      .filter(
        (skill) => skill.level >= 70
      )
      .sort(
        (a, b) =>
          b.level - a.level
      );
  }, [skills]);

  const improvingSkills = useMemo(() => {
    return [...skills]
      .filter(
        (skill) =>
          skill.level >= 40 &&
          skill.level < 70
      )
      .sort(
        (a, b) =>
          b.level - a.level
      );
  }, [skills]);

  const priorityGaps = useMemo(() => {
    const userSkillMap =
      new Map<string, number>();

    skills.forEach((skill) => {
      userSkillMap.set(
        skill.name
          .trim()
          .toLowerCase(),
        skill.level
      );
    });

    return marketSkills
      .map((marketSkill) => {
        const level =
          userSkillMap.get(
            marketSkill.name
          ) ?? 0;

        return {
          ...marketSkill,
          level,
        };
      })
      .filter(
        (skill) => skill.level < 70
      )
      .slice(0, 8);
  }, [marketSkills, skills]);

  const bestJobs = useMemo(() => {
    return [...analyzedJobs]
      .sort(
        (a, b) =>
          b.matchPercentage -
          a.matchPercentage
      )
      .slice(0, 6);
  }, [analyzedJobs]);

  const readinessScore = useMemo(() => {
    if (analyzedJobs.length === 0) {
      if (skills.length === 0) {
        return 0;
      }

      const average =
        skills.reduce(
          (sum, skill) =>
            sum + skill.level,
          0
        ) / skills.length;

      return Math.round(average);
    }

    const total =
      analyzedJobs.reduce(
        (sum, job) =>
          sum + job.matchPercentage,
        0
      );

    return Math.round(
      total / analyzedJobs.length
    );
  }, [analyzedJobs, skills]);

  const averageSkillLevel =
    useMemo(() => {
      if (skills.length === 0) {
        return 0;
      }

      const total =
        skills.reduce(
          (sum, skill) =>
            sum + skill.level,
          0
        );

      return Math.round(
        total / skills.length
      );
    }, [skills]);

  const strongPercentage =
    skills.length === 0
      ? 0
      : Math.round(
          (strongSkills.length /
            skills.length) *
            100
        );

  function getReadinessLabel(
    score: number
  ) {
    if (score >= 85) {
      return "Excellent";
    }

    if (score >= 70) {
      return "Job Ready";
    }

    if (score >= 50) {
      return "Developing";
    }

    return "Needs Improvement";
  }

  function getMatchClass(
    percentage: number
  ) {
    if (percentage >= 85) {
      return "text-teal-300 bg-teal-500/10 border-teal-500/20";
    }

    if (percentage >= 70) {
      return "text-blue-300 bg-blue-600/10 border-blue-600/20";
    }

    if (percentage >= 50) {
      return "text-yellow-300 bg-yellow-400/10 border-yellow-400/20";
    }

    return "text-red-300 bg-red-400/10 border-red-400/20";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1F3A] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600/20 border-t-cyan-400" />

          <p className="mt-5 text-sm text-slate-400">
            Analyzing your skill profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      {/* SHARED RESPONSIVE NAVBAR */}
      <TopNav />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* HEADER */}
        <section>
          <Link
            href="/"
            className="text-sm font-semibold text-blue-400 transition hover:text-cyan-300"
          >
            &larr; Back to Dashboard
          </Link>

          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
              SKILL INTELLIGENCE
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Your Skill Gap Analysis
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Hi {userName}. Here's how your current
              skill profile compares with the technology
              job market.
            </p>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* READINESS */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-blue-600/20 bg-gradient-to-br from-cyan-400/10 via-[#0d1b2e] to-purple-500/10 p-5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-center">
            {/* SCORE */}
            <div className="flex flex-col items-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-full border-[12px] border-blue-600/15 bg-blue-600/5 sm:h-52 sm:w-52">
                <div className="text-center">
                  <p className="text-5xl font-black text-blue-400 sm:text-6xl">
                    {readinessScore}%
                  </p>

                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Readiness
                  </p>
                </div>
              </div>

              <p className="mt-5 text-lg font-black">
                {getReadinessLabel(
                  readinessScore
                )}
              </p>
            </div>

            {/* CONTENT */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                CAREER READINESS
              </p>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                How prepared are you for today's jobs?
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Your readiness score is based on your current
                proficiency levels and how well your skills
                match the requirements of available jobs.
              </p>

              <div className="mt-7">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-500">
                    Overall readiness
                  </span>

                  <span className="font-bold text-blue-400">
                    {readinessScore}%
                  </span>
                </div>

                <div className="h-4 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 transition-all duration-700"
                    style={{
                      width: `${readinessScore}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <p className="text-2xl font-black text-blue-400">
                    {skills.length}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Total Skills
                  </p>
                </div>

                <div className="rounded-xl bg-white/[0.03] p-4">
                  <p className="text-2xl font-black text-teal-400">
                    {strongSkills.length}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Strong Skills
                  </p>
                </div>

                <div className="rounded-xl bg-white/[0.03] p-4">
                  <p className="text-2xl font-black text-purple-300">
                    {averageSkillLevel}%
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Average Level
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-400/10 bg-[#163456] p-6">
            <p className="text-sm text-slate-400">
              Strong Skills
            </p>

            <p className="mt-3 text-4xl font-black text-teal-400">
              {strongSkills.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {strongPercentage}% of your profile
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/10 bg-[#163456] p-6">
            <p className="text-sm text-slate-400">
              Improve
            </p>

            <p className="mt-3 text-4xl font-black text-yellow-400">
              {improvingSkills.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Skills to strengthen
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/10 bg-[#163456] p-6">
            <p className="text-sm text-slate-400">
              Priority Gaps
            </p>

            <p className="mt-3 text-4xl font-black text-red-400">
              {priorityGaps.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Market-demanded skills
            </p>
          </div>

          <div className="rounded-2xl border border-blue-600/10 bg-[#163456] p-6">
            <p className="text-sm text-slate-400">
              Jobs Analyzed
            </p>

            <p className="mt-3 text-4xl font-black text-blue-400">
              {jobs.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Opportunities checked
            </p>
          </div>
        </section>

        {/* STRONG SKILLS */}
        <section className="mt-6 rounded-3xl border border-emerald-400/10 bg-[#163456] p-5 sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
              YOUR ADVANTAGE
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Strongest Skills
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              These are the skills where your current
              proficiency is strongest.
            </p>
          </div>

          {strongSkills.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <p className="font-bold">
                No strong skills yet.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Build your proficiency to 70% or higher.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {strongSkills.map(
                (skill) => (
                  <div
                    key={skill.name}
                    className="rounded-2xl border border-emerald-400/10 bg-teal-500/5 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-bold">
                        {skill.name}
                      </p>

                      <span className="shrink-0 text-lg font-black text-teal-300">
                        {skill.level}%
                      </span>
                    </div>

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{
                          width: `${skill.level}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-xs text-teal-400">
                      Strong proficiency
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* DEVELOPMENT */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* IMPROVING */}
          <div className="rounded-3xl border border-yellow-400/10 bg-[#163456] p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
              DEVELOPMENT
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Skills To Improve
            </h2>

            <div className="mt-6 space-y-4">
              {improvingSkills.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-slate-500">
                  No intermediate skills found.
                </div>
              ) : (
                improvingSkills.map(
                  (skill) => (
                    <div
                      key={skill.name}
                      className="rounded-2xl bg-yellow-400/5 p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold">
                          {skill.name}
                        </span>

                        <span className="font-black text-yellow-300">
                          {skill.level}%
                        </span>
                      </div>

                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-yellow-400"
                          style={{
                            width: `${skill.level}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Raise this toward 70%+ for stronger
                        job compatibility.
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {/* PRIORITY GAPS */}
          <div className="rounded-3xl border border-red-400/10 bg-[#163456] p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              MARKET GAP
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Priority Skills To Learn
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Skills frequently requested across your available
              job market that need development.
            </p>

            <div className="mt-6 space-y-3">
              {priorityGaps.length === 0 ? (
                <div className="rounded-xl border border-emerald-400/10 bg-teal-500/5 p-6 text-sm text-teal-300">
                  No major market skill gaps detected.
                </div>
              ) : (
                priorityGaps.map(
                  (skill, index) => (
                    <div
                      key={skill.name}
                      className="flex items-center gap-4 rounded-xl bg-red-400/5 p-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-400/10 text-sm font-black text-red-300">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold capitalize">
                          {skill.name}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                          Appears in {skill.count} job
                          {skill.count === 1
                            ? ""
                            : "s"} &middot; Current level{" "}
                          {skill.level}%
                        </p>
                      </div>

                      <span className="shrink-0 text-xs font-black text-red-400">
                        LEARN
                      </span>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </section>

        {/* BEST JOB MATCHES */}
        <section className="mt-6 rounded-3xl border border-blue-600/10 bg-[#163456] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                OPPORTUNITY MATCH
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Best Matching Jobs
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                These opportunities currently have the strongest
                compatibility with your skills.
              </p>
            </div>

            <Link
              href="/jobs"
              className="text-sm font-bold text-blue-400 hover:text-cyan-300"
            >
              View All Jobs &rarr;
            </Link>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bestJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-sm text-slate-500 md:col-span-2 lg:col-span-3">
                No jobs available for analysis.
              </div>
            ) : (
              bestJobs.map(
                (job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-blue-500/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          {job.company}
                        </p>

                        <h3 className="mt-2 line-clamp-2 font-black">
                          {job.title}
                        </h3>

                        <p className="mt-2 text-[11px] text-slate-500">
                          Location:{" "}
                          {job.location ||
                            "India"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-xl border px-3 py-2 text-center ${getMatchClass(
                          job.matchPercentage
                        )}`}
                      >
                        <span className="block text-lg font-black">
                          {job.matchPercentage}%
                        </span>

                        <span className="text-[8px] font-bold uppercase">
                          Match
                        </span>
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {job.matchedSkills
                        .slice(0, 3)
                        .map(
                          (skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-teal-500/10 px-2.5 py-1.5 text-[10px] text-teal-300"
                            >
                              {skill}
                            </span>
                          )
                        )}

                      {job.missingSkills
                        .slice(0, 2)
                        .map(
                          (skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-red-400/10 px-2.5 py-1.5 text-[10px] text-red-300"
                            >
                              + {skill}
                            </span>
                          )
                        )}
                    </div>

                    <p className="mt-5 text-xs font-bold text-slate-500 transition group-hover:text-blue-400">
                      Analyze this job &rarr;
                    </p>
                  </Link>
                )
              )
            )}
          </div>
        </section>

        {/* LEARNING ROADMAP */}
        <section className="mt-6 rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 via-[#0d1b2e] to-cyan-400/10 p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
            PERSONALIZED ROADMAP
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Your Next Skill Moves
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Follow this simple progression to improve your
            employability.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {/* STEP 1 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-sm font-black text-red-300">
                01
              </div>

              <h3 className="mt-5 text-lg font-black">
                Close Priority Gaps
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Start with the most frequently requested skills
                that are missing from your profile.
              </p>

              {priorityGaps[0] && (
                <div className="mt-5 rounded-xl bg-red-400/5 p-4">
                  <p className="text-xs text-slate-500">
                    First priority
                  </p>

                  <p className="mt-1 font-bold text-red-300 capitalize">
                    {priorityGaps[0].name}
                  </p>
                </div>
              )}
            </div>

            {/* STEP 2 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-sm font-black text-yellow-300">
                02
              </div>

              <h3 className="mt-5 text-lg font-black">
                Strengthen Existing Skills
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Move intermediate skills toward advanced
                proficiency to increase your job match score.
              </p>

              {improvingSkills[0] && (
                <div className="mt-5 rounded-xl bg-yellow-400/5 p-4">
                  <p className="text-xs text-slate-500">
                    Focus skill
                  </p>

                  <p className="mt-1 font-bold text-yellow-300">
                    {improvingSkills[0].name} -{" "}
                    {improvingSkills[0].level}%
                  </p>
                </div>
              )}
            </div>

            {/* STEP 3 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-sm font-black text-teal-300">
                03
              </div>

              <h3 className="mt-5 text-lg font-black">
                Apply to Strong Matches
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Focus your job search on opportunities where
                your current profile already has strong
                compatibility.
              </p>

              {bestJobs[0] && (
                <div className="mt-5 rounded-xl bg-teal-500/5 p-4">
                  <p className="text-xs text-slate-500">
                    Best opportunity
                  </p>

                  <p className="mt-1 font-bold text-teal-300">
                    {bestJobs[0].title}
                  </p>

                  <p className="mt-1 text-xs text-teal-400">
                    {bestJobs[0].matchPercentage}%
                    match
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-6 rounded-3xl border border-blue-600/20 bg-blue-600/5 p-6 text-center sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            TAKE ACTION
          </p>

          <h2 className="mt-3 text-2xl font-black sm:text-3xl">
            Turn your skill gaps into career opportunities.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Update your skills, improve your weak areas and
            explore jobs where you already have a strong match.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/skills"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-500"
            >
              Update My Skills
            </Link>

            <Link
              href="/jobs"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold transition hover:bg-white/10"
            >
              Explore Matching Jobs
            </Link>

            <Link
              href="/recommendations"
              className="rounded-xl bg-purple-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-purple-300"
            >
              AI Career Recommendations
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}