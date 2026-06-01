import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { TERMS, PRIVACY } from "../../Legal/legalData";

const SectionList = ({ content, colors }) => (
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
);

const LegalModal = ({ isOpen, onClose, onAgree, defaultTab = "terms" }) => {
  const { i18n } = useTranslation();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState(defaultTab);

  const lang = i18n.language.startsWith("vi") ? "vi" : "en";
  const isVi = lang === "vi";
  const terms = TERMS[lang];
  const privacy = PRIVACY[lang];

  // Sync tab when modal opens with a different defaultTab
  useEffect(() => {
    if (isOpen) setActiveTab(defaultTab);
  }, [isOpen, defaultTab]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "z-[999]",
        wrapper: "z-[1000]",
      }}
    >
      <ModalContent>
        <ModalHeader className="pb-0">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key)}
            variant="underlined"
            color="primary"
            className="w-full"
          >
            <Tab
              key="terms"
              title={isVi ? "Điều khoản sử dụng" : "Terms & Conditions"}
            />
            <Tab
              key="privacy"
              title={isVi ? "Chính sách bảo mật" : "Privacy Policy"}
            />
          </Tabs>
        </ModalHeader>

        <ModalBody className="py-4">
          {activeTab === "terms" ? (
            <>
              <SectionList content={terms} colors={colors} />
            </>
          ) : (
            <>
              <SectionList content={privacy} colors={colors} />
            </>
          )}
        </ModalBody>

        <ModalFooter className="pt-3 gap-2">
          <Button variant="light" onPress={onClose} size="sm">
            {isVi ? "Đóng" : "Close"}
          </Button>
          <Button
            size="sm"
            className="font-medium"
            style={{ backgroundColor: colors.primary.main, color: "#fff" }}
            onPress={onAgree}
          >
            {isVi ? "Tôi đồng ý" : "I Agree"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LegalModal;
