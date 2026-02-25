import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Activity } from "lucide-react";

export default function Index() {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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

      setIsSuccess(true);
      toast.success("Dealer Protocol Initialized!");
      
      // REDIRECT LOGIC FOR MULTI-APP SETUP:
      // Instead of internal 'navigate', we wait for the animation 
      // then send them to the login page of this app.
      setTimeout(() => navigate("/auth"), 3200);

    } catch (error: any) {
      toast.error(error.message || "Initialization Failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      
      {/* Dynamic Brand Header */}
      <div className="pulse-logo-wrap mb-10 text-center transition-all duration-700">
        <h1 className={`text-7xl font-bold tracking-tighter uppercase italic transition-colors duration-1000 ${isSuccess ? 'text-green-500' : 'text-primary'}`}>
          LOTLY
        </h1>
        <svg className="ecg-trace-svg" viewBox="0 0 200 40" style={{ width: '200px', height: '40px' }}>
           <path 
             className={`ecg-trace-line fill-none stroke-2 transition-colors duration-1000 ${isSuccess ? 'stroke-green-500' : 'stroke-primary'}`} 
             d="M0,20 L40,20 L50,5 L65,35 L75,20 L200,20" 
             strokeDasharray="200"
             strokeDashoffset="0"
           />
        </svg>
      </div>

      <div className="w-full max-w-lg relative">
        <Card className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-card border-green-500/30 transition-all duration-700 ${isSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="relative">
            <CheckCircle2 className="w-20 h-20 text-green-500 animate-in zoom-in duration-500" />
            <Activity className="absolute -top-2 -right-2 w-8 h-8 text-green-500/50 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mt-4 tracking-tight">Access Granted</h2>
          <p className="text-muted-foreground text-sm">Redirecting to Secure Portal...</p>
        </Card>

        {/* Signup Form */}
        <Card className={`p-8 border-primary/20 bg-card/50 backdrop-blur-sm transition-all duration-500 ${isSuccess ? 'opacity-0 scale-95' : 'opacity-100'}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Dealer Enrollment</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Initialization Phase</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <Input name="name" placeholder="Full Name" required className="bg-background/50" />
               <Input name="phone" placeholder="Phone" required className="bg-background/50" />
            </div>
            <Input name="dealershipName" placeholder="Dealership Name" required className="bg-background/50" />
            <Input name="email" type="email" placeholder="Work Email" required className="bg-background/50" />
            <Input name="password" type="password" placeholder="Create Password" required className="bg-background/50" />
            
            <div className="flex bg-secondary/50 p-1 rounded-md">
              {(['post', 'value', 'both'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-tighter transition-all rounded ${plan === p ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <Button type="submit" className="w-full font-bold uppercase italic tracking-tighter" disabled={loading}>
              {loading ? "Syncing..." : "Initialize Protocol"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}