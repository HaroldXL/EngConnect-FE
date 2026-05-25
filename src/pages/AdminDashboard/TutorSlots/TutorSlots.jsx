import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "@solar-icons/react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Chip,
  Spinner,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { motion } from "framer-motion";
import { tutorApi, adminApi } from "../../../api";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
const withCDN = (url) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return CDN_BASE + url;
};

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const WEEKDAY_SHORT = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const TutorSlots = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const colors = useThemeColors();

  const [scheduleStatusFilter, setScheduleStatusFilter] = useState("all");

  const { data: slotsData, isLoading: schedulesLoading } = useQuery({
    queryKey: ["admin-slots", scheduleStatusFilter],
    queryFn: async () => {
      const params = { page: 1, "page-size": 100 };
      if (scheduleStatusFilter !== "all") params.Status = scheduleStatusFilter;
      const res = await tutorApi.getTutorSchedules(params);
      const items = res?.data?.items || [];
      const uniqueIds = [...new Set(items.map((s) => s.tutorId).filter(Boolean))];
      const results = await Promise.allSettled(
        uniqueIds.map((id) => adminApi.getTutorById(id)),
      );
      const tutorMap = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") tutorMap[uniqueIds[i]] = r.value?.data;
      });
      return { schedules: items, tutorMap };
    },
    staleTime: 60 * 1000,
  });
  const tutorMap = slotsData?.tutorMap ?? {};

  const groupedSlots = useMemo(() => {
    const schedules = slotsData?.schedules ?? [];
    const map = {};
    schedules.forEach((s) => {
      if (!s.tutorId) return;
      if (!map[s.tutorId]) map[s.tutorId] = [];
      map[s.tutorId].push(s);
    });
    return map;
  }, [slotsData]);

  const getSlotStatusColor = (status) => {
    switch (status) {
      case "Open":
        return colors.state.success;
      case "Booked":
        return colors.primary.main;
      case "Pending":
        return colors.state.warning;
      default:
        return colors.text.tertiary;
    }
  };

  const formatTime = (s) => s?.slice(0, 5) || "";
  const tutorName = (t) =>
    t?.user ? `${t.user.firstName || ""} ${t.user.lastName || ""}`.trim() : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <h1
          className="text-2xl lg:text-3xl font-bold mb-1"
          style={{ color: colors.text.primary }}
        >
          {t("adminDashboard.tutorSlots.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {t("adminDashboard.tutorSlots.subtitle")}
        </p>
      </motion.div>

      {/* Status filter */}
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
          <CardBody className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter
                weight="BoldDuotone"
                className="w-4 h-4 flex-shrink-0"
                style={{ color: colors.text.secondary }}
              />
              <span
                className="text-sm"
                style={{ color: colors.text.secondary }}
              >
                {t("adminDashboard.schedule.status")}:
              </span>
              {["all", "Open", "Booked", "Pending", "Inactive"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="flat"
                  style={{
                    backgroundColor:
                      scheduleStatusFilter === s
                        ? colors.primary.main
                        : colors.background.gray,
                    color:
                      scheduleStatusFilter === s
                        ? "#fff"
                        : colors.text.secondary,
                  }}
                  onPress={() => setScheduleStatusFilter(s)}
                >
                  {s === "all"
                    ? t("adminDashboard.schedule.all")
                    : t(`adminDashboard.schedule.scheduleStatuses.${s}`)}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Grouped tutor cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {schedulesLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : Object.keys(groupedSlots).length === 0 ? (
          <p
            className="text-sm text-center py-8"
            style={{ color: colors.text.tertiary }}
          >
            {t("adminDashboard.schedule.noSchedules")}
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedSlots).map(([tutorId, slots]) => {
              const tutor = tutorMap[tutorId];
              const name = tutorName(tutor) || tutorId.slice(0, 8) + "…";
              const bookedCount = slots.filter(
                (s) => s.status === "Booked",
              ).length;
              const openCount = slots.filter((s) => s.status === "Open").length;

              const byDay = {};
              WEEKDAYS.forEach((d) => (byDay[d] = []));
              slots.forEach((s) => {
                if (s.weekday && byDay[s.weekday]) byDay[s.weekday].push(s);
              });

              return (
                <Card
                  key={tutorId}
                  shadow="none"
                  className="border-none"
                  style={{ backgroundColor: colors.background.light }}
                >
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <Avatar
                        src={withCDN(tutor?.avatar)}
                        name={name}
                        size="md"
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/admin/tutors/${tutorId}`)}
                      />
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          className="font-semibold text-sm hover:underline text-left"
                          style={{ color: colors.primary.main }}
                          onClick={() => navigate(`/admin/tutors/${tutorId}`)}
                        >
                          {name}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            {slots.length}{" "}
                            {t("adminDashboard.schedule.totalSlots")}
                          </span>
                          {openCount > 0 && (
                            <Chip
                              size="sm"
                              className="h-4"
                              style={{
                                backgroundColor: `${colors.state.success}20`,
                                color: colors.state.success,
                                fontSize: "10px",
                              }}
                            >
                              {openCount}{" "}
                              {t(
                                "adminDashboard.schedule.scheduleStatuses.Open",
                              )}
                            </Chip>
                          )}
                          {bookedCount > 0 && (
                            <Chip
                              size="sm"
                              className="h-4"
                              style={{
                                backgroundColor: `${colors.primary.main}20`,
                                color: colors.primary.main,
                                fontSize: "10px",
                              }}
                            >
                              {bookedCount}{" "}
                              {t(
                                "adminDashboard.schedule.scheduleStatuses.Booked",
                              )}
                            </Chip>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAYS.map((day) => {
                        const daySlotsAll = byDay[day];
                        const daySlots = daySlotsAll.slice(0, 3);
                        const overflow = daySlotsAll.length - 3;
                        return (
                          <div key={day} className="flex flex-col gap-1">
                            <p
                              className="text-center text-xs font-semibold mb-1"
                              style={{ color: colors.text.tertiary }}
                            >
                              {WEEKDAY_SHORT[day]}
                            </p>
                            {daySlots.map((slot) => {
                              const sc = getSlotStatusColor(slot.status);
                              return (
                                <div
                                  key={slot.id}
                                  className="text-center px-1 py-1 rounded-md"
                                  style={{
                                    backgroundColor: `${sc}15`,
                                    border: `1px solid ${sc}30`,
                                  }}
                                >
                                  <p
                                    className="text-xs font-medium"
                                    style={{ color: sc }}
                                  >
                                    {formatTime(slot.startTime)}
                                  </p>
                                  <p style={{ color: sc, fontSize: "9px" }}>
                                    {t(
                                      `adminDashboard.schedule.scheduleStatuses.${slot.status}`,
                                    )}
                                  </p>
                                </div>
                              );
                            })}
                            {overflow > 0 && (
                              <p
                                className="text-center"
                                style={{
                                  color: colors.text.tertiary,
                                  fontSize: "10px",
                                }}
                              >
                                +{overflow}
                              </p>
                            )}
                            {daySlotsAll.length === 0 && (
                              <div
                                className="h-8 rounded-md"
                                style={{
                                  backgroundColor: colors.background.gray,
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TutorSlots;
