import { View, Text } from "react-native";
import { DollarSign } from "lucide-react-native";

export function DealCalculator({
  pulseValue,
  targetProfit,
  reconditioningCost,
  targetPurchasePrice,
}) {
  return (
    <View
      style={{
        backgroundColor: "#1E1E1E",
        borderRadius: 20,
        padding: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <DollarSign color="#06b6d4" size={20} />
        <Text
          style={{
            fontFamily: "System",
            fontSize: 18,
            fontWeight: "600",
            color: "#FFF",
            marginLeft: 8,
          }}
        >
          Deal Calculator
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <View>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 8,
            }}
          >
            Pulse Value
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 24,
              fontWeight: "600",
              color: "#FFF",
            }}
          >
            ${pulseValue.toLocaleString()}
          </Text>
        </View>

        <View>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 8,
            }}
          >
            Target Profit
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 24,
              fontWeight: "600",
              color: "#f59e0b",
            }}
          >
            - ${targetProfit.toLocaleString()}
          </Text>
        </View>

        <View>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 8,
            }}
          >
            Reconditioning Cost
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 24,
              fontWeight: "600",
              color: "#f59e0b",
            }}
          >
            - ${reconditioningCost.toLocaleString()}
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.1)",
            marginVertical: 8,
          }}
        />

        <View>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 8,
            }}
          >
            Maximum Purchase Price
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 32,
              fontWeight: "700",
              color: "#10b981",
            }}
          >
            ${targetPurchasePrice.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}
