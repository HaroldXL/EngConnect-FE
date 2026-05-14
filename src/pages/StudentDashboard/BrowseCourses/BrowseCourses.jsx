import { useState, useEffect } from "react";
import { Input, Chip, Select, SelectItem } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";
import { Magnifer } from "@solar-icons/react"

import CourseCard from "../../../components/CourseCard/CourseCard";
import CourseCardSkeleton from "../../../components/CourseCardSkeleton/CourseCardSkeleton";
import { coursesApi } from "../../../api";

const BrowseCourses = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { selectClassNames, filterInputClassNames } = useInputStyles();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [courses, setCourses] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, categoriesRes] = await Promise.allSettled([
          coursesApi.getAllCourses({ Status: "Published", "page-size": 50 }),
          coursesApi.getCategories({ "page-size": 50 }),
        ]);
        if (coursesRes.status === "fulfilled") {
          setCourses(coursesRes.value?.data?.items || []);
        }
        if (categoriesRes.status === "fulfilled") {
          setApiCategories(categoriesRes.value?.data?.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = [
    { key: "all", label: t("studentDashboard.browseCourses.categories.all") },
    ...apiCategories.map((cat) => ({ key: cat.id, label: cat.name })),
  ];

  const levels = [
    { key: "all", label: t("studentDashboard.browseCourses.levels.all") },
    {
      key: "beginner",
      label: t("studentDashboard.browseCourses.levels.beginner"),
    },
    {
      key: "intermediate",
      label: t("studentDashboard.browseCourses.levels.intermediate"),
    },
    {
      key: "advanced",
      label: t("studentDashboard.browseCourses.levels.advanced"),
    },
  ];

  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === "all" ||
      course.courseCategories?.some(
        (cat) => cat.categoryId === selectedCategory,
      );
    const matchesLevel =
      selectedLevel === "all" || course.level?.toLowerCase() === selectedLevel;
    const matchesSearch =
      !searchQuery ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLevel && matchesSearch;
  });

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
          {t("studentDashboard.browseCourses.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("studentDashboard.browseCourses.subtitle")}
        </p>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        <Input
          placeholder={t("studentDashboard.browseCourses.searchPlaceholder")}
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={
            <Magnifer weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.text.secondary }}
            />
          }
          classNames={filterInputClassNames}
          className="flex-1"
        />

        <div className="flex gap-3">
          <Select
            placeholder={t("studentDashboard.browseCourses.category")}
            selectedKeys={[selectedCategory]}
            onSelectionChange={(keys) => setSelectedCategory([...keys][0])}
            className="w-40"
            classNames={selectClassNames}
          >
            {categories.map((cat) => (
              <SelectItem key={cat.key}>{cat.label}</SelectItem>
            ))}
          </Select>

          <Select
            placeholder={t("studentDashboard.browseCourses.level")}
            selectedKeys={[selectedLevel]}
            onSelectionChange={(keys) => setSelectedLevel([...keys][0])}
            className="w-40"
            classNames={selectClassNames}
          >
            {levels.map((level) => (
              <SelectItem key={level.key}>{level.label}</SelectItem>
            ))}
          </Select>
        </div>
      </motion.div>

      {/* Category Chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-wrap gap-2"
      >
        {categories.map((cat) => (
          <Chip
            key={cat.key}
            variant={selectedCategory === cat.key ? "solid" : "flat"}
            className="cursor-pointer"
            style={{
              backgroundColor:
                selectedCategory === cat.key
                  ? colors.primary.main
                  : colors.background.light,
              color:
                selectedCategory === cat.key
                  ? colors.text.white
                  : colors.text.primary,
            }}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </Chip>
        ))}
      </motion.div>

      {/* Course Grid */}
      {loading ? (
        <CourseCardSkeleton
          count={8}
          gridClassName="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          cardBgColor={colors.background.light}
        />
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
                variant="compact"
                basePath="/student/courses"
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default BrowseCourses;
