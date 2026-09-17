import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractText } from "unpdf";
import mammoth from "mammoth";

export const runtime = "nodejs";

async function extractResumeText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  if (fileName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({
      buffer,
    });

    return result.value || "";
  }

  if (fileName.endsWith(".pdf")) {
    const result = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });

    if (typeof result.text === "string") {
      return result.text;
    }

    return "";
  }

  return "";
}

function buildAnalysisPrompt(
  targetCareer: string,
  targetSkills: string,
  profileSkills: string,
  resumeText: string
) {
  return `
You are an expert resume analyzer for SkillTrack, a career platform for students and job seekers.

Analyze the resume below and provide practical, honest and structured feedback.

TARGET CAREER:
${targetCareer || "Not specified"}

TARGET SKILLS:
${targetSkills || "Not specified"}

USER PROFILE SKILLS:
${profileSkills || "Not specified"}

RESUME:
${resumeText.slice(0, 30000)}

If the resume is provided as an image, read all clearly visible resume text and
include it in the extractedText field. Preserve names, contact details, dates,
section headings and bullet points as accurately as possible. For non-image
resumes, return the supplied resume text in extractedText.

Return the analysis in JSON with exactly these fields:

{
  "extractedText": string,
  "overallScore": number,
  "summary": string,
  "strengths": string[],
  "weaknesses": string[],
  "missingSkills": string[],
  "recommendedSkills": string[],
  "improvements": string[],
  "atsTips": string[],
  "careerFit": string
}

Rules:
- overallScore must be between 0 and 100.
- Do not invent experience or qualifications.
- Base the analysis only on the resume and provided target information.
- Give specific and useful suggestions.
- Keep the language professional and easy to understand.
`;
}

function parseAnalysis(output: string) {
  try {
    const cleaned = output
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const objectStart = cleaned.indexOf("{");
      const objectEnd = cleaned.lastIndexOf("}");

      if (objectStart < 0 || objectEnd <= objectStart) {
        throw new Error("No JSON object found in AI response.");
      }

      return JSON.parse(cleaned.slice(objectStart, objectEnd + 1));
    }
  } catch (parseError) {
    console.error("Resume AI JSON parse error:", parseError);

    return {
      overallScore: 0,
      extractedText: "",
      summary: output,
      strengths: [],
      weaknesses: [],
      missingSkills: [],
      recommendedSkills: [],
      improvements: [],
      atsTips: [],
      careerFit: "Unable to determine automatically.",
    };
  }
}

async function requestAnalysis(
  apiKey: string,
  prompt: string,
  file?: File
) {
  const openai = new OpenAI({ apiKey });
  const input = file
    ? [
        {
          role: "user" as const,
          content: [
            /\.(png|jpe?g|webp|gif)$/i.test(file.name)
              ? {
                  type: "input_image" as const,
                  image_url: `data:${file.type || "image/jpeg"};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`,
                  detail: "high" as const,
                }
              : {
                  type: "input_file" as const,
                  filename: file.name,
                  file_data: `data:${file.type || "application/pdf"};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`,
                },
            { type: "input_text" as const, text: prompt },
          ],
        },
      ]
    : prompt;

  const response = await openai.responses.create({
    model: "gpt-5.6-luna",
    input,
    text: {
      format: {
        type: "json_object",
      },
    },
  });

  return response.output_text?.trim() || "";
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is missing. Please add it to your environment variables.",
        },
        { status: 500 }
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch (formDataError) {
      console.error(
        "Resume form data error:",
        formDataError
      );

      return NextResponse.json(
        {
          error:
            "Please upload the resume using the file picker or drag-and-drop area.",
        },
        { status: 400 }
      );
    }

    const file = formData.get("file");

    const targetCareerValue = formData.get("targetCareer");
    const targetSkillsValue = formData.get("targetSkills");
    const profileSkillsValue = formData.get("profileSkills");

    const targetCareer =
      typeof targetCareerValue === "string" ? targetCareerValue : "";
    const targetSkills =
      typeof targetSkillsValue === "string" ? targetSkillsValue : "";
    const profileSkills =
      typeof profileSkillsValue === "string" ? profileSkillsValue : "";

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Please upload a resume file.",
        },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/msword",
      "application/rtf",
      "text/rtf",
      "application/vnd.oasis.opendocument.text",
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
    ];

    const fileName = file.name.toLowerCase();

    const validExtension =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".rtf") ||
      fileName.endsWith(".odt") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".webp") ||
      fileName.endsWith(".gif");

    if (!allowedTypes.includes(file.type) && !validExtension) {
      return NextResponse.json(
        {
          error:
            "Please upload a PDF, DOC, DOCX, TXT, RTF, ODT, PNG, JPG, WEBP or GIF resume.",
        },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "Resume file must be smaller than 8 MB.",
        },
        { status: 400 }
      );
    }

    const isImageResume =
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".webp") ||
      fileName.endsWith(".gif");

    let resumeText = "";

    try {
      if (!isImageResume) {
        resumeText = await extractResumeText(file);
      }
    } catch (extractError) {
      console.error(
        "Resume extraction error:",
        extractError
      );

      return NextResponse.json(
        {
          error:
            "We could not read this resume file. Please try another PDF, DOCX, TXT or image file.",
        },
        { status: 422 }
      );
    }

    resumeText = resumeText
      .replace(/\u0000/g, " ")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim();

    console.log(
      "Resume extraction:",
      file.name,
      "characters:",
      resumeText.length
    );

    const prompt = buildAnalysisPrompt(
      targetCareer,
      targetSkills,
      profileSkills,
      resumeText
    );

    const isLowTextPdf =
      resumeText.length < 30 && fileName.endsWith(".pdf");

    const canUseDirectFileAnalysis =
      isImageResume ||
      isLowTextPdf ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".rtf") ||
      fileName.endsWith(".odt");

    if (
      resumeText.length < 30 &&
      !canUseDirectFileAnalysis
    ) {
      return NextResponse.json(
        {
          error:
            "Very little text could be extracted from this resume. Please upload a readable DOCX or TXT file, or a PDF with selectable text.",
        },
        { status: 422 }
      );
    }

    let output = "";

    try {
      output = await requestAnalysis(
        apiKey,
        prompt,
        canUseDirectFileAnalysis ? file : undefined
      );
    } catch (analysisError) {
      console.error("Resume AI request error:", analysisError);

      if (canUseDirectFileAnalysis) {
        return NextResponse.json(
          {
            error:
              isImageResume
                ? "This resume image could not be read. Please upload a clearer PNG, JPG, WEBP or GIF image."
                : "This PDF appears to be image-based and could not be read automatically. Please upload a clearer PDF, DOCX, or TXT resume.",
          },
          { status: 422 }
        );
      }

      throw analysisError;
    }

    if (!output) {
      return NextResponse.json(
        {
          error:
            "AI could not analyze this resume. Please try again.",
        },
        { status: 500 }
      );
    }

    const analysis = parseAnalysis(output);

    const extractedImageText =
      typeof analysis.extractedText === "string"
        ? analysis.extractedText
        : "";
    const normalizedResumeText =
      (resumeText || extractedImageText) || "";
    const extractedWords = normalizedResumeText
      .split(/\s+/)
      .filter(Boolean).length;
    const sectionNames = [
      "Summary",
      "Experience",
      "Education",
      "Skills",
      "Projects",
      "Certifications",
    ];
    const sectionStatus = sectionNames.map((name) => ({
      name,
      found: new RegExp(`\\b${name}\\b`, "i").test(
        normalizedResumeText
      ),
    }));
    const normalizedTargetSkills = targetSkills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    const detectedSkills = normalizedTargetSkills.filter((skill) =>
      normalizedResumeText.toLowerCase().includes(skill.toLowerCase())
    );
    const analysisScore =
      typeof analysis.overallScore === "number"
        ? Math.max(0, Math.min(100, analysis.overallScore))
        : 0;

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: file.type || fileName.split(".").pop() || "unknown",
      targetCareer,
      extractedCharacters: normalizedResumeText.length,
      extractedTextLength: resumeText.length,
      extractedWords,
      previewText: normalizedResumeText.slice(0, 12000),
      ats: {
        score: analysisScore,
        wordCount: extractedWords,
        hasEmail: /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(normalizedResumeText),
        hasPhone: /(?:\+?\d[\d\s().-]{8,}\d)/.test(normalizedResumeText),
        keywordScore: Math.round(
          (detectedSkills.length / Math.max(normalizedTargetSkills.length, 1)) * 100
        ),
        sectionScore: Math.round(
          (sectionStatus.filter((section) => section.found).length /
            sectionStatus.length) *
            100
        ),
        lengthScore: extractedWords >= 150 && extractedWords <= 900 ? 100 : 60,
        contactScore: normalizedResumeText.match(/@/) ? 100 : 0,
        actionWordScore: 0,
      },
      localFeedback: {
        quickVerdict:
          analysis.summary || "Resume analyzed successfully.",
        matchedSkills: detectedSkills,
        missingSkills: Array.isArray(analysis.missingSkills)
          ? analysis.missingSkills
          : [],
        improvementSuggestions: Array.isArray(analysis.improvements)
          ? analysis.improvements
          : [],
      },
      sectionStatus,
      detectedSkills,
      missingSkills: Array.isArray(analysis.missingSkills)
        ? analysis.missingSkills
        : [],
      aiReview: {
        summary: analysis.summary || "",
        strengths: Array.isArray(analysis.strengths)
          ? analysis.strengths
          : [],
        weaknesses: Array.isArray(analysis.weaknesses)
          ? analysis.weaknesses
          : [],
        keywordAdvice: Array.isArray(analysis.atsTips)
          ? analysis.atsTips
          : [],
        bulletImprovements: Array.isArray(analysis.improvements)
          ? analysis.improvements
          : [],
        actionPlan: Array.isArray(analysis.recommendedSkills)
          ? analysis.recommendedSkills
          : [],
      },
      analysis,
    });
  } catch (error) {
    console.error(
      "Resume Analyze API Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Resume analysis failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
