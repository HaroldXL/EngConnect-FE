import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { GraduationCap, ChalkboardTeacher } from "@phosphor-icons/react";
import * as MotionLib from "framer-motion";
import { useTranslation } from "react-i18next";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";
import { POLICIES } from "./legalData";
import { PresentationGraph, SquareAcademicCap } from "@solar-icons/react";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const PoliciesPage = () => {
  const { i18n } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState("student");

  const lang = i18n.language.startsWith("vi") ? "vi" : "en";
  const content = POLICIES[lang];

  const isVi = lang === "vi";
  const lastUpdatedLabel = isVi ? "Cập nhật lần cuối" : "Last updated";
  const lastUpdated = isVi ? "Tháng 5, 2025" : "May 2025";

  const tabData = selectedTab === "student" ? content.student : content.tutor;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background.light }}
    >
      <Header />

      {/* Hero */}
      <section
        className="py-16 px-4"
        style={{
          background:
            theme === "dark"
              ? colors.background.gray
              : "linear-gradient(to bottom, #FFFFFF, #DBEAFE)",
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mb-5"
              style={{
                backgroundColor: colors.background.primaryLight,
                color: colors.primary.main,
              }}
            >
              {isVi ? "Chính sách" : "Policies"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: colors.text.primary }}
          >
            {isVi ? "Chính sách Nền tảng" : "Platform Policies"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg leading-relaxed mb-5 max-w-2xl mx-auto"
            style={{ color: colors.text.secondary }}
          >
            {isVi
              ? "Các chính sách chi tiết áp dụng cho học viên và gia sư khi sử dụng nền tảng EngConnect."
              : "Detailed policies that apply to students and tutors using the EngConnect platform."}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm"
            style={{ color: colors.text.tertiary }}
          >
            {lastUpdatedLabel}: {lastUpdated}
          </motion.p>
        </div>
      </section>

      {/* Tabs + Content */}
      <section className="py-10 px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab}
              color="primary"
              size="lg"
            >
              <Tab
                key="student"
                title={
                  <span className="flex items-center gap-2">
                    <SquareAcademicCap weight="BoldDuotone" size={18} />
                    {isVi ? "Học viên" : "Student"}
                  </span>
                }
              />
              <Tab
                key="tutor"
                title={
                  <span className="flex items-center gap-2">
                    <PresentationGraph weight="BoldDuotone" size={18} />
                    {isVi ? "Gia sư" : "Tutor"}
                  </span>
                }
              />
            </Tabs>
          </div>

          <div className="space-y-4">
            {tabData.sections.map((section, index) => (
              <motion.div
                key={`${selectedTab}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className="p-6 rounded-2xl border"
                style={{
                  backgroundColor: colors.background.gray,
                  border: "none",
                }}
              >
                <h3
                  className="text-base font-bold mb-4"
                  style={{ color: colors.text.primary }}
                >
                  {section.heading}
                </h3>
                <ul className="space-y-2.5">
                  {section.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-[0.45rem]"
                        style={{ backgroundColor: colors.primary.main }}
                      />
                      <span
                        className="text-sm leading-relaxed"
                        style={{ color: colors.text.secondary }}
                      >
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PoliciesPage;
