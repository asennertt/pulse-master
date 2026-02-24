"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

export default function CursorTrail() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Add to trail
      setTrail((prev) => {
        const newTrail = [
          ...prev,
          { x: e.clientX, y: e.clientY, id: Date.now() },
        ];
        return newTrail.slice(-15); // Keep last 15 positions
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      {/* Main cursor glow */}
      <motion.div
        className="fixed pointer-events-none z-50 mix-blend-screen"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      >
        <div className="w-10 h-10 bg-gradient-to-r from-[#00D9FF] to-purple-500 rounded-full blur-xl opacity-50" />
      </motion.div>

      {/* Trail */}
      {trail.map((position, i) => (
        <motion.div
          key={position.id}
          className="fixed pointer-events-none z-40 mix-blend-screen"
          initial={{
            x: position.x - 2,
            y: position.y - 2,
            opacity: 0.6,
            scale: 1,
          }}
          animate={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="w-1 h-1 rounded-full"
            style={{
              background: `hsl(${(i * 360) / trail.length}, 70%, 60%)`,
            }}
          />
        </motion.div>
      ))}
    </>
  );
}
