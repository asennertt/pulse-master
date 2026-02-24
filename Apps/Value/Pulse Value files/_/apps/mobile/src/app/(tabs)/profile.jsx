import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  User,
  Mail,
  Settings,
  Moon,
  Sun,
  Phone,
  MapPin,
  Building2,
  Tag,
  Globe,
  Save,
} from "lucide-react-native";
import { useTheme, getTheme } from "@/utils/theme/useTheme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const theme = getTheme(isDark);

  const [settings, setSettings] = useState({
    company_name: "",
    tagline: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    zip_code: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/settings`,
      );
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error(error);
      setMessage("Error loading settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        },
      );

      if (!response.ok) throw new Error("Failed to save settings");

      setMessage("Settings saved successfully! ✓");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setMessage("Failed to save settings");
    } finally {
      setSaving(false);
    }
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
              color: theme.text.primary,
              marginBottom: 32,
            }}
          >
            Profile
          </Text>

          {/* Message */}
          {message && (
            <View
              style={{
                backgroundColor:
                  message.includes("Error") || message.includes("Failed")
                    ? `${theme.danger}22`
                    : `${theme.success}22`,
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor:
                  message.includes("Error") || message.includes("Failed")
                    ? `${theme.danger}55`
                    : `${theme.success}55`,
              }}
            >
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 14,
                  color:
                    message.includes("Error") || message.includes("Failed")
                      ? theme.danger
                      : theme.success,
                }}
              >
                {message}
              </Text>
            </View>
          )}

          {/* Profile Info */}
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: isDark ? "#FFF" : "#000",
                borderRadius: 40,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <User color={isDark ? "#000" : "#FFF"} size={40} />
            </View>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 20,
                fontWeight: "600",
                color: theme.text.primary,
                marginBottom: 4,
              }}
            >
              Dealership User
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: theme.text.secondary,
              }}
            >
              Pulse Appraising
            </Text>
          </View>

          {/* Contact Info */}
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 16,
                fontWeight: "600",
                color: theme.text.primary,
                marginBottom: 16,
              }}
            >
              Contact
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Mail
                color={theme.text.secondary}
                size={20}
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 14,
                  color: theme.text.secondary,
                }}
              >
                support@pulseappraising.com
              </Text>
            </View>
          </View>

          {/* Theme Toggle */}
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 16,
                fontWeight: "600",
                color: theme.text.primary,
                marginBottom: 16,
              }}
            >
              Appearance
            </Text>
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
                {isDark ? (
                  <Moon
                    color={theme.text.secondary}
                    size={20}
                    style={{ marginRight: 12 }}
                  />
                ) : (
                  <Sun
                    color={theme.text.secondary}
                    size={20}
                    style={{ marginRight: 12 }}
                  />
                )}
                <Text
                  style={{
                    fontFamily: "System",
                    fontSize: 14,
                    color: theme.text.secondary,
                  }}
                >
                  {isDark ? "Dark Mode" : "Light Mode"}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#D1D5DB", true: theme.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Company Settings */}
          {loading ? (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                padding: 40,
                alignItems: "center",
                borderWidth: 1,
                borderColor: theme.border,
                marginBottom: 24,
              }}
            >
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: theme.border,
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 16,
                  fontWeight: "600",
                  color: theme.text.primary,
                  marginBottom: 20,
                }}
              >
                Company Information
              </Text>

              <View style={{ gap: 16 }}>
                {/* Company Name */}
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Building2 color={theme.text.secondary} size={14} />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 11,
                        color: theme.text.secondary,
                        marginLeft: 6,
                      }}
                    >
                      Company Name
                    </Text>
                  </View>
                  <TextInput
                    value={settings.company_name}
                    onChangeText={(text) =>
                      setSettings({ ...settings, company_name: text })
                    }
                    placeholder="Pulse Appraising"
                    placeholderTextColor={theme.text.muted}
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.text.primary,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                      fontFamily: "System",
                      fontSize: 14,
                    }}
                  />
                </View>

                {/* Tagline */}
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Tag color={theme.text.secondary} size={14} />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 11,
                        color: theme.text.secondary,
                        marginLeft: 6,
                      }}
                    >
                      Tagline
                    </Text>
                  </View>
                  <TextInput
                    value={settings.tagline}
                    onChangeText={(text) =>
                      setSettings({ ...settings, tagline: text })
                    }
                    placeholder="Real-Time Market Intelligence"
                    placeholderTextColor={theme.text.muted}
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.text.primary,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                      fontFamily: "System",
                      fontSize: 14,
                    }}
                  />
                </View>

                {/* Email */}
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Mail color={theme.text.secondary} size={14} />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 11,
                        color: theme.text.secondary,
                        marginLeft: 6,
                      }}
                    >
                      Email
                    </Text>
                  </View>
                  <TextInput
                    value={settings.email}
                    onChangeText={(text) =>
                      setSettings({ ...settings, email: text })
                    }
                    placeholder="contact@pulseappraising.com"
                    placeholderTextColor={theme.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.text.primary,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                      fontFamily: "System",
                      fontSize: 14,
                    }}
                  />
                </View>

                {/* Phone */}
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Phone color={theme.text.secondary} size={14} />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 11,
                        color: theme.text.secondary,
                        marginLeft: 6,
                      }}
                    >
                      Phone
                    </Text>
                  </View>
                  <TextInput
                    value={settings.phone}
                    onChangeText={(text) =>
                      setSettings({ ...settings, phone: text })
                    }
                    placeholder="(555) 123-4567"
                    placeholderTextColor={theme.text.muted}
                    keyboardType="phone-pad"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.text.primary,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                      fontFamily: "System",
                      fontSize: 14,
                    }}
                  />
                </View>

                {/* Address */}
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <MapPin color={theme.text.secondary} size={14} />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 11,
                        color: theme.text.secondary,
                        marginLeft: 6,
                      }}
                    >
                      Address
                    </Text>
                  </View>
                  <TextInput
                    value={settings.address}
                    onChangeText={(text) =>
                      setSettings({ ...settings, address: text })
                    }
                    placeholder="123 Main St, City, State 12345"
                    placeholderTextColor={theme.text.muted}
                    multiline
                    numberOfLines={2}
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.text.primary,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                      fontFamily: "System",
                      fontSize: 14,
                      textAlignVertical: "top",
                    }}
                  />
                </View>

                {/* ZIP Code */}
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <MapPin color={theme.text.secondary} size={14} />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 11,
                        color: theme.text.secondary,
                        marginLeft: 6,
                      }}
                    >
                      ZIP Code
                    </Text>
                  </View>
                  <TextInput
                    value={settings.zip_code || ""}
                    onChangeText={(text) =>
                      setSettings({ ...settings, zip_code: text })
                    }
                    placeholder="12345"
                    placeholderTextColor={theme.text.muted}
                    keyboardType="numeric"
                    maxLength={10}
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.text.primary,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                      fontFamily: "System",
                      fontSize: 14,
                    }}
                  />
                </View>

                {/* Website */}
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Globe color={theme.text.secondary} size={14} />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 11,
                        color: theme.text.secondary,
                        marginLeft: 6,
                      }}
                    >
                      Website
                    </Text>
                  </View>
                  <TextInput
                    value={settings.website}
                    onChangeText={(text) =>
                      setSettings({ ...settings, website: text })
                    }
                    placeholder="https://www.pulseappraising.com"
                    placeholderTextColor={theme.text.muted}
                    keyboardType="url"
                    autoCapitalize="none"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.text.primary,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                      fontFamily: "System",
                      fontSize: 14,
                    }}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: theme.accent,
                  borderRadius: 16,
                  paddingVertical: 14,
                  marginTop: 20,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  opacity: saving ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                {saving ? (
                  <>
                    <ActivityIndicator color={theme.background} size="small" />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 15,
                        fontWeight: "600",
                        color: theme.background,
                        marginLeft: 10,
                      }}
                    >
                      Saving...
                    </Text>
                  </>
                ) : (
                  <>
                    <Save color={theme.background} size={18} />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 15,
                        fontWeight: "600",
                        color: theme.background,
                        marginLeft: 10,
                      }}
                    >
                      Save Settings
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* About */}
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 16,
                fontWeight: "600",
                color: theme.text.primary,
                marginBottom: 16,
              }}
            >
              About
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: theme.text.secondary,
                lineHeight: 20,
                marginBottom: 12,
              }}
            >
              Pulse Appraising is a comprehensive vehicle appraisal platform
              designed for used car dealerships.
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 12,
                color: theme.text.muted,
              }}
            >
              Version 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
