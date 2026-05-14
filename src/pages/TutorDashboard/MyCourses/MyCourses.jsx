import { useState, useEffect } from "react";
import { AddCircle, DocumentAdd, Magnifer } from "@solar-icons/react";
import { Button, Input, Tabs, Tab } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";

import CourseCard from "../../../components/CourseCard/CourseCard";
import CourseCardSkeleton from "../../../components/CourseCardSkeleton/CourseCardSkeleton";
import { coursesApi } from "../../../api";
import IconsDrawingImage from "../../../assets/illustrations/icons-drawing.avif";

const MyCourses = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { filterInputClassNames, filterTabsClassNames } = useInputStyles();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await coursesApi.getMyCourses({ "page-size": 50 });
        setCourses(res?.data?.items || []);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "published":
        return colors.state.success;
      case "draft":
        return colors.state.warning;
      case "pending":
        return colors.state.info;
      case "inactive":
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "published":
        return t("tutorDashboard.myCourses.published");
      case "draft":
        return t("tutorDashboard.myCourses.draft");
      case "pending":
        return t("tutorDashboard.myCourses.pending");
      case "inactive":
        return t("tutorDashboard.myCourses.inactive");
      default:
        return status || "";
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesTab =
      selectedTab === "all" || course.status?.toLowerCase() === selectedTab;
    const matchesSearch =
      !searchQuery ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {t("tutorDashboard.myCourses.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("tutorDashboard.myCourses.subtitle")}
          </p>
        </div>
        <Button
          color="primary"
          startContent={
            <DocumentAdd weight="BoldDuotone" className="w-5 h-5" />
          }
          style={{
            backgroundColor: colors.primary.main,
            color: colors.text.white,
          }}
          onPress={() => navigate("/tutor/create-course")}
        >
          {t("tutorDashboard.myCourses.createCourse")}
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Input
          placeholder={t("tutorDashboard.myCourses.searchPlaceholder")}
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={
            <Magnifer
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
          //variant="light"
          color="primary"
          classNames={filterTabsClassNames}
        >
          <Tab key="all" title={t("tutorDashboard.myCourses.all")} />
          <Tab
            key="published"
            title={t("tutorDashboard.myCourses.published")}
          />
          <Tab key="draft" title={t("tutorDashboard.myCourses.draft")} />
          <Tab key="pending" title={t("tutorDashboard.myCourses.pending")} />
          <Tab key="inactive" title={t("tutorDashboard.myCourses.inactive")} />
        </Tabs>
      </motion.div>

      {/* Courses Grid */}
      {loading ? (
        <CourseCardSkeleton
          count={8}
          gridClassName="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          cardBgColor={colors.background.light}
        />
      ) : courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col items-center justify-center gap-4"
        >
          <img
            src={IconsDrawingImage}
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
            {t("tutorDashboard.myCourses.emptyTitle")}
          </h3>
          <p
            className="text-center max-w-sm"
            style={{ color: colors.text.secondary }}
          >
            {t("tutorDashboard.myCourses.emptySubtitle")}
          </p>
          <Button
            color="primary"
            startContent={
              <DocumentAdd weight="BoldDuotone" className="w-5 h-5" />
            }
            style={{
              backgroundColor: colors.primary.main,
              color: colors.text.white,
            }}
            onPress={() => navigate("/tutor/create-course")}
          >
            {t("tutorDashboard.myCourses.createCourse")}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredCourses.map((course) => (
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
                basePath="/tutor/courses"
                statusBadge={{
                  label: getStatusLabel(course.status),
                  color: getStatusColor(course.status),
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MyCourses;
