import { useState, useEffect, useCallback, useMemo } from "react";
import { AltArrowRight, CheckCircle, ClockCircle, DangerTriangle, DocumentText, File, Gallery, Hourglass, Magnifer, Plain, Star } from "@solar-icons/react"
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Tabs,
  Tab,
  useDisclosure,
  Avatar,
  Progress,
} from "@heroui/react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import { lessonHomeworkApi } from "../../../api";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import toDoIllustration from "../../../assets/illustrations/to-do.avif";
import chillIllustration from "../../../assets/illustrations/chill.avif";
import HomeworkSkeleton from "../../../components/HomeworkSkeleton/HomeworkSkeleton";
import StudentHomeworkDetailModal from "../../../components/StudentHomeworkDetailModal/StudentHomeworkDetailModal";
import StudentHomeworkSubmitModal from "../../../components/StudentHomeworkSubmitModal/StudentHomeworkSubmitModal";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|bmp|svg)$/i;
const PDF_EXT_RE = /\.pdf$/i;
const DOC_EXT_RE = /\.docx?$/i;
const ZIP_EXT_RE = /\.(zip|rar|7z|tar|gz)$/i;

const formatDate = (iso, locale) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileBaseName = (url) => {
  if (!url) return "";
  const clean = url.split("?")[0];
  const seg = clean.split("/").pop() || "";
  return decodeURIComponent(seg);
};

const getFileTypeIcon = (url, className, style) => {
  const name = getFileBaseName(url || "");
  if (IMAGE_EXT_RE.test(name))
    return <Gallery weight="BoldDuotone" className={className} style={style} />;
  if (PDF_EXT_RE.test(name))
    return <File weight="BoldDuotone" className={className} style={style} />;
  if (DOC_EXT_RE.test(name))
    return <DocumentText weight="BoldDuotone" className={className} style={style} />;
  if (ZIP_EXT_RE.test(name))
    return <File weight="BoldDuotone" className={className} style={style} />;
  return <File weight="BoldDuotone" className={className} style={style} />;
};

const computeDueInfo = (dueAt, t) => {
  if (!dueAt)
    return { label: t("studentDashboard.homework.noDueDate"), tone: "neutral" };
  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return { label: t("studentDashboard.homework.dueToday"), tone: "danger" };
  if (diffDays === 1)
    return {
      label: t("studentDashboard.homework.dueTomorrow"),
      tone: "warning",
    };
  if (diffDays <= 3)
    return {
      label: `${diffDays} ${t("studentDashboard.homework.daysLeft")}`,
      tone: "warning",
    };
  return {
    label: `${diffDays} ${t("studentDashboard.homework.daysLeft")}`,
    tone: "success",
  };
};

const Homework = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames, filterInputClassNames, filterTabsClassNames } =
    useInputStyles();
  const navigate = useNavigate();
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const user = useSelector(selectUser);

  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedHw, setSelectedHw] = useState(null);

  const submitDisclosure = useDisclosure();
  const detailDisclosure = useDisclosure();

  const fetchHomeworks = useCallback(async () => {
    if (!user?.studentId) return;
    try {
      setLoading(true);
      const params = {
        StudentId: user.studentId,
        "page-size": 100,
      };
      if (searchQuery.trim()) params["search-term"] = searchQuery.trim();
      const res = await lessonHomeworkApi.getHomeworks(params);
      const items = res?.data?.items || [];
      // Never show NotStarted (tutor draft) to student
      setHomeworks(items.filter((h) => h.status !== "NotStarted"));
    } catch (err) {
      console.error("Failed to fetch homeworks:", err);
      setHomeworks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.studentId, searchQuery]);

  useEffect(() => {
    fetchHomeworks();
  }, [fetchHomeworks]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = Date.now();
    let toDo = 0;
    let submitted = 0;
    let scored = 0;
    let overdue = 0;
    for (const h of homeworks) {
      if (h.status === "Assigned") {
        toDo += 1;
        if (h.dueAt && new Date(h.dueAt).getTime() < now) overdue += 1;
      } else if (h.status === "Submitted") submitted += 1;
      else if (h.status === "Scored") scored += 1;
    }
    return { toDo, submitted, scored, overdue };
  }, [homeworks]);

  // ── Filtered view ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const map = {
      assigned: "Assigned",
      submitted: "Submitted",
      scored: "Scored",
    };
    if (selectedTab === "all") return homeworks;
    return homeworks.filter((h) => h.status === map[selectedTab]);
  }, [homeworks, selectedTab]);

  const statusChipProps = useCallback(
    (status) => {
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
        case "OverDate":
          return {
            bg: `${colors.state.error}20`,
            color: colors.state.error,
            label: t("studentDashboard.homework.status.overDate"),
          };
        default:
          return {
            bg: `${colors.text.tertiary}20`,
            color: colors.text.tertiary,
            label: status,
          };
      }
    },
    [colors, t],
  );

  const openDetail = (hw) => {
    setSelectedHw(hw);
    detailDisclosure.onOpen();
  };

  const openSubmit = (hw) => {
    setSelectedHw(hw);
    submitDisclosure.onOpen();
  };

  // ── Small components ──────────────────────────────────────────────────────
  const StatCard = ({ icon: Icon, label, value, accent, alert }) => (
    <Card
      shadow="none"
      style={{ backgroundColor: colors.background.light }}
      className={alert ? "ring-2" : ""}
    >
      <CardBody className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-wide mb-1"
              style={{ color: colors.text.tertiary }}
            >
              {label}
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.text.primary }}
            >
              {value}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accent}15` }}
          >
            <Icon
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: accent }}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );

  const Breadcrumb = ({ hw, size = "sm", onCourseClick }) => {
    const items = [hw.courseTitle, hw.moduleTitle, hw.sessionTitle].filter(
      Boolean,
    );
    if (items.length === 0) return null;
    const cls = size === "sm" ? "text-xs" : "text-sm";
    return (
      <div
        className={`flex items-center gap-1 flex-wrap ${cls}`}
        style={{ color: colors.text.tertiary }}
      >
        {items.map((item, idx) => (
          <span
            key={`${idx}-${item}`}
            className="flex items-center gap-1 min-w-0"
          >
            {idx > 0 && (
              <AltArrowRight
                weight="BoldDuotone"
                className="w-3 h-3 shrink-0 opacity-50"
              />
            )}
            {idx === 0 && onCourseClick ? (
              <button
                type="button"
                onClick={onCourseClick}
                className="truncate hover:underline transition-opacity"
                style={{ color: colors.primary.main }}
              >
                {item}
              </button>
            ) : (
              <span
                className={
                  idx === items.length - 1 ? "font-medium truncate" : "truncate"
                }
                style={
                  idx === items.length - 1
                    ? { color: colors.text.secondary }
                    : undefined
                }
              >
                {item}
              </span>
            )}
          </span>
        ))}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <h1
          className="text-2xl font-bold"
          style={{ color: colors.text.primary }}
        >
          {t("studentDashboard.homework.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("studentDashboard.homework.subtitle")}
        </p>
      </motion.div>

      {/* Stats row */}
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard
          icon={Hourglass}
          label={t("studentDashboard.homework.stats.toDo")}
          value={stats.toDo}
          accent={colors.state.warning}
        />
        <StatCard
          icon={Plain}
          label={t("studentDashboard.homework.stats.submitted")}
          value={stats.submitted}
          accent={colors.primary.main}
        />
        <StatCard
          icon={CheckCircle}
          label={t("studentDashboard.homework.stats.scored")}
          value={stats.scored}
          accent={colors.state.success}
        />
        <StatCard
          icon={DangerTriangle}
          label={t("studentDashboard.homework.stats.overdue")}
          value={stats.overdue}
          accent={colors.state.error}
          alert={stats.overdue > 0}
        />
      </motion.div> */}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Input
          placeholder={t("studentDashboard.homework.searchPlaceholder")}
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={
            <Magnifer weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.text.tertiary }}
            />
          }
          classNames={filterInputClassNames}
          className="max-w-xs"
        />
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={setSelectedTab}
          variant="solid"
          color="primary"
          classNames={filterTabsClassNames}
        >
          <Tab key="all" title={t("studentDashboard.homework.filter.all")} />
          <Tab
            key="assigned"
            title={`${t("studentDashboard.homework.filter.assigned")} (${stats.toDo})`}
          />
          <Tab
            key="submitted"
            title={`${t("studentDashboard.homework.filter.submitted")} (${stats.submitted})`}
          />
          <Tab
            key="scored"
            title={`${t("studentDashboard.homework.filter.scored")} (${stats.scored})`}
          />
        </Tabs>
      </motion.div>

      {/* List */}
      {loading ? (
        <HomeworkSkeleton count={5} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <img
            src={homeworks.length === 0 ? toDoIllustration : chillIllustration}
            alt="Empty"
            draggable={false}
            className="w-68 h-68 object-contain opacity-90"
          />
          <h3
            className="text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            {homeworks.length === 0
              ? t("studentDashboard.homework.empty")
              : t("studentDashboard.homework.emptyFilter")}
          </h3>
          <p
            className="text-sm text-center max-w-sm"
            style={{ color: colors.text.secondary }}
          >
            {homeworks.length === 0
              ? t("studentDashboard.homework.emptyDesc")
              : ""}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {filtered.map((hw) => {
            const chip = statusChipProps(hw.status);
            const due = computeDueInfo(hw.dueAt, t);
            const dueColor =
              due.tone === "danger"
                ? colors.state.error
                : due.tone === "warning"
                  ? colors.state.warning
                  : due.tone === "success"
                    ? colors.state.success
                    : colors.text.tertiary;

            const tutorName = hw.tutor
              ? `${hw.tutor.firstName || ""} ${hw.tutor.lastName || ""}`.trim()
              : null;

            const scorePct =
              hw.status === "Scored" && hw.maxScore
                ? Math.round((hw.score / hw.maxScore) * 100)
                : 0;

            return (
              <Card
                key={hw.id}
                shadow="none"
                isPressable
                onPress={() => openDetail(hw)}
                className="text-left w-full"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-4 space-y-2">
                  {/* chip + due */}
                  <div className="flex items-center justify-between">
                    <Chip
                      size="sm"
                      style={{ backgroundColor: chip.bg, color: chip.color }}
                    >
                      {chip.label}
                    </Chip>
                    {hw.status === "Assigned" && (
                      <div className="flex items-center gap-1.5">
                        <ClockCircle
                          weight="BoldDuotone"
                          className="w-3.5 h-3.5"
                          style={{ color: dueColor }}
                        />
                        <span
                          className="text-xs font-semibold"
                          style={{ color: dueColor }}
                        >
                          {due.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="font-semibold text-sm line-clamp-1"
                    style={{ color: colors.text.primary }}
                  >
                    {hw.title ||
                      hw.sessionTitle ||
                      t("studentDashboard.homework.title")}
                  </h3>

                  {/* Breadcrumb */}
                  <Breadcrumb hw={hw} />

                  {/* Bottom row: tutor + action/score */}
                  <div
                    className="flex items-center justify-between gap-2 pt-2 border-t"
                    style={{ borderColor: colors.border.medium }}
                  >
                    {tutorName ? (
                      <div className="flex items-center gap-1.5 min-w-0 pb-1">
                        <Avatar
                          src={withCDN(hw.tutor?.avatar)}
                          name={tutorName}
                          size="sm"
                          className="w-8 h-8 shrink-0 text-[8px]"
                        />
                        <span
                          className="text-xs truncate"
                          style={{ color: colors.text.secondary }}
                        >
                          {tutorName}
                        </span>
                      </div>
                    ) : (
                      <div />
                    )}
                    {hw.status === "Scored" ? (
                      <span
                        className="text-sm font-bold shrink-0"
                        style={{ color: colors.state.success }}
                      >
                        {hw.score}/{hw.maxScore}
                      </span>
                    ) : hw.status === "Assigned" ? (
                      <Button
                        size="sm"
                        startContent={
                          <Plain weight="BoldDuotone" className="w-4 h-4" />
                        }
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          openSubmit(hw);
                        }}
                        style={{
                          backgroundColor: colors.primary.main,
                          color: colors.text.white,
                        }}
                      >
                        {t("studentDashboard.homework.submit")}
                      </Button>
                    ) : (
                      <span
                        className="text-xs italic shrink-0"
                        style={{ color: colors.text.tertiary }}
                      >
                        {t("studentDashboard.homework.notGraded")}
                      </span>
                    )}
                  </div>

                  {/* Score bar for Scored items */}
                  {hw.status === "Scored" && (
                    <Progress
                      aria-label="Score"
                      value={scorePct}
                      size="sm"
                      color="success"
                    />
                  )}
                </CardBody>
              </Card>
            );
          })}
        </motion.div>
      )}

      {/* ==================== DETAIL MODAL ==================== */}
      <StudentHomeworkDetailModal
        isOpen={detailDisclosure.isOpen}
        onClose={detailDisclosure.onClose}
        hw={selectedHw}
        onSubmitClick={openSubmit}
        onCourseClick={(hw) => navigate(`/student/courses/${hw.courseId}`)}
        onTutorClick={(hw) => navigate(`/tutor-profile/${hw.tutorId}`)}
      />

      {/* ==================== SUBMIT MODAL ==================== */}
      <StudentHomeworkSubmitModal
        isOpen={submitDisclosure.isOpen}
        onClose={submitDisclosure.onClose}
        hw={selectedHw}
        onSubmitSuccess={() => {
          detailDisclosure.onClose();
          fetchHomeworks();
        }}
      />
    </div>
  );
};

export default Homework;
