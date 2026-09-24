export const REWARDS=[
  {votes:3,title:"Premier galop",items:[{slot:"hat",id:"sparkle",label:"Halo stellaire",emoji:"🌟"}]},
  {votes:7,title:"Voix du crew",items:[{slot:"accessory",id:"honor",label:"Médaille d’honneur",emoji:"🎖️"}]},
  {votes:12,title:"Cavalier de diamant",items:[{slot:"accessory",id:"diamond",label:"Diamant",emoji:"💎"}]},
  {votes:20,title:"En orbite",items:[{slot:"accessory",id:"rocket",label:"Fusée",emoji:"🚀"}]},
  {votes:34,title:"34 chevaux. Une légende.",items:[{slot:"hat",id:"ufo",label:"Soucoupe volante",emoji:"🛸"},{slot:"accessory",id:"rainbow",label:"Arc-en-ciel",emoji:"🌈"}]},
] as const;
export function requiredVotes(slot:string,id:string){return REWARDS.find(r=>r.items.some(item=>item.slot===slot&&item.id===id))?.votes??0;}
