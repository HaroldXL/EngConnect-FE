import { useState, useEffect } from "react";
import {
  AltArrowDown,
  Bell,
  BookBookmark,
  CalendarMark,
  ChecklistMinimalistic,
  CloseSquare,
  Dollar,
  HomeSmile,
  Logout,
  Magnifer,
  PenNewRound,
  PenNewSquare,
  PresentationGraph,
  QuestionCircle,
  SquareAcademicCap,
  UserCircle,
  VerifiedCheck,
} from "@solar-icons/react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  Button,
  Avatar,
  Badge,
  Chip,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeColors } from "../hooks/useThemeColors";
import LogoutModal from "../components/LogoutModal/LogoutModal";
import { useTheme } from "../contexts/ThemeContext";
import useInputStyles from "../hooks/useInputStyles";
import useDropdownStyles from "../hooks/useDropdownStyles";
import ThemeSwitcher from "../components/ThemeSwitcher/ThemeSwitcher";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";
import logoImage from "../assets/images/logo.png";
import { tutorApi } from "../api/tutorApi";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, selectTutorAvatarUrl, updateTutorAvatar } from "../store";

const TutorDashboardLayout = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const { dropdownClassNames } = useDropdownStyles();
  const { inputClassNames } = useInputStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [tutorProfile, setTutorProfile] = useState(null);
  const user = useSelector(selectUser);
  const tutorAvatarUrl = useSelector(selectTutorAvatarUrl);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await tutorApi.getTutorProfile();
        if (data.isSuccess) {
          setTutorProfile(data.data);
          dispatch(updateTutorAvatar(data.data.avatar || ""));
        }
      } catch (err) {
        console.error("Failed to fetch tutor profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const isVerified = tutorProfile?.verifiedStatus === "Verified";
  const isPending = tutorProfile?.verifiedStatus === "Pending";
  const isUnverified = tutorProfile?.verifiedStatus === "Unverified";
  const isRejected = tutorProfile?.verifiedStatus === "Rejected";
  const displayName = tutorProfile
    ? `${tutorProfile.user?.firstName || ""} ${tutorProfile.user?.lastName || ""}`.trim()
    : "";

  // Redirect unverified/rejected tutors to the onboarding page
  useEffect(() => {
    if (tutorProfile && (isUnverified || isRejected)) {
      navigate("/tutor/onboarding", { replace: true });
    }
  }, [tutorProfile, isUnverified, isRejected, navigate]);

  const navItems = [
    {
      path: "/tutor/dashboard",
      label: t("tutorDashboard.nav.dashboard"),
      icon: (props) => <HomeSmile weight="BoldDuotone" {...props} />,
    },
    {
      path: "/tutor/my-courses",
      label: t("tutorDashboard.nav.myCourses"),
      icon: (props) => <BookBookmark weight="BoldDuotone" {...props} />,
    },
    {
      path: "/tutor/schedule",
      label: t("tutorDashboard.nav.schedule"),
      icon: (props) => <CalendarMark weight="BoldDuotone" {...props} />,
    },
    {
      path: "/tutor/students",
      label: t("tutorDashboard.nav.students"),
      icon: (props) => <SquareAcademicCap weight="BoldDuotone" {...props} />,
    },
    {
      path: "/tutor/homework",
      label: t("tutorDashboard.nav.homework"),
      icon: (props) => <PenNewSquare weight="BoldDuotone" {...props} />,
    },
    {
      path: "/tutor/earnings",
      label: t("tutorDashboard.nav.earnings"),
      icon: (props) => <Dollar weight="BoldDuotone" {...props} />,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background.gray }}
    >
      {/* Top Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(30, 41, 59, 0.9)"
              : "rgba(255, 255, 255, 0.8)",
        }}
      >
        {/* Main Header Row */}
        <div className="px-4 lg:px-8 py-3 flex items-center justify-between relative">
          {/* Logo + Role chip */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Link to="/" className="flex items-center no-underline">
              <img
                src={logoImage}
                alt="EngConnect"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="h-10 w-auto"
              />
            </Link>
            <Chip
              size="lg"
              startContent={
                <PresentationGraph
                  weight="BoldDuotone"
                  className="w-3.5 h-3.5"
                />
              }
              style={{
                backgroundColor: "#0d948818",
                color: "#0d9488",
                border: "1px solid #0d948840",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {t("tutorDashboard.role")}
            </Chip>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
            <Input
              type="text"
              placeholder={t("tutorDashboard.search.placeholder")}
              startContent={
                <Magnifer
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.text.secondary }}
                />
              }
              classNames={inputClassNames}
              radius="lg"
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden lg:flex items-center gap-1">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>

            {/* Notifications
            <Badge content="3" color="danger" shape="circle" size="sm">
              <Button
                isIconOnly
                variant="light"
                radius="full"
                onPress={() => navigate("/tutor/notifications")}
              >
                <Bell weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.text.secondary }}
                />
              </Button>
            </Badge> */}

            {/* User Menu */}
            <Dropdown
              placement="bottom-end"
              showArrow
              classNames={dropdownClassNames}
            >
              <DropdownTrigger>
                <Button variant="light" className="gap-2 pl-2 pr-3">
                  <Avatar
                    src={tutorAvatarUrl || tutorProfile?.avatar}
                    size="sm"
                    className="w-8 h-8"
                  />
                  <span
                    className="font-medium text-sm sm:text-base"
                    style={{ color: colors.text.primary }}
                  >
                    {displayName}
                  </span>
                  <AltArrowDown
                    weight="BoldDuotone"
                    className="w-4 h-4 hidden sm:block"
                    style={{ color: colors.text.secondary }}
                  />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
                <DropdownItem
                  key="profile"
                  startContent={
                    <UserCircle
                      style={{ color: colors.text.secondary }}
                      weight="BoldDuotone"
                      className="w-6 h-6"
                    />
                  }
                  onPress={() => navigate("/tutor/profile")}
                >
                  {t("tutorDashboard.nav.profile")}
                </DropdownItem>
                <DropdownItem
                  key="help-support"
                  startContent={
                    <QuestionCircle
                      style={{ color: colors.text.secondary }}
                      weight="BoldDuotone"
                      className="w-6 h-6"
                    />
                  }
                  onPress={() => navigate("/help-support")}
                >
                  {t("tutorDashboard.nav.helpSupport")}
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  className="text-danger"
                  color="danger"
                  startContent={
                    <Logout weight="BoldDuotone" className="w-6 h-6" />
                  }
                  onPress={() => setLogoutModalOpen(true)}
                >
                  {t("tutorDashboard.nav.logout")}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* Mobile Menu Button */}
            <Button
              isIconOnly
              variant="light"
              className="lg:hidden"
              onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <CloseSquare
                  weight="BoldDuotone"
                  className="w-6 h-6"
                  style={{ color: colors.text.primary }}
                />
              ) : (
                <ChecklistMinimalistic
                  weight="BoldDuotone"
                  className="w-6 h-6"
                  style={{ color: colors.text.primary }}
                />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation Row - Desktop */}
        <nav className="hidden lg:flex justify-center px-4 lg:px-8 py-3">
          <ul
            className="flex items-center gap-1 px-2 py-1.5 rounded-full"
            style={{ backgroundColor: colors.background.gray }}
          >
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 no-underline font-medium text-sm"
                  style={{
                    color: isActive(item.path)
                      ? colors.text.white
                      : colors.text.secondary,
                    backgroundColor: isActive(item.path)
                      ? colors.primary.main
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.backgroundColor =
                        colors.primary.lightest;
                      e.currentTarget.style.color = colors.primary.main;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = colors.text.secondary;
                    }
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
            style={{ top: "64px" }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {/* Menu Content */}
            <motion.nav
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative"
              style={{
                backgroundColor: colors.background.light,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ul className="p-4 max-h-[calc(100vh-64px)] overflow-y-auto">
                {navItems.map((item, index) => (
                  <motion.li
                    key={item.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all no-underline ${
                        isActive(item.path) ? "font-semibold" : ""
                      }`}
                      style={{
                        backgroundColor: isActive(item.path)
                          ? colors.primary.main
                          : "transparent",
                        color: isActive(item.path)
                          ? colors.text.white
                          : colors.text.secondary,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive(item.path)) {
                          e.currentTarget.style.backgroundColor =
                            colors.primary.lightest;
                          e.currentTarget.style.color = colors.primary.main;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(item.path)) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = colors.text.secondary;
                        }
                      }}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </motion.li>
                ))}
                <motion.li
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: navItems.length * 0.05, duration: 0.3 }}
                >
                  <Link
                    to="/tutor/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all no-underline ${
                      isActive("/tutor/profile") ? "font-semibold" : ""
                    }`}
                    style={{
                      backgroundColor: isActive("/tutor/profile")
                        ? colors.primary.main
                        : "transparent",
                      color: isActive("/tutor/profile")
                        ? colors.text.white
                        : colors.text.secondary,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive("/tutor/profile")) {
                        e.currentTarget.style.backgroundColor =
                          colors.primary.lightest;
                        e.currentTarget.style.color = colors.primary.main;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive("/tutor/profile")) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = colors.text.secondary;
                      }
                    }}
                  >
                    <UserCircle weight="BoldDuotone" className="w-5 h-5" />
                    <span>{t("tutorDashboard.nav.profile")}</span>
                  </Link>
                </motion.li>

                {/* Theme & Language Switchers - Mobile */}
                <motion.li
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    delay: (navItems.length + 1) * 0.05,
                    duration: 0.3,
                  }}
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      borderTop: `1px solid ${colors.border.light}`,
                      marginTop: "0.5rem",
                      paddingTop: "1rem",
                    }}
                  >
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                  </div>
                </motion.li>
              </ul>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <main className="p-4 lg:px-6 lg:py-8 max-w-[1400px] mx-auto">
        {/* Pending verification banner */}
        {tutorProfile && isPending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
            style={{
              backgroundColor: `${colors.state.info}15`,
              border: `1px solid ${colors.state.info}40`,
            }}
          >
            <VerifiedCheck
              weight="BoldDuotone"
              className="w-6 h-6 flex-shrink-0"
              style={{ color: colors.state.info }}
            />
            <div className="flex-1">
              <p
                className="font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.verificationBanner.pendingTitle")}
              </p>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {t("tutorDashboard.verificationBanner.pendingDesc")}
              </p>
            </div>
          </motion.div>
        )}

        <Outlet />
      </main>

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </div>
  );
};

export default TutorDashboardLayout;
