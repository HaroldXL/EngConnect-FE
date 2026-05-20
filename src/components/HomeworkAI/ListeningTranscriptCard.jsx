import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Spinner, addToast } from "@heroui/react";
import {
  AltArrowDown,
  AltArrowUp,
  Copy,
  MusicNotes,
  Notebook,
  RefreshCircle,
} from "@solar-icons/react";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "../../hooks/useThemeColors";
import clockAndCat from "../../assets/illustrations/clock-and-cat.avif";
import AIDisclaimer from "./AIDisclaimer";

const safeParse = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 24; // ~2 minutes

/**
 * ListeningTranscriptCard — Listening-only.
 *
 * Backend auto-transcribes the audio after the tutor grades the homework.
 * No manual "Run AI" trigger. This card auto-polls until the transcription
 * arrives (max ~2 min), then falls back to a manual Refresh button.
 *
 * Props:
 *  - mediaUrl     {string}   audio URL
 *  - analysisRaw  {string | object | null}
 *  - enabled      {boolean}  whether polling should be active
 *  - onUpdated    {() => Promise<void> | void}  parent refetch
 */
export default function ListeningTranscriptCard({
  mediaUrl,
  analysisRaw,
  enabled,
  onUpdated,
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const data = useMemo(() => safeParse(analysisRaw), [analysisRaw]);
  const transcription = data?.transcription || "";

  // Auto-poll until transcription arrives or MAX attempts reached
  useEffect(() => {
    if (!enabled) return;
    if (transcription) return;
    if (attempts >= MAX_POLL_ATTEMPTS) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        await onUpdated?.();
      } catch {
        // swallow — next iteration retries
      }
      if (cancelled) return;
      setAttempts((a) => a + 1);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, transcription, attempts, onUpdated]);

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      await onUpdated?.();
      setAttempts(0); // restart auto-poll if still no data
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      addToast({
        title: t("homeworkAI.listeningCopied"),
        color: "success",
        timeout: 2000,
      });
    } catch {
      // ignore
    }
  };

  // ── Waiting state (no transcription yet) ────────────────────────────────
  if (!transcription) {
    const stuck = attempts >= MAX_POLL_ATTEMPTS;
    return (
      <Card
        shadow="none"
        className="border-none"
        style={{ backgroundColor: colors.background.light }}
      >
        <CardBody className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${colors.primary.main}15` }}
            >
              <MusicNotes
                weight="BoldDuotone"
                className="w-5 h-5"
                style={{ color: colors.primary.main }}
              />
            </div>
            <div className="min-w-0">
              <h3
                className="text-base font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("homeworkAI.listeningTranscriptTitle")}
              </h3>
              <p
                className="text-xs"
                style={{ color: colors.text.tertiary }}
              >
                {t("homeworkAI.listeningTranscriptSubtitle")}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <AIDisclaimer />
          </div>

          <div
            className="rounded-xl flex flex-col items-center text-center py-6 px-4 gap-2"
            style={{ backgroundColor: colors.background.gray }}
          >
            <img
              src={clockAndCat}
              alt=""
              draggable={false}
              className="w-32 h-32 object-contain opacity-90"
            />
            <p
              className="text-sm font-semibold"
              style={{ color: colors.text.primary }}
            >
              {t("homeworkAI.listeningTranscribing")}
            </p>
            <p
              className="text-xs max-w-xs"
              style={{ color: colors.text.tertiary }}
            >
              {stuck
                ? t("homeworkAI.listeningTranscribeStuck")
                : t("homeworkAI.listeningTranscribingDesc")}
            </p>

            {stuck ? (
              <Button
                size="sm"
                className="mt-2"
                startContent={
                  !refreshing ? (
                    <RefreshCircle
                      weight="BoldDuotone"
                      className="w-4 h-4"
                    />
                  ) : null
                }
                isLoading={refreshing}
                onPress={handleManualRefresh}
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
              >
                {refreshing
                  ? t("homeworkAI.listeningChecking")
                  : t("homeworkAI.listeningRefresh")}
              </Button>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <Spinner size="sm" />
                <span
                  className="text-xs"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("homeworkAI.listeningChecking")}
                </span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  // ── Ready state ─────────────────────────────────────────────────────────
  return (
    <Card
      shadow="none"
      className="border-none"
      style={{ backgroundColor: colors.background.light }}
    >
      <CardBody className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${colors.primary.main}15` }}
            >
              <MusicNotes
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
                {t("homeworkAI.listeningTranscriptTitle")}
              </h3>
              <p
                className="text-xs truncate"
                style={{ color: colors.text.tertiary }}
              >
                {t("homeworkAI.listeningTranscriptSubtitle")}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="light"
            startContent={
              <Copy weight="BoldDuotone" className="w-4 h-4" />
            }
            onPress={handleCopy}
            style={{ color: colors.text.secondary }}
          >
            {t("homeworkAI.listeningCopy")}
          </Button>
        </div>

        <AIDisclaimer />

        {/* Audio player */}
        {mediaUrl && (
          <audio
            controls
            src={mediaUrl}
            className="w-full"
            style={{ borderRadius: 12 }}
          />
        )}

        {/* Transcript */}
        <div
          className="rounded-xl"
          style={{ backgroundColor: colors.background.gray }}
        >
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Notebook
                weight="BoldDuotone"
                className="w-4 h-4"
                style={{ color: colors.state.success }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("homeworkAI.listeningTranscript")}
              </span>
            </div>
            {expanded ? (
              <AltArrowUp
                weight="BoldDuotone"
                className="w-4 h-4"
                style={{ color: colors.text.tertiary }}
              />
            ) : (
              <AltArrowDown
                weight="BoldDuotone"
                className="w-4 h-4"
                style={{ color: colors.text.tertiary }}
              />
            )}
          </button>
          {expanded && (
            <div className="px-4 pb-4">
              <div
                className="max-h-96 overflow-y-auto pr-2"
                style={{ color: colors.text.primary }}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {transcription}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
