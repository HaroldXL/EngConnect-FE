import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, DollarMinimalistic, InfoCircle, Pen } from "@solar-icons/react"
import {
  Card,
  CardBody,
  Button,
  Input,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";

import { paymentApi } from "../../../api";

const Commission = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames } = useInputStyles();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const [editName, setEditName] = useState("");
  const [editPercent, setEditPercent] = useState("");
  const [editApplyFrom, setEditApplyFrom] = useState("");

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  const queryClient = useQueryClient();

  const { data: config, isLoading: loading } = useQuery({
    queryKey: ["admin-commission"],
    queryFn: () =>
      paymentApi.getCommissionConfigs().then((r) => r?.data?.items?.[0] || null),
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => paymentApi.updateCommissionConfig(id, data),
    onSuccess: () => {
      addToast({ title: t("adminDashboard.commission.saveSuccess"), color: "success" });
      onEditClose();
      queryClient.invalidateQueries({ queryKey: ["admin-commission"] });
    },
    onError: () => {
      addToast({ title: t("adminDashboard.commission.saveFailed"), color: "danger" });
    },
  });

  const openEdit = () => {
    if (!config) return;
    setEditName(config.name || "");
    setEditPercent(String(config.commissionPercent ?? ""));
    // Convert ISO to datetime-local format (YYYY-MM-DDTHH:mm)
    const dt = config.applyFrom ? new Date(config.applyFrom) : new Date();
    const pad = (n) => String(n).padStart(2, "0");
    setEditApplyFrom(
      `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
    );
    onEditOpen();
  };

  const handleSave = () => {
    if (!config?.id) return;
    const percent = parseFloat(editPercent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      addToast({ title: t("adminDashboard.commission.invalidPercent"), color: "warning" });
      return;
    }
    updateMutation.mutate({
      id: config.id,
      data: {
        name: editName.trim() || config.name,
        commissionPercent: percent,
        applyFrom: new Date(editApplyFrom).toISOString(),
      },
    });
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(dateLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1
            className="text-2xl lg:text-3xl font-bold mb-1"
            style={{ color: colors.text.primary }}
          >
            {t("adminDashboard.commission.title")}
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: colors.text.secondary }}
          >
            {t("adminDashboard.commission.subtitle")}
          </p>
        </div>
        {config && (
          <Button
            startContent={<Pen weight="BoldDuotone" className="w-4 h-4" />}
            style={{ backgroundColor: colors.primary.main, color: "#fff" }}
            onPress={openEdit}
          >
            {t("adminDashboard.commission.edit")}
          </Button>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : !config ? (
        <div className="flex justify-center py-16">
          <p className="text-sm" style={{ color: colors.text.tertiary }}>
            {t("adminDashboard.commission.noConfig")}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Big commission rate card */}
          <Card
            shadow="none"
            className="md:col-span-2 p-2 border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="flex flex-row items-center gap-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${colors.primary.main}15` }}
              >
                <DollarMinimalistic
                  weight="BoldDuotone"
                  className="w-10 h-10"
                  style={{ color: colors.primary.main }}
                />
              </div>
              <div className="space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  {t("adminDashboard.commission.currentRate")}
                </p>
                <p
                  className="text-5xl font-bold"
                  style={{ color: colors.primary.main }}
                >
                  {config.commissionPercent}%
                </p>
                <p className="text-xs" style={{ color: colors.text.tertiary }}>
                  {config.name}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Apply From */}
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="flex flex-row items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${colors.state.success}15` }}
              >
                <Calendar
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.state.success }}
                />
              </div>
              <div>
                <p
                  className="text-xs font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  {t("adminDashboard.commission.applyFrom")}
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  {formatDate(config.applyFrom)}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Apply To */}
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="flex flex-row items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${colors.state.warning}15` }}
              >
                <InfoCircle
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.state.warning }}
                />
              </div>
              <div>
                <p
                  className="text-xs font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  {t("adminDashboard.commission.applyTo")}
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  {config.applyTo
                    ? formatDate(config.applyTo)
                    : t("adminDashboard.commission.noExpiry")}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* InfoCircle box */}
          <Card
            shadow="none"
            className="md:col-span-2 border-none"
            style={{ backgroundColor: `${colors.primary.main}10` }}
          >
            <CardBody>
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: colors.primary.main }}
              >
                {t("adminDashboard.commission.howItWorksTitle")}
              </p>
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                {t("adminDashboard.commission.howItWorksDesc", {
                  percent: config.commissionPercent,
                })}
              </p>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onOpenChange={(open) => !open && onEditClose()}
        size="md"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {() => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.commission.editTitle")}
              </ModalHeader>
              <ModalBody className="space-y-4 pb-2">
                <Input
                  label={t("adminDashboard.commission.fieldName")}
                  value={editName}
                  onValueChange={setEditName}
                  classNames={inputClassNames}
                />
                <Input
                  label={t("adminDashboard.commission.fieldPercent")}
                  value={editPercent}
                  onValueChange={setEditPercent}
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  endContent={
                    <span
                      className="text-sm"
                      style={{ color: colors.text.tertiary }}
                    >
                      %
                    </span>
                  }
                  classNames={inputClassNames}
                />
                <Input
                  label={t("adminDashboard.commission.fieldApplyFrom")}
                  value={editApplyFrom}
                  onValueChange={setEditApplyFrom}
                  type="datetime-local"
                  classNames={inputClassNames}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onEditClose} disabled={updateMutation.isPending}>
                  {t("adminDashboard.commission.cancel")}
                </Button>
                <Button
                  isLoading={updateMutation.isPending}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: "#fff",
                  }}
                  onPress={handleSave}
                >
                  {t("adminDashboard.commission.save")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Commission;
