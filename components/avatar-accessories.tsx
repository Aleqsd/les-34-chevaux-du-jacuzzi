"use client";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type KeyboardEvent } from "react";
import { RotateCw } from "lucide-react";
import { EYEWEAR, HATS, EXTRAS, extraAccessory, type Look } from "@/lib/appearance";
import { emojiAsset } from "@/lib/emoji-assets";
import { ACCESSORIES, accessoryLayout, clampPosition, normalizeRotation, resizeFromHandle, type AccessoryKind, type AccessoryPosition, type AccessoryLayout, type ResizeEdge } from "@/lib/avatar-positions";
export type AccessoryEditing={active:AccessoryKind|null;disabled:boolean;onSelect:(kind:AccessoryKind)=>void;onChange:(kind:AccessoryKind,position:AccessoryPosition)=>void};
export function accessoryLabel(kind:AccessoryKind,look:Look){return kind==="hat"?HATS.find(h=>h.id===look.hat)?.label||"Chapeau":kind==="eyewear"?EYEWEAR.find(h=>h.id===look.eyewear)?.label||"Lunettes":EXTRAS.find(h=>h.id===extraAccessory(look))?.label||"Accessoire";}
export function visibleAccessories(look:Look){return ACCESSORIES.filter(kind=>kind==="hat"?look.hat!=="none":kind==="eyewear"?look.eyewear!=="none":extraAccessory(look)!=="none");}
const handles:{edge:ResizeEdge;name:string}[]=[{edge:[-1,-1],name:"coin supérieur gauche"},{edge:[0,-1],name:"bord supérieur"},{edge:[1,-1],name:"coin supérieur droit"},{edge:[1,0],name:"bord droit"},{edge:[1,1],name:"coin inférieur droit"},{edge:[0,1],name:"bord inférieur"},{edge:[-1,1],name:"coin inférieur gauche"},{edge:[-1,0],name:"bord gauche"}];
type Gesture={id:number;kind:AccessoryKind;mode:"move"|"resize"|"rotate";edge:ResizeEdge;start:AccessoryLayout;clientX:number;clientY:number;width:number;height:number;centerX:number;centerY:number;pointerAngle:number;target:HTMLButtonElement};
const stored=(l:AccessoryLayout):AccessoryPosition=>({x:l.x,y:l.y,scale:l.scale,scaleX:l.scaleX,scaleY:l.scaleY,rotation:l.rotation,lockRatio:l.lockRatio});
export function AvatarAccessories({look,editing}:{look:Look;editing?:AccessoryEditing}){
  const drag=useRef<Gesture|null>(null),[moving,setMoving]=useState<AccessoryKind|null>(null);
  const finish=(cancel=false)=>{const d=drag.current;drag.current=null;setMoving(null);if(d){if(cancel)editing?.onChange(d.kind,stored(d.start));if(d.target.hasPointerCapture(d.id))d.target.releasePointerCapture(d.id);}};
  useEffect(()=>()=>{const d=drag.current;drag.current=null;if(d?.target.hasPointerCapture(d.id))d.target.releasePointerCapture(d.id);},[]);
  const start=(event:PointerEvent<HTMLButtonElement>,kind:AccessoryKind,mode:Gesture["mode"],edge:ResizeEdge=[0,0])=>{
    if(!editing||editing.disabled||drag.current||!event.isPrimary||event.button!==0)return;
    const rect=event.currentTarget.closest(".avatar-shell")!.getBoundingClientRect();if(!rect.width||!rect.height)return;
    event.preventDefault();event.stopPropagation();event.currentTarget.focus();editing.onSelect(kind);
    const layout=accessoryLayout(kind,look.hat,look.positions,extraAccessory(look)),centerX=rect.left+layout.x/100*rect.width,centerY=rect.top+layout.y/100*rect.height;
    drag.current={id:event.pointerId,kind,mode,edge,start:layout,clientX:event.clientX,clientY:event.clientY,width:rect.width,height:rect.height,centerX,centerY,pointerAngle:Math.atan2(event.clientY-centerY,event.clientX-centerX),target:event.currentTarget};
    event.currentTarget.setPointerCapture(event.pointerId);setMoving(kind);
  };
  const move=(event:PointerEvent)=>{
    const d=drag.current;if(!editing||!d||event.pointerId!==d.id)return;
    const dx=(event.clientX-d.clientX)/d.width*100,dy=(event.clientY-d.clientY)/d.height*100;
    if(d.mode==="move")editing.onChange(d.kind,{x:clampPosition(d.start.x+dx),y:clampPosition(d.start.y+dy)});
    else if(d.mode==="resize")editing.onChange(d.kind,resizeFromHandle(d.start,d.edge,dx,dy));
    else {const angle=Math.atan2(event.clientY-d.centerY,event.clientX-d.centerX),rotation=d.start.rotation+(angle-d.pointerAngle)*180/Math.PI;editing.onChange(d.kind,{x:d.start.x,y:d.start.y,rotation:normalizeRotation(event.shiftKey?Math.round(rotation/15)*15:rotation)});}
  };
  const key=(event:KeyboardEvent,kind:AccessoryKind,layout:AccessoryLayout,mode:Gesture["mode"],edge:ResizeEdge=[0,0])=>{
    if(event.key==="Escape"&&drag.current){event.preventDefault();event.stopPropagation();finish(true);return;}
    const amount=event.shiftKey?10:1,directions:Record<string,[number,number]>={ArrowLeft:[-amount,0],ArrowRight:[amount,0],ArrowUp:[0,-amount],ArrowDown:[0,amount]},delta=directions[event.key];if(!delta||drag.current||!editing)return;
    event.preventDefault();event.stopPropagation();editing.onSelect(kind);
    if(mode==="move")editing.onChange(kind,{x:clampPosition(layout.x+delta[0]),y:clampPosition(layout.y+delta[1])});
    else if(mode==="resize")editing.onChange(kind,resizeFromHandle(layout,edge,delta[0],delta[1]));
    else editing.onChange(kind,{x:layout.x,y:layout.y,rotation:normalizeRotation(layout.rotation+delta[0]+delta[1])});
  };
  return visibleAccessories(look).map(kind=>{
    const layout=accessoryLayout(kind,look.hat,look.positions,extraAccessory(look)),label=accessoryLabel(kind,look),active=editing?.active===kind;
    const emoji=kind==="hat"?HATS.find(h=>h.id===look.hat)?.emoji:kind==="eyewear"?EYEWEAR.find(h=>h.id===look.eyewear)?.emoji:EXTRAS.find(h=>h.id===extraAccessory(look))?.emoji;
    const style={left:(layout.x-layout.width/2)+"%",top:(layout.y-layout.height/2)+"%",width:layout.width+"%",height:layout.height+"%",transform:"rotate("+layout.rotation+"deg)"} as CSSProperties;
    const content=<svg className="accessory-glyph" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><image href={emojiAsset(emoji||"✨")} width="100" height="100"/></svg>;
    if(!editing)return <span key={kind} aria-hidden="true" className={"avatar-accessory positioned-accessory accessory-"+kind} style={style}>{content}</span>;
    return <span key={kind} style={style} className={"avatar-accessory positioned-accessory accessory-transform accessory-"+kind+(active?" is-selected":"")+(moving===kind?" is-dragging":"")} onPointerMove={move} onPointerUp={event=>{if(drag.current?.id===event.pointerId)finish();}} onPointerCancel={event=>{if(drag.current?.id===event.pointerId)finish(true);}} onLostPointerCapture={event=>{if(drag.current?.id===event.pointerId)finish(true);}}>
      <button type="button" className="accessory-drag-surface" disabled={editing.disabled} aria-label={"Déplacer "+label} aria-pressed={active} aria-describedby="avatar-position-help" onClick={()=>editing.onSelect(kind)} onPointerDown={event=>start(event,kind,"move")} onKeyDown={event=>key(event,kind,layout,"move")}>{content}</button>
      {active&&<>{handles.map(({edge,name})=><button key={name} type="button" className={"accessory-resize-handle "+(edge[0]&&edge[1]?"corner":"edge")} style={{left:((edge[0]+1)*50)+"%",top:((edge[1]+1)*50)+"%",cursor:!edge[0]?"ns-resize":!edge[1]?"ew-resize":edge[0]===edge[1]?"nwse-resize":"nesw-resize"}} disabled={editing.disabled} aria-label={"Redimensionner "+label+" : "+name} aria-describedby="avatar-transform-help" onPointerDown={event=>start(event,kind,"resize",edge)} onKeyDown={event=>key(event,kind,layout,"resize",edge)}><span/></button>)}<span className="accessory-rotation-stem" aria-hidden="true"/><button type="button" className="accessory-rotation-handle" disabled={editing.disabled} aria-label={"Tourner "+label} aria-describedby="avatar-transform-help" onPointerDown={event=>start(event,kind,"rotate")} onKeyDown={event=>key(event,kind,layout,"rotate")}><RotateCw size={16}/></button></>}
    </span>;
  });
}
