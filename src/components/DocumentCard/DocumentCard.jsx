import { Card, CardBody, Button, Chip } from "@heroui/react";
import { DocumentText, Magnifer, PlayCircle, TrashBinMinimalistic } from "@solar-icons/react"
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";

const DOC_TYPE_COLOR = {
  Degree: "primary",
  Certificate: "success",
  License: "warning",
  Other: "default",
};

const FILE_ICON_COLOR = {
  pdf: "#EF4444",
  doc: "#3B82F6",
  video: "#8B5CF6",
  file: "#6B7280",
};

const FILE_EXT_LABEL = { pdf: "PDF", doc: "DOCX", video: "VIDEO", file: "FILE" };

const getFileType = (url) => {
  if (!url) return "file";
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "avif"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  return "file";
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "");

const DocumentCard = ({
  doc,
  onDelete,
  onViewImage,
  cardBgColor,
}) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const fileType = getFileType(doc.url);

  const handlePreviewClick = () => {
    if (!doc.url) return;
    if (fileType === "image") onViewImage?.(doc.url);
    else window.open(doc.url, "_blank");
  };

  return (
    <Card
      shadow="none"
      className="overflow-hidden h-full"
      style={{ backgroundColor: cardBgColor ?? colors.background.light }}
    >
      {/* Content on top */}
      <CardBody className="p-4 pb-2 flex flex-col gap-1">
        {/* Row: chip + name + delete */}
        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            color={DOC_TYPE_COLOR[doc.docType] || "default"}
            className="shrink-0"
          >
            {t(`tutorDashboard.profile.documents.types.${doc.docType}`, {
              defaultValue: doc.docType,
            })}
          </Chip>
          <p
            className="font-semibold text-sm flex-1 truncate"
            style={{ color: colors.text.primary }}
          >
            {doc.name}
          </p>
          {onDelete && (
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={() => onDelete(doc)}
              className="shrink-0"
              style={{
                backgroundColor: `${colors.state.error}15`,
                color: colors.state.error,
              }}
            >
              <TrashBinMinimalistic weight="BoldDuotone" className="w-4 h-4" />
            </Button>
          )}
        </div>

        {doc.issuedBy && (
          <p className="text-xs" style={{ color: colors.text.secondary }}>
            {doc.issuedBy}
          </p>
        )}
        {(doc.issuedAt || doc.expiredAt) && (
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            {fmtDate(doc.issuedAt)}
            {doc.issuedAt && doc.expiredAt ? " – " : ""}
            {fmtDate(doc.expiredAt)}
          </p>
        )}
      </CardBody>

      {/* Preview at bottom with padding — like CourseCard */}
      <div className="relative p-3 pt-1">
        {fileType === "image" ? (
          <div
            className="w-full h-36 overflow-hidden rounded-xl cursor-pointer relative group"
            onClick={handlePreviewClick}
          >
            <img
              src={doc.url}
              alt={doc.name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center rounded-xl">
              <Magnifer
                weight="BoldDuotone"
                size={26}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              />
            </div>
          </div>
        ) : fileType === "video" ? (
          <div
            className="w-full h-36 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group"
            style={{ backgroundColor: isDark ? "#0f172a" : "#1e293b" }}
            onClick={handlePreviewClick}
          >
            <PlayCircle
              weight="BoldDuotone"
              size={42}
              className="transition-transform duration-200 group-hover:scale-110"
              style={{ color: FILE_ICON_COLOR.video }}
            />
            <span
              className="text-xs font-bold tracking-widest"
              style={{ color: FILE_ICON_COLOR.video }}
            >
              {FILE_EXT_LABEL.video}
            </span>
          </div>
        ) : (
          <div
            className="w-full h-36 rounded-xl flex flex-col items-center justify-center gap-2 group"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              cursor: doc.url ? "pointer" : "default",
            }}
            onClick={handlePreviewClick}
          >
            <DocumentText
              weight="BoldDuotone"
              size={42}
              className="transition-transform duration-200 group-hover:scale-110"
              style={{
                color: FILE_ICON_COLOR[fileType] || FILE_ICON_COLOR.file,
              }}
            />
            <span
              className="text-xs font-bold tracking-widest"
              style={{
                color: FILE_ICON_COLOR[fileType] || FILE_ICON_COLOR.file,
              }}
            >
              {FILE_EXT_LABEL[fileType] || "FILE"}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DocumentCard;
