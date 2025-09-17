import React, { useState } from "react";
import { registerRootComponent } from "expo";
import { Button, View, Text } from "react-native";
import ModernDatePicker from "expo-modern-date-picker";

function App() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [blurAmount, setBlurAmount] = useState(5);
  const [animationSpeed, setAnimationSpeed] = useState(220);
  const [radius, setRadius] = useState(18);
  const [headerBackgroundColor, setHeaderBackgroundColor] =
    useState("#022c55ff");
  const [headerFont, setHeaderFont] = useState("600");
  const [bodyBackgroundColor, setBodyBackgroundColor] = useState("#171923");

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
      <View style={{ flexDirection: "row", margin: 8 }}>
        <Button
          title="Blur -"
          onPress={() => setBlurAmount(Math.max(0, blurAmount - 10))}
        />
        <Text style={{ color: "#e5e7eb", marginHorizontal: 8 }}>
          Blur: {blurAmount}
        </Text>
        <Button
          title="Blur +"
          onPress={() => setBlurAmount(Math.min(100, blurAmount + 10))}
        />
      </View>
      <View style={{ flexDirection: "row", margin: 8 }}>
        <Button
          title="Anim -"
          onPress={() => setAnimationSpeed(Math.max(50, animationSpeed - 50))}
        />
        <Text style={{ color: "#e5e7eb", marginHorizontal: 8 }}>
          Anim: {animationSpeed}ms
        </Text>
        <Button
          title="Anim +"
          onPress={() => setAnimationSpeed(animationSpeed + 50)}
        />
      </View>
      <View style={{ flexDirection: "row", margin: 8 }}>
        <Button
          title="Radius -"
          onPress={() => setRadius(Math.max(0, radius - 2))}
        />
        <Text style={{ color: "#e5e7eb", marginHorizontal: 8 }}>
          Radius: {radius}
        </Text>
        <Button title="Radius +" onPress={() => setRadius(radius + 2)} />
      </View>
      <ModernDatePicker
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onChange={setValue}
        ageLimitYears={18}
        blurAmount={blurAmount}
        animationSpeed={animationSpeed}
        theme={{
          preset: "light",
        }}
      />
    </View>
  );
}
registerRootComponent(App);
