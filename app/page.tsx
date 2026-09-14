"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { getJobs } from "../lib/jobs";
import { getApplications } from "../lib/applications";
import { calculateSkillGap, UserSkill } from "../lib/skillGap";

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
  status: "Wishlist" | "Applied" | "Interview" | "Offer";
  job_id: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    description: string | null;
  } | null;
};

export default function Dashboard() {
  const [userName, setUserName] = useState("SkillTrack User");
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
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
          .select("full_name, bio, skills")
          .eq("id", user.id)
          .maybeSingle();

        const profileData = profile as Profile | null;

        if (profileData?.full_name) {
          setUserName(profileData.full_name);
        } else if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        } else if (user.email) {
          setUserName(user.email.split("@")[0]);
        }

        if (Array.isArray(profileData?.skills)) {
          setSkills(profileData.skills);
        }

        const jobsData = await getJobs();
        setJobs(jobsData as Job[]);

        const applicationsResult = await getApplications();

        if (applicationsResult.data) {
          setApplications(applicationsResult.data as Application[]);
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const readiness = useMemo(() => {
    if (skills.length === 0) {
      return 0;
    }

    const totalSkillLevel = skills.reduce(
      (total, skill) => total + Number(skill.level || 0),
      0
    );

    return Math.min(
      100,
      Math.round(totalSkillLevel / skills.length)
    );
  }, [skills]);

  const topJobs = useMemo(() => {
    return jobs
      .map((job) => {
        const gap = calculateSkillGap(
          skills,
          job.required_skills || []
        );

        return {
          ...job,
          matchPercentage: gap.matchPercentage,
          matchedSkills: gap.matchedSkills,
          missingSkills: gap.missingSkills,
          improvingSkills: gap.improvingSkills,
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 3);
  }, [jobs, skills]);

  const priorityGaps = useMemo(() => {
    const gapCount = new Map<string, number>();

    jobs.forEach((job) => {
      const gap = calculateSkillGap(
        skills,
        job.required_skills || []
      );

      gap.missingSkills.forEach((skill) => {
        const current = gapCount.get(skill) || 0;
        gapCount.set(skill, current + 1);
      });

      gap.improvingSkills.forEach((skill) => {
        const current = gapCount.get(skill) || 0;
        gapCount.set(skill, current + 1);
      });
    });

    return Array.from(gapCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);
  }, [jobs, skills]);

  const applicationStats = {
    wishlist: applications.filter(
      (application) => application.status === "Wishlist"
    ).length,

    applied: applications.filter(
      (application) => application.status === "Applied"
    ).length,

    interview: applications.filter(
      (application) => application.status === "Interview"
    ).length,

    offer: applications.filter(
      (application) => application.status === "Offer"
    ).length,
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />
          <p className="mt-4 text-slate-400">
            Loading your SkillTrack dashboard...
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
            className="text-2xl font-black tracking-tight"
          >
            Skill<span className="text-cyan-400">Track</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link
              href="/"
              className="text-cyan-400"
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
              href="/applications"
              className="transition hover:text-cyan-400"
            >
              Applications
            </Link>
          </nav>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome */}
        <section className="mb-8 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-[#0d1b2e] to-purple-500/10 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Career Dashboard
          </p>

          <h1 className="mt-3 text-3xl font-black md:text-4xl">
            Welcome back, {userName} 👋
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Track your skills, discover suitable jobs, identify skill gaps,
            and move closer to your career goals.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Update Skills
            </Link>

            <Link
              href="/jobs"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Explore Jobs
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-400">
              Job Readiness
            </p>

            <div className="mt-3 flex items-end justify-between">
              <p className="text-4xl font-black text-cyan-400">
                {readiness}%
              </p>

              <span className="text-2xl">🎯</span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all"
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-400">
              Your Skills
            </p>

            <p className="mt-3 text-4xl font-black">
              {skills.length}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Skills added to your profile
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-400">
              Applications
            </p>

            <p className="mt-3 text-4xl font-black">
              {applications.length}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Total tracked applications
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-400">
              Available Jobs
            </p>

            <p className="mt-3 text-4xl font-black">
              {jobs.length}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Jobs in SkillTrack
            </p>
          </div>
        </section>

        {/* Main Grid */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Recommended Jobs */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Recommended Jobs 🚀
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Based on your current skills
                </p>
              </div>

              <Link
                href="/jobs"
                className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
              >
                View all →
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {topJobs.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <p className="text-slate-400">
                    Add skills to your profile to get job recommendations.
                  </p>

                  <Link
                    href="/profile"
                    className="mt-4 inline-block text-sm font-semibold text-cyan-400"
                  >
                    Add Skills →
                  </Link>
                </div>
              )}

              {topJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/30"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <p className="text-xs font-semibold text-cyan-400">
                        {job.company}
                      </p>

                      <h3 className="mt-1 text-lg font-bold">
                        {job.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        📍 {job.location || "India"}
                      </p>
                    </div>

                    <div className="flex h-fit items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2">
                      <span className="text-xl">🎯</span>

                      <div>
                        <p className="text-lg font-black text-cyan-400">
                          {job.matchPercentage}%
                        </p>

                        <p className="text-[10px] uppercase text-slate-500">
                          Match
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.matchedSkills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300"
                      >
                        ✓ {skill}
                      </span>
                    ))}

                    {job.improvingSkills.slice(0, 2).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-yellow-400/10 px-3 py-1.5 text-xs text-yellow-300"
                      >
                        ↗ {skill}
                      </span>
                    ))}

                    {job.missingSkills.slice(0, 2).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-red-400/10 px-3 py-1.5 text-xs text-red-300"
                      >
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Gaps */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Priority Skills
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Skills worth improving
                </p>
              </div>

              <span className="text-2xl">🧠</span>
            </div>

            <div className="mt-6 space-y-3">
              {priorityGaps.length === 0 && (
                <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-slate-400">
                  No major skill gaps detected yet.
                </p>
              )}

              {priorityGaps.map((skill, index) => (
                <div
                  key={skill}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-400/10 text-sm font-bold text-purple-300">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {skill}
                    </p>

                    <p className="text-xs text-slate-500">
                      Recommended for your target jobs
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/skill-gap"
              className="mt-5 block rounded-xl border border-purple-400/20 bg-purple-400/10 px-4 py-3 text-center text-sm font-semibold text-purple-300 transition hover:bg-purple-400/20"
            >
              View Full Skill Gap →
            </Link>
          </div>
        </section>

        {/* Skills + Applications */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Skills */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Your Skills 💻
              </h2>

              <Link
                href="/profile"
                className="text-sm font-semibold text-cyan-400"
              >
                Manage →
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {skills.length === 0 && (
                <p className="text-sm text-slate-500">
                  No skills added yet.
                </p>
              )}

              {skills.slice(0, 6).map((skill) => (
                <div key={skill.name}>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium">
                      {skill.name}
                    </span>

                    <span className="text-xs text-slate-500">
                      {skill.level}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-purple-400"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, skill.level)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Applications */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Application Tracker 📋
              </h2>

              <Link
                href="/applications"
                className="text-sm font-semibold text-cyan-400"
              >
                Open →
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-purple-400/10 p-5">
                <p className="text-sm text-purple-300">
                  Wishlist
                </p>

                <p className="mt-2 text-3xl font-black">
                  {applicationStats.wishlist}
                </p>
              </div>

              <div className="rounded-xl bg-cyan-400/10 p-5">
                <p className="text-sm text-cyan-300">
                  Applied
                </p>

                <p className="mt-2 text-3xl font-black">
                  {applicationStats.applied}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-400/10 p-5">
                <p className="text-sm text-yellow-300">
                  Interview
                </p>

                <p className="mt-2 text-3xl font-black">
                  {applicationStats.interview}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-400/10 p-5">
                <p className="text-sm text-emerald-300">
                  Offer
                </p>

                <p className="mt-2 text-3xl font-black">
                  {applicationStats.offer}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Career Action */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-400/10 p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-purple-300">
                YOUR NEXT MOVE
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Build the skills that employers are looking for.
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Use SkillTrack to identify your gaps, improve your
                proficiency, and find jobs that match your current level.
              </p>
            </div>

            <Link
              href="/skill-gap"
              className="whitespace-nowrap rounded-xl bg-purple-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-purple-300"
            >
              Analyze My Skills →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}