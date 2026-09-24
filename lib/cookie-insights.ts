import { BUILDINGS, COOKIE_MISSIONS, REBUILD_MISSIONS, rebuildMetric, rebuildReward, prestigeGain, autoClickRate, baseProduction, buildingPrice, clickPower, cookieMetric, type CookiePlayer, type Upgrade } from "@/lib/cookie-game";

export function maxAffordableBuildings(p:CookiePlayer,index:number,balance=p.balance){
 let low=0,high=Math.max(0,1000-p.buildings[index]);
 while(low<high){const middle=Math.ceil((low+high)/2);if(buildingPrice(p,index,middle)<=balance+1e-6)low=middle;else high=middle-1;}
 return low;
}
export function purchaseImpact(p:CookiePlayer,index:number,quantity:number){
 const before={...p,rushUntil:0},after={...before,buildings:[...p.buildings]};
 after.buildings[index]+=quantity;
 return {production:baseProduction(after)-baseProduction(before),click:clickPower(after,0)-clickPower(before,0)};
}
export function recipeImpact(p:CookiePlayer,u:Upgrade){
 if(p.upgrades.includes(u.id))return {production:0,click:0};
 const before={...p,rushUntil:0},after={...before,upgrades:[...p.upgrades,u.id]};
 return {production:baseProduction(after)-baseProduction(before),click:clickPower(after,0)-clickPower(before,0)};
}
export function steadyIncome(p:CookiePlayer,pilot:boolean){
 return baseProduction(p)+(pilot?autoClickRate(p.clicks)*clickPower({...p,rushUntil:0},0):0);
}
export function waitForPurchase(price:number,balance:number,income:number){
 if(balance>=price)return 0;
 return income>0?(price-balance)/income:Infinity;
}
export function formatWait(seconds:number){
 if(!Number.isFinite(seconds))return "Produis des cookies";
 if(seconds<=0)return "Prêt à acheter";
 if(seconds<60)return "≈ "+Math.max(1,Math.ceil(seconds))+" s";
 if(seconds<3600)return "≈ "+Math.ceil(seconds/60)+" min";
 if(seconds<86400)return "≈ "+(seconds/3600).toLocaleString("fr-FR",{maximumFractionDigits:1})+" h";
 return "Plus de 24 h";
}
export function nextCookieMission(p:CookiePlayer){
 const remaining=COOKIE_MISSIONS.filter(m=>!p.missions.includes(m.id));
 return remaining.find(m=>cookieMetric(p,m.metric)>=m.target)??remaining.reduce<typeof remaining[number]|undefined>((best,m)=>!best||cookieMetric(p,m.metric)/m.target>cookieMetric(p,best.metric)/best.target?m:best,undefined);
}
export const buildingPreviewPrice=(index:number,quantity:number)=>Math.ceil(BUILDINGS[index].price*(Math.pow(1.15,quantity)-1)/.15);

export function nextRebuildMission(p:CookiePlayer){
 if(!p.prestige)return undefined;
 const remaining=REBUILD_MISSIONS.filter(m=>!p.rebuild?.claimed.includes(m.id));
 return remaining.find(m=>rebuildMetric(p,m.metric)>=m.target)??remaining.reduce<typeof remaining[number]|undefined>((best,m)=>!best||rebuildMetric(p,m.metric)/m.target>rebuildMetric(p,best.metric)/best.target?m:best,undefined);
}
export function nextCookieGoal(p:CookiePlayer){
 const permanent=nextCookieMission(p),rebuild=nextRebuildMission(p);
 const a=permanent?{id:permanent.id,name:permanent.name,value:cookieMetric(p,permanent.metric),target:permanent.target,reward:permanent.reward,kind:"mission" as const}:undefined;
 const b=rebuild?{id:rebuild.id,name:rebuild.name,value:rebuildMetric(p,rebuild.metric),target:rebuild.target,reward:rebuildReward(p,rebuild.reward),kind:"rebuild" as const}:undefined;
 return b&&b.value>=b.target?b:a&&a.value>=a.target?a:b??a;
}
export function prestigePreview(p:CookiePlayer){
 const gain=prestigeGain(p),current=1+p.prestige*.1,next=1+(p.prestige+gain)*.1,total=p.banked+p.runEarned;
 return {gain,current,next,relative:gain*.1/current,remaining:Math.max(0,(p.prestige+gain+1)**2*1e9-total),
  milestones:[.1,.25,1].map(relative=>{const target=Math.max(p.prestige+1,Math.ceil(((current*(1+relative)-1)/.1)-1e-7));return {relative,target,gain:target-p.prestige,remaining:Math.max(0,target**2*1e9-total)};})};
}
