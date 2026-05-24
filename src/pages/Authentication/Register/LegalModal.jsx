import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { CheckCircle } from "@solar-icons/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";

const LegalModal = ({ isOpen, onClose, data, onAgree, hasAgreed }) => {
  const { i18n } = useTranslation();
  const colors = useThemeColors();

  const lang = i18n.language.startsWith("vi") ? "vi" : "en";
  const content = data[lang];
  const isVi = lang === "vi";

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "z-[999]",
        wrapper: "z-[1000]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: colors.background.primaryLight,
                color: colors.primary.main,
              }}
            >
              {isVi ? "Pháp lý" : "Legal"}
            </span>
          </div>
          <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
            {content.title}
          </h2>
          <p className="text-xs font-normal" style={{ color: colors.text.tertiary }}>
            {isVi ? "Cập nhật lần cuối" : "Last updated"}: {content.lastUpdated}
          </p>
        </ModalHeader>

        <ModalBody className="py-2">
          <div className="space-y-3">
            {content.sections.map((section, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ backgroundColor: colors.background.gray }}
              >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                  style={{
                    backgroundColor: colors.background.primaryLight,
                    color: colors.primary.main,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3
                    className="text-sm font-semibold mb-1"
                    style={{ color: colors.text.primary }}
                  >
                    {section.heading}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: colors.text.secondary }}
                  >
                    {section.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ModalBody>

        <ModalFooter className="pt-3 gap-2">
          <Button variant="light" onPress={onClose} size="sm">
            {isVi ? "Đóng" : "Close"}
          </Button>
          {hasAgreed ? (
            <Button
              size="sm"
              className="font-medium"
              style={{
                backgroundColor: colors.state.success,
                color: "#fff",
              }}
              startContent={<CheckCircle weight="Bold" className="w-4 h-4" />}
              onPress={onClose}
            >
              {isVi ? "Đã đồng ý" : "Agreed"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="font-medium"
              style={{
                backgroundColor: colors.primary.main,
                color: "#fff",
              }}
              onPress={() => { onAgree(); onClose(); }}
            >
              {isVi ? "Tôi đồng ý" : "I Agree"}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LegalModal;
