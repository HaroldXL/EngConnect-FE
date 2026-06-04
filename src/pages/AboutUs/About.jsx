import { Button, Card, CardBody } from "@heroui/react";
import {
  AltArrowRight,
  CupFirst,
  Eye,
  Global,
  HandShake,
  HeartShine,
  Lightbulb,
  Rocket,
  Target,
  UsersGroupRounded,
} from "@solar-icons/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import * as MotionLib from "framer-motion";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

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

// Import images
import avatarGiap from "../../assets/images/avatar-Giap.jpg";
import avatarKaius from "../../assets/images/avatar-Thinh.jpg";
import avatarThien from "../../assets/images/avatar-Thien.png";
import avatarCuong from "../../assets/images/avatar-Cuong.jpg";
import projectImage from "../../assets/illustrations/selfie.avif";
import hybridWorkImage from "../../assets/illustrations/project.avif";

const About = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();

  const values = [
    {
      icon: (props) => <HeartShine weight="BoldDuotone" {...props} />,
      title: t("about.values.passion.title"),
      description: t("about.values.passion.description"),
      color: "#EF4444",
      bgColor: "rgba(239, 68, 68, 0.1)",
    },
    {
      icon: (props) => <Lightbulb weight="BoldDuotone" {...props} />,
      title: t("about.values.innovation.title"),
      description: t("about.values.innovation.description"),
      color: "#F59E0B",
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
    {
      icon: (props) => <UsersGroupRounded weight="BoldDuotone" {...props} />,
      title: t("about.values.community.title"),
      description: t("about.values.community.description"),
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      icon: (props) => <CupFirst weight="BoldDuotone" {...props} />,
      title: t("about.values.excellence.title"),
      description: t("about.values.excellence.description"),
      color: "#10B981",
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
  ];

  const team = [
    {
      name: "Cao Dinh Giap",
      role: t("about.team.ceo"),
      avatar: avatarGiap,
    },
    {
      name: "Phung Minh Thien",
      role: t("about.team.member"),
      avatar: avatarThien,
    },
    {
      name: "Tran Huynh Phuc Thinh",
      role: t("about.team.member"),
      avatar: avatarKaius,
    },
    {
      name: "Nguyen Chi Cuong",
      role: t("about.team.member"),
      avatar: avatarCuong,
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background.light }}
    >
      <Header />

      {/* Hero Section */}
      <section
        className="py-20 px-6 md:px-12"
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
              <h1
                className="text-4xl sm:text-5xl font-bold mb-6"
                style={{ color: colors.text.primary }}
              >
                {t("about.hero.title")}{" "}
                <span style={{ color: colors.primary.main }}>EngConnect</span>
              </h1>
              <p
                className="text-lg max-w-xl leading-relaxed"
                style={{ color: colors.text.secondary }}
              >
                {t("about.hero.description")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:flex justify-center"
            >
              <img
                src={hybridWorkImage}
                alt="Team collaboration"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full max-w-md h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section
        className="py-20 px-6 md:px-12"
        style={{ backgroundColor: colors.background.light }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Mission */}
            <motion.div variants={itemVariants}>
              <Card
                className="h-full shadow-none"
                style={{ backgroundColor: colors.background.gray }}
              >
                <CardBody className="p-8">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  >
                    <Target
                      weight="BoldDuotone"
                      className="w-7 h-7"
                      style={{ color: "#3B82F6" }}
                    />
                  </div>
                  <h3
                    className="text-2xl font-bold mb-4"
                    style={{ color: colors.text.primary }}
                  >
                    {t("about.mission.title")}
                  </h3>
                  <p
                    className="leading-relaxed"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("about.mission.description")}
                  </p>
                </CardBody>
              </Card>
            </motion.div>

            {/* Vision */}
            <motion.div variants={itemVariants}>
              <Card
                className="h-full shadow-none"
                style={{ backgroundColor: colors.background.gray }}
              >
                <CardBody className="p-8">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
                  >
                    <Eye
                      weight="BoldDuotone"
                      className="w-7 h-7"
                      style={{ color: "#8B5CF6" }}
                    />
                  </div>
                  <h3
                    className="text-2xl font-bold mb-4"
                    style={{ color: colors.text.primary }}
                  >
                    {t("about.vision.title")}
                  </h3>
                  <p
                    className="leading-relaxed"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("about.vision.description")}
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section
        className="py-20 px-6 md:px-12"
        style={{ backgroundColor: colors.background.gray }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="hidden lg:flex justify-center"
            >
              <img
                src={projectImage}
                alt="Remote learning"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full max-w-md h-auto"
              />
            </motion.div>

            {/* Right - Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h2
                className="text-3xl sm:text-4xl font-bold mb-6"
                style={{ color: colors.text.primary }}
              >
                {t("about.story.title")}{" "}
                <span style={{ color: colors.primary.main }}>
                  {t("about.story.titleHighlight")}
                </span>
              </h2>
              <div className="space-y-4">
                <p
                  className="leading-relaxed"
                  style={{ color: colors.text.secondary }}
                >
                  {t("about.story.paragraph1")}
                </p>
                <p
                  className="leading-relaxed"
                  style={{ color: colors.text.secondary }}
                >
                  {t("about.story.paragraph2")}
                </p>
                <p
                  className="leading-relaxed"
                  style={{ color: colors.text.secondary }}
                >
                  {t("about.story.paragraph3")}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12"
          >
            {[
              {
                icon: (props) => <Rocket weight="BoldDuotone" {...props} />,
                title: t("about.story.founded"),
                value: "2025",
                color: "#3B82F6",
                bgColor: "rgba(59, 130, 246, 0.1)",
              },
              {
                icon: (props) => <Global weight="BoldDuotone" {...props} />,
                title: t("about.story.headquarters"),
                value: "Ho Chi Minh City, Vietnam",
                color: "#10B981",
                bgColor: "rgba(16, 185, 129, 0.1)",
              },
              {
                icon: (props) => (
                  <UsersGroupRounded weight="BoldDuotone" {...props} />
                ),
                title: t("about.story.teamSize"),
                value: "5",
                color: "#F59E0B",
                bgColor: "rgba(245, 158, 11, 0.1)",
              },
              {
                icon: (props) => <HandShake weight="BoldDuotone" {...props} />,
                title: t("about.story.partnerships"),
                value: "5+",
                color: "#8B5CF6",
                bgColor: "rgba(139, 92, 246, 0.1)",
              },
            ].map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card
                  className="shadow-none h-full"
                  style={{ backgroundColor: colors.background.light }}
                >
                  <CardBody className="p-5">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: item.bgColor }}
                    >
                      <item.icon
                        className="w-5 h-5"
                        style={{ color: item.color }}
                      />
                    </div>
                    <p
                      className="text-sm mb-1"
                      style={{ color: colors.text.secondary }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {item.value}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section
        className="py-20 px-6 md:px-12"
        style={{ backgroundColor: colors.background.light }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: colors.text.primary }}
            >
              {t("about.values.title")}{" "}
              <span style={{ color: colors.primary.main }}>
                {t("about.values.titleHighlight")}
              </span>
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: colors.text.secondary }}
            >
              {t("about.values.description")}
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map((value, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card
                  className="h-full shadow-none"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <CardBody className="p-6 text-center">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: value.bgColor }}
                    >
                      <value.icon
                        className="w-7 h-7"
                        style={{ color: value.color }}
                      />
                    </div>
                    <h3
                      className="text-lg font-bold mb-2"
                      style={{ color: colors.text.primary }}
                    >
                      {value.title}
                    </h3>
                    <p style={{ color: colors.text.secondary }}>
                      {value.description}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section
        className="py-20 px-6 md:px-12"
        style={{ backgroundColor: colors.background.gray }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: colors.text.primary }}
            >
              {t("about.team.title")}{" "}
              <span style={{ color: colors.primary.main }}>
                {t("about.team.titleHighlight")}
              </span>
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: colors.text.secondary }}
            >
              {t("about.team.description")}
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {team.map((member) => (
              <motion.div key={member.name} variants={itemVariants}>
                <Card
                  className="h-full shadow-none"
                  style={{ backgroundColor: colors.background.light }}
                >
                  <CardBody className="p-6 text-center">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <h3
                      className="text-lg font-bold mb-1"
                      style={{ color: colors.text.primary }}
                    >
                      {member.name}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: colors.primary.main }}
                    >
                      {member.role}
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
              {t("about.cta.title")}
            </h2>
            <p
              className="text-lg mb-10 max-w-2xl mx-auto opacity-90"
              style={{ color: colors.text.white }}
            >
              {t("about.cta.description")}
            </p>
            <Button
              size="lg"
              radius="full"
              className="font-semibold text-lg px-10 h-14"
              style={{
                backgroundColor: colors.background.light,
                color: colors.primary.main,
              }}
              onPress={() => navigate("/register")}
              endContent={
                <AltArrowRight weight="BoldDuotone" className="w-5 h-5" />
              }
            >
              {t("about.cta.button")}
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
