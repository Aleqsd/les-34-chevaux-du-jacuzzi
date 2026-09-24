"use client";
import { useEffect } from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmojiImage } from "@/components/emoji-image";
import { REWARDS } from "@/lib/rewards";
import { celebrate } from "@/components/club-effects";
export function UnlockCelebration({reward,onClose,onWardrobe}:{reward:typeof REWARDS[number]|null;onClose:()=>void;onWardrobe:()=>void}){
  useEffect(()=>{if(!reward)return;celebrate("yes");const id=setTimeout(()=>celebrate("yes"),650);return()=>clearTimeout(id);},[reward]);
  return <Dialog open={!!reward} onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="club-dialog unlock-dialog">{reward&&<><div className="unlock-rays" aria-hidden="true"/><div className="unlock-orbits" aria-hidden="true"><i/><i/><i/></div><div className="unlock-content"><span className="unlock-kicker"><Sparkles size={18}/>SUCCÈS DÉBLOQUÉ</span><div className="unlock-prize">{reward.items.map(item=><EmojiImage key={item.id} emoji={item.emoji}/>)}</div><span className="unlock-threshold">{reward.votes} VOTES · NOUVEAU PALIER</span><DialogTitle>{reward.title}</DialogTitle><DialogDescription>{reward.items.map(item=>item.label).join(" + ")} rejoint ton vestiaire. Ta récompense est acquise pour de bon.</DialogDescription><button className="button primary full" onClick={onWardrobe}>Essayer mon nouveau look<ArrowUpRight size={18}/></button><button className="unlock-continue" onClick={onClose}>Continuer l’aventure</button></div></>}</DialogContent></Dialog>;
}
