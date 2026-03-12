import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { Users, Plus, Mail, CheckCircle2, Clock, Send, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

interface StaffMember {
  user_id: string;
  full_name: string | null;
  created_at: string;
  isAdmin: boolean;
}

interface PendingInvite {
  token: string;
  expires_at: string;
  created_at: string;
}

export function StaffDashboard() {
  const { user, activeDealerId } = useAuth();
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (activeDealerId) loadTeam();
  }, [activeDealerId]);

  const loadTeam = async () => {
    if (!activeDealerId) return;

    // Load all profiles in this dealership
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, created_at")
      .eq("dealership_id", activeDealerId)
      .order("created_at", { ascending: true });

    // Load roles to identify admins
    const userIds = (profiles || []).map(p => p.user_id);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds.length > 0 ? userIds : ["none"]);

    const adminSet = new Set(
      (roles || []).filter(r => r.role === "dealer_admin" || r.role === "super_admin").map(r => r.user_id)
    );

    setMembers(
      (profiles || []).map(p => ({
        user_id: p.user_id,
        full_name: p.full_name,
        created_at: p.created_at,
        isAdmin: adminSet.has(p.user_id),
      }))
    );

    // Load pending (unused, not expired) invites for this dealership
    const { data: invites } = await supabase
      .from("invitation_links")
      .select("token, expires_at, created_at")
      .eq("dealership_id", activeDealerId)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    setPendingInvites(invites || []);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invite", {
        body: { email: inviteForm.email.trim(), name: inviteForm.name.trim() || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.emailSent) {
        toast.success(`Invitation sent to ${inviteForm.email}`);
      } else {
        // Email didn't send but invite was created — show the link
        const link = `https://post.pulse.lotlyauto.com/auth?invite=${data.token}`;
        navigator.clipboard.writeText(link);
        toast.success("Invite created — link copied to clipboard");
      }

      setInviteForm({ name: "", email: "" });
      setShowInvite(false);
      loadTeam();
    } catch (e: any) {
      toast.error("Failed to send invite", { description: e.message });
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `https://post.pulse.lotlyauto.com/auth?invite=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Team Management
        </h2>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Invite Staff
        </button>
      </div>

      {showInvite && (
        <div className="glass-card rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Send Staff Invitation</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={inviteForm.name}
              onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full Name"
              className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={inviteForm.email}
              onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Email *"
              type="email"
              className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInvite}
              disabled={sending || !inviteForm.email.trim()}
              className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? "Sending..." : "Send Invite"}
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="rounded-md bg-secondary border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            An email will be sent with a link to create their account. The invite expires in 7 days.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading team...</div>
      ) : (
        <>
          {/* Active Team Members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(m => (
              <div key={m.user_id} className="glass-card rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{m.full_name || "Unnamed"}</h3>
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${m.isAdmin ? "text-primary" : "text-muted-foreground"}`}>
                      {m.isAdmin ? "Admin" : "Staff"}
                    </span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Joined {formatDate(m.created_at)}
                </p>
              </div>
            ))}
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Invites</h3>
              {pendingInvites.map(inv => (
                <div key={inv.token} className="glass-card rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-warning" />
                    <span className="text-xs text-muted-foreground">
                      Sent {formatDate(inv.created_at)} — expires {formatDate(inv.expires_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => copyInviteLink(inv.token)}
                    className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                  >
                    <Copy className="h-3 w-3" /> Copy Link
                  </button>
                </div>
              ))}
            </div>
          )}

          {members.length === 0 && pendingInvites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No team members yet</p>
              <p className="text-[10px]">Invite your first staff member to get started</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
