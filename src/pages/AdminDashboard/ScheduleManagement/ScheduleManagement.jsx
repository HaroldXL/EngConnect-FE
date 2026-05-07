import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Input,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Spinner,
  Tabs,
  Tab,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";
import { studentApi, tutorApi, adminApi } from "../../../api";
import AdminLessonDetailModal from "../../../components/AdminLessonDetailModal/AdminLessonDetailModal";
import {
  MagnifyingGlass,
  Funnel,
  CalendarDots,
  Clock,
  BookOpen,
  Eye,
  CheckCircle,
  XCircle,
  Hourglass,
  Lightning,
  ChalkboardTeacher,
  Users,
  X,
} from "@phosphor-icons/react";

// ── constants ──────────────────────────────────────────────
const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const WEEKDAY_SHORT = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// ── date helpers ────────────────────────────────────────────
const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const toApiStart = (dateStr) => `${dateStr}T00:00:00Z`;
const toApiEnd = (dateStr) => `${dateStr}T23:59:59Z`;

const todayStr = () => toLocalDateStr(new Date());
const startOfWeekStr = () => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return toLocalDateStr(d);
};
const endOfWeekStr = () => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + 6);
  return toLocalDateStr(d);
};
const startOfMonthStr = () => {
  const d = new Date();
  d.setDate(1);
  return toLocalDateStr(d);
};
const endOfMonthStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  return toLocalDateStr(d);
};

// ── component ───────────────────────────────────────────────
const ScheduleManagement = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { inputClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const [activeTab, setActiveTab] = useState("overview");

  // ── Overview / Stats ─────────────────────────────────────
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsTotal, setStatsTotal] = useState(0);
  const [statsScheduled, setStatsScheduled] = useState(0);
  const [statsInProgress, setStatsInProgress] = useState(0);
  const [statsCompleted, setStatsCompleted] = useState(0);
  const [statsCancelled, setStatsCancelled] = useState(0);
  const [liveNow, setLiveNow] = useState([]);
  const [upcomingToday, setUpcomingToday] = useState([]);

  // ── Lessons ──────────────────────────────────────────────
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");
  const [debouncedLessonSearch, setDebouncedLessonSearch] = useState("");
  const [lessonStatusFilter, setLessonStatusFilter] = useState("all");
  const [lessonPage, setLessonPage] = useState(1);
  const [lessonTotalPages, setLessonTotalPages] = useState(1);
  const lessonPageSize = 10;

  // Date filter
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Tutor/Student picker filters
  const [selectedTutor, setSelectedTutor] = useState(null); // { id, name, avatar }
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ── Tutor picker modal ────────────────────────────────────
  const [tutorPickerOpen, setTutorPickerOpen] = useState(false);
  const [tutorPickerSearch, setTutorPickerSearch] = useState("");
  const [tutorPickerItems, setTutorPickerItems] = useState([]);
  const [tutorPickerLoading, setTutorPickerLoading] = useState(false);
  const [tutorPickerTemp, setTutorPickerTemp] = useState(null);

  // ── Student picker modal ──────────────────────────────────
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [studentPickerSearch, setStudentPickerSearch] = useState("");
  const [studentPickerItems, setStudentPickerItems] = useState([]);
  const [studentPickerLoading, setStudentPickerLoading] = useState(false);
  const [studentPickerTemp, setStudentPickerTemp] = useState(null);

  // ── Lesson detail modal ───────────────────────────────────
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const [selectedLesson, setSelectedLesson] = useState(null);

  // ── Tutor Slots ───────────────────────────────────────────
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState("all");
  const [tutorMap, setTutorMap] = useState({});

  // ── debounce lesson search ────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedLessonSearch(lessonSearch);
      setLessonPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [lessonSearch]);

  // ── fetch overview stats + live + upcoming ────────────────
  useEffect(() => {
    const fetchOverview = async () => {
      setStatsLoading(true);
      try {
        const todayFrom = toApiStart(todayStr());
        const todayTo = toApiEnd(todayStr());
        const [allR, schR, liveR, compR, canR, upcomingR] =
          await Promise.allSettled([
            studentApi.getLessons({ "page-size": 1, page: 1 }),
            studentApi.getLessons({
              Status: "Scheduled",
              "page-size": 1,
              page: 1,
            }),
            studentApi.getLessons({
              Status: "InProgress",
              "page-size": 10,
              page: 1,
            }),
            studentApi.getLessons({
              Status: "Completed",
              "page-size": 1,
              page: 1,
            }),
            studentApi.getLessons({
              Status: "Cancelled",
              "page-size": 1,
              page: 1,
            }),
            studentApi.getLessons({
              Status: "Scheduled",
              StartTimeFrom: todayFrom,
              StartTimeTo: todayTo,
              "page-size": 10,
              page: 1,
            }),
          ]);
        if (allR.status === "fulfilled")
          setStatsTotal(allR.value?.data?.totalItems || 0);
        if (schR.status === "fulfilled")
          setStatsScheduled(schR.value?.data?.totalItems || 0);
        if (liveR.status === "fulfilled") {
          setStatsInProgress(liveR.value?.data?.totalItems || 0);
          setLiveNow(liveR.value?.data?.items || []);
        }
        if (compR.status === "fulfilled")
          setStatsCompleted(compR.value?.data?.totalItems || 0);
        if (canR.status === "fulfilled")
          setStatsCancelled(canR.value?.data?.totalItems || 0);
        if (upcomingR.status === "fulfilled")
          setUpcomingToday(upcomingR.value?.data?.items || []);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchOverview();
  }, []);

  // ── date range params ─────────────────────────────────────
  const getDateParams = useCallback(() => {
    switch (datePreset) {
      case "today":
        return {
          StartTimeFrom: toApiStart(todayStr()),
          StartTimeTo: toApiEnd(todayStr()),
        };
      case "week":
        return {
          StartTimeFrom: toApiStart(startOfWeekStr()),
          StartTimeTo: toApiEnd(endOfWeekStr()),
        };
      case "month":
        return {
          StartTimeFrom: toApiStart(startOfMonthStr()),
          StartTimeTo: toApiEnd(endOfMonthStr()),
        };
      case "custom":
        return {
          ...(customFrom && { StartTimeFrom: toApiStart(customFrom) }),
          ...(customTo && { StartTimeTo: toApiEnd(customTo) }),
        };
      default:
        return {};
    }
  }, [datePreset, customFrom, customTo]);

  // ── fetch lessons ─────────────────────────────────────────
  const fetchLessons = useCallback(async () => {
    setLessonsLoading(true);
    try {
      const params = {
        page: lessonPage,
        "page-size": lessonPageSize,
        ...getDateParams(),
      };
      if (lessonStatusFilter !== "all") params.Status = lessonStatusFilter;
      if (debouncedLessonSearch) params["search-term"] = debouncedLessonSearch;
      if (selectedTutor) params.TutorId = selectedTutor.id;
      if (selectedStudent) params.StudentId = selectedStudent.id;

      const res = await studentApi.getLessons(params);
      const data = res?.data;
      setLessons(data?.items || []);
      setLessonTotalPages(data?.totalPages || 1);
    } catch {
      setLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  }, [
    lessonPage,
    lessonPageSize,
    lessonStatusFilter,
    debouncedLessonSearch,
    selectedTutor,
    selectedStudent,
    getDateParams,
  ]);

  useEffect(() => {
    if (activeTab === "lessons") fetchLessons();
  }, [fetchLessons, activeTab]);

  // ── fetch tutor picker ────────────────────────────────────
  useEffect(() => {
    if (!tutorPickerOpen) return;
    setTutorPickerLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await adminApi.getAllTutors({
          "search-term": tutorPickerSearch,
          "page-size": 8,
          page: 1,
        });
        setTutorPickerItems(res?.data?.items || []);
      } finally {
        setTutorPickerLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tutorPickerSearch, tutorPickerOpen]);

  // ── fetch student picker ──────────────────────────────────
  useEffect(() => {
    if (!studentPickerOpen) return;
    setStudentPickerLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await adminApi.getAllStudents({
          "search-term": studentPickerSearch,
          "page-size": 8,
          page: 1,
        });
        setStudentPickerItems(res?.data?.items || []);
      } finally {
        setStudentPickerLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentPickerSearch, studentPickerOpen]);

  // ── fetch tutor slots ─────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    try {
      const params = { page: 1, "page-size": 100 };
      if (scheduleStatusFilter !== "all") params.Status = scheduleStatusFilter;
      const res = await tutorApi.getTutorSchedules(params);
      const items = res?.data?.items || [];
      setSchedules(items);

      const uniqueIds = [
        ...new Set(items.map((s) => s.tutorId).filter(Boolean)),
      ];
      const results = await Promise.allSettled(
        uniqueIds.map((id) => adminApi.getTutorById(id)),
      );
      const map = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") map[uniqueIds[i]] = r.value?.data;
      });
      setTutorMap((prev) => ({ ...prev, ...map }));
    } catch {
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  }, [scheduleStatusFilter]);

  useEffect(() => {
    if (activeTab === "slots") fetchSchedules();
  }, [fetchSchedules, activeTab]);

  // ── grouped slots ──────────────────────────────────────────
  const groupedSlots = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      if (!s.tutorId) return;
      if (!map[s.tutorId]) map[s.tutorId] = [];
      map[s.tutorId].push(s);
    });
    return map;
  }, [schedules]);

  // ── lesson table columns ───────────────────────────────────
  const lessonCols = useMemo(
    () =>
      [
        { key: "course", label: t("adminDashboard.schedule.table.course") },
        !selectedTutor && {
          key: "tutor",
          label: t("adminDashboard.schedule.table.tutor"),
        },
        !selectedStudent && {
          key: "student",
          label: t("adminDashboard.schedule.table.student"),
        },
        { key: "dateTime", label: t("adminDashboard.schedule.table.dateTime") },
        { key: "status", label: t("adminDashboard.schedule.table.status") },
        { key: "actions", label: "" },
      ].filter(Boolean),
    [selectedTutor, selectedStudent, t],
  );

  // ── helpers ────────────────────────────────────────────────
  const getLessonStatusColor = (status) => {
    switch (status) {
      case "Scheduled":
        return colors.primary.main;
      case "InProgress":
      case "Reschedule":
        return colors.state.warning;
      case "Completed":
      case "Settled":
        return colors.state.success;
      case "Cancelled":
      case "NoStudent":
      case "NoTutor":
      case "Refund":
        return colors.state.error;
      default:
        return colors.text.tertiary;
    }
  };

  const getSlotStatusColor = (status) => {
    switch (status) {
      case "Open":
        return colors.state.success;
      case "Booked":
        return colors.primary.main;
      case "Pending":
        return colors.state.warning;
      default:
        return colors.text.tertiary;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (s) => s?.slice(0, 5) || "";

  const formatDuration = (start, end) => {
    if (!start || !end) return "";
    const mins = Math.round((new Date(end) - new Date(start)) / 60000);
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  };

  const lessonLabel = (lesson) =>
    `${lesson.studentFirstName || ""} ${lesson.studentLastName || ""}`.trim();
  const tutorLabel = (lesson) =>
    `${lesson.tutorFirstName || ""} ${lesson.tutorLastName || ""}`.trim();
  const tutorName = (t) =>
    t?.user ? `${t.user.firstName || ""} ${t.user.lastName || ""}`.trim() : "";

  const openPicker = (type) => {
    if (type === "tutor") {
      setTutorPickerTemp(selectedTutor);
      setTutorPickerSearch("");
      setTutorPickerItems([]);
      setTutorPickerOpen(true);
    } else {
      setStudentPickerTemp(selectedStudent);
      setStudentPickerSearch("");
      setStudentPickerItems([]);
      setStudentPickerOpen(true);
    }
  };

  const confirmTutorPicker = () => {
    setSelectedTutor(tutorPickerTemp);
    setLessonPage(1);
    setTutorPickerOpen(false);
  };

  const confirmStudentPicker = () => {
    setSelectedStudent(studentPickerTemp);
    setLessonPage(1);
    setStudentPickerOpen(false);
  };

  // ── render lesson cell ──────────────────────────────────────
  const renderLessonCell = (lesson, key) => {
    const isLive = lesson.status === "InProgress";
    switch (key) {
      case "course":
        return (
          <div>
            <p
              className="font-medium text-sm line-clamp-1"
              style={{
                color: isLive ? colors.state.warning : colors.text.primary,
              }}
            >
              {lesson.courseTitle || t("adminDashboard.schedule.nA")}
            </p>
            {lesson.sessionTitle && (
              <p
                className="text-xs line-clamp-1"
                style={{ color: colors.text.secondary }}
              >
                {lesson.sessionTitle}
              </p>
            )}
          </div>
        );
      case "tutor":
        return (
          <div className="flex items-center gap-2">
            <Avatar
              src={withCDN(lesson.tutorAvatar)}
              size="sm"
              className="flex-shrink-0 w-7 h-7"
            />
            <span
              className="text-sm line-clamp-1"
              style={{ color: colors.text.primary }}
            >
              {tutorLabel(lesson) || t("adminDashboard.schedule.nA")}
            </span>
          </div>
        );
      case "student":
        return (
          <div className="flex items-center gap-2">
            <Avatar
              src={withCDN(lesson.studentAvatar)}
              size="sm"
              className="flex-shrink-0 w-7 h-7"
            />
            <span
              className="text-sm line-clamp-1"
              style={{ color: colors.text.primary }}
            >
              {lessonLabel(lesson) || t("adminDashboard.schedule.nA")}
            </span>
          </div>
        );
      case "dateTime":
        return (
          <div>
            <p className="text-sm" style={{ color: colors.text.primary }}>
              {formatDateTime(lesson.startTime)}
            </p>
            <p className="text-xs" style={{ color: colors.text.tertiary }}>
              {formatDuration(lesson.startTime, lesson.endTime)}
            </p>
          </div>
        );
      case "status":
        return (
          <div className="flex items-center gap-1.5">
            {isLive && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                style={{ backgroundColor: colors.state.warning }}
              />
            )}
            <Chip
              size="sm"
              variant="flat"
              style={{
                backgroundColor: `${getLessonStatusColor(lesson.status)}20`,
                color: getLessonStatusColor(lesson.status),
              }}
            >
              {t(`adminDashboard.schedule.lessonStatuses.${lesson.status}`) ||
                lesson.status}
            </Chip>
          </div>
        );
      case "actions":
        return (
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => {
              setSelectedLesson(lesson);
              onDetailOpen();
            }}
          >
            <Eye className="w-4 h-4" style={{ color: colors.text.secondary }} />
          </Button>
        );
      default:
        return null;
    }
  };

  // ── date preset button style ────────────────────────────────
  const presetBtnStyle = (key) => ({
    backgroundColor:
      datePreset === key ? colors.primary.main : colors.background.gray,
    color: datePreset === key ? "#fff" : colors.text.secondary,
  });

  // ── overview stats cards ────────────────────────────────────
  const overviewStats = [
    {
      label: t("adminDashboard.schedule.stats.totalLessons"),
      value: statsTotal,
      icon: CalendarDots,
      color: colors.primary.main,
      bg: colors.background.primaryLight,
    },
    {
      label: t("adminDashboard.schedule.stats.scheduled"),
      value: statsScheduled,
      icon: Hourglass,
      color: colors.state.warning,
      bg: `${colors.state.warning}20`,
    },
    {
      label: t("adminDashboard.schedule.statsInProgress"),
      value: statsInProgress,
      icon: Lightning,
      color: "#f59e0b",
      bg: "#f59e0b20",
    },
    {
      label: t("adminDashboard.schedule.stats.completed"),
      value: statsCompleted,
      icon: CheckCircle,
      color: colors.state.success,
      bg: `${colors.state.success}20`,
    },
    {
      label: t("adminDashboard.schedule.stats.cancelled"),
      value: statsCancelled,
      icon: XCircle,
      color: colors.state.error,
      bg: `${colors.state.error}20`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <h1
          className="text-2xl lg:text-3xl font-bold mb-1"
          style={{ color: colors.text.primary }}
        >
          {t("adminDashboard.schedule.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("adminDashboard.schedule.subtitle")}
        </p>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
          color="primary"
          classNames={{ tabList: "gap-2", tab: "px-4" }}
        >
          <Tab
            key="overview"
            title={
              <div className="flex items-center gap-2">
                <CalendarDots weight="duotone" className="w-4 h-4" />
                <span>{t("adminDashboard.schedule.overviewTab")}</span>
              </div>
            }
          />
          <Tab
            key="lessons"
            title={
              <div className="flex items-center gap-2">
                <BookOpen weight="duotone" className="w-4 h-4" />
                <span>{t("adminDashboard.schedule.lessonsTab")}</span>
              </div>
            }
          />
          <Tab
            key="slots"
            title={
              <div className="flex items-center gap-2">
                <ChalkboardTeacher weight="duotone" className="w-4 h-4" />
                <span>{t("adminDashboard.schedule.tutorSlotsTab")}</span>
              </div>
            }
          />
        </Tabs>
      </motion.div>

      {/* ══════════ OVERVIEW TAB ══════════ */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* Stats */}
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {overviewStats.map((s, i) => (
                <Card
                  key={i}
                  shadow="none"
                  className="border-none"
                  style={{ backgroundColor: colors.background.light }}
                >
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: s.bg }}
                      >
                        <s.icon
                          className="w-4 h-4"
                          weight="duotone"
                          style={{ color: s.color }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-xl font-bold"
                          style={{ color: colors.text.primary }}
                        >
                          {s.value.toLocaleString()}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.secondary }}
                        >
                          {s.label}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {/* Upcoming Today + In Progress Now */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upcoming Today */}
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDots
                    weight="duotone"
                    className="w-5 h-5"
                    style={{ color: colors.primary.main }}
                  />
                  <h3
                    className="font-semibold text-base"
                    style={{ color: colors.text.primary }}
                  >
                    {t("adminDashboard.schedule.upcomingToday")}
                  </h3>
                </div>
                {statsLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner size="sm" />
                  </div>
                ) : upcomingToday.length === 0 ? (
                  <p
                    className="text-sm text-center py-4"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("adminDashboard.schedule.noUpcomingToday")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingToday.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: colors.background.gray }}
                        onClick={() => {
                          setSelectedLesson(lesson);
                          onDetailOpen();
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center"
                          style={{
                            backgroundColor: colors.background.primaryLight,
                          }}
                        >
                          <span
                            className="text-xs font-bold"
                            style={{ color: colors.primary.main }}
                          >
                            {new Date(lesson.startTime).toLocaleTimeString(
                              dateLocale,
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: colors.text.primary }}
                          >
                            {lesson.courseTitle ||
                              t("adminDashboard.schedule.nA")}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{ color: colors.text.secondary }}
                          >
                            {tutorLabel(lesson)} → {lessonLabel(lesson)}
                          </p>
                        </div>
                        <Eye
                          size={14}
                          style={{ color: colors.text.tertiary }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* In Progress Now */}
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: colors.state.warning }}
                  />
                  <h3
                    className="font-semibold text-base"
                    style={{ color: colors.text.primary }}
                  >
                    {t("adminDashboard.schedule.inProgressNow")}
                  </h3>
                  {statsInProgress > 0 && (
                    <Chip
                      size="sm"
                      className="h-5"
                      style={{
                        backgroundColor: `${colors.state.warning}20`,
                        color: colors.state.warning,
                        fontSize: "10px",
                      }}
                    >
                      {statsInProgress}
                    </Chip>
                  )}
                </div>
                {statsLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner size="sm" />
                  </div>
                ) : liveNow.length === 0 ? (
                  <p
                    className="text-sm text-center py-4"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("adminDashboard.schedule.noLiveNow")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {liveNow.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: `${colors.state.warning}10`,
                          border: `1px solid ${colors.state.warning}30`,
                        }}
                        onClick={() => {
                          setSelectedLesson(lesson);
                          onDetailOpen();
                        }}
                      >
                        <div className="flex -space-x-2">
                          <Avatar
                            src={withCDN(lesson.tutorAvatar)}
                            size="sm"
                            className="w-7 h-7 border-2 border-white"
                          />
                          <Avatar
                            src={withCDN(lesson.studentAvatar)}
                            size="sm"
                            className="w-7 h-7 border-2 border-white"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: colors.text.primary }}
                          >
                            {lesson.courseTitle ||
                              t("adminDashboard.schedule.nA")}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{ color: colors.text.secondary }}
                          >
                            {tutorLabel(lesson)} → {lessonLabel(lesson)}
                          </p>
                        </div>
                        <Eye
                          size={14}
                          style={{ color: colors.text.tertiary }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ══════════ LESSONS TAB ══════════ */}
      {activeTab === "lessons" && (
        <>
          {/* ── Filter row ── */}
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
              <CardBody className="p-4 space-y-3">
                {/* Row 1: search + status + tutor/student pickers */}
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder={t(
                        "adminDashboard.schedule.searchLessonPlaceholder",
                      )}
                      value={lessonSearch}
                      onChange={(e) => setLessonSearch(e.target.value)}
                      startContent={
                        <MagnifyingGlass
                          className="w-4 h-4"
                          style={{ color: colors.text.secondary }}
                        />
                      }
                      classNames={inputClassNames}
                    />
                  </div>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        variant="flat"
                        startContent={<Funnel className="w-4 h-4" />}
                        className="flex-shrink-0"
                      >
                        {t("adminDashboard.schedule.status")}:{" "}
                        {lessonStatusFilter === "all"
                          ? t("adminDashboard.schedule.all")
                          : t(
                              `adminDashboard.schedule.lessonStatuses.${lessonStatusFilter}`,
                            )}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      selectedKeys={[lessonStatusFilter]}
                      selectionMode="single"
                      onAction={(k) => {
                        setLessonStatusFilter(k);
                        setLessonPage(1);
                      }}
                    >
                      <DropdownItem key="all">
                        {t("adminDashboard.schedule.all")}
                      </DropdownItem>
                      {[
                        "Scheduled",
                        "InProgress",
                        "Completed",
                        "Cancelled",
                        "NoStudent",
                        "NoTutor",
                      ].map((s) => (
                        <DropdownItem key={s}>
                          {t(`adminDashboard.schedule.lessonStatuses.${s}`)}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>

                  {/* Divider */}
                  <div
                    className="w-px h-5"
                    style={{ backgroundColor: colors.border.dark }}
                  />

                  {/* Tutor filter */}
                  {selectedTutor ? (
                    <Chip
                      variant="flat"
                      onClose={() => {
                        setSelectedTutor(null);
                        setLessonPage(1);
                      }}
                      startContent={
                        <Avatar
                          src={withCDN(selectedTutor.avatar)}
                          size="sm"
                          className="w-5 h-5"
                        />
                      }
                      className="h-10 px-2 rounded-xl text-sm"
                      style={{
                        backgroundColor: `${colors.primary.main}15`,
                        color: colors.primary.main,
                      }}
                    >
                      {selectedTutor.name}
                    </Chip>
                  ) : (
                    <Button
                      variant="flat"
                      startContent={<ChalkboardTeacher className="w-4 h-4" />}
                      className="h-10 rounded-xl text-sm"
                      style={{
                        backgroundColor: colors.background.gray,
                        color: colors.text.secondary,
                      }}
                      onPress={() => openPicker("tutor")}
                    >
                      {t("adminDashboard.schedule.filterByTutor")}
                    </Button>
                  )}

                  {/* Student filter */}
                  {selectedStudent ? (
                    <Chip
                      variant="flat"
                      onClose={() => {
                        setSelectedStudent(null);
                        setLessonPage(1);
                      }}
                      startContent={
                        <Avatar
                          src={withCDN(selectedStudent.avatar)}
                          size="sm"
                          className="w-5 h-5"
                        />
                      }
                      className="h-10 px-2 rounded-xl text-sm"
                      style={{
                        backgroundColor: `${colors.state.success}15`,
                        color: colors.state.success,
                      }}
                    >
                      {selectedStudent.name}
                    </Chip>
                  ) : (
                    <Button
                      variant="flat"
                      startContent={<Users className="w-4 h-4" />}
                      className="h-10 rounded-xl text-sm"
                      style={{
                        backgroundColor: colors.background.gray,
                        color: colors.text.secondary,
                      }}
                      onPress={() => openPicker("student")}
                    >
                      {t("adminDashboard.schedule.filterByStudent")}
                    </Button>
                  )}
                </div>

                {/* Row 2: date presets */}
                <div className="flex flex-wrap gap-2 items-center">
                  {[
                    { key: "all", label: t("adminDashboard.schedule.allTime") },
                    { key: "today", label: t("adminDashboard.schedule.today") },
                    {
                      key: "week",
                      label: t("adminDashboard.schedule.thisWeek"),
                    },
                    {
                      key: "month",
                      label: t("adminDashboard.schedule.thisMonth"),
                    },
                    {
                      key: "custom",
                      label: t("adminDashboard.schedule.customRange"),
                    },
                  ].map((p) => (
                    <Button
                      key={p.key}
                      size="sm"
                      variant="flat"
                      style={presetBtnStyle(p.key)}
                      onPress={() => {
                        setDatePreset(p.key);
                        setLessonPage(1);
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}

                  {/* Custom date inputs */}
                  {datePreset === "custom" && (
                    <>
                      <input
                        type="date"
                        value={customFrom}
                        onChange={(e) => {
                          setCustomFrom(e.target.value);
                          setLessonPage(1);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-sm border"
                        style={{
                          backgroundColor: colors.background.gray,
                          color: colors.text.primary,
                          borderColor: colors.border.light,
                        }}
                      />
                      <span style={{ color: colors.text.tertiary }}>→</span>
                      <input
                        type="date"
                        value={customTo}
                        onChange={(e) => {
                          setCustomTo(e.target.value);
                          setLessonPage(1);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-sm border"
                        style={{
                          backgroundColor: colors.background.gray,
                          color: colors.text.primary,
                          borderColor: colors.border.light,
                        }}
                      />
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* ── Lessons table ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Card shadow="none" className="border-none" style={tableCardStyle}>
              <CardBody className="p-0">
                <Table
                  aria-label="Lessons table"
                  classNames={tableClassNames}
                  bottomContent={
                    lessonTotalPages > 1 ? (
                      <div className="flex w-full justify-center py-4">
                        <Pagination
                          isCompact
                          showControls
                          showShadow
                          color="primary"
                          page={lessonPage}
                          total={lessonTotalPages}
                          onChange={(p) => setLessonPage(p)}
                        />
                      </div>
                    ) : null
                  }
                >
                  <TableHeader>
                    {lessonCols.map((col) => (
                      <TableColumn key={col.key}>{col.label}</TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody
                    isLoading={lessonsLoading}
                    loadingContent={<Spinner size="lg" />}
                    emptyContent={t("adminDashboard.schedule.noLessons")}
                  >
                    {lessons.map((lesson) => (
                      <TableRow
                        key={lesson.id}
                        style={
                          lesson.status === "InProgress"
                            ? { backgroundColor: `${colors.state.warning}08` }
                            : {}
                        }
                      >
                        {lessonCols.map((col) => (
                          <TableCell key={col.key}>
                            {renderLessonCell(lesson, col.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </motion.div>
        </>
      )}

      {/* ══════════ TUTOR SLOTS TAB ══════════ */}
      {activeTab === "slots" && (
        <>
          {/* Status filter */}
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
              <CardBody className="p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Funnel
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: colors.text.secondary }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("adminDashboard.schedule.status")}:
                  </span>
                  {["all", "Open", "Booked", "Pending", "Inactive"].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="flat"
                      style={{
                        backgroundColor:
                          scheduleStatusFilter === s
                            ? colors.primary.main
                            : colors.background.gray,
                        color:
                          scheduleStatusFilter === s
                            ? "#fff"
                            : colors.text.secondary,
                      }}
                      onPress={() => setScheduleStatusFilter(s)}
                    >
                      {s === "all"
                        ? t("adminDashboard.schedule.all")
                        : t(`adminDashboard.schedule.scheduleStatuses.${s}`)}
                    </Button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Grouped tutor cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {schedulesLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : Object.keys(groupedSlots).length === 0 ? (
              <p
                className="text-sm text-center py-8"
                style={{ color: colors.text.tertiary }}
              >
                {t("adminDashboard.schedule.noSchedules")}
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedSlots).map(([tutorId, slots]) => {
                  const tutor = tutorMap[tutorId];
                  const name = tutorName(tutor) || tutorId.slice(0, 8) + "…";
                  const bookedCount = slots.filter(
                    (s) => s.status === "Booked",
                  ).length;
                  const openCount = slots.filter(
                    (s) => s.status === "Open",
                  ).length;

                  // Group slots by weekday
                  const byDay = {};
                  WEEKDAYS.forEach((d) => (byDay[d] = []));
                  slots.forEach((s) => {
                    if (s.weekday && byDay[s.weekday]) byDay[s.weekday].push(s);
                  });

                  return (
                    <Card
                      key={tutorId}
                      shadow="none"
                      className="border-none"
                      style={{ backgroundColor: colors.background.light }}
                    >
                      <CardBody className="p-4">
                        {/* Tutor header */}
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          <Avatar
                            src={withCDN(tutor?.avatar)}
                            name={name}
                            size="md"
                            className="flex-shrink-0 cursor-pointer"
                            onClick={() => navigate(`/admin/tutors/${tutorId}`)}
                          />
                          <div className="flex-1 min-w-0">
                            <button
                              type="button"
                              className="font-semibold text-sm hover:underline text-left"
                              style={{ color: colors.primary.main }}
                              onClick={() =>
                                navigate(`/admin/tutors/${tutorId}`)
                              }
                            >
                              {name}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span
                                className="text-xs"
                                style={{ color: colors.text.tertiary }}
                              >
                                {slots.length}{" "}
                                {t("adminDashboard.schedule.totalSlots")}
                              </span>
                              {openCount > 0 && (
                                <Chip
                                  size="sm"
                                  className="h-4"
                                  style={{
                                    backgroundColor: `${colors.state.success}20`,
                                    color: colors.state.success,
                                    fontSize: "10px",
                                  }}
                                >
                                  {openCount}{" "}
                                  {t(
                                    "adminDashboard.schedule.scheduleStatuses.Open",
                                  )}
                                </Chip>
                              )}
                              {bookedCount > 0 && (
                                <Chip
                                  size="sm"
                                  className="h-4"
                                  style={{
                                    backgroundColor: `${colors.primary.main}20`,
                                    color: colors.primary.main,
                                    fontSize: "10px",
                                  }}
                                >
                                  {bookedCount}{" "}
                                  {t(
                                    "adminDashboard.schedule.scheduleStatuses.Booked",
                                  )}
                                </Chip>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Weekly grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                          {WEEKDAYS.map((day) => {
                            const daySlotsAll = byDay[day];
                            const daySlots = daySlotsAll.slice(0, 3);
                            const overflow = daySlotsAll.length - 3;
                            return (
                              <div key={day} className="flex flex-col gap-1">
                                <p
                                  className="text-center text-xs font-semibold mb-1"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {WEEKDAY_SHORT[day]}
                                </p>
                                {daySlots.map((slot) => {
                                  const sc = getSlotStatusColor(slot.status);
                                  return (
                                    <div
                                      key={slot.id}
                                      className="text-center px-1 py-1 rounded-md"
                                      style={{
                                        backgroundColor: `${sc}15`,
                                        border: `1px solid ${sc}30`,
                                      }}
                                    >
                                      <p
                                        className="text-xs font-medium"
                                        style={{ color: sc }}
                                      >
                                        {formatTime(slot.startTime)}
                                      </p>
                                      <p style={{ color: sc, fontSize: "9px" }}>
                                        {t(
                                          `adminDashboard.schedule.scheduleStatuses.${slot.status}`,
                                        )}
                                      </p>
                                    </div>
                                  );
                                })}
                                {overflow > 0 && (
                                  <p
                                    className="text-center"
                                    style={{
                                      color: colors.text.tertiary,
                                      fontSize: "10px",
                                    }}
                                  >
                                    +{overflow}
                                  </p>
                                )}
                                {daySlotsAll.length === 0 && (
                                  <div
                                    className="h-8 rounded-md"
                                    style={{
                                      backgroundColor: colors.background.gray,
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* ══════════ LESSON DETAIL MODAL ══════════ */}
      <AdminLessonDetailModal
        isOpen={isDetailOpen}
        onClose={onDetailClose}
        lesson={selectedLesson}
      />

      {/* ══════════ TUTOR PICKER MODAL ══════════ */}
      <Modal
        isOpen={tutorPickerOpen}
        onClose={() => setTutorPickerOpen(false)}
        size="sm"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            {t("adminDashboard.schedule.selectTutor")}
          </ModalHeader>
          <ModalBody className="pb-5 space-y-3">
            <Input
              placeholder={t("adminDashboard.schedule.searchLessonPlaceholder")}
              value={tutorPickerSearch}
              onChange={(e) => setTutorPickerSearch(e.target.value)}
              startContent={
                <MagnifyingGlass
                  className="w-4 h-4"
                  style={{ color: colors.text.secondary }}
                />
              }
              classNames={inputClassNames}
              autoFocus
            />
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {tutorPickerLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : tutorPickerItems.length === 0 ? (
                <p
                  className="text-xs text-center py-4"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("adminDashboard.schedule.noResultsFound")}
                </p>
              ) : (
                tutorPickerItems.map((item) => {
                  const name = item.user
                    ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
                    : item.tutorId || "";
                  const id = item.tutorId || item.id;
                  const isSelected = tutorPickerTemp?.id === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: isSelected
                          ? `${colors.primary.main}15`
                          : colors.background.gray,
                        border: isSelected
                          ? `1px solid ${colors.primary.main}40`
                          : "1px solid transparent",
                      }}
                      onClick={() =>
                        setTutorPickerTemp({ id, name, avatar: item.avatar })
                      }
                    >
                      <Avatar
                        src={withCDN(item.avatar)}
                        name={name}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <span
                        className="flex-1 text-sm font-medium truncate"
                        style={{ color: colors.text.primary }}
                      >
                        {name}
                      </span>
                      {isSelected && (
                        <CheckCircle
                          weight="fill"
                          size={16}
                          style={{ color: colors.primary.main, flexShrink: 0 }}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="flat"
                className="flex-1"
                onPress={() => {
                  setTutorPickerTemp(null);
                  setSelectedTutor(null);
                  setLessonPage(1);
                  setTutorPickerOpen(false);
                }}
                startContent={<X size={14} />}
              >
                {t("adminDashboard.schedule.clearFilter")}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                isDisabled={!tutorPickerTemp}
                style={{ backgroundColor: colors.primary.main, color: "#fff" }}
                onPress={confirmTutorPicker}
              >
                {t("adminDashboard.schedule.applyFilter")}
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ══════════ STUDENT PICKER MODAL ══════════ */}
      <Modal
        isOpen={studentPickerOpen}
        onClose={() => setStudentPickerOpen(false)}
        size="sm"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            {t("adminDashboard.schedule.selectStudent")}
          </ModalHeader>
          <ModalBody className="pb-5 space-y-3">
            <Input
              placeholder={t("adminDashboard.schedule.searchLessonPlaceholder")}
              value={studentPickerSearch}
              onChange={(e) => setStudentPickerSearch(e.target.value)}
              startContent={
                <MagnifyingGlass
                  className="w-4 h-4"
                  style={{ color: colors.text.secondary }}
                />
              }
              classNames={inputClassNames}
              autoFocus
            />
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {studentPickerLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : studentPickerItems.length === 0 ? (
                <p
                  className="text-xs text-center py-4"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("adminDashboard.schedule.noResultsFound")}
                </p>
              ) : (
                studentPickerItems.map((item) => {
                  const name = item.user
                    ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
                    : item.studentId || "";
                  const id = item.studentId || item.id;
                  const isSelected = studentPickerTemp?.id === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: isSelected
                          ? `${colors.state.success}15`
                          : colors.background.gray,
                        border: isSelected
                          ? `1px solid ${colors.state.success}40`
                          : "1px solid transparent",
                      }}
                      onClick={() =>
                        setStudentPickerTemp({ id, name, avatar: item.avatar })
                      }
                    >
                      <Avatar
                        src={withCDN(item.avatar)}
                        name={name}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <span
                        className="flex-1 text-sm font-medium truncate"
                        style={{ color: colors.text.primary }}
                      >
                        {name}
                      </span>
                      {isSelected && (
                        <CheckCircle
                          weight="fill"
                          size={16}
                          style={{ color: colors.state.success, flexShrink: 0 }}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="flat"
                className="flex-1"
                onPress={() => {
                  setStudentPickerTemp(null);
                  setSelectedStudent(null);
                  setLessonPage(1);
                  setStudentPickerOpen(false);
                }}
                startContent={<X size={14} />}
              >
                {t("adminDashboard.schedule.clearFilter")}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                isDisabled={!studentPickerTemp}
                style={{ backgroundColor: colors.state.success, color: "#fff" }}
                onPress={confirmStudentPicker}
              >
                {t("adminDashboard.schedule.applyFilter")}
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ScheduleManagement;
