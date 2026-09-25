"use client";
import {Crown,ArrowUpRight,Sparkles} from "lucide-react";
import {FINAL_COOKIE_AVATAR,formatCookies,type CookiePlayer} from "@/lib/cookie-game";
import {cookieFinaleIssueUrl,cookieFinaleProgress} from "@/lib/cookie-finale";
import release from "@/lib/site-release.json";
import {CrewAvatar} from "@/components/crew-avatar";

export function CookieFinale({player,onWardrobe}:{player:CookiePlayer|null;onWardrobe:()=>void}){
 const issue=cookieFinaleIssueUrl(player,release.version);
 const progress=cookieFinaleProgress(player);
 if(progress===null)return null;
 if(!issue)return <section className="cookie-finale-road" aria-label="Dernière ligne droite">
  <div className="cookie-finale-road-heading"><Crown size={20} aria-hidden="true"/><strong>Dernière ligne droite</strong></div>
  <p>Le Gardien de la dernière miette t’attend.</p>
  <div className="cookie-finale-road-goal"><span>{formatCookies(player!.lifetime)} produits</span><b>Objectif 10<sup>153</sup></b></div>
  <progress max={1} value={progress} aria-label="Progression des paliers de la dernière ligne droite" aria-valuetext={`${formatCookies(player!.lifetime)} cookies produits. Paliers de 10 puissance 147 à 10 puissance 153.`}/>
  <div className="cookie-finale-road-scale"><span>10<sup>147</sup></span><span>Chaque palier multiplie le total par 10</span><span>10<sup>153</sup></span></div>
 </section>;
 return <section className="cookie-finale" aria-label="Fin de progression atteinte">
  <div className="cookie-finale-portrait"><CrewAvatar name={FINAL_COOKIE_AVATAR.name} index={FINAL_COOKIE_AVATAR.index}/><span><Crown size={15}/> LÉGENDE FINALE</span></div>
  <span className="eyebrow">LA DERNIÈRE MIETTE</span>
  <h3>Tu es au bout de l’infini.</h3>
  <p><b>10<sup>153</sup> cookies produits.</b> L’aventure est accomplie. Ce gardien reste acquis après chaque prestige. Tu peux continuer à faire grandir ton score.</p>
  <button className="button secondary full" onClick={onWardrobe}><Sparkles size={16}/>Retrouver mon avatar</button>
  <a className="button primary full" href={issue} target="_blank" rel="noopener noreferrer">Demander la suite<ArrowUpRight size={17}/></a>
  <small>Une issue GitHub préremplie, à compléter et envoyer.</small>
 </section>;
}
