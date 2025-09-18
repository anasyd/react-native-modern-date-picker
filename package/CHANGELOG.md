# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres (lightly) to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Revised theming semantics: `primary` now applies to all background surfaces; `secondary` becomes the foreground/text color. Selected state flips colors (`secondary` background with `primary` text). Muted/disabled/divider/today border derive from `secondary` with opacity.
- Backwards compatibility: Supplying only `primary` or only `secondary` keeps legacy-ish behavior without forced flip.
- Added `selectionFlip` toggle (default true when both primary & secondary) and `autoContrast` (default on) with `contrastThreshold` to ensure readable text and selection states.

## [1.1.0] - 2025-09-18

### Added

- Theming enhancements: `primary` and `secondary` semantic color shortcuts now map to selected background / today border and header / surface respectively.
- Backdrop customization props: `renderBackdrop(opacity)`, `showDefaultBackdrop`, and `backdropColor` allow full control or disabling the default backdrop.
- Radius cascade: setting `theme.radius` will auto-fill `topRadius`, `selectedDateRadius` (unless explicitly set), `selectedMonthRadius`, and `selectedYearRadius`.

### Changed

- Consolidated repository from a multi-workspace (bare & expo variants) into a single package at `package/`.
- Animation tuning: unified spring + fade for sheet and backdrop; fixed body height (360) to prevent layout jump.
- Simplified build & publish scripts (root scripts `build`, `pack`, `publish`).

### Removed

- Internal blur implementation (previously using `expo-blur` / `@react-native-community/blur`). Consumers can now provide any blur or backdrop via `renderBackdrop`.
- All legacy workspace directories (`packages/`, `expo_example/`).

### Fixed

- Date radius behavior: circle shape now applied when `selectedDateRadius` is `undefined`.
- Consistent today border rendering even without selection.

## [1.0.0] - 2025-09-??

### Added

- Initial release of modern bottom-sheet date picker with days / months / years modes, animated sheet, and basic theming.

[1.1.0]: https://github.com/anasyd/react-native-modern-date-picker/releases/tag/v1.1.0
