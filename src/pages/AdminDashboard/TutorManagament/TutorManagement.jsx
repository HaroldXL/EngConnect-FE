import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Export, Eye, Filter, Magnifer, MenuDots, Pen, PresentationGraph, Star, TrashBinMinimalistic } from "@solar-icons/react"
import {
  Card,
  CardBody,
  Button,
  Avatar,
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
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";
import { adminApi } from "../../../api";


const TutorManagement = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames, textareaClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();
  const navigate = useNavigate();

  // List state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedVerifiedStatus, setSelectedVerifiedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [tutors, setTutors] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Stats
  const [totalTutorsCount, setTotalTutorsCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);

  // Delete modal
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [tutorToDelete, setTutorToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [editForm, setEditForm] = useState({
    headline: "",
    bio: "",
    monthExperience: 0,
    status: "",
  });
  const [editTutorId, setEditTutorId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch tutors list
  const fetchTutors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, "page-size": pageSize };
      if (debouncedSearch) params["search-term"] = debouncedSearch;
      if (selectedVerifiedStatus !== "all")
        params.VerifiedStatus = selectedVerifiedStatus;

      const response = await adminApi.getAllTutors(params);
      const data = response.data;
      setTutors(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch tutors:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedVerifiedStatus]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allRes, verifiedRes] = await Promise.all([
          adminApi.getAllTutors({ "page-size": 1, page: 1 }),
          adminApi.getAllTutors({
            VerifiedStatus: "Verified",
            "page-size": 1,
            page: 1,
          }),
        ]);
        setTotalTutorsCount(allRes.data.totalItems || 0);
        setVerifiedCount(verifiedRes.data.totalItems || 0);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      icon: PresentationGraph,
      label: t("adminDashboard.tutors.stats.totalTutors"),
      value: totalTutorsCount.toLocaleString(),
      color: colors.primary.main,
      bg: colors.background.primaryLight,
    },
    {
      icon: CheckCircle,
      label: t("adminDashboard.tutors.stats.verified"),
      value: verifiedCount.toLocaleString(),
      color: colors.state.success,
      bg: `${colors.state.success}20`,
    },
  ];

  const getVerifiedColor = (status) => {
    return status === "Verified" ? "success" : "warning";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "default";
      default:
        return "primary";
    }
  };

  const getTutorName = (tutor) => {
    if (tutor.user) {
      return `${tutor.user.firstName || ""} ${tutor.user.lastName || ""}`.trim();
    }
    return t("adminDashboard.tutors.nA");
  };

  const getTutorEmail = (tutor) => {
    return tutor.user?.email || "";
  };

  // View detail
  const handleViewTutor = (tutor) => {
    navigate(`/admin/tutors/${tutor.id}`);
  };

  // Delete
  const handleDeleteClick = (tutor) => {
    setTutorToDelete(tutor);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!tutorToDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteTutor(tutorToDelete.id);
      onDeleteClose();
      setTutorToDelete(null);
      addToast({
        title: t("adminDashboard.tutors.deleteSuccess"),
        color: "success",
      });
      fetchTutors();
      setTotalTutorsCount((prev) => prev - 1);
    } catch (error) {
      console.error("Failed to delete tutor:", error);
      addToast({
        title: t("adminDashboard.tutors.deleteFailed"),
        color: "danger",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Edit
  const handleEditClick = (tutor) => {
    setEditTutorId(tutor.id);
    setEditForm({
      headline: tutor.headline || "",
      bio: tutor.bio || "",
      monthExperience: tutor.monthExperience || 0,
      status: tutor.status || "",
    });
    onEditOpen();
  };

  const handleEditSave = async () => {
    if (!editTutorId) return;
    setSaving(true);
    try {
      await adminApi.updateTutor(editTutorId, editForm);
      onEditClose();
      addToast({
        title: t("adminDashboard.tutors.updateSuccess"),
        color: "success",
      });
      fetchTutors();
    } catch (error) {
      console.error("Failed to update tutor:", error);
      addToast({
        title: t("adminDashboard.tutors.updateFailed"),
        color: "danger",
      });
    } finally {
      setSaving(false);
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
            {t("adminDashboard.tutors.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("adminDashboard.tutors.subtitle")}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder={t("adminDashboard.tutors.searchPlaceholder")}
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
                      {t("adminDashboard.tutors.verifiedStatusLabel")}:{" "}
                      {selectedVerifiedStatus === "all"
                        ? t("adminDashboard.tutors.all")
                        : t(
                            `adminDashboard.tutors.${selectedVerifiedStatus === "Verified" ? "verified" : "unverified"}`,
                          )}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Verified status filter"
                    onAction={(key) => {
                      setSelectedVerifiedStatus(key);
                      setPage(1);
                    }}
                    selectedKeys={[selectedVerifiedStatus]}
                    selectionMode="single"
                  >
                    <DropdownItem key="all">
                      {t("adminDashboard.tutors.all")}
                    </DropdownItem>
                    <DropdownItem key="Verified">
                      {t("adminDashboard.tutors.verified")}
                    </DropdownItem>
                    <DropdownItem key="Unverified">
                      {t("adminDashboard.tutors.unverified")}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Tutors Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card shadow="none" className="border-none" style={tableCardStyle}>
          <CardBody className="p-0">
            <Table
              aria-label="Tutors table"
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
                  {t("adminDashboard.tutors.table.tutor")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.tutors.table.headline")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.tutors.table.experience")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.tutors.table.rating")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.tutors.table.verifiedStatus")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.tutors.table.status")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.tutors.table.actions")}
                </TableColumn>
              </TableHeader>
              <TableBody
                isLoading={loading}
                loadingContent={<Spinner size="lg" />}
                emptyContent={t("adminDashboard.tutors.noData")}
              >
                {tutors.map((tutor) => (
                  <TableRow key={tutor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar src={tutor.avatar} size="sm" />
                        <div>
                          <p
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {getTutorName(tutor)}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: colors.text.secondary }}
                          >
                            {getTutorEmail(tutor)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="line-clamp-1"
                        style={{ color: colors.text.primary }}
                      >
                        {tutor.headline || t("adminDashboard.tutors.nA")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: colors.text.primary }}>
                        {tutor.monthExperience != null
                          ? `${tutor.monthExperience} ${t("adminDashboard.tutors.months")}`
                          : t("adminDashboard.tutors.nA")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {tutor.ratingAverage > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star
                            className="w-4 h-4"
                            weight="BoldDuotone"
                            style={{ color: colors.state.warning }}
                          />
                          <span style={{ color: colors.text.primary }}>
                            {tutor.ratingAverage.toFixed(1)}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            ({tutor.ratingCount})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: colors.text.tertiary }}>
                          {t("adminDashboard.tutors.nA")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getVerifiedColor(tutor.verifiedStatus)}
                        variant="flat"
                      >
                        {tutor.verifiedStatus === "Verified"
                          ? t("adminDashboard.tutors.verified")
                          : t("adminDashboard.tutors.unverified")}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(tutor.status)}
                        variant="flat"
                      >
                        {tutor.status}
                      </Chip>
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
                          <DropdownMenu aria-label="Tutor actions">
                            <DropdownItem
                              key="view"
                              startContent={<Eye weight="BoldDuotone" className="w-4 h-4" />}
                              onPress={() => handleViewTutor(tutor)}
                            >
                              {t("adminDashboard.tutors.view")}
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={
                                <Pen weight="BoldDuotone" className="w-4 h-4" />
                              }
                              onPress={() => handleEditClick(tutor)}
                            >
                              {t("adminDashboard.tutors.edit")}
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              color="danger"
                              startContent={<TrashBinMinimalistic weight="BoldDuotone" className="w-4 h-4" />}
                              onPress={() => handleDeleteClick(tutor)}
                            >
                              {t("adminDashboard.tutors.delete")}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.tutors.confirmDelete")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.tutors.confirmDeleteMsg")}
                </p>
                {tutorToDelete && (
                  <div className="flex items-center gap-3 mt-3">
                    <Avatar src={tutorToDelete.avatar} size="sm" />
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {getTutorName(tutorToDelete)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {getTutorEmail(tutorToDelete)}
                      </p>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("adminDashboard.tutors.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteConfirm}
                  isLoading={deleting}
                >
                  {t("adminDashboard.tutors.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Tutor Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.tutors.editTutor")}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label={t("adminDashboard.tutors.headline")}
                    value={editForm.headline}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        headline: e.target.value,
                      }))
                    }
                    classNames={inputClassNames}
                  />
                  <Textarea
                    label={t("adminDashboard.tutors.bio")}
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    classNames={textareaClassNames}
                    minRows={3}
                  />
                  <Input
                    type="number"
                    label={`${t("adminDashboard.tutors.experience")} (${t("adminDashboard.tutors.months")})`}
                    value={String(editForm.monthExperience)}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        monthExperience: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                    classNames={inputClassNames}
                  />
                  <Input
                    label={t("adminDashboard.tutors.status")}
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    classNames={inputClassNames}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("adminDashboard.tutors.cancel")}
                </Button>
                <Button
                  onPress={handleEditSave}
                  isLoading={saving}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                >
                  {t("adminDashboard.tutors.save")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TutorManagement;
