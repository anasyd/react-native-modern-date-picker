// ModernDatePicker.tsx — fully refactored with industry-standard theming
// React Native + TypeScript (drop into your project). No external deps.
//
// Highlights
// - Semantic color tokens (background, surface, foreground, accent, onAccent, ...)
// - Light/Dark presets
// - createTheme({ preset, palette, overrides }) factory
// - ThemeProvider + useTheme() context
// - Component reads only semantic tokens
// - WCAG-ish auto-contrast for onAccent & foreground
// - Back-compat: you can still pass a legacy `theme` with {primary, secondary} and it will be adapted
//
// Usage
// const theme = createTheme({
//   preset: "light",
//   palette: { primary: "#f4f2f2", secondary: "#000", accent: "#2563eb" },
// });
// <ThemeProvider value={theme}>
//   <ModernDatePicker open={open} onClose={close} />
// </ThemeProvider>

import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  FlatList,
} from "react-native";

/*************************
 * THEME TYPES & HELPERS *
 *************************/

export type SemanticColors = {
  background: string; // main sheet bg
  surface: string; // card/body surfaces
  header: string; // header surface
  foreground: string; // primary text color on surfaces
  mutedForeground: string; // subdued text
  border: string; // borders (focus rings can derive from accent)
  divider: string; // hairlines
  accent: string; // selection bg / emphasis
  onAccent: string; // text on top of accent
  disabledForeground: string; // disabled text
};

export type Theme = {
  colorScheme: "light" | "dark";
  colors: SemanticColors;
  radii: { xs: number; sm: number; md: number; lg: number; full: number };
  space: { xs: number; sm: number; md: number; lg: number };
  fontSizes: { xs: number; sm: number; md: number; lg: number };
  shadows: ViewStyle;
};

export type ThemePalette = {
  primary?: string; // surfaces
  secondary?: string; // text/icons
  accent?: string; // selection
};

export type CreateThemeInput = {
  preset?: "light" | "dark";
  palette?: ThemePalette;
  overrides?: Partial<Theme> & { colors?: Partial<SemanticColors> };
  options?: { contrastThreshold?: number; autoContrast?: boolean };
};

// LEGACY support (from your original API)
export type LegacyTheme = {
  colors?: Partial<{
    background: string;
    surface: string;
    headerBackgroundColor: string;
    bodyBackgroundColor: string;
    text: string;
    mutedText: string;
    selectedBackground: string;
    selectedText: string;
    todayBorder: string;
    disabledText: string;
    divider: string;
  }>;
  radius?: number;
  topRadius?: number;
  selectedDateRadius?: number;
  selectedMonthRadius?: number;
  selectedYearRadius?: number;
  preset?: "dark" | "light";
  primary?: string;
  secondary?: string;
  autoContrast?: boolean;
  contrastThreshold?: number;
  shadow?: boolean;
  typography?: { title?: number; label?: number; day?: number };
  spacing?: { gutter?: number; header?: number; gridGap?: number };
};

/***********************
 * CONTRAST UTILITIES   *
 ***********************/

function hexToRgb(hex?: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length !== 6) return null;
  const int = parseInt(h, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function relLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const chan = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function contrastRatio(fg: string, bg: string): number {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!a || !b) return 1;
  const l1 = relLuminance(a) + 0.05;
  const l2 = relLuminance(b) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

function ensureReadable(desiredText: string, bg: string, threshold = 4.5) {
  const candidates = [desiredText, "#ffffff", "#000000"]; // try intent first
  let best = candidates[0];
  let bestRatio = 0;
  for (const c of candidates) {
    const r = contrastRatio(c, bg);
    if (r > bestRatio) {
      bestRatio = r;
      best = c;
    }
  }
  if (bestRatio >= threshold) return best;
  // force the highest contrast between black/white
  return contrastRatio("#fff", bg) >= contrastRatio("#000", bg)
    ? "#fff"
    : "#000";
}

function withAlpha(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

/*********************
 * PRESETS & FACTORY *
 *********************/

const LIGHT: SemanticColors = {
  background: "#ffffff",
  surface: "#ffffff",
  header: "#ffffff",
  foreground: "#111827",
  mutedForeground: "#6B7280",
  border: "#e5e7eb",
  divider: "#e5e7eb",
  accent: "#2563eb",
  onAccent: "#ffffff",
  disabledForeground: "#9CA3AF",
};

const DARK: SemanticColors = {
  background: "#0f1115",
  surface: "#171923",
  header: "#171923",
  foreground: "#e5e7eb",
  mutedForeground: "#9ca3af",
  border: "#232735",
  divider: "#232735",
  accent: "#2563eb",
  onAccent: "#ffffff",
  disabledForeground: "#6b7280",
};

const DEFAULT_THEME: Theme = {
  colorScheme: "dark",
  colors: DARK,
  radii: { xs: 6, sm: 8, md: 12, lg: 20, full: 9999 },
  space: { xs: 6, sm: 12, md: 16, lg: 20 },
  fontSizes: { xs: 12, sm: 13, md: 15, lg: 18 },
  shadows: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
    },
    android: { elevation: 18 },
    default: {},
  }) as ViewStyle,
};

export function createTheme(input: CreateThemeInput = {}): Theme {
  const { preset = "dark", palette = {}, overrides = {}, options = {} } = input;

  const baseScheme = preset === "light" ? LIGHT : DARK;
  const primary = palette.primary ?? baseScheme.background; // surfaces
  const secondary = palette.secondary ?? baseScheme.foreground; // text
  const accent = palette.accent ?? baseScheme.accent; // selection

  const threshold = options.contrastThreshold ?? 4.5;
  const autoContrast = options.autoContrast ?? true;

  // Resolve foreground against the actual surface the calendar uses (surface)
  const foreground = ensureReadable(secondary, primary, threshold);

  const resolved: Theme = {
    colorScheme: preset,
    colors: {
      background: primary,
      surface: primary,
      header: primary,
      foreground,
      mutedForeground: withAlpha(foreground, 0.7),
      border: withAlpha(foreground, 0.15),
      divider: withAlpha(foreground, 0.15),
      accent,
      onAccent: autoContrast
        ? ensureReadable(foreground, accent, threshold)
        : foreground,
      disabledForeground: withAlpha(foreground, 0.4),
    },
    radii: { ...DEFAULT_THEME.radii },
    space: { ...DEFAULT_THEME.space },
    fontSizes: { ...DEFAULT_THEME.fontSizes },
    shadows: { ...DEFAULT_THEME.shadows },
  };

  // Apply overrides (shallow for root, deep for colors)
  const out: Theme = {
    ...resolved,
    ...(overrides as any),
    colors: { ...resolved.colors, ...(overrides.colors ?? {}) },
  };

  return out;
}

export function extendTheme(
  base: Theme,
  overrides: Partial<Theme> & { colors?: Partial<SemanticColors> }
): Theme {
  return {
    ...base,
    ...overrides,
    colors: { ...base.colors, ...(overrides.colors ?? {}) },
  };
}

/**********************
 * THEME CONTEXT API  *
 **********************/

const ThemeCtx = React.createContext<Theme>(DEFAULT_THEME);
export const ThemeProvider: React.FC<{
  value: Theme;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
);
export function useTheme(): Theme {
  return useContext(ThemeCtx);
}

/************************
 * LEGACY THEME ADAPTER *
 ************************/

function adaptLegacyTheme(legacy?: LegacyTheme): Theme | null {
  if (!legacy) return null;
  const preset = legacy.preset === "light" ? "light" : "dark";
  const base = preset === "light" ? LIGHT : DARK;
  const primary = legacy.primary ?? base.background;
  const secondary = legacy.secondary ?? base.foreground;
  const threshold = legacy.contrastThreshold ?? 4.5;
  const autoContrast = legacy.autoContrast ?? true;

  // Choose the surface where content lives (prefer bodyBackgroundColor if provided)
  const bodySurface = legacy.colors?.bodyBackgroundColor ?? primary;
  const foreground =
    legacy.colors?.text ?? ensureReadable(secondary, bodySurface, threshold);

  const colors: SemanticColors = {
    background: legacy.colors?.background ?? primary,
    surface: legacy.colors?.surface ?? bodySurface,
    header: legacy.colors?.headerBackgroundColor ?? primary,
    foreground,
    mutedForeground: legacy.colors?.mutedText ?? withAlpha(foreground, 0.7),
    border: legacy.colors?.divider ?? withAlpha(foreground, 0.15),
    divider: legacy.colors?.divider ?? withAlpha(foreground, 0.15),
    accent: legacy.colors?.selectedBackground ?? base.accent,
    onAccent:
      legacy.colors?.selectedText ??
      (autoContrast
        ? ensureReadable(
            foreground,
            legacy.colors?.selectedBackground ?? base.accent,
            threshold
          )
        : foreground),
    disabledForeground:
      legacy.colors?.disabledText ?? withAlpha(foreground, 0.4),
  };

  const adapted: Theme = {
    colorScheme: preset,
    colors,
    radii: {
      xs: 6,
      sm: 8,
      md: legacy.selectedDateRadius ?? legacy.radius ?? 12,
      lg: legacy.topRadius ?? legacy.radius ?? 20,
      full: 9999,
    },
    space: { xs: 6, sm: 12, md: legacy.spacing?.gutter ?? 16, lg: 20 },
    fontSizes: {
      xs: 12,
      sm: legacy.typography?.label ?? 13,
      md: legacy.typography?.day ?? 15,
      lg: legacy.typography?.title ?? 18,
    },
    shadows:
      legacy.shadow === false
        ? ({} as ViewStyle)
        : (DEFAULT_THEME.shadows as ViewStyle),
  };

  return adapted;
}

/**********************
 * DATE UTILITIES     *
 **********************/

function stripTime(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  return x;
}
function addYears(d: Date, n: number) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + n);
  return x;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function between(d: Date, min?: Date, max?: Date) {
  const t = stripTime(d).getTime();
  const tmin = min ? stripTime(min).getTime() : -Infinity;
  const tmax = max ? stripTime(max).getTime() : Infinity;
  return t >= tmin && t <= tmax;
}
function clampDate(d: Date, min?: Date, max?: Date) {
  const t = d.getTime();
  const tmin = min ? stripTime(min).getTime() : -Infinity;
  const tmax = max ? stripTime(max).getTime() : Infinity;
  return new Date(Math.min(Math.max(t, tmin), tmax));
}
function getMonthMatrix(year: number, month: number, firstDayOfWeek: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = (firstOfMonth.getDay() - firstDayOfWeek + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < startDay; i++) {
    cells.push({
      date: new Date(year, month, i - startDay + 1),
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(year, month, d), inMonth: true });
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const nd = new Date(last);
    nd.setDate(nd.getDate() + 1);
    cells.push({ date: nd, inMonth: false });
  }
  const matrix: { date: Date; inMonth: boolean }[][] = [];
  for (let r = 0; r < cells.length; r += 7) matrix.push(cells.slice(r, r + 7));
  return matrix;
}

/**********************
 * COMPONENT PROPS    *
 **********************/

export type ModernDatePickerProps = {
  open: boolean;
  onClose: () => void;
  value?: Date | null;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  ageLimitYears?: number;
  // Theming: you can pass a resolved Theme, or a CreateThemeInput, or a LegacyTheme
  theme?: Theme | CreateThemeInput | LegacyTheme;
  locale?: string;
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  animationSpeed?: number;
  renderBackdrop?: (opacity: Animated.Value) => React.ReactNode;
  showDefaultBackdrop?: boolean;
  backdropColor?: string;
};

/**********************
 * MAIN COMPONENT     *
 **********************/

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
  open,
  onClose,
  value,
  defaultValue,
  onChange,
  minDate,
  maxDate,
  ageLimitYears,
  theme,
  locale = Platform.OS === "ios" ? undefined : "en-US",
  firstDayOfWeek = 0,
  testID,
  style,
  animationSpeed = 220,
  renderBackdrop,
  showDefaultBackdrop = true,
  backdropColor = "#000",
}) => {
  // Resolve THEME: prefer context, then adapt/create from prop, else default
  const ctx = useTheme();
  const THEME: Theme = useMemo(() => {
    if (!theme) return ctx || DEFAULT_THEME;

    // If it's already a Theme (has colors.foreground and colorScheme), trust it
    const maybeTheme = theme as Theme;
    if (
      (maybeTheme as any)?.colors?.foreground &&
      (maybeTheme as any)?.colorScheme
    ) {
      return extendTheme(ctx, maybeTheme);
    }

    // If it looks like CreateThemeInput
    if (
      (theme as any)?.palette ||
      (theme as any)?.overrides ||
      (theme as any)?.preset
    ) {
      const created = createTheme(theme as CreateThemeInput);
      return extendTheme(ctx, created);
    }

    // Else adapt legacy
    const adapted = adaptLegacyTheme(theme as LegacyTheme);
    return adapted ? extendTheme(ctx, adapted) : ctx;
  }, [theme, ctx]);

  const today = useMemo(() => stripTime(new Date()), []);

  const effectiveMax = useMemo(() => {
    const ageMax =
      ageLimitYears != null
        ? stripTime(addYears(new Date(), -ageLimitYears))
        : undefined;
    if (maxDate && ageMax)
      return new Date(Math.min(stripTime(maxDate).getTime(), ageMax.getTime()));
    return maxDate || ageMax
      ? stripTime((maxDate || ageMax) as Date)
      : undefined;
  }, [maxDate, ageLimitYears]);

  const effectiveMin = useMemo(
    () => (minDate ? stripTime(minDate) : undefined),
    [minDate]
  );

  const initialSelected = useMemo(() => {
    const base = value ?? defaultValue ?? (effectiveMax ? effectiveMax : today);
    return clampDate(stripTime(base), effectiveMin, effectiveMax);
  }, [value, defaultValue, effectiveMax, effectiveMin, today]);

  const [selected, setSelected] = useState<Date>(initialSelected);
  useEffect(() => setSelected(initialSelected), [open]);

  const [cursor, setCursor] = useState<Date>(
    new Date(initialSelected.getFullYear(), initialSelected.getMonth(), 1)
  );
  useEffect(() => {
    if (open)
      setCursor(
        new Date(initialSelected.getFullYear(), initialSelected.getMonth(), 1)
      );
  }, [open]);

  type ViewMode = "days" | "months" | "years";
  const [mode, setMode] = useState<ViewMode>("days");

  const translateY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState<boolean>(open);

  useEffect(() => {
    if (open) {
      if (!mounted) setMounted(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: animationSpeed,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: animationSpeed,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: animationSpeed,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: Math.max(120, animationSpeed * 0.8),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 300,
          duration: animationSpeed,
          useNativeDriver: true,
          easing: Easing.in(Easing.exp),
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: Math.max(120, animationSpeed * 0.8),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [open, animationSpeed]);

  const monthNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale || undefined, { month: "long" });
    return Array.from({ length: 12 }, (_, m) =>
      fmt.format(new Date(2020, m, 1))
    );
  }, [locale]);

  const weekdayShort = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale || undefined, {
      weekday: "short",
    });
    return DAYS.map((d) => fmt.format(new Date(2020, 10, d + 1)));
  }, [locale]);

  const orderedWeekdays = useMemo(() => {
    const arr = weekdayShort.slice();
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(arr.shift()!);
    return arr;
  }, [weekdayShort, firstDayOfWeek]);

  const matrix = useMemo(
    () =>
      getMonthMatrix(cursor.getFullYear(), cursor.getMonth(), firstDayOfWeek),
    [cursor, firstDayOfWeek]
  );

  const handleSelect = (d: Date) => {
    if (!between(d, effectiveMin, effectiveMax)) return;
    setSelected(d);
    onChange?.(d);
    onClose();
  };
  const goPrev = () =>
    setCursor(
      mode === "days"
        ? addMonths(cursor, -1)
        : mode === "months"
        ? addYears(cursor, -1)
        : addYears(cursor, -12)
    );
  const goNext = () =>
    setCursor(
      mode === "days"
        ? addMonths(cursor, 1)
        : mode === "months"
        ? addYears(cursor, 1)
        : addYears(cursor, 12)
    );

  const renderHeader = () => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthLabel = monthNames[month];
    return (
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: THEME.space.md,
            paddingTop: THEME.space.sm,
            backgroundColor: THEME.colors.header,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setMode("years")}
          accessibilityRole="button"
          accessibilityLabel="Select year"
        >
          <Text
            style={[
              styles.yearText,
              {
                color: THEME.colors.mutedForeground,
                fontSize: THEME.fontSizes.sm,
              },
            ]}
          >
            {year}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={goPrev}
            accessibilityRole="button"
            accessibilityLabel="Previous"
          >
            <Text style={[styles.chev, { color: THEME.colors.foreground }]}>
              ‹
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode(mode === "days" ? "months" : "days")}
            accessibilityRole="button"
            accessibilityLabel="Select month"
            style={styles.headerCenter}
          >
            <Text
              style={[
                styles.monthText,
                {
                  color: THEME.colors.foreground,
                  fontSize: THEME.fontSizes.lg,
                },
              ]}
            >
              {monthLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            accessibilityRole="button"
            accessibilityLabel="Next"
          >
            <Text style={[styles.chev, { color: THEME.colors.foreground }]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDays = () => (
    <View
      style={{
        paddingHorizontal: THEME.space.md,
        paddingBottom: THEME.space.md,
      }}
    >
      <View style={styles.weekRow}>
        {orderedWeekdays.map((w: string, i: number) => (
          <Text
            key={i}
            style={[styles.weekLabel, { color: THEME.colors.mutedForeground }]}
          >
            {w}
          </Text>
        ))}
      </View>
      {matrix.map((row, r) => (
        <View key={r} style={styles.weekRow}>
          {row.map((cell, c) => {
            const disabled =
              !between(cell.date, effectiveMin, effectiveMax) || !cell.inMonth;
            const isCurrent = isSameDay(cell.date, selected as Date);
            const isToday = isSameDay(cell.date, today);
            const dayStyles: ViewStyle = {
              borderRadius: THEME.radii.full,
              borderWidth: isToday && !isCurrent ? 1 : 0,
              borderColor: THEME.colors.accent,
              backgroundColor: isCurrent ? THEME.colors.accent : "transparent",
            };
            const txtStyles: TextStyle = {
              color: isCurrent
                ? THEME.colors.onAccent
                : disabled
                ? THEME.colors.disabledForeground
                : THEME.colors.foreground,
              fontSize: THEME.fontSizes.md,
            };
            return (
              <TouchableOpacity
                key={c}
                style={[styles.dayCell, { paddingVertical: 3 }]}
                disabled={disabled}
                onPress={() => handleSelect(stripTime(cell.date))}
                accessibilityRole="button"
                accessibilityLabel={`Select ${cell.date.toDateString()}`}
              >
                <View style={[styles.dayPill, dayStyles]}>
                  <Text style={[styles.dayText, txtStyles]}>
                    {cell.date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  const renderMonths = () => {
    const months = monthNames.map((name: string, idx: number) => ({
      name,
      idx,
    }));
    return (
      <View
        style={{
          paddingHorizontal: THEME.space.md,
          paddingBottom: THEME.space.md,
        }}
      >
        <View style={styles.monthGrid}>
          {months.map((m) => {
            const base = new Date(cursor.getFullYear(), m.idx, 1);
            const daysInMonth = new Date(
              base.getFullYear(),
              base.getMonth() + 1,
              0
            ).getDate();
            const selectable = Array.from(
              { length: daysInMonth },
              (_, i) => new Date(base.getFullYear(), base.getMonth(), i + 1)
            ).some((d) => between(d, effectiveMin, effectiveMax));
            const isCurrent =
              m.idx === (selected as Date).getMonth() &&
              cursor.getFullYear() === (selected as Date).getFullYear();
            return (
              <TouchableOpacity
                key={m.idx}
                style={[styles.monthCell, { borderRadius: THEME.radii.sm }]}
                disabled={!selectable}
                onPress={() => {
                  setCursor(new Date(cursor.getFullYear(), m.idx, 1));
                  setMode("days");
                }}
                accessibilityRole="button"
                accessibilityLabel={`Open ${m.name}`}
              >
                <View
                  style={[
                    styles.monthChip,
                    {
                      backgroundColor: isCurrent
                        ? THEME.colors.accent
                        : THEME.colors.surface,
                      borderRadius: isCurrent ? THEME.radii.md : THEME.radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isCurrent
                        ? THEME.colors.onAccent
                        : THEME.colors.foreground,
                    }}
                  >
                    {m.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderYears = () => {
    const baseYear = cursor.getFullYear();
    const years: number[] = [];
    for (let y = baseYear - 120; y <= baseYear + 120; y++) years.push(y);
    const item = ({ item: y }: { item: number }) => {
      const inRange =
        between(new Date(y, 0, 1), effectiveMin, effectiveMax) ||
        between(new Date(y, 11, 31), effectiveMin, effectiveMax);
      const isCurrent = y === (selected as Date).getFullYear();
      return (
        <TouchableOpacity
          disabled={!inRange}
          onPress={() => {
            setCursor(new Date(y, cursor.getMonth(), 1));
            setMode("months");
          }}
          style={[
            styles.yearRow,
            {
              backgroundColor: isCurrent ? THEME.colors.accent : "transparent",
              borderRadius: THEME.radii.sm,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open year ${y}`}
        >
          <Text
            style={{
              color: isCurrent
                ? THEME.colors.onAccent
                : inRange
                ? THEME.colors.foreground
                : THEME.colors.disabledForeground,
              fontSize: THEME.fontSizes.md,
            }}
          >
            {y}
          </Text>
        </TouchableOpacity>
      );
    };
    return (
      <View style={{ maxHeight: 320 }}>
        <FlatList
          data={years}
          keyExtractor={(y: number) => String(y)}
          initialScrollIndex={120}
          getItemLayout={(_, index: number) => ({
            length: 44,
            offset: 44 * index,
            index,
          })}
          renderItem={item}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {renderBackdrop ? (
          renderBackdrop(backdropOpacity)
        ) : showDefaultBackdrop ? (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: backdropColor, opacity: backdropOpacity },
            ]}
          />
        ) : null}
      </Pressable>

      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
            backgroundColor: THEME.colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: "hidden",
            ...(THEME.shadows as object),
            opacity,
          },
          style,
        ]}
      >
        {renderHeader()}
        <View
          style={[styles.divider, { backgroundColor: THEME.colors.divider }]}
        />
        <View style={{ backgroundColor: THEME.colors.surface, height: 360 }}>
          {mode === "days" && renderDays()}
          {mode === "months" && renderMonths()}
          {mode === "years" && (
            <View
              style={{
                paddingHorizontal: THEME.space.md,
                paddingBottom: THEME.space.md,
                flex: 1,
              }}
            >
              {renderYears()}
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

/**********************
 * STYLES             *
 **********************/

const styles = StyleSheet.create({
  backdrop: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0 },
  header: { paddingBottom: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: { paddingVertical: 8, paddingHorizontal: 12 },
  chev: { fontSize: 28, paddingHorizontal: 8 },
  yearText: { textAlign: "center", marginBottom: 2 },
  monthText: { textAlign: "center", fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  weekLabel: {
    width: String(100 / 7) + "%",
    textAlign: "center",
    paddingVertical: 6,
    fontWeight: "500",
  } as any,
  dayCell: { width: String(100 / 7) + "%", alignItems: "center" } as any,
  dayPill: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontWeight: "500" },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthCell: { width: "32%", marginBottom: 8 },
  monthChip: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  yearRow: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginVertical: 2,
  },
});

export default ModernDatePicker;
