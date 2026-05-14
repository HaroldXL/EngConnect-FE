import { useState, useEffect, useCallback } from "react";
import { ClockCircle, DangerTriangle, Restart } from "@solar-icons/react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@heroui/react";

import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import { overlapsApi, rescheduleApi } from "../../api";

function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [{ start: new Date(sorted[0].start), end: new Date(sorted[0].end) }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end) {
      last.end = new Date(Math.max(last.end.getTime(), sorted[i].end.getTime()));
    } else {
      merged.push({ start: new Date(sorted[i].start), end: new Date(sorted[i].end) });
    }
  }
  return merged;
}

function computeFreeGaps(overlapsData, durationMs) {
  if (!overlapsData) return [];
  const lb = new Date(overlapsData.lowerBound);
  const ub = new Date(overlapsData.upperBound);
  const intervals = (overlapsData.overlaps || [])
    .map((o) => ({ start: new Date(o.startTime), end: new Date(o.endTime) }))
    .filter((iv) => iv.start < ub && iv.end > lb)
    .map((iv) => ({
      start: new Date(Math.max(iv.start.getTime(), lb.getTime())),
      end: new Date(Math.min(iv.end.getTime(), ub.getTime())),
    }));
  const merged = mergeIntervals(intervals);
  const gaps = [];
  let cursor = new Date(lb);
  for (const block of merged) {
    if (cursor >= ub) break;
    if (block.start > cursor) {
      const gapEnd = new Date(Math.min(block.start.getTime(), ub.getTime()));
      if (gapEnd.getTime() - cursor.getTime() >= durationMs) {
        gaps.push({ start: new Date(cursor), end: gapEnd });
      }
    }
    if (block.end > cursor) cursor = new Date(block.end);
  }
  if (cursor < ub && ub.getTime() - cursor.getTime() >= durationMs) {
    gaps.push({ start: new Date(cursor), end: new Date(ub) });
  }
  return gaps;
}

const toLocalISO = (date) => {
  const off = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - off).toISOString().slice(0, 16);
};

export default function StudentRescheduleRequestModal({
  lesson,
  isOpen,
  onClose,
  onSuccess,
  studentId,
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const colors = useThemeColors();

  const [overlapsData, setOverlapsData] = useState(null);
  const [loadingOverlaps, setLoadingOverlaps] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);
  const [activeGap, setActiveGap] = useState(null);
  const [pickedTime, setPickedTime] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const durationMs = lesson
    ? new Date(lesson.endTime).getTime() - new Date(lesson.startTime).getTime()
    : 0;

  const freeGaps = overlapsData ? computeFreeGaps(overlapsData, durationMs) : [];

  const fetchData = useCallback(async () => {
    if (!lesson || !studentId) return;
    setLoadingOverlaps(true);
    try {
      const [overlapsRes, requestsRes] = await Promise.all([
        overlapsApi.getLessonOverlaps({ lessonId: lesson.id, studentId }),
        rescheduleApi.getRequests({
          LessonId: lesson.id,
          StudentId: studentId,
          "page-size": 50,
        }),
      ]);
      setOverlapsData(overlapsRes?.data || null);
      const items = (requestsRes?.data?.items || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setExistingRequests(items);
    } catch {
      // silently ignore
    } finally {
      setLoadingOverlaps(false);
    }
  }, [lesson?.id, studentId]);

  useEffect(() => {
    if (isOpen) {
      setActiveGap(null);
      setPickedTime("");
      setNote("");
      setError(null);
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleClose = () => {
    setActiveGap(null);
    setPickedTime("");
    setNote("");
    setError(null);
    onClose();
  };

  const handleSelectGap = (gap) => {
    const isSame = activeGap?.start.getTime() === gap.start.getTime();
    if (isSame) {
      setActiveGap(null);
      setPickedTime("");
    } else {
      setActiveGap(gap);
      setPickedTime("");
    }
    setError(null);
  };

  const minTime = activeGap ? toLocalISO(activeGap.start) : "";
  const maxTime = activeGap
    ? toLocalISO(new Date(activeGap.end.getTime() - durationMs))
    : "";

  const handleSubmit = async () => {
    if (!pickedTime) {
      setError(t("studentDashboard.schedule.reschedule.requestErrorNoTime"));
      return;
    }
    const proposedStart = new Date(pickedTime);
    const proposedEnd = new Date(proposedStart.getTime() + durationMs);
    setError(null);
    setSubmitting(true);
    try {
      await rescheduleApi.createRequest({
        request: {
          lessonId: lesson.id,
          studentId,
          proposedStartTime: proposedStart.toISOString(),
          proposedEndTime: proposedEnd.toISOString(),
          tutorNote: note.trim(),
        },
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || err?.response?.data?.message;
      setError(msg || t("studentDashboard.schedule.reschedule.requestError"));
    } finally {
      setSubmitting(false);
    }
  };

  const hasPending = existingRequests.some((r) => r.status === "Pending");

  if (!lesson) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" scrollBehavior="inside">
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        <ModalHeader
          className="flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          <Restart
            weight="BoldDuotone"
            className="w-5 h-5"
            style={{ color: colors.primary.main }}
          />
          {t("studentDashboard.schedule.reschedule.requestTitle")}
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Lesson info */}
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.background.gray }}
            >
              <p className="font-medium text-sm" style={{ color: colors.text.primary }}>
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
                {Math.round(durationMs / 60000)}min
              </p>
            </div>

            {/* Existing requests history */}
            {existingRequests.length > 0 && (
              <div>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: colors.text.secondary }}
                >
                  {t("studentDashboard.schedule.reschedule.requestHistory")}
                </p>
                <div className="space-y-2">
                  {existingRequests.slice(0, 3).map((req) => {
                    const statusColor =
                      req.status === "Approved"
                        ? colors.state.success
                        : req.status === "Rejected"
                        ? colors.state.error
                        : colors.state.warning;
                    return (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-lg flex items-start justify-between gap-2"
                        style={{
                          backgroundColor: `${statusColor}0d`,
                          border: `1px solid ${statusColor}25`,
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-xs" style={{ color: colors.text.primary }}>
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
                            {new Date(req.proposedEndTime).toLocaleTimeString(
                              dateLocale,
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                          {req.tutorNote && (
                            <p
                              className="text-[11px] mt-0.5 italic truncate"
                              style={{ color: colors.text.secondary }}
                            >
                              "{req.tutorNote}"
                            </p>
                          )}
                        </div>
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
                            `studentDashboard.schedule.reschedule.requestStatus${req.status}`,
                          )}
                        </Chip>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DangerTriangle if already has pending */}
            {hasPending && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg text-xs"
                style={{
                  backgroundColor: `${colors.state.warning}12`,
                  color: colors.state.warning,
                  border: `1px solid ${colors.state.warning}30`,
                }}
              >
                <DangerTriangle weight="BoldDuotone" className="w-4 h-4 flex-shrink-0" />
                {t("studentDashboard.schedule.reschedule.requestHasPending")}
              </div>
            )}

            {/* Note field */}
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("studentDashboard.schedule.reschedule.requestNote")}
              className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
              style={{
                backgroundColor: colors.background.gray,
                color: colors.text.primary,
                border: `1px solid ${colors.border.medium}`,
              }}
            />

            {/* Available time gaps */}
            {loadingOverlaps ? (
              <p
                className="text-sm text-center py-4"
                style={{ color: colors.text.tertiary }}
              >
                {t("studentDashboard.schedule.reschedule.requestLoadingSlots")}
              </p>
            ) : freeGaps.length === 0 ? (
              <p
                className="text-sm text-center py-4"
                style={{ color: colors.text.tertiary }}
              >
                {t("studentDashboard.schedule.reschedule.requestNoSlots")}
              </p>
            ) : (
              <div>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: colors.text.secondary }}
                >
                  {t("studentDashboard.schedule.reschedule.requestAvailableSlots")}
                </p>
                <div className="space-y-1.5">
                  {freeGaps.map((gap, gi) => {
                    const isActive =
                      activeGap?.start.getTime() === gap.start.getTime();
                    const crossDay = gap.start.toDateString() !== gap.end.toDateString();
                    return (
                      <div key={gi}>
                        <button
                          className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all"
                          style={{
                            backgroundColor: isActive
                              ? `${colors.primary.main}15`
                              : colors.background.gray,
                            border: `2px solid ${isActive ? colors.primary.main : colors.border.medium}`,
                            color: isActive
                              ? colors.primary.main
                              : colors.text.secondary,
                          }}
                          onClick={() => handleSelectGap(gap)}
                        >
                          {crossDay ? (
                            <span className="flex items-center gap-1.5">
                              <span className="font-medium">
                                {gap.start.toLocaleDateString(dateLocale, { weekday: "short", month: "short", day: "numeric" })}
                                {" · "}
                                {gap.start.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span className="opacity-50">→</span>
                              <span className="font-medium">
                                {gap.end.toLocaleDateString(dateLocale, { weekday: "short", month: "short", day: "numeric" })}
                                {" · "}
                                {gap.end.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </span>
                          ) : (
                            <span className="font-medium">
                              {gap.start.toLocaleDateString(dateLocale, { weekday: "short", month: "short", day: "numeric" })}
                              {" · "}
                              {gap.start.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                              {" – "}
                              {gap.end.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </button>

                              {isActive && (
                                <div
                                  className="mt-1.5 px-3 py-2.5 rounded-xl space-y-1.5"
                                  style={{
                                    backgroundColor: `${colors.primary.main}08`,
                                    border: `1px solid ${colors.primary.main}20`,
                                  }}
                                >
                                  <input
                                    type="datetime-local"
                                    value={pickedTime}
                                    min={minTime}
                                    max={maxTime}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (v && minTime && maxTime && (v < minTime || v > maxTime)) return;
                                      setPickedTime(v);
                                      setError(null);
                                    }}
                                    className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
                                    style={{
                                      backgroundColor: colors.background.light,
                                      color: colors.text.primary,
                                      border: `1px solid ${colors.border.medium}`,
                                      colorScheme: "auto",
                                    }}
                                  />
                                  {pickedTime && (
                                    <p
                                      className="text-[11px]"
                                      style={{ color: colors.text.tertiary }}
                                    >
                                      →{" "}
                                      {new Date(pickedTime).toLocaleString(
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
                                        new Date(pickedTime).getTime() + durationMs,
                                      ).toLocaleTimeString(dateLocale, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                      })}
                </div>
              </div>
            )}

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
              {t("studentDashboard.schedule.reschedule.close")}
            </Button>
            <Button
              isLoading={submitting}
              isDisabled={!pickedTime}
              onPress={handleSubmit}
              style={{
                backgroundColor: !pickedTime
                  ? colors.background.gray
                  : colors.primary.main,
                color: !pickedTime ? colors.text.tertiary : colors.text.white,
              }}
            >
              {t("studentDashboard.schedule.reschedule.requestSend")}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
