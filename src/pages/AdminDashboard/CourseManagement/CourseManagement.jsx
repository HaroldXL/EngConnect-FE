import { useState, useEffect, useCallback } from "react";
import { BookBookmark, CheckCircle, Export, Eye, Filter, ForbiddenCircle, Hourglass, Magnifer, MenuDots, Star, TrashBinMinimalistic } from "@solar-icons/react"
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Image,
  Skeleton,
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";
import { coursesApi } from "../../../api";


const CourseManagement = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { inputClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [courses, setCourses] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Stats
  const [totalCount, setTotalCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

  // Delete modal
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, "page-size": pageSize };
      if (debouncedSearch) params["search-term"] = debouncedSearch;
      if (selectedStatus !== "all") params.Status = selectedStatus;
      if (selectedLevel !== "all") params.Level = selectedLevel;
      if (selectedCategory !== "all") params.CategoryId = selectedCategory;

      const response = await coursesApi.getAllCourses(params);
      const data = response.data;
      setCourses(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    debouncedSearch,
    selectedStatus,
    selectedLevel,
    selectedCategory,
  ]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Fetch categories for filter
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await coursesApi.getCategories({
          "page-size": 100,
          page: 1,
        });
        setCategories(res.data?.items || []);
      } catch (_) {}
    };
    loadCategories();
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allRes, publishedRes, pendingRes, draftRes] = await Promise.all([
          coursesApi.getAllCourses({ "page-size": 1, page: 1 }),
          coursesApi.getAllCourses({
            Status: "Published",
            "page-size": 1,
            page: 1,
          }),
          coursesApi.getAllCourses({
            Status: "Pending",
            "page-size": 1,
            page: 1,
          }),
          coursesApi.getAllCourses({
            Status: "Draft",
            "page-size": 1,
            page: 1,
          }),
        ]);
        setTotalCount(allRes.data.totalItems || 0);
        setPublishedCount(publishedRes.data.totalItems || 0);
        setPendingCount(pendingRes.data.totalItems || 0);
        setDraftCount(draftRes.data.totalItems || 0);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      icon: BookBookmark,
      label: t("adminDashboard.courses.stats.totalCourses"),
      value: totalCount.toLocaleString(),
      color: colors.primary.main,
      bg: colors.background.primaryLight,
    },
    {
      icon: CheckCircle,
      label: t("adminDashboard.courses.stats.published"),
      value: publishedCount.toLocaleString(),
      color: colors.state.success,
      bg: `${colors.state.success}20`,
    },
    {
      icon: Hourglass,
      label: t("adminDashboard.courses.stats.pending"),
      value: pendingCount.toLocaleString(),
      color: colors.state.warning,
      bg: `${colors.state.warning}20`,
    },
    {
      icon: ForbiddenCircle,
      label: t("adminDashboard.courses.stats.draft"),
      value: draftCount.toLocaleString(),
      color: colors.state.error,
      bg: `${colors.state.error}20`,
    },
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "published":
        return "success";
      case "pending":
        return "warning";
      case "draft":
        return "default";
      case "inactive":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "published":
        return t("adminDashboard.courses.published");
      case "pending":
        return t("adminDashboard.courses.pending");
      case "draft":
        return t("adminDashboard.courses.draft");
      case "inactive":
        return t("adminDashboard.courses.inactive");
      default:
        return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    );
  };

  const formatPrice = (price) => {
    if (price == null) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // View detail
  const handleViewCourse = (course) => {
    navigate(`/admin/courses/${course.id}`);
  };

  // Delete
  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    setDeleting(true);
    try {
      await coursesApi.deleteCourse(courseToDelete.id);
      addToast({
        title: t("adminDashboard.courses.deleteSuccess"),
        color: "success",
      });
      onDeleteClose();
      fetchCourses();
    } catch (error) {
      addToast({
        title: t("adminDashboard.courses.deleteFailed"),
        color: "danger",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            className="text-2xl lg:text-3xl font-bold mb-1"
            style={{ color: colors.text.primary }}
          >
            {t("adminDashboard.courses.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("adminDashboard.courses.subtitle")}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: stat.bg }}
                  >
                    <stat.icon
                      className="w-5 h-5"
                      weight="BoldDuotone"
                      style={{ color: stat.color }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-xl font-bold"
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
          </motion.div>
        ))}
      </div>

      {/* Filters and Search */}
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
          <CardBody className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                placeholder={t("adminDashboard.courses.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={
                  <Magnifer weight="BoldDuotone"
                    className="w-4 h-4"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                className="flex-1"
              />
              <div className="flex gap-2 flex-wrap">
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      startContent={<Filter weight="BoldDuotone" className="w-4 h-4" />}
                    >
                      {t("adminDashboard.courses.status")}:{" "}
                      {selectedStatus === "all"
                        ? t("adminDashboard.courses.all")
                        : getStatusLabel(selectedStatus)}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Status filter"
                    onAction={(key) => {
                      setSelectedStatus(key);
                      setPage(1);
                    }}
                    selectedKeys={[selectedStatus]}
                    selectionMode="single"
                  >
                    <DropdownItem key="all">
                      {t("adminDashboard.courses.all")}
                    </DropdownItem>
                    <DropdownItem key="Published">
                      {t("adminDashboard.courses.published")}
                    </DropdownItem>
                    <DropdownItem key="Pending">
                      {t("adminDashboard.courses.pending")}
                    </DropdownItem>
                    <DropdownItem key="Draft">
                      {t("adminDashboard.courses.draft")}
                    </DropdownItem>
                    <DropdownItem key="Inactive">
                      {t("adminDashboard.courses.inactive")}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="flat">
                      {t("adminDashboard.courses.table.level")}:{" "}
                      {selectedLevel === "all"
                        ? t("adminDashboard.courses.all")
                        : selectedLevel}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Level filter"
                    onAction={(key) => {
                      setSelectedLevel(key);
                      setPage(1);
                    }}
                    selectedKeys={[selectedLevel]}
                    selectionMode="single"
                  >
                    <DropdownItem key="all">
                      {t("adminDashboard.courses.all")}
                    </DropdownItem>
                    <DropdownItem key="Beginner">Beginner</DropdownItem>
                    <DropdownItem key="Elementary">Elementary</DropdownItem>
                    <DropdownItem key="Intermediate">Intermediate</DropdownItem>
                    <DropdownItem key="Upper-Intermediate">
                      Upper-Intermediate
                    </DropdownItem>
                    <DropdownItem key="Advanced">Advanced</DropdownItem>
                    <DropdownItem key="Beginner to Advanced">
                      Beginner to Advanced
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="flat">
                      {t("adminDashboard.courses.table.category")}:{" "}
                      {selectedCategory === "all"
                        ? t("adminDashboard.courses.all")
                        : (categories.find((c) => c.id === selectedCategory)
                            ?.name ?? selectedCategory)}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Category filter"
                    onAction={(key) => {
                      setSelectedCategory(key);
                      setPage(1);
                    }}
                    selectedKeys={[selectedCategory]}
                    selectionMode="single"
                  >
                    <DropdownItem key="all">
                      {t("adminDashboard.courses.all")}
                    </DropdownItem>
                    {categories.map((cat) => (
                      <DropdownItem key={cat.id}>{cat.name}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Courses Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card shadow="none" className="border-none" style={tableCardStyle}>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/5 rounded-lg" />
                      <Skeleton className="h-3 w-2/5 rounded-lg" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20">
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.courses.noData")}
                </p>
              </div>
            ) : (
              <Table
                aria-label="Courses table"
                classNames={tableClassNames}
                bottomContent={
                  totalPages > 1 ? (
                    <div className="flex w-full justify-center py-4">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={page}
                        total={totalPages}
                        onChange={(p) => setPage(p)}
                      />
                    </div>
                  ) : null
                }
              >
                <TableHeader>
                  <TableColumn>
                    {t("adminDashboard.courses.table.course")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.courses.table.category")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.courses.table.price")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.courses.table.level")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.courses.table.status")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.courses.table.createdAt")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.courses.table.actions")}
                  </TableColumn>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            {course.thumbnailUrl ? (
                              <Image
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{
                                  backgroundColor: colors.background.gray,
                                }}
                              >
                                <BookBookmark weight="BoldDuotone"
                                  className="w-5 h-5"
                                  style={{ color: colors.text.secondary }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="font-medium line-clamp-1"
                              style={{ color: colors.text.primary }}
                            >
                              {course.title}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(course.courseCategories || course.categories)
                            ?.length > 0 ? (
                            (course.courseCategories || course.categories)
                              .slice(0, 2)
                              .map((cat) => (
                                <Chip
                                  key={cat.categoryId || cat.id}
                                  size="sm"
                                  variant="flat"
                                >
                                  {cat.categoryName || cat.name}
                                </Chip>
                              ))
                          ) : (
                            <span
                              className="text-xs"
                              style={{ color: colors.text.secondary }}
                            >
                              —
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-medium"
                          style={{ color: colors.state.success }}
                        >
                          {formatPrice(course.price)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span style={{ color: colors.text.primary }}>
                          {course.level || course.courseLevel || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={getStatusColor(course.status)}
                          variant="flat"
                        >
                          {getStatusLabel(course.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {formatDate(course.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly variant="light" size="sm">
                                <MenuDots
                                  className="w-5 h-5"
                                  weight="BoldDuotone"
                                  style={{ color: colors.text.secondary }}
                                />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Course actions">
                              <DropdownItem
                                key="view"
                                startContent={<Eye weight="BoldDuotone" className="w-4 h-4" />}
                                onPress={() => handleViewCourse(course)}
                              >
                                {t("adminDashboard.courses.view")}
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                color="danger"
                                startContent={<TrashBinMinimalistic weight="BoldDuotone" className="w-4 h-4" />}
                                onPress={() => handleDeleteClick(course)}
                              >
                                {t("adminDashboard.courses.delete")}
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.courses.confirmDelete")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.courses.confirmDeleteMsg")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} isDisabled={deleting}>
                  {t("adminDashboard.courses.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteConfirm}
                  isLoading={deleting}
                >
                  {t("adminDashboard.courses.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CourseManagement;
