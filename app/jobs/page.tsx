"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[] | null;
  description: string | null;
  location: string | null;
};

type ApplicationStatus = "Wishlist" | "Applied";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  useEffect(() => {
    async function loadJobs() {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching jobs:", error.message);
        setError(error.message);
      } else {
        setJobs(data || []);
      }

      setLoading(false);
    }

    loadJobs();
  }, []);

  async function saveApplication(
    job: Job,
    status: ApplicationStatus
  ) {
    setActionId(`${status}-${job.id}`);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first to continue.");
        setActionId("");
        return;
      }

      const { data: existingApplication, error: existingError } =
        await supabase
          .from("applications")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("job_id", job.id)
          .maybeSingle();

      if (existingError) {
        console.error(
          "Error checking application:",
          existingError.message
        );

        alert(existingError.message);
        setActionId("");
        return;
      }

      if (existingApplication) {
        alert(
          `You already have this job in Applications with status: ${existingApplication.status}`
        );

        setActionId("");
        return;
      }

      const { error: insertError } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          job_id: job.id,
          status,
        });

      if (insertError) {
        console.error(
          "Error saving application:",
          insertError.message
        );

        alert(insertError.message);
        setActionId("");
        return;
      }

      if (status === "Applied") {
        alert(`${job.title} added to your applications!`);

        window.location.href = "/applications";
        return;
      }

      alert(`${job.title} saved to your wishlist!`);

      setActionId("");
    } catch (error) {
      console.error("Unexpected error:", error);

      alert("Something went wrong. Please try again.");

      setActionId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>
            <Link
              href="/"
              className="text-sm text-cyan-400 transition hover:text-cyan-300"
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

          <Link
            href="/applications"
            className="w-fit rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
          >
            View My Applications →
          </Link>

        </div>


        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-10 text-center">
            <p className="text-cyan-400">
              Loading jobs...
            </p>
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


        {/* NO JOBS */}
        {!loading &&
          !error &&
          jobs.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-10 text-center">

              <p className="text-slate-400">
                No jobs found.
              </p>

            </div>
          )}


        {/* JOBS */}
        {!loading &&
          !error &&
          jobs.length > 0 && (

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {jobs.map((job) => (

                <div
                  key={job.id}
                  className="flex flex-col rounded-2xl border border-white/10 bg-[#0d1b2e] p-6 transition hover:-translate-y-1 hover:border-cyan-400/40"
                >

                  {/* COMPANY */}
                  <p className="text-sm font-medium text-cyan-400">
                    {job.company}
                  </p>


                  {/* JOB TITLE */}
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


                  {/* REQUIRED SKILLS */}
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


                  {/* BUTTONS */}
                  <div className="mt-auto flex gap-3 pt-6">

                    {/* WISHLIST */}
                    <button
                      disabled={
                        actionId ===
                          `Wishlist-${job.id}` ||
                        actionId ===
                          `Applied-${job.id}`
                      }
                      onClick={() =>
                        saveApplication(
                          job,
                          "Wishlist"
                        )
                      }
                      className="flex-1 rounded-xl border border-purple-400/30 bg-purple-400/10 px-3 py-3 text-xs font-bold text-purple-300 transition hover:bg-purple-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionId ===
                      `Wishlist-${job.id}`
                        ? "Saving..."
                        : "♡ Wishlist"}
                    </button>


                    {/* APPLY */}
                    <button
                      disabled={
                        actionId ===
                          `Wishlist-${job.id}` ||
                        actionId ===
                          `Applied-${job.id}`
                      }
                      onClick={() =>
                        saveApplication(
                          job,
                          "Applied"
                        )
                      }
                      className="flex-1 rounded-xl bg-cyan-400 px-3 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionId ===
                      `Applied-${job.id}`
                        ? "Applying..."
                        : "Apply Now"}
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

      </div>
    </main>
  );
}