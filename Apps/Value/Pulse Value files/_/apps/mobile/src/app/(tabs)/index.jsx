import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Camera,
  FileText,
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Search,
  Calendar,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme, getTheme } from "@/utils/theme/useTheme";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useTheme((state) => state.isDark);
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

  // Calculate stats
  const totalAppraisals = appraisals.length;
  const totalValue = appraisals.reduce(
    (sum, a) => sum + (a.vehicle_data?.price || 0),
    0,
  );
  const avgValue = totalAppraisals > 0 ? totalValue / totalAppraisals : 0;

  // Activity Feed Data
  const activityFeed = [
    {
      id: 1,
      type: "appraisal",
      icon: FileText,
      color: theme.accent,
      title: "New appraisal completed",
      description: appraisals[0]
        ? `${appraisals[0].vehicle_data?.year} ${appraisals[0].vehicle_data?.make} ${appraisals[0].vehicle_data?.model}`
        : "Recent appraisal",
      time: "5 minutes ago",
    },
    {
      id: 2,
      type: "trend",
      icon: TrendingUp,
      color: theme.warning,
      title: "Market alert",
      description: "SUV segment up 12% this week",
      time: "23 minutes ago",
    },
    {
      id: 3,
      type: "success",
      icon: CheckCircle,
      color: theme.success,
      title: "Deal closed",
      description: "Vehicle sold at target margin",
      time: "1 hour ago",
    },
  ];

  const quickActions = [
    {
      title: "Scan VIN",
      description: "Use camera to scan",
      icon: Camera,
      color: theme.accent,
      onPress: () => router.push("/scan"),
      primary: true,
    },
    {
      title: "Analytics",
      description: "View market trends",
      icon: BarChart3,
      color: theme.warning,
      onPress: () => router.push("/analytics"),
      primary: false,
    },
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.text.primary}
          />
        }
      >
        <View style={{ padding: 24 }}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 32,
                fontWeight: "700",
                color: theme.text.primary,
                marginBottom: 8,
              }}
            >
              Dashboard
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 16,
                color: theme.text.secondary,
              }}
            >
              Real-time overview of your activity
            </Text>
          </View>

          {/* Stats Overview */}
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
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: `${theme.accent}33`,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <FileText color={theme.accent} size={20} />
                </View>
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 14,
                    color: theme.text.secondary,
                  }}
                >
                  Total Appraisals
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
                {totalAppraisals}
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
                    marginBottom: 12,
                  }}
                >
                  <DollarSign color={theme.success} size={20} />
                  <Text
                    style={{
                      fontFamily: "System",
                      fontSize: 12,
                      color: theme.text.secondary,
                      marginLeft: 8,
                    }}
                  >
                    Total Value
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 20,
                    fontWeight: "700",
                    color: theme.text.primary,
                  }}
                >
                  ${(totalValue / 1000).toFixed(0)}k
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
                    marginBottom: 12,
                  }}
                >
                  <TrendingUp color={theme.warning} size={20} />
                  <Text
                    style={{
                      fontFamily: "System",
                      fontSize: 12,
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
                    fontSize: 20,
                    fontWeight: "700",
                    color: theme.text.primary,
                  }}
                >
                  ${(avgValue / 1000).toFixed(0)}k
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 20,
                fontWeight: "600",
                color: theme.text.primary,
                marginBottom: 16,
              }}
            >
              Quick Actions
            </Text>
            <View style={{ gap: 12 }}>
              {quickActions.map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={action.onPress}
                  style={{
                    backgroundColor: action.primary ? theme.accent : theme.card,
                    borderRadius: 20,
                    padding: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: action.primary ? 0 : 1,
                    borderColor: theme.border,
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: action.primary
                        ? `${theme.background}33`
                        : `${action.color}33`,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                    }}
                  >
                    <action.icon
                      color={action.primary ? theme.background : action.color}
                      size={24}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 16,
                        fontWeight: "600",
                        color: action.primary
                          ? theme.background
                          : theme.text.primary,
                        marginBottom: 4,
                      }}
                    >
                      {action.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 14,
                        color: action.primary
                          ? `${theme.background}CC`
                          : theme.text.secondary,
                      }}
                    >
                      {action.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Activity Feed */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 20,
                fontWeight: "600",
                color: theme.text.primary,
                marginBottom: 16,
              }}
            >
              Activity Feed
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
              {activityFeed.map((item, idx) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    paddingBottom: idx < activityFeed.length - 1 ? 16 : 0,
                    marginBottom: idx < activityFeed.length - 1 ? 16 : 0,
                    borderBottomWidth: idx < activityFeed.length - 1 ? 1 : 0,
                    borderBottomColor: theme.border,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: `${item.color}33`,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <item.icon color={item.color} size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 14,
                        fontWeight: "600",
                        color: theme.text.primary,
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 12,
                        color: theme.text.secondary,
                        marginBottom: 8,
                      }}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Clock color={theme.text.muted} size={12} />
                      <Text
                        style={{
                          fontFamily: "System",
                          fontSize: 11,
                          color: theme.text.muted,
                          marginLeft: 4,
                        }}
                      >
                        {item.time}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Appraisals */}
          <View>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 20,
                fontWeight: "600",
                color: theme.text.primary,
                marginBottom: 16,
              }}
            >
              Recent Appraisals
            </Text>

            {loading ? (
              <View
                style={{
                  backgroundColor: theme.card,
                  borderRadius: 20,
                  padding: 40,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 16,
                    color: theme.text.secondary,
                  }}
                >
                  Loading...
                </Text>
              </View>
            ) : appraisals.length === 0 ? (
              <View
                style={{
                  backgroundColor: theme.card,
                  borderRadius: 20,
                  padding: 32,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Search color={theme.text.muted} size={48} />
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 18,
                    fontWeight: "600",
                    color: theme.text.primary,
                    marginTop: 16,
                    marginBottom: 8,
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
                  Get started by scanning a VIN
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/scan")}
                  style={{
                    backgroundColor: theme.accent,
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
                      color: theme.background,
                    }}
                  >
                    Scan VIN
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                {appraisals.slice(0, 4).map((appraisal) => (
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
                        fontSize: 16,
                        fontWeight: "600",
                        color: theme.text.primary,
                        marginBottom: 4,
                      }}
                    >
                      {appraisal.vehicle_data?.year}{" "}
                      {appraisal.vehicle_data?.make}{" "}
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
                      VIN: {appraisal.vin.slice(-8)}
                    </Text>

                    {appraisal.vehicle_data?.price && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <DollarSign color={theme.success} size={16} />
                          <Text
                            style={{
                              fontFamily: "System",
                              fontSize: 18,
                              fontWeight: "700",
                              color: theme.text.primary,
                              marginLeft: 4,
                            }}
                          >
                            ${appraisal.vehicle_data.price.toLocaleString()}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Calendar color={theme.text.muted} size={12} />
                          <Text
                            style={{
                              fontFamily: "System",
                              fontSize: 11,
                              color: theme.text.muted,
                              marginLeft: 4,
                            }}
                          >
                            {new Date(
                              appraisal.created_at,
                            ).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
