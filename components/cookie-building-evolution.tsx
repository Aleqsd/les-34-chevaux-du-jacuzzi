import {Sparkles,Crown,Star,Medal} from "lucide-react";
import {CookieItemIcon} from "@/components/cookie-icons";
const tiers=[{at:0,label:"À installer"},{at:1,label:"Premier atelier"},{at:10,label:"Artisan"},{at:25,label:"Expert"},{at:50,label:"Légendaire"},{at:100,label:"Astral"}];
export function buildingEvolution(owned:number){let tier=0;for(let i=1;i<tiers.length;i++)if(owned>=tiers[i].at)tier=i;return {tier,label:tiers[tier].label,next:tiers[tier+1]?.at};}
export function BuildingEvolution({id,owned}:{id:string;owned:number}){const {tier,label}=buildingEvolution(owned),Badge=tier>=5?Sparkles:tier>=4?Crown:tier>=3?Medal:Star;return <span className="building-evolution" data-tier={tier} title={label} aria-hidden="true"><CookieItemIcon kind="building" id={id} size={tier>=4?32:28}/>{tier>=2&&<span className="evolution-badge"><Badge size={tier>=4?16:13}/></span>}<span className="evolution-marks">{Array.from({length:Math.max(0,tier-1)},(_,i)=><i key={i}/>)}</span></span>;}
