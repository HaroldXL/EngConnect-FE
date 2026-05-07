import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  Button,
  Input,
  Textarea,
  Spinner,
  Avatar,
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import * as MotionLib from "framer-motion";
// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import VideoModal from "../../../components/VideoModal/VideoModal";
import { tutorApi } from "../../../api/tutorApi";
import { authApi } from "../../../api/authApi";
import { selectUser, updateUserInfo } from "../../../store";
import logoImage from "../../../assets/images/logo.png";
import {
  CheckCircle,
  FileText,
  VideoCamera,
  Upload,
  SealCheck,
  Camera,
  Eye,
  Bank,
  CaretDown,
} from "@phosphor-icons/react";
import BankSelectModal, {
  BANK_LIST,
} from "../../../components/BankSelectModal/BankSelectModal";

const TutorOnboarding = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const { inputClassNames, textareaClassNames } = useInputStyles();

  const [tutorProfile, setTutorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [introVideoOpen, setIntroVideoOpen] = useState(false);

  const [bankForm, setBankForm] = useState({
    bankCode: "",
    bankAccountNumber: "",
    bankAccountName: "",
    password: "",
  });
  const [bankSelectOpen, setBankSelectOpen] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    monthExperience: "",
  });

  const cvInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const data = await tutorApi.getTutorProfile();
      if (data.isSuccess) {
        const p = data.data;
        setTutorProfile(p);
        if (p.verifiedStatus === "Verified" || p.verifiedStatus === "Pending") {
          navigate("/tutor/dashboard", { replace: true });
          return;
        }
        setFormData({
          firstName: p.user?.firstName || "",
          lastName: p.user?.lastName || "",
          headline: p.headline || "",
          bio: p.bio || "",
          monthExperience:
            p.monthExperience !== null && p.monthExperience !== undefined
              ? String(p.monthExperience)
              : "",
        });
        setBankForm((prev) => ({
          bankCode: p.bankCode || "",
          bankAccountNumber: p.bankAccountNumber || "",
          bankAccountName: p.bankAccountName || "",
          password: prev.password,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch tutor profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Progress steps
  const steps = [
    { key: "headline", done: !!formData.headline.trim() },
    { key: "bio", done: !!formData.bio.trim() },
    {
      key: "MonthExperience",
      done:
        formData.monthExperience !== "" &&
        Number(formData.monthExperience) >= 0,
    },
    { key: "cv", done: !!tutorProfile?.cvUrl },
    { key: "video", done: !!tutorProfile?.introVideoUrl },
    {
      key: "bank",
      done: !!(
        tutorProfile?.bankCode &&
        tutorProfile?.bankAccountNumber &&
        tutorProfile?.bankAccountName
      ),
    },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  const handleSaveProfile = async () => {
    if (!tutorProfile?.id) return;
    setSaving(true);
    try {
      const [tutorData] = await Promise.all([
        tutorApi.updateTutorById(tutorProfile.id, {
          headline: formData.headline.trim(),
          bio: formData.bio.trim(),
          monthExperience: Number(formData.monthExperience),
          status: "Active",
        }),
        authApi.updateUser(currentUser.userId, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        }),
      ]);
      if (tutorData.isSuccess) {
        dispatch(
          updateUserInfo({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
          }),
        );
        await fetchProfile();
        addToast({
          title: t("tutorOnboarding.profileSaved"),
          color: "success",
        });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: t("tutorOnboarding.saveFailed"), color: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCvUploading(true);
    try {
      const data = await tutorApi.uploadCv(file, file.name);
      if (data.isSuccess) {
        await fetchProfile();
        addToast({ title: t("tutorOnboarding.cvUploaded"), color: "success" });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: t("tutorOnboarding.cvUploadFailed"), color: "danger" });
    } finally {
      setCvUploading(false);
      if (cvInputRef.current) cvInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoUploading(true);
    try {
      const data = await tutorApi.uploadIntroVideo(file, file.name);
      if (data.isSuccess) {
        await fetchProfile();
        addToast({
          title: t("tutorOnboarding.videoUploaded"),
          color: "success",
        });
      }
    } catch (err) {
      console.error(err);
      addToast({
        title: t("tutorOnboarding.videoUploadFailed"),
        color: "danger",
      });
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const data = await tutorApi.uploadAvatar(file, file.name);
      if (data.isSuccess) {
        await fetchProfile();
        addToast({
          title: t("tutorOnboarding.avatarUploaded"),
          color: "success",
        });
      }
    } catch (err) {
      console.error(err);
      addToast({
        title: t("tutorOnboarding.avatarUploadFailed"),
        color: "danger",
      });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSubmitVerification = async () => {
    setSubmitting(true);
    try {
      const data = await tutorApi.submitVerificationRequest();
      if (data.isSuccess) {
        addToast({
          title: t("tutorOnboarding.submitSuccess"),
          color: "success",
        });
        navigate("/courses");
      }
    } catch (err) {
      console.error(err);
      addToast({ title: t("tutorOnboarding.submitFailed"), color: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBankInfo = async () => {
    setBankError("");
    setBankSaving(true);
    try {
      const data = await tutorApi.updateBankInfo({
        bankCode: bankForm.bankCode,
        bankAccountNumber: bankForm.bankAccountNumber.trim(),
        bankAccountName: bankForm.bankAccountName.trim(),
        password: bankForm.password,
      });
      if (data.isSuccess) {
        await fetchProfile();
        setBankForm((prev) => ({ ...prev, password: "" }));
        addToast({ title: t("tutorOnboarding.bankSaved"), color: "success" });
      }
    } catch (err) {
      const errorCode = err.response?.data?.error?.code;
      if (errorCode === "User.InvalidPassword") {
        setBankError(t("tutorOnboarding.bankInvalidPassword"));
      } else if (errorCode === "Validation.Failed") {
        setBankError(t("tutorOnboarding.bankValidationFailed"));
      } else {
        setBankError(t("tutorOnboarding.bankSaveFailed"));
      }
    } finally {
      setBankSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background.page }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  const cardStyle = {
    backgroundColor: colors.background.card,
  };

  const stepNumber = (index, done) => (
    <div
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
      style={{
        backgroundColor: done ? colors.primary.main : colors.background.gray,
        color: done ? colors.text.white : colors.text.tertiary,
      }}
    >
      {done ? (
        <CheckCircle weight="fill" className="w-4 h-4 sm:w-5 sm:h-5" />
      ) : (
        <span className="text-xs sm:text-sm font-semibold">{index + 1}</span>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background.gray }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-sm px-4 sm:px-6 py-2 flex items-center"
        style={{
          backgroundColor: `${colors.background.card}ee`,
        }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logoImage}
            alt="EngConnect"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            className="h-9 w-auto"
          />
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-6 sm:mb-10"
        >
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
            style={{ backgroundColor: colors.background.primaryLight }}
          >
            <SealCheck
              weight="duotone"
              className="w-7 h-7 sm:w-8 sm:h-8"
              style={{ color: colors.primary.main }}
            />
          </div>
          <h1
            className="text-xl sm:text-2xl font-bold mb-1.5"
            style={{ color: colors.text.primary }}
          >
            {t("tutorOnboarding.title")}
          </h1>
          <p
            className="text-sm sm:text-base max-w-md mx-auto"
            style={{ color: colors.text.secondary }}
          >
            {t("tutorOnboarding.subtitle")}
          </p>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-2xl"
          style={cardStyle}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-sm font-medium"
              style={{ color: colors.text.primary }}
            >
              {t("tutorOnboarding.progress")}
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: colors.primary.main }}
            >
              {completedSteps}/{steps.length}
            </span>
          </div>
          <div
            className="h-2 sm:h-2.5 rounded-full overflow-hidden mb-4"
            style={{ backgroundColor: colors.background.gray }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: colors.primary.main }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex items-start justify-between gap-1 sm:gap-2">
            {steps.map((step, i) => (
              <div
                key={step.key}
                className="flex flex-col items-center gap-1.5 flex-1 min-w-0"
              >
                {stepNumber(i, step.done)}
                <span
                  className="text-[10px] sm:text-xs text-center leading-tight font-medium"
                  style={{
                    color: step.done
                      ? colors.text.primary
                      : colors.text.tertiary,
                  }}
                >
                  {t(`tutorOnboarding.steps.${step.key}`)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main content — 2-column on lg, single on mobile */}
        <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 mb-6 sm:mb-8">
          {/* Left column — Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex-1 p-5 sm:p-6 rounded-2xl"
            style={cardStyle}
          >
            <h2
              className="text-base sm:text-lg font-semibold mb-4 sm:mb-5"
              style={{ color: colors.text.primary }}
            >
              {t("tutorOnboarding.profileSection")}
            </h2>

            {/* Avatar */}
            {tutorProfile && (
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="relative cursor-pointer shrink-0"
                  role="button"
                  tabIndex={0}
                  onClick={() => avatarInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && avatarInputRef.current?.click()
                  }
                >
                  {avatarUploading ? (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <Spinner size="sm" />
                    </div>
                  ) : (
                    <>
                      <Avatar src={tutorProfile.avatar} className="w-16 h-16" />
                      <div
                        className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                      >
                        <Camera weight="fill" className="w-5 h-5 text-white" />
                      </div>
                    </>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      variant="flat"
                      size="md"
                      label={t("tutorOnboarding.firstName")}
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          firstName: e.target.value,
                        }))
                      }
                      placeholder={t("tutorOnboarding.firstNamePlaceholder")}
                      aria-label={t("tutorOnboarding.firstName")}
                      classNames={inputClassNames}
                    />
                    <Input
                      variant="flat"
                      size="md"
                      label={t("tutorOnboarding.lastName")}
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          lastName: e.target.value,
                        }))
                      }
                      placeholder={t("tutorOnboarding.lastNamePlaceholder")}
                      aria-label={t("tutorOnboarding.lastName")}
                      classNames={inputClassNames}
                    />
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("tutorOnboarding.avatarHint")}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorRegistration.headline")}
                </label>
                <Input
                  variant="flat"
                  size="lg"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, headline: e.target.value }))
                  }
                  placeholder={t("tutorRegistration.headlinePlaceholder")}
                  classNames={inputClassNames}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorRegistration.bio")}
                </label>
                <Textarea
                  variant="flat"
                  size="lg"
                  minRows={3}
                  maxRows={6}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder={t("tutorRegistration.bioPlaceholder")}
                  classNames={textareaClassNames}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorRegistration.MonthExperience")}
                </label>
                <Input
                  type="number"
                  variant="flat"
                  size="lg"
                  min={0}
                  value={formData.monthExperience}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      monthExperience: e.target.value,
                    }))
                  }
                  placeholder={t(
                    "tutorRegistration.MonthExperiencePlaceholder",
                  )}
                  classNames={inputClassNames}
                />
              </div>
              <Button
                className="w-full font-medium"
                size="lg"
                isLoading={saving}
                onPress={handleSaveProfile}
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
              >
                {t("tutorOnboarding.saveProfile")}
              </Button>
            </div>
          </motion.div>

          {/* Right column — Uploads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="lg:w-[380px] xl:w-[420px] flex flex-col gap-5 sm:gap-6"
          >
            {/* CV Upload */}
            <div className="p-5 sm:p-6 rounded-2xl" style={cardStyle}>
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: colors.background.primaryLight }}
                >
                  <FileText
                    weight="duotone"
                    className="w-4.5 h-4.5"
                    style={{ color: colors.primary.main }}
                  />
                </div>
                <h2
                  className="text-base sm:text-lg font-semibold flex-1"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorOnboarding.cvSection")}
                </h2>
                {tutorProfile?.cvUrl && (
                  <CheckCircle
                    weight="fill"
                    className="w-5 h-5 shrink-0"
                    style={{ color: colors.state.success }}
                  />
                )}
              </div>
              {tutorProfile?.cvUrl ? (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: `${colors.primary.main}12` }}
                >
                  <FileText
                    weight="duotone"
                    className="w-5 h-5 shrink-0"
                    style={{ color: colors.primary.main }}
                  />
                  <span
                    className="text-sm flex-1 truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {t("tutorOnboarding.cvUploaded")}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="light"
                      as="a"
                      href={tutorProfile.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: colors.primary.main }}
                    >
                      <Eye weight="bold" className="w-4 h-4" />
                      {t("tutorOnboarding.view")}
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      isLoading={cvUploading}
                      onPress={() => cvInputRef.current?.click()}
                      style={{ color: colors.primary.main }}
                    >
                      {t("tutorOnboarding.replace")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  style={{ borderColor: colors.border.medium }}
                  role="button"
                  tabIndex={0}
                  onClick={() => cvInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && cvInputRef.current?.click()
                  }
                >
                  {cvUploading ? (
                    <Spinner size="md" />
                  ) : (
                    <>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <Upload
                          weight="duotone"
                          className="w-5 h-5"
                          style={{ color: colors.text.tertiary }}
                        />
                      </div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: colors.text.primary }}
                      >
                        {t("tutorOnboarding.cvUploadPrompt")}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: colors.text.tertiary }}
                      >
                        PDF, DOC, DOCX
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleCvUpload}
              />
            </div>

            {/* Video Upload */}
            <div className="p-5 sm:p-6 rounded-2xl" style={cardStyle}>
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: colors.background.primaryLight }}
                >
                  <VideoCamera
                    weight="duotone"
                    className="w-4.5 h-4.5"
                    style={{ color: colors.primary.main }}
                  />
                </div>
                <h2
                  className="text-base sm:text-lg font-semibold flex-1"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorOnboarding.videoSection")}
                </h2>
                {tutorProfile?.introVideoUrl && (
                  <CheckCircle
                    weight="fill"
                    className="w-5 h-5 shrink-0"
                    style={{ color: colors.state.success }}
                  />
                )}
              </div>
              {tutorProfile?.introVideoUrl ? (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: `${colors.primary.main}12` }}
                >
                  <VideoCamera
                    weight="duotone"
                    className="w-5 h-5 shrink-0"
                    style={{ color: colors.primary.main }}
                  />
                  <span
                    className="text-sm flex-1 truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {t("tutorOnboarding.videoUploaded")}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => setIntroVideoOpen(true)}
                      style={{ color: colors.primary.main }}
                    >
                      <Eye weight="bold" className="w-4 h-4" />
                      {t("tutorOnboarding.view")}
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      isLoading={videoUploading}
                      onPress={() => videoInputRef.current?.click()}
                      style={{ color: colors.primary.main }}
                    >
                      {t("tutorOnboarding.replace")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  style={{ borderColor: colors.border.medium }}
                  role="button"
                  tabIndex={0}
                  onClick={() => videoInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && videoInputRef.current?.click()
                  }
                >
                  {videoUploading ? (
                    <Spinner size="md" />
                  ) : (
                    <>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <Upload
                          weight="duotone"
                          className="w-5 h-5"
                          style={{ color: colors.text.tertiary }}
                        />
                      </div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: colors.text.primary }}
                      >
                        {t("tutorOnboarding.videoUploadPrompt")}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: colors.text.tertiary }}
                      >
                        MP4, WebM, MOV
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/mov"
                className="hidden"
                onChange={handleVideoUpload}
              />
            </div>
          </motion.div>
        </div>

        {/* Bank Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
          className="p-5 sm:p-6 rounded-2xl mb-6 sm:mb-8"
          style={cardStyle}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: colors.background.primaryLight }}
            >
              <Bank
                weight="duotone"
                className="w-4.5 h-4.5"
                style={{ color: colors.primary.main }}
              />
            </div>
            <h2
              className="text-base sm:text-lg font-semibold flex-1"
              style={{ color: colors.text.primary }}
            >
              {t("tutorOnboarding.bankSection")}
            </h2>
            {tutorProfile?.bankCode &&
              tutorProfile?.bankAccountNumber &&
              tutorProfile?.bankAccountName && (
                <CheckCircle
                  weight="fill"
                  className="w-5 h-5 shrink-0"
                  style={{ color: colors.state.success }}
                />
              )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bank selector */}
            <div className="sm:col-span-2">
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: colors.text.primary }}
              >
                {t("tutorOnboarding.bankCode")}
              </label>
              <button
                type="button"
                onClick={() => setBankSelectOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left"
                style={{
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.medium,
                  color: bankForm.bankCode
                    ? colors.text.primary
                    : colors.text.tertiary,
                }}
              >
                {bankForm.bankCode ? (
                  <>
                    <img
                      src={`https://api.vietqr.io/img/${bankForm.bankCode}.png`}
                      alt={bankForm.bankCode}
                      className="w-20 h-7 object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <span className="flex-1 text-sm font-medium">
                      {BANK_LIST.find((b) => b.code === bankForm.bankCode)
                        ?.name ?? bankForm.bankCode}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-sm">
                    {t("tutorOnboarding.bankCodePlaceholder")}
                  </span>
                )}
                <CaretDown className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Account number */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: colors.text.primary }}
              >
                {t("tutorOnboarding.bankAccountNumber")}
              </label>
              <Input
                variant="flat"
                size="lg"
                value={bankForm.bankAccountNumber}
                onChange={(e) =>
                  setBankForm((p) => ({
                    ...p,
                    bankAccountNumber: e.target.value,
                  }))
                }
                placeholder={t("tutorOnboarding.bankAccountNumberPlaceholder")}
                classNames={inputClassNames}
              />
            </div>

            {/* Account name */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: colors.text.primary }}
              >
                {t("tutorOnboarding.bankAccountName")}
              </label>
              <Input
                variant="flat"
                size="lg"
                value={bankForm.bankAccountName}
                onChange={(e) =>
                  setBankForm((p) => ({
                    ...p,
                    bankAccountName: e.target.value,
                  }))
                }
                placeholder={t("tutorOnboarding.bankAccountNamePlaceholder")}
                classNames={inputClassNames}
              />
            </div>

            {/* Password confirmation */}
            <div className="sm:col-span-2">
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: colors.text.primary }}
              >
                {t("tutorOnboarding.password")}
              </label>
              <Input
                type="password"
                variant="flat"
                size="lg"
                value={bankForm.password}
                onChange={(e) =>
                  setBankForm((p) => ({ ...p, password: e.target.value }))
                }
                placeholder={t("tutorOnboarding.passwordPlaceholder")}
                classNames={inputClassNames}
              />
            </div>
          </div>

          {bankError && (
            <p
              className="mt-3 text-sm font-medium"
              style={{ color: colors.state.error }}
            >
              {bankError}
            </p>
          )}

          <Button
            className="w-full mt-4 font-medium"
            size="lg"
            isLoading={bankSaving}
            isDisabled={
              !bankForm.bankCode ||
              !bankForm.bankAccountNumber.trim() ||
              !bankForm.bankAccountName.trim() ||
              !bankForm.password
            }
            onPress={handleSaveBankInfo}
            style={{
              backgroundColor: colors.primary.main,
              color: colors.text.white,
            }}
          >
            {t("tutorOnboarding.saveBank")}
          </Button>
        </motion.div>

        {/* Submit for Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-5 sm:p-6 rounded-2xl"
          style={cardStyle}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-base mb-0.5"
                style={{ color: colors.text.primary }}
              >
                {t("tutorOnboarding.submitVerification")}
              </h3>
              {completedSteps < steps.length && (
                <p className="text-sm" style={{ color: colors.text.tertiary }}>
                  {t("tutorOnboarding.submitHint", {
                    count: steps.length - completedSteps,
                  })}
                </p>
              )}
            </div>
            <Button
              size="lg"
              className="font-semibold text-sm sm:text-base sm:px-8 w-full sm:w-auto shrink-0"
              isLoading={submitting}
              isDisabled={
                !tutorProfile?.bankCode ||
                !tutorProfile?.bankBin ||
                !tutorProfile?.bankAccountNumber ||
                !tutorProfile?.bankAccountName
              }
              onPress={handleSubmitVerification}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
            >
              <SealCheck weight="fill" className="w-5 h-5 mr-1.5" />
              {t("tutorOnboarding.submitVerification")}
            </Button>
          </div>
        </motion.div>
      </div>

      <VideoModal
        isOpen={introVideoOpen}
        onOpenChange={setIntroVideoOpen}
        videoUrl={tutorProfile?.introVideoUrl}
      />

      <BankSelectModal
        isOpen={bankSelectOpen}
        onOpenChange={setBankSelectOpen}
        selectedBankCode={bankForm.bankCode}
        onSelect={(bank) => {
          setBankForm((p) => ({ ...p, bankCode: bank.code }));
          setBankSelectOpen(false);
        }}
      />
    </div>
  );
};

export default TutorOnboarding;
