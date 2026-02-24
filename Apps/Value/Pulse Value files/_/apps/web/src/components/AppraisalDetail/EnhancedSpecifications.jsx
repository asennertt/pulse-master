import { Ruler, Shield, FileText, Globe, Wrench } from "lucide-react";

export function EnhancedSpecifications({ vehicle }) {
  const dimensions = vehicle.dimensions || {};
  const safetyRatings = vehicle.safety_ratings || {};
  const warranty = vehicle.warranty || {};

  const hasDimensions = Object.values(dimensions).some((v) => v != null);
  const hasSafety = Object.values(safetyRatings).some((v) => v != null);
  const hasWarranty = Object.values(warranty).some((v) => v != null);

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-6">
        <Wrench className="w-5 h-5 text-[#06b6d4]" />
        Enhanced Specifications
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dimensions & Capacity */}
        {hasDimensions && (
          <SpecSection
            title="Dimensions & Capacity"
            icon={Ruler}
            color="#06b6d4"
            items={[
              {
                label: "Wheelbase",
                value: dimensions.wheelbase ? `${dimensions.wheelbase}"` : null,
              },
              {
                label: "Length",
                value: dimensions.length ? `${dimensions.length}"` : null,
              },
              {
                label: "Width",
                value: dimensions.width ? `${dimensions.width}"` : null,
              },
              {
                label: "Height",
                value: dimensions.height ? `${dimensions.height}"` : null,
              },
              {
                label: "Curb Weight",
                value: dimensions.curb_weight
                  ? `${dimensions.curb_weight.toLocaleString()} lbs`
                  : null,
              },
              {
                label: "Cargo Volume",
                value: dimensions.cargo_volume
                  ? `${dimensions.cargo_volume} cu ft`
                  : null,
              },
              {
                label: "Passenger Volume",
                value: dimensions.passenger_volume
                  ? `${dimensions.passenger_volume} cu ft`
                  : null,
              },
              {
                label: "Ground Clearance",
                value: dimensions.ground_clearance
                  ? `${dimensions.ground_clearance}"`
                  : null,
              },
              {
                label: "Towing Capacity",
                value: dimensions.towing_capacity
                  ? `${dimensions.towing_capacity.toLocaleString()} lbs`
                  : null,
              },
            ]}
          />
        )}

        {/* Safety Ratings */}
        {hasSafety && (
          <SpecSection
            title="Safety Ratings"
            icon={Shield}
            color="#10b981"
            items={[
              {
                label: "NHTSA Overall",
                value: safetyRatings.nhtsa_overall
                  ? `${safetyRatings.nhtsa_overall}/5 Stars`
                  : null,
              },
              {
                label: "NHTSA Frontal",
                value: safetyRatings.nhtsa_frontal
                  ? `${safetyRatings.nhtsa_frontal}/5 Stars`
                  : null,
              },
              {
                label: "NHTSA Side",
                value: safetyRatings.nhtsa_side
                  ? `${safetyRatings.nhtsa_side}/5 Stars`
                  : null,
              },
              {
                label: "NHTSA Rollover",
                value: safetyRatings.nhtsa_rollover
                  ? `${safetyRatings.nhtsa_rollover}/5 Stars`
                  : null,
              },
              {
                label: "IIHS Overall",
                value: safetyRatings.iihs_overall || null,
              },
              {
                label: "IIHS Moderate Overlap",
                value: safetyRatings.iihs_moderate_overlap || null,
              },
              {
                label: "IIHS Side Impact",
                value: safetyRatings.iihs_side || null,
              },
              {
                label: "IIHS Roof Strength",
                value: safetyRatings.iihs_roof_strength || null,
              },
            ]}
          />
        )}

        {/* Warranty Information */}
        {hasWarranty && (
          <SpecSection
            title="Warranty Coverage"
            icon={FileText}
            color="#8b5cf6"
            items={[
              {
                label: "Basic Warranty",
                value:
                  warranty.basic_years && warranty.basic_miles
                    ? `${warranty.basic_years} years / ${warranty.basic_miles.toLocaleString()} miles`
                    : null,
              },
              {
                label: "Powertrain Warranty",
                value:
                  warranty.powertrain_years && warranty.powertrain_miles
                    ? `${warranty.powertrain_years} years / ${warranty.powertrain_miles.toLocaleString()} miles`
                    : null,
              },
              {
                label: "Corrosion Warranty",
                value:
                  warranty.corrosion_years && warranty.corrosion_miles
                    ? `${warranty.corrosion_years} years / ${warranty.corrosion_miles.toLocaleString()} miles`
                    : null,
              },
            ]}
          />
        )}

        {/* Country of Origin */}
        {vehicle.country_of_origin && (
          <SpecSection
            title="Manufacturing"
            icon={Globe}
            color="#f59e0b"
            items={[
              { label: "Country of Origin", value: vehicle.country_of_origin },
            ]}
          />
        )}

        {/* Fuel Capacity */}
        {vehicle.fuel_capacity && (
          <div className="bg-[#0B1120] rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-[#06b6d4]" />
              <h4 className="text-sm font-semibold text-white">Fuel System</h4>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Fuel Tank Capacity</span>
              <span className="text-sm font-semibold text-slate-200">
                {vehicle.fuel_capacity} gallons
              </span>
            </div>
          </div>
        )}
      </div>

      {/* No enhanced specs available message */}
      {!hasDimensions &&
        !hasSafety &&
        !hasWarranty &&
        !vehicle.country_of_origin &&
        !vehicle.fuel_capacity && (
          <div className="bg-[#0B1120] rounded-lg p-6 text-center">
            <Wrench className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">
              Enhanced specifications not available for this vehicle
            </p>
          </div>
        )}
    </div>
  );
}

function SpecSection({ title, icon: Icon, color, items }) {
  // Filter out items with no value
  const validItems = items.filter(
    (item) => item.value != null && item.value !== "",
  );

  if (validItems.length === 0) return null;

  return (
    <div className="bg-[#0B1120] rounded-lg p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4" style={{ color }} />
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>

      <div className="space-y-2">
        {validItems.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-xs text-slate-400">{item.label}</span>
            <span className="text-sm font-semibold text-slate-200">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
