import axiosInstance from "./axiosConfig";

export const makeupApi = {
  createRequest: async (data) => {
    const response = await axiosInstance.post("/makeup-lesson-requests", data);
    return response.data;
  },
  getRequests: async (params = {}) => {
    const response = await axiosInstance.get("/makeup-lesson-requests", { params });
    return response.data;
  },
  acceptRequest: async (id, data) => {
    const response = await axiosInstance.patch(`/makeup-lesson-requests/${id}/accept`, data);
    return response.data;
  },
  rejectRequest: async (id, data) => {
    const response = await axiosInstance.patch(`/makeup-lesson-requests/${id}/reject`, data);
    return response.data;
  },
};
