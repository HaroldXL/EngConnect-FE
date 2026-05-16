import { useState, useEffect, useCallback } from "react";
import {
  AltArrowRight,
  BookBookmark,
  CalendarMark,
  ClockCircle,
  Dollar,
  GraphUp,
  Star,
  UsersGroupRounded,
  Videocamera,
} from "@solar-icons/react";
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Progress,
  Image,
  Skeleton,
} from "@heroui/react";
import UpcomingLessonsSkeleton from "../../../components/UpcomingLessonsSkeleton/UpcomingLessonsSkeleton";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { motion } from "framer-motion";

import IllustrationImage from "../../../assets/illustrations/wait.avif";
import calendarIllustration from "../../../assets/illustrations/calendar.avif";
import message from "../../../assets/illustrations/boy.avif";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store";
import { useNavigate } from "react-router-dom";
import { studentApi, coursesApi, paymentApi } from "../../../api";

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
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentStudentsLoading, setRecentStudentsLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentReviewsLoading, setRecentReviewsLoading] = useState(true);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [earningsSummaryLoading, setEarningsSummaryLoading] = useState(true);

  const fetchUpcomingLessons = useCallback(async () => {
    if (!user?.tutorId) return;
    try {
      setLessonsLoading(true);
      const res = await studentApi.getLessons({
        TutorId: user.tutorId,
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
  }, [user?.tutorId]);

  useEffect(() => {
    fetchUpcomingLessons();
  }, [fetchUpcomingLessons]);

  useEffect(() => {
    if (!user?.tutorId) return;
    paymentApi
      .getTotalEarning({ TutorId: user.tutorId })
      .then((res) => setEarningsSummary(res?.data?.singleTutor || null))
      .catch(() => setEarningsSummary(null))
      .finally(() => setEarningsSummaryLoading(false));
  }, [user?.tutorId]);

  useEffect(() => {
    const fetchRecentStudents = async () => {
      try {
        const data = await coursesApi.getMyStudentEnrollments({
          Status: "InProgress,Completed",
          "page-size": 3,
          page: 1,
        });
        setRecentStudents(data?.data?.items ?? []);
      } catch {
        setRecentStudents([]);
      } finally {
        setRecentStudentsLoading(false);
      }
    };
    fetchRecentStudents();
  }, []);

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
      return t("tutorDashboard.dashboard.today");
    if (d.toDateString() === tomorrow.toDateString())
      return t("tutorDashboard.dashboard.tomorrow");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  useEffect(() => {
    if (!user?.tutorId) return;
    const fetchRecentReviews = async () => {
      try {
        const res = await coursesApi.getCourseReviews({
          TutorId: user.tutorId,
          page: 1,
          "page-size": 5,
          "sort-params": "CreatedAt-desc",
        });
        const items = res?.data?.items || [];
        const enriched = await Promise.all(
          items.map(async (review) => {
            const [studentRes, enrollmentRes] = await Promise.allSettled([
              studentApi.getStudentById(review.studentId),
              coursesApi.getCourseEnrollmentById(review.enrollmentId),
            ]);
            const s =
              studentRes.status === "fulfilled" ? studentRes.value?.data : null;
            const enrollment =
              enrollmentRes.status === "fulfilled"
                ? enrollmentRes.value?.data
                : null;
            return {
              id: review.id,
              studentName: s
                ? `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.trim() ||
                  s.user?.userName
                : "Student",
              studentAvatar: s?.avatar || null,
              rating: review.rating,
              comment: review.comment || "",
              courseTitle: enrollment?.course?.title || "",
              courseId: enrollment?.courseId || review.courseId,
              isAnonymous: review.isAnonymous,
              createdAt: review.createdAt,
            };
          }),
        );
        setRecentReviews(enriched);
      } catch {
        setRecentReviews([]);
      } finally {
        setRecentReviewsLoading(false);
      }
    };
    fetchRecentReviews();
  }, [user?.tutorId]);

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
                  {t("tutorDashboard.dashboard.welcome")}, {user?.firstName}! 👋
                </h1>
                <p className="mb-4" style={{ color: colors.text.secondary }}>
                  {t("tutorDashboard.dashboard.welcomeSubtitle")}
                </p>
                <Button
                  color="primary"
                  endContent={
                    <Videocamera weight="BoldDuotone" className="w-4 h-4" />
                  }
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                  onPress={() => navigate("/tutor/schedule")}
                >
                  {t("tutorDashboard.dashboard.startLesson")}
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

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Upcoming Lessons */}
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
                    {t("tutorDashboard.dashboard.upcomingLessons")}
                  </h2>
                  <Button
                    variant="light"
                    size="sm"
                    endContent={
                      <AltArrowRight weight="BoldDuotone" className="w-4 h-4" />
                    }
                    style={{ color: colors.primary.main }}
                    onPress={() => navigate("/tutor/schedule")}
                  >
                    {t("tutorDashboard.dashboard.viewAll")}
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
                        {t("tutorDashboard.dashboard.noUpcomingLessons")}
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
                            src={withCDN(lesson.studentAvatar)}
                            name={[
                              lesson.studentFirstName,
                              lesson.studentLastName,
                            ]
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
                              {[lesson.studentFirstName, lesson.studentLastName]
                                .filter(Boolean)
                                .join(" ")}{" "}
                              • {formatLessonDate(lesson.startTime)},{" "}
                              {formatLessonTime(lesson.startTime)}
                            </p>
                          </div>
                        </div>
                        {(lesson.meetingStatus === "Waiting" ||
                          lesson.meetingStatus === "InProgress") && (
                          <Button
                            size="sm"
                            radius="full"
                            style={{
                              backgroundColor: colors.primary.main,
                              color: colors.text.white,
                            }}
                            startContent={
                              <Videocamera
                                weight="BoldDuotone"
                                className="w-4 h-4"
                              />
                            }
                            onPress={() => navigate(`/meeting/${lesson.id}`)}
                          >
                            {lesson.meetingStatus === "InProgress"
                              ? t("tutorDashboard.schedule.joinBack")
                              : t("tutorDashboard.dashboard.start")}
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Recent Students */}
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
                    <UsersGroupRounded
                      weight="BoldDuotone"
                      className="w-5 h-5 inline-block mr-2"
                      style={{ color: colors.primary.main }}
                    />
                    {t("tutorDashboard.dashboard.recentStudents")}
                  </h2>
                  <Button
                    variant="light"
                    size="sm"
                    endContent={
                      <AltArrowRight weight="BoldDuotone" className="w-4 h-4" />
                    }
                    style={{ color: colors.primary.main }}
                    onPress={() => navigate("/tutor/students")}
                  >
                    {t("tutorDashboard.dashboard.viewAll")}
                  </Button>
                </div>

                <div className="space-y-4">
                  {recentStudentsLoading ? (
                    <div className="flex justify-center py-4">
                      <span style={{ color: colors.text.tertiary }}>...</span>
                    </div>
                  ) : recentStudents.length === 0 ? (
                    <div className="flex flex-col items-center py-4 gap-3">
                      <img
                        src={message}
                        alt="No students"
                        className="w-48 h-38 object-contain"
                      />
                      <p
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("tutorDashboard.students.noStudents")}
                      </p>
                    </div>
                  ) : (
                    recentStudents.map((enrollment) => {
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
                          className="flex items-center gap-4"
                        >
                          <Avatar
                            src={enrollment.studentAvatar}
                            size="md"
                            className="flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p
                                className="font-medium"
                                style={{ color: colors.text.primary }}
                              >
                                {enrollment.studentName}
                              </p>
                              <span
                                className="text-xs"
                                style={{ color: colors.text.tertiary }}
                              >
                                {enrollment.numOfCompleteSession}/
                                {enrollment.numsOfSession} sessions
                              </span>
                            </div>
                            <p
                              className="text-sm mb-2"
                              style={{ color: colors.text.secondary }}
                            >
                              {enrollment.courseName}
                            </p>
                            <Progress
                              value={progress}
                              size="sm"
                              classNames={{
                                indicator: "bg-primary",
                              }}
                              style={{
                                backgroundColor: colors.background.gray,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Reviews & Quick Stats */}
        <div className="space-y-6">
          {/* Earnings Overview */}
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
                    <Dollar
                      weight="BoldDuotone"
                      className="w-5 h-5 inline-block mr-2"
                      style={{ color: colors.state.success }}
                    />
                    {t("tutorDashboard.dashboard.earningsOverview")}
                  </h2>
                  <Button
                    variant="light"
                    size="sm"
                    endContent={
                      <AltArrowRight weight="BoldDuotone" className="w-4 h-4" />
                    }
                    style={{ color: colors.primary.main }}
                    onPress={() => navigate("/tutor/earnings")}
                  >
                    {t("tutorDashboard.dashboard.viewAll")}
                  </Button>
                </div>

                {earningsSummaryLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-14 w-full rounded-xl" />
                      <Skeleton className="h-14 w-full rounded-xl" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: colors.background.primaryLight,
                      }}
                    >
                      <p
                        className="text-xs font-medium mb-1"
                        style={{ color: colors.primary.main }}
                      >
                        {t("tutorDashboard.earnings.availableBalance")}
                      </p>
                      <p
                        className="text-2xl font-bold"
                        style={{ color: colors.text.primary }}
                      >
                        {(
                          earningsSummary?.availableBalance || 0
                        ).toLocaleString("vi-VN")}
                        đ
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className="rounded-xl p-3"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <p
                          className="text-xs mb-1"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("tutorDashboard.earnings.totalNet")}
                        </p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: colors.text.primary }}
                        >
                          {(
                            earningsSummary?.totalNetAmount || 0
                          ).toLocaleString("vi-VN")}
                          đ
                        </p>
                      </div>
                      <div
                        className="rounded-xl p-3"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <p
                          className="text-xs mb-1"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("tutorDashboard.earnings.platformFee")}
                        </p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: colors.text.primary }}
                        >
                          {(
                            earningsSummary?.totalPlatformFee || 0
                          ).toLocaleString("vi-VN")}
                          đ
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>

          {/* Recent Reviews */}
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
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.text.primary }}
                >
                  <Star
                    weight="BoldDuotone"
                    className="w-5 h-5 inline-block mr-2"
                    style={{ color: colors.state.warning }}
                  />
                  {t("tutorDashboard.dashboard.recentReviews")}
                </h2>

                <div className="space-y-4">
                  {recentReviewsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl space-y-2"
                          style={{ backgroundColor: colors.background.gray }}
                        >
                          <div className="flex items-center gap-2">
                            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <Skeleton className="h-3 w-2/3 rounded-lg" />
                              <Skeleton className="h-2.5 w-1/3 rounded-lg" />
                            </div>
                          </div>
                          <Skeleton className="h-3 w-full rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : recentReviews.length === 0 ? (
                    <p
                      className="text-sm text-center py-4"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("tutorDashboard.dashboard.noReviews")}
                    </p>
                  ) : (
                    recentReviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar
                            src={review.studentAvatar}
                            name={review.isAnonymous ? "?" : review.studentName}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-medium text-sm truncate"
                              style={{ color: colors.text.primary }}
                            >
                              {review.isAnonymous
                                ? t("tutorDashboard.dashboard.anonymous")
                                : review.studentName}
                            </p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  weight="BoldDuotone"
                                  className="w-3 h-3"
                                  style={{
                                    color:
                                      i < review.rating
                                        ? colors.state.warning
                                        : colors.border.light,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <span
                            className="text-xs flex-shrink-0"
                            style={{ color: colors.text.tertiary }}
                          >
                            {new Date(review.createdAt).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        </div>
                        {review.courseTitle && (
                          <button
                            type="button"
                            className="text-xs font-medium mb-1 hover:underline truncate block max-w-full text-left"
                            style={{ color: colors.primary.main }}
                            onClick={() =>
                              navigate(`/tutor/courses/${review.courseId}`)
                            }
                          >
                            {review.courseTitle}
                          </button>
                        )}
                        {review.comment && (
                          <p
                            className="text-sm"
                            style={{ color: colors.text.secondary }}
                          >
                            &quot;{review.comment}&quot;
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
