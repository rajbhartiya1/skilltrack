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
  description?: string | null;
  location: string | null;
};

type Profile = {
  full_name: string | null;
  skills: UserSkill[] | null;
};

type Recommendation = Job & {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  improvingSkills: string[];
  analysis: SkillGapResult;
};

export default function RecommendationsPage() {
  const [userName, setUserName] = useState("SkillTrack User");
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCareer, setSelectedCareer] =
    useState<Recommendation | null>(null);

  async function loadRecommendations() {
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

      const userSkills = Array.isArray(profileData?.skills)
        ? profileData.skills
        : [];

      setSkills(userSkills);

      const jobsData = await getJobs();

      setJobs(jobsData as Job[]);
    } catch (error) {
      console.error(
        "Recommendation loading error:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRecommendations();
  }, []);

  const recommendations = useMemo<Recommendation[]>(() => {
    return jobs
      .map((job) => {
        const analysis = calculateSkillGap(
          skills,
          job.required_skills || []
        );

        return {
          ...job,
          matchPercentage: analysis.matchPercentage,
          matchedSkills: analysis.matchedSkills,
          missingSkills: analysis.missingSkills,
          improvingSkills: analysis.improvingSkills,
          analysis,
        };
      })
      .sort(
        (a, b) =>
          b.matchPercentage - a.matchPercentage
      );
  }, [jobs, skills]);

  const bestCareer = recommendations[0];

  const alternativeCareers = recommendations.slice(1, 7);

  const overallReadiness = useMemo(() => {
    if (recommendations.length === 0) {
      return 0;
    }

    const topJobs = recommendations.slice(0, 10);

    const total = topJobs.reduce(
      (sum, job) => sum + job.matchPercentage,
      0
    );

    return Math.round(total / topJobs.length);
  }, [recommendations]);

  const strongSkills = useMemo(() => {
    return [...skills]
      .filter(
        (skill) =>
          typeof skill.name === "string" &&
          Number(skill.level) >= 70
      )
      .sort(
        (a, b) =>
          Number(b.level) - Number(a.level)
      );
  }, [skills]);

  const improvingSkills = useMemo(() => {
    return [...skills]
      .filter(
        (skill) =>
          typeof skill.name === "string" &&
          Number(skill.level) > 0 &&
          Number(skill.level) < 70
      )
      .sort(
        (a, b) =>
          Number(b.level) - Number(a.level)
      );
  }, [skills]);

  const skillRecommendations = useMemo(() => {
    const frequency = new Map<string, number>();

    recommendations
      .slice(0, 12)
      .forEach((job) => {
        job.missingSkills.forEach((skill) => {
          frequency.set(
            skill,
            (frequency.get(skill) || 0) + 2
          );
        });

        job.improvingSkills.forEach((skill) => {
          frequency.set(
            skill,
            (frequency.get(skill) || 0) + 1
          );
        });
      });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([skill, score]) => ({
        skill,
        score,
      }));
  }, [recommendations]);

  const careerInsights = useMemo(() => {
    if (!bestCareer) {
      return [
        "Add skills to your profile to unlock personalized career insights.",
      ];
    }

    const insights: string[] = [];

    if (bestCareer.matchPercentage >= 80) {
      insights.push(
        `You already have a strong skill alignment with ${bestCareer.title}.`
      );
    } else if (bestCareer.matchPercentage >= 60) {
      insights.push(
        `You have a good foundation for ${bestCareer.title}, but a few skills need improvement.`
      );
    } else {
      insights.push(
        `You are building towards ${bestCareer.title}; improving your priority gaps can significantly increase your match.`
      );
    }

    if (bestCareer.matchedSkills.length > 0) {
      insights.push(
        `${bestCareer.matchedSkills.length} required skills already meet the target proficiency level.`
      );
    }

    if (bestCareer.improvingSkills.length > 0) {
      insights.push(
        `Focus on improving ${bestCareer.improvingSkills
          .slice(0, 2)
          .join(" and ")} to strengthen your profile.`
      );
    }

    if (bestCareer.missingSkills.length > 0) {
      insights.push(
        `Learning ${bestCareer.missingSkills
          .slice(0, 2)
          .join(" and ")} can unlock additional opportunities.`
      );
    }

    return insights;
  }, [bestCareer]);

  const getMatchLabel = (percentage: number) => {
    if (percentage >= 85) {
      return "Excellent Fit";
    }

    if (percentage >= 70) {
      return "Strong Fit";
    }

    if (percentage >= 50) {
      return "Potential Fit";
    }

    return "Needs Development";
  };

  const getMatchClass = (percentage: number) => {
    if (percentage >= 85) {
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    }

    if (percentage >= 70) {
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
    }

    if (percentage >= 50) {
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    }

    return "border-red-400/30 bg-red-400/10 text-red-300";
  };

  const getReadinessLabel = (value: number) => {
    if (value >= 85) return "Career Ready";
    if (value >= 70) return "Almost Ready";
    if (value >= 50) return "Building Skills";
    return "Early Stage";
  };

  async function handleRefresh() {
    setRefreshing(true);
    await loadRecommendations();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />

          <p className="mt-5 text-slate-400">
            AI is analyzing your career profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Skill<span className="text-cyan-400">Track</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
            <Link
              href="/"
              className="transition hover:text-cyan-400"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="transition hover:text-cyan-400"
            >
              Profile
            </Link>

            <Link
              href="/jobs"
              className="transition hover:text-cyan-400"
            >
              Jobs
            </Link>

            <Link
              href="/skill-gap"
              className="transition hover:text-cyan-400"
            >
              Skill Gap
            </Link>

            <Link
              href="/recommendations"
              className="font-bold text-cyan-400"
            >
              AI Career
            </Link>

            <Link
              href="/applications"
              className="transition hover:text-cyan-400"
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
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-500/15 via-[#0d1b2e] to-cyan-400/10 p-8 md:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-xs font-bold tracking-wider text-purple-300">
                🤖 SKILLTRACK CAREER INTELLIGENCE
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                Discover Your
                <span className="text-cyan-400">
                  {" "}Best Career Path
                </span>
              </h1>

              <p className="mt-5 text-base leading-7 text-slate-400">
                SkillTrack analyzes your skills, proficiency levels,
                and job requirements to identify career opportunities
                that fit your current profile.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-purple-400/20 bg-purple-400/5">
                <div className="text-center">
                  <p className="text-4xl font-black text-purple-300">
                    {overallReadiness}%
                  </p>

                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                    Readiness
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-300">
                {getReadinessLabel(overallReadiness)}
              </p>
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Skills Analyzed
            </p>

            <p className="mt-3 text-4xl font-black">
              {skills.length}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              From your profile
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Strong Skills
            </p>

            <p className="mt-3 text-4xl font-black text-emerald-400">
              {strongSkills.length}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              70%+ proficiency
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Skills Improving
            </p>

            <p className="mt-3 text-4xl font-black text-yellow-400">
              {improvingSkills.length}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Below target level
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Jobs Compared
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-400">
              {jobs.length}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Available opportunities
            </p>
          </div>
        </section>

        {/* BEST CAREER */}
        {bestCareer ? (
          <section className="mt-8 overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#0d1b2e]">
            <div className="border-b border-white/10 bg-gradient-to-r from-cyan-400/10 to-transparent p-7">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                    #1 CAREER RECOMMENDATION
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    {bestCareer.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {bestCareer.company} •{" "}
                    {bestCareer.location || "India"}
                  </p>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  {refreshing
                    ? "Analyzing..."
                    : "↻ Refresh Analysis"}
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3">
              {/* Score */}
              <div className="border-b border-white/10 p-7 text-center lg:border-b-0 lg:border-r">
                <p className="text-sm text-slate-500">
                  Compatibility Score
                </p>

                <div className="mx-auto mt-6 flex h-48 w-48 items-center justify-center rounded-full border-[12px] border-cyan-400/10">
                  <div>
                    <p className="text-5xl font-black text-cyan-400">
                      {bestCareer.matchPercentage}%
                    </p>

                    <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {getMatchLabel(
                        bestCareer.matchPercentage
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all"
                    style={{
                      width: `${bestCareer.matchPercentage}%`,
                    }}
                  />
                </div>
              </div>

              {/* Skill Breakdown */}
              <div className="border-b border-white/10 p-7 lg:border-b-0 lg:border-r">
                <h3 className="text-lg font-bold">
                  Skill Breakdown
                </h3>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        Matched
                      </span>

                      <span className="font-bold text-emerald-400">
                        {bestCareer.matchedSkills.length}
                      </span>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{
                          width: `${Math.min(
                            100,
                            bestCareer.matchedSkills.length /
                              Math.max(
                                1,
                                bestCareer.required_skills
                                  ?.length || 1
                              ) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        Improving
                      </span>

                      <span className="font-bold text-yellow-400">
                        {bestCareer.improvingSkills.length}
                      </span>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-yellow-400"
                        style={{
                          width: `${Math.min(
                            100,
                            bestCareer.improvingSkills.length /
                              Math.max(
                                1,
                                bestCareer.required_skills
                                  ?.length || 1
                              ) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        Missing
                      </span>

                      <span className="font-bold text-red-400">
                        {bestCareer.missingSkills.length}
                      </span>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-red-400"
                        style={{
                          width: `${Math.min(
                            100,
                            bestCareer.missingSkills.length /
                              Math.max(
                                1,
                                bestCareer.required_skills
                                  ?.length || 1
                              ) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insight */}
              <div className="p-7">
                <h3 className="text-lg font-bold">
                  Career Intelligence 🧠
                </h3>

                <div className="mt-5 space-y-4">
                  {careerInsights.map(
                    (insight, index) => (
                      <div
                        key={index}
                        className="flex gap-3"
                      >
                        <span className="mt-0.5 text-cyan-400">
                          ✦
                        </span>

                        <p className="text-sm leading-6 text-slate-400">
                          {insight}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="border-t border-white/10 p-7">
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Your Strengths
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {bestCareer.matchedSkills.length === 0 ? (
                      <span className="text-sm text-slate-500">
                        No direct matches yet.
                      </span>
                    ) : (
                      bestCareer.matchedSkills.map(
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

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                    Improve
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {bestCareer.improvingSkills.length === 0 ? (
                      <span className="text-sm text-slate-500">
                        Nothing urgent.
                      </span>
                    ) : (
                      bestCareer.improvingSkills.map(
                        (skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-yellow-400/10 px-3 py-2 text-xs text-yellow-300"
                          >
                            ↗ {skill}
                          </span>
                        )
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-400">
                    Skill Gaps
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {bestCareer.missingSkills.length === 0 ? (
                      <span className="text-sm text-slate-500">
                        No major gaps.
                      </span>
                    ) : (
                      bestCareer.missingSkills.map(
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
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-white/10 bg-[#0d1b2e] p-10 text-center">
            <div className="text-5xl">🧠</div>

            <h2 className="mt-5 text-2xl font-black">
              Build your career profile
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              Add skills and proficiency levels to your profile
              before generating personalized career recommendations.
            </p>

            <Link
              href="/profile"
              className="mt-6 inline-block rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950"
            >
              Update Profile →
            </Link>
          </section>
        )}

        {/* LEARN NEXT */}
        <section className="mt-6 rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-[#0d1b2e] p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                PERSONALIZED LEARNING PLAN
              </p>

              <h2 className="mt-2 text-2xl font-black">
                What should you learn next? 🎯
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Skills with the highest potential to improve your
                job compatibility.
              </p>
            </div>

            <Link
              href="/profile"
              className="text-sm font-semibold text-purple-300 hover:text-purple-200"
            >
              Update Skills →
            </Link>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {skillRecommendations.length === 0 ? (
              <div className="rounded-xl bg-white/[0.03] p-6 text-sm text-slate-500 md:col-span-3">
                Add more skills and we will generate your learning
                priorities.
              </div>
            ) : (
              skillRecommendations
                .slice(0, 3)
                .map((item, index) => (
                  <div
                    key={item.skill}
                    className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-400/10 text-lg font-black text-purple-300">
                        {index + 1}
                      </div>

                      <span className="rounded-full bg-purple-400/10 px-3 py-1 text-[10px] font-bold uppercase text-purple-300">
                        High Impact
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold">
                      {item.skill}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Appears frequently in your strongest career
                      opportunities.
                    </p>

                    <div className="mt-5 h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-purple-400"
                        style={{
                          width: `${Math.min(
                            100,
                            item.score * 20
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>

        {/* TOP CAREERS */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0d1b2e] p-7">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                CAREER OPTIONS
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Your Top Career Matches 💼
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Ranked from strongest to weakest compatibility.
              </p>
            </div>

            <Link
              href="/jobs"
              className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Explore All Jobs →
            </Link>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {alternativeCareers.map(
              (career, index) => (
                <button
                  key={career.id}
                  onClick={() =>
                    setSelectedCareer(career)
                  }
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 font-black text-cyan-400">
                      #{index + 2}
                    </div>

                    <span
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${getMatchClass(
                        career.matchPercentage
                      )}`}
                    >
                      {career.matchPercentage}%
                    </span>
                  </div>

                  <p className="mt-5 text-xs font-semibold text-cyan-400">
                    {career.company}
                  </p>

                  <h3 className="mt-1 text-lg font-bold group-hover:text-cyan-300">
                    {career.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-600">
                    📍 {career.location || "India"}
                  </p>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{
                        width: `${career.matchPercentage}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {career.matchedSkills
                      .slice(0, 3)
                      .map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                  </div>

                  <p className="mt-5 text-xs font-semibold text-slate-600 group-hover:text-cyan-400">
                    Click to analyze →
                  </p>
                </button>
              )
            )}
          </div>
        </section>

        {/* YOUR SKILL PROFILE */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0d1b2e] p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                YOUR PROFILE
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Skill Strength
              </h2>
            </div>

            <Link
              href="/profile"
              className="text-sm font-semibold text-cyan-400"
            >
              Manage →
            </Link>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {skills.length === 0 ? (
              <p className="text-sm text-slate-500 md:col-span-2">
                No skills found. Add skills from your profile.
              </p>
            ) : (
              skills
                .slice()
                .sort(
                  (a, b) =>
                    Number(b.level) -
                    Number(a.level)
                )
                .slice(0, 10)
                .map((skill) => (
                  <div key={skill.name}>
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-semibold">
                        {skill.name}
                      </span>

                      <span className="text-xs text-slate-500">
                        {Number(skill.level)}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${
                          Number(skill.level) >= 70
                            ? "bg-emerald-400"
                            : "bg-yellow-400"
                        }`}
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              Number(skill.level)
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-cyan-400/5 p-7 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
            READY FOR YOUR NEXT STEP?
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Turn your skill gaps into career opportunities.
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
            Improve your priority skills, explore matching jobs,
            and track your applications — all from SkillTrack.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/jobs"
              className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Find Matching Jobs
            </Link>

            <Link
              href="/skill-gap"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Analyze Skill Gap
            </Link>
          </div>
        </section>
      </div>

      {/* CAREER DETAIL MODAL */}
      {selectedCareer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0d1b2e] p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                  CAREER ANALYSIS
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {selectedCareer.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedCareer.company} •{" "}
                  {selectedCareer.location || "India"}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedCareer(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-7 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6 text-center">
              <p className="text-sm text-slate-500">
                Compatibility
              </p>

              <p className="mt-2 text-5xl font-black text-cyan-400">
                {selectedCareer.matchPercentage}%
              </p>

              <p className="mt-2 text-sm text-slate-400">
                {getMatchLabel(
                  selectedCareer.matchPercentage
                )}
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <div className="rounded-xl bg-emerald-400/5 p-5">
                <p className="text-xs font-bold text-emerald-400">
                  MATCHED
                </p>

                <p className="mt-2 text-3xl font-black">
                  {selectedCareer.matchedSkills.length}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-400/5 p-5">
                <p className="text-xs font-bold text-yellow-400">
                  IMPROVE
                </p>

                <p className="mt-2 text-3xl font-black">
                  {selectedCareer.improvingSkills.length}
                </p>
              </div>

              <div className="rounded-xl bg-red-400/5 p-5">
                <p className="text-xs font-bold text-red-400">
                  MISSING
                </p>

                <p className="mt-2 text-3xl font-black">
                  {selectedCareer.missingSkills.length}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-bold text-emerald-400">
                  Skills You Have
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCareer.matchedSkills.length === 0 ? (
                    <span className="text-sm text-slate-500">
                      No direct matches.
                    </span>
                  ) : (
                    selectedCareer.matchedSkills.map(
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

              <div>
                <p className="text-sm font-bold text-yellow-400">
                  Skills To Improve
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCareer.improvingSkills.length ===
                  0 ? (
                    <span className="text-sm text-slate-500">
                      No immediate improvement needed.
                    </span>
                  ) : (
                    selectedCareer.improvingSkills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-yellow-400/10 px-3 py-2 text-xs text-yellow-300"
                        >
                          ↗ {skill}
                        </span>
                      )
                    )
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-red-400">
                  Missing Skills
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCareer.missingSkills.length ===
                  0 ? (
                    <span className="text-sm text-slate-500">
                      No major missing skills.
                    </span>
                  ) : (
                    selectedCareer.missingSkills.map(
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
            </div>

            <div className="mt-7 flex gap-3">
              <Link
                href="/jobs"
                className="flex-1 rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-bold text-slate-950"
              >
                Explore Jobs
              </Link>

              <button
                onClick={() =>
                  setSelectedCareer(null)
                }
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}