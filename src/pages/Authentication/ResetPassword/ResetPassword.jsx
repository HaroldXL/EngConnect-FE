import React, { useState } from "react";
import { AltArrowLeft, CheckCircle, Eye, EyeClosed, LockKeyhole } from "@solar-icons/react"
import { Input, Button, Link, Image, addToast } from "@heroui/react";

import { useNavigate, useSearchParams } from "react-router-dom";
import * as MotionLib from "framer-motion";
import { useTranslation } from "react-i18next";
import BrandLogo from "../../../components/Authentication/BrandLogo";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { useTheme } from "../../../contexts/ThemeContext";
import useInputStyles from "../../../hooks/useInputStyles";
import { authApi } from "../../../api";
import illustrationImage from "../../../assets/illustrations/boy-refresh.avif";
import "./ResetPassword.css";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const { inputClassNames } = useInputStyles();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("code") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const validateForm = () => {
    const errors = { newPassword: "", confirmPassword: "" };

    if (!newPassword) {
      errors.newPassword = t("auth.resetPassword.passwordRequired");
    } else if (newPassword.length < 6) {
      errors.newPassword = t("auth.resetPassword.passwordMinLength");
    }

    if (!confirmPassword) {
      errors.confirmPassword = t("auth.resetPassword.confirmPasswordRequired");
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = t("auth.resetPassword.passwordMismatch");
    }

    setValidationErrors(errors);
    return !errors.newPassword && !errors.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!token) {
      addToast({
        title: t("auth.resetPassword.errorTitle"),
        description: t("auth.resetPassword.invalidToken"),
        color: "danger",
        timeout: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, newPassword);
      setIsSubmitted(true);
      addToast({
        title: t("auth.resetPassword.successTitle"),
        description: t("auth.resetPassword.successMessage"),
        color: "success",
        timeout: 3000,
      });
    } catch (err) {
      addToast({
        title: t("auth.resetPassword.errorTitle"),
        description:
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          t("auth.resetPassword.errorMessage"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="reset-pass-container"
      style={{ backgroundColor: colors.background.light }}
    >
      <div className="reset-pass-content">
        <motion.div
          className="reset-pass-illustration"
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
            alt="Reset password illustration"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
        </motion.div>

        <motion.div
          className="reset-pass-form-wrapper"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="reset-pass-header">
            <BrandLogo />

            <p
              className="text-center mb-8"
              style={{ color: colors.text.secondary }}
            >
              {t("auth.resetPassword.subtitle")}
            </p>
          </div>

          <div
            className="reset-pass-card"
            style={{ backgroundColor: colors.background.light }}
          >
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("auth.resetPassword.newPassword")}
                  </label>
                  <Input
                    type={isVisible ? "text" : "password"}
                    name="newPassword"
                    placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (validationErrors.newPassword) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          newPassword: "",
                        }));
                      }
                    }}
                    variant="flat"
                    size="lg"
                    isInvalid={!!validationErrors.newPassword}
                    errorMessage={validationErrors.newPassword}
                    classNames={inputClassNames}
                    startContent={
                      <LockKeyhole weight="BoldDuotone"
                        className="w-5 h-5"
                        style={{ color: colors.text.tertiary }}
                      />
                    }
                    endContent={
                      <button
                        type="button"
                        onClick={toggleVisibility}
                        className="focus:outline-none"
                      >
                        {isVisible ? (
                          <EyeClosed weight="BoldDuotone"
                            className="w-5 h-5"
                            style={{ color: colors.text.tertiary }}
                          />
                        ) : (
                          <Eye weight="BoldDuotone"
                            className="w-5 h-5"
                            style={{ color: colors.text.tertiary }}
                          />
                        )}
                      </button>
                    }
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("auth.resetPassword.confirmPassword")}
                  </label>
                  <Input
                    type={isConfirmVisible ? "text" : "password"}
                    name="confirmPassword"
                    placeholder={t(
                      "auth.resetPassword.confirmPasswordPlaceholder",
                    )}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (validationErrors.confirmPassword) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          confirmPassword: "",
                        }));
                      }
                    }}
                    variant="flat"
                    size="lg"
                    isInvalid={!!validationErrors.confirmPassword}
                    errorMessage={validationErrors.confirmPassword}
                    classNames={inputClassNames}
                    startContent={
                      <LockKeyhole weight="BoldDuotone"
                        className="w-5 h-5"
                        style={{ color: colors.text.tertiary }}
                      />
                    }
                    endContent={
                      <button
                        type="button"
                        onClick={toggleConfirmVisibility}
                        className="focus:outline-none"
                      >
                        {isConfirmVisible ? (
                          <EyeClosed weight="BoldDuotone"
                            className="w-5 h-5"
                            style={{ color: colors.text.tertiary }}
                          />
                        ) : (
                          <Eye weight="BoldDuotone"
                            className="w-5 h-5"
                            style={{ color: colors.text.tertiary }}
                          />
                        )}
                      </button>
                    }
                  />
                </div>

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
                    ? t("auth.resetPassword.resetting")
                    : t("auth.resetPassword.resetButton")}
                </Button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-6"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: colors.background.primaryLight }}
                >
                  <CheckCircle weight="BoldDuotone"
                    className="w-8 h-8"
                    style={{ color: colors.state.success }}
                  />
                </div>
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("auth.resetPassword.successTitle")}
                </h3>
                <p className="mb-6" style={{ color: colors.text.secondary }}>
                  {t("auth.resetPassword.successDescription")}
                </p>
                <Button
                  color="primary"
                  size="lg"
                  className="w-full font-medium"
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                  onPress={() => navigate("/login")}
                >
                  {t("auth.resetPassword.backToLogin")}
                </Button>
              </motion.div>
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
              {t("auth.resetPassword.backToLoginLink")}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
