import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0B1120] p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1A1F2E] p-8 border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Sign Out</h1>
          <p className="text-slate-400 mt-2">
            Are you sure you want to sign out?
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full bg-[#00D9FF] text-[#0F1419] rounded-lg px-4 py-3 text-base font-bold hover:bg-[#00C3E6] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:ring-offset-2 focus:ring-offset-[#1A1F2E] transition-all shadow-[0_0_30px_rgba(0,217,255,0.4)]"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
