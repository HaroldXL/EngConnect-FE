import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  AltArrowDown,
  CheckCircle,
  ClipboardList,
  CloseCircle,
  Eye,
  Filter,
  MinimalisticMagnifier,
  Restart,
  SortHorizontal,
  SquareAltArrowRight,
  SquareBottomUp,
} from "@solar-icons/react";
import { useTranslation } from "react-i18next";
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
  Pagination,
  Tabs,
  Tab,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useTableStyles from "../../../hooks/useTableStyles";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";
import { adminApi, coursesApi, paymentApi } from "../../../api";

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

const formatSlots = (slots = []) =>
  slots
    .map(
      (s) => `${s.weekday} ${s.startTime.slice(0, 5)}–${s.endTime.slice(0, 5)}`,
    )
    .join("\n");

const ORDER_STATUSES = ["All", "Paid", "Pending", "Cancelled"];
const TXN_STATUSES = ["All", "Success", "Pending", "Failed"];
const REFUND_TYPES = ["All", "CourseCancellation", "NoTutorLesson"];
const REFUND_STATUSES = ["All", "Paid", "Failed"];

const REFUND_TYPE_COLORS = {
  CourseCancellation: "#F59E0B",
  NoTutorLesson: "#3B82F6",
  TutorCancellation: "#EF4444",
  StudentRequest: "#6366F1",
};

const refundStatusColor = (s) => {
  if (s === "Paid") return "success";
  if (s === "Failed") return "danger";
  return "default";
};

const orderStatusColor = (s) => {
  if (s === "Paid") return "success";
  if (s === "Pending") return "warning";
  if (s === "Cancelled") return "danger";
  return "default";
};

const txnStatusColor = (s) => {
  if (s === "Success") return "success";
  if (s === "Pending") return "warning";
  if (s === "Failed") return "danger";
  return "default";
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

const FinancialManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { tableCardStyle, tableClassNames } = useTableStyles();
  const { inputClassNames } = useInputStyles();

  const [activeTab, setActiveTab] = useState("orders");

  // Orders tab state
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersDebSearch, setOrdersDebSearch] = useState("");
  const [ordersStatus, setOrdersStatus] = useState("All");

  // Transactions tab state
  const [txnsPage, setTxnsPage] = useState(1);
  const [txnsSearch, setTxnsSearch] = useState("");
  const [txnsDebSearch, setTxnsDebSearch] = useState("");
  const [txnsStatus, setTxnsStatus] = useState("All");

  // Refunds tab state
  const [refundsPage, setRefundsPage] = useState(1);
  const [refundsStatus, setRefundsStatus] = useState("All");
  const [refundsType, setRefundsType] = useState("All");
  const [refundsTutorId, setRefundsTutorId] = useState("");

  // Lookup caches
  const [courseMap, setCourseMap] = useState({});
  const [studentMap, setStudentMap] = useState({});

  // Modals
  const {
    isOpen: isOrderOpen,
    onOpen: onOrderOpen,
    onClose: onOrderClose,
  } = useDisclosure();
  const {
    isOpen: isTxnOpen,
    onOpen: onTxnOpen,
    onClose: onTxnClose,
  } = useDisclosure();
  const {
    isOpen: isRefundOpen,
    onOpen: onRefundOpen,
    onClose: onRefundClose,
  } = useDisclosure();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);

  // Debounce orders search
  useEffect(() => {
    const t = setTimeout(() => {
      setOrdersDebSearch(ordersSearch);
      setOrdersPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [ordersSearch]);

  // Debounce txns search
  useEffect(() => {
    const t = setTimeout(() => {
      setTxnsDebSearch(txnsSearch);
      setTxnsPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [txnsSearch]);

  const {
    data: stats = {
      totalOrders: 0,
      paidOrders: 0,
      totalTxns: 0,
      failedTxns: 0,
    },
  } = useQuery({
    queryKey: ["admin-financial-stats"],
    queryFn: () =>
      Promise.all([
        adminApi.getPaymentOrders({ page: 1, "page-size": 1 }),
        adminApi.getPaymentOrders({ page: 1, "page-size": 1, Status: "Paid" }),
        adminApi.getPaymentTransactions({ page: 1, "page-size": 1 }),
        adminApi.getPaymentTransactions({
          page: 1,
          "page-size": 1,
          Status: "Failed",
        }),
      ]).then(([allOrders, paidOrders, allTxns, failedTxns]) => ({
        totalOrders: allOrders.data?.totalItems || 0,
        paidOrders: paidOrders.data?.totalItems || 0,
        totalTxns: allTxns.data?.totalItems || 0,
        failedTxns: failedTxns.data?.totalItems || 0,
      })),
    staleTime: 60 * 1000,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders", ordersPage, ordersDebSearch, ordersStatus],
    queryFn: async () => {
      const params = {
        page: ordersPage,
        "page-size": PAGE_SIZE,
        "sort-params": "OrderNo-asc",
      };
      if (ordersDebSearch) params["search-term"] = ordersDebSearch;
      if (ordersStatus !== "All") params.Status = ordersStatus;
      const res = await adminApi.getPaymentOrders(params);
      return res.data || {};
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
  const orders = ordersData?.items ?? [];
  const ordersTotal = ordersData?.totalPages ?? 1;

  const { data: txnsData, isLoading: txnsLoading } = useQuery({
    queryKey: ["admin-txns", txnsPage, txnsDebSearch, txnsStatus],
    queryFn: async () => {
      const params = {
        page: txnsPage,
        "page-size": PAGE_SIZE,
        "sort-params": "OrderNo-asc",
      };
      if (txnsDebSearch) params["search-term"] = txnsDebSearch;
      if (txnsStatus !== "All") params.Status = txnsStatus;
      const res = await adminApi.getPaymentTransactions(params);
      return res.data || {};
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
  const txns = txnsData?.items ?? [];
  const txnsTotal = txnsData?.totalPages ?? 1;

  const { data: refundsData, isLoading: refundsLoading } = useQuery({
    queryKey: [
      "admin-refunds",
      refundsPage,
      refundsStatus,
      refundsType,
      refundsTutorId,
    ],
    queryFn: async () => {
      const params = { page: refundsPage, "page-size": PAGE_SIZE };
      if (refundsStatus !== "All") params.Status = refundsStatus;
      if (refundsType !== "All") params.RefundType = refundsType;
      if (refundsTutorId.trim()) params.TutorId = refundsTutorId.trim();
      const res = await paymentApi.getStudentRefundDetails(params);
      return res.data || {};
    },
    enabled: activeTab === "refunds",
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
  const refunds = refundsData?.items ?? [];
  const refundsTotal = refundsData?.totalPages ?? 1;

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

  // Resolve student names
  useEffect(() => {
    const ids = [
      ...new Set(
        [
          ...orders.map((o) => o.studentId),
          ...txns.map((t) => t.studentId),
        ].filter(Boolean),
      ),
    ];
    const missing = ids.filter((id) => !studentMap[id]);
    if (!missing.length) return;
    Promise.all(
      missing.map((id) =>
        adminApi
          .getStudentById(id)
          .then((res) => {
            const u = res.data?.user;
            const name = u
              ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email
              : "Unknown";
            return { id, name };
          })
          .catch(() => ({ id, name: "Unknown" })),
      ),
    ).then((results) => {
      setStudentMap((prev) => {
        const next = { ...prev };
        results.forEach(({ id, name }) => {
          next[id] = name;
        });
        return next;
      });
    });
  }, [orders, txns]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    onOrderOpen();
  };

  const handleViewTxn = (txn) => {
    setSelectedTxn(txn);
    onTxnOpen();
  };

  const handleViewRefund = (refund) => {
    setSelectedRefund(refund);
    onRefundOpen();
  };

  const statCards = [
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ClipboardList,
      color: colors.primary.main,
      bg: colors.background.primaryLight,
    },
    {
      label: "Paid Orders",
      value: stats.paidOrders,
      icon: CheckCircle,
      color: colors.state.success,
      bg: `${colors.state.success}20`,
    },
    {
      label: "Total Transactions",
      value: stats.totalTxns,
      icon: SortHorizontal,
      color: "#8B5CF6",
      bg: "#8B5CF620",
    },
    {
      label: "Failed Transactions",
      value: stats.failedTxns,
      icon: CloseCircle,
      color: colors.state.error,
      bg: `${colors.state.error}20`,
    },
  ];

  // Derived data for selected items
  const orderMeta = selectedOrder ? parseMeta(selectedOrder.metaData) : {};
  const txnOrder = selectedTxn
    ? orders.find((o) => o.id === selectedTxn.orderId)
    : null;
  const txnOrderMeta = txnOrder ? parseMeta(txnOrder.metaData) : {};

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
          {t("adminDashboard.finance.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("adminDashboard.finance.subtitle")}
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
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
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
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
                  <div className="min-w-0">
                    <p
                      className="text-lg font-bold truncate"
                      style={{ color: colors.text.primary }}
                    >
                      {s.value.toLocaleString()}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: colors.text.secondary }}
                    >
                      {s.label}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
          color="primary"
          classNames={{ tabList: "gap-6", cursor: "w-full" }}
        >
          <Tab key="orders" title="Orders" />
          <Tab key="transactions" title="Transactions" />
          <Tab
            key="refunds"
            title={
              <div className="flex items-center gap-1.5">
                <Restart weight="BoldDuotone" className="w-4 h-4" />
                <span>Student Refunds</span>
              </div>
            }
          />
        </Tabs>
      </motion.div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search orders..."
              value={ordersSearch}
              onValueChange={setOrdersSearch}
              startContent={
                <MinimalisticMagnifier
                  weight="BoldDuotone"
                  className="w-4 h-4"
                  style={{ color: colors.text.tertiary }}
                />
              }
              classNames={inputClassNames}
              className="max-w-xs"
            />
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
                  Status: {ordersStatus}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Order status filter"
                selectedKeys={[ordersStatus]}
                selectionMode="single"
                onAction={(key) => {
                  setOrdersStatus(key);
                  setOrdersPage(1);
                }}
              >
                {ORDER_STATUSES.map((s) => (
                  <DropdownItem key={s}>{s}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>

          <Card shadow="none" className="border-none" style={tableCardStyle}>
            <CardBody className="p-0">
              <Table
                aria-label="Payment orders"
                classNames={tableClassNames}
                bottomContent={
                  ordersTotal > 1 && (
                    <div className="flex w-full justify-center py-4">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={ordersPage}
                        total={ordersTotal}
                        onChange={setOrdersPage}
                      />
                    </div>
                  )
                }
              >
                <TableHeader>
                  <TableColumn>Order #</TableColumn>
                  <TableColumn>Student</TableColumn>
                  <TableColumn>Course</TableColumn>
                  <TableColumn>Schedule</TableColumn>
                  <TableColumn>Amount</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Date</TableColumn>
                  <TableColumn> </TableColumn>
                </TableHeader>
                <TableBody
                  isLoading={ordersLoading}
                  loadingContent={<Spinner color="primary" />}
                  emptyContent={
                    !ordersLoading && (
                      <span style={{ color: colors.text.tertiary }}>
                        No orders found.
                      </span>
                    )
                  }
                >
                  {orders.map((order) => {
                    const meta = parseMeta(order.metaData);
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
                            className="text-sm"
                            style={{ color: colors.text.secondary }}
                          >
                            {order.studentId
                              ? studentMap[order.studentId] || "Loading..."
                              : "—"}
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
                            {formatSlots(meta.scheduleSlots) || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className="font-medium text-sm"
                            style={{ color: colors.text.primary }}
                          >
                            {formatAmount(order.totalAmount, order.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={orderStatusColor(order.status)}
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
                            onPress={() => handleViewOrder(order)}
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
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search transactions..."
              value={txnsSearch}
              onValueChange={setTxnsSearch}
              startContent={
                <MinimalisticMagnifier
                  weight="BoldDuotone"
                  className="w-4 h-4"
                  style={{ color: colors.text.tertiary }}
                />
              }
              classNames={inputClassNames}
              className="max-w-xs"
            />
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
                  Status: {txnsStatus}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Transaction status filter"
                selectedKeys={[txnsStatus]}
                selectionMode="single"
                onAction={(key) => {
                  setTxnsStatus(key);
                  setTxnsPage(1);
                }}
              >
                {TXN_STATUSES.map((s) => (
                  <DropdownItem key={s}>{s}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>

          <Card shadow="none" className="border-none" style={tableCardStyle}>
            <CardBody className="p-0">
              <Table
                aria-label="Payment transactions"
                classNames={tableClassNames}
                bottomContent={
                  txnsTotal > 1 && (
                    <div className="flex w-full justify-center py-4">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={txnsPage}
                        total={txnsTotal}
                        onChange={setTxnsPage}
                      />
                    </div>
                  )
                }
              >
                <TableHeader>
                  <TableColumn>Order #</TableColumn>
                  <TableColumn>Student</TableColumn>
                  <TableColumn>Amount</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Bank Tx ID</TableColumn>
                  <TableColumn>Date</TableColumn>
                  <TableColumn> </TableColumn>
                </TableHeader>
                <TableBody
                  isLoading={txnsLoading}
                  loadingContent={<Spinner color="primary" />}
                  emptyContent={
                    !txnsLoading && (
                      <span style={{ color: colors.text.tertiary }}>
                        No transactions found.
                      </span>
                    )
                  }
                >
                  {txns.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <span
                          className="font-mono text-sm font-semibold"
                          style={{ color: colors.primary.main }}
                        >
                          #{txn.orderNo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {txn.studentId
                            ? studentMap[txn.studentId] || "Loading..."
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-medium text-sm"
                          style={{ color: colors.text.primary }}
                        >
                          {formatAmount(txn.amount, txn.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={txnStatusColor(txn.status)}
                        >
                          {txn.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-mono text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          {txn.bankTransactionId
                            ? txn.bankTransactionId.length > 20
                              ? txn.bankTransactionId.slice(0, 20) + "…"
                              : txn.bankTransactionId
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.tertiary }}
                        >
                          {formatDate(txn.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleViewTxn(txn)}
                        >
                          <Eye
                            weight="BoldDuotone"
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
      )}

      {/* Student Refunds Tab */}
      {activeTab === "refunds" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <Input
              placeholder="Filter by Tutor ID..."
              value={refundsTutorId}
              onValueChange={(v) => {
                setRefundsTutorId(v);
                setRefundsPage(1);
              }}
              startContent={
                <MinimalisticMagnifier
                  weight="BoldDuotone"
                  className="w-4 h-4"
                  style={{ color: colors.text.tertiary }}
                />
              }
              classNames={inputClassNames}
              className="max-w-xs"
            />
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
                  Type:{" "}
                  {refundsType === "All"
                    ? "All"
                    : refundsType.replace(/([A-Z])/g, " $1").trim()}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Refund type filter"
                selectedKeys={[refundsType]}
                selectionMode="single"
                onAction={(key) => {
                  setRefundsType(key);
                  setRefundsPage(1);
                }}
              >
                {REFUND_TYPES.map((t) => (
                  <DropdownItem key={t}>
                    {t === "All"
                      ? "All Types"
                      : t.replace(/([A-Z])/g, " $1").trim()}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
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
                  Status: {refundsStatus}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Refund status filter"
                selectedKeys={[refundsStatus]}
                selectionMode="single"
                onAction={(key) => {
                  setRefundsStatus(key);
                  setRefundsPage(1);
                }}
              >
                {REFUND_STATUSES.map((s) => (
                  <DropdownItem key={s}>
                    {s === "All" ? "All Statuses" : s}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>

          <Card shadow="none" className="border-none" style={tableCardStyle}>
            <CardBody className="p-0">
              <Table
                aria-label="Student refunds"
                classNames={tableClassNames}
                bottomContent={
                  refundsTotal > 1 && (
                    <div className="flex w-full justify-center py-4">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={refundsPage}
                        total={refundsTotal}
                        onChange={setRefundsPage}
                      />
                    </div>
                  )
                }
              >
                <TableHeader>
                  <TableColumn>Student</TableColumn>
                  <TableColumn>Course</TableColumn>
                  <TableColumn>Amount</TableColumn>
                  <TableColumn>Refund Type</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Requested At</TableColumn>
                  <TableColumn> </TableColumn>
                </TableHeader>
                <TableBody
                  isLoading={refundsLoading}
                  loadingContent={<Spinner color="primary" />}
                  emptyContent={
                    !refundsLoading && (
                      <span style={{ color: colors.text.tertiary }}>
                        No refunds found.
                      </span>
                    )
                  }
                >
                  {refunds.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {r.studentName}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            {r.studentEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.primary }}
                        >
                          {r.courseName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-semibold text-sm"
                          style={{ color: colors.state.error }}
                        >
                          -{formatAmount(r.totalAmount, r.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          style={{
                            backgroundColor: `${REFUND_TYPE_COLORS[r.refundType] ?? colors.primary.main}20`,
                            color:
                              REFUND_TYPE_COLORS[r.refundType] ??
                              colors.primary.main,
                            fontWeight: 600,
                          }}
                        >
                          {r.refundType.replace(/([A-Z])/g, " $1").trim()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={refundStatusColor(r.status)}
                        >
                          {r.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.tertiary }}
                        >
                          {formatDate(r.requestedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleViewRefund(r)}
                        >
                          <Eye
                            weight="BoldDuotone"
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
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={isOrderOpen}
        onClose={onOrderClose}
        size="md"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            Order #{selectedOrder?.orderNo} — Details
          </ModalHeader>
          <ModalBody className="pb-6">
            {selectedOrder && (
              <div className="space-y-4">
                <DetailRow label="Status">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={orderStatusColor(selectedOrder.status)}
                  >
                    {selectedOrder.status}
                  </Chip>
                </DetailRow>

                <DetailRow label="Student">
                  <button
                    className="flex items-center gap-1 font-medium hover:underline"
                    style={{ color: colors.primary.main }}
                    onClick={() => {
                      onOrderClose();
                      navigate(`/admin/students/${selectedOrder.studentId}`);
                    }}
                  >
                    {studentMap[selectedOrder.studentId] ||
                      selectedOrder.studentId}
                    <SquareBottomUp
                      weight="BoldDuotone"
                      className="w-3.5 h-3.5"
                    />
                  </button>
                </DetailRow>

                {orderMeta.courseId && (
                  <DetailRow label="Course">
                    <button
                      className="flex items-center gap-1 font-medium hover:underline"
                      style={{ color: colors.primary.main }}
                      onClick={() => {
                        onOrderClose();
                        navigate(`/admin/courses/${orderMeta.courseId}`);
                      }}
                    >
                      {courseMap[orderMeta.courseId] || orderMeta.courseId}
                      <SquareBottomUp
                        weight="BoldDuotone"
                        className="w-3.5 h-3.5"
                      />
                    </button>
                  </DetailRow>
                )}

                {orderMeta.scheduleSlots?.length > 0 && (
                  <DetailRow label="Schedule">
                    <div className="space-y-0.5">
                      {orderMeta.scheduleSlots.map((s, i) => (
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
                    {formatAmount(
                      selectedOrder.totalAmount,
                      selectedOrder.currency,
                    )}
                  </span>
                </DetailRow>

                <DetailRow label="Description">
                  {selectedOrder.description || "—"}
                </DetailRow>

                <DetailRow label="Payment Reference">
                  {selectedOrder.paymentReference || "—"}
                </DetailRow>

                <DetailRow label="Created At">
                  {formatDate(selectedOrder.createdAt)}
                </DetailRow>
                <DetailRow label="Updated At">
                  {formatDate(selectedOrder.updatedAt)}
                </DetailRow>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={isTxnOpen}
        onClose={onTxnClose}
        size="md"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader style={{ color: colors.text.primary }}>
            Transaction — Order #{selectedTxn?.orderNo}
          </ModalHeader>
          <ModalBody className="pb-6">
            {selectedTxn && (
              <div className="space-y-4">
                <DetailRow label="Status">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={txnStatusColor(selectedTxn.status)}
                  >
                    {selectedTxn.status}
                  </Chip>
                </DetailRow>

                <DetailRow label="Student">
                  <button
                    className="flex items-center gap-1 font-medium hover:underline"
                    style={{ color: colors.primary.main }}
                    onClick={() => {
                      onTxnClose();
                      navigate(`/admin/students/${selectedTxn.studentId}`);
                    }}
                  >
                    {studentMap[selectedTxn.studentId] || selectedTxn.studentId}
                    <SquareBottomUp
                      weight="BoldDuotone"
                      className="w-3.5 h-3.5"
                    />
                  </button>
                </DetailRow>

                {txnOrderMeta.courseId && (
                  <DetailRow label="Course">
                    <button
                      className="flex items-center gap-1 font-medium hover:underline"
                      style={{ color: colors.primary.main }}
                      onClick={() => {
                        onTxnClose();
                        navigate(`/admin/courses/${txnOrderMeta.courseId}`);
                      }}
                    >
                      {courseMap[txnOrderMeta.courseId] ||
                        txnOrderMeta.courseId}
                      <SquareBottomUp
                        weight="BoldDuotone"
                        className="w-3.5 h-3.5"
                      />
                    </button>
                  </DetailRow>
                )}

                <DetailRow label="Amount">
                  <span className="font-semibold">
                    {formatAmount(selectedTxn.amount, selectedTxn.currency)}
                  </span>
                </DetailRow>

                <DetailRow label="Bank Transaction ID">
                  <span className="font-mono text-xs">
                    {selectedTxn.bankTransactionId || "—"}
                  </span>
                </DetailRow>

                <DetailRow label="Payment Method">
                  {selectedTxn.paymentMethod || "—"}
                </DetailRow>

                <DetailRow label="Created At">
                  {formatDate(selectedTxn.createdAt)}
                </DetailRow>
                <DetailRow label="Updated At">
                  {formatDate(selectedTxn.updatedAt)}
                </DetailRow>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Refund Detail Modal */}
      <Modal
        isOpen={isRefundOpen}
        onClose={onRefundClose}
        size="lg"
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
              style={{ color: colors.state.error }}
            />
            Refund Detail
          </ModalHeader>
          <ModalBody className="pb-6">
            {selectedRefund && (
              <div className="space-y-4">
                {/* Course + Student */}
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="text-base font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {selectedRefund.courseName}
                  </p>
                  <p
                    className="text-sm mt-0.5 font-medium"
                    style={{ color: colors.text.secondary }}
                  >
                    {selectedRefund.studentName}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.tertiary }}
                  >
                    {selectedRefund.studentEmail}
                  </p>
                </div>

                {/* Summary grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      Amount
                    </p>
                    <p
                      className="text-base font-semibold mt-0.5"
                      style={{ color: colors.state.error }}
                    >
                      -
                      {formatAmount(
                        selectedRefund.totalAmount,
                        selectedRefund.currency,
                      )}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      Status
                    </p>
                    <Chip
                      size="sm"
                      variant="flat"
                      className="mt-1"
                      color={refundStatusColor(selectedRefund.status)}
                    >
                      {selectedRefund.status}
                    </Chip>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      Refund Type
                    </p>
                    <Chip
                      size="sm"
                      variant="flat"
                      className="mt-1"
                      style={{
                        backgroundColor: `${REFUND_TYPE_COLORS[selectedRefund.refundType] ?? colors.primary.main}20`,
                        color:
                          REFUND_TYPE_COLORS[selectedRefund.refundType] ??
                          colors.primary.main,
                        fontWeight: 600,
                      }}
                    >
                      {selectedRefund.refundType
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                    </Chip>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      Price / Session
                    </p>
                    <p
                      className="text-sm font-medium mt-0.5"
                      style={{ color: colors.text.primary }}
                    >
                      {formatAmount(
                        selectedRefund.pricePerSession,
                        selectedRefund.currency,
                      )}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      Requested At
                    </p>
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: colors.text.primary }}
                    >
                      {formatDate(selectedRefund.requestedAt)}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      Paid At
                    </p>
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: colors.text.primary }}
                    >
                      {selectedRefund.paidAt
                        ? formatDate(selectedRefund.paidAt)
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Bank Info */}
                {selectedRefund.bankCode && (
                  <div
                    className="p-3 rounded-xl space-y-1"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: colors.text.tertiary }}
                    >
                      Student Bank Account
                    </p>
                    <DetailRow label="Bank Code">
                      {selectedRefund.bankCode}
                    </DetailRow>
                    <DetailRow label="Account No">
                      {selectedRefund.bankAccountNumber}
                    </DetailRow>
                    <DetailRow label="Account Name">
                      {selectedRefund.bankAccountName}
                    </DetailRow>
                  </div>
                )}

                {/* Failure reason */}
                {selectedRefund.note && (
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: `${colors.state.error}10`,
                      border: `1px solid ${colors.state.error}30`,
                    }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-1"
                      style={{ color: colors.state.error }}
                    >
                      Failure Reason
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {selectedRefund.note}
                    </p>
                  </div>
                )}

                {/* Refund Items (Lessons) */}
                {selectedRefund.refundItems?.length > 0 && (
                  <div>
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{ color: colors.text.primary }}
                    >
                      Refunded Lessons ({selectedRefund.refundItems.length})
                    </p>
                    <div className="space-y-2">
                      {selectedRefund.refundItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl flex items-start justify-between gap-2"
                          style={{ backgroundColor: colors.background.gray }}
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium"
                              style={{ color: colors.text.primary }}
                            >
                              {formatDate(item.lessonStartTime)} —{" "}
                              {formatDate(item.lessonEndTime)}
                            </p>
                            {item.note && (
                              <p
                                className="text-xs mt-0.5 line-clamp-2"
                                style={{ color: colors.text.secondary }}
                              >
                                {item.note}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: colors.state.error }}
                            >
                              -
                              {formatAmount(
                                item.amount,
                                selectedRefund.currency,
                              )}
                            </span>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={refundStatusColor(item.status)}
                            >
                              {item.status}
                            </Chip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default FinancialManagement;
