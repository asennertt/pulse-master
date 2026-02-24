import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useTheme = create(
  persist(
    (set) => ({
      isDark: true,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      setTheme: (isDark) => set({ isDark }),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const lightTheme = {
  background: "#FFFFFF",
  surface: "#F5F5F5",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: {
    primary: "#000000",
    secondary: "#6B7280",
    muted: "#9CA3AF",
  },
  accent: "#3B82F6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  chart: {
    primary: "#3B82F6",
    secondary: "#8B5CF6",
    tertiary: "#EC4899",
  },
};

export const darkTheme = {
  background: "#000000",
  surface: "#121212",
  card: "#1E1E1E",
  border: "#2A2A2A",
  text: {
    primary: "#FFFFFF",
    secondary: "#A0A0A0",
    muted: "#707070",
  },
  accent: "#60A5FA",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  chart: {
    primary: "#60A5FA",
    secondary: "#A78BFA",
    tertiary: "#F472B6",
  },
};

export const getTheme = (isDark) => (isDark ? darkTheme : lightTheme);
