import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AltArrowRight,
  ChartSquare,
  MinimalisticMagnifier,
  Star,
} from "@solar-icons/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Input,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Spinner,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";
import { studentApi } from "../../../api";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const LessonReports = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const colors = useThemeColors();
  const { inputClassNames } = useInputStyles();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const [searchParams, setSearchParams] = useSearchParams();
  const reportSort = searchParams.get("sort") || "newest";
  const setReportSort = (s) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (s && s !== "newest") next.set("sort", s);
        else next.delete("sort");
        return next;
      },
      { replace: true },
    );
  };

  const [reportSearch, setReportSearch] = useState("");
  const [debouncedReportSearch, setDebouncedReportSearch] = useState("");
  const [reportPage, setReportPage] = useState(1);
  const reportPageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedReportSearch(reportSearch);
      setReportPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [reportSearch]);

  const reportSortParam = (() => {
    switch (reportSort) {
      case "oldest":
        return "StartTime-asc";
      case "lowCoverage":
        return "coveragePercent:asc";
      case "lowRating":
        return "rating:asc";
      default:
        return "StartTime-desc";
    }
  })();

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: [
      "admin-lesson-reports",
      reportPage,
      debouncedReportSearch,
      reportSortParam,
    ],
    queryFn: async () => {
      const params = {
        page: reportPage,
        "page-size": reportPageSize,
        "sort-params": reportSortParam,
      };
      if (debouncedReportSearch) params["search-term"] = debouncedReportSearch;
      const res = await studentApi.getCompletedSettledLessons(params);
      return res?.data || {};
    },
    staleTime: 30 * 1000,
  });
  const reportItems = reportsData?.items ?? [];
  const reportTotalPages = reportsData?.totalPages ?? 1;
  const reportTotalItems = reportsData?.totalItems ?? 0;

  // ── helpers ──────────────────────────────────────────────
  const getCoverageColor = (cov) => {
    if (cov == null || cov === 0) return colors.text.tertiary;
    if (cov >= 80) return colors.state.success;
    if (cov >= 50) return colors.state.warning;
    return colors.state.error;
  };
  const getRatingColor = (r) => {
    if (r == null) return colors.text.tertiary;
    if (r >= 4) return colors.state.success;
    if (r >= 3) return colors.state.warning;
    return colors.state.error;
  };
  const getHealthSignal = (item) => {
    const cov = item.coveragePercent ?? 0;
    const r = item.rating;
    const hasCov = cov > 0;
    const hasRating = r != null;
    if (!hasCov && !hasRating)
      return { key: "pending", color: colors.text.tertiary };
    const lowCov = hasCov && cov < 50;
    const lowRating = hasRating && r < 3;
    const medCov = hasCov && cov < 80;
    const medRating = hasRating && r < 4;
    if (lowCov || lowRating) return { key: "issue", color: colors.state.error };
    if (medCov || medRating)
      return { key: "review", color: colors.state.warning };
    return { key: "healthy", color: colors.state.success };
  };
  const getLessonStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return colors.state.warning;
      case "Settled":
        return colors.state.success;
      default:
        return colors.text.tertiary;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const formatDuration = (start, end) => {
    if (!start || !end) return "";
    const mins = Math.round((new Date(end) - new Date(start)) / 60000);
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  };
  const lessonLabel = (lesson) =>
    `${lesson.studentFirstName || ""} ${lesson.studentLastName || ""}`.trim();
  const tutorLabel = (lesson) =>
    `${lesson.tutorFirstName || ""} ${lesson.tutorLastName || ""}`.trim();

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <h1
          className="text-2xl lg:text-3xl font-bold mb-1"
          style={{ color: colors.text.primary }}
        >
          {t("adminDashboard.lessonReports.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("adminDashboard.lessonReports.subtitle")}
        </p>
      </motion.div>

      {/* ── Search + Sort + Total ── */}
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
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder={t(
                    "adminDashboard.schedule.reports.searchPlaceholder",
                  )}
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  startContent={
                    <MinimalisticMagnifier
                      weight="BoldDuotone"
                      className="w-4 h-4"
                      style={{ color: colors.text.secondary }}
                    />
                  }
                  classNames={inputClassNames}
                />
              </div>

              <Dropdown>
                <DropdownTrigger>
                  <Button variant="flat" className="flex-shrink-0">
                    {t("adminDashboard.schedule.reports.sortBy")}:{" "}
                    {t(`adminDashboard.schedule.reports.sort.${reportSort}`)}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  selectedKeys={[reportSort]}
                  selectionMode="single"
                  onAction={(k) => {
                    setReportSort(k);
                    setReportPage(1);
                  }}
                >
                  <DropdownItem key="newest">
                    {t("adminDashboard.schedule.reports.sort.newest")}
                  </DropdownItem>
                  <DropdownItem key="oldest">
                    {t("adminDashboard.schedule.reports.sort.oldest")}
                  </DropdownItem>
                  <DropdownItem key="lowCoverage">
                    {t("adminDashboard.schedule.reports.sort.lowCoverage")}
                  </DropdownItem>
                  <DropdownItem key="lowRating">
                    {t("adminDashboard.schedule.reports.sort.lowRating")}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Chip
                size="md"
                variant="flat"
                startContent={
                  <ChartSquare weight="BoldDuotone" className="w-3.5 h-3.5" />
                }
                style={{
                  backgroundColor: colors.background.primaryLight,
                  color: colors.primary.main,
                }}
                className="px-3 h-9 flex-shrink-0"
              >
                {reportTotalItems.toLocaleString()}{" "}
                {t("adminDashboard.schedule.reports.stats.totalReports")}
              </Chip>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* ── Reports list ── */}
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
            {reportsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : reportItems.length === 0 ? (
              <p
                className="text-sm text-center py-8"
                style={{ color: colors.text.tertiary }}
              >
                {t("adminDashboard.schedule.reports.noResults")}
              </p>
            ) : (
              <div className="space-y-2">
                {reportItems.map((item) => {
                  const health = getHealthSignal(item);
                  const cov = item.coveragePercent ?? 0;
                  const hasCov = cov > 0;
                  const covColor = getCoverageColor(cov);
                  const ratingColor = getRatingColor(item.rating);
                  const statusColor = getLessonStatusColor(item.status);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: colors.background.gray }}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(`/admin/lessons/${item.id}/report`)
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        navigate(`/admin/lessons/${item.id}/report`)
                      }
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: health.color }}
                        title={t(
                          `adminDashboard.schedule.reports.health.${health.key}`,
                        )}
                      />

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="flex flex-col items-center gap-0.5">
                          <Avatar
                            src={withCDN(item.tutorAvatar)}
                            size="sm"
                            className="w-8 h-8"
                          />
                          <span
                            className="text-[9px] font-semibold leading-none"
                            style={{ color: colors.primary.main }}
                          >
                            Tutor
                          </span>
                        </div>
                        <AltArrowRight
                          size={10}
                          weight="BoldDuotone"
                          style={{
                            color: colors.text.tertiary,
                            flexShrink: 0,
                            marginBottom: 8,
                          }}
                        />
                        <div className="flex flex-col items-center gap-0.5">
                          <Avatar
                            src={withCDN(item.studentAvatar)}
                            size="sm"
                            className="w-8 h-8"
                          />
                          <span
                            className="text-[9px] font-semibold leading-none"
                            style={{ color: colors.state.success }}
                          >
                            Student
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0 truncate">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: colors.text.primary }}
                          >
                            {tutorLabel(item)}
                          </span>
                          <span
                            className="text-[10px] flex-shrink-0"
                            style={{ color: colors.text.tertiary }}
                          >
                            →
                          </span>
                          <span
                            className="text-sm font-semibold truncate"
                            style={{ color: colors.text.primary }}
                          >
                            {lessonLabel(item)}
                          </span>
                        </div>
                        <p
                          className="text-xs truncate"
                          style={{ color: colors.text.secondary }}
                        >
                          {item.courseTitle}
                          {item.sessionTitle ? ` · ${item.sessionTitle}` : ""}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: colors.text.tertiary }}
                        >
                          {formatDateTime(item.startTime)} ·{" "}
                          {formatDuration(item.startTime, item.endTime)}
                        </p>
                      </div>

                      <div className="hidden md:flex flex-col items-center justify-center w-20 flex-shrink-0">
                        <p
                          className="text-[10px] uppercase tracking-wide font-semibold"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("adminDashboard.schedule.reports.coverage")}
                        </p>
                        {hasCov ? (
                          <p
                            className="text-base font-bold"
                            style={{ color: covColor }}
                          >
                            {cov}%
                          </p>
                        ) : (
                          <p
                            className="text-xs italic"
                            style={{ color: colors.text.tertiary }}
                          >
                            —
                          </p>
                        )}
                      </div>

                      <div className="hidden md:flex flex-col items-center justify-center w-28 flex-shrink-0">
                        <p
                          className="text-[10px] uppercase tracking-wide font-semibold"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("adminDashboard.schedule.reports.rating")}
                        </p>
                        {item.rating != null ? (
                          <div className="flex items-center gap-1">
                            <Star
                              weight="BoldDuotone"
                              size={15}
                              style={{ color: "#f59e0b", flexShrink: 0 }}
                            />
                            <span
                              className="text-sm font-bold"
                              style={{ color: "#f59e0b" }}
                            >
                              {Number.isInteger(item.rating)
                                ? item.rating
                                : item.rating.toFixed(1)}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: colors.text.tertiary }}
                            >
                              /5
                            </span>
                          </div>
                        ) : (
                          <p
                            className="text-xs italic"
                            style={{ color: colors.text.tertiary }}
                          >
                            {t("adminDashboard.schedule.reports.notRated")}
                          </p>
                        )}
                      </div>

                      <Chip
                        size="sm"
                        variant="flat"
                        className="flex-shrink-0"
                        style={{
                          backgroundColor: `${statusColor}20`,
                          color: statusColor,
                        }}
                      >
                        {t(
                          `adminDashboard.schedule.lessonStatuses.${item.status}`,
                        )}
                      </Chip>

                      <ChartSquare
                        weight="BoldDuotone"
                        size={16}
                        style={{ color: colors.primary.main, flexShrink: 0 }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {reportTotalPages > 1 && (
              <div className="flex w-full justify-center pt-4">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={reportPage}
                  total={reportTotalPages}
                  onChange={(p) => setReportPage(p)}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default LessonReports;
