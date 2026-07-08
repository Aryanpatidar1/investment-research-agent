"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Loader2,
  BarChart3,
  Shield,
  Target,
  Sun,
  Moon,
  LogOut,
  Settings,
  Globe,
  CheckCircle,
  XCircle,
  Copy,
  Printer,
  History,
  Info,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Award,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

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

type UserProfile = {
  id: string;
  name: string;
  email: string;
};

function formatCurrency(value?: number) {
  if (value == null) return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState("dark");
  
  // API Config
  const [apiUrl, setApiUrl] = useState("http://localhost:5000");
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState("");
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);

  // Search and Loading State
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<"overview" | "financials" | "strengths" | "raw">("overview");

  // Notification for copy
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Loading Steps texts
  const loadingSteps = [
    "Resolving company name to exchange ticker...",
    "Querying Yahoo Finance for statements & metrics...",
    "Processing financial data using LangGraph nodes...",
    "Consulting Gemini LLM for equity research report...",
    "Synthesizing final investment decision and verdict..."
  ];

  // 1. Initial configuration & Auth Check
  useEffect(() => {
    setMounted(true);
    // Auth Check
    const token = localStorage.getItem("research_token");
    const savedUser = localStorage.getItem("research_user");
    
    if (!token || !savedUser) {
      router.push("/auth");
      return;
    }
    setUser(JSON.parse(savedUser));

    // Theme Config
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }

    // API Config
    const customApiUrl = localStorage.getItem("research_api_url");
    const initialUrl = customApiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    setApiUrl(initialUrl);
    setTempApiUrl(initialUrl);

    // Search History
    const history = localStorage.getItem("research_history");
    if (history) {
      setSearchHistory(JSON.parse(history));
    }

    // Ping API
    checkApiConnection(initialUrl);
  }, [router]);

  // Handle step-by-step loading simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingSteps.length - 1) return prev + 1;
          return prev;
        });
      }, 3500); // Progress step every 3.5s
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const checkApiConnection = async (urlToCheck: string) => {
    setCheckingConnection(true);
    try {
      // Short timeout to check connection
      const response = await axios.get(`${urlToCheck}/`, { timeout: 3000 });
      if (response.data && typeof response.data === "object") {
        setApiConnected(true);
      } else {
        setApiConnected(false);
      }
    } catch {
      setApiConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleSaveApiUrl = () => {
    let sanitizedUrl = tempApiUrl.trim();
    if (sanitizedUrl.endsWith("/")) {
      sanitizedUrl = sanitizedUrl.slice(0, -1);
    }
    setApiUrl(sanitizedUrl);
    localStorage.setItem("research_api_url", sanitizedUrl);
    setShowSettings(false);
    checkApiConnection(sanitizedUrl);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("research_token");
    localStorage.removeItem("research_user");
    router.push("/auth");
  };

  const addToHistory = (query: string) => {
    const updated = [query, ...searchHistory.filter((item) => item !== query)].slice(0, 5);
    setSearchHistory(updated);
    localStorage.setItem("research_history", JSON.stringify(updated));
  };

  const handleAnalyze = async (e: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery || company;
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    const token = localStorage.getItem("research_token");
    if (!token) {
      setError("Session expired. Please log in again.");
      router.push("/auth");
      return;
    }

    try {
      const { data } = await axios.post(
        `${apiUrl}/api/analyze`,
        { company: query.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setResult(data.result);
        addToHistory(query.trim());
      } else {
        setError(data.message || "Analysis failed");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Invalid session. Redirecting to login...");
        handleLogout();
      } else {
        setError(
          err.response?.data?.message ||
            `Unable to connect to backend at: ${apiUrl}. Check server status.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const reportText = `
# EQUITY RESEARCH REPORT: ${result.financeData?.companyName || result.company} (${result.ticker})
Generated by Investment Research Agent

## AI VERDICT
Recommendation: ${result.analysis.investmentDecision || "N/A"}
Confidence: ${result.analysis.confidenceScore || 0}%

## EXECUTIVE SUMMARY
${result.analysis.summary || "N/A"}

## FINANCIAL HEALTH
${result.analysis.financialHealth || "N/A"}

## RISK ANALYSIS
${result.analysis.riskAnalysis || "N/A"}

## STRENGTHS
${result.analysis.strengths?.map((s) => `- ${s}`).join("\n") || "N/A"}

## WEAKNESSES
${result.analysis.weaknesses?.map((w) => `- ${w}`).join("\n") || "N/A"}
    `;
    navigator.clipboard.writeText(reportText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const finance = result?.financeData;
  const analysis = result?.analysis;
  const isInvest = analysis?.investmentDecision?.toUpperCase().includes("INVEST");

  const chartData = finance
    ? [
        { name: "52W Low", value: finance.fiftyTwoWeekLow },
        { name: "Current Price", value: finance.currentPrice },
        { name: "52W High", value: finance.fiftyTwoWeekHigh },
      ]
    : [];

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between">
      {/* Background Ambient Orbs */}
      <div className="mesh-bg">
        <div className="mesh-orb-1"></div>
        <div className="mesh-orb-2"></div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/10 p-2.5 border border-indigo-500/20">
              <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                IRA <span className="hidden sm:inline text-xs font-normal text-slate-400 border border-slate-200 dark:border-slate-800 rounded-md px-1.5 py-0.5">v2.0</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Investment Research Agent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* API Connection Indicator */}
            <div className="relative">
              <button
                onClick={() => {
                  setTempApiUrl(apiUrl);
                  setShowSettings(!showSettings);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium glass-panel border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden md:inline">API:</span>
                <span className="max-w-[120px] truncate hidden sm:inline">
                  {apiUrl.replace("https://", "").replace("http://", "")}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    apiConnected === true
                      ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                      : apiConnected === false
                      ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                      : "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                  }`}
                />
              </button>

              {showSettings && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel p-4 shadow-xl border border-slate-200 dark:border-slate-800 z-50">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">
                    Configure Backend Endpoint
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                    Enter the URL of your deployed backend (e.g. Render, Heroku) or localhost.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={tempApiUrl}
                      onChange={(e) => setTempApiUrl(e.target.value)}
                      placeholder="http://localhost:5000"
                      className="w-full text-xs p-2.5 rounded-lg border outline-none glass-input"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowSettings(false)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveApiUrl}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 cursor-pointer"
                      >
                        Save & Connect
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl glass-panel border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Dropdown / Sign Out */}
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-2">
              <span className="hidden lg:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 active:scale-[0.98] cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body content */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-8 z-10">
        
        {/* API Alert if disconnected */}
        {apiConnected === false && !checkingConnection && (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Cannot reach backend API server</h4>
              <p className="text-xs mt-1">
                The agent is currently unable to connect to the backend server at <span className="underline font-mono">{apiUrl}</span>. 
                If you have deployed the backend (e.g. on Render or Heroku), click the <strong>API badge</strong> in the top-right header, paste the deployed URL, and press Save.
              </p>
            </div>
          </div>
        )}

        {/* Company Search Section */}
        <section className="mb-8 rounded-2xl glass-panel p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Analyze a Corporation
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Enter a corporate entity name or exchange ticker code (e.g., Apple, NVDA, TCS, Reliance).
          </p>

          <form onSubmit={(e) => handleAnalyze(e)} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Tesla, Nvidia, Reliance..."
                className="w-full rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none glass-input focus:ring-2 focus:ring-indigo-500/20"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !company.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm px-8 py-3.5 hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running LLM Chain...
                </>
              ) : (
                "Execute Agent"
              )}
            </button>
          </form>

          {/* Search History & Shortcuts */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <History className="h-3 w-3" /> Recent:
            </span>
            {searchHistory.length > 0 ? (
              searchHistory.map((hist) => (
                <button
                  key={hist}
                  onClick={(e) => {
                    setCompany(hist);
                    handleAnalyze(e, hist);
                  }}
                  disabled={loading}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-indigo-500/30 transition cursor-pointer"
                >
                  {hist}
                </button>
              ))
            ) : (
              ["Apple", "Tesla", "TCS"].map((name) => (
                <button
                  key={name}
                  onClick={(e) => {
                    setCompany(name);
                    handleAnalyze(e, name);
                  }}
                  disabled={loading}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-indigo-500/30 transition cursor-pointer"
                >
                  {name}
                </button>
              ))
            )}
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          )}
        </section>

        {/* Detailed Simulated Step-by-Step Loader */}
        {loading && (
          <section className="rounded-2xl glass-panel p-8 shadow-sm text-center max-w-xl mx-auto border-t-4 border-indigo-500">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              Equity Research Agent Active
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
              LangGraph workflow compiling nodes and querying Gemini model...
            </p>

            {/* Custom Steps Loader */}
            <div className="space-y-4 text-left max-w-sm mx-auto">
              {loadingSteps.map((stepText, idx) => {
                const isCompleted = loadingStep > idx;
                const isCurrent = loadingStep === idx;
                
                return (
                  <div key={idx} className="flex items-center gap-3 transition-opacity">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : isCurrent ? (
                        <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isCurrent
                          ? "text-slate-800 dark:text-slate-100 font-semibold"
                          : isCompleted
                          ? "text-slate-400 dark:text-slate-500 line-through"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Result Report Dashboard */}
        {result && !loading && (
          <div className="space-y-6">
            
            {/* Result Header Card */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-indigo-500"></div>
              
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                      {finance?.companyName || result.company}
                    </h2>
                    <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-500/20">
                      {result.ticker}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Analyzed ticker database record • Last updated just now
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium glass-panel border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy Report"}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium glass-panel border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print PDF
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 pb-px scrollbar-none">
              {[
                { id: "overview", label: "Executive Summary", icon: Target },
                { id: "financials", label: "Financial Data", icon: BarChart3 },
                { id: "strengths", label: "Strengths & Risks", icon: Shield },
                { id: "raw", label: "Audit Log (Raw)", icon: Info },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="mt-4">
              
              {/* 1. OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="grid gap-6 md:grid-cols-3">
                  
                  {/* Left Column: Key Stats & Summary */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Financial Metrics Mini-Grid */}
                    {finance && (
                      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                        {[
                          { label: "Stock Price", value: `$${finance.currentPrice?.toFixed(2)}`, desc: "Current value" },
                          { label: "Market Cap", value: formatCurrency(finance.marketCap), desc: "Total capitalization" },
                          { label: "P/E Ratio", value: finance.peRatio?.toFixed(2) ?? "N/A", desc: "Price to Earnings" },
                          { label: "EPS", value: finance.eps?.toFixed(2) ?? "N/A", desc: "Earnings Per Share" },
                        ].map((stat, i) => (
                          <div
                            key={i}
                            className="rounded-xl glass-panel p-4 shadow-sm relative overflow-hidden"
                          >
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                              {stat.label}
                            </span>
                            <p className="mt-1 text-xl font-bold text-slate-800 dark:text-slate-100">
                              {stat.value}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {stat.desc}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Executive Summary Card */}
                    {analysis?.summary && (
                      <div className="rounded-2xl glass-panel p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center gap-2 text-md font-bold text-slate-800 dark:text-slate-100">
                          <Target className="h-5 w-5 text-indigo-500" />
                          Executive Research Summary
                        </h3>
                        <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-300">
                          {analysis.summary}
                        </p>
                      </div>
                    )}

                    {/* Price Range Chart directly in Overview */}
                    {chartData.length > 0 && (
                      <div className="rounded-2xl glass-panel p-6 shadow-sm">
                        <h3 className="mb-4 text-md font-bold text-slate-800 dark:text-slate-100">
                          52-Week Stock Price Range (Current vs 52W High/Low)
                        </h3>
                        <div className="h-56 w-full mt-4">
                          {mounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                <Tooltip
                                  contentStyle={{
                                    background: "var(--card-bg)",
                                    border: "1px solid var(--card-border)",
                                    borderRadius: "12px",
                                    color: "var(--foreground)",
                                    fontSize: "12px",
                                    backdropFilter: "blur(12px)",
                                  }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={45}>
                                  {chartData.map((_, i) => (
                                    <Cell
                                      key={i}
                                      fill={i === 1 ? "var(--primary)" : "var(--text-muted)"}
                                      fillOpacity={i === 1 ? 0.9 : 0.4}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: AI Decision Card */}
                  <div className="space-y-6">
                    {analysis && (
                      <div className={`rounded-2xl glass-panel p-6 shadow-sm border-t-4 relative overflow-hidden ${
                        isInvest 
                          ? "border-emerald-500/80 bg-emerald-500/5" 
                          : "border-rose-500/80 bg-rose-500/5"
                      }`}>
                        <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                          <Award className="h-5 w-5 text-indigo-500" />
                          Investment Verdict
                        </h3>

                        <div className="text-center py-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 mb-6">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                            Agent Assessment
                          </span>
                          <p className={`text-4xl font-black mt-2 tracking-tight ${
                            isInvest ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}>
                            {analysis.investmentDecision || "PASS"}
                          </p>
                        </div>

                        {analysis.confidenceScore != null && (
                          <div>
                            <div className="mb-2 flex justify-between text-xs font-semibold">
                              <span className="text-slate-500 dark:text-slate-400">Decision Confidence</span>
                              <span className={isInvest ? "text-emerald-500" : "text-rose-500"}>
                                {analysis.confidenceScore}%
                              </span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  isInvest ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-rose-500 to-amber-500"
                                }`}
                                style={{ width: `${analysis.confidenceScore}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                              Confidence score represents Gemini LLM synthesis metrics derived from historical filings and market performance.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. FINANCIALS TAB */}
              {activeTab === "financials" && (
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Left Column: Recharts Valuation */}
                  <div className="lg:col-span-2 rounded-2xl glass-panel p-6 shadow-sm">
                    <h3 className="mb-4 text-md font-bold text-slate-800 dark:text-slate-100">
                      52-Week Stock price comparison
                    </h3>
                    {chartData.length > 0 ? (
                      <div className="h-72 w-full mt-6">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" vertical={false} />
                              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                              <Tooltip
                                contentStyle={{
                                  background: "var(--card-bg)",
                                  border: "1px solid var(--card-border)",
                                  borderRadius: "12px",
                                  color: "var(--foreground)",
                                  fontSize: "12px",
                                  backdropFilter: "blur(12px)",
                                }}
                              />
                              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                {chartData.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={i === 1 ? "var(--primary)" : "var(--text-muted)"}
                                    fillOpacity={i === 1 ? 0.9 : 0.4}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs py-12 text-center">No valuation chart available.</p>
                    )}
                  </div>

                  {/* Right Column: Detailed Numbers */}
                  {finance && (
                    <div className="rounded-2xl glass-panel p-6 shadow-sm space-y-4">
                      <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                        <Info className="h-5 w-5 text-indigo-500" />
                        Key Financial Stats
                      </h3>
                      
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {[
                          { label: "Ticker Symbol", value: finance.symbol },
                          { label: "Current Price", value: `$${finance.currentPrice?.toFixed(2)}` },
                          { label: "52-Week High", value: `$${finance.fiftyTwoWeekHigh?.toFixed(2)}` },
                          { label: "52-Week Low", value: `$${finance.fiftyTwoWeekLow?.toFixed(2)}` },
                          { label: "P/E Valuation Ratio", value: finance.peRatio?.toFixed(2) ?? "N/A" },
                          { label: "Earnings per Share (EPS)", value: `$${finance.eps?.toFixed(2)}` },
                          { label: "Dividend Yield", value: finance.dividendYield ? `${(finance.dividendYield * 100).toFixed(2)}%` : "0.00%" },
                        ].map((row, i) => (
                          <div key={i} className="flex justify-between py-3 text-xs">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">{row.label}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. STRENGTHS & RISKS TAB */}
              {activeTab === "strengths" && (
                <div className="space-y-6">
                  {/* Strengths & Weaknesses Side-By-Side */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Strengths Card */}
                    <div className="rounded-2xl glass-panel p-6 shadow-sm border-l-4 border-emerald-500 bg-emerald-500/5">
                      <h3 className="mb-4 flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-5 w-5" />
                        Core Strengths & Catalysts
                      </h3>
                      {analysis?.strengths && analysis.strengths.length > 0 ? (
                        <ul className="space-y-3">
                          {analysis.strengths.map((str, idx) => (
                            <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                              <CheckCircle className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500">No major strengths reported by agent.</p>
                      )}
                    </div>

                    {/* Weaknesses Card */}
                    <div className="rounded-2xl glass-panel p-6 shadow-sm border-l-4 border-rose-500 bg-rose-500/5">
                      <h3 className="mb-4 flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                        <TrendingDown className="h-5 w-5" />
                        Key Weaknesses & Obstacles
                      </h3>
                      {analysis?.weaknesses && analysis.weaknesses.length > 0 ? (
                        <ul className="space-y-3">
                          {analysis.weaknesses.map((weak, idx) => (
                            <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                              <XCircle className="h-4 w-4 mt-0.5 text-rose-500 flex-shrink-0" />
                              <span>{weak}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500">No major weaknesses reported by agent.</p>
                      )}
                    </div>
                  </div>

                  {/* Risks & Safety Analysis */}
                  {analysis?.riskAnalysis && (
                    <div className="rounded-2xl glass-panel p-6 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-md font-bold text-slate-800 dark:text-slate-100">
                        <Shield className="h-5 w-5 text-amber-500" />
                        Risk Exposure Analysis
                      </h3>
                      <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-300">
                        {analysis.riskAnalysis}
                      </p>
                    </div>
                  )}

                  {analysis?.financialHealth && (
                    <div className="rounded-2xl glass-panel p-6 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-md font-bold text-slate-800 dark:text-slate-100 font-sans">
                        Financial Soundness Assessment
                      </h3>
                      <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-300">
                        {analysis.financialHealth}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. RAW LOG TAB */}
              {activeTab === "raw" && (
                <div className="rounded-2xl glass-panel p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Info className="h-5 w-5 text-indigo-500" />
                      LLM Synthesized Raw Response
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                      JSON Payload
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    This displays the direct structured raw output generated by the Gemini model during the compile cycle. Used for audit trails and graph trace debugging.
                  </p>

                  <pre className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950/80 border border-slate-800 font-mono text-xs text-indigo-400 overflow-x-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State Instructions */}
        {!result && !loading && (
          <section className="mt-12 text-center max-w-xl mx-auto py-12 px-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="h-16 w-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-6 border border-indigo-500/20">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
              No analysis loaded
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Type the name of any publicly traded firm in the search field above and run the analyst workflow to build a structured equity report.
            </p>

            <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3 max-w-md mx-auto">
              {[
                { name: "Apple", ticker: "AAPL" },
                { name: "Tesla", ticker: "TSLA" },
                { name: "Reliance", ticker: "RELIANCE" }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={(e) => {
                    setCompany(item.name);
                    handleAnalyze(e, item.name);
                  }}
                  className="p-4 text-left rounded-xl glass-panel border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 hover:scale-[1.02] transition cursor-pointer"
                >
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-200">{item.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.ticker} Research</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Persistent Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800/80 z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} Investment Research Agent. Powered by LangGraph & Gemini.</span>
        <div className="flex items-center gap-4">
          <span className="hover:text-indigo-500 transition cursor-pointer">Security Protocol</span>
          <span className="hover:text-indigo-500 transition cursor-pointer">System Status</span>
        </div>
      </footer>
    </div>
  );
}
