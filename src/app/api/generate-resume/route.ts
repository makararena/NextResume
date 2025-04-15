import { NextResponse } from "next/server";
import openai from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { parsedText, jobDescription, additionalInfo } = await req.json();

    if (!parsedText || !jobDescription) {
      return NextResponse.json({ error: "Missing CV content or job description." }, { status: 400 });
    }

    const result = await openai.generateResumeFromVisionAnalysis(
      parsedText,
      jobDescription,
      additionalInfo
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Resume generation error:", error);
    return NextResponse.json({ error: "Failed to generate resume." }, { status: 500 });
  }
} 