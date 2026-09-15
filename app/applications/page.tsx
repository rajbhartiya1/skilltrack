"use client";

import { DragEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Application,
  ApplicationStatus,
  getApplications,
  removeApplication,
  updateApplicationStatus,
} from "../../lib/applications";

const columns: {
  status: ApplicationStatus;
  title: string;
  description: string;
}[] = [
  {
    status: "Wishlist",
    title: "Wishlist",
    description: "Jobs you want to apply for",
  },
  {
    status: "Applied",
    title: "Applied",
    description: "Applications you have submitted",
  },
  {
    status: "Interview",
    title: "Interview",
    description: "Companies that invited you",
  },
  {
    status: "Offer",
    title: "Offer",
    description: "Offers received",
  },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [draggedApplication, setDraggedApplication] =
    useState<Application | null>(null);
  const [message, setMessage] = useState("");

  async function loadApplications() {
    setLoading(true);

    const result = await getApplications();

    if (result.error) {
      setMessage(result.error);
      setApplications([]);
    } else {
      setApplications(result.data);
      setMessage("");
    }

    setLoading(false);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadApplications();
    });
  }, []);

  const groupedApplications = useMemo(() => {
    return {
      Wishlist: applications.filter(
        (application) => application.status === "Wishlist"
      ),
      Applied: applications.filter(
        (application) => application.status === "Applied"
      ),
      Interview: applications.filter(
        (application) => application.status === "Interview"
      ),
      Offer: applications.filter(
        (application) => application.status === "Offer"
      ),
    };
  }, [applications]);

  const totalApplications = applications.length;

  const interviewRate =
    totalApplications > 0
      ? Math.round(
          (groupedApplications.Interview.length /
            totalApplications) *
            100
        )
      : 0;

  const offerRate =
    totalApplications > 0
      ? Math.round(
          (groupedApplications.Offer.length /
            totalApplications) *
            100
        )
      : 0;

  const activeApplications =
    groupedApplications.Applied.length +
    groupedApplications.Interview.length;

  async function changeStatus(
    applicationId: string,
    newStatus: ApplicationStatus
  ) {
    const currentApplication = applications.find(
      (application) => application.id === applicationId
    );

    if (!currentApplication) {
      return;
    }

    if (currentApplication.status === newStatus) {
      return;
    }

    setUpdating(applicationId);
    setMessage("");

    const result = await updateApplicationStatus(
      applicationId,
      newStatus
    );

    if (!result.success) {
      setMessage(result.message);
      setUpdating(null);
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

    setUpdating(null);
    setMessage(`Moved to ${newStatus}.`);

    setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  async function handleRemove(applicationId: string) {
    const confirmed = window.confirm(
      "Remove this application from your tracker?"
    );

    if (!confirmed) {
      return;
    }

    setUpdating(applicationId);
    setMessage("");

    const result = await removeApplication(applicationId);

    if (!result.success) {
      setMessage(result.message);
      setUpdating(null);
      return;
    }

    setApplications((current) =>
      current.filter(
        (application) => application.id !== applicationId
      )
    );

    setUpdating(null);
    setMessage("Application removed.");

    setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    application: Application
  ) {
    setDraggedApplication(application);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "text/plain",
      application.id
    );
  }

  function handleDragEnd() {
    setDraggedApplication(null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(
    event: DragEvent<HTMLDivElement>,
    status: ApplicationStatus
  ) {
    event.preventDefault();

    const applicationId =
      event.dataTransfer.getData("text/plain");

    const application =
      draggedApplication ||
      applications.find(
        (item) => item.id === applicationId
      );

    if (!application) {
      return;
    }

    setDraggedApplication(null);

    await changeStatus(application.id, status);
  }

  function formatDate(date: string) {
    if (!date) {
      return "Recently";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">

      {/* NAVBAR */}
      <header className="hidden sticky top-0 z-50 border-b border-white/10 bg-[#0B1F3A]/95 backdrop-blur-xl">
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
                    Discover careers matching your skills
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

                  <div className="mt-1 text-xs text-slate-500">
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

                  <div className="mt-1 text-xs text-slate-500">
                    Check ATS and resume readiness
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
                    Practice role-based interviews
                  </div>
                </Link>

              </div>
            </div>

            <Link
              href="/applications"
              className="font-semibold text-blue-600"
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
            href="/profile"
            className="rounded-xl border border-blue-600/30 bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-600/20"
          >
            My Profile
          </Link>

        </div>
      </header>

      {/* PAGE */}
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* HERO */}
        <section className="mb-8 rounded-3xl border border-blue-600/20 bg-gradient-to-br from-[#10294A] via-[#0B1F3A] to-[#163456] p-8 shadow-2xl shadow-cyan-500/5">

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">

            <div className="max-w-3xl">

              <div className="mb-4 inline-flex rounded-full border border-blue-600/20 bg-blue-600/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-300">
                Employment Tracker
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Track every opportunity.
                <span className="block text-blue-600">
                  Move toward employment.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                Manage your job applications from wishlist to offer
                and keep your entire employment journey organized in
                one place.
              </p>

            </div>

            <Link
              href="/jobs"
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 font-bold text-slate-950 transition hover:bg-blue-500"
            >
              Explore Jobs
            </Link>

          </div>

        </section>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-2xl border border-blue-600/20 bg-blue-600/10 px-5 py-4 text-sm text-blue-300">
            {message}
          </div>
        )}

        {/* STATS */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-[#10294A] p-6">
            <p className="text-sm text-slate-500">
              Total Tracked
            </p>

            <p className="mt-2 text-4xl font-black">
              {totalApplications}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              All opportunities
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#10294A] p-6">
            <p className="text-sm text-slate-500">
              Active Applications
            </p>

            <p className="mt-2 text-4xl font-black text-blue-600">
              {activeApplications}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Applied + Interview
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#10294A] p-6">
            <p className="text-sm text-slate-500">
              Interview Rate
            </p>

            <p className="mt-2 text-4xl font-black">
              {interviewRate}%
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Tracked opportunities
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#10294A] p-6">
            <p className="text-sm text-slate-500">
              Offer Rate
            </p>

            <p className="mt-2 text-4xl font-black text-teal-400">
              {offerRate}%
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Tracked opportunities
            </p>
          </div>

        </section>

        {/* INSTRUCTION */}
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="text-2xl font-black">
              Application Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Drag a job card between columns to update its status.
            </p>
          </div>

          <button
            onClick={loadApplications}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

        </div>

        {/* KANBAN */}
        {loading ? (
          <section className="grid gap-5 lg:grid-cols-4">

            {columns.map((column) => (
              <div
                key={column.status}
                className="min-h-[420px] animate-pulse rounded-3xl border border-white/10 bg-[#0a1626] p-4"
              >
                <div className="h-6 w-28 rounded bg-white/10" />

                <div className="mt-6 h-40 rounded-2xl bg-white/5" />

                <div className="mt-4 h-40 rounded-2xl bg-white/5" />
              </div>
            ))}

          </section>
        ) : (
          <section className="grid gap-5 lg:grid-cols-4">

            {columns.map((column) => {

              const items =
                groupedApplications[column.status];

              return (
                <div
                  key={column.status}
                  onDragOver={handleDragOver}
                  onDrop={(event) =>
                    handleDrop(event, column.status)
                  }
                  className="min-h-[430px] rounded-3xl border border-white/10 bg-[#163456] p-4 transition hover:border-blue-600/20"
                >

                  {/* COLUMN HEADER */}
                  <div className="mb-5 flex items-start justify-between gap-3">

                    <div>
                      <h3 className="font-bold text-white">
                        {column.title}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {column.description}
                      </p>
                    </div>

                    <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white/5 px-2 text-sm font-bold text-slate-300">
                      {items.length}
                    </div>

                  </div>

                  {/* CARDS */}
                  <div className="space-y-3">

                    {items.map((application) => {

                      const job = application.job;

                      return (
                        <div
                          key={application.id}
                          draggable
                          onDragStart={(event) =>
                            handleDragStart(
                              event,
                              application
                            )
                          }
                          onDragEnd={handleDragEnd}
                          className={`group cursor-grab rounded-2xl border border-white/10 bg-[#0d1c2e] p-4 shadow-lg transition hover:-translate-y-1 hover:border-blue-600/30 hover:bg-[#102238] active:cursor-grabbing ${
                            draggedApplication?.id ===
                            application.id
                              ? "scale-[0.98] opacity-50"
                              : ""
                          }`}
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <h4 className="truncate font-bold text-white">
                                {job?.title ||
                                  "Unknown Position"}
                              </h4>

                              <p className="mt-1 truncate text-sm text-blue-300">
                                {job?.company ||
                                  "Unknown Company"}
                              </p>

                            </div>

                            <div className="text-slate-600 transition group-hover:text-blue-600">
                              ::
                            </div>

                          </div>

                          <div className="mt-4 space-y-2">

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="text-slate-600">
                                Location
                              </span>

                              <span className="truncate text-slate-400">
                                {job?.location ||
                                  "India"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="text-slate-600">
                                Added
                              </span>

                              <span className="text-slate-400">
                                {formatDate(
                                  application.applied_at
                                )}
                              </span>
                            </div>

                          </div>

                          {/* QUICK STATUS */}
                          <div className="mt-4 flex gap-2">

                            {column.status !== "Wishlist" && (
                              <button
                                onClick={() =>
                                  changeStatus(
                                    application.id,
                                    "Wishlist"
                                  )
                                }
                                disabled={
                                  updating ===
                                  application.id
                                }
                                className="flex-1 rounded-lg border border-white/10 px-2 py-2 text-[11px] font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                              >
                                Wishlist
                              </button>
                            )}

                            {column.status !== "Applied" && (
                              <button
                                onClick={() =>
                                  changeStatus(
                                    application.id,
                                    "Applied"
                                  )
                                }
                                disabled={
                                  updating ===
                                  application.id
                                }
                                className="flex-1 rounded-lg border border-white/10 px-2 py-2 text-[11px] font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                              >
                                Applied
                              </button>
                            )}

                            {column.status !== "Interview" && (
                              <button
                                onClick={() =>
                                  changeStatus(
                                    application.id,
                                    "Interview"
                                  )
                                }
                                disabled={
                                  updating ===
                                  application.id
                                }
                                className="flex-1 rounded-lg border border-white/10 px-2 py-2 text-[11px] font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                              >
                                Interview
                              </button>
                            )}

                            {column.status !== "Offer" && (
                              <button
                                onClick={() =>
                                  changeStatus(
                                    application.id,
                                    "Offer"
                                  )
                                }
                                disabled={
                                  updating ===
                                  application.id
                                }
                                className="flex-1 rounded-lg border border-white/10 px-2 py-2 text-[11px] font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                              >
                                Offer
                              </button>
                            )}

                          </div>

                          {/* REMOVE */}
                          <button
                            onClick={() =>
                              handleRemove(application.id)
                            }
                            disabled={
                              updating === application.id
                            }
                            className="mt-3 w-full rounded-lg px-2 py-2 text-xs font-semibold text-red-400/70 transition hover:bg-red-400/10 hover:text-red-400 disabled:opacity-40"
                          >
                            Remove from Tracker
                          </button>

                        </div>
                      );
                    })}

                    {/* EMPTY STATE */}
                    {items.length === 0 && (
                      <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-5 text-center">

                        <div className="text-sm font-semibold text-slate-500">
                          No opportunities here
                        </div>

                        <div className="mt-1 text-xs leading-5 text-slate-600">
                          Drag a job card here to move it
                        </div>

                      </div>
                    )}

                  </div>

                </div>
              );
            })}

          </section>
        )}

        {/* BOTTOM CTA */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-[#10294A] p-8">

          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Keep moving forward
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Improve your skills and unlock better opportunities.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Use SkillTrack AI to identify skill gaps, improve your
                profile, analyze your resume, and prepare for interviews.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href="/skill-gap"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold transition hover:bg-white/10"
              >
                Skill Gap
              </Link>

              <Link
                href="/recommendations"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-500"
              >
                AI Career
              </Link>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}
