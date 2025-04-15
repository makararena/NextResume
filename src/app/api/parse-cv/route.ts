import { NextResponse } from "next/server";
import * as pdfParse from "pdf-parse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await pdfParse(buffer);
    const text = parsed.text?.trim();

    if (!text || text.length < 20) {
      return NextResponse.json({ error: "Parsed CV text is too short or empty." }, { status: 400 });
    }

    return NextResponse.json({ parsedText: text });
  } catch (error) {
    console.error("PDF parse error:", error);
    return NextResponse.json({ error: "Failed to parse CV." }, { status: 500 });
  }
} 