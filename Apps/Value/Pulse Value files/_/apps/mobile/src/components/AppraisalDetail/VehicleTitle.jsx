import { View, Text, TouchableOpacity } from "react-native";
import { Copy } from "lucide-react-native";

export function VehicleTitle({ vehicle, vin, onCopyVIN }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontFamily: "System",
          fontSize: 28,
          fontWeight: "700",
          color: "#FFF",
          marginBottom: 8,
        }}
      >
        {vehicle.year} {vehicle.make} {vehicle.model}
      </Text>
      <Text
        style={{
          fontFamily: "System",
          fontSize: 16,
          color: "rgba(255,255,255,0.6)",
          marginBottom: 12,
        }}
      >
        {typeof vehicle.trim === "object"
          ? vehicle.trim?.name || vehicle.trim?.code || "N/A"
          : vehicle.trim}
      </Text>
      <TouchableOpacity
        onPress={onCopyVIN}
        style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontFamily: "Courier",
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          VIN: {vin}
        </Text>
        <Copy color="rgba(255,255,255,0.4)" size={14} />
      </TouchableOpacity>
    </View>
  );
}
