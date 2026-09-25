"use client";
import { COOKIE_AVATARS,COOKIE_ACHIEVEMENTS } from "@/lib/cookie-game";
import { CrewAvatar } from "@/components/crew-avatar";
import { CookieItemIcon } from "@/components/cookie-icons";
import {X} from "lucide-react";
export function CookieUnlockNotice({ids,onClose}:{ids:string[];onClose:()=>void}){
 return <div className="cookie-unlock-notice" role="status" aria-live="polite" aria-atomic="true"><span className="cookie-notice-kicker">{ids.length>1?ids.length+" NOUVEAUX DÉBLOCAGES":"NOUVEAU DÉBLOCAGE"}</span><button className="cookie-notice-close" aria-label="Fermer les déblocages" onClick={onClose}><X size={17}/></button>{ids.slice(0,2).map(id=>{const avatar=COOKIE_AVATARS.find(a=>"avatar"+a.index===id),achievement=COOKIE_ACHIEVEMENTS.find(a=>a.id===id);return <div className="cookie-notice-row" key={id}>{avatar?<CrewAvatar name={avatar.name} index={avatar.index}/>:<CookieItemIcon kind="achievement" id={id} size={23}/>}<div><strong>{avatar?.name??achievement?.name}</strong><span>{avatar?"Avatar ajouté au vestiaire":"Succès Cookie Jacuzzi"}</span></div></div>;})}<p>{ids.length>2?`Et ${ids.length-2} autres. `:""}À retrouver dans Succès / Avatars.</p><span className="cookie-notice-shine" aria-hidden="true"/></div>;
}
