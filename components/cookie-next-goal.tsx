"use client";
import {Flag,Gift,ArrowUpRight} from "lucide-react";
import {formatCookies as fmt,type CookiePlayer} from "@/lib/cookie-game";
import {nextCookieGoal} from "@/lib/cookie-insights";
export function CookieNextGoal({player,busy,onClaim,onOpen}:{player:CookiePlayer;busy:boolean;onClaim:(id:string,kind:"mission"|"rebuild"|"contractClaim")=>void;onOpen:(section:"permanent"|"rebuild"|"contracts",filter:"open"|"done")=>void}){
 const mission=nextCookieGoal(player);
 if(!mission)return <div className="cookie-next-goal complete"><Flag size={18}/><span>{player.lifetime>=1e6?"Le bureau attend ta prochaine commande.":"Tous les défis permanents sont terminés."}</span><button onClick={()=>onOpen(player.lifetime>=1e6?"contracts":"permanent","done")} aria-label={player.lifetime>=1e6?"Choisir un contrat":"Voir les objectifs terminés"}><ArrowUpRight size={17}/></button></div>;
 const value=mission.value,ready=value>=mission.target;
 return <section className={"cookie-next-goal "+(ready?"ready":"")} aria-label="Prochain objectif"><div><Flag size={15}/><span>{ready?"RÉCOMPENSE PRÊTE":mission.kind==="contractClaim"?"CONTRAT EN COURS":mission.kind==="rebuild"?"RECONSTRUCTION":"PROCHAIN OBJECTIF"}</span></div><strong>{mission.name}</strong><progress value={Math.min(value,mission.target)} max={mission.target}/><footer><small>{fmt(Math.min(value,mission.target))} / {fmt(mission.target)}</small>{ready?<button disabled={busy} onClick={()=>onClaim(mission.id,mission.kind)}><Gift size={14}/>+{fmt(mission.reward)}</button>:<button onClick={()=>onOpen(mission.kind==="contractClaim"?"contracts":mission.kind==="rebuild"?"rebuild":"permanent","open")}>Les objectifs<ArrowUpRight size={14}/></button>}</footer></section>;
}
