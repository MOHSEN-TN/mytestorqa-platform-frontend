/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const useTranslation = (_ns: string) => ({
  t: (key: string) => {
    const map: Record<string, string> = {
      title: "SMART QA Platform",
      subtitle: "Plateforme intelligente de gestion QA",
      emailPlaceholder: "Email professionnel",
      passwordPlaceholder: "Mot de passe",
      loginButton: "Se connecter",
      forgotPassword: "Mot de passe oublié ?",
      forgotTitle: "Réinitialiser",
      forgotSubtitle: "Entrez votre email pour recevoir un code de vérification.",
      otpTitle: "Vérification",
      otpSubtitle: "Entrez le code à 6 chiffres envoyé à",
      sendCode: "Envoyer le code",
      verifyCode: "Vérifier le code",
      resendCode: "Renvoyer le code",
      backToLogin: "Retour à la connexion",
      backToEmail: "Changer l'email",
      successTitle: "Mot de passe envoyé !",
      successMsg: "Votre nouveau mot de passe a été envoyé à votre adresse email. Pensez à le changer après connexion.",
      "errors.loginFailed": "Identifiants incorrects. Veuillez réessayer.",
      "errors.emailRequired": "Veuillez entrer votre adresse email.",
      "errors.otpRequired": "Veuillez entrer le code reçu par email.",
      "errors.otpInvalid": "Code incorrect ou expiré.",
      footer: "© 2025 SMART QA · Tous droits réservés",
      feature1: "Authentification sécurisée",
      feature2: "Gestion des tests et bugs",
      feature3: "Rapports et Agent IA",
    };
    return map[key] ?? key;
  },
});

const API = "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // View: login | forgot-email | forgot-otp | forgot-success
  const [view, setView] = useState<"login" | "forgot-email" | "forgot-otp" | "forgot-success">("login");

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" }).then(
      (res) => { if (res.ok) router.replace("/fr/dashboard"); }
    );
  }, [router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
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
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1 : Envoyer OTP ───────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail) { setForgotError(t("errors.emailRequired")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) throw new Error();
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setResendCooldown(60);
      setView("forgot-otp");
    } catch {
      // On affiche toujours succès pour sécurité
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setView("forgot-otp");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 : Vérifier OTP ─────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    const otpCode = otp.join("");
    if (otpCode.length < 6) { setOtpError(t("errors.otpRequired")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otpCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || t("errors.otpInvalid"));
      }
      setView("forgot-success");
    } catch (err: any) {
      setOtpError(err.message || t("errors.otpInvalid"));
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input box handler ──────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  const resetForgot = () => {
    setView("login");
    setForgotEmail("");
    setForgotError("");
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setResendCooldown(0);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Syne:wght@700;800&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
        .font-syne { font-family: 'Syne', sans-serif; }
        .animate-spin-slow { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.25s ease both; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px #f8f9fe inset !important; }
        input:focus { outline: none; }
        .otp-box:focus { border-color: #7c6eff; background: #fff; box-shadow: 0 0 0 3px #7c6eff18; }
      `}</style>

      <main className="min-h-screen flex items-center justify-center bg-[#eef0f8] px-4 py-10 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-[420px_320px] gap-5 w-full max-w-[760px]">

          {/* ── LEFT CARD ── */}
          <div className="bg-white rounded-3xl shadow-[0_4px_32px_rgba(80,80,160,0.09)] p-10 relative overflow-hidden">
            <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-gradient-to-br from-violet-200/30 to-purple-100/20 pointer-events-none" />

            {/* ══ VIEW: LOGIN ══ */}
            {view === "login" && (
              <div className="fade-in">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-400 flex items-center justify-center shrink-0 shadow-md shadow-violet-200">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                  </div>
                  <h1 className="font-syne text-[22px] font-extrabold text-[#1a1a2e] tracking-tight">{t("title")}</h1>
                </div>
                <p className="text-[13px] text-slate-400 mb-8 pl-12">{t("subtitle")}</p>

                <form onSubmit={handleLogin} className="space-y-3">
                  <input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[14px] text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-[14px] text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-colors duration-150"
                    >
                      {showPassword ? (
                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setView("forgot-email"); setError(""); }}
                      className="text-[12.5px] font-medium text-violet-500 hover:text-violet-700 transition-colors duration-150"
                    >
                      {t("forgotPassword")}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[15px] font-semibold shadow-lg shadow-violet-200 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        {t("loginButton")}
                      </>
                    )}
                  </button>
                </form>
                {error && <p className="mt-4 text-[12.5px] text-red-500 text-center bg-red-50 rounded-xl px-3 py-2.5">{error}</p>}
                <p className="text-center text-[11px] text-slate-300 mt-8">{t("footer")}</p>
              </div>
            )}

            {/* ══ VIEW: FORGOT — STEP 1 (Email) ══ */}
            {view === "forgot-email" && (
              <div className="fade-in">
                <button onClick={resetForgot} className="flex items-center gap-2 text-[13px] font-medium text-violet-500 hover:text-violet-700 transition-colors mb-6">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  {t("backToLogin")}
                </button>

                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-400 flex items-center justify-center shrink-0 shadow-md shadow-violet-200">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <h1 className="font-syne text-[22px] font-extrabold text-[#1a1a2e] tracking-tight">{t("forgotTitle")}</h1>
                </div>
                <p className="text-[13px] text-slate-400 mb-8 pl-12">{t("forgotSubtitle")}</p>

                <form onSubmit={handleSendOtp} className="space-y-3">
                  <input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[14px] text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                  />
                  {forgotError && <p className="text-[12.5px] text-red-500 bg-red-50 rounded-xl px-3 py-2">{forgotError}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[15px] font-semibold shadow-lg shadow-violet-200 hover:opacity-90 hover:-translate-y-px transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                        {t("sendCode")}
                      </>
                    )}
                  </button>
                </form>
                <p className="text-center text-[11px] text-slate-300 mt-8">{t("footer")}</p>
              </div>
            )}

            {/* ══ VIEW: FORGOT — STEP 2 (OTP) ══ */}
            {view === "forgot-otp" && (
              <div className="fade-in">
                <button
                  onClick={() => { setView("forgot-email"); setOtp(["","","","","",""]); setOtpError(""); }}
                  className="flex items-center gap-2 text-[13px] font-medium text-violet-500 hover:text-violet-700 transition-colors mb-6"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  {t("backToEmail")}
                </button>

                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-400 flex items-center justify-center shrink-0 shadow-md shadow-violet-200">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <h1 className="font-syne text-[22px] font-extrabold text-[#1a1a2e] tracking-tight">{t("otpTitle")}</h1>
                </div>
                <p className="text-[13px] text-slate-400 mb-6 pl-12">
                  {t("otpSubtitle")} <span className="text-violet-500 font-medium">{forgotEmail}</span>
                </p>

                {/* Progress steps */}
                <div className="flex items-center gap-2 mb-7">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <span className="text-[11px] font-medium text-violet-500">Email</span>
                  </div>
                  <div className="flex-1 h-px bg-violet-200" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-violet-600 border-2 border-violet-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <span className="text-[11px] font-medium text-violet-600">Code OTP</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-[9px] text-slate-400 font-bold">3</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Nouveau mdp</span>
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp}>
                  {/* OTP boxes */}
                  <div className="flex gap-2.5 justify-center mb-4" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="otp-box w-11 h-13 text-center text-[20px] font-bold text-[#1a1a2e] border-2 border-slate-200 rounded-xl bg-slate-50 transition-all duration-150"
                        style={{ height: '52px' }}
                      />
                    ))}
                  </div>

                  {otpError && <p className="text-[12.5px] text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3 text-center">{otpError}</p>}

                  <button
                    type="submit"
                    disabled={loading || otp.join("").length < 6}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[15px] font-semibold shadow-lg shadow-violet-200 hover:opacity-90 hover:-translate-y-px transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        {t("verifyCode")}
                      </>
                    )}
                  </button>
                </form>

                {/* Resend */}
                <div className="text-center mt-4">
                  {resendCooldown > 0 ? (
                    <p className="text-[12px] text-slate-400">
                      Renvoyer dans <span className="text-violet-500 font-semibold">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp as any}
                      className="text-[12.5px] text-violet-500 hover:text-violet-700 font-medium transition-colors"
                    >
                      {t("resendCode")}
                    </button>
                  )}
                </div>

                <p className="text-center text-[11px] text-slate-300 mt-6">{t("footer")}</p>
              </div>
            )}

            {/* ══ VIEW: FORGOT — STEP 3 (Success) ══ */}
            {view === "forgot-success" && (
              <div className="fade-in flex flex-col items-center text-center pt-4">
                {/* animated check */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-5 shadow-lg shadow-emerald-200">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>

                <h2 className="font-syne text-[20px] font-extrabold text-[#1a1a2e] mb-2">{t("successTitle")}</h2>
                <p className="text-[13.5px] text-slate-500 leading-relaxed max-w-[280px] mb-7">{t("successMsg")}</p>

                {/* Progress steps - all done */}
                <div className="flex items-center gap-2 mb-8 w-full">
                  {["Email", "Code OTP", "Nouveau mdp"].map((s, i) => (
                    <div key={s} className="flex items-center gap-1.5 flex-1">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-600">{s}</span>
                      {i < 2 && <div className="flex-1 h-px bg-emerald-200 ml-1" />}
                    </div>
                  ))}
                </div>

                <button
                  onClick={resetForgot}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[15px] font-semibold shadow-lg shadow-violet-200 hover:opacity-90 hover:-translate-y-px transition-all duration-150"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Se connecter
                </button>

                <p className="text-center text-[11px] text-slate-300 mt-8">{t("footer")}</p>
              </div>
            )}
          </div>

          {/* ── RIGHT CARD ── */}
          <div className="hidden md:flex bg-white rounded-3xl shadow-[0_4px_32px_rgba(80,80,160,0.06)] p-9 flex-col justify-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[2px] mb-7">Fonctionnalités</p>
            {[
              { n: "01", label: t("feature1"), icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
              { n: "02", label: t("feature2"), icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
              { n: "03", label: t("feature3"), icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
            ].map((f, i) => (
              <div key={f.n} className={`flex items-start gap-4 py-4 ${i < 2 ? "border-b border-slate-100" : ""}`}>
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="#7c6eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </div>
                <div className="pt-1.5">
                  <span className="text-[11px] font-bold text-violet-400 font-syne">{f.n}</span>
                  <p className="text-[13.5px] font-medium text-slate-600 mt-0.5">{f.label}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </>
  );
}