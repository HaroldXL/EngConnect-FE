import { useTheme } from "../contexts/ThemeContext";

// Light mode colors
const lightColors = {
  primary: {
    main: '#3B82F6',
    light: '#60A5FA',
    lightest: '#E7EFFD',
    dark: '#2563EB',
    hover: '#2563EB',
    accent: '#4A90E2',
    logo: '#2274D4',
    deepBlue: '#1B5CA8',
  },
  background: {
    dark: '#2D2D2D',
    light: '#FFFFFF',
    gray: '#F5F7FA',
    input: '#F3F4F6',
    page: '#FBFCFE',
    card: '#FFFFFF',
    primaryLight: 'rgba(59, 130, 246, 0.1)',
    testimonial: 'rgba(37, 78, 126, 0.1)',
  },
  text: {
    main: '#3B82F6',
    primary: '#111827',
    heading: '#1B2128',
    dark: '#1D2026',
    secondary: '#6B7280',
    muted: '#4E5566',
    tertiary: '#9CA3AF',
    white: '#FFFFFF',
    footer: '#281D1B',
  },
  border: {
    light: '#E5E7EB',
    medium: '#E5E7EB',
    dark: '#9CA3AF',
  },
  button: {
    primaryLight: {
      background: '#E7EFFD',
      text: '#3B82F6',
    },
  },
  state: {
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    refund: '#F97316',
  },
  social: {
    google: '#4285F4',
    facebook: '#1877F2',
  },
};

// Dark mode colors
const darkColors = {
  primary: {
    main: '#60A5FA',
    light: '#93C5FD',
    lightest: 'rgba(96, 165, 250, 0.15)',
    dark: '#3B82F6',
    hover: '#3B82F6',
    accent: '#4A90E2',
    logo: '#60A5FA',
    deepBlue: '#3B82F6',
  },
  background: {
    dark: '#020617',
    light: '#1E293B',
    gray: '#0B1120',
    input: '#0F172A',
    page: '#020617',
    card: '#1E293B',
    primaryLight: 'rgba(96, 165, 250, 0.12)',
    testimonial: 'rgba(96, 165, 250, 0.08)',
  },
  text: {
    main: '#60A5FA',
    primary: '#E5E7EB',
    heading: '#F3F4F6',
    dark: '#E5E7EB',
    secondary: '#94A3B8',
    muted: '#64748B',
    tertiary: '#64748B',
    white: '#FFFFFF',
    footer: '#D1D5DB',
  },
  border: {
    light: '#1E293B',
    medium: '#334155',
    dark: '#475569',
  },
  button: {
    primaryLight: {
      background: 'rgba(96, 165, 250, 0.15)',
      text: '#93C5FD',
    },
  },
  state: {
    error: '#F87171',
    success: '#4ADE80',
    warning: '#FCD34D',
    info: '#60A5FA',
    refund: '#F97316',
  },
  social: {
    google: '#4285F4',
    facebook: '#1877F2',
  },
};

export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme === 'dark' ? darkColors : lightColors;
};

export { lightColors, darkColors };
