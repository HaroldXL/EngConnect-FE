import { useState, Fragment } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import {
  AltArrowLeft,
  AltArrowRight,
  Book2,
  BookBookmark,
  BookMinimalistic,
  Case,
  CaseRound,
  CheckCircle,
  CloseCircle,
  ClipboardList,
  ChatRoundDots,
  Diploma,
  Global,
  Letter,
  MagicStick,
  Microphone,
  Notebook,
  Passport,
  Pen,
  PenNewSquare,
  Podcast,
  SoundwaveCircle,
  SquareAcademicCap,
  TextField,
} from "@solar-icons/react";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTranslation } from "react-i18next";

// ── Data ────────────────────────────────────────────────

const LEVELS = [
  { value: "Beginner", key: "beginner", badge: "A1" },
  { value: "Elementary", key: "elementary", badge: "A2" },
  { value: "Intermediate", key: "intermediate", badge: "B1" },
  { value: "Upper-Intermediate", key: "upperIntermediate", badge: "B2" },
  { value: "Advanced", key: "advanced", badge: "C1+" },
  { value: null, key: "unsure", badge: "?" },
];

const PURPOSES = [
  { id: "IELTS", key: "ielts", Icon: Diploma },
  { id: "TOEIC", key: "toeic", Icon: ClipboardList },
  { id: "TOEFL", key: "toefl", Icon: SquareAcademicCap },
  { id: "business English", key: "businessEnglish", Icon: Case },
  { id: "job interview", key: "jobInterview", Icon: CaseRound },
  { id: "study abroad", key: "studyAbroad", Icon: Passport },
  { id: "travel English", key: "travel", Icon: Global },
  { id: "daily conversation", key: "dailyConversation", Icon: ChatRoundDots },
  { id: "children English", key: "children", Icon: BookMinimalistic },
  { id: "academic writing", key: "academicWriting", Icon: Notebook },
  { id: "presentation", key: "presentation", Icon: PenNewSquare },
  { id: "email writing", key: "emailWriting", Icon: Letter },
];

const SKILLS = [
  { id: "speaking", key: "speaking", Icon: Microphone },
  { id: "listening", key: "listening", Icon: Podcast },
  { id: "reading", key: "reading", Icon: Book2 },
  { id: "writing", key: "writing", Icon: Pen },
  { id: "grammar", key: "grammar", Icon: TextField },
  { id: "vocabulary", key: "vocabulary", Icon: BookBookmark },
  { id: "pronunciation", key: "pronunciation", Icon: SoundwaveCircle },
];

const MAX_PURPOSES = 3;

// ── Build query string ───────────────────────────────────

function buildQuery(level, purposes, skills) {
  const parts = [];
  if (level) parts.push(`${level} level`);
  if (purposes.length) parts.push(`for ${purposes.join(" and ")}`);
  if (skills.length) parts.push(`focusing on ${skills.join(" and ")}`);
  return `English course ${parts.join(", ")}`;
}

// ── Sub-components ───────────────────────────────────────

// Step progress circles
const StepCircles = ({ step, colors }) => (
  <div className="flex items-center mt-4">
    {[0, 1, 2].map((i) => (
      <Fragment key={i}>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300"
          style={{
            backgroundColor:
              i < step
                ? colors.primary.main
                : i === step
                  ? colors.primary.main
                  : colors.background.gray,
            color: i <= step ? colors.text.white : colors.text.tertiary,
          }}
        >
          {i < step ? <CheckCircle weight="BoldDuotone" size={14} /> : i + 1}
        </div>
        {i < 2 && (
          <div
            className="flex-1 h-0.5 transition-all duration-500"
            style={{
              backgroundColor:
                i < step ? colors.primary.main : colors.background.gray,
            }}
          />
        )}
      </Fragment>
    ))}
  </div>
);

// Level card with CEFR badge
const LevelCard = ({ item, selected, onSelect, colors, t }) => {
  const isUnsure = item.value === null;
  return (
    <button
      className="w-full text-left rounded-xl p-3.5 transition-all duration-200 flex items-center gap-3"
      style={{
        backgroundColor: selected
          ? `${colors.primary.main}12`
          : colors.background.gray,
      }}
      onClick={onSelect}
    >
      {/* CEFR badge */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold tracking-tight transition-all duration-200"
        style={{
          backgroundColor: selected
            ? colors.primary.main
            : `${colors.primary.main}15`,
          color: selected ? colors.text.white : colors.primary.main,
        }}
      >
        {item.badge}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-sm"
          style={{
            color: isUnsure ? colors.text.secondary : colors.text.primary,
          }}
        >
          {isUnsure ? t(`courses.quiz.step1.${item.key}.label`) : item.value}
        </p>
        <p
          className="text-xs mt-0.5 leading-relaxed"
          style={{ color: colors.text.tertiary }}
        >
          {t(`courses.quiz.step1.${item.key}.desc`)}
        </p>
      </div>
      {selected && (
        <CheckCircle
          weight="BoldDuotone"
          size={18}
          style={{ color: colors.primary.main, flexShrink: 0 }}
        />
      )}
    </button>
  );
};

// Purpose icon card
const PurposeCard = ({ item, selected, onClick, colors, disabled, t }) => {
  const { Icon } = item;
  return (
    <button
      disabled={disabled && !selected}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 relative"
      style={{
        backgroundColor: selected
          ? `${colors.primary.main}12`
          : colors.background.gray,
        opacity: disabled && !selected ? 0.4 : 1,
        cursor: disabled && !selected ? "not-allowed" : "pointer",
      }}
    >
      <Icon
        weight="BoldDuotone"
        size={22}
        style={{
          color: selected ? colors.primary.main : colors.text.secondary,
        }}
      />
      <span
        className="text-xs font-medium text-center leading-tight"
        style={{
          color: selected ? colors.primary.main : colors.text.secondary,
        }}
      >
        {t(`courses.quiz.step2.${item.key}`)}
      </span>
      {selected && (
        <div className="absolute top-1.5 right-1.5">
          <CheckCircle
            weight="BoldDuotone"
            size={13}
            style={{ color: colors.primary.main }}
          />
        </div>
      )}
    </button>
  );
};

// Skill icon card
const SkillCard = ({ item, selected, onClick, colors, t }) => {
  const { Icon } = item;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl transition-all duration-200 relative"
      style={{
        backgroundColor: selected
          ? `${colors.primary.main}12`
          : colors.background.gray,
      }}
    >
      <Icon
        weight="BoldDuotone"
        size={26}
        style={{
          color: selected ? colors.primary.main : colors.text.secondary,
        }}
      />
      <span
        className="text-xs font-medium text-center"
        style={{
          color: selected ? colors.primary.main : colors.text.secondary,
        }}
      >
        {t(`courses.quiz.step3.${item.key}`)}
      </span>
      {selected && (
        <div className="absolute top-1.5 right-1.5">
          <CheckCircle
            weight="BoldDuotone"
            size={13}
            style={{ color: colors.primary.main }}
          />
        </div>
      )}
    </button>
  );
};

// ── Main component ───────────────────────────────────────

const CourseQuizModal = ({ isOpen, onClose, onSubmit }) => {
  const colors = useThemeColors();
  const { t } = useTranslation();

  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(undefined);
  const [purposes, setPurposes] = useState(new Set());
  const [skills, setSkills] = useState(new Set());

  const canNext = [level !== undefined, purposes.size > 0, true];

  const handleReset = () => {
    setStep(0);
    setLevel(undefined);
    setPurposes(new Set());
    setSkills(new Set());
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = () => {
    const query = buildQuery(level, [...purposes], [...skills]);
    onSubmit(query);
    handleReset();
    onClose();
  };

  const togglePurpose = (id) => {
    setPurposes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_PURPOSES) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const toggleSkill = (id) => {
    setSkills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stepMeta = [
    {
      eyebrow: t("courses.quiz.step1.eyebrow"),
      title: t("courses.quiz.step1.title"),
      highlight: t("courses.quiz.step1.titleHighlight"),
      subtitle: t("courses.quiz.step1.subtitle"),
    },
    {
      eyebrow: t("courses.quiz.step2.eyebrow"),
      title: t("courses.quiz.step2.title"),
      highlight: t("courses.quiz.step2.titleHighlight"),
      subtitle: t("courses.quiz.step2.subtitle", { max: MAX_PURPOSES }),
    },
    {
      eyebrow: t("courses.quiz.step3.eyebrow"),
      title: t("courses.quiz.step3.title"),
      highlight: t("courses.quiz.step3.titleHighlight"),
      subtitle: t("courses.quiz.step3.subtitle"),
    },
  ];

  const current = stepMeta[step];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
      hideCloseButton
    >
      <ModalContent style={{ backgroundColor: colors.background.card }}>
        <ModalHeader className="flex flex-col gap-0 pb-2">
          {/* Title row */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${colors.primary.main}15` }}
              >
                <MagicStick
                  weight="BoldDuotone"
                  size={18}
                  style={{ color: colors.primary.main }}
                />
              </div>
              <div>
                <p
                  className="font-semibold text-base leading-tight"
                  style={{ color: colors.text.primary }}
                >
                  {t("courses.quiz.modalTitle")}
                </p>
                <p
                  className="text-xs font-normal mt-0.5"
                  style={{ color: colors.text.tertiary }}
                >
                  {current.eyebrow}
                </p>
              </div>
            </div>
            <button
              className="hover:opacity-70 transition-opacity"
              onClick={handleClose}
            >
              <CloseCircle
                weight="BoldDuotone"
                size={24}
                style={{ color: colors.text.tertiary }}
              />
            </button>
          </div>

          {/* Step circles */}
          <StepCircles step={step} colors={colors} />
        </ModalHeader>

        <ModalBody className="pt-5 pb-2">
          {/* Step heading */}
          <div className="mb-5">
            <h2
              className="text-xl font-bold leading-snug"
              style={{ color: colors.text.primary }}
            >
              {current.title}{" "}
              <span style={{ color: colors.primary.main }}>
                {current.highlight}
              </span>
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: colors.text.secondary }}
            >
              {current.subtitle}
            </p>
          </div>

          {/* ── Step 1: Level ── */}
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LEVELS.map((item) => (
                <LevelCard
                  key={String(item.value)}
                  item={item}
                  selected={level === item.value}
                  onSelect={() => setLevel(item.value)}
                  colors={colors}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* ── Step 2: Purposes ── */}
          {step === 1 && (
            <div className="space-y-3">
              {/* Slot tracker */}
              <div className="flex items-center gap-2">
                {Array.from({ length: MAX_PURPOSES }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        i < purposes.size
                          ? colors.primary.main
                          : colors.background.gray,
                    }}
                  />
                ))}
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: colors.text.tertiary }}
                >
                  {t("courses.quiz.step2.selectedCount", {
                    count: purposes.size,
                    max: MAX_PURPOSES,
                  })}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {PURPOSES.map((p) => (
                  <PurposeCard
                    key={p.id}
                    item={p}
                    selected={purposes.has(p.id)}
                    onClick={() => togglePurpose(p.id)}
                    colors={colors}
                    disabled={purposes.size >= MAX_PURPOSES}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Skills ── */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {SKILLS.map((s) => (
                  <SkillCard
                    key={s.id}
                    item={s}
                    selected={skills.has(s.id)}
                    onClick={() => toggleSkill(s.id)}
                    colors={colors}
                    t={t}
                  />
                ))}
              </div>

              {skills.size === 0 && (
                <p className="text-xs" style={{ color: colors.text.tertiary }}>
                  {t("courses.quiz.step3.emptyHint")}
                </p>
              )}

              {(level !== undefined ||
                purposes.size > 0 ||
                skills.size > 0) && (
                <div
                  className="mt-4 p-3 rounded-xl"
                  style={{ backgroundColor: colors.background.gray }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: colors.text.tertiary }}
                  >
                    {t("courses.quiz.step3.previewLabel")}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    &ldquo;{buildQuery(level, [...purposes], [...skills])}
                    &rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex items-center justify-between gap-2">
          <Button
            variant="flat"
            startContent={
              step > 0 ? <AltArrowLeft weight="BoldDuotone" size={16} /> : null
            }
            style={{ color: colors.text.secondary }}
            onPress={step === 0 ? handleClose : () => setStep((s) => s - 1)}
          >
            {step === 0
              ? t("courses.quiz.nav.close")
              : t("courses.quiz.nav.back")}
          </Button>

          {step < 2 ? (
            <Button
              isDisabled={!canNext[step]}
              endContent={<AltArrowRight weight="BoldDuotone" size={16} />}
              style={{
                backgroundColor: canNext[step]
                  ? colors.primary.main
                  : colors.background.gray,
                color: canNext[step] ? colors.text.white : colors.text.tertiary,
              }}
              onPress={() => setStep((s) => s + 1)}
            >
              {t("courses.quiz.nav.next")}
            </Button>
          ) : (
            <Button
              startContent={<MagicStick weight="BoldDuotone" size={16} />}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
                fontWeight: 600,
              }}
              onPress={handleSubmit}
            >
              {t("courses.quiz.nav.submit")}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CourseQuizModal;
