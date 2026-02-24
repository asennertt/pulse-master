import { useState, useMemo } from "react";
import {
  Package,
  MapPin,
  Calendar,
  Gauge,
  DollarSign,
  Award,
  ArrowUpDown,
  Filter,
} from "lucide-react";

export function ComparablesGrid({ comparables = [] }) {
  const [sortBy, setSortBy] = useState("price"); // price, miles, dom, distance
  const [filterType, setFilterType] = useState("all"); // all, certified, used
  const [priceRange, setPriceRange] = useState("all"); // all, below, similar, above

  // Calculate subject vehicle price for comparison
  const subjectPrice =
    comparables.length > 0
      ? comparables.reduce((sum, c) => sum + (c.price || 0), 0) /
        comparables.length
      : 0;

  // Filter and sort comparables
  const processedComparables = useMemo(() => {
    let filtered = [...comparables];

    // Filter by type
    if (filterType === "certified") {
      filtered = filtered.filter((c) => c.certified);
    } else if (filterType === "used") {
      filtered = filtered.filter((c) => !c.certified);
    }

    // Filter by price range
    if (priceRange === "below" && subjectPrice > 0) {
      filtered = filtered.filter((c) => c.price < subjectPrice * 0.95);
    } else if (priceRange === "similar" && subjectPrice > 0) {
      filtered = filtered.filter(
        (c) => c.price >= subjectPrice * 0.95 && c.price <= subjectPrice * 1.05,
      );
    } else if (priceRange === "above" && subjectPrice > 0) {
      filtered = filtered.filter((c) => c.price > subjectPrice * 1.05);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return (a.price || 0) - (b.price || 0);
        case "miles":
          return (a.miles || 0) - (b.miles || 0);
        case "dom":
          return (a.dom || 0) - (b.dom || 0);
        case "distance":
          return (a.distance || 999) - (b.distance || 999);
        default:
          return 0;
      }
    });

    return filtered;
  }, [comparables, sortBy, filterType, priceRange, subjectPrice]);

  if (comparables.length === 0) {
    return (
      <div className="bg-[#1E293B] rounded-xl p-8 border border-slate-700 text-center">
        <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400 text-lg">No comparable vehicles found</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-[#06b6d4]" />
            Market Comparables
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {processedComparables.length} of {comparables.length} vehicles shown
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-3">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0B1120] text-white text-sm px-4 py-2 rounded-lg border border-slate-700 focus:border-[#06b6d4] focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="certified">Certified Only</option>
            <option value="used">Used Only</option>
          </select>

          {/* Price Range Filter */}
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="bg-[#0B1120] text-white text-sm px-4 py-2 rounded-lg border border-slate-700 focus:border-[#06b6d4] focus:outline-none"
          >
            <option value="all">All Prices</option>
            <option value="below">Below Market</option>
            <option value="similar">Similar Price</option>
            <option value="above">Above Market</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0B1120] text-white text-sm px-4 py-2 rounded-lg border border-slate-700 focus:border-[#06b6d4] focus:outline-none"
          >
            <option value="price">Sort by Price</option>
            <option value="miles">Sort by Mileage</option>
            <option value="dom">Sort by DOM</option>
            <option value="distance">Sort by Distance</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Avg Price"
          value={`$${Math.round(processedComparables.reduce((sum, c) => sum + (c.price || 0), 0) / processedComparables.length).toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          label="Avg Mileage"
          value={`${Math.round(processedComparables.reduce((sum, c) => sum + (c.miles || 0), 0) / processedComparables.length).toLocaleString()} mi`}
          icon={Gauge}
        />
        <StatCard
          label="Avg DOM"
          value={`${Math.round(processedComparables.reduce((sum, c) => sum + (c.dom || 0), 0) / processedComparables.length)} days`}
          icon={Calendar}
        />
        <StatCard
          label="Certified"
          value={`${processedComparables.filter((c) => c.certified).length} / ${processedComparables.length}`}
          icon={Award}
        />
      </div>

      {/* Comparables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processedComparables.map((comp, idx) => (
          <ComparableCard key={comp.id || idx} comparable={comp} />
        ))}
      </div>

      {processedComparables.length === 0 && (
        <div className="bg-[#0B1120] rounded-lg p-8 text-center">
          <Filter className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No vehicles match your filters</p>
          <button
            onClick={() => {
              setFilterType("all");
              setPriceRange("all");
            }}
            className="mt-4 text-[#06b6d4] hover:text-[#0891b2] text-sm font-semibold"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-[#0B1120] rounded-lg p-3 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3 h-3 text-[#06b6d4]" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function ComparableCard({ comparable }) {
  const hasPhoto = comparable.photo_url && comparable.photo_url.trim() !== "";

  // Safely extract trim - it might be an object with a 'name' property
  const trimValue =
    typeof comparable.trim === "object" && comparable.trim !== null
      ? comparable.trim.name || ""
      : comparable.trim || "";

  // Safely extract year - it might be an object
  const yearValue =
    typeof comparable.year === "object" && comparable.year !== null
      ? comparable.year.base || comparable.year.value || ""
      : comparable.year || "";

  return (
    <div className="bg-[#0B1120] rounded-lg border border-slate-700/50 overflow-hidden hover:border-[#06b6d4]/50 transition-all group">
      {/* Vehicle Image */}
      <div className="relative h-48 bg-slate-800 overflow-hidden">
        {hasPhoto ? (
          <img
            src={comparable.photo_url}
            alt={`${yearValue} ${trimValue}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ display: hasPhoto ? "none" : "flex" }}
        >
          <Package className="w-16 h-16 text-slate-600" />
        </div>

        {/* Certified Badge */}
        {comparable.certified && (
          <div className="absolute top-3 right-3 bg-[#10b981] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            <Award className="w-3 h-3 inline mr-1" />
            Certified
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-slate-700">
          <p className="text-lg font-bold">
            ${comparable.price ? comparable.price.toLocaleString() : "N/A"}
          </p>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="p-4">
        <h4 className="text-white font-semibold mb-2 truncate">
          {yearValue} {trimValue}
        </h4>

        {/* Key Stats */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-slate-400">
              <Gauge className="w-3 h-3" />
              <span>Mileage</span>
            </div>
            <span className="text-white font-semibold">
              {comparable.miles ? comparable.miles.toLocaleString() : "N/A"} mi
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>Days Listed</span>
            </div>
            <span className="text-white font-semibold">
              {comparable.dom || "N/A"} days
            </span>
          </div>

          {comparable.distance != null && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3 h-3" />
                <span>Distance</span>
              </div>
              <span className="text-white font-semibold">
                {Math.round(comparable.distance)} mi
              </span>
            </div>
          )}
        </div>

        {/* Dealer Info */}
        {comparable.dealer_name && (
          <div className="pt-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 truncate">
              {comparable.dealer_name}
            </p>
            {(comparable.dealer_city || comparable.dealer_state) && (
              <p className="text-xs text-slate-500 truncate">
                {comparable.dealer_city}
                {comparable.dealer_city && comparable.dealer_state && ", "}
                {comparable.dealer_state}
              </p>
            )}
          </div>
        )}

        {/* Color Badge */}
        {comparable.exterior_color && (
          <div className="mt-2">
            <span className="inline-block text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
              {comparable.exterior_color}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
