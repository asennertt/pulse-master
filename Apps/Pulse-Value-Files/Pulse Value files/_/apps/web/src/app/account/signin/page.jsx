import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignInPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signInWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      await signInWithCredentials({
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (err) {
      const errorMessages = {
        OAuthSignin: "Couldn't start sign-in. Please try again.",
        OAuthCallback: "Sign-in failed after redirecting. Please try again.",
        OAuthCreateAccount: "Couldn't create an account. Try another method.",
        EmailCreateAccount: "This email already exists.",
        Callback: "Something went wrong during sign-in. Please try again.",
        OAuthAccountNotLinked: "This account uses a different sign-in method.",
        CredentialsSignin: "Incorrect email or password. Try again.",
        AccessDenied: "You don't have permission to sign in.",
        Configuration:
          "Sign-in isn't working right now. Please try again later.",
        Verification: "Your sign-in link has expired. Request a new one.",
      };

      setError(
        errorMessages[err.message] || "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0B1120] p-4">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-[#1A1F2E] p-8 border border-slate-700"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10">
              <svg viewBox="0 0 48 48" className="w-full h-full">
                <path
                  d="M 2,24 L 12,24 L 16,12 L 22,36 L 28,18 L 32,28 L 36,24 L 46,24"
                  stroke="#00D9FF"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(0, 217, 255, 0.5))",
                  }}
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">
              <span className="text-[#00D9FF]">PULSE</span> APPRAISING
            </h1>
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              required
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-[#0F1419] border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              required
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0F1419] border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF] transition-all"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00D9FF] text-[#0F1419] rounded-lg px-4 py-3 text-base font-bold hover:bg-[#00C3E6] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:ring-offset-2 focus:ring-offset-[#1A1F2E] disabled:opacity-50 transition-all shadow-[0_0_30px_rgba(0,217,255,0.4)]"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <a
              href="/account/signup"
              className="text-[#00D9FF] hover:text-[#00C3E6] font-semibold"
            >
              Sign up
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
