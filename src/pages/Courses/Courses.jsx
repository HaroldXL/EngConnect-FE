import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AltArrowDown,
  AltArrowRight,
  AltArrowUp,
  CloseSquare,
  Diploma,
  Filter,
  GraphUp,
  Lightning,
  MagicStick,
  MinimalisticMagnifier,
  Stars2,
  Target,
} from "@solar-icons/react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Pagination,
} from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as MotionLib from "framer-motion";
import CourseCardSkeleton from "../../components/CourseCardSkeleton/CourseCardSkeleton";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import CourseCard from "../../components/CourseCard/CourseCard";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";
import useInputStyles from "../../hooks/useInputStyles";
import { coursesApi } from "../../api";

import CourseQuizModal from "../../components/CourseQuizModal/CourseQuizModal";
import readingImage from "../../assets/illustrations/boy-and-laptop.avif";
import searchImage from "../../assets/illustrations/search.avif";

// eslint-disable-next-line no-unused-vars
const { motion, AnimatePresence } = MotionLib;

const LEVELS = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Upper-Intermediate",
  "Advanced",
  "Beginner to Advanced",
];

const Courses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const initialQ = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(initialQ);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedCategories, setSelectedCategories] = useState(
    () =>
      new Set(
        searchParams.get("category") ? [searchParams.get("category")] : [],
      ),
  );
  const [selectedLevels, setSelectedLevels] = useState(new Set());
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;
  const { inputClassNames, selectClassNames } = useInputStyles();

  // Sidebar collapse states
  const [skillOpen, setSkillOpen] = useState(true);
  const [purposeOpen, setPurposeOpen] = useState(true);
  const [levelOpen, setLevelOpen] = useState(true);
  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  // Serialize Sets for query keys (Sets are not serializable)
  const selectedCategoriesArr = useMemo(
    () => [...selectedCategories].sort(),
    [selectedCategories],
  );
  const selectedLevelsArr = useMemo(
    () => [...selectedLevels].sort(),
    [selectedLevels],
  );

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategoriesArr, selectedLevelsArr, sortBy]);

  // Categories — cached 5 min (inherits QueryClient default)
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      coursesApi
        .getCategories({ "page-size": 50 })
        .then((r) => r?.data?.items || []),
  });
  const categories = categoriesData ?? [];

  const skillCategories = useMemo(
    () => categories.filter((c) => c.type === "Skill"),
    [categories],
  );
  const purposeCategories = useMemo(
    () =>
      categories
        .filter((c) => c.type === "Purpose")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  // Courses — re-fetch when search/page/filters change; shorter stale time
  const hasFilters = selectedCategories.size > 0 || selectedLevels.size > 0;
  const { data: coursesData, isLoading: loading } = useQuery({
    queryKey: [
      "courses",
      searchQuery,
      page,
      selectedCategoriesArr,
      selectedLevelsArr,
    ],
    queryFn: () => {
      const params = { Status: "Published" };
      if (hasFilters) {
        params["page-size"] = 200;
        params.page = 1;
      } else {
        params["page-size"] = PAGE_SIZE;
        params.page = page;
      }
      if (searchQuery.trim()) params["search-term"] = searchQuery.trim();
      return coursesApi.getAllCourses(params).then((r) => r?.data ?? {});
    },
    staleTime: 2 * 60 * 1000,
  });

  const courses = coursesData?.items ?? [];
  const totalPages = hasFilters
    ? 1
    : Math.max(1, Math.ceil((coursesData?.totalItems ?? 0) / PAGE_SIZE));

  const toggleCategory = (id) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLevel = (level) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const filteredCourses = useMemo(() => {
    let result = courses.filter((course) => {
      const categoryMatch =
        selectedCategories.size === 0 ||
        course.courseCategories?.some((cat) =>
          selectedCategories.has(cat.categoryId),
        );
      const levelMatch =
        selectedLevels.size === 0 || selectedLevels.has(course.level);
      return categoryMatch && levelMatch;
    });

    if (sortBy === "newest") {
      result = [...result].sort(
        (a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0),
      );
    } else if (sortBy === "popular") {
      result = [...result].sort(
        (a, b) => (b.totalStudents || 0) - (a.totalStudents || 0),
      );
    } else if (sortBy === "priceAsc") {
      result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "priceDesc") {
      result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [courses, selectedCategories, selectedLevels, sortBy]);

  const benefits = [
    {
      icon: (props) => <Target weight="BoldDuotone" {...props} />,
      title: t("courses.benefits.personalized.title"),
      description: t("courses.benefits.personalized.description"),
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      icon: (props) => <Lightning weight="BoldDuotone" {...props} />,
      title: t("courses.benefits.practical.title"),
      description: t("courses.benefits.practical.description"),
      color: "#F59E0B",
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
    {
      icon: (props) => <GraphUp weight="BoldDuotone" {...props} />,
      title: t("courses.benefits.progress.title"),
      description: t("courses.benefits.progress.description"),
      color: "#10B981",
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
      icon: (props) => <Diploma weight="BoldDuotone" {...props} />,
      title: t("courses.benefits.certificate.title"),
      description: t("courses.benefits.certificate.description"),
      color: "#8B5CF6",
      bgColor: "rgba(139, 92, 246, 0.1)",
    },
  ];

  const hasActiveFilters =
    selectedCategories.size > 0 ||
    selectedLevels.size > 0 ||
    searchQuery !== "";

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <div className="space-y-1">
      {/* By Skill Section */}
      {skillCategories.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: colors.background.gray }}
        >
          <button
            className="w-full flex items-center justify-between p-4 transition-colors hover:opacity-80"
            onClick={() => setSkillOpen(!skillOpen)}
          >
            <span
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: colors.text.primary }}
            >
              By Skill
            </span>
            {skillOpen ? (
              <AltArrowUp
                weight="BoldDuotone"
                size={16}
                style={{ color: colors.text.secondary }}
              />
            ) : (
              <AltArrowDown
                weight="BoldDuotone"
                size={16}
                style={{ color: colors.text.secondary }}
              />
            )}
          </button>
          {skillOpen && (
            <div className="px-2 pb-3 space-y-0.5">
              {skillCategories.map((cat) => {
                const isSelected = selectedCategories.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? `${colors.primary.main}15`
                        : "transparent",
                      color: isSelected
                        ? colors.primary.main
                        : colors.text.secondary,
                    }}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span className="text-sm font-medium">{cat.name}</span>
                    {isSelected && (
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: colors.primary.main }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path
                            d="M2 5l2 2 4-4"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* By Purpose Section */}
      {purposeCategories.length > 0 && (
        <div
          className="rounded-xl overflow-hidden mt-2"
          style={{ backgroundColor: colors.background.gray }}
        >
          <button
            className="w-full flex items-center justify-between p-4 transition-colors hover:opacity-80"
            onClick={() => setPurposeOpen(!purposeOpen)}
          >
            <span
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: colors.text.primary }}
            >
              By Purpose
            </span>
            {purposeOpen ? (
              <AltArrowUp
                weight="BoldDuotone"
                size={16}
                style={{ color: colors.text.secondary }}
              />
            ) : (
              <AltArrowDown
                weight="BoldDuotone"
                size={16}
                style={{ color: colors.text.secondary }}
              />
            )}
          </button>
          {purposeOpen && (
            <div className="px-2 pb-3 space-y-0.5">
              {purposeCategories.map((cat) => {
                const isSelected = selectedCategories.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? `${colors.primary.main}15`
                        : "transparent",
                      color: isSelected
                        ? colors.primary.main
                        : colors.text.secondary,
                    }}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span className="text-sm font-medium">{cat.name}</span>
                    {isSelected && (
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: colors.primary.main }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path
                            d="M2 5l2 2 4-4"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Level Section */}
      <div
        className="rounded-xl overflow-hidden mt-4"
        style={{ backgroundColor: colors.background.gray }}
      >
        <button
          className="w-full flex items-center justify-between p-4 transition-colors hover:opacity-80"
          onClick={() => setLevelOpen(!levelOpen)}
        >
          <span
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: colors.text.primary }}
          >
            {t("courses.categories.level")}
          </span>
          {levelOpen ? (
            <AltArrowUp
              weight="BoldDuotone"
              size={16}
              style={{ color: colors.text.secondary }}
            />
          ) : (
            <AltArrowDown
              weight="BoldDuotone"
              size={16}
              style={{ color: colors.text.secondary }}
            />
          )}
        </button>
        {levelOpen && (
          <div className="px-2 pb-3 space-y-0.5">
            {LEVELS.map((level) => {
              const isSelected = selectedLevels.has(level);
              return (
                <button
                  key={level}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? `${colors.primary.main}15`
                      : "transparent",
                    color: isSelected
                      ? colors.primary.main
                      : colors.text.secondary,
                  }}
                  onClick={() => toggleLevel(level)}
                >
                  <span className="text-sm font-medium">{level}</span>
                  {isSelected && (
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: colors.primary.main }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5l2 2 4-4"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear all filters */}
      {hasActiveFilters && (
        <Button
          size="sm"
          variant="flat"
          className="w-full"
          style={{ color: colors.state.error }}
          startContent={<CloseSquare weight="BoldDuotone" size={14} />}
          onPress={() => {
            setSelectedCategories(new Set());
            setSelectedLevels(new Set());
          }}
        >
          {t("courses.search.clearFilters")}
        </Button>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background.light }}
    >
      <Header />

      {/* Hero Section — compact */}
      <section
        className="py-12 px-6 md:px-12"
        style={{
          background:
            theme === "dark"
              ? colors.background.page
              : "linear-gradient(to bottom, #FFFFFF, #DBEAFE)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left"
            >
              <span
                className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4"
                style={{
                  backgroundColor: colors.background.primaryLight,
                  color: colors.primary.main,
                }}
              >
                {t("courses.hero.badge")}
              </span>
              <h1
                className="text-4xl sm:text-5xl font-bold mb-3"
                style={{ color: colors.text.primary }}
              >
                {t("courses.hero.title")}{" "}
                <span style={{ color: colors.primary.main }}>
                  {t("courses.hero.titleHighlight")}
                </span>
              </h1>
              <p
                className="text-base max-w-xl mb-6"
                style={{ color: colors.text.secondary }}
              >
                {t("courses.hero.description")}
              </p>
              <div className="flex justify-center lg:justify-start">
                <Button
                  onPress={() => setQuizOpen(true)}
                  startContent={<Stars2 weight="BoldDuotone" size={18} />}
                  endContent={<AltArrowRight weight="BoldDuotone" size={18} />}
                  radius="full"
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                    fontWeight: 600,
                  }}
                  size="lg"
                >
                  {t("courses.quiz.heroButton")}
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:flex justify-center"
            >
              <img
                src={readingImage}
                alt="Learning courses"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full max-w-sm h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content — Sidebar + Courses Grid */}
      <section
        className="py-8 px-6 md:px-12"
        style={{ backgroundColor: colors.background.light }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Top bar: search + sort + mobile filter toggle */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder={t("courses.search.searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSearchQuery(searchInput.trim());
                }}
                startContent={
                  <MinimalisticMagnifier
                    weight="BoldDuotone"
                    size={18}
                    style={{ color: colors.text.secondary }}
                  />
                }
                endContent={
                  searchInput ? (
                    <button
                      onClick={() => {
                        setSearchInput("");
                        setSearchQuery("");
                      }}
                      className="hover:opacity-70"
                    >
                      <CloseSquare
                        weight="BoldDuotone"
                        size={16}
                        style={{ color: colors.text.tertiary }}
                      />
                    </button>
                  ) : null
                }
                classNames={inputClassNames}
                size="md"
              />
            </div>

            <div className="flex gap-2">
              <div className="w-48">
                <Select
                  aria-label={t("courses.categories.sortBy")}
                  selectedKeys={new Set([sortBy])}
                  onSelectionChange={(keys) =>
                    setSortBy([...keys][0] ?? "newest")
                  }
                  classNames={selectClassNames}
                  size="md"
                >
                  <SelectItem key="newest">
                    {t("courses.categories.sortNewest")}
                  </SelectItem>
                  <SelectItem key="popular">
                    {t("courses.categories.sortPopular")}
                  </SelectItem>
                  <SelectItem key="priceAsc">
                    {t("courses.categories.sortPriceAsc")}
                  </SelectItem>
                  <SelectItem key="priceDesc">
                    {t("courses.categories.sortPriceDesc")}
                  </SelectItem>
                </Select>
              </div>

              {/* Mobile filter toggle */}
              <Button
                isIconOnly
                variant="flat"
                className="lg:hidden"
                style={{
                  backgroundColor: sidebarOpen
                    ? `${colors.primary.main}20`
                    : colors.background.card,
                  color: sidebarOpen
                    ? colors.primary.main
                    : colors.text.secondary,
                }}
                onPress={() => setSidebarOpen(!sidebarOpen)}
              >
                <Filter size={20} weight="BoldDuotone" />
              </Button>
            </div>
          </div>

          {/* Results count + active filter chips */}
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <p className="text-sm" style={{ color: colors.text.tertiary }}>
              {t("courses.categories.resultsFound", {
                count: filteredCourses.length,
              })}
            </p>
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                {[...selectedCategories].map((catId) => (
                  <span
                    key={catId}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${colors.primary.main}15`,
                      color: colors.primary.main,
                    }}
                  >
                    {categories.find((c) => c.id === catId)?.name}
                    <button
                      onClick={() => toggleCategory(catId)}
                      className="ml-0.5 hover:opacity-70"
                    >
                      <CloseSquare weight="BoldDuotone" size={12} />
                    </button>
                  </span>
                ))}
                {[...selectedLevels].map((level) => (
                  <span
                    key={level}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${colors.primary.main}15`,
                      color: colors.primary.main,
                    }}
                  >
                    {level}
                    <button
                      onClick={() => toggleLevel(level)}
                      className="ml-0.5 hover:opacity-70"
                    >
                      <CloseSquare weight="BoldDuotone" size={12} />
                    </button>
                  </span>
                ))}
                {searchQuery && (
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${colors.primary.main}15`,
                      color: colors.primary.main,
                    }}
                  >
                    &ldquo;{searchQuery}&rdquo;
                    <button
                      onClick={() => {
                        setSearchInput("");
                        setSearchQuery("");
                      }}
                      className="ml-0.5 hover:opacity-70"
                    >
                      <CloseSquare weight="BoldDuotone" size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mobile sidebar (collapsible) */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="lg:hidden overflow-hidden mb-6"
              >
                {sidebarContent}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-6">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">{sidebarContent}</div>
            </aside>

            {/* Courses Grid */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <CourseCardSkeleton
                  count={9}
                  gridClassName="grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  cardBgColor={colors.background.gray}
                />
              ) : filteredCourses.length === 0 ? (
                <div
                  className="text-center py-16 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <img
                    src={searchImage}
                    alt="No results"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-68 h-auto mx-auto opacity-80"
                  />
                  <p
                    className="text-lg font-semibold mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("courses.search.noResults")}
                  </p>
                  <p
                    className="text-sm mb-6 max-w-md mx-auto"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("courses.search.noResultsDesc")}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="flat"
                      style={{
                        backgroundColor: `${colors.primary.main}15`,
                        color: colors.primary.main,
                      }}
                      onPress={() => {
                        setSelectedCategories(new Set());
                        setSelectedLevels(new Set());
                        setSearchInput("");
                        setSearchQuery("");
                      }}
                    >
                      {t("courses.search.clearFilters")}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <motion.div
                    key={
                      [...selectedCategories].join() +
                      [...selectedLevels].join() +
                      searchQuery +
                      sortBy +
                      page
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    {filteredCourses.map((course, i) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.04 }}
                        whileHover={{
                          y: -6,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          },
                        }}
                      >
                        <CourseCard
                          course={course}
                          showCategory={true}
                          showTutorInfo={true}
                          style={{ backgroundColor: colors.background.gray }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {selectedCategories.size === 0 &&
                    selectedLevels.size === 0 &&
                    totalPages > 1 && (
                      <div className="flex justify-center mt-8">
                        <Pagination
                          total={totalPages}
                          page={page}
                          onChange={(p) => {
                            setPage(p);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          color="primary"
                          showControls
                        />
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        className="py-16 px-6 md:px-12"
        style={{ backgroundColor: colors.background.gray }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: colors.text.primary }}
            >
              {t("courses.benefits.title")}{" "}
              <span style={{ color: colors.primary.main }}>
                {t("courses.benefits.titleHighlight")}
              </span>
            </h2>
            <p style={{ color: colors.text.secondary }}>
              {t("courses.benefits.subtitle")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className="h-full shadow-none text-center p-6"
                  style={{ backgroundColor: colors.background.card }}
                >
                  <CardBody className="flex flex-col items-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: benefit.bgColor }}
                    >
                      {benefit.icon({
                        size: 32,
                        style: { color: benefit.color },
                      })}
                    </div>
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: colors.text.primary }}
                    >
                      {benefit.title}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {benefit.description}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 px-6 md:px-12"
        style={{ backgroundColor: colors.primary.main }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2
              className="text-3xl sm:text-4xl font-bold mb-6"
              style={{ color: colors.text.white }}
            >
              {t("courses.cta.title")}
            </h2>
            <p
              className="text-lg mb-10 max-w-2xl mx-auto opacity-90"
              style={{ color: colors.text.white }}
            >
              {t("courses.cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                radius="full"
                className="font-semibold text-lg px-10 h-14"
                style={{
                  backgroundColor: colors.background.light,
                  color: colors.primary.main,
                }}
                onPress={() => navigate("/register")}
              >
                {t("courses.cta.button")}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      <CourseQuizModal
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        onSubmit={(query) => {
          setSearchInput(query);
          setSearchQuery(query);
          setQuizOpen(false);
        }}
      />
    </div>
  );
};

export default Courses;
