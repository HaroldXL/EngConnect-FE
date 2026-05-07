import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Alert,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Spinner,
  Tabs,
  Tab,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { useTheme } from "../../../contexts/ThemeContext";
import CourseDetailSkeleton from "../../../components/CourseDetailSkeleton/CourseDetailSkeleton";
import VideoModal from "../../../components/VideoModal/VideoModal";
import LessonDetailModal from "../../../components/LessonDetailModal/LessonDetailModal";
import {
  Star,
  Clock,
  Users,
  BookOpen,
  Check,
  Certificate,
  ArrowLeft,
  PencilSimple,
  CaretDown,
  CaretUp,
  ListNumbers,
  Play,
  WarningCircle,
  ArrowRight,
  FileText,
  FilePdf,
  VideoCamera,
  Link,
  Trash,
  ArrowSquareOut,
  Target,
  ArrowRightIcon,
  Plus,
  ChatTeardropText,
} from "@phosphor-icons/react";
import { coursesApi, tutorApi, studentApi } from "../../../api";
import { selectUser } from "../../../store";
import useInputStyles from "../../../hooks/useInputStyles";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const buildResourceUrl = (url) => {
  if (!url) return "#";
  const doubled = CDN_BASE + CDN_BASE;
  if (url.startsWith(doubled)) return CDN_BASE + url.slice(doubled.length);
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

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

const formatPrice = (price, currency) => {
  if (currency === "VND" || !currency) {
    return price?.toLocaleString("vi-VN") + "₫";
  }
  return "$" + price;
};

const TutorCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const user = useSelector(selectUser);
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const { theme } = useTheme();
  const { inputClassNames, selectClassNames } = useInputStyles();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [tutorInfo, setTutorInfo] = useState(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const instructorRef = useRef(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [reviewStudents, setReviewStudents] = useState({});
  const REVIEWS_PAGE_SIZE = 5;

  // Resource state
  const [expandedSessions, setExpandedSessions] = useState({});
  const [sessionResources, setSessionResources] = useState({});
  const [loadingResources, setLoadingResources] = useState({});
  const [editResourceModal, setEditResourceModal] = useState(false);
  const [editResourceData, setEditResourceData] = useState(null);
  const [savingResource, setSavingResource] = useState(false);
  const [removeResourceId, setRemoveResourceId] = useState(null); // { sessionId, resourceId }
  const [removingResource, setRemovingResource] = useState(false);
  const [addResourceModal, setAddResourceModal] = useState(false);
  const [addResourceSessionId, setAddResourceSessionId] = useState(null);
  const [addResourceData, setAddResourceData] = useState({
    title: "",
    resourceType: "",
    file: null,
  });
  const [addingResource, setAddingResource] = useState(false);
  const [addResourceMode, setAddResourceMode] = useState("new"); // "new" | "reuse"
  const [reuseResources, setReuseResources] = useState([]);
  const [reuseResourcesLoading, setReuseResourcesLoading] = useState(false);
  const [reuseSearch, setReuseSearch] = useState("");
  const [selectedReuseId, setSelectedReuseId] = useState(null);

  // Inactive course state
  const [inactivingCourse, setInactivingCourse] = useState(false);
  const [inactiveConfirmOpen, setInactiveConfirmOpen] = useState(false);

  // Schedule state
  const [courseLessons, setCourseLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await coursesApi.getCourseById(id);
        if (
          res.data?.tutorId &&
          user?.tutorId &&
          res.data.tutorId !== user.tutorId
        ) {
          navigate("/tutor/my-courses", { replace: true });
          return;
        }
        setCourse(res.data);
        if (res.data?.tutorId) {
          try {
            const tutorRes = await tutorApi.getTutorById(res.data.tutorId);
            setTutorInfo(tutorRes.data);
          } catch (tutorErr) {
            console.error("Failed to fetch tutor:", tutorErr);
          }
        }
        // All modules start collapsed
      } catch (err) {
        console.error("Failed to fetch course:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  useEffect(() => {
    const fetchCourseLessons = async () => {
      try {
        setLessonsLoading(true);
        const res = await studentApi.getLessons({
          CourseId: id,
          "page-size": 200,
        });
        setCourseLessons(res?.data?.items || []);
      } catch {
        setCourseLessons([]);
      } finally {
        setLessonsLoading(false);
      }
    };
    if (id) fetchCourseLessons();
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const res = await coursesApi.getCourseReviews({
          CourseId: id,
          "page-index": 1,
          "page-size": REVIEWS_PAGE_SIZE,
        });
        const items = res?.data?.items || [];
        setReviews(items);
        const total =
          res?.data?.totalCount ?? res?.data?.totalItems ?? items.length;
        setReviewsHasMore(total > REVIEWS_PAGE_SIZE);
        setReviewsPage(1);
        // Fetch student info for each review
        const studentIds = [
          ...new Set(
            items
              .filter((r) => !r.isAnonymous && r.studentId)
              .map((r) => r.studentId),
          ),
        ];
        const studentMap = {};
        await Promise.all(
          studentIds.map(async (sid) => {
            try {
              const sRes = await studentApi.getStudentById(sid);
              studentMap[sid] = sRes?.data || sRes;
            } catch {
              /* ignore */
            }
          }),
        );
        setReviewStudents(studentMap);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    if (id) fetchReviews();
  }, [id]);

  const handleLoadMoreReviews = async () => {
    try {
      setReviewsLoadingMore(true);
      const nextPage = reviewsPage + 1;
      const res = await coursesApi.getCourseReviews({
        CourseId: id,
        "page-index": nextPage,
        "page-size": REVIEWS_PAGE_SIZE,
      });
      const items = res?.data?.items || [];
      const total =
        res?.data?.totalCount ??
        res?.data?.totalItems ??
        reviews.length + items.length;
      setReviews((prev) => [...prev, ...items]);
      setReviewsHasMore(reviews.length + items.length < total);
      setReviewsPage(nextPage);
      // Fetch student info for new reviews
      const newStudentIds = [
        ...new Set(
          items
            .filter(
              (r) =>
                !r.isAnonymous && r.studentId && !reviewStudents[r.studentId],
            )
            .map((r) => r.studentId),
        ),
      ];
      if (newStudentIds.length > 0) {
        const newMap = { ...reviewStudents };
        await Promise.all(
          newStudentIds.map(async (sid) => {
            try {
              const sRes = await studentApi.getStudentById(sid);
              newMap[sid] = sRes?.data || sRes;
            } catch {
              /* ignore */
            }
          }),
        );
        setReviewStudents(newMap);
      }
    } catch {
      // ignore
    } finally {
      setReviewsLoadingMore(false);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const toggleSessionResources = async (sessionId) => {
    if (expandedSessions[sessionId]) {
      setExpandedSessions((prev) => ({ ...prev, [sessionId]: false }));
      return;
    }
    setExpandedSessions((prev) => ({ ...prev, [sessionId]: true }));
    if (!sessionResources[sessionId]) {
      setLoadingResources((prev) => ({ ...prev, [sessionId]: true }));
      try {
        const res = await coursesApi.getAllCourseResources({
          CourseSessionId: sessionId,
          "page-size": 100,
        });
        if (res.isSuccess) {
          setSessionResources((prev) => ({
            ...prev,
            [sessionId]: res.data.items || [],
          }));
        }
      } catch {
        setSessionResources((prev) => ({ ...prev, [sessionId]: [] }));
      } finally {
        setLoadingResources((prev) => ({ ...prev, [sessionId]: false }));
      }
    }
  };

  const openEditResource = (resource) => {
    setEditResourceData({
      id: resource.id,
      title: resource.title || "",
      resourceType: resource.resourceType || "",
      url: resource.url || "",
      status: resource.status || "",
    });
    setEditResourceModal(true);
  };

  const handleSaveResource = async () => {
    if (!editResourceData) return;
    setSavingResource(true);
    try {
      const res = await coursesApi.updateCourseResource(editResourceData.id, {
        title: editResourceData.title,
        resourceType: editResourceData.resourceType,
        url: editResourceData.url,
        status: editResourceData.status || null,
      });
      if (res.isSuccess) {
        setSessionResources((prev) => {
          const next = { ...prev };
          for (const key in next) {
            next[key] = next[key].map((r) =>
              r.id === editResourceData.id ? { ...r, ...editResourceData } : r,
            );
          }
          return next;
        });
        setEditResourceModal(false);
      }
    } catch {
      // silent
    } finally {
      setSavingResource(false);
    }
  };

  const handleRemoveResource = async () => {
    if (!removeResourceId) return;
    setRemovingResource(true);
    try {
      await coursesApi.removeSessionResource(
        removeResourceId.sessionId,
        removeResourceId.resourceId,
      );
      setSessionResources((prev) => {
        const next = { ...prev };
        for (const key in next) {
          next[key] = next[key].filter(
            (r) => r.id !== removeResourceId.resourceId,
          );
        }
        return next;
      });
      setRemoveResourceId(null);
    } catch {
      // silent
    } finally {
      setRemovingResource(false);
    }
  };

  const openAddResource = (sessionId) => {
    setAddResourceSessionId(sessionId);
    setAddResourceData({ title: "", resourceType: "", file: null });
    setAddResourceMode("new");
    setReuseResources([]);
    setReuseSearch("");
    setSelectedReuseId(null);
    setAddResourceModal(true);
  };

  const loadReuseResources = async (sessionId) => {
    setReuseResourcesLoading(true);
    try {
      const res = await coursesApi.getCourseResourcesByTutor({
        CourseSessionId: sessionId,
        "page-size": 100,
      });
      setReuseResources(res?.data?.items || []);
    } catch {
      setReuseResources([]);
    } finally {
      setReuseResourcesLoading(false);
    }
  };

  const handleAddReuse = async () => {
    if (!selectedReuseId || !addResourceSessionId) return;
    setAddingResource(true);
    try {
      const res = await coursesApi.addSessionResource({
        courseSessionId: addResourceSessionId,
        courseResources: [{ courseResourceId: selectedReuseId }],
      });
      if (res.isSuccess) {
        const refreshed = await coursesApi.getAllCourseResources({
          CourseSessionId: addResourceSessionId,
          "page-size": 100,
        });
        if (refreshed.isSuccess) {
          setSessionResources((prev) => ({
            ...prev,
            [addResourceSessionId]: refreshed.data.items || [],
          }));
        }
        setAddResourceModal(false);
      }
    } catch {
      // silent
    } finally {
      setAddingResource(false);
    }
  };

  const handleAddResource = async () => {
    if (!addResourceSessionId || !addResourceData.title.trim()) return;
    setAddingResource(true);
    try {
      const payload = {
        CourseSessionId: addResourceSessionId,
        Title: addResourceData.title,
        ResourceType: addResourceData.resourceType,
      };
      if (addResourceData.file) {
        payload.ResourceFile = addResourceData.file;
        payload.ResourceFileName = addResourceData.file.name;
      }
      const res = await coursesApi.createCourseResource(payload);
      if (res.isSuccess) {
        setSessionResources((prev) => ({
          ...prev,
          [addResourceSessionId]: [
            ...(prev[addResourceSessionId] || []),
            res.data,
          ],
        }));
        setAddResourceModal(false);
      }
    } catch {
      // silent
    } finally {
      setAddingResource(false);
    }
  };

  const handleInactiveCourse = async () => {
    setInactivingCourse(true);
    try {
      await coursesApi.inactiveCourse(id);
      const res = await coursesApi.getCourseById(id);
      setCourse(res.data);
      setInactiveConfirmOpen(false);
    } catch (err) {
      console.error("Failed to inactive course:", err);
    } finally {
      setInactivingCourse(false);
    }
  };

  const getResourceIcon = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "video")
      return (
        <VideoCamera size={14} weight="fill" style={{ color: "#8b5cf6" }} />
      );
    if (t === "slide")
      return <FilePdf size={14} weight="fill" style={{ color: "#f97316" }} />;
    if (t === "audio")
      return <FileText size={14} weight="fill" style={{ color: "#06b6d4" }} />;
    if (t === "homework" || t === "exercise" || t === "practiceexam")
      return <FileText size={14} weight="fill" style={{ color: "#f59e0b" }} />;
    return (
      <FileText
        size={14}
        weight="fill"
        style={{ color: colors.text.secondary }}
      />
    );
  };

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
          onPress={() => navigate("/tutor/my-courses")}
        >
          {t("courses.detail.backToCourses")}
        </Button>
      </div>
    );
  }

  const duration = formatDuration(course.estimatedTimeLesson);
  const allCategories = course.courseCategories || [];
  const outcomes = course.outcomes
    ? course.outcomes
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const statusLower = course.status?.toLowerCase();
  const modules = (course.courseCourseModules || []).sort(
    (a, b) => a.moduleNumber - b.moduleNumber,
  );
  const totalSessions = modules.reduce(
    (sum, m) => sum + (m.courseModuleCourseSessions?.length || 0),
    0,
  );

  // Detect incomplete course
  const isIncomplete = modules.length === 0 || totalSessions === 0;
  const incompleteReason =
    modules.length === 0
      ? t("courses.detail.incompleteNoModules")
      : totalSessions === 0
        ? t("courses.detail.incompleteNoSessions")
        : "";

  // Only Draft and Inactive (with no active enrollments) courses can be edited
  const canEdit =
    statusLower === "draft" ||
    (statusLower === "inactive" && !course.isEnrollment);

  // Schedule helpers
  const now = new Date();
  const todayStr = now.toDateString();
  const todayLessons = courseLessons
    .filter((l) => new Date(l.startTime).toDateString() === todayStr)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const upcomingLessons = courseLessons
    .filter(
      (l) =>
        new Date(l.startTime) > now &&
        new Date(l.startTime).toDateString() !== todayStr,
    )
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 10);

  const formatLessonTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLessonTimeBadge = (dateStr) => {
    if (!dateStr) return { hhmm: "", period: "" };
    const full = new Date(dateStr).toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = full.split(" ");
    return { hhmm: parts[0], period: parts[1] || "" };
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

  const getLessonStatusStyle = (status) => {
    switch (status) {
      case "Scheduled":
        return { bg: `${colors.primary.main}20`, color: colors.primary.main };
      case "InProgress":
        return { bg: `${colors.state.warning}20`, color: colors.state.warning };
      case "Completed":
        return { bg: `${colors.state.success}20`, color: colors.state.success };
      case "Cancelled":
        return { bg: `${colors.state.error}20`, color: colors.state.error };
      default:
        return { bg: colors.background.gray, color: colors.text.secondary };
    }
  };

  const getLessonStatusLabel = (status) => {
    const map = {
      Scheduled: t("tutorDashboard.schedule.lessonStatus.scheduled"),
      Completed: t("tutorDashboard.schedule.lessonStatus.completed"),
      Cancelled: t("tutorDashboard.schedule.lessonStatus.cancelled"),
      InProgress: t("tutorDashboard.schedule.lessonStatus.inProgress"),
      NoStudent: t("tutorDashboard.schedule.lessonStatus.noStudent"),
      NoTutor: t("tutorDashboard.schedule.lessonStatus.noTutor"),
    };
    return map[status] || status;
  };

  const canJoinLesson = (lesson) =>
    lesson.meetingStatus === "InProgress" ||
    (lesson.status !== "Completed" &&
      lesson.status !== "NoStudent" &&
      lesson.status !== "NoTutor" &&
      lesson.status !== "Cancelled" &&
      lesson.meetingStatus !== "Ended");

  return (
    <div className="space-y-6">
      {/* Back + Edit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-between"
      >
        <Button
          variant="light"
          startContent={<ArrowLeft size={18} />}
          onPress={() => navigate("/tutor/my-courses")}
          style={{ color: colors.text.secondary }}
        >
          {t("courses.detail.backToCourses")}
        </Button>
        <div className="flex items-center gap-2">
          {/* {statusLower === "published" && (
            <Button
              variant="flat"
              size="sm"
              onPress={() => navigate("/tutor/homework")}
              style={{
                backgroundColor: `${colors.primary.main}15`,
                color: colors.primary.main,
              }}
            >
              {t("tutorDashboard.nav.homework")}
            </Button>
          )} */}
          {canEdit ? (
            isIncomplete ? (
              <Button
                color="warning"
                variant="flat"
                startContent={<ArrowRight size={18} />}
                onPress={() => navigate(`/tutor/create-course/${course.id}`)}
              >
                {t("courses.detail.continueCourse")}
              </Button>
            ) : (
              <Button
                color="primary"
                startContent={<PencilSimple size={18} />}
                onPress={() => navigate(`/tutor/create-course/${course.id}`)}
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
              >
                {t("tutorDashboard.myCourses.editCourse")}
              </Button>
            )
          ) : statusLower === "published" && !course.isEnrollment ? (
            <Button
              variant="flat"
              startContent={<WarningCircle size={18} />}
              onPress={() => setInactiveConfirmOpen(true)}
              style={{
                backgroundColor: `${colors.state.warning}20`,
                color: colors.state.warning,
              }}
            >
              {t("courses.detail.inactiveToEdit")}
            </Button>
          ) : null}
        </div>
      </motion.div>

      {/* Incomplete course alert */}
      {canEdit && isIncomplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Alert
            color="warning"
            variant="flat"
            title={t("courses.detail.incompleteTitle")}
            description={incompleteReason}
          />
        </motion.div>
      )}

      {/* Non-editable status alerts */}
      {!canEdit && statusLower === "pending" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Alert
            color="warning"
            variant="flat"
            title={t("courses.detail.pendingEditLocked")}
          />
        </motion.div>
      )}
      {!canEdit && statusLower === "published" && course.isEnrollment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Alert
            color="primary"
            variant="flat"
            title={t("courses.detail.publishedHasStudents")}
          />
        </motion.div>
      )}
      {!canEdit && statusLower === "published" && !course.isEnrollment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Alert
            color="warning"
            variant="flat"
            title={t("courses.detail.publishedNoStudents")}
          />
        </motion.div>
      )}

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
                {/* Badges */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {course.status && (
                    <Chip
                      size="sm"
                      className="font-semibold"
                      style={{
                        backgroundColor:
                          statusLower === "published"
                            ? colors.state.success
                            : colors.state.warning,
                        color: "#fff",
                      }}
                    >
                      {statusLower === "published"
                        ? t("tutorDashboard.myCourses.published")
                        : t("tutorDashboard.myCourses.draft")}
                    </Chip>
                  )}
                  <Chip
                    size="sm"
                    style={{
                      backgroundColor: colors.background.primaryLight,
                      color: colors.primary.main,
                    }}
                  >
                    {course.level}
                  </Chip>
                  {course.isCertificate && (
                    <Chip
                      size="sm"
                      style={{
                        backgroundColor: "#D1FAE5",
                        color: "#059669",
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <Certificate size={14} />{" "}
                        {t("courses.detail.certificate")}
                      </span>
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
                  className="text-base mb-4 leading-relaxed"
                  style={{ color: colors.text.secondary }}
                >
                  {course.shortDescription}
                </p>

                {/* Categories */}
                {allCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {allCategories.map((cat) => (
                      <Chip
                        key={cat.id}
                        size="sm"
                        variant="flat"
                        style={{
                          backgroundColor: colors.background.gray,
                          color: colors.text.secondary,
                        }}
                      >
                        {cat.categoryName}
                      </Chip>
                    ))}
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-5 flex-wrap">
                  {course.ratingAverage > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            weight="fill"
                            style={{
                              color:
                                i < Math.floor(course.ratingAverage)
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
                        {course.ratingAverage}
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        ({course.ratingCount?.toLocaleString() || 0})
                      </span>
                    </div>
                  )}
                  <span
                    className="text-sm flex items-center gap-1.5"
                    style={{ color: colors.text.secondary }}
                  >
                    <Users size={16} weight="duotone" />
                    {course.numberOfEnrollment?.toLocaleString() || 0}{" "}
                    {t("courses.detail.students")}
                  </span>
                  <span
                    className="text-sm flex items-center gap-1.5"
                    style={{ color: colors.text.secondary }}
                  >
                    <BookOpen size={16} weight="duotone" />
                    {modules.length} {t("courses.detail.modules")} ·{" "}
                    {totalSessions} {t("courses.detail.sessions")}
                  </span>
                </div>

                {/* Instructor name */}
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
                        instructorRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                      }
                    >
                      {tutorInfo.user?.firstName} {tutorInfo.user?.lastName}
                    </button>
                  </div>
                )}
              </div>

              {/* Empty for sticky card overlap */}
              <div className="hidden lg:block" />
            </div>
          </CardBody>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
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
          {outcomes.length > 0 && (
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
                  <div className="grid sm:grid-cols-2 gap-3">
                    {outcomes.map((item, index) => (
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
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* ═══ Course Curriculum ═══ */}
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
                <div className="flex items-center justify-between mb-5">
                  <h2
                    className="font-semibold text-xl"
                    style={{ color: colors.text.primary }}
                  >
                    {t("courses.detail.courseCurriculum")}
                  </h2>
                  <span
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {modules.length} {t("courses.detail.modules")} ·{" "}
                    {totalSessions} {t("courses.detail.sessions")}
                  </span>
                </div>

                {modules.length === 0 ? (
                  <p
                    className="text-sm text-center py-8"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("courses.detail.noModules")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {modules.map((mod, idx) => {
                      const isExpanded = expandedModules[mod.id];
                      const sessions = (
                        mod.courseModuleCourseSessions || []
                      ).sort((a, b) => a.sessionNumber - b.sessionNumber);
                      const moduleOutcomes = mod.moduleOutcomes
                        ? mod.moduleOutcomes
                            .split(/[;\n]+/)
                            .map((s) => s.trim())
                            .filter(Boolean)
                        : [];

                      return (
                        <div
                          key={mod.id}
                          className="rounded-xl overflow-hidden border"
                          style={{ borderColor: colors.border.light }}
                        >
                          {/* Module header */}
                          <button
                            type="button"
                            className="w-full flex items-center justify-between p-4 text-left"
                            style={{ backgroundColor: colors.background.gray }}
                            onClick={() => toggleModule(mod.id)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: colors.primary.main,
                                  color: colors.text.white,
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
                                  {mod.moduleTitle}
                                </p>
                                <p
                                  className="text-xs mt-0.5"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {sessions.length}{" "}
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

                          {/* Expanded content */}
                          {isExpanded && (
                            <div
                              className="px-4 pb-4 pt-2"
                              style={{
                                backgroundColor: colors.background.light,
                              }}
                            >
                              {/* Module description */}
                              {mod.moduleDescription && (
                                <p
                                  className="text-sm mb-3 leading-relaxed"
                                  style={{ color: colors.text.secondary }}
                                >
                                  {mod.moduleDescription}
                                </p>
                              )}

                              {/* Sessions list */}
                              {sessions.length === 0 ? (
                                <p
                                  className="text-xs text-center py-3"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {t("courses.detail.noSessions")}
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {sessions.map((sess) => {
                                    const sessId = sess.courseSessionId;
                                    const isResExpanded =
                                      expandedSessions[sessId];
                                    const resources =
                                      sessionResources[sessId] || [];
                                    const isResLoading =
                                      loadingResources[sessId];
                                    return (
                                      <div
                                        key={sess.id}
                                        className="rounded-lg p-3"
                                        style={{
                                          backgroundColor:
                                            colors.background.gray,
                                        }}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                            style={{
                                              backgroundColor:
                                                colors.background.primaryLight,
                                            }}
                                          >
                                            <Play
                                              size={12}
                                              weight="fill"
                                              style={{
                                                color: colors.primary.main,
                                              }}
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p
                                              className="font-medium text-sm"
                                              style={{
                                                color: colors.text.primary,
                                              }}
                                            >
                                              {sess.sessionNumber}.{" "}
                                              {sess.sessionTitle}
                                            </p>
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
                                            {sess.sessionOutcomes && (
                                              <div className="mt-1.5">
                                                <p
                                                  className="text-xs font-medium mb-1"
                                                  style={{
                                                    color: colors.text.primary,
                                                  }}
                                                ></p>
                                                <div className="flex flex-col gap-0.5">
                                                  {sess.sessionOutcomes
                                                    .split(/[;\n]+/)
                                                    .filter((o) => o.trim())
                                                    .map((outcome, i) => (
                                                      <div
                                                        key={i}
                                                        className="flex items-start gap-1"
                                                      >
                                                        <ArrowRightIcon
                                                          size={10}
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
                                                          {outcome.trim()}
                                                        </span>
                                                      </div>
                                                    ))}
                                                </div>
                                              </div>
                                            )}
                                            {/* Resources toggle */}
                                            {sessId && (
                                              <div className="mt-2">
                                                <button
                                                  type="button"
                                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
                                                  style={{
                                                    color: colors.primary.main,
                                                    backgroundColor:
                                                      colors.background
                                                        .primaryLight,
                                                  }}
                                                  onClick={() =>
                                                    toggleSessionResources(
                                                      sessId,
                                                    )
                                                  }
                                                >
                                                  <FileText
                                                    size={13}
                                                    weight="fill"
                                                  />
                                                  {t(
                                                    "courses.detail.resources.label",
                                                  )}
                                                  {isResExpanded ? (
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

                                                {isResExpanded && (
                                                  <div className="mt-2 space-y-1.5">
                                                    {isResLoading ? (
                                                      <div className="flex items-center gap-2 py-1">
                                                        <Spinner size="sm" />
                                                        <span
                                                          className="text-xs"
                                                          style={{
                                                            color:
                                                              colors.text
                                                                .tertiary,
                                                          }}
                                                        >
                                                          {t(
                                                            "courses.detail.resources.loading",
                                                          )}
                                                        </span>
                                                      </div>
                                                    ) : resources.length ===
                                                      0 ? (
                                                      <p
                                                        className="text-xs py-1"
                                                        style={{
                                                          color:
                                                            colors.text
                                                              .tertiary,
                                                        }}
                                                      >
                                                        {t(
                                                          "courses.detail.resources.empty",
                                                        )}
                                                      </p>
                                                    ) : (
                                                      resources.map((res) => (
                                                        <div
                                                          key={res.id}
                                                          className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                                                          style={{
                                                            backgroundColor:
                                                              colors.background
                                                                .light,
                                                          }}
                                                        >
                                                          <span className="flex-shrink-0">
                                                            {getResourceIcon(
                                                              res.resourceType,
                                                            )}
                                                          </span>
                                                          <span
                                                            className="flex-1 text-xs font-medium truncate"
                                                            style={{
                                                              color:
                                                                colors.text
                                                                  .primary,
                                                            }}
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
                                                            title={t(
                                                              "courses.detail.resources.open",
                                                            )}
                                                          >
                                                            <ArrowSquareOut
                                                              size={14}
                                                              style={{
                                                                color:
                                                                  colors.primary
                                                                    .main,
                                                              }}
                                                            />
                                                          </a>
                                                          <button
                                                            type="button"
                                                            className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
                                                            title={t(
                                                              "courses.detail.resources.remove",
                                                            )}
                                                            onClick={() =>
                                                              setRemoveResourceId(
                                                                {
                                                                  sessionId:
                                                                    sessId,
                                                                  resourceId:
                                                                    res.id,
                                                                },
                                                              )
                                                            }
                                                          >
                                                            <Trash
                                                              size={13}
                                                              style={{
                                                                color:
                                                                  colors.state
                                                                    .error,
                                                              }}
                                                            />
                                                          </button>
                                                        </div>
                                                      ))
                                                    )}
                                                    {/* Add Resource button */}
                                                    <Button
                                                      variant="light"
                                                      size="sm"
                                                      className="text-xs"
                                                      style={{
                                                        color:
                                                          colors.primary.main,
                                                      }}
                                                      onClick={() =>
                                                        openAddResource(sessId)
                                                      }
                                                    >
                                                      <Plus
                                                        size={12}
                                                        weight="bold"
                                                      />
                                                      {t(
                                                        "courses.detail.resources.add",
                                                      )}
                                                    </Button>
                                                  </div>
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
                )}
              </CardBody>
            </Card>
          </motion.div>

          {/* Course Schedule */}
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
                <div className="flex items-center justify-between mb-5">
                  <h2
                    className="font-semibold text-xl"
                    style={{ color: colors.text.primary }}
                  >
                    {t("courses.detail.courseSchedule")}
                  </h2>
                  <Button
                    size="sm"
                    variant="light"
                    style={{ color: colors.primary.main }}
                    endContent={<ArrowRight size={16} />}
                    onPress={() => navigate("/tutor/schedule")}
                  >
                    {t("courses.detail.viewAllSchedule")}
                  </Button>
                </div>

                {lessonsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="md" />
                  </div>
                ) : todayLessons.length === 0 &&
                  upcomingLessons.length === 0 ? (
                  <p
                    className="text-sm text-center py-8"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("courses.detail.noScheduledLessons")}
                  </p>
                ) : (
                  <div className="space-y-5">
                    {/* Today */}
                    {todayLessons.length > 0 && (
                      <div>
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-3"
                          style={{ color: colors.primary.main }}
                        >
                          {t("courses.detail.scheduleToday")}
                        </p>
                        <div className="space-y-2">
                          {todayLessons.map((lesson) => {
                            const statusStyle = getLessonStatusStyle(
                              lesson.status,
                            );
                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{
                                  backgroundColor: colors.background.gray,
                                }}
                              >
                                {(() => {
                                  const { hhmm, period } =
                                    formatLessonTimeBadge(lesson.startTime);
                                  return (
                                    <div
                                      className="w-12 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 px-1"
                                      style={{
                                        backgroundColor: `${colors.primary.main}15`,
                                      }}
                                    >
                                      <span
                                        className="text-xs font-bold leading-none"
                                        style={{ color: colors.primary.main }}
                                      >
                                        {hhmm}
                                      </span>
                                      {period && (
                                        <span
                                          className="text-[9px] font-medium leading-none mt-0.5"
                                          style={{
                                            color: colors.primary.main,
                                            opacity: 0.75,
                                          }}
                                        >
                                          {period}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                                <div
                                  className="flex-1 min-w-0 cursor-pointer hover:opacity-70 transition-opacity"
                                  onClick={() => setSelectedLesson(lesson)}
                                >
                                  <p
                                    className="text-sm font-medium truncate"
                                    style={{ color: colors.text.primary }}
                                  >
                                    {lesson.sessionTitle || lesson.courseTitle}
                                  </p>
                                  <p
                                    className="text-xs mt-0.5"
                                    style={{ color: colors.text.tertiary }}
                                  >
                                    {formatLessonTime(lesson.startTime)} —{" "}
                                    {formatLessonTime(lesson.endTime)}
                                    {lesson.studentFirstName && (
                                      <span>
                                        {" "}
                                        · {lesson.studentFirstName}{" "}
                                        {lesson.studentLastName}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <Chip
                                    size="sm"
                                    className="text-xs"
                                    style={{
                                      backgroundColor: statusStyle.bg,
                                      color: statusStyle.color,
                                    }}
                                  >
                                    {getLessonStatusLabel(lesson.status)}
                                  </Chip>
                                  {canJoinLesson(lesson) && (
                                    <Button
                                      size="sm"
                                      startContent={
                                        <VideoCamera
                                          weight="fill"
                                          className="w-3.5 h-3.5"
                                        />
                                      }
                                      onPress={() =>
                                        navigate(`/meeting/${lesson.id}`)
                                      }
                                      style={{
                                        backgroundColor: colors.primary.main,
                                        color: "#fff",
                                      }}
                                    >
                                      {t("tutorDashboard.schedule.joinLesson")}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Upcoming */}
                    {upcomingLessons.length > 0 && (
                      <div>
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-3"
                          style={{ color: colors.text.secondary }}
                        >
                          {t("courses.detail.scheduleUpcoming")}
                        </p>
                        <div className="space-y-2">
                          {upcomingLessons.map((lesson) => {
                            const statusStyle = getLessonStatusStyle(
                              lesson.status,
                            );
                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{
                                  backgroundColor: colors.background.gray,
                                }}
                              >
                                <div
                                  className="w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: `${colors.primary.main}15`,
                                  }}
                                >
                                  <span
                                    className="text-sm font-bold leading-none"
                                    style={{ color: colors.primary.main }}
                                  >
                                    {new Date(lesson.startTime).getDate()}
                                  </span>
                                  <span
                                    className="mt-0.5"
                                    style={{
                                      color: colors.primary.main,
                                      fontSize: "10px",
                                    }}
                                  >
                                    {new Date(
                                      lesson.startTime,
                                    ).toLocaleDateString(dateLocale, {
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                                <div
                                  className="flex-1 min-w-0 cursor-pointer hover:opacity-70 transition-opacity"
                                  onClick={() => setSelectedLesson(lesson)}
                                >
                                  <p
                                    className="text-sm font-medium truncate"
                                    style={{ color: colors.text.primary }}
                                  >
                                    {lesson.sessionTitle || lesson.courseTitle}
                                  </p>
                                  <p
                                    className="text-xs mt-0.5"
                                    style={{ color: colors.text.tertiary }}
                                  >
                                    {formatLessonDate(lesson.startTime)} ·{" "}
                                    {formatLessonTime(lesson.startTime)} —{" "}
                                    {formatLessonTime(lesson.endTime)}
                                    {lesson.studentFirstName && (
                                      <span>
                                        {" "}
                                        · {lesson.studentFirstName}{" "}
                                        {lesson.studentLastName}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <Chip
                                    size="sm"
                                    className="text-xs"
                                    style={{
                                      backgroundColor: statusStyle.bg,
                                      color: statusStyle.color,
                                    }}
                                  >
                                    {getLessonStatusLabel(lesson.status)}
                                  </Chip>
                                  {canJoinLesson(lesson) && (
                                    <Button
                                      size="sm"
                                      startContent={
                                        <VideoCamera
                                          weight="fill"
                                          className="w-3.5 h-3.5"
                                        />
                                      }
                                      onPress={() =>
                                        navigate(`/meeting/${lesson.id}`)
                                      }
                                      style={{
                                        backgroundColor: colors.primary.main,
                                        color: "#fff",
                                      }}
                                    >
                                      {t("tutorDashboard.schedule.joinLesson")}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>

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
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-lg"
                        style={{ color: colors.text.primary }}
                      >
                        {tutorInfo.user?.firstName} {tutorInfo.user?.lastName}
                      </p>
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

          {/* Student Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Card
              className="shadow-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {t("studentDashboard.myCourses.courseReview")}
                  </h2>
                  {reviews.length > 0 && (
                    <span
                      className="text-sm"
                      style={{ color: colors.text.tertiary }}
                    >
                      ({reviews.length})
                    </span>
                  )}
                </div>

                {reviewsLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="sm" color="primary" />
                  </div>
                ) : reviews.length === 0 ? (
                  <p
                    className="text-sm text-center py-4"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("courses.detail.noReviews")}
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar
                            size="sm"
                            src={
                              review.isAnonymous
                                ? undefined
                                : reviewStudents[review.studentId]?.avatar
                            }
                            name={
                              review.isAnonymous
                                ? t("courses.detail.anonymous")
                                : `${reviewStudents[review.studentId]?.user?.firstName ?? ""} ${reviewStudents[review.studentId]?.user?.lastName ?? ""}`
                            }
                            className="w-8 h-8 text-xs"
                          />
                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{ color: colors.text.primary }}
                            >
                              {review.isAnonymous
                                ? t("courses.detail.anonymous")
                                : `${reviewStudents[review.studentId]?.user?.firstName ?? ""} ${reviewStudents[review.studentId]?.user?.lastName ?? ""}`}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: colors.text.tertiary }}
                            >
                              {review.createdAt
                                ? new Date(review.createdAt).toLocaleDateString(
                                    dateLocale,
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )
                                : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 ml-auto">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                weight={s <= review.rating ? "fill" : "regular"}
                                color={
                                  s <= review.rating
                                    ? "#FBBF24"
                                    : colors.text.tertiary
                                }
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p
                            className="text-sm mt-1"
                            style={{ color: colors.text.secondary }}
                          >
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}

                    {reviewsHasMore && (
                      <div className="flex justify-center mt-2">
                        <Button
                          size="sm"
                          variant="flat"
                          isLoading={reviewsLoadingMore}
                          onPress={handleLoadMoreReviews}
                          style={{ color: colors.primary.main }}
                        >
                          {t("courses.detail.loadMoreReviews")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Sticky Card */}
        <div className="lg:col-span-1 lg:-mt-64">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="lg:sticky lg:top-40"
          >
            <Card
              className="shadow-lg overflow-hidden"
              style={{ backgroundColor: colors.background.light }}
            >
              {/* Thumbnail */}
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
                {/* Price */}
                <div>
                  <span
                    className="text-3xl font-bold"
                    style={{ color: colors.primary.main }}
                  >
                    {formatPrice(course.price, course.currency)}
                  </span>
                </div>

                <Divider />

                {/* Course overview info */}
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
                      <Clock size={16} weight="duotone" />
                      {t("courses.detail.timePerLesson")}
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {duration || "—"}
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
                  {course.numsSessionInWeek > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className="flex items-center gap-2"
                        style={{ color: colors.text.secondary }}
                      >
                        <Clock size={16} weight="duotone" />
                        {t("courses.detail.sessionsPerWeek")}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {course.numsSessionInWeek}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className="flex items-center gap-2"
                      style={{ color: colors.text.secondary }}
                    >
                      <Users size={16} weight="duotone" />
                      {t("courses.detail.studentsEnrolled")}
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {course.numberOfEnrollment?.toLocaleString() || 0}
                    </span>
                  </div>
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

      <VideoModal
        isOpen={videoOpen}
        onOpenChange={setVideoOpen}
        videoUrl={course?.demoVideoUrl}
      />

      <LessonDetailModal
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        lesson={selectedLesson}
      />

      {/* Edit Resource Modal */}
      <Modal
        isOpen={editResourceModal}
        onOpenChange={setEditResourceModal}
        size="md"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("courses.detail.resources.editTitle")}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label={t("courses.detail.resources.fieldTitle")}
                  value={editResourceData?.title || ""}
                  onValueChange={(v) =>
                    setEditResourceData((prev) => ({ ...prev, title: v }))
                  }
                  classNames={inputClassNames}
                />
                <Select
                  label={t("courses.detail.resources.fieldType")}
                  classNames={selectClassNames}
                  selectedKeys={
                    editResourceData?.resourceType
                      ? [editResourceData.resourceType]
                      : []
                  }
                  onSelectionChange={(keys) =>
                    setEditResourceData((prev) => ({
                      ...prev,
                      resourceType: [...keys][0] || "",
                    }))
                  }
                >
                  {[
                    "Document",
                    "Video",
                    "Slide",
                    "Audio",
                    "Homework",
                    "Exercise",
                    "PracticeExam",
                    "Reference",
                    "Other",
                  ].map((type) => (
                    <SelectItem key={type}>{type}</SelectItem>
                  ))}
                </Select>
                <Input
                  label={t("courses.detail.resources.fieldUrl")}
                  value={editResourceData?.url || ""}
                  onValueChange={(v) =>
                    setEditResourceData((prev) => ({ ...prev, url: v }))
                  }
                  classNames={inputClassNames}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={savingResource}
                  onPress={handleSaveResource}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                >
                  {t("common.save")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Remove Resource Confirmation Modal */}
      <Modal
        isOpen={!!removeResourceId}
        onOpenChange={(open) => {
          if (!open) setRemoveResourceId(null);
        }}
        size="sm"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("courses.detail.resources.removeTitle")}
              </ModalHeader>
              <ModalBody>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t("courses.detail.resources.removeMessage")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="danger"
                  isLoading={removingResource}
                  onPress={handleRemoveResource}
                >
                  {t("common.remove")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add Resource Modal */}
      <Modal
        isOpen={addResourceModal}
        onOpenChange={setAddResourceModal}
        size="md"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("courses.detail.resources.addTitle")}
              </ModalHeader>
              <ModalBody className="space-y-4">
                {/* Mode toggle */}
                <Tabs
                  selectedKey={addResourceMode}
                  onSelectionChange={(key) => {
                    setAddResourceMode(key);
                    if (
                      key === "reuse" &&
                      reuseResources.length === 0 &&
                      !reuseResourcesLoading
                    ) {
                      loadReuseResources(addResourceSessionId);
                    }
                  }}
                  fullWidth
                  size="sm"
                  color="primary"
                >
                  <Tab
                    key="new"
                    title={t("courses.detail.resources.newResource")}
                  />
                  <Tab
                    key="reuse"
                    title={t("courses.detail.resources.reuseExisting")}
                  />
                </Tabs>

                {addResourceMode === "new" ? (
                  <>
                    <Input
                      label={t("courses.detail.resources.fieldTitle")}
                      value={addResourceData.title}
                      onValueChange={(v) =>
                        setAddResourceData((prev) => ({ ...prev, title: v }))
                      }
                      classNames={inputClassNames}
                      isRequired
                    />
                    <Select
                      label={t("courses.detail.resources.fieldType")}
                      classNames={selectClassNames}
                      selectedKeys={
                        addResourceData.resourceType
                          ? [addResourceData.resourceType]
                          : []
                      }
                      onSelectionChange={(keys) =>
                        setAddResourceData((prev) => ({
                          ...prev,
                          resourceType: [...keys][0] || "",
                        }))
                      }
                    >
                      {[
                        "Document",
                        "Video",
                        "Slide",
                        "Audio",
                        "Homework",
                        "Exercise",
                        "PracticeExam",
                        "Reference",
                        "Other",
                      ].map((type) => (
                        <SelectItem key={type}>{type}</SelectItem>
                      ))}
                    </Select>
                    <div>
                      <p
                        className="text-sm font-medium mb-2"
                        style={{ color: colors.text.primary }}
                      >
                        {t("courses.detail.resources.fieldFile")}
                      </p>
                      <label
                        className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer"
                        style={{ borderColor: colors.border.light }}
                      >
                        <FileText
                          className="w-5 h-5"
                          style={{ color: colors.text.tertiary }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {addResourceData.file
                            ? addResourceData.file.name
                            : t("courses.detail.resources.noFileChosen")}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            setAddResourceData((prev) => ({
                              ...prev,
                              file: e.target.files?.[0] || null,
                            }))
                          }
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <Input
                      placeholder={t(
                        "courses.detail.resources.searchResources",
                      )}
                      value={reuseSearch}
                      onValueChange={setReuseSearch}
                      classNames={inputClassNames}
                      isClearable
                      onClear={() => setReuseSearch("")}
                    />
                    <div
                      className="space-y-1.5 max-h-60 overflow-y-auto"
                      style={{ minHeight: "80px" }}
                    >
                      {reuseResourcesLoading ? (
                        <div className="flex justify-center py-4">
                          <Spinner size="sm" />
                        </div>
                      ) : reuseResources.filter(
                          (r) =>
                            !reuseSearch ||
                            r.title
                              ?.toLowerCase()
                              .includes(reuseSearch.toLowerCase()),
                        ).length === 0 ? (
                        <p
                          className="text-sm text-center py-4"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("courses.detail.resources.noExistingResources")}
                        </p>
                      ) : (
                        reuseResources
                          .filter(
                            (r) =>
                              !reuseSearch ||
                              r.title
                                ?.toLowerCase()
                                .includes(reuseSearch.toLowerCase()),
                          )
                          .map((r) => (
                            <div
                              key={r.id}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors cursor-pointer"
                              style={{
                                borderColor:
                                  selectedReuseId === r.id
                                    ? colors.primary.main
                                    : colors.border.light,
                                backgroundColor:
                                  selectedReuseId === r.id
                                    ? colors.background.gray
                                    : colors.background.gray,
                              }}
                              onClick={() =>
                                setSelectedReuseId(
                                  selectedReuseId === r.id ? null : r.id,
                                )
                              }
                            >
                              <span className="flex-shrink-0">
                                {getResourceIcon(r.resourceType)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-medium truncate"
                                  style={{ color: colors.text.primary }}
                                >
                                  {r.title}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {r.resourceType}
                                </p>
                              </div>
                              {r.url && (
                                <a
                                  href={buildResourceUrl(r.url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={t("courses.detail.resources.open")}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-shrink-0 flex items-center"
                                >
                                  <ArrowSquareOut
                                    size={15}
                                    style={{ color: colors.primary.main }}
                                  />
                                </a>
                              )}
                              {selectedReuseId === r.id && (
                                <Check
                                  size={16}
                                  weight="bold"
                                  style={{ color: colors.primary.main }}
                                />
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                {addResourceMode === "new" ? (
                  <Button
                    color="primary"
                    isLoading={addingResource}
                    isDisabled={!addResourceData.title.trim()}
                    onPress={handleAddResource}
                    style={{
                      backgroundColor: colors.primary.main,
                      color: colors.text.white,
                    }}
                  >
                    {t("common.add")}
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    isLoading={addingResource}
                    isDisabled={!selectedReuseId}
                    onPress={handleAddReuse}
                    style={{
                      backgroundColor: colors.primary.main,
                      color: colors.text.white,
                    }}
                  >
                    {t("common.add")}
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Inactive Course Confirm Modal */}
      <Modal
        isOpen={inactiveConfirmOpen}
        onOpenChange={setInactiveConfirmOpen}
        size="sm"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("courses.detail.inactiveConfirmTitle")}
              </ModalHeader>
              <ModalBody>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t("courses.detail.inactiveConfirmMessage")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="flat"
                  isLoading={inactivingCourse}
                  onPress={handleInactiveCourse}
                  style={{
                    backgroundColor: `${colors.state.warning}20`,
                    color: colors.state.warning,
                  }}
                >
                  {t("courses.detail.inactiveToEdit")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TutorCourseDetail;
