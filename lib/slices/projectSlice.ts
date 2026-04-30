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

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  selectedProject: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
};

export const fetchProjects = createAsyncThunk<
  Project[],
  void,
  { rejectValue: string }
>("projects/fetchProjects", async (_, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Impossible de charger les projets");
    }

    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue"
    );
  }
});

export const createProject = createAsyncThunk<
  Project,
  { name: string },
  { rejectValue: string }
>("projects/createProject", async (payload, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Impossible de créer le projet");
    }

    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue"
    );
  }
});

export const updateProject = createAsyncThunk<
  Project,
  { projectId: string; name: string },
  { rejectValue: string }
>("projects/updateProject", async (payload, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/projects/${payload.projectId}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: payload.name }),
    });

    if (!response.ok) {
      throw new Error("Impossible de modifier le projet");
    }

    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue"
    );
  }
});

export const duplicateProject = createAsyncThunk<
  Project,
  string,
  { rejectValue: string }
>("projects/duplicateProject", async (projectId, thunkAPI) => {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}/duplicate`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Impossible de dupliquer le projet");
    }

    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue"
    );
  }
});

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

    if (!response.ok) {
      throw new Error("Impossible de supprimer le projet");
    }

    return projectId;
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur inconnue"
    );
  }
});

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
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erreur de chargement";
      })

      .addCase(createProject.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.creating = false;
        state.projects.unshift(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Erreur de création";
      })

      .addCase(updateProject.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.updating = false;
        state.projects = state.projects.map((project) =>
          project.id === action.payload.id ? action.payload : project
        );

        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? "Erreur de modification";
      })

      .addCase(duplicateProject.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(duplicateProject.fulfilled, (state, action) => {
        state.creating = false;
        state.projects.unshift(action.payload);
      })
      .addCase(duplicateProject.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Erreur de duplication";
      })

      .addCase(deleteProject.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.deleting = false;
        state.projects = state.projects.filter(
          (project) => project.id !== action.payload
        );

        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? "Erreur de suppression";
      });
  },
});

export const { setSelectedProject, clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;