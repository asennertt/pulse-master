import { View, ActivityIndicator } from "react-native";

export function LoadingState() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator
        size="large"
        color="#FFF"
        testID="activity-indicator"
      />
    </View>
  );
}
