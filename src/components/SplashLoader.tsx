import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Car, Cpu, Shield } from "lucide-react";

interface SplashLoaderProps {
  onComplete: () => void;
}

export default function SplashLoader({ onComplete }: SplashLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const bootStatuses = [
    { text: "Initializing Toyota Entune & TSS...", duration: 600 },
    { text: "Connecting to Camry CAN-BUS...", duration: 550 },
    { text: "Configuring wireless link channels...", duration: 550 },
    { text: "Validating safe driving handshake...", duration: 500 },
    { text: "CarPlay link established.", duration: 400 }
  ];

  // Smooth, custom exponential progress speed
  useEffect(() => {
    let currentProgress = 0;
    const totalDuration = bootStatuses.reduce((acc, status) => acc + status.duration, 0);
    const intervalTime = 16; // ~60fps target update rate
    const increment = (100 / totalDuration) * intervalTime;

    const timer = setInterval(() => {
      // Add a slight ease-out deceleration curve to the progress bar for organic feel
      currentProgress += increment * (1.2 - (currentProgress / 100) * 0.5);
      if (currentProgress >= 100) {
        setProgress(100);
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 400); // Quick elegant finish delay
      } else {
        setProgress(currentProgress);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Sync status changes sequentially
  useEffect(() => {
    if (statusIndex >= bootStatuses.length - 1) return;

    const currentStatus = bootStatuses[statusIndex];
    const timer = setTimeout(() => {
      setStatusIndex((prev) => Math.min(prev + 1, bootStatuses.length - 1));
    }, currentStatus.duration);

    return () => clearTimeout(timer);
  }, [statusIndex]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 bg-[#090d16] z-50 flex flex-col items-center justify-center p-8 select-none overflow-hidden"
    >
      {/* Subtle Ambient Vignette Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[100px] opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-transparent to-[#05070d] opacity-90" />
      </div>

      {/* Skip button - Premium Minimalist */}
      <button
        onClick={onComplete}
        className="absolute top-8 right-8 px-4 py-1.5 text-slate-500 hover:text-slate-300 transition-colors text-[10px] font-mono tracking-widest rounded-full border border-white/5 bg-white/[0.02] shadow-sm cursor-pointer active:scale-95"
      >
        SKIP INTRO
      </button>

      {/* Main Container */}
      <div className="flex flex-col items-center justify-center w-full max-w-sm relative z-10">
        
        {/* Glowing Center Emblem */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl scale-110 animate-pulse" />
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/15 flex items-center justify-center shadow-lg relative overflow-hidden">
            <Zap className="w-6 h-6 text-blue-400 fill-blue-400/5" />
            <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
          </div>
        </motion.div>

        {/* Brand Header */}
        <motion.div
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-bold tracking-[0.15em] text-white uppercase font-sans">CarLinkKit</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold tracking-wider">
              CAMRY_2023
            </span>
          </div>
        </motion.div>

        {/* ------------------ MINI CAMRY 2023 SILHOUETTE ------------------ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="w-full relative px-6 py-4 rounded-2xl mb-10 overflow-hidden"
        >
          <svg viewBox="0 0 300 90" className="w-full h-20 text-blue-400/25">
            {/* 2023 Toyota Camry Sedan - Ultra-clean, simplified vector contour */}
            <motion.path
              d="M 30,70 L 65,70 A 13,13 0 0,1 91,70 L 209,70 A 13,13 0 0,1 235,70 L 270,70 C 278,70 282,65 282,60 C 282,55 276,52 268,51 C 250,48 226,38 215,33 C 197,22 182,22 170,22 L 128,22 C 98,22 72,40 62,49 L 36,49 C 32,49 29,52 29,62 C 29,66 29,70 30,70 Z"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ ease: "easeInOut" }}
            />

            {/* Glowing wheel nodes to highlight wheel status naturally */}
            <circle
              cx="78"
              cy="70"
              r="4"
              className="fill-blue-400/80 animate-pulse"
              style={{ opacity: progress > 35 ? 1 : 0 }}
            />
            <circle
              cx="222"
              cy="70"
              r="4"
              className="fill-blue-400/80 animate-pulse"
              style={{ opacity: progress > 70 ? 1 : 0 }}
            />
          </svg>
        </motion.div>

        {/* Smooth Simple Progress and Status Text */}
        <div className="w-full flex flex-col gap-3">
          {/* Progress bar track */}
          <div className="w-full h-[3px] bg-white/[0.03] rounded-full overflow-hidden relative">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          {/* Micro Status Text & Loading Percentage */}
          <div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-slate-500 px-0.5">
            <div className="flex items-center gap-2 max-w-[240px] truncate">
              <span className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={statusIndex}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.18 }}
                  className="text-slate-400 font-medium truncate"
                >
                  {bootStatuses[statusIndex].text}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="font-bold text-blue-400">{Math.round(progress)}%</span>
          </div>
        </div>

      </div>

      {/* Premium Minimalist Footer */}
      <div className="absolute bottom-8 inset-x-0 text-center flex flex-col items-center gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 opacity-60">
          <span>TOYOTA OBD BRIDGE</span>
          <span className="text-slate-800">•</span>
          <span>TSS 2.5 ACTIVE</span>
        </div>
      </div>
    </motion.div>
  );
}
