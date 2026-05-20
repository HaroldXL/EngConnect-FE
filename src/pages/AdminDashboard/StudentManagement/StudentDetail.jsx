import { useQuery } from "@tanstack/react-query";
import { AltArrowLeft, BookBookmark, CalendarMark, GraphUp, Letter, SquareAcademicCap } from "@solar-icons/react"
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Chip,
  Progress,
  Skeleton,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { motion } from "framer-motion";
import { adminApi, coursesApi } from "../../../api";


const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url?.startsWith("http")) return url;
  return CDN_BASE + url;
};

const AdminStudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ["admin-student", id],
    queryFn: () => adminApi.getStudentById(id).then((r) => r.data),
    enabled: !!id,
  });

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ["admin-student-enrollments", id],
    queryFn: () =>
      Promise.all([
        coursesApi.getAllCourseEnrollments({ StudentId: id, Status: "InProgress", "page-size": 50 }),
        coursesApi.getAllCourseEnrollments({ StudentId: id, Status: "Completed", "page-size": 50 }),
      ]).then(([inProgressRes, completedRes]) => [
        ...(inProgressRes?.data?.items || []),
        ...(completedRes?.data?.items || []),
      ]),
    enabled: !!id,
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "default";
      case "Suspended":
        return "danger";
      default:
        return "primary";
    }
  };

  const getEnrollmentStatusColor = (status) => {
    switch (status) {
      case "InProgress":
        return { bg: `${colors.state.warning}20`, text: colors.state.warning };
      case "Completed":
        return { bg: `${colors.state.success}20`, text: colors.state.success };
      default:
        return { bg: `${colors.text.tertiary}20`, text: colors.text.tertiary };
    }
  };

  const getStudentName = (s) => {
    if (s?.user) {
      return `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim();
    }
    return t("adminDashboard.students.nA");
  };

  const inProgressCount = enrollments.filter(
    (e) => e.status === "InProgress",
  ).length;
  const completedCount = enrollments.filter(
    (e) => e.status === "Completed",
  ).length;

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "0001-01-01T00:00:00")
      return t("adminDashboard.students.nA");
    return new Date(dateStr).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    );
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-3"
      >
        <Button
          isIconOnly
          variant="light"
          onPress={() => navigate("/admin/students")}
        >
          <AltArrowLeft weight="BoldDuotone" size={20} style={{ color: colors.text.primary }} />
        </Button>
        <h1
          className="text-2xl lg:text-3xl font-bold"
          style={{ color: colors.text.primary }}
        >
          {t("adminDashboard.students.studentDetails")}
        </h1>
      </motion.div>

      {/* SquareAcademicCap info card */}
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
          <CardBody className="p-6">
            {loadingStudent ? (
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-7 w-56 rounded-lg" />
                  <Skeleton className="h-4 w-48 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            ) : student ? (
              <div className="space-y-5">
                {/* Avatar + name row */}
                <div className="flex items-center gap-4">
                  <Avatar
                    src={withCDN(student.avatar)}
                    name={getStudentName(student)}
                    className="w-20 h-20 text-xl flex-shrink-0"
                  />
                  <div>
                    <h3
                      className="text-xl font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {getStudentName(student)}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {student.user?.email || ""}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Chip
                        size="sm"
                        color={getStatusColor(student.status)}
                        variant="flat"
                      >
                        {student.status || t("adminDashboard.students.nA")}
                      </Chip>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <BookBookmark weight="BoldDuotone"
                        size={20}
                        style={{ color: colors.primary.main }}
                      />
                    </div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {enrollments.length}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("studentProfile.totalCourses")}
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <GraphUp weight="BoldDuotone"
                        size={20}
                        style={{ color: colors.state.warning }}
                      />
                    </div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {loadingEnrollments ? "—" : inProgressCount}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("studentProfile.inProgress")}
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CalendarMark weight="BoldDuotone"
                        size={20}
                        style={{ color: colors.state.success }}
                      />
                    </div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {loadingEnrollments ? "—" : completedCount}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("studentProfile.completed")}
                    </p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    icon={
                      <Letter weight="BoldDuotone"
                        size={15}
                        style={{ color: colors.primary.main }}
                      />
                    }
                    label={t("adminDashboard.students.email")}
                    value={
                      student.user?.email || t("adminDashboard.students.nA")
                    }
                    colors={colors}
                  />
                  <InfoRow
                    icon={
                      <SquareAcademicCap weight="BoldDuotone"
                        size={15}
                        style={{ color: colors.primary.main }}
                      />
                    }
                    label={t("adminDashboard.students.table.school")}
                    value={student.school || t("adminDashboard.students.nA")}
                    colors={colors}
                  />
                  <InfoRow
                    icon={
                      <SquareAcademicCap weight="BoldDuotone"
                        size={15}
                        style={{ color: colors.primary.main }}
                      />
                    }
                    label={t("adminDashboard.students.table.grade")}
                    value={
                      student.grade
                        ? `${student.grade}${student.class ? ` — ${student.class}` : ""}`
                        : t("adminDashboard.students.nA")
                    }
                    colors={colors}
                  />
                  <InfoRow
                    icon={
                      <CalendarMark weight="BoldDuotone"
                        size={15}
                        style={{ color: colors.primary.main }}
                      />
                    }
                    label={t("adminDashboard.students.table.joinDate")}
                    value={formatDate(student.createdAt)}
                    colors={colors}
                  />
                  <InfoRow
                    icon={
                      <CalendarMark weight="BoldDuotone"
                        size={15}
                        style={{ color: colors.primary.main }}
                      />
                    }
                    label={t("adminDashboard.students.lastUpdated")}
                    value={formatDate(student.updatedAt)}
                    colors={colors}
                  />
                </div>

                {student.notes && (
                  <div>
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.students.notes")}
                    </p>
                    <p style={{ color: colors.text.primary }}>
                      {student.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p
                className="text-center py-8"
                style={{ color: colors.text.secondary }}
              >
                {t("studentProfile.notFound")}
              </p>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Enrolled courses */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.05 }}
      >
        <h2
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          <BookBookmark
            size={22}
            weight="BoldDuotone"
            style={{ color: colors.primary.main }}
          />
          {t("studentProfile.enrolledCourses")}
          {!loadingEnrollments && (
            <span
              className="text-sm font-normal"
              style={{ color: colors.text.tertiary }}
            >
              ({enrollments.length})
            </span>
          )}
        </h2>

        {loadingEnrollments ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                shadow="none"
                className="border-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-20 h-14 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-32 rounded-lg" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-40 rounded-lg" />
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6 text-center">
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {t("studentProfile.noEnrollments")}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((enrollment) => {
              const progress =
                enrollment.numsOfSession > 0
                  ? Math.round(
                      (enrollment.numOfCompleteSession /
                        enrollment.numsOfSession) *
                        100,
                    )
                  : 0;
              const statusColor = getEnrollmentStatusColor(enrollment.status);

              return (
                <Card
                  key={enrollment.id}
                  shadow="none"
                  className="border-none cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: colors.background.light }}
                  isPressable
                  onPress={() =>
                    navigate(`/admin/courses/${enrollment.courseId}`)
                  }
                >
                  <CardBody className="p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          withCDN(enrollment.course?.thumbnailUrl) ||
                          "https://placehold.co/300x200?text=No+Image"
                        }
                        alt={enrollment.course?.title}
                        className="w-20 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className="font-semibold truncate"
                            style={{ color: colors.text.primary }}
                          >
                            {enrollment.course?.title}
                          </p>
                          <Chip
                            size="sm"
                            style={{
                              backgroundColor: statusColor.bg,
                              color: statusColor.text,
                            }}
                          >
                            {enrollment.status === "InProgress"
                              ? t("studentProfile.inProgress")
                              : t("studentProfile.completed")}
                          </Chip>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            {enrollment.numOfCompleteSession}/
                            {enrollment.numsOfSession}{" "}
                            {t("courses.detail.sessionsCompleted")}
                          </span>
                          {enrollment.enrolledAt && (
                            <span
                              className="text-xs"
                              style={{ color: colors.text.tertiary }}
                            >
                              {new Date(
                                enrollment.enrolledAt,
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress
                            value={progress}
                            size="sm"
                            color={
                              enrollment.status === "Completed"
                                ? "success"
                                : "primary"
                            }
                            className="flex-1"
                          />
                          <span
                            className="text-sm font-semibold min-w-[3rem] text-right"
                            style={{ color: colors.primary.main }}
                          >
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, colors }) => (
  <div
    className="flex flex-col gap-1 p-3 rounded-xl"
    style={{ backgroundColor: colors.background.gray }}
  >
    <p
      className="text-xs font-semibold flex items-center gap-1"
      style={{ color: colors.text.secondary }}
    >
      {icon}
      {label}
    </p>
    <p className="text-sm" style={{ color: colors.text.primary }}>
      {value}
    </p>
  </div>
);

export default AdminStudentDetail;
