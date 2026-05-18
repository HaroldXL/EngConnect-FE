import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AddCircle,
  AltArrowRight,
  Calendar,
  CheckCircle,
  ClipboardAdd,
  ClipboardList,
  ClockCircle,
  DangerTriangle,
  DocumentText,
  File,
  Gallery,
  Hourglass,
  MinimalisticMagnifier,
  MenuDots,
  Pen,
  Plain,
  SquareAcademicCap,
  SquareAltArrowRight,
  SquareBottomUp,
  Star,
  Target,
  TrashBinMinimalistic,
} from "@solar-icons/react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Select,
  SelectItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Progress,
  addToast,
} from "@heroui/react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import { lessonHomeworkApi } from "../../../api";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import toDoIllustration from "../../../assets/illustrations/to-do.avif";
import HomeworkSkeleton from "../../../components/HomeworkSkeleton/HomeworkSkeleton";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

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
    return (
      <DocumentText weight="BoldDuotone" className={className} style={style} />
    );
  if (ZIP_EXT_RE.test(name))
    return <File weight="BoldDuotone" className={className} style={style} />;
  return <File weight="BoldDuotone" className={className} style={style} />;
};

const Homework = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const {
    inputClassNames,
    textareaClassNames,
    filterInputClassNames,
    filterTabsClassNames,
  } = useInputStyles();
  const navigate = useNavigate();
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const user = useSelector(selectUser);

  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const [selectedHw, setSelectedHw] = useState(null);
  const [assigningId, setAssigningId] = useState(null);

  // Edit modal
  const editDisclosure = useDisclosure();
  const [editForm, setEditForm] = useState({
    id: "",
    title: "",
    description: "",
    maxScore: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Grade modal
  const gradeDisclosure = useDisclosure();
  const [gradeForm, setGradeForm] = useState({ score: "", tutorFeedback: "" });
  const [gradeErrors, setGradeErrors] = useState({});
  const [grading, setGrading] = useState(false);

  // Delete
  const deleteDisclosure = useDisclosure();
  const [deleting, setDeleting] = useState(false);

  const fetchHomeworks = useCallback(async () => {
    if (!user?.tutorId) return;
    try {
      setLoading(true);
      const params = {
        TutorId: user.tutorId,
        "page-size": 100,
      };
      if (searchQuery.trim()) params["search-term"] = searchQuery.trim();
      const res = await lessonHomeworkApi.getHomeworks(params);
      setHomeworks(res?.data?.items || []);
    } catch (err) {
      console.error("Failed to fetch homeworks:", err);
      setHomeworks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.tutorId, searchQuery]);

  useEffect(() => {
    fetchHomeworks();
  }, [fetchHomeworks]);

  // Stats
  const stats = useMemo(() => {
    let drafts = 0;
    let assigned = 0;
    let awaitingGrade = 0;
    let graded = 0;
    for (const h of homeworks) {
      if (h.status === "NotStarted") drafts += 1;
      else if (h.status === "Assigned") assigned += 1;
      else if (h.status === "Submitted") awaitingGrade += 1;
      else if (h.status === "Scored") graded += 1;
    }
    return { drafts, assigned, awaitingGrade, graded };
  }, [homeworks]);

  // Filter
  const filtered = useMemo(() => {
    const map = {
      notStarted: "NotStarted",
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
        case "NotStarted":
          return {
            bg: `${colors.text.tertiary}20`,
            color: colors.text.tertiary,
            label: t("tutorDashboard.homework.status.notStarted"),
          };
        case "Assigned":
          return {
            bg: `${colors.state.warning}20`,
            color: colors.state.warning,
            label: t("tutorDashboard.homework.status.assigned"),
          };
        case "Submitted":
          return {
            bg: `${colors.primary.main}20`,
            color: colors.primary.main,
            label: t("tutorDashboard.homework.status.submitted"),
          };
        case "Scored":
          return {
            bg: `${colors.state.success}20`,
            color: colors.state.success,
            label: t("tutorDashboard.homework.status.scored"),
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

  // ==================== ASSIGN ====================
  const handleAssign = async (hw) => {
    try {
      setAssigningId(hw.id);
      await lessonHomeworkApi.assignHomework(hw.id);
      addToast({
        title: t("tutorDashboard.homework.assignSuccess"),
        color: "success",
        timeout: 3000,
      });
      fetchHomeworks();
    } catch (err) {
      console.error("Failed to assign homework:", err);
      addToast({
        title: t("tutorDashboard.homework.assignError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setAssigningId(null);
    }
  };

  // ==================== EDIT ====================
  const openEdit = (hw) => {
    setEditForm({
      id: hw.id,
      title: hw.title || "",
      description: hw.description || "",
      maxScore: String(hw.maxScore ?? ""),
    });
    setEditErrors({});
    editDisclosure.onOpen();
  };

  const handleSaveEdit = async () => {
    const errs = {};
    if (!editForm.description.trim())
      errs.description = t("tutorDashboard.homework.descriptionRequired");
    if (!editForm.maxScore || Number(editForm.maxScore) <= 0)
      errs.maxScore = t("tutorDashboard.homework.maxScoreRequired");
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setSaving(true);
      await lessonHomeworkApi.updateHomework(editForm.id, {
        id: editForm.id,
        title: editForm.title,
        description: editForm.description.trim(),
        submissionUrl: null,
        score: null,
        maxScore: Number(editForm.maxScore),
      });
      addToast({
        title: t("tutorDashboard.homework.updateSuccess"),
        color: "success",
        timeout: 3000,
      });
      editDisclosure.onClose();
      fetchHomeworks();
    } catch (err) {
      console.error("Failed to update homework:", err);
      addToast({
        title: t("tutorDashboard.homework.updateError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ==================== GRADE ====================
  const openGrade = (hw) => {
    setSelectedHw(hw);
    setGradeForm({
      score: hw.score != null ? String(hw.score) : "",
      tutorFeedback: hw.tutorFeedback || "",
    });
    setGradeErrors({});
    gradeDisclosure.onOpen();
  };

  const handleGrade = async () => {
    const errs = {};
    const scoreNum = Number(gradeForm.score);
    if (gradeForm.score === "" || Number.isNaN(scoreNum))
      errs.score = t("tutorDashboard.homework.scoreRequired");
    else if (scoreNum < 0 || scoreNum > (selectedHw?.maxScore ?? 100))
      errs.score = t("tutorDashboard.homework.scoreRangeError", {
        max: selectedHw?.maxScore ?? 100,
      });
    setGradeErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setGrading(true);
      await lessonHomeworkApi.gradeHomework(
        selectedHw.id,
        scoreNum,
        gradeForm.tutorFeedback,
      );
      addToast({
        title: t("tutorDashboard.homework.gradeSuccess"),
        color: "success",
        timeout: 3000,
      });
      gradeDisclosure.onClose();
      fetchHomeworks();
    } catch (err) {
      console.error("Failed to grade homework:", err);
      addToast({
        title: t("tutorDashboard.homework.gradeError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setGrading(false);
    }
  };

  // ==================== DELETE ====================
  const openDelete = (hw) => {
    setSelectedHw(hw);
    deleteDisclosure.onOpen();
  };

  const handleDelete = async () => {
    if (!selectedHw) return;
    try {
      setDeleting(true);
      await lessonHomeworkApi.deleteHomework(selectedHw.id);
      addToast({
        title: t("tutorDashboard.homework.deleteSuccess"),
        color: "success",
        timeout: 3000,
      });
      deleteDisclosure.onClose();
      fetchHomeworks();
    } catch (err) {
      console.error("Failed to delete homework:", err);
      addToast({
        title: t("tutorDashboard.homework.deleteError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  // ==================== DETAIL ====================
  const openDetail = (hw) => {
    navigate(`/tutor/homework/${hw.id}`);
  };

  // ── Sub-components ─────────────────────────────────────────────────────
  const StatCard = ({ icon: Icon, label, value, accent }) => (
    <Card shadow="none" style={{ backgroundColor: colors.background.light }}>
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

  const SubmissionPreview = ({ url }) => {
    if (!url) return null;
    const isImage = IMAGE_EXT_RE.test(getFileBaseName(url));
    if (isImage) {
      return (
        <a
          href={withCDN(url)}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
          style={{ backgroundColor: colors.background.gray }}
        >
          <img
            src={withCDN(url)}
            alt="Submission"
            className="w-full max-h-80 object-contain"
          />
          <div className="p-3 flex items-center justify-between gap-2">
            <span
              className="text-xs truncate"
              style={{ color: colors.text.secondary }}
            >
              {getFileBaseName(url)}
            </span>
            <SquareAltArrowRight
              weight="BoldDuotone"
              className="w-4 h-4 shrink-0"
              style={{ color: colors.primary.main }}
            />
          </div>
        </a>
      );
    }
    return (
      <a
        href={withCDN(url)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-opacity"
        style={{ backgroundColor: `${colors.primary.main}12` }}
      >
        {getFileTypeIcon(url, "w-9 h-9 shrink-0", {
          color: colors.primary.main,
        })}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: colors.primary.main }}
          >
            {getFileBaseName(url)}
          </p>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            {t("tutorDashboard.homework.viewSubmission")}
          </p>
        </div>
        <SquareAltArrowRight
          weight="BoldDuotone"
          className="w-4 h-4 shrink-0"
          style={{ color: colors.primary.main }}
        />
      </a>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────
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
            {t("tutorDashboard.homework.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("tutorDashboard.homework.subtitle")}
          </p>
        </div>
        <Button
          startContent={
            <ClipboardAdd weight="BoldDuotone" className="w-5 h-5" />
          }
          style={{
            backgroundColor: colors.primary.main,
            color: colors.text.white,
          }}
          onPress={() => navigate("/tutor/homework/create")}
        >
          {t("tutorDashboard.homework.createBtn")}
        </Button>
      </motion.div>

      {/* Stats */}
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard
          icon={ClipboardList}
          label={t("tutorDashboard.homework.stats.drafts")}
          value={stats.drafts}
          accent={colors.text.tertiary}
        />
        <StatCard
          icon={Hourglass}
          label={t("tutorDashboard.homework.stats.assigned")}
          value={stats.assigned}
          accent={colors.state.warning}
        />
        <StatCard
          icon={Plain}
          label={t("tutorDashboard.homework.stats.awaitingGrade")}
          value={stats.awaitingGrade}
          accent={colors.primary.main}
        />
        <StatCard
          icon={CheckCircle}
          label={t("tutorDashboard.homework.stats.graded")}
          value={stats.graded}
          accent={colors.state.success}
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
          placeholder={t("tutorDashboard.homework.searchPlaceholder")}
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={
            <MinimalisticMagnifier
              weight="BoldDuotone"
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
          <Tab key="all" title={t("tutorDashboard.homework.filter.all")} />
          <Tab
            key="notStarted"
            title={`${t("tutorDashboard.homework.filter.notStarted")} (${stats.drafts})`}
          />
          <Tab
            key="assigned"
            title={`${t("tutorDashboard.homework.filter.assigned")} (${stats.assigned})`}
          />
          <Tab
            key="submitted"
            title={`${t("tutorDashboard.homework.filter.submitted")} (${stats.awaitingGrade})`}
          />
          <Tab
            key="scored"
            title={`${t("tutorDashboard.homework.filter.scored")} (${stats.graded})`}
          />
        </Tabs>
      </motion.div>

      {/* List */}
      {loading ? (
        <HomeworkSkeleton count={5} showTutorBadge={false} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <img
            src={toDoIllustration}
            alt="Empty"
            draggable={false}
            className="w-68 h-68 object-contain opacity-90"
          />
          <h3
            className="text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            {homeworks.length === 0
              ? t("tutorDashboard.homework.empty")
              : t("tutorDashboard.homework.emptyFilter")}
          </h3>
          <p
            className="text-sm text-center max-w-sm"
            style={{ color: colors.text.secondary }}
          >
            {homeworks.length === 0
              ? t("tutorDashboard.homework.emptyDesc")
              : ""}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {filtered.map((hw) => {
            const chip = statusChipProps(hw.status);
            const studentName = hw.student
              ? `${hw.student.firstName || ""} ${hw.student.lastName || ""}`.trim()
              : null;
            const hasDue = !!hw.dueAt;
            const isOverdue =
              hasDue &&
              new Date(hw.dueAt).getTime() < Date.now() &&
              hw.status === "Assigned";
            const scorePct =
              hw.status === "Scored" && hw.maxScore
                ? Math.round((hw.score / hw.maxScore) * 100)
                : 0;

            return (
              <Card
                key={hw.id}
                shadow="none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-6 space-y-3">
                  {/* Top row: student avatar + name + primary action */}
                  <div
                    className="flex items-center justify-between gap-3 pb-3 border-b"
                    style={{ borderColor: colors.border.medium }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={withCDN(hw.student?.avatar)}
                        name={studentName || "?"}
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p
                          className="text-[10px] uppercase tracking-wide font-semibold"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("tutorDashboard.homework.assignedTo")}
                        </p>
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: colors.text.primary }}
                        >
                          {studentName || "—"}
                        </p>
                      </div>
                    </div>
                    {hw.status === "NotStarted" && (
                      <Button
                        size="sm"
                        startContent={
                          <Plain
                            weight="BoldDuotone"
                            className="w-4 h-4"
                          />
                        }
                        isLoading={assigningId === hw.id}
                        onPress={() => handleAssign(hw)}
                        style={{
                          backgroundColor: colors.primary.main,
                          color: colors.text.white,
                        }}
                      >
                        {assigningId === hw.id
                          ? t("tutorDashboard.homework.assigning")
                          : t("tutorDashboard.homework.assign")}
                      </Button>
                    )}
                    {hw.status === "Submitted" && (
                      <div className="flex items-center gap-2">
                        {hw.submissionUrl && (
                          <Button
                            as="a"
                            href={withCDN(hw.submissionUrl)}
                            target="_blank"
                            rel="noreferrer"
                            size="sm"
                            startContent={
                              <SquareBottomUp
                                weight="BoldDuotone"
                                className="w-4 h-4"
                              />
                            }
                            style={{
                              backgroundColor:
                                colors.button.primaryLight.background,
                              color: colors.button.primaryLight.text,
                            }}
                          >
                            {t("tutorDashboard.homework.viewSubmission")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          startContent={
                            <Star weight="BoldDuotone" className="w-4 h-4" />
                          }
                          onPress={() => openGrade(hw)}
                          style={{
                            backgroundColor: colors.primary.main,
                            color: colors.text.white,
                          }}
                        >
                          {t("tutorDashboard.homework.grade")}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Content row: title/meta on left, view details + menu on right */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* chip(s) + title */}
                      <div className="flex items-start gap-2">
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                          <Chip
                            size="sm"
                            style={{
                              backgroundColor: chip.bg,
                              color: chip.color,
                            }}
                          >
                            {chip.label}
                          </Chip>
                          {hw.type && (
                            <Chip
                              size="sm"
                              style={{
                                backgroundColor: `${colors.primary.main}15`,
                                color: colors.primary.main,
                              }}
                            >
                              {hw.type}
                            </Chip>
                          )}
                          {hw.aiAnalysisData && (
                            <Chip
                              size="sm"
                              style={{
                                backgroundColor: `${colors.primary.main}10`,
                                color: colors.primary.main,
                              }}
                            >
                              {t("homeworkAI.aiBadge")}
                            </Chip>
                          )}
                          {isOverdue && (
                            <Chip
                              size="sm"
                              style={{
                                backgroundColor: `${colors.state.error}20`,
                                color: colors.state.error,
                              }}
                              startContent={
                                <DangerTriangle
                                  weight="BoldDuotone"
                                  className="w-3 h-3 ml-1"
                                />
                              }
                            >
                              {t("tutorDashboard.homework.overdue") ||
                                "Overdue"}
                            </Chip>
                          )}
                        </div>
                        <h3
                          className="font-semibold text-base line-clamp-1 min-w-0"
                          style={{ color: colors.text.primary }}
                        >
                          {hw.title ||
                            hw.sessionTitle ||
                            t("tutorDashboard.homework.title")}
                        </h3>
                      </div>

                      <Breadcrumb size="md" hw={hw} />

                      <p
                        className="text-sm line-clamp-1 mb-2 mt-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {hw.description}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 flex-wrap text-xs">
                        <div
                          className="flex items-center gap-1.5"
                          style={{ color: colors.text.tertiary }}
                        >
                          <ClockCircle
                            weight="BoldDuotone"
                            className="w-3.5 h-3.5"
                          />
                          <span>
                            {t("tutorDashboard.homework.dueDate")}:{" "}
                            <strong style={{ color: colors.text.primary }}>
                              {formatDate(hw.dueAt, locale) ||
                                t("tutorDashboard.homework.noDueDate")}
                            </strong>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1.5"
                          style={{ color: colors.text.tertiary }}
                        >
                          <Target
                            weight="BoldDuotone"
                            className="w-3.5 h-3.5"
                          />
                          <span>
                            {t("tutorDashboard.homework.maxScore")}:{" "}
                            <strong style={{ color: colors.text.primary }}>
                              {hw.maxScore ?? "—"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Score bar */}
                      {hw.status === "Scored" && (
                        <div
                          className="flex items-center gap-3 p-2 rounded-xl"
                          style={{
                            backgroundColor: `${colors.state.success}10`,
                          }}
                        >
                          <Star
                            weight="BoldDuotone"
                            className="w-4 h-4 shrink-0"
                            style={{ color: colors.state.warning }}
                          />
                          <Progress
                            aria-label="Score"
                            value={scorePct}
                            size="sm"
                            color="success"
                            className="flex-1"
                          />
                          <span
                            className="text-sm font-bold whitespace-nowrap"
                            style={{ color: colors.state.success }}
                          >
                            {hw.score}/{hw.maxScore}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: view details + menu */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => openDetail(hw)}
                        style={{
                          backgroundColor: colors.background.gray,
                          color: colors.text.secondary,
                        }}
                      >
                        {t("tutorDashboard.homework.viewDetails")}
                      </Button>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly variant="light" size="sm">
                            <MenuDots
                              weight="BoldDuotone"
                              className="w-5 h-5"
                            />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem
                            key="edit"
                            startContent={
                              <Pen weight="BoldDuotone" className="w-4 h-4" />
                            }
                            onPress={() => openEdit(hw)}
                          >
                            {t("tutorDashboard.homework.edit")}
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={
                              <TrashBinMinimalistic
                                weight="BoldDuotone"
                                className="w-4 h-4"
                              />
                            }
                            onPress={() => openDelete(hw)}
                          >
                            {t("tutorDashboard.homework.delete")}
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </motion.div>
      )}

      {/* ==================== EDIT MODAL ==================== */}
      <Modal
        isOpen={editDisclosure.isOpen}
        onClose={editDisclosure.onClose}
        size="2xl"
        scrollBehavior="inside"
        isDismissable={!saving}
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            {t("tutorDashboard.homework.editModalTitle")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Title"
                labelPlacement="outside"
                value={editForm.title}
                onValueChange={(v) => setEditForm((p) => ({ ...p, title: v }))}
                classNames={inputClassNames}
              />
              <Textarea
                label={t("tutorDashboard.homework.descriptionLabel")}
                labelPlacement="outside"
                value={editForm.description}
                onValueChange={(v) => {
                  setEditForm((p) => ({ ...p, description: v }));
                  if (editErrors.description)
                    setEditErrors((p) => ({ ...p, description: undefined }));
                }}
                minRows={3}
                isInvalid={!!editErrors.description}
                errorMessage={editErrors.description}
                classNames={textareaClassNames}
              />
              <Input
                type="number"
                label={t("tutorDashboard.homework.maxScoreLabel")}
                labelPlacement="outside"
                value={editForm.maxScore}
                onValueChange={(v) => {
                  setEditForm((p) => ({ ...p, maxScore: v }));
                  if (editErrors.maxScore)
                    setEditErrors((p) => ({ ...p, maxScore: undefined }));
                }}
                isInvalid={!!editErrors.maxScore}
                errorMessage={editErrors.maxScore}
                min={1}
                classNames={inputClassNames}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={editDisclosure.onClose}
              isDisabled={saving}
            >
              {t("tutorDashboard.homework.cancel")}
            </Button>
            <Button
              onPress={handleSaveEdit}
              isLoading={saving}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
            >
              {saving
                ? t("tutorDashboard.homework.saving")
                : t("tutorDashboard.homework.saveBtn")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ==================== GRADE MODAL ==================== */}
      <Modal
        isOpen={gradeDisclosure.isOpen}
        onClose={gradeDisclosure.onClose}
        size="2xl"
        scrollBehavior="inside"
        isDismissable={!grading}
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            {t("tutorDashboard.homework.gradeModalTitle")}
          </ModalHeader>
          <ModalBody>
            {selectedHw && (
              <div className="space-y-4">
                {/* Student + homework header */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: colors.background.gray }}
                  onClick={() => {
                    gradeDisclosure.onClose();
                    navigate(`/tutor/students/${selectedHw.studentId}`);
                  }}
                >
                  {selectedHw.student && (
                    <Avatar
                      src={withCDN(selectedHw.student.avatar)}
                      name={`${selectedHw.student.firstName || ""} ${selectedHw.student.lastName || ""}`}
                      size="md"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] uppercase tracking-wide font-semibold"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("tutorDashboard.homework.assignedTo")}
                    </p>
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: colors.text.primary }}
                    >
                      {selectedHw.student
                        ? `${selectedHw.student.firstName || ""} ${selectedHw.student.lastName || ""}`.trim()
                        : "—"}
                    </p>
                    <Breadcrumb
                      hw={selectedHw}
                      onCourseClick={(e) => {
                        e.stopPropagation();
                        gradeDisclosure.onClose();
                        navigate(`/tutor/courses/${selectedHw.courseId}`);
                      }}
                    />
                  </div>
                  <SquareAltArrowRight
                    weight="BoldDuotone"
                    className="w-4 h-4 shrink-0"
                    style={{ color: colors.primary.main }}
                  />
                </div>

                {/* Description */}
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="text-[11px] uppercase tracking-wide font-semibold mb-1"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("tutorDashboard.homework.descriptionLabel")}
                  </p>
                  <p
                    className="text-sm whitespace-pre-wrap"
                    style={{ color: colors.text.primary }}
                  >
                    {selectedHw.description}
                  </p>
                </div>

                {/* Submission preview */}
                {selectedHw.submissionUrl && (
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("tutorDashboard.homework.submission")}
                    </p>
                    <SubmissionPreview url={selectedHw.submissionUrl} />
                  </div>
                )}

                {/* Score + feedback */}
                <Input
                  type="number"
                  label={t("tutorDashboard.homework.scoreLabel")}
                  labelPlacement="outside"
                  placeholder={t("tutorDashboard.homework.scorePlaceholder", {
                    max: selectedHw.maxScore ?? 100,
                  })}
                  value={gradeForm.score}
                  onValueChange={(v) => {
                    setGradeForm((p) => ({ ...p, score: v }));
                    if (gradeErrors.score)
                      setGradeErrors((p) => ({ ...p, score: undefined }));
                  }}
                  isInvalid={!!gradeErrors.score}
                  errorMessage={gradeErrors.score}
                  min={0}
                  max={selectedHw.maxScore}
                  endContent={
                    <span
                      className="text-sm shrink-0"
                      style={{ color: colors.text.tertiary }}
                    >
                      / {selectedHw.maxScore}
                    </span>
                  }
                  classNames={inputClassNames}
                />

                <Textarea
                  label={t("tutorDashboard.homework.feedbackLabel")}
                  labelPlacement="outside"
                  placeholder={t("tutorDashboard.homework.feedbackPlaceholder")}
                  value={gradeForm.tutorFeedback}
                  onValueChange={(v) =>
                    setGradeForm((p) => ({ ...p, tutorFeedback: v }))
                  }
                  minRows={4}
                  classNames={textareaClassNames}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={gradeDisclosure.onClose}
              isDisabled={grading}
            >
              {t("tutorDashboard.homework.cancel")}
            </Button>
            <Button
              onPress={handleGrade}
              isLoading={grading}
              startContent={
                !grading && <Star weight="BoldDuotone" className="w-4 h-4" />
              }
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
            >
              {grading
                ? t("tutorDashboard.homework.grading")
                : t("tutorDashboard.homework.submitGradeBtn")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Detail view now lives at /tutor/homework/:id - see HomeworkDetail page */}


      {/* ==================== DELETE MODAL ==================== */}
      <Modal
        isOpen={deleteDisclosure.isOpen}
        onClose={deleteDisclosure.onClose}
        size="sm"
        isDismissable={!deleting}
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            {t("tutorDashboard.homework.deleteModalTitle")}
          </ModalHeader>
          <ModalBody>
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${colors.state.error}20` }}
              >
                <DangerTriangle
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.state.error }}
                />
              </div>
              <div>
                <p
                  className="font-medium mb-1"
                  style={{ color: colors.text.primary }}
                >
                  {selectedHw?.title}
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t("tutorDashboard.homework.deleteConfirm")}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={deleteDisclosure.onClose}
              isDisabled={deleting}
            >
              {t("tutorDashboard.homework.cancel")}
            </Button>
            <Button color="danger" onPress={handleDelete} isLoading={deleting}>
              {deleting
                ? t("tutorDashboard.homework.deleting")
                : t("tutorDashboard.homework.deleteBtn")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Homework;
