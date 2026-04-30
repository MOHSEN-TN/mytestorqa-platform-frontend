import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createTestCase as createTestCaseApi,
  deleteTestCase as deleteTestCaseApi,
  duplicateTestCase as duplicateTestCaseApi,
  getTestCases,
  updateTestCase as updateTestCaseApi,
} from "@/lib/testcase-api";






export interface TestStep {
  id: string;
  testCaseId: string;
  stepOrder: number;
  action: string;
  expected?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: string;
  suiteId: string;
  title: string;
  description?: string | null;
  expected?: string | null;
  status: "DRAFT" | "READY" | "DEPRECATED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
  updatedAt: string;
  steps: TestStep[];
}

export interface CreateTestCasePayload {
  suiteId: string;
  title: string;
  description?: string;
  expected?: string;
  status?: "DRAFT" | "READY" | "DEPRECATED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  steps?: Array<{
    action: string;
    expected?: string;
  }>;
}

export interface UpdateTestCasePayload {
  suiteId: string;
  testCaseId: string;
  title?: string;
  description?: string;
  expected?: string;
  status?: "DRAFT" | "READY" | "DEPRECATED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  steps?: Array<{
    action: string;
    expected?: string;
  }>;
}

interface TestCaseState {
  testCases: TestCase[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
}

const initialState: TestCaseState = {
  testCases: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
};

export const fetchTestCases = createAsyncThunk<
  TestCase[],
  string,
  { rejectValue: string }
>("testCases/fetchTestCases", async (suiteId, thunkAPI) => {
  try {
    return await getTestCases(suiteId);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de charger les cas de test"
    );
  }
});

export const createTestCase = createAsyncThunk<
  TestCase,
  CreateTestCasePayload,
  { rejectValue: string }
>("testCases/createTestCase", async (payload, thunkAPI) => {
  try {
    return await createTestCaseApi(payload.suiteId, {
      title: payload.title,
      description: payload.description,
      expected: payload.expected,
      status: payload.status,
      priority: payload.priority,
      steps: payload.steps,
    });
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de créer le cas de test"
    );
  }
});

export const updateTestCase = createAsyncThunk<
  TestCase,
  UpdateTestCasePayload,
  { rejectValue: string }
>("testCases/updateTestCase", async (payload, thunkAPI) => {
  try {
    return await updateTestCaseApi(payload.suiteId, payload.testCaseId, {
      title: payload.title,
      description: payload.description,
      expected: payload.expected,
      status: payload.status,
      priority: payload.priority,
      steps: payload.steps,
    });
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de modifier le cas de test"
    );
  }
});

export const deleteTestCase = createAsyncThunk<
  string,
  { suiteId: string; testCaseId: string },
  { rejectValue: string }
>("testCases/deleteTestCase", async (payload, thunkAPI) => {
  try {
    await deleteTestCaseApi(payload.suiteId, payload.testCaseId);
    return payload.testCaseId;
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de supprimer le cas de test"
    );
  }
});

const testCaseSlice = createSlice({
  name: "testCases",
  initialState,
  reducers: {
    clearTestCaseError(state) {
      state.error = null;
    },
    clearTestCases(state) {
      state.testCases = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTestCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestCases.fulfilled, (state, action) => {
        state.loading = false;
        state.testCases = action.payload;
      })
      .addCase(fetchTestCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erreur de chargement";
      })

      .addCase(createTestCase.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTestCase.fulfilled, (state, action) => {
        state.creating = false;
        state.testCases.unshift(action.payload);
      })
      .addCase(createTestCase.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Erreur de création";
      })

      .addCase(updateTestCase.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateTestCase.fulfilled, (state, action) => {
        state.updating = false;
        state.testCases = state.testCases.map((tc) =>
          tc.id === action.payload.id ? action.payload : tc
        );
      })
      .addCase(updateTestCase.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? "Erreur de modification";
      })

      .addCase(deleteTestCase.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteTestCase.fulfilled, (state, action) => {
        state.deleting = false;
        state.testCases = state.testCases.filter((tc) => tc.id !== action.payload);
      })

      

.addCase(duplicateTestCase.pending, (state) => {
  state.creating = true;
  state.error = null;
})
.addCase(duplicateTestCase.fulfilled, (state, action) => {
  state.creating = false;
  state.testCases.unshift(action.payload);
})
.addCase(duplicateTestCase.rejected, (state, action) => {
  state.creating = false;
  state.error = action.payload ?? "Erreur de duplication";
})




      .addCase(deleteTestCase.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? "Erreur de suppression";
      });

      
  },
});

export const duplicateTestCase = createAsyncThunk<
  TestCase,
  { suiteId: string; testCaseId: string },
  { rejectValue: string }
>("testCases/duplicateTestCase", async (payload, thunkAPI) => {
  try {
    return await duplicateTestCaseApi(payload.suiteId, payload.testCaseId);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de dupliquer le cas de test"
    );
  }
});

export const { clearTestCaseError, clearTestCases } = testCaseSlice.actions;
export default testCaseSlice.reducer;