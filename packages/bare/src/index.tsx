import React, { useEffect, useRef, useState } from "react";
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
import { BlurView } from "./BlurView";

export type Theme = {
  colors?: {
    background?: string;
    surface?: string;
    headerBackgroundColor?: string;
    bodyBackgroundColor?: string;
    text?: string;
    mutedText?: string;
    selectedBackground?: string;
    selectedText?: string;
    todayBorder?: string;
    disabledText?: string;
    divider?: string;
  };
  radius?: number;
  topRadius?: number;
  selectedDateRadius?: number;
  selectedMonthRadius?: number;
  selectedYearRadius?: number;
  preset?: "dark" | "light";
  primary?: string;
  secondary?: string;
  shadow?: boolean;
  typography?: { title?: number; label?: number; day?: number };
  spacing?: { gutter?: number; header?: number; gridGap?: number };
};

export type ModernDatePickerProps = {
  open: boolean;
  onClose: () => void;
  value?: Date | null;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  ageLimitYears?: number;
  theme?: Theme;
  locale?: string;
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  blurAmount?: number;
  animationSpeed?: number;
};

const DEFAULT_THEME: Theme = {
  colors: {
    background: "#0f1115",
    surface: "#171923",
    headerBackgroundColor: "#171923",
    bodyBackgroundColor: "#171923",
    text: "#e5e7eb",
    mutedText: "#9ca3af",
    selectedBackground: "#2563eb",
    selectedText: "#ffffff",
    todayBorder: "#2563eb",
    disabledText: "#6b7280",
    divider: "#232735",
  },
  shadow: true,
  topRadius: 20,
  selectedMonthRadius: 8,
  selectedYearRadius: 8,
  typography: { title: 18, label: 13, day: 15 },
  spacing: { gutter: 16, header: 12, gridGap: 6 },
};

const BW_COLORS = {
  background: "#000000",
  surface: "#000000",
  headerBackgroundColor: "#000000",
  bodyBackgroundColor: "#000000",
  text: "#FFFFFF",
  mutedText: "#CCCCCC",
  selectedBackground: "#FFFFFF",
  selectedText: "#000000",
  todayBorder: "#FFFFFF",
  disabledText: "#777777",
  divider: "#444444",
} as Required<NonNullable<Theme["colors"]>>;

const LIGHT_COLORS = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  headerBackgroundColor: "#FFFFFF",
  bodyBackgroundColor: "#FFFFFF",
  text: "#111827",
  mutedText: "#6B7280",
  selectedBackground: "#111827",
  selectedText: "#FFFFFF",
  todayBorder: "#111827",
  disabledText: "#9CA3AF",
  divider: "#E5E7EB",
} as Required<NonNullable<Theme["colors"]>>;

export const DefaultThemes = {
  dark: BW_COLORS,
  light: LIGHT_COLORS,
};

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

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
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }
  const matrix: { date: Date; inMonth: boolean }[][] = [];
  for (let r = 0; r < cells.length; r += 7) matrix.push(cells.slice(r, r + 7));
  return matrix;
}

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
  blurAmount = 5,
  animationSpeed = 220,
}) => {
  const BODY_HEIGHT = 360;
  const THEME = React.useMemo(() => {
    const basePalette = theme?.preset
      ? theme.preset === "light"
        ? LIGHT_COLORS
        : BW_COLORS
      : theme?.colors
      ? undefined
      : BW_COLORS;
    const base: Theme = basePalette
      ? { ...DEFAULT_THEME, colors: basePalette }
      : DEFAULT_THEME;
    const merged = deepMerge(base as any, theme || {}) as Theme;
    if (merged.primary) {
      merged.colors = merged.colors || {};
      merged.colors.selectedBackground = merged.primary;
      merged.colors.todayBorder = merged.primary;
    }
    if (merged.secondary) {
      merged.colors = merged.colors || {};
      merged.colors.headerBackgroundColor = merged.secondary;
      merged.colors.surface = merged.secondary;
    }
    if (merged.radius != null) {
      merged.topRadius = merged.topRadius ?? merged.radius;
      merged.selectedDateRadius =
        merged.selectedDateRadius !== undefined
          ? merged.selectedDateRadius
          : merged.radius;
      merged.selectedMonthRadius = merged.selectedMonthRadius ?? merged.radius;
      merged.selectedYearRadius = merged.selectedYearRadius ?? merged.radius;
    }
    return merged as any;
  }, [theme]);
  const today = React.useMemo(() => stripTime(new Date()), []);
  const effectiveMax = React.useMemo(() => {
    const ageMax =
      ageLimitYears != null
        ? stripTime(addYears(new Date(), -ageLimitYears))
        : undefined;
    if (maxDate && ageMax)
      return new Date(min(stripTime(maxDate).getTime(), ageMax.getTime()));
    return maxDate || ageMax
      ? stripTime((maxDate || ageMax) as Date)
      : undefined;
    function min(a: number, b: number) {
      return a < b ? a : b;
    }
  }, [maxDate, ageLimitYears]);
  const effectiveMin = React.useMemo(
    () => (minDate ? stripTime(minDate) : undefined),
    [minDate]
  );

  const initialSelected = React.useMemo(() => {
    const base = value ?? defaultValue ?? (effectiveMax ? effectiveMax : today);
    return clampDate(stripTime(base), effectiveMin, effectiveMax);
  }, [value, defaultValue, effectiveMax, effectiveMin, today]);

  const [selected, setSelected] = useState<Date>(initialSelected);
  useEffect(() => {
    setSelected(initialSelected);
  }, [open]);
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
  const blurOpacity = useRef(new Animated.Value(0)).current;
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
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 220,
          mass: 0.7,
        }),
        Animated.timing(blurOpacity, {
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
        Animated.timing(blurOpacity, {
          toValue: 0,
          duration: Math.max(120, animationSpeed * 0.8),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [open, animationSpeed]);

  const monthNames = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale || undefined, { month: "long" });
    return Array.from({ length: 12 }, (_, m) =>
      fmt.format(new Date(2020, m, 1))
    );
  }, [locale]);
  const weekdayShort = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale || undefined, {
      weekday: "short",
    });
    return DAYS.map((d) => fmt.format(new Date(2020, 10, d + 1)));
  }, [locale]);
  const orderedWeekdays = React.useMemo(() => {
    const arr = weekdayShort.slice();
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(arr.shift()!);
    return arr;
  }, [weekdayShort, firstDayOfWeek]);

  const handleSelect = (d: Date) => {
    if (!between(d, effectiveMin, effectiveMax)) return;
    setSelected(d);
    onChange?.(d);
    onClose();
  };
  const goPrev = () => {
    if (mode === "days") setCursor(addMonths(cursor, -1));
    else if (mode === "months") setCursor(addYears(cursor, -1));
    else setCursor(addYears(cursor, -12));
  };
  const goNext = () => {
    if (mode === "days") setCursor(addMonths(cursor, 1));
    else if (mode === "months") setCursor(addYears(cursor, 1));
    else setCursor(addYears(cursor, 12));
  };

  const renderHeader = () => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthLabel = monthNames[month];
    return (
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: THEME.spacing.gutter,
            paddingTop: THEME.spacing.header,
            backgroundColor: THEME.colors.headerBackgroundColor,
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
                color: THEME.colors.mutedText,
                fontSize: THEME.typography.label,
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
            <Text style={[styles.chev, { color: THEME.colors.text }]}>‹</Text>
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
                { color: THEME.colors.text, fontSize: THEME.typography.title },
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
            <Text style={[styles.chev, { color: THEME.colors.text }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const matrix = React.useMemo(
    () =>
      getMonthMatrix(cursor.getFullYear(), cursor.getMonth(), firstDayOfWeek),
    [cursor, firstDayOfWeek]
  );

  const renderDays = () => (
    <View
      style={{
        paddingHorizontal: THEME.spacing.gutter,
        paddingBottom: THEME.spacing.gutter,
      }}
    >
      <View style={styles.weekRow}>
        {orderedWeekdays.map((w: string, i: number) => (
          <Text
            key={i}
            style={[styles.weekLabel, { color: THEME.colors.mutedText }]}
          >
            {w}
          </Text>
        ))}
      </View>
      {matrix.map((row: { date: Date; inMonth: boolean }[], r: number) => (
        <View key={r} style={styles.weekRow}>
          {row.map((cell: { date: Date; inMonth: boolean }, c: number) => {
            const disabled =
              !between(cell.date, effectiveMin, effectiveMax) || !cell.inMonth;
            const selected = isSameDay(cell.date, initialSelected as Date);
            const isToday = isSameDay(cell.date, today);
            const selectedRadius = THEME.selectedDateRadius;
            const computedRadius = selected
              ? selectedRadius === undefined
                ? 9999
                : selectedRadius
              : 8;
            const dayStyles: ViewStyle = {
              borderRadius: computedRadius,
              borderWidth: isToday && !selected ? 1 : 0,
              borderColor: THEME.colors.todayBorder,
              backgroundColor: selected
                ? THEME.colors.selectedBackground
                : "transparent",
            } as any;
            const txtStyles: TextStyle = {
              color: selected
                ? THEME.colors.selectedText
                : disabled
                ? THEME.colors.disabledText
                : THEME.colors.text,
            };
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.dayCell,
                  { paddingVertical: THEME.spacing.gridGap / 1.5 },
                ]}
                disabled={disabled}
                onPress={() => handleSelect(stripTime(cell.date))}
                accessibilityRole="button"
                accessibilityLabel={`Select ${cell.date.toDateString()}`}
              >
                <View style={[styles.dayPill, dayStyles]}>
                  <Text
                    style={[
                      styles.dayText,
                      txtStyles,
                      { fontSize: THEME.typography.day },
                    ]}
                  >
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
          paddingHorizontal: THEME.spacing.gutter,
          paddingBottom: THEME.spacing.gutter,
        }}
      >
        <View style={styles.monthGrid}>
          {months.map((m: { name: string; idx: number }) => {
            const base = new Date(cursor.getFullYear(), m.idx, 1);
            const daysInMonth = new Date(
              base.getFullYear(),
              base.getMonth() + 1,
              0
            ).getDate();
            const selectable = Array.from(
              { length: daysInMonth },
              (_: unknown, i: number) =>
                new Date(base.getFullYear(), base.getMonth(), i + 1)
            ).some((d: Date) => between(d, effectiveMin, effectiveMax));
            const isCurrent =
              m.idx === (initialSelected as Date).getMonth() &&
              cursor.getFullYear() === (initialSelected as Date).getFullYear();
            return (
              <TouchableOpacity
                key={m.idx}
                style={[styles.monthCell, { borderRadius: 8 }]}
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
                        ? THEME.colors.selectedBackground
                        : THEME.colors.surface,
                      borderRadius: isCurrent
                        ? THEME.selectedMonthRadius ?? 8
                        : 8,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isCurrent
                        ? THEME.colors.selectedText
                        : THEME.colors.text,
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
      const isCurrent = y === (initialSelected as Date).getFullYear();
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
              backgroundColor: isCurrent
                ? THEME.colors.selectedBackground
                : "transparent",
              borderRadius: isCurrent ? THEME.selectedYearRadius ?? 8 : 8,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open year ${y}`}
        >
          <Text
            style={{
              color: isCurrent
                ? THEME.colors.selectedText
                : inRange
                ? THEME.colors.text
                : THEME.colors.disabledText,
              fontSize: THEME.typography.day,
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
          getItemLayout={(_: unknown, index: number) => ({
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
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: blurOpacity }]}
        >
          <BlurView
            blurAmount={blurAmount}
            blurType={"dark"}
            style={StyleSheet.absoluteFill}
            reducedTransparencyFallbackColor="black"
          />
        </Animated.View>
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
            backgroundColor: THEME.colors.background,
            borderTopLeftRadius: THEME.topRadius ?? 20,
            borderTopRightRadius: THEME.topRadius ?? 20,
            overflow: "hidden",
            ...(THEME.shadow ? shadowStyle : {}),
          },
          style,
          { opacity },
        ]}
      >
        {renderHeader()}
        <View
          style={[styles.divider, { backgroundColor: THEME.colors.divider }]}
        />
        <View
          style={{
            backgroundColor: THEME.colors.bodyBackgroundColor,
            height: 360,
          }}
        >
          {mode === "days" && renderDays()}
          {mode === "months" && renderMonths()}
          {mode === "years" && (
            <View
              style={{
                paddingHorizontal: THEME.spacing.gutter,
                paddingBottom: THEME.spacing.gutter,
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

function deepMerge<T>(base: T, patch: Partial<T>): T {
  if (!patch) return base as T;
  const out: any = Array.isArray(base)
    ? [...(base as any)]
    : { ...(base as any) };
  for (const k in patch) {
    const v: any = (patch as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v))
      out[k] = deepMerge((out as any)[k] ?? {}, v);
    else if (v !== undefined) out[k] = v;
  }
  return out as T;
}

const shadowStyle: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  android: { elevation: 18 },
  default: {},
}) as unknown as ViewStyle;

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
