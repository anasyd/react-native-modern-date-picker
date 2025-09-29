# @anasyd/react-native-modern-date-picker

Modern, fully-featured date and time picker for React Native & Expo with scroll-wheel time selection, age restrictions, time ranges, and custom theming.

## Install

```sh
npm install @anasyd/react-native-modern-date-picker
```

Optional blur libs if you want a blur backdrop:

```sh
# Expo
npm install expo-blur

# Bare RN
npm install @react-native-community/blur
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release notes.

---

## Quick Start

```tsx
import ModernDatePicker from "@anasyd/react-native-modern-date-picker";

<ModernDatePicker
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
/>;
```

---

## Features

- 📅 **Date Picker** - Month view calendar with year/month selection
- ⏰ **Time Picker** - iOS-style scroll wheels for hours, minutes, and AM/PM
- 🔀 **Multiple Modes** - Date, time, or datetime combined
- 👤 **Age Restrictions** - `minAge` and `maxAge` props (e.g., 18+ only)
- ⏱️ **Time Ranges** - `minTime` and `maxTime` for business hours, etc.
- 📱 **Haptic Feedback** - Smart haptic feedback on iOS/Android
- 🎨 **Full Theming** - Semantic color tokens, palette system, dark/light presets
- 🌍 **Internationalization** - Locale support for dates and first day of week
- 🧪 **TypeScript** - Full type safety
- ⚡ **Lightweight** - No heavy dependencies

---

## Picker Modes

### Date Mode

Traditional calendar picker for selecting dates.

```tsx
<ModernDatePicker
  mode="date"
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  minDate={new Date(2020, 0, 1)}
  maxDate={new Date()}
/>
```

### Time Mode

Scrollable time picker with hour/minute wheels. Supports 12/24 hour formats.

```tsx
<ModernDatePicker
  mode="time"
  is24Hour={false}
  minuteInterval={15}
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  minTime={{ hour: 9, minute: 0 }}  // 9:00 AM
  maxTime={{ hour: 17, minute: 0 }} // 5:00 PM
/>
```

### DateTime Mode

Combined date and time selection. Pick date first, then switch to time.

```tsx
<ModernDatePicker
  mode="datetime"
  is24Hour={false}
  minuteInterval={15}
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
/>
```

---

## Date & Time Constraints

### Age Restrictions

Use `minAge` and `maxAge` to restrict birth date selection:

```tsx
// Only allow ages 18-65
<ModernDatePicker
  mode="date"
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  minAge={18}  // Must be at least 18 years old
  maxAge={65}  // Cannot be older than 65
/>
```

### Date Range

Use `minDate` and `maxDate` for custom date ranges:

```tsx
<ModernDatePicker
  mode="date"
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  minDate={new Date(2020, 0, 1)}
  maxDate={new Date()}  // Today
/>
```

### Time Range

Use `minTime` and `maxTime` to restrict time selection (e.g., business hours):

```tsx
<ModernDatePicker
  mode="time"
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  minTime={{ hour: 9, minute: 0 }}   // 9:00 AM
  maxTime={{ hour: 17, minute: 30 }} // 5:30 PM
/>
```

Invalid times are visually disabled (crossed out with low opacity) and cannot be selected.

---

## Theming

You can theme in **two ways**:

### A) App-wide (recommended): `ThemeProvider` + `createTheme`

```tsx
import {
  ThemeProvider,
  createTheme,
} from "@anasyd/react-native-modern-date-picker";

const theme = createTheme({
  preset: "light", // "light" | "dark"
  palette: {
    primary: "#ffffff",   // surfaces/background
    secondary: "#000000", // text/icons
    accent: "#2563eb",    // selection highlight
  },
  // optional fine tuning:
  // overrides: { colors: { divider: "#eaeaea" }, radii: { md: 14 } }
});

<ThemeProvider value={theme}>
  <ModernDatePicker
    open={open}
    onClose={() => setOpen(false)}
    value={value}
    onChange={setValue}
  />
</ThemeProvider>;
```

### B) One-off: pass a theme **input** on the component

Useful for quick demos or if you don't want a provider.

```tsx
<ModernDatePicker
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  theme={{
    preset: "dark",
    palette: {
      primary: "#1f2937",
      secondary: "#ffffff",
      accent: "#f59e0b",
    },
  }}
/>
```

### Palette to Semantic Token Mapping

When you define a theme with `createTheme({ preset, palette })`, the palette colors map to semantic tokens:

| Palette Property | Maps To Semantic Token | Purpose                              |
| ---------------- | ---------------------- | ------------------------------------ |
| `primary`        | `background`, `surface`, `header` | Surfaces and backgrounds  |
| `secondary`      | `foreground`, `mutedForeground` | Text and icon colors         |
| `accent`         | `accent`, `onAccent`   | Selection highlights and their text  |

### Semantic color tokens

| Token                | Purpose                        |
| -------------------- | ------------------------------ |
| `background`         | Main sheet background          |
| `surface`            | Calendar body surface          |
| `header`             | Header surface                 |
| `foreground`         | Primary text color on surfaces |
| `mutedForeground`    | Subdued text                   |
| `border`             | Border color                   |
| `divider`            | Hairline dividers              |
| `accent`             | Selection chip background      |
| `onAccent`           | Text on top of `accent`        |
| `disabledForeground` | Disabled text                  |

`createTheme({ preset, palette, overrides })` computes these tokens for you and **auto-contrasts** text (WCAG-ish 4.5) to avoid unreadable combos.

---

## Backdrop

### Custom Blur Backdrop (Expo)

```tsx
import { BlurView } from "expo-blur";
import { Animated, StyleSheet, Platform } from "react-native";

<ModernDatePicker
  open={open}
  onClose={onClose}
  renderBackdrop={(opacity) => (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <BlurView
        intensity={12}
        tint="dark"
        experimentalBlurMethod={
          Platform.OS === "android" ? "dimezisBlurView" : undefined
        }
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  )}
/>;
```

### Custom Blur Backdrop (Bare RN)

```tsx
import { BlurView } from "@react-native-community/blur";
import { Animated, StyleSheet } from "react-native";

<ModernDatePicker
  open={open}
  onClose={onClose}
  renderBackdrop={(opacity) => (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <BlurView
        blurType="dark"
        blurAmount={12}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  )}
/>;
```

### Backdrop Props

- `renderBackdrop(opacity)` – custom backdrop node.
- `showDefaultBackdrop` (default `true`) – toggle built-in dim.
- `backdropColor` (default `#000`) – dim overlay color.

---

## Props

| Prop                  | Type                                           | Default  | Description                                                   |
| --------------------- | ---------------------------------------------- | -------- | ------------------------------------------------------------- |
| `open`                | `boolean`                                      | —        | Show/hide the picker.                                         |
| `onClose`             | `() => void`                                   | —        | Called when the picker requests to close.                     |
| `value`               | `Date \| null`                                 | —        | Selected date (controlled).                                   |
| `defaultValue`        | `Date`                                         | —        | Default date (uncontrolled).                                  |
| `onChange`            | `(date: Date) => void`                         | —        | Fired on selection.                                           |
| **Date Constraints**  |                                                |          |                                                               |
| `minDate`             | `Date`                                         | —        | Minimum selectable date.                                      |
| `maxDate`             | `Date`                                         | —        | Maximum selectable date.                                      |
| `minAge`              | `number`                                       | —        | Minimum age in years (e.g., `18` for adults only).            |
| `maxAge`              | `number`                                       | —        | Maximum age in years (e.g., `65`).                            |
| **Time Constraints**  |                                                |          |                                                               |
| `minTime`             | `{ hour: number; minute: number }`             | —        | Minimum time (e.g., `{ hour: 9, minute: 0 }` for 9:00 AM).   |
| `maxTime`             | `{ hour: number; minute: number }`             | —        | Maximum time (e.g., `{ hour: 17, minute: 0 }` for 5:00 PM).  |
| **Picker Mode**       |                                                |          |                                                               |
| `mode`                | `'date' \| 'time' \| 'datetime'`               | `'date'` | Picker mode: date only, time only, or both.                   |
| `is24Hour`            | `boolean`                                      | `true`   | Use 24-hour format for time picker.                           |
| `minuteInterval`      | `1\|2\|3\|4\|5\|6\|10\|12\|15\|20\|30`         | `1`      | Minute interval for time picker.                              |
| **Theming**           |                                                |          |                                                               |
| `theme`               | `Theme \| CreateThemeInput`                    | —        | Provide a full theme or palette input. Uses provider/default. |
| **Localization**      |                                                |          |                                                               |
| `locale`              | `string`                                       | platform | Locale (e.g., `"en-US"`).                                     |
| `firstDayOfWeek`      | `0…6`                                          | `0`      | 0=Sun, 1=Mon, …                                               |
| **Other**             |                                                |          |                                                               |
| `testID`              | `string`                                       | —        | Test identifier.                                              |
| `style`               | `StyleProp<ViewStyle>`                         | —        | Container style.                                              |
| `animationSpeed`      | `number`                                       | `220`    | Show/hide animation speed (ms).                               |
| `renderBackdrop`      | `(opacity: Animated.Value) => React.ReactNode` | —        | Custom backdrop.                                              |
| `showDefaultBackdrop` | `boolean`                                      | `true`   | Show built-in dim overlay.                                    |
| `backdropColor`       | `string`                                       | `#000`   | Color for built-in dim overlay.                               |

---

## Haptic Feedback

The picker automatically provides haptic feedback on:

- Year scroll interactions (medium intensity)
- Time picker scroll selections (light intensity)
- AM/PM scroll changes (light intensity)

### Platform Support

**iOS**:
- Uses Expo Haptics if available with proper intensity levels
- Falls back to native iOS HapticFeedback
- Last resort: Minimal vibration (5ms)

**Android**:
- Uses `react-native-haptic-feedback` if available for native haptic effects
- Falls back to native Android haptic feedback
- Last resort: Minimal vibration (3ms)

### Optional Enhanced Haptics

For the best haptic experience, you can optionally install:

```bash
npm install react-native-haptic-feedback
# For React Native 0.60+, run:
cd ios && pod install
```

This provides native haptic effects like `impactLight`, `impactMedium`, and `impactHeavy` on both platforms.

**Key Features:**

- ✅ **Smart triggering**: Only on actual value changes, not every scroll event
- ✅ **Proper haptics**: Uses native haptic APIs, not loud vibration
- ✅ **Graceful fallbacks**: Works on all devices with appropriate intensity
- ✅ **No spam**: Prevents excessive haptic feedback during scrolling

---

## Exports

```ts
import ModernDatePicker, {
  createTheme,
  extendTheme,
  ThemeProvider,
  useTheme,
} from "@anasyd/react-native-modern-date-picker";
```

- `createTheme(input)` → builds a WCAG-safe theme from `preset` + `palette` (+ optional `overrides`).
- `extendTheme(base, overrides)` → convenient theme layering (e.g., tweak accent for a section).
- `ThemeProvider` / `useTheme()` → share theme via context (global or nested).
- `ModernDatePicker` → the component.

---

## License

MIT