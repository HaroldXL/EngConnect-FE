import React, { useState, useEffect } from "react";
import { CheckCircle, CloseCircle, MenuDots } from "@solar-icons/react"
import { Button, Image, addToast } from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as MotionLib from "framer-motion";
import { useTranslation } from "react-i18next";

import BrandLogo from "../../../components/Authentication/BrandLogo";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { useTheme } from "../../../contexts/ThemeContext";
import { verifyEmail, clearError } from "../../../store/slices/authSlice";
import illustrationImage from "../../../assets/illustrations/email.avif";
import "./VerifyEmail.css";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "";

  const { loading, error } = useSelector((state) => state.auth);
  const [verifyStatus, setVerifyStatus] = useState("idle"); // idle | loading | success | error

  useEffect(() => {
    dispatch(clearError());

    if (code) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    if (!code) {
      addToast({
        title: t("auth.verifyEmail.error.title"),
        description: t("auth.verifyEmail.error.noCode"),
        color: "danger",
        timeout: 3000,
      });
      return;
    }

    setVerifyStatus("loading");

    try {
      await dispatch(verifyEmail(code)).unwrap();
      setVerifyStatus("success");

      addToast({
        title: t("auth.verifyEmail.success.title"),
        description: t("auth.verifyEmail.success.description"),
        color: "success",
        timeout: 3000,
      });
    } catch (err) {
      setVerifyStatus("error");
      console.error("Verify email error:", err);
    }
  };

  const renderContent = () => {
    // No code provided
    if (!code && verifyStatus === "idle") {
      return (
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.warning}20` }}
          >
            <CloseCircle weight="BoldDuotone" className="w-8 h-8" style={{ color: colors.warning }} />
          </div>
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {t("auth.verifyEmail.error.invalidTitle")}
          </h2>
          <p style={{ color: colors.text.secondary }}>
            {t("auth.verifyEmail.error.noCode")}
          </p>
          <Button
            color="primary"
            size="lg"
            className="w-full font-medium mt-4"
            style={{
              backgroundColor: colors.primary.main,
              color: colors.text.white,
            }}
            onPress={() => navigate("/login")}
          >
            {t("auth.verifyEmail.backToLogin")}
          </Button>
        </div>
      );
    }

    // Loading
    if (verifyStatus === "loading" || loading) {
      return (
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.primary.main}15` }}
          >
            <MenuDots weight="BoldDuotone"
              className="w-8 h-8 animate-spin"
              style={{ color: colors.primary.main }}
            />
          </div>
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {t("auth.verifyEmail.verifying.title")}
          </h2>
          <p style={{ color: colors.text.secondary }}>
            {t("auth.verifyEmail.verifying.description")}
          </p>
        </div>
      );
    }

    // Success
    if (verifyStatus === "success") {
      return (
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#ECFDF5" }}
          >
            <CheckCircle weight="BoldDuotone" className="w-8 h-8" style={{ color: "#10B981" }} />
          </div>
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {t("auth.verifyEmail.success.title")}
          </h2>
          <p style={{ color: colors.text.secondary }}>
            {t("auth.verifyEmail.success.description")}
          </p>
          <Button
            color="primary"
            size="lg"
            className="w-full font-medium mt-4"
            style={{
              backgroundColor: colors.primary.main,
              color: colors.text.white,
            }}
            onPress={() => navigate("/login")}
          >
            {t("auth.verifyEmail.goToLogin")}
          </Button>
        </div>
      );
    }

    // Error
    if (verifyStatus === "error") {
      return (
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#FEF2F2" }}
          >
            <CloseCircle weight="BoldDuotone" className="w-8 h-8" style={{ color: "#EF4444" }} />
          </div>
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {t("auth.verifyEmail.error.title")}
          </h2>
          <p style={{ color: colors.text.secondary }}>
            {error || t("auth.verifyEmail.error.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
            <Button
              color="primary"
              size="lg"
              variant="flat"
              className="flex-1 font-medium"
              onPress={handleVerify}
            >
              {t("auth.verifyEmail.retry")}
            </Button>
            <Button
              color="primary"
              size="lg"
              className="flex-1 font-medium"
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
              onPress={() => navigate("/login")}
            >
              {t("auth.verifyEmail.backToLogin")}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="verify-email-container"
      style={{ backgroundColor: colors.background.light }}
    >
      <div className="verify-email-content">
        <motion.div
          className="verify-email-illustration"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            backgroundColor:
              theme === "dark" ? colors.background.gray : "#F0F9FF",
          }}
        >
          <Image
            src={illustrationImage}
            alt="Email verification illustration"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
        </motion.div>

        <motion.div
          className="verify-email-form-wrapper"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="verify-email-header">
            <BrandLogo />

            <p
              className="text-center mb-8"
              style={{ color: colors.text.secondary }}
            >
              {t("auth.verifyEmail.subtitle")}
            </p>
          </div>

          <div
            className="verify-email-card"
            style={{ backgroundColor: colors.background.light }}
          >
            {renderContent()}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmail;
