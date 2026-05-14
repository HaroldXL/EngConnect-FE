import React, { useState, useEffect } from "react";
import { Eye, EyeClosed } from "@solar-icons/react";
import {
  Input,
  Button,
  Link,
  Checkbox,
  Image,
  Alert,
  addToast,
} from "@heroui/react";

import { useNavigate } from "react-router-dom";
import * as MotionLib from "framer-motion";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { login, selectAuth, clearError } from "../../../store";
import BrandLogo from "../../../components/Authentication/BrandLogo";
import SocialLogin from "../../../components/Authentication/SocialLogin";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { useTheme } from "../../../contexts/ThemeContext";
import useInputStyles from "../../../hooks/useInputStyles";
import illustrationImage from "../../../assets/illustrations/archive.avif";
import "./Login.css";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const { inputClassNames } = useInputStyles();
  const { loading, error } = useSelector(selectAuth);
  const [isVisible, setIsVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const validateForm = () => {
    const errors = {
      email: "",
      password: "",
    };

    // Email validation
    if (!formData.email) {
      errors.email = t("auth.login.emailRequired") || "Please enter your email";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      errors.email =
        t("auth.login.emailInvalid") || "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password =
        t("auth.login.passwordRequired") || "Please enter your password";
    } else if (formData.password.length < 6) {
      errors.password =
        t("auth.login.passwordMinLength") ||
        "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(login(formData)).unwrap();
      // Login successful
      console.log("Login successful:", result);
      addToast({
        title: t("auth.login.loginSuccess"),
        description: t("auth.login.loginSuccessDescription"),
        color: "success",
        timeout: 3000,
      });
      const isAdmin = result.user?.roles?.includes("Admin");
      navigate(isAdmin ? "/admin/dashboard" : "/courses");
    } catch (err) {
      // Error is handled by Redux and displayed in UI
      console.error("Login failed:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: "",
      });
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundColor: colors.background.light }}
    >
      <div className="login-content">
        <motion.div
          className="login-illustration"
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
          className="login-form-wrapper"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="login-header">
            <BrandLogo />

            <p
              className="text-center mb-8"
              style={{ color: colors.text.secondary }}
            >
              {t("auth.login.subtitle")}
            </p>
          </div>
          <div
            className="login-card"
            style={{ backgroundColor: colors.background.light }}
          >
            {error && (
              <Alert
                color="danger"
                variant="flat"
                className="mb-4"
                title={error?.i18nKey ? t(error.i18nKey) : error}
              />
            )}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("auth.login.email")}
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder={t("auth.login.emailPlaceholder")}
                  value={formData.email}
                  onChange={handleChange}
                  variant="flat"
                  size="lg"
                  isInvalid={!!validationErrors.email}
                  errorMessage={validationErrors.email}
                  classNames={inputClassNames}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("auth.login.password")}
                </label>
                <Input
                  type={isVisible ? "text" : "password"}
                  name="password"
                  placeholder={t("auth.login.passwordPlaceholder")}
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
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <EyeClosed
                          weight="BoldDuotone"
                          style={{ color: colors.text.tertiary }}
                          className="w-5 h-5"
                        />
                      ) : (
                        <Eye
                          weight="BoldDuotone"
                          style={{ color: colors.text.tertiary }}
                          className="w-5 h-5"
                        />
                      )}
                    </button>
                  }
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <Checkbox
                  isSelected={rememberMe}
                  onValueChange={setRememberMe}
                  size="sm"
                  classNames={{
                    label: "text-sm",
                  }}
                >
                  <span style={{ color: colors.text.secondary }}>
                    {t("auth.login.rememberMe")}
                  </span>
                </Checkbox>

                <Link
                  onClick={() => navigate("/forgot-password")}
                  size="sm"
                  className="cursor-pointer"
                  style={{ color: colors.primary.main }}
                >
                  {t("auth.login.forgotPassword")}
                </Link>
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
                  ? t("auth.login.loggingIn") || "Đang đăng nhập..."
                  : t("auth.login.loginButton")}
              </Button>

              <SocialLogin text={t("auth.login.socialText")} />
            </form>
          </div>
          <div
            className="text-center text-lg"
            style={{ width: "100%", maxWidth: "480px" }}
          >
            <span style={{ color: colors.text.secondary }}>
              {t("auth.login.noAccount")}{" "}
            </span>
            <Link
              onClick={() => navigate("/register")}
              className="cursor-pointer text-lg font-semibold"
              style={{ color: colors.primary.main }}
            >
              {t("auth.login.signUp")}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
