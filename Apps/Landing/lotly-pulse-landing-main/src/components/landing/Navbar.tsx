import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoTransparent from "@/assets/logo_transparent.png";
import { Menu, X, LayoutDashboard, ChevronDown } from "lucide-react";
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
      className={`fixed inset-x-0 top-0 z-[200] flex h-16 items-center px-[clamp(24px,5%,80px)] gap-10 backdrop-blur-xl transition-all ${
        scrolled ? "shadow-sm border-b border-border" : "border-b border-transparent"
      }`}
      style={{ background: "hsl(var(--background) / 0.85)" }}
    >
      <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground gap-1.5 font-bold italic uppercase tracking-tighter">
              <LayoutDashboard className="w-4 h-4" />
              Sign in
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background border-border">
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
          <a href="#pricing">GET STARTED</a>
        </Button>
      </div>

      <button className="md:hidden ml-auto text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </nav>
  );
};

export default Navbar;