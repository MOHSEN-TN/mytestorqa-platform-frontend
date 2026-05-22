import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const API_URL = "http://localhost:3001";

export interface ProjectMember {
  id?: string;
  email: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt?: string;
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
  pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  selectedProject: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
};

// ─── Fetch (avec pagination) ───────────────────────────────────────────────
interface FetchProjectsParams {
  name?: string;
  page?: number;
  limit?: number;
}

interface FetchProjectsResponse {
  data: Project[];
  meta: PaginationMeta;
}

export const fetchProjects = createAsyncThunk<
  FetchProjectsResponse,
  FetchProjectsParams | undefined,
  { rejectValue: string }
>("projects/fetchProjects", async (params, thunkAPI) => {
  try {
    const query = new URLSearchParams();
    if (params?.name)  query.set("name",  encodeURIComponent(params.name));
    if (params?.page)  query.set("page",  String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const response = await fetch(`${API_URL}/projects?${query}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Impossible de charger les projets");
    return await response.json(); // { data, meta }
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue"
    );
  }
});

// ─── Create ────────────────────────────────────────────────────────────────
export const createProject = createAsyncThunk<
  Project,
  { name: string },
  { rejectValue: string }
>("projects/createProject", async (payload, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Impossible de créer le projet");
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue"
    );
  }
});

// ─── Update ────────────────────────────────────────────────────────────────
export const updateProject = createAsyncThunk<
  Project,
  { projectId: string; name: string },
  { rejectValue: string }
>("projects/updateProject", async (payload, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/projects/${payload.projectId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: payload.name }),
    });
    if (!response.ok) throw new Error("Impossible de modifier le projet");
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue"
    );
  }
});

// ─── Duplicate ─────────────────────────────────────────────────────────────
export const duplicateProject = createAsyncThunk<
  Project,
  string,
  { rejectValue: string }
>("projects/duplicateProject", async (projectId, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}/duplicate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Impossible de dupliquer le projet");
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue"
    );
  }
});

// ─── Delete ────────────────────────────────────────────────────────────────
export const deleteProject = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("projects/deleteProject", async (projectId, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Impossible de supprimer le projet");
    return projectId;
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue"
    );
  }
});

// ─── Slice ─────────────────────────────────────────────────────────────────
const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setSelectedProject(state, action: PayloadAction<Project | null>) {
      state.selectedProject = action.payload;
    },
    clearProjectError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects   = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erreur de chargement";
      })

      // create
      .addCase(createProject.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state) => {
        // on recharge via fetchProjects pour avoir la pagination correcte
        state.creating = false;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Erreur de création";
      })

      // update
      .addCase(updateProject.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.updating = false;
        state.projects = state.projects.map((p) =>
          p.id === action.payload.id ? action.payload : p
        );
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? "Erreur de modification";
      })

      // duplicate
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

      // delete
      .addCase(deleteProject.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.deleting = false;
        state.projects = state.projects.filter((p) => p.id !== action.payload);
        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }
        // recalcule le total local en attendant le refetch
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.pagination.totalPages = Math.ceil(
          state.pagination.total / state.pagination.limit
        );
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? "Erreur de suppression";
      });
  },
});

export const { setSelectedProject, clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;