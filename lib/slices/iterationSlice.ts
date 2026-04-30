import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { iterationApi } from "../iteration-api";

interface Iteration {
  id: string;
  name: string;
  campaignId: string;
  createdAt: string;
}

interface IterationState {
  iterations: Iteration[];
  selectedIteration: Iteration | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: IterationState = {
  iterations: [],
  selectedIteration: null,
  loading: false,
  creating: false,
  error: null,
};

export const fetchIterations = createAsyncThunk(
  "iterations/fetch",
  async (campaignId: string) => {
    const res = await iterationApi.getByCampaign(campaignId);
    return res.data;
  }
);

export const createIteration = createAsyncThunk(
  "iterations/create",
  async ({ campaignId, name }: { campaignId: string; name: string }) => {
    const res = await iterationApi.create(campaignId, { name });
    return res.data;
  }
);

const iterationSlice = createSlice({
  name: "iterations",
  initialState,
  reducers: {
    setSelectedIteration(state, action) {
      state.selectedIteration = action.payload;
    },
    clearIterations(state) {
      state.iterations = [];
      state.selectedIteration = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIterations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIterations.fulfilled, (state, action) => {
        state.loading = false;
        state.iterations = action.payload;
      })
      .addCase(fetchIterations.rejected, (state) => {
        state.loading = false;
        state.error = "Erreur chargement iterations";
      })

      .addCase(createIteration.pending, (state) => {
        state.creating = true;
      })
      .addCase(createIteration.fulfilled, (state, action) => {
        state.creating = false;
        state.iterations.unshift(action.payload);
      })
      .addCase(createIteration.rejected, (state) => {
        state.creating = false;
        state.error = "Erreur création iteration";
      });
  },
});

export const { setSelectedIteration, clearIterations } =
  iterationSlice.actions;

export default iterationSlice.reducer;