import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Avatar,
  Chip,
} from "@heroui/react";
import { BookBookmark, CalendarMark, ClockCircle, Videocamera } from "@solar-icons/react"
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../hooks/useThemeColors";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const AdminLessonDetailModal = ({ isOpen, onClose, lesson }) => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";

  if (!lesson) return null;

  const startDate = new Date(lesson.startTime);
  const endDate = new Date(lesson.endTime);
  const durationMin = Math.round((endDate - startDate) / 60000);

  const getLessonStatusColor = (status) => {
    switch (status) {
      case "Scheduled":
        return colors.primary.main;
      case "InProgress":
        return colors.state.warning;
      case "Reschedule":
        return colors.state.warning;
      case "Completed":
      case "Settled":
        return colors.state.success;
      case "Cancelled":
      case "NoStudent":
      case "NoTutor":
      case "Refund":
        return colors.state.error;
      default:
        return colors.text.tertiary;
    }
  };

  const tutorName =
    `${lesson.tutorFirstName || ""} ${lesson.tutorLastName || ""}`.trim();
  const studentName =
    `${lesson.studentFirstName || ""} ${lesson.studentLastName || ""}`.trim();

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        {() => (
          <>
            <ModalHeader
              className="flex items-center gap-2"
              style={{ color: colors.text.primary }}
            >
              <BookBookmark
                weight="BoldDuotone"
                className="w-5 h-5"
                style={{ color: colors.primary.main }}
              />
              {t("adminDashboard.schedule.lessonDetail")}
            </ModalHeader>
            <ModalBody className="pb-6">
              <div className="space-y-4">
                {/* Course */}
                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {lesson.courseTitle || t("adminDashboard.schedule.nA")}
                  </p>
                  {lesson.sessionTitle && (
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: colors.text.secondary }}
                    >
                      {lesson.sessionTitle}
                    </p>
                  )}
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs font-semibold flex items-center gap-1 mb-1"
                      style={{ color: colors.text.secondary }}
                    >
                      <CalendarMark weight="BoldDuotone" className="w-3.5 h-3.5" />
                      {t("adminDashboard.schedule.detail.date")}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.primary }}
                    >
                      {startDate.toLocaleDateString(dateLocale, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs font-semibold flex items-center gap-1 mb-1"
                      style={{ color: colors.text.secondary }}
                    >
                      <ClockCircle weight="BoldDuotone" className="w-3.5 h-3.5" />
                      {t("adminDashboard.schedule.detail.time")}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.primary }}
                    >
                      {startDate.toLocaleTimeString(dateLocale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" — "}
                      {endDate.toLocaleTimeString(dateLocale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ({durationMin}m)
                    </p>
                  </div>
                </div>

                {/* Lesson Status + Meeting Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs font-semibold mb-1.5"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.schedule.detail.lessonStatus")}
                    </p>
                    <Chip
                      size="sm"
                      variant="flat"
                      style={{
                        backgroundColor: `${getLessonStatusColor(lesson.status)}20`,
                        color: getLessonStatusColor(lesson.status),
                      }}
                    >
                      {t(
                        `adminDashboard.schedule.lessonStatuses.${lesson.status}`,
                      ) || lesson.status}
                    </Chip>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs font-semibold mb-1.5"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.schedule.detail.meetingStatus")}
                    </p>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={
                        lesson.meetingStatus === "InProgress"
                          ? "success"
                          : lesson.meetingStatus === "Waiting"
                            ? "warning"
                            : lesson.meetingStatus === "Ended"
                              ? "primary"
                              : "default"
                      }
                    >
                      {lesson.meetingStatus || t("adminDashboard.schedule.nA")}
                    </Chip>
                  </div>
                </div>

                {/* Tutor + Student */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: colors.background.gray }}
                    onClick={() =>
                      lesson.tutorId &&
                      handleNavigate(`/admin/tutors/${lesson.tutorId}`)
                    }
                  >
                    <Avatar
                      src={withCDN(lesson.tutorAvatar)}
                      name={tutorName}
                      size="sm"
                    />
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("adminDashboard.schedule.detail.tutor")}
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {tutorName || t("adminDashboard.schedule.nA")}
                      </p>
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: colors.background.gray }}
                    onClick={() =>
                      lesson.studentId &&
                      handleNavigate(`/admin/students/${lesson.studentId}`)
                    }
                  >
                    <Avatar
                      src={withCDN(lesson.studentAvatar)}
                      name={studentName}
                      size="sm"
                    />
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("adminDashboard.schedule.detail.student")}
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {studentName || t("adminDashboard.schedule.nA")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recording */}
                {lesson.lessonRecord?.recordUrl && (
                  <div
                    className="p-3 rounded-xl flex items-center gap-3"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <Videocamera
                      weight="BoldDuotone"
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: colors.primary.main }}
                    />
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("adminDashboard.schedule.detail.recording")}
                      </p>
                      {lesson.lessonRecord.durationSeconds && (
                        <p
                          className="text-sm"
                          style={{ color: colors.text.primary }}
                        >
                          {Math.floor(lesson.lessonRecord.durationSeconds / 60)}
                          m {lesson.lessonRecord.durationSeconds % 60}s
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* View Course */}
                {lesson.courseId && (
                  <Button
                    variant="flat"
                    className="w-full"
                    startContent={<BookBookmark weight="BoldDuotone" className="w-4 h-4" />}
                    onPress={() =>
                      handleNavigate(`/admin/courses/${lesson.courseId}`)
                    }
                    style={{ color: colors.primary.main }}
                  >
                    {t("adminDashboard.schedule.detail.viewCourse")}
                  </Button>
                )}
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AdminLessonDetailModal;
