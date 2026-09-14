"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Application = {
  id: string;
  user_id: string;
  job_id: string;
  status: "Wishlist" | "Applied" | "Interview" | "Offer";
  applied_at: string;
};

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
};

type ApplicationWithJob = Application & {
  job?: Job;
};

const statusOptions = [
  "Wishlist",
  "Applied",
  "Interview",
  "Offer",
] as const;

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  async function loadApplications() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setApplications([]);
      setError("Please login first to view your applications.");
      setLoading(false);
      return;
    }

    const { data: applicationData, error: applicationError } =
      await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false });

    if (applicationError) {
      console.error(applicationError);
      setError(applicationError.message);
      setLoading(false);
      return;
    }

    const applicationRows = (applicationData || []) as Application[];

    if (applicationRows.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const jobIds = applicationRows.map((application) => application.job_id);

    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, company, location")
      .in("id", jobIds);

    if (jobError) {
      console.error(jobError);
      setError(jobError.message);
      setLoading(false);
      return;
    }

    const jobs = (jobData || []) as Job[];

    const combined = applicationRows.map((application) => ({
      ...application,
      job: jobs.find((job) => job.id === application.job_id),
    }));

    setApplications(combined);
    setLoading(false);
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function updateStatus(
    applicationId: string,
    newStatus: Application["status"]
  ) {
    setUpdatingId(applicationId);

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: newStatus,
      })
      .eq("id", applicationId);

    if (updateError) {
      alert(updateError.message);
      setUpdatingId("");
      return;
    }

    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status: newStatus,
            }
          : application
      )
    );

    setUpdatingId("");
  }

  async function deleteApplication(applicationId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this application?"
    );

    if (!confirmed) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("applications")
      .delete()
      .eq("id", applicationId);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    setApplications((current) =>
      current.filter((application) => application.id !== applicationId)
    );
  }

  const wishlistCount = applications.filter(
    (application) => application.status === "Wishlist"
  ).length;

  const appliedCount = applications.filter(
    (application) => application.status === "Applied"
  ).length;

  const interviewCount = applications.filter(
    (application) => application.status === "Interview"
  ).length;

  const offerCount = applications.filter(
    (application) => application.status === "Offer"
  ).length;

  function statusClass(status: Application["status"]) {
    if (status === "Wishlist") {
      return "bg-purple-500/10 text-purple-300 border-purple-500/20";
    }

    if (status === "Applied") {
      return "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
    }

    if (status === "Interview") {
      return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
    }

    return "bg-green-500/10 text-green-300 border-green-500/20";
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5">
            <h1 className="text-4xl font-bold tracking-tight">
              My Applications
            </h1>

            <p className="mt-2 text-slate-400">
              Track your job applications and career progress.
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-purple-500/20 bg-[#0d1b2e] p-5">
            <p className="text-sm text-slate-400">Wishlist</p>
            <p className="mt-2 text-3xl font-bold">{wishlistCount}</p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0d1b2e] p-5">
            <p className="text-sm text-slate-400">Applied</p>
            <p className="mt-2 text-3xl font-bold">{appliedCount}</p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-[#0d1b2e] p-5">
            <p className="text-sm text-slate-400">Interview</p>
            <p className="mt-2 text-3xl font-bold">{interviewCount}</p>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-[#0d1b2e] p-5">
            <p className="text-sm text-slate-400">Offer</p>
            <p className="mt-2 text-3xl font-bold">{offerCount}</p>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-10 text-center">
            <p className="text-cyan-400">Loading applications...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="font-bold text-red-400">
              Unable to load applications
            </h2>

            <p className="mt-2 text-sm text-slate-300">{error}</p>

            <Link
              href="/login"
              className="mt-5 inline-block rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Go to Login
            </Link>
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-12 text-center">
            <div className="text-5xl">📋</div>

            <h2 className="mt-5 text-2xl font-bold">
              No applications yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-slate-400">
              Explore available jobs and apply to positions that match your
              skills.
            </p>

            <Link
              href="/jobs"
              className="mt-6 inline-block rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Explore Jobs
            </Link>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6 transition hover:border-cyan-400/20"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold">
                        {application.job?.title || "Unknown Job"}
                      </h2>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    </div>

                    <p className="mt-2 text-cyan-400">
                      {application.job?.company || "Unknown Company"}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      📍 {application.job?.location || "India"}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      Added on{" "}
                      {new Date(application.applied_at).toLocaleDateString(
                        "en-IN"
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      value={application.status}
                      disabled={updatingId === application.id}
                      onChange={(event) =>
                        updateStatus(
                          application.id,
                          event.target.value as Application["status"]
                        )
                      }
                      className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => deleteApplication(application.id)}
                      className="rounded-xl border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}