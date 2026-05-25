export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = "spellhand_theme";

export function isTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark";
}
