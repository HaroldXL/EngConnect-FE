import { useTranslation } from "react-i18next";
import LegalDocPage from "./LegalDocPage";
import { TERMS } from "./legalData";

const TermsPage = () => {
  const { i18n } = useTranslation();
  const badgeLabel = i18n.language.startsWith("vi") ? "Pháp lý" : "Legal";
  return <LegalDocPage data={TERMS} badgeLabel={badgeLabel} />;
};

export default TermsPage;
