import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Branding Imports
import pulseHeroLogo from "@/assets/pulse-hero-logo.png";
import pulsePostLogo from "@/assets/pulse-post-logo.png";
import pulseValueLogo from "@/assets/pulse-value-logo.png";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [dealershipName, setDealershipName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // URL Parameters for the Lobby Logic
  const selectedPlan = searchParams.get("plan");
  const mode = searchParams.get("mode"); // 'post', 'value', or 'both'

  // Dynamic Logo Logic
  const getTerminalLogo = () => {
    if (mode === "post") return pulsePostLogo;
    if (mode === "value") return pulseValueLogo;
    return pulseHeroLogo;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          // In the future, this is where you'd redirect to the separate Railway URLs
          navigate("/"); 
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { 
              full_name: fullName,
              dealership_name: dealershipName,
              selected_plan: selectedPlan,
              terminal_mode: mode
            },
          },
        });
        if (error) throw error;
        toast({
          title: "Registration Initialized",
          description: "Check your email to verify your dealer credentials.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <a href="/" className="inline-block transition-transform hover:scale-105">
            <img 
              src={getTerminalLogo()} 
              alt="Pulse Terminal" 
              className={`h-12 mx-auto mb-6 brightness-0 invert ${mode ? 'animate-pulse' : ''}`} 
            />
          </a>
          
          <div className="flex flex-col items-center gap-2">
            {mode && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] font-bold border-primary/30 text-primary">
                {mode} TERMINAL ACTIVE
              </Badge>
            )}
            {selectedPlan && (
              <Badge variant="secondary" className="text-[10px] uppercase tracking-widest font-bold">
                PLAN: {selectedPlan}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-foreground mt-6 mb-1 italic uppercase tracking-tighter">
            {isSignUp ? "Initialize Enrollment" : "Dealer Access"}
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {isSignUp ? "Secure your automotive intelligence suite." : "Enter your terminal credentials."}
          </p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter Full Name"
                      className="bg-background/50 border-primary/10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dealership" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Dealership Name</Label>
                    <Input
                      id="dealership"
                      placeholder="Enter Dealership"
                      className="bg-background/50 border-primary/10"
                      value={dealershipName}
                      onChange={(e) => setDealershipName(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@dealership.com"
                  className="bg-background/50 border-primary/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" title="Minimum 6 characters" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Secure Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-background/50 border-primary/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full mt-4 font-bold italic uppercase tracking-widest" size="lg" disabled={loading}>
                {loading ? "AUTHENTICATING..." : isSignUp ? "Create Terminal Access" : "Secure Login"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp
                  ? "Already Enrolled? Access Portal"
                  : "Need Enrollment? Initialize Here"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;