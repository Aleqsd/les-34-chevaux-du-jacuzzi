"use client";
import { COOKIE_AVATARS,COOKIE_ACHIEVEMENTS } from "@/lib/cookie-game";
import { CrewAvatar } from "@/components/crew-avatar";
import { CookieItemIcon } from "@/components/cookie-icons";
export function CookieUnlockNotice({ids}:{ids:string[]}){
 return <div className="cookie-unlock-notice" role="status" aria-live="polite" aria-atomic="true"><span className="cookie-notice-kicker">{ids.length>1?ids.length+" NOUVEAUX DÉBLOCAGES":"NOUVEAU DÉBLOCAGE"}</span>{ids.map(id=>{const avatar=COOKIE_AVATARS.find(a=>"avatar"+a.index===id),achievement=COOKIE_ACHIEVEMENTS.find(a=>a.id===id);return <div className="cookie-notice-row" key={id}>{avatar?<CrewAvatar name={avatar.name} index={avatar.index}/>:<CookieItemIcon kind="achievement" id={id} size={23}/>}<div><strong>{avatar?.name??achievement?.name}</strong><span>{avatar?"Avatar ajouté au vestiaire":"Succès Cookie Jacuzzi"}</span></div></div>;})}<p>À retrouver et rejouer dans Succès / Avatars.</p><span className="cookie-notice-shine" aria-hidden="true"/></div>;
}
