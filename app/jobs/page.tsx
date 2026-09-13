"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
<p> hi my name is raj </p>
type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[] | null;
  description: string | null;
  location: string | null;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadJobs() {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setJobs(data || []);
      }

      setLoading(false);
    }

    loadJobs();
  }, []);

  return (
    <main className="min-h-screen bg-[#07111f] text-white p-6 md:p-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-5 text-4xl font-bold">
            Explore Jobs
          </h1>

          <p className="mt-2 text-slate-400">
            Find jobs based on your skills and career goals.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-10 text-center">
            <p className="text-cyan-400">Loading jobs...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="font-bold text-red-400">
              Unable to load jobs
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              {error}
            </p>
          </div>
        )}

        {/* JOBS */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-10 text-center">
                <p className="text-slate-400">
                  No jobs found.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6 transition hover:-translate-y-1 hover:border-cyan-400/40"
                  >

                    {/* COMPANY */}
                    <p className="text-sm font-medium text-cyan-400">
                      {job.company}
                    </p>

                    {/* TITLE */}
                    <h2 className="mt-2 text-xl font-bold">
                      {job.title}
                    </h2>

                    {/* LOCATION */}
                    <p className="mt-2 text-sm text-slate-400">
                      📍 {job.location || "India"}
                    </p>

                    {/* DESCRIPTION */}
                    <p className="mt-5 text-sm leading-6 text-slate-400">
                      {job.description ||
                        "No description available for this position."}
                    </p>

                    {/* SKILLS */}
                    <div className="mt-5">
                      <p className="mb-3 text-sm font-semibold">
                        Required Skills
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {(job.required_skills || []).map(
                          (skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* BUTTON */}
                    <button
                      onClick={() =>
                        alert(
                          `Application started for ${job.title}`
                        )
                      }
                      className="mt-6 w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Apply Now
                    </button>

                  </div>
                ))}

              </div>
            )}
          </>
        )}
        
      </div>
    </main>
  );
}
