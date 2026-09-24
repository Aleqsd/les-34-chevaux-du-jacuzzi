"use client";
import { EmojiImage } from "@/components/emoji-image";
import { useRef,useState } from "react";
import { Check, ChevronDown, LoaderCircle, Sparkles } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ACTIVITY_EMOJIS,activityEmoji,activityEmojiLabel,suggestActivityEmoji } from "@/lib/activity-emoji";
import type { Proposal } from "@/lib/club";
import type { SocialProps } from "@/components/crew-social";

export function ActivityEmojiBadge({proposal,className=""}:{proposal:Pick<Proposal,"title"|"emoji">;className?:string}){return <span className={`activity-emoji ${className}`} aria-hidden="true"><EmojiImage emoji={activityEmoji(proposal)}/></span>;}

export function ActivityEmojiPicker({title,value,onChange,disabled=false}:{title:string;value:string|null;onChange:(value:string|null)=>void;disabled?:boolean}){
  const resolved=value||suggestActivityEmoji(title);
  return <div className="activity-emoji-picker"><div className="emoji-picker-preview"><span className="activity-emoji" aria-hidden="true" key={resolved}><EmojiImage emoji={resolved}/></span><div><strong>L’emoji de l’activité</strong><span>{value?"Choisi par toi":"Suggéré selon le nom"} · {activityEmojiLabel(resolved)}</span></div></div><details><summary>Choisir un autre emoji<ChevronDown size={16}/></summary><RadioGroup className="activity-emoji-grid" value={value||"auto"} onValueChange={choice=>onChange(choice==="auto"?null:choice)} disabled={disabled} aria-label="Emoji de l’activité"><label className="emoji-choice emoji-auto"><RadioGroupItem className="emoji-radio" value="auto" aria-label="Suggestion automatique"/><span aria-hidden="true"><Sparkles size={16}/>Auto</span></label>{ACTIVITY_EMOJIS.map(option=><label className="emoji-choice" key={option.emoji} title={option.label}><RadioGroupItem className="emoji-radio" value={option.emoji} aria-label={option.label}/><span aria-hidden="true"><EmojiImage emoji={option.emoji}/></span></label>)}</RadioGroup></details></div>;
}

export function ActivityEmojiEditor({proposal,...s}:SocialProps&{proposal:Proposal}){
  const [open,setOpen]=useState(false);const [draft,setDraft]=useState<string|null>(proposal.emoji||null);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [saved,setSaved]=useState(false);const guard=useRef(false);
  const submit=()=>s.identify(async author=>{if(guard.current)return;guard.current=true;setBusy(true);setError("");try{await s.save({action:"activityEmoji",proposalId:proposal.id,author,emoji:draft});setOpen(false);setSaved(true);}catch(e){setError((e as Error).message);}finally{guard.current=false;setBusy(false);}});
  return <section className="activity-emoji-editor" aria-label="Personnaliser l’emoji de cette activité">{open?<><ActivityEmojiPicker title={proposal.title} value={draft} onChange={setDraft} disabled={busy}/><div className="emoji-editor-actions"><button className="button secondary" disabled={busy} onClick={()=>setOpen(false)}>Annuler</button><button className="button primary" disabled={busy} onClick={submit}>{busy?<LoaderCircle size={16} className="spin"/>:<Check size={16}/>} {busy?"Enregistrement…":"Enregistrer l’emoji"}</button></div>{error&&<p role="alert" className="form-error">{error}</p>}</>:<button className="emoji-edit-trigger" onClick={()=>{setDraft(proposal.emoji||null);setOpen(true);setSaved(false);setError("");}}><ActivityEmojiBadge proposal={proposal}/><span><strong>{activityEmojiLabel(activityEmoji(proposal))}</strong><small>Changer l’emoji</small></span><ChevronDown size={18}/></button>}{saved&&<p className="inline-success" role="status"><Check size={15}/>Emoji enregistré pour tout le crew.</p>}</section>;
}
