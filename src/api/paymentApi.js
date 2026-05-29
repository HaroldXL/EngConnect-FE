import axiosInstance from "./axiosConfig";

export const paymentApi = {
  // ── Tutor Payouts ────────────────────────────────────
  getPayouts: async (params = {}) => {
    const response = await axiosInstance.get("/payments/v1/tutor-payouts", { params });
    return response.data;
  },
  getPayoutById: async (id) => {
    const response = await axiosInstance.get(`/payments/v1/tutor-payouts/${id}`);
    return response.data;
  },
  createManualPayout: async (data) => {
    const response = await axiosInstance.post("/payments/v1/tutor-payouts", data);
    return response.data;
  },

  // ── Tutor Payout Items ───────────────────────────────
  getPayoutItems: async (params = {}) => {
    const response = await axiosInstance.get("/payments/v1/tutor-payout-items", { params });
    return response.data;
  },

  // ── Tutor Earnings ───────────────────────────────────
  getEarnings: async (params = {}) => {
    const response = await axiosInstance.get("/payments/v1/tutor-earnings", { params });
    return response.data;
  },
  getEarningById: async (id) => {
    const response = await axiosInstance.get(`/payments/v1/tutor-earnings/${id}`);
    return response.data;
  },
  getTotalEarning: async (params = {}) => {
    const response = await axiosInstance.get(
      "/payments/v1/tutor-earnings/total-earning/query",
      { params },
    );
    return response.data;
  },
  getMonthlyTotal: async (params = {}) => {
    const response = await axiosInstance.get(
      "/payments/v1/tutor-earnings/monthly-total/query",
      { params },
    );
    return response.data;
  },

  // ── Payroll Periods ──────────────────────────────────
  getPayrollPeriods: async (params = {}) => {
    const response = await axiosInstance.get("/payments/v1/payroll-periods", { params });
    return response.data;
  },

  // ── Student Refunds (No-Tutor) ────────────────────────
  approveStudentRefundNoTutor: async (data) => {
    const response = await axiosInstance.post("/payments/v1/student-refunds/no-tutor", data);
    return response.data;
  },
  approveStudentRefundCourseCancellation: async (data) => {
    const response = await axiosInstance.post("/payments/v1/student-refunds/course-cancellation", data);
    return response.data;
  },
  getStudentRefunds: async (params = {}) => {
    const response = await axiosInstance.get("/payments/v1/student-refunds", { params });
    return response.data;
  },
  getStudentRefundDetails: async (params = {}) => {
    const response = await axiosInstance.get("/payments/v1/student-refunds/details", { params });
    return response.data;
  },
  getStudentRefundDetail: async (id) => {
    const response = await axiosInstance.get(`/payments/v1/student-refunds/${id}/detail`);
    return response.data;
  },

  // ── Commission Configs ────────────────────────────────
  getCommissionConfigs: async (params = {}) => {
    const response = await axiosInstance.get("/commission-configs", { params });
    return response.data;
  },
  updateCommissionConfig: async (id, data) => {
    const response = await axiosInstance.patch(`/commission-configs/${id}`, data);
    return response.data;
  },
};
