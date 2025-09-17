try {
  require.resolve("expo-blur");
} catch (e) {
  const msg = [
    "[expo-modern-date-picker] Optional dependency not found: expo-blur",
    "Install it to enable background blur (Android uses an experimental mode):",
    "  npm install expo-blur",
    "",
    "This package works without expo-blur, but you'll only get a dim overlay instead of real blur.",
  ].join("\n");
  console.error(msg);
}
