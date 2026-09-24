"use client";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Slider } from "radix-ui";
import { MIN_ACCESSORY_SCALE, MAX_ACCESSORY_SCALE } from "@/lib/avatar-positions";

export function AccessorySizeControl({label,scale,disabled,onChange}:{label:string;scale:number;disabled:boolean;onChange:(scale:number)=>void}){
  const percent=Math.round(scale*100),min=MIN_ACCESSORY_SCALE*100,max=MAX_ACCESSORY_SCALE*100;
  return <div className="accessory-size-control"><div className="accessory-size-label"><span>Taille de l’accessoire</span><output aria-live="polite">{percent} %</output></div><div className="accessory-size-row">
    <button type="button" aria-label={`Réduire ${label}`} disabled={disabled||percent<=min} onClick={()=>onChange((percent-5)/100)}><Minus size={18}/></button>
    <Slider.Root className="accessory-size-slider" value={[percent]} min={min} max={max} step={5} disabled={disabled} onValueChange={([value])=>onChange(value/100)}><Slider.Track className="accessory-size-track"><Slider.Range className="accessory-size-range"/></Slider.Track><Slider.Thumb className="accessory-size-thumb" aria-label={`Taille de ${label}`} aria-valuetext={`${percent} pour cent`}/></Slider.Root>
    <button type="button" aria-label={`Agrandir ${label}`} disabled={disabled||percent>=max} onClick={()=>onChange((percent+5)/100)}><Plus size={18}/></button>
  </div><button type="button" className="accessory-size-reset" disabled={disabled||percent===100} onClick={()=>onChange(1)}><RotateCcw size={14}/>Taille d’origine</button></div>;
}
