import React, { useState } from "react";
import { 
  Sparkles, RefreshCw, UploadCloud, AlertTriangle, CheckCircle, 
  ArrowUpCircle, HardDrive, Cpu, Terminal, ChevronRight, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DeviceStatus } from "../types";

interface UpgradeTabProps {
  status: DeviceStatus;
  setStatus: React.Dispatch<React.SetStateAction<DeviceStatus>>;
  addLog: (level: "info" | "warn" | "error" | "debug", msg: string) => void;
  isRebooting: boolean;
  setIsRebooting: (b: boolean) => void;
  isUpdating: boolean;
  setIsUpdating: (b: boolean) => void;
  updateProgress: number;
  setUpdateProgress: (n: number) => void;
}

export default function UpgradeTab({
  status,
  setStatus,
  addLog,
  isRebooting,
  setIsRebooting,
  isUpdating,
  setIsUpdating,
  updateProgress,
  setUpdateProgress
}: UpgradeTabProps) {
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "update_found" | "up_to_date">("idle");
  const [updateStep, setUpdateStep] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [successScreen, setSuccessScreen] = useState(false);
  const [localFile, setLocalFile] = useState<{ name: string; size: string } | null>(null);

  const currentVersion = status.softwareVersion;
  const latestVersionAvailable = "U2W_2026.07.01.2104";

  // Simulate update check
  const handleCheckUpdate = () => {
    setUpdateStatus("checking");
    setLocalFile(null); // Clear any uploaded local files to check cloud instead
    addLog("info", "Contacting Carlinkit cloud update server (global.carlinkit.com)...");
    
    setTimeout(() => {
      // Check if already updated in current session
      if (currentVersion === latestVersionAvailable) {
        setUpdateStatus("up_to_date");
        addLog("info", "Cloud query complete. Firmware is fully up-to-date.");
      } else {
        setUpdateStatus("update_found");
        addLog("warn", `New firmware found! Latest: ${latestVersionAvailable} (Released July 1, 2026).`);
      }
    }, 1500);
  };

  // Perform multi-stage firmware flash
  const handleFlashFirmware = () => {
    if (status.connectionState !== "connected_phone") {
      alert("Please ensure your phone is connected in the simulator before upgrading firmware.");
      return;
    }

    setIsUpdating(true);
    setUpdateProgress(0);
    setUpdateStep("Initializing secure bootloader session...");
    addLog("warn", `Firmware flash initiated${localFile ? ` with custom ROM: ${localFile.name}` : ""}. Entering flash recovery mode.`);
    addLog("debug", "Locking CPU core, freezing wireless network threads...");

    // Stage 1: Download/Load Update (0-30%)
    let currentProgress = 0;
    const downloadInterval = setInterval(() => {
      currentProgress += 2;
      setUpdateProgress(currentProgress);
      
      if (localFile) {
        setUpdateStep(`Loading custom binary block: ${localFile.name} (${currentProgress * 3}% cached)...`);
      } else {
        setUpdateStep(`Downloading firmware binary (${currentProgress * 3}KB / 45.2MB)...`);
      }

      if (currentProgress >= 30) {
        clearInterval(downloadInterval);
        addLog("info", localFile ? "Custom ROM binary loaded into buffer successfully." : "Firmware downloaded successfully. Verifying SHA-256 integrity hash...");
        setUpdateStep("Verifying SHA-256 package checksum...");

        // Stage 2: Verification (30-45%)
        setTimeout(() => {
          addLog("info", "SHA-256 signature MATCHED. Writing binary block-to-block onto internal Flash...");
          
          let writeProgress = 30;
          const writeInterval = setInterval(() => {
            writeProgress += 3;
            setUpdateProgress(writeProgress);
            setUpdateStep(`Flashing ROM memory block: 0x${(writeProgress * 4096).toString(16).toUpperCase()}...`);

            if (writeProgress >= 90) {
              clearInterval(writeInterval);
              addLog("warn", "ROM flash complete. Syncing file tables and locking boot records...");
              setUpdateStep("Finalizing system registries...");

              // Stage 3: Complete & Warm Boot (90-100%)
              setTimeout(() => {
                setUpdateProgress(100);
                setUpdateStep("Rebuilding system image. Safe to reboot.");
                addLog("info", "Firmware upgrade successful! Hot restart in progress...");
                
                setTimeout(() => {
                  setIsUpdating(false);
                  setIsRebooting(true);
                  
                  const targetVer = localFile 
                    ? `CUSTOM_${localFile.name.toUpperCase().replace(/\.[^/.]+$/, "").replace(/[^A-Z0-9_]/g, "_")}` 
                    : latestVersionAvailable;

                  // Update current software version in status state
                  setStatus(prev => ({
                    ...prev,
                    softwareVersion: targetVer
                  }));

                  setTimeout(() => {
                    setIsRebooting(false);
                    setSuccessScreen(true);
                    setUpdateStatus("up_to_date");
                    addLog("info", `Dongle reboot complete. Successfully loaded firmware v${targetVer}.`);
                  }, 2500);

                }, 1000);

              }, 1200);
            }
          }, 150);

        }, 1500);
      }
    }, 100);
  };

  // Drag and drop custom .img firmware simulator
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateLocalFileFlash(files[0].name, files[0].size);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateLocalFileFlash(files[0].name, files[0].size);
    }
  };

  const simulateLocalFileFlash = (fileName: string, fileSize?: number) => {
    if (!fileName.endsWith(".img") && !fileName.endsWith(".bin")) {
      addLog("error", `Unsupported file type: ${fileName}. Firmware packages must be .img or .bin format.`);
      alert("Invalid file type. Please upload a .img or .bin firmware file.");
      return;
    }

    const calculatedSize = fileSize 
      ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` 
      : `${(Math.random() * 10 + 35).toFixed(1)} MB`;

    setLocalFile({ name: fileName, size: calculatedSize });
    addLog("info", `Selected custom firmware package: ${fileName} (${calculatedSize}). Verifying local container headers...`);
    setUpdateStatus("update_found");
  };

  return (
    <div id="upgrade-tab-content" className="grid grid-cols-1 md:grid-cols-12 gap-6">
      
      {/* LEFT: Current details & check actions (8 cols) */}
      <div className="md:col-span-8 flex flex-col gap-6">
        
        {/* Success Screen Banner */}
        <AnimatePresence>
          {successScreen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/30 rounded-xl p-5 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-emerald-400">Firmware Upgraded Successfully!</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    Your Carlinkit adapter is now running build <span className="font-mono text-white font-bold">{status.softwareVersion}</span>. Enjoy smoother video decoding, stabilized GPS positioning, and optimized audio buffering.
                  </p>
                  <button 
                    onClick={() => setSuccessScreen(false)}
                    className="mt-3 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase transition-all"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Firmware Version Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            Active Microcode Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Installed Build</span>
              <span className="text-sm font-bold font-mono tracking-tight text-slate-200 mt-1 truncate" title={status.softwareVersion}>
                {status.softwareVersion.split("_")[1] || status.softwareVersion}
              </span>
              <span className="text-[9px] text-slate-500 mt-1.5 font-mono">ROM Flash</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Adapter Model</span>
              <span className="text-sm font-bold text-slate-200 mt-1">
                {status.dongleModel}
              </span>
              <span className="text-[9px] text-slate-500 mt-1.5 font-mono">{status.hardwareVersion}</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase">System Status</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle className="w-4 h-4" /> Online
              </span>
              <span className="text-[9px] text-slate-500 mt-1.5 font-mono">{status.sdkVersion}</span>
            </div>
          </div>
        </div>

        {/* Cloud Update Center */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-blue-500" />
            Cloud Update Engine
          </h3>

          <div className="flex flex-col gap-4">
            
            {updateStatus === "idle" && (
              <div className="py-4 text-center border border-dashed border-slate-800 bg-slate-950/20 rounded-xl flex flex-col items-center">
                <RefreshCw className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-mono text-slate-400">Awaiting user action to check cloud repositories</p>
                <button 
                  id="btn-check-firmware"
                  onClick={handleCheckUpdate}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check for Updates
                </button>
              </div>
            )}

            {updateStatus === "checking" && (
              <div className="py-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-xs font-mono text-blue-400 animate-pulse">Contacting build repositories...</p>
                <p className="text-[10px] text-slate-600 mt-1 font-mono">Fetching latest image files for {status.hardwareVersion}</p>
              </div>
            )}

            {updateStatus === "up_to_date" && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-900/60 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Firmware Up To Date</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Installed version match cloud repository. Latest build: {latestVersionAvailable}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setUpdateStatus("idle")}
                  className="px-3 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 rounded-md transition-all active:scale-95"
                >
                  Clear Status
                </button>
              </div>
            )}

            {updateStatus === "update_found" && (
              <div className="p-5 bg-indigo-950/30 border border-indigo-900/50 rounded-xl flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <ArrowUpCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    {localFile ? (
                      <>
                        <h4 className="text-xs font-bold text-slate-200 font-sans">Local Firmware ROM Loaded</h4>
                        <p className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ready to flash custom image
                        </p>
                        <div className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-950/80 border border-slate-850 rounded-lg p-3 font-mono text-[10px] space-y-1">
                          <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span className="text-slate-500 font-bold">ROM FILE:</span>
                            <span className="text-slate-200 font-bold truncate max-w-[200px]">{localFile.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 py-1">
                            <span className="text-slate-500 font-bold">FILE SIZE:</span>
                            <span className="text-slate-300">{localFile.size}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 py-1">
                            <span className="text-slate-500 font-bold">PACKAGE HASH:</span>
                            <span className="text-indigo-400 font-bold">SHA256: 7C14BD{Math.random().toString(16).substring(2, 6).toUpperCase()}FF</span>
                          </div>
                          <div className="text-[9px] text-amber-500/90 pt-1 leading-normal">
                            ⚠️ Caution: This local package bypasses official signature registries.
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="text-xs font-bold text-slate-200">New Firmware Revision Available</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Version: {latestVersionAvailable}</p>
                        <div className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-900 rounded-lg p-3">
                          <div className="font-bold text-blue-400 mb-1">Changelog Build #2104:</div>
                          <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-400 font-mono">
                            <li>Fixed steering wheel shortcut delays on Porsche/Audi MIB systems</li>
                            <li>Reduced wireless media buffer down to 300ms minimum threshold</li>
                            <li>Optimized hardware accelerated H.264/H.265 video decoding pipeline</li>
                            <li>Stabilized GPS assistant feed handshaking</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 mt-2 border-t border-indigo-950/80 pt-4">
                  <button 
                    onClick={() => {
                      setUpdateStatus("idle");
                      setLocalFile(null);
                    }}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-lg text-xs font-semibold text-slate-400 transition-all font-mono"
                  >
                    Cancel
                  </button>
                  <button 
                    id="btn-perform-upgrade"
                    onClick={handleFlashFirmware}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    {localFile ? "Flash Custom ROM" : "Perform Upgrade Now"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* RIGHT: Manual Firmware file drag and drop (4 cols) */}
      <div className="md:col-span-4 flex flex-col gap-6">
        
        {/* Local Update File Drag & Drop */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between flex-1 min-h-[220px] relative transition-all ${
            dragOver ? "border-blue-500 bg-blue-500/5 scale-[1.01]" : ""
          }`}
        >
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase flex items-center gap-2 mb-4">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            Upload Local Image
          </h3>

          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-800/80 rounded-xl bg-slate-950/20">
            <UploadCloud className={`w-8 h-8 text-slate-500 mb-2 ${dragOver ? "text-blue-400 scale-110" : ""} transition-transform`} />
            <p className="text-xs font-bold text-slate-300">Drag & drop ROM file here</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Accepts .img or .bin format</p>
            
            <div className="mt-4">
              <label className="cursor-pointer px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:text-slate-200 text-xs text-slate-400 font-mono rounded-lg transition-all active:scale-95 block">
                Browse File
                <input 
                  type="file" 
                  accept=".img,.bin" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-blue-950/20 border border-blue-500/10 rounded-lg flex gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span className="text-[9px] font-mono text-slate-400 leading-normal">
              Warning: Installing non-verified local ROM files can brick the Carlinkit physical module. Only install trusted official packages.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
