"use client";
import {Crown,ArrowUpRight,Sparkles} from "lucide-react";
import {FINAL_COOKIE_AVATAR,type CookiePlayer} from "@/lib/cookie-game";
import {cookieFinaleIssueUrl} from "@/lib/cookie-finale";
import release from "@/lib/site-release.json";
import {CrewAvatar} from "@/components/crew-avatar";

export function CookieFinale({player,onWardrobe}:{player:CookiePlayer|null;onWardrobe:()=>void}){
 const issue=cookieFinaleIssueUrl(player,release.version);
 if(!issue)return null;
 return <section className="cookie-finale" aria-label="Fin de progression atteinte">
  <div className="cookie-finale-portrait"><CrewAvatar name={FINAL_COOKIE_AVATAR.name} index={FINAL_COOKIE_AVATAR.index}/><span><Crown size={15}/> LÉGENDE FINALE</span></div>
  <span className="eyebrow">LA DERNIÈRE MIETTE</span>
  <h3>Tu es au bout de l’infini.</h3>
  <p><b>10<sup>200</sup> cookies produits.</b> Le plafond est atteint. Ce gardien couronne ton aventure et reste acquis après chaque prestige.</p>
  <button className="button secondary full" onClick={onWardrobe}><Sparkles size={16}/>Retrouver mon avatar</button>
  <a className="button primary full" href={issue} target="_blank" rel="noopener noreferrer">Demander la suite<ArrowUpRight size={17}/></a>
  <small>Une issue GitHub préremplie, à compléter et envoyer.</small>
 </section>;
}
