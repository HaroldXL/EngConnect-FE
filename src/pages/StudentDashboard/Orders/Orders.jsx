import { useState, useEffect, useCallback } from "react";
import {
  AltArrowDown,
  CheckCircle,
  ClipboardList,
  ClockCircle,
  CloseCircle,
  Eye,
  Filter,
  Hourglass,
  Restart,
  SquareAltArrowRight,
} from "@solar-icons/react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Tabs,
  Tab,
  useDisclosure,
} from "@heroui/react";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";
import { studentApi, coursesApi, paymentApi } from "../../../api";
import LessonDetailModal from "../../../components/LessonDetailModal/LessonDetailModal";
import { selectUser } from "../../../store";

const PAGE_SIZE = 10;

const parseMeta = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const formatAmount = (amount, currency) =>
  new Intl.NumberFormat("vi-VN").format(amount) + " " + (currency || "VND");

const formatDate = (iso, locale = "en-GB") =>
  new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ORDER_STATUSES = ["All", "Paid", "Pending", "Failed", "Cancelled"];

const DetailRow = ({ label, children }) => {
  const colors = useThemeColors();
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "#9CA3AF" }}
      >
        {label}
      </span>
      <div className="text-sm" style={{ color: colors.text.primary }}>
        {children}
      </div>
    </div>
  );
};

const Orders = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { tableCardStyle, tableClassNames } = useTableStyles();

  const getOrderStatusColor = (s) => {
    switch (s) {
      case "Paid":
        return colors.state.success;
      case "Pending":
        return colors.state.warning;
      case "Failed":
      case "Cancelled":
        return colors.state.error;
      default:
        return colors.text.tertiary;
    }
  };

  const getOrderStatusIcon = (s) => {
    switch (s) {
      case "Paid":
        return CheckCircle;
      case "Pending":
        return Hourglass;
      case "Failed":
      case "Cancelled":
        return CloseCircle;
      default:
        return Hourglass;
    }
  };

  const getRefundStatusColor = (s) => {
    switch (s) {
      case "Paid":
        return colors.state.success;
      case "Failed":
        return colors.state.error;
      default:
        return colors.text.tertiary;
    }
  };

  const getRefundStatusIcon = (s) => {
    switch (s) {
      case "Paid":
        return CheckCircle;
      case "Failed":
        return CloseCircle;
      default:
        return Hourglass;
    }
  };

  const getRefundTypeColor = (type) => {
    switch (type) {
      case "CourseCancellation":
        return colors.state.warning;
      case "NoTutorLesson":
        return colors.state.info;
      case "TutorCancellation":
        return colors.state.error;
      case "StudentRequest":
        return colors.primary.main;
      default:
        return colors.text.tertiary;
    }
  };

  const { t, i18n } = useTranslation();
  const user = useSelector(selectUser);

  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-GB";

  const STATUS_LABELS = {
    All: t("studentDashboard.orders.status.all"),
    Paid: t("studentDashboard.orders.status.paid"),
    Pending: t("studentDashboard.orders.status.pending"),
    Failed: t("studentDashboard.orders.status.failed"),
    Cancelled: t("studentDashboard.orders.status.cancelled"),
  };

  const REFUND_TYPE_LABEL = {
    NoTutorLesson: t("studentDashboard.orders.refundType.NoTutorLesson"),
    CourseCancellation: t(
      "studentDashboard.orders.refundType.CourseCancellation",
    ),
    StudentRequest: t("studentDashboard.orders.refundType.StudentRequest"),
    TutorCancellation: t(
      "studentDashboard.orders.refundType.TutorCancellation",
    ),
  };

  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const [courseMap, setCourseMap] = useState({});

  // Refunds tab state
  const [activeTab, setActiveTab] = useState("orders");
  const [refunds, setRefunds] = useState([]);
  const [refundsPage, setRefundsPage] = useState(1);
  const [refundsTotalPages, setRefundsTotalPages] = useState(1);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundSubjectMap, setRefundSubjectMap] = useState({});
  const [selectedLessonForDetail, setSelectedLessonForDetail] = useState(null);
  const {
    isOpen: isLessonDetailOpen,
    onOpen: onLessonDetailOpen,
    onClose: onLessonDetailClose,
  } = useDisclosure();
  const {
    isOpen: isRefundOpen,
    onOpen: onRefundOpen,
    onClose: onRefundClose,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.studentId) return;
    setLoading(true);
    try {
      const params = {
        page,
        "page-size": PAGE_SIZE,
        //"sort-params": "OrderNo-asc",
        StudentId: user.studentId,
      };
      if (statusFilter !== "All") params.Status = statusFilter;
      const res = await studentApi.getMyOrders(params);
      const data = res.data || {};
      setOrders(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, user?.studentId]);

  const fetchRefunds = useCallback(async () => {
    if (!user?.studentId) return;
    setRefundsLoading(true);
    try {
      const res = await paymentApi.getStudentRefunds({
        StudentId: user.studentId,
        Status: "Paid",
        page: refundsPage,
        "page-size": PAGE_SIZE,
      });
      const data = res.data || {};
      setRefunds(data.items || []);
      setRefundsTotalPages(data.totalPages || 1);
    } catch {
      setRefunds([]);
    } finally {
      setRefundsLoading(false);
    }
  }, [user?.studentId, refundsPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (activeTab === "refunds") fetchRefunds();
  }, [activeTab, fetchRefunds]);

  // Fetch subject info (course or lesson) for each refund
  useEffect(() => {
    if (!refunds.length) return;
    const pending = refunds.filter((r) => !refundSubjectMap[r.id]);
    if (!pending.length) return;
    Promise.all(
      pending.map(async (refund) => {
        if (refund.refundType === "CourseCancellation" && refund.enrollmentId) {
          try {
            const res = await coursesApi.getCourseEnrollmentById(
              refund.enrollmentId,
            );
            const enrollment = res.data || {};
            return {
              id: refund.id,
              courseTitle: enrollment.course?.title || "Unknown Course",
              tutorName:
                `${enrollment.course?.tutorFirstName || ""} ${enrollment.course?.tutorLastName || ""}`.trim(),
              completedSessions: enrollment.numOfCompleteSession ?? 0,
              totalSessions: enrollment.numsOfSession ?? 0,
              courseId: enrollment.courseId,
            };
          } catch {
            return { id: refund.id, courseTitle: "Unknown Course" };
          }
        }
        if (refund.refundType === "NoTutorLesson" && refund.lessonId) {
          try {
            const res = await studentApi.getLessonById(refund.lessonId);
            const lesson = res.data || {};
            return {
              id: refund.id,
              sessionTitle: lesson.sessionTitle || "Lesson",
              lessonStart: lesson.startTime,
              lessonEnd: lesson.endTime,
              lessonStatus: lesson.status,
              lessonData: lesson,
            };
          } catch {
            return { id: refund.id, sessionTitle: "Unknown Lesson" };
          }
        }
        return { id: refund.id };
      }),
    ).then((results) => {
      setRefundSubjectMap((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          if (r) next[r.id] = r;
        });
        return next;
      });
    });
  }, [refunds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve course names
  useEffect(() => {
    if (!orders.length) return;
    const ids = [
      ...new Set(
        orders.map((o) => parseMeta(o.metaData).courseId).filter(Boolean),
      ),
    ];
    const missing = ids.filter((id) => !courseMap[id]);
    if (!missing.length) return;
    Promise.all(
      missing.map((id) =>
        coursesApi
          .getCourseById(id)
          .then((res) => ({
            id,
            title: res.data?.title || res.data?.name || "Unknown Course",
          }))
          .catch(() => ({ id, title: "Unknown Course" })),
      ),
    ).then((results) => {
      setCourseMap((prev) => {
        const next = { ...prev };
        results.forEach(({ id, title }) => {
          next[id] = title;
        });
        return next;
      });
    });
  }, [orders]); // eslint-disable-line react-hooks/exhaustive-deps

  // Summary counts
  const paidCount = orders.filter((o) => o.status === "Paid").length;
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const cancelledCount = orders.filter((o) => o.status === "Cancelled").length;

  const selectedMeta = selected ? parseMeta(selected.metaData) : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <h1
          className="text-2xl lg:text-3xl font-bold mb-1"
          style={{ color: colors.text.primary }}
        >
          {t("studentDashboard.orders.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("studentDashboard.orders.subtitle")}
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: t("studentDashboard.orders.summary.paid"),
            value: paidCount,
            icon: CheckCircle,
            color: colors.state.success,
            bg: `${colors.state.success}20`,
          },
          {
            label: t("studentDashboard.orders.summary.pending"),
            value: pendingCount,
            icon: ClockCircle,
            color: colors.state.warning,
            bg: `${colors.state.warning}20`,
          },
          {
            label: t("studentDashboard.orders.summary.cancelled"),
            value: cancelledCount,
            icon: CloseCircle,
            color: colors.state.error,
            bg: `${colors.state.error}20`,
          },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: i * 0.05 }}
          >
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-4 flex flex-row items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: s.bg }}
                >
                  <s.icon
                    className="w-5 h-5"
                    weight="BoldDuotone"
                    style={{ color: s.color }}
                  />
                </div>
                <div>
                  <p
                    className="text-xl font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    {s.label}
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        color="primary"
      >
        {/* ── Orders Tab ─────────────────────────────────────────── */}
        <Tab
          key="orders"
          title={
            <div className="flex items-center gap-2">
              <ClipboardList weight="BoldDuotone" className="w-4 h-4" />
              {t("studentDashboard.orders.tabs.orders")}
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            {/* Filter */}
            <div className="flex items-center gap-3">
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    startContent={
                      <Filter weight="BoldDuotone" className="w-4 h-4" />
                    }
                    endContent={
                      <AltArrowDown weight="BoldDuotone" className="w-4 h-4" />
                    }
                    style={{ color: colors.text.primary }}
                  >
                    {t("studentDashboard.orders.filter.status", {
                      value: STATUS_LABELS[statusFilter] ?? statusFilter,
                    })}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Status filter"
                  selectedKeys={[statusFilter]}
                  selectionMode="single"
                  onAction={(key) => {
                    setStatusFilter(key);
                    setPage(1);
                  }}
                >
                  {ORDER_STATUSES.map((s) => (
                    <DropdownItem key={s}>{STATUS_LABELS[s] ?? s}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                shadow="none"
                className="border-none"
                style={tableCardStyle}
              >
                <CardBody className="p-0">
                  <Table
                    aria-label="My orders"
                    classNames={tableClassNames}
                    bottomContent={
                      totalPages > 1 && (
                        <div className="flex w-full justify-center py-4">
                          <Pagination
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            page={page}
                            total={totalPages}
                            onChange={setPage}
                          />
                        </div>
                      )
                    }
                  >
                    <TableHeader>
                      <TableColumn>
                        {t("studentDashboard.orders.table.orderNo")}
                      </TableColumn>
                      <TableColumn>
                        {t("studentDashboard.orders.table.course")}
                      </TableColumn>
                      <TableColumn>
                        {t("studentDashboard.orders.table.schedule")}
                      </TableColumn>
                      <TableColumn>
                        {t("studentDashboard.orders.table.amount")}
                      </TableColumn>
                      <TableColumn>
                        {t("studentDashboard.orders.table.status")}
                      </TableColumn>
                      <TableColumn>
                        {t("studentDashboard.orders.table.date")}
                      </TableColumn>
                      <TableColumn> </TableColumn>
                    </TableHeader>
                    <TableBody
                      isLoading={loading}
                      loadingContent={<Spinner color="primary" />}
                      emptyContent={
                        !loading && (
                          <div className="flex flex-col items-center gap-2 py-8">
                            <ClipboardList
                              weight="BoldDuotone"
                              className="w-10 h-10"
                              style={{ color: colors.text.tertiary }}
                            />
                            <span style={{ color: colors.text.tertiary }}>
                              {t("studentDashboard.orders.table.empty")}
                            </span>
                          </div>
                        )
                      }
                    >
                      {orders.map((order) => {
                        const meta = parseMeta(order.metaData);
                        const slots = meta.scheduleSlots || [];
                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              <span
                                className="font-mono text-sm font-semibold"
                                style={{ color: colors.primary.main }}
                              >
                                #{order.orderNo}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className="text-sm font-medium"
                                style={{ color: colors.text.primary }}
                              >
                                {meta.courseId
                                  ? courseMap[meta.courseId] ||
                                    t("studentDashboard.orders.table.loading")
                                  : "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className="text-sm"
                                style={{ color: colors.text.secondary }}
                              >
                                {slots.length
                                  ? slots
                                      .map(
                                        (s) =>
                                          `${s.weekday.slice(0, 3)} ${s.startTime.slice(0, 5)}`,
                                      )
                                      .join(", ")
                                  : "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className="font-medium text-sm"
                                style={{ color: colors.text.primary }}
                              >
                                {formatAmount(
                                  order.totalAmount,
                                  order.currency,
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const OrderStatusIcon = getOrderStatusIcon(
                                  order.status,
                                );
                                return (
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    startContent={
                                      <OrderStatusIcon
                                        weight="BoldDuotone"
                                        className="w-3.5 h-3.5"
                                      />
                                    }
                                    style={{
                                      backgroundColor: `${getOrderStatusColor(order.status)}15`,
                                      color: getOrderStatusColor(order.status),
                                    }}
                                  >
                                    {STATUS_LABELS[order.status] ??
                                      order.status}
                                  </Chip>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <span
                                className="text-sm"
                                style={{ color: colors.text.tertiary }}
                              >
                                {formatDate(order.createdAt, dateLocale)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => {
                                  setSelected(order);
                                  onOpen();
                                }}
                              >
                                <Eye
                                  weight="BoldDuotone"
                                  className="w-4 h-4"
                                  style={{ color: colors.text.secondary }}
                                />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </Tab>

        {/* ── Refunds Tab ─────────────────────────────────────────── */}
        <Tab
          key="refunds"
          title={
            <div className="flex items-center gap-2">
              <Restart weight="BoldDuotone" className="w-4 h-4" />
              {t("studentDashboard.orders.tabs.refunds")}
            </div>
          }
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="pt-2"
          >
            <Card shadow="none" className="border-none" style={tableCardStyle}>
              <CardBody className="p-0">
                <Table
                  aria-label="My refunds"
                  classNames={tableClassNames}
                  bottomContent={
                    refundsTotalPages > 1 && (
                      <div className="flex w-full justify-center py-4">
                        <Pagination
                          isCompact
                          showControls
                          showShadow
                          color="primary"
                          page={refundsPage}
                          total={refundsTotalPages}
                          onChange={setRefundsPage}
                        />
                      </div>
                    )
                  }
                >
                  <TableHeader>
                    <TableColumn>
                      {t("studentDashboard.orders.refundTable.type")}
                    </TableColumn>
                    <TableColumn>
                      {t("studentDashboard.orders.refundTable.subject")}
                    </TableColumn>
                    <TableColumn>
                      {t("studentDashboard.orders.table.amount")}
                    </TableColumn>
                    <TableColumn>
                      {t("studentDashboard.orders.refundTable.account")}
                    </TableColumn>
                    <TableColumn>
                      {t("studentDashboard.orders.refundTable.paidOn")}
                    </TableColumn>
                    <TableColumn> </TableColumn>
                  </TableHeader>
                  <TableBody
                    isLoading={refundsLoading}
                    loadingContent={<Spinner color="primary" />}
                    emptyContent={
                      !refundsLoading && (
                        <div className="flex flex-col items-center gap-2 py-8">
                          <Restart
                            weight="BoldDuotone"
                            className="w-10 h-10"
                            style={{ color: colors.text.tertiary }}
                          />
                          <span style={{ color: colors.text.tertiary }}>
                            No refunds yet.
                          </span>
                        </div>
                      )
                    }
                  >
                    {refunds.map((refund) => {
                      const subject = refundSubjectMap[refund.id];

                      let subjectCell;
                      if (!subject) {
                        subjectCell = (
                          <span style={{ color: colors.text.tertiary }}>
                            {t("studentDashboard.orders.table.loading")}
                          </span>
                        );
                      } else if (refund.refundType === "CourseCancellation") {
                        subjectCell = <span>{subject.courseTitle || "—"}</span>;
                      } else if (refund.refundType === "NoTutorLesson") {
                        subjectCell = (
                          <span>{subject.sessionTitle || "—"}</span>
                        );
                      } else {
                        subjectCell = <span>—</span>;
                      }
                      // replace loading span with i18n
                      if (!subject)
                        subjectCell = (
                          <span style={{ color: colors.text.tertiary }}>
                            {t("studentDashboard.orders.table.loading")}
                          </span>
                        );

                      return (
                        <TableRow key={refund.id}>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              style={{
                                backgroundColor: `${getRefundTypeColor(refund.refundType)}15`,
                                color: getRefundTypeColor(refund.refundType),
                              }}
                            >
                              {REFUND_TYPE_LABEL[refund.refundType] ||
                                refund.refundType}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <span
                              className="text-sm"
                              style={{ color: colors.text.primary }}
                            >
                              {subjectCell}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className="font-semibold text-sm"
                              style={{ color: colors.state.success }}
                            >
                              +
                              {formatAmount(
                                refund.totalAmount,
                                refund.currency,
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className="text-sm font-mono"
                              style={{ color: colors.text.primary }}
                            >
                              {refund.bankAccountNumber || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className="text-sm"
                              style={{ color: colors.text.tertiary }}
                            >
                              {refund.paidAt
                                ? formatDate(refund.paidAt, dateLocale)
                                : "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => {
                                setSelectedRefund(refund);
                                onRefundOpen();
                              }}
                            >
                              <Eye
                                weight="BoldDuotone"
                                className="w-4 h-4"
                                style={{ color: colors.text.secondary }}
                              />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </motion.div>
        </Tab>
      </Tabs>

      {/* Order Detail Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            {t("studentDashboard.orders.orderDetail.title", {
              orderNo: selected?.orderNo,
            })}
          </ModalHeader>
          <ModalBody className="pb-6">
            {selected && (
              <div className="space-y-4">
                <DetailRow
                  label={t("studentDashboard.orders.orderDetail.status")}
                >
                  {(() => {
                    const OrderStatusIcon = getOrderStatusIcon(selected.status);
                    return (
                      <Chip
                        size="sm"
                        variant="flat"
                        startContent={
                          <OrderStatusIcon
                            weight="BoldDuotone"
                            className="w-3.5 h-3.5"
                          />
                        }
                        style={{
                          backgroundColor: `${getOrderStatusColor(selected.status)}15`,
                          color: getOrderStatusColor(selected.status),
                        }}
                      >
                        {STATUS_LABELS[selected.status] ?? selected.status}
                      </Chip>
                    );
                  })()}
                </DetailRow>

                {selectedMeta.courseId && (
                  <DetailRow
                    label={t("studentDashboard.orders.orderDetail.course")}
                  >
                    <button
                      className="flex items-center gap-1 font-medium hover:underline"
                      style={{ color: colors.primary.main }}
                      onClick={() => {
                        onClose();
                        navigate(`/courses/${selectedMeta.courseId}`);
                      }}
                    >
                      {courseMap[selectedMeta.courseId] ||
                        selectedMeta.courseId}
                      <SquareAltArrowRight
                        weight="BoldDuotone"
                        className="w-3.5 h-3.5"
                      />
                    </button>
                  </DetailRow>
                )}

                {selectedMeta.scheduleSlots?.length > 0 && (
                  <DetailRow
                    label={t("studentDashboard.orders.orderDetail.schedule")}
                  >
                    <div className="space-y-0.5">
                      {selectedMeta.scheduleSlots.map((s, i) => (
                        <div key={i}>
                          {s.weekday} — {s.startTime.slice(0, 5)} –{" "}
                          {s.endTime.slice(0, 5)}
                        </div>
                      ))}
                    </div>
                  </DetailRow>
                )}

                <DetailRow
                  label={t("studentDashboard.orders.orderDetail.amount")}
                >
                  <span className="font-semibold">
                    {formatAmount(selected.totalAmount, selected.currency)}
                  </span>
                </DetailRow>

                <DetailRow
                  label={t("studentDashboard.orders.orderDetail.description")}
                >
                  {selected.description || "—"}
                </DetailRow>

                <DetailRow
                  label={t("studentDashboard.orders.orderDetail.paymentRef")}
                >
                  {selected.paymentReference || "—"}
                </DetailRow>

                <DetailRow
                  label={t("studentDashboard.orders.orderDetail.orderedOn")}
                >
                  {formatDate(selected.createdAt, dateLocale)}
                </DetailRow>

                {selected.status === "Paid" && (
                  <DetailRow
                    label={t("studentDashboard.orders.orderDetail.paidOn")}
                  >
                    {formatDate(selected.updatedAt, dateLocale)}
                  </DetailRow>
                )}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Refund Detail Modal */}
      <Modal
        isOpen={isRefundOpen}
        onClose={onRefundClose}
        size="md"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader
            className="flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <Restart
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.state.success }}
            />
            {t("studentDashboard.orders.refundDetail.title")}
          </ModalHeader>
          <ModalBody className="pb-6">
            {selectedRefund &&
              (() => {
                const subject = refundSubjectMap[selectedRefund.id];
                return (
                  <div className="space-y-4">
                    <DetailRow
                      label={t("studentDashboard.orders.refundDetail.type")}
                    >
                      <Chip
                        size="sm"
                        variant="flat"
                        style={{
                          backgroundColor: `${getRefundTypeColor(selectedRefund.refundType)}15`,
                          color: getRefundTypeColor(selectedRefund.refundType),
                          fontWeight: 600,
                        }}
                      >
                        {REFUND_TYPE_LABEL[selectedRefund.refundType] ||
                          selectedRefund.refundType}
                      </Chip>
                    </DetailRow>

                    {/* CourseCancellation — show course info */}
                    {selectedRefund.refundType === "CourseCancellation" && (
                      <DetailRow
                        label={t("studentDashboard.orders.refundDetail.course")}
                      >
                        {subject?.courseTitle ? (
                          <button
                            className="flex items-center gap-1 font-medium hover:underline"
                            style={{ color: colors.primary.main }}
                            onClick={() => {
                              onRefundClose();
                              if (subject.courseId)
                                navigate(`/courses/${subject.courseId}`);
                            }}
                          >
                            {subject.courseTitle}
                            <SquareAltArrowRight
                              weight="BoldDuotone"
                              className="w-3.5 h-3.5"
                            />
                          </button>
                        ) : (
                          <span style={{ color: colors.text.tertiary }}>
                            {t("studentDashboard.orders.table.loading")}
                          </span>
                        )}
                      </DetailRow>
                    )}

                    {selectedRefund.refundType === "CourseCancellation" &&
                      subject?.tutorName && (
                        <DetailRow
                          label={t(
                            "studentDashboard.orders.refundDetail.tutor",
                          )}
                        >
                          {subject.tutorName}
                        </DetailRow>
                      )}

                    {selectedRefund.refundType === "CourseCancellation" &&
                      subject && (
                        <DetailRow
                          label={t(
                            "studentDashboard.orders.refundDetail.sessionsCompleted",
                          )}
                        >
                          {subject.completedSessions} / {subject.totalSessions}
                        </DetailRow>
                      )}

                    {/* NoTutorLesson — show lesson info */}
                    {selectedRefund.refundType === "NoTutorLesson" && (
                      <DetailRow
                        label={t("studentDashboard.orders.refundDetail.lesson")}
                      >
                        {subject?.sessionTitle ? (
                          <button
                            className="flex items-center gap-1 font-medium hover:underline"
                            style={{ color: colors.primary.main }}
                            onClick={() => {
                              if (subject.lessonData) {
                                setSelectedLessonForDetail(subject.lessonData);
                                onLessonDetailOpen();
                              }
                            }}
                          >
                            {subject.sessionTitle}
                            <SquareAltArrowRight
                              weight="BoldDuotone"
                              className="w-3.5 h-3.5"
                            />
                          </button>
                        ) : (
                          <span style={{ color: colors.text.tertiary }}>
                            {t("studentDashboard.orders.table.loading")}
                          </span>
                        )}
                      </DetailRow>
                    )}

                    {selectedRefund.refundType === "NoTutorLesson" &&
                      subject?.lessonStart &&
                      subject?.lessonEnd && (
                        <DetailRow
                          label={t("studentDashboard.orders.refundDetail.time")}
                        >
                          {new Date(subject.lessonStart).toLocaleString(
                            dateLocale,
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                          {" – "}
                          {new Date(subject.lessonEnd).toLocaleTimeString(
                            dateLocale,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </DetailRow>
                      )}

                    <DetailRow
                      label={t("studentDashboard.orders.refundDetail.status")}
                    >
                      {(() => {
                        const RefundStatusIcon = getRefundStatusIcon(
                          selectedRefund.status,
                        );
                        return (
                          <Chip
                            size="sm"
                            variant="flat"
                            startContent={
                              <RefundStatusIcon
                                weight="BoldDuotone"
                                className="w-3.5 h-3.5"
                              />
                            }
                            style={{
                              backgroundColor: `${getRefundStatusColor(selectedRefund.status)}15`,
                              color: getRefundStatusColor(
                                selectedRefund.status,
                              ),
                            }}
                          >
                            {STATUS_LABELS[selectedRefund.status] ??
                              selectedRefund.status}
                          </Chip>
                        );
                      })()}
                    </DetailRow>

                    <DetailRow
                      label={t("studentDashboard.orders.refundDetail.amount")}
                    >
                      <span
                        className="font-semibold text-base"
                        style={{ color: colors.state.success }}
                      >
                        +
                        {formatAmount(
                          selectedRefund.totalAmount,
                          selectedRefund.currency,
                        )}
                      </span>
                    </DetailRow>

                    <DetailRow
                      label={t(
                        "studentDashboard.orders.refundDetail.accountNumber",
                      )}
                    >
                      <span className="font-mono">
                        {selectedRefund.bankAccountNumber || "—"}
                      </span>
                    </DetailRow>

                    <DetailRow
                      label={t(
                        "studentDashboard.orders.refundDetail.accountName",
                      )}
                    >
                      {selectedRefund.bankAccountName || "—"}
                    </DetailRow>

                    {selectedRefund.note && (
                      <DetailRow
                        label={t("studentDashboard.orders.refundDetail.note")}
                      >
                        {selectedRefund.note}
                      </DetailRow>
                    )}

                    {selectedRefund.externalTransactionId && (
                      <DetailRow
                        label={t(
                          "studentDashboard.orders.refundDetail.transactionId",
                        )}
                      >
                        <span className="font-mono text-xs break-all">
                          {selectedRefund.externalTransactionId}
                        </span>
                      </DetailRow>
                    )}

                    <DetailRow
                      label={t(
                        "studentDashboard.orders.refundDetail.requestedOn",
                      )}
                    >
                      {formatDate(selectedRefund.requestedAt, dateLocale)}
                    </DetailRow>

                    {selectedRefund.paidAt && (
                      <DetailRow
                        label={t("studentDashboard.orders.refundDetail.paidOn")}
                      >
                        {formatDate(selectedRefund.paidAt, dateLocale)}
                      </DetailRow>
                    )}
                  </div>
                );
              })()}
          </ModalBody>
        </ModalContent>
      </Modal>
      <LessonDetailModal
        isOpen={isLessonDetailOpen}
        onClose={onLessonDetailClose}
        lesson={selectedLessonForDetail}
        role="student"
      />
    </div>
  );
};

export default Orders;
