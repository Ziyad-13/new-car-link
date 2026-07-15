import React, { useState } from "react";
import { 
  Terminal, Search, Filter, Trash2, Download, Send, HelpCircle, 
  ChevronDown, ChevronUp, CheckCircle, Info, LifeBuoy, AlertCircle, Sparkles, RefreshCw,
  Activity, Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DiagnosticLog, FAQItem } from "../types";
import { FAQ_DATABASE } from "../data";

interface DiagnosticsTabProps {
  logs: DiagnosticLog[];
  setLogs: React.Dispatch<React.SetStateAction<DiagnosticLog[]>>;
  addLog: (level: "info" | "warn" | "error" | "debug", msg: string) => void;
}

export default function DiagnosticsTab({
  logs,
  setLogs,
  addLog
}: DiagnosticsTabProps) {
  // Log viewer states
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<string>("all");

  // FAQ states
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Help ticket states
  const [ticketCategory, setTicketCategory] = useState("connection");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);

  // Network Signal Ping states
  const [pingTarget, setPingTarget] = useState<"phone" | "gateway">("phone");
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [pinging, setPinging] = useState(false);
  const [pingSummary, setPingSummary] = useState<{
    min: number;
    avg: number;
    max: number;
    jitter: number;
    loss: number;
  } | null>(null);

  const handleStartPing = () => {
    if (pinging) return;
    setPinging(true);
    setPingSummary(null);
    const targetIp = pingTarget === "phone" ? "192.168.50.150" : "192.168.50.2";
    const targetName = pingTarget === "phone" ? "Smartphone Bridge" : "Dongle Gateway";
    
    addLog("info", `Starting local ICMP echo ping test to ${targetName} (${targetIp})...`);
    setPingLogs([`PING ${targetIp} (${targetIp}) 56(84) bytes of data.`]);

    let seq = 1;
    const latencies: number[] = [];
    
    const runPingIteration = () => {
      if (seq > 5) {
        const min = Math.min(...latencies);
        const max = Math.max(...latencies);
        const avg = parseFloat((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2));
        
        let diffSum = 0;
        for (let i = 0; i < latencies.length - 1; i++) {
          diffSum += Math.abs(latencies[i+1] - latencies[i]);
        }
        const jitter = parseFloat((diffSum / (latencies.length - 1)).toFixed(2));
        const summary = { min, avg, max, jitter, loss: 0 };
        
        setTimeout(() => {
          setPingLogs(prev => [
            ...prev,
            "",
            `--- ${targetIp} ping statistics ---`,
            `5 packets transmitted, 5 received, 0% packet loss, time ${2000 + Math.floor(Math.random() * 50)}ms`,
            `rtt min/avg/max/mdev = ${min.toFixed(1)}/${avg.toFixed(1)}/${max.toFixed(1)}/${jitter.toFixed(1)} ms`
          ]);
          setPingSummary(summary);
          setPinging(false);
          addLog("info", `Ping diagnostic to ${targetIp} complete. Avg delay: ${avg}ms, jitter: ${jitter}ms.`);
        }, 500);
        return;
      }

      setTimeout(() => {
        let delay = 0;
        if (pingTarget === "phone") {
          // Wireless over 5Ghz: generally fast, but with some fluctuation
          const spikeChance = seq === 3 && Math.random() > 0.4;
          delay = spikeChance 
            ? parseFloat((Math.random() * 10 + 11.2).toFixed(1)) 
            : parseFloat((Math.random() * 3 + 2.1).toFixed(1));
        } else {
          // Wired USB ethernet socket: ultra stable
          delay = parseFloat((Math.random() * 0.8 + 0.9).toFixed(1));
        }
        
        latencies.push(delay);
        const spikeTag = (pingTarget === "phone" && delay > 10) ? " (jitter wave detected)" : "";
        
        setPingLogs(prev => [
          ...prev,
          `64 bytes from ${targetIp}: icmp_seq=${seq} ttl=64 time=${delay.toFixed(1)} ms${spikeTag}`
        ]);
        
        seq++;
        runPingIteration();
      }, 550);
    };

    runPingIteration();
  };

  // Clear logs action
  const handleClearLogs = () => {
    setLogs([]);
    addLog("warn", "Diagnostic terminal history cleared by administrator.");
  };

  // Download logs file simulation
  const handleDownloadLogs = () => {
    const textContent = logs
      .map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");
    
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carlinkkit_diagnostics_${Date.now()}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("info", "Downloaded full system diagnostic file.");
  };

  // Handle support ticket submission and generate smart response
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDescription || !ticketEmail) {
      alert("Please fill in both your email and description of the issue.");
      return;
    }

    setIsSubmitting(true);
    setSubmittedTicket(null);
    setSubmitStep("Parsing core adapter state tables...");
    addLog("info", "Gathering system parameters for crash dump package...");

    setTimeout(() => {
      setSubmitStep("Packaging and encrypting system logs (Gzip)...");
      addLog("info", "Diagnostics snapshot generated successfully.");

      setTimeout(() => {
        setSubmitStep("Uploading snapshot to Carlinkit Global Servers...");
        
        setTimeout(() => {
          setSubmitStep("Generating AI Diagnostic Analysis...");
          
          setTimeout(() => {
            setIsSubmitting(false);
            
            // Analyze query description for customized smart suggestion
            const text = ticketDescription.toLowerCase();
            let recommendation = "";
            let priority = "Normal";

            if (text.includes("lag") || text.includes("delay") || text.includes("stutter") || text.includes("cut")) {
              recommendation = "Our AI suggests reducing the 'Audio Delay' buffer in your Settings to 500ms or 800ms to offset lag. Additionally, setting 'Sync Mode' to Compatible can alleviate wheel controller stutter.";
              priority = "High (Media)";
            } else if (text.includes("black") || text.includes("screen") || text.includes("display") || text.includes("blank")) {
              recommendation = "Black screen handshakes are usually resolution mismatches. In the Settings, swap 'Video Decoding' from Hardware to Software, and manually configure the 'Target Resolution' to 1280x720 instead of Auto.";
              priority = "Critical (Display)";
            } else if (text.includes("disconnect") || text.includes("drop") || text.includes("reboot") || text.includes("crash")) {
              recommendation = "Intermittent drops are usually due to Wi-Fi signal interference. Go to the Dashboard tab and click 'Calibrate' to search for a clean DFS wireless channel. Ensure you are using a double-shielded USB cable.";
              priority = "High (Connection)";
            } else {
              recommendation = "Ensure your adapter is upgraded to the latest July 1, 2026 build in the Firmware tab. A device warm reboot is recommended after applying new settings.";
              priority = "Normal";
            }

            const ticketId = `CL-${Math.floor(100000 + Math.random() * 900000)}`;
            setSubmittedTicket({
              id: ticketId,
              priority,
              recommendation,
              email: ticketEmail,
            });

            addLog("info", `Support Ticket ${ticketId} generated and filed with technical support.`);
            // Reset description
            setTicketDescription("");
          }, 1200);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // Filter logs logic
  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                          l.level.toLowerCase().includes(logSearch.toLowerCase());
    const matchesFilter = logFilter === "all" || l.level === logFilter;
    return matchesSearch && matchesFilter;
  });

  // Filter FAQ logic
  const filteredFaqs = FAQ_DATABASE.filter(f => {
    const matchesSearch = f.question.toLowerCase().includes(faqSearch.toLowerCase()) || 
                          f.answer.toLowerCase().includes(faqSearch.toLowerCase());
    const matchesCategory = faqCategory === "all" || f.category === faqCategory;
    return matchesSearch && matchesCategory;
  });

  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case "error": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "warn": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "debug": return "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20";
      default: return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
    }
  };

  return (
    <div id="diagnostics-tab-content" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* LEFT: Live log terminal (8 cols) */}
      <div className="xl:col-span-8 flex flex-col gap-6">
        
        {/* Interactive Log Viewer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[400px]">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase flex items-center gap-2">
              <Terminal className="w-4 h-4 text-rose-500" />
              Live Diagnostic Terminal
            </h3>

            {/* Log Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filter string..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-lg pl-8 pr-3 py-1 text-[10px] font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500 w-36 sm:w-48"
                />
              </div>

              <select 
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none"
              >
                <option value="all">Levels: ALL</option>
                <option value="info">INFO</option>
                <option value="warn">WARN</option>
                <option value="error">ERROR</option>
                <option value="debug">DEBUG</option>
              </select>

              <button 
                onClick={handleDownloadLogs}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Download log bundle"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={handleClearLogs}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                title="Clear terminal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Core Logs Screen */}
          <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-3 overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col-reverse shadow-inner">
            <div className="flex flex-col gap-1.5">
              {filteredLogs.length === 0 ? (
                <div className="text-slate-600 text-center py-10">No matching logs found</div>
              ) : (
                filteredLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 border-b border-slate-950 hover:bg-slate-900/40 p-0.5 transition-colors">
                    <span className="text-slate-600 flex-shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border flex-shrink-0 leading-none mt-0.5 ${getLogLevelStyle(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-slate-300 break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FAQ Troubleshooting Guide Accordion */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Troubleshooting & FAQ Database
            </h3>

            {/* Category selection Tabs */}
            <div className="flex gap-1 bg-slate-950 p-0.5 border border-slate-850 rounded-lg text-[9px] font-mono">
              {(["all", "connection", "audio", "video", "upgrade"] as const).map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setFaqCategory(cat)}
                  className={`px-2.5 py-1 rounded-md capitalize font-bold transition-all ${
                    faqCategory === cat ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Search Bar */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search FAQ questions or solutions..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
            />
          </div>

          {/* Accordion List */}
          <div className="flex flex-col gap-2.5">
            {filteredFaqs.length === 0 ? (
              <div className="text-slate-500 text-center py-6 font-mono text-xs">No matching FAQ solutions found</div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFaq === faq.id;
                return (
                  <div 
                    key={faq.id}
                    className="border border-slate-800/80 rounded-xl bg-slate-950/40 overflow-hidden transition-colors hover:border-slate-800"
                  >
                    <button 
                      onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-slate-200 gap-4"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-indigo-400">
                          {faq.category}
                        </span>
                        <span>{faq.question}</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-850 bg-slate-950/80 p-4 text-[11px] font-mono text-slate-400 leading-relaxed"
                        >
                          {faq.answer}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* RIGHT: Ticket dispatch center (4 cols) */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        
        {/* Support ticket submission form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase mb-3 flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-rose-500" />
            Developer Support Dispatch
          </h3>

          <p className="text-[10px] text-slate-500 font-mono leading-relaxed mb-4">
            Having an issue? Fill this form to bundle your active simulator logs and submit a help package to developer servers.
          </p>

          <form onSubmit={handleSubmitTicket} className="flex flex-col gap-4">
            {/* Contact Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Your Email Address</label>
              <input 
                type="email"
                required
                placeholder="driver@example.com"
                value={ticketEmail}
                onChange={(e) => setTicketEmail(e.target.value)}
                disabled={isSubmitting}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Problem Category</label>
              <select 
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                disabled={isSubmitting}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="connection">Frequent Disconnections</option>
                <option value="audio">Audio Sync / Lag</option>
                <option value="video">Black Screen / Freezes</option>
                <option value="upgrade">Upgrade Loop Failures</option>
                <option value="other">General Other Issue</option>
              </select>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Describe What Happened</label>
              <textarea 
                rows={3}
                required
                placeholder="My steering controls have a 2 second delay on my 2024 Porsche Carrera..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                disabled={isSubmitting}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50 font-mono resize-none"
              />
            </div>

            {/* Submission triggers & stages */}
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex flex-col items-center justify-center text-center py-6"
                >
                  <RefreshCw className="w-6 h-6 text-rose-500 animate-spin mb-2" />
                  <span className="text-[10px] font-mono text-rose-400 animate-pulse">{submitStep}</span>
                </motion.div>
              ) : (
                <button 
                  type="submit"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Ticket & Logs
                </button>
              )}
            </AnimatePresence>
          </form>

          {/* Submission Feedback */}
          <AnimatePresence>
            {submittedTicket && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-4 bg-slate-950/80 border border-indigo-900/40 rounded-xl flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Ticket Dispatched Successfully!</span>
                </div>
                
                <div className="divide-y divide-slate-900 text-[10px] font-mono text-slate-400">
                  <div className="pb-1.5 flex justify-between">
                    <span>Ticket ID:</span>
                    <span className="text-white font-bold">{submittedTicket.id}</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span>Severity index:</span>
                    <span className="text-rose-400">{submittedTicket.priority}</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span>Contact:</span>
                    <span className="truncate max-w-[150px]">{submittedTicket.email}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/10 rounded-lg text-[10px] font-mono text-indigo-300 leading-normal">
                  <span className="font-bold text-slate-200 block mb-1">🤖 Smart Diagnostic Advice:</span>
                  {submittedTicket.recommendation}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bridge Network Socket & Ping Tool */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
              Local Bridge Ping Utility
            </h3>
            <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-slate-500">
              ICMP Socket
            </span>
          </div>

          <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
            Test latency and packet jitter between your computer, the Carlinkit dongle, or the active virtual smartphone bridge.
          </p>

          {/* Target selection pills */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-850">
            <button
              onClick={() => {
                if (pinging) return;
                setPingTarget("phone");
                setPingLogs([]);
                setPingSummary(null);
              }}
              disabled={pinging}
              className={`py-1 text-[10px] font-mono rounded-md transition-all ${
                pingTarget === "phone" 
                  ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700/60" 
                  : "text-slate-400 hover:text-slate-200"
              } disabled:opacity-50`}
            >
              Phone Bridge
            </button>
            <button
              onClick={() => {
                if (pinging) return;
                setPingTarget("gateway");
                setPingLogs([]);
                setPingSummary(null);
              }}
              disabled={pinging}
              className={`py-1 text-[10px] font-mono rounded-md transition-all ${
                pingTarget === "gateway" 
                  ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700/60" 
                  : "text-slate-400 hover:text-slate-200"
              } disabled:opacity-50`}
            >
              Dongle IP (50.2)
            </button>
          </div>

          {/* Terminal Console View */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 h-36 overflow-y-auto font-mono text-[9px] text-emerald-400/90 leading-tight flex flex-col gap-0.5 scrollbar-thin scrollbar-thumb-slate-800">
            {pingLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 italic">
                Awaiting test trigger. Click Start Diagnostic below.
              </div>
            ) : (
              pingLogs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log.startsWith("64 bytes") ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.includes("statistics") || log.includes("rtt") ? (
                    <span className="text-indigo-400 font-bold">{log}</span>
                  ) : (
                    <span className="text-slate-500">{log}</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Action trigger */}
          <button
            onClick={handleStartPing}
            disabled={pinging}
            className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {pinging ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span>Pinging socket...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-emerald-500" />
                <span>Start Ping Diagnostic</span>
              </>
            )}
          </button>

          {/* Ping statistics summary overlay */}
          <AnimatePresence>
            {pingSummary && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl flex flex-col gap-2.5"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-slate-300">Ping Signal Stats:</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    pingSummary.jitter > 2.0 
                      ? "bg-amber-950 text-amber-400 border border-amber-900/40" 
                      : "bg-emerald-950 text-emerald-400 border border-emerald-900/40"
                  }`}>
                    {pingSummary.jitter > 2.0 ? "Fluctuating Jitter" : "Stable Stream"}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-850">
                    <span className="text-slate-500 block">MIN</span>
                    <span className="text-slate-300 font-bold">{pingSummary.min}ms</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-850">
                    <span className="text-slate-500 block">AVG</span>
                    <span className="text-slate-300 font-bold">{pingSummary.avg}ms</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-850">
                    <span className="text-slate-500 block">MAX</span>
                    <span className="text-slate-300 font-bold">{pingSummary.max}ms</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-850">
                    <span className="text-slate-500 block">MDEV</span>
                    <span className="text-emerald-400 font-bold">{pingSummary.jitter}ms</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono leading-normal p-2 bg-slate-900 rounded-lg text-slate-400">
                  <span className="text-slate-200 font-bold block mb-0.5">💡 Network Advice:</span>
                  {pingSummary.jitter > 2.0 ? (
                    "Airwave congestion detected. If CarPlay audio is laggy or stuttering, we recommend increasing the Media Buffer in Settings, or switching your car's Wi-Fi channel to 149."
                  ) : (
                    "Your signal packet pipeline is working perfectly. Minimal lag detected. Safely experiment with smaller audio buffer latency in Settings."
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
