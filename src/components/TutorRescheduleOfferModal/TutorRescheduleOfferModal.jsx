import { useState, useEffect, useMemo } from "react";
import { AddCircle, CalendarMark, CheckCircle, ClockCircle, CloseSquare, DangerTriangle, TrashBinMinimalistic } from "@solar-icons/react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@heroui/react";

import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import { rescheduleApi, overlapsApi } from "../../api";

const fmtDatetimeLocal = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const iv of sorted) {
    if (!merged.length || iv.start >= merged[merged.length - 1].end) {
      merged.push({ start: iv.start, end: iv.end });
    } else {
      merged[merged.length - 1].end = new Date(
        Math.max(merged[merged.length - 1].end, iv.end),
      );
    }
  }
  return merged;
}

function computeFreeGaps(overlaps, lowerBound, upperBound, durationMs) {
  const lb = new Date(lowerBound);
  const ub = new Date(upperBound);

  // Filter to only intervals overlapping [lb, ub], then clamp to that window
  const intervals = overlaps
    .map((o) => ({ start: new Date(o.startTime), end: new Date(o.endTime) }))
    .filter((iv) => iv.start < ub && iv.end > lb)
    .map((iv) => ({
      start: new Date(Math.max(iv.start, lb)),
      end: new Date(Math.min(iv.end, ub)),
    }));

  const merged = mergeIntervals(intervals);
  const gaps = [];
  let cursor = lb;

  for (const iv of merged) {
    if (cursor >= ub) break;
    if (iv.start > cursor) {
      const latestStart = new Date(iv.start.getTime() - durationMs);
      if (latestStart >= cursor) {
        gaps.push({ start: new Date(cursor), end: iv.start, latestStart });
      }
    }
    if (iv.end > cursor) cursor = iv.end;
  }
  if (cursor < ub) {
    const latestStart = new Date(ub.getTime() - durationMs);
    if (latestStart >= cursor) {
      gaps.push({ start: new Date(cursor), end: ub, latestStart });
    }
  }

  return gaps;
}

function groupGapsByDay(gaps, dateLocale) {
  const groups = [];
  const seen = new Map();
  for (const gap of gaps) {
    const label = gap.start.toLocaleDateString(dateLocale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!seen.has(label)) {
      seen.set(label, groups.length);
      groups.push({ label, gaps: [] });
    }
    groups[seen.get(label)].gaps.push(gap);
  }
  return groups;
}

export default function TutorRescheduleOfferModal({
  lesson,
  isOpen,
  onClose,
  onSuccess,
  tutorId,
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const colors = useThemeColors();

  const durationMs = lesson
    ? new Date(lesson.endTime) - new Date(lesson.startTime)
    : 0;
  const durationMin = Math.round(durationMs / 60000);

  const [overlapsData, setOverlapsData] = useState(null);
  const [loadingOverlaps, setLoadingOverlaps] = useState(false);
  const [tutorNote, setTutorNote] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [activeGapKey, setActiveGapKey] = useState(null);
  const [activeTime, setActiveTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !lesson) return;
    setLoadingOverlaps(true);
    overlapsApi
      .getTutorOfferOverlaps({ lessonId: lesson.id, tutorId })
      .then((res) => setOverlapsData(res.data))
      .catch(() => setOverlapsData(null))
      .finally(() => setLoadingOverlaps(false));
  }, [isOpen, lesson?.id, tutorId]);

  const freeGaps = useMemo(() => {
    if (!overlapsData) return [];
    return computeFreeGaps(
      overlapsData.overlaps,
      overlapsData.lowerBound,
      overlapsData.upperBound,
      durationMs,
    );
  }, [overlapsData, durationMs]);

  const dayGroups = useMemo(
    () => groupGapsByDay(freeGaps, dateLocale),
    [freeGaps, dateLocale],
  );

  const handleClose = () => {
    setTutorNote("");
    setSelectedOptions([]);
    setOverlapsData(null);
    setActiveGapKey(null);
    setActiveTime("");
    setError(null);
    onClose();
  };

  const openGapPicker = (gap) => {
    const key = gap.start.toISOString();
    setActiveGapKey(key);
    setActiveTime(fmtDatetimeLocal(gap.start));
  };

  const confirmGapTime = (gap) => {
    if (!activeTime) return;
    const start = new Date(activeTime);
    if (start < gap.start || start > gap.latestStart) {
      setError(t("tutorDashboard.schedule.reschedule.errorOutOfWindow"));
      return;
    }
    const startISO = start.toISOString();
    const isDuplicate = selectedOptions.some((o) => o.startISO === startISO);
    if (isDuplicate) {
      setError(t("tutorDashboard.schedule.reschedule.errorDuplicate"));
      return;
    }
    const end = new Date(start.getTime() + durationMs);
    setSelectedOptions([
      ...selectedOptions,
      { id: Date.now(), startISO, endISO: end.toISOString() },
    ]);
    setError(null);
    setActiveGapKey(null);
    setActiveTime("");
  };

  const handleSubmit = async () => {
    if (!tutorId || !lesson) return;
    setError(null);
    if (!tutorNote.trim()) {
      setError(t("tutorDashboard.schedule.reschedule.errorNote"));
      return;
    }
    if (selectedOptions.length === 0) {
      setError(t("tutorDashboard.schedule.reschedule.errorMin"));
      return;
    }
    setSubmitting(true);
    try {
      await rescheduleApi.createOffer({
        request: {
          lessonId: lesson.id,
          tutorId,
          tutorNote: tutorNote.trim(),
          options: selectedOptions.map((opt) => ({
            proposedStartTime: opt.startISO,
            proposedEndTime: opt.endISO,
          })),
        },
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || err?.response?.data?.message;
      setError(msg || t("tutorDashboard.schedule.reschedule.errorSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!lesson) return null;

  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  const fmtDateTime = (d) =>
    new Date(d).toLocaleString(dateLocale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      scrollBehavior="inside"
    >
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        <ModalHeader style={{ color: colors.text.primary }}>
          {t("tutorDashboard.schedule.reschedule.title")}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Lesson info */}
            <div
              className="p-3 rounded-xl flex items-start gap-3"
              style={{ backgroundColor: colors.background.gray }}
            >
              <CalendarMark
                weight="BoldDuotone"
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: colors.primary.main }}
              />
              <div className="min-w-0">
                <p
                  className="font-medium text-sm truncate"
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
                  {" · "}
                  {t("tutorDashboard.schedule.reschedule.duration", {
                    min: durationMin,
                  })}
                </p>
              </div>
            </div>

            {/* Note */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.schedule.reschedule.noteLabel")}
              </label>
              <textarea
                rows={3}
                value={tutorNote}
                onChange={(e) => setTutorNote(e.target.value)}
                placeholder={t(
                  "tutorDashboard.schedule.reschedule.notePlaceholder",
                )}
                className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
                style={{
                  backgroundColor: colors.background.gray,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border.medium}`,
                }}
              />
            </div>

            {/* Selected options */}
            <div>
              <p
                className="text-sm font-medium mb-2"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.schedule.reschedule.selectedTimes", {
                  count: selectedOptions.length,
                })}
              </p>
              {selectedOptions.length === 0 ? (
                <p
                  className="text-xs py-2"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("tutorDashboard.schedule.reschedule.noSelected")}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedOptions.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{
                        backgroundColor: `${colors.primary.main}10`,
                        border: `1px solid ${colors.primary.main}25`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-semibold w-4 text-center"
                          style={{ color: colors.primary.main }}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.primary }}
                        >
                          {fmtDateTime(opt.startISO)}
                          {" — "}
                          {fmtTime(opt.endISO)}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedOptions(
                            selectedOptions.filter((o) => o.id !== opt.id),
                          )
                        }
                        className="p-1 rounded hover:opacity-60 transition-opacity"
                      >
                        <TrashBinMinimalistic
                          weight="BoldDuotone"
                          className="w-3.5 h-3.5"
                          style={{ color: colors.state.error }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available windows */}
            <div>
              <p
                className="text-sm font-medium mb-2"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.schedule.reschedule.availableWindows")}
              </p>

              {loadingOverlaps ? (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl text-xs"
                  style={{
                    backgroundColor: colors.background.gray,
                    color: colors.text.secondary,
                  }}
                >
                  <Spinner size="sm" />
                  {t("tutorDashboard.schedule.reschedule.loadingSlots")}
                </div>
              ) : freeGaps.length === 0 ? (
                <div
                  className="p-3 rounded-xl text-xs"
                  style={{
                    backgroundColor: `${colors.state.error}10`,
                    color: colors.state.error,
                    border: `1px solid ${colors.state.error}25`,
                  }}
                >
                  {t("tutorDashboard.schedule.reschedule.noAvailableSlots")}
                </div>
              ) : (
                <div
                  className="space-y-3 max-h-60 overflow-y-auto pr-0.5"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {dayGroups.map((group) => (
                    <div key={group.label}>
                      <p
                        className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 sticky top-0 py-0.5"
                        style={{
                          color: colors.text.secondary,
                          backgroundColor: colors.background.light,
                        }}
                      >
                        {group.label}
                      </p>
                      <div className="space-y-1.5">
                        {group.gaps.map((gap) => {
                          const gapKey = gap.start.toISOString();
                          const isActive = activeGapKey === gapKey;
                          const gapMin = Math.round(
                            (gap.end - gap.start) / 60000,
                          );
                          const crossDay =
                            gap.start.toDateString() !== gap.end.toDateString();

                          return (
                            <div
                              key={gapKey}
                              className="rounded-xl transition-all"
                              style={{
                                backgroundColor: isActive
                                  ? `${colors.primary.main}08`
                                  : colors.background.gray,
                                border: `1px solid ${isActive ? colors.primary.main : colors.border.medium}`,
                              }}
                            >
                              {/* Gap header row */}
                              <div className="flex items-center justify-between px-3 py-2">
                                <span
                                  className="text-sm flex items-center gap-1.5"
                                  style={{ color: colors.text.primary }}
                                >
                                  <ClockCircle
                                    weight="BoldDuotone"
                                    className="w-3.5 h-3.5 flex-shrink-0"
                                    style={{ color: colors.primary.main }}
                                  />
                                  {crossDay
                                    ? `${fmtDateTime(gap.start)} – ${fmtDateTime(gap.end)}`
                                    : `${fmtTime(gap.start)} – ${fmtTime(gap.end)}`}
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: `${colors.state.success}15`,
                                      color: colors.state.success,
                                    }}
                                  >
                                    {t(
                                      "tutorDashboard.schedule.reschedule.freeWindow",
                                      { min: gapMin },
                                    )}
                                  </span>
                                </span>
                                {selectedOptions.length < 3 && !isActive && (
                                  <button
                                    onClick={() => openGapPicker(gap)}
                                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
                                    style={{
                                      color: colors.primary.main,
                                      backgroundColor: `${colors.primary.main}12`,
                                    }}
                                  >
                                    <AddCircle weight="BoldDuotone" className="w-3 h-3" />
                                    {t(
                                      "tutorDashboard.schedule.reschedule.pickTime",
                                    )}
                                  </button>
                                )}
                                {isActive && (
                                  <button
                                    onClick={() => setActiveGapKey(null)}
                                    className="p-1 rounded hover:opacity-60 transition-opacity"
                                    style={{ color: colors.text.tertiary }}
                                  >
                                    <CloseSquare weight="BoldDuotone" className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Inline time picker */}
                              {isActive && (
                                <div
                                  className="px-3 pb-3 flex items-center gap-2"
                                  style={{
                                    borderTop: `1px solid ${colors.border.light}`,
                                    paddingTop: "10px",
                                  }}
                                >
                                  <input
                                    type="datetime-local"
                                    value={activeTime}
                                    min={fmtDatetimeLocal(gap.start)}
                                    max={fmtDatetimeLocal(gap.latestStart)}
                                    onChange={(e) =>
                                      setActiveTime(e.target.value)
                                    }
                                    className="flex-1 h-9 px-2.5 rounded-lg text-sm outline-none"
                                    style={{
                                      backgroundColor: colors.background.light,
                                      color: colors.text.primary,
                                      border: `1px solid ${colors.border.medium}`,
                                      colorScheme: "auto",
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    isIconOnly
                                    onPress={() => confirmGapTime(gap)}
                                    style={{
                                      backgroundColor: colors.primary.main,
                                      color: colors.text.white,
                                      minWidth: "36px",
                                    }}
                                  >
                                    <CheckCircle
                                      weight="BoldDuotone"
                                      className="w-4 h-4"
                                    />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </ModalBody>
        <ModalFooter className="flex-col items-stretch gap-2">
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg text-sm w-full"
              style={{
                backgroundColor: `${colors.state.error}15`,
                color: colors.state.error,
                border: `1px solid ${colors.state.error}30`,
              }}
            >
              <DangerTriangle weight="BoldDuotone" className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="light" onPress={handleClose}>
              {t("tutorDashboard.schedule.cancel")}
            </Button>
            <Button
              isLoading={submitting}
              onPress={handleSubmit}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
            >
              {t("tutorDashboard.schedule.reschedule.submit")}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
