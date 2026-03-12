import { useState, useMemo, useRef, useEffect } from "react";
import type { Vehicle } from "@/data/vehicles";
import {
  ArrowUpDown, ArrowDownUp, ChevronDown, X, SlidersHorizontal,
  DollarSign, Calendar, Gauge, Clock, Share2, Filter,
} from "lucide-react";

// ── Sort options ──────────────────────────────────────
export type SortKey =
  | "newest-added"
  | "price-low"
  | "price-high"
  | "year-new"
  | "year-old"
  | "mileage-low"
  | "mileage-high"
  | "days-lot-high"
  | "days-lot-low";

const sortOptions: { key: SortKey; label: string; icon: React.ElementType }[] = [
  { key: "newest-added", label: "Recently Added", icon: Clock },
  { key: "price-low", label: "Price: Low → High", icon: DollarSign },
  { key: "price-high", label: "Price: High → Low", icon: DollarSign },
  { key: "year-new", label: "Year: Newest First", icon: Calendar },
  { key: "year-old", label: "Year: Oldest First", icon: Calendar },
  { key: "mileage-low", label: "Mileage: Low → High", icon: Gauge },
  { key: "mileage-high", label: "Mileage: High → Low", icon: Gauge },
  { key: "days-lot-high", label: "Days on Lot: Most", icon: Clock },
  { key: "days-lot-low", label: "Days on Lot: Least", icon: Clock },
];

// ── Filter types ──────────────────────────────────────
export type PostedFilter = "all" | "posted" | "not-posted";

export interface InventoryFilterState {
  sort: SortKey;
  make: string;            // "" = all makes
  posted: PostedFilter;
}

export const defaultFilters: InventoryFilterState = {
  sort: "newest-added",
  make: "",
  posted: "all",
};

// ── Sort function ─────────────────────────────────────
export function sortVehicles(vehicles: Vehicle[], key: SortKey): Vehicle[] {
  const sorted = [...vehicles];
  switch (key) {
    case "newest-added":
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "price-low":
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "price-high":
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "year-new":
      return sorted.sort((a, b) => b.year - a.year || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "year-old":
      return sorted.sort((a, b) => a.year - b.year || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case "mileage-low":
      return sorted.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
    case "mileage-high":
      return sorted.sort((a, b) => (b.mileage || 0) - (a.mileage || 0));
    case "days-lot-high":
      return sorted.sort((a, b) => (b.days_on_lot || 0) - (a.days_on_lot || 0));
    case "days-lot-low":
      return sorted.sort((a, b) => (a.days_on_lot || 0) - (b.days_on_lot || 0));
    default:
      return sorted;
  }
}

// ── Filter function ───────────────────────────────────
export function filterVehicles(
  vehicles: Vehicle[],
  filters: InventoryFilterState,
  userPostings: Map<string, string>,
): Vehicle[] {
  let result = vehicles;

  // Make filter
  if (filters.make) {
    result = result.filter(v => v.make === filters.make);
  }

  // Posted filter
  if (filters.posted === "posted") {
    result = result.filter(v => v.synced_to_facebook || userPostings.has(v.id));
  } else if (filters.posted === "not-posted") {
    result = result.filter(v => !v.synced_to_facebook && !userPostings.has(v.id));
  }

  // Sort
  result = sortVehicles(result, filters.sort);

  return result;
}

// ── Count active filters ──────────────────────────────
function activeFilterCount(filters: InventoryFilterState): number {
  let count = 0;
  if (filters.sort !== defaultFilters.sort) count++;
  if (filters.make) count++;
  if (filters.posted !== "all") count++;
  return count;
}

// ── Dropdown helper ───────────────────────────────────
function Dropdown({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
          value
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        {value && <span className="font-semibold">: {value}</span>}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] rounded-lg border border-border bg-background shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon?: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground hover:bg-secondary"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {label}
    </button>
  );
}

// ── Main Component ────────────────────────────────────
interface InventoryFiltersProps {
  vehicles: Vehicle[];
  filters: InventoryFilterState;
  onChange: (filters: InventoryFilterState) => void;
}

export function InventoryFilters({ vehicles, filters, onChange }: InventoryFiltersProps) {
  // Unique makes from current inventory, sorted A-Z
  const makes = useMemo(() => {
    const set = new Set(vehicles.map(v => v.make).filter(Boolean));
    return Array.from(set).sort();
  }, [vehicles]);

  const count = activeFilterCount(filters);
  const currentSort = sortOptions.find(s => s.key === filters.sort);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Sort dropdown */}
      <Dropdown
        label="Sort"
        value={filters.sort !== "newest-added" ? (currentSort?.label || "") : ""}
      >
        {sortOptions.map(opt => (
          <DropdownItem
            key={opt.key}
            active={filters.sort === opt.key}
            icon={opt.icon}
            label={opt.label}
            onClick={() => onChange({ ...filters, sort: opt.key })}
          />
        ))}
      </Dropdown>

      {/* Make filter */}
      <Dropdown label="Make" value={filters.make || ""}>
        <DropdownItem
          active={!filters.make}
          label="All Makes"
          onClick={() => onChange({ ...filters, make: "" })}
        />
        <div className="h-px bg-border mx-2 my-1" />
        {makes.map(make => (
          <DropdownItem
            key={make}
            active={filters.make === make}
            label={`${make} (${vehicles.filter(v => v.make === make).length})`}
            onClick={() => onChange({ ...filters, make })}
          />
        ))}
      </Dropdown>

      {/* Posted status filter */}
      <Dropdown
        label="Posted"
        value={
          filters.posted === "posted"
            ? "Yes"
            : filters.posted === "not-posted"
            ? "No"
            : ""
        }
      >
        <DropdownItem
          active={filters.posted === "all"}
          label="All"
          onClick={() => onChange({ ...filters, posted: "all" })}
        />
        <DropdownItem
          active={filters.posted === "posted"}
          icon={Share2}
          label="Posted"
          onClick={() => onChange({ ...filters, posted: "posted" })}
        />
        <DropdownItem
          active={filters.posted === "not-posted"}
          icon={Filter}
          label="Not Posted"
          onClick={() => onChange({ ...filters, posted: "not-posted" })}
        />
      </Dropdown>

      {/* Clear all */}
      {count > 0 && (
        <button
          onClick={() => onChange({ ...defaultFilters })}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Clear {count > 1 ? `(${count})` : ""}
        </button>
      )}
    </div>
  );
}
