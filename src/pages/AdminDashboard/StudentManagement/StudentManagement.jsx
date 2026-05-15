import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Export, Eye, Filter, MinimalisticMagnifier, MenuDots, Pen, UsersGroupRounded } from "@solar-icons/react"
import { useNavigate } from "react-router-dom";
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
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";
import { adminApi } from "../../../api";


const StudentManagement = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { inputClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();

  // List state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [students, setStudents] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Stats
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  // Edit modal
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [editForm, setEditForm] = useState({
    notes: "",
    school: "",
    grade: "",
    class: "",
  });
  const [editStudent, setEditStudent] = useState(null);
  const [saving, setSaving] = useState(false);

  // Status modal
  const {
    isOpen: isStatusOpen,
    onOpen: onStatusOpen,
    onClose: onStatusClose,
  } = useDisclosure();
  const [statusStudent, setStatusStudent] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch students list
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, "page-size": pageSize };
      if (debouncedSearch) params["search-term"] = debouncedSearch;
      if (selectedStatus !== "all") params.Status = selectedStatus;

      const response = await adminApi.getAllStudents(params);
      const data = response.data;
      setStudents(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allRes, activeRes] = await Promise.all([
          adminApi.getAllStudents({ "page-size": 1, page: 1 }),
          adminApi.getAllStudents({
            Status: "Active",
            "page-size": 1,
            page: 1,
          }),
        ]);
        setTotalStudentsCount(allRes.data.totalItems || 0);
        setActiveCount(activeRes.data.totalItems || 0);
      } catch {
        // stats are non-critical
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      icon: UsersGroupRounded,
      label: t("adminDashboard.students.stats.totalStudents"),
      value: totalStudentsCount.toLocaleString(),
      color: colors.primary.main,
      bg: colors.background.primaryLight,
    },
    {
      icon: CheckCircle,
      label: t("adminDashboard.students.stats.activeStudents"),
      value: activeCount.toLocaleString(),
      color: colors.state.success,
      bg: `${colors.state.success}20`,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "default";
      case "Suspended":
        return "danger";
      default:
        return "primary";
    }
  };

  const getStudentName = (student) => {
    if (student.user) {
      return `${student.user.firstName || ""} ${student.user.lastName || ""}`.trim();
    }
    return t("adminDashboard.students.nA");
  };

  const getStudentEmail = (student) => {
    return student.user?.email || "";
  };

  // View detail
  const handleViewStudent = (student) => {
    navigate(`/admin/students/${student.id}`);
  };

  // Edit
  const handleEditClick = (student) => {
    setEditStudent(student);
    setEditForm({
      notes: student.notes || "",
      school: student.school || "",
      grade: student.grade || "",
      class: student.class || "",
    });
    onEditOpen();
  };

  const handleEditSave = async () => {
    if (!editStudent) return;
    setSaving(true);
    try {
      await adminApi.updateStudent(
        editStudent.id,
        editStudent.userId,
        editForm,
      );
      onEditClose();
      addToast({
        title: t("adminDashboard.students.updateSuccess"),
        color: "success",
      });
      fetchStudents();
    } catch {
      addToast({
        title: t("adminDashboard.students.updateFailed"),
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  // Status change
  const handleStatusClick = (student) => {
    setStatusStudent(student);
    setNewStatus(student.status || "Active");
    onStatusOpen();
  };

  const handleStatusSave = async () => {
    if (!statusStudent) return;
    setUpdatingStatus(true);
    try {
      await adminApi.updateStudentStatus(statusStudent.id, newStatus);
      onStatusClose();
      addToast({
        title: t("adminDashboard.students.statusUpdateSuccess"),
        color: "success",
      });
      fetchStudents();
      // Refresh stats
      const [allRes, activeRes] = await Promise.all([
        adminApi.getAllStudents({ "page-size": 1, page: 1 }),
        adminApi.getAllStudents({
          Status: "Active",
          "page-size": 1,
          page: 1,
        }),
      ]);
      setTotalStudentsCount(allRes.data.totalItems || 0);
      setActiveCount(activeRes.data.totalItems || 0);
    } catch {
      addToast({
        title: t("adminDashboard.students.statusUpdateFailed"),
        color: "danger",
      });
    } finally {
      setUpdatingStatus(false);
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
            {t("adminDashboard.students.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("adminDashboard.students.subtitle")}
          </p>
        </div>
        {/* <div className="flex gap-2">
          <Button
            variant="flat"
            startContent={<Export weight="BoldDuotone" className="w-4 h-4" />}
            style={{ color: colors.text.primary }}
          >
            {t("adminDashboard.students.export")}
          </Button>
        </div> */}
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
                placeholder={t("adminDashboard.students.searchPlaceholder")}
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
                      {t("adminDashboard.students.status")}:{" "}
                      {selectedStatus === "all"
                        ? t("adminDashboard.students.all")
                        : t(
                            `adminDashboard.students.${selectedStatus.toLowerCase()}`,
                          )}
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
                      {t("adminDashboard.students.all")}
                    </DropdownItem>
                    <DropdownItem key="Active">
                      {t("adminDashboard.students.active")}
                    </DropdownItem>
                    <DropdownItem key="Inactive">
                      {t("adminDashboard.students.inactive")}
                    </DropdownItem>
                    <DropdownItem key="Suspended">
                      {t("adminDashboard.students.suspended")}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card shadow="none" className="border-none" style={tableCardStyle}>
          <CardBody className="p-0">
            <Table
              aria-label="Students table"
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
                  {t("adminDashboard.students.table.student")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.students.table.school")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.students.table.grade")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.students.table.status")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.students.table.joinDate")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.students.table.actions")}
                </TableColumn>
              </TableHeader>
              <TableBody
                isLoading={loading}
                loadingContent={<Spinner size="lg" />}
                emptyContent={t("adminDashboard.students.noData")}
              >
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar src={student.avatar} size="sm" />
                        <div>
                          <p
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {getStudentName(student)}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: colors.text.secondary }}
                          >
                            {getStudentEmail(student)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: colors.text.primary }}>
                        {student.school || t("adminDashboard.students.nA")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: colors.text.primary }}>
                        {student.grade || t("adminDashboard.students.nA")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(student.status)}
                        variant="flat"
                      >
                        {student.status || t("adminDashboard.students.nA")}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: colors.text.secondary }}>
                        {student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString(
                              i18n.language === "vi" ? "vi-VN" : "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : t("adminDashboard.students.nA")}
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
                          <DropdownMenu aria-label="Student actions">
                            <DropdownItem
                              key="view"
                              startContent={<Eye weight="BoldDuotone" className="w-4 h-4" />}
                              onPress={() => handleViewStudent(student)}
                            >
                              {t("adminDashboard.students.view")}
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={
                                <Pen weight="BoldDuotone" className="w-4 h-4" />
                              }
                              onPress={() => handleEditClick(student)}
                            >
                              {t("adminDashboard.students.edit")}
                            </DropdownItem>
                            <DropdownItem
                              key="status"
                              startContent={<CheckCircle weight="BoldDuotone" className="w-4 h-4" />}
                              onPress={() => handleStatusClick(student)}
                            >
                              {t("adminDashboard.students.changeStatus")}
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

      {/* Edit Student Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.students.editStudent")}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label={t("adminDashboard.students.table.school")}
                    value={editForm.school}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        school: e.target.value,
                      }))
                    }
                    classNames={inputClassNames}
                  />
                  <Input
                    label={t("adminDashboard.students.table.grade")}
                    value={editForm.grade}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        grade: e.target.value,
                      }))
                    }
                    classNames={inputClassNames}
                  />
                  <Input
                    label={t("adminDashboard.students.classLabel")}
                    value={editForm.class}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        class: e.target.value,
                      }))
                    }
                    classNames={inputClassNames}
                  />
                  <Input
                    label={t("adminDashboard.students.notes")}
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    classNames={inputClassNames}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("adminDashboard.students.cancel")}
                </Button>
                <Button
                  onPress={handleEditSave}
                  isLoading={saving}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                >
                  {t("adminDashboard.students.save")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Change Status Modal */}
      <Modal isOpen={isStatusOpen} onClose={onStatusClose} size="sm">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.students.changeStatus")}
              </ModalHeader>
              <ModalBody>
                <p className="mb-3" style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.students.changeStatusMsg")}
                </p>
                {statusStudent && (
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar src={statusStudent.avatar} size="sm" />
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {getStudentName(statusStudent)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {getStudentEmail(statusStudent)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {["Active", "Inactive", "Suspended"].map((status) => (
                    <Button
                      key={status}
                      variant={newStatus === status ? "solid" : "flat"}
                      color={
                        status === "Active"
                          ? "success"
                          : status === "Suspended"
                            ? "danger"
                            : "default"
                      }
                      onPress={() => setNewStatus(status)}
                      className="justify-start"
                    >
                      {t(`adminDashboard.students.${status.toLowerCase()}`)}
                    </Button>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("adminDashboard.students.cancel")}
                </Button>
                <Button
                  onPress={handleStatusSave}
                  isLoading={updatingStatus}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                >
                  {t("adminDashboard.students.save")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default StudentManagement;
