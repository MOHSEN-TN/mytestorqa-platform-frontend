"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const params = useParams<{ locale?: string }>();
  const token = searchParams.get("token") ?? "";
  const locale = params?.locale === "en" ? "en" : "fr";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const passwordValid = useMemo(
    () =>
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword),
    [newPassword],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Le lien de réinitialisation est incomplet.");
      return;
    }

    if (!passwordValid) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Lien invalide ou expiré.");
      }

      setSuccess(data?.message || "Mot de passe défini avec succès.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de modifier le mot de passe.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <LockKeyhole size={24} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Choisir un nouveau mot de passe
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Ce lien est valable pendant 15 minutes et ne peut être utilisé qu’une seule fois.
        </p>

        {success ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-medium">{success}</p>
                <a
                  href={`/${locale}/auth`}
                  className="mt-3 inline-block text-sm font-semibold underline"
                >
                  Aller à la connexion
                </a>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-label="Afficher ou masquer le mot de passe"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                autoComplete="new-password"
                required
              />
            </div>

            <p className="text-xs leading-5 text-gray-500">
              Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial.
            </p>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
