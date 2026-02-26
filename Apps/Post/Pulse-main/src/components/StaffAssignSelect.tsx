import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";

interface Staff {
  id: string;
  name: string;
  facebook_account: string | null;
}

interface StaffAssignSelectProps {
  vehicleId: string;
  currentStaffId: string | null;
  onAssign: (staffId: string, staffName: string) => void;
}

export function StaffAssignSelect({ vehicleId, currentStaffId, onAssign }: StaffAssignSelectProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from("staff").select("id, name, facebook_account").eq("active", true).then(({ data }) => {
      setStaff((data as unknown as Staff[]) || []);
    });
  }, []);

  const handleSelect = async (s: Staff) => {
    await supabase.from("pulse_vehicles").update({ assigned_staff_id: s.id }).eq("id", vehicleId);
    onAssign(s.id, s.name);
    setOpen(false);
  };

  const assigned = staff.find(s => s.id === currentStaffId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <UserPlus className="h-3 w-3" />
        <span className="truncate">{assigned ? assigned.name : "Assign Staff"}</span>
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 mt-1 w-full rounded-md bg-card border border-border shadow-lg overflow-hidden">
          {staff.map(s => (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors ${s.id === currentStaffId ? "text-primary" : "text-foreground"}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
