import { Rate } from "antd";
import { Button } from "@heroui/react";
import { Star, PenNewSquare } from "@solar-icons/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";

/**
 * Read-only rating display block used in lesson detail views.
 * Shows stars, rating value, and comment. Optional Edit/Add button.
 */
const LessonRatingDisplay = ({
  rating,
  canEdit = false,
  onEdit,
  onAdd,
  emptyMessage,
}) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  if (!rating) {
    return (
      <div
        className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ backgroundColor: colors.background.gray }}
      >
        <div className="flex items-center gap-2 flex-1">
          <Star
            weight="BoldDuotone"
            className="w-5 h-5"
            style={{ color: colors.text.tertiary }}
          />
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            {emptyMessage || t("lessonRating.noRatingYet")}
          </p>
        </div>
        {canEdit && onAdd && (
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Star weight="BoldDuotone" className="w-4 h-4" />}
            onPress={onAdd}
          >
            {t("lessonRating.rateThisLesson")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-xl flex flex-col gap-2"
      style={{ backgroundColor: colors.background.gray }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Rate
            value={rating.rating}
            disabled
            style={{ fontSize: 18, color: colors.state.warning }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: colors.text.primary }}
          >
            {rating.rating}/5
          </span>
        </div>
        {canEdit && onEdit && (
          <Button
            size="sm"
            variant="light"
            style={{ color: colors.text.secondary }}
            startContent={
              <PenNewSquare weight="BoldDuotone" className="w-4 h-4" />
            }
            onPress={onEdit}
          >
            {t("lessonRating.edit")}
          </Button>
        )}
      </div>
      {rating.comment && (
        <p
          className="text-sm whitespace-pre-wrap"
          style={{ color: colors.text.secondary }}
        >
          {rating.comment}
        </p>
      )}
    </div>
  );
};

export default LessonRatingDisplay;
