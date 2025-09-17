declare module "@react-native-community/blur" {
  import * as React from "react";
  import { ViewProps } from "react-native";
  export interface BlurViewProps extends ViewProps {
    blurType?:
      | "xlight"
      | "light"
      | "dark"
      | "regular"
      | "prominent"
      | "systemThinMaterial"
      | "systemMaterial";
    blurAmount?: number;
    reducedTransparencyFallbackColor?: any;
  }
  export const BlurView: React.ComponentType<BlurViewProps>;
}
