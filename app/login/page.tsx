"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) setError(data.error || "Login failed");
    else router.replace("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
      {/* Subtle animated gradients */}
      <div className="absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-30 blur-3xl animate-spin-slow"></div>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-indigo-300 to-purple-300 opacity-20 blur-3xl animate-spin-slow-reverse"></div>

      <div className="relative z-10 w-full max-w-lg p-10 bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center tracking-tight leading-tight">
          Welcome Back
        </h1>

        <p className="text-center text-gray-600 mb-6 text-base">
          Sign in to manage all loans & borrowers seamlessly
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full p-4 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-300 focus:outline-none transition text-gray-900 font-medium text-base placeholder-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">Password</label>
            <input
              type="password"
              placeholder="********"
              className="w-full p-4 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-300 focus:outline-none transition text-gray-900 font-medium text-base placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transform transition duration-300 text-lg"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Powered by <span className="font-semibold text-gray-700">Next Agency</span>
        </p>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        .animate-spin-slow { animation: spin-slow 30s linear infinite; }
        .animate-spin-slow-reverse { animation: spin-slow-reverse 35s linear infinite; }
      `}</style>
    </div>
  );
}
