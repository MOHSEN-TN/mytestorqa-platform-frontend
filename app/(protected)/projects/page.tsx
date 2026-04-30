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

export default function ProjectsPage() {
  const dispatch = useAppDispatch();

  const {
    projects,
    loading,
    creating,
    updating,
    deleting,
    error,
    selectedProject,
  } = useAppSelector((state) => state.projects);

  const [projectName, setProjectName] = useState("");

  const [editingProject, setEditingProject] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editProjectName, setEditProjectName] = useState("");

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = projectName.trim();
    if (!trimmedName) return;

    const resultAction = await dispatch(createProject({ name: trimmedName }));

    if (createProject.fulfilled.match(resultAction)) {
      setProjectName("");
      dispatch(fetchProjects());
    }
  };

  const openEditModal = (project: { id: string; name: string }) => {
    setEditingProject(project);
    setEditProjectName(project.name);
  };

  const closeEditModal = () => {
    setEditingProject(null);
    setEditProjectName("");
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();

    if (!editingProject) return;

    const trimmedName = editProjectName.trim();
    if (!trimmedName) return;

    const resultAction = await dispatch(
      updateProject({
        projectId: editingProject.id,
        name: trimmedName,
      })
    );

    if (updateProject.fulfilled.match(resultAction)) {
      closeEditModal();
      dispatch(fetchProjects());
    }
  };

  const handleDuplicate = async (projectId: string) => {
    const resultAction = await dispatch(duplicateProject(projectId));

    if (duplicateProject.fulfilled.match(resultAction)) {
      dispatch(fetchProjects());
    }
  };

  const handleDelete = async (projectId: string) => {
    const confirmed = window.confirm("Supprimer ce projet ?");
    if (!confirmed) return;

    const resultAction = await dispatch(deleteProject(projectId));

    if (deleteProject.fulfilled.match(resultAction)) {
      dispatch(fetchProjects());
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-sm text-gray-600">
          Gérer les projets : ajout, modification, duplication, suppression.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Ajouter un nouveau projet</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Nom du projet"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="flex-1 rounded-md border px-4 py-2"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {creating ? "Ajout..." : "Ajouter"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Liste des projets</h2>

        {loading ? (
          <p>Chargement...</p>
        ) : projects.length === 0 ? (
          <p>Aucun projet trouvé.</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`rounded-lg border p-4 ${
                  selectedProject?.id === project.id ? "border-blue-600" : ""
                }`}
              >
                <h3 className="break-words text-2xl font-semibold">{project.name}</h3>

                {project.createdAt && (
                  <p className="text-sm text-gray-500">
                    Créé le : {new Date(project.createdAt).toLocaleString()}
                  </p>
                )}

                {project.members?.length ? (
                  <div className="mt-3">
                    <p className="font-medium">Membres :</p>
                    <ul className="list-disc pl-5">
                      {project.members.map((member, index) => (
                        <li key={`${member.email}-${index}`}>
                          {member.email} — {member.role}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => dispatch(setSelectedProject(project))}
                    className="rounded-md bg-slate-700 px-4 py-2 text-white"
                  >
                    {selectedProject?.id === project.id ? "Projet actif" : "Choisir"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(project)}
                    className="rounded-md bg-yellow-500 px-4 py-2 text-white"
                  >
                    Modify
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(project.id)}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-white"
                  >
                    Duplicate
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    disabled={deleting}
                    className="rounded-md bg-red-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Modifier le projet</h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded border px-3 py-1"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                placeholder="Nom du projet"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                className="w-full rounded border px-4 py-2"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded border px-4 py-2"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {updating ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}