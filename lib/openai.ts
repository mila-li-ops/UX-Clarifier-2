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

const ASSUMPTION_ITEM_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short label for the assumption (max 10 words)" },
    description: { type: "string", description: "Full statement of the assumption as it applies to this specific feature" },
    sourceQuote: { type: "string", description: "A short verbatim excerpt (max 25 words) from the user's feature description that this assumption is derived from. Quote the exact words if possible." },
    severity: { type: "string", description: "High, Medium, or Low — based on how badly the feature breaks if this assumption is wrong" },
    likelihood: { type: "string", description: "High, Medium, or Low — how likely this assumption is to be wrong in practice" },
    whyImplicit: { type: "string", description: "Why this assumption exists in this specific feature — reference the feature logic, not a generic statement" },
    consequences: { type: "string", description: "The specific product failure that occurs if this assumption is wrong — describe a real scenario, not a generic risk" },
    clarificationQuestion: { type: "string", description: "A targeted question that suggests a specific validation method (user interview, usability test, analytics, prototype validation)" },
    detectionStage: { type: "string", description: "When this would realistically surface: Discovery, Design Review, Prototyping, Usability Testing, Development, or Post-Launch" },
  },
  required: ["title", "description", "sourceQuote", "severity", "likelihood", "whyImplicit", "consequences", "clarificationQuestion", "detectionStage"],
  additionalProperties: false,
} as const;

const RISK_ITEM_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short label for the risk scenario (max 10 words)" },
    description: { type: "string", description: "Full description of the risk as it applies to this feature" },
    sourceQuote: { type: "string", description: "A short verbatim excerpt (max 25 words) from the user's feature description that exposes this risk. Quote the exact words if possible." },
    severity: { type: "string", description: "High, Medium, or Low" },
    likelihood: { type: "string", description: "High, Medium, or Low" },
    whyImplicit: { type: "string", description: "What part of the feature design creates or ignores this risk" },
    consequences: { type: "string", description: "The specific product or user impact if this risk materializes — cite the exact failure mode" },
    clarificationQuestion: { type: "string", description: "A targeted question or design review check that would catch this risk before shipping" },
    detectionStage: { type: "string", description: "Discovery, Design Review, Prototyping, Usability Testing, Development, or Post-Launch" },
  },
  required: ["title", "description", "sourceQuote", "severity", "likelihood", "whyImplicit", "consequences", "clarificationQuestion", "detectionStage"],
  additionalProperties: false,
} as const;

export async function analyzeFeature(
  featureText: string,
  title: string,
  featureComplexity: string,
  productType: string,
  platform: string,
  targetUsers: string,
  designStage: string,
  focusArea: string[],
  clarificationNotes?: string
) {
  const systemPrompt = `You are a senior product designer and UX strategist conducting a rigorous clarity audit of a feature description.

Your job is to surface hidden assumptions, structural risks, and likely UX failures that the team has not accounted for.

REASONING RULES — follow these exactly:

1. NO GENERIC FILLER. Never write:
   - "This assumption is not explicitly stated in the feature description"
   - "If false, the feature may fail to meet user needs"
   - Any placeholder that could apply to any feature
   Every field must reference something specific to THIS feature.

2. CONTEXTUAL REASONING. For every item explain:
   - Why this assumption or risk exists in this specific feature (reference the feature mechanics)
   - Which part of the product flow depends on it
   - What specific failure scenario occurs if it is wrong

3. REASONING ANGLE BY TYPE:
   - Behavioral assumptions: focus on user psychology, mental models, workflow habits
   - Technical assumptions: focus on system capabilities, data availability, AI/API limitations, integration constraints
   - UX assumptions: focus on interaction design, cognitive load, learnability, visual hierarchy
   - Failure states: focus on error recovery paths and user trust
   - Permission conflicts: focus on role ambiguity and access edge cases
   - Empty/loading states: focus on first-run experience and blank slate UX
   - Concurrency: focus on multi-user or multi-device race conditions
   - Misuse patterns: focus on power users, confused users, or adversarial use

4. CONCRETE CONSEQUENCES. Describe real product outcomes.
   Bad: "The feature may fail."
   Good: "If the AI confidence score is not surfaced, designers will treat all suggestions as equally reliable, causing high-risk decisions to be made without appropriate scrutiny."

5. SPECIFIC CLARIFICATION QUESTIONS. Each question must:
   - Name a validation method (e.g., "Run a 5-second test with...", "Instrument analytics to track...", "Include in next usability session...")
   - Be answerable — not rhetorical

6. NO REPETITION. Across items in the same category, vary:
   - The reasoning angle
   - The validation approach
   - The consequence framing
   Each item should read like a distinct expert observation.

7. SOURCE ANCHORING. For every item, populate the 'sourceQuote' field with a short verbatim excerpt from the user's feature description that directly triggered this insight. Rules:
   - Quote the user's exact words (max 25 words), not your paraphrase
   - If the insight comes from an absence or omission (something NOT stated), quote the closest related phrase and note the gap in 'whyImplicit'
   - Never leave 'sourceQuote' generic — it must point to a specific sentence or phrase in the input

8. OUTPUT VOLUME REQUIREMENTS. Always generate enough items to cover real risks — do not under-generate:
   - Implicit assumptions (behavioral, technical, ux): 2–4 items each if the feature has enough surface area
   - System risk scenarios (failureStates, emptyDataScenarios, userMisusePatterns): 2–3 items each
   - permissionConflicts and concurrencyIssues: 1–3 items if applicable, or 1 minimal item if truly not applicable
   - predictedUxProblems: 3–5 items minimum
   - nextActions: 4–6 concrete steps
   If a category genuinely has fewer risks, return fewer — but never omit items just to be brief.

Write as a thoughtful senior PM doing a pre-mortem, not a template engine.`;

  let userPrompt = `Analyze the following feature for UX clarity, implicit assumptions, structural risks, and likely UX failures.

Feature Title: ${title || "Untitled Feature"}
Feature Complexity: ${featureComplexity || "Not specified"}
Design Stage: ${designStage || "Not specified"}
Product Type: ${productType || "Not specified"}
Platform: ${platform || "Not specified"}
Target Users: ${targetUsers || "Not specified"}
${focusArea && focusArea.length > 0 ? `Focus Areas: ${focusArea.join(', ')}\n` : ''}
Feature Description:
${featureText}`;

  if (clarificationNotes) {
    userPrompt += `\n\nClarification Notes from previous analysis:\n${clarificationNotes}`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "feature_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            suggestedTitle: {
              type: "string",
              description: "A concise feature title (3-6 words) inferred from the feature description.",
            },
            executiveSummary: {
              type: "string",
              description: "2-3 sentence summary of the feature's clarity gaps and the most critical risk area.",
            },
            clarityLevel: {
              type: "string",
              description: "Overall clarity level: Low, Moderate, or High.",
            },
            mainIssues: {
              type: "array",
              items: { type: "string" },
              description: "Top 3 most critical gaps — each must be a single concise sentence, max 12 words. Name the gap only, no elaboration.",
            },
            implicitAssumptions: {
              type: "object",
              properties: {
                behavioral: { type: "array", items: ASSUMPTION_ITEM_SCHEMA },
                technical: { type: "array", items: ASSUMPTION_ITEM_SCHEMA },
                ux: { type: "array", items: ASSUMPTION_ITEM_SCHEMA },
              },
              required: ["behavioral", "technical", "ux"],
              additionalProperties: false,
            },
            systemRiskScenarios: {
              type: "object",
              properties: {
                failureStates: { type: "array", items: RISK_ITEM_SCHEMA },
                permissionConflicts: { type: "array", items: RISK_ITEM_SCHEMA },
                emptyDataScenarios: { type: "array", items: RISK_ITEM_SCHEMA },
                concurrencyIssues: { type: "array", items: RISK_ITEM_SCHEMA },
                userMisusePatterns: { type: "array", items: RISK_ITEM_SCHEMA },
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
                  description: { type: "string", description: "Specific usability friction tied to this feature's interaction design" },
                  sourceQuote: { type: "string", description: "A short verbatim excerpt (max 25 words) from the feature description that this UX problem is tied to." },
                  whyImplicit: { type: "string", description: "What design decision or omission creates this friction" },
                  consequences: { type: "string", description: "Measurable impact: abandonment, error rate, support tickets, etc." },
                  clarificationQuestion: { type: "string", description: "Specific usability test or design review question to validate" },
                  detectionStage: { type: "string" },
                  likelihood: { type: "string", description: "High, Medium, or Low" },
                },
                required: ["problem", "severity", "description", "sourceQuote", "whyImplicit", "consequences", "clarificationQuestion", "detectionStage", "likelihood"],
                additionalProperties: false,
              },
            },
            nextActions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string", description: "Concrete next step — name the action and who should do it." },
                  linkedRisk: { type: "string", description: "The exact title of the assumption, risk, or UX problem this action directly addresses. Must match one of the titles generated above." },
                },
                required: ["action", "linkedRisk"],
                additionalProperties: false,
              },
              description: "Concrete, prioritized next steps. Each item must be tied to a specific risk, assumption, or UX problem from this analysis.",
            },
          },
          required: ["suggestedTitle", "executiveSummary", "clarityLevel", "mainIssues", "implicitAssumptions", "systemRiskScenarios", "predictedUxProblems", "nextActions"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
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