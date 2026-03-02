export function VehicleSpecifications({ vehicle, createdAt }) {
  // Helper function to safely extract string value from potentially object fields
  const safeValue = (value) => {
    if (!value) return null;
    if (typeof value === "object" && value !== null) {
      return value.name || value.code || value.base || null;
    }
    return value;
  };

  // Helper function specifically for MSRP which might be an object with base/msrp properties
  const safeMsrpValue = (msrp) => {
    if (!msrp) return null;
    if (typeof msrp === "object" && msrp !== null) {
      // Try to extract numeric value from object
      return msrp.base || msrp.msrp || null;
    }
    return msrp;
  };

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-bold text-lg mb-6">
        Complete Vehicle Specifications
      </h3>

      {/* Primary Specs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {vehicle.trim && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Trim</p>
            <p className="text-white font-medium">
              {safeValue(vehicle.trim) || "N/A"}
            </p>
          </div>
        )}
        {vehicle.body_type && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Body Type</p>
            <p className="text-white font-medium">
              {safeValue(vehicle.body_type)}
            </p>
          </div>
        )}
        {vehicle.exterior_color && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Exterior Color</p>
            <p className="text-white font-medium">
              {safeValue(vehicle.exterior_color)}
            </p>
          </div>
        )}
        {vehicle.interior_color && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Interior Color</p>
            <p className="text-white font-medium">
              {safeValue(vehicle.interior_color)}
            </p>
          </div>
        )}
        {vehicle.drivetrain && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Drivetrain</p>
            <p className="text-white font-medium">
              {safeValue(vehicle.drivetrain)}
            </p>
          </div>
        )}
        {vehicle.transmission && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Transmission</p>
            <p className="text-white font-medium">
              {safeValue(vehicle.transmission)}
            </p>
          </div>
        )}
        {vehicle.condition && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Condition</p>
            <p className="text-white font-medium capitalize">
              {safeValue(vehicle.condition)}
            </p>
          </div>
        )}
        <div>
          <p className="text-sm text-slate-400 mb-1">Status</p>
          <p className="text-[#10b981] font-medium">✓ Completed</p>
        </div>
      </div>

      {/* Engine & Performance */}
      {(vehicle.engine || vehicle.horsepower || vehicle.fuel_type) && (
        <>
          <div className="border-t border-slate-700 pt-6 mb-6">
            <h4 className="text-white font-semibold mb-4">
              Engine & Performance
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {vehicle.engine && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Engine</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.engine)}
                  </p>
                </div>
              )}
              {vehicle.horsepower && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Horsepower</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.horsepower)} HP
                  </p>
                </div>
              )}
              {vehicle.torque && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Torque</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.torque)} lb-ft
                  </p>
                </div>
              )}
              {vehicle.displacement && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Displacement</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.displacement)}
                  </p>
                </div>
              )}
              {vehicle.fuel_type && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Fuel Type</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.fuel_type)}
                  </p>
                </div>
              )}
              {vehicle.mpg_city && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">MPG City</p>
                  <p className="text-white font-medium">{vehicle.mpg_city}</p>
                </div>
              )}
              {vehicle.mpg_highway && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">MPG Highway</p>
                  <p className="text-white font-medium">
                    {vehicle.mpg_highway}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Features */}
      {vehicle.features && vehicle.features.length > 0 && (
        <div className="border-t border-slate-700 pt-6 mb-6">
          <h4 className="text-white font-semibold mb-4">Features & Options</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {vehicle.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full flex-shrink-0"></div>
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Data */}
      {(vehicle.msrp || vehicle.book_value) && (
        <div className="border-t border-slate-700 pt-6 mb-6">
          <h4 className="text-white font-semibold mb-4">Market & Pricing Data</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vehicle.msrp && (
              <div>
                <p className="text-sm text-slate-400 mb-1">MSRP</p>
                <p className="text-white font-medium">
                  ${(safeMsrpValue(vehicle.msrp) || 0).toLocaleString()}
                </p>
              </div>
            )}
            {vehicle.book_value && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Book Value</p>
                <p className="text-white font-medium">
                  ${(vehicle.book_value || 0).toLocaleString()}
                </p>
              </div>
            )}
            {vehicle.market_days_supply && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Days Supply</p>
                <p className="text-white font-medium">
                  {vehicle.market_days_supply} days
                  <span className="text-xs text-[#10b981] ml-1">(real)</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamps */}
      {createdAt && (
        <div className="border-t border-slate-700 pt-4">
          <p className="text-xs text-slate-500">
            Appraisal created:{" "}
            {new Date(createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
