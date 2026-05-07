import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Avatar,
  Button,
  Chip,
  Image,
  Skeleton,
  Spinner,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { motion } from "framer-motion";
import { coursesApi, tutorApi, studentApi } from "../../../api";
import {
  ArrowLeft,
  BookOpen,
  Star,
  CaretDown,
  CaretUp,
  Play,
  Certificate,
  Users,
  VideoCamera,
  Clock,
  CalendarBlank,
  Target,
  FileText,
  FilePdf,
  Link,
  ArrowSquareOut,
  ArrowRightIcon,
  ArrowBendDownRightIcon,
} from "@phosphor-icons/react";

const AdminCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tutorInfo, setTutorInfo] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedSessions, setExpandedSessions] = useState({});
  const [sessionResources, setSessionResources] = useState({});
  const [loadingResources, setLoadingResources] = useState({});

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [reviewStudents, setReviewStudents] = useState({});
  const REVIEWS_PAGE_SIZE = 5;

  const toggleModule = (moduleId) =>
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));

  const toggleSessionResources = async (sessId) => {
    if (expandedSessions[sessId]) {
      setExpandedSessions((prev) => ({ ...prev, [sessId]: false }));
      return;
    }
    setExpandedSessions((prev) => ({ ...prev, [sessId]: true }));
    if (!sessionResources[sessId]) {
      setLoadingResources((prev) => ({ ...prev, [sessId]: true }));
      try {
        const res = await coursesApi.getAllCourseResources({
          CourseSessionId: sessId,
          "page-size": 100,
        });
        if (res.isSuccess) {
          setSessionResources((prev) => ({
            ...prev,
            [sessId]: res.data.items || [],
          }));
        }
      } catch {
        setSessionResources((prev) => ({ ...prev, [sessId]: [] }));
      } finally {
        setLoadingResources((prev) => ({ ...prev, [sessId]: false }));
      }
    }
  };

  const getResourceIcon = (type) => {
    const lo = (type || "").toLowerCase();
    if (lo === "pdf")
      return <FilePdf size={13} weight="fill" style={{ color: "#ef4444" }} />;
    if (lo === "video")
      return (
        <VideoCamera size={13} weight="fill" style={{ color: "#8b5cf6" }} />
      );
    if (lo === "link")
      return <Link size={13} weight="bold" style={{ color: "#3b82f6" }} />;
    return (
      <FileText
        size={13}
        weight="fill"
        style={{ color: colors.text.secondary }}
      />
    );
  };

  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await coursesApi.getCourseReviews({
          CourseId: id,
          "page-index": 1,
          "page-size": REVIEWS_PAGE_SIZE,
        });
        if (res.isSuccess) {
          const items = res.data?.items || [];
          setReviews(items);
          setReviewsHasMore((res.data?.totalPages ?? 1) > 1);
          const ids = [
            ...new Set(
              items.filter((r) => !r.isAnonymous).map((r) => r.studentId),
            ),
          ];
          if (ids.length > 0) {
            const entries = await Promise.all(
              ids.map(async (sid) => {
                try {
                  const r = await studentApi.getStudentById(sid);
                  return [sid, r.data];
                } catch {
                  return [sid, null];
                }
              }),
            );
            setReviewStudents(Object.fromEntries(entries));
          }
        }
      } catch (_) {
      } finally {
        setReviewsLoading(false);
      }
    };
    if (id) fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await coursesApi.getCourseById(id);
        setCourse(res.data);
        if (res.data?.tutorId) {
          try {
            const tutorRes = await tutorApi.getTutorById(res.data.tutorId);
            setTutorInfo(tutorRes.data);
          } catch (_) {}
        }
      } catch (error) {
        console.error("Failed to fetch course detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleLoadMoreReviews = async () => {
    setReviewsLoadingMore(true);
    const nextPage = reviewsPage + 1;
    try {
      const res = await coursesApi.getCourseReviews({
        CourseId: id,
        "page-index": nextPage,
        "page-size": REVIEWS_PAGE_SIZE,
      });
      if (res.isSuccess) {
        const items = res.data?.items || [];
        setReviews((prev) => [...prev, ...items]);
        setReviewsPage(nextPage);
        setReviewsHasMore(nextPage < (res.data?.totalPages ?? 1));
        const newIds = [
          ...new Set(
            items
              .filter((r) => !r.isAnonymous && !reviewStudents[r.studentId])
              .map((r) => r.studentId),
          ),
        ];
        if (newIds.length > 0) {
          const entries = await Promise.all(
            newIds.map(async (sid) => {
              try {
                const r = await studentApi.getStudentById(sid);
                return [sid, r.data];
              } catch {
                return [sid, null];
              }
            }),
          );
          setReviewStudents((prev) => ({
            ...prev,
            ...Object.fromEntries(entries),
          }));
        }
      }
    } catch (_) {
    } finally {
      setReviewsLoadingMore(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "published":
        return "success";
      case "pending":
        return "warning";
      case "draft":
        return "default";
      case "inactive":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "published":
        return t("adminDashboard.courses.published");
      case "pending":
        return t("adminDashboard.courses.pending");
      case "draft":
        return t("adminDashboard.courses.draft");
      case "inactive":
        return t("adminDashboard.courses.inactive");
      default:
        return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    );
  };

  const formatPrice = (price) => {
    if (price == null) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-3"
      >
        <Button
          isIconOnly
          variant="light"
          onPress={() => navigate("/admin/courses")}
        >
          <ArrowLeft size={20} style={{ color: colors.text.primary }} />
        </Button>
        <h1
          className="text-2xl lg:text-3xl font-bold"
          style={{ color: colors.text.primary }}
        >
          {t("adminDashboard.courses.courseDetails")}
        </h1>
      </motion.div>

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
          <CardBody className="p-6 space-y-4">
            {loading ? (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="w-32 h-24 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-full rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ) : (
              course && (
                <div className="space-y-4">
                  {/* Header: thumbnail + title + categories + status */}
                  <div
                    className="flex gap-4 p-4 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <div className="w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      {course.thumbnailUrl ? (
                        <Image
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            backgroundColor: colors.background.gray,
                          }}
                        >
                          <BookOpen
                            className="w-8 h-8"
                            style={{ color: colors.text.secondary }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-xl font-semibold mb-1"
                        style={{ color: colors.text.primary }}
                      >
                        {course.title}
                      </h3>
                      {course.shortDescription && (
                        <p
                          className="text-sm mb-2"
                          style={{ color: colors.text.secondary }}
                        >
                          {course.shortDescription}
                        </p>
                      )}
                      <div className="flex items-center flex-wrap gap-2">
                        {(
                          course.courseCategories ||
                          course.categories ||
                          []
                        ).map((cat) => (
                          <Chip
                            key={cat.categoryId || cat.id}
                            size="sm"
                            variant="flat"
                          >
                            {cat.categoryName || cat.name}
                          </Chip>
                        ))}
                        <Chip
                          size="sm"
                          color={getStatusColor(course.status)}
                          variant="flat"
                        >
                          {getStatusLabel(course.status)}
                        </Chip>
                        {course.isCertificate && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="secondary"
                            startContent={
                              <Certificate size={14} weight="fill" />
                            }
                          >
                            {t("adminDashboard.courses.certificate")}
                          </Chip>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tutor info */}
                  {tutorInfo && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: colors.background.gray,
                      }}
                      onClick={() =>
                        navigate(`/admin/tutors/${course.tutorId}`)
                      }
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        {tutorInfo.avatar ? (
                          <Image
                            src={tutorInfo.avatar}
                            alt={
                              tutorInfo.user
                                ? `${tutorInfo.user.firstName} ${tutorInfo.user.lastName}`
                                : ""
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              backgroundColor: colors.background.primaryLight,
                            }}
                          >
                            <Users
                              size={18}
                              style={{ color: colors.primary.main }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-sm"
                          style={{ color: colors.text.primary }}
                        >
                          {tutorInfo.user
                            ? `${tutorInfo.user.firstName} ${tutorInfo.user.lastName}`
                            : "N/A"}
                        </p>
                        {tutorInfo.headline && (
                          <p
                            className="text-xs truncate"
                            style={{ color: colors.text.secondary }}
                          >
                            {tutorInfo.headline}
                          </p>
                        )}
                      </div>
                      {tutorInfo.ratingAverage != null && (
                        <div className="flex items-center gap-1">
                          <Star
                            size={12}
                            weight="fill"
                            style={{ color: colors.state.warning }}
                          />
                          <span
                            className="text-xs font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {tutorInfo.ratingAverage}
                          </span>
                        </div>
                      )}
                    </button>
                  )}

                  {/* Full Description + Outcomes */}
                  {(course.fullDescription ||
                    course.description ||
                    course.outcomes) && (
                    <div
                      className="p-4 rounded-xl space-y-3"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      {(course.fullDescription || course.description) && (
                        <div>
                          <p
                            className="text-sm font-medium mb-1"
                            style={{ color: colors.text.primary }}
                          >
                            {t("adminDashboard.courses.fullDescription")}
                          </p>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: colors.text.secondary }}
                          >
                            {course.fullDescription || course.description}
                          </p>
                        </div>
                      )}

                      {/* Outcomes */}
                      {course.outcomes && (
                        <div>
                          <p
                            className="text-sm font-medium mb-1"
                            style={{ color: colors.text.primary }}
                          >
                            {t("adminDashboard.courses.outcomes")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {course.outcomes
                              .split(/[;\n]+/)
                              .filter((o) => o.trim())
                              .map((outcome, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1.5"
                                >
                                  <Target
                                    size={14}
                                    weight="fill"
                                    style={{ color: colors.state.success }}
                                  />
                                  <span
                                    className="text-sm"
                                    style={{ color: colors.text.secondary }}
                                  >
                                    {outcome.trim()}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Demo Video */}
                  {course.demoVideoUrl && (
                    <div
                      className="p-4 rounded-xl"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <p
                        className="text-sm font-medium mb-2"
                        style={{ color: colors.text.primary }}
                      >
                        {t("adminDashboard.courses.demoVideo")}
                      </p>
                      <video
                        src={course.demoVideoUrl}
                        controls
                        className="w-full rounded-xl"
                        style={{ maxHeight: 300 }}
                      />
                    </div>
                  )}

                  {/* Quick stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div
                      className="p-3 rounded-xl text-center"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <p
                        className="text-lg font-bold"
                        style={{ color: colors.state.success }}
                      >
                        {formatPrice(course.price)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("adminDashboard.courses.table.price")}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-xl text-center"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <p
                        className="text-lg font-bold"
                        style={{ color: colors.text.primary }}
                      >
                        {course.level || course.courseLevel || "N/A"}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("adminDashboard.courses.table.level")}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-xl text-center"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <p
                        className="text-lg font-bold"
                        style={{ color: colors.text.primary }}
                      >
                        {(course.courseCourseModules || []).length}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("adminDashboard.courses.modules")}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-xl text-center"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Star
                          size={16}
                          weight="fill"
                          style={{ color: colors.state.warning }}
                        />
                        <p
                          className="text-lg font-bold"
                          style={{ color: colors.text.primary }}
                        >
                          {course.ratingAverage ?? "N/A"}
                        </p>
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("adminDashboard.courses.rating")} (
                        {course.ratingCount ?? 0})
                      </p>
                    </div>
                  </div>

                  {/* Extra info rows */}
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <div className="flex items-center gap-2">
                      <Users
                        size={16}
                        style={{ color: colors.text.secondary }}
                      />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("adminDashboard.courses.enrollments")}
                        </p>
                        <p style={{ color: colors.text.primary }}>
                          {course.numberOfEnrollment ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarBlank
                        size={16}
                        style={{ color: colors.text.secondary }}
                      />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("adminDashboard.courses.sessionsPerWeek")}
                        </p>
                        <p style={{ color: colors.text.primary }}>
                          {course.numsSessionInWeek ?? "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <VideoCamera
                        size={16}
                        style={{ color: colors.text.secondary }}
                      />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("adminDashboard.courses.totalSessions")}
                        </p>
                        <p style={{ color: colors.text.primary }}>
                          {course.numberOfSessions ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock
                        size={16}
                        style={{ color: colors.text.secondary }}
                      />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("adminDashboard.courses.estimatedTime")}
                        </p>
                        <p style={{ color: colors.text.primary }}>
                          {course.estimatedTime || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock
                        size={16}
                        style={{ color: colors.text.secondary }}
                      />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("adminDashboard.courses.estimatedTimeLesson")}
                        </p>
                        <p style={{ color: colors.text.primary }}>
                          {course.estimatedTimeLesson || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Certificate
                        size={16}
                        style={{ color: colors.text.secondary }}
                      />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("adminDashboard.courses.certificate")}
                        </p>
                        <p style={{ color: colors.text.primary }}>
                          {course.isCertificate
                            ? t("adminDashboard.courses.yes")
                            : t("adminDashboard.courses.no")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div
                    className="grid grid-cols-2 gap-3 text-sm p-4 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <div>
                      <span style={{ color: colors.text.secondary }}>
                        {t("adminDashboard.courses.table.createdAt")}:{" "}
                      </span>
                      <span style={{ color: colors.text.primary }}>
                        {formatDate(course.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: colors.text.secondary }}>
                        {t("adminDashboard.courses.updatedAt")}:{" "}
                      </span>
                      <span style={{ color: colors.text.primary }}>
                        {formatDate(course.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Curriculum — Modules & Sessions */}
                  {(() => {
                    const modules = (course.courseCourseModules || []).sort(
                      (a, b) => a.moduleNumber - b.moduleNumber,
                    );
                    const totalSessions = modules.reduce(
                      (sum, m) =>
                        sum + (m.courseModuleCourseSessions?.length || 0),
                      0,
                    );
                    if (modules.length === 0) return null;
                    return (
                      <div
                        className="p-4 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p
                            className="text-sm font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {t("adminDashboard.courses.curriculum")}
                          </p>
                          <span
                            className="text-xs"
                            style={{ color: colors.text.secondary }}
                          >
                            {modules.length}{" "}
                            {t("adminDashboard.courses.modules")} ·{" "}
                            {totalSessions}{" "}
                            {t("adminDashboard.courses.sessions")}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {modules.map((mod) => {
                            const isExp =
                              expandedModules[mod.courseModuleId ?? mod.id];
                            const sessions = (
                              mod.courseModuleCourseSessions || []
                            ).sort((a, b) => a.sessionNumber - b.sessionNumber);
                            return (
                              <div
                                key={mod.courseModuleId ?? mod.id}
                                className="rounded-xl overflow-hidden border"
                                style={{
                                  borderColor: colors.border.light,
                                }}
                              >
                                <button
                                  type="button"
                                  className="w-full flex items-center justify-between p-3 text-left"
                                  style={{
                                    backgroundColor: colors.background.light,
                                  }}
                                  onClick={() =>
                                    toggleModule(mod.courseModuleId ?? mod.id)
                                  }
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div
                                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{
                                        backgroundColor: colors.primary.main,
                                        color: "#fff",
                                      }}
                                    >
                                      <span className="text-xs font-bold">
                                        {mod.moduleNumber}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className="font-medium text-sm truncate"
                                        style={{
                                          color: colors.text.primary,
                                        }}
                                      >
                                        {mod.moduleTitle}
                                      </p>
                                      <p
                                        className="text-xs"
                                        style={{
                                          color: colors.text.tertiary,
                                        }}
                                      >
                                        {sessions.length}{" "}
                                        {t("adminDashboard.courses.sessions")}
                                      </p>
                                    </div>
                                  </div>
                                  {isExp ? (
                                    <CaretUp
                                      size={16}
                                      weight="bold"
                                      style={{
                                        color: colors.text.secondary,
                                      }}
                                    />
                                  ) : (
                                    <CaretDown
                                      size={16}
                                      weight="bold"
                                      style={{
                                        color: colors.text.secondary,
                                      }}
                                    />
                                  )}
                                </button>
                                {isExp && (
                                  <div
                                    className="px-3 pb-3 pt-2"
                                    style={{
                                      backgroundColor: colors.background.light,
                                    }}
                                  >
                                    {mod.moduleDescription && (
                                      <p
                                        className="text-xs mb-2 leading-relaxed"
                                        style={{
                                          color: colors.text.secondary,
                                        }}
                                      >
                                        {mod.moduleDescription}
                                      </p>
                                    )}
                                    {mod.moduleOutcomes && (
                                      <div className="mb-2">
                                        <p
                                          className="text-xs font-medium mb-1"
                                          style={{ color: colors.text.primary }}
                                        ></p>
                                        <div className="flex flex-col gap-1">
                                          {mod.moduleOutcomes
                                            .split(/[;\n]+/)
                                            .filter((o) => o.trim())
                                            .map((outcome, i) => (
                                              <div
                                                key={i}
                                                className="flex items-start gap-1"
                                              >
                                                <ArrowRightIcon
                                                  size={11}
                                                  weight="fill"
                                                  className="flex-shrink-0 mt-0.5"
                                                  style={{
                                                    color: colors.state.success,
                                                  }}
                                                />
                                                <span
                                                  className="text-xs"
                                                  style={{
                                                    color:
                                                      colors.text.secondary,
                                                  }}
                                                >
                                                  {outcome.trim()}
                                                </span>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                    {sessions.length === 0 ? (
                                      <p
                                        className="text-xs text-center py-2"
                                        style={{
                                          color: colors.text.tertiary,
                                        }}
                                      >
                                        {t("adminDashboard.courses.noSessions")}
                                      </p>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {sessions.map((sess) => {
                                          const sessId =
                                            sess.courseSessionId ?? sess.id;
                                          const isResExp =
                                            expandedSessions[sessId];
                                          const resources =
                                            sessionResources[sessId] || [];
                                          const isResLoading =
                                            loadingResources[sessId];
                                          return (
                                            <div
                                              key={
                                                sess.courseSessionId ?? sess.id
                                              }
                                              className="rounded-lg p-2.5"
                                              style={{
                                                backgroundColor:
                                                  colors.background.gray,
                                              }}
                                            >
                                              <div className="flex items-start gap-2">
                                                <div
                                                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                                  style={{
                                                    backgroundColor:
                                                      colors.background
                                                        .primaryLight,
                                                  }}
                                                >
                                                  <Play
                                                    size={10}
                                                    weight="fill"
                                                    style={{
                                                      color:
                                                        colors.primary.main,
                                                    }}
                                                  />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p
                                                    className="font-medium text-xs"
                                                    style={{
                                                      color:
                                                        colors.text.primary,
                                                    }}
                                                  >
                                                    {sess.sessionNumber
                                                      ? `${sess.sessionNumber}. `
                                                      : ""}
                                                    {sess.sessionTitle}
                                                  </p>
                                                  {sess.sessionDescription && (
                                                    <p
                                                      className="text-xs mt-0.5 leading-relaxed"
                                                      style={{
                                                        color:
                                                          colors.text.secondary,
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
                                                          color:
                                                            colors.text.primary,
                                                        }}
                                                      ></p>
                                                      <div className="flex flex-col gap-0.5">
                                                        {sess.sessionOutcomes
                                                          .split(/[;\n]+/)
                                                          .filter((o) =>
                                                            o.trim(),
                                                          )
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
                                                    <div className="mt-1.5">
                                                      <button
                                                        type="button"
                                                        className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md"
                                                        style={{
                                                          color:
                                                            colors.primary.main,
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
                                                          size={12}
                                                          weight="fill"
                                                        />
                                                        {t(
                                                          "courses.detail.resources.label",
                                                        )}
                                                        {isResExp ? (
                                                          <CaretUp
                                                            size={10}
                                                            weight="bold"
                                                          />
                                                        ) : (
                                                          <CaretDown
                                                            size={10}
                                                            weight="bold"
                                                          />
                                                        )}
                                                      </button>
                                                      {isResExp && (
                                                        <div className="mt-1.5 space-y-1">
                                                          {isResLoading ? (
                                                            <div className="flex items-center gap-1.5 py-1">
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
                                                            resources.map(
                                                              (res) => (
                                                                <div
                                                                  key={res.id}
                                                                  className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                                                                  style={{
                                                                    backgroundColor:
                                                                      colors
                                                                        .background
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
                                                                        colors
                                                                          .text
                                                                          .primary,
                                                                    }}
                                                                  >
                                                                    {res.title}
                                                                  </span>
                                                                  <Chip
                                                                    size="sm"
                                                                    variant="flat"
                                                                    className="h-4"
                                                                    style={{
                                                                      fontSize:
                                                                        "10px",
                                                                    }}
                                                                  >
                                                                    {
                                                                      res.resourceType
                                                                    }
                                                                  </Chip>
                                                                  <a
                                                                    href={
                                                                      res.url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    title={t(
                                                                      "courses.detail.resources.open",
                                                                    )}
                                                                  >
                                                                    <ArrowSquareOut
                                                                      size={13}
                                                                      style={{
                                                                        color:
                                                                          colors
                                                                            .primary
                                                                            .main,
                                                                      }}
                                                                    />
                                                                  </a>
                                                                </div>
                                                              ),
                                                            )
                                                          )}
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
                      </div>
                    );
                  })()}

                  {/* Student Reviews */}
                  <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <p
                        className="text-sm font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {t("studentDashboard.myCourses.courseReview")}
                      </p>
                      {reviews.length > 0 && (
                        <span
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          ({reviews.length})
                        </span>
                      )}
                    </div>

                    {reviewsLoading ? (
                      <div className="flex justify-center py-4">
                        <Spinner size="sm" color="primary" />
                      </div>
                    ) : reviews.length === 0 ? (
                      <p
                        className="text-xs text-center py-3"
                        style={{ color: colors.text.tertiary }}
                      >
                        {t("courses.detail.noReviews")}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="p-3 rounded-xl"
                            style={{ backgroundColor: colors.background.light }}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
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
                                className="w-7 h-7 text-xs flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-xs font-medium"
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
                                    ? formatDate(review.createdAt)
                                    : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={12}
                                    weight={
                                      s <= review.rating ? "fill" : "regular"
                                    }
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
                                className="text-xs leading-relaxed"
                                style={{ color: colors.text.secondary }}
                              >
                                {review.comment}
                              </p>
                            )}
                          </div>
                        ))}

                        {reviewsHasMore && (
                          <div className="flex justify-center mt-1">
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
                  </div>
                </div>
              )
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminCourseDetail;
