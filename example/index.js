// App.tsx
import React, { useState } from "react";
import { registerRootComponent } from "expo";
import { Button, View, Text, ScrollView, StyleSheet } from "react-native";

// If you're still using the package name:
import ModernDatePicker from "@anasyd/react-native-modern-date-picker";
// Or local file: import ModernDatePicker from "./ModernDatePicker";

function App() {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [datetimeOpen, setDatetimeOpen] = useState(false);
  const [agePickerOpen, setAgePickerOpen] = useState(false);
  const [businessHoursOpen, setBusinessHoursOpen] = useState(false);

  const [dateValue, setDateValue] = useState(null);
  const [timeValue, setTimeValue] = useState(null);
  const [datetimeValue, setDatetimeValue] = useState(null);
  const [ageValue, setAgeValue] = useState(null);
  const [businessHoursValue, setBusinessHoursValue] = useState(null);

  const animationSpeed = 220;

  const formatDateTime = (date) => {
    if (!date) return "None";
    return date.toLocaleString();
  };

  const formatTime = (date) => {
    if (!date) return "None";
    return date.toLocaleTimeString();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>Modern Date Picker Demo</Text>
        <Text style={styles.subtitle}>
          Test different picker modes with haptic feedback
        </Text>
      </View>

      {/* Date Only Picker */}
      <View style={styles.pickerSection}>
        <Text style={styles.sectionTitle}>Date Only</Text>
        <Text style={styles.value}>
          Selected: {dateValue ? dateValue.toDateString() : "None"}
        </Text>
        <Button title="Open Date Picker" onPress={() => setDateOpen(true)} />
      </View>

      {/* Time Only Picker */}
      <View style={styles.pickerSection}>
        <Text style={styles.sectionTitle}>Time Only</Text>
        <Text style={styles.value}>Selected: {formatTime(timeValue)}</Text>
        <Button title="Open Time Picker" onPress={() => setTimeOpen(true)} />
      </View>

      {/* DateTime Picker */}
      <View style={styles.pickerSection}>
        <Text style={styles.sectionTitle}>Date & Time</Text>
        <Text style={styles.value}>
          Selected: {formatDateTime(datetimeValue)}
        </Text>
        <Button
          title="Open DateTime Picker"
          onPress={() => setDatetimeOpen(true)}
        />
      </View>

      {/* Age Picker (18-65 years old) */}
      <View style={styles.pickerSection}>
        <Text style={styles.sectionTitle}>Age Restricted (18-65)</Text>
        <Text style={styles.value}>
          Selected: {ageValue ? ageValue.toDateString() : "None"}
        </Text>
        <Button
          title="Open Age Picker"
          onPress={() => setAgePickerOpen(true)}
        />
      </View>

      {/* Business Hours Picker (9 AM - 5 PM) */}
      <View style={styles.pickerSection}>
        <Text style={styles.sectionTitle}>Business Hours (9 AM - 5 PM)</Text>
        <Text style={styles.value}>
          Selected: {formatTime(businessHoursValue)}
        </Text>
        <Button
          title="Open Business Hours"
          onPress={() => setBusinessHoursOpen(true)}
        />
      </View>

      {/* Date Picker */}
      <ModernDatePicker
        mode="date"
        open={dateOpen}
        onClose={() => setDateOpen(false)}
        value={dateValue}
        onChange={setDateValue}
        maxDate={new Date(Date.now())}
        animationSpeed={animationSpeed}
        theme={{
          preset: "light",
          palette: {
            primary: "#ffffff",
            secondary: "#ff0000ff",
            accent: "#2563eb",
          },
        }}
      />

      {/* Time Picker */}
      <ModernDatePicker
        mode="time"
        open={timeOpen}
        onClose={() => setTimeOpen(false)}
        value={timeValue}
        onChange={setTimeValue}
        is24Hour={true}
        minuteInterval={1}
        animationSpeed={animationSpeed}
        theme={{
          preset: "light",
          palette: {
            primary: "#3cff01ff",
            secondary: "#ff0000ff",
            accent: "#073828ff",
          },
        }}
      />

      {/* DateTime Picker */}
      <ModernDatePicker
        mode="datetime"
        open={datetimeOpen}
        onClose={() => setDatetimeOpen(false)}
        value={datetimeValue}
        onChange={setDatetimeValue}
        is24Hour={false}
        minuteInterval={15}
        animationSpeed={animationSpeed}
        theme={{
          preset: "dark",
          palette: {
            primary: "#1f2937",
            secondary: "#ffffff",
            accent: "#f59e0b",
          },
        }}
      />

      {/* Age Picker - 18 to 65 years old */}
      <ModernDatePicker
        mode="date"
        open={agePickerOpen}
        onClose={() => setAgePickerOpen(false)}
        value={ageValue}
        onChange={setAgeValue}
        minAge={18}
        maxAge={65}
        animationSpeed={animationSpeed}
        theme={{
          preset: "light",
          palette: {
            primary: "#ffffff",
            secondary: "#000000",
            accent: "#8b5cf6",
          },
        }}
      />

      {/* Business Hours Picker - 9 AM to 5 PM */}
      <ModernDatePicker
        mode="time"
        open={businessHoursOpen}
        onClose={() => setBusinessHoursOpen(false)}
        value={businessHoursValue}
        onChange={setBusinessHoursValue}
        is24Hour={false}
        minuteInterval={15}
        minTime={{ hour: 9, minute: 0 }}
        maxTime={{ hour: 17, minute: 0 }}
        animationSpeed={animationSpeed}
        theme={{
          preset: "light",
          palette: {
            primary: "#ffffff",
            secondary: "#8228acff",
            accent: "#ef4444",
          },
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  section: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  pickerSection: {
    width: "100%",
    backgroundColor: "#ffffff",
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
});

registerRootComponent(App);
