import { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  Progress,
  Spinner,
  Chip,
  addToast,
} from "@heroui/react";
import {
  AltArrowDown,
  AltArrowUp,
  CheckCircle,
  ClipboardText,
  DangerTriangle,
  GraphUp,
  LightbulbBolt,
  MagicStick,
  Pen,
  RefreshCircle,
  Stars,
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

/**
 * WritingAnalysisCard — Writing-only.
 *
 * Props:
 *  - homeworkId    {string}
 *  - analysisRaw   {string | object | null}  cached aiAnalysisData
 *  - canRun        {boolean}                 false → show empty state with reason
 *  - hideTutorAdvice {boolean}               true for student view
 *  - onUpdated     {() => void}
 */
export default function WritingAnalysisCard({
  homeworkId,
  analysisRaw,
  canRun,
  hideTutorAdvice = false,
  onUpdated,
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState({
    errors: true,
    vocab: true,
    feedback: true,
  });

  const data = useMemo(() => safeParse(analysisRaw), [analysisRaw]);

  const handleRun = async () => {
    try {
      setRunning(true);
      await lessonHomeworkApi.analyzeWriting(homeworkId);
      onUpdated?.();
    } catch (err) {
      console.error("Writing analyze failed:", err);
      addToast({
        title: t("homeworkAI.analyzeError"),
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setRunning(false);
    }
  };

  const toggle = (key) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  // ── Empty / loading state ─────────────────────────────────────────────
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
              <MagicStick
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
                {t("homeworkAI.writingAnalysisTitle")}
              </h3>
              <p
                className="text-xs"
                style={{ color: colors.text.tertiary }}
              >
                {t("homeworkAI.writingAnalysisSubtitle")}
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
                  : t("homeworkAI.writingAnalysisRun")}
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

  // ── With data ─────────────────────────────────────────────────────────
  const assessment = data.assessment || {};
  const criteria = assessment.detailed_criteria || {};
  const overallBand = Number(assessment.overall_band || 0);
  const errors = Array.isArray(data.grammar_and_context_errors)
    ? data.grammar_and_context_errors
    : [];
  const upgrades = Array.isArray(data.vocabulary_upgrades)
    ? data.vocabulary_upgrades
    : [];
  const feedback = data.overall_feedback || {};

  const bandColor =
    overallBand >= 7
      ? colors.state.success
      : overallBand >= 5
        ? colors.state.warning
        : colors.state.error;

  const criteriaList = [
    {
      key: "task_response",
      label: t("homeworkAI.criteria.taskResponse"),
      value: criteria.task_response,
    },
    {
      key: "grammar_accuracy",
      label: t("homeworkAI.criteria.grammarAccuracy"),
      value: criteria.grammar_accuracy,
    },
    {
      key: "lexical_resource",
      label: t("homeworkAI.criteria.lexicalResource"),
      value: criteria.lexical_resource,
    },
    {
      key: "coherence_cohesion",
      label: t("homeworkAI.criteria.coherenceCohesion"),
      value: criteria.coherence_cohesion,
    },
  ];

  return (
    <Card
      shadow="none"
      className="border-none"
      style={{ backgroundColor: colors.background.light }}
    >
      <CardBody className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${colors.primary.main}15` }}
            >
              <MagicStick
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
                {t("homeworkAI.writingAnalysisTitle")}
              </h3>
              <p
                className="text-xs truncate"
                style={{ color: colors.text.tertiary }}
              >
                {t("homeworkAI.writingAnalysisSubtitle")}
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
                : t("homeworkAI.writingAnalysisRerun")}
            </Button>
          )}
        </div>

        {/* Score Section */}
        <div
          className="p-4 rounded-2xl"
          style={{ backgroundColor: `${bandColor}10`, border: `1px solid ${bandColor}30` }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${bandColor}20` }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: bandColor }}
                >
                  {overallBand}
                </span>
              </div>
              <div>
                <p
                  className="text-xs uppercase tracking-wide font-semibold"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("homeworkAI.overallBand")}
                </p>
                <p
                  className="text-base font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  {t("homeworkAI.sections.score")}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {criteriaList.map((c) => {
              const v = Number(c.value || 0);
              const cColor =
                v >= 7
                  ? colors.state.success
                  : v >= 5
                    ? colors.state.warning
                    : colors.state.error;
              return (
                <div
                  key={c.key}
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: colors.background.light }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: colors.text.tertiary }}
                    >
                      {c.label}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: cColor }}
                    >
                      {v}
                    </span>
                  </div>
                  <Progress
                    aria-label={c.label}
                    value={(v / 9) * 100}
                    size="sm"
                    color={
                      v >= 7 ? "success" : v >= 5 ? "warning" : "danger"
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Grammar Errors */}
        <CollapsibleSection
          title={t("homeworkAI.sections.errors")}
          icon={
            <Pen
              weight="BoldDuotone"
              className="w-4 h-4"
              style={{ color: colors.state.error }}
            />
          }
          count={errors.length}
          expanded={expanded.errors}
          onToggle={() => toggle("errors")}
          colors={colors}
        >
          {errors.length === 0 ? (
            <EmptyMsg
              text={t("homeworkAI.errorsEmpty")}
              colors={colors}
            />
          ) : (
            <div className="space-y-3">
              {errors.map((err, i) => (
                <ErrorItem key={i} err={err} colors={colors} t={t} />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Vocabulary Upgrades */}
        <CollapsibleSection
          title={t("homeworkAI.sections.vocabUpgrades")}
          icon={
            <GraphUp
              weight="BoldDuotone"
              className="w-4 h-4"
              style={{ color: colors.primary.main }}
            />
          }
          count={upgrades.length}
          expanded={expanded.vocab}
          onToggle={() => toggle("vocab")}
          colors={colors}
        >
          {upgrades.length === 0 ? (
            <EmptyMsg
              text={t("homeworkAI.vocabUpgradesEmpty")}
              colors={colors}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upgrades.map((u, i) => (
                <VocabItem key={i} item={u} colors={colors} t={t} />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Overall Feedback */}
        <CollapsibleSection
          title={t("homeworkAI.sections.feedback")}
          icon={
            <ClipboardText
              weight="BoldDuotone"
              className="w-4 h-4"
              style={{ color: colors.state.success }}
            />
          }
          expanded={expanded.feedback}
          onToggle={() => toggle("feedback")}
          colors={colors}
        >
          <div className="grid grid-cols-1 gap-3">
            {feedback.strengths && (
              <FeedbackBlock
                icon={
                  <CheckCircle
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.state.success }}
                  />
                }
                title={t("homeworkAI.feedback.strengths")}
                accent={colors.state.success}
                body={feedback.strengths}
                colors={colors}
              />
            )}
            {feedback.weaknesses && (
              <FeedbackBlock
                icon={
                  <DangerTriangle
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.state.warning }}
                  />
                }
                title={t("homeworkAI.feedback.weaknesses")}
                accent={colors.state.warning}
                body={feedback.weaknesses}
                colors={colors}
              />
            )}
            {!hideTutorAdvice && feedback.tutor_advice && (
              <FeedbackBlock
                icon={
                  <LightbulbBolt
                    weight="BoldDuotone"
                    className="w-5 h-5"
                    style={{ color: colors.primary.main }}
                  />
                }
                title={t("homeworkAI.feedback.tutorAdvice")}
                accent={colors.primary.main}
                body={feedback.tutor_advice}
                colors={colors}
              />
            )}
          </div>
        </CollapsibleSection>

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

// ── Sub-components ────────────────────────────────────────────────────────

function CollapsibleSection({
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

function EmptyMsg({ text, colors }) {
  return (
    <p
      className="text-sm italic text-center py-3"
      style={{ color: colors.text.tertiary }}
    >
      {text}
    </p>
  );
}

function ErrorItem({ err, colors, t }) {
  return (
    <div
      className="p-3 rounded-xl space-y-2"
      style={{ backgroundColor: colors.background.light }}
    >
      <div className="flex items-center gap-2">
        {err.type && (
          <Chip
            size="sm"
            style={{
              backgroundColor: `${colors.state.error}20`,
              color: colors.state.error,
            }}
          >
            {err.type}
          </Chip>
        )}
      </div>
      <div>
        <p
          className="text-[11px] uppercase tracking-wide font-semibold mb-0.5"
          style={{ color: colors.text.tertiary }}
        >
          {t("homeworkAI.errorsItem.original")}
        </p>
        <p
          className="text-sm line-through decoration-2"
          style={{
            color: colors.state.error,
            textDecorationColor: `${colors.state.error}80`,
          }}
        >
          {err.original}
        </p>
      </div>
      <div>
        <p
          className="text-[11px] uppercase tracking-wide font-semibold mb-0.5"
          style={{ color: colors.text.tertiary }}
        >
          {t("homeworkAI.errorsItem.fixed")}
        </p>
        <p
          className="text-sm font-medium"
          style={{ color: colors.state.success }}
        >
          {err.fixed}
        </p>
      </div>
      {err.explanation_vn && (
        <div
          className="pt-2 border-t"
          style={{ borderColor: colors.border.medium }}
        >
          <p
            className="text-[11px] uppercase tracking-wide font-semibold mb-0.5"
            style={{ color: colors.text.tertiary }}
          >
            {t("homeworkAI.errorsItem.explanation")}
          </p>
          <p
            className="text-sm"
            style={{ color: colors.text.secondary }}
          >
            {err.explanation_vn}
          </p>
        </div>
      )}
    </div>
  );
}

function VocabItem({ item, colors, t }) {
  return (
    <div
      className="p-3 rounded-xl space-y-2"
      style={{ backgroundColor: colors.background.light }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-sm font-medium line-through"
          style={{
            color: colors.text.tertiary,
            textDecorationColor: `${colors.text.tertiary}80`,
          }}
        >
          {item.low_level_word}
        </span>
        <span style={{ color: colors.text.tertiary }}>→</span>
        <span
          className="text-sm font-semibold"
          style={{ color: colors.primary.main }}
        >
          {item.advanced_alternative}
        </span>
      </div>
      {item.reason_vn && (
        <p className="text-xs" style={{ color: colors.text.secondary }}>
          {item.reason_vn}
        </p>
      )}
    </div>
  );
}

function FeedbackBlock({ icon, title, accent, body, colors }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: `${accent}10`, border: `1px solid ${accent}25` }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span
          className="text-sm font-semibold"
          style={{ color: accent }}
        >
          {title}
        </span>
      </div>
      <p
        className="text-sm whitespace-pre-wrap"
        style={{ color: colors.text.primary }}
      >
        {body}
      </p>
    </div>
  );
}
