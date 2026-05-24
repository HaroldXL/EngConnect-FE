import { useTranslation } from "react-i18next";
import LegalDocPage from "./LegalDocPage";
import { PRIVACY } from "./legalData";

const PrivacyPage = () => {
  const { i18n } = useTranslation();
  const badgeLabel = i18n.language.startsWith("vi") ? "Bảo mật" : "Privacy";
  return <LegalDocPage data={PRIVACY} badgeLabel={badgeLabel} />;
};

export default PrivacyPage;
