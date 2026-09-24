"use client";
import { useEffect, useRef, useState } from "react";
import { REWARDS } from "@/lib/rewards";
import { voterKey } from "@/lib/identity";
type Reward=typeof REWARDS[number];
const storageKey=(key:string)=>"jacuzzi-achievements-seen-v1:"+key;
function readSeen(key:string):number[]{try{const value=JSON.parse(localStorage.getItem(storageKey(key))||"[]");return Array.isArray(value)?value.filter(n=>typeof n==="number"):[];}catch{return [];}}
export function useUnlocks(person:string,peak:number,loaded:boolean){
  const [queue,setQueue]=useState<Reward[]>([]),owner=useRef(""),seen=useRef<number[]>([]);
  const key=voterKey(person);
  useEffect(()=>{
    if(owner.current!==key){owner.current=key;seen.current=key?readSeen(key):[];setQueue([]);}
    if(!key||!loaded)return;
    const earned=REWARDS.filter(r=>r.votes<=peak&&!seen.current.includes(r.votes));
    setQueue(current=>[...current,...earned.filter(r=>!current.some(q=>q.votes===r.votes))]);
  },[key,peak,loaded]);
  const dismiss=()=>{const reward=queue[0];if(reward&&owner.current===key){seen.current=[...new Set([...seen.current,reward.votes])];try{localStorage.setItem(storageKey(key),JSON.stringify(seen.current));}catch{}}setQueue(q=>q.slice(1));};
  const replay=(reward:Reward)=>{if(reward.votes<=peak)setQueue(q=>[reward,...q.filter(r=>r.votes!==reward.votes)]);};
  return {reward:queue[0]??null,dismiss,replay};
}
