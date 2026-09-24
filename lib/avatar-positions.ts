export type AccessoryKind = "hat" | "eyewear" | "floatie";
export type AccessoryPosition = { x:number; y:number; scale?:number };
export type AccessoryPositions = Partial<Record<AccessoryKind,AccessoryPosition>>;
export const ACCESSORIES:AccessoryKind[]=["hat","eyewear","floatie"];
export const MIN_ACCESSORY_SCALE=.5;
export const MAX_ACCESSORY_SCALE=1.8;
export const clampScale=(value:number)=>Math.round(Math.max(MIN_ACCESSORY_SCALE,Math.min(MAX_ACCESSORY_SCALE,value))*100)/100;
export const clampPosition=(value:number)=>Math.round(Math.max(0,Math.min(100,value))*10)/10;
export function readPositions(raw:unknown):AccessoryPositions{
  try{
    const value=typeof raw==="string"?JSON.parse(raw):raw;
    if(!value||typeof value!=="object")return {};
    const result:AccessoryPositions={};
    for(const kind of ACCESSORIES){const p=value[kind];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))result[kind]={x:clampPosition(p.x),y:clampPosition(p.y),...(Number.isFinite(p.scale)?{scale:clampScale(p.scale)}:{})};}
    return result;
  }catch{return {};}
}
export function accessoryLayout(kind:AccessoryKind,hat:string,positions:AccessoryPositions={},accessory="floatie"){
  const extras:Record<string,{x:number;y:number;size:number;rotation:number}>={headphones:{x:50,y:45,size:70,rotation:0},scarf:{x:50,y:85,size:70,rotation:0},bow:{x:50,y:85,size:45,rotation:0},medal:{x:50,y:85,size:55,rotation:0}};
  const defaults=kind==="hat"?(hat==="flower"?{x:83,y:10,size:44,rotation:-9}:{x:50,y:6.5,size:65,rotation:-9}):kind==="eyewear"?{x:50,y:65.5,size:65,rotation:0}:extras[accessory]??{x:50,y:89,size:70,rotation:0};
  const scale=clampScale(positions[kind]?.scale??1);
  return {...defaults,...positions[kind],scale,size:defaults.size*scale};
}
