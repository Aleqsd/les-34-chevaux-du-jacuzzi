
import fs from "node:fs/promises";
import path from "node:path";
import {spawnSync} from "node:child_process";
import crypto from "node:crypto";
import ts from "typescript";
const base="http://127.0.0.1:5173",author="TestCookie",key="testcookie";
const reportPath=path.resolve(".sites-runtime/cookie-integration-report.json");
const fixtureIds=[],checks=[],calls=[],issues=[];let cleanup;
const transpiled=ts.transpileModule(await fs.readFile("lib/cookie-game.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{}};new Function("exports","module",transpiled)(module.exports,module);const game=module.exports;
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
function check(label,ok,detail){checks.push({label,pass:Boolean(ok),...(!ok?{detail}:{})});}
function db(sql){const r=spawnSync(process.execPath,["--import","./scripts/sites-env.mjs","./node_modules/wrangler/bin/wrangler.js","d1","execute","DB","--config","dist/server/wrangler.json","--local","--persist-to",".wrangler/state","--command",sql,"--json"],{encoding:"utf8",maxBuffer:2e6});if(r.status!==0)throw Error(r.stderr||r.stdout);return JSON.parse(r.stdout);}
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
const uuid=()=>{const id=crypto.randomUUID();fixtureIds.push(id);return id;};
async function req(route,body,expected=200){
 const r=await fetch(base+route,{method:body?"POST":"GET",headers:body?{"Content-Type":"application/json",Origin:base}:{},...(body?{body:JSON.stringify(body)}:{})});
 const data=await r.json();calls.push({route,body,status:r.status,data});
 if(expected!==null)check((body?.action?.kind||body?.action||"GET")+" HTTP "+expected,r.status===expected,{status:r.status,data});
 return {status:r.status,...data};
}
const action=(act,id=uuid(),expected=200)=>req("/api/cookie",{author,id,action:act},expected);
const read=()=>req("/api/cookie?author="+encodeURIComponent(author));
const profile=(avatar,hat="none",expected=201)=>req("/api/social",{action:"profile",author,transformVersion:2,avatar,imageUrl:"",hat,eyewear:"none",accessory:"none",positions:{}},expected);
function seed(patch={}){const now=Date.now(),player={...game.freshCookiePlayer(now),...patch};db("UPDATE cookie_players SET data="+quote(JSON.stringify(player))+",updated="+player.updated+",version=version+1,last_action='' WHERE author_key='testcookie';");return player;}
function persisted(){return db("SELECT data,version,updated FROM cookie_players WHERE author_key='testcookie'")[0].results[0];}
const existing=db("SELECT author_key FROM cookie_players WHERE author_key='testcookie';")[0].results;
 if(existing.length)throw Error("Unexpected pre-existing TestCookie fixture; abort to avoid overwriting it.");
try{
 let r=await read();check("fresh player balance0 version0",r.player?.balance===0&&r.player?.version===0,r);
 await profile(60,"none",400);
 r=await action({kind:"sync"});check("first sync persists version1",r.player?.version===1&&persisted()?.version===1,r);
 r=await action({kind:"click",count:1});check("first click gives1 cookie and achievements",r.acceptedClicks===1&&r.player.balance===1&&r.player.achievements.includes("bake0")&&r.player.achievements.includes("click0"),r);
 await profile(60);await profile(65,"none",400);
 const parallel=await Promise.all(Array.from({length:4},()=>action({kind:"click",count:2})));
 check("distinct concurrent requests accepted exactly once",parallel.every(x=>x.status===200)&&new Set(parallel.map(x=>x.player?.version)).size===4,parallel.map(x=>({status:x.status,version:x.player?.version})));
 r=await read();check("concurrent clicks retained with no lost balance",r.player.clicks===9&&r.player.balance===9,r.player);
 const sameId=uuid(),same=await Promise.all(Array.from({length:6},()=>action({kind:"click",count:3},sameId)));
 check("concurrent duplicate UUID one immutable receipt",same.every(x=>x.player.version===same[0].player.version&&x.acceptedClicks===3),same.map(x=>x.player.version));
 r=await read();check("duplicate UUID credited only once",r.player.clicks===12&&r.player.balance===12,r.player);
 await action({kind:"click",count:2},sameId,409);
 const mismatchId=uuid(),mixed=await Promise.all([action({kind:"click",count:1},mismatchId,null),action({kind:"click",count:2},mismatchId,null)]);
 check("concurrent mismatched payload produces one200 one409",mixed.filter(x=>x.status===200).length===1&&mixed.filter(x=>x.status===409).length===1,mixed);
 r=await read();check("returned player version is latest committed",r.player.version===Math.max(...mixed.filter(x=>x.player).map(x=>x.player.version)),r.player.version); const replayCurrent=await action({kind:"click",count:3},sameId);check("old UUID replays original detail with latest player",replayCurrent.acceptedClicks===3&&replayCurrent.player.version===r.player.version&&replayCurrent.player.clicks===r.player.clicks&&replayCurrent.player.balance===r.player.balance,replayCurrent);
 seed({clickCredit:0,updated:Date.now()+60000});
 r=await action({kind:"click",count:25});check("exhausted credit accepts0 and cannot mint clicks",r.acceptedClicks===0&&r.player.balance===0&&r.player.clicks===0,r);
 seed({clickCredit:0,updated:Date.now()-1000});
 r=await action({kind:"click",count:25});check("rate credit refills25/s capped25",r.acceptedClicks===25&&r.player.clickCredit===0&&r.player.clicks===25,r);
 seed({balance:15});
 const competing=await Promise.all([action({kind:"buy",building:0,quantity:1},uuid(),null),action({kind:"buy",building:0,quantity:1},uuid(),null)]);
 check("concurrent limited-funds purchases charge only affordable one",competing.filter(x=>x.status===200).length===1&&competing.filter(x=>x.status===400).length===1,competing);
 r=await read();check("failed concurrent buy doesn't grant extra building",r.player.buildings[0]===1&&r.player.balance<1,r.player);
 const startBulk=seed({balance:1000});const bulkCost=game.buildingPrice(startBulk,0,10);
 r=await action({kind:"buy",building:0,quantity:10});check("bulk geometric price debited exactly",r.player.buildings[0]===10&&near(r.player.balance,1000-bulkCost),{bulkCost,player:r.player});
 const beforeSecond=r.player;
 r=await action({kind:"buy",building:0,quantity:1});check("next price scales with owned count",near(r.player.balance,beforeSecond.balance+r.offline-game.buildingPrice(beforeSecond,0,1)),r);
 seed({balance:0});await action({kind:"buy",building:0,quantity:1},uuid(),400);
 seed({balance:1e9});await action({kind:"upgrade",upgrade:"spoon_double"},uuid(),400);
 let buildings=game.BUILDINGS.map(()=>0);buildings[0]=10;seed({balance:1000,buildings});
 const upId=uuid();r=await action({kind:"upgrade",upgrade:"spoon_double"},upId);check("upgrade grantsdouble and correct debit",r.player.upgrades.includes("spoon_double")&&near(r.player.balance,700+r.offline)&&game.baseProduction(r.player)===2,r);
 const upRetry=await action({kind:"upgrade",upgrade:"spoon_double"},upId);check("upgrade UUID retry does not charge twice",upRetry.player.version===r.player.version&&upRetry.player.balance===r.player.balance,upRetry);
 await action({kind:"upgrade",upgrade:"spoon_double"},uuid(),400);
 buildings=game.BUILDINGS.map(()=>0);buildings[4]=25;seed({balance:1e9,buildings});
 await action({kind:"upgrade",upgrade:"cocoa_master"},uuid(),400);
 await action({kind:"upgrade",upgrade:"cocoa_double"});
 r=await action({kind:"upgrade",upgrade:"cocoa_master"});check("advanced upgrade requires then stacksdouble",r.player.upgrades.includes("cocoa_master")&&game.baseProduction(r.player)===25*450*4,r);
 seed({balance:1000,clicks:24});await action({kind:"upgrade",upgrade:"thumb"},uuid(),400);
 seed({balance:1000,clicks:25});r=await action({kind:"upgrade",upgrade:"thumb"});check("click upgrade prerequisite and power",r.player.balance===950&&game.clickPower(r.player)===2,r);
 buildings=game.BUILDINGS.map(()=>0);buildings[1]=1;
 seed({buildings,updated:Date.now()-10*3600000});
 r=await action({kind:"sync"});check("offline production capped exactly8h",r.offline===28800&&r.player.balance===28800,r);
 const burstStart=Date.now()-100000;
 seed({buildings,updated:burstStart,rushUntil:burstStart+77000});
 r=await action({kind:"sync"});const burstExpected=(r.player.updated-burstStart)/1000+77*6;
 check("rush77s integrates active and expired segments exactly",near(r.offline,burstExpected),{expected:burstExpected,actual:r.offline});
 const oldBurst=Date.now()-10*3600000;
 seed({buildings,updated:oldBurst,rushUntil:oldBurst+77000});
 r=await action({kind:"sync"});check("offline cap preserves rush earned at absence start",near(r.offline,28800+77*6),{expected:29262,actual:r.offline});
 seed({goldenReadyAt:Date.now()+60000});await action({kind:"golden"},uuid(),400);
 seed({goldenReadyAt:0});const goldenId=uuid();r=await action({kind:"golden"},goldenId);
 check("golden grants25 and exact77s rush +300s cooldown",r.player.balance===25&&r.player.goldenClicks===1&&r.player.rushUntil-r.player.updated===77000&&r.player.goldenReadyAt-r.player.updated===300000,r);
 const goldenRetry=await action({kind:"golden"},goldenId);check("golden retry idempotent",goldenRetry.player.version===r.player.version&&goldenRetry.player.balance===25,goldenRetry);
 await action({kind:"golden"},uuid(),400);
 seed({clicks:24});await action({kind:"mission",mission:"m1"},uuid(),400);
 seed({clicks:25});const missionId=uuid();r=await action({kind:"mission",mission:"m1"},missionId);check("mission rewards once",r.player.balance===25&&r.player.missions.includes("m1"),r);
 await action({kind:"mission",mission:"m1"},uuid(),400);const missionRetry=await action({kind:"mission",mission:"m1"},missionId);check("mission UUID retry idempotent",missionRetry.player.balance===25&&missionRetry.player.version===r.player.version,missionRetry);
 seed({balance:1000,runEarned:1e9,lifetime:1e9,clicks:500,goldenClicks:4,achievements:["bake0","click0"],missions:["m1"],maxBuildings:50,buildings:[10,0,0,0,0,0,0,0,0,0],upgrades:["spoon_double"]});
 r=await action({kind:"prestige"});const prestigeOne=r.player;
 check("prestige resets only run resources",prestigeOne.prestige===1&&prestigeOne.resets===1&&prestigeOne.balance===0&&prestigeOne.runEarned===0&&prestigeOne.buildings.every(x=>x===0)&&prestigeOne.upgrades.length===0,r);
 check("prestige preserves lifetime stats missions achievements",prestigeOne.lifetime>=1e9&&prestigeOne.clicks===500&&prestigeOne.goldenClicks===4&&prestigeOne.maxBuildings===50&&prestigeOne.missions.includes("m1")&&prestigeOne.achievements.includes("bake0")&&prestigeOne.achievements.includes("prestige0"),r);
 await action({kind:"prestige"},uuid(),400);
 seed({...prestigeOne,runEarned:1e9,lifetime:prestigeOne.lifetime+1e9,updated:Date.now()});
 await action({kind:"prestige"},uuid(),400);
 seed({...prestigeOne,runEarned:3e9,lifetime:prestigeOne.lifetime+3e9,updated:Date.now()});
 r=await action({kind:"prestige"});check("nonfarm prestige requires cumulative4b for second point",r.player.prestige===2&&r.player.resets===2&&r.player.banked>=4e9,r);
 seed({lifetime:1e15-1});await profile(65,"none",400);
 seed({lifetime:1e15});await profile(65);await profile(65,"sparkle",400);
 for(const bad of [{kind:"click",count:26},{kind:"click",count:0},{kind:"click",count:1.5},{kind:"buy",building:10,quantity:1},{kind:"buy",building:0,quantity:2},{kind:"oops"}])await action(bad,uuid(),400);
 await req("/api/cookie",{author,id:"bad",action:{kind:"sync"}},400);
 // Verify replay horizon explicitly, using only our own fixture receipt.
 seed({balance:1000});const oldId=uuid();const oldPurchase=await action({kind:"buy",building:0,quantity:1},oldId);
 db("UPDATE cookie_actions SET created="+(Date.now()-25*3600000)+" WHERE author_key='testcookie' AND id="+quote(oldId));
 const beforeReplay=await action({kind:"sync"});r=await action({kind:"buy",building:0,quantity:1},oldId);
 check("purchase UUID remains idempotent after24h receipt cleanup",r.player.buildings[0]===1&&r.player.version===beforeReplay.player.version&&r.player.balance===beforeReplay.player.balance,{before:oldPurchase.player,after:r.player,id:oldId});
 const board=await req("/api/club");const entry=board.cookieProgress.find(p=>p.authorKey===key);check("leaderboard exposes personal historical totals",entry?.author===author&&entry.lifetime===r.player.lifetime&&entry.clicks===r.player.clicks&&entry.prestige===r.player.prestige,entry);
 seed({balance:10000,clicks:100,upgrades:["thumb"]});r=await action({kind:"upgrade",upgrade:"hooves"});check("early second click recipe triples base",game.clickPower(r.player)===6&&r.player.balance===9500,r);
 buildings=game.BUILDINGS.map(()=>0);buildings[1]=100;seed({balance:1e6,lifetime:1000,buildings,upgrades:["thumb","hooves"]});r=await action({kind:"sync"});check("click scales with10 percent production",near(game.clickPower(r.player),16),r);
 r=await action({kind:"upgrade",upgrade:"rhythm"});check("rhythm scales to20 percent",near(game.clickPower(r.player),26)&&near(game.clickProductionShare(r.player),.2),r);
 seed({balance:1e6,lifetime:1e5,buildings,upgrades:["thumb","hooves","rhythm"]});r=await action({kind:"upgrade",upgrade:"cadence"});check("cadence scales to35 percent",near(game.clickPower(r.player),41)&&near(game.clickProductionShare(r.player),.35),r);
 const balanced=game.freshCookiePlayer(1000);balanced.buildings[1]=100;balanced.prestige=5;balanced.upgrades=["thumb","hooves","rhythm","cadence"];check("prestige applies once to both click components",near(game.clickPower(balanced,1000),61.5),balanced);balanced.rushUntil=9000;check("rush boosts CPS share without double prestige",near(game.clickPower(balanced,1000),376.5),balanced);check("fractional click gain stays visible",game.formatClickPower(1.01)==="1,01");
 seed({balance:1e6,lifetime:1e5,buildings,upgrades:[]});r=await action({kind:"upgrade",upgrade:"cadence"});check("legacy cadence-only purchase remains eligible",r.player.upgrades.includes("cadence")&&near(game.clickProductionShare(r.player),.25),r);
 check("autoclick speed unlocks at exact thresholds",[1999,2000,4999,5000,14999,15000,49999,50000].map(game.autoClickRate).join(',')==='0,2,2,4,4,6,6,10');
 seed({clicks:1999});await action({kind:"auto",count:2},uuid(),400);
 const legacyAuto=game.freshCookiePlayer(1000);legacyAuto.clicks=2000;game.award(legacyAuto);const preserved=JSON.parse(JSON.stringify(legacyAuto));game.settle(legacyAuto,1000);check("legacy save retains all existing values when autocredit is introduced",Object.keys(preserved).every(k=>JSON.stringify(legacyAuto[k])===JSON.stringify(preserved[k]))&&legacyAuto.autoCredit===0,legacyAuto);
 seed({clicks:2000,autoCredit:0,updated:Date.now()+60000});r=await action({kind:"auto",count:25});check("autoclick cannot mint clicks without credit",r.acceptedClicks===0&&r.player.clicks===2000,r);
 seed({clicks:2000,autoCredit:4,updated:Date.now()+60000});const autoId=uuid();r=await action({kind:"auto",count:25},autoId);check("initial auto rate has a2second burst cap and independent manual credit",r.acceptedClicks===4&&r.player.clicks===2004&&r.player.clickCredit===25,r);const ar=await action({kind:"auto",count:25},autoId);check("autoclick replay UUID does not double count",ar.player.clicks===2004&&ar.player.version===r.player.version,ar);
 seed({clicks:50000,autoCredit:20,updated:Date.now()+60000});const autoParallel=await Promise.all([action({kind:"auto",count:20}),action({kind:"auto",count:20})]);r=await read();check("parallel auto tabs share a single speed allowance",r.player.clicks===50020&&autoParallel.reduce((n,x)=>n+x.acceptedClicks,0)===20,r);
 const offlineAuto=game.freshCookiePlayer(1000);offlineAuto.clicks=50000;game.settle(offlineAuto,1000+8*3600000);check("autoclick never generates hours of offline clicks",offlineAuto.clicks===50000&&offlineAuto.autoCredit===20&&offlineAuto.balance===0,offlineAuto);
 const crossing=game.freshCookiePlayer(1000);crossing.clicks=4999;crossing.autoCredit=2;game.applyCookieAction(crossing,{kind:"auto",count:2},1000);check("automatic clicks unlock the next acceleration",crossing.clicks===5001&&game.autoClickRate(crossing.clicks)===4,crossing);
 for(const bad of [{kind:"auto",count:0},{kind:"auto",count:26},{kind:"auto",count:1.5}])await action(bad,uuid(),400);
 seed({balance:125,lifetime:500,clicks:100});r=await action({kind:"sync"});const scheduledAt=r.player.nextEventAt;check("old save receives one future surprise without changing progress",scheduledAt>=r.player.updated+90000&&scheduledAt<=r.player.updated+180000&&r.player.balance===125&&r.player.lifetime===500&&r.player.clicks===100,r);
 const eventReads=await Promise.all([read(),read()]);check("GET requests preserve the stored event schedule",eventReads.every(x=>x.player.nextEventAt===scheduledAt)&&JSON.parse(persisted().data).nextEventAt===scheduledAt,eventReads);
 await action({kind:"event",eventAt:scheduledAt},uuid(),400);
 let eventAt=Date.now()-1000;seed({nextEventAt:eventAt,balance:200});await action({kind:"event",eventAt:eventAt+1},uuid(),400);
 const eventId=uuid();r=await action({kind:"event",eventAt},eventId);const eventGain=game.cookieEventReward(game.freshCookiePlayer(Date.now()),eventAt);check("catch awards exact cookies and schedules the next surprise",r.eventReward===eventGain&&r.player.balance===200+eventGain&&r.player.lifetime===eventGain&&r.player.nextEventAt>=r.player.updated+90000,r);
 const caught=r.player,repeatEvent=await action({kind:"event",eventAt},eventId);check("event UUID replay cannot grant twice",repeatEvent.player.balance===caught.balance&&repeatEvent.player.version===caught.version,repeatEvent);await action({kind:"event",eventAt},uuid(),400);
 eventAt=Date.now()-1000;seed({nextEventAt:eventAt});const eventParallel=await Promise.all([action({kind:"event",eventAt},uuid(),null),action({kind:"event",eventAt},uuid(),null)]);check("two tabs cannot catch the same event twice",eventParallel.filter(x=>x.status===200).length===1&&eventParallel.filter(x=>x.status===400).length===1,eventParallel);
 eventAt=Date.now()-game.EVENT_WINDOW_MS-1000;seed({nextEventAt:eventAt});await action({kind:"event",eventAt},uuid(),400);r=await action({kind:"sync"});check("expired events reschedule without free offline reward",r.player.balance===0&&r.player.nextEventAt>=r.player.updated+90000,r);
 eventAt=Date.now()+120000;seed({nextEventAt:eventAt,lifetime:1e9,runEarned:1e9});r=await action({kind:"prestige"});check("prestige preserves pending surprise",r.player.nextEventAt===eventAt,r);
 const eventScaled=game.freshCookiePlayer(0);eventScaled.buildings[1]=100;eventScaled.rushUntil=1e9;check("surprise scales with base production without rush multiplication",game.cookieEventReward(eventScaled,3000)===2000,eventScaled);
 for(const bad of [{kind:"event",eventAt:-1},{kind:"event",eventAt:1.5},{kind:"event",eventAt:Number.MAX_SAFE_INTEGER+1}])await action(bad,uuid(),400);
 // deterministic pure math verifies segmentation, replaying server game functions only.
 const p=game.freshCookiePlayer(1000);p.buildings[1]=1;p.rushUntil=78000;game.settle(p,41000);game.settle(p,101000);
 check("segmented settle equals single100s interval with77s boost",near(p.balance,562),p);
}catch(error){issues.push({fatal:String(error),stack:error.stack});}
finally{
 cleanup=db("DELETE FROM cookie_actions WHERE author_key='testcookie'; DELETE FROM cookie_players WHERE author_key='testcookie'; DELETE FROM profiles WHERE author_key='testcookie'; SELECT (SELECT COUNT(*) FROM cookie_actions WHERE author_key='testcookie') AS actions,(SELECT COUNT(*) FROM cookie_players WHERE author_key='testcookie') AS players,(SELECT COUNT(*) FROM profiles WHERE author_key='testcookie') AS profiles;");
 check("exact local fixture cleanup complete",Object.values(cleanup.at(-1).results[0]).every(x=>x===0),cleanup);
 const result={base,author,key,fixtureIds,checks,issues,calls,cleanup,summary:{total:checks.length,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass)}};
 await fs.mkdir(path.dirname(reportPath),{recursive:true});
 await fs.writeFile(reportPath,JSON.stringify(result,null,2));
 console.log(JSON.stringify({reportPath,summary:result.summary,issues},null,2));
 if(result.summary.failed.length||issues.length)process.exitCode=1;
}


