"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export function celebrate(kind:"yes"|"no"|"proposal"="proposal") {
  window.dispatchEvent(new CustomEvent("jacuzzi:celebrate",{detail:{kind}}));
}

export function ClubEffects() {
  const [burst,setBurst]=useState<{id:number;x:number;y:number;kind:string}|null>(null);
  const progress=useRef<HTMLDivElement>(null);
  const pointer=useRef({x:0,y:0,at:0});
  useEffect(()=>{
    const motion=matchMedia("(prefers-reduced-motion: reduce)");
    let frame=0;let expiry:ReturnType<typeof setTimeout>;
    const updateProgress=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const height=document.documentElement.scrollHeight-innerHeight;progress.current?.style.setProperty("--progress",String(height>0?scrollY/height:0));});};
    const remember=(e:globalThis.PointerEvent)=>{pointer.current={x:e.clientX,y:e.clientY,at:Date.now()};};
    const launch=(event:Event)=>{
      if(motion.matches)return;
      const active=document.activeElement?.getBoundingClientRect();
      const p=Date.now()-pointer.current.at<4000?pointer.current:{x:active?active.x+active.width/2:innerWidth/2,y:active?active.y+active.height/2:innerHeight/2};
      setBurst({id:Date.now(),x:p.x,y:p.y,kind:(event as CustomEvent).detail.kind});
      clearTimeout(expiry);expiry=setTimeout(()=>setBurst(null),1000);
    };
    const reduce=()=>{if(motion.matches)setBurst(null);};
    const resize=new ResizeObserver(updateProgress);resize.observe(document.body);
    addEventListener("scroll",updateProgress,{passive:true});addEventListener("resize",updateProgress);addEventListener("pointerdown",remember,{passive:true});addEventListener("jacuzzi:celebrate",launch);motion.addEventListener("change",reduce);updateProgress();
    return()=>{resize.disconnect();cancelAnimationFrame(frame);clearTimeout(expiry);removeEventListener("scroll",updateProgress);removeEventListener("resize",updateProgress);removeEventListener("pointerdown",remember);removeEventListener("jacuzzi:celebrate",launch);motion.removeEventListener("change",reduce);};
  },[]);
  return <>
    <div ref={progress} className="reading-progress" aria-hidden="true"/>
    <div className="night-atmosphere" aria-hidden="true"><span/><span/><span/></div>
    {burst&&<div key={burst.id} className={`crew-burst burst-${burst.kind}`} style={{left:burst.x,top:burst.y} as CSSProperties} aria-hidden="true"><span className="burst-ring"/>{Array.from({length:20},(_,i)=>{const angle=i/20*Math.PI*2;const distance=65+(i%4)*24;return <i key={i} style={{"--dx":`${Math.cos(angle)*distance}px`,"--dy":`${Math.sin(angle)*distance-30}px`,"--turn":`${i*47}deg`,"--spark-color":["#dfff00","#9abaff","#fff","#ffb4d6"][i%4]} as CSSProperties}/>;})}</div>}
  </>;
}
