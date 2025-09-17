# react-native-modern-date-picker (Monorepo)

Two npm packages with the same API and UI, tailored for their platforms:

- packages/expo → expo-modern-date-picker (Expo; uses expo-blur)
- packages/bare → react-native-modern-date-picker (Bare RN; uses @react-native-community/blur)

Example apps:
- expo_example (Expo SDK 54)
- bare_example (React Native 0.81)

## Features
- Smooth open/close animations (enter + exit)
- Optional blur background (animated opacity). Android uses an experimental blur method
- Fixed sheet height to avoid jumping between months and modes
- Simple theming:
  - Presets: dark/light
  - primary (selected accent) and secondary (surface/header) overrides
  - Global radius fallback that applies to specific radii when not set
  - Circle selected date by default; 0 => square; >0 => rounded

## Packages

### Expo (expo-modern-date-picker)
- Runtime blur via expo-blur (optional but recommended)
- Android blur uses experimental method (may impact performance)

Install:
```sh
npm install expo-modern-date-picker expo-blur
```

### Bare React Native (react-native-modern-date-picker)
- Runtime blur via @react-native-community/blur (optional)

Install:
```sh
npm install react-native-modern-date-picker @react-native-community/blur
```

## Theming

Props on the theme object:
- preset?: "dark" | "light"
- primary?: string         // selectedBackground, todayBorder
- secondary?: string       // headerBackgroundColor, surface
- colors?: { ... }         // full custom palette
- radius?: number          // global fallback; applies to topRadius/selected* when not set
- topRadius?: number       // default 20
- selectedDateRadius?: number | undefined // undefined => circle; 0 => square; >0 => rounded
- selectedMonthRadius?: number // default 8
- selectedYearRadius?: number // default 8

Example:
```tsx
<ModernDatePicker
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  theme={{
    preset: 'light',
    primary: '#2563eb',
    secondary: '#f3f4f6',
    radius: 16,           // global fallback
  }}
/>
```

### Exported presets
```ts
import ModernDatePicker, { DefaultThemes } from 'expo-modern-date-picker';
// DefaultThemes.dark and DefaultThemes.light are exported for convenience
```

## Android blur note
- Expo: Uses experimental method (via expo-blur). Consider performance trade-offs.
- Bare: Uses @react-native-community/blur; requires rebuild after install.

## Develop, build, and publish

This repo uses npm workspaces. At the repo root:

- Build both packages:
```sh
npm run build
```

- Pack both tarballs:
```sh
npm run pack
```

- Publish both packages to npm (requires auth):
```sh
npm run publish
```

You can also publish individually:
```sh
npm run publish:expo
npm run publish:bare
```

## Run the example apps

- Expo example:
```sh
npm install -w expo_example
npm run start:expo
# then run: npm run android -w expo_example  or  npm run ios -w expo_example
```

- Bare RN example:
```sh
npm install -w bare_example
npm run start:bare
# then run: npm run android -w bare_example  or  npm run ios -w bare_example
```

Note: Examples depend on published packages from npm (no local file: links), so ensure you publish first when testing on fresh clones/CI.

## Versioning and releases

We use standard npm versioning per package and a simple two-package release:

1) Bump versions (choose one: patch | minor | major) per package:
```sh
npm version patch -w packages/expo
npm version patch -w packages/bare
# or: minor / major
```
This updates package.json and creates a git tag.

2) Push changes and tags to GitHub:
```sh
git push
git push --tags
```

3) Publish to npm (public access already configured):
```sh
npm run publish
# or individually
npm publish -w packages/expo --access public
npm publish -w packages/bare --access public
```

Optional: Use a changelog tool (e.g., Changesets, conventional-changelog) if you’d like automated release notes.

## License
MIT
