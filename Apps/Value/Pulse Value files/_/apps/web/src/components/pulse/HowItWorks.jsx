import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "Enter VIN",
      description:
        "Scan with your phone camera or manually enter the vehicle identification number",
    },
    {
      title: "Get Market Data",
      description:
        "Our system pulls real-time pricing from MarketCheck's comprehensive database",
    },
    {
      title: "Review Appraisal",
      description:
        "Receive instant valuation with detailed breakdown and market insights",
    },
  ];

  return (
    <div id="how-it-works" className="bg-[#0D1B2A] py-20">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div>
            <div className="flex items-center mb-6">
              <div className="w-[6px] h-[6px] bg-[#415A77] rounded-full mr-3"></div>
              <span className="font-inter font-medium text-[0.875rem] text-white text-opacity-87 opacity-80 tracking-[0.02em]">
                How It Works
              </span>
            </div>

            <h2 className="font-roboto-condensed font-bold text-[3.75rem] lg:text-[3rem] leading-[1.05] text-white text-opacity-87 mb-8">
              Appraise any vehicle in 3 simple steps
            </h2>

            <div className="mb-12">
              <button
                onClick={() => (window.location.href = "/appraise")}
                className="group flex items-center bg-[#415A77] rounded-full hover:bg-[#4d6a8f] active:bg-[#3a4f66] active:scale-95 hover:transform hover:-translate-y-0.5 transition-all duration-200 w-full md:w-auto"
              >
                <span className="font-poppins font-medium text-white px-8 py-4 flex-grow md:flex-grow-0">
                  Try It Now
                </span>
                <div className="bg-[#0D1B2A] group-hover:bg-opacity-90 group-active:bg-opacity-100 rounded-full p-4 ml-3 mr-1 flex items-center justify-center transition-all duration-200">
                  <ArrowRight className="text-white" size={20} />
                </div>
              </button>
            </div>

            <div className="max-w-[560px]">
              {steps.map((step, index) => (
                <div key={index} className="py-6">
                  <div
                    className="flex items-start space-x-6 cursor-pointer hover:bg-[#1B263B] hover:bg-opacity-50 rounded-lg px-2 py-2 transition-all duration-200"
                    onClick={() => setActiveStep(index)}
                  >
                    <span className="font-inter font-normal text-[1rem] text-white text-opacity-60 flex-shrink-0 mt-1">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="flex-1">
                      <h3 className="font-inter font-semibold text-[1.25rem] text-white text-opacity-87 mb-2">
                        {step.title}
                      </h3>

                      {activeStep === index && (
                        <p className="font-inter font-normal text-[1rem] text-white text-opacity-60 leading-[1.5] mb-4">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    {activeStep === index ? (
                      <div className="h-[3px] bg-[#415A77] w-full max-w-[280px]"></div>
                    ) : (
                      <div className="h-[1px] bg-white bg-opacity-20 w-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1563720360172-67b8f3dce741?auto=format&fit=crop&w=800&q=80"
                alt="Vehicle appraisal process"
                className="w-full h-auto aspect-[4/3] object-cover rounded-[24px] shadow-[0_8px_24px_rgba(10,22,40,0.4)]"
              />
              <div className="absolute inset-0 bg-[#0A1628] bg-opacity-30 rounded-[24px]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
