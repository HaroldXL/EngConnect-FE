import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import { DocumentText } from "@solar-icons/react";

const LessonSummaryModal = ({ isOpen, onClose, summarizeText }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  if (!summarizeText) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent style={{ backgroundColor: colors.background.light }}>
        <>
          <ModalHeader
            className="flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <DocumentText
              weight="BoldDuotone"
              className="w-5 h-5"
              style={{ color: colors.primary.main }}
            />
            {t("tutorDashboard.schedule.lessonSummary")}
          </ModalHeader>
          <ModalBody className="pb-6">
            <p
              className="text-sm whitespace-pre-line leading-relaxed"
              style={{ color: colors.text.secondary }}
            >
              {summarizeText}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {t("tutorDashboard.schedule.cancel")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default LessonSummaryModal;
