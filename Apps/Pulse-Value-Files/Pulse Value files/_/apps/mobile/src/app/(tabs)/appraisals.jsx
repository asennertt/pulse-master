import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FileText, DollarSign, Calendar } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme, getTheme } from "@/utils/theme/useTheme";

export default function AppraisalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppraisals();
  }, []);

  const fetchAppraisals = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/appraisals`,
      );
      if (!response.ok) throw new Error("Failed to fetch appraisals");
      const data = await response.json();
      setAppraisals(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppraisals();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={{ padding: 24, paddingBottom: 16 }}>
        <Text
          style={{
            fontFamily: "System",
            fontSize: 32,
            fontWeight: "700",
            color: theme.text.primary,
            marginBottom: 8,
          }}
        >
          Appraisals
        </Text>
        <Text
          style={{
            fontFamily: "System",
            fontSize: 16,
            color: theme.text.secondary,
          }}
        >
          Your vehicle appraisal history
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.text.primary}
          />
        }
      >
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 16,
                color: theme.text.secondary,
              }}
            >
              Loading appraisals...
            </Text>
          </View>
        ) : appraisals.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 20,
              padding: 32,
              alignItems: "center",
              marginTop: 20,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <FileText
              color={theme.text.muted}
              size={48}
              style={{ marginBottom: 16 }}
            />
            <Text
              style={{
                fontFamily: "System",
                fontSize: 18,
                fontWeight: "600",
                color: theme.text.primary,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              No appraisals yet
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: theme.text.secondary,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Get started by scanning or entering a VIN
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/scan")}
              style={{
                backgroundColor: isDark ? "#FFF" : "#000",
                borderRadius: 16,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDark ? "#000" : "#FFF",
                }}
              >
                Scan VIN
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {appraisals.map((appraisal) => (
              <TouchableOpacity
                key={appraisal.id}
                onPress={() => router.push(`/appraisal/${appraisal.id}`)}
                style={{
                  backgroundColor: theme.card,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 18,
                    fontWeight: "600",
                    color: theme.text.primary,
                    marginBottom: 4,
                  }}
                >
                  {appraisal.vehicle_data?.year} {appraisal.vehicle_data?.make}{" "}
                  {appraisal.vehicle_data?.model}
                </Text>
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 12,
                    color: theme.text.muted,
                    marginBottom: 16,
                  }}
                >
                  VIN: {appraisal.vin}
                </Text>

                {appraisal.vehicle_data?.price && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <DollarSign
                      color={theme.success}
                      size={16}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 16,
                        fontWeight: "600",
                        color: theme.text.primary,
                      }}
                    >
                      ${appraisal.vehicle_data.price.toLocaleString()}
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Calendar
                    color={theme.text.muted}
                    size={14}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: "System",
                      fontSize: 12,
                      color: theme.text.muted,
                    }}
                  >
                    {new Date(appraisal.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
