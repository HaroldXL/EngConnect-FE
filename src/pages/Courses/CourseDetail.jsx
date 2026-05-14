import { useState, useEffect, useRef } from "react";
import {
  AltArrowDown,
  AltArrowLeft,
  AltArrowRight,
  AltArrowUp,
  BookBookmark,
  CheckCircle,
  ClockCircle,
  Diploma,
  HeadphonesRound,
  Pen,
  Play,
  PlayCircle,
  Star,
  UsersGroupRounded,
  VolumeLoud,
} from "@solar-icons/react";
import { Check } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../store";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Avatar,
  Spinner,
} from "@heroui/react";
import * as MotionLib from "framer-motion";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import CourseDetailSkeleton from "../../components/CourseDetailSkeleton/CourseDetailSkeleton";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";

const getSkillStyle = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("speak"))
    return {
      Icon: VolumeLoud,
      color: "#F97316",
      iconBg: "rgba(249,115,22,0.15)",
    };
  if (n.includes("listen"))
    return {
      Icon: HeadphonesRound,
      color: "#06B6D4",
      iconBg: "rgba(6,182,212,0.15)",
    };
  if (n.includes("read"))
    return {
      Icon: BookBookmark,
      color: "#10B981",
      iconBg: "rgba(16,185,129,0.15)",
    };
  if (n.includes("writ"))
    return {
      Icon: Pen,
      color: "#3B82F6",
      iconBg: "rgba(59,130,246,0.15)",
    };
  return null;
};
import { coursesApi, tutorApi, studentApi } from "../../api";
import VideoModal from "../../components/VideoModal/VideoModal";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const formatDuration = (timeStr) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length !== 3) return timeStr;
  const h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return timeStr;
};

const formatPrice = (price, currency) => {
  if (currency === "VND" || !currency) {
    return price?.toLocaleString("vi-VN") + "₫";
  }
  return "$" + price;
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const colors = useThemeColors();
  const { theme } = useTheme();
  const user = useSelector(selectUser);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [tutorInfo, setTutorInfo] = useState(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const instructorRef = useRef(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [reviewStudents, setReviewStudents] = useState({});
  const PAGE_SIZE = 5;

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const params = user?.studentId ? { studentId: user.studentId } : {};
        const res = await coursesApi.getCourseById(id, params);
        setCourse(res.data);
        setIsEnrolled(!!user?.studentId && res.data?.isEnrollment === true);
        if (res.data?.tutorId) {
          try {
            const tutorRes = await tutorApi.getTutorById(res.data.tutorId);
            setTutorInfo(tutorRes.data);
          } catch (tutorErr) {
            console.error("Failed to fetch tutor:", tutorErr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const res = await coursesApi.getCourseReviews({
          CourseId: id,
          "page-index": 1,
          "page-size": PAGE_SIZE,
        });
        const items = res?.data?.items || [];
        setReviews(items);
        const total =
          res?.data?.totalCount ?? res?.data?.totalItems ?? items.length;
        setReviewsHasMore(total > PAGE_SIZE);
        setReviewsPage(1);
        // Fetch student info for each review
        const studentIds = [
          ...new Set(
            items
              .filter((r) => !r.isAnonymous && r.studentId)
              .map((r) => r.studentId),
          ),
        ];
        const studentMap = {};
        await Promise.all(
          studentIds.map(async (sid) => {
            try {
              const sRes = await studentApi.getStudentById(sid);
              studentMap[sid] = sRes?.data || sRes;
            } catch {
              /* ignore */
            }
          }),
        );
        setReviewStudents(studentMap);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    if (id) fetchReviews();
  }, [id]);

  const handleLoadMoreReviews = async () => {
    try {
      setReviewsLoadingMore(true);
      const nextPage = reviewsPage + 1;
      const res = await coursesApi.getCourseReviews({
        CourseId: id,
        "page-index": nextPage,
        "page-size": PAGE_SIZE,
      });
      const items = res?.data?.items || [];
      setReviews((prev) => [...prev, ...items]);
      const total =
        res?.data?.totalCount ??
        res?.data?.totalItems ??
        reviews.length + items.length;
      setReviewsHasMore(reviews.length + items.length < total);
      setReviewsPage(nextPage);
      // Fetch student info for new reviews
      const newStudentIds = [
        ...new Set(
          items
            .filter(
              (r) =>
                !r.isAnonymous && r.studentId && !reviewStudents[r.studentId],
            )
            .map((r) => r.studentId),
        ),
      ];
      if (newStudentIds.length > 0) {
        const newMap = { ...reviewStudents };
        await Promise.all(
          newStudentIds.map(async (sid) => {
            try {
              const sRes = await studentApi.getStudentById(sid);
              newMap[sid] = sRes?.data || sRes;
            } catch {
              /* ignore */
            }
          }),
        );
        setReviewStudents(newMap);
      }
    } catch {
      // ignore
    } finally {
      setReviewsLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.background.light }}
      >
        <Header />
        <CourseDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.background.light }}
      >
        <Header />
        <div className="flex flex-col items-center justify-center py-32 px-6">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: colors.text.primary }}
          >
            {t("courses.detail.notFound")}
          </h2>
          <Button
            color="primary"
            variant="flat"
            startContent={<AltArrowLeft weight="BoldDuotone" size={18} />}
            onPress={() => navigate("/courses")}
          >
            {t("courses.detail.backToCourses")}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const duration = formatDuration(course.estimatedTimeLesson);
  const skillCats = (course.courseCategories || []).filter((c) =>
    getSkillStyle(c.categoryName),
  );
  const purposeCats = (course.courseCategories || []).filter(
    (c) => !getSkillStyle(c.categoryName),
  );
  const outcomes = course.outcomes
    ? course.outcomes
        .split(/[;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const modules = (course.courseCourseModules || []).sort(
    (a, b) => a.moduleNumber - b.moduleNumber,
  );
  const totalSessions = modules.reduce(
    (sum, m) => sum + (m.courseModuleCourseSessions?.length || 0),
    0,
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background.light }}
    >
      <Header />

      {/* Hero Banner */}
      <section
        className="relative pb-32 lg:pb-16 pt-10 px-6 md:px-12"
        style={{
          background:
            theme === "dark"
              ? colors.background.page
              : "linear-gradient(to bottom, #FFFFFF, #DBEAFE)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Course Info */}
            <div className="lg:col-span-2">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Chip
                  size="sm"
                  style={{
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(59, 130, 246, 0.1)",
                    color: theme === "dark" ? "#fff" : colors.primary.main,
                  }}
                >
                  {course.level}
                </Chip>
                {skillCats.map((cat) => {
                  const { Icon, color, iconBg } = getSkillStyle(
                    cat.categoryName,
                  );
                  return (
                    <Chip
                      key={cat.categoryId}
                      size="sm"
                      variant="flat"
                      startContent={
                        <Icon
                          size={13}
                          weight="BoldDuotone"
                          style={{ color }}
                        />
                      }
                      style={{ backgroundColor: iconBg, color }}
                    >
                      {cat.categoryName}
                    </Chip>
                  );
                })}
                {purposeCats.map((cat) => (
                  <Chip
                    key={cat.categoryId}
                    size="sm"
                    variant="flat"
                    className="cursor-pointer"
                    style={{
                      backgroundColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : colors.background.gray,
                      color:
                        theme === "dark"
                          ? "rgba(255,255,255,0.7)"
                          : colors.text.secondary,
                    }}
                    onClick={() =>
                      navigate(`/courses?category=${cat.categoryId}`)
                    }
                  >
                    {cat.categoryName}
                  </Chip>
                ))}
              </div>

              {/* Title */}
              <h1
                className="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
                style={{
                  color: theme === "dark" ? "#fff" : colors.text.primary,
                }}
              >
                {course.title}
              </h1>

              {/* Description */}
              <p
                className="text-base mb-6 max-w-2xl leading-relaxed"
                style={{
                  color:
                    theme === "dark"
                      ? "rgba(255,255,255,0.8)"
                      : colors.text.secondary,
                }}
              >
                {course.shortDescription}
              </p>

              {/* Rating + Stats */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        weight="BoldDuotone"
                        style={{
                          color:
                            i < Math.floor(course.ratingAverage || 0)
                              ? "#F59E0B"
                              : theme === "dark"
                                ? "rgba(255,255,255,0.3)"
                                : "rgba(0,0,0,0.1)",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="font-semibold text-sm"
                    style={{
                      color: theme === "dark" ? "#fff" : colors.text.primary,
                    }}
                  >
                    {course.ratingAverage || 0}
                  </span>
                  <span
                    className="text-sm"
                    style={{
                      color:
                        theme === "dark"
                          ? "rgba(255,255,255,0.6)"
                          : colors.text.secondary,
                    }}
                  >
                    ({course.ratingCount?.toLocaleString() || 0}{" "}
                    {t("courses.detail.ratings")})
                  </span>
                </div>
                <span
                  className="text-sm flex items-center gap-1.5"
                  style={{
                    color:
                      theme === "dark"
                        ? "rgba(255,255,255,0.6)"
                        : colors.text.secondary,
                  }}
                >
                  <UsersGroupRounded size={16} weight="BoldDuotone" />
                  {course.numberOfEnrollment?.toLocaleString() || 0}{" "}
                  {t("courses.detail.students")}
                </span>
              </div>

              {/* Instructor name */}
              {tutorInfo && (
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="text-sm"
                    style={{
                      color:
                        theme === "dark"
                          ? "rgba(255,255,255,0.6)"
                          : colors.text.secondary,
                    }}
                  >
                    {t("courses.detail.instructor")}:
                  </span>
                  <button
                    type="button"
                    className="text-sm font-medium hover:underline"
                    style={{
                      color: theme === "dark" ? "#fff" : colors.primary.main,
                    }}
                    onClick={() =>
                      instructorRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    }
                  >
                    {tutorInfo.user?.firstName} {tutorInfo.user?.lastName}
                  </button>
                </div>
              )}
            </div>

            {/* Right: empty space for the sticky card to overlap */}
            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section
        className="px-6 md:px-12 pb-10"
        style={{ backgroundColor: colors.background.light }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Course Info */}
            <div className="lg:col-span-2 space-y-8 pt-10">
              {/* About This Course */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card
                  className="shadow-none"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <CardBody className="p-6">
                    <h2
                      className="font-semibold text-xl mb-4"
                      style={{ color: colors.text.primary }}
                    >
                      {t("courses.detail.aboutCourse")}
                    </h2>
                    <p
                      className="leading-relaxed"
                      style={{ color: colors.text.secondary }}
                    >
                      {course.fullDescription || course.shortDescription}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>

              {/* What You'll Learn */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card
                  className="shadow-none"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <CardBody className="p-6">
                    <h2
                      className="font-semibold text-xl mb-4"
                      style={{ color: colors.text.primary }}
                    >
                      {t("courses.detail.whatYouLearn")}
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {outcomes.length > 0
                        ? outcomes.map((item, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{
                                  backgroundColor:
                                    colors.background.primaryLight,
                                }}
                              >
                                <Check
                                  size={14}
                                  weight="BoldDuotone"
                                  style={{ color: colors.primary.main }}
                                />
                              </div>
                              <span style={{ color: colors.text.secondary }}>
                                {item}
                              </span>
                            </div>
                          ))
                        : [
                            t("courses.detail.learn1"),
                            t("courses.detail.learn2"),
                            t("courses.detail.learn3"),
                            t("courses.detail.learn4"),
                          ].map((item, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{
                                  backgroundColor:
                                    colors.background.primaryLight,
                                }}
                              >
                                <Check
                                  size={14}
                                  weight="BoldDuotone"
                                  style={{ color: colors.primary.main }}
                                />
                              </div>
                              <span style={{ color: colors.text.secondary }}>
                                {item}
                              </span>
                            </div>
                          ))}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>

              {/* Course Curriculum */}
              {modules.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  <Card
                    className="shadow-none"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <CardBody className="p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h2
                          className="font-semibold text-xl"
                          style={{ color: colors.text.primary }}
                        >
                          {t("courses.detail.courseCurriculum")}
                        </h2>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {modules.length} {t("courses.detail.modules")} ·{" "}
                          {totalSessions} {t("courses.detail.sessions")}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {modules.map((mod, idx) => {
                          const isExpanded = expandedModules[mod.id];
                          const sessions = (
                            mod.courseModuleCourseSessions || []
                          ).sort((a, b) => a.sessionNumber - b.sessionNumber);
                          return (
                            <div
                              key={mod.id}
                              className="rounded-xl overflow-hidden border"
                              style={{ borderColor: colors.border.light }}
                            >
                              <button
                                type="button"
                                className="w-full flex items-center justify-between p-4 text-left"
                                style={{
                                  backgroundColor: colors.background.light,
                                }}
                                onClick={() => toggleModule(mod.id)}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{
                                      backgroundColor: colors.primary.main,
                                      color: "#fff",
                                    }}
                                  >
                                    <span className="text-sm font-bold">
                                      {idx + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className="font-semibold text-sm truncate"
                                      style={{ color: colors.text.primary }}
                                    >
                                      {mod.moduleTitle}
                                    </p>
                                    <p
                                      className="text-xs mt-0.5"
                                      style={{ color: colors.text.tertiary }}
                                    >
                                      {sessions.length}{" "}
                                      {t("courses.detail.sessions")}
                                    </p>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <AltArrowUp
                                    size={18}
                                    weight="BoldDuotone"
                                    style={{ color: colors.text.secondary }}
                                  />
                                ) : (
                                  <AltArrowDown
                                    size={18}
                                    weight="BoldDuotone"
                                    style={{ color: colors.text.secondary }}
                                  />
                                )}
                              </button>
                              {isExpanded && (
                                <div
                                  className="px-4 pb-4 pt-2"
                                  style={{
                                    backgroundColor: colors.background.light,
                                  }}
                                >
                                  {mod.moduleDescription && (
                                    <p
                                      className="text-sm mb-3 leading-relaxed"
                                      style={{ color: colors.text.secondary }}
                                    >
                                      {mod.moduleDescription}
                                    </p>
                                  )}
                                  {sessions.length === 0 ? (
                                    <p
                                      className="text-xs text-center py-3"
                                      style={{ color: colors.text.tertiary }}
                                    >
                                      {t("courses.detail.noSessions")}
                                    </p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {sessions.map((sess) => (
                                        <div
                                          key={sess.id}
                                          className="rounded-lg p-3"
                                          style={{
                                            backgroundColor:
                                              colors.background.gray,
                                          }}
                                        >
                                          <div className="flex items-start gap-3">
                                            <div
                                              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                              style={{
                                                backgroundColor:
                                                  colors.background
                                                    .primaryLight,
                                              }}
                                            >
                                              <Play
                                                size={12}
                                                weight="BoldDuotone"
                                                style={{
                                                  color: colors.primary.main,
                                                }}
                                              />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p
                                                className="font-medium text-sm"
                                                style={{
                                                  color: colors.text.primary,
                                                }}
                                              >
                                                {sess.sessionNumber}.{" "}
                                                {sess.sessionTitle}
                                              </p>
                                              {sess.sessionDescription && (
                                                <p
                                                  className="text-xs mt-1 leading-relaxed"
                                                  style={{
                                                    color:
                                                      colors.text.secondary,
                                                  }}
                                                >
                                                  {sess.sessionDescription}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              )}

              {/* About the Instructor */}
              {tutorInfo && (
                <motion.div
                  ref={instructorRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card
                    className="shadow-none"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <CardBody className="p-6">
                      <h2
                        className="font-semibold text-xl mb-4"
                        style={{ color: colors.text.primary }}
                      >
                        {t("courses.detail.aboutInstructor")}
                      </h2>
                      <button
                        type="button"
                        className="flex items-center gap-4 mb-4 w-full text-left group cursor-pointer"
                        onClick={() => {
                          if (user?.tutorId === course?.tutorId) {
                            navigate("/tutor/profile");
                          } else {
                            navigate(`/tutor-profile/${course?.tutorId}`);
                          }
                        }}
                      >
                        <Avatar
                          src={tutorInfo.avatar}
                          name={`${tutorInfo.user?.firstName} ${tutorInfo.user?.lastName}`}
                          size="lg"
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold text-lg group-hover:underline"
                            style={{ color: colors.primary.main }}
                          >
                            {tutorInfo.user?.firstName}{" "}
                            {tutorInfo.user?.lastName}
                            <AltArrowRight
                              weight="BoldDuotone"
                              size={16}
                              className="inline-block ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </p>
                          {tutorInfo.headline && (
                            <p
                              className="text-sm mt-0.5"
                              style={{ color: colors.text.secondary }}
                            >
                              {tutorInfo.headline}
                            </p>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <Star
                            size={18}
                            weight="BoldDuotone"
                            style={{ color: "#f59e0b" }}
                          />
                          <span
                            className="font-semibold text-sm"
                            style={{ color: colors.text.primary }}
                          >
                            {tutorInfo.ratingAverage?.toFixed(1) || "0.0"}
                          </span>
                          <span
                            className="text-sm"
                            style={{ color: colors.text.tertiary }}
                          >
                            ({tutorInfo.ratingCount || 0}{" "}
                            {t("courses.detail.reviews")})
                          </span>
                        </div>
                        {tutorInfo.monthExperience > 0 && (
                          <div className="flex items-center gap-1">
                            <ClockCircle
                              weight="BoldDuotone"
                              size={18}
                              style={{ color: colors.primary.main }}
                            />
                            <span
                              className="text-sm"
                              style={{ color: colors.text.secondary }}
                            >
                              {tutorInfo.monthExperience}{" "}
                              {t("courses.detail.monthsExperience")}
                            </span>
                          </div>
                        )}
                      </div>
                      {tutorInfo.bio && (
                        <p
                          className="text-sm leading-relaxed whitespace-pre-wrap"
                          style={{ color: colors.text.secondary }}
                        >
                          {tutorInfo.bio}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </motion.div>
              )}

              {/* Student Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <Card
                  className="shadow-none"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <CardBody className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h2
                        className="text-lg font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("studentDashboard.myCourses.courseReview")}
                      </h2>
                      {reviews.length > 0 && (
                        <span
                          className="text-sm"
                          style={{ color: colors.text.tertiary }}
                        >
                          ({reviews.length})
                        </span>
                      )}
                    </div>

                    {reviewsLoading ? (
                      <div className="flex justify-center py-6">
                        <Spinner size="sm" color="primary" />
                      </div>
                    ) : reviews.length === 0 ? (
                      <p
                        className="text-sm text-center py-4"
                        style={{ color: colors.text.tertiary }}
                      >
                        {t("courses.detail.noReviews")}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="p-4 rounded-xl"
                            style={{ backgroundColor: colors.background.light }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar
                                size="sm"
                                src={
                                  review.isAnonymous
                                    ? undefined
                                    : reviewStudents[review.studentId]?.avatar
                                }
                                name={
                                  review.isAnonymous
                                    ? t("courses.detail.anonymous")
                                    : `${reviewStudents[review.studentId]?.user?.firstName ?? ""} ${reviewStudents[review.studentId]?.user?.lastName ?? ""}`
                                }
                                className="w-8 h-8 text-xs"
                              />
                              <div>
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: colors.text.primary }}
                                >
                                  {review.isAnonymous
                                    ? t("courses.detail.anonymous")
                                    : `${reviewStudents[review.studentId]?.user?.firstName ?? ""} ${reviewStudents[review.studentId]?.user?.lastName ?? ""}`}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {review.createdAt
                                    ? new Date(
                                        review.createdAt,
                                      ).toLocaleDateString(dateLocale, {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-0.5 ml-auto">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={14}
                                    weight="BoldDuotone"
                                    color={
                                      s <= review.rating
                                        ? "#FBBF24"
                                        : colors.text.tertiary
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p
                                className="text-sm mt-1"
                                style={{ color: colors.text.secondary }}
                              >
                                {review.comment}
                              </p>
                            )}
                          </div>
                        ))}

                        {reviewsHasMore && (
                          <div className="flex justify-center mt-2">
                            <Button
                              size="sm"
                              variant="flat"
                              isLoading={reviewsLoadingMore}
                              onPress={handleLoadMoreReviews}
                              style={{ color: colors.primary.main }}
                            >
                              {t("courses.detail.loadMoreReviews")}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Sticky Price Card (overlaps banner) */}
            <div className="lg:col-span-1 lg:-mt-56">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:sticky lg:top-24"
              >
                <Card
                  className="shadow-lg overflow-hidden"
                  style={{
                    background:
                      theme === "dark"
                        ? colors.background.gray
                        : colors.background.card,
                  }}
                >
                  {/* Course image preview */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={
                        course.thumbnailUrl ||
                        "https://placehold.co/400x200?text=No+Image"
                      }
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    {course.demoVideoUrl && (
                      <button
                        onClick={() => setVideoOpen(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                          <Play
                            size={24}
                            weight="BoldDuotone"
                            style={{ color: colors.primary.main }}
                          />
                        </div>
                      </button>
                    )}
                  </div>

                  <CardBody className="p-6 space-y-5">
                    {/* Price */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className="text-4xl font-bold"
                          style={{ color: colors.primary.main }}
                        >
                          {formatPrice(course.price, course.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Enroll Button */}
                    {user?.tutorId && user.tutorId === course.tutorId ? (
                      <Button
                        size="lg"
                        className="w-full font-semibold text-base"
                        variant="flat"
                        style={{
                          backgroundColor: colors.background.primaryLight,
                          color: colors.primary.main,
                        }}
                        onPress={() => navigate("/tutor/my-courses")}
                      >
                        {t("courses.detail.viewMyCourse")}
                      </Button>
                    ) : isEnrolled ? (
                      <Button
                        size="lg"
                        className="w-full font-semibold text-base"
                        variant="flat"
                        style={{
                          backgroundColor: colors.background.primaryLight,
                          color: colors.primary.main,
                        }}
                        onPress={() =>
                          navigate(`/student/courses/${course.id}`)
                        }
                      >
                        {t("courses.detail.alreadyEnrolled")}
                      </Button>
                    ) : (
                      <Button
                        color="primary"
                        size="lg"
                        className="w-full font-semibold text-base"
                        onPress={() =>
                          user
                            ? navigate(`/checkout/${course.id}`)
                            : navigate("/login")
                        }
                      >
                        {t("courses.detail.enrollNow")}
                      </Button>
                    )}

                    <Divider />

                    {/* Quick Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className="flex items-center gap-2"
                          style={{ color: colors.text.secondary }}
                        >
                          <ClockCircle size={16} weight="BoldDuotone" />
                          {t("courses.detail.totalDuration")}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {formatDuration(course.estimatedTime) || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className="flex items-center gap-2"
                          style={{ color: colors.text.secondary }}
                        >
                          <ClockCircle size={16} weight="BoldDuotone" />
                          {t("courses.detail.timePerLesson")}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {duration || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className="flex items-center gap-2"
                          style={{ color: colors.text.secondary }}
                        >
                          <BookBookmark size={16} weight="BoldDuotone" />
                          {t("courses.detail.level")}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {course.level}
                        </span>
                      </div>
                      {course.numsSessionInWeek > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span
                            className="flex items-center gap-2"
                            style={{ color: colors.text.secondary }}
                          >
                            <ClockCircle size={16} weight="BoldDuotone" />
                            {t("courses.detail.sessionsPerWeek")}
                          </span>
                          <span
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {course.numsSessionInWeek}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className="flex items-center gap-2"
                          style={{ color: colors.text.secondary }}
                        >
                          <UsersGroupRounded size={16} weight="BoldDuotone" />
                          {t("courses.detail.studentsEnrolled")}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {course.numberOfEnrollment?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className="flex items-center gap-2"
                          style={{ color: colors.text.secondary }}
                        >
                          <Diploma size={16} weight="BoldDuotone" />
                          {t("courses.detail.certificate")}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {course.isCertificate
                            ? t("courses.detail.yes")
                            : t("courses.detail.no")}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <VideoModal
        isOpen={videoOpen}
        onOpenChange={setVideoOpen}
        videoUrl={course?.demoVideoUrl}
      />
    </div>
  );
};

export default CourseDetail;
