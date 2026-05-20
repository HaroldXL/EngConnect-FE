import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { BookBookmark, CheckCircle, ClipboardList, CloseCircle, Eye, Filter, ForbiddenCircle, Hourglass, MinimalisticMagnifier, MenuDots, TrashBinMinimalistic } from "@solar-icons/react"
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
  Skeleton,
  Textarea,
  Image,
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";
import { coursesApi } from "../../../api";


const CourseVerification = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { inputClassNames, textareaClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Course detail cache for display (courseId → course)
  const [courseCache, setCourseCache] = useState({});

  // Review modal
  const {
    isOpen: isReviewOpen,
    onOpen: onReviewOpen,
    onClose: onReviewClose,
  } = useDisclosure();
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewRequestId, setReviewRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Delete modal
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [requestToDelete, setRequestToDelete] = useState(null);

  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Verification requests list
  const { data: requestData, isLoading: loading } = useQuery({
    queryKey: ["admin-course-verifications", page, pageSize, debouncedSearch, selectedStatus],
    queryFn: () => {
      const params = { page, "page-size": pageSize };
      if (debouncedSearch) params["search-term"] = debouncedSearch;
      if (selectedStatus !== "all") params.Status = selectedStatus;
      return coursesApi.getCourseVerificationRequests(params).then((r) => r.data);
    },
    placeholderData: keepPreviousData,
    staleTime: 10 * 1000,
  });
  const requests = requestData?.items ?? [];
  const totalPages = requestData?.totalPages ?? 1;

  // Fetch course details for displayed requests (not in cache yet)
  useEffect(() => {
    if (!requests.length) return;
    const uncachedIds = [...new Set(
      requests.map((r) => r.courseId).filter((id) => id && !courseCache[id]),
    )];
    if (!uncachedIds.length) return;
    Promise.allSettled(uncachedIds.map((id) => coursesApi.getCourseById(id))).then(
      (results) => {
        const entries = {};
        results.forEach((r, i) => {
          if (r.status === "fulfilled") entries[uncachedIds[i]] = r.value.data;
        });
        setCourseCache((prev) => ({ ...prev, ...entries }));
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  // Stats
  const { data: statsData } = useQuery({
    queryKey: ["admin-course-verification-stats"],
    queryFn: () =>
      Promise.all([
        coursesApi.getCourseVerificationRequests({ "page-size": 1, page: 1 }),
        coursesApi.getCourseVerificationRequests({ Status: "Pending", "page-size": 1, page: 1 }),
        coursesApi.getCourseVerificationRequests({ Status: "Approved", "page-size": 1, page: 1 }),
        coursesApi.getCourseVerificationRequests({ Status: "Rejected", "page-size": 1, page: 1 }),
      ]).then(([allRes, pendingRes, approvedRes, rejectedRes]) => ({
        total: allRes.data.totalItems || 0,
        pending: pendingRes.data.totalItems || 0,
        approved: approvedRes.data.totalItems || 0,
        rejected: rejectedRes.data.totalItems || 0,
      })),
    staleTime: 10 * 1000,
  });
  const totalCount = statsData?.total ?? 0;
  const pendingCount = statsData?.pending ?? 0;
  const approvedCount = statsData?.approved ?? 0;
  const rejectedCount = statsData?.rejected ?? 0;

  // Review mutation (approve/reject)
  const reviewMutation = useMutation({
    mutationFn: ({ requestId, approved, rejectionReason }) =>
      coursesApi.reviewCourseVerificationRequest(requestId, { requestId, approved, rejectionReason }),
    onSuccess: (_, { approved }) => {
      addToast({
        title: approved
          ? t("adminDashboard.courseVerification.approveSuccess")
          : t("adminDashboard.courseVerification.rejectSuccess"),
        color: "success",
      });
      onReviewClose();
      queryClient.invalidateQueries({ queryKey: ["admin-course-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-course-verification-stats"] });
    },
    onError: (_, { approved }) => {
      addToast({
        title: approved
          ? t("adminDashboard.courseVerification.approveFailed")
          : t("adminDashboard.courseVerification.rejectFailed"),
        color: "danger",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => coursesApi.deleteCourseVerificationRequest(id),
    onSuccess: () => {
      addToast({ title: t("adminDashboard.courseVerification.deleteSuccess"), color: "success" });
      onDeleteClose();
      queryClient.invalidateQueries({ queryKey: ["admin-course-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-course-verification-stats"] });
    },
    onError: () => {
      addToast({ title: t("adminDashboard.courseVerification.deleteFailed"), color: "danger" });
    },
  });

  const stats = [
    {
      icon: ClipboardList,
      label: t("adminDashboard.courseVerification.stats.totalRequests"),
      value: totalCount.toLocaleString(),
      color: colors.primary.main,
      bg: colors.background.primaryLight,
    },
    {
      icon: Hourglass,
      label: t("adminDashboard.courseVerification.stats.pending"),
      value: pendingCount.toLocaleString(),
      color: colors.state.warning,
      bg: `${colors.state.warning}20`,
    },
    {
      icon: CheckCircle,
      label: t("adminDashboard.courseVerification.stats.approved"),
      value: approvedCount.toLocaleString(),
      color: colors.state.success,
      bg: `${colors.state.success}20`,
    },
    {
      icon: ForbiddenCircle,
      label: t("adminDashboard.courseVerification.stats.rejected"),
      value: rejectedCount.toLocaleString(),
      color: colors.state.error,
      bg: `${colors.state.error}20`,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Pending":
        return "warning";
      case "Rejected":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "Approved":
        return t("adminDashboard.courseVerification.approved");
      case "Pending":
        return t("adminDashboard.courseVerification.pending");
      case "Rejected":
        return t("adminDashboard.courseVerification.rejected");
      default:
        return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t("adminDashboard.courseVerification.nA");
    return new Date(dateStr).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  const getCourseName = (courseId) => {
    const course = courseCache[courseId];
    return course?.title || courseId?.slice(0, 8) + "...";
  };

  const getCourseThumbnail = (courseId) => {
    return courseCache[courseId]?.thumbnailUrl || "";
  };

  // View detail
  const handleViewRequest = (request) => {
    navigate(`/admin/course-verification/${request.id}`);
  };

  // Review (approve/reject)
  const handleReviewClick = (requestId, action) => {
    setReviewRequestId(requestId);
    setReviewAction(action);
    setRejectionReason("");
    onReviewOpen();
  };

  const handleReviewConfirm = () => {
    if (!reviewRequestId) return;
    reviewMutation.mutate({
      requestId: reviewRequestId,
      approved: reviewAction === "approve",
      rejectionReason: reviewAction === "reject" ? rejectionReason : null,
    });
  };

  // Delete
  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    onDeleteOpen();
  };

  const handleDeleteConfirm = () => {
    if (!requestToDelete) return;
    deleteMutation.mutate(requestToDelete.id);
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
            {t("adminDashboard.courseVerification.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("adminDashboard.courseVerification.subtitle")}
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
                placeholder={t(
                  "adminDashboard.courseVerification.searchPlaceholder",
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={
                  <MinimalisticMagnifier weight="BoldDuotone"
                    className="w-4 h-4"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      startContent={<Filter weight="BoldDuotone" className="w-4 h-4" />}
                    >
                      {t("adminDashboard.courseVerification.statusLabel")}:{" "}
                      {selectedStatus === "all"
                        ? t("adminDashboard.courseVerification.all")
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
                      {t("adminDashboard.courseVerification.all")}
                    </DropdownItem>
                    <DropdownItem key="Pending">
                      {t("adminDashboard.courseVerification.pending")}
                    </DropdownItem>
                    <DropdownItem key="Approved">
                      {t("adminDashboard.courseVerification.approved")}
                    </DropdownItem>
                    <DropdownItem key="Rejected">
                      {t("adminDashboard.courseVerification.rejected")}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Requests Table */}
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
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20">
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.courseVerification.noData")}
                </p>
              </div>
            ) : (
              <Table
                aria-label="Course verification requests table"
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
                    {t("adminDashboard.courseVerification.table.course")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.courseVerification.table.status")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.courseVerification.table.submittedAt")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.courseVerification.table.reviewedAt")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.courseVerification.table.actions")}
                  </TableColumn>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            {getCourseThumbnail(req.courseId) ? (
                              <Image
                                src={getCourseThumbnail(req.courseId)}
                                alt=""
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
                                  className="w-4 h-4"
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
                              {getCourseName(req.courseId)}
                            </p>
                            <p
                              className="text-xs line-clamp-1"
                              style={{ color: colors.text.secondary }}
                            >
                              ID: {req.id?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={getStatusColor(req.status)}
                          variant="flat"
                        >
                          {getStatusLabel(req.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {formatDate(req.submittedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {formatDate(req.reviewedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {req.status === "Pending" && (
                            <>
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                style={{ color: colors.state.success }}
                                onPress={() =>
                                  handleReviewClick(req.id, "approve")
                                }
                              >
                                <CheckCircle
                                  className="w-5 h-5"
                                  weight="BoldDuotone"
                                />
                              </Button>
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                style={{ color: colors.state.error }}
                                onPress={() =>
                                  handleReviewClick(req.id, "reject")
                                }
                              >
                                <CloseCircle className="w-5 h-5" weight="BoldDuotone" />
                              </Button>
                            </>
                          )}
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
                            <DropdownMenu aria-label="Request actions">
                              <DropdownItem
                                key="view"
                                startContent={<Eye weight="BoldDuotone" className="w-4 h-4" />}
                                onPress={() => handleViewRequest(req)}
                              >
                                {t("adminDashboard.courseVerification.view")}
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                color="danger"
                                startContent={<TrashBinMinimalistic weight="BoldDuotone" className="w-4 h-4" />}
                                onPress={() => handleDeleteClick(req)}
                              >
                                {t("adminDashboard.courseVerification.delete")}
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

      {/* Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={onReviewClose} size="md">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.courseVerification.reviewRequest")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {reviewAction === "approve"
                    ? t("adminDashboard.courseVerification.approveConfirm")
                    : t("adminDashboard.courseVerification.rejectConfirm")}
                </p>
                {reviewAction === "reject" && (
                  <Textarea
                    label={t(
                      "adminDashboard.courseVerification.rejectionReason",
                    )}
                    placeholder={t(
                      "adminDashboard.courseVerification.rejectionReasonPlaceholder",
                    )}
                    value={rejectionReason}
                    onValueChange={setRejectionReason}
                    classNames={textareaClassNames}
                    className="mt-3"
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={reviewMutation.isPending}
                >
                  {t("adminDashboard.courseVerification.cancel")}
                </Button>
                <Button
                  color={reviewAction === "approve" ? "success" : "danger"}
                  onPress={handleReviewConfirm}
                  isLoading={reviewMutation.isPending}
                  isDisabled={
                    reviewAction === "reject" && !rejectionReason.trim()
                  }
                >
                  {t("adminDashboard.courseVerification.confirm")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.courseVerification.confirmDelete")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.courseVerification.confirmDeleteMsg")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} isDisabled={deleteMutation.isPending}>
                  {t("adminDashboard.courseVerification.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteConfirm}
                  isLoading={deleteMutation.isPending}
                >
                  {t("adminDashboard.courseVerification.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CourseVerification;
