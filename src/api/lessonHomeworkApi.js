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
    formData.append("IsAssign", body.isAssign ? "true" : "false");
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

  // Tutor edits homework (multipart/form-data to support file uploads)
  // body: { id, title, description, maxScore, type, writingSubType, dueAt,
  //         resourceFile (File), resourceUrl, mediaFile (File), mediaUrl }
  updateHomework: async (id, body) => {
    const formData = new FormData();
    const appendIfDefined = (key, value) => {
      if (value === undefined || value === null || value === "") return;
      formData.append(key, value);
    };
    appendIfDefined("Id", body.id || id);
    appendIfDefined("Title", body.title);
    appendIfDefined("Description", body.description);
    appendIfDefined("SubmissionUrl", body.submissionUrl);
    if (body.maxScore !== undefined && body.maxScore !== null && body.maxScore !== "")
      formData.append("MaxScore", String(body.maxScore));
    appendIfDefined("Type", body.type);
    appendIfDefined("WritingSubType", body.writingSubType);
    appendIfDefined("DueAt", body.dueAt);
    appendIfDefined("ResourceUrl", body.resourceUrl);
    // If clearMedia is true (type switched away from Listening), explicitly send empty string to erase old audio
    if (body.clearMedia) {
      formData.append("MediaUrl", "");
    } else {
      appendIfDefined("MediaUrl", body.mediaUrl);
      if (body.mediaFile instanceof File)
        formData.append("MediaFile", body.mediaFile, body.mediaFile.name);
    }
    if (body.resourceFile instanceof File)
      formData.append("ResourceFile", body.resourceFile, body.resourceFile.name);
    const response = await axiosInstance.put(`/lesson-homeworks/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
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

  // ─── AI features ────────────────────────────────────────────────────────
  // AI detection (Writing only). Reads file at submissionUrl, returns
  // { lessonHomeworkId, aiDetectionScore, message }.
  detectAI: async (id) => {
    const response = await axiosInstance.post(
      `/lesson-homeworks/${id}/ai/detect`,
      null,
      { timeout: 180000 },
    );
    return response.data;
  },

  // AI Writing analysis (Writing only). Reads file at submissionUrl,
  // returns { lessonHomeworkId, analysisData: { assessment, grammar_and_context_errors, vocabulary_upgrades, overall_feedback }, message }.
  analyzeWriting: async (id) => {
    const response = await axiosInstance.post(
      `/lesson-homeworks/${id}/writing/analyze`,
      null,
      { timeout: 180000 },
    );
    return response.data;
  },

  // AI Reading analysis (Reading only). Reads file at resourceUrl,
  // returns { lessonHomeworkId, analysisData: { topic_keywords, vocabularies, summary_vn }, message }.
  analyzeReading: async (id) => {
    const response = await axiosInstance.post(
      `/lesson-homeworks/${id}/reading/analyze`,
      null,
      { timeout: 180000 },
    );
    return response.data;
  },
};
