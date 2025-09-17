try {
  require.resolve("@react-native-community/blur");
} catch (e) {
  const msg = [
    "[react-native-modern-date-picker] Optional native dependency not found: @react-native-community/blur",
    "To enable background blur, install it in your app:",
    "  npm install @react-native-community/blur",
    "and then rebuild your app so autolinking can pick it up.",
  ].join("\n");
  console.warn(msg);
}
