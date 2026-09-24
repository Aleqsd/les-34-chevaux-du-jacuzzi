export type AccessoryKind = "hat" | "eyewear" | "floatie";
export type AccessoryPosition = { x:number; y:number };
export type AccessoryPositions = Partial<Record<AccessoryKind,AccessoryPosition>>;
export const ACCESSORIES:AccessoryKind[]=["hat","eyewear","floatie"];
export const clampPosition=(value:number)=>Math.round(Math.max(0,Math.min(100,value))*10)/10;
export function readPositions(raw:unknown):AccessoryPositions{
  try{
    const value=typeof raw==="string"?JSON.parse(raw):raw;
    if(!value||typeof value!=="object")return {};
    const result:AccessoryPositions={};
    for(const kind of ACCESSORIES){const p=value[kind];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))result[kind]={x:clampPosition(p.x),y:clampPosition(p.y)};}
    return result;
  }catch{return {};}
}
export function accessoryLayout(kind:AccessoryKind,hat:string,positions:AccessoryPositions={}){
  const defaults=kind==="hat"?(hat==="flower"?{x:83,y:10,size:44,rotation:-9}:{x:50,y:6.5,size:65,rotation:-9}):kind==="eyewear"?{x:50,y:65.5,size:65,rotation:0}:{x:50,y:89,size:70,rotation:0};
  return {...defaults,...positions[kind]};
}
