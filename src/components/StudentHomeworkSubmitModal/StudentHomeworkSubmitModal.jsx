import { useState, useRef, useEffect } from "react";
import {
  CloseSquare,
  CloudUpload,
  DangerTriangle,
  DocumentText,
  File,
  Gallery,
  Plain,
} from "@solar-icons/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  addToast,
} from "@heroui/react";

import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import { lessonHomeworkApi } from "../../api";
import { XIcon } from "@phosphor-icons/react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const IMAGE_RE = /\.(jpe?g|png|webp|gif|bmp|svg)$/i;
const PDF_RE = /\.pdf$/i;
const DOC_RE = /\.docx?$/i;
const ZIP_RE = /\.(zip|rar|7z|tar|gz)$/i;

const getFileBaseName = (name) => {
  if (!name) return "";
  return decodeURIComponent(name.split("?")[0].split("/").pop() || "");
};

const getFileTypeIcon = (name, className, style) => {
  const base = getFileBaseName(name || "");
  if (IMAGE_RE.test(base))
    return <Gallery weight="BoldDuotone" className={className} style={style} />;
  if (PDF_RE.test(base))
    return <File weight="BoldDuotone" className={className} style={style} />;
  if (DOC_RE.test(base))
    return (
      <DocumentText weight="BoldDuotone" className={className} style={style} />
    );
  if (ZIP_RE.test(base))
    return <File weight="BoldDuotone" className={className} style={style} />;
  return <File weight="BoldDuotone" className={className} style={style} />;
};

const formatFileSize = (bytes) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function StudentHomeworkSubmitModal({
  isOpen,
  onClose,
  hw,
  onSubmitSuccess,
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Reset state whenever the modal opens for a new homework
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setError("");
      setSubmitting(false);
      setIsDragging(false);
    }
  }, [isOpen, hw?.id]);

  const onFileSelected = (selected) => {
    if (!selected) return;
    if (selected.size > MAX_UPLOAD_BYTES) {
      setError(t("studentDashboard.homework.fileTooLarge"));
      setFile(null);
      return;
    }
    setError("");
    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError(t("studentDashboard.homework.fileRequired"));
      return;
    }
    try {
      setSubmitting(true);
      await lessonHomeworkApi.submitHomework(hw.id, file);
      addToast({
        title: t("studentDashboard.homework.submitSuccess"),
        color: "success",
        timeout: 3000,
      });
      onClose();
      onSubmitSuccess?.();
    } catch (err) {
      console.error("Failed to submit homework:", err);
      addToast({
        title: t("studentDashboard.homework.submitError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      isDismissable={!submitting}
    >
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        <ModalHeader style={{ color: colors.text.primary }}>
          {t("studentDashboard.homework.submitModalTitle")}
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {hw && (
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: colors.background.gray }}
              >
                <p
                  className="text-xs uppercase tracking-wide font-semibold mb-1"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("studentDashboard.homework.title")}
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  {hw.title}
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                onFileSelected(e.target.files?.[0]);
                e.target.value = "";
              }}
            />

            {!file ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileInputRef.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  onFileSelected(e.dataTransfer.files?.[0]);
                }}
                className="rounded-2xl p-8 text-center cursor-pointer transition-all outline-none focus-visible:ring-2"
                style={{
                  border: `2px dashed ${isDragging ? colors.primary.main : colors.border.medium}`,
                  backgroundColor: isDragging
                    ? `${colors.primary.main}10`
                    : colors.background.gray,
                }}
              >
                <CloudUpload
                  weight="BoldDuotone"
                  className="w-12 h-12 mx-auto mb-3"
                  style={{ color: colors.primary.main }}
                />
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: colors.text.primary }}
                >
                  {isDragging
                    ? t("studentDashboard.homework.dropFile")
                    : t("studentDashboard.homework.dragDropHint")}
                </p>
                {!isDragging && (
                  <p
                    className="text-sm mb-2"
                    style={{ color: colors.primary.main }}
                  >
                    {t("studentDashboard.homework.browseFile")}
                  </p>
                )}
                <p className="text-xs" style={{ color: colors.text.tertiary }}>
                  {t("studentDashboard.homework.supportedFormats")}
                </p>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ backgroundColor: `${colors.primary.main}12` }}
              >
                {file.type?.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                  />
                ) : (
                  getFileTypeIcon(file.name, "w-10 h-10 shrink-0", {
                    color: colors.primary.main,
                  })
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs uppercase tracking-wide font-semibold mb-0.5"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("studentDashboard.homework.fileSelected")}
                  </p>
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {file.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.tertiary }}
                  >
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setFile(null)}
                  isDisabled={submitting}
                  aria-label={t("studentDashboard.homework.removeFile")}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            )}

            {error && (
              <div
                className="flex items-center gap-2 p-2.5 rounded-lg text-sm"
                style={{
                  backgroundColor: `${colors.state.error}15`,
                  color: colors.state.error,
                }}
              >
                <DangerTriangle
                  weight="BoldDuotone"
                  className="w-4 h-4 shrink-0"
                />
                <span>{error}</span>
              </div>
            )}

            {hw?.submissionUrl && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{ backgroundColor: `${colors.state.warning}12` }}
              >
                <DangerTriangle
                  weight="BoldDuotone"
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: colors.state.warning }}
                />
                <p className="text-xs" style={{ color: colors.text.secondary }}>
                  {t("studentDashboard.homework.resubmit")}
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={submitting}>
            {t("studentDashboard.homework.cancel")}
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={submitting}
            isDisabled={!file}
            startContent={
              !submitting && <Plain weight="BoldDuotone" className="w-4 h-4" />
            }
            style={{
              backgroundColor: colors.primary.main,
              color: colors.text.white,
            }}
          >
            {submitting
              ? t("studentDashboard.homework.submitting")
              : t("studentDashboard.homework.submitBtn")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
