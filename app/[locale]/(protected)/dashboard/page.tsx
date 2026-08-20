"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

type DashboardModule = {
  id: string;
  name: string;
  successRate: number | null;
  failures: number;
  lastRunAt: string | null;
};

type DashboardData = {
  project: {
    id: string;
    name: string;
    baseUrl: string | null;
  };
  openBugs: number;
  generatedTests: number;
  quality: {
    requestedUrl: string;
    finalUrl: string;
    qualityScore: number | null;
    scores: {
      performance: number | null;
      accessibility: number | null;
      bestPractices: number | null;
      seo: number | null;
    };
    lighthouseVersion: string | null;
    auditedAt: string;
    durationMs: number;
  } | null;
  modules: DashboardModule[];
};

type LighthouseResult = {
  project: {
    id: string;
    name: string;
    baseUrl: string;
  };
  requestedUrl: string;
  finalUrl: string;
  qualityScore: number | null;
  scores: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  lighthouseVersion: string | null;
  auditedAt: string;
  durationMs: number;
};

type ScoreBarProps = {
  label: string;
  score: number | null;
};

function getScoreColor(score: number | null) {
  if (score === null) {
    return {
      text: "text-gray-400",
      bg: "bg-gray-300",
    };
  }

  if (score >= 90) {
    return {
      text: "text-green-600",
      bg: "bg-green-500",
    };
  }

  if (score >= 50) {
    return {
      text: "text-orange-500",
      bg: "bg-orange-500",
    };
  }

  return {
    text: "text-red-600",
    bg: "bg-red-500",
  };
}

function ScoreBar({ label, score }: ScoreBarProps) {
  const color = getScoreColor(score);
  const value = score ?? 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">
          {label}
        </span>

        <span className={`text-xs font-bold ${color.text}`}>
          {score === null ? "-" : score}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color.bg}`}
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const selectedProject = useAppSelector(
    (state) => state.projects.selectedProject
  );

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [quality, setQuality] = useState<LighthouseResult | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityError, setQualityError] = useState("");

  useEffect(() => {
    if (!selectedProject?.id) {
      return;
    }

    const controller = new AbortController();

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        setQuality(null);
        setQualityError("");

        const response = await fetch(
          `${API_URL}/dashboard/${selectedProject.id}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de charger les données du Dashboard."
          );
        }

        const result: DashboardData = await response.json();
        setData(result);

        if (result.quality) {
          setQuality({
            project: {
              id: result.project.id,
              name: result.project.name,
              baseUrl: result.project.baseUrl ?? "",
            },
            ...result.quality,
          });
        } else {
          setQuality(null);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du Dashboard."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      controller.abort();
    };
  }, [selectedProject?.id]);

  const runQualityAudit = async () => {
    if (!selectedProject?.id) return;

    try {
      setQualityLoading(true);
      setQualityError("");

      const response = await fetch(
        `${API_URL}/dashboard/${selectedProject.id}/quality`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Impossible d'exécuter l'audit Lighthouse."
        );
      }

      setQuality(result as LighthouseResult);
    } catch (err) {
      setQualityError(
        err instanceof Error
          ? err.message
          : "Erreur pendant l'audit Lighthouse."
      );
    } finally {
      setQualityLoading(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Vue synthétique du projet sélectionné.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">
            Aucun projet sélectionné
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sélectionnez un projet depuis la page Projet.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="p-8 text-sm text-gray-400">
        Chargement du Dashboard de {selectedProject.name}...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard
        </h1>

        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const globalScoreColor = getScoreColor(
    quality?.qualityScore ?? null
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Projet sélectionné :
          <span className="ml-1 font-semibold text-blue-600">
            {data.project.name}
          </span>
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="absolute bottom-0 left-0 top-0 w-1 bg-green-500" />

          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Score qualité Lighthouse
              </h2>

              <p className="mt-1 max-w-xl truncate text-[11px] text-gray-400">
                {data.project.baseUrl ||
                  "Aucune URL configurée pour ce projet"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void runQualityAudit()}
              disabled={qualityLoading || !data.project.baseUrl}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {qualityLoading
                ? "Audit en cours..."
                : quality
                  ? "Tester à nouveau"
                  : "Tester maintenant"}
            </button>
          </div>

          {qualityError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {qualityError}
            </div>
          )}

          {!data.project.baseUrl && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-600">
              Ajoutez une URL au projet depuis la page Projet avant
              de lancer Lighthouse.
            </div>
          )}

          {data.project.baseUrl && !quality && !qualityLoading && (
            <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-300">-</p>
                <p className="mt-1 text-xs text-gray-400">
                  Aucun audit Lighthouse exécuté.
                </p>
              </div>
            </div>
          )}

          {qualityLoading && (
            <div className="flex min-h-28 items-center justify-center rounded-lg bg-gray-50/50">
              <div className="text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <p className="mt-2 text-xs font-medium text-gray-600">
                  Analyse Lighthouse en cours...
                </p>
              </div>
            </div>
          )}

          {quality && !qualityLoading && (
            <>
              <div className="grid gap-5 md:grid-cols-[130px_1fr]">
                <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-3">
                  <p
                    className={`text-4xl font-bold ${globalScoreColor.text}`}
                  >
                    {quality.qualityScore === null
                      ? "-"
                      : `${quality.qualityScore}%`}
                  </p>

                  <p className="mt-1 text-xs font-medium text-gray-600">
                    Score qualité
                  </p>
                </div>

                <div className="space-y-3">
                  <ScoreBar
                    label="Performance"
                    score={quality.scores.performance}
                  />
                  <ScoreBar
                    label="Accessibilité"
                    score={quality.scores.accessibility}
                  />
                  <ScoreBar
                    label="Bonnes pratiques"
                    score={quality.scores.bestPractices}
                  />
                  <ScoreBar
                    label="SEO"
                    score={quality.scores.seo}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-[11px] text-gray-400">
                <span>
                  Audit : {new Date(quality.auditedAt).toLocaleString("fr-FR")}
                </span>

                <span>
                  Durée : {(quality.durationMs / 1000).toFixed(1)} s
                  {quality.lighthouseVersion
                    ? ` · Lighthouse ${quality.lighthouseVersion}`
                    : ""}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="grid gap-4">
          <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-red-500" />

            <p className="text-sm font-medium text-gray-500">
              Bugs ouverts
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900">
              {data.openBugs}
            </p>

            <p className="mt-1 text-[11px] text-gray-400">
              Nouveau, en cours ou réouvert
            </p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-cyan-500" />

            <p className="text-sm font-medium text-gray-500">
              Cas générés
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900">
              {data.generatedTests}
            </p>

            <p className="mt-1 text-[11px] text-gray-400">
              Cas issus de la génération intelligente
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-800">
            Modules / Suites
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            Suites appartenant au projet {data.project.name}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-left font-medium text-gray-500">
                  Module / Suite
                </th>
                <th className="px-6 py-4 text-left font-medium text-gray-500">
                  Succès
                </th>
                <th className="px-6 py-4 text-left font-medium text-gray-500">
                  Échecs
                </th>
                <th className="px-6 py-4 text-left font-medium text-gray-500">
                  Dernière exécution
                </th>
              </tr>
            </thead>

            <tbody>
              {data.modules.map((module, index) => (
                <tr
                  key={module.id}
                  className={
                    index !== data.modules.length - 1
                      ? "border-b border-gray-50"
                      : ""
                  }
                >
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {module.name}
                  </td>

                  <td className="px-6 py-4">
                    {module.successRate === null ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <span
                        className={
                          module.successRate >= 80
                            ? "font-medium text-green-600"
                            : module.successRate >= 50
                              ? "font-medium text-orange-500"
                              : "font-medium text-red-500"
                        }
                      >
                        {module.successRate}%
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {module.failures}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {module.lastRunAt
                      ? new Date(module.lastRunAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}

              {data.modules.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    Aucune suite de test dans ce projet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
