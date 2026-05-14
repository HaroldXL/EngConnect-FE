import { Button, Card, CardBody } from "@heroui/react";
import {
  CheckCircle,
  ClockCircle,
  Dollar,
  GraphUp,
  HandShake,
  HeadphonesRound,
  Monitor,
  PresentationGraph,
  UserId,
  UserRounded,
  AltArrowRight,
  UserCheck,
  VideocameraAdd,
  MonitorCamera,
} from "@solar-icons/react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import * as MotionLib from "framer-motion";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";
import {
  selectIsAuthenticated,
  selectUser,
} from "../../store/slices/authSlice";

import contractImage from "../../assets/illustrations/contract.avif";
import findingImage from "../../assets/illustrations/boy-girl.avif";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const BecomeTutor = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const isTutor = user?.roles?.includes("Tutor");

  const handleApply = () => {
    navigate(isAuthenticated ? "/register-tutor" : "/register");
  };

  const benefits = [
    {
      icon: (props) => <ClockCircle weight="BoldDuotone" {...props} />,
      title: t("becomeTutor.benefits.flexibility.title"),
      description: t("becomeTutor.benefits.flexibility.description"),
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      icon: (props) => <Dollar weight="BoldDuotone" {...props} />,
      title: t("becomeTutor.benefits.earnings.title"),
      description: t("becomeTutor.benefits.earnings.description"),
      color: "#10B981",
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
      icon: (props) => <HeadphonesRound weight="BoldDuotone" {...props} />,
      title: t("becomeTutor.benefits.support.title"),
      description: t("becomeTutor.benefits.support.description"),
      color: "#8B5CF6",
      bgColor: "rgba(139, 92, 246, 0.1)",
    },
    {
      icon: (props) => <GraphUp weight="BoldDuotone" {...props} />,
      title: t("becomeTutor.benefits.growth.title"),
      description: t("becomeTutor.benefits.growth.description"),
      color: "#F59E0B",
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
  ];

  const requirements = [
    t("becomeTutor.requirements.native"),
    t("becomeTutor.requirements.experience"),
    t("becomeTutor.requirements.certification"),
    t("becomeTutor.requirements.availability"),
  ];

  const steps = [
    {
      icon: (props) => <UserId weight="BoldDuotone" {...props} />,
      title: t("becomeTutor.howItWorks.step1.title"),
      description: t("becomeTutor.howItWorks.step1.description"),
    },
    {
      icon: (props) => <UserCheck weight="BoldDuotone" {...props} />,
      title: t("becomeTutor.howItWorks.step2.title"),
      description: t("becomeTutor.howItWorks.step2.description"),
    },
    {
      icon: (props) => <VideocameraAdd weight="BoldDuotone" {...props} />,
      title: t("becomeTutor.howItWorks.step3.title"),
      description: t("becomeTutor.howItWorks.step3.description"),
    },
    {
      icon: (props) => <MonitorCamera weight="BoldDuotone" {...props} />,
      title: t("becomeTutor.howItWorks.step4.title"),
      description: t("becomeTutor.howItWorks.step4.description"),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background.light }}
    >
      <Header />

      {/* Hero Section */}
      <section
        className="py-16 px-6 md:px-12"
        style={{
          background:
            theme === "dark"
              ? colors.background.page
              : "linear-gradient(to bottom, #FFFFFF, #DBEAFE)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left"
            >
              <span
                className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6"
                style={{
                  backgroundColor: colors.background.primaryLight,
                  color: colors.primary.main,
                }}
              >
                {t("becomeTutor.hero.badge")}
              </span>
              <h1
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ color: colors.text.primary }}
              >
                {t("becomeTutor.hero.title")}{" "}
                <span style={{ color: colors.primary.main }}>
                  {t("becomeTutor.hero.titleHighlight")}
                </span>
              </h1>
              <p
                className="text-lg max-w-xl mb-8"
                style={{ color: colors.text.secondary }}
              >
                {t("becomeTutor.hero.description")}
              </p>

              {!isTutor && (
                <Button
                  size="lg"
                  radius="full"
                  className="font-semibold px-8"
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                  endContent={
                    <AltArrowRight weight="BoldDuotone" className="w-5 h-5" />
                  }
                  onPress={handleApply}
                >
                  {t("becomeTutor.cta.button")}
                </Button>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:flex justify-center"
            >
              <img
                src={contractImage}
                alt="Become a tutor"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full max-w-md h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        className="py-16 px-6 md:px-12"
        style={{ backgroundColor: colors.background.light }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: colors.text.primary }}
            >
              {t("becomeTutor.benefits.title")}{" "}
              <span style={{ color: colors.primary.main }}>
                {t("becomeTutor.benefits.titleHighlight")}
              </span>
            </h2>
            <p style={{ color: colors.text.secondary }}>
              {t("becomeTutor.benefits.subtitle")}
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {benefits.map((benefit, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card
                  className="h-full shadow-none text-center p-6"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <CardBody className="flex flex-col items-center text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: benefit.bgColor }}
                    >
                      {benefit.icon({
                        size: 32,
                        style: { color: benefit.color },
                      })}
                    </div>
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: colors.text.primary }}
                    >
                      {benefit.title}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {benefit.description}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Requirements Section */}
      <section
        className="py-16 px-6 md:px-12"
        style={{ backgroundColor: colors.background.gray }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="flex justify-center order-2 lg:order-1"
            >
              <img
                src={findingImage}
                alt="Requirements"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full max-w-sm h-auto"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="order-1 lg:order-2"
            >
              <h2
                className="text-2xl sm:text-3xl font-bold mb-3"
                style={{ color: colors.text.primary }}
              >
                {t("becomeTutor.requirements.title")}{" "}
                <span style={{ color: colors.primary.main }}>
                  {t("becomeTutor.requirements.titleHighlight")}
                </span>
              </h2>
              <p className="mb-8" style={{ color: colors.text.secondary }}>
                {t("becomeTutor.requirements.subtitle")}
              </p>

              <div className="space-y-4">
                {requirements.map((requirement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: colors.background.primaryLight,
                      }}
                    >
                      <Check size={14} style={{ color: colors.primary.main }} />
                    </div>
                    <span style={{ color: colors.text.secondary }}>
                      {requirement}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="py-16 px-6 md:px-12"
        style={{ backgroundColor: colors.background.light }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: colors.text.primary }}
            >
              {t("becomeTutor.howItWorks.title")}{" "}
              <span style={{ color: colors.primary.main }}>
                {t("becomeTutor.howItWorks.titleHighlight")}
              </span>
            </h2>
            <p style={{ color: colors.text.secondary }}>
              {t("becomeTutor.howItWorks.subtitle")}
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {steps.map((step, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card
                  className="h-full shadow-none p-6"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <CardBody className="flex flex-col items-center text-center p-0">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        backgroundColor: [
                          "rgba(99, 102, 241, 0.1)",
                          "rgba(239, 68, 68, 0.1)",
                          "rgba(249, 115, 22, 0.1)",
                          "rgba(34, 197, 94, 0.1)",
                        ][index],
                      }}
                    >
                      {step.icon({
                        size: 32,
                        style: {
                          color: ["#6366F1", "#EF4444", "#F97316", "#22C55E"][
                            index
                          ],
                        },
                      })}
                    </div>
                    <h3
                      className="text-base font-semibold mb-2"
                      style={{ color: colors.text.primary }}
                    >
                      {index + 1}. {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: colors.text.secondary }}
                    >
                      {step.description}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 px-6 md:px-12"
        style={{ backgroundColor: colors.primary.main }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2
              className="text-3xl sm:text-4xl font-bold mb-6"
              style={{ color: colors.text.white }}
            >
              {t("becomeTutor.cta.title")}
            </h2>
            <p
              className="text-lg mb-10 max-w-2xl mx-auto opacity-90"
              style={{ color: colors.text.white }}
            >
              {t("becomeTutor.cta.description")}
            </p>
            {!isTutor && (
              <Button
                size="lg"
                radius="full"
                className="font-semibold text-lg px-10 h-14"
                style={{
                  backgroundColor: colors.background.light,
                  color: colors.primary.main,
                }}
                endContent={
                  <AltArrowRight weight="BoldDuotone" className="w-5 h-5" />
                }
                onPress={handleApply}
              >
                {t("becomeTutor.cta.button")}
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BecomeTutor;
