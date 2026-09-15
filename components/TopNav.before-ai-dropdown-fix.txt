"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function TopNav() {
  const [aiOpen, setAiOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setAiOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1F3A]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* LOGO */}
        <Link
          href="/"
          className="shrink-0 text-2xl font-black tracking-tight"
        >
          Skill
          <span className="text-blue-500">Track</span>
        </Link>

        {/* NAVIGATION */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <nav className="scrollbar-none flex items-center justify-start gap-1 overflow-x-auto whitespace-nowrap sm:justify-center sm:gap-2">
            <Link
              href="/"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4"
            >
              Dashboard
            </Link>

            <Link
              href="/jobs"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4"
            >
              Jobs
            </Link>

            {/* AI CAREER */}
            <div
              ref={dropdownRef}
              className="relative shrink-0"
            >
              <button
                type="button"
                onClick={() =>
                  setAiOpen((current) => !current)
                }
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4"
              >
                <span>AI Career</span>

                <span
                  aria-hidden="true"
                  className={`relative mt-[-2px] h-2 w-2 border-b-2 border-r-2 border-slate-400 transition-transform duration-200 ${
                    aiOpen
                      ? "translate-y-0.5 rotate-225"
                      : "rotate-45"
                  }`}
                />
              </button>

              {aiOpen && (
                <div className="absolute left-1/2 top-full z-[100] mt-2 w-[290px] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#10294A] p-2 shadow-2xl shadow-black/30">
                  <Link
                    href="/ai-assistant"
                    onClick={() => setAiOpen(false)}
                    className="block rounded-xl px-4 py-3 transition hover:bg-white/5"
                  >
                    <p className="font-semibold text-white">
                      AI Career Assistant
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Ask personalized career questions
                    </p>
                  </Link>

                  <Link
                    href="/recommendations"
                    onClick={() => setAiOpen(false)}
                    className="block rounded-xl px-4 py-3 transition hover:bg-white/5"
                  >
                    <p className="font-semibold text-white">
                      Career Recommendations
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Discover your best career paths
                    </p>
                  </Link>

                  <Link
                    href="/skill-gap"
                    onClick={() => setAiOpen(false)}
                    className="block rounded-xl px-4 py-3 transition hover:bg-white/5"
                  >
                    <p className="font-semibold text-white">
                      Skill Gap Analysis
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Find missing and improving skills
                    </p>
                  </Link>

                  <Link
                    href="/career-coach"
                    onClick={() => setAiOpen(false)}
                    className="block rounded-xl px-4 py-3 transition hover:bg-white/5"
                  >
                    <p className="font-semibold text-white">
                      Career Coach
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Build your personalized roadmap
                    </p>
                  </Link>

                  <Link
                    href="/resume-analyzer"
                    onClick={() => setAiOpen(false)}
                    className="block rounded-xl px-4 py-3 transition hover:bg-white/5"
                  >
                    <p className="font-semibold text-white">
                      Resume Analyzer
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Check your ATS readiness
                    </p>
                  </Link>

                  <Link
                    href="/interview-coach"
                    onClick={() => setAiOpen(false)}
                    className="block rounded-xl px-4 py-3 transition hover:bg-white/5"
                  >
                    <p className="font-semibold text-white">
                      Interview Coach
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Practice interview questions
                    </p>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/applications"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4"
            >
              Applications
            </Link>

            <Link
              href="/profile"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4"
            >
              Profile
            </Link>
          </nav>
        </div>

        {/* UPDATE SKILLS */}
        <Link
          href="/skills"
          className="shrink-0 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-black text-white transition hover:bg-blue-500 sm:px-4 sm:text-sm"
        >
          Update Skills
        </Link>
      </div>
    </header>
  );
}