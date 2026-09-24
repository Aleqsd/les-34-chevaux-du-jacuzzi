"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PRESENCE_TTL, type PresenceMember, type PresenceRoom, type PresenceAction } from "@/lib/presence";
export function useCrewPresence(person:string,view:string){
  const [members,setMembers]=useState<PresenceMember[]>([]),[online,setOnline]=useState(false);
  const session=useRef(""),revision=useRef(0),personRef=useRef(person),generation=useRef(0),latest=useRef(0),lastSuccess=useRef(0),intent=useRef<{room:PresenceRoom;action:PresenceAction}>({room:"villa",action:"walk"});personRef.current=person;
  const request=useCallback(async(write=false)=>{if(document.hidden)return;const ticket=++generation.current;try{const posting=write&&personRef.current&&session.current;const response=await fetch("/api/presence",posting?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:session.current,author:personRef.current,...intent.current,revision:revision.current})}:undefined);if(!response.ok)throw Error();const data=await response.json() as {members:PresenceMember[]};if(ticket<latest.current)return;latest.current=ticket;lastSuccess.current=Date.now();setMembers(data.members);setOnline(true);}catch{if(ticket<latest.current)return;setOnline(false);if(Date.now()-lastSuccess.current>PRESENCE_TTL)setMembers([]);}},[]);
  const move=useCallback((room:PresenceRoom,action:PresenceAction=room==="jacuzzi"?"bathe":"walk")=>{intent.current={room,action};revision.current++;void request(true);},[request]);
  useEffect(()=>{session.current=crypto.randomUUID();revision.current=1;latest.current=++generation.current;void request(true);const heartbeat=setInterval(()=>void request(true),15000),poll=setInterval(()=>void request(false),5000);const wake=()=>{if(!document.hidden)void request(true);};document.addEventListener("visibilitychange",wake);return()=>{clearInterval(heartbeat);clearInterval(poll);document.removeEventListener("visibilitychange",wake);};},[person,request]);
  useEffect(()=>{if(view==="cinema")move("cinema","sit");else if(view==="activities"||view==="ideas")move("terrace","sit");},[view,move]);
  return {members,online,move};
}
