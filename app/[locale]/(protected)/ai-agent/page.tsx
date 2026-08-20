/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Bot,
  Check,
  FileCode2,
  Globe2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchProjects } from "@/lib/slices/projectSlice";
import SmartQaChat from "./SmartQaChat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:3001";

type AIExplorationStatus =
  | "DRAFT"
  | "PROCESSING"
  | "GENERATED"
  | "VALIDATED"
  | "ARCHIVED"
  | "FAILED";

type AISuggestionPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type AISuggestionStatus = "PENDING" | "APPROVED" | "REJECTED" | "CONVERTED";

type GenerationMode = "RULE_BASED" | "OLLAMA_LOCAL" | "CLOUD_AI";

type AITestSuggestion = {
  id: string;
  explorationId: string;
  title: string;
  description?: string | null;
  expectedResult?: string | null;
  priority: AISuggestionPriority;
  status: AISuggestionStatus;
  createdAt?: string;
  updatedAt?: string;
};

type AIExploration = {
  id: string;
  projectId: string;
  createdById: string;
  title: string;
  prompt: string;
  context?: string | null;
  generationMode?: GenerationMode;
  targetUrl?: string | null;
  depth: number;
  authenticationRequired: boolean;
  username?: string | null;
  password?: string | null;
  generatePlaywright: boolean;
  generateGherkin: boolean;
  generateNegativeTests: boolean;
  status: AIExplorationStatus;
  generatedCount: number;
  aiModel?: string | null;
  generationDurationMs?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  ollamaTotalDurationMs?: number | null;
  lastGeneratedAt?: string | null;
  lastError?: string | null;
  fallbackUsed?: boolean;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  suggestions?: AITestSuggestion[];
};

type CreateAIExplorationPayload = {
  projectId: string;
  title: string;
  prompt: string;
  context?: string;
  generationMode?: GenerationMode;
  targetUrl?: string;
  depth?: number;
  authenticationRequired?: boolean;
  username?: string;
  password?: string;
  generatePlaywright?: boolean;
  generateGherkin?: boolean;
  generateNegativeTests?: boolean;
};

type FormState = {
  title: string;
  projectId: string;
  targetUrl: string;
  depth: string;
  authenticationRequired: boolean;
  username: string;
  password: string;
  context: string;
  generationMode: GenerationMode;
  generatePlaywright: boolean;
  generateGherkin: boolean;
  generateNegativeTests: boolean;
};

const defaultForm: FormState = {
  title: "",
  projectId: "",
  targetUrl: "",
  depth: "2",
  authenticationRequired: false,
  username: "",
  password: "",
  context: "",
  generationMode: "CLOUD_AI",
  generatePlaywright: true,
  generateGherkin: true,
  generateNegativeTests: false,
};

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string") return data;

  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof (data as { message?: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }

  return fallback;
}

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function statusLabel(status: AIExplorationStatus) {
  switch (status) {
    case "DRAFT":
      return "Brouillon";
    case "PROCESSING":
      return "Traitement";
    case "GENERATED":
      return "Générée";
    case "VALIDATED":
      return "Validée";
    case "ARCHIVED":
      return "Archivée";
    case "FAILED":
      return "Échec";
    default:
      return status;
  }
}

function statusClass(status: AIExplorationStatus) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "PROCESSING":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "GENERATED":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "VALIDATED":
      return "bg-green-100 text-green-700 border-green-200";
    case "ARCHIVED":
      return "bg-zinc-100 text-zinc-600 border-zinc-200";
    case "FAILED":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function priorityClass(priority: AISuggestionPriority) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "LOW":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function suggestionStatusLabel(status: AISuggestionStatus) {
  switch (status) {
    case "PENDING":
      return "À convertir";
    case "APPROVED":
      return "Approuvée";
    case "REJECTED":
      return "Rejetée";
    case "CONVERTED":
      return "Convertie";
    default:
      return status;
  }
}

function suggestionStatusClass(status: AISuggestionStatus) {
  switch (status) {
    case "CONVERTED":
      return "bg-green-100 text-green-700 border-green-200";
    case "APPROVED":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "REJECTED":
      return "bg-red-100 text-red-700 border-red-200";
    case "PENDING":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function generationModeLabel(mode?: GenerationMode) {
  switch (mode) {
    case "RULE_BASED":
      return "Règles Playwright";
    case "OLLAMA_LOCAL":
      return "SMART-QA · Ollama";
    case "CLOUD_AI":
      return "SMART-QA · Gemini";
    default:
      return "IA Rules";
  }
}

export default function AIAgentPage() {
  const dispatch = useAppDispatch();
  const { projects, loading: projectsLoading } = useAppSelector(
    (state) => state.projects
  );

  const [explorations, setExplorations] = useState<AIExploration[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExploration, setSelectedExploration] =
    useState<AIExploration | null>(null);

  const [form, setForm] = useState<FormState>(defaultForm);

  const [loadingExplorations, setLoadingExplorations] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [convertingSuggestionId, setConvertingSuggestionId] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchExplorations = useCallback(async () => {
    try {
      setLoadingExplorations(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/ai-exploration`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible de charger les explorations IA")
        );
      }

      setExplorations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoadingExplorations(false);
    }
  }, []);

  const filteredExplorations = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return explorations;

    return explorations.filter((exploration) => {
      return (
        exploration.title.toLowerCase().includes(value) ||
        exploration.project?.name?.toLowerCase().includes(value) ||
        exploration.targetUrl?.toLowerCase().includes(value) ||
        exploration.status.toLowerCase().includes(value)
      );
    });
  }, [explorations, search]);

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, limit: 100 }));
    fetchExplorations();
  }, [dispatch, fetchExplorations]);

  function openCreateModal() {
    setError(null);
    setSuccessMessage(null);
    setSelectedExploration(null);
    setForm({
      ...defaultForm,
      projectId: projects[0]?.id || "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (creating) return;
    setIsModalOpen(false);
    setError(null);
  }

  function buildPrompt() {
    return `
Génère des scénarios de test QA pour cette application.

Titre: ${form.title}
Projet: ${projects.find((project) => project.id === form.projectId)?.name || ""}
Mode de génération: ${form.generationMode}
URL à explorer: ${form.targetUrl || "Non renseignée"}
Profondeur: ${form.depth}
Authentification requise: ${form.authenticationRequired ? "Oui" : "Non"}
Générer Playwright: ${form.generatePlaywright ? "Oui" : "Non"}
Générer Gherkin: ${form.generateGherkin ? "Oui" : "Non"}
Inclure tests négatifs: ${form.generateNegativeTests ? "Oui" : "Non"}
Contexte additionnel: ${form.context || "Aucun"}
`.trim();
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      setError("Le titre est obligatoire.");
      return;
    }

    if (!form.projectId) {
      setError("Le projet est obligatoire.");
      return;
    }

    if (!form.targetUrl.trim()) {
      setError("L'URL à explorer est obligatoire.");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccessMessage(null);

      const payload: CreateAIExplorationPayload = {
        projectId: form.projectId,
        title,
        prompt: buildPrompt(),
        context: form.context.trim() || undefined,
        generationMode: form.generationMode,
        targetUrl: form.targetUrl.trim() || undefined,
        depth: Number(form.depth) || 2,
        authenticationRequired: form.authenticationRequired,
        username: form.authenticationRequired
          ? form.username.trim() || undefined
          : undefined,
        password: form.authenticationRequired
          ? form.password.trim() || undefined
          : undefined,
        generatePlaywright: form.generatePlaywright,
        generateGherkin: form.generateGherkin,
        generateNegativeTests: form.generateNegativeTests,
      };

      const response = await fetch(`${API_BASE_URL}/ai-exploration`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible de créer l'exploration IA")
        );
      }

      setExplorations((previous) => [data as AIExploration, ...previous]);
      setForm(defaultForm);
      setIsModalOpen(false);
      setSuccessMessage("Exploration IA créée avec succès.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCreating(false);
    }
  }

  async function handleGenerate(id: string) {
    try {
      setGeneratingId(id);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `${API_BASE_URL}/ai-exploration/${id}/generate`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible de générer les suggestions IA")
        );
      }

      const updated = data as AIExploration;

      setExplorations((previous) =>
        previous.map((item) => (item.id === id ? updated : item))
      );

      setSelectedExploration((previous) =>
        previous?.id === id ? updated : previous
      );

      setSuccessMessage("Suggestions générées avec succès.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleConvertSuggestion(
    explorationId: string,
    suggestionId: string
  ) {
    try {
      setConvertingSuggestionId(suggestionId);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `${API_BASE_URL}/ai-exploration/suggestions/${suggestionId}/convert`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            generatePlaywrightCode: true,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible de convertir la suggestion")
        );
      }

      setExplorations((previous) =>
        previous.map((exploration) => {
          if (exploration.id !== explorationId) return exploration;

          return {
            ...exploration,
            suggestions: exploration.suggestions?.map((suggestion) =>
              suggestion.id === suggestionId
                ? { ...suggestion, status: "CONVERTED" }
                : suggestion
            ),
          };
        })
      );

      setSelectedExploration((previous) => {
        if (!previous || previous.id !== explorationId) return previous;

        return {
          ...previous,
          suggestions: previous.suggestions?.map((suggestion) =>
            suggestion.id === suggestionId
              ? { ...suggestion, status: "CONVERTED" }
              : suggestion
          ),
        };
      });

      const testCaseId =
        data &&
        typeof data === "object" &&
        "testCase" in data &&
        data.testCase &&
        typeof data.testCase === "object" &&
        "id" in data.testCase
          ? String((data.testCase as { id: string }).id)
          : "";

      setSuccessMessage(
        testCaseId
          ? `Suggestion convertie en cas de test : ${testCaseId}`
          : "Suggestion convertie en cas de test."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setConvertingSuggestionId(null);
    }
  }

  async function handleValidate(id: string) {
    try {
      setActionLoadingId(id);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `${API_BASE_URL}/ai-exploration/${id}/validate`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible de valider l'exploration")
        );
      }

      const updated = data as AIExploration;

      setExplorations((previous) =>
        previous.map((item) => (item.id === id ? updated : item))
      );

      setSelectedExploration((previous) =>
        previous?.id === id ? updated : previous
      );

      setSuccessMessage("Exploration validée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleArchive(id: string) {
    try {
      setActionLoadingId(id);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `${API_BASE_URL}/ai-exploration/${id}/archive`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible d'archiver l'exploration")
        );
      }

      const updated = data as AIExploration;

      setExplorations((previous) =>
        previous.map((item) => (item.id === id ? updated : item))
      );

      setSelectedExploration((previous) =>
        previous?.id === id ? updated : previous
      );

      setSuccessMessage("Exploration archivée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette exploration IA ?"
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(id);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`${API_BASE_URL}/ai-exploration/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible de supprimer l'exploration")
        );
      }

      setExplorations((previous) => previous.filter((item) => item.id !== id));

      if (selectedExploration?.id === id) {
        setSelectedExploration(null);
      }

      setSuccessMessage("Exploration supprimée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <Bot className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                IA Explorer · SMART-QA
              </h1>
              <p className="mt-1 text-slate-600">
                Exploration intelligente, génération de scénarios et chatbot QA
                local propulsés par Qwen3.5 9B via Ollama.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-800"
          >
            <Plus className="h-5 w-5" />
            Nouvelle exploration
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<Globe2 className="h-7 w-7" />}
            title="Exploration automatique"
            description="Analyse les pages, formulaires et parcours critiques de ton application."
          />
          <FeatureCard
            icon={<FileCode2 className="h-7 w-7" />}
            title="Génération de tests"
            description="Prépare des scénarios Playwright et Gherkin à partir de l’exploration."
          />
          <FeatureCard
            icon={<Sparkles className="h-7 w-7" />}
            title="Priorisation intelligente"
            description="Classe les scénarios selon les risques, la criticité et les cas négatifs."
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une exploration..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-3 font-semibold text-purple-700">
              <Wand2 className="h-5 w-5" />
              {filteredExplorations.length} explorations
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          {loadingExplorations ? (
            <div className="flex min-h-60 items-center justify-center text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement des explorations...
            </div>
          ) : filteredExplorations.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                <Wand2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Aucune exploration IA
              </h2>
              <p className="mt-2 max-w-md text-slate-600">
                Crée une exploration pour analyser une URL et générer des
                suggestions de tests.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white transition hover:bg-purple-800"
              >
                <Plus className="h-5 w-5" />
                Créer une exploration
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredExplorations.map((exploration) => (
                <ExplorationCard
                  key={exploration.id}
                  exploration={exploration}
                  generating={generatingId === exploration.id}
                  actionLoading={actionLoadingId === exploration.id}
                  onOpen={() => setSelectedExploration(exploration)}
                  onGenerate={() => handleGenerate(exploration.id)}
                  onValidate={() => handleValidate(exploration.id)}
                  onArchive={() => handleArchive(exploration.id)}
                  onDelete={() => handleDelete(exploration.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <form onSubmit={handleCreate} className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Nouvelle exploration IA
                  </h2>
                  <p className="mt-1 text-slate-600">
                    Configure l’exploration automatique de ton application.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid gap-4">
                <Field label="Titre">
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Ex: Exploration e-commerce"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </Field>

                <Field label="Projet">
                  <select
                    value={form.projectId}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        projectId: event.target.value,
                      }))
                    }
                    disabled={projectsLoading}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  >
                    <option value="">Sélectionner un projet</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Mode de génération">
                  <select
                    value={form.generationMode}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        generationMode: event.target.value as GenerationMode,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  >
                    <option value="RULE_BASED">
                      Génération rapide - Playwright + règles
                    </option>
                    <option value="OLLAMA_LOCAL">
                      SMART-QA local - Qwen3.5 9B via Ollama
                    </option>
                    <option value="CLOUD_AI">
                      SMART-QA cloud - Gemini
                    </option>
                  </select>
                </Field>

                <Field label="URL à explorer">
                  <input
                    value={form.targetUrl}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        targetUrl: event.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Profondeur d'exploration">
                    <select
                      value={form.depth}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          depth: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    >
                      <option value="1">Simple - 1 niveau</option>
                      <option value="2">Moyenne - 2 niveaux</option>
                      <option value="3">Avancée - 3 niveaux</option>
                    </select>
                  </Field>

                  <Field label="Authentification">
                    <select
                      value={form.authenticationRequired ? "yes" : "no"}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          authenticationRequired: event.target.value === "yes",
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    >
                      <option value="no">Aucune</option>
                      <option value="yes">Requise</option>
                    </select>
                  </Field>
                </div>

                {form.authenticationRequired && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Username / Email">
                      <input
                        value={form.username}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            username: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                      />
                    </Field>

                    <Field label="Mot de passe">
                      <input
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            password: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                      />
                    </Field>
                  </div>
                )}

                <Field label="Contexte additionnel">
                  <textarea
                    value={form.context}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        context: event.target.value,
                      }))
                    }
                    placeholder="API, mobile, sécurité, performance, règles métier..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </Field>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-bold text-slate-900">
                    Options de génération
                  </h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <CheckboxOption
                      title="Playwright"
                      description="Tests E2E"
                      checked={form.generatePlaywright}
                      onChange={(checked) =>
                        setForm((previous) => ({
                          ...previous,
                          generatePlaywright: checked,
                        }))
                      }
                    />

                    <CheckboxOption
                      title="Gherkin"
                      description="BDD"
                      checked={form.generateGherkin}
                      onChange={(checked) =>
                        setForm((previous) => ({
                          ...previous,
                          generateGherkin: checked,
                        }))
                      }
                    />

                    <CheckboxOption
                      title="Tests négatifs"
                      description="Cas d’erreur"
                      checked={form.generateNegativeTests}
                      onChange={(checked) =>
                        setForm((previous) => ({
                          ...previous,
                          generateNegativeTests: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-5 w-5" />
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                  Créer exploration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedExploration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-6">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                      selectedExploration.status
                    )}`}
                  >
                    {statusLabel(selectedExploration.status)}
                  </span>

                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                    {selectedExploration.generatedCount || 0} suggestions
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {generationModeLabel(selectedExploration.generationMode)}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedExploration.title}
                </h2>
                <p className="mt-1 text-slate-600">
                  {selectedExploration.project?.name || "Projet inconnu"} ·{" "}
                  {selectedExploration.targetUrl || "URL non renseignée"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExploration(null)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-4">
                <InfoBox
                  label="Profondeur"
                  value={`${selectedExploration.depth} niveau(x)`}
                />
                <InfoBox
                  label="Mode"
                  value={generationModeLabel(selectedExploration.generationMode)}
                />
                <InfoBox
                  label="Modèle"
                  value={selectedExploration.aiModel || "Non applicable"}
                />
                <InfoBox
                  label="Durée"
                  value={
                    selectedExploration.generationDurationMs
                      ? `${(selectedExploration.generationDurationMs / 1000).toFixed(1)} s`
                      : "Non disponible"
                  }
                />
              </div>

              {selectedExploration.fallbackUsed && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Le fournisseur IA sélectionné n’était pas disponible. SMART-QA a
                  utilisé la génération de secours basée sur les règles.
                  {selectedExploration.lastError
                    ? ` Détail : ${selectedExploration.lastError}`
                    : ""}
                </div>
              )}

              {selectedExploration.status === "FAILED" &&
                selectedExploration.lastError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {selectedExploration.lastError}
                  </div>
                )}

              {selectedExploration.context && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-bold text-slate-900">Contexte</h3>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">
                    {selectedExploration.context}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-slate-900">
                    Suggestions générées
                  </h3>

                  <button
                    type="button"
                    onClick={() => handleGenerate(selectedExploration.id)}
                    disabled={generatingId === selectedExploration.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generatingId === selectedExploration.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    Générer
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {!selectedExploration.suggestions ||
                  selectedExploration.suggestions.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-6 text-center text-slate-600">
                      Aucune suggestion pour le moment. Clique sur “Générer”.
                    </div>
                  ) : (
                    selectedExploration.suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="mb-2 flex flex-wrap gap-2">
                              <span
                                className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${priorityClass(
                                  suggestion.priority
                                )}`}
                              >
                                {suggestion.priority}
                              </span>

                              <span
                                className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${suggestionStatusClass(
                                  suggestion.status
                                )}`}
                              >
                                {suggestionStatusLabel(suggestion.status)}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900">
                              {suggestion.title}
                            </h4>

                            {suggestion.description && (
                              <p className="mt-2 text-sm text-slate-600">
                                {suggestion.description}
                              </p>
                            )}

                            {suggestion.expectedResult && (
                              <p className="mt-2 text-sm text-slate-700">
                                <span className="font-semibold">
                                  Résultat attendu :
                                </span>{" "}
                                {suggestion.expectedResult}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleConvertSuggestion(
                                selectedExploration.id,
                                suggestion.id
                              )
                            }
                            disabled={
                              suggestion.status === "CONVERTED" ||
                              convertingSuggestionId === suggestion.id
                            }
                            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              suggestion.status === "CONVERTED"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {convertingSuggestionId === suggestion.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : suggestion.status === "CONVERTED" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <FileCode2 className="h-4 w-4" />
                            )}
                            {suggestion.status === "CONVERTED"
                              ? "Convertie"
                              : "Convertir"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => handleValidate(selectedExploration.id)}
                  disabled={actionLoadingId === selectedExploration.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="h-5 w-5" />
                  Valider
                </button>

                <button
                  type="button"
                  onClick={() => handleArchive(selectedExploration.id)}
                  disabled={actionLoadingId === selectedExploration.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Archive className="h-5 w-5" />
                  Archiver
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedExploration.id)}
                  disabled={actionLoadingId === selectedExploration.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-5 w-5" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SmartQaChat
        apiBaseUrl={API_BASE_URL}
        projects={projects}
        explorations={explorations.map((exploration) => ({
          id: exploration.id,
          projectId: exploration.projectId,
          title: exploration.title,
          status: exploration.status,
        }))}
      />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function CheckboxOption({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
        checked
          ? "border-purple-300 bg-purple-50"
          : "border-slate-200 bg-white hover:border-purple-200"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
          checked
            ? "border-purple-700 bg-purple-700 text-white"
            : "border-slate-300 bg-white"
        }`}
      >
        {checked && <Check className="h-4 w-4" />}
      </span>

      <span>
        <span className="block font-bold text-slate-900">{title}</span>
        <span className="text-sm text-slate-500">{description}</span>
      </span>
    </button>
  );
}

function ExplorationCard({
  exploration,
  generating,
  actionLoading,
  onOpen,
  onGenerate,
  onValidate,
  onArchive,
  onDelete,
}: {
  exploration: AIExploration;
  generating: boolean;
  actionLoading: boolean;
  onOpen: () => void;
  onGenerate: () => void;
  onValidate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const convertedCount =
    exploration.suggestions?.filter((item) => item.status === "CONVERTED")
      .length || 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-purple-200 hover:shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <button type="button" onClick={onOpen} className="text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                exploration.status
              )}`}
            >
              {statusLabel(exploration.status)}
            </span>

            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
              {exploration.generatedCount || 0} suggestions
            </span>

            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
              {convertedCount} converties
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {generationModeLabel(exploration.generationMode)}
            </span>

            {exploration.fallbackUsed && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                Secours règles
              </span>
            )}
          </div>

          <h3 className="mt-3 text-xl font-bold text-slate-900">
            {exploration.title}
          </h3>

          <p className="mt-2 text-slate-600">
            {exploration.project?.name || "Projet inconnu"}
            {exploration.targetUrl ? ` · ${exploration.targetUrl}` : ""}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Profondeur {exploration.depth} · Playwright{" "}
            {exploration.generatePlaywright ? "Oui" : "Non"} · Gherkin{" "}
            {exploration.generateGherkin ? "Oui" : "Non"}
          </p>
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating}
            title="Générer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-700 text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={onValidate}
            disabled={actionLoading}
            title="Valider"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onArchive}
            disabled={actionLoading}
            title="Archiver"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Archive className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={actionLoading}
            title="Supprimer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}
