import React, { useState } from "react";
import { 
  Tv, Volume2, Shield, Settings, Info, Save, RotateCcw, 
  HelpCircle, CheckCircle, Sliders, PlayCircle, ToggleLeft, Sparkles,
  Wifi, Zap, Activity, AlertTriangle, Chrome, LogOut, Cloud, Database,
  Github, GitBranch, GitPullRequest, GitCommit, ExternalLink, Check, Search,
  Terminal, Upload, ChevronRight, RefreshCw
} from "lucide-react";
import { DongleSettings, GoogleUserProfile } from "../types";

interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  author: string;
  brand: string;
  stars: number;
  comments: number;
  status: "Open" | "Resolved";
  difficulty: "Easy" | "Medium" | "Advanced";
  description: string;
  reproduction: string;
  patch: Partial<DongleSettings>;
  patchExplanation: string;
  tags: string[];
}

const GITHUB_ISSUES: GitHubIssue[] = [
  {
    id: "bmw-idrive7",
    number: 412,
    title: "BMW iDrive 7 Audio Drops / Crackle on 5Ghz channel switching",
    author: "bimmer_head_99",
    brand: "BMW",
    stars: 124,
    comments: 42,
    status: "Resolved",
    difficulty: "Medium",
    description: "When driving in high-interference toll plaza areas, BMW's standard 5Ghz connection stutters and stutters before completely dropping. Sourced from firmware v4.1 tracker.",
    reproduction: "Drive near electronic toll collections with automatic high-speed channel hopping enabled on the dongle.",
    patch: {
      wifiBand: "5.8GHz",
      wifiChannel: "149",
      audioFormat: "pcm",
      mediaDelay: 1000
    },
    patchExplanation: "Forces the extremely powerful 5.8 GHz band on static Channel 149 (uncongested high power), sets zero-latency PCM audio, and raises the media buffer delay to 1000ms to absorb temporary interference.",
    tags: ["Audio", "iDrive", "5.8G", "Stutter-Fix"]
  },
  {
    id: "lexus-rx-freeze",
    number: 589,
    title: "Screen freeze, grey lines, and pixelation on Lexus RX350 Premium",
    author: "lexus-dev",
    brand: "Lexus",
    stars: 92,
    comments: 29,
    status: "Resolved",
    difficulty: "Easy",
    description: "Lexus headunits use low-power hardware video decoders that choke on high bitrate video streams (8-12 Mbps), causing gradual sync drift, gray artifacts, and complete video freeze.",
    reproduction: "Use high bitrate auto negotiation on busy navigation maps with lots of overlay details.",
    patch: {
      videoBitrate: "4mbps",
      videoDecoding: "software",
      fps: 30
    },
    patchExplanation: "Throttles stream bitrate to 4 Mbps (safe fluid bandwidth), redirects the decoding tasks to CPU software rendering to bypass the buggy hardware decoder, and limits FPS to 30 to lower processing load.",
    tags: ["Video", "Freeze", "MMI", "Lexus-RX"]
  },
  {
    id: "audi-mmi-drop",
    number: 304,
    title: "Audi MMI Random Connection Dropouts near major city centers",
    author: "audi_vorsprung",
    brand: "Audi",
    stars: 148,
    comments: 64,
    status: "Resolved",
    difficulty: "Medium",
    description: "Heavy microwave interference in high-density downtown districts knocks out fragile 5 GHz signals on Audi MMI vehicle models with integrated dual-antenna wireless modules.",
    reproduction: "Downtown city driving where standard 5GHz networks are saturated by high-voltage grids and public antennas.",
    patch: {
      wifiBand: "2.4GHz",
      wifiChannel: "auto",
      syncMode: "compatible"
    },
    patchExplanation: "Switches to the robust 2.4 GHz band which naturally penetrates physical and electromagnetic obstacles, enables auto-channel scanning, and forces highly compatible sync protocols.",
    tags: ["Disconnect", "MMI", "2.4G", "Downtown-Fix"]
  },
  {
    id: "tesla-lag",
    number: 881,
    title: "Extreme audio-to-video delay on Tesla Model 3 Custom Launcher boxes",
    author: "musk_tinker",
    brand: "Tesla",
    stars: 215,
    comments: 88,
    status: "Resolved",
    difficulty: "Advanced",
    description: "Tesla custom Android boxes running third-party CarPlay integrations accumulate a severe 1.5 - 2 second lag between map navigation voices and real visual progress.",
    reproduction: "Run heavy audio and map feeds concurrently with standard wireless audio buffering enabled.",
    patch: {
      audioDelay: 300,
      mediaDelay: 300,
      videoDecoding: "hardware",
      audioFormat: "pcm"
    },
    patchExplanation: "Enforces raw, zero-overhead PCM sound, clamps audio & media buffer delay down to an extreme 300ms, and offloads rendering to GPU hardware acceleration.",
    tags: ["Lag", "Tesla", "Low-Latency", "PCM-Raw"]
  },
  {
    id: "toyota-touch",
    number: 627,
    title: "Toyota Entune 3.0 touch screen coordinate lag and delayed drag",
    author: "yota-tweak",
    brand: "Toyota",
    stars: 76,
    comments: 18,
    status: "Resolved",
    difficulty: "Easy",
    description: "Dragging or panning maps on Toyota's resistive touchscreens results in sluggish, disjointed cursor trails and delayed response times.",
    reproduction: "Swipe quickly across navigation screens on Toyota Entune displays.",
    patch: {
      syncMode: "normal",
      fps: 60,
      resolution: "1280x720"
    },
    patchExplanation: "Bumps framerate up to 60 FPS, forces 'Normal' real-time synchronization, and locks resolution to crisp 720p HD to align touch targets perfectly with the rendering engine.",
    tags: ["Touch", "Entune", "60FPS", "HD-720p"]
  },
  {
    id: "porsche-siri",
    number: 115,
    title: "Porsche PCM 5.0 Siri muffled voice and audio channel failure",
    author: "porsche_club",
    brand: "Porsche",
    stars: 54,
    comments: 11,
    status: "Resolved",
    difficulty: "Medium",
    description: "Activating Siri on Porsche PCM causes the microphone audio channel to clamp down to 8kHz, resulting in distorted command capture and 'muffled' sound responses.",
    reproduction: "Long press steering wheel voice button on standard wireless PCM connection.",
    patch: {
      audioFormat: "aac",
      audioDelay: 800,
      gps: "car"
    },
    patchExplanation: "Forces AAC compressed format to fit crystal-clear high-definition Siri streams, stabilizes voice channels with an 800ms buffer, and routes GPS queries directly to the car's native antenna.",
    tags: ["Siri", "PCM-Porsche", "AAC", "Mic"]
  }
];

interface SettingsTabProps {
  settings: DongleSettings;
  setSettings: React.Dispatch<React.SetStateAction<DongleSettings>>;
  addLog: (level: "info" | "warn" | "error" | "debug", msg: string) => void;
  googleUser: GoogleUserProfile | null;
  setGoogleUser: React.Dispatch<React.SetStateAction<GoogleUserProfile | null>>;
  onConnectGoogleClick: () => void;
}

export default function SettingsTab({
  settings,
  setSettings,
  addLog,
  googleUser,
  setGoogleUser,
  onConnectGoogleClick
}: SettingsTabProps) {
  const [saveNotification, setSaveNotification] = useState(false);
  const [syncTelemetry, setSyncTelemetry] = useState(true);
  const [syncPresets, setSyncPresets] = useState(true);
  const [syncMapsHistory, setSyncMapsHistory] = useState(true);

  // GitHub community tracker & script console states
  const [githubSearch, setGithubSearch] = useState("");
  const [githubFilterBrand, setGithubFilterBrand] = useState("all");
  const [githubFilterStatus, setGithubFilterStatus] = useState("all");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [customScriptText, setCustomScriptText] = useState(`{\n  "syncMode": "normal",\n  "audioDelay": 350,\n  "fps": 60,\n  "resolution": "1280x720",\n  "videoDecoding": "hardware",\n  "wifiBand": "5.8GHz",\n  "audioFormat": "pcm",\n  "videoBitrate": "12mbps"\n}`);
  const [customScriptStatus, setCustomScriptStatus] = useState("");
  const [isCompilingScript, setIsCompilingScript] = useState(false);
  const [successNotification, setSuccessNotification] = useState("");

  // General change handler
  const updateSetting = <K extends keyof DongleSettings>(key: K, value: DongleSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      addLog("debug", `Setting changed: [${String(key)}] = ${String(value)}`);
      return updated;
    });

    // Flash saving notification
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 1500);
  };

  const applyPreset = (preset: "speed" | "audio" | "stability") => {
    if (preset === "speed") {
      setSettings((prev) => ({
        ...prev,
        syncMode: "normal",
        audioDelay: 300,
        mediaDelay: 300,
        fps: 60,
        videoDecoding: "hardware",
        wifiBand: "5.8GHz",
        wifiChannel: "149",
        audioFormat: "pcm",
        videoBitrate: "8mbps"
      }));
      addLog("info", "GitHub Preset Applied: [Extreme Performance] - Latency reduced to 300ms, forced 5.8GHz, PCM raw audio initialized.");
    } else if (preset === "audio") {
      setSettings((prev) => ({
        ...prev,
        syncMode: "normal",
        audioDelay: 1200,
        mediaDelay: 1000,
        fps: 60,
        videoDecoding: "hardware",
        wifiBand: "5.8GHz",
        wifiChannel: "44",
        audioFormat: "aac",
        videoBitrate: "12mbps"
      }));
      addLog("info", "GitHub Preset Applied: [Hi-Fi Audio Focus] - AAC codec enforced, 1200ms audio buffer for ultra-smooth music streaming.");
    } else if (preset === "stability") {
      setSettings((prev) => ({
        ...prev,
        syncMode: "compatible",
        audioDelay: 1500,
        mediaDelay: 1200,
        fps: 30,
        videoDecoding: "software",
        wifiBand: "2.4GHz",
        wifiChannel: "auto",
        audioFormat: "aac",
        videoBitrate: "4mbps"
      }));
      addLog("warn", "GitHub Preset Applied: [Absolute Compatibility] - Software decoding, robust 2.4GHz band, 1500ms audio buffers.");
    }
    
    // Flash saving notification
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 1500);
  };

  const applyGitHubPatch = (issue: GitHubIssue) => {
    setSettings((prev) => {
      const updated = { ...prev, ...issue.patch };
      addLog("info", `Applied GitHub Community Tweak [Issue #${issue.number}] for ${issue.brand}: ${issue.title}`);
      Object.entries(issue.patch).forEach(([k, v]) => {
        addLog("debug", `GitHub Override: [${k}] forced to ${v}`);
      });
      return updated;
    });
    setSuccessNotification(`Successfully Applied Hotfix #${issue.number} for ${issue.brand}!`);
    setTimeout(() => setSuccessNotification(""), 4000);
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 1500);
  };

  const compileAndInjectScript = () => {
    setIsCompilingScript(true);
    setCustomScriptStatus("Connecting to adapter bootloader... [OK]\nAnalyzing community script syntax...");
    
    setTimeout(() => {
      try {
        const parsed = JSON.parse(customScriptText);
        // Validate keys
        const validKeys: (keyof DongleSettings)[] = [
          "syncMode", "background", "audioDelay", "mediaDelay", "fps", 
          "resolution", "autoConnect", "gps", "microphone", "videoDecoding", 
          "workMode", "wiredConnection", "screenLayout", "wifiBand", 
          "wifiChannel", "audioFormat", "videoBitrate"
        ];
        
        const invalidKeys = Object.keys(parsed).filter(k => !validKeys.includes(k as any));
        if (invalidKeys.length > 0) {
          throw new Error(`Unsupported settings parameters found: ${invalidKeys.join(", ")}`);
        }
        
        setSettings((prev) => ({ ...prev, ...parsed }));
        
        addLog("info", "GitHub hot-patch compiler: Syntactic verification [PASSED].");
        addLog("info", `Injected custom parameters: ${JSON.stringify(parsed)}`);
        
        setCustomScriptStatus("SUCCESS: Community configuration injected successfully into wireless adapter firmware registry!");
        setSuccessNotification("Custom GitHub patch injected successfully!");
        setTimeout(() => setSuccessNotification(""), 4000);
        
        setSaveNotification(true);
        setTimeout(() => setSaveNotification(false), 1500);
      } catch (err: any) {
        addLog("error", `GitHub hot-patch compiler failed: ${err?.message || "Invalid JSON syntax"}`);
        setCustomScriptStatus(`ERROR: Compilation failed.\nDetails: ${err?.message || "Invalid JSON structure"}`);
      } finally {
        setIsCompilingScript(false);
      }
    }, 1500);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to restore factory default settings?")) {
      setSettings({
        syncMode: "normal",
        background: "dark",
        audioDelay: 1000,
        mediaDelay: 1000,
        fps: 60,
        resolution: "auto",
        autoConnect: true,
        gps: "phone",
        microphone: "car",
        videoDecoding: "hardware",
        workMode: "carplay",
        wiredConnection: false,
        screenLayout: "golden",
        wifiBand: "5.8GHz",
        wifiChannel: "149",
        audioFormat: "aac",
        videoBitrate: "auto",
      });
      addLog("warn", "System setting table re-initialized to factory defaults.");
    }
  };

  return (
    <div id="settings-tab-content" className="flex flex-col gap-6">
      
      {/* Save indicator float */}
      {saveNotification && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white font-mono text-xs px-4 py-2.5 rounded-xl border border-emerald-500/30 flex items-center gap-2 shadow-2xl z-50">
          <CheckCircle className="w-4 h-4 animate-bounce" />
          <span>Settings saved and applied instantly!</span>
        </div>
      )}

      {/* Top action header */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="text-xs font-bold tracking-wide uppercase text-slate-300">Admin Options Control Panel</h3>
            <p className="text-[10px] text-slate-500 font-mono">Modifications write to flash storage immediately. Live sandbox updates instantly.</p>
          </div>
        </div>

        <button 
          onClick={handleResetDefaults}
          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-medium text-slate-400 hover:text-blue-400 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: DISPLAY & PERFORMANCE */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase pb-2 border-b border-slate-800/60 flex items-center gap-2">
            <Tv className="w-4 h-4 text-blue-500" />
            Display & Performance
          </h3>

          {/* Sync Mode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              Sync Mode
              <span className="group relative cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span className="pointer-events-none absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-2 bg-slate-950 text-[10px] font-mono text-slate-400 border border-slate-800 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity leading-relaxed z-30">
                  Compatible mode handles vehicle steering wheel shortcuts and display buffers better on older car software.
                </span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateSetting("syncMode", "normal")}
                className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  settings.syncMode === "normal" 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                Normal (Fastest)
              </button>
              <button 
                onClick={() => updateSetting("syncMode", "compatible")}
                className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  settings.syncMode === "compatible" 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                Compatible
              </button>
            </div>
          </div>

          {/* Target Frame Rate (FPS) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              Screen Frame Rate (FPS)
              <span className="text-[10px] text-slate-500">(Alters simulator smoothness)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateSetting("fps", 30)}
                className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  settings.fps === 30 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                30 FPS (Energy Save)
              </button>
              <button 
                onClick={() => updateSetting("fps", 60)}
                className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  settings.fps === 60 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                60 FPS (Ultra Smooth)
              </button>
            </div>
          </div>

          {/* Target Resolution */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-semibold text-slate-300">Target Headunit Resolution</label>
            <select 
              value={settings.resolution}
              onChange={(e) => updateSetting("resolution", e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="auto">Auto-negotiate (Recommended)</option>
              <option value="800x480">800x480 (Legacy Screens)</option>
              <option value="1280x720">1280x720 (Standard HD)</option>
              <option value="1920x1080">1920x1080 (High-End widescreen)</option>
            </select>
          </div>

          {/* Sandbox Background wallpaper */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-semibold text-slate-300">Infotainment UI Wallpaper</label>
            <div className="grid grid-cols-3 gap-2">
              {(["normal", "dark", "black"] as const).map((bg) => (
                <button 
                  key={bg}
                  onClick={() => updateSetting("background", bg)}
                  className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all capitalize cursor-pointer ${
                    settings.background === bg 
                      ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Infotainment Screen Layout */}
          <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-800/40">
            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              Screen Layout
              <span className="group relative cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span className="pointer-events-none absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-2 bg-slate-950 text-[10px] font-mono text-slate-400 border border-slate-800 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity leading-relaxed z-30">
                  Choose the division of space on the launcher dashboard screen. Golden Ratio maps take up ~61.8%.
                </span>
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => updateSetting("screenLayout", "golden")}
                className={`py-2 text-[10px] sm:text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  settings.screenLayout === "golden" 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                Golden Ratio (Default)
              </button>
              <button 
                onClick={() => updateSetting("screenLayout", "split")}
                className={`py-2 text-[10px] sm:text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  settings.screenLayout === "split" 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                Balanced Split (50:50)
              </button>
              <button 
                onClick={() => updateSetting("screenLayout", "immersive")}
                className={`py-2 text-[10px] sm:text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  settings.screenLayout === "immersive" 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                Map Focus (75:25)
              </button>
            </div>
          </div>

        </div>

        {/* CARD 2: AUDIO STREAM DELAYS & BUFFERS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase pb-2 border-b border-slate-800/60 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            Audio Latency & Buffer Settings
          </h3>

          {/* Audio Delay Buffer */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                Audio Stream Buffer
                <span className="text-[10px] text-slate-500 font-normal">(Fixes music cutouts)</span>
              </span>
              <span className="text-indigo-400 font-bold">{settings.audioDelay} ms</span>
            </div>
            <input 
              type="range"
              min="300"
              max="3000"
              step="100"
              value={settings.audioDelay}
              onChange={(e) => updateSetting("audioDelay", parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 leading-tight">
              <span>⚡ 300ms (Low lag)</span>
              <span>📻 1000ms (Standard)</span>
              <span>📶 3000ms (Safe mode)</span>
            </div>
            {settings.audioDelay > 1500 && (
              <div className="mt-1 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-mono text-amber-300 leading-normal">
                ⚠️ High buffer settings will prevent audio stuttering on noisy wifi connections, but music navigation commands (like skip track) will feel laggy in the simulator.
              </div>
            )}
          </div>

          {/* Media Delay Buffer */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                Video/Media Frame Sync Delay
              </span>
              <span className="text-indigo-400 font-bold">{settings.mediaDelay} ms</span>
            </div>
            <input 
              type="range"
              min="300"
              max="3000"
              step="100"
              value={settings.mediaDelay}
              onChange={(e) => updateSetting("mediaDelay", parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Min Delay</span>
              <span>Auto-Sync</span>
              <span>Max Stability</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono leading-normal text-slate-400">
              Note: Headunit hardware can only handshake values during an active pairing handshake. Settings update immediately on the flies, but a device warm reboot ensures total compatibility.
            </p>
          </div>
        </div>

        {/* CARD 3: SYSTEM HARDWARE ROUTINGS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase pb-2 border-b border-slate-800/60 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            System Integration & Hardware
          </h3>

          {/* GPS Feed Source */}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-300 leading-none">GPS Feed Source</h4>
              <span className="text-[9px] text-slate-500 font-mono">Select which GPS antenna maps the car navigation.</span>
            </div>
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 font-mono text-[10px]">
              <button 
                onClick={() => updateSetting("gps", "phone")}
                className={`px-3 py-1 rounded-md transition-all font-bold cursor-pointer ${
                  settings.gps === "phone" ? "bg-blue-500 text-white shadow" : "text-slate-400"
                }`}
              >
                Phone
              </button>
              <button 
                onClick={() => updateSetting("gps", "car")}
                className={`px-3 py-1 rounded-md transition-all font-bold cursor-pointer ${
                  settings.gps === "car" ? "bg-blue-500 text-white shadow" : "text-slate-400"
                }`}
              >
                Car GPS
              </button>
            </div>
          </div>

          {/* Steering Mic Routing */}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-300 leading-none">Steering Wheel Mic</h4>
              <span className="text-[9px] text-slate-500 font-mono">Route Siri/Google voice assistants microphone.</span>
            </div>
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 font-mono text-[10px]">
              <button 
                onClick={() => updateSetting("microphone", "car")}
                className={`px-3 py-1 rounded-md transition-all font-bold cursor-pointer ${
                  settings.microphone === "car" ? "bg-indigo-500 text-white shadow" : "text-slate-400"
                }`}
              >
                Car OEM
              </button>
              <button 
                onClick={() => updateSetting("microphone", "box")}
                className={`px-3 py-1 rounded-md transition-all font-bold cursor-pointer ${
                  settings.microphone === "box" ? "bg-indigo-500 text-white shadow" : "text-slate-400"
                }`}
              >
                Dongle Mic
              </button>
            </div>
          </div>

          {/* Decoding Pipeline */}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-300 leading-none">Video Decoding</h4>
              <span className="text-[9px] text-slate-500 font-mono">Hardware accelerated or software canvas render.</span>
            </div>
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 font-mono text-[10px]">
              <button 
                onClick={() => updateSetting("videoDecoding", "hardware")}
                className={`px-3 py-1 rounded-md transition-all font-bold cursor-pointer ${
                  settings.videoDecoding === "hardware" ? "bg-emerald-600 text-white shadow" : "text-slate-400"
                }`}
              >
                HW (Fast)
              </button>
              <button 
                onClick={() => updateSetting("videoDecoding", "software")}
                className={`px-3 py-1 rounded-md transition-all font-bold cursor-pointer ${
                  settings.videoDecoding === "software" ? "bg-emerald-600 text-white shadow" : "text-slate-400"
                }`}
              >
                Software
              </button>
            </div>
          </div>

        </div>

        {/* CARD 4: DEVICE OPERATIONAL MODES */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase pb-2 border-b border-slate-800/60 flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            Device Handshake Modes
          </h3>

          {/* Active Work Mode (CarPlay vs Android Auto) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-semibold text-slate-300">Target Car Engine Launcher</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateSetting("workMode", "carplay")}
                className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  settings.workMode === "carplay" 
                    ? "bg-blue-500/15 border-blue-500 text-blue-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                Apple CarPlay
              </button>
              <button 
                onClick={() => updateSetting("workMode", "androidauto")}
                className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  settings.workMode === "androidauto" 
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                Android Auto
              </button>
            </div>
          </div>

          {/* Auto Connect Toggle */}
          <div className="flex justify-between items-center py-1">
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-300 leading-none">Auto-Connection</h4>
              <span className="text-[9px] text-slate-500 font-mono">Instantly start mirror stream on vehicle engine startup.</span>
            </div>
            <button 
              onClick={() => updateSetting("autoConnect", !settings.autoConnect)}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                settings.autoConnect ? "bg-blue-500" : "bg-slate-800"
              }`}
            >
              <div 
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${
                  settings.autoConnect ? "left-6.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Simulate Wired Connection override */}
          <div className="flex justify-between items-center py-1">
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-300 leading-none">Force USB Overrides</h4>
              <span className="text-[9px] text-slate-500 font-mono">Disables Wi-Fi and forces direct USB phone host cabling.</span>
            </div>
            <button 
              onClick={() => updateSetting("wiredConnection", !settings.wiredConnection)}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                settings.wiredConnection ? "bg-blue-500" : "bg-slate-800"
              }`}
            >
              <div 
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${
                  settings.wiredConnection ? "left-6.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

        </div>

      </div>

      {/* GOOGLE CLOUD SYNC & ACCOUNT OPTIONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Chrome className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                  Google Workspace & Telemetry Sync
                </h3>
                {googleUser ? (
                  <span className="px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full uppercase">
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest text-slate-400 bg-slate-500/10 border border-slate-500/20 rounded-full uppercase">
                    Offline
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-relaxed max-w-3xl">
                Synchronize your driving telemetry logs, favorite maps locations, and custom profiles across CarLinkKit simulators.
              </p>
            </div>
          </div>
        </div>

        {googleUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Connected User Details */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center text-center gap-3">
              <div className="relative">
                {googleUser.picture ? (
                  <img 
                    referrerPolicy="no-referrer" 
                    src={googleUser.picture} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-red-500/30 shadow-lg" 
                    alt="Google Profile" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-xl font-bold font-sans border-2 border-red-500/30 shadow-lg border-slate-800">
                    {googleUser.name ? googleUser.name[0] : "G"}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-slate-950 shadow">
                  <Cloud className="w-3 h-3" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1 min-w-0 w-full">
                <h4 className="text-xs font-bold text-slate-200 truncate">{googleUser.name}</h4>
                <p className="text-[9px] text-slate-500 font-mono truncate">{googleUser.email}</p>
              </div>

              <div className="w-full h-[1px] bg-slate-800/60 my-1" />

              <button 
                onClick={() => {
                  setGoogleUser(null);
                  localStorage.removeItem("google_user");
                  addLog("info", "Disconnected active Google Account from settings panel.");
                }}
                className="w-full py-1.5 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-900/40 text-slate-400 hover:text-red-400 text-[10px] font-mono font-bold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect Account
              </button>
            </div>

            {/* Right: Synchronization Rules */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                Active Cloud Synchronization Toggles
              </h4>

              <div className="flex flex-col gap-3">
                {/* Rule 1: Telemetry sync */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex justify-between items-center">
                  <div className="flex flex-col gap-0.5 max-w-[85%]">
                    <span className="text-xs font-mono font-semibold text-slate-200">Sync Driving Telemetry Logs</span>
                    <span className="text-[9px] text-slate-500 leading-normal">
                      Automatically uploads dynamic coordinates, GPS link status, and system buffer logs to your cloud repository.
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setSyncTelemetry(!syncTelemetry);
                      addLog("info", `Google Sync: [Telemetry Upload] toggled ${!syncTelemetry ? "ON" : "OFF"}`);
                    }}
                    className={`w-10 h-5.5 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                      syncTelemetry ? "bg-red-500" : "bg-slate-850"
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 bg-white rounded-full absolute top-0.75 transition-all shadow-sm ${
                        syncTelemetry ? "left-5.25" : "left-0.75"
                      }`}
                    />
                  </button>
                </div>

                {/* Rule 2: Preset Cloud Backup */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex justify-between items-center">
                  <div className="flex flex-col gap-0.5 max-w-[85%]">
                    <span className="text-xs font-mono font-semibold text-slate-200">Cloud-Backup Custom Presets</span>
                    <span className="text-[9px] text-slate-500 leading-normal">
                      Saves your current custom delays, bitrate, and screen options so they instantly persist on any device or headunit.
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setSyncPresets(!syncPresets);
                      addLog("info", `Google Sync: [Preset Backups] toggled ${!syncPresets ? "ON" : "OFF"}`);
                    }}
                    className={`w-10 h-5.5 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                      syncPresets ? "bg-red-500" : "bg-slate-850"
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 bg-white rounded-full absolute top-0.75 transition-all shadow-sm ${
                        syncPresets ? "left-5.25" : "left-0.75"
                      }`}
                    />
                  </button>
                </div>

                {/* Rule 3: Search history sync */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex justify-between items-center">
                  <div className="flex flex-col gap-0.5 max-w-[85%]">
                    <span className="text-xs font-mono font-semibold text-slate-200">Maps Search History Synchronization</span>
                    <span className="text-[9px] text-slate-500 leading-normal">
                      Share search pins, destination history, and active routes with Google Maps running on the CarPlay simulator screen.
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setSyncMapsHistory(!syncMapsHistory);
                      addLog("info", `Google Sync: [Map History Sync] toggled ${!syncMapsHistory ? "ON" : "OFF"}`);
                    }}
                    className={`w-10 h-5.5 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                      syncMapsHistory ? "bg-red-500" : "bg-slate-850"
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 bg-white rounded-full absolute top-0.75 transition-all shadow-sm ${
                        syncMapsHistory ? "left-5.25" : "left-0.75"
                      }`}
                    />
                  </button>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <span className="text-xs font-bold text-slate-200 flex items-center justify-center md:justify-start gap-1.5">
                <Cloud className="w-4 h-4 text-slate-400" />
                Local Offline Cache Mode
              </span>
              <p className="text-[10px] text-slate-400 max-w-xl leading-normal">
                Your device settings and virtual coordinates are currently saved locally to this web browser. Link your Google Workspace profile to test multi-device cloud synchronization, real OAuth validation, and live Map bookmarks.
              </p>
            </div>
            <button 
              onClick={onConnectGoogleClick}
              className="w-full md:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <Chrome className="w-4 h-4 text-white" />
              Connect Google Account
            </button>
          </div>
        )}

      </div>

      {/* NEW: GITHUB COMMUNITY AUDIO & SPEED OPTIMIZER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6 mt-2 relative overflow-hidden">
        
        {/* Floating Success Notification */}
        {successNotification && (
          <div className="absolute top-4 right-4 bg-emerald-500/90 text-white text-[10px] font-mono font-bold px-3 py-2 rounded-lg shadow-lg border border-emerald-400 flex items-center gap-2 z-20 animate-bounce">
            <CheckCircle className="w-4 h-4" />
            {successNotification}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-slate-300">
              <Github className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                  GitHub Community Audio & Speed Optimizer
                </h3>
                <span className="px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full uppercase">
                  v4.1 Tweak Suite
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-relaxed max-w-3xl">
                Deploy community tweaks and wireless firmware hotfixes sourced from <span className="text-slate-200 font-bold">github.com</span> repositories to fix audio lag, dropouts, and vehicle compatibility bugs.
              </p>
            </div>
          </div>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-[10px] font-mono font-bold text-slate-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Community Repo
          </a>
        </div>

        {/* Preset Profiles Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              One-Click Core Optimization Profiles
            </h4>
            <span className="text-[9px] text-slate-500 font-mono">Sourced from master branch</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal -mt-1">
            Apply pre-configured registry values corresponding to the most successful fixes posted on community trackers.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-1.5">
            {/* Speed & Latency Preset */}
            <div className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between gap-4 transition-all group">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Extreme Performance
                  </span>
                  <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                    Low Delay
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Sets latency to <span className="text-slate-200">300ms</span>, locks high-speed <span className="text-slate-200">5.8GHz</span> band, and routes <span className="text-slate-200">PCM raw sound</span>. Perfect for fast song skips and maps rendering.
                </p>
                <div className="flex flex-wrap gap-1 mt-1 text-[8px] font-mono">
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Lag: 300ms</span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Wi-Fi: 5.8G</span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Audio: PCM</span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Bitrate: 8M</span>
                </div>
              </div>
              <button 
                onClick={() => applyPreset("speed")}
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-mono font-bold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Apply Extreme Speed
              </button>
            </div>

            {/* Hi-Fi Audio Focus Preset */}
            <div className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between gap-4 transition-all group">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    Hi-Fi Audio Focus
                  </span>
                  <span className="text-[8px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                    Studio sound
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Locks high-fidelity compressed <span className="text-slate-200">AAC</span> sound, bumps audio buffer to <span className="text-slate-200">1200ms</span> to avoid any stuttering even on congested highways or older cars.
                </p>
                <div className="flex flex-wrap gap-1 mt-1 text-[8px] font-mono">
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Lag: 1200ms</span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Wi-Fi: 5.8G</span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Audio: AAC</span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Bitrate: 12M</span>
                </div>
              </div>
              <button 
                onClick={() => applyPreset("audio")}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono font-bold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Apply Hi-Fi Audio
              </button>
            </div>

            {/* Absolute Stability Preset */}
            <div className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between gap-4 transition-all group">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    Absolute Stability
                  </span>
                  <span className="text-[8px] font-mono text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                    Anti-disconnect
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  For vehicle units prone to freezing. Uses low-overhead <span className="text-slate-200">4Mbps</span> stream, <span className="text-slate-200">software decoding</span>, and <span className="text-slate-200">2.4GHz Wi-Fi</span> band to ensure connection longevity.
                </p>
                <div className="flex flex-wrap gap-1 mt-1 text-[8px] font-mono">
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Lag: 1500ms</span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Wi-Fi: 2.4G</span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Mode: Compatible</span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Bitrate: 4M</span>
                </div>
              </div>
              <button 
                onClick={() => applyPreset("stability")}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Apply Compatibility Preset
              </button>
            </div>
          </div>
        </div>

        {/* INTERACTIVE ISSUES EXPLORER SECTION (NEW) */}
        <div className="border-t border-slate-800/60 pt-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-left">
            <div className="flex flex-col">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Live GitHub Issue Triage & Hotfix Deployer
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Browse real community complaints with verified workarounds. Select an issue to inspect its parameter overrides and hot-patch.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
              <GitPullRequest className="w-3 h-3 text-indigo-400" />
              6 Active PRs • v4.1.2-stable
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text"
                placeholder="Search community issues (e.g. BMW, lag, audio)..."
                value={githubSearch}
                onChange={(e) => setGithubSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-slate-700 text-[10px] text-slate-300 font-mono pl-9 pr-3 py-1.5 rounded-lg focus:outline-none"
              />
            </div>
            {/* Brand Filter */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[9px] font-mono text-slate-500 uppercase mr-1">Brand:</span>
              {["all", "BMW", "Lexus", "Audi", "Tesla", "Toyota", "Porsche"].map((b) => (
                <button
                  key={b}
                  onClick={() => setGithubFilterBrand(b)}
                  className={`px-2 py-1 rounded text-[9px] font-mono transition-all uppercase border cursor-pointer ${
                    githubFilterBrand === b 
                      ? "bg-indigo-600 border-indigo-500 text-white font-bold" 
                      : "bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-400"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Issues Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: Issues List */}
            <div className="lg:col-span-7 flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {GITHUB_ISSUES.filter(issue => {
                const matchesSearch = issue.title.toLowerCase().includes(githubSearch.toLowerCase()) || 
                                     issue.description.toLowerCase().includes(githubSearch.toLowerCase()) ||
                                     issue.tags.some(t => t.toLowerCase().includes(githubSearch.toLowerCase()));
                const matchesBrand = githubFilterBrand === "all" || issue.brand.toUpperCase() === githubFilterBrand.toUpperCase();
                return matchesSearch && matchesBrand;
              }).map(issue => {
                const isSelected = selectedIssueId === issue.id;
                return (
                  <div 
                    key={issue.id}
                    onClick={() => setSelectedIssueId(isSelected ? null : issue.id)}
                    className={`border rounded-xl p-3.5 flex flex-col gap-2 transition-all cursor-pointer text-left ${
                      isSelected 
                        ? "bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-950/35" 
                        : "bg-slate-950 border-slate-850 hover:bg-slate-900/60 hover:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                          <GitCommit className="w-3 h-3 text-indigo-500" />
                          issue #{issue.number} by @{issue.author} • {issue.brand}
                        </span>
                        <h5 className="text-[11px] font-bold text-slate-200 group-hover:text-white mt-0.5 leading-snug">
                          {issue.title}
                        </h5>
                      </div>
                      <span className="text-[8px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                        {issue.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {issue.description}
                    </p>

                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-900">
                      <div className="flex flex-wrap gap-1">
                        {issue.tags.map(t => (
                          <span key={t} className="text-[8px] font-mono bg-slate-900 border border-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-mono text-slate-500">
                        <span className="flex items-center gap-1">★ {issue.stars}</span>
                        <span>💬 {issue.comments}</span>
                        <span className="text-indigo-400 font-bold flex items-center gap-0.5">
                          Inspect Patch <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {GITHUB_ISSUES.filter(issue => {
                const matchesSearch = issue.title.toLowerCase().includes(githubSearch.toLowerCase()) || 
                                     issue.description.toLowerCase().includes(githubSearch.toLowerCase()) ||
                                     issue.tags.some(t => t.toLowerCase().includes(githubSearch.toLowerCase()));
                const matchesBrand = githubFilterBrand === "all" || issue.brand.toUpperCase() === githubFilterBrand.toUpperCase();
                return matchesSearch && matchesBrand;
              }).length === 0 && (
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2">
                  <GitPullRequest className="w-8 h-8 text-slate-700 animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-400">No active community patches match your filter</span>
                  <button 
                    onClick={() => { setGithubSearch(""); setGithubFilterBrand("all"); }}
                    className="mt-1 text-[9px] font-mono text-indigo-400 hover:underline hover:text-indigo-300 cursor-pointer"
                  >
                    Clear Search Filters
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Detailed Inspector & Patch Actions */}
            <div className="lg:col-span-5 h-full">
              {selectedIssueId ? (() => {
                const issue = GITHUB_ISSUES.find(i => i.id === selectedIssueId)!;
                return (
                  <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3 text-left shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-wider font-bold">Community-Approved Fix</span>
                        <span className="text-[10px] font-mono text-slate-400">Issue #{issue.number} Workspace</span>
                      </div>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        issue.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        issue.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {issue.difficulty} Tweak
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-mono font-bold text-slate-300 uppercase">Reproduction Steps:</span>
                      <p className="text-[10px] text-slate-400 bg-slate-900 border border-slate-850/60 rounded p-2 font-mono leading-relaxed">
                        "{issue.reproduction}"
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-mono font-bold text-slate-300 uppercase">Patch Parameters:</span>
                      <div className="bg-slate-900 border border-slate-850 rounded p-2.5 flex flex-col gap-1.5">
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                          {Object.entries(issue.patch).map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-slate-800/40 pb-1">
                              <span className="text-slate-500">{key}:</span>
                              <span className="text-indigo-300 font-bold">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 leading-normal italic">
                          {issue.patchExplanation}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => applyGitHubPatch(issue)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono font-bold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      Apply Community Hotfix Patch
                    </button>
                  </div>
                );
              })() : (
                <div className="bg-slate-950 border border-slate-850/60 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 h-[280px]">
                  <Github className="w-8 h-8 text-slate-800" />
                  <div>
                    <h5 className="text-[11px] font-mono font-bold text-slate-400 uppercase">Select Patch to Inspect</h5>
                    <p className="text-[9px] text-slate-600 mt-1 leading-normal max-w-[200px] mx-auto">
                      Click any registered community issue on the left to review its detailed code overrides, reproduction vectors, and auto-patch capabilities.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* CUSTOM HOT-INJECT SCRIPT ENGINE (NEW) */}
        <div className="border-t border-slate-800/60 pt-5 flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Advanced Community Hot-Inject Script Engine
            </h4>
            <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase border border-emerald-500/20">
              Live Compiler
            </span>
          </div>
          <p className="text-[10px] text-slate-500 -mt-1 leading-relaxed">
            Need manual granular control? Select from common scripts shared in Carlinkit wireless-adapter threads, or type a custom JSON setting structure to hot-inject direct modifications into the active adapter memory space.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* JSON Code Editor */}
            <div className="lg:col-span-7 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 px-1">
                <span>VIRTUAL_REGISTRY_FIRMWARE_COMPILER</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Preset Scripts:</span>
                  <button 
                    onClick={() => setCustomScriptText(JSON.stringify({ wifiBand: "5.8GHz", wifiChannel: "149", audioFormat: "pcm", videoBitrate: "12mbps" }, null, 2))}
                    className="text-indigo-400 hover:underline hover:text-indigo-300 uppercase cursor-pointer text-[8px] font-mono"
                  >
                    Bimmer Extreme
                  </button>
                  <span>•</span>
                  <button 
                    onClick={() => setCustomScriptText(JSON.stringify({ videoDecoding: "software", fps: 30, videoBitrate: "4mbps", syncMode: "compatible" }, null, 2))}
                    className="text-emerald-400 hover:underline hover:text-emerald-300 uppercase cursor-pointer text-[8px] font-mono"
                  >
                    Compat Safe
                  </button>
                </div>
              </div>

              <textarea 
                value={customScriptText}
                onChange={(e) => setCustomScriptText(e.target.value)}
                rows={7}
                placeholder="Type settings payload in JSON format..."
                className="w-full bg-slate-950 border border-slate-850 focus:border-slate-750 font-mono text-[10px] text-emerald-400 p-3 rounded-lg focus:outline-none leading-relaxed resize-none cursor-text shadow-inner"
              />

              <button 
                onClick={compileAndInjectScript}
                disabled={isCompilingScript}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-50 text-white text-[10px] font-mono font-bold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                {isCompilingScript ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Verifying Syntactic Integrity & Injecting Tweak...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Compile & Hot-Inject Community Script Patch
                  </>
                )}
              </button>
            </div>

            {/* Simulated Live Compiler Diagnostics Console */}
            <div className="lg:col-span-5 flex flex-col bg-slate-950 border border-slate-850 rounded-xl p-3">
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest pb-1.5 border-b border-slate-900">
                Compiler Shell Logs
              </span>
              <div className="flex-1 mt-2 font-mono text-[9px] text-slate-400 leading-normal overflow-y-auto whitespace-pre-wrap flex flex-col gap-1 min-h-[120px] max-h-[180px] text-left">
                {isCompilingScript ? (
                  <span className="text-amber-400">
                    [INFO] INITIATING TRANS-COMPILATION PROCESS...
                    {"\n"}[BOOTLOADER] CONNECTED AT ADAPTER INTERFACE BRIDGE
                    {"\n"}[VALIDATOR] SCANNING JSON FIELD CONSTRAINTS...
                    {"\n"}[COMPILING] REWRITING FIRMWARE EEPROM BLOCK SECTORS...
                  </span>
                ) : customScriptStatus ? (
                  <span className={customScriptStatus.startsWith("ERROR") ? "text-rose-500" : "text-emerald-400 font-semibold"}>
                    {customScriptStatus}
                  </span>
                ) : (
                  <span className="text-slate-600 italic">
                    Awaiting script input. Choose a preset or edit JSON parameters directly. Press "Compile & Hot-Inject" to see feedback logs from your Carlinkit wireless bridge system.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>


      {/* Manual Fine-Tuning Grid */}
      <div className="border-t border-slate-800/50 pt-5 flex flex-col gap-4">
        <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 text-left">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          Manual Fine-Tuning Sourced from GitHub
        </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Wi-Fi Band */}
            <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 flex flex-col gap-2">
              <label className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-amber-500" />
                Wi-Fi Frequency Band
              </label>
              <select 
                value={settings.wifiBand}
                onChange={(e) => updateSetting("wifiBand", e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
              >
                <option value="2.4GHz">2.4 GHz (Slow, Long range)</option>
                <option value="5.0GHz">5.0 GHz (Fast, Standard)</option>
                <option value="5.8GHz">5.8 GHz (High Speed, Anti-Stutter)</option>
              </select>
              <span className="text-[8px] text-slate-500 leading-normal">
                Carlinkit community recommendation: 5.8 GHz WiFi avoids Bluetooth interference and delivers maximum speeds.
              </span>
            </div>

            {/* Wi-Fi Channel */}
            <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 flex flex-col gap-2">
              <label className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Preferred Wi-Fi Channel
              </label>
              <select 
                value={settings.wifiChannel}
                onChange={(e) => updateSetting("wifiChannel", e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
              >
                <option value="auto">Auto-Scan Channel</option>
                <option value="36">Channel 36 (5 GHz, Low Congestion)</option>
                <option value="44">Channel 44 (5 GHz, Stable)</option>
                <option value="149">Channel 149 (5.8 GHz, High Power)</option>
                <option value="161">Channel 161 (5.8 GHz, Max Throughput)</option>
              </select>
              <span className="text-[8px] text-slate-500 leading-normal">
                Setting a static channel prevents periodic connection drops as the dongle won't constantly search.
              </span>
            </div>

            {/* Audio Encoding Format */}
            <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 flex flex-col gap-2">
              <label className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                Audio Output Format
              </label>
              <select 
                value={settings.audioFormat}
                onChange={(e) => updateSetting("audioFormat", e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              >
                <option value="aac">AAC (Compressed, Siri Native)</option>
                <option value="pcm">PCM Raw CD-Audio (Low Latency)</option>
              </select>
              <span className="text-[8px] text-slate-500 leading-normal">
                PCM reduces audio delay by ~200ms but uses slightly more bandwidth. Sourced from firmware v4.0.
              </span>
            </div>

            {/* Video Bitrate */}
            <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 flex flex-col gap-2">
              <label className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-emerald-500" />
                Video Stream Bitrate
              </label>
              <select 
                value={settings.videoBitrate}
                onChange={(e) => updateSetting("videoBitrate", e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full"
              >
                <option value="auto">Auto-Negotiate Bitrate</option>
                <option value="4mbps">4 Mbps (Fluid FPS, Lower Detail)</option>
                <option value="8mbps">8 Mbps (Recommended Stable)</option>
                <option value="12mbps">12 Mbps (High Detail, High CPU)</option>
              </select>
              <span className="text-[8px] text-slate-500 leading-normal">
                Limiting bitrate resolves pixelation/freeze lag on older car CPUs with slow processing power.
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
