// src/lib/slices/bugSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_URL = "http://localhost:3001";

export type BugStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export type BugSeverity = "MINOR" | "MAJOR" | "CRITICAL" | "BLOCKER";
export type BugPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Bug = {
  id: string;
  title: string;
  description?: string | null;
  steps?: string | null;
  status: BugStatus;
  severity: BugSeverity;
  priority: BugPriority;
  projectId?: string | null;
  testCaseId?: string | null;
  executionId?: string | null;
  reporterId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  } | null;
  testCase?: {
    id: string;
    title: string;
  } | null;
  reporter?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  assignee?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  } | null;
};

type BugStats = {
  total: number;
  open: number;
  new: number;
  inProgress: number;
  resolved: number;
  critical: number;
  mine: number;
};

type BugOptions = {
  projects: any[];
  users: any[];
  testCases: any[];
  executions: any[];
};

type BugState = {
  bugs: Bug[];
  selectedBug: Bug | null;
  stats: BugStats;
  options: BugOptions;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const initialState: BugState = {
  bugs: [],
  selectedBug: null,
  stats: {
    total: 0,
    open: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
    mine: 0,
  },
  options: {
    projects: [],
    users: [],
    testCases: [],
    executions: [],
  },
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
};

async function parseResponse(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text };
  }
}

export const fetchBugs = createAsyncThunk(
  "bugs/fetchBugs",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      mine?: boolean;
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const query = new URLSearchParams();

      if (params.page) query.set("page", String(params.page));
      if (params.limit) query.set("limit", String(params.limit));
      if (params.search) query.set("search", params.search);
      if (params.status) query.set("status", params.status);
      if (params.mine) query.set("mine", "true");

      const res = await fetch(`${API_URL}/bugs?${query.toString()}`, {
        credentials: "include",
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        return rejectWithValue(data);
      }

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors du chargement des bugs",
      });
    }
  },
);

export const fetchBugStats = createAsyncThunk(
  "bugs/fetchBugStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/bugs/stats`, {
        credentials: "include",
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        return rejectWithValue(data);
      }

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors du chargement des statistiques",
      });
    }
  },
);

export const fetchBugOptions = createAsyncThunk(
  "bugs/fetchBugOptions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/bugs/options`, {
        credentials: "include",
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        return rejectWithValue(data);
      }

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors du chargement des options",
      });
    }
  },
);

export const createBug = createAsyncThunk(
  "bugs/createBug",
  async (
    payload: {
      title: string;
      description?: string;
      steps?: string;
      severity?: BugSeverity;
      priority?: BugPriority;
      projectId?: string;
      testCaseId?: string;
      executionId?: string;
      assigneeId?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await fetch(`${API_URL}/bugs`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        return rejectWithValue(data);
      }

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors de la création du bug",
      });
    }
  },
);

export const updateBug = createAsyncThunk(
  "bugs/updateBug",
  async (
    payload: {
      id: string;
      data: Partial<{
        title: string;
        description: string;
        steps: string;
        status: BugStatus;
        severity: BugSeverity;
        priority: BugPriority;
        projectId: string;
        testCaseId: string;
        executionId: string;
        assigneeId: string;
      }>;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await fetch(`${API_URL}/bugs/${payload.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload.data),
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        return rejectWithValue(data);
      }

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors de la mise à jour du bug",
      });
    }
  },
);

export const deleteBug = createAsyncThunk(
  "bugs/deleteBug",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/bugs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        return rejectWithValue(data);
      }

      return { id, ...data };
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors de la suppression du bug",
      });
    }
  },
);

const bugSlice = createSlice({
  name: "bugs",
  initialState,
  reducers: {
    setSelectedBug(state, action) {
      state.selectedBug = action.payload;
    },
    clearBugError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBugs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBugs.fulfilled, (state, action: any) => {
        state.loading = false;
        state.bugs = action.payload?.data || [];
        state.pagination = action.payload?.pagination || initialState.pagination;
        if (!state.selectedBug && state.bugs.length > 0) {
          state.selectedBug = state.bugs[0];
        }
      })
      .addCase(fetchBugs.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || "Erreur chargement bugs";
      })

      .addCase(fetchBugStats.fulfilled, (state, action: any) => {
        state.stats = action.payload || initialState.stats;
      })

      .addCase(fetchBugOptions.fulfilled, (state, action: any) => {
        state.options = action.payload || initialState.options;
      })

      .addCase(createBug.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createBug.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createBug.rejected, (state, action: any) => {
        state.creating = false;
        state.error = action.payload?.message || "Erreur création bug";
      })

      .addCase(updateBug.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateBug.fulfilled, (state, action: any) => {
        state.updating = false;
        if (action.payload?.data) {
          state.selectedBug = action.payload.data;
        }
      })
      .addCase(updateBug.rejected, (state, action: any) => {
        state.updating = false;
        state.error = action.payload?.message || "Erreur mise à jour bug";
      })

      .addCase(deleteBug.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteBug.fulfilled, (state, action: any) => {
        state.deleting = false;
        state.bugs = state.bugs.filter((bug) => bug.id !== action.payload?.id);
        if (state.selectedBug?.id === action.payload?.id) {
          state.selectedBug = state.bugs[0] || null;
        }
      })
      .addCase(deleteBug.rejected, (state, action: any) => {
        state.deleting = false;
        state.error = action.payload?.message || "Erreur suppression bug";
      });
  },
});

export const { setSelectedBug, clearBugError } = bugSlice.actions;

export default bugSlice.reducer;