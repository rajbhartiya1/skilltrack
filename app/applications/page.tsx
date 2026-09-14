"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Application,
  ApplicationStatus,
  getApplications,
  removeApplication,
  updateApplicationStatus,
} from "../../lib/applications";

const statuses: ApplicationStatus[] = [
  "Wishlist",
  "Applied",
  "Interview",
  "Offer",
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    setError("");

    const result = await getApplications();

    if (result.error) {
      setError(result.error);
    } else {
      setApplications(result.data);
    }

    setLoading(false);
  }

  async function handleStatusChange(
    applicationId: string,
    status: ApplicationStatus
  ) {
    const result = await updateApplicationStatus(
      applicationId,
      status
    );

    if (!result.success) {
      alert(result.message);
      return;
    }

    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status,
            }
          : application
      )
    );
  }

  async function handleRemove(applicationId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this application?"
    );

    if (!confirmed) {
      return;
    }

    const result = await removeApplication(applicationId);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setApplications((current) =>
      current.filter(
        (application) =>
          application.id !== applicationId
      )
    );
  }

  const counts = useMemo(() => {
    return {
      Wishlist: applications.filter(
        (application) =>
          application.status === "Wishlist"
      ).length,

      Applied: applications.filter(
        (application) =>
          application.status === "Applied"
      ).length,

      Interview: applications.filter(
        (application) =>
          application.status === "Interview"
      ).length,

      Offer: applications.filter(
        (application) =>
          application.status === "Offer"
      ).length,
    };
  }, [applications]);

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-5 text-4xl font-bold">
            Application Tracker
          </h1>

          <p className="mt-2 text-slate-400">
            Track your job applications and career progress.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-purple-500/20 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-400">
              Wishlist
            </p>

            <p className="mt-3 text-4xl font-bold">
              {counts.Wishlist}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-400">
              Applied
            </p>

            <p className="mt-3 text-4xl font-bold">
              {counts.Applied}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-400">
              Interview
            </p>

            <p className="mt-3 text-4xl font-bold">
              {counts.Interview}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-400">
              Offer
            </p>

            <p className="mt-3 text-4xl font-bold">
              {counts.Offer}
            </p>
          </div>

        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-12 text-center">
            <p className="text-cyan-400">
              Loading your applications...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">

            <h2 className="font-bold text-red-400">
              Unable to load applications
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              {error}
            </p>

            <Link
              href="/login"
              className="mt-5 inline-block rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950"
            >
              Go to Login
            </Link>

          </div>
        )}

        {!loading &&
          !error &&
          applications.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-12 text-center">

              <div className="text-5xl">
                📋
              </div>

              <h2 className="mt-5 text-xl font-bold">
                No applications yet
              </h2>

              <p className="mt-2 text-slate-400">
                Explore jobs and apply to opportunities
                that match your skills.
              </p>

              <Link
                href="/jobs"
                className="mt-6 inline-block rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300"
              >
                Explore Jobs
              </Link>

            </div>
          )}

        {!loading &&
          !error &&
          applications.length > 0 && (
            <div className="space-y-5">

              {applications.map((application) => {
                const job = application.job;

                return (
                  <div
                    key={application.id}
                    className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6 transition hover:border-cyan-400/20"
                  >

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-3">

                          <h2 className="text-xl font-bold">
                            {job?.title || "Unknown Job"}
                          </h2>

                          <span
                            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                              application.status === "Offer"
                                ? "bg-green-500/10 text-green-400"
                                : application.status === "Interview"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : application.status === "Applied"
                                    ? "bg-cyan-500/10 text-cyan-400"
                                    : "bg-purple-500/10 text-purple-400"
                            }`}
                          >
                            {application.status}
                          </span>

                        </div>

                        <p className="mt-2 text-cyan-400">
                          {job?.company || "Unknown Company"}
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                          📍 {job?.location || "India"}
                        </p>

                        <p className="mt-3 text-xs text-slate-500">
                          Applied on{" "}
                          {new Date(
                            application.applied_at
                          ).toLocaleDateString("en-IN")}
                        </p>

                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">

                        <select
                          value={application.status}
                          onChange={(event) =>
                            handleStatusChange(
                              application.id,
                              event.target.value as ApplicationStatus
                            )
                          }
                          className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                        >
                          {statuses.map((status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() =>
                            handleRemove(application.id)
                          }
                          className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10"
                        >
                          Remove
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

      </div>
    </main>
  );
}