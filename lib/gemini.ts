import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function extractContentFromImage(base64Data: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: "Extract all the text from this image accurately. Preserve the structure as much as possible. Do not add any extra commentary.",
        },
      ],
    },
  });
  return response.text || "";
}

export async function extractContentFromDocument(base64Data: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: "Extract all the text from this document accurately. Preserve the structure as much as possible. Do not add any extra commentary.",
        },
      ],
    },
  });
  return response.text || "";
}

export async function analyzeFeature(
  featureText: string,
  title: string,
  context: string,
  clarificationNotes?: string
) {
  let prompt = `Analyze the following feature description for UX clarity, implicit assumptions, structural risks, and likely UX failures.

Feature Title: ${title || "Untitled Feature"}
Product Context: ${context || "Not provided"}

Feature Description:
${featureText}
`;

  if (clarificationNotes) {
    prompt += `\nClarification Notes from previous analysis:\n${clarificationNotes}\n`;
  }

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      executiveSummary: {
        type: Type.STRING,
        description: "A short summary of the feature's clarity and overall risk level.",
      },
      implicitAssumptions: {
        type: Type.OBJECT,
        properties: {
          behavioral: { type: Type.ARRAY, items: { type: Type.STRING } },
          technical: { type: Type.ARRAY, items: { type: Type.STRING } },
          business: { type: Type.ARRAY, items: { type: Type.STRING } },
          ux: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
      systemRiskScenarios: {
        type: Type.OBJECT,
        properties: {
          failureStates: { type: Type.ARRAY, items: { type: Type.STRING } },
          permissionConflicts: { type: Type.ARRAY, items: { type: Type.STRING } },
          emptyDataScenarios: { type: Type.ARRAY, items: { type: Type.STRING } },
          concurrencyIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
          userMisusePatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
      predictedUxProblems: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            problem: { type: Type.STRING },
            severity: { type: Type.STRING, description: "Low, Medium, or High" },
            description: { type: Type.STRING },
          },
        },
      },
      nextActions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: [
      "executiveSummary",
      "implicitAssumptions",
      "systemRiskScenarios",
      "predictedUxProblems",
      "nextActions",
    ],
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2,
    },
  });

  const jsonStr = response.text || "{}";
  try {
    return JSON.parse(jsonStr);
  } catch (err: any) {
    const error = new Error("Failed to parse JSON response from Gemini.");
    (error as any).rawResponse = jsonStr;
    throw error;
  }
}
