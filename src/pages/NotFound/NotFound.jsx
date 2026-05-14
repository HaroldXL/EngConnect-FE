import { Button, Image } from "@heroui/react";
import { HomeSmile, AltArrowLeft } from "@solar-icons/react"
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useThemeColors } from "../../hooks/useThemeColors";

import NotFoundImage from "../../assets/illustrations/not-found.avif";

const NotFound = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.background.gray }}
    >
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <Image
            src={NotFoundImage}
            alt="Page not found"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full max-w-md"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1
            className="text-6xl md:text-8xl font-bold mb-4"
            style={{ color: colors.primary.main }}
          >
            404
          </h1>
          <h2
            className="text-2xl md:text-3xl font-semibold mb-4"
            style={{ color: colors.text.primary }}
          >
            {t("notFound.title")}
          </h2>
          <p
            className="text-lg mb-8 max-w-md mx-auto"
            style={{ color: colors.text.secondary }}
          >
            {t("notFound.description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              startContent={<AltArrowLeft weight="BoldDuotone" className="w-5 h-5" />}
              variant="flat"
              onPress={() => navigate(-1)}
              style={{ color: colors.text.primary }}
            >
              {t("notFound.goBack")}
            </Button>
            <Button
              size="lg"
              startContent={<HomeSmile className="w-5 h-5" weight="BoldDuotone" />}
              onPress={() => navigate("/")}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
            >
              {t("notFound.goHome")}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
