import {
  Cpu,
  Fuel,
  Settings,
  Shield,
  Zap,
  Star,
  Package,
  Info,
} from "lucide-react";

export function EnhancedSpecifications({ vehicle }) {
  const specs = vehicle.specifications || vehicle.specs || {};
  const features = vehicle.features || vehicle.packages || [];
  const safetyRatings = vehicle.safety_ratings || {};

  // Build engine specs
  const engineSpecs = [
    { label: "Engine", value: vehicle.engine || specs.engine || null },
    { label: "Cylinders", value: vehicle.cylinders || specs.cylinders || null },
    {
      label: "Displacement",
      value: vehicle.displacement || specs.displacement || null,
    },
    {
      label: "Horsepower",
      value: vehicle.horsepower || specs.horsepower || null,
    },
    { label: "Torque", value: vehicle.torque || specs.torque || null },
    {
      label: "Transmission",
      value: vehicle.transmission || specs.transmission || null,
    },
    {
      label: "Drive Type",
      value: vehicle.drive_type || vehicle.drivetrain || specs.drive_type || null,
    },
  ].filter((s) => s.value);

  // Build fuel/efficiency specs
  const fuelSpecs = [
    {
      label: "Fuel Type",
      value: vehicle.fuel_type || specs.fuel_type || null,
    },
    { label: "MPG City", value: vehicle.mpg_city || specs.mpg_city || null },
    {
      label: "MPG Highway",
      value: vehicle.mpg_highway || specs.mpg_highway || null,
    },
    {
      label: "MPG Combined",
      value: vehicle.mpg_combined || specs.mpg_combined || null,
    },
    {
      label: "Fuel Capacity",
      value: vehicle.fuel_capacity || specs.fuel_capacity || null,
    },
    {
      label: "Range",
      value: vehicle.range_miles || specs.range || null,
    },
  ].filter((s) => s.value);

  // Build dimensions
  const dimensionSpecs = [
    {
      label: "Body Style",
      value: vehicle.body_style || vehicle.body_type || specs.body_style || null,
    },
    { label: "Doors", value: vehicle.doors || specs.doors || null },
    {
      label: "Seating",
      value: vehicle.seating_capacity || specs.seating || null,
    },
    {
      label: "Cargo Volume",
      value: vehicle.cargo_volume || specs.cargo_volume || null,
    },
    { label: "GVWR", value: vehicle.gvwr || specs.gvwr || null },
    {
      label: "Towing Capacity",
      value: vehicle.towing_capacity || specs.towing_capacity || null,
    },
  ].filter((s) => s.value);

  // Safety ratings
  const safetyItems = [
    { label: "Overall", value: safetyRatings.overall || null },
    { label: "Front Crash", value: safetyRatings.front_crash || null },
    { label: "Side Crash", value: safetyRatings.side_crash || null },
    { label: "Rollover", value: safetyRatings.rollover || null },
    { label: "IIHS Rating", value: safetyRatings.iihs || null },
  ].filter((s) => s.value);

  const hasAnyData =
    engineSpecs.length > 0 ||
    fuelSpecs.length > 0 ||
    dimensionSpecs.length > 0 ||
    features.length > 0 ||
    safetyItems.length > 0;

  if (!hasAnyData) {
    return null; // Don't render if no enhanced spec data
  }

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
        <Info className="w-5 h-5 text-[#06b6d4]" />
        Enhanced Specifications
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {engineSpecs.length > 0 && (
          <SpecSection title="Engine & Performance" icon={Cpu} specs={engineSpecs} />
        )}
        {fuelSpecs.length > 0 && (
          <SpecSection title="Fuel & Efficiency" icon={Fuel} specs={fuelSpecs} />
        )}
        {dimensionSpecs.length > 0 && (
          <SpecSection title="Dimensions & Capacity" icon={Settings} specs={dimensionSpecs} />
        )}
        {safetyItems.length > 0 && (
          <SafetySection ratings={safetyItems} />
        )}
      </div>

      {features.length > 0 && (
        <div className="mt-6">
          <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#06b6d4]" />
            Features & Packages
          </h4>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, idx) => (
              <span
                key={idx}
                className="bg-[#0B1120] text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700"
              >
                {typeof feature === "string" ? feature : feature.name || feature.description || ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SpecSection({ title, icon: Icon, specs }) {
  return (
    <div className="bg-[#0B1120] rounded-lg p-4 border border-slate-700/50">
      <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#06b6d4]" />
        {title}
      </h4>
      <div className="space-y-2">
        {specs.map((spec, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-xs text-slate-400">{spec.label}</span>
            <span className="text-xs text-white font-medium">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SafetySection({ ratings }) {
  const renderStars = (value) => {
    if (typeof value === "number") {
      return (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3 h-3 ${
                star <= value ? "text-amber-400 fill-amber-400" : "text-slate-600"
              }`}
            />
          ))}
        </div>
      );
    }
    return <span className="text-xs text-white font-medium">{value}</span>;
  };

  return (
    <div className="bg-[#0B1120] rounded-lg p-4 border border-slate-700/50">
      <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#06b6d4]" />
        Safety Ratings
      </h4>
      <div className="space-y-2">
        {ratings.map((rating, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-xs text-slate-400">{rating.label}</span>
            {renderStars(rating.value)}
          </div>
        ))}
      </div>
    </div>
  );
}
