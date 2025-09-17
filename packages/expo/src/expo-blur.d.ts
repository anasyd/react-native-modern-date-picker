declare module "expo-blur" {
  import * as React from "react";
  import { ViewProps } from "react-native";
  export interface BlurProps extends ViewProps {
    intensity?: number;
    // A number by which the blur intensity will be divided on Android
    blurReductionFactor?: number;
    tint?:
      | "light"
      | "dark"
      | "default"
      | "systemThinMaterial"
      | "systemMaterial"
      | "extraLight";
    // Android-only experimental method to enable software blur
    experimentalBlurMethod?: "none" | "dimezisBlurView";
  }
  export const BlurView: React.ComponentType<BlurProps>;
}
