"use client";
import {useMemo} from "react";
import {Flag,ArrowUpRight,Pin,Check} from "lucide-react";
import {eventDiscount,formatCookies as fmt,type CookiePlayer,type CookieAction} from "@/lib/cookie-game";
import {describeGoal,recommendGoals,type PersonalGoal} from "@/lib/cookie-goals";
export function CookieNextGoal({player,busy,pilot,now,onAction,onOpen}:{player:CookiePlayer;busy:boolean;pilot:boolean;now:number;onAction:(a:CookieAction)=>void;onOpen:(section:string)=>void}){
 const discounted=eventDiscount(player,now);
 const choices=useMemo(()=>recommendGoals(player,pilot,now),[player,pilot,discounted]);
 const followed=useMemo(()=>player.followedGoal?describeGoal(player,player.followedGoal,pilot,now):undefined,[player,pilot,discounted]);
 const current=followed??choices[0];
 if(!current)return <section className="cookie-next-goal complete"><Flag size={18}/><strong>Tout est exploré pour le moment.</strong><button onClick={()=>onOpen("horizons")}>Mes horizons<ArrowUpRight size={16}/></button></section>;
 const follow=(g:PersonalGoal)=>onAction({kind:"followGoal",revision:player.followRevision??0,goal:g.goal});
 return <section className={"cookie-next-goal personal-goal "+(current.complete||current.action?"ready":"")} aria-label="Prochain objectif"><div><Flag size={15}/><span>{current.complete?"OBJECTIF ATTEINT":followed?"TON OBJECTIF SUIVI":"CONSEILLÉ POUR TON ATELIER"}</span></div><strong>{current.name}</strong><p>{current.detail}</p><progress value={Math.min(current.value,current.target)} max={current.target}/><small>{fmt(Math.min(current.value,current.target))} / {fmt(current.target)}</small><footer>{followed?<button disabled={busy} onClick={()=>onAction({kind:"followGoal",revision:player.followRevision??0,goal:null})}>{current.complete?<Check size={14}/>:<Pin size={14}/>} {current.complete?"Choisir la suite":"Ne plus suivre"}</button>:<button disabled={busy} onClick={()=>follow(current)}><Pin size={14}/>Suivre</button>}{!current.complete&&<button disabled={busy} onClick={()=>current.action?onAction(current.action):onOpen(current.section)}>{current.action?(current.action.kind==="upgrade"?"Acheter":"Réclamer"):"Voir"}<ArrowUpRight size={14}/></button>}</footer><details><summary>Autres pistes pour toi</summary><p className="goal-calculation-note">Bâtiments et recettes comparés sur leur gain par seconde, avec le pilote s’il est actif. Gains hors bonus temporaires ; clics manuels indiqués à part.</p>{choices.filter(g=>g.key!==current.key).map(g=><article key={g.key}><div><strong>{g.name}</strong><small>{g.detail}</small></div><button aria-label={"Suivre : "+g.name} disabled={busy} onClick={()=>follow(g)}><Pin size={15}/></button></article>)}</details></section>;
}
