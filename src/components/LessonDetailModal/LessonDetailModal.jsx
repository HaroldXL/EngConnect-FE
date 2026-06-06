import { useState, useEffect, useCallback } from "react";
import {
  AltArrowRight,
  CalendarMark,
  CircleBottomUp,
  ClockCircle,
  DangerTriangle,
  Diploma,
  DocumentText,
  Dollar,
  LinkMinimalistic,
  MenuDots,
  Play,
  Record,
  RecordAudioCircle,
  Restart,
  Videocamera,
} from "@solar-icons/react";
import { useSelector } from "react-redux";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Avatar,
  useDisclosure,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { useThemeColors } from "../../hooks/useThemeColors";

import { coursesApi, makeupApi, rescheduleApi, studentApi } from "../../api";
import { selectUser } from "../../store";
import VideoModal from "../VideoModal/VideoModal";
import TutorRescheduleOfferModal from "../TutorRescheduleOfferModal/TutorRescheduleOfferModal";
import TutorRescheduleTicketModal from "../TutorRescheduleTicketModal/TutorRescheduleTicketModal";
import StudentRescheduleAcceptModal from "../StudentRescheduleAcceptModal/StudentRescheduleAcceptModal";
import StudentRescheduleRequestModal from "../StudentRescheduleRequestModal/StudentRescheduleRequestModal";
import LessonSummaryModal from "../LessonSummaryModal/LessonSummaryModal";
import LessonQuizModal from "../LessonQuizModal/LessonQuizModal";
import MakeupRequestModal from "../MakeupRequestModal/MakeupRequestModal";
import LessonRatingModal from "../LessonRatingModal/LessonRatingModal";
import LessonRatingDisplay from "../LessonRatingModal/LessonRatingDisplay";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const getLessonBlockColor = (status) => {
  switch (status) {
    case "Scheduled":
      return { bg: "#DCFCE7", border: "#22C55E", text: "#166534" };
    case "InProgress":
    case "Reschedule":
      return { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" };
    case "Completed":
    case "Settled":
      return { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" };
    case "Cancelled":
    case "NoStudent":
    case "NoTutor":
      return { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" };
    case "Refund":
      return { bg: "#FEF3C7", border: "#F97316", text: "#92400E" };
    default:
      return { bg: "#F3F4F6", border: "#9CA3AF", text: "#374151" };
  }
};

const LessonDetailModal = ({
  isOpen,
  onClose,
  lesson,
  role = "tutor",
  onReschedule,
  rescheduleDeadline,
  hasPendingOffer,
  onRefresh,
  onRefundRequest,
}) => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const isStudentView = role === "student";

  const user = useSelector(selectUser);

  const [lessonExtra, setLessonExtra] = useState(null);
  const [lessonExtraLoading, setLessonExtraLoading] = useState(false);

  const [rescheduleOffers, setRescheduleOffers] = useState([]);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  const [computedDeadline, setComputedDeadline] = useState(null);

  const {
    isOpen: isOfferOpen,
    onOpen: onOfferOpen,
    onClose: onOfferClose,
  } = useDisclosure();
  const {
    isOpen: isTicketOpen,
    onOpen: onTicketOpen,
    onClose: onTicketClose,
  } = useDisclosure();
  const {
    isOpen: isAcceptOpen,
    onOpen: onAcceptOpen,
    onClose: onAcceptClose,
  } = useDisclosure();
  const {
    isOpen: isRequestOpen,
    onOpen: onRequestOpen,
    onClose: onRequestClose,
  } = useDisclosure();

  const {
    isOpen: isViewReqOpen,
    onOpen: onViewReqOpen,
    onClose: onViewReqClose,
  } = useDisclosure();

  const {
    isOpen: isViewOfferOpen,
    onOpen: onViewOfferOpen,
    onClose: onViewOfferClose,
  } = useDisclosure();

  const {
    isOpen: isStudentReqOpen,
    onOpen: onStudentReqOpen,
    onClose: onStudentReqClose,
  } = useDisclosure();

  const {
    isOpen: isMakeupOpen,
    onOpen: onMakeupOpen,
    onClose: onMakeupClose,
  } = useDisclosure();
  const {
    isOpen: isMakeupReviewOpen,
    onOpen: onMakeupReviewOpen,
    onClose: onMakeupReviewClose,
  } = useDisclosure();
  const {
    isOpen: isMyMakeupOpen,
    onOpen: onMyMakeupOpen,
    onClose: onMyMakeupClose,
  } = useDisclosure();
  const {
    isOpen: isAbsenceActionOpen,
    onOpen: onAbsenceActionOpen,
    onClose: onAbsenceActionClose,
  } = useDisclosure();
  const [studentReqRejecting, setStudentReqRejecting] = useState(false);
  const [studentReqRejectNote, setStudentReqRejectNote] = useState("");
  const [studentReqProcessing, setStudentReqProcessing] = useState(false);

  const [makeupRequests, setMakeupRequests] = useState([]);
  const [makeupDeadline, setMakeupDeadline] = useState(null);
  const [makeupReviewRejecting, setMakeupReviewRejecting] = useState(false);
  const [makeupReviewRejectNote, setMakeupReviewRejectNote] = useState("");
  const [makeupReviewProcessing, setMakeupReviewProcessing] = useState(false);

  const {
    isOpen: isVideoOpen,
    onOpen: onVideoOpen,
    onOpenChange: onVideoOpenChange,
  } = useDisclosure();
  const [videoUrl, setVideoUrl] = useState("");

  const {
    isOpen: isSummaryOpen,
    onOpen: onSummaryOpen,
    onClose: onSummaryClose,
  } = useDisclosure();

  const {
    isOpen: isQuizOpen,
    onOpen: onQuizOpen,
    onClose: onQuizClose,
  } = useDisclosure();

  // Lesson rating
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [localRating, setLocalRating] = useState(null);

  const fetchRescheduleData = useCallback(async () => {
    if (!lesson || !isOpen) return;
    try {
      if (!isStudentView && user?.tutorId) {
        const [offersRes, requestsRes] = await Promise.allSettled([
          rescheduleApi.getOffers({ TutorId: user.tutorId, "page-size": 200 }),
          rescheduleApi.getRequests({ "page-size": 200 }),
        ]);
        setRescheduleOffers(
          offersRes.status === "fulfilled"
            ? offersRes.value?.data?.items || []
            : [],
        );
        setRescheduleRequests(
          requestsRes.status === "fulfilled"
            ? requestsRes.value?.data?.items || []
            : [],
        );
      } else if (isStudentView && user?.studentId) {
        const [offersRes, requestsRes] = await Promise.allSettled([
          rescheduleApi.getOffers({
            StudentId: user.studentId,
            "page-size": 200,
          }),
          rescheduleApi.getRequests({
            StudentId: user.studentId,
            "page-size": 200,
          }),
        ]);
        setRescheduleOffers(
          offersRes.status === "fulfilled"
            ? offersRes.value?.data?.items || []
            : [],
        );
        setRescheduleRequests(
          requestsRes.status === "fulfilled"
            ? requestsRes.value?.data?.items || []
            : [],
        );
      }

      // Fetch makeup requests for this lesson
      try {
        const makeupRes = await makeupApi.getRequests({
          LessonId: lesson.id,
          "page-size": 20,
        });
        setMakeupRequests(makeupRes?.data?.items || []);
      } catch {
        setMakeupRequests([]);
      }

      const needRescheduleDeadline =
        !rescheduleDeadline &&
        (lesson.status === "NoTutor" || lesson.status === "Reschedule") &&
        lesson.studentId;

      const needMakeupDeadline =
        ((isStudentView && lesson.status === "NoStudent") ||
          (!isStudentView && lesson.status === "NoTutor")) &&
        lesson.courseId &&
        lesson.studentId;

      if (needRescheduleDeadline || needMakeupDeadline) {
        try {
          const lessonsRes = await studentApi.getLessons({
            StudentId: lesson.studentId,
            "page-size": 200,
          });
          const allLessons = lessonsRes?.data?.items || [];

          if (needRescheduleDeadline) {
            const next = allLessons
              .filter(
                (l) =>
                  l.courseId === lesson.courseId &&
                  new Date(l.startTime) > new Date(lesson.startTime),
              )
              .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
            setComputedDeadline(
              next
                ? new Date(
                    new Date(next.startTime).getTime() - 24 * 60 * 60 * 1000,
                  )
                : null,
            );
          } else {
            setComputedDeadline(null);
          }

          if (needMakeupDeadline) {
            const nextCourse = allLessons
              .filter(
                (l) =>
                  l.courseId === lesson.courseId &&
                  new Date(l.startTime) > new Date(lesson.startTime),
              )
              .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
            setMakeupDeadline(
              nextCourse
                ? new Date(
                    new Date(nextCourse.startTime).getTime() -
                      24 * 60 * 60 * 1000,
                  )
                : null,
            );
          } else {
            setMakeupDeadline(null);
          }
        } catch {
          setComputedDeadline(null);
          setMakeupDeadline(null);
        }
      } else {
        setComputedDeadline(null);
        setMakeupDeadline(null);
      }
    } catch {
      // silently ignore
    }
  }, [
    lesson,
    isOpen,
    isStudentView,
    user?.tutorId,
    user?.studentId,
    rescheduleDeadline,
  ]);

  useEffect(() => {
    fetchRescheduleData();
  }, [fetchRescheduleData]);

  // Sync local rating from lesson
  useEffect(() => {
    if (!isOpen) {
      setLocalRating(null);
      return;
    }
    const existing = Array.isArray(lesson?.lessonRatings)
      ? lesson.lessonRatings[0] || null
      : null;
    setLocalRating(existing);
  }, [isOpen, lesson]);

  useEffect(() => {
    if (!lesson || !isOpen) {
      setLessonExtra(null);
      return;
    }
    if (lesson.moduleId || lesson.sessionId) {
      setLessonExtraLoading(true);
      Promise.all([
        lesson.moduleId
          ? coursesApi.getCourseModuleById(lesson.moduleId)
          : null,
        lesson.sessionId
          ? coursesApi.getCourseSessionById(lesson.sessionId)
          : null,
        lesson.sessionId
          ? coursesApi.getAllCourseResources({
              CourseSessionId: lesson.sessionId,
            })
          : null,
      ])
        .then(([moduleRes, sessionRes, resourcesRes]) => {
          setLessonExtra({
            moduleTitle: moduleRes?.data?.title || null,
            sessionDescription: sessionRes?.data?.description || null,
            resources: resourcesRes?.data?.items || resourcesRes?.data || [],
          });
        })
        .catch(() => setLessonExtra(null))
        .finally(() => setLessonExtraLoading(false));
    }
  }, [lesson, isOpen]);

  const formatLessonTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLessonStatusLabel = (status) => {
    const ns = isStudentView
      ? "studentDashboard.schedule"
      : "tutorDashboard.schedule.lessonStatus";
    switch (status) {
      case "Scheduled":
        return t(`${ns}.scheduled`);
      case "Completed":
      case "Settled":
        return t(`${ns}.completed`);
      case "Cancelled":
        return t(`${ns}.cancelled`);
      case "Refund":
        return t(`${ns}.refund`);
      case "InProgress":
        return t(`${ns}.inProgress`);
      case "NoStudent":
        return t(`${ns}.noStudent`);
      case "NoTutor":
        return t(`${ns}.noTutor`);
      case "Reschedule":
        return isStudentView
          ? t("studentDashboard.schedule.rescheduleStatus")
          : t("tutorDashboard.schedule.lessonStatus.reschedule");
      default:
        return status || "";
    }
  };

  const getMeetingStatusInfo = (l) => {
    if (l.meetingStatus === "Waiting")
      return {
        label: t("tutorDashboard.schedule.meetingWaiting"),
        color: colors.state.warning,
      };
    if (l.meetingStatus === "InProgress")
      return {
        label: t("tutorDashboard.schedule.meetingInProgress"),
        color: colors.state.success,
      };
    if (l.meetingStatus === "Ended")
      return {
        label: t("tutorDashboard.schedule.meetingEnded"),
        color: colors.state.success,
      };
    return null;
  };

  const canJoinLesson = (l) =>
    l.meetingStatus === "InProgress" ||
    (l.meetingStatus === "Waiting" &&
      l.status !== "Completed" &&
      l.status !== "Settled" &&
      l.status !== "Reschedule" &&
      l.status !== "Refund");

  const studentFullName = (l) =>
    [l.studentFirstName, l.studentLastName].filter(Boolean).join(" ");

  const tutorFullName = (l) =>
    [l.tutorFirstName, l.tutorLastName].filter(Boolean).join(" ");

  const personName = isStudentView
    ? tutorFullName(lesson || {})
    : studentFullName(lesson || {});
  const personAvatar = isStudentView
    ? lesson?.tutorAvatar
    : lesson?.studentAvatar;
  const personLabel = isStudentView
    ? t("studentDashboard.schedule.tutor")
    : t("tutorDashboard.schedule.studentLabel");
  const courseLink = isStudentView
    ? `/student/courses/${lesson?.courseId}`
    : `/tutor/courses/${lesson?.courseId}`;
  const personProfileLink = isStudentView
    ? lesson?.tutorId
      ? `/tutor-profile/${lesson.tutorId}`
      : null
    : lesson?.studentId
      ? `/tutor/students/${lesson.studentId}`
      : null;

  if (!lesson) return null;

  const blockColor = getLessonBlockColor(lesson.status);
  const startDate = new Date(lesson.startTime);
  const endDate = new Date(lesson.endTime);
  const durationMin = Math.round((endDate - startDate) / 60000);
  const meetingInfo = getMeetingStatusInfo(lesson);
  const hasRecording = lesson.lessonRecord?.recordUrl;
  const recordDuration = lesson.lessonRecord?.durationSeconds;

  // Reschedule computed state
  const internalShowTutorReschedule =
    !isStudentView &&
    (lesson.status === "Reschedule" ||
      lesson.status === "NoTutor" ||
      (lesson.status === "Scheduled" &&
        (new Date(lesson.startTime) - new Date()) / (1000 * 60 * 60) > 24));

  const internalHasPendingOffer = rescheduleOffers.some(
    (o) => o.lessonId === lesson.id && o.status === "PendingStudentChoice",
  );

  const internalPendingOffer = isStudentView
    ? rescheduleOffers.find(
        (o) => o.lessonId === lesson.id && o.status === "PendingStudentChoice",
      ) || null
    : null;

  const internalCanRequestReschedule =
    isStudentView &&
    lesson.status === "Scheduled" &&
    new Date(lesson.startTime) - new Date() > 24 * 60 * 60 * 1000;

  const internalPendingRequest = isStudentView
    ? rescheduleRequests.find(
        (r) => r.lessonId === lesson.id && r.status === "Pending",
      ) || null
    : null;

  const internalTutorPendingOffer = !isStudentView
    ? rescheduleOffers.find(
        (o) => o.lessonId === lesson.id && o.status === "PendingStudentChoice",
      ) || null
    : null;

  const internalStudentReqForTutor = !isStudentView
    ? rescheduleRequests.find(
        (r) => r.lessonId === lesson.id && r.status === "Pending",
      ) || null
    : null;

  const effectiveDeadline = rescheduleDeadline ?? computedDeadline;

  const internalCanStudentMakeup =
    isStudentView && lesson.status === "NoStudent";
  const internalCanTutorMakeup = !isStudentView && lesson.status === "NoTutor";

  // For tutor+NoTutor, reuse effectiveDeadline (prop-aware) instead of computing separately
  const resolvedMakeupDeadline =
    internalCanTutorMakeup && effectiveDeadline
      ? effectiveDeadline
      : makeupDeadline;
  const makeupDeadlinePassed =
    resolvedMakeupDeadline !== null && resolvedMakeupDeadline < new Date();

  const pendingMakeupReq =
    makeupRequests.find((r) => r.status === "Pending") || null;
  const internalStudentMakeupForTutor =
    !isStudentView &&
    lesson.status === "NoStudent" &&
    pendingMakeupReq?.createdByRole === "Student"
      ? pendingMakeupReq
      : null;
  const internalTutorMakeupForStudent =
    isStudentView &&
    lesson.status === "NoTutor" &&
    pendingMakeupReq?.createdByRole === "Tutor"
      ? pendingMakeupReq
      : null;
  const reviewMakeupReq =
    internalStudentMakeupForTutor || internalTutorMakeupForStudent;

  const autoRefundAt =
    isStudentView && lesson.status === "NoTutor" && lesson.endTime
      ? new Date(new Date(lesson.endTime).getTime() + 3 * 24 * 60 * 60 * 1000)
      : null;
  const showAutoRefundBanner =
    autoRefundAt !== null &&
    autoRefundAt > new Date() &&
    !internalHasPendingOffer &&
    !internalTutorMakeupForStudent;

  const makeupNs = isStudentView
    ? "studentDashboard.schedule.makeup"
    : "tutorDashboard.schedule.makeup";

  const myMakeupRequest = (() => {
    if (!makeupRequests.length) return null;
    if (!internalCanStudentMakeup && !internalCanTutorMakeup) return null;
    const myRole = isStudentView ? "Student" : "Tutor";
    return (
      [...makeupRequests]
        .filter((r) => r.createdByRole === myRole)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ||
      null
    );
  })();

  const myMakeupStatusColor = (() => {
    if (!myMakeupRequest) return colors.text.tertiary;
    if (myMakeupRequest.status === "Accepted") return colors.state.success;
    if (myMakeupRequest.status === "Rejected") return colors.state.error;
    return colors.state.warning;
  })();

  const handleInternalReschedule = () => {
    if (lesson.status === "NoTutor") onTicketOpen();
    else onOfferOpen();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <>
            <ModalHeader
              className="flex items-center gap-3 pb-2"
              style={{ color: colors.text.primary }}
            >
              <div
                className="w-1.5 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: blockColor.border }}
              />
              <div className="min-w-0 flex-1">
                {lesson.courseId ? (
                  <Link
                    to={courseLink}
                    className="text-lg font-bold truncate hover:underline block"
                    style={{ color: colors.primary.main }}
                    onClick={onClose}
                  >
                    {lesson.courseTitle ||
                      t("tutorDashboard.schedule.lessonLabel")}
                  </Link>
                ) : (
                  <p className="text-lg font-bold truncate">
                    {lesson.courseTitle ||
                      t("tutorDashboard.schedule.lessonLabel")}
                  </p>
                )}
                {lessonExtra?.moduleTitle && (
                  <p
                    className="text-sm truncate mt-0.5"
                    style={{ color: colors.text.tertiary }}
                  >
                    <span className="font-medium">
                      {t("tutorDashboard.schedule.moduleLabel")}:
                    </span>{" "}
                    {lessonExtra.moduleTitle}
                  </p>
                )}
                {lesson.sessionTitle && (
                  <p
                    className="text-sm truncate"
                    style={{ color: colors.text.tertiary }}
                  >
                    <span className="font-medium">
                      {t("tutorDashboard.schedule.sessionLabel")}:
                    </span>{" "}
                    {lesson.sessionTitle}
                  </p>
                )}
              </div>
              <Chip
                size="sm"
                style={{
                  backgroundColor: `${blockColor.border}20`,
                  color: blockColor.border,
                }}
              >
                {getLessonStatusLabel(lesson.status)}
              </Chip>
            </ModalHeader>
            <ModalBody className="space-y-1 pt-0">
              {/* Person info */}
              <div
                className={`flex items-center gap-3 p-3 rounded-xl${personProfileLink ? " cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                style={{ backgroundColor: colors.background.gray }}
                role={personProfileLink ? "button" : undefined}
                tabIndex={personProfileLink ? 0 : undefined}
                onClick={
                  personProfileLink
                    ? () => {
                        onClose();
                        navigate(personProfileLink);
                      }
                    : undefined
                }
                onKeyDown={
                  personProfileLink
                    ? (e) => {
                        if (e.key === "Enter") {
                          onClose();
                          navigate(personProfileLink);
                        }
                      }
                    : undefined
                }
              >
                <Avatar
                  src={withCDN(personAvatar)}
                  name={personName}
                  size="md"
                  className="w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {personName}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.tertiary }}
                  >
                    {personLabel}
                  </p>
                </div>
                {personProfileLink && (
                  <AltArrowRight
                    weight="BoldDuotone"
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: colors.text.tertiary }}
                  />
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="text-[11px] font-medium mb-1"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("tutorDashboard.schedule.dateLabel")}
                  </p>
                  <p
                    className="text-sm font-semibold flex items-center gap-1.5"
                    style={{ color: colors.text.primary }}
                  >
                    <CalendarMark
                      weight="BoldDuotone"
                      className="w-4 h-4"
                      style={{ color: colors.primary.main }}
                    />
                    {startDate.toLocaleDateString(dateLocale, {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="text-[11px] font-medium mb-1"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("tutorDashboard.schedule.timeLabel")}
                  </p>
                  <p
                    className="text-sm font-semibold flex items-center gap-1.5"
                    style={{ color: colors.text.primary }}
                  >
                    <ClockCircle
                      weight="BoldDuotone"
                      className="w-4 h-4"
                      style={{ color: colors.primary.main }}
                    />
                    {formatLessonTime(lesson.startTime)} —{" "}
                    {formatLessonTime(lesson.endTime)}
                    <Chip
                      size="sm"
                      className="h-5 ml-1"
                      style={{
                        backgroundColor: `${colors.primary.main}15`,
                        color: colors.primary.main,
                        fontSize: "10px",
                      }}
                    >
                      {durationMin}m
                    </Chip>
                  </p>
                </div>
              </div>

              {/* Session Description & Resources */}
              {lessonExtraLoading ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <MenuDots
                    weight="BoldDuotone"
                    className="w-4 h-4 animate-spin"
                    style={{ color: colors.text.tertiary }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("tutorDashboard.schedule.loadingDetails")}
                  </span>
                </div>
              ) : (
                lessonExtra && (
                  <div className="space-y-3">
                    {lessonExtra.sessionDescription && (
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <p
                          className="text-xs font-semibold mb-1.5 flex items-center gap-1.5"
                          style={{ color: colors.text.tertiary }}
                        >
                          <DocumentText
                            weight="BoldDuotone"
                            className="w-3.5 h-3.5"
                          />
                          {t("tutorDashboard.schedule.sessionDescription")}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {lessonExtra.sessionDescription}
                        </p>
                      </div>
                    )}

                    {Array.isArray(lessonExtra.resources) &&
                      lessonExtra.resources.length > 0 && (
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: colors.background.gray }}
                        >
                          <p
                            className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                            style={{ color: colors.text.tertiary }}
                          >
                            <LinkMinimalistic
                              weight="BoldDuotone"
                              className="w-3.5 h-3.5"
                            />
                            {t("tutorDashboard.schedule.resources")}
                          </p>
                          <div className="space-y-1.5">
                            {lessonExtra.resources.map((r) => (
                              <a
                                key={r.id}
                                href={
                                  r.url?.startsWith("http")
                                    ? r.url
                                    : `${CDN_BASE}${r.url}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm hover:underline"
                                style={{ color: colors.primary.main }}
                              >
                                <DocumentText
                                  weight="BoldDuotone"
                                  className="w-3.5 h-3.5 flex-shrink-0"
                                />
                                {r.title || r.resourceTitle || r.resourceUrl}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )
              )}

              {/* Meeting status */}
              {meetingInfo && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{
                    backgroundColor: `${meetingInfo.color}10`,
                    border: `1px solid ${meetingInfo.color}30`,
                  }}
                >
                  <Record
                    weight="BoldDuotone"
                    className="w-2.5 h-2.5"
                    style={{ color: meetingInfo.color }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: meetingInfo.color }}
                  >
                    {meetingInfo.label}
                  </span>
                  {lesson.meetingStartedAt && (
                    <span
                      className="text-xs ml-auto"
                      style={{ color: colors.text.tertiary }}
                    >
                      {new Date(lesson.meetingStartedAt).toLocaleTimeString(
                        dateLocale,
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                      {lesson.meetingEndedAt && (
                        <>
                          {" "}
                          —{" "}
                          {new Date(lesson.meetingEndedAt).toLocaleTimeString(
                            dateLocale,
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </>
                      )}
                    </span>
                  )}
                </div>
              )}

              {/* Recording */}
              {hasRecording && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    backgroundColor: `${colors.state.success}10`,
                    border: `1px solid ${colors.state.success}25`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${colors.state.success}20` }}
                  >
                    <RecordAudioCircle
                      weight="BoldDuotone"
                      className="w-4 h-4"
                      style={{ color: colors.state.success }}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {t("tutorDashboard.schedule.recordingAvailable")}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("tutorDashboard.schedule.recordingAutoDelete")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    style={{
                      backgroundColor: colors.state.success,
                      color: "#fff",
                    }}
                    startContent={
                      <Play weight="BoldDuotone" className="w-3.5 h-3.5" />
                    }
                    onPress={() => {
                      setVideoUrl(lesson.lessonRecord.recordUrl);
                      onVideoOpen();
                    }}
                  >
                    {t("tutorDashboard.schedule.watchRecording")}
                  </Button>
                </div>
              )}

              {/* Lesson Rating — visible once meeting ended */}
              {lesson.meetingStatus === "Ended" && (
                <LessonRatingDisplay
                  rating={localRating}
                  canEdit={isStudentView}
                  onAdd={() => setRatingModalOpen(true)}
                  onEdit={() => setRatingModalOpen(true)}
                  emptyMessage={
                    isStudentView
                      ? t("lessonRating.studentEmpty")
                      : t("lessonRating.tutorEmpty")
                  }
                />
              )}

              {/* Lesson Summary + Quiz — side by side */}
              {(lesson.lessonScript?.summarizeText ||
                (lesson.lessonScript?.id && role !== "tutor")) && (
                <div
                  className={`grid gap-3 ${lesson.lessonScript?.summarizeText && lesson.lessonScript?.id && role !== "tutor" ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {lesson.lessonScript?.summarizeText && (
                    <div
                      className="flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity text-center"
                      style={{
                        backgroundColor: `${colors.primary.main}10`,
                        border: `1px solid ${colors.primary.main}25`,
                      }}
                      role="button"
                      tabIndex={0}
                      onClick={onSummaryOpen}
                      onKeyDown={(e) => e.key === "Enter" && onSummaryOpen()}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${colors.primary.main}20` }}
                      >
                        <DocumentText
                          weight="BoldDuotone"
                          className="w-4 h-4"
                          style={{ color: colors.primary.main }}
                        />
                      </div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("tutorDashboard.schedule.lessonSummary")}
                      </p>
                    </div>
                  )}

                  {lesson.lessonScript?.id && role !== "tutor" && (
                    <div
                      className="flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity text-center"
                      style={{
                        backgroundColor: `${colors.state.warning}10`,
                        border: `1px solid ${colors.state.warning}25`,
                      }}
                      role="button"
                      tabIndex={0}
                      onClick={onQuizOpen}
                      onKeyDown={(e) => e.key === "Enter" && onQuizOpen()}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${colors.state.warning}20`,
                        }}
                      >
                        <Diploma
                          weight="BoldDuotone"
                          className="w-4 h-4"
                          style={{ color: colors.state.warning }}
                        />
                      </div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("tutorDashboard.schedule.lessonQuiz")}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {/* Reschedule deadline — NoTutor, tutor view only */}
              {!isStudentView && effectiveDeadline && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{
                    backgroundColor: `${effectiveDeadline < new Date() ? colors.state.error : colors.state.warning}12`,
                    border: `1px solid ${effectiveDeadline < new Date() ? colors.state.error : colors.state.warning}30`,
                  }}
                >
                  {effectiveDeadline < new Date() ? (
                    <DangerTriangle
                      weight="BoldDuotone"
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: colors.state.error }}
                    />
                  ) : (
                    <ClockCircle
                      weight="BoldDuotone"
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: colors.state.warning }}
                    />
                  )}
                  <span
                    className="text-sm"
                    style={{
                      color:
                        effectiveDeadline < new Date()
                          ? colors.state.error
                          : colors.state.warning,
                    }}
                  >
                    {effectiveDeadline < new Date()
                      ? t("tutorDashboard.schedule.reschedule.deadlinePassed")
                      : t("tutorDashboard.schedule.reschedule.deadlineUntil", {
                          date: effectiveDeadline.toLocaleString(dateLocale, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        })}
                  </span>
                </div>
              )}

              {/* Makeup deadline banner — hide for tutor+NoTutor since reschedule banner already shows */}
              {resolvedMakeupDeadline && internalCanStudentMakeup && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{
                    backgroundColor: `${makeupDeadlinePassed ? colors.state.error : colors.state.warning}12`,
                    border: `1px solid ${makeupDeadlinePassed ? colors.state.error : colors.state.warning}30`,
                  }}
                >
                  {makeupDeadlinePassed ? (
                    <DangerTriangle
                      weight="BoldDuotone"
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: colors.state.error }}
                    />
                  ) : (
                    <ClockCircle
                      weight="BoldDuotone"
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: colors.state.warning }}
                    />
                  )}
                  <span
                    className="text-sm"
                    style={{
                      color: makeupDeadlinePassed
                        ? colors.state.error
                        : colors.state.warning,
                    }}
                  >
                    {makeupDeadlinePassed
                      ? t(`${makeupNs}.deadlinePassed`)
                      : t(`${makeupNs}.deadlineUntil`, {
                          date: resolvedMakeupDeadline.toLocaleString(
                            dateLocale,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          ),
                        })}
                  </span>
                </div>
              )}

              {/* Auto-refund info — student viewing NoTutor lesson */}
              {showAutoRefundBanner && (
                <div
                  className="flex items-start gap-2 p-3 rounded-xl"
                  style={{
                    backgroundColor: `${colors.state.warning}12`,
                    border: `1px solid ${colors.state.warning}30`,
                  }}
                >
                  <ClockCircle
                    weight="BoldDuotone"
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: colors.state.warning }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: colors.state.warning }}
                  >
                    {t(
                      "studentDashboard.schedule.refundRequest.autoRefund.banner",
                      {
                        date: autoRefundAt.toLocaleString(dateLocale, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      },
                    )}
                  </span>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("tutorDashboard.schedule.cancel")}
              </Button>
              {/* Tutor: reschedule buttons */}
              {internalShowTutorReschedule &&
                (!effectiveDeadline || effectiveDeadline >= new Date()) &&
                (lesson.status === "NoTutor" ? (
                  // NoTutor: merged "handle absence" button (unless already has pending offer)
                  internalHasPendingOffer ? (
                    <Button
                      variant="flat"
                      startContent={
                        <Restart weight="BoldDuotone" className="w-4 h-4" />
                      }
                      onPress={onViewOfferOpen}
                      style={{
                        backgroundColor: `${colors.state.warning}20`,
                        color: colors.state.warning,
                      }}
                    >
                      {t("tutorDashboard.schedule.reschedule.pendingChip")}
                    </Button>
                  ) : !myMakeupRequest ||
                    myMakeupRequest.status === "Rejected" ? (
                    <Button
                      variant="flat"
                      startContent={
                        <Restart weight="BoldDuotone" className="w-4 h-4" />
                      }
                      onPress={onAbsenceActionOpen}
                      style={{ color: colors.primary.main }}
                    >
                      {t("tutorDashboard.schedule.absenceActionBtn")}
                    </Button>
                  ) : null
                ) : // Other statuses (Reschedule, Scheduled): keep separate reschedule button
                internalHasPendingOffer ? (
                  <Button
                    variant="flat"
                    startContent={
                      <Restart weight="BoldDuotone" className="w-4 h-4" />
                    }
                    onPress={onViewOfferOpen}
                    style={{
                      backgroundColor: `${colors.state.warning}20`,
                      color: colors.state.warning,
                    }}
                  >
                    {t("tutorDashboard.schedule.reschedule.pendingChip")}
                  </Button>
                ) : (
                  <Button
                    variant="flat"
                    startContent={
                      <Restart weight="BoldDuotone" className="w-4 h-4" />
                    }
                    onPress={handleInternalReschedule}
                    style={{ color: colors.primary.main }}
                  >
                    {t("tutorDashboard.schedule.reschedule.proposeBtn")}
                  </Button>
                ))}
              {/* Tutor: student has a pending reschedule request */}
              {internalStudentReqForTutor && (
                <Button
                  variant="flat"
                  startContent={
                    <Restart weight="BoldDuotone" className="w-4 h-4" />
                  }
                  onPress={onStudentReqOpen}
                  style={{
                    backgroundColor: `${colors.primary.main}15`,
                    color: colors.primary.main,
                  }}
                >
                  {t("tutorDashboard.schedule.studentRequest.pendingBtn")}
                </Button>
              )}
              {/* Student: accept tutor offer */}
              {internalPendingOffer && (
                <Button
                  variant="flat"
                  startContent={
                    <Restart weight="BoldDuotone" className="w-4 h-4" />
                  }
                  onPress={onAcceptOpen}
                  style={{ color: colors.state.warning }}
                >
                  {t("studentDashboard.schedule.reschedule.viewPending")}
                </Button>
              )}
              {/* Student: request reschedule */}
              {internalCanRequestReschedule &&
                !internalPendingOffer &&
                (internalPendingRequest ? (
                  <Button
                    variant="flat"
                    startContent={
                      <Restart weight="BoldDuotone" className="w-4 h-4" />
                    }
                    onPress={onViewReqOpen}
                    style={{
                      backgroundColor: `${colors.state.warning}20`,
                      color: colors.state.warning,
                    }}
                  >
                    {t(
                      "studentDashboard.schedule.reschedule.requestPendingChip",
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="flat"
                    startContent={
                      <Restart weight="BoldDuotone" className="w-4 h-4" />
                    }
                    onPress={onRequestOpen}
                    style={{ color: colors.primary.main }}
                  >
                    {t("studentDashboard.schedule.reschedule.requestBtn")}
                  </Button>
                ))}
              {/* Makeup: status chip (always show when a request exists) */}
              {(internalCanStudentMakeup || internalCanTutorMakeup) &&
                myMakeupRequest && (
                  <Button
                    variant="flat"
                    startContent={
                      <CircleBottomUp
                        weight="BoldDuotone"
                        className="w-4 h-4"
                      />
                    }
                    onPress={onMyMakeupOpen}
                    style={{
                      backgroundColor: `${myMakeupStatusColor}20`,
                      color: myMakeupStatusColor,
                    }}
                  >
                    {t(`${makeupNs}.myRequestBtn`)}
                  </Button>
                )}
              {/* Makeup: create button — student only; tutor re-sends via Handle Absence */}
              {internalCanStudentMakeup &&
                (!myMakeupRequest || myMakeupRequest.status === "Rejected") &&
                !makeupDeadlinePassed && (
                  <Button
                    variant="flat"
                    startContent={
                      <CircleBottomUp
                        weight="BoldDuotone"
                        className="w-4 h-4"
                      />
                    }
                    onPress={onMakeupOpen}
                    style={{ color: colors.primary.main }}
                  >
                    {t(`${makeupNs}.makeupBtn`)}
                  </Button>
                )}
              {/* Makeup: review pending request from the other party */}
              {reviewMakeupReq && (
                <Button
                  variant="flat"
                  startContent={
                    <CircleBottomUp weight="BoldDuotone" className="w-4 h-4" />
                  }
                  onPress={onMakeupReviewOpen}
                  style={{
                    backgroundColor: `${colors.state.warning}20`,
                    color: colors.state.warning,
                  }}
                >
                  {t(`${makeupNs}.pendingChip`)}
                </Button>
              )}
              {/* Student: request refund for NoTutor lesson */}
              {isStudentView && lesson?.status === "NoTutor" && (
                <Button
                  startContent={
                    <Dollar weight="BoldDuotone" className="w-4 h-4" />
                  }
                  onPress={() => {
                    onRefundRequest?.(lesson);
                  }}
                  style={{
                    backgroundColor: `${colors.state.error}15`,
                    color: colors.state.error,
                    border: `1px solid ${colors.state.error}30`,
                  }}
                >
                  {t("studentDashboard.schedule.refundRequest.requestBtn")}
                </Button>
              )}
              {canJoinLesson(lesson) && (
                <Button
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                  startContent={
                    <Videocamera weight="BoldDuotone" className="w-4 h-4" />
                  }
                  onPress={() => {
                    onClose();
                    navigate(`/meeting/${lesson.id}`);
                  }}
                >
                  {isStudentView
                    ? t("studentDashboard.schedule.joinNow")
                    : lesson.meetingStatus === "InProgress"
                      ? t("tutorDashboard.schedule.joinBack")
                      : t("tutorDashboard.schedule.joinLesson")}
                </Button>
              )}
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>

      <VideoModal
        isOpen={isVideoOpen}
        onOpenChange={onVideoOpenChange}
        videoUrl={videoUrl}
      />

      <LessonSummaryModal
        isOpen={isSummaryOpen}
        onClose={onSummaryClose}
        summarizeText={lesson?.lessonScript?.summarizeText}
      />

      <LessonQuizModal
        isOpen={isQuizOpen}
        onClose={onQuizClose}
        lessonScriptId={lesson?.lessonScript?.id}
      />

      <LessonRatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        lesson={lesson}
        existingRating={localRating}
        onSuccess={(updated) => {
          setLocalRating(updated || null);
          onRefresh?.();
        }}
      />

      <TutorRescheduleOfferModal
        lesson={lesson}
        isOpen={isOfferOpen}
        onClose={onOfferClose}
        tutorId={user?.tutorId}
        onSuccess={() => {
          onOfferClose();
          fetchRescheduleData();
          onRefresh?.();
        }}
      />

      <TutorRescheduleTicketModal
        lesson={lesson}
        isOpen={isTicketOpen}
        onClose={onTicketClose}
        userId={user?.userId}
        rescheduleDeadline={effectiveDeadline}
        onSuccess={() => {
          onTicketClose();
          fetchRescheduleData();
          onRefresh?.();
        }}
      />

      <StudentRescheduleAcceptModal
        offer={internalPendingOffer}
        lesson={lesson}
        isOpen={isAcceptOpen}
        onClose={onAcceptClose}
        studentId={user?.studentId}
        onSuccess={() => {
          onAcceptClose();
          fetchRescheduleData();
          onRefresh?.();
        }}
      />

      <StudentRescheduleRequestModal
        lesson={lesson}
        isOpen={isRequestOpen}
        onClose={onRequestClose}
        studentId={user?.studentId}
        onSuccess={() => {
          onRequestClose();
          fetchRescheduleData();
          onRefresh?.();
        }}
      />

      <MakeupRequestModal
        lesson={lesson}
        isOpen={isMakeupOpen}
        onClose={onMakeupClose}
        createdByRole={isStudentView ? "Student" : "Tutor"}
        makeupDeadline={resolvedMakeupDeadline}
        onSuccess={() => {
          onMakeupClose();
          fetchRescheduleData();
          onRefresh?.();
        }}
      />

      {/* Makeup review modal */}
      <Modal
        isOpen={isMakeupReviewOpen}
        onClose={() => {
          onMakeupReviewClose();
          setMakeupReviewRejecting(false);
          setMakeupReviewRejectNote("");
        }}
        size="sm"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader
                className="flex items-center gap-2"
                style={{ color: colors.text.primary }}
              >
                <CircleBottomUp
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.state.warning }}
                />
                {t(`${makeupNs}.reviewTitle`)}
              </ModalHeader>
              <ModalBody className="pb-2">
                {reviewMakeupReq && (
                  <div className="space-y-2">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <p
                        className="font-medium text-sm"
                        style={{ color: colors.text.primary }}
                      >
                        {lesson.courseTitle || lesson.sessionTitle}
                      </p>
                      <p
                        className="text-xs mt-0.5 flex items-center gap-1"
                        style={{ color: colors.text.secondary }}
                      >
                        <ClockCircle weight="BoldDuotone" className="w-3 h-3" />
                        {new Date(lesson.startTime).toLocaleString(dateLocale, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {reviewMakeupReq.note && (
                      <div
                        className="px-3 py-2 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <p
                          className="text-xs font-medium mb-0.5"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t(`${makeupNs}.requestNote`)}
                        </p>
                        <p
                          className="text-sm italic"
                          style={{ color: colors.text.primary }}
                        >
                          "{reviewMakeupReq.note}"
                        </p>
                      </div>
                    )}
                    {makeupReviewRejecting && (
                      <textarea
                        rows={2}
                        value={makeupReviewRejectNote}
                        onChange={(e) =>
                          setMakeupReviewRejectNote(e.target.value)
                        }
                        placeholder={t(`${makeupNs}.rejectNotePlaceholder`)}
                        className="w-full px-2 py-1.5 rounded-lg text-xs resize-none outline-none"
                        style={{
                          backgroundColor: colors.background.light,
                          color: colors.text.primary,
                          border: `1px solid ${colors.state.error}40`,
                        }}
                      />
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {!makeupReviewRejecting ? (
                  <>
                    <Button
                      variant="light"
                      onPress={() => {
                        setMakeupReviewRejecting(true);
                        setMakeupReviewRejectNote("");
                      }}
                      style={{ color: colors.state.error }}
                    >
                      {t(`${makeupNs}.reject`)}
                    </Button>
                    <Button
                      isLoading={makeupReviewProcessing}
                      style={{
                        backgroundColor: colors.state.success,
                        color: "#fff",
                      }}
                      onPress={async () => {
                        if (!reviewMakeupReq) return;
                        setMakeupReviewProcessing(true);
                        try {
                          await makeupApi.acceptRequest(reviewMakeupReq.id, {
                            request: {
                              makeupRequestId: reviewMakeupReq.id,
                              studentId: lesson.studentId,
                              tutorId: lesson.tutorId,
                            },
                          });
                          onClose();
                          fetchRescheduleData();
                          onRefresh?.();
                        } finally {
                          setMakeupReviewProcessing(false);
                        }
                      }}
                    >
                      {t(`${makeupNs}.accept`)}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="light"
                      onPress={() => {
                        setMakeupReviewRejecting(false);
                        setMakeupReviewRejectNote("");
                      }}
                    >
                      {t(`${makeupNs}.cancelAction`)}
                    </Button>
                    <Button
                      isLoading={makeupReviewProcessing}
                      style={{
                        backgroundColor: colors.state.error,
                        color: "#fff",
                      }}
                      onPress={async () => {
                        if (!reviewMakeupReq) return;
                        setMakeupReviewProcessing(true);
                        try {
                          await makeupApi.rejectRequest(reviewMakeupReq.id, {
                            request: {
                              makeupRequestId: reviewMakeupReq.id,
                              studentId: lesson.studentId,
                              tutorId: lesson.tutorId,
                              rejectionReason: makeupReviewRejectNote,
                            },
                          });
                          onClose();
                          setMakeupReviewRejecting(false);
                          setMakeupReviewRejectNote("");
                          fetchRescheduleData();
                          onRefresh?.();
                        } finally {
                          setMakeupReviewProcessing(false);
                        }
                      }}
                    >
                      {t(`${makeupNs}.confirmReject`)}
                    </Button>
                  </>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* My makeup request detail */}
      <Modal
        isOpen={isMyMakeupOpen}
        onClose={onMyMakeupClose}
        size="sm"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader
                className="flex items-center gap-2"
                style={{ color: colors.text.primary }}
              >
                <CircleBottomUp
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: myMakeupStatusColor }}
                />
                {t(`${makeupNs}.myRequestTitle`)}
              </ModalHeader>
              <ModalBody className="pb-2">
                {myMakeupRequest && (
                  <div className="space-y-3">
                    {/* Status chip */}
                    <div
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <p
                        className="text-xs font-medium"
                        style={{ color: colors.text.tertiary }}
                      >
                        {new Date(myMakeupRequest.createdAt).toLocaleString(
                          dateLocale,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: `${myMakeupStatusColor}20`,
                          color: myMakeupStatusColor,
                        }}
                      >
                        {myMakeupRequest.status === "Pending"
                          ? t(`${makeupNs}.statusPending`)
                          : myMakeupRequest.status === "Accepted"
                            ? t(`${makeupNs}.statusAccepted`)
                            : t(`${makeupNs}.statusRejected`)}
                      </span>
                    </div>

                    {/* Note sent */}
                    {myMakeupRequest.note && (
                      <div
                        className="px-3 py-2 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <p
                          className="text-xs font-medium mb-0.5"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t(`${makeupNs}.requestNote`)}
                        </p>
                        <p
                          className="text-sm italic"
                          style={{ color: colors.text.primary }}
                        >
                          "{myMakeupRequest.note}"
                        </p>
                      </div>
                    )}

                    {/* Rejection reason */}
                    {myMakeupRequest.status === "Rejected" &&
                      myMakeupRequest.rejectionReason && (
                        <div
                          className="px-3 py-2 rounded-xl"
                          style={{
                            backgroundColor: `${colors.state.error}10`,
                            border: `1px solid ${colors.state.error}25`,
                          }}
                        >
                          <p
                            className="text-xs font-medium mb-0.5"
                            style={{ color: colors.state.error }}
                          >
                            {t(`${makeupNs}.rejectionReason`)}
                          </p>
                          <p
                            className="text-sm italic"
                            style={{ color: colors.text.primary }}
                          >
                            "{myMakeupRequest.rejectionReason}"
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t(`${makeupNs}.cancelAction`)}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Tutor: absence action choice */}
      <Modal
        isOpen={isAbsenceActionOpen}
        onClose={onAbsenceActionClose}
        size="sm"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader
                className="flex items-center gap-2"
                style={{ color: colors.text.primary }}
              >
                <Restart
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.primary.main }}
                />
                {t("tutorDashboard.schedule.absenceActionTitle")}
              </ModalHeader>
              <ModalBody className="space-y-3 pb-2">
                {/* Option 1: Reschedule */}
                <button
                  type="button"
                  className="w-full text-left p-3 rounded-xl flex items-start gap-3 transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: `${colors.primary.main}10`,
                    border: `1px solid ${colors.primary.main}25`,
                  }}
                  onClick={() => {
                    onClose();
                    handleInternalReschedule();
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.primary.main}20` }}
                  >
                    <Restart
                      weight="BoldDuotone"
                      className="w-4 h-4"
                      style={{ color: colors.primary.main }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {t("tutorDashboard.schedule.rescheduleOption")}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("tutorDashboard.schedule.rescheduleOptionDesc")}
                    </p>
                  </div>
                </button>

                {/* Option 2: Makeup */}
                <button
                  type="button"
                  className="w-full text-left p-3 rounded-xl flex items-start gap-3 transition-opacity hover:opacity-80 disabled:opacity-40"
                  disabled={makeupDeadlinePassed}
                  style={{
                    backgroundColor: `${colors.state.warning}10`,
                    border: `1px solid ${colors.state.warning}25`,
                    cursor: makeupDeadlinePassed ? "not-allowed" : "pointer",
                  }}
                  onClick={() => {
                    if (makeupDeadlinePassed) return;
                    onClose();
                    onMakeupOpen();
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.state.warning}20` }}
                  >
                    <CircleBottomUp
                      weight="BoldDuotone"
                      className="w-4 h-4"
                      style={{ color: colors.state.warning }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {t("tutorDashboard.schedule.makeupOption")}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: colors.text.secondary }}
                    >
                      {makeupDeadlinePassed
                        ? t(`${makeupNs}.deadlinePassed`)
                        : t("tutorDashboard.schedule.makeupOptionDesc")}
                    </p>
                  </div>
                </button>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t(`${makeupNs}.cancelAction`)}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Tutor: view pending offer detail */}
      <Modal
        isOpen={isViewOfferOpen}
        onClose={onViewOfferClose}
        size="sm"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader
                className="flex items-center gap-2"
                style={{ color: colors.text.primary }}
              >
                <Restart
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.state.warning }}
                />
                {t("tutorDashboard.schedule.reschedule.pendingChip")}
              </ModalHeader>
              <ModalBody className="pb-2">
                {internalTutorPendingOffer && (
                  <div className="space-y-2">
                    {[...(internalTutorPendingOffer.options || [])]
                      .sort((a, b) => a.optionOrder - b.optionOrder)
                      .map((opt, idx, arr) => (
                        <div
                          key={opt.id || idx}
                          className="px-3 py-2 rounded-xl"
                          style={{
                            backgroundColor: `${colors.state.warning}10`,
                            border: `1px solid ${colors.state.warning}30`,
                          }}
                        >
                          <p
                            className="text-xs font-semibold mb-0.5"
                            style={{ color: colors.state.warning }}
                          >
                            {arr.length > 1
                              ? `${t("tutorDashboard.schedule.studentRequest.proposedTime")} ${idx + 1}`
                              : t(
                                  "tutorDashboard.schedule.studentRequest.proposedTime",
                                )}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: colors.text.primary }}
                          >
                            {new Date(opt.proposedStartTime).toLocaleString(
                              dateLocale,
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                            {" – "}
                            {new Date(opt.proposedEndTime).toLocaleTimeString(
                              dateLocale,
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                      ))}
                    {internalTutorPendingOffer.tutorNote && (
                      <div
                        className="px-3 py-2 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <p
                          className="text-xs font-medium mb-0.5"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("tutorDashboard.schedule.reschedule.tutorNote")}
                        </p>
                        <p
                          className="text-sm italic"
                          style={{ color: colors.text.primary }}
                        >
                          "{internalTutorPendingOffer.tutorNote}"
                        </p>
                      </div>
                    )}
                    <p
                      className="text-xs text-center"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t(
                        "studentDashboard.schedule.reschedule.awaitingStudent",
                      )}
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("studentDashboard.schedule.reschedule.close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Tutor: act on student pending request */}
      <Modal
        isOpen={isStudentReqOpen}
        onClose={() => {
          onStudentReqClose();
          setStudentReqRejecting(false);
          setStudentReqRejectNote("");
        }}
        size="sm"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader
                className="flex items-center gap-2"
                style={{ color: colors.text.primary }}
              >
                <Restart
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.primary.main }}
                />
                {t("tutorDashboard.schedule.panel.studentRequestsBtn")}
              </ModalHeader>
              <ModalBody className="pb-2">
                {internalStudentReqForTutor && (
                  <div className="space-y-2">
                    {(lesson.studentFirstName || lesson.studentLastName) && (
                      <div
                        className="flex items-center gap-2 p-2 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <Avatar
                          src={withCDN(lesson.studentAvatar)}
                          name={[
                            lesson.studentFirstName,
                            lesson.studentLastName,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          size="sm"
                          className="w-7 h-7 flex-shrink-0"
                        />
                        <p
                          className="text-sm font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {[lesson.studentFirstName, lesson.studentLastName]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      </div>
                    )}
                    <div
                      className="px-3 py-2 rounded-xl"
                      style={{
                        backgroundColor: `${colors.primary.main}10`,
                        border: `1px solid ${colors.primary.main}20`,
                      }}
                    >
                      <p
                        className="text-xs font-semibold mb-0.5"
                        style={{ color: colors.primary.main }}
                      >
                        {t(
                          "tutorDashboard.schedule.studentRequest.proposedTime",
                        )}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: colors.text.primary }}
                      >
                        {new Date(
                          internalStudentReqForTutor.proposedStartTime,
                        ).toLocaleString(dateLocale, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" – "}
                        {new Date(
                          internalStudentReqForTutor.proposedEndTime,
                        ).toLocaleTimeString(dateLocale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {internalStudentReqForTutor.studentNote && (
                      <div
                        className="px-3 py-2 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <p
                          className="text-xs font-medium mb-0.5"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t(
                            "tutorDashboard.schedule.studentRequest.studentNote",
                          )}
                        </p>
                        <p
                          className="text-sm italic"
                          style={{ color: colors.text.primary }}
                        >
                          "{internalStudentReqForTutor.studentNote}"
                        </p>
                      </div>
                    )}
                    {studentReqRejecting && (
                      <textarea
                        rows={2}
                        value={studentReqRejectNote}
                        onChange={(e) =>
                          setStudentReqRejectNote(e.target.value)
                        }
                        placeholder={t(
                          "tutorDashboard.schedule.studentRequest.rejectNotePlaceholder",
                        )}
                        className="w-full px-2 py-1.5 rounded-lg text-xs resize-none outline-none"
                        style={{
                          backgroundColor: colors.background.light,
                          color: colors.text.primary,
                          border: `1px solid ${colors.state.warning}40`,
                        }}
                      />
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {!studentReqRejecting ? (
                  <>
                    <Button
                      variant="light"
                      onPress={() => {
                        setStudentReqRejecting(true);
                        setStudentReqRejectNote("");
                      }}
                      style={{ color: colors.state.error }}
                    >
                      {t("tutorDashboard.schedule.studentRequest.reject")}
                    </Button>
                    <Button
                      isLoading={studentReqProcessing}
                      style={{
                        backgroundColor: colors.state.success,
                        color: "#fff",
                      }}
                      onPress={async () => {
                        if (!internalStudentReqForTutor) return;
                        setStudentReqProcessing(true);
                        try {
                          await rescheduleApi.updateRequest(
                            internalStudentReqForTutor.id,
                            {
                              request: {
                                id: internalStudentReqForTutor.id,
                                status: "Approved",
                                tutorNote: "",
                              },
                            },
                          );
                          onClose();
                          fetchRescheduleData();
                          onRefresh?.();
                        } finally {
                          setStudentReqProcessing(false);
                        }
                      }}
                    >
                      {t("tutorDashboard.schedule.studentRequest.approve")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="light"
                      onPress={() => {
                        setStudentReqRejecting(false);
                        setStudentReqRejectNote("");
                      }}
                    >
                      {t("tutorDashboard.schedule.studentRequest.cancelAction")}
                    </Button>
                    <Button
                      isLoading={studentReqProcessing}
                      style={{
                        backgroundColor: colors.state.error,
                        color: "#fff",
                      }}
                      onPress={async () => {
                        if (!internalStudentReqForTutor) return;
                        setStudentReqProcessing(true);
                        try {
                          await rescheduleApi.updateRequest(
                            internalStudentReqForTutor.id,
                            {
                              request: {
                                id: internalStudentReqForTutor.id,
                                status: "Rejected",
                                tutorNote: studentReqRejectNote,
                              },
                            },
                          );
                          onClose();
                          setStudentReqRejecting(false);
                          setStudentReqRejectNote("");
                          fetchRescheduleData();
                          onRefresh?.();
                        } finally {
                          setStudentReqProcessing(false);
                        }
                      }}
                    >
                      {t(
                        "tutorDashboard.schedule.studentRequest.confirmReject",
                      )}
                    </Button>
                  </>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* View pending reschedule request detail */}
      <Modal
        isOpen={isViewReqOpen}
        onClose={onViewReqClose}
        size="sm"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader
                className="flex items-center gap-2"
                style={{ color: colors.text.primary }}
              >
                <Restart
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.state.warning }}
                />
                {t("studentDashboard.schedule.reschedule.myRequestBtn")}
              </ModalHeader>
              <ModalBody className="pb-2">
                <div
                  className="p-3 rounded-xl mb-2"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("studentDashboard.schedule.reschedule.originalLesson")}
                  </p>
                  <p
                    className="font-medium text-sm"
                    style={{ color: colors.text.primary }}
                  >
                    {lesson.courseTitle || lesson.sessionTitle}
                  </p>
                  {(lesson.tutorFirstName || lesson.tutorLastName) && (
                    <p
                      className="text-xs mt-1 flex items-center gap-1.5"
                      style={{ color: colors.text.secondary }}
                    >
                      <Avatar
                        src={lesson.tutorAvatar}
                        name={[lesson.tutorFirstName, lesson.tutorLastName]
                          .filter(Boolean)
                          .join(" ")}
                        size="sm"
                        className="w-4 h-4 text-[8px] flex-shrink-0"
                      />
                      {[lesson.tutorFirstName, lesson.tutorLastName]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  )}
                  <p
                    className="text-xs mt-1 flex items-center gap-1"
                    style={{ color: colors.text.secondary }}
                  >
                    <ClockCircle weight="BoldDuotone" className="w-3 h-3" />
                    {new Date(lesson.startTime).toLocaleString(dateLocale, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {lesson.endTime && (
                      <>
                        {" — "}
                        {new Date(lesson.endTime).toLocaleTimeString(
                          dateLocale,
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </>
                    )}
                  </p>
                </div>

                {internalPendingRequest && (
                  <div className="space-y-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        backgroundColor: `${colors.primary.main}10`,
                        border: `1px solid ${colors.primary.main}20`,
                      }}
                    >
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: colors.primary.main }}
                      >
                        {t(
                          "studentDashboard.schedule.reschedule.requestProposed",
                        )}
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {new Date(
                          internalPendingRequest.proposedStartTime,
                        ).toLocaleString(dateLocale, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" – "}
                        {new Date(
                          internalPendingRequest.proposedEndTime,
                        ).toLocaleTimeString(dateLocale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {internalPendingRequest.studentNote && (
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <p
                          className="text-xs font-medium mb-1"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("studentDashboard.schedule.reschedule.yourNote")}
                        </p>
                        <p
                          className="text-sm italic"
                          style={{ color: colors.text.primary }}
                        >
                          "{internalPendingRequest.studentNote}"
                        </p>
                      </div>
                    )}
                    <p
                      className="text-xs text-center"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("studentDashboard.schedule.reschedule.awaitingTutor")}
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("studentDashboard.schedule.reschedule.close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default LessonDetailModal;
