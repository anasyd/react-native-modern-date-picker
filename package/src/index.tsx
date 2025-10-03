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
  Vibration,
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
  // Range selection
  range?: boolean;
  rangeValue?: { start: Date | null; end: Date | null };
  onRangeChange?: (range: { start: Date | null; end: Date | null }) => void;
  // Date constraints
  minDate?: Date;
  maxDate?: Date;
  minAge?: number; // Minimum age in years (e.g., 18 for adults only)
  maxAge?: number; // Maximum age in years (e.g., 100)
  // Time constraints
  minTime?: { hour: number; minute: number }; // Minimum time (e.g., { hour: 9, minute: 0 })
  maxTime?: { hour: number; minute: number }; // Maximum time (e.g., { hour: 17, minute: 30 })
  // Picker mode
  mode?: "date" | "time" | "datetime";
  is24Hour?: boolean;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  // Haptic feedback
  haptics?: boolean; // Enable/disable haptic feedback (default: true)
  // Theming: you can pass a resolved Theme or a CreateThemeInput
  theme?: Theme | CreateThemeInput;
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
  range,
  rangeValue,
  onRangeChange,
  minDate,
  maxDate,
  minAge,
  maxAge,
  minTime,
  maxTime,
  mode = "date",
  is24Hour = true,
  minuteInterval = 1,
  haptics = true,
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
  // Resolve THEME: prefer context, then create from prop, else default
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

    // Otherwise treat as CreateThemeInput
    const created = createTheme(theme as CreateThemeInput);
    return extendTheme(ctx, created);
  }, [theme, ctx]);

  const today = useMemo(() => stripTime(new Date()), []);

  const effectiveMax = useMemo(() => {
    // minAge = minimum age required (e.g., 18 means must be at least 18 years old)
    // This translates to: birth date must be at most 18 years ago (maxDate for picker)
    const ageBasedMax =
      minAge != null
        ? stripTime(addYears(new Date(), -minAge))
        : undefined;
    if (maxDate && ageBasedMax)
      return new Date(Math.min(stripTime(maxDate).getTime(), ageBasedMax.getTime()));
    return maxDate || ageBasedMax
      ? stripTime((maxDate || ageBasedMax) as Date)
      : undefined;
  }, [maxDate, minAge]);

  const effectiveMin = useMemo(() => {
    // maxAge = maximum age allowed (e.g., 65 means person can't be older than 65)
    // This translates to: birth date must be at least 65 years ago (minDate for picker)
    const ageBasedMin =
      maxAge != null ? stripTime(addYears(new Date(), -maxAge)) : undefined;
    if (minDate && ageBasedMin)
      return new Date(Math.max(stripTime(minDate).getTime(), ageBasedMin.getTime()));
    return minDate || ageBasedMin
      ? stripTime((minDate || ageBasedMin) as Date)
      : undefined;
  }, [minDate, maxAge]);

  const initialSelected = useMemo(() => {
    const base = value ?? defaultValue ?? (effectiveMax ? effectiveMax : today);
    return clampDate(stripTime(base), effectiveMin, effectiveMax);
  }, [value, defaultValue, effectiveMax, effectiveMin, today]);

  const [selected, setSelected] = useState<Date>(initialSelected);
  useEffect(() => setSelected(initialSelected), [open]);

  const [startDate, setStartDate] = useState<Date | null>(rangeValue?.start ?? null);
  const [endDate, setEndDate] = useState<Date | null>(rangeValue?.end ?? null);

  const [cursor, setCursor] = useState<Date>(
    new Date(initialSelected.getFullYear(), initialSelected.getMonth(), 1)
  );
  useEffect(() => {
    if (open)
      setCursor(
        new Date(initialSelected.getFullYear(), initialSelected.getMonth(), 1)
      );
  }, [open]);

  type ViewMode = "days" | "months" | "years" | "time";
  const [viewMode, setViewMode] = useState<ViewMode>(
    mode === "time" ? "time" : "days"
  );

  // Time state
  const [selectedHour, setSelectedHour] = useState<number>(
    initialSelected.getHours()
  );
  const [selectedMinute, setSelectedMinute] = useState<number>(
    initialSelected.getMinutes()
  );

  // Track last haptic values to prevent spam
  const lastHapticHourRef = useRef<number>(initialSelected.getHours());
  const lastHapticMinuteRef = useRef<number>(initialSelected.getMinutes());

  const translateY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState<boolean>(open);

  // Refs for scroll components - moved to top level to avoid hooks rule violation
  const yearListRef = useRef<FlatList>(null);
  const hourScrollRef = useRef<FlatList>(null);
  const minuteScrollRef = useRef<FlatList>(null);
  const ampmScrollRef = useRef<FlatList>(null);

  // Improved haptic feedback utility
  const triggerHaptic = (intensity: "light" | "medium" | "heavy" = "light") => {
    if (!haptics) return; // Skip if haptics disabled

    try {
      // Try Expo Haptics first (works for both Expo and bare RN if installed)
      try {
        const ExpoHaptics = require("expo-haptics");
        const impactStyle =
          intensity === "light"
            ? ExpoHaptics.ImpactFeedbackStyle.Light
            : intensity === "medium"
            ? ExpoHaptics.ImpactFeedbackStyle.Medium
            : ExpoHaptics.ImpactFeedbackStyle.Heavy;
        ExpoHaptics.impactAsync(impactStyle);
        return;
      } catch {
        // Expo Haptics not available, try other methods
      }

      if (Platform.OS === "ios") {
        // Try iOS HapticFeedback if available
        try {
          const { HapticFeedback } = require("react-native");
          HapticFeedback.impactAsync(
            intensity === "light"
              ? "light"
              : intensity === "medium"
              ? "medium"
              : "heavy"
          );
          return;
        } catch {
          // Don't fallback to vibration on iOS
        }
      } else if (Platform.OS === "android") {
        // Try React Native Haptic Feedback library (preferred for Android)
        try {
          const ReactNativeHapticFeedback = require("react-native-haptic-feedback");
          const options = {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          };

          const feedbackType =
            intensity === "light"
              ? "impactLight"
              : intensity === "medium"
              ? "impactMedium"
              : "impactHeavy";

          ReactNativeHapticFeedback.trigger(feedbackType, options);
          return;
        } catch {
          // Fallback to vibration for bare React Native on Android
          Vibration.vibrate(intensity === "light" ? 1 : intensity === "medium" ? 2 : 3);
        }
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  };

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

  // Auto-scroll to selected year when in year view
  useEffect(() => {
    if (viewMode === "years" && yearListRef.current && selected) {
      const currentYear = selected.getFullYear();
      // Generate same year range as renderYears
      const years: number[] = [];
      for (let y = currentYear - 60; y <= currentYear + 60; y++) years.push(y);

      const selectedYearIndex = years.findIndex((y) => y === currentYear);
      if (selectedYearIndex >= 0) {
        setTimeout(() => {
          yearListRef.current?.scrollToIndex({
            index: selectedYearIndex,
            animated: false,
            viewPosition: 0.5,
          });
        }, 50);
      }
    }
  }, [viewMode, selected]);

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

    if (range) {
      if (!startDate || (startDate && endDate)) {
        setStartDate(d);
        setEndDate(null);
        onRangeChange?.({ start: d, end: null });
      } else if (startDate && !endDate) {
        if (d > startDate) {
          setEndDate(d);
          onRangeChange?.({ start: startDate, end: d });
          onClose();
        } else {
          setStartDate(d);
          onRangeChange?.({ start: d, end: null });
        }
      }
    } else {
      let finalDate = new Date(d);

      // If we're in datetime mode or time mode, preserve/apply time
      if (mode === "datetime" || mode === "time") {
        finalDate.setHours(selectedHour);
        finalDate.setMinutes(selectedMinute);
      }

      setSelected(finalDate);

      // For date mode, close immediately. For datetime, go to time picker first
      if (mode === "date") {
        onChange?.(finalDate);
        onClose();
      } else if (mode === "datetime" && viewMode === "days") {
        setViewMode("time");
      } else {
        onChange?.(finalDate);
        onClose();
      }
    }
  };

  const handleTimeChange = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);

    let finalDate = new Date(selected);
    finalDate.setHours(hour);
    finalDate.setMinutes(minute);

    setSelected(finalDate);
    onChange?.(finalDate);

    // Don't auto-close on individual time changes
    // Only close when user explicitly taps "Done" or outside
  };

  const handleClearRange = () => {
    setStartDate(null);
    setEndDate(null);
    onRangeChange?.({ start: null, end: null });
  };
  const goPrev = () =>
    setCursor(
      viewMode === "days"
        ? addMonths(cursor, -1)
        : viewMode === "months"
        ? addYears(cursor, -1)
        : addYears(cursor, -12)
    );
  const goNext = () =>
    setCursor(
      viewMode === "days"
        ? addMonths(cursor, 1)
        : viewMode === "months"
        ? addYears(cursor, 1)
        : addYears(cursor, 12)
    );

  const renderHeader = () => {
    if (viewMode === "time") {
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
          <View style={styles.timeHeader}>
            {mode === "datetime" && (
              <TouchableOpacity
                onPress={() => setViewMode("days")}
                accessibilityRole="button"
                accessibilityLabel="Back to date"
                style={styles.backButton}
              >
                <Text style={[styles.chev, { color: THEME.colors.foreground }]}>
                  ‹
                </Text>
              </TouchableOpacity>
            )}
            <Text
              style={[
                styles.monthText,
                {
                  color: THEME.colors.foreground,
                  fontSize: THEME.fontSizes.lg,
                  textAlign: "center",
                  flex: 1,
                },
              ]}
            >
              Select Time
            </Text>
            {(mode === "datetime" || mode === "time") && (
              <TouchableOpacity
                onPress={() => {
                  const finalDate = new Date(selected);
                  finalDate.setHours(selectedHour);
                  finalDate.setMinutes(selectedMinute);
                  onChange?.(finalDate);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel="Done"
                style={styles.doneButton}
              >
                <Text style={[styles.doneText, { color: THEME.colors.accent }]}>
                  Done
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

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
          onPress={() => setViewMode("years")}
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
            onPress={() => setViewMode(viewMode === "days" ? "months" : "days")}
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
        {range && (startDate || endDate) && (
          <TouchableOpacity
            onPress={handleClearRange}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear range"
          >
            <Text style={[styles.clearButtonText, { color: THEME.colors.accent }]}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
        {mode === "datetime" && viewMode === "days" && (
          <TouchableOpacity
            onPress={() => setViewMode("time")}
            style={styles.timeToggle}
            accessibilityRole="button"
            accessibilityLabel="Select time"
          >
            <Text
              style={[styles.timeToggleText, { color: THEME.colors.accent }]}
            >
              {String(selectedHour).padStart(2, "0")}:
              {String(selectedMinute).padStart(2, "0")}
              {!is24Hour && (selectedHour >= 12 ? " PM" : " AM")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderDays = () => {
    const isDateInRange = (date: Date) => {
      if (!startDate || !endDate) return false;
      const time = date.getTime();
      return time > startDate.getTime() && time < endDate.getTime();
    };

    return (
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
              const isCurrent = !range && isSameDay(cell.date, selected as Date);
              const isToday = isSameDay(cell.date, today);
              const isStartDate = range && startDate && isSameDay(cell.date, startDate);
              const isEndDate = range && endDate && isSameDay(cell.date, endDate);
              const inRange = range && isDateInRange(cell.date);

              const dayStyles: ViewStyle = {
                borderRadius: THEME.radii.full,
                borderWidth: isToday && !isCurrent ? 1 : 0,
                borderColor: THEME.colors.accent,
                backgroundColor: isCurrent || isStartDate || isEndDate ? THEME.colors.accent : inRange ? withAlpha(THEME.colors.accent, 0.2) : "transparent",
              };
              const txtStyles: TextStyle = {
                color: isCurrent || isStartDate || isEndDate
                  ? THEME.colors.onAccent
                  : disabled
                  ? THEME.colors.disabledForeground
                  : inRange
                  ? THEME.colors.accent
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
  };

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
                  setViewMode("days");
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
    const currentYear = (selected as Date).getFullYear();
    const years: number[] = [];
    // Center the year range around the selected year instead of cursor year
    for (let y = currentYear - 60; y <= currentYear + 60; y++) years.push(y);

    const selectedYearIndex = years.findIndex((y) => y === currentYear);
    const scrollIndex = selectedYearIndex !== -1 ? selectedYearIndex : 60;

    const item = ({ item: y }: { item: number }) => {
      const inRange =
        between(new Date(y, 0, 1), effectiveMin, effectiveMax) ||
        between(new Date(y, 11, 31), effectiveMin, effectiveMax);
      const isCurrent = y === (selected as Date).getFullYear();
      return (
        <TouchableOpacity
          disabled={!inRange}
          onPress={() => {
            triggerHaptic("medium");
            setCursor(new Date(y, cursor.getMonth(), 1));
            setViewMode("months");
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
      <View style={{ maxHeight: 320, paddingVertical: 20 }}>
        <FlatList
          ref={yearListRef}
          data={years}
          keyExtractor={(y: number) => String(y)}
          getItemLayout={(_, index: number) => ({
            length: 44,
            offset: 44 * index,
            index,
          })}
          renderItem={item}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 20 }}
          onScrollToIndexFailed={(info) => {
            // Handle scroll failure gracefully
            const safeIndex = Math.min(
              Math.max(0, info.index),
              years.length - 1
            );
            setTimeout(() => {
              yearListRef.current?.scrollToIndex({
                index: safeIndex,
                animated: false,
                viewPosition: 0.5,
              });
            }, 50);
          }}
        />
      </View>
    );
  };

  const renderTimePicker = () => {
    // Helper to check if a time is within min/max constraints
    const isTimeValid = (hour: number, minute: number) => {
      if (!minTime && !maxTime) return true;

      const timeInMinutes = hour * 60 + minute;

      if (minTime) {
        const minInMinutes = minTime.hour * 60 + minTime.minute;
        if (timeInMinutes < minInMinutes) return false;
      }

      if (maxTime) {
        const maxInMinutes = maxTime.hour * 60 + maxTime.minute;
        if (timeInMinutes > maxInMinutes) return false;
      }

      return true;
    };

    const hours = is24Hour
      ? Array.from({ length: 24 }, (_, i) => i)
      : Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    const minutes = Array.from(
      { length: 60 / minuteInterval },
      (_, i) => i * minuteInterval
    );

    const ITEM_HEIGHT = 60;

    // Calculate initial scroll positions
    const getHourScrollIndex = () => {
      if (is24Hour) {
        return selectedHour;
      } else {
        // Convert 24-hour to 12-hour display (0->12, 13->1, etc.)
        let displayHour = selectedHour % 12;
        if (displayHour === 0) displayHour = 12;
        // hours array is [1, 2, 3, ..., 12], so index is displayHour - 1
        return displayHour - 1;
      }
    };

    const getMinuteScrollIndex = () => {
      return minutes.findIndex((m) => m === selectedMinute);
    };

    // Handle scroll-based selection for hours
    const handleHourScroll = (event: any) => {
      const { contentOffset } = event.nativeEvent;
      const index = Math.round(contentOffset.y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, hours.length - 1));
      const selectedHourValue = hours[clampedIndex]; // 1-12 or 0-23

      let actualHour;
      if (is24Hour) {
        actualHour = selectedHourValue;
      } else {
        // Convert 12-hour display to 24-hour based on current AM/PM period
        // selectedHourValue is 1-12
        const currentlyPM = selectedHour >= 12;
        if (selectedHourValue === 12) {
          // 12 AM = 0, 12 PM = 12
          actualHour = currentlyPM ? 12 : 0;
        } else {
          // 1-11 AM = 1-11, 1-11 PM = 13-23
          actualHour = currentlyPM ? selectedHourValue + 12 : selectedHourValue;
        }
      }

      // Check if time is valid before updating
      if (!isTimeValid(actualHour, selectedMinute)) {
        return;
      }

      // Only update if the value actually changed
      if (actualHour !== selectedHour) {
        // Trigger subtle haptic on every item change
        if (actualHour !== lastHapticHourRef.current) {
          lastHapticHourRef.current = actualHour;
          triggerHaptic("light");
        }

        // Update immediately without debouncing
        setSelectedHour(actualHour);
        setSelected((prev) => {
          const newDate = new Date(prev);
          newDate.setHours(actualHour);
          return newDate;
        });
      }
    };

    // Handle scroll-based selection for minutes
    const handleMinuteScroll = (event: any) => {
      const { contentOffset } = event.nativeEvent;
      const index = Math.round(contentOffset.y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, minutes.length - 1));
      const selectedMinuteValue = minutes[clampedIndex];

      // Check if time is valid before updating
      if (!isTimeValid(selectedHour, selectedMinuteValue)) {
        return;
      }

      // Only update if the value actually changed
      if (selectedMinuteValue !== selectedMinute) {
        // Trigger subtle haptic on every item change
        if (selectedMinuteValue !== lastHapticMinuteRef.current) {
          lastHapticMinuteRef.current = selectedMinuteValue;
          triggerHaptic("light");
        }

        // Update immediately without debouncing
        setSelectedMinute(selectedMinuteValue);
        setSelected((prev) => {
          const newDate = new Date(prev);
          newDate.setMinutes(selectedMinuteValue);
          return newDate;
        });
      }
    };

    const renderTimeItem = (
      value: number,
      isSelected: boolean,
      isDisabled: boolean
    ) => {
      return (
        <View style={[styles.timeItem, { height: ITEM_HEIGHT }]}>
          <Text
            style={{
              color: isDisabled
                ? THEME.colors.disabledForeground
                : isSelected
                ? THEME.colors.foreground
                : THEME.colors.mutedForeground,
              fontSize: isSelected ? 32 : 20,
              fontWeight: isSelected ? "700" : "400",
              opacity: isDisabled ? 0.2 : isSelected ? 1 : 0.4,
              textDecorationLine: isDisabled ? "line-through" : "none",
            }}
          >
            {String(value).padStart(2, "0")}
          </Text>
        </View>
      );
    };

    const hourItems = ({
      item: hour,
      index,
    }: {
      item: number;
      index: number;
    }) => {
      const currentIndex = getHourScrollIndex();
      const actualHour = is24Hour
        ? hour
        : hour === 12
        ? selectedHour >= 12
          ? 12
          : 0
        : selectedHour >= 12
        ? hour + 12
        : hour;
      const isDisabled = !isTimeValid(actualHour, selectedMinute);
      return renderTimeItem(hour, index === currentIndex, isDisabled);
    };

    const minuteItems = ({
      item: minute,
      index,
    }: {
      item: number;
      index: number;
    }) => {
      const currentIndex = getMinuteScrollIndex();
      const isDisabled = !isTimeValid(selectedHour, minute);
      return renderTimeItem(minute, index === currentIndex, isDisabled);
    };

    // Handle AM/PM scroll
    const handleAmPmScroll = (event: any) => {
      const { contentOffset } = event.nativeEvent;
      const index = Math.round(contentOffset.y / ITEM_HEIGHT);
      const isPM = index === 1;

      const newHour = isPM
        ? selectedHour < 12 ? selectedHour + 12 : selectedHour
        : selectedHour >= 12 ? selectedHour - 12 : selectedHour;

      if (newHour !== selectedHour) {
        setSelectedHour(newHour);
        setSelected((prev) => {
          const newDate = new Date(prev);
          newDate.setHours(newHour);
          return newDate;
        });
        triggerHaptic("light");
      }
    };

    const ampmData = ["AM", "PM"];
    const renderAmPmItem = ({ item, index }: { item: string; index: number }) => {
      const isSelected = (selectedHour < 12 && index === 0) || (selectedHour >= 12 && index === 1);
      return (
        <View style={[styles.timeItem, { height: ITEM_HEIGHT }]}>
          <Text
            style={{
              color: isSelected ? THEME.colors.foreground : THEME.colors.mutedForeground,
              fontSize: isSelected ? 24 : 16,
              fontWeight: isSelected ? "700" : "400",
              opacity: isSelected ? 1 : 0.4,
            }}
          >
            {item}
          </Text>
        </View>
      );
    };

    return (
      <View style={styles.timePickerContainer}>
        {/* Subtle background highlight for selected item area */}
        <View style={styles.timeSelectionIndicator} pointerEvents="none">
          <View
            style={[
              styles.selectionBox,
              {
                backgroundColor: withAlpha(THEME.colors.accent, 0.05),
                borderRadius: ITEM_HEIGHT / 2,
                height: ITEM_HEIGHT,
              },
            ]}
          />
        </View>

        <View style={styles.timeColumn}>
          <FlatList
            ref={hourScrollRef}
            data={hours}
            keyExtractor={(hour) => String(hour)}
            renderItem={hourItems}
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            style={styles.timeList}
            snapToInterval={ITEM_HEIGHT}
            snapToAlignment="center"
            decelerationRate="fast"
            onScroll={handleHourScroll}
            onScrollEndDrag={handleHourScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
            initialScrollIndex={getHourScrollIndex()}
            removeClippedSubviews={false}
            nestedScrollEnabled={true}
          />
        </View>

        <View style={styles.timeSeparator}>
          <Text
            style={[
              styles.timeSeparatorText,
              { color: THEME.colors.foreground },
            ]}
          >
            :
          </Text>
        </View>

        <View style={styles.timeColumn}>
          <FlatList
            ref={minuteScrollRef}
            data={minutes}
            keyExtractor={(minute) => String(minute)}
            renderItem={minuteItems}
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            style={styles.timeList}
            snapToInterval={ITEM_HEIGHT}
            snapToAlignment="center"
            decelerationRate="fast"
            onScroll={handleMinuteScroll}
            onScrollEndDrag={handleMinuteScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
            initialScrollIndex={getMinuteScrollIndex()}
            removeClippedSubviews={false}
            nestedScrollEnabled={true}
          />
        </View>

        {/* AM/PM scroll wheel on the right */}
        {!is24Hour && (
          <View style={styles.ampmColumn}>
            <FlatList
              ref={ampmScrollRef}
              data={ampmData}
              keyExtractor={(item) => item}
              renderItem={renderAmPmItem}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              style={styles.ampmList}
              snapToInterval={ITEM_HEIGHT}
              snapToAlignment="center"
              decelerationRate="fast"
              onScroll={handleAmPmScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
              initialScrollIndex={selectedHour < 12 ? 0 : 1}
              removeClippedSubviews={false}
              nestedScrollEnabled={true}
            />
          </View>
        )}
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
          {viewMode === "days" && renderDays()}
          {viewMode === "months" && renderMonths()}
          {viewMode === "years" && (
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
          {viewMode === "time" && (
            <View
              style={{
                paddingHorizontal: THEME.space.md,
                paddingBottom: THEME.space.md,
                flex: 1,
              }}
            >
              {renderTimePicker()}
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
  // Time picker styles
  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  timeToggle: {
    alignItems: "center",
    paddingVertical: 8,
  },
  timeToggleText: {
    fontSize: 16,
    fontWeight: "500",
  },
  clearButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  timePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    height: 300,
    position: "relative",
  },
  timeColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  timeList: {
    height: 300,
    flex: 1,
  },
  timeItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  timeSeparator: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    marginHorizontal: 8,
  },
  timeSeparatorText: {
    fontSize: 36,
    fontWeight: "200",
  },
  ampmColumn: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginRight: 16,
  },
  ampmList: {
    height: 300,
    width: 60,
  },
  ampmContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  ampmContainerBottom: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  ampmButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 100,
    alignItems: "center",
  },
  timeSelectionIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
    pointerEvents: "none",
  },
  selectionBox: {
    width: "80%",
  },
});

export default ModernDatePicker;
