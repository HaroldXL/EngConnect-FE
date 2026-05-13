import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Chip,
  Input,
  Select,
  SelectItem,
  DatePicker,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
  Switch,
  Divider,
  Textarea,
  Spinner,
  addToast,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";
import {
  User,
  Envelope,
  Camera,
  PencilSimple,
  Lock,
  SignOut,
  CheckCircle,
  Star,
  Clock,
  Student,
  Certificate,
  FileText,
  VideoCamera,
  Upload,
  SealCheck,
  Bank,
  CaretDown,
  Files,
  Trash,
} from "@phosphor-icons/react";
import BankSelectModal, {
  BANK_LIST,
} from "../../../components/BankSelectModal/BankSelectModal";
import ImageViewerModal from "../../../components/ImageViewerModal/ImageViewerModal";
import DocumentCard from "../../../components/DocumentCard/DocumentCard";
import { tutorApi } from "../../../api/tutorApi";
import { authApi } from "../../../api/authApi";
import ProfileSkeleton from "../../../components/ProfileSkeleton/ProfileSkeleton";
import { useDispatch, useSelector } from "react-redux";
import { updateTutorAvatar, updateUserInfo, selectUser } from "../../../store";

const Profile = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames, textareaClassNames, selectClassNames } =
    useInputStyles();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    monthExperience: "",
  });
  const [originalEditData, setOriginalEditData] = useState(null);

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailSubmissions: true,
    emailEarnings: true,
    pushBookings: true,
    pushSubmissions: true,
    pushEarnings: false,
  });

  // Tutor profile from API
  const [tutorProfile, setTutorProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [cvUploading, setCvUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const cvInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [viewingImageUrl, setViewingImageUrl] = useState(null);
  const docFileRef = useRef(null);

  const [docForm, setDocForm] = useState({
    name: "",
    docType: "",
    issuedBy: "",
    issuedAt: "",
    expiredAt: "",
    file: null,
  });

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

  // Auto-select verification tab when unverified
  const isUnverified = tutorProfile?.verifiedStatus === "Unverified";
  const [selectedTab, setSelectedTab] = useState("profile");

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const res = await tutorApi.getTutorDocuments();
      const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setDocuments(items);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDocUpload = async () => {
    if (!docForm.name.trim() || !docForm.file) return;
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append("Name", docForm.name.trim());
      fd.append("DocType", docForm.docType);
      if (docForm.issuedBy) fd.append("IssuedBy", docForm.issuedBy);
      if (docForm.issuedAt) fd.append("IssuedAt", docForm.issuedAt);
      if (docForm.expiredAt) fd.append("ExpiredAt", docForm.expiredAt);
      fd.append("File", docForm.file);
      fd.append("FileName", docForm.file.name);
      const res = await tutorApi.uploadTutorDocument(fd);
      if (res.isSuccess) {
        addToast({
          title: t("tutorDashboard.profile.documents.uploadSuccess"),
          color: "success",
        });
        setDocForm({
          name: "",
          docType: "",
          issuedBy: "",
          issuedAt: "",
          expiredAt: "",
          file: null,
        });
        if (docFileRef.current) docFileRef.current.value = "";
        setDocModalOpen(false);
        fetchDocuments();
      }
    } catch {
      addToast({
        title: t("tutorDashboard.profile.documents.uploadFailed"),
        color: "danger",
      });
    } finally {
      setDocUploading(false);
    }
  };

  const handleDocDelete = async (docId) => {
    setDeletingDocId(docId);
    try {
      const res = await tutorApi.deleteTutorDocument(docId);
      if (res.isSuccess) {
        addToast({
          title: t("tutorDashboard.profile.documents.deleteSuccess"),
          color: "success",
        });
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        setDocToDelete(null);
      }
    } catch {
      addToast({
        title: t("tutorDashboard.profile.documents.deleteFailed"),
        color: "danger",
      });
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const data = await tutorApi.uploadAvatar(file, file.name);
      if (data.isSuccess) {
        const avatarRes = await tutorApi.getTutorAvatar().catch(() => null);
        const newUrl = avatarRes?.data?.url || data.data?.avatarUrl || "";
        if (newUrl) dispatch(updateTutorAvatar(newUrl));
        setTutorProfile((prev) => ({
          ...prev,
          avatar: newUrl || (data.data?.avatarUrl ?? prev.avatar),
        }));
        await fetchTutorProfile();
        addToast({
          title: t("tutorDashboard.profile.avatarUploadSuccess"),
          color: "success",
        });
      }
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      addToast({
        title: t("tutorDashboard.profile.avatarUploadFailed"),
        color: "danger",
      });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const fetchTutorProfile = async () => {
    setProfileLoading(true);
    try {
      const data = await tutorApi.getTutorProfile();
      if (data.isSuccess) {
        const p = data.data;
        setTutorProfile(p);
        dispatch(updateTutorAvatar(p.avatar || ""));
        const snapshot = {
          firstName: p.user?.firstName || "",
          lastName: p.user?.lastName || "",
          headline: p.headline || "",
          bio: p.bio || "",
          monthExperience:
            p.monthExperience == null ? "" : String(p.monthExperience),
        };
        setEditData(snapshot);
        setOriginalEditData(snapshot);
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
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const tutorPayload = {
        headline: editData.headline,
        bio: editData.bio,
        monthExperience:
          editData.monthExperience === ""
            ? 0
            : Number(editData.monthExperience),
      };
      const userPayload = {
        firstName: editData.firstName,
        lastName: editData.lastName,
      };
      await Promise.all([
        tutorApi.updateTutorById(tutorProfile.id, tutorPayload),
        authApi.updateUser(currentUser.userId, userPayload),
      ]);
      setIsEditing(false);
      const updated = { ...editData };
      setOriginalEditData(updated);
      setTutorProfile((prev) => ({
        ...prev,
        ...tutorPayload,
        user: { ...prev.user, ...userPayload },
      }));
      dispatch(updateUserInfo(userPayload));
      addToast({
        title: t("tutorDashboard.profile.profileUpdated"),
        color: "success",
      });
    } catch (err) {
      console.error("Failed to update tutor profile:", err);
      addToast({
        title: t("tutorDashboard.profile.profileUpdateFailed"),
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchTutorProfile();
  }, []);

  useEffect(() => {
    if (tutorProfile && tutorProfile.verifiedStatus === "Unverified") {
      setSelectedTab("verification");
    }
  }, [tutorProfile]);

  useEffect(() => {
    if (selectedTab === "documents") fetchDocuments();
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvUploading(true);
    try {
      const data = await tutorApi.uploadCv(file, file.name);
      if (data.isSuccess) {
        addToast({
          title: t("tutorDashboard.profile.verification.cvUploadSuccess"),
          color: "success",
          timeout: 3000,
        });
        fetchTutorProfile();
      }
    } catch (err) {
      addToast({
        title: t("tutorDashboard.profile.verification.cvUploadFailed"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setCvUploading(false);
      if (cvInputRef.current) cvInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    try {
      const data = await tutorApi.uploadIntroVideo(file, file.name);
      if (data.isSuccess) {
        addToast({
          title: t("tutorDashboard.profile.verification.videoUploadSuccess"),
          color: "success",
          timeout: 3000,
        });
        fetchTutorProfile();
      }
    } catch (err) {
      addToast({
        title: t("tutorDashboard.profile.verification.videoUploadFailed"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
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
        await fetchTutorProfile();
        setBankForm((prev) => ({ ...prev, password: "" }));
        setIsBankEditing(false);
        addToast({
          title: t("tutorOnboarding.bankSaved"),
          color: "success",
        });
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

  const handleSubmitVerification = async () => {
    setVerificationSubmitting(true);
    try {
      const data = await tutorApi.submitVerificationRequest();
      if (data.isSuccess) {
        addToast({
          title: t("tutorDashboard.profile.verification.submitSuccess"),
          color: "success",
          timeout: 5000,
        });
        fetchTutorProfile();
      }
    } catch (err) {
      addToast({
        title: t("tutorDashboard.profile.verification.submitFailed"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setVerificationSubmitting(false);
    }
  };

  const canSubmitVerification =
    tutorProfile?.cvUrl && tutorProfile?.introVideoUrl;

  const stats = [
    {
      icon: Student,
      label: t("tutorDashboard.profile.totalStudents"),
      value: "0",
      color: colors.primary.main,
    },
    {
      icon: Clock,
      label: t("tutorDashboard.profile.hoursTeached"),
      value: `${tutorProfile?.monthExperience || 0}m`,
      color: colors.state.warning,
    },
    {
      icon: Certificate,
      label: t("tutorDashboard.profile.coursesCreated"),
      value: `${tutorProfile?.slotsCount || 0}`,
      color: colors.state.success,
    },
    {
      icon: Star,
      label: t("tutorDashboard.profile.rating"),
      value: tutorProfile?.ratingAverage?.toFixed(1) || "0.0",
      color: "#F59E0B",
    },
  ];

  const certifications = [
    {
      id: 1,
      title: "IELTS Instructor Certification",
      issuer: "British Council",
      icon: "🎓",
      date: "2020",
    },
    {
      id: 2,
      title: "TESOL Certificate",
      issuer: "Arizona State University",
      icon: "📜",
      date: "2018",
    },
    {
      id: 3,
      title: "Business English Specialist",
      issuer: "Cambridge University",
      icon: "💼",
      date: "2019",
    },
    {
      id: 4,
      title: "Online Teaching Excellence",
      issuer: "Coursera",
      icon: "🌐",
      date: "2021",
    },
  ];

  const earningsHistory = [
    {
      id: 1,
      description: "Lesson with John Doe",
      amount: 45.0,
      date: "Jan 20, 2026",
      status: "completed",
    },
    {
      id: 2,
      description: "Lesson with Emily Chen",
      amount: 45.0,
      date: "Jan 19, 2026",
      status: "completed",
    },
    {
      id: 3,
      description: "Course enrollment - Business English",
      amount: 79.99,
      date: "Jan 18, 2026",
      status: "completed",
    },
    {
      id: 4,
      description: "Lesson with Michael Lee",
      amount: 45.0,
      date: "Jan 17, 2026",
      status: "completed",
    },
  ];

  if (profileLoading) return <ProfileSkeleton />;

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
          {t("tutorDashboard.profile.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("tutorDashboard.profile.subtitle")}
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
                <Avatar src={tutorProfile?.avatar} className="w-24 h-24" />
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  className="absolute bottom-0 right-0"
                  isLoading={avatarUploading}
                  onPress={() => avatarInputRef.current?.click()}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                >
                  <Camera weight="fill" className="w-4 h-4" />
                </Button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: colors.text.primary }}
                >
                  {tutorProfile?.user?.firstName} {tutorProfile?.user?.lastName}
                </h2>
                <p className="mb-2" style={{ color: colors.text.secondary }}>
                  {tutorProfile?.user?.email}
                </p>
                {tutorProfile?.headline && (
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: colors.primary.main }}
                  >
                    {tutorProfile.headline}
                  </p>
                )}
                {tutorProfile?.tags && tutorProfile.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                    {tutorProfile.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: colors.background.primaryLight,
                          color: colors.primary.main,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p
                  className="text-sm max-w-lg"
                  style={{ color: colors.text.secondary }}
                >
                  {tutorProfile?.bio}
                </p>
              </div>

              {/* Stats hidden */}
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card
          shadow="none"
          className="border-none rounded-full"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-2">
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab}
              variant="light"
              radius="full"
              classNames={{
                tabList: "gap-2 w-full p-1",
                tab: "px-6 h-12",
              }}
              style={{
                "--heroui-hover-opacity": "1",
              }}
              color="primary"
            >
              <Tab
                key="profile"
                title={
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    <span className="font-medium">
                      {t("tutorDashboard.profile.tabs.profile")}
                    </span>
                  </div>
                }
              />
              <Tab
                key="documents"
                title={
                  <div className="flex items-center gap-2">
                    <Files className="w-5 h-5" />
                    <span className="font-medium">
                      {t("tutorDashboard.profile.tabs.documents")}
                    </span>
                  </div>
                }
              />
              <Tab
                key="bankAccount"
                title={
                  <div className="flex items-center gap-2">
                    <Bank className="w-5 h-5" />
                    <span className="font-medium">
                      {t("tutorDashboard.profile.tabs.bankAccount")}
                    </span>
                  </div>
                }
              />
              <Tab
                key="verification"
                title={
                  <div className="flex items-center gap-2">
                    <SealCheck className="w-5 h-5" />
                    <span className="font-medium">
                      {t("tutorDashboard.profile.tabs.verification")}
                    </span>
                  </div>
                }
              />
            </Tabs>
          </CardBody>
        </Card>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {selectedTab === "profile" && (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorDashboard.profile.personalInfo")}
                </h3>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="solid"
                      size="sm"
                      isLoading={saving}
                      startContent={
                        !saving && (
                          <CheckCircle weight="duotone" className="w-4 h-4" />
                        )
                      }
                      style={{
                        backgroundColor: colors.primary.main,
                        color: colors.text.white,
                      }}
                      onPress={handleSaveProfile}
                    >
                      {t("tutorDashboard.profile.save")}
                    </Button>
                    <Button
                      variant="flat"
                      size="sm"
                      isDisabled={saving}
                      style={{
                        backgroundColor: colors.background.gray,
                        color: colors.text.secondary,
                      }}
                      onPress={() => {
                        setEditData(originalEditData);
                        setIsEditing(false);
                      }}
                    >
                      {t("tutorDashboard.profile.cancel")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    startContent={
                      <PencilSimple weight="duotone" className="w-4 h-4" />
                    }
                    style={{
                      backgroundColor: colors.button.primaryLight.background,
                      color: colors.button.primaryLight.text,
                    }}
                    onPress={() => setIsEditing(true)}
                  >
                    {t("tutorDashboard.profile.edit")}
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label={t("tutorDashboard.profile.firstName")}
                  value={editData.firstName}
                  isDisabled={!isEditing}
                  onValueChange={(v) =>
                    setEditData((prev) => ({ ...prev, firstName: v }))
                  }
                  startContent={
                    <User
                      className="w-5 h-5"
                      style={{ color: colors.text.secondary }}
                    />
                  }
                  classNames={inputClassNames}
                />
                <Input
                  label={t("tutorDashboard.profile.lastName")}
                  value={editData.lastName}
                  isDisabled={!isEditing}
                  onValueChange={(v) =>
                    setEditData((prev) => ({ ...prev, lastName: v }))
                  }
                  startContent={
                    <User
                      className="w-5 h-5"
                      style={{ color: colors.text.secondary }}
                    />
                  }
                  classNames={inputClassNames}
                />
                <Input
                  label={t("tutorDashboard.profile.email")}
                  value={tutorProfile?.user?.email || ""}
                  isDisabled
                  startContent={
                    <Envelope
                      className="w-5 h-5"
                      style={{ color: colors.text.secondary }}
                    />
                  }
                  classNames={inputClassNames}
                />
                <Input
                  label={t("tutorDashboard.profile.headline")}
                  value={editData.headline}
                  isDisabled={!isEditing}
                  onValueChange={(v) =>
                    setEditData((prev) => ({ ...prev, headline: v }))
                  }
                  classNames={inputClassNames}
                />
                <Input
                  label={t("tutorDashboard.profile.monthExperience")}
                  type="number"
                  min={0}
                  value={editData.monthExperience}
                  isDisabled={!isEditing}
                  onValueChange={(v) =>
                    setEditData((prev) => ({ ...prev, monthExperience: v }))
                  }
                  classNames={inputClassNames}
                />
              </div>

              <div className="mt-6">
                <Textarea
                  label={t("tutorDashboard.profile.bio")}
                  value={editData.bio}
                  isDisabled={!isEditing}
                  onValueChange={(v) =>
                    setEditData((prev) => ({ ...prev, bio: v }))
                  }
                  classNames={textareaClassNames}
                />
              </div>
            </CardBody>
          </Card>
        )}

        {selectedTab === "bankAccount" && (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
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
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {t("tutorOnboarding.bankSection")}
                  </h3>
                  {!isBankEditing &&
                    tutorProfile?.bankCode &&
                    tutorProfile?.bankAccountNumber &&
                    tutorProfile?.bankAccountName && (
                      <CheckCircle
                        weight="fill"
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
                          <CheckCircle weight="duotone" className="w-4 h-4" />
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
                      {t("tutorDashboard.profile.cancel")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    startContent={
                      <PencilSimple weight="duotone" className="w-4 h-4" />
                    }
                    style={{
                      backgroundColor: colors.button.primaryLight.background,
                      color: colors.button.primaryLight.text,
                    }}
                    onPress={() => {
                      setOriginalBankForm(bankForm);
                      setIsBankEditing(true);
                    }}
                  >
                    {t("tutorDashboard.profile.edit")}
                  </Button>
                )}
              </div>

              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {t("tutorDashboard.profile.bankDescription")}
              </p>

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
                    {isBankEditing && (
                      <CaretDown className="w-4 h-4 shrink-0" />
                    )}
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
                    placeholder={t(
                      "tutorOnboarding.bankAccountNamePlaceholder",
                    )}
                    classNames={inputClassNames}
                  />
                </div>

                {/* Password confirmation — only shown while editing */}
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
            </CardBody>
          </Card>
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

        {selectedTab === "notifications" && (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6 space-y-6">
              <div>
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorDashboard.profile.emailNotifications")}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: colors.text.primary }}>
                        {t("tutorDashboard.profile.newBookings")}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("tutorDashboard.profile.newBookingsDesc")}
                      </p>
                    </div>
                    <Switch
                      isSelected={notifications.emailBookings}
                      onValueChange={(value) =>
                        setNotifications({
                          ...notifications,
                          emailBookings: value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: colors.text.primary }}>
                        {t("tutorDashboard.profile.homeworkSubmissions")}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("tutorDashboard.profile.homeworkSubmissionsDesc")}
                      </p>
                    </div>
                    <Switch
                      isSelected={notifications.emailSubmissions}
                      onValueChange={(value) =>
                        setNotifications({
                          ...notifications,
                          emailSubmissions: value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: colors.text.primary }}>
                        {t("tutorDashboard.profile.earningsUpdates")}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("tutorDashboard.profile.earningsUpdatesDesc")}
                      </p>
                    </div>
                    <Switch
                      isSelected={notifications.emailEarnings}
                      onValueChange={(value) =>
                        setNotifications({
                          ...notifications,
                          emailEarnings: value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Divider />

              <div>
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorDashboard.profile.pushNotifications")}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: colors.text.primary }}>
                        {t("tutorDashboard.profile.newBookings")}
                      </p>
                    </div>
                    <Switch
                      isSelected={notifications.pushBookings}
                      onValueChange={(value) =>
                        setNotifications({
                          ...notifications,
                          pushBookings: value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: colors.text.primary }}>
                        {t("tutorDashboard.profile.homeworkSubmissions")}
                      </p>
                    </div>
                    <Switch
                      isSelected={notifications.pushSubmissions}
                      onValueChange={(value) =>
                        setNotifications({
                          ...notifications,
                          pushSubmissions: value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: colors.text.primary }}>
                        {t("tutorDashboard.profile.earningsUpdates")}
                      </p>
                    </div>
                    <Switch
                      isSelected={notifications.pushEarnings}
                      onValueChange={(value) =>
                        setNotifications({
                          ...notifications,
                          pushEarnings: value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {selectedTab === "security" && (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6 space-y-6">
              <div>
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorDashboard.profile.changePassword")}
                </h3>
                <div className="space-y-4 max-w-md">
                  <Input
                    type="password"
                    label={t("tutorDashboard.profile.currentPassword")}
                    startContent={
                      <Lock
                        weight="duotone"
                        className="w-5 h-5"
                        style={{ color: colors.text.secondary }}
                      />
                    }
                    classNames={inputClassNames}
                  />
                  <Input
                    type="password"
                    label={t("tutorDashboard.profile.newPassword")}
                    startContent={
                      <Lock
                        weight="duotone"
                        className="w-5 h-5"
                        style={{ color: colors.text.secondary }}
                      />
                    }
                    classNames={inputClassNames}
                  />
                  <Input
                    type="password"
                    label={t("tutorDashboard.profile.confirmPassword")}
                    startContent={
                      <Lock
                        weight="duotone"
                        className="w-5 h-5"
                        style={{ color: colors.text.secondary }}
                      />
                    }
                    classNames={inputClassNames}
                  />
                  <Button
                    style={{
                      backgroundColor: colors.primary.main,
                      color: colors.text.white,
                    }}
                  >
                    {t("tutorDashboard.profile.updatePassword")}
                  </Button>
                </div>
              </div>

              <Divider />

              <div>
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.state.error }}
                >
                  {t("tutorDashboard.profile.dangerZone")}
                </h3>
                <Button
                  variant="bordered"
                  color="danger"
                  startContent={<SignOut weight="bold" className="w-5 h-5" />}
                >
                  {t("tutorDashboard.profile.deleteAccount")}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {selectedTab === "earnings" && (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6">
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.profile.recentEarnings")}
              </h3>

              <div className="space-y-3">
                {earningsHistory.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${colors.state.success}20` }}
                      >
                        <CheckCircle
                          weight="fill"
                          className="w-5 h-5"
                          style={{ color: colors.state.success }}
                        />
                      </div>
                      <div>
                        <p
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {earning.description}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {earning.date}
                        </p>
                      </div>
                    </div>
                    <p
                      className="font-semibold"
                      style={{ color: colors.state.success }}
                    >
                      +${earning.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {selectedTab === "documents" && (
          <>
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-6">
                {/* Header row */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: colors.background.primaryLight,
                      }}
                    >
                      <Files
                        weight="duotone"
                        className="w-4.5 h-4.5"
                        style={{ color: colors.primary.main }}
                      />
                    </div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: colors.text.primary }}
                    >
                      {t("tutorDashboard.profile.documents.myDocuments")}
                    </h3>
                  </div>
                  <Button
                    startContent={<Upload weight="bold" className="w-4 h-4" />}
                    onPress={() => setDocModalOpen(true)}
                    style={{
                      backgroundColor: colors.primary.main,
                      color: colors.text.white,
                    }}
                  >
                    {t("tutorDashboard.profile.documents.addButton")}
                  </Button>
                </div>

                {/* Documents list */}
                {documentsLoading ? (
                  <div className="flex justify-center py-10">
                    <Spinner />
                  </div>
                ) : documents.length === 0 ? (
                  <div
                    className="flex flex-col items-center py-12"
                    style={{ color: colors.text.tertiary }}
                  >
                    <Files weight="duotone" className="w-12 h-12 mb-3" />
                    <p className="text-sm">
                      {t("tutorDashboard.profile.documents.noDocuments")}
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        onDelete={setDocToDelete}
                        onViewImage={setViewingImageUrl}
                        cardBgColor={colors.background.gray}
                      />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Add Document Modal */}
            <Modal
              isOpen={docModalOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setDocForm({
                    name: "",
                    docType: "",
                    issuedBy: "",
                    issuedAt: "",
                    expiredAt: "",
                    file: null,
                  });
                  if (docFileRef.current) docFileRef.current.value = "";
                }
                setDocModalOpen(open);
              }}
              size="lg"
            >
              <ModalContent style={{ backgroundColor: colors.background.card }}>
                {(onClose) => (
                  <>
                    <ModalHeader style={{ color: colors.text.primary }}>
                      {t("tutorDashboard.profile.documents.modalTitle")}
                    </ModalHeader>
                    <ModalBody className="gap-4 pb-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label={`${t("tutorDashboard.profile.documents.nameLabel")} *`}
                          labelPlacement="outside"
                          placeholder={t(
                            "tutorDashboard.profile.documents.namePlaceholder",
                          )}
                          value={docForm.name}
                          onValueChange={(v) =>
                            setDocForm((p) => ({ ...p, name: v }))
                          }
                          classNames={inputClassNames}
                        />
                        <Select
                          label={`${t("tutorDashboard.profile.documents.typeLabel")} *`}
                          labelPlacement="outside"
                          placeholder={t(
                            "tutorDashboard.profile.documents.typePlaceholder",
                          )}
                          selectedKeys={
                            docForm.docType ? [docForm.docType] : []
                          }
                          onSelectionChange={(keys) =>
                            setDocForm((p) => ({
                              ...p,
                              docType: [...keys][0] || "",
                            }))
                          }
                          classNames={selectClassNames}
                        >
                          {["Degree", "Certificate", "License", "Other"].map(
                            (type) => (
                              <SelectItem key={type}>
                                {t(
                                  `tutorDashboard.profile.documents.types.${type}`,
                                )}
                              </SelectItem>
                            ),
                          )}
                        </Select>
                        <Input
                          label={t(
                            "tutorDashboard.profile.documents.issuedByLabel",
                          )}
                          labelPlacement="outside"
                          placeholder={t(
                            "tutorDashboard.profile.documents.issuedByPlaceholder",
                          )}
                          value={docForm.issuedBy}
                          onValueChange={(v) =>
                            setDocForm((p) => ({ ...p, issuedBy: v }))
                          }
                          classNames={inputClassNames}
                        />
                        <DatePicker
                          label={t(
                            "tutorDashboard.profile.documents.issuedAtLabel",
                          )}
                          labelPlacement="outside"
                          value={
                            docForm.issuedAt
                              ? parseDate(docForm.issuedAt)
                              : null
                          }
                          onChange={(date) =>
                            setDocForm((p) => ({
                              ...p,
                              issuedAt: date ? date.toString() : "",
                            }))
                          }
                          classNames={inputClassNames}
                        />
                        <DatePicker
                          label={t(
                            "tutorDashboard.profile.documents.expiredAtLabel",
                          )}
                          labelPlacement="outside"
                          value={
                            docForm.expiredAt
                              ? parseDate(docForm.expiredAt)
                              : null
                          }
                          onChange={(date) =>
                            setDocForm((p) => ({
                              ...p,
                              expiredAt: date ? date.toString() : "",
                            }))
                          }
                          classNames={inputClassNames}
                        />
                      </div>

                      <div
                        className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer"
                        style={{
                          borderColor: docForm.file
                            ? colors.state.success
                            : colors.border.light,
                          backgroundColor: colors.background.gray,
                        }}
                        onClick={() => docFileRef.current?.click()}
                      >
                        {docForm.file ? (
                          <>
                            <CheckCircle
                              weight="fill"
                              className="w-5 h-5 shrink-0"
                              style={{ color: colors.state.success }}
                            />
                            <span
                              className="text-sm truncate"
                              style={{ color: colors.text.primary }}
                            >
                              {docForm.file.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload
                              weight="duotone"
                              className="w-5 h-5 shrink-0"
                              style={{ color: colors.text.tertiary }}
                            />
                            <span
                              className="text-sm"
                              style={{ color: colors.text.tertiary }}
                            >
                              {t(
                                "tutorDashboard.profile.documents.filePlaceholder",
                              )}
                            </span>
                          </>
                        )}
                      </div>
                      <input
                        ref={docFileRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) =>
                          setDocForm((p) => ({
                            ...p,
                            file: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        variant="flat"
                        onPress={onClose}
                        style={{
                          backgroundColor: colors.background.gray,
                          color: colors.text.secondary,
                        }}
                      >
                        {t("tutorDashboard.profile.cancel")}
                      </Button>
                      <Button
                        isLoading={docUploading}
                        isDisabled={
                          !docForm.name.trim() ||
                          !docForm.docType ||
                          !docForm.file
                        }
                        onPress={handleDocUpload}
                        startContent={
                          !docUploading && (
                            <Upload weight="bold" className="w-4 h-4" />
                          )
                        }
                        style={{
                          backgroundColor: colors.primary.main,
                          color: colors.text.white,
                        }}
                      >
                        {t("tutorDashboard.profile.documents.uploadButton")}
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal
              isOpen={!!docToDelete}
              onOpenChange={(open) => {
                if (!open) setDocToDelete(null);
              }}
              size="sm"
            >
              <ModalContent style={{ backgroundColor: colors.background.card }}>
                {(onClose) => (
                  <>
                    <ModalHeader style={{ color: colors.text.primary }}>
                      {t("tutorDashboard.profile.documents.deleteConfirmTitle")}
                    </ModalHeader>
                    <ModalBody>
                      <p
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {t(
                          "tutorDashboard.profile.documents.deleteConfirmMessage",
                          { name: docToDelete?.name },
                        )}
                      </p>
                    </ModalBody>
                    <ModalFooter>
                      <Button variant="light" onPress={onClose}>
                        {t("tutorDashboard.profile.cancel")}
                      </Button>
                      <Button
                        color="danger"
                        isLoading={!!deletingDocId}
                        onPress={() => handleDocDelete(docToDelete.id)}
                        startContent={
                          !deletingDocId && (
                            <Trash weight="bold" className="w-4 h-4" />
                          )
                        }
                      >
                        {t("tutorDashboard.profile.documents.deleteButton")}
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>

            <ImageViewerModal
              imageUrl={viewingImageUrl}
              onClose={() => setViewingImageUrl(null)}
            />
          </>
        )}

        {selectedTab === "verification" && (
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6 space-y-6">
              <>
                {/* Verification Status */}
                {tutorProfile?.verifiedStatus && (
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{
                      backgroundColor:
                        tutorProfile.verifiedStatus === "Verified"
                          ? `${colors.state.success}15`
                          : tutorProfile.verifiedStatus === "Pending"
                            ? `${colors.state.warning}15`
                            : colors.background.gray,
                    }}
                  >
                    <SealCheck
                      weight="duotone"
                      className="w-6 h-6"
                      style={{
                        color:
                          tutorProfile.verifiedStatus === "Verified"
                            ? colors.state.success
                            : tutorProfile.verifiedStatus === "Pending"
                              ? colors.state.warning
                              : colors.text.secondary,
                      }}
                    />
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("tutorDashboard.profile.verification.status")}:{" "}
                        {t(
                          `tutorDashboard.profile.verification.statuses.${tutorProfile.verifiedStatus}`,
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* CV Upload */}
                <div>
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: colors.text.primary }}
                  >
                    <FileText
                      weight="duotone"
                      className="w-5 h-5 inline-block mr-2"
                    />
                    {t("tutorDashboard.profile.verification.cvTitle")}
                  </h3>
                  {tutorProfile?.cvUrl ? (
                    <div
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle
                          weight="fill"
                          className="w-5 h-5"
                          style={{ color: colors.state.success }}
                        />
                        <p style={{ color: colors.text.primary }}>
                          {t("tutorDashboard.profile.verification.cvUploaded")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() =>
                            window.open(tutorProfile.cvUrl, "_blank")
                          }
                          style={{
                            backgroundColor:
                              colors.button.primaryLight.background,
                            color: colors.button.primaryLight.text,
                          }}
                        >
                          {t("tutorDashboard.profile.verification.view")}
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          isLoading={cvUploading}
                          onPress={() => cvInputRef.current?.click()}
                          style={{
                            backgroundColor: colors.background.gray,
                            color: colors.text.primary,
                          }}
                        >
                          {t("tutorDashboard.profile.verification.replace")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer"
                      style={{
                        borderColor: colors.border.light,
                        backgroundColor: colors.background.gray,
                      }}
                      onClick={() => cvInputRef.current?.click()}
                    >
                      <Upload
                        weight="duotone"
                        className="w-10 h-10 mb-3"
                        style={{ color: colors.text.tertiary }}
                      />
                      <p
                        className="font-medium mb-1"
                        style={{ color: colors.text.primary }}
                      >
                        {t(
                          "tutorDashboard.profile.verification.cvUploadPrompt",
                        )}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: colors.text.tertiary }}
                      >
                        {t("tutorDashboard.profile.verification.cvFormats")}
                      </p>
                      {cvUploading && <Spinner size="sm" className="mt-3" />}
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

                <Divider />

                {/* Intro Video Upload */}
                <div>
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: colors.text.primary }}
                  >
                    <VideoCamera
                      weight="duotone"
                      className="w-5 h-5 inline-block mr-2"
                    />
                    {t("tutorDashboard.profile.verification.videoTitle")}
                  </h3>
                  {tutorProfile?.introVideoUrl ? (
                    <div
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle
                          weight="fill"
                          className="w-5 h-5"
                          style={{ color: colors.state.success }}
                        />
                        <p style={{ color: colors.text.primary }}>
                          {t(
                            "tutorDashboard.profile.verification.videoUploaded",
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() =>
                            window.open(tutorProfile.introVideoUrl, "_blank")
                          }
                          style={{
                            backgroundColor:
                              colors.button.primaryLight.background,
                            color: colors.button.primaryLight.text,
                          }}
                        >
                          {t("tutorDashboard.profile.verification.view")}
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          isLoading={videoUploading}
                          onPress={() => videoInputRef.current?.click()}
                          style={{
                            backgroundColor: colors.background.gray,
                            color: colors.text.primary,
                          }}
                        >
                          {t("tutorDashboard.profile.verification.replace")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer"
                      style={{
                        borderColor: colors.border.light,
                        backgroundColor: colors.background.gray,
                      }}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Upload
                        weight="duotone"
                        className="w-10 h-10 mb-3"
                        style={{ color: colors.text.tertiary }}
                      />
                      <p
                        className="font-medium mb-1"
                        style={{ color: colors.text.primary }}
                      >
                        {t(
                          "tutorDashboard.profile.verification.videoUploadPrompt",
                        )}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: colors.text.tertiary }}
                      >
                        {t("tutorDashboard.profile.verification.videoFormats")}
                      </p>
                      {videoUploading && <Spinner size="sm" className="mt-3" />}
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

                <Divider />

                {/* Submit Verification */}
                <div>
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: colors.text.primary }}
                  >
                    {t("tutorDashboard.profile.verification.submitTitle")}
                  </h3>
                  <p
                    className="text-sm mb-4"
                    style={{ color: colors.text.secondary }}
                  >
                    {canSubmitVerification
                      ? t("tutorDashboard.profile.verification.readyToSubmit")
                      : t(
                          "tutorDashboard.profile.verification.uploadBothFirst",
                        )}
                  </p>
                  <Button
                    size="lg"
                    isDisabled={
                      !canSubmitVerification ||
                      tutorProfile?.verifiedStatus === "Pending" ||
                      tutorProfile?.verifiedStatus === "Verified"
                    }
                    isLoading={verificationSubmitting}
                    onPress={handleSubmitVerification}
                    startContent={
                      <SealCheck weight="bold" className="w-5 h-5" />
                    }
                    style={{
                      backgroundColor: canSubmitVerification
                        ? colors.primary.main
                        : undefined,
                      color: canSubmitVerification
                        ? colors.text.white
                        : undefined,
                    }}
                  >
                    {tutorProfile?.verifiedStatus === "Pending"
                      ? t("tutorDashboard.profile.verification.pendingButton")
                      : tutorProfile?.verifiedStatus === "Verified"
                        ? t(
                            "tutorDashboard.profile.verification.verifiedButton",
                          )
                        : t("tutorDashboard.profile.verification.submitButton")}
                  </Button>
                </div>
              </>
            </CardBody>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
