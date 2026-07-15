import React, { useState, useEffect, useRef } from "react";
import { 
  Cpu, Thermometer, Wifi, RefreshCw, Layers, Cable, CheckCircle2, 
  Clock, Server, Zap, Compass, Info, WifiOff, Tv
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DeviceStatus, DongleSettings } from "../types";

interface DashboardTabProps {
  status: DeviceStatus;
  settings: DongleSettings;
  setStatus: React.Dispatch<React.SetStateAction<DeviceStatus>>;
  addLog: (level: "info" | "warn" | "error" | "debug", msg: string) => void;
}

export default function DashboardTab({
  status,
  settings,
  setStatus,
  addLog
}: DashboardTabProps) {
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const getProfileName = () => {
    if (settings.audioDelay <= 500 && settings.wifiBand === "5.8GHz" && settings.audioFormat === "pcm") {
      return "Extreme Speed 🚀";
    }
    if (settings.audioDelay >= 1100 && settings.audioFormat === "aac") {
      return "Hi-Fi Audio Focus 🎶";
    }
    if (settings.syncMode === "compatible" && settings.videoDecoding === "software") {
      return "Absolute Compatibility 🛡️";
    }
    return "Balanced Adaptive ⚖️";
  };

  // Keep a reference to the latest status to avoid clearing the interval unnecessarily or nested state updates
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Populate telemetry history and update telemetry over time
  useEffect(() => {
    // Generate initial history
    const history = [];
    const now = new Date();
    for (let i = 10; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3000);
      history.push({
        time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        cpu: Math.floor(Math.random() * 10 + 10),
        temp: Math.floor(Math.random() * 3 + 40),
        latency: Math.floor(Math.random() * 50 + settings.audioDelay),
      });
    }
    setTelemetryHistory(history);

    // Live updating loop
    const interval = setInterval(() => {
      const currentStatus = statusRef.current;
      if (currentStatus.connectionState !== "connected_phone") return;

      const newCpu = Math.max(8, Math.min(95, currentStatus.cpuUsage + Math.floor(Math.random() * 9) - 4));
      const newMemory = Math.max(30, Math.min(85, currentStatus.memoryUsage + (Math.random() > 0.7 ? Math.floor(Math.random() * 3) - 1 : 0)));
      const newTemp = Math.max(35, Math.min(78, currentStatus.temperature + (newCpu > 60 ? 1 : newCpu < 15 ? -1 : 0)));
      const newSignal = Math.max(-85, Math.min(-40, currentStatus.wifiSignal + Math.floor(Math.random() * 5) - 2));

      // 1. Update parent status
      setStatus((prev) => ({
        ...prev,
        cpuUsage: newCpu,
        memoryUsage: newMemory,
        temperature: newTemp,
        wifiSignal: newSignal,
      }));

      // 2. Update local telemetry history
      setTelemetryHistory((prevHist) => {
        const nextHist = [...prevHist];
        if (nextHist.length > 12) nextHist.shift();
        const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        nextHist.push({
          time: timestamp,
          cpu: newCpu,
          temp: newTemp,
          latency: Math.floor(Math.random() * 40 + settings.audioDelay),
        });
        return nextHist;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [settings.audioDelay, setStatus]);

  // Handle re-pairing Wi-Fi signal calibration
  const handleCalibrate = () => {
    setIsCalibrating(true);
    addLog("warn", "Starting wireless channel scan and frequency recalibration...");
    
    setTimeout(() => {
      setStatus(prev => ({
        ...prev,
        wifiSignal: -42, // Boosted signal after calibration
      }));
      setIsCalibrating(false);
      addLog("info", "Recalibration complete. Locked on Channel 149 (5.8 GHz DFS with lowest noise index).");
    }, 2000);
  };

  const getSignalStrengthLabel = (dbm: number) => {
    if (dbm > -55) return { text: "Excellent", color: "text-emerald-400" };
    if (dbm > -70) return { text: "Good", color: "text-blue-400" };
    if (dbm > -82) return { text: "Fair / Weak", color: "text-amber-400" };
    return { text: "Poor", color: "text-rose-400" };
  };

  return (
    <div id="dashboard-tab-content" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT: Bridge Diagram & Hardware Telemetry (8 cols) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Connection Pipeline Map Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-slate-700">
            <Layers className="w-16 h-16 pointer-events-none opacity-10" />
          </div>

          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            Active Connection Architecture
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center relative mt-2">
            
            {/* Phone */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center text-center relative">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700/60 text-slate-300 mb-2">
                <Compass className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-xs font-bold font-sans">User Smartphone</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                {status.connectionState === "connected_phone" ? "Ziyad's iPhone (Active)" : "Disconnected"}
              </span>
              
              {status.connectionState === "connected_phone" && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-1/2 md:hidden z-10 py-1 font-mono text-[9px] text-emerald-400 flex items-center gap-0.5 bg-slate-950 px-2 rounded-full border border-emerald-500/30">
                  <Wifi className="w-3 h-3 animate-pulse" /> {settings.wifiBand}
                </div>
              )}
            </div>

            {/* Bridge path arrows (animated dots in SVG) */}
            <div className="hidden md:block relative h-8 w-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-slate-800 relative">
                  {status.connectionState === "connected_phone" && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-teal-500 to-blue-500 animate-[shimmer_2s_infinite] rounded-full" />
                  )}
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-800 text-teal-400">
                {status.connectionState === "connected_phone" ? `${settings.wifiBand} Tunnel` : "Offline"}
              </div>
            </div>

            {/* Carlinkit Dongle */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center text-center relative">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700/60 text-slate-300 mb-2">
                <Server className="w-5 h-5 text-blue-400 animate-pulse" />
              </div>
              <span className="text-xs font-bold font-sans">Carlinkit Dongle</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">{status.dongleModel}</span>

              {status.connectionState === "connected_phone" && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-1/2 md:hidden z-10 py-1 font-mono text-[9px] text-blue-400 flex items-center gap-0.5 bg-slate-950 px-2 rounded-full border border-blue-500/30">
                  <Cable className="w-3 h-3" /> USB Type-C
                </div>
              )}
            </div>

            {/* Bridge path arrows */}
            <div className="hidden md:block relative h-8 w-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-slate-800">
                  {status.connectionState === "connected_phone" && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 animate-[shimmer_2s_infinite] rounded-full" />
                  )}
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-800 text-blue-400">
                {status.connectionState === "connected_phone" ? "USB wired" : "Offline"}
              </div>
            </div>

            {/* Car OEM Headunit */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700/60 text-slate-300 mb-2">
                <Tv className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs font-bold font-sans">Porsche Car Screen</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                {status.carBrand} {status.carModel} ({status.carYear})
              </span>
            </div>

          </div>
        </div>

        {/* Real-time Telemetry Metrics Area Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Streaming Telemetry Analysis (Real-time)
            </h3>
            <span className="text-[10px] font-mono bg-blue-950/40 text-blue-400 px-2.5 py-1 rounded-full border border-blue-900/40">
              Refresh interval: 3s
            </span>
          </div>

          {status.connectionState !== "connected_phone" ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-lg bg-slate-950/20">
              <WifiOff className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
              <p className="text-xs">No active telemetry stream available</p>
              <p className="text-[10px] text-slate-600">Connect a mobile phone in the simulator to activate</p>
            </div>
          ) : (
            <div className="h-56 w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }} />
                  <Area type="monotone" dataKey="cpu" name="CPU Usage (%)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                  <Area type="monotone" dataKey="temp" name="Core Temp (°C)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT: Quick Stats, Specifications, Gauges (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Performance Gauges Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Hardware Diagnostics
          </h3>

          <div className="flex flex-col gap-4">
            {/* CPU Metric */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-500" /> CPU Allocation
                </span>
                <span className="font-bold">{status.connectionState === "connected_phone" ? `${status.cpuUsage}%` : "1%"}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    status.cpuUsage > 80 ? "bg-rose-500" : status.cpuUsage > 50 ? "bg-amber-500" : "bg-emerald-500"
                  }`} 
                  style={{ width: `${status.connectionState === "connected_phone" ? status.cpuUsage : 1}%` }}
                />
              </div>
            </div>

            {/* Core Temp Metric */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Core Thermal Info
                </span>
                <span className="font-bold">{status.connectionState === "connected_phone" ? `${status.temperature}°C` : "31°C"}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    status.temperature > 65 ? "bg-rose-500" : status.temperature > 45 ? "bg-amber-500" : "bg-emerald-500"
                  }`} 
                  style={{ width: `${status.connectionState === "connected_phone" ? (status.temperature / 85) * 100 : 36}%` }}
                />
              </div>
            </div>

            {/* WiFi Signal Strength dBM Metric */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-blue-400" /> WiFi Signal (RSSI)
                </span>
                <span className={`font-bold ${getSignalStrengthLabel(status.wifiSignal).color}`}>
                  {status.connectionState === "connected_phone" ? `${status.wifiSignal} dBm` : "Offline"}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${status.connectionState === "connected_phone" ? Math.min(100, Math.max(10, (100 + status.wifiSignal) * 1.5)) : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>Signal rating: {getSignalStrengthLabel(status.wifiSignal).text}</span>
                <button 
                  onClick={handleCalibrate}
                  disabled={isCalibrating || status.connectionState !== "connected_phone"}
                  className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isCalibrating ? "animate-spin" : ""}`} /> Calibrate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Device Specifications Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            Device Information
          </h3>

          <div className="divide-y divide-slate-800/60 text-xs font-mono">
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Model Name:</span>
              <span className="text-slate-200 font-bold">{status.dongleModel}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Software Build:</span>
              <span className="text-slate-300 font-medium">{status.softwareVersion}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Optimized Profile:</span>
              <span className="text-amber-400 font-bold">{getProfileName()}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Wlan Link Band:</span>
              <span className="text-slate-200">{settings.wifiBand} (Ch {settings.wifiChannel === "auto" ? "Auto" : settings.wifiChannel})</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Audio Stream:</span>
              <span className="text-slate-200">{settings.audioFormat.toUpperCase()} ({settings.audioDelay}ms)</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Video Handshake:</span>
              <span className="text-slate-200">{settings.videoBitrate === "auto" ? "Dynamic" : settings.videoBitrate} ({settings.resolution})</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Wlan Portal IP:</span>
              <span className="text-slate-300 text-blue-400 font-semibold">{status.wifiIp}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Wireless SSID:</span>
              <span className="text-slate-300 truncate max-w-[120px]" title={status.wifiSsid}>{status.wifiSsid}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-400">Bluetooth ID:</span>
              <span className="text-slate-300">{status.bluetoothName}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] font-mono leading-normal text-slate-400">
              Your Carlinkit adapter is running optimally. To adjust connection behaviors, visit the <span className="text-blue-400 font-semibold">Settings</span> tab.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
