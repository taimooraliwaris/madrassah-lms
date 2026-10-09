import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSettings } from "@/hooks/queries";
import { translate, type Lang } from "@/lib/i18n-dict";

export type Theme = {
  id: string;
  name: string;
  primary: string;
  accent: string;
  background: string;
  foreground: string;
};

export type BrandingValue = {
  loading: boolean;
  institutionName: string;
  tagline: string;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  academicYear: string;
  themes: Theme[];
  themeId: string;
  setThemeId: (id: string) => void;
  language: Lang;
  setLanguage: (l: Lang) => void;
  urduEnabled: boolean;
  t: (key: string) => string;
};

const BrandingContext = createContext<BrandingValue | undefined>(undefined);

const FALLBACK_THEMES: Theme[] = [
  {
    id: "emerald",
    name: "Emerald",
    primary: "oklch(0.45 0.13 165)",
    accent: "oklch(0.72 0.12 75)",
    background: "oklch(0.98 0.01 95)",
    foreground: "oklch(0.2 0.02 165)",
  },
];

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useSettings();

  const themes = useMemo<Theme[]>(() => {
    const list = (settings as any)?.themes;
    if (Array.isArray(list) && list.length > 0) return list as Theme[];
    return FALLBACK_THEMES;
  }, [settings]);

  const defaultTheme =
    (settings as any)?.primary_theme_id ?? themes[0]?.id ?? "emerald";
  const defaultLang: Lang =
    ((settings as any)?.default_language as Lang) ?? "en";

  const [themeId, setThemeIdState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("brand.theme") ?? defaultTheme;
    }
    return defaultTheme;
  });

  const [language, setLanguageState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("brand.lang") as Lang) ?? defaultLang;
    }
    return defaultLang;
  });

  useEffect(() => {
    if ((settings as any)?.primary_theme_id && !localStorage.getItem("brand.theme")) {
      setThemeIdState((settings as any).primary_theme_id);
    }
    if ((settings as any)?.default_language && !localStorage.getItem("brand.lang")) {
      setLanguageState((settings as any).default_language as Lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const setThemeId = (id: string) => {
    setThemeIdState(id);
    if (typeof window !== "undefined") localStorage.setItem("brand.theme", id);
  };
  const setLanguage = (l: Lang) => {
    setLanguageState(l);
    if (typeof window !== "undefined") localStorage.setItem("brand.lang", l);
  };

  // Apply theme CSS variables onto :root and cache for pre-paint script
  useEffect(() => {
    const active = themes.find((t) => t.id === themeId) ?? themes[0];
    if (!active) return;
    const root = document.documentElement;
    const vars: Record<string, string> = {
      "--primary": active.primary,
      "--ring": active.primary,
      "--sidebar": active.primary,
      "--accent": active.accent,
      "--sidebar-primary": active.accent,
      "--background": active.background,
      "--foreground": active.foreground,
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    try {
      localStorage.setItem("brand.themeVars", JSON.stringify(vars));
    } catch {}
  }, [themes, themeId]);

  // Apply language direction
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    if (language === "ur") {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "ur");
      html.classList.add("font-urdu");
    } else {
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", "en");
      html.classList.remove("font-urdu");
    }
  }, [language]);

  const value: BrandingValue = {
    loading: isLoading,
    institutionName: settings?.institution_name ?? "Madrassah LMS",
    tagline: settings?.tagline ?? "Digitizing Sacred Education",
    logoUrl: settings?.institution_logo_url ?? null,
    contactEmail: settings?.contact_email ?? null,
    contactPhone: settings?.contact_phone ?? null,
    academicYear: settings?.academic_year ?? "2024-2025",
    themes,
    themeId,
    setThemeId,
    language,
    setLanguage,
    urduEnabled: (settings as any)?.urdu_enabled ?? true,
    t: (k: string) => translate(language, k),
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    // Safe default for non-wrapped usage (e.g. early in tree)
    return {
      loading: false,
      institutionName: "Madrassah LMS",
      tagline: "Digitizing Sacred Education",
      logoUrl: null,
      contactEmail: null,
      contactPhone: null,
      academicYear: "2024-2025",
      themes: FALLBACK_THEMES,
      themeId: "emerald",
      setThemeId: () => {},
      language: "en",
      setLanguage: () => {},
      urduEnabled: true,
      t: (k) => translate("en", k),
    };
  }
  return ctx;
}
