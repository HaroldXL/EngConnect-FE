import { useState, useEffect, useCallback, useMemo } from "react";
import clockAndCat from "../../assets/illustrations/clock-and-cat.avif";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Progress,
  Skeleton,
  Spinner,
  Textarea,
  addToast,
} from "@heroui/react";
import {
  AltArrowLeft,
  AltArrowRight,
  Calendar,
  ClockCircle,
  DangerTriangle,
  DocumentText,
  File,
  Gallery,
  Plain,
  Plain2,
  SquareAcademicCap,
  SquareAltArrowRight,
  SquareBottomUp,
  Star,
  Target,
  UserRounded,
} from "@solar-icons/react";

import { lessonHomeworkApi } from "../../api";
import { selectUser } from "../../store";
import { useThemeColors } from "../../hooks/useThemeColors";
import useInputStyles from "../../hooks/useInputStyles";
import AIDetectionCard from "../../components/HomeworkAI/AIDetectionCard";
import WritingAnalysisCard from "../../components/HomeworkAI/WritingAnalysisCard";
import ReadingAnalysisCard from "../../components/HomeworkAI/ReadingAnalysisCard";
import StudentHomeworkSubmitModal from "../../components/StudentHomeworkSubmitModal/StudentHomeworkSubmitModal";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|bmp|svg)$/i;
const PDF_EXT_RE = /\.pdf$/i;
const DOC_EXT_RE = /\.docx?$/i;

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
  if (PDF_EXT_RE.test(name) || DOC_EXT_RE.test(name))
    return (
      <DocumentText weight="BoldDuotone" className={className} style={style} />
    );
  return <File weight="BoldDuotone" className={className} style={style} />;
};

const formatDateTime = (iso, locale) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * HomeworkDetail
 *
 * Props:
 *  - role: "tutor" | "student"
 */
export default function HomeworkDetail({ role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames, textareaClassNames } = useInputStyles();
  const user = useSelector(selectUser);
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const isTutor = role === "tutor";
  const tnsRoot = isTutor
    ? "tutorDashboard.homework"
    : "studentDashboard.homework";

  const [hw, setHw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tutor-only: grade form
  const [gradeForm, setGradeForm] = useState({ score: "", tutorFeedback: "" });
  const [gradeErrors, setGradeErrors] = useState({});
  const [grading, setGrading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Student-only: submit modal
  const [submitOpen, setSubmitOpen] = useState(false);

  const fetchHw = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await lessonHomeworkApi.getHomeworkById(id);
      const data = res?.data;
      if (!data) {
        setError("not_found");
        return;
      }
      setHw(data);
      if (data.score != null) {
        setGradeForm({
          score: String(data.score),
          tutorFeedback: data.tutorFeedback || "",
        });
      } else {
        setGradeForm({
          score: "",
          tutorFeedback: data.tutorFeedback || "",
        });
      }
    } catch (err) {
      console.error("Failed to load homework:", err);
      setError("error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHw();
  }, [fetchHw]);

  // ── Status chip ───────────────────────────────────────────────────────
  const statusChip = useMemo(() => {
    if (!hw) return null;
    const baseRoot = `${tnsRoot}.status`;
    switch (hw.status) {
      case "NotStarted":
        return {
          bg: `${colors.text.tertiary}20`,
          color: colors.text.tertiary,
          label: t(`${baseRoot}.notStarted`),
        };
      case "Assigned":
        return {
          bg: `${colors.state.warning}20`,
          color: colors.state.warning,
          label: t(`${baseRoot}.assigned`),
        };
      case "Submitted":
        return {
          bg: `${colors.primary.main}20`,
          color: colors.primary.main,
          label: t(`${baseRoot}.submitted`),
        };
      case "Scored":
        return {
          bg: `${colors.state.success}20`,
          color: colors.state.success,
          label: t(`${baseRoot}.scored`),
        };
      default:
        return {
          bg: `${colors.text.tertiary}20`,
          color: colors.text.tertiary,
          label: hw.status,
        };
    }
  }, [hw, colors, t, tnsRoot]);

  // ── Tutor actions ─────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!hw) return;
    try {
      setAssigning(true);
      await lessonHomeworkApi.assignHomework(hw.id);
      addToast({
        title: t("tutorDashboard.homework.assignSuccess"),
        color: "success",
        timeout: 3000,
      });
      fetchHw();
    } catch (err) {
      console.error("Assign failed:", err);
      addToast({
        title: t("tutorDashboard.homework.assignError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleGrade = async () => {
    if (!hw) return;
    const errs = {};
    const scoreNum = Number(gradeForm.score);
    if (gradeForm.score === "" || Number.isNaN(scoreNum))
      errs.score = t("tutorDashboard.homework.scoreRequired");
    else if (scoreNum < 0 || scoreNum > (hw.maxScore ?? 100))
      errs.score = t("tutorDashboard.homework.scoreRangeError", {
        max: hw.maxScore ?? 100,
      });
    setGradeErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setGrading(true);
      await lessonHomeworkApi.gradeHomework(
        hw.id,
        scoreNum,
        gradeForm.tutorFeedback,
      );
      addToast({
        title: t("tutorDashboard.homework.gradeSuccess"),
        color: "success",
        timeout: 3000,
      });
      fetchHw();
    } catch (err) {
      console.error("Grade failed:", err);
      addToast({
        title: t("tutorDashboard.homework.gradeError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setGrading(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────
  if (loading) return <DetailSkeleton colors={colors} />;
  if (error || !hw) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <DangerTriangle
          weight="BoldDuotone"
          className="w-12 h-12"
          style={{ color: colors.state.error }}
        />
        <p
          className="text-base font-semibold"
          style={{ color: colors.text.primary }}
        >
          {t("notFound.title") || "Not found"}
        </p>
        <Button
          variant="light"
          onPress={() =>
            navigate(isTutor ? "/tutor/homework" : "/student/homework")
          }
        >
          {t("common.back")}
        </Button>
      </div>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────
  const isOverdue =
    hw.dueAt &&
    new Date(hw.dueAt).getTime() < Date.now() &&
    hw.status === "Assigned";

  const personName = isTutor
    ? hw.student
      ? `${hw.student.firstName || ""} ${hw.student.lastName || ""}`.trim()
      : null
    : hw.tutor
      ? `${hw.tutor.firstName || ""} ${hw.tutor.lastName || ""}`.trim()
      : null;
  const personAvatar = isTutor ? hw.student?.avatar : hw.tutor?.avatar;
  const personRole = isTutor
    ? t("tutorDashboard.homework.assignedTo")
    : t("studentDashboard.homework.yourTutor");

  const personHref = isTutor
    ? `/tutor/students/${hw.studentId}`
    : `/tutor-profile/${hw.tutorId}`;

  const courseHref = isTutor
    ? `/tutor/courses/${hw.courseId}`
    : `/student/courses/${hw.courseId}`;

  // AI feature visibility
  const isWriting = hw.type === "Writing";
  const isReading = hw.type === "Reading";
  const showAIDetection = isTutor && isWriting;
  const showWritingAnalysis =
    isWriting &&
    (isTutor || hw.status === "Submitted" || hw.status === "Scored");
  const showReadingAnalysis =
    !isTutor &&
    isReading &&
    (hw.status === "Submitted" || hw.status === "Scored");

  const canRunWritingAI = isTutor && !!hw.submissionUrl;
  const canRunReadingAI = !isTutor && !!hw.resourceUrl;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">
      <Button
        variant="light"
        startContent={<AltArrowLeft weight="BoldDuotone" size={18} />}
        onPress={() =>
          navigate(isTutor ? "/tutor/homework" : "/student/homework")
        }
        style={{ color: colors.text.secondary }}
        className="self-start"
      >
        {t("common.back")}
      </Button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-start justify-between gap-3 flex-wrap"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {statusChip && (
              <Chip
                size="sm"
                style={{
                  backgroundColor: statusChip.bg,
                  color: statusChip.color,
                }}
              >
                {statusChip.label}
              </Chip>
            )}
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
                {t("tutorDashboard.homework.overdue") || "Overdue"}
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
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {hw.title}
          </h1>
          <Breadcrumb
            hw={hw}
            colors={colors}
            onCourseClick={() => navigate(courseHref)}
          />
        </div>
      </motion.div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT (2/3) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="lg:col-span-2 space-y-5"
        >
          {/* Person row */}
          {personName && (
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-4">
                <button
                  type="button"
                  onClick={() => navigate(personHref)}
                  className="flex items-center gap-3 w-full text-left transition-opacity hover:opacity-80"
                >
                  <Avatar
                    src={withCDN(personAvatar)}
                    name={personName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] uppercase tracking-wide font-semibold"
                      style={{ color: colors.text.tertiary }}
                    >
                      {personRole}
                    </p>
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: colors.text.primary }}
                    >
                      {personName}
                    </p>
                  </div>
                  <SquareAltArrowRight
                    weight="BoldDuotone"
                    className="w-4 h-4 shrink-0"
                    style={{ color: colors.primary.main }}
                  />
                </button>
              </CardBody>
            </Card>
          )}

          {/* Description + Meta */}
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-5 space-y-4">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: colors.text.tertiary }}
                >
                  {t(`${tnsRoot}.descriptionLabel`) ||
                    t(`${tnsRoot}.description`)}
                </p>
                <p
                  className="text-sm whitespace-pre-wrap"
                  style={{ color: colors.text.primary }}
                >
                  {hw.description || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetaItem
                  icon={Calendar}
                  label={t(`${tnsRoot}.dueDate`)}
                  value={
                    formatDateTime(hw.dueAt, locale) ||
                    t(`${tnsRoot}.noDueDate`)
                  }
                  colors={colors}
                />
                <MetaItem
                  icon={Target}
                  label={t(`${tnsRoot}.maxScore`)}
                  value={hw.maxScore ?? "—"}
                  colors={colors}
                />
                {hw.assignedAt && (
                  <MetaItem
                    icon={ClockCircle}
                    label={t(`${tnsRoot}.assignedAt`)}
                    value={formatDateTime(hw.assignedAt, locale)}
                    colors={colors}
                  />
                )}
                {hw.submittedAt && (
                  <MetaItem
                    icon={Plain}
                    label={t(`${tnsRoot}.submittedAt`)}
                    value={formatDateTime(hw.submittedAt, locale)}
                    colors={colors}
                  />
                )}
              </div>
            </CardBody>
          </Card>

          {/* Resource */}
          {hw.resourceUrl && (
            <FileCard
              title={t(`${tnsRoot}.resource`)}
              url={hw.resourceUrl}
              accent={colors.primary.main}
              colors={colors}
              t={t}
            />
          )}

          {/* Media (audio/video for Listening type) */}
          {hw.mediaUrl && <MediaCard url={hw.mediaUrl} colors={colors} t={t} />}

          {/* Submission */}
          <FileCard
            title={
              isTutor
                ? t("tutorDashboard.homework.submission")
                : t("studentDashboard.homework.mySubmission")
            }
            url={hw.submissionUrl}
            accent={colors.state.success}
            colors={colors}
            t={t}
            emptyMsg={
              isTutor
                ? t("tutorDashboard.homework.noSubmission")
                : t("studentDashboard.homework.notSubmittedYet") ||
                  "Not submitted yet"
            }
          />

          {/* AI Detection (tutor + writing only) */}
          {showAIDetection && (
            <AIDetectionCard
              homeworkId={hw.id}
              score={hw.aiDetectionScore}
              canRun={canRunWritingAI}
              onUpdated={fetchHw}
            />
          )}

          {/* Writing Analysis */}
          {showWritingAnalysis && (
            <WritingAnalysisCard
              homeworkId={hw.id}
              analysisRaw={hw.aiAnalysisData}
              canRun={isTutor && canRunWritingAI}
              hideTutorAdvice={!isTutor}
              onUpdated={fetchHw}
            />
          )}

          {/* Reading Analysis (student only) */}
          {showReadingAnalysis && (
            <ReadingAnalysisCard
              homeworkId={hw.id}
              analysisRaw={hw.aiAnalysisData}
              canRun={canRunReadingAI}
              onUpdated={fetchHw}
            />
          )}
        </motion.div>

        {/* RIGHT (1/3) sticky */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="lg:col-span-1"
        >
          <div className="lg:sticky lg:top-4 space-y-4">
            {/* Tutor side panel */}
            {isTutor && (
              <Card
                shadow="none"
                className="border-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-5 space-y-4">
                  <h2
                    className="text-base font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {hw.status === "NotStarted"
                      ? t("tutorDashboard.homework.assign")
                      : t("tutorDashboard.homework.gradeModalTitle")}
                  </h2>

                  {hw.status === "NotStarted" && (
                    <Button
                      onPress={handleAssign}
                      isLoading={assigning}
                      startContent={
                        !assigning ? (
                          <Plain weight="BoldDuotone" className="w-4 h-4" />
                        ) : null
                      }
                      style={{
                        backgroundColor: colors.primary.main,
                        color: colors.text.white,
                      }}
                      className="w-full"
                    >
                      {assigning
                        ? t("tutorDashboard.homework.assigning")
                        : t("tutorDashboard.homework.assign")}
                    </Button>
                  )}

                  {(hw.status === "Submitted" || hw.status === "Scored") && (
                    <>
                      <Input
                        type="number"
                        label={t("tutorDashboard.homework.scoreLabel")}
                        labelPlacement="outside"
                        placeholder={t(
                          "tutorDashboard.homework.scorePlaceholder",
                          { max: hw.maxScore ?? 100 },
                        )}
                        value={gradeForm.score}
                        onValueChange={(v) => {
                          setGradeForm((p) => ({ ...p, score: v }));
                          if (gradeErrors.score)
                            setGradeErrors((p) => ({ ...p, score: undefined }));
                        }}
                        isInvalid={!!gradeErrors.score}
                        errorMessage={gradeErrors.score}
                        min={0}
                        max={hw.maxScore}
                        endContent={
                          <span
                            className="text-sm shrink-0"
                            style={{ color: colors.text.tertiary }}
                          >
                            / {hw.maxScore}
                          </span>
                        }
                        classNames={inputClassNames}
                      />
                      <Textarea
                        label={t("tutorDashboard.homework.feedbackLabel")}
                        labelPlacement="outside"
                        placeholder={t(
                          "tutorDashboard.homework.feedbackPlaceholder",
                        )}
                        value={gradeForm.tutorFeedback}
                        onValueChange={(v) =>
                          setGradeForm((p) => ({ ...p, tutorFeedback: v }))
                        }
                        minRows={5}
                        classNames={textareaClassNames}
                      />
                      <Button
                        onPress={handleGrade}
                        isLoading={grading}
                        startContent={
                          !grading ? (
                            <Star weight="BoldDuotone" className="w-4 h-4" />
                          ) : null
                        }
                        style={{
                          backgroundColor: colors.primary.main,
                          color: colors.text.white,
                        }}
                        className="w-full"
                      >
                        {grading
                          ? t("tutorDashboard.homework.grading")
                          : hw.status === "Scored"
                            ? t("tutorDashboard.homework.saveBtn")
                            : t("tutorDashboard.homework.submitGradeBtn")}
                      </Button>
                    </>
                  )}

                  {hw.status === "Assigned" && (
                    <div
                      className="rounded-xl text-sm text-center pb-6 flex flex-col items-center gap-2"
                      style={{
                        backgroundColor: colors.background.gray,
                        color: colors.text.tertiary,
                      }}
                    >
                      <img
                        src={clockAndCat}
                        alt=""
                        draggable={false}
                        className="w-40 h-40 object-contain opacity-90"
                      />
                      {t("tutorDashboard.homework.waitingForSubmission")}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Student side panel */}
            {!isTutor && (
              <Card
                shadow="none"
                className="border-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-5 space-y-4">
                  {hw.status === "Assigned" && (
                    <>
                      <h2
                        className="text-base font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("studentDashboard.homework.submit")}
                      </h2>
                      <p
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("studentDashboard.homework.submitHint") ||
                          "Upload your completed assignment file."}
                      </p>
                      <Button
                        onPress={() => setSubmitOpen(true)}
                        startContent={
                          <SquareBottomUp
                            weight="BoldDuotone"
                            className="w-4 h-4"
                          />
                        }
                        style={{
                          backgroundColor: colors.primary.main,
                          color: colors.text.white,
                        }}
                        className="w-full"
                      >
                        {t("studentDashboard.homework.submit")}
                      </Button>
                    </>
                  )}

                  {hw.status === "Submitted" && (
                    <div className="text-center pb-6 flex flex-col items-center gap-2">
                      <img
                        src={clockAndCat}
                        alt=""
                        draggable={false}
                        className="w-40 h-40 object-contain opacity-90"
                      />
                      <p
                        className="text-sm font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        <Plain2
                          weight="BoldDuotone"
                          className="w-4 h-4 inline-block mr-2"
                          style={{ color: colors.primary.main }}
                        />

                        {t("studentDashboard.homework.status.submitted")}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: colors.text.tertiary }}
                      >
                        {t("studentDashboard.homework.awaitingGrade")}
                      </p>
                    </div>
                  )}

                  {hw.status === "Scored" && (
                    <ScoreBlock hw={hw} colors={colors} t={t} isTutor={false} />
                  )}
                </CardBody>
              </Card>
            )}

            {/* Score display for tutor when scored */}
            {isTutor && hw.status === "Scored" && (
              <Card
                shadow="none"
                className="border-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-5">
                  <ScoreBlock hw={hw} colors={colors} t={t} isTutor={true} />
                </CardBody>
              </Card>
            )}
          </div>
        </motion.div>
      </div>

      {/* Student submit modal */}
      {!isTutor && (
        <StudentHomeworkSubmitModal
          isOpen={submitOpen}
          onClose={() => setSubmitOpen(false)}
          hw={hw}
          onSubmitSuccess={() => {
            setSubmitOpen(false);
            fetchHw();
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
function Breadcrumb({ hw, colors, onCourseClick }) {
  const items = [hw.courseTitle, hw.moduleTitle, hw.sessionTitle].filter(
    Boolean,
  );
  if (items.length === 0) return null;
  return (
    <div
      className="flex items-center gap-1 flex-wrap text-sm mt-1"
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
}

function MetaItem({ icon: Icon, label, value, colors }) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{ backgroundColor: colors.background.gray }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon
          weight="BoldDuotone"
          className="w-3.5 h-3.5"
          style={{ color: colors.text.tertiary }}
        />
        <p
          className="text-[11px] uppercase tracking-wide font-semibold"
          style={{ color: colors.text.tertiary }}
        >
          {label}
        </p>
      </div>
      <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
        {value}
      </p>
    </div>
  );
}

function FileCard({ title, url, accent, colors, t, emptyMsg }) {
  if (!url) {
    if (!emptyMsg) return null;
    return (
      <Card
        shadow="none"
        className="border-none"
        style={{ backgroundColor: colors.background.light }}
      >
        <CardBody className="p-5">
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: colors.text.tertiary }}
          >
            {title}
          </p>
          <p className="text-sm italic" style={{ color: colors.text.tertiary }}>
            {emptyMsg}
          </p>
        </CardBody>
      </Card>
    );
  }

  const isImage = IMAGE_EXT_RE.test(getFileBaseName(url));

  return (
    <Card
      shadow="none"
      className="border-none"
      style={{ backgroundColor: colors.background.light }}
    >
      <CardBody className="p-5">
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-2"
          style={{ color: colors.text.tertiary }}
        >
          {title}
        </p>
        {isImage ? (
          <a
            href={withCDN(url)}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
            style={{ backgroundColor: colors.background.gray }}
          >
            <img
              src={withCDN(url)}
              alt={title}
              className="w-full max-h-80 object-contain"
            />
          </a>
        ) : (
          <a
            href={withCDN(url)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: `${accent}12` }}
          >
            {getFileTypeIcon(url, "w-9 h-9 shrink-0", { color: accent })}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: accent }}
              >
                {getFileBaseName(url)}
              </p>
            </div>
            <SquareAltArrowRight
              weight="BoldDuotone"
              className="w-4 h-4 shrink-0"
              style={{ color: accent }}
            />
          </a>
        )}
      </CardBody>
    </Card>
  );
}

function MediaCard({ url, colors, t }) {
  const fullUrl = withCDN(url);
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(getFileBaseName(url));
  return (
    <Card
      shadow="none"
      className="border-none"
      style={{ backgroundColor: colors.background.light }}
    >
      <CardBody className="p-5">
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-2"
          style={{ color: colors.text.tertiary }}
        >
          {t("tutorDashboard.homework.mediaSection") || "Audio / Video"}
        </p>
        <div
          className="rounded-xl overflow-hidden p-3"
          style={{ backgroundColor: colors.background.gray }}
        >
          {isVideo ? (
            <video src={fullUrl} controls className="w-full rounded-lg" />
          ) : (
            <audio src={fullUrl} controls className="w-full" />
          )}
          <p
            className="text-xs truncate mt-2"
            style={{ color: colors.text.tertiary }}
          >
            {getFileBaseName(url)}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

function ScoreBlock({ hw, colors, t, isTutor }) {
  const pct = hw.maxScore ? (hw.score / hw.maxScore) * 100 : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.state.success}25` }}
          >
            <SquareAcademicCap
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.state.success }}
            />
          </div>
          <p
            className="text-xs uppercase tracking-wide font-semibold"
            style={{ color: colors.text.tertiary }}
          >
            {isTutor
              ? t("tutorDashboard.homework.score")
              : t("studentDashboard.homework.score")}
          </p>
        </div>
        <span
          className="text-3xl font-bold"
          style={{ color: colors.state.success }}
        >
          {hw.score}
          <span
            className="text-base font-normal"
            style={{ color: colors.text.tertiary }}
          >
            /{hw.maxScore}
          </span>
        </span>
      </div>
      <Progress aria-label="Score" value={pct} size="md" color="success" />
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-1"
          style={{ color: colors.text.tertiary }}
        >
          {isTutor
            ? t("tutorDashboard.homework.studentFeedback")
            : t("studentDashboard.homework.tutorFeedback")}
        </p>
        <p
          className="text-sm whitespace-pre-wrap"
          style={{ color: colors.text.primary }}
        >
          {hw.tutorFeedback || t("tutorDashboard.homework.noFeedback") || "—"}
        </p>
      </div>
    </div>
  );
}

function DetailSkeleton({ colors }) {
  return (
    <div className="space-y-5">
      <Skeleton className="w-24 h-9 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="w-32 h-6 rounded-lg" />
        <Skeleton className="w-2/3 h-8 rounded-lg" />
        <Skeleton className="w-1/2 h-5 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-5 space-y-3">
                <Skeleton className="w-32 h-5 rounded" />
                <Skeleton className="w-full h-20 rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-1">
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-5 space-y-3">
              <Skeleton className="w-32 h-6 rounded" />
              <Skeleton className="w-full h-10 rounded-lg" />
              <Skeleton className="w-full h-24 rounded-lg" />
              <Skeleton className="w-full h-10 rounded-lg" />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
