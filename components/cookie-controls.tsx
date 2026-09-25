"use client";
import {useEffect,useRef,useState} from "react";
import {Maximize,Minimize,Music2,Volume2,VolumeX,BellRing,BellOff,Zap,SkipForward} from "lucide-react";
import {createJacuzziMusicEngine,JACUZZI_MUSIC_TRACKS,type JacuzziTrackId} from "@/lib/cookie-ambient-music";
import {createCookieMusic,type CookieMusic} from "@/lib/cookie-music";
import {createEnergyMusic,ENERGY_MUSIC_TRACKS,type EnergyTrackId} from "@/lib/cookie-energy-music";
const SETS=[{id:"energy",name:"Super dynamique",first:"energy-mix"},{id:"calm",name:"Calme",first:"cosmic-lounge"},{id:"radio",name:"Radio du Jacuzzi",first:"radio"}] as const;
const energyIds=new Set<string>(ENERGY_MUSIC_TRACKS.map(t=>t.id));
const validTrack=(id:unknown):id is string=>typeof id==="string"&&(id==="energy-mix"||id==="radio"||energyIds.has(id)||JACUZZI_MUSIC_TRACKS.some(t=>t.id===id));
const setFor=(id:string)=>id==="radio"?"radio":id==="energy-mix"||energyIds.has(id)?"energy":"calm";
type Playback="off"|"starting"|"playing"|"paused";
export function CookieControls({soundsEnabled,onToggleSounds}:{soundsEnabled:boolean;onToggleSounds:()=>void}){
 const [full,setFull]=useState(false),[playback,setPlayback]=useState<Playback>("off"),[choice,setChoice]=useState("energy-mix"),[volume,setVolume]=useState(30),[error,setError]=useState(""),[track,setTrack]=useState(""),[rhythmPlaying,setRhythmPlaying]=useState(false);
 const settings=useRef<HTMLDetailsElement>(null);
 const sound=useRef<CookieMusic|null>(null),loadedChoice=useRef(""),native=useRef(false),alive=useRef(true),request=useRef(0),scroll=useRef(0),button=useRef<HTMLButtonElement>(null),state=useRef<Playback>("off"),rhythm=useRef(false),resumeAfterRhythm=useRef(false);
 const markState=(next:Playback)=>{state.current=next;if(alive.current)setPlayback(next);};
 const leave=()=>{setFull(false);if(native.current&&document.fullscreenElement)void document.exitFullscreen().catch(()=>{});native.current=false;};
 const toggleFull=()=>{if(full){leave();return;}scroll.current=window.scrollY;setFull(true);if(!document.fullscreenElement&&document.documentElement.requestFullscreen)void document.documentElement.requestFullscreen().then(()=>{if(alive.current)native.current=true;else if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});}).catch(()=>{});};
 useEffect(()=>{if(!full)return;document.body.classList.add("cookie-fullscreen");window.scrollTo({top:0,behavior:"instant"});const onChange=()=>{if(native.current&&!document.fullscreenElement){native.current=false;setFull(false);}};const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"&&!e.defaultPrevented&&!document.querySelector('[role="dialog"]'))leave();};document.addEventListener("fullscreenchange",onChange);document.addEventListener("keydown",onKey);return()=>{document.body.classList.remove("cookie-fullscreen");document.removeEventListener("fullscreenchange",onChange);document.removeEventListener("keydown",onKey);window.scrollTo({top:scroll.current,behavior:"instant"});button.current?.focus({preventScroll:true});};},[full]);
 useEffect(()=>{
  alive.current=true;try{const saved=JSON.parse(localStorage.getItem("jacuzzi-music-preferences")||"{}");if(saved.libraryVersion===2&&validTrack(saved.track))setChoice(saved.track);if(Number.isFinite(saved.volume))setVolume(Math.max(0,Math.min(100,saved.volume)));}catch{}
  const visibility=()=>{if(document.hidden){request.current++;sound.current?.pause();if(state.current==="playing"||state.current==="starting")markState("paused");resumeAfterRhythm.current=false;}};
  const rhythmEvent=(e:Event)=>{const playing=(e as CustomEvent<boolean>).detail===true;if(playing===rhythm.current)return;rhythm.current=playing;setRhythmPlaying(playing);if(playing){resumeAfterRhythm.current=state.current==="playing"||state.current==="starting";request.current++;sound.current?.pause();if(state.current==="playing"||state.current==="starting")markState("paused");}else if(resumeAfterRhythm.current){resumeAfterRhythm.current=false;const player=sound.current;if(player&&!document.hidden&&state.current==="paused"){const token=++request.current;markState("starting");void player.resume().then(()=>{if(!alive.current||token!==request.current||sound.current!==player)return;if(rhythm.current||document.hidden){player.pause();markState("paused");}else markState("playing");}).catch(()=>{if(alive.current&&token===request.current&&sound.current===player)markState("paused");});}}};
  document.addEventListener("visibilitychange",visibility);window.addEventListener("cookie-rhythm-playing",rhythmEvent);
  return()=>{alive.current=false;request.current++;sound.current?.stop();sound.current=null;document.removeEventListener("visibilitychange",visibility);window.removeEventListener("cookie-rhythm-playing",rhythmEvent);document.body.classList.remove("cookie-fullscreen");if(native.current&&document.fullscreenElement)void document.exitFullscreen().catch(()=>{});};
 },[]);
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(settings.current?.open&&!settings.current.contains(e.target as Node))settings.current.open=false;};document.addEventListener("pointerdown",outside);return()=>document.removeEventListener("pointerdown",outside);},[]);
 const remember=(selected:string,v:number)=>{try{localStorage.setItem("jacuzzi-music-preferences",JSON.stringify({libraryVersion:2,track:selected,volume:v}));}catch{}};
 const play=async(selected=choice)=>{
  if(state.current==="starting"||rhythm.current)return;setError("");remember(selected,volume);const token=++request.current;markState("starting");let player:CookieMusic|null=null,reused=false;
  const announce=(name:string)=>{if(alive.current)setTrack(name);};
  try{
   if(sound.current&&loadedChoice.current===selected){player=sound.current;reused=true;await player.resume();}
   else{
    sound.current?.stop();sound.current=null;
    if(selected==="radio")player=await createCookieMusic(volume/100,announce);
    else if(selected==="energy-mix"||energyIds.has(selected))player=await createEnergyMusic(volume/100,announce,selected==="energy-mix"?undefined:selected as EnergyTrackId);
    else{const engine=createJacuzziMusicEngine({onStateChange:next=>{if(next==="paused"&&alive.current&&sound.current===player&&state.current==="playing")markState("paused");}});player={setVolume:v=>engine.setVolume(v),pause:()=>engine.pause(),resume:()=>engine.resume(),stop:()=>engine.dispose()};await engine.start(selected as JacuzziTrackId,volume/100);announce(JACUZZI_MUSIC_TRACKS.find(t=>t.id===selected)?.name??"");}
   }
   if(!alive.current||token!==request.current){if(!reused)player.stop();return;}
   sound.current=player;loadedChoice.current=selected;
   if(document.hidden||rhythm.current){player.pause();markState("paused");}else markState("playing");
  }catch{if(!reused||token===request.current)player?.stop();if(alive.current&&token===request.current){sound.current=null;markState("off");setError("La musique n’a pas pu démarrer. Réessaie.");}}
 };
 const toggleMusic=()=>{resumeAfterRhythm.current=false;if(state.current==="playing"){sound.current?.pause();markState("paused");}else void play();};
 const chooseMusic=(selected:string)=>{if(state.current==="starting"||rhythm.current)return;const wasPlaying=state.current==="playing";request.current++;sound.current?.stop();sound.current=null;loadedChoice.current="";setChoice(selected);remember(selected,volume);setTrack("");markState("off");if(wasPlaying)void play(selected);};
 const set=setFor(choice),energy=ENERGY_MUSIC_TRACKS.find(t=>t.id===choice),calm=JACUZZI_MUSIC_TRACKS.find(t=>t.id===choice),playing=playback==="playing",starting=playback==="starting",disabled=starting||rhythmPlaying;
 const description=choice==="energy-mix"?"4 morceaux · 148–174 BPM · enchaînement automatique":choice==="radio"?"Les 4 morceaux originaux en lecture continue.":energy?energy.description:calm?.description??"";
 const nextTrack=()=>{const songs=set==="energy"?ENERGY_MUSIC_TRACKS:JACUZZI_MUSIC_TRACKS;const at=songs.findIndex(t=>t.id===choice||(choice==="energy-mix"&&t.name===track));chooseMusic(songs[(at+1)%songs.length].id);};
 return <div className="cookie-controls"><div className="cookie-control-buttons">
  <button ref={button} className="button secondary cookie-fullscreen-button" aria-label={full?"Quitter le plein écran":"Plein écran"} title={full?"Quitter le plein écran (Échap)":"Plein écran"} aria-pressed={full} onClick={toggleFull}>{full?<Minimize size={17}/>:<Maximize size={17}/>}<span className="cookie-control-label">{full?"Quitter":"Plein écran"}</span></button>
  <button className={"button secondary cookie-music-button "+(playing?"playing":"")} aria-pressed={playing} disabled={disabled} onClick={toggleMusic} aria-label={playing?"Mettre la musique en pause":playback==="paused"?"Reprendre la musique":"Activer la musique"}>{playing?<Music2 size={17}/>:<VolumeX size={17}/>}<span className="cookie-control-label">{starting?"Chargement…":rhythmPlaying?"Pause pendant le défi":playing?"Musique en cours":playback==="paused"?"Reprendre la musique":"Écouter la musique"}</span>{playing&&<span className="music-equalizer" aria-hidden="true"><i/><i/><i/></span>}</button>
  <button className="button secondary cookie-sounds-button" onClick={onToggleSounds} aria-pressed={soundsEnabled} aria-label={soundsEnabled?"Couper les effets sonores":"Activer les effets sonores"} title={soundsEnabled?"Effets sonores activés":"Effets sonores coupés"}>{soundsEnabled?<BellRing size={17}/>:<BellOff size={17}/>}<span className="sr-only">Effets sonores</span></button>
 </div><details ref={settings} className="music-settings" onKeyDown={e=>{if(e.key==="Escape"&&settings.current?.open){e.preventDefault();e.stopPropagation();settings.current.open=false;settings.current.querySelector("summary")?.focus();}}}><summary aria-label="Réglages audio"><Music2 size={16}/><span>{playing?track:SETS.find(s=>s.id===set)?.name}</span><span className="music-settings-action">Réglages</span></summary><div className={"cookie-music-library music-set-"+set}>
  <label className="music-set-select">{set==="energy"?<Zap size={16}/>:<Music2 size={16}/>}<span className="sr-only">Set musical</span><select aria-label="Set musical" value={set} disabled={disabled} onChange={e=>chooseMusic(SETS.find(s=>s.id===e.target.value)!.first)}>{SETS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
  {set!=="radio"&&<label className="music-track-select"><span className="sr-only">Morceau</span><select aria-label="Morceau" value={choice} disabled={disabled} onChange={e=>chooseMusic(e.target.value)}>{set==="energy"?<><option value="energy-mix">Tout le set · 4 morceaux</option>{ENERGY_MUSIC_TRACKS.map(t=><option key={t.id} value={t.id}>{t.name} · {t.bpm} BPM</option>)}</>:JACUZZI_MUSIC_TRACKS.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
  {set!=="radio"&&<button className="music-next" aria-label="Morceau suivant" title="Morceau suivant" disabled={disabled} onClick={nextTrack}><SkipForward size={17}/></button>}
  <label className="cookie-volume"><Volume2 size={15}/><span className="sr-only">Volume de la musique</span><input aria-label="Volume de la musique" type="range" min="0" max="100" step="5" value={volume} disabled={starting} onChange={e=>{const v=Number(e.target.value);setVolume(v);remember(choice,v);sound.current?.setVolume(v/100);}}/><output>{volume}%</output></label>
  <small>{rhythmPlaying?"La musique laisse place au défi rythmique.":playback==="playing"?"À l’écoute · "+track:playback==="paused"?"En pause · "+(track||SETS.find(s=>s.id===set)?.name):description}</small>
 </div></details>{error&&<p role="status" className="form-error">{error}</p>}</div>;
}
