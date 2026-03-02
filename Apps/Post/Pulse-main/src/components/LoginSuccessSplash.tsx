import { useEffect } from "react";
import pulseLogo from "@/assets/pulse-logo.png";

interface LoginSuccessSplashProps {
  userName?: string;
  onComplete: () => void;
}

export default function LoginSuccessSplash({
  userName,
  onComplete,
}: LoginSuccessSplashProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const greeting = userName
    ? `Welcome back, ${userName.split(" ")[0]}`
    : "Welcome back";

  return (
    <>
      <style>{`
        @keyframes splash-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes logo-scale-in {
          0%   { opacity: 0; transform: scale(0.72); }
          60%  { opacity: 1; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes text-slide-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.35; }
          40%            { transform: translateY(-7px); opacity: 1;    }
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50%       { opacity: 0.32; transform: scale(1.12); }
        }

        .splash-root {
          animation: splash-fade-in 0.3s ease both;
        }

        .splash-glow {
          animation: glow-pulse 2.4s ease-in-out infinite;
        }

        .splash-logo {
          animation: logo-scale-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
        }

        .splash-text {
          animation: text-slide-up 0.45s ease 0.55s both;
        }

        .splash-sub {
          animation: text-slide-up 0.45s ease 0.7s both;
        }

        .splash-dots {
          animation: text-slide-up 0.45s ease 0.85s both;
        }

        .dot-1 { animation: dot-bounce 1.2s ease-in-out 1.0s infinite; }
        .dot-2 { animation: dot-bounce 1.2s ease-in-out 1.15s infinite; }
        .dot-3 { animation: dot-bounce 1.2s ease-in-out 1.3s infinite; }
      `}</style>

      <div
        className="splash-root fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        aria-live="polite"
        aria-label="Logging you in"
      >
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="splash-glow absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--primary) / 0.22) 0%, transparent 70%)",
            }}
          />
          <div
            className="splash-glow absolute left-1/4 top-1/4 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--primary) / 0.10) 0%, transparent 70%)",
              animationDelay: "0.6s",
            }}
          />
        </div>

        {/* Content card */}
        <div className="relative flex flex-col items-center gap-6 px-8">
          {/* Logo */}
          <div className="splash-logo flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-lg">
            <img
              src={pulseLogo}
              alt="Pulse"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Text */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="splash-text text-2xl font-semibold tracking-tight text-foreground">
              {greeting}
            </h1>
            <p className="splash-sub text-sm text-muted-foreground">
              Taking you to your dashboard…
            </p>
          </div>

          {/* Animated dots */}
          <div className="splash-dots flex items-center gap-2">
            <span className="dot-1 block h-2 w-2 rounded-full bg-primary" />
            <span className="dot-2 block h-2 w-2 rounded-full bg-primary" />
            <span className="dot-3 block h-2 w-2 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </>
  );
}
