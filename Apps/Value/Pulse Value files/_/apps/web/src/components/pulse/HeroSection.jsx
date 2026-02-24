"use client";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

export default function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Animated counter
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => (prev >= 15000 ? 0 : prev + 250));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden font-space-grotesk">
      {/* Floating animated blobs */}
      <motion.div
        className="absolute top-20 right-10 w-96 h-96 bg-[#00D9FF] rounded-full opacity-10 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00D9FF]/20 to-purple-500/20 border border-[#00D9FF]/30 rounded-full px-6 py-2 backdrop-blur-sm">
            <div className="w-2 h-2 bg-[#00D9FF] rounded-full animate-pulse" />
            <span className="text-sm font-bold text-[#00D9FF] uppercase tracking-wider">
              Live Market Data
            </span>
          </div>
        </motion.div>

        {/* Main headline - asymmetric layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left side - Text */}
          <div className="relative">
            <motion.h1
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-8xl font-black text-white mb-6 leading-none"
            >
              Know What
              <br />
              <span className="relative inline-block">
                <span
                  className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] via-purple-400 to-pink-500 animate-gradient"
                  style={{
                    backgroundSize: "200% auto",
                  }}
                >
                  Your Car
                </span>
                {/* Underline animation */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 1 }}
                  className="h-2 bg-gradient-to-r from-[#00D9FF] to-purple-500 rounded-full mt-2"
                />
              </span>
              <br />
              <span className="text-slate-300">Is Worth</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-2xl text-slate-400 mb-8 font-normal max-w-lg"
            >
              Stop guessing. Get{" "}
              <span className="text-[#00D9FF] font-bold">instant</span>,{" "}
              <span className="text-purple-400 font-bold">accurate</span>{" "}
              valuations in seconds.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/appraise")}
                className="group relative px-8 py-5 bg-gradient-to-r from-[#00D9FF] to-[#00C3E6] text-[#0B1120] font-black text-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,217,255,0.6)]"
              >
                <span className="relative z-10 flex items-center gap-2 justify-center">
                  Appraise Now
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/pricing")}
                className="px-8 py-5 bg-slate-800 border-2 border-slate-700 text-white font-bold text-lg rounded-2xl hover:border-[#00D9FF] hover:bg-slate-700 transition-all"
              >
                View Pricing
              </motion.button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-sm text-slate-500 mt-6"
            >
              ✨ 3 free appraisals • No credit card required
            </motion.p>
          </div>

          {/* Right side - Animated stats card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <motion.div
              style={{
                transform: `perspective(1000px) rotateY(${mousePosition.x * 0.5}deg) rotateX(${-mousePosition.y * 0.5}deg)`,
              }}
              className="relative bg-gradient-to-br from-[#1A1F2E] to-[#0F1419] p-8 rounded-3xl border border-slate-700 backdrop-blur-lg shadow-2xl"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00D9FF]/20 to-purple-500/20 rounded-3xl blur-xl" />

              <div className="relative z-10 space-y-6">
                {/* Animated counter */}
                <div>
                  <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
                    Vehicles Analyzed
                  </div>
                  <div className="text-6xl font-black text-white">
                    {counter.toLocaleString()}+
                  </div>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-700">
                  <div>
                    <div className="text-[#00D9FF] text-3xl font-black">
                      98%
                    </div>
                    <div className="text-slate-400 text-sm">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-purple-400 text-3xl font-black">
                      &lt;5s
                    </div>
                    <div className="text-slate-400 text-sm">Avg. Speed</div>
                  </div>
                </div>

                {/* Pulse indicator */}
                <div className="flex items-center gap-3 pt-4">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                  </div>
                  <span className="text-slate-400 text-sm">
                    Live data streaming
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* 3-step process - staggered animation */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              num: "01",
              title: "Enter VIN",
              desc: "Drop in any VIN number",
              color: "#00D9FF",
            },
            {
              num: "02",
              title: "We Analyze",
              desc: "AI scans 1000s of listings",
              color: "#a78bfa",
            },
            {
              num: "03",
              title: "Get Value",
              desc: "Instant accurate pricing",
              color: "#ec4899",
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.2 }}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
              <div className="relative p-6 border border-slate-700 rounded-2xl backdrop-blur-sm group-hover:border-slate-600 transition-colors">
                <div
                  className="text-6xl font-black mb-4 opacity-20"
                  style={{ color: step.color }}
                >
                  {step.num}
                </div>
                <h3 className="text-white font-bold text-2xl mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-400">{step.desc}</p>

                {/* Animated line */}
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-1 rounded-full mt-4"
                  style={{ backgroundColor: step.color }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        
        .font-space-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
}
