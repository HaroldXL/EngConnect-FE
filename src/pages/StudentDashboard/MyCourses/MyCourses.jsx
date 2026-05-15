import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store";
import { coursesApi } from "../../../api";
import { Input, Spinner, Chip, Tabs, Tab } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";
import { MinimalisticMagnifier } from "@solar-icons/react"

import CourseCard from "../../../components/CourseCard/CourseCard";
import CourseCardSkeleton from "../../../components/CourseCardSkeleton/CourseCardSkeleton";
import searchIllustration from "../../../assets/illustrations/search.avif";

const MyCourses = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { filterInputClassNames, filterTabsClassNames } = useInputStyles();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        "page-size": 50,
        StudentId: user?.studentId,
        Status: selectedTab === "all" ? "InProgress, Completed" : selectedTab,
      };
      if (searchQuery.trim()) params["search-term"] = searchQuery.trim();
      const res = await coursesApi.getAllCourseEnrollments(params);
      const items = (res?.data?.items || []).map((enrollment) => ({
        ...enrollment.course,
        enrollmentStatus: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        expiredAt: enrollment.expiredAt,
        numOfCompleteSession: enrollment.numOfCompleteSession ?? 0,
        numsOfSession: enrollment.numsOfSession ?? 0,
      }));
      setCourses(items);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.studentId, searchQuery, selectedTab]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const getStatusColor = (status) => {
    switch (status) {
      case "InProgress":
        return colors.state.success;
      case "Completed":
        return colors.state.info;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "InProgress":
        return t("studentDashboard.myCourses.inProgress");
      case "Completed":
        return t("studentDashboard.myCourses.completed");
      default:
        return status || "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <h1
          className="text-2xl lg:text-3xl font-bold mb-2"
          style={{ color: colors.text.primary }}
        >
          {t("studentDashboard.myCourses.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("studentDashboard.myCourses.subtitle")}
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Input
          placeholder={t("studentDashboard.myCourses.searchPlaceholder")}
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={
            <MinimalisticMagnifier weight="BoldDuotone"
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
          color="primary"
          classNames={filterTabsClassNames}
        >
          <Tab key="all" title={t("studentDashboard.myCourses.all")} />
          <Tab
            key="InProgress"
            title={t("studentDashboard.myCourses.inProgress")}
          />
          <Tab
            key="Completed"
            title={t("studentDashboard.myCourses.completed")}
          />
        </Tabs>
      </motion.div>

      {/* Course Grid */}
      {loading ? (
        <CourseCardSkeleton
          count={8}
          gridClassName="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          cardBgColor={colors.background.light}
          showProgress
        />
      ) : courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col items-center justify-center gap-4 py-12"
        >
          <img
            src={searchIllustration}
            alt="No courses"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            className="w-68 h-68 object-contain"
          />
          <h3
            className="text-xl font-semibold"
            style={{ color: colors.text.primary }}
          >
            {t("studentDashboard.myCourses.emptyTitle")}
          </h3>
          <p
            className="text-center max-w-sm"
            style={{ color: colors.text.secondary }}
          >
            {t("studentDashboard.myCourses.emptySubtitle")}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              whileHover={{
                y: -8,
                transition: { type: "spring", stiffness: 400, damping: 25 },
              }}
            >
              <CourseCard
                course={course}
                showCategory={true}
                showTutorInfo={false}
                variant="compact"
                basePath="/student/courses"
                progress={{
                  completed: course.numOfCompleteSession,
                  total: course.numsOfSession,
                }}
                statusBadge={
                  course.enrollmentStatus
                    ? {
                        label: getStatusLabel(course.enrollmentStatus),
                        color: getStatusColor(course.enrollmentStatus),
                      }
                    : null
                }
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MyCourses;
