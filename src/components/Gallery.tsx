import React from "react";
import { CarState, ComponentActions } from "../types";
import { DynamicIcon } from "./DynamicIcon";
import { Bluetooth, RotateCw, SkipBack, Play, Pause, SkipForward, Navigation } from "lucide-react";
import { Map } from "@vis.gl/react-google-maps";

interface Props {
  state: CarState;
  actions: ComponentActions;
}

export default function Gallery({ state, actions }: Props) {
  const isNight = state.isNight;
  const isBooting = state.bootStates.gallery;
  const { speed, time, etaTime, currentTrack, currentSource, isPlaying, galleryTab } = state;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center text-zinc-500 text-sm px-2">
        <span className="font-bold tracking-widest text-zinc-400">1A / GALLERY</span>
        <button onClick={() => actions.reboot('gallery')} className="hover:text-white transition flex items-center gap-1">
          <RotateCw size={14} /> Replay Boot
        </button>
      </div>

      <div 
        className={`screen font-sans ${isNight ? 'theme-porcelain-night' : 'theme-porcelain-day'}`} 
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        {isBooting ? (
          <div className="boot-overlay" style={{ background: 'var(--bg)' }}>
            <h1 className="font-serif text-5xl animate-track">CarLinkKit</h1>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            {/* Header 60px */}
            <div className="h-[60px] flex px-8 border-b" style={{ borderColor: 'var(--line)' }}>
              <div className="flex gap-8 h-full">
                {['HOME', 'MEDIA', 'NAV'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => actions.setGalleryTab?.(tab)} 
                    className="h-full relative text-[11px] font-bold tracking-[0.15em] transition" 
                    style={{ color: galleryTab === tab ? 'var(--ink)' : 'var(--sub)' }}
                  >
                    {tab}
                    {galleryTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'var(--ink)' }}></div>
                    )}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-6 text-[12px] font-medium" style={{ color: 'var(--sub)' }}>
                <Bluetooth size={16} />
                <span>{time}</span>
              </div>
            </div>
            
            {/* Content 420px */}
            <div className="flex-1 relative overflow-hidden">
              {/* HOME Tab */}
              {galleryTab === 'HOME' && (
                <div className="absolute inset-0 p-10 flex">
                  <div className="w-[40%] flex flex-col justify-center">
                    <div className="font-serif leading-none" style={{ fontSize: 148, marginLeft: -8 }}>{speed}</div>
                    <div className="text-[13px] font-semibold tracking-widest mt-2" style={{ color: 'var(--sub)' }}>KM/H</div>
                  </div>
                  <div className="w-[60%] flex flex-col gap-6">
                    <div className="flex gap-4">
                       <div className="flex-1 p-5 rounded-[16px] shadow-sm flex items-center gap-4 cursor-pointer active:scale-95 transition" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                         <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--map)', color: 'var(--accent)' }}>
                           <Navigation size={20} />
                         </div>
                         <div className="min-w-0">
                           <div className="font-semibold text-[15px] truncate">{etaTime}</div>
                           <div className="text-[12px] mt-0.5" style={{ color: 'var(--sub)' }}>To Home</div>
                         </div>
                       </div>
                       <div onClick={() => actions.setGalleryTab?.('MEDIA')} className="flex-1 p-5 rounded-[16px] shadow-sm flex items-center gap-4 cursor-pointer active:scale-95 transition" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                         <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-zinc-200 flex-shrink-0">
                           <img src={currentTrack.cover} className="w-full h-full object-cover" alt="Art" />
                         </div>
                         <div className="min-w-0">
                           <div className="font-semibold text-[14px] truncate">{currentTrack.title}</div>
                           <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--sub)' }}>{currentTrack.artist}</div>
                         </div>
                       </div>
                    </div>
                    <div className="flex-1 rounded-[16px] shadow-sm p-6 grid grid-cols-3 gap-y-6" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                      {['phone', 'message-square', 'radio', 'calendar', 'settings', 'grid-2x2'].map(icon => (
                        <div key={icon} className="flex flex-col items-center justify-center gap-2 cursor-pointer transition hover:scale-110 active:scale-95" style={{ color: 'var(--ink)' }}>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center border" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
                            <DynamicIcon name={icon} size={20} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* MEDIA Tab */}
              {galleryTab === 'MEDIA' && (
                <div className="absolute inset-0 p-8 flex items-center gap-12">
                  <div className="w-[260px] h-[260px] rounded-[24px] overflow-hidden shadow-xl bg-zinc-200 flex-shrink-0 border" style={{ borderColor: 'var(--line)' }}>
                    <img src={currentTrack.cover} className="w-full h-full object-cover" alt="Art" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="font-serif text-[46px] leading-tight">{currentTrack.title}</div>
                    <div className="text-lg mt-2 font-medium" style={{ color: 'var(--sub)' }}>{currentTrack.artist}</div>
                    
                    <div className="mt-10 mb-8">
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--line)' }}>
                        <div className="h-full rounded-full" style={{ background: 'var(--accent)', width: '34%' }}></div>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold tracking-widest mt-3" style={{ color: 'var(--sub)' }}>
                        <span>1:24</span><span>3:42</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <button onClick={actions.toggleSource} className="px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.15em] uppercase border transition active:scale-95" style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>{currentSource}</button>
                      <div className="ml-auto flex items-center gap-6">
                        <button onClick={actions.prevTrack} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"><SkipBack size={24} /></button>
                        <button onClick={actions.togglePlay} className="w-16 h-16 rounded-full flex items-center justify-center shadow-md text-white transition active:scale-95" style={{ background: 'var(--accent)' }}>
                          {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                        </button>
                        <button onClick={actions.nextTrack} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"><SkipForward size={24} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* NAV Tab */}
              {galleryTab === 'NAV' && (
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
