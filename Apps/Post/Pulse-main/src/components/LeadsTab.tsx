import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, Mail, Clock, ExternalLink, Tag } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  vin: string;
  vehicle_id: string | null;
  source: string;
  message: string | null;
  status: string;
  created_at: string;
}

export function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads((data as unknown as Lead[]) || []);
    } catch (e: any) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    const { error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update lead");
      loadLeads();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const statusColors: Record<string, string> = {
    new: "bg-primary/15 text-primary border-primary/30",
    contacted: "bg-warning/15 text-warning border-warning/30",
    qualified: "bg-success/15 text-success border-success/30",
    closed: "bg-muted text-muted-foreground border-border",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-16">
        <User className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No leads yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Leads from Facebook will appear here when the webhook receives data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <div key={lead.id} className="glass-card rounded-lg p-4 animate-slide-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <User className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-sm text-foreground">{lead.name}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[lead.status] || statusColors.new}`}>
                  {lead.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {lead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {lead.phone}
                  </span>
                )}
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {lead.email}
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono">
                  <Tag className="h-3 w-3" /> {lead.vin}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatTime(lead.created_at)}
                </span>
              </div>

              {lead.message && (
                <p className="mt-2 text-xs text-muted-foreground bg-secondary/50 rounded-md p-2">
                  "{lead.message}"
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {["new", "contacted", "qualified", "closed"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateLeadStatus(lead.id, s)}
                  className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                    lead.status === s
                      ? statusColors[s]
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  } border`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
