import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardBody, Button, Avatar, Chip, Spinner } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { motion } from "framer-motion";
import { adminApi, coursesApi, tutorApi } from "../../../api";
import CourseCard from "../../../components/CourseCard/CourseCard";
import CourseCardSkeleton from "../../../components/CourseCardSkeleton/CourseCardSkeleton";
import DocumentCard from "../../../components/DocumentCard/DocumentCard";
import ImageViewerModal from "../../../components/ImageViewerModal/ImageViewerModal";
import {
  ArrowLeft,
  Star,
  GraduationCap,
  CalendarDots,
  Clock,
  Files,
} from "@phosphor-icons/react";
import searchIllustration from "../../../assets/illustrations/search.avif";

const AdminTutorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();

  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [viewingImageUrl, setViewingImageUrl] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await adminApi.getTutorById(id);
        setTutor(response.data);
      } catch (error) {
        console.error("Failed to fetch tutor detail:", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await coursesApi.getAllCourses({
          TutorId: id,
          "page-size": 50,
        });
        setCourses(res.data?.items || []);
      } catch (err) {
        console.error("Failed to fetch tutor courses:", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const res = await tutorApi.getTutorSchedules({
          TutorId: id,
          "page-size": 100,
        });
        setScheduleSlots(res?.data?.items || []);
      } catch (err) {
        console.error("Failed to fetch tutor schedules:", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    const fetchDocuments = async () => {
      try {
        setLoadingDocs(true);
        const res = await tutorApi.getTutorDocuments({ TutorId: id });
        const items = Array.isArray(res.data)
          ? res.data
          : res.data?.items || [];
        setDocuments(items);
      } catch {
        // silently ignore
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDetail();
    fetchCourses();
    fetchSlots();
    fetchDocuments();
  }, [id]);

  const getVerifiedColor = (status) => {
    return status === "Verified" ? "success" : "warning";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "default";
      default:
        return "primary";
    }
  };

  const getTutorName = (t) => {
    if (t?.user) {
      return `${t.user.firstName || ""} ${t.user.lastName || ""}`.trim();
    }
    return "N/A";
  };

  const getTutorEmail = (t) => {
    return t?.user?.email || "";
  };

  const getScheduleStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "success";
      case "Booked":
        return "primary";
      case "Pending":
        return "warning";
      case "Inactive":
        return "default";
      default:
        return "default";
    }
  };

  const formatSlotTime = (t) => (t ? t.slice(0, 5) : "");

  const weekdayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-3"
      >
        <Button
          isIconOnly
          variant="light"
          onPress={() => navigate("/admin/tutors")}
        >
          <ArrowLeft size={20} style={{ color: colors.text.primary }} />
        </Button>
        <h1
          className="text-2xl lg:text-3xl font-bold"
          style={{ color: colors.text.primary }}
        >
          {t("adminDashboard.tutors.tutorDetails")}
        </h1>
      </motion.div>

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
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : tutor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar src={tutor.avatar} className="w-20 h-20" />
                  <div>
                    <h3
                      className="text-xl font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {getTutorName(tutor)}
                    </h3>
                    <p style={{ color: colors.text.secondary }}>
                      {tutor.headline || ""}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Chip
                        size="sm"
                        color={getVerifiedColor(tutor.verifiedStatus)}
                        variant="flat"
                      >
                        {tutor.verifiedStatus === "Verified"
                          ? t("adminDashboard.tutors.verified")
                          : t("adminDashboard.tutors.unverified")}
                      </Chip>
                      <Chip
                        size="sm"
                        color={getStatusColor(tutor.status)}
                        variant="flat"
                      >
                        {tutor.status}
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
                      <Star
                        className="w-5 h-5"
                        weight="fill"
                        style={{ color: colors.state.warning }}
                      />
                      <span
                        className="text-2xl font-bold"
                        style={{ color: colors.text.primary }}
                      >
                        {tutor.ratingAverage > 0
                          ? tutor.ratingAverage.toFixed(1)
                          : t("adminDashboard.tutors.nA")}
                      </span>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.tutors.table.rating")}
                      {tutor.ratingCount > 0 &&
                        ` (${tutor.ratingCount} ${t("adminDashboard.tutors.ratingCount")})`}
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-2xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {tutor.monthExperience || 0}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.tutors.experience")} (
                      {t("adminDashboard.tutors.months")})
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="text-2xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {tutor.slotsCount || 0}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.tutors.slots")}
                    </p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="space-y-3">
                  {tutor.bio && (
                    <div>
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("adminDashboard.tutors.bio")}
                      </p>
                      <p
                        className="whitespace-pre-wrap"
                        style={{ color: colors.text.primary }}
                      >
                        {tutor.bio}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("adminDashboard.tutors.email")}
                      </p>
                      <p style={{ color: colors.text.primary }}>
                        {getTutorEmail(tutor)}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("adminDashboard.tutors.joinDate")}
                      </p>
                      <p style={{ color: colors.text.primary }}>
                        {tutor.createdAt
                          ? new Date(tutor.createdAt).toLocaleDateString(
                              i18n.language === "vi" ? "vi-VN" : "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : t("adminDashboard.tutors.nA")}
                      </p>
                    </div>
                  </div>
                  {(tutor.introVideoUrl || tutor.cvUrl) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tutor.introVideoUrl && (
                        <div>
                          <p
                            className="text-sm font-semibold mb-2"
                            style={{ color: colors.text.secondary }}
                          >
                            {t("adminDashboard.tutors.introVideo")}
                          </p>
                          <div
                            className="rounded-xl overflow-hidden w-full"
                            style={{ backgroundColor: "#000" }}
                          >
                            <video
                              src={tutor.introVideoUrl}
                              controls
                              className="w-full aspect-video"
                            />
                          </div>
                        </div>
                      )}
                      {tutor.cvUrl && (
                        <div>
                          <p
                            className="text-sm font-semibold mb-2"
                            style={{ color: colors.text.secondary }}
                          >
                            {t("adminDashboard.tutors.cvFile")}
                          </p>
                          <div
                            className="rounded-xl flex flex-col items-center justify-center gap-3 aspect-video"
                            style={{ backgroundColor: colors.background.gray }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="w-10 h-10"
                              fill="none"
                              style={{ color: "#EF4444" }}
                            >
                              <path
                                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                fill="currentColor"
                                opacity="0.15"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <path
                                d="M14 2v6h6M9 13h6M9 17h4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                            <a
                              href={tutor.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium underline"
                              style={{ color: colors.primary.main }}
                            >
                              {t("adminDashboard.tutors.view")} CV
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </motion.div>

      {/* Documents */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.1 }}
      >
        <h2
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          <Files
            size={22}
            weight="duotone"
            style={{ color: colors.primary.main }}
          />
          {t("tutorDashboard.profile.documents.myDocuments")}
          {!loadingDocs && (
            <span
              className="text-sm font-normal"
              style={{ color: colors.text.tertiary }}
            >
              ({documents.length})
            </span>
          )}
        </h2>
        {loadingDocs ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {["ds-0", "ds-1", "ds-2", "ds-3"].map((k) => (
              <Card
                key={k}
                shadow="none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-4 gap-2">
                  <div
                    className="h-4 w-24 rounded animate-pulse"
                    style={{ backgroundColor: colors.background.gray }}
                  />
                  <div
                    className="h-4 w-full rounded animate-pulse"
                    style={{ backgroundColor: colors.background.gray }}
                  />
                  <div
                    className="h-32 w-full rounded-xl mt-1 animate-pulse"
                    style={{ backgroundColor: colors.background.gray }}
                  />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : documents.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onViewImage={setViewingImageUrl}
                cardBgColor={colors.background.light}
              />
            ))}
          </div>
        ) : (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="flex flex-col items-center justify-center py-10">
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {t("tutorProfile.noDocuments")}
              </p>
            </CardBody>
          </Card>
        )}
      </motion.div>

      {/* Tutor Courses */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.15 }}
      >
        <h2
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          <GraduationCap
            size={22}
            weight="duotone"
            style={{ color: colors.primary.main }}
          />
          {t("adminDashboard.tutors.tutorCourses")}
          {!loadingCourses && (
            <span
              className="text-sm font-normal"
              style={{ color: colors.text.tertiary }}
            >
              ({courses.length})
            </span>
          )}
        </h2>
        {loadingCourses ? (
          <CourseCardSkeleton
            count={3}
            gridClassName="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            cardBgColor={colors.background.light}
          />
        ) : courses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                showCategory
                basePath="/admin/courses"
                style={{ backgroundColor: colors.background.light }}
              />
            ))}
          </div>
        ) : (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="flex flex-col items-center justify-center py-12">
              <img
                src={searchIllustration}
                alt="No courses"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="w-32 h-32 object-contain mb-4 opacity-80"
              />
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {t("adminDashboard.tutors.noCourses")}
              </p>
            </CardBody>
          </Card>
        )}
      </motion.div>

      {/* Schedule Slots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.2 }}
      >
        <h2
          className="text-xl font-bold mb-4 flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          <CalendarDots
            size={22}
            weight="duotone"
            style={{ color: colors.primary.main }}
          />
          {t("adminDashboard.tutors.scheduleSlots")}
          {!loadingSlots && (
            <span
              className="text-sm font-normal"
              style={{ color: colors.text.tertiary }}
            >
              ({scheduleSlots.length})
            </span>
          )}
        </h2>
        {loadingSlots ? (
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 w-48 rounded-xl animate-pulse"
                style={{ backgroundColor: colors.background.light }}
              />
            ))}
          </div>
        ) : scheduleSlots.length > 0 ? (
          <div className="space-y-5">
            {weekdayOrder
              .filter((day) => scheduleSlots.some((s) => s.weekday === day))
              .map((day) => (
                <div key={day}>
                  <p
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text.secondary }}
                  >
                    {t(`adminDashboard.schedule.days.${day.toLowerCase()}`, {
                      defaultValue: day,
                    })}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {scheduleSlots
                      .filter((s) => s.weekday === day)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((slot) => (
                        <div
                          key={slot.id}
                          className="px-4 py-3 rounded-xl flex items-center gap-3 border"
                          style={{
                            backgroundColor: colors.background.light,
                            borderColor: colors.border.light,
                          }}
                        >
                          <div
                            className="flex items-center gap-1 text-sm"
                            style={{ color: colors.text.primary }}
                          >
                            <Clock
                              size={14}
                              style={{ color: colors.text.secondary }}
                            />
                            <span>
                              {formatSlotTime(slot.startTime)} —{" "}
                              {formatSlotTime(slot.endTime)}
                            </span>
                          </div>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={getScheduleStatusColor(slot.status)}
                          >
                            {t(
                              `adminDashboard.schedule.scheduleStatuses.${slot.status}`,
                              { defaultValue: slot.status },
                            )}
                          </Chip>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="flex flex-col items-center justify-center py-10">
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {t("adminDashboard.tutors.noScheduleSlots")}
              </p>
            </CardBody>
          </Card>
        )}
      </motion.div>
      <ImageViewerModal
        imageUrl={viewingImageUrl}
        onClose={() => setViewingImageUrl(null)}
      />
    </div>
  );
};

export default AdminTutorDetail;
