import Header from "../components/pulse/Header";
import HeroSection from "../components/pulse/HeroSection";
import WhySection from "../components/pulse/WhySection";
import CTASection from "../components/pulse/CTASection";
import Footer from "../components/pulse/Footer";
import ParticleBackground from "../components/pulse/ParticleBackground";
import CursorTrail from "../components/pulse/CursorTrail";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 antialiased selection:bg-[#00D9FF] selection:text-[#0F1419] font-space-grotesk relative overflow-hidden">
      <ParticleBackground />
      <CursorTrail />
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <HeroSection />
        <WhySection />
        <CTASection />
      </main>
      <Footer />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        
        .font-space-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        * {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        @media (max-width: 768px) {
          body {
            cursor: auto;
          }
        }
      `}</style>
    </div>
  );
}
