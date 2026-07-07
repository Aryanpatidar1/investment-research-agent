import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export async function analyzeWithGemini(financeData) {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
  });

  const prompt = `
You are a Senior Equity Research Analyst.

Below is the financial information:

${financeData}

Analyze it and return ONLY valid JSON in this format:

{
  "summary": "...",
  "financialHealth": "...",
  "riskAnalysis": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "investmentDecision": "INVEST or PASS",
  "confidenceScore": 85
}
`;

  const response = await model.invoke(prompt);
  const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
  } catch {
    return { raw: text };
  }
}