"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "skill-forge:theme";

export type Theme = "light" | "dark" | "system";

/**
 * テーマ設定ユーティリティ
 * next-themesの初期化前にクライアントサイドでテーマを判定するために使用
 */
export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored && ["light", "dark", "system"].includes(stored)) {
    return stored;
  }

  return "system";
}

/**
 * システムのカラースキームを取得
 */
export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * テーマをlocalStorageに保存
 */
export function saveTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * useThemeValue - コンポーネント内でテーマに応じた値を返す
 */
export function useThemeValue<T>(lightValue: T, darkValue: T): T {
  const [value, setValue] = useState<T>(darkValue);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    let isDark: boolean;
    if (stored === "dark" || stored === "light") {
      isDark = stored === "dark";
    } else {
      isDark = mediaQuery.matches;
    }

    setValue(isDark ? darkValue : lightValue);

    const handler = (e: MediaQueryListEvent) => {
      const currentStored = localStorage.getItem(THEME_STORAGE_KEY);
      if (currentStored === "system" || !currentStored) {
        setValue(e.matches ? darkValue : lightValue);
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [lightValue, darkValue]);

  return value;
}
