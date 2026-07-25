import React from "react";
import { CarState, ComponentActions } from "../types";
import { DynamicIcon } from "./DynamicIcon";
import { Navigation, Play, Pause, Home, Map, Music, Sun, Moon, RotateCw } from "lucide-react";

interface Props {
  state: CarState;
  actions: ComponentActions;
}

export default function Horizon({ state, actions }: Props) {
  const isNight = state.isNight;
  const isBooting = state.bootStates.horizon;
  const { speed, etaTime, currentTrack, isPlaying } = state;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center text-zinc-500 text-sm px-2">
        <span className="font-bold tracking-widest text-zinc-400">1B / HORIZON</span>
        <button onClick={() => actions.reboot('horizon')} className="hover:text-white transition flex items-center gap-1">
          <RotateCw size={14} /> Replay Boot
        </button>
      </div>

      <div 
        className={`screen font-outfit ${isNight ? 'theme-horizon-night' : 'theme-horizon-day'}`} 
        style={{ background: 'var(--bg-grad)', color: 'var(--ink)' }}
      >
        {isBooting ? (
          <div className="boot-overlay" style={{ background: 'var(--bg-grad)' }}>
            <h1 className="text-4xl font-light tracking-[0.2em] animate-track">CARLINKKIT</h1>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {/* 196px ultra light speed bottom-left */}
            <div className="absolute bottom-4 left-10">
              <div className="text-[196px] font-[200] leading-none tracking-tighter">{speed}</div>
              <div className="text-[12px] font-medium tracking-[0.3em] uppercase ml-4 -mt-2" style={{ color: 'var(--sub)' }}>km/h</div>
            </div>
            
            {/* Top-Right Glass Shortcut */}
            <div className="absolute top-8 right-8 glass-panel rounded-full px-5 py-3 flex items-center gap-4 cursor-pointer active:scale-95 transition">
              <Navigation size={16} style={{ color: 'var(--accent)' }} />
              <div className="text-[13px] font-medium">{etaTime} <span style={{ color: 'var(--sub)' }}>Home</span></div>
            </div>
            
            {/* Center-ish Circular App Row */}
            <div className="absolute top-[160px] right-12 flex gap-4">
              {['phone', 'message-circle', 'settings'].map(icon => (
                <div key={icon} className="w-14 h-14 rounded-full glass-panel flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition">
                  <DynamicIcon name={icon} size={20} style={{ color: 'var(--ink)' }} />
                </div>
              ))}
            </div>

            {/* Mini-player */}
            <div className="absolute top-[240px] right-12 glass-panel w-[280px] rounded-[24px] p-4 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition">
              <img src={currentTrack.cover} className="w-14 h-14 rounded-full object-cover shrink-0" alt="Art" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-[14px] font-medium">{currentTrack.title}</div>
                <div className="truncate text-[12px] mt-0.5" style={{ color: 'var(--sub)' }}>{currentTrack.artist}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); actions.togglePlay(); }} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 shrink-0 active:scale-95 transition">
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
            </div>
            
            {/* Round Dock Bottom-Right */}
            <div className="absolute bottom-8 right-8 glass-panel rounded-full h-16 px-6 flex items-center gap-6">
              <button className="hover:scale-110 transition"><Home size={20} style={{ color: 'var(--ink)' }} /></button>
              <button className="hover:scale-110 transition"><Map size={20} style={{ color: 'var(--sub)' }} /></button>
              <button className="hover:scale-110 transition"><Music size={20} style={{ color: 'var(--sub)' }} /></button>
              <div className="w-px h-6 bg-black/10 dark:bg-white/10"></div>
              <button onClick={actions.toggleDayNight} className="hover:scale-110 transition active:scale-95">
                {isNight ? <Moon size={20} style={{ color: 'var(--sub)' }} /> : <Sun size={20} style={{ color: 'var(--sub)' }} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
