"use client";
import {Flag,Gift,ArrowUpRight} from "lucide-react";
import {formatCookies as fmt,type CookiePlayer} from "@/lib/cookie-game";
import {nextCookieGoal} from "@/lib/cookie-insights";
export function CookieNextGoal({player,busy,onClaim,onOpen}:{player:CookiePlayer;busy:boolean;onClaim:(id:string,kind:"mission"|"rebuild")=>void;onOpen:(filter:"open"|"done")=>void}){
 const mission=nextCookieGoal(player);
 if(!mission)return <div className="cookie-next-goal complete"><Flag size={18}/><span>Toutes les commandes terminées.</span><button onClick={()=>onOpen("done")} aria-label="Voir les objectifs terminés"><ArrowUpRight size={17}/></button></div>;
 const value=mission.value,ready=value>=mission.target;
 return <section className={"cookie-next-goal "+(ready?"ready":"")} aria-label="Prochain objectif"><div><Flag size={15}/><span>{ready?"RÉCOMPENSE PRÊTE":mission.kind==="rebuild"?"RECONSTRUCTION":"PROCHAIN OBJECTIF"}</span></div><strong>{mission.name}</strong><progress value={Math.min(value,mission.target)} max={mission.target}/><footer><small>{fmt(Math.min(value,mission.target))} / {fmt(mission.target)}</small>{ready?<button disabled={busy} onClick={()=>onClaim(mission.id,mission.kind)}><Gift size={14}/>+{fmt(mission.reward)}</button>:<button onClick={()=>onOpen("open")}>Les objectifs<ArrowUpRight size={14}/></button>}</footer></section>;
}
