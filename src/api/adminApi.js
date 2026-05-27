import axiosInstance from "./axiosConfig";

export const adminApi = {
  // Dashboard stats
  getDashboardStats: async () => {
    const response = await axiosInstance.get("/admin/dashboard/stats");
    return response.data;
  },

  // User management
  getAllUsers: async (params = {}) => {
    const response = await axiosInstance.get("/admin/users", { params });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await axiosInstance.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await axiosInstance.put(
      `/admin/users/${userId}`,
      userData
    );
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
  },

  suspendUser: async (userId, reason) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/suspend`, {
      reason,
    });
    return response.data;
  },

  unsuspendUser: async (userId) => {
    const response = await axiosInstance.post(
      `/admin/users/${userId}/unsuspend`
    );
    return response.data;
  },

  // Course management
  getAllCoursesAdmin: async (params = {}) => {
    const response = await axiosInstance.get("/admin/courses", { params });
    return response.data;
  },

  approveCourse: async (courseId) => {
    const response = await axiosInstance.post(
      `/admin/courses/${courseId}/approve`
    );
    return response.data;
  },

  rejectCourse: async (courseId, reason) => {
    const response = await axiosInstance.post(
      `/admin/courses/${courseId}/reject`,
      { reason }
    );
    return response.data;
  },

  deleteCourseAdmin: async (courseId) => {
    const response = await axiosInstance.delete(`/admin/courses/${courseId}`);
    return response.data;
  },

  // Tutor management
  getAllTutorApplications: async (params = {}) => {
    const response = await axiosInstance.get("/admin/tutors/applications", {
      params,
    });
    return response.data;
  },

  approveTutorApplication: async (applicationId) => {
    const response = await axiosInstance.post(
      `/admin/tutors/applications/${applicationId}/approve`
    );
    return response.data;
  },

  rejectTutorApplication: async (applicationId, reason) => {
    const response = await axiosInstance.post(
      `/admin/tutors/applications/${applicationId}/reject`,
      { reason }
    );
    return response.data;
  },

  // Financial management — Payment Orders
  getPaymentOrders: async (params = {}) => {
    const response = await axiosInstance.get("/payments/v1/orders", { params });
    return response.data;
  },

  getPaymentOrderById: async (orderId) => {
    const response = await axiosInstance.get(`/payments/v1/order/${orderId}`);
    return response.data;
  },

  // Financial management — Payment Transactions
  getPaymentTransactions: async (params = {}) => {
    const response = await axiosInstance.get("/payments/v1", { params });
    return response.data;
  },

  getPaymentTransactionById: async (id) => {
    const response = await axiosInstance.get(`/payments/v1/${id}`);
    return response.data;
  },

  // Analytics
  getAnalyticsReports: async (params = {}) => {
    const response = await axiosInstance.get("/admin/analytics/reports", {
      params,
    });
    return response.data;
  },

  getUserAnalytics: async (params = {}) => {
    const response = await axiosInstance.get("/admin/analytics/users", {
      params,
    });
    return response.data;
  },

  getCourseAnalytics: async (params = {}) => {
    const response = await axiosInstance.get("/admin/analytics/courses", {
      params,
    });
    return response.data;
  },

  getRevenueAnalytics: async (params = {}) => {
    const response = await axiosInstance.get("/admin/analytics/revenue", {
      params,
    });
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await axiosInstance.get("/admin/settings");
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await axiosInstance.put("/admin/settings", settings);
    return response.data;
  },

  // Tutor management (/api/tutors)
  getAllTutors: async (params = {}) => {
    const response = await axiosInstance.get("/tutors", { params });
    return response.data;
  },

  getTutorById: async (tutorId) => {
    const response = await axiosInstance.get(`/tutors/${tutorId}`);
    return response.data;
  },

  // Lesson report (admin only — for Completed/Settled lessons)
  getLessonReport: async (lessonId) => {
    const response = await axiosInstance.get(`/lessons/${lessonId}/report`);
    return response.data;
  },

  createTutor: async (formData) => {
    const response = await axiosInstance.post("/tutors", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateTutor: async (tutorId, data) => {
    const response = await axiosInstance.put(`/tutors/${tutorId}`, data);
    return response.data;
  },

  deleteTutor: async (tutorId) => {
    const response = await axiosInstance.delete(`/tutors/${tutorId}`);
    return response.data;
  },

  // Tutor verification requests (/api/tutor-verification-requests)
  getVerificationRequests: async (params = {}) => {
    const response = await axiosInstance.get("/tutor-verification-requests", {
      params,
    });
    return response.data;
  },

  getVerificationRequestById: async (requestId) => {
    const response = await axiosInstance.get(
      `/tutor-verification-requests/${requestId}`
    );
    return response.data;
  },

  reviewVerificationRequest: async (requestId, { approved, rejectionReason }) => {
    const token = localStorage.getItem("accessToken");
    let adminUserId = "";
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        adminUserId = payload.sub;
      } catch {
        console.error("Failed to decode JWT");
      }
    }
    const response = await axiosInstance.post(
      `/tutor-verification-requests/review/${requestId}`,
      { requestId, adminUserId, approved, rejectionReason }
    );
    return response.data;
  },

  deleteVerificationRequest: async (requestId) => {
    const response = await axiosInstance.delete(
      `/tutor-verification-requests/${requestId}`
    );
    return response.data;
  },

  // Student management (/api/students)
  getAllStudents: async (params = {}) => {
    const response = await axiosInstance.get("/students", { params });
    return response.data;
  },

  getStudentById: async (studentId) => {
    const response = await axiosInstance.get(`/students/${studentId}`);
    return response.data;
  },

  updateStudent: async (studentId, userId, data) => {
    const response = await axiosInstance.put(`/students/${studentId}`, data, {
      params: { userId },
    });
    return response.data;
  },

  updateStudentStatus: async (studentId, status) => {
    const response = await axiosInstance.put(`/students/${studentId}/status`, {
      status,
    });
    return response.data;
  },

  getDashboardSummary: async (params = {}) => {
    const response = await axiosInstance.get("/admin-dashboard/summary", { params });
    return response.data;
  },

  getDashboardFeeds: async (params = {}) => {
    const response = await axiosInstance.get("/admin-dashboard/feeds", { params });
    return response.data;
  },

  getTutorMonthlySalary: async (params = {}) => {
    const response = await axiosInstance.get("/admin-dashboard/tutor-monthly-salary", { params });
    return response.data;
  },

  // Prompt Definitions
  getPromptDefinitions: async (params = {}) => {
    const response = await axiosInstance.get("/prompt-definitions", { params });
    return response.data;
  },

  getPromptDefinitionById: async (id) => {
    const response = await axiosInstance.get(`/prompt-definitions/${id}`);
    return response.data;
  },

  // Prompt Versions
  getPromptVersions: async (params = {}) => {
    const response = await axiosInstance.get("/prompt-versions", { params });
    return response.data;
  },

  getPromptVersionById: async (id) => {
    const response = await axiosInstance.get(`/prompt-versions/${id}`);
    return response.data;
  },
};
