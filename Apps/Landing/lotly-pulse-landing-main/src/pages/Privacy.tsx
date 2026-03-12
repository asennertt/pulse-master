import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20 px-[clamp(24px,5%,80px)]">
        <div className="max-w-[720px] mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-12">
            Last updated: March 12, 2026
          </p>

          <div className="space-y-10 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Overview</h2>
              <p>
                Pulse Post by Lotly Auto ("we", "our", or "us") is committed to protecting your privacy. This policy explains how our Chrome extension and web application collect, use, and safeguard your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">
                Information We Collect
              </h2>
              <p className="mb-3">
                The Pulse Post Chrome extension accesses the following data:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">Vehicle inventory data</strong> — Retrieved from your authenticated Pulse Post account to auto-fill listing forms. This includes vehicle make, model, year, price, mileage, description, and photos.
                </li>
                <li>
                  <strong className="text-foreground">Authentication session</strong> — We use your existing Pulse Post login session to securely connect the extension to your account.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">
                Information We Do Not Collect
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We do not collect personal browsing history or activity.</li>
                <li>We do not track your behavior on third-party websites.</li>
                <li>We do not collect or store passwords.</li>
                <li>We do not sell, share, or transfer your data to third parties.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">
                How We Use Your Data
              </h2>
              <p>
                Vehicle data is used solely to auto-fill listing forms on marketplace websites when you initiate a post from the Pulse Post dashboard. Data is transmitted securely over HTTPS and is not stored by the extension beyond the active session.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">
                Host Permissions
              </h2>
              <p className="mb-3">
                The extension requires access to the following domains:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">Supabase (*.supabase.co)</strong> — To retrieve your vehicle inventory and AI-generated descriptions.
                </li>
                <li>
                  <strong className="text-foreground">Cloudinary (res.cloudinary.com)</strong> — To load vehicle photos for listing uploads.
                </li>
                <li>
                  <strong className="text-foreground">Facebook Marketplace (www.facebook.com)</strong> — To auto-fill vehicle listing forms when you initiate a post.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">
                Data Security
              </h2>
              <p>
                All data transmission between the extension and our servers uses industry-standard TLS/HTTPS encryption. We do not store sensitive information on local storage beyond what is necessary for the extension to function.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">
                Changes to This Policy
              </h2>
              <p>
                We may update this privacy policy from time to time. Any changes will be reflected on this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Contact</h2>
              <p>
                If you have questions about this privacy policy or your data, contact us at{" "}
                <a
                  href="mailto:support@pulse.lotlyauto.com"
                  className="text-primary hover:underline"
                >
                  support@pulse.lotlyauto.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
