"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
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
        setError(loginError.message);
        return;
      }

      if (!data.user) {
        setError("Login could not be completed. Please try again.");
        return;
      }

      setMessage("Login successful. Redirecting...");

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 600);
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B1F3A] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-[#10294A] p-6 shadow-2xl shadow-black/30 sm:p-8">

          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-block text-3xl font-black tracking-tight"
            >
              Skill
              <span className="text-blue-500">Track</span>
            </Link>

            <h1 className="mt-6 text-2xl font-black">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Login to continue your career journey.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-[#0B1F3A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-[#0B1F3A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-7 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-blue-400 transition hover:text-cyan-300"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 transition hover:text-slate-300"
            >
              Back to Dashboard
            </Link>
          </div>

        </section>
      </div>
    </main>
  );
}
