import * as MotionLib from "framer-motion";
import { useTranslation } from "react-i18next";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const LegalDocPage = ({ data, badgeLabel }) => {
  const { i18n } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();

  const lang = i18n.language.startsWith("vi") ? "vi" : "en";
  const content = data[lang];
  const lastUpdatedLabel = lang === "vi" ? "Cập nhật lần cuối" : "Last updated";

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
        <div className="max-w-3xl mx-auto text-center">
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
              {badgeLabel}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: colors.text.primary }}
          >
            {content.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg leading-relaxed mb-5 max-w-2xl mx-auto"
            style={{ color: colors.text.secondary }}
          >
            {content.subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm"
            style={{ color: colors.text.tertiary }}
          >
            {lastUpdatedLabel}: {content.lastUpdated}
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4 pb-20">
        <div className="max-w-3xl mx-auto space-y-4">
          {content.sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.04 }}
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: colors.background.gray,
                border: "none",
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{
                    backgroundColor: colors.background.primaryLight,
                    color: colors.primary.main,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2
                    className="text-base font-bold mb-1.5"
                    style={{ color: colors.text.primary }}
                  >
                    {section.heading}
                  </h2>
                  <p
                    className="text-base leading-relaxed"
                    style={{ color: colors.text.secondary }}
                  >
                    {section.text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LegalDocPage;
