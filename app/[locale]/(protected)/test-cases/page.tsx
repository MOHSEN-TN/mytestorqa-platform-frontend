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
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  X,
  FlaskConical,
  Layers,
  FolderKanban,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

type StepForm = { action: string; expected: string };
  const StepBlock = ({
    steps, onChange, onAdd, onRemove,
  }: {
    steps: StepForm[];
    onChange: (i: number, f: "action" | "expected", v: string) => void;
    onAdd: () => void;
    onRemove: (i: number) => void;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Test Steps</span>
        <button type="button" onClick={onAdd} className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white transition-colors">
          <Plus size={12} /> Add Step
        </button>
      </div>
      {steps.map((step, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Step {i + 1}</span>
            {steps.length > 1 && (
              <button type="button" onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <textarea placeholder="Action" value={step.action} onChange={e => onChange(i, "action", e.target.value)} className={inputCls} rows={2} />
          <textarea placeholder="Expected result" value={step.expected} onChange={e => onChange(i, "expected", e.target.value)} className={inputCls} rows={2} />
        </div>
      ))}
    </div>
  );
/* ─── helpers ─── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    READY: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    DRAFT: "bg-amber-100 text-amber-700 border border-amber-200",
    DEPRECATED: "bg-gray-100 text-gray-500 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700 border border-red-200",
    HIGH: "bg-orange-100 text-orange-700 border border-orange-200",
    MEDIUM: "bg-blue-100 text-blue-700 border border-blue-200",
    LOW: "bg-gray-100 text-gray-500 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[priority] ?? "bg-gray-100 text-gray-600"}`}>
      {priority}
    </span>
  );
}

function IconBtn({
  onClick, title, disabled, className, children,
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
  open, onClose, title, wide, children,
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
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
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
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition";
const selectCls = inputCls;

function ModalFooter({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
      <button type="button" onClick={onCancel} className="flex items-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors">
        <X size={13} /> Annuler
      </button>
      <button type="submit" disabled={loading} className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors">
        {loading ? "..." : label}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function TestCasesPage() {
  const dispatch = useAppDispatch();
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  const { projects, loading: loadingProjects, selectedProject, error: projectError } = useAppSelector((s) => s.projects);
  const { testSuites, selectedSuite, loading: loadingSuites, creating: creatingSuite, updating: updatingSuite, deleting: deletingSuite, error: suiteError } = useAppSelector((s) => s.testSuites);

  // ── récupère total et totalPages depuis le store ──
  const {
    loading: loadingTestCases,
    creating,
    updating,
    deleting,
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
  const [editingSuite, setEditingSuite] = useState<{ id: string; name: string; description?: string | null } | null>(null);
  const [editSuiteName, setEditSuiteName] = useState("");
  const [editSuiteDescription, setEditSuiteDescription] = useState("");

  /* test case modals */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createExpected, setCreateExpected] = useState("");
  const [createStatus, setCreateStatus] = useState<"DRAFT" | "READY" | "DEPRECATED">("DRAFT");
  const [createPriority, setCreatePriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [createSteps, setCreateSteps] = useState<StepForm[]>([{ action: "", expected: "" }]);

  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editExpected, setEditExpected] = useState("");
  const [editStatus, setEditStatus] = useState<"DRAFT" | "READY" | "DEPRECATED">("DRAFT");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [editSteps, setEditSteps] = useState<StepForm[]>([{ action: "", expected: "" }]);

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

  // ── fetch avec pagination backend ──
  useEffect(() => {
    if (!selectedSuite?.id) {
      dispatch(clearTestCases());
      return;
    }
    dispatch(fetchTestCases({
      suiteId: selectedSuite.id,
      status: statusFilter,
      priority: priorityFilter,
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: itemsPerPage,
    }));
  }, [dispatch, selectedSuite?.id, statusFilter, priorityFilter, debouncedSearch, currentPage, itemsPerPage]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── reset page quand les filtres changent ──
  const resetPage = () => { setCurrentPage(1); setExpandedId(null); };

  const globalError = projectError || suiteError || testCaseError;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await fullscreenRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) { console.error(e); }
  };

  /* ── suite handlers ── */
  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject?.id || !suiteName.trim()) return;
    const r = await dispatch(createTestSuite({ projectId: selectedProject.id, name: suiteName.trim(), description: suiteDescription.trim() || undefined }));
    if (createTestSuite.fulfilled.match(r)) { setIsCreateSuiteOpen(false); setSuiteName(""); setSuiteDescription(""); dispatch(fetchTestSuites(selectedProject.id)); }
  };

  const handleUpdateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSuite || !editSuiteName.trim() || !selectedProject?.id) return;
    const r = await dispatch(updateTestSuite({ suiteId: editingSuite.id, name: editSuiteName.trim(), description: editSuiteDescription.trim() || undefined }));
    if (updateTestSuite.fulfilled.match(r)) { setEditingSuite(null); dispatch(fetchTestSuites(selectedProject.id)); }
  };

  const handleDeleteSuite = async (id: string) => {
    if (!selectedProject?.id || !window.confirm("Supprimer cette suite ?")) return;
    const r = await dispatch(deleteTestSuite(id));
    if (deleteTestSuite.fulfilled.match(r)) { dispatch(fetchTestSuites(selectedProject.id)); dispatch(clearTestCases()); }
  };

  const handleDuplicateSuite = async (id: string) => {
    if (!selectedProject?.id) return;
    const r = await dispatch(duplicateTestSuite(id));
    if (duplicateTestSuite.fulfilled.match(r)) dispatch(fetchTestSuites(selectedProject.id));
  };

  /* ── test case handlers ── */
  const resetCreate = () => { setCreateTitle(""); setCreateDescription(""); setCreateExpected(""); setCreateStatus("DRAFT"); setCreatePriority("MEDIUM"); setCreateSteps([{ action: "", expected: "" }]); };

  // helper pour re-fetch avec les params courants
  const refetchCases = () => {
    if (!selectedSuite?.id) return;
    dispatch(fetchTestCases({
      suiteId: selectedSuite.id,
      status: statusFilter,
      priority: priorityFilter,
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: itemsPerPage,
    }));
  };

  const handleCreateTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuite?.id || !createTitle.trim()) return;
    const steps = createSteps.map(s => ({ action: s.action.trim(), expected: s.expected.trim() || undefined })).filter(s => s.action);
    const r = await dispatch(createTestCase({ suiteId: selectedSuite.id, title: createTitle.trim(), description: createDescription.trim() || undefined, expected: createExpected.trim() || undefined, status: createStatus, priority: createPriority, steps: steps.length ? steps : undefined }));
    if (createTestCase.fulfilled.match(r)) { setIsCreateOpen(false); resetCreate(); refetchCases(); }
  };

  const handleDuplicate = async (id: string) => {
    if (!selectedSuite?.id) return;
    const r = await dispatch(duplicateTestCase({ suiteId: selectedSuite.id, testCaseId: id }));
    if (duplicateTestCase.fulfilled.match(r)) refetchCases();
  };

  const openEditModal = (tc: TestCase) => {
    setEditingTestCase(tc); setEditTitle(tc.title); setEditDescription(tc.description ?? ""); setEditExpected(tc.expected ?? "");
    setEditStatus(tc.status); setEditPriority(tc.priority);
    setEditSteps(tc.steps?.length ? tc.steps.map(s => ({ action: s.action ?? "", expected: s.expected ?? "" })) : [{ action: "", expected: "" }]);
  };

  const closeEditModal = () => { setEditingTestCase(null); setEditTitle(""); setEditDescription(""); setEditExpected(""); setEditStatus("DRAFT"); setEditPriority("MEDIUM"); setEditSteps([{ action: "", expected: "" }]); };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuite?.id || !editingTestCase || !editTitle.trim()) return;
    const steps = editSteps.map(s => ({ action: s.action.trim(), expected: s.expected.trim() || undefined })).filter(s => s.action);
    const r = await dispatch(updateTestCase({ suiteId: selectedSuite.id, testCaseId: editingTestCase.id, title: editTitle.trim(), description: editDescription.trim() || undefined, expected: editExpected.trim() || undefined, status: editStatus, priority: editPriority, steps: steps.length ? steps : undefined }));
    if (updateTestCase.fulfilled.match(r)) { closeEditModal(); refetchCases(); }
  };

  const handleDelete = async (id: string) => {
    if (!selectedSuite?.id || !window.confirm("Supprimer ce test case ?")) return;
    const r = await dispatch(deleteTestCase({ suiteId: selectedSuite.id, testCaseId: id }));
    if (deleteTestCase.fulfilled.match(r)) refetchCases();
  };

  /* ── steps helpers ── */
  const stepChange = (setter: React.Dispatch<React.SetStateAction<StepForm[]>>) => (i: number, f: "action" | "expected", v: string) =>
    setter(prev => prev.map((s, idx) => idx === i ? { ...s, [f]: v } : s));
  const addStep = (setter: React.Dispatch<React.SetStateAction<StepForm[]>>) => () => setter(p => [...p, { action: "", expected: "" }]);
  const removeStep = (setter: React.Dispatch<React.SetStateAction<StepForm[]>>) => (i: number) => setter(p => p.filter((_, idx) => idx !== i));

  /* ── layout ── */
  const projectColCls = collapsedProjects ? "hidden" : isFullscreen ? "xl:col-span-2" : "xl:col-span-3";
  const suiteColCls = collapsedSuites ? "hidden" : isFullscreen ? "xl:col-span-3" : "xl:col-span-3";
  const casesColCls = (() => {
    if (collapsedProjects && collapsedSuites) return "xl:col-span-12";
    if (collapsedProjects) return "xl:col-span-9";
    if (collapsedSuites) return "xl:col-span-9";
    return isFullscreen ? "xl:col-span-7" : "xl:col-span-6";
  })();

  if (loadingProjects) return <div className="p-8 text-gray-400 text-sm">Chargement des projets...</div>;



  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Test Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Projet → Suites → Cas de test</p>
        </div>
        <button type="button" onClick={toggleFullscreen} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
          {isFullscreen ? <><Minimize2 size={14} /> Quitter</> : <><Maximize2 size={14} /> Plein écran</>}
        </button>
      </div>

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{globalError}</div>
      )}

      <div ref={fullscreenRef} className={isFullscreen ? "overflow-auto bg-gray-50 p-6 min-h-screen" : ""}>
        {isFullscreen && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-700">Vue plein écran</h2>
            <button type="button" onClick={toggleFullscreen} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-white transition-colors">
              <Minimize2 size={14} /> Fermer
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">

          {/* ── PROJECTS PANEL ── */}
          <section className={`min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${projectColCls}`}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <FolderKanban size={15} className="text-blue-500" />
              <h2 className="text-sm font-bold text-gray-700 flex-1">Projects</h2>
            </div>
            <div className="p-3 space-y-1.5">
              {projects.length === 0 ? (
                <p className="text-sm text-gray-400 px-2 py-3">Aucun projet trouvé.</p>
              ) : projects.map((project) => {
                const active = selectedProject?.id === project.id;
                return (
                  <button key={project.id} type="button" onClick={() => dispatch(setSelectedProject(project))}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${active ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                    <div className="text-sm font-medium truncate">{project.name}</div>
                    <div className={`text-xs mt-0.5 ${active ? "text-blue-100" : "text-gray-400"}`}>
                      {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "—"}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── SUITES PANEL ── */}
          <section className={`relative min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${suiteColCls}`}>
            <button type="button" onClick={() => setCollapsedProjects(p => !p)}
              className="absolute -left-4 top-10 z-20 hidden xl:flex items-center justify-center h-8 w-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-blue-600 transition-colors">
              {collapsedProjects ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <Layers size={15} className="text-emerald-500" />
              <h2 className="text-sm font-bold text-gray-700 flex-1">Test Suites</h2>
              <button type="button" disabled={!selectedProject} onClick={() => { setSuiteName(""); setSuiteDescription(""); setIsCreateSuiteOpen(true); }}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-40 transition-colors">
                <Plus size={12} /> New
              </button>
            </div>
            <div className="p-3 space-y-2">
              {!selectedProject ? (
                <p className="text-sm text-gray-400 px-2 py-3">{"Choisis d'abord un projet."}</p>
              ) : loadingSuites ? (
                <p className="text-sm text-gray-400 px-2 py-3">Chargement...</p>
              ) : testSuites.length === 0 ? (
                <p className="text-sm text-gray-400 px-2 py-3">Aucune suite trouvée.</p>
              ) : testSuites.map((suite) => {
                const active = selectedSuite?.id === suite.id;
                return (
                  <div key={suite.id} className={`rounded-xl border transition-colors ${active ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"}`}>
                    <div className="px-3 pt-3 pb-2">
                      <div className="text-sm font-semibold text-gray-800 truncate">{suite.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{suite.description || "Pas de description"}</div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 pb-3">
                      <IconBtn onClick={() => dispatch(setSelectedSuite(suite))} title={active ? "Suite active" : "Choisir"}
                        className={active ? "border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-700" : "hover:text-emerald-600 hover:border-emerald-200"}>
                        <CheckCheck size={13} />
                      </IconBtn>
                      <IconBtn onClick={() => { setEditingSuite(suite); setEditSuiteName(suite.name); setEditSuiteDescription(suite.description ?? ""); }} title="Modifier" className="hover:text-orange-500 hover:border-orange-200">
                        <Pencil size={13} />
                      </IconBtn>
                      <IconBtn onClick={() => handleDuplicateSuite(suite.id)} title="Dupliquer" className="hover:text-indigo-500 hover:border-indigo-200">
                        <Copy size={13} />
                      </IconBtn>
                      <IconBtn onClick={() => handleDeleteSuite(suite.id)} disabled={deletingSuite} title="Supprimer" className="hover:text-red-500 hover:border-red-200">
                        <Trash2 size={13} />
                      </IconBtn>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── TEST CASES PANEL ── */}
          <section className={`relative min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm ${casesColCls}`}>
            <button type="button" onClick={() => setCollapsedSuites(p => !p)}
              className="absolute -left-4 top-10 z-20 hidden xl:flex items-center justify-center h-8 w-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-blue-600 transition-colors">
              {collapsedSuites ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* toolbar */}
            <div className="px-5 py-4 border-b border-gray-50 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <FlaskConical size={15} className="text-blue-500" />
                <h2 className="text-sm font-bold text-gray-700 flex-1 truncate">
                  {selectedSuite ? selectedSuite.name : "Test Cases"}
                </h2>
                <button type="button" disabled={!selectedSuite} onClick={() => { resetCreate(); setIsCreateOpen(true); }}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 transition-colors">
                  <Plus size={12} /> New Test Case
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Recherche..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); resetPage(); }}
                  disabled={!selectedSuite}
                  className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 disabled:opacity-40"
                />
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); resetPage(); }} disabled={!selectedSuite}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-600 disabled:opacity-40 focus:outline-none">
                  <option value="ALL">Tous statuts</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="DEPRECATED">DEPRECATED</option>
                </select>
                <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); resetPage(); }} disabled={!selectedSuite}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-600 disabled:opacity-40 focus:outline-none">
                  <option value="ALL">Toutes priorités</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
                <select
                  value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); resetPage(); }}
                  disabled={!selectedSuite}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-600 disabled:opacity-40 focus:outline-none">
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                </select>
              </div>
            </div>

            {/* test case list */}
            <div className="p-4 space-y-3">
              {!selectedSuite ? (
                <p className="text-sm text-gray-400 py-6 text-center">Choisis une suite pour afficher ses cas de test.</p>
              ) : loadingTestCases ? (
                <p className="text-sm text-gray-400 py-6 text-center">Chargement...</p>
              ) : testCaseList.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">Aucun cas de test trouvé.</p>
              ) : (
                <>
                  {/* ── la liste vient directement du store, déjà paginée par le backend ── */}
                  {testCaseList.map((tc, idx) => {
                    const expanded = expandedId === tc.id;
                    return (
                      <div key={tc.id} className={`rounded-xl border transition-colors ${expanded ? "border-blue-200 bg-blue-50/30" : "border-gray-100 hover:border-gray-200"}`}>
                        <div className="flex items-start gap-3 p-4">
                          <span className="mt-1 text-xs font-bold text-gray-300 w-5 text-center shrink-0">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-800 truncate">{tc.title}</h3>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{tc.description || "Pas de description"}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <StatusBadge status={tc.status} />
                              <PriorityBadge priority={tc.priority} />
                              <span className="text-xs text-gray-400">{tc.steps?.length || 0} steps</span>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400">{new Date(tc.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <IconBtn onClick={() => setExpandedId(expanded ? null : tc.id)} title={expanded ? "Réduire" : "Voir"} className="hover:text-blue-600 hover:border-blue-200">
                              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </IconBtn>
                            <IconBtn onClick={() => openEditModal(tc)} title="Modifier" className="hover:text-orange-500 hover:border-orange-200">
                              <Pencil size={13} />
                            </IconBtn>
                            <IconBtn onClick={() => handleDuplicate(tc.id)} title="Dupliquer" className="hover:text-indigo-500 hover:border-indigo-200">
                              <Copy size={13} />
                            </IconBtn>
                            <IconBtn onClick={() => handleDelete(tc.id)} disabled={deleting} title="Supprimer" className="hover:text-red-500 hover:border-red-200">
                              <Trash2 size={13} />
                            </IconBtn>
                          </div>
                        </div>

                        {expanded && (
                          <div className="border-t border-blue-100 bg-white rounded-b-xl p-4 space-y-4">
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</p>
                                <p className="text-sm text-gray-700">{tc.description || "—"}</p>
                              </div>
                              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Expected Result</p>
                                <p className="text-sm text-gray-700">{tc.expected || "—"}</p>
                              </div>
                            </div>
                            {tc.steps?.length ? (
                              <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Test Steps</span>
                                  <span className="text-xs text-gray-400">Updated {new Date(tc.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-50/50">
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 w-10">#</th>
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Action</th>
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Expected</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tc.steps.map((step: TestStep) => (
                                      <tr key={step.id} className="border-t border-gray-50">
                                        <td className="px-4 py-2 text-gray-400 text-xs">{step.stepOrder}</td>
                                        <td className="px-4 py-2 text-gray-700">{step.action}</td>
                                        <td className="px-4 py-2 text-gray-500">{step.expected || "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">Aucun step.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ── pagination UI — branché sur total/totalPages du store ── */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-400">{total} résultat(s)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                      >
                        Précédent
                      </button>
                      <span className="text-xs text-gray-500 font-medium">{currentPage} / {totalPages}</span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* ══ MODALS ══ */}
        <Modal open={isCreateSuiteOpen} onClose={() => setIsCreateSuiteOpen(false)} title="Créer une suite de tests">
          <form onSubmit={handleCreateSuite} className="space-y-4">
            <Field label="Nom de la suite"><input type="text" value={suiteName} onChange={e => setSuiteName(e.target.value)} className={inputCls} required /></Field>
            <Field label="Description"><textarea value={suiteDescription} onChange={e => setSuiteDescription(e.target.value)} className={inputCls} rows={3} /></Field>
            <ModalFooter onCancel={() => setIsCreateSuiteOpen(false)} loading={creatingSuite} label="Créer" />
          </form>
        </Modal>

        <Modal open={!!editingSuite} onClose={() => setEditingSuite(null)} title="Modifier la suite">
          <form onSubmit={handleUpdateSuite} className="space-y-4">
            <Field label="Nom de la suite"><input type="text" value={editSuiteName} onChange={e => setEditSuiteName(e.target.value)} className={inputCls} required /></Field>
            <Field label="Description"><textarea value={editSuiteDescription} onChange={e => setEditSuiteDescription(e.target.value)} className={inputCls} rows={3} /></Field>
            <ModalFooter onCancel={() => setEditingSuite(null)} loading={updatingSuite} label="Enregistrer" />
          </form>
        </Modal>

        <Modal open={isCreateOpen} onClose={() => { setIsCreateOpen(false); resetCreate(); }} title="Nouveau test case" wide>
          <form onSubmit={handleCreateTestCase} className="space-y-4">
            <Field label="Titre"><input type="text" value={createTitle} onChange={e => setCreateTitle(e.target.value)} className={inputCls} required /></Field>
            <Field label="Description"><textarea value={createDescription} onChange={e => setCreateDescription(e.target.value)} className={inputCls} rows={2} /></Field>
            <Field label="Expected global result"><textarea value={createExpected} onChange={e => setCreateExpected(e.target.value)} className={inputCls} rows={2} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Statut">
                <select value={createStatus} onChange={e => setCreateStatus(e.target.value as any)} className={selectCls}>
                  <option value="DRAFT">DRAFT</option><option value="READY">READY</option><option value="DEPRECATED">DEPRECATED</option>
                </select>
              </Field>
              <Field label="Priorité">
                <select value={createPriority} onChange={e => setCreatePriority(e.target.value as any)} className={selectCls}>
                  <option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option>
                </select>
              </Field>
            </div>
            <StepBlock steps={createSteps} onChange={stepChange(setCreateSteps)} onAdd={addStep(setCreateSteps)} onRemove={removeStep(setCreateSteps)} />
            <ModalFooter onCancel={() => { setIsCreateOpen(false); resetCreate(); }} loading={creating} label="Créer" />
          </form>
        </Modal>

        <Modal open={!!editingTestCase} onClose={closeEditModal} title="Modifier le test case" wide>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Field label="Titre"><input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className={inputCls} required /></Field>
            <Field label="Description"><textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className={inputCls} rows={2} /></Field>
            <Field label="Expected global result"><textarea value={editExpected} onChange={e => setEditExpected(e.target.value)} className={inputCls} rows={2} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Statut">
                <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className={selectCls}>
                  <option value="DRAFT">DRAFT</option><option value="READY">READY</option><option value="DEPRECATED">DEPRECATED</option>
                </select>
              </Field>
              <Field label="Priorité">
                <select value={editPriority} onChange={e => setEditPriority(e.target.value as any)} className={selectCls}>
                  <option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option>
                </select>
              </Field>
            </div>
            <StepBlock steps={editSteps} onChange={stepChange(setEditSteps)} onAdd={addStep(setEditSteps)} onRemove={removeStep(setEditSteps)} />
            <ModalFooter onCancel={closeEditModal} loading={updating} label="Enregistrer" />
          </form>
        </Modal>
      </div>
    </div>
  );
}