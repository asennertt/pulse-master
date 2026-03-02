"use client";
import { useState, useEffect } from "react";
import {
  Save,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Image,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Radar,
} from "lucide-react";

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
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      setSettings({
        company_name: data.company_name || "",
        tagline: data.tagline || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        website: data.website || "",
        logo_url: data.logo_url || "",
        zip_code: data.zip_code || "",
        market_search_radius: data.market_search_radius || 100,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to save");

      setMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00D9FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] font-inter antialiased">
      {/* Header */}
      <header className="bg-[#0F1419] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            <div className="w-10 h-10 relative">
              <svg viewBox="0 0 48 48" className="w-full h-full">
                <path
                  d="M 2,24 L 12,24 L 16,12 L 22,36 L 28,18 L 32,28 L 36,24 L 46,24"
                  stroke="#00D9FF"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 8px rgba(0, 217, 255, 0.6))" }}
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">
              <span style={{ color: "#00D9FF" }}>PULSE</span> APPRAISING
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#00D9FF] text-[#0F1419] font-bold px-6 py-3 rounded-lg hover:bg-[#00C3E6] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </header>

      <div className="pt-10 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400 mb-10">Manage your company information and preferences</p>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-[#10b981]/10 border border-[#10b981] text-[#10b981]"
                  : "bg-[#ef4444]/10 border border-[#ef4444] text-[#ef4444]"
              }`}
            >
              {message.type === "success" ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Company Name */}
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <label className="flex items-center gap-2 font-semibold text-white mb-3">
                <Building2 className="w-4 h-4 text-[#00D9FF]" />
                Company Name
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) =>
                  setSettings({ ...settings, company_name: e.target.value })
                }
                placeholder="Your company name"
                className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>

            {/* Tagline */}
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <label className="flex items-center gap-2 font-semibold text-white mb-3">
                <FileText className="w-4 h-4 text-[#00D9FF]" />
                Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) =>
                  setSettings({ ...settings, tagline: e.target.value })
                }
                placeholder="Your company tagline"
                className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>

            {/* Email */}
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <label className="flex items-center gap-2 font-semibold text-white mb-3">
                <Mail className="w-4 h-4 text-[#00D9FF]" />
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
                placeholder="company@example.com"
                className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <label className="flex items-center gap-2 font-semibold text-white mb-3">
                <Phone className="w-4 h-4 text-[#00D9FF]" />
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
                placeholder="(555) 000-0000"
                className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>

            {/* Address */}
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <label className="flex items-center gap-2 font-semibold text-white mb-3">
                <MapPin className="w-4 h-4 text-[#00D9FF]" />
                Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                placeholder="123 Main St, City, State 00000"
                className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>

            {/* Website */}
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <label className="flex items-center gap-2 font-semibold text-white mb-3">
                <Globe className="w-4 h-4 text-[#00D9FF]" />
                Website
              </label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) =>
                  setSettings({ ...settings, website: e.target.value })
                }
                placeholder="https://yourcompany.com"
                className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>

            {/* Logo URL */}
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <label className="flex items-center gap-2 font-semibold text-white mb-3">
                <Image className="w-4 h-4 text-[#00D9FF]" />
                Logo URL
              </label>
              <input
                type="url"
                value={settings.logo_url}
                onChange={(e) =>
                  setSettings({ ...settings, logo_url: e.target.value })
                }
                placeholder="https://yourcompany.com/logo.png"
                className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:outline-none"
              />
              {settings.logo_url && (
                <div className="mt-3">
                  <img
                    src={settings.logo_url}
                    alt="Logo preview"
                    className="h-16 object-contain rounded"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}
            </div>

            {/* ZIP Code */}
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <label className="flex items-center gap-2 font-semibold text-white mb-3">
                <MapPin className="w-4 h-4 text-[#00D9FF]" />
                Default ZIP Code
              </label>
              <input
                type="text"
                value={settings.zip_code}
                onChange={(e) =>
                  setSettings({ ...settings, zip_code: e.target.value })
                }
                placeholder="12345"
                maxLength={10}
                className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                Used for market comparisons and local pricing data
              </p>
            </div>

            {/* Market Search Radius */}
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
              <label className="flex items-center gap-2 font-semibold text-white mb-3">
                <Radar className="w-4 h-4 text-[#00D9FF]" />
                Market Search Radius
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="25"
                  max="500"
                  step="25"
                  value={settings.market_search_radius}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      market_search_radius: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 accent-[#00D9FF]"
                />
                <span className="text-white font-bold w-20 text-right">
                  {settings.market_search_radius} miles
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                How far to search for comparable market listings
              </p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#00D9FF] text-[#0F1419] font-bold py-4 rounded-lg hover:bg-[#00C3E6] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
