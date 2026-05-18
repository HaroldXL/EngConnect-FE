import { useState } from "react";
import { Button, Card, CardBody, Progress, Spinner, addToast } from "@heroui/react";
import {
  DangerTriangle,
  CheckCircle,
  ShieldKeyhole,
  RefreshCircle,
} from "@solar-icons/react";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "../../hooks/useThemeColors";
import { lessonHomeworkApi } from "../../api";

/**
 * AIDetectionCard — Writing-only.
 *
 * Props:
 *  - homeworkId   {string}
 *  - score        {number | null}  cached aiDetectionScore (0-100)
 *  - canRun       {boolean}        false → show empty state with reason
 *  - onUpdated    {() => void}     called after a successful run
 */
export default function AIDetectionCard({
  homeworkId,
  score,
  canRun,
  onUpdated,
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    try {
      setRunning(true);
      await lessonHomeworkApi.detectAI(homeworkId);
      onUpdated?.();
    } catch (err) {
      console.error("AI detect failed:", err);
      addToast({
        title: t("homeworkAI.analyzeError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setRunning(false);
    }
  };

  const hasScore = typeof score === "number";
  const pct = hasScore ? Math.max(0, Math.min(100, score)) : 0;

  // Tone by AI probability
  let tone = "success";
  let toneColor = colors.state.success;
  let toneText = t("homeworkAI.detectionLow");
  let ToneIcon = CheckCircle;
  if (pct >= 70) {
    tone = "danger";
    toneColor = colors.state.error;
    toneText = t("homeworkAI.detectionHigh");
    ToneIcon = DangerTriangle;
  } else if (pct >= 30) {
    tone = "warning";
    toneColor = colors.state.warning;
    toneText = t("homeworkAI.detectionMedium");
    ToneIcon = DangerTriangle;
  }

  return (
    <Card
      shadow="none"
      className="border-none"
      style={{ backgroundColor: colors.background.light }}
    >
      <CardBody className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${colors.primary.main}15` }}
            >
              <ShieldKeyhole
                weight="BoldDuotone"
                className="w-5 h-5"
                style={{ color: colors.primary.main }}
              />
            </div>
            <div className="min-w-0">
              <h3
                className="text-base font-semibold truncate"
                style={{ color: colors.text.primary }}
              >
                {t("homeworkAI.detectionTitle")}
              </h3>
              <p
                className="text-xs truncate"
                style={{ color: colors.text.tertiary }}
              >
                {t("homeworkAI.detectionSubtitle")}
              </p>
            </div>
          </div>
          {hasScore && canRun && (
            <Button
              size="sm"
              variant="light"
              isIconOnly
              onPress={handleRun}
              isLoading={running}
              aria-label={t("homeworkAI.detectionRerun")}
            >
              <RefreshCircle
                weight="BoldDuotone"
                className="w-4 h-4"
                style={{ color: colors.text.secondary }}
              />
            </Button>
          )}
        </div>

        {/* Body */}
        {!hasScore ? (
          canRun ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <p
                className="text-sm text-center"
                style={{ color: colors.text.secondary }}
              >
                {t("homeworkAI.detectionSubtitle")}
              </p>
              <Button
                onPress={handleRun}
                isLoading={running}
                startContent={
                  !running ? (
                    <ShieldKeyhole
                      weight="BoldDuotone"
                      className="w-4 h-4"
                    />
                  ) : null
                }
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
              >
                {running
                  ? t("homeworkAI.running")
                  : t("homeworkAI.detectionRun")}
              </Button>
            </div>
          ) : (
            <p
              className="text-sm italic text-center py-2"
              style={{ color: colors.text.tertiary }}
            >
              {t("homeworkAI.needSubmission")}
            </p>
          )
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="text-xs uppercase tracking-wide font-semibold"
                style={{ color: colors.text.tertiary }}
              >
                {t("homeworkAI.detectionScoreLabel")}
              </span>
              <span
                className="text-3xl font-bold"
                style={{ color: toneColor }}
              >
                {pct.toFixed(2)}
                <span
                  className="text-sm font-normal ml-0.5"
                  style={{ color: colors.text.tertiary }}
                >
                  %
                </span>
              </span>
            </div>
            <Progress
              aria-label="AI detection score"
              value={pct}
              size="md"
              color={tone}
            />
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: `${toneColor}12` }}
            >
              <ToneIcon
                weight="BoldDuotone"
                className="w-4 h-4 shrink-0"
                style={{ color: toneColor }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: toneColor }}
              >
                {toneText}
              </span>
            </div>
          </div>
        )}

        {running && hasScore && (
          <div className="flex items-center gap-2 mt-3">
            <Spinner size="sm" />
            <span
              className="text-xs"
              style={{ color: colors.text.tertiary }}
            >
              {t("homeworkAI.running")}
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
