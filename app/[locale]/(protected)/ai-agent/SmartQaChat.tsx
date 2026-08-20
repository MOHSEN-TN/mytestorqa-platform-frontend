"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  MessageSquarePlus,
  Plus,
  Send,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

type ProjectOption = {
  id: string;
  name: string;
};

type ExplorationOption = {
  id: string;
  projectId: string;
  title: string;
  status: string;
};

type ChatRole = "SYSTEM" | "USER" | "ASSISTANT";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
  pending?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  model: string;
  projectId?: string | null;
  explorationId?: string | null;
  lastMessageAt: string;
  project?: {
    id: string;
    name: string;
  } | null;
  exploration?: {
    id: string;
    title: string;
    status: string;
  } | null;
  messages?: Array<{
    id: string;
    role: ChatRole;
    content: string;
    createdAt: string;
  }>;
};

type ChatProvider = "OLLAMA_LOCAL" | "CLOUD_AI";

type ProviderStatus = {
  available: boolean;
  configuredModel: string;
  version?: string;
  apiVersion?: string;
  displayName?: string;
  configured?: boolean;
  modelInstalled?: boolean;
  error?: string;
};

type SmartQaStatus = {
  defaultProvider: ChatProvider;
  providers: Record<ChatProvider, ProviderStatus>;
};

type SendMessageResponse = {
  session: ChatSession;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  usage?: {
    totalDurationMs?: number;
    promptTokens?: number;
    completionTokens?: number;
  };
};

type SmartQaChatProps = {
  apiBaseUrl: string;
  projects: ProjectOption[];
  explorations: ExplorationOption[];
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "smart-qa-welcome",
  role: "ASSISTANT",
  content:
    "Bonjour, je suis SMART-QA. Sélectionnez un projet ou une exploration, puis posez-moi une question sur vos tests, anomalies, risques ou scénarios d’automatisation.",
};

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string" && data.trim()) return data;

  if (data && typeof data === "object" && "message" in data) {
    const value = (data as { message?: unknown }).message;

    if (Array.isArray(value)) return value.join(" · ");
    if (typeof value === "string") return value;
  }

  return fallback;
}

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function formatTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function SmartQaChat({
  apiBaseUrl,
  projects,
  explorations,
}: SmartQaChatProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SmartQaStatus | null>(null);
  const [provider, setProvider] = useState<ChatProvider>("CLOUD_AI");
  const [statusLoading, setStatusLoading] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [explorationId, setExplorationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const providerInitializedRef = useRef(false);

  const activeStatus = status?.providers?.[provider] || null;
  const providerReady = Boolean(
    activeStatus?.available &&
      (provider !== "OLLAMA_LOCAL" || activeStatus.modelInstalled)
  );
  const providerLabel = provider === "CLOUD_AI" ? "Gemini" : "Ollama";

  const availableExplorations = useMemo(
    () =>
      explorations.filter(
        (exploration) => !projectId || exploration.projectId === projectId
      ),
    [explorations, projectId]
  );

  const loadStatus = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setStatusLoading(true);
      const response = await fetch(`${apiBaseUrl}/smart-qa/status`, {
        credentials: "include",
      });
      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible de vérifier les fournisseurs IA.")
        );
      }

      const nextStatus = data as SmartQaStatus;
      setStatus(nextStatus);

      if (!providerInitializedRef.current) {
        setProvider(nextStatus.defaultProvider || "CLOUD_AI");
        providerInitializedRef.current = true;
      }
    } catch (err) {
      const fallbackStatus: SmartQaStatus = {
        defaultProvider: "CLOUD_AI",
        providers: {
          OLLAMA_LOCAL: {
            available: false,
            configuredModel: "qwen3.5:9b",
            modelInstalled: false,
            error: err instanceof Error ? err.message : "Ollama indisponible",
          },
          CLOUD_AI: {
            available: false,
            configured: false,
            configuredModel: "gemini-3.6-flash",
            error: err instanceof Error ? err.message : "Gemini indisponible",
          },
        },
      };

      // Une actualisation silencieuse ne doit pas faire clignoter un fournisseur
      // déjà connecté à cause d'une erreur réseau ponctuelle.
      setStatus((previous) => (showLoading || !previous ? fallbackStatus : previous));
    } finally {
      if (showLoading) setStatusLoading(false);
    }
  }, [apiBaseUrl]);

  const loadSessions = useCallback(async () => {
    try {
      const query = projectId
        ? `?projectId=${encodeURIComponent(projectId)}`
        : "";
      const response = await fetch(
        `${apiBaseUrl}/smart-qa/chat/sessions${query}`,
        {
          credentials: "include",
        }
      );
      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible de charger les conversations.")
        );
      }

      setSessions(Array.isArray(data) ? (data as ChatSession[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }, [apiBaseUrl, projectId]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void loadStatus(true);
    }, 0);

    const intervalTimer = window.setInterval(() => {
      if (!sending) void loadStatus(false);
    }, 60_000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalTimer);
    };
  }, [loadStatus, sending]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      void loadSessions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, loadSessions]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function startNewConversation() {
    setSessionId("");
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setError(null);
  }

  function handleProviderChange(value: ChatProvider) {
    setProvider(value);
    startNewConversation();
  }

  function handleProjectChange(value: string) {
    setProjectId(value);
    setExplorationId("");
    startNewConversation();
  }

  function handleExplorationChange(value: string) {
    setExplorationId(value);

    const exploration = explorations.find((item) => item.id === value);
    if (exploration) setProjectId(exploration.projectId);

    startNewConversation();
  }

  async function selectSession(value: string) {
    setSessionId(value);
    setError(null);

    if (!value) {
      startNewConversation();
      return;
    }

    const session = sessions.find((item) => item.id === value);
    if (session?.projectId) setProjectId(session.projectId);
    if (session?.explorationId) setExplorationId(session.explorationId);
    if (session?.model) {
      const normalizedModel = session.model
        .trim()
        .toLowerCase()
        .replace(/^models\//, "");

      setProvider(
        normalizedModel.startsWith("gemini-")
          ? "CLOUD_AI"
          : "OLLAMA_LOCAL"
      );
    }

    try {
      setLoadingMessages(true);
      const response = await fetch(
        `${apiBaseUrl}/smart-qa/chat/sessions/${value}/messages`,
        {
          credentials: "include",
        }
      );
      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible de charger les messages.")
        );
      }

      const loaded = Array.isArray(data) ? (data as ChatMessage[]) : [];
      setMessages(loaded.length ? loaded : [WELCOME_MESSAGE]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function deleteCurrentSession() {
    if (!sessionId) return;

    const confirmed = window.confirm(
      "Supprimer cette conversation SMART-QA ?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `${apiBaseUrl}/smart-qa/chat/sessions/${sessionId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible de supprimer la conversation.")
        );
      }

      setSessions((previous) =>
        previous.filter((session) => session.id !== sessionId)
      );
      startNewConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  async function sendMessage() {
    const message = input.trim();

    if (!message || sending) return;

    if (!providerReady) {
      setError(
        provider === "OLLAMA_LOCAL" && activeStatus?.available
          ? `Le modèle ${activeStatus.configuredModel} n’est pas installé dans Ollama.`
          : activeStatus?.error || `${providerLabel} est indisponible.`
      );
      return;
    }

    const optimisticId = `local-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      role: "USER",
      content: message,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setInput("");
    setError(null);
    setSending(true);
    setMessages((previous) => [...previous, optimisticMessage]);

    try {
      const response = await fetch(`${apiBaseUrl}/smart-qa/chat/messages`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          sessionId: sessionId || undefined,
          projectId: sessionId ? undefined : projectId || undefined,
          explorationId: sessionId ? undefined : explorationId || undefined,
          provider: sessionId ? undefined : provider,
        }),
      });
      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "SMART-QA n’a pas pu répondre.")
        );
      }

      const result = data as SendMessageResponse;
      setSessionId(result.session.id);
      setMessages((previous) => [
        ...previous.filter((item) => item.id !== optimisticId),
        result.userMessage,
        result.assistantMessage,
      ]);
      setSessions((previous) => {
        const withoutCurrent = previous.filter(
          (session) => session.id !== result.session.id
        );
        return [result.session, ...withoutCurrent];
      });
    } catch (err) {
      setMessages((previous) =>
        previous.map((item) =>
          item.id === optimisticId ? { ...item, pending: false } : item
        )
      );
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSending(false);
    }
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fermer SMART-QA" : "Ouvrir SMART-QA"}
        className="fixed bottom-6 right-6 z-50 flex h-14 items-center gap-2 rounded-full bg-purple-700 px-5 font-bold text-white shadow-xl transition hover:bg-purple-800"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        <span className="hidden sm:inline">SMART-QA</span>
      </button>

      {open && (
        <section className="fixed inset-x-3 bottom-24 z-50 flex max-h-[78vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:w-[430px]">
          <header className="bg-purple-700 p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">SMART-QA</h2>
                  <p className="text-xs text-purple-100">
                    Assistant QA · {activeStatus?.configuredModel ||
                      (provider === "CLOUD_AI" ? "gemini-3.6-flash" : "qwen3.5:9b")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition hover:bg-white/15"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs">
              <span className="flex items-center gap-2">
                {statusLoading && !activeStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : providerReady ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                {!activeStatus && statusLoading
                  ? `Vérification de ${providerLabel}...`
                  : providerReady
                    ? `${providerLabel} connecté${
                        activeStatus?.version
                          ? ` · v${activeStatus.version}`
                          : activeStatus?.apiVersion
                            ? ` · ${activeStatus.apiVersion}`
                            : ""
                      }`
                    : provider === "OLLAMA_LOCAL" && activeStatus?.available
                      ? "Modèle Ollama absent"
                      : `${providerLabel} indisponible`}
                {statusLoading && activeStatus && (
                  <Loader2 className="h-3 w-3 animate-spin opacity-70" />
                )}
              </span>
              <button
                type="button"
                onClick={() => void loadStatus(true)}
                className="font-semibold underline decoration-white/40 underline-offset-2"
              >
                Actualiser
              </button>
            </div>
          </header>

          <div className="space-y-3 border-b border-slate-200 bg-slate-50 p-3">
            <select
              value={provider}
              onChange={(event) =>
                handleProviderChange(event.target.value as ChatProvider)
              }
              disabled={Boolean(sessionId)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-purple-500 disabled:bg-slate-100"
              aria-label="Fournisseur IA"
            >
              <option value="CLOUD_AI">Gemini Cloud</option>
              <option value="OLLAMA_LOCAL">Ollama local</option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={projectId}
                onChange={(event) => handleProjectChange(event.target.value)}
                disabled={Boolean(sessionId)}
                className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-purple-500 disabled:bg-slate-100"
                aria-label="Contexte projet"
              >
                <option value="">Contexte général</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <select
                value={explorationId}
                onChange={(event) => handleExplorationChange(event.target.value)}
                disabled={Boolean(sessionId) || availableExplorations.length === 0}
                className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-purple-500 disabled:bg-slate-100"
                aria-label="Contexte exploration"
              >
                <option value="">Toutes les données du projet</option>
                {availableExplorations.map((exploration) => (
                  <option key={exploration.id} value={exploration.id}>
                    {exploration.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <select
                value={sessionId}
                onChange={(event) => void selectSession(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-purple-500"
                aria-label="Conversation"
              >
                <option value="">Nouvelle conversation</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={startNewConversation}
                title="Nouvelle conversation"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 transition hover:bg-purple-200"
              >
                <Plus className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => void deleteCurrentSession()}
                disabled={!sessionId}
                title="Supprimer la conversation"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 sm:h-[390px]">
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Chargement...
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "USER" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      message.role === "USER"
                        ? "rounded-br-md bg-purple-700 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                    } ${message.pending ? "opacity-70" : ""}`}
                  >
                    {message.role !== "USER" && (
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-purple-700">
                        <Bot className="h-3.5 w-3.5" />
                        SMART-QA
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words leading-6">
                      {message.content}
                    </p>
                    <p
                      className={`mt-1 text-right text-[10px] ${
                        message.role === "USER"
                          ? "text-purple-200"
                          : "text-slate-400"
                      }`}
                    >
                      {message.pending ? "Envoi..." : formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-700" />
                  SMART-QA analyse le contexte...
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <footer className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-100">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                rows={2}
                maxLength={8_000}
                placeholder="Ex. Analyse les risques et propose les tests prioritaires..."
                className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-slate-900 outline-none"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || sending || !providerReady}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-700 text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Envoyer"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <MessageSquarePlus className="h-3 w-3" />
              {provider === "CLOUD_AI"
                ? "Traitement cloud via Gemini. Aucun secret ne doit être saisi."
                : "Traitement local via Ollama. Aucun secret ne doit être saisi."}
            </p>
          </footer>
        </section>
      )}
    </>
  );
}
