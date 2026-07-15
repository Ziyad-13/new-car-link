export interface DongleSettings {
  syncMode: "compatible" | "normal";
  background: "normal" | "dark" | "black";
  audioDelay: number; // ms
  mediaDelay: number; // ms
  fps: 30 | 60;
  resolution: "auto" | "800x480" | "1280x720" | "1920x1080";
  autoConnect: boolean;
  gps: "car" | "phone";
  microphone: "car" | "box";
  videoDecoding: "hardware" | "software";
  workMode: "carplay" | "androidauto";
  wiredConnection: boolean;
  screenLayout: "golden" | "split" | "immersive";
  wifiBand: "2.4GHz" | "5.0GHz" | "5.8GHz";
  wifiChannel: "auto" | "36" | "44" | "149" | "161";
  audioFormat: "aac" | "pcm";
  videoBitrate: "auto" | "4mbps" | "8mbps" | "12mbps";
}

export interface DeviceStatus {
  connectionState: "disconnected" | "pairing" | "connected_dongle" | "connected_phone";
  dongleModel: string;
  softwareVersion: string;
  hardwareVersion: string;
  sdkVersion: string;
  wifiSsid: string;
  wifiIp: string;
  bluetoothName: string;
  carBrand: string;
  carModel: string;
  carYear: string;
  cpuUsage: number;
  memoryUsage: number;
  temperature: number; // °C
  wifiSignal: number; // dBm, e.g. -45 to -90
}

export interface DiagnosticLog {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "connection" | "audio" | "video" | "upgrade" | "general";
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  isDemo?: boolean;
}
