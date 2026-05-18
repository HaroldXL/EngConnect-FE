import { useState } from "react";
import {
  AltArrowDown,
  AltArrowLeft,
  AltArrowRight,
  Bell,
  BillList,
  BookBookmark,
  CalendarMark,
  ChecklistMinimalistic,
  CloseSquare,
  Dollar,
  DollarMinimalistic,
  HomeSmile,
  Logout,
  MinimalisticMagnifier,
  PresentationGraph,
  ShieldCheck,
  SquareAcademicCap,
  Tag,
  TagPrice,
  Ticket,
  TicketSale,
  Wallet,
} from "@solar-icons/react";
import { useSelector } from "react-redux";
import { selectUser } from "../store";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  Button,
  Avatar,
  Badge,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import LogoutModal from "../components/LogoutModal/LogoutModal";
import { useThemeColors } from "../hooks/useThemeColors";
import { useTheme } from "../contexts/ThemeContext";
import useInputStyles from "../hooks/useInputStyles";
import useDropdownStyles from "../hooks/useDropdownStyles";
import ThemeSwitcher from "../components/ThemeSwitcher/ThemeSwitcher";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";
import logoImage from "../assets/images/logo.png";
import logoNoTextImage from "../assets/images/logo-no-text.png";
import defaultAvatar from "../assets/images/null-avatar.jpg";

const AdminDashboardLayout = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { theme } = useTheme();
  const { dropdownClassNames } = useDropdownStyles();
  const { inputClassNames } = useInputStyles();
  const user = useSelector(selectUser);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const toggleSubmenu = (key) =>
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));

  const navItems = [
    {
      path: "/admin/dashboard",
      label: t("adminDashboard.nav.dashboard"),
      icon: HomeSmile,
    },
    {
      path: "/admin/students",
      label: t("adminDashboard.nav.students"),
      icon: SquareAcademicCap,
    },
    {
      submenuKey: "tutors",
      label: t("adminDashboard.nav.tutors"),
      icon: PresentationGraph,
      children: [
        {
          path: "/admin/tutors",
          label: t("adminDashboard.nav.tutorList"),
          icon: PresentationGraph,
        },
        {
          path: "/admin/verification",
          label: t("adminDashboard.nav.verification"),
          icon: ShieldCheck,
        },
      ],
    },
    {
      submenuKey: "courses",
      label: t("adminDashboard.nav.courses"),
      icon: BookBookmark,
      children: [
        {
          path: "/admin/courses",
          label: t("adminDashboard.nav.courseList"),
          icon: BookBookmark,
        },
        {
          path: "/admin/course-verification",
          label: t("adminDashboard.nav.courseVerification"),
          icon: ShieldCheck,
        },
        {
          path: "/admin/categories",
          label: t("adminDashboard.nav.categories"),
          icon: Tag,
        },
      ],
    },
    {
      path: "/admin/schedule",
      label: t("adminDashboard.nav.schedule"),
      icon: CalendarMark,
    },
    {
      submenuKey: "finance",
      label: t("adminDashboard.nav.finance"),
      icon: Dollar,
      children: [
        {
          path: "/admin/finance",
          label: t("adminDashboard.nav.ordersTransactions"),
          icon: BillList,
        },
        {
          path: "/admin/payroll",
          label: t("adminDashboard.nav.payroll"),
          icon: Wallet,
        },
        {
          path: "/admin/commission",
          label: t("adminDashboard.nav.commission"),
          icon: TicketSale,
        },
      ],
    },
    {
      path: "/admin/support-tickets",
      label: t("adminDashboard.nav.supportTickets"),
      icon: Ticket,
    },
  ];

  const isActive = (path) => location.pathname === path;
  const isSubmenuActive = (item) =>
    item.children?.some((child) => location.pathname === child.path);

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: colors.background.gray }}
    >
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
        style={{
          backgroundColor: colors.background.light,
          borderRight: `1px solid ${colors.border.light}`,
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center justify-between px-4"
          style={{ borderBottom: `1px solid ${colors.border.light}` }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 no-underline flex-shrink-0"
          >
            <img
              src={sidebarCollapsed ? logoNoTextImage : logoImage}
              alt="EngConnect"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              className={`${sidebarCollapsed ? "h-8" : "h-9"} w-auto transition-all duration-300`}
            />
          </Link>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex"
          >
            {sidebarCollapsed ? (
              <AltArrowRight
                weight="BoldDuotone"
                className="w-4 h-4"
                style={{ color: colors.text.secondary }}
              />
            ) : (
              <AltArrowLeft
                weight="BoldDuotone"
                className="w-4 h-4"
                style={{ color: colors.text.secondary }}
              />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item, idx) => {
              const Icon = item.icon;

              // Submenu item
              if (item.children) {
                const submenuActive = isSubmenuActive(item);
                const submenuOpen =
                  openSubmenus[item.submenuKey] || submenuActive;
                return (
                  <div key={item.submenuKey}>
                    <Tooltip
                      content={item.label}
                      placement="right"
                      isDisabled={!sidebarCollapsed}
                    >
                      <button
                        onClick={() => {
                          if (sidebarCollapsed) {
                            setSidebarCollapsed(false);
                            setOpenSubmenus((prev) => ({
                              ...prev,
                              [item.submenuKey]: true,
                            }));
                          } else {
                            toggleSubmenu(item.submenuKey);
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-200 ${
                          sidebarCollapsed ? "justify-center" : ""
                        }`}
                        style={{
                          backgroundColor: submenuActive
                            ? colors.background.primaryLight
                            : "transparent",
                          color: submenuActive
                            ? colors.primary.main
                            : colors.text.secondary,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Icon
                          className="w-5 h-5 flex-shrink-0"
                          weight="BoldDuotone"
                        />
                        {!sidebarCollapsed && (
                          <>
                            <span
                              className={`text-sm flex-1 text-left ${submenuActive ? "font-semibold" : "font-medium"}`}
                            >
                              {item.label}
                            </span>
                            <AltArrowDown
                              weight="BoldDuotone"
                              className={`w-4 h-4 transition-transform duration-200 ${submenuOpen ? "rotate-180" : ""}`}
                            />
                          </>
                        )}
                      </button>
                    </Tooltip>
                    <AnimatePresence initial={false}>
                      {!sidebarCollapsed && submenuOpen && (
                        <motion.div
                          key="submenu"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            className="mx-1 mt-1 mb-1 rounded-xl p-2 space-y-0.5"
                            style={{ backgroundColor: colors.background.gray }}
                          >
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const childActive = isActive(child.path);
                              return (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  className="flex items-center gap-3 px-3 py-2 rounded-lg no-underline transition-all duration-150"
                                  style={{
                                    backgroundColor: childActive
                                      ? colors.background.primaryLight
                                      : "transparent",
                                    color: childActive
                                      ? colors.primary.main
                                      : colors.text.secondary,
                                  }}
                                >
                                  <ChildIcon
                                    className="w-4 h-4 flex-shrink-0"
                                    weight="BoldDuotone"
                                  />
                                  <span
                                    className={`text-sm ${
                                      childActive
                                        ? "font-semibold"
                                        : "font-medium"
                                    }`}
                                  >
                                    {child.label}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              // Regular nav item
              const active = isActive(item.path);
              return (
                <Tooltip
                  key={item.path}
                  content={item.label}
                  placement="right"
                  isDisabled={!sidebarCollapsed}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition-all duration-200 ${
                      sidebarCollapsed ? "justify-center" : ""
                    }`}
                    style={{
                      backgroundColor: active
                        ? colors.background.primaryLight
                        : "transparent",
                      color: active
                        ? colors.primary.main
                        : colors.text.secondary,
                    }}
                  >
                    <Icon
                      className="w-5 h-5 flex-shrink-0"
                      weight="BoldDuotone"
                    />
                    {!sidebarCollapsed && (
                      <span
                        className={`text-sm ${active ? "font-semibold" : "font-medium"}`}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                </Tooltip>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div
          className="p-3"
          style={{ borderTop: `1px solid ${colors.border.light}` }}
        >
          <Tooltip
            content={t("adminDashboard.nav.logout")}
            placement="right"
            isDisabled={!sidebarCollapsed}
          >
            <Button
              variant="light"
              className={`w-full ${sidebarCollapsed ? "justify-center" : "justify-start"}`}
              startContent={
                <Logout
                  weight="BoldDuotone"
                  className="w-5 h-5"
                  style={{ color: colors.state.error }}
                />
              }
              style={{ color: colors.state.error }}
              onPress={() => setLogoutModalOpen(true)}
            >
              {!sidebarCollapsed && t("adminDashboard.nav.logout")}
            </Button>
          </Tooltip>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
              style={{
                backgroundColor: colors.background.light,
              }}
            >
              {/* Mobile Logo */}
              <div
                className="h-16 flex items-center justify-between px-4"
                style={{ borderBottom: `1px solid ${colors.border.light}` }}
              >
                <Link to="/" className="flex items-center gap-2 no-underline">
                  <img
                    src={logoImage}
                    alt="EngConnect"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    className="h-9 w-auto"
                  />
                </Link>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => setMobileMenuOpen(false)}
                >
                  <CloseSquare
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.text.secondary }}
                  />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 py-4 px-3 overflow-y-auto">
                <div className="space-y-1">
                  {navItems.map((item, idx) => {
                    const Icon = item.icon;

                    // Submenu item
                    if (item.children) {
                      const submenuActive = isSubmenuActive(item);
                      const submenuOpen =
                        openSubmenus[item.submenuKey] || submenuActive;
                      return (
                        <div key={item.submenuKey}>
                          <button
                            onClick={() => toggleSubmenu(item.submenuKey)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-200"
                            style={{
                              backgroundColor: submenuActive
                                ? colors.background.primaryLight
                                : "transparent",
                              color: submenuActive
                                ? colors.primary.main
                                : colors.text.secondary,
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <Icon
                              className="w-5 h-5 flex-shrink-0"
                              weight="BoldDuotone"
                            />
                            <span
                              className={`text-sm flex-1 text-left ${submenuActive ? "font-semibold" : "font-medium"}`}
                            >
                              {item.label}
                            </span>
                            <AltArrowDown
                              weight="BoldDuotone"
                              className={`w-4 h-4 transition-transform duration-200 ${submenuOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {submenuOpen && (
                              <motion.div
                                key={`mobile-submenu-${item.submenuKey}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.22,
                                  ease: "easeInOut",
                                }}
                                style={{ overflow: "hidden" }}
                              >
                                <div
                                  className="mx-1 mt-1 mb-1 rounded-xl p-2 space-y-0.5"
                                  style={{
                                    backgroundColor: colors.background.gray,
                                  }}
                                >
                                  {item.children.map((child) => {
                                    const ChildIcon = child.icon;
                                    const childActive = isActive(child.path);
                                    return (
                                      <Link
                                        key={child.path}
                                        to={child.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg no-underline transition-all duration-150"
                                        style={{
                                          backgroundColor: childActive
                                            ? colors.background.primaryLight
                                            : "transparent",
                                          color: childActive
                                            ? colors.primary.main
                                            : colors.text.secondary,
                                        }}
                                      >
                                        <ChildIcon
                                          className="w-4 h-4 flex-shrink-0"
                                          weight="BoldDuotone"
                                        />
                                        <span
                                          className={`text-sm ${
                                            childActive
                                              ? "font-semibold"
                                              : "font-medium"
                                          }`}
                                        >
                                          {child.label}
                                        </span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    // Regular nav item
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition-all duration-200"
                        style={{
                          backgroundColor: active
                            ? colors.background.primaryLight
                            : "transparent",
                          color: active
                            ? colors.primary.main
                            : colors.text.secondary,
                        }}
                      >
                        <Icon
                          className="w-5 h-5 flex-shrink-0"
                          weight="BoldDuotone"
                        />
                        <span
                          className={`text-sm ${active ? "font-semibold" : "font-medium"}`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* Mobile Sidebar Footer */}
              <div
                className="p-3"
                style={{ borderTop: `1px solid ${colors.border.light}` }}
              >
                <Button
                  variant="light"
                  className="w-full justify-start"
                  startContent={
                    <Logout
                      weight="BoldDuotone"
                      className="w-5 h-5"
                      style={{ color: colors.state.error }}
                    />
                  }
                  style={{ color: colors.state.error }}
                  onPress={() => setLogoutModalOpen(true)}
                >
                  {t("adminDashboard.nav.logout")}
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Top Header */}
        <header
          className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-8 backdrop-blur-md"
          style={{
            backgroundColor:
              theme === "dark"
                ? "rgba(30, 41, 59, 0.9)"
                : "rgba(255, 255, 255, 0.8)",
            borderBottom: `1px solid ${colors.border.light}`,
          }}
        >
          {/* Mobile Menu Button */}
          <Button
            isIconOnly
            variant="light"
            className="lg:hidden"
            onPress={() => setMobileMenuOpen(true)}
          >
            <ChecklistMinimalistic
              weight="BoldDuotone"
              className="w-6 h-6"
              style={{ color: colors.text.primary }}
            />
          </Button>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <Input
              type="text"
              placeholder={t("adminDashboard.search.placeholder")}
              startContent={
                <MinimalisticMagnifier
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
            <ThemeSwitcher />
            <LanguageSwitcher />

            {/* Notifications */}
            {/* <Badge content="5" color="danger" shape="circle" size="sm">
              <Button
                isIconOnly
                variant="light"
                radius="full"
                onPress={() => navigate("/admin/notifications")}
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
                <Button variant="light" className="gap-2 px-2">
                  <Avatar
                    src={user?.avatarUrl || defaultAvatar}
                    size="sm"
                    className="w-8 h-8"
                  />
                  <div className="hidden sm:flex flex-col items-start">
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {user
                        ? `${user.firstName} ${user.lastName}`
                        : "Admin User"}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      {t("adminDashboard.role")}
                    </span>
                  </div>
                  <AltArrowDown
                    weight="BoldDuotone"
                    className="w-4 h-4 hidden sm:block"
                    style={{ color: colors.text.secondary }}
                  />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Admin actions">
                <DropdownItem
                  key="logout"
                  color="danger"
                  startContent={
                    <Logout weight="BoldDuotone" className="w-4 h-4" />
                  }
                  onPress={() => setLogoutModalOpen(true)}
                >
                  {t("adminDashboard.nav.logout")}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboardLayout;
