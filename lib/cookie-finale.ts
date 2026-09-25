import {COOKIE_FINALE_START,COOKIE_FINALE_TOTAL,cookieFinished,type CookiePlayer} from "@/lib/cookie-game";

/** Each power of ten is one milestone; this is not the fraction of cookies earned. */
export function cookieFinaleProgress(player:Pick<CookiePlayer,"lifetime">|null){
 if(!player||player.lifetime<COOKIE_FINALE_START)return null;
 return Math.min(1,Math.max(0,(Math.log10(player.lifetime)-Math.log10(COOKIE_FINALE_START))/(Math.log10(COOKIE_FINALE_TOTAL)-Math.log10(COOKIE_FINALE_START))));
}

/** No player identity or save is sent: GitHub opens an editable draft. */
export function cookieFinaleIssueUrl(player:Pick<CookiePlayer,"lifetime">|null,version:string){
 if(!cookieFinished(player))return null;
 const query=new URLSearchParams({
  title:"Cookie Jacuzzi : aventure terminée, envie de nouveaux contenus !",
  body:["## Fin de progression atteinte","J’ai atteint la fin de l’aventure à 10^153 cookies produits dans Cookie Jacuzzi.","","Version du jeu : "+version,"","## Ce que j’aimerais pour la suite","Décris ici les contenus ou les défis que tu aimerais découvrir.","","## Mon aventure","Un moment préféré, une idée ou un retour sur la fin du jeu ?"].join("\n")
 });
 return "https://github.com/Aleqsd/les-34-chevaux-du-jacuzzi/issues/new?"+query.toString();
}
