"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { calculateSkillGap, UserSkill } from "../../lib/skillGap";
import { cleanDisplayText } from "../../lib/text";

type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[] | null;
  description: string | null;
  location: string | null;
  created_at?: string;
};

type Application = {
  id: string;
  job_id: string;
  status: "Wishlist" | "Applied" | "Interview" | "Offer";
};

type SortOption =
  | "match"
  | "latest"
  | "az";

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [applications, setApplications] =
    useState<Application[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] =
    useState("All Skills");

  const [sortBy, setSortBy] =
    useState<SortOption>("match");

  const [actionId, setActionId] =
    useState("");

  const [showFilters, setShowFilters] =
    useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            router.replace("/login");
          return;
        }

        /*
         * LOAD JOBS
         */

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

        setJobs((jobsData || []) as Job[]);

        /*
         * LOAD PROFILE SKILLS
         */

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("skills")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Profile error:",
            profileError.message
          );
        }

        if (
          Array.isArray(
            profileData?.skills
          )
        ) {
          setSkills(
            profileData.skills as UserSkill[]
          );
        } else {
          setSkills([]);
        }

        /*
         * LOAD APPLICATIONS
         */

        const {
          data: applicationData,
          error: applicationError,
        } = await supabase
          .from("applications")
          .select(
            "id, job_id, status"
          )
          .eq("user_id", user.id);

        if (applicationError) {
          console.error(
            "Application error:",
            applicationError.message
          );
        }

        setApplications(
          (applicationData ||
            []) as Application[]
        );
      } catch (err) {
        console.error(
          "Jobs loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load jobs."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  /*
   * -----------------------------------------
   * JOB ANALYSIS
   * -----------------------------------------
   */

  const analyzedJobs = useMemo(() => {
    return jobs.map((job) => {
      const analysis =
        calculateSkillGap(
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
    });
  }, [jobs, skills]);

  /*
   * -----------------------------------------
   * AVAILABLE SKILLS
   * -----------------------------------------
   */

  const availableSkills = useMemo(() => {
    const skillSet = new Set<string>();

    jobs.forEach((job) => {
      (
        job.required_skills || []
      ).forEach((skill) => {
        if (skill) {
          skillSet.add(skill);
        }
      });
    });

    return Array.from(skillSet).sort();
  }, [jobs]);

  /*
   * -----------------------------------------
   * FILTER + SORT
   * -----------------------------------------
   */

  const filteredJobs = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    let result =
      analyzedJobs.filter((job) => {
        const matchesSearch =
          !query ||
          job.title
            .toLowerCase()
            .includes(query) ||
          job.company
            .toLowerCase()
            .includes(query) ||
          (
            job.description || ""
          )
            .toLowerCase()
            .includes(query) ||
          (
            job.required_skills || []
          ).some((skill) =>
            skill
              .toLowerCase()
              .includes(query)
          );

        const matchesSkill =
          selectedSkill ===
            "All Skills" ||
          (
            job.required_skills || []
          ).some(
            (skill) =>
              skill === selectedSkill
          );

        return (
          matchesSearch &&
          matchesSkill
        );
      });

    result = [...result].sort(
      (a, b) => {
        if (sortBy === "match") {
          return (
            b.matchPercentage -
            a.matchPercentage
          );
        }

        if (sortBy === "az") {
          return a.title.localeCompare(
            b.title
          );
        }

        return (
          new Date(
            b.created_at || 0
          ).getTime() -
          new Date(
            a.created_at || 0
          ).getTime()
        );
      }
    );

    return result;
  }, [
    analyzedJobs,
    search,
    selectedSkill,
    sortBy,
  ]);

  /*
   * -----------------------------------------
   * APPLICATION STATUS
   * -----------------------------------------
   */

  function getApplication(
    jobId: string
  ) {
    return applications.find(
      (application) =>
        application.job_id === jobId
    );
  }

  /*
   * -----------------------------------------
   * MATCH STYLE
   * -----------------------------------------
   */

  function getMatchStyle(
    percentage: number
  ) {
    if (percentage >= 85) {
      return "border-teal-500/30 bg-teal-500/10 text-teal-300";
    }

    if (percentage >= 70) {
      return "border-blue-600/30 bg-blue-600/10 text-blue-300";
    }

    if (percentage >= 50) {
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    }

    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  function getMatchLabel(
    percentage: number
  ) {
    if (percentage >= 85) {
      return "Excellent Match";
    }

    if (percentage >= 70) {
      return "Strong Match";
    }

    if (percentage >= 50) {
      return "Potential Match";
    }

    return "Needs Development";
  }

  /*
   * -----------------------------------------
   * SAVE APPLICATION
   * -----------------------------------------
   */

  async function saveApplication(
    job: Job,
    status: "Wishlist" | "Applied"
  ) {
    const existing =
      getApplication(job.id);

    if (existing) {
      alert(
        `This job is already in your Applications with status: ${existing.status}`
      );

      return;
    }

    setActionId(
      `${status}-${job.id}`
    );

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } =
        await supabase
          .from("applications")
          .insert({
            user_id: user.id,
            job_id: job.id,
            status,
          })
          .select(
            "id, job_id, status"
          )
          .single();

      if (error) {
        alert(error.message);
        return;
      }

      if (data) {
        setApplications(
          (current) => [
            {
              ...(data as Application),
            },
            ...current,
          ]
        );
      }

      if (status === "Applied") {
        alert(
          `${job.title} added to your applications!`
        );
        router.push("/applications");
      } else {
        alert(
          `${job.title} saved to your wishlist!`
        );
      }
    } catch (err) {
      console.error(
        "Application error:",
        err
      );

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setActionId("");
    }
  }

  /*
   * -----------------------------------------
   * LOADING
   * -----------------------------------------
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1F3A] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600/20 border-t-cyan-400" />

          <p className="mt-5 text-sm text-slate-400">
            Analyzing jobs for you...
          </p>
        </div>
      </main>
    );
  }

  /*
   * -----------------------------------------
   * PAGE
   * -----------------------------------------
   */

  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      {/* NAVBAR */}

      <header className="hidden sticky top-0 z-40 border-b border-white/10 bg-[#0B1F3A]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Skill
            <span className="text-blue-600">
              Track
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-slate-300 lg:flex">

  <Link
    href="/"
    className="transition hover:text-blue-600"
  >
    Dashboard
  </Link>

  <Link
    href="/jobs"
    className="transition hover:text-blue-600"
  >
    Jobs
  </Link>

  <div className="group relative">

    <button
      type="button"
      className="flex items-center gap-2 py-3 transition hover:text-blue-600"
    >
      AI Career
      <span className="text-[10px] transition-transform duration-200 group-hover:rotate-180">
        v
      </span>
    </button>

    <div className="pointer-events-none absolute left-1/2 top-full z-[100] w-80 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/10 bg-[#10294A] p-2 opacity-0 shadow-2xl shadow-cyan-500/10 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">

      <Link
  href="/ai-assistant"
  className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
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
        className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
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
        className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
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
        className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
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
        className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
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
        className="block rounded-xl px-4 py-3 transition hover:bg-blue-600/10"
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
    className="transition hover:text-blue-600"
  >
    Applications
  </Link>

  <Link
    href="/profile"
    className="transition hover:text-blue-600"
  >
    Profile
  </Link>

</nav>

          <Link
            href="/applications"
            className="rounded-xl border border-blue-600/20 bg-blue-600/10 px-4 py-2 text-xs font-bold text-blue-300"
          >
            My Applications
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER */}

        <section>
          <Link
            href="/"
            className="text-sm font-semibold text-blue-600 hover:text-blue-300"
          >
            &larr; Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
                SMART JOB DISCOVERY
              </p>

              <h1 className="mt-3 text-4xl font-black md:text-5xl">
                Find Your Next Opportunity
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Explore opportunities ranked by how closely
                they match your current skills.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-xl border border-white/10 bg-[#163456] px-5 py-3 text-center">
                <p className="text-2xl font-black text-blue-600">
                  {jobs.length}
                </p>

                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  Jobs
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#163456] px-5 py-3 text-center">
                <p className="text-2xl font-black text-purple-300">
                  {skills.length}
                </p>

                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  Skills
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SMART SEARCH */}

        <section className="mt-8 rounded-3xl border border-blue-600/20 bg-gradient-to-br from-cyan-400/10 via-[#0d1b2e] to-purple-500/10 p-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* SEARCH */}

            <div className="relative flex-1">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search job title, company, skill..."
                className="w-full rounded-xl border border-white/10 bg-[#0B1F3A] py-4 pl-4 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-600/40"
              />
            </div>

            {/* FILTER BUTTON */}

            <button
              onClick={() =>
                setShowFilters(
                  !showFilters
                )
              }
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold transition hover:bg-white/10"
            >
              Filters
            </button>
          </div>

          {/* FILTERS */}

          {showFilters && (
            <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Filter by Skill
                </label>

                <select
                  value={selectedSkill}
                  onChange={(event) =>
                    setSelectedSkill(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0B1F3A] px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-600/40"
                >
                  <option>
                    All Skills
                  </option>

                  {availableSkills.map(
                    (skill) => (
                      <option
                        key={skill}
                        value={skill}
                      >
                        {skill}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Sort Jobs
                </label>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target
                        .value as SortOption
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0B1F3A] px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-600/40"
                >
                  <option value="match">
                    Best Match
                  </option>

                  <option value="latest">
                    Latest
                  </option>

                  <option value="az">
                    A to Z
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* ACTIVE FILTER */}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              Showing{" "}
              <span className="font-bold text-slate-400">
                {filteredJobs.length}
              </span>{" "}
              of {jobs.length} opportunities
            </p>

            {(search ||
              selectedSkill !==
                "All Skills") && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedSkill(
                    "All Skills"
                  );
                }}
                className="text-xs font-bold text-red-400 hover:text-red-300"
              >
                Clear Filters
              </button>
            )}
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-6">
            <p className="font-bold text-red-300">
              Unable to load jobs
            </p>

            <p className="mt-2 text-sm text-slate-400">
              {error}
            </p>
          </div>
        )}

        {/* NO RESULTS */}

        {!error &&
          filteredJobs.length ===
            0 && (
            <section className="mt-8 rounded-3xl border border-dashed border-white/10 bg-[#163456] p-12 text-center">
              <div className="text-5xl">
                Search
              </div>

              <h2 className="mt-5 text-2xl font-black">
                No matching jobs
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or filters.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setSelectedSkill(
                    "All Skills"
                  );
                }}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-slate-950"
              >
                Reset Search
              </button>
            </section>
          )}

        {/* JOB GRID */}

        {!error &&
          filteredJobs.length > 0 && (
            <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredJobs.map(
                (job, index) => {
                  const application =
                    getApplication(
                      job.id
                    );

                  const isWishlist =
                    application?.status ===
                    "Wishlist";

                  const isApplied =
                    application?.status ===
                      "Applied" ||
                    application?.status ===
                      "Interview" ||
                    application?.status ===
                      "Offer";

                  const isActionLoading =
                    actionId ===
                      `Wishlist-${job.id}` ||
                    actionId ===
                      `Applied-${job.id}`;

                  return (
                    <article
                      key={job.id}
                      className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#163456] transition duration-300 hover:-translate-y-1 hover:border-blue-600/30 hover:shadow-2xl hover:shadow-cyan-400/5"
                    >
                      {/* TOP */}

                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                              {cleanDisplayText(job.company)}
                            </p>

                            <h2 className="mt-2 line-clamp-2 text-xl font-black leading-7">
                              {cleanDisplayText(job.title)}
                            </h2>

                            <p className="mt-2 text-xs text-slate-600">
                              Location: {" "}
                              {cleanDisplayText(job.location) ||
                                "India"}
                            </p>
                          </div>

                          {/* MATCH */}

                          <div
                            className={`shrink-0 rounded-xl border px-3 py-2 text-center ${getMatchStyle(
                              job.matchPercentage
                            )}`}
                          >
                            <p className="text-xl font-black">
                              {job.matchPercentage}%
                            </p>

                            <p className="text-[8px] font-bold uppercase tracking-wider">
                              Match
                            </p>
                          </div>
                        </div>

                        {/* MATCH LABEL */}

                        <p
                          className={`mt-4 text-xs font-bold ${
                            job.matchPercentage >=
                            70
                              ? "text-blue-600"
                              : job.matchPercentage >=
                                50
                              ? "text-yellow-400"
                              : "text-red-400"
                          }`}
                        >
                          {getMatchLabel(
                            job.matchPercentage
                          )}
                        </p>

                        {/* DESCRIPTION */}

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                          {cleanDisplayText(job.description) ||
                            "Explore this opportunity and compare it with your current skill profile."}
                        </p>

                        {/* SKILLS */}

                        <div className="mt-5">
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                            Required Skills
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {(
                              job.required_skills ||
                              []
                            )
                              .slice(0, 6)
                              .map(
                                (skill) => {
                                  const matched =
                                    job.matchedSkills.includes(
                                      skill
                                    );

                                  const improving =
                                    job.improvingSkills.includes(
                                      skill
                                    );

                                  return (
                                    <span
                                      key={
                                        skill
                                      }
                                      className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold ${
                                        matched
                                          ? "bg-teal-500/10 text-teal-300"
                                          : improving
                                          ? "bg-yellow-400/10 text-yellow-300"
                                          : "bg-white/5 text-slate-500"
                                      }`}
                                    >
                                      {matched
                                        ? "+ "
                                        : improving
                                        ? "~ "
                                        : ""}
                                      {skill}
                                    </span>
                                  );
                                }
                              )}

                            {(
                              job.required_skills ||
                              []
                            ).length > 6 && (
                              <span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] text-slate-600">
                                +
                                {(
                                  job.required_skills ||
                                  []
                                ).length -
                                  6}{" "}
                                more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* GAP SUMMARY */}

                        <div className="mt-5 grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-teal-500/5 p-3 text-center">
                            <p className="text-lg font-black text-teal-400">
                              {
                                job
                                  .matchedSkills
                                  .length
                              }
                            </p>

                            <p className="text-[9px] uppercase text-slate-600">
                              Ready
                            </p>
                          </div>

                          <div className="rounded-xl bg-yellow-400/5 p-3 text-center">
                            <p className="text-lg font-black text-yellow-400">
                              {
                                job
                                  .improvingSkills
                                  .length
                              }
                            </p>

                            <p className="text-[9px] uppercase text-slate-600">
                              Improve
                            </p>
                          </div>

                          <div className="rounded-xl bg-red-400/5 p-3 text-center">
                            <p className="text-lg font-black text-red-400">
                              {
                                job
                                  .missingSkills
                                  .length
                              }
                            </p>

                            <p className="text-[9px] uppercase text-slate-600">
                              Learn
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="mt-auto border-t border-white/10 p-5">
                        <div className="grid grid-cols-2 gap-3">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                          >
                            View Details
                          </Link>

                          {application ? (
                            <Link
                              href="/applications"
                              className="rounded-xl bg-teal-500/10 px-3 py-3 text-center text-xs font-bold text-teal-300 transition hover:bg-teal-500/20"
                            >
                              Status: {" "}
                              {
                                application.status
                              }
                            </Link>
                          ) : (
                            <button
                              disabled={
                                isActionLoading
                              }
                              onClick={() =>
                                saveApplication(
                                  job,
                                  "Applied"
                                )
                              }
                              className="rounded-xl bg-blue-600 px-3 py-3 text-xs font-black text-slate-950 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionId ===
                              `Applied-${job.id}`
                                ? "Applying..."
                                : "Apply Now"}
                            </button>
                          )}
                        </div>

                        {/* WISHLIST */}

                        {!isApplied && (
                          <button
                            disabled={
                              isActionLoading
                            }
                            onClick={() =>
                              saveApplication(
                                job,
                                "Wishlist"
                              )
                            }
                            className={`mt-3 w-full rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              isWishlist
                                ? "border-purple-400/30 bg-purple-400/10 text-purple-300"
                                : "border-white/10 bg-white/5 text-slate-500 hover:bg-purple-400/10 hover:text-purple-300"
                            }`}
                          >
                            {actionId ===
                            `Wishlist-${job.id}`
                              ? "Saving..."
                              : isWishlist
                              ? "In Wishlist"
                              : "Add to Wishlist"}
                          </button>
                        )}
                      </div>

                      {/* RANK */}

                      {sortBy ===
                        "match" &&
                        index < 3 && (
                          <div className="pointer-events-none absolute" />
                        )}
                    </article>
                  );
                }
              )}
            </section>
          )}

        {/* BOTTOM CTA */}

        <section className="mt-10 rounded-3xl border border-blue-600/20 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-cyan-400/5 p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            SMART CAREER MATCHING
          </p>

          <h2 className="mt-3 text-2xl font-black md:text-3xl">
            Your skills. Your gaps. Your opportunities.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            SkillTrack analyzes your current proficiency against
            employer requirements so you can focus on opportunities
            where you have the strongest potential.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/skill-gap"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold transition hover:bg-white/10"
            >
              Analyze Skill Gaps
            </Link>

            <Link
              href="/recommendations"
              className="rounded-xl bg-purple-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-purple-300"
            >
              AI Career Recommendations
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

