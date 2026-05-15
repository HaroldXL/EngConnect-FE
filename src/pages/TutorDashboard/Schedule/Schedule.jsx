import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AddCircle,
  AltArrowLeft,
  AltArrowRight,
  BookBookmark,
  CalendarAdd,
  CalendarMark,
  CircleBottomUp,
  ClockCircle,
  CloseSquare,
  DangerTriangle,
  DocumentText,
  Eye,
  Filter,
  LinkMinimalistic,
  MenuDots,
  Pen,
  PlayCircle,
  Record,
  Restart,
  TrashBinMinimalistic,
  UserRounded,
  Videocamera,
} from "@solar-icons/react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { selectUser } from "../../../store";
import {
  tutorApi,
  studentApi,
  coursesApi,
  makeupApi,
  rescheduleApi,
  supportApi,
} from "../../../api";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
} from "@heroui/react";
import ScheduleSkeleton from "../../../components/ScheduleSkeleton/ScheduleSkeleton";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";

import calendarIllustration from "../../../assets/illustrations/calendar.avif";
import VideoModal from "../../../components/VideoModal/VideoModal";
import LessonDetailModal from "../../../components/LessonDetailModal/LessonDetailModal";
import TutorRescheduleOfferModal from "../../../components/TutorRescheduleOfferModal/TutorRescheduleOfferModal";
import TutorRescheduleTicketModal from "../../../components/TutorRescheduleTicketModal/TutorRescheduleTicketModal";

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

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lessons
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [activeView, setActiveView] = useState("lessons");

  // Calendar week navigation
  const [calendarWeekStart, setCalendarWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday-based
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + diff);
    return monday;
  });

  // Add/Edit modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formWeekday, setFormWeekday] = useState("Monday");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formDurationMinutes, setFormDurationMinutes] = useState(60);
  const [sessionTimes, setSessionTimes] = useState([]);
  const [sessionTimesLoading, setSessionTimesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [weekdayLocked, setWeekdayLocked] = useState(false);

  // Delete modal
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Lesson detail modal
  const {
    isOpen: isLessonDetailOpen,
    onOpen: onLessonDetailOpen,
    onClose: onLessonDetailClose,
  } = useDisclosure();
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [sidebarView, setSidebarView] = useState("today");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Video recording modal
  const {
    isOpen: isVideoOpen,
    onOpen: onVideoOpen,
    onOpenChange: onVideoOpenChange,
  } = useDisclosure();
  const [videoUrl, setVideoUrl] = useState("");

  // Reschedule offer modal (Scheduled lessons)
  const {
    isOpen: isRescheduleOpen,
    onOpen: onRescheduleOpen,
    onClose: onRescheduleClose,
  } = useDisclosure();
  // Reschedule ticket modal (NoTutor lessons)
  const {
    isOpen: isTicketOpen,
    onOpen: onTicketOpen,
    onClose: onTicketClose,
  } = useDisclosure();
  const [rescheduleLesson, setRescheduleLesson] = useState(null);
  const [rescheduleOffers, setRescheduleOffers] = useState([]);

  // Student reschedule requests
  const [studentRequests, setStudentRequests] = useState([]);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Reschedule modals
  const [rescheduleTickets, setRescheduleTickets] = useState([]);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [offersModalTab, setOffersModalTab] = useState("reschedule");
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [lessonExtras, setLessonExtras] = useState({});
  const [myMakeupRequests, setMyMakeupRequests] = useState([]);

  // Student filter
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [filterStudentId, setFilterStudentId] = useState(null);
  const [isStudentFilterOpen, setIsStudentFilterOpen] = useState(false);

  const allTimeOptions = [];
  for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      allTimeOptions.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
  }

  const computeEndTime = (startHHMM, durationMin) => {
    const [h, m] = startHHMM.split(":").map(Number);
    const totalMin = h * 60 + m + durationMin;
    return `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
  };

  const fetchSessionTimes = useCallback(async () => {
    try {
      setSessionTimesLoading(true);
      const res = await tutorApi.getMyCoursesSessionTime({
        status: "Published",
      });
      const items = res?.data || [];
      const uniqueMinutes = [
        ...new Set(items.map((c) => c.estimatedTimeLessonMinutes)),
      ].sort((a, b) => a - b);
      setSessionTimes(uniqueMinutes);
    } catch {
      setSessionTimes([]);
    } finally {
      setSessionTimesLoading(false);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    if (!user?.tutorId) return;
    try {
      setLoading(true);
      const res = await tutorApi.getTutorSchedules({
        TutorId: user.tutorId,
        "page-size": 500,
      });
      if (res.isSuccess) {
        setSchedules(res.data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.tutorId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const fetchLessons = useCallback(async () => {
    if (!user?.tutorId) return;
    try {
      setLessonsLoading(true);
      const res = await studentApi.getLessons({
        TutorId: user.tutorId,
        "page-size": 200,
      });
      setLessons(
        (res?.data?.items || []).filter(
          (l) => l.status !== "MadeUp" && l.status !== "Rescheduled",
        ),
      );
    } catch (err) {
      console.error("Failed to fetch lessons:", err);
    } finally {
      setLessonsLoading(false);
    }
  }, [user?.tutorId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const fetchRescheduleOffers = useCallback(async () => {
    if (!user?.tutorId) return;
    try {
      const res = await rescheduleApi.getOffers({
        TutorId: user.tutorId,
        "page-size": 200,
      });
      const items = res?.data?.items || [];
      setRescheduleOffers(items);
      // fetch lesson details for any lessonId not already in lessons state
      const missingIds = [...new Set(items.map((o) => o.lessonId))].filter(
        (id) => id && !lessons.find((l) => l.id === id),
      );
      if (missingIds.length > 0) {
        const results = await Promise.allSettled(
          missingIds.map((id) => studentApi.getLessonById(id)),
        );
        const extras = {};
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value?.data) {
            extras[missingIds[i]] = r.value.data;
          }
        });
        setLessonExtras((prev) => ({ ...prev, ...extras }));
      }
    } catch {
      // silently ignore
    }
  }, [user?.tutorId, lessons]);

  useEffect(() => {
    fetchRescheduleOffers();
  }, [fetchRescheduleOffers]);

  const fetchMyMakeupRequests = useCallback(async () => {
    if (!user?.tutorId) return;
    try {
      const res = await makeupApi.getRequests({
        TutorId: user.tutorId,
        "page-size": 200,
      });
      const items = res?.data?.items || [];
      setMyMakeupRequests(items.filter((r) => r.createdByRole === "Tutor"));
    } catch {
      // silently ignore
    }
  }, [user?.tutorId]);

  useEffect(() => {
    fetchMyMakeupRequests();
  }, [fetchMyMakeupRequests]);

  const fetchStudentRequests = useCallback(async () => {
    if (!user?.tutorId) return;
    try {
      const res = await rescheduleApi.getRequests({ "page-size": 200 });
      const all = res?.data?.items || [];
      const lessonIdSet = new Set(lessons.map((l) => l.id));
      setStudentRequests(all.filter((r) => lessonIdSet.has(r.lessonId)));
    } catch {
      // silently ignore
    }
  }, [user?.tutorId, lessons]);

  useEffect(() => {
    if (lessons.length > 0) fetchStudentRequests();
  }, [lessons.length, fetchStudentRequests]);

  const fetchRescheduleTickets = useCallback(async () => {
    try {
      const res = await supportApi.getTickets({
        Type: "Reschedule",
        "page-size": 100,
      });
      const items = (res?.data?.items || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setRescheduleTickets(items);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchRescheduleTickets();
  }, [fetchRescheduleTickets]);

  const fetchEnrolledStudents = useCallback(async () => {
    try {
      const res = await coursesApi.getMyStudentEnrollments({
        Status: "InProgress,Completed",
        "page-size": 200,
      });
      const items = res?.data?.items || [];
      const seen = new Set();
      const unique = items.filter((e) => {
        if (seen.has(e.studentId)) return false;
        seen.add(e.studentId);
        return true;
      });
      setEnrolledStudents(unique);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchEnrolledStudents();
  }, [fetchEnrolledStudents]);

  const handleApproveRequest = async (req) => {
    setProcessingId(req.id);
    try {
      await rescheduleApi.updateRequest(req.id, {
        request: { id: req.id, status: "Approved", tutorNote: "" },
      });
      fetchStudentRequests();
      fetchLessons();
    } catch {
      // silently ignore
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (req) => {
    setProcessingId(req.id);
    try {
      await rescheduleApi.updateRequest(req.id, {
        request: { id: req.id, status: "Rejected", tutorNote: rejectNote },
      });
      setRejectingId(null);
      setRejectNote("");
      fetchStudentRequests();
    } catch {
      // silently ignore
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const todayName =
    WEEKDAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todaySchedules = schedules
    .filter((s) => s.weekday === todayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Handlers
  const handleOpenCreate = (weekday = "Monday") => {
    setEditingSchedule(null);
    setFormWeekday(weekday);
    setWeekdayLocked(true);
    setFormStartTime("09:00");
    setFormDurationMinutes(null);
    setSaveError(null);
    fetchSessionTimes();
    onOpen();
  };

  const handleOpenEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormWeekday(schedule.weekday);
    setWeekdayLocked(false);
    setFormStartTime(schedule.startTime.slice(0, 5));
    const startMin =
      Number.parseInt(schedule.startTime.slice(0, 2), 10) * 60 +
      Number.parseInt(schedule.startTime.slice(3, 5), 10);
    const endMin =
      Number.parseInt(schedule.endTime.slice(0, 2), 10) * 60 +
      Number.parseInt(schedule.endTime.slice(3, 5), 10);
    setFormDurationMinutes(endMin - startMin > 0 ? endMin - startMin : 60);
    setSaveError(null);
    fetchSessionTimes();
    onOpen();
  };

  const handleOpenDelete = (schedule) => {
    setDeletingSchedule(schedule);
    onDeleteOpen();
  };

  const handleSave = async () => {
    if (!user?.tutorId) return;
    setSaving(true);
    setSaveError(null);
    const endTime = computeEndTime(formStartTime, formDurationMinutes);
    try {
      if (editingSchedule) {
        await tutorApi.updateTutorSchedule(editingSchedule.id, {
          request: {
            id: editingSchedule.id,
            tutorId: user.tutorId,
            weekday: formWeekday,
            startTime: formStartTime + ":00",
            endTime: endTime + ":00",
          },
        });
      } else {
        await tutorApi.createTutorSchedule({
          request: {
            tutorId: user.tutorId,
            weekday: formWeekday,
            startTime: formStartTime + ":00",
            endTime: endTime + ":00",
          },
        });
      }
      onClose();
      fetchSchedules();
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === "Schedule.TutorSchedule.Conflict") {
        setSaveError(t("tutorDashboard.schedule.errorConflict"));
      } else {
        console.error("Failed to save schedule:", err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchedule) return;
    setDeleting(true);
    try {
      await tutorApi.deleteTutorSchedule(deletingSchedule.id);
      onDeleteClose();
      setDeletingSchedule(null);
      fetchSchedules();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return colors.state.success;
      case "Booked":
        return colors.primary.main;
      case "Pending":
        return colors.state.warning;
      case "Inactive":
        return colors.text.tertiary;
      default:
        return colors.text.secondary;
    }
  };

  const formatTime = (timeStr) => timeStr?.slice(0, 5) || "";

  const formatLessonTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLessonStatusColor = (status) => {
    switch (status) {
      case "Scheduled":
        return colors.primary.main;
      case "Completed":
      case "Settled":
        return colors.state.success;
      case "Cancelled":
      case "Refund":
        return colors.state.error;
      case "InProgress":
        return colors.state.warning;
      case "NoStudent":
      case "NoTutor":
        return colors.state.error;
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

  // TODO: restore date filter after testing
  const now = new Date();
  const todayStr = now.toDateString();

  const filteredLessons = useMemo(
    () =>
      filterStudentId
        ? lessons.filter((l) => l.studentId === filterStudentId)
        : lessons,
    [lessons, filterStudentId],
  );

  const todayLessons = useMemo(
    () =>
      filteredLessons
        .filter((l) => new Date(l.startTime).toDateString() === todayStr)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [filteredLessons, todayStr],
  );

  const upcomingLessons = useMemo(
    () =>
      filteredLessons
        .filter(
          (l) =>
            new Date(l.startTime) > now &&
            new Date(l.startTime).toDateString() !== todayStr,
        )
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [filteredLessons, todayStr],
  );

  const studentFullName = (lesson) =>
    [lesson.studentFirstName, lesson.studentLastName].filter(Boolean).join(" ");

  const canJoinLesson = (lesson) =>
    lesson.meetingStatus === "InProgress" ||
    (lesson.status === "NoTutor" && lesson.meetingStatus === "Waiting") ||
    (lesson.status !== "Completed" &&
      lesson.status !== "Settled" &&
      lesson.status !== "NoStudent" &&
      lesson.status !== "NoTutor" &&
      lesson.status !== "Cancelled" &&
      lesson.status !== "Refund" &&
      lesson.status !== "Reschedule" &&
      lesson.meetingStatus !== "Ended");

  const handleOpenLessonDetail = (lesson) => {
    setSelectedLesson(lesson);
    onLessonDetailOpen();
  };

  const getMeetingStatusInfo = (lesson) => {
    if (lesson.meetingStatus === "Waiting")
      return {
        label: t("tutorDashboard.schedule.meetingWaiting"),
        color: colors.state.warning,
      };
    if (lesson.meetingStatus === "InProgress")
      return {
        label: t("tutorDashboard.schedule.meetingInProgress"),
        color: colors.state.success,
      };
    if (lesson.meetingStatus === "Ended")
      return {
        label: t("tutorDashboard.schedule.meetingEnded"),
        color: colors.state.success,
      };
    return null;
  };

  const getRescheduleDeadline = (noTutorLesson) => {
    const next = lessons
      .filter(
        (l) =>
          l.studentId === noTutorLesson.studentId &&
          new Date(l.startTime) > new Date(noTutorLesson.startTime),
      )
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
    if (!next) return null;
    return new Date(new Date(next.startTime).getTime() - 24 * 60 * 60 * 1000);
  };

  const handleOpenReschedule = (lesson) => {
    setRescheduleLesson(lesson);
    if (lesson.status === "NoTutor") {
      onTicketOpen();
    } else {
      onRescheduleOpen();
    }
  };

  const formatRecordDuration = (seconds) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m ${seconds % 60}s`;
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
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + diff);
    setCalendarWeekStart(monday);
  };

  const CALENDAR_START_HOUR = 7;
  const CALENDAR_END_HOUR = 22;
  const HOUR_HEIGHT = 48; // px per hour — compact

  // Current time indicator position
  const currentTimeTop = useMemo(() => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    if (h < CALENDAR_START_HOUR || h >= CALENDAR_END_HOUR) return null;
    return (((h - CALENDAR_START_HOUR) * 60 + m) / 60) * HOUR_HEIGHT;
  }, [currentTime]);

  const getLessonsForDay = (dayDate) => {
    return filteredLessons.filter((l) => {
      const lessonDate = new Date(l.startTime);
      return lessonDate.toDateString() === dayDate.toDateString();
    });
  };

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
            {t("tutorDashboard.schedule.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("tutorDashboard.schedule.subtitle")}
          </p>
        </div>
      </motion.div>

      {/* Tabs: Schedules / Lessons + reschedule action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <Tabs
          selectedKey={activeView}
          onSelectionChange={setActiveView}
          color="primary"
          classNames={{ tabList: "gap-2", tab: "px-4" }}
        >
          <Tab
            key="lessons"
            title={
              <div className="flex items-center gap-2">
                <BookBookmark weight="BoldDuotone" className="w-5 h-5" />
                <span>{t("tutorDashboard.schedule.myLessons")}</span>
              </div>
            }
          />
          <Tab
            key="schedules"
            title={
              <div className="flex items-center gap-2">
                <CalendarMark weight="BoldDuotone" className="w-5 h-5" />
                <span>{t("tutorDashboard.schedule.scheduleSlots")}</span>
              </div>
            }
          />
        </Tabs>

        {/* 3 reschedule action buttons */}
        <div className="flex items-center gap-2">
          {[
            {
              key: "offers",
              icon: <Restart weight="BoldDuotone" className="w-4 h-4" />,
              label: t("tutorDashboard.schedule.panel.offersBtn"),
              badge:
                rescheduleOffers.filter(
                  (o) => o.status === "PendingStudentChoice",
                ).length +
                myMakeupRequests.filter((r) => r.status === "Pending").length,
              badgeColor: colors.state.warning,
              btnBg: `${colors.state.warning}22`,
              btnColor: colors.state.warning,
              onPress: () => setIsOffersModalOpen(true),
            },
            {
              key: "requests",
              icon: <Restart weight="BoldDuotone" className="w-4 h-4" />,
              label: t("tutorDashboard.schedule.panel.studentRequestsBtn"),
              badge: studentRequests.filter((r) => r.status === "Pending")
                .length,
              badgeColor: colors.state.error,
              btnBg: `${colors.primary.main}18`,
              btnColor: colors.primary.main,
              onPress: () => setIsRequestsModalOpen(true),
            },
            {
              key: "tickets",
              icon: <DocumentText weight="BoldDuotone" className="w-4 h-4" />,
              label: t("tutorDashboard.schedule.panel.ticketsBtn"),
              badge: rescheduleTickets.filter((tk) => tk.status === "Open")
                .length,
              badgeColor: colors.state.error,
              btnBg: "#0d9488" + "18",
              btnColor: "#0d9488",
              onPress: () => setIsTicketsModalOpen(true),
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

          {/* Student filter button / active chip — lessons tab only */}
          {activeView === "lessons" &&
            (filterStudentId ? (
              (() => {
                const s = enrolledStudents.find(
                  (e) => e.studentId === filterStudentId,
                );
                return (
                  <div
                    className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium cursor-pointer"
                    style={{
                      backgroundColor: `${colors.primary.main}18`,
                      border: `1px solid ${colors.primary.main}40`,
                      color: colors.primary.main,
                    }}
                    onClick={() => setIsStudentFilterOpen(true)}
                  >
                    <Avatar
                      src={s?.studentAvatar}
                      name={s?.studentName}
                      size="sm"
                      className="w-5 h-5 text-[9px]"
                    />
                    <span className="max-w-[120px] truncate">
                      {s?.studentName}
                    </span>
                    <button
                      className="ml-0.5 rounded-full hover:opacity-70"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterStudentId(null);
                      }}
                    >
                      <CloseSquare
                        weight="BoldDuotone"
                        className="w-3.5 h-3.5"
                      />
                    </button>
                  </div>
                );
              })()
            ) : (
              <Button
                size="sm"
                variant="flat"
                className="flex items-center gap-1.5 text-xs h-9 px-3"
                style={{
                  backgroundColor: `${colors.primary.main}12`,
                  color: colors.primary.main,
                  border: `1px solid ${colors.primary.main}30`,
                }}
                startContent={
                  <Filter weight="BoldDuotone" className="w-4 h-4" />
                }
                onPress={() => setIsStudentFilterOpen(true)}
              >
                {t("tutorDashboard.schedule.filterStudent")}
              </Button>
            ))}
        </div>
      </motion.div>

      {activeView === "schedules" ? (
        <>
          <div className="grid gap-6">
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
                    <ScheduleSkeleton />
                  ) : (
                    <div className="space-y-4">
                      {WEEKDAYS.map((day) => {
                        const daySchedules = schedules
                          .filter((s) => s.weekday === day)
                          .sort((a, b) =>
                            a.startTime.localeCompare(b.startTime),
                          );
                        const isToday = day === todayName;

                        return (
                          <div
                            key={day}
                            className="p-4 rounded-xl"
                            style={{
                              backgroundColor: isToday
                                ? colors.background.primaryLight
                                : colors.background.gray,
                              border: isToday
                                ? `1px solid ${colors.primary.main}30`
                                : "none",
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h3
                                  className="font-semibold"
                                  style={{ color: colors.text.primary }}
                                >
                                  {t(
                                    `tutorDashboard.schedule.days.${day.toLowerCase()}`,
                                  )}
                                </h3>
                                {isToday && (
                                  <Chip
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                  >
                                    {t("tutorDashboard.schedule.today")}
                                  </Chip>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-sm"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {daySchedules.length}{" "}
                                  {t("tutorDashboard.schedule.slots")}
                                </span>
                                <Button
                                  size="sm"
                                  color="primary"
                                  startContent={
                                    <CalendarAdd weight="BoldDuotone" />
                                  }
                                  style={{
                                    backgroundColor: colors.primary.main,
                                    color: colors.text.white,
                                  }}
                                  onPress={() => handleOpenCreate(day)}
                                >
                                  {t("tutorDashboard.schedule.addSchedule")}
                                </Button>
                              </div>
                            </div>

                            {daySchedules.length === 0 ? (
                              <p
                                className="text-sm py-2"
                                style={{ color: colors.text.tertiary }}
                              >
                                {t("tutorDashboard.schedule.noSlots")}
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {daySchedules.map((schedule) => (
                                  <div
                                    key={schedule.id}
                                    className="flex items-center justify-between p-3 rounded-lg"
                                    style={{
                                      backgroundColor: colors.background.light,
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <ClockCircle
                                        weight="BoldDuotone"
                                        className="w-4 h-4"
                                        style={{
                                          color: getStatusColor(
                                            schedule.status,
                                          ),
                                        }}
                                      />
                                      <span
                                        className="font-medium text-sm"
                                        style={{ color: colors.text.primary }}
                                      >
                                        {formatTime(schedule.startTime)} —{" "}
                                        {formatTime(schedule.endTime)}
                                      </span>
                                      <Chip
                                        size="sm"
                                        style={{
                                          backgroundColor: `${getStatusColor(schedule.status)}20`,
                                          color: getStatusColor(
                                            schedule.status,
                                          ),
                                        }}
                                      >
                                        {t(
                                          `tutorDashboard.schedule.status.${schedule.status.toLowerCase()}`,
                                        )}
                                      </Chip>
                                    </div>
                                    {schedule.status === "Open" && (
                                      <div className="flex items-center gap-1">
                                        <Tooltip
                                          content={t(
                                            "tutorDashboard.schedule.edit",
                                          )}
                                        >
                                          <Button
                                            size="sm"
                                            isIconOnly
                                            variant="light"
                                            onPress={() =>
                                              handleOpenEdit(schedule)
                                            }
                                          >
                                            <Pen
                                              weight="BoldDuotone"
                                              className="w-4 h-4"
                                              style={{
                                                color: colors.primary.main,
                                              }}
                                            />
                                          </Button>
                                        </Tooltip>
                                        <Tooltip
                                          content={t(
                                            "tutorDashboard.schedule.delete",
                                          )}
                                        >
                                          <Button
                                            size="sm"
                                            isIconOnly
                                            variant="light"
                                            onPress={() =>
                                              handleOpenDelete(schedule)
                                            }
                                          >
                                            <TrashBinMinimalistic
                                              weight="BoldDuotone"
                                              className="w-4 h-4"
                                              style={{
                                                color: colors.state.error,
                                              }}
                                            />
                                          </Button>
                                        </Tooltip>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Legend */}
                  <div
                    className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t"
                    style={{ borderColor: colors.border.medium }}
                  >
                    {["Open", "Booked", "Pending", "Inactive"].map((status) => (
                      <div key={status} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: getStatusColor(status) }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: colors.text.secondary }}
                        >
                          {t(
                            `tutorDashboard.schedule.status.${status.toLowerCase()}`,
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </>
      ) : (
        /* Lessons View — Weekly Calendar */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {lessonsLoading ? (
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
                {t("tutorDashboard.schedule.noLessons")}
              </h3>
              <p
                className="text-center max-w-sm"
                style={{ color: colors.text.secondary }}
              >
                {t("tutorDashboard.schedule.noLessonsDesc")}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_460px]">
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
                        <AltArrowLeft
                          weight="BoldDuotone"
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
                        <AltArrowRight
                          weight="BoldDuotone"
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
                      {t("tutorDashboard.schedule.today")}
                    </Button>
                  </div>

                  {/* Calendar */}
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
                                {t(
                                  `tutorDashboard.schedule.days.${WEEKDAYS[idx].toLowerCase()}`,
                                ).slice(0, 3)}
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
                          {/* Time labels column */}
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
                                          t(
                                            "tutorDashboard.schedule.lessonLabel",
                                          )}
                                      </p>
                                      {pos.height > 30 && (
                                        <p
                                          className="text-[10px] truncate leading-tight mt-0.5"
                                          style={{
                                            color: blockColor.text,
                                            opacity: 0.8,
                                          }}
                                        >
                                          {studentFullName(lesson) ||
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
                      "Reschedule",
                      "Completed",
                      "NoStudent",
                      "NoTutor",
                      "Cancelled",
                      "Refund",
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

              {/* Sidebar — Today / Upcoming / Requests */}
              <Card
                shadow="none"
                className="border-none hidden lg:block lg:sticky lg:top-40 self-start"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-4">
                  {/* Sidebar tabs */}
                  <Tabs
                    selectedKey={sidebarView}
                    onSelectionChange={setSidebarView}
                    variant="solid"
                    fullWidth
                    className="mb-4"
                  >
                    <Tab
                      key="today"
                      title={
                        <div className="flex items-center gap-1.5 text-xs">
                          <CalendarMark
                            weight="BoldDuotone"
                            className="w-3.5 h-3.5"
                          />
                          <span>{t("tutorDashboard.schedule.today")}</span>
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
                          <ClockCircle
                            weight="BoldDuotone"
                            className="w-3.5 h-3.5"
                          />
                          <span>
                            {t("tutorDashboard.schedule.upcomingSidebarTab")}
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

                  {/* Sidebar content — today / upcoming */}
                  {(() => {
                    const sidebarLessons =
                      sidebarView === "today" ? todayLessons : upcomingLessons;
                    const emptyMessage =
                      sidebarView === "today"
                        ? t("tutorDashboard.schedule.noLessonsToday")
                        : t("tutorDashboard.schedule.noUpcoming");

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
                          const hasRecording = lesson.lessonRecord?.recordUrl;
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
                                  src={withCDN(lesson.studentAvatar)}
                                  name={studentFullName(lesson)}
                                  size="sm"
                                  className="w-8 h-8 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="font-semibold text-sm truncate"
                                    style={{ color: colors.text.primary }}
                                  >
                                    {studentFullName(lesson) ||
                                      t("tutorDashboard.schedule.lessonLabel")}
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
                                      <ClockCircle
                                        weight="BoldDuotone"
                                        className="w-3 h-3"
                                      />
                                      {sidebarView === "upcoming" &&
                                        new Date(
                                          lesson.startTime,
                                        ).toLocaleDateString(dateLocale, {
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
                                      <Record
                                        weight="BoldDuotone"
                                        className="w-2 h-2"
                                      />
                                      {meetingInfo.label}
                                    </span>
                                  )}
                                  {(lesson.status === "NoTutor" ||
                                    lesson.status === "Reschedule") &&
                                    (() => {
                                      const deadline =
                                        getRescheduleDeadline(lesson);
                                      if (!deadline) return null;
                                      const isPast = deadline < new Date();
                                      return (
                                        <span
                                          className="text-[11px] flex items-center gap-1 mt-1"
                                          style={{
                                            color: isPast
                                              ? colors.state.error
                                              : colors.state.warning,
                                          }}
                                        >
                                          <ClockCircle
                                            weight="BoldDuotone"
                                            className="w-3 h-3"
                                          />
                                          {isPast
                                            ? t(
                                                "tutorDashboard.schedule.reschedule.deadlinePassed",
                                              )
                                            : t(
                                                "tutorDashboard.schedule.reschedule.deadlineUntil",
                                                {
                                                  date: deadline.toLocaleString(
                                                    dateLocale,
                                                    {
                                                      month: "short",
                                                      day: "numeric",
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                    },
                                                  ),
                                                },
                                              )}
                                        </span>
                                      );
                                    })()}
                                </div>
                              </div>
                              {(() => {
                                const hasPendOffer = rescheduleOffers.some(
                                  (o) =>
                                    o.lessonId === lesson.id &&
                                    o.status === "PendingStudentChoice",
                                );
                                const hasPendReq = studentRequests.some(
                                  (r) =>
                                    r.lessonId === lesson.id &&
                                    r.status === "Pending",
                                );
                                return hasPendOffer || hasPendReq ? (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {hasPendOffer && (
                                      <Chip
                                        size="sm"
                                        className="h-4 text-[10px]"
                                        style={{
                                          backgroundColor: `${colors.state.warning}20`,
                                          color: colors.state.warning,
                                        }}
                                      >
                                        {t(
                                          "tutorDashboard.schedule.reschedule.pendingChip",
                                        )}
                                      </Chip>
                                    )}
                                    {hasPendReq && (
                                      <Chip
                                        size="sm"
                                        className="h-4 text-[10px]"
                                        style={{
                                          backgroundColor: `${colors.primary.main}15`,
                                          color: colors.primary.main,
                                        }}
                                      >
                                        {t(
                                          "tutorDashboard.schedule.studentRequest.pendingBtn",
                                        )}
                                      </Chip>
                                    )}
                                  </div>
                                ) : null;
                              })()}
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  className="flex-1"
                                  startContent={
                                    <Eye
                                      weight="BoldDuotone"
                                      className="w-3.5 h-3.5"
                                    />
                                  }
                                  onPress={(e) => {
                                    e.stopPropagation?.();
                                    handleOpenLessonDetail(lesson);
                                  }}
                                >
                                  {t("tutorDashboard.schedule.viewDetail")}
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
                                      <Videocamera
                                        weight="BoldDuotone"
                                        className="w-3.5 h-3.5"
                                      />
                                    }
                                    onPress={(e) => {
                                      e.stopPropagation?.();
                                      navigate(`/meeting/${lesson.id}`);
                                    }}
                                  >
                                    {lesson.meetingStatus === "InProgress"
                                      ? t("tutorDashboard.schedule.joinBack")
                                      : lesson.status === "NoTutor" &&
                                          lesson.meetingStatus === "Waiting"
                                        ? t(
                                            "tutorDashboard.schedule.joinLesson",
                                          )
                                        : t(
                                            "tutorDashboard.schedule.joinLesson",
                                          )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardBody>
              </Card>

              {/* Mobile Today/Upcoming / Requests — visible on sm/md, hidden on lg+ */}
              <Card
                shadow="none"
                className="border-none lg:hidden"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-4">
                  <Tabs
                    selectedKey={sidebarView}
                    onSelectionChange={setSidebarView}
                    variant="solid"
                    fullWidth
                    className="mb-4"
                  >
                    <Tab
                      key="today"
                      title={
                        <div className="flex items-center gap-1.5 text-xs">
                          <CalendarMark
                            weight="BoldDuotone"
                            className="w-3.5 h-3.5"
                          />
                          <span>{t("tutorDashboard.schedule.today")}</span>
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
                          <ClockCircle
                            weight="BoldDuotone"
                            className="w-3.5 h-3.5"
                          />
                          <span>
                            {t("tutorDashboard.schedule.upcomingSidebarTab")}
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
                    const list =
                      sidebarView === "today" ? todayLessons : upcomingLessons;
                    const emptyMsg =
                      sidebarView === "today"
                        ? t("tutorDashboard.schedule.noLessonsToday")
                        : t("tutorDashboard.schedule.noUpcoming");
                    if (list.length === 0) {
                      return (
                        <p
                          className="text-sm text-center py-6"
                          style={{ color: colors.text.tertiary }}
                        >
                          {emptyMsg}
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {list.map((lesson) => {
                          const blockColor = getLessonBlockColor(lesson.status);
                          const durationMin = Math.round(
                            (new Date(lesson.endTime) -
                              new Date(lesson.startTime)) /
                              60000,
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
                                  src={withCDN(lesson.studentAvatar)}
                                  name={studentFullName(lesson)}
                                  size="sm"
                                  className="w-8 h-8 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="font-semibold text-sm truncate"
                                    style={{ color: colors.text.primary }}
                                  >
                                    {studentFullName(lesson) ||
                                      t("tutorDashboard.schedule.lessonLabel")}
                                  </p>
                                  <p
                                    className="text-xs truncate mt-0.5"
                                    style={{ color: colors.text.secondary }}
                                  >
                                    {lesson.courseTitle}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span
                                      className="text-[11px] flex items-center gap-1"
                                      style={{ color: colors.text.tertiary }}
                                    >
                                      <ClockCircle
                                        weight="BoldDuotone"
                                        className="w-3 h-3"
                                      />
                                      {sidebarView === "upcoming" &&
                                        new Date(
                                          lesson.startTime,
                                        ).toLocaleDateString(dateLocale, {
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
                                      <Record
                                        weight="BoldDuotone"
                                        className="w-2 h-2"
                                      />
                                      {meetingInfo.label}
                                    </span>
                                  )}
                                  {(lesson.status === "NoTutor" ||
                                    lesson.status === "Reschedule") &&
                                    (() => {
                                      const deadline =
                                        getRescheduleDeadline(lesson);
                                      if (!deadline) return null;
                                      const isPast = deadline < new Date();
                                      return (
                                        <span
                                          className="text-[11px] flex items-center gap-1 mt-1"
                                          style={{
                                            color: isPast
                                              ? colors.state.error
                                              : colors.state.warning,
                                          }}
                                        >
                                          <ClockCircle
                                            weight="BoldDuotone"
                                            className="w-3 h-3"
                                          />
                                          {isPast
                                            ? t(
                                                "tutorDashboard.schedule.reschedule.deadlinePassed",
                                              )
                                            : t(
                                                "tutorDashboard.schedule.reschedule.deadlineUntil",
                                                {
                                                  date: deadline.toLocaleString(
                                                    dateLocale,
                                                    {
                                                      month: "short",
                                                      day: "numeric",
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                    },
                                                  ),
                                                },
                                              )}
                                        </span>
                                      );
                                    })()}
                                </div>
                              </div>
                              {(() => {
                                const hasPendOffer = rescheduleOffers.some(
                                  (o) =>
                                    o.lessonId === lesson.id &&
                                    o.status === "PendingStudentChoice",
                                );
                                const hasPendReq = studentRequests.some(
                                  (r) =>
                                    r.lessonId === lesson.id &&
                                    r.status === "Pending",
                                );
                                return hasPendOffer || hasPendReq ? (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {hasPendOffer && (
                                      <Chip
                                        size="sm"
                                        className="h-4 text-[10px]"
                                        style={{
                                          backgroundColor: `${colors.state.warning}20`,
                                          color: colors.state.warning,
                                        }}
                                      >
                                        {t(
                                          "tutorDashboard.schedule.reschedule.pendingChip",
                                        )}
                                      </Chip>
                                    )}
                                    {hasPendReq && (
                                      <Chip
                                        size="sm"
                                        className="h-4 text-[10px]"
                                        style={{
                                          backgroundColor: `${colors.primary.main}15`,
                                          color: colors.primary.main,
                                        }}
                                      >
                                        {t(
                                          "tutorDashboard.schedule.studentRequest.pendingBtn",
                                        )}
                                      </Chip>
                                    )}
                                  </div>
                                ) : null;
                              })()}
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  className="flex-1"
                                  startContent={
                                    <Eye
                                      weight="BoldDuotone"
                                      className="w-3.5 h-3.5"
                                    />
                                  }
                                  onPress={() => handleOpenLessonDetail(lesson)}
                                >
                                  {t("tutorDashboard.schedule.viewDetail")}
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
                                      <Videocamera
                                        weight="BoldDuotone"
                                        className="w-3.5 h-3.5"
                                      />
                                    }
                                    onPress={() =>
                                      navigate(`/meeting/${lesson.id}`)
                                    }
                                  >
                                    {lesson.meetingStatus === "InProgress"
                                      ? t("tutorDashboard.schedule.joinBack")
                                      : lesson.status === "NoTutor" &&
                                          lesson.meetingStatus === "Waiting"
                                        ? t(
                                            "tutorDashboard.schedule.joinLesson",
                                          )
                                        : t(
                                            "tutorDashboard.schedule.joinLesson",
                                          )}
                                  </Button>
                                )}
                              </div>
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
      )}

      {/* Add/Edit Schedule Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            {editingSchedule
              ? t("tutorDashboard.schedule.editSchedule")
              : t("tutorDashboard.schedule.addSchedule")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {saveError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: `${colors.state.error}15`,
                    color: colors.state.error,
                    border: `1px solid ${colors.state.error}30`,
                  }}
                >
                  <DangerTriangle
                    weight="BoldDuotone"
                    className="w-4 h-4 flex-shrink-0"
                  />
                  {saveError}
                </div>
              )}
              <Select
                label={t("tutorDashboard.schedule.weekday")}
                selectedKeys={[formWeekday]}
                classNames={selectClassNames}
                isDisabled={weekdayLocked}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0];
                  if (val) setFormWeekday(val);
                }}
              >
                {WEEKDAYS.map((day) => (
                  <SelectItem key={day}>
                    {t(`tutorDashboard.schedule.days.${day.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </Select>

              <div className="flex items-center gap-3">
                <Select
                  label={t("tutorDashboard.schedule.startTime")}
                  selectedKeys={[formStartTime]}
                  classNames={selectClassNames}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    if (val) setFormStartTime(val);
                  }}
                >
                  {allTimeOptions.map((time) => (
                    <SelectItem key={time}>{time}</SelectItem>
                  ))}
                </Select>
                <span
                  className="text-sm flex-shrink-0"
                  style={{ color: colors.text.secondary }}
                >
                  —
                </span>
                <Select
                  label={t("tutorDashboard.schedule.duration")}
                  selectedKeys={
                    formDurationMinutes != null
                      ? [String(formDurationMinutes)]
                      : []
                  }
                  classNames={selectClassNames}
                  isLoading={sessionTimesLoading}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    if (val) setFormDurationMinutes(Number(val));
                  }}
                >
                  {(sessionTimes.length > 0
                    ? sessionTimes
                    : [30, 45, 60, 90, 120]
                  ).map((min) => (
                    <SelectItem key={String(min)}>
                      {t("tutorDashboard.schedule.durationMinutes", {
                        count: min,
                      })}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div
                className="flex items-center gap-2 px-1 text-sm"
                style={{ color: colors.text.secondary }}
              >
                <span>{t("tutorDashboard.schedule.endTime")}:</span>
                <span
                  className="font-medium"
                  style={{ color: colors.text.primary }}
                >
                  {formDurationMinutes != null
                    ? computeEndTime(formStartTime, formDurationMinutes)
                    : "—"}
                </span>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {t("tutorDashboard.schedule.cancel")}
            </Button>
            <Button
              isLoading={saving}
              isDisabled={formDurationMinutes == null}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
              onPress={handleSave}
            >
              {t("tutorDashboard.schedule.save")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            {t("tutorDashboard.schedule.confirmDelete")}
          </ModalHeader>
          <ModalBody>
            <div className="flex items-start gap-3">
              <DangerTriangle
                weight="BoldDuotone"
                className="w-6 h-6 flex-shrink-0"
                style={{ color: colors.state.warning }}
              />
              <p style={{ color: colors.text.secondary }}>
                {t("tutorDashboard.schedule.deleteMessage")}
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>
              {t("tutorDashboard.schedule.cancel")}
            </Button>
            <Button
              color="danger"
              isLoading={deleting}
              onPress={handleConfirmDelete}
            >
              {t("tutorDashboard.schedule.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Lesson Detail Modal */}
      <LessonDetailModal
        isOpen={isLessonDetailOpen}
        onClose={onLessonDetailClose}
        lesson={selectedLesson}
        rescheduleDeadline={
          selectedLesson?.status === "NoTutor" ||
          selectedLesson?.status === "Reschedule"
            ? getRescheduleDeadline(selectedLesson)
            : null
        }
        onRefresh={() => {
          fetchRescheduleOffers();
          fetchLessons();
        }}
      />

      <VideoModal
        isOpen={isVideoOpen}
        onOpenChange={onVideoOpenChange}
        videoUrl={videoUrl}
      />

      <TutorRescheduleOfferModal
        lesson={rescheduleLesson}
        isOpen={isRescheduleOpen}
        onClose={onRescheduleClose}
        tutorId={user?.tutorId}
        onSuccess={() => {
          fetchRescheduleOffers();
          fetchLessons();
        }}
      />

      <TutorRescheduleTicketModal
        lesson={rescheduleLesson}
        isOpen={isTicketOpen}
        onClose={onTicketClose}
        userId={user?.userId}
        rescheduleDeadline={
          rescheduleLesson ? getRescheduleDeadline(rescheduleLesson) : null
        }
        onSuccess={fetchLessons}
      />

      {/* Reschedule Offers + Makeup Requests Modal */}
      <Modal
        isOpen={isOffersModalOpen}
        onOpenChange={(open) => {
          setIsOffersModalOpen(open);
          if (!open) setOffersModalTab("reschedule");
        }}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {() => {
            const pendingOffers = rescheduleOffers.filter(
              (o) => o.status === "PendingStudentChoice",
            );
            const pendingMakeups = myMakeupRequests.filter(
              (r) => r.status === "Pending",
            );
            return (
              <>
                <ModalHeader style={{ color: colors.text.primary }}>
                  {t("tutorDashboard.schedule.panel.offersBtn")}
                </ModalHeader>
                <ModalBody className="pb-6">
                  <Tabs
                    selectedKey={offersModalTab}
                    onSelectionChange={setOffersModalTab}
                    size="sm"
                    className="mb-3"
                  >
                    <Tab
                      key="reschedule"
                      title={
                        <div className="flex items-center gap-1.5">
                          <Restart weight="BoldDuotone" className="w-3.5 h-3.5" />
                          <span>{t("tutorDashboard.schedule.panel.offersTab")}</span>
                          {pendingOffers.length > 0 && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${colors.state.warning}25`,
                                color: colors.state.warning,
                              }}
                            >
                              {pendingOffers.length}
                            </span>
                          )}
                        </div>
                      }
                    />
                    <Tab
                      key="makeup"
                      title={
                        <div className="flex items-center gap-1.5">
                          <CircleBottomUp weight="BoldDuotone" className="w-3.5 h-3.5" />
                          <span>{t("tutorDashboard.schedule.panel.makeupTab")}</span>
                          {pendingMakeups.length > 0 && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${colors.state.warning}25`,
                                color: colors.state.warning,
                              }}
                            >
                              {pendingMakeups.length}
                            </span>
                          )}
                        </div>
                      }
                    />
                  </Tabs>

                  {/* Reschedule tab */}
                  {offersModalTab === "reschedule" && (
                    <div className="space-y-3">
                      {pendingOffers.length === 0 ? (
                        <p
                          className="text-sm text-center py-6"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("tutorDashboard.schedule.panel.noOffers")}
                        </p>
                      ) : (
                        pendingOffers.map((offer) => {
                          const offerLesson =
                            lessons.find((l) => l.id === offer.lessonId) ||
                            lessonExtras[offer.lessonId];
                          const sortedOptions = [
                            ...(offer.options || []),
                          ].sort((a, b) => a.optionOrder - b.optionOrder);
                          return (
                            <div
                              key={offer.id}
                              className="p-3 rounded-xl space-y-2"
                              style={{
                                backgroundColor: colors.background.gray,
                              }}
                            >
                              <p
                                className="font-semibold text-sm"
                                style={{ color: colors.text.primary }}
                              >
                                {offerLesson?.courseTitle ||
                                  offerLesson?.sessionTitle ||
                                  `Lesson #${offer.lessonId?.slice(0, 8)}`}
                              </p>
                              {(offerLesson?.studentFirstName ||
                                offerLesson?.studentLastName) && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Avatar
                                    src={withCDN(offerLesson?.studentAvatar)}
                                    name={[
                                      offerLesson?.studentFirstName,
                                      offerLesson?.studentLastName,
                                    ]
                                      .filter(Boolean)
                                      .join(" ")}
                                    size="sm"
                                    className="w-4 h-4 text-[8px] flex-shrink-0"
                                  />
                                  <p
                                    className="text-xs"
                                    style={{ color: colors.text.secondary }}
                                  >
                                    {[
                                      offerLesson?.studentFirstName,
                                      offerLesson?.studentLastName,
                                    ]
                                      .filter(Boolean)
                                      .join(" ")}
                                  </p>
                                </div>
                              )}
                              {offerLesson && (
                                <div className="flex items-center justify-between gap-2">
                                  <p
                                    className="text-xs flex items-center gap-1"
                                    style={{ color: colors.text.tertiary }}
                                  >
                                    <ClockCircle
                                      weight="BoldDuotone"
                                      className="w-3.5 h-3.5 flex-shrink-0"
                                    />
                                    {new Date(
                                      offerLesson.startTime,
                                    ).toLocaleString(dateLocale, {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                    {offerLesson.endTime && (
                                      <>
                                        {" — "}
                                        {new Date(
                                          offerLesson.endTime,
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
                                    startContent={
                                      <Eye
                                        weight="BoldDuotone"
                                        className="w-3 h-3"
                                      />
                                    }
                                    onPress={() => {
                                      setIsOffersModalOpen(false);
                                      handleOpenLessonDetail(offerLesson);
                                    }}
                                  >
                                    {t("studentDashboard.schedule.viewDetail")}
                                  </Button>
                                </div>
                              )}
                              {sortedOptions.map((opt, idx) => (
                                <div
                                  key={opt.id || idx}
                                  className="px-2.5 py-2 rounded-lg"
                                  style={{
                                    backgroundColor: `${colors.state.warning}10`,
                                    border: `1px solid ${colors.state.warning}30`,
                                  }}
                                >
                                  <p
                                    className="text-xs font-medium mb-0.5"
                                    style={{ color: colors.state.warning }}
                                  >
                                    {sortedOptions.length > 1
                                      ? `${t("tutorDashboard.schedule.studentRequest.proposedTime")} ${idx + 1}`
                                      : t(
                                          "tutorDashboard.schedule.studentRequest.proposedTime",
                                        )}
                                  </p>
                                  <p
                                    className="text-xs"
                                    style={{ color: colors.text.primary }}
                                  >
                                    {new Date(
                                      opt.proposedStartTime,
                                    ).toLocaleString(dateLocale, {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                    {" – "}
                                    {new Date(
                                      opt.proposedEndTime,
                                    ).toLocaleTimeString(dateLocale, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              ))}
                              {offer.tutorNote && (
                                <div
                                  className="px-2.5 py-1.5 rounded-lg"
                                  style={{
                                    backgroundColor: colors.background.light,
                                  }}
                                >
                                  <p
                                    className="text-[10px] font-medium mb-0.5"
                                    style={{ color: colors.text.tertiary }}
                                  >
                                    {t(
                                      "tutorDashboard.schedule.reschedule.tutorNote",
                                    )}
                                  </p>
                                  <p
                                    className="text-xs italic"
                                    style={{ color: colors.text.secondary }}
                                  >
                                    "{offer.tutorNote}"
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Makeup tab */}
                  {offersModalTab === "makeup" && (
                    <div className="space-y-3">
                      {pendingMakeups.length === 0 ? (
                        <p
                          className="text-sm text-center py-6"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("tutorDashboard.schedule.panel.noMakeupRequests")}
                        </p>
                      ) : (
                        pendingMakeups.map((req) => {
                          const reqLesson = lessons.find(
                            (l) => l.id === req.lessonId,
                          );
                          return (
                            <div
                              key={req.id}
                              className="p-3 rounded-xl space-y-2"
                              style={{
                                backgroundColor: colors.background.gray,
                              }}
                            >
                              <p
                                className="font-semibold text-sm"
                                style={{ color: colors.text.primary }}
                              >
                                {reqLesson?.courseTitle ||
                                  reqLesson?.sessionTitle ||
                                  `Lesson #${req.lessonId?.slice(0, 8)}`}
                              </p>
                              {reqLesson && (
                                <div className="flex items-center justify-between gap-2">
                                  <p
                                    className="text-xs flex items-center gap-1"
                                    style={{ color: colors.text.tertiary }}
                                  >
                                    <ClockCircle
                                      weight="BoldDuotone"
                                      className="w-3.5 h-3.5 flex-shrink-0"
                                    />
                                    {new Date(
                                      reqLesson.startTime,
                                    ).toLocaleString(dateLocale, {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="light"
                                    className="h-6 px-2 text-xs flex-shrink-0"
                                    startContent={
                                      <Eye
                                        weight="BoldDuotone"
                                        className="w-3 h-3"
                                      />
                                    }
                                    onPress={() => {
                                      setIsOffersModalOpen(false);
                                      handleOpenLessonDetail(reqLesson);
                                    }}
                                  >
                                    {t("studentDashboard.schedule.viewDetail")}
                                  </Button>
                                </div>
                              )}
                              {req.note && (
                                <div
                                  className="px-2.5 py-1.5 rounded-lg"
                                  style={{
                                    backgroundColor: colors.background.light,
                                  }}
                                >
                                  <p
                                    className="text-[10px] font-medium mb-0.5"
                                    style={{ color: colors.text.tertiary }}
                                  >
                                    {t("tutorDashboard.schedule.makeup.requestNote")}
                                  </p>
                                  <p
                                    className="text-xs italic"
                                    style={{ color: colors.text.secondary }}
                                  >
                                    "{req.note}"
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </ModalBody>
              </>
            );
          }}
        </ModalContent>
      </Modal>

      {/* Reschedule Requests Modal — pending only */}
      <Modal
        isOpen={isRequestsModalOpen}
        onOpenChange={(open) => {
          setIsRequestsModalOpen(open);
          if (!open) {
            setRejectingId(null);
            setRejectNote("");
          }
        }}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {() => {
            const pendingRequests = studentRequests.filter(
              (r) => r.status === "Pending",
            );
            return (
              <>
                <ModalHeader style={{ color: colors.text.primary }}>
                  {t("tutorDashboard.schedule.panel.studentRequestsBtn")}
                </ModalHeader>
                <ModalBody className="pb-6">
                  <div className="space-y-3">
                    {pendingRequests.length === 0 ? (
                      <p
                        className="text-sm text-center py-6"
                        style={{ color: colors.text.tertiary }}
                      >
                        {t("tutorDashboard.schedule.noStudentRequests")}
                      </p>
                    ) : (
                      pendingRequests.map((req) => {
                        const lesson =
                          lessons.find((l) => l.id === req.lessonId) ||
                          lessonExtras[req.lessonId];
                        const isRejecting = rejectingId === req.id;
                        const isProcessing = processingId === req.id;
                        return (
                          <div
                            key={req.id}
                            className="p-3 rounded-xl space-y-2"
                            style={{ backgroundColor: colors.background.gray }}
                          >
                            <p
                              className="font-semibold text-sm"
                              style={{ color: colors.text.primary }}
                            >
                              {lesson?.courseTitle ||
                                lesson?.sessionTitle ||
                                req.lessonId.slice(0, 8)}
                            </p>
                            {lesson && (
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className="text-xs flex items-center gap-1"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  <ClockCircle
                                    weight="BoldDuotone"
                                    className="w-3.5 h-3.5 flex-shrink-0"
                                  />
                                  {t(
                                    "tutorDashboard.schedule.studentRequest.originalTime",
                                  )}{" "}
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
                                  startContent={
                                    <Eye
                                      weight="BoldDuotone"
                                      className="w-3 h-3"
                                    />
                                  }
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
                                className="text-xs font-medium mb-0.5"
                                style={{ color: colors.primary.main }}
                              >
                                {t(
                                  "tutorDashboard.schedule.studentRequest.proposedTime",
                                )}
                              </p>
                              <p
                                className="text-xs"
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
                              <div
                                className="px-2.5 py-1.5 rounded-lg"
                                style={{
                                  backgroundColor: colors.background.light,
                                }}
                              >
                                <p
                                  className="text-[10px] font-medium mb-0.5"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {t(
                                    "tutorDashboard.schedule.studentRequest.studentNote",
                                  )}
                                </p>
                                <p
                                  className="text-xs italic"
                                  style={{ color: colors.text.secondary }}
                                >
                                  "{req.studentNote}"
                                </p>
                              </div>
                            )}
                            {isRejecting && (
                              <textarea
                                rows={2}
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder={t(
                                  "tutorDashboard.schedule.studentRequest.rejectNotePlaceholder",
                                )}
                                className="w-full px-2 py-1.5 rounded-lg text-xs resize-none outline-none"
                                style={{
                                  backgroundColor: colors.background.light,
                                  color: colors.text.primary,
                                  border: `1px solid ${colors.border.medium}`,
                                }}
                              />
                            )}
                            {!isRejecting ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  isLoading={isProcessing}
                                  style={{
                                    backgroundColor: colors.state.success,
                                    color: "#fff",
                                  }}
                                  onPress={() => handleApproveRequest(req)}
                                >
                                  {t(
                                    "tutorDashboard.schedule.studentRequest.approve",
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="flat"
                                  className="flex-1"
                                  style={{
                                    backgroundColor: `${colors.state.error}15`,
                                    color: colors.state.error,
                                  }}
                                  onPress={() => {
                                    setRejectingId(req.id);
                                    setRejectNote("");
                                  }}
                                >
                                  {t(
                                    "tutorDashboard.schedule.studentRequest.reject",
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  isLoading={isProcessing}
                                  style={{
                                    backgroundColor: colors.state.error,
                                    color: "#fff",
                                  }}
                                  onPress={() => handleRejectRequest(req)}
                                >
                                  {t(
                                    "tutorDashboard.schedule.studentRequest.confirmReject",
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="light"
                                  onPress={() => {
                                    setRejectingId(null);
                                    setRejectNote("");
                                  }}
                                >
                                  {t(
                                    "tutorDashboard.schedule.studentRequest.cancelAction",
                                  )}
                                </Button>
                              </div>
                            )}
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

      {/* Tickets Modal */}
      <Modal
        isOpen={isTicketsModalOpen}
        onOpenChange={(open) => setIsTicketsModalOpen(open)}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {() => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("tutorDashboard.schedule.panel.ticketsBtn")}
              </ModalHeader>
              <ModalBody className="pb-6">
                <div className="space-y-3">
                  {rescheduleTickets.length === 0 ? (
                    <p
                      className="text-sm text-center py-6"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("tutorDashboard.schedule.panel.noTickets")}
                    </p>
                  ) : (
                    rescheduleTickets.map((ticket) => {
                      const isDone =
                        ticket.status === "Closed" ||
                        ticket.status === "Resolved";
                      const statusColor = isDone
                        ? colors.state.success
                        : ticket.status === "InProgress"
                          ? colors.primary.main
                          : colors.state.warning;
                      return (
                        <div
                          key={ticket.id}
                          className="p-3 rounded-xl space-y-2"
                          style={{ backgroundColor: colors.background.gray }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="font-semibold text-sm"
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
                              {t(
                                `tutorDashboard.schedule.panel.ticketStatus.${ticket.status}`,
                              )}
                            </Chip>
                          </div>
                          {ticket.description && (
                            <p
                              className="text-xs line-clamp-3"
                              style={{ color: colors.text.secondary }}
                            >
                              {ticket.description}
                            </p>
                          )}
                          <p
                            className="text-[11px]"
                            style={{ color: colors.text.tertiary }}
                          >
                            {new Date(ticket.createdAt).toLocaleDateString(
                              dateLocale,
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
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

      {/* Student Filter Modal */}
      <Modal
        isOpen={isStudentFilterOpen}
        onOpenChange={(open) => setIsStudentFilterOpen(open)}
        size="sm"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                <div className="flex items-center gap-2">
                  <Filter weight="BoldDuotone" className="w-5 h-5" />
                  {t("tutorDashboard.schedule.filterStudent")}
                </div>
              </ModalHeader>
              <ModalBody className="pb-4">
                <div className="space-y-1.5">
                  {/* All students option */}
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group"
                    style={{
                      backgroundColor: !filterStudentId
                        ? `${colors.primary.main}18`
                        : colors.background.gray,
                      border: !filterStudentId
                        ? `1px solid ${colors.primary.main}40`
                        : `1px solid transparent`,
                    }}
                    onMouseEnter={(e) => {
                      if (filterStudentId)
                        e.currentTarget.style.backgroundColor =
                          colors.background.primaryLight ||
                          `${colors.primary.main}10`;
                    }}
                    onMouseLeave={(e) => {
                      if (filterStudentId)
                        e.currentTarget.style.backgroundColor =
                          colors.background.gray;
                    }}
                    onClick={() => {
                      setFilterStudentId(null);
                      onClose();
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: !filterStudentId
                          ? `${colors.primary.main}25`
                          : colors.background.light,
                      }}
                    >
                      <UserRounded
                        weight="BoldDuotone"
                        className="w-4 h-4"
                        style={{
                          color: !filterStudentId
                            ? colors.primary.main
                            : colors.text.secondary,
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: !filterStudentId
                          ? colors.primary.main
                          : colors.text.primary,
                      }}
                    >
                      {t("tutorDashboard.schedule.allStudents")}
                    </span>
                  </button>

                  {enrolledStudents.map((enrollment) => {
                    const isSelected = filterStudentId === enrollment.studentId;
                    return (
                      <button
                        key={enrollment.studentId}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                        style={{
                          backgroundColor: isSelected
                            ? `${colors.primary.main}18`
                            : colors.background.gray,
                          border: isSelected
                            ? `1px solid ${colors.primary.main}40`
                            : `1px solid transparent`,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.backgroundColor = `${colors.primary.main}10`;
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.backgroundColor =
                              colors.background.gray;
                        }}
                        onClick={() => {
                          setFilterStudentId(enrollment.studentId);
                          onClose();
                        }}
                      >
                        <Avatar
                          src={enrollment.studentAvatar}
                          name={enrollment.studentName}
                          size="sm"
                          className="w-8 h-8 flex-shrink-0"
                        />
                        <span
                          className="text-sm font-medium truncate"
                          style={{
                            color: isSelected
                              ? colors.primary.main
                              : colors.text.primary,
                          }}
                        >
                          {enrollment.studentName}
                        </span>
                      </button>
                    );
                  })}
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
