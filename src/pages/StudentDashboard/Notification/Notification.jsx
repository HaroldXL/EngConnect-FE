import { useState } from "react";
import { Bell, BellOff, BookBookmark, CalendarMark, Card2, ChatDots, CheckCircle, ClockCircle, CupFirst, DangerTriangle, Eye, MenuDots, SquareAcademicCap, TrashBinMinimalistic, VolumeSmall } from "@solar-icons/react"
import {
  Card,
  CardBody,
  Button,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { motion, AnimatePresence } from "framer-motion";

import ChillImage from "../../../assets/illustrations/chill.avif";

const Notification = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [selectedTab, setSelectedTab] = useState("all");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "lesson",
      title: t("studentDashboard.notifications.lessonReminder"),
      message: t("studentDashboard.notifications.lessonReminderMsg", {
        tutor: "Sarah Johnson",
        time: "30 minutes",
      }),
      time: "5 min ago",
      read: false,
      icon: CalendarMark,
      color: colors.primary.main,
      avatar: "https://i.pravatar.cc/150?u=tutor1",
    },
    {
      id: 2,
      type: "homework",
      title: t("studentDashboard.notifications.homeworkDue"),
      message: t("studentDashboard.notifications.homeworkDueMsg", {
        assignment: "Business Writing Task",
        time: "2 hours",
      }),
      time: "1 hour ago",
      read: false,
      icon: BookBookmark,
      color: colors.state.warning,
      avatar: null,
    },
    {
      id: 3,
      type: "achievement",
      title: t("studentDashboard.notifications.newAchievement"),
      message: t("studentDashboard.notifications.newAchievementMsg", {
        achievement: "7 Day Streak",
      }),
      time: "2 hours ago",
      read: false,
      icon: CupFirst,
      color: colors.state.success,
      avatar: null,
    },
    {
      id: 4,
      type: "community",
      title: t("studentDashboard.notifications.newReply"),
      message: t("studentDashboard.notifications.newReplyMsg", {
        user: "Michael Chen",
      }),
      time: "3 hours ago",
      read: true,
      icon: ChatDots,
      color: "#8B5CF6",
      avatar: "https://i.pravatar.cc/150?u=user2",
    },
    {
      id: 5,
      type: "system",
      title: t("studentDashboard.notifications.systemUpdate"),
      message: t("studentDashboard.notifications.systemUpdateMsg"),
      time: "Yesterday",
      read: true,
      icon: VolumeSmall,
      color: colors.text.secondary,
      avatar: null,
    },
    {
      id: 6,
      type: "lesson",
      title: t("studentDashboard.notifications.lessonCompleted"),
      message: t("studentDashboard.notifications.lessonCompletedMsg", {
        lesson: "IELTS Speaking Practice",
      }),
      time: "Yesterday",
      read: true,
      icon: SquareAcademicCap,
      color: colors.state.success,
      avatar: null,
    },
    {
      id: 7,
      type: "payment",
      title: t("studentDashboard.notifications.paymentSuccess"),
      message: t("studentDashboard.notifications.paymentSuccessMsg", {
        amount: "$49.99",
        course: "Business English Masterclass",
      }),
      time: "2 days ago",
      read: true,
      icon: Card2,
      color: colors.state.success,
      avatar: null,
    },
    {
      id: 8,
      type: "homework",
      title: t("studentDashboard.notifications.homeworkGraded"),
      message: t("studentDashboard.notifications.homeworkGradedMsg", {
        score: "95%",
        assignment: "Grammar Quiz",
      }),
      time: "2 days ago",
      read: true,
      icon: CheckCircle,
      color: colors.state.success,
      avatar: null,
    },
    {
      id: 9,
      type: "system",
      title: t("studentDashboard.notifications.maintenanceNotice"),
      message: t("studentDashboard.notifications.maintenanceNoticeMsg"),
      time: "3 days ago",
      read: true,
      icon: DangerTriangle,
      color: colors.state.warning,
      avatar: null,
    },
  ]);

  const filterNotifications = (tab) => {
    if (tab === "all") return notifications;
    if (tab === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === tab);
  };

  const filteredNotifications = filterNotifications(selectedTab);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.15 },
    },
    exit: {
      opacity: 0,
      x: -100,
      transition: { duration: 0.15 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold mb-1"
            style={{ color: colors.text.primary }}
          >
            {t("studentDashboard.notifications.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("studentDashboard.notifications.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              style={{
                backgroundColor: colors.button.primaryLight.background,
                color: colors.button.primaryLight.text,
              }}
              startContent={<CheckCircle weight="BoldDuotone" size={18} />}
              onPress={markAllAsRead}
            >
              {t("studentDashboard.notifications.markAllRead")}
            </Button>
          )}
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="flat">
                <MenuDots size={20} weight="BoldDuotone" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Notification actions">
              <DropdownItem
                key="clear"
                startContent={<TrashBinMinimalistic weight="BoldDuotone" size={18} />}
                className="text-danger"
                color="danger"
                onPress={clearAll}
              >
                {t("studentDashboard.notifications.clearAll")}
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<BellOff weight="BoldDuotone" size={18} />}
              >
                {t("studentDashboard.notifications.settings")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </motion.div>

      {/* Notification Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: colors.background.primaryLight }}
            >
              <Bell weight="BoldDuotone" size={20} style={{ color: colors.primary.main }} />
            </div>
            <div>
              <p
                className="text-2xl font-bold"
                style={{ color: colors.text.primary }}
              >
                {notifications.length}
              </p>
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                {t("studentDashboard.notifications.total")}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.state.error}20` }}
            >
              <ClockCircle weight="BoldDuotone" size={20} style={{ color: colors.state.error }} />
            </div>
            <div>
              <p
                className="text-2xl font-bold"
                style={{ color: colors.text.primary }}
              >
                {unreadCount}
              </p>
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                {t("studentDashboard.notifications.unread")}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.state.success}20` }}
            >
              <CalendarMark weight="BoldDuotone"
                size={20}
                style={{ color: colors.state.success }}
              />
            </div>
            <div>
              <p
                className="text-2xl font-bold"
                style={{ color: colors.text.primary }}
              >
                {notifications.filter((n) => n.type === "lesson").length}
              </p>
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                {t("studentDashboard.notifications.lessons")}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.state.warning}20` }}
            >
              <BookBookmark weight="BoldDuotone" size={20} style={{ color: colors.state.warning }} />
            </div>
            <div>
              <p
                className="text-2xl font-bold"
                style={{ color: colors.text.primary }}
              >
                {notifications.filter((n) => n.type === "homework").length}
              </p>
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                {t("studentDashboard.notifications.homework")}
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Tabs & Notifications */}
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
          <CardBody className="p-0">
            {/* Tabs */}
            <div
              className="px-4 pt-4 border-b"
              style={{ borderColor: colors.border.light }}
            >
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={setSelectedTab}
                variant="underlined"
                classNames={{
                  tabList: "gap-6",
                  cursor: "bg-primary",
                  tab: "px-0 h-10",
                }}
              >
                <Tab
                  key="all"
                  title={
                    <div className="flex items-center gap-2">
                      <span>{t("studentDashboard.notifications.all")}</span>
                      <Chip size="sm" variant="flat">
                        {notifications.length}
                      </Chip>
                    </div>
                  }
                />
                <Tab
                  key="unread"
                  title={
                    <div className="flex items-center gap-2">
                      <span>
                        {t("studentDashboard.notifications.unreadTab")}
                      </span>
                      {unreadCount > 0 && (
                        <Chip size="sm" color="danger">
                          {unreadCount}
                        </Chip>
                      )}
                    </div>
                  }
                />
                <Tab
                  key="lesson"
                  title={t("studentDashboard.notifications.lessonsTab")}
                />
                <Tab
                  key="homework"
                  title={t("studentDashboard.notifications.homeworkTab")}
                />
                <Tab
                  key="system"
                  title={t("studentDashboard.notifications.systemTab")}
                />
              </Tabs>
            </div>

            {/* Notifications List */}
            <div className="p-4">
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="text-center py-8"
                >
                  <motion.img
                    src={ChillImage}
                    alt="No notifications"
                    className="w-64 h-64 mx-auto object-contain"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  />
                  <motion.p
                    className="text-lg font-medium mb-1"
                    style={{ color: colors.text.primary }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {t("studentDashboard.notifications.empty")}
                  </motion.p>
                  <motion.p
                    style={{ color: colors.text.secondary }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {t("studentDashboard.notifications.emptyDesc")}
                  </motion.p>
                </motion.div>
              ) : (
                <motion.ul
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  <AnimatePresence>
                    {filteredNotifications.map((notification) => (
                      <motion.li
                        key={notification.id}
                        variants={itemVariants}
                        exit="exit"
                        layout
                      >
                        <div
                          className={`flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                            !notification.read ? "border-l-4" : ""
                          }`}
                          style={{
                            backgroundColor: notification.read
                              ? "transparent"
                              : colors.background.gray,
                            borderLeftColor: !notification.read
                              ? notification.color
                              : "transparent",
                          }}
                          onClick={() => markAsRead(notification.id)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              colors.background.gray;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              notification.read
                                ? "transparent"
                                : colors.background.gray;
                          }}
                        >
                          {/* Icon or Avatar */}
                          {notification.avatar ? (
                            <Avatar
                              src={notification.avatar}
                              size="md"
                              className="flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: `${notification.color}20`,
                              }}
                            >
                              <notification.icon
                                size={20}
                                weight="BoldDuotone"
                                style={{ color: notification.color }}
                              />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p
                                  className={`font-medium ${
                                    !notification.read ? "font-semibold" : ""
                                  }`}
                                  style={{ color: colors.text.primary }}
                                >
                                  {notification.title}
                                </p>
                                <p
                                  className="text-sm mt-0.5 line-clamp-2"
                                  style={{ color: colors.text.secondary }}
                                >
                                  {notification.message}
                                </p>
                                <p
                                  className="text-xs mt-2 flex items-center gap-1"
                                  style={{ color: colors.text.tertiary }}
                                >
                                  <ClockCircle weight="BoldDuotone" size={12} />
                                  {notification.time}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!notification.read && (
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: colors.primary.main,
                                    }}
                                  />
                                )}
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MenuDots size={18} weight="BoldDuotone" />
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu aria-label="Actions">
                                    {!notification.read && (
                                      <DropdownItem
                                        key="read"
                                        startContent={<Eye weight="BoldDuotone" size={16} />}
                                        onPress={() =>
                                          markAsRead(notification.id)
                                        }
                                      >
                                        {t(
                                          "studentDashboard.notifications.markRead",
                                        )}
                                      </DropdownItem>
                                    )}
                                    <DropdownItem
                                      key="delete"
                                      startContent={<TrashBinMinimalistic weight="BoldDuotone" size={16} />}
                                      className="text-danger"
                                      color="danger"
                                      onPress={() =>
                                        deleteNotification(notification.id)
                                      }
                                    >
                                      {t(
                                        "studentDashboard.notifications.delete",
                                      )}
                                    </DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default Notification;
