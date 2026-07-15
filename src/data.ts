import { DongleSettings, DeviceStatus, FAQItem, DiagnosticLog } from "./types";

export const DEFAULT_SETTINGS: DongleSettings = {
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
};

export const INITIAL_STATUS: DeviceStatus = {
  connectionState: "connected_phone",
  dongleModel: "Carlinkit 5.0 (2air)",
  softwareVersion: "U2W_2026.05.12.1842",
  hardwareVersion: "U2W-V4.0-A",
  sdkVersion: "v5.2.4-build902",
  wifiSsid: "AutoKit_4FA2_5G",
  wifiIp: "192.168.50.2",
  bluetoothName: "AutoKit_4FA2",
  carBrand: "Toyota",
  carModel: "Camry SE",
  carYear: "2023",
  cpuUsage: 14,
  memoryUsage: 38,
  temperature: 42,
  wifiSignal: -52,
};

export const FAQ_DATABASE: FAQItem[] = [
  {
    id: "faq-1",
    question: "Why is there an audio delay when playing music or videos?",
    answer: "Wireless transmission introduces a small transmission lag. By default, Carlinkit buffers audio to prevent stuttering. You can decrease 'Audio Delay' or 'Media Delay' in the Settings tab to 500ms-800ms for faster response, or increase it to 1500ms if you experience audio cutting out.",
    category: "audio",
  },
  {
    id: "faq-2",
    question: "My device keeps disconnecting. How can I fix this?",
    answer: "Frequent disconnections are usually caused by wireless channel interference or weak USB power. Try setting 'Sync Mode' to 'Compatible', choosing a different Wi-Fi channel (if supported by your car), or using a high-quality double-shielded USB cable.",
    category: "connection",
  },
  {
    id: "faq-3",
    question: "The screen is black, but touch and audio are working. Why?",
    answer: "This is usually a resolution or decoding handshake issue. Change 'Video Decoding' from 'Hardware' to 'Software', or manually select a fixed 'Resolution' (e.g., 1280x720) instead of 'Auto' in the settings.",
    category: "video",
  },
  {
    id: "faq-4",
    question: "How do I upgrade the firmware?",
    answer: "Connect your phone to the Carlinkit Wi-Fi network (AutoKit_XXXX), open your mobile browser, and go to '192.168.50.2'. Go to the 'Firmware' tab and click 'Check for Updates'. Ensure your car engine is running and do not power off the device during an upgrade.",
    category: "upgrade",
  },
  {
    id: "faq-5",
    question: "Can I use Siri or Google Assistant with this dongle?",
    answer: "Yes, both CarPlay and Android Auto fully support steering wheel microphone controls. If the assistant doesn't hear you, toggle the 'Microphone' setting from 'Car' to 'Box' or vice versa depending on your car's system architecture.",
    category: "general",
  },
];

export const SAMPLE_LOGS: DiagnosticLog[] = [
  { timestamp: "17:23:01.042", level: "info", message: "Kernel boot successful. CPU architecture: ARMv7" },
  { timestamp: "17:23:01.215", level: "info", message: "Initializing USB host controller..." },
  { timestamp: "17:23:02.110", level: "info", message: "USB device detected: Car OEM Head Unit (Toyota Motor Corp)" },
  { timestamp: "17:23:02.324", level: "info", message: "Launching CarPlay protocol interface v5.2" },
  { timestamp: "17:23:02.805", level: "info", message: "Wi-Fi Access Point 'AutoKit_4FA2_5G' started on Channel 149" },
  { timestamp: "17:23:03.112", level: "info", message: "Bluetooth Advertising enabled on name 'AutoKit_4FA2'" },
  { timestamp: "17:23:05.449", level: "info", message: "Incoming Bluetooth connection from iPhone (Ziyad's iPhone)" },
  { timestamp: "17:23:06.102", level: "info", message: "Bluetooth handshake completed. Passing Wi-Fi credentials..." },
  { timestamp: "17:23:08.513", level: "info", message: "Wi-Fi client connected: 192.168.50.150" },
  { timestamp: "17:23:09.120", level: "info", message: "Establishing virtual display tunnel (1280x720 @ 60 FPS)" },
  { timestamp: "17:23:09.614", level: "info", message: "Audio buffer stream initialized. Target latency: 1000ms" },
  { timestamp: "17:23:10.025", level: "info", message: "CarPlay launcher handshake successful. Mirroring started." },
];
