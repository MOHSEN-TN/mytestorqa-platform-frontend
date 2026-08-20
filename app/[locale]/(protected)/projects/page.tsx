/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  createProject,
  deleteProject,
  duplicateProject,
  fetchProjects,
  setSelectedProject,
  updateProject,
} from "@/lib/slices/projectSlice";
import {
  Eye,
  Edit,
  X,
  Plus,
  Upload,
  Settings,
  Copy,
  CheckCheck,
  AlertCircle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Modal } from "@/components/projects/Modal";
import {
  exportProjectsXlsx,
  importProjectsXlsx,
  previewProjectImport,
  type ProjectImportPreview,
  type ProjectImportResult,
} from "@/lib/project-transfer-api";

export default function ProjectsPage() {
  const { t } = useTranslation("projects");
  const dispatch = useAppDispatch();

  const {
    projects,
    loading,
    creating,
    updating,
    deleting,
    error,
    selectedProject,
    pagination,
  } = useAppSelector((s) => s.projects);

  const [showNewModal, setShowNewModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [search, setSearch] = useState("");

  const [editingProject, setEditingProject] = useState<{
    id: string;
    name: string;
    description?: string | null;
    baseUrl?: string | null;
  } | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDesc, setEditProjectDesc] = useState("");
  const [editProjectUrl, setEditProjectUrl] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] =
    useState<ProjectImportPreview | null>(null);
  const [importResult, setImportResult] =
    useState<ProjectImportResult | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        fetchProjects({
          name: search || undefined,
          page,
          limit: limit === -1 ? pagination.total : limit,
        })
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [search, page, limit, dispatch, pagination.total]);

  useEffect(() => {
    if (error && showNewModal) {
      setCreateError(error);
    }
  }, [error, showNewModal]);

  useEffect(() => {
    if (error && editingProject) {
      setEditError(error);
    }
  }, [error, editingProject]);

  const closeNewModal = () => {
    setShowNewModal(false);
    setCreateError(null);
    setProjectName("");
    setProjectDesc("");
    setProjectUrl("");
  };

  const closeEditModal = () => {
    setEditingProject(null);
    setEditProjectName("");
    setEditProjectDesc("");
    setEditProjectUrl("");
    setEditError(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const trimmed = projectName.trim();

    if (!trimmed) return;

    const res = await dispatch(
      createProject({
        name: trimmed,
        description: projectDesc.trim(),
        baseUrl: projectUrl.trim(),
      })
    );

    if (createProject.fulfilled.match(res)) {
      closeNewModal();
      dispatch(fetchProjects({ page, limit }));
    } else {
      setCreateError(
        (res as any)?.payload?.message ||
          (res as any)?.payload ||
          (res as any)?.error?.message ||
          t("modal.defaultError")
      );
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editingProject) return;

    const trimmed = editProjectName.trim();

    if (!trimmed) return;

    const res = await dispatch(
      updateProject({
        projectId: editingProject.id,
        name: trimmed,
        description: editProjectDesc.trim(),
        baseUrl: editProjectUrl.trim(),
      })
    );

    if (updateProject.fulfilled.match(res)) {
      closeEditModal();
      dispatch(fetchProjects({ page, limit }));
    } else {
      setEditError(
        (res as any)?.payload?.message ||
          (res as any)?.payload ||
          (res as any)?.error?.message ||
          t("modal.defaultEditError")
      );
    }
  };

  const handleDuplicate = async (id: string) => {
    const res = await dispatch(duplicateProject(id));

    if (duplicateProject.fulfilled.match(res)) {
      dispatch(fetchProjects({ page, limit }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;

    const res = await dispatch(deleteProject(id));

    if (deleteProject.fulfilled.match(res)) {
      dispatch(fetchProjects({ page, limit }));
    }
  };

  const refreshProjects = () => {
    void dispatch(
      fetchProjects({
        name: search || undefined,
        page,
        limit: limit === -1 ? pagination.total : limit,
      }),
    );
  };

  const handleProjectExport = async () => {
    try {
      setExporting(true);
      await exportProjectsXlsx();
    } catch (exportError) {
      window.alert(
        exportError instanceof Error
          ? exportError.message
          : "Impossible d’exporter les projets.",
      );
    } finally {
      setExporting(false);
    }
  };

  const resetImportState = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
    setImportError(null);
    setImportLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportFileSelection = async (
    file: File,
  ) => {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setImportError(
        "Le fichier doit être au format XLSX (.xlsx).",
      );
      return;
    }

    try {
      setImportLoading(true);
      setImportError(null);
      setImportResult(null);
      setImportFile(file);

      const preview = await previewProjectImport(file);
      setImportPreview(preview);
    } catch (previewError) {
      setImportPreview(null);
      setImportError(
        previewError instanceof Error
          ? previewError.message
          : "Impossible d’analyser le fichier d’import.",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const confirmProjectImport = async () => {
    if (!importFile || !importPreview) {
      return;
    }

    const readyProjects = importPreview.projects.filter(
      (project) => project.status === "READY",
    );

    if (readyProjects.length === 0) {
      setImportError(
        "Aucun nouveau projet valide n’est disponible pour l’import.",
      );
      return;
    }

    try {
      setImportLoading(true);
      setImportError(null);

      const result = await importProjectsXlsx(importFile);
      setImportResult(result);

      refreshProjects();
    } catch (importExecutionError) {
      setImportError(
        importExecutionError instanceof Error
          ? importExecutionError.message
          : "Impossible d’importer les projets.",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const currentLimit = limit === -1 ? pagination.total : limit;
  const startItem = pagination.total > 0 ? (page - 1) * currentLimit + 1 : 0;
  const endItem = Math.min(page * currentLimit, pagination.total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={15} />
          {t("toolbar.add")}
        </button>

        <button
          type="button"
          onClick={() => void handleProjectExport()}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={15} />
          {exporting ? "Export..." : t("toolbar.export")}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importLoading}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload size={15} />
          {importLoading ? "Analyse..." : t("toolbar.import")}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              void handleImportFileSelection(file);
            }
          }}
        />

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          <Settings size={15} />
          {t("toolbar.settings")}
        </button>

        <div className="relative ml-auto">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder={t("toolbar.search")}
            className="w-56 rounded-lg border border-gray-200 py-2 pl-8 pr-4 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
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
                {(["name", "description", "baseUrl", "actions"] as const).map(
                  (col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {col === "baseUrl" ? "URL" : t(`table.${col}`)}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {projects.map((project, index) => (
                <tr
                  key={project.id}
                  className={`transition-colors hover:bg-gray-50 ${
                    index !== projects.length - 1
                      ? "border-b border-gray-50"
                      : ""
                  } ${
                    selectedProject?.id === project.id ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {project.name}
                  </td>

                  <td className="max-w-xs truncate px-6 py-4 text-gray-500">
                    {project.description?.trim() || "—"}
                  </td>

                  <td className="max-w-xs px-6 py-4 text-gray-500">
                    {project.baseUrl ? (
                      <a
                        href={project.baseUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block max-w-[260px] truncate text-blue-600 hover:underline"
                        title={project.baseUrl}
                      >
                        {project.baseUrl}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => dispatch(setSelectedProject(project))}
                        title={
                          selectedProject?.id === project.id
                            ? "Projet actif"
                            : "Choisir"
                        }
                        className={`rounded-lg border p-2 transition-colors ${
                          selectedProject?.id === project.id
                            ? "border-blue-400 bg-blue-50 text-blue-600"
                            : "border-gray-200 text-gray-400 hover:border-blue-200 hover:text-blue-500"
                        }`}
                      >
                        <CheckCheck size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => dispatch(setSelectedProject(project))}
                        className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-blue-200 hover:text-blue-500"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(project);
                          setEditProjectName(project.name);
                          setEditProjectDesc(project.description ?? "");
                          setEditProjectUrl(project.baseUrl ?? "");
                          setEditError(null);
                        }}
                        className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-orange-200 hover:text-orange-500"
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(project.id)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-indigo-200 hover:text-indigo-500"
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(project.id)}
                        disabled={deleting}
                        className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-red-200 hover:text-red-500 disabled:opacity-40"
                      >
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

      <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{t("pagination.show")}</span>

          <select
            value={limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value={5}>{t("pagination.perPage5")}</option>
            <option value={15}>{t("pagination.perPage15")}</option>
            <option value={-1}>{t("pagination.showAll")}</option>
          </select>

          <p className="text-sm text-gray-500">
            {pagination.total > 0
              ? t("pagination.summary", {
                  start: startItem,
                  end: endItem,
                  total: pagination.total,
                })
              : t("pagination.empty")}
          </p>
        </div>

        {limit !== -1 && pagination.totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              {t("pagination.previous")}
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - page) <= 1
              )
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p as number)}
                    className={`h-8 w-8 rounded-lg border text-sm transition-colors ${
                      page === p
                        ? "border-blue-600 bg-blue-600 font-medium text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              type="button"
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("pagination.next")}
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {(importPreview || importError || importResult) && (
        <Modal open onClose={resetImportState}>
          <div className="max-h-[80vh] overflow-y-auto p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Importer des projets
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {importFile?.name ?? "Fichier XLSX"}
                </p>
              </div>

              <button
                type="button"
                onClick={resetImportState}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {importLoading && !importPreview && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-600">
                Analyse du fichier en cours...
              </div>
            )}

            {importError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle
                  size={15}
                  className="mt-0.5 shrink-0 text-red-500"
                />
                <p className="text-sm text-red-600">
                  {importError}
                </p>
              </div>
            )}

            {importPreview && !importResult && (
              <>
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Projets", importPreview.projectsFound],
                    ["Suites", importPreview.suitesFound],
                    ["Cas de test", importPreview.testCasesFound],
                    ["Steps", importPreview.stepsFound],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <p className="text-xs text-gray-500">
                        {label}
                      </p>
                      <p className="mt-1 text-xl font-bold text-gray-800">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {importPreview.errors.length > 0 && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="mb-2 text-sm font-semibold text-red-700">
                      Erreurs du fichier
                    </p>
                    <ul className="space-y-1 text-xs text-red-600">
                      {importPreview.errors.map((message) => (
                        <li key={message}>• {message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="overflow-hidden rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-4 py-3">Projet</th>
                        <th className="px-4 py-3">Contenu</th>
                        <th className="px-4 py-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.projects.map((project) => (
                        <tr
                          key={project.projectKey}
                          className="border-t border-gray-100"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">
                              {project.name}
                            </p>
                            {project.message && (
                              <p className="mt-1 max-w-md text-xs text-gray-500">
                                {project.message}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3 text-xs text-gray-500">
                            {project.suites} suites ·{" "}
                            {project.testCases} cas ·{" "}
                            {project.steps} steps
                          </td>

                          <td className="px-4 py-3">
                            {project.status === "READY" && (
                              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                Prêt
                              </span>
                            )}

                            {project.status ===
                              "PROJECT_ALREADY_EXISTS" && (
                              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                                Existe déjà
                              </span>
                            )}

                            {project.status === "INVALID" && (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                                Invalide
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    {
                      importPreview.projects.filter(
                        (project) => project.status === "READY",
                      ).length
                    }{" "}
                    projet(s) seront importés.
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetImportState}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
                      onClick={() => void confirmProjectImport()}
                      disabled={
                        importLoading ||
                        !importPreview.valid ||
                        !importPreview.projects.some(
                          (project) =>
                            project.status === "READY",
                        )
                      }
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {importLoading
                        ? "Import en cours..."
                        : "Confirmer l’import"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {importResult && (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="font-semibold text-green-700">
                    Import terminé
                  </p>
                  <p className="mt-1 text-sm text-green-600">
                    {importResult.imported.length} projet(s)
                    importé(s) avec succès.
                  </p>
                </div>

                {importResult.imported.length > 0 && (
                  <div className="rounded-lg border border-gray-100">
                    {importResult.imported.map((project) => (
                      <div
                        key={project.projectId}
                        className="border-b border-gray-100 px-4 py-3 last:border-b-0"
                      >
                        <p className="font-medium text-gray-800">
                          {project.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {project.suites} suites ·{" "}
                          {project.testCases} cas ·{" "}
                          {project.steps} steps
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {importResult.skipped.length > 0 && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-orange-700">
                      Projets ignorés
                    </p>
                    {importResult.skipped.map((project) => (
                      <p
                        key={project.projectKey}
                        className="text-xs text-orange-600"
                      >
                        • {project.name} : {project.message}
                      </p>
                    ))}
                  </div>
                )}

                {importResult.errors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-red-700">
                      Erreurs
                    </p>
                    {importResult.errors.map((message) => (
                      <p
                        key={message}
                        className="text-xs text-red-600"
                      >
                        • {message}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetImportState}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showNewModal && (
        <Modal open={showNewModal} onClose={closeNewModal}>
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {t("modal.addTitle")}
              </h2>

              <button
                type="button"
                onClick={closeNewModal}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                {
                  key: "projectName",
                  label: "modal.name",
                  val: projectName,
                  set: (value: string) => {
                    setProjectName(value);
                    setCreateError(null);
                  },
                },
                {
                  key: "projectDesc",
                  label: "modal.description",
                  val: projectDesc,
                  set: setProjectDesc,
                },
              ].map(({ key, label, val, set }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {t(label)}
                  </label>

                  <input
                    type="text"
                    value={val}
                    onChange={(event) => set(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required={key === "projectName"}
                  />
                </div>
              ))}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  URL du projet
                </label>

                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => {
                    setProjectUrl(e.target.value);
                    setCreateError(null);
                  }}
                  placeholder="https://exemple.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-gray-400">
                  URL principale utilisée plus tard par Lighthouse.
                </p>
              </div>

              {createError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-red-500"
                  />
                  <p className="text-sm text-red-600">{createError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeNewModal}
                  className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  <X size={14} />
                  {t("modal.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {creating ? t("modal.saving") : t("modal.save")}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {editingProject && (
        <Modal open={!!editingProject} onClose={closeEditModal}>
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {t("modal.editTitle")}
              </h2>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t("modal.name")}
                </label>

                <input
                  type="text"
                  value={editProjectName}
                  onChange={(e) => {
                    setEditProjectName(e.target.value);
                    setEditError(null);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t("modal.description")}
                </label>

                <input
                  type="text"
                  value={editProjectDesc}
                  onChange={(e) => {
                    setEditProjectDesc(e.target.value);
                    setEditError(null);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  URL du projet
                </label>

                <input
                  type="url"
                  value={editProjectUrl}
                  onChange={(e) => {
                    setEditProjectUrl(e.target.value);
                    setEditError(null);
                  }}
                  placeholder="https://exemple.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-gray-400">
                  URL principale utilisée plus tard par Lighthouse.
                </p>
              </div>

              {editError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-red-500"
                  />
                  <p className="text-sm text-red-600">{editError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  <X size={14} />
                  {t("modal.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? t("modal.saving") : t("modal.save")}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}