import { useState, useEffect, useCallback } from "react";
import { AltArrowDown, Card as CardIcon, CheckCircle, ClipboardList, ClockCircle, CloseCircle, Eye, Filter, Restart, SquareAltArrowRight } from "@solar-icons/react"
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
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

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ORDER_STATUSES = ["All", "Paid", "Pending", "Failed", "Cancelled"];

const REFUND_TYPE_LABEL = {
  NoTutorLesson: "No-Tutor Lesson",
  StudentRequest: "Student Request",
  TutorCancellation: "Tutor Cancellation",
};

const statusColor = (s) => {
  if (s === "Paid") return "success";
  if (s === "Pending") return "warning";
  if (s === "Failed") return "danger";
  if (s === "Cancelled") return "danger";
  return "default";
};

const statusIcon = (s) => {
  if (s === "Paid") return <CheckCircle className="w-4 h-4" weight="BoldDuotone" />;
  if (s === "Pending") return <ClockCircle className="w-4 h-4" weight="BoldDuotone" />;
  if (s === "Failed") return <CloseCircle className="w-4 h-4" weight="BoldDuotone" />;
  if (s === "Cancelled") return <CloseCircle className="w-4 h-4" weight="BoldDuotone" />;
  return null;
};

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
  const user = useSelector(selectUser);

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
          My Payment
        </h1>
        <p style={{ color: colors.text.secondary }}>
          View your course purchase history and payment status.
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Paid",
            value: paidCount,
            icon: CheckCircle,
            color: colors.state.success,
            bg: `${colors.state.success}20`,
          },
          {
            label: "Pending",
            value: pendingCount,
            icon: ClockCircle,
            color: colors.state.warning,
            bg: `${colors.state.warning}20`,
          },
          {
            label: "Cancelled",
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
              Orders
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
                    startContent={<Filter weight="BoldDuotone" className="w-4 h-4" />}
                    endContent={<AltArrowDown weight="BoldDuotone" className="w-4 h-4" />}
                    style={{ color: colors.text.primary }}
                  >
                    Status: {statusFilter}
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
                    <DropdownItem key={s}>{s}</DropdownItem>
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
                      <TableColumn>Order #</TableColumn>
                      <TableColumn>Course</TableColumn>
                      <TableColumn>Schedule</TableColumn>
                      <TableColumn>Amount</TableColumn>
                      <TableColumn>Status</TableColumn>
                      <TableColumn>Date</TableColumn>
                      <TableColumn> </TableColumn>
                    </TableHeader>
                    <TableBody
                      isLoading={loading}
                      loadingContent={<Spinner color="primary" />}
                      emptyContent={
                        !loading && (
                          <div className="flex flex-col items-center gap-2 py-8">
                            <ClipboardList weight="BoldDuotone"
                              className="w-10 h-10"
                              style={{ color: colors.text.tertiary }}
                            />
                            <span style={{ color: colors.text.tertiary }}>
                              No orders yet.
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
                                  ? courseMap[meta.courseId] || "Loading..."
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
                              <Chip
                                size="sm"
                                variant="flat"
                                color={statusColor(order.status)}
                                startContent={statusIcon(order.status)}
                              >
                                {order.status}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <span
                                className="text-sm"
                                style={{ color: colors.text.tertiary }}
                              >
                                {formatDate(order.createdAt)}
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
                                <Eye weight="BoldDuotone"
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
              Refunds
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
                    <TableColumn>Type</TableColumn>
                    <TableColumn>Amount</TableColumn>
                    <TableColumn>Card</TableColumn>
                    <TableColumn>Account</TableColumn>
                    <TableColumn>Paid On</TableColumn>
                    <TableColumn> </TableColumn>
                  </TableHeader>
                  <TableBody
                    isLoading={refundsLoading}
                    loadingContent={<Spinner color="primary" />}
                    emptyContent={
                      !refundsLoading && (
                        <div className="flex flex-col items-center gap-2 py-8">
                          <Restart weight="BoldDuotone"
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
                    {refunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell>
                          <Chip size="sm" variant="flat" color="secondary">
                            {REFUND_TYPE_LABEL[refund.refundType] ||
                              refund.refundType}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <span
                            className="font-semibold text-sm"
                            style={{ color: colors.state.success }}
                          >
                            +{formatAmount(refund.totalAmount, refund.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className="text-sm"
                            style={{ color: colors.text.secondary }}
                          >
                            {refund.bankCode || "—"}
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
                            {refund.paidAt ? formatDate(refund.paidAt) : "—"}
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
                            <Eye weight="BoldDuotone"
                              className="w-4 h-4"
                              style={{ color: colors.text.secondary }}
                            />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
            Order #{selected?.orderNo} — Details
          </ModalHeader>
          <ModalBody className="pb-6">
            {selected && (
              <div className="space-y-4">
                <DetailRow label="Status">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={statusColor(selected.status)}
                    startContent={statusIcon(selected.status)}
                  >
                    {selected.status}
                  </Chip>
                </DetailRow>

                {selectedMeta.courseId && (
                  <DetailRow label="Course">
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
                      <SquareAltArrowRight weight="BoldDuotone" className="w-3.5 h-3.5" />
                    </button>
                  </DetailRow>
                )}

                {selectedMeta.scheduleSlots?.length > 0 && (
                  <DetailRow label="Schedule">
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

                <DetailRow label="Amount">
                  <span className="font-semibold">
                    {formatAmount(selected.totalAmount, selected.currency)}
                  </span>
                </DetailRow>

                <DetailRow label="Description">
                  {selected.description || "—"}
                </DetailRow>

                <DetailRow label="Payment Reference">
                  {selected.paymentReference || "—"}
                </DetailRow>

                <DetailRow label="Ordered On">
                  {formatDate(selected.createdAt)}
                </DetailRow>

                {selected.status === "Paid" && (
                  <DetailRow label="Paid On">
                    {formatDate(selected.updatedAt)}
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
            <Restart weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.state.success }}
            />
            Refund Details
          </ModalHeader>
          <ModalBody className="pb-6">
            {selectedRefund && (
              <div className="space-y-4">
                <DetailRow label="Type">
                  <Chip size="sm" variant="flat" color="secondary">
                    {REFUND_TYPE_LABEL[selectedRefund.refundType] ||
                      selectedRefund.refundType}
                  </Chip>
                </DetailRow>

                <DetailRow label="Status">
                  <Chip
                    size="sm"
                    variant="flat"
                    color="success"
                    startContent={
                      <CheckCircle className="w-4 h-4" weight="BoldDuotone" />
                    }
                  >
                    {selectedRefund.status}
                  </Chip>
                </DetailRow>

                <DetailRow label="Amount">
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

                <DetailRow label="Card">
                  <div className="flex items-center gap-1.5">
                    <Card
                      className="w-4 h-4"
                      style={{ color: colors.text.secondary }}
                    />
                    {selectedRefund.bankCode || "—"}
                  </div>
                </DetailRow>

                <DetailRow label="Account Number">
                  <span className="font-mono">
                    {selectedRefund.bankAccountNumber || "—"}
                  </span>
                </DetailRow>

                <DetailRow label="Account Name">
                  {selectedRefund.bankAccountName || "—"}
                </DetailRow>

                {selectedRefund.note && (
                  <DetailRow label="Note">{selectedRefund.note}</DetailRow>
                )}

                {selectedRefund.externalTransactionId && (
                  <DetailRow label="Transaction ID">
                    <span className="font-mono text-xs break-all">
                      {selectedRefund.externalTransactionId}
                    </span>
                  </DetailRow>
                )}

                <DetailRow label="Requested On">
                  {formatDate(selectedRefund.requestedAt)}
                </DetailRow>

                {selectedRefund.paidAt && (
                  <DetailRow label="Paid On">
                    {formatDate(selectedRefund.paidAt)}
                  </DetailRow>
                )}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Orders;
