import { useState } from "react";
import { AltArrowRight, CalendarMark, CheckCircle, ClockCircle, CloseCircle, DangerTriangle, Eye, InfoCircle, UserRounded } from "@solar-icons/react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@heroui/react";

import { Avatar } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import { rescheduleApi } from "../../api";

export default function StudentRescheduleAcceptModal({
  offer,
  lesson,
  isOpen,
  onClose,
  onSuccess,
  onViewLesson,
  studentId,
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const colors = useThemeColors();

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("view"); // view | confirmAccept | confirmReject

  const handleClose = () => {
    setSelectedOptionId(null);
    setError(null);
    setMode("view");
    onClose();
  };

  const handleReject = async () => {
    setRejecting(true);
    setError(null);
    try {
      await rescheduleApi.selectOption(offer.id, {
        request: {
          offerId: offer.id,
          optionId: null,
          studentId,
        },
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || err?.response?.data?.message;
      setError(msg || t("studentDashboard.schedule.reschedule.errorReject"));
    } finally {
      setRejecting(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedOptionId) {
      setError(t("studentDashboard.schedule.reschedule.errorSelect"));
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      await rescheduleApi.selectOption(offer.id, {
        request: {
          offerId: offer.id,
          optionId: selectedOptionId,
          studentId,
        },
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || err?.response?.data?.message;
      setError(msg || t("studentDashboard.schedule.reschedule.errorConfirm"));
    } finally {
      setConfirming(false);
    }
  };

  if (!offer || !lesson) return null;

  const isPending = offer.status === "PendingStudentChoice";
  const sortedOptions = [...(offer.options || [])].sort(
    (a, b) => a.optionOrder - b.optionOrder,
  );
  const selectedOption = sortedOptions.find((o) => o.id === selectedOptionId);

  const formatDateTime = (date) =>
    new Date(date).toLocaleString(dateLocale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" scrollBehavior="inside">
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        <ModalHeader
          className="flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          <CalendarMark
            weight="BoldDuotone"
            className="w-5 h-5"
            style={{ color: colors.primary.main }}
          />
          {t("studentDashboard.schedule.reschedule.title")}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Original lesson info */}
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.background.gray }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: colors.text.tertiary }}
              >
                {t("studentDashboard.schedule.reschedule.originalLesson")}
              </p>
              <p
                className="font-medium text-sm"
                style={{ color: colors.text.primary }}
              >
                {lesson.courseTitle || lesson.sessionTitle}
              </p>
              {(lesson.tutorFirstName || lesson.tutorLastName) && (
                <p
                  className="text-xs mt-1 flex items-center gap-1.5"
                  style={{ color: colors.text.secondary }}
                >
                  <Avatar
                    src={lesson.tutorAvatar}
                    name={[lesson.tutorFirstName, lesson.tutorLastName]
                      .filter(Boolean)
                      .join(" ")}
                    size="sm"
                    className="w-4 h-4 text-[8px] flex-shrink-0"
                  />
                  {[lesson.tutorFirstName, lesson.tutorLastName]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              )}
              <div className="flex items-center justify-between mt-1 gap-2">
                <p
                  className="text-xs flex items-center gap-1"
                  style={{ color: colors.text.secondary }}
                >
                  <ClockCircle weight="BoldDuotone" className="w-3 h-3" />
                  {formatDateTime(lesson.startTime)}
                  {lesson.endTime && (
                    <> — {formatTime(lesson.endTime)}</>
                  )}
                </p>
                {onViewLesson && (
                  <Button
                    size="sm"
                    variant="light"
                    className="h-6 px-2 text-xs flex-shrink-0"
                    startContent={<Eye weight="BoldDuotone" className="w-3 h-3" />}
                    onPress={onViewLesson}
                  >
                    {t("studentDashboard.schedule.viewDetail")}
                  </Button>
                )}
              </div>
            </div>

            {/* Tutor note */}
            {offer.tutorNote && mode === "view" && (
              <div
                className="p-3 rounded-xl"
                style={{
                  backgroundColor: `${colors.primary.main}10`,
                  border: `1px solid ${colors.primary.main}20`,
                }}
              >
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: colors.primary.main }}
                >
                  {t("studentDashboard.schedule.reschedule.noteFrom")}
                </p>
                <p className="text-sm" style={{ color: colors.text.primary }}>
                  {offer.tutorNote}
                </p>
              </div>
            )}

            {/* === VIEW MODE: Options list === */}
            {mode === "view" && (
              <>
                <div>
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {isPending
                      ? t("studentDashboard.schedule.reschedule.chooseOption")
                      : t("studentDashboard.schedule.reschedule.chosenOption")}
                  </p>
                  <div className="space-y-2">
                    {sortedOptions.map((option, idx) => {
                      const start = new Date(option.proposedStartTime);
                      const end = new Date(option.proposedEndTime);
                      const isSelected = selectedOptionId === option.id;
                      const isChosen = offer.selectedOptionId === option.id;
                      const highlight = isPending ? isSelected : isChosen;

                      return (
                        <div
                          key={option.id}
                          onClick={() =>
                            isPending && setSelectedOptionId(option.id)
                          }
                          className="p-3 rounded-xl transition-all"
                          style={{
                            backgroundColor: highlight
                              ? `${colors.primary.main}15`
                              : colors.background.gray,
                            border: `2px solid ${highlight ? colors.primary.main : colors.border.medium}`,
                            cursor: isPending ? "pointer" : "default",
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                style={{
                                  borderColor: highlight
                                    ? colors.primary.main
                                    : colors.border.medium,
                                  backgroundColor: highlight
                                    ? colors.primary.main
                                    : "transparent",
                                }}
                              >
                                {highlight && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <div>
                                <p
                                  className="text-[11px] font-medium"
                                  style={{ color: colors.text.secondary }}
                                >
                                  {t(
                                    "studentDashboard.schedule.reschedule.optionN",
                                    { n: idx + 1 },
                                  )}
                                </p>
                                <p
                                  className="text-sm font-semibold"
                                  style={{ color: colors.text.primary }}
                                >
                                  {start.toLocaleDateString(dateLocale, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p
                                className="text-sm font-medium"
                                style={{ color: colors.text.primary }}
                              >
                                {formatTime(start)} — {formatTime(end)}
                              </p>
                              {!isPending && isChosen && (
                                <Chip
                                  size="sm"
                                  className="mt-0.5"
                                  style={{
                                    backgroundColor: `${colors.state.success}20`,
                                    color: colors.state.success,
                                    fontSize: "10px",
                                  }}
                                >
                                  {t(
                                    "studentDashboard.schedule.reschedule.chosen",
                                  )}
                                </Chip>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* What happens next hint */}
                {isPending && (
                  <div
                    className="p-3 rounded-xl flex gap-2"
                    style={{
                      backgroundColor: `${colors.primary.main}08`,
                      border: `1px solid ${colors.primary.main}20`,
                    }}
                  >
                    <InfoCircle
                      weight="BoldDuotone"
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{ color: colors.primary.main }}
                    />
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("studentDashboard.schedule.reschedule.whatHappensHint")}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* === CONFIRM ACCEPT MODE === */}
            {mode === "confirmAccept" && selectedOption && (
              <div
                className="p-4 rounded-xl space-y-3"
                style={{
                  backgroundColor: `${colors.state.success}0a`,
                  border: `1px solid ${colors.state.success}30`,
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.state.success }}
                  />
                  <p
                    className="text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {t("studentDashboard.schedule.reschedule.confirmAcceptTitle")}
                  </p>
                </div>

                {/* Time change visualization */}
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 p-2.5 rounded-lg"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-[10px] font-medium uppercase mb-0.5"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("studentDashboard.schedule.reschedule.from")}
                    </p>
                    <p
                      className="text-xs font-medium line-through"
                      style={{ color: colors.text.secondary }}
                    >
                      {formatDateTime(lesson.startTime)}
                    </p>
                  </div>
                  <AltArrowRight
                    weight="BoldDuotone"
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: colors.state.success }}
                  />
                  <div
                    className="flex-1 p-2.5 rounded-lg"
                    style={{
                      backgroundColor: `${colors.state.success}15`,
                      border: `1px solid ${colors.state.success}40`,
                    }}
                  >
                    <p
                      className="text-[10px] font-medium uppercase mb-0.5"
                      style={{ color: colors.state.success }}
                    >
                      {t("studentDashboard.schedule.reschedule.to")}
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {formatDateTime(selectedOption.proposedStartTime)}
                    </p>
                  </div>
                </div>

                <p
                  className="text-xs leading-relaxed"
                  style={{ color: colors.text.secondary }}
                >
                  {t("studentDashboard.schedule.reschedule.confirmAcceptHint")}
                </p>
              </div>
            )}

            {/* === CONFIRM REJECT MODE === */}
            {mode === "confirmReject" && (
              <div
                className="p-4 rounded-xl space-y-3"
                style={{
                  backgroundColor: `${colors.state.error}0a`,
                  border: `1px solid ${colors.state.error}30`,
                }}
              >
                <div className="flex items-center gap-2">
                  <CloseCircle
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.state.error }}
                  />
                  <p
                    className="text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {t("studentDashboard.schedule.reschedule.confirmRejectTitle")}
                  </p>
                </div>

                <p
                  className="text-xs leading-relaxed"
                  style={{ color: colors.text.secondary }}
                >
                  {t("studentDashboard.schedule.reschedule.confirmRejectHint")}
                </p>

                <div
                  className="p-2.5 rounded-lg flex items-center gap-2"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <ClockCircle
                    weight="BoldDuotone"
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: colors.text.tertiary }}
                  />
                  <p
                    className="text-xs"
                    style={{ color: colors.text.primary }}
                  >
                    <span style={{ color: colors.text.tertiary }}>
                      {t("studentDashboard.schedule.reschedule.staysAt")}{" "}
                    </span>
                    <span className="font-semibold">
                      {formatDateTime(lesson.startTime)}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg text-sm"
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
          </div>
        </ModalBody>
        <ModalFooter>
          {mode === "view" && (
            <>
              <Button variant="light" onPress={handleClose}>
                {t("studentDashboard.schedule.reschedule.close")}
              </Button>
              {isPending && (
                <>
                  <Button
                    onPress={() => {
                      setError(null);
                      setMode("confirmReject");
                    }}
                    style={{
                      backgroundColor: `${colors.state.error}15`,
                      color: colors.state.error,
                    }}
                  >
                    {t("studentDashboard.schedule.reschedule.reject")}
                  </Button>
                  <Button
                    onPress={() => {
                      if (!selectedOptionId) {
                        setError(
                          t("studentDashboard.schedule.reschedule.errorSelect"),
                        );
                        return;
                      }
                      setError(null);
                      setMode("confirmAccept");
                    }}
                    style={{
                      backgroundColor: colors.primary.main,
                      color: colors.text.white,
                    }}
                  >
                    {t("studentDashboard.schedule.reschedule.confirm")}
                  </Button>
                </>
              )}
            </>
          )}

          {mode === "confirmAccept" && (
            <>
              <Button
                variant="light"
                onPress={() => setMode("view")}
                isDisabled={confirming}
              >
                {t("studentDashboard.schedule.reschedule.back")}
              </Button>
              <Button
                isLoading={confirming}
                onPress={handleConfirm}
                style={{
                  backgroundColor: colors.state.success,
                  color: colors.text.white,
                }}
                startContent={
                  !confirming && <CheckCircle weight="BoldDuotone" className="w-4 h-4" />
                }
              >
                {t("studentDashboard.schedule.reschedule.confirmAccept")}
              </Button>
            </>
          )}

          {mode === "confirmReject" && (
            <>
              <Button
                variant="light"
                onPress={() => setMode("view")}
                isDisabled={rejecting}
              >
                {t("studentDashboard.schedule.reschedule.back")}
              </Button>
              <Button
                isLoading={rejecting}
                onPress={handleReject}
                style={{
                  backgroundColor: colors.state.error,
                  color: colors.text.white,
                }}
                startContent={
                  !rejecting && <CloseCircle weight="BoldDuotone" className="w-4 h-4" />
                }
              >
                {t("studentDashboard.schedule.reschedule.confirmReject")}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
