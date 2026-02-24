import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme, getTheme } from "@/utils/theme/useTheme";
import { LineChart, PieChart } from "react-native-graph";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useTheme((state) => state.isDark);
  const theme = getTheme(isDark);

  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);

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
    }
  };

  // Calculate stats
  const totalAppraisals = appraisals.length;
  const totalValue = appraisals.reduce(
    (sum, a) => sum + (a.vehicle_data?.price || 0),
    0,
  );
  const avgValue = totalAppraisals > 0 ? totalValue / totalAppraisals : 0;

  // Mock trend data
  const trendData = [
    { month: "Jan", count: 12, value: 540 },
    { month: "Feb", count: 19, value: 850 },
    { month: "Mar", count: 15, value: 675 },
    { month: "Apr", count: 22, value: 990 },
    { month: "May", count: 28, value: 1260 },
    { month: "Jun", count: 24, value: 1080 },
  ];

  // Vehicle segments
  const segmentData = [
    { name: "Luxury SUV", value: 35, color: theme.accent },
    { name: "Sedan", value: 25, color: theme.success },
    { name: "EV/Hybrid", value: 20, color: theme.warning },
    { name: "Truck", value: 15, color: "#8b5cf6" },
    { name: "Other", value: 5, color: theme.danger },
  ];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          padding: 24,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft color={theme.text.secondary} size={20} />
          <Text
            style={{
              fontFamily: "System",
              fontSize: 14,
              color: theme.text.secondary,
              marginLeft: 8,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <BarChart3 color={theme.accent} size={28} />
          <Text
            style={{
              fontFamily: "System",
              fontSize: 28,
              fontWeight: "700",
              color: theme.text.primary,
              marginLeft: 12,
            }}
          >
            Analytics
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "System",
            fontSize: 14,
            color: theme.text.secondary,
            marginTop: 4,
          }}
        >
          Market trends and insights
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 24 }}>
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Activity color={theme.accent} size={48} />
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 16,
                  color: theme.text.secondary,
                  marginTop: 16,
                }}
              >
                Loading analytics...
              </Text>
            </View>
          ) : (
            <>
              {/* Key Metrics */}
              <View style={{ marginBottom: 32, gap: 16 }}>
                <View
                  style={{
                    backgroundColor: theme.card,
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Calendar color={theme.accent} size={18} />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 12,
                        color: theme.text.secondary,
                        marginLeft: 8,
                      }}
                    >
                      This Month
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "System",
                      fontSize: 32,
                      fontWeight: "700",
                      color: theme.text.primary,
                    }}
                  >
                    {trendData[trendData.length - 1]?.count || 0}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "System",
                      fontSize: 11,
                      color: theme.text.muted,
                      marginTop: 4,
                    }}
                  >
                    Appraisals
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 16 }}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: theme.card,
                      borderRadius: 20,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <TrendingUp color={theme.success} size={18} />
                      <Text
                        style={{
                          fontFamily: "System",
                          fontSize: 11,
                          color: theme.text.secondary,
                          marginLeft: 8,
                        }}
                      >
                        Growth
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 28,
                        fontWeight: "700",
                        color: theme.success,
                      }}
                    >
                      +27%
                    </Text>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 10,
                        color: theme.text.muted,
                        marginTop: 4,
                      }}
                    >
                      vs. Last Month
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      backgroundColor: theme.card,
                      borderRadius: 20,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <DollarSign color={theme.warning} size={18} />
                      <Text
                        style={{
                          fontFamily: "System",
                          fontSize: 11,
                          color: theme.text.secondary,
                          marginLeft: 8,
                        }}
                      >
                        Avg Value
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 28,
                        fontWeight: "700",
                        color: theme.text.primary,
                      }}
                    >
                      ${(avgValue / 1000).toFixed(0)}k
                    </Text>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 10,
                        color: theme.text.muted,
                        marginTop: 4,
                      }}
                    >
                      Per Appraisal
                    </Text>
                  </View>
                </View>
              </View>

              {/* Monthly Trend */}
              <View style={{ marginBottom: 32 }}>
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 18,
                    fontWeight: "600",
                    color: theme.text.primary,
                    marginBottom: 16,
                  }}
                >
                  Appraisal Volume Trend
                </Text>
                <View
                  style={{
                    backgroundColor: theme.card,
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    {trendData.map((item, idx) => (
                      <View key={idx} style={{ alignItems: "center" }}>
                        <View
                          style={{
                            height: 120,
                            width: 40,
                            backgroundColor: `${theme.accent}22`,
                            borderRadius: 8,
                            justifyContent: "flex-end",
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              height: `${(item.count / 30) * 100}%`,
                              backgroundColor: theme.accent,
                              borderRadius: 8,
                            }}
                          />
                        </View>
                        <Text
                          style={{
                            fontFamily: "System",
                            fontSize: 11,
                            color: theme.text.muted,
                            marginTop: 8,
                          }}
                        >
                          {item.month}
                        </Text>
                        <Text
                          style={{
                            fontFamily: "System",
                            fontSize: 12,
                            fontWeight: "600",
                            color: theme.text.primary,
                          }}
                        >
                          {item.count}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Vehicle Segments */}
              <View style={{ marginBottom: 32 }}>
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 18,
                    fontWeight: "600",
                    color: theme.text.primary,
                    marginBottom: 16,
                  }}
                >
                  Vehicle Segment Breakdown
                </Text>
                <View
                  style={{
                    backgroundColor: theme.card,
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  {segmentData.map((segment, idx) => (
                    <View
                      key={idx}
                      style={{
                        marginBottom: idx < segmentData.length - 1 ? 16 : 0,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: segment.color,
                              marginRight: 8,
                            }}
                          />
                          <Text
                            style={{
                              fontFamily: "System",
                              fontSize: 14,
                              color: theme.text.primary,
                            }}
                          >
                            {segment.name}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontFamily: "System",
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.text.primary,
                          }}
                        >
                          {segment.value}%
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 8,
                          backgroundColor: `${segment.color}22`,
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${segment.value}%`,
                            height: "100%",
                            backgroundColor: segment.color,
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Performance Insight */}
              <View
                style={{
                  backgroundColor: `${theme.success}22`,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: `${theme.success}55`,
                }}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 14,
                    color: theme.success,
                    fontWeight: "600",
                  }}
                >
                  ✓ Great performance!
                </Text>
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 13,
                    color: theme.success,
                    marginTop: 8,
                    lineHeight: 18,
                  }}
                >
                  You're outperforming market averages across all key metrics
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
