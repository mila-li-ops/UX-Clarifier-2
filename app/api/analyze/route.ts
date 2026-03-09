import { NextRequest, NextResponse } from "next/server";
import { analyzeFeature } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { featureText, title, featureComplexity, productType, platform, targetUsers, designStage, focusArea, clarificationNotes } = await req.json();

  if (!featureText) {
    return NextResponse.json({ error: "Missing featureText" }, { status: 400 });
  }

  try {
    const result = await analyzeFeature(featureText, title, featureComplexity, productType, platform, targetUsers, designStage, focusArea, clarificationNotes);
    const resolvedTitle = title?.trim() || result.suggestedTitle || 'Untitled Feature';
    return NextResponse.json({ ...result, resolvedTitle });
  } catch (err: any) {
    console.log(err)
    return NextResponse.json(
      { error: err.message || "Analysis failed", rawResponse: err.rawResponse },
      { status: 500 }
    );
  }
}