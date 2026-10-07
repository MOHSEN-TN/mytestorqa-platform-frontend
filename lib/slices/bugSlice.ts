// src/lib/slices/bugSlice.ts
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

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

type BugOption = {
  id: string;
  name?: string;
  title?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
};

type BugOptions = {
  projects: BugOption[];
  users: BugOption[];
  suites: BugOption[];
  testCases: BugOption[];
  campaigns: BugOption[];
  iterations: BugOption[];
  executions: BugOption[];
};

type BugPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  pagination: BugPagination;
};

type ApiError = {
  message?: string;
  [key: string]: unknown;
};

type FetchBugsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  projectId?: string;
  mine?: boolean;
};

type FetchBugsResponse = {
  data?: Bug[];
  pagination?: BugPagination;
};

type BugOptionFilters = {
  projectId?: string;
  suiteId?: string;
  campaignId?: string;
  iterationId?: string;
  testCaseId?: string;
};

type CreateBugPayload = {
  title: string;
  description?: string;
  steps?: string;
  severity?: BugSeverity;
  priority?: BugPriority;
  projectId?: string;
  testCaseId?: string;
  iterationId?: string;
  executionId?: string;
  assigneeId?: string;
};

type CreateBugResponse = {
  data?: Bug;
};

type UpdateBugPayload = {
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
};

type UpdateBugResponse = {
  data?: Bug;
};

type DeleteBugResponse = {
  id: string;
  [key: string]: unknown;
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
    suites: [],
    testCases: [],
    campaigns: [],
    iterations: [],
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

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();

  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    return { message: text } as T;
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

function toApiError(value: unknown): ApiError {
  if (typeof value === "object" && value !== null) {
    return value as ApiError;
  }

  if (typeof value === "string") {
    return { message: value };
  }

  return {};
}

export const fetchBugs = createAsyncThunk<
  FetchBugsResponse,
  FetchBugsParams | undefined,
  { rejectValue: ApiError }
>(
  "bugs/fetchBugs",
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();

      if (params.page) query.set("page", String(params.page));
      if (params.limit) query.set("limit", String(params.limit));
      if (params.search) query.set("search", params.search);
      if (params.status) query.set("status", params.status);
      if (params.projectId) query.set("projectId", params.projectId);
      if (params.mine) query.set("mine", "true");

      const res = await fetch(`${API_URL}/bugs?${query.toString()}`, {
        credentials: "include",
      });

      const data = await parseResponse<FetchBugsResponse>(res);

      if (!res.ok) {
        return rejectWithValue(toApiError(data));
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Erreur lors du chargement des bugs",
        ),
      });
    }
  },
);

export const fetchBugStats = createAsyncThunk<
  BugStats,
  void,
  { rejectValue: ApiError }
>(
  "bugs/fetchBugStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/bugs/stats`, {
        credentials: "include",
      });

      const data = await parseResponse<BugStats>(res);

      if (!res.ok) {
        return rejectWithValue(toApiError(data));
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Erreur lors du chargement des statistiques",
        ),
      });
    }
  },
);

export const fetchBugOptions = createAsyncThunk<
  BugOptions,
  string | BugOptionFilters | undefined,
  { rejectValue: ApiError }
>(
  "bugs/fetchBugOptions",
  async (filters, { rejectWithValue }) => {
    try {
      const normalized =
        typeof filters === "string" ? { projectId: filters } : filters || {};
      const query = new URLSearchParams();

      if (normalized.projectId) query.set("projectId", normalized.projectId);
      if (normalized.suiteId) query.set("suiteId", normalized.suiteId);
      if (normalized.campaignId) query.set("campaignId", normalized.campaignId);
      if (normalized.iterationId) query.set("iterationId", normalized.iterationId);
      if (normalized.testCaseId) query.set("testCaseId", normalized.testCaseId);

      const suffix = query.toString() ? `?${query.toString()}` : "";
      const res = await fetch(`${API_URL}/bugs/options${suffix}`, {
        credentials: "include",
      });

      const data = await parseResponse<BugOptions>(res);

      if (!res.ok) {
        return rejectWithValue(toApiError(data));
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Erreur lors du chargement des options",
        ),
      });
    }
  },
);

export const createBug = createAsyncThunk<
  CreateBugResponse,
  CreateBugPayload,
  { rejectValue: ApiError }
>(
  "bugs/createBug",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/bugs`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseResponse<CreateBugResponse>(res);

      if (!res.ok) {
        return rejectWithValue(toApiError(data));
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Erreur lors de la création du bug",
        ),
      });
    }
  },
);

export const updateBug = createAsyncThunk<
  UpdateBugResponse,
  UpdateBugPayload,
  { rejectValue: ApiError }
>(
  "bugs/updateBug",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/bugs/${payload.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload.data),
      });

      const data = await parseResponse<UpdateBugResponse>(res);

      if (!res.ok) {
        return rejectWithValue(toApiError(data));
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Erreur lors de la mise à jour du bug",
        ),
      });
    }
  },
);

export const deleteBug = createAsyncThunk<
  DeleteBugResponse,
  string,
  { rejectValue: ApiError }
>(
  "bugs/deleteBug",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/bugs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await parseResponse<Record<string, unknown>>(res);

      if (!res.ok) {
        return rejectWithValue(toApiError(data));
      }

      return { id, ...data };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Erreur lors de la suppression du bug",
        ),
      });
    }
  },
);

const bugSlice = createSlice({
  name: "bugs",
  initialState,
  reducers: {
    setSelectedBug(state, action: PayloadAction<Bug | null>) {
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
      .addCase(fetchBugs.fulfilled, (state, action) => {
        state.loading = false;
        state.bugs = action.payload.data ?? [];
        state.pagination =
          action.payload.pagination ?? initialState.pagination;

        if (
          !state.selectedBug ||
          !state.bugs.some((bug) => bug.id === state.selectedBug?.id)
        ) {
          state.selectedBug = state.bugs[0] ?? null;
        }
      })
      .addCase(fetchBugs.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ?? "Erreur chargement bugs";
      })

      .addCase(fetchBugStats.fulfilled, (state, action) => {
        state.stats = action.payload ?? initialState.stats;
      })

      .addCase(fetchBugOptions.fulfilled, (state, action) => {
        state.options = action.payload ?? initialState.options;
      })

      .addCase(createBug.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createBug.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createBug.rejected, (state, action) => {
        state.creating = false;
        state.error =
          action.payload?.message ?? "Erreur création bug";
      })

      .addCase(updateBug.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateBug.fulfilled, (state, action) => {
        state.updating = false;
        if (action.payload.data) {
          state.selectedBug = action.payload.data;
        }
      })
      .addCase(updateBug.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload?.message ?? "Erreur mise à jour bug";
      })

      .addCase(deleteBug.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteBug.fulfilled, (state, action) => {
        state.deleting = false;
        state.bugs = state.bugs.filter((bug) => bug.id !== action.payload.id);
        if (state.selectedBug?.id === action.payload.id) {
          state.selectedBug = state.bugs[0] ?? null;
        }
      })
      .addCase(deleteBug.rejected, (state, action) => {
        state.deleting = false;
        state.error =
          action.payload?.message ?? "Erreur suppression bug";
      });
  },
});

export const { setSelectedBug, clearBugError } = bugSlice.actions;

export default bugSlice.reducer;
