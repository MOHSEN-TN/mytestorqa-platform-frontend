/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/auth/me", {
      credentials: "include",
    }).then((res) => {
      if (res.ok) router.replace("/fr/dashboard");
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || t("errors.loginFailed"));
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || t("errors.loginFailed"));
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

      {/* OVERLAY (pro effect) */}
      <div className="absolute inset-0 bg-white/10" />

      {/* LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {t("title")}
          </h1>
          <p className="text-gray-500 text-sm">
            {t("subtitle")}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder={t("emailPlaceholder")}
            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder={t("passwordPlaceholder")}
            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90"
          >
            {t("loginButton")}
          </button>
        </form>

        {error && (
          <p className="text-red-500 mt-4 text-sm text-center">{error}</p>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          {t("footer")}
        </p>
      </div>
    </main>
  );
}