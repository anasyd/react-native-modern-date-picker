# react-native-modern-date-picker (Bare RN)

A modern, customizable date picker for bare React Native apps. Uses `@react-native-community/blur` for background blur effects (optional).

## Installation

```sh
npm install react-native-modern-date-picker @react-native-community/blur
```

## Usage

```tsx
import ModernDatePicker from 'react-native-modern-date-picker';

<ModernDatePicker
	open={open}
	onClose={() => setOpen(false)}
	value={value}
	onChange={setValue}
/>
```

## Features
- Smoother open/close transitions (open and close are both animated)
- Customizable blur background (uses @react-native-community/blur, with animated opacity)
- Customizable radii, colors, and typography
- For bare React Native and ejected Expo apps

Theming, presets (dark/light), primary/secondary overrides, and radius behavior are identical to the Expo package. See the monorepo root README for full docs.

## Notes
- Install `@react-native-community/blur` and rebuild your app to enable real blur background; otherwise you will see a dim overlay.
- API and visuals are aligned with the Expo package for consistency.
