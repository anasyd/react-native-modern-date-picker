# Bare React Native Example

This is a minimal bare React Native app demonstrating `react-native-modern-date-picker`.

## Run

Install dependencies from the monorepo root first so the local tarball resolves:

```
npm install -w bare_example
```

Then start Metro and a platform target:

```
npm run start -w bare_example
npm run android -w bare_example
# or
npm run ios -w bare_example
```

If the picker fails to blur, ensure you have `@react-native-community/blur` installed and rebuilt the native app.
