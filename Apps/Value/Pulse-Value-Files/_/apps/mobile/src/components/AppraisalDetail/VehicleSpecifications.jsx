import { View, Text } from "react-native";
import { Car } from "lucide-react-native";

export function VehicleSpecifications({ vehicle }) {
  // Helper function to safely extract string value from potentially object fields
  const safeValue = (value) => {
    if (!value) return null;
    if (typeof value === "object" && value !== null) {
      return value.name || value.code || value.base || null;
    }
    return value;
  };

  const specs = [
    { label: "Body Type", value: safeValue(vehicle.body_type) },
    { label: "Exterior Color", value: safeValue(vehicle.exterior_color) },
    { label: "Interior Color", value: safeValue(vehicle.interior_color) },
    { label: "Drivetrain", value: safeValue(vehicle.drivetrain) },
    { label: "Transmission", value: safeValue(vehicle.transmission) },
    { label: "Engine", value: safeValue(vehicle.engine) },
    { label: "Fuel Type", value: safeValue(vehicle.fuel_type) },
  ].filter((spec) => spec.value);

  if (specs.length === 0) {
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
        <Car color="#06b6d4" size={20} />
        <Text
          style={{
            fontFamily: "System",
            fontSize: 18,
            fontWeight: "600",
            color: "#FFF",
            marginLeft: 8,
          }}
        >
          Specifications
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {specs.map((spec, idx) => (
          <View key={idx}>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 4,
              }}
            >
              {spec.label}
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 16,
                color: "#FFF",
              }}
            >
              {spec.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
