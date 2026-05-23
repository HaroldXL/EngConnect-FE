import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Progress,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { Rate } from "antd";
import {
  AltArrowLeft,
  CalendarMark,
  ChartSquare,
  ClockCircle,
  DocumentText,
  PenNewSquare,
  Play,
  RecordAudioCircle,
  Star,
  Target,
  UsersGroupRounded,
  VerifiedCheck,
} from "@solar-icons/react";
import { motion } from "framer-motion";
import { adminApi } from "../../../api";
import { useThemeColors } from "../../../hooks/useThemeColors";
import VideoModal from "../../../components/VideoModal/VideoModal";
import LessonSummaryModal from "../../../components/LessonSummaryModal/LessonSummaryModal";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const formatMinutes = (mins) => {
  if (mins == null || isNaN(mins)) return "—";
  if (mins < 60) return `${mins}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatTime = (iso, locale = "en-US") => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateTime = (iso, locale = "en-US") => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(locale, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const initials = (firstName, lastName) => {
  const f = (firstName || "").trim();
  const l = (lastName || "").trim();
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || "?";
};

const getStatusColor = (status, colors) => {
  switch (status) {
    case "Scheduled":
      return colors.primary.main;
    case "InProgress":
    case "Reschedule":
    case "Completed":
      return colors.state.warning;
    case "Settled":
      return colors.state.success;
    case "MadeUp":
    case "Rescheduled":
      return colors.text.tertiary;
    case "Cancelled":
    case "NoStudent":
    case "NoTutor":
    case "Refund":
      return colors.state.error;
    default:
      return colors.text.tertiary;
  }
};

const SectionTitle = ({ children, icon: Icon, iconColor }) => {
  const colors = useThemeColors();
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && (
        <Icon
          weight="BoldDuotone"
          className="w-5 h-5"
          style={{ color: iconColor || colors.primary.main }}
        />
      )}
      <h3
        className="font-semibold text-base"
        style={{ color: colors.text.primary }}
      >
        {children}
      </h3>
    </div>
  );
};

const StatCard = ({ label, value, unit, note, icon: Icon, color, bg }) => {
  const colors = useThemeColors();
  return (
    <Card
      shadow="none"
      className="border-none"
      style={{ backgroundColor: colors.background.light }}
    >
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: bg }}
          >
            <Icon weight="BoldDuotone" className="w-4 h-4" style={{ color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-xl font-bold leading-tight"
              style={{ color: colors.text.primary }}
            >
              {value}
              {unit && (
                <span
                  className="text-sm font-medium ml-1"
                  style={{ color: colors.text.tertiary }}
                >
                  {unit}
                </span>
              )}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: colors.text.secondary }}
            >
              {label}
            </p>
            {note && (
              <p
                className="text-[11px] mt-0.5 truncate"
                style={{ color: colors.text.tertiary }}
              >
                {note}
              </p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const InfoRow = ({ label, children }) => {
  const colors = useThemeColors();
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b last:border-b-0"
      style={{ borderColor: colors.border.light }}
    >
      <span
        className="text-xs uppercase tracking-wide font-semibold mb-1 sm:mb-0"
        style={{ color: colors.text.tertiary }}
      >
        {label}
      </span>
      <span
        className="text-sm break-all sm:text-right"
        style={{ color: colors.text.primary }}
      >
        {children}
      </span>
    </div>
  );
};

const LessonReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const {
    isOpen: isVideoOpen,
    onOpen: onVideoOpen,
    onOpenChange: onVideoOpenChange,
  } = useDisclosure();
  const {
    isOpen: isSummaryOpen,
    onOpen: onSummaryOpen,
    onClose: onSummaryClose,
  } = useDisclosure();
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-lesson-report", id],
    queryFn: async () => {
      const res = await adminApi.getLessonReport(id);
      return res?.data || res;
    },
    enabled: Boolean(id),
  });

  const tutorName = useMemo(
    () =>
      data
        ? `${data.tutorFirstName || ""} ${data.tutorLastName || ""}`.trim()
        : "",
    [data],
  );
  const studentName = useMemo(
    () =>
      data
        ? `${data.studentFirstName || ""} ${data.studentLastName || ""}`.trim()
        : "",
    [data],
  );

  const outcomes = useMemo(() => {
    if (!data?.lessonOutcome) return { Pass: [], Fail: [] };
    try {
      return JSON.parse(data.lessonOutcome);
    } catch {
      return { Pass: [], Fail: [] };
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-3"
        >
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate(-1)}
          >
            <AltArrowLeft
              weight="BoldDuotone"
              size={20}
              style={{ color: colors.text.primary }}
            />
          </Button>
          <h1
            className="text-2xl lg:text-3xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {t("adminDashboard.lessonReport.title")}
          </h1>
        </motion.div>
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-8 text-center">
            <p
              className="text-base"
              style={{ color: colors.text.secondary }}
            >
              {t("adminDashboard.lessonReport.notFound")}
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const statusColor = getStatusColor(data.status, colors);

  const tutorAtt = data.tutorAttendanceMinutes ?? 0;
  const studentAtt = data.studentAttendanceMinutes ?? 0;
  const scheduled = data.scheduledDurationMinutes || 60;
  const actual = data.actualMeetingDurationMinutes || 0;
  const recordingMin = data.recordingDurationMinutes || 0;

  const tutorAttPct = Math.min(100, Math.round((tutorAtt / scheduled) * 100));
  const studentAttPct = Math.min(
    100,
    Math.round((studentAtt / scheduled) * 100),
  );
  const recordingPct = actual
    ? Math.min(100, Math.round((recordingMin / actual) * 100))
    : 0;

  const tutorLate = data.tutorLateMinutes ?? 0;
  const studentLate = data.studentLateMinutes ?? 0;

  const homeworks = Array.isArray(data.homeworks) ? data.homeworks : [];
  const submittedHw = data.submittedHomeworkCount ?? 0;
  const totalHw = data.homeworkCount ?? 0;
  const completionRate = data.homeworkCompletionRate ?? 0;
  const scoredHws = homeworks.filter((h) => h.score != null);
  const avgScore = scoredHws.length
    ? (
        scoredHws.reduce((sum, h) => sum + (h.score || 0), 0) / scoredHws.length
      ).toFixed(1)
    : null;

  const transcriptText = data.fullText || "";
  const transcriptSnippet = transcriptText.slice(0, 600);
  const hasMoreTranscript = transcriptText.length > transcriptSnippet.length;

  return (
    <div className="space-y-6">
      {/* ── Back + Title ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-3"
      >
        <Button isIconOnly variant="light" onPress={() => navigate(-1)}>
          <AltArrowLeft
            weight="BoldDuotone"
            size={20}
            style={{ color: colors.text.primary }}
          />
        </Button>
        <div>
          <h1
            className="text-2xl lg:text-3xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {t("adminDashboard.lessonReport.title")}
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: colors.text.secondary }}
          >
            {t("adminDashboard.lessonReport.generated", {
              date: new Date().toLocaleDateString(dateLocale),
            })}
          </p>
        </div>
      </motion.div>

      {/* ── Lesson summary card ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.05 }}
      >
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-5 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Chip
                  size="sm"
                  variant="flat"
                  style={{
                    backgroundColor: `${statusColor}20`,
                    color: statusColor,
                  }}
                  className="mb-2"
                >
                  {t(`adminDashboard.schedule.lessonStatuses.${data.status}`, {
                    defaultValue: data.status,
                  })}
                </Chip>
                <h2
                  className="text-xl lg:text-2xl font-bold mb-1"
                  style={{ color: colors.text.primary }}
                >
                  {data.sessionTitle || "—"}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  {data.courseTitle}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                  <span
                    className="text-xs flex items-center gap-1.5"
                    style={{ color: colors.text.secondary }}
                  >
                    <CalendarMark
                      weight="BoldDuotone"
                      className="w-3.5 h-3.5"
                    />
                    {formatDateTime(data.startTime, dateLocale)}
                  </span>
                  <span
                    className="text-xs flex items-center gap-1.5"
                    style={{ color: colors.text.secondary }}
                  >
                    <ClockCircle
                      weight="BoldDuotone"
                      className="w-3.5 h-3.5"
                    />
                    {formatTime(data.startTime, dateLocale)} –{" "}
                    {formatTime(data.endTime, dateLocale)}
                  </span>
                </div>
              </div>

              {/* People */}
              <div className="flex flex-wrap gap-3">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <Avatar
                    src={withCDN(data.tutorAvatar)}
                    name={initials(data.tutorFirstName, data.tutorLastName)}
                    size="sm"
                  />
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {tutorName}
                    </p>
                    <p
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.lessonReport.tutor")}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <Avatar
                    src={withCDN(data.studentAvatar)}
                    name={initials(
                      data.studentFirstName,
                      data.studentLastName,
                    )}
                    size="sm"
                  />
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {studentName}
                    </p>
                    <p
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.lessonReport.student")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={t("adminDashboard.lessonReport.stats.scheduled")}
          value={scheduled}
          unit={t("adminDashboard.lessonReport.minUnit")}
          note={`${formatTime(data.startTime, dateLocale)} → ${formatTime(data.endTime, dateLocale)}`}
          icon={CalendarMark}
          color={colors.primary.main}
          bg={colors.background.primaryLight}
        />
        <StatCard
          label={t("adminDashboard.lessonReport.stats.actual")}
          value={actual}
          unit={t("adminDashboard.lessonReport.minUnit")}
          note={
            data.meetingStartedAt && data.meetingEndedAt
              ? `${formatTime(data.meetingStartedAt, dateLocale)} → ${formatTime(data.meetingEndedAt, dateLocale)}`
              : "—"
          }
          icon={ClockCircle}
          color={colors.state.success}
          bg={`${colors.state.success}20`}
        />
        <StatCard
          label={t("adminDashboard.lessonReport.stats.recording")}
          value={recordingMin}
          unit={t("adminDashboard.lessonReport.minUnit")}
          note={
            data.recordingAvailable
              ? t("adminDashboard.lessonReport.recordingAvail")
              : t("adminDashboard.lessonReport.noRecording")
          }
          icon={RecordAudioCircle}
          color={colors.state.warning}
          bg={`${colors.state.warning}20`}
        />
        <StatCard
          label={t("adminDashboard.lessonReport.stats.coverage")}
          value={data.coveragePercent ?? 0}
          unit="%"
          note={t("adminDashboard.lessonReport.contentCovered")}
          icon={Target}
          color="#0d9488"
          bg="#0d948820"
        />
      </div>

      {/* ── Attendance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-5">
            <SectionTitle icon={UsersGroupRounded}>
              {t("adminDashboard.lessonReport.participation")}
            </SectionTitle>

            {/* Tutor row */}
            <div
              className="p-3 rounded-xl mb-3"
              style={{ backgroundColor: colors.background.gray }}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={withCDN(data.tutorAvatar)}
                  name={initials(data.tutorFirstName, data.tutorLastName)}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {tutorName}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.tertiary }}
                  >
                    {data.tutorJoinedAt
                      ? `${t("adminDashboard.lessonReport.joined")} ${formatTime(data.tutorJoinedAt, dateLocale)}`
                      : t("adminDashboard.lessonReport.notJoined")}
                    {data.tutorLeftAt &&
                      ` · ${t("adminDashboard.lessonReport.left")} ${formatTime(data.tutorLeftAt, dateLocale)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {tutorAtt}{" "}
                    <span
                      className="text-xs font-normal"
                      style={{ color: colors.text.tertiary }}
                    >
                      / {scheduled} {t("adminDashboard.lessonReport.minUnit")}
                    </span>
                  </p>
                  <Chip
                    size="sm"
                    variant="flat"
                    style={{
                      backgroundColor:
                        tutorLate > 0
                          ? `${colors.state.warning}20`
                          : `${colors.state.success}20`,
                      color:
                        tutorLate > 0
                          ? colors.state.warning
                          : colors.state.success,
                    }}
                    className="mt-1"
                  >
                    {tutorLate > 0
                      ? t("adminDashboard.lessonReport.lateBy", {
                          mins: formatMinutes(tutorLate),
                        })
                      : t("adminDashboard.lessonReport.onTime")}
                  </Chip>
                </div>
              </div>
            </div>

            {/* Student row */}
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.background.gray }}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={withCDN(data.studentAvatar)}
                  name={initials(data.studentFirstName, data.studentLastName)}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {studentName}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.tertiary }}
                  >
                    {data.studentJoinedAt
                      ? `${t("adminDashboard.lessonReport.joined")} ${formatTime(data.studentJoinedAt, dateLocale)}`
                      : t("adminDashboard.lessonReport.notJoined")}
                    {data.studentLeftAt &&
                      ` · ${t("adminDashboard.lessonReport.left")} ${formatTime(data.studentLeftAt, dateLocale)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {studentAtt}{" "}
                    <span
                      className="text-xs font-normal"
                      style={{ color: colors.text.tertiary }}
                    >
                      / {scheduled} {t("adminDashboard.lessonReport.minUnit")}
                    </span>
                  </p>
                  <Chip
                    size="sm"
                    variant="flat"
                    style={{
                      backgroundColor:
                        studentLate > 0
                          ? `${colors.state.warning}20`
                          : `${colors.state.success}20`,
                      color:
                        studentLate > 0
                          ? colors.state.warning
                          : colors.state.success,
                    }}
                    className="mt-1"
                  >
                    {studentLate > 0
                      ? t("adminDashboard.lessonReport.lateBy", {
                          mins: formatMinutes(studentLate),
                        })
                      : t("adminDashboard.lessonReport.onTime")}
                  </Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-5">
            <SectionTitle icon={ClockCircle} iconColor={colors.state.success}>
              {t("adminDashboard.lessonReport.durationBreakdown")}
            </SectionTitle>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("adminDashboard.lessonReport.tutorAttendance")}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {tutorAtt} / {scheduled}{" "}
                    {t("adminDashboard.lessonReport.minUnit")}
                  </span>
                </div>
                <Progress
                  value={tutorAttPct}
                  classNames={{ indicator: "!bg-current" }}
                  style={{ color: colors.primary.main }}
                  size="sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("adminDashboard.lessonReport.studentAttendance")}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {studentAtt} / {scheduled}{" "}
                    {t("adminDashboard.lessonReport.minUnit")}
                  </span>
                </div>
                <Progress
                  value={studentAttPct}
                  classNames={{ indicator: "!bg-current" }}
                  style={{ color: colors.state.success }}
                  size="sm"
                />
              </div>

              {actual > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.lessonReport.recordingCoverage")}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {recordingMin} / {actual}{" "}
                      {t("adminDashboard.lessonReport.minUnit")}
                    </span>
                  </div>
                  <Progress
                    value={recordingPct}
                    classNames={{ indicator: "!bg-current" }}
                    style={{ color: "#0d9488" }}
                    size="sm"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: colors.background.gray }}
              >
                <p
                  className="text-xs uppercase tracking-wide"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("adminDashboard.lessonReport.tutorLate")}
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{
                    color:
                      tutorLate > 0
                        ? colors.state.warning
                        : colors.text.primary,
                  }}
                >
                  {formatMinutes(tutorLate)}{" "}
                  {tutorLate < 60 && (
                    <span
                      className="text-xs font-normal"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.lessonReport.minUnit")}
                    </span>
                  )}
                </p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: colors.background.gray }}
              >
                <p
                  className="text-xs uppercase tracking-wide"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("adminDashboard.lessonReport.studentLate")}
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{
                    color:
                      studentLate > 0
                        ? colors.state.warning
                        : colors.text.primary,
                  }}
                >
                  {formatMinutes(studentLate)}{" "}
                  {studentLate < 60 && (
                    <span
                      className="text-xs font-normal"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.lessonReport.minUnit")}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── AI Analysis ── */}
      {data.aiSummaryAvailable && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card
            shadow="none"
            className="border-none lg:col-span-2"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-5">
              <SectionTitle icon={ChartSquare} iconColor="#0d9488">
                {t("adminDashboard.lessonReport.summary")}
              </SectionTitle>
              {data.summarizeText ? (
                <p
                  className="text-sm whitespace-pre-line leading-relaxed"
                  style={{ color: colors.text.secondary }}
                >
                  {data.summarizeText}
                </p>
              ) : (
                <p
                  className="text-sm italic"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("adminDashboard.lessonReport.noSummary")}
                </p>
              )}

              {(outcomes.Pass?.length > 0 || outcomes.Fail?.length > 0) && (
                <>
                  <div className="mt-5 mb-3">
                    <SectionTitle
                      icon={Target}
                      iconColor={colors.state.success}
                    >
                      {t("adminDashboard.lessonReport.learningOutcomes")}
                    </SectionTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {outcomes.Pass?.map((o, idx) => (
                      <Chip
                        key={`pass-${idx}`}
                        size="sm"
                        variant="flat"
                        startContent={
                          <VerifiedCheck
                            weight="BoldDuotone"
                            className="w-3 h-3"
                          />
                        }
                        style={{
                          backgroundColor: `${colors.state.success}20`,
                          color: colors.state.success,
                        }}
                      >
                        {o}
                      </Chip>
                    ))}
                    {outcomes.Fail?.map((o, idx) => (
                      <Chip
                        key={`fail-${idx}`}
                        size="sm"
                        variant="flat"
                        style={{
                          backgroundColor: `${colors.state.warning}20`,
                          color: colors.state.warning,
                        }}
                      >
                        {o}
                      </Chip>
                    ))}
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-5 text-center">
              <p
                className="text-xs uppercase tracking-wider font-bold"
                style={{ color: colors.text.tertiary }}
              >
                {t("adminDashboard.lessonReport.contentCoverage")}
              </p>
              <p
                className="text-5xl font-bold my-3"
                style={{ color: colors.primary.main }}
              >
                {data.coveragePercent ?? 0}%
              </p>
              <p
                className="text-sm mb-4"
                style={{ color: colors.text.secondary }}
              >
                {t("adminDashboard.lessonReport.sessionPlanCompleted")}
              </p>
              <Progress
                value={data.coveragePercent ?? 0}
                classNames={{ indicator: "!bg-current" }}
                style={{ color: colors.primary.main }}
                size="sm"
              />
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Recording & Transcript ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-5">
            <SectionTitle
              icon={RecordAudioCircle}
              iconColor={colors.state.error}
            >
              {t("adminDashboard.lessonReport.recording")}
            </SectionTitle>

            {data.recordingAvailable && data.recordUrl ? (
              <>
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <div className="flex-1">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {t("adminDashboard.lessonReport.recordingAvail")}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: colors.text.tertiary }}
                    >
                      {recordingMin} {t("adminDashboard.lessonReport.minUnit")}{" "}
                      ·{" "}
                      {data.recordingStartedAt
                        ? formatTime(data.recordingStartedAt, dateLocale)
                        : "—"}{" "}
                      –{" "}
                      {data.recordingEndedAt
                        ? formatTime(data.recordingEndedAt, dateLocale)
                        : "—"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    color="primary"
                    startContent={
                      <Play weight="BoldDuotone" className="w-3.5 h-3.5" />
                    }
                    onPress={onVideoOpen}
                  >
                    {t("adminDashboard.lessonReport.play")}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs uppercase tracking-wide"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.lessonReport.startedAt")}
                    </p>
                    <p
                      className="text-sm font-semibold mt-1"
                      style={{ color: colors.text.primary }}
                    >
                      {formatTime(data.recordingStartedAt, dateLocale)}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs uppercase tracking-wide"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.lessonReport.endedAt")}
                    </p>
                    <p
                      className="text-sm font-semibold mt-1"
                      style={{ color: colors.text.primary }}
                    >
                      {formatTime(data.recordingEndedAt, dateLocale)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p
                className="text-sm italic"
                style={{ color: colors.text.tertiary }}
              >
                {t("adminDashboard.lessonReport.noRecording")}
              </p>
            )}
          </CardBody>
        </Card>

        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-5">
            <SectionTitle icon={DocumentText} iconColor={colors.text.secondary}>
              {t("adminDashboard.lessonReport.transcript")}
            </SectionTitle>
            {transcriptText ? (
              <>
                <div
                  className="p-3 rounded-xl text-xs leading-relaxed max-h-48 overflow-y-auto"
                  style={{
                    backgroundColor: colors.background.gray,
                    color: colors.text.secondary,
                  }}
                >
                  <p className="whitespace-pre-line">
                    {showFullTranscript ? transcriptText : transcriptSnippet}
                    {!showFullTranscript && hasMoreTranscript && "..."}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 justify-end">
                  {hasMoreTranscript && (
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => setShowFullTranscript((v) => !v)}
                    >
                      {showFullTranscript
                        ? t("adminDashboard.lessonReport.showLess")
                        : t("adminDashboard.lessonReport.showFullTranscript")}
                    </Button>
                  )}
                  {data.summarizeText && (
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={onSummaryOpen}
                    >
                      {t("adminDashboard.lessonReport.viewSummary")}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p
                className="text-sm italic"
                style={{ color: colors.text.tertiary }}
              >
                {t("adminDashboard.lessonReport.noTranscript")}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Homework ── */}
      {totalHw > 0 && (
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-5">
            <SectionTitle icon={PenNewSquare}>
              {t("adminDashboard.lessonReport.sections.homework")}
            </SectionTitle>

            {/* HW stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: colors.background.gray }}
              >
                <p
                  className="text-xs uppercase tracking-wide"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("adminDashboard.lessonReport.hwAssigned")}
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ color: colors.text.primary }}
                >
                  {totalHw}
                </p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: colors.background.gray }}
              >
                <p
                  className="text-xs uppercase tracking-wide"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("adminDashboard.lessonReport.hwSubmitted")}
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ color: colors.state.success }}
                >
                  {submittedHw}
                </p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: colors.background.gray }}
              >
                <p
                  className="text-xs uppercase tracking-wide"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("adminDashboard.lessonReport.hwCompletionRate")}
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ color: colors.text.primary }}
                >
                  {completionRate}%
                </p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: colors.background.gray }}
              >
                <p
                  className="text-xs uppercase tracking-wide"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("adminDashboard.lessonReport.hwAvgScore")}
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ color: colors.text.primary }}
                >
                  {avgScore != null ? (
                    <>
                      {avgScore}{" "}
                      <span
                        className="text-xs font-normal"
                        style={{ color: colors.text.tertiary }}
                      >
                        / 10
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>

            {/* HW list */}
            <div className="space-y-2">
              {homeworks.map((hw) => {
                const hwStatusColor =
                  hw.status === "Scored"
                    ? colors.state.success
                    : hw.status === "Submitted"
                      ? colors.primary.main
                      : hw.status === "Assigned"
                        ? colors.state.warning
                        : colors.text.tertiary;
                return (
                  <div
                    key={hw.id}
                    className="p-3 rounded-xl flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ backgroundColor: colors.background.gray }}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/admin/homework/${hw.id}`)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      navigate(`/admin/homework/${hw.id}`)
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${hwStatusColor}20` }}
                    >
                      <PenNewSquare
                        weight="BoldDuotone"
                        className="w-5 h-5"
                        style={{ color: hwStatusColor }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: colors.text.primary }}
                      >
                        {hw.title}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: colors.text.tertiary }}
                      >
                        {hw.type}
                        {hw.dueAt &&
                          ` · ${t("adminDashboard.lessonReport.due")}: ${formatDateTime(hw.dueAt, dateLocale)}`}
                        {hw.submittedAt &&
                          ` · ${t("adminDashboard.lessonReport.submitted")}: ${formatDateTime(hw.submittedAt, dateLocale)}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-sm font-bold"
                        style={{ color: colors.text.primary }}
                      >
                        {hw.score != null ? hw.score : "—"}{" "}
                        <span
                          className="text-xs font-normal"
                          style={{ color: colors.text.tertiary }}
                        >
                          / {hw.maxScore}
                        </span>
                      </p>
                      <Chip
                        size="sm"
                        variant="flat"
                        style={{
                          backgroundColor: `${hwStatusColor}20`,
                          color: hwStatusColor,
                        }}
                        className="mt-1"
                      >
                        {hw.status}
                      </Chip>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Rating & Lesson Info ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-5">
            <SectionTitle icon={Star} iconColor={colors.state.warning}>
              {t("adminDashboard.lessonReport.studentRating")}
            </SectionTitle>
            {data.ratingAvailable && data.rating != null ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Rate
                    value={data.rating}
                    disabled
                    style={{
                      fontSize: 22,
                      color: colors.state.warning,
                    }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {data.rating}/5
                  </span>
                </div>
                {data.ratingComment && (
                  <p
                    className="text-sm italic mb-3"
                    style={{ color: colors.text.secondary }}
                  >
                    "{data.ratingComment}"
                  </p>
                )}
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: colors.text.tertiary }}
                >
                  <span>
                    {data.isAnonymousRating
                      ? t("adminDashboard.lessonReport.anonymous")
                      : studentName}
                  </span>
                  {data.ratedAt && (
                    <>
                      <span>·</span>
                      <span>
                        {t("adminDashboard.lessonReport.ratedOn")}{" "}
                        {formatDateTime(data.ratedAt, dateLocale)}
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p
                className="text-sm italic"
                style={{ color: colors.text.tertiary }}
              >
                {t("adminDashboard.lessonReport.notRated")}
              </p>
            )}
          </CardBody>
        </Card>

        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-5">
            <SectionTitle icon={DocumentText}>
              {t("adminDashboard.lessonReport.lessonInfo")}
            </SectionTitle>

            <div>
              <InfoRow label={t("adminDashboard.lessonReport.lessonId")}>
                <span className="font-mono text-xs">{data.lessonId}</span>
              </InfoRow>
              <InfoRow label={t("adminDashboard.lessonReport.course")}>
                {data.courseId ? (
                  <Link
                    to={`/admin/courses/${data.courseId}`}
                    style={{ color: colors.primary.main }}
                    className="hover:underline"
                  >
                    {data.courseTitle}
                  </Link>
                ) : (
                  data.courseTitle
                )}
              </InfoRow>
              <InfoRow label={t("adminDashboard.lessonReport.session")}>
                {data.sessionTitle}
              </InfoRow>
              <InfoRow label={t("adminDashboard.lessonReport.enrollmentId")}>
                <span className="font-mono text-xs">
                  {data.enrollmentId}
                </span>
              </InfoRow>
              <InfoRow label={t("adminDashboard.lessonReport.createdAt")}>
                {formatDateTime(data.createdAt, dateLocale)}
              </InfoRow>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Footer */}
      <p
        className="text-center text-xs pt-2"
        style={{ color: colors.text.tertiary }}
      >
        {t("adminDashboard.lessonReport.footer", {
          date: new Date().toLocaleString(dateLocale),
        })}
      </p>

      {/* Modals */}
      <VideoModal
        isOpen={isVideoOpen}
        onOpenChange={onVideoOpenChange}
        videoUrl={data.recordUrl}
      />
      <LessonSummaryModal
        isOpen={isSummaryOpen}
        onClose={onSummaryClose}
        summarizeText={data.summarizeText}
      />
    </div>
  );
};

export default LessonReport;
