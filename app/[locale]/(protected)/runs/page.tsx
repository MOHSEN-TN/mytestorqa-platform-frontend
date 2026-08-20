"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchProjects, setSelectedProject } from "@/lib/slices/projectSlice";
import {
  clearCampaigns,
  createCampaign,
  fetchCampaigns,
  setSelectedCampaign,
} from "@/lib/slices/campaignSlice";
import {
  clearIterations,
  createIteration,
  fetchIterations,
  setSelectedIteration,
} from "@/lib/slices/iterationSlice";
import { clearTestSuites, fetchTestSuites } from "@/lib/slices/testSuiteSlice";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  FolderKanban,
  Megaphone,
  RefreshCw,
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  SkipForward,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Archive,
  Bot,
  ExternalLink,
  FileText,
  UserRound,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

type IterationExecutionStatus =
  | "DRAFT"
  | "RUNNING"
  | "AWAITING_MANUAL"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

type ExecutionStatus =
  | "TODO"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "BLOCKED"
  | "SKIPPED";

type ExecutionType = "MANUAL" | "AUTOMATED";

type RunResponse = {
  iterationId?: string;
  status?: IterationExecutionStatus;
  count?: number;
  manualCount?: number;
  automatedCount?: number;
  message?: string;
};

type ExecutionStepItem = {
  id: string;
  iterationItemId: string;
  testStepId: string;
  status: ExecutionStatus;
  comment?: string | null;
  executedAt?: string | null;
  testStep: {
    id: string;
    stepOrder: number;
    action: string;
    expected?: string | null;
  };
};

type ExecutionItem = {
  id: string;
  iterationId: string;
  testCaseId: string;
  executionType: ExecutionType;
  status: ExecutionStatus;
  comment?: string | null;
  duration?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  executedAt?: string | null;
  automationRunId?: string | null;
  browser?: string | null;
  executionMode?: string | null;
  error?: string | null;
  failureDetails?: Record<string, unknown> | null;
  automationLogs?: unknown[] | null;
  screenshotUrl?: string | null;
  traceUrl?: string | null;
  artifactsZipUrl?: string | null;
  executionReportUrl?: string | null;
  automationFrameworkSnapshot?: string | null;
  automationCodeSnapshot?: string | null;
  testCase: {
    id: string;
    title: string;
    description?: string | null;
    expected?: string | null;
    priority?: string;
    status?: string;
  };
  stepResults?: ExecutionStepItem[];
};

type RunView = {
  id: string;
  status: IterationExecutionStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  items?: ExecutionItem[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const getStatusLabel = (
  status: ExecutionStatus,
  t: (key: string) => string,
): string => {
  if (status === "RUNNING") return "En cours";
  return t(`status.${status}`);
};

const getIterationStatusLabel = (
  status: IterationExecutionStatus | null,
): string => {
  const labels: Record<IterationExecutionStatus, string> = {
    DRAFT: "Brouillon",
    RUNNING: "Exécution en cours",
    AWAITING_MANUAL: "En attente des tests manuels",
    COMPLETED: "Terminée",
    FAILED: "Erreur d’exécution",
    CANCELLED: "Annulée",
  };

  return status ? labels[status] : "Non démarrée";
};

const getIterationStatusClass = (
  status: IterationExecutionStatus | null,
): string => {
  switch (status) {
    case "RUNNING":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "AWAITING_MANUAL":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "FAILED":
      return "bg-red-100 text-red-700 border-red-200";
    case "CANCELLED":
      return "bg-gray-200 text-gray-700 border-gray-300";
    case "DRAFT":
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const toArtifactUrl = (value?: string | null): string | null => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  return `${API_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const getStatusBadge = (status: ExecutionStatus): string => {
  const map: Record<ExecutionStatus, string> = {
    TODO: "bg-gray-100 text-gray-600 border border-gray-200",
    RUNNING: "bg-blue-100 text-blue-700 border border-blue-200",
    SUCCESS: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    FAILED: "bg-red-100 text-red-700 border border-red-200",
    BLOCKED: "bg-orange-100 text-orange-700 border border-orange-200",
    SKIPPED: "bg-sky-100 text-sky-700 border border-sky-200",
  };

  return map[status];
};

const getStatusBtnClass = (status: ExecutionStatus): string => {
  const map: Record<ExecutionStatus, string> = {
    TODO: "bg-gray-500 hover:bg-gray-600",
    RUNNING: "bg-blue-500 hover:bg-blue-600",
    SUCCESS: "bg-emerald-600 hover:bg-emerald-700",
    FAILED: "bg-red-600 hover:bg-red-700",
    BLOCKED: "bg-orange-500 hover:bg-orange-600",
    SKIPPED: "bg-sky-600 hover:bg-sky-700",
  };

  return map[status];
};

const getStatusIcon = (status: ExecutionStatus): React.ReactNode => {
  const map: Record<ExecutionStatus, React.ReactNode> = {
    TODO: <Clock size={12} />,
    RUNNING: <RefreshCw size={12} className="animate-spin" />,
    SUCCESS: <CheckCircle2 size={12} />,
    FAILED: <XCircle size={12} />,
    BLOCKED: <AlertCircle size={12} />,
    SKIPPED: <SkipForward size={12} />,
  };

  return map[status];
};

const getStatusBarClass = (status: ExecutionStatus): string => {
  const map: Record<ExecutionStatus, string> = {
    TODO: "bg-gray-400",
    RUNNING: "bg-blue-500",
    SUCCESS: "bg-emerald-500",
    FAILED: "bg-red-500",
    BLOCKED: "bg-orange-500",
    SKIPPED: "bg-sky-500",
  };

  return map[status];
};

const stepStatuses: ExecutionStatus[] = [
  "SUCCESS",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "TODO",
];

const statusOrder: ExecutionStatus[] = [
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "TODO",
];

function ArtifactLink({
  href,
  label,
  icon,
}: {
  href?: string | null;
  label: string;
  icon: React.ReactNode;
}) {
  const resolvedHref = toArtifactUrl(href);

  if (!resolvedHref) return null;

  return (
    <a
      href={resolvedHref}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
    >
      {icon}
      {label}
      <ExternalLink size={11} />
    </a>
  );
}

function PanelHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
      {icon}

      <div>
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        className ?? "bg-gray-50 border-gray-100"
      }`}
    >
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function CollapseBtn({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -left-4 top-10 z-20 hidden xl:flex items-center justify-center h-8 w-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-blue-600 transition-colors"
    >
      {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
    </button>
  );
}

function CreateInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  loading,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  placeholder: string;
  loading: boolean;
  disabled: boolean;
  t: (key: string) => string;
}) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 px-3 pb-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 disabled:opacity-40"
      />

      <button
        type="submit"
        disabled={!value.trim() || loading || disabled}
        className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors"
      >
        {loading ? (
          <RefreshCw size={13} className="animate-spin" />
        ) : (
          <Plus size={15} />
        )}
      </button>
    </form>
  );
}

export default function RunsPage() {
  const { t } = useTranslation("runs");
  const dispatch = useAppDispatch();
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  const {
    projects,
    loading: loadingProjects,
    selectedProject,
    error: projectError,
  } = useAppSelector((s) => s.projects);

  const {
    campaigns,
    selectedCampaign,
    loading: loadingCampaigns,
    creating: creatingCampaign,
    error: campaignError,
  } = useAppSelector((s) => s.campaigns);

  const {
    iterations,
    selectedIteration,
    loading: loadingIterations,
    creating: creatingIteration,
    error: iterationError,
  } = useAppSelector((s) => s.iterations);

  const { testSuites, loading: loadingSuites } = useAppSelector(
    (s) => s.testSuites,
  );

  const [newCampaign, setNewCampaign] = useState("");
  const [newIteration, setNewIteration] = useState("");
  const [selectedSuiteIds, setSelectedSuiteIds] = useState<string[]>([]);
  const [addingSuites, setAddingSuites] = useState(false);
  const [running, setRunning] = useState(false);
  const [iterationRunStatus, setIterationRunStatus] =
    useState<IterationExecutionStatus | null>(null);
  const [runStartedAt, setRunStartedAt] = useState<string | null>(null);
  const [runFinishedAt, setRunFinishedAt] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [executionItems, setExecutionItems] = useState<ExecutionItem[]>([]);
  const [loadingExecution, setLoadingExecution] = useState(false);
  const [savingStepId, setSavingStepId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState(false);
  const [collapsedCampaigns, setCollapsedCampaigns] = useState(false);
  const [collapsedIterations, setCollapsedIterations] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedProject?.id) {
      dispatch(clearCampaigns());
      dispatch(clearIterations());
      dispatch(clearTestSuites());
      return;
    }

    dispatch(fetchCampaigns(selectedProject.id));
    dispatch(fetchTestSuites(selectedProject.id));
  }, [dispatch, selectedProject?.id]);

  useEffect(() => {
    if (!selectedCampaign?.id) {
      dispatch(clearIterations());
      return;
    }

    dispatch(fetchIterations(selectedCampaign.id));
  }, [dispatch, selectedCampaign?.id]);

  useEffect(() => {
    const fn = () => setIsFullscreen(Boolean(document.fullscreenElement));

    document.addEventListener("fullscreenchange", fn);

    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  const fetchExecutionItems = useCallback(
    async (
      iterationId: string,
      options: { silent?: boolean } = {},
    ): Promise<RunView | null> => {
      try {
        if (!options.silent) {
          setLoadingExecution(true);
        }
        setRunError(null);

        const res = await fetch(
          `${API_URL}/iterations/${iterationId}/run`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!res.ok) {
          const responseText = await res.text();
          console.error("Erreur chargement execution:", responseText);
          throw new Error(responseText);
        }

        const data = (await res.json()) as RunView;
        const items = Array.isArray(data.items) ? data.items : [];

        setExecutionItems(items);
        setIterationRunStatus(data.status ?? null);
        setRunStartedAt(data.startedAt ?? null);
        setRunFinishedAt(data.finishedAt ?? null);
        setRunning(data.status === "RUNNING");

        setExpandedItemId((current) => current ?? items[0]?.id ?? null);

        return data;
      } catch (error) {
        console.error("Impossible de charger les cas de test:", error);
        setRunError(t("execution.alerts.loadError"));
        return null;
      } finally {
        if (!options.silent) {
          setLoadingExecution(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    if (
      !selectedIteration?.id ||
      iterationRunStatus !== "RUNNING"
    ) {
      return;
    }

    const iterationId = selectedIteration.id;
    const timer = window.setInterval(() => {
      void fetchExecutionItems(iterationId, { silent: true });
    }, 2000);

    return () => window.clearInterval(timer);
  }, [
    fetchExecutionItems,
    iterationRunStatus,
    selectedIteration?.id,
  ]);

  const reset = () => {
    setSelectedSuiteIds([]);
    setExecutionItems([]);
    setExpandedItemId(null);
    setIterationRunStatus(null);
    setRunStartedAt(null);
    setRunFinishedAt(null);
    setRunning(false);
    setRunMessage(null);
    setRunError(null);
  };

  const handleSelectProject = (p: (typeof projects)[number]) => {
    dispatch(setSelectedProject(p));
    dispatch(clearCampaigns());
    dispatch(clearIterations());
    dispatch(clearTestSuites());
    reset();
  };

  const handleSelectCampaign = (c: (typeof campaigns)[number]) => {
    dispatch(setSelectedCampaign(c));
    dispatch(clearIterations());
    reset();
  };

  const handleSelectIteration = (it: (typeof iterations)[number]) => {
    dispatch(setSelectedIteration(it));
    reset();
    void fetchExecutionItems(it.id);
  };

  const handleCreateCampaign = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedProject?.id || !newCampaign.trim()) return;

    const r = await dispatch(
      createCampaign({
        projectId: selectedProject.id,
        name: newCampaign.trim(),
      }),
    );

    if (createCampaign.fulfilled.match(r)) {
      setNewCampaign("");
      dispatch(fetchCampaigns(selectedProject.id));
    }
  };

  const handleCreateIteration = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedCampaign?.id || !newIteration.trim()) return;

    const r = await dispatch(
      createIteration({
        campaignId: selectedCampaign.id,
        name: newIteration.trim(),
      }),
    );

    if (createIteration.fulfilled.match(r)) {
      const it = r.payload;

      setNewIteration("");
      dispatch(setSelectedIteration(it));
      reset();
      dispatch(fetchIterations(selectedCampaign.id));
      void fetchExecutionItems(it.id);
    }
  };

  const handleAddSuites = async () => {
    if (!selectedIteration?.id || !selectedSuiteIds.length) return;

    try {
      setAddingSuites(true);
      setRunMessage(null);
      setRunError(null);

      const res = await fetch(
        `${API_URL}/iterations/${selectedIteration.id}/suites`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ suiteIds: selectedSuiteIds }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Erreur ajout suites:", text);
        throw new Error(text);
      }

      setRunMessage(t("execution.alerts.suitesAdded"));
      setSelectedSuiteIds([]);
    } catch (error) {
      console.error("Impossible d'ajouter les suites:", error);
      setRunError(t("execution.alerts.addSuitesError"));
    } finally {
      setAddingSuites(false);
    }
  };

  const handleRunTests = async () => {
    if (!selectedIteration?.id) return;

    try {
      setRunning(true);
      setIterationRunStatus("RUNNING");
      setRunMessage(null);
      setRunError(null);

      const res = await fetch(
        `${API_URL}/iterations/${selectedIteration.id}/run`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!res.ok) {
        const responseText = await res.text();
        console.error("Erreur lancement execution:", responseText);
        throw new Error(responseText);
      }

      const data = (await res.json()) as RunResponse;
      const count = data.count ?? 0;
      const manualCount = data.manualCount ?? 0;
      const automatedCount = data.automatedCount ?? 0;

      setIterationRunStatus(data.status ?? "RUNNING");
      setRunMessage(
        `${data.message ?? `Exécution préparée pour ${count} cas.`} ` +
          `(${manualCount} manuel(s), ${automatedCount} automatique(s)).`,
      );

      await fetchExecutionItems(selectedIteration.id, { silent: true });
    } catch (error) {
      console.error("Impossible de lancer l'exécution:", error);
      setRunning(false);
      setIterationRunStatus(null);
      setRunError(t("execution.alerts.runError"));
    }
  };

  const handleUpdateStep = async (
    iterationItemId: string,
    testStepId: string,
    status: ExecutionStatus,
  ) => {
    if (!selectedIteration?.id) return;

    try {
      setSavingStepId(testStepId);
      setRunError(null);

      const res = await fetch(
        `${API_URL}/iterations/items/${iterationItemId}/steps/${testStepId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Erreur update step:", text);
        throw new Error(text);
      }

      await fetchExecutionItems(selectedIteration.id);
    } catch (error) {
      console.error("Impossible de modifier le statut du step:", error);
      setRunError(t("execution.alerts.stepUpdateError"));
    } finally {
      setSavingStepId(null);
    }
  };

  const stats = {
    total: executionItems.length,
    todo: executionItems.filter((item) => item.status === "TODO").length,
    running: executionItems.filter((item) => item.status === "RUNNING").length,
    success: executionItems.filter((item) => item.status === "SUCCESS").length,
    failed: executionItems.filter((item) => item.status === "FAILED").length,
    blocked: executionItems.filter((item) => item.status === "BLOCKED").length,
    skipped: executionItems.filter((item) => item.status === "SKIPPED").length,
  };

  const done =
    stats.success + stats.failed + stats.blocked + stats.skipped;
  const progress = stats.total
    ? Math.round((done / stats.total) * 100)
    : 0;
  const successRate = stats.total
    ? Math.round((stats.success / stats.total) * 100)
    : 0;
  const failureRate = stats.total
    ? Math.round((stats.failed / stats.total) * 100)
    : 0;

  const visible = [
    !collapsedProjects,
    !collapsedCampaigns,
    !collapsedIterations,
    true,
  ].filter(Boolean).length;

  const colSpan =
    visible === 1
      ? "xl:col-span-12"
      : visible === 2
        ? "xl:col-span-6"
        : visible === 3
          ? "xl:col-span-4"
          : "xl:col-span-3";

  const globalError = projectError || campaignError || iterationError;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("subtitle")}</p>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              if (!document.fullscreenElement) {
                await fullscreenRef.current?.requestFullscreen();
              } else {
                await document.exitFullscreen();
              }
            } catch {
              // Ignore fullscreen errors
            }
          }}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
        >
          {isFullscreen ? (
            <>
              <Minimize2 size={14} />
              {t("fullscreen.exit")}
            </>
          ) : (
            <>
              <Maximize2 size={14} />
              {t("fullscreen.enter")}
            </>
          )}
        </button>
      </div>

      {globalError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle size={14} />
          {globalError}
        </div>
      )}

      {runError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle size={14} />
          {runError}
        </div>
      )}

      {runMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={14} />
          {runMessage}
        </div>
      )}

      <div
        ref={fullscreenRef}
        className={isFullscreen ? "overflow-auto bg-gray-50 p-6 min-h-screen" : ""}
      >
        {isFullscreen && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-700">
              {t("fullscreen.view")}
            </h2>

            <button
              type="button"
              onClick={async () => {
                try {
                  await document.exitFullscreen();
                } catch {
                  // Ignore fullscreen errors
                }
              }}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-white transition-colors"
            >
              <Minimize2 size={14} />
              {t("fullscreen.close")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {!collapsedProjects && (
            <section
              className={`min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${colSpan}`}
            >
              <PanelHeader
                icon={<FolderKanban size={15} className="text-blue-500" />}
                title={t("projects.title")}
              />

              <div className="p-3 space-y-1.5">
                {loadingProjects ? (
                  <p className="text-sm text-gray-400 px-2 py-4">
                    {t("projects.loading")}
                  </p>
                ) : projects.length === 0 ? (
                  <p className="text-sm text-gray-400 px-2 py-4">
                    {t("projects.empty")}
                  </p>
                ) : (
                  projects.map((p) => {
                    const active = selectedProject?.id === p.id;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProject(p)}
                        className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                          active
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="text-sm font-medium truncate">
                          {p.name}
                        </div>

                        <div
                          className={`text-xs mt-0.5 ${
                            active ? "text-blue-100" : "text-gray-400"
                          }`}
                          suppressHydrationWarning
                        >
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString()
                            : "—"}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {!collapsedCampaigns && (
            <section
              className={`relative min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${colSpan}`}
            >
              <CollapseBtn
                collapsed={collapsedProjects}
                onClick={() => setCollapsedProjects((p) => !p)}
              />

              <PanelHeader
                icon={<Megaphone size={15} className="text-purple-500" />}
                title={t("campaigns.title")}
                subtitle={t("campaigns.subtitle")}
              />

              {!selectedProject ? (
                <p className="text-sm text-gray-400 px-5 py-4">
                  {t("campaigns.selectFirst")}
                </p>
              ) : (
                <>
                  <div className="px-3 pt-3">
                    <CreateInput
                      value={newCampaign}
                      onChange={setNewCampaign}
                      onSubmit={handleCreateCampaign}
                      placeholder={t("campaigns.newPlaceholder")}
                      loading={creatingCampaign}
                      disabled={!selectedProject}
                      t={t}
                    />
                  </div>

                  <div className="px-3 pb-3 space-y-1.5">
                    {loadingCampaigns ? (
                      <p className="text-sm text-gray-400 py-4">
                        {t("campaigns.loading")}
                      </p>
                    ) : campaigns.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4">
                        {t("campaigns.empty")}
                      </p>
                    ) : (
                      campaigns.map((c) => {
                        const active = selectedCampaign?.id === c.id;

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCampaign(c)}
                            className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                              active
                                ? "bg-purple-600 text-white"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="text-sm font-medium truncate">
                              {c.name}
                            </div>

                            <div
                              className={`text-xs mt-0.5 ${
                                active ? "text-purple-100" : "text-gray-400"
                              }`}
                              suppressHydrationWarning
                            >
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleDateString()
                                : "—"}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {!collapsedIterations && (
            <section
              className={`relative min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${colSpan}`}
            >
              <CollapseBtn
                collapsed={collapsedCampaigns}
                onClick={() => setCollapsedCampaigns((p) => !p)}
              />

              <PanelHeader
                icon={<RefreshCw size={15} className="text-amber-500" />}
                title={t("iterations.title")}
                subtitle={t("iterations.subtitle")}
              />

              {!selectedCampaign ? (
                <p className="text-sm text-gray-400 px-5 py-4">
                  {t("iterations.selectFirst")}
                </p>
              ) : (
                <>
                  <div className="px-3 pt-3">
                    <CreateInput
                      value={newIteration}
                      onChange={setNewIteration}
                      onSubmit={handleCreateIteration}
                      placeholder={t("iterations.newPlaceholder")}
                      loading={creatingIteration}
                      disabled={!selectedCampaign}
                      t={t}
                    />
                  </div>

                  <div className="px-3 pb-3 space-y-1.5">
                    {loadingIterations ? (
                      <p className="text-sm text-gray-400 py-4">
                        {t("iterations.loading")}
                      </p>
                    ) : iterations.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4">
                        {t("iterations.empty")}
                      </p>
                    ) : (
                      iterations.map((it) => {
                        const active = selectedIteration?.id === it.id;

                        return (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => handleSelectIteration(it)}
                            className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                              active
                                ? "bg-amber-500 text-white"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="text-sm font-medium truncate">
                              {it.name}
                            </div>

                            <div
                              className={`text-xs mt-0.5 ${
                                active ? "text-amber-100" : "text-gray-400"
                              }`}
                              suppressHydrationWarning
                            >
                              {it.createdAt
                                ? new Date(it.createdAt).toLocaleDateString()
                                : "—"}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          <section
            className={`relative min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${colSpan}`}
          >
            <CollapseBtn
              collapsed={collapsedIterations}
              onClick={() => setCollapsedIterations((p) => !p)}
            />

            <PanelHeader
              icon={<FlaskConical size={15} className="text-blue-500" />}
              title={t("execution.title")}
              subtitle={
                selectedIteration
                  ? selectedIteration.name
                  : t("execution.subtitle")
              }
            />

            <div className="p-4 space-y-5">
              {!selectedIteration ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  {t("execution.selectFirst")}
                </p>
              ) : (
                <>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs text-gray-500 space-y-0.5">
                    <div>
                      <span className="font-semibold text-gray-700">
                        {t("execution.iteration")} :
                      </span>{" "}
                      {selectedIteration.name}
                    </div>

                    <div>
                      <span className="font-semibold text-gray-700">
                        {t("execution.campaign")} :
                      </span>{" "}
                      {selectedCampaign?.name}
                    </div>

                    <div>
                      <span className="font-semibold text-gray-700">
                        {t("execution.project")} :
                      </span>{" "}
                      {selectedProject?.name}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-500">
                        Statut de l’itération
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        {runStartedAt && (
                          <span>
                            Début : {new Date(runStartedAt).toLocaleString()}
                          </span>
                        )}
                        {runFinishedAt && (
                          <span>
                            Fin : {new Date(runFinishedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getIterationStatusClass(
                        iterationRunStatus,
                      )}`}
                    >
                      {iterationRunStatus === "RUNNING" && (
                        <RefreshCw size={12} className="animate-spin" />
                      )}
                      {getIterationStatusLabel(iterationRunStatus)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        {t("execution.suitesTitle")}
                      </span>
                    </div>

                    <div className="p-3 space-y-1.5">
                      {loadingSuites ? (
                        <p className="text-sm text-gray-400">
                          {t("projects.loading")}
                        </p>
                      ) : testSuites.length === 0 ? (
                        <p className="text-sm text-gray-400">
                          {t("execution.noSuites")}
                        </p>
                      ) : (
                        testSuites.map((suite) => (
                          <label
                            key={suite.id}
                            className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-white px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSuiteIds.includes(suite.id)}
                              onChange={() =>
                                setSelectedSuiteIds((p) =>
                                  p.includes(suite.id)
                                    ? p.filter((id) => id !== suite.id)
                                    : [...p, suite.id],
                                )
                              }
                              className="accent-emerald-600"
                            />

                            <span className="text-sm text-gray-700 truncate">
                              {suite.name}
                            </span>
                          </label>
                        ))
                      )}
                    </div>

                    <div className="flex items-center gap-2 px-3 pb-3">
                      <button
                        type="button"
                        onClick={handleAddSuites}
                        disabled={!selectedSuiteIds.length || addingSuites}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-medium text-white disabled:opacity-40 transition-colors"
                      >
                        {addingSuites ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Plus size={12} />
                        )}
                        {t("execution.addSuites")}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunTests}
                    disabled={running}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                  >
                    {running ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {running
                      ? t("execution.running")
                      : t("execution.runTests")}
                  </button>

                  {stats.total > 0 && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            {t("execution.progress")}
                          </span>
                          <span className="text-xs font-bold text-gray-700">
                            {progress}%
                          </span>
                        </div>

                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                          <span>
                            {done} {t("execution.done")}
                          </span>
                          <span>
                            {stats.running > 0
                              ? `${stats.running} en cours — `
                              : ""}
                            {stats.todo} {t("execution.remaining")}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <StatCard
                          label={t("execution.stats.total")}
                          value={stats.total}
                        />
                        <StatCard
                          label="En cours"
                          value={stats.running}
                          className="bg-blue-50 border-blue-100 text-blue-700"
                        />
                        <StatCard
                          label={t("execution.stats.done")}
                          value={done}
                        />
                        <StatCard
                          label={t("execution.stats.todo")}
                          value={stats.todo}
                        />
                        <StatCard
                          label={t("execution.stats.success")}
                          value={stats.success}
                          className="bg-emerald-50 border-emerald-100 text-emerald-700"
                        />
                        <StatCard
                          label={t("execution.stats.failed")}
                          value={stats.failed}
                          className="bg-red-50 border-red-100 text-red-700"
                        />
                        <StatCard
                          label={t("execution.stats.blocked")}
                          value={stats.blocked}
                          className="bg-orange-50 border-orange-100 text-orange-700"
                        />
                        <StatCard
                          label="Ignorés"
                          value={stats.skipped}
                          className="bg-sky-50 border-sky-100 text-sky-700"
                        />
                      </div>

                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            {t("execution.statistics.title")}
                          </span>
                        </div>

                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-50">
                              <th className="text-left px-4 py-2 text-gray-400 font-semibold">
                                {t("execution.statistics.value")}
                              </th>
                              <th className="text-left px-4 py-2 text-gray-400 font-semibold">
                                {t("execution.statistics.value")}
                              </th>
                              <th className="text-left px-4 py-2 text-gray-400 font-semibold">
                                {t("execution.statistics.rate")}
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {[
                              {
                                label: t("execution.statistics.progress"),
                                num: done,
                                den: stats.total,
                                rate: progress,
                              },
                              {
                                label: t("execution.statistics.successRate"),
                                num: stats.success,
                                den: stats.total,
                                rate: successRate,
                              },
                              {
                                label: t("execution.statistics.failureRate"),
                                num: stats.failed,
                                den: stats.total,
                                rate: failureRate,
                              },
                            ].map((row) => (
                              <tr key={row.label} className="border-t border-gray-50">
                                <td className="px-4 py-2 text-gray-600">
                                  {row.label}
                                </td>
                                <td className="px-4 py-2 text-gray-700 font-medium">
                                  {row.num}/{row.den}
                                </td>
                                <td className="px-4 py-2 text-gray-700 font-medium">
                                  {row.rate}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            {t("execution.status.title")}
                          </span>
                        </div>

                        <div className="p-4 space-y-3">
                          {statusOrder.map((s) => {
                            const v =
                              s === "RUNNING"
                                ? stats.running
                                : s === "SUCCESS"
                                  ? stats.success
                                  : s === "FAILED"
                                    ? stats.failed
                                    : s === "BLOCKED"
                                      ? stats.blocked
                                      : s === "SKIPPED"
                                        ? stats.skipped
                                        : stats.todo;

                            const r = stats.total
                              ? Math.round((v / stats.total) * 100)
                              : 0;

                            return (
                              <div key={s}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600 font-medium">
                                    {getStatusLabel(s, t)}
                                  </span>
                                  <span className="text-gray-400">
                                    {v} — {r}%
                                  </span>
                                </div>

                                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${getStatusBarClass(
                                      s,
                                    )}`}
                                    style={{ width: `${r}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        {t("execution.testCases.title")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {executionItems.length}{" "}
                        {t("execution.testCases.items")}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {loadingExecution ? (
                        <p className="text-sm text-gray-400 px-4 py-6 text-center">
                          {t("execution.testCases.loading")}
                        </p>
                      ) : executionItems.length === 0 ? (
                        <p className="text-sm text-gray-400 px-4 py-6 text-center">
                          {t("execution.testCases.empty")}
                        </p>
                      ) : (
                        executionItems.map((item) => {
                          const expanded = expandedItemId === item.id;
                          const isAutomated =
                            item.executionType === "AUTOMATED";

                          return (
                            <div
                              key={item.id}
                              className={`transition-colors ${
                                expanded ? "bg-blue-50/30" : "bg-white"
                              }`}
                            >
                              <div className="flex items-start gap-3 px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedItemId((current) =>
                                      current === item.id ? null : item.id,
                                    )
                                  }
                                  className="mt-0.5 text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                  {expanded ? (
                                    <ChevronUp size={15} />
                                  ) : (
                                    <ChevronDown size={15} />
                                  )}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-gray-800 truncate">
                                      {item.testCase?.title || "Test case"}
                                    </div>
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        isAutomated
                                          ? "bg-violet-100 text-violet-700"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {isAutomated ? (
                                        <Bot size={10} />
                                      ) : (
                                        <UserRound size={10} />
                                      )}
                                      {isAutomated ? "Automatique" : "Manuel"}
                                    </span>
                                  </div>

                                  <div className="text-xs text-gray-400 truncate">
                                    {item.testCase?.description ||
                                      t("execution.testCases.noDescription")}
                                  </div>
                                </div>

                                <span
                                  className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${getStatusBadge(
                                    item.status,
                                  )}`}
                                >
                                  {getStatusIcon(item.status)}
                                  {getStatusLabel(item.status, t)}
                                </span>
                              </div>

                              {expanded && (
                                <div className="border-t border-blue-100 bg-white px-4 pb-4 pt-3 space-y-3">
                                  {isAutomated ? (
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                                          <div className="text-gray-400">Run ID</div>
                                          <div className="mt-1 break-all font-medium text-gray-700">
                                            {item.automationRunId ?? "—"}
                                          </div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                                          <div className="text-gray-400">Navigateur</div>
                                          <div className="mt-1 font-medium text-gray-700">
                                            {item.browser ?? "—"}
                                          </div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                                          <div className="text-gray-400">Mode</div>
                                          <div className="mt-1 font-medium text-gray-700">
                                            {item.executionMode ?? "—"}
                                          </div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                                          <div className="text-gray-400">Durée</div>
                                          <div className="mt-1 font-medium text-gray-700">
                                            {typeof item.duration === "number"
                                              ? `${item.duration} ms`
                                              : "—"}
                                          </div>
                                        </div>
                                      </div>

                                      {item.error && (
                                        <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                                          <div className="mb-1 text-xs font-semibold text-red-700">
                                            Détail de l’échec
                                          </div>
                                          <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs text-red-600">
                                            {item.error}
                                          </pre>
                                        </div>
                                      )}

                                      <div className="flex flex-wrap gap-2">
                                        <ArtifactLink
                                          href={item.screenshotUrl}
                                          label="Capture"
                                          icon={<ExternalLink size={12} />}
                                        />
                                        <ArtifactLink
                                          href={item.traceUrl}
                                          label="Trace"
                                          icon={<FileText size={12} />}
                                        />
                                        <ArtifactLink
                                          href={item.executionReportUrl}
                                          label="Rapport"
                                          icon={<FileText size={12} />}
                                        />
                                        <ArtifactLink
                                          href={item.artifactsZipUrl}
                                          label="Archive ZIP"
                                          icon={<Archive size={12} />}
                                        />
                                      </div>

                                      {!item.screenshotUrl &&
                                        !item.traceUrl &&
                                        !item.executionReportUrl &&
                                        !item.artifactsZipUrl && (
                                          <p className="text-xs text-gray-400">
                                            Les artefacts seront disponibles à la fin de l’exécution.
                                          </p>
                                        )}
                                    </div>
                                  ) : !item.stepResults?.length ? (
                                    <p className="text-xs text-gray-400">
                                      {t("execution.testCases.noSteps")}
                                    </p>
                                  ) : (
                                    item.stepResults.map((step) => (
                                      <div
                                        key={step.id}
                                        className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                                      >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                          <div className="min-w-0">
                                            <span className="text-xs font-bold text-gray-400">
                                              {t("execution.testCases.step")} {step.testStep.stepOrder}
                                            </span>

                                            <p className="text-sm text-gray-700 mt-0.5">
                                              {step.testStep.action}
                                            </p>

                                            {step.testStep.expected && (
                                              <p className="text-xs text-gray-400 mt-1">
                                                {t("execution.testCases.expected")}: {step.testStep.expected}
                                              </p>
                                            )}
                                          </div>

                                          <span
                                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${getStatusBadge(
                                              step.status,
                                            )}`}
                                          >
                                            {getStatusIcon(step.status)}
                                            {getStatusLabel(step.status, t)}
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                          {stepStatuses.map((status) => (
                                            <button
                                              key={status}
                                              type="button"
                                              disabled={
                                                savingStepId ===
                                                step.testStep.id
                                              }
                                              onClick={() =>
                                                handleUpdateStep(
                                                  item.id,
                                                  step.testStep.id,
                                                  status,
                                                )
                                              }
                                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50 transition-colors ${getStatusBtnClass(
                                                status,
                                              )}`}
                                            >
                                              {getStatusIcon(status)}
                                              {getStatusLabel(status, t)}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}