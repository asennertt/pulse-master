import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";

import Products from "@/components/landing/Products";
import Integration from "@/components/landing/Integration";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        
        <Products />
        <Integration />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
