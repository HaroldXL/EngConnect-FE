import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Image,
  Skeleton,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
  Spinner,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";
import { coursesApi, tutorApi } from "../../../api";
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
} from "@phosphor-icons/react";

const AdminCourseVerificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { textareaClassNames } = useInputStyles();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [tutorInfo, setTutorInfo] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedSessions, setExpandedSessions] = useState({});
  const [sessionResources, setSessionResources] = useState({});
  const [loadingResources, setLoadingResources] = useState({});

  // Review modal
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

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
    const fetchDetail = async () => {
      setLoading(true);
      try {
        // Fetch request by listing all and finding by id
        const reqRes = await coursesApi.getCourseVerificationRequests({
          page: 1,
          "page-size": 1000,
        });
        const found = (reqRes.data.items || []).find((r) => r.id === id);
        if (found) {
          setRequest(found);
          if (found.courseId) {
            const courseRes = await coursesApi.getCourseById(found.courseId);
            setCourse(courseRes.data);
            if (courseRes.data?.tutorId) {
              try {
                const tutorRes = await tutorApi.getTutorById(
                  courseRes.data.tutorId,
                );
                setTutorInfo(tutorRes.data);
              } catch (_) {}
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch verification detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Pending":
        return "warning";
      case "Rejected":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "Approved":
        return t("adminDashboard.courseVerification.approved");
      case "Pending":
        return t("adminDashboard.courseVerification.pending");
      case "Rejected":
        return t("adminDashboard.courseVerification.rejected");
      default:
        return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t("adminDashboard.courseVerification.nA");
    return new Date(dateStr).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  const handleReviewClick = (action) => {
    setReviewAction(action);
    setRejectionReason("");
    setIsReviewOpen(true);
  };

  const handleReviewConfirm = async () => {
    if (!id) return;
    setReviewing(true);
    try {
      await coursesApi.reviewCourseVerificationRequest(id, {
        requestId: id,
        approved: reviewAction === "approve",
        rejectionReason: reviewAction === "reject" ? rejectionReason : null,
      });
      addToast({
        title:
          reviewAction === "approve"
            ? t("adminDashboard.courseVerification.approveSuccess")
            : t("adminDashboard.courseVerification.rejectSuccess"),
        color: "success",
      });
      navigate("/admin/course-verification");
    } catch (error) {
      addToast({
        title:
          reviewAction === "approve"
            ? t("adminDashboard.courseVerification.approveFailed")
            : t("adminDashboard.courseVerification.rejectFailed"),
        color: "danger",
      });
    } finally {
      setReviewing(false);
    }
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
          onPress={() => navigate("/admin/course-verification")}
        >
          <ArrowLeft size={20} style={{ color: colors.text.primary }} />
        </Button>
        <h1
          className="text-2xl lg:text-3xl font-bold"
          style={{ color: colors.text.primary }}
        >
          {t("adminDashboard.courseVerification.requestDetails")}
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
          <CardBody className="p-6">
            {loading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-5 rounded-lg" />
                  ))}
                </div>
                <div className="flex gap-4">
                  <Skeleton className="w-24 h-16 rounded-lg" />
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
              </div>
            ) : (
              request && (
                <div className="space-y-4">
                  {/* Request info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span style={{ color: colors.text.secondary }}>
                        {t("adminDashboard.courseVerification.requestId")}:{" "}
                      </span>
                      <span
                        className="font-mono"
                        style={{ color: colors.text.primary }}
                      >
                        {request.id?.slice(0, 12)}...
                      </span>
                    </div>
                    <div>
                      <span style={{ color: colors.text.secondary }}>
                        {t("adminDashboard.courseVerification.statusLabel")}
                        :{" "}
                      </span>
                      <Chip
                        size="sm"
                        color={getStatusColor(request.status)}
                        variant="flat"
                      >
                        {getStatusLabel(request.status)}
                      </Chip>
                    </div>
                    <div>
                      <span style={{ color: colors.text.secondary }}>
                        {t("adminDashboard.courseVerification.submittedAt")}
                        :{" "}
                      </span>
                      <span style={{ color: colors.text.primary }}>
                        {formatDate(request.submittedAt)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: colors.text.secondary }}>
                        {t("adminDashboard.courseVerification.reviewedAt")}
                        :{" "}
                      </span>
                      <span style={{ color: colors.text.primary }}>
                        {formatDate(request.reviewedAt)}
                      </span>
                    </div>
                    {request.rejectionReason && (
                      <div className="col-span-2">
                        <span style={{ color: colors.text.secondary }}>
                          {t(
                            "adminDashboard.courseVerification.rejectionReason",
                          )}
                          :{" "}
                        </span>
                        <span style={{ color: colors.state.error }}>
                          {request.rejectionReason}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Course info */}
                  {course && (
                    <div
                      className="p-4 rounded-xl space-y-3"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <p
                        className="font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("adminDashboard.courseVerification.courseInfo")}
                      </p>
                      {/* Header */}
                      <div className="flex gap-4">
                        <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
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
                                backgroundColor: colors.background.light,
                              }}
                            >
                              <BookOpen
                                className="w-6 h-6"
                                style={{ color: colors.text.secondary }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold"
                            style={{ color: colors.text.primary }}
                          >
                            {course.title}
                          </p>
                          {course.shortDescription && (
                            <p
                              className="text-sm mt-1"
                              style={{ color: colors.text.secondary }}
                            >
                              {course.shortDescription}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
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
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{
                            backgroundColor: colors.background.light,
                          }}
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
                                  backgroundColor:
                                    colors.background.primaryLight,
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
                        </div>
                      )}
                      {/* Full Description */}
                      {(course.fullDescription || course.description) && (
                        <div>
                          <p
                            className="text-xs font-medium mb-1"
                            style={{ color: colors.text.primary }}
                          >
                            {t("adminDashboard.courses.fullDescription")}
                          </p>
                          <p
                            className="text-xs leading-relaxed"
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
                            className="text-xs font-medium mb-1"
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
                                    size={12}
                                    weight="fill"
                                    style={{ color: colors.state.success }}
                                  />
                                  <span
                                    className="text-xs"
                                    style={{ color: colors.text.secondary }}
                                  >
                                    {outcome.trim()}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      {/* Demo Video */}
                      {course.demoVideoUrl && (
                        <div>
                          <p
                            className="text-xs font-medium mb-1"
                            style={{ color: colors.text.primary }}
                          >
                            {t("adminDashboard.courses.demoVideo")}
                          </p>
                          <video
                            src={course.demoVideoUrl}
                            controls
                            className="w-full rounded-lg"
                            style={{ maxHeight: 200 }}
                          />
                        </div>
                      )}
                      {/* Stats grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div
                          className="p-2 rounded-lg text-center"
                          style={{
                            backgroundColor: colors.background.light,
                          }}
                        >
                          <p
                            className="font-bold text-sm"
                            style={{ color: colors.state.success }}
                          >
                            {course.price != null
                              ? new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(course.price)
                              : "N/A"}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            {t("adminDashboard.courses.table.price")}
                          </p>
                        </div>
                        <div
                          className="p-2 rounded-lg text-center"
                          style={{
                            backgroundColor: colors.background.light,
                          }}
                        >
                          <p
                            className="font-bold text-sm"
                            style={{ color: colors.text.primary }}
                          >
                            {course.level || course.courseLevel || "N/A"}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            {t("adminDashboard.courses.table.level")}
                          </p>
                        </div>
                        <div
                          className="p-2 rounded-lg text-center"
                          style={{
                            backgroundColor: colors.background.light,
                          }}
                        >
                          <p
                            className="font-bold text-sm"
                            style={{ color: colors.text.primary }}
                          >
                            {(course.courseCourseModules || []).length}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            {t("adminDashboard.courses.modules")}
                          </p>
                        </div>
                        <div
                          className="p-2 rounded-lg text-center"
                          style={{
                            backgroundColor: colors.background.light,
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Star
                              size={14}
                              weight="fill"
                              style={{ color: colors.state.warning }}
                            />
                            <p
                              className="font-bold text-sm"
                              style={{ color: colors.text.primary }}
                            >
                              {course.ratingAverage ?? "N/A"}
                            </p>
                          </div>
                          <p
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            {t("adminDashboard.courses.rating")} (
                            {course.ratingCount ?? 0})
                          </p>
                        </div>
                      </div>
                      {/* Extra info */}
                      <div
                        className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs p-2 rounded-lg"
                        style={{
                          backgroundColor: colors.background.light,
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Users
                            size={14}
                            style={{ color: colors.text.secondary }}
                          />
                          <div>
                            <p style={{ color: colors.text.tertiary }}>
                              {t("adminDashboard.courses.enrollments")}
                            </p>
                            <p style={{ color: colors.text.primary }}>
                              {course.numberOfEnrollment ?? 0}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarBlank
                            size={14}
                            style={{ color: colors.text.secondary }}
                          />
                          <div>
                            <p style={{ color: colors.text.tertiary }}>
                              {t("adminDashboard.courses.sessionsPerWeek")}
                            </p>
                            <p style={{ color: colors.text.primary }}>
                              {course.numsSessionInWeek ?? "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <VideoCamera
                            size={14}
                            style={{ color: colors.text.secondary }}
                          />
                          <div>
                            <p style={{ color: colors.text.tertiary }}>
                              {t("adminDashboard.courses.totalSessions")}
                            </p>
                            <p style={{ color: colors.text.primary }}>
                              {course.numberOfSessions ?? 0}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock
                            size={14}
                            style={{ color: colors.text.secondary }}
                          />
                          <div>
                            <p style={{ color: colors.text.tertiary }}>
                              {t("adminDashboard.courses.estimatedTime")}
                            </p>
                            <p style={{ color: colors.text.primary }}>
                              {course.estimatedTime || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock
                            size={14}
                            style={{ color: colors.text.secondary }}
                          />
                          <div>
                            <p style={{ color: colors.text.tertiary }}>
                              {t("adminDashboard.courses.estimatedTimeLesson")}
                            </p>
                            <p style={{ color: colors.text.primary }}>
                              {course.estimatedTimeLesson || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Certificate
                            size={14}
                            style={{ color: colors.text.secondary }}
                          />
                          <div>
                            <p style={{ color: colors.text.tertiary }}>
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

                      {/* Curriculum */}
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
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
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
                                ).sort(
                                  (a, b) => a.sessionNumber - b.sessionNumber,
                                );
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
                                        backgroundColor:
                                          colors.background.light,
                                      }}
                                      onClick={() =>
                                        toggleModule(
                                          mod.courseModuleId ?? mod.id,
                                        )
                                      }
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div
                                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                          style={{
                                            backgroundColor:
                                              colors.primary.main,
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
                                            {t(
                                              "adminDashboard.courses.sessions",
                                            )}
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
                                          backgroundColor:
                                            colors.background.light,
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
                                              style={{
                                                color: colors.text.primary,
                                              }}
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
                                                        color:
                                                          colors.state.success,
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
                                            {t(
                                              "adminDashboard.courses.noSessions",
                                            )}
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
                                                  key={sessId}
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
                                                              colors.text
                                                                .secondary,
                                                          }}
                                                        >
                                                          {
                                                            sess.sessionDescription
                                                          }
                                                        </p>
                                                      )}
                                                      {sess.sessionOutcomes && (
                                                        <div className="mt-1.5">
                                                          <p
                                                            className="text-xs font-medium mb-1"
                                                            style={{
                                                              color:
                                                                colors.text
                                                                  .primary,
                                                            }}
                                                          ></p>
                                                          <div className="flex flex-col gap-0.5">
                                                            {sess.sessionOutcomes
                                                              .split(/[;\n]+/)
                                                              .filter((o) =>
                                                                o.trim(),
                                                              )
                                                              .map(
                                                                (
                                                                  outcome,
                                                                  i,
                                                                ) => (
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
                                                                          colors
                                                                            .state
                                                                            .success,
                                                                      }}
                                                                    />
                                                                    <span
                                                                      className="text-xs"
                                                                      style={{
                                                                        color:
                                                                          colors
                                                                            .text
                                                                            .secondary,
                                                                      }}
                                                                    >
                                                                      {outcome.trim()}
                                                                    </span>
                                                                  </div>
                                                                ),
                                                              )}
                                                          </div>
                                                        </div>
                                                      )}
                                                      {/* Resources toggle */}
                                                      <div className="mt-1.5">
                                                        <button
                                                          type="button"
                                                          className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md"
                                                          style={{
                                                            color:
                                                              colors.primary
                                                                .main,
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
                                                            "adminDashboard.courses.sessionResources",
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
                                                                      colors
                                                                        .text
                                                                        .tertiary,
                                                                  }}
                                                                >
                                                                  {t(
                                                                    "adminDashboard.courses.loadingResources",
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
                                                                  "adminDashboard.courses.noResources",
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
                                                                      {
                                                                        res.title
                                                                      }
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
                                                                        "adminDashboard.courses.sessionResources",
                                                                      )}
                                                                    >
                                                                      <ArrowSquareOut
                                                                        size={
                                                                          13
                                                                        }
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
                    </div>
                  )}

                  {/* Action buttons for Pending */}
                  {request.status === "Pending" && (
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        color="danger"
                        variant="flat"
                        onPress={() => handleReviewClick("reject")}
                      >
                        {t("adminDashboard.courseVerification.reject")}
                      </Button>
                      <Button
                        style={{
                          backgroundColor: colors.state.success,
                          color: colors.text.white,
                        }}
                        onPress={() => handleReviewClick("approve")}
                      >
                        {t("adminDashboard.courseVerification.approve")}
                      </Button>
                    </div>
                  )}
                </div>
              )
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        size="md"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.courseVerification.reviewRequest")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {reviewAction === "approve"
                    ? t("adminDashboard.courseVerification.approveConfirm")
                    : t("adminDashboard.courseVerification.rejectConfirm")}
                </p>
                {reviewAction === "reject" && (
                  <Textarea
                    label={t(
                      "adminDashboard.courseVerification.rejectionReason",
                    )}
                    placeholder={t(
                      "adminDashboard.courseVerification.rejectionReasonPlaceholder",
                    )}
                    value={rejectionReason}
                    onValueChange={setRejectionReason}
                    classNames={textareaClassNames}
                    className="mt-3"
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={reviewing}
                >
                  {t("adminDashboard.courseVerification.cancel")}
                </Button>
                <Button
                  color={reviewAction === "approve" ? "success" : "danger"}
                  onPress={handleReviewConfirm}
                  isLoading={reviewing}
                  isDisabled={
                    reviewAction === "reject" && !rejectionReason.trim()
                  }
                >
                  {t("adminDashboard.courseVerification.confirm")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AdminCourseVerificationDetail;
