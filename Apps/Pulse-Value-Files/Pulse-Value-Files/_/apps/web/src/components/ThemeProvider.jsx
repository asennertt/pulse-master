"use client";

import { useApplyTheme } from "@/utils/useTheme";

export function ThemeProvider({ children }) {
  useApplyTheme();
  return <>{children}</>;
}
