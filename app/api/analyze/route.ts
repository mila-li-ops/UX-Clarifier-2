import { NextRequest, NextResponse } from "next/server";
import { analyzeFeature } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { featureText, title, context, clarificationNotes } = await req.json();

  if (!featureText) {
    return NextResponse.json({ error: "Missing featureText" }, { status: 400 });
  }

  try {
    const result = await analyzeFeature(featureText, title, context, clarificationNotes);
    return NextResponse.json(result);
  } catch (err: any) {
    console.log(err)
    return NextResponse.json(
      { error: err.message || "Analysis failed", rawResponse: err.rawResponse },
      { status: 500 }
    );
  }
}
