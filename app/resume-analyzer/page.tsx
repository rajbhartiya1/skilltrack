"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import {
  calculateSkillGap,
  UserSkill,
} from "../../lib/skillGap";

type Job = {
  id: string;
  title: string;
  company: string;
  required_skills: string[] | null;
  description: string | null;
  location: string | null;
};

type SectionStatus = {
  name: string;
  found: boolean;
};

type AIReview = {
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  keywordAdvice?: string[];
  bulletImprovements?: string[];
  actionPlan?: string[];
};

type AnalysisResult = {
  success: boolean;
  fileName: string;
  fileType: string;
  extractedCharacters: number;
  extractedWords: number;
  targetCareer: string;

  ats: {
    score: number;
    wordCount: number;
    hasEmail: boolean;
    hasPhone: boolean;
    keywordScore: number;
    sectionScore: number;
    lengthScore: number;
    contactScore: number;
    actionWordScore: number;
  };

  localFeedback: {
    quickVerdict: string;
    matchedSkills: string[];
    missingSkills: string[];
    improvementSuggestions: string[];
  };

  sectionStatus: SectionStatus[];
  detectedSkills: string[];
  missingSkills: string[];
  aiReview: AIReview | null;
  previewText: string;
};

const careerOptions = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "UI/UX Designer",
  "Software Engineer",
];

const fallbackSkills: Record<string, string[]> = {
  "Full Stack Developer": [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "SQL",
    "Git",
    "REST API",
  ],

  "Frontend Developer": [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Git",
    "Responsive Design",
  ],

  "Backend Developer": [
    "Node.js",
    "Express",
    "Python",
    "Django",
    "Java",
    "SQL",
    "PostgreSQL",
    "REST API",
    "Git",
  ],

  "Data Analyst": [
    "Excel",
    "SQL",
    "Python",
    "Pandas",
    "Power BI",
    "Tableau",
    "Statistics",
  ],

  "Data Scientist": [
    "Python",
    "SQL",
    "Pandas",
    "NumPy",
    "Machine Learning",
    "Statistics",
    "TensorFlow",
  ],

  "Machine Learning Engineer": [
    "Python",
    "Machine Learning",
    "TensorFlow",
    "PyTorch",
    "SQL",
    "Pandas",
    "NumPy",
  ],

  "DevOps Engineer": [
    "Linux",
    "Docker",
    "Kubernetes",
    "AWS",
    "CI/CD",
    "Git",
    "Terraform",
  ],

  "UI/UX Designer": [
    "Figma",
    "UI Design",
    "UX Design",
    "Wireframing",
    "Prototyping",
    "User Research",
  ],

  "Software Engineer": [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "SQL",
    "Git",
    "Data Structures",
    "Algorithms",
  ],
};

export default function ResumeAnalyzerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [profileSkills, setProfileSkills] = useState<UserSkill[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [targetCareer, setTargetCareer] = useState(
    "Full Stack Developer"
  );

  const [loadingContext, setLoadingContext] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  useEffect(() => {
    async function loadContext() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoadingContext(false);
          return;
        }

        const [profileResult, jobsResult] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("skills")
              .eq("id", user.id)
              .maybeSingle(),

            supabase
              .from("jobs")
              .select(
                "id, title, company, required_skills, description, location"
              )
              .order("created_at", {
                ascending: false,
              })
              .limit(100),
          ]);

        const rawSkills = profileResult.data?.skills;

        let normalizedSkills: UserSkill[] = [];

        if (Array.isArray(rawSkills)) {
          normalizedSkills = rawSkills
            .map((skill: unknown) => {
              if (typeof skill === "string") {
                return {
                  name: skill,
                  level: 70,
                };
              }

              if (
                skill &&
                typeof skill === "object" &&
                "name" in skill
              ) {
                const item = skill as {
                  name?: unknown;
                  level?: unknown;
                };

                if (typeof item.name !== "string") {
                  return null;
                }

                return {
                  name: item.name,
                  level:
                    typeof item.level === "number"
                      ? Math.max(
                          0,
                          Math.min(100, item.level)
                        )
                      : 70,
                };
              }

              return null;
            })
            .filter(Boolean) as UserSkill[];
        }

        setProfileSkills(normalizedSkills);
        setJobs((jobsResult.data || []) as Job[]);
      } catch (contextError) {
        console.error(
          "Resume context loading error:",
          contextError
        );
      } finally {
        setLoadingContext(false);
      }
    }

    loadContext();
  }, []);

  const targetJob = useMemo(() => {
    if (!jobs.length) {
      return null;
    }

    const ranked = jobs
      .map((job) => ({
        job,
        gap: calculateSkillGap(
          profileSkills,
          job.required_skills || []
        ),
      }))
      .sort(
        (a, b) =>
          b.gap.matchPercentage -
          a.gap.matchPercentage
      );

    const exactCareer = ranked.find((item) =>
      item.job.title
        .toLowerCase()
        .includes(targetCareer.toLowerCase().split(" ")[0])
    );

    return exactCareer || ranked[0] || null;
  }, [jobs, profileSkills, targetCareer]);

  const targetSkills = useMemo(() => {
    if (
      targetJob?.job.required_skills &&
      targetJob.job.required_skills.length > 0
    ) {
      return targetJob.job.required_skills;
    }

    return (
      fallbackSkills[targetCareer] ||
      fallbackSkills["Full Stack Developer"]
    );
  }, [targetJob, targetCareer]);

  function validateFile(file: File) {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "";

    const allowedExtensions = [
      "pdf",
      "doc",
      "docx",
      "txt",
      "rtf",
      "odt",
      "png",
      "jpg",
      "jpeg",
      "webp",
      "gif",
    ];

    if (!allowedExtensions.includes(extension)) {
      return "Please select a PDF, DOC, DOCX, TXT, RTF, ODT, PNG, JPG, WEBP or GIF resume.";
    }

    if (file.size === 0) {
      return "The selected file is empty.";
    }

    if (file.size > 8 * 1024 * 1024) {
      return "Maximum file size is 8 MB.";
    }

    return "";
  }

  function handleSelectedFile(file: File | null) {
    setError("");
    setSuccessMessage("");
    setResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] || null;

    handleSelectedFile(file);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    const file =
      event.dataTransfer.files?.[0] || null;

    handleSelectedFile(file);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function removeFile() {
    setSelectedFile(null);
    setResult(null);
    setError("");
    setSuccessMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function analyzeResume() {
    setError("");
    setSuccessMessage("");
    setResult(null);

    if (!selectedFile) {
      setError(
        "Please select your resume file before analyzing."
      );

      openFilePicker();
      return;
    }

    const validationError =
      validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append(
        "targetCareer",
        targetCareer
      );

      formData.append(
        "targetSkills",
        targetSkills.join(",")
      );

      formData.append(
        "profileSkills",
        profileSkills
          .map((skill) => skill.name)
          .join(",")
      );

      const response = await fetch(
        "/api/resume-analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Resume analysis failed."
        );
      }

      setResult(data as AnalysisResult);

      setSuccessMessage(
        "Resume analyzed successfully."
      );

      window.setTimeout(() => {
        document
          .getElementById("analysis-results")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (analysisError) {
      console.error(
        "Resume analysis error:",
        analysisError
      );

      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Resume analysis failed. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function scoreLabel(score: number) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Strong";
    if (score >= 50) return "Needs Work";
    return "Needs Improvement";
  }

  function scoreClass(score: number) {
    if (score >= 85) {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }

    if (score >= 70) {
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    }

    if (score >= 50) {
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
    }

    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#10294A] shadow-2xl shadow-black/20">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_320px] lg:p-10">

            <div>
              <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                AI Resume Intelligence
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                Make your resume
                <span className="block text-blue-400">
                  job-ready.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Upload your resume and SkillTrack will
                analyze ATS readiness, career alignment,
                keywords, structure, skills and improvement
                opportunities.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                  PDF
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                  DOCX
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                  TXT
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                  DOC / RTF / ODT
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                  JPG / PNG / WEBP / GIF
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                  Maximum 8 MB
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B1F3A] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Target Career
              </p>

              <h2 className="mt-3 text-xl font-black">
                Choose your role
              </h2>

              <select
                value={targetCareer}
                onChange={(event) =>
                  setTargetCareer(event.target.value)
                }
                className="mt-5 w-full rounded-2xl border border-white/10 bg-[#10294A] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-400"
              >
                {careerOptions.map((career) => (
                  <option
                    key={career}
                    value={career}
                  >
                    {career}
                  </option>
                ))}
              </select>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                {targetSkills.length} target skills will
                be used for keyword and career alignment.
              </p>
            </div>

          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6 sm:p-8">

            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                Step 01
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Select your resume
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose a PDF, DOC, DOCX, TXT, RTF, ODT or resume image from your
                computer.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.png,.jpg,.jpeg,.webp,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/rtf,text/rtf,application/vnd.oasis.opendocument.text,image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="sr-only"
            />

            <div
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragActive(false);
              }}
              onDrop={handleDrop}
              className={`rounded-3xl border-2 border-dashed p-8 text-center transition ${
                dragActive
                  ? "border-blue-400 bg-blue-400/10"
                  : "border-white/10 bg-white/[0.02] hover:border-blue-400/40 hover:bg-blue-400/[0.04]"
              }`}
            >
              {!selectedFile ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-sm font-black text-blue-300">
                    CV
                  </div>

                  <h3 className="mt-5 text-lg font-bold">
                    Drop your resume here
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    or select a file from your computer
                  </p>

                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
                  >
                    Choose Resume
                  </button>
                </>
              ) : (
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-sm font-black text-emerald-300">
                    OK
                  </div>

                  <h3 className="mt-5 break-all text-lg font-bold">
                    {selectedFile.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {formatBytes(selectedFile.size)}
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/[0.08]"
                    >
                      Change File
                    </button>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-400/20"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm leading-6 text-red-300">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm leading-6 text-emerald-300">
                {successMessage}
              </div>
            )}

            <button
              type="button"
              onClick={analyzeResume}
              disabled={analyzing}
              className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing
                ? "Analyzing Resume..."
                : "Analyze Resume"}
            </button>

            <p className="mt-3 text-center text-xs text-slate-600">
              Your file is processed only for resume analysis.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6 sm:p-8">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              Step 02
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Career context
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              SkillTrack combines your selected target
              career with your existing profile and job
              market data.
            </p>

            <div className="mt-6 space-y-3">

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                  Target role
                </p>

                <p className="mt-2 font-bold text-white">
                  {targetCareer}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                  Profile skills
                </p>

                <p className="mt-2 font-bold text-white">
                  {profileSkills.length} skills
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                  Job database
                </p>

                <p className="mt-2 font-bold text-white">
                  {loadingContext
                    ? "Loading..."
                    : `${jobs.length} jobs`}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                  Target keywords
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {targetSkills
                    .slice(0, 10)
                    .map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-300"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              </div>

            </div>
          </div>

        </section>

        {result && (
          <section
            id="analysis-results"
            className="mt-8 space-y-6"
          >

            <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                    Analysis Complete
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {result.fileName}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {result.fileType} resume for{" "}
                    {result.targetCareer}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-4 py-2 text-xs font-bold ${scoreClass(
                    result.ats.score
                  )}`}
                >
                  {scoreLabel(result.ats.score)}
                </span>

              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                  ATS Score
                </p>

                <p className="mt-4 text-5xl font-black text-blue-300">
                  {result.ats.score}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  out of 100
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                  Resume Length
                </p>

                <p className="mt-4 text-4xl font-black">
                  {result.ats.wordCount}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  words extracted
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                  Skills Found
                </p>

                <p className="mt-4 text-4xl font-black text-cyan-300">
                  {result.detectedSkills.length}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  target keywords found
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                  Sections
                </p>

                <p className="mt-4 text-4xl font-black text-emerald-300">
                  {
                    result.sectionStatus.filter(
                      (section) => section.found
                    ).length
                  }
                  /{result.sectionStatus.length}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  detected sections
                </p>
              </div>

            </div>

            <div className="grid gap-6 lg:grid-cols-2">

              <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Resume Verdict
                </p>

                <h3 className="mt-3 text-2xl font-black">
                  {result.localFeedback.quickVerdict}
                </h3>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">

                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-400">
                      Matched Skills
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.localFeedback.matchedSkills.length >
                      0 ? (
                        result.localFeedback.matchedSkills.map(
                          (skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
                            >
                              {skill}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-sm text-slate-500">
                          No target skills detected.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-yellow-400">
                      Missing Skills
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.missingSkills.length > 0 ? (
                        result.missingSkills.map(
                          (skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-yellow-400/10 px-3 py-1.5 text-xs font-semibold text-yellow-300"
                            >
                              {skill}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-sm text-slate-500">
                          No major target keywords missing.
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  ATS Breakdown
                </p>

                <div className="mt-6 space-y-5">

                  {[
                    [
                      "Keyword Alignment",
                      result.ats.keywordScore,
                      35,
                    ],
                    [
                      "Resume Structure",
                      result.ats.sectionScore,
                      25,
                    ],
                    [
                      "Resume Length",
                      result.ats.lengthScore,
                      15,
                    ],
                    [
                      "Contact Information",
                      result.ats.contactScore,
                      10,
                    ],
                    [
                      "Action Language",
                      result.ats.actionWordScore,
                      10,
                    ],
                  ].map(
                    ([label, value, max]) => (
                      <div key={label as string}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-300">
                            {label as string}
                          </span>

                          <span className="font-bold text-blue-300">
                            {value as number}/{max as number}
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{
                              width: `${Math.min(
                                100,
                                ((value as number) /
                                  (max as number)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}

                </div>
              </div>

            </div>

            <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6 sm:p-8">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                Resume Structure
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {result.sectionStatus.map(
                  (section) => (
                    <div
                      key={section.name}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${
                        section.found
                          ? "border-emerald-400/20 bg-emerald-400/10"
                          : "border-red-400/20 bg-red-400/10"
                      }`}
                    >
                      <span className="font-semibold">
                        {section.name}
                      </span>

                      <span
                        className={`text-xs font-black ${
                          section.found
                            ? "text-emerald-300"
                            : "text-red-300"
                        }`}
                      >
                        {section.found
                          ? "FOUND"
                          : "MISSING"}
                      </span>
                    </div>
                  )
                )}

              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">

              <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Recommended Improvements
                </p>

                <div className="mt-5 space-y-3">
                  {result.localFeedback.improvementSuggestions.map(
                    (suggestion, index) => (
                      <div
                        key={`${suggestion}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="flex gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-black text-blue-300">
                            {index + 1}
                          </span>

                          <p className="text-sm leading-6 text-slate-300">
                            {suggestion}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Contact Check
                </p>

                <div className="mt-5 space-y-3">

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                    <span className="text-sm font-semibold">
                      Email
                    </span>

                    <span
                      className={
                        result.ats.hasEmail
                          ? "text-emerald-300"
                          : "text-red-300"
                      }
                    >
                      {result.ats.hasEmail
                        ? "Detected"
                        : "Missing"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                    <span className="text-sm font-semibold">
                      Phone
                    </span>

                    <span
                      className={
                        result.ats.hasPhone
                          ? "text-emerald-300"
                          : "text-red-300"
                      }
                    >
                      {result.ats.hasPhone
                        ? "Detected"
                        : "Missing"}
                    </span>
                  </div>

                </div>
              </div>

            </div>

            {result.aiReview && (
              <div className="rounded-3xl border border-cyan-400/10 bg-[#10294A] p-6 sm:p-8">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                      AI Deep Review
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Personalized resume intelligence
                    </h2>
                  </div>

                  <span className="w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-300">
                    AI Review
                  </span>

                </div>

                {result.aiReview.summary && (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-sm leading-7 text-slate-300">
                      {result.aiReview.summary}
                    </p>
                  </div>
                )}

                <div className="mt-6 grid gap-6 lg:grid-cols-2">

                  <AIList
                    title="Strengths"
                    items={
                      result.aiReview.strengths || []
                    }
                  />

                  <AIList
                    title="Weaknesses"
                    items={
                      result.aiReview.weaknesses || []
                    }
                  />

                  <AIList
                    title="Keyword Advice"
                    items={
                      result.aiReview.keywordAdvice || []
                    }
                  />

                  <AIList
                    title="Bullet Improvements"
                    items={
                      result.aiReview.bulletImprovements ||
                      []
                    }
                  />

                </div>

                <AIList
                  title="Action Plan"
                  items={
                    result.aiReview.actionPlan || []
                  }
                />

              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">

              <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Extracted Resume
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {result.extractedCharacters.toLocaleString()}{" "}
                  characters extracted
                </p>

                <div className="mt-5 max-h-96 overflow-y-auto rounded-2xl border border-white/10 bg-[#0B1F3A] p-5 text-sm leading-7 text-slate-400">
                  {result.previewText}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#10294A] p-6">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Next Step
                </p>

                <h3 className="mt-3 text-2xl font-black">
                  Turn this analysis into a career plan.
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Use your detected skill gaps and target
                  career to continue your SkillTrack journey.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <Link
                    href="/skill-gap"
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
                  >
                    View Skill Gap
                  </Link>

                  <Link
                    href="/career-coach"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.08]"
                  >
                    Career Coach
                  </Link>

                  <Link
                    href="/interview-coach"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.08]"
                  >
                    Interview Coach
                  </Link>

                </div>

              </div>

            </div>

          </section>
        )}

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#10294A] p-6 sm:p-8">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            How SkillTrack Scores Your Resume
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <InfoCard
              title="Keyword Alignment"
              text="Checks how strongly your resume matches the selected career's required skills."
            />

            <InfoCard
              title="Structure"
              text="Checks important sections such as summary, skills, experience, education and projects."
            />

            <InfoCard
              title="Impact Evidence"
              text="Looks for measurable language and action-oriented resume bullets."
            />

            <InfoCard
              title="Career Context"
              text="Connects your resume analysis with your SkillTrack profile and job-market context."
            />

          </div>

        </section>

      </div>
    </main>
  );
}

function AIList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-bold">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="flex gap-3"
          >
            <span className="mt-1 text-cyan-300">
              •
            </span>

            <p className="text-sm leading-6 text-slate-400">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="font-bold">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

