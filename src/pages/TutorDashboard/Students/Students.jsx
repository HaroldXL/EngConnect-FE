import { useState, useEffect } from "react";
import {
  CalendarMark,
  ClockCircle,
  Eye,
  MinimalisticMagnifier,
} from "@solar-icons/react";
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Input,
  Progress,
  Chip,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Spinner,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { coursesApi, studentApi } from "../../../api";
import message from "../../../assets/illustrations/boy.avif";
import LessonDetailModal from "../../../components/LessonDetailModal/LessonDetailModal";
import StudentsSkeleton from "../../../components/StudentsSkeleton/StudentsSkeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0 },
  },
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const Students = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const colors = useThemeColors();
  const { filterInputClassNames, filterTabsClassNames } = useInputStyles();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseThumbnails, setCourseThumbnails] = useState({});

  // Schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleStudent, setScheduleStudent] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const openScheduleModal = async (enrollment, studentName) => {
    setScheduleStudent({
      studentName,
      courseName: enrollment.courseName,
    });
    setScheduleModalOpen(true);
    setLessonsLoading(true);
    try {
      const res = await studentApi.getLessons({
        EnrollmentId: enrollment.id,
        "page-size": 200,
        "sort-params": "StartTime-asc",
      });
      setLessons(res?.data?.items || []);
    } catch {
      setLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const params = { "page-size": 50, page: 1 };
        params.Status = selectedTab === "all" ? "" : selectedTab;
        if (searchQuery.trim()) params["search-term"] = searchQuery.trim();
        const data = await coursesApi.getMyStudentEnrollments(params);
        setStudents(data?.data?.items ?? []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedTab, searchQuery]);

  // Fetch course thumbnails for unique courseIds across all students
  useEffect(() => {
    if (students.length === 0) return;
    const uniqueIds = new Set();
    students.forEach((s) =>
      s.enrollments?.forEach((e) => {
        if (e.courseId) uniqueIds.add(e.courseId);
      }),
    );
    const toFetch = [...uniqueIds].filter((id) => !(id in courseThumbnails));
    if (toFetch.length === 0) return;

    Promise.all(
      toFetch.map((id) =>
        coursesApi
          .getCourseById(id)
          .then((res) => ({ id, thumbnail: res?.data?.thumbnailUrl || null }))
          .catch(() => ({ id, thumbnail: null })),
      ),
    ).then((results) => {
      setCourseThumbnails((prev) => {
        const next = { ...prev };
        results.forEach(({ id, thumbnail }) => {
          next[id] = thumbnail;
        });
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const getStatusColor = (status) => {
    if (status === "InProgress") return colors.state.warning;
    if (status === "Completed") return colors.primary.main;
    return colors.text.secondary;
  };

  const getStatusLabel = (status) => {
    if (status === "InProgress") return t("tutorDashboard.students.inProgress");
    if (status === "Completed") return t("tutorDashboard.students.completed");
    return status;
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getLessonStatusStyle = (status) => {
    switch (status) {
      case "Scheduled":
        return {
          bg: colors.background.primaryLight,
          color: colors.primary.main,
        };
      case "InProgress":
        return { bg: `${colors.state.warning}20`, color: colors.state.warning };
      case "Completed":
      case "Settled":
        return { bg: `${colors.state.success}20`, color: colors.state.success };
      case "Cancelled":
      case "NoStudent":
      case "NoTutor":
      case "Refund":
        return { bg: `${colors.state.error}20`, color: colors.state.error };
      case "Reschedule":
        return { bg: `${colors.state.warning}20`, color: colors.state.warning };
      default:
        return { bg: colors.background.gray, color: colors.text.secondary };
    }
  };

  const getLessonStatusLabel = (status) => {
    switch (status) {
      case "Scheduled":
        return t("tutorDashboard.schedule.lessonStatus.scheduled");
      case "Completed":
      case "Settled":
        return t("tutorDashboard.schedule.lessonStatus.completed");
      case "Cancelled":
        return t("tutorDashboard.schedule.lessonStatus.cancelled");
      case "Refund":
        return t("tutorDashboard.schedule.lessonStatus.refund");
      case "InProgress":
        return t("tutorDashboard.schedule.lessonStatus.inProgress");
      case "NoStudent":
        return t("tutorDashboard.schedule.lessonStatus.noStudent");
      case "NoTutor":
        return t("tutorDashboard.schedule.lessonStatus.noTutor");
      case "Reschedule":
        return t("tutorDashboard.schedule.lessonStatus.reschedule");
      default:
        return status || "";
    }
  };

  const formatLessonTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLessonDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const activeStudents = students.filter((s) =>
    s.enrollments?.some((e) => e.status === "InProgress"),
  ).length;
  const totalCompleted = students.reduce(
    (acc, s) =>
      acc +
      (s.enrollments?.filter((e) => e.status === "Completed").length || 0),
    0,
  );

  const stats = [
    {
      label: t("tutorDashboard.students.totalStudents"),
      value: loading ? "..." : students.length,
      color: colors.primary.main,
    },
    {
      label: t("tutorDashboard.students.activeStudents"),
      value: loading ? "..." : activeStudents,
      color: colors.state.success,
    },
    {
      label: t("tutorDashboard.students.completedCourses"),
      value: loading ? "..." : totalCompleted,
      color: colors.primary.main,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <h1
          className="text-2xl font-bold"
          style={{ color: colors.text.primary }}
        >
          {t("tutorDashboard.students.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("tutorDashboard.students.subtitle")}
        </p>
      </motion.div>

      {/* Stats */}
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-3 gap-4"
      >
        {stats.map((stat, index) => (
          <Card
            key={index}
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-4 text-center">
              <p className="text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {stat.label}
              </p>
            </CardBody>
          </Card>
        ))}
      </motion.div> */}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Input
          placeholder={t("tutorDashboard.students.searchPlaceholder")}
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={
            <MinimalisticMagnifier
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.text.tertiary }}
            />
          }
          classNames={filterInputClassNames}
          className="max-w-xs"
        />

        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={setSelectedTab}
          variant="solid"
          color="primary"
          classNames={filterTabsClassNames}
        >
          <Tab key="all" title={t("tutorDashboard.students.all")} />
          <Tab
            key="InProgress"
            title={t("tutorDashboard.students.inProgress")}
          />
          <Tab key="Completed" title={t("tutorDashboard.students.completed")} />
        </Tabs>
      </motion.div>

      {/* Students List */}
      {loading ? (
        <StudentsSkeleton count={5} />
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-4">
          <img
            src={message}
            alt="No students"
            className="w-68 h-68 object-contain"
          />
          <h3
            className="text-xl font-semibold"
            style={{ color: colors.text.primary }}
          >
            {t("tutorDashboard.students.noStudents")}
          </h3>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {students.map((student) => {
            const courseCount = student.enrollments?.length || 0;
            return (
              <motion.div key={student.studentId} variants={itemVariants}>
                <Card
                  shadow="none"
                  className="border-none"
                  style={{ backgroundColor: colors.background.light }}
                >
                  <CardBody className="p-4">
                    {/* Student Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar
                          src={student.studentAvatar}
                          size="lg"
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold truncate"
                            style={{ color: colors.text.primary }}
                          >
                            {student.studentName}
                          </h3>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: colors.text.tertiary }}
                          >
                            {courseCount}{" "}
                            {courseCount === 1
                              ? t("tutorDashboard.students.course")
                              : t("tutorDashboard.students.courses")}
                            {" · "}
                            {t("tutorDashboard.students.joinedAt")}:{" "}
                            {formatDate(student.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={
                            <Eye weight="BoldDuotone" className="w-4 h-4" />
                          }
                          style={{
                            backgroundColor: `${colors.primary.main}15`,
                            color: colors.primary.main,
                          }}
                          onPress={() =>
                            navigate(`/tutor/students/${student.studentId}`)
                          }
                        >
                          {t("tutorDashboard.students.profile")}
                        </Button>
                      </div>
                    </div>

                    {/* Divider */}
                    {courseCount > 0 && (
                      <div
                        className="h-px my-4"
                        style={{ backgroundColor: colors.border.medium }}
                      />
                    )}

                    {/* Enrollments (courses purchased) */}
                    {courseCount > 0 && (
                      <div className="space-y-3">
                        {student.enrollments.map((enrollment) => {
                          const progress =
                            enrollment.numsOfSession > 0
                              ? Math.round(
                                  (enrollment.numOfCompleteSession /
                                    enrollment.numsOfSession) *
                                    100,
                                )
                              : 0;
                          const thumbnail =
                            courseThumbnails[enrollment.courseId];
                          return (
                            <div
                              key={enrollment.id}
                              className="flex gap-3 p-3 rounded-xl"
                              style={{
                                backgroundColor: colors.background.gray,
                              }}
                            >
                              {/* Course Thumbnail */}
                              {thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={enrollment.courseName}
                                  className="w-24 h-15 rounded-lg object-cover flex-shrink-0"
                                  draggable={false}
                                  onDragStart={(e) => e.preventDefault()}
                                  onContextMenu={(e) => e.preventDefault()}
                                />
                              ) : (
                                <div
                                  className="w-24 h-15 rounded-lg flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      colors.background.primaryLight,
                                  }}
                                />
                              )}

                              {/* Course Info */}
                              <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <button
                                      type="button"
                                      className="text-sm font-medium hover:underline text-left block truncate w-full"
                                      style={{ color: colors.primary.main }}
                                      onClick={() =>
                                        navigate(
                                          `/tutor/students/${student.studentId}`,
                                          {
                                            state: {
                                              expandCourseId:
                                                enrollment.courseId,
                                            },
                                          },
                                        )
                                      }
                                    >
                                      {enrollment.courseName}
                                    </button>
                                    <p
                                      className="text-xs mt-0.5"
                                      style={{ color: colors.text.tertiary }}
                                    >
                                      {t("tutorDashboard.students.enrolledAt")}:{" "}
                                      {formatDate(enrollment.enrolledAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Chip
                                      size="sm"
                                      style={{
                                        backgroundColor: `${getStatusColor(enrollment.status)}20`,
                                        color: getStatusColor(
                                          enrollment.status,
                                        ),
                                      }}
                                    >
                                      {getStatusLabel(enrollment.status)}
                                    </Chip>
                                    <Button
                                      size="sm"
                                      variant="flat"
                                      startContent={
                                        <CalendarMark
                                          weight="BoldDuotone"
                                          className="w-4 h-4"
                                        />
                                      }
                                      style={{
                                        backgroundColor: `${colors.state.success}15`,
                                        color: colors.state.success,
                                      }}
                                      onPress={() =>
                                        openScheduleModal(
                                          enrollment,
                                          student.studentName,
                                        )
                                      }
                                    >
                                      {t(
                                        "tutorDashboard.students.scheduleLesson",
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <Progress
                                    value={progress}
                                    size="sm"
                                    classNames={{ indicator: "bg-primary" }}
                                    className="flex-1"
                                  />
                                  <span
                                    className="text-xs font-medium whitespace-nowrap"
                                    style={{ color: colors.text.secondary }}
                                  >
                                    {enrollment.numOfCompleteSession}/
                                    {enrollment.numsOfSession}{" "}
                                    {t("tutorDashboard.students.lessons")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Schedule Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {() => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                <div className="flex flex-col gap-0.5">
                  <span>
                    {scheduleStudent?.studentName
                      ? `${t("tutorDashboard.students.scheduleModal.title")} — ${scheduleStudent.studentName}`
                      : t("tutorDashboard.students.scheduleModal.title")}
                  </span>
                  {scheduleStudent?.courseName && (
                    <span
                      className="text-sm font-normal"
                      style={{ color: colors.text.secondary }}
                    >
                      {scheduleStudent.courseName}
                    </span>
                  )}
                </div>
              </ModalHeader>
              <ModalBody className="pb-6">
                {lessonsLoading ? (
                  <div className="flex justify-center py-10">
                    <Spinner />
                  </div>
                ) : lessons.length === 0 ? (
                  <p
                    className="text-center py-10"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("tutorDashboard.students.scheduleModal.noLessons")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lessons.map((lesson) => {
                      const statusStyle = getLessonStatusStyle(lesson.status);
                      const isToday =
                        new Date(lesson.startTime).toDateString() ===
                        new Date().toDateString();
                      return (
                        <div
                          key={lesson.lessonId || lesson.id}
                          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: colors.background.gray }}
                          onClick={() => setSelectedLesson(lesson)}
                        >
                          {isToday ? (
                            <div
                              className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: colors.background.primaryLight,
                              }}
                            >
                              <ClockCircle
                                size={18}
                                weight="BoldDuotone"
                                style={{ color: colors.primary.main }}
                              />
                            </div>
                          ) : (
                            <div
                              className="w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: colors.background.primaryLight,
                              }}
                            >
                              <span
                                className="text-sm font-bold"
                                style={{ color: colors.primary.main }}
                              >
                                {new Date(lesson.startTime).getDate()}
                              </span>
                              <span
                                style={{
                                  color: colors.primary.main,
                                  fontSize: "10px",
                                }}
                              >
                                {new Date(lesson.startTime).toLocaleDateString(
                                  dateLocale,
                                  { month: "short" },
                                )}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: colors.text.primary }}
                            >
                              {lesson.sessionTitle || lesson.courseTitle || "—"}
                            </p>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: colors.text.tertiary }}
                            >
                              {isToday
                                ? `${formatLessonTime(lesson.startTime)} — ${formatLessonTime(lesson.endTime)}`
                                : `${formatLessonDate(lesson.startTime)} · ${formatLessonTime(lesson.startTime)} — ${formatLessonTime(lesson.endTime)}`}
                            </p>
                          </div>
                          <Chip
                            size="sm"
                            className="text-xs"
                            style={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                            }}
                          >
                            {getLessonStatusLabel(lesson.status)}
                          </Chip>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <LessonDetailModal
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        lesson={selectedLesson}
      />
    </div>
  );
};

export default Students;
