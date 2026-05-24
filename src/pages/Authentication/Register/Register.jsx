import React, { useState, useEffect } from "react";
import { CheckCircle, Eye, EyeClosed } from "@solar-icons/react";
import {
  Input,
  Button,
  Link,
  Checkbox,
  Image,
  Alert,
  addToast,
} from "@heroui/react";
import LegalModal from "./LegalModal";
import { TERMS, PRIVACY } from "../../Legal/legalData";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as MotionLib from "framer-motion";
import { useTranslation } from "react-i18next";
import BrandLogo from "../../../components/Authentication/BrandLogo";
import SocialLogin from "../../../components/Authentication/SocialLogin";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { useTheme } from "../../../contexts/ThemeContext";
import useInputStyles from "../../../hooks/useInputStyles";
import { register } from "../../../store/slices/authSlice";
import illustrationImage from "../../../assets/illustrations/welcome-on-board.avif";
import "./Register.css";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const { inputClassNames } = useInputStyles();
  const { loading, error } = useSelector((state) => state.auth);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (termsAgreed && privacyAgreed) setAgreeToTerms(true);
  }, [termsAgreed, privacyAgreed]);

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = t("auth.register.validation.firstNameRequired");
    }

    if (!formData.lastName.trim()) {
      errors.lastName = t("auth.register.validation.lastNameRequired");
    }

    if (!formData.email.trim()) {
      errors.email = t("auth.register.validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("auth.register.validation.emailInvalid");
    }

    if (!formData.password) {
      errors.password = t("auth.register.validation.passwordRequired");
    } else if (formData.password.length < 6) {
      errors.password = t("auth.register.validation.passwordMinLength");
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = t(
        "auth.register.validation.confirmPasswordRequired",
      );
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t("auth.register.validation.passwordMismatch");
    }

    if (!agreeToTerms) {
      errors.terms = t("auth.register.validation.termsRequired");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        title: t("auth.register.validation.validationError"),
        description: t("auth.register.validation.validationErrorDescription"),
        color: "warning",
        timeout: 3000,
      });
      return;
    }

    const registerData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      userName: formData.email.trim(),
      email: formData.email.trim(),
      password: formData.password,
    };

    try {
      await dispatch(register(registerData)).unwrap();

      addToast({
        title: t("auth.register.success.title"),
        description: t("auth.register.success.checkEmail"),
        color: "success",
        timeout: 5000,
      });

      // Navigate to login after short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      // Error is handled by the error state
      console.error("Registration error:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div
      className="register-container"
      style={{ backgroundColor: colors.background.light }}
    >
      <div className="register-content">
        <motion.div
          className="register-illustration"
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
            alt="Student illustration"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
        </motion.div>

        <motion.div
          className="register-form-wrapper"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="register-header">
            <BrandLogo />

            <p
              className="text-center mb-6"
              style={{ color: colors.text.secondary }}
            >
              {t("auth.register.subtitle")}
            </p>
          </div>
          <div
            className="register-card"
            style={{ backgroundColor: colors.background.light }}
          >
            {error && (
              <Alert
                color="danger"
                title={t("auth.register.error.title")}
                description={error}
                className="mb-4"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("auth.register.firstName")}
                  </label>
                  <Input
                    type="text"
                    name="firstName"
                    placeholder={t("auth.register.firstNamePlaceholder")}
                    value={formData.firstName}
                    onChange={handleChange}
                    variant="flat"
                    size="lg"
                    isInvalid={!!validationErrors.firstName}
                    errorMessage={validationErrors.firstName}
                    classNames={inputClassNames}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("auth.register.lastName")}
                  </label>
                  <Input
                    type="text"
                    name="lastName"
                    placeholder={t("auth.register.lastNamePlaceholder")}
                    value={formData.lastName}
                    onChange={handleChange}
                    variant="flat"
                    size="lg"
                    isInvalid={!!validationErrors.lastName}
                    errorMessage={validationErrors.lastName}
                    classNames={inputClassNames}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("auth.register.email")}
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder={t("auth.register.emailPlaceholder")}
                    value={formData.email}
                    onChange={handleChange}
                    variant="flat"
                    size="lg"
                    isInvalid={!!validationErrors.email}
                    errorMessage={validationErrors.email}
                    classNames={inputClassNames}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {t("auth.register.password")}
                  </label>
                  <Input
                    type={isPasswordVisible ? "text" : "password"}
                    name="password"
                    placeholder={t("auth.register.passwordPlaceholder")}
                    value={formData.password}
                    onChange={handleChange}
                    variant="flat"
                    size="lg"
                    isInvalid={!!validationErrors.password}
                    errorMessage={validationErrors.password}
                    classNames={inputClassNames}
                    endContent={
                      <button
                        className="focus:outline-none"
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      >
                        {isPasswordVisible ? (
                          <EyeClosed
                            weight="BoldDuotone"
                            className="w-5 h-5"
                            style={{ color: colors.text.tertiary }}
                          />
                        ) : (
                          <Eye
                            weight="BoldDuotone"
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
                    {t("auth.register.confirmPassword")}
                  </label>
                  <Input
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    name="confirmPassword"
                    placeholder={t("auth.register.confirmPasswordPlaceholder")}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    variant="flat"
                    size="lg"
                    isInvalid={!!validationErrors.confirmPassword}
                    errorMessage={validationErrors.confirmPassword}
                    classNames={inputClassNames}
                    endContent={
                      <button
                        className="focus:outline-none"
                        type="button"
                        onClick={() =>
                          setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                        }
                      >
                        {isConfirmPasswordVisible ? (
                          <EyeClosed
                            weight="BoldDuotone"
                            className="w-5 h-5"
                            style={{ color: colors.text.tertiary }}
                          />
                        ) : (
                          <Eye
                            weight="BoldDuotone"
                            className="w-5 h-5"
                            style={{ color: colors.text.tertiary }}
                          />
                        )}
                      </button>
                    }
                  />
                </div>
              </div>

              <div className="mb-6">
                <Checkbox
                  isSelected={agreeToTerms}
                  onValueChange={(v) => {
                    setAgreeToTerms(v);
                    if (!v) { setTermsAgreed(false); setPrivacyAgreed(false); }
                  }}
                  size="sm"
                  classNames={{ label: "text-sm" }}
                >
                  <span
                    className="leading-relaxed"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("auth.register.agreeToTerms")}{" "}
                    <span
                      role="button"
                      tabIndex={0}
                      className="inline-flex items-center gap-1 cursor-pointer underline-offset-2 hover:underline"
                      style={{ color: termsAgreed ? colors.state.success : colors.primary.main }}
                      onClick={(e) => { e.stopPropagation(); setTermsOpen(true); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setTermsOpen(true); } }}
                    >
                      {termsAgreed && (
                        <CheckCircle weight="Bold" className="w-3.5 h-3.5" />
                      )}
                      {t("auth.register.termsAndConditions")}
                    </span>{" "}
                    {t("auth.register.and")}{" "}
                    <span
                      role="button"
                      tabIndex={0}
                      className="inline-flex items-center gap-1 cursor-pointer underline-offset-2 hover:underline"
                      style={{ color: privacyAgreed ? colors.state.success : colors.primary.main }}
                      onClick={(e) => { e.stopPropagation(); setPrivacyOpen(true); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setPrivacyOpen(true); } }}
                    >
                      {privacyAgreed && (
                        <CheckCircle weight="Bold" className="w-3.5 h-3.5" />
                      )}
                      {t("auth.register.privacyPolicy")}
                    </span>
                  </span>
                </Checkbox>
              </div>

              {validationErrors.terms && (
                <p className="text-sm text-danger">{validationErrors.terms}</p>
              )}

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full font-medium"
                isLoading={loading}
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
              >
                {loading
                  ? t("auth.register.registering")
                  : t("auth.register.createAccount")}
              </Button>

              <SocialLogin text={t("auth.register.socialText")} />
            </form>
          </div>
          <div
            className="text-center text-lg"
            style={{ width: "100%", maxWidth: "580px" }}
          >
            <span style={{ color: colors.text.secondary }}>
              {t("auth.register.hasAccount")}{" "}
            </span>
            <Link
              onClick={() => navigate("/login")}
              className="cursor-pointer text-lg font-semibold"
              style={{ color: colors.primary.main }}
            >
              {t("auth.register.signIn")}
            </Link>
          </div>
        </motion.div>
      </div>

      <LegalModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
        data={TERMS}
        onAgree={() => setTermsAgreed(true)}
        hasAgreed={termsAgreed}
      />
      <LegalModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        data={PRIVACY}
        onAgree={() => setPrivacyAgreed(true)}
        hasAgreed={privacyAgreed}
      />
    </div>
  );
};

export default Register;
