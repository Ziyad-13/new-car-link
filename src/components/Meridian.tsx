import React from "react";
import { CarState, ComponentActions } from "../types";
import { DynamicIcon } from "./DynamicIcon";
import { MapPin, Wifi, SkipBack, Play, Pause, SkipForward, Phone, MessageSquare, Grid2X2, RotateCw } from "lucide-react";
import { Map } from "@vis.gl/react-google-maps";

interface Props {
  state: CarState;
  actions: ComponentActions;
}

export default function Meridian({ state, actions }: Props) {
  const isNight = state.isNight;
  const isBooting = state.bootStates.meridian;
  const { speed, time, date, etaTime, currentTrack, currentSource, isPlaying, destinations } = state;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center text-zinc-500 text-sm px-2">
        <span className="font-bold tracking-widest text-zinc-400">2A / MERIDIAN</span>
        <button onClick={() => actions.reboot('meridian')} className="hover:text-white transition flex items-center gap-1">
          <RotateCw size={14} /> Replay Boot
        </button>
      </div>

      <div 
        className={`screen font-sans ${isNight ? 'theme-porcelain-night' : 'theme-porcelain-day'}`} 
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        {isBooting ? (
          <div className="boot-overlay" style={{ background: 'var(--bg)' }}>
            <div className="h-[1px] bg-[var(--line)] animate-draw mb-6"></div>
            <h1 className="font-serif text-5xl animate-track">CarLinkKit</h1>
            <p className="text-[10px] tracking-[0.3em] mt-8 font-medium animate-fade-in" style={{ color: 'var(--sub)' }}>
              COMPOSED AT 1 : 1.618
            </p>
          </div>
        ) : (
          <div className="w-full h-full flex">
            {/* Map 494px */}
            <div style={{ width: 494, background: 'var(--map)', borderRight: '1px solid var(--line)' }} className="relative overflow-hidden">
              <Map
                defaultCenter={{lat: 24.7136, lng: 46.6753}} /* Riyadh coordinates as an example */
                defaultZoom={13}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{width: '100%', height: '100%'}}
                disableDefaultUI={true}
                colorScheme={isNight ? 'DARK' : 'LIGHT'}
              />
              
              {/* Search pill */}
              <div className="absolute top-6 left-6 right-6 h-12 rounded-full flex items-center px-5 shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                <DynamicIcon name="search" size={20} style={{ color: 'var(--sub)' }} />
                <span className="ml-3 text-sm font-medium" style={{ color: 'var(--sub)' }}>Where to?</span>
              </div>
              
              {/* Dest Chips */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
                <div className="self-start px-4 py-2.5 rounded-[13px] shadow-sm backdrop-blur-md flex flex-col" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>{etaTime} <span className="font-normal" style={{ color: 'var(--sub)' }}>arrival</span></div>
                  <div className="text-sm font-medium mt-0.5">Home · 14 min</div>
                </div>
                <div className="flex gap-2">
                  {destinations.map(d => (
                    <button key={d.name} className="px-4 py-2 rounded-[13px] text-[13px] font-medium flex items-center gap-2 shadow-sm transition active:scale-95" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                      <DynamicIcon name={d.icon} size={16} style={{ color: 'var(--accent)' }} /> {d.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Info 306px */}
            <div style={{ width: 306, background: 'var(--bg)' }} className="flex flex-col">
              {/* Major 296px */}
              <div style={{ height: 296, borderBottom: '1px solid var(--line)' }} className="p-6 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[11px] tracking-[0.2em]" style={{ color: 'var(--sub)' }}>CARLINKKIT</span>
                  <div className="flex gap-2" style={{ color: 'var(--sub)' }}>
                    <MapPin size={16} />
                    <Wifi size={16} />
                  </div>
                </div>
                <div className="text-center flex flex-col items-center justify-center -mt-4">
                  <div className="font-serif leading-none" style={{ fontSize: 84 }}>{speed}</div>
                  <div className="text-[11px] font-semibold tracking-widest mt-1" style={{ color: 'var(--sub)' }}>KM/H</div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="font-serif text-3xl leading-none">{time}</div>
                    <div className="text-[11px] font-medium tracking-wide mt-1.5 uppercase" style={{ color: 'var(--sub)' }}>{date}</div>
                  </div>
                  <div className="text-right text-[10px] tracking-wide" style={{ color: 'var(--sub)' }}>
                    <div className="mb-0.5">Pixel 8</div>
                    <div>CamryNet · 84%</div>
                  </div>
                </div>
              </div>
              
              {/* Minor 184px */}
              <div style={{ height: 184 }} className="p-6 flex flex-col justify-between">
                <div className="flex items-center gap-4">
                  <img src={currentTrack.cover} className="w-[44px] h-[44px] rounded-[10px] object-cover shadow-sm bg-zinc-200 shrink-0" alt="Album Art" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold">{currentTrack.title}</div>
                    <div className="truncate text-xs mt-0.5" style={{ color: 'var(--sub)' }}>{currentTrack.artist}</div>
                  </div>
                  <div className="flex gap-3 shrink-0" style={{ color: 'var(--ink)' }}>
                    <button onClick={actions.prevTrack}><SkipBack size={20} /></button>
                    <button onClick={actions.togglePlay}>
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button onClick={actions.nextTrack}><SkipForward size={20} /></button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <button onClick={actions.toggleSource} className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase border transition active:scale-95" style={{ borderColor: 'var(--line)', color: 'var(--accent)' }}>
                    {currentSource}
                  </button>
                  <div className="flex gap-4" style={{ color: 'var(--ink)' }}>
                    <Phone size={20} />
                    <MessageSquare size={20} />
                    <Grid2X2 size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
