import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { campaignApi } from "../campaign-api";

export type Campaign = {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type CampaignState = {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
};

const initialState: CampaignState = {
  campaigns: [],
  selectedCampaign: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
};

export const fetchCampaigns = createAsyncThunk(
  "campaigns/fetchCampaigns",
  async (projectId: string) => {
    const res = await campaignApi.getByProject(projectId);
    return res.data as Campaign[];
  }
);

export const createCampaign = createAsyncThunk(
  "campaigns/createCampaign",
  async ({
    projectId,
    name,
    description,
  }: {
    projectId: string;
    name: string;
    description?: string;
  }) => {
    const res = await campaignApi.create(projectId, { name, description });
    return res.data as Campaign;
  }
);

export const updateCampaign = createAsyncThunk(
  "campaigns/updateCampaign",
  async ({
    campaignId,
    name,
    description,
  }: {
    campaignId: string;
    name?: string;
    description?: string;
  }) => {
    const res = await campaignApi.update(campaignId, { name, description });
    return res.data as Campaign;
  }
);

export const deleteCampaign = createAsyncThunk(
  "campaigns/deleteCampaign",
  async (campaignId: string) => {
    await campaignApi.delete(campaignId);
    return campaignId;
  }
);

const campaignSlice = createSlice({
  name: "campaigns",
  initialState,
  reducers: {
    setSelectedCampaign(state, action) {
      state.selectedCampaign = action.payload;
    },
    clearCampaigns(state) {
      state.campaigns = [];
      state.selectedCampaign = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns = action.payload;
      })
      .addCase(fetchCampaigns.rejected, (state) => {
        state.loading = false;
        state.error = "Impossible de charger les campagnes.";
      })

      .addCase(createCampaign.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.creating = false;
        state.campaigns.unshift(action.payload);
        state.selectedCampaign = action.payload;
      })
      .addCase(createCampaign.rejected, (state) => {
        state.creating = false;
        state.error = "Impossible de créer la campagne.";
      })

      .addCase(updateCampaign.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.updating = false;
        state.campaigns = state.campaigns.map((campaign) =>
          campaign.id === action.payload.id ? action.payload : campaign
        );
        state.selectedCampaign = action.payload;
      })
      .addCase(updateCampaign.rejected, (state) => {
        state.updating = false;
        state.error = "Impossible de modifier la campagne.";
      })

      .addCase(deleteCampaign.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.deleting = false;
        state.campaigns = state.campaigns.filter(
          (campaign) => campaign.id !== action.payload
        );
        if (state.selectedCampaign?.id === action.payload) {
          state.selectedCampaign = null;
        }
      })
      .addCase(deleteCampaign.rejected, (state) => {
        state.deleting = false;
        state.error = "Impossible de supprimer la campagne.";
      });
  },
});

export const { setSelectedCampaign, clearCampaigns } = campaignSlice.actions;
export default campaignSlice.reducer;