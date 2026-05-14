import { useState, useEffect, useCallback } from "react";
import { AltArrowRight, CheckCircle, CloseCircle, DangerCircle, Diploma, MenuDots, Restart } from "@solar-icons/react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress,
  RadioGroup,
  Radio,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";

import { coursesApi } from "../../api";

const LessonQuizModal = ({ isOpen, onClose, lessonScriptId }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);

  const fetchQuiz = useCallback(async () => {
    if (!lessonScriptId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await coursesApi.generateQuiz(lessonScriptId);
      const q = res?.data?.questions || [];
      setQuestions(q);
      setAnswers(new Array(q.length).fill(null));
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setChecked(false);
      setFinished(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [lessonScriptId]);

  useEffect(() => {
    if (isOpen && lessonScriptId) {
      fetchQuiz();
    }
    if (!isOpen) {
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setChecked(false);
      setAnswers([]);
      setFinished(false);
      setError(false);
    }
  }, [isOpen, lessonScriptId, fetchQuiz]);

  const current = questions[currentIndex];
  const isCorrect = checked && selectedAnswer === current?.True;
  const isLast = currentIndex === questions.length - 1;

  const handleCheck = () => {
    if (!selectedAnswer) return;
    setChecked(true);
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = selectedAnswer;
      return copy;
    });
  };

  const handleNext = () => {
    if (isLast) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setChecked(false);
    }
  };

  const handleRetry = () => {
    fetchQuiz();
  };

  const correctCount = answers.filter(
    (a, i) => a === questions[i]?.True,
  ).length;
  const percent =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

  const wrongQuestions = questions
    .map((q, i) => ({ ...q, index: i, userAnswer: answers[i] }))
    .filter((q) => q.userAnswer && q.userAnswer !== q.True);

  // --- Loading state ---
  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" hideCloseButton>
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalBody className="py-16 flex flex-col items-center justify-center gap-4">
            <MenuDots
              weight="BoldDuotone"
              className="w-10 h-10 animate-spin"
              style={{ color: colors.primary.main }}
            />
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              {t("tutorDashboard.schedule.quizLoading")}
            </p>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <ModalBody className="py-16 flex flex-col items-center justify-center gap-4">
            <DangerCircle
              weight="BoldDuotone"
              className="w-10 h-10"
              style={{ color: colors.state.error }}
            />
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              {t("tutorDashboard.schedule.quizError")}
            </p>
          </ModalBody>
          <ModalFooter className="justify-center">
            <Button variant="light" onPress={onClose}>
              {t("tutorDashboard.schedule.closeQuiz")}
            </Button>
            <Button
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
              onPress={handleRetry}
              startContent={<Restart weight="BoldDuotone" className="w-4 h-4" />}
            >
              {t("tutorDashboard.schedule.retryQuiz")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // --- Result screen ---
  if (finished) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          <>
            <ModalHeader
              className="flex items-center gap-2"
              style={{ color: colors.text.primary }}
            >
              <Diploma
                weight="BoldDuotone"
                className="w-5 h-5"
                style={{ color: colors.primary.main }}
              />
              {t("tutorDashboard.schedule.quizComplete")}
            </ModalHeader>
            <ModalBody className="pb-4">
              {/* Score */}
              <div className="text-center mb-6">
                <p
                  className="text-3xl font-bold mb-2"
                  style={{
                    color:
                      percent >= 70
                        ? colors.state.success
                        : percent >= 40
                          ? colors.state.warning
                          : colors.state.error,
                  }}
                >
                  {t("tutorDashboard.schedule.quizScore", {
                    correct: correctCount,
                    total: questions.length,
                    percent,
                  })}
                </p>
                <Progress
                  value={percent}
                  className="max-w-md mx-auto"
                  color={
                    percent >= 70
                      ? "success"
                      : percent >= 40
                        ? "warning"
                        : "danger"
                  }
                  size="md"
                />
              </div>

              {/* Wrong answers review */}
              {wrongQuestions.length > 0 && (
                <div>
                  <p
                    className="text-sm font-semibold mb-3"
                    style={{ color: colors.text.primary }}
                  >
                    {t("tutorDashboard.schedule.wrongAnswers")}
                  </p>
                  <div className="space-y-3">
                    {wrongQuestions.map((q) => (
                      <div
                        key={q.index}
                        className="p-3 rounded-xl"
                        style={{
                          backgroundColor: `${colors.state.error}10`,
                          border: `1px solid ${colors.state.error}25`,
                        }}
                      >
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: colors.text.primary }}
                        >
                          {t("tutorDashboard.schedule.quizQuestion")}{" "}
                          {q.index + 1}: {q.Question}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: colors.state.error }}
                        >
                          {t("tutorDashboard.schedule.yourAnswer", {
                            answer: `${q.userAnswer}. ${q.Answer[q.userAnswer]}`,
                          })}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: colors.state.success }}
                        >
                          {t("tutorDashboard.schedule.correctAnswerIs", {
                            answer: `${q.True}. ${q.Answer[q.True]}`,
                          })}
                        </p>
                        {q.Explanation && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: colors.text.tertiary }}
                          >
                            {q.Explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("tutorDashboard.schedule.closeQuiz")}
              </Button>
              <Button
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
                onPress={handleRetry}
                startContent={<Restart weight="BoldDuotone" className="w-4 h-4" />}
              >
                {t("tutorDashboard.schedule.retryQuiz")}
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    );
  }

  // --- Question screen ---
  if (!current) return null;

  const answerEntries = Object.entries(current.Answer || {});

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" hideCloseButton>
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        <>
          <ModalHeader className="flex items-center justify-between">
            <div
              className="flex items-center gap-2"
              style={{ color: colors.text.primary }}
            >
              <Diploma
                weight="BoldDuotone"
                className="w-5 h-5"
                style={{ color: colors.primary.main }}
              />
              {t("tutorDashboard.schedule.lessonQuiz")}
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: colors.text.tertiary }}
            >
              {currentIndex + 1} {t("tutorDashboard.schedule.quizOf")}{" "}
              {questions.length}
            </span>
          </ModalHeader>
          <ModalBody className="pb-4">
            {/* Progress */}
            <Progress
              value={((currentIndex + 1) / questions.length) * 100}
              className="mb-5"
              color="primary"
              size="sm"
            />

            {/* Question */}
            <p
              className="text-base font-semibold mb-5"
              style={{ color: colors.text.primary }}
            >
              {current.Question}
            </p>

            {/* Answer options */}
            <RadioGroup
              value={selectedAnswer}
              onValueChange={(v) => {
                if (!checked) setSelectedAnswer(v);
              }}
              className="gap-2.5"
            >
              {answerEntries.map(([key, value]) => {
                let borderColor = colors.background.input;
                let bgColor = colors.background.light;

                if (checked) {
                  if (key === current.True) {
                    borderColor = colors.state.success;
                    bgColor = `${colors.state.success}15`;
                  } else if (key === selectedAnswer && key !== current.True) {
                    borderColor = colors.state.error;
                    bgColor = `${colors.state.error}15`;
                  }
                } else if (key === selectedAnswer) {
                  borderColor = colors.primary.main;
                  bgColor = `${colors.primary.main}10`;
                }

                return (
                  <Radio
                    key={key}
                    value={key}
                    classNames={{
                      base: "max-w-full p-3 rounded-xl m-0 cursor-pointer transition-colors",
                      label: "text-sm",
                    }}
                    style={{
                      border: `1.5px solid ${borderColor}`,
                      backgroundColor: bgColor,
                    }}
                    isDisabled={checked}
                  >
                    <span style={{ color: colors.text.primary }}>
                      {key}. {value}
                    </span>
                  </Radio>
                );
              })}
            </RadioGroup>

            {/* Feedback after check */}
            {checked && (
              <div
                className="mt-4 p-3 rounded-xl flex items-start gap-2"
                style={{
                  backgroundColor: isCorrect
                    ? `${colors.state.success}15`
                    : `${colors.state.error}15`,
                  border: `1px solid ${isCorrect ? colors.state.success : colors.state.error}30`,
                }}
              >
                {isCorrect ? (
                  <CheckCircle
                    weight="BoldDuotone"
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: colors.state.success }}
                  />
                ) : (
                  <CloseCircle
                    weight="BoldDuotone"
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: colors.state.error }}
                  />
                )}
                <div className="flex-1">
                  <p
                    className="text-sm font-semibold mb-0.5"
                    style={{
                      color: isCorrect
                        ? colors.state.success
                        : colors.state.error,
                    }}
                  >
                    {isCorrect
                      ? t("tutorDashboard.schedule.correct")
                      : t("tutorDashboard.schedule.incorrect")}
                  </p>
                  {!isCorrect && (
                    <p
                      className="text-xs mb-1"
                      style={{ color: colors.state.success }}
                    >
                      {t("tutorDashboard.schedule.correctAnswerIs", {
                        answer: `${current.True}. ${current.Answer[current.True]}`,
                      })}
                    </p>
                  )}
                  {current.Explanation && (
                    <p
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      {current.Explanation}
                    </p>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {t("tutorDashboard.schedule.closeQuiz")}
            </Button>
            {!checked ? (
              <Button
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
                isDisabled={!selectedAnswer}
                onPress={handleCheck}
              >
                {t("tutorDashboard.schedule.checkAnswer")}
              </Button>
            ) : (
              <Button
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.white,
                }}
                endContent={<AltArrowRight weight="BoldDuotone" className="w-4 h-4" />}
                onPress={handleNext}
              >
                {isLast
                  ? t("tutorDashboard.schedule.quizComplete")
                  : t("tutorDashboard.schedule.nextQuestion")}
              </Button>
            )}
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default LessonQuizModal;
