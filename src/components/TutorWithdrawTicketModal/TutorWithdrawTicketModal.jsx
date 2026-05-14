import { useState } from "react";
import { Card as CardIcon, DangerTriangle, Ticket, Wallet } from "@solar-icons/react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import { supportApi } from "../../api";

const formatVND = (amount) => {
  if (amount == null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function TutorWithdrawTicketModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  tutorId,
  availableBalance,
  bankCode,
  bankAccountNumber,
  bankAccountName,
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setReason("");
    setError(null);
    onClose();
  };

  const hasBank = bankCode && bankAccountNumber && bankAccountName;
  const canSubmit = hasBank && availableBalance > 0;

  const autoSubject = `${t("tutorDashboard.earnings.withdrawSubjectPrefix")}: ${formatVND(availableBalance)}`;

  const buildDescription = () => {
    const lines = [
      `[TutorId]: ${tutorId}`,
      `${t("tutorDashboard.earnings.fieldAmount")}: ${formatVND(availableBalance)}`,
      `${t("tutorDashboard.earnings.fieldBank")}: ${bankCode || "-"} - ${bankAccountNumber || "-"} (${bankAccountName || "-"})`,
    ];
    if (reason.trim()) {
      lines.push("");
      lines.push(`${t("tutorDashboard.earnings.fieldNote")}: ${reason.trim()}`);
    }
    return lines.join("\n");
  };

  const handleSubmit = async () => {
    if (!userId || !tutorId) return;
    setError(null);
    setSubmitting(true);
    try {
      await supportApi.createTicket({
        createdBy: userId,
        subject: autoSubject,
        description: buildDescription(),
        type: "Payout",
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || err?.response?.data?.message;
      setError(msg || t("tutorDashboard.earnings.withdrawError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" scrollBehavior="inside">
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        <ModalHeader
          className="flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          <Ticket
            weight="BoldDuotone"
            className="w-5 h-5"
            style={{ color: colors.primary.main }}
          />
          {t("tutorDashboard.earnings.withdrawTicketTitle")}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Balance card */}
            <div
              className="p-4 rounded-xl text-center"
              style={{
                backgroundColor: `${colors.primary.main}10`,
                border: `1px solid ${colors.primary.main}25`,
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Wallet
                  weight="BoldDuotone"
                  className="w-4 h-4"
                  style={{ color: colors.primary.main }}
                />
                <p
                  className="text-xs font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  {t("tutorDashboard.earnings.availableBalance")}
                </p>
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: colors.primary.main }}
              >
                {formatVND(availableBalance)}
              </p>
            </div>

            {/* Card info */}
            {hasBank ? (
              <div
                className="p-3 rounded-xl flex items-center gap-3"
                style={{ backgroundColor: colors.background.gray }}
              >
                <CardIcon weight="BoldDuotone"
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: colors.text.secondary }}
                />
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {bankAccountName}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: colors.text.secondary }}
                  >
                    {bankCode} • {bankAccountNumber}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: `${colors.state.warning}12`,
                  border: `1px solid ${colors.state.warning}30`,
                  color: colors.state.warning,
                }}
              >
                <DangerTriangle weight="BoldDuotone" className="w-4 h-4 flex-shrink-0" />
                {t("tutorDashboard.earnings.noBankInfo")}
              </div>
            )}

            {/* Hint */}
            <p className="text-xs" style={{ color: colors.text.tertiary }}>
              {t("tutorDashboard.earnings.withdrawHint")}
            </p>

            {/* Note textarea */}
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: colors.text.secondary }}
              >
                {t("tutorDashboard.earnings.noteLabel")}
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("tutorDashboard.earnings.notePlaceholder")}
                className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
                style={{
                  backgroundColor: colors.background.gray,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border.medium}`,
                }}
              />
            </div>

            {/* Description preview */}
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: colors.text.secondary }}
              >
                {t("tutorDashboard.earnings.previewLabel")}
              </p>
              <pre
                className="px-3 py-2 rounded-xl text-xs whitespace-pre-wrap font-sans"
                style={{
                  backgroundColor: colors.background.gray,
                  color: colors.text.tertiary,
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                {buildDescription()}
              </pre>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="flex-col items-stretch gap-2">
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg text-sm w-full"
              style={{
                backgroundColor: `${colors.state.error}15`,
                color: colors.state.error,
                border: `1px solid ${colors.state.error}30`,
              }}
            >
              <DangerTriangle weight="BoldDuotone" className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="light" onPress={handleClose}>
              {t("tutorDashboard.earnings.cancel")}
            </Button>
            <Button
              isLoading={submitting}
              onPress={handleSubmit}
              isDisabled={!canSubmit}
              style={{
                backgroundColor: canSubmit
                  ? colors.primary.main
                  : colors.background.gray,
                color: canSubmit ? colors.text.white : colors.text.tertiary,
              }}
            >
              {t("tutorDashboard.earnings.sendRequest")}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
