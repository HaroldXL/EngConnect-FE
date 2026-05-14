import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle, ClipboardList, CloseCircle, Export, Eye, Filter, ForbiddenCircle, Hourglass, Magnifer, MenuDots, Star, TrashBinMinimalistic } from "@solar-icons/react"
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
  Spinner,
  Textarea,
  Avatar,
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";
import { adminApi } from "../../../api";


const TutorVerification = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames, textareaClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();

  // List state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [requests, setRequests] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Stats
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  // Detail modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTutor, setDetailTutor] = useState(null);

  // Tutor data cache: tutorId → tutor object
  const tutorCacheRef = useRef({});

  // Review modal (approve/reject)
  const {
    isOpen: isReviewOpen,
    onOpen: onReviewOpen,
    onClose: onReviewClose,
  } = useDisclosure();
  const [reviewAction, setReviewAction] = useState(null); // "approve" | "reject"
  const [reviewRequestId, setReviewRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // Delete modal
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch verification requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, "page-size": pageSize };
      if (debouncedSearch) params["search-term"] = debouncedSearch;
      if (selectedStatus !== "all") params.Status = selectedStatus;

      const response = await adminApi.getVerificationRequests(params);
      const data = response.data;
      const items = data.items || [];
      setRequests(items);
      setTotalPages(data.totalPages || 1);

      // Fetch tutor data for items not yet cached
      const uncachedIds = [
        ...new Set(
          items
            .map((r) => r.tutorId)
            .filter((id) => id && !tutorCacheRef.current[id]),
        ),
      ];
      if (uncachedIds.length > 0) {
        const results = await Promise.allSettled(
          uncachedIds.map((id) => adminApi.getTutorById(id)),
        );
        results.forEach((result, i) => {
          if (result.status === "fulfilled") {
            tutorCacheRef.current[uncachedIds[i]] = result.value.data;
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch verification requests:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedStatus]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allRes, pendingRes, approvedRes, rejectedRes] =
          await Promise.all([
            adminApi.getVerificationRequests({ "page-size": 1, page: 1 }),
            adminApi.getVerificationRequests({
              Status: "Pending",
              "page-size": 1,
              page: 1,
            }),
            adminApi.getVerificationRequests({
              Status: "Approved",
              "page-size": 1,
              page: 1,
            }),
            adminApi.getVerificationRequests({
              Status: "Rejected",
              "page-size": 1,
              page: 1,
            }),
          ]);
        setTotalCount(allRes.data.totalItems || 0);
        setPendingCount(pendingRes.data.totalItems || 0);
        setApprovedCount(approvedRes.data.totalItems || 0);
        setRejectedCount(rejectedRes.data.totalItems || 0);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      icon: ClipboardList,
      label: t("adminDashboard.verification.stats.totalRequests"),
      value: totalCount.toLocaleString(),
      color: colors.primary.main,
      bg: colors.background.primaryLight,
    },
    {
      icon: Hourglass,
      label: t("adminDashboard.verification.stats.pending"),
      value: pendingCount.toLocaleString(),
      color: colors.state.warning,
      bg: `${colors.state.warning}20`,
    },
    {
      icon: CheckCircle,
      label: t("adminDashboard.verification.stats.approved"),
      value: approvedCount.toLocaleString(),
      color: colors.state.success,
      bg: `${colors.state.success}20`,
    },
    {
      icon: ForbiddenCircle,
      label: t("adminDashboard.verification.stats.rejected"),
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
        return t("adminDashboard.verification.approved");
      case "Pending":
        return t("adminDashboard.verification.pending");
      case "Rejected":
        return t("adminDashboard.verification.rejected");
      default:
        return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t("adminDashboard.verification.nA");
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

  const getTutorName = (tutorId) => {
    const tutor = tutorCacheRef.current[tutorId];
    if (!tutor) return t("adminDashboard.verification.nA");
    if (tutor.user) {
      return `${tutor.user.firstName || ""} ${tutor.user.lastName || ""}`.trim();
    }
    return t("adminDashboard.verification.nA");
  };

  const getTutorEmail = (tutorId) => {
    const tutor = tutorCacheRef.current[tutorId];
    return tutor?.user?.email || "";
  };

  const getTutorAvatar = (tutorId) => {
    const tutor = tutorCacheRef.current[tutorId];
    return tutor?.avatar || "";
  };

  // View detail — fetch request detail + tutor profile
  const handleViewRequest = async (request) => {
    setSelectedRequest(request);
    setDetailTutor(null);
    onOpen();
    setDetailLoading(true);
    try {
      const [reqRes, tutorRes] = await Promise.allSettled([
        adminApi.getVerificationRequestById(request.id),
        request.tutorId
          ? adminApi.getTutorById(request.tutorId)
          : Promise.reject("no tutorId"),
      ]);
      if (reqRes.status === "fulfilled") {
        setSelectedRequest(reqRes.value.data);
      }
      if (tutorRes.status === "fulfilled") {
        setDetailTutor(tutorRes.value.data);
        tutorCacheRef.current[request.tutorId] = tutorRes.value.data;
      }
    } catch (error) {
      console.error("Failed to fetch request detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  // Review (approve / reject)
  const handleReviewClick = (requestId, action) => {
    setReviewRequestId(requestId);
    setReviewAction(action);
    setRejectionReason("");
    onReviewOpen();
  };

  const handleReviewConfirm = async () => {
    if (!reviewRequestId || !reviewAction) return;
    setReviewing(true);
    try {
      const approved = reviewAction === "approve";
      await adminApi.reviewVerificationRequest(reviewRequestId, {
        approved,
        rejectionReason: approved ? "" : rejectionReason,
      });
      onReviewClose();
      addToast({
        title: approved
          ? t("adminDashboard.verification.approveSuccess")
          : t("adminDashboard.verification.rejectSuccess"),
        color: "success",
      });
      fetchRequests();
      // Refresh stats
      if (approved) {
        setPendingCount((prev) => Math.max(0, prev - 1));
        setApprovedCount((prev) => prev + 1);
      } else {
        setPendingCount((prev) => Math.max(0, prev - 1));
        setRejectedCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to review request:", error);
      addToast({
        title:
          reviewAction === "approve"
            ? t("adminDashboard.verification.approveFailed")
            : t("adminDashboard.verification.rejectFailed"),
        color: "danger",
      });
    } finally {
      setReviewing(false);
    }
  };

  // Delete
  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteVerificationRequest(requestToDelete.id);
      onDeleteClose();
      setRequestToDelete(null);
      addToast({
        title: t("adminDashboard.verification.deleteSuccess"),
        color: "success",
      });
      fetchRequests();
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to delete request:", error);
      addToast({
        title: t("adminDashboard.verification.deleteFailed"),
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
            {t("adminDashboard.verification.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("adminDashboard.verification.subtitle")}
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
                placeholder={t("adminDashboard.verification.searchPlaceholder")}
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
              <div className="flex gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      startContent={<Filter weight="BoldDuotone" className="w-4 h-4" />}
                    >
                      {t("adminDashboard.verification.statusLabel")}:{" "}
                      {selectedStatus === "all"
                        ? t("adminDashboard.verification.all")
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
                      {t("adminDashboard.verification.all")}
                    </DropdownItem>
                    <DropdownItem key="Pending">
                      {t("adminDashboard.verification.pending")}
                    </DropdownItem>
                    <DropdownItem key="Approved">
                      {t("adminDashboard.verification.approved")}
                    </DropdownItem>
                    <DropdownItem key="Rejected">
                      {t("adminDashboard.verification.rejected")}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card shadow="none" className="border-none" style={tableCardStyle}>
          <CardBody className="p-0">
            <Table
              aria-label="Verification requests table"
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
                  {t("adminDashboard.verification.tutorProfile")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.verification.table.status")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.verification.table.submittedAt")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.verification.table.reviewedAt")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.verification.table.actions")}
                </TableColumn>
              </TableHeader>
              <TableBody
                isLoading={loading}
                loadingContent={<Spinner size="lg" />}
                emptyContent={t("adminDashboard.verification.noData")}
              >
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar src={getTutorAvatar(req.tutorId)} size="sm" />
                        <div>
                          <p
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {getTutorName(req.tutorId)}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: colors.text.secondary }}
                          >
                            {getTutorEmail(req.tutorId)}
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
                      <span style={{ color: colors.text.primary }}>
                        {formatDate(req.submittedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: colors.text.primary }}>
                        {formatDate(req.reviewedAt)}
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
                          <DropdownMenu aria-label="Request actions">
                            <DropdownItem
                              key="view"
                              startContent={<Eye weight="BoldDuotone" className="w-4 h-4" />}
                              onPress={() => handleViewRequest(req)}
                            >
                              {t("adminDashboard.verification.view")}
                            </DropdownItem>
                            {req.status === "Pending" && (
                              <DropdownItem
                                key="approve"
                                startContent={
                                  <CheckCircle weight="BoldDuotone" className="w-4 h-4" />
                                }
                                className="text-success"
                                onPress={() =>
                                  handleReviewClick(req.id, "approve")
                                }
                              >
                                {t("adminDashboard.verification.approve")}
                              </DropdownItem>
                            )}
                            {req.status === "Pending" && (
                              <DropdownItem
                                key="reject"
                                startContent={<CloseCircle weight="BoldDuotone" className="w-4 h-4" />}
                                className="text-warning"
                                onPress={() =>
                                  handleReviewClick(req.id, "reject")
                                }
                              >
                                {t("adminDashboard.verification.reject")}
                              </DropdownItem>
                            )}
                            <DropdownItem
                              key="delete"
                              color="danger"
                              startContent={<TrashBinMinimalistic weight="BoldDuotone" className="w-4 h-4" />}
                              onPress={() => handleDeleteClick(req)}
                            >
                              {t("adminDashboard.verification.delete")}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.verification.requestDetails")}
              </ModalHeader>
              <ModalBody>
                {detailLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : selectedRequest ? (
                  <div className="space-y-5">
                    {/* Request Status Info */}
                    <div
                      className="p-4 rounded-xl"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Chip
                          size="md"
                          color={getStatusColor(selectedRequest.status)}
                          variant="flat"
                        >
                          {getStatusLabel(selectedRequest.status)}
                        </Chip>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p
                            className="text-xs font-semibold"
                            style={{ color: colors.text.secondary }}
                          >
                            {t("adminDashboard.verification.submittedAt")}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: colors.text.primary }}
                          >
                            {formatDate(selectedRequest.submittedAt)}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs font-semibold"
                            style={{ color: colors.text.secondary }}
                          >
                            {t("adminDashboard.verification.reviewedAt")}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: colors.text.primary }}
                          >
                            {formatDate(selectedRequest.reviewedAt)}
                          </p>
                        </div>
                      </div>
                      {selectedRequest.rejectionReason && (
                        <div className="mt-3">
                          <p
                            className="text-xs font-semibold mb-1"
                            style={{ color: colors.text.secondary }}
                          >
                            {t("adminDashboard.verification.rejectionReason")}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: colors.state.error }}
                          >
                            {selectedRequest.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Tutor Profile Section */}
                    <div>
                      <h4
                        className="text-base font-semibold mb-3"
                        style={{ color: colors.text.primary }}
                      >
                        {t("adminDashboard.verification.tutorProfile")}
                      </h4>
                      {detailTutor ? (
                        <div className="space-y-4">
                          {/* Tutor header */}
                          <div className="flex items-center gap-4">
                            <Avatar
                              src={detailTutor.avatar}
                              className="w-16 h-16"
                            />
                            <div>
                              <h3
                                className="text-lg font-semibold"
                                style={{ color: colors.text.primary }}
                              >
                                {detailTutor.user
                                  ? `${detailTutor.user.firstName || ""} ${detailTutor.user.lastName || ""}`.trim()
                                  : t("adminDashboard.verification.nA")}
                              </h3>
                              <p style={{ color: colors.text.secondary }}>
                                {detailTutor.headline || ""}
                              </p>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-3 gap-3">
                            <div
                              className="p-3 rounded-xl text-center"
                              style={{
                                backgroundColor: colors.background.gray,
                              }}
                            >
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Star
                                  className="w-4 h-4"
                                  weight="BoldDuotone"
                                  style={{ color: colors.state.warning }}
                                />
                                <span
                                  className="text-lg font-bold"
                                  style={{ color: colors.text.primary }}
                                >
                                  {detailTutor.ratingAverage > 0
                                    ? detailTutor.ratingAverage.toFixed(1)
                                    : t("adminDashboard.verification.nA")}
                                </span>
                              </div>
                              <p
                                className="text-xs"
                                style={{ color: colors.text.secondary }}
                              >
                                {t("adminDashboard.verification.rating")}
                                {detailTutor.ratingCount > 0 &&
                                  ` (${detailTutor.ratingCount} ${t("adminDashboard.verification.reviews")})`}
                              </p>
                            </div>
                            <div
                              className="p-3 rounded-xl text-center"
                              style={{
                                backgroundColor: colors.background.gray,
                              }}
                            >
                              <p
                                className="text-lg font-bold"
                                style={{ color: colors.text.primary }}
                              >
                                {detailTutor.monthExperience || 0}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: colors.text.secondary }}
                              >
                                {t("adminDashboard.verification.experience")} (
                                {t("adminDashboard.verification.months")})
                              </p>
                            </div>
                            <div
                              className="p-3 rounded-xl text-center"
                              style={{
                                backgroundColor: colors.background.gray,
                              }}
                            >
                              <p
                                className="text-lg font-bold"
                                style={{ color: colors.text.primary }}
                              >
                                {detailTutor.slotsCount || 0}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: colors.text.secondary }}
                              >
                                {t("adminDashboard.verification.slots")}
                              </p>
                            </div>
                          </div>

                          {/* Bio */}
                          {detailTutor.bio && (
                            <div>
                              <p
                                className="text-sm font-semibold mb-1"
                                style={{ color: colors.text.secondary }}
                              >
                                {t("adminDashboard.verification.bio")}
                              </p>
                              <p
                                className="whitespace-pre-wrap"
                                style={{ color: colors.text.primary }}
                              >
                                {detailTutor.bio}
                              </p>
                            </div>
                          )}

                          {/* Info grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: colors.text.secondary }}
                              >
                                {t("adminDashboard.verification.email")}
                              </p>
                              <p style={{ color: colors.text.primary }}>
                                {detailTutor.user?.email ||
                                  t("adminDashboard.verification.nA")}
                              </p>
                            </div>
                            <div>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: colors.text.secondary }}
                              >
                                {t("adminDashboard.verification.joinDate")}
                              </p>
                              <p style={{ color: colors.text.primary }}>
                                {detailTutor.createdAt
                                  ? new Date(
                                      detailTutor.createdAt,
                                    ).toLocaleDateString(
                                      i18n.language === "vi"
                                        ? "vi-VN"
                                        : "en-US",
                                      {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      },
                                    )
                                  : t("adminDashboard.verification.nA")}
                              </p>
                            </div>
                          </div>

                          {/* Intro video */}
                          {detailTutor.introVideoUrl && (
                            <div>
                              <p
                                className="text-sm font-semibold mb-1"
                                style={{ color: colors.text.secondary }}
                              >
                                {t("adminDashboard.verification.introVideo")}
                              </p>
                              <video
                                src={detailTutor.introVideoUrl}
                                controls
                                className="w-full max-h-52 rounded-lg"
                              />
                            </div>
                          )}

                          {/* CV file */}
                          {detailTutor.cvUrl && (
                            <div>
                              <p
                                className="text-sm font-semibold mb-1"
                                style={{ color: colors.text.secondary }}
                              >
                                {t("adminDashboard.verification.cvFile")}
                              </p>
                              <a
                                href={detailTutor.cvUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm underline"
                                style={{ color: colors.primary.main }}
                              >
                                {t("adminDashboard.verification.view")} CV
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p
                          className="text-sm"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("adminDashboard.verification.failedToLoadTutor")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("adminDashboard.verification.close")}
                </Button>
                {selectedRequest?.status === "Pending" && (
                  <>
                    <Button
                      color="danger"
                      variant="flat"
                      onPress={() => {
                        onClose();
                        handleReviewClick(selectedRequest.id, "reject");
                      }}
                    >
                      {t("adminDashboard.verification.reject")}
                    </Button>
                    <Button
                      color="success"
                      onPress={() => {
                        onClose();
                        handleReviewClick(selectedRequest.id, "approve");
                      }}
                    >
                      {t("adminDashboard.verification.approve")}
                    </Button>
                  </>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Review Confirmation Modal */}
      <Modal isOpen={isReviewOpen} onClose={onReviewClose} size="md">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.verification.reviewRequest")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {reviewAction === "approve"
                    ? t("adminDashboard.verification.approveConfirm")
                    : t("adminDashboard.verification.rejectConfirm")}
                </p>
                {reviewAction === "reject" && (
                  <Textarea
                    label={t("adminDashboard.verification.rejectionReason")}
                    placeholder={t(
                      "adminDashboard.verification.rejectionReasonPlaceholder",
                    )}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    classNames={textareaClassNames}
                    className="mt-3"
                    minRows={3}
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("adminDashboard.verification.cancel")}
                </Button>
                <Button
                  color={reviewAction === "approve" ? "success" : "danger"}
                  onPress={handleReviewConfirm}
                  isLoading={reviewing}
                  isDisabled={
                    reviewAction === "reject" && !rejectionReason.trim()
                  }
                >
                  {t("adminDashboard.verification.confirm")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.verification.confirmDelete")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.verification.confirmDeleteMsg")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("adminDashboard.verification.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteConfirm}
                  isLoading={deleting}
                >
                  {t("adminDashboard.verification.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TutorVerification;
