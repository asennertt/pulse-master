import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft, Share2 } from "lucide-react-native";

export function AppraisalHeader({ onBack, onShare }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#1E1E1E",
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
        }}
        activeOpacity={0.7}
      >
        <ArrowLeft color="#FFF" size={24} />
      </TouchableOpacity>

      <Text
        style={{
          fontFamily: "System",
          fontSize: 16,
          fontWeight: "600",
          color: "#FFF",
        }}
      >
        Appraisal Details
      </Text>

      <TouchableOpacity
        onPress={onShare}
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
        }}
        activeOpacity={0.7}
      >
        <Share2 color="#FFF" size={22} />
      </TouchableOpacity>
    </View>
  );
}
