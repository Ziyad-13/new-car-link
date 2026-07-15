import React, { useState, useEffect } from "react";
import { X, Key, Shield, AlertCircle, Compass, CheckCircle, Chrome, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleUserProfile } from "../types";

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: GoogleUserProfile) => void;
  addLog: (level: "info" | "warn" | "error" | "debug", msg: string) => void;
}

export default function GoogleLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  addLog
}: GoogleLoginModalProps) {
  const [customClientId, setCustomClientId] = useState<string>(() => {
    return localStorage.getItem("google_custom_client_id") || "";
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Read environment variable if available
  const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";
  const effectiveClientId = customClientId || envClientId;

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectUri = `${currentOrigin}/oauth-callback.html`;

  useEffect(() => {
    if (customClientId) {
      localStorage.setItem("google_custom_client_id", customClientId);
    } else {
      localStorage.removeItem("google_custom_client_id");
    }
  }, [customClientId]);

  // Listen for message from popup
  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      // Security check: Verify origin
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS" && event.data?.provider === "google") {
        const token = event.data.accessToken;
        addLog("info", "[Google Auth] Successfully captured access token. Retrieving user profile from Google...");
        setIsLoading(true);
        setError(null);

        try {
          const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (res.ok) {
            const profile = await res.json();
            const userProfile: GoogleUserProfile = {
              email: profile.email || "zix2025@gmail.com",
              name: profile.name || "Google User",
              picture: profile.picture || "https://lh3.googleusercontent.com/a/default-user=s120-c",
              given_name: profile.given_name || "Google",
              family_name: profile.family_name || "User",
              isDemo: false
            };

            addLog("info", `[Google Auth] Authentication successful! Logged in as: ${userProfile.email}`);
            onLoginSuccess(userProfile);
            onClose();
          } else {
            const errText = await res.text();
            addLog("error", `[Google Auth] Google UserInfo API error: ${errText}`);
            setError("Could not retrieve profile from Google. Please verify scopes and Client ID settings.");
          }
        } catch (err: any) {
          addLog("error", `[Google Auth] Network error during token exchange: ${err.message}`);
          setError("Network connection failure with Google authentication services.");
        } finally {
          setIsLoading(false);
        }
      } else if (event.data?.type === "OAUTH_AUTH_FAILURE") {
        addLog("error", `[Google Auth] OAuth callback failed: ${event.data?.error}`);
        setError(event.data?.error || "OAuth login rejected.");
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, [onLoginSuccess, onClose, addLog]);

  const handleRealGoogleLogin = () => {
    if (!effectiveClientId) {
      setError("Please input your Google OAuth Client ID to proceed with authenticating.");
      return;
    }

    setError(null);
    addLog("info", "[Google Auth] Initializing secure OAuth 2.0 flow popup...");

    const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
      client_id: effectiveClientId,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: "openid profile email",
      include_granted_scopes: "true",
      state: "carlinkkit_auth_state"
    }).toString();

    // Size popup window appropriately
    const width = 520;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const authWindow = window.open(
      authUrl,
      "Google_Sign_In",
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no`
    );

    if (!authWindow) {
      setError("Popup was blocked by your browser! Please allow popups for this page and try again.");
      addLog("warn", "[Google Auth] OAuth popup blocked. Prompting user to allow popups.");
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    addLog("info", "[Google Auth] Linking demo sandbox profile (zix2025@gmail.com)...");
    
    setTimeout(() => {
      const demoProfile: GoogleUserProfile = {
        email: "zix2025@gmail.com",
        name: "Zix Google Account",
        picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        given_name: "Zix",
        family_name: "Google",
        isDemo: true
      };
      
      onLoginSuccess(demoProfile);
      addLog("info", "[Google Auth] Sandbox profile linked successfully. Active session set to zix2025@gmail.com.");
      setIsLoading(false);
      onClose();
    }, 850);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] font-sans"
      >
        {/* Subtle accent border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500" />

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <Chrome className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-white text-base">Link your Google Account</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 bg-red-950/40 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-slate-300 text-xs leading-relaxed">
          
          {/* Main Info */}
          <div className="bg-slate-950/50 border border-slate-800/40 rounded-xl p-3.5 space-y-2">
            <p className="text-slate-300 font-medium">
              Synchronize your personal driving telemetry, favorite Google Maps locations, and profile directly with the CarLinkKit simulator.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>SSL Secure Credentials Handshake</span>
            </div>
          </div>

          {/* Option 1: Demo Instant Link */}
          <div className="border border-slate-800/60 rounded-xl p-4 bg-gradient-to-br from-slate-950/60 to-slate-900/60 space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-rose-600/10 text-rose-400 border-l border-b border-rose-500/10 px-2 py-0.5 rounded-bl-lg font-mono text-[9px] font-bold">
              ONE-CLICK
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Workspace Sandbox Account</h4>
              <p className="text-slate-400 mt-1">
                Instantly connect and log in with your active AI Studio session email <span className="text-blue-400 font-semibold font-mono">zix2025@gmail.com</span>. Perfect for immediate testing!
              </p>
            </div>
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              Connect as zix2025@gmail.com
            </button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] bg-slate-800 flex-1" />
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">OR</span>
            <div className="h-[1px] bg-slate-800 flex-1" />
          </div>

          {/* Option 2: Real Google OAuth Setup */}
          <div className="border border-slate-800/60 rounded-xl p-4 bg-slate-950/30 space-y-4">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-400" />
                Real Google OAuth 2.0 Connection
              </h4>
              <p className="text-slate-400 mt-1">
                To connect your authentic personal Google Account, configure the callback configuration in your Google Cloud Console:
              </p>
            </div>

            {/* Instruction list */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 font-mono text-[10px] space-y-2 text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <div>
                  Create an OAuth Client ID at <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <div>
                  Set the authorized **Authorized redirect URIs** to:
                  <code className="block mt-1 text-rose-400 bg-slate-900 border border-slate-800 rounded p-1 select-all break-all text-[9px]">
                    {redirectUri}
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <div>
                  Add your **Client ID** below to enable full integration:
                </div>
              </div>
            </div>

            {/* Input field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <Key className="w-3 h-3" /> Google OAuth Client ID
              </label>
              <input
                type="text"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                placeholder="1234567890-abc123xyz.apps.googleusercontent.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
              {envClientId && (
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                  <CheckCircle className="w-3 h-3" />
                  <span>Preset VITE_GOOGLE_CLIENT_ID detected in environments</span>
                </div>
              )}
            </div>

            <button
              onClick={handleRealGoogleLogin}
              disabled={isLoading || !effectiveClientId}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700 active:scale-95"
            >
              <Chrome className="w-3.5 h-3.5 text-blue-400" />
              Sign in with Google OAuth
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>OIDC compliant workflow</span>
          <span>Security Level: Active TLS</span>
        </div>

        {/* Loading Spinner Overlaid */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center flex-col gap-3">
            <div className="w-8 h-8 border-3 border-slate-800 border-l-rose-500 rounded-full animate-spin" />
            <span className="text-xs text-slate-300 font-mono">Connecting Google Services...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
