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
                    {safeValue(vehicle.displacement)}L
                  </p>
                </div>
              )}
              {vehicle.cylinders && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Cylinders</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.cylinders)}
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
                  <p className="text-sm text-slate-400 mb-1">City MPG</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.mpg_city)}
                  </p>
                </div>
              )}
              {vehicle.mpg_highway && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Highway MPG</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.mpg_highway)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Additional Details */}
      <div className="border-t border-slate-700 pt-6">
        <h4 className="text-white font-semibold mb-4">Additional Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {vehicle.doors && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Doors</p>
              <p className="text-white font-medium">
                {safeValue(vehicle.doors)}
              </p>
            </div>
          )}
          {vehicle.seats && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Seats</p>
              <p className="text-white font-medium">
                {safeValue(vehicle.seats)}
              </p>
            </div>
          )}
          {vehicle.msrp && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Original MSRP</p>
              <p className="text-white font-medium">
                {safeMsrpValue(vehicle.msrp)
                  ? `$${safeMsrpValue(vehicle.msrp).toLocaleString()}`
                  : "N/A"}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-slate-400 mb-1">Created</p>
            <p className="text-white font-medium">
              {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Market Intelligence - NEW SECTION */}
      {(vehicle.comparables?.length > 0 ||
        vehicle.market_days_supply ||
        vehicle.confidence_score ||
        vehicle.source) && (
        <div className="border-t border-slate-700 pt-6 mt-6">
          <h4 className="text-white font-semibold mb-4">Market Intelligence</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vehicle.comparables?.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Comparables Found</p>
                <p className="text-white font-medium">
                  {vehicle.comparables.length} active listings
                </p>
              </div>
            )}
            {vehicle.market_days_supply && (
              <div>
                <p className="text-sm text-slate-400 mb-1">
                  Market Days Supply
                </p>
                <p className="text-white font-medium">
                  {vehicle.market_days_supply} days
                </p>
              </div>
            )}
            {vehicle.confidence_score && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Confidence Score</p>
                <p className="text-[#10b981] font-medium">
                  {vehicle.confidence_score}%
                </p>
              </div>
            )}
            {vehicle.market_position && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Market Position</p>
                <p className="text-white font-medium capitalize">
                  {safeValue(vehicle.market_position)}
                </p>
              </div>
            )}
            {vehicle.api_calls && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Data Sources</p>
                <p className="text-white font-medium">
                  {vehicle.api_calls} API calls
                </p>
              </div>
            )}
            {vehicle.source && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Provider</p>
                <p className="text-[#06b6d4] font-medium capitalize">
                  {vehicle.source === "marketcheck"
                    ? "MarketCheck"
                    : vehicle.source}
                </p>
              </div>
            )}
            {vehicle.timestamp && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Data Updated</p>
                <p className="text-white font-medium">
                  {new Date(vehicle.timestamp).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features & Options */}
      {((vehicle.features && vehicle.features.length > 0) ||
        (vehicle.options && vehicle.options.length > 0)) && (
        <div className="border-t border-slate-700 pt-6 mt-6">
          <h4 className="text-white font-semibold mb-4">Features & Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicle.features && vehicle.features.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Key Features</p>
                <ul className="space-y-1">
                  {vehicle.features.slice(0, 10).map((feature, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-[#06b6d4] mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {vehicle.options && vehicle.options.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">
                  Optional Equipment
                </p>
                <ul className="space-y-1">
                  {vehicle.options.slice(0, 10).map((option, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-[#06b6d4] mt-1">•</span>
                      <span>{option}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
