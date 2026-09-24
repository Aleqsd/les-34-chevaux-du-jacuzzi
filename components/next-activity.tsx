"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Clock3 } from "lucide-react";
import { ActivityEmojiBadge } from "@/components/activity-emoji";
import { dateLabel, timeLabel, type ClubState, type Proposal } from "@/lib/club";
export function NextActivity({state,onOpen,onProgramme}:{state:ClubState;onOpen:(proposalId:string,planId?:string)=>void;onProgramme:()=>void}){
  const [now,setNow]=useState(0);useEffect(()=>{setNow(Date.now());const id=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(id);},[]);
  const entries=state.proposals.filter(p=>p.kind==="activity").flatMap<{p:Proposal;start:string;end:string;planId?:string}>(p=>{const plans=state.plans.filter(plan=>plan.proposalId===p.id);return plans.length?plans.map(plan=>({p,start:plan.start,end:plan.end,planId:plan.id})):p.start&&p.end?[{p,start:p.start,end:p.end,planId:undefined}]:[];}).filter(p=>new Date(p.end).getTime()>now).sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime());
  const next=entries[0];if(!now)return null;
  if(!next)return <div className="next-activity next-activity-empty"><CalendarDays size={24}/><div><strong>Le prochain moment reste à inventer.</strong><span>Propose une activité au crew.</span></div><button className="button secondary" onClick={onProgramme}>Le programme<ArrowUpRight size={16}/></button></div>;
  const remaining=new Date(next.start).getTime()-now,minutes=Math.max(1,Math.ceil(remaining/60000)),countdown=remaining<=0?"En cours":minutes<60?"Dans "+minutes+" min":minutes<1440?"Dans "+Math.floor(minutes/60)+" h "+minutes%60+" min":"Dans "+Math.floor(minutes/1440)+" j "+Math.floor(minutes%1440/60)+" h";
  return <button className="next-activity" onClick={()=>onOpen(next.p.id,next.planId)}><ActivityEmojiBadge proposal={next.p}/><span className="next-activity-copy"><span className="eyebrow">{remaining<=0?"LE CREW Y EST":"PROCHAINE ACTIVITÉ"}</span><strong>{next.p.title}</strong><span>{dateLabel(next.start)} · {timeLabel(next.start)} — {timeLabel(next.end)}</span></span><span className="next-activity-countdown"><Clock3 size={17}/>{countdown}<small>{next.planId?"Plan retenu":"Proposée au crew"}</small></span><ArrowUpRight size={25}/></button>;
}
