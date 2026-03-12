import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border pt-[52px] pb-8 px-[clamp(24px,5%,80px)]">
      <div className="max-w-[1120px] mx-auto">
        








































        <Separator className="mb-7" />

        <div className="flex justify-between items-center flex-wrap gap-3">
          <p className="text-[13px] text-muted-foreground">
            © 2025 Lotly Automotive Solutions LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/support" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>);

};

export default Footer;