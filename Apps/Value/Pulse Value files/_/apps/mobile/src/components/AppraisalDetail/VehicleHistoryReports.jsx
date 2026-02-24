import { View, Text, TouchableOpacity } from "react-native";
import { FileText, ExternalLink } from "lucide-react-native";

export function VehicleHistoryReports({ onCarfax, onAutoCheck }) {
  return (
    <View
      style={{
        backgroundColor: "#1E1E1E",
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <FileText color="#06b6d4" size={20} />
        <Text
          style={{
            fontFamily: "System",
            fontSize: 18,
            fontWeight: "600",
            color: "#FFF",
            marginLeft: 8,
          }}
        >
          Vehicle History Report
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#121212",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            marginBottom: 8,
          }}
        >
          ⚠️ Dealer Login Required
        </Text>
        <Text
          style={{
            fontFamily: "System",
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          You must be logged into your dealer account for these reports to
          display.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {/* Carfax */}
        <TouchableOpacity
          onPress={onCarfax}
          style={{
            backgroundColor: "#ff6b00",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          activeOpacity={0.8}
        >
          <View>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 16,
                fontWeight: "600",
                color: "#FFF",
                marginBottom: 4,
              }}
            >
              CARFAX
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 12,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Industry-leading vehicle history
            </Text>
          </View>
          <ExternalLink color="#FFF" size={20} />
        </TouchableOpacity>

        {/* AutoCheck */}
        <TouchableOpacity
          onPress={onAutoCheck}
          style={{
            backgroundColor: "#0066cc",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          activeOpacity={0.8}
        >
          <View>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 16,
                fontWeight: "600",
                color: "#FFF",
                marginBottom: 4,
              }}
            >
              AutoCheck
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 12,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Comprehensive vehicle history
            </Text>
          </View>
          <ExternalLink color="#FFF" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
