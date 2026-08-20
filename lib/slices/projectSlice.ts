import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export interface ProjectMember {
  id?: string;
  email: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  baseUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  members?: ProjectMember[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProjectState {
  projects: Project[];
  pagination: PaginationMeta;
  selectedProject: Project | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  selectedProject: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
};

interface FetchProjectsParams {
  name?: string;
  page?: number;
  limit?: number;
}

interface FetchProjectsResponse {
  data: Project[];
  meta: PaginationMeta;
}

interface CreateProjectPayload {
  name: string;
  description?: string;
  baseUrl?: string;
}

interface UpdateProjectPayload {
  projectId: string;
  name: string;
  description?: string;
  baseUrl?: string;
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getErrorMessage(
  data: unknown,
  fallbackMessage: string,
): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message?: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }

  return fallbackMessage;
}

// ─── Fetch projects ────────────────────────────────────────────────────────
export const fetchProjects = createAsyncThunk<
  FetchProjectsResponse,
  FetchProjectsParams | undefined,
  { rejectValue: string }
>("projects/fetchProjects", async (params, thunkAPI) => {
  try {
    const query = new URLSearchParams();

    if (params?.name?.trim()) {
      query.set("name", params.name.trim());
    }

    if (params?.page) {
      query.set("page", String(params.page));
    }

    if (params?.limit) {
      query.set("limit", String(params.limit));
    }

    const response = await fetch(
      `${API_URL}/projects?${query.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(data, "Impossible de charger les projets"),
      );
    }

    return data as FetchProjectsResponse;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue",
    );
  }
});

// ─── Create project ────────────────────────────────────────────────────────
export const createProject = createAsyncThunk<
  Project,
  CreateProjectPayload,
  { rejectValue: string }
>("projects/createProject", async (payload, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        baseUrl: payload.baseUrl?.trim() || null,
      }),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(data, "Impossible de créer le projet"),
      );
    }

    return data as Project;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue",
    );
  }
});

// ─── Update project ────────────────────────────────────────────────────────
export const updateProject = createAsyncThunk<
  Project,
  UpdateProjectPayload,
  { rejectValue: string }
>("projects/updateProject", async (payload, thunkAPI) => {
  try {
    const response = await fetch(
      `${API_URL}/projects/${payload.projectId}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: payload.name.trim(),
          description: payload.description?.trim() || null,
          baseUrl: payload.baseUrl?.trim() || null,
        }),
      },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(data, "Impossible de modifier le projet"),
      );
    }

    return data as Project;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue",
    );
  }
});

// ─── Duplicate project ─────────────────────────────────────────────────────
export const duplicateProject = createAsyncThunk<
  Project,
  string,
  { rejectValue: string }
>("projects/duplicateProject", async (projectId, thunkAPI) => {
  try {
    const response = await fetch(
      `${API_URL}/projects/${projectId}/duplicate`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(data, "Impossible de dupliquer le projet"),
      );
    }

    return data as Project;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue",
    );
  }
});

// ─── Delete project ────────────────────────────────────────────────────────
export const deleteProject = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("projects/deleteProject", async (projectId, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(data, "Impossible de supprimer le projet"),
      );
    }

    return projectId;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue",
    );
  }
});

// ─── Slice ─────────────────────────────────────────────────────────────────
const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setSelectedProject(
      state,
      action: PayloadAction<Project | null>,
    ) {
      state.selectedProject = action.payload;
    },

    clearProjectError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erreur de chargement";
      })

      // Create
      .addCase(createProject.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Erreur de création";
      })

      // Update
      .addCase(updateProject.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.updating = false;

        state.projects = state.projects.map((project) =>
          project.id === action.payload.id
            ? action.payload
            : project,
        );

        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? "Erreur de modification";
      })

      // Duplicate
      .addCase(duplicateProject.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(duplicateProject.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(duplicateProject.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Erreur de duplication";
      })

      // Delete
      .addCase(deleteProject.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.deleting = false;

        state.projects = state.projects.filter(
          (project) => project.id !== action.payload,
        );

        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1,
        );

        state.pagination.totalPages = Math.ceil(
          state.pagination.total / state.pagination.limit,
        );
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? "Erreur de suppression";
      });
  },
});

export const {
  setSelectedProject,
  clearProjectError,
} = projectSlice.actions;

export default projectSlice.reducer;
