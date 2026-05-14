import { useState } from "react";
import { AltArrowDown, BookBookmark, Calendar, Dollar, Export, GraphDown, GraphUp, UsersGroupRounded } from "@solar-icons/react"
import {
  Card,
  CardBody,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { motion } from "framer-motion";


const AnalyticsReports = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    {
      icon: UsersGroupRounded,
      label: t("adminDashboard.analytics.stats.newStudents"),
      value: "1,247",
      change: "+12.5%",
      trend: "up",
      color: colors.primary.main,
      bg: colors.background.primaryLight,
    },
    {
      icon: BookBookmark,
      label: t("adminDashboard.analytics.stats.courseEnrollments"),
      value: "3,456",
      change: "+8.2%",
      trend: "up",
      color: colors.state.success,
      bg: `${colors.state.success}20`,
    },
    {
      icon: Dollar,
      label: t("adminDashboard.analytics.stats.revenue"),
      value: "$48,560",
      change: "+22.4%",
      trend: "up",
      color: colors.state.warning,
      bg: `${colors.state.warning}20`,
    },
    {
      icon: GraphUp,
      label: t("adminDashboard.analytics.stats.completionRate"),
      value: "78.5%",
      change: "-2.1%",
      trend: "down",
      color: colors.state.error,
      bg: `${colors.state.error}20`,
    },
  ];

  const topCourses = [
    {
      name: "Business English Masterclass",
      enrollments: 234,
      revenue: "$11,666",
    },
    {
      name: "IELTS Preparation Complete Guide",
      enrollments: 189,
      revenue: "$15,119",
    },
    {
      name: "Conversational English for Beginners",
      enrollments: 312,
      revenue: "$9,347",
    },
    { name: "Advanced Grammar Course", enrollments: 156, revenue: "$6,227" },
    { name: "TOEFL Speaking Strategies", enrollments: 142, revenue: "$12,749" },
  ];

  const topTutors = [
    { name: "Sarah Johnson", students: 234, rating: 4.9, revenue: "$12,450" },
    { name: "Michael Chen", students: 189, rating: 4.8, revenue: "$9,830" },
    { name: "Emma Wilson", students: 312, rating: 4.9, revenue: "$15,200" },
    { name: "David Brown", students: 145, rating: 4.7, revenue: "$7,890" },
    { name: "Lisa Wang", students: 178, rating: 4.8, revenue: "$10,250" },
  ];

  const revenueData = [
    { month: "Jan", value: 32000 },
    { month: "Feb", value: 35000 },
    { month: "Mar", value: 38000 },
    { month: "Apr", value: 42000 },
    { month: "May", value: 45000 },
    { month: "Jun", value: 48560 },
  ];

  const maxRevenue = Math.max(...revenueData.map((d) => d.value));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            className="text-2xl lg:text-3xl font-bold mb-1"
            style={{ color: colors.text.primary }}
          >
            {t("adminDashboard.analytics.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("adminDashboard.analytics.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                startContent={<Calendar weight="BoldDuotone" className="w-4 h-4" />}
                endContent={<AltArrowDown weight="BoldDuotone" className="w-4 h-4" />}
              >
                {selectedPeriod === "week"
                  ? t("adminDashboard.analytics.thisWeek")
                  : selectedPeriod === "month"
                    ? t("adminDashboard.analytics.thisMonth")
                    : t("adminDashboard.analytics.thisYear")}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Period selection"
              onAction={(key) => setSelectedPeriod(key)}
              selectedKeys={[selectedPeriod]}
              selectionMode="single"
            >
              <DropdownItem key="week">
                {t("adminDashboard.analytics.thisWeek")}
              </DropdownItem>
              <DropdownItem key="month">
                {t("adminDashboard.analytics.thisMonth")}
              </DropdownItem>
              <DropdownItem key="year">
                {t("adminDashboard.analytics.thisYear")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Button
            variant="flat"
            startContent={<Export weight="BoldDuotone" className="w-4 h-4" />}
            style={{ color: colors.text.primary }}
          >
            {t("adminDashboard.analytics.export")}
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Card
              shadow="none"
              className="border-none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: stat.bg }}
                  >
                    <stat.icon
                      className="w-6 h-6"
                      weight="BoldDuotone"
                      style={{ color: stat.color }}
                    />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === "up" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <GraphUp weight="BoldDuotone" className="w-4 h-4" />
                    ) : (
                      <GraphDown weight="BoldDuotone" className="w-4 h-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: colors.text.secondary }}
                  >
                    {stat.label}
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
          variant="underlined"
          classNames={{
            tabList: "gap-6",
            cursor: "w-full",
          }}
          style={{ color: colors.text.primary }}
        >
          <Tab
            key="overview"
            title={t("adminDashboard.analytics.tabs.overview")}
          />
          <Tab
            key="courses"
            title={t("adminDashboard.analytics.tabs.courses")}
          />
          <Tab key="tutors" title={t("adminDashboard.analytics.tabs.tutors")} />
          <Tab
            key="revenue"
            title={t("adminDashboard.analytics.tabs.revenue")}
          />
        </Tabs>
      </motion.div>

      {/* Content based on active tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
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
              <CardBody className="p-5">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.text.primary }}
                >
                  {t("adminDashboard.analytics.revenueOverview")}
                </h3>
                <div className="flex items-end justify-between h-48 gap-2">
                  {revenueData.map((data, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-full rounded-t-lg transition-all duration-300"
                        style={{
                          height: `${(data.value / maxRevenue) * 100}%`,
                          backgroundColor: colors.primary.main,
                          minHeight: "20px",
                        }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {data.month}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Top Courses */}
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
              <CardBody className="p-5">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.text.primary }}
                >
                  {t("adminDashboard.analytics.topCourses")}
                </h3>
                <div className="space-y-3">
                  {topCourses.slice(0, 5).map((course, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: colors.background.gray }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: colors.primary.main,
                            color: colors.text.white,
                          }}
                        >
                          {index + 1}
                        </span>
                        <span
                          className="text-sm font-medium line-clamp-1"
                          style={{ color: colors.text.primary }}
                        >
                          {course.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: colors.state.success }}
                        >
                          {course.revenue}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          {course.enrollments} enrollments
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      )}

      {activeTab === "courses" && (
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
            <CardBody className="p-5">
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: colors.text.primary }}
              >
                {t("adminDashboard.analytics.coursePerformance")}
              </h3>
              <div className="space-y-4">
                {topCourses.map((course, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {course.name}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: colors.state.success }}
                      >
                        {course.revenue}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(course.enrollments / 350) * 100}%`,
                            backgroundColor: colors.primary.main,
                          }}
                        />
                      </div>
                      <span
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {course.enrollments} students
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {activeTab === "tutors" && (
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
            <CardBody className="p-5">
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: colors.text.primary }}
              >
                {t("adminDashboard.analytics.tutorPerformance")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topTutors.map((tutor, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: colors.primary.main,
                          color: colors.text.white,
                        }}
                      >
                        {tutor.name.charAt(0)}
                      </div>
                      <div>
                        <p
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {tutor.name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.secondary }}
                        >
                          ⭐ {tutor.rating}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p
                          className="text-lg font-bold"
                          style={{ color: colors.text.primary }}
                        >
                          {tutor.students}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          Students
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-lg font-bold"
                          style={{ color: colors.state.success }}
                        >
                          {tutor.revenue}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          Revenue
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {activeTab === "revenue" && (
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
            <CardBody className="p-5">
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: colors.text.primary }}
              >
                {t("adminDashboard.analytics.revenueBreakdown")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{ color: colors.state.success }}
                  >
                    $128,450
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("adminDashboard.analytics.totalRevenue")}
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{ color: colors.primary.main }}
                  >
                    $98,230
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("adminDashboard.analytics.courseRevenue")}
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{ color: colors.state.warning }}
                  >
                    $30,220
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("adminDashboard.analytics.subscriptionRevenue")}
                  </p>
                </div>
              </div>
              <div className="flex items-end justify-between h-64 gap-2">
                {revenueData.map((data, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      ${(data.value / 1000).toFixed(0)}k
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-300"
                      style={{
                        height: `${(data.value / maxRevenue) * 180}px`,
                        backgroundColor: colors.primary.main,
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      {data.month}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsReports;
