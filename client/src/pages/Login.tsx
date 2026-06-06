import { useState } from "react";
import { useLocation } from "wouter";

type Tab = "signin" | "signup";

export default function Login() {
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = tab === "signin" ? "/api/auth/login" : "/api/auth/signup";
    const body = tab === "signin"
      ? { email, password }
      : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Success — navigate to home, which will redirect to dashboard
      navigate("/");
      window.location.reload();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c20] via-[#1a0a2e] to-[#0d1117] px-4">
      {/* Background ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-96 h-96 rounded-full bg-rose-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-80 h-80 rounded-full bg-purple-600/15 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/30 mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HeartLink</h1>
          <p className="text-slate-400 text-sm mt-1">Your AI relationship companion</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                tab === "signin"
                  ? "text-white border-b-2 border-rose-500 bg-white/5"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => { setTab("signin"); setError(""); }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                tab === "signup"
                  ? "text-white border-b-2 border-rose-500 bg-white/5"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => { setTab("signup"); setError(""); }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Name field (signup only) */}
            {tab === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === "signup" ? "At least 8 characters" : "Enter your password"}
                required
                minLength={tab === "signup" ? 8 : 1}
                className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold text-sm shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"
            >
              {loading
                ? (tab === "signin" ? "Signing in…" : "Creating account…")
                : (tab === "signin" ? "Sign In" : "Create Account")}
            </button>

            {/* Switch tab hint */}
            <p className="text-center text-xs text-slate-500">
              {tab === "signin" ? (
                <>Don't have an account?{" "}
                  <button type="button" onClick={() => { setTab("signup"); setError(""); }} className="text-rose-400 hover:text-rose-300 font-medium transition-colors">
                    Sign up free
                  </button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button type="button" onClick={() => { setTab("signin"); setError(""); }} className="text-rose-400 hover:text-rose-300 font-medium transition-colors">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Your relationship data is stored securely and privately.
        </p>
      </div>
    </div>
  );
}
