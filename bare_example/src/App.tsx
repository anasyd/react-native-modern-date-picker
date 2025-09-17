import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
} from "react-native";
import ModernDatePicker from "react-native-modern-date-picker";

export default function App() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<Date | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Bare RN Example</Text>
        <Text style={styles.value}>
          Selected: {value ? value.toDateString() : "None"}
        </Text>
        <Button title="Open Picker" onPress={() => setOpen(true)} />
      </View>

      <ModernDatePicker
        open={open}
        onClose={() => setOpen(false)}
        value={value ?? undefined}
        onChange={(d) => setValue(d)}
        ageLimitYears={18}
        theme={{ preset: "dark", topRadius: 20 }}
        firstDayOfWeek={1}
        blurAmount={8}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#111" },
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 20, marginBottom: 8 },
  value: { color: "#ccc", marginBottom: 16 },
});
