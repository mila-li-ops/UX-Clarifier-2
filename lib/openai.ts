import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractContentFromImage(base64Data: string, mimeType: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Data}` },
          },
          {
            type: "text",
            text: "Extract all the text from this image accurately. Preserve the structure as much as possible. Do not add any extra commentary.",
          },
        ],
      },
    ],
  });
  return response.choices[0]?.message?.content || "";
}

export async function extractContentFromDocument(base64Data: string, mimeType: string): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename: "document.pdf",
            file_data: `data:${mimeType};base64,${base64Data}`,
          },
          {
            type: "input_text",
            text: "Extract all the text from this document accurately. Preserve the structure as much as possible. Do not add any extra commentary.",
          },
        ],
      },
    ],
  });
  return response.output_text || "";
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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "feature_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            executiveSummary: {
              type: "string",
              description: "A short summary of the feature's clarity and overall risk level.",
            },
            implicitAssumptions: {
              type: "object",
              properties: {
                behavioral: { type: "array", items: { type: "string" } },
                technical: { type: "array", items: { type: "string" } },
                business: { type: "array", items: { type: "string" } },
                ux: { type: "array", items: { type: "string" } },
              },
              required: ["behavioral", "technical", "business", "ux"],
              additionalProperties: false,
            },
            systemRiskScenarios: {
              type: "object",
              properties: {
                failureStates: { type: "array", items: { type: "string" } },
                permissionConflicts: { type: "array", items: { type: "string" } },
                emptyDataScenarios: { type: "array", items: { type: "string" } },
                concurrencyIssues: { type: "array", items: { type: "string" } },
                userMisusePatterns: { type: "array", items: { type: "string" } },
              },
              required: ["failureStates", "permissionConflicts", "emptyDataScenarios", "concurrencyIssues", "userMisusePatterns"],
              additionalProperties: false,
            },
            predictedUxProblems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  problem: { type: "string" },
                  severity: { type: "string", description: "Low, Medium, or High" },
                  description: { type: "string" },
                },
                required: ["problem", "severity", "description"],
                additionalProperties: false,
              },
            },
            nextActions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["executiveSummary", "implicitAssumptions", "systemRiskScenarios", "predictedUxProblems", "nextActions"],
          additionalProperties: false,
        },
      },
    },
    messages: [{ role: "user", content: prompt }],
  });

  const jsonStr = response.choices[0]?.message?.content || "{}";
  try {
    return JSON.parse(jsonStr);
  } catch (err: any) {
    const error = new Error("Failed to parse JSON response from OpenAI.");
    (error as any).rawResponse = jsonStr;
    throw error;
  }
}