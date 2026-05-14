import { useState } from "react";
import { CalendarMark, ClockCircle, DangerTriangle, Ticket } from "@solar-icons/react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import { supportApi } from "../../api";

export default function TutorRescheduleTicketModal({
  lesson,
  isOpen,
  onClose,
  onSuccess,
  userId,
  rescheduleDeadline,
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const colors = useThemeColors();

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setReason("");
    setError(null);
    onClose();
  };

  if (!lesson) return null;

  const lessonTitle = lesson.courseTitle || lesson.sessionTitle || "Lesson";
  const lessonStart = new Date(lesson.startTime).toLocaleString(dateLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const lessonEnd = new Date(lesson.endTime).toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const lessonDate = `${lessonStart} – ${lessonEnd}`;
  const durationMin = Math.round(
    (new Date(lesson.endTime) - new Date(lesson.startTime)) / 60000,
  );

  const autoSubject = `${t("tutorDashboard.schedule.reschedule.ticketSubjectPrefix")}: ${lessonTitle} (${lessonDate})`;

  const buildDescription = () => {
    const lines = [
      `${t("tutorDashboard.schedule.reschedule.ticketFieldLesson")}: ${lessonTitle}`,
      `${t("tutorDashboard.schedule.reschedule.ticketFieldDate")}: ${lessonDate}`,
      `${t("tutorDashboard.schedule.reschedule.ticketFieldDuration")}: ${durationMin} min`,
      `${t("tutorDashboard.schedule.reschedule.ticketFieldLessonId")}: ${lesson.id}`,
    ];
    if (rescheduleDeadline) {
      lines.push(
        `${t("tutorDashboard.schedule.reschedule.ticketFieldDeadline")}: ${rescheduleDeadline.toLocaleString(dateLocale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      );
    }
    if (reason.trim()) {
      lines.push("");
      lines.push(
        `${t("tutorDashboard.schedule.reschedule.ticketFieldReason")}: ${reason.trim()}`,
      );
    }
    return lines.join("\n");
  };

  const handleSubmit = async () => {
    if (!userId || !lesson) return;
    setError(null);
    setSubmitting(true);
    try {
      await supportApi.createTicket({
        createdBy: userId,
        subject: autoSubject,
        description: buildDescription(),
        type: "Reschedule",
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || err?.response?.data?.message;
      setError(msg || t("tutorDashboard.schedule.reschedule.ticketError"));
    } finally {
      setSubmitting(false);
    }
  };

  const deadlinePast = rescheduleDeadline && rescheduleDeadline < new Date();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" scrollBehavior="inside">
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        <ModalHeader
          className="flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          <Ticket
            weight="BoldDuotone"
            className="w-5 h-5"
            style={{ color: colors.primary.main }}
          />
          {t("tutorDashboard.schedule.reschedule.ticketTitle")}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Lesson info */}
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.background.gray }}
            >
              <p
                className="font-medium text-sm"
                style={{ color: colors.text.primary }}
              >
                {lessonTitle}
              </p>
              <p
                className="text-xs mt-0.5 flex items-center gap-1"
                style={{ color: colors.text.secondary }}
              >
                <ClockCircle weight="BoldDuotone" className="w-3 h-3" />
                {lessonDate}
                {" · "}
                {durationMin}m
              </p>
            </div>

            {/* Deadline */}
            {rescheduleDeadline && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: `${deadlinePast ? colors.state.error : colors.state.warning}12`,
                  border: `1px solid ${deadlinePast ? colors.state.error : colors.state.warning}30`,
                  color: deadlinePast ? colors.state.error : colors.state.warning,
                }}
              >
                <ClockCircle weight="BoldDuotone" className="w-4 h-4 flex-shrink-0" />
                {deadlinePast
                  ? t("tutorDashboard.schedule.reschedule.deadlinePassed")
                  : t("tutorDashboard.schedule.reschedule.deadlineUntil", {
                      date: rescheduleDeadline.toLocaleString(dateLocale, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    })}
              </div>
            )}

            {/* Hint */}
            <p className="text-xs" style={{ color: colors.text.tertiary }}>
              {t("tutorDashboard.schedule.reschedule.ticketHint")}
            </p>

            {/* Auto-filled subject preview */}
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: colors.text.secondary }}
              >
                {t("tutorDashboard.schedule.reschedule.ticketSubjectLabel")}
              </p>
              <div
                className="px-3 py-2 rounded-xl text-sm"
                style={{
                  backgroundColor: colors.background.gray,
                  color: colors.text.secondary,
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                {autoSubject}
              </div>
            </div>

            {/* Reason textarea */}
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: colors.text.secondary }}
              >
                {t("tutorDashboard.schedule.reschedule.ticketReasonLabel")}
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t(
                  "tutorDashboard.schedule.reschedule.ticketReasonPlaceholder",
                )}
                className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
                style={{
                  backgroundColor: colors.background.gray,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border.medium}`,
                }}
              />
            </div>

            {/* Description preview */}
            <div>
              <p
                className="text-xs font-medium mb-1 flex items-center gap-1"
                style={{ color: colors.text.secondary }}
              >
                <CalendarMark weight="BoldDuotone" className="w-3.5 h-3.5" />
                {t("tutorDashboard.schedule.reschedule.ticketPreviewLabel")}
              </p>
              <pre
                className="px-3 py-2 rounded-xl text-xs whitespace-pre-wrap font-sans"
                style={{
                  backgroundColor: colors.background.gray,
                  color: colors.text.tertiary,
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                {buildDescription()}
              </pre>
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
              isDisabled={deadlinePast}
              style={{
                backgroundColor: deadlinePast
                  ? colors.background.gray
                  : colors.primary.main,
                color: deadlinePast ? colors.text.tertiary : colors.text.white,
              }}
            >
              {t("tutorDashboard.schedule.reschedule.ticketSend")}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
