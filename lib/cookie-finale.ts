import {cookieAtCap,type CookiePlayer} from "@/lib/cookie-game";

/** No player identity or save is sent: GitHub opens an editable draft. */
export function cookieFinaleIssueUrl(player:Pick<CookiePlayer,"lifetime">|null,version:string){
 if(!cookieAtCap(player))return null;
 const query=new URLSearchParams({
  title:"Cookie Jacuzzi : plafond atteint, envie de nouveaux contenus !",
  body:["## Fin de progression atteinte","J’ai atteint le plafond de 10^200 cookies produits dans Cookie Jacuzzi.","","Version du jeu : "+version,"","## Ce que j’aimerais pour la suite","Décris ici les contenus ou les défis que tu aimerais découvrir.","","## Mon aventure","Un moment préféré, une idée ou un retour sur la fin du jeu ?"].join("\n")
 });
 return "https://github.com/Aleqsd/les-34-chevaux-du-jacuzzi/issues/new?"+query.toString();
}
