import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Camera, X, Search } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [manualVin, setManualVin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleManualLookup = async () => {
    if (manualVin.length !== 17) {
      Alert.alert("Error", "Please enter a valid 17-character VIN");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/appraisals/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vin: manualVin.toUpperCase() }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch vehicle data");
      }

      const data = await response.json();

      // Save appraisal
      const saveResponse = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/appraisals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vin: manualVin.toUpperCase(),
            vehicleData: data,
          }),
        },
      );

      if (!saveResponse.ok) {
        throw new Error("Failed to save appraisal");
      }

      const savedAppraisal = await saveResponse.json();

      // Navigate to the detail page instead of just showing alert
      router.push(`/appraisal/${savedAppraisal.id}`);

      setManualVin("");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCamera = async () => {
    if (!permission) {
      await requestPermission();
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to scan VINs",
        );
        return;
      }
    }

    setShowCamera(true);
  };

  if (showCamera) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar style="light" />
        <CameraView style={{ flex: 1 }} facing="back">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View
              style={{
                paddingTop: insets.top + 16,
                paddingHorizontal: 24,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowCamera(false)}
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#FFF",
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.8}
              >
                <X color="#000" size={24} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 24,
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: 120,
                  borderWidth: 2,
                  borderColor: "#FFF",
                  borderRadius: 12,
                  marginBottom: 24,
                }}
              />
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#FFF",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Position VIN within frame
              </Text>
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.8)",
                  textAlign: "center",
                }}
              >
                Make sure the VIN is clear and well-lit
              </Text>
            </View>

            <View
              style={{
                paddingBottom: insets.bottom + 24,
                paddingHorizontal: 24,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowCamera(false)}
                style={{
                  backgroundColor: "#FFF",
                  borderRadius: 24,
                  padding: 16,
                  alignItems: "center",
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#000",
                  }}
                >
                  Enter Manually Instead
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: insets.top }}>
      <StatusBar style="light" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 24 }}>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 32,
              fontWeight: "700",
              color: "#FFF",
              marginBottom: 8,
            }}
          >
            Scan or Enter VIN
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 32,
            }}
          >
            Get instant vehicle data and market valuation
          </Text>

          {/* Camera Scan Option */}
          <TouchableOpacity
            onPress={handleOpenCamera}
            style={{
              backgroundColor: "#FFF",
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 56,
                height: 56,
                backgroundColor: "#000",
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Camera color="#FFF" size={28} />
            </View>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 18,
                fontWeight: "600",
                color: "#000",
                marginBottom: 4,
              }}
            >
              Scan VIN with Camera
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: "rgba(0,0,0,0.6)",
                textAlign: "center",
              }}
            >
              Point your camera at the VIN plate
            </Text>
          </TouchableOpacity>

          {/* Manual Entry */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 20,
                fontWeight: "600",
                color: "#FFF",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Or Enter Manually
            </Text>

            <View
              style={{
                backgroundColor: "#1E1E1E",
                borderRadius: 20,
                padding: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 14,
                  fontWeight: "600",
                  color: "rgba(255,255,255,0.87)",
                  marginBottom: 12,
                }}
              >
                VIN Number
              </Text>
              <TextInput
                value={manualVin}
                onChangeText={(text) => setManualVin(text.toUpperCase())}
                placeholder="Enter 17-character VIN"
                placeholderTextColor="rgba(255,255,255,0.4)"
                maxLength={17}
                autoCapitalize="characters"
                style={{
                  backgroundColor: "#121212",
                  color: "#FFF",
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#404040",
                  fontFamily: "System",
                  fontSize: 16,
                  marginBottom: 8,
                }}
              />
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {manualVin.length}/17 characters
              </Text>

              <TouchableOpacity
                onPress={handleManualLookup}
                disabled={manualVin.length !== 17 || loading}
                style={{
                  backgroundColor: manualVin.length === 17 ? "#FFF" : "#404040",
                  borderRadius: 16,
                  padding: 16,
                  marginTop: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: loading ? 0.5 : 1,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 16,
                    fontWeight: "600",
                    color:
                      manualVin.length === 17
                        ? "#000"
                        : "rgba(255,255,255,0.5)",
                    marginRight: 8,
                  }}
                >
                  {loading ? "Looking up..." : "Get Appraisal"}
                </Text>
                <Search
                  color={
                    manualVin.length === 17 ? "#000" : "rgba(255,255,255,0.5)"
                  }
                  size={20}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Help Section */}
          <View
            style={{
              backgroundColor: "#1E1E1E",
              borderRadius: 20,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 16,
                fontWeight: "600",
                color: "rgba(255,255,255,0.87)",
                marginBottom: 12,
              }}
            >
              Where to find the VIN
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 20,
              }}
            >
              • Dashboard (driver's side, visible through windshield){"\n"}•
              Driver's side door jamb{"\n"}• Vehicle registration or title{"\n"}
              • Insurance documents
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
