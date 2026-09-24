"use client";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { EYEWEAR, HATS, EXTRAS, extraAccessory, type Look } from "@/lib/appearance";
import { EmojiImage } from "@/components/emoji-image";
import { ACCESSORIES, accessoryLayout, clampPosition, type AccessoryKind, type AccessoryPosition } from "@/lib/avatar-positions";

export type AccessoryEditing={active:AccessoryKind|null;disabled:boolean;onSelect:(kind:AccessoryKind)=>void;onChange:(kind:AccessoryKind,position:AccessoryPosition)=>void};
export function accessoryLabel(kind:AccessoryKind,look:Look){return kind==="hat"?HATS.find(h=>h.id===look.hat)?.label||"Chapeau":kind==="eyewear"?EYEWEAR.find(h=>h.id===look.eyewear)?.label||"Lunettes":EXTRAS.find(h=>h.id===extraAccessory(look))?.label||"Accessoire";}
export function visibleAccessories(look:Look){return ACCESSORIES.filter(kind=>kind==="hat"?look.hat!=="none":kind==="eyewear"?look.eyewear!=="none":extraAccessory(look)!=="none");}

export function AvatarAccessories({look,editing}:{look:Look;editing?:AccessoryEditing}){
  const drag=useRef<{id:number;kind:AccessoryKind;clientX:number;clientY:number;width:number;height:number;position:AccessoryPosition;target:HTMLButtonElement}|null>(null);
  const [moving,setMoving]=useState<AccessoryKind|null>(null);
  const finish=(cancel=false)=>{const d=drag.current;drag.current=null;setMoving(null);if(d){if(cancel)editing?.onChange(d.kind,d.position);if(d.target.hasPointerCapture(d.id))d.target.releasePointerCapture(d.id);}};
  useEffect(()=>()=>{const d=drag.current;drag.current=null;if(d?.target.hasPointerCapture(d.id))d.target.releasePointerCapture(d.id);},[]);
  const start=(event:PointerEvent<HTMLButtonElement>,kind:AccessoryKind)=>{
    if(!editing||editing.disabled||drag.current||!event.isPrimary||event.button!==0)return;
    const rect=event.currentTarget.closest(".avatar-shell")!.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    event.preventDefault();event.currentTarget.focus();editing.onSelect(kind);
    const {x,y}=accessoryLayout(kind,look.hat,look.positions,extraAccessory(look));
    drag.current={id:event.pointerId,kind,clientX:event.clientX,clientY:event.clientY,width:rect.width,height:rect.height,position:{x,y},target:event.currentTarget};
    event.currentTarget.setPointerCapture(event.pointerId);setMoving(kind);
  };
  return visibleAccessories(look).map(kind=>{
    const layout=accessoryLayout(kind,look.hat,look.positions,extraAccessory(look)),emoji=kind==="hat"?HATS.find(h=>h.id===look.hat)?.emoji:kind==="eyewear"?EYEWEAR.find(h=>h.id===look.eyewear)?.emoji:EXTRAS.find(h=>h.id===extraAccessory(look))?.emoji;
    const style={left:`${layout.x-layout.size/2}%`,top:`${layout.y-layout.size/2}%`,width:`${layout.size}%`,height:`${layout.size}%`,fontSize:`${layout.size}cqw`,"--accessory-rotation":`${layout.rotation}deg`} as CSSProperties;
    const content=<EmojiImage className="accessory-glyph" emoji={emoji||"✨"}/>;
    if(!editing)return <span key={kind} aria-hidden="true" className={`avatar-accessory positioned-accessory accessory-${kind}`} style={style}>{content}</span>;
    return <button key={kind} type="button" style={style} className={`avatar-accessory positioned-accessory accessory-handle accessory-${kind} ${moving===kind?"is-dragging":""}`} disabled={editing.disabled} aria-label={`Déplacer ${accessoryLabel(kind,look)}`} aria-pressed={editing.active===kind} aria-describedby="avatar-position-help"
      onClick={()=>editing.onSelect(kind)} onPointerDown={event=>start(event,kind)}
      onPointerMove={event=>{const d=drag.current;if(!d||d.id!==event.pointerId)return;editing.onChange(d.kind,{x:clampPosition(d.position.x+(event.clientX-d.clientX)/d.width*100),y:clampPosition(d.position.y+(event.clientY-d.clientY)/d.height*100)});}}
      onPointerUp={event=>{if(drag.current?.id===event.pointerId)finish();}}
      onPointerCancel={event=>{if(drag.current?.id===event.pointerId)finish(true);}}
      onLostPointerCapture={event=>{if(drag.current?.id===event.pointerId)finish(true);}}
      onKeyDown={event=>{if(event.key==="Escape"&&drag.current){event.preventDefault();event.stopPropagation();finish(true);return;}const delta=event.shiftKey?10:1;const directions:Record<string,[number,number]>={ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]};const change=directions[event.key];if(change&&!drag.current){event.preventDefault();editing.onSelect(kind);editing.onChange(kind,{x:clampPosition(layout.x+change[0]),y:clampPosition(layout.y+change[1])});}}}>{content}</button>;
  });
}
