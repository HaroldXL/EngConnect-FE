import React, { useState, useRef } from "react";
import { CloseSquare, DocumentText, Stars, Suitcase, Videocamera } from "@solar-icons/react"
import { Input, Button, Textarea, Image, Alert, addToast } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as MotionLib from "framer-motion";
import { useTranslation } from "react-i18next";

import BrandLogo from "../../components/Authentication/BrandLogo";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";
import useInputStyles from "../../hooks/useInputStyles";
import {
  registerTutor,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import illustrationImage from "../../assets/illustrations/contract.avif";
import "./TutorRegistration.css";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const TutorRegistration = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const { inputClassNames, textareaClassNames } = useInputStyles();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { loading, error } = useSelector((state) => state.auth);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    headline: "",
    bio: "",
    MonthExperience: "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const cvInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Redirect to register if not authenticated
  if (!isAuthenticated) {
    navigate("/register");
    return null;
  }

  const validateForm = () => {
    const errors = {};

    if (!formData.headline.trim()) {
      errors.headline = t("tutorRegistration.validation.headlineRequired");
    } else if (formData.headline.length < 10) {
      errors.headline = t("tutorRegistration.validation.headlineMinLength");
    }

    if (!formData.bio.trim()) {
      errors.bio = t("tutorRegistration.validation.bioRequired");
    } else if (formData.bio.length < 50) {
      errors.bio = t("tutorRegistration.validation.bioMinLength");
    }

    if (!formData.MonthExperience) {
      errors.MonthExperience = t(
        "tutorRegistration.validation.MonthExperienceRequired",
      );
    } else if (
      Number.isNaN(Number(formData.MonthExperience)) ||
      Number(formData.MonthExperience) < 0
    ) {
      errors.MonthExperience = t(
        "tutorRegistration.validation.MonthExperienceInvalid",
      );
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        title: t("tutorRegistration.validation.validationError"),
        description: t(
          "tutorRegistration.validation.validationErrorDescription",
        ),
        color: "warning",
        timeout: 3000,
      });
      return;
    }

    const tutorData = {
      headline: formData.headline.trim(),
      bio: formData.bio.trim(),
      MonthExperience: Number(formData.MonthExperience),
      cvFile: cvFile || null,
      introVideoFile: introVideoFile || null,
    };

    try {
      await dispatch(registerTutor(tutorData)).unwrap();

      addToast({
        title: t("tutorRegistration.success.title"),
        description: t("tutorRegistration.success.description"),
        color: "success",
        timeout: 5000,
      });

      navigate("/tutor/onboarding");
    } catch (err) {
      console.error("Tutor registration error:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div
      className="tutor-register-container"
      style={{ backgroundColor: colors.background.light }}
    >
      <div className="tutor-register-content">
        <motion.div
          className="tutor-register-illustration"
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
            alt="Tutor registration"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
        </motion.div>

        <motion.div
          className="tutor-register-form-wrapper"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="tutor-register-header">
            <BrandLogo />

            <div className="text-center mb-2">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: colors.background.primaryLight,
                  color: colors.primary.main,
                }}
              >
                <Stars weight="BoldDuotone" className="w-4 h-4" />
                {t("tutorRegistration.badge")}
              </span>
            </div>

            <p
              className="text-center mb-6"
              style={{ color: colors.text.secondary }}
            >
              {t("tutorRegistration.subtitle")}
            </p>
          </div>

          <div
            className="tutor-register-card"
            style={{ backgroundColor: colors.background.light }}
          >
            {error && (
              <Alert
                color="danger"
                title={t("tutorRegistration.error.title")}
                description={error}
                className="mb-4"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Headline */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorRegistration.headline")}
                </label>
                <Input
                  type="text"
                  name="headline"
                  placeholder={t("tutorRegistration.headlinePlaceholder")}
                  value={formData.headline}
                  onChange={handleChange}
                  variant="flat"
                  size="lg"
                  isInvalid={!!validationErrors.headline}
                  errorMessage={validationErrors.headline}
                  classNames={inputClassNames}
                  startContent={
                    <Suitcase weight="BoldDuotone"
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: colors.text.tertiary }}
                    />
                  }
                />
              </div>

              {/* Bio */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorRegistration.bio")}
                </label>
                <Textarea
                  name="bio"
                  placeholder={t("tutorRegistration.bioPlaceholder")}
                  value={formData.bio}
                  onChange={handleChange}
                  variant="flat"
                  size="lg"
                  minRows={4}
                  maxRows={6}
                  isInvalid={!!validationErrors.bio}
                  errorMessage={validationErrors.bio}
                  classNames={textareaClassNames}
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: colors.text.tertiary }}
                >
                  {formData.bio.length}/500 {t("tutorRegistration.characters")}
                </p>
              </div>

              {/* Experience */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorRegistration.MonthExperience")}
                </label>
                <Input
                  type="number"
                  name="MonthExperience"
                  placeholder={t(
                    "tutorRegistration.MonthExperiencePlaceholder",
                  )}
                  value={formData.MonthExperience}
                  onChange={handleChange}
                  variant="flat"
                  size="lg"
                  min={0}
                  isInvalid={!!validationErrors.MonthExperience}
                  errorMessage={validationErrors.MonthExperience}
                  classNames={inputClassNames}
                  startContent={
                    <Suitcase weight="BoldDuotone"
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: colors.text.tertiary }}
                    />
                  }
                />
              </div>

              {/* CV Upload (optional) */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorRegistration.cvFile")}
                </label>
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.gray,
                  }}
                  onClick={() => cvInputRef.current?.click()}
                >
                  <DocumentText weight="BoldDuotone"
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: colors.primary.main }}
                  />
                  <span
                    className="text-sm flex-1 truncate"
                    style={{
                      color: cvFile
                        ? colors.text.primary
                        : colors.text.tertiary,
                    }}
                  >
                    {cvFile
                      ? cvFile.name
                      : t("tutorRegistration.cvUploadPrompt")}
                  </span>
                  {cvFile && (
                    <button
                      type="button"
                      className="ml-auto p-1 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCvFile(null);
                        if (cvInputRef.current) cvInputRef.current.value = "";
                      }}
                    >
                      <CloseSquare weight="BoldDuotone"
                        className="w-4 h-4"
                        style={{ color: colors.text.tertiary }}
                      />
                    </button>
                  )}
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("tutorRegistration.cvFormats")}
                </p>
                <input
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setCvFile(e.target.files[0] || null)}
                />
              </div>

              {/* Intro Videocamera Upload (optional) */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorRegistration.introVideo")}
                </label>
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.gray,
                  }}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Videocamera weight="BoldDuotone"
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: colors.primary.main }}
                  />
                  <span
                    className="text-sm flex-1 truncate"
                    style={{
                      color: introVideoFile
                        ? colors.text.primary
                        : colors.text.tertiary,
                    }}
                  >
                    {introVideoFile
                      ? introVideoFile.name
                      : t("tutorRegistration.videoUploadPrompt")}
                  </span>
                  {introVideoFile && (
                    <button
                      type="button"
                      className="ml-auto p-1 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIntroVideoFile(null);
                        if (videoInputRef.current)
                          videoInputRef.current.value = "";
                      }}
                    >
                      <CloseSquare weight="BoldDuotone"
                        className="w-4 h-4"
                        style={{ color: colors.text.tertiary }}
                      />
                    </button>
                  )}
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("tutorRegistration.videoFormats")}
                </p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/mov"
                  className="hidden"
                  onChange={(e) => setIntroVideoFile(e.target.files[0] || null)}
                />
              </div>

              {/* Submit */}
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
                  ? t("tutorRegistration.submitting")
                  : t("tutorRegistration.submitButton")}
              </Button>
            </form>
          </div>

          <div
            className="text-center text-lg"
            style={{ width: "100%", maxWidth: "600px" }}
          >
            <span style={{ color: colors.text.secondary }}>
              {t("tutorRegistration.learnMore")}{" "}
            </span>
            <Button
              variant="light"
              className="text-lg font-semibold p-0"
              style={{ color: colors.primary.main }}
              onPress={() => navigate("/become-tutor")}
            >
              {t("tutorRegistration.learnMoreLink")}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TutorRegistration;
