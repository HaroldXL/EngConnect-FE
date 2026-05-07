import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser } from "../../../store";
import { studentApi, rescheduleApi } from "../../../api";
import { supportApi } from "../../../api/supportApi";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Select,
  SelectItem,
  Avatar,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  addToast,
} from "@heroui/react";
import ScheduleSkeleton from "../../../components/ScheduleSkeleton/ScheduleSkeleton";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";
import {
  CalendarDots,
  Clock,
  VideoCamera,
  CaretLeft,
  CaretRight,
  BookOpen,
  Circle,
  Eye,
  ArrowCounterClockwise,
  Warning,
  CheckCircle,
  CurrencyDollar,
} from "@phosphor-icons/react";
import calendarIllustration from "../../../assets/illustrations/calendar.avif";
import LessonDetailModal from "../../../components/LessonDetailModal/LessonDetailModal";
import StudentRescheduleAcceptModal from "../../../components/StudentRescheduleAcceptModal/StudentRescheduleAcceptModal";
import StudentRefundRequestModal from "../../../components/StudentRefundRequestModal/StudentRefundRequestModal";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const Schedule = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { selectClassNames } = useInputStyles();
  const user = useSelector(selectUser);
  const { lastTutorReady } = useNotifications();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarView, setSidebarView] = useState("today");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Calendar week navigation
  const [calendarWeekStart, setCalendarWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + diff);
    return monday;
  });

  // Lesson detail modal
  const {
    isOpen: isLessonDetailOpen,
    onOpen: onLessonDetailOpen,
    onClose: onLessonDetailClose,
  } = useDisclosure();
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Reschedule accept modal (tutor offer → student chooses)
  const {
    isOpen: isRescheduleOpen,
    onOpen: onRescheduleOpen,
    onClose: onRescheduleClose,
  } = useDisclosure();
  const [rescheduleOffer, setRescheduleOffer] = useState(null);
  const [rescheduleLesson, setRescheduleLesson] = useState(null);
  const [offersByLesson, setOffersByLesson] = useState({});
  const [allOffers, setAllOffers] = useState([]);

  const [studentRequestsByLesson, setStudentRequestsByLesson] = useState({});
  const [allStudentRequests, setAllStudentRequests] = useState([]);

  // View existing request detail modal
  const {
    isOpen: isViewRequestOpen,
    onOpen: onViewRequestOpen,
    onClose: onViewRequestClose,
  } = useDisclosure();
  const [viewingRequest, setViewingRequest] = useState(null);
  const [viewingRequestLesson, setViewingRequestLesson] = useState(null);

  // Refund request modal
  const [refundLesson, setRefundLesson] = useState(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundNote, setRefundNote] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [noBankModalOpen, setNoBankModalOpen] = useState(false);

  // Action panel modals
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isRefundTicketsModalOpen, setIsRefundTicketsModalOpen] =
    useState(false);
  const [refundTickets, setRefundTickets] = useState([]);

  const fetchLessons = useCallback(async () => {
    if (!user?.studentId) return;
    try {
      setLoading(true);
      const params = {
        StudentId: user.studentId,
        "page-size": 200,
      };
      if (statusFilter !== "all") params.Status = statusFilter;
      const res = await studentApi.getLessons(params);
      setLessons(res?.data?.items || []);
    } catch (err) {
      console.error("Failed to fetch lessons:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.studentId, statusFilter]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const fetchOffers = useCallback(async () => {
    if (!user?.studentId) return;
    try {
      const res = await rescheduleApi.getOffers({
        StudentId: user.studentId,
        "page-size": 200,
      });
      const items = res?.data?.items || [];
      const sorted = [...items].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setAllOffers(sorted);
      const map = {};
      items.forEach((offer) => {
        if (!map[offer.lessonId]) map[offer.lessonId] = offer;
      });
      setOffersByLesson(map);
    } catch {
      // silently ignore
    }
  }, [user?.studentId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const fetchStudentRequests = useCallback(async () => {
    if (!user?.studentId) return;
    try {
      const res = await rescheduleApi.getRequests({
        StudentId: user.studentId,
        "page-size": 200,
      });
      const items = res?.data?.items || [];
      const sorted = [...items].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setAllStudentRequests(sorted);
      const map = {};
      items.forEach((req) => {
        if (
          !map[req.lessonId] ||
          new Date(req.createdAt) > new Date(map[req.lessonId].createdAt)
        ) {
          map[req.lessonId] = req;
        }
      });
      setStudentRequestsByLesson(map);
    } catch {
      // silently ignore
    }
  }, [user?.studentId]);

  useEffect(() => {
    fetchStudentRequests();
  }, [fetchStudentRequests]);

  const fetchRefundTickets = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const res = await supportApi.getTickets({
        Type: "Refund",
        CreatedBy: user.userId,
        "page-size": 100,
      });
      const items = (res?.data?.items || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setRefundTickets(items);
    } catch {
      // silently ignore
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchRefundTickets();
  }, [fetchRefundTickets]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const todayStr = now.toDateString();

  const todayLessons = useMemo(
    () =>
      lessons
        .filter((l) => new Date(l.startTime).toDateString() === todayStr)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [lessons, todayStr],
  );

  const upcomingLessons = useMemo(
    () =>
      lessons
        .filter(
          (l) =>
            new Date(l.startTime) > now &&
            new Date(l.startTime).toDateString() !== todayStr,
        )
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [lessons, todayStr],
  );

  // When tutor creates the room, instantly update meetingStatus so the Join button appears
  useEffect(() => {
    if (!lastTutorReady) return;
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lastTutorReady.LessonId
          ? { ...l, meetingStatus: "Waiting" }
          : l,
      ),
    );
  }, [lastTutorReady]);

  const tutorFullName = (lesson) =>
    [lesson.tutorFirstName, lesson.tutorLastName].filter(Boolean).join(" ");

  const canJoinLesson = (lesson) =>
    lesson.meetingStatus === "InProgress" ||
    (lesson.meetingStatus === "Waiting" &&
      lesson.status !== "Completed" &&
      lesson.status !== "Settled" &&
      lesson.status !== "Reschedule" &&
      lesson.status !== "Refund");

  const handleOpenLessonDetail = (lesson) => {
    setSelectedLesson(lesson);
    onLessonDetailOpen();
  };

  const handleOpenReschedule = (lesson, offer) => {
    setRescheduleLesson(lesson);
    setRescheduleOffer(offer);
    onRescheduleOpen();
  };

  const hasPendingRequest = (lesson) =>
    studentRequestsByLesson[lesson.id]?.status === "Pending";

  const handleOpenRefundRequest = async (lesson) => {
    try {
      const res = await studentApi.getStudentProfile();
      const profile = res?.data;
      if (
        !profile?.bankCode ||
        !profile?.bankAccountNumber ||
        !profile?.bankAccountName
      ) {
        setNoBankModalOpen(true);
        return;
      }
    } catch {
      // If check fails, allow proceeding
    }
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

  const formatLessonTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLessonStatusLabel = (status) => {
    switch (status) {
      case "Scheduled":
        return t("studentDashboard.schedule.scheduled");
      case "Completed":
      case "Settled":
        return t("studentDashboard.schedule.completed");
      case "Cancelled":
        return t("studentDashboard.schedule.cancelled");
      case "Refund":
        return t("studentDashboard.schedule.refund");
      case "InProgress":
        return t("studentDashboard.schedule.inProgress");
      case "NoStudent":
        return t("studentDashboard.schedule.noStudent");
      case "NoTutor":
        return t("studentDashboard.schedule.noTutor");
      case "Reschedule":
        return t("studentDashboard.schedule.rescheduleStatus");
      default:
        return status || "";
    }
  };

  const getMeetingStatusInfo = (lesson) => {
    if (lesson.meetingStatus === "Waiting")
      return {
        label: t("studentDashboard.schedule.roomOpen"),
        color: colors.state.warning,
      };
    if (lesson.meetingStatus === "InProgress")
      return {
        label: t("studentDashboard.schedule.meetingInProgress"),
        color: colors.state.success,
      };
    if (lesson.meetingStatus === "Ended")
      return {
        label: t("studentDashboard.schedule.meetingEnded"),
        color: colors.state.success,
      };
    return null;
  };

  // Calendar helpers
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(calendarWeekStart);
    d.setDate(calendarWeekStart.getDate() + i);
    return d;
  });

  const calendarWeekEnd = new Date(calendarWeekStart);
  calendarWeekEnd.setDate(calendarWeekStart.getDate() + 6);

  const goToPrevWeek = () => {
    const prev = new Date(calendarWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCalendarWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(calendarWeekStart);
    next.setDate(next.getDate() + 7);
    setCalendarWeekStart(next);
  };

  const goToCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(d.getDate() + diff);
    setCalendarWeekStart(monday);
  };

  const CALENDAR_START_HOUR = 7;
  const CALENDAR_END_HOUR = 22;
  const HOUR_HEIGHT = 48;

  const currentTimeTop = useMemo(() => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    if (h < CALENDAR_START_HOUR || h >= CALENDAR_END_HOUR) return null;
    return (((h - CALENDAR_START_HOUR) * 60 + m) / 60) * HOUR_HEIGHT;
  }, [currentTime]);

  const getLessonsForDay = (dayDate) =>
    lessons.filter(
      (l) => new Date(l.startTime).toDateString() === dayDate.toDateString(),
    );

  const getLessonPosition = (lesson) => {
    const start = new Date(lesson.startTime);
    const end = new Date(lesson.endTime);
    const startMinutes =
      (start.getHours() - CALENDAR_START_HOUR) * 60 + start.getMinutes();
    const endMinutes =
      (end.getHours() - CALENDAR_START_HOUR) * 60 + end.getMinutes();
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max(
      ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT,
      28,
    );
    return { top, height };
  };

  const getLessonBlockColor = (status) => {
    switch (status) {
      case "Scheduled":
        return {
          bg: `${colors.state.success}25`,
          border: colors.state.success,
          text: colors.state.success,
        };
      case "InProgress":
        return {
          bg: `${colors.state.warning}25`,
          border: colors.state.warning,
          text: colors.state.warning,
        };
      case "Completed":
      case "Settled":
        return {
          bg: `${colors.primary.main}25`,
          border: colors.primary.main,
          text: colors.primary.main,
        };
      case "Cancelled":
      case "NoStudent":
      case "NoTutor":
      case "Refund":
        return {
          bg: `${colors.state.error}25`,
          border: colors.state.error,
          text: colors.state.error,
        };
      case "Reschedule":
        return {
          bg: `${colors.state.warning}25`,
          border: colors.state.warning,
          text: colors.state.warning,
        };
      default:
        return {
          bg: colors.background.gray,
          border: colors.border.medium,
          text: colors.text.secondary,
        };
    }
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();

  const formatWeekRange = () => {
    const startMonth = calendarWeekStart.toLocaleDateString(dateLocale, {
      month: "short",
    });
    const endMonth = calendarWeekEnd.toLocaleDateString(dateLocale, {
      month: "short",
    });
    const startDay = calendarWeekStart.getDate();
    const endDay = calendarWeekEnd.getDate();
    const year = calendarWeekEnd.getFullYear();
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {t("studentDashboard.schedule.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("studentDashboard.schedule.subtitle")}
          </p>
        </div>

        {/* 3 action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            {
              key: "offers",
              icon: (
                <ArrowCounterClockwise weight="duotone" className="w-4 h-4" />
              ),
              label: t("studentDashboard.schedule.reschedule.tutorOfferedBtn"),
              badge: Object.values(offersByLesson).filter(
                (o) => o.status === "PendingStudentChoice",
              ).length,
              badgeColor: colors.state.warning,
              btnBg: `${colors.state.warning}22`,
              btnColor: colors.state.warning,
              onPress: () => setIsOffersModalOpen(true),
            },
            {
              key: "requests",
              icon: (
                <ArrowCounterClockwise weight="duotone" className="w-4 h-4" />
              ),
              label: t("studentDashboard.schedule.reschedule.myRequestBtn"),
              badge: allStudentRequests.filter((r) => r.status === "Pending")
                .length,
              badgeColor: colors.primary.main,
              btnBg: `${colors.primary.main}18`,
              btnColor: colors.primary.main,
              onPress: () => setIsRequestsModalOpen(true),
            },
            {
              key: "refundTickets",
              icon: <CurrencyDollar weight="duotone" className="w-4 h-4" />,
              label: t("studentDashboard.schedule.refundRequest.ticketsBtn"),
              badge: refundTickets.filter((tk) => tk.status === "Open").length,
              badgeColor: colors.state.error,
              btnBg: `${colors.state.error}15`,
              btnColor: colors.state.error,
              onPress: () => setIsRefundTicketsModalOpen(true),
            },
          ].map(
            ({
              key,
              icon,
              label,
              badge,
              badgeColor,
              btnBg,
              btnColor,
              onPress,
            }) => (
              <div key={key} className="relative">
                <Button
                  size="sm"
                  variant="flat"
                  className="flex items-center gap-1.5 text-xs h-9 px-3"
                  style={{ backgroundColor: btnBg, color: btnColor }}
                  startContent={icon}
                  onPress={onPress}
                >
                  {label}
                </Button>
                {badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
                    style={{
                      backgroundColor: badgeColor,
                      color: "#fff",
                      zIndex: 10,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
            ),
          )}
        </div>
        {/* <Select
          label={t("studentDashboard.schedule.filterStatus")}
          selectedKeys={[statusFilter]}
          classNames={selectClassNames}
          className="max-w-[180px]"
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0];
            if (val) setStatusFilter(val);
          }}
        >
          <SelectItem key="all">
            {t("studentDashboard.schedule.all")}
          </SelectItem>
          <SelectItem key="Scheduled">
            {t("studentDashboard.schedule.scheduled")}
          </SelectItem>
          <SelectItem key="Completed">
            {t("studentDashboard.schedule.completed")}
          </SelectItem>
          <SelectItem key="Cancelled">
            {t("studentDashboard.schedule.cancelled")}
          </SelectItem>
        </Select> */}
      </motion.div>

      {/* Calendar + Sidebar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {loading ? (
          <ScheduleSkeleton />
        ) : lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <img
              src={calendarIllustration}
              alt="No lessons"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              className="w-68 h-68 object-contain"
            />
            <h3
              className="text-xl font-semibold"
              style={{ color: colors.text.primary }}
            >
              {t("studentDashboard.schedule.noLessons")}
            </h3>
            <p
              className="text-center max-w-sm"
              style={{ color: colors.text.secondary }}
            >
              {t("studentDashboard.schedule.noLessonsDesc")}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_460px]">
            {/* Weekly Calendar */}
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-4">
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      onPress={goToPrevWeek}
                    >
                      <CaretLeft
                        weight="bold"
                        className="w-4 h-4"
                        style={{ color: colors.text.secondary }}
                      />
                    </Button>
                    <h2
                      className="text-base font-semibold min-w-[180px] text-center"
                      style={{ color: colors.text.primary }}
                    >
                      {formatWeekRange()}
                    </h2>
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      onPress={goToNextWeek}
                    >
                      <CaretRight
                        weight="bold"
                        className="w-4 h-4"
                        style={{ color: colors.text.secondary }}
                      />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={goToCurrentWeek}
                  >
                    {t("studentDashboard.schedule.today")}
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="overflow-x-auto">
                  <div style={{ minWidth: "640px" }}>
                    {/* Day headers */}
                    <div
                      className="grid border-b"
                      style={{
                        gridTemplateColumns: "44px repeat(7, 1fr)",
                        borderColor: colors.border.medium,
                      }}
                    >
                      <div className="p-1" />
                      {calendarDays.map((day, idx) => {
                        const dayIsToday = isToday(day);
                        return (
                          <div
                            key={idx}
                            className="py-2 px-1 text-center"
                            style={{
                              backgroundColor: dayIsToday
                                ? `${colors.primary.main}10`
                                : "transparent",
                            }}
                          >
                            <p
                              className="text-[11px] font-medium"
                              style={{
                                color: dayIsToday
                                  ? colors.primary.main
                                  : colors.text.tertiary,
                              }}
                            >
                              {day.toLocaleDateString(dateLocale, {
                                weekday: "short",
                              })}
                            </p>
                            <p
                              className={`text-base font-bold mt-0.5 ${
                                dayIsToday
                                  ? "w-7 h-7 rounded-full flex items-center justify-center mx-auto text-sm"
                                  : ""
                              }`}
                              style={{
                                color: dayIsToday
                                  ? "#fff"
                                  : colors.text.primary,
                                backgroundColor: dayIsToday
                                  ? colors.primary.main
                                  : "transparent",
                              }}
                            >
                              {day.getDate()}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Time grid */}
                    <div
                      className="relative overflow-y-auto"
                      style={{ maxHeight: "520px" }}
                    >
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: "44px repeat(7, 1fr)",
                          height: `${(CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_HEIGHT}px`,
                        }}
                      >
                        {/* Time labels */}
                        <div className="relative">
                          {Array.from(
                            {
                              length: CALENDAR_END_HOUR - CALENDAR_START_HOUR,
                            },
                            (_, i) => CALENDAR_START_HOUR + i,
                          ).map((hour) => (
                            <div
                              key={hour}
                              className="absolute right-1.5 text-right"
                              style={{
                                top: `${(hour - CALENDAR_START_HOUR) * HOUR_HEIGHT - 6}px`,
                                color: colors.text.tertiary,
                                fontSize: "10px",
                              }}
                            >
                              {`${String(hour).padStart(2, "0")}:00`}
                            </div>
                          ))}
                        </div>

                        {/* Day columns */}
                        {calendarDays.map((day, dayIdx) => {
                          const dayLessons = getLessonsForDay(day);
                          const dayIsToday = isToday(day);
                          return (
                            <div
                              key={dayIdx}
                              className="relative border-l"
                              style={{
                                borderColor: colors.border.medium,
                                backgroundColor: dayIsToday
                                  ? `${colors.primary.main}05`
                                  : "transparent",
                              }}
                            >
                              {/* Hour grid lines + half-hour lines */}
                              {Array.from(
                                {
                                  length:
                                    CALENDAR_END_HOUR - CALENDAR_START_HOUR,
                                },
                                (_, i) => i,
                              ).map((i) => (
                                <div key={i}>
                                  <div
                                    className="absolute w-full border-t"
                                    style={{
                                      top: `${i * HOUR_HEIGHT}px`,
                                      borderColor: colors.border.medium,
                                    }}
                                  />
                                  <div
                                    className="absolute w-full border-t border-dashed"
                                    style={{
                                      top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px`,
                                      borderColor: `${colors.border.medium}80`,
                                    }}
                                  />
                                </div>
                              ))}

                              {/* Lesson blocks */}
                              {dayLessons.map((lesson) => {
                                const pos = getLessonPosition(lesson);
                                const blockColor = getLessonBlockColor(
                                  lesson.status,
                                );
                                return (
                                  <div
                                    key={lesson.id}
                                    className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 overflow-hidden cursor-pointer transition-all hover:opacity-80 hover:shadow-md"
                                    style={{
                                      top: `${pos.top}px`,
                                      height: `${Math.max(pos.height, 22)}px`,
                                      backgroundColor: blockColor.bg,
                                      borderLeft: `3px solid ${blockColor.border}`,
                                      zIndex: 2,
                                    }}
                                    onClick={() =>
                                      handleOpenLessonDetail(lesson)
                                    }
                                  >
                                    <p
                                      className="text-[11px] font-semibold truncate leading-tight"
                                      style={{ color: blockColor.text }}
                                    >
                                      {lesson.courseTitle ||
                                        t("studentDashboard.schedule.lesson")}
                                    </p>
                                    {pos.height > 30 && (
                                      <p
                                        className="text-[10px] truncate leading-tight mt-0.5"
                                        style={{
                                          color: blockColor.text,
                                          opacity: 0.8,
                                        }}
                                      >
                                        {tutorFullName(lesson) ||
                                          lesson.sessionTitle}
                                      </p>
                                    )}
                                    {pos.height > 44 && (
                                      <p
                                        className="text-[10px] truncate leading-tight mt-0.5"
                                        style={{
                                          color: blockColor.text,
                                          opacity: 0.7,
                                        }}
                                      >
                                        {formatLessonTime(lesson.startTime)} —{" "}
                                        {formatLessonTime(lesson.endTime)}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Current time indicator */}
                              {dayIsToday && currentTimeTop !== null && (
                                <div
                                  className="absolute left-0 right-0 pointer-events-none"
                                  style={{
                                    top: `${currentTimeTop}px`,
                                    zIndex: 3,
                                  }}
                                >
                                  <div className="flex items-center">
                                    <div
                                      className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor: colors.state.error,
                                        marginLeft: "-4px",
                                      }}
                                    />
                                    <div
                                      className="flex-1 h-[1.5px]"
                                      style={{
                                        backgroundColor: colors.state.error,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div
                  className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t"
                  style={{ borderColor: colors.border.medium }}
                >
                  {[
                    "Scheduled",
                    "InProgress",
                    "Completed",
                    "Cancelled",
                    "NoStudent",
                    "NoTutor",
                    "Refund",
                    "Reschedule",
                  ].map((status) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded"
                        style={{
                          backgroundColor: getLessonBlockColor(status).border,
                        }}
                      />
                      <span
                        className="text-[11px]"
                        style={{ color: colors.text.secondary }}
                      >
                        {getLessonStatusLabel(status)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Sidebar — Today / Upcoming */}
            <Card
              shadow="none"
              className="border-none hidden lg:block lg:sticky lg:top-40 self-start"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-4">
                <Tabs
                  selectedKey={sidebarView}
                  onSelectionChange={(key) => setSidebarView(key)}
                  variant="solid"
                  fullWidth
                  className="mb-4"
                >
                  <Tab
                    key="today"
                    title={
                      <div className="flex items-center gap-1.5 text-xs">
                        <CalendarDots
                          weight="duotone"
                          className="w-3.5 h-3.5"
                        />
                        <span>{t("studentDashboard.schedule.today")}</span>
                        {todayLessons.length > 0 && (
                          <Chip
                            size="sm"
                            variant="flat"
                            className="h-4 min-w-4 text-[10px]"
                          >
                            {todayLessons.length}
                          </Chip>
                        )}
                      </div>
                    }
                  />
                  <Tab
                    key="upcoming"
                    title={
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock weight="duotone" className="w-3.5 h-3.5" />
                        <span>
                          {t("studentDashboard.schedule.upcomingTab")}
                        </span>
                        {upcomingLessons.length > 0 && (
                          <Chip
                            size="sm"
                            variant="flat"
                            className="h-4 min-w-4 text-[10px]"
                          >
                            {upcomingLessons.length}
                          </Chip>
                        )}
                      </div>
                    }
                  />
                </Tabs>

                {(() => {
                  const sidebarLessons =
                    sidebarView === "today" ? todayLessons : upcomingLessons;
                  const emptyMessage =
                    sidebarView === "today"
                      ? t("studentDashboard.schedule.noLessonsToday")
                      : t("studentDashboard.schedule.noUpcoming");

                  if (sidebarLessons.length === 0) {
                    return (
                      <div className="text-center py-6">
                        <img
                          src={calendarIllustration}
                          alt="No lessons"
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-48 h-48 mx-auto object-contain"
                        />
                        <p
                          className="text-sm"
                          style={{ color: colors.text.tertiary }}
                        >
                          {emptyMessage}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {sidebarLessons.map((lesson) => {
                        const blockColor = getLessonBlockColor(lesson.status);
                        const startDate = new Date(lesson.startTime);
                        const endDate = new Date(lesson.endTime);
                        const durationMin = Math.round(
                          (endDate - startDate) / 60000,
                        );
                        const meetingInfo = getMeetingStatusInfo(lesson);
                        return (
                          <div
                            key={lesson.id}
                            className="p-3 rounded-xl"
                            style={{
                              backgroundColor: colors.background.gray,
                            }}
                          >
                            <div className="flex items-start gap-2.5">
                              <Avatar
                                src={withCDN(lesson.tutorAvatar)}
                                name={tutorFullName(lesson)}
                                size="sm"
                                className="w-8 h-8 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className="font-semibold text-sm truncate"
                                  style={{ color: colors.text.primary }}
                                >
                                  {tutorFullName(lesson) ||
                                    t("studentDashboard.schedule.tutor")}
                                </p>
                                <p
                                  className="text-xs truncate mt-0.5"
                                  style={{
                                    color: colors.text.secondary,
                                  }}
                                >
                                  {lesson.courseTitle}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span
                                    className="text-[11px] flex items-center gap-1"
                                    style={{
                                      color: colors.text.tertiary,
                                    }}
                                  >
                                    <Clock
                                      weight="duotone"
                                      className="w-3 h-3"
                                    />
                                    {sidebarView === "upcoming" &&
                                      startDate.toLocaleDateString(dateLocale, {
                                        day: "numeric",
                                        month: "short",
                                      }) + " · "}
                                    {formatLessonTime(lesson.startTime)} —{" "}
                                    {formatLessonTime(lesson.endTime)}
                                  </span>
                                  <Chip
                                    size="sm"
                                    className="h-4"
                                    style={{
                                      backgroundColor: `${blockColor.border}20`,
                                      color: blockColor.border,
                                      fontSize: "10px",
                                    }}
                                  >
                                    {durationMin}m
                                  </Chip>
                                </div>
                                {meetingInfo && (
                                  <span
                                    className="text-[11px] flex items-center gap-1 mt-1"
                                    style={{ color: meetingInfo.color }}
                                  >
                                    <Circle weight="fill" className="w-2 h-2" />
                                    {meetingInfo.label}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="flat"
                                className="flex-1"
                                startContent={<Eye className="w-3.5 h-3.5" />}
                                onPress={() => handleOpenLessonDetail(lesson)}
                              >
                                {t("studentDashboard.schedule.viewDetail")}
                              </Button>
                              {canJoinLesson(lesson) && (
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  style={{
                                    backgroundColor: colors.primary.main,
                                    color: colors.text.white,
                                  }}
                                  startContent={
                                    <VideoCamera
                                      weight="fill"
                                      className="w-3.5 h-3.5"
                                    />
                                  }
                                  onPress={() =>
                                    navigate(`/meeting/${lesson.id}`)
                                  }
                                >
                                  {t("studentDashboard.schedule.joinNow")}
                                </Button>
                              )}
                            </div>
                            {offersByLesson[lesson.id] &&
                              offersByLesson[lesson.id].status !==
                                "Rejected" && (
                                <div className="mt-2">
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    className="w-full"
                                    startContent={
                                      <Warning
                                        weight="fill"
                                        className="w-3.5 h-3.5"
                                      />
                                    }
                                    style={{
                                      backgroundColor: `${colors.state.warning}15`,
                                      color: colors.state.warning,
                                      border: `1px solid ${colors.state.warning}30`,
                                    }}
                                    onPress={() =>
                                      handleOpenReschedule(
                                        lesson,
                                        offersByLesson[lesson.id],
                                      )
                                    }
                                  >
                                    {t(
                                      "studentDashboard.schedule.reschedule.viewPendingWithCount",
                                      {
                                        count:
                                          offersByLesson[lesson.id].options
                                            ?.length || 0,
                                      },
                                    )}
                                  </Button>
                                </div>
                              )}
                            {hasPendingRequest(lesson) && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  className="w-full"
                                  startContent={
                                    <ArrowCounterClockwise
                                      weight="bold"
                                      className="w-3.5 h-3.5"
                                    />
                                  }
                                  style={{
                                    backgroundColor: `${colors.state.warning}20`,
                                    color: colors.state.warning,
                                    border: `1px solid ${colors.state.warning}30`,
                                  }}
                                  onPress={() => {
                                    const req =
                                      studentRequestsByLesson[lesson.id];
                                    if (req) {
                                      setViewingRequest(req);
                                      setViewingRequestLesson(lesson);
                                      onViewRequestOpen();
                                    }
                                  }}
                                >
                                  {t(
                                    "studentDashboard.schedule.reschedule.requestPendingChip",
                                  )}
                                </Button>
                              </div>
                            )}
                            {lesson.status === "NoTutor" && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  className="w-full"
                                  startContent={
                                    <CurrencyDollar
                                      weight="bold"
                                      className="w-3.5 h-3.5"
                                    />
                                  }
                                  style={{
                                    backgroundColor: `${colors.state.error}15`,
                                    color: colors.state.error,
                                    border: `1px solid ${colors.state.error}30`,
                                  }}
                                  onPress={() =>
                                    handleOpenRefundRequest(lesson)
                                  }
                                >
                                  {t(
                                    "studentDashboard.schedule.refundRequest.requestBtn",
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardBody>
            </Card>
          </div>
        )}
      </motion.div>

      {/* Lesson Detail Modal */}
      <LessonDetailModal
        isOpen={isLessonDetailOpen}
        onClose={onLessonDetailClose}
        lesson={selectedLesson}
        role="student"
        onRefundRequest={(lesson) => {
          //onLessonDetailClose();
          handleOpenRefundRequest(lesson);
        }}
        onRefresh={() => {
          fetchOffers();
          fetchStudentRequests();
          fetchLessons();
        }}
      />

      <StudentRescheduleAcceptModal
        offer={rescheduleOffer}
        lesson={rescheduleLesson}
        isOpen={isRescheduleOpen}
        onClose={onRescheduleClose}
        studentId={user?.studentId}
        onViewLesson={() => {
          onRescheduleClose();
          if (rescheduleLesson) handleOpenLessonDetail(rescheduleLesson);
        }}
        onSuccess={() => {
          fetchOffers();
          fetchLessons();
        }}
      />

      {/* View Request Detail Modal */}
      <Modal
        isOpen={isViewRequestOpen}
        onClose={onViewRequestClose}
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
                <ArrowCounterClockwise
                  weight="duotone"
                  className="w-5 h-5"
                  style={{ color: colors.state.warning }}
                />
                {t("studentDashboard.schedule.reschedule.myRequestBtn")}
              </ModalHeader>
              <ModalBody className="pb-2">
                {viewingRequestLesson && (
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
                      {viewingRequestLesson.courseTitle ||
                        viewingRequestLesson.sessionTitle}
                    </p>
                    {(viewingRequestLesson.tutorFirstName ||
                      viewingRequestLesson.tutorLastName) && (
                      <p
                        className="text-xs mt-1 flex items-center gap-1.5"
                        style={{ color: colors.text.secondary }}
                      >
                        <Avatar
                          src={viewingRequestLesson.tutorAvatar}
                          name={[
                            viewingRequestLesson.tutorFirstName,
                            viewingRequestLesson.tutorLastName,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          size="sm"
                          className="w-4 h-4 text-[8px] flex-shrink-0"
                        />
                        {[
                          viewingRequestLesson.tutorFirstName,
                          viewingRequestLesson.tutorLastName,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                    )}
                    <p
                      className="text-xs mt-1 flex items-center gap-1"
                      style={{ color: colors.text.secondary }}
                    >
                      <Clock weight="duotone" className="w-3 h-3" />
                      {new Date(viewingRequestLesson.startTime).toLocaleString(
                        i18n.language === "vi" ? "vi-VN" : "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                      {viewingRequestLesson.endTime && (
                        <>
                          {" — "}
                          {new Date(
                            viewingRequestLesson.endTime,
                          ).toLocaleTimeString(
                            i18n.language === "vi" ? "vi-VN" : "en-US",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </>
                      )}
                    </p>
                  </div>
                )}

                {viewingRequest && (
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
                          viewingRequest.proposedStartTime,
                        ).toLocaleString(
                          i18n.language === "vi" ? "vi-VN" : "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                        {" – "}
                        {new Date(
                          viewingRequest.proposedEndTime,
                        ).toLocaleTimeString(
                          i18n.language === "vi" ? "vi-VN" : "en-US",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </p>
                    </div>

                    {viewingRequest.studentNote && (
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
                          "{viewingRequest.studentNote}"
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
                <Button
                  variant="flat"
                  startContent={<Eye className="w-3.5 h-3.5" />}
                  onPress={() => {
                    onClose();
                    if (viewingRequestLesson)
                      handleOpenLessonDetail(viewingRequestLesson);
                  }}
                >
                  {t("studentDashboard.schedule.viewDetail")}
                </Button>
                <Button variant="light" onPress={onClose}>
                  {t("studentDashboard.schedule.reschedule.close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

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

      {/* No Bank Account Warning Modal */}
      <Modal
        isOpen={noBankModalOpen}
        onOpenChange={setNoBankModalOpen}
        size="sm"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader
                className="flex items-center gap-2"
                style={{ color: colors.text.primary }}
              >
                <Warning
                  weight="duotone"
                  className="w-5 h-5"
                  style={{ color: colors.state.warning }}
                />
                {t("studentDashboard.schedule.refundRequest.noBankTitle")}
              </ModalHeader>
              <ModalBody className="pb-2">
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t("studentDashboard.schedule.refundRequest.noBankMessage")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                  onPress={() => {
                    onClose();
                    navigate("/student/profile");
                  }}
                >
                  {t("studentDashboard.schedule.refundRequest.goToProfile")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ==================== TUTOR OFFERS MODAL ==================== */}
      <Modal
        isOpen={isOffersModalOpen}
        onOpenChange={(open) => setIsOffersModalOpen(open)}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {() => {
            const pendingOffers = Object.values(offersByLesson).filter(
              (o) => o.status === "PendingStudentChoice",
            );
            return (
              <>
                <ModalHeader style={{ color: colors.text.primary }}>
                  {t("studentDashboard.schedule.reschedule.tutorOfferedBtn")}
                </ModalHeader>
                <ModalBody className="pb-6">
                  <div className="space-y-3">
                    {pendingOffers.length === 0 ? (
                      <p
                        className="text-sm text-center py-6"
                        style={{ color: colors.text.tertiary }}
                      >
                        {t(
                          "studentDashboard.schedule.reschedule.noOffersPending",
                        )}
                      </p>
                    ) : (
                      pendingOffers.map((offer) => {
                        const lesson = lessons.find(
                          (l) => l.id === offer.lessonId,
                        );
                        const tutorName = lesson ? tutorFullName(lesson) : null;
                        return (
                          <div
                            key={offer.id}
                            className="p-3 rounded-xl space-y-2"
                            style={{ backgroundColor: colors.background.gray }}
                          >
                            <p
                              className="font-semibold text-sm"
                              style={{ color: colors.text.primary }}
                            >
                              {lesson?.courseTitle ||
                                lesson?.sessionTitle ||
                                "—"}
                            </p>
                            {tutorName && (
                              <div className="flex items-center gap-1.5">
                                <Avatar
                                  src={withCDN(lesson?.tutorAvatar)}
                                  name={tutorName}
                                  size="sm"
                                  className="w-4 h-4 text-[8px] flex-shrink-0"
                                />
                                <p
                                  className="text-xs"
                                  style={{ color: colors.text.secondary }}
                                >
                                  {tutorName}
                                </p>
                              </div>
                            )}
                            {lesson && (
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className="text-xs flex items-center gap-1"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  <Clock
                                    weight="duotone"
                                    className="w-3.5 h-3.5 flex-shrink-0"
                                  />
                                  {new Date(lesson.startTime).toLocaleString(
                                    dateLocale,
                                    {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                  {lesson.endTime && (
                                    <>
                                      {" "}
                                      {" — "}
                                      {new Date(
                                        lesson.endTime,
                                      ).toLocaleTimeString(dateLocale, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </>
                                  )}
                                </p>
                                <Button
                                  size="sm"
                                  variant="light"
                                  className="h-6 px-2 text-xs flex-shrink-0"
                                  startContent={<Eye className="w-3 h-3" />}
                                  onPress={() => {
                                    setIsOffersModalOpen(false);
                                    handleOpenLessonDetail(lesson);
                                  }}
                                >
                                  {t("studentDashboard.schedule.viewDetail")}
                                </Button>
                              </div>
                            )}
                            <p
                              className="text-xs"
                              style={{ color: colors.text.tertiary }}
                            >
                              {t(
                                "studentDashboard.schedule.reschedule.optionsProposed",
                                { count: offer.options?.length || 0 },
                              )}
                            </p>
                            {offer.tutorNote && (
                              <p
                                className="text-xs italic"
                                style={{ color: colors.text.secondary }}
                              >
                                "{offer.tutorNote}"
                              </p>
                            )}
                            <Button
                              size="sm"
                              className="w-full"
                              style={{
                                backgroundColor: `${colors.state.warning}20`,
                                color: colors.state.warning,
                              }}
                              startContent={
                                <ArrowCounterClockwise
                                  weight="bold"
                                  className="w-3.5 h-3.5"
                                />
                              }
                              onPress={() => {
                                if (lesson) {
                                  setIsOffersModalOpen(false);
                                  handleOpenReschedule(lesson, offer);
                                }
                              }}
                            >
                              {t(
                                "studentDashboard.schedule.reschedule.viewPendingWithCount",
                                { count: offer.options?.length || 0 },
                              )}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ModalBody>
              </>
            );
          }}
        </ModalContent>
      </Modal>

      {/* ==================== MY REQUESTS MODAL ==================== */}
      <Modal
        isOpen={isRequestsModalOpen}
        onOpenChange={(open) => setIsRequestsModalOpen(open)}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {() => {
            const pendingRequests = allStudentRequests.filter(
              (r) => r.status === "Pending",
            );
            return (
              <>
                <ModalHeader style={{ color: colors.text.primary }}>
                  {t("studentDashboard.schedule.reschedule.myRequestBtn")}
                </ModalHeader>
                <ModalBody className="pb-6">
                  <div className="space-y-3">
                    {pendingRequests.length === 0 ? (
                      <p
                        className="text-sm text-center py-6"
                        style={{ color: colors.text.tertiary }}
                      >
                        {t(
                          "studentDashboard.schedule.reschedule.noRequestsPending",
                        )}
                      </p>
                    ) : (
                      pendingRequests.map((req) => {
                        const lesson = lessons.find(
                          (l) => l.id === req.lessonId,
                        );
                        const tutorName = lesson ? tutorFullName(lesson) : null;
                        return (
                          <div
                            key={req.id}
                            className="p-3 rounded-xl space-y-2"
                            style={{ backgroundColor: colors.background.gray }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className="font-semibold text-sm truncate"
                                style={{ color: colors.text.primary }}
                              >
                                {lesson?.courseTitle ||
                                  lesson?.sessionTitle ||
                                  "—"}
                              </p>
                              <Chip
                                size="sm"
                                style={{
                                  backgroundColor: `${colors.state.warning}20`,
                                  color: colors.state.warning,
                                  fontSize: "10px",
                                  flexShrink: 0,
                                }}
                              >
                                {t(
                                  "studentDashboard.schedule.reschedule.requestStatusPending",
                                )}
                              </Chip>
                            </div>
                            {tutorName && (
                              <div className="flex items-center gap-1.5">
                                <Avatar
                                  src={withCDN(lesson?.tutorAvatar)}
                                  name={tutorName}
                                  size="sm"
                                  className="w-4 h-4 text-[8px] flex-shrink-0"
                                />
                                <p
                                  className="text-xs"
                                  style={{ color: colors.text.secondary }}
                                >
                                  {tutorName}
                                </p>
                              </div>
                            )}
                            {lesson && (
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className="text-xs flex items-center gap-1"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  <Clock
                                    weight="duotone"
                                    className="w-3.5 h-3.5 flex-shrink-0"
                                  />
                                  {new Date(lesson.startTime).toLocaleString(
                                    dateLocale,
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                  {lesson.endTime && (
                                    <>
                                      {" — "}
                                      {new Date(
                                        lesson.endTime,
                                      ).toLocaleTimeString(dateLocale, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </>
                                  )}
                                </p>
                                <Button
                                  size="sm"
                                  variant="light"
                                  className="h-6 px-2 text-xs flex-shrink-0"
                                  startContent={<Eye className="w-3 h-3" />}
                                  onPress={() => {
                                    setIsRequestsModalOpen(false);
                                    handleOpenLessonDetail(lesson);
                                  }}
                                >
                                  {t("studentDashboard.schedule.viewDetail")}
                                </Button>
                              </div>
                            )}
                            <div
                              className="px-2.5 py-2 rounded-lg"
                              style={{
                                backgroundColor: `${colors.primary.main}10`,
                                border: `1px solid ${colors.primary.main}20`,
                              }}
                            >
                              <p
                                className="text-xs font-medium"
                                style={{ color: colors.primary.main }}
                              >
                                {t(
                                  "studentDashboard.schedule.reschedule.requestProposed",
                                )}
                              </p>
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: colors.text.primary }}
                              >
                                {new Date(req.proposedStartTime).toLocaleString(
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
                                {new Date(
                                  req.proposedEndTime,
                                ).toLocaleTimeString(dateLocale, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            {req.studentNote && (
                              <p
                                className="text-xs italic"
                                style={{ color: colors.text.secondary }}
                              >
                                "{req.studentNote}"
                              </p>
                            )}
                            <p
                              className="text-[10px]"
                              style={{ color: colors.text.tertiary }}
                            >
                              {t(
                                "studentDashboard.schedule.reschedule.awaitingTutor",
                              )}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ModalBody>
              </>
            );
          }}
        </ModalContent>
      </Modal>

      {/* ==================== REFUND TICKETS MODAL ==================== */}
      <Modal
        isOpen={isRefundTicketsModalOpen}
        onOpenChange={(open) => setIsRefundTicketsModalOpen(open)}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {() => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("studentDashboard.schedule.refundRequest.ticketsBtn")}
              </ModalHeader>
              <ModalBody className="pb-6">
                <div className="space-y-3">
                  {refundTickets.length === 0 ? (
                    <p
                      className="text-sm text-center py-6"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("studentDashboard.schedule.refundRequest.noTickets")}
                    </p>
                  ) : (
                    refundTickets.map((ticket) => {
                      const statusColor =
                        ticket.status === "Open"
                          ? colors.state.warning
                          : ticket.status === "InProgress"
                            ? colors.primary.main
                            : ticket.status === "Resolved"
                              ? colors.state.success
                              : colors.text.tertiary;
                      return (
                        <div
                          key={ticket.id}
                          className="p-3 rounded-xl space-y-1.5"
                          style={{ backgroundColor: colors.background.gray }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="font-semibold text-sm truncate"
                              style={{ color: colors.text.primary }}
                            >
                              {ticket.subject}
                            </p>
                            <Chip
                              size="sm"
                              style={{
                                backgroundColor: `${statusColor}20`,
                                color: statusColor,
                                fontSize: "10px",
                                flexShrink: 0,
                              }}
                            >
                              {ticket.status}
                            </Chip>
                          </div>
                          <p
                            className="text-xs"
                            style={{ color: colors.text.secondary }}
                          >
                            {new Date(ticket.createdAt).toLocaleString(
                              dateLocale,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                          {ticket.description && (
                            <p
                              className="text-xs line-clamp-2"
                              style={{ color: colors.text.tertiary }}
                            >
                              {ticket.description
                                .split("\n")
                                .slice(0, 2)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Schedule;
