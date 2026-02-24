"use client";
import { useState, useEffect } from "react";
import {
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Tag,
  Upload,
  Image,
  Loader2,
  Moon,
  Sun,
  Target,
} from "lucide-react";
import useUpload from "@/utils/useUpload";
import { useTheme } from "@/utils/useTheme";

const RADIUS_OPTIONS = [
  { value: 25, label: "25 miles", description: "Very local market" },
  { value: 50, label: "50 miles", description: "Local region" },
  { value: 100, label: "100 miles", description: "Regional market" },
  { value: 150, label: "150 miles", description: "Extended region" },
  { value: 200, label: "200 miles", description: "Broad market" },
  { value: 300, label: "300 miles", description: "Multi-state area" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    company_name: "",
    tagline: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    logo_url: "",
    zip_code: "",
    market_search_radius: 100,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { upload, uploading } = useUpload();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = await upload(file);
      setSettings({ ...settings, logo_url: uploadedUrl });
      setMessage("Logo uploaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setMessage("Failed to upload logo");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] dark:bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#06b6d4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] dark:bg-white font-inter antialiased">
      {/* Header */}
      <header className="bg-slate-900 dark:bg-gray-50 border-b border-slate-800 dark:border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            <span className="text-3xl">📡</span>
            <div>
              <h1 className="text-2xl font-bold text-white dark:text-gray-900 tracking-tight">
                PULSE <span className="text-[#06b6d4]">APPRAISING</span>
              </h1>
              <p className="text-xs text-slate-400 dark:text-gray-600 font-medium">
                REAL-TIME MARKET INTELLIGENCE
              </p>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-[#1E293B] dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-lg border border-slate-700 dark:border-gray-300 hover:border-[#06b6d4] transition-all"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white dark:text-gray-900 mb-2">
            Settings
          </h2>
          <p className="text-slate-400 dark:text-gray-600">
            Customize your appearance and company information
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${message.includes("Error") || message.includes("Failed") ? "bg-red-500/10 border border-red-500/50 text-red-400" : "bg-[#10b981]/10 border border-[#10b981]/50 text-[#10b981]"}`}
          >
            {message}
          </div>
        )}

        {/* Appearance Section */}
        <div className="bg-[#1E293B] dark:bg-white rounded-xl border border-slate-700 dark:border-gray-200 p-8 mb-6">
          <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-6">
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="w-5 h-5 text-slate-400 dark:text-gray-600" />
              ) : (
                <Sun className="w-5 h-5 text-slate-400 dark:text-gray-600" />
              )}
              <div>
                <p className="text-white dark:text-gray-900 font-medium">
                  {isDark ? "Dark Mode" : "Light Mode"}
                </p>
                <p className="text-sm text-slate-400 dark:text-gray-600">
                  Toggle between light and dark themes
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? "bg-[#06b6d4]" : "bg-gray-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>

        {/* Market Data Settings */}
        <div className="bg-[#1E293B] dark:bg-white rounded-xl border border-slate-700 dark:border-gray-200 p-8 mb-6">
          <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-6">
            Market Data
          </h3>

          {/* Search Radius */}
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-600 mb-3">
              <Target className="w-4 h-4" />
              Market Search Radius
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {RADIUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      market_search_radius: option.value,
                    })
                  }
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    settings.market_search_radius === option.value
                      ? "border-[#06b6d4] bg-[#06b6d4]/10"
                      : "border-slate-600 dark:border-gray-300 hover:border-slate-500 dark:hover:border-gray-400"
                  }`}
                >
                  <div className="text-white dark:text-gray-900 font-semibold">
                    {option.label}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-gray-600 mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-3">
              Controls how far from your ZIP code to search for comparable
              vehicles and market data
            </p>
          </div>
        </div>

        {/* Company Settings */}
        <div className="bg-[#1E293B] dark:bg-white rounded-xl border border-slate-700 dark:border-gray-200 p-8">
          <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-6">
            Company Information
          </h3>
          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-600 mb-3">
                <Image className="w-4 h-4" />
                Company Logo
              </label>
              <div className="flex items-center gap-6">
                {settings.logo_url && (
                  <div className="w-32 h-32 bg-[#0B1120] dark:bg-gray-100 rounded-lg border border-slate-600 dark:border-gray-300 flex items-center justify-center overflow-hidden">
                    <img
                      src={settings.logo_url}
                      alt="Company Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-[#06b6d4] text-white px-6 py-3 rounded-lg hover:bg-[#0891b2] transition-all">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-2">
                    Recommended: Square image, at least 200x200px
                  </p>
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-600 mb-2">
                <Building2 className="w-4 h-4" />
                Company Name
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) =>
                  setSettings({ ...settings, company_name: e.target.value })
                }
                placeholder="Pulse Appraising"
                className="w-full bg-[#0B1120] dark:bg-gray-50 text-white dark:text-gray-900 px-4 py-3 rounded-lg border border-slate-600 dark:border-gray-300 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-600 mb-2">
                <Tag className="w-4 h-4" />
                Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) =>
                  setSettings({ ...settings, tagline: e.target.value })
                }
                placeholder="Real-Time Market Intelligence"
                className="w-full bg-[#0B1120] dark:bg-gray-50 text-white dark:text-gray-900 px-4 py-3 rounded-lg border border-slate-600 dark:border-gray-300 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-600 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
                placeholder="contact@pulseappraising.com"
                className="w-full bg-[#0B1120] dark:bg-gray-50 text-white dark:text-gray-900 px-4 py-3 rounded-lg border border-slate-600 dark:border-gray-300 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-600 mb-2">
                <Phone className="w-4 h-4" />
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
                className="w-full bg-[#0B1120] dark:bg-gray-50 text-white dark:text-gray-900 px-4 py-3 rounded-lg border border-slate-600 dark:border-gray-300 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                Address
              </label>
              <textarea
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                placeholder="123 Main St, City, State 12345"
                rows={3}
                className="w-full bg-[#0B1120] dark:bg-gray-50 text-white dark:text-gray-900 px-4 py-3 rounded-lg border border-slate-600 dark:border-gray-300 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
              />
            </div>

            {/* ZIP Code */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                ZIP Code
              </label>
              <input
                type="text"
                value={settings.zip_code || ""}
                onChange={(e) =>
                  setSettings({ ...settings, zip_code: e.target.value })
                }
                placeholder="12345"
                maxLength={10}
                className="w-full bg-[#0B1120] dark:bg-gray-50 text-white dark:text-gray-900 px-4 py-3 rounded-lg border border-slate-600 dark:border-gray-300 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
              />
              <p className="text-xs text-slate-500 dark:text-gray-500 mt-2">
                Used for localized market data and days supply analysis
              </p>
            </div>

            {/* Website */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-600 mb-2">
                <Globe className="w-4 h-4" />
                Website
              </label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) =>
                  setSettings({ ...settings, website: e.target.value })
                }
                placeholder="https://www.pulseappraising.com"
                className="w-full bg-[#0B1120] dark:bg-gray-50 text-white dark:text-gray-900 px-4 py-3 rounded-lg border border-slate-600 dark:border-gray-300 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-slate-700 dark:border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#06b6d4] text-white px-6 py-4 rounded-lg hover:bg-[#0891b2] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
