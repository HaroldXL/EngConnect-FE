import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Avatar,
  Progress,
} from "@heroui/react";
import { AltArrowRight, Calendar, ClockCircle, DocumentText, File, FileDownload, Gallery, Plain, SquareAcademicCap, SquareAltArrowRight, Target } from "@solar-icons/react"

import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

function Breadcrumb({ hw, onCourseClick, colors }) {
  const items = [hw.courseTitle, hw.moduleTitle, hw.sessionTitle].filter(
    Boolean,
  );
  if (items.length === 0) return null;
  return (
    <div
      className="flex items-center gap-1 flex-wrap text-xs"
      style={{ color: colors.text.tertiary }}
    >
      {items.map((item, idx) => (
        <span
          key={`${idx}-${item}`}
          className="flex items-center gap-1 min-w-0"
        >
          {idx > 0 && (
            <AltArrowRight weight="BoldDuotone" className="w-3 h-3 shrink-0 opacity-50" />
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

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * StudentHomeworkDetailModal
 *
 * Props:
 *  - isOpen         {boolean}
 *  - onClose        {() => void}
 *  - hw             {object | null}   — the homework record
 *  - onSubmitClick  {(hw) => void}    — called when "Submit" is pressed (Assigned status only)
 *  - onCourseClick  {(hw) => void}    — optional: breadcrumb course link handler
 *  - onTutorClick   {(hw) => void}    — optional: tutor row click handler
 */
export default function StudentHomeworkDetailModal({
  isOpen,
  onClose,
  hw,
  onSubmitClick,
  onCourseClick,
  onTutorClick,
}) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  if (!hw) return null;

  const statusChip = (() => {
    switch (hw.status) {
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
          label: hw.status,
        };
    }
  })();

  const due = computeDueInfo(hw.dueAt, t);
  const dueColor =
    due.tone === "danger"
      ? colors.state.error
      : due.tone === "warning"
        ? colors.state.warning
        : colors.text.tertiary;

  const tutorName = hw.tutor
    ? `${hw.tutor.firstName || ""} ${hw.tutor.lastName || ""}`.trim()
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        <ModalHeader className="flex flex-col gap-2">
          {/* Status chip + due date */}
          <div className="flex items-center gap-2 flex-wrap">
            <Chip
              size="sm"
              style={{
                backgroundColor: statusChip.bg,
                color: statusChip.color,
              }}
            >
              {statusChip.label}
            </Chip>
            {hw.dueAt && hw.status === "Assigned" && (
              <div
                className="flex items-center gap-1"
                style={{ color: dueColor }}
              >
                <ClockCircle weight="BoldDuotone" className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{due.label}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <span
            className="text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            {hw.title}
          </span>

          {/* Breadcrumb — only shown when onCourseClick is provided */}
          {onCourseClick && (
            <Breadcrumb
              hw={hw}
              onCourseClick={() => {
                onClose();
                onCourseClick(hw);
              }}
              colors={colors}
            />
          )}
        </ModalHeader>

        <ModalBody className="space-y-5 pb-2">
          {/* Tutor row */}
          {tutorName && (
            <button
              type="button"
              onClick={
                onTutorClick
                  ? () => {
                      onClose();
                      onTutorClick(hw);
                    }
                  : undefined
              }
              className={`flex items-center gap-3 p-3 rounded-xl w-full text-left transition-opacity ${onTutorClick ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
              style={{ backgroundColor: colors.background.gray }}
            >
              <Avatar src={withCDN(hw.tutor?.avatar)} size="md" />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[11px] uppercase tracking-wide font-semibold"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("studentDashboard.homework.yourTutor")}
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  {tutorName}
                </p>
              </div>
              {onTutorClick && (
                <SquareAltArrowRight weight="BoldDuotone"
                  className="w-4 h-4 shrink-0"
                  style={{ color: colors.primary.main }}
                />
              )}
            </button>
          )}

          {/* Description */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: colors.text.tertiary }}
            >
              {t("studentDashboard.homework.description")}
            </p>
            <p
              className="text-sm whitespace-pre-wrap"
              style={{ color: colors.text.primary }}
            >
              {hw.description}
            </p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.background.gray }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar weight="BoldDuotone"
                  className="w-3.5 h-3.5"
                  style={{ color: colors.text.tertiary }}
                />
                <p
                  className="text-[11px] uppercase tracking-wide font-semibold"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("studentDashboard.homework.dueDate")}
                </p>
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                {formatDateTime(hw.dueAt, locale) ||
                  t("studentDashboard.homework.noDueDate")}
              </p>
            </div>
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.background.gray }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Target weight="BoldDuotone"
                  className="w-3.5 h-3.5"
                  style={{ color: colors.text.tertiary }}
                />
                <p
                  className="text-[11px] uppercase tracking-wide font-semibold"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("studentDashboard.homework.maxScore")}
                </p>
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                {hw.maxScore ?? "—"}
              </p>
            </div>
            {hw.assignedAt && (
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: colors.background.gray }}
              >
                <p
                  className="text-[11px] uppercase tracking-wide font-semibold mb-1"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("studentDashboard.homework.assignedAt")}
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.text.primary }}
                >
                  {formatDateTime(hw.assignedAt, locale)}
                </p>
              </div>
            )}
            {hw.submittedAt && (
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: colors.background.gray }}
              >
                <p
                  className="text-[11px] uppercase tracking-wide font-semibold mb-1"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("studentDashboard.homework.submittedAt")}
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.text.primary }}
                >
                  {formatDateTime(hw.submittedAt, locale)}
                </p>
              </div>
            )}
          </div>

          {/* Resource */}
          {hw.resourceUrl && (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: colors.text.tertiary }}
              >
                {t("studentDashboard.homework.resource")}
              </p>
              <a
                href={withCDN(hw.resourceUrl)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-opacity"
                style={{ backgroundColor: `${colors.primary.main}12` }}
              >
                {getFileTypeIcon(hw.resourceUrl, "w-9 h-9 shrink-0", {
                  color: colors.primary.main,
                })}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: colors.primary.main }}
                  >
                    {getFileBaseName(hw.resourceUrl) ||
                      t("studentDashboard.homework.downloadResource")}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("studentDashboard.homework.downloadResource")}
                  </p>
                </div>
                <SquareAltArrowRight weight="BoldDuotone"
                  className="w-4 h-4 shrink-0"
                  style={{ color: colors.primary.main }}
                />
              </a>
            </div>
          )}

          {/* Submission */}
          {hw.submissionUrl && (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: colors.text.tertiary }}
              >
                {t("studentDashboard.homework.mySubmission")}
              </p>
              {IMAGE_EXT_RE.test(getFileBaseName(hw.submissionUrl)) ? (
                <a
                  href={withCDN(hw.submissionUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <img
                    src={withCDN(hw.submissionUrl)}
                    alt="Submission"
                    className="w-full max-h-80 object-contain"
                  />
                  <div className="p-3 flex items-center justify-between">
                    <span
                      className="text-xs truncate"
                      style={{ color: colors.text.secondary }}
                    >
                      {getFileBaseName(hw.submissionUrl)}
                    </span>
                    <FileDownload weight="BoldDuotone"
                      className="w-4 h-4 shrink-0"
                      style={{ color: colors.primary.main }}
                    />
                  </div>
                </a>
              ) : (
                <a
                  href={withCDN(hw.submissionUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: `${colors.state.success}12` }}
                >
                  {getFileTypeIcon(hw.submissionUrl, "w-9 h-9 shrink-0", {
                    color: colors.state.success,
                  })}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: colors.state.success }}
                    >
                      {getFileBaseName(hw.submissionUrl)}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("studentDashboard.homework.viewSubmission")}
                    </p>
                  </div>
                  <SquareAltArrowRight weight="BoldDuotone"
                    className="w-4 h-4 shrink-0"
                    style={{ color: colors.state.success }}
                  />
                </a>
              )}
            </div>
          )}

          {/* Score + Feedback */}
          {hw.status === "Scored" && (
            <div
              className="p-5 rounded-xl space-y-4"
              style={{
                backgroundColor: `${colors.state.success}10`,
                border: `1px solid ${colors.state.success}30`,
              }}
            >
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
                  <div>
                    <p
                      className="text-xs uppercase tracking-wide font-semibold"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("studentDashboard.homework.score")}
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {t("studentDashboard.homework.scoreProgress", {
                        score: hw.score,
                        max: hw.maxScore,
                      })}
                    </p>
                  </div>
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
              <Progress
                aria-label="Score progress"
                value={hw.maxScore ? (hw.score / hw.maxScore) * 100 : 0}
                size="md"
                color="success"
              />
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("studentDashboard.homework.tutorFeedback")}
                </p>
                <p
                  className="text-sm whitespace-pre-wrap"
                  style={{ color: colors.text.primary }}
                >
                  {hw.tutorFeedback ||
                    t("studentDashboard.homework.noFeedback")}
                </p>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {t("studentDashboard.homework.close")}
          </Button>
          {hw.status === "Assigned" && onSubmitClick && (
            <Button
              startContent={
                <Plain weight="BoldDuotone" className="w-4 h-4" />
              }
              onPress={() => {
                onClose();
                onSubmitClick(hw);
              }}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
            >
              {t("studentDashboard.homework.submit")}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
