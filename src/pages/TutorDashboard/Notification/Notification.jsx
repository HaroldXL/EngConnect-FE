import { useState } from "react";
import { Bell, BellOff, BookBookmark, CalendarMark, ChatDots, CheckCircle, ClockCircle, DangerTriangle, Dollar, Eye, MenuDots, SquareAcademicCap, Star, TrashBinMinimalistic, VolumeSmall } from "@solar-icons/react"
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
      title: t("tutorDashboard.notifications.newBooking"),
      message: t("tutorDashboard.notifications.newBookingMsg", {
        student: "John Doe",
        time: "Tomorrow 3:00 PM",
      }),
      time: "5 min ago",
      read: false,
      icon: CalendarMark,
      color: colors.primary.main,
      avatar: "https://i.pravatar.cc/150?u=student1",
    },
    {
      id: 2,
      type: "homework",
      title: t("tutorDashboard.notifications.newSubmission"),
      message: t("tutorDashboard.notifications.newSubmissionMsg", {
        student: "Emily Chen",
        assignment: "Business Writing Task",
      }),
      time: "30 min ago",
      read: false,
      icon: BookBookmark,
      color: colors.state.warning,
      avatar: "https://i.pravatar.cc/150?u=student2",
    },
    {
      id: 3,
      type: "earnings",
      title: t("tutorDashboard.notifications.paymentReceived"),
      message: t("tutorDashboard.notifications.paymentReceivedMsg", {
        amount: "$150.00",
      }),
      time: "2 hours ago",
      read: false,
      icon: Dollar,
      color: colors.state.success,
      avatar: null,
    },
    {
      id: 4,
      type: "review",
      title: t("tutorDashboard.notifications.newReview"),
      message: t("tutorDashboard.notifications.newReviewMsg", {
        student: "Michael Lee",
        rating: "5",
      }),
      time: "3 hours ago",
      read: true,
      icon: Star,
      color: "#F59E0B",
      avatar: "https://i.pravatar.cc/150?u=student3",
    },
    {
      id: 5,
      type: "community",
      title: t("tutorDashboard.notifications.questionTagged"),
      message: t("tutorDashboard.notifications.questionTaggedMsg", {
        topic: "Grammar",
      }),
      time: "Yesterday",
      read: true,
      icon: ChatDots,
      color: "#8B5CF6",
      avatar: null,
    },
    {
      id: 6,
      type: "student",
      title: t("tutorDashboard.notifications.newStudent"),
      message: t("tutorDashboard.notifications.newStudentMsg", {
        student: "Anna Smith",
        course: "IELTS Speaking",
      }),
      time: "Yesterday",
      read: true,
      icon: SquareAcademicCap,
      color: colors.primary.main,
      avatar: "https://i.pravatar.cc/150?u=student4",
    },
    {
      id: 7,
      type: "lesson",
      title: t("tutorDashboard.notifications.lessonCancelled"),
      message: t("tutorDashboard.notifications.lessonCancelledMsg", {
        student: "David Park",
        time: "Today 5:00 PM",
      }),
      time: "2 days ago",
      read: true,
      icon: CalendarMark,
      color: colors.state.error,
      avatar: "https://i.pravatar.cc/150?u=student5",
    },
    {
      id: 8,
      type: "system",
      title: t("tutorDashboard.notifications.systemUpdate"),
      message: t("tutorDashboard.notifications.systemUpdateMsg"),
      time: "3 days ago",
      read: true,
      icon: VolumeSmall,
      color: colors.text.secondary,
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
            {t("tutorDashboard.notifications.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("tutorDashboard.notifications.subtitle")}
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
              {t("tutorDashboard.notifications.markAllRead")}
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
                {t("tutorDashboard.notifications.clearAll")}
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<BellOff weight="BoldDuotone" size={18} />}
              >
                {t("tutorDashboard.notifications.settings")}
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
                {t("tutorDashboard.notifications.total")}
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
                {t("tutorDashboard.notifications.unread")}
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
                {t("tutorDashboard.notifications.lessons")}
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
                {t("tutorDashboard.notifications.homework")}
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
              className="px-4 pt-4 border-b overflow-x-auto"
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
                      <span>{t("tutorDashboard.notifications.all")}</span>
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
                      <span>{t("tutorDashboard.notifications.unreadTab")}</span>
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
                  title={t("tutorDashboard.notifications.lessonsTab")}
                />
                <Tab
                  key="homework"
                  title={t("tutorDashboard.notifications.homeworkTab")}
                />
                <Tab
                  key="earnings"
                  title={t("tutorDashboard.notifications.earningsTab")}
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
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
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
                    {t("tutorDashboard.notifications.empty")}
                  </motion.p>
                  <motion.p
                    style={{ color: colors.text.secondary }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {t("tutorDashboard.notifications.emptyDesc")}
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
                                          "tutorDashboard.notifications.markRead",
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
                                      {t("tutorDashboard.notifications.delete")}
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
