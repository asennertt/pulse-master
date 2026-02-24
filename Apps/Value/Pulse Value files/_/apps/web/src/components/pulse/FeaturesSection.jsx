import { Camera, Search, BarChart3, Clock } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Camera,
      title: "VIN Scanner",
      description: "Use your phone camera to instantly scan VINs on the lot",
    },
    {
      icon: Search,
      title: "Market Data",
      description:
        "Access real-time pricing from thousands of listings nationwide",
    },
    {
      icon: BarChart3,
      title: "Accurate Valuations",
      description:
        "Get precise appraisals based on condition, mileage, and market trends",
    },
    {
      icon: Clock,
      title: "Instant Results",
      description: "Complete appraisals in under 60 seconds, not hours",
    },
  ];

  return (
    <div id="features" className="bg-[#0D1B2A] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center mb-6">
          <div className="w-1 h-1 bg-[#415A77] rounded-full mr-2"></div>
          <span className="font-inter font-semibold text-sm text-white text-opacity-87">
            Features
          </span>
        </div>

        <h2 className="font-instrument-sans font-bold text-white text-opacity-87 text-[clamp(2.25rem,5vw,5.5rem)] leading-[0.9] mb-16">
          Everything you need to appraise vehicles faster
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-[#1B263B] rounded-[20px] p-8 hover:bg-[#243447] transition-all duration-200"
              >
                <div className="w-12 h-12 bg-[#415A77] rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-inter font-semibold text-xl text-white text-opacity-87 mb-3">
                  {feature.title}
                </h3>
                <p className="font-inter text-base text-white text-opacity-60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
