import { useEffect } from "react";
import { CloseCircle } from "@solar-icons/react"
import { useNavigate } from "react-router-dom";
import * as MotionLib from "framer-motion";
import { useTranslation } from "react-i18next";

import BrandLogo from "../../../components/Authentication/BrandLogo";
import { useThemeColors } from "../../../hooks/useThemeColors";
import "./LoginFailed.css";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const LoginFailed = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const colors = useThemeColors();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="login-failed-container"
      style={{ backgroundColor: colors.background.light }}
    >
      <motion.div
        className="login-failed-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ backgroundColor: colors.background.light }}
      >
        <BrandLogo />

        <div className="login-failed-status">
          <CloseCircle weight="BoldDuotone" className="w-16 h-16" style={{ color: "#ef4444" }} />
          <h2
            className="text-xl font-semibold mt-4"
            style={{ color: colors.text.primary }}
          >
            {t("auth.loginFailed.title")}
          </h2>
          <p
            className="text-sm mt-2 text-center"
            style={{ color: colors.text.secondary }}
          >
            {t("auth.loginFailed.redirecting")}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginFailed;
