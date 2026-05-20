import { InfoCircle } from "@solar-icons/react";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "../../hooks/useThemeColors";

/**
 * Subtle reminder that AI output is reference-only.
 * Placed at the top of every AI card (after the header).
 */
export default function AIDisclaimer() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <div
      className="flex items-start gap-2 px-3 py-2 rounded-lg"
      style={{
        backgroundColor: `${colors.state.warning}12`,
        border: `1px solid ${colors.state.warning}30`,
      }}
    >
      <InfoCircle
        weight="BoldDuotone"
        className="w-4 h-4 shrink-0 mt-0.5"
        style={{ color: colors.state.warning }}
      />
      <p
        className="text-xs italic leading-snug"
        style={{ color: colors.state.warning }}
      >
        {t("homeworkAI.disclaimer")}
      </p>
    </div>
  );
}
