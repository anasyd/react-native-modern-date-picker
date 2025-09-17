import React from "react";
import {
  BlurView as RNBlurView,
  BlurViewProps,
} from "@react-native-community/blur";

export const BlurView: React.FC<BlurViewProps> = (props) => {
  // Map expo-blur props to @react-native-community/blur as needed
  return <RNBlurView {...props} />;
};
