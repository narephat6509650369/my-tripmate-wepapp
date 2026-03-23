import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY missing");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============== TYPES ==============

export type AIModel =
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "claude-3-opus"
  | "claude-3-sonnet"
  | "gemini-pro";

export type PromptTemplate =
  | "comprehensive"
  | "itinerary"
  | "budget"
  | "activities"
  | "accommodation"
  | "optimization";

export interface PromptConfig {
  model?: string;
  template?: PromptTemplate;
  temperature?: number;
  maxTokens?: number;
  includeCOT?: boolean;       // Chain-of-Thought
  includeExamples?: boolean;  // Few-shot examples
  structured?: boolean;       // JSON output
}

export interface PromptMetadata {
  estimatedTokens: number;
  estimatedCost: number;
  model: string;
  version: string;
  timestamp: string;
}

// ============== MODEL CONFIGURATIONS ==============

export const MODEL_CONFIGS = {
  "gpt-4": {
    name: "GPT-4",
    provider: "OpenAI",
    maxTokens: 8192,
    costPer1kTokens: { input: 0.03, output: 0.06 },
    strengths: ["Complex reasoning", "Detailed analysis", "Creative solutions"],
    icon: "🧠",
  },
  "gpt-3.5-turbo": {
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    maxTokens: 4096,
    costPer1kTokens: { input: 0.0015, output: 0.002 },
    strengths: ["Fast responses", "Cost-effective", "General purpose"],
    icon: "⚡",
  },
  "claude-3-opus": {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    maxTokens: 4096,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    strengths: ["Long context", "Nuanced understanding", "Safety-focused"],
    icon: "🎯",
  },
  "claude-3-sonnet": {
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    maxTokens: 4096,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    strengths: ["Balanced performance", "Good value", "Reliable"],
    icon: "🎨",
  },
  "gemini-pro": {
    name: "Gemini Pro",
    provider: "Google",
    maxTokens: 8192,
    costPer1kTokens: { input: 0.00025, output: 0.0005 },
    strengths: ["Multimodal", "Fast", "Very affordable"],
    icon: "💎",
  },
} as const;

// ============== TOKEN & COST UTILS ==============

/**
 * Estimate token count (approx: 1 token ≈ 4 characters in Thai/English mix)
 */
export const estimateTokens = (text: string): number =>
  Math.ceil(text.length / 4);

/**
 * Calculate estimated cost for a prompt
 */
export const estimateCost = (text: string, model: string): number => {
  const tokens = estimateTokens(text);
  const config = MODEL_CONFIGS[model as AIModel];
  if (!config) return 0;
  const inputCost = (tokens / 1000) * config.costPer1kTokens.input;
  const estimatedOutputTokens = tokens * 0.5;
  const outputCost =
    (estimatedOutputTokens / 1000) * config.costPer1kTokens.output;
  return inputCost + outputCost;
};

// ============== HELPER ==============

function getRegionFromProvince(province: string): string {
  if (!province) return "ไม่ระบุ";
  const regions: Record<string, string[]> = {
    ภาคเหนือ: ["เชียงใหม่", "เชียงราย", "ลำปาง", "ลำพูน", "แม่ฮ่องสอน"],
    ภาคกลาง: ["กรุงเทพ", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ"],
    ภาคตะวันออก: ["ชลบุรี", "ระยอง", "จันทบุรี", "ตราด"],
    ภาคใต้: ["ภูเก็ต", "กระบี่", "สุราษฎร์ธานี", "นครศรีธรรมราช"],
    ภาคตะวันออกเหนือ: ["นครราชสีมา", "อุบลราชธานี", "ขอนแก่น", "อุดรธานี"],
  };

  for (const [region, provinces] of Object.entries(regions)) {
    if (provinces.some((p) => province.includes(p))) return region;
  }
  return "ไม่ระบุ";
}

// ============== SYSTEM PROMPTS ==============

// ✅ แก้ไข: เพิ่มคำสั่งให้ตอบกลับเป็นภาษาไทยทุก system prompt
const SYSTEM_PROMPTS: Record<string, string> = {
  "gpt-4": `คุณคือผู้เชี่ยวชาญด้านการวางแผนท่องเที่ยวในประเทศไทย มีความรู้เชิงลึกด้านการท่องเที่ยว การจัดสรรงบประมาณ และการจัดการกลุ่ม กรุณาตอบกลับเป็นภาษาไทยทุกครั้ง พร้อมให้คำแนะนำที่ละเอียดและนำไปปฏิบัติได้จริง`,
  "claude-3-opus": `คุณคือผู้เชี่ยวชาญด้านการวางแผนท่องเที่ยวในประเทศไทย เชี่ยวชาญด้านจิตวิทยากลุ่ม งบประมาณ และการสร้างประสบการณ์ที่น่าจดจำ กรุณาตอบกลับเป็นภาษาไทยทุกครั้ง ด้วยความละเอียดรอบคอบและคำนึงถึงความต้องการของกลุ่ม`,
  "gemini-pro": `คุณคือที่ปรึกษาท่องเที่ยวไทยผู้เชี่ยวชาญ เน้นคำแนะนำที่ประหยัดและคุ้มค่าสูงสุดสำหรับกลุ่ม กรุณาตอบกลับเป็นภาษาไทยทุกครั้ง`,
};

// ✅ แก้ไข: default system prompt เป็นภาษาไทย
const DEFAULT_SYSTEM_PROMPT =
  "คุณคือผู้เชี่ยวชาญด้านการวางแผนท่องเที่ยวในประเทศไทย กรุณาตอบกลับเป็นภาษาไทยทุกครั้ง พร้อมให้คำแนะนำที่ละเอียดและนำไปปฏิบัติได้จริง";

// ============== PROMPT BUILDERS ==============

// ✅ แก้ไข: สร้าง prompt ใหญ่แบบครบทุกอย่าง พร้อมสั่งให้ตอบเป็นภาษาไทย
function buildComprehensivePrompt(data: any, config: PromptConfig): string {
  const { trip, members = [], locationResult, dateResult, budgetResult } = data;

  const structuredData = {
    trip: {
      name: trip.trip_name,
      description: trip.description,
      duration: `${trip.num_days} วัน`,
      code: trip.trip_code,
    },
    group: {
      size: members.length,
      estimated_ages: "20-35",
      gender_ratio: "กลุ่มผสม",
    },
    dates: dateResult
      ? {
          preferred: dateResult.final_dates,
          availability: `${dateResult.voter_count}/${members.length} คนว่าง`,
        }
      : null,
    budget: budgetResult
      ? {
          accommodation: budgetResult.accommodation,
          transport: budgetResult.transport,
          food: budgetResult.food,
          other: budgetResult.other,
          total_per_person: Object.values(budgetResult as Record<string, number>).reduce(
            (a, b) => a + b,
            0
          ),
          total_group:
            Object.values(budgetResult as Record<string, number>).reduce((a, b) => a + b, 0) *
            members.length,
        }
      : null,
    destination: locationResult?.province_name
      ? {
          province: locationResult.province_name,
          score: locationResult.vote_count,
          region: getRegionFromProvince(locationResult.province_name),
        }
      : null,
  };

  // ✅ แก้ไข: header เป็นภาษาไทย + คำสั่งให้ตอบไทย
  let prompt = `# 🎯 คำขอวางแผนการเดินทาง\n\n`;
  prompt += `⚠️ **กรุณาตอบกลับทั้งหมดเป็นภาษาไทยเท่านั้น**\n\n`;
  prompt += `ฉันกำลังวางแผนทริปกับเพื่อน ต้องการคำแนะนำจากผู้เชี่ยวชาญ\n\n`;

  prompt += `## 📋 รายละเอียดทริป\n\n`;
  prompt += `\`\`\`json\n${JSON.stringify(structuredData, null, 2)}\n\`\`\`\n\n`;

  if (config.includeCOT) {
    // ✅ แก้ไข: Analysis framework เป็นภาษาไทย
    prompt += `## 🤔 กรอบการวิเคราะห์\n\n`;
    prompt += `กรุณาวิเคราะห์ทริปนี้อย่างเป็นระบบ:\n`;
    prompt += `1. **พลวัตกลุ่ม**: พิจารณาขนาดกลุ่มและความชอบที่น่าจะเป็น\n`;
    prompt += `2. **ความเป็นไปได้ของงบประมาณ**: ประเมินว่างบสอดคล้องกับจุดหมายและระยะเวลาหรือไม่\n`;
    prompt += `3. **ปัจจัยตามฤดูกาล**: ตรวจสอบว่าช่วงเวลาที่เลือกเหมาะสมกับจุดหมายหรือไม่\n`;
    prompt += `4. **การจัดการด้านโลจิสติกส์**: วางแผนเส้นทางและตารางเวลาที่มีประสิทธิภาพ\n\n`;
  }

  // ✅ แก้ไข: คำถามหลักเป็นภาษาไทย
  prompt += `## ❓ คำถามหลัก\n\n`;

  if (locationResult) {
    prompt += `1. **การตรวจสอบจุดหมาย**: ${locationResult.province_name} เหมาะสมสำหรับ ${members.length} คน งบ ฿${structuredData.budget?.total_per_person?.toLocaleString()} ต่อคนหรือไม่?\n`;
    prompt += `2. **สถานที่ห้ามพลาด**: สถานที่ยอดนิยม 5-7 แห่งใน${locationResult.province_name} สำหรับทริป ${trip.num_days} วัน\n`;
  }

  if (budgetResult) {
    prompt += `3. **ที่พัก**: แนะนำโรงแรม/โฮสเทลที่เหมาะสมในงบ ฿${budgetResult.accommodation.toLocaleString()} ต่อคน\n`;
    prompt += `4. **การเดินทาง**: วิธีการเดินทางที่เหมาะสมพร้อมรายละเอียดค่าใช้จ่าย (งบ ฿${budgetResult.transport.toLocaleString()} ต่อคน)\n`;
    prompt += `5. **แผนอาหาร**: แนะนำร้านอาหารในงบ ฿${budgetResult.food.toLocaleString()} ต่อคน ต่อวัน\n`;
  }

  prompt += `6. **ตารางกิจกรรมรายวัน**: กำหนดการแบบชั่วโมงต่อชั่วโมงเพื่อความสนุกสูงสุด\n`;
  prompt += `7. **การเพิ่มประสิทธิภาพงบประมาณ**: มีวิธีเพิ่มความคุ้มค่าในงบที่มีหรือไม่?\n`;
  prompt += `8. **การลดความเสี่ยง**: ข้อควรระวังด้านสภาพอากาศ ฤดูกาล หรือเคล็ดลับการจอง\n\n`;

  if (config.structured) {
    // ✅ แก้ไข: คำสั่ง JSON output เป็นภาษาไทย (โดย key ยังเป็น English เพื่อ parse ง่าย)
    prompt += `## 📤 รูปแบบผลลัพธ์ที่ต้องการ\n\n`;
    prompt += `กรุณาตอบกลับในรูปแบบ JSON ที่มีโครงสร้างชัดเจน โดยค่าทั้งหมดให้เป็นภาษาไทย:\n`;
    prompt += `\`\`\`json\n`;
    prompt += `{\n`;
    prompt += `  "validation": { "suitable": boolean, "concerns": [], "suggestions": [] },\n`;
    prompt += `  "itinerary": { "day1": {...}, "day2": {...} },\n`;
    prompt += `  "accommodation": { "recommendations": [...], "booking_tips": "" },\n`;
    prompt += `  "transportation": { "method": "", "cost_breakdown": {...}, "booking_info": "" },\n`;
    prompt += `  "dining": { "restaurants": [...], "food_costs": {...} },\n`;
    prompt += `  "budget_analysis": { "total": 0, "optimization_tips": [] },\n`;
    prompt += `  "practical_tips": { "weather": "", "packing": [], "local_customs": [] }\n`;
    prompt += `}\n`;
    prompt += `\`\`\`\n\n`;
  }

  if (config.includeExamples) {
    // ✅ แก้ไข: ตัวอย่างเป็นภาษาไทย
    prompt += `## 💡 ตัวอย่างรูปแบบการวิเคราะห์\n\n`;
    prompt += `*ตัวอย่างสำหรับเชียงใหม่ 3 วัน 4 คน งบ ฿5,000 ต่อคน:*\n\n`;
    prompt += `**วันที่ 1: สำรวจเมืองเก่า**\n`;
    prompt += `- 09:00 น.: วัดพระธาตุดอยสุเทพ (ค่าเข้า ฿50)\n`;
    prompt += `- 12:00 น.: ทานข้าวที่ร้านเฮือนเพ็ญ (฿150 ต่อคน)\n`;
    prompt += `- 14:00 น.: เดินชมวัดในเมืองเก่า (ฟรี)\n`;
    prompt += `- 19:00 น.: ถนนคนเดินวันเสาร์ (฿300 ต่อคน)\n\n`;
    prompt += `กรุณาให้รายละเอียดในระดับเดียวกันสำหรับ${locationResult?.province_name}\n\n`;
  }

  prompt += `---\n\n`;
  prompt += `กรุณาให้คำแนะนำที่ครอบคลุมและนำไปปฏิบัติได้จริง ระบุชื่อสถานที่ ราคา และเคล็ดลับการจองให้ชัดเจน **ตอบกลับเป็นภาษาไทยทั้งหมด** 🙏`;

  return prompt;
}

// ✅ แก้ไข: สร้าง prompt เน้นตารางทริป เป็นภาษาไทย
function buildItineraryPrompt(data: any, config: PromptConfig): string {
  const { trip, members = [], locationResult, dateResult } = data;

  let prompt = `# 🗺️ คำขอวางแผนตารางการเดินทาง\n\n`;
  prompt += `⚠️ **กรุณาตอบกลับทั้งหมดเป็นภาษาไทยเท่านั้น**\n\n`;
  prompt += `กรุณาวางแผนตารางการเดินทาง ${trip.num_days} วัน สำหรับ${locationResult?.province_name || "ประเทศไทย"}\n\n`;
  prompt += `**กลุ่ม**: ${members.length} คน\n`;

  if (dateResult) {
    prompt += `**วันที่**: ${dateResult.final_dates.join(", ")}\n`;
  }

  prompt += `**เป้าหมาย**: เพิ่มประสบการณ์สูงสุดพร้อมการเดินทางที่มีประสิทธิภาพ\n\n`;
  prompt += `## สิ่งที่ต้องการ\n\n`;
  prompt += `- รายละเอียดแบบชั่วโมงต่อชั่วโมงสำหรับแต่ละวัน\n`;
  prompt += `- รวมเวลาเดินทางระหว่างสถานที่\n`;
  prompt += `- ผสมกิจกรรมหลากหลาย (วัฒนธรรม ธรรมชาติ อาหาร พักผ่อน)\n`;
  prompt += `- คำนึงถึงเวลามื้ออาหาร\n`;
  prompt += `- ความเร็วที่เหมาะสมสำหรับกลุ่ม ${members.length} คน\n\n`;

  if (config.structured) {
    prompt += `ตอบกลับในรูปแบบ JSON โดยค่าทั้งหมดเป็นภาษาไทย:\n`;
    prompt += `\`\`\`json\n`;
    prompt += `{\n`;
    prompt += `  "days": [\n`;
    prompt += `    {\n`;
    prompt += `      "day": 1,\n`;
    prompt += `      "theme": "string",\n`;
    prompt += `      "schedule": [\n`;
    prompt += `        { "time": "09:00", "activity": "...", "location": "...", "duration": "2 ชั่วโมง", "cost": 0 }\n`;
    prompt += `      ]\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n`;
    prompt += `\`\`\`\n`;
  }

  return prompt;
}

// ✅ แก้ไข: วิเคราะห์งบ เป็นภาษาไทย
function buildBudgetPrompt(data: any, config: PromptConfig): string {
  const { trip, members = [], budgetResult, locationResult } = data;

  let prompt = `# 💰 การวิเคราะห์และเพิ่มประสิทธิภาพงบประมาณ\n\n`;
  prompt += `⚠️ **กรุณาตอบกลับทั้งหมดเป็นภาษาไทยเท่านั้น**\n\n`;

  if (budgetResult) {
    const total = Object.values(budgetResult as Record<string, number>).reduce(
      (a, b) => a + b,
      0
    );

    prompt += `วิเคราะห์งบประมาณการเดินทางดังนี้:\n\n`;
    prompt += `**จุดหมาย**: ${locationResult?.province_name || "ยังไม่กำหนด"}\n`;
    prompt += `**ระยะเวลา**: ${trip.num_days} วัน\n`;
    prompt += `**จำนวนคน**: ${members.length} คน\n\n`;
    prompt += `**รายละเอียดงบประมาณ (ต่อคน)**:\n`;
    prompt += `- 🏠 ที่พัก: ฿${budgetResult.accommodation.toLocaleString()}\n`;
    prompt += `- 🚗 การเดินทาง: ฿${budgetResult.transport.toLocaleString()}\n`;
    prompt += `- 🍜 อาหาร: ฿${budgetResult.food.toLocaleString()}\n`;
    prompt += `- 💼 อื่นๆ/สำรอง: ฿${budgetResult.other.toLocaleString()}\n`;
    prompt += `- **รวม**: ฿${total.toLocaleString()}\n\n`;
    prompt += `**งบรวมทั้งกลุ่ม**: ฿${(total * members.length).toLocaleString()}\n\n`;
  }

  prompt += `## สิ่งที่ต้องวิเคราะห์\n\n`;
  prompt += `1. **ความเป็นไปได้**: งบประมาณนี้สมจริงสำหรับจุดหมายและระยะเวลาหรือไม่?\n`;
  prompt += `2. **การกระจายงบ**: การจัดสรรงบเหมาะสมหรือไม่?\n`;
  prompt += `3. **การเพิ่มคุณค่า**: วิธีเฉพาะในการยืดงบประมาณให้คุ้มค่า\n`;
  prompt += `4. **จุดเสี่ยง**: ส่วนที่ค่าใช้จ่ายอาจเกินประมาณ\n`;
  prompt += `5. **กิจกรรมเพิ่มมูลค่า**: กิจกรรมฟรีหรือราคาถูกที่ช่วยเพิ่มความสนุก\n\n`;

  if (config.structured) {
    prompt += `ตอบกลับในรูปแบบ JSON โดยค่าทั้งหมดเป็นภาษาไทย:\n`;
    prompt += `\`\`\`json\n`;
    prompt += `{\n`;
    prompt += `  "feasibility_score": 0-10,\n`;
    prompt += `  "concerns": [],\n`;
    prompt += `  "optimization_tips": [],\n`;
    prompt += `  "revised_budget": {},\n`;
    prompt += `  "cost_saving_ideas": []\n`;
    prompt += `}\n`;
    prompt += `\`\`\`\n`;
  }

  return prompt;
}

// ✅ แก้ไข: แนะนำกิจกรรม เป็นภาษาไทย
function buildActivitiesPrompt(data: any, config: PromptConfig): string {
  const { trip, members = [], locationResult, budgetResult } = data;

  let prompt = `# 🎯 คำแนะนำกิจกรรม\n\n`;
  prompt += `⚠️ **กรุณาตอบกลับทั้งหมดเป็นภาษาไทยเท่านั้น**\n\n`;
  prompt += `แนะนำกิจกรรมสำหรับ ${members.length} คน ที่เดินทางไป${locationResult?.province_name || "ประเทศไทย"}\n\n`;

  prompt += `**ข้อกำหนด**:\n`;
  prompt += `- ระยะเวลา: ${trip.num_days} วัน\n`;

  if (budgetResult) {
    const activityBudget = budgetResult.other + budgetResult.food * 0.3;
    prompt += `- งบกิจกรรม: ~฿${Math.round(activityBudget).toLocaleString()} ต่อคน\n`;
  }

  prompt += `- จำนวนกลุ่ม: ${members.length} คน (ส่งผลต่อกิจกรรมกลุ่ม)\n\n`;

  prompt += `## หมวดหมู่ที่ต้องครอบคลุม\n\n`;
  prompt += `1. 🏛️ **วัฒนธรรม/ประวัติศาสตร์** (วัด พิพิธภัณฑ์ แหล่งมรดก)\n`;
  prompt += `2. 🌳 **ธรรมชาติ/กลางแจ้ง** (อุทยาน จุดชมวิว การเดินป่า)\n`;
  prompt += `3. 🍜 **ประสบการณ์อาหาร** (ตลาด คลาสทำอาหาร ทัวร์ชิมอาหาร)\n`;
  prompt += `4. 🎨 **เอกลักษณ์/ท้องถิ่น** (งานหัตถกรรม เวิร์กช็อป ปฏิสัมพันธ์ชุมชน)\n`;
  prompt += `5. 📸 **จุดถ่ายรูป** (สถานที่สวยงามเหมาะถ่ายภาพ)\n`;
  prompt += `6. 💆 **พักผ่อนหย่อนใจ** (สปา คาเฟ่ สถานที่ผ่อนคลาย)\n\n`;

  prompt += `สำหรับแต่ละคำแนะนำ กรุณาระบุ:\n`;
  prompt += `- ชื่อและคำอธิบายสั้น\n`;
  prompt += `- ค่าใช้จ่ายโดยประมาณต่อคน\n`;
  prompt += `- เวลาที่ใช้\n`;
  prompt += `- ช่วงเวลาที่ดีที่สุด\n`;
  prompt += `- ข้อกำหนดการจอง (ถ้ามี)\n`;
  prompt += `- เหตุผลที่เหมาะสำหรับกลุ่ม ${members.length} คน\n\n`;

  return prompt;
}

// ✅ แก้ไข: แนะนำที่พัก เป็นภาษาไทย
function buildAccommodationPrompt(data: any, config: PromptConfig): string {
  const { trip, members = [], locationResult, budgetResult, dateResult } = data;

  let prompt = `# 🏨 คำแนะนำที่พัก\n\n`;
  prompt += `⚠️ **กรุณาตอบกลับทั้งหมดเป็นภาษาไทยเท่านั้น**\n\n`;

  if (budgetResult && locationResult) {
    const nightlyBudget = budgetResult.accommodation / (trip.num_days - 1);

    prompt += `ค้นหาที่พักที่เหมาะสมใน${locationResult.province_name}:\n\n`;
    prompt += `**ความต้องการ**:\n`;
    prompt += `- กลุ่ม: ${members.length} คน\n`;
    prompt += `- ระยะเวลา: ${trip.num_days - 1} คืน\n`;
    prompt += `- งบประมาณ: ฿${Math.round(nightlyBudget).toLocaleString()} ต่อคน ต่อคืน\n`;

    if (dateResult) {
      prompt += `- วันที่: ${dateResult.final_dates[0]} ถึง ${
        dateResult.final_dates[dateResult.final_dates.length - 1]
      }\n`;
    }

    prompt += `\n`;
    prompt += `## แนะนำ 3-5 ตัวเลือก\n\n`;
    prompt += `สำหรับแต่ละตัวเลือก กรุณาระบุ:\n`;
    prompt += `1. **ชื่อและประเภท** (โรงแรม/โฮสเทล/เกสต์เฮาส์/Airbnb)\n`;
    prompt += `2. **ที่ตั้ง** (ย่าน/ทำเล + ระยะทางจากสถานที่ท่องเที่ยว)\n`;
    prompt += `3. **ช่วงราคา** (ต่อคืน ต่อคน)\n`;
    prompt += `4. **การจัดห้อง** (แบ่งห้องอย่างไรสำหรับ ${members.length} คน)\n`;
    prompt += `5. **สิ่งอำนวยความสะดวก** (WiFi อาหารเช้า สระว่ายน้ำ ฯลฯ)\n`;
    prompt += `6. **ข้อดีและข้อเสีย** สำหรับการเดินทางแบบกลุ่ม\n`;
    prompt += `7. **เคล็ดลับการจอง** (แพลตฟอร์ม ควรจองล่วงหน้านานแค่ไหน นโยบายยกเลิก)\n`;
    prompt += `8. **การเดินทาง** (การเข้าถึงขนส่งสาธารณะและสถานที่ท่องเที่ยว)\n\n`;

    prompt += `## ให้ความสำคัญกับ\n`;
    prompt += `- ความคุ้มค่า\n`;
    prompt += `- ความสะดวกด้านที่ตั้ง\n`;
    prompt += `- สิ่งอำนวยความสะดวกที่เหมาะกับกลุ่ม\n`;
    prompt += `- ความปลอดภัยและความสะอาด\n\n`;
  }

  return prompt;
}

// ============== PROMPT GENERATOR ==============

function buildPrompt(data: any, config: PromptConfig): string {
  switch (config.template) {
    case "itinerary":
      return buildItineraryPrompt(data, config);
    case "budget":
      return buildBudgetPrompt(data, config);
    case "activities":
      return buildActivitiesPrompt(data, config);
    case "accommodation":
      return buildAccommodationPrompt(data, config);
    case "comprehensive":
    case "optimization":
    default:
      return buildComprehensivePrompt(data, config);
  }
}


// ============== SERVICE ==============

export class PromptService {
  /**
   * Generate only the prompt string (no AI call)
   */
  static buildPromptOnly(data: any, config?: PromptConfig): string {
    const resolvedConfig: PromptConfig = {
      template: "comprehensive",
      model: "gpt-4o-mini",
      ...config,
    };
    return buildPrompt(data, resolvedConfig);
  }

  /**
   * Get prompt + metadata (no AI call)
   */
  static buildPromptWithMetadata(
    data: any,
    config?: PromptConfig
  ) {
    const resolvedConfig: PromptConfig = {
      template: "comprehensive",
      model: "gpt-4o-mini",
      ...config,
    };

    const prompt = buildPrompt(data, resolvedConfig);

    return {
      prompt,
      metadata: {
        estimatedTokens: estimateTokens(prompt),
        estimatedCost: estimateCost(prompt, resolvedConfig.model ?? "gpt-4o-mini"),
        model: resolvedConfig.model ?? "gpt-4o-mini",
        version: "2.0.0",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export default PromptService;