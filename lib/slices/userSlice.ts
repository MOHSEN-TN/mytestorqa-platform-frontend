import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export type UserRole = "ADMIN" | "QA_LEAD" | "TESTER";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type UsersState = {
  users: User[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  resettingPassword: boolean;
  error: string | null;
  selectedUser: User | null;
  pagination: Pagination;
};

const initialState: UsersState = {
  users: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  resettingPassword: false,
  error: null,
  selectedUser: null,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

type ApiError = { message?: string };

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (
    params: { page?: number; limit?: number; search?: string } = {},
    { rejectWithValue },
  ) => {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set("page", String(params.page));
      if (params.limit) query.set("limit", String(params.limit));
      if (params.search) query.set("search", params.search);

      const response = await fetch(`${API_URL}/users?${query.toString()}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await parseResponse(response);
      if (!response.ok) return rejectWithValue(data);
      return data;
    } catch (error: unknown) {
      return rejectWithValue({
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des utilisateurs",
      });
    }
  },
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (
    data: {
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      locale?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData = await parseResponse(response);
      if (!response.ok) return rejectWithValue(responseData);
      return responseData;
    } catch (error: unknown) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Erreur lors de la création",
      });
    }
  },
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async (
    payload: {
      userId: string;
      data: {
        email?: string;
        firstName?: string;
        lastName?: string;
        role?: UserRole;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`${API_URL}/users/${payload.userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });
      const responseData = await parseResponse(response);
      if (!response.ok) return rejectWithValue(responseData);
      return responseData;
    } catch (error: unknown) {
      return rejectWithValue({
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour",
      });
    }
  },
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await parseResponse(response);
      if (!response.ok) return rejectWithValue(data);
      return { userId, ...data };
    } catch (error: unknown) {
      return rejectWithValue({
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
      });
    }
  },
);

export const resetUserPassword = createAsyncThunk(
  "users/resetUserPassword",
  async (
    payload: string | { userId: string; locale?: string },
    { rejectWithValue },
  ) => {
    try {
      const userId = typeof payload === "string" ? payload : payload.userId;
      const locale = typeof payload === "string" ? undefined : payload.locale;

      const response = await fetch(`${API_URL}/users/${userId}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await parseResponse(response);
      if (!response.ok) return rejectWithValue(data);
      return data as { message?: string };
    } catch (error: unknown) {
      return rejectWithValue({
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de l’envoi du lien de réinitialisation",
      });
    }
  },
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setSelectedUser(state, action: PayloadAction<User | null>) {
      state.selectedUser = action.payload;
    },
    clearUsersError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload?.data ?? [];
        state.pagination = action.payload?.pagination ?? initialState.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        const payload = action.payload as ApiError | undefined;
        state.loading = false;
        state.error =
          payload?.message ?? "Erreur lors du chargement des utilisateurs";
      })
      .addCase(createUser.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createUser.rejected, (state, action) => {
        const payload = action.payload as ApiError | undefined;
        state.creating = false;
        state.error = payload?.message ?? "Erreur lors de la création";
      })
      .addCase(updateUser.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.updating = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        const payload = action.payload as ApiError | undefined;
        state.updating = false;
        state.error = payload?.message ?? "Erreur lors de la mise à jour";
      })
      .addCase(deleteUser.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.deleting = false;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        const payload = action.payload as ApiError | undefined;
        state.deleting = false;
        state.error = payload?.message ?? "Erreur lors de la suppression";
      })
      .addCase(resetUserPassword.pending, (state) => {
        state.resettingPassword = true;
        state.error = null;
      })
      .addCase(resetUserPassword.fulfilled, (state) => {
        state.resettingPassword = false;
      })
      .addCase(resetUserPassword.rejected, (state, action) => {
        const payload = action.payload as ApiError | undefined;
        state.resettingPassword = false;
        state.error =
          payload?.message ??
          "Erreur lors de l’envoi du lien de réinitialisation";
      });
  },
});

export const { setSelectedUser, clearUsersError } = userSlice.actions;
export default userSlice.reducer;
