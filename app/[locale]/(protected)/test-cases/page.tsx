/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchProjects, setSelectedProject } from "@/lib/slices/projectSlice";
import {
  clearTestSuites,
  createTestSuite,
  deleteTestSuite,
  duplicateTestSuite,
  fetchTestSuites,
  setSelectedSuite,
  updateTestSuite,
} from "@/lib/slices/testSuiteSlice";
import {
  clearTestCases,
  createTestCase,
  deleteTestCase,
  duplicateTestCase,
  fetchTestCases,
  runTestCaseAutomationThunk,
  TestCase,
  TestStep,
  updateTestCase,
} from "@/lib/slices/testCaseSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Copy,
  Pencil,
  Trash2,
  ArrowRightLeft,
  AlertTriangle,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  X,
  FlaskConical,
  Layers,
  FolderKanban,
  PlayCircle,
  MonitorPlay,
  Terminal,
  LoaderCircle,
  CheckCircle2,
  RefreshCcw,
  Save,
  Clock3,
  ExternalLink,
  Download,
  Camera,
  FileText,
  Archive,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "@/hooks/useTranslation";
import {
  cancelCodegenSession,
  getCodegenSessionStatus,
  importCodegenSession,
  startCodegenSession,
  type CodegenSessionStatus,
} from "@/lib/codegen-api";
import type { AutomationRunResult } from "@/lib/testcase-api";

type StepForm = { action: string; expected: string };

const StepBlock = ({
  steps,
  onChange,
  onAdd,
  onRemove,
  t,
}: {
  steps: StepForm[];
  onChange: (i: number, f: "action" | "expected", v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {t("testCases.stepsLabel")}
      </span>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
      >
        <Plus size={12} /> {t("modals.createTestCase.addStep")}
      </button>
    </div>
    {steps.map((step, i) => (
      <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400">
            {t("modals.createTestCase.stepNumber", { number: i + 1 })}
          </span>
          {steps.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <textarea
          placeholder={t("modals.createTestCase.stepAction")}
          value={step.action}
          onChange={(e) => onChange(i, "action", e.target.value)}
          className={inputCls}
          rows={2}
        />
        <textarea
          placeholder={t("modals.createTestCase.stepExpected")}
          value={step.expected}
          onChange={(e) => onChange(i, "expected", e.target.value)}
          className={inputCls}
          rows={2}
        />
      </div>
    ))}
  </div>
);

/* ─── helpers ─── */
function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-amber-100 text-amber-700 border border-amber-200",
    READY: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    DEPRECATED: "bg-gray-100 text-gray-500 border border-gray-200",
  };
  const labelMap: Record<string, string> = {
    DRAFT: t("testCases.status.DRAFT"),
    READY: t("testCases.status.READY"),
    DEPRECATED: t("testCases.status.DEPRECATED"),
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {labelMap[status] ?? status}
    </span>
  );
}

function PriorityBadge({ priority, t }: { priority: string; t: (key: string) => string }) {
  const map: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700 border border-red-200",
    HIGH: "bg-orange-100 text-orange-700 border border-orange-200",
    MEDIUM: "bg-blue-100 text-blue-700 border border-blue-200",
    LOW: "bg-gray-100 text-gray-500 border border-gray-200",
  };
  const labelMap: Record<string, string> = {
    CRITICAL: t("testCases.priority.CRITICAL"),
    HIGH: t("testCases.priority.HIGH"),
    MEDIUM: t("testCases.priority.MEDIUM"),
    LOW: t("testCases.priority.LOW"),
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[priority] ?? "bg-gray-100 text-gray-600"}`}
    >
      {labelMap[priority] ?? priority}
    </span>
  );
}

function IconBtn({
  onClick,
  title,
  disabled,
  className,
  children,
}: {
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded-lg border border-gray-200 text-gray-400 transition-colors disabled:opacity-40 ${className ?? "hover:text-gray-700 hover:border-gray-300"}`}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  onClose,
  title,
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition";
const selectCls = inputCls;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const getActionErrorMessage = (result: any, fallback: string) => {
  if (typeof result?.payload === "string") return result.payload;
  if (typeof result?.payload?.message === "string") return result.payload.message;
  if (typeof result?.error?.message === "string") return result.error.message;
  return fallback;
};

const getResponseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (typeof data?.message === "string") return data.message;
  } catch {
    // Ignore JSON parsing errors and return fallback.
  }

  return fallback;
};


function formatAutomationDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "—";
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }

  const seconds = durationMs / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  return `${minutes} min ${remainingSeconds} s`;
}

function formatAutomationDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR");
}

function AutomationAssetLink({
  href,
  label,
  icon,
  download,
}: {
  href: string | null | undefined;
  label: string;
  icon: React.ReactNode;
  download?: boolean;
}) {
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      download={download}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
    >
      {icon}
      {label}
      {!download && <ExternalLink size={12} />}
    </a>
  );
}

function AutomationResultPanel({
  result,
}: {
  result: AutomationRunResult;
}) {
  const isPassed = result.status === "PASSED";
  const isError = result.status === "ERROR";
  const failure = result.failureDetails;

  const statusContainerClass = isPassed
    ? "border-emerald-200 bg-emerald-50"
    : isError
      ? "border-amber-200 bg-amber-50"
      : "border-red-200 bg-red-50";

  const statusTextClass = isPassed
    ? "text-emerald-800"
    : isError
      ? "text-amber-800"
      : "text-red-800";

  const shortMessage =
    failure?.message ||
    result.error?.split("\n").find((line) => line.trim()) ||
    (isPassed
      ? "Le scénario Playwright a été exécuté avec succès."
      : "Le scénario Playwright n’a pas abouti.");

  const screenshotUrl =
    failure?.screenshotUrl || result.screenshotUrl;
  const traceUrl =
    failure?.traceUrl || result.traceUrl;
  const executionReportUrl =
    failure?.executionReportUrl ||
    result.executionReportUrl;
  const artifactsZipUrl =
    failure?.artifactsZipUrl ||
    result.artifactsZipUrl;

  return (
    <div className="m-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div
        className={`border-b px-4 py-4 ${statusContainerClass}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {isPassed ? (
              <CheckCircle2
                size={22}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
            ) : (
              <AlertTriangle
                size={22}
                className={`mt-0.5 shrink-0 ${
                  isError
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              />
            )}

            <div>
              <div
                className={`text-sm font-bold ${statusTextClass}`}
              >
                Résultat Playwright : {result.status}
              </div>
              <p
                className={`mt-1 text-xs leading-5 ${statusTextClass}`}
              >
                {shortMessage}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 font-semibold">
              {result.mode === "HEADED"
                ? "VISUEL"
                : "ARRIÈRE-PLAN"}
            </span>
            <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 font-semibold">
              {result.browser}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/80 px-2.5 py-1 font-semibold">
              <Clock3 size={12} />
              {formatAutomationDuration(
                result.durationMs
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            {
              label: "Total",
              value: result.summary.total,
            },
            {
              label: "Réussis",
              value: result.summary.passed,
            },
            {
              label: "Échoués",
              value: result.summary.failed,
            },
            {
              label: "Erreurs",
              value: result.summary.errors,
            },
            {
              label: "Ignorés",
              value: result.summary.skipped,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {item.label}
              </p>
              <p className="mt-1 text-lg font-bold text-gray-800">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {!isPassed && failure && (
          <div className="space-y-3 rounded-xl border border-red-100 bg-red-50/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-red-700">
                Diagnostic ciblé
              </span>

              {failure.sourceLine !== null && (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                  Ligne {failure.sourceLine}
                </span>
              )}

              {failure.sourceColumn !== null && (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                  Colonne {failure.sourceColumn}
                </span>
              )}
            </div>

            {failure.locator && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Locator
                </p>
                <code className="mt-1 block overflow-x-auto rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-slate-700">
                  {failure.locator}
                </code>
              </div>
            )}

            {(failure.expectedResult ||
              failure.actualResult) && (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-emerald-100 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                    Résultat attendu
                  </p>
                  <p className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-gray-700">
                    {failure.expectedResult || "—"}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-red-100 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
                    Résultat obtenu
                  </p>
                  <p className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-gray-700">
                    {failure.actualResult || "—"}
                  </p>
                </div>
              </div>
            )}

            {failure.sourceSnippet && (
              <details className="rounded-xl border border-gray-200 bg-white">
                <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-gray-700">
                  Voir la ligne de code concernée
                </summary>
                <pre className="max-h-52 overflow-auto border-t border-gray-100 bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                  <code>{failure.sourceSnippet}</code>
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <AutomationAssetLink
            href={screenshotUrl}
            label="Voir la capture"
            icon={<Camera size={13} />}
          />
          <AutomationAssetLink
            href={traceUrl}
            label="Télécharger la trace"
            icon={<Download size={13} />}
            download
          />
          <AutomationAssetLink
            href={executionReportUrl}
            label="Rapport technique"
            icon={<FileText size={13} />}
          />
          <AutomationAssetLink
            href={artifactsZipUrl}
            label="Artefacts ZIP"
            icon={<Archive size={13} />}
            download
          />
        </div>

        <details className="rounded-xl border border-gray-100 bg-gray-50">
          <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-gray-600">
            Informations d’exécution
          </summary>

          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 px-3 py-3 text-xs text-gray-600 sm:grid-cols-2">
            <div>
              <span className="font-semibold text-gray-500">
                Début :
              </span>{" "}
              {formatAutomationDate(result.startedAt)}
            </div>
            <div>
              <span className="font-semibold text-gray-500">
                Fin :
              </span>{" "}
              {formatAutomationDate(result.finishedAt)}
            </div>
            <div className="sm:col-span-2">
              <span className="font-semibold text-gray-500">
                Run ID :
              </span>{" "}
              <span className="break-all font-mono">
                {result.runId}
              </span>
            </div>

            {result.logs?.length > 0 && (
              <div className="sm:col-span-2">
                <p className="font-semibold text-gray-500">
                  Journal synthétique
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {result.logs.map((log, index) => (
                    <li
                      key={`${result.runId}-log-${index}`}
                      className="break-words"
                    >
                      {log}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}

function ModalFooter({
  onCancel,
  loading,
  label,
  t,
}: {
  onCancel: () => void;
  loading: boolean;
  label: string;
  t: (key: string) => string;
}) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        <X size={13} /> {t("modals.common.cancel")}
      </button>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
      >
        {loading ? t("modals.common.saving") : label}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function TestCasesPage() {
  const { t } = useTranslation("testCases");
  const dispatch = useAppDispatch();
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  const { projects, loading: loadingProjects, selectedProject, error: projectError } = useAppSelector(
    (s) => s.projects
  );
  const {
    testSuites,
    selectedSuite,
    loading: loadingSuites,
    creating: creatingSuite,
    updating: updatingSuite,
    deleting: deletingSuite,
    error: suiteError,
  } = useAppSelector((s) => s.testSuites);

  const {
    loading: loadingTestCases,
    creating,
    updating,
    deleting,
    runningAutomationId,
    runningAutomationMode,
    automationResults,
    error: testCaseError,
    total,
    totalPages,
  } = useAppSelector((s) => s.testCases);
  const testCaseList = useSelector((s: RootState) => s.testCases.testCases);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState(false);
  const [collapsedSuites, setCollapsedSuites] = useState(false);

  /* suite modals */
  const [isCreateSuiteOpen, setIsCreateSuiteOpen] = useState(false);
  const [suiteName, setSuiteName] = useState("");
  const [suiteDescription, setSuiteDescription] = useState("");
  const [suiteFormError, setSuiteFormError] = useState("");
  const [editSuiteFormError, setEditSuiteFormError] = useState("");
  const [editingSuite, setEditingSuite] = useState<{
    id: string;
    name: string;
    description?: string | null;
  } | null>(null);
  const [editSuiteName, setEditSuiteName] = useState("");
  const [editSuiteDescription, setEditSuiteDescription] = useState("");

  /* test case modals */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createExpected, setCreateExpected] = useState("");
  const [createStatus, setCreateStatus] = useState<"DRAFT" | "READY" | "DEPRECATED">("DRAFT");
  const [createPriority, setCreatePriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">(
    "MEDIUM"
  );
  const [createSteps, setCreateSteps] = useState<StepForm[]>([{ action: "", expected: "" }]);

  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editExpected, setEditExpected] = useState("");
  const [editStatus, setEditStatus] = useState<"DRAFT" | "READY" | "DEPRECATED">("DRAFT");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">(
    "MEDIUM"
  );
  const [editSteps, setEditSteps] = useState<StepForm[]>([{ action: "", expected: "" }]);
  const [editAutomationFramework, setEditAutomationFramework] = useState<"" | "PLAYWRIGHT">("");
  const [editAutomationCode, setEditAutomationCode] = useState("");
  const [testCaseFormError, setTestCaseFormError] = useState("");
  const [editTestCaseFormError, setEditTestCaseFormError] = useState("");

  /* playwright recorder modal */
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordingTestCase, setRecordingTestCase] = useState<TestCase | null>(null);
  const [recordUrl, setRecordUrl] = useState("");
  const [isStartingCodegen, setIsStartingCodegen] = useState(false);
  const [isImportingCodegen, setIsImportingCodegen] = useState(false);
  const [isCancellingCodegen, setIsCancellingCodegen] = useState(false);
  const [codegenSessionId, setCodegenSessionId] = useState<string | null>(null);
  const [codegenStatus, setCodegenStatus] = useState<CodegenSessionStatus | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [recordError, setRecordError] = useState("");

  /* move test case modal */
  const [movingTestCase, setMovingTestCase] = useState<TestCase | null>(null);
  const [targetSuiteId, setTargetSuiteId] = useState("");
  const [isMovingTestCase, setIsMovingTestCase] = useState(false);
  const [moveDuplicateWarning, setMoveDuplicateWarning] = useState(false);
  const [moveError, setMoveError] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 500);

  /* ── effects ── */
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedProject?.id) {
      dispatch(clearTestSuites());
      dispatch(clearTestCases());
      return;
    }
    dispatch(fetchTestSuites(selectedProject.id));
    dispatch(clearTestCases());
  }, [dispatch, selectedProject?.id]);

  useEffect(() => {
    if (!selectedSuite?.id) {
      dispatch(clearTestCases());
      return;
    }
    dispatch(
      fetchTestCases({
        suiteId: selectedSuite.id,
        status: statusFilter,
        priority: priorityFilter,
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: itemsPerPage,
      })
    );
  }, [
    dispatch,
    selectedSuite?.id,
    statusFilter,
    priorityFilter,
    debouncedSearch,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (
      !isRecordModalOpen ||
      !codegenSessionId ||
      codegenStatus !== "RUNNING"
    ) {
      return;
    }

    let disposed = false;

    const refreshCodegenStatus = async () => {
      try {
        const session = await getCodegenSessionStatus(codegenSessionId);

        if (disposed) return;

        setCodegenStatus(session.status);

        if (session.code) {
          setGeneratedCode(session.code);
        }

        if (session.error) {
          setRecordError(session.error);
        }
      } catch (error) {
        if (disposed) return;

        setRecordError(
          error instanceof Error
            ? error.message
            : "Impossible de récupérer l’état de l’enregistrement."
        );
      }
    };

    void refreshCodegenStatus();

    const intervalId = window.setInterval(() => {
      void refreshCodegenStatus();
    }, 1500);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [isRecordModalOpen, codegenSessionId, codegenStatus]);

  const resetPage = () => {
    setCurrentPage(1);
    setExpandedId(null);
  };

  const globalError = projectError || suiteError || testCaseError;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await fullscreenRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) {
      console.error(e);
    }
  };

  /* ── suite handlers ── */
  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject?.id || !suiteName.trim()) return;

    setSuiteFormError("");

    const r = await dispatch(
      createTestSuite({
        projectId: selectedProject.id,
        name: suiteName.trim(),
        description: suiteDescription.trim() || undefined,
      })
    );

    if (createTestSuite.fulfilled.match(r)) {
      setIsCreateSuiteOpen(false);
      setSuiteName("");
      setSuiteDescription("");
      setSuiteFormError("");
      dispatch(fetchTestSuites(selectedProject.id));
    } else {
      setSuiteFormError(
        getActionErrorMessage(
          r,
          "Une suite avec ce nom existe déjà dans ce projet."
        )
      );
    }
  };

  const handleUpdateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSuite || !editSuiteName.trim() || !selectedProject?.id) return;

    setEditSuiteFormError("");

    const r = await dispatch(
      updateTestSuite({
        suiteId: editingSuite.id,
        name: editSuiteName.trim(),
        description: editSuiteDescription.trim() || undefined,
      })
    );

    if (updateTestSuite.fulfilled.match(r)) {
      setEditingSuite(null);
      setEditSuiteFormError("");
      dispatch(fetchTestSuites(selectedProject.id));
    } else {
      setEditSuiteFormError(
        getActionErrorMessage(
          r,
          "Une suite avec ce nom existe déjà dans ce projet."
        )
      );
    }
  };

  const handleDeleteSuite = async (id: string) => {
    if (!selectedProject?.id || !window.confirm(t("suites.deleteConfirm"))) return;
    const r = await dispatch(deleteTestSuite(id));
    if (deleteTestSuite.fulfilled.match(r)) {
      dispatch(fetchTestSuites(selectedProject.id));
      dispatch(clearTestCases());
    }
  };

  const handleDuplicateSuite = async (id: string) => {
    if (!selectedProject?.id) return;
    const r = await dispatch(duplicateTestSuite(id));
    if (duplicateTestSuite.fulfilled.match(r)) dispatch(fetchTestSuites(selectedProject.id));
  };

  /* ── test case handlers ── */
  const resetCreate = () => {
    setCreateTitle("");
    setCreateDescription("");
    setCreateExpected("");
    setCreateStatus("DRAFT");
    setCreatePriority("MEDIUM");
    setCreateSteps([{ action: "", expected: "" }]);
    setTestCaseFormError("");
  };

  const refetchCases = () => {
    if (!selectedSuite?.id) return;
    dispatch(
      fetchTestCases({
        suiteId: selectedSuite.id,
        status: statusFilter,
        priority: priorityFilter,
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: itemsPerPage,
      })
    );
  };

  const handleCreateTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuite?.id || !createTitle.trim()) return;

    setTestCaseFormError("");

    const steps = createSteps
      .map((s) => ({ action: s.action.trim(), expected: s.expected.trim() || undefined }))
      .filter((s) => s.action);
    const r = await dispatch(
      createTestCase({
        suiteId: selectedSuite.id,
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        expected: createExpected.trim() || undefined,
        status: createStatus,
        priority: createPriority,
        steps: steps.length ? steps : undefined,
      })
    );
    if (createTestCase.fulfilled.match(r)) {
      setIsCreateOpen(false);
      resetCreate();
      refetchCases();
    } else {
      setTestCaseFormError(
        getActionErrorMessage(
          r,
          "Un cas de test avec ce titre existe déjà dans cette suite."
        )
      );
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!selectedSuite?.id) return;
    const r = await dispatch(duplicateTestCase({ suiteId: selectedSuite.id, testCaseId: id }));
    if (duplicateTestCase.fulfilled.match(r)) refetchCases();
  };

  const openEditModal = (tc: TestCase) => {
    setEditTestCaseFormError("");
    setEditingTestCase(tc);
    setEditTitle(tc.title);
    setEditDescription(tc.description ?? "");
    setEditExpected(tc.expected ?? "");
    setEditStatus(tc.status);
    setEditPriority(tc.priority);
    setEditSteps(
      tc.steps?.length
        ? tc.steps.map((s) => ({ action: s.action ?? "", expected: s.expected ?? "" }))
        : [{ action: "", expected: "" }]
    );
    setEditAutomationFramework(tc.automationFramework === "PLAYWRIGHT" ? "PLAYWRIGHT" : "");
    setEditAutomationCode(tc.automationCode ?? "");
  };

  const closeEditModal = () => {
    setEditingTestCase(null);
    setEditTitle("");
    setEditDescription("");
    setEditExpected("");
    setEditStatus("DRAFT");
    setEditPriority("MEDIUM");
    setEditSteps([{ action: "", expected: "" }]);
    setEditAutomationFramework("");
    setEditAutomationCode("");
    setEditTestCaseFormError("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuite?.id || !editingTestCase || !editTitle.trim()) return;

    setEditTestCaseFormError("");

    const steps = editSteps
      .map((s) => ({ action: s.action.trim(), expected: s.expected.trim() || undefined }))
      .filter((s) => s.action);
    const r = await dispatch(
      updateTestCase({
        suiteId: selectedSuite.id,
        testCaseId: editingTestCase.id,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        expected: editExpected.trim() || undefined,
        status: editStatus,
        priority: editPriority,
        steps: steps.length ? steps : undefined,
        automationFramework: editAutomationCode.trim() ? "PLAYWRIGHT" : null,
        automationCode: editAutomationCode.trim() || null,
      })
    );
    if (updateTestCase.fulfilled.match(r)) {
      closeEditModal();
      refetchCases();
    } else {
      setEditTestCaseFormError(
        getActionErrorMessage(
          r,
          "Un cas de test avec ce titre existe déjà dans cette suite."
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!selectedSuite?.id || !window.confirm(t("testCases.deleteConfirm"))) return;
    const r = await dispatch(deleteTestCase({ suiteId: selectedSuite.id, testCaseId: id }));
    if (deleteTestCase.fulfilled.match(r)) refetchCases();
  };

  const handleRunAutomation = async (tc: TestCase) => {
    if (!selectedSuite?.id) return;

    await dispatch(
      runTestCaseAutomationThunk({
        suiteId: selectedSuite.id,
        testCaseId: tc.id,
        headed: false,
      })
    );
  };

  const handleVisualRunAutomation = async (tc: TestCase) => {
    if (!selectedSuite?.id) return;

    await dispatch(
      runTestCaseAutomationThunk({
        suiteId: selectedSuite.id,
        testCaseId: tc.id,
        headed: true,
        slowMo: 500,
      })
    );
  };

  const resetCodegenSession = () => {
    setCodegenSessionId(null);
    setCodegenStatus(null);
    setGeneratedCode("");
    setRecordError("");
    setIsStartingCodegen(false);
    setIsImportingCodegen(false);
    setIsCancellingCodegen(false);
  };

  const openRecordModal = (tc?: TestCase) => {
    setRecordingTestCase(tc ?? null);
    resetCodegenSession();

    const urlFromCode = tc?.automationCode?.match(
      /page\.goto\(['"`]([^'"`]+)['"`]\)/
    )?.[1];

    setRecordUrl(urlFromCode || "");
    setIsRecordModalOpen(true);
  };

  const closeRecordModal = async () => {
    if (
      isStartingCodegen ||
      isImportingCodegen ||
      isCancellingCodegen
    ) {
      return;
    }

    if (codegenStatus === "RUNNING" && codegenSessionId) {
      const shouldCancel = window.confirm(
        "Un enregistrement est encore en cours. Voulez-vous l’annuler et fermer la fenêtre ?"
      );

      if (!shouldCancel) return;

      try {
        setIsCancellingCodegen(true);
        await cancelCodegenSession(codegenSessionId);
      } catch (error) {
        console.error(error);
      } finally {
        setIsCancellingCodegen(false);
      }
    }

    setIsRecordModalOpen(false);
    setRecordingTestCase(null);
    setRecordUrl("");
    resetCodegenSession();
  };

  const startPlaywrightCodegen = async () => {
    if (!recordUrl.trim() || isStartingCodegen) return;

    try {
      setIsStartingCodegen(true);
      setRecordError("");
      setGeneratedCode("");

      const session = await startCodegenSession({
        url: recordUrl.trim(),
        testCaseId: recordingTestCase?.id,
      });

      setCodegenSessionId(session.sessionId);
      setCodegenStatus(session.status);
    } catch (error) {
      console.error(error);
      setRecordError(
        error instanceof Error
          ? error.message
          : "Impossible de démarrer Playwright Codegen."
      );
    } finally {
      setIsStartingCodegen(false);
    }
  };

  const cancelActiveCodegen = async () => {
    if (!codegenSessionId || codegenStatus !== "RUNNING") return;

    try {
      setIsCancellingCodegen(true);
      setRecordError("");

      const result = await cancelCodegenSession(codegenSessionId);
      setCodegenStatus(result.status);
    } catch (error) {
      console.error(error);
      setRecordError(
        error instanceof Error
          ? error.message
          : "Impossible d’annuler l’enregistrement Playwright."
      );
    } finally {
      setIsCancellingCodegen(false);
    }
  };

  const restartCodegenRecording = () => {
    resetCodegenSession();
  };

  const copyGeneratedCode = async () => {
    if (!generatedCode) return;

    try {
      await navigator.clipboard.writeText(generatedCode);
    } catch {
      setRecordError(
        "Impossible de copier automatiquement le code dans le presse-papiers."
      );
    }
  };

  const importGeneratedCode = async () => {
    if (
      !codegenSessionId ||
      codegenStatus !== "COMPLETED" ||
      !recordingTestCase
    ) {
      return;
    }

    try {
      setIsImportingCodegen(true);
      setRecordError("");

      await importCodegenSession(
        codegenSessionId,
        recordingTestCase.id
      );

      const importedTestCaseId = recordingTestCase.id;

      setIsRecordModalOpen(false);
      setRecordingTestCase(null);
      setRecordUrl("");
      resetCodegenSession();

      setExpandedId(importedTestCaseId);
      refetchCases();
    } catch (error) {
      console.error(error);
      setRecordError(
        error instanceof Error
          ? error.message
          : "Impossible d’importer le code Playwright dans le cas de test."
      );
    } finally {
      setIsImportingCodegen(false);
    }
  };

  const closeMoveModal = () => {
    setMovingTestCase(null);
    setTargetSuiteId("");
    setMoveDuplicateWarning(false);
    setMoveError("");
    setIsMovingTestCase(false);
  };

  const openMoveModal = (tc: TestCase) => {
    setMovingTestCase(tc);
    setTargetSuiteId("");
    setMoveDuplicateWarning(false);
    setMoveError("");
  };

  const fetchTargetSuiteTestCases = async (suiteId: string) => {
    const response = await fetch(`${API_BASE}/suites/${suiteId}/testcases/by-pagination`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "ALL",
        priority: "ALL",
        page: 1,
        limit: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error("Unable to verify target suite test cases");
    }

    const data = await response.json();
    return Array.isArray(data.items) ? data.items : [];
  };

  const executeMoveTestCase = async (skipDuplicateCheck = false) => {
    if (!selectedSuite?.id || !movingTestCase || !targetSuiteId) return;

    try {
      setIsMovingTestCase(true);
      setMoveError("");

      if (!skipDuplicateCheck) {
        const targetSuiteTestCases = await fetchTargetSuiteTestCases(targetSuiteId);
        const sameTitleExists = targetSuiteTestCases.some(
          (tc: TestCase) =>
            tc.id !== movingTestCase.id &&
            tc.title.trim().toLowerCase() === movingTestCase.title.trim().toLowerCase()
        );

        if (sameTitleExists) {
          setMoveError(
            "Impossible de déplacer ce cas : la suite destination contient déjà un cas de test avec le même titre."
          );
          return;
        }
      }

      const response = await fetch(
        `${API_BASE}/suites/${selectedSuite.id}/testcases/${movingTestCase.id}/move`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetSuiteId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(
            response,
            "Impossible de déplacer ce cas de test. Veuillez réessayer."
          )
        );
      }

      closeMoveModal();
      refetchCases();
    } catch (error) {
      console.error(error);
      setMoveError(
        error instanceof Error
          ? error.message
          : "Impossible de déplacer ce cas de test. Veuillez réessayer."
      );
    } finally {
      setIsMovingTestCase(false);
    }
  };

  /* ── steps helpers ── */
  const stepChange =
    (setter: React.Dispatch<React.SetStateAction<StepForm[]>>) =>
    (i: number, f: "action" | "expected", v: string) =>
      setter((prev) => prev.map((s, idx) => (idx === i ? { ...s, [f]: v } : s)));
  const addStep =
    (setter: React.Dispatch<React.SetStateAction<StepForm[]>>) => () =>
      setter((p) => [...p, { action: "", expected: "" }]);
  const removeStep =
    (setter: React.Dispatch<React.SetStateAction<StepForm[]>>) => (i: number) =>
      setter((p) => p.filter((_, idx) => idx !== i));

  /* ── layout ── */
  const projectColCls = collapsedProjects
    ? "hidden"
    : isFullscreen
    ? "xl:col-span-2"
    : "xl:col-span-3";
  const suiteColCls = collapsedSuites ? "hidden" : isFullscreen ? "xl:col-span-3" : "xl:col-span-3";
  const casesColCls = (() => {
    if (collapsedProjects && collapsedSuites) return "xl:col-span-12";
    if (collapsedProjects) return "xl:col-span-9";
    if (collapsedSuites) return "xl:col-span-9";
    return isFullscreen ? "xl:col-span-7" : "xl:col-span-6";
  })();

  if (loadingProjects)
    return <div className="p-8 text-gray-400 text-sm">{t("suites.loading")}</div>;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          {isFullscreen ? (
            <>
              <Minimize2 size={14} /> {t("fullscreen.exit")}
            </>
          ) : (
            <>
              <Maximize2 size={14} /> {t("fullscreen.enter")}
            </>
          )}
        </button>
      </div>

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {t("errors.global")}
        </div>
      )}

      <div
        ref={fullscreenRef}
        className={isFullscreen ? "overflow-auto bg-gray-50 p-6 min-h-screen" : ""}
      >
        {isFullscreen && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-700">{t("fullscreen.view")}</h2>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-white transition-colors"
            >
              <Minimize2 size={14} /> {t("fullscreen.close")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* ── PROJECTS PANEL ── */}
          <section
            className={`min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${projectColCls}`}
          >
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <FolderKanban size={15} className="text-blue-500" />
              <h2 className="text-sm font-bold text-gray-700 flex-1">{t("projects.title")}</h2>
            </div>
            <div className="p-3 space-y-1.5">
              {projects.length === 0 ? (
                <p className="text-sm text-gray-400 px-2 py-3">{t("projects.empty")}</p>
              ) : (
                projects.map((project) => {
                  const active = selectedProject?.id === project.id;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => dispatch(setSelectedProject(project))}
                      className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                        active ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="text-sm font-medium truncate">{project.name}</div>
                      <div className={`text-xs mt-0.5 ${active ? "text-blue-100" : "text-gray-400"}`}>
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "—"}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* ── SUITES PANEL ── */}
          <section
            className={`relative min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${suiteColCls}`}
          >
            <button
              type="button"
              onClick={() => setCollapsedProjects((p) => !p)}
              className="absolute -left-4 top-10 z-20 hidden xl:flex items-center justify-center h-8 w-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-blue-600 transition-colors"
            >
              {collapsedProjects ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <Layers size={15} className="text-emerald-500" />
              <h2 className="text-sm font-bold text-gray-700 flex-1">{t("suites.title")}</h2>
              <button
                type="button"
                disabled={!selectedProject}
                onClick={() => {
                  setSuiteName("");
                  setSuiteDescription("");
                  setSuiteFormError("");
                  setIsCreateSuiteOpen(true);
                }}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-40 transition-colors"
              >
                <Plus size={12} /> {t("suites.new")}
              </button>
            </div>
            <div className="p-3 space-y-2">
              {!selectedProject ? (
                <p className="text-sm text-gray-400 px-2 py-3">{t("suites.selectProjectFirst")}</p>
              ) : loadingSuites ? (
                <p className="text-sm text-gray-400 px-2 py-3">{t("suites.loading")}</p>
              ) : testSuites.length === 0 ? (
                <p className="text-sm text-gray-400 px-2 py-3">{t("suites.empty")}</p>
              ) : (
                testSuites.map((suite) => {
                  const active = selectedSuite?.id === suite.id;
                  return (
                    <div
                      key={suite.id}
                      className={`rounded-xl border transition-colors ${
                        active
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                      }`}
                    >
                      <div className="px-3 pt-3 pb-2">
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {suite.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate">
                          {suite.description || t("suites.noDescription")}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 pb-3">
                        <IconBtn
                          onClick={() => dispatch(setSelectedSuite(suite))}
                          title={active ? t("suites.active") : t("suites.choose")}
                          className={
                            active
                              ? "border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-700"
                              : "hover:text-emerald-600 hover:border-emerald-200"
                          }
                        >
                          <CheckCheck size={13} />
                        </IconBtn>
                        <IconBtn
                          onClick={() => {
                            setEditingSuite(suite);
                            setEditSuiteName(suite.name);
                            setEditSuiteDescription(suite.description ?? "");
                            setEditSuiteFormError("");
                          }}
                          title={t("suites.edit")}
                          className="hover:text-orange-500 hover:border-orange-200"
                        >
                          <Pencil size={13} />
                        </IconBtn>
                        <IconBtn
                          onClick={() => handleDuplicateSuite(suite.id)}
                          title={t("suites.duplicate")}
                          className="hover:text-indigo-500 hover:border-indigo-200"
                        >
                          <Copy size={13} />
                        </IconBtn>
                        <IconBtn
                          onClick={() => handleDeleteSuite(suite.id)}
                          disabled={deletingSuite}
                          title={t("suites.delete")}
                          className="hover:text-red-500 hover:border-red-200"
                        >
                          <Trash2 size={13} />
                        </IconBtn>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ── TEST CASES PANEL ── */}
          <section
            className={`relative min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${casesColCls}`}
          >
            <button
              type="button"
              onClick={() => setCollapsedSuites((p) => !p)}
              className="absolute -left-4 top-10 z-20 hidden xl:flex items-center justify-center h-8 w-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-blue-600 transition-colors"
            >
              {collapsedSuites ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* toolbar */}
            <div className="px-5 py-4 border-b border-gray-50 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <FlaskConical size={15} className="text-blue-500" />
                <h2 className="text-sm font-bold text-gray-700 flex-1 truncate">
                  {selectedSuite ? selectedSuite.name : t("testCases.title")}
                </h2>
                <button
                  type="button"
                  disabled={!selectedSuite}
                  onClick={() => {
                    resetCreate();
                    setIsCreateOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 transition-colors"
                >
                  <Plus size={12} /> {t("testCases.new")}
                </button>

                <button
                  type="button"
                  disabled={!selectedSuite}
                  onClick={() => openRecordModal()}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 transition-colors"
                >
                  <Terminal size={12} /> Record scénario
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder={t("testCases.search")}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    resetPage();
                  }}
                  disabled={!selectedSuite}
                  className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 disabled:opacity-40"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    resetPage();
                  }}
                  disabled={!selectedSuite}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-600 disabled:opacity-40 focus:outline-none"
                >
                  <option value="ALL">{t("testCases.statusFilter")}</option>
                  <option value="DRAFT">{t("testCases.status.DRAFT")}</option>
                  <option value="READY">{t("testCases.status.READY")}</option>
                  <option value="DEPRECATED">{t("testCases.status.DEPRECATED")}</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    resetPage();
                  }}
                  disabled={!selectedSuite}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-600 disabled:opacity-40 focus:outline-none"
                >
                  <option value="ALL">{t("testCases.priorityFilter")}</option>
                  <option value="LOW">{t("testCases.priority.LOW")}</option>
                  <option value="MEDIUM">{t("testCases.priority.MEDIUM")}</option>
                  <option value="HIGH">{t("testCases.priority.HIGH")}</option>
                  <option value="CRITICAL">{t("testCases.priority.CRITICAL")}</option>
                </select>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    resetPage();
                  }}
                  disabled={!selectedSuite}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-600 disabled:opacity-40 focus:outline-none"
                >
                  <option value={5}>{t("testCases.perPage", { count: 5 })}</option>
                  <option value={10}>{t("testCases.perPage", { count: 10 })}</option>
                  <option value={20}>{t("testCases.perPage", { count: 20 })}</option>
                </select>
              </div>
            </div>

            {/* test case list */}
            <div className="p-4 space-y-3">
              {!selectedSuite ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  {t("testCases.selectSuiteFirst")}
                </p>
              ) : loadingTestCases ? (
                <p className="text-sm text-gray-400 py-6 text-center">{t("testCases.loading")}</p>
              ) : testCaseList.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">{t("testCases.empty")}</p>
              ) : (
                <>
                  {testCaseList.map((tc, idx) => {
                    const expanded = expandedId === tc.id;
                    return (
                      <div
                        key={tc.id}
                        className={`rounded-xl border transition-colors ${
                          expanded
                            ? "border-blue-200 bg-blue-50/30"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-3 p-4">
                          <span className="mt-1 text-xs font-bold text-gray-300 w-5 text-center shrink-0">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-800 truncate">
                              {tc.title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {tc.description || t("testCases.noDescription")}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <StatusBadge status={tc.status} t={t} />
                              <PriorityBadge priority={tc.priority} t={t} />
                              {tc.sourceType && (
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    tc.automationFramework === "PLAYWRIGHT" && tc.automationCode
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-purple-100 text-purple-700"
                                  }`}
                                >
                                  {tc.automationFramework === "PLAYWRIGHT" && tc.automationCode
                                    ? "Automatisé"
                                    : tc.sourceType === "AI_GENERATED"
                                      ? "IA"
                                      : "Manuel"}
                                </span>
                              )}
                              {tc.generationMode && (
                                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                                  {tc.generationMode === "RULE_BASED" ? "Rules" : tc.generationMode}
                                </span>
                              )}
                              {tc.automationFramework === "PLAYWRIGHT" && (
                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                  Playwright
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {t("testCases.stepsCount", { count: tc.steps?.length || 0 })}
                              </span>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400">
                                {new Date(tc.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <IconBtn
                              onClick={() => setExpandedId(expanded ? null : tc.id)}
                              title={expanded ? t("testCases.collapse") : t("testCases.expand")}
                              className="hover:text-blue-600 hover:border-blue-200"
                            >
                              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </IconBtn>
                            <IconBtn
                              onClick={() => openEditModal(tc)}
                              title={t("testCases.edit")}
                              className="hover:text-orange-500 hover:border-orange-200"
                            >
                              <Pencil size={13} />
                            </IconBtn>
                            <IconBtn
                              onClick={() => handleDuplicate(tc.id)}
                              title={t("testCases.duplicate")}
                              className="hover:text-indigo-500 hover:border-indigo-200"
                            >
                              <Copy size={13} />
                            </IconBtn>
                            <IconBtn
                              onClick={() => openMoveModal(tc)}
                              title="Déplacer"
                              className="hover:text-blue-600 hover:border-blue-200"
                            >
                              <ArrowRightLeft size={13} />
                            </IconBtn>
                            {tc.automationFramework === "PLAYWRIGHT" && tc.automationCode && (
                              <>
                                <IconBtn
                                  onClick={() => handleRunAutomation(tc)}
                                  disabled={runningAutomationId === tc.id}
                                  title="Exécuter Playwright en arrière-plan"
                                  className="hover:text-emerald-600 hover:border-emerald-200"
                                >
                                  <PlayCircle size={13} />
                                </IconBtn>

                                <IconBtn
                                  onClick={() => handleVisualRunAutomation(tc)}
                                  disabled={runningAutomationId === tc.id}
                                  title="Visualiser l’exécution Playwright"
                                  className="hover:text-violet-600 hover:border-violet-200"
                                >
                                  <MonitorPlay size={13} />
                                </IconBtn>
                              </>
                            )}
                            <IconBtn
                              onClick={() => openRecordModal(tc)}
                              title="Record scénario"
                              className="hover:text-slate-800 hover:border-slate-300"
                            >
                              <Terminal size={13} />
                            </IconBtn>
                            <IconBtn
                              onClick={() => handleDelete(tc.id)}
                              disabled={deleting}
                              title={t("testCases.delete")}
                              className="hover:text-red-500 hover:border-red-200"
                            >
                              <Trash2 size={13} />
                            </IconBtn>
                          </div>
                        </div>

                        {expanded && (
                          <div className="border-t border-blue-100 bg-white rounded-b-xl p-4 space-y-4">
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                  {t("testCases.descriptionLabel")}
                                </p>
                                <p className="text-sm text-gray-700">{tc.description || "—"}</p>
                              </div>
                              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                  {t("testCases.expectedLabel")}
                                </p>
                                <p className="text-sm text-gray-700">{tc.expected || "—"}</p>
                              </div>
                            </div>
                            {tc.steps?.length ? (
                              <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {t("testCases.stepsLabel")}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {t("testCases.updatedAt")}{" "}
                                    {new Date(tc.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-50/50">
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 w-10">
                                        {t("testCases.stepTable.number")}
                                      </th>
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">
                                        {t("testCases.stepTable.action")}
                                      </th>
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">
                                        {t("testCases.stepTable.expected")}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tc.steps.map((step: TestStep) => (
                                      <tr key={step.id} className="border-t border-gray-50">
                                        <td className="px-4 py-2 text-gray-400 text-xs">
                                          {step.stepOrder}
                                        </td>
                                        <td className="px-4 py-2 text-gray-700">{step.action}</td>
                                        <td className="px-4 py-2 text-gray-500">
                                          {step.expected || "—"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">{t("testCases.noSteps")}</p>
                            )}

                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                <div>
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Automatisation Playwright
                                  </span>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Code Playwright associé à ce cas de test
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {tc.automationCode && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigator.clipboard.writeText(tc.automationCode ?? "")
                                      }
                                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                      Copier
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => openRecordModal(tc)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    <Terminal size={13} />
                                    Record scénario
                                  </button>

                                  {tc.automationFramework === "PLAYWRIGHT" && tc.automationCode && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleRunAutomation(tc)}
                                        disabled={runningAutomationId === tc.id}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 transition-colors"
                                      >
                                        <PlayCircle size={13} />
                                        {runningAutomationId === tc.id &&
                                        runningAutomationMode === "HEADLESS"
                                          ? "Exécution..."
                                          : "Exécuter"}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleVisualRunAutomation(tc)}
                                        disabled={runningAutomationId === tc.id}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 transition-colors"
                                      >
                                        <MonitorPlay size={13} />
                                        {runningAutomationId === tc.id &&
                                        runningAutomationMode === "HEADED"
                                          ? "Visualisation..."
                                          : "Visualiser"}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="px-4 py-3 border-b border-gray-100 bg-white">
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-600">
                                    Source :{" "}
                                    {tc.automationFramework === "PLAYWRIGHT" && tc.automationCode
                                      ? "AUTOMATISÉ"
                                      : tc.sourceType ?? "MANUAL"}
                                  </span>
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-600">
                                    Mode : {tc.generationMode ?? "—"}
                                  </span>
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-600">
                                    Framework : {tc.automationFramework ?? "Aucun"}
                                  </span>
                                </div>
                              </div>

                              {tc.automationCode ? (
                                <pre className="max-h-80 overflow-auto bg-slate-950 p-4 text-xs text-slate-100">
                                  <code>{tc.automationCode}</code>
                                </pre>
                              ) : (
                                <div className="p-4 text-sm text-gray-400">
                                  Aucun code Playwright n’est encore associé à ce cas de test.
                                </div>
                              )}

                              {automationResults[tc.id] && (
                                <AutomationResultPanel
                                  result={
                                    automationResults[
                                      tc.id
                                    ] as unknown as AutomationRunResult
                                  }
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* pagination UI */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-400">
                      {t("testCases.results", { count: total })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                      >
                        {t("testCases.previous")}
                      </button>
                      <span className="text-xs text-gray-500 font-medium">
                        {t("testCases.page", { current: currentPage, total: totalPages })}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                      >
                        {t("testCases.next")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* ══ MODALS ══ */}
        <Modal
          open={isCreateSuiteOpen}
          onClose={() => setIsCreateSuiteOpen(false)}
          title={t("suites.createModal.title")}
        >
          <form onSubmit={handleCreateSuite} className="space-y-4">
            <Field label={t("suites.createModal.name")}>
              <input
                type="text"
                value={suiteName}
                onChange={(e) => setSuiteName(e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field label={t("suites.createModal.description")}>
              <textarea
                value={suiteDescription}
                onChange={(e) => setSuiteDescription(e.target.value)}
                className={inputCls}
                rows={3}
              />
            </Field>
            {suiteFormError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {suiteFormError}
              </div>
            )}
            <ModalFooter
              onCancel={() => setIsCreateSuiteOpen(false)}
              loading={creatingSuite}
              label={t("suites.createModal.submit")}
              t={t}
            />
          </form>
        </Modal>

        <Modal
          open={!!editingSuite}
          onClose={() => setEditingSuite(null)}
          title={t("suites.editModal.title")}
        >
          <form onSubmit={handleUpdateSuite} className="space-y-4">
            <Field label={t("suites.editModal.name")}>
              <input
                type="text"
                value={editSuiteName}
                onChange={(e) => setEditSuiteName(e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field label={t("suites.editModal.description")}>
              <textarea
                value={editSuiteDescription}
                onChange={(e) => setEditSuiteDescription(e.target.value)}
                className={inputCls}
                rows={3}
              />
            </Field>
            {editSuiteFormError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {editSuiteFormError}
              </div>
            )}
            <ModalFooter
              onCancel={() => setEditingSuite(null)}
              loading={updatingSuite}
              label={t("suites.editModal.submit")}
              t={t}
            />
          </form>
        </Modal>

        <Modal
          open={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            resetCreate();
          }}
          title={t("modals.createTestCase.title")}
          wide
        >
          <form onSubmit={handleCreateTestCase} className="space-y-4">
            <Field label={t("modals.createTestCase.titleLabel")}>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field label={t("modals.createTestCase.descriptionLabel")}>
              <textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className={inputCls}
                rows={2}
              />
            </Field>
            <Field label={t("modals.createTestCase.expectedLabel")}>
              <textarea
                value={createExpected}
                onChange={(e) => setCreateExpected(e.target.value)}
                className={inputCls}
                rows={2}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("modals.createTestCase.statusLabel")}>
                <select
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value as any)}
                  className={selectCls}
                >
                  <option value="DRAFT">{t("testCases.status.DRAFT")}</option>
                  <option value="READY">{t("testCases.status.READY")}</option>
                  <option value="DEPRECATED">{t("testCases.status.DEPRECATED")}</option>
                </select>
              </Field>
              <Field label={t("modals.createTestCase.priorityLabel")}>
                <select
                  value={createPriority}
                  onChange={(e) => setCreatePriority(e.target.value as any)}
                  className={selectCls}
                >
                  <option value="LOW">{t("testCases.priority.LOW")}</option>
                  <option value="MEDIUM">{t("testCases.priority.MEDIUM")}</option>
                  <option value="HIGH">{t("testCases.priority.HIGH")}</option>
                  <option value="CRITICAL">{t("testCases.priority.CRITICAL")}</option>
                </select>
              </Field>
            </div>
            <StepBlock
              steps={createSteps}
              onChange={stepChange(setCreateSteps)}
              onAdd={addStep(setCreateSteps)}
              onRemove={removeStep(setCreateSteps)}
              t={t}
            />
            {testCaseFormError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {testCaseFormError}
              </div>
            )}
            <ModalFooter
              onCancel={() => {
                setIsCreateOpen(false);
                resetCreate();
              }}
              loading={creating}
              label={t("modals.common.create")}
              t={t}
            />
          </form>
        </Modal>


        <Modal
          open={isRecordModalOpen}
          onClose={() => void closeRecordModal()}
          title="Record scénario Playwright"
          wide
        >
          <div className="space-y-5">
            {!codegenStatus && (
              <>
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-900">
                  <p className="font-semibold">
                    Enregistrement automatique avec Playwright Codegen
                  </p>
                  <p className="mt-1 text-blue-800">
                    Le frontend envoie uniquement l’URL et le cas de test.
                    Le backend crée la session, lance Codegen, sauvegarde le
                    fichier et récupère automatiquement le code généré.
                  </p>
                </div>

                {recordingTestCase && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">Cas de test :</span>{" "}
                      {recordingTestCase.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Le code pourra être enregistré directement dans ce cas
                      de test après la fermeture de Playwright Inspector.
                    </p>
                  </div>
                )}

                {!recordingTestCase && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Cet enregistrement n’est lié à aucun cas de test. Le code
                    pourra être prévisualisé et copié, mais pas importé
                    directement.
                  </div>
                )}

                <Field label="URL à enregistrer">
                  <input
                    type="url"
                    value={recordUrl}
                    onChange={(e) => {
                      setRecordUrl(e.target.value);
                      setRecordError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void startPlaywrightCodegen();
                      }
                    }}
                    placeholder="https://workspace.lifeintelligente.com/"
                    className={inputCls}
                    autoFocus
                  />
                </Field>

                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Workflow intelligent
                  </p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-600">
                    <li>Saisis l’URL et démarre l’enregistrement.</li>
                    <li>
                      Le backend ouvre le navigateur et Playwright Inspector.
                    </li>
                    <li>Réalise ton scénario complet.</li>
                    <li>
                      Ferme Playwright Inspector lorsque le scénario est fini.
                    </li>
                    <li>
                      Le code apparaît automatiquement dans cette interface.
                    </li>
                    <li>
                      Vérifie puis enregistre directement dans le cas de test.
                    </li>
                  </ol>
                </div>
              </>
            )}

            {codegenStatus === "RUNNING" && (
              <>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-start gap-3">
                    <LoaderCircle
                      size={22}
                      className="mt-0.5 animate-spin text-blue-600"
                    />
                    <div>
                      <p className="font-bold text-blue-900">
                        Enregistrement en cours
                      </p>
                      <p className="mt-1 text-sm text-blue-800">
                        Réalise ton scénario dans le navigateur ouvert. Ferme
                        ensuite Playwright Inspector pour terminer et
                        récupérer automatiquement le code.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      URL
                    </p>
                    <p className="mt-1 break-all text-sm text-gray-700">
                      {recordUrl}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Session
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-gray-700">
                      {codegenSessionId}
                    </p>
                  </div>
                </div>
              </>
            )}

            {codegenStatus === "COMPLETED" && (
              <>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={22}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-bold text-emerald-900">
                        Enregistrement terminé
                      </p>
                      <p className="mt-1 text-sm text-emerald-800">
                        Le backend a récupéré le code généré. Vérifie-le avant
                        de l’enregistrer dans le cas de test.
                      </p>
                    </div>
                  </div>
                </div>

                <Field label="Aperçu du code généré">
                  <pre className="max-h-96 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-100">
                    <code>
                      {generatedCode ||
                        "Le code est en cours de récupération..."}
                    </code>
                  </pre>
                </Field>
              </>
            )}

            {codegenStatus === "FAILED" && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p className="font-bold">Échec de l’enregistrement</p>
                <p className="mt-1">
                  {recordError ||
                    "Playwright Codegen n’a pas produit de fichier exploitable."}
                </p>
              </div>
            )}

            {codegenStatus === "CANCELLED" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                <p className="font-bold">Enregistrement annulé</p>
                <p className="mt-1">
                  Tu peux recommencer une nouvelle session avec la même URL.
                </p>
              </div>
            )}

            {recordError &&
              codegenStatus !== "FAILED" && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {recordError}
                </div>
              )}

            <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
              {codegenStatus === "RUNNING" ? (
                <button
                  type="button"
                  onClick={() => void cancelActiveCodegen()}
                  disabled={isCancellingCodegen}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                >
                  <X size={13} />
                  {isCancellingCodegen
                    ? "Annulation..."
                    : "Annuler l’enregistrement"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void closeRecordModal()}
                  disabled={
                    isStartingCodegen ||
                    isImportingCodegen ||
                    isCancellingCodegen
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-gray-500 hover:bg-gray-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                >
                  <X size={13} /> Fermer
                </button>
              )}

              {!codegenStatus && (
                <button
                  type="button"
                  onClick={() => void startPlaywrightCodegen()}
                  disabled={!recordUrl.trim() || isStartingCodegen}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                >
                  {isStartingCodegen ? (
                    <LoaderCircle size={13} className="animate-spin" />
                  ) : (
                    <PlayCircle size={13} />
                  )}
                  {isStartingCodegen
                    ? "Démarrage..."
                    : "Démarrer l’enregistrement"}
                </button>
              )}

              {(codegenStatus === "FAILED" ||
                codegenStatus === "CANCELLED") && (
                <button
                  type="button"
                  onClick={restartCodegenRecording}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  <RefreshCcw size={13} /> Recommencer
                </button>
              )}

              {codegenStatus === "COMPLETED" && (
                <>
                  <button
                    type="button"
                    onClick={restartCodegenRecording}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCcw size={13} /> Recommencer
                  </button>

                  <button
                    type="button"
                    onClick={() => void copyGeneratedCode()}
                    disabled={!generatedCode}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <Copy size={13} /> Copier le code
                  </button>

                  {recordingTestCase && (
                    <button
                      type="button"
                      onClick={() => void importGeneratedCode()}
                      disabled={!generatedCode || isImportingCodegen}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                    >
                      {isImportingCodegen ? (
                        <LoaderCircle size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                      {isImportingCodegen
                        ? "Enregistrement..."
                        : "Enregistrer dans ce cas"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </Modal>

        <Modal
          open={!!movingTestCase}
          onClose={closeMoveModal}
          title="Déplacer le cas de test"
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Cas de test :</span>{" "}
                {movingTestCase?.title}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Projet :</span>{" "}
                {selectedProject?.name ?? "—"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Suite actuelle :</span>{" "}
                {selectedSuite?.name ?? "—"}
              </p>
            </div>

            <Field label="Suite destination">
              <select
                value={targetSuiteId}
                onChange={(e) => {
                  setTargetSuiteId(e.target.value);
                  setMoveDuplicateWarning(false);
                  setMoveError("");
                }}
                className={selectCls}
              >
                <option value="">Choisir une suite du même projet</option>
                {testSuites
                  .filter((suite) => suite.id !== selectedSuite?.id)
                  .map((suite) => (
                    <option key={suite.id} value={suite.id}>
                      {suite.name}
                    </option>
                  ))}
              </select>
            </Field>

            {moveDuplicateWarning && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Cas de test déjà existant</p>
                  <p className="mt-1">
                    La suite destination contient déjà un cas de test avec le même titre.
                    Voulez-vous quand même déplacer ce cas de test ?
                  </p>
                </div>
              </div>
            )}

            {moveError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {moveError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={closeMoveModal}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                <X size={13} /> Annuler
              </button>
              <button
                type="button"
                disabled={!targetSuiteId || isMovingTestCase}
                onClick={() => executeMoveTestCase(false)}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
              >
                {isMovingTestCase ? "Déplacement..." : "Déplacer"}
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          open={!!editingTestCase}
          onClose={closeEditModal}
          title={t("modals.editTestCase.title")}
          wide
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <Field label={t("modals.editTestCase.titleLabel")}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field label={t("modals.editTestCase.descriptionLabel")}>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className={inputCls}
                rows={2}
              />
            </Field>
            <Field label={t("modals.editTestCase.expectedLabel")}>
              <textarea
                value={editExpected}
                onChange={(e) => setEditExpected(e.target.value)}
                className={inputCls}
                rows={2}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("modals.editTestCase.statusLabel")}>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className={selectCls}
                >
                  <option value="DRAFT">{t("testCases.status.DRAFT")}</option>
                  <option value="READY">{t("testCases.status.READY")}</option>
                  <option value="DEPRECATED">{t("testCases.status.DEPRECATED")}</option>
                </select>
              </Field>
              <Field label={t("modals.editTestCase.priorityLabel")}>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className={selectCls}
                >
                  <option value="LOW">{t("testCases.priority.LOW")}</option>
                  <option value="MEDIUM">{t("testCases.priority.MEDIUM")}</option>
                  <option value="HIGH">{t("testCases.priority.HIGH")}</option>
                  <option value="CRITICAL">{t("testCases.priority.CRITICAL")}</option>
                </select>
              </Field>
            </div>
            <StepBlock
              steps={editSteps}
              onChange={stepChange(setEditSteps)}
              onAdd={addStep(setEditSteps)}
              onRemove={removeStep(setEditSteps)}
              t={t}
            />

            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  Automatisation Playwright
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Code optionnel utilisé plus tard pour l’exécution automatique côté backend.
                </p>
              </div>

              <Field label="Framework d'automatisation">
                <select
                  value={editAutomationFramework}
                  onChange={(e) =>
                    setEditAutomationFramework(e.target.value as "" | "PLAYWRIGHT")
                  }
                  className={selectCls}
                >
                  <option value="">Aucun</option>
                  <option value="PLAYWRIGHT">Playwright</option>
                </select>
              </Field>

              <Field label="Code Playwright">
                <textarea
                  value={editAutomationCode}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditAutomationCode(value);
                    setEditAutomationFramework(value.trim() ? "PLAYWRIGHT" : "");
                  }}
                  className={`${inputCls} font-mono text-xs`}
                  rows={10}
                  placeholder={`import { test, expect } from '@playwright/test';

test('Nom du test', async ({ page }) => {
  await page.goto('https://example.com');
});`}
                />
              </Field>

              <p className="text-xs text-gray-400">
                Ce code est sauvegardé dans le cas de test. L’exécution automatique sera ajoutée côté backend.
              </p>
            </div>
            {editTestCaseFormError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {editTestCaseFormError}
              </div>
            )}
            <ModalFooter
              onCancel={closeEditModal}
              loading={updating}
              label={t("modals.common.save")}
              t={t}
            />
          </form>
        </Modal>
      </div>
    </div>
  );
}