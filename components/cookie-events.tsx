"use client";
import {useCallback,useEffect,useRef,useState,type CSSProperties} from "react";
import {Cookie,Gift,Sparkles,Flame,Ticket,CloudRain,Hand,Orbit,Wind,ShoppingBag,ArrowUpRight} from "lucide-react";
import {cookieEvent,cookieEventReward,masteryRank,formatCookies,eventDiscount,type EventChoice,type CookiePlayer,EVENT_VISIBLE_MS} from "@/lib/cookie-game";
export function useCookieSounds(){
 const [enabled,setEnabled]=useState(true),context=useRef<AudioContext|null>(null),enabledRef=useRef(true),voices=useRef(new Set<OscillatorNode>());
 enabledRef.current=enabled;
 useEffect(()=>{try{if(localStorage.getItem("jacuzzi-cookie-sounds-v1")==="off")setEnabled(false);}catch{}return()=>{for(const voice of voices.current){try{voice.stop();}catch{}}voices.current.clear();void context.current?.close().catch(()=>{});context.current=null;};},[]);
 const arm=useCallback(()=>{if(!enabledRef.current)return;try{const Audio=window.AudioContext||(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!context.current&&Audio)context.current=new Audio({latencyHint:"interactive"});if(context.current?.state==="suspended")void context.current.resume().catch(()=>{});}catch{}},[]);
 const play=useCallback((kind:"arrival"|"reward")=>{const ctx=context.current;if(!enabledRef.current||!ctx||ctx.state!=="running"||document.hidden)return;const notes=kind==="arrival"?[784,1046,1318]:[523,659,784,1046,1568];notes.forEach((frequency,i)=>{const at=ctx.currentTime+i*.075,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=kind==="arrival"?"sine":"triangle";osc.frequency.setValueAtTime(frequency,at);if(kind==="arrival")osc.frequency.exponentialRampToValueAtTime(frequency*1.06,at+.16);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.065,at+.015);gain.gain.exponentialRampToValueAtTime(.001,at+.28);osc.connect(gain).connect(ctx.destination);voices.current.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();voices.current.delete(osc);};osc.start(at);osc.stop(at+.31);});},[]);
 const toggle=()=>{const next=!enabled;enabledRef.current=next;setEnabled(next);try{localStorage.setItem("jacuzzi-cookie-sounds-v1",next?"on":"off");}catch{}if(next){arm();play("arrival");}else{for(const voice of voices.current){try{voice.stop();}catch{}}}};
 return {enabled,arm,play,toggle};
}
const eventIcons={gift:Gift,cookie:Cookie,comet:Sparkles,rush:Flame,golden:Ticket,rain:CloudRain,gallop:Flame,merchant:ShoppingBag,steam:Wind,crossroads:Orbit};
const entrances={gift:"drop",cookie:"fly",comet:"fly",rush:"rise",golden:"portal",rain:"drop",gallop:"gallop",merchant:"portal",steam:"rise",crossroads:"choice"};
export function CookieFlyby({player,eventAt,now,claiming,blocked,onCatch,onArrive}:{player?:CookiePlayer|null;eventAt?:number;now:number;claiming:boolean;blocked:boolean;onCatch:(at:number,choice?:EventChoice)=>void;onArrive:()=>void}){
 const announced=useRef(0),[hidden,setHidden]=useState(false);
 useEffect(()=>{const visibility=()=>setHidden(document.hidden);visibility();document.addEventListener("visibilitychange",visibility);return()=>document.removeEventListener("visibilitychange",visibility);},[]);
 const visible=!!eventAt&&!hidden&&now>=eventAt&&now<eventAt+EVENT_VISIBLE_MS;
 useEffect(()=>{if(visible&&eventAt&&announced.current!==eventAt){announced.current=eventAt;onArrive();}},[visible,eventAt,onArrive]);
 if(!visible||!eventAt)return null;
 const event=cookieEvent(eventAt,player?.nextEventId),Icon=eventIcons[event.id],seconds=Math.max(0,Math.ceil((eventAt+EVENT_VISIBLE_MS-now)/1000)),reward=player?cookieEventReward(player,eventAt):0;
 const hint=player?(event.effect==="cookies"?"+"+formatCookies(reward)+" cookies":event.effect==="rush"?"Production ×7 pendant "+(event.seconds+3*masteryRank(player,"rush"))+" s":event.hint):event.hint;
 return <div className={"cookie-encounter entrance-"+entrances[event.id]+" event-"+event.id} key={eventAt} style={{"--event-remaining":(seconds/22*100)+"%"} as CSSProperties}>
 <div className="encounter-aura" aria-hidden="true"/>
 {event.effect==="choice"?<section className="encounter-card encounter-choice" aria-label={event.name}>
 <header><span className="encounter-icon"><Icon size={26}/></span><div><small>DEUX ÉTOILES, UN CHOIX · {seconds} s</small><strong>{event.name}</strong></div></header><p>La récolte tranquille ou le grand galop ?</p>
 <div className="encounter-options"><button disabled={blocked} onClick={()=>onCatch(eventAt,"harvest")}><Gift size={21}/><strong>Récolter</strong><span>+{formatCookies(reward)} cookies</span><small>90 s de fours, tout de suite</small></button><button disabled={blocked} onClick={()=>onCatch(eventAt,"burst")}><Hand size={21}/><strong>À toi de jouer</strong><span>Clics manuels ×3</span><small>Pendant 20 s · pilote inchangé</small></button></div><span className="encounter-timer"/>
 </section>:<button className="encounter-card" onClick={()=>onCatch(eventAt)} disabled={blocked} aria-label={"Attraper : "+event.name+". "+hint+"."}>
 <span className="encounter-icon"><Icon size={29}/></span><span className="encounter-copy"><small>{claiming?"SURPRISE RÉCOLTÉE…":"SURPRISE · "+seconds+" s"}</small><strong>{event.name}</strong><span>{hint}</span><b>{event.effect==="discount"?"Ouvrir le portail":event.effect==="steam"?"Réveiller les fours":event.effect==="manual"?"Lancer le galop":"Récolter"}<ArrowUpRight size={13}/></b></span><span className="encounter-timer"/>
 </button>}
 </div>;
}
export function formatBonusTime(ms:number){const seconds=Math.max(0,Math.ceil(ms/1000)),minutes=Math.floor(seconds/60);return minutes>=60?`${Math.floor(minutes/60)} h ${String(minutes%60).padStart(2,"0")}`:minutes?`${minutes} min ${String(seconds%60).padStart(2,"0")} s`:`${seconds} s`;}
export function CookieEventBuffs({player:p,now,onWorkshop,inWorkshop=false}:{player:CookiePlayer;now:number;onWorkshop:()=>void;inWorkshop?:boolean}){
 const b=p.eventBuffs,manual=(b?.manualUntil??0)>now,steam=(b?.steamUntil??0)>now,discount=eventDiscount(p,now),master=(p.trialBoostUntil??0)>now;
 if(!manual&&!steam&&!discount&&!master)return null;
 return <aside className="cookie-event-buffs" aria-label="Bonus actifs">{master&&<span className="trial-boost-active"><Sparkles size={16}/><strong>Maîtrise ×2</strong><span>fours, clics et pilote</span><small>{formatBonusTime(p.trialBoostUntil!-now)}</small></span>}{manual&&<span><Hand size={16}/><strong>Clics manuels ×{b!.manualMultiplier}</strong><small>{formatBonusTime(b!.manualUntil!-now)}</small></span>}{steam&&<span><Wind size={16}/><strong>Fours ×3</strong>{p.rushUntil>now&&<span>Fournée ×7 prioritaire</span>}<small>{formatBonusTime(b!.steamUntil!-now)}</small></span>}{discount&&<span><ShoppingBag size={16}/><strong>Prochain lot −15 %</strong><small>{formatBonusTime(b!.discountUntil!-now)}</small></span>}{!inWorkshop&&<button onClick={onWorkshop}>À l’atelier<ArrowUpRight size={14}/></button>}</aside>;
}
