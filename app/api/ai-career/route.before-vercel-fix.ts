import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is missing. Please add it to Vercel Environment Variables.",
        },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey,
    });

    const body = await request.json();

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    const context =
      typeof body.context === "string"
        ? body.context
        : "";

    const conversation = Array.isArray(body.conversation)
      ? body.conversation
          .filter(
            (message: unknown) =>
              message &&
              typeof message === "object" &&
              "role" in message &&
              "text" in message
          )
          .slice(-6)
          .map(
            (message: { role: string; text: string }) =>
              `${message.role === "user" ? "USER" : "SKILLTRACK AI"}: ${message.text}`
          )
          .join("\n\n")
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
You are SkillTrack AI, a personalized multilingual career assistant for students and job seekers in India.

You help users with:
- Career recommendations
- Skill gap analysis
- Jobs
- Learning roadmaps
- Resume improvement
- Interview preparation
- Job applications
- Professional development

LANGUAGE:
- Automatically detect the language of the user's latest message.
- Reply in the same language.
- If the user speaks Hinglish, reply naturally in Hinglish.
- If the user speaks Hindi, reply in Hindi.
- If the user speaks English, reply in English.
- Support Indian languages such as Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi and Urdu.
- If the user changes language, immediately switch to that language.
- Never ask the user to select a language.
- Keep technical terms such as React, Next.js, Node.js, TypeScript, SQL, Git and JavaScript in English when appropriate.

CONVERSATION:
- Use previous messages to understand follow-up questions.
- Understand phrases like "why?", "aur batao", "iska reason?", "then what?", "explain this", etc.
- Continue the conversation naturally.
- Do not repeat the entire previous answer unnecessarily.

SKILLTRACK:
- Use the user's actual SkillTrack context.
- Do not invent user skills, jobs, applications or personal information.
- Give practical and personalized advice.
- Use headings and bullet points when useful.
- Keep answers readable and useful.
`,

      input: `
CURRENT USER QUESTION:
${question}

PREVIOUS CONVERSATION:
${conversation || "No previous conversation available."}

CURRENT SKILLTRACK CONTEXT:
${context}
`,
    });

    return NextResponse.json({
      answer:
        response.output_text ||
        "I could not generate an answer right now. Please try again.",
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