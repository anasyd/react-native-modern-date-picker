# @anasyd/react-native-modern-date-picker

Unified modern date picker for React Native & Expo. Internal blur removed; inject any backdrop (blur, gradient, image) using `renderBackdrop(opacity)`. A dim overlay is provided by default (can be disabled or replaced).

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

## Theming (New)

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
    primary: "#f4f2f2", // surfaces/background
    secondary: "#000000", // text/icons
    accent: "#2563eb", // selection highlight
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

Useful for quick demos or if you don’t want a provider.

```tsx
<ModernDatePicker
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  theme={{
    preset: "light",
    palette: {
      primary: "#f4f2f2",
      secondary: "#000000",
      accent: "#2563eb",
    },
    // overrides: { colors: { divider: "#eaeaea" } }
  }}
/>
```

### Semantic color tokens (what the component uses internally)

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

> Tip: If your surfaces are light (like `#f4f2f2`), use `preset: "light"`; if they’re dark, use `"dark"`.

---

## Theming (Legacy – still supported)

You can still pass the older `theme` object with `primary`/`secondary` and/or an explicit `colors` map. Explicit colors always win and no auto-contrast is applied to those keys.

```tsx
<ModernDatePicker
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  theme={{
    primary: "#f4f2f2",
    secondary: "#000000",
    colors: {
      background: "#f4f2f2",
      surface: "#f4f2f2",
      headerBackgroundColor: "#f4f2f2",
      bodyBackgroundColor: "#f4f2f2",
      text: "#000000",
      mutedText: "#555555",
      divider: "#e0e0e0",
      selectedBackground: "#000000",
      selectedText: "#ffffff",
      todayBorder: "#000000",
      disabledText: "#999999",
    },
    autoContrast: false, // trust explicit values
    selectionFlip: false,
  }}
/>
```

**Migration note:** The new API is simpler and safer. Prefer `createTheme({ preset, palette })` and small `overrides` instead of hardcoding every color.

---

## Migration (Legacy → New Theming)

The new API centers on **semantic tokens** and a **theme factory**. You can still pass the legacy `theme` shape, but we recommend moving to `createTheme({ preset, palette, overrides })`.

### 1) Key concept changes

- **Old**: `primary` (sometimes bg, sometimes text), `secondary` (sometimes text, sometimes bg), `selectionFlip`
- **New**: clear semantic roles

  - `background`, `surface`, `header`
  - `foreground`, `mutedForeground`, `disabledForeground`
  - `accent` (selection chip), `onAccent` (text on accent), `divider`, `border`

Auto-contrast is built in when computing tokens (WCAG-ish 4.5) so text stays readable.

---

### 2) Token mapping

| Legacy key                               | New semantic token                    | Notes                                      |
| ---------------------------------------- | ------------------------------------- | ------------------------------------------ |
| `colors.background`                      | `colors.background`                   | Same meaning.                              |
| `colors.surface` / `bodyBackgroundColor` | `colors.surface`                      | Calendar body.                             |
| `colors.headerBackgroundColor`           | `colors.header`                       | Header surface.                            |
| `colors.text`                            | `colors.foreground`                   | Primary text.                              |
| `colors.mutedText`                       | `colors.mutedForeground`              | Subdued text.                              |
| `colors.disabledText`                    | `colors.disabledForeground`           | Disabled text.                             |
| `colors.divider`                         | `colors.divider`                      | Hairline dividers.                         |
| `colors.selectedBackground`              | `colors.accent`                       | Selection chip background.                 |
| `colors.selectedText`                    | `colors.onAccent`                     | Text on selection.                         |
| `todayBorder`                            | **uses** `colors.accent`              | Today ring uses `accent` as border.        |
| `primary` (bg-ish intent)                | `palette.primary` → surfaces          | Fed into `createTheme`.                    |
| `secondary` (text-ish intent)            | `palette.secondary` → text            | Fed into `createTheme`.                    |
| `selectionFlip`                          | **N/A**                               | No longer needed; use `accent`/`onAccent`. |
| `autoContrast`                           | `options.autoContrast` (default true) | Leave on for safety.                       |

---

### 3) Sizing tokens

| Legacy size                             | New size                                                    | Typical mapping                                                               |
| --------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `radius`                                | `radii`                                                     | `radius` ≈ `radii.md` or `radii.lg`                                           |
| `topRadius`                             | (component uses 20 by default)                              | If needed, keep 20 or map to `radii.lg`.                                      |
| `selectedDateRadius` / `Month` / `Year` | (picker uses fixed circle for day; chips use `radii.sm/md`) | If you want custom rounding, adjust component or expose per-slot radii later. |
| `typography.title` / `label` / `day`    | `fontSizes.lg` / `sm` / `md`                                | 1:1 approximate mapping.                                                      |
| `spacing.gutter` / `header` / `gridGap` | `space.md` / `sm` / `xs`                                    | Keep proportions similar.                                                     |

> The new component defaults to **circular selected day pills** (using `radii.full`). If you need the old “rounded rectangle” selected day, you can fork or expose a `component override` later.

---

### 4) Typical migrations

#### A) Minimal (use factory)

**Before (legacy):**

```tsx
<ModernDatePicker
  theme={{
    primary: "#f4f2f2",
    secondary: "#000000",
    selectionFlip: false,
    autoContrast: true,
  }}
/>
```

**After (new):**

```tsx
<ModernDatePicker
  theme={{
    preset: "light",
    palette: {
      primary: "#f4f2f2", // surfaces
      secondary: "#000000", // text
      accent: "#2563eb", // selection (optional)
    },
    // overrides: { colors: { divider: "#e0e0e0" } }
  }}
/>
```

#### B) Explicit colors (pin everything)

**Before:**

```tsx
<ModernDatePicker
  theme={{
    primary: "#f4f2f2",
    secondary: "#000000",
    colors: {
      background: "#f4f2f2",
      surface: "#f4f2f2",
      headerBackgroundColor: "#f4f2f2",
      bodyBackgroundColor: "#f4f2f2",
      text: "#000000",
      mutedText: "#555555",
      divider: "#e0e0e0",
      selectedBackground: "#000000",
      selectedText: "#ffffff",
      todayBorder: "#000000",
      disabledText: "#999999",
    },
    autoContrast: false,
    selectionFlip: false,
  }}
/>
```

**After (new semantics, same look):**

```tsx
<ModernDatePicker
  theme={{
    preset: "light",
    palette: { primary: "#f4f2f2", secondary: "#000000", accent: "#000000" },
    overrides: {
      colors: {
        // explicit semantic tokens
        background: "#f4f2f2",
        surface: "#f4f2f2",
        header: "#f4f2f2",
        foreground: "#000000",
        mutedForeground: "#555555",
        divider: "#e0e0e0",
        disabledForeground: "#999999",
        onAccent: "#ffffff",
        // today ring uses accent automatically
      },
    },
    // keep auto-contrast ON unless you intentionally want exact colors
    // options: { autoContrast: true }
  }}
/>
```

#### C) App-wide theme

```tsx
import { ThemeProvider, createTheme } from "@anasyd/react-native-modern-date-picker";

const theme = createTheme({
  preset: "light",
  palette: { primary: "#f4f2f2", secondary:"#000", accent:"#2563eb" },
});

<ThemeProvider value={theme}>
  <ModernDatePicker ... />
  {/* other components can consume the same theme */}
</ThemeProvider>
```

---

### 5) Gotchas & tips

- **Pick the right preset**: If surfaces are light, use `preset: "light"`; dark surfaces → `"dark"`. This sets sane defaults around text, dividers, etc.
- **Auto-contrast**: Leave it on (default). If you hardcode a token in `overrides.colors`, that token is respected as-is.
- **Today ring**: Now uses `colors.accent`. If you want a different ring without changing selection color, override `accent`.
- **Global vs one-off**: For many components or runtime mode switching, use `ThemeProvider`. For a single picker, passing `theme` on the prop is fine.
- **Legacy still works**: You can keep using the old keys while you migrate. The component adapts them internally.

---

### 6) Cheat sheet

- Want the selected chip to be black with white text?
  `palette.accent = "#000"; overrides.colors.onAccent = "#fff"` (or let auto-contrast pick white).

- Want subtler dividers on light surfaces?
  `overrides.colors.divider = "#eaeaea"`

- Want more rounded month chips?
  `overrides.radii.sm = 10; overrides.radii.md = 14` (chips use `sm`/`md`).

---

## Props

| Prop                  | Type                                           | Default  | Description                                                                                                          |
| --------------------- | ---------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `open`                | `boolean`                                      | —        | Show/hide the picker.                                                                                                |
| `onClose`             | `() => void`                                   | —        | Called when the picker requests to close.                                                                            |
| `value`               | `Date \| null`                                 | —        | Selected date (controlled).                                                                                          |
| `defaultValue`        | `Date`                                         | —        | Default date (uncontrolled).                                                                                         |
| `onChange`            | `(date: Date) => void`                         | —        | Fired on selection.                                                                                                  |
| `minDate`             | `Date`                                         | —        | Minimum selectable date.                                                                                             |
| `maxDate`             | `Date`                                         | —        | Maximum selectable date.                                                                                             |
| `ageLimitYears`       | `number`                                       | —        | e.g. `18` to enforce 18+.                                                                                            |
| `theme`               | `Theme \| CreateThemeInput \| LegacyTheme`     | —        | Provide a full theme, a palette input, or legacy theme. If omitted, component uses defaults and/or provider context. |
| `locale`              | `string`                                       | platform | Locale (e.g., `"en-US"`).                                                                                            |
| `firstDayOfWeek`      | `0…6`                                          | `0`      | 0=Sun, 1=Mon, …                                                                                                      |
| `testID`              | `string`                                       | —        | Test identifier.                                                                                                     |
| `style`               | `StyleProp<ViewStyle>`                         | —        | Container style.                                                                                                     |
| `animationSpeed`      | `number`                                       | `220`    | Show/hide animation speed (ms).                                                                                      |
| `renderBackdrop`      | `(opacity: Animated.Value) => React.ReactNode` | —        | Custom backdrop.                                                                                                     |
| `showDefaultBackdrop` | `boolean`                                      | `true`   | Show built-in dim overlay.                                                                                           |
| `backdropColor`       | `string`                                       | `#000`   | Color for built-in dim overlay.                                                                                      |

---

## Features

- 📅 Month view calendar
- 🗓️ Month grid selection
- 📆 Year wheel selection
- 🎨 Full theme customization (semantic tokens, palette, overrides)
- 🔞 Age limit (e.g., 18+)
- 🗓️ Min/max selectable date
- 🌍 Locale support
- 🕹️ First day of week configurable
- 🧪 TestID and custom styles
- 🧑‍💻 TypeScript
- ⚡ Fast, lightweight, and easy to use

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

> Migrating from the old API? See [Migration (Legacy → New Theming)](#migration-legacy--new-theming).

## License

MIT
