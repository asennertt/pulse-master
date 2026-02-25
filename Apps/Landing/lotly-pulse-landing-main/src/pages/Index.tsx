import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Ensure this path is correct for your setup
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
      // REAL SUPABASE SIGNUP: This sends metadata to your database trigger
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            dealership_name: dealershipName,
            phone: phone,
            plan: plan // This tells the DB to flip the 'post' or 'value' flags
          }
        }
      });

      if (error) throw error;

      // TRIGGER SUCCESS ANIMATION
      setIsSuccess(true);
      toast.success("Dealer Protocol Initialized!");
      
      // Wait 3.2 seconds for the ECG heartbeat animation before moving to Auth
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
        {/* SUCCESS STATE UI (Revealed when isSuccess is true) */}
        <Card className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-card border-green-500/30 transition-all duration-700 ${isSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="relative">
            <CheckCircle2 className="w-20 h-20 text-green-500 animate-in zoom-in duration-500" />
            <Activity className="absolute -top-2 -right