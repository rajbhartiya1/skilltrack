import OpenAI from "openai";
import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import * as mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["javascript", "js", "ecmascript"],
  typescript: ["typescript", "ts"],
  react: ["react", "react.js", "reactjs"],
  "next.js": ["next.js", "nextjs", "next js"],
  "node.js": ["node.js", "nodejs", "node js"],
  python: ["python"],
  java: ["java"],
  sql: ["sql", "mysql", "postgresql", "postgres"],
  mongodb: ["mongodb", "mongo db", "mongo"],
  html: ["html", "html5"],
  css: ["css", "css3"],
  "tailwind css": ["tailwind css", "tailwind"],
  "rest api": ["rest api", "restful api", "rest"],
  git: ["git"],
  github: ["github"],
  docker: ["docker"],
  aws: ["aws", "amazon web services"],
  azure: ["azure"],
  gcp: ["gcp", "google cloud"],
  "machine learning": ["machine learning", "ml"],
  "data analysis": ["data analysis", "data analytics"],
  excel: ["excel", "microsoft excel"],
  communication: ["communication", "verbal communication", "written communication"],
  leadership: ["leadership", "team leadership"],
  figma: ["figma"],
  "ui/ux": ["ui/ux", "ui ux", "user interface", "user experience"],
  "power bi": ["power bi", "powerbi"],
};

const SECTION_PATTERNS: Record<string, RegExp[]> = {
  summary: [
    /professional summary/i,
    /career summary/i,
    /profile/i,
    /objective/i,
    /about me/i,
  ],
  experience: [
    /experience/i,
    /work experience/i,
    /professional experience/i,
    /employment/i,
  ],
  education: [
    /education/i,
    /academic background/i,
    /qualifications/i,
  ],
  skills: [
    /skills/i,
    /technical skills/i,
    /core skills/i,
    /technologies/i,
  ],
  projects: [
    /projects/i,
    /personal projects/i,
    /academic projects/i,
    /key projects/i,
  ],
  certifications: [
    /certifications/i,
    /certificates/i,
    /licenses/i,
  ],
};

function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function detectSkills(text: string) {
  const lower = text.toLowerCase();
  const found: string[] = [];

  Object.entries(SKILL_ALIASES).forEach(([canonical, aliases]) => {
    if (aliases.some((alias) => lower.includes(alias.toLowerCase()))) {
      found.push(canonical);
    }
  });

  return found;
}

function extractKeywords(text: string, targetSkills: string[]) {
  const lower = text.toLowerCase();

  return targetSkills.filter((skill) =>
    lower.includes(skill.toLowerCase())
  );
}

function calculateAtsScore(
  text: string,
  foundSkills: string[],
  targetSkills: string[]
) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const hasEmail =
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);

  const hasPhone =
    /(?:\+?\d[\d\s().-]{8,}\d)/.test(text);

  const sections = Object.values(SECTION_PATTERNS).map((patterns) =>
    hasAny(text, patterns)
  );

  const sectionScore = Math.round(
    (sections.filter(Boolean).length / sections.length) * 25
  );

  const keywordScore =
    targetSkills.length > 0
      ? Math.round(
          (foundSkills.filter((skill) =>
            targetSkills
              .map((item) => item.toLowerCase())
              .includes(skill.toLowerCase())
          ).length /
            targetSkills.length) *
            35
        )
      : 0;

  const actionWords =
    text.match(
      /\b(led|built|created|developed|designed|implemented|improved|optimized|managed|reduced|increased|delivered|automated|launched|deployed|engineered)\b/gi
    ) || [];

  const metricMatches =
    text.match(
      /(?:\d+%|\d+\+|\$\d+|\b\d+\s*(?:users|clients|customers|projects|days|months|years)\b)/gi
    ) || [];

  const actionScore = Math.min(
    15,
    Math.round(
      actionWords.length * 0.6 + metricMatches.length * 1.2
    )
  );

  const contactScore =
    (hasEmail ? 5 : 0) +
    (hasPhone ? 5 : 0);

  let readabilityScore = 10;

  if (wordCount < 180) {
    readabilityScore = 6;
  } else if (wordCount > 1100) {
    readabilityScore = 5;
  } else if (wordCount > 900) {
    readabilityScore = 7;
  }

  const lengthScore =
    wordCount >= 250 && wordCount <= 900
      ? 5
      : wordCount >= 180 && wordCount <= 1100
        ? 3
        : 1;

  const score = Math.min(
    100,
    Math.max(
      0,
      keywordScore +
        sectionScore +
        actionScore +
        contactScore +
        readabilityScore +
        lengthScore
    )
  );

  return {
    score,
    wordCount,
    hasEmail,
    hasPhone,
    sectionScore,
    keywordScore,
    actionScore,
    metricCount: metricMatches.length,
    readabilityScore,
    lengthScore,
  };
}

function buildLocalFeedback(args: {
  text: string;
  targetCareer: string;
  foundSkills: string[];
  targetSkills: string[];
  missingSkills: string[];
  atsScore: number;
}) {
  const {
    text,
    targetCareer,
    foundSkills,
    targetSkills,
    missingSkills,
    atsScore,
  } = args;

  const summary =
    targetCareer.toLowerCase().includes("full stack")
      ? "Results-driven Full Stack Developer with experience building responsive web applications using modern frontend and backend technologies. Strong foundation in JavaScript, React, Next.js, Node.js and SQL, with a focus on scalable solutions and measurable outcomes."
      : `Results-driven professional targeting ${targetCareer}, combining practical technical skills with project-based experience. Focused on building reliable solutions, continuous learning and delivering measurable results.`;

  const bullets = [
    "Built and delivered production-style applications using relevant technologies, improving usability and overall workflow efficiency.",
    "Implemented reusable components, APIs and data-driven features while maintaining clean and maintainable code.",
    "Collaborated on project requirements, debugging and deployment to deliver features within defined timelines.",
  ];

  const suggestions: string[] = [];

  if (missingSkills.length) {
    suggestions.push(
      `Add evidence for these high-priority skills where genuinely applicable: ${missingSkills.slice(0, 6).join(", ")}.`
    );
  }

  if (!/github/i.test(text)) {
    suggestions.push(
      "Add a clickable GitHub profile or repository links for major projects."
    );
  }

  if (!/\bhttps?:\/\//i.test(text)) {
    suggestions.push(
      "Add portfolio, LinkedIn or live project links when available."
    );
  }

  if (!/\d+%|\d+\+|\b\d+\s*(users|clients|projects|months|years)\b/i.test(text)) {
    suggestions.push(
      "Add measurable outcomes to project and experience bullets instead of only describing responsibilities."
    );
  }

  return {
    summary,
    bullets,
    suggestions,
    quickVerdict:
      atsScore >= 85
        ? "Your resume is strongly aligned with the selected role."
        : atsScore >= 70
          ? "Your resume has a solid foundation, but a few targeted improvements can make it more competitive."
          : "Your resume needs targeted improvements in keywords, structure and evidence before applying aggressively.",
    detectedSkillCount: foundSkills.length,
    targetSkillCount: targetSkills.length,
  };
}

async function extractResumeText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("Resume file is too large. Maximum allowed size is 8 MB.");
  }

  if (
    file.type === "text/plain" ||
    name.endsWith(".txt")
  ) {
    return buffer.toString("utf8");
  }

  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({
      buffer,
    });

    return result.value;
  }

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, {
      mergePages: true,
    });

    return typeof text === "string"
      ? text
      : text.join("\n");
  }

  throw new Error(
    "Unsupported file type. Please upload PDF, DOCX or TXT."
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const targetCareer =
      typeof formData.get("targetCareer") === "string"
        ? String(formData.get("targetCareer")).trim()
        : "";

    const targetSkillsRaw =
      typeof formData.get("targetSkills") === "string"
        ? String(formData.get("targetSkills"))
        : "";

    const profileSkillsRaw =
      typeof formData.get("profileSkills") === "string"
        ? String(formData.get("profileSkills"))
        : "";

    const targetSkills = targetSkillsRaw
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const profileSkills = profileSkillsRaw
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a resume file." },
        { status: 400 }
      );
    }

    const text = normalizeText(
      await extractResumeText(file)
    );

    if (text.length < 80) {
      return NextResponse.json(
        {
          error:
            "Very little text could be extracted from this resume. Please upload a text-based PDF, DOCX or TXT resume.",
        },
        { status: 400 }
      );
    }

    const allTargetSkills = Array.from(
      new Set([
        ...targetSkills,
        ...profileSkills,
      ])
    );

    const detectedSkills = detectSkills(text);

    const matchedSkills = allTargetSkills.filter(
      (skill) =>
        detectedSkills.includes(skill.toLowerCase()) ||
        text.toLowerCase().includes(skill.toLowerCase())
    );

    const missingSkills = allTargetSkills.filter(
      (skill) =>
        !matchedSkills
          .map((item) => item.toLowerCase())
          .includes(skill.toLowerCase())
    );

    const sectionStatus = Object.entries(
      SECTION_PATTERNS
    ).map(([name, patterns]) => ({
      name,
      found: hasAny(text, patterns),
    }));

    const ats = calculateAtsScore(
      text,
      detectedSkills,
      allTargetSkills
    );

    const localFeedback = buildLocalFeedback({
      text,
      targetCareer:
        targetCareer || "your target career",
      foundSkills: detectedSkills,
      targetSkills: allTargetSkills,
      missingSkills,
      atsScore: ats.score,
    });

    let aiFeedback = "";

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const limitedResumeText = text.slice(0, 14000);

        const response = await openai.responses.create({
          model: "gpt-5.6-luna",
          instructions: `
You are SkillTrack Resume Intelligence, an expert ATS resume reviewer.

Analyze the candidate's resume for the selected career.

Rules:
- Never invent work experience, education, projects or achievements.
- Clearly separate existing evidence from recommendations.
- Prioritize ATS compatibility, job relevance, measurable achievements, clarity and truthful keyword alignment.
- Give practical suggestions.
- Do not claim that a skill exists just because it is suggested.
- Keep the response structured and concise.
- Include:
  1. Resume verdict
  2. Strongest evidence
  3. Missing/high-priority keywords
  4. 3 rewritten bullet examples based only on the resume evidence
  5. Improved professional summary
  6. 30-day improvement plan
`,
          input: `
TARGET CAREER:
${targetCareer || "Not specified"}

PROFILE SKILLS:
${profileSkills.join(", ") || "None provided"}

DETECTED RESUME SKILLS:
${detectedSkills.join(", ") || "None confidently detected"}

CALCULATED ATS SCORE:
${ats.score}/100

CALCULATED MATCHED SKILLS:
${matchedSkills.join(", ") || "None"}

CALCULATED MISSING SKILLS:
${missingSkills.join(", ") || "None"}

RESUME TEXT:
${limitedResumeText}
`,
        });

        aiFeedback = response.output_text || "";
      } catch (error) {
        console.error(
          "Resume AI feedback error:",
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: file.type || "unknown",
      extractedCharacters: text.length,
      extractedWords: text
        .split(/\s+/)
        .filter(Boolean).length,
      targetCareer:
        targetCareer || "Not specified",
      ats,
      matchedSkills,
      missingSkills,
      detectedSkills,
      sectionStatus,
      localFeedback,
      aiFeedback,
      previewText: text.slice(0, 5000),
    });
  } catch (error) {
    console.error("Resume Analyze API Error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Resume analysis failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
