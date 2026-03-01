import { NextRequest, NextResponse } from "next/server";
import { extractContentFromImage, extractContentFromDocument } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { base64Data, mimeType } = await req.json();

  if (!base64Data || !mimeType) {
    return NextResponse.json({ error: "Missing base64Data or mimeType" }, { status: 400 });
  }

  try {
    const text = mimeType.startsWith("image/")
      ? await extractContentFromImage(base64Data, mimeType)
      : await extractContentFromDocument(base64Data, mimeType);

    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Extraction failed" }, { status: 500 });
  }
}
