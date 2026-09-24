"use client";
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Check, LoaderCircle, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Profile } from "@/lib/club";
import { voterKey } from "@/lib/identity";
import { AVATAR_NAMES, DEFAULT_LOOK, EYEWEAR, HATS, avatarIndex, avatarSheet, lookFor, reactAvatar, type Look } from "@/lib/appearance";
import type { SocialProps } from "@/components/crew-social";
import { toast } from "sonner";
export { AVATAR_NAMES, avatarIndex } from "@/lib/appearance";
export const AvatarContext=createContext<Profile[]>([]);

export function CrewAvatar({name,small=false,index,className="",look,imageUrl}:{name:string;small?:boolean;index?:number;className?:string;look?:Look;imageUrl?:string}){
  const profiles=useContext(AvatarContext),profile=profiles.find(p=>p.authorKey===voterKey(name));
  const i=index??avatarIndex(name,profiles),sheet=avatarSheet(i),outfit=look??(index===undefined?lookFor(name,profiles):{...DEFAULT_LOOK,animated:0});
  const custom=imageUrl??(index===undefined?profile?.imageUrl:"");
  const [failed,setFailed]=useState(false),[reaction,setReaction]=useState("");const expiry=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>setFailed(false),[custom]);
  useEffect(()=>{if(!outfit.animated||index!==undefined)return;const react=(event:Event)=>{const d=(event as CustomEvent).detail;if(d?.name!==voterKey(name)||matchMedia("(prefers-reduced-motion: reduce)").matches)return;clearTimeout(expiry.current);setReaction("");requestAnimationFrame(()=>setReaction(d.kind));expiry.current=setTimeout(()=>setReaction(""),1200);};window.addEventListener("jacuzzi:avatar",react);return()=>{clearTimeout(expiry.current);window.removeEventListener("jacuzzi:avatar",react);};},[name,outfit.animated,index]);
  return <span title={name} className={`avatar avatar-shell ${small?"small":""} ${outfit.animated?"animated-avatar":""} ${reaction?`avatar-react-${reaction}`:""} ${className}`}>
    <span className={`avatar-face kawaii-avatar ${i>=12?"extra-avatar":""}`} style={{backgroundPosition:`${(sheet.cell%sheet.columns)/(sheet.columns-1)*100}% ${Math.floor(sheet.cell/sheet.columns)/(sheet.rows-1)*100}%`} as CSSProperties}>{custom&&!failed&&<img src={custom} alt="" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>}</span>
    {outfit.hat!=="none"&&<span aria-hidden="true" className={`avatar-accessory avatar-hat hat-${outfit.hat}`}>{HATS.find(h=>h.id===outfit.hat)?.emoji}</span>}
    {outfit.eyewear!=="none"&&<span aria-hidden="true" className="avatar-accessory avatar-glasses">{EYEWEAR.find(h=>h.id===outfit.eyewear)?.emoji}</span>}
    {!!outfit.floatie&&<span aria-hidden="true" className="avatar-accessory avatar-floatie">🛟</span>}
    {reaction&&<span className="avatar-reaction-symbol" aria-hidden="true">{reaction==="yes"?"💚":reaction==="no"?"💭":"✨"}</span>}
  </span>;
}

export function AvatarEditor({open,onClose,...s}:SocialProps&{open:boolean;onClose:()=>void}){
  const [selected,setSelected]=useState(0),[url,setUrl]=useState(""),[outfit,setOutfit]=useState<Look>(DEFAULT_LOOK),[busy,setBusy]=useState(false),[error,setError]=useState("");const guard=useRef(false);
  useEffect(()=>{if(open){const p=s.state.profiles.find(p=>p.authorKey===voterKey(s.person));setSelected(avatarIndex(s.person,s.state.profiles));setOutfit(lookFor(s.person,s.state.profiles));setUrl(p?.imageUrl||"");setError("");}},[open,s.person]);
  const submit=(e:FormEvent)=>{e.preventDefault();if(guard.current)return;s.identify(async author=>{if(guard.current)return;guard.current=true;setBusy(true);setError("");try{await s.save({action:"profile",author,avatar:selected,imageUrl:url.trim(),...outfit,floatie:!!outfit.floatie,animated:!!outfit.animated});onClose();reactAvatar(author);toast.success(`Nouveau look enregistré pour ${author} !`);}catch(e){setError((e as Error).message);}finally{setBusy(false);guard.current=false;}});};
  return <Dialog open={open} onOpenChange={v=>{if(!v&&!busy)onClose();}}><DialogContent className="club-dialog avatar-dialog"><span className="dialog-kicker"><Sparkles size={18}/>LE VESTIAIRE DU CREW</span><DialogTitle>Un look de légende.</DialogTitle><DialogDescription>36 compagnons, tes accessoires et une bonne dose de personnalité. Ton look est partagé avec tout le crew.</DialogDescription>
    <form onSubmit={submit}><div className="avatar-dressing-preview"><CrewAvatar name={s.person||"Ton avatar"} index={selected} look={outfit} imageUrl={url} className="dressing-avatar"/><div><strong>{s.person||"Ton prénom"}</strong><span>{url?"Ton image":AVATAR_NAMES[selected]}</span><small>{outfit.animated?"Survole ton avatar pour le faire danser.":"Mode tranquille : les animations sont désactivées."}</small></div></div>
      <fieldset disabled={busy} className="outfit-fields"><legend>La touche finale</legend>{[{key:"hat",label:"Sur la tête",items:HATS},{key:"eyewear",label:"Les lunettes",items:EYEWEAR}].map(category=><div className="outfit-category" key={category.key}><span>{category.label}</span><RadioGroup value={outfit[category.key as "hat"|"eyewear"]} onValueChange={value=>setOutfit(o=>({...o,[category.key]:value}))} className="outfit-options" aria-label={category.label}>{category.items.map(item=><label key={item.id} className={outfit[category.key as "hat"|"eyewear"]===item.id?"chosen":""}><RadioGroupItem value={item.id} aria-label={item.label}/><span aria-hidden="true">{item.emoji||"✕"}</span><small>{item.label}</small></label>)}</RadioGroup></div>)}
      <div className="outfit-switch"><label htmlFor="avatar-floatie">La bouée du jacuzzi</label><Switch id="avatar-floatie" checked={!!outfit.floatie} onCheckedChange={v=>setOutfit(o=>({...o,floatie:Number(v)}))}/></div><div className="outfit-switch"><label htmlFor="avatar-motion">Danses et réactions animées</label><Switch id="avatar-motion" checked={!!outfit.animated} onCheckedChange={v=>setOutfit(o=>({...o,animated:Number(v)}))}/></div></fieldset>
      <details className="avatar-gallery" open><summary>Choisir son compagnon <span>36 avatars</span></summary><div className="avatar-picker" role="group" aria-label="Choisir un avatar kawaii">{AVATAR_NAMES.map((name,i)=><button key={name} disabled={busy} type="button" aria-pressed={selected===i&&!url} aria-label={name} className={selected===i&&!url?"selected":""} onClick={()=>{setSelected(i);setUrl("");}}><CrewAvatar name={name} index={i}/><span>{name}</span>{selected===i&&!url&&<Check size={16}/>}</button>)}</div></details>
      <label className="custom-avatar-label">Ou le lien de ton image<input disabled={busy} type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…/mon-avatar.png" maxLength={1000}/></label><p className="fine-print">Image publique en HTTPS. Les accessoires s’appliquent aussi à ton image. Les animations respectent les préférences de ton appareil.</p>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button primary full" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<Check size={18}/>}Enregistrer mon look</button>
    </form></DialogContent></Dialog>;
}
