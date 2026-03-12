import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Mail, MessageSquare, Clock, Shield, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How do I connect the extension to my Pulse Post account?",
    a: "Once you install the extension, open the Pulse Post dashboard at post.pulse.lotlyauto.com and log in. The extension automatically detects your session and syncs your inventory.",
  },
  {
    q: "The extension isn't auto-filling on the listing page. What should I do?",
    a: "Make sure you're clicking \"Post to Marketplace\" from the Pulse Post dashboard — the extension needs the vehicle data passed through the URL. If the issue persists, try refreshing the page or reinstalling the extension.",
  },
  {
    q: "Can I edit the AI-generated description before posting?",
    a: "Yes. After the extension auto-fills the listing, you'll see a description editor in the Pulse dock. You can edit the text directly or click \"Regenerate AI\" to get a fresh description.",
  },
  {
    q: "Which listing sites does the extension support?",
    a: "Currently, Pulse Post supports Facebook Marketplace vehicle listings. We're actively working on expanding to other platforms.",
  },
  {
    q: "How do I update the extension?",
    a: "Chrome automatically updates extensions. If you want to force an update, go to chrome://extensions, enable Developer Mode, and click \"Update\".",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. The extension only accesses your dealership's vehicle data through your authenticated Pulse Post session. We never collect personal browsing data or share information with third parties.",
  },
];

const Support = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20 px-[clamp(24px,5%,80px)]">
        <div className="max-w-[720px] mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              Support Center
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
              How can we help?
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Get in touch with our team or find answers to common questions about Pulse Post.
            </p>
          </div>

          {/* Contact Card */}
          <div className="rounded-2xl border border-border bg-card p-8 mb-16">
            <h2 className="text-xl font-bold text-foreground mb-6">Contact Us</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Email Support</p>
                  <a
                    href="mailto:support@pulse.lotlyauto.com"
                    className="text-primary hover:underline"
                  >
                    support@pulse.lotlyauto.com
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    For technical issues, account questions, or general inquiries.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Response Time</p>
                  <p className="text-muted-foreground">
                    We typically respond within 24 hours during business days.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Privacy</p>
                  <p className="text-muted-foreground">
                    Your data is secure. We never collect personal browsing data or share your information. See our{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card/50 p-6"
                >
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
