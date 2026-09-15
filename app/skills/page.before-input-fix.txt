"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Skill = {
  name: string;
  level: number;
};

const fallbackSkills: Skill[] = [
  { name: "JavaScript", level: 85 },
  { name: "React", level: 78 },
  { name: "Next.js", level: 72 },
  { name: "Node.js", level: 68 },
  { name: "SQL", level: 62 },
  { name: "Python", level: 55 },
];

function normalizeSkills(value: unknown): Skill[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return {
          name: item.trim(),
          level: 70,
        };
      }

      if (
        item &&
        typeof item === "object" &&
        "name" in item
      ) {
        const skill = item as {
          name?: unknown;
          level?: unknown;
        };

        const name = String(skill.name ?? "").trim();
        const level = Number(skill.level ?? 70);

        if (!name) {
          return null;
        }

        return {
          name,
          level: Math.max(0, Math.min(100, Number.isFinite(level) ? level : 70)),
        };
      }

      return null;
    })
    .filter(Boolean) as Skill[];
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);

  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState(50);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSkills() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      const savedSkills = normalizeSkills(data?.skills);

      setSkills(savedSkills);
    } catch (err) {
      console.error("Skills loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your skills."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSkills();
  }, []);

  async function saveSkills(updatedSkills: Skill[]) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        window.location.href = "/login";
        return false;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          skills: updatedSkills,
        })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSkills(updatedSkills);

      return true;
    } catch (err) {
      console.error("Skills save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your skills."
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function addSkill() {
    setMessage("");
    setError("");

    const cleanedName = skillName.trim();

    if (!cleanedName) {
      setError("Please enter a skill name.");
      return;
    }

    const duplicate = skills.some(
      (skill) =>
        skill.name.trim().toLowerCase() ===
        cleanedName.toLowerCase()
    );

    if (duplicate) {
      setError("This skill already exists.");
      return;
    }

    const newSkill: Skill = {
      name: cleanedName,
      level: skillLevel,
    };

    const updatedSkills = [...skills, newSkill];

    const success = await saveSkills(updatedSkills);

    if (!success) {
      return;
    }

    setSkillName("");
    setSkillLevel(50);
    setShowForm(false);
    setMessage("Skill added successfully.");
  }

  function startEdit(skill: Skill) {
    setEditingSkill(skill.name);
    setSkillName(skill.name);
    setSkillLevel(skill.level);
    setShowForm(true);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function updateSkill() {
    setMessage("");
    setError("");

    const cleanedName = skillName.trim();

    if (!cleanedName) {
      setError("Please enter a skill name.");
      return;
    }

    if (!editingSkill) {
      return;
    }

    const duplicate = skills.some(
      (skill) =>
        skill.name.trim().toLowerCase() ===
          cleanedName.toLowerCase() &&
        skill.name !== editingSkill
    );

    if (duplicate) {
      setError("Another skill with this name already exists.");
      return;
    }

    const updatedSkills = skills.map((skill) =>
      skill.name === editingSkill
        ? {
            name: cleanedName,
            level: skillLevel,
          }
        : skill
    );

    const success = await saveSkills(updatedSkills);

    if (!success) {
      return;
    }

    setEditingSkill(null);
    setSkillName("");
    setSkillLevel(50);
    setShowForm(false);
    setMessage("Skill updated successfully.");
  }

  async function removeSkill(skillNameToRemove: string) {
    const confirmed = window.confirm(
      `Remove "${skillNameToRemove}" from your skills?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    const updatedSkills = skills.filter(
      (skill) => skill.name !== skillNameToRemove
    );

    const success = await saveSkills(updatedSkills);

    if (!success) {
      return;
    }

    if (editingSkill === skillNameToRemove) {
      cancelForm();
    }

    setMessage("Skill removed successfully.");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingSkill(null);
    setSkillName("");
    setSkillLevel(50);
    setMessage("");
    setError("");
  }

  const averageProficiency = useMemo(() => {
    if (skills.length === 0) {
      return 0;
    }

    return Math.round(
      skills.reduce((total, skill) => total + skill.level, 0) /
        skills.length
    );
  }, [skills]);

  const strongestSkill = useMemo(() => {
    if (skills.length === 0) {
      return null;
    }

    return [...skills].sort((a, b) => b.level - a.level)[0];
  }, [skills]);

  const skillCategory = (level: number) => {
    if (level >= 85) {
      return "Expert";
    }

    if (level >= 70) {
      return "Advanced";
    }

    if (level >= 50) {
      return "Intermediate";
    }

    return "Beginner";
  };

  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#10294A] p-5 md:block">
          <div className="mb-10 flex items-center gap-3">
            <Link href="/">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                S
              </div>
            </Link>

            <div>
              <h1 className="text-xl font-bold">
                SkillTrack
              </h1>

              <p className="text-xs text-slate-400">
                Career Intelligence
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            <Link
              href="/"
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/skills"
              className="block rounded-xl bg-blue-600/15 px-4 py-3 text-sm font-semibold text-blue-400"
            >
              My Skills
            </Link>

            <Link
              href="/jobs"
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Jobs
            </Link>

            <Link
              href="/skill-gap"
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Skill Gap
            </Link>

            <Link
              href="/recommendations"
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Recommendations
            </Link>

            <Link
              href="/career-coach"
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Career Coach
            </Link>

            <Link
              href="/resume-analyzer"
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Resume Analyzer
            </Link>

            <Link
              href="/interview-coach"
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Interview Coach
            </Link>

            <Link
              href="/applications"
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Applications
            </Link>

            <Link
              href="/profile"
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Profile
            </Link>
          </nav>

          <div className="mt-10 rounded-2xl border border-blue-600/20 bg-blue-600/5 p-4">
            <p className="text-xs text-slate-400">
              Profile completion
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700">
              <div className="h-full w-[82%] rounded-full bg-blue-600" />
            </div>

            <p className="mt-2 text-sm font-semibold">
              82% complete
            </p>
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          {/* HEADER */}
          <header className="flex items-center justify-between border-b border-white/10 bg-[#10294A]/90 px-5 py-5 backdrop-blur md:px-8">
            <div>
              <p className="text-sm text-slate-400">
                Career Dashboard
              </p>

              <h2 className="mt-1 text-xl font-bold md:text-2xl">
                My Skills
              </h2>
            </div>

            <Link
              href="/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-slate-950"
            >
              R
            </Link>
          </header>

          <div className="space-y-7 p-5 md:p-8">
            {/* TITLE */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-3xl font-bold">
                  Your Skills
                </h3>

                <p className="mt-2 text-slate-400">
                  Manage your skills and proficiency levels.
                </p>
              </div>

              {!showForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(true);
                    setMessage("");
                    setError("");
                  }}
                  className="min-h-11 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  + Add Skill
                </button>
              )}
            </div>

            {/* STATUS MESSAGE */}
            {message && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* ADD / EDIT FORM */}
            {showForm && (
              <div className="rounded-2xl border border-blue-600/20 bg-[#163456] p-5 md:p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold">
                      {editingSkill
                        ? "Edit Skill"
                        : "Add New Skill"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {editingSkill
                        ? "Update the skill name or proficiency level."
                        : "Add a skill to your career profile."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Skill Name
                    </label>

                    <input
                      type="text"
                      value={skillName}
                      onChange={(e) =>
                        setSkillName(e.target.value)
                      }
                      placeholder="e.g. TypeScript"
                      className="w-full rounded-xl border border-white/10 bg-[#0B1F3A] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-300">
                        Proficiency
                      </label>

                      <span className="text-sm font-bold text-cyan-400">
                        {skillLevel}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skillLevel}
                      onChange={(e) =>
                        setSkillLevel(Number(e.target.value))
                      }
                      className="mt-4 w-full accent-cyan-400"
                    />

                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>Beginner</span>
                      <span>Intermediate</span>
                      <span>Advanced</span>
                      <span>Expert</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={
                      editingSkill ? updateSkill : addSkill
                    }
                    disabled={saving}
                    className="min-h-11 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingSkill
                        ? "Update Skill"
                        : "Add Skill"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelForm}
                    disabled={saving}
                    className="min-h-11 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* SUMMARY */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#163456] p-5">
                <p className="text-sm text-slate-400">
                  Total Skills
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {loading ? "—" : skills.length}
                </p>

                <p className="mt-2 text-xs text-blue-400">
                  Skills in your profile
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#163456] p-5">
                <p className="text-sm text-slate-400">
                  Average Proficiency
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {loading ? "—" : `${averageProficiency}%`}
                </p>

                <p className="mt-2 text-xs text-emerald-400">
                  Overall skill level
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#163456] p-5">
                <p className="text-sm text-slate-400">
                  Strongest Skill
                </p>

                <p className="mt-2 truncate text-2xl font-bold">
                  {loading
                    ? "—"
                    : strongestSkill?.name || "None"}
                </p>

                <p className="mt-2 text-xs text-cyan-400">
                  {strongestSkill
                    ? `${strongestSkill.level}% proficiency`
                    : "Add your first skill"}
                </p>
              </div>
            </div>

            {/* SKILLS LIST */}
            <div className="rounded-2xl border border-white/10 bg-[#163456] p-5 md:p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold">
                  Skill Proficiency
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Your skills are stored in your SkillTrack profile.
                </p>
              </div>

              {loading ? (
                <div className="space-y-5">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse"
                    >
                      <div className="mb-3 h-5 w-32 rounded bg-white/10" />
                      <div className="h-3 w-full rounded-full bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : skills.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-2xl text-blue-400">
                    +
                  </div>

                  <h4 className="mt-4 text-lg font-bold">
                    No skills added yet
                  </h4>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                    Add your first skill to improve your job
                    matching, recommendations and skill-gap analysis.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(true);
                      setMessage("");
                      setError("");
                    }}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
                  >
                    Add Your First Skill
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-sm font-bold text-blue-400">
                            {skill.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {skill.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {skillCategory(skill.level)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:justify-end">
                          <span className="text-sm font-semibold text-slate-300">
                            {skill.level}%
                          </span>

                          <button
                            type="button"
                            onClick={() => startEdit(skill)}
                            className="rounded-lg border border-blue-400/20 px-3 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-400/10"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeSkill(skill.name)
                            }
                            disabled={saving}
                            className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-400/10 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                          style={{
                            width: `${skill.level}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-5">
              <h4 className="font-semibold text-cyan-300">
                Why your skill profile matters
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Your skills help SkillTrack calculate job matches,
                identify skill gaps and personalize career
                recommendations.
              </p>
            </div>

            <Link
              href="/"
              className="inline-block text-sm font-semibold text-blue-400 transition hover:text-cyan-300"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}