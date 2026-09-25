import {COOKIE_CAP,BUILDINGS,UPGRADES,buildingPrice,buildingUnlocked,upgradeReady,recipePurchasePlan,workshopPurchasePlan,passiveGain,type CookieAction,type CookiePlayer} from "@/lib/cookie-game";
export type PurchaseAction=Extract<CookieAction,{kind:"buy"|"upgrade"|"buyRecipes"|"buyAll"}>;
export type PurchaseAttempt={id:string;action:PurchaseAction;createdAt?:number};
export const isPurchase=(action:CookieAction):action is PurchaseAction=>action.kind==="buy"||action.kind==="upgrade"||action.kind==="buyRecipes"||action.kind==="buyAll";
/** Preview only reversible purchases. Never award progress or simulate random events. */
function applyPreview(p:CookiePlayer,a:PurchaseAction,now:number){
 if(a.run!==undefined&&a.run!==p.resets)return false;
 if(a.kind==="buy"){
  if(!BUILDINGS[a.building]||!buildingUnlocked(p,a.building)||a.quantity<1||(p.buildings[a.building]??0)+a.quantity>1000)return false;
  const cost=buildingPrice(p,a.building,a.quantity,now);if(p.balance+1e-6<cost||a.maxCost!==undefined&&cost>a.maxCost)return false;
  p.balance=Math.max(0,p.balance-cost);p.buildings[a.building]=(p.buildings[a.building]??0)+a.quantity;if(p.eventBuffs)delete p.eventBuffs.discountUntil;return true;
 }
 if(a.kind==="upgrade"){
  const u=UPGRADES.find(u=>u.id===a.upgrade);if(!u||p.upgrades.includes(u.id)||!upgradeReady(p,u)||p.balance+1e-6<u.price)return false;
  p.balance=Math.max(0,p.balance-u.price);p.upgrades.push(u.id);return true;
 }
 if(a.kind==="buyAll"){const plan=workshopPurchasePlan(p,a.maxCost,now);if(!plan.purchases.length)return false;p.balance=Math.max(0,p.balance-plan.cost);for(const lot of plan.purchases)p.buildings[lot.building]+=lot.quantity;if(p.eventBuffs)delete p.eventBuffs.discountUntil;return true;}
 const plan=recipePurchasePlan(p,Math.min(p.balance,a.maxCost));if(!plan.recipes.length)return false;
 p.balance=Math.max(0,p.balance-plan.cost);p.upgrades.push(...plan.recipes.map(r=>r.id));return true;
}
export function projectPurchases(player:CookiePlayer,attempts:readonly PurchaseAttempt[],now:number){
 const p={...player,buildings:[...player.buildings],upgrades:[...player.upgrades],...(player.eventBuffs?{eventBuffs:{...player.eventBuffs}}:{})};
 // Only authoritative buildings accrue projected income. Pending clicks and purchases
 // cannot generate spendable money before the server confirms their actual timestamp.
 const end=player.updated+Math.min(15000,Math.max(0,now-player.updated));p.balance=Math.min(COOKIE_CAP,p.balance+passiveGain(player,player.updated,end));p.updated=Math.max(now,player.updated);
 for(const attempt of attempts)applyPreview(p,attempt.action,now);
 return p;
}
export function preparePurchase(p:CookiePlayer,action:PurchaseAction,now:number):PurchaseAction|null{
 const a:PurchaseAction=action.kind==="buy"?{...action,run:p.resets,maxCost:buildingPrice(p,action.building,action.quantity,now)}:action.kind==="upgrade"?{...action,run:p.resets}:{...action,run:p.resets,maxCost:Math.min(action.maxCost,p.balance,COOKIE_CAP)};
 const preview={...p,buildings:[...p.buildings],upgrades:[...p.upgrades],...(p.eventBuffs?{eventBuffs:{...p.eventBuffs}}:{})};return applyPreview(preview,a,now)?a:null;
}
