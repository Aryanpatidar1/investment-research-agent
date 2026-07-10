"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Shield,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Phone,
  Smartphone,
} from "lucide-react";

type AuthMode = "email" | "phone";

function AuthForm() {
  const [authMode, setAuthMode] = useState<AuthMode>("email");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const [apiUrl, setApiUrl] = useState("http://localhost:5000");

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add("dark");

    const customApiUrl = localStorage.getItem("research_api_url");
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (customApiUrl) setApiUrl(customApiUrl);
    else if (envApiUrl) setApiUrl(envApiUrl);
  }, []);

  const saveSession = (data: { token: string; user: object; message?: string }) => {
    localStorage.setItem("research_token", data.token);
    localStorage.setItem("research_user", JSON.stringify(data.user));
    setSuccess(data.message || "Success! Redirecting...");
    setTimeout(() => router.push("/"), 1200);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin ? { email, password } : { email, password, name };
      const { data } = await axios.post(`${apiUrl}${endpoint}`, payload);

      if (data.success) saveSession(data);
      else setError(data.message || "Authentication failed");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to connect to backend. Make sure server is running on port 5000.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };


  const handleSendOtp = async () => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    if (!isLogin && !name.trim()) {
      setError("Please enter your name to sign up");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/phone/send-otp`, {
        phone: phone.trim(),
        name: isLogin ? undefined : name.trim(),
      });

      if (data.success) {
        setOtpSent(true);
        if (data.demoOtp) setDemoOtp(data.demoOtp);
        setSuccess("OTP sent! Check your phone (demo OTP shown below).");
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to send OTP. Check backend connection.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/phone/verify-otp`, {
        phone: phone.trim(),
        otp: otp.trim(),
        name: name.trim() || undefined,
      });

      if (data.success) saveSession(data);
      else setError(data.message || "OTP verification failed");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "OTP verification failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError("");
    setSuccess("");
    setOtpSent(false);
    setDemoOtp("");
    setOtp("");
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden">
      <div className="mesh-bg">
        <div className="mesh-orb-1"></div>
        <div className="mesh-orb-2"></div>
      </div>

      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center z-10">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/20 p-2 border border-indigo-500/30">
            <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">IRA</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Equity Research Agent</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-6 flex flex-col justify-center z-10 py-12">
        <div className="w-full rounded-2xl glass-panel p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Sign in to access your investment research portal
            </p>
          </div>


          {/* Auth Mode Tabs */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 mb-6">
            <button
              onClick={() => switchMode("email")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                authMode === "email"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={() => switchMode("phone")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                authMode === "phone"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {success}
              {demoOtp && (
                <p className="mt-1 font-mono font-bold text-emerald-800 dark:text-emerald-200">
                  Demo OTP: {demoOtp}
                </p>
              )}
            </div>
          )}

          {/* Email Form */}
          {authMode === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none glass-input"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none glass-input"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none glass-input"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white py-3.5 font-semibold text-sm hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{isLogin ? "Sign In" : "Create Account"} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* Phone Form */}
          {authMode === "phone" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {!isLogin && !otpSent && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none glass-input"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    disabled={otpSent}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none glass-input disabled:opacity-60"
                  />
                </div>
              </div>

              {otpSent && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit OTP"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none glass-input text-center tracking-[0.5em] font-mono"
                  />
                </div>
              )}

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white py-3.5 font-semibold text-sm hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send OTP"}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white py-3.5 font-semibold text-sm hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); setDemoOtp(""); }}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    Change phone number
                  </button>
                </div>
              )}
            </form>
          )}

          <div className="mt-6 text-center border-t border-slate-200 dark:border-slate-700 pt-5">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); setOtpSent(false); }}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-500 dark:text-slate-400 z-10">
        © {new Date().getFullYear()} Investment Research Agent
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return <AuthForm />;
}
