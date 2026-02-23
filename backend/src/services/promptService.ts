import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY missing");
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type PromptTemplate =
  | "comprehensive"
  | "budget"
  | "itinerary";

export interface PromptConfig {
  model?: string;
  template?: PromptTemplate;
  temperature?: number;
  structured?: boolean;
}

const estimateTokens = (text: string) =>
  Math.ceil(text.length / 4);

function buildComprehensivePrompt(data: any): string {
  const { trip, members = [], locationResult, budgetResult } = data;

  return `
You are a professional Thai travel planner.

Trip: ${trip.trip_name}
Duration: ${trip.num_days} days
Group Size: ${members.length}
Destination: ${locationResult?.province_name ?? "TBD"}

Budget:
${JSON.stringify(budgetResult ?? {}, null, 2)}

Provide:
- Full itinerary
- Budget validation
- Accommodation suggestion
- Transport plan
- Risk warnings

Return structured JSON.
`;
}

function buildBudgetPrompt(data: any): string {
  return `
Analyze this travel budget:
${JSON.stringify(data.budgetResult ?? {}, null, 2)}

Give optimization advice and feasibility score.
`;
}

export class PromptService {
  static async generate(data: any, config?: PromptConfig) {
    const template = config?.template ?? "comprehensive";
    const model = config?.model ?? "gpt-4o-mini";

    let prompt =
      template === "budget"
        ? buildBudgetPrompt(data)
        : buildComprehensivePrompt(data);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert travel planning assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config?.temperature ?? 0.4,
    });

    const content = response.choices?.[0]?.message?.content ?? null;

    return {
      result: content,
      metadata: {
        model,
        timestamp: new Date().toISOString(),
      },
    };
  }
}