import axiosInstance from "./axiosConfig";

export const tutorApi = {
  // Get all tutors
  getAllTutors: async (params = {}) => {
    const response = await axiosInstance.get("/tutors", { params });
    return response.data;
  },

  // Get tutor by ID
  getTutorById: async (tutorId) => {
    const response = await axiosInstance.get(`/tutors/${tutorId}`);
    return response.data;
  },

  // Get tutor profile (current user)
  getTutorProfile: async () => {
    const response = await axiosInstance.get("/tutors/profile");
    return response.data;
  },

  // Update tutor profile
  updateTutorProfile: async (profileData) => {
    const response = await axiosInstance.put("/tutors/profile", profileData);
    return response.data;
  },

  // Update tutor by ID (headline, bio, monthExperience)
  updateTutorById: async (tutorId, profileData) => {
    const response = await axiosInstance.put(`/tutors/${tutorId}`, profileData);
    return response.data;
  },

  // Get tutor courses
  getTutorCourses: async (tutorId) => {
    const response = await axiosInstance.get(`/tutors/${tutorId}/courses`);
    return response.data;
  },

  // Get tutor students
  getTutorStudents: async () => {
    const response = await axiosInstance.get("/tutors/students");
    return response.data;
  },

  // Get tutor earnings
  getTutorEarnings: async (params = {}) => {
    const response = await axiosInstance.get("/tutors/earnings", { params });
    return response.data;
  },

  // Get tutor schedule
  getTutorSchedule: async (params = {}) => {
    const response = await axiosInstance.get("/tutors/schedule", { params });
    return response.data;
  },

  // Update tutor availability
  updateAvailability: async (availabilityData) => {
    const response = await axiosInstance.put(
      "/tutors/availability",
      availabilityData
    );
    return response.data;
  },

  // Search tutors
  searchTutors: async (query, params = {}) => {
    const response = await axiosInstance.get("/tutors/search", {
      params: { q: query, ...params },
    });
    return response.data;
  },

  // Get featured tutors
  getFeaturedTutors: async (params = {}) => {
    const response = await axiosInstance.get("/tutors/featured", { params });
    return response.data;
  },

  // Rate tutor
  rateTutor: async (tutorId, rating, review) => {
    const response = await axiosInstance.post(`/tutors/${tutorId}/rate`, {
      rating,
      review,
    });
    return response.data;
  },

  // Get tutor reviews
  getTutorReviews: async (tutorId, params = {}) => {
    const response = await axiosInstance.get(`/tutors/${tutorId}/reviews`, {
      params,
    });
    return response.data;
  },

  // Upload CV
  uploadCv: async (file, fileName) => {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("FileName", fileName);
    const response = await axiosInstance.put("/tutors/cv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Get tutor avatar URL
  getTutorAvatar: async () => {
    const response = await axiosInstance.get("/tutors/avatar");
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file, fileName) => {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("FileName", fileName);
    const response = await axiosInstance.put("/tutors/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Upload intro video
  uploadIntroVideo: async (file, fileName) => {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("FileName", fileName);
    const response = await axiosInstance.put("/tutors/intro-video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Submit verification request
  submitVerificationRequest: async () => {
    const response = await axiosInstance.post("/tutor-verification-requests");
    return response.data;
  },

  // Update bank information
  updateBankInfo: async (bankData) => {
    const response = await axiosInstance.patch("/tutors/bank", bankData);
    return response.data;
  },

  // ---- Tutor Documents ----

  getTutorDocuments: async (params = {}) => {
    const response = await axiosInstance.get("/tutor-documents", { params });
    return response.data;
  },

  uploadTutorDocument: async (formData) => {
    const response = await axiosInstance.post("/tutor-documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteTutorDocument: async (documentId) => {
    const response = await axiosInstance.delete(`/tutor-documents/${documentId}`);
    return response.data;
  },

  // ---- Tutor Schedules ----

  // Get tutor schedules (list)
  getTutorSchedules: async (params = {}) => {
    const response = await axiosInstance.get("/tutor-schedules", { params });
    return response.data;
  },

  // Get tutor schedule by ID
  getTutorScheduleById: async (id) => {
    const response = await axiosInstance.get(`/tutor-schedules/${id}`);
    return response.data;
  },

  // Create tutor schedule
  createTutorSchedule: async (data) => {
    const response = await axiosInstance.post("/tutor-schedules", data);
    return response.data;
  },

  // Update tutor schedule
  updateTutorSchedule: async (id, data) => {
    const response = await axiosInstance.patch(`/tutor-schedules/${id}`, data);
    return response.data;
  },

  // Delete tutor schedule
  deleteTutorSchedule: async (id) => {
    const response = await axiosInstance.delete(`/tutor-schedules/${id}`);
    return response.data;
  },

  // Get my courses session time (for schedule slot duration options)
  getMyCoursesSessionTime: async (params = {}) => {
    const response = await axiosInstance.get("/tutors/my-courses/session-time", { params });
    return response.data;
  },

  // Get my course sales / enrollments
  getMyCourseSales: async (params = {}) => {
    const response = await axiosInstance.get("/tutors/my-course-sales", { params });
    return response.data;
  },
};
