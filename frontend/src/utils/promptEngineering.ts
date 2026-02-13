// src/utils/promptEngineering.ts

/**
 * 🤖 AI Prompt Engineering Utilities
 * 
 * Professional prompt templates and utilities for AI integration
 * Supports multiple AI models with optimized prompts for each
 */

import type { TripSummaryResult } from '../types';

// ============== TYPES ==============

export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'gemini-pro';

export type PromptTemplate = 
  | 'comprehensive'    // ครอบคลุมทุกอย่าง
  | 'itinerary'        // วางแผนเส้นทาง
  | 'budget'           // วิเคราะห์งบประมาณ
  | 'activities'       // แนะนำกิจกรรม
  | 'accommodation'    // แนะนำที่พัก
  | 'optimization';    // ปรับปรุงแผน

export interface PromptConfig {
  model: AIModel;
  template: PromptTemplate;
  temperature?: number;
  maxTokens?: number;
  includeCOT?: boolean;      // Chain-of-Thought
  includeExamples?: boolean; // Few-shot examples
  structured?: boolean;      // JSON output
}

export interface PromptMetadata {
  estimatedTokens: number;
  estimatedCost: number;
  model: AIModel;
  version: string;
  timestamp: string;
}

// ============== MODEL CONFIGURATIONS ==============

export const MODEL_CONFIGS = {
  'gpt-4': {
    name: 'GPT-4',
    provider: 'OpenAI',
    maxTokens: 8192,
    costPer1kTokens: { input: 0.03, output: 0.06 },
    strengths: ['Complex reasoning', 'Detailed analysis', 'Creative solutions'],
    icon: '🧠'
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    maxTokens: 4096,
    costPer1kTokens: { input: 0.0015, output: 0.002 },
    strengths: ['Fast responses', 'Cost-effective', 'General purpose'],
    icon: '⚡'
  },
  'claude-3-opus': {
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    maxTokens: 4096,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    strengths: ['Long context', 'Nuanced understanding', 'Safety-focused'],
    icon: '🎯'
  },
  'claude-3-sonnet': {
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    maxTokens: 4096,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    strengths: ['Balanced performance', 'Good value', 'Reliable'],
    icon: '🎨'
  },
  'gemini-pro': {
    name: 'Gemini Pro',
    provider: 'Google',
    maxTokens: 8192,
    costPer1kTokens: { input: 0.00025, output: 0.0005 },
    strengths: ['Multimodal', 'Fast', 'Very affordable'],
    icon: '💎'
  }
} as const;

// ============== TOKEN ESTIMATION ==============

/**
 * Estimate token count (approximation: 1 token ≈ 4 characters in Thai/English mix)
 */
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

/**
 * Calculate estimated cost for a prompt
 */
export const estimateCost = (text: string, model: AIModel): number => {
  const tokens = estimateTokens(text);
  const config = MODEL_CONFIGS[model];
  const inputCost = (tokens / 1000) * config.costPer1kTokens.input;
  // Assume output is ~50% of input length
  const estimatedOutputTokens = tokens * 0.5;
  const outputCost = (estimatedOutputTokens / 1000) * config.costPer1kTokens.output;
  return inputCost + outputCost;
};

// ============== PROMPT TEMPLATES ==============

/**
 * System prompts for different AI models
 */
const SYSTEM_PROMPTS = {
  'gpt-4': `You are an expert travel planning assistant with deep knowledge of Thailand tourism, budget optimization, and group dynamics. Provide detailed, actionable recommendations.`,
  
  'claude-3-opus': `You are a thoughtful travel planning expert specializing in Thai destinations. You excel at understanding group dynamics, budget constraints, and creating memorable experiences. Be thorough and considerate in your recommendations.`,
  
  'gemini-pro': `Act as a knowledgeable Thai travel consultant. Focus on practical, budget-conscious suggestions that maximize group satisfaction.`
};

/**
 * Generate comprehensive travel planning prompt
 */
const generateComprehensivePrompt = (
  data: TripSummaryResult,
  config: PromptConfig
): string => {
  const { trip, members = [], locationResult, dateResult, budgetResult } = data;
  
  const structuredData = {
    trip: {
      name: trip.trip_name,
      description: trip.description,
      duration: `${trip.num_days} days`,
      code: trip.trip_code
    },
    group: {
      size: members.length,
      // Estimate demographics (would be better with real data)
      estimated_ages: '20-35',
      gender_ratio: 'Mixed group'
    },
    dates: dateResult ? {
      preferred: dateResult.final_dates,
      availability: `${dateResult.voter_count}/${members.length} members available`
    } : null,
    budget: budgetResult ? {
      accommodation: budgetResult.accommodation,
      transport: budgetResult.transport,
      food: budgetResult.food,
      other: budgetResult.other,
      total_per_person: Object.values(budgetResult).reduce((a, b) => a + b, 0),
      total_group: Object.values(budgetResult).reduce((a, b) => a + b, 0) * members.length
    } : null,
    destination: locationResult ? {
      province: locationResult.province_name,
      score: locationResult.vote_count,
      region: getRegionFromProvince(locationResult.province_name)
    } : null
  };

  let prompt = '';

  // Add system context
  if (config.model in SYSTEM_PROMPTS) {
    prompt += `${SYSTEM_PROMPTS[config.model as keyof typeof SYSTEM_PROMPTS]}\n\n`;
  }

  // Main prompt
  prompt += `# 🎯 Travel Planning Request\n\n`;
  
  prompt += `I'm planning a trip with friends and need your expert recommendations.\n\n`;

  // Structured data section
  prompt += `## 📋 Trip Details\n\n`;
  prompt += `\`\`\`json\n${JSON.stringify(structuredData, null, 2)}\n\`\`\`\n\n`;

  // Chain-of-Thought prompting
  if (config.includeCOT) {
    prompt += `## 🤔 Analysis Framework\n\n`;
    prompt += `Please analyze this trip systematically:\n`;
    prompt += `1. **Group Dynamics**: Consider the group size and likely preferences\n`;
    prompt += `2. **Budget Feasibility**: Evaluate if the budget aligns with destination and duration\n`;
    prompt += `3. **Seasonal Factors**: Check if dates are optimal for the destination\n`;
    prompt += `4. **Logistical Flow**: Plan efficient routing and timing\n\n`;
  }

  // Specific questions
  prompt += `## ❓ Key Questions\n\n`;
  
  if (locationResult) {
    prompt += `1. **Destination Validation**: Is ${locationResult.province_name} optimal for ${members.length} people with ฿${structuredData.budget?.total_per_person.toLocaleString()} per person?\n`;
    prompt += `2. **Must-Visit Attractions**: Top 5-7 places in ${locationResult.province_name} for a ${trip.num_days}-day trip\n`;
  }
  
  if (budgetResult) {
    prompt += `3. **Accommodation**: Recommend specific hotels/hostels within ฿${budgetResult.accommodation.toLocaleString()}/person budget\n`;
    prompt += `4. **Transportation**: Optimal travel method with cost breakdown (budget: ฿${budgetResult.transport.toLocaleString()}/person)\n`;
    prompt += `5. **Food Planning**: Restaurant suggestions for ฿${budgetResult.food.toLocaleString()}/person/day\n`;
  }
  
  prompt += `6. **Daily Itinerary**: Hour-by-hour schedule for maximum enjoyment\n`;
  prompt += `7. **Budget Optimization**: Any ways to enhance the trip within current budget?\n`;
  prompt += `8. **Risk Mitigation**: Weather concerns, seasonal issues, or booking tips\n\n`;

  // Output format specification
  if (config.structured) {
    prompt += `## 📤 Required Output Format\n\n`;
    prompt += `Please respond in well-structured JSON format:\n`;
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

  // Few-shot examples (if enabled)
  if (config.includeExamples) {
    prompt += `## 💡 Example Analysis Style\n\n`;
    prompt += `*Example for Chiang Mai, 3 days, 4 people, ฿5000/person:*\n\n`;
    prompt += `**Day 1: Old City Exploration**\n`;
    prompt += `- 09:00: Doi Suthep Temple (฿50 entrance)\n`;
    prompt += `- 12:00: Lunch at Huen Phen (฿150/person)\n`;
    prompt += `- 14:00: Old City temples walk (Free)\n`;
    prompt += `- 19:00: Saturday Night Market (฿300/person)\n\n`;
    prompt += `Please provide similar detailed breakdowns for ${locationResult?.province_name}.\n\n`;
  }

  prompt += `---\n\n`;
  prompt += `Please provide comprehensive, actionable recommendations. Be specific with names, prices, and booking tips. 🙏`;

  return prompt;
};

/**
 * Generate itinerary-focused prompt
 */
const generateItineraryPrompt = (
  data: TripSummaryResult,
  config: PromptConfig
): string => {
  const { trip, members = [], locationResult, dateResult } = data;
  
  let prompt = `# 🗺️ Itinerary Planning Request\n\n`;
  
  prompt += `Create a detailed ${trip.num_days}-day itinerary for ${locationResult?.province_name || 'Thailand'}.\n\n`;
  
  prompt += `**Group**: ${members.length} people\n`;
  if (dateResult) {
    prompt += `**Dates**: ${dateResult.final_dates.join(', ')}\n`;
  }
  prompt += `**Focus**: Maximize experiences while maintaining efficient routing\n\n`;
  
  prompt += `## Requirements\n\n`;
  prompt += `- Hour-by-hour breakdown for each day\n`;
  prompt += `- Include travel time between locations\n`;
  prompt += `- Mix of activities (culture, nature, food, relaxation)\n`;
  prompt += `- Account for meal times\n`;
  prompt += `- Realistic pacing for ${members.length} people\n\n`;
  
  if (config.structured) {
    prompt += `Return as JSON with structure:\n`;
    prompt += `\`\`\`json\n`;
    prompt += `{\n`;
    prompt += `  "days": [\n`;
    prompt += `    {\n`;
    prompt += `      "day": 1,\n`;
    prompt += `      "theme": "string",\n`;
    prompt += `      "schedule": [\n`;
    prompt += `        { "time": "09:00", "activity": "...", "location": "...", "duration": "2h", "cost": 0 }\n`;
    prompt += `      ]\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n`;
    prompt += `\`\`\`\n`;
  }
  
  return prompt;
};

/**
 * Generate budget analysis prompt
 */
const generateBudgetPrompt = (
  data: TripSummaryResult,
  config: PromptConfig
): string => {
  const { trip, members = [], budgetResult, locationResult } = data;
  
  let prompt = `# 💰 Budget Analysis & Optimization\n\n`;
  
  if (budgetResult) {
    const total = Object.values(budgetResult).reduce((a, b) => a + b, 0);
    
    prompt += `Analyze this travel budget:\n\n`;
    prompt += `**Destination**: ${locationResult?.province_name || 'TBD'}\n`;
    prompt += `**Duration**: ${trip.num_days} days\n`;
    prompt += `**Group Size**: ${members.length} people\n\n`;
    prompt += `**Budget Breakdown (per person)**:\n`;
    prompt += `- 🏠 Accommodation: ฿${budgetResult.accommodation.toLocaleString()}\n`;
    prompt += `- 🚗 Transport: ฿${budgetResult.transport.toLocaleString()}\n`;
    prompt += `- 🍜 Food: ฿${budgetResult.food.toLocaleString()}\n`;
    prompt += `- 💼 Other/Reserve: ฿${budgetResult.other.toLocaleString()}\n`;
    prompt += `- **Total**: ฿${total.toLocaleString()}\n\n`;
    prompt += `**Group Total**: ฿${(total * members.length).toLocaleString()}\n\n`;
  }
  
  prompt += `## Analysis Required\n\n`;
  prompt += `1. **Feasibility**: Is this budget realistic for the destination and duration?\n`;
  prompt += `2. **Distribution**: Is the budget allocation optimal?\n`;
  prompt += `3. **Optimization**: Specific ways to stretch the budget\n`;
  prompt += `4. **Risk Areas**: Where might costs exceed estimates?\n`;
  prompt += `5. **Value Adds**: Free/cheap activities to enhance the trip\n\n`;
  
  if (config.structured) {
    prompt += `Respond in JSON:\n`;
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
};

/**
 * Generate activities recommendation prompt
 */
const generateActivitiesPrompt = (
  data: TripSummaryResult,
  config: PromptConfig
): string => {
  const { trip, members = [], locationResult, budgetResult } = data;
  
  let prompt = `# 🎯 Activity Recommendations\n\n`;
  
  prompt += `Suggest activities for ${members.length} people visiting ${locationResult?.province_name || 'Thailand'}.\n\n`;
  
  prompt += `**Constraints**:\n`;
  prompt += `- Duration: ${trip.num_days} days\n`;
  if (budgetResult) {
    const activityBudget = budgetResult.other + (budgetResult.food * 0.3); // Rough estimate
    prompt += `- Activity Budget: ~฿${Math.round(activityBudget).toLocaleString()}/person\n`;
  }
  prompt += `- Group Size: ${members.length} (affects group activities)\n\n`;
  
  prompt += `## Categories to Cover\n\n`;
  prompt += `1. 🏛️ **Cultural/Historical** (temples, museums, heritage sites)\n`;
  prompt += `2. 🌳 **Nature/Outdoor** (parks, viewpoints, trekking)\n`;
  prompt += `3. 🍜 **Food Experiences** (markets, cooking classes, food tours)\n`;
  prompt += `4. 🎨 **Unique/Local** (crafts, workshops, local interactions)\n`;
  prompt += `5. 📸 **Photo Spots** (Instagram-worthy locations)\n`;
  prompt += `6. 💆 **Relaxation** (spas, cafes, chill spots)\n\n`;
  
  prompt += `For each recommendation, provide:\n`;
  prompt += `- Name and brief description\n`;
  prompt += `- Estimated cost per person\n`;
  prompt += `- Time required\n`;
  prompt += `- Best time to visit\n`;
  prompt += `- Booking requirements (if any)\n`;
  prompt += `- Why it's great for groups of ${members.length}\n\n`;
  
  return prompt;
};

/**
 * Generate accommodation recommendation prompt
 */
const generateAccommodationPrompt = (
  data: TripSummaryResult,
  config: PromptConfig
): string => {
  const { trip, members = [], locationResult, budgetResult, dateResult } = data;
  
  let prompt = `# 🏨 Accommodation Recommendations\n\n`;
  
  if (budgetResult && locationResult) {
    const nightlyBudget = budgetResult.accommodation / (trip.num_days - 1); // Assume n-1 nights
    
    prompt += `Find suitable accommodations in ${locationResult.province_name}:\n\n`;
    prompt += `**Requirements**:\n`;
    prompt += `- Group: ${members.length} people\n`;
    prompt += `- Duration: ${trip.num_days - 1} nights\n`;
    prompt += `- Budget: ฿${Math.round(nightlyBudget).toLocaleString()}/person/night\n`;
    if (dateResult) {
      prompt += `- Dates: ${dateResult.final_dates[0]} to ${dateResult.final_dates[dateResult.final_dates.length - 1]}\n`;
    }
    prompt += `\n`;
    
    prompt += `## Recommend 3-5 Options\n\n`;
    prompt += `For each option, provide:\n`;
    prompt += `1. **Name & Type** (hotel/hostel/guesthouse/Airbnb)\n`;
    prompt += `2. **Location** (area/district + proximity to attractions)\n`;
    prompt += `3. **Price Range** (per night, per person)\n`;
    prompt += `4. **Room Configuration** (how to split ${members.length} people)\n`;
    prompt += `5. **Amenities** (WiFi, breakfast, pool, etc.)\n`;
    prompt += `6. **Pros & Cons** for groups\n`;
    prompt += `7. **Booking Tips** (platform, advance time, cancellation)\n`;
    prompt += `8. **Transportation** (access to public transport/attractions)\n\n`;
    
    prompt += `## Prioritize\n`;
    prompt += `- Value for money\n`;
    prompt += `- Location convenience\n`;
    prompt += `- Group-friendly facilities\n`;
    prompt += `- Safety and cleanliness\n\n`;
  }
  
  return prompt;
};

// ============== MAIN GENERATOR ==============

/**
 * Generate AI prompt based on template and configuration
 */
export const generatePrompt = (
  data: TripSummaryResult,
  config: PromptConfig
): string => {
  const generators = {
    comprehensive: generateComprehensivePrompt,
    itinerary: generateItineraryPrompt,
    budget: generateBudgetPrompt,
    activities: generateActivitiesPrompt,
    accommodation: generateAccommodationPrompt,
    optimization: generateComprehensivePrompt // Use comprehensive as base
  };

  const generator = generators[config.template];
  const prompt = generator(data, config);

  return prompt;
};

/**
 * Generate prompt with metadata
 */
export const generatePromptWithMetadata = (
  data: TripSummaryResult,
  config: PromptConfig
): { prompt: string; metadata: PromptMetadata } => {
  const prompt = generatePrompt(data, config);
  
  const metadata: PromptMetadata = {
    estimatedTokens: estimateTokens(prompt),
    estimatedCost: estimateCost(prompt, config.model),
    model: config.model,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };

  return { prompt, metadata };
};

// ============== HELPER FUNCTIONS ==============

function getRegionFromProvince(province: string): string {
  const regions: Record<string, string[]> = {
    'ภาคเหนือ': ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน'],
    'ภาคกลาง': ['กรุงเทพ', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ'],
    'ภาคตะวันออก': ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด'],
    'ภาคใต้': ['ภูเก็ต', 'กระบี่', 'สุราษฎร์ธานี', 'นครศรีธรรมราช'],
    'ภาคตะวันออกเหนือ': ['นครราชสีมา', 'อุบลราชธานี', 'ขอนแก่น', 'อุดรธานี']
  };

  for (const [region, provinces] of Object.entries(regions)) {
    if (provinces.some(p => province.includes(p))) {
      return region;
    }
  }
  
  return 'ไม่ระบุ';
}

// ============== EXPORT ==============

export const PromptEngineering = {
  generatePrompt,
  generatePromptWithMetadata,
  estimateTokens,
  estimateCost,
  MODEL_CONFIGS
};

export default PromptEngineering;