import { Track, Destination } from "./types";

export const tracks: Track[] = [
  { title: "Golden Hour", artist: "Kacey Musgraves", cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150" },
  { title: "Tidewater", artist: "Lomelda", cover: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&q=80&w=150&h=150" },
  { title: "Palo Verde", artist: "Devendra Banhart", cover: "https://images.unsplash.com/photo-1453227588063-bb302b62f50b?auto=format&fit=crop&q=80&w=150&h=150" }
];

export const sources = ["Bluetooth", "USB", "FM"];

export const destinations: Destination[] = [
  { name: 'Home', icon: 'home' },
  { name: 'Work', icon: 'briefcase' },
  { name: 'Fuel', icon: 'fuel' }
];
