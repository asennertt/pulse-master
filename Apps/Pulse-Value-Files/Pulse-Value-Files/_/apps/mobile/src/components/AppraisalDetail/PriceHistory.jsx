import { View, Text } from "react-native";
import { TrendingUp } from "lucide-react-native";

export function PriceHistory({ priceHistory }) {
  if (!priceHistory || priceHistory.length === 0) {
    return null;
  }

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
        <TrendingUp color="#06b6d4" size={20} />
        <Text
          style={{
            fontFamily: "System",
            fontSize: 18,
            fontWeight: "600",
            color: "#FFF",
            marginLeft: 8,
          }}
        >
          Price History
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {priceHistory.slice(0, 3).map((hist, idx) => (
          <View
            key={idx}
            style={{
              backgroundColor: "#121212",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 8,
              }}
            >
              {new Date(hist.date).toLocaleDateString()}
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 20,
                fontWeight: "600",
                color: "#FFF",
                marginBottom: 4,
              }}
            >
              ${hist.price?.toLocaleString() || "N/A"}
            </Text>
            {hist.miles && (
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {hist.miles.toLocaleString()} mi
              </Text>
            )}
            {hist.dealer_name && (
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                }}
                numberOfLines={1}
              >
                {hist.dealer_name}
              </Text>
            )}
          </View>
        ))}
      </View>

      <Text
        style={{
          fontFamily: "System",
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          fontStyle: "italic",
          marginTop: 12,
        }}
      >
        Historical pricing data from {priceHistory.length} listing
        {priceHistory.length > 1 ? "s" : ""}
      </Text>
    </View>
  );
}
