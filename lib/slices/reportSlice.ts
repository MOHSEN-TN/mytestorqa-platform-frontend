import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_URL = "http://localhost:3001";

export type ReportType =
  | "EXECUTION_SUMMARY"
  | "COVERAGE"
  | "TRENDS"
  | "BUG_REPORT"
  | "PERFORMANCE";

export type ReportFormat = "HTML" | "PDF" | "EXCEL";

export type ReportStatus = "GENERATED" | "SCHEDULED" | "GENERATING" | "FAILED";

export type Report = {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  period?: string | null;
  size?: string | null;
  fileUrl?: string | null;
  includeCharts: boolean;
  includeDetails: boolean;
  includeLogs: boolean;
  projectId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  } | null;
  createdBy?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
  };
};

type ReportStats = {
  total: number;
  generated: number;
  scheduled: number;
  generating: number;
  failed: number;
  storageUsed: string;
};

type ReportOptions = {
  types: ReportType[];
  formats: ReportFormat[];
  statuses: ReportStatus[];
  periods: string[];
  projects: {
    id: string;
    name: string;
  }[];
};

type ReportState = {
  reports: Report[];
  selectedReport: Report | null;
  preview: any | null;
  stats: ReportStats;
  options: ReportOptions;
  loading: boolean;
  creating: boolean;
  deleting: boolean;
  previewLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const initialState: ReportState = {
  reports: [],
  selectedReport: null,
  preview: null,
  stats: {
    total: 0,
    generated: 0,
    scheduled: 0,
    generating: 0,
    failed: 0,
    storageUsed: "0 MB",
  },
  options: {
    types: [],
    formats: [],
    statuses: [],
    periods: [],
    projects: [],
  },
  loading: false,
  creating: false,
  deleting: false,
  previewLoading: false,
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

export const fetchReports = createAsyncThunk(
  "reports/fetchReports",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      format?: string;
      status?: string;
      projectId?: string;
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const query = new URLSearchParams();

      query.set("page", String(params.page || 1));
      query.set("limit", String(params.limit || 10));

      if (params.search) query.set("search", params.search);
      if (params.type) query.set("type", params.type);
      if (params.format) query.set("format", params.format);
      if (params.status) query.set("status", params.status);
      if (params.projectId) query.set("projectId", params.projectId);

      const res = await fetch(`${API_URL}/reports?${query.toString()}`, {
        credentials: "include",
      });

      const data = await parseResponse(res);

      if (!res.ok) return rejectWithValue(data);

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors du chargement des rapports",
      });
    }
  },
);

export const fetchReportStats = createAsyncThunk(
  "reports/fetchReportStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/reports/stats`, {
        credentials: "include",
      });

      const data = await parseResponse(res);

      if (!res.ok) return rejectWithValue(data);

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors du chargement des statistiques",
      });
    }
  },
);

export const fetchReportOptions = createAsyncThunk(
  "reports/fetchReportOptions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/reports/options`, {
        credentials: "include",
      });

      const data = await parseResponse(res);

      if (!res.ok) return rejectWithValue(data);

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors du chargement des options",
      });
    }
  },
);

export const createReport = createAsyncThunk(
  "reports/createReport",
  async (
    payload: {
      name: string;
      type: ReportType;
      format: ReportFormat;
      period?: string;
      projectId?: string;
      includeCharts?: boolean;
      includeDetails?: boolean;
      includeLogs?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseResponse(res);

      if (!res.ok) return rejectWithValue(data);

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors de la génération du rapport",
      });
    }
  },
);

export const fetchReportPreview = createAsyncThunk(
  "reports/fetchReportPreview",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/reports/${id}/preview`, {
        credentials: "include",
      });

      const data = await parseResponse(res);

      if (!res.ok) return rejectWithValue(data);

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors du chargement de l’aperçu",
      });
    }
  },
);

export const deleteReport = createAsyncThunk(
  "reports/deleteReport",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/reports/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await parseResponse(res);

      if (!res.ok) return rejectWithValue(data);

      return { id, ...data };
    } catch (error: any) {
      return rejectWithValue({
        message: error?.message || "Erreur lors de la suppression du rapport",
      });
    }
  },
);

const reportSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    setSelectedReport(state, action) {
      state.selectedReport = action.payload;
    },
    clearReportPreview(state) {
      state.preview = null;
    },
    clearReportError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action: any) => {
        state.loading = false;
        state.reports = action.payload?.data || [];
        state.pagination = action.payload?.pagination || initialState.pagination;

        if (!state.selectedReport && state.reports.length > 0) {
          state.selectedReport = state.reports[0];
        }
      })
      .addCase(fetchReports.rejected, (state, action: any) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Erreur chargement des rapports";
      })

      .addCase(fetchReportStats.fulfilled, (state, action: any) => {
        state.stats = action.payload || initialState.stats;
      })

      .addCase(fetchReportOptions.fulfilled, (state, action: any) => {
        state.options = action.payload || initialState.options;
      })

      .addCase(createReport.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createReport.rejected, (state, action: any) => {
        state.creating = false;
        state.error =
          action.payload?.message || "Erreur génération du rapport";
      })

      .addCase(fetchReportPreview.pending, (state) => {
        state.previewLoading = true;
        state.error = null;
      })
      .addCase(fetchReportPreview.fulfilled, (state, action: any) => {
        state.previewLoading = false;
        state.preview = action.payload?.data || null;
      })
      .addCase(fetchReportPreview.rejected, (state, action: any) => {
        state.previewLoading = false;
        state.error =
          action.payload?.message || "Erreur chargement aperçu rapport";
      })

      .addCase(deleteReport.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action: any) => {
        state.deleting = false;
        state.reports = state.reports.filter(
          (report) => report.id !== action.payload?.id,
        );

        if (state.selectedReport?.id === action.payload?.id) {
          state.selectedReport = state.reports[0] || null;
        }
      })
      .addCase(deleteReport.rejected, (state, action: any) => {
        state.deleting = false;
        state.error =
          action.payload?.message || "Erreur suppression du rapport";
      });
  },
});

export const {
  setSelectedReport,
  clearReportPreview,
  clearReportError,
} = reportSlice.actions;

export default reportSlice.reducer;