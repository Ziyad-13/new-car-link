import { LucideIcon } from "lucide-react";

export interface Track {
  title: string;
  artist: string;
  cover: string;
}

export interface Destination {
  name: string;
  icon: string;
}

export interface CarState {
  speed: number;
  time: string;
  etaTime: string;
  date: string;
  isNight: boolean;
  isPlaying: boolean;
  currentTrack: Track;
  currentSource: string;
  destinations: Destination[];
  bootStates: Record<string, boolean>;
  galleryTab: string;
}

export interface ComponentActions {
  toggleDayNight: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleSource: () => void;
  reboot: (key: string) => void;
  rebootAll: () => void;
  setGalleryTab?: (tab: string) => void;
}
