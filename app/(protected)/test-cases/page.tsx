"use client";

import { useEffect, useState } from "react";
import { getProjects, Project } from "@/lib/project-api";
import {
  createTestCase,
  getTestCases,
  TestCase,
} from "@/lib/testcase-api";

type StepForm = {
  action: string;
  expected: string;
};

export default function TestCasesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expected, setExpected] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "READY" | "DEPRECATED">(
    "DRAFT",
  );
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  >("MEDIUM");
  const [steps, setSteps] = useState<StepForm[]>([
    { action: "", expected: "" },
  ]);

  const loadProjects = async () => {
    try {
      setError("");
      const data = await getProjects();
      setProjects(data);

      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Impossible de récupérer les projets");
      }
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadTestCases = async (projectId: string) => {
    if (!projectId) return;

    try {
      setLoadingTestCases(true);
      setError("");
      const data = await getTestCases(projectId);
      setTestCases(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Impossible de récupérer les cas de test");
      }
      setTestCases([]);
    } finally {
      setLoadingTestCases(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadTestCases(selectedProjectId);
    }
  }, [selectedProjectId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setExpected("");
    setStatus("DRAFT");
    setPriority("MEDIUM");
    setSteps([{ action: "", expected: "" }]);
  };

  const handleStepChange = (
    index: number,
    field: "action" | "expected",
    value: string,
  ) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, [field]: value } : step,
      ),
    );
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { action: "", expected: "" }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTestCase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedProjectId) {
      setError("Veuillez sélectionner un projet");
      return;
    }

    if (!title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }

    const cleanedSteps = steps
      .map((step) => ({
        action: step.action.trim(),
        expected: step.expected.trim(),
      }))
      .filter((step) => step.action !== "");

    try {
      setSubmitting(true);
      setError("");

      const created = await createTestCase(selectedProjectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        expected: expected.trim() || undefined,
        status,
        priority,
        steps: cleanedSteps.length > 0 ? cleanedSteps : undefined,
      });

      setTestCases((prev) => [created, ...prev]);
      resetForm();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur lors de la création du cas de test");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  if (loadingProjects) {
    return <div className="p-6">Chargement des projets...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Cases</h1>
        <p className="mt-1 text-gray-600">
          Sélectionner un projet et gérer ses cas de test.
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm lg:col-span-1">
          <h2 className="mb-4 text-lg font-semibold">Projets</h2>

          {projects.length === 0 ? (
            <p>Aucun projet trouvé.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => {
                const isSelected = project.id === selectedProjectId;

                return (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full rounded border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(project.createdAt).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              Ajouter un test case
              {selectedProject ? ` — ${selectedProject.name}` : ""}
            </h2>

            <form onSubmit={handleAddTestCase} className="space-y-4">
              <input
                type="text"
                placeholder="Titre du test case"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded border px-3 py-2"
                rows={3}
              />

              <textarea
                placeholder="Expected global result"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                className="w-full rounded border px-3 py-2"
                rows={2}
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as "DRAFT" | "READY" | "DEPRECATED",
                    )
                  }
                  className="rounded border px-3 py-2"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="DEPRECATED">DEPRECATED</option>
                </select>

                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(
                      e.target.value as
                        | "LOW"
                        | "MEDIUM"
                        | "HIGH"
                        | "CRITICAL",
                    )
                  }
                  className="rounded border px-3 py-2"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Test Steps</h3>
                  <button
                    type="button"
                    onClick={addStep}
                    className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                  >
                    + Add Step
                  </button>
                </div>

                {steps.map((step, index) => (
                  <div key={index} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Step {index + 1}</p>

                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <textarea
                      placeholder="Action"
                      value={step.action}
                      onChange={(e) =>
                        handleStepChange(index, "action", e.target.value)
                      }
                      className="w-full rounded border px-3 py-2"
                      rows={2}
                    />

                    <textarea
                      placeholder="Expected result"
                      value={step.expected}
                      onChange={(e) =>
                        handleStepChange(index, "expected", e.target.value)
                      }
                      className="w-full rounded border px-3 py-2"
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedProjectId}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Ajout..." : "Créer le test case"}
              </button>
            </form>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              Liste des test cases
              {selectedProject ? ` — ${selectedProject.name}` : ""}
            </h2>

            {loadingTestCases ? (
              <p>Chargement des test cases...</p>
            ) : testCases.length === 0 ? (
              <p>Aucun test case trouvé pour ce projet.</p>
            ) : (
              <div className="space-y-4">
                {testCases.map((testCase) => (
                  <div key={testCase.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {testCase.title}
                        </h3>

                        {testCase.description && (
                          <p className="mt-2 text-gray-700">
                            {testCase.description}
                          </p>
                        )}

                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
                          <p>
                            <strong>Status :</strong> {testCase.status}
                          </p>
                          <p>
                            <strong>Priority :</strong> {testCase.priority}
                          </p>
                          <p className="md:col-span-2">
                            <strong>Expected global :</strong>{" "}
                            {testCase.expected || "-"}
                          </p>
                          <p>
                            <strong>Créé le :</strong>{" "}
                            {new Date(testCase.createdAt).toLocaleString()}
                          </p>
                          <p>
                            <strong>Mis à jour :</strong>{" "}
                            {new Date(testCase.updatedAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="mt-4">
                          <p className="mb-2 font-medium">Steps :</p>

                          {testCase.steps?.length ? (
                            <div className="space-y-2">
                              {testCase.steps.map((step) => (
                                <div
                                  key={step.id}
                                  className="rounded border bg-gray-50 p-3"
                                >
                                  <p>
                                    <strong>Step {step.stepOrder}:</strong>{" "}
                                    {step.action}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <strong>Expected :</strong>{" "}
                                    {step.expected || "-"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Aucun step
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="rounded bg-yellow-500 px-3 py-2 text-white hover:bg-yellow-600">
                          Modify
                        </button>
                        <button className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}