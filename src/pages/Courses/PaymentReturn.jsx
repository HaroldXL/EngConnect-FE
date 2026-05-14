import { useState, useEffect } from "react";
import { AltArrowRight, CheckCircle, CloseCircle, HomeSmile } from "@solar-icons/react"
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Button, Spinner, Divider } from "@heroui/react";
import * as MotionLib from "framer-motion";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useThemeColors } from "../../hooks/useThemeColors";

import { studentApi } from "../../api";

import successIllustration from "../../assets/illustrations/good-news.avif";
import failedIllustration from "../../assets/illustrations/bad-news.avif";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const params = {
          code: searchParams.get("code"),
          id: searchParams.get("id"),
          cancel: searchParams.get("cancel"),
          status: searchParams.get("status"),
          orderCode: searchParams.get("orderCode"),
        };
        const res = await studentApi.verifyPayosReturn(params);
        if (res.isSuccess) {
          setResult(res.data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [searchParams]);

  const isSuccess = result?.isPaymentSuccessful === true;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.background.gray }}
    >
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card
            shadow="none"
            className="overflow-hidden"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-8 text-center space-y-5">
              {loading ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Spinner size="lg" />
                  <p
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("paymentReturn.verifying")}
                  </p>
                </div>
              ) : error ? (
                <>
                  <div className="flex justify-center">
                    <img
                      src={failedIllustration}
                      alt=""
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-50 h-50 object-contain"
                    />
                  </div>
                  <h2
                    className="text-xl font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {t("paymentReturn.errorTitle")}
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("paymentReturn.errorMessage")}
                  </p>
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<HomeSmile weight="BoldDuotone" size={18} />}
                    onPress={() => navigate("/")}
                  >
                    {t("paymentReturn.goHome")}
                  </Button>
                </>
              ) : isSuccess ? (
                <>
                  <div className="flex justify-center">
                    <img
                      src={successIllustration}
                      alt=""
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                  <h2
                    className="text-xl font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {t("paymentReturn.successTitle")}
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("paymentReturn.successMessage")}
                  </p>

                  <Divider />

                  {/* Payment details */}
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.secondary }}>
                        {t("paymentReturn.orderCode")}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        #{result.orderCode}
                      </span>
                    </div>
                    {result.amount != null && (
                      <div className="flex justify-between">
                        <span style={{ color: colors.text.secondary }}>
                          {t("paymentReturn.amount")}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {result.amount.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.secondary }}>
                        {t("paymentReturn.status")}
                      </span>
                      <span className="font-medium text-green-500">
                        {result.currentPaymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      color="primary"
                      startContent={<AltArrowRight weight="BoldDuotone" size={18} />}
                      onPress={() => navigate("/student/my-courses")}
                      style={{
                        backgroundColor: colors.primary.main,
                        color: colors.text.white,
                      }}
                    >
                      {t("paymentReturn.goToMyCourses")}
                    </Button>
                    <Button
                      variant="flat"
                      startContent={<HomeSmile weight="BoldDuotone" size={18} />}
                      onPress={() => navigate("/")}
                    >
                      {t("paymentReturn.goHome")}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <img
                      src={failedIllustration}
                      alt=""
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-50 h-50 object-contain"
                    />
                  </div>
                  <h2
                    className="text-xl font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {result?.isCancelled
                      ? t("paymentReturn.cancelledTitle")
                      : t("paymentReturn.failedTitle")}
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {result?.message || t("paymentReturn.failedMessage")}
                  </p>

                  <Divider />

                  <div className="space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.secondary }}>
                        {t("paymentReturn.orderCode")}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        #{result?.orderCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.secondary }}>
                        {t("paymentReturn.status")}
                      </span>
                      <span className="font-medium text-red-500">
                        {result?.currentPaymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      color="primary"
                      onPress={() => navigate("/courses")}
                      style={{
                        backgroundColor: colors.primary.main,
                        color: colors.text.white,
                      }}
                    >
                      {t("paymentReturn.browseCourses")}
                    </Button>
                    <Button
                      variant="flat"
                      startContent={<HomeSmile weight="BoldDuotone" size={18} />}
                      onPress={() => navigate("/")}
                    >
                      {t("paymentReturn.goHome")}
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentReturn;
