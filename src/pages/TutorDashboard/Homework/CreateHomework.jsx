import { useState, useEffect, useMemo } from "react";
import {
  AltArrowLeft,
  ClipboardAdd,
  CloseCircle,
  Document,
  DocumentText,
  Gallery,
  LinkMinimalistic,
  MusicNotes,
  UserRounded,
  BookBookmark,
  PlayCircle,
  UploadMinimalistic,
} from "@solar-icons/react";
import { useNavigate } from "react-router-dom";
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
  Avatar,
  Chip,
  Spinner,
  addToast,
} from "@heroui/react";

import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { coursesApi, studentApi, lessonHomeworkApi } from "../../../api";

const HOMEWORK_TYPES = ["Reading", "Writing", "Listening", "Other"];
const WRITING_SUB_TYPES = [
  "WritingGeneral",
  "IeltsTask1",
  "IeltsTask2",
  "EmailFormal",
];

const formatDateTime = (iso, locale) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CreateHomework = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { inputClassNames, textareaClassNames, selectClassNames } =
    useInputStyles();
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  // Cascade data
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  // Form
  const [studentId, setStudentId] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [writingSubType, setWritingSubType] = useState("");
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [dueAt, setDueAt] = useState("");

  // Resource (text or file)
  const [resourceMode, setResourceMode] = useState("file"); // "file" | "url"
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceUrl, setResourceUrl] = useState("");

  // Media (only Listening)
  const [mediaMode, setMediaMode] = useState("file"); // "file" | "url"
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // ─── Load students with enrollments ─────────────────────────────
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const res = await coursesApi.getMyStudentEnrollments({
          Status: "InProgress,Completed",
          "page-size": 200,
        });
        setStudents(res?.data?.items || []);
      } catch (err) {
        console.error("Failed to load students:", err);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const selectedStudent = useMemo(
    () => students.find((s) => s.studentId === studentId) || null,
    [students, studentId],
  );

  const courseOptions = useMemo(
    () => selectedStudent?.enrollments || [],
    [selectedStudent],
  );

  const selectedEnrollment = useMemo(
    () => courseOptions.find((e) => e.id === enrollmentId) || null,
    [courseOptions, enrollmentId],
  );

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === lessonId) || null,
    [lessons, lessonId],
  );

  // ─── Load lessons when enrollment changes ──────────────────────
  useEffect(() => {
    if (!enrollmentId) {
      setLessons([]);
      return;
    }
    const fetchLessons = async () => {
      try {
        setLessonsLoading(true);
        const res = await studentApi.getLessons({
          EnrollmentId: enrollmentId,
          "page-size": 200,
          "sort-params": "StartTime-asc",
        });
        setLessons(res?.data?.items || []);
      } catch (err) {
        console.error("Failed to load lessons:", err);
        setLessons([]);
      } finally {
        setLessonsLoading(false);
      }
    };
    fetchLessons();
  }, [enrollmentId]);

  // ─── Handlers for cascade reset ─────────────────────────────────
  const handleStudentChange = (id) => {
    setStudentId(id);
    setEnrollmentId("");
    setLessonId("");
    setLessons([]);
    setErrors((p) => ({ ...p, studentId: undefined }));
  };

  const handleCourseChange = (id) => {
    setEnrollmentId(id);
    setLessonId("");
    setErrors((p) => ({ ...p, enrollmentId: undefined }));
  };

  const handleLessonChange = (id) => {
    setLessonId(id);
    setErrors((p) => ({ ...p, lessonId: undefined }));
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType !== "Writing") setWritingSubType("");
    if (newType !== "Listening") {
      setMediaFile(null);
      setMediaUrl("");
    }
    setErrors((p) => ({
      ...p,
      type: undefined,
      writingSubType: undefined,
      media: undefined,
    }));
  };

  // ─── Validate + submit ─────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!studentId) e.studentId = t("tutorDashboard.homework.studentRequired");
    if (!enrollmentId)
      e.enrollmentId = t("tutorDashboard.homework.courseRequired");
    if (!lessonId) e.lessonId = t("tutorDashboard.homework.lessonRequired");
    if (!title.trim()) e.title = t("tutorDashboard.homework.titleRequired");
    if (!type) e.type = t("tutorDashboard.homework.typeRequired");
    if (type === "Writing" && !writingSubType)
      e.writingSubType = t("tutorDashboard.homework.writingSubTypeRequired");
    if (!description.trim())
      e.description = t("tutorDashboard.homework.descriptionRequired");
    if (!maxScore || Number(maxScore) <= 0)
      e.maxScore = t("tutorDashboard.homework.maxScoreRequired");

    // Resource: must have either file or url
    if (resourceMode === "file" && !resourceFile)
      e.resource = t("tutorDashboard.homework.resourceFileRequired");
    if (resourceMode === "url" && !resourceUrl.trim())
      e.resource = t("tutorDashboard.homework.resourceUrlRequired");

    // Media (Listening only)
    if (type === "Listening") {
      if (mediaMode === "file" && !mediaFile)
        e.media = t("tutorDashboard.homework.mediaFileRequired");
      if (mediaMode === "url" && !mediaUrl.trim())
        e.media = t("tutorDashboard.homework.mediaUrlRequired");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await lessonHomeworkApi.createHomework({
        lessonId,
        title: title.trim(),
        type,
        writingSubType: type === "Writing" ? writingSubType : undefined,
        resourceFile: resourceMode === "file" ? resourceFile : undefined,
        resourceUrl: resourceMode === "url" ? resourceUrl.trim() : undefined,
        mediaFile:
          type === "Listening" && mediaMode === "file" ? mediaFile : undefined,
        mediaUrl:
          type === "Listening" && mediaMode === "url"
            ? mediaUrl.trim()
            : undefined,
        description: description.trim(),
        maxScore: Number(maxScore),
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });
      addToast({
        title: t("tutorDashboard.homework.createSuccess"),
        color: "success",
        timeout: 3000,
      });
      navigate("/tutor/homework");
    } catch (err) {
      console.error("Failed to create homework:", err);
      addToast({
        title: t("tutorDashboard.homework.createError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Type / SubType labels ──────────────────────────────────────
  const typeLabel = (val) =>
    t(
      `tutorDashboard.homework.type.${val.charAt(0).toLowerCase() + val.slice(1)}`,
    );
  const writingSubLabel = (val) =>
    t(
      `tutorDashboard.homework.writingSubType.${val.charAt(0).toLowerCase() + val.slice(1)}`,
    );

  // ─── Render ────────────────────────────────────────────────────
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

  // File upload UI
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

  return (
    <div className="space-y-6 pb-24">
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
          {t("tutorDashboard.homework.createPageTitle")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("tutorDashboard.homework.createPageSubtitle")}
        </p>
      </motion.div>

      {/* Step 1: Target (Student → Course → Lesson) */}
      {sectionCard(
        <>
          {sectionTitle(
            <UserRounded
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.primary.main }}
            />,
            t("tutorDashboard.homework.targetSection"),
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label={t("tutorDashboard.homework.studentLabel")}
              labelPlacement="outside"
              placeholder={
                studentsLoading
                  ? t("tutorDashboard.homework.loadingStudents")
                  : t("tutorDashboard.homework.studentPlaceholder")
              }
              selectedKeys={studentId ? [studentId] : []}
              onSelectionChange={(keys) => {
                handleStudentChange(Array.from(keys)[0] || "");
              }}
              isLoading={studentsLoading}
              isInvalid={!!errors.studentId}
              errorMessage={errors.studentId}
              classNames={selectClassNames}
              renderValue={() => {
                if (!selectedStudent) return null;
                return (
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={selectedStudent.studentAvatar}
                      name={selectedStudent.studentName}
                      size="sm"
                      className="w-6 h-6 flex-shrink-0"
                    />
                    <span className="truncate">
                      {selectedStudent.studentName}
                    </span>
                  </div>
                );
              }}
            >
              {students.map((s) => (
                <SelectItem key={s.studentId} textValue={s.studentName}>
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={s.studentAvatar}
                      name={s.studentName}
                      size="sm"
                      className="w-7 h-7 flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {s.studentName}
                      </span>
                      <span
                        className="text-xs truncate"
                        style={{ color: colors.text.tertiary }}
                      >
                        {s.enrollments?.length || 0}{" "}
                        {t("tutorDashboard.homework.coursesShort")}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </Select>

            <Select
              label={t("tutorDashboard.homework.courseLabel")}
              labelPlacement="outside"
              placeholder={
                !studentId
                  ? t("tutorDashboard.homework.coursePickStudentFirst")
                  : courseOptions.length === 0
                    ? t("tutorDashboard.homework.courseNone")
                    : t("tutorDashboard.homework.coursePlaceholder")
              }
              selectedKeys={enrollmentId ? [enrollmentId] : []}
              onSelectionChange={(keys) => {
                handleCourseChange(Array.from(keys)[0] || "");
              }}
              isDisabled={!studentId || courseOptions.length === 0}
              isInvalid={!!errors.enrollmentId}
              errorMessage={errors.enrollmentId}
              classNames={selectClassNames}
            >
              {courseOptions.map((c) => (
                <SelectItem key={c.id} textValue={c.courseName}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate">
                      {c.courseName}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: colors.text.tertiary }}
                    >
                      {c.numOfCompleteSession}/{c.numsOfSession}{" "}
                      {t("tutorDashboard.homework.lessonsShort")}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </Select>

            <Select
              label={t("tutorDashboard.homework.lessonLabel")}
              labelPlacement="outside"
              placeholder={
                !enrollmentId
                  ? t("tutorDashboard.homework.lessonPickCourseFirst")
                  : lessonsLoading
                    ? t("tutorDashboard.homework.loadingLessons")
                    : lessons.length === 0
                      ? t("tutorDashboard.homework.lessonNone")
                      : t("tutorDashboard.homework.lessonPlaceholder")
              }
              selectedKeys={lessonId ? [lessonId] : []}
              onSelectionChange={(keys) => {
                handleLessonChange(Array.from(keys)[0] || "");
              }}
              isDisabled={!enrollmentId || lessons.length === 0}
              isLoading={lessonsLoading}
              isInvalid={!!errors.lessonId}
              errorMessage={errors.lessonId}
              classNames={selectClassNames}
            >
              {lessons.map((l) => (
                <SelectItem key={l.id} textValue={l.sessionTitle || "Lesson"}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate">
                      {l.sessionTitle || "Lesson"}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: colors.text.tertiary }}
                    >
                      {formatDateTime(l.startTime, locale)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </div>

          {selectedLesson && (
            <div
              className="mt-4 p-3 rounded-xl flex items-center gap-3"
              style={{ backgroundColor: `${colors.primary.main}10` }}
            >
              <BookBookmark
                weight="BoldDuotone"
                className="w-5 h-5 flex-shrink-0"
                style={{ color: colors.primary.main }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: colors.text.primary }}
                >
                  {selectedLesson.sessionTitle}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: colors.text.tertiary }}
                >
                  {selectedEnrollment?.courseName} ·{" "}
                  {formatDateTime(selectedLesson.startTime, locale)}
                </p>
              </div>
            </div>
          )}
        </>,
      )}

      {/* Step 2: Type */}
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
            </div>

            {type === "Writing" && (
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
                    setErrors((p) => ({ ...p, writingSubType: undefined }));
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
            )}

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
                  min={new Date(
                    Date.now() - new Date().getTimezoneOffset() * 60000,
                  )
                    .toISOString()
                    .slice(0, 16)}
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

      {/* Step 3: Resource */}
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

      {/* Step 4: Media (Listening only) */}
      {type === "Listening" &&
        sectionCard(
          <>
            {sectionTitle(
              <MusicNotes
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

      {/* Sticky footer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-10 border-t backdrop-blur"
        style={{
          backgroundColor: `${colors.background.light}f2`,
          borderColor: colors.border.medium,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-end gap-3">
          <Button
            variant="light"
            onPress={() => navigate("/tutor/homework")}
            isDisabled={submitting}
          >
            {t("tutorDashboard.homework.cancel")}
          </Button>
          <Button
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
              ? t("tutorDashboard.homework.creating")
              : t("tutorDashboard.homework.createBtnAction")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateHomework;
