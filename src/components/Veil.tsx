import React from "react";
import { CarState, ComponentActions } from "../types";
import { DynamicIcon } from "./DynamicIcon";
import { Wifi, SkipBack, Play, Pause, SkipForward, Navigation, Music, Phone, MessageCircle, Settings, RotateCw } from "lucide-react";
import { Map } from "@vis.gl/react-google-maps";

interface Props {
  state: CarState;
  actions: ComponentActions;
}

export default function Veil({ state, actions }: Props) {
  const isNight = state.isNight;
  const isBooting = state.bootStates.veil;
  const { speed, time, date, etaTime, currentTrack, currentSource, isPlaying, destinations } = state;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center text-zinc-500 text-sm px-2">
        <span className="font-bold tracking-widest text-zinc-400">2B / VEIL</span>
        <button onClick={() => actions.reboot('veil')} className="hover:text-white transition flex items-center gap-1">
          <RotateCw size={14} /> Replay Boot
        </button>
      </div>

      <div 
        className={`screen font-outfit ${isNight ? 'theme-veil-night' : 'theme-veil-day'}`} 
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        {isBooting ? (
          <div className="boot-overlay" style={{ background: 'var(--bg)' }}>
            <div className="w-3 h-3 rounded-full mb-6 animate-dot" style={{ background: 'var(--accent)' }}></div>
            <h1 className="text-4xl font-light tracking-[0.2em] animate-track">CARLINKKIT</h1>
            <p className="text-[10px] tracking-[0.3em] mt-8 uppercase font-medium animate-fade-in" style={{ color: 'var(--sub)' }}>
              Navigation First
            </p>
          </div>
        ) : (
          <div className="w-full h-full relative overflow-hidden">
            {/* Map Full Bleed */}
            <div className="absolute inset-0">
              <Map
                defaultCenter={{lat: 24.7136, lng: 46.6753}}
                defaultZoom={13}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{width: '100%', height: '100%'}}
                disableDefaultUI={true}
                colorScheme={isNight ? 'DARK' : 'LIGHT'}
              />
            </div>
            
            {/* Left Overlays */}
            <div className="absolute top-6 left-6 flex gap-3">
              <div className="glass-panel px-4 py-2.5 rounded-full text-[11px] font-medium tracking-widest uppercase flex items-center">CarLinkKit</div>
              <div className="glass-panel w-64 h-10 rounded-full flex items-center px-4 cursor-pointer">
                <DynamicIcon name="search" size={16} style={{ color: 'var(--sub)' }} />
                <span className="ml-3 text-[13px]" style={{ color: 'var(--sub)' }}>Search destination...</span>
              </div>
            </div>
            
            <div className="absolute bottom-6 left-6 flex flex-col gap-3">
              <div className="glass-panel px-5 py-3 rounded-[16px] self-start">
                <div className="text-lg font-medium" style={{ color: 'var(--accent)' }}>{etaTime}</div>
                <div className="text-[13px] mt-0.5" style={{ color: 'var(--sub)' }}>Arriving Home</div>
              </div>
              <div className="flex gap-2">
                {destinations.map(d => (
                  <button key={d.name} className="glass-panel px-4 py-2 rounded-full text-[12px] font-medium flex items-center gap-2 active:scale-95 transition">
                    <DynamicIcon name={d.icon} size={16} style={{ color: 'var(--accent)' }} /> {d.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Glass Stack (286px) */}
            <div className="absolute top-6 right-6 bottom-6 w-[286px] flex flex-col gap-3">
              {/* Clock Card */}
              <div className="glass-panel rounded-[20px] p-5 flex justify-between items-center">
                <div>
                  <div className="text-2xl font-light">{time}</div>
                  <div className="text-[11px] font-medium tracking-widest mt-1 uppercase" style={{ color: 'var(--sub)' }}>{date}</div>
                </div>
                <div className="flex flex-col items-end gap-2" style={{ color: 'var(--sub)' }}>
                  <Wifi size={16} />
                  <button onClick={actions.toggleSource} className="text-[10px] font-medium tracking-widest uppercase hover:text-[var(--ink)] transition">
                    {currentSource}
                  </button>
                </div>
              </div>
              
              {/* Speed Card */}
              <div className="glass-panel rounded-[20px] p-6 flex flex-col items-center justify-center flex-1">
                <div className="text-[68px] font-[200] leading-none">{speed}</div>
                <div className="text-[11px] font-medium tracking-[0.2em] mt-3 uppercase" style={{ color: 'var(--sub)' }}>km/h</div>
              </div>

              {/* Media Card */}
              <div className="glass-panel rounded-[20px] p-5">
                <div className="flex items-center gap-4">
                  <img src={currentTrack.cover} className="w-12 h-12 rounded-[12px] object-cover shrink-0" alt="Album art" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[14px] font-medium">{currentTrack.title}</div>
                    <div className="truncate text-[12px] mt-0.5" style={{ color: 'var(--sub)' }}>{currentTrack.artist}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-5 px-2">
                  <button onClick={actions.prevTrack}><SkipBack size={20} /></button>
                  <button onClick={actions.togglePlay} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 active:scale-95 transition">
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </button>
                  <button onClick={actions.nextTrack}><SkipForward size={20} /></button>
                </div>
              </div>

              {/* Apps Strip */}
              <div className="glass-panel rounded-full h-[60px] px-6 flex justify-between items-center shrink-0">
                <Navigation size={20} style={{ color: 'var(--accent)' }} />
                <Music size={20} style={{ color: 'var(--sub)' }} />
                <Phone size={20} style={{ color: 'var(--sub)' }} />
                <MessageCircle size={20} style={{ color: 'var(--sub)' }} />
                <Settings size={20} style={{ color: 'var(--sub)' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
