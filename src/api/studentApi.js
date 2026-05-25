import axiosInstance from "./axiosConfig";

export const studentApi = {
  // Get all students (with optional query params)
  getAllStudents: async (params = {}) => {
    const response = await axiosInstance.get("/students", { params });
    return response.data;
  },

  // Get student by ID
  getStudentById: async (studentId) => {
    const response = await axiosInstance.get(`/students/${studentId}`);
    return response.data;
  },

  // Get student profile
  getStudentProfile: async () => {
    const response = await axiosInstance.get("/students/profile");
    return response.data;
  },

  // Update student profile by ID
  updateStudentById: async (id, userId, data) => {
    const response = await axiosInstance.put(`/students/${id}`, data, {
      params: { userId },
    });
    return response.data;
  },

  // Get student avatar URL
  getStudentAvatar: async () => {
    const response = await axiosInstance.get("/students/avatar");
    return response.data;
  },

  // Update student avatar
  updateStudentAvatar: async (file) => {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("FileName", file.name);
    const response = await axiosInstance.put("/students/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Get student enrolled courses
  getEnrolledCourses: async () => {
    const response = await axiosInstance.get("/students/courses");
    return response.data;
  },

  // Get student schedule
  getStudentSchedule: async (params = {}) => {
    const response = await axiosInstance.get("/students/schedule", { params });
    return response.data;
  },

  // Get student homework
  getStudentHomework: async (params = {}) => {
    const response = await axiosInstance.get("/students/homework", { params });
    return response.data;
  },

  // Submit homework
  submitHomework: async (homeworkId, submissionData) => {
    const response = await axiosInstance.post(
      `/students/homework/${homeworkId}/submit`,
      submissionData
    );
    return response.data;
  },

  // Get student progress
  getStudentProgress: async (courseId) => {
    const response = await axiosInstance.get(
      `/students/courses/${courseId}/progress`
    );
    return response.data;
  },

  // Get student notifications
  getStudentNotifications: async (params = {}) => {
    const response = await axiosInstance.get("/students/notifications", {
      params,
    });
    return response.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    const response = await axiosInstance.put(
      `/students/notifications/${notificationId}/read`
    );
    return response.data;
  },

  // Get student dashboard stats
  getDashboardStats: async () => {
    const response = await axiosInstance.get("/students/dashboard/stats");
    return response.data;
  },

  // Book session with tutor
  bookSession: async (sessionData) => {
    const response = await axiosInstance.post("/students/sessions", sessionData);
    return response.data;
  },

  // Get student sessions
  getStudentSessions: async (params = {}) => {
    const response = await axiosInstance.get("/students/sessions", { params });
    return response.data;
  },

  // Cancel session
  cancelSession: async (sessionId) => {
    const response = await axiosInstance.delete(
      `/students/sessions/${sessionId}`
    );
    return response.data;
  },

  // Checkout (enroll in course)
  checkout: async (data) => {
    const response = await axiosInstance.post("/checkout", data);
    return response.data;
  },

  // Get student's enrolled courses
  getMyCoursesStudent: async (params = {}) => {
    const response = await axiosInstance.get("/courses/my-course/student", { params });
    return response.data;
  },

  // Get lessons
  getLessons: async (params = {}) => {
    const response = await axiosInstance.get("/lessons", { params });
    return response.data;
  },

  // Get completed/settled lessons (admin lesson reports)
  getCompletedSettledLessons: async (params = {}) => {
    const response = await axiosInstance.get("/lessons/completed-settled", {
      params,
    });
    return response.data;
  },

  // Get lesson by ID
  getLessonById: async (id) => {
    const response = await axiosInstance.get(`/lessons/${id}`);
    return response.data;
  },

  // Update lesson status (admin)
  updateLessonStatus: async (id, status) => {
    const response = await axiosInstance.patch(`/lessons/${id}/status`, { id, status });
    return response.data;
  },

  // Verify PayOS payment return
  verifyPayosReturn: async (params) => {
    const response = await axiosInstance.get("/payments/v1/payos/return", { params });
    return response.data;
  },

  // Get own order history
  getMyOrders: async (params = {}) => {
    const response = await axiosInstance.get("/payments/v1/orders", { params });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    const response = await axiosInstance.get(`/payments/v1/order/${orderId}`);
    return response.data;
  },

  // Update student bank info
  updateBankInfo: async (data) => {
    const response = await axiosInstance.patch("/students/bank", data);
    return response.data;
  },
};
