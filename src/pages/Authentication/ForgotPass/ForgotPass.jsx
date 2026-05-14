import React, { useState } from "react";
import { AltArrowLeft, Letter, CheckCircle } from "@solar-icons/react"
import { Input, Button, Link, Image, addToast } from "@heroui/react";

import { useNavigate } from "react-router-dom";
import * as MotionLib from "framer-motion";
import { useTranslation } from "react-i18next";
import BrandLogo from "../../../components/Authentication/BrandLogo";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { useTheme } from "../../../contexts/ThemeContext";
import useInputStyles from "../../../hooks/useInputStyles";
import { authApi } from "../../../api";
import illustrationImage from "../../../assets/illustrations/boy-with-key.avif";
import "./ForgotPass.css";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const ForgotPass = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const { inputClassNames } = useInputStyles();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
      addToast({
        title: t("auth.forgotPassword.successTitle"),
        description: t("auth.forgotPassword.successMessage"),
        color: "success",
        timeout: 3000,
      });
    } catch (err) {
      addToast({
        title: t("auth.forgotPassword.errorTitle"),
        description:
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          t("auth.forgotPassword.errorMessage"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (!value.trim()) {
      setIsSubmitted(false);
    }
  };

  return (
    <div
      className="forgot-pass-container"
      style={{ backgroundColor: colors.background.light }}
    >
      <div className="forgot-pass-content">
        <motion.div
          className="forgot-pass-illustration"
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
            alt="Forgot password illustration"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
        </motion.div>

        <motion.div
          className="forgot-pass-form-wrapper"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="forgot-pass-header">
            <BrandLogo />

            <p
              className="text-center mb-8"
              style={{ color: colors.text.secondary }}
            >
              {t("auth.forgotPassword.subtitle")}
            </p>
          </div>

          <div
            className="forgot-pass-card"
            style={{ backgroundColor: colors.background.light }}
          >
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("auth.forgotPassword.email")}
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder={t("auth.forgotPassword.emailPlaceholder")}
                    value={email}
                    onChange={handleEmailChange}
                    variant="flat"
                    size="lg"
                    classNames={inputClassNames}
                    startContent={
                      <Letter weight="BoldDuotone"
                        className="w-5 h-5"
                        style={{ color: colors.text.tertiary }}
                      />
                    }
                    required
                  />
                </div>

                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t("auth.forgotPassword.instruction")}
                </p>

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full font-medium"
                  isLoading={loading}
                  isDisabled={loading}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                >
                  {loading
                    ? t("auth.forgotPassword.sending")
                    : t("auth.forgotPassword.sendButton")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("auth.forgotPassword.email")}
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder={t("auth.forgotPassword.emailPlaceholder")}
                    value={email}
                    onChange={handleEmailChange}
                    variant="flat"
                    size="lg"
                    classNames={inputClassNames}
                    startContent={
                      <Letter weight="BoldDuotone"
                        className="w-5 h-5"
                        style={{ color: colors.text.tertiary }}
                      />
                    }
                    required
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{
                    backgroundColor: colors.background.primaryLight,
                  }}
                >
                  <CheckCircle weight="BoldDuotone"
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: colors.state.success }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("auth.forgotPassword.sentMessage")}
                  </p>
                </motion.div>

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full font-medium"
                  isLoading={loading}
                  isDisabled={loading}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                >
                  {loading
                    ? t("auth.forgotPassword.sending")
                    : t("auth.forgotPassword.resendButton")}
                </Button>
              </form>
            )}
          </div>

          <div
            className="text-center text-lg"
            style={{ width: "100%", maxWidth: "480px" }}
          >
            <Link
              onClick={() => navigate("/login")}
              className="cursor-pointer text-lg font-semibold inline-flex items-center gap-2"
              style={{ color: colors.primary.main }}
            >
              <AltArrowLeft weight="BoldDuotone" className="w-5 h-5" />
              {t("auth.forgotPassword.backToLoginLink")}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPass;
