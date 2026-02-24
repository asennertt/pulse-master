"use client";
import { motion, useScroll, useTransform } from "motion/react";
import { TrendingUp, Sparkles, Zap } from "lucide-react";
import { useRef } from "react";

export default function CTASection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 5]);

  return (
    <section
      ref={ref}
      className="py-32 relative overflow-hidden font-space-grotesk"
    >
      {/* Animated background gradient orbs */}
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 bg-[#00D9FF] rounded-full opacity-20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-20 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.25, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating icons background */}
      <motion.div
        className="absolute top-20 left-10 opacity-5"
        animate={{
          y: [0, -30, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Zap className="w-32 h-32 text-[#00D9FF]" />
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          style={{ scale, rotate }}
          className="relative bg-gradient-to-br from-[#1A1F2E] via-[#0F1419] to-[#1A1F2E] p-12 md:p-16 rounded-[3rem] border border-slate-700 overflow-hidden"
        >
          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-[3rem]"
            style={{
              background:
                "linear-gradient(90deg, #00D9FF, #a78bfa, #ec4899, #00D9FF)",
              backgroundSize: "300% 100%",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "300% 0%"],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="absolute inset-[2px] rounded-[3rem] bg-gradient-to-br from-[#1A1F2E] via-[#0F1419] to-[#1A1F2E]" />
          </motion.div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D9FF]/10 via-purple-500/10 to-pink-500/10 rounded-[3rem] blur-2xl" />

          {/* Floating icons */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-10 opacity-20"
          >
            <Sparkles className="w-20 h-20 text-[#00D9FF]" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 left-10 opacity-20"
          >
            <TrendingUp className="w-24 h-24 text-purple-400" />
          </motion.div>

          <div className="relative z-10 text-center">
            {/* Badge with glitch effect */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00D9FF]/20 to-purple-500/20 border border-[#00D9FF]/30 rounded-full px-6 py-2 mb-8 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: ["-200%", "200%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
              <div className="w-2 h-2 bg-[#00D9FF] rounded-full animate-pulse relative z-10" />
              <span className="text-sm font-bold text-[#00D9FF] uppercase tracking-wider relative z-10">
                Limited Time Offer
              </span>
            </motion.div>

            {/* Headline with character animation */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight"
            >
              Ready to Stop
              <br />
              <motion.span
                className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] via-purple-400 to-pink-500"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% auto",
                }}
              >
                Leaving Money
              </motion.span>
              <br />
              on the Table?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Get your first 3 appraisals{" "}
              <span className="text-[#00D9FF] font-bold">completely free</span>.
              No credit card. No BS.
            </motion.p>

            {/* CTA Buttons with particles on hover */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/account/signup")}
                className="group relative px-10 py-6 bg-gradient-to-r from-[#00D9FF] to-purple-500 text-white font-black text-xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,217,255,0.6)]"
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  animate={{
                    x: ["-200%", "200%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />

                <span className="relative z-10 flex items-center gap-3">
                  Get Started Free
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>

                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/pricing")}
                className="group relative px-10 py-6 bg-transparent border-2 border-white text-white font-bold text-xl rounded-2xl overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ y: "100%" }}
                  whileHover={{ y: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 group-hover:text-[#0B1120] transition-colors">
                  View Pricing
                </span>
              </motion.button>
            </motion.div>

            {/* Trust indicators with stagger */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-slate-500"
            >
              {[
                "No credit card required",
                "Cancel anytime",
                "Setup in 60 seconds",
              ].map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <motion.svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1 + i * 0.1, type: "spring" }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </motion.svg>
                  <span>{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        
        .font-space-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }
      `}</style>
    </section>
  );
}
