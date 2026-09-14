"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Skill = {
  name: string;
  level: number;
};

const defaultSkills: Skill[] = [
  { name: "JavaScript", level: 85 },
  { name: "React", level: 78 },
  { name: "Next.js", level: 72 },
  { name: "Node.js", level: 68 },
  { name: "SQL", level: 62 },
  { name: "Python", level: 55 },
];

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<Skill[]>(defaultSkills);

  const [newSkill, setNewSkill] = useState("");
  const [newLevel, setNewLevel] = useState(70);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please login first.");
      setLoading(false);
      return;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, skills, bio")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    if (data) {
      setName(data.full_name || "");
      setBio(data.bio || "");

      if (Array.isArray(data.skills)) {
        const savedSkills = data.skills.filter(
          (skill: unknown): skill is Skill =>
            typeof skill === "object" &&
            skill !== null &&
            "name" in skill &&
            "level" in skill
        );

        if (savedSkills.length > 0) {
          setSkills(savedSkills);
        }
      }
    } else {
      const fallbackName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "SkillTrack User";

      setName(fallbackName);

      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: fallbackName,
          skills: defaultSkills,
          bio: "",
        });

      if (insertError) {
        console.error(insertError);
      }
    }

    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please login first.");
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: name.trim() || "SkillTrack User",
          bio: bio.trim(),
          skills,
        },
        {
          onConflict: "id",
        }
      );

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    alert("Profile saved successfully!");

    setSaving(false);
  }

  function addSkill() {
    const cleanName = newSkill.trim();

    if (!cleanName) {
      return;
    }

    const alreadyExists = skills.some(
      (skill) => skill.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (alreadyExists) {
      alert("This skill already exists.");
      return;
    }

    setSkills((current) => [
      ...current,
      {
        name: cleanName,
        level: newLevel,
      },
    ]);

    setNewSkill("");
    setNewLevel(70);
  }

  function removeSkill(skillName: string) {
    setSkills((current) =>
      current.filter((skill) => skill.name !== skillName)
    );
  }

  function updateSkillLevel(skillName: string, level: number) {
    setSkills((current) =>
      current.map((skill) =>
        skill.name === skillName
          ? {
              ...skill,
              level,
            }
          : skill
      )
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07111f] p-6 text-white md:p-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#0d1b2e] p-10 text-center">
          <p className="text-cyan-400">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-8 text-white md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-5 text-4xl font-bold">My Profile</h1>

            <p className="mt-2 text-slate-400">
              Manage your personal information and career skills.
            </p>
          </div>

          <button
            onClick={logout}
            className="w-fit rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <h2 className="text-xl font-bold">Personal Information</h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full Name
                </label>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Bio
                </label>

                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">My Skills</h2>

                <p className="mt-1 text-sm text-slate-400">
                  Add your skills and set your current proficiency.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_120px]">
              <input
                value={newSkill}
                onChange={(event) => setNewSkill(event.target.value)}
                placeholder="Example: TypeScript"
                className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <div className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Proficiency</span>
                  <span>{newLevel}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newLevel}
                  onChange={(event) =>
                    setNewLevel(Number(event.target.value))
                  }
                  className="mt-2 w-full accent-cyan-400"
                />
              </div>

              <button
                onClick={addSkill}
                className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Add Skill
              </button>
            </div>

            <div className="mt-8 space-y-5">
              {skills.map((skill) => (
                <div
                  key={skill.name}
                  className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">
                          {skill.name}
                        </span>

                        <span className="text-slate-400">
                          {skill.level}%
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={skill.level}
                        onChange={(event) =>
                          updateSkillLevel(
                            skill.name,
                            Number(event.target.value)
                          )
                        }
                        className="mt-3 w-full accent-cyan-400"
                      />
                    </div>

                    <button
                      onClick={() => removeSkill(skill.name)}
                      className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full rounded-xl bg-cyan-400 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving Profile..." : "Save Profile"}
          </button>
        </div>
      </div>
    </main>
  );
}