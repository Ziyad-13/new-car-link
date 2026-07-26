import React, { useState, useEffect } from "react";
import { Sun, Moon, RotateCw } from "lucide-react";
import Meridian from "./components/Meridian";
import Veil from "./components/Veil";
import Gallery from "./components/Gallery";
import Horizon from "./components/Horizon";
import { CarState, ComponentActions } from "./types";
import { tracks, sources, destinations } from "./data";
import { APIProvider } from "@vis.gl/react-google-maps";

const API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || "";

export default function App() {
  const [isNight, setIsNight] = useState(false);
  const [bootStates, setBootStates] = useState<Record<string, boolean>>({
    meridian: false,
    veil: false,
    gallery: false,
    horizon: false,
  });
  const [galleryTab, setGalleryTab] = useState("HOME");

  const [speed, setSpeed] = useState(64);
  const [time, setTime] = useState("");
  const [etaTime, setEtaTime] = useState("");
  const [date, setDate] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [currentSourceIdx, setCurrentSourceIdx] = useState(0);

  // We'll pass a fallback key to APIProvider so the app still renders without a key
  const safeApiKey = API_KEY || "fallback_key";

  const updateClock = () => {
    const now = new Date();
    setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const arrival = new Date(now.getTime() + 14 * 60000);
    setEtaTime(arrival.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setDate(now.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" }));
  };

  const toggleDayNight = () => setIsNight(!isNight);
  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrackIdx((prev) => (prev + 1) % tracks.length);
  const prevTrack = () => setCurrentTrackIdx((prev) => (prev - 1 + tracks.length) % tracks.length);
  const toggleSource = () => setCurrentSourceIdx((prev) => (prev + 1) % sources.length);

  const reboot = (key: string) => {
    setBootStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setBootStates((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const rebootAll = () => {
    ['meridian', 'veil', 'gallery', 'horizon'].forEach((k) => reboot(k));
  };

  useEffect(() => {
    updateClock();
    const interval = setInterval(() => {
      updateClock();
      setSpeed((s) => Math.max(0, Math.min(180, s + (Math.random() > 0.5 ? 1 : -1))));
    }, 1000);

    setTimeout(rebootAll, 100);

    return () => clearInterval(interval);
  }, []);

  const state: CarState = {
    speed,
    time,
    etaTime,
    date,
    isNight,
    isPlaying,
    currentTrack: tracks[currentTrackIdx],
    currentSource: sources[currentSourceIdx],
    destinations,
    bootStates,
    galleryTab,
  };

  const actions: ComponentActions = {
    toggleDayNight,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleSource,
    reboot,
    rebootAll,
    setGalleryTab,
  };

  return (
    <APIProvider apiKey={safeApiKey} version="weekly">
      <div className="p-8 flex flex-col gap-12 items-center font-sans pb-24 min-h-screen">
        {/* Header */}
        <div className="sticky top-4 z-50 bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex gap-6 items-center shadow-2xl">
          <h1 className="font-bold text-sm tracking-widest text-zinc-400">CARLINKKIT PROTOTYPE</h1>
          <div className="w-px h-4 bg-white/20"></div>
          <button
            onClick={toggleDayNight}
            className={`flex items-center gap-2 text-sm hover:text-white transition ${
              isNight ? "text-zinc-400" : "text-zinc-200"
            }`}
          >
            {isNight ? <Moon size={16} /> : <Sun size={16} />}
            {isNight ? "Night Mode" : "Day Mode"}
          </button>
          <button
            onClick={rebootAll}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
          >
            <RotateCw size={16} /> Reboot All
          </button>
        </div>

        {/* The 4 screens grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 mt-4">
          <Meridian state={state} actions={actions} />
          <Veil state={state} actions={actions} />
          <Gallery state={state} actions={actions} />
          <Horizon state={state} actions={actions} />
        </div>
      </div>
    </APIProvider>
  );
}
