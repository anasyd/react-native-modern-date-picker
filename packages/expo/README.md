# expo-modern-date-picker

A modern, customizable date picker for Expo projects. Uses `expo-blur` for background blur effects.

## Installation

```sh
npm install expo-modern-date-picker expo-blur
```

## Usage

```tsx
import ModernDatePicker, { DefaultThemes } from 'expo-modern-date-picker';

<ModernDatePicker
	open={open}
	onClose={() => setOpen(false)}
	value={value}
	onChange={setValue}
	theme={{
		preset: 'dark',         // or 'light'
		primary: '#2563eb',     // selected accent
		secondary: '#121212',   // surface/header tint
		radius: 16,             // global fallback for radii
	}}
/>
```

## Features
- Smoother open/close transitions (open and close are both animated)
- Customizable blur background (uses expo-blur, with animated opacity)
- Customizable radii, colors, and typography
- Works with Expo Go (managed workflow)

## Theming
- preset: 'dark' | 'light'
- primary: string (applies to selectedBackground + todayBorder)
- secondary: string (applies to headerBackgroundColor + surface)
- colors: full palette override (optional)
- radius: global fallback; applies to topRadius/selected* when not set
- topRadius: default 20
- selectedDateRadius: undefined => circle, 0 => square, >0 => rounded
- selectedMonthRadius: default 8
- selectedYearRadius: default 8

Exported presets:
```ts
import { DefaultThemes } from 'expo-modern-date-picker';
// DefaultThemes.dark and DefaultThemes.light
```

## Notes
- Only for Expo managed workflow (Expo Go). For bare React Native or ejected Expo, use the bare package.
- The blur effect uses `expo-blur` and is animated in/out with the modal. On Android, an experimental method is used and may affect performance on lower-end devices.
- See the monorepo root README for full documentation.
