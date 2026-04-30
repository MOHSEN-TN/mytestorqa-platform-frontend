"use client";

import api from "@/lib/axios";
import { FormEvent, useEffect, useState } from "react";
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
import {
  clearTestSuites,
  fetchTestSuites,
} from "@/lib/slices/testSuiteSlice";

type RunResponse = {
  count?: number;
  message?: string;
};

export default function RunsPage() {
  const dispatch = useAppDispatch();

  const {
    projects,
    loading: loadingProjects,
    selectedProject,
    error: projectError,
  } = useAppSelector((state) => state.projects);

  const {
    campaigns,
    selectedCampaign,
    loading: loadingCampaigns,
    creating: creatingCampaign,
    error: campaignError,
  } = useAppSelector((state) => state.campaigns);

  const {
    iterations,
    selectedIteration,
    loading: loadingIterations,
    creating: creatingIteration,
    error: iterationError,
  } = useAppSelector((state) => state.iterations);

  const { testSuites, loading: loadingSuites } = useAppSelector(
    (state) => state.testSuites
  );

  const [newCampaign, setNewCampaign] = useState("");
  const [newIteration, setNewIteration] = useState("");
  const [selectedSuiteIds, setSelectedSuiteIds] = useState<string[]>([]);
  const [addingSuites, setAddingSuites] = useState(false);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedProject?.id) {
      dispatch(clearCampaigns());
      dispatch(clearIterations());
      dispatch(clearTestSuites());
      setSelectedSuiteIds([]);
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

  const resetMessages = () => {
    setRunMessage(null);
    setRunError(null);
  };

  const handleSelectProject = (project: (typeof projects)[number]) => {
    dispatch(setSelectedProject(project));
    dispatch(clearCampaigns());
    dispatch(clearIterations());
    dispatch(clearTestSuites());
    setSelectedSuiteIds([]);
    resetMessages();
  };

  const handleSelectCampaign = (campaign: (typeof campaigns)[number]) => {
    dispatch(setSelectedCampaign(campaign));
    dispatch(clearIterations());
    setSelectedSuiteIds([]);
    resetMessages();
  };

  const handleSelectIteration = (iteration: (typeof iterations)[number]) => {
    dispatch(setSelectedIteration(iteration));
    setSelectedSuiteIds([]);
    resetMessages();
  };

  const handleCreateCampaign = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedProject?.id) return;

    const trimmedName = newCampaign.trim();
    if (!trimmedName) return;

    const resultAction = await dispatch(
      createCampaign({
        projectId: selectedProject.id,
        name: trimmedName,
      })
    );

    if (createCampaign.fulfilled.match(resultAction)) {
      setNewCampaign("");
      dispatch(fetchCampaigns(selectedProject.id));
    }
  };

  const handleCreateIteration = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedCampaign?.id) return;

    const trimmedName = newIteration.trim();
    if (!trimmedName) return;

    const resultAction = await dispatch(
      createIteration({
        campaignId: selectedCampaign.id,
        name: trimmedName,
      })
    );

    if (createIteration.fulfilled.match(resultAction)) {
      setNewIteration("");
      dispatch(fetchIterations(selectedCampaign.id));
    }
  };

  const toggleSuite = (suiteId: string) => {
    setSelectedSuiteIds((prev) =>
      prev.includes(suiteId)
        ? prev.filter((id) => id !== suiteId)
        : [...prev, suiteId]
    );
  };

  const handleAddSuitesToIteration = async () => {
    if (!selectedIteration?.id || selectedSuiteIds.length === 0) return;

    try {
      setAddingSuites(true);
      setRunMessage(null);
      setRunError(null);

      await api.post(`/iterations/${selectedIteration.id}/suites`, {
        suiteIds: selectedSuiteIds,
      });

      setRunMessage("Suites ajoutées à l’itération.");
      setSelectedSuiteIds([]);
    } catch {
      setRunError("Impossible d’ajouter les suites à l’itération.");
    } finally {
      setAddingSuites(false);
    }
  };

  const handleRunTests = async () => {
    if (!selectedIteration?.id) return;

    try {
      setRunning(true);
      setRunMessage(null);
      setRunError(null);

      const response = await api.post<RunResponse>(
        `/iterations/${selectedIteration.id}/run`
      );

      if (typeof response.data.count === "number") {
        setRunMessage(
          `${response.data.count} test case(s) généré(s) pour l'exécution.`
        );
      } else if (response.data.message) {
        setRunMessage(response.data.message);
      } else {
        setRunMessage("Exécution générée avec succès.");
      }
    } catch {
      setRunError("Impossible de générer l'exécution.");
    } finally {
      setRunning(false);
    }
  };

  const globalError = projectError || campaignError || iterationError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Execution</h1>
        <p className="mt-1 text-gray-600">
          Projet → Campagne → Itération → Exécution
        </p>
      </div>

      {globalError && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {globalError}
        </div>
      )}

      {runError && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {runError}
        </div>
      )}

      {runMessage && (
        <div className="rounded border border-green-300 bg-green-50 p-3 text-green-700">
          {runMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="min-w-0 rounded-lg border bg-white p-4 shadow-sm xl:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">Projects</h2>

          {loadingProjects ? (
            <p>Chargement des projets...</p>
          ) : projects.length === 0 ? (
            <p>Aucun projet trouvé.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => {
                const isSelected = selectedProject?.id === project.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleSelectProject(project)}
                    className={`w-full rounded border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium break-words">{project.name}</div>

                    <div className="text-sm text-gray-500" suppressHydrationWarning>
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleString()
                        : "-"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-lg border bg-white p-4 shadow-sm xl:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">Campaigns</h2>

          {!selectedProject ? (
            <p className="text-gray-500">Choisis d&apos;abord un projet.</p>
          ) : (
            <>
              <form onSubmit={handleCreateCampaign} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newCampaign}
                  onChange={(e) => setNewCampaign(e.target.value)}
                  placeholder="Nouvelle campagne"
                  className="min-w-0 flex-1 rounded border px-3 py-2"
                />

                <button
                  type="submit"
                  disabled={!newCampaign.trim() || creatingCampaign}
                  className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {creatingCampaign ? "..." : "+"}
                </button>
              </form>

              {loadingCampaigns ? (
                <p>Chargement des campagnes...</p>
              ) : campaigns.length === 0 ? (
                <p>Aucune campagne trouvée.</p>
              ) : (
                <div className="space-y-2">
                  {campaigns.map((campaign) => {
                    const isSelected = selectedCampaign?.id === campaign.id;

                    return (
                      <button
                        key={campaign.id}
                        type="button"
                        onClick={() => handleSelectCampaign(campaign)}
                        className={`w-full rounded border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium break-words">
                          {campaign.name}
                        </div>

                        <div
                          className="text-sm text-gray-500"
                          suppressHydrationWarning
                        >
                          {campaign.createdAt
                            ? new Date(campaign.createdAt).toLocaleString()
                            : "-"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        <section className="min-w-0 rounded-lg border bg-white p-4 shadow-sm xl:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">Iterations</h2>

          {!selectedCampaign ? (
            <p className="text-gray-500">Choisis d&apos;abord une campagne.</p>
          ) : (
            <>
              <form onSubmit={handleCreateIteration} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newIteration}
                  onChange={(e) => setNewIteration(e.target.value)}
                  placeholder="Nouvelle itération"
                  className="min-w-0 flex-1 rounded border px-3 py-2"
                />

                <button
                  type="submit"
                  disabled={!newIteration.trim() || creatingIteration}
                  className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {creatingIteration ? "..." : "+"}
                </button>
              </form>

              {loadingIterations ? (
                <p>Chargement des itérations...</p>
              ) : iterations.length === 0 ? (
                <p>Aucune itération trouvée.</p>
              ) : (
                <div className="space-y-2">
                  {iterations.map((iteration) => {
                    const isSelected = selectedIteration?.id === iteration.id;

                    return (
                      <button
                        key={iteration.id}
                        type="button"
                        onClick={() => handleSelectIteration(iteration)}
                        className={`w-full rounded border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium break-words">
                          {iteration.name}
                        </div>

                        <div
                          className="text-sm text-gray-500"
                          suppressHydrationWarning
                        >
                          {iteration.createdAt
                            ? new Date(iteration.createdAt).toLocaleString()
                            : "-"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        <section className="min-w-0 rounded-lg border bg-white p-4 shadow-sm xl:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">Execution</h2>

          {!selectedProject && (
            <p className="text-gray-500">Choisis un projet pour commencer.</p>
          )}

          {selectedProject && !selectedCampaign && (
            <p className="text-gray-500">
              Choisis ou crée une campagne de test.
            </p>
          )}

          {selectedCampaign && !selectedIteration && (
            <p className="text-gray-500">
              Choisis ou crée une itération pour exécuter les suites.
            </p>
          )}

          {selectedIteration && (
            <div className="space-y-4">
              <div className="rounded border bg-gray-50 p-4">
                <h3 className="text-lg font-semibold">
                  {selectedIteration.name}
                </h3>

                <p className="text-sm text-gray-500">
                  Campagne : {selectedCampaign?.name}
                </p>

                <p className="text-sm text-gray-500">
                  Projet : {selectedProject?.name}
                </p>
              </div>

              <div className="rounded border bg-white p-4">
                <h4 className="mb-3 font-semibold">Suites à exécuter</h4>

                {loadingSuites ? (
                  <p>Chargement des suites...</p>
                ) : testSuites.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aucune suite dans ce projet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {testSuites.map((suite) => (
                      <label
                        key={suite.id}
                        className="flex cursor-pointer items-center gap-2 rounded border p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuiteIds.includes(suite.id)}
                          onChange={() => toggleSuite(suite.id)}
                        />
                        <span className="break-words">{suite.name}</span>
                      </label>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddSuitesToIteration}
                  disabled={
                    selectedSuiteIds.length === 0 || addingSuites
                  }
                  className="mt-3 rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {addingSuites ? "Ajout..." : "Ajouter les suites"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleRunTests}
                disabled={running}
                className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {running ? "Génération..." : "Run Tests"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
