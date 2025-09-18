// App.tsx
import React, { useState } from "react";
import { registerRootComponent } from "expo";
import { Button, View, Text } from "react-native";

// If you’re still using the package name:
import ModernDatePicker from "@anasyd/react-native-modern-date-picker";
// Or local file: import ModernDatePicker from "./ModernDatePicker";

function App() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const animationSpeed = 220;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f4f2f2", // match your primary so it blends with the sheet
      }}
    >
      <Text style={{ color: "#000", marginBottom: 12 }}>
        Selected: {value ? value.toDateString() : "None"}
      </Text>

      <Button title="Open Picker" onPress={() => setOpen(true)} />

      <Text style={{ color: "#555", marginVertical: 12, fontSize: 12 }}>
        Passing theme as an input object; the picker computes readable colors.
      </Text>

      <ModernDatePicker
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onChange={setValue}
        ageLimitYears={18}
        animationSpeed={animationSpeed}
        theme={{
          preset: "dark",
          palette: {
            primary: "#f4f2f2", // surfaces
            secondary: "#000000", // text
            accent: "#000000", // selected background
          },
          overrides: {
            colors: {
              // optional fine-tuning to match your explicit config
              mutedForeground: "#555555",
              divider: "#e0e0e0",
              disabledForeground: "#999999",
              // onAccent will auto-contrast to white; you can force it if you want:
              // onAccent: "#ffffff",
            },
          },
          // leave auto-contrast ON (recommended) so it protects readability
          // options: { autoContrast: true }
        }}
        showDefaultBackdrop={false}
      />
    </View>
  );
}
registerRootComponent(App);
