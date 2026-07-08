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

export async function analyzeWithGeminiFallback(companyName, ticker) {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
  });

  const prompt = `
You are a Senior Equity Research Analyst.
The live financial database API is currently offline. Please estimate the financial metrics for the corporation "${companyName}" (exchange ticker: "${ticker}") based on your knowledge base (provide realistic estimates for current stock price, market cap, PE ratio, EPS, 52W high/low, etc. as of recent dates).

Then, perform a qualitative analysis of the company and return ONLY valid JSON in this exact structure:
{
  "financeData": {
    "symbol": "${ticker}",
    "companyName": "${companyName}",
    "marketCap": 1500000000,
    "currentPrice": 150.0,
    "peRatio": 25.5,
    "eps": 5.8,
    "dividendYield": 0.015,
    "fiftyTwoWeekHigh": 180.0,
    "fiftyTwoWeekLow": 120.0
  },
  "analysis": {
    "summary": "This is an AI-estimated research report because live APIs are offline. ... [add executive summary here]",
    "financialHealth": "...",
    "riskAnalysis": "...",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "investmentDecision": "INVEST or PASS",
    "confidenceScore": 75
  }
}

Important: Return ONLY valid JSON. The numeric values in "financeData" must be numbers (not strings). Ensure it can be parsed by JSON.parse.
`;

  const response = await model.invoke(prompt);
  const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.analysis && parsed.analysis.summary) {
        parsed.analysis.summary = "[AI-Estimated Report - Live API Offline] " + parsed.analysis.summary;
      }
      return parsed;
    }
  } catch (err) {
    console.error("Gemini Fallback Parse Error:", err);
  }

  return {
    financeData: {
      symbol: ticker,
      companyName: companyName,
      marketCap: 0,
      currentPrice: 0,
      peRatio: 0,
      eps: 0,
      dividendYield: 0,
      fiftyTwoWeekHigh: 0,
      fiftyTwoWeekLow: 0
    },
    analysis: {
      summary: "[Error] The live API is offline and the AI was unable to structure fallback data.",
      financialHealth: "Unavailable",
      riskAnalysis: "Unavailable",
      strengths: [],
      weaknesses: [],
      investmentDecision: "PASS",
      confidenceScore: 0
    }
  };
}