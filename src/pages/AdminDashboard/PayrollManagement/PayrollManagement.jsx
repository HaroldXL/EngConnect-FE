import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  CheckCircle,
  ClipboardList,
  CloseCircle,
  Dollar,
  Eye,
  GraphUp,
  Hourglass,
  Lightning,
  PresentationGraph,
  SquareAltArrowRight,
  SquareBottomUp,
  Wallet,
} from "@solar-icons/react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  Select,
  SelectItem,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Skeleton,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";

import { paymentApi, tutorApi } from "../../../api";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const formatVND = (amount) => {
  if (amount == null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const PayrollManagement = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { selectClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const [activeTab, setActiveTab] = useState("periods");

  // Tutors map (tutorId -> { name, avatar })
  const [tutorsMap, setTutorsMap] = useState({});

  // Periods
  const [periods, setPeriods] = useState([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodsPage, setPeriodsPage] = useState(1);
  const [periodsTotalPages, setPeriodsTotalPages] = useState(1);
  const [periodStatusFilter, setPeriodStatusFilter] = useState("");

  // Payouts
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);
  const [payoutTypeFilter, setPayoutTypeFilter] = useState("");
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("");
  const [payoutPeriodFilter, setPayoutPeriodFilter] = useState("");

  // Earnings overview
  const [tutorsSummary, setTutorsSummary] = useState([]);
  const [tutorsSummaryLoading, setTutorsSummaryLoading] = useState(false);

  // Payout detail modal
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutItems, setPayoutItems] = useState([]);
  const [payoutItemsLoading, setPayoutItemsLoading] = useState(false);
  const [payoutDetailOpen, setPayoutDetailOpen] = useState(false);

  // ── Load tutors map (for name + avatar lookup) ──────
  useEffect(() => {
    tutorApi
      .getAllTutors({ "page-size": 200 })
      .then((res) => {
        const map = {};
        (res?.data?.items || []).forEach((tutor) => {
          map[tutor.id] = {
            name: `${tutor.user?.firstName || ""} ${tutor.user?.lastName || ""}`.trim(),
            avatar: tutor.avatar,
            email: tutor.user?.email,
          };
        });
        setTutorsMap(map);
      })
      .catch(() => {});
  }, []);

  // ── Periods ─────────────────────────────────────────
  const fetchPeriods = useCallback(async () => {
    setPeriodsLoading(true);
    try {
      const params = { page: periodsPage, "page-size": 10 };
      if (periodStatusFilter) params.Status = periodStatusFilter;
      const res = await paymentApi.getPayrollPeriods(params);
      setPeriods(res?.data?.items || []);
      setPeriodsTotalPages(res?.data?.totalPages || 1);
    } catch {
      setPeriods([]);
    } finally {
      setPeriodsLoading(false);
    }
  }, [periodsPage, periodStatusFilter]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  // Periods (full list for filter dropdown)
  const [allPeriods, setAllPeriods] = useState([]);
  useEffect(() => {
    paymentApi
      .getPayrollPeriods({ "page-size": 100 })
      .then((res) => setAllPeriods(res?.data?.items || []))
      .catch(() => {});
  }, []);

  // ── Payouts ─────────────────────────────────────────
  const fetchPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const params = { page: payoutsPage, "page-size": 10 };
      if (payoutTypeFilter) params.PayoutType = payoutTypeFilter;
      if (payoutStatusFilter) params.Status = payoutStatusFilter;
      if (payoutPeriodFilter) params.PayrollPeriodId = payoutPeriodFilter;
      const res = await paymentApi.getPayouts(params);
      setPayouts(res?.data?.items || []);
      setPayoutsTotalPages(res?.data?.totalPages || 1);
    } catch {
      setPayouts([]);
    } finally {
      setPayoutsLoading(false);
    }
  }, [payoutsPage, payoutTypeFilter, payoutStatusFilter, payoutPeriodFilter]);

  useEffect(() => {
    if (activeTab === "payouts") fetchPayouts();
  }, [activeTab, fetchPayouts]);

  // ── Earnings overview (all tutors) ──────────────────
  const fetchTutorsSummary = useCallback(async () => {
    setTutorsSummaryLoading(true);
    try {
      const res = await paymentApi.getTotalEarning({});
      setTutorsSummary(res?.data?.allTutors?.tutors || []);
    } catch {
      setTutorsSummary([]);
    } finally {
      setTutorsSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "overview") fetchTutorsSummary();
  }, [activeTab, fetchTutorsSummary]);

  // ── Open payout detail modal ────────────────────────
  const openPayoutDetail = async (payout) => {
    setSelectedPayout(payout);
    setPayoutDetailOpen(true);
    setPayoutItemsLoading(true);
    setPayoutItems([]);
    try {
      const res = await paymentApi.getPayoutItems({
        TutorPayoutId: payout.id,
        "page-size": 100,
      });
      setPayoutItems(res?.data?.items || []);
    } catch {
      setPayoutItems([]);
    } finally {
      setPayoutItemsLoading(false);
    }
  };

  // Click a period → open payouts tab filtered by that period
  const openPeriodPayouts = (period) => {
    setPayoutPeriodFilter(period.id);
    setPayoutTypeFilter("Payroll");
    setPayoutStatusFilter("");
    setPayoutsPage(1);
    setActiveTab("payouts");
  };

  // ── Helpers ─────────────────────────────────────────
  const periodStatusColor = (s) => {
    switch (s) {
      case "Paid":
        return colors.state.success;
      case "Processing":
        return colors.primary.main;
      case "Closed":
        return colors.text.tertiary;
      default:
        return colors.text.secondary;
    }
  };

  const payoutStatusColor = (s) => {
    switch (s) {
      case "Paid":
        return colors.state.success;
      case "Processing":
        return colors.primary.main;
      case "Pending":
        return colors.state.warning;
      case "Failed":
      case "Cancelled":
        return colors.state.error;
      default:
        return colors.text.tertiary;
    }
  };

  const payoutStatusIcon = (s) => {
    switch (s) {
      case "Paid":
        return CheckCircle;
      case "Processing":
        return Lightning;
      case "Pending":
        return Hourglass;
      case "Failed":
      case "Cancelled":
        return CloseCircle;
      default:
        return Hourglass;
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString(dateLocale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ── Top stats (totals from tutorsSummary) ───────────
  const topStats = useMemo(() => {
    const totals = tutorsSummary.reduce(
      (acc, x) => {
        acc.gross += x.totalGrossAmount || 0;
        acc.fee += x.totalPlatformFee || 0;
        acc.net += x.totalNetAmount || 0;
        acc.balance += x.availableBalance || 0;
        return acc;
      },
      { gross: 0, fee: 0, net: 0, balance: 0 },
    );
    return totals;
  }, [tutorsSummary]);

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
          {t("adminDashboard.payroll.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("adminDashboard.payroll.subtitle")}
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        color="primary"
        classNames={{ tabList: "gap-2", tab: "px-4" }}
      >
        <Tab
          key="periods"
          title={
            <div className="flex items-center gap-2">
              <Calendar weight="BoldDuotone" className="w-5 h-5" />
              <span>{t("adminDashboard.payroll.tabs.periods")}</span>
            </div>
          }
        />
        <Tab
          key="payouts"
          title={
            <div className="flex items-center gap-2">
              <ClipboardList weight="BoldDuotone" className="w-5 h-5" />
              <span>{t("adminDashboard.payroll.tabs.payouts")}</span>
            </div>
          }
        />
        <Tab
          key="overview"
          title={
            <div className="flex items-center gap-2">
              <GraphUp weight="BoldDuotone" className="w-5 h-5" />
              <span>{t("adminDashboard.payroll.tabs.overview")}</span>
            </div>
          }
        />
      </Tabs>

      {/* ── Tab: Payroll Periods ──────────────────── */}
      {activeTab === "periods" && (
        <Card shadow="none" className="border-none" style={tableCardStyle}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("adminDashboard.payroll.periods.title")}
              </h2>
              <Select
                size="sm"
                className="w-44"
                placeholder={t("adminDashboard.payroll.allStatuses")}
                selectedKeys={periodStatusFilter ? [periodStatusFilter] : []}
                classNames={selectClassNames}
                onSelectionChange={(keys) => {
                  const v = [...keys][0] || "";
                  setPeriodStatusFilter(v);
                  setPeriodsPage(1);
                }}
              >
                {["Closed", "Processing", "Paid"].map((s) => (
                  <SelectItem key={s}>
                    {t(`adminDashboard.payroll.periodStatuses.${s}`)}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Table
              aria-label="Payroll periods"
              classNames={tableClassNames}
              removeWrapper
            >
              <TableHeader>
                <TableColumn>
                  {t("adminDashboard.payroll.periods.code")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.periods.dateRange")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.periods.cutoff")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.periods.note")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.periods.status")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.periods.actions")}
                </TableColumn>
              </TableHeader>
              <TableBody
                isLoading={periodsLoading}
                loadingContent={<Spinner />}
                emptyContent={
                  <p
                    className="py-8 text-center"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("adminDashboard.payroll.periods.empty")}
                  </p>
                }
              >
                {periods.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span
                        className="font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {p.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: colors.text.secondary }}>
                        {formatDate(p.startDate)} — {formatDate(p.endDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: colors.text.secondary }}>
                        {formatDate(p.cutoffAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-sm truncate max-w-xs"
                        style={{ color: colors.text.tertiary }}
                      >
                        {p.note || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        style={{
                          backgroundColor: `${periodStatusColor(p.status)}15`,
                          color: periodStatusColor(p.status),
                        }}
                      >
                        {t(`adminDashboard.payroll.periodStatuses.${p.status}`)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={
                          <SquareBottomUp
                            weight="BoldDuotone"
                            className="w-4 h-4"
                          />
                        }
                        onPress={() => openPeriodPayouts(p)}
                        style={{
                          backgroundColor: `${colors.primary.main}15`,
                          color: colors.primary.main,
                        }}
                      >
                        {t("adminDashboard.payroll.periods.viewPayouts")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {periodsTotalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  total={periodsTotalPages}
                  page={periodsPage}
                  onChange={setPeriodsPage}
                  showControls
                  color="primary"
                />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── Tab: All Payouts ──────────────────────── */}
      {activeTab === "payouts" && (
        <Card shadow="none" className="border-none" style={tableCardStyle}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("adminDashboard.payroll.payouts.title")}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  size="sm"
                  className="w-44"
                  placeholder={t("adminDashboard.payroll.allPeriods")}
                  selectedKeys={payoutPeriodFilter ? [payoutPeriodFilter] : []}
                  classNames={selectClassNames}
                  onSelectionChange={(keys) => {
                    const v = [...keys][0] || "";
                    setPayoutPeriodFilter(v);
                    setPayoutsPage(1);
                  }}
                >
                  {allPeriods.map((p) => (
                    <SelectItem key={p.id}>{p.code}</SelectItem>
                  ))}
                </Select>
                <Select
                  size="sm"
                  className="w-36"
                  placeholder={t("adminDashboard.payroll.allTypes")}
                  selectedKeys={payoutTypeFilter ? [payoutTypeFilter] : []}
                  classNames={selectClassNames}
                  onSelectionChange={(keys) => {
                    const v = [...keys][0] || "";
                    setPayoutTypeFilter(v);
                    setPayoutsPage(1);
                  }}
                >
                  <SelectItem key="Payroll">
                    {t("adminDashboard.payroll.payoutTypes.Payroll")}
                  </SelectItem>
                  <SelectItem key="Manual">
                    {t("adminDashboard.payroll.payoutTypes.Manual")}
                  </SelectItem>
                </Select>
                <Select
                  size="sm"
                  className="w-40"
                  placeholder={t("adminDashboard.payroll.allStatuses")}
                  selectedKeys={payoutStatusFilter ? [payoutStatusFilter] : []}
                  classNames={selectClassNames}
                  onSelectionChange={(keys) => {
                    const v = [...keys][0] || "";
                    setPayoutStatusFilter(v);
                    setPayoutsPage(1);
                  }}
                >
                  {["Pending", "Processing", "Paid", "Failed", "Cancelled"].map(
                    (s) => (
                      <SelectItem key={s}>
                        {t(`adminDashboard.payroll.payoutStatuses.${s}`)}
                      </SelectItem>
                    ),
                  )}
                </Select>
              </div>
            </div>

            {/* Active filter chips */}
            {(payoutPeriodFilter || payoutTypeFilter || payoutStatusFilter) && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {payoutPeriodFilter && (
                  <Chip
                    size="sm"
                    variant="flat"
                    onClose={() => {
                      setPayoutPeriodFilter("");
                      setPayoutsPage(1);
                    }}
                    style={{
                      backgroundColor: `${colors.primary.main}15`,
                      color: colors.primary.main,
                    }}
                  >
                    {allPeriods.find((p) => p.id === payoutPeriodFilter)
                      ?.code || payoutPeriodFilter.slice(0, 8)}
                  </Chip>
                )}
                {payoutTypeFilter && (
                  <Chip
                    size="sm"
                    variant="flat"
                    onClose={() => setPayoutTypeFilter("")}
                  >
                    {t(
                      `adminDashboard.payroll.payoutTypes.${payoutTypeFilter}`,
                    )}
                  </Chip>
                )}
                {payoutStatusFilter && (
                  <Chip
                    size="sm"
                    variant="flat"
                    onClose={() => setPayoutStatusFilter("")}
                  >
                    {t(
                      `adminDashboard.payroll.payoutStatuses.${payoutStatusFilter}`,
                    )}
                  </Chip>
                )}
              </div>
            )}

            <Table
              aria-label="Payouts"
              classNames={tableClassNames}
              removeWrapper
            >
              <TableHeader>
                <TableColumn>
                  {t("adminDashboard.payroll.payouts.tutor")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.payouts.type")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.payouts.amount")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.payouts.bank")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.payouts.status")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.payouts.requestedAt")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.payouts.paidAt")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.payroll.payouts.actions")}
                </TableColumn>
              </TableHeader>
              <TableBody
                isLoading={payoutsLoading}
                loadingContent={<Spinner />}
                emptyContent={
                  <p
                    className="py-8 text-center"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("adminDashboard.payroll.payouts.empty")}
                  </p>
                }
              >
                {payouts.map((p) => {
                  const StatusIcon = payoutStatusIcon(p.status);
                  const tutor = tutorsMap[p.tutorId];
                  const isPendingManual =
                    p.payoutType === "Manual" && p.status === "Pending";
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div
                          className={`flex items-center gap-2 ${
                            tutor ? "cursor-pointer hover:opacity-80" : ""
                          }`}
                          onClick={() =>
                            tutor && navigate(`/admin/tutors/${p.tutorId}`)
                          }
                        >
                          <Avatar
                            src={withCDN(tutor?.avatar)}
                            name={tutor?.name}
                            size="sm"
                            className="w-7 h-7 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: colors.text.primary }}
                            >
                              {tutor?.name || p.tutorId.slice(0, 8)}
                            </p>
                            {tutor?.email && (
                              <p
                                className="text-[11px] truncate"
                                style={{ color: colors.text.tertiary }}
                              >
                                {tutor.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          style={{
                            backgroundColor: isPendingManual
                              ? `${colors.state.warning}15`
                              : p.payoutType === "Manual"
                                ? `${colors.state.warning}10`
                                : `${colors.primary.main}15`,
                            color:
                              p.payoutType === "Manual"
                                ? colors.state.warning
                                : colors.primary.main,
                            fontWeight: isPendingManual ? 600 : 400,
                          }}
                        >
                          {t(
                            `adminDashboard.payroll.payoutTypes.${p.payoutType}`,
                          )}
                          {isPendingManual && " ★"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-semibold"
                          style={{ color: colors.text.primary }}
                        >
                          {formatVND(p.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p style={{ color: colors.text.primary }}>
                            {p.bankCode}
                          </p>
                          <p style={{ color: colors.text.tertiary }}>
                            {p.bankAccountNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          startContent={
                            <StatusIcon
                              weight="BoldDuotone"
                              className="w-3.5 h-3.5"
                            />
                          }
                          style={{
                            backgroundColor: `${payoutStatusColor(p.status)}15`,
                            color: payoutStatusColor(p.status),
                          }}
                        >
                          {t(
                            `adminDashboard.payroll.payoutStatuses.${p.status}`,
                          )}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span style={{ color: colors.text.secondary }}>
                          {formatDate(p.requestedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span style={{ color: colors.text.secondary }}>
                          {formatDate(p.paidAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={
                            <Eye weight="BoldDuotone" className="w-4 h-4" />
                          }
                          onPress={() => openPayoutDetail(p)}
                          style={{
                            backgroundColor: `${colors.primary.main}15`,
                            color: colors.primary.main,
                          }}
                        >
                          {t("adminDashboard.payroll.payouts.viewItems")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {payoutsTotalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  total={payoutsTotalPages}
                  page={payoutsPage}
                  onChange={setPayoutsPage}
                  showControls
                  color="primary"
                />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── Tab: Earnings Overview ────────────────── */}
      {activeTab === "overview" && (
        <>
          {/* Top Totals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Wallet,
                label: t("adminDashboard.payroll.overview.totalBalance"),
                value: formatVND(topStats.balance),
                color: colors.primary.main,
                bg: colors.background.primaryLight,
              },
              {
                icon: Dollar,
                label: t("adminDashboard.payroll.overview.totalNet"),
                value: formatVND(topStats.net),
                color: colors.state.success,
                bg: `${colors.state.success}20`,
              },
              {
                icon: GraphUp,
                label: t("adminDashboard.payroll.overview.totalGross"),
                value: formatVND(topStats.gross),
                color: colors.state.info,
                bg: `${colors.state.info}20`,
              },
              {
                icon: ClipboardList,
                label: t("adminDashboard.payroll.overview.totalFee"),
                value: formatVND(topStats.fee),
                color: colors.state.warning,
                bg: `${colors.state.warning}20`,
              },
            ].map((stat, i) => (
              <Card
                key={i}
                shadow="none"
                className="border-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: stat.bg }}
                    >
                      <stat.icon
                        weight="BoldDuotone"
                        className="w-6 h-6"
                        style={{ color: stat.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {tutorsSummaryLoading ? (
                        <Skeleton className="h-7 w-24 rounded-md" />
                      ) : (
                        <p
                          className="text-lg font-bold truncate"
                          style={{ color: colors.text.primary }}
                        >
                          {stat.value}
                        </p>
                      )}
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
            ))}
          </div>

          {/* Per-tutor breakdown */}
          <Card shadow="none" className="border-none" style={tableCardStyle}>
            <CardBody className="p-4">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: colors.text.primary }}
              >
                {t("adminDashboard.payroll.overview.perTutorTitle")}
              </h2>

              <Table
                aria-label="Tutor earnings"
                classNames={tableClassNames}
                removeWrapper
              >
                <TableHeader>
                  <TableColumn>
                    {t("adminDashboard.payroll.overview.tutor")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.payroll.overview.balance")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.payroll.overview.net")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.payroll.overview.gross")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.payroll.overview.fee")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.payroll.overview.earningCount")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.payroll.overview.actions")}
                  </TableColumn>
                </TableHeader>
                <TableBody
                  isLoading={tutorsSummaryLoading}
                  loadingContent={<Spinner />}
                  emptyContent={
                    <p
                      className="py-8 text-center"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.payroll.overview.empty")}
                    </p>
                  }
                >
                  {tutorsSummary.map((s) => {
                    const tutor = tutorsMap[s.tutorId];
                    return (
                      <TableRow key={s.tutorId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={withCDN(tutor?.avatar)}
                              name={tutor?.name}
                              size="sm"
                              className="w-7 h-7"
                            />
                            <div className="min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: colors.text.primary }}
                              >
                                {tutor?.name || s.tutorId.slice(0, 8)}
                              </p>
                              {tutor?.email && (
                                <p
                                  className="text-[11px] truncate"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  {tutor.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className="font-semibold"
                            style={{
                              color:
                                s.availableBalance > 0
                                  ? colors.primary.main
                                  : colors.text.tertiary,
                            }}
                          >
                            {formatVND(s.availableBalance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className="font-medium"
                            style={{ color: colors.state.success }}
                          >
                            {formatVND(s.totalNetAmount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{ color: colors.text.secondary }}>
                            {formatVND(s.totalGrossAmount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{ color: colors.text.tertiary }}>
                            {formatVND(s.totalPlatformFee)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            style={{
                              backgroundColor: colors.background.gray,
                              color: colors.text.secondary,
                            }}
                          >
                            {s.earningCount}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {tutor && (
                            <Button
                              size="sm"
                              variant="flat"
                              startContent={
                                <PresentationGraph
                                  weight="BoldDuotone"
                                  className="w-4 h-4"
                                />
                              }
                              onPress={() =>
                                navigate(`/admin/tutors/${s.tutorId}`)
                              }
                              style={{
                                backgroundColor: `${colors.primary.main}15`,
                                color: colors.primary.main,
                              }}
                            >
                              {t("adminDashboard.payroll.overview.viewProfile")}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}

      {/* Payout Items Modal */}
      <Modal
        isOpen={payoutDetailOpen}
        onOpenChange={setPayoutDetailOpen}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalHeader
            className="flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <ClipboardList
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.primary.main }}
            />
            {t("adminDashboard.payroll.payouts.detailTitle")}
          </ModalHeader>
          <ModalBody className="pb-6">
            {selectedPayout && (
              <div className="space-y-4">
                {/* Tutor */}
                {tutorsMap[selectedPayout.tutorId] && (
                  <div
                    className="p-3 rounded-xl flex items-center gap-3"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <Avatar
                      src={withCDN(tutorsMap[selectedPayout.tutorId].avatar)}
                      name={tutorsMap[selectedPayout.tutorId].name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold truncate"
                        style={{ color: colors.text.primary }}
                      >
                        {tutorsMap[selectedPayout.tutorId].name}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: colors.text.tertiary }}
                      >
                        {tutorsMap[selectedPayout.tutorId].email}
                      </p>
                    </div>
                  </div>
                )}

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
                      {t("adminDashboard.payroll.payouts.amount")}
                    </p>
                    <p
                      className="text-base font-semibold mt-0.5"
                      style={{ color: colors.text.primary }}
                    >
                      {formatVND(selectedPayout.totalAmount)}
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
                      {t("adminDashboard.payroll.payouts.status")}
                    </p>
                    <Chip
                      size="sm"
                      variant="flat"
                      className="mt-1"
                      style={{
                        backgroundColor: `${payoutStatusColor(selectedPayout.status)}15`,
                        color: payoutStatusColor(selectedPayout.status),
                      }}
                    >
                      {t(
                        `adminDashboard.payroll.payoutStatuses.${selectedPayout.status}`,
                      )}
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
                      {t("adminDashboard.payroll.payouts.bank")}
                    </p>
                    <p
                      className="text-sm font-medium mt-0.5"
                      style={{ color: colors.text.primary }}
                    >
                      {selectedPayout.bankCode} •{" "}
                      {selectedPayout.bankAccountNumber}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: colors.text.tertiary }}
                    >
                      {selectedPayout.bankAccountName}
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
                      {t("adminDashboard.payroll.payouts.type")}
                    </p>
                    <p
                      className="text-sm font-medium mt-0.5"
                      style={{ color: colors.text.primary }}
                    >
                      {t(
                        `adminDashboard.payroll.payoutTypes.${selectedPayout.payoutType}`,
                      )}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: colors.text.tertiary }}
                    >
                      {formatDateTime(selectedPayout.requestedAt)} →{" "}
                      {formatDateTime(selectedPayout.paidAt)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("adminDashboard.payroll.payouts.items")} (
                    {payoutItems.length})
                  </p>
                  {payoutItemsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : payoutItems.length === 0 ? (
                    <p
                      className="text-sm text-center py-4"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.payroll.payouts.noItems")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {payoutItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl flex items-center justify-between"
                          style={{ backgroundColor: colors.background.gray }}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium"
                              style={{ color: colors.text.primary }}
                            >
                              {formatVND(item.amount)}
                            </p>
                            {item.note && (
                              <p
                                className="text-xs mt-0.5 truncate"
                                style={{ color: colors.text.secondary }}
                              >
                                {item.note}
                              </p>
                            )}
                          </div>
                          <Chip
                            size="sm"
                            variant="flat"
                            style={{
                              backgroundColor: `${payoutStatusColor(item.status)}15`,
                              color: payoutStatusColor(item.status),
                            }}
                          >
                            {t(
                              `adminDashboard.payroll.payoutStatuses.${item.status}`,
                            )}
                          </Chip>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PayrollManagement;
