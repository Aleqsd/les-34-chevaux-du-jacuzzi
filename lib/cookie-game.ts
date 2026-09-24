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
export type Upgrade={id:string;name:string;price:number;building?:number;owned?:number;requires?:string;clicks?:number;earned?:number;clickMultiplier?:number;share?:number;description:string};
export const UPGRADES:Upgrade[]=[
 ...BUILDINGS.map((b,i)=>({id:b.id+"_double",name:b.name+" · recette secrète",price:b.price*20,building:i,owned:10,description:"Double la production de ce bâtiment."})),
 ...BUILDINGS.slice(4).map((b,i)=>({id:b.id+"_master",name:b.name+" · légendaire",price:b.price*250,building:i+4,owned:25,requires:b.id+"_double",description:"Double encore la production de ce bâtiment."})),
 {id:"thumb",name:"Pouce pâtissier",price:50,clicks:25,clickMultiplier:2,description:"Double la puissance de base du clic."},
 {id:"hooves",name:"Deux sabots valent mieux qu’un",price:500,clicks:100,clickMultiplier:3,description:"Triple la puissance de base du clic."},
 {id:"rhythm",name:"Rythme du crew",price:750,earned:1000,share:.1,description:"Ajoute 10 % de la production par seconde à chaque clic."},
 {id:"cadence",name:"Cadence galactique",price:1e5,earned:1e5,share:.15,description:"Ajoute 15 % de la production par seconde à chaque clic (35 % avec Rythme du crew)."}
];
export const COOKIE_AVATARS=[{index:60,name:"Petit Biscuit",threshold:1},{index:61,name:"Donut fraise",threshold:1000},{index:62,name:"Croissant doré",threshold:1e6},{index:63,name:"Cupcake étoilé",threshold:1e9},{index:64,name:"Macaron cosmique",threshold:1e12},{index:65,name:"Roi Cacao",threshold:1e15}];
export type CookiePlayer={balance:number;lifetime:number;runEarned:number;banked:number;clicks:number;buildings:number[];upgrades:string[];prestige:number;resets:number;maxBuildings:number;goldenClicks:number;rushUntil:number;goldenReadyAt:number;achievements:string[];missions:string[];clickCredit:number;autoCredit?:number;nextEventAt?:number;updated:number;version:number};
export const freshCookiePlayer=(now:number):CookiePlayer=>({balance:0,lifetime:0,runEarned:0,banked:0,clicks:0,buildings:BUILDINGS.map(()=>0),upgrades:[],prestige:0,resets:0,maxBuildings:0,goldenClicks:0,rushUntil:0,goldenReadyAt:now+60000,achievements:[],missions:[],clickCredit:25,updated:now,version:0});
type Metric="lifetime"|"clicks"|"maxBuildings"|"prestige";
export const COOKIE_ACHIEVEMENTS: {id:string;name:string;metric:Metric;target:number}[]=[
 ...[1,100,1e3,1e4,1e5,1e6,1e8,1e9,1e12,1e15].map((target,i)=>({id:"bake"+i,metric:"lifetime" as const,target,name:["La première miette","Une petite fournée","Ça sent bon","La réserve du crew","Le four ne dort jamais","Millionnaire en miettes","Le jacuzzi déborde","L’empire croustillant","Une planète à croquer","L’infini dans une boîte"][i]})),
 ...[1,25,100,500,1000,5000,20000,100000].map((target,i)=>({id:"click"+i,metric:"clicks" as const,target,name:["Premier coup de sabot","Le bon rythme","Cent fois oui","Pouce d’or","Mille et une miettes","Batteur du crew","Sabots infatigables","Légende du clic"][i]})),
 ...[1,10,25,50,100,250,500,1000].map((target,i)=>({id:"build"+i,metric:"maxBuildings" as const,target,name:["Première installation","Petit atelier","Le quartier pâtissier","La grande fournée","Cent fours et un jacuzzi","Réseau gourmand","Architecte du croustillant","Métropole biscuit"][i]})),
 ...[1,5,25,100].map((target,i)=>({id:"prestige"+i,metric:"prestige" as const,target,name:["Nouveau départ","La recette traverse le temps","Maître des fournées","Éternel pâtissier"][i]}))
];
export const COOKIE_MISSIONS=[{id:"m1",name:"Prendre le rythme",metric:"clicks",target:25,reward:25},{id:"m2",name:"Premier atelier",metric:"maxBuildings",target:5,reward:100},{id:"m3",name:"Le premier millier",metric:"lifetime",target:1000,reward:250},{id:"m4",name:"Les mains dans la pâte",metric:"clicks",target:500,reward:1500},{id:"m5",name:"Cuisine collective",metric:"maxBuildings",target:25,reward:1e4},{id:"m6",name:"Une cargaison de cookies",metric:"lifetime",target:1e6,reward:1e5},{id:"m7",name:"La grande manufacture",metric:"maxBuildings",target:100,reward:1e7},{id:"m8",name:"Le milliard croustillant",metric:"lifetime",target:1e9,reward:1e8},{id:"m9",name:"Retour aux fourneaux",metric:"prestige",target:1,reward:1e6},{id:"m10",name:"L’archipel des fours",metric:"maxBuildings",target:250,reward:1e10},{id:"m11",name:"Une galaxie au goûter",metric:"lifetime",target:1e12,reward:1e11},{id:"m12",name:"La recette éternelle",metric:"prestige",target:25,reward:1e12}] as const;
export const METRIC_LABELS:Record<Metric,string>={lifetime:"cookies produits",clicks:"clics",maxBuildings:"bâtiments possédés",prestige:"étoiles de prestige"};
export function formatCookies(n:number){if(n>=1e15)return n.toExponential(2).replace(".",",");if(n>=1e12)return (n/1e12).toLocaleString("fr-FR",{maximumFractionDigits:2})+" T";if(n>=1e9)return (n/1e9).toLocaleString("fr-FR",{maximumFractionDigits:2})+" Md";if(n>=1e6)return (n/1e6).toLocaleString("fr-FR",{maximumFractionDigits:2})+" M";return n.toLocaleString("fr-FR",{maximumFractionDigits:n<10?1:0});}
export const formatClickPower=(n:number)=>n<100?n.toLocaleString("fr-FR",{maximumFractionDigits:2}):formatCookies(n);
export function baseProduction(p:CookiePlayer){return BUILDINGS.reduce((sum,b,i)=>sum+b.cps*p.buildings[i]*UPGRADES.filter(u=>u.building===i&&p.upgrades.includes(u.id)).reduce(n=>n*2,1),0)*(1+p.prestige*.1);}
export const production=(p:CookiePlayer,now=Date.now())=>baseProduction(p)*(p.rushUntil>now?7:1);
export const clickProductionShare=(p:CookiePlayer)=>.1+UPGRADES.filter(u=>u.share&&p.upgrades.includes(u.id)).reduce((n,u)=>n+u.share!,0);
export function clickPower(p:CookiePlayer,now=Date.now()){return (1+p.prestige*.1)*UPGRADES.filter(u=>u.clickMultiplier&&p.upgrades.includes(u.id)).reduce((n,u)=>n*u.clickMultiplier!,1)+production(p,now)*clickProductionShare(p);}
export function buildingPrice(p:CookiePlayer,index:number,quantity:number){const b=BUILDINGS[index];return Math.ceil(b.price*Math.pow(1.15,p.buildings[index])*(Math.pow(1.15,quantity)-1)/.15);}
export function upgradeReady(p:CookiePlayer,u:Upgrade){return (u.building===undefined||p.buildings[u.building]>=(u.owned??0))&&(!u.requires||p.upgrades.includes(u.requires))&&p.clicks>=(u.clicks??0)&&p.lifetime>=(u.earned??0);}
export const prestigeGain=(p:CookiePlayer)=>Math.max(0,Math.floor(Math.sqrt((p.banked+p.runEarned)/1e9))-p.prestige);
export function award(p:CookiePlayer){p.maxBuildings=Math.max(p.maxBuildings,p.buildings.reduce((a,b)=>a+b,0));p.achievements=[...new Set([...p.achievements,...COOKIE_ACHIEVEMENTS.filter(a=>p[a.metric]>=a.target).map(a=>a.id)])];}
const CAP=1e30;
export function earn(p:CookiePlayer,amount:number){amount=Math.max(0,Math.min(CAP,amount));p.balance=Math.min(CAP,p.balance+amount);p.lifetime=Math.min(CAP,p.lifetime+amount);p.runEarned=Math.min(CAP,p.runEarned+amount);}
export const AUTO_TIERS=[{clicks:2000,rate:2,name:"Petit pilote"},{clicks:5000,rate:4,name:"Double cadence"},{clicks:15000,rate:6,name:"Turbo gourmand"},{clicks:50000,rate:10,name:"Vitesse galactique"}] as const;
export const autoClickRate=(clicks:number)=>[...AUTO_TIERS].reverse().find(t=>clicks>=t.clicks)?.rate??0;
export function settle(p:CookiePlayer,now:number){const end=Math.max(p.updated,now),elapsed=Math.min(end-p.updated,8*3600000),start=p.updated,boosted=Math.max(0,Math.min(start+elapsed,p.rushUntil)-start);const gain=baseProduction(p)*(elapsed+boosted*6)/1000;earn(p,gain);p.clickCredit=Math.min(25,p.clickCredit+(end-p.updated)*.025);const autoRate=autoClickRate(p.clicks);if(autoRate||p.autoCredit!==undefined)p.autoCredit=Math.min(autoRate*2,(p.autoCredit??0)+(end-p.updated)*autoRate/1000);p.updated=end;award(p);return gain;}
export const COOKIE_EVENTS=[{id:"comet",name:"Comète sucrée",minimum:50,seconds:20},{id:"cookie",name:"Biscuit express",minimum:75,seconds:30},{id:"gift",name:"Cadeau du crew",minimum:100,seconds:40}] as const;
export const EVENT_VISIBLE_MS=22000,EVENT_WINDOW_MS=24000;
export const cookieEvent=(at:number)=>COOKIE_EVENTS[Math.floor(at/1000)%COOKIE_EVENTS.length];
export const cookieEventReward=(p:CookiePlayer,at:number)=>Math.max(cookieEvent(at).minimum,baseProduction(p)*cookieEvent(at).seconds);
const scheduleEvent=(p:CookiePlayer,now:number)=>{p.nextEventAt=now+90000+Math.floor(Math.random()*90001);};
export type CookieAction={kind:"sync"}|{kind:"click";count:number}|{kind:"auto";count:number}|{kind:"event";eventAt:number}|{kind:"buy";building:number;quantity:number}|{kind:"upgrade";upgrade:string}|{kind:"golden"}|{kind:"mission";mission:string}|{kind:"prestige"};
export function applyCookieAction(p:CookiePlayer,action:CookieAction,now:number){const offline=settle(p,now);let acceptedClicks=0,eventReward=0;
 if(action.kind==="click"){acceptedClicks=Math.min(action.count,Math.floor(p.clickCredit));p.clickCredit-=acceptedClicks;p.clicks+=acceptedClicks;earn(p,acceptedClicks*clickPower(p,now));}
 if(action.kind==="auto"){if(!autoClickRate(p.clicks))throw Error("L’autoclic se débloque à 2 000 clics.");acceptedClicks=Math.min(action.count,Math.floor(p.autoCredit??0));p.autoCredit=(p.autoCredit??0)-acceptedClicks;p.clicks+=acceptedClicks;earn(p,acceptedClicks*clickPower(p,now));}
 if(action.kind==="event"){if(action.eventAt!==p.nextEventAt||now<action.eventAt||now>action.eventAt+EVENT_WINDOW_MS)throw Error("Cette surprise est déjà passée. La prochaine arrive bientôt !");eventReward=cookieEventReward(p,action.eventAt);earn(p,eventReward);scheduleEvent(p,now);}
 if(action.kind==="buy"){const cost=buildingPrice(p,action.building,action.quantity);if(p.buildings[action.building]+action.quantity>1000)throw Error("1000 exemplaires maximum par bâtiment.");if(p.balance+1e-6<cost)throw Error("Pas encore assez de cookies.");p.balance=Math.max(0,p.balance-cost);p.buildings[action.building]+=action.quantity;}
 if(action.kind==="upgrade"){const u=UPGRADES.find(u=>u.id===action.upgrade);if(!u||p.upgrades.includes(u.id)||!upgradeReady(p,u))throw Error("Cette amélioration n’est pas disponible.");if(p.balance+1e-6<u.price)throw Error("Pas encore assez de cookies.");p.balance=Math.max(0,p.balance-u.price);p.upgrades.push(u.id);}
 if(action.kind==="golden"){if(now<p.goldenReadyAt)throw Error("Le prochain cookie doré se prépare.");earn(p,Math.max(25,baseProduction(p)*60));p.rushUntil=now+77000;p.goldenReadyAt=now+300000;p.goldenClicks++;}
 if(action.kind==="mission"){const m=COOKIE_MISSIONS.find(m=>m.id===action.mission);if(!m||p.missions.includes(m.id)||p[m.metric]<m.target)throw Error("Cet objectif n’est pas encore disponible.");p.missions.push(m.id);earn(p,m.reward);}
 if(action.kind==="prestige"){const gain=prestigeGain(p);if(gain<1)throw Error("Produis davantage pour gagner une étoile.");p.prestige+=gain;p.resets++;p.banked=Math.min(CAP,p.banked+p.runEarned);p.balance=0;p.runEarned=0;p.buildings=BUILDINGS.map(()=>0);p.upgrades=[];p.rushUntil=0;p.goldenReadyAt=now+60000;}
 if(!p.nextEventAt||now>p.nextEventAt+EVENT_WINDOW_MS)scheduleEvent(p,now);
 award(p);return {offline,acceptedClicks,...(eventReward?{eventReward}:{})};
}
