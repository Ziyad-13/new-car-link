import React, { useState, useEffect } from "react";
import { 
  Compass, Cpu, Layers, Settings, Terminal, ArrowUpCircle, 
  Smartphone, Zap, Wifi, Tv, HelpCircle, HardDrive, Sun, Moon,
  Chrome, LogOut, Cloud, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { DongleSettings, DeviceStatus, DiagnosticLog, GoogleUserProfile } from "./types";
import { DEFAULT_SETTINGS, INITIAL_STATUS, SAMPLE_LOGS } from "./data";

import DeviceSimulator from "./components/DeviceSimulator";
import DashboardTab from "./components/DashboardTab";
import SettingsTab from "./components/SettingsTab";
import UpgradeTab from "./components/UpgradeTab";
import DiagnosticsTab from "./components/DiagnosticsTab";
import GoogleLoginModal from "./components/GoogleLoginModal";
import SplashLoader from "./components/SplashLoader";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "upgrade" | "diagnostics">("dashboard");
  const [settings, setSettings] = useState<DongleSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<DeviceStatus>(INITIAL_STATUS);
  const [logs, setLogs] = useState<DiagnosticLog[]>(SAMPLE_LOGS);

  // App boot/intro state
  const [isBootLoaderActive, setIsBootLoaderActive] = useState(true);

  // Google login state
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(() => {
    const saved = localStorage.getItem("google_user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Reboot & update syncing
  const [isRebooting, setIsRebooting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  // Theme management state (with persistence)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("carlinkkit_theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("carlinkkit_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    addLog("info", `Display theme manually switched to ${newTheme === "light" ? "HIGH-CONTRAST LIGHT MODE" : "STANDARD AMBIENT DARK MODE"}.`);
  };

  // Helper to append log item dynamically with current timestamp
  const addLog = (level: "info" | "warn" | "error" | "debug", message: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");
    setLogs((prev) => [
      { timestamp, level, message },
      ...prev,
    ]);
  };

  // Sync settings workMode and wiredConnection changes straight into DeviceStatus state triggers
  useEffect(() => {
    if (isRebooting) return;
    
    addLog("info", `Syncing adapter workMode → ${settings.workMode.toUpperCase()}`);
    
    // Automatically disconnect and reconnect to simulate a seamless transition
    if (status.connectionState === "connected_phone") {
      setStatus(prev => ({ ...prev, connectionState: "pairing" }));
      setTimeout(() => {
        setStatus(prev => ({ ...prev, connectionState: "connected_phone" }));
        addLog("info", `Successfully handshaked in ${settings.workMode.toUpperCase()} mode!`);
      }, 1000);
    }
  }, [settings.workMode]);

  useEffect(() => {
    if (settings.wiredConnection) {
      addLog("warn", "USB host physical override enabled. Forcing raw USB wire stream...");
    } else {
      addLog("info", "USB host override disabled. Restoring wireless fallback channels.");
    }
  }, [settings.wiredConnection]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      
      {/* Apple-style Bootloader Splash Animation */}
      <AnimatePresence>
        {isBootLoaderActive && (
          <SplashLoader onComplete={() => setIsBootLoaderActive(false)} />
        )}
      </AnimatePresence>

      {/* Premium Automotive Status Header */}
      <header className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center border border-blue-500/30 shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white font-sans uppercase">CarLinkKit</h1>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold tracking-wider">
                  192.168.50.2
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">Automotive Administration & Diagnostics Suite</p>
            </div>
          </div>

          {/* Quick Stats Panel & Theme Toggle */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6 text-[10px] font-mono text-slate-400">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-slate-500">Active Vehicle Host</span>
                <span className="text-slate-200 font-semibold">{status.carBrand} {status.carModel}</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-800 hidden sm:block" />
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status.connectionState === "connected_phone" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                <div className="flex flex-col">
                  <span className="text-slate-500 leading-none">Bridge Socket</span>
                  <span className="text-slate-200 leading-none mt-1 font-bold">
                    {status.connectionState === "connected_phone" ? "CONNECTED" : "AWAITING PAIR"}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-[1px] h-6 bg-slate-800 hidden xs:block" />

            {/* Replay Boot Animation */}
            <button
              id="replay-boot"
              onClick={() => {
                setIsBootLoaderActive(true);
                addLog("info", "Replay of system boot loader start animation triggered.");
              }}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
              title="Replay Start Animation"
              aria-label="Replay Start Animation"
            >
              <RefreshCw className="w-4 h-4 text-blue-500" />
            </button>

            {/* Accessibility High-Contrast Theme Toggle */}
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
              title={theme === "light" ? "Switch to Standard Ambient Dark Mode" : "Switch to High-Contrast Light Mode"}
              aria-label={theme === "light" ? "Switch to Standard Ambient Dark Mode" : "Switch to High-Contrast Light Mode"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-amber-500" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Interactive Device Sandbox Simulator (5 cols) */}
        <section className="lg:col-span-5 h-full flex flex-col gap-6 lg:sticky lg:top-24">
          <DeviceSimulator 
            settings={settings}
            status={status}
            setStatus={setStatus}
            addLog={addLog}
            isRebooting={isRebooting}
            setIsRebooting={setIsRebooting}
            isUpdating={isUpdating}
            updateProgress={updateProgress}
            googleUser={googleUser}
            onConnectGoogleClick={() => setIsLoginModalOpen(true)}
          />
        </section>

        {/* RIGHT PANEL: Operational Administration Tabs (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Tab Controller Row (Apple Segmented Picker style) */}
          <div className="flex overflow-x-auto bg-slate-900/80 border border-slate-800/80 rounded-xl p-1 shadow-inner scrollbar-hide backdrop-blur-md">
            
            {/* Dashboard tab button */}
            <button 
              id="tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 py-2 px-4 text-xs font-bold font-sans rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-98 cursor-pointer ${
                activeTab === "dashboard" 
                  ? "bg-blue-600 text-white shadow-md font-bold border border-blue-500/20" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Telemetry
            </button>

            {/* Settings tab button */}
            <button 
              id="tab-settings"
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-2 px-4 text-xs font-bold font-sans rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-98 cursor-pointer ${
                activeTab === "settings" 
                  ? "bg-blue-600 text-white shadow-md font-bold border border-blue-500/20" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>

            {/* Firmware tab button */}
            <button 
              id="tab-upgrade"
              onClick={() => setActiveTab("upgrade")}
              className={`flex-1 py-2 px-4 text-xs font-bold font-sans rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-98 cursor-pointer ${
                activeTab === "upgrade" 
                  ? "bg-blue-600 text-white shadow-md font-bold border border-blue-500/20" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Firmware
            </button>

            {/* Diagnostics tab button */}
            <button 
              id="tab-diagnostics"
              onClick={() => setActiveTab("diagnostics")}
              className={`flex-1 py-2 px-4 text-xs font-bold font-sans rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-98 cursor-pointer ${
                activeTab === "diagnostics" 
                  ? "bg-blue-600 text-white shadow-md font-bold border border-blue-500/20" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Diagnostics
            </button>

          </div>

          {/* Active Tab Container */}
          <div className="flex-1 min-h-[480px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === "dashboard" && (
                  <DashboardTab 
                    status={status} 
                    settings={settings}
                    setStatus={setStatus} 
                    addLog={addLog} 
                  />
                )}
                {activeTab === "settings" && (
                  <SettingsTab 
                    settings={settings} 
                    setSettings={setSettings} 
                    addLog={addLog} 
                    googleUser={googleUser}
                    setGoogleUser={setGoogleUser}
                    onConnectGoogleClick={() => setIsLoginModalOpen(true)}
                  />
                )}
                {activeTab === "upgrade" && (
                  <UpgradeTab 
                    status={status} 
                    setStatus={setStatus} 
                    addLog={addLog}
                    isRebooting={isRebooting}
                    setIsRebooting={setIsRebooting}
                    isUpdating={isUpdating}
                    setIsUpdating={setIsUpdating}
                    updateProgress={updateProgress}
                    setUpdateProgress={setUpdateProgress}
                  />
                )}
                {activeTab === "diagnostics" && (
                  <DiagnosticsTab 
                    logs={logs} 
                    setLogs={setLogs} 
                    addLog={addLog} 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </section>

      </main>

      {/* Footer Branding */}
      <footer className="mt-12 py-6 border-t border-slate-900/80 bg-slate-950 flex flex-col sm:flex-row justify-between items-center px-6 text-[10px] font-mono text-slate-500 gap-3">
        <span>© 2026 CarLinkKit Web Services. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-400 transition-colors">Documentation</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-400 transition-colors">Cloud Portal</a>
          <span>•</span>
          <span className="text-slate-600">Built in Cloud Native Workspace</span>
        </div>
      </footer>

      <AnimatePresence>
        {isLoginModalOpen && (
          <GoogleLoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={(profile) => {
              setGoogleUser(profile);
              localStorage.setItem("google_user", JSON.stringify(profile));
            }}
            addLog={addLog}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
