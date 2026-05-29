import { useState, useEffect, useCallback } from "react";
import {
  AltArrowLeft,
  CalendarMark,
  CheckCircle,
  ClockCircle,
  CloseCircle,
  DangerTriangle,
} from "@solar-icons/react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Button, Chip, Divider, Spinner } from "@heroui/react";
import * as MotionLib from "framer-motion";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useThemeColors } from "../../hooks/useThemeColors";

import { coursesApi, tutorApi, studentApi } from "../../api";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const formatPrice = (price, currency) => {
  if (currency === "VND" || !currency) {
    return price?.toLocaleString("vi-VN") + "₫";
  }
  return "$" + price;
};

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [course, setCourse] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [paymentMethod] = useState("Payos");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [conflictSlotIds, setConflictSlotIds] = useState(new Set());

  const requiredSlots = course?.numsSessionInWeek || 0;

  const getSlotDurationMinutes = (slot) => {
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  };

  const lessonMinutes = (() => {
    if (!course?.estimatedTimeLesson) return null;
    const [lh, lm] = course.estimatedTimeLesson.split(":").map(Number);
    return lh * 60 + lm;
  })();

  const matchingSlots = lessonMinutes
    ? schedules.filter((s) => getSlotDurationMinutes(s) === lessonMinutes)
    : schedules;

  const notEnoughSlots = !loading && matchingSlots.length < requiredSlots;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const courseRes = await coursesApi.getCourseById(id);
      setCourse(courseRes.data);

      if (courseRes.data?.tutorId) {
        const scheduleRes = await tutorApi.getTutorSchedules({
          TutorId: courseRes.data.tutorId,
          Status: "Open",
          "page-size": 200,
        });
        if (scheduleRes.isSuccess) {
          setSchedules(scheduleRes.data.items || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch checkout data:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const parseConflictSlots = (message, slotList) => {
    // message: "...: Thursday 15:30 - 17:00; Tuesday 14:30 - 16:00."
    const afterColon = message
      .split(": ")
      .slice(1)
      .join(": ")
      .replace(/\.$/, "");
    const parts = afterColon
      .split("; ")
      .map((s) => s.trim())
      .filter(Boolean);
    const ids = new Set();
    parts.forEach((part) => {
      // part: "Thursday 15:30 - 17:00"
      const match = part.match(/^(\w+)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
      if (!match) return;
      const [, weekday, start, end] = match;
      const found = slotList.find(
        (s) =>
          s.weekday === weekday &&
          s.startTime.slice(0, 5) === start &&
          s.endTime.slice(0, 5) === end,
      );
      if (found) ids.add(found.id);
    });
    return ids;
  };

  const toggleSlot = (slotId) => {
    setCheckoutError("");
    setConflictSlotIds(new Set());
    setSelectedSlots((prev) => {
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      }
      if (prev.length >= requiredSlots) {
        return prev;
      }
      return [...prev, slotId];
    });
  };

  const canCheckout = selectedSlots.length === requiredSlots;

  const handleCheckout = async () => {
    if (!canCheckout) return;
    setCheckoutError("");
    setSubmitting(true);
    try {
      const res = await studentApi.checkout({
        courseId: id,
        scheduleSlots: selectedSlots,
        paymentMethod,
      });
      if (res.isSuccess && res.data?.paymentLink) {
        window.location.href = res.data.paymentLink;
      } else if (!res.isSuccess) {
        setCheckoutError(res.error?.message || "Checkout failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setCheckoutError(msg || "Checkout failed. Please try again.");
      if (msg) {
        setConflictSlotIds(parseConflictSlots(msg, schedules));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (timeStr) => timeStr?.slice(0, 5) || "";

  const WEEKDAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const groupedSchedules = WEEKDAY_ORDER.map((day) => ({
    day,
    slots: matchingSlots
      .filter((s) => s.weekday === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter((g) => g.slots.length > 0);

  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.background.light }}
      >
        <Header />
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.background.light }}
      >
        <Header />
        <div className="flex flex-col items-center justify-center py-32 px-6">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: colors.text.primary }}
          >
            {t("courses.detail.notFound")}
          </h2>
          <Button
            color="primary"
            variant="flat"
            startContent={<AltArrowLeft weight="BoldDuotone" size={18} />}
            onPress={() => navigate("/courses")}
          >
            {t("courses.detail.backToCourses")}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background.gray }}
    >
      <Header />

      <section className="px-6 md:px-12 py-10">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <Button
            variant="light"
            startContent={<AltArrowLeft weight="BoldDuotone" size={18} />}
            className="mb-6"
            onPress={() => navigate(-1)}
            style={{ color: colors.text.secondary }}
          >
            {t("checkout.backToCourse")}
          </Button>

          <h1
            className="text-2xl font-bold mb-6"
            style={{ color: colors.text.primary }}
          >
            {t("checkout.title")}
          </h1>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Slot Selection + Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Slot Selection */}
              <Card
                shadow="none"
                className="border-none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2
                      className="font-semibold text-lg"
                      style={{ color: colors.text.primary }}
                    >
                      <CalendarMark
                        weight="BoldDuotone"
                        className="w-5 h-5 inline-block mr-2"
                        style={{ color: colors.primary.main }}
                      />
                      {t("checkout.selectSlots")}
                    </h2>
                    <Chip size="sm" variant="flat" color="primary">
                      {selectedSlots.length} / {requiredSlots}
                    </Chip>
                  </div>

                  <p
                    className="text-sm mb-4"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("checkout.selectSlotsDesc", {
                      count: requiredSlots,
                    })}
                  </p>

                  {/* Not enough slots alert */}
                  {notEnoughSlots && (
                    <div
                      className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
                      style={{
                        backgroundColor: `${colors.state.error}15`,
                        color: colors.state.error,
                        border: `1px solid ${colors.state.error}30`,
                      }}
                    >
                      <DangerTriangle
                        weight="BoldDuotone"
                        className="w-4 h-4 flex-shrink-0"
                      />
                      {t("checkout.notEnoughSlots", {
                        required: requiredSlots,
                        available: matchingSlots.length,
                      })}
                    </div>
                  )}

                  {/* Conflict error banner */}
                  {checkoutError && conflictSlotIds.size > 0 && (
                    <div
                      className="flex items-start gap-2 p-3 rounded-lg mb-4 text-sm"
                      style={{
                        backgroundColor: `${colors.state.error}15`,
                        color: colors.state.error,
                        border: `1px solid ${colors.state.error}30`,
                      }}
                    >
                      <CloseCircle
                        weight="BoldDuotone"
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                      />
                      <span>{t("checkout.slotConflict")}</span>
                    </div>
                  )}
                  {checkoutError && conflictSlotIds.size === 0 && (
                    <div
                      className="flex items-start gap-2 p-3 rounded-lg mb-4 text-sm"
                      style={{
                        backgroundColor: `${colors.state.error}15`,
                        color: colors.state.error,
                        border: `1px solid ${colors.state.error}30`,
                      }}
                    >
                      <DangerTriangle
                        weight="BoldDuotone"
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                      />
                      <span>{checkoutError}</span>
                    </div>
                  )}

                  {/* Schedule slots grouped by day */}
                  {groupedSchedules.length === 0 ? (
                    <div
                      className="text-center py-8"
                      style={{ color: colors.text.tertiary }}
                    >
                      <CalendarMark
                        weight="BoldDuotone"
                        className="w-12 h-12 mx-auto mb-2 opacity-50"
                      />
                      <p>{t("checkout.noSlots")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupedSchedules.map(({ day, slots }) => (
                        <div key={day}>
                          <h3
                            className="font-medium text-sm mb-2"
                            style={{ color: colors.text.primary }}
                          >
                            {t(
                              `tutorDashboard.schedule.days.${day.toLowerCase()}`,
                            )}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {slots.map((slot) => {
                              const isSelected = selectedSlots.includes(
                                slot.id,
                              );
                              const isConflict = conflictSlotIds.has(slot.id);
                              const isDisabled =
                                !isSelected &&
                                selectedSlots.length >= requiredSlots;
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => toggleSlot(slot.id)}
                                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                                  style={{
                                    backgroundColor: isConflict
                                      ? `${colors.state.error}18`
                                      : isSelected
                                        ? colors.primary.main
                                        : colors.background.gray,
                                    color: isConflict
                                      ? colors.state.error
                                      : isSelected
                                        ? "#fff"
                                        : colors.text.primary,
                                    // border: isConflict
                                    //   ? `2px solid ${colors.state.error}`
                                    //   : isSelected
                                    //     ? `2px solid ${colors.primary.main}`
                                    //     : `1px solid ${colors.border.light}`,
                                    opacity: isDisabled ? 0.5 : 1,
                                    cursor: isDisabled
                                      ? "not-allowed"
                                      : "pointer",
                                  }}
                                >
                                  {isConflict ? (
                                    <CloseCircle
                                      weight="BoldDuotone"
                                      className="w-4 h-4"
                                    />
                                  ) : isSelected ? (
                                    <CheckCircle
                                      weight="BoldDuotone"
                                      className="w-4 h-4"
                                    />
                                  ) : (
                                    <ClockCircle
                                      weight="BoldDuotone"
                                      className="w-4 h-4"
                                      style={{ color: colors.text.secondary }}
                                    />
                                  )}
                                  {formatTime(slot.startTime)} —{" "}
                                  {formatTime(slot.endTime)}
                                  {isConflict && (
                                    <span className="text-xs font-semibold ml-1">
                                      {t("checkout.conflict")}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Payment Method */}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <Card
                  shadow="none"
                  className="border-none"
                  style={{ backgroundColor: colors.background.light }}
                >
                  <CardBody className="p-6 space-y-4">
                    <h2
                      className="font-semibold text-lg"
                      style={{ color: colors.text.primary }}
                    >
                      {t("checkout.orderSummary")}
                    </h2>

                    {/* Course thumbnail */}
                    <div className="rounded-xl overflow-hidden">
                      <img
                        src={
                          course.thumbnailUrl ||
                          "https://placehold.co/400x200?text=No+Image"
                        }
                        alt={course.title}
                        className="w-full h-36 object-cover"
                      />
                    </div>

                    <div>
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: colors.text.primary }}
                      >
                        {course.title}
                      </h3>
                      {course.courseCategories?.[0]?.categoryName && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: colors.text.tertiary }}
                        >
                          {course.courseCategories[0].categoryName} ·{" "}
                          {course.level}
                        </p>
                      )}
                    </div>

                    <Divider />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: colors.text.secondary }}>
                          {t("checkout.slotsSelected")}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {selectedSlots.length} / {requiredSlots}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: colors.text.secondary }}>
                          {t("checkout.payment")}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          PayOS
                        </span>
                      </div>
                    </div>

                    <Divider />

                    <div className="flex justify-between items-center">
                      <span
                        className="font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("checkout.total")}
                      </span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: colors.primary.main }}
                      >
                        {formatPrice(course.price, course.currency)}
                      </span>
                    </div>

                    <Button
                      color="primary"
                      size="lg"
                      className="w-full font-semibold"
                      isDisabled={!canCheckout}
                      isLoading={submitting}
                      onPress={handleCheckout}
                    >
                      {t("checkout.pay")}
                    </Button>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Checkout;
