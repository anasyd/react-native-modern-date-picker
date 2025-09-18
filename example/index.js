import React, { useState } from "react";
import { registerRootComponent } from "expo";
import { Button, View, Text } from "react-native";
import ModernDatePicker from "@anasyd/react-native-modern-date-picker";

function App() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [animationSpeed] = useState(220);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0f1115",
      }}
    >
      <Text style={{ color: "#e5e7eb", marginBottom: 12 }}>
        Selected: {value ? new Date(value).toDateString() : "None"}
      </Text>
      <Button title="Open Picker" onPress={() => setOpen(true)} />
      <Text style={{ color: "#9ca3af", marginVertical: 12, fontSize: 12 }}>
        Demo theme uses primary as surface background; secondary as text.
      </Text>
      <ModernDatePicker
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onChange={setValue}
        ageLimitYears={18}
        animationSpeed={animationSpeed}
        theme={{
          primary: "#537A83",
          secondary: "#DEE9EC",
          selectionFlip: true,
          autoContrast: true,
        }}
        showDefaultBackdrop
      />
    </View>
  );
}
registerRootComponent(App);
