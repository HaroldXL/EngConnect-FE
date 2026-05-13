import { Modal, ModalContent, ModalBody } from "@heroui/react";
import { useTheme } from "../../contexts/ThemeContext";

const ImageViewerModal = ({ imageUrl, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Modal
      isOpen={!!imageUrl}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="3xl"
      classNames={{ base: isDark ? "!bg-[#0F172A]" : "" }}
    >
      <ModalContent>
        {() => (
          <ModalBody className="p-3">
            <img
              src={imageUrl}
              alt="Document preview"
              className="w-full h-auto rounded-xl object-contain max-h-[80vh]"
            />
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ImageViewerModal;
