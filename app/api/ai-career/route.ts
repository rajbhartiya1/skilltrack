import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is missing from environment variables.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    const context =
      typeof body.context === "string"
        ? body.context
        : "";

    if (!question) {
      return NextResponse.json(
        {
          error: "Please enter a question.",
        },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      instructions: `
You are SkillTrack AI, a professional career guidance assistant.

Your job is to help students and job seekers with:
- career selection
- skill gaps
- learning roadmaps
- job preparation
- resumes
- ATS
- interviews
- employment strategy

Use the user's SkillTrack profile context when provided.

Important rules:
1. Give practical and actionable advice.
2. Do not invent user skills.
3. Clearly distinguish current skills from recommended skills.
4. Keep answers easy to understand.
5. Use headings and numbered steps when useful.
6. If the user asks what to learn, prioritize the highest-impact skills.
7. If the user asks about jobs, use the provided job context.
8. Do not claim that you actually applied for a job or performed an external action.
9. If profile information is insufficient, clearly say what information is missing.
10. You are a career assistant, not a replacement for a professional counselor.
`,

      input: `
USER QUESTION:
${question}

SKILLTRACK USER CONTEXT:
${context}
`,
    });

    return NextResponse.json({
      answer: response.output_text,
    });
  } catch (error) {
    console.error("AI Career API Error:", error);

    return NextResponse.json(
      {
        error:
          "AI service could not process the request. Please try again.",
      },
      { status: 500 }
    );
  }
}