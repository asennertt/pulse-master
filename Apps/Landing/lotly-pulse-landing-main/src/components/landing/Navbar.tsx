import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import logoTransparent from "@/assets/logo_transparent.png";
import { Menu, X, Share2, LineChart, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

const navLinks = ["Products", "Integration", "How It Works", "Pricing", "FAQ"];

// We now expect 'userRoles' (an array of strings) instead of 'userProfile'
interface NavbarProps {
  userRoles?: string[];
}

const Navbar = ({ userRoles = [] }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Logic to determine access based on Neon Roles
  const isSuperAdmin = userRoles.includes('super_admin');
  const hasPostAccess = isSuperAdmin || userRoles.includes('dealer_admin') || userRoles.includes('dealer_user');
  const hasValueAccess = isSuperAdmin || userRoles.includes('dealer_value_user');
  const isLoggedIn = userRoles.length > 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-[200] flex h-16 items-center px-[clamp(24px,5%,80px)] gap-10 backdrop-blur-xl backdrop-saturate-[180%] transition-all ${
        scrolled ? "shadow-sm border-b border-border bg-background/85" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
        <img src={logoTransparent} alt="Pulse" className="h-8" />
      </div>

      <ul className="hidden md:flex gap-1 list-none flex-1">
        {navLinks.map((item) => (
          <li key={item}>
            <a
              href={`#${item.toLowerCase().replace(/\s+/g, "")}`}
              className="block px-3 py-1.5 text-sm font-medium text-muted-foreground rounded-md transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        {isLoggedIn ? (
          <>
            {/* Pulse Post Access */}
            {hasPostAccess && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:inline-flex text-blue-400 gap-2 font-bold uppercase text-[10px] tracking-widest"
                onClick={() => navigate("/post-dashboard")}
              >
                <Share2 size={14} />
                Pulse Post
              </Button>
            )}

            {/* Pulse Value Access */}
            {hasValueAccess && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:inline-flex text-green-400 gap-2 font-bold uppercase text-[10px] tracking-widest"
                onClick={() => navigate("/value-dashboard")}
              >
                <LineChart size={14} />
                Pulse Value
              </Button>
            )}

            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("/post-dashboard")}>
              <LayoutDashboard size={14} />
              Portal
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground" onClick={() => navigate("/auth")}>
              Sign in
            </Button>
            <Button size="sm" className="shadow-md bg-primary hover:bg-primary/90" onClick={() => navigate("/")}>
              Get Started
            </Button>
          </>
        )}
      </div>

      <button
        className="md:hidden ml-auto text-muted-foreground"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </nav>
  );
};

export default Navbar;