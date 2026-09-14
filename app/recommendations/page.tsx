"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getJobs } from "../../lib/jobs";
import { calculateSkillGap, UserSkill } from "../../lib/skillGap";

type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[] | null;
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
};

export default function RecommendationsPage() {
  const [userName, setUserName] = useState("SkillTrack User");
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [recommendations, setRecommendations] = useState<
    Recommendation[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, skills")
          .eq("id", user.id)
          .maybeSingle();

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

        const jobs = (await getJobs()) as Job[];

        const results = jobs
          .map((job) => {
            const result = calculateSkillGap(
              userSkills,
              job.required_skills || []
            );

            return {
              ...job,
              matchPercentage: result.matchPercentage,
              matchedSkills: result.matchedSkills,
              missingSkills: result.missingSkills,
              improvingSkills: result.improvingSkills,
            };
          })
          .sort(
            (a, b) =>
              b.matchPercentage - a.matchPercentage
          );

        setRecommendations(results);
      } catch (error) {
        console.error(
          "Recommendation error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />

          <p className="mt-4 text-slate-400">
            Analyzing your career options...
          </p>
        </div>
      </main>
    );
  }

  const bestCareer = recommendations[0];

  const learnNext = Array.from(
    new Set(
      recommendations
        .slice(0, 10)
        .flatMap((job) => [
          ...job.missingSkills,
          ...job.improvingSkills,
        ])
    )
  ).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Skill<span className="text-cyan-400">Track</span>
          </Link>

          <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
            <Link href="/">Dashboard</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/jobs">Jobs</Link>
            <Link href="/skill-gap">Skill Gap</Link>

            <Link
              href="/recommendations"
              className="text-cyan-400"
            >
              AI Career
            </Link>

            <Link href="/applications">
              Applications
            </Link>
          </nav>

          <Link
            href="/profile"
            className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300"
          >
            {userName}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-500/15 to-cyan-400/10 p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-300">
            AI-STYLE CAREER ANALYSIS
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Your Career Recommendation 🤖
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            SkillTrack compares your current skills with available
            jobs and identifies the career paths that fit you best.
          </p>
        </section>

        {!bestCareer ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#0d1b2e] p-8 text-center">
            <h2 className="text-2xl font-bold">
              Add your skills first
            </h2>

            <p className="mt-2 text-slate-400">
              We need your skills to create career recommendations.
            </p>

            <Link
              href="/profile"
              className="mt-6 inline-block rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950"
            >
              Update Profile →
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-8 rounded-3xl border border-cyan-400/20 bg-[#0d1b2e] p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
                BEST CAREER MATCH
              </p>

              <div className="mt-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                <div>
                  <h2 className="text-3xl font-black">
                    {bestCareer.title}
                  </h2>

                  <p className="mt-2 text-slate-400">
                    {bestCareer.company} •{" "}
                    {bestCareer.location || "India"}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {bestCareer.matchedSkills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300"
                        >
                          ✓ {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full border-8 border-cyan-400/20">
                  <div className="text-center">
                    <p className="text-4xl font-black text-cyan-400">
                      {bestCareer.matchPercentage}%
                    </p>

                    <p className="text-xs text-slate-500">
                      MATCH
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-purple-400/20 bg-purple-400/5 p-7">
              <h2 className="text-2xl font-black">
                What Should You Learn Next? 🎯
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                These skills can improve your compatibility with
                multiple jobs.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {learnNext.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Your current skills already match many job
                    requirements.
                  </p>
                ) : (
                  learnNext.map((skill, index) => (
                    <div
                      key={skill}
                      className="rounded-xl border border-white/10 bg-[#0d1b2e] p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-400/10 font-bold text-purple-300">
                          {index + 1}
                        </span>

                        <span className="font-bold">
                          {skill}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1b2e] p-7">
              <h2 className="text-2xl font-black">
                Alternative Career Paths 💼
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {recommendations
                  .slice(1, 4)
                  .map((job) => (
                    <div
                      key={job.id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
                    >
                      <p className="text-xs text-cyan-400">
                        {job.company}
                      </p>

                      <h3 className="mt-2 font-bold">
                        {job.title}
                      </h3>

                      <div className="mt-5">
                        <span className="text-2xl font-black text-cyan-400">
                          {job.matchPercentage}%
                        </span>

                        <span className="ml-2 text-xs text-slate-500">
                          compatibility
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}