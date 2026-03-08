import { useEffect } from "react";

interface LoginSuccessSplashProps {
  userName?: string;
  variant?: "login" | "signup";
  onComplete: () => void;
}

// Inline SVG "P" mark for Pulse Value (no external asset dependency)
function PulseMark() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="44" height="44" rx="10" fill="currentColor" className="text-primary" />
      <text
        x="22"
        y="31"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="26"
        fontWeight="700"
        fill="white"
      >
        P
      </text>
    </svg>
  );
}

export function LoginSuccessSplash({ userName, variant = "login", onComplete }: LoginSuccessSplashProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const firstName = userName?.split(" ")[0];

  const heading =
    variant === "signup"
      ? firstName
        ? `Welcome, ${firstName}`
        : "Welcome to Pulse"
      : firstName
      ? `Welcome back, ${firstName}`
      : "Welcome back";

  const subtitle =
    variant === "signup"
      ? "Your account has been created"
      : "Taking you to your dashboard\u2026";

  return (
    <>
      <style>{`
        @keyframes vls-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes vls-logo-scale-in {
          0%   { opacity: 0; transform: scale(0.72); }
          60%  { opacity: 1; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes vls-text-slide-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes vls-dot-bounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.35; }
          40%            { transform: translateY(-7px); opacity: 1;    }
        }

        @keyframes vls-glow-pulse {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50%       { opacity: 0.32; transform: scale(1.12); }
        }

        @keyframes vls-check-draw {
          0%   { stroke-dashoffset: 24; opacity: 0; }
          40%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }

        .vls-root {
          animation: vls-fade-in 0.3s ease both;
        }

        .vls-glow {
          animation: vls-glow-pulse 2.4s ease-in-out infinite;
        }

        .vls-logo {
          animation: vls-logo-scale-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
        }

        .vls-text {
          animation: vls-text-slide-up 0.45s ease 0.55s both;
        }

        .vls-sub {
          animation: vls-text-slide-up 0.45s ease 0.7s both;
        }

        .vls-dots {
          animation: vls-text-slide-up 0.45s ease 0.85s both;
        }

        .vls-dot-1 { animation: vls-dot-bounce 1.2s ease-in-out 1.0s infinite; }
        .vls-dot-2 { animation: vls-dot-bounce 1.2s ease-in-out 1.15s infinite; }
        .vls-dot-3 { animation: vls-dot-bounce 1.2s ease-in-out 1.3s infinite; }

        .vls-check {
          animation: vls-text-slide-up 0.45s ease 0.85s both;
        }
        .vls-check svg path {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: vls-check-draw 0.5s ease 1.1s forwards;
        }
      `}</style>

      <div
        className="vls-root fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        aria-live="polite"
        aria-label={variant === "signup" ? "Account created" : "Logging you in"}
      >
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="vls-glow absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--primary) / 0.22) 0%, transparent 70%)",
            }}
          />
          <div
            className="vls-glow absolute left-1/4 top-1/4 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--primary) / 0.10) 0%, transparent 70%)",
              animationDelay: "0.6s",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative flex flex-col items-center gap-6 px-8">
          {/* Logo mark */}
          <div className="vls-logo flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-lg">
            <PulseMark />
          </div>

          {/* App name + greeting */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="vls-text text-xs font-semibold uppercase tracking-widest text-primary/70">
              Pulse Value
            </p>
            <h1 className="vls-text text-2xl font-semibold tracking-tight text-foreground" style={{ animationDelay: "0.6s" }}>
              {heading}
            </h1>
            <p className="vls-sub text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>

          {/* Animated dots for login, checkmark for signup */}
          {variant === "signup" ? (
            <div className="vls-check flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 10.5L8 14.5L16 6.5"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <div className="vls-dots flex items-center gap-2">
              <span className="vls-dot-1 block h-2 w-2 rounded-full bg-primary" />
              <span className="vls-dot-2 block h-2 w-2 rounded-full bg-primary" />
              <span className="vls-dot-3 block h-2 w-2 rounded-full bg-primary" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
