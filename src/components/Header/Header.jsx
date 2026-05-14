import React, { useState, useEffect } from "react";
import {
  AltArrowRight,
  BookBookmark,
  CloseSquare,
  HamburgerMenu,
  Logout,
  Magnifer,
  NotebookMinimalistic,
  QuestionCircle,
  SquareAcademicCap,
} from "@solar-icons/react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Input,
} from "@heroui/react";

import logoImage from "../../assets/images/logo.png";
import defaultAvatar from "../../assets/images/null-avatar.jpg";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import * as MotionLib from "framer-motion";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTheme } from "../../contexts/ThemeContext";
import { selectIsAuthenticated, selectUser } from "../../store";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import ThemeSwitcher from "../ThemeSwitcher/ThemeSwitcher";
import LogoutModal from "../LogoutModal/LogoutModal";
import useDropdownStyles from "../../hooks/useDropdownStyles";
import { tutorApi } from "../../api/tutorApi";

// eslint-disable-next-line no-unused-vars
const { motion, AnimatePresence } = MotionLib;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const { dropdownClassNames } = useDropdownStyles();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [tutorVerifiedStatus, setTutorVerifiedStatus] = useState(
    () => sessionStorage.getItem("tutorVerifiedStatus") || null,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const hasRole = (role) => user?.roles?.includes(role);

  useEffect(() => {
    if (hasRole("Tutor")) {
      tutorApi
        .getTutorProfile()
        .then((data) => {
          if (data.isSuccess) {
            const status = data.data?.verifiedStatus;
            setTutorVerifiedStatus(status);
            if (status) sessionStorage.setItem("tutorVerifiedStatus", status);
          }
        })
        .catch(() => {});
    } else {
      sessionStorage.removeItem("tutorVerifiedStatus");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.courses"), href: "/courses" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.becomeTutor"), href: "/become-tutor" },
  ];

  const isActiveRoute = (href) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-xs ${
          isScrolled ? "border-b" : "border-b border-transparent"
        }`}
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(30, 41, 59, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          borderColor: isScrolled ? colors.border.light : "transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
          <div className="flex justify-between items-center h-18 py-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group no-underline">
              <img
                src={logoImage}
                alt="EngConnect"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="h-10 w-auto transition-all duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-full"
              style={{ backgroundColor: colors.background.gray }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="relative px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 no-underline"
                  style={{
                    color: isActiveRoute(item.href)
                      ? colors.text.white
                      : colors.text.secondary,
                    backgroundColor: isActiveRoute(item.href)
                      ? colors.primary.main
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActiveRoute(item.href)) {
                      e.currentTarget.style.backgroundColor =
                        colors.primary.lightest;
                      e.currentTarget.style.color = colors.primary.main;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActiveRoute(item.href)) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = colors.text.secondary;
                    }
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Magnifer */}
              <Popover
                isOpen={searchOpen}
                onOpenChange={setSearchOpen}
                placement="bottom"
                offset={10}
              >
                <PopoverTrigger>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    radius="full"
                    aria-label="Magnifer"
                  >
                    <Magnifer
                      weight="BoldDuotone"
                      className="w-[18px] h-[18px]"
                      style={{ color: colors.text.secondary }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-3 w-80"
                  style={{ backgroundColor: colors.background.light }}
                >
                  <Input
                    autoFocus
                    placeholder={t("courses.search.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        setSearchOpen(false);
                        navigate(
                          `/courses?q=${encodeURIComponent(searchQuery.trim())}`,
                        );
                        setSearchQuery("");
                      }
                    }}
                    startContent={
                      <Magnifer
                        weight="BoldDuotone"
                        className="w-4 h-4"
                        style={{ color: colors.text.secondary }}
                      />
                    }
                    classNames={{
                      input: "text-sm",
                      inputWrapper: `shadow-none ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      }`,
                    }}
                    size="md"
                  />
                </PopoverContent>
              </Popover>

              {/* Theme & Language Switchers */}
              <div className="hidden sm:flex items-center gap-1">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>

              {/* Auth Section - Desktop */}
              <div className="hidden md:flex items-center gap-3 ml-3">
                {isAuthenticated && user ? (
                  <>
                    {hasRole("Student") && (
                      <Button
                        variant="flat"
                        size="sm"
                        radius="full"
                        className="font-semibold px-4 transition-all duration-300 text-sm"
                        startContent={
                          <NotebookMinimalistic
                            weight="BoldDuotone"
                            className="w-4 h-4"
                          />
                        }
                        style={{
                          backgroundColor:
                            colors.button.primaryLight.background,
                          color: colors.button.primaryLight.text,
                        }}
                        onPress={() => navigate("/student/dashboard")}
                      >
                        {t("nav.learningDashboard")}
                      </Button>
                    )}
                    {hasRole("Tutor") && (
                      <Button
                        variant="flat"
                        size="sm"
                        radius="full"
                        className="font-semibold px-4 transition-all duration-300 text-sm"
                        startContent={
                          <SquareAcademicCap
                            weight="BoldDuotone"
                            className="w-4 h-4"
                          />
                        }
                        style={{
                          backgroundColor:
                            colors.button.primaryLight.background,
                          color: colors.button.primaryLight.text,
                        }}
                        onPress={() =>
                          navigate(
                            tutorVerifiedStatus === "Verified" ||
                              tutorVerifiedStatus === "Pending"
                              ? "/tutor/dashboard"
                              : "/tutor/onboarding",
                          )
                        }
                      >
                        {tutorVerifiedStatus === "Verified" ||
                        tutorVerifiedStatus === "Pending"
                          ? t("nav.tutorDashboard")
                          : t("nav.completeTutorProfile")}
                      </Button>
                    )}
                    <Dropdown
                      placement="bottom-end"
                      showArrow
                      classNames={dropdownClassNames}
                    >
                      <DropdownTrigger>
                        <button className="cursor-pointer focus:outline-none rounded-full transition-all duration-200 hover:opacity-80">
                          <Avatar
                            src={user.avatarUrl || defaultAvatar}
                            name={`${user.firstName} ${user.lastName}`}
                            size="sm"
                            className="flex-shrink-0"
                            imgProps={{ referrerPolicy: "no-referrer" }}
                          />
                        </button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="User menu"
                        onAction={(key) => {
                          if (key === "logout") setIsLogoutModalOpen(true);
                        }}
                      >
                        <DropdownSection showDivider>
                          <DropdownItem
                            key="profile-info"
                            isReadOnly
                            className="cursor-default opacity-100"
                            textValue={`${user.firstName} ${user.lastName}`}
                          >
                            <div className="flex items-center gap-3 py-1">
                              <Avatar
                                src={user.avatarUrl || defaultAvatar}
                                name={`${user.firstName} ${user.lastName}`}
                                size="md"
                                imgProps={{ referrerPolicy: "no-referrer" }}
                              />
                              <div className="flex flex-col">
                                <span
                                  className="font-semibold text-sm"
                                  style={{ color: colors.text.primary }}
                                >
                                  {`${user.firstName} ${user.lastName}`}
                                </span>
                                {user.email && (
                                  <span
                                    className="text-xs"
                                    style={{ color: colors.text.secondary }}
                                  >
                                    {user.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </DropdownItem>
                        </DropdownSection>
                        <DropdownSection>
                          <DropdownItem
                            key="help-support"
                            startContent={
                              <QuestionCircle
                                weight="BoldDuotone"
                                className="w-6 h-6"
                                style={{ color: colors.text.secondary }}
                              />
                            }
                            onPress={() => navigate("/help-support")}
                          >
                            {t("nav.helpSupport")}
                          </DropdownItem>
                          <DropdownItem
                            key="logout"
                            className="text-danger"
                            color="danger"
                            startContent={
                              <Logout
                                weight="BoldDuotone"
                                className="w-6 h-6"
                              />
                            }
                          >
                            {t("nav.logout")}
                          </DropdownItem>
                        </DropdownSection>
                      </DropdownMenu>
                    </Dropdown>
                  </>
                ) : (
                  <>
                    <Button
                      variant="flat"
                      size="sm"
                      radius="full"
                      className="font-semibold px-5 transition-all duration-300 text-sm"
                      style={{
                        backgroundColor: colors.button.primaryLight.background,
                        color: colors.button.primaryLight.text,
                      }}
                      onPress={() => navigate("/login")}
                    >
                      {t("nav.signIn")}
                    </Button>
                    <Button
                      size="sm"
                      radius="full"
                      className="font-semibold px-6 transition-all duration-300 hover:opacity-90 hover:scale-105 text-sm"
                      style={{
                        backgroundColor: colors.primary.main,
                        color: colors.text.white,
                      }}
                      onPress={() => navigate("/register")}
                      endContent={
                        <AltArrowRight
                          weight="BoldDuotone"
                          className="w-4 h-4"
                        />
                      }
                    >
                      {t("nav.getStarted")}
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile HamburgerMenu Button */}
              <Button
                isIconOnly
                variant="light"
                size="sm"
                radius="full"
                className="lg:hidden transition-all duration-300"
                onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <CloseSquare
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.primary }}
                  />
                ) : (
                  <HamburgerMenu
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.primary }}
                  />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile HamburgerMenu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute top-full left-0 right-0 lg:hidden border-t shadow-lg z-50 backdrop-blur-sm"
              style={{
                backgroundColor:
                  theme === "dark"
                    ? "rgba(30, 41, 59, 0.95)"
                    : "rgba(255, 255, 255, 0.95)",
                borderColor: colors.border.light,
              }}
            >
              <div className="px-6 py-6 space-y-2">
                {/* Navigation Links */}
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link
                      to={item.href}
                      className="flex items-center justify-between px-5 py-3.5 rounded-xl font-medium transition-all duration-200"
                      style={{
                        color: isActiveRoute(item.href)
                          ? colors.text.white
                          : colors.text.muted,
                        backgroundColor: isActiveRoute(item.href)
                          ? colors.primary.main
                          : colors.background.gray,
                      }}
                      onPress={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-base">{item.name}</span>
                      <AltArrowRight
                        weight="BoldDuotone"
                        className="w-5 h-5 transition-transform duration-200"
                        style={{
                          color: isActiveRoute(item.href)
                            ? colors.text.white
                            : colors.text.secondary,
                        }}
                      />
                    </Link>
                  </motion.div>
                ))}

                {/* Theme & Language Switchers */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  className="flex items-center justify-center gap-3 py-4 mt-2"
                >
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <ThemeSwitcher />
                    <div
                      className="w-px h-5"
                      style={{ backgroundColor: colors.border.light }}
                    />
                    <LanguageSwitcher />
                  </div>
                </motion.div>

                {/* Auth Section - Mobile */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="flex flex-col gap-3 pt-4 mt-2 border-t"
                  style={{ borderColor: colors.border.light }}
                >
                  {isAuthenticated && user ? (
                    <>
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <Avatar
                          src={user.avatarUrl || defaultAvatar}
                          name={`${user.firstName} ${user.lastName}`}
                          size="sm"
                          imgProps={{ referrerPolicy: "no-referrer" }}
                        />
                        <div className="flex flex-col">
                          <span
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {`${user.firstName} ${user.lastName}`}
                          </span>
                          {user.email && (
                            <span
                              className="text-xs"
                              style={{ color: colors.text.secondary }}
                            >
                              {user.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {hasRole("Student") && (
                        <Button
                          radius="full"
                          size="lg"
                          variant="flat"
                          className="font-semibold w-full"
                          startContent={
                            <NotebookMinimalistic
                              weight="BoldDuotone"
                              className="w-5 h-5"
                            />
                          }
                          style={{ color: colors.primary.main }}
                          onPress={() => {
                            navigate("/student/dashboard");
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          {t("nav.learningDashboard")}
                        </Button>
                      )}
                      {hasRole("Tutor") && (
                        <Button
                          radius="full"
                          size="lg"
                          variant="flat"
                          className="font-semibold w-full"
                          startContent={
                            <SquareAcademicCap
                              weight="BoldDuotone"
                              className="w-5 h-5"
                            />
                          }
                          style={{ color: colors.primary.main }}
                          onPress={() => {
                            navigate(
                              tutorVerifiedStatus === "Verified" ||
                                tutorVerifiedStatus === "Pending"
                                ? "/tutor/dashboard"
                                : "/tutor/onboarding",
                            );
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          {tutorVerifiedStatus === "Verified" ||
                          tutorVerifiedStatus === "Pending"
                            ? t("nav.tutorDashboard")
                            : t("nav.completeTutorProfile")}
                        </Button>
                      )}
                      <Button
                        radius="full"
                        size="lg"
                        color="danger"
                        variant="flat"
                        className="font-semibold w-full"
                        startContent={
                          <Logout weight="BoldDuotone" className="w-5 h-5" />
                        }
                        onPress={() => {
                          setIsMobileMenuOpen(false);
                          setIsLogoutModalOpen(true);
                        }}
                      >
                        {t("nav.logout")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="bordered"
                        radius="full"
                        size="lg"
                        className="font-semibold w-full transition-all duration-200"
                        style={{
                          borderColor: colors.border.medium,
                          color: colors.text.primary,
                        }}
                        onPress={() => {
                          navigate("/login");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {t("nav.signIn")}
                      </Button>
                      <Button
                        radius="full"
                        size="lg"
                        className="font-semibold w-full transition-all duration-200"
                        style={{
                          backgroundColor: colors.primary.main,
                          color: colors.text.white,
                        }}
                        onPress={() => {
                          navigate("/register");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {t("nav.getStarted")}
                      </Button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile HamburgerMenu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
};

export default Header;
