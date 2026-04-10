"use client";

import { useEffect, useState } from "react";
import {
  createProject,
  deleteProject,
  getProjects,
  Project,
  updateProject,
} from "@/lib/project-api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newProjectName, setNewProjectName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const loadProjects = async () => {
    try {
      setError("");
      const data = await getProjects();
      setProjects(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Impossible de récupérer les projets");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newProjectName.trim()) return;

    try {
      setSubmitting(true);
      setError("");

      const created = await createProject(newProjectName.trim());
      setProjects((prev) => [created, ...prev]);
      setNewProjectName("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur lors de la création du projet");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleUpdateProject = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      setError("");
      const updated = await updateProject(id, editingName.trim());

      setProjects((prev) =>
        prev.map((project) => (project.id === id ? updated : project)),
      );

      cancelEdit();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur lors de la modification du projet");
      }
    }
  };

  const handleDeleteProject = async (id: string) => {
    const confirmed = window.confirm("Voulez-vous supprimer ce projet ?");
    if (!confirmed) return;

    try {
      setError("");
      await deleteProject(id);
      setProjects((prev) => prev.filter((project) => project.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur lors de la suppression du projet");
      }
    }
  };

  if (loading) {
    return <div className="p-6">Chargement des projets...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-gray-600 mt-1">Gérer les projets: ajout, modification, suppression.</p>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Ajouter un nouveau projet</h2>

        <form onSubmit={handleAddProject} className="flex gap-3">
          <input
            type="text"
            placeholder="Nom du projet"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="flex-1 rounded border px-3 py-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Ajout..." : "Ajouter"}
          </button>
        </form>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Liste des projets</h2>

        {projects.length === 0 ? (
          <p>Aucun projet trouvé.</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {editingId === project.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 rounded border px-3 py-2"
                        />
                        <button
                          onClick={() => handleUpdateProject(project.id)}
                          className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded border px-3 py-2 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <p className="text-sm text-gray-500">
                          Créé le : {new Date(project.createdAt).toLocaleString()}
                        </p>
                      </>
                    )}

                    <div className="mt-3">
                      <p className="font-medium mb-1">Membres :</p>
                      {project.members?.length ? (
                        <ul className="list-disc ml-5 text-sm text-gray-700">
                          {project.members.map((member) => (
                            <li key={member.id}>
                              {member.user?.email} — {member.role}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">Aucun membre</p>
                      )}
                    </div>
                  </div>

                  {editingId !== project.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(project)}
                        className="rounded bg-yellow-500 px-3 py-2 text-white hover:bg-yellow-600"
                      >
                        Modify
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}