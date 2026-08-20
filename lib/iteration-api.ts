import api from "./axios";

export const iterationApi = {
  getByCampaign: (campaignId: string) =>
    api.get(`/campaigns/${campaignId}/iterations`),

  create: (campaignId: string, data: { name: string }) =>
    api.post(`/campaigns/${campaignId}/iterations`, data),

  update: (iterationId: string, data: { name?: string }) =>
    api.patch(`/iterations/${iterationId}`, data),

  delete: (iterationId: string) =>
    api.delete(`/iterations/${iterationId}`),


addSuites: (iterationId: string, suiteIds: string[]) =>
  api.post(`/iterations/${iterationId}/suites`, { suiteIds }),

};


