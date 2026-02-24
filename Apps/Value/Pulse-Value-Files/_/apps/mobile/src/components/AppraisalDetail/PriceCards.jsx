import { View, Text } from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";

export function PriceCards({
  pulseValue,
  confidence,
  priceTrend,
  targetPurchasePrice,
  targetProfit,
}) {
  return (
    <View style={{ marginBottom: 24, gap: 16 }}>
      {/* Pulse Value */}
      <View
        style={{
          backgroundColor: "#1E1E1E",
          borderRadius: 20,
          padding: 20,
          borderWidth: 2,
          borderColor: "#06b6d4",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#06b6d4",
              marginRight: 8,
            }}
          />
          <Text
            style={{
              fontFamily: "System",
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Pulse Value
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "System",
            fontSize: 42,
            fontWeight: "700",
            color: "#FFF",
            marginBottom: 12,
          }}
        >
          ${pulseValue.toLocaleString()}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 12,
                fontWeight: "600",
                color: "#10b981",
              }}
            >
              {confidence}% Confidence
            </Text>
          </View>
          {priceTrend === "up" && <TrendingUp color="#10b981" size={16} />}
          {priceTrend === "down" && <TrendingDown color="#ef4444" size={16} />}
        </View>
      </View>

      {/* Max Buy Price */}
      <View
        style={{
          backgroundColor: "#1E1E1E",
          borderRadius: 20,
          padding: 20,
          borderWidth: 2,
          borderColor: "#10b981",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#10b981",
              marginRight: 8,
            }}
          />
          <Text
            style={{
              fontFamily: "System",
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Max Buy Price
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "System",
            fontSize: 42,
            fontWeight: "700",
            color: "#FFF",
            marginBottom: 12,
          }}
        >
          ${targetPurchasePrice.toLocaleString()}
        </Text>
        <View
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.2)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            alignSelf: "flex-start",
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontSize: 12,
              fontWeight: "600",
              color: "#f59e0b",
            }}
          >
            ${targetProfit.toLocaleString()} Profit Target
          </Text>
        </View>
      </View>
    </View>
  );
}
