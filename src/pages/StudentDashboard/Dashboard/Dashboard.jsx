import { useState, useEffect, useCallback } from "react";
import {
  AltArrowRight,
  CalendarMark,
  ClipboardList,
  ClockCircle,
  CourseUp,
  GraphUp,
  Play,
  PlayCircle,
} from "@solar-icons/react";
import { Card, CardBody, Button, Avatar, Progress, Image } from "@heroui/react";
import UpcomingLessonsSkeleton from "../../../components/UpcomingLessonsSkeleton/UpcomingLessonsSkeleton";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { motion } from "framer-motion";

import IllustrationImage from "../../../assets/illustrations/morning.avif";
import calendarIllustration from "../../../assets/illustrations/calendar.avif";
import chillIllustration from "../../../assets/illustrations/chill.avif";
import toDoIllustration from "../../../assets/illustrations/to-do.avif";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store";
import { useNavigate } from "react-router-dom";
import { studentApi, coursesApi, lessonHomeworkApi } from "../../../api";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const Dashboard = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [coursesInProgress, setCoursesInProgress] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [upcomingHomework, setUpcomingHomework] = useState([]);
  const [homeworkLoading, setHomeworkLoading] = useState(true);

  const fetchUpcomingLessons = useCallback(async () => {
    if (!user?.studentId) return;
    try {
      setLessonsLoading(true);
      const res = await studentApi.getLessons({
        StudentId: user.studentId,
        Status: "Scheduled",
        "page-size": 4,
        "sort-params": "StartTime-asc",
      });
      setUpcomingLessons(res?.data?.items || []);
    } catch (err) {
      console.error("Failed to fetch upcoming lessons:", err);
    } finally {
      setLessonsLoading(false);
    }
  }, [user?.studentId]);

  const fetchUpcomingHomework = useCallback(async () => {
    if (!user?.studentId) return;
    try {
      setHomeworkLoading(true);
      const res = await lessonHomeworkApi.getHomeworks({
        StudentId: user.studentId,
        Status: "Assigned",
        "sort-params": "dueAt-asc",
        "page-size": 5,
      });
      setUpcomingHomework(res?.data?.items || []);
    } catch (err) {
      console.error("Failed to fetch upcoming homework:", err);
    } finally {
      setHomeworkLoading(false);
    }
  }, [user?.studentId]);

  const fetchCoursesInProgress = useCallback(async () => {
    if (!user?.studentId) return;
    try {
      setCoursesLoading(true);
      const res = await coursesApi.getAllCourseEnrollments({
        StudentId: user.studentId,
        Status: "InProgress",
        "page-size": 5,
      });
      setCoursesInProgress(res?.data?.items || []);
    } catch (err) {
      console.error("Failed to fetch courses in progress:", err);
    } finally {
      setCoursesLoading(false);
    }
  }, [user?.studentId]);

  useEffect(() => {
    fetchUpcomingLessons();
    fetchCoursesInProgress();
    fetchUpcomingHomework();
  }, [fetchUpcomingLessons, fetchCoursesInProgress, fetchUpcomingHomework]);

  const formatLessonTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatLessonDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === now.toDateString())
      return t("studentDashboard.dashboard.today");
    if (d.toDateString() === tomorrow.toDateString())
      return t("studentDashboard.dashboard.tomorrow");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card
          shadow="none"
          className="border-none overflow-hidden"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-0">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="p-6 md:p-8 flex-1">
                <h1
                  className="text-2xl lg:text-3xl font-bold mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("studentDashboard.dashboard.welcome")}, {user?.firstName}!
                  👋
                </h1>
                <p className="mb-4" style={{ color: colors.text.secondary }}>
                  {t("studentDashboard.dashboard.welcomeSubtitle")}
                </p>
                <Button
                  color="primary"
                  endContent={<Play weight="BoldDuotone" className="w-4 h-4" />}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                  onPress={() => navigate("/student/schedule")}
                >
                  {t("studentDashboard.dashboard.continueLearn")}
                </Button>
              </div>
              <div className="hidden md:block w-48 lg:w-64 h-40 lg:h-48 relative">
                <Image
                  src={IllustrationImage}
                  alt="Welcome illustration"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <Card
            key={index}
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: stat.bg }}
                >
                  <stat.icon
                    weight="BoldDuotone"
                    className="w-6 h-6"
                    style={{ color: stat.color }}
                  />
                </div>
                <div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    {stat.label}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </motion.div> */}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Upcoming Lessons & Courses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Lessons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    <CalendarMark
                      weight="BoldDuotone"
                      className="w-5 h-5 inline-block mr-2"
                      style={{ color: colors.primary.main }}
                    />
                    {t("studentDashboard.dashboard.upcomingLessons")}
                  </h2>
                  <Button
                    variant="light"
                    size="sm"
                    endContent={
                      <AltArrowRight weight="BoldDuotone" className="w-4 h-4" />
                    }
                    style={{ color: colors.primary.main }}
                    onPress={() => navigate("/student/schedule")}
                  >
                    {t("studentDashboard.dashboard.viewAll")}
                  </Button>
                </div>

                <div className="space-y-3">
                  {lessonsLoading ? (
                    <UpcomingLessonsSkeleton />
                  ) : upcomingLessons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6">
                      <img
                        src={calendarIllustration}
                        alt="No lessons"
                        draggable={false}
                        className="w-48 h-38 object-contain"
                      />
                      <p
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("studentDashboard.dashboard.noUpcomingLessons")}
                      </p>
                    </div>
                  ) : (
                    upcomingLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar
                            src={withCDN(lesson.tutorAvatar)}
                            name={[lesson.tutorFirstName, lesson.tutorLastName]
                              .filter(Boolean)
                              .join(" ")}
                            size="md"
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p
                              className="font-medium truncate"
                              style={{ color: colors.text.primary }}
                            >
                              {lesson.courseTitle || lesson.sessionTitle}
                            </p>
                            <p
                              className="text-sm truncate"
                              style={{ color: colors.text.secondary }}
                            >
                              {[lesson.tutorFirstName, lesson.tutorLastName]
                                .filter(Boolean)
                                .join(" ")}{" "}
                              • {formatLessonDate(lesson.startTime)},{" "}
                              {formatLessonTime(lesson.startTime)}
                            </p>
                          </div>
                        </div>
                        {lesson.meetingStatus === "Waiting" && (
                          <Button
                            isIconOnly
                            radius="full"
                            style={{
                              backgroundColor: colors.primary.main,
                              color: colors.text.white,
                            }}
                            onPress={() => navigate(`/meeting/${lesson.id}`)}
                          >
                            <Play weight="BoldDuotone" className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Courses In Progress */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    <CourseUp
                      weight="BoldDuotone"
                      className="w-5 h-5 inline-block mr-2"
                      style={{ color: colors.state.success }}
                    />
                    {t("studentDashboard.dashboard.coursesInProgress")}
                  </h2>
                  <Button
                    variant="light"
                    size="sm"
                    endContent={
                      <AltArrowRight weight="BoldDuotone" className="w-4 h-4" />
                    }
                    style={{ color: colors.primary.main }}
                    onPress={() => navigate("/student/my-courses")}
                  >
                    {t("studentDashboard.dashboard.viewAll")}
                  </Button>
                </div>

                {coursesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 rounded-xl animate-pulse"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <div className="w-16 h-16 rounded-lg bg-default-200 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-default-200" />
                          <div className="h-3 w-1/2 rounded bg-default-200" />
                          <div className="h-2 w-full rounded bg-default-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : coursesInProgress.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <img
                      src={chillIllustration}
                      alt="No courses"
                      draggable={false}
                      className="w-48 h-38 object-contain"
                    />
                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("studentDashboard.dashboard.noCoursesInProgress")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {coursesInProgress.map((enrollment) => {
                      const progress =
                        enrollment.numsOfSession > 0
                          ? Math.round(
                              (enrollment.numOfCompleteSession /
                                enrollment.numsOfSession) *
                                100,
                            )
                          : 0;
                      return (
                        <div
                          key={enrollment.id}
                          className="flex items-center gap-4 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: colors.background.gray }}
                          onClick={() =>
                            navigate(`/student/courses/${enrollment.courseId}`)
                          }
                        >
                          <img
                            src={
                              withCDN(enrollment.course?.thumbnailUrl) ||
                              "https://placehold.co/300x300?text=No+Image"
                            }
                            alt={enrollment.course?.title}
                            className="w-24 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-medium truncate"
                              style={{ color: colors.text.primary }}
                            >
                              {enrollment.course?.title}
                            </p>
                            <p
                              className="text-sm mb-2"
                              style={{ color: colors.text.secondary }}
                            >
                              {enrollment.numOfCompleteSession}/
                              {enrollment.numsOfSession}{" "}
                              {t("studentDashboard.dashboard.lessonsCompleted")}
                            </p>
                            <Progress
                              value={progress}
                              size="sm"
                              color="primary"
                              className="max-w-full"
                            />
                          </div>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: colors.primary.main }}
                          >
                            {progress}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Upcoming Homework */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    <ClipboardList
                      weight="BoldDuotone"
                      className="w-5 h-5 inline-block mr-2"
                      style={{ color: colors.state.warning }}
                    />
                    {t("studentDashboard.dashboard.upcomingHomework")}
                  </h2>
                  <Button
                    variant="light"
                    size="sm"
                    endContent={
                      <AltArrowRight weight="BoldDuotone" className="w-4 h-4" />
                    }
                    style={{ color: colors.primary.main }}
                    onPress={() => navigate("/student/homework")}
                  >
                    {t("studentDashboard.dashboard.viewAll")}
                  </Button>
                </div>

                {homeworkLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <div className="w-8 h-8 rounded-full bg-default-200 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-3/4 rounded bg-default-200" />
                          <div className="h-3 w-1/2 rounded bg-default-200" />
                        </div>
                        <div className="h-5 w-16 rounded-full bg-default-200" />
                      </div>
                    ))}
                  </div>
                ) : upcomingHomework.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <img
                      src={toDoIllustration}
                      alt="No homework"
                      draggable={false}
                      className="w-40 object-contain"
                    />
                    <p
                      className="text-sm mt-2"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("studentDashboard.dashboard.noUpcomingHomework")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingHomework.map((hw) => {
                      const due = (() => {
                        if (!hw.dueAt)
                          return {
                            label: t("studentDashboard.homework.noDueDate"),
                            color: colors.text.tertiary,
                          };
                        const diffMs =
                          new Date(hw.dueAt).getTime() - Date.now();
                        const diffDays = Math.ceil(
                          diffMs / (1000 * 60 * 60 * 24),
                        );
                        if (diffMs < 0)
                          return {
                            label: t("studentDashboard.homework.overdue"),
                            color: colors.state.error,
                          };
                        if (diffDays === 0)
                          return {
                            label: t("studentDashboard.homework.dueToday"),
                            color: colors.state.error,
                          };
                        if (diffDays === 1)
                          return {
                            label: t("studentDashboard.homework.dueTomorrow"),
                            color: colors.state.warning,
                          };
                        return {
                          label: `${diffDays} ${t("studentDashboard.homework.daysLeft")}`,
                          color:
                            diffDays <= 3
                              ? colors.state.warning
                              : colors.state.success,
                        };
                      })();

                      return (
                        <div
                          key={hw.id}
                          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: colors.background.gray }}
                          onClick={() => navigate("/student/homework")}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${due.color}20` }}
                          >
                            <ClockCircle
                              weight="BoldDuotone"
                              className="w-4 h-4"
                              style={{ color: due.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-medium text-sm truncate"
                              style={{ color: colors.text.primary }}
                            >
                              {hw.title ||
                                hw.sessionTitle ||
                                t("studentDashboard.homework.title")}
                            </p>
                            {hw.courseTitle && (
                              <p
                                className="text-xs truncate"
                                style={{ color: colors.text.secondary }}
                              >
                                {hw.courseTitle}
                              </p>
                            )}
                          </div>
                          <span
                            className="text-xs font-semibold whitespace-nowrap flex-shrink-0"
                            style={{ color: due.color }}
                          >
                            {due.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
