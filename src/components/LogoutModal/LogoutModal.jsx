import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Image,
} from "@heroui/react";
import { CloseCircle, Logout, UndoLeftRound } from "@solar-icons/react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useThemeColors } from "../../hooks/useThemeColors";

import { logout } from "../../store";
import ExitImage from "../../assets/illustrations/exit.avif";

const LogoutModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    onClose();
    dispatch(logout());
    navigate("/login");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      placement="center"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50",
      }}
    >
      <ModalContent style={{ backgroundColor: colors.background.card }}>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex flex-col items-center gap-1 pt-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center"
              >
                <Image
                  src={ExitImage}
                  alt="Logout"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-68 h-68 object-contain"
                />
              </motion.div>
            </ModalHeader>
            <ModalBody className="text-center pt-0 pb-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("logoutModal.title")}
                </h3>
                <p
                  className="text-base"
                  style={{ color: colors.text.secondary }}
                >
                  {t("logoutModal.description")}
                </p>
              </motion.div>
            </ModalBody>
            <ModalFooter className="flex gap-3 pb-6 px-6">
              <Button
                variant="flat"
                onPress={onCloseModal}
                startContent={
                  <UndoLeftRound weight="BoldDuotone" className="w-5 h-5" />
                }
                className="flex-1"
              >
                {t("logoutModal.cancel")}
              </Button>
              <Button
                color="danger"
                onPress={handleLogout}
                startContent={
                  <Logout weight="BoldDuotone" className="w-5 h-5" />
                }
                className="flex-1"
              >
                {t("logoutModal.confirm")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default LogoutModal;
