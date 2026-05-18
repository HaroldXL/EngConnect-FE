import { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Spinner,
  addToast,
} from "@heroui/react";
import {
  AltArrowDown,
  AltArrowUp,
  BookBookmark,
  Notebook,
  RefreshCircle,
  Stars,
  TextField,
} from "@solar-icons/react";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "../../hooks/useThemeColors";
import { lessonHomeworkApi } from "../../api";

const safeParse = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const LEVEL_COLORS = {
  A1: "#94A3B8",
  A2: "#6EA8FE",
  B1: "#22D3EE",
  B2: "#10B981",
  C1: "#F59E0B",
  C2: "#EF4444",
};

/**
 * ReadingAnalysisCard — Reading-only.
 *
 * Props:
 *  - homeworkId    {string}
 *  - analysisRaw   {string | object | null}
 *  - canRun        {boolean}
 *  - onUpdated     {() => void}
 */
export default function ReadingAnalysisCard({
  homeworkId,
  analysisRaw,
  canRun,
  onUpdated,
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState({
    keywords: true,
    vocab: true,
    summary: true,
  });

  const data = useMemo(() => safeParse(analysisRaw), [analysisRaw]);

  const handleRun = async () => {
    try {
      setRunning(true);
      await lessonHomeworkApi.analyzeReading(homeworkId);
      onUpdated?.();
    } catch (err) {
      console.error("Reading analyze failed:", err);
      addToast({
        title: t("homeworkAI.analyzeError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setRunning(false);
    }
  };

  const toggle = (k) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

  // Empty state
  if (!data) {
    return (
      <Card
        shadow="none"
        className="border-none"
        style={{ backgroundColor: colors.background.light }}
      >
        <CardBody className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary.main}15` }}
            >
              <BookBookmark
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
                {t("homeworkAI.readingAnalysisTitle")}
              </h3>
              <p
                className="text-xs"
                style={{ color: colors.text.tertiary }}
              >
                {t("homeworkAI.readingAnalysisSubtitle")}
              </p>
            </div>
          </div>
          {canRun ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <Button
                onPress={handleRun}
                isLoading={running}
                startContent={
                  !running ? (
                    <Stars weight="BoldDuotone" className="w-4 h-4" />
                  ) : null
                }
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
              >
                {running
                  ? t("homeworkAI.running")
                  : t("homeworkAI.readingAnalysisRun")}
              </Button>
            </div>
          ) : (
            <p
              className="text-sm italic text-center py-2"
              style={{ color: colors.text.tertiary }}
            >
              {t("homeworkAI.needSubmission")}
            </p>
          )}
        </CardBody>
      </Card>
    );
  }

  const keywords = Array.isArray(data.topic_keywords)
    ? data.topic_keywords
    : [];
  const vocabs = Array.isArray(data.vocabularies) ? data.vocabularies : [];
  const summary = data.summary_vn || "";

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
              <BookBookmark
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
                {t("homeworkAI.readingAnalysisTitle")}
              </h3>
              <p
                className="text-xs truncate"
                style={{ color: colors.text.tertiary }}
              >
                {t("homeworkAI.readingAnalysisSubtitle")}
              </p>
            </div>
          </div>
          {canRun && (
            <Button
              size="sm"
              variant="light"
              startContent={
                !running ? (
                  <RefreshCircle weight="BoldDuotone" className="w-4 h-4" />
                ) : null
              }
              isLoading={running}
              onPress={handleRun}
              style={{ color: colors.text.secondary }}
            >
              {running
                ? t("homeworkAI.running")
                : t("homeworkAI.readingAnalysisRerun")}
            </Button>
          )}
        </div>

        {/* Topic Keywords */}
        <Section
          title={t("homeworkAI.sections.keywords")}
          icon={
            <TextField
              weight="BoldDuotone"
              className="w-4 h-4"
              style={{ color: colors.primary.main }}
            />
          }
          count={keywords.length}
          expanded={expanded.keywords}
          onToggle={() => toggle("keywords")}
          colors={colors}
        >
          <div className="flex flex-wrap gap-2">
            {keywords.map((k, i) => (
              <Chip
                key={`${k}-${i}`}
                size="sm"
                style={{
                  backgroundColor: `${colors.primary.main}15`,
                  color: colors.primary.main,
                }}
              >
                {k}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Summary */}
        {summary && (
          <Section
            title={t("homeworkAI.sections.summary")}
            icon={
              <Notebook
                weight="BoldDuotone"
                className="w-4 h-4"
                style={{ color: colors.state.success }}
              />
            }
            expanded={expanded.summary}
            onToggle={() => toggle("summary")}
            colors={colors}
          >
            <p
              className="text-sm whitespace-pre-wrap leading-relaxed"
              style={{ color: colors.text.primary }}
            >
              {summary}
            </p>
          </Section>
        )}

        {/* Vocabulary */}
        <Section
          title={t("homeworkAI.sections.vocabulary")}
          icon={
            <BookBookmark
              weight="BoldDuotone"
              className="w-4 h-4"
              style={{ color: colors.state.warning }}
            />
          }
          count={vocabs.length}
          expanded={expanded.vocab}
          onToggle={() => toggle("vocab")}
          colors={colors}
        >
          {vocabs.length === 0 ? (
            <p
              className="text-sm italic text-center py-3"
              style={{ color: colors.text.tertiary }}
            >
              {t("homeworkAI.readingVocab.noVocab")}
            </p>
          ) : (
            <div className="space-y-2">
              {vocabs.map((v, i) => (
                <VocabRow key={`${v.word}-${i}`} v={v} colors={colors} t={t} />
              ))}
            </div>
          )}
        </Section>

        {running && (
          <div className="flex items-center gap-2">
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

function Section({
  title,
  icon,
  count,
  expanded,
  onToggle,
  colors,
  children,
}) {
  return (
    <div
      className="rounded-xl"
      style={{ backgroundColor: colors.background.gray }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span
            className="text-sm font-semibold"
            style={{ color: colors.text.primary }}
          >
            {title}
          </span>
          {typeof count === "number" && (
            <Chip
              size="sm"
              style={{
                backgroundColor: `${colors.text.tertiary}20`,
                color: colors.text.secondary,
              }}
            >
              {count}
            </Chip>
          )}
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
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function VocabRow({ v, colors, t }) {
  const levelColor = LEVEL_COLORS[v.level] || colors.text.tertiary;
  return (
    <div
      className="p-3 rounded-xl"
      style={{ backgroundColor: colors.background.light }}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <span
          className="text-sm font-semibold"
          style={{ color: colors.text.primary }}
        >
          {v.word}
        </span>
        {v.pos && (
          <span
            className="text-xs italic"
            style={{ color: colors.text.tertiary }}
          >
            ({v.pos})
          </span>
        )}
        {v.level && (
          <Chip
            size="sm"
            style={{
              backgroundColor: `${levelColor}20`,
              color: levelColor,
            }}
          >
            {v.level}
          </Chip>
        )}
      </div>
      {v.meaning_vn && (
        <p
          className="text-sm mb-1.5"
          style={{ color: colors.text.secondary }}
        >
          {v.meaning_vn}
        </p>
      )}
      {v.example_in_text && (
        <div
          className="pt-2 border-t mt-2"
          style={{ borderColor: colors.border.medium }}
        >
          <p
            className="text-[10px] uppercase tracking-wide font-semibold mb-0.5"
            style={{ color: colors.text.tertiary }}
          >
            {t("homeworkAI.readingVocab.exampleInText")}
          </p>
          <p
            className="text-xs italic"
            style={{ color: colors.text.tertiary }}
          >
            "{v.example_in_text}"
          </p>
        </div>
      )}
    </div>
  );
}
