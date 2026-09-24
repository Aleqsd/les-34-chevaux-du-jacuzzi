"use client";
import {useCallback,useEffect,useRef,useState,type CSSProperties} from "react";
import {Cookie,Gift,Sparkles} from "lucide-react";
import {cookieEvent,EVENT_VISIBLE_MS} from "@/lib/cookie-game";
export function useCookieSounds(){
 const [enabled,setEnabled]=useState(true),context=useRef<AudioContext|null>(null),enabledRef=useRef(true),voices=useRef(new Set<OscillatorNode>());
 enabledRef.current=enabled;
 useEffect(()=>{try{if(localStorage.getItem("jacuzzi-cookie-sounds-v1")==="off")setEnabled(false);}catch{}return()=>{for(const voice of voices.current){try{voice.stop();}catch{}}voices.current.clear();void context.current?.close().catch(()=>{});context.current=null;};},[]);
 const arm=useCallback(()=>{if(!enabledRef.current)return;try{const Audio=window.AudioContext||(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!context.current&&Audio)context.current=new Audio({latencyHint:"interactive"});if(context.current?.state==="suspended")void context.current.resume().catch(()=>{});}catch{}},[]);
 const play=useCallback((kind:"arrival"|"reward")=>{const ctx=context.current;if(!enabledRef.current||!ctx||ctx.state!=="running"||document.hidden)return;const notes=kind==="arrival"?[784,1046,1318]:[523,659,784,1046,1568];notes.forEach((frequency,i)=>{const at=ctx.currentTime+i*.075,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=kind==="arrival"?"sine":"triangle";osc.frequency.setValueAtTime(frequency,at);if(kind==="arrival")osc.frequency.exponentialRampToValueAtTime(frequency*1.06,at+.16);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.065,at+.015);gain.gain.exponentialRampToValueAtTime(.001,at+.28);osc.connect(gain).connect(ctx.destination);voices.current.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();voices.current.delete(osc);};osc.start(at);osc.stop(at+.31);});},[]);
 const toggle=()=>{const next=!enabled;enabledRef.current=next;setEnabled(next);try{localStorage.setItem("jacuzzi-cookie-sounds-v1",next?"on":"off");}catch{}if(next){arm();play("arrival");}else{for(const voice of voices.current){try{voice.stop();}catch{}}}};
 return {enabled,arm,play,toggle};
}
export function CookieFlyby({eventAt,now,claiming,blocked,onCatch,onArrive}:{eventAt?:number;now:number;claiming:boolean;blocked:boolean;onCatch:(at:number)=>void;onArrive:()=>void}){
 const announced=useRef(0),flight=useRef({at:0,delay:0}),[hidden,setHidden]=useState(false);
 useEffect(()=>{const visibility=()=>setHidden(document.hidden);visibility();document.addEventListener("visibilitychange",visibility);return()=>document.removeEventListener("visibilitychange",visibility);},[]);
 const visible=!!eventAt&&!hidden&&now>=eventAt&&now<eventAt+EVENT_VISIBLE_MS;
 useEffect(()=>{if(visible&&eventAt&&announced.current!==eventAt){announced.current=eventAt;onArrive();}},[visible,eventAt,onArrive]);
 if(!visible||!eventAt){flight.current.at=0;return null;}
 if(flight.current.at!==eventAt)flight.current={at:eventAt,delay:-(now-eventAt)/1000};
 const event=cookieEvent(eventAt),Icon=event.id==="gift"?Gift:event.id==="cookie"?Cookie:Sparkles;
 return <div className="cookie-flyby-lane" key={eventAt}><button className={"cookie-flyby event-"+event.id+(claiming?" catching":"")} style={{"--flight-delay":flight.current.delay+"s"} as CSSProperties} onClick={()=>onCatch(eventAt)} disabled={blocked} aria-label={"Attraper : "+event.name+". Bonus de cookies."}><span className="flyby-orbit" aria-hidden="true"/><span className="flyby-icon"><Icon size={27}/></span><span><small>{claiming?"ATTRAPÉ…":"SURPRISE !"}</small><strong>{event.name}</strong><span>{claiming?"On récupère le cadeau":"Attrape-moi !"}</span></span><span className="flyby-trail" aria-hidden="true">✦ · ✧</span></button></div>;
}
