export type AccessoryKind = "hat" | "eyewear" | "floatie";
export type AccessoryPosition = { x:number; y:number; scale?:number; scaleX?:number; scaleY?:number; rotation?:number; lockRatio?:boolean };
export type AccessoryPositions = Partial<Record<AccessoryKind,AccessoryPosition>>;
export const ACCESSORIES:AccessoryKind[]=["hat","eyewear","floatie"];
export const MIN_ACCESSORY_SCALE=.5;
export const MAX_ACCESSORY_SCALE=1.8;
export const clampScale=(value:number)=>Math.max(MIN_ACCESSORY_SCALE,Math.min(MAX_ACCESSORY_SCALE,value));
export const clampPosition=(value:number)=>Math.max(0,Math.min(100,value));
export const normalizeRotation=(value:number)=>Math.round((((value+180)%360+360)%360-180)*10)/10;
export function readPositions(raw:unknown):AccessoryPositions{
  try{
    const value=typeof raw==="string"?JSON.parse(raw):raw;
    if(!value||typeof value!=="object")return {};
    const result:AccessoryPositions={};
    for(const kind of ACCESSORIES){const p=value[kind];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){
      const position:AccessoryPosition={x:clampPosition(p.x),y:clampPosition(p.y)};
      for(const key of ["scale","scaleX","scaleY"] as const)if(Number.isFinite(p[key]))position[key]=clampScale(p[key]);
      if(Number.isFinite(p.rotation))position.rotation=normalizeRotation(p.rotation);
      if(typeof p.lockRatio==="boolean")position.lockRatio=p.lockRatio;
      result[kind]=position;
    }}
    return result;
  }catch{return {};}
}
export function accessoryLayout(kind:AccessoryKind,hat:string,positions:AccessoryPositions={},accessory="floatie"){
  const extras:Record<string,{x:number;y:number;size:number;rotation:number}>={headphones:{x:50,y:45,size:70,rotation:0},scarf:{x:50,y:85,size:70,rotation:0},bow:{x:50,y:85,size:45,rotation:0},medal:{x:50,y:85,size:55,rotation:0}};
  const defaults=kind==="hat"?(hat==="flower"?{x:83,y:10,size:44,rotation:-9}:{x:50,y:6.5,size:65,rotation:-9}):kind==="eyewear"?{x:50,y:65.5,size:65,rotation:0}:extras[accessory]??{x:50,y:89,size:70,rotation:0};
  const scale=clampScale(positions[kind]?.scale??1);
  const scaleX=clampScale(positions[kind]?.scaleX??scale),scaleY=clampScale(positions[kind]?.scaleY??scale);
  return {...defaults,...positions[kind],rotation:normalizeRotation(positions[kind]?.rotation??defaults.rotation),lockRatio:positions[kind]?.lockRatio??true,scale,scaleX,scaleY,baseSize:defaults.size,size:defaults.size*scale,width:defaults.size*scaleX,height:defaults.size*scaleY};
}

export type AccessoryLayout=ReturnType<typeof accessoryLayout>;
export type ResizeEdge=readonly [number,number];
/** Delta and dimensions use the avatar's coordinate space. The opposite edge stays anchored. */
export function resizeFromHandle(start:AccessoryLayout,edge:ResizeEdge,dx:number,dy:number,locked=start.lockRatio):AccessoryPosition{
  const [sx,sy]=edge,angle=start.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const localX=dx*c+dy*s,localY=-dx*s+dy*c;
  let width=start.width,height=start.height;
  if(locked){
    const factor=1+(sx&&sy?(sx*width*localX+sy*height*localY)/(width*width+height*height):sx?sx*localX/width:sy*localY/height);
    const bounded=Math.max(Math.max(MIN_ACCESSORY_SCALE/start.scaleX,MIN_ACCESSORY_SCALE/start.scaleY),Math.min(Math.min(MAX_ACCESSORY_SCALE/start.scaleX,MAX_ACCESSORY_SCALE/start.scaleY),factor));
    width*=bounded;height*=bounded;
  }else{
    if(sx)width=start.baseSize*Math.max(MIN_ACCESSORY_SCALE,Math.min(MAX_ACCESSORY_SCALE,(width+sx*localX)/start.baseSize));
    if(sy)height=start.baseSize*Math.max(MIN_ACCESSORY_SCALE,Math.min(MAX_ACCESSORY_SCALE,(height+sy*localY)/start.baseSize));
  }
  const shiftX=sx*(width-start.width)/2,shiftY=sy*(height-start.height)/2;
  const worldX=shiftX*c-shiftY*s,worldY=shiftX*s+shiftY*c;
  // Stop at the avatar boundary instead of clamping the centre and sliding the anchor.
  let t=1;
  for(const [origin,delta] of [[start.x,worldX],[start.y,worldY]])if(Math.abs(delta)>1e-10)t=Math.min(t,(delta>0?100-origin:-origin)/delta);
  t=Math.max(0,t);width=start.width+(width-start.width)*t;height=start.height+(height-start.height)*t;
  return {x:clampPosition(start.x+worldX*t),y:clampPosition(start.y+worldY*t),scale:1,scaleX:clampScale(width/start.baseSize),scaleY:clampScale(height/start.baseSize),rotation:start.rotation,lockRatio:locked};
}

export function resizeAxis(start:AccessoryLayout,axis:"scaleX"|"scaleY",value:number):AccessoryPosition{
  let x=start.scaleX,y=start.scaleY;
  if(start.lockRatio){const factor=Math.max(Math.max(MIN_ACCESSORY_SCALE/x,MIN_ACCESSORY_SCALE/y),Math.min(Math.min(MAX_ACCESSORY_SCALE/x,MAX_ACCESSORY_SCALE/y),value/start[axis]));x*=factor;y*=factor;}
  else if(axis==="scaleX")x=clampScale(value);else y=clampScale(value);
  return {x:start.x,y:start.y,scale:1,scaleX:clampScale(x),scaleY:clampScale(y),rotation:start.rotation,lockRatio:start.lockRatio};
}
