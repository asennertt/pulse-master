import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoTransparent from "@/assets/logo_transparent.png";
import { Menu, X, ChevronDown, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = ["Products", "Integration", "How It Works", "Pricing", "FAQ"];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-[200] flex h-16 items-center px-[clamp(24px,5%,80px)] gap-10 backdrop-blur-xl backdrop-saturate-[180%] transition-shadow ${
        scrolled ? "shadow-sm border-b border-border" : "border-b border-transparent"
      }`}
      style={{ background: "hsl(var(--background) / 0.85)" }}
    >
      <div className="flex items-center flex-shrink-0">
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
        {/* --- DUAL SIGN-IN DROPDOWN (Maintained Original Button Sizes) --- */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground gap-1.5">
              Sign in
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-lg border-border">
            <DropdownMenuItem asChild>
              <Link to="/auth?mode=post" className="cursor-pointer font-bold italic text-xs uppercase tracking-tighter">
                Pulse Post Terminal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/auth?mode=value" className="cursor-pointer font-bold italic text-xs uppercase tracking-tighter">
                Pulse Value Terminal
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" className="shadow-md font-bold italic uppercase tracking-tighter" asChild>
          <a href="#pricing">Get Started</a>
        </Button>
      </div>

      <button
        className="md:hidden ml-auto text-muted-foreground"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 md:hidden animate-in fade-in slide-in-from-top-4">
          {navLinks.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "")}`}
              onClick={() => setMobileOpen(false)}
              className="text-lg font-medium"
            >
              {item}
            </a>
          ))}
          <div className="h-px bg-border my-2" />
          <Link to="/auth?mode=post" className="text-primary font-bold italic">Post Terminal</Link>
          <Link to="/auth?mode=value" className="text-primary font-bold italic">Value Terminal</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;