import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, ShieldCheck, Zap, BarChart3, ChevronRight } from "lucide-react";

export default function Index() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"post" | "value" | "both">("both");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const dealershipName = formData.get("dealershipName") as string;

    try {
      // This sends metadata to your Neon trigger to assign permissions
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            dealership_name: dealershipName,
            phone: phone,
            plan: plan 
          }
        }
      });

      if (error) throw error;

      toast.success("Account created successfully!");
      // Redirect to the login terminal
      setTimeout(() => navigate("/auth"), 2000);

    } catch (error: any) {
      toast.error(error.message || "Signup failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      
      {/* Branding Section - Restored to your original style */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold tracking-tighter italic text-primary">
          PULSE
        </h1>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mt-2">
          Automotive Intelligence Network
        </p>
      </div>

      <div className="w-full max-w-lg">
        <Card className="p-8 border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1 border-b border-primary/10 pb-4">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Dealer Enrollment
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <Input name="name" placeholder="Full Name" required className="bg-background/50" />
               <Input name="phone" placeholder="Phone" required className="bg-background/50" />
            </div>
            <Input name="dealershipName" placeholder="Dealership Name" required className="bg-background/50" />
            <Input name="email" type="email" placeholder="Work Email" required className="bg-background/50" />
            <Input name="password" type="password" placeholder="Password" required className="bg-background/50" />
            
            {/* Plan Selection Section */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Integrated Modules</label>
              <div className="flex bg-secondary/50 p-1 rounded-md border border-primary/5">
                {(['post', 'value', 'both'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-tighter transition-all rounded ${
                      plan === p 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full font-bold uppercase tracking-widest py-6" disabled={loading}>
              {loading ? (
                <Activity className="animate-spin h-5 w-5" />
              ) : (
                <>Initialize Sync <ChevronRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
              Existing Dealer? <button type="button" onClick={() => navigate('/auth')} className="text-primary hover:underline">Access Portal</button>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}