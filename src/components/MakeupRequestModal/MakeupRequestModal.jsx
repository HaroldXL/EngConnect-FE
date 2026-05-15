import { useState } from "react";
import {
  CalendarMark,
  CircleBottomUp,
  ClockCircle,
  DangerTriangle,
} from "@solar-icons/react";
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
import { makeupApi } from "../../api";

export default function MakeupRequestModal({
  lesson,
  isOpen,
  onClose,
  onSuccess,
  createdByRole,
  makeupDeadline,
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const colors = useThemeColors();

  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const ns =
    createdByRole === "Student"
      ? "studentDashboard.schedule.makeup"
      : "tutorDashboard.schedule.makeup";

  const deadlinePassed = makeupDeadline !== null && makeupDeadline < new Date();

  const handleClose = () => {
    setNote("");
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await makeupApi.createRequest({
        lessonId: lesson.id,
        note: note.trim(),
        createdByRole,
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || err?.response?.data?.message;
      setError(msg || t(`${ns}.submitFailed`));
    } finally {
      setSubmitting(false);
    }
  };

  if (!lesson) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        <ModalHeader
          className="flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          <CircleBottomUp
            weight="BoldDuotone"
            className="w-5 h-5"
            style={{ color: colors.primary.main }}
          />
          {t(`${ns}.title`)}
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Lesson info */}
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: colors.background.gray }}
          >
            <p
              className="font-medium text-sm"
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
            </p>
          </div>

          {/* How it works hint */}
          <div
            className="flex items-start gap-2 p-3 rounded-xl"
            style={{
              backgroundColor: `${colors.primary.main}10`,
              border: `1px solid ${colors.primary.main}20`,
            }}
          >
            <CalendarMark
              weight="BoldDuotone"
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: colors.primary.main }}
            />
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              {t(`${ns}.hint`)}
            </p>
          </div>

          {/* Deadline */}
          {makeupDeadline && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{
                backgroundColor: `${deadlinePassed ? colors.state.error : colors.state.warning}12`,
                border: `1px solid ${deadlinePassed ? colors.state.error : colors.state.warning}30`,
              }}
            >
              {deadlinePassed ? (
                <DangerTriangle
                  weight="BoldDuotone"
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: colors.state.error }}
                />
              ) : (
                <ClockCircle
                  weight="BoldDuotone"
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: colors.state.warning }}
                />
              )}
              <span
                className="text-sm"
                style={{
                  color: deadlinePassed
                    ? colors.state.error
                    : colors.state.warning,
                }}
              >
                {deadlinePassed
                  ? t(`${ns}.deadlinePassed`)
                  : t(`${ns}.deadlineUntil`, {
                      date: makeupDeadline.toLocaleString(dateLocale, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    })}
              </span>
            </div>
          )}

          {/* Note */}
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t(`${ns}.notePlaceholder`)}
            className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
            style={{
              backgroundColor: colors.background.gray,
              color: colors.text.primary,
              border: `1px solid ${colors.border.medium}`,
            }}
          />
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
              <DangerTriangle
                weight="BoldDuotone"
                className="w-4 h-4 flex-shrink-0"
              />
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="light" onPress={handleClose}>
              {t(`${ns}.cancelAction`)}
            </Button>
            <Button
              isLoading={submitting}
              isDisabled={deadlinePassed}
              onPress={handleSubmit}
              style={{
                backgroundColor: deadlinePassed
                  ? colors.background.gray
                  : colors.primary.main,
                color: deadlinePassed
                  ? colors.text.tertiary
                  : colors.text.white,
              }}
            >
              {t(`${ns}.submitBtn`)}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
