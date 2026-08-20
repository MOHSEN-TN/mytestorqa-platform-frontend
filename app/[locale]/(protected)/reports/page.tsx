/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Gauge,
  Loader2,
  PlayCircle,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  Report,
  ReportType,
  createReport,
  deleteReport,
  fetchReportOptions,
  fetchReportPreview,
  fetchReportStats,
  fetchReports,
  setSelectedReport,
} from "@/lib/slices/reportSlice";

const reportTypes: {
  value: ReportType;
  label: string;
  description: string;
  icon: any;
}[] = [
  {
    value: "EXECUTION_SUMMARY",
    label: "Exécution",
    description: "Résultats, statuts et progression des exécutions de tests.",
    icon: PlayCircle,
  },
  {
    value: "BUG_REPORT",
    label: "Bugs",
    description: "Anomalies, criticité, statuts et résolution.",
    icon: Bug,
  },
  {
    // Le backend réutilise TRENDS comme type QUALITY afin de rester
    // compatible avec le ReportType Prisma actuel.
    value: "TRENDS",
    label: "Qualité",
    description: "Score qualité et indicateurs globaux de la plateforme.",
    icon: Gauge,
  },
];

const typeLabels: Partial<Record<ReportType, string>> = {
  EXECUTION_SUMMARY: "Exécution",
  BUG_REPORT: "Bugs",
  TRENDS: "Qualité",
};

const statusLabels: Record<string, string> = {
  GENERATED: "Généré",
  SCHEDULED: "Planifié",
  GENERATING: "En génération",
  FAILED: "Échec",
};

const previewStatLabels: Record<string, string> = {
  qualityScore: "Score qualité",
  totalExecutions: "Exécutions",
  success: "Réussis",
  failed: "Échoués",
  blocked: "Bloqués",
  skipped: "Ignorés",
  todo: "À exécuter",
  successRate: "Taux de réussite",
  manualTests: "Tests manuels",
  automatedTests: "Tests automatisés",
  manualExecutions: "Exécutions manuelles",
  automatedExecutions: "Exécutions automatisées",
  averageDurationMs: "Durée moyenne",
  performance: "Performance",
  accessibility: "Accessibilité",
  bestPractices: "Bonnes pratiques",
  seo: "SEO",
  bugResolutionRate: "Résolution des bugs",
  automationRate: "Automatisation",
  totalTests: "Cas de test",
  openBugs: "Bugs ouverts",
  criticalBugs: "Bugs critiques",
};

const formatPreviewValue = (key: string, value: unknown) => {
  if (
    [
      "qualityScore",
      "successRate",
      "performance",
      "accessibility",
      "bestPractices",
      "seo",
      "bugResolutionRate",
      "automationRate",
    ].includes(key) &&
    typeof value === "number"
  ) {
    return `${value}%`;
  }

  return String(value);
};

const formatDuration = (milliseconds: unknown) => {
  if (typeof milliseconds !== "number" || !Number.isFinite(milliseconds) || milliseconds <= 0) {
    return "0 ms";
  }
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  const seconds = milliseconds / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ${Math.round(seconds % 60)} s`;
};

const getDownloadUrl = (reportId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3001";
  return `${baseUrl}/reports/${reportId}/download`;
};

export default function ReportsPage() {
  const dispatch = useAppDispatch();

  const {
    reports,
    selectedReport,
    preview,
    stats,
    options,
    loading,
    creating,
    deleting,
    previewLoading,
    error,
  } = useAppSelector((state: any) => state.reports);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<ReportType>("EXECUTION_SUMMARY");
  const [period, setPeriod] = useState("7 derniers jours");
  const [projectId, setProjectId] = useState("");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeLogs, setIncludeLogs] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedTypeConfig = useMemo(
    () => reportTypes.find((item) => item.value === type) || reportTypes[0],
    [type],
  );

  useEffect(() => {
    dispatch(fetchReportOptions());
    dispatch(fetchReportStats());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        fetchReports({
          page: 1,
          limit: 10,
          search: search || undefined,
          type: typeFilter,
          format: "ALL",
          status: statusFilter,
        }),
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [dispatch, search, typeFilter, statusFilter]);

  const refreshReports = () => {
    dispatch(fetchReportStats());
    dispatch(
      fetchReports({
        page: 1,
        limit: 10,
        search: search || undefined,
        type: typeFilter,
        format: "ALL",
        status: statusFilter,
      }),
    );
  };

  const resetForm = () => {
    setName("");
    setType("EXECUTION_SUMMARY");
    setPeriod("7 derniers jours");
    setProjectId("");
    setIncludeCharts(true);
    setIncludeDetails(true);
    setIncludeLogs(false);
    setFormError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Le nom du rapport est obligatoire.");
      return;
    }

    const result = await dispatch(
      createReport({
        name: name.trim(),
        type,
        format: "PDF",
        period,
        projectId: projectId || undefined,
        includeCharts,
        includeDetails,
        includeLogs,
      }),
    );

    if (createReport.fulfilled.match(result)) {
      closeModal();
      refreshReports();
    } else {
      setFormError(
        (result as any)?.payload?.message ||
          "Erreur lors de la génération du rapport.",
      );
    }
  };

  const handlePreview = async (report: Report) => {
    dispatch(setSelectedReport(report));
    setShowPreview(true);
    await dispatch(fetchReportPreview(report.id));
  };

  const handleDelete = async (reportId: string) => {
    if (!window.confirm("Supprimer ce rapport ?")) return;

    const result = await dispatch(deleteReport(reportId));

    if (deleteReport.fulfilled.match(result)) {
      refreshReports();
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const response = await fetch(getDownloadUrl(report.id), {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Impossible de télécharger le rapport PDF.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const fileNameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const defaultPrefix =
        report.type === "BUG_REPORT"
          ? "rapport-bugs"
          : report.type === "TRENDS"
            ? "rapport-qualite"
            : "rapport-execution";
      const fileName = fileNameMatch?.[1] || `${defaultPrefix}-${report.id}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      window.alert(
        downloadError instanceof Error
          ? downloadError.message
          : "Impossible de télécharger le rapport PDF.",
      );
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "GENERATED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SCHEDULED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "GENERATING":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "FAILED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getUserLabel = (user: any) => {
    if (!user) return "-";

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return fullName || user.email;
  };

  const getTypeIcon = (reportType: ReportType) => {
    const config = reportTypes.find((item) => item.value === reportType);
    const Icon = config?.icon || FileText;
    return <Icon size={15} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rapports</h1>
          <p className="text-sm text-gray-500">
            Générer, consulter et gérer les rapports QA de la plateforme.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={15} />
          Nouveau rapport
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <div className="max-w-sm rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase text-gray-400">
            Rapports générés
          </p>
          <FileText size={18} className="text-blue-500" />
        </div>
        <p className="mt-3 text-2xl font-bold text-gray-800">
          {stats?.generated || 0}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Rapports PDF Exécution, Bugs et Qualité.
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Rapports générés</h2>
            <p className="text-xs text-gray-400">
              Historique des rapports PDF disponibles.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-48 rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600"
            >
              <option value="ALL">Tous les types</option>
              <option value="EXECUTION_SUMMARY">Exécution</option>
              <option value="BUG_REPORT">Bugs</option>
              <option value="TRENDS">Qualité</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="GENERATED">Généré</option>
              <option value="SCHEDULED">Planifié</option>
              <option value="GENERATING">En génération</option>
              <option value="FAILED">Échec</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3 font-semibold">Nom</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Projet</th>
                <th className="px-5 py-3 font-semibold">Période</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
                <th className="px-5 py-3 font-semibold">Créé le</th>
                <th className="px-5 py-3 font-semibold">Taille</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-400">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Chargement...
                    </span>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                    Aucun rapport ne correspond aux filtres actuels.
                  </td>
                </tr>
              ) : (
                reports.map((report: Report) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-800">{report.name}</div>
                      <div className="text-xs text-gray-400">
                        Par {getUserLabel(report.createdBy)}
                      </div>
                    </td>

                    <td className="px-5 py-3 text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">{getTypeIcon(report.type)}</span>
                        {typeLabels[report.type] || "Rapport"}
                      </div>
                    </td>

                    <td className="px-5 py-3 text-gray-500">
                      {report.project?.name || "Tous les projets"}
                    </td>

                    <td className="px-5 py-3 text-gray-500">
                      {report.period || "-"}
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(
                          report.status,
                        )}`}
                      >
                        {statusLabels[report.status] || report.status}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                    </td>

                    <td className="px-5 py-3 text-gray-500">{report.size || "-"}</td>

                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handlePreview(report)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          title="Voir"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => handleDownload(report)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                          title="Télécharger le PDF"
                        >
                          <Download size={15} />
                        </button>

                        <button
                          disabled={deleting}
                          onClick={() => handleDelete(report.id)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Nouveau rapport</h2>
                <p className="text-xs text-gray-400">
                  Configurez un rapport QA. Le format PDF est appliqué automatiquement.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Nom du rapport *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Ex : Rapport QA sprint 1"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const nextType = e.target.value as ReportType;
                    setType(nextType);
                    if (nextType !== "EXECUTION_SUMMARY") {
                      setIncludeLogs(false);
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="EXECUTION_SUMMARY">Exécution</option>
                  <option value="BUG_REPORT">Bugs</option>
                  <option value="TRENDS">Qualité</option>
                </select>

                <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <selectedTypeConfig.icon size={15} className="mt-0.5 shrink-0" />
                  <span>{selectedTypeConfig.description}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Période</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {(options?.periods || ["7 derniers jours", "30 derniers jours"]).map(
                      (periodOption: string) => (
                        <option key={periodOption} value={periodOption}>
                          {periodOption}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Projet</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">Tous les projets</option>
                    {(options?.projects || []).map((project: any) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Format</p>
                  <p className="text-xs text-gray-400">Format disponible pour la V1</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-white px-3 py-1.5 text-sm font-semibold text-red-600">
                  <FileText size={15} />
                  PDF
                </span>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Settings2 size={15} />
                  Options du rapport
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="accent-blue-600"
                    />
                    Inclure les graphiques
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={includeDetails}
                      onChange={(e) => setIncludeDetails(e.target.checked)}
                      className="accent-blue-600"
                    />
                    {type === "BUG_REPORT"
                      ? "Inclure le détail des bugs"
                      : type === "TRENDS"
                        ? "Inclure les indicateurs détaillés"
                        : "Inclure les résultats détaillés"}
                  </label>

                  {type === "EXECUTION_SUMMARY" && (
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={includeLogs}
                        onChange={(e) => setIncludeLogs(e.target.checked)}
                        className="accent-blue-600"
                      />
                      Inclure les logs / exécutions
                    </label>
                  )}

                  {type === "TRENDS" && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Le score qualité est inclus automatiquement.
                    </div>
                  )}
                </div>
              </div>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {creating && <Loader2 size={15} className="animate-spin" />}
                  {creating ? "Génération..." : "Générer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Aperçu du rapport</h2>
                <p className="text-xs text-gray-400">{selectedReport?.name}</p>
              </div>

              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            {previewLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 size={22} className="animate-spin" />
              </div>
            ) : !preview ? (
              <p className="text-sm text-gray-400">Aucun aperçu disponible.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-800">{preview.report?.name}</h3>
                    <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                      PDF
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{preview.summary}</p>
                </div>

                {selectedReport?.type === "EXECUTION_SUMMARY" && preview.stats?.summary ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                      {[
                        ["Total", preview.stats.summary.total],
                        ["Réussis", preview.stats.summary.success],
                        ["Échoués", preview.stats.summary.failed],
                        ["Bloqués", preview.stats.summary.blocked],
                        ["Ignorés", preview.stats.summary.skipped],
                        ["Réussite", `${preview.stats.summary.successRate}%`],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-xl border border-gray-100 bg-white p-3">
                          <p className="text-xs uppercase text-gray-400">{label}</p>
                          <p className="mt-1 text-lg font-bold text-gray-800">{String(value)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Tests du projet</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Total</span><strong>{preview.stats.testInventory?.total || 0}</strong></div>
                          <div className="flex justify-between"><span className="text-gray-500">Manuels</span><strong>{preview.stats.testInventory?.manual || 0}</strong></div>
                          <div className="flex justify-between"><span className="text-gray-500">Automatisés</span><strong>{preview.stats.testInventory?.automated || 0}</strong></div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Exécutions sur la période</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Manuelles</span><strong>{preview.stats.executionsByMode?.manual || 0}</strong></div>
                          <div className="flex justify-between"><span className="text-gray-500">Automatisées</span><strong>{preview.stats.executionsByMode?.automated || 0}</strong></div>
                          <div className="flex justify-between"><span className="text-gray-500">Durée moyenne</span><strong>{formatDuration(preview.stats.performance?.averageDurationMs)}</strong></div>
                        </div>
                      </div>
                    </div>

                    {preview.stats.failedTests?.length > 0 && (
                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Tests échoués</h4>
                        <div className="space-y-2">
                          {preview.stats.failedTests.slice(0, 5).map((test: any) => (
                            <div key={test.id} className="rounded-lg bg-gray-50 px-3 py-2">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-gray-700">{test.title}</p>
                                <span className="shrink-0 text-xs font-semibold text-red-600">Échec</span>
                              </div>
                              <p className="mt-1 text-xs text-gray-400">
                                {String(test.mode).replaceAll("_", " ")} · {formatDuration(test.duration)}
                                {test.browser ? ` · ${test.browser}` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => selectedReport && handleDownload(selectedReport)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <Download size={15} />
                      Télécharger le PDF Exécution
                    </button>
                  </>
                ) : selectedReport?.type === "TRENDS" && preview.stats?.quality ? (
                  <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                        <p className="text-xs font-semibold uppercase text-blue-500">Score qualité Lighthouse</p>
                        <p className="mt-2 text-4xl font-bold text-blue-700">
                          {preview.stats.quality.qualityScore === null
                            ? "-"
                            : `${preview.stats.quality.qualityScore}%`}
                        </p>
                        <p className="mt-2 text-xs text-blue-600">
                          Même score Lighthouse que celui utilisé par le Dashboard.
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Scores Lighthouse</h4>
                        <div className="space-y-2 text-sm">
                          {[
                            ["Performance", preview.stats.quality.performance],
                            ["Accessibilité", preview.stats.quality.accessibility],
                            ["Bonnes pratiques", preview.stats.quality.bestPractices],
                            ["SEO", preview.stats.quality.seo],
                          ].map(([label, value]) => (
                            <div key={String(label)} className="flex items-center justify-between">
                              <span className="text-gray-500">{label}</span>
                              <strong>{typeof value === "number" ? `${value}%` : "-"}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Santé QA sur la période</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Réussite tests</span><strong>{preview.stats.qaHealth?.successRate || 0}%</strong></div>
                          <div className="flex justify-between"><span className="text-gray-500">Résolution bugs</span><strong>{preview.stats.qaHealth?.bugResolutionRate || 0}%</strong></div>
                          <div className="flex justify-between"><span className="text-gray-500">Automatisation</span><strong>{preview.stats.qaHealth?.automationRate || 0}%</strong></div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Indicateurs opérationnels</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Cas de test</span><strong>{preview.stats.operational?.totalTests || 0}</strong></div>
                          <div className="flex justify-between"><span className="text-gray-500">Exécutions</span><strong>{preview.stats.operational?.totalExecutions || 0}</strong></div>
                          <div className="flex justify-between"><span className="text-gray-500">Bugs ouverts</span><strong>{preview.stats.operational?.openBugs || 0}</strong></div>
                          <div className="flex justify-between"><span className="text-gray-500">Bugs critiques</span><strong>{preview.stats.operational?.criticalBugs || 0}</strong></div>
                        </div>
                      </div>
                    </div>

                    {preview.stats.audit?.auditedAt && (
                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-2 text-sm font-semibold text-gray-700">Audit Lighthouse utilisé</h4>
                        <p className="text-xs text-gray-500">
                          {new Date(preview.stats.audit.auditedAt).toLocaleDateString()}
                          {preview.stats.audit.lighthouseVersion
                            ? ` · Lighthouse ${preview.stats.audit.lighthouseVersion}`
                            : ""}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => selectedReport && handleDownload(selectedReport)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <Download size={15} />
                      Télécharger le PDF Qualité
                    </button>
                  </>
                ) : selectedReport?.type === "BUG_REPORT" && preview.stats?.summary ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {[
                        ["Total", preview.stats.summary.total],
                        ["Ouverts", preview.stats.summary.open],
                        ["Résolus", preview.stats.summary.resolved],
                        ["Critiques", preview.stats.summary.critical],
                        ["Résolution", `${preview.stats.summary.resolutionRate}%`],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-xl border border-gray-100 bg-white p-3">
                          <p className="text-xs uppercase text-gray-400">{label}</p>
                          <p className="mt-1 text-lg font-bold text-gray-800">{String(value)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Par statut</h4>
                        <div className="space-y-2">
                          {(preview.stats.byStatus || []).map((item: any) => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">{String(item.label).replaceAll("_", " ")}</span>
                              <span className="font-semibold text-gray-800">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Par sévérité</h4>
                        <div className="space-y-2">
                          {(preview.stats.bySeverity || []).map((item: any) => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">{String(item.label).replaceAll("_", " ")}</span>
                              <span className="font-semibold text-gray-800">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Par priorité</h4>
                        <div className="space-y-2">
                          {(preview.stats.byPriority || []).map((item: any) => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">{String(item.label).replaceAll("_", " ")}</span>
                              <span className="font-semibold text-gray-800">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {preview.stats.criticalBugs?.length > 0 && (
                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Bugs critiques</h4>
                        <div className="space-y-2">
                          {preview.stats.criticalBugs.slice(0, 5).map((bug: any) => (
                            <div key={bug.id} className="rounded-lg bg-gray-50 px-3 py-2">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-gray-700">{bug.title}</p>
                                <span className="shrink-0 text-xs font-semibold text-red-600">
                                  {bug.severity}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-gray-400">
                                {bug.id} · {String(bug.status).replaceAll("_", " ")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => selectedReport && handleDownload(selectedReport)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <Download size={15} />
                      Télécharger le PDF Bugs
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Object.entries(preview.stats || {})
                      .filter(([, value]) => typeof value !== "object")
                      .map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-gray-100 bg-white p-4">
                          <p className="text-xs uppercase text-gray-400">
                            {previewStatLabels[key] || key}
                          </p>
                          <p className="mt-1 text-xl font-bold text-gray-800">
                            {formatPreviewValue(key, value)}
                          </p>
                        </div>
                      ))}
                  </div>
                )}

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                  Les données sont filtrées côté backend selon le projet et la période choisis.
                  Le téléchargement PDF réel est actif pour les rapports Bugs, Exécution et Qualité.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
