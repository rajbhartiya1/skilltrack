"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Skill = {
  name: string;
  level: number;
};

function normalizeSkills(value: unknown): Skill[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        const name = item.trim();

        if (!name) {
          return null;
        }

        return {
          name,
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

        if (!name) {
          return null;
        }

        const rawLevel = Number(skill.level ?? 70);

        const level = Number.isFinite(rawLevel)
          ? Math.max(0, Math.min(100, Math.round(rawLevel)))
          : 70;

        return {
          name,
          level,
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

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    setLoading(true);
    setErrorMessage("");

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

      const { data, error } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      setSkills(normalizeSkills(data?.skills));
    } catch (error) {
      console.error("Load skills error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your skills."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveSkills(updatedSkills: Skill[]) {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

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

      const { error } = await supabase
        .from("profiles")
        .update({
          skills: updatedSkills,
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setSkills(updatedSkills);

      return true;
    } catch (error) {
      console.error("Save skills error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your skills."
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSkill() {
    setErrorMessage("");
    setSuccessMessage("");

    const cleanedName = skillName.trim();

    if (!cleanedName) {
      setErrorMessage("Please enter a skill name.");
      return;
    }

    const exists = skills.some(
      (skill) =>
        skill.name.toLowerCase() === cleanedName.toLowerCase()
    );

    if (exists) {
      setErrorMessage("This skill already exists.");
      return;
    }

    const newSkill: Skill = {
      name: cleanedName,
      level: skillLevel,
    };

    const updatedSkills = [...skills, newSkill];

    const saved = await saveSkills(updatedSkills);

    if (!saved) {
      return;
    }

    setSkillName("");
    setSkillLevel(50);
    setShowForm(false);

    setSuccessMessage(
      `${cleanedName} was added successfully.`
    );
  }

  function startEdit(skill: Skill) {
    setEditingSkill(skill.name);
    setSkillName(skill.name);
    setSkillLevel(skill.level);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");

    setTimeout(() => {
      const input =
        document.getElementById(
          "skill-name-input"
        ) as HTMLInputElement | null;

      input?.focus();
      input?.select();
    }, 50);
  }

  async function handleUpdateSkill() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!editingSkill) {
      return;
    }

    const cleanedName = skillName.trim();

    if (!cleanedName) {
      setErrorMessage("Please enter a skill name.");
      return;
    }

    const duplicate = skills.some(
      (skill) =>
        skill.name.toLowerCase() === cleanedName.toLowerCase() &&
        skill.name !== editingSkill
    );

    if (duplicate) {
      setErrorMessage(
        "Another skill with this name already exists."
      );
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

    const saved = await saveSkills(updatedSkills);

    if (!saved) {
      return;
    }

    setEditingSkill(null);
    setSkillName("");
    setSkillLevel(50);
    setShowForm(false);

    setSuccessMessage(
      `${cleanedName} was updated successfully.`
    );
  }

  async function handleRemoveSkill(name: string) {
    setErrorMessage("");
    setSuccessMessage("");

    const confirmed = window.confirm(
      `Remove "${name}" from your skills?`
    );

    if (!confirmed) {
      return;
    }

    const updatedSkills = skills.filter(
      (skill) => skill.name !== name
    );

    const saved = await saveSkills(updatedSkills);

    if (!saved) {
      return;
    }

    if (editingSkill === name) {
      cancelForm();
    }

    setSuccessMessage(
      `${name} was removed successfully.`
    );
  }

  function cancelForm() {
    setShowForm(false);
    setEditingSkill(null);
    setSkillName("");
    setSkillLevel(50);
    setErrorMessage("");
    setSuccessMessage("");
  }

  const averageProficiency = useMemo(() => {
    if (skills.length === 0) {
      return 0;
    }

    const total = skills.reduce(
      (sum, skill) => sum + skill.level,
      0
    );

    return Math.round(total / skills.length);
  }, [skills]);

  const strongestSkill = useMemo(() => {
    if (skills.length === 0) {
      return null;
    }

    return [...skills].sort(
      (a, b) => b.level - a.level
    )[0];
  }, [skills]);

  function getLevelLabel(level: number) {
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
  }

  function getLevelColor(level: number) {
    if (level >= 85) {
      return "text-cyan-300";
    }

    if (level >= 70) {
      return "text-blue-300";
    }

    if (level >= 50) {
      return "text-emerald-300";
    }

    return "text-amber-300";
  }

  function openAddForm() {
    setEditingSkill(null);
    setSkillName("");
    setSkillLevel(50);
    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");

    setTimeout(() => {
      const input =
        document.getElementById(
          "skill-name-input"
        ) as HTMLInputElement | null;

      input?.focus();
    }, 50);
  }

  return (
    <main className="min-h-screen bg-[#07111F] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0B1F3A] p-5 md:block">
          <div className="mb-10 flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white"
            >
              S
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

          <nav className="space-y-1.5">
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

          <div className="mt-10 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-xs text-slate-400">
              Profile completion
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
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
          <header className="flex items-center justify-between border-b border-white/10 bg-[#0B1F3A] px-5 py-5 md:px-8">
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                  onClick={openAddForm}
                  className="min-h-11 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  + Add Skill
                </button>
              )}
            </div>

            {/* SUCCESS */}
            {successMessage && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                {successMessage}
              </div>
            )}

            {/* ERROR */}
            {errorMessage && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            {/* FORM */}
            {showForm && (
              <div className="relative z-20 rounded-2xl border border-blue-500/20 bg-[#10294A] p-5 md:p-6">
                <h3 className="text-lg font-bold">
                  {editingSkill
                    ? "Edit Skill"
                    : "Add New Skill"}
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  {editingSkill
                    ? "Update the skill and proficiency level."
                    : "Add a skill to your career profile."}
                </p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {/* SKILL NAME */}
                  <div>
                    <label
                      htmlFor="skill-name-input"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Skill Name
                    </label>

                    <input
                      id="skill-name-input"
                      name="skillName"
                      type="text"
                      value={skillName}
                      onChange={(event) => {
                        setSkillName(event.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="e.g. TypeScript"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="words"
                      spellCheck={false}
                      disabled={saving}
                      style={{
                        color: "#FFFFFF",
                        WebkitTextFillColor: "#FFFFFF",
                        backgroundColor: "#07111F",
                        caretColor: "#22D3EE",
                      }}
                      className="relative z-30 block w-full cursor-text rounded-xl border border-white/10 px-4 py-3 text-base font-medium outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Enter the name of your technical or professional skill.
                    </p>
                  </div>

                  {/* PROFICIENCY */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="skill-level-range"
                        className="text-sm font-medium text-slate-300"
                      >
                        Proficiency
                      </label>

                      <span className="font-bold text-cyan-400">
                        {skillLevel}%
                      </span>
                    </div>

                    <input
                      id="skill-level-range"
                      type="range"
                      min="0"
                      max="100"
                      value={skillLevel}
                      onChange={(event) => {
                        setSkillLevel(
                          Number(event.target.value)
                        );
                      }}
                      disabled={saving}
                      className="mt-5 block w-full cursor-pointer accent-cyan-400 disabled:cursor-not-allowed"
                    />

                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>Beginner</span>
                      <span>Intermediate</span>
                      <span>Advanced</span>
                      <span>Expert</span>
                    </div>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={
                      editingSkill
                        ? handleUpdateSkill
                        : handleAddSkill
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
                    className="min-h-11 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* SUMMARY */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#10294A] p-5">
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

              <div className="rounded-2xl border border-white/10 bg-[#10294A] p-5">
                <p className="text-sm text-slate-400">
                  Average Proficiency
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {loading
                    ? "—"
                    : `${averageProficiency}%`}
                </p>

                <p className="mt-2 text-xs text-emerald-400">
                  Overall skill level
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#10294A] p-5">
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
            <div className="rounded-2xl border border-white/10 bg-[#10294A] p-5 md:p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold">
                  Skill Proficiency
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Your current technical skill levels.
                </p>
              </div>

              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse"
                    >
                      <div className="mb-3 h-5 w-40 rounded bg-white/10" />
                      <div className="h-3 rounded-full bg-white/10" />
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

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Add your first skill to improve job
                    matching, career recommendations and
                    skill-gap analysis.
                  </p>

                  <button
                    type="button"
                    onClick={openAddForm}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
                  >
                    Add Your First Skill
                  </button>
                </div>
              ) : (
                <div className="space-y-7">
                  {skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 font-bold text-blue-400">
                            {skill.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {skill.name}
                            </p>

                            <p
                              className={`text-xs ${getLevelColor(
                                skill.level
                              )}`}
                            >
                              {getLevelLabel(skill.level)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="mr-1 text-sm font-semibold text-slate-300">
                            {skill.level}%
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              startEdit(skill)
                            }
                            disabled={saving}
                            className="rounded-lg border border-blue-400/20 px-3 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-400/10 disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveSkill(
                                skill.name
                              )
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
                Why your skills matter
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                SkillTrack uses your skill profile to
                calculate job matches, identify skill gaps
                and personalize career recommendations.
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