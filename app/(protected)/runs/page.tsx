"use client";;
import { FormEvent, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchProjects, setSelectedProject } from "@/lib/slices/projectSlice";
import {
  clearCampaigns, createCampaign, fetchCampaigns, setSelectedCampaign,
} from "@/lib/slices/campaignSlice";
import {
  clearIterations, createIteration, fetchIterations, setSelectedIteration,
} from "@/lib/slices/iterationSlice";
import { clearTestSuites, fetchTestSuites } from "@/lib/slices/testSuiteSlice";
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Plus,
  FolderKanban, Megaphone, RefreshCw, FlaskConical, CheckCircle2,
  XCircle, AlertCircle, SkipForward, Clock, ChevronDown, ChevronUp,
  AlertTriangle,
} from "lucide-react";

type RunResponse = { count?: number; steps?: number; message?: string };
type ExecutionStatus = "TODO" | "SUCCESS" | "FAILED" | "BLOCKED" | "SKIPPED";

type ExecutionStepItem = {
  id: string; iterationItemId: string; testStepId: string;
  status: ExecutionStatus; comment?: string | null; executedAt?: string | null;
  testStep: { id: string; stepOrder: number; action: string; expected?: string | null };
};

type ExecutionItem = {
  id: string; iterationId: string; testCaseId: string;
  status: ExecutionStatus; comment?: string | null; duration?: number | null;
  executedAt?: string | null;
  testCase: { id: string; title: string; description?: string | null; expected?: string | null; priority?: string; status?: string };
  steps?: ExecutionStepItem[];
};

/* ─── status maps ─── */
const statusBadge: Record<ExecutionStatus, string> = {
  TODO:    "bg-gray-100 text-gray-600 border border-gray-200",
  SUCCESS: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  FAILED:  "bg-red-100 text-red-700 border border-red-200",
  BLOCKED: "bg-orange-100 text-orange-700 border border-orange-200",
  SKIPPED: "bg-blue-100 text-blue-700 border border-blue-200",
};
const statusBtn: Record<ExecutionStatus, string> = {
  TODO:    "bg-gray-500 hover:bg-gray-600",
  SUCCESS: "bg-emerald-600 hover:bg-emerald-700",
  FAILED:  "bg-red-600 hover:bg-red-700",
  BLOCKED: "bg-orange-500 hover:bg-orange-600",
  SKIPPED: "bg-blue-600 hover:bg-blue-700",
};
const statusIcon: Record<ExecutionStatus, React.ReactNode> = {
  TODO:    <Clock size={12} />,
  SUCCESS: <CheckCircle2 size={12} />,
  FAILED:  <XCircle size={12} />,
  BLOCKED: <AlertCircle size={12} />,
  SKIPPED: <SkipForward size={12} />,
};
const statusBar: Record<ExecutionStatus, string> = {
  TODO: "bg-gray-400", SUCCESS: "bg-emerald-500", FAILED: "bg-red-500",
  BLOCKED: "bg-orange-500", SKIPPED: "bg-blue-500",
};
const stepStatuses: ExecutionStatus[] = ["SUCCESS", "FAILED", "BLOCKED", "SKIPPED", "TODO"];
const statusOrder: ExecutionStatus[] = ["SUCCESS", "FAILED", "BLOCKED", "SKIPPED", "TODO"];
const statusLabels: Record<ExecutionStatus, string> = {
  TODO: "To do", SUCCESS: "Success", FAILED: "Failed", BLOCKED: "Blocked", SKIPPED: "Skipped",
};

/* ─── helpers ─── */
function PanelHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
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

function StatCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={`rounded-xl border p-3 ${className ?? "bg-gray-50 border-gray-100"}`}>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function CollapseBtn({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="absolute -left-4 top-10 z-20 hidden xl:flex items-center justify-center h-8 w-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-blue-600 transition-colors">
      {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
    </button>
  );
}

function CreateInput({
  value, onChange, onSubmit, placeholder, loading, disabled,
}: {
  value: string; onChange: (v: string) => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  placeholder: string; loading: boolean; disabled: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 px-3 pb-3">
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 disabled:opacity-40" />
      <button type="submit" disabled={!value.trim() || loading || disabled}
        className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors">
        {loading ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={15} />}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════ */
export default function RunsPage() {
  const dispatch = useAppDispatch();
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  const { projects, loading: loadingProjects, selectedProject, error: projectError } = useAppSelector(s => s.projects);
  const { campaigns, selectedCampaign, loading: loadingCampaigns, creating: creatingCampaign, error: campaignError } = useAppSelector(s => s.campaigns);
  const { iterations, selectedIteration, loading: loadingIterations, creating: creatingIteration, error: iterationError } = useAppSelector(s => s.iterations);
  const { testSuites, loading: loadingSuites } = useAppSelector(s => s.testSuites);

  const [newCampaign, setNewCampaign] = useState("");
  const [newIteration, setNewIteration] = useState("");
  const [selectedSuiteIds, setSelectedSuiteIds] = useState<string[]>([]);
  const [addingSuites, setAddingSuites] = useState(false);
  const [running, setRunning] = useState(false);
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

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);
  useEffect(() => {
    if (!selectedProject?.id) { dispatch(clearCampaigns()); dispatch(clearIterations()); dispatch(clearTestSuites()); return; }
    dispatch(fetchCampaigns(selectedProject.id));
    dispatch(fetchTestSuites(selectedProject.id));
  }, [dispatch, selectedProject?.id]);
  useEffect(() => {
    if (!selectedCampaign?.id) { dispatch(clearIterations()); return; }
    dispatch(fetchIterations(selectedCampaign.id));
  }, [dispatch, selectedCampaign?.id]);
  useEffect(() => {
    const fn = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  const fetchExecutionItems = async (iterationId: string) => {
    try {
      setLoadingExecution(true); setRunError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/iteration-items/iteration/${iterationId}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      setExecutionItems(await res.json());
    } catch { setRunError("Impossible de charger les cas de test."); }
    finally { setLoadingExecution(false); }
  };

  const reset = () => { setSelectedSuiteIds([]); setExecutionItems([]); setExpandedItemId(null); setRunMessage(null); setRunError(null); };

  const handleSelectProject = (p: typeof projects[number]) => { dispatch(setSelectedProject(p)); dispatch(clearCampaigns()); dispatch(clearIterations()); dispatch(clearTestSuites()); reset(); };
  const handleSelectCampaign = (c: typeof campaigns[number]) => { dispatch(setSelectedCampaign(c)); dispatch(clearIterations()); reset(); };
  const handleSelectIteration = (it: typeof iterations[number]) => { dispatch(setSelectedIteration(it)); reset(); fetchExecutionItems(it.id); };

  const handleCreateCampaign = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!selectedProject?.id || !newCampaign.trim()) return;
    const r = await dispatch(createCampaign({ projectId: selectedProject.id, name: newCampaign.trim() }));
    if (createCampaign.fulfilled.match(r)) { setNewCampaign(""); dispatch(fetchCampaigns(selectedProject.id)); }
  };

  const handleCreateIteration = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!selectedCampaign?.id || !newIteration.trim()) return;
    const r = await dispatch(createIteration({ campaignId: selectedCampaign.id, name: newIteration.trim() }));
    if (createIteration.fulfilled.match(r)) {
      const it = r.payload; setNewIteration(""); dispatch(setSelectedIteration(it)); reset();
      dispatch(fetchIterations(selectedCampaign.id)); fetchExecutionItems(it.id);
    }
  };

  const handleAddSuites = async () => {
    if (!selectedIteration?.id || !selectedSuiteIds.length) return;
    try {
      setAddingSuites(true); setRunMessage(null); setRunError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/iterations/${selectedIteration.id}/suites`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suiteIds: selectedSuiteIds }),
      });
      if (!res.ok) throw new Error();
      setRunMessage("Suites ajoutées. Tu peux maintenant lancer Run Tests.");
      setSelectedSuiteIds([]);
    } catch { setRunError("Impossible d'ajouter les suites."); }
    finally { setAddingSuites(false); }
  };

  const handleRunTests = async () => {
    if (!selectedIteration?.id) return;
    try {
      setRunning(true); setRunMessage(null); setRunError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/iterations/${selectedIteration.id}/run`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      const data: RunResponse = await res.json();
      setRunMessage(data.message ?? (typeof data.count === "number" ? `${data.count} cas générés.` : "Exécution générée."));
      await fetchExecutionItems(selectedIteration.id);
    } catch { setRunError("Impossible de générer l'exécution."); }
    finally { setRunning(false); }
  };

  const handleUpdateStep = async (stepItemId: string, status: ExecutionStatus) => {
    if (!selectedIteration?.id) return;
    try {
      setSavingStepId(stepItemId); setRunError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/iteration-step-items/${stepItemId}/status`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await fetchExecutionItems(selectedIteration.id);
    } catch { setRunError("Impossible de mettre à jour le statut."); }
    finally { setSavingStepId(null); }
  };

  /* stats */
  const stats = {
    total: executionItems.length,
    todo: executionItems.filter(i => i.status === "TODO").length,
    success: executionItems.filter(i => i.status === "SUCCESS").length,
    failed: executionItems.filter(i => i.status === "FAILED").length,
    blocked: executionItems.filter(i => i.status === "BLOCKED").length,
    skipped: executionItems.filter(i => i.status === "SKIPPED").length,
  };
  const done = stats.total - stats.todo;
  const progress = stats.total ? Math.round((done / stats.total) * 100) : 0;
  const successRate = stats.total ? Math.round((stats.success / stats.total) * 100) : 0;
  const failureRate = stats.total ? Math.round((stats.failed / stats.total) * 100) : 0;

  /* layout */
  const visible = [!collapsedProjects, !collapsedCampaigns, !collapsedIterations, true].filter(Boolean).length;
  const colSpan = visible === 1 ? "xl:col-span-12" : visible === 2 ? "xl:col-span-6" : visible === 3 ? "xl:col-span-4" : "xl:col-span-3";

  const globalError = projectError || campaignError || iterationError;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Test Execution</h1>
          <p className="text-sm text-gray-400 mt-0.5">Projet → Campagne → Itération → Suites → Statut</p>
        </div>
        <button type="button" onClick={async () => {
          try { if (!document.fullscreenElement) await fullscreenRef.current?.requestFullscreen(); else await document.exitFullscreen(); } catch {}
        }} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">
          {isFullscreen ? <><Minimize2 size={14} /> Quitter</> : <><Maximize2 size={14} /> Plein écran</>}
        </button>
      </div>

      {/* Alerts */}
      {globalError && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"><AlertTriangle size={14} />{globalError}</div>}
      {runError && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"><AlertTriangle size={14} />{runError}</div>}
      {runMessage && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={14} />{runMessage}</div>}

      <div ref={fullscreenRef} className={isFullscreen ? "overflow-auto bg-gray-50 p-6 min-h-screen" : ""}>
        {isFullscreen && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-700">Vue plein écran</h2>
            <button type="button" onClick={async () => { try { await document.exitFullscreen(); } catch {} }}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-white transition-colors">
              <Minimize2 size={14} /> Fermer
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">

          {/* ── PROJECTS ── */}
          {!collapsedProjects && (
            <section className={`min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${colSpan}`}>
              <PanelHeader icon={<FolderKanban size={15} className="text-blue-500" />} title="Projects" />
              <div className="p-3 space-y-1.5">
                {loadingProjects ? <p className="text-sm text-gray-400 px-2 py-4">Chargement...</p>
                  : projects.length === 0 ? <p className="text-sm text-gray-400 px-2 py-4">Aucun projet.</p>
                  : projects.map(p => {
                    const active = selectedProject?.id === p.id;
                    return (
                      <button key={p.id} type="button" onClick={() => handleSelectProject(p)}
                        className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${active ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className={`text-xs mt-0.5 ${active ? "text-blue-100" : "text-gray-400"}`} suppressHydrationWarning>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </section>
          )}

          {/* ── CAMPAIGNS ── */}
          {!collapsedCampaigns && (
            <section className={`relative min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${colSpan}`}>
              <CollapseBtn collapsed={collapsedProjects} onClick={() => setCollapsedProjects(p => !p)} />
              <PanelHeader icon={<Megaphone size={15} className="text-purple-500" />} title="Campaigns" subtitle="Campagnes de test" />
              {!selectedProject ? (
                <p className="text-sm text-gray-400 px-5 py-4">{"Choisis d'abord un projet."}</p>
              ) : (
                <>
                  <div className="px-3 pt-3">
                    <CreateInput value={newCampaign} onChange={setNewCampaign} onSubmit={handleCreateCampaign}
                      placeholder="Nouvelle campagne" loading={creatingCampaign} disabled={!selectedProject} />
                  </div>
                  <div className="px-3 pb-3 space-y-1.5">
                    {loadingCampaigns ? <p className="text-sm text-gray-400 py-4">Chargement...</p>
                      : campaigns.length === 0 ? <p className="text-sm text-gray-400 py-4">Aucune campagne.</p>
                      : campaigns.map(c => {
                        const active = selectedCampaign?.id === c.id;
                        return (
                          <button key={c.id} type="button" onClick={() => handleSelectCampaign(c)}
                            className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${active ? "bg-purple-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                            <div className="text-sm font-medium truncate">{c.name}</div>
                            <div className={`text-xs mt-0.5 ${active ? "text-purple-100" : "text-gray-400"}`} suppressHydrationWarning>
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </>
              )}
            </section>
          )}

          {/* ── ITERATIONS ── */}
          {!collapsedIterations && (
            <section className={`relative min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${colSpan}`}>
              <CollapseBtn collapsed={collapsedCampaigns} onClick={() => setCollapsedCampaigns(p => !p)} />
              <PanelHeader icon={<RefreshCw size={15} className="text-amber-500" />} title="Iterations" subtitle="Crée et sélectionne une itération" />
              {!selectedCampaign ? (
                <p className="text-sm text-gray-400 px-5 py-4">{"Choisis d'abord une campagne."}</p>
              ) : (
                <>
                  <div className="px-3 pt-3">
                    <CreateInput value={newIteration} onChange={setNewIteration} onSubmit={handleCreateIteration}
                      placeholder="Nouvelle itération" loading={creatingIteration} disabled={!selectedCampaign} />
                  </div>
                  <div className="px-3 pb-3 space-y-1.5">
                    {loadingIterations ? <p className="text-sm text-gray-400 py-4">Chargement...</p>
                      : iterations.length === 0 ? <p className="text-sm text-gray-400 py-4">Aucune itération.</p>
                      : iterations.map(it => {
                        const active = selectedIteration?.id === it.id;
                        return (
                          <button key={it.id} type="button" onClick={() => handleSelectIteration(it)}
                            className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${active ? "bg-amber-500 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                            <div className="text-sm font-medium truncate">{it.name}</div>
                            <div className={`text-xs mt-0.5 ${active ? "text-amber-100" : "text-gray-400"}`} suppressHydrationWarning>
                              {it.createdAt ? new Date(it.createdAt).toLocaleDateString() : "—"}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </>
              )}
            </section>
          )}

          {/* ── EXECUTION ── */}
          <section className={`relative min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${colSpan}`}>
            <CollapseBtn collapsed={collapsedIterations} onClick={() => setCollapsedIterations(p => !p)} />
            <PanelHeader icon={<FlaskConical size={15} className="text-blue-500" />} title="Execution"
              subtitle={selectedIteration ? selectedIteration.name : "Sélectionne une itération"} />

            <div className="p-4 space-y-5">
              {!selectedIteration ? (
                <p className="text-sm text-gray-400 py-6 text-center">Choisis une itération pour commencer.</p>
              ) : (
                <>
                  {/* Context badge */}
                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs text-gray-500 space-y-0.5">
                    <div><span className="font-semibold text-gray-700">Itération :</span> {selectedIteration.name}</div>
                    <div><span className="font-semibold text-gray-700">Campagne :</span> {selectedCampaign?.name}</div>
                    <div><span className="font-semibold text-gray-700">Projet :</span> {selectedProject?.name}</div>
                  </div>

                  {/* Suite selector */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Suites à exécuter</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      {loadingSuites ? <p className="text-sm text-gray-400">Chargement...</p>
                        : testSuites.length === 0 ? <p className="text-sm text-gray-400">Aucune suite dans ce projet.</p>
                        : testSuites.map(suite => (
                          <label key={suite.id} className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-white px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={selectedSuiteIds.includes(suite.id)}
                              onChange={() => setSelectedSuiteIds(p => p.includes(suite.id) ? p.filter(id => id !== suite.id) : [...p, suite.id])}
                              className="accent-emerald-600" />
                            <span className="text-sm text-gray-700 truncate">{suite.name}</span>
                          </label>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 px-3 pb-3">
                      <button type="button" onClick={handleAddSuites}
                        disabled={!selectedSuiteIds.length || addingSuites}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-medium text-white disabled:opacity-40 transition-colors">
                        {addingSuites ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                        Ajouter les suites
                      </button>
                    </div>
                  </div>

                  {/* Run button */}
                  <button type="button" onClick={handleRunTests} disabled={running}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors">
                    {running ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                    {running ? "Génération en cours..." : "Run Tests"}
                  </button>

                  {/* ── Dashboard ── */}
                  {stats.total > 0 && (
                    <div className="space-y-4">
                      {/* Progress bar */}
                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Progression</span>
                          <span className="text-xs font-bold text-gray-700">{progress}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                          <span>{done} done</span>
                          <span>{stats.todo} remaining</span>
                        </div>
                      </div>

                      {/* Stat grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <StatCard label="Total" value={stats.total} />
                        <StatCard label="Done" value={done} />
                        <StatCard label="To do" value={stats.todo} />
                        <StatCard label="Success" value={stats.success} className="bg-emerald-50 border-emerald-100 text-emerald-700" />
                        <StatCard label="Failed" value={stats.failed} className="bg-red-50 border-red-100 text-red-700" />
                        <StatCard label="Blocked" value={stats.blocked} className="bg-orange-50 border-orange-100 text-orange-700" />
                      </div>

                      {/* Stats table */}
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Statistics</span>
                        </div>
                        <table className="w-full text-xs">
                          <thead><tr className="border-b border-gray-50">
                            <th className="text-left px-4 py-2 text-gray-400 font-semibold">Metric</th>
                            <th className="text-left px-4 py-2 text-gray-400 font-semibold">Value</th>
                            <th className="text-left px-4 py-2 text-gray-400 font-semibold">Rate</th>
                          </tr></thead>
                          <tbody>
                            {[
                              { label: "Progress", num: done, den: stats.total, rate: progress },
                              { label: "Success rate", num: stats.success, den: stats.total, rate: successRate },
                              { label: "Failure rate", num: stats.failed, den: stats.total, rate: failureRate },
                            ].map(row => (
                              <tr key={row.label} className="border-t border-gray-50">
                                <td className="px-4 py-2 text-gray-600">{row.label}</td>
                                <td className="px-4 py-2 text-gray-700 font-medium">{row.num}/{row.den}</td>
                                <td className="px-4 py-2 text-gray-700 font-medium">{row.rate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Status bars */}
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Execution status</span>
                        </div>
                        <div className="p-4 space-y-3">
                          {statusOrder.map(s => {
                            const v = s === "SUCCESS" ? stats.success : s === "FAILED" ? stats.failed : s === "BLOCKED" ? stats.blocked : s === "SKIPPED" ? stats.skipped : stats.todo;
                            const r = stats.total ? Math.round((v / stats.total) * 100) : 0;
                            return (
                              <div key={s}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600 font-medium">{statusLabels[s]}</span>
                                  <span className="text-gray-400">{v} — {r}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${statusBar[s]}`} style={{ width: `${r}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Execution items ── */}
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cas de test</span>
                      <span className="text-xs text-gray-400">{executionItems.length} item(s)</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {loadingExecution ? (
                        <p className="text-sm text-gray-400 px-4 py-6 text-center">Chargement...</p>
                      ) : executionItems.length === 0 ? (
                        <p className="text-sm text-gray-400 px-4 py-6 text-center">Aucun cas. Ajoute des suites puis lance Run Tests.</p>
                      ) : executionItems.map(item => {
                        const expanded = expandedItemId === item.id;
                        return (
                          <div key={item.id} className={`transition-colors ${expanded ? "bg-blue-50/30" : "bg-white"}`}>
                            <div className="flex items-start gap-3 px-4 py-3">
                              <button type="button" onClick={() => setExpandedItemId(p => p === item.id ? null : item.id)}
                                className="mt-0.5 text-gray-400 hover:text-blue-600 transition-colors">
                                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-800 truncate">{item.testCase?.title || "Test case"}</div>
                                <div className="text-xs text-gray-400 truncate">{item.testCase?.description || "Pas de description"}</div>
                              </div>
                              <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${statusBadge[item.status]}`}>
                                {statusIcon[item.status]}{item.status}
                              </span>
                            </div>

                            {expanded && (
                              <div className="border-t border-blue-100 bg-white px-4 pb-4 pt-3 space-y-2">
                                {!item.steps?.length ? (
                                  <p className="text-xs text-gray-400">Aucun step généré.</p>
                                ) : item.steps.map(step => (
                                  <div key={step.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="min-w-0">
                                        <span className="text-xs font-bold text-gray-400">Step {step.testStep.stepOrder}</span>
                                        <p className="text-sm text-gray-700 mt-0.5">{step.testStep.action}</p>
                                        {step.testStep.expected && (
                                          <p className="text-xs text-gray-400 mt-1">Expected: {step.testStep.expected}</p>
                                        )}
                                      </div>
                                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${statusBadge[step.status]}`}>
                                        {statusIcon[step.status]}{step.status}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {stepStatuses.map(s => (
                                        <button key={s} type="button" disabled={savingStepId === step.id}
                                          onClick={() => handleUpdateStep(step.id, s)}
                                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50 transition-colors ${statusBtn[s]}`}>
                                          {statusIcon[s]}{s}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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