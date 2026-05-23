import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Progress,
  Skeleton,
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
  SquareAcademicCap,
  SquareAltArrowRight,
  Target,
} from "@solar-icons/react";

import { lessonHomeworkApi } from "../../../api";
import { useThemeColors } from "../../../hooks/useThemeColors";
import AIDetectionCard from "../../../components/HomeworkAI/AIDetectionCard";
import WritingAnalysisCard from "../../../components/HomeworkAI/WritingAnalysisCard";
import ReadingAnalysisCard from "../../../components/HomeworkAI/ReadingAnalysisCard";
import ListeningTranscriptCard from "../../../components/HomeworkAI/ListeningTranscriptCard";

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

const Breadcrumb = ({ hw, colors }) => {
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
        </span>
      ))}
    </div>
  );
};

const MetaItem = ({ icon: Icon, label, value, colors }) => (
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

const PersonRow = ({ avatar, name, label, href, colors, onNavigate }) => (
  <Card
    shadow="none"
    className="border-none"
    style={{ backgroundColor: colors.background.light }}
  >
    <CardBody className="p-4">
      <button
        type="button"
        onClick={() => href && onNavigate(href)}
        className="flex items-center gap-3 w-full text-left transition-opacity hover:opacity-80"
        disabled={!href}
      >
        <Avatar src={withCDN(avatar)} name={name} size="md" />
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] uppercase tracking-wide font-semibold"
            style={{ color: colors.text.tertiary }}
          >
            {label}
          </p>
          <p
            className="text-sm font-semibold truncate"
            style={{ color: colors.text.primary }}
          >
            {name || "—"}
          </p>
        </div>
        {href && (
          <SquareAltArrowRight
            weight="BoldDuotone"
            className="w-4 h-4 shrink-0"
            style={{ color: colors.primary.main }}
          />
        )}
      </button>
    </CardBody>
  </Card>
);

const FileCard = ({ title, url, accent, colors, emptyMsg }) => {
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
};

const MediaCard = ({ url, colors, t }) => {
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
          {t("adminDashboard.homeworkDetail.mediaSection")}
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
};

const ScoreBlock = ({ hw, colors, t }) => {
  const pct = hw.maxScore ? (hw.score / hw.maxScore) * 100 : 0;
  return (
    <Card
      shadow="none"
      className="border-none"
      style={{ backgroundColor: colors.background.light }}
    >
      <CardBody className="p-5 space-y-3">
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
              {t("adminDashboard.homeworkDetail.score")}
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
            {t("adminDashboard.homeworkDetail.tutorFeedback")}
          </p>
          <p
            className="text-sm whitespace-pre-wrap"
            style={{ color: colors.text.primary }}
          >
            {hw.tutorFeedback ||
              t("adminDashboard.homeworkDetail.noFeedback")}
          </p>
        </div>
      </CardBody>
    </Card>
  );
};

const DetailSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-8 w-32 rounded-lg" />
    <Skeleton className="h-24 w-full rounded-2xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  </div>
);

const AdminHomeworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const [hw, setHw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHw = useCallback(async () => {
    try {
      setError(null);
      const res = await lessonHomeworkApi.getHomeworkById(id);
      setHw(res?.data || res);
    } catch (err) {
      console.error("Failed to fetch homework:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHw();
  }, [fetchHw]);

  if (loading) return <DetailSkeleton />;

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
          {t("adminDashboard.homeworkDetail.notFound")}
        </p>
        <Button variant="light" onPress={() => navigate(-1)}>
          {t("adminDashboard.homeworkDetail.back")}
        </Button>
      </div>
    );
  }

  const isOverdue =
    hw.dueAt &&
    new Date(hw.dueAt).getTime() < Date.now() &&
    hw.status === "Assigned";

  const tutorName = hw.tutor
    ? `${hw.tutor.firstName || ""} ${hw.tutor.lastName || ""}`.trim()
    : null;
  const studentName = hw.student
    ? `${hw.student.firstName || ""} ${hw.student.lastName || ""}`.trim()
    : null;

  const statusInfo = {
    Scored: { bg: `${colors.state.success}20`, color: colors.state.success },
    Submitted: { bg: `${colors.primary.main}20`, color: colors.primary.main },
    Assigned: { bg: `${colors.state.warning}20`, color: colors.state.warning },
    NotStarted: {
      bg: `${colors.text.tertiary}20`,
      color: colors.text.tertiary,
    },
  };
  const statusChip = statusInfo[hw.status];

  const isWriting = hw.type === "Writing";
  const isReading = hw.type === "Reading";
  const isListening = hw.type === "Listening";
  const hasSubmission =
    hw.status === "Submitted" || hw.status === "Scored";

  return (
    <div className="space-y-5 pb-8">
      {/* ── Back + Header ── */}
      <Button
        variant="light"
        startContent={<AltArrowLeft weight="BoldDuotone" size={18} />}
        onPress={() => navigate(-1)}
        style={{ color: colors.text.secondary }}
        className="self-start"
      >
        {t("adminDashboard.homeworkDetail.back")}
      </Button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="min-w-0"
      >
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          {statusChip && (
            <Chip
              size="sm"
              style={{
                backgroundColor: statusChip.bg,
                color: statusChip.color,
              }}
            >
              {t(
                `adminDashboard.homeworkDetail.status.${hw.status}`,
                hw.status,
              )}
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
              {t("adminDashboard.homeworkDetail.overdue")}
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
              {t("adminDashboard.homeworkDetail.aiBadge")}
            </Chip>
          )}
        </div>
        <h1
          className="text-2xl lg:text-3xl font-bold"
          style={{ color: colors.text.primary }}
        >
          {hw.title}
        </h1>
        <Breadcrumb hw={hw} colors={colors} />
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
          {/* Tutor + Student rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tutorName && (
              <PersonRow
                avatar={hw.tutor?.avatar}
                name={tutorName}
                label={t("adminDashboard.homeworkDetail.tutor")}
                href={`/admin/users/${hw.tutorId}`}
                colors={colors}
                onNavigate={navigate}
              />
            )}
            {studentName && (
              <PersonRow
                avatar={hw.student?.avatar}
                name={studentName}
                label={t("adminDashboard.homeworkDetail.student")}
                href={`/admin/users/${hw.studentId}`}
                colors={colors}
                onNavigate={navigate}
              />
            )}
          </div>

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
                  {t("adminDashboard.homeworkDetail.description")}
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
                  label={t("adminDashboard.homeworkDetail.dueDate")}
                  value={
                    formatDateTime(hw.dueAt, locale) ||
                    t("adminDashboard.homeworkDetail.noDueDate")
                  }
                  colors={colors}
                />
                <MetaItem
                  icon={Target}
                  label={t("adminDashboard.homeworkDetail.maxScore")}
                  value={hw.maxScore ?? "—"}
                  colors={colors}
                />
                {hw.assignedAt && (
                  <MetaItem
                    icon={ClockCircle}
                    label={t("adminDashboard.homeworkDetail.assignedAt")}
                    value={formatDateTime(hw.assignedAt, locale)}
                    colors={colors}
                  />
                )}
                {hw.submittedAt && (
                  <MetaItem
                    icon={Plain}
                    label={t("adminDashboard.homeworkDetail.submittedAt")}
                    value={formatDateTime(hw.submittedAt, locale)}
                    colors={colors}
                  />
                )}
              </div>
            </CardBody>
          </Card>

          {/* Resource + Submission */}
          <FileCard
            title={t("adminDashboard.homeworkDetail.resourceFile")}
            url={hw.resourceUrl}
            accent={colors.primary.main}
            colors={colors}
            emptyMsg={t("adminDashboard.homeworkDetail.noResource")}
          />

          {isListening && hw.mediaUrl && (
            <MediaCard url={hw.mediaUrl} colors={colors} t={t} />
          )}

          <FileCard
            title={t("adminDashboard.homeworkDetail.submissionFile")}
            url={hw.submissionUrl}
            accent={colors.state.success}
            colors={colors}
            emptyMsg={t("adminDashboard.homeworkDetail.noSubmission")}
          />

          {/* AI cards — admin view: read-only, no triggers */}
          {isWriting && (
            <AIDetectionCard
              homeworkId={hw.id}
              score={hw.aiDetectionScore}
              canRun={false}
              onUpdated={fetchHw}
            />
          )}

          {isWriting && hasSubmission && (
            <WritingAnalysisCard
              homeworkId={hw.id}
              analysisRaw={hw.aiAnalysisData}
              canRun={false}
              hideTutorAdvice={false}
              onUpdated={fetchHw}
            />
          )}

          {isReading && hasSubmission && (
            <ReadingAnalysisCard
              homeworkId={hw.id}
              analysisRaw={hw.aiAnalysisData}
              canRun={false}
              onUpdated={fetchHw}
            />
          )}

          {isListening && hw.status === "Scored" && (
            <ListeningTranscriptCard
              mediaUrl={hw.mediaUrl}
              analysisRaw={hw.aiAnalysisData}
              enabled={false}
              onUpdated={fetchHw}
            />
          )}
        </motion.div>

        {/* RIGHT (1/3) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-5"
        >
          {/* Score block */}
          {hw.status === "Scored" && hw.score != null && (
            <ScoreBlock hw={hw} colors={colors} t={t} />
          )}

          {/* Status summary */}
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-5 space-y-3">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: colors.text.tertiary }}
              >
                {t("adminDashboard.homeworkDetail.statusSummary")}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("adminDashboard.homeworkDetail.status.label")}
                  </span>
                  {statusChip && (
                    <Chip
                      size="sm"
                      style={{
                        backgroundColor: statusChip.bg,
                        color: statusChip.color,
                      }}
                    >
                      {t(
                        `adminDashboard.homeworkDetail.status.${hw.status}`,
                        hw.status,
                      )}
                    </Chip>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("adminDashboard.homeworkDetail.type")}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {hw.type || "—"}
                  </span>
                </div>
                {hw.aiDetectionScore != null && (
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.homeworkDetail.aiDetection")}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {hw.aiDetectionScore.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Audit info */}
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-5 space-y-3">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: colors.text.tertiary }}
              >
                {t("adminDashboard.homeworkDetail.auditInfo")}
              </p>
              <div className="space-y-2.5">
                <div>
                  <p
                    className="text-[11px] uppercase tracking-wide font-semibold"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("adminDashboard.homeworkDetail.homeworkId")}
                  </p>
                  <p
                    className="text-xs font-mono break-all mt-0.5"
                    style={{ color: colors.text.primary }}
                  >
                    {hw.id}
                  </p>
                </div>
                {hw.lessonId && (
                  <div>
                    <p
                      className="text-[11px] uppercase tracking-wide font-semibold"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.homeworkDetail.lessonId")}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/lessons/${hw.lessonId}/report`)
                      }
                      className="text-xs font-mono break-all mt-0.5 hover:underline text-left"
                      style={{ color: colors.primary.main }}
                    >
                      {hw.lessonId}
                    </button>
                  </div>
                )}
                {hw.createdAt && (
                  <div>
                    <p
                      className="text-[11px] uppercase tracking-wide font-semibold"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.homeworkDetail.createdAt")}
                    </p>
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: colors.text.primary }}
                    >
                      {formatDateTime(hw.createdAt, locale)}
                    </p>
                  </div>
                )}
                {hw.updatedAt && (
                  <div>
                    <p
                      className="text-[11px] uppercase tracking-wide font-semibold"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.homeworkDetail.updatedAt")}
                    </p>
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: colors.text.primary }}
                    >
                      {formatDateTime(hw.updatedAt, locale)}
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminHomeworkDetail;
