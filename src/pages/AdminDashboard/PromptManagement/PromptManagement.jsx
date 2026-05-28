import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  ChatSquareCode,
  CheckCircle,
  Eye,
  Filter,
  ForbiddenCircle,
  MinimalisticMagnifier,
} from "@solar-icons/react";
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
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";
import { adminApi } from "../../../api";

const PromptManagement = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { inputClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedActive, setSelectedActive] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const p = (key) => t(`adminDashboard.promptManagement.${key}`);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: listData, isLoading } = useQuery({
    queryKey: [
      "admin-prompt-definitions",
      page,
      pageSize,
      debouncedSearch,
      selectedActive,
    ],
    queryFn: () => {
      const params = { page, "page-size": pageSize };
      if (debouncedSearch) params["search-term"] = debouncedSearch;
      if (selectedActive === "active") params.IsActive = true;
      if (selectedActive === "inactive") params.IsActive = false;
      return adminApi.getPromptDefinitions(params).then((r) => r.data);
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const items = listData?.items ?? [];
  const totalPages = listData?.totalPages ?? 1;

  const stats = [
    {
      icon: ChatSquareCode,
      label: p("stats.total"),
      value: listData?.totalItems ?? "--",
      color: colors.primary.main,
      bg: colors.background.primaryLight,
    },
    {
      icon: CheckCircle,
      label: p("stats.active"),
      value: items.filter((i) => i.isActive).length,
      color: colors.state.success,
      bg: `${colors.state.success}20`,
    },
    {
      icon: ForbiddenCircle,
      label: p("stats.inactive"),
      value: items.filter((i) => !i.isActive).length,
      color: colors.state.error,
      bg: `${colors.state.error}20`,
    },
  ];

  const statusLabel =
    selectedActive === "all"
      ? p("all")
      : selectedActive === "active"
        ? p("stats.active")
        : p("stats.inactive");

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            {p("title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>{p("subtitle")}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Filter + Search */}
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder={p("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={
                  <MinimalisticMagnifier
                    weight="BoldDuotone"
                    className="w-4 h-4"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                className="flex-1"
              />
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    startContent={
                      <Filter weight="BoldDuotone" className="w-4 h-4" />
                    }
                  >
                    {p("status")}: {statusLabel}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Status filter"
                  selectionMode="single"
                  selectedKeys={[selectedActive]}
                  onAction={(key) => {
                    setSelectedActive(key);
                    setPage(1);
                  }}
                >
                  <DropdownItem key="all">{p("all")}</DropdownItem>
                  <DropdownItem key="active">{p("stats.active")}</DropdownItem>
                  <DropdownItem key="inactive">
                    {p("stats.inactive")}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
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
              aria-label="Prompt definitions table"
              classNames={tableClassNames}
              bottomContent={
                totalPages > 1 ? (
                  <div className="flex justify-center py-2">
                    <Pagination
                      total={totalPages}
                      page={page}
                      onChange={setPage}
                      color="primary"
                      showControls
                    />
                  </div>
                ) : null
              }
            >
              <TableHeader>
                <TableColumn>{p("table.code")}</TableColumn>
                <TableColumn>{p("table.feature")}</TableColumn>
                <TableColumn>{p("table.status")}</TableColumn>
                <TableColumn>{p("table.createdAt")}</TableColumn>
                <TableColumn>{p("table.actions")}</TableColumn>
              </TableHeader>
              <TableBody
                isLoading={isLoading}
                emptyContent={p("noData")}
                items={items}
              >
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span
                        className="font-mono text-sm font-semibold px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: colors.background.primaryLight,
                          color: colors.primary.main,
                        }}
                      >
                        {item.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: colors.text.primary }}>
                        {item.feature}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={item.isActive ? "success" : "danger"}
                        variant="flat"
                      >
                        {item.isActive
                          ? p("stats.active")
                          : p("stats.inactive")}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {formatDate(item.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={
                          <Eye weight="BoldDuotone" className="w-4 h-4" />
                        }
                        onPress={() => navigate(`/admin/ai-prompts/${item.id}`)}
                      >
                        {p("view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default PromptManagement;
