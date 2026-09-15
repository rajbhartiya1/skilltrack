"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { getJobs } from "../lib/jobs";
import { getApplications } from "../lib/applications";
import TopNav from "../components/TopNav";
import {
  calculateSkillGap,
  UserSkill,
} from "../lib/skillGap";

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
  bio: string | null;
  skills: UserSkill[] | null;
};

type Application = {
  id: string;
  user_id: string;
  job_id: string;
  status: "Wishlist" | "Applied" | "Interview" | "Offer";
  applied_at: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    description: string | null;
  } | null;
};

type RecommendedJob = Job & {
  matchPercentage: number;
  matchedSkills: string[];
  improvingSkills: string[];
  missingSkills: string[];
};

const COLORS = {
  navy: "#0B1F3A",
  navySoft: "#10294A",
  navyCard: "#163456",
  blue: "#2563EB",
  blueLight: "#60A5FA",
  teal: "#14B8A6",
  tealLight: "#5EEAD4",
};

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("SkillTrack User");
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, bio, skills")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Profile loading error:",
          profileError.message
        );
      }

      const profileData = profile as Profile | null;

      if (profileData?.full_name?.trim()) {
        setUserName(profileData.full_name.trim());
      } else if (user.email) {
        setUserName(user.email.split("@")[0]);
      }

      if (Array.isArray(profileData?.skills)) {
        setSkills(profileData.skills);
      } else {
        setSkills([]);
      }

      const jobsData = await getJobs();
      setJobs((jobsData || []) as Job[]);

      const applicationsResult =
        await getApplications();

      if (applicationsResult.data) {
        setApplications(
          applicationsResult.data as Application[]
        );
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadDashboard();
    });
  }, [loadDashboard]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const recommendedJobs =
    useMemo<RecommendedJob[]>(() => {
      return jobs
        .map((job) => {
          const analysis = calculateSkillGap(
            skills,
            job.required_skills || []
          );

          return {
            ...job,
            matchPercentage:
              analysis.matchPercentage,
            matchedSkills:
              analysis.matchedSkills,
            improvingSkills:
              analysis.improvingSkills,
            missingSkills:
              analysis.missingSkills,
          };
        })
        .sort(
          (a, b) =>
            b.matchPercentage -
            a.matchPercentage
        );
    }, [jobs, skills]);

  const topJobs = recommendedJobs.slice(0, 3);

  const readiness = useMemo(() => {
    if (!recommendedJobs.length) {
      return 0;
    }

    const topJobsForReadiness =
      recommendedJobs.slice(0, 10);

    const total =
      topJobsForReadiness.reduce(
        (sum, job) =>
          sum + job.matchPercentage,
        0
      );

    return Math.round(
      total /
        topJobsForReadiness.length
    );
  }, [recommendedJobs]);

  const strongSkills = useMemo(() => {
    return [...skills]
      .filter(
        (skill) =>
          typeof skill.name === "string" &&
          Number(skill.level) >= 70
      )
      .sort(
        (a, b) =>
          Number(b.level) -
          Number(a.level)
      );
  }, [skills]);

  const improvingSkills =
    useMemo(() => {
      return [...skills]
        .filter(
          (skill) =>
            typeof skill.name === "string" &&
            Number(skill.level) > 0 &&
            Number(skill.level) < 70
        )
        .sort(
          (a, b) =>
            Number(b.level) -
            Number(a.level)
        );
    }, [skills]);

  const priorityGaps = useMemo(() => {
    const frequency =
      new Map<string, number>();

    recommendedJobs
      .slice(0, 15)
      .forEach((job) => {
        job.missingSkills.forEach(
          (skill) => {
            frequency.set(
              skill,
              (frequency.get(skill) || 0) + 2
            );
          }
        );

        job.improvingSkills.forEach(
          (skill) => {
            frequency.set(
              skill,
              (frequency.get(skill) || 0) + 1
            );
          }
        );
      });

    return Array.from(frequency.entries())
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 5)
      .map(([skill, score]) => ({
        skill,
        score,
      }));
  }, [recommendedJobs]);

  const applicationStats = {
    wishlist: applications.filter(
      (application) =>
        application.status === "Wishlist"
    ).length,

    applied: applications.filter(
      (application) =>
        application.status === "Applied"
    ).length,

    interview: applications.filter(
      (application) =>
        application.status === "Interview"
    ).length,

    offer: applications.filter(
      (application) =>
        application.status === "Offer"
    ).length,
  };

  const aiCareerInsight =
    useMemo(() => {
      if (!recommendedJobs[0]) {
        return {
          title: "Build your career profile",
          percentage: 0,
          message:
            "Add skills to your profile to unlock personalized career recommendations.",
        };
      }

      const best = recommendedJobs[0];

      if (best.matchPercentage >= 85) {
        return {
          title: best.title,
          percentage:
            best.matchPercentage,
          message:
            "Your current skill profile is highly aligned with this career path.",
        };
      }

      if (best.matchPercentage >= 70) {
        return {
          title: best.title,
          percentage:
            best.matchPercentage,
          message:
            "You have a strong foundation for this career. Improving a few skills can make you job-ready.",
        };
      }

      if (best.matchPercentage >= 50) {
        return {
          title: best.title,
          percentage:
            best.matchPercentage,
          message:
            "You have potential for this career. Focus on your priority skill gaps to improve your compatibility.",
        };
      }

      return {
        title: best.title,
        percentage:
          best.matchPercentage,
        message:
          "This could be a future career path for you. Start with the recommended skills and build your proficiency.",
      };
    }, [recommendedJobs]);

  function getReadinessLabel(value: number) {
    if (value >= 85) {
      return "Career Ready";
    }

    if (value >= 70) {
      return "Almost Ready";
    }

    if (value >= 50) {
      return "Building Skills";
    }

    return "Early Stage";
  }

  function getMatchClass(value: number) {
    if (value >= 85) {
      return "border-teal-400/30 bg-teal-400/10 text-teal-300";
    }

    if (value >= 70) {
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    }

    if (value >= 50) {
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    }

    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center text-white"
        style={{
          backgroundColor: COLORS.navy,
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-white/10"
            style={{
              borderTopColor: COLORS.blue,
            }}
          />

          <p className="mt-5 text-sm text-slate-300">
            Loading your SkillTrack dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen text-white"
      style={{
        backgroundColor: COLORS.navy,
      }}
    >
      <TopNav />
      <header
        className="hidden sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl"
        style={{
          backgroundColor:
            "rgba(11,31,58,0.96)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Skill
            <span
              style={{
                color: COLORS.blueLight,
              }}
            >
              Track
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm lg:flex">
            <Link
              href="/"
              className="font-semibold"
              style={{
                color: COLORS.blueLight,
              }}
            >
              Dashboard
            </Link>

            <Link
              href="/jobs"
              className="text-slate-300 transition hover:text-white"
            >
              Jobs
            </Link>

            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-2 py-3 text-slate-300 transition hover:text-white"
              >
                AI Career
                <span className="text-xs">
                  v
                </span>
              </button>

              <div className="pointer-events-none absolute left-1/2 top-full z-[100] w-80 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/10 bg-[#10294A] p-2 opacity-0 shadow-2xl transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                <Link
                  href="/ai-assistant"
                  className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
                >
                  <div className="font-semibold text-white">
                    AI Career Assistant
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Personalized career guidance
                  </div>
                </Link>

                <Link
                  href="/recommendations"
                  className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
                >
                  <div className="font-semibold text-white">
                    Career Recommendations
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Discover your best career paths
                  </div>
                </Link>

                <Link
                  href="/skill-gap"
                  className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
                >
                  <div className="font-semibold text-white">
                    Skill Gap Analysis
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Find missing and improving skills
                  </div>
                </Link>

                <Link
                  href="/career-coach"
                  className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
                >
                  <div className="font-semibold text-white">
                    Career Coach
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Build your career roadmap
                  </div>
                </Link>

                <Link
                  href="/resume-analyzer"
                  className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
                >
                  <div className="font-semibold text-white">
                    Resume Analyzer
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Check ATS and resume quality
                  </div>
                </Link>

                <Link
                  href="/interview-coach"
                  className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
                >
                  <div className="font-semibold text-white">
                    Interview Coach
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Practice role-based interviews
                  </div>
                </Link>
              </div>
            </div>

            <Link
              href="/applications"
              className="text-slate-300 transition hover:text-white"
            >
              Applications
            </Link>

            <Link
              href="/profile"
              className="text-slate-300 transition hover:text-white"
            >
              Profile
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50 sm:block"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <Link
              href="/profile"
              className="rounded-xl px-4 py-2 text-xs font-bold text-white"
              style={{
                backgroundColor:
                  "rgba(37,99,235,0.18)",
                border:
                  "1px solid rgba(37,99,235,0.4)",
              }}
            >
              {userName}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 p-8 md:p-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #10294A 0%, #0B1F3A 55%, #163456 100%)",
            }}
          />

          <div
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
            style={{
              backgroundColor:
                "rgba(37,99,235,0.18)",
            }}
          />

          <div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{
                  color: COLORS.blueLight,
                }}
              >
                PERSONAL CAREER DASHBOARD
              </p>

              <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                Welcome back,
                <span
                  className="block"
                  style={{
                    color: COLORS.blueLight,
                  }}
                >
                  {userName}
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Track your skills, discover matching
                opportunities, understand your skill gaps,
                and build a clearer path toward employment.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/recommendations"
                  className="rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                  style={{
                    backgroundColor:
                      COLORS.blue,
                  }}
                >
                  AI Career Analysis
                </Link>

                <Link
                  href="/jobs"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Explore Jobs
                </Link>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-center">
              <div
                className="flex h-44 w-44 items-center justify-center rounded-full border-[10px]"
                style={{
                  borderColor:
                    "rgba(20,184,166,0.25)",
                  backgroundColor:
                    "rgba(20,184,166,0.06)",
                }}
              >
                <div className="text-center">
                  <p
                    className="text-5xl font-black"
                    style={{
                      color: COLORS.tealLight,
                    }}
                  >
                    {readiness}%
                  </p>

                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Readiness
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-bold text-slate-200">
                {getReadinessLabel(
                  readiness
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#163456] p-6">
            <p className="text-sm text-slate-300">
              Job Readiness
            </p>

            <p
              className="mt-3 text-4xl font-black"
              style={{
                color: COLORS.blueLight,
              }}
            >
              {readiness}%
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${readiness}%`,
                  backgroundColor:
                    COLORS.blue,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#163456] p-6">
            <p className="text-sm text-slate-300">
              Your Skills
            </p>

            <p
              className="mt-3 text-4xl font-black"
              style={{
                color: COLORS.blueLight,
              }}
            >
              {skills.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Skills in your profile
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#163456] p-6">
            <p className="text-sm text-slate-300">
              Applications
            </p>

            <p
              className="mt-3 text-4xl font-black"
              style={{
                color: COLORS.tealLight,
              }}
            >
              {applications.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Jobs you are tracking
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#163456] p-6">
            <p className="text-sm text-slate-300">
              Available Jobs
            </p>

            <p
              className="mt-3 text-4xl font-black"
              style={{
                color: COLORS.tealLight,
              }}
            >
              {jobs.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Opportunities analyzed
            </p>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 p-7">
          <div
            className="absolute"
            aria-hidden="true"
          />

          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="flex gap-5">
              <div
                className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-black sm:flex"
                style={{
                  backgroundColor:
                    "rgba(37,99,235,0.12)",
                  color: COLORS.blueLight,
                }}
              >
                AI
              </div>

              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.2em]"
                  style={{
                    color: COLORS.blueLight,
                  }}
                >
                  AI CAREER INSIGHT
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {aiCareerInsight.title}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {aiCareerInsight.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-center">
                <p
                  className="text-3xl font-black"
                  style={{
                    color: COLORS.tealLight,
                  }}
                >
                  {aiCareerInsight.percentage}%
                </p>

                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                  Compatibility
                </p>
              </div>

              <Link
                href="/recommendations"
                className="rounded-xl px-5 py-3 text-sm font-bold text-white"
                style={{
                  backgroundColor:
                    COLORS.blue,
                }}
              >
                Full Analysis
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#163456] p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{
                    color: COLORS.blueLight,
                  }}
                >
                  SMART MATCHING
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Recommended Jobs
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Best matches based on your current skills.
                </p>
              </div>

              <Link
                href="/jobs"
                className="text-sm font-semibold"
                style={{
                  color: COLORS.blueLight,
                }}
              >
                View All
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {topJobs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center">
                  <p className="text-sm text-slate-400">
                    Add skills to your profile to receive
                    personalized job recommendations.
                  </p>

                  <Link
                    href="/profile"
                    className="mt-4 inline-block text-sm font-bold"
                    style={{
                      color: COLORS.blueLight,
                    }}
                  >
                    Add Skills
                  </Link>
                </div>
              ) : (
                topJobs.map(
                  (job, index) => (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-white/10 bg-[#10294A] p-5 transition"
                    >
                      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                        <div className="flex min-w-0 gap-4">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                            style={{
                              backgroundColor:
                                "rgba(37,99,235,0.12)",
                              color:
                                COLORS.blueLight,
                            }}
                          >
                            {index + 1}
                          </div>

                          <div className="min-w-0">
                            <p
                              className="text-xs font-semibold"
                              style={{
                                color:
                                  COLORS.blueLight,
                              }}
                            >
                              {job.company}
                            </p>

                            <h3 className="mt-1 text-lg font-bold">
                              {job.title}
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                              {job.location ||
                                "India"}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`shrink-0 rounded-xl border px-4 py-2 text-center ${getMatchClass(
                            job.matchPercentage
                          )}`}
                        >
                          <p className="text-xl font-black">
                            {job.matchPercentage}%
                          </p>

                          <p className="text-[9px] uppercase tracking-wider">
                            Match
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {job.matchedSkills
                          .slice(0, 4)
                          .map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg px-3 py-1.5 text-xs"
                              style={{
                                backgroundColor:
                                  "rgba(20,184,166,0.10)",
                                color:
                                  COLORS.tealLight,
                              }}
                            >
                              {skill}
                            </span>
                          ))}

                        {job.improvingSkills
                          .slice(0, 2)
                          .map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-yellow-400/10 px-3 py-1.5 text-xs text-yellow-300"
                            >
                              {skill}
                            </span>
                          ))}

                        {job.missingSkills
                          .slice(0, 2)
                          .map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-red-400/10 px-3 py-1.5 text-xs text-red-300"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>

                      <Link
                        href={`/jobs/${job.id}`}
                        className="mt-5 inline-block text-xs font-bold"
                        style={{
                          color:
                            COLORS.blueLight,
                        }}
                      >
                        View Job Details
                      </Link>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#163456] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{
                    color: COLORS.tealLight,
                  }}
                >
                  SKILL INTELLIGENCE
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Priority Gaps
                </h2>
              </div>

              <span
                className="rounded-xl px-3 py-2 text-xs font-bold"
                style={{
                  backgroundColor:
                    "rgba(20,184,166,0.10)",
                  color: COLORS.tealLight,
                }}
              >
                TOP 5
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Skills that can unlock more opportunities.
            </p>

            <div className="mt-6 space-y-3">
              {priorityGaps.length === 0 ? (
                <p className="rounded-xl bg-white/5 p-4 text-sm text-slate-400">
                  No major gaps detected.
                </p>
              ) : (
                priorityGaps.map(
                  ({ skill, score }, index) => (
                    <div
                      key={skill}
                      className="rounded-xl border border-white/10 bg-[#10294A] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                          style={{
                            backgroundColor:
                              "rgba(37,99,235,0.12)",
                            color:
                              COLORS.blueLight,
                          }}
                        >
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {skill}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-500">
                            Priority score: {score}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            <Link
              href="/skill-gap"
              className="mt-5 block rounded-xl border px-4 py-3 text-center text-sm font-bold"
              style={{
                borderColor:
                  "rgba(20,184,166,0.25)",
                backgroundColor:
                  "rgba(20,184,166,0.08)",
                color: COLORS.tealLight,
              }}
            >
              Analyze Skill Gaps
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#163456] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{
                    color: COLORS.blueLight,
                  }}
                >
                  SKILL PROFILE
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Your Skill Strength
                </h2>
              </div>

              <Link
                href="/profile"
                className="text-sm font-semibold"
                style={{
                  color:
                    COLORS.blueLight,
                }}
              >
                Manage
              </Link>
            </div>

            <div className="mt-7 space-y-5">
              {skills.length === 0 ? (
                <div className="rounded-xl bg-white/5 p-5 text-sm text-slate-400">
                  No skills added yet.
                </div>
              ) : (
                [...skills]
                  .sort(
                    (a, b) =>
                      Number(b.level) -
                      Number(a.level)
                  )
                  .slice(0, 6)
                  .map((skill) => {
                    const level = Math.max(
                      0,
                      Math.min(
                        100,
                        Number(skill.level)
                      )
                    );

                    return (
                      <div key={skill.name}>
                        <div className="mb-2 flex justify-between">
                          <span className="text-sm font-semibold">
                            {skill.name}
                          </span>

                          <span className="text-xs font-bold text-slate-400">
                            {level}%
                          </span>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${level}%`,
                              backgroundColor:
                                level >= 70
                                  ? COLORS.teal
                                  : "#EAB308",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor:
                    "rgba(20,184,166,0.08)",
                }}
              >
                <p className="text-xs text-slate-400">
                  Strong
                </p>

                <p
                  className="mt-1 text-2xl font-black"
                  style={{
                    color:
                      COLORS.tealLight,
                  }}
                >
                  {strongSkills.length}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-400/5 p-4">
                <p className="text-xs text-slate-400">
                  Improving
                </p>

                <p className="mt-1 text-2xl font-black text-yellow-300">
                  {improvingSkills.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#163456] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{
                    color:
                      COLORS.tealLight,
                  }}
                >
                  EMPLOYMENT TRACKER
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Application Pipeline
                </h2>
              </div>

              <Link
                href="/applications"
                className="text-sm font-semibold"
                style={{
                  color:
                    COLORS.blueLight,
                }}
              >
                Open
              </Link>
            </div>

            <div className="mt-7 space-y-4">
              <div
                className="flex items-center justify-between rounded-xl p-4"
                style={{
                  backgroundColor:
                    "rgba(37,99,235,0.08)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black"
                    style={{
                      backgroundColor:
                        "rgba(37,99,235,0.15)",
                      color:
                        COLORS.blueLight,
                    }}
                  >
                    W
                  </div>

                  <span className="text-sm font-semibold">
                    Wishlist
                  </span>
                </div>

                <span
                  className="text-xl font-black"
                  style={{
                    color:
                      COLORS.blueLight,
                  }}
                >
                  {applicationStats.wishlist}
                </span>
              </div>

              <div
                className="flex items-center justify-between rounded-xl p-4"
                style={{
                  backgroundColor:
                    "rgba(37,99,235,0.10)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black"
                    style={{
                      backgroundColor:
                        "rgba(37,99,235,0.18)",
                      color:
                        COLORS.blueLight,
                    }}
                  >
                    A
                  </div>

                  <span className="text-sm font-semibold">
                    Applied
                  </span>
                </div>

                <span
                  className="text-xl font-black"
                  style={{
                    color:
                      COLORS.blueLight,
                  }}
                >
                  {applicationStats.applied}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-yellow-400/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/10 text-xs font-black text-yellow-300">
                    I
                  </div>

                  <span className="text-sm font-semibold">
                    Interview
                  </span>
                </div>

                <span className="text-xl font-black text-yellow-300">
                  {applicationStats.interview}
                </span>
              </div>

              <div
                className="flex items-center justify-between rounded-xl p-4"
                style={{
                  backgroundColor:
                    "rgba(20,184,166,0.08)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black"
                    style={{
                      backgroundColor:
                        "rgba(20,184,166,0.14)",
                      color:
                        COLORS.tealLight,
                    }}
                  >
                    O
                  </div>

                  <span className="text-sm font-semibold">
                    Offer
                  </span>
                </div>

                <span
                  className="text-xl font-black"
                  style={{
                    color:
                      COLORS.tealLight,
                  }}
                >
                  {applicationStats.offer}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mt-6 overflow-hidden rounded-3xl border p-7 md:p-8"
          style={{
            borderColor:
              "rgba(37,99,235,0.25)",
            background:
              "linear-gradient(90deg, rgba(37,99,235,0.12), rgba(20,184,166,0.08))",
          }}
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{
                  color:
                    COLORS.blueLight,
                }}
              >
                YOUR NEXT MOVE
              </p>

              <h2 className="mt-3 text-2xl font-black md:text-3xl">
                Turn skill gaps into career opportunities.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Identify the skills employers need, improve
                your proficiency, discover matching jobs,
                and track applications from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/skill-gap"
                className="rounded-xl px-5 py-3 text-sm font-bold text-white"
                style={{
                  backgroundColor:
                    COLORS.blue,
                }}
              >
                Analyze Skills
              </Link>

              <Link
                href="/recommendations"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                AI Career
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-10 flex flex-col justify-between gap-4 border-t border-white/10 py-6 text-xs text-slate-500 sm:flex-row">
          <p>
            © 2026 SkillTrack - Skill Intelligence and Employment Tracking
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="text-left transition hover:text-red-300 sm:text-right"
          >
            Sign out
          </button>
        </footer>
      </div>
    </main>
  );
}

