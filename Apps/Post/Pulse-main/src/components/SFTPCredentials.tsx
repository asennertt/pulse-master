import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Server, Copy, Eye, EyeOff, RefreshCw, ShieldAlert,
  CheckCircle2, Loader2, KeyRound,
} from "lucide-react";

interface SFTPCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
}

const inputCls = "w-full rounded-md bg-secondary border border-border px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none";

function CopyField({ label, value }: { label: string; value: string }) {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <input value={value} readOnly className={inputCls} />
        <button onClick={copy} className="shrink-0 rounded-md bg-secondary border border-border p-2.5 text-muted-foreground hover:text-foreground transition-colors" title="Copy">
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * One-Time View Modal for newly generated credentials (Super Admin)
 */
export function CredentialOneTimeModal({
  creds,
  dealerName,
  onClose,
}: {
  creds: SFTPCredentials;
  dealerName: string;
  onClose: () => void;
}) {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-md mx-4 p-6 space-y-5 animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-success/15 border border-success/30 flex items-center justify-center">
            <KeyRound className="h-5 w-5 text-success" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">SFTP Credentials Generated</h2>
            <p className="text-xs text-muted-foreground">{dealerName}</p>
          </div>
        </div>

        <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning leading-relaxed">
            <strong>One-Time View.</strong> This password will not be shown again. Copy it now and share securely with the dealer.
          </p>
        </div>

        <div className="space-y-3">
          <CopyField label="SFTP Host" value={creds.host} />
          <CopyField label="Port" value={String(creds.port)} />
          <CopyField label="Username" value={creds.username} />
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Password</label>
            <div className="flex items-center gap-2">
              <input
                type={showPass ? "text" : "password"}
                value={creds.password}
                readOnly
                className={inputCls}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="shrink-0 rounded-md bg-secondary border border-border p-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(creds.password); toast.success("Password copied"); }}
                className="shrink-0 rounded-md bg-secondary border border-border p-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          I've Saved These Credentials
        </button>
      </div>
    </div>
  );
}

/**
 * Dealer-facing Connection Details card for DMS Settings
 */
export function SFTPConnectionCard({ dealerId }: { dealerId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [creds, setCreds] = useState<SFTPCredentials | null>(null);
  const [checked, setChecked] = useState(false);

  const checkCreds = async () => {
    if (!dealerId) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-sftp-creds", {
        body: { dealer_id: dealerId, action: "check" },
      });
      if (error) throw error;
      setUsername(data.username || null);
      setChecked(true);
    } catch {
      toast.error("Failed to check credentials");
    } finally {
      setChecking(false);
    }
  };

  const regenerate = async () => {
    if (!dealerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-sftp-creds", {
        body: { dealer_id: dealerId, action: "regenerate" },
      });
      if (error) throw error;
      setCreds(data.credentials);
      setUsername(data.credentials.username);
      toast.success("New credentials generated!");
    } catch {
      toast.error("Failed to generate credentials");
    } finally {
      setLoading(false);
    }
  };

  // Auto-check on mount
  if (!checked && !checking && dealerId) {
    checkCreds();
  }

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" /> SFTP Connection Details
        </h3>
        {username && (
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-2.5 py-1 text-[10px] text-success font-medium">
            <CheckCircle2 className="h-3 w-3" /> Configured
          </span>
        )}
      </div>

      <div className="rounded-lg bg-warning/5 border border-warning/15 p-3 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Keep these credentials secure. This is how your inventory data is sent to our servers. Never share them publicly.
        </p>
      </div>

      {checking ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking credentials...
        </div>
      ) : username ? (
        <div className="space-y-3">
          <CopyField label="SFTP Host" value="us-east-1.sftpcloud.io" />
          <CopyField label="Port" value="22" />
          <CopyField label="Username" value={username} />

          {creds ? (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="flex items-center gap-2">
                <input type={showPass ? "text" : "password"} value={creds.password} readOnly className={inputCls} />
                <button onClick={() => setShowPass(!showPass)} className="shrink-0 rounded-md bg-secondary border border-border p-2.5 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(creds.password); toast.success("Copied"); }} className="shrink-0 rounded-md bg-secondary border border-border p-2.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-warning">Save this password now. It won't be shown again after you leave this page.</p>
            </div>
          ) : (
            <div className="rounded-md bg-secondary/60 border border-border p-3 text-xs text-muted-foreground">
              Password is hidden for security. Click "Regenerate" below if you need a new one.
            </div>
          )}

          <button
            onClick={regenerate}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 text-xs font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Regenerate Credentials
          </button>
        </div>
      ) : (
        <div className="text-center py-6 space-y-3">
          <KeyRound className="h-8 w-8 text-muted-foreground mx-auto opacity-30" />
          <p className="text-sm text-muted-foreground">No SFTP credentials configured yet.</p>
          <p className="text-xs text-muted-foreground">Contact your admin to generate credentials, or click below.</p>
          <button
            onClick={regenerate}
            disabled={loading}
            className="flex items-center gap-2 mx-auto rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Generate Credentials
          </button>
        </div>
      )}
    </div>
  );
}
