import axiosInstance from "./axiosConfig";

export const lessonRatingApi = {
  // params: { LessonId, TutorId, StudentId, page, "page-size", "sort-params" }
  getRatings: async (params = {}) => {
    const response = await axiosInstance.get("/lesson-ratings", { params });
    return response.data;
  },

  getRatingById: async (id) => {
    const response = await axiosInstance.get(`/lesson-ratings/${id}`);
    return response.data;
  },

  // body: { lessonId, tutorId, studentId, rating, comment, isAnonymous }
  createRating: async (body) => {
    const response = await axiosInstance.post("/lesson-ratings", {
      lessonId: body.lessonId,
      tutorId: body.tutorId,
      studentId: body.studentId,
      rating: body.rating,
      comment: body.comment ?? "",
      isAnonymous: false,
    });
    return response.data;
  },

  // body: { rating, comment }
  updateRating: async (id, body) => {
    const response = await axiosInstance.put(`/lesson-ratings/${id}`, {
      id,
      rating: body.rating,
      comment: body.comment ?? "",
    });
    return response.data;
  },

  deleteRating: async (id) => {
    const response = await axiosInstance.delete(`/lesson-ratings/${id}`);
    return response.data;
  },
};
