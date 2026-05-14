import { useTheme } from "../../contexts/ThemeContext";
import { Sun, Moon } from "@solar-icons/react";
import { Button } from "@heroui/react";

import { useThemeColors } from "../../hooks/useThemeColors";

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  const colors = useThemeColors();

  return (
    <Button
      size="sm"
      variant="light"
      isIconOnly
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="hover:bg-opacity-10"
    >
      {theme === "light" ? (
        <Moon
          className="w-5 h-5"
          weight="BoldDuotone"
          style={{ color: colors.text.secondary }}
        />
      ) : (
        <Sun
          className="w-5 h-5"
          weight="BoldDuotone"
          style={{ color: colors.text.secondary }}
        />
      )}
    </Button>
  );
};

export default ThemeSwitcher;
