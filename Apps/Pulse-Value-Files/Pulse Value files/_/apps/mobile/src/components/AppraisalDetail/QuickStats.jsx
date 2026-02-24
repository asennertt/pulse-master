import { View, Text } from "react-native";
import { Gauge, Activity, TrendingUp, Calendar } from "lucide-react-native";

export function QuickStats({ vehicle, daysOfSupply, marketHealth, velocity }) {
  // Handle both 'miles' and 'mileage' field names
  const mileage = vehicle.miles || vehicle.mileage || 0;

  return (
    <View
      style={{
        backgroundColor: "#1E1E1E",
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <View style={{ gap: 16 }}>
        {/* Mileage */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Gauge color="#06b6d4" size={20} />
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Mileage
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 18,
              fontWeight: "600",
              color: "#FFF",
            }}
          >
            {mileage.toLocaleString()}
          </Text>
        </View>

        {/* Days Supply */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Activity color="#06b6d4" size={20} />
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Days Supply
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 18,
              fontWeight: "600",
              color: "#FFF",
            }}
          >
            {daysOfSupply}
            {vehicle.market_days_supply && (
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  marginLeft: 4,
                }}
              >
                {" "}
                real
              </Text>
            )}
          </Text>
        </View>

        {/* Market Demand */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TrendingUp color="#10b981" size={20} />
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Market Demand
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 18,
              fontWeight: "600",
              color: "#10b981",
            }}
          >
            {marketHealth}
          </Text>
        </View>

        {/* Velocity */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Calendar color="#06b6d4" size={20} />
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Velocity
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 18,
              fontWeight: "600",
              color: "#FFF",
            }}
          >
            {velocity}
          </Text>
        </View>
      </View>
    </View>
  );
}
