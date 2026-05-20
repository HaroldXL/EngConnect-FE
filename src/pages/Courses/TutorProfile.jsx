import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookBookmark,
  ClockCircle,
  Documents,
  Letter,
  Star,
} from "@solar-icons/react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Avatar, Card, CardBody, Skeleton, Tabs, Tab } from "@heroui/react";
import * as MotionLib from "framer-motion";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import CourseCard from "../../components/CourseCard/CourseCard";
import CourseCardSkeleton from "../../components/CourseCardSkeleton/CourseCardSkeleton";
import DocumentCard from "../../components/DocumentCard/DocumentCard";
import ImageViewerModal from "../../components/ImageViewerModal/ImageViewerModal";
import { useThemeColors } from "../../hooks/useThemeColors";

import { tutorApi, coursesApi } from "../../api";
import searchIllustration from "../../assets/illustrations/folders.avif";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const TutorProfile = () => {
  const { tutorId } = useParams();
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [selectedTab, setSelectedTab] = useState("courses");
  const [viewingImageUrl, setViewingImageUrl] = useState(null);

  const { data: tutor, isLoading: loadingTutor } = useQuery({
    queryKey: ["tutor", tutorId],
    queryFn: () => tutorApi.getTutorById(tutorId).then((r) => r.data),
    enabled: !!tutorId,
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["tutor-courses", tutorId],
    queryFn: () =>
      coursesApi
        .getAllCourses({ TutorId: tutorId, Status: "Published", "page-size": 50 })
        .then((r) => r.data?.items || []),
    enabled: !!tutorId,
  });

  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ["tutor-documents", tutorId],
    queryFn: () =>
      tutorApi
        .getTutorDocuments({ TutorId: tutorId, Status: "Active" })
        .then((r) => (Array.isArray(r.data) ? r.data : r.data?.items || [])),
    enabled: !!tutorId,
  });

  const tutorName = tutor
    ? `${tutor.user?.firstName ?? ""} ${tutor.user?.lastName ?? ""}`.trim()
    : "";

  const DOC_SKEL_KEYS = ["doc-skel-0", "doc-skel-1", "doc-skel-2"];

  const renderCoursesTab = () => {
    if (loadingCourses) {
      return (
        <CourseCardSkeleton
          count={4}
          gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-5"
          cardBgColor={colors.background.gray}
        />
      );
    }
    if (courses.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              showCategory
              style={{ backgroundColor: colors.background.gray }}
            />
          ))}
        </div>
      );
    }
    return (
      <Card shadow="none" style={{ backgroundColor: colors.background.gray }}>
        <CardBody className="flex flex-col items-center justify-center py-12">
          <img
            src={searchIllustration}
            alt="No courses"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            className="w-62 h-62 object-contain opacity-75"
          />
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            {t("tutorProfile.noCourses")}
          </p>
        </CardBody>
      </Card>
    );
  };

  const renderDocumentsTab = () => {
    if (loadingDocs) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {DOC_SKEL_KEYS.map((key) => (
            <Card
              key={key}
              shadow="none"
              style={{ backgroundColor: colors.background.gray }}
            >
              <CardBody className="p-4 gap-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="w-full h-36 rounded-xl mt-2" />
              </CardBody>
            </Card>
          ))}
        </div>
      );
    }
    if (documents.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onViewImage={setViewingImageUrl}
              cardBgColor={colors.background.gray}
            />
          ))}
        </div>
      );
    }
    return (
      <Card shadow="none" style={{ backgroundColor: colors.background.gray }}>
        <CardBody className="flex flex-col items-center justify-center py-12">
          <img
            src={searchIllustration}
            alt="No documents"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            className="w-62 h-62 object-contain opacity-75"
          />
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            {t("tutorProfile.noDocuments")}
          </p>
        </CardBody>
      </Card>
    );
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background.light }}
    >
      <Header />

      <div className="max-w-7xl mx-auto py-8">
        {/* ── Tutor header card ── */}
        {loadingTutor ? (
          <Card
            shadow="none"
            className="mb-8"
            style={{ backgroundColor: colors.background.gray }}
          >
            <CardBody className="p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Skeleton className="w-20 h-20 rounded-full shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-64 rounded-lg" />
                  <div className="flex gap-4 mt-2">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-4 w-24 rounded-lg" />
                    <Skeleton className="h-4 w-20 rounded-lg" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : tutor ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Card
              shadow="none"
              style={{ backgroundColor: colors.background.gray }}
            >
              <CardBody className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <Avatar
                    src={tutor.avatar}
                    name={tutorName}
                    className="w-20 h-20 text-xl shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h1
                      className="text-2xl font-bold mb-0.5"
                      style={{ color: colors.text.primary }}
                    >
                      {tutorName}
                    </h1>
                    {tutor.headline && (
                      <p
                        className="text-sm mb-3"
                        style={{ color: colors.text.secondary }}
                      >
                        {tutor.headline}
                      </p>
                    )}
                    {tutor.user?.email && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Letter
                          weight="BoldDuotone"
                          size={16}
                          style={{ color: colors.primary.main }}
                        />
                        <a
                          href={`mailto:${tutor.user.email}`}
                          className="text-sm hover:underline"
                          style={{ color: colors.text.secondary }}
                        >
                          {tutor.user.email}
                        </a>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Star
                          size={16}
                          weight="BoldDuotone"
                          style={{ color: "#f59e0b" }}
                        />
                        <span
                          className="font-semibold text-sm"
                          style={{ color: colors.text.primary }}
                        >
                          {tutor.ratingAverage?.toFixed(1) || "0.0"}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.tertiary }}
                        >
                          ({tutor.ratingCount || 0}{" "}
                          {t("courses.detail.reviews")})
                        </span>
                      </div>
                      {tutor.monthExperience > 0 && (
                        <div className="flex items-center gap-1.5">
                          <ClockCircle
                            weight="BoldDuotone"
                            size={16}
                            style={{ color: colors.primary.main }}
                          />
                          <span
                            className="text-sm"
                            style={{ color: colors.text.secondary }}
                          >
                            {tutor.monthExperience}{" "}
                            {t("courses.detail.monthsExperience")}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <BookBookmark
                          weight="BoldDuotone"
                          size={16}
                          style={{ color: colors.primary.main }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {courses.length} {t("tutorProfile.tabs.courses")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          <Card
            shadow="none"
            className="mb-8"
            style={{ backgroundColor: colors.background.gray }}
          >
            <CardBody className="p-8 text-center">
              <p style={{ color: colors.text.secondary }}>
                {t("tutorProfile.notFound")}
              </p>
            </CardBody>
          </Card>
        )}

        {/* ── Main content: About Me (left) + Tabs (right) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-6 items-start"
        >
          {/* Left: About Me */}
          <div className="w-full lg:w-116 shrink-0">
            <Card
              shadow="none"
              style={{ backgroundColor: colors.background.gray }}
            >
              <CardBody className="p-6">
                <h3
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("tutorProfile.aboutMe")}
                </h3>
                {loadingTutor ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-5/6 rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-4/5 rounded" />
                  </div>
                ) : (
                  <p
                    className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: colors.text.secondary }}
                  >
                    {tutor?.bio || t("tutorProfile.noBio")}
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right: Tabs */}
          <div className="flex-1 min-w-0">
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab}
              color="primary"
              // classNames={{
              //   tabList: "gap-6 border-b pb-0 mb-6 w-full",
              //   tab: "h-10 px-0 font-semibold",
              //   cursor: "bg-primary",
              // }}
            >
              {/* Courses tab */}
              <Tab
                key="courses"
                title={
                  <span className="flex items-center gap-1.5">
                    <BookBookmark weight="BoldDuotone" size={16} />
                    {t("tutorProfile.tabs.courses")}
                  </span>
                }
              >
                {renderCoursesTab()}
              </Tab>

              {/* Documents tab */}
              <Tab
                key="documents"
                title={
                  <span className="flex items-center gap-1.5">
                    <Documents weight="BoldDuotone" size={16} />
                    {t("tutorProfile.tabs.documents")}
                  </span>
                }
              >
                {renderDocumentsTab()}
              </Tab>
            </Tabs>
          </div>
        </motion.div>
      </div>

      <ImageViewerModal
        imageUrl={viewingImageUrl}
        onClose={() => setViewingImageUrl(null)}
      />

      <Footer />
    </div>
  );
};

export default TutorProfile;
