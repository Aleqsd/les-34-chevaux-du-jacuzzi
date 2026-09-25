import {BUILDINGS,UPGRADES,TRIALS,TRIAL_UNLOCK,COOKIE_MISSIONS,REBUILD_MISSIONS,buildingUnlock,buildingUnlocked,upgradeReady,cookieMetric,rebuildMetric,rebuildReward,formatClickPower as fmtPower,formatCookies as fmt,type CookiePlayer,type FollowedGoal,type CookieAction} from "@/lib/cookie-game";
import {advisedBuildingPrice,impactIncome,purchaseImpact,recipeImpact,steadyIncome,formatWait,waitForPurchase,nextCookieGoal} from "@/lib/cookie-insights";
export type PersonalGoal={key:string;goal:FollowedGoal;name:string;detail:string;value:number;target:number;complete:boolean;section:string;action?:CookieAction;score:number};
export const goalKey=(g:FollowedGoal)=>[g.kind,g.id,g.target,g.run].join(":");
export function describeGoal(p:CookiePlayer,g:FollowedGoal,pilot:boolean,now=Date.now()):PersonalGoal|undefined{
 const base={key:goalKey(g),goal:g,score:0},income=steadyIncome(p,pilot);
 if(g.kind==="building"){
  const i=BUILDINGS.findIndex(b=>b.id===g.id);if(i<0)return;
  const b=BUILDINGS[i],owned=p.buildings[i]??0,complete=owned>=g.target,unlocked=buildingUnlocked(p,i),cost=advisedBuildingPrice(p,i,Math.max(1,g.target-owned),pilot,now),gain=purchaseImpact(p,i,Math.max(1,g.target-owned));
  return {...base,name:(g.target===1?"Installer ":"Atteindre "+g.target+" × ")+b.name,detail:complete?"Objectif atteint !":!unlocked?"Accès à "+fmt(buildingUnlock(i))+" cookies produits au total":"+"+fmt(impactIncome(p,gain,pilot))+" / s"+(pilot?" pilote inclus":"")+" · +"+fmtPower(gain.click)+" / clic manuel · "+fmt(cost)+" cookies · "+formatWait(waitForPurchase(cost,p.balance,income)),value:unlocked?owned:p.lifetime,target:unlocked?g.target:buildingUnlock(i),complete,section:i>=10?"horizons":"atelier"};
 }
 if(g.kind==="upgrade"){
  const u=UPGRADES.find(u=>u.id===g.id);if(!u)return;const complete=p.upgrades.includes(u.id),ready=upgradeReady(p,u),gain=recipeImpact(p,u);
  const condition=u.requires&&!p.upgrades.includes(u.requires)?"D’abord : "+UPGRADES.find(x=>x.id===u.requires)?.name:u.synergy?u.synergy.sourceOwned+" × "+BUILDINGS[u.synergy.source].name+" et 5 × "+BUILDINGS[u.synergy.target].name:u.building!==undefined?(u.owned??0)+" × "+BUILDINGS[u.building].name:p.clicks<(u.clicks??0)?fmt(u.clicks??0)+" clics":fmt(u.earned??0)+" cookies produits";
  return {...base,name:u.name,detail:complete?"Recette acquise !":!ready?condition:"+"+fmt(impactIncome(p,gain,pilot))+" / s"+(pilot?" pilote inclus":"")+" · +"+fmtPower(gain.click)+" / clic manuel · "+fmt(u.price)+" cookies · "+formatWait(waitForPurchase(u.price,p.balance,income)),value:complete?u.price:ready?Math.min(p.balance,u.price):0,target:u.price,complete,section:"recettes",...(ready&&!complete&&p.balance>=u.price?{action:{kind:"upgrade" as const,upgrade:u.id}}:{})};
 }
 if(g.kind==="trial"){
  const spec=TRIALS.find(t=>t.id===g.id);if(!spec)return;const best=p.trials?.bests[spec.id]?.medal??0;
  return {...base,name:["","Bronze","Argent","Or"][g.target]+" · "+spec.name,detail:best>=g.target?"Médaille acquise !":p.lifetime<TRIAL_UNLOCK?"Épreuves à "+fmt(TRIAL_UNLOCK)+" cookies produits":g.target===1?"Termine l’épreuve pour gagner le décor "+spec.decor:"Termine en "+(g.target===2?spec.silver:spec.gold)+" s maximum · "+(g.target===2?"halo du décor":"couronne du maître"),value:best,target:g.target,complete:best>=g.target,section:"trials"};
 }
 if(g.kind==="contract"){
  const a=p.contracts?.active;if(!a||String(a.id)!==g.id)return;
  return {...base,name:"Terminer ma commande",detail:"Prime : +"+fmt(a.reward)+" cookies",value:a.progress,target:a.target,complete:false,section:"contracts",...(a.progress>=a.target?{action:{kind:"contractClaim" as const,contractId:a.id}}:{})};
 }
 if(g.kind==="rebuild"){
  const m=REBUILD_MISSIONS.find(m=>m.id===g.id);if(!m||g.run!==p.resets)return;
  const value=rebuildMetric(p,m.metric),complete=!!p.rebuild?.claimed.includes(m.id);
  return {...base,name:m.name,detail:"Reconstruction : +"+fmt(rebuildReward(p,m.reward))+" cookies",value,target:m.target,complete,section:"rebuild",...(!complete&&value>=m.target?{action:{kind:"rebuild" as const,mission:m.id,run:p.resets}}:{})};
 }
 const m=COOKIE_MISSIONS.find(m=>m.id===g.id);if(!m)return;const value=cookieMetric(p,m.metric),complete=p.missions.includes(m.id);
 return {...base,name:m.name,detail:"Récompense : +"+fmt(m.reward)+" cookies",value,target:m.target,complete,section:"permanent",...(!complete&&value>=m.target?{action:{kind:"mission" as const,mission:m.id}}:{})};
}
export function recommendGoals(p:CookiePlayer,pilot:boolean,now=Date.now()):PersonalGoal[]{
 const candidates:PersonalGoal[]=[],income=steadyIncome(p,pilot);
 const add=(goal:FollowedGoal,score:number)=>{const d=describeGoal(p,goal,pilot,now);if(d&&!d.complete)candidates.push({...d,score});};
 const goal=(kind:FollowedGoal["kind"],id:string,target=1):FollowedGoal=>({kind,id,target,run:kind==="rebuild"?p.resets:0});
 const mission=nextCookieGoal(p);
 if(mission)add(goal(mission.kind==="contractClaim"?"contract":mission.kind,mission.id),mission.value>=mission.target?100:25+Math.min(1,mission.value/mission.target)*15);
 // Compare all purchases in cookies/second per cookie spent. Manual clicks have no assumed cadence.
 const buys=BUILDINGS.flatMap((b,i)=>{if(!buildingUnlocked(p,i)||(p.buildings[i]??0)>=1000)return [];const price=advisedBuildingPrice(p,i,1,pilot,now),gain=purchaseImpact(p,i,1);return [{goal:goal("building",b.id,(p.buildings[i]??0)+1),price,gain}];});
 const recipes=UPGRADES.filter(u=>!p.upgrades.includes(u.id)&&upgradeReady(p,u)).map(u=>({goal:goal("upgrade",u.id),price:u.price,gain:recipeImpact(p,u)}));
 const investments=[...buys,...recipes].map(x=>({...x,income:impactIncome(p,x.gain,pilot),wait:waitForPurchase(x.price,p.balance,income)})).filter(x=>x.income>0).sort((a,b)=>b.income/b.price-a.income/a.price);
 const nearby=investments.filter(x=>x.wait<=3600),ranked=nearby.length?nearby:investments;
 ranked.slice(0,3).forEach((x,i)=>add(x.goal,70-i*3));
 // A pure click recipe stays visible as an explicit active-play option, not passive income.
 const manual=recipes.filter(x=>x.gain.click>0&&!ranked.slice(0,3).some(r=>r.goal.id===x.goal.id&&r.goal.kind==="upgrade")).sort((a,b)=>b.gain.click/b.price-a.gain.click/a.price)[0];
 if(manual)add(manual.goal,41);
 const next=BUILDINGS.findIndex((_,i)=>(p.buildings[i]??0)===0);
 if(next>=0)add(goal("building",BUILDINGS[next].id),buildingUnlocked(p,next)?45:20);
 const link=UPGRADES.find(u=>u.synergy&&!p.upgrades.includes(u.id)&&p.lifetime>=(u.earned??0)&&(p.buildings[u.synergy.target]??0)>=1);
 if(link)add(goal("upgrade",link.id),30);
 if(p.lifetime>=TRIAL_UNLOCK){const t=TRIALS.find(t=>(p.trials?.bests[t.id]?.medal??0)<3);if(t)add(goal("trial",t.id,(p.trials?.bests[t.id]?.medal??0)+1),35);}
 return candidates.sort((a,b)=>b.score-a.score).filter((g,i,all)=>all.findIndex(x=>x.key===g.key)===i).slice(0,6);
}
