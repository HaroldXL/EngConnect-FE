import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Avatar,
} from "@heroui/react";
import { BookBookmark, ClockCircle, Dollar, UserCircle } from "@solar-icons/react"
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";

import useInputStyles from "../../hooks/useInputStyles";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const StudentRefundRequestModal = ({
  isOpen,
  lesson,
  note,
  onNoteChange,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const { inputClassNames } = useInputStyles();

  const tutorName = lesson
    ? [lesson.tutorFirstName, lesson.tutorLastName].filter(Boolean).join(" ")
    : null;

  const formatTime = (iso, opts) =>
    iso ? new Date(iso).toLocaleString(dateLocale, opts) : "—";

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!isSubmitting) onClose();
      }}
      size="sm"
      scrollBehavior="inside"
    >
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        {() => (
          <>
            <ModalHeader
              className="flex items-center gap-2"
              style={{ color: colors.text.primary }}
            >
              <Dollar
                weight="BoldDuotone"
                className="w-5 h-5"
                style={{ color: colors.state.error }}
              />
              {t("studentDashboard.schedule.refundRequest.modalTitle")}
            </ModalHeader>

            <ModalBody className="pb-2 space-y-4">
              {/* Hint */}
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {t("studentDashboard.schedule.refundRequest.modalHint")}
              </p>

              {/* Lesson info card */}
              {lesson && (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: colors.background.gray,
                    border: `1px solid ${colors.border.light}`,
                  }}
                >
                  {/* Course + session */}
                  <div className="px-4 pt-4 pb-3 space-y-0.5">
                    <p
                      className="font-semibold text-sm leading-snug"
                      style={{ color: colors.text.primary }}
                    >
                      {lesson.courseTitle || "—"}
                    </p>
                    {lesson.sessionTitle && (
                      <p
                        className="text-xs flex items-center gap-1.5"
                        style={{ color: colors.text.secondary }}
                      >
                        <BookBookmark
                          weight="BoldDuotone"
                          className="w-3 h-3 flex-shrink-0"
                        />
                        {t(
                          "studentDashboard.schedule.refundRequest.sessionLabel",
                        )}
                        :{" "}
                        <span style={{ color: colors.text.primary }}>
                          {lesson.sessionTitle}
                        </span>
                      </p>
                    )}
                  </div>

                  <div
                    className="h-px mx-4"
                    style={{ backgroundColor: colors.border.light }}
                  />

                  {/* Time */}
                  <div className="px-4 py-3 space-y-1">
                    <p
                      className="text-xs flex items-center gap-1.5"
                      style={{ color: colors.text.secondary }}
                    >
                      <ClockCircle
                        weight="BoldDuotone"
                        className="w-3 h-3 flex-shrink-0"
                      />
                      {formatTime(lesson.startTime, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {lesson.endTime && (
                        <>
                          {" — "}
                          {new Date(lesson.endTime).toLocaleTimeString(
                            dateLocale,
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </>
                      )}
                    </p>

                    {/* Tutor */}
                    {tutorName && (
                      <p
                        className="text-xs flex items-center gap-1.5"
                        style={{ color: colors.text.secondary }}
                      >
                        {lesson.tutorAvatar ? (
                          <Avatar
                            src={withCDN(lesson.tutorAvatar)}
                            name={tutorName}
                            size="sm"
                            className="w-4 h-4 text-[8px] flex-shrink-0"
                          />
                        ) : (
                          <UserCircle
                            weight="BoldDuotone"
                            className="w-3 h-3 flex-shrink-0"
                          />
                        )}
                        {t(
                          "studentDashboard.schedule.refundRequest.tutorLabel",
                        )}
                        :{" "}
                        <span style={{ color: colors.text.primary }}>
                          {tutorName}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Note */}
              <Textarea
                label={t("studentDashboard.schedule.refundRequest.noteLabel")}
                placeholder={t(
                  "studentDashboard.schedule.refundRequest.notePlaceholder",
                )}
                value={note}
                onValueChange={onNoteChange}
                minRows={2}
                maxRows={4}
                classNames={inputClassNames}
              />

              {/* Admin will receive */}
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: `${colors.primary.main}08`,
                  border: `1px solid ${colors.primary.main}20`,
                }}
              >
                <div className="px-3 py-2.5 space-y-1">
                  <p
                    className="text-xs font-semibold mb-2"
                    style={{ color: colors.primary.main }}
                  >
                    {t(
                      "studentDashboard.schedule.refundRequest.adminPreviewTitle",
                    )}
                  </p>
                  {lesson && (
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      Lesson: {lesson.courseTitle || "—"}
                      {lesson.sessionTitle ? ` · ${lesson.sessionTitle}` : ""}
                    </p>
                  )}
                  {lesson?.startTime && (
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      Date:{" "}
                      {formatTime(lesson.startTime, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {lesson.endTime && (
                        <>
                          {" — "}
                          {new Date(lesson.endTime).toLocaleTimeString(
                            dateLocale,
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </>
                      )}
                    </p>
                  )}
                  {lesson?.id && (
                    <p
                      className="text-[11px] font-mono break-all"
                      style={{ color: colors.text.secondary }}
                    >
                      Lesson ID: {lesson.id}
                    </p>
                  )}
                  {note.trim() && (
                    <p
                      className="text-xs italic"
                      style={{ color: colors.text.secondary }}
                    >
                      Note: {note.trim()}
                    </p>
                  )}
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="light"
                onPress={onClose}
                isDisabled={isSubmitting}
              >
                {t("studentDashboard.schedule.reschedule.close")}
              </Button>
              <Button
                isLoading={isSubmitting}
                onPress={onSubmit}
                startContent={
                  !isSubmitting && (
                    <Dollar weight="BoldDuotone" className="w-4 h-4" />
                  )
                }
                style={{ backgroundColor: colors.state.error, color: "#fff" }}
              >
                {t("studentDashboard.schedule.refundRequest.submitBtn")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default StudentRefundRequestModal;
