"use client";
import {useState} from "react";
import {Waypoints,Sparkles,RefreshCw,Plus,Minus,Check,LockKeyhole,Hand,Gift,Flame,Moon,PackageOpen,Flag,Compass,Crown,Star} from "lucide-react";
import {MASTERY_MAX_POINTS,MASTERY_TALENTS,masteryPoints,masteryRank,type CookiePlayer,type CookieAction,type MasteryId} from "@/lib/cookie-game";
const branches=[{id:"synergy",name:"Synergies",hint:"Un atelier qui joue collectif",Icon:Waypoints},{id:"surprise",name:"Instants précieux",hint:"Chaque surprise compte",Icon:Sparkles},{id:"rebuild",name:"Nouveaux départs",hint:"Revenir toujours plus fort",Icon:RefreshCw}] as const;
const icons={variety:Waypoints,links:Sparkles,hands:Hand,gifts:Gift,rush:Flame,rest:Moon,starter:PackageOpen,grants:Flag,plans:Compass};
export function CookieMastery(props:{player:CookiePlayer;now:number;busy:boolean;onAction:(a:CookieAction)=>void}){return <MasteryEditor key={props.player.mastery?.revision??0} {...props}/>;}
function MasteryEditor({player:p,now,busy,onAction}:{player:CookiePlayer;now:number;busy:boolean;onAction:(a:CookieAction)=>void}){
 const [draft,setDraft]=useState<Partial<Record<MasteryId,number>>>(()=>({...p.mastery?.ranks}));
 const earned=masteryPoints(p),spent=Object.values(draft).reduce((n,r)=>n+r,0),changed=MASTERY_TALENTS.some(t=>(draft[t.id]??0)!==masteryRank(p,t.id)),removes=MASTERY_TALENTS.some(t=>(draft[t.id]??0)<masteryRank(p,t.id)),waiting=Math.max(0,(p.mastery?.nextChangeAt??0)-now);
 function adjust(id:MasteryId,delta:number){setDraft(old=>{const next={...old,[id]:(old[id]??0)+delta};for(const t of MASTERY_TALENTS)if(t.requires&&(next[t.requires]??0)<2)next[t.id]=0;return next;});}
 return <section data-complete={spent===MASTERY_MAX_POINTS} className="cookie-mastery talent-garden" aria-label="Arbre de maîtrise">
 <header className="mastery-heading"><div><span className="eyebrow">L’ARBRE DE MAÎTRISE</span><h2>Fais grandir ton savoir-faire.</h2><p>Un point tous les 5 succès, jusqu’à {MASTERY_MAX_POINTS} points : juste assez pour maîtriser chaque talent. Deux rangs ouvrent le talent suivant. Tout reste acquis après un prestige.</p></div><div className="mastery-points" aria-live="polite"><strong>{spent===MASTERY_MAX_POINTS?<Check aria-label="Arbre complet" size={32}/>:earned-spent}</strong><span>{spent===MASTERY_MAX_POINTS?"Arbre complet":`${earned-spent>1?"Points":"Point"} à investir`}</span><small>{spent} / {MASTERY_MAX_POINTS} rangs attribués</small>{earned===MASTERY_MAX_POINTS&&<small>Tous les points sont acquis</small>}</div></header>
 <div className="talent-map">
 <div className="talent-root"><span><Crown size={29}/></span><strong>Le savoir du crew</strong><small>3 voies · 9 talents permanents</small></div>
 <svg className="talent-trunk" viewBox="0 0 900 62" preserveAspectRatio="none" aria-hidden="true"><path d="M450 0 V12 Q450 28 430 28 H170 Q150 28 150 48 V62"/><path d="M450 0 V62"/><path d="M450 0 V12 Q450 28 470 28 H730 Q750 28 750 48 V62"/></svg>
 <div className="talent-paths">{branches.map(({id,name,hint,Icon},branchIndex)=><section key={id} className={"talent-path "+id} aria-label={name}>
 <header><span className="talent-path-kicker">VOIE 0{branchIndex+1}</span><h3><Icon size={19}/>{name}</h3><p>{hint}</p></header>
 <ol>{MASTERY_TALENTS.filter(t=>t.branch===id).map((t,index)=>{const rank=draft[t.id]??0,locked=!!t.requires&&(draft[t.requires]??0)<2,NodeIcon=icons[t.id],pending=rank!==masteryRank(p,t.id);return <li key={t.id} data-active={rank>0} data-locked={locked} data-pending={pending}>
 {index>0&&<span className="talent-link" aria-hidden="true"><i/><b>◆</b><i/></span>}
 <div className="talent-node"><div className="talent-medallion" aria-hidden="true"><NodeIcon size={31}/><span>{locked?<LockKeyhole size={11}/>:rank===3?<Check size={12}/>:rank+"/3"}</span></div><div className="talent-ranks" aria-label={rank+" rangs sur 3"}>{[1,2,3].map(r=><Star key={r} size={13} data-filled={rank>=r}/>)}</div>
 <h4>{t.name}</h4><p>{t.description}</p><div className="talent-controls"><button aria-label={"Retirer un rang de "+t.name} disabled={busy||rank===0} onClick={()=>adjust(t.id,-1)}><Minus size={16}/></button><span>{locked?"Talent verrouillé":rank===3?"Maîtrisé":pending?"Modification en attente":"Rang "+rank+" sur 3"}</span><button aria-label={"Ajouter un rang de "+t.name} disabled={busy||locked||rank===3||spent>=earned} onClick={()=>adjust(t.id,1)}><Plus size={17}/></button></div>
 {locked&&<small className="talent-requirement">2 rangs dans {MASTERY_TALENTS.find(r=>r.id===t.requires)?.name}</small>}
 </div></li>;})}</ol></section>)}</div>
 </div>
 <footer className="mastery-save"><div><strong>{changed?"Tes changements sont prêts à appliquer.":"Tes talents actifs sont sauvegardés."}</strong><p>{removes&&waiting>0?"Redistribution gratuite dans "+Math.ceil(waiting/60000)+" min. Tu peux toujours ajouter de nouveaux points.":"Redistribution gratuite toutes les 20 min. Ajouter des points reste possible à tout moment."}</p></div><button className="button secondary" disabled={!changed||busy} onClick={()=>setDraft({...p.mastery?.ranks})}>Annuler les changements</button><button className="button primary" disabled={!changed||busy||spent>earned||(removes&&waiting>0)} onClick={()=>onAction({kind:"mastery",ranks:draft,revision:p.mastery?.revision??0})}><Check size={17}/>Appliquer les talents</button></footer>
 </section>;
}
