import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  createTestSuite as createTestSuiteApi,
  deleteTestSuite as deleteTestSuiteApi,
  duplicateTestSuite as duplicateTestSuiteApi,
  getTestSuites,
  TestSuite,
  updateTestSuite as updateTestSuiteApi,
} from "@/lib/testsuite-api";

export interface CreateTestSuitePayload {
  projectId: string;
  name: string;
  description?: string;
}

export interface UpdateTestSuitePayload {
  suiteId: string;
  name?: string;
  description?: string;
}

interface TestSuiteState {
  testSuites: TestSuite[];
  selectedSuite: TestSuite | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
}

const initialState: TestSuiteState = {
  testSuites: [],
  selectedSuite: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
};

export const fetchTestSuites = createAsyncThunk<
  TestSuite[],
  string,
  { rejectValue: string }
>("testSuites/fetchTestSuites", async (projectId, thunkAPI) => {
  try {
    return await getTestSuites(projectId);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de charger les suites"
    );
  }
});

export const createTestSuite = createAsyncThunk<
  TestSuite,
  CreateTestSuitePayload,
  { rejectValue: string }
>("testSuites/createTestSuite", async (payload, thunkAPI) => {
  try {
    return await createTestSuiteApi(payload.projectId, {
      name: payload.name,
      description: payload.description,
    });
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de créer la suite"
    );
  }
});

export const updateTestSuite = createAsyncThunk<
  TestSuite,
  UpdateTestSuitePayload,
  { rejectValue: string }
>("testSuites/updateTestSuite", async (payload, thunkAPI) => {
  try {
    return await updateTestSuiteApi(payload.suiteId, {
      name: payload.name,
      description: payload.description,
    });
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de modifier la suite"
    );
  }
});
export const duplicateTestSuite = createAsyncThunk<
  TestSuite,
  string,
  { rejectValue: string }
>("testSuites/duplicateTestSuite", async (suiteId, thunkAPI) => {
  try {
    return await duplicateTestSuiteApi(suiteId);
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de dupliquer la suite"
    );
  }
});

export const deleteTestSuite = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("testSuites/deleteTestSuite", async (suiteId, thunkAPI) => {
  try {
    await deleteTestSuiteApi(suiteId);
    return suiteId;
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof Error ? error.message : "Impossible de supprimer la suite"
    );
  }
});

const testSuiteSlice = createSlice({
  name: "testSuites",
  initialState,
  reducers: {
    setSelectedSuite(state, action: PayloadAction<TestSuite | null>) {
      state.selectedSuite = action.payload;
    },
    clearTestSuiteError(state) {
      state.error = null;
    },
    clearTestSuites(state) {
      state.testSuites = [];
      state.selectedSuite = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTestSuites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestSuites.fulfilled, (state, action) => {
        state.loading = false;
        state.testSuites = action.payload;

        if (state.selectedSuite) {
          const stillExists = action.payload.find(
            (suite) => suite.id === state.selectedSuite?.id
          );
          state.selectedSuite = stillExists ?? null;
        }
      })
      .addCase(fetchTestSuites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erreur de chargement";
      })

      .addCase(createTestSuite.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTestSuite.fulfilled, (state, action) => {
        state.creating = false;
        state.testSuites.unshift(action.payload);
      })
      .addCase(createTestSuite.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Erreur de création";
      })

      .addCase(updateTestSuite.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateTestSuite.fulfilled, (state, action) => {
        state.updating = false;
        state.testSuites = state.testSuites.map((suite) =>
          suite.id === action.payload.id ? action.payload : suite
        );

        if (state.selectedSuite?.id === action.payload.id) {
          state.selectedSuite = action.payload;
        }
      })
      .addCase(updateTestSuite.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? "Erreur de modification";
      })


.addCase(duplicateTestSuite.pending, (state) => {
  state.creating = true;
  state.error = null;
})
.addCase(duplicateTestSuite.fulfilled, (state, action) => {
  state.creating = false;
  state.testSuites.unshift(action.payload);
})
.addCase(duplicateTestSuite.rejected, (state, action) => {
  state.creating = false;
  state.error = action.payload ?? "Erreur de duplication";
})


      .addCase(deleteTestSuite.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteTestSuite.fulfilled, (state, action) => {
        state.deleting = false;
        state.testSuites = state.testSuites.filter(
          (suite) => suite.id !== action.payload
        );

        if (state.selectedSuite?.id === action.payload) {
          state.selectedSuite = null;
        }
      })
      .addCase(deleteTestSuite.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? "Erreur de suppression";
      });
  },
});

export const { setSelectedSuite, clearTestSuiteError, clearTestSuites } =
  testSuiteSlice.actions;

export default testSuiteSlice.reducer;