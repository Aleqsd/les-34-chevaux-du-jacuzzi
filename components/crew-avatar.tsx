"use client";
import { createContext, useContext, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Check, LoaderCircle, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CREW, type Profile } from "@/lib/club";
import type { SocialProps } from "@/components/crew-social";
import { toast } from "sonner";
export const AvatarContext=createContext<Profile[]>([]);
export const AVATAR_NAMES=["Cheval","Chat","Renard","Panda","Axolotl","Lapin","Loutre","Pingouin","Dragon","Capybara","Grenouille","Licorne","Tigre","Lion","Ours","Koala","Raton laveur","Loup","Chien","Hamster","Écureuil","Hérisson","Paresseux","Alpaga","Chouette","Poussin","Canard","Flamant rose","Perroquet","Chauve-souris","Tortue","Pieuvre","Baleine","Requin","Abeille","Dinosaure"];
const key=(name:string)=>name.trim().normalize("NFKC").toLocaleLowerCase("fr");
export function avatarIndex(name:string,profiles:Profile[]){return profiles.find(p=>p.authorKey===key(name))?.avatar??Math.max(0,CREW.findIndex(n=>key(n)===key(name)));}
export function CrewAvatar({name,small=false,index,className=""}:{name:string;small?:boolean;index?:number;className?:string}){
  const profiles=useContext(AvatarContext);const profile=profiles.find(p=>p.authorKey===key(name));const raw=index??avatarIndex(name,profiles);const i=raw>=0&&raw<AVATAR_NAMES.length?raw:0;const extra=i>=12;const cell=extra?i-12:i;const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[profile?.imageUrl]);
  return <span title={name} className={`avatar kawaii-avatar ${extra?"extra-avatar":""} ${small?"small":""} ${className}`} style={{backgroundPosition:`${(cell%(extra?6:4))/(extra?5:3)*100}% ${Math.floor(cell/(extra?6:4))/(extra?3:2)*100}%`} as CSSProperties}>{index===undefined&&profile?.imageUrl&&!failed&&<img src={profile.imageUrl} alt="" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>}</span>;
}
export function AvatarEditor({open,onClose,...s}:SocialProps&{open:boolean;onClose:()=>void}){
  const [selected,setSelected]=useState(0);const [url,setUrl]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  useEffect(()=>{if(open){const p=s.state.profiles.find(p=>p.authorKey===key(s.person));setSelected(avatarIndex(s.person,s.state.profiles));setUrl(p?.imageUrl||"");setError("");}},[open,s.person]);
  const submit=(e:FormEvent)=>{e.preventDefault();s.identify(async author=>{setBusy(true);setError("");try{await s.save({action:"profile",author,avatar:selected,imageUrl:url.trim()});onClose();toast.success(`Nouvel avatar enregistré pour ${author} !`);}catch(e){setError((e as Error).message);}finally{setBusy(false);}});};
  return <Dialog open={open} onOpenChange={v=>{if(!v)onClose();}}><DialogContent className="club-dialog avatar-dialog"><span className="dialog-kicker"><Sparkles size={18}/>TON PETIT ALTER EGO</span><DialogTitle>Un max de mignon.</DialogTitle><DialogDescription>36 compagnons kawaii. L’avatar de {s.person||"ton prénom"}, visible partout dans le crew.</DialogDescription><form onSubmit={submit}><div className="avatar-picker" role="group" aria-label="Choisir un avatar kawaii">{AVATAR_NAMES.map((name,i)=><button key={name} disabled={busy} type="button" aria-pressed={selected===i&&!url} aria-label={name} className={selected===i&&!url?"selected":""} onClick={()=>{setSelected(i);setUrl("");}}><CrewAvatar name={name} index={i}/><span>{name}</span>{selected===i&&!url&&<Check size={16}/>}</button>)}</div><label className="custom-avatar-label">Ou le lien de ton image<input disabled={busy} type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…/mon-avatar.png" maxLength={1000}/></label><p className="fine-print">Choisis une image accessible publiquement en HTTPS. Si elle ne charge pas, l’avatar kawaii prend le relais.</p>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button primary full" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<Check size={18}/>}Enregistrer mon avatar</button></form></DialogContent></Dialog>;
}
