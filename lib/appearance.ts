import { COOKIE_AVATARS } from "@/lib/cookie-game";
import { REWARDS } from "@/lib/rewards";
import { CREW, type Profile } from "@/lib/club";
import { readPositions, type AccessoryPositions } from "@/lib/avatar-positions";
import { voterKey } from "@/lib/identity";
export const HATS=[{id:"none",label:"Sans chapeau",emoji:""},{id:"crown",label:"Couronne",emoji:"👑"},{id:"party",label:"Cotillons",emoji:"🎉"},{id:"cap",label:"Casquette",emoji:"🧢"},{id:"wizard",label:"Magicien",emoji:"🎩"},{id:"flower",label:"Fleur",emoji:"🌸"},{id:"graduate",label:"Diplômé",emoji:"🎓"},{id:"rescue",label:"Secouriste",emoji:"⛑"},{id:"military",label:"Aventurier",emoji:"🪖"},{id:"sunhat",label:"Chapeau d’été",emoji:"👒"},...REWARDS.flatMap(r=>r.items.filter(item=>item.slot==="hat"))] as const;
export const EYEWEAR=[{id:"none",label:"Sans lunettes",emoji:""},{id:"sun",label:"Lunettes de soleil",emoji:"🕶️"},{id:"round",label:"Lunettes rondes",emoji:"👓"},{id:"goggles",label:"Masque",emoji:"🥽"}] as const;
export const EXTRAS=[{id:"none",label:"Sans accessoire",emoji:""},{id:"floatie",label:"Bouée",emoji:"🛟"},{id:"headphones",label:"Casque audio",emoji:"🎧"},{id:"scarf",label:"Écharpe",emoji:"🧣"},{id:"bow",label:"Nœud",emoji:"🎀"},{id:"medal",label:"Médaille",emoji:"🏅"},...REWARDS.flatMap(r=>r.items.filter(item=>item.slot==="accessory"))] as const;
export type Look={hat:string;eyewear:string;floatie:number;accessory?:string;animated:number;positions?:AccessoryPositions};
export function extraAccessory(look:Pick<Look,"accessory"|"floatie">){return look.accessory||(look.floatie?"floatie":"none");}
export const DEFAULT_LOOK:Look={hat:"none",eyewear:"none",floatie:0,animated:1};
export const AVATAR_NAMES=["Cheval","Chat","Renard","Panda","Axolotl","Lapin","Loutre","Pingouin","Dragon","Capybara","Grenouille","Licorne","Tigre","Lion","Ours","Koala","Raton laveur","Loup","Chien","Hamster","Écureuil","Hérisson","Paresseux","Alpaga","Chouette","Poussin","Canard","Flamant rose","Perroquet","Chauve-souris","Tortue","Pieuvre","Baleine","Requin","Abeille","Dinosaure","Zèbre","Girafe","Éléphant","Rhinocéros","Hippopotame","Bison","Cerf","Chèvre","Cochon","Vache","Mouton","Tapir","Suricate","Lémurien","Caméléon","Gecko","Toucan","Paon","Papillon","Coccinelle","Escargot","Crabe","Hippocampe","Raie manta",...COOKIE_AVATARS.map(a=>a.name)];
export function avatarIndex(name:string,profiles:Profile[]){const index=profiles.find(p=>p.authorKey===voterKey(name))?.avatar??Math.max(0,CREW.findIndex(n=>voterKey(n)===voterKey(name)));return index>=0&&index<AVATAR_NAMES.length?index:0;}
export function lookFor(name:string,profiles:Profile[]):Look{const p=profiles.find(p=>p.authorKey===voterKey(name));return {hat:p?.hat||"none",eyewear:p?.eyewear||"none",floatie:p?.floatie??0,accessory:p?.accessory||(p?.floatie?"floatie":"none"),animated:p?.animated??1,positions:readPositions(p?.positions)};}
export function avatarSheet(index:number){
  if(index>=78){const i=index-78;return {url:"/cookie-avatars-v25.webp",frame:{x:(i%4)/4,y:Math.floor(i/4)/3,width:1/4,height:1/3}};}
  if(index>=66){const i=index-66;return {url:"/cookie-avatars-v14.webp",frame:{x:(i%4)/4,y:Math.floor(i/4)/3,width:1/4,height:1/3}};}
  if(index>=60){const i=index-60;return {url:"/cookie-avatars.webp",frame:{x:(i%3)/3,y:Math.floor(i/3)/2,width:1/3,height:1/2}};}
  if(index>=36){const i=index-36,x=[0,261,512,768,1024,1280,1536],y=[0,259,513,758,1024],col=i%6,row=Math.floor(i/6);return {url:"/kawaii-avatars-more.webp",frame:{x:(x[col]+2)/1536,y:(y[row]+2)/1024,width:(x[col+1]-x[col]-4)/1536,height:(y[row+1]-y[row]-4)/1024}};}
  const extra=index>=12,columns=extra?6:4,rows=extra?4:3,cell=extra?index-12:index;return {url:extra?"/kawaii-avatars-extra.webp":"/kawaii-avatars.webp",frame:{x:(cell%columns)/columns,y:Math.floor(cell/columns)/rows,width:1/columns,height:1/rows}};
}
export function reactAvatar(name:string,kind:"yes"|"no"|"hello"="hello"){window.dispatchEvent(new CustomEvent("jacuzzi:avatar",{detail:{name:voterKey(name),kind}}));}
