import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AltArrowLeft,
  Card as CardIcon,
  ChatRoundDots,
  CheckCircle,
  Dollar,
  Eye,
  Letter,
  MinimalisticMagnifier,
  Restart,
  Plain,
  ShieldCheck,
  TrashBinMinimalistic,
  UserCircle,
  Wallet,
} from "@solar-icons/react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Select,
  SelectItem,
  Spinner,
  Skeleton,
  Textarea,
  Pagination,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Avatar,
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { selectUser } from "../../../store";
import { supportApi } from "../../../api/supportApi";
import { tutorApi } from "../../../api/tutorApi";
import { studentApi } from "../../../api/studentApi";
import { paymentApi } from "../../../api/paymentApi";
import AdminLessonDetailModal from "../../../components/AdminLessonDetailModal/AdminLessonDetailModal";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

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
  Question: "primary",
  FeatureRequest: "secondary",
  Billing: "success",
  Payout: "success",
  Refund: "warning",
  Reschedule: "secondary",
  Other: "default",
};

const STATUSES = ["Open", "Resolved", "Closed"];

const SupportTickets = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames, selectClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const queryClient = useQueryClient();

  const [view, setView] = useState("list");
  const [selectedTicket, setSelectedTicket] = useState(null);

  // List
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Detail
  const [detailLoading, setDetailLoading] = useState(false);
  const [senderInfo, setSenderInfo] = useState(null);
  const [senderLoading, setSenderLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  // Reschedule approval
  const [approvingReschedule, setApprovingReschedule] = useState(false);
  const [rejectingReschedule, setRejectingReschedule] = useState(false);
  const [rescheduleLesson, setRescheduleLesson] = useState(null);
  const [rescheduleLessonLoading, setRescheduleLessonLoading] = useState(false);
  const [isLessonDetailOpen, setIsLessonDetailOpen] = useState(false);

  // Payout approval
  const [payoutTutorId, setPayoutTutorId] = useState(null);
  const [payoutSummary, setPayoutSummary] = useState(null);
  const [payoutSummaryLoading, setPayoutSummaryLoading] = useState(false);
  const [payoutPasswordOpen, setPayoutPasswordOpen] = useState(false);
  const [payoutPassword, setPayoutPassword] = useState("");
  const [processingPayout, setProcessingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  // Refund approval
  const [refundLessonId, setRefundLessonId] = useState(null);
  const [refundLesson, setRefundLesson] = useState(null);
  const [refundLessonLoading, setRefundLessonLoading] = useState(false);
  const [refundEnrollmentId, setRefundEnrollmentId] = useState(null);
  const [refundPasswordOpen, setRefundPasswordOpen] = useState(false);
  const [refundPassword, setRefundPassword] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundError, setRefundError] = useState("");

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: ticketsData, isLoading: loading } = useQuery({
    queryKey: ["admin-tickets", page, appliedSearch, statusFilter, typeFilter],
    queryFn: async () => {
      const params = { page, "page-size": 10 };
      if (appliedSearch) params["search-term"] = appliedSearch;
      if (statusFilter) params.Status = statusFilter;
      if (typeFilter) params.Type = typeFilter;
      const res = await supportApi.getTickets(params);
      return res.isSuccess ? res.data : { items: [], totalPages: 1 };
    },
    staleTime: 10 * 1000,
  });
  const tickets = ticketsData?.items ?? [];
  const totalPages = ticketsData?.totalPages ?? 1;

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setPage(1);
  };

  const resolveSender = async (userId) => {
    if (!userId) return;
    setSenderLoading(true);
    setSenderInfo(null);
    try {
      // Check if user is a tutor
      const tutorRes = await tutorApi.getAllTutors({ UserId: userId });
      if (tutorRes.isSuccess && tutorRes.data?.items?.length > 0) {
        const tutor = tutorRes.data.items[0];
        setSenderInfo({
          role: "Tutor",
          id: tutor.id,
          avatar: tutor.avatar,
          name: `${tutor.user?.firstName || ""} ${tutor.user?.lastName || ""}`.trim(),
          email: tutor.user?.email || "",
        });
        return;
      }
      // Check if user is a student
      const studentRes = await studentApi.getAllStudents({ UserId: userId });
      if (studentRes.isSuccess && studentRes.data?.items?.length > 0) {
        const student = studentRes.data.items[0];
        setSenderInfo({
          role: "Student",
          id: student.id,
          avatar: student.avatar,
          name: `${student.user?.firstName || ""} ${student.user?.lastName || ""}`.trim(),
          email: student.user?.email || "",
        });
        return;
      }
    } catch {
      // Silently fail
    } finally {
      setSenderLoading(false);
    }
  };

  const openDetail = async (ticket) => {
    setView("detail");
    setDetailLoading(true);
    setRescheduleLesson(null);
    setPayoutTutorId(null);
    setPayoutSummary(null);
    setRefundLessonId(null);
    setRefundLesson(null);
    setRefundEnrollmentId(null);
    try {
      const res = await supportApi.getTicketById(ticket.id);
      if (res.isSuccess) {
        setSelectedTicket(res.data);
        resolveSender(res.data.createdBy);
        // Auto-fetch lesson for Reschedule tickets
        if (res.data.type === "Reschedule") {
          const match = res.data.description?.match(
            /Lesson ID:\s*([0-9a-f-]{36})/i,
          );
          if (match) {
            setRescheduleLessonLoading(true);
            studentApi
              .getLessonById(match[1])
              .then((r) => setRescheduleLesson(r?.data ?? null))
              .catch(() => {})
              .finally(() => setRescheduleLessonLoading(false));
          }
        }
        // Auto-fetch lesson for Refund tickets
        if (res.data.type === "Refund") {
          const lessonMatch = res.data.description?.match(
            /\[LessonId\]:\s*([0-9a-f-]{36})/i,
          );
          const enrollmentMatch = res.data.description?.match(
            /\[EnrollmentId\]:\s*([0-9a-f-]{36})/i,
          );
          if (lessonMatch) {
            const lid = lessonMatch[1];
            setRefundLessonId(lid);
            setRefundLessonLoading(true);
            studentApi
              .getLessonById(lid)
              .then((r) => setRefundLesson(r?.data ?? null))
              .catch(() => {})
              .finally(() => setRefundLessonLoading(false));
          } else if (enrollmentMatch) {
            setRefundEnrollmentId(enrollmentMatch[1]);
          }
        }
        // Auto-fetch tutor earning summary for Payout tickets
        if (res.data.type === "Payout") {
          const match = res.data.description?.match(
            /\[TutorId\]:\s*([0-9a-f-]{36})/i,
          );
          if (match) {
            const tid = match[1];
            setPayoutTutorId(tid);
            setPayoutSummaryLoading(true);
            paymentApi
              .getTotalEarning({ TutorId: tid })
              .then((r) => setPayoutSummary(r?.data?.singleTutor ?? null))
              .catch(() => {})
              .finally(() => setPayoutSummaryLoading(false));
          }
        }
      }
    } catch {
      addToast({ title: "Failed to load ticket", color: "danger" });
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await supportApi.deleteTicket(deleteId);
      addToast({
        title: t("adminDashboard.supportTickets.deleteSuccess"),
        color: "success",
      });
      setDeleteOpen(false);
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    } catch {
      addToast({
        title: t("adminDashboard.supportTickets.deleteFailed"),
        color: "danger",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (ticketId, status) => {
    try {
      await supportApi.updateTicketStatus(ticketId, status);
      addToast({
        title: t("adminDashboard.supportTickets.updateStatusSuccess"),
        color: "success",
      });
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev) => ({ ...prev, status }));
      }
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    } catch {
      addToast({
        title: t("adminDashboard.supportTickets.updateStatusFailed"),
        color: "danger",
      });
    }
  };

  const handleRejectReschedule = async () => {
    if (!selectedTicket) return;
    setRejectingReschedule(true);
    try {
      await supportApi.updateTicketStatus(selectedTicket.id, "Closed");
      setSelectedTicket((prev) => ({ ...prev, status: "Closed" }));
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      addToast({
        title: t("adminDashboard.supportTickets.reschedule.rejectSuccess"),
        color: "success",
      });
    } catch {
      addToast({
        title: t("adminDashboard.supportTickets.reschedule.rejectFailed"),
        color: "danger",
      });
    } finally {
      setRejectingReschedule(false);
    }
  };

  const handleApproveReschedule = async () => {
    if (!selectedTicket) return;
    const match = selectedTicket.description?.match(
      /Lesson ID:\s*([0-9a-f-]{36})/i,
    );
    if (!match) {
      addToast({
        title: t("adminDashboard.supportTickets.reschedule.lessonIdNotFound"),
        color: "danger",
      });
      return;
    }
    const lessonId = match[1];
    setApprovingReschedule(true);
    try {
      await studentApi.updateLessonStatus(lessonId, "Reschedule");
      await supportApi.updateTicketStatus(selectedTicket.id, "Resolved");
      setSelectedTicket((prev) => ({ ...prev, status: "Resolved" }));
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      addToast({
        title: t("adminDashboard.supportTickets.reschedule.approveSuccess"),
        color: "success",
      });
    } catch {
      addToast({
        title: t("adminDashboard.supportTickets.reschedule.approveFailed"),
        color: "danger",
      });
    } finally {
      setApprovingReschedule(false);
    }
  };

  const handleApprovePayout = async () => {
    if (!payoutTutorId || !payoutPassword) {
      setPayoutError(
        t("adminDashboard.supportTickets.payout.passwordRequired"),
      );
      return;
    }
    setProcessingPayout(true);
    setPayoutError("");
    try {
      await paymentApi.createManualPayout({
        tutorId: payoutTutorId,
        password: payoutPassword,
      });
      await supportApi.updateTicketStatus(selectedTicket.id, "Resolved");
      setSelectedTicket((prev) => ({ ...prev, status: "Resolved" }));
      setPayoutPasswordOpen(false);
      setPayoutPassword("");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      addToast({
        title: t("adminDashboard.supportTickets.payout.approveSuccess"),
        color: "success",
      });
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === "User.InvalidPassword") {
        setPayoutError(
          t("adminDashboard.supportTickets.payout.invalidPassword"),
        );
      } else {
        setPayoutError(
          err?.response?.data?.error?.message ||
            t("adminDashboard.supportTickets.payout.approveFailed"),
        );
      }
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleApproveRefund = async () => {
    if (!refundLessonId) {
      setRefundError(
        t("adminDashboard.supportTickets.refund.lessonIdNotFound"),
      );
      return;
    }
    if (!refundPassword) {
      setRefundError(
        t("adminDashboard.supportTickets.refund.passwordRequired"),
      );
      return;
    }
    setProcessingRefund(true);
    setRefundError("");
    try {
      await paymentApi.approveStudentRefundNoTutor({
        lessonId: refundLessonId,
        password: refundPassword,
        note: refundNote.trim() || undefined,
      });
      await supportApi.updateTicketStatus(selectedTicket.id, "Resolved");
      setSelectedTicket((prev) => ({ ...prev, status: "Resolved" }));
      setRefundPasswordOpen(false);
      setRefundPassword("");
      setRefundNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      addToast({
        title: t("adminDashboard.supportTickets.refund.approveSuccess"),
        color: "success",
      });
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === "User.InvalidPassword") {
        setRefundError(
          t("adminDashboard.supportTickets.refund.invalidPassword"),
        );
      } else {
        setRefundError(
          err?.response?.data?.error?.message ||
            t("adminDashboard.supportTickets.refund.approveFailed"),
        );
      }
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleApproveCourseRefund = async () => {
    if (!refundEnrollmentId) {
      setRefundError(
        t("adminDashboard.supportTickets.courseRefund.enrollmentIdNotFound"),
      );
      return;
    }
    if (!refundPassword) {
      setRefundError(
        t("adminDashboard.supportTickets.refund.passwordRequired"),
      );
      return;
    }
    setProcessingRefund(true);
    setRefundError("");
    try {
      await paymentApi.approveStudentRefundCourseCancellation({
        enrollmentId: refundEnrollmentId,
        ticketId: selectedTicket.id,
        password: refundPassword,
        note: refundNote.trim() || undefined,
      });
      await supportApi.updateTicketStatus(selectedTicket.id, "Resolved");
      setSelectedTicket((prev) => ({ ...prev, status: "Resolved" }));
      setRefundPasswordOpen(false);
      setRefundPassword("");
      setRefundNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      addToast({
        title: t("adminDashboard.supportTickets.courseRefund.approveSuccess"),
        color: "success",
      });
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === "User.InvalidPassword") {
        setRefundError(
          t("adminDashboard.supportTickets.refund.invalidPassword"),
        );
      } else {
        setRefundError(
          err?.response?.data?.error?.message ||
            t("adminDashboard.supportTickets.courseRefund.approveFailed"),
        );
      }
    } finally {
      setProcessingRefund(false);
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
      addToast({
        title: t("adminDashboard.supportTickets.detail.sendFailed"),
        color: "danger",
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
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

  // DETAIL VIEW
  if (view === "detail") {
    return (
      <div className="space-y-6">
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
            {t("adminDashboard.supportTickets.detail.backToList")}
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
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        color={TYPE_COLORS[selectedTicket.type] || "default"}
                        variant="flat"
                      >
                        {t(
                          `adminDashboard.supportTickets.types.${selectedTicket.type}`,
                        )}
                      </Chip>
                      <Select
                        selectedKeys={[selectedTicket.status]}
                        onSelectionChange={(keys) => {
                          const val = [...keys][0];
                          if (val && val !== selectedTicket.status) {
                            handleStatusChange(selectedTicket.id, val);
                          }
                        }}
                        className="w-40"
                        size="sm"
                        classNames={selectClassNames}
                        aria-label={t(
                          "adminDashboard.supportTickets.detail.changeStatus",
                        )}
                      >
                        {STATUSES.map((s) => (
                          <SelectItem key={s}>
                            {t(`adminDashboard.supportTickets.statuses.${s}`)}
                          </SelectItem>
                        ))}
                      </Select>
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
                      {t("adminDashboard.supportTickets.detail.description")}
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

            {/* Reschedule Approval Action */}
            {selectedTicket.type === "Reschedule" && (
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
                  <CardBody className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <Restart
                        weight="BoldDuotone"
                        className="w-5 h-5"
                        style={{ color: colors.state.warning }}
                      />
                      <h3
                        className="text-base font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("adminDashboard.supportTickets.reschedule.title")}
                      </h3>
                    </div>

                    {/* Lesson Detail */}
                    {rescheduleLessonLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-2/3 rounded-lg" />
                        <Skeleton className="h-4 w-1/2 rounded-lg" />
                        <Skeleton className="h-4 w-1/3 rounded-lg" />
                      </div>
                    ) : rescheduleLesson ? (
                      <div
                        className="p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: colors.background.gray }}
                        onClick={() => setIsLessonDetailOpen(true)}
                      >
                        <div className="min-w-0">
                          <p
                            className="font-semibold text-sm truncate"
                            style={{ color: colors.text.primary }}
                          >
                            {rescheduleLesson.courseTitle ||
                              rescheduleLesson.sessionTitle}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: colors.text.secondary }}
                          >
                            {new Date(
                              rescheduleLesson.startTime,
                            ).toLocaleString(
                              i18n.language === "vi" ? "vi-VN" : "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                            {" – "}
                            {new Date(
                              rescheduleLesson.endTime,
                            ).toLocaleTimeString(
                              i18n.language === "vi" ? "vi-VN" : "en-US",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          style={{
                            backgroundColor:
                              rescheduleLesson.status === "NoTutor"
                                ? `${colors.state.error}15`
                                : `${colors.state.warning}15`,
                            color:
                              rescheduleLesson.status === "NoTutor"
                                ? colors.state.error
                                : colors.state.warning,
                            flexShrink: 0,
                          }}
                        >
                          {t(
                            `adminDashboard.schedule.lessonStatuses.${rescheduleLesson.status}`,
                          ) || rescheduleLesson.status}
                        </Chip>
                      </div>
                    ) : null}

                    {/* Hint */}
                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.supportTickets.reschedule.hint")}
                    </p>

                    {/* Action */}
                    {selectedTicket.status === "Resolved" ||
                    selectedTicket.status === "Closed" ? (
                      <div
                        className="flex items-center gap-2 p-3 rounded-xl"
                        style={{
                          backgroundColor: `${colors.state.success}12`,
                          border: `1px solid ${colors.state.success}30`,
                        }}
                      >
                        <CheckCircle
                          weight="BoldDuotone"
                          className="w-4 h-4"
                          style={{ color: colors.state.success }}
                        />
                        <p
                          className="text-sm"
                          style={{ color: colors.state.success }}
                        >
                          {t(
                            "adminDashboard.supportTickets.reschedule.alreadyApproved",
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Button
                          isLoading={approvingReschedule}
                          isDisabled={rejectingReschedule}
                          onPress={handleApproveReschedule}
                          startContent={
                            !approvingReschedule && (
                              <Restart
                                weight="BoldDuotone"
                                className="w-4 h-4"
                              />
                            )
                          }
                          style={{
                            backgroundColor: colors.state.warning,
                            color: "#fff",
                          }}
                        >
                          {t(
                            "adminDashboard.supportTickets.reschedule.approveBtn",
                          )}
                        </Button>
                        <Button
                          isLoading={rejectingReschedule}
                          isDisabled={approvingReschedule}
                          onPress={handleRejectReschedule}
                          variant="flat"
                          style={{
                            backgroundColor: `${colors.state.error}15`,
                            color: colors.state.error,
                          }}
                        >
                          {t(
                            "adminDashboard.supportTickets.reschedule.rejectBtn",
                          )}
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {/* Payout Approval Action */}
            {selectedTicket.type === "Payout" && (
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
                  <CardBody className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Wallet
                        weight="BoldDuotone"
                        className="w-5 h-5"
                        style={{ color: colors.state.success }}
                      />
                      <h3
                        className="text-base font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("adminDashboard.supportTickets.payout.title")}
                      </h3>
                    </div>

                    {/* Tutor balance summary */}
                    {payoutSummaryLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-1/2 rounded-lg" />
                        <Skeleton className="h-4 w-1/3 rounded-lg" />
                      </div>
                    ) : payoutSummary ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className="p-3 rounded-xl"
                          style={{
                            backgroundColor: `${colors.primary.main}10`,
                            border: `1px solid ${colors.primary.main}25`,
                          }}
                        >
                          <p
                            className="text-xs flex items-center gap-1"
                            style={{ color: colors.text.secondary }}
                          >
                            <Wallet
                              weight="BoldDuotone"
                              className="w-3.5 h-3.5"
                            />
                            {t(
                              "adminDashboard.supportTickets.payout.availableBalance",
                            )}
                          </p>
                          <p
                            className="text-xl font-bold mt-1"
                            style={{ color: colors.primary.main }}
                          >
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                              maximumFractionDigits: 0,
                            }).format(payoutSummary.availableBalance || 0)}
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
                            {t("adminDashboard.supportTickets.payout.totalNet")}
                          </p>
                          <p
                            className="text-base font-semibold mt-1"
                            style={{ color: colors.text.primary }}
                          >
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                              maximumFractionDigits: 0,
                            }).format(payoutSummary.totalNetAmount || 0)}
                          </p>
                          <p
                            className="text-[10px] mt-0.5"
                            style={{ color: colors.text.tertiary }}
                          >
                            {payoutSummary.earningCount}{" "}
                            {t("adminDashboard.supportTickets.payout.earnings")}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Hint */}
                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.supportTickets.payout.hint")}
                    </p>

                    {/* Action */}
                    {selectedTicket.status === "Resolved" ||
                    selectedTicket.status === "Closed" ? (
                      <div
                        className="flex items-center gap-2 p-3 rounded-xl"
                        style={{
                          backgroundColor: `${colors.state.success}12`,
                          border: `1px solid ${colors.state.success}30`,
                        }}
                      >
                        <CheckCircle
                          weight="BoldDuotone"
                          className="w-4 h-4"
                          style={{ color: colors.state.success }}
                        />
                        <p
                          className="text-sm"
                          style={{ color: colors.state.success }}
                        >
                          {t(
                            "adminDashboard.supportTickets.payout.alreadyProcessed",
                          )}
                        </p>
                      </div>
                    ) : (
                      <Button
                        startContent={
                          <CardIcon weight="BoldDuotone" className="w-4 h-4" />
                        }
                        isDisabled={
                          !payoutTutorId || !payoutSummary?.availableBalance
                        }
                        onPress={() => {
                          setPayoutPassword("");
                          setPayoutError("");
                          setPayoutPasswordOpen(true);
                        }}
                        style={{
                          backgroundColor: colors.state.success,
                          color: "#fff",
                        }}
                      >
                        {t("adminDashboard.supportTickets.payout.processBtn")}
                      </Button>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {/* ══ REFUND APPROVAL ══ */}
            {selectedTicket.type === "Refund" && (
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
                  <CardBody className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Dollar
                        weight="BoldDuotone"
                        className="w-5 h-5"
                        style={{ color: colors.state.error }}
                      />
                      <h3
                        className="text-base font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("adminDashboard.supportTickets.refund.title")}
                      </h3>
                    </div>

                    {/* Lesson info */}
                    {refundEnrollmentId ? (
                      /* ── Course Cancellation Refund ── */
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <p
                          className="text-sm font-semibold"
                          style={{ color: colors.text.primary }}
                        >
                          {t(
                            "adminDashboard.supportTickets.courseRefund.enrollmentLabel",
                          )}
                        </p>
                        <p
                          className="text-xs mt-1 font-mono break-all"
                          style={{ color: colors.text.secondary }}
                        >
                          {refundEnrollmentId}
                        </p>
                      </div>
                    ) : refundLessonLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-2/3 rounded-lg" />
                        <Skeleton className="h-4 w-1/2 rounded-lg" />
                      </div>
                    ) : refundLesson ? (
                      <div
                        className="p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: colors.background.gray }}
                        onClick={() => setIsLessonDetailOpen(true)}
                      >
                        <div className="min-w-0">
                          <p
                            className="font-semibold text-sm truncate"
                            style={{ color: colors.text.primary }}
                          >
                            {refundLesson.courseTitle ||
                              refundLesson.sessionTitle}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: colors.text.secondary }}
                          >
                            {new Date(refundLesson.startTime).toLocaleString(
                              i18n.language === "vi" ? "vi-VN" : "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                            {refundLesson.endTime &&
                              ` \u2013 ${new Date(
                                refundLesson.endTime,
                              ).toLocaleTimeString(
                                i18n.language === "vi" ? "vi-VN" : "en-US",
                                { hour: "2-digit", minute: "2-digit" },
                              )}`}
                          </p>
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          style={{
                            backgroundColor: `${colors.state.error}15`,
                            color: colors.state.error,
                            flexShrink: 0,
                          }}
                        >
                          {t(
                            `adminDashboard.schedule.lessonStatuses.${refundLesson.status}`,
                          ) || refundLesson.status}
                        </Chip>
                      </div>
                    ) : (
                      refundLessonId === null && (
                        <p
                          className="text-sm"
                          style={{ color: colors.state.error }}
                        >
                          {t(
                            "adminDashboard.supportTickets.refund.lessonIdNotFound",
                          )}
                        </p>
                      )
                    )}

                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {refundEnrollmentId
                        ? t("adminDashboard.supportTickets.courseRefund.hint")
                        : t("adminDashboard.supportTickets.refund.hint")}
                    </p>

                    {selectedTicket.status === "Resolved" ||
                    selectedTicket.status === "Closed" ? (
                      <div
                        className="flex items-center gap-2 p-3 rounded-xl"
                        style={{
                          backgroundColor: `${colors.state.success}12`,
                          border: `1px solid ${colors.state.success}30`,
                        }}
                      >
                        <CheckCircle
                          weight="BoldDuotone"
                          className="w-4 h-4"
                          style={{ color: colors.state.success }}
                        />
                        <p
                          className="text-sm"
                          style={{ color: colors.state.success }}
                        >
                          {t(
                            "adminDashboard.supportTickets.refund.alreadyProcessed",
                          )}
                        </p>
                      </div>
                    ) : (
                      <Button
                        startContent={
                          <Dollar weight="BoldDuotone" className="w-4 h-4" />
                        }
                        isDisabled={!refundLessonId && !refundEnrollmentId}
                        onPress={() => {
                          setRefundPassword("");
                          setRefundNote("");
                          setRefundError("");
                          setRefundPasswordOpen(true);
                        }}
                        style={{
                          backgroundColor: colors.state.error,
                          color: "#fff",
                        }}
                      >
                        {t("adminDashboard.supportTickets.refund.approveBtn")}
                      </Button>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {/* Sender Info */}
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
                    className="text-base font-semibold mb-4"
                    style={{ color: colors.text.primary }}
                  >
                    {t("adminDashboard.supportTickets.detail.sentBy")}
                  </h3>
                  {senderLoading ? (
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="w-32 h-4 mb-2 rounded" />
                        <Skeleton className="w-48 h-3 rounded" />
                      </div>
                    </div>
                  ) : senderInfo ? (
                    <div
                      className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${senderInfo.role === "Tutor" ? "cursor-pointer hover:opacity-80" : ""}`}
                      style={{ backgroundColor: colors.background.gray }}
                      onClick={() => {
                        if (senderInfo.role === "Tutor") {
                          navigate(`/admin/tutors/${senderInfo.id}`);
                        }
                      }}
                    >
                      <Avatar
                        src={senderInfo.avatar}
                        name={senderInfo.name}
                        size="lg"
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold truncate"
                          style={{ color: colors.text.primary }}
                        >
                          {senderInfo.name ||
                            t(
                              "adminDashboard.supportTickets.detail.unknownUser",
                            )}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Letter
                            weight="BoldDuotone"
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: colors.text.tertiary }}
                          />
                          <span
                            className="text-sm truncate"
                            style={{ color: colors.text.tertiary }}
                          >
                            {senderInfo.email}
                          </span>
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            senderInfo.role === "Tutor"
                              ? "secondary"
                              : "primary"
                          }
                          className="mt-1.5"
                        >
                          {t(
                            `adminDashboard.supportTickets.detail.role${senderInfo.role}`,
                          )}
                        </Chip>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-sm"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("adminDashboard.supportTickets.detail.unknownUser")}
                    </p>
                  )}
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
                    {t("adminDashboard.supportTickets.detail.activity")}
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
                        {t("adminDashboard.supportTickets.detail.noMessages")}
                      </p>
                    </div>
                  )}

                  {selectedTicket.supportTicketMessages?.length > 0 && (
                    <div className="space-y-0 mb-6 max-h-[500px] overflow-y-auto">
                      {selectedTicket.supportTicketMessages
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt) - new Date(b.createdAt),
                        )
                        .map((msg, index, arr) => {
                          const isAdmin = msg.senderId === user?.userId;
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
                                  backgroundColor: isAdmin
                                    ? colors.primary.main + "18"
                                    : colors.background.gray || "#f3f4f6",
                                }}
                              >
                                {isAdmin ? (
                                  <ShieldCheck
                                    weight="BoldDuotone"
                                    className="w-5 h-5"
                                    style={{
                                      color: colors.primary.main,
                                    }}
                                  />
                                ) : (
                                  <UserCircle
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
                                      color: isAdmin
                                        ? colors.primary.main
                                        : colors.text.primary,
                                    }}
                                  >
                                    {isAdmin
                                      ? t(
                                          "adminDashboard.supportTickets.detail.you",
                                        )
                                      : t(
                                          "adminDashboard.supportTickets.detail.user",
                                        )}
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
                                    borderLeft: `3px solid ${isAdmin ? colors.primary.main : colors.border?.main || "#e5e7eb"}`,
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

                  {/* Reply section */}
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
                          {t("adminDashboard.supportTickets.detail.reply")}
                        </p>
                        <Textarea
                          value={messageText}
                          onValueChange={setMessageText}
                          placeholder={t(
                            "adminDashboard.supportTickets.detail.replyPlaceholder",
                          )}
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
                                <Plain
                                  weight="BoldDuotone"
                                  className="w-4 h-4"
                                />
                              )
                            }
                            style={{
                              backgroundColor: colors.primary.main,
                              color: colors.text.white,
                            }}
                          >
                            {t("adminDashboard.supportTickets.detail.reply")}
                          </Button>
                        </div>
                      </div>
                    )}
                </CardBody>
              </Card>
            </motion.div>
          </>
        ) : null}

        <AdminLessonDetailModal
          isOpen={isLessonDetailOpen}
          onClose={() => setIsLessonDetailOpen(false)}
          lesson={rescheduleLesson || refundLesson}
        />

        {/* Payout Password Confirmation Modal */}
        <Modal
          isOpen={payoutPasswordOpen}
          onOpenChange={(open) => {
            if (!processingPayout) {
              setPayoutPasswordOpen(open);
              if (!open) {
                setPayoutPassword("");
                setPayoutError("");
              }
            }
          }}
          size="sm"
        >
          <ModalContent style={{ backgroundColor: colors.background.light }}>
            <ModalHeader
              className="flex items-center gap-2"
              style={{ color: colors.text.primary }}
            >
              <Wallet
                weight="BoldDuotone"
                className="w-5 h-5"
                style={{ color: colors.state.success }}
              />
              {t("adminDashboard.supportTickets.payout.confirmTitle")}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-3">
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.supportTickets.payout.confirmHint")}
                </p>
                {payoutSummary?.availableBalance > 0 && (
                  <div
                    className="p-3 rounded-xl text-center"
                    style={{
                      backgroundColor: `${colors.state.success}10`,
                      border: `1px solid ${colors.state.success}25`,
                    }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.supportTickets.payout.amountToPay")}
                    </p>
                    <p
                      className="text-xl font-bold mt-1"
                      style={{ color: colors.state.success }}
                    >
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }).format(payoutSummary.availableBalance)}
                    </p>
                  </div>
                )}
                <Input
                  type="password"
                  label={t(
                    "adminDashboard.supportTickets.payout.adminPassword",
                  )}
                  placeholder={t(
                    "adminDashboard.supportTickets.payout.passwordPlaceholder",
                  )}
                  value={payoutPassword}
                  onValueChange={setPayoutPassword}
                  classNames={inputClassNames}
                />
                {payoutError && (
                  <p className="text-sm" style={{ color: colors.state.error }}>
                    {payoutError}
                  </p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                isDisabled={processingPayout}
                onPress={() => setPayoutPasswordOpen(false)}
              >
                {t("logoutModal.cancel")}
              </Button>
              <Button
                isLoading={processingPayout}
                isDisabled={!payoutPassword}
                onPress={handleApprovePayout}
                style={{ backgroundColor: colors.state.success, color: "#fff" }}
              >
                {t("adminDashboard.supportTickets.payout.confirmBtn")}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* Refund Password Confirmation Modal */}
        <Modal
          isOpen={refundPasswordOpen}
          onOpenChange={(open) => {
            if (!processingRefund) {
              setRefundPasswordOpen(open);
              if (!open) {
                setRefundPassword("");
                setRefundNote("");
                setRefundError("");
              }
            }
          }}
          size="sm"
        >
          <ModalContent style={{ backgroundColor: colors.background.light }}>
            <ModalHeader
              className="flex items-center gap-2"
              style={{ color: colors.text.primary }}
            >
              <Dollar
                weight="BoldDuotone"
                className="w-5 h-5"
                style={{ color: colors.state.error }}
              />
              {t("adminDashboard.supportTickets.refund.confirmTitle")}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-3">
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.supportTickets.refund.confirmHint")}
                </p>
                <Input
                  type="password"
                  label={t(
                    "adminDashboard.supportTickets.refund.adminPassword",
                  )}
                  placeholder={t(
                    "adminDashboard.supportTickets.refund.passwordPlaceholder",
                  )}
                  value={refundPassword}
                  onValueChange={(v) => {
                    setRefundPassword(v);
                    setRefundError("");
                  }}
                  classNames={inputClassNames}
                />
                <Textarea
                  label={t("adminDashboard.supportTickets.refund.noteLabel")}
                  placeholder={t(
                    "adminDashboard.supportTickets.refund.notePlaceholder",
                  )}
                  value={refundNote}
                  onValueChange={setRefundNote}
                  classNames={inputClassNames}
                  minRows={2}
                  maxRows={4}
                />
                {refundError && (
                  <p className="text-sm" style={{ color: colors.state.error }}>
                    {refundError}
                  </p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                isDisabled={processingRefund}
                onPress={() => setRefundPasswordOpen(false)}
              >
                {t("logoutModal.cancel")}
              </Button>
              <Button
                isLoading={processingRefund}
                isDisabled={!refundPassword}
                onPress={
                  refundEnrollmentId
                    ? handleApproveCourseRefund
                    : handleApproveRefund
                }
                style={{ backgroundColor: colors.state.error, color: "#fff" }}
              >
                {t("adminDashboard.supportTickets.refund.confirmBtn")}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    );
  }

  // LIST VIEW
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
          {t("adminDashboard.supportTickets.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("adminDashboard.supportTickets.subtitle")}
        </p>
      </motion.div>

      {/* Filters */}
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
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                value={searchTerm}
                onValueChange={setSearchTerm}
                placeholder={t(
                  "adminDashboard.supportTickets.searchPlaceholder",
                )}
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
                placeholder={t("adminDashboard.supportTickets.allStatuses")}
                className="w-full md:w-44"
                classNames={selectClassNames}
              >
                {STATUSES.map((s) => (
                  <SelectItem key={s}>
                    {t(`adminDashboard.supportTickets.statuses.${s}`)}
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
                placeholder={t("adminDashboard.supportTickets.allTypes")}
                className="w-full md:w-44"
                classNames={selectClassNames}
              >
                {TICKET_TYPES.map((tp) => (
                  <SelectItem key={tp}>
                    {t(`adminDashboard.supportTickets.types.${tp}`)}
                  </SelectItem>
                ))}
              </Select>
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
          <CardBody className="p-0 overflow-x-auto">
            <Table
              aria-label="Support tickets"
              classNames={tableClassNames}
              removeWrapper
            >
              <TableHeader>
                <TableColumn>
                  {t("adminDashboard.supportTickets.subject")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.supportTickets.type")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.supportTickets.status")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.supportTickets.createdAt")}
                </TableColumn>
                <TableColumn>
                  {t("adminDashboard.supportTickets.actions")}
                </TableColumn>
              </TableHeader>
              <TableBody
                isLoading={loading}
                loadingContent={<Spinner />}
                emptyContent={
                  <div className="py-8 text-center">
                    <p style={{ color: colors.text.tertiary }}>
                      {t("adminDashboard.supportTickets.noTickets")}
                    </p>
                  </div>
                }
              >
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <p
                          className="font-medium truncate max-w-xs"
                          style={{ color: colors.text.primary }}
                        >
                          {ticket.subject}
                        </p>
                        <p
                          className="text-xs truncate max-w-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          {ticket.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={TYPE_COLORS[ticket.type] || "default"}
                        variant="flat"
                      >
                        {t(
                          `adminDashboard.supportTickets.types.${ticket.type}`,
                        )}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={STATUS_COLORS[ticket.status] || "default"}
                        variant="flat"
                      >
                        {t(
                          `adminDashboard.supportTickets.statuses.${ticket.status}`,
                        )}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {formatDate(ticket.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={
                            <Eye weight="BoldDuotone" className="w-4 h-4" />
                          }
                          onPress={() => openDetail(ticket)}
                          style={{
                            backgroundColor: `${colors.primary.main}15`,
                            color: colors.primary.main,
                          }}
                        >
                          {t("adminDashboard.supportTickets.viewDetail")}
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={
                            <TrashBinMinimalistic
                              weight="BoldDuotone"
                              className="w-4 h-4"
                            />
                          }
                          onPress={() => {
                            setDeleteId(ticket.id);
                            setDeleteOpen(true);
                          }}
                          style={{
                            backgroundColor: `${colors.state.error}15`,
                            color: colors.state.error,
                          }}
                        >
                          {t("adminDashboard.supportTickets.deleteTicket")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

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
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        size="sm"
        style={{ backgroundColor: colors.background.light }}
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.supportTickets.deleteTicket")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.supportTickets.deleteConfirm")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("logoutModal.cancel")}
                </Button>
                <Button
                  color="danger"
                  isLoading={deleting}
                  onPress={handleDelete}
                >
                  {t("adminDashboard.supportTickets.deleteTicket")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SupportTickets;
