export const BUILDINGS=[
 {id:"spoon",name:"Cuillère enchantée",description:"Elle mélange même quand tu dors.",price:15,cps:.1},
 {id:"oven",name:"Four de poche",description:"Petit four, grandes ambitions.",price:100,cps:1},
 {id:"crew",name:"Cuisine du crew",description:"Onze tabliers, aucune recette respectée.",price:1500,cps:8},
 {id:"bakery",name:"Fournil du jacuzzi",description:"La vapeur fait lever la pâte.",price:25000,cps:60},
 {id:"cocoa",name:"Ferme de cacao",description:"Du chocolat à perte de vue.",price:400000,cps:450},
 {id:"caramel",name:"Usine de caramel",description:"La rivière coule enfin dans le bon sens.",price:6e6,cps:3500},
 {id:"lab",name:"Labo croustillant",description:"La science au service du goûter.",price:1e8,cps:25000},
 {id:"portal",name:"Portail pâtissier",description:"Les fournées arrivent d’une autre dimension.",price:1.8e9,cps:180000},
 {id:"planet",name:"Planète biscuit",description:"Une orbite entièrement comestible.",price:3.5e10,cps:1300000},
 {id:"galaxy",name:"Galaxie des 34",description:"34 chevaux. Des milliards de miettes.",price:1e12,cps:1e7}
] as const;
export type Upgrade={id:string;name:string;price:number;building?:number;owned?:number;requires?:string;clicks?:number;earned?:number;clickMultiplier?:number;clickTotalMultiplier?:number;share?:number;description:string};
export const UPGRADES:Upgrade[]=[
 ...BUILDINGS.map((b,i)=>({id:b.id+"_double",name:b.name+" · recette secrète",price:b.price*20,building:i,owned:10,description:"Double la production de ce bâtiment."})),
 ...BUILDINGS.slice(4).map((b,i)=>({id:b.id+"_master",name:b.name+" · légendaire",price:b.price*250,building:i+4,owned:25,requires:b.id+"_double",description:"Double encore la production de ce bâtiment."})),
 {id:"thumb",name:"Pouce pâtissier",price:50,clicks:25,clickMultiplier:2,description:"Double la puissance de base du clic."},
 {id:"hooves",name:"Deux sabots valent mieux qu’un",price:500,clicks:100,clickMultiplier:3,description:"Triple la puissance de base du clic."},
 {id:"rhythm",name:"Rythme du crew",price:750,earned:1000,share:.1,description:"Ajoute 10 % de la production par seconde à chaque clic."},
 {id:"cadence",name:"Cadence galactique",price:1e5,earned:1e5,share:.15,description:"Ajoute 15 % de la production par seconde à chaque clic (35 % avec Rythme du crew)."}
 ,...BUILDINGS.slice(0,4).map((b,i)=>({id:b.id+"_master",name:b.name+" · légendaire",price:b.price*250,building:i,owned:25,requires:b.id+"_double",description:"Double encore la production de ce bâtiment."})),
 ...BUILDINGS.map((b,i)=>({id:b.id+"_signature",name:b.name+" · signature du chef",price:b.price*1200,building:i,owned:50,requires:b.id+"_master",description:"Double la production après la recette légendaire. Un atelier à son sommet."})),
 {id:"whisk",name:"Fouet électrique",price:1e6,clicks:2000,clickTotalMultiplier:1.25,description:"Augmente de 25 % tout le gain du clic, manuel comme automatique."},
 {id:"mixer",name:"Batteur à réaction",price:1e9,clicks:15000,clickTotalMultiplier:1.25,requires:"whisk",description:"Augmente encore de 25 % tout le gain du clic."},
 {id:"thunder",name:"Sabots de tonnerre",price:1e12,clicks:50000,clickTotalMultiplier:1.25,requires:"mixer",description:"Augmente de 25 % tout le gain du clic. Le crew fait trembler les fours."},
 {id:"starlight",name:"Toucher des étoiles",price:1e15,clicks:100000,clickTotalMultiplier:1.25,requires:"thunder",description:"Ajoute un dernier bonus de 25 % à tout le gain du clic."},
 {id:"pulse",name:"Pulsation pâtissière",price:1e8,earned:1e8,share:.15,requires:"cadence",description:"Ajoute 15 % de ta production par seconde à chaque clic."},
 {id:"resonance",name:"Résonance du jacuzzi",price:1e12,earned:1e12,share:.25,requires:"pulse",description:"Ajoute 25 % de ta production par seconde à chaque clic (75 % avec toutes les recettes)."}
];
export const COOKIE_AVATARS=[{index:60,name:"Petit Biscuit",threshold:1},{index:61,name:"Donut fraise",threshold:1000},{index:62,name:"Croissant doré",threshold:1e6},{index:63,name:"Cupcake étoilé",threshold:1e9},{index:64,name:"Macaron cosmique",threshold:1e12},{index:65,name:"Roi Cacao",threshold:1e15},
 {index:66,name:"Mochi pêche",threshold:100},{index:67,name:"Chou chantilly",threshold:1e4},{index:68,name:"Gaufre miel",threshold:1e5},{index:69,name:"Pancake fraise",threshold:1e7},{index:70,name:"Éclair chocolat",threshold:1e8},{index:71,name:"Glace pistache",threshold:1e10},{index:72,name:"Bretzel caramel",threshold:1e11},{index:73,name:"Renard pâtissier",threshold:1e13},{index:74,name:"Chat barista",threshold:1e14},{index:75,name:"Dragon flambé",threshold:1e16},{index:76,name:"Licorne bonbon",threshold:1e17},{index:77,name:"Cheval stellaire",threshold:1e18}];
export const latestCookieAvatar=(lifetime:number)=>COOKIE_AVATARS.reduce((best,a)=>a.threshold<=lifetime&&a.threshold>best.threshold?a:best,COOKIE_AVATARS[0]);
export type CookiePlayer={balance:number;lifetime:number;runEarned:number;banked:number;clicks:number;buildings:number[];upgrades:string[];prestige:number;resets:number;maxBuildings:number;goldenClicks:number;rushUntil:number;goldenReadyAt:number;achievements:string[];missions:string[];clickCredit:number;autoCredit?:number;nextEventAt?:number;maxRecipes?:number;maxBuildingKinds?:number;maxProduction?:number;rebuild?:{run:number;claimed:string[]};updated:number;version:number};
export const freshCookiePlayer=(now:number):CookiePlayer=>({balance:0,lifetime:0,runEarned:0,banked:0,clicks:0,buildings:BUILDINGS.map(()=>0),upgrades:[],prestige:0,resets:0,maxBuildings:0,goldenClicks:0,rushUntil:0,goldenReadyAt:now+60000,achievements:[],missions:[],clickCredit:25,updated:now,version:0});
type Metric="lifetime"|"clicks"|"maxBuildings"|"prestige"|"goldenClicks"|"recipes"|"buildingKinds"|"production";
export const COOKIE_ACHIEVEMENTS: {id:string;name:string;metric:Metric;target:number}[]=[
 ...[1,100,1e3,1e4,1e5,1e6,1e8,1e9,1e12,1e15].map((target,i)=>({id:"bake"+i,metric:"lifetime" as const,target,name:["La première miette","Une petite fournée","Ça sent bon","La réserve du crew","Le four ne dort jamais","Millionnaire en miettes","Le jacuzzi déborde","L’empire croustillant","Une planète à croquer","L’infini dans une boîte"][i]})),
 ...[1,25,100,500,1000,5000,20000,100000].map((target,i)=>({id:"click"+i,metric:"clicks" as const,target,name:["Premier coup de sabot","Le bon rythme","Cent fois oui","Pouce d’or","Mille et une miettes","Batteur du crew","Sabots infatigables","Légende du clic"][i]})),
 ...[1,10,25,50,100,250,500,1000].map((target,i)=>({id:"build"+i,metric:"maxBuildings" as const,target,name:["Première installation","Petit atelier","Le quartier pâtissier","La grande fournée","Cent fours et un jacuzzi","Réseau gourmand","Architecte du croustillant","Métropole biscuit"][i]})),
 ...[1,5,25,100].map((target,i)=>({id:"prestige"+i,metric:"prestige" as const,target,name:["Nouveau départ","La recette traverse le temps","Maître des fournées","Éternel pâtissier"][i]}))
 ,...[1,5,15,34,100,250].map((target,i)=>({id:"golden"+i,metric:"goldenClicks" as const,target,name:["Une touche d’or","Chercheur d’or","Chasseur de soleil","34 pépites","Ruée vers le goûter","Alchimiste du cookie"][i]})),
 ...[1,5,10,20,30,40].map((target,i)=>({id:"recipe"+i,metric:"recipes" as const,target,name:["La recette du bonheur","Carnet gourmand","Le chef improvise","Livre de famille","Bibliothèque pâtissière","Toutes les saveurs"][i]})),
 ...[3,5,8,10].map((target,i)=>({id:"diversity"+i,metric:"buildingKinds" as const,target,name:["Trois façons de cuire","Atelier polyvalent","Voyage des saveurs","La chaîne complète"][i]})),
 ...[1,10,1000,1e5,1e7,1e9].map((target,i)=>({id:"flow"+i,metric:"production" as const,target,name:["Ça tourne tout seul","Fournée continue","Cascade de cookies","Torrent gourmand","Océan de chocolat","Le temps se croque"][i]})),
 ...[250,1000,10000,100000].map((target,i)=>({id:"prestige"+(i+4),metric:"prestige" as const,target,name:["Constellation du chef","Mille soleils","Maître du multivers","Au-delà des fournées"][i]})),
 ...[1e16,1e17,1e18,1e20].map((target,i)=>({id:"bake"+(i+10),metric:"lifetime" as const,target,name:["Un dragon dans le four","Nuage de bonbons","La chevauchée stellaire","Le goûter de l’éternité"][i]}))
];
export const COOKIE_MISSIONS=[{id:"m1",name:"Prendre le rythme",metric:"clicks",target:25,reward:25},{id:"m2",name:"Premier atelier",metric:"maxBuildings",target:5,reward:100},{id:"m3",name:"Le premier millier",metric:"lifetime",target:1000,reward:250},{id:"m4",name:"Les mains dans la pâte",metric:"clicks",target:500,reward:1500},{id:"m5",name:"Cuisine collective",metric:"maxBuildings",target:25,reward:1e4},{id:"m6",name:"Une cargaison de cookies",metric:"lifetime",target:1e6,reward:1e5},{id:"m7",name:"La grande manufacture",metric:"maxBuildings",target:100,reward:1e7},{id:"m8",name:"Le milliard croustillant",metric:"lifetime",target:1e9,reward:1e8},{id:"m9",name:"Retour aux fourneaux",metric:"prestige",target:1,reward:1e6},{id:"m10",name:"L’archipel des fours",metric:"maxBuildings",target:250,reward:1e10},{id:"m11",name:"Une galaxie au goûter",metric:"lifetime",target:1e12,reward:1e11},{id:"m12",name:"La recette éternelle",metric:"prestige",target:25,reward:1e12},
 {id:"m13",name:"Trois ateliers, une équipe",metric:"buildingKinds",target:3,reward:500},
 {id:"m14",name:"Une première pépite",metric:"goldenClicks",target:1,reward:100},
 {id:"m15",name:"Le carnet du chef",metric:"recipes",target:3,reward:500},
 {id:"m16",name:"Quinze instants dorés",metric:"goldenClicks",target:15,reward:25000},
 {id:"m17",name:"Toutes les cuissons",metric:"buildingKinds",target:5,reward:100000},
 {id:"m18",name:"Dix secrets bien gardés",metric:"recipes",target:10,reward:50000},
 {id:"m19",name:"L’or des 34 chevaux",metric:"goldenClicks",target:34,reward:100000},
 {id:"m20",name:"La cuisine des dimensions",metric:"buildingKinds",target:8,reward:1e8},
 {id:"m21",name:"L’encyclopédie du goûter",metric:"recipes",target:20,reward:1e7},
 {id:"m22",name:"Le siècle des étoiles",metric:"prestige",target:100,reward:1e10},
 {id:"m23",name:"Un goûter pour les dragons",metric:"lifetime",target:1e16,reward:1e13},
 {id:"m24",name:"Le club des mille soleils",metric:"prestige",target:1000,reward:1e12}
] as const;
export const METRIC_LABELS:Record<Metric,string>={lifetime:"cookies produits",clicks:"clics",maxBuildings:"bâtiments possédés",prestige:"étoiles de prestige",goldenClicks:"cookies dorés récoltés",recipes:"recettes maîtrisées",buildingKinds:"types de bâtiments réunis",production:"cookies / s atteints (hors bonus)"};
export function formatCookies(n:number){if(n>=1e15)return n.toExponential(2).replace(".",",");if(n>=1e12)return (n/1e12).toLocaleString("fr-FR",{maximumFractionDigits:2})+" T";if(n>=1e9)return (n/1e9).toLocaleString("fr-FR",{maximumFractionDigits:2})+" Md";if(n>=1e6)return (n/1e6).toLocaleString("fr-FR",{maximumFractionDigits:2})+" M";return n.toLocaleString("fr-FR",{maximumFractionDigits:n<10?1:0});}
export const formatClickPower=(n:number)=>n<100?n.toLocaleString("fr-FR",{maximumFractionDigits:2}):formatCookies(n);
export function baseProduction(p:CookiePlayer){return BUILDINGS.reduce((sum,b,i)=>sum+b.cps*p.buildings[i]*UPGRADES.filter(u=>u.building===i&&p.upgrades.includes(u.id)).reduce(n=>n*2,1),0)*(1+p.prestige*.1);}
export const production=(p:CookiePlayer,now=Date.now())=>baseProduction(p)*(p.rushUntil>now?7:1);
export const clickProductionShare=(p:CookiePlayer)=>.1+UPGRADES.filter(u=>u.share&&p.upgrades.includes(u.id)).reduce((n,u)=>n+u.share!,0);
export function clickPower(p:CookiePlayer,now=Date.now()){return ((1+p.prestige*.1)*UPGRADES.filter(u=>u.clickMultiplier&&p.upgrades.includes(u.id)).reduce((n,u)=>n*u.clickMultiplier!,1)+production(p,now)*clickProductionShare(p))*UPGRADES.filter(u=>u.clickTotalMultiplier&&p.upgrades.includes(u.id)).reduce((n,u)=>n*u.clickTotalMultiplier!,1);}
export function buildingPrice(p:CookiePlayer,index:number,quantity:number){const b=BUILDINGS[index];return Math.ceil(b.price*Math.pow(1.15,p.buildings[index])*(Math.pow(1.15,quantity)-1)/.15);}
export function upgradeReady(p:CookiePlayer,u:Upgrade){return (u.building===undefined||p.buildings[u.building]>=(u.owned??0))&&(!u.requires||p.upgrades.includes(u.requires))&&p.clicks>=(u.clicks??0)&&p.lifetime>=(u.earned??0);}
export const prestigeGain=(p:CookiePlayer)=>Math.max(0,Math.floor(Math.sqrt((p.banked+p.runEarned)/1e9))-p.prestige);
export function cookieMetric(p:CookiePlayer,metric:Metric){if(metric==="recipes")return Math.max(p.maxRecipes??0,p.upgrades.length);if(metric==="buildingKinds")return Math.max(p.maxBuildingKinds??0,p.buildings.filter(n=>n>0).length);if(metric==="production")return Math.max(p.maxProduction??0,baseProduction(p));return p[metric];}
export function award(p:CookiePlayer){p.maxRecipes=cookieMetric(p,"recipes");p.maxBuildingKinds=cookieMetric(p,"buildingKinds");p.maxProduction=cookieMetric(p,"production");p.maxBuildings=Math.max(p.maxBuildings,p.buildings.reduce((a,b)=>a+b,0));p.achievements=[...new Set([...p.achievements,...COOKIE_ACHIEVEMENTS.filter(a=>cookieMetric(p,a.metric)>=a.target).map(a=>a.id)])];}
const CAP=1e30;
export const REBUILD_MISSIONS=[
 {id:"r1",name:"Rallumer les fours",metric:"buildings",target:5,reward:500},
 {id:"r2",name:"Retrouver le tour de main",metric:"recipes",target:1,reward:500},
 {id:"r3",name:"Reformer la brigade",metric:"buildings",target:25,reward:12500},
 {id:"r4",name:"Réouvrir le carnet",metric:"recipes",target:5,reward:25000},
 {id:"r5",name:"Relancer la grande cuisine",metric:"buildings",target:50,reward:50000},
 {id:"r6",name:"Le retour du chef",metric:"buildings",target:100,reward:250000}
] as const;
export const rebuildStarter=(stars:number)=>Math.floor(Math.min(1e6,250*(1+stars*.1)));
export const rebuildReward=(p:CookiePlayer,base:number)=>Math.floor(base*Math.min(10,1+p.prestige*.1));
export const rebuildMetric=(p:CookiePlayer,metric:"buildings"|"recipes")=>metric==="buildings"?p.buildings.reduce((a,b)=>a+b,0):p.upgrades.length;
// Rebuilding grants are spending power, not production: never feed lifetime or prestige.
function grantRebuild(p:CookiePlayer,amount:number){p.balance=Math.min(CAP,p.balance+amount);}
export function ensureRebuild(p:CookiePlayer){
 if(p.prestige<1||p.rebuild?.run===p.resets)return;
 p.rebuild={run:p.resets,claimed:[]};grantRebuild(p,rebuildStarter(p.prestige));
}
export function earn(p:CookiePlayer,amount:number){amount=Math.max(0,Math.min(CAP,amount));p.balance=Math.min(CAP,p.balance+amount);p.lifetime=Math.min(CAP,p.lifetime+amount);p.runEarned=Math.min(CAP,p.runEarned+amount);}
export const AUTO_TIERS=[{clicks:2000,rate:2,name:"Petit pilote"},{clicks:5000,rate:4,name:"Double cadence"},{clicks:15000,rate:6,name:"Turbo gourmand"},{clicks:50000,rate:10,name:"Vitesse galactique"}] as const;
export const autoClickRate=(clicks:number)=>[...AUTO_TIERS].reverse().find(t=>clicks>=t.clicks)?.rate??0;
export function settle(p:CookiePlayer,now:number){ensureRebuild(p);const end=Math.max(p.updated,now),elapsed=Math.min(end-p.updated,8*3600000),start=p.updated,boosted=Math.max(0,Math.min(start+elapsed,p.rushUntil)-start);const gain=baseProduction(p)*(elapsed+boosted*6)/1000;earn(p,gain);p.clickCredit=Math.min(25,p.clickCredit+(end-p.updated)*.025);const autoRate=autoClickRate(p.clicks);if(autoRate||p.autoCredit!==undefined)p.autoCredit=Math.min(autoRate*2,(p.autoCredit??0)+(end-p.updated)*autoRate/1000);p.updated=end;award(p);return gain;}
export const COOKIE_EVENTS=[
 {id:"comet",name:"Comète sucrée",minimum:50,seconds:20,effect:"cookies",hint:"20 s de production à récolter"},
 {id:"cookie",name:"Biscuit express",minimum:75,seconds:30,effect:"cookies",hint:"30 s de production à récolter"},
 {id:"gift",name:"Cadeau du crew",minimum:100,seconds:40,effect:"cookies",hint:"40 s de production à récolter"},
 {id:"rush",name:"Fournée éclair",minimum:0,seconds:30,effect:"rush",hint:"Production ×7 pendant 30 s"},
 {id:"golden",name:"Ticket doré",minimum:0,seconds:0,effect:"golden",hint:"Ton cookie doré devient prêt"},
 {id:"rain",name:"Pluie de miettes",minimum:250,seconds:120,effect:"cookies",hint:"2 min de production à récolter"}
] as const;
export const EVENT_VISIBLE_MS=22000,EVENT_WINDOW_MS=24000;
export const cookieEvent=(at:number)=>COOKIE_EVENTS[Math.floor(at/1000)%COOKIE_EVENTS.length];
export const cookieEventReward=(p:CookiePlayer,at:number)=>cookieEvent(at).effect==="cookies"?Math.max(cookieEvent(at).minimum,baseProduction(p)*cookieEvent(at).seconds):0;
const scheduleEvent=(p:CookiePlayer,now:number)=>{p.nextEventAt=now+90000+Math.floor(Math.random()*90001);};
export type CookieAction={kind:"sync"}|{kind:"click";count:number}|{kind:"auto";count:number}|{kind:"event";eventAt:number}|{kind:"buy";building:number;quantity:number}|{kind:"upgrade";upgrade:string}|{kind:"golden"}|{kind:"mission";mission:string}|{kind:"rebuild";mission:string;run:number}|{kind:"prestige"};
export function applyCookieAction(p:CookiePlayer,action:CookieAction,now:number){const offline=settle(p,now);let acceptedClicks=0,eventReward=0,rebuildBonus=0,eventEffect:"cookies"|"rush"|"golden"|undefined;
 if(action.kind==="click"){acceptedClicks=Math.min(action.count,Math.floor(p.clickCredit));p.clickCredit-=acceptedClicks;p.clicks+=acceptedClicks;earn(p,acceptedClicks*clickPower(p,now));}
 if(action.kind==="auto"){if(!autoClickRate(p.clicks))throw Error("L’autoclic se débloque à 2 000 clics.");acceptedClicks=Math.min(action.count,Math.floor(p.autoCredit??0));p.autoCredit=(p.autoCredit??0)-acceptedClicks;p.clicks+=acceptedClicks;earn(p,acceptedClicks*clickPower(p,now));}
 if(action.kind==="event"){if(action.eventAt!==p.nextEventAt||now<action.eventAt||now>action.eventAt+EVENT_WINDOW_MS)throw Error("Cette surprise est déjà passée. La prochaine arrive bientôt !");const event=cookieEvent(action.eventAt);eventEffect=event.effect;eventReward=cookieEventReward(p,action.eventAt);if(event.effect==="rush")p.rushUntil=Math.max(p.rushUntil,now+event.seconds*1000);else if(event.effect==="golden")p.goldenReadyAt=Math.min(p.goldenReadyAt,now);else earn(p,eventReward);scheduleEvent(p,now);}
 if(action.kind==="buy"){const cost=buildingPrice(p,action.building,action.quantity);if(p.buildings[action.building]+action.quantity>1000)throw Error("1000 exemplaires maximum par bâtiment.");if(p.balance+1e-6<cost)throw Error("Pas encore assez de cookies.");p.balance=Math.max(0,p.balance-cost);p.buildings[action.building]+=action.quantity;}
 if(action.kind==="upgrade"){const u=UPGRADES.find(u=>u.id===action.upgrade);if(!u||p.upgrades.includes(u.id)||!upgradeReady(p,u))throw Error("Cette amélioration n’est pas disponible.");if(p.balance+1e-6<u.price)throw Error("Pas encore assez de cookies.");p.balance=Math.max(0,p.balance-u.price);p.upgrades.push(u.id);}
 if(action.kind==="golden"){if(now<p.goldenReadyAt)throw Error("Le prochain cookie doré se prépare.");earn(p,Math.max(25,baseProduction(p)*60));p.rushUntil=now+77000;p.goldenReadyAt=now+300000;p.goldenClicks++;}
 if(action.kind==="mission"){const m=COOKIE_MISSIONS.find(m=>m.id===action.mission);if(!m||p.missions.includes(m.id)||cookieMetric(p,m.metric)<m.target)throw Error("Cet objectif n’est pas encore disponible.");p.missions.push(m.id);earn(p,m.reward);}
 if(action.kind==="rebuild"){const m=REBUILD_MISSIONS.find(m=>m.id===action.mission);if(p.prestige<1||action.run!==p.resets||!m||p.rebuild?.claimed.includes(m.id)||rebuildMetric(p,m.metric)<m.target)throw Error("Cet objectif n’est pas disponible pour cette fournée.");p.rebuild!.claimed.push(m.id);rebuildBonus=rebuildReward(p,m.reward);grantRebuild(p,rebuildBonus);}
 if(action.kind==="prestige"){const gain=prestigeGain(p);if(gain<1)throw Error("Produis davantage pour gagner une étoile.");p.prestige+=gain;p.resets++;p.banked=Math.min(CAP,p.banked+p.runEarned);p.balance=0;p.runEarned=0;p.buildings=BUILDINGS.map(()=>0);p.upgrades=[];p.rushUntil=0;p.goldenReadyAt=now+60000;ensureRebuild(p);}
 if(!p.nextEventAt||now>p.nextEventAt+EVENT_WINDOW_MS)scheduleEvent(p,now);
 award(p);return {offline,acceptedClicks,...(rebuildBonus?{rebuildBonus}:{}),...(eventEffect?{eventReward,eventEffect}:{})};
}
