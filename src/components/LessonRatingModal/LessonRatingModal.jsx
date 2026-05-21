import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Avatar,
  addToast,
} from "@heroui/react";
import { Rate } from "antd";
import { Star, TrashBinMinimalistic } from "@solar-icons/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import useInputStyles from "../../hooks/useInputStyles";
import { lessonRatingApi } from "../../api";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const RATING_LABELS = {
  1: "lessonRating.labels.1",
  2: "lessonRating.labels.2",
  3: "lessonRating.labels.3",
  4: "lessonRating.labels.4",
  5: "lessonRating.labels.5",
};

const LessonRatingModal = ({
  isOpen,
  onClose,
  lesson,
  existingRating = null,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames } = useInputStyles();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEdit = Boolean(existingRating?.id);

  useEffect(() => {
    if (isOpen) {
      setRating(existingRating?.rating || 0);
      setComment(existingRating?.comment || "");
      setHoverRating(0);
    }
  }, [isOpen, existingRating]);

  const tutorName =
    `${lesson?.tutorFirstName || ""} ${lesson?.tutorLastName || ""}`.trim();
  const sessionTitle = lesson?.sessionTitle || "";
  const courseTitle = lesson?.courseTitle || "";

  const handleSubmit = async () => {
    if (rating < 1) {
      addToast({
        title: t("lessonRating.errors.ratingRequired"),
        color: "danger",
      });
      return;
    }
    if (!lesson?.id || !lesson?.tutorId || !lesson?.studentId) {
      addToast({
        title: t("lessonRating.errors.missingLessonData"),
        color: "danger",
      });
      return;
    }
    setSubmitting(true);
    try {
      let res;
      if (isEdit) {
        res = await lessonRatingApi.updateRating(existingRating.id, {
          rating,
          comment: comment.trim(),
        });
      } else {
        res = await lessonRatingApi.createRating({
          lessonId: lesson.id,
          tutorId: lesson.tutorId,
          studentId: lesson.studentId,
          rating,
          comment: comment.trim(),
        });
      }
      addToast({
        title: isEdit
          ? t("lessonRating.toasts.updated")
          : t("lessonRating.toasts.created"),
        color: "success",
      });
      onSuccess?.(res?.data || res);
      onClose?.();
    } catch (err) {
      console.error("Failed to submit lesson rating:", err);
      addToast({
        title: t("lessonRating.errors.submitFailed"),
        description: err?.response?.data?.error?.message || err?.message,
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRating?.id) return;
    setDeleting(true);
    try {
      await lessonRatingApi.deleteRating(existingRating.id);
      addToast({
        title: t("lessonRating.toasts.deleted"),
        color: "success",
      });
      onSuccess?.(null);
      onClose?.();
    } catch (err) {
      console.error("Failed to delete lesson rating:", err);
      addToast({
        title: t("lessonRating.errors.deleteFailed"),
        description: err?.response?.data?.error?.message || err?.message,
        color: "danger",
      });
    } finally {
      setDeleting(false);
    }
  };

  const displayRating = hoverRating || rating;
  const ratingLabel = displayRating
    ? t(RATING_LABELS[displayRating])
    : t("lessonRating.tapToRate");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      placement="center"
      backdrop="blur"
      isDismissable={!submitting && !deleting}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span style={{ color: colors.text.primary }}>
            {isEdit
              ? t("lessonRating.editTitle")
              : t("lessonRating.createTitle")}
          </span>
          <span
            className="text-sm font-normal"
            style={{ color: colors.text.secondary }}
          >
            {t("lessonRating.subtitle")}
          </span>
        </ModalHeader>
        <ModalBody>
          {/* Lesson context card */}
          <div
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ backgroundColor: colors.background.gray }}
          >
            <Avatar
              src={withCDN(lesson?.tutorAvatar)}
              size="lg"
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p
                className="font-semibold truncate"
                style={{ color: colors.text.primary }}
              >
                {tutorName || t("lessonRating.unknownTutor")}
              </p>
              <p
                className="text-sm truncate"
                style={{ color: colors.text.secondary }}
              >
                {sessionTitle}
              </p>
              {courseTitle && (
                <p
                  className="text-xs truncate"
                  style={{ color: colors.text.tertiary }}
                >
                  {courseTitle}
                </p>
              )}
            </div>
          </div>

          {/* Star picker */}
          <div className="flex flex-col items-center gap-2 py-2">
            <Rate
              value={rating}
              onChange={setRating}
              onHoverChange={(v) => setHoverRating(v || 0)}
              style={{ fontSize: 40, color: colors.state.warning }}
              disabled={submitting || deleting}
            />
            <span
              className="text-sm font-medium"
              style={{ color: colors.text.secondary }}
            >
              {ratingLabel}
            </span>
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: colors.text.primary }}
            >
              {t("lessonRating.commentLabel")}
            </label>
            <Textarea
              value={comment}
              onValueChange={setComment}
              placeholder={t("lessonRating.commentPlaceholder")}
              minRows={3}
              maxRows={6}
              maxLength={500}
              classNames={inputClassNames}
              isDisabled={submitting || deleting}
            />
            <span
              className="text-xs self-end"
              style={{ color: colors.text.tertiary }}
            >
              {comment.length}/500
            </span>
          </div>
        </ModalBody>
        <ModalFooter className="flex items-center justify-between">
          {isEdit ? (
            <Button
              variant="light"
              color="danger"
              startContent={
                <TrashBinMinimalistic
                  weight="BoldDuotone"
                  className="w-4 h-4"
                />
              }
              onPress={handleDelete}
              isLoading={deleting}
              isDisabled={submitting}
            >
              {t("lessonRating.delete")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="light"
              onPress={onClose}
              isDisabled={submitting || deleting}
            >
              {isEdit ? t("lessonRating.cancel") : t("lessonRating.skip")}
            </Button>
            <Button
              color="primary"
              startContent={
                <Star weight="BoldDuotone" className="w-4 h-4" />
              }
              onPress={handleSubmit}
              isLoading={submitting}
              isDisabled={deleting || rating < 1}
            >
              {isEdit
                ? t("lessonRating.saveChanges")
                : t("lessonRating.submit")}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LessonRatingModal;
