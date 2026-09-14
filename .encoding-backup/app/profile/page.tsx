"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type UserSkill = {
  name: string;
  level: number;
};

type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  skills: UserSkill[] | string[] | null;
};

const SUGGESTED_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "SQL",
  "Git",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "MongoDB",
  "PostgreSQL",
  "Django",
  "Express.js",
  "Data Analysis",
  "Machine Learning",
  "Communication",
  "Problem Solving",
];

function normalizeSkills(
  skills: UserSkill[] | string[] | null | undefined
): UserSkill[] {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill) => {
      if (typeof skill === "string") {
        return {
          name: skill,
          level: 70,
        };
      }

      return {
        name:
          typeof skill.name === "string"
            ? skill.name
            : "",
        level: Math.max(
          0,
          Math.min(
            100,
            Number(skill.level) || 0
          )
        ),
      };
    })
    .filter(
      (skill) => skill.name.trim().length > 0
    );
}

export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  const [skills, setSkills] = useState<UserSkill[]>(
    []
  );

  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] =
    useState(50);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">(
      "success"
    );

  const [searchSkill, setSearchSkill] =
    useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        setUserId(user.id);
        setEmail(user.email || "");

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, bio, skills"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error(
            profileError.message
          );
        }

        if (profileData) {
          const profile =
            profileData as Profile;

          setFullName(
            profile.full_name || ""
          );

          setBio(profile.bio || "");

          setSkills(
            normalizeSkills(
              profile.skills
            )
          );
        } else {
          const defaultName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "SkillTrack User";

          setFullName(defaultName);

          const { error: insertError } =
            await supabase
              .from("profiles")
              .insert({
                id: user.id,
                full_name: defaultName,
                bio: "",
                skills: [],
              });

          if (insertError) {
            console.error(
              "Profile creation error:",
              insertError.message
            );
          }
        }
      } catch (error) {
        console.error(
          "Profile loading error:",
          error
        );

        setMessageType("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const averageSkillLevel = useMemo(() => {
    if (skills.length === 0) {
      return 0;
    }

    const total = skills.reduce(
      (sum, skill) =>
        sum + Number(skill.level),
      0
    );

    return Math.round(
      total / skills.length
    );
  }, [skills]);

  const strongSkills = useMemo(() => {
    return skills.filter(
      (skill) =>
        Number(skill.level) >= 70
    ).length;
  }, [skills]);

  const developingSkills = useMemo(() => {
    return skills.filter(
      (skill) =>
        Number(skill.level) >= 40 &&
        Number(skill.level) < 70
    ).length;
  }, [skills]);

  const beginnerSkills = useMemo(() => {
    return skills.filter(
      (skill) =>
        Number(skill.level) < 40
    ).length;
  }, [skills]);

  const filteredSuggestions =
    useMemo(() => {
      const query =
        searchSkill
          .trim()
          .toLowerCase();

      return SUGGESTED_SKILLS.filter(
        (skill) => {
          const alreadyAdded =
            skills.some(
              (item) =>
                item.name.toLowerCase() ===
                skill.toLowerCase()
            );

          const matchesSearch =
            !query ||
            skill
              .toLowerCase()
              .includes(query);

          return (
            !alreadyAdded &&
            matchesSearch
          );
        }
      ).slice(0, 10);
    }, [skills, searchSkill]);

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  function addSkill(
    skillName?: string
  ) {
    const name = (
      skillName ?? newSkill
    ).trim();

    if (!name) {
      showMessage(
        "Please enter a skill name.",
        "error"
      );
      return;
    }

    const exists = skills.some(
      (skill) =>
        skill.name.toLowerCase() ===
        name.toLowerCase()
    );

    if (exists) {
      showMessage(
        "This skill is already in your profile.",
        "error"
      );
      return;
    }

    const level =
      skillName
        ? 50
        : newSkillLevel;

    setSkills((current) => [
      ...current,
      {
        name,
        level,
      },
    ]);

    setNewSkill("");
    setNewSkillLevel(50);
    setSearchSkill("");

    showMessage(
      `${name} added to your skill profile.`,
      "success"
    );
  }

  function removeSkill(
    skillName: string
  ) {
    setSkills((current) =>
      current.filter(
        (skill) =>
          skill.name !== skillName
      )
    );
  }

  function updateSkillLevel(
    skillName: string,
    level: number
  ) {
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

  function getLevelLabel(
    level: number
  ) {
    if (level >= 90) {
      return "Expert";
    }

    if (level >= 70) {
      return "Advanced";
    }

    if (level >= 40) {
      return "Intermediate";
    }

    return "Beginner";
  }

  function getLevelColor(
    level: number
  ) {
    if (level >= 90) {
      return "text-emerald-300";
    }

    if (level >= 70) {
      return "text-cyan-300";
    }

    if (level >= 40) {
      return "text-yellow-300";
    }

    return "text-red-300";
  }

  async function saveProfile() {
    if (!userId) {
      showMessage(
        "Please login first.",
        "error"
      );
      return;
    }

    if (!fullName.trim()) {
      showMessage(
        "Full name cannot be empty.",
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const { error } =
        await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              full_name:
                fullName.trim(),
              bio: bio.trim(),
              skills,
            },
            {
              onConflict: "id",
            }
          );

      if (error) {
        throw new Error(
          error.message
        );
      }

      showMessage(
        "Profile and skills saved successfully! ðŸŽ‰",
        "success"
      );
    } catch (error) {
      console.error(
        "Profile save error:",
        error
      );

      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to save profile.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setLoggingOut(true);

    await supabase.auth.signOut();

    window.location.href =
      "/login";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />

          <p className="mt-5 text-sm text-slate-400">
            Loading your profile...
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
              className="font-bold text-cyan-400"
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
              className="transition hover:text-cyan-400"
            >
              Applications
            </Link>
          </nav>

          <button
            onClick={logout}
            disabled={loggingOut}
            className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2 text-xs font-bold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
          >
            {loggingOut
              ? "Signing out..."
              : "Sign Out"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER */}

        <section>
          <Link
            href="/"
            className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
          >
            â† Back to Dashboard
          </Link>

          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              CAREER PROFILE
            </p>

            <h1 className="mt-3 text-4xl font-black md:text-5xl">
              Build Your Skill Profile
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Keep your skills and proficiency levels updated.
              SkillTrack uses this information to calculate job
              compatibility and career readiness.
            </p>
          </div>
        </section>

        {/* MESSAGE */}

        {message && (
          <div
            className={`mt-6 rounded-2xl border p-4 text-sm font-semibold ${
              messageType === "success"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/20 bg-red-400/10 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* PROFILE SUMMARY */}

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-cyan-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Total Skills
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-400">
              {skills.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Strong Skills
            </p>

            <p className="mt-3 text-4xl font-black text-emerald-400">
              {strongSkills}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              70%+ proficiency
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Developing
            </p>

            <p className="mt-3 text-4xl font-black text-yellow-400">
              {developingSkills}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              40â€“69% proficiency
            </p>
          </div>

          <div className="rounded-2xl border border-purple-400/10 bg-[#0d1b2e] p-6">
            <p className="text-sm text-slate-500">
              Average Level
            </p>

            <p className="mt-3 text-4xl font-black text-purple-300">
              {averageSkillLevel}%
            </p>
          </div>
        </section>

        {/* PERSONAL INFORMATION */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0d1b2e] p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
              PERSONAL INFORMATION
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Profile Details
            </h2>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>

              <input
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Email
              </label>

              <input
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-slate-500 outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Career Bio
              </label>

              <textarea
                value={bio}
                onChange={(event) =>
                  setBio(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Tell employers about your interests, experience and career goals..."
                className="w-full resize-none rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/40"
              />
            </div>
          </div>
        </section>

        {/* ADD SKILL */}

        <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-[#0d1b2e] to-purple-500/10 p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              SKILL BUILDER
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Add a New Skill
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add the skills you currently know and set your
              honest proficiency level.
            </p>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_280px_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Skill Name
              </label>

              <input
                value={newSkill}
                onChange={(event) =>
                  setNewSkill(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addSkill();
                  }
                }}
                placeholder="e.g. React, Python, SQL..."
                className="w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/40"
              />
            </div>

            <div>
              <div className="mb-2 flex justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Proficiency
                </label>

                <span
                  className={`text-sm font-black ${getLevelColor(
                    newSkillLevel
                  )}`}
                >
                  {newSkillLevel}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={newSkillLevel}
                onChange={(event) =>
                  setNewSkillLevel(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="w-full accent-cyan-400"
              />

              <p className="mt-2 text-xs text-slate-600">
                {getLevelLabel(
                  newSkillLevel
                )}
              </p>
            </div>

            <button
              onClick={() => addSkill()}
              className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
            >
              + Add Skill
            </button>
          </div>

          {/* SUGGESTIONS */}

          <div className="mt-7 border-t border-white/10 pt-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-bold">
                  Quick Add
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Choose from common technology and career skills.
                </p>
              </div>

              <input
                value={searchSkill}
                onChange={(event) =>
                  setSearchSkill(
                    event.target.value
                  )
                }
                placeholder="Search skills..."
                className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-2.5 text-xs text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/40"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {filteredSuggestions.map(
                (skill) => (
                  <button
                    key={skill}
                    onClick={() =>
                      addSkill(skill)
                    }
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
                  >
                    + {skill}
                  </button>
                )
              )}

              {filteredSuggestions.length ===
                0 && (
                <p className="text-xs text-slate-600">
                  No additional suggested skills.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SKILL LIST */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0d1b2e] p-7">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                YOUR SKILLS
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Skill Proficiency
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Update these levels regularly to keep your job
                recommendations accurate.
              </p>
            </div>

            <span className="text-xs text-slate-600">
              {skills.length} skills
            </span>
          </div>

          <div className="mt-7 space-y-4">
            {skills.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <div className="text-4xl">
                  ðŸ§ 
                </div>

                <p className="mt-4 font-bold">
                  No skills added yet
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Add your first skill above to start building your
                  career profile.
                </p>
              </div>
            ) : (
              skills.map((skill) => (
                <div
                  key={skill.name}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    {/* NAME */}

                    <div className="w-full md:w-48">
                      <div className="flex items-center justify-between md:block">
                        <p className="text-sm font-bold">
                          {skill.name}
                        </p>

                        <span
                          className={`text-xs font-bold md:mt-2 md:block ${getLevelColor(
                            Number(
                              skill.level
                            )
                          )}`}
                        >
                          {getLevelLabel(
                            Number(
                              skill.level
                            )
                          )}
                        </span>
                      </div>
                    </div>

                    {/* SLIDER */}

                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-slate-600">
                          Proficiency
                        </span>

                        <span
                          className={`text-sm font-black ${getLevelColor(
                            Number(
                              skill.level
                            )
                          )}`}
                        >
                          {Number(
                            skill.level
                          )}
                          %
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Number(
                          skill.level
                        )}
                        onChange={(event) =>
                          updateSkillLevel(
                            skill.name,
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                        className="w-full accent-cyan-400"
                      />

                      <div className="mt-1 flex justify-between text-[9px] text-slate-700">
                        <span>Beginner</span>
                        <span>Intermediate</span>
                        <span>Advanced</span>
                        <span>Expert</span>
                      </div>
                    </div>

                    {/* DELETE */}

                    <button
                      onClick={() =>
                        removeSkill(
                          skill.name
                        )
                      }
                      className="rounded-xl border border-red-400/10 bg-red-400/5 px-4 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-400/10"
                    >
                      Remove
                    </button>
                  </div>

                  {/* PROGRESS */}

                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        Number(
                          skill.level
                        ) >= 70
                          ? "bg-cyan-400"
                          : Number(
                              skill.level
                            ) >= 40
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            Number(
                              skill.level
                            )
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SAVE */}

        <section className="mt-6 rounded-3xl border border-emerald-400/20 bg-gradient-to-r from-emerald-400/10 via-[#0d1b2e] to-cyan-400/10 p-7">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                PROFILE SYNC
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Keep your career data updated.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Your saved skill levels power SkillTrack's job
                matching, skill-gap analysis and career recommendations.
              </p>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-xl bg-emerald-400 px-7 py-4 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Profile..."
                : "Save Profile âœ“"}
            </button>
          </div>
        </section>

        {/* NEXT ACTIONS */}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Link
            href="/skill-gap"
            className="rounded-2xl border border-red-400/10 bg-red-400/5 p-6 transition hover:border-red-400/30"
          >
            <p className="text-2xl">
              ðŸŽ¯
            </p>

            <h3 className="mt-3 font-black">
              Analyze Skill Gaps
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              See which skills you need for your target jobs.
            </p>
          </Link>

          <Link
            href="/recommendations"
            className="rounded-2xl border border-purple-400/10 bg-purple-400/5 p-6 transition hover:border-purple-400/30"
          >
            <p className="text-2xl">
              ðŸ§ 
            </p>

            <h3 className="mt-3 font-black">
              AI Career Analysis
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              Discover careers that fit your current profile.
            </p>
          </Link>

          <Link
            href="/jobs"
            className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-6 transition hover:border-cyan-400/30"
          >
            <p className="text-2xl">
              ðŸ’¼
            </p>

            <h3 className="mt-3 font-black">
              Explore Jobs
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              Find opportunities ranked by your skill match.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
