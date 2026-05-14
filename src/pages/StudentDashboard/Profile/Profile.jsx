import { useState, useEffect, useRef } from "react";
import { AltArrowDown, AltArrowRight, BookBookmark, Camera, Card as CardIcon, CheckCircle, Letter, LockKeyhole, Notes, Pen, SquareAcademicCap, UserRounded } from "@solar-icons/react"
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Input,
  Divider,
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";

import BankSelectModal, {
  BANK_LIST,
} from "../../../components/BankSelectModal/BankSelectModal";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../../../api";
import { authApi } from "../../../api/authApi";
import ProfileSkeleton from "../../../components/ProfileSkeleton/ProfileSkeleton";
import { useDispatch, useSelector } from "react-redux";
import { updateUserAvatar, updateUserInfo, selectUser } from "../../../store";

const Profile = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames } = useInputStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isTutor = !!user?.tutorId;
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [studentUserId, setStudentUserId] = useState("");
  const fileInputRef = useRef(null);
  const [originalData, setOriginalData] = useState(null);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    notes: "",
    school: "",
    grade: "",
    class: "",
    avatar: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [bankForm, setBankForm] = useState({
    bankCode: "",
    bankAccountNumber: "",
    bankAccountName: "",
    password: "",
  });
  const [bankSelectOpen, setBankSelectOpen] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState("");
  const [isBankEditing, setIsBankEditing] = useState(false);
  const [originalBankForm, setOriginalBankForm] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, avatarRes] = await Promise.all([
          studentApi.getStudentProfile(),
          studentApi.getStudentAvatar().catch(() => null),
        ]);
        const d = profileRes.data;
        const avatarUrl = avatarRes?.data?.url || d.avatar || "";
        setStudentId(d.id);
        setStudentUserId(d.userId);
        const data = {
          firstName: d.user?.firstName || "",
          lastName: d.user?.lastName || "",
          email: d.user?.email || "",
          notes: d.notes || "",
          school: d.school || "",
          grade: d.grade || "",
          class: d.class || "",
          avatar: avatarUrl,
        };
        setProfileData(data);
        setOriginalData(data);
        setBankForm({
          bankCode: d.bankCode || "",
          bankAccountNumber: d.bankAccountNumber || "",
          bankAccountName: d.bankAccountName || "",
          password: "",
        });
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        studentApi.updateStudentById(studentId, studentUserId, {
          id: studentId,
          userId: studentUserId,
          notes: profileData.notes,
          school: profileData.school,
          grade: profileData.grade,
          class: profileData.class,
        }),
        authApi.updateUser(studentUserId, {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        }),
      ]);
      setIsEditing(false);
      setOriginalData((prev) => ({
        ...prev,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        notes: profileData.notes,
        school: profileData.school,
        grade: profileData.grade,
        class: profileData.class,
      }));
      dispatch(
        updateUserInfo({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        }),
      );
      addToast({
        title: t("studentDashboard.profile.profileUpdated"),
        color: "success",
        timeout: 3000,
      });
    } catch (err) {
      console.error("Failed to update profile", err);
      addToast({
        title: t("studentDashboard.profile.profileUpdateFailed"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await studentApi.updateStudentAvatar(file);
      const res = await studentApi.getStudentAvatar();
      const newUrl = res?.data?.url || "";
      dispatch(updateUserAvatar(newUrl));
      setProfileData((prev) => ({ ...prev, avatar: newUrl }));
    } catch (err) {
      console.error("Failed to update avatar", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveBankInfo = async () => {
    setBankError("");
    setBankSaving(true);
    try {
      const data = await studentApi.updateBankInfo({
        bankCode: bankForm.bankCode,
        bankAccountNumber: bankForm.bankAccountNumber.trim(),
        bankAccountName: bankForm.bankAccountName.trim(),
        password: bankForm.password,
      });
      if (data.isSuccess) {
        setBankForm((prev) => ({ ...prev, password: "" }));
        setIsBankEditing(false);
        addToast({
          title: t("tutorOnboarding.bankSaved"),
          color: "success",
          timeout: 3000,
        });
      }
    } catch (err) {
      const errorCode = err.response?.data?.error?.code;
      if (errorCode === "UserRounded.InvalidPassword")
        setBankError(t("tutorOnboarding.bankInvalidPassword"));
      else if (errorCode === "Validation.Failed")
        setBankError(t("tutorOnboarding.bankValidationFailed"));
      else setBankError(t("tutorOnboarding.bankSaveFailed"));
    } finally {
      setBankSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t("studentDashboard.profile.passwordMismatch"));
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      addToast({
        title: t("studentDashboard.profile.passwordChanged"),
        color: "success",
        timeout: 3000,
      });
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code;
      if (errorCode === "UserRounded.InvalidPassword") {
        setPasswordError(t("studentDashboard.profile.invalidPassword"));
      } else {
        setPasswordError(t("studentDashboard.profile.passwordChangeFailed"));
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <h1
          className="text-2xl lg:text-3xl font-bold mb-2"
          style={{ color: colors.text.primary }}
        >
          {t("studentDashboard.profile.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("studentDashboard.profile.subtitle")}
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar
                  src={profileData.avatar || undefined}
                  name={`${profileData.firstName} ${profileData.lastName}`}
                  className="w-24 h-24"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  isLoading={uploadingAvatar}
                  className="absolute bottom-0 right-0"
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                  onPress={() => fileInputRef.current?.click()}
                >
                  {!uploadingAvatar && (
                    <Camera weight="BoldDuotone" className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: colors.text.primary }}
                >
                  {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="mb-3" style={{ color: colors.text.secondary }}>
                  {profileData.email}
                </p>
                {profileData.notes && (
                  <p
                    className="text-sm max-w-md"
                    style={{ color: colors.text.secondary }}
                  >
                    {profileData.notes}
                  </p>
                )}
              </div>

              {/* Become Tutor */}
              {!isTutor && (
                <div className="flex-shrink-0 self-center">
                  <Button
                    style={{
                      backgroundColor: colors.primary.main,
                      color: colors.text.white,
                    }}
                    onPress={() => navigate("/become-tutor")}
                    endContent={<AltArrowRight weight="BoldDuotone" className="w-4 h-4" />}
                  >
                    {t("nav.becomeTutor")}
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Combined Content Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-6">
            {/* ── Personal Information ── */}
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("studentDashboard.profile.personalInfo")}
              </h3>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <Button
                    variant="flat"
                    size="sm"
                    onPress={() => {
                      if (originalData) setProfileData(originalData);
                      setIsEditing(false);
                    }}
                  >
                    {t("logoutModal.cancel")}
                  </Button>
                )}
                <Button
                  variant={isEditing ? "solid" : "outline"}
                  size="sm"
                  startContent={
                    isEditing ? (
                      <CheckCircle weight="BoldDuotone" className="w-4 h-4" />
                    ) : (
                      <Pen weight="BoldDuotone" className="w-4 h-4" />
                    )
                  }
                  style={
                    isEditing
                      ? {
                          backgroundColor: colors.primary.main,
                          color: colors.text.white,
                        }
                      : {
                          backgroundColor:
                            colors.button.primaryLight.background,
                          color: colors.button.primaryLight.text,
                        }
                  }
                  isLoading={saving}
                  onPress={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                >
                  {isEditing
                    ? saving
                      ? t("studentDashboard.profile.saving")
                      : t("studentDashboard.profile.save")
                    : t("studentDashboard.profile.edit")}
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label={t("studentDashboard.profile.firstName")}
                value={profileData.firstName}
                isDisabled={!isEditing}
                startContent={
                  <UserRounded weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                onValueChange={(value) =>
                  setProfileData({ ...profileData, firstName: value })
                }
              />
              <Input
                label={t("studentDashboard.profile.lastName")}
                value={profileData.lastName}
                isDisabled={!isEditing}
                startContent={
                  <UserRounded weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                onValueChange={(value) =>
                  setProfileData({ ...profileData, lastName: value })
                }
              />
              <Input
                label={t("studentDashboard.profile.email")}
                value={profileData.email}
                isDisabled
                startContent={
                  <Letter weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
              />
              <Input
                label={t("studentDashboard.profile.school")}
                value={profileData.school}
                isDisabled={!isEditing}
                startContent={
                  <SquareAcademicCap weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                onValueChange={(value) =>
                  setProfileData({ ...profileData, school: value })
                }
              />
              <Input
                label={t("studentDashboard.profile.grade")}
                value={profileData.grade}
                isDisabled={!isEditing}
                startContent={
                  <BookBookmark weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                onValueChange={(value) =>
                  setProfileData({ ...profileData, grade: value })
                }
              />
              <Input
                label={t("studentDashboard.profile.class")}
                value={profileData.class}
                isDisabled={!isEditing}
                startContent={
                  <BookBookmark weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                onValueChange={(value) =>
                  setProfileData({ ...profileData, class: value })
                }
              />
              <Input
                label={t("studentDashboard.profile.notes")}
                value={profileData.notes}
                isDisabled={!isEditing}
                startContent={
                  <Notes weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                onValueChange={(value) =>
                  setProfileData({ ...profileData, notes: value })
                }
              />
            </div>

            <Divider className="my-8" />

            {/* ── Card Account ── */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: colors.background.primaryLight }}
                >
                  <CardIcon
                    weight="BoldDuotone"
                    className="w-4.5 h-4.5"
                    style={{ color: colors.primary.main }}
                  />
                </div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorDashboard.profile.tabs.bankAccount")}
                </h3>
                {!isBankEditing &&
                  bankForm.bankCode &&
                  bankForm.bankAccountNumber &&
                  bankForm.bankAccountName && (
                    <CheckCircle
                      weight="BoldDuotone"
                      className="w-5 h-5"
                      style={{ color: colors.state.success }}
                    />
                  )}
              </div>
              {isBankEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="solid"
                    size="sm"
                    isLoading={bankSaving}
                    isDisabled={
                      !bankForm.bankCode ||
                      !bankForm.bankAccountNumber.trim() ||
                      !bankForm.bankAccountName.trim() ||
                      !bankForm.password
                    }
                    startContent={
                      !bankSaving && (
                        <CheckCircle weight="BoldDuotone" className="w-4 h-4" />
                      )
                    }
                    style={{
                      backgroundColor: colors.primary.main,
                      color: colors.text.white,
                    }}
                    onPress={handleSaveBankInfo}
                  >
                    {t("tutorDashboard.profile.save")}
                  </Button>
                  <Button
                    variant="flat"
                    size="sm"
                    isDisabled={bankSaving}
                    style={{
                      backgroundColor: colors.background.gray,
                      color: colors.text.secondary,
                    }}
                    onPress={() => {
                      setBankForm(originalBankForm);
                      setBankError("");
                      setIsBankEditing(false);
                    }}
                  >
                    {t("logoutModal.cancel")}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  startContent={
                    <Pen weight="BoldDuotone" className="w-4 h-4" />
                  }
                  style={{
                    backgroundColor: colors.button.primaryLight.background,
                    color: colors.button.primaryLight.text,
                  }}
                  onPress={() => {
                    setOriginalBankForm({ ...bankForm });
                    setIsBankEditing(true);
                  }}
                >
                  {t("studentDashboard.profile.edit")}
                </Button>
              )}
            </div>

            <p
              className="text-sm mb-4"
              style={{ color: colors.text.secondary }}
            >
              {t("studentDashboard.profile.bankDescription")}
            </p>

            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
              {/* Card selector */}
              <div className="sm:col-span-2">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorOnboarding.bankCode")}
                </label>
                <button
                  type="button"
                  onClick={() => isBankEditing && setBankSelectOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left"
                  style={{
                    backgroundColor: colors.background.gray,
                    borderColor: colors.border.light,
                    color: bankForm.bankCode
                      ? colors.text.primary
                      : colors.text.tertiary,
                    cursor: isBankEditing ? "pointer" : "default",
                    opacity: isBankEditing ? 1 : 0.7,
                  }}
                >
                  {bankForm.bankCode ? (
                    <>
                      <img
                        src={`https://api.vietqr.io/img/${bankForm.bankCode}.png`}
                        alt={bankForm.bankCode}
                        className="w-8 h-8 object-contain rounded"
                      />
                      <span className="flex-1 font-medium">
                        {BANK_LIST.find((b) => b.code === bankForm.bankCode)
                          ?.name || bankForm.bankCode}
                      </span>
                    </>
                  ) : (
                    <span className="flex-1">
                      {t("tutorOnboarding.bankCodePlaceholder")}
                    </span>
                  )}
                  {isBankEditing && <AltArrowDown weight="BoldDuotone" className="w-4 h-4 shrink-0" />}
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
                  isDisabled={!isBankEditing}
                  onChange={(e) =>
                    setBankForm((p) => ({
                      ...p,
                      bankAccountNumber: e.target.value,
                    }))
                  }
                  placeholder={t(
                    "tutorOnboarding.bankAccountNumberPlaceholder",
                  )}
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
                  isDisabled={!isBankEditing}
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

              {/* Password — only shown while editing */}
              {isBankEditing && (
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
              )}
            </div>

            {isBankEditing && bankError && (
              <p
                className="mt-3 text-sm font-medium"
                style={{ color: colors.state.error }}
              >
                {bankError}
              </p>
            )}

            <BankSelectModal
              isOpen={bankSelectOpen}
              onOpenChange={setBankSelectOpen}
              selectedBankCode={bankForm.bankCode}
              onSelect={(bank) => {
                setBankForm((p) => ({ ...p, bankCode: bank.code }));
                setBankSelectOpen(false);
              }}
            />

            <Divider className="my-8" />

            {/* ── Change Password ── */}
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: colors.text.primary }}
            >
              {t("studentDashboard.profile.changePassword")}
            </h3>
            <div className="space-y-4 max-w-md">
              <Input
                type="password"
                label={t("studentDashboard.profile.currentPassword")}
                value={passwordData.oldPassword}
                startContent={
                  <LockKeyhole
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                onValueChange={(value) => {
                  setPasswordError("");
                  setPasswordData((prev) => ({ ...prev, oldPassword: value }));
                }}
              />
              <Input
                type="password"
                label={t("studentDashboard.profile.newPassword")}
                value={passwordData.newPassword}
                startContent={
                  <LockKeyhole
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                onValueChange={(value) => {
                  setPasswordError("");
                  setPasswordData((prev) => ({ ...prev, newPassword: value }));
                }}
              />
              <Input
                type="password"
                label={t("studentDashboard.profile.confirmPassword")}
                value={passwordData.confirmPassword}
                isInvalid={
                  !!passwordError &&
                  passwordError ===
                    t("studentDashboard.profile.passwordMismatch")
                }
                errorMessage={
                  passwordError ===
                  t("studentDashboard.profile.passwordMismatch")
                    ? passwordError
                    : ""
                }
                startContent={
                  <LockKeyhole
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                }
                classNames={inputClassNames}
                onValueChange={(value) => {
                  setPasswordError("");
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: value,
                  }));
                }}
              />
              {passwordError &&
                passwordError !==
                  t("studentDashboard.profile.passwordMismatch") && (
                  <p className="text-sm" style={{ color: colors.state.error }}>
                    {passwordError}
                  </p>
                )}
              <Button
                isLoading={changingPassword}
                isDisabled={
                  !passwordData.oldPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
                onPress={handleChangePassword}
              >
                {changingPassword
                  ? t("studentDashboard.profile.changingPassword")
                  : t("studentDashboard.profile.updatePassword")}
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default Profile;
