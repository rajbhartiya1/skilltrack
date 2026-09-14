import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing." },
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
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      instructions: `
You are SkillTrack AI, an intelligent career assistant.

Help students and job seekers with:
- Career recommendations
- Skill gap analysis
- Job preparation
- Resume improvement
- Interview preparation
- Learning roadmaps
- Job applications
- Professional development

Use the SkillTrack user context when answering.
Give practical, personalized and easy-to-understand answers.
Do not invent user information.
If information is unavailable, say so clearly.
Use headings and bullet points when useful.
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
