// lib/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getUsers,
  createUser as createUserApi,
  updateUser as updateUserApi,
  deleteUser as deleteUserApi,
  resetUserPassword as resetUserPasswordApi,
  type User,
  type CreateUserPayload,
  type UpdateUserPayload,
  type PaginatedUsers,
  type FetchUsersParams,
} from "@/lib/user-api";

interface UsersState {
  users: User[];
  total: number;
  totalPages: number;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  resetting: boolean;
  error: string | null;
  selectedUser: User | null;
}

const initialState: UsersState = {
  users: [],
  total: 0,
  totalPages: 1,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  resetting: false,
  error: null,
  selectedUser: null,
};

/* ── Thunks ── */

export const fetchUsers = createAsyncThunk<
  PaginatedUsers,
  FetchUsersParams,
  { rejectValue: string }
>("users/fetchUsers", async (params, thunkAPI) => {
  try {
    return await getUsers(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Erreur de chargement des utilisateurs"
    );
  }
});

export const createUser = createAsyncThunk<
  User,
  CreateUserPayload,
  { rejectValue: string }
>("users/createUser", async (payload, thunkAPI) => {
  try {
    return await createUserApi(payload);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de créer l'utilisateur"
    );
  }
});

export const updateUser = createAsyncThunk<
  User,
  { userId: string; data: UpdateUserPayload },
  { rejectValue: string }
>("users/updateUser", async (payload, thunkAPI) => {
  try {
    return await updateUserApi(payload.userId, payload.data);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de modifier l'utilisateur"
    );
  }
});

export const deleteUser = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("users/deleteUser", async (userId, thunkAPI) => {
  try {
    await deleteUserApi(userId);
    return userId;
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de supprimer l'utilisateur"
    );
  }
});

export const resetUserPassword = createAsyncThunk<
  { message: string; temporaryPassword?: string },
  string,
  { rejectValue: string }
>("users/resetUserPassword", async (userId, thunkAPI) => {
  try {
    return await resetUserPasswordApi(userId);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de réinitialiser le mot de passe"
    );
  }
});

/* ── Slice ── */

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
    clearUsers(state) {
      state.users = [];
      state.total = 0;
      state.totalPages = 1;
      state.loading = false;
      state.error = null;
    },
    setSelectedUser(state, action: PayloadAction<User | null>) {
      state.selectedUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      /* fetch */
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.items;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erreur de chargement";
      })

      /* create */
      .addCase(createUser.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.creating = false;
        state.users.unshift(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Erreur de création";
      })

      /* update */
      .addCase(updateUser.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updating = false;
        state.users = state.users.map((user) =>
          user.id === action.payload.id ? action.payload : user
        );
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? "Erreur de modification";
      })

      /* delete */
      .addCase(deleteUser.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleting = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? "Erreur de suppression";
      })

      /* reset password */
      .addCase(resetUserPassword.pending, (state) => {
        state.resetting = true;
        state.error = null;
      })
      .addCase(resetUserPassword.fulfilled, (state) => {
        state.resetting = false;
      })
      .addCase(resetUserPassword.rejected, (state, action) => {
        state.resetting = false;
        state.error = action.payload ?? "Erreur de réinitialisation";
      });
  },
});

export const { clearUserError, clearUsers, setSelectedUser } = userSlice.actions;
export default userSlice.reducer;