import { Card, CardBody, Chip, Avatar, Progress } from "@heroui/react";
import { BookBookmark, HeadphonesRound, Pen, Star, UsersGroupRounded, VolumeLoud } from "@solar-icons/react"
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../hooks/useThemeColors";


const getSkillStyle = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("speak")) return { Icon: VolumeLoud, color: "#F97316", iconBg: "rgba(249,115,22,0.15)" };
  if (n.includes("listen")) return { Icon: HeadphonesRound, color: "#06B6D4", iconBg: "rgba(6,182,212,0.15)" };
  if (n.includes("read")) return { Icon: BookBookmark, color: "#10B981", iconBg: "rgba(16,185,129,0.15)" };
  if (n.includes("writ")) return { Icon: Pen, color: "#3B82F6", iconBg: "rgba(59,130,246,0.15)" };
  return null;
};

const CourseCard = ({
  course,
  showCategory = false,
  showTutorInfo = true,
  statusBadge = null,
  topRightAction = null,
  basePath = "/courses",
  style: customStyle = {},
  progress = null, // { completed, total } — when provided, shows progress bar instead of stats
}) => {
  const navigate = useNavigate();
  const colors = useThemeColors();

  const formatPrice = (price) => {
    if (price == null) return "";
    return price.toLocaleString("vi-VN") + "₫";
  };

  const skillCat = course.courseCategories?.find((c) => getSkillStyle(c.categoryName));
  const fallbackCat = !skillCat ? course.courseCategories?.[0] : null;

  return (
    <Card
      isPressable
      onPress={() => navigate(`${basePath}/${course.id}`)}
      className="h-full w-full shadow-none"
      style={{
        backgroundColor: colors.background.light,
        ...customStyle,
      }}
    >
      <div className="relative p-3">
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="w-full h-40 object-cover rounded-xl"
          style={
            course.thumbnailUrl
              ? {}
              : { backgroundColor: colors.background.gray }
          }
        />
        {statusBadge && (
          <Chip
            size="sm"
            className="absolute top-5 left-5"
            style={{
              backgroundColor: statusBadge.color,
              color: "#fff",
            }}
          >
            {statusBadge.label}
          </Chip>
        )}
        {topRightAction && (
          <div className="absolute top-5 right-5 z-10">{topRightAction}</div>
        )}
      </div>
      <CardBody className="p-4 pt-0 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          {course.level && (
            <Chip
              size="sm"
              variant="flat"
              style={{
                backgroundColor: colors.background.primaryLight,
                color: colors.primary.main,
              }}
            >
              {course.level}
            </Chip>
          )}
          {showCategory && skillCat && (() => {
            const { Icon, color, iconBg } = getSkillStyle(skillCat.categoryName);
            return (
              <Chip
                size="sm"
                variant="flat"
                startContent={<Icon size={12} weight="BoldDuotone" style={{ color }} />}
                style={{ backgroundColor: iconBg, color }}
              >
                {skillCat.categoryName}
              </Chip>
            );
          })()}
          {showCategory && fallbackCat && (
            <Chip
              size="sm"
              variant="flat"
              style={{
                backgroundColor: colors.background.gray,
                color: colors.text.secondary,
              }}
            >
              {fallbackCat.categoryName}
            </Chip>
          )}
        </div>
        <h3
          className="font-semibold line-clamp-2 min-h-[40px] mb-1"
          style={{ color: colors.text.primary }}
        >
          {course.title}
        </h3>
        {showTutorInfo && (course.tutorFirstName || course.tutorLastName) && (
          <div className="flex items-center gap-2 mb-3">
            <Avatar
              src={course.tutorAvatar}
              name={[course.tutorFirstName, course.tutorLastName]
                .filter(Boolean)
                .join(" ")}
              size="sm"
              className="w-8 h-8 flex-shrink-0"
            />
            <p
              className="text-sm truncate"
              style={{ color: colors.text.secondary }}
            >
              {[course.tutorFirstName, course.tutorLastName]
                .filter(Boolean)
                .join(" ")}
            </p>
          </div>
        )}
        {progress ? (
          <div className="mt-auto space-y-1.5">
            <div
              className="flex items-center justify-between text-xs"
              style={{ color: colors.text.secondary }}
            >
              <span>Progress</span>
              <span
                className="font-medium"
                style={{ color: colors.text.primary }}
              >
                {progress.completed}/{progress.total} lessons
              </span>
            </div>
            <Progress
              value={
                progress.total > 0
                  ? Math.round((progress.completed / progress.total) * 100)
                  : 0
              }
              size="md"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between mt-auto">
            <div
              className="flex items-center gap-3 text-sm"
              style={{ color: colors.text.secondary }}
            >
              <span className="flex items-center gap-1">
                <Star size={14} weight="BoldDuotone" style={{ color: "#F59E0B" }} />
                {course.ratingAverage}
                {course.ratingCount > 0 && ` (${course.ratingCount})`}
              </span>
              <span className="flex items-center gap-1">
                <UsersGroupRounded size={14} weight="BoldDuotone" />
                {course.numberOfEnrollment?.toLocaleString()}
              </span>
            </div>
            <span
              className="text-lg font-bold"
              style={{ color: colors.primary.main }}
            >
              {formatPrice(course.price)}
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default CourseCard;
