import { View, Text } from "react-native";

export function ErrorState({ message, topInset }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: topInset,
      }}
    >
      <Text
        style={{
          fontFamily: "System",
          fontSize: 16,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        {message}
      </Text>
    </View>
  );
}
