import { useState, useEffect, useRef, useCallback } from "react";
import {
  AddCircle,
  AltArrowDown,
  AltArrowLeft,
  ChatRoundDots,
  ClockCircle,
  MinimalisticMagnifier,
  PresentationGraph,
  QuestionCircle,
  Plain,
  ShieldCheck,
  SquareAcademicCap,
  Ticket,
  UserCircle,
  UsersGroupRounded,
} from "@solar-icons/react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Chip,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  addToast,
  Pagination,
  Tabs,
  Tab,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";
import useInputStyles from "../../hooks/useInputStyles";
import { selectUser, selectIsAuthenticated } from "../../store";
import { supportApi } from "../../api/supportApi";
import * as MotionLib from "framer-motion";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import hybridWorkImage from "../../assets/illustrations/hybrid-work.avif";
import chill from "../../assets/illustrations/chill.avif";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const TICKET_TYPES = [
  "Error",
  "TechnicalIssue",
  "Question",
  "FeatureRequest",
  "Billing",
  "Payout",
  "Refund",
  "Reschedule",
  "Other",
];

const STATUS_COLORS = {
  Open: "primary",
  Resolved: "success",
  Closed: "default",
};

const TYPE_COLORS = {
  Error: "danger",
  TechnicalIssue: "warning",
  QuestionCircle: "primary",
  FeatureRequest: "secondary",
  Billing: "success",
  Payout: "success",
  Refund: "warning",
  Reschedule: "secondary",
  Other: "default",
};

const HelpSupport = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const { inputClassNames, textareaClassNames, selectClassNames } =
    useInputStyles();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const messagesEndRef = useRef(null);

  // View state: "list" or "detail"
  const [view, setView] = useState("list");
  const [selectedTicket, setSelectedTicket] = useState(null);

  // List state
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: "",
    description: "",
    type: "",
  });
  const [creating, setCreating] = useState(false);

  // Detail state
  const [detailLoading, setDetailLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  // FAQ tab
  const [faqTab, setFaqTab] = useState("general");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        CreatedBy: user?.userId,
        page,
        "page-size": 10,
      };
      if (searchTerm) params["search-term"] = searchTerm;
      if (statusFilter) params.Status = statusFilter;
      if (typeFilter) params.Type = typeFilter;

      const res = await supportApi.getTickets(params);
      if (res.isSuccess) {
        setTickets(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId, page, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    if (user?.userId) fetchTickets();
  }, [fetchTickets, user?.userId]);

  const handleSearch = () => {
    setPage(1);
    fetchTickets();
  };

  const openDetail = async (ticket) => {
    setView("detail");
    setDetailLoading(true);
    try {
      const res = await supportApi.getTicketById(ticket.id);
      if (res.isSuccess) {
        setSelectedTicket(res.data);
      }
    } catch {
      addToast({ title: "Failed to load ticket", color: "danger" });
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.subject || !createForm.description || !createForm.type)
      return;
    setCreating(true);
    try {
      const res = await supportApi.createTicket({
        createdBy: user?.userId,
        subject: createForm.subject,
        description: createForm.description,
        type: createForm.type,
      });
      if (res.isSuccess) {
        addToast({
          title: t("helpSupport.newTicket.success"),
          color: "success",
        });
        setCreateOpen(false);
        setCreateForm({ subject: "", description: "", type: "" });
        fetchTickets();
      }
    } catch {
      addToast({ title: t("helpSupport.newTicket.failed"), color: "danger" });
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const res = await supportApi.createMessage({
        ticketId: selectedTicket.id,
        senderId: user?.userId,
        message: messageText.trim(),
      });
      if (res.isSuccess) {
        setSelectedTicket((prev) => ({
          ...prev,
          supportTicketMessages: [
            ...(prev.supportTicketMessages || []),
            res.data,
          ],
        }));
        setMessageText("");
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      }
    } catch {
      addToast({ title: t("helpSupport.detail.sendFailed"), color: "danger" });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const faqCategories = {
    general: {
      icon: <UsersGroupRounded weight="BoldDuotone" className="w-5 h-5" />,
      items: Array.from({ length: 5 }, (_, i) => ({
        q: t(`helpSupport.faq.general.q${i + 1}`),
        a: t(`helpSupport.faq.general.a${i + 1}`),
      })),
    },
    student: {
      icon: <SquareAcademicCap weight="BoldDuotone" className="w-5 h-5" />,
      items: Array.from({ length: 5 }, (_, i) => ({
        q: t(`helpSupport.faq.student.q${i + 1}`),
        a: t(`helpSupport.faq.student.a${i + 1}`),
      })),
    },
    tutor: {
      icon: <PresentationGraph weight="BoldDuotone" className="w-5 h-5" />,
      items: Array.from({ length: 5 }, (_, i) => ({
        q: t(`helpSupport.faq.tutor.q${i + 1}`),
        a: t(`helpSupport.faq.tutor.a${i + 1}`),
      })),
    },
  };

  // ─── TICKET DETAIL VIEW ──────────────────────────────
  const renderTicketDetail = () => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Button
          variant="light"
          startContent={
            <AltArrowLeft weight="BoldDuotone" className="w-5 h-5" />
          }
          onPress={() => {
            setView("list");
            setSelectedTicket(null);
          }}
          style={{ color: colors.text.secondary }}
        >
          {t("helpSupport.detail.backToList")}
        </Button>
      </motion.div>

      {detailLoading ? (
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-6 space-y-4">
            <Skeleton className="h-8 w-2/3 rounded-lg" />
            <Skeleton className="h-4 w-1/3 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </CardBody>
        </Card>
      ) : selectedTicket ? (
        <>
          {/* Ticket Info */}
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
              <CardBody className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2
                      className="text-xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {selectedTicket.subject}
                    </h2>
                    <p
                      className="text-sm mt-1"
                      style={{ color: colors.text.tertiary }}
                    >
                      {formatDate(selectedTicket.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Chip
                      size="sm"
                      color={TYPE_COLORS[selectedTicket.type] || "default"}
                      variant="flat"
                    >
                      {t(`helpSupport.types.${selectedTicket.type}`)}
                    </Chip>
                    <Chip
                      size="sm"
                      color={STATUS_COLORS[selectedTicket.status] || "default"}
                      variant="flat"
                    >
                      {t(`helpSupport.statuses.${selectedTicket.status}`)}
                    </Chip>
                  </div>
                </div>
                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("helpSupport.detail.description")}
                  </p>
                  <p
                    className="whitespace-pre-wrap"
                    style={{ color: colors.text.primary }}
                  >
                    {selectedTicket.description}
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Activity Thread */}
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
              <CardBody className="p-6">
                <h3
                  className="text-lg font-semibold mb-6"
                  style={{ color: colors.text.primary }}
                >
                  <ChatRoundDots
                    weight="BoldDuotone"
                    className="w-5 h-5 inline-block mr-2"
                  />
                  {t("helpSupport.detail.activity")}
                </h3>

                {(!selectedTicket.supportTicketMessages ||
                  selectedTicket.supportTicketMessages.length === 0) && (
                  <div
                    className="text-center py-10 rounded-xl mb-6"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <ChatRoundDots
                      weight="BoldDuotone"
                      className="w-10 h-10 mx-auto mb-2"
                      style={{ color: colors.text.tertiary }}
                    />
                    <p style={{ color: colors.text.tertiary }}>
                      {t("helpSupport.detail.noMessages")}
                    </p>
                  </div>
                )}

                {selectedTicket.supportTicketMessages?.length > 0 && (
                  <div className="space-y-0 mb-6 max-h-[500px] overflow-y-auto">
                    {selectedTicket.supportTicketMessages
                      .sort(
                        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
                      )
                      .map((msg, index, arr) => {
                        const isMe = msg.senderId === user?.userId;
                        return (
                          <div key={msg.id} className="relative pl-10">
                            {/* Timeline line */}
                            {index < arr.length - 1 && (
                              <div
                                className="absolute left-[17px] top-10 bottom-0 w-[2px]"
                                style={{
                                  backgroundColor:
                                    colors.border?.main || "#e5e7eb",
                                }}
                              />
                            )}
                            {/* Timeline icon */}
                            <div
                              className="absolute left-0 top-2 w-9 h-9 rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor: isMe
                                  ? colors.primary.main + "18"
                                  : colors.background.gray || "#f3f4f6",
                              }}
                            >
                              {isMe ? (
                                <UserCircle
                                  weight="BoldDuotone"
                                  className="w-5 h-5"
                                  style={{
                                    color: colors.primary.main,
                                  }}
                                />
                              ) : (
                                <ShieldCheck
                                  weight="BoldDuotone"
                                  className="w-5 h-5"
                                  style={{
                                    color: colors.text.tertiary,
                                  }}
                                />
                              )}
                            </div>

                            {/* Message card */}
                            <div className="pb-5">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="text-sm font-semibold"
                                  style={{
                                    color: isMe
                                      ? colors.primary.main
                                      : colors.text.primary,
                                  }}
                                >
                                  {isMe
                                    ? t("helpSupport.detail.you")
                                    : t("helpSupport.detail.support")}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{
                                    color: colors.text.tertiary,
                                  }}
                                >
                                  {formatDate(msg.createdAt)}
                                </span>
                              </div>
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor:
                                    colors.background.gray || "#f3f4f6",
                                  borderLeft: `3px solid ${isMe ? colors.primary.main : colors.border?.main || "#e5e7eb"}`,
                                }}
                              >
                                <p
                                  className="text-sm whitespace-pre-wrap"
                                  style={{
                                    color: colors.text.primary,
                                  }}
                                >
                                  {msg.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {selectedTicket.status !== "Closed" &&
                  selectedTicket.status !== "Resolved" && (
                    <div
                      className="pt-5"
                      style={{
                        borderTop: `1px solid ${colors.border?.main || "#e5e7eb"}`,
                      }}
                    >
                      <p
                        className="text-sm font-semibold mb-3"
                        style={{ color: colors.text.primary }}
                      >
                        {t("helpSupport.detail.reply")}
                      </p>
                      <Textarea
                        value={messageText}
                        onValueChange={setMessageText}
                        placeholder={t("helpSupport.detail.replyPlaceholder")}
                        classNames={inputClassNames}
                        minRows={3}
                        maxRows={6}
                      />
                      <div className="flex justify-end mt-3">
                        <Button
                          isLoading={sending}
                          onPress={handleSendMessage}
                          isDisabled={!messageText.trim()}
                          startContent={
                            !sending && (
                              <Plain weight="BoldDuotone" className="w-4 h-4" />
                            )
                          }
                          style={{
                            backgroundColor: colors.primary.main,
                            color: colors.text.white,
                          }}
                        >
                          {t("helpSupport.detail.reply")}
                        </Button>
                      </div>
                    </div>
                  )}
              </CardBody>
            </Card>
          </motion.div>
        </>
      ) : null}
    </div>
  );

  // ─── MAIN RENDER ──────────────────────────────────────
  return (
    <>
      <Header />
      {view === "detail" ? (
        renderTicketDetail()
      ) : (
        <div
          className="min-h-screen"
          style={{ backgroundColor: colors.background.light }}
        >
          {/* Hero Section */}
          <section
            className="py-16 px-6 md:px-12"
            style={{
              background:
                theme === "dark"
                  ? colors.background.page
                  : "linear-gradient(to bottom, #FFFFFF, #DBEAFE)",
            }}
          >
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <span
                    className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6"
                    style={{
                      backgroundColor: colors.background.primaryLight,
                      color: colors.primary.main,
                    }}
                  >
                    {t("helpSupport.hero.badge")}
                  </span>
                  <h1
                    className="text-3xl lg:text-5xl font-bold mb-4 leading-tight"
                    style={{ color: colors.text.primary }}
                  >
                    {t("helpSupport.hero.title")}
                    <span style={{ color: colors.primary.main }}>
                      {" "}
                      {t("helpSupport.hero.titleHighlight")}
                    </span>
                  </h1>
                  <p
                    className="text-lg mb-8"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("helpSupport.hero.description")}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      radius="full"
                      className="font-semibold"
                      startContent={
                        <AltArrowDown
                          weight="BoldDuotone"
                          className="w-5 h-5"
                        />
                      }
                      style={{
                        backgroundColor: colors.primary.main,
                        color: colors.text.white,
                      }}
                      onPress={() =>
                        document
                          .getElementById("faq-section")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      {t("helpSupport.hero.browseFaq")}
                    </Button>
                    {isAuthenticated && (
                      <Button
                        size="lg"
                        radius="full"
                        variant="flat"
                        className="font-semibold"
                        startContent={
                          <AddCircle weight="BoldDuotone" className="w-5 h-5" />
                        }
                        style={{
                          backgroundColor:
                            colors.button.primaryLight.background,
                          color: colors.button.primaryLight.text,
                        }}
                        onPress={() => setCreateOpen(true)}
                      >
                        {t("helpSupport.createTicket")}
                      </Button>
                    )}
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="hidden lg:flex justify-center"
                >
                  <img
                    src={hybridWorkImage}
                    alt="Help & Support"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full max-w-md h-auto"
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section
            id="faq-section"
            className="py-16 lg:py-20 px-6 md:px-12"
            style={{ backgroundColor: colors.background.light }}
          >
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-12"
              >
                <h2
                  className="text-2xl lg:text-4xl font-bold mb-3"
                  style={{ color: colors.text.primary }}
                >
                  {t("helpSupport.faq.title")}
                </h2>
                <p className="text-lg" style={{ color: colors.text.secondary }}>
                  {t("helpSupport.faq.subtitle")}
                </p>
              </motion.div>

              <div className="flex justify-center mb-8">
                <Tabs
                  selectedKey={faqTab}
                  onSelectionChange={setFaqTab}
                  aria-label="Dynamic tabs"
                  size="lg"
                  color="primary"
                >
                  <Tab
                    key="general"
                    title={
                      <div className="flex items-center gap-2">
                        <UsersGroupRounded
                          weight="BoldDuotone"
                          className="w-5 h-5"
                        />
                        <span>{t("helpSupport.faq.tabs.general")}</span>
                      </div>
                    }
                  />
                  <Tab
                    key="student"
                    title={
                      <div className="flex items-center gap-2">
                        <SquareAcademicCap
                          weight="BoldDuotone"
                          className="w-5 h-5"
                        />
                        <span>{t("helpSupport.faq.tabs.student")}</span>
                      </div>
                    }
                  />
                  <Tab
                    key="tutor"
                    title={
                      <div className="flex items-center gap-2">
                        <PresentationGraph
                          weight="BoldDuotone"
                          className="w-5 h-5"
                        />
                        <span>{t("helpSupport.faq.tabs.tutor")}</span>
                      </div>
                    }
                  />
                </Tabs>
              </div>

              <motion.div
                key={faqTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  shadow="none"
                  className="border-none"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <CardBody className="p-2 sm:p-4">
                    <Accordion variant="splitted" selectionMode="multiple">
                      {faqCategories[faqTab].items.map((item, idx) => (
                        <AccordionItem
                          key={idx}
                          aria-label={item.q}
                          title={
                            <span
                              className="font-medium"
                              style={{ color: colors.text.primary }}
                            >
                              {item.q}
                            </span>
                          }
                          classNames={{
                            base: "border-none shadow-none",
                            trigger: "py-4 px-2",
                            content: "px-2 pb-4",
                          }}
                          style={{
                            backgroundColor: colors.background.light,
                          }}
                        >
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: colors.text.secondary }}
                          >
                            {item.a}
                          </p>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardBody>
                </Card>
              </motion.div>
            </div>
          </section>

          {/* Support Tickets Section (only for logged in users) */}
          {isAuthenticated && (
            <section
              className="py-16 lg:py-20 px-6 md:px-12"
              style={{
                backgroundColor: colors.background.gray,
              }}
            >
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Section Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div>
                        <h2
                          className="text-2xl lg:text-3xl font-bold mb-1"
                          style={{ color: colors.text.primary }}
                        >
                          {t("helpSupport.myTickets")}
                        </h2>
                        <p style={{ color: colors.text.secondary }}>
                          {t("helpSupport.subtitle")}
                        </p>
                      </div>
                    </div>
                    <Button
                      startContent={
                        <AddCircle weight="BoldDuotone" className="w-5 h-5" />
                      }
                      onPress={() => setCreateOpen(true)}
                      style={{
                        backgroundColor: colors.primary.main,
                        color: colors.text.white,
                      }}
                    >
                      {t("helpSupport.createTicket")}
                    </Button>
                  </div>

                  {/* Filters */}
                  <Card
                    shadow="none"
                    className="border-none mb-6"
                    style={{ backgroundColor: colors.background.light }}
                  >
                    <CardBody className="p-4">
                      <div className="flex flex-col md:flex-row gap-3">
                        <Input
                          value={searchTerm}
                          onValueChange={setSearchTerm}
                          placeholder={t("helpSupport.searchPlaceholder")}
                          startContent={
                            <MinimalisticMagnifier
                              weight="BoldDuotone"
                              className="w-4 h-4 text-gray-400"
                            />
                          }
                          classNames={inputClassNames}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch();
                          }}
                        />
                        <Select
                          selectedKeys={statusFilter ? [statusFilter] : []}
                          onSelectionChange={(keys) => {
                            const val = [...keys][0] || "";
                            setStatusFilter(val);
                            setPage(1);
                          }}
                          placeholder={t("helpSupport.allStatuses")}
                          className="w-full md:w-44"
                          classNames={selectClassNames}
                        >
                          {["Open", "Resolved", "Closed"].map((s) => (
                            <SelectItem key={s}>
                              {t(`helpSupport.statuses.${s}`)}
                            </SelectItem>
                          ))}
                        </Select>
                        <Select
                          selectedKeys={typeFilter ? [typeFilter] : []}
                          onSelectionChange={(keys) => {
                            const val = [...keys][0] || "";
                            setTypeFilter(val);
                            setPage(1);
                          }}
                          placeholder={t("helpSupport.allTypes")}
                          className="w-full md:w-44"
                          classNames={selectClassNames}
                        >
                          {TICKET_TYPES.map((tp) => (
                            <SelectItem key={tp}>
                              {t(`helpSupport.types.${tp}`)}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Tickets List */}
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card
                          key={`skeleton-${i}`}
                          shadow="none"
                          className="border-none"
                          style={{
                            backgroundColor: colors.background.light,
                          }}
                        >
                          <CardBody className="p-5">
                            <div className="space-y-3">
                              <Skeleton className="h-5 w-2/3 rounded-lg" />
                              <Skeleton className="h-4 w-1/3 rounded-lg" />
                              <div className="flex gap-2">
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  ) : tickets.length === 0 ? (
                    <Card
                      shadow="none"
                      className="border-none"
                      style={{ backgroundColor: colors.background.light }}
                    >
                      <CardBody className="p-4 mb-10 flex flex-col items-center justify-center">
                        {/* <Ticket
                          weight="BoldDuotone"
                          className="w-16 h-16 mx-auto mb-4"
                          style={{ color: colors.text.tertiary }}
                        /> */}
                        <img
                          src={chill}
                          alt="No courses"
                          className="w-68 h-68 object-contain"
                        />
                        <p
                          className="text-lg font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {t("helpSupport.noTickets")}
                        </p>
                        <p style={{ color: colors.text.tertiary }}>
                          {t("helpSupport.noTicketsDesc")}
                        </p>
                      </CardBody>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tickets.map((ticket) => (
                        <Card
                          key={ticket.id}
                          isPressable
                          shadow="none"
                          className="border-none"
                          style={{
                            backgroundColor: colors.background.light,
                          }}
                          onPress={() => openDetail(ticket)}
                        >
                          <CardBody className="p-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3
                                  className="font-semibold text-base truncate"
                                  style={{ color: colors.text.primary }}
                                >
                                  {ticket.subject}
                                </h3>
                                <p
                                  className="text-sm mt-1 line-clamp-1"
                                  style={{ color: colors.text.secondary }}
                                >
                                  {ticket.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs">
                                  <ClockCircle
                                    weight="BoldDuotone"
                                    className="w-3 h-3"
                                    style={{ color: colors.text.tertiary }}
                                  />
                                  <span style={{ color: colors.text.tertiary }}>
                                    {formatDate(ticket.createdAt)}
                                  </span>
                                  {ticket.supportTicketMessages?.length > 0 && (
                                    <>
                                      <ChatRoundDots
                                        weight="BoldDuotone"
                                        className="w-3 h-3 ml-2"
                                        style={{
                                          color: colors.text.tertiary,
                                        }}
                                      />
                                      <span
                                        style={{
                                          color: colors.text.tertiary,
                                        }}
                                      >
                                        {ticket.supportTicketMessages.length}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Chip
                                  size="sm"
                                  color={TYPE_COLORS[ticket.type] || "default"}
                                  variant="flat"
                                >
                                  {t(`helpSupport.types.${ticket.type}`)}
                                </Chip>
                                <Chip
                                  size="sm"
                                  color={
                                    STATUS_COLORS[ticket.status] || "default"
                                  }
                                  variant="flat"
                                >
                                  {t(`helpSupport.statuses.${ticket.status}`)}
                                </Chip>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}

                      {totalPages > 1 && (
                        <div className="flex justify-center mt-4">
                          <Pagination
                            total={totalPages}
                            page={page}
                            onChange={setPage}
                            showControls
                            color="primary"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            </section>
          )}
        </div>
      )}
      <Footer />

      {/* Create Ticket Modal */}
      <Modal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        size="lg"
        classNames={{
          base: "border-none",
          body: "p-6",
        }}
        style={{ backgroundColor: colors.background.light }}
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("helpSupport.newTicket.title")}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label={t("helpSupport.newTicket.subject")}
                  placeholder={t("helpSupport.newTicket.subjectPlaceholder")}
                  value={createForm.subject}
                  onValueChange={(v) =>
                    setCreateForm((p) => ({ ...p, subject: v }))
                  }
                  classNames={inputClassNames}
                />
                <Select
                  label={t("helpSupport.newTicket.type")}
                  placeholder={t("helpSupport.newTicket.selectType")}
                  selectedKeys={createForm.type ? [createForm.type] : []}
                  onSelectionChange={(keys) =>
                    setCreateForm((p) => ({
                      ...p,
                      type: [...keys][0] || "",
                    }))
                  }
                  classNames={selectClassNames}
                >
                  {TICKET_TYPES.map((tp) => (
                    <SelectItem key={tp}>
                      {t(`helpSupport.types.${tp}`)}
                    </SelectItem>
                  ))}
                </Select>
                <Textarea
                  label={t("helpSupport.newTicket.description")}
                  placeholder={t(
                    "helpSupport.newTicket.descriptionPlaceholder",
                  )}
                  value={createForm.description}
                  onValueChange={(v) =>
                    setCreateForm((p) => ({ ...p, description: v }))
                  }
                  minRows={4}
                  classNames={textareaClassNames}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("logoutModal.cancel")}
                </Button>
                <Button
                  isLoading={creating}
                  isDisabled={
                    !createForm.subject ||
                    !createForm.description ||
                    !createForm.type
                  }
                  onPress={handleCreate}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                >
                  {t("helpSupport.newTicket.submit")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default HelpSupport;
