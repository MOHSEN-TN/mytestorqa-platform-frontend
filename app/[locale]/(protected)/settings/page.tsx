/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Globe, ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const API_URL = "http://localhost:3001";

/* password field with toggle */
function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

// Language Selector Component
function LanguageSelector({ currentLang, onLanguageChange, t }: { currentLang: string; onLanguageChange: (lang: string) => void; t: any }) {
  const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "en", name: "English", flag: "🇬🇧" },
  ];

  const [isOpen, setIsOpen] = useState(false);
  const selectedLang = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 hover:border-blue-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedLang.flag}</span>
          <span>{selectedLang.name}</span>
        </div>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                  currentLang === lang.code ? "bg-blue-50 text-blue-600" : "text-gray-700"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLang === lang.code && <CheckCircle2 size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { t, locale, changeLanguage } = useTranslation('settings');
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Language state
  const [langMessage, setLangMessage] = useState("");
  const [langError, setLangError] = useState("");
  const [langLoading, setLangLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t("password.errors.required"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("password.errors.mismatch"));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || t("password.errors.invalid"));
        return;
      }

      setMessage(t("password.success"));
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError(t("password.errors.network"));
    } finally {
      setLoading(false);
    }
  }
  async function handleLanguageChange(newLocale: string) {
    if (newLocale === locale) return;
    
    setLangMessage("");
    setLangError("");
    setLangLoading(true);

    try {
      // Sauvegarder dans localStorage
      localStorage.setItem("app-language", newLocale);
      
      // Sauvegarder dans les cookies
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
      
      setLangMessage(t("language.success"));
      
      // Recharger APRÈS avoir montré le message
      setTimeout(() => {
        window.location.href = `/${newLocale}/settings`; // Rediriger vers la même page avec le nouveau locale
      }, 1000);
    } catch (err) {
      console.error(err);
      setLangError(t("language.error"));
      setLangLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="space-y-6">
        {/* Language Settings Card */}
        <div className="max-w-lg rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-purple-50">
              <Globe size={15} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">{t("language.title")}</h2>
              <p className="text-xs text-gray-400">{t("language.description")}</p>
            </div>
          </div>

          <div className="px-6 py-5">
            <LanguageSelector 
              currentLang={locale} 
              onLanguageChange={handleLanguageChange} 
              t={t}
            />
            
            {langLoading && (
              <div className="flex items-center gap-2 mt-3 text-blue-600">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">{t("language.changing")}</span>
              </div>
            )}
            
            {langMessage && (
              <div className="flex items-start gap-2.5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 mt-3">
                <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-emerald-700">{t("language.success")}</p>
              </div>
            )}
            
            {langError && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 mt-3">
                <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{langError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Password Settings Card */}
        <div className="max-w-lg rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50">
              <Lock size={15} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">{t("password.title")}</h2>
              <p className="text-xs text-gray-400">{t("password.description")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <PasswordField
              label={t("password.current")}
              value={oldPassword}
              onChange={setOldPassword}
              show={showOld}
              onToggle={() => setShowOld((p) => !p)}
            />
            <PasswordField
              label={t("password.new")}
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew((p) => !p)}
            />
            <PasswordField
              label={t("password.confirm")}
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((p) => !p)}
            />

            {/* Feedback */}
            {message && (
              <div className="flex items-start gap-2.5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-emerald-700">{message}</p>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? t("password.updating") : t("password.update")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}