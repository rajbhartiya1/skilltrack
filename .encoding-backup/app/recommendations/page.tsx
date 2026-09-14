"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { calculateSkillGap, UserSkill } from "../../lib/skillGap";

type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[] | null;
  description: string | null;
  location: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  skills: UserSkill[] | string[] | null;
  bio: string | null;
};

type CareerRecommendation = {
  title: string;
  score: number;
  jobs: Job[];
  requiredSkills: string[];
  matchedSkills: string[];
  improvingSkills: string[];
  missingSkills: string[];
  reasons: string[];
};

function normalizeSkills(
  skills: UserSkill[] | string[] | null | undefined
): UserSkill[] {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill) => {
      if (typeof skill === "string") {
        return {
          name: skill.trim(),
          level: 70,
        };
      }

      return {
        name: String(skill.name || "").trim(),
        level: Math.max(0, Math.min(100, Number(skill.level) || 0)),
      };
    })
    .filter((skill) => skill.name);
}

function getCareerCategory(title: string) {
  const name = title.toLowerCase();

  if (
    name.includes("frontend") ||
    name.includes("front-end") ||
    name.includes("web developer") ||
    name.includes("react")
  ) {
    return "Frontend Development";
  }

  if (
    name.includes("backend") ||
    name.includes("back-end") ||
    name.includes("node") ||
    name.includes("server")
  ) {
    return "Backend Development";
  }

  if (
    name.includes("full stack") ||
    name.includes("full-stack") ||
    name.includes("software developer") ||
    name.includes("software engineer")
  ) {
    return "Full Stack & Software Development";
  }

  if (
    name.includes("data analyst") ||
    name.includes("business intelligence") ||
    name.includes("bi developer") ||
    name.includes("data visualization") ||
    name.includes("business analyst")
  ) {
    return "Data Analytics & BI";
  }

  if (
    name.includes("data scientist") ||
    name.includes("machine learning") ||
    name.includes("ai engineer") ||
    name.includes("deep learning") ||
    name.includes("nlp") ||
    name.includes("computer vision") ||
    name.includes("generative ai") ||
    name.includes("research scientist") ||
    name.includes("mlops")
  ) {
    return "AI & Machine Learning";
  }

  if (
    name.includes("cloud") ||
    name.includes("devops") ||
    name.includes("site reliability") ||
    name.includes("sre") ||
    name.includes("release engineer")
  ) {
    return "Cloud & DevOps";
  }

  if (
    name.includes("cyber") ||
    name.includes("security") ||
    name.includes("ethical hacker") ||
    name.includes("penetration tester") ||
    name.includes("devsecops")
  ) {
    return "Cybersecurity";
  }

  if (
    name.includes("database") ||
    name.includes("sql developer") ||
    name.includes("data engineer") ||
    name.includes("big data") ||
    name.includes("data architect")
  ) {
    return "Data Engineering";
  }

  if (
    name.includes("ui/ux") ||
    name.includes("product designer") ||
    name.includes("designer")
  ) {
    return "UI/UX & Product Design";
  }

  if (
    name.includes("product manager") ||
    name.includes("project manager") ||
    name.includes("technical product")
  ) {
    return "Product & Project Management";
  }

  if (
    name.includes("qa") ||
    name.includes("tester") ||
    name.includes("test engineer")
  ) {
    return "Quality Engineering";
  }

  if (
    name.includes("mobile") ||
    name.includes("android") ||
    name.includes("ios")
  ) {
    return "Mobile Development";
  }

  if (
    name.includes("blockchain") ||
    name.includes("web3") ||
    name.includes("smart contract")
  ) {
    return "Blockchain & Web3";
  }

  if (
    name.includes("embedded") ||
    name.includes("firmware") ||
    name.includes("hardware") ||
    name.includes("robotics") ||
    name.includes("iot")
  ) {
    return "Embedded & IoT";
  }

  return "Software & Technology";
}

function uniqueStrings(items: string[]) {
  return Array.from(
    new Map(
      items
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item.trim()])
    ).values()
  );
}

export default function RecommendationsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCareer, setSelectedCareer] =
    useState<CareerRecommendation | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Please login first.");
          return;
        }

        const [profileResult, jobsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, skills, bio")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("jobs")
            .select(
              "id, title, company, required_skills, description, location, created_at"
            )
            .order("created_at", { ascending: false }),
        ]);

        if (profileResult.error) {
          throw new Error(profileResult.error.message);
        }

        if (jobsResult.error) {
          throw new Error(jobsResult.error.message);
        }

        setProfile(profileResult.data as Profile | null);
        setJobs((jobsResult.data || []) as Job[]);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load career recommendations."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const userSkills = useMemo(() => {
    return normalizeSkills(profile?.skills);
  }, [profile]);

  const careerRecommendations = useMemo(() => {
    if (!jobs.length) {
      return [];
    }

    const grouped = new Map<string, Job[]>();

    jobs.forEach((job) => {
      const category = getCareerCategory(job.title);

      if (!grouped.has(category)) {
        grouped.set(category, []);
      }

      grouped.get(category)!.push(job);
    });

    const recommendations: CareerRecommendation[] = [];

    grouped.forEach((careerJobs, category) => {
      const allRequiredSkills = uniqueStrings(
        careerJobs.flatMap((job) =>
          Array.isArray(job.required_skills) ? job.required_skills : []
        )
      );

      if (!allRequiredSkills.length) {
        return;
      }

      const gapResults = careerJobs.map((job) =>
        calculateSkillGap(
          userSkills,
          Array.isArray(job.required_skills) ? job.required_skills : []
        )
      );

      const averageScore = Math.round(
        gapResults.reduce(
          (sum, result) => sum + result.matchPercentage,
          0
        ) / gapResults.length
      );

      const matchedSkills = uniqueStrings(
        gapResults.flatMap((result) => result.matchedSkills)
      );

      const improvingSkills = uniqueStrings(
        gapResults.flatMap((result) => result.improvingSkills)
      );

      const missingSkills = uniqueStrings(
        gapResults.flatMap((result) => result.missingSkills)
      );

      const reasons: string[] = [];

      if (matchedSkills.length > 0) {
        reasons.push(
          `You already match ${matchedSkills.length} important skill${
            matchedSkills.length === 1 ? "" : "s"
          }.`
        );
      }

      if (averageScore >= 75) {
        reasons.push(
          "Your current profile is strongly aligned with this career path."
        );
      } else if (averageScore >= 50) {
        reasons.push(
          "You have a solid foundation, but a few skills need strengthening."
        );
      } else {
        reasons.push(
          "This path has potential, but you should close the skill gaps first."
        );
      }

      if (missingSkills.length > 0) {
        reasons.push(
          `${missingSkills.slice(0, 3).join(", ")} ${
            missingSkills.length === 1 ? "is" : "are"
          } among the biggest gaps.`
        );
      }

      recommendations.push({
        title: category,
        score: averageScore,
        jobs: careerJobs,
        requiredSkills: allRequiredSkills,
        matchedSkills,
        improvingSkills,
        missingSkills,
        reasons,
      });
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }, [jobs, userSkills]);

  const topRecommendation = careerRecommendations[0];

  const marketSkills = useMemo(() => {
    const counts = new Map<string, number>();

    jobs.forEach((job) => {
      const skills = Array.isArray(job.required_skills)
        ? job.required_skills
        : [];

      skills.forEach((skill) => {
        const clean = String(skill).trim();

        if (!clean) {
          return;
        }

        const key = clean.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([key, count]) => {
        const original = jobs
          .flatMap((job) =>
            Array.isArray(job.required_skills) ? job.required_skills : []
          )
          .find(
            (skill) => String(skill).trim().toLowerCase() === key
          );

        return {
          name: original || key,
          count,
          userHas: userSkills.some(
            (skill) => skill.name.toLowerCase() === key
          ),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [jobs, userSkills]);

  const nextSkills = useMemo(() => {
    const userSkillMap = new Map(
      userSkills.map((skill) => [
        skill.name.toLowerCase(),
        skill.level,
      ])
    );

    const frequency = new Map<string, number>();

    jobs.forEach((job) => {
      const skills = Array.isArray(job.required_skills)
        ? job.required_skills
        : [];

      skills.forEach((skill) => {
        const clean = String(skill).trim();

        if (!clean) {
          return;
        }

        const key = clean.toLowerCase();

        if (!userSkillMap.has(key)) {
          frequency.set(key, (frequency.get(key) || 0) + 1);
        } else if ((userSkillMap.get(key) || 0) < 70) {
          frequency.set(key, (frequency.get(key) || 0) + 0.5);
        }
      });
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, demand]) => ({
        name,
        demand: Math.round(demand),
      }));
  }, [jobs, userSkills]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07111f] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />

            <h2 className="text-xl font-bold">
              Building your career map...
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Analyzing your skills against available jobs.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#07111f] px-6 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-2xl">
            âš ï¸
          </div>

          <h1 className="text-2xl font-bold">
            Career engine unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error}
          </p>

          <Link
            href="/profile"
            className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
          >
            Update Profile
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* NAVBAR */}

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Skill<span className="text-cyan-400">Track</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <Link
              href="/"
              className="text-slate-400 transition hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="text-slate-400 transition hover:text-white"
            >
              Profile
            </Link>

            <Link
              href="/jobs"
              className="text-slate-400 transition hover:text-white"
            >
              Jobs
            </Link>

            <Link
              href="/skill-gap"
              className="text-slate-400 transition hover:text-white"
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
              className="text-slate-400 transition hover:text-white"
            >
              Applications
            </Link>
          </nav>

          <Link
            href="/profile"
            className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Update Skills
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        {/* HERO */}

        <section className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-[#101d35] to-purple-500/10 p-7 shadow-2xl md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                âœ¦ AI Career Intelligence
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Your skills.
                <br />
                Your{" "}
                <span className="text-cyan-400">
                  next career.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
                SkillTrack analyzes your current proficiency, compares it
                with job requirements, and identifies the career paths
                where you have the strongest potential.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/skill-gap"
                  className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  View Skill Gap â†’
                </Link>

                <Link
                  href="/jobs"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Explore Jobs
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-6 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Best career path
              </p>

              {topRecommendation ? (
                <>
                  <h2 className="mt-3 text-2xl font-black">
                    {topRecommendation.title}
                  </h2>

                  <div className="mt-6 flex items-end gap-3">
                    <span className="text-6xl font-black text-cyan-400">
                      {topRecommendation.score}%
                    </span>

                    <span className="mb-2 text-sm text-slate-500">
                      profile match
                    </span>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400"
                      style={{
                        width: `${topRecommendation.score}%`,
                      }}
                    />
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    Based on {topRecommendation.jobs.length} related job
                    opportunities.
                  </p>
                </>
              ) : (
                <p className="mt-4 text-slate-400">
                  Add skills to generate recommendations.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* QUICK STATS */}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#0c1a2d] p-5">
            <p className="text-sm text-slate-500">
              Career Paths
            </p>

            <p className="mt-2 text-3xl font-black text-cyan-400">
              {careerRecommendations.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Analyzed for you
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1a2d] p-5">
            <p className="text-sm text-slate-500">
              Your Skills
            </p>

            <p className="mt-2 text-3xl font-black text-purple-300">
              {userSkills.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              In your profile
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1a2d] p-5">
            <p className="text-sm text-slate-500">
              Jobs Analyzed
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-400">
              {jobs.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Available opportunities
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1a2d] p-5">
            <p className="text-sm text-slate-500">
              Next Skills
            </p>

            <p className="mt-2 text-3xl font-black text-yellow-400">
              {nextSkills.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              AI-prioritized
            </p>
          </div>
        </section>

        {/* CAREER PATHS */}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              Personalized ranking
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Top Career Paths
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Ranked using your skills, proficiency and job requirements.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {careerRecommendations.slice(0, 6).map(
              (career, index) => (
                <button
                  key={career.title}
                  onClick={() => setSelectedCareer(career)}
                  className="group rounded-3xl border border-white/10 bg-[#0c1a2d] p-6 text-left transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-[#102039]"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-lg font-black text-cyan-400">
                        #{index + 1}
                      </div>

                      <div>
                        <h3 className="text-xl font-black">
                          {career.title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {career.jobs.length} job
                          {career.jobs.length === 1
                            ? ""
                            : "s"}{" "}
                          found
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-cyan-400">
                        {career.score}%
                      </p>

                      <p className="text-[11px] uppercase tracking-wider text-slate-600">
                        Match
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-400 to-cyan-400"
                      style={{
                        width: `${career.score}%`,
                      }}
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {career.matchedSkills
                      .slice(0, 4)
                      .map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
                        >
                          âœ“ {skill}
                        </span>
                      ))}

                    {career.missingSkills
                      .slice(0, 2)
                      .map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300"
                        >
                          + {skill}
                        </span>
                      ))}
                  </div>

                  <p className="mt-5 text-sm font-semibold text-slate-500 transition group-hover:text-cyan-400">
                    View career analysis â†’
                  </p>
                </button>
              )
            )}
          </div>
        </section>

        {/* INTELLIGENCE */}

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* NEXT SKILLS */}

          <div className="rounded-3xl border border-white/10 bg-[#0c1a2d] p-6 md:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
                  AI Priority
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  What should you learn next?
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Skills that can unlock more opportunities for your
                  profile.
                </p>
              </div>

              <div className="text-2xl">
                âš¡
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {nextSkills.map((skill, index) => (
                <div
                  key={skill.name}
                  className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/10 text-sm font-black text-yellow-400">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-semibold capitalize">
                        {skill.name}
                      </p>

                      <span className="text-xs text-slate-500">
                        {skill.demand} demand
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-yellow-400"
                        style={{
                          width: `${Math.min(
                            100,
                            skill.demand * 10
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {nextSkills.length === 0 && (
                <div className="rounded-2xl border border-white/5 p-5 text-sm text-slate-500">
                  Your current profile already covers the detected
                  job skills well.
                </div>
              )}
            </div>
          </div>

          {/* MARKET DEMAND */}

          <div className="rounded-3xl border border-white/10 bg-[#0c1a2d] p-6 md:p-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Market Intelligence
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Most demanded skills
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Based on requirements across available jobs.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {marketSkills.map((skill, index) => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-600">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="font-semibold">
                        {skill.name}
                      </span>

                      {skill.userHas && (
                        <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                          YOU HAVE
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-500">
                      {skill.count} jobs
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{
                        width: `${Math.min(
                          100,
                          (skill.count /
                            Math.max(
                              1,
                              marketSkills[0]?.count || 1
                            )) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACTION PLAN */}

        <section className="mt-10 rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 via-[#0c1a2d] to-cyan-500/10 p-7 md:p-9">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
              Your action plan
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Turn your skill gaps into career progress.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              SkillTrack recommends a simple progression: identify your
              target career, strengthen the highest-impact skills, then
              apply to jobs where your profile already has a strong match.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
              <div className="text-2xl">
                01
              </div>

              <h3 className="mt-4 font-black">
                Close the gaps
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Focus first on missing skills that appear frequently in
                job requirements.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
              <div className="text-2xl">
                02
              </div>

              <h3 className="mt-4 font-black">
                Increase proficiency
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Move developing skills toward 70%+ proficiency to improve
                job compatibility.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
              <div className="text-2xl">
                03
              </div>

              <h3 className="mt-4 font-black">
                Apply strategically
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Prioritize jobs with the highest calculated match
                percentage.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
            >
              Improve My Skills
            </Link>

            <Link
              href="/jobs"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold"
            >
              Find Matching Jobs
            </Link>
          </div>
        </section>

        {/* FOOTER */}

        <footer className="mt-10 border-t border-white/10 py-7 text-center text-xs text-slate-600">
          SkillTrack â€¢ AI-powered Skill & Employment Intelligence
        </footer>
      </div>

      {/* CAREER DETAIL MODAL */}

      {selectedCareer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setSelectedCareer(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1728] p-7 shadow-2xl md:p-9"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                  Career Analysis
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {selectedCareer.title}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedCareer.jobs.length} related opportunities
                </p>
              </div>

              <button
                onClick={() => setSelectedCareer(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                âœ•
              </button>
            </div>

            <div className="mt-7 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Career match
                  </p>

                  <p className="mt-1 text-4xl font-black text-cyan-400">
                    {selectedCareer.score}%
                  </p>
                </div>

                <span className="text-3xl">
                  ðŸŽ¯
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{
                    width: `${selectedCareer.score}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-7">
              <h3 className="font-black">
                Why this is recommended
              </h3>

              <div className="mt-4 space-y-3">
                {selectedCareer.reasons.map((reason) => (
                  <div
                    key={reason}
                    className="rounded-xl border border-white/5 bg-white/[0.025] p-4 text-sm leading-6 text-slate-400"
                  >
                    <span className="mr-2 text-cyan-400">
                      âœ¦
                    </span>

                    {reason}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Strong
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCareer.matchedSkills
                    .slice(0, 8)
                    .map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300"
                      >
                        {skill}
                      </span>
                    ))}

                  {selectedCareer.matchedSkills.length === 0 && (
                    <span className="text-xs text-slate-600">
                      No strong matches yet
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                  Improve
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCareer.improvingSkills
                    .slice(0, 8)
                    .map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-yellow-400/10 px-3 py-2 text-xs text-yellow-300"
                      >
                        {skill}
                      </span>
                    ))}

                  {selectedCareer.improvingSkills.length === 0 && (
                    <span className="text-xs text-slate-600">
                      Nothing urgent
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Missing
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCareer.missingSkills
                    .slice(0, 8)
                    .map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-red-400/10 px-3 py-2 text-xs text-red-300"
                      >
                        {skill}
                      </span>
                    ))}

                  {selectedCareer.missingSkills.length === 0 && (
                    <span className="text-xs text-slate-600">
                      No major gaps
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-7">
              <h3 className="font-black">
                Recommended opportunities
              </h3>

              <div className="mt-4 space-y-3">
                {selectedCareer.jobs
                  .slice(0, 5)
                  .map((job) => {
                    const gap = calculateSkillGap(
                      userSkills,
                      Array.isArray(job.required_skills)
                        ? job.required_skills
                        : []
                    );

                    return (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4 transition hover:bg-white/5"
                      >
                        <div>
                          <p className="font-bold">
                            {job.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {job.company}
                            {job.location
                              ? ` â€¢ ${job.location}`
                              : ""}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-black text-cyan-400">
                            {gap.matchPercentage}%
                          </p>

                          <p className="text-[10px] uppercase text-slate-600">
                            Match
                          </p>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/skill-gap"
                className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
              >
                Improve Skill Gap
              </Link>

              <Link
                href="/jobs"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold"
              >
                Browse All Jobs
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
