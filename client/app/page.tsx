"use client";

import { useState } from "react";
import axios from "axios";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Loader2,
  BarChart3,
  Shield,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type FinanceData = {
  symbol: string;
  companyName: string;
  marketCap: number;
  currentPrice: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
};

type Analysis = {
  summary?: string;
  financialHealth?: string;
  riskAnalysis?: string;
  strengths?: string[];
  weaknesses?: string[];
  investmentDecision?: string;
  confidenceScore?: number;
  raw?: string;
};

type ResearchResult = {
  company: string;
  ticker: string;
  financeData: FinanceData | null;
  analysis: Analysis;
};

function formatCurrency(value?: number) {
  if (value == null) return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

export default function Home() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data } = await axios.post(`${API_URL}/api/analyze`, {
        company: company.trim(),
      });

      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.message || "Analysis failed");
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Could not reach server. Make sure backend is running on port 5000.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const finance = result?.financeData;
  const analysis = result?.analysis;
  const isInvest = analysis?.investmentDecision?.toUpperCase().includes("INVEST");

  const chartData = finance
    ? [
        { name: "52W Low", value: finance.fiftyTwoWeekLow },
        { name: "Current", value: finance.currentPrice },
        { name: "52W High", value: finance.fiftyTwoWeekHigh },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/20 p-2">
              <BarChart3 className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Investment Research Agent
              </h1>
              <p className="text-sm text-slate-400">
                LangGraph + Gemini powered equity analysis
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <h2 className="mb-2 text-2xl font-semibold">Analyze a Company</h2>
          <p className="mb-6 text-slate-400">
            Enter a company name or ticker — e.g. Apple, Tesla, TCS, RELIANCE
          </p>

          <form onSubmit={handleAnalyze} className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Apple, NVDA, TCS..."
                className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !company.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 font-medium transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Run Analysis"
              )}
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
              {error}
            </p>
          )}
        </section>

        {result && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">
                {finance?.companyName || result.company}
              </h2>
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-sm text-indigo-300">
                {result.ticker}
              </span>
            </div>

            {finance && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Current Price", value: `$${finance.currentPrice?.toFixed(2)}` },
                    { label: "Market Cap", value: formatCurrency(finance.marketCap) },
                    { label: "P/E Ratio", value: finance.peRatio?.toFixed(2) ?? "N/A" },
                    { label: "EPS", value: finance.eps?.toFixed(2) ?? "N/A" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-white/10 bg-white/5 p-5"
                    >
                      <p className="text-sm text-slate-400">{item.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-lg font-semibold">Price Range (52 Week)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            background: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {chartData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={i === 1 ? "#6366f1" : "#475569"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {analysis && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {analysis.summary && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                        <Target className="h-5 w-5 text-indigo-400" />
                        Summary
                      </h3>
                      <p className="leading-relaxed text-slate-300">{analysis.summary}</p>
                    </div>
                  )}

                  {analysis.financialHealth && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <h3 className="mb-3 text-lg font-semibold">Financial Health</h3>
                      <p className="leading-relaxed text-slate-300">
                        {analysis.financialHealth}
                      </p>
                    </div>
                  )}

                  {analysis.riskAnalysis && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                        <Shield className="h-5 w-5 text-amber-400" />
                        Risk Analysis
                      </h3>
                      <p className="leading-relaxed text-slate-300">
                        {analysis.riskAnalysis}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {analysis.strengths && analysis.strengths.length > 0 && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                        <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-400">
                          <TrendingUp className="h-5 w-5" />
                          Strengths
                        </h3>
                        <ul className="space-y-2">
                          {analysis.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-slate-300">
                              • {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                        <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-400">
                          <TrendingDown className="h-5 w-5" />
                          Weaknesses
                        </h3>
                        <ul className="space-y-2">
                          {analysis.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-slate-300">
                              • {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-6 text-lg font-semibold">AI Verdict</h3>

                  <div
                    className={`mb-6 rounded-xl p-6 text-center ${
                      isInvest
                        ? "bg-emerald-500/20 border border-emerald-500/30"
                        : "bg-red-500/20 border border-red-500/30"
                    }`}
                  >
                    <p className="text-sm text-slate-400">Recommendation</p>
                    <p
                      className={`mt-2 text-3xl font-bold ${
                        isInvest ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {analysis.investmentDecision || "N/A"}
                    </p>
                  </div>

                  {analysis.confidenceScore != null && (
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-400">Confidence</span>
                        <span className="font-medium">{analysis.confidenceScore}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${analysis.confidenceScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {["Apple", "Tesla", "TCS"].map((name) => (
              <button
                key={name}
                onClick={() => setCompany(name)}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-left transition hover:border-indigo-500/50 hover:bg-white/10"
              >
                <p className="font-medium">{name}</p>
                <p className="mt-1 text-sm text-slate-400">Quick analyze</p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
