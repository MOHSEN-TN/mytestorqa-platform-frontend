// app/[locale]/(protected)/bugs/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  Bug,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  BugPriority,
  BugSeverity,
  BugStatus,
  createBug,
  deleteBug,
  fetchBugOptions,
  fetchBugs,
  fetchBugStats,
  setSelectedBug,
  updateBug,
} from "@/lib/slices/bugSlice";
import { Modal } from "@/components/projects/Modal";

type TabType = "ALL" | "OPEN" | "MINE";

export default function BugsPage() {
  const dispatch = useAppDispatch();

  const {
    bugs,
    selectedBug,
    stats,
    options,
    loading,
    creating,
    updating,
    deleting,
    error,
  } = useAppSelector((state: any) => state.bugs);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabType>("ALL");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [severity, setSeverity] = useState<BugSeverity>("MAJOR");
  const [priority, setPriority] = useState<BugPriority>("MEDIUM");
  const [projectId, setProjectId] = useState("");
  const [testCaseId, setTestCaseId] = useState("");
  const [executionId, setExecutionId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchBugOptions());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBugStats());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        fetchBugs({
          page: 1,
          limit: 20,
          search: search || undefined,
          status: tab === "OPEN" ? "OPEN" : statusFilter,
          mine: tab === "MINE",
        }),
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [dispatch, search, tab, statusFilter]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSteps("");
    setSeverity("MAJOR");
    setPriority("MEDIUM");
    setProjectId("");
    setTestCaseId("");
    setExecutionId("");
    setAssigneeId("");
    setFormError(null);
  };

  const closeNewModal = () => {
    setShowNewModal(false);
    resetForm();
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Le titre est requis");
      return;
    }

    const res = await dispatch(
      createBug({
        title,
        description,
        steps,
        severity,
        priority,
        projectId: projectId || undefined,
        testCaseId: testCaseId || undefined,
        executionId: executionId || undefined,
        assigneeId: assigneeId || undefined,
      }),
    );

    if (createBug.fulfilled.match(res)) {
      closeNewModal();
      dispatch(fetchBugStats());
      dispatch(
        fetchBugs({
          page: 1,
          limit: 20,
          search: search || undefined,
          status: tab === "OPEN" ? "OPEN" : statusFilter,
          mine: tab === "MINE",
        }),
      );
    } else {
      setFormError((res as any)?.payload?.message || "Erreur création bug");
    }
  };

  const handleStatusChange = async (bugId: string, status: BugStatus) => {
    const res = await dispatch(
      updateBug({
        id: bugId,
        data: { status },
      }),
    );

    if (updateBug.fulfilled.match(res)) {
      dispatch(fetchBugStats());
      dispatch(
        fetchBugs({
          page: 1,
          limit: 20,
          search: search || undefined,
          status: tab === "OPEN" ? "OPEN" : statusFilter,
          mine: tab === "MINE",
        }),
      );
    }
  };

  const handleDelete = async (bugId: string) => {
    if (!window.confirm("Supprimer ce bug ?")) return;

    const res = await dispatch(deleteBug(bugId));

    if (deleteBug.fulfilled.match(res)) {
      dispatch(fetchBugStats());
    }
  };

  const getStatusLabel = (status: BugStatus) => {
    switch (status) {
      case "NEW":
        return "Nouveau";
      case "IN_PROGRESS":
        return "En cours";
      case "RESOLVED":
        return "Résolu";
      case "CLOSED":
        return "Fermé";
      case "REOPENED":
        return "Réouvert";
      default:
        return status;
    }
  };

  const getSeverityLabel = (value: BugSeverity) => {
    switch (value) {
      case "MINOR":
        return "Mineure";
      case "MAJOR":
        return "Majeure";
      case "CRITICAL":
        return "Critique";
      case "BLOCKER":
        return "Bloquante";
      default:
        return value;
    }
  };

  const getPriorityLabel = (value: BugPriority) => {
    switch (value) {
      case "LOW":
        return "Basse";
      case "MEDIUM":
        return "Moyenne";
      case "HIGH":
        return "Haute";
      case "URGENT":
        return "Urgente";
      default:
        return value;
    }
  };

  const getSeverityClass = (value: BugSeverity) => {
    switch (value) {
      case "BLOCKER":
        return "bg-red-100 text-red-700 border-red-200";
      case "CRITICAL":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "MAJOR":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getStatusClass = (value: BugStatus) => {
    switch (value) {
      case "NEW":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "RESOLVED":
        return "bg-green-100 text-green-700 border-green-200";
      case "CLOSED":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "REOPENED":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getUserLabel = (user: any) => {
    if (!user) return "-";
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return fullName || user.email;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bug Tracking</h1>
          <p className="text-sm text-gray-500">
            Suivre, prioriser et résoudre les anomalies détectées pendant les tests.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          Nouveau bug
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">Nouveaux</p>
            <Bug size={18} className="text-blue-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-800">{stats?.new || 0}</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">En cours</p>
            <Clock size={18} className="text-purple-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-800">
            {stats?.inProgress || 0}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">Résolus</p>
            <CheckCircle size={18} className="text-green-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-800">
            {stats?.resolved || 0}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">Critiques</p>
            <ShieldAlert size={18} className="text-red-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-800">
            {stats?.critical || 0}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">
              Total ouverts
            </p>
            <AlertCircle size={18} className="text-orange-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-800">{stats?.open || 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un bug..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-4 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Filter size={15} />
          Filtrer
        </button>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Statut
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Tous</option>
            <option value="NEW">Nouveau</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="RESOLVED">Résolu</option>
            <option value="CLOSED">Fermé</option>
            <option value="REOPENED">Réouvert</option>
          </select>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-100">
        {[
          { key: "ALL", label: "Tous" },
          { key: "OPEN", label: "Ouverts" },
          { key: "MINE", label: "Mes bugs" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key as TabType)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === item.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {loading ? (
            <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm">
              Chargement...
            </p>
          ) : bugs?.length === 0 ? (
            <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm">
              Aucun bug trouvé.
            </p>
          ) : (
            bugs.map((bug: any) => (
              <button
                key={bug.id}
                onClick={() => dispatch(setSelectedBug(bug))}
                className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 ${
                  selectedBug?.id === bug.id
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{bug.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {bug.description || "Aucune description"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(
                      bug.status,
                    )}`}
                  >
                    {getStatusLabel(bug.status)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-medium ${getSeverityClass(
                      bug.severity,
                    )}`}
                  >
                    {getSeverityLabel(bug.severity)}
                  </span>

                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                    Priorité : {getPriorityLabel(bug.priority)}
                  </span>

                  {bug.project?.name && (
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs text-blue-600">
                      {bug.project.name}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <UserRound size={13} />
                  Rapporté par {getUserLabel(bug.reporter)}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          {!selectedBug ? (
            <p className="text-sm text-gray-500">
              Sélectionnez un bug pour voir les détails.
            </p>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {selectedBug.title}
                  </h2>
                  <p className="mt-1 text-xs text-gray-400">
                    ID : {selectedBug.id.slice(0, 8)}
                  </p>
                </div>

                <button
                  disabled={deleting}
                  onClick={() => handleDelete(selectedBug.id)}
                  className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                  title="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(
                    selectedBug.status,
                  )}`}
                >
                  {getStatusLabel(selectedBug.status)}
                </span>

                <span
                  className={`rounded-full border px-2 py-1 text-xs font-medium ${getSeverityClass(
                    selectedBug.severity,
                  )}`}
                >
                  {getSeverityLabel(selectedBug.severity)}
                </span>

                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                  {getPriorityLabel(selectedBug.priority)}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Description
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                    {selectedBug.description || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Étapes de reproduction
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                    {selectedBug.steps || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Projet</p>
                    <p className="text-sm font-medium text-gray-700">
                      {selectedBug.project?.name || "-"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Cas de test</p>
                    <p className="text-sm font-medium text-gray-700">
                      {selectedBug.testCase?.title || "-"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Assigné à</p>
                    <p className="text-sm font-medium text-gray-700">
                      {getUserLabel(selectedBug.assignee)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Rapporteur</p>
                    <p className="text-sm font-medium text-gray-700">
                      {getUserLabel(selectedBug.reporter)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Changer le statut
                  </label>
                  <select
                    value={selectedBug.status}
                    disabled={updating}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedBug.id,
                        e.target.value as BugStatus,
                      )
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="NEW">Nouveau</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="RESOLVED">Résolu</option>
                    <option value="CLOSED">Fermé</option>
                    <option value="REOPENED">Réouvert</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <Modal open={showNewModal} onClose={closeNewModal}>
          <div className="max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Nouveau bug</h2>

              <button
                onClick={closeNewModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Titre *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Étapes de reproduction
                </label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  rows={3}
                  placeholder="1. Aller vers...
2. Cliquer sur...
3. Observer le résultat..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Sévérité
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="MINOR">Mineure</option>
                    <option value="MAJOR">Majeure</option>
                    <option value="CRITICAL">Critique</option>
                    <option value="BLOCKER">Bloquante</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Priorité
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as BugPriority)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Projet lié
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Aucun</option>
                  {options?.projects?.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Cas de test lié
                </label>
                <select
                  value={testCaseId}
                  onChange={(e) => setTestCaseId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Aucun</option>
                  {options?.testCases?.map((testCase: any) => (
                    <option key={testCase.id} value={testCase.id}>
                      {testCase.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Exécution liée
                </label>
                <select
                  value={executionId}
                  onChange={(e) => setExecutionId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Aucune</option>
                  {options?.executions?.map((execution: any) => (
                    <option key={execution.id} value={execution.id}>
                      {execution.testCase?.title || execution.id} -{" "}
                      {execution.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Assigner à
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Non assigné</option>
                  {options?.users?.map((user: any) => {
                    const label =
                      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                      user.email;

                    return (
                      <option key={user.id} value={user.id}>
                        {label} - {user.role}
                      </option>
                    );
                  })}
                </select>
              </div>

              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  <AlertCircle size={14} className="mt-0.5" />
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeNewModal}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {creating ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}