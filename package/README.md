# @anasyd/react-native-modern-date-picker

Unified modern date picker for React Native & Expo. Internal blur removed; inject any backdrop (blur, gradient, image) using `renderBackdrop(opacity)`. A dim overlay is provided by default (can be disabled or replaced).

## Install

```sh
npm install @anasyd/react-native-modern-date-picker
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release notes.

Optional blur libs if you want a blur backdrop:

```sh
# Expo
npm install expo-blur

# Bare RN
npm install @react-native-community/blur
```

## Basic Usage

```tsx
import ModernDatePicker from "@anasyd/react-native-modern-date-picker";

<ModernDatePicker
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
/>;
```

## Custom Blur Backdrop (Expo)

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

## Custom Blur Backdrop (Bare RN)

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

## Backdrop Props

- `renderBackdrop(opacity)` – custom backdrop node.
- `showDefaultBackdrop` (default true) – toggle built-in dim.
- `backdropColor` (default `#000`) – dim overlay color.

## Theming

### Quick Semantics

| Token                      | Role (when both provided)                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `primary`                  | Main surface background(s)                                                                           |
| `secondary`                | Foreground/text color base                                                                           |
| `selectionFlip`            | If true (default), selection swaps background/text (selected background = secondary, text = primary) |
| `autoContrast`             | (Default true) Ensures readable text against surfaces & selection pill                               |
| `contrastThreshold`        | Minimum WCAG-ish ratio (default 4.5) for auto adjustment                                             |
| Muted / Disabled / Divider | Derived from text color with opacity (70%, 35%, 15%)                                                 |
| Today border               | Matches readable text/selection for visibility                                                       |

If only `primary` is supplied we fall back to legacy accent behavior. If only `secondary` is supplied it acts as a text accent without forcing flips.

Explicit `theme.colors.*` always override computed values (no auto adjustments applied to explicit overrides).

### Options

```ts
theme={{
  primary: "#537A83",
  secondary: "#DEE9EC",
  selectionFlip: true,        // set false for solid-style selection
  autoContrast: true,         // set false to trust provided colors exactly
  contrastThreshold: 4.5,     // raise (e.g., 7) for stricter contrast
}}
```

### Why autoContrast?

User-provided palettes often look fine for surfaces but fail readability on small text (days, years). Auto contrast picks between the requested color, white, and black to meet the threshold while preserving intent when possible.

### Overriding Specific Tokens

Provide `theme.colors.text`, `theme.colors.selectedBackground`, etc. to disable automatic derivation for those slots.

### Radius Cascade

`radius` acts as fallback for: `topRadius`, `selectedDateRadius`, `selectedMonthRadius`, `selectedYearRadius`.

Special case: if `selectedDateRadius` is `undefined` the selected day becomes a circle.

### Example

```tsx
<ModernDatePicker
  open={open}
  onClose={onClose}
  value={value}
  onChange={setValue}
  theme={{
    preset: "light",
    primary: "#2563eb",
    secondary: "#f3f4f6",
    radius: 16,
  }}
/>
```

## Exported Presets

```ts
import ModernDatePicker, {
  DefaultThemes,
} from "@anasyd/react-native-modern-date-picker";
// DefaultThemes.dark / DefaultThemes.light
```

## License

MIT

# React Native Modern Date Picker

A modern, fully-themable bottom-sheet date picker for React Native. Features month view, month grid, year wheel, age limits, and more.

## Features

- 📅 Month view calendar
- 🗓️ Month grid selection
- 📆 Year wheel selection
- 🎨 Full theme customization (colors, radius, typography, spacing)
- 🔞 Age limit (e.g., 18+)
- 🗓️ Min/max selectable date
- 🌍 Locale support
- 🕹️ First day of week configurable
- 🧪 TestID and custom styles
- 🧑‍💻 Written in TypeScript
- ⚡ Fast, lightweight, and easy to use

## Installation

```sh
npm install @anasyd/react-native-modern-date-picker
```

## Usage

```jsx
import ModernDatePicker from "@anasyd/react-native-modern-date-picker";

<ModernDatePicker
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  ageLimitYears={18}
  theme={{ radius: 20, colors: { selectedBackground: "#4f46e5" } }}
/>;
```

## Props

| Prop           | Type                 | Description                                 |
| -------------- | -------------------- | ------------------------------------------- |
| open           | boolean              | Show/hide the picker                        |
| onClose        | () => void           | Called when picker is closed                |
| value          | Date \| null         | Selected date                               |
| defaultValue   | Date                 | Default date                                |
| onChange       | (date: Date) => void | Called when date is selected                |
| minDate        | Date                 | Minimum selectable date                     |
| maxDate        | Date                 | Maximum selectable date                     |
| ageLimitYears  | number               | Age limit (e.g., 18 for 18+)                |
| theme          | Theme                | Theme customization object                  |
| locale         | string               | Locale (e.g., 'en-US')                      |
| firstDayOfWeek | 0-6                  | First day of week (0=Sunday, 1=Monday, ...) |
| testID         | string               | Test ID for testing                         |
| style          | ViewStyle            | Custom style for the picker                 |

## License

MIT

---

For more details, see the [GitHub repo](https://github.com/anasyd/react-native-modern-date-picker).
