import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, SkipForward, SkipBack, Phone, Wifi, Battery, 
  MapPin, Compass, Music, Radio, WifiOff, RefreshCw, Smartphone, 
  Tv, MessageSquare, AlertCircle, Sparkles, Check, HelpCircle,
  Youtube, Chrome, History, Calendar, Sliders, Sun, CloudSun, 
  Gauge, Thermometer, Activity, X, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { DongleSettings, DeviceStatus, GoogleUserProfile } from "../types";

const getEnvKey = (): string => {
  try {
    const g = globalThis as any;
    return g.process?.env?.GOOGLE_MAPS_PLATFORM_KEY || "";
  } catch {
    return "";
  }
};

const GOOGLE_MAPS_API_KEY =
  getEnvKey() ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== "YOUR_API_KEY";

const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0f172a" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#334155" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#020617" }] }
];

interface DeviceSimulatorProps {
  settings: DongleSettings;
  status: DeviceStatus;
  setStatus: React.Dispatch<React.SetStateAction<DeviceStatus>>;
  addLog: (level: "info" | "warn" | "error" | "debug", msg: string) => void;
  isRebooting: boolean;
  setIsRebooting: (b: boolean) => void;
  isUpdating: boolean;
  updateProgress: number;
  googleUser: GoogleUserProfile | null;
  onConnectGoogleClick: () => void;
}

export default function DeviceSimulator({
  settings,
  status,
  setStatus,
  addLog,
  isRebooting,
  setIsRebooting,
  isUpdating,
  updateProgress,
  googleUser,
  onConnectGoogleClick
}: DeviceSimulatorProps) {
  // Simulator internal states
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [customWallpaper, setCustomWallpaper] = useState<string>("default");
  const [widgetLeft, setWidgetLeft] = useState<"map" | "compass">("map");
  const [widgetRight1, setWidgetRight1] = useState<"music" | "obd">("music");
  const [widgetRight2, setWidgetRight2] = useState<"calendar" | "weather" | "diagnostics">("calendar");
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [musicProgress, setMusicProgress] = useState(30); // 0-100
  const [musicActionPending, setMusicActionPending] = useState(false);
  const [navOffset, setNavOffset] = useState(0);
  const [phoneBattery, setPhoneBattery] = useState(88);
  const [phoneTime, setPhoneTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeApp, setActiveApp] = useState<"home" | "maps" | "music" | "youtube">("home");
  const [androidAutoApp, setAndroidAutoApp] = useState<"split" | "youtube" | "maps">("split");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("map_search_history");
      return saved ? JSON.parse(saved) : ["SFO Airport", "Los Angeles Pier", "New York Central Park", "Googleplex Mountain View"];
    } catch {
      return ["SFO Airport", "Los Angeles Pier", "New York Central Park", "Googleplex Mountain View"];
    }
  });

  // Google Map States
  const [mapCenter, setMapCenter] = useState({ lat: 36.556, lng: -121.923 }); // Carmel/PCH Scenic Route
  const [mapZoom, setMapZoom] = useState(13);

  const handleSearch = (query: string) => {
    if (!query) return;
    const trimmed = query.trim();
    if (!trimmed) return;
    addLog("info", `[Google Maps] Initiating lookup for: "${trimmed}"`);

    // Update search history and persist to localStorage
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8); // Keep last 8 searches
      localStorage.setItem("map_search_history", JSON.stringify(updated));
      return updated;
    });
    
    if (typeof window !== "undefined" && (window as any).google && (window as any).google.maps && (window as any).google.maps.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: trimmed }, (results: any, status: any) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const newCenter = { lat: location.lat(), lng: location.lng() };
          setMapCenter(newCenter);
          setMapZoom(14);
          addLog("info", `[Google Maps] Successfully resolved address: "${results[0].formatted_address}"`);
        } else {
          addLog("error", `[Google Maps] Geocoding service failed with status: ${status}`);
        }
      });
    } else {
      addLog("warn", `[Google Maps] Service is in simulation fallback mode. Resolving local mock.`);
      const lowerQuery = trimmed.toLowerCase();
      if (lowerQuery.includes("sf") || lowerQuery.includes("san francisco") || lowerQuery.includes("airport")) {
        setMapCenter({ lat: 37.7749, lng: -122.4194 });
        setMapZoom(13);
      } else if (lowerQuery.includes("la") || lowerQuery.includes("los angeles") || lowerQuery.includes("pier")) {
        setMapCenter({ lat: 34.0522, lng: -118.2437 });
        setMapZoom(13);
      } else if (lowerQuery.includes("ny") || lowerQuery.includes("new york") || lowerQuery.includes("park")) {
        setMapCenter({ lat: 40.7128, lng: -74.0060 });
        setMapZoom(13);
      } else if (lowerQuery.includes("google") || lowerQuery.includes("mountain view") || lowerQuery.includes("googleplex")) {
        setMapCenter({ lat: 37.4220, lng: -122.0841 });
        setMapZoom(15);
      } else {
        // Shift map coordinates to simulate navigation
        setMapCenter(prev => ({ lat: prev.lat + 0.015, lng: prev.lng - 0.015 }));
        setMapZoom(14);
      }
    }
  };

  // YouTube States
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoVolume, setVideoVolume] = useState(80);
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [isBufferingVideo, setIsBufferingVideo] = useState(false);

  const mockVideos = [
    {
      id: 0,
      title: "Carlinkit 5.0 Wireless Adapter Review & Setup Guide",
      channel: "Car Tech Labs",
      duration: "12:45",
      views: "142K views",
      durationSec: 765,
      thumbColor: "from-red-600 via-orange-600 to-amber-600"
    },
    {
      id: 1,
      title: "How to Fix CarPlay Lag & Audio Stutter in 3 Steps",
      channel: "Dongle Doctor",
      duration: "8:20",
      views: "89K views",
      durationSec: 500,
      thumbColor: "from-indigo-600 via-purple-600 to-pink-600"
    },
    {
      id: 2,
      title: "Mulholland Highway - Night Drive (4K 60FPS HDR)",
      channel: "Ambient Dashcam",
      duration: "25:00",
      views: "210K views",
      durationSec: 1500,
      thumbColor: "from-emerald-600 via-teal-600 to-cyan-600"
    },
    {
      id: 3,
      title: "Retro Synthwave Sunset Driving Mix (No Copyright Beats)",
      channel: "Chilled Dreams",
      duration: "45:30",
      views: "1.2M views",
      durationSec: 2730,
      thumbColor: "from-blue-600 via-violet-600 to-rose-600"
    }
  ];

  const musicTimerRef = useRef<any>(null);
  const navTimerRef = useRef<any>(null);
  const videoTimerRef = useRef<any>(null);

  // Playback timer for YouTube Video progress
  useEffect(() => {
    if (isPlayingVideo && status.connectionState === "connected_phone" && !isRebooting && !isBufferingVideo) {
      videoTimerRef.current = setInterval(() => {
        setVideoProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 1000);
    } else {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    }
    return () => {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    };
  }, [isPlayingVideo, isBufferingVideo, status.connectionState, isRebooting]);

  const handleSelectVideo = (index: number) => {
    setSelectedVideo(index);
    setVideoProgress(0);
    setIsPlayingVideo(false);
    setIsBufferingVideo(true);
    
    const delay = Math.max(800, settings.audioDelay);
    addLog("info", `[YouTube Streaming] Loading video stream: "${mockVideos[index].title}"`);
    addLog("debug", `[YouTube Protocol] Resolving media chunk manifest. Pre-buffering ${delay}ms`);

    setTimeout(() => {
      setIsBufferingVideo(false);
      setIsPlayingVideo(true);
      addLog("info", `[YouTube Streaming] Stream buffering complete. Video active @ ${settings.resolution}.`);
    }, delay);
  };

  // Keep phone clock updated
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setPhoneTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Map route offset animation (adjusts based on settings.fps)
  useEffect(() => {
    const intervalTime = settings.fps === 60 ? 16 : 33; // ~60fps vs ~30fps
    const increment = settings.fps === 60 ? 0.3 : 0.6; // step size

    const runNavAnim = () => {
      if (status.connectionState === "connected_phone" && !isRebooting) {
        setNavOffset((prev) => (prev + increment) % 100);
      }
    };

    navTimerRef.current = setInterval(runNavAnim, intervalTime);
    return () => {
      if (navTimerRef.current) clearInterval(navTimerRef.current);
    };
  }, [status.connectionState, settings.fps, isRebooting]);

  // Music progress bar and wave animations
  useEffect(() => {
    if (isPlayingMusic && status.connectionState === "connected_phone" && !isRebooting) {
      musicTimerRef.current = setInterval(() => {
        setMusicProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 0.5;
        });
      }, 100);
    } else {
      if (musicTimerRef.current) clearInterval(musicTimerRef.current);
    }
    return () => {
      if (musicTimerRef.current) clearInterval(musicTimerRef.current);
    };
  }, [isPlayingMusic, status.connectionState, isRebooting]);

  // Handle simulate connection process
  const handleConnectPhone = () => {
    if (status.connectionState === "disconnected") {
      addLog("info", "User initiated pairing sequence from simulator screen.");
      setStatus(prev => ({ ...prev, connectionState: "pairing" }));
      addLog("info", "Searching for Bluetooth beacon: " + status.bluetoothName);
      
      setTimeout(() => {
        addLog("info", "Bluetooth pairing handshake accepted. Negotiating Wi-Fi handoff...");
        setStatus(prev => ({ ...prev, connectionState: "connected_dongle" }));
        
        setTimeout(() => {
          addLog("info", "Wi-Fi secure bridge established. IP Assigned: 192.168.50.150");
          addLog("info", `Starting virtual screen mirroring (${settings.resolution} @ ${settings.fps} FPS)`);
          setStatus(prev => ({ ...prev, connectionState: "connected_phone" }));
          addLog("info", "CarPlay protocol tunnel connected. Interface active.");
        }, 1500);
      }, 1500);
    }
  };

  const handleDisconnectPhone = () => {
    addLog("warn", "User manually disconnected mobile device from simulator panel.");
    setStatus(prev => ({ ...prev, connectionState: "disconnected" }));
    setIsPlayingMusic(false);
  };

  // Play/Pause music with SIMULATED latency according to settings.audioDelay
  const togglePlayMusic = () => {
    if (musicActionPending) return;

    setMusicActionPending(true);
    const delay = settings.audioDelay;
    
    addLog("debug", `Simulating audio command buffer. Delay settings: ${delay}ms`);
    
    setTimeout(() => {
      setIsPlayingMusic((prev) => {
        const nextState = !prev;
        addLog("info", `Audio stream ${nextState ? "STARTED" : "PAUSED"} (latched after ${delay}ms)`);
        return nextState;
      });
      setMusicActionPending(false);
    }, delay);
  };

  // Determine wallpapers based on background setting
  const getWallpaperClass = () => {
    if (customWallpaper === "stealth") return "bg-neutral-950";
    if (customWallpaper === "carbon") return "bg-slate-950 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px]";
    if (customWallpaper === "sunset") return "bg-gradient-to-tr from-violet-950 via-slate-950 to-amber-950/70";
    if (customWallpaper === "neon") return "bg-gradient-to-tr from-indigo-950 via-zinc-950 to-fuchsia-950/60";
    if (customWallpaper === "acid") return "bg-gradient-to-tr from-slate-950 via-stone-900 to-lime-950/40";
    if (customWallpaper === "ocean") return "bg-gradient-to-tr from-cyan-950 via-blue-950 to-emerald-950/40";

    if (settings.background === "black") return "bg-black";
    if (settings.background === "dark") return "bg-gradient-to-tr from-slate-900 via-zinc-900 to-indigo-950";
    return "bg-gradient-to-tr from-blue-900 via-neutral-900 to-slate-950";
  };

  return (
    <div id="device-simulator-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden flex flex-col justify-between h-full relative">
      {/* Absolute Overlays */}
      <AnimatePresence>
        {isRebooting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center text-center p-6"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Smartphone className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-white mb-2 font-sans">CarLinkKit Rebooting</h3>
            <p className="text-xs text-slate-400 font-mono">Syncing system caches... Resetting Wi-Fi socket...</p>
          </motion.div>
        )}

        {isUpdating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center text-center p-6"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-blue-500/10 border-t-blue-500 border-r-blue-500 animate-spin" />
              <Sparkles className="w-10 h-10 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-white mb-2 font-sans">Firmware Update in Progress</h3>
            <p className="text-xs text-slate-400 font-mono mb-4">DO NOT TURN OFF CAR ENGINE OR DONGLE</p>
            <div className="w-64 bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-teal-400 h-full"
                style={{ width: `${updateProgress}%` }}
              />
            </div>
            <span className="text-sm font-mono text-blue-400 font-bold">{updateProgress}% Complete</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status.connectionState === "connected_phone" ? "bg-emerald-500 animate-pulse" :
            status.connectionState === "pairing" ? "bg-amber-500 animate-pulse" : "bg-slate-500"
          }`} />
          <span className="text-xs font-mono tracking-wider font-semibold uppercase text-slate-400">
            Sandbox Simulator: {status.dongleModel}
          </span>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Mode: <span className="text-blue-400 font-semibold uppercase">{settings.workMode}</span>
        </div>
      </div>

      {/* Main Virtual Screen Panel */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl relative flex flex-col justify-between overflow-hidden shadow-2xl min-h-[280px]">
        
        {/* DISCONNECTED STATE */}
        {status.connectionState === "disconnected" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all cursor-pointer shadow-lg group" onClick={handleConnectPhone}>
              <Smartphone className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">Head Unit Awaiting Connection</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Connect your smartphone via Bluetooth to start wireless <span className="capitalize">{settings.workMode}</span>.
            </p>
            <button 
              id="btn-pair-phone"
              onClick={handleConnectPhone}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              Pair Phone (Bluetooth)
            </button>
            
            <div className="mt-6 flex gap-4 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1"><WifiOff className="w-3 h-3" /> BT Beacon Live</span>
              <span>•</span>
              <span>BT: {status.bluetoothName}</span>
            </div>
          </div>
        )}

        {/* PAIRING SEQUENCE */}
        {status.connectionState === "pairing" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border border-slate-800 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-blue-500" />
              </div>
              <div className="absolute inset-0 border border-blue-500/40 rounded-full animate-ping scale-125" />
            </div>
            <h4 className="text-sm font-semibold text-blue-400 animate-pulse mb-1">Pairing Smartphone...</h4>
            <p className="text-xs text-slate-400 font-mono">
              Accepting BT pairing from "Ziyad's iPhone"...
            </p>
          </div>
        )}

        {/* DONGLE HANDSHAKING */}
        {status.connectionState === "connected_dongle" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
            <div className="relative mb-4">
              <RefreshCw className="w-10 h-10 text-teal-400 animate-spin" />
            </div>
            <h4 className="text-sm font-semibold text-teal-400 mb-1">Negotiating Secure Tunnel</h4>
            <p className="text-xs text-slate-400 font-mono">
              Establishing 5GHz Wi-Fi session. Mapping protocol...
            </p>
          </div>
        )}

        {/* CONNECTED & MIRRORING ACTIVE */}
        {status.connectionState === "connected_phone" && (
          <div className={`flex-1 flex flex-col h-full relative ${getWallpaperClass()} transition-all duration-500`}>
            
            {/* CARPLAY LAYOUT */}
            {settings.workMode === "carplay" && (
              <div className="flex-1 flex h-full text-white overflow-hidden text-xs">
                {/* Left Sidebar (CarPlay signature) */}
                <div className="w-12 bg-black/75 backdrop-blur-md border-r border-white/10 flex flex-col justify-between items-center py-2 z-10">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold font-sans tracking-tight">{phoneTime}</span>
                    <div className="flex flex-col items-center gap-0.5 text-slate-400 mt-1">
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <Battery className="w-3 h-3 text-slate-300" />
                      </div>
                    </div>
                  </div>

                  {/* CarPlay App Quick Launchers */}
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setActiveApp("home")}
                      className={`p-1.5 rounded-lg transition-all ${activeApp === "home" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                      title="Home"
                    >
                      <Tv className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setActiveApp("maps")}
                      className={`p-1.5 rounded-lg transition-all ${activeApp === "maps" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                      title="Maps"
                    >
                      <Compass className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button 
                      onClick={() => setActiveApp("music")}
                      className={`p-1.5 rounded-lg transition-all ${activeApp === "music" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                      title="Music"
                    >
                      <Music className="w-4 h-4 text-blue-400" />
                    </button>
                    <button 
                      onClick={() => setActiveApp("youtube")}
                      className={`p-1.5 rounded-lg transition-all ${activeApp === "youtube" ? "bg-red-600/20 text-red-500" : "text-slate-400 hover:text-red-500"}`}
                      title="YouTube"
                    >
                      <Youtube className="w-4 h-4 text-red-500" />
                    </button>
                  </div>

                  {/* CarPlay Home button */}
                  <button 
                    onClick={() => setActiveApp("home")}
                    className="w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-100" />
                  </button>
                </div>

                {/* Main Dashboard Screen */}
                <div className="flex-1 flex flex-col relative h-full">
                                   {/* CARPLAY APP: SPLIT DASHBOARD HOME */}
                  {activeApp === "home" && (
                    <div className="flex-1 p-3 flex gap-3 h-full overflow-hidden relative">
                      
                      {/* Left Side: Live Mini Map or Precision Compass HUD */}
                      {widgetLeft === "map" ? (
                        <div 
                          onClick={() => setActiveApp("maps")}
                          className="bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md rounded-xl p-3 border border-white/5 relative overflow-hidden flex flex-col justify-between cursor-pointer group"
                          style={{ 
                            flex: settings.screenLayout === "golden" 
                              ? "1.618 1 0%" 
                              : settings.screenLayout === "immersive" 
                              ? "3 1 0%" 
                              : "1 1 0%" 
                          }}
                        >
                          {hasValidKey ? (
                            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                              <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                                <Map
                                  center={mapCenter}
                                  zoom={mapZoom - 1}
                                  mapId="CARPLAY_MINI_MAP"
                                  disableDefaultUI={true}
                                  styles={DARK_MAP_STYLE}
                                  gestureHandling="none"
                                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                                  style={{ width: '100%', height: '100%' }}
                                >
                                  <AdvancedMarker position={mapCenter}>
                                    <div className="w-5 h-5 rounded-full bg-blue-600 border border-white flex items-center justify-center shadow-md">
                                      <Compass className="w-2.5 h-2.5 text-white animate-pulse" />
                                    </div>
                                  </AdvancedMarker>
                                </Map>
                              </APIProvider>
                              {/* Visual overlay to catch pointers and look styled */}
                              <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
                            </div>
                          ) : (
                            <>
                              {/* Map Grid background simulation */}
                              <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <svg width="100%" height="100%">
                                  <defs>
                                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#grid)" />
                                </svg>
                              </div>

                              {/* Simulated route line */}
                              <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ opacity: 0.8 }}>
                                <path 
                                  d="M -10 50 Q 50 120 120 40 T 260 90" 
                                  fill="none" 
                                  stroke="#3b82f6" 
                                  strokeWidth="4" 
                                  strokeLinecap="round"
                                  strokeDasharray="8 6"
                                  strokeDashoffset={-navOffset * 1.5}
                                />
                              </svg>
                            </>
                          )}

                          <div className="flex items-center justify-between z-10">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-950/85 border border-blue-900/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                              {hasValidKey ? "Google Maps" : "Porsche GPS"}
                            </span>
                            <Compass className="w-4 h-4 text-slate-300 group-hover:rotate-45 transition-transform duration-300" />
                          </div>
                          
                          <div className="z-10 mt-2 bg-slate-950/60 p-1.5 rounded-lg border border-white/5 backdrop-blur-sm max-w-[150px]">
                            <div className="text-[10px] font-bold leading-tight truncate">
                              {hasValidKey ? "Pacific Coast Hwy" : "Mulholland Dr"}
                            </div>
                            <div className="text-[8px] text-slate-400">
                              {hasValidKey ? "Live Navigation active" : "Next turn 0.4 mi"}
                            </div>
                          </div>

                          <div className="flex items-end justify-between z-10 mt-2">
                            <span className="text-xl font-bold tracking-tight bg-slate-950/65 px-1.5 py-0.5 rounded-lg border border-white/5 backdrop-blur-sm">
                              65 <span className="text-[10px] text-slate-400 font-normal">MPH</span>
                            </span>
                            <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-white text-black flex items-center justify-center font-bold text-[9px] shadow-sm">
                              55
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md rounded-xl p-3 border border-white/5 relative overflow-hidden flex flex-col justify-between cursor-pointer group"
                          style={{ 
                            flex: settings.screenLayout === "golden" 
                              ? "1.618 1 0%" 
                              : settings.screenLayout === "immersive" 
                              ? "3 1 0%" 
                              : "1 1 0%" 
                          }}
                        >
                          <div className="flex items-center justify-between z-10">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 bg-teal-950/85 border border-teal-900/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                              Precision Compass
                            </span>
                            <Compass className="w-4 h-4 text-teal-400 animate-spin" style={{ animationDuration: "20s" }} />
                          </div>

                          {/* Vector Compass Dial */}
                          <div className="flex justify-center items-center my-1 relative">
                            <div className="w-24 h-24 rounded-full border border-slate-700/60 bg-slate-950/80 flex items-center justify-center shadow-inner relative">
                              <div className="absolute inset-1 border border-dashed border-teal-500/20 rounded-full animate-pulse" />
                              <span className="absolute top-1 text-[8px] font-bold text-teal-400">N</span>
                              <span className="absolute right-1.5 text-[8px] font-bold text-slate-500">E</span>
                              <span className="absolute bottom-1 text-[8px] font-bold text-slate-500">S</span>
                              <span className="absolute left-1.5 text-[8px] font-bold text-slate-500">W</span>
                              
                              <div className="w-12 h-12 flex items-center justify-center relative">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform rotate-45 transition-transform duration-700">
                                  <polygon points="50,15 70,60 50,45 30,60" fill="#2dd4bf" />
                                </svg>
                              </div>
                              
                              <div className="absolute text-[10px] font-mono font-bold text-teal-300 bg-slate-900/90 px-1 py-0.5 rounded border border-white/5">
                                284° WNW
                              </div>
                            </div>
                          </div>

                          <div className="z-10 flex items-end justify-between">
                            <div className="text-[8px] font-mono text-slate-400 leading-normal">
                              <div>Lat: <span className="text-slate-200">36.556° N</span></div>
                              <div>Lng: <span className="text-slate-200">-121.923° W</span></div>
                            </div>
                            <div className="text-[8px] font-mono text-right text-slate-400 leading-normal">
                              <div>Alt: <span className="text-slate-200">142 FT</span></div>
                              <div>Sats: <span className="text-emerald-400 font-bold">10 Lock</span></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Right Side Stack */}
                      <div className="flex flex-col gap-2.5 h-full overflow-hidden" style={{ flex: "1 1 0%" }}>
                        {/* Right Slot 1 Widget */}
                        {widgetRight1 === "music" ? (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-xl p-2.5 border border-white/5 flex flex-col justify-between flex-[1.2] relative overflow-hidden">
                            <div className="flex gap-2">
                              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden shrink-0">
                                <Music className="w-4.5 h-4.5 text-white/90" />
                                {isPlayingMusic && (
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-0.5">
                                    <span className="w-1 bg-white animate-[bounce_1s_infinite_100ms]" style={{ height: "40%" }} />
                                    <span className="w-1 bg-white animate-[bounce_1s_infinite_300ms]" style={{ height: "70%" }} />
                                    <span className="w-1 bg-white animate-[bounce_1s_infinite_200ms]" style={{ height: "55%" }} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold truncate text-[11px] text-white">Drive Vibes</div>
                                <div className="text-[9px] text-slate-400 truncate">Symphony Retro</div>
                              </div>
                            </div>

                            {/* Music controls */}
                            <div className="flex items-center justify-between gap-1 my-1">
                              <button className="text-slate-400 hover:text-white cursor-pointer"><SkipBack className="w-3.5 h-3.5" /></button>
                              <button 
                                onClick={togglePlayMusic}
                                className="w-6.5 h-6.5 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md relative cursor-pointer"
                                disabled={musicActionPending}
                              >
                                {musicActionPending ? (
                                  <RefreshCw className="w-3 h-3 animate-spin text-black" />
                                ) : isPlayingMusic ? (
                                  <Pause className="w-3 h-3 fill-black" />
                                ) : (
                                  <Play className="w-3 h-3 fill-black ml-0.5" />
                                )}
                              </button>
                              <button className="text-slate-400 hover:text-white cursor-pointer"><SkipForward className="w-3.5 h-3.5" /></button>
                            </div>

                            {/* Sound wave / delay visualization */}
                            <div className="h-3 flex items-end justify-center gap-0.5 mt-0.5">
                              {isPlayingMusic ? (
                                Array.from({ length: 14 }).map((_, i) => (
                                  <motion.div 
                                    key={i}
                                    className="w-0.5 bg-blue-500 rounded-full"
                                    animate={{ height: ["3px", `${Math.random() * 8 + 3}px`, "3px"] }}
                                    transition={{ 
                                      repeat: Infinity, 
                                      duration: Math.max(0.6, Math.random() * 1.5),
                                      delay: i * 0.05 
                                    }}
                                  />
                                ))
                              ) : (
                                <div className="w-full h-[1px] bg-slate-800" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-xl p-2.5 border border-white/5 flex flex-col justify-between flex-[1.2] relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1">
                                <Gauge className="w-3 h-3 text-amber-500" />
                                OBD-II Engine Link
                              </span>
                              <span className="text-[8px] text-emerald-400 font-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                OBD-OK
                              </span>
                            </div>

                            {/* Real-time OBD telemetry visualizers */}
                            <div className="grid grid-cols-2 gap-2 my-1">
                              {/* RPM Gauge */}
                              <div className="bg-slate-950/60 border border-white/5 rounded-lg p-1 text-center flex flex-col justify-between">
                                <span className="text-[7px] text-slate-500 uppercase font-mono">Engine RPM</span>
                                <div className="text-xs font-mono font-bold text-amber-400 leading-tight">
                                  2,450 <span className="text-[7px] text-slate-500 font-normal">rpm</span>
                                </div>
                                <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full w-[45%]" />
                                </div>
                              </div>
                              
                              {/* Engine Boost Gauge */}
                              <div className="bg-slate-950/60 border border-white/5 rounded-lg p-1 text-center flex flex-col justify-between">
                                <span className="text-[7px] text-slate-500 uppercase font-mono">Turbo Boost</span>
                                <div className="text-xs font-mono font-bold text-teal-400 leading-tight">
                                  +14.2 <span className="text-[7px] text-slate-500 font-normal">psi</span>
                                </div>
                                <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                                  <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full w-[65%]" />
                                </div>
                              </div>
                            </div>

                            {/* Bottom secondary telemetry readouts */}
                            <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 px-1 border-t border-slate-800/60 pt-1">
                              <div className="flex items-center gap-1">
                                <Thermometer className="w-2.5 h-2.5 text-blue-400" />
                                <span>Coolant: <span className="text-slate-200">88°C</span></span>
                              </div>
                              <div>
                                <span>Gear: <span className="text-blue-400 font-semibold">D4</span></span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Right Slot 2 Widget */}
                        {widgetRight2 === "calendar" ? (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-xl p-2.5 border border-white/5 flex flex-col justify-between flex-[0.8] relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                                <Calendar className="w-3 h-3 text-emerald-500" />
                                <span>Upcoming Event</span>
                              </div>
                              <span className="text-[7px] font-mono text-slate-400">10:30 AM</span>
                            </div>
                            
                            <div className="my-0.5">
                              <p className="text-slate-100 font-bold text-[10px] leading-tight truncate">Product Design Sync</p>
                              <p className="text-[8px] text-slate-400 mt-0.5 leading-none font-sans">CarLinkKit HQ Boardroom</p>
                            </div>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[7px] text-emerald-400 font-mono flex items-center gap-1 leading-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                              <span>Starting in 15 mins</span>
                            </div>
                          </div>
                        ) : widgetRight2 === "weather" ? (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-xl p-2.5 border border-white/5 flex flex-col justify-between flex-[0.8] relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[8px] font-bold text-sky-400 uppercase tracking-wider font-mono">
                                <CloudSun className="w-3 h-3 text-sky-400" />
                                <span>Weather</span>
                              </div>
                              <span className="text-[7px] font-mono text-slate-400">Monterey Bay</span>
                            </div>
                            
                            <div className="flex justify-between items-center my-0.5">
                              <div className="min-w-0">
                                <p className="text-slate-100 font-bold text-[13px] leading-none">72°F</p>
                                <p className="text-[8px] text-slate-400 truncate mt-0.5">Clear Sky • Sunny</p>
                              </div>
                              <Sun className="w-7 h-7 text-amber-400 animate-pulse" />
                            </div>

                            <div className="bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded text-[7px] text-sky-400 font-mono flex justify-between leading-none">
                              <span>Precip: 0%</span>
                              <span>•</span>
                              <span>Wind: 8mph</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-900/40 backdrop-blur-md rounded-xl p-2.5 border border-white/5 flex flex-col justify-between flex-[0.8] relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[8px] font-bold text-teal-400 uppercase tracking-wider font-mono">
                                <Activity className="w-3 h-3 text-teal-500" />
                                <span>Dongle Health</span>
                              </div>
                              <span className="text-[7px] font-mono text-emerald-400">100% stable</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-1 my-0.5 text-center">
                              <div className="bg-slate-950/50 rounded p-0.5 border border-white/5">
                                <div className="text-[5px] text-slate-500 font-mono uppercase">CPU</div>
                                <div className="text-[8px] font-bold text-slate-200 font-mono">{status.cpuUsage}%</div>
                              </div>
                              <div className="bg-slate-950/50 rounded p-0.5 border border-white/5">
                                <div className="text-[5px] text-slate-500 font-mono uppercase">Temp</div>
                                <div className="text-[8px] font-bold text-blue-400 font-mono">{status.temperature}°C</div>
                              </div>
                              <div className="bg-slate-950/50 rounded p-0.5 border border-white/5">
                                <div className="text-[5px] text-slate-500 font-mono uppercase">Signal</div>
                                <div className="text-[8px] font-bold text-emerald-400 font-mono">{status.wifiSignal}dB</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[7px] font-mono text-slate-400">
                              <span className="truncate">SSID: {status.wifiSsid}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            </div>
                          </div>
                        )}

                        {/* Audio delay feedback banner */}
                        {settings.audioDelay > 1000 && isPlayingMusic && (
                          <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5 text-[8px] flex items-center gap-1 leading-tight font-mono shrink-0">
                            <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate font-mono">Audio lag ({settings.audioDelay}ms)</span>
                          </div>
                        )}
                      </div>

                      {/* Customize Dashboard Trigger Button */}
                      <button
                        onClick={() => setIsCustomizerOpen(true)}
                        className="absolute bottom-1.5 right-1.5 p-1 rounded-lg bg-black/70 hover:bg-black/90 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white transition-all shadow-lg active:scale-90 flex items-center gap-1 text-[8px] font-mono z-20 cursor-pointer"
                      >
                        <Sliders className="w-2.5 h-2.5 text-blue-400" />
                        Customize UI
                      </button>

                      {/* Interactive CarPlay Customizer Slide-Over Panel */}
                      <AnimatePresence>
                        {isCustomizerOpen && (
                          <motion.div 
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute inset-y-0 right-0 w-64 bg-slate-950/95 backdrop-blur-lg border-l border-white/10 z-30 flex flex-col p-3 shadow-2xl overflow-y-auto"
                          >
                            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 shrink-0">
                              <span className="text-[10px] font-bold tracking-wide text-slate-200 uppercase font-mono flex items-center gap-1">
                                <Sliders className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                                Launcher Customizer
                              </span>
                              <button 
                                onClick={() => setIsCustomizerOpen(false)}
                                className="p-1 rounded bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex flex-col gap-3 flex-1 select-none text-[8px]">
                              {/* Wallpapers */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest font-mono">Premium Wallpapers</span>
                                <div className="grid grid-cols-2 gap-1">
                                  {[
                                    { id: "default", label: "Default", color: "bg-gradient-to-tr from-blue-900 to-slate-950" },
                                    { id: "stealth", label: "Stealth", color: "bg-neutral-900" },
                                    { id: "carbon", label: "Carbon Grid", color: "bg-slate-900 border-dashed" },
                                    { id: "sunset", label: "Sunset", color: "bg-gradient-to-tr from-purple-900 to-amber-950/50" },
                                    { id: "neon", label: "Neon Volt", color: "bg-gradient-to-tr from-indigo-900 to-fuchsia-950/50" },
                                    { id: "acid", label: "Acid Racing", color: "bg-gradient-to-tr from-stone-900 to-lime-950/50" },
                                    { id: "ocean", label: "Deep Ocean", color: "bg-gradient-to-tr from-cyan-900 to-emerald-950/50" }
                                  ].map(wp => (
                                    <button
                                      key={wp.id}
                                      onClick={() => {
                                        setCustomWallpaper(wp.id);
                                        addLog("info", `Wallpaper changed to premium style: [${wp.label}]`);
                                      }}
                                      className={`flex items-center gap-1 p-1 rounded-lg border text-[7px] font-mono transition-all text-left truncate cursor-pointer ${
                                        customWallpaper === wp.id ? "border-blue-500 bg-white/5 text-blue-400" : "border-white/5 hover:border-white/15 bg-slate-900/40 text-slate-300"
                                      }`}
                                    >
                                      <span className={`w-2.5 h-2.5 rounded ${wp.color} shrink-0 border border-white/10`} />
                                      <span className="truncate">{wp.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Left Slot */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest font-mono">Left Slot (Large)</span>
                                <div className="grid grid-cols-2 gap-1">
                                  {[
                                    { id: "map", label: "Active Map GPS" },
                                    { id: "compass", label: "Compass HUD" }
                                  ].map(wd => (
                                    <button
                                      key={wd.id}
                                      onClick={() => {
                                        setWidgetLeft(wd.id as any);
                                        addLog("info", `Customized Left Widget Slot: [${wd.label}]`);
                                      }}
                                      className={`p-1 rounded border text-[7px] font-mono transition-all text-left cursor-pointer ${
                                        widgetLeft === wd.id ? "border-blue-500 bg-blue-500/5 text-blue-300" : "border-white/5 hover:border-white/15 text-slate-300 bg-slate-900/40"
                                      }`}
                                    >
                                      <span className="font-bold truncate block">{wd.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Right Slot 1 */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest font-mono">Right Slot 1 (Medium)</span>
                                <div className="grid grid-cols-2 gap-1">
                                  {[
                                    { id: "music", label: "Media Player" },
                                    { id: "obd", label: "OBD-II G-Force" }
                                  ].map(wd => (
                                    <button
                                      key={wd.id}
                                      onClick={() => {
                                        setWidgetRight1(wd.id as any);
                                        addLog("info", `Customized Right Slot 1 Widget: [${wd.label}]`);
                                      }}
                                      className={`p-1 rounded border text-[7px] font-mono transition-all text-left cursor-pointer ${
                                        widgetRight1 === wd.id ? "border-blue-500 bg-blue-500/5 text-blue-300" : "border-white/5 hover:border-white/15 text-slate-300 bg-slate-900/40"
                                      }`}
                                    >
                                      <span className="font-bold truncate block">{wd.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Right Slot 2 */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest font-mono">Right Slot 2 (Details)</span>
                                <div className="grid grid-cols-3 gap-1">
                                  {[
                                    { id: "calendar", label: "Calendar" },
                                    { id: "weather", label: "Weather" },
                                    { id: "diagnostics", label: "Status" }
                                  ].map(wd => (
                                    <button
                                      key={wd.id}
                                      onClick={() => {
                                        setWidgetRight2(wd.id as any);
                                        addLog("info", `Customized Right Slot 2 Widget: [${wd.label}]`);
                                      }}
                                      className={`p-1 rounded border text-[6px] font-mono transition-all text-center truncate cursor-pointer ${
                                        widgetRight2 === wd.id ? "border-blue-500 bg-blue-500/5 text-blue-300" : "border-white/5 hover:border-white/15 text-slate-300 bg-slate-900/40"
                                      }`}
                                    >
                                      <span className="font-bold block truncate">{wd.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Reset */}
                              <button
                                onClick={() => {
                                  setCustomWallpaper("default");
                                  setWidgetLeft("map");
                                  setWidgetRight1("music");
                                  setWidgetRight2("calendar");
                                  addLog("info", "Reset all CarPlay launcher custom styles & layouts to factory settings.");
                                }}
                                className="mt-1 w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-white text-[7px] font-mono font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                Reset Factory Layout
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* CARPLAY APP: FULL MAPS VIEW */}
                  {activeApp === "maps" && (
                    <div className="flex-1 flex flex-col p-3 h-full relative overflow-hidden font-sans">
                      {/* Search Bar overlay */}
                      <div className="absolute top-5 left-5 right-5 z-20 flex flex-col gap-1.5">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Search address or city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSearch(searchQuery);
                            }}
                            className="flex-1 bg-slate-900/95 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 backdrop-blur-md font-sans shadow-lg"
                          />
                          <button 
                            onClick={() => handleSearch(searchQuery)}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            Go
                          </button>
                        </div>

                        {/* CarPlay Maps Search History Dropdown */}
                        <AnimatePresence>
                          {isSearchFocused && searchHistory.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="bg-slate-900/98 border border-white/10 rounded-lg overflow-hidden shadow-2xl backdrop-blur-md text-[10px] max-h-36 overflow-y-auto"
                            >
                              <div className="px-2 py-1 text-[8px] text-slate-400 font-mono font-bold uppercase tracking-wider border-b border-white/5 flex justify-between items-center bg-black/30">
                                <span>Recent Searches (Phone Synced)</span>
                                <button 
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSearchHistory([]);
                                    localStorage.removeItem("map_search_history");
                                  }}
                                  className="text-slate-500 hover:text-blue-400 font-mono text-[8px] cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                              {searchHistory.map((historyItem, i) => (
                                <div 
                                  key={i}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSearchQuery(historyItem);
                                    handleSearch(historyItem);
                                    setIsSearchFocused(false);
                                  }}
                                  className="px-3 py-1.5 hover:bg-white/5 text-slate-300 flex items-center justify-between border-b border-white/5 last:border-0 cursor-pointer"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <History className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{historyItem}</span>
                                  </span>
                                  <span className="text-[8px] text-slate-500 font-mono uppercase">Select</span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Fully detailed Navigation Map */}
                      <div className="flex-1 bg-slate-950 border border-white/5 rounded-xl relative overflow-hidden flex items-center justify-center">
                        {hasValidKey ? (
                          <div className="absolute inset-0 rounded-xl overflow-hidden">
                            <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                              <Map
                                center={mapCenter}
                                zoom={mapZoom}
                                mapId="CARPLAY_FULL_MAP"
                                disableDefaultUI={true}
                                styles={DARK_MAP_STYLE}
                                zoomControl={true}
                                mapTypeControl={false}
                                streetViewControl={false}
                                fullscreenControl={false}
                                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                                style={{ width: '100%', height: '100%' }}
                              >
                                <AdvancedMarker position={mapCenter}>
                                  <div className="w-8 h-8 rounded-full bg-blue-600 border border-white flex items-center justify-center shadow-lg animate-pulse">
                                    <Compass className="w-4 h-4 text-white" />
                                  </div>
                                </AdvancedMarker>
                              </Map>
                            </APIProvider>
                          </div>
                        ) : (
                          <>
                            <div className="absolute inset-0 pointer-events-none opacity-20">
                              <svg width="100%" height="100%">
                                <pattern id="grid-large" width="40" height="40" patternUnits="userSpaceOnUse">
                                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                                </pattern>
                                <rect width="100%" height="100%" fill="url(#grid-large)" />
                              </svg>
                            </div>

                            {/* Live rotating vector route */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                              <motion.g 
                                animate={{ rotate: isRebooting ? 0 : 360 }} 
                                transition={{ repeat: Infinity, duration: 180, ease: "linear" }}
                                style={{ transformOrigin: "50% 50%" }}
                              >
                                {/* Forest / land masses stubs */}
                                <circle cx="60" cy="80" r="45" fill="#065f46" fillOpacity="0.08" />
                                <circle cx="200" cy="150" r="80" fill="#065f46" fillOpacity="0.08" />
                                {/* Lake */}
                                <circle cx="220" cy="60" r="30" fill="#1e3a8a" fillOpacity="0.15" />
                                
                                {/* Roads */}
                                <path d="M 0 100 Q 150 150 300 100" fill="none" stroke="#334155" strokeWidth="12" />
                                <path d="M 120 0 L 120 200" fill="none" stroke="#334155" strokeWidth="8" />
                                
                                {/* Route Path overlay */}
                                <path 
                                  d="M 0 100 Q 150 150 300 100" 
                                  fill="none" 
                                  stroke="#0284c7" 
                                  strokeWidth="6" 
                                  strokeDasharray="10 8"
                                  strokeDashoffset={-navOffset * 1.5}
                                />
                              </motion.g>
                            </svg>

                            {/* Location Arrow indicator */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                              <div className="w-8 h-8 rounded-full bg-blue-600 border border-white flex items-center justify-center shadow-lg animate-pulse">
                                <Compass className="w-4 h-4 text-white" />
                              </div>
                            </div>

                            {/* If no API key, show instructions card */}
                            <div className="absolute z-10 bg-slate-900/95 border border-white/10 rounded-xl p-4 shadow-xl text-center max-w-xs mx-auto backdrop-blur-md">
                              <Compass className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" style={{ animationDuration: '6s' }} />
                              <h3 className="text-xs font-bold text-white mb-1">Google Maps API Key Required</h3>
                              <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                                Connect your device to live Google Maps satellite & traffic data! Paste your key into Secrets:
                              </p>
                              <div className="text-[9px] text-left bg-slate-950/80 border border-white/5 rounded-lg p-2.5 font-mono text-slate-300 space-y-1 mb-2.5">
                                <div>1. Open <span className="text-blue-400">Settings (⚙️ top-right)</span></div>
                                <div>2. Go to <span className="text-blue-400">Secrets</span></div>
                                <div>3. Add <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-400 text-[8px]">GOOGLE_MAPS_PLATFORM_KEY</code></div>
                              </div>
                              <div className="text-[8px] text-slate-500 font-mono">
                                Currently running in demo simulation mode
                              </div>
                            </div>
                          </>
                        )}

                        {/* Custom status label */}
                        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 text-[10px] flex items-center gap-1.5 font-mono z-10">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          <span>GPS: {settings.gps === "car" ? "Porsche Active" : "iPhone Assist"}</span>
                        </div>

                        {/* Frame rate indicator */}
                        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg px-1.5 py-0.5 text-[9px] font-mono text-slate-400 z-10">
                          {settings.fps} FPS
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CARPLAY APP: FULL MUSIC PLAYER */}
                  {activeApp === "music" && (
                    <div className="flex-1 flex flex-col p-4 h-full relative overflow-hidden justify-center items-center text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-indigo-600 to-slate-900 rounded-2xl flex items-center justify-center shadow-xl mb-3 relative overflow-hidden group">
                        <Music className="w-12 h-12 text-white/95" />
                        {isPlayingMusic && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-1">
                            <span className="w-1.5 bg-white rounded-full animate-[bounce_1.2s_infinite_100ms]" style={{ height: "35%" }} />
                            <span className="w-1.5 bg-white rounded-full animate-[bounce_1.2s_infinite_400ms]" style={{ height: "75%" }} />
                            <span className="w-1.5 bg-white rounded-full animate-[bounce_1.2s_infinite_200ms]" style={{ height: "55%" }} />
                            <span className="w-1.5 bg-white rounded-full animate-[bounce_1.2s_infinite_300ms]" style={{ height: "45%" }} />
                          </div>
                        )}
                      </div>

                      <h3 className="font-bold text-sm tracking-tight">Drive Vibes (Retro-Wave Edit)</h3>
                      <p className="text-xs text-blue-400 font-mono mb-2">Symphony Retro</p>
                      
                      {/* Playback bar */}
                      <div className="w-48 bg-slate-800 h-1 rounded-full overflow-hidden mb-3">
                        <div className="bg-blue-500 h-full" style={{ width: `${musicProgress}%` }} />
                      </div>

                      {/* Playback Controls */}
                      <div className="flex items-center gap-6">
                        <button className="text-slate-400 hover:text-white transition-colors"><SkipBack className="w-5 h-5" /></button>
                        <button 
                          onClick={togglePlayMusic}
                          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                        >
                          {musicActionPending ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : isPlayingMusic ? (
                            <Pause className="w-5 h-5 fill-black" />
                          ) : (
                            <Play className="w-5 h-5 fill-black ml-0.5" />
                          )}
                        </button>
                        <button className="text-slate-400 hover:text-white transition-colors"><SkipForward className="w-5 h-5" /></button>
                      </div>

                      <span className="text-[9px] text-slate-500 font-mono mt-2">Buffer size: {settings.audioDelay}ms</span>
                    </div>
                  )}

                  {/* CARPLAY APP: YOUTUBE MEDIA PLAYER */}
                  {activeApp === "youtube" && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden p-2.5">
                      {/* Top Header: Search and Status */}
                      <div className="flex gap-2 mb-2 items-center">
                        <div className="relative flex-1 font-sans">
                          <input 
                            type="text"
                            placeholder="Search videos..."
                            value={youtubeSearch}
                            onChange={(e) => setYoutubeSearch(e.target.value)}
                            className="w-full bg-slate-900/90 border border-white/10 rounded-lg pl-7 pr-3 py-1 text-[10px] text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 backdrop-blur-md font-mono"
                          />
                          <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 font-mono text-[9px] pointer-events-none">
                            🔍
                          </div>
                        </div>
                        <span className="text-[8px] font-mono text-red-500 bg-red-950/40 border border-red-900/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                          LIVE STREAM
                        </span>
                      </div>

                      {/* Main Layout Grid */}
                      <div className="grid grid-cols-12 gap-2 flex-1 min-h-0 font-sans">
                        {/* Left Side: Video Player Area */}
                        <div className="col-span-7 flex flex-col bg-slate-950/60 border border-white/5 rounded-xl overflow-hidden p-2 justify-between">
                          {/* Player Window */}
                          <div className="relative aspect-video w-full rounded-lg bg-black flex items-center justify-center overflow-hidden border border-white/10 group">
                            {isBufferingVideo ? (
                              <div className="flex flex-col items-center gap-1.5 z-10">
                                <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
                                <span className="text-[8px] font-mono text-slate-300">Buffering Stream...</span>
                              </div>
                            ) : (
                              <>
                                {/* Simulated Video content background */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${mockVideos[selectedVideo].thumbColor} opacity-20 flex items-center justify-center transition-all duration-500`}>
                                  {isPlayingVideo && (
                                    <div className="absolute inset-0 flex flex-wrap gap-1 p-2 justify-center items-center opacity-30">
                                      {Array.from({ length: 12 }).map((_, i) => (
                                        <motion.div 
                                          key={i}
                                          className="w-2 h-2 rounded-full bg-white"
                                          animate={{ scale: [1, 1.4, 1] }}
                                          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Channel and Video Watermark overlay */}
                                <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between text-[8px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
                                  <span className="truncate max-w-[120px]">{mockVideos[selectedVideo].title}</span>
                                  <span className="text-red-400 font-bold">1080p60</span>
                                </div>

                                {/* Centered Play Overlay button */}
                                <button 
                                  onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                                >
                                  {isPlayingVideo ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                                </button>

                                {/* Play/Buffer audio warning delay */}
                                {settings.audioDelay > 1000 && (
                                  <div className="absolute bottom-1.5 left-1.5 text-[7px] font-mono text-yellow-400 bg-yellow-950/80 border border-yellow-900/40 px-1 py-0.5 rounded">
                                    Delay: {settings.audioDelay}ms
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Progress slider */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-mono text-slate-400">
                              {Math.floor((mockVideos[selectedVideo].durationSec * videoProgress) / 100 / 60)}:
                              {String(Math.floor(((mockVideos[selectedVideo].durationSec * videoProgress) / 100) % 60)).padStart(2, "0")}
                            </span>
                            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative" onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const percent = Math.min(100, Math.max(0, Math.round((clickX / rect.width) * 100)));
                              setVideoProgress(percent);
                            }}>
                              <div className="bg-red-600 h-full transition-all" style={{ width: `${videoProgress}%` }} />
                            </div>
                            <span className="text-[8px] font-mono text-slate-400">
                              {mockVideos[selectedVideo].duration}
                            </span>
                          </div>

                          {/* Control panel buttons */}
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                                className="p-1 bg-white/5 hover:bg-white/10 text-white rounded transition-colors"
                              >
                                {isPlayingVideo ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white" />}
                              </button>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] font-mono text-slate-400">VOL:</span>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={videoVolume} 
                                  onChange={(e) => setVideoVolume(Number(e.target.value))}
                                  className="w-10 h-0.5 accent-red-600 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                            </div>
                            <span className="text-[8px] font-mono text-slate-500 truncate max-w-[80px]">
                              {mockVideos[selectedVideo].channel}
                            </span>
                          </div>
                        </div>

                        {/* Right Side: Playlist Recommendation */}
                        <div className="col-span-5 flex flex-col gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 px-1">Up Next:</span>
                          {mockVideos
                            .filter(vid => 
                              youtubeSearch === "" || 
                              vid.title.toLowerCase().includes(youtubeSearch.toLowerCase()) ||
                              vid.channel.toLowerCase().includes(youtubeSearch.toLowerCase())
                            )
                            .map((vid) => (
                              <button
                                key={vid.id}
                                onClick={() => handleSelectVideo(vid.id)}
                                className={`flex gap-1.5 p-1 rounded-lg text-left transition-all ${
                                  selectedVideo === vid.id 
                                    ? "bg-red-950/30 border border-red-900/30 text-white" 
                                    : "bg-white/5 hover:bg-white/10 border border-transparent text-slate-300"
                                }`}
                              >
                                {/* Mini thumbnail */}
                                <div className={`w-10 h-7 rounded bg-gradient-to-br ${vid.thumbColor} flex-shrink-0 relative overflow-hidden flex items-center justify-center`}>
                                  <span className="text-[5px] text-white/50">▶</span>
                                  <span className="absolute bottom-0 right-0 bg-black/80 px-0.5 text-[6px] font-mono text-white rounded">
                                    {vid.duration}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <span className="text-[8px] font-bold leading-tight line-clamp-2">
                                    {vid.title}
                                  </span>
                                  <span className="text-[7px] text-slate-400 truncate font-mono mt-0.5">
                                    {vid.channel}
                                  </span>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ANDROID AUTO LAYOUT */}
            {settings.workMode === "androidauto" && (
              <div className="flex-1 flex flex-col h-full text-white overflow-hidden text-xs">
                    {/* Main Screen Content */}
                {androidAutoApp === "split" && (
                  <div className="flex-1 flex p-2 gap-2 overflow-hidden h-full">
                    {/* Left Frame: Maps Navigation */}
                    <div 
                      onClick={() => setAndroidAutoApp("maps")}
                      className="bg-slate-900/60 hover:bg-slate-900/80 transition-all cursor-pointer group backdrop-blur-md rounded-xl p-3 border border-white/5 relative overflow-hidden flex flex-col justify-between"
                      style={{ 
                        flex: settings.screenLayout === "golden" 
                          ? "1.618 1 0%" 
                          : settings.screenLayout === "immersive" 
                          ? "3 1 0%" 
                          : "1 1 0%" 
                      }}
                    >
                      {hasValidKey ? (
                        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                          <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                            <Map
                              center={mapCenter}
                              zoom={mapZoom - 1}
                              mapId="ANDROID_AUTO_MAP"
                              disableDefaultUI={true}
                              styles={DARK_MAP_STYLE}
                              gestureHandling="none"
                              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                              style={{ width: '100%', height: '100%' }}
                            >
                              <AdvancedMarker position={mapCenter}>
                                <div className="w-5 h-5 rounded-full bg-emerald-600 border border-white flex items-center justify-center shadow-md">
                                  <Compass className="w-2.5 h-2.5 text-white" />
                                </div>
                              </AdvancedMarker>
                            </Map>
                          </APIProvider>
                          {/* Darken overlay slightly */}
                          <div className="absolute inset-0 bg-slate-900/15 pointer-events-none" />
                        </div>
                      ) : (
                        <>
                          {/* Simulating Map Grid */}
                          <div className="absolute inset-0 pointer-events-none opacity-10">
                            <svg width="100%" height="100%">
                              <pattern id="grid-aa" width="15" height="15" patternUnits="userSpaceOnUse">
                                <path d="M 15 0 L 0 0 0 15" fill="none" stroke="white" strokeWidth="0.5" />
                              </pattern>
                              <rect width="100%" height="100%" fill="url(#grid-aa)" />
                            </svg>
                          </div>

                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <path 
                              d="M 20 120 L 120 70 L 180 130" 
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="5" 
                              strokeLinecap="round"
                              strokeDasharray="10 8"
                              strokeDashoffset={-navOffset * 1.5}
                            />
                          </svg>
                        </>
                      )}

                      <div className="flex justify-between items-start z-10">
                        <div className="bg-emerald-600/90 text-[10px] px-2 py-0.5 rounded-md font-semibold border border-emerald-500/30 backdrop-blur-sm">
                          {hasValidKey ? "Google Maps Live" : "Google Maps Demo"}
                        </div>
                        <Compass className="w-4 h-4 text-emerald-400 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                      </div>

                      <div className="z-10 mt-auto bg-slate-950/70 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
                        <h4 className="font-bold leading-none text-xs truncate">
                          {hasValidKey ? "Pacific Coast Hwy" : "Mulholland Highway"}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {hasValidKey ? "Satellite Tracking Live" : "Arriving in 14 min"}
                        </p>
                      </div>
                    </div>

                    {/* Right Frame: Spotify Media Player */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-3 border border-white/5 flex flex-col justify-between overflow-hidden relative" style={{ flex: "1 1 0%" }}>
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-green-500 animate-pulse" />
                        <span className="text-[10px] text-slate-400 truncate">YouTube Music</span>
                      </div>

                      <div className="my-2 min-w-0">
                        <h4 className="font-bold truncate leading-none text-[11px]">Retro Drive</h4>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">Vibe Synthesizer</p>
                      </div>

                      {/* Sound Waves for Android Auto */}
                      <div className="h-6 flex items-end justify-start gap-0.5 bg-slate-950/40 p-1 rounded-md">
                        {isPlayingMusic ? (
                          Array.from({ length: 12 }).map((_, i) => (
                            <motion.div 
                              key={i}
                              className="w-1 bg-green-500 rounded-full"
                              animate={{ height: ["2px", `${Math.random() * 16 + 2}px`, "2px"] }}
                              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.08 }}
                            />
                          ))
                        ) : (
                          <div className="w-full h-[1px] bg-slate-800" />
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-2">
                        <button className="text-slate-400 hover:text-white cursor-pointer"><SkipBack className="w-4.5 h-4.5" /></button>
                        <button 
                          onClick={togglePlayMusic}
                          className="w-8 h-8 rounded-full bg-green-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                          disabled={musicActionPending}
                        >
                          {musicActionPending ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          ) : isPlayingMusic ? (
                            <Pause className="w-4 h-4 fill-black" />
                          ) : (
                            <Play className="w-4 h-4 fill-black ml-0.5" />
                          )}
                        </button>
                        <button className="text-slate-400 hover:text-white cursor-pointer"><SkipForward className="w-4.5 h-4.5" /></button>
                      </div>
                    </div>
                  </div>
                )}

                {androidAutoApp === "maps" && (
                  /* Google Maps Full-Screen Android Auto view */
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-2.5 font-sans relative">
                    {/* Search Bar overlay */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-1.5">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Search address or city..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch(searchQuery);
                          }}
                          className="flex-1 bg-slate-900/95 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 backdrop-blur-md font-sans shadow-lg"
                        />
                        <button 
                          onClick={() => handleSearch(searchQuery)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          Go
                        </button>
                        <button 
                          onClick={() => setAndroidAutoApp("split")}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold shadow-md transition-all border border-slate-700 cursor-pointer"
                        >
                          Split
                        </button>
                      </div>

                      {/* Android Auto Maps Search History Dropdown */}
                      <AnimatePresence>
                        {isSearchFocused && searchHistory.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="bg-slate-900/98 border border-white/10 rounded-lg overflow-hidden shadow-2xl backdrop-blur-md text-[10px] max-h-36 overflow-y-auto"
                          >
                            <div className="px-2 py-1 text-[8px] text-slate-400 font-mono font-bold uppercase tracking-wider border-b border-white/5 flex justify-between items-center bg-black/30">
                              <span>Recent Searches (Phone Synced)</span>
                              <button 
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSearchHistory([]);
                                  localStorage.removeItem("map_search_history");
                                }}
                                className="text-slate-500 hover:text-emerald-400 font-mono text-[8px] cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>
                            {searchHistory.map((historyItem, i) => (
                              <div 
                                key={i}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSearchQuery(historyItem);
                                  handleSearch(historyItem);
                                  setIsSearchFocused(false);
                                }}
                                className="px-3 py-1.5 hover:bg-white/5 text-slate-300 flex items-center justify-between border-b border-white/5 last:border-0 cursor-pointer"
                              >
                                <span className="flex items-center gap-1.5">
                                  <History className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>{historyItem}</span>
                                </span>
                                <span className="text-[8px] text-slate-500 font-mono uppercase">Select</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Fully detailed Navigation Map */}
                    <div className="flex-1 bg-slate-950 border border-white/5 rounded-xl relative overflow-hidden flex items-center justify-center">
                      {hasValidKey ? (
                        <div className="absolute inset-0 rounded-xl overflow-hidden">
                          <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                            <Map
                              center={mapCenter}
                              zoom={mapZoom}
                              mapId="ANDROID_AUTO_FULL_MAP"
                              disableDefaultUI={true}
                              styles={DARK_MAP_STYLE}
                              zoomControl={true}
                              mapTypeControl={false}
                              streetViewControl={false}
                              fullscreenControl={false}
                              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                              style={{ width: '100%', height: '100%' }}
                            >
                              <AdvancedMarker position={mapCenter}>
                                <div className="w-8 h-8 rounded-full bg-emerald-600 border border-white flex items-center justify-center shadow-lg animate-pulse">
                                  <Compass className="w-4 h-4 text-white" />
                                </div>
                              </AdvancedMarker>
                            </Map>
                          </APIProvider>
                        </div>
                      ) : (
                        <>
                          <div className="absolute inset-0 pointer-events-none opacity-20">
                            <svg width="100%" height="100%">
                              <pattern id="grid-large-aa" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                              </pattern>
                              <rect width="100%" height="100%" fill="url(#grid-large-aa)" />
                            </svg>
                          </div>

                          {/* Live rotating vector route */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <motion.g 
                              animate={{ rotate: isRebooting ? 0 : 360 }} 
                              transition={{ repeat: Infinity, duration: 180, ease: "linear" }}
                              style={{ transformOrigin: "50% 50%" }}
                            >
                              <circle cx="60" cy="80" r="45" fill="#065f46" fillOpacity="0.08" />
                              <circle cx="200" cy="150" r="80" fill="#065f46" fillOpacity="0.08" />
                              <circle cx="220" cy="60" r="30" fill="#1e3a8a" fillOpacity="0.15" />
                              
                              <path d="M 0 100 Q 150 150 300 100" fill="none" stroke="#334155" strokeWidth="12" />
                              <path d="M 120 0 L 120 200" fill="none" stroke="#334155" strokeWidth="8" />
                              
                              <path 
                                d="M 0 100 Q 150 150 300 100" 
                                fill="none" 
                                stroke="#10b981" 
                                strokeWidth="6" 
                                strokeDasharray="10 8"
                                strokeDashoffset={-navOffset * 1.5}
                              />
                            </motion.g>
                          </svg>

                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 border border-white flex items-center justify-center shadow-lg animate-pulse">
                              <Compass className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          <div className="absolute z-10 bg-slate-900/95 border border-white/10 rounded-xl p-4 shadow-xl text-center max-w-xs mx-auto backdrop-blur-md">
                            <Compass className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" style={{ animationDuration: '6s' }} />
                            <h3 className="text-xs font-bold text-white mb-1 font-sans">Google Maps (Android Auto)</h3>
                            <p className="text-[10px] text-slate-400 leading-relaxed mb-3 font-sans">
                              Interactive satellite maps & real-time routing active! Add your key into secrets for custom location rendering:
                            </p>
                            <div className="text-[9px] text-left bg-slate-950/80 border border-white/5 rounded-lg p-2.5 font-mono text-slate-300 space-y-1 mb-2.5">
                              <div>1. Open <span className="text-emerald-400">Settings (⚙️ top-right)</span></div>
                              <div>2. Add <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-400 text-[8px]">GOOGLE_MAPS_PLATFORM_KEY</code></div>
                            </div>
                            <div className="text-[8px] text-slate-500 font-mono">
                              Currently running in demo simulation mode
                            </div>
                          </div>
                        </>
                      )}

                      {/* Custom status label */}
                      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 text-[10px] flex items-center gap-1.5 font-mono z-10">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>GPS: Android High Accuracy</span>
                      </div>

                      {/* Frame rate indicator */}
                      <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg px-1.5 py-0.5 text-[9px] font-mono text-slate-400 z-10">
                        {settings.fps} FPS
                      </div>
                    </div>
                  </div>
                )}

                {androidAutoApp === "youtube" && (
                  /* YouTube Full-Screen Android Auto view */
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-2.5 font-sans">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span className="font-bold text-xs tracking-tight text-white font-sans">YouTube Streaming (Android Auto)</span>
                      </div>
                      <button 
                        onClick={() => setAndroidAutoApp("split")}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[8px] rounded-md transition-all border border-slate-700 cursor-pointer"
                      >
                        Exit to Split View
                      </button>
                    </div>

                    {/* Grid for Android Auto Youtube */}
                    <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
                      {/* Video Player */}
                      <div className="col-span-8 flex flex-col justify-between bg-slate-950/80 border border-white/10 rounded-xl p-2">
                        <div className="relative aspect-video w-full rounded-lg bg-black overflow-hidden border border-white/5 flex items-center justify-center group">
                          {isBufferingVideo ? (
                            <div className="flex flex-col items-center gap-1.5 z-10">
                              <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                              <span className="text-[8px] font-mono text-slate-300">Buffering...</span>
                            </div>
                          ) : (
                            <>
                              <div className={`absolute inset-0 bg-gradient-to-tr ${mockVideos[selectedVideo].thumbColor} opacity-20 flex items-center justify-center`}>
                                {isPlayingVideo && (
                                  <div className="absolute inset-0 flex flex-wrap gap-1 p-2 justify-center items-center opacity-25">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                      <motion.div 
                                        key={i}
                                        className="w-2 h-2 rounded-full bg-white"
                                        animate={{ scale: [1, 1.3, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between text-[8px] font-mono text-slate-400 bg-black/55 px-2 py-0.5 rounded">
                                <span className="truncate max-w-[150px]">{mockVideos[selectedVideo].title}</span>
                                <span className="text-red-500 font-bold">1080p60 HDR</span>
                              </div>
                              <button 
                                onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                                className="w-8 h-8 rounded-full bg-black/75 text-white flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer"
                              >
                                {isPlayingVideo ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                              </button>
                            </>
                          )}
                        </div>

                        {/* Seek and playback stats */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[8px] font-mono text-slate-400">
                            {Math.floor((mockVideos[selectedVideo].durationSec * videoProgress) / 100 / 60)}:
                            {String(Math.floor(((mockVideos[selectedVideo].durationSec * videoProgress) / 100) % 60)).padStart(2, "0")}
                          </span>
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const percent = Math.min(100, Math.max(0, Math.round((clickX / rect.width) * 100)));
                            setVideoProgress(percent);
                          }}>
                            <div className="bg-red-600 h-full" style={{ width: `${videoProgress}%` }} />
                          </div>
                          <span className="text-[8px] font-mono text-slate-400">{mockVideos[selectedVideo].duration}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                              className="p-1 bg-white/5 hover:bg-white/10 text-white rounded transition-colors cursor-pointer"
                            >
                              {isPlayingVideo ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white" />}
                            </button>
                            <span className="text-[9px] font-bold text-slate-300 truncate max-w-[120px]">{mockVideos[selectedVideo].channel}</span>
                          </div>
                          <span className="text-[8px] font-mono text-slate-500">{mockVideos[selectedVideo].views}</span>
                        </div>
                      </div>

                      {/* Video List */}
                      <div className="col-span-4 flex flex-col gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                        {mockVideos.map((vid) => (
                          <button
                            key={vid.id}
                            onClick={() => handleSelectVideo(vid.id)}
                            className={`flex gap-1.5 p-1 rounded-lg text-left transition-all cursor-pointer ${
                              selectedVideo === vid.id 
                                ? "bg-slate-800 border border-red-500/30 text-white" 
                                : "bg-white/5 hover:bg-white/10 border border-transparent text-slate-300"
                            }`}
                          >
                            <div className={`w-10 h-7 rounded bg-gradient-to-br ${vid.thumbColor} flex-shrink-0 relative flex items-center justify-center`}>
                              <span className="text-[5px] text-white/40">▶</span>
                              <span className="absolute bottom-0 right-0 bg-black/90 px-0.5 text-[6px] font-mono text-white rounded">{vid.duration}</span>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <span className="text-[8px] font-bold leading-normal truncate">{vid.title}</span>
                              <span className="text-[7px] text-slate-400 truncate font-mono mt-0.5">{vid.channel}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Taskbar (Android Auto signature) */}
                <div className="h-10 bg-slate-950/90 backdrop-blur-md border-t border-white/10 flex justify-between items-center px-4 z-10 font-sans">
                  <div className="flex items-center gap-3">
                    {/* App Launcher icon */}
                    <button 
                      onClick={() => setAndroidAutoApp(androidAutoApp === "split" ? "maps" : "split")}
                      className="w-5 h-5 rounded-md bg-white/10 flex flex-wrap p-0.5 gap-0.5 hover:bg-white/20 cursor-pointer"
                      title="Toggle Google Maps"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    </button>
                    
                    {/* Google Maps Shortcut */}
                    <Compass 
                      className={`w-4.5 h-4.5 cursor-pointer transition-all ${androidAutoApp === "maps" ? "text-emerald-400 scale-110" : "text-slate-400 hover:text-emerald-400"}`} 
                      onClick={() => setAndroidAutoApp(androidAutoApp === "maps" ? "split" : "maps")}
                    />

                    {/* Media Shortcut */}
                    <Music 
                      className={`w-4.5 h-4.5 cursor-pointer transition-all ${androidAutoApp === "split" ? "text-green-500" : "text-slate-400 hover:text-white"}`} 
                      onClick={() => setAndroidAutoApp("split")} 
                    />
                    
                    <MessageSquare className="w-4.5 h-4.5 text-slate-400 hover:text-white cursor-pointer" />
                    <Youtube 
                      className={`w-4.5 h-4.5 cursor-pointer transition-all ${androidAutoApp === "youtube" ? "text-red-500 scale-110" : "text-slate-400 hover:text-red-500"}`} 
                      onClick={() => setAndroidAutoApp(androidAutoApp === "youtube" ? "split" : "youtube")}
                    />
                  </div>

                  <div className="flex items-center gap-3 text-slate-300 text-[10px] font-mono">
                    <div className="flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <Battery className="w-3.5 h-3.5" />
                    </div>
                    <span>{phoneTime}</span>
                  </div>
                </div>

              </div>
            )}

            {/* Wired Connection Wire visualization overlays */}
            {settings.wiredConnection && (
              <div className="absolute top-2 right-2 bg-slate-900/95 border border-white/10 rounded-md px-2 py-0.5 text-[9px] font-mono text-slate-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                <span>Wired Host Overrides Wifi</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Simulator Control Board */}
      <div className="mt-4 flex flex-wrap gap-2 justify-between items-center">
        {status.connectionState === "connected_phone" ? (
          <button 
            id="btn-disconnect-phone"
            onClick={handleDisconnectPhone}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-blue-400 border border-slate-700/60 rounded-lg text-xs font-semibold text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
          >
            <WifiOff className="w-3.5 h-3.5" />
            Disconnect Phone
          </button>
        ) : (
          <div className="text-[10px] text-slate-500 font-mono">
            Awaiting phone connection...
          </div>
        )}

        <div className="flex gap-1.5">
          <button 
            id="btn-trigger-reboot"
            onClick={() => {
              addLog("warn", "Manual reboot triggered from simulator board.");
              setIsRebooting(true);
              setTimeout(() => {
                setIsRebooting(false);
                addLog("info", "Dongle warm boot successful. Recalibrating wireless channels...");
              }, 2500);
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
            title="Reboot Dongle Device"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reboot Box
          </button>
        </div>
      </div>
    </div>
  );
}
