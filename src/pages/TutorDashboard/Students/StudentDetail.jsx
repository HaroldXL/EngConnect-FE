import { useState, useEffect, useCallback } from "react";
import {
  AddCircle,
  AltArrowDown,
  AltArrowLeft,
  AltArrowUp,
  ArrowRightUp,
  BookBookmark,
  CalendarMark,
  CheckCircle,
  CircleBottomUp,
  ClipboardList,
  ClockCircle,
  CloseCircle,
  DocumentText,
  GraphUp,
  Letter,
  Lightning,
  PenNewRound,
  Play,
  PlayCircle,
  Record,
  SquareAltArrowRight,
  Star,
  Videocamera,
} from "@solar-icons/react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  Avatar,
  Chip,
  Progress,
  Skeleton,
  Button,
  Spinner,
  Tooltip,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useThemeColors } from "../../../hooks/useThemeColors";
import CourseCard from "../../../components/CourseCard/CourseCard";

import { selectUser } from "../../../store";
import { studentApi, coursesApi, lessonHomeworkApi } from "../../../api";
import LessonDetailModal from "../../../components/LessonDetailModal/LessonDetailModal";
import VideoModal from "../../../components/VideoModal/VideoModal";
import LessonSummaryModal from "../../../components/LessonSummaryModal/LessonSummaryModal";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const buildModulesFromLessons = (lessons, moduleInfoMap) => {
  if (!lessons?.length) return [];
  const moduleOrder = [];
  const moduleSessionsMap = {};
  lessons.forEach((lesson) => {
    const { moduleId, sessionId } = lesson;
    if (!moduleId || !sessionId) return;
    if (!moduleSessionsMap[moduleId]) {
      moduleOrder.push(moduleId);
      moduleSessionsMap[moduleId] = { sessionOrder: [], sessionLessonsMap: {} };
    }
    const mod = moduleSessionsMap[moduleId];
    if (!mod.sessionLessonsMap[sessionId]) {
      mod.sessionOrder.push(sessionId);
      mod.sessionLessonsMap[sessionId] = [];
    }
    mod.sessionLessonsMap[sessionId].push(lesson);
  });
  return moduleOrder.map((moduleId) => {
    const info = moduleInfoMap?.[moduleId] || null;
    const modData = moduleSessionsMap[moduleId];
    return {
      moduleId,
      title: info?.title || "",
      sessions: modData.sessionOrder.map((sessionId, sessIdx) => {
        const lessonList = modData.sessionLessonsMap[sessionId];
        const sessionInfo =
          info?.courseSessions?.find((s) => s.courseSessionId === sessionId) ||
          null;
        return {
          sessionId,
          sessionTitle:
            sessionInfo?.sessionTitle || lessonList[0]?.sessionTitle || "",
          sessionNumber: sessionInfo?.sessionNumber ?? sessIdx + 1,
          lessons: lessonList,
        };
      }),
    };
  });
};

const getPrimaryLesson = (lessons) => {
  if (!lessons?.length) return null;
  const completed = lessons.filter((l) => l.status === "Completed");
  if (completed.length > 0) return completed[completed.length - 1];
  const live = lessons.find(
    (l) =>
      l.meetingStatus === "Waiting" ||
      l.meetingStatus === "InProgress" ||
      l.status === "InProgress",
  );
  if (live) return live;
  const upcoming = [...lessons]
    .filter(
      (l) => l.status !== "Cancelled" && new Date(l.startTime) >= new Date(),
    )
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  if (upcoming.length > 0) return upcoming[0];
  return lessons[lessons.length - 1];
};

const canJoinLesson = (lesson) =>
  lesson.meetingStatus === "InProgress" ||
  (lesson.status !== "Completed" &&
    lesson.status !== "NoStudent" &&
    lesson.status !== "NoTutor" &&
    lesson.status !== "Settled" &&
    lesson.status !== "Cancelled" &&
    lesson.meetingStatus !== "Ended");

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const colors = useThemeColors();
  const user = useSelector(selectUser);

  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  // Per-course lazy learning path
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [courseLessonsMap, setCourseLessonsMap] = useState({});
  const [courseModuleInfoMap, setCourseModuleInfoMap] = useState({});
  const [loadingCourseMap, setLoadingCourseMap] = useState({});

  // Modals
  const [selectedLesson, setSelectedLesson] = useState(null);
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const {
    isOpen: isVideoOpen,
    onOpen: onVideoOpen,
    onOpenChange: onVideoOpenChange,
  } = useDisclosure();
  const [recordingUrl, setRecordingUrl] = useState(null);
  const {
    isOpen: isSummaryOpen,
    onOpen: onSummaryOpen,
    onClose: onSummaryClose,
  } = useDisclosure();
  const [summaryText, setSummaryText] = useState("");

  // Homework modal
  const {
    isOpen: isHwOpen,
    onOpen: onHwOpen,
    onClose: onHwClose,
  } = useDisclosure();
  const [hwLesson, setHwLesson] = useState(null);
  const [hwItems, setHwItems] = useState([]);
  const [hwLoading, setHwLoading] = useState(false);
  const [showCreateHw, setShowCreateHw] = useState(false);
  const [newHw, setNewHw] = useState({
    courseResourceId: "",
    description: "",
    maxScore: "100",
    dueAt: "",
  });
  const [hwSubmitting, setHwSubmitting] = useState(false);
  const [gradingId, setGradingId] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: "", tutorFeedback: "" });
  const [sessionResources, setSessionResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoadingStudent(true);
        const res = await studentApi.getStudentById(studentId);
        setStudent(res.data);
      } catch (err) {
        console.error("Failed to fetch student:", err);
      } finally {
        setLoadingStudent(false);
      }
    };

    const fetchEnrollments = async () => {
      try {
        setLoadingEnrollments(true);
        const [inProgressRes, completedRes] = await Promise.all([
          coursesApi.getAllCourseEnrollments({
            StudentId: studentId,
            Status: "InProgress",
            "page-size": 50,
          }),
          coursesApi.getAllCourseEnrollments({
            StudentId: studentId,
            Status: "Completed",
            "page-size": 50,
          }),
        ]);
        setEnrollments([
          ...(inProgressRes?.data?.items || []),
          ...(completedRes?.data?.items || []),
        ]);
      } catch (err) {
        console.error("Failed to fetch enrollments:", err);
      } finally {
        setLoadingEnrollments(false);
      }
    };

    if (studentId) {
      fetchStudent();
      fetchEnrollments();
    }
  }, [studentId]);

  const toggleCourse = useCallback(
    async (courseId) => {
      if (expandedCourse === courseId) {
        setExpandedCourse(null);
        return;
      }
      setExpandedCourse(courseId);
      if (courseLessonsMap[courseId] !== undefined) return;

      setLoadingCourseMap((prev) => ({ ...prev, [courseId]: true }));
      try {
        const res = await studentApi.getLessons({
          StudentId: studentId,
          CourseId: courseId,
          "page-size": 200,
          "sort-params": "StartTime-asc",
        });
        const lessons = res?.data?.items || [];
        setCourseLessonsMap((prev) => ({ ...prev, [courseId]: lessons }));

        const uniqueModuleIds = [
          ...new Set(lessons.map((l) => l.moduleId).filter(Boolean)),
        ];
        if (uniqueModuleIds.length) {
          const moduleResults = await Promise.all(
            uniqueModuleIds.map((mid) => coursesApi.getCourseModuleById(mid)),
          );
          const modMap = {};
          moduleResults.forEach((r) => {
            const mod = r?.data;
            if (mod?.id) modMap[mod.id] = mod;
          });
          setCourseModuleInfoMap((prev) => ({ ...prev, [courseId]: modMap }));
        }
      } catch (err) {
        console.error("Failed to fetch course lessons:", err);
        setCourseLessonsMap((prev) => ({ ...prev, [courseId]: [] }));
      } finally {
        setLoadingCourseMap((prev) => ({ ...prev, [courseId]: false }));
      }
    },
    [expandedCourse, courseLessonsMap, studentId],
  );

  useEffect(() => {
    const expandCourseId = location.state?.expandCourseId;
    if (!expandCourseId || loadingEnrollments) return;
    toggleCourse(expandCourseId);
    setTimeout(() => {
      document.getElementById(`course-${expandCourseId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingEnrollments]);

  const getLessonStatusColor = (status) => {
    switch (status) {
      case "Scheduled":
        return colors.primary.main;
      case "Completed":
      case "Settled":
        return colors.state.success;
      case "Cancelled":
      case "NoStudent":
      case "NoTutor":
      case "Refund":
        return colors.state.error;
      case "InProgress":
      case "Reschedule":
        return colors.state.warning;
      default:
        return colors.text.secondary;
    }
  };

  const getLessonStatusLabel = (status) => {
    switch (status) {
      case "Scheduled":
        return t("tutorDashboard.schedule.lessonStatus.scheduled");
      case "Completed":
      case "Settled":
        return t("tutorDashboard.schedule.lessonStatus.completed");
      case "Cancelled":
        return t("tutorDashboard.schedule.lessonStatus.cancelled");
      case "Refund":
        return t("tutorDashboard.schedule.lessonStatus.refund");
      case "InProgress":
        return t("tutorDashboard.schedule.lessonStatus.inProgress");
      case "NoStudent":
        return t("tutorDashboard.schedule.lessonStatus.noStudent");
      case "NoTutor":
        return t("tutorDashboard.schedule.lessonStatus.noTutor");
      case "Reschedule":
        return t("tutorDashboard.schedule.lessonStatus.reschedule");
      default:
        return status || "";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "InProgress":
        return { bg: `${colors.state.warning}20`, text: colors.state.warning };
      case "Completed":
        return { bg: `${colors.state.success}20`, text: colors.state.success };
      default:
        return { bg: `${colors.text.tertiary}20`, text: colors.text.tertiary };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDetail = (lesson) => {
    setSelectedLesson(lesson);
    onDetailOpen();
  };

  const openRecording = (lesson) => {
    setRecordingUrl(lesson.lessonRecord?.recordUrl);
    onVideoOpen();
  };

  const openSummary = (lesson) => {
    setSummaryText(lesson.lessonScript?.summarizeText || "");
    setSelectedLesson(lesson);
    onSummaryOpen();
  };

  const fetchHwItems = async (lessonId) => {
    setHwLoading(true);
    try {
      const res = await lessonHomeworkApi.getHomeworks({
        LessonId: lessonId,
        "page-size": 50,
      });
      setHwItems(res?.data?.items || []);
    } catch {
      setHwItems([]);
    } finally {
      setHwLoading(false);
    }
  };

  const openHomework = async (lesson) => {
    setHwLesson(lesson);
    setShowCreateHw(false);
    setGradingId(null);
    setGradeForm({ score: "", tutorFeedback: "" });
    setNewHw({
      courseResourceId: "",
      description: "",
      maxScore: "100",
      dueAt: "",
    });
    setSessionResources([]);
    onHwOpen();
    fetchHwItems(lesson.id);
    // Load resources for the session
    if (lesson.sessionId) {
      setResourcesLoading(true);
      try {
        const res = await coursesApi.getAllCourseResources({
          CourseSessionId: lesson.sessionId,
          "page-size": 100,
        });
        setSessionResources(res?.data?.items || []);
      } catch {
        setSessionResources([]);
      } finally {
        setResourcesLoading(false);
      }
    }
  };

  const handleCreateHw = async () => {
    if (!newHw.description.trim()) return;
    setHwSubmitting(true);
    try {
      await lessonHomeworkApi.createHomework({
        lessonId: hwLesson.id,
        courseResourceId: newHw.courseResourceId || undefined,
        description: newHw.description,
        maxScore: Number(newHw.maxScore) || 100,
        dueAt: newHw.dueAt ? new Date(newHw.dueAt).toISOString() : null,
      });
      setShowCreateHw(false);
      setNewHw({
        courseResourceId: "",
        description: "",
        maxScore: "100",
        dueAt: "",
      });
      fetchHwItems(hwLesson.id);
    } catch {
      // ignore
    } finally {
      setHwSubmitting(false);
    }
  };

  const handleAssign = async (hw) => {
    try {
      await lessonHomeworkApi.assignHomework(hw.id);
      fetchHwItems(hwLesson.id);
    } catch {
      // ignore
    }
  };

  const handleGrade = async (hw) => {
    setHwSubmitting(true);
    try {
      await lessonHomeworkApi.gradeHomework(
        hw.id,
        Number(gradeForm.score),
        gradeForm.tutorFeedback,
      );
      setGradingId(null);
      fetchHwItems(hwLesson.id);
    } catch {
      // ignore
    } finally {
      setHwSubmitting(false);
    }
  };

  const hwStatusProps = (status) => {
    switch (status) {
      case "Assigned":
        return { color: colors.state.warning, label: "Assigned" };
      case "Submitted":
        return { color: colors.primary.main, label: "Submitted" };
      case "Scored":
        return { color: colors.state.success, label: "Scored" };
      default:
        return { color: colors.text.tertiary, label: "Draft" };
    }
  };

  const myEnrollments = enrollments.filter(
    (e) => e.course?.tutorId === user?.tutorId,
  );
  const otherEnrollments = enrollments.filter(
    (e) => e.course?.tutorId !== user?.tutorId,
  );

  const inProgressCount = enrollments.filter(
    (e) => e.status === "InProgress",
  ).length;
  const completedCount = enrollments.filter(
    (e) => e.status === "Completed",
  ).length;

  return (
    <div className="space-y-6">
      <Button
        variant="light"
        startContent={<AltArrowLeft weight="BoldDuotone" size={18} />}
        onPress={() => navigate(-1)}
        style={{ color: colors.text.secondary }}
      >
        {t("common.back")}
      </Button>

      {/* Student info card */}
      {loadingStudent ? (
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-7 w-56 rounded-lg" />
                <Skeleton className="h-4 w-48 rounded-lg" />
                <div className="flex gap-4 mt-2">
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <Skeleton className="h-4 w-28 rounded-lg" />
                  <Skeleton className="h-4 w-28 rounded-lg" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : student ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar
                  src={withCDN(student.avatar || student.user?.avatarUrl)}
                  name={`${student.user?.firstName || ""} ${student.user?.lastName || ""}`}
                  className="w-24 h-24 text-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h1
                    className="text-2xl font-bold mb-1"
                    style={{ color: colors.text.primary }}
                  >
                    {student.user?.firstName} {student.user?.lastName}
                  </h1>
                  {student.user?.email && (
                    <div className="flex items-center gap-1.5 mb-4">
                      <Letter weight="BoldDuotone"
                        size={18}
                        style={{ color: colors.primary.main }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {student.user.email}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <BookBookmark weight="BoldDuotone"
                        size={18}
                        style={{ color: colors.primary.main }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {enrollments.length} {t("studentProfile.totalCourses")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraphUp weight="BoldDuotone"
                        size={18}
                        style={{ color: colors.state.warning }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {inProgressCount} {t("studentProfile.inProgress")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarMark weight="BoldDuotone"
                        size={18}
                        style={{ color: colors.state.success }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {completedCount} {t("studentProfile.completed")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      ) : (
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-8 text-center">
            <p style={{ color: colors.text.secondary }}>
              {t("studentProfile.notFound")}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Enrollments */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.05 }}
      >
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: colors.text.primary }}
        >
          <BookBookmark
            size={22}
            weight="BoldDuotone"
            className="inline-block mr-2 -mt-0.5"
            style={{ color: colors.primary.main }}
          />
          {t("studentProfile.enrolledCourses")}
        </h2>
        <p className="text-sm mb-4" style={{ color: colors.text.tertiary }}>
          {t("studentProfile.enrolledCoursesDesc")}
        </p>

        {loadingEnrollments ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                shadow="none"
                className="border-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-20 h-14 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48 rounded-lg" />
                      <Skeleton className="h-3 w-32 rounded-lg" />
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : myEnrollments.length === 0 ? (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6 text-center">
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {t("studentProfile.noEnrollments")}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {myEnrollments.map((enrollment) => {
              const progress =
                enrollment.numsOfSession > 0
                  ? Math.round(
                      (enrollment.numOfCompleteSession /
                        enrollment.numsOfSession) *
                        100,
                    )
                  : 0;
              const statusColor = getStatusColor(enrollment.status);
              const courseId = enrollment.courseId;
              const isExpanded = expandedCourse === courseId;
              const isLoading = loadingCourseMap[courseId];
              const lessons = courseLessonsMap[courseId] || [];
              const moduleInfoMap = courseModuleInfoMap[courseId] || {};
              const modules = isExpanded
                ? buildModulesFromLessons(lessons, moduleInfoMap)
                : [];

              return (
                <Card
                  key={enrollment.id}
                  id={`course-${courseId}`}
                  shadow="none"
                  className="border-none overflow-hidden"
                  style={{ backgroundColor: colors.background.light }}
                >
                  {/* Course header row */}
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => toggleCourse(courseId)}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            withCDN(enrollment.course?.thumbnailUrl) ||
                            "https://placehold.co/300x200?text=No+Image"
                          }
                          alt={enrollment.course?.title}
                          className="w-20 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p
                              className="font-semibold truncate"
                              style={{ color: colors.text.primary }}
                            >
                              {enrollment.course?.title}
                            </p>
                            <Chip
                              size="sm"
                              style={{
                                backgroundColor: statusColor.bg,
                                color: statusColor.text,
                              }}
                            >
                              {enrollment.status === "InProgress"
                                ? t("studentProfile.inProgress")
                                : enrollment.status === "Completed"
                                  ? t("studentProfile.completed")
                                  : enrollment.status}
                            </Chip>
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className="text-xs"
                              style={{ color: colors.text.tertiary }}
                            >
                              {enrollment.numOfCompleteSession}/
                              {enrollment.numsOfSession}{" "}
                              {t("courses.detail.sessionsCompleted")}
                            </span>
                            {enrollment.enrolledAt && (
                              <span
                                className="text-xs"
                                style={{ color: colors.text.tertiary }}
                              >
                                {new Date(
                                  enrollment.enrolledAt,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress
                              value={progress}
                              size="sm"
                              color={
                                enrollment.status === "Completed"
                                  ? "success"
                                  : "primary"
                              }
                              className="flex-1"
                            />
                            <span
                              className="text-sm font-semibold min-w-[3rem] text-right"
                              style={{ color: colors.primary.main }}
                            >
                              {progress}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Tooltip content={t("common.view")} size="sm">
                            <button
                              type="button"
                              className="p-1.5 rounded-md"
                              style={{ color: colors.text.tertiary }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/tutor/courses/${courseId}`);
                              }}
                            >
                              <SquareAltArrowRight weight="BoldDuotone" size={16} />
                            </button>
                          </Tooltip>
                          {isExpanded ? (
                            <AltArrowUp weight="BoldDuotone"
                              size={18}
                              style={{ color: colors.text.secondary }}
                            />
                          ) : (
                            <AltArrowDown weight="BoldDuotone"
                              size={18}
                              style={{ color: colors.text.secondary }}
                            />
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </button>

                  {/* Expanded learning path */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-5 border-t"
                      style={{ borderColor: colors.border.light }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <Spinner size="sm" color="primary" />
                        </div>
                      ) : modules.length === 0 ? (
                        <p
                          className="text-sm text-center py-6"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("courses.detail.noSessions")}
                        </p>
                      ) : (
                        <div className="space-y-4 pt-4">
                          {modules.map((mod, modIdx) => (
                            <div key={mod.moduleId}>
                              {/* Module label */}
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{
                                    backgroundColor: colors.primary.main,
                                    color: "#fff",
                                  }}
                                >
                                  {modIdx + 1}
                                </span>
                                <p
                                  className="text-xs uppercase tracking-wider font-semibold"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {mod.title}
                                </p>
                              </div>

                              {/* Session cards */}
                              <div className="space-y-2 ml-8">
                                {mod.sessions.map((sess) => {
                                  const primary = getPrimaryLesson(
                                    sess.lessons,
                                  );
                                  const statusColor = primary
                                    ? getLessonStatusColor(primary.status)
                                    : colors.text.tertiary;
                                  const hwList = sess.lessons.flatMap(
                                    (l) => l.lessonHomeworks || [],
                                  );
                                  const hasRecording =
                                    !!primary?.lessonRecord?.recordUrl;
                                  const hasSummary =
                                    !!primary?.lessonScript?.summarizeText;
                                  const joinable =
                                    primary && canJoinLesson(primary);

                                  return (
                                    <div
                                      key={sess.sessionId}
                                      className="rounded-xl border overflow-hidden"
                                      style={{
                                        borderColor:
                                          primary?.status === "InProgress" ||
                                          primary?.meetingStatus === "Waiting"
                                            ? statusColor
                                            : colors.border.light,
                                        borderWidth:
                                          primary?.status === "InProgress" ||
                                          primary?.meetingStatus === "Waiting"
                                            ? 2
                                            : 1,
                                      }}
                                    >
                                      {/* Top row: icon + title + status */}
                                      <div
                                        className="flex items-start gap-3 px-4 pt-3 pb-2"
                                        style={{
                                          backgroundColor:
                                            colors.background.light,
                                        }}
                                      >
                                        {/* Status icon */}
                                        <div
                                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                          style={{
                                            backgroundColor: `${statusColor}18`,
                                          }}
                                        >
                                          {!primary ? (
                                            <Record
                                              weight="BoldDuotone"
                                              className="w-4 h-4"
                                              style={{
                                                color: colors.text.tertiary,
                                              }}
                                            />
                                          ) : primary.status === "Completed" ? (
                                            <CheckCircle
                                              weight="BoldDuotone"
                                              className="w-4 h-4"
                                              style={{ color: statusColor }}
                                            />
                                          ) : primary.status === "InProgress" ||
                                            primary.meetingStatus ===
                                              "Waiting" ? (
                                            <Lightning
                                              weight="BoldDuotone"
                                              className="w-4 h-4"
                                              style={{ color: statusColor }}
                                            />
                                          ) : primary.status === "Cancelled" ||
                                            primary.status === "NoStudent" ||
                                            primary.status === "NoTutor" ? (
                                            <CloseCircle
                                              weight="BoldDuotone"
                                              className="w-4 h-4"
                                              style={{ color: statusColor }}
                                            />
                                          ) : (
                                            <ClockCircle
                                              weight="BoldDuotone"
                                              className="w-4 h-4"
                                              style={{ color: statusColor }}
                                            />
                                          )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-2 flex-wrap">
                                            <p
                                              className="font-semibold text-sm"
                                              style={{
                                                color: colors.text.primary,
                                              }}
                                            >
                                              {sess.sessionNumber}.{" "}
                                              {sess.sessionTitle}
                                            </p>
                                            {primary && (
                                              <Chip
                                                size="sm"
                                                className="h-5 flex-shrink-0"
                                                style={{
                                                  backgroundColor: `${statusColor}20`,
                                                  color: statusColor,
                                                  fontSize: "10px",
                                                }}
                                              >
                                                {getLessonStatusLabel(
                                                  primary.status,
                                                )}
                                              </Chip>
                                            )}
                                          </div>

                                          {/* Date/time row */}
                                          {primary?.startTime && (
                                            <div className="flex items-center gap-1.5 mt-1">
                                              <CalendarMark
                                                size={12}
                                                weight="BoldDuotone"
                                                style={{ color: statusColor }}
                                              />
                                              <span
                                                className="text-xs"
                                                style={{
                                                  color: colors.text.secondary,
                                                }}
                                              >
                                                {formatDate(primary.startTime)}
                                              </span>
                                              <span
                                                style={{
                                                  color: colors.text.tertiary,
                                                }}
                                                className="text-xs"
                                              >
                                                ·
                                              </span>
                                              <span
                                                className="text-xs"
                                                style={{
                                                  color: colors.text.secondary,
                                                }}
                                              >
                                                {formatTime(primary.startTime)}{" "}
                                                – {formatTime(primary.endTime)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Action row */}
                                      <div
                                        className="flex items-center gap-2 px-4 py-2 flex-wrap border-t"
                                        style={{
                                          borderColor: colors.border.medium,
                                          backgroundColor: colors.border.medium,
                                        }}
                                      >
                                        {/* Homework badge — clickable */}
                                        <button
                                          type="button"
                                          className="flex items-center gap-1 rounded-full px-2 py-0.5 transition-opacity hover:opacity-80"
                                          style={{
                                            backgroundColor: `${colors.primary.main}15`,
                                            color: colors.primary.main,
                                            fontSize: "11px",
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openHomework(primary);
                                          }}
                                        >
                                          <PenNewRound
                                            weight="BoldDuotone"
                                            className="w-3 h-3"
                                          />
                                          {hwList.length > 0
                                            ? `${hwList.length} ${t("studentDashboard.homework.title")}`
                                            : `+ ${t("studentDashboard.homework.title")}`}
                                        </button>

                                        <div className="flex items-center gap-1.5 ml-auto">
                                          {/* Start / Join button */}
                                          {joinable && primary && (
                                            <Button
                                              size="sm"
                                              startContent={
                                                <Videocamera
                                                  weight="BoldDuotone"
                                                  className="w-3.5 h-3.5"
                                                />
                                              }
                                              style={{
                                                backgroundColor: statusColor,
                                                color: "#fff",
                                              }}
                                              onPress={() =>
                                                navigate(
                                                  `/meeting/${primary.id}`,
                                                )
                                              }
                                            >
                                              {t(
                                                "tutorDashboard.dashboard.startLesson",
                                              )}
                                            </Button>
                                          )}

                                          {/* View Recording */}
                                          {hasRecording && (
                                            <Tooltip
                                              content={t(
                                                "tutorDashboard.schedule.watchRecording",
                                              )}
                                              size="sm"
                                            >
                                              <Button
                                                isIconOnly
                                                size="sm"
                                                variant="flat"
                                                style={{
                                                  backgroundColor: `${colors.state.success}20`,
                                                  color: colors.state.success,
                                                  minWidth: "32px",
                                                  height: "32px",
                                                }}
                                                onPress={() =>
                                                  openRecording(primary)
                                                }
                                              >
                                                <Play
                                                  weight="BoldDuotone"
                                                  className="w-3.5 h-3.5"
                                                />
                                              </Button>
                                            </Tooltip>
                                          )}

                                          {/* View Summary */}
                                          {hasSummary && (
                                            <Tooltip
                                              content={t(
                                                "tutorDashboard.schedule.lessonSummary",
                                              )}
                                              size="sm"
                                            >
                                              <Button
                                                isIconOnly
                                                size="sm"
                                                variant="flat"
                                                style={{
                                                  backgroundColor: `${colors.primary.main}20`,
                                                  color: colors.primary.main,
                                                  minWidth: "32px",
                                                  height: "32px",
                                                }}
                                                onPress={() =>
                                                  openSummary(primary)
                                                }
                                              >
                                                <DocumentText
                                                  weight="BoldDuotone"
                                                  className="w-3.5 h-3.5"
                                                />
                                              </Button>
                                            </Tooltip>
                                          )}

                                          {/* View Detail */}
                                          {primary && (
                                            <Tooltip
                                              content={t(
                                                "studentDashboard.myCourses.viewDetails",
                                              )}
                                              size="sm"
                                            >
                                              <Button
                                                isIconOnly
                                                size="sm"
                                                variant="flat"
                                                style={{
                                                  backgroundColor: `${colors.text.tertiary}15`,
                                                  color: colors.text.secondary,
                                                  minWidth: "32px",
                                                  height: "32px",
                                                }}
                                                onPress={() =>
                                                  openDetail(primary)
                                                }
                                              >
                                                <ArrowRightUp
                                                  weight="BoldDuotone"
                                                  className="w-3.5 h-3.5"
                                                />
                                              </Button>
                                            </Tooltip>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Other tutors' courses */}
      {!loadingEnrollments && otherEnrollments.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.1 }}
        >
          <h2
            className="text-xl font-bold mb-1"
            style={{ color: colors.text.primary }}
          >
            <BookBookmark
              size={22}
              weight="BoldDuotone"
              className="inline-block mr-2 -mt-0.5"
              style={{ color: colors.text.tertiary }}
            />
            {t("studentProfile.otherCourses")}
          </h2>
          <p className="text-sm mb-4" style={{ color: colors.text.tertiary }}>
            {t("studentProfile.otherCoursesDesc")}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherEnrollments.map((enrollment) => (
              <CourseCard
                key={enrollment.id}
                course={{
                  id: enrollment.courseId,
                  thumbnailUrl: withCDN(enrollment.course?.thumbnailUrl),
                  title: enrollment.course?.title,
                  level: enrollment.course?.level,
                }}
                showTutorInfo={false}
                progress={{
                  completed: enrollment.numOfCompleteSession,
                  total: enrollment.numsOfSession,
                }}
                statusBadge={{
                  label:
                    enrollment.status === "InProgress"
                      ? t("studentProfile.inProgress")
                      : t("studentProfile.completed"),
                  color: getStatusColor(enrollment.status).bg,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <LessonDetailModal
        isOpen={isDetailOpen}
        onClose={onDetailClose}
        lesson={selectedLesson}
        role="tutor"
      />

      <VideoModal
        isOpen={isVideoOpen}
        onOpenChange={onVideoOpenChange}
        videoUrl={recordingUrl}
      />

      <LessonSummaryModal
        isOpen={isSummaryOpen}
        onClose={onSummaryClose}
        summarizeText={summaryText}
      />

      {/* Homework Modal */}
      <Modal
        isOpen={isHwOpen}
        onClose={onHwClose}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            <div className="flex items-center gap-2">
              <ClipboardList
                weight="BoldDuotone"
                className="w-5 h-5"
                style={{ color: colors.primary.main }}
              />
              <span>{hwLesson?.sessionTitle || "Homework"}</span>
            </div>
          </ModalHeader>
          <ModalBody className="pb-2">
            {hwLoading ? (
              <div className="flex justify-center py-8">
                <Spinner color="primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {hwItems.length === 0 && !showCreateHw && (
                  <p
                    className="text-sm text-center py-4"
                    style={{ color: colors.text.tertiary }}
                  >
                    No homework assigned for this lesson yet.
                  </p>
                )}
                {hwItems.map((hw) => {
                  const sp = hwStatusProps(hw.status);
                  const isGrading = gradingId === hw.id;
                  return (
                    <div
                      key={hw.id}
                      className="rounded-xl p-3 border space-y-2"
                      style={{
                        borderColor: colors.border.medium,
                        backgroundColor: colors.background.gray,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-sm font-medium flex-1"
                          style={{ color: colors.text.primary }}
                        >
                          {hw.description || "—"}
                        </p>
                        <Chip
                          size="sm"
                          style={{
                            backgroundColor: `${sp.color}20`,
                            color: sp.color,
                            fontSize: "10px",
                          }}
                        >
                          {sp.label}
                        </Chip>
                      </div>
                      <div
                        className="flex items-center gap-3 text-xs"
                        style={{ color: colors.text.tertiary }}
                      >
                        {hw.dueAt && (
                          <span>
                            Due: {new Date(hw.dueAt).toLocaleDateString()}
                          </span>
                        )}
                        <span>Max: {hw.maxScore} pts</span>
                        {hw.score != null && (
                          <span style={{ color: colors.state.success }}>
                            Score: {hw.score}
                          </span>
                        )}
                      </div>
                      {hw.submissionUrl && (
                        <a
                          href={hw.submissionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs flex items-center gap-1 hover:underline"
                          style={{ color: colors.primary.main }}
                        >
                          <SquareAltArrowRight weight="BoldDuotone" className="w-3 h-3" /> View
                          submission
                        </a>
                      )}
                      {hw.tutorFeedback && (
                        <p
                          className="text-xs italic"
                          style={{ color: colors.text.secondary }}
                        >
                          Feedback: {hw.tutorFeedback}
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        {hw.status === "NotStarted" && (
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onPress={() => handleAssign(hw)}
                          >
                            Assign to Student
                          </Button>
                        )}
                        {hw.status === "Submitted" && !isGrading && (
                          <Button
                            size="sm"
                            variant="flat"
                            style={{
                              backgroundColor: `${colors.state.success}20`,
                              color: colors.state.success,
                            }}
                            startContent={
                              <Star
                                weight="BoldDuotone"
                                className="w-3.5 h-3.5"
                              />
                            }
                            onPress={() => {
                              setGradingId(hw.id);
                              setGradeForm({ score: "", tutorFeedback: "" });
                            }}
                          >
                            Grade
                          </Button>
                        )}
                        {isGrading && (
                          <div className="w-full space-y-2">
                            <div className="flex gap-2">
                              <Input
                                size="sm"
                                type="number"
                                placeholder={`Score / ${hw.maxScore}`}
                                value={gradeForm.score}
                                onChange={(e) =>
                                  setGradeForm((p) => ({
                                    ...p,
                                    score: e.target.value,
                                  }))
                                }
                                className="w-28"
                              />
                              <Input
                                size="sm"
                                placeholder="Feedback (optional)"
                                value={gradeForm.tutorFeedback}
                                onChange={(e) =>
                                  setGradeForm((p) => ({
                                    ...p,
                                    tutorFeedback: e.target.value,
                                  }))
                                }
                                className="flex-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                color="success"
                                isLoading={hwSubmitting}
                                onPress={() => handleGrade(hw)}
                              >
                                Submit Grade
                              </Button>
                              <Button
                                size="sm"
                                variant="light"
                                onPress={() => setGradingId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Create form */}
                {showCreateHw && (
                  <div
                    className="rounded-xl p-4 border space-y-4"
                    style={{ borderColor: colors.border.medium }}
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      Create homework
                    </p>

                    {/* Lesson resource */}
                    <div className="space-y-1">
                      <p
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        Lesson resource
                      </p>
                      {resourcesLoading ? (
                        <Spinner size="sm" color="primary" />
                      ) : sessionResources.length === 0 ? (
                        <p
                          className="text-xs italic"
                          style={{ color: colors.text.tertiary }}
                        >
                          This lesson has no resources. Add one in the course
                          first.
                        </p>
                      ) : (
                        <Select
                          size="sm"
                          placeholder="Select a resource (optional)"
                          selectedKeys={
                            newHw.courseResourceId
                              ? [newHw.courseResourceId]
                              : []
                          }
                          onSelectionChange={(keys) =>
                            setNewHw((p) => ({
                              ...p,
                              courseResourceId: Array.from(keys)[0] || "",
                            }))
                          }
                        >
                          {sessionResources.map((r) => (
                            <SelectItem key={r.id}>
                              {r.title || r.url || r.id}
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                      <p
                        className="text-xs"
                        style={{ color: colors.text.tertiary }}
                      >
                        Attach a resource from this lesson as reference material
                      </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <p
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        Description
                      </p>
                      <Textarea
                        size="sm"
                        placeholder="Describe what the student needs to do"
                        value={newHw.description}
                        onChange={(e) =>
                          setNewHw((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        minRows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          Max score
                        </p>
                        <Input
                          size="sm"
                          type="number"
                          placeholder="100"
                          value={newHw.maxScore}
                          onChange={(e) =>
                            setNewHw((p) => ({
                              ...p,
                              maxScore: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <p
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          Due date
                        </p>
                        <Input
                          size="sm"
                          type="datetime-local"
                          value={newHw.dueAt}
                          onChange={(e) =>
                            setNewHw((p) => ({ ...p, dueAt: e.target.value }))
                          }
                        />
                        <p
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          Leave empty for no deadline
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        isLoading={hwSubmitting}
                        onPress={handleCreateHw}
                      >
                        Create
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => setShowCreateHw(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter className="pt-2 flex items-center justify-between">
            <button
              type="button"
              className="text-xs flex items-center gap-1 hover:underline"
              style={{ color: colors.text.tertiary }}
              onClick={() => {
                onHwClose();
                navigate("/tutor/homework");
              }}
            >
              <SquareAltArrowRight weight="BoldDuotone" className="w-3 h-3" />
              View all in Homework page
            </button>
            <div className="flex gap-2">
              {!showCreateHw && (
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<AddCircle weight="BoldDuotone" className="w-3.5 h-3.5" />}
                  onPress={() => setShowCreateHw(true)}
                >
                  Add Homework
                </Button>
              )}
              <Button size="sm" variant="light" onPress={onHwClose}>
                Close
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default StudentDetail;
