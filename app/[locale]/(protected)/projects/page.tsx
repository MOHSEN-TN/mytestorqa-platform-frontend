/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useRef, useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  createProject, deleteProject, duplicateProject,
  fetchProjects, setSelectedProject, updateProject,
} from "@/lib/slices/projectSlice";
import {
  Eye, Edit, X, Plus, Upload, Settings, Copy,
  CheckCheck, AlertCircle, Search, Download, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, t }: { status: string; t: any }) {
  const map: Record<string, string> = {
    Actif:     "bg-green-100 text-green-700",
    "En cours":"bg-orange-100 text-orange-700",
    Planifié:  "bg-gray-100 text-gray-600",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-500";
  const label = t(`status.${status}`) ?? status;
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { t } = useTranslation("projects");
  const dispatch = useAppDispatch();
  const { projects, loading, creating, updating, deleting, error, selectedProject, pagination } =
    useAppSelector((s) => s.projects);

  const [showNewModal, setShowNewModal] = useState(false);
  const [createError, setCreateError]   = useState<string | null>(null);
  const [projectName, setProjectName]   = useState("");
  const [projectDesc, setProjectDesc]   = useState("");
  const [projectOwner, setProjectOwner] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [projectAI, setProjectAI]       = useState("");
  const [search, setSearch]             = useState("");

  const [editingProject, setEditingProject]     = useState<{ id: string; name: string } | null>(null);
  const [editProjectName, setEditProjectName]   = useState("");
  const [editError, setEditError]               = useState<string | null>(null);

  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(5);

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchProjects({ name: search || undefined, page, limit: limit === -1 ? pagination.total : limit }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search, page, limit, dispatch]);

  // Sync redux errors → modal errors
  useEffect(() => { if (error && showNewModal)    setCreateError(error); }, [error, showNewModal]);
  useEffect(() => { if (error && editingProject)  setEditError(error);   }, [error, editingProject]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const closeNewModal = () => {
    setShowNewModal(false); setCreateError(null);
    setProjectName(""); setProjectDesc(""); setProjectOwner(""); setProjectStatus(""); setProjectAI("");
  };

  const closeEditModal = () => { setEditingProject(null); setEditProjectName(""); setEditError(null); };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); };
  const handleLimitChange  = (v: number) => { setLimit(v); setPage(1); };

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setCreateError(null);
    const trimmed = projectName.trim();
    if (!trimmed) return;
    const res = await dispatch(createProject({ name: trimmed }));
    if (createProject.fulfilled.match(res)) { closeNewModal(); dispatch(fetchProjects()); }
    else setCreateError((res as any)?.payload?.message || (res as any)?.error?.message || t("modal.defaultError"));
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault(); setEditError(null);
    if (!editingProject) return;
    const trimmed = editProjectName.trim();
    if (!trimmed) return;
    const res = await dispatch(updateProject({ projectId: editingProject.id, name: trimmed }));
    if (updateProject.fulfilled.match(res)) { closeEditModal(); dispatch(fetchProjects()); }
    else setEditError((res as any)?.payload?.message || (res as any)?.error?.message || t("modal.defaultEditError"));
  };

  const handleDuplicate = async (id: string) => {
    const res = await dispatch(duplicateProject(id));
    if (duplicateProject.fulfilled.match(res)) dispatch(fetchProjects());
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    const res = await dispatch(deleteProject(id));
    if (deleteProject.fulfilled.match(res)) dispatch(fetchProjects());
  };

  // ── Export / Import ───────────────────────────────────────────────────────
  const handleExport = () => {
    const cols = ["id", "name", "description", "status"] as const;
    const csv = [cols.join(","), ...projects.map((p) =>
      cols.map((c) => JSON.stringify(String((p as any)[c] ?? ""))).join(",")
    )].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "projets.csv"; a.click();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const vals = line.match(/(".*?"|[^,]+)/g) ?? [];
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = (vals[i] ?? "").replace(/"/g, "").trim()));
      return obj;
    }).filter((r) => r.name);
  };

  const handleImportFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const text = await file.text();
    let data: Record<string, string>[];
    try {
      data = ext === "json" ? JSON.parse(text) : ext === "csv" ? parseCSV(text) : (() => { throw new Error(); })();
    } catch { alert(t("import.invalid")); return; }

    const validRows = data.filter((r) => r.name?.trim());
    if (!validRows.length) { alert(t("import.noValid")); return; }

    const existingNames = new Set(projects.map((p) => p.name.trim().toLowerCase()));
    const duplicates: string[] = [];
    const toImport: Record<string, string>[] = [];
    for (const row of validRows) {
      (existingNames.has(row.name.trim().toLowerCase()) ? duplicates : toImport).push(row as any);
    }

    let msg = "";
    if (duplicates.length) {
      msg += t("import.duplicateWarning", { count: duplicates.length }) +
        "\n" + (duplicates as any[]).map((d: any) => `  • ${typeof d === "string" ? d : d.name}`).join("\n") + "\n\n";
    }
    if (!toImport.length) { alert(msg + t("import.nothingNew")); return; }
    msg += t("import.confirmImport", { count: toImport.length });
    if (!window.confirm(msg)) return;
    for (const row of toImport) await dispatch(createProject({ name: row.name.trim() }));
    dispatch(fetchProjects());
  };

  // ── Pagination display ────────────────────────────────────────────────────
  const currentLimit = limit === -1 ? pagination.total : limit;
  const startItem    = (page - 1) * currentLimit + 1;
  const endItem      = Math.min(page * currentLimit, pagination.total);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus size={15} />{t("toolbar.add")}
        </button>
        <button onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors">
          <Download size={15} />{t("toolbar.export")}
        </button>
        <button onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
          <Upload size={15} />{t("toolbar.import")}
        </button>
        <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleImportFile(e.target.files[0]); }} />
        <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
          <Settings size={15} />{t("toolbar.settings")}
        </button>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={handleSearchChange}
            placeholder={t("toolbar.search")}
            className="pl-8 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-56" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">{t("loading")}</p>
        ) : projects.length === 0 ? (
          <p className="p-6 text-gray-500">
            {search ? t("empty.search", { search }) : t("empty.default")}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {(["name","description","status","actions"] as const).map((col) => (
                  <th key={col} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t(`table.${col}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((project, i) => (
                <tr key={project.id}
                  className={`transition-colors hover:bg-gray-50 ${i !== projects.length - 1 ? "border-b border-gray-50" : ""} ${selectedProject?.id === project.id ? "bg-blue-50" : ""}`}>
                  <td className="px-6 py-4 font-medium text-gray-800">{project.name}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{(project as any).description ?? "—"}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={(project as any).status ?? "Actif"} t={t} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Select */}
                      <button onClick={() => dispatch(setSelectedProject(project))} title={selectedProject?.id === project.id ? "Projet actif" : "Choisir"}
                        className={`p-2 rounded-lg border transition-colors ${selectedProject?.id === project.id ? "border-blue-400 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200"}`}>
                        <CheckCheck size={14} />
                      </button>
                      {/* View */}
                      <button onClick={() => dispatch(setSelectedProject(project))}
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-colors">
                        <Eye size={14} />
                      </button>
                      {/* Edit */}
                      <button onClick={() => { setEditingProject(project); setEditProjectName(project.name); setEditError(null); }}
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-orange-500 hover:border-orange-200 transition-colors">
                        <Edit size={14} />
                      </button>
                      {/* Duplicate */}
                      <button onClick={() => handleDuplicate(project.id)}
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors">
                        <Copy size={14} />
                      </button>
                      {/* Delete */}
                      <button onClick={() => handleDelete(project.id)} disabled={deleting}
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-3 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{t("pagination.show")}</span>
          <select value={limit} onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="text-sm rounded-lg border border-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
            <option value={5}>{t("pagination.perPage5")}</option>
            <option value={15}>{t("pagination.perPage15")}</option>
            <option value={-1}>{t("pagination.showAll")}</option>
          </select>
          <p className="text-sm text-gray-500">
            {pagination.total > 0
              ? t("pagination.summary", { start: startItem, end: endItem, total: pagination.total })
              : t("pagination.empty")}
          </p>
        </div>

        {limit !== -1 && pagination.totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={15} />{t("pagination.previous")}
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p); return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`e-${idx}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    className={`w-8 h-8 text-sm rounded-lg border transition-colors ${page === p ? "bg-blue-600 border-blue-600 text-white font-medium" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {p}
                  </button>
                )
              )}

            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
              className="flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {t("pagination.next")}<ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── New Project Modal ── */}
      <Modal open={showNewModal} onClose={closeNewModal}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">{t("modal.addTitle")}</h2>
            <button onClick={closeNewModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "projectName",   label: "modal.name",        val: projectName,   set: (v: string) => { setProjectName(v); setCreateError(null); } },
              { key: "projectDesc",   label: "modal.description",  val: projectDesc,   set: setProjectDesc },
              { key: "projectOwner",  label: "modal.owner",        val: projectOwner,  set: setProjectOwner },
              { key: "projectStatus", label: "modal.status",       val: projectStatus, set: setProjectStatus, placeholder: "modal.statusPlaceholder" },
              { key: "projectAI",     label: "modal.ai",           val: projectAI,     set: setProjectAI },
            ].map(({ key, label, val, set, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t(label)}</label>
                <input type="text" value={val} onChange={(e) => set(e.target.value)}
                  placeholder={placeholder ? t(placeholder) : undefined}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  required={key === "projectName"} />
              </div>
            ))}
            {createError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{createError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeNewModal}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
                <X size={14} />{t("modal.cancel")}
              </button>
              <button type="submit" disabled={creating}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                {creating ? t("modal.saving") : t("modal.save")}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={!!editingProject} onClose={closeEditModal}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">{t("modal.editTitle")}</h2>
            <button onClick={closeEditModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("modal.name")}</label>
              <input type="text" value={editProjectName}
                onChange={(e) => { setEditProjectName(e.target.value); setEditError(null); }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                required />
            </div>
            {editError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{editError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeEditModal}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
                <X size={14} />{t("modal.cancel")}
              </button>
              <button type="submit" disabled={updating}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                {updating ? t("modal.saving") : t("modal.save")}
              </button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
}