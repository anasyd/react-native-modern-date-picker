# @anasyd/react-native-modern-date-picker

Unified modern, customizable date picker for both Expo and bare React Native. Blur is optional—inject it yourself with `expo-blur` (Expo) or `@react-native-community/blur` (bare). If you skip blur you'll get a simple dim backdrop (or no backdrop if you disable it).

Example app:

- `example` (Expo)

## Features

## Build & Publish (maintainers)

```sh
# Build TS -> dist
npm run build

# (Optional) local test install
npm run pack

# Publish (requires npm login)
npm run publish
```

Version bump (patch | minor | major):

```sh
cd package
npm version patch
git push && git push --tags
npm publish --access public
```

Consider adding a CHANGELOG.md if release cadence grows.

## Color Roles (quick reference)

Primary -> selectedBackground, todayBorder
Secondary -> headerBackgroundColor, surface
All tokens can be overridden directly via theme.colors.
style={StyleSheet.absoluteFill}
/>
</Animated.View>
)}
/>;

````

## No Backdrop

```tsx
<ModernDatePicker open={open} onClose={onClose} showDefaultBackdrop={false} />
````

## Theming

Props on the theme object:

### Example

```tsx
<ModernDatePicker
  open={open}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  theme={{
    preset: "light",
    primary: "#2563eb",
    secondary: "#f3f4f6",
    radius: 16, // global fallback
  }}
/>
```

Color targets:

### Exported Presets

```ts
import ModernDatePicker, {
  DefaultThemes,
} from "@anasyd/react-native-modern-date-picker";
// DefaultThemes.dark and DefaultThemes.light are exported for convenience
```

## Android Blur Note

## Backdrop / Blur API

Props:

Default behavior: a black overlay with animated opacity.

## Develop, build, and publish

This repo uses npm workspaces. At the repo root:

Build the package:

```sh
npm run build
```

Pack (creates a tarball you can install for testing):

```sh
npm run pack
```

Publish (requires npm auth):

```sh
npm run publish
```

## Run the example apps

```sh
cd example
npm install
npm start
```

Note: Examples depend on published packages from npm (no local file: links), so ensure you publish first when testing on fresh clones/CI.

## Versioning and releases

Single package release workflow:

1. Bump version (patch | minor | major):

```sh
cd package && npm version patch
```

2. Push changes and tags:

```sh
git push && git push --tags
```

3. Publish:

```sh
cd package && npm publish --access public
```

Optional: Use a changelog tool (e.g., Changesets, conventional-changelog) if you’d like automated release notes.

## License

MIT
