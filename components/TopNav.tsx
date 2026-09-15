"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const aiCareerItems = [
  {
    name: "AI Career Assistant",
    href: "/ai-assistant",
    description: "Ask personalized career questions",
  },
  {
    name: "Career Recommendations",
    href: "/recommendations",
    description: "Find careers that match your skills",
  },
  {
    name: "Skill Gap Analysis",
    href: "/skill-gap",
    description: "Discover missing and weak skills",
  },
  {
    name: "Career Coach",
    href: "/career-coach",
    description: "Build your career roadmap",
  },
  {
    name: "Resume Analyzer",
    href: "/resume-analyzer",
    description: "Check ATS score and improve your resume",
  },
  {
    name: "Interview Coach",
    href: "/interview-coach",
    description: "Practice role-specific interviews",
  },
];

export default function TopNav() {
  const [aiOpen, setAiOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function updateDropdownPosition() {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    setDropdownPosition({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  }

  useEffect(() => {
    if (!aiOpen) return;

    updateDropdownPosition();

    function handleResize() {
      updateDropdownPosition();
    }

    function handleScroll() {
      updateDropdownPosition();
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [aiOpen]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        buttonRef.current &&
        buttonRef.current.contains(target)
      ) {
        return;
      }

      if (
        dropdownRef.current &&
        dropdownRef.current.contains(target)
      ) {
        return;
      }

      setAiOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setAiOpen(false);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        setLoggingOut(false);
        return;
      }

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-[100] border-b border-white/10 bg-[#0B1F3A]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">

          {/* LOGO */}
          <Link
            href="/"
            className="shrink-0 whitespace-nowrap text-xl font-black tracking-tight text-white sm:text-2xl"
          >
            Skill
            <span className="text-blue-500">Track</span>
          </Link>

          {/* NAVIGATION */}
          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
            <nav className="flex min-w-max items-center justify-center gap-0.5 whitespace-nowrap sm:gap-1">

              <Link
                href="/"
                className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm"
              >
                Dashboard
              </Link>

              <Link
                href="/jobs"
                className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm"
              >
                Jobs
              </Link>

              {/* AI CAREER */}
              <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                  updateDropdownPosition();
                  setAiOpen((current) => !current);
                }}
                aria-expanded={aiOpen}
                aria-haspopup="menu"
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                  aiOpen
                    ? "bg-blue-600/15 text-cyan-300"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>AI Career</span>
                <span
                  className={`text-[9px] text-slate-400 transition-transform duration-200 ${
                    aiOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              <Link
                href="/applications"
                className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm"
              >
                Applications
              </Link>

              <Link
                href="/profile"
                className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm"
              >
                Profile
              </Link>
            </nav>
          </div>

          {/* ACTIONS */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/skills"
              className="whitespace-nowrap rounded-xl bg-blue-600 px-2.5 py-2.5 text-[10px] font-black text-white transition hover:bg-blue-500 sm:px-4 sm:text-sm"
            >
              Update Skills
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="whitespace-nowrap rounded-xl border border-red-400/20 bg-red-400/10 px-2.5 py-2.5 text-[10px] font-black text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* AI CAREER DROPDOWN */}
      {aiOpen && (
        <div
          ref={dropdownRef}
          role="menu"
          style={{
            position: "fixed",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            transform: "translateX(-50%)",
          }}
          className="z-[9999] w-[290px] overflow-hidden rounded-2xl border border-white/10 bg-[#10294A] p-2 shadow-2xl shadow-black/50 sm:w-[330px]"
        >
          <div className="px-3 pb-2 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">
              AI CAREER TOOLS
            </p>
          </div>

          {aiCareerItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setAiOpen(false)}
              className="block rounded-xl px-4 py-3 transition hover:bg-cyan-400/10"
            >
              <p className="text-sm font-semibold text-white">
                {item.name}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
