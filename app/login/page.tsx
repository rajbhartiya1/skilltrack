"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        window.location.href = "/";
        return;
      }
    } catch (err) {
      console.error("Session check error:", err);
    } finally {
      setCheckingSession(false);
    }
  }

  function getFriendlyError(errorMessage: string) {
    const message = errorMessage.toLowerCase();

    if (
      message.includes("invalid login credentials") ||
      message.includes("invalid credentials")
    ) {
      return "Invalid email or password. Please check both fields and try again.";
    }

    if (message.includes("email not confirmed")) {
      return "Your email has not been confirmed yet. Please confirm your email before logging in.";
    }

    if (message.includes("too many requests")) {
      return "Too many login attempts. Please wait a little and try again.";
    }

    if (message.includes("rate limit")) {
      return "Too many requests right now. Please wait a little before trying again.";
    }

    if (message.includes("user not found")) {
      return "No account was found with this email. Please sign up first.";
    }

    return errorMessage;
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        console.error("Supabase login error:", loginError);

        setError(getFriendlyError(loginError.message));
        return;
      }

      if (!data.user) {
        setError(
          "Login could not be completed. Please try again."
        );
        return;
      }

      setMessage("Login successful. Redirecting...");

      window.location.href = "/";
    } catch (err) {
      console.error("Login error:", err);

      setError(
        "Something went wrong while logging in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111F] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

          <p className="mt-4 text-sm text-slate-400">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111F] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[90vh] max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-[#10294A] p-7 shadow-2xl md:p-9">
          {/* LOGO */}
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-lg shadow-blue-600/20"
            >
              S
            </Link>

            <h1 className="mt-5 text-3xl font-black tracking-tight">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Login to your SkillTrack career dashboard.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-300">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {message && (
            <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-300">
              {message}
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={loading}
                className="block w-full rounded-xl border border-white/10 bg-[#07111F] px-4 py-3.5 text-base text-white caret-cyan-400 outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="block w-full rounded-xl border border-white/10 bg-[#07111F] px-4 py-3.5 text-base text-white caret-cyan-400 outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />

            <span className="text-xs text-slate-500">
              New to SkillTrack?
            </span>

            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* SIGNUP */}
          <Link
            href="/signup"
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/5 hover:text-cyan-300"
          >
            Create a new account
          </Link>

          {/* BACK */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-500 transition hover:text-cyan-300"
            >
              ← Back to SkillTrack
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}