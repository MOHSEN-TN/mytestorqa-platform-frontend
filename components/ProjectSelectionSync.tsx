"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  setSelectedProject,
  type Project,
} from "@/lib/slices/projectSlice";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

const STORAGE_KEY = "selected_project";

type ProjectsResponse = {
  data?: Project[];
};

function isStoredProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<Project>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.length > 0
  );
}

async function readProjects(url: string): Promise<Project[]> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Impossible de résoudre le projet sélectionné.");
  }

  const result = (await response.json()) as ProjectsResponse;
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Synchronise uniquement l'identifiant/projet actif du frontend.
 * Ce composant est invisible et est monté une seule fois dans le layout protégé.
 * Les données métier restent chargées/filtrées par le backend.
 */
export default function ProjectSelectionSync() {
  const dispatch = useAppDispatch();
  const selectedProject = useAppSelector(
    (state) => state.projects.selectedProject,
  );

  const initializedRef = useRef(false);
  const readyRef = useRef(false);

  const resolveInitialProject = useCallback(async () => {
    let savedProject: Project | null = null;

    const rawSavedProject = window.localStorage.getItem(STORAGE_KEY);

    if (rawSavedProject) {
      try {
        const parsed = JSON.parse(rawSavedProject) as unknown;
        if (isStoredProject(parsed)) {
          savedProject = parsed;
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Important pour les changements de compte : ne jamais laisser un ancien
    // projet Redux être utilisé pendant la revalidation du nouvel utilisateur.
    dispatch(setSelectedProject(null));

    try {
      let resolvedProject: Project | null = null;

      // Revalide toujours le projet mémorisé contre les projets accessibles
      // à l'utilisateur actuellement authentifié.
      if (savedProject) {
        const query = new URLSearchParams({
          name: savedProject.name,
          page: "1",
          limit: "100",
        });

        const matches = await readProjects(
          `${API_URL}/projects?${query.toString()}`,
        );

        resolvedProject =
          matches.find((project) => project.id === savedProject?.id) ?? null;
      }

      // Projet mémorisé absent/supprimé/inaccessible : premier projet accessible.
      if (!resolvedProject) {
        const fallbackProjects = await readProjects(
          `${API_URL}/projects?page=1&limit=1`,
        );
        resolvedProject = fallbackProjects[0] ?? null;
      }

      dispatch(setSelectedProject(resolvedProject));

      if (resolvedProject) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(resolvedProject),
        );
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ne restaure jamais un projet non vérifié après une erreur API/auth.
      dispatch(setSelectedProject(null));
    } finally {
      readyRef.current = true;
    }
  }, [dispatch]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    void resolveInitialProject();
  }, [resolveInitialProject]);

  useEffect(() => {
    if (!readyRef.current) return;

    if (selectedProject) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(selectedProject),
      );
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedProject]);

  return null;
}
