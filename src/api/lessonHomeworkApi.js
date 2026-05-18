import axiosInstance from "./axiosConfig";

export const lessonHomeworkApi = {
  // List homework with pagination/filter
  // params: { LessonId, Status, TutorId, StudentId, page, "page-size", "search-term", "sort-params" }
  getHomeworks: async (params = {}) => {
    const response = await axiosInstance.get("/lesson-homeworks", { params });
    return response.data;
  },

  getHomeworkById: async (id) => {
    const response = await axiosInstance.get(`/lesson-homeworks/${id}`);
    return response.data;
  },

  // Tutor creates homework (status = NotStarted after this)
  // body: {
  //   lessonId, title, type, writingSubType,
  //   resourceFile (File), mediaFile (File),
  //   resourceUrl, mediaUrl,
  //   description, maxScore, dueAt,
  // }
  createHomework: async (body) => {
    const formData = new FormData();
    const appendIfDefined = (key, value) => {
      if (value === undefined || value === null || value === "") return;
      formData.append(key, value);
    };
    appendIfDefined("LessonId", body.lessonId);
    appendIfDefined("Title", body.title);
    appendIfDefined("Type", body.type);
    appendIfDefined("WritingSubType", body.writingSubType);
    appendIfDefined("ResourceUrl", body.resourceUrl);
    appendIfDefined("MediaUrl", body.mediaUrl);
    appendIfDefined("Description", body.description);
    if (body.maxScore !== undefined && body.maxScore !== null && body.maxScore !== "")
      formData.append("MaxScore", String(body.maxScore));
    appendIfDefined("DueAt", body.dueAt);
    if (body.resourceFile instanceof File)
      formData.append("ResourceFile", body.resourceFile, body.resourceFile.name);
    if (body.mediaFile instanceof File)
      formData.append("MediaFile", body.mediaFile, body.mediaFile.name);

    const response = await axiosInstance.post("/lesson-homeworks", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return response.data;
  },

  // Tutor edits homework
  // body: { id, title, description, submissionUrl, score, maxScore }
  updateHomework: async (id, body) => {
    const response = await axiosInstance.put(`/lesson-homeworks/${id}`, body);
    return response.data;
  },

  deleteHomework: async (id) => {
    const response = await axiosInstance.delete(`/lesson-homeworks/${id}`);
    return response.data;
  },

  // Tutor assigns homework to student (status: NotStarted -> Assigned)
  assignHomework: async (id) => {
    const response = await axiosInstance.patch(
      `/lesson-homeworks/${id}/assign`,
    );
    return response.data;
  },

  // Student submits a file (status: Assigned -> Submitted)
  // multipart/form-data with field "File"
  submitHomework: async (id, file) => {
    const formData = new FormData();
    formData.append("File", file, file.name);
    const response = await axiosInstance.post(
      `/lesson-homeworks/${id}/submit`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      },
    );
    return response.data;
  },

  // Tutor grades (status: Submitted -> Scored)
  // body: { id, score, tutorFeedback }
  gradeHomework: async (id, score, tutorFeedback) => {
    const response = await axiosInstance.post(
      `/lesson-homeworks/${id}/grade`,
      { id, score, tutorFeedback },
    );
    return response.data;
  },
};
