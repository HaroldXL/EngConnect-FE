import { useState, useEffect } from "react";
import {
  AltArrowLeft,
  ClipboardAdd,
  CloseCircle,
  Document,
  DocumentText,
  Eye,
  Gallery,
  LinkMinimalistic,
  PlayCircle,
  RadioMinimalistic,
  UploadMinimalistic,
} from "@solar-icons/react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Spinner,
  addToast,
} from "@heroui/react";

import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { lessonHomeworkApi } from "../../../api";

const HOMEWORK_TYPES = ["Reading", "Writing", "Listening", "Other"];
const WRITING_SUB_TYPES = [
  "WritingGeneral",
  "IeltsTask1",
  "IeltsTask2",
  "EmailFormal",
];

const EditHomework = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { id } = useParams();
  const { inputClassNames, textareaClassNames, selectClassNames } =
    useInputStyles();

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [writingSubType, setWritingSubType] = useState("");
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [dueAt, setDueAt] = useState("");

  const [resourceMode, setResourceMode] = useState("file");
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceUrl, setResourceUrl] = useState("");

  const [mediaMode, setMediaMode] = useState("file");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");

  // ─── Load existing homework ─────────────────────────────────────
  useEffect(() => {
    const loadHomework = async () => {
      try {
        setPageLoading(true);
        const res = await lessonHomeworkApi.getHomeworkById(id);
        const hw = res?.data;
        if (!hw) {
          navigate("/tutor/homework");
          return;
        }
        setTitle(hw.title || "");
        setType(hw.type || "");
        setWritingSubType(hw.writingSubType || "");
        setDescription(hw.description || "");
        setMaxScore(String(hw.maxScore ?? ""));
        setDueAt(hw.dueAt ? new Date(hw.dueAt).toISOString().slice(0, 16) : "");
        setResourceMode(hw.resourceUrl ? "url" : "file");
        setResourceUrl(hw.resourceUrl || "");
        setMediaMode(hw.mediaUrl ? "url" : "file");
        setMediaUrl(hw.mediaUrl || "");
      } catch (err) {
        console.error("Failed to load homework:", err);
        navigate("/tutor/homework");
      } finally {
        setPageLoading(false);
      }
    };
    loadHomework();
  }, [id, navigate]);

  // ─── Handlers ───────────────────────────────────────────────────
  const handleTypeChange = (newType) => {
    setType(newType);
    setErrors((p) => ({
      ...p,
      type: undefined,
      writingSubType: undefined,
      media: undefined,
    }));
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = t("tutorDashboard.homework.titleRequired");
    if (!type) e.type = t("tutorDashboard.homework.typeRequired");
    if (type === "Writing" && !writingSubType)
      e.writingSubType = t("tutorDashboard.homework.writingSubTypeRequired");
    if (!description.trim())
      e.description = t("tutorDashboard.homework.descriptionRequired");
    if (!maxScore || Number(maxScore) <= 0)
      e.maxScore = t("tutorDashboard.homework.maxScoreRequired");
    if (resourceMode === "url" && !resourceUrl.trim())
      e.resource = t("tutorDashboard.homework.resourceUrlRequired");
    if (type === "Listening" && mediaMode === "url" && !mediaUrl.trim())
      e.media = t("tutorDashboard.homework.mediaUrlRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await lessonHomeworkApi.updateHomework(id, {
        id,
        title: title.trim(),
        type,
        clearWritingSubType: type !== "Writing",
        writingSubType: type === "Writing" ? writingSubType : undefined,
        description: description.trim(),
        maxScore: Number(maxScore),
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        resourceUrl: resourceMode === "url" ? resourceUrl.trim() : undefined,
        resourceFile: resourceMode === "file" ? resourceFile : undefined,
        clearMedia: type !== "Listening",
        mediaUrl:
          type === "Listening" && mediaMode === "url"
            ? mediaUrl.trim()
            : undefined,
        mediaFile:
          type === "Listening" && mediaMode === "file" ? mediaFile : undefined,
      });
      addToast({
        title: t("tutorDashboard.homework.updateSuccess"),
        color: "success",
        timeout: 3000,
      });
      navigate("/tutor/homework");
    } catch (err) {
      console.error("Failed to update homework:", err);
      addToast({
        title: t("tutorDashboard.homework.updateError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────
  const typeLabel = (val) =>
    t(
      `tutorDashboard.homework.type.${val.charAt(0).toLowerCase() + val.slice(1)}`,
    );
  const writingSubLabel = (val) =>
    t(
      `tutorDashboard.homework.writingSubType.${val.charAt(0).toLowerCase() + val.slice(1)}`,
    );

  const sectionCard = (children) => (
    <Card
      shadow="none"
      className="border-none"
      style={{ backgroundColor: colors.background.light }}
    >
      <CardBody className="p-5">{children}</CardBody>
    </Card>
  );

  const sectionTitle = (icon, text) => (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${colors.primary.main}15` }}
      >
        {icon}
      </div>
      <h2
        className="text-base font-semibold"
        style={{ color: colors.text.primary }}
      >
        {text}
      </h2>
    </div>
  );

  const fileUpload = (file, setFile, accept, errKey) => (
    <div
      className="rounded-xl p-4 border-2 border-dashed transition-colors"
      style={{
        borderColor: errors[errKey] ? colors.state.error : colors.border.medium,
        backgroundColor: colors.background.gray,
      }}
    >
      {file ? (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${colors.primary.main}15` }}
          >
            <Document
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.primary.main }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: colors.text.primary }}
            >
              {file.name}
            </p>
            <p className="text-xs" style={{ color: colors.text.tertiary }}>
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => {
              const url = URL.createObjectURL(file);
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <Eye
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.primary.main }}
            />
          </Button>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setFile(null)}
          >
            <CloseCircle
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.state.error }}
            />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 cursor-pointer py-2">
          <UploadMinimalistic
            weight="BoldDuotone"
            className="w-8 h-8"
            style={{ color: colors.text.tertiary }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: colors.text.secondary }}
          >
            {t("tutorDashboard.homework.clickToUpload")}
          </span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
        </label>
      )}
    </div>
  );

  // ─── Loading state ──────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      <Button
        variant="light"
        startContent={<AltArrowLeft weight="BoldDuotone" size={18} />}
        onPress={() => navigate("/tutor/homework")}
        style={{ color: colors.text.secondary }}
        className="self-start"
      >
        {t("common.back")}
      </Button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <h1
          className="text-2xl font-bold"
          style={{ color: colors.text.primary }}
        >
          {t("tutorDashboard.homework.editPageTitle", {
            defaultValue: "Edit Homework",
          })}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("tutorDashboard.homework.editPageSubtitle", {
            defaultValue:
              "Update homework details before assigning to students.",
          })}
        </p>
      </motion.div>

      {/* Details */}
      {sectionCard(
        <>
          {sectionTitle(
            <ClipboardAdd
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.primary.main }}
            />,
            t("tutorDashboard.homework.detailsSection"),
          )}

          <div className="space-y-4">
            <Input
              label={t("tutorDashboard.homework.titleLabel")}
              labelPlacement="outside"
              placeholder={t("tutorDashboard.homework.titlePlaceholder")}
              value={title}
              onValueChange={(v) => {
                setTitle(v);
                if (errors.title)
                  setErrors((p) => ({ ...p, title: undefined }));
              }}
              isInvalid={!!errors.title}
              errorMessage={errors.title}
              classNames={inputClassNames}
            />

            <div>
              <p
                className="text-sm font-medium mb-2"
                style={{ color: colors.text.secondary }}
              >
                {t("tutorDashboard.homework.typeLabel")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {HOMEWORK_TYPES.map((tp) => {
                  const isSelected = type === tp;
                  return (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => handleTypeChange(tp)}
                      className="px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? `${colors.primary.main}18`
                          : colors.background.gray,
                        border: isSelected
                          ? `1px solid ${colors.primary.main}40`
                          : `1px solid transparent`,
                        color: isSelected
                          ? colors.primary.main
                          : colors.text.primary,
                      }}
                    >
                      {typeLabel(tp)}
                    </button>
                  );
                })}
              </div>
              {errors.type && (
                <p
                  className="text-xs mt-1.5"
                  style={{ color: colors.state.error }}
                >
                  {errors.type}
                </p>
              )}

              {type === "Writing" && (
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: colors.border.light }}
                >
                  <Select
                    label={t("tutorDashboard.homework.writingSubTypeLabel")}
                    labelPlacement="outside"
                    placeholder={t(
                      "tutorDashboard.homework.writingSubTypePlaceholder",
                    )}
                    selectedKeys={writingSubType ? [writingSubType] : []}
                    onSelectionChange={(keys) => {
                      setWritingSubType(Array.from(keys)[0] || "");
                      if (errors.writingSubType)
                        setErrors((p) => ({
                          ...p,
                          writingSubType: undefined,
                        }));
                    }}
                    isInvalid={!!errors.writingSubType}
                    errorMessage={errors.writingSubType}
                    classNames={selectClassNames}
                  >
                    {WRITING_SUB_TYPES.map((s) => (
                      <SelectItem key={s} textValue={writingSubLabel(s)}>
                        {writingSubLabel(s)}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <Textarea
              label={t("tutorDashboard.homework.descriptionLabel")}
              labelPlacement="outside"
              placeholder={t("tutorDashboard.homework.descriptionPlaceholder")}
              value={description}
              onValueChange={(v) => {
                setDescription(v);
                if (errors.description)
                  setErrors((p) => ({ ...p, description: undefined }));
              }}
              minRows={4}
              isInvalid={!!errors.description}
              errorMessage={errors.description}
              classNames={textareaClassNames}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label={t("tutorDashboard.homework.maxScoreLabel")}
                labelPlacement="outside"
                placeholder={t("tutorDashboard.homework.maxScorePlaceholder")}
                value={maxScore}
                onValueChange={(v) => {
                  setMaxScore(v);
                  if (errors.maxScore)
                    setErrors((p) => ({ ...p, maxScore: undefined }));
                }}
                isInvalid={!!errors.maxScore}
                errorMessage={errors.maxScore}
                min={1}
                classNames={inputClassNames}
              />
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  {t("tutorDashboard.homework.dueAtLabel")}
                </span>
                <input
                  type="datetime-local"
                  className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: colors.background.input,
                    color: colors.text.primary,
                  }}
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
                <span
                  className="text-xs"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("tutorDashboard.homework.dueAtHint")}
                </span>
              </div>
            </div>
          </div>
        </>,
      )}

      {/* Resource */}
      {sectionCard(
        <>
          {sectionTitle(
            <DocumentText
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.primary.main }}
            />,
            t("tutorDashboard.homework.resourceSection"),
          )}

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setResourceMode("file")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  resourceMode === "file"
                    ? `${colors.primary.main}18`
                    : colors.background.gray,
                color:
                  resourceMode === "file"
                    ? colors.primary.main
                    : colors.text.primary,
              }}
            >
              <Gallery weight="BoldDuotone" className="w-4 h-4" />
              {t("tutorDashboard.homework.uploadFile")}
            </button>
            <button
              type="button"
              onClick={() => setResourceMode("url")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  resourceMode === "url"
                    ? `${colors.primary.main}18`
                    : colors.background.gray,
                color:
                  resourceMode === "url"
                    ? colors.primary.main
                    : colors.text.primary,
              }}
            >
              <LinkMinimalistic weight="BoldDuotone" className="w-4 h-4" />
              {t("tutorDashboard.homework.pasteUrl")}
            </button>
          </div>

          {resourceMode === "file" ? (
            fileUpload(
              resourceFile,
              (f) => {
                setResourceFile(f);
                if (errors.resource)
                  setErrors((p) => ({ ...p, resource: undefined }));
              },
              ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif",
              "resource",
            )
          ) : (
            <Input
              placeholder={t("tutorDashboard.homework.resourceUrlPlaceholder")}
              value={resourceUrl}
              onValueChange={(v) => {
                setResourceUrl(v);
                if (errors.resource)
                  setErrors((p) => ({ ...p, resource: undefined }));
              }}
              startContent={
                <LinkMinimalistic
                  weight="BoldDuotone"
                  className="w-4 h-4"
                  style={{ color: colors.text.tertiary }}
                />
              }
              endContent={
                resourceUrl.trim() ? (
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        resourceUrl.trim(),
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: `${colors.primary.main}15`,
                      color: colors.primary.main,
                    }}
                  >
                    <Eye weight="BoldDuotone" className="w-3.5 h-3.5" />
                    {t("tutorDashboard.homework.viewUrl")}
                  </button>
                ) : null
              }
              classNames={inputClassNames}
            />
          )}
          {errors.resource && (
            <p className="text-xs mt-1.5" style={{ color: colors.state.error }}>
              {errors.resource}
            </p>
          )}
        </>,
      )}

      {/* Media (Listening only) */}
      {type === "Listening" &&
        sectionCard(
          <>
            {sectionTitle(
              <RadioMinimalistic
                weight="BoldDuotone"
                className="w-5 h-5"
                style={{ color: colors.primary.main }}
              />,
              t("tutorDashboard.homework.mediaSection"),
            )}

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMediaMode("file")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    mediaMode === "file"
                      ? `${colors.primary.main}18`
                      : colors.background.gray,
                  color:
                    mediaMode === "file"
                      ? colors.primary.main
                      : colors.text.primary,
                }}
              >
                <PlayCircle weight="LineDuotone" className="w-4 h-4" />
                {t("tutorDashboard.homework.uploadFile")}
              </button>
              <button
                type="button"
                onClick={() => setMediaMode("url")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    mediaMode === "url"
                      ? `${colors.primary.main}18`
                      : colors.background.gray,
                  color:
                    mediaMode === "url"
                      ? colors.primary.main
                      : colors.text.primary,
                }}
              >
                <LinkMinimalistic weight="BoldDuotone" className="w-4 h-4" />
                {t("tutorDashboard.homework.pasteUrl")}
              </button>
            </div>

            {mediaMode === "file" ? (
              fileUpload(
                mediaFile,
                (f) => {
                  setMediaFile(f);
                  if (errors.media)
                    setErrors((p) => ({ ...p, media: undefined }));
                },
                "audio/*,video/*",
                "media",
              )
            ) : (
              <Input
                placeholder={t("tutorDashboard.homework.mediaUrlPlaceholder")}
                value={mediaUrl}
                onValueChange={(v) => {
                  setMediaUrl(v);
                  if (errors.media)
                    setErrors((p) => ({ ...p, media: undefined }));
                }}
                startContent={
                  <LinkMinimalistic
                    weight="BoldDuotone"
                    className="w-4 h-4"
                    style={{ color: colors.text.tertiary }}
                  />
                }
                endContent={
                  mediaUrl.trim() ? (
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          mediaUrl.trim(),
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: `${colors.primary.main}15`,
                        color: colors.primary.main,
                      }}
                    >
                      <Eye weight="BoldDuotone" className="w-3.5 h-3.5" />
                      {t("tutorDashboard.homework.viewUrl")}
                    </button>
                  ) : null
                }
                classNames={inputClassNames}
              />
            )}
            {errors.media && (
              <p
                className="text-xs mt-1.5"
                style={{ color: colors.state.error }}
              >
                {errors.media}
              </p>
            )}
          </>,
        )}

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          size="lg"
          variant="light"
          onPress={() => navigate("/tutor/homework")}
          isDisabled={submitting}
        >
          {t("tutorDashboard.homework.cancel")}
        </Button>
        <Button
          size="lg"
          startContent={
            !submitting ? (
              <ClipboardAdd weight="BoldDuotone" className="w-5 h-5" />
            ) : null
          }
          onPress={handleSubmit}
          isLoading={submitting}
          style={{
            backgroundColor: colors.primary.main,
            color: colors.text.white,
          }}
        >
          {submitting
            ? t("tutorDashboard.homework.saving")
            : t("tutorDashboard.homework.saveBtn", {
                defaultValue: "Save Changes",
              })}
        </Button>
      </div>
    </div>
  );
};

export default EditHomework;
