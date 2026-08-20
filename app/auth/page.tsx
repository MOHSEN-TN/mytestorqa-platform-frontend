"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();

  const locale = (params?.locale as string) || "en";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/auth/me", {
      credentials: "include",
    }).then((res) => {
      if (res.ok) {
        router.replace(`/${locale}/dashboard`);
      }
    });
  }, [router, locale]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Email ou mot de passe incorrect");
      }

      router.replace(`/${locale}/dashboard`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erreur login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center">
      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage: "url('/images/auth-bg.png')",
        }}
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-white/10" />

      {/* LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">QA Platform</h1>
          <p className="text-gray-500 text-sm">
            Smart Testing Workspace • 2026
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Login"}
          </button>
        </form>

        {error && (
          <p className="text-red-500 mt-4 text-sm text-center">{error}</p>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          TEST • AUTO • IA • QUALITÉ • AUDIT
        </p>
      </div>
    </main>
  );
}