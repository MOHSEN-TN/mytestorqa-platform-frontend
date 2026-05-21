/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  createProject,
  deleteProject,
  duplicateProject,
  fetchProjects,
  setSelectedProject,
  updateProject,
} from "@/lib/slices/projectSlice";
import { Eye, Edit, X, Plus, Upload, Settings, Copy, CheckCheck, AlertCircle } from "lucide-react";

// Status badge helper
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    Actif: { label: "Actif", className: "bg-green-100 text-green-700" },
    "En cours": { label: "En cours", className: "bg-orange-100 text-orange-700" },
    Planifié: { label: "Planifié", className: "bg-gray-100 text-gray-600" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

// Modal overlay
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const { projects, loading, creating, updating, deleting, error, selectedProject } =
    useAppSelector((state) => state.projects);

  // New project form
  const [showNewModal, setShowNewModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectOwner, setProjectOwner] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [projectAI, setProjectAI] = useState("");

  // Edit
  const [editingProject, setEditingProject] = useState<{ id: string; name: string } | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Sync redux error into modal error when creating
  useEffect(() => {
    if (error && showNewModal) {
      setCreateError(error);
    }
  }, [error, showNewModal]);

  // Sync redux error into edit modal error
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
    setProjectOwner("");
    setProjectStatus("");
    setProjectAI("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const trimmedName = projectName.trim();
    if (!trimmedName) return;
    const resultAction = await dispatch(createProject({ name: trimmedName }));
    if (createProject.fulfilled.match(resultAction)) {
      closeNewModal();
      dispatch(fetchProjects());
    } else {
      // Show error from rejected action payload inside the modal
      const errMsg =
        (resultAction as any)?.payload?.message ||
        (resultAction as any)?.error?.message ||
        "Impossible de créer le projet.";
      setCreateError(errMsg);
    }
  };

  const closeEditModal = () => {
    setEditingProject(null);
    setEditProjectName("");
    setEditError(null);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!editingProject) return;
    const trimmedName = editProjectName.trim();
    if (!trimmedName) return;
    const resultAction = await dispatch(updateProject({ projectId: editingProject.id, name: trimmedName }));
    if (updateProject.fulfilled.match(resultAction)) {
      closeEditModal();
      dispatch(fetchProjects());
    } else {
      const errMsg =
        (resultAction as any)?.payload?.message ||
        (resultAction as any)?.error?.message ||
        "Impossible de modifier le projet.";
      setEditError(errMsg);
    }
  };

  const handleDuplicate = async (projectId: string) => {
    const resultAction = await dispatch(duplicateProject(projectId));
    if (duplicateProject.fulfilled.match(resultAction)) dispatch(fetchProjects());
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm("Supprimer ce projet ?")) return;
    const resultAction = await dispatch(deleteProject(projectId));
    if (deleteProject.fulfilled.match(resultAction)) dispatch(fetchProjects());
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <p className="text-sm text-gray-500">
          Liste des projets : chaque projet contient un nom et une description.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          Ajouter projet
        </button>
        <button className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
          <Upload size={15} />
          Importer
        </button>
        <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
          <Settings size={15} />
          Settings
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Chargement...</p>
        ) : projects.length === 0 ? (
          <p className="p-6 text-gray-500">Aucun projet trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Nom du projet</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Description</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, i) => (
                <tr
                  key={project.id}
                  className={`transition-colors hover:bg-gray-50 ${
                    i !== projects.length - 1 ? "border-b border-gray-50" : ""
                  } ${selectedProject?.id === project.id ? "bg-blue-50" : ""}`}
                >
                  <td className="px-6 py-4 font-medium text-gray-800">{project.name}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                    {(project as any).description ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={(project as any).status ?? "Actif"} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dispatch(setSelectedProject(project))}
                        title={selectedProject?.id === project.id ? "Projet actif" : "Choisir"}
                        className={`p-2 rounded-lg border transition-colors ${
                          selectedProject?.id === project.id
                            ? "border-blue-400 bg-blue-50 text-blue-600"
                            : "border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200"
                        }`}
                      >
                        <CheckCheck size={14} />
                      </button>
                      <button
                        onClick={() => dispatch(setSelectedProject(project))}
                        title="Voir"
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => { setEditingProject(project); setEditProjectName(project.name); setEditError(null); }}
                        title="Modifier"
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-orange-500 hover:border-orange-200 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(project.id)}
                        title="Dupliquer"
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deleting}
                        title="Supprimer"
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40"
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

      {/* ── New Project Modal ── */}
      <Modal open={showNewModal} onClose={closeNewModal}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Ajouter un nouveau projet</h2>
            <button
              onClick={closeNewModal}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom du projet</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => { setProjectName(e.target.value); setCreateError(null); }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description courte</label>
              <input
                type="text"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Responsable / Owner</label>
              <input
                type="text"
                value={projectOwner}
                onChange={(e) => setProjectOwner(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Statut du projet</label>
              <input
                type="text"
                value={projectStatus}
                onChange={(e) => setProjectStatus(e.target.value)}
                placeholder="Actif, En cours, Planifié..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Options QA / IA</label>
              <input
                type="text"
                value={projectAI}
                onChange={(e) => setProjectAI(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            {/* ── Error inside the modal ── */}
            {createError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{createError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeNewModal}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                <X size={14} />
                Annuler
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {creating ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={!!editingProject} onClose={closeEditModal}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Modifier le projet</h2>
            <button
              onClick={closeEditModal}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom du projet</label>
              <input
                type="text"
                value={editProjectName}
                onChange={(e) => { setEditProjectName(e.target.value); setEditError(null); }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                required
              />
            </div>

            {/* ── Error inside the edit modal ── */}
            {editError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{editError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                <X size={14} />
                Annuler
              </button>
              <button
                type="submit"
                disabled={updating}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {updating ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}