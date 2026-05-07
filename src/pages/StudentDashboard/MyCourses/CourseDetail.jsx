import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Avatar,
  Divider,
  Spinner,
  Progress,
  useDisclosure,
  Tooltip,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { useTheme } from "../../../contexts/ThemeContext";
import CourseDetailSkeleton from "../../../components/CourseDetailSkeleton/CourseDetailSkeleton";
import VideoModal from "../../../components/VideoModal/VideoModal";
import LessonDetailModal from "../../../components/LessonDetailModal/LessonDetailModal";
import LessonSummaryModal from "../../../components/LessonSummaryModal/LessonSummaryModal";
import LessonQuizModal from "../../../components/LessonQuizModal/LessonQuizModal";
import StudentHomeworkDetailModal from "../../../components/StudentHomeworkDetailModal/StudentHomeworkDetailModal";
import StudentHomeworkSubmitModal from "../../../components/StudentHomeworkSubmitModal/StudentHomeworkSubmitModal";
import {
  Star,
  Clock,
  Users,
  BookOpen,
  Check,
  ArrowLeft,
  CaretDown,
  CaretUp,
  Play,
  Certificate,
  FileText,
  FilePdf,
  VideoCamera,
  Link as LinkIcon,
  ArrowSquareOut,
  CalendarDots,
  ArrowRightIcon,
  Exam,
  PencilSimple,
  Trash,
  ChatTeardropText,
  CheckCircle,
  Circle,
  Lightning,
  ClockCountdown,
  Paperclip,
  NotePencil,
  Target,
  Warning,
} from "@phosphor-icons/react";
import {
  coursesApi,
  tutorApi,
  studentApi,
  lessonHomeworkApi,
} from "../../../api";
import { supportApi } from "../../../api/supportApi";
import StudentRefundRequestModal from "../../../components/StudentRefundRequestModal/StudentRefundRequestModal";
import useInputStyles from "../../../hooks/useInputStyles";

const formatDuration = (timeStr) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length !== 3) return timeStr;
  const h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return timeStr;
};

const getResourceIcon = (type) => {
  switch (type?.toLowerCase()) {
    case "pdf":
      return <FilePdf size={14} weight="fill" style={{ color: "#EF4444" }} />;
    case "video":
      return (
        <VideoCamera size={14} weight="fill" style={{ color: "#8B5CF6" }} />
      );
    case "link":
      return <LinkIcon size={14} weight="fill" style={{ color: "#3B82F6" }} />;
    default:
      return <FileText size={14} weight="fill" style={{ color: "#6B7280" }} />;
  }
};

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const StudentMyCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const colors = useThemeColors();
  const { theme } = useTheme();
  const user = useSelector(selectUser);
  const { lastRecordAvailable, lastAiSummaryAvailable } = useNotifications();
  const { textareaClassNames } = useInputStyles();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [tutorInfo, setTutorInfo] = useState(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const instructorRef = useRef(null);
  // Resources state (per sessionId)
  const [expandedResources, setExpandedResources] = useState({});
  const [sessionResources, setSessionResources] = useState({});
  const [loadingResources, setLoadingResources] = useState({});

  // Lessons state
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Module details fetched after lessons load (for Learning Path)
  const [moduleInfoMap, setModuleInfoMap] = useState({});

  // Homework state (for this course)
  const [courseHomeworks, setCourseHomeworks] = useState([]);

  // HW inline modal state
  const [selectedHwModal, setSelectedHwModal] = useState(null);
  const {
    isOpen: isHwDetailOpen,
    onOpen: onHwDetailOpen,
    onClose: onHwDetailClose,
  } = useDisclosure();
  const {
    isOpen: isHwSubmitOpen,
    onOpen: onHwSubmitOpen,
    onClose: onHwSubmitClose,
  } = useDisclosure();

  // Enrollment state
  const [enrollment, setEnrollment] = useState(null);
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);

  // Tick for live countdown
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Modals
  const {
    isOpen: isLessonDetailOpen,
    onOpen: onLessonDetailOpen,
    onClose: onLessonDetailClose,
  } = useDisclosure();
  const [recordingLesson, setRecordingLesson] = useState(null);
  const {
    isOpen: isRecordingOpen,
    onOpen: onRecordingOpen,
    onClose: onRecordingClose,
  } = useDisclosure();
  const [summaryLesson, setSummaryLesson] = useState(null);
  const {
    isOpen: isSummaryOpen,
    onOpen: onSummaryOpen,
    onClose: onSummaryClose,
  } = useDisclosure();
  const [quizLesson, setQuizLesson] = useState(null);
  const {
    isOpen: isQuizOpen,
    onOpen: onQuizOpen,
    onClose: onQuizClose,
  } = useDisclosure();
  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();

  // Refund request state
  const [refundLesson, setRefundLesson] = useState(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundNote, setRefundNote] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  // Review state
  const [existingReview, setExistingReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onClose: onDeleteConfirmClose,
  } = useDisclosure();

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleOpenRefundRequest = (lesson) => {
    setRefundLesson(lesson);
    setRefundNote("");
    setRefundModalOpen(true);
  };

  const handleSubmitRefundTicket = async () => {
    if (!refundLesson || !user?.userId) return;
    setSubmittingRefund(true);
    try {
      const lessonDate = new Date(refundLesson.startTime).toLocaleString(
        dateLocale,
        {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      );
      const description =
        `Student refund request for lesson where tutor was absent.\n` +
        `Course: ${refundLesson.courseTitle || "—"}\n` +
        `Session: ${refundLesson.sessionTitle || "—"}\n` +
        `Date: ${lessonDate}\n` +
        (refundNote.trim() ? `Note: ${refundNote.trim()}\n` : "") +
        `\n[LessonId]: ${refundLesson.id}`;
      await supportApi.createTicket({
        createdBy: user.userId,
        subject: `Refund Request — ${refundLesson.courseTitle || refundLesson.sessionTitle || "Lesson"} (${lessonDate})`,
        description,
        type: "Refund",
      });
      addToast({
        title: t("studentDashboard.schedule.refundRequest.submitSuccess"),
        color: "success",
      });
      setRefundModalOpen(false);
    } catch {
      addToast({
        title: t("studentDashboard.schedule.refundRequest.submitFailed"),
        color: "danger",
      });
    } finally {
      setSubmittingRefund(false);
    }
  };

  const toggleResources = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      setExpandedResources((prev) => ({
        ...prev,
        [sessionId]: !prev[sessionId],
      }));
      if (!sessionResources[sessionId] && !loadingResources[sessionId]) {
        try {
          setLoadingResources((prev) => ({ ...prev, [sessionId]: true }));
          const res = await coursesApi.getAllCourseResources({
            CourseSessionId: sessionId,
            "page-size": 100,
          });
          setSessionResources((prev) => ({
            ...prev,
            [sessionId]: res?.data?.items || [],
          }));
        } catch (err) {
          console.error("Failed to fetch resources:", err);
        } finally {
          setLoadingResources((prev) => ({ ...prev, [sessionId]: false }));
        }
      }
    },
    [sessionResources, loadingResources],
  );

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await coursesApi.getCourseById(id);
        setCourse(res.data);
        if (res.data?.tutorId) {
          try {
            const tutorRes = await tutorApi.getTutorById(res.data.tutorId);
            setTutorInfo(tutorRes.data);
          } catch (tutorErr) {
            console.error("Failed to fetch tutor:", tutorErr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  useEffect(() => {
    const fetchEnrollment = async () => {
      if (!user?.studentId || !id) return;
      try {
        const res = await coursesApi.getAllCourseEnrollments({
          StudentId: user.studentId,
          CourseId: id,
          Status: "InProgress, Completed",
          "page-size": 1,
        });
        const item = res?.data?.items?.[0];
        if (item) {
          setEnrollment(item);
        } else {
          navigate("/student/my-courses", { replace: true });
          return;
        }
      } catch (err) {
        console.error("Failed to fetch enrollment:", err);
        navigate("/student/my-courses", { replace: true });
        return;
      } finally {
        setEnrollmentChecked(true);
      }
    };
    fetchEnrollment();
  }, [user?.studentId, id]);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.studentId || !id) return;
      try {
        setLessonsLoading(true);
        const res = await studentApi.getLessons({
          StudentId: user.studentId,
          CourseId: id,
          "page-size": 200,
          "sort-params": "StartTime-asc",
        });
        setLessons(res?.data?.items || []);
      } catch (err) {
        console.error("Failed to fetch lessons:", err);
      } finally {
        setLessonsLoading(false);
      }
    };
    fetchLessons();
  }, [user?.studentId, id]);

  // Recording became available — inject URL directly without refetch
  useEffect(() => {
    if (!lastRecordAvailable) return;
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lastRecordAvailable.LessonId
          ? {
              ...l,
              lessonRecord: {
                ...(l.lessonRecord || {}),
                recordUrl: lastRecordAvailable.RecordUrl,
              },
            }
          : l,
      ),
    );
  }, [lastRecordAvailable]);

  // AI summary became available — refetch to get summarizeText
  useEffect(() => {
    if (!lastAiSummaryAvailable || !user?.studentId || !id) return;
    const isInThisCourse = lessons.some(
      (l) => l.id === lastAiSummaryAvailable.LessonId,
    );
    if (!isInThisCourse) return;
    studentApi
      .getLessons({
        StudentId: user.studentId,
        CourseId: id,
        "page-size": 200,
        "sort-params": "StartTime-asc",
      })
      .then((res) => setLessons(res?.data?.items || []))
      .catch(console.error);
  }, [lastAiSummaryAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!lessons.length) return;
    const uniqueModuleIds = [
      ...new Set(lessons.map((l) => l.moduleId).filter(Boolean)),
    ];
    if (!uniqueModuleIds.length) return;
    Promise.all(
      uniqueModuleIds.map((mid) => coursesApi.getCourseModuleById(mid)),
    )
      .then((results) => {
        const map = {};
        results.forEach((res) => {
          const mod = res?.data;
          if (mod?.id) map[mod.id] = mod;
        });
        setModuleInfoMap(map);
      })
      .catch((err) => console.error("Failed to fetch module info:", err));
  }, [lessons]);

  const fetchHomeworksByLessons = useCallback(async () => {
    if (!lessons.length) return;
    const lessonIds = lessons.map((l) => l.id).filter(Boolean);
    if (!lessonIds.length) return;
    try {
      const results = await Promise.all(
        lessonIds.map((lid) =>
          lessonHomeworkApi.getHomeworks({ LessonId: lid, "page-size": 50 }),
        ),
      );
      const items = results.flatMap((res) => res?.data?.items || []);
      setCourseHomeworks(items.filter((h) => h.status !== "NotStarted"));
    } catch (err) {
      console.error("Failed to fetch homeworks:", err);
      setCourseHomeworks([]);
    }
  }, [lessons]);

  useEffect(() => {
    fetchHomeworksByLessons();
  }, [fetchHomeworksByLessons]);

  useEffect(() => {
    const fetchReview = async () => {
      if (!user?.studentId || !id) return;
      try {
        setReviewLoading(true);
        const res = await coursesApi.getCourseReviews({
          CourseId: id,
          "page-size": 100,
        });
        const myReview = res?.data?.items?.find(
          (r) => r.studentId === user.studentId,
        );
        if (myReview) {
          setExistingReview(myReview);
          setReviewRating(myReview.rating);
          setReviewComment(myReview.comment || "");
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setReviewLoading(false);
      }
    };
    fetchReview();
  }, [user?.studentId, id]);

  const courseProgress =
    enrollment?.numsOfSession > 0
      ? (enrollment.numOfCompleteSession / enrollment.numsOfSession) * 100
      : 0;

  const canReview = courseProgress >= 50;

  const handleSubmitReview = async () => {
    if (!reviewRating || reviewSubmitting) return;
    try {
      setReviewSubmitting(true);
      if (existingReview) {
        const res = await coursesApi.updateCourseReview(existingReview.id, {
          rating: reviewRating,
          comment: reviewComment,
          isAnonymous: false,
        });
        setExistingReview(res.data);
        setIsEditingReview(false);
      } else {
        const res = await coursesApi.createCourseReview({
          courseId: id,
          studentId: user.studentId,
          tutorId: course.tutorId,
          enrollmentId: enrollment.id,
          rating: reviewRating,
          comment: reviewComment,
          isAnonymous: false,
        });
        setExistingReview(res.data);
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!existingReview) return;
    try {
      setReviewSubmitting(true);
      await coursesApi.deleteCourseReview(existingReview.id);
      setExistingReview(null);
      setReviewRating(0);
      setReviewComment("");
      setIsEditingReview(false);
      onDeleteConfirmClose();
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const hwStatusChipProps = (status) => {
    switch (status) {
      case "Assigned":
        return {
          bg: `${colors.state.warning}20`,
          color: colors.state.warning,
          label: t("studentDashboard.homework.status.assigned"),
        };
      case "Submitted":
        return {
          bg: `${colors.primary.main}20`,
          color: colors.primary.main,
          label: t("studentDashboard.homework.status.submitted"),
        };
      case "Scored":
        return {
          bg: `${colors.state.success}20`,
          color: colors.state.success,
          label: t("studentDashboard.homework.status.scored"),
        };
      default:
        return {
          bg: `${colors.text.tertiary}20`,
          color: colors.text.tertiary,
          label: status,
        };
    }
  };

  const openHwDetail = (hw) => {
    setSelectedHwModal(hw);
    onHwDetailOpen();
  };

  const openHwSubmit = (hw) => {
    setSelectedHwModal(hw);
    onHwSubmitOpen();
  };

  const handleHwSubmitSuccess = async () => {
    onHwDetailClose();
    await fetchHomeworksByLessons();
  };

  const formatLessonTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLessonDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(dateLocale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString())
      return t("studentDashboard.dashboard.today");
    if (d.toDateString() === tomorrow.toDateString())
      return t("studentDashboard.dashboard.tomorrow");
    return d.toLocaleDateString(dateLocale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeUntil = (dateStr) => {
    if (!dateStr) return "";
    const target = new Date(dateStr).getTime();
    const diffMs = target - now;
    if (diffMs <= 0) return null;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "<1m";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      const mins = diffMin % 60;
      return mins > 0 ? `${diffHours}h ${mins}m` : `${diffHours}h`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  // Build a map: sessionId -> sorted lessons
  const lessonsBySession = useMemo(() => {
    const map = {};
    lessons.forEach((l) => {
      if (!l.sessionId) return;
      if (!map[l.sessionId]) map[l.sessionId] = [];
      map[l.sessionId].push(l);
    });
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });
    return map;
  }, [lessons]);

  const homeworksByLessonId = useMemo(() => {
    const map = {};
    courseHomeworks.forEach((h) => {
      if (!h.lessonId) return;
      if (!map[h.lessonId]) map[h.lessonId] = [];
      map[h.lessonId].push(h);
    });
    return map;
  }, [courseHomeworks]);

  const modulesFromLessons = useMemo(() => {
    if (!lessons.length) return [];
    const moduleOrder = [];
    const moduleSessionsMap = {};
    lessons.forEach((lesson) => {
      const { moduleId, sessionId } = lesson;
      if (!moduleId || !sessionId) return;
      if (!moduleSessionsMap[moduleId]) {
        moduleOrder.push(moduleId);
        moduleSessionsMap[moduleId] = {
          sessionOrder: [],
          sessionLessonsMap: {},
        };
      }
      const mod = moduleSessionsMap[moduleId];
      if (!mod.sessionLessonsMap[sessionId]) {
        mod.sessionOrder.push(sessionId);
        mod.sessionLessonsMap[sessionId] = [];
      }
      mod.sessionLessonsMap[sessionId].push(lesson);
    });
    return moduleOrder.map((moduleId) => {
      const info = moduleInfoMap[moduleId] || null;
      const modData = moduleSessionsMap[moduleId];
      return {
        moduleId,
        title: info?.title || "",
        description: info?.description || "",
        sessions: modData.sessionOrder.map((sessionId, sessIdx) => {
          const lessonList = modData.sessionLessonsMap[sessionId];
          const sessionInfo =
            info?.courseSessions?.find(
              (s) => s.courseSessionId === sessionId,
            ) || null;
          return {
            sessionId,
            sessionTitle:
              sessionInfo?.sessionTitle || lessonList[0]?.sessionTitle || "",
            sessionDescription: sessionInfo?.sessionDescription || "",
            sessionOutcomes: sessionInfo?.sessionOutcomes || "",
            sessionNumber: sessionInfo?.sessionNumber ?? sessIdx + 1,
          };
        }),
      };
    });
  }, [lessons, moduleInfoMap]);

  // Determine current primary lesson for a session (latest non-cancelled, else latest)
  const getPrimaryLesson = (sessionId) => {
    const list = lessonsBySession[sessionId] || [];
    if (list.length === 0) return null;
    const completed = list.filter((l) => l.status === "Completed");
    if (completed.length > 0) return completed[completed.length - 1];
    const live = list.find(
      (l) =>
        l.meetingStatus === "Waiting" ||
        l.meetingStatus === "InProgress" ||
        l.status === "InProgress",
    );
    if (live) return live;
    const upcoming = list
      .filter(
        (l) =>
          l.status !== "Cancelled" && new Date(l.startTime) >= new Date(now),
      )
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    if (upcoming.length > 0) return upcoming[0];
    return list[list.length - 1];
  };

  // Derive session status
  const getSessionState = (sessionId) => {
    const primary = getPrimaryLesson(sessionId);
    if (!primary) {
      return {
        key: "not_scheduled",
        color: colors.text.tertiary,
        label: t("studentDashboard.myCourses.notScheduledYet"),
      };
    }
    if (primary.status === "Completed") {
      return {
        key: "completed",
        color: colors.state.success,
        label: t("studentDashboard.myCourses.sessionCompleted"),
      };
    }
    if (
      primary.meetingStatus === "Waiting" ||
      primary.meetingStatus === "InProgress" ||
      primary.status === "InProgress"
    ) {
      return {
        key: "live",
        color: colors.state.warning,
        label: t("studentDashboard.myCourses.sessionLive"),
      };
    }
    return {
      key: "upcoming",
      color: colors.primary.main,
      label: t("studentDashboard.myCourses.sessionUpcoming"),
    };
  };

  // Next lesson = nearest upcoming non-cancelled lesson (Waiting/InProgress prioritized)
  const nextLesson = useMemo(() => {
    if (!lessons.length) return null;
    const live = lessons.find(
      (l) =>
        l.meetingStatus === "Waiting" ||
        l.meetingStatus === "InProgress" ||
        l.status === "InProgress",
    );
    if (live) return live;
    const upcoming = lessons
      .filter(
        (l) =>
          new Date(l.startTime) >= new Date(now) && l.status !== "Cancelled",
      )
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    return upcoming[0] || null;
  }, [lessons, now]);

  // Past lessons for history modal
  const pastLessons = useMemo(() => {
    return lessons
      .filter(
        (l) =>
          new Date(l.startTime) < new Date(now) || l.status === "Completed",
      )
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [lessons, now]);

  if (loading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: colors.text.primary }}
        >
          {t("courses.detail.notFound")}
        </h2>
        <Button
          color="primary"
          variant="flat"
          startContent={<ArrowLeft size={18} />}
          onPress={() => navigate("/student/my-courses")}
        >
          {t("studentDashboard.myCourses.backToMyCourses")}
        </Button>
      </div>
    );
  }

  const duration = formatDuration(course.estimatedTimeLesson);
  const category = course.courseCategories?.[0]?.categoryName;
  const outcomes = course.outcomes
    ? course.outcomes
        .split(/[;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const totalSessions = modulesFromLessons.reduce(
    (sum, m) => sum + m.sessions.length,
    0,
  );

  const completedSessions = enrollment?.numOfCompleteSession ?? 0;
  const totalSessionsFromEnrollment =
    enrollment?.numsOfSession ?? totalSessions;
  const progressPct =
    totalSessionsFromEnrollment > 0
      ? Math.round((completedSessions / totalSessionsFromEnrollment) * 100)
      : 0;

  // ---- Lesson Action Buttons renderer ----
  const LessonActions = ({ lesson, size = "sm", onOpenDetail }) => {
    const actions = [];
    if (lesson.lessonRecord?.recordUrl) {
      actions.push(
        <Tooltip
          key="rec"
          content={t("tutorDashboard.schedule.watchRecording")}
          size="sm"
        >
          <Button
            isIconOnly
            size={size}
            variant="flat"
            style={{
              backgroundColor: `${colors.state.success}20`,
              color: colors.state.success,
              minWidth: "32px",
              height: "32px",
            }}
            onPress={(e) => {
              e?.stopPropagation?.();
              setRecordingLesson(lesson);
              onRecordingOpen();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Play weight="fill" className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>,
      );
    }
    if (lesson.lessonScript?.summarizeText) {
      actions.push(
        <Tooltip
          key="sum"
          content={t("tutorDashboard.schedule.lessonSummary")}
          size="sm"
        >
          <Button
            isIconOnly
            size={size}
            variant="flat"
            style={{
              backgroundColor: `${colors.primary.main}20`,
              color: colors.primary.main,
              minWidth: "32px",
              height: "32px",
            }}
            onPress={(e) => {
              e?.stopPropagation?.();
              setSummaryLesson(lesson);
              onSummaryOpen();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <FileText weight="duotone" className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>,
      );
    }
    if (lesson.lessonScript?.id && lesson.status === "Completed") {
      actions.push(
        <Tooltip
          key="quiz"
          content={t("tutorDashboard.schedule.lessonQuiz")}
          size="sm"
        >
          <Button
            isIconOnly
            size={size}
            variant="flat"
            style={{
              backgroundColor: `${colors.state.warning}20`,
              color: colors.state.warning,
              minWidth: "32px",
              height: "32px",
            }}
            onPress={(e) => {
              e?.stopPropagation?.();
              setQuizLesson(lesson);
              onQuizOpen();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Exam weight="duotone" className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>,
      );
    }
    if (onOpenDetail) {
      actions.push(
        <Tooltip
          key="det"
          content={t("studentDashboard.myCourses.viewDetails")}
          size="sm"
        >
          <Button
            isIconOnly
            size={size}
            variant="flat"
            style={{
              backgroundColor: colors.background.gray,
              color: colors.text.secondary,
              minWidth: "32px",
              height: "32px",
            }}
            onPress={(e) => {
              e?.stopPropagation?.();
              onOpenDetail();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowSquareOut weight="bold" className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>,
      );
    }
    return <div className="flex items-center gap-1.5">{actions}</div>;
  };

  // ---- Resource list renderer ----
  const ResourceList = ({ sessionId }) => {
    const resources = sessionResources[sessionId] || [];
    const isResLoading = loadingResources[sessionId];
    if (isResLoading) {
      return (
        <div className="flex items-center gap-2 py-2">
          <Spinner size="sm" />
          <span className="text-xs" style={{ color: colors.text.tertiary }}>
            {t("courses.detail.resources.loading")}
          </span>
        </div>
      );
    }
    if (resources.length === 0) {
      return (
        <p className="text-xs py-2" style={{ color: colors.text.tertiary }}>
          {t("courses.detail.resources.empty")}
        </p>
      );
    }
    return (
      <div className="mt-2 space-y-1.5">
        {resources.map((res) => (
          <div
            key={res.id}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
            style={{ backgroundColor: colors.background.gray }}
          >
            <span className="flex-shrink-0">
              {getResourceIcon(res.resourceType)}
            </span>
            <span
              className="flex-1 text-xs font-medium truncate"
              style={{ color: colors.text.primary }}
            >
              {res.title}
            </span>
            <Chip
              size="sm"
              variant="flat"
              className="text-xs h-5 px-1"
              style={{
                fontSize: "10px",
              }}
            >
              {res.resourceType}
            </Chip>
            <a
              href={res.url}
              target="_blank"
              rel="noreferrer"
              title={t("courses.detail.resources.open")}
            >
              <ArrowSquareOut
                size={14}
                style={{ color: colors.primary.main }}
              />
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-between"
      >
        <Button
          variant="light"
          startContent={<ArrowLeft size={18} />}
          onPress={() => navigate("/student/my-courses")}
          style={{ color: colors.text.secondary }}
        >
          {t("studentDashboard.myCourses.backToMyCourses")}
        </Button>
        <Button
          variant="flat"
          size="sm"
          onPress={() => navigate("/student/homework")}
          style={{
            backgroundColor: `${colors.primary.main}15`,
            color: colors.primary.main,
          }}
        >
          {t("studentDashboard.nav.homework")}
        </Button>
      </motion.div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card
          shadow="none"
          className="border-none overflow-hidden"
          style={{
            background: theme === "dark" ? colors.background.light : "#DBEAFE",
          }}
        >
          <CardBody className="p-6 md:p-8 lg:pb-16">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Chip
                    size="sm"
                    style={{
                      backgroundColor: colors.background.primaryLight,
                      color: colors.primary.main,
                    }}
                  >
                    {course.level}
                  </Chip>
                  {category && (
                    <Chip
                      size="sm"
                      style={{
                        backgroundColor: colors.background.primaryLight,
                        color: colors.primary.main,
                      }}
                    >
                      {category}
                    </Chip>
                  )}
                </div>

                <h1
                  className="text-2xl lg:text-3xl font-bold mb-3"
                  style={{ color: colors.text.primary }}
                >
                  {course.title}
                </h1>

                <p
                  className="text-base mb-5 leading-relaxed"
                  style={{ color: colors.text.secondary }}
                >
                  {course.shortDescription}
                </p>

                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          weight="fill"
                          style={{
                            color:
                              i < Math.floor(course.ratingAverage || 0)
                                ? "#F59E0B"
                                : "rgba(0,0,0,0.1)",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="font-semibold text-sm"
                      style={{ color: colors.text.primary }}
                    >
                      {course.ratingAverage || 0}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      ({course.ratingCount?.toLocaleString() || 0}{" "}
                      {t("courses.detail.ratings")})
                    </span>
                  </div>
                  <span
                    className="text-sm flex items-center gap-1.5"
                    style={{ color: colors.text.secondary }}
                  >
                    <Users size={16} weight="duotone" />
                    {course.numberOfEnrollment?.toLocaleString() || 0}{" "}
                    {t("courses.detail.students")}
                  </span>
                </div>

                {tutorInfo && (
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("courses.detail.instructor")}:
                    </span>
                    <button
                      type="button"
                      className="text-sm font-medium hover:underline"
                      style={{ color: colors.primary.main }}
                      onClick={() =>
                        navigate(`/tutor-profile/${course?.tutorId}`)
                      }
                    >
                      {tutorInfo.user?.firstName} {tutorInfo.user?.lastName}
                    </button>
                  </div>
                )}
              </div>

              <div className="hidden lg:block" />
            </div>
          </CardBody>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Lesson Banner */}
          {!lessonsLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              {nextLesson ? (
                (() => {
                  const isLive =
                    nextLesson.meetingStatus === "Waiting" ||
                    nextLesson.meetingStatus === "InProgress" ||
                    nextLesson.status === "InProgress";
                  const countdown = formatTimeUntil(nextLesson.startTime);
                  const accent = isLive
                    ? colors.state.warning
                    : colors.primary.main;
                  return (
                    <Card
                      shadow="none"
                      className="border-none overflow-hidden"
                      style={{
                        backgroundColor: colors.background.light,
                      }}
                    >
                      <div
                        className="h-1 w-full"
                        style={{ backgroundColor: accent }}
                      />
                      <CardBody className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${accent}15` }}
                            >
                              {isLive ? (
                                <Lightning
                                  weight="fill"
                                  className="w-6 h-6"
                                  style={{ color: accent }}
                                />
                              ) : (
                                <ClockCountdown
                                  weight="duotone"
                                  className="w-6 h-6"
                                  style={{ color: accent }}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                  className="text-xs font-semibold uppercase tracking-wide"
                                  style={{ color: accent }}
                                >
                                  {t(
                                    "studentDashboard.myCourses.yourNextLesson",
                                  )}
                                </span>
                                {isLive ? (
                                  <Chip
                                    size="sm"
                                    className="h-5"
                                    style={{
                                      backgroundColor: accent,
                                      color: "#fff",
                                      fontSize: "10px",
                                    }}
                                  >
                                    {t("studentDashboard.myCourses.liveNow")}
                                  </Chip>
                                ) : countdown ? (
                                  <Chip
                                    size="sm"
                                    className="h-5"
                                    style={{
                                      backgroundColor: `${accent}20`,
                                      color: accent,
                                      fontSize: "10px",
                                    }}
                                  >
                                    {t("studentDashboard.myCourses.startsIn", {
                                      time: countdown,
                                    })}
                                  </Chip>
                                ) : null}
                              </div>
                              <p
                                className="font-semibold text-base truncate"
                                style={{ color: colors.text.primary }}
                              >
                                {nextLesson.sessionTitle ||
                                  t("studentDashboard.schedule.lesson")}
                              </p>
                              <div
                                className="flex items-center gap-2 text-sm mt-0.5 flex-wrap"
                                style={{ color: colors.text.secondary }}
                              >
                                <CalendarDots size={14} weight="duotone" />
                                <span>
                                  {formatRelativeDate(nextLesson.startTime)}
                                </span>
                                <span>·</span>
                                <span>
                                  {formatLessonTime(nextLesson.startTime)} –{" "}
                                  {formatLessonTime(nextLesson.endTime)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              size="md"
                              variant="flat"
                              onPress={() => {
                                setSelectedLesson(nextLesson);
                                onLessonDetailOpen();
                              }}
                              style={{
                                backgroundColor: colors.background.gray,
                                color: colors.text.secondary,
                              }}
                            >
                              {t("studentDashboard.myCourses.viewDetails")}
                            </Button>
                            {nextLesson.meetingStatus === "Waiting" &&
                              nextLesson.status !== "Completed" && (
                                <Button
                                  size="md"
                                  startContent={
                                    <VideoCamera
                                      weight="fill"
                                      className="w-4 h-4"
                                    />
                                  }
                                  style={{
                                    backgroundColor: accent,
                                    color: "#fff",
                                  }}
                                  onPress={() =>
                                    navigate(`/meeting/${nextLesson.id}`)
                                  }
                                >
                                  {t("studentDashboard.schedule.joinNow")}
                                </Button>
                              )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })()
              ) : (
                <Card
                  shadow="none"
                  className="border-none"
                  style={{ backgroundColor: colors.background.light }}
                >
                  <CardBody className="p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${colors.state.success}15`,
                        }}
                      >
                        <CheckCircle
                          weight="fill"
                          className="w-6 h-6"
                          style={{ color: colors.state.success }}
                        />
                      </div>
                      <div className="flex-1">
                        <p
                          className="font-semibold"
                          style={{ color: colors.text.primary }}
                        >
                          {t("studentDashboard.myCourses.allCaughtUp")}
                        </p>
                        <p
                          className="text-sm mt-0.5"
                          style={{ color: colors.text.secondary }}
                        >
                          {t("studentDashboard.myCourses.allCaughtUpDesc")}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </motion.div>
          )}

          {/* About This Course */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Card
              className="shadow-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-6">
                <h2
                  className="font-semibold text-xl mb-4"
                  style={{ color: colors.text.primary }}
                >
                  {t("courses.detail.aboutCourse")}
                </h2>
                <p
                  className="leading-relaxed"
                  style={{ color: colors.text.secondary }}
                >
                  {course.fullDescription || course.shortDescription}
                </p>
              </CardBody>
            </Card>
          </motion.div>

          {/* What You'll Learn */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Card
              className="shadow-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-6">
                <h2
                  className="font-semibold text-xl mb-4"
                  style={{ color: colors.text.primary }}
                >
                  {t("courses.detail.whatYouLearn")}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {(outcomes.length > 0
                    ? outcomes
                    : [
                        t("courses.detail.learn1"),
                        t("courses.detail.learn2"),
                        t("courses.detail.learn3"),
                        t("courses.detail.learn4"),
                      ]
                  ).map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor: colors.background.primaryLight,
                        }}
                      >
                        <Check
                          size={14}
                          weight="bold"
                          style={{ color: colors.primary.main }}
                        />
                      </div>
                      <span style={{ color: colors.text.secondary }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Your Learning Path (merged curriculum + schedule) */}
          {modulesFromLessons.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                className="shadow-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-6">
                  <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
                    <div>
                      <h2
                        className="font-semibold text-xl flex items-center gap-2"
                        style={{ color: colors.text.primary }}
                      >
                        {t("studentDashboard.myCourses.learningPath")}
                      </h2>
                      <p
                        className="text-sm mt-1"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("studentDashboard.myCourses.learningPathDesc")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {modulesFromLessons.length}{" "}
                        {t("courses.detail.modules")} · {totalSessions}{" "}
                        {t("courses.detail.sessions")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {modulesFromLessons.map((mod, idx) => {
                      const isExpanded =
                        expandedModules[mod.moduleId] ?? idx === 0;
                      const { sessions } = mod;
                      const modCompleted = sessions.filter((s) => {
                        const st = getSessionState(s.sessionId);
                        return st.key === "completed";
                      }).length;

                      return (
                        <div
                          key={mod.moduleId}
                          className="rounded-xl overflow-hidden border"
                          style={{ borderColor: colors.border.light }}
                        >
                          <button
                            type="button"
                            className="w-full flex items-center justify-between p-4 text-left"
                            style={{ backgroundColor: colors.background.gray }}
                            onClick={() => toggleModule(mod.moduleId)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: colors.primary.main,
                                  color: "#fff",
                                }}
                              >
                                <span className="text-sm font-bold">
                                  {idx + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="font-semibold text-sm truncate"
                                  style={{ color: colors.text.primary }}
                                >
                                  {mod.title}
                                </p>
                                <p
                                  className="text-xs mt-0.5"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {modCompleted}/{sessions.length}{" "}
                                  {t("courses.detail.sessions")}
                                </p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <CaretUp
                                size={18}
                                weight="bold"
                                style={{ color: colors.text.secondary }}
                              />
                            ) : (
                              <CaretDown
                                size={18}
                                weight="bold"
                                style={{ color: colors.text.secondary }}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <div
                              className="p-4 space-y-3"
                              style={{
                                backgroundColor: colors.background.gray,
                              }}
                            >
                              {mod.description && (
                                <p
                                  className="text-sm leading-relaxed"
                                  style={{ color: colors.text.secondary }}
                                >
                                  {mod.description}
                                </p>
                              )}
                              {sessions.length === 0 ? (
                                <p
                                  className="text-xs text-center py-3"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {t("courses.detail.noSessions")}
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {sessions.map((sess) => {
                                    const sessId = sess.sessionId;
                                    const state = getSessionState(sessId);
                                    const primary = getPrimaryLesson(sessId);
                                    const sessionLessons =
                                      lessonsBySession[sessId] || [];
                                    const extraLessons = sessionLessons.filter(
                                      (l) => l.id !== primary?.id,
                                    );
                                    const sessionHws = sessionLessons.flatMap(
                                      (l) => homeworksByLessonId[l.id] || [],
                                    );
                                    const isResOpen = expandedResources[sessId];
                                    const outcomesList = sess.sessionOutcomes
                                      ? sess.sessionOutcomes
                                          .split(/[;\n]+/)
                                          .map((o) => o.trim())
                                          .filter(Boolean)
                                      : [];

                                    const borderColor =
                                      state.key === "live"
                                        ? state.color
                                        : colors.border.light;

                                    return (
                                      <div
                                        key={sessId}
                                        className="rounded-xl overflow-hidden border transition-all"
                                        style={{
                                          borderColor,
                                          borderWidth:
                                            state.key === "live" ? 2 : 1,
                                          backgroundColor:
                                            colors.background.light,
                                        }}
                                      >
                                        {/* Top row: status icon + title + state chip */}
                                        <div className="flex items-start gap-3 p-4">
                                          <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{
                                              backgroundColor:
                                                state.key === "completed"
                                                  ? `${state.color}15`
                                                  : state.key === "live"
                                                    ? `${state.color}15`
                                                    : state.key === "upcoming"
                                                      ? `${state.color}15`
                                                      : colors.background.gray,
                                            }}
                                          >
                                            {state.key === "completed" ? (
                                              <CheckCircle
                                                weight="fill"
                                                className="w-5 h-5"
                                                style={{ color: state.color }}
                                              />
                                            ) : state.key === "live" ? (
                                              <Lightning
                                                weight="fill"
                                                className="w-5 h-5"
                                                style={{ color: state.color }}
                                              />
                                            ) : state.key === "upcoming" ? (
                                              <ClockCountdown
                                                weight="duotone"
                                                className="w-5 h-5"
                                                style={{ color: state.color }}
                                              />
                                            ) : (
                                              <Circle
                                                weight="regular"
                                                className="w-5 h-5"
                                                style={{
                                                  color: colors.text.tertiary,
                                                }}
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
                                              <Chip
                                                size="sm"
                                                className="h-5"
                                                style={{
                                                  backgroundColor: `${state.color}20`,
                                                  color: state.color,
                                                  fontSize: "10px",
                                                }}
                                              >
                                                {state.label}
                                              </Chip>
                                            </div>

                                            {sess.sessionDescription && (
                                              <p
                                                className="text-xs mt-1 leading-relaxed"
                                                style={{
                                                  color: colors.text.secondary,
                                                }}
                                              >
                                                {sess.sessionDescription}
                                              </p>
                                            )}

                                            {/* Primary lesson info (schedule + join) */}
                                            {primary && (
                                              <div
                                                className="mt-3 flex items-center justify-between gap-2 flex-wrap p-2.5 rounded-lg"
                                                style={{
                                                  backgroundColor:
                                                    colors.background.gray,
                                                }}
                                              >
                                                <div className="flex items-center gap-2 text-xs flex-wrap">
                                                  <CalendarDots
                                                    size={13}
                                                    weight="duotone"
                                                    style={{
                                                      color: state.color,
                                                    }}
                                                  />
                                                  <span
                                                    className="font-medium"
                                                    style={{
                                                      color:
                                                        colors.text.primary,
                                                    }}
                                                  >
                                                    {formatRelativeDate(
                                                      primary.startTime,
                                                    )}
                                                  </span>
                                                  <span
                                                    style={{
                                                      color:
                                                        colors.text.tertiary,
                                                    }}
                                                  >
                                                    ·
                                                  </span>
                                                  <span
                                                    style={{
                                                      color:
                                                        colors.text.secondary,
                                                    }}
                                                  >
                                                    {formatLessonTime(
                                                      primary.startTime,
                                                    )}{" "}
                                                    –{" "}
                                                    {formatLessonTime(
                                                      primary.endTime,
                                                    )}
                                                  </span>
                                                  {state.key === "upcoming" &&
                                                    formatTimeUntil(
                                                      primary.startTime,
                                                    ) && (
                                                      <Chip
                                                        size="sm"
                                                        className="h-4 ml-1"
                                                        style={{
                                                          backgroundColor:
                                                            colors.background
                                                              .primaryLight,
                                                          color:
                                                            colors.primary.main,
                                                          fontSize: "10px",
                                                        }}
                                                      >
                                                        {t(
                                                          "studentDashboard.myCourses.startsIn",
                                                          {
                                                            time: formatTimeUntil(
                                                              primary.startTime,
                                                            ),
                                                          },
                                                        )}
                                                      </Chip>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  {primary.meetingStatus ===
                                                    "Waiting" &&
                                                    primary.status !==
                                                      "Completed" && (
                                                      <Button
                                                        size="sm"
                                                        startContent={
                                                          <VideoCamera
                                                            weight="fill"
                                                            className="w-3.5 h-3.5"
                                                          />
                                                        }
                                                        style={{
                                                          backgroundColor:
                                                            state.color,
                                                          color: "#fff",
                                                        }}
                                                        onPress={() =>
                                                          navigate(
                                                            `/meeting/${primary.id}`,
                                                          )
                                                        }
                                                      >
                                                        {t(
                                                          "studentDashboard.schedule.joinNow",
                                                        )}
                                                      </Button>
                                                    )}
                                                  <LessonActions
                                                    lesson={primary}
                                                    onOpenDetail={() => {
                                                      setSelectedLesson(
                                                        primary,
                                                      );
                                                      onLessonDetailOpen();
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {/* Extra lessons (reschedules / additional) */}
                                            {extraLessons.length > 0 && (
                                              <div className="mt-2 space-y-1.5">
                                                {extraLessons.map((l) => {
                                                  const info =
                                                    l.status === "Completed"
                                                      ? {
                                                          color:
                                                            colors.state
                                                              .success,
                                                          label: t(
                                                            "studentDashboard.myCourses.sessionCompleted",
                                                          ),
                                                        }
                                                      : l.status === "Cancelled"
                                                        ? {
                                                            color:
                                                              colors.state
                                                                .error,
                                                            label: t(
                                                              "studentDashboard.schedule.cancelled",
                                                            ),
                                                          }
                                                        : {
                                                            color:
                                                              colors.text
                                                                .tertiary,
                                                            label: t(
                                                              "studentDashboard.myCourses.sessionUpcoming",
                                                            ),
                                                          };
                                                  return (
                                                    <div
                                                      key={l.id}
                                                      className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md"
                                                      style={{
                                                        backgroundColor:
                                                          colors.background
                                                            .gray,
                                                      }}
                                                    >
                                                      <CalendarDots
                                                        size={12}
                                                        weight="duotone"
                                                        style={{
                                                          color:
                                                            colors.text
                                                              .tertiary,
                                                        }}
                                                      />
                                                      <span
                                                        style={{
                                                          color:
                                                            colors.text
                                                              .secondary,
                                                        }}
                                                      >
                                                        {formatLessonDate(
                                                          l.startTime,
                                                        )}
                                                        {" · "}
                                                        {formatLessonTime(
                                                          l.startTime,
                                                        )}
                                                      </span>
                                                      <Chip
                                                        size="sm"
                                                        className="h-4 ml-auto"
                                                        style={{
                                                          backgroundColor: `${info.color}20`,
                                                          color: info.color,
                                                          fontSize: "9px",
                                                        }}
                                                      >
                                                        {info.label}
                                                      </Chip>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {/* Outcomes */}
                                            {outcomesList.length > 0 && (
                                              <div className="mt-3 flex flex-col gap-1">
                                                {outcomesList.map(
                                                  (outcome, i) => (
                                                    <div
                                                      key={i}
                                                      className="flex items-start gap-1.5"
                                                    >
                                                      <ArrowRightIcon
                                                        size={11}
                                                        weight="fill"
                                                        className="flex-shrink-0 mt-0.5"
                                                        style={{
                                                          color:
                                                            colors.state
                                                              .success,
                                                        }}
                                                      />
                                                      <span
                                                        className="text-xs"
                                                        style={{
                                                          color:
                                                            colors.text
                                                              .secondary,
                                                        }}
                                                      >
                                                        {outcome}
                                                      </span>
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            )}

                                            {/* Homework for this session */}
                                            {sessionHws.length > 0 && (
                                              <div className="mt-3 space-y-1.5">
                                                <p
                                                  className="text-[10px] uppercase tracking-wide font-semibold flex items-center gap-1.5"
                                                  style={{
                                                    color: colors.text.tertiary,
                                                  }}
                                                >
                                                  <NotePencil
                                                    weight="duotone"
                                                    className="w-3.5 h-3.5"
                                                    style={{
                                                      color:
                                                        colors.primary.main,
                                                    }}
                                                  />
                                                  {t(
                                                    "studentDashboard.homework.title",
                                                  )}
                                                </p>
                                                {sessionHws.map((hw) => {
                                                  const statusColor =
                                                    hw.status === "Scored"
                                                      ? colors.state.success
                                                      : hw.status ===
                                                          "Submitted"
                                                        ? colors.primary.main
                                                        : hw.status ===
                                                            "Assigned"
                                                          ? colors.state.warning
                                                          : colors.text
                                                              .tertiary;
                                                  const statusLabel =
                                                    hw.status === "Scored"
                                                      ? t(
                                                          "studentDashboard.homework.status.scored",
                                                        )
                                                      : hw.status ===
                                                          "Submitted"
                                                        ? t(
                                                            "studentDashboard.homework.status.submitted",
                                                          )
                                                        : hw.status ===
                                                            "Assigned"
                                                          ? t(
                                                              "studentDashboard.homework.status.assigned",
                                                            )
                                                          : hw.status;
                                                  const isOverdue =
                                                    hw.status === "Assigned" &&
                                                    hw.dueAt &&
                                                    new Date(hw.dueAt) <
                                                      new Date();
                                                  return (
                                                    <div
                                                      key={hw.id}
                                                      className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                      style={{
                                                        backgroundColor: `${statusColor}10`,
                                                        border: `1px solid ${statusColor}25`,
                                                      }}
                                                      role="button"
                                                      tabIndex={0}
                                                      onClick={() =>
                                                        openHwDetail(hw)
                                                      }
                                                      onKeyDown={(e) =>
                                                        e.key === "Enter" &&
                                                        openHwDetail(hw)
                                                      }
                                                    >
                                                      <NotePencil
                                                        weight="duotone"
                                                        className="w-4 h-4 flex-shrink-0"
                                                        style={{
                                                          color: statusColor,
                                                        }}
                                                      />
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                          <Chip
                                                            size="sm"
                                                            className="h-4"
                                                            style={{
                                                              backgroundColor: `${statusColor}25`,
                                                              color:
                                                                statusColor,
                                                              fontSize: "9px",
                                                            }}
                                                          >
                                                            {statusLabel}
                                                          </Chip>
                                                          {isOverdue && (
                                                            <Chip
                                                              size="sm"
                                                              className="h-4"
                                                              style={{
                                                                backgroundColor: `${colors.state.error}20`,
                                                                color:
                                                                  colors.state
                                                                    .error,
                                                                fontSize: "9px",
                                                              }}
                                                              startContent={
                                                                <Warning
                                                                  weight="fill"
                                                                  className="w-2.5 h-2.5 ml-0.5"
                                                                />
                                                              }
                                                            >
                                                              {t(
                                                                "studentDashboard.homework.overdue",
                                                              )}
                                                            </Chip>
                                                          )}
                                                        </div>
                                                        <p
                                                          className="text-xs font-medium truncate"
                                                          style={{
                                                            color:
                                                              colors.text
                                                                .primary,
                                                          }}
                                                        >
                                                          {hw.title ||
                                                            hw.description?.slice(
                                                              0,
                                                              60,
                                                            )}
                                                        </p>
                                                        <div
                                                          className="flex items-center gap-2 text-[10px] mt-0.5"
                                                          style={{
                                                            color:
                                                              colors.text
                                                                .tertiary,
                                                          }}
                                                        >
                                                          {hw.dueAt ? (
                                                            <span className="flex items-center gap-1">
                                                              <Clock className="w-3 h-3" />
                                                              {formatLessonDate(
                                                                hw.dueAt,
                                                              )}
                                                            </span>
                                                          ) : (
                                                            <span>
                                                              {t(
                                                                "studentDashboard.homework.noDueDate",
                                                              )}
                                                            </span>
                                                          )}
                                                          <span className="flex items-center gap-1">
                                                            <Target className="w-3 h-3" />
                                                            {t(
                                                              "studentDashboard.homework.maxScore",
                                                            )}
                                                            :{" "}
                                                            {hw.maxScore ?? "—"}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      {hw.status ===
                                                      "Scored" ? (
                                                        <span
                                                          className="text-xs font-bold whitespace-nowrap"
                                                          style={{
                                                            color:
                                                              colors.state
                                                                .success,
                                                          }}
                                                        >
                                                          {hw.score}/
                                                          {hw.maxScore}
                                                        </span>
                                                      ) : hw.status ===
                                                        "Assigned" ? (
                                                        <span
                                                          className="text-xs font-semibold whitespace-nowrap"
                                                          style={{
                                                            color:
                                                              colors.primary
                                                                .main,
                                                          }}
                                                        >
                                                          {t(
                                                            "studentDashboard.homework.submit",
                                                          )}
                                                        </span>
                                                      ) : null}
                                                      <ArrowSquareOut
                                                        className="w-3.5 h-3.5 flex-shrink-0"
                                                        style={{
                                                          color:
                                                            colors.text
                                                              .tertiary,
                                                        }}
                                                      />
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {/* Resources toggle */}
                                            {sessId && (
                                              <div className="mt-3">
                                                <button
                                                  type="button"
                                                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors font-medium"
                                                  style={{
                                                    color: colors.primary.main,
                                                    backgroundColor:
                                                      colors.background
                                                        .primaryLight,
                                                  }}
                                                  onClick={() =>
                                                    toggleResources(sessId)
                                                  }
                                                >
                                                  <FileText
                                                    size={13}
                                                    weight="fill"
                                                  />
                                                  {t(
                                                    "courses.detail.resources.label",
                                                  )}
                                                  {isResOpen ? (
                                                    <CaretUp
                                                      size={11}
                                                      weight="bold"
                                                    />
                                                  ) : (
                                                    <CaretDown
                                                      size={11}
                                                      weight="bold"
                                                    />
                                                  )}
                                                </button>
                                                {isResOpen && (
                                                  <ResourceList
                                                    sessionId={sessId}
                                                  />
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* About the Instructor */}
          {tutorInfo && (
            <motion.div
              ref={instructorRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                className="shadow-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-6">
                  <h2
                    className="font-semibold text-xl mb-4"
                    style={{ color: colors.text.primary }}
                  >
                    {t("courses.detail.aboutInstructor")}
                  </h2>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar
                      src={tutorInfo.avatar}
                      name={`${tutorInfo.user?.firstName} ${tutorInfo.user?.lastName}`}
                      size="lg"
                      className="flex-shrink-0 cursor-pointer"
                      onClick={() =>
                        navigate(`/tutor-profile/${course?.tutorId}`)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        className="font-semibold text-lg hover:underline text-left"
                        style={{ color: colors.primary.main }}
                        onClick={() =>
                          navigate(`/tutor-profile/${course?.tutorId}`)
                        }
                      >
                        {tutorInfo.user?.firstName} {tutorInfo.user?.lastName}
                      </button>
                      {tutorInfo.headline && (
                        <p
                          className="text-sm mt-0.5"
                          style={{ color: colors.text.secondary }}
                        >
                          {tutorInfo.headline}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star
                        size={18}
                        weight="fill"
                        style={{ color: "#f59e0b" }}
                      />
                      <span
                        className="font-semibold text-sm"
                        style={{ color: colors.text.primary }}
                      >
                        {tutorInfo.ratingAverage?.toFixed(1) || "0.0"}
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: colors.text.tertiary }}
                      >
                        ({tutorInfo.ratingCount || 0}{" "}
                        {t("courses.detail.reviews")})
                      </span>
                    </div>
                    {tutorInfo.monthExperience > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock
                          size={18}
                          style={{ color: colors.primary.main }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {tutorInfo.monthExperience}{" "}
                          {t("courses.detail.monthsExperience")}
                        </span>
                      </div>
                    )}
                  </div>
                  {tutorInfo.bio && (
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: colors.text.secondary }}
                    >
                      {tutorInfo.bio}
                    </p>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* Course Review */}
          {enrollment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                className="shadow-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-6">
                  <h2
                    className="font-semibold text-xl mb-4 flex items-center gap-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("studentDashboard.myCourses.courseReview")}
                  </h2>

                  {!canReview ? (
                    <div
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{
                        backgroundColor: `${colors.state.warning}10`,
                        border: `1px solid ${colors.state.warning}30`,
                      }}
                    >
                      <Star
                        weight="duotone"
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: colors.state.warning }}
                      />
                      <p
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("studentDashboard.myCourses.reviewProgressRequired")}
                      </p>
                    </div>
                  ) : reviewLoading ? (
                    <div className="flex justify-center py-6">
                      <Spinner size="md" />
                    </div>
                  ) : existingReview && !isEditingReview ? (
                    <div className="space-y-4">
                      <div
                        className="p-4 rounded-xl"
                        style={{
                          backgroundColor: colors.background.gray,
                          border: `1px solid ${colors.border.light}`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={20}
                                weight="fill"
                                style={{
                                  color:
                                    star <= existingReview.rating
                                      ? "#F59E0B"
                                      : "rgba(0,0,0,0.1)",
                                }}
                              />
                            ))}
                            <span
                              className="ml-2 text-sm font-semibold"
                              style={{ color: colors.text.primary }}
                            >
                              {existingReview.rating}/5
                            </span>
                          </div>
                          <span
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            {new Date(
                              existingReview.updatedAt ||
                                existingReview.createdAt,
                            ).toLocaleDateString(dateLocale, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        {existingReview.comment && (
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: colors.text.secondary }}
                          >
                            {existingReview.comment}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={
                            <PencilSimple
                              weight="bold"
                              className="w-3.5 h-3.5"
                            />
                          }
                          style={{
                            backgroundColor: `${colors.primary.main}15`,
                            color: colors.primary.main,
                          }}
                          onPress={() => setIsEditingReview(true)}
                        >
                          {t("studentDashboard.myCourses.editReview")}
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={
                            <Trash weight="bold" className="w-3.5 h-3.5" />
                          }
                          style={{
                            backgroundColor: `${colors.state.error}15`,
                            color: colors.state.error,
                          }}
                          onPress={onDeleteConfirmOpen}
                        >
                          {t("studentDashboard.myCourses.deleteReview")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p
                          className="text-sm font-medium mb-2"
                          style={{ color: colors.text.primary }}
                        >
                          {t("studentDashboard.myCourses.yourRating")}
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className="transition-transform hover:scale-110"
                              onMouseEnter={() => setReviewHover(star)}
                              onMouseLeave={() => setReviewHover(0)}
                              onClick={() => setReviewRating(star)}
                            >
                              <Star
                                size={28}
                                weight="fill"
                                style={{
                                  color:
                                    star <= (reviewHover || reviewRating)
                                      ? "#F59E0B"
                                      : "rgba(0,0,0,0.15)",
                                  cursor: "pointer",
                                }}
                              />
                            </button>
                          ))}
                          {reviewRating > 0 && (
                            <span
                              className="ml-2 text-sm font-semibold"
                              style={{ color: colors.text.primary }}
                            >
                              {reviewRating}/5
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium mb-2"
                          style={{ color: colors.text.primary }}
                        >
                          {t("studentDashboard.myCourses.yourReview")}
                        </p>
                        <Textarea
                          placeholder={t(
                            "studentDashboard.myCourses.reviewPlaceholder",
                          )}
                          value={reviewComment}
                          onValueChange={setReviewComment}
                          minRows={3}
                          maxRows={6}
                          size="lg"
                          variant="flat"
                          classNames={textareaClassNames}
                          style={{ backgroundColor: colors.background.gray }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          isDisabled={!reviewRating}
                          isLoading={reviewSubmitting}
                          style={{
                            backgroundColor: colors.primary.main,
                            color: colors.text.white,
                          }}
                          onPress={handleSubmitReview}
                        >
                          {existingReview
                            ? t("studentDashboard.myCourses.updateReview")
                            : t("studentDashboard.myCourses.submitReview")}
                        </Button>
                        {isEditingReview && (
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => {
                              setIsEditingReview(false);
                              setReviewRating(existingReview.rating);
                              setReviewComment(existingReview.comment || "");
                            }}
                          >
                            {t("studentDashboard.myCourses.cancel")}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column — Sticky Sidebar */}
        <div className="lg:col-span-1 lg:-mt-64">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="lg:sticky lg:top-40 space-y-4"
          >
            <Card
              className="shadow-lg overflow-hidden"
              style={{ backgroundColor: colors.background.light }}
            >
              <div className="relative w-full h-48 overflow-hidden">
                <img
                  src={
                    course.thumbnailUrl ||
                    "https://placehold.co/400x200?text=No+Image"
                  }
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                {course.demoVideoUrl && (
                  <button
                    onClick={() => setVideoOpen(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <Play
                        size={24}
                        weight="fill"
                        style={{ color: colors.primary.main }}
                      />
                    </div>
                  </button>
                )}
              </div>

              <CardBody className="p-6 space-y-5">
                <Chip
                  size="lg"
                  className="w-full flex justify-center font-semibold"
                  style={{
                    backgroundColor: `${colors.state.success}20`,
                    color: colors.state.success,
                  }}
                >
                  {t("studentDashboard.myCourses.enrolled")}
                </Chip>

                {/* Course Progress */}
                {enrollment && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {t("courses.detail.progress")}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: colors.primary.main }}
                      >
                        {progressPct}%
                      </span>
                    </div>
                    <Progress
                      value={progressPct}
                      size="md"
                      color="primary"
                      className="max-w-full"
                    />
                    <p
                      className="text-xs text-center"
                      style={{ color: colors.text.secondary }}
                    >
                      {completedSessions}/{totalSessionsFromEnrollment}{" "}
                      {t("courses.detail.sessionsCompleted")}
                    </p>
                  </div>
                )}

                <Divider />

                {/* Meta */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className="flex items-center gap-2"
                      style={{ color: colors.text.secondary }}
                    >
                      <Clock size={16} weight="duotone" />
                      {t("courses.detail.totalDuration")}
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {formatDuration(course.estimatedTime) || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className="flex items-center gap-2"
                      style={{ color: colors.text.secondary }}
                    >
                      <BookOpen size={16} weight="duotone" />
                      {t("courses.detail.level")}
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {course.level}
                    </span>
                  </div>
                  {duration && (
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className="flex items-center gap-2"
                        style={{ color: colors.text.secondary }}
                      >
                        <Clock size={16} weight="duotone" />
                        {t("courses.detail.timePerLesson")}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {duration}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className="flex items-center gap-2"
                      style={{ color: colors.text.secondary }}
                    >
                      <Certificate size={16} weight="duotone" />
                      {t("courses.detail.certificate")}
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {course.isCertificate
                        ? t("courses.detail.yes")
                        : t("courses.detail.no")}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Video / Recording / Summary / Quiz / Lesson Detail modals */}
      <VideoModal
        isOpen={videoOpen}
        onOpenChange={setVideoOpen}
        videoUrl={course?.demoVideoUrl}
      />

      <VideoModal
        isOpen={isRecordingOpen}
        onOpenChange={(open) => {
          if (!open) onRecordingClose();
        }}
        videoUrl={recordingLesson?.lessonRecord?.recordUrl}
      />

      <LessonSummaryModal
        isOpen={isSummaryOpen}
        onClose={onSummaryClose}
        summarizeText={summaryLesson?.lessonScript?.summarizeText}
      />

      <LessonQuizModal
        isOpen={isQuizOpen}
        onClose={onQuizClose}
        lessonScriptId={quizLesson?.lessonScript?.id}
      />

      <LessonDetailModal
        isOpen={isLessonDetailOpen}
        onClose={onLessonDetailClose}
        lesson={selectedLesson}
        role="student"
        onRefundRequest={(lesson) => {
          handleOpenRefundRequest(lesson);
        }}
      />

      {/* Lesson History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={onHistoryClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader
            className="flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <CalendarDots
              weight="duotone"
              className="w-5 h-5"
              style={{ color: colors.primary.main }}
            />
            {t("studentDashboard.myCourses.lessonHistory")}
          </ModalHeader>
          <ModalBody className="pb-4">
            {lessonsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : pastLessons.length === 0 ? (
              <p
                className="text-sm text-center py-8"
                style={{ color: colors.text.tertiary }}
              >
                {t("studentDashboard.myCourses.noHistoryYet")}
              </p>
            ) : (
              <div className="space-y-2">
                {pastLessons.map((lesson) => {
                  const info =
                    lesson.status === "Completed"
                      ? {
                          color: colors.state.success,
                          label: t(
                            "studentDashboard.myCourses.sessionCompleted",
                          ),
                        }
                      : lesson.status === "Cancelled"
                        ? {
                            color: colors.state.error,
                            label: t("studentDashboard.schedule.cancelled"),
                          }
                        : {
                            color: colors.text.tertiary,
                            label: lesson.status,
                          };
                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: colors.background.gray }}
                      onClick={() => {
                        setSelectedLesson(lesson);
                        onLessonDetailOpen();
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: colors.background.light,
                          }}
                        >
                          <span
                            className="text-xs font-bold"
                            style={{ color: colors.text.secondary }}
                          >
                            {new Date(lesson.startTime).getDate()}
                          </span>
                          <span
                            className="text-xs"
                            style={{
                              color: colors.text.tertiary,
                              fontSize: "9px",
                            }}
                          >
                            {new Date(lesson.startTime).toLocaleDateString(
                              dateLocale,
                              { month: "short" },
                            )}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-medium text-sm truncate"
                            style={{ color: colors.text.primary }}
                          >
                            {lesson.sessionTitle ||
                              t("studentDashboard.schedule.lesson")}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-xs"
                              style={{ color: colors.text.tertiary }}
                            >
                              {formatLessonDate(lesson.startTime)} ·{" "}
                              {formatLessonTime(lesson.startTime)}
                            </span>
                            <Chip
                              size="sm"
                              className="h-4"
                              style={{
                                backgroundColor: `${info.color}20`,
                                color: info.color,
                                fontSize: "10px",
                              }}
                            >
                              {info.label}
                            </Chip>
                          </div>
                        </div>
                      </div>
                      <LessonActions lesson={lesson} size="sm" />
                    </div>
                  );
                })}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Review Confirmation Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={onDeleteConfirmClose}
        size="sm"
      >
        <ModalContent>
          <ModalHeader
            className="text-base"
            style={{ color: colors.text.primary }}
          >
            {t("studentDashboard.myCourses.deleteReview")}
          </ModalHeader>
          <ModalBody>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              {t("studentDashboard.myCourses.confirmDeleteReview")}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="flat" onPress={onDeleteConfirmClose}>
              {t("studentDashboard.myCourses.cancel")}
            </Button>
            <Button
              size="sm"
              isLoading={reviewSubmitting}
              style={{
                backgroundColor: colors.state.error,
                color: "#fff",
              }}
              onPress={handleDeleteReview}
            >
              {t("studentDashboard.myCourses.deleteReview")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ==================== HW DETAIL MODAL ==================== */}
      <StudentHomeworkDetailModal
        isOpen={isHwDetailOpen}
        onClose={onHwDetailClose}
        hw={selectedHwModal}
        onSubmitClick={(hw) => openHwSubmit(hw)}
        onTutorClick={(hw) => navigate(`/tutor-profile/${hw.tutorId}`)}
      />

      {/* ==================== HW SUBMIT MODAL ==================== */}
      <StudentHomeworkSubmitModal
        isOpen={isHwSubmitOpen}
        onClose={onHwSubmitClose}
        hw={selectedHwModal}
        onSubmitSuccess={handleHwSubmitSuccess}
      />

      {/* ==================== REFUND REQUEST MODAL ==================== */}
      <StudentRefundRequestModal
        isOpen={refundModalOpen}
        lesson={refundLesson}
        note={refundNote}
        onNoteChange={setRefundNote}
        isSubmitting={submittingRefund}
        onClose={() => {
          if (!submittingRefund) {
            setRefundModalOpen(false);
            setRefundNote("");
            setRefundLesson(null);
          }
        }}
        onSubmit={handleSubmitRefundTicket}
      />
    </div>
  );
};

export default StudentMyCourseDetail;
