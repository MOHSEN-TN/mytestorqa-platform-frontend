import api from "./axios";

export const campaignApi = {
  getByProject: (projectId: string) =>
    api.get(`/projects/${projectId}/campaigns`),

  create: (projectId: string, data: { name: string; description?: string }) =>
    api.post(`/projects/${projectId}/campaigns`, data),

  update: (campaignId: string, data: { name?: string; description?: string }) =>
    api.patch(`/campaigns/${campaignId}`, data),

  delete: (campaignId: string) => api.delete(`/campaigns/${campaignId}`),
};