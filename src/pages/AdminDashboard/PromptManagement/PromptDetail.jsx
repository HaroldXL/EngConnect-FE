import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  AltArrowLeft,
  ChatSquareCode,
  CalendarMark,
  CheckCircle,
  ClipboardText,
  Eye,
  ForbiddenCircle,
  Star,
} from "@solar-icons/react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
  useDisclosure,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { adminApi } from "../../../api";
import { useThemeColors } from "../../../hooks/useThemeColors";

const PromptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();

  const p = (key) => t(`adminDashboard.promptManagement.${key}`);

  const [selectedVersion, setSelectedVersion] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch definition
  const { data: definition, isLoading: loadingDef } = useQuery({
    queryKey: ["admin-prompt-definition", id],
    queryFn: () => adminApi.getPromptDefinitionById(id).then((r) => r.data),
    enabled: !!id,
  });

  // Fetch versions for this definition
  const { data: versionsData, isLoading: loadingVersions } = useQuery({
    queryKey: ["admin-prompt-versions", id],
    queryFn: () =>
      adminApi
        .getPromptVersions({ PromptDefinitionId: id, "page-size": 50 })
        .then((r) => r.data),
    enabled: !!id,
  });
  const versions = versionsData?.items ?? [];

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString(
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

  const handleViewTemplate = (version) => {
    setSelectedVersion(version);
    onOpen();
  };

  const parsePlaceholders = (json) => {
    try {
      return JSON.parse(json) ?? [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-3"
      >
        <Button
          variant="flat"
          size="sm"
          isIconOnly
          onPress={() => navigate("/admin/ai-prompts")}
        >
          <AltArrowLeft weight="BoldDuotone" className="w-5 h-5" />
        </Button>
        <div>
          {loadingDef ? (
            <Skeleton className="h-8 w-48 rounded-lg" />
          ) : (
            <h1
              className="text-2xl lg:text-3xl font-bold font-mono"
              style={{ color: colors.text.primary }}
            >
              {definition?.code ?? "—"}
            </h1>
          )}
          <p
            className="text-sm mt-0.5"
            style={{ color: colors.text.secondary }}
          >
            {p("detail.subtitle")}
          </p>
        </div>
      </motion.div>

      {/* Definition Info Card */}
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
          <CardBody className="p-5">
            {loadingDef ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
                <Skeleton className="h-4 w-1/3 rounded-lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: colors.background.primaryLight }}
                  >
                    <ChatSquareCode
                      weight="BoldDuotone"
                      className="w-5 h-5"
                      style={{ color: colors.primary.main }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-xs mb-0.5"
                      style={{ color: colors.text.secondary }}
                    >
                      {p("detail.feature")}
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {definition?.feature ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: definition?.isActive
                        ? `${colors.state.success}20`
                        : `${colors.state.error}20`,
                    }}
                  >
                    {definition?.isActive ? (
                      <CheckCircle
                        weight="BoldDuotone"
                        className="w-5 h-5"
                        style={{ color: colors.state.success }}
                      />
                    ) : (
                      <ForbiddenCircle
                        weight="BoldDuotone"
                        className="w-5 h-5"
                        style={{ color: colors.state.error }}
                      />
                    )}
                  </div>
                  <div>
                    <p
                      className="text-xs mb-0.5"
                      style={{ color: colors.text.secondary }}
                    >
                      {p("detail.status")}
                    </p>
                    <Chip
                      size="sm"
                      color={definition?.isActive ? "success" : "danger"}
                      variant="flat"
                    >
                      {definition?.isActive ? p("stats.active") : p("stats.inactive")}
                    </Chip>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${colors.text.secondary}15` }}
                  >
                    <CalendarMark
                      weight="BoldDuotone"
                      className="w-5 h-5"
                      style={{ color: colors.text.secondary }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-xs mb-0.5"
                      style={{ color: colors.text.secondary }}
                    >
                      {p("detail.createdAt")}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.primary }}
                    >
                      {formatDate(definition?.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${colors.text.secondary}15` }}
                  >
                    <CalendarMark
                      weight="BoldDuotone"
                      className="w-5 h-5"
                      style={{ color: colors.text.secondary }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-xs mb-0.5"
                      style={{ color: colors.text.secondary }}
                    >
                      {p("detail.updatedAt")}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.primary }}
                    >
                      {formatDate(definition?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Versions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: colors.text.primary }}
        >
          {p("detail.versions")} ({loadingVersions ? "..." : versions.length})
        </h2>

        {loadingVersions ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card
                key={i}
                shadow="none"
                className="border-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-5 space-y-3">
                  <Skeleton className="h-5 w-1/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : versions.length === 0 ? (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-8 flex items-center justify-center">
              <p style={{ color: colors.text.secondary }}>
                {p("detail.noVersions")}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => {
              const placeholders = parsePlaceholders(version.placeholdersJson);
              return (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card
                    shadow="none"
                    className="border-none"
                    style={{ backgroundColor: colors.background.light }}
                  >
                    <CardBody className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Left info */}
                        <div className="flex-1 space-y-3">
                          {/* Version number + badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-base font-bold"
                              style={{ color: colors.text.primary }}
                            >
                              {p("detail.version")} {version.versionNumber}
                            </span>
                            {version.isDefault && (
                              <Chip
                                size="sm"
                                color="warning"
                                variant="flat"
                                startContent={<Star className="w-3 h-3" />}
                              >
                                {p("detail.default")}
                              </Chip>
                            )}
                            {version.isPublished ? (
                              <Chip size="sm" color="success" variant="flat">
                                {p("detail.published")}
                              </Chip>
                            ) : (
                              <Chip size="sm" color="default" variant="flat">
                                {p("detail.draft")}
                              </Chip>
                            )}
                          </div>

                          {/* Metadata row */}
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                            <span style={{ color: colors.text.secondary }}>
                              {p("detail.priority")}:{" "}
                              <span style={{ color: colors.text.primary }}>
                                {version.priority}
                              </span>
                            </span>
                            {version.isPublished && version.publishedAt && (
                              <span style={{ color: colors.text.secondary }}>
                                {p("detail.publishedAt")}:{" "}
                                <span style={{ color: colors.text.primary }}>
                                  {formatDate(version.publishedAt)}
                                </span>
                              </span>
                            )}
                            <span style={{ color: colors.text.secondary }}>
                              {p("detail.created")}:{" "}
                              <span style={{ color: colors.text.primary }}>
                                {formatDate(version.createdAt)}
                              </span>
                            </span>
                          </div>

                          {/* Placeholders */}
                          {placeholders.length > 0 && (
                            <div className="flex items-start gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <ClipboardText
                                  weight="BoldDuotone"
                                  className="w-4 h-4 shrink-0"
                                  style={{ color: colors.text.secondary }}
                                />
                                <span
                                  className="text-xs"
                                  style={{ color: colors.text.secondary }}
                                >
                                  {p("detail.placeholders")}:
                                </span>
                              </div>
                              {placeholders.map((p) => (
                                <span
                                  key={p}
                                  className="text-xs font-mono px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${colors.primary.main}15`,
                                    color: colors.primary.main,
                                  }}
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Template preview */}
                          <p
                            className="text-xs line-clamp-2 font-mono leading-relaxed"
                            style={{ color: colors.text.secondary }}
                          >
                            {version.templateBody}
                          </p>
                        </div>

                        {/* Action */}
                        <Button
                          variant="flat"
                          size="sm"
                          startContent={
                            <Eye weight="BoldDuotone" className="w-4 h-4" />
                          }
                          onPress={() => handleViewTemplate(version)}
                          className="shrink-0"
                        >
                          {p("detail.viewTemplate")}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Template Body Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span style={{ color: colors.text.primary }}>
              {p("detail.templateTitle")} — {p("detail.version")} {selectedVersion?.versionNumber}
            </span>
            <div className="flex gap-2 flex-wrap">
              <span
                className="text-sm font-mono font-normal px-2 py-0.5 rounded"
                style={{
                  backgroundColor: colors.background.primaryLight,
                  color: colors.primary.main,
                }}
              >
                {selectedVersion?.promptDefinitionCode}
              </span>
              {selectedVersion?.isDefault && (
                <Chip size="sm" color="warning" variant="flat">
                  Default
                </Chip>
              )}
              {selectedVersion?.isPublished ? (
                <Chip size="sm" color="success" variant="flat">
                  Published
                </Chip>
              ) : (
                <Chip size="sm" color="default" variant="flat">
                  Draft
                </Chip>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            <div
              className="overflow-auto rounded-lg p-4 max-h-[60vh]"
              style={{ backgroundColor: colors.background.gray }}
            >
              <pre
                className="text-xs leading-relaxed whitespace-pre-wrap break-words font-mono m-0"
                style={{ color: colors.text.primary }}
              >
                {selectedVersion?.templateBody ?? ""}
              </pre>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              {p("detail.close")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PromptDetail;
