"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getApplications,
  removeApplication,
  updateApplicationStatus,
  ApplicationStatus,
  Application,
} from "../../lib/applications";

const STATUSES: ApplicationStatus[] = [
  "Wishlist",
  "Applied",
  "Interview",
  "Offer",
];

const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    icon: string;
    description: string;
    color: string;
    badge: string;
  }
> = {
  Wishlist: {
    label: "Wishlist",
    icon: "â™¡",
    description: "Jobs you want to apply for",
    color: "purple",
    badge: "bg-purple-400/10 text-purple-300 border-purple-400/20",
  },

  Applied: {
    label: "Applied",
    icon: "ðŸ“¤",
    description: "Applications you submitted",
    color: "cyan",
    badge: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  },

  Interview: {
    label: "Interview",
    icon: "ðŸŽ¤",
    description: "Interview opportunities",
    color: "yellow",
    badge: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  },

  Offer: {
    label: "Offer",
    icon: "ðŸŽ‰",
    description: "Offers you received",
    color: "emerald",
    badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedApplication, setDraggedApplication] =
    useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function loadApplications() {
    try {
      setError("");

      const result = await getApplications();

      if (result.error) {
        setError(result.error);
        setApplications([]);
      } else {
        setApplications(
          (result.data || []) as Application[]
        );
      }
    } catch (err) {
      console.error(
        "Applications loading error:",
        err
      );

      setError(
        "Unable to load your applications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const groupedApplications = useMemo(() => {
    return {
      Wishlist: applications.filter(
        (application) =>
          application.status === "Wishlist"
      ),

      Applied: applications.filter(
        (application) =>
          application.status === "Applied"
      ),

      Interview: applications.filter(
        (application) =>
          application.status === "Interview"
      ),

      Offer: applications.filter(
        (application) =>
          application.status === "Offer"
      ),
    };
  }, [applications]);

  const totalApplications = applications.length;

  const progressPercentage = useMemo(() => {
    if (totalApplications === 0) {
      return 0;
    }

    const weightedScore =
      groupedApplications.Applied.length * 1 +
      groupedApplications.Interview.length * 2 +
      groupedApplications.Offer.length * 3;

    const maximumScore =
      totalApplications * 3;

    return Math.min(
      100,
      Math.round(
        (weightedScore / maximumScore) * 100
      )
    );
  }, [
    totalApplications,
    groupedApplications,
  ]);

  function handleDragStart(
    applicationId: string
  ) {
    setDraggedApplication(applicationId);
  }

  function handleDragEnd() {
    setDraggedApplication(null);
  }

  async function handleDrop(
    newStatus: ApplicationStatus
  ) {
    if (!draggedApplication) {
      return;
    }

    const applicationId =
      draggedApplication;

    const application = applications.find(
      (item) =>
        item.id === applicationId
    );

    setDraggedApplication(null);

    if (!application) {
      return;
    }

    if (application.status === newStatus) {
      return;
    }

    const oldStatus = application.status;

    setApplications((current) =>
      current.map((item) =>
        item.id === applicationId
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );

    setUpdatingId(applicationId);

    const result =
      await updateApplicationStatus(
        applicationId,
        newStatus
      );

    setUpdatingId("");

    if (!result.success) {
      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: oldStatus,
              }
            : item
        )
      );

      alert(
        result.message ||
          "Unable to update application."
      );
    }
  }

  async function handleStatusChange(
    applicationId: string,
    newStatus: ApplicationStatus
  ) {
    const application = applications.find(
      (item) =>
        item.id === applicationId
    );

    if (!application) {
      return;
    }

    if (application.status === newStatus) {
      return;
    }

    const oldStatus = application.status;

    setApplications((current) =>
      current.map((item) =>
        item.id === applicationId
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );

    setUpdatingId(applicationId);

    const result =
      await updateApplicationStatus(
        applicationId,
        newStatus
      );

    setUpdatingId("");

    if (!result.success) {
      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: oldStatus,
              }
            : item
        )
      );

      alert(
        result.message ||
          "Unable to update application."
      );
    }
  }

  async function handleDelete(
    applicationId: string
  ) {
    const application =
      applications.find(
        (item) =>
          item.id === applicationId
      );

    if (!application) {
      return;
    }

    const jobTitle =
      application.job?.title ||
      "this application";

    const confirmed = window.confirm(
      `Remove "${jobTitle}" from your application tracker?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(applicationId);

    const result =
      await removeApplication(
        applicationId
      );

    setDeletingId("");

    if (!result.success) {
      alert(
        result.message ||
          "Unable to remove application."
      );

      return;
    }

    setApplications((current) =>
      current.filter(
        (item) =>
          item.id !== applicationId
      )
    );
  }

  function formatDate(dateString: string) {
    if (!dateString) {
      return "Recently";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />

          <p className="mt-5 text-sm text-slate-400">
            Loading your application tracker...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* NAVBAR */}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Skill
            <span className="text-cyan-400">
              Track
            </span>
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
              className="transition hover:text-cyan-400"
            >
              AI Career
            </Link>

            <Link
              href="/applications"
              className="font-bold text-cyan-400"
            >
              Applications
            </Link>
          </nav>

          <Link
            href="/jobs"
            className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            + Find Jobs
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER */}

        <section className="mb-8">
          <Link
            href="/"
            className="text-sm text-cyan-400 transition hover:text-cyan-300"
          >
            â† Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                EMPLOYMENT TRACKER
              </p>

              <h1 className="mt-2 text-4xl font-black md:text-5xl">
                Application Pipeline
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Manage your job search from the first saved
                opportunity to the final offer.
              </p>
            </div>

            <Link
              href="/jobs"
              className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/20"
            >
              Explore Jobs â†’
            </Link>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
            <p className="font-semibold text-red-300">
              Unable to load applications
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {error}
            </p>

            <button
              onClick={loadApplications}
              className="mt-4 rounded-lg bg-red-400/10 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-400/20"
            >
              Try Again
            </button>
          </div>
        )}

        {/* SUMMARY */}

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-purple-400/10 bg-[#0d1b2e] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Wishlist
              </p>

              <span className="text-xl">
                â™¡
              </span>
            </div>

            <p className="mt-3 text-4xl font-black text-purple-300">
              {groupedApplications.Wishlist.length}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/10 bg-[#0d1b2e] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Applied
              </p>

              <span className="text-xl">
                ðŸ“¤
              </span>
            </div>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {groupedApplications.Applied.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/10 bg-[#0d1b2e] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Interviews
              </p>

              <span className="text-xl">
                ðŸŽ¤
              </span>
            </div>

            <p className="mt-3 text-4xl font-black text-yellow-300">
              {groupedApplications.Interview.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/10 bg-[#0d1b2e] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Offers
              </p>

              <span className="text-xl">
                ðŸŽ‰
              </span>
            </div>

            <p className="mt-3 text-4xl font-black text-emerald-300">
              {groupedApplications.Offer.length}
            </p>
          </div>
        </section>

        {/* SEARCH PROGRESS */}

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
                CAREER PROGRESS
              </p>

              <h2 className="mt-2 text-xl font-black">
                Job Search Momentum
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your pipeline progresses as applications move
                toward interviews and offers.
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-3xl font-black text-cyan-400">
                {progressPercentage}%
              </p>

              <p className="text-xs text-slate-600">
                Pipeline Progress
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </section>

        {/* KANBAN */}

        <section className="mt-8">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">
                Your Applications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Drag a card to another column to update its status.
              </p>
            </div>

            <p className="text-sm text-slate-500">
              {totalApplications}{" "}
              {totalApplications === 1
                ? "application"
                : "applications"}
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-4">
            {STATUSES.map((status) => {
              const config =
                STATUS_CONFIG[status];

              const items =
                groupedApplications[status];

              return (
                <div
                  key={status}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDrop={() =>
                    handleDrop(status)
                  }
                  className="flex min-h-[420px] flex-col rounded-2xl border border-white/10 bg-[#0b1728] p-4"
                >
                  {/* COLUMN HEADER */}

                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {config.icon}
                        </span>

                        <h3 className="font-bold">
                          {config.label}
                        </h3>
                      </div>

                      <span
                        className={`flex h-7 min-w-7 items-center justify-center rounded-lg border px-2 text-xs font-black ${config.badge}`}
                      >
                        {items.length}
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] leading-5 text-slate-600">
                      {config.description}
                    </p>
                  </div>

                  {/* CARDS */}

                  <div className="flex flex-1 flex-col gap-3">
                    {items.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center">
                        <span className="text-3xl opacity-40">
                          {config.icon}
                        </span>

                        <p className="mt-3 text-xs text-slate-600">
                          No jobs here yet
                        </p>

                        <p className="mt-1 text-[10px] text-slate-700">
                          Drag jobs into this column
                        </p>
                      </div>
                    ) : (
                      items.map((application) => {
                        const job =
                          application.job;

                        const isUpdating =
                          updatingId ===
                          application.id;

                        const isDeleting =
                          deletingId ===
                          application.id;

                        return (
                          <div
                            key={application.id}
                            draggable={!isUpdating}
                            onDragStart={() =>
                              handleDragStart(
                                application.id
                              )
                            }
                            onDragEnd={
                              handleDragEnd
                            }
                            className={`group rounded-xl border border-white/10 bg-[#0d1b2e] p-4 transition ${
                              draggedApplication ===
                              application.id
                                ? "scale-95 opacity-40"
                                : "hover:-translate-y-0.5 hover:border-cyan-400/30"
                            }`}
                          >
                            {/* COMPANY */}

                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                                  {job?.company ||
                                    "Company"}
                                </p>

                                <h4 className="mt-1 line-clamp-2 text-sm font-bold leading-5">
                                  {job?.title ||
                                    "Job Position"}
                                </h4>
                              </div>

                              <span className="cursor-grab text-slate-700 group-hover:text-slate-400">
                                â‹®â‹®
                              </span>
                            </div>

                            {/* LOCATION */}

                            <p className="mt-3 text-[11px] text-slate-600">
                              ðŸ“{" "}
                              {job?.location ||
                                "India"}
                            </p>

                            {/* DATE */}

                            <p className="mt-2 text-[11px] text-slate-600">
                              Added{" "}
                              {formatDate(
                                application.applied_at
                              )}
                            </p>

                            {/* STATUS SELECT */}

                            <div className="mt-4">
                              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Status
                              </label>

                              <select
                                value={
                                  application.status
                                }
                                disabled={
                                  isUpdating
                                }
                                onChange={(event) =>
                                  handleStatusChange(
                                    application.id,
                                    event.target
                                      .value as ApplicationStatus
                                  )
                                }
                                className="w-full rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-xs text-slate-300 outline-none transition focus:border-cyan-400/40"
                              >
                                {STATUSES.map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option
                                      }
                                      value={
                                        option
                                      }
                                    >
                                      {
                                        option
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            {/* ACTIONS */}

                            <div className="mt-4 flex items-center gap-2">
                              {job?.id && (
                                <Link
                                  href={`/jobs`}
                                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-[11px] font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
                                >
                                  View Jobs
                                </Link>
                              )}

                              <button
                                onClick={() =>
                                  handleDelete(
                                    application.id
                                  )
                                }
                                disabled={
                                  isDeleting
                                }
                                className="rounded-lg border border-red-400/10 bg-red-400/5 px-3 py-2 text-[11px] font-semibold text-red-400 transition hover:bg-red-400/10 disabled:opacity-40"
                              >
                                {isDeleting
                                  ? "..."
                                  : "Remove"}
                              </button>
                            </div>

                            {isUpdating && (
                              <p className="mt-3 text-center text-[10px] text-cyan-400">
                                Updating status...
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}

        <section className="mt-8 rounded-3xl border border-purple-400/20 bg-gradient-to-r from-purple-500/10 via-[#0d1b2e] to-cyan-400/10 p-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                HOW IT WORKS
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Manage your complete job search in one place.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Save interesting opportunities, apply to suitable
                jobs, move successful applications to interviews,
                and track offers as they arrive.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="rounded-xl bg-purple-400/10 px-4 py-3 text-xs font-semibold text-purple-300">
                â™¡ Save
              </div>

              <div className="rounded-xl bg-cyan-400/10 px-4 py-3 text-xs font-semibold text-cyan-300">
                ðŸ“¤ Apply
              </div>

              <div className="rounded-xl bg-yellow-400/10 px-4 py-3 text-xs font-semibold text-yellow-300">
                ðŸŽ¤ Interview
              </div>

              <div className="rounded-xl bg-emerald-400/10 px-4 py-3 text-xs font-semibold text-emerald-300">
                ðŸŽ‰ Offer
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}

        <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-7 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            KEEP MOVING FORWARD
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Find your next opportunity.
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Use your SkillTrack recommendations to discover jobs
            that match your current skills.
          </p>

          <Link
            href="/jobs"
            className="mt-6 inline-block rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Explore Jobs â†’
          </Link>
        </section>
      </div>
    </main>
  );
}
