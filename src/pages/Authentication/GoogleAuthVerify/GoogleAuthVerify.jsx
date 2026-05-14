import React, { useState, useEffect } from "react";
import { CheckCircle, CloseCircle } from "@solar-icons/react"
import { Button, Spinner } from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as MotionLib from "framer-motion";
import { useTranslation } from "react-i18next";

import BrandLogo from "../../../components/Authentication/BrandLogo";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { googleLoginVerify, selectUser } from "../../../store";
import "./GoogleAuthVerify.css";

// eslint-disable-next-line no-unused-vars
const { motion } = MotionLib;

const GoogleAuthVerify = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const user = useSelector(selectUser);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg(t("auth.googleVerify.noToken"));
      return;
    }

    const verify = async () => {
      try {
        const result = await dispatch(googleLoginVerify(token)).unwrap();
        setStatus("success");
        const isAdmin = result.user?.roles?.includes("Admin");
        setTimeout(
          () => navigate(isAdmin ? "/admin/dashboard" : "/courses"),
          1500,
        );
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          typeof err === "string"
            ? err
            : err?.message || t("auth.googleVerify.failed"),
        );
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="google-verify-container"
      style={{ backgroundColor: colors.background.light }}
    >
      <motion.div
        className="google-verify-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ backgroundColor: colors.background.light }}
      >
        <BrandLogo />

        {status === "loading" && (
          <div className="google-verify-status">
            <Spinner size="lg" color="primary" />
            <h2
              className="text-xl font-semibold mt-4"
              style={{ color: colors.text.primary }}
            >
              {t("auth.googleVerify.verifying")}
            </h2>
            <p
              className="text-sm mt-2"
              style={{ color: colors.text.secondary }}
            >
              {t("auth.googleVerify.pleaseWait")}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="google-verify-status">
            <CheckCircle weight="BoldDuotone" className="w-16 h-16" style={{ color: "#22c55e" }} />
            <h2
              className="text-xl font-semibold mt-4"
              style={{ color: colors.text.primary }}
            >
              {t("auth.googleVerify.success")}
            </h2>
            <p
              className="text-sm mt-2"
              style={{ color: colors.text.secondary }}
            >
              {t("auth.googleVerify.redirecting")}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="google-verify-status">
            <CloseCircle weight="BoldDuotone" className="w-16 h-16" style={{ color: "#ef4444" }} />
            <h2
              className="text-xl font-semibold mt-4"
              style={{ color: colors.text.primary }}
            >
              {t("auth.googleVerify.errorTitle")}
            </h2>
            <p
              className="text-sm mt-2 text-center"
              style={{ color: colors.text.secondary }}
            >
              {errorMsg}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
              <Button
                variant="flat"
                size="lg"
                className="flex-1 font-medium"
                style={{
                  backgroundColor: colors.button.primaryLight.background,
                  color: colors.button.primaryLight.text,
                }}
                onPress={() => navigate("/login")}
              >
                {t("auth.googleVerify.backToLogin")}
              </Button>
              <Button
                size="lg"
                className="flex-1 font-medium"
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
                onPress={() => navigate("/")}
              >
                {t("auth.googleVerify.goHome")}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GoogleAuthVerify;
