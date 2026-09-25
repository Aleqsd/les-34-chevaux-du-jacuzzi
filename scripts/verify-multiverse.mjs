import {retryLocalDb} from './local-db-retry.mjs';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import {randomUUID} from 'node:crypto';
const base=process.env.COOKIE_TEST_URL||'http://localhost:5173',author='TestMultiverse23',key=author.toLowerCase();
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname))throw Error('Local tests only');
const mod={exports:{}};new Function('exports','module',ts.transpileModule(await fs.readFile('lib/cookie-game.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports,mod);const g=mod.exports;
const checks=[],issues=[];let owned=false;
const check=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)throw Error(name);};
const near=(a,b)=>Math.abs(a-b)<=Math.max(1e-6,Math.abs(b)*1e-12);
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
function db(sql){const r=retryLocalDb(()=>spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--command',sql,'--json'],{encoding:'utf8',maxBuffer:3e6}));if(r.status!==0)throw Error(r.stderr||r.stdout);return JSON.parse(r.stdout);}
async function req(action,id=randomUUID(),expected=200){const r=await fetch(base+'/api/cookie',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({author,id,action})});const data=await r.json();check(action.kind+' HTTP '+expected,r.status===expected);return data;}
async function read(){const r=await fetch(base+'/api/cookie?author='+encodeURIComponent(author));check('read API',r.ok);return (await r.json()).player;}
function seed(patch){const p={...g.freshCookiePlayer(Date.now()+60000),...patch};db('UPDATE cookie_players SET data='+quote(JSON.stringify(p))+',updated='+p.updated+',version=version+1,last_action=\'\' WHERE author_key='+quote(key));return p;}
function finite(value){if(typeof value==='number')return Number.isFinite(value);if(value&&typeof value==='object')return Object.values(value).every(finite);return true;}
try{
 check('37 buildings,175 recipes,78 missions,135 achievements',g.BUILDINGS.length===37&&g.UPGRADES.length===175&&g.COOKIE_MISSIONS.length===78&&g.COOKIE_ACHIEVEMENTS.length===135);
 for(const catalogue of [g.BUILDINGS,g.UPGRADES,g.COOKIE_MISSIONS,g.COOKIE_ACHIEVEMENTS])check('catalogue unique IDs within API limit',new Set(catalogue.map(x=>x.id)).size===catalogue.length&&catalogue.every(x=>x.id.length<=40));
 for(let i=16;i<g.BUILDINGS.length;i++){
  const p={...g.freshCookiePlayer(1000),balance:1e100,lifetime:g.buildingUnlock(i),buildings:g.BUILDINGS.map((_,j)=>j<=i&&j>=i-2?100:0)};
  for(const u of g.UPGRADES.filter(u=>u.building===i||u.synergy?.target===i)){check('new recipe ready '+u.id,g.upgradeReady(p,u));g.applyCookieAction(p,{kind:'upgrade',upgrade:u.id},1000);check('new recipe purchased '+u.id,p.upgrades.includes(u.id));}
  const before=g.baseProduction(p);g.applyCookieAction(p,{kind:'buy',building:i,quantity:1},1000);check('new building productive '+i,g.baseProduction(p)>before&&finite(p));
 }
 if(db('SELECT author_key FROM cookie_players WHERE author_key='+quote(key))[0].results.length)throw Error('Pre-existing fixture, refusing overwrite');
 await req({kind:'sync'});owned=true;
 const start=seed({balance:1e30,lifetime:1e30,runEarned:1e30,clicks:1e6,prestige:1e10,buildings:g.BUILDINGS.map((_,i)=>i===15?100:0),autoCredit:20,goldenReadyAt:0});
 let p=(await req({kind:'click',count:12})).player;check('manual earnings cross former ceiling',p.balance>1e30&&p.lifetime>1e30&&p.runEarned>1e30);
 p=(await req({kind:'auto',count:10})).player;check('pilot earnings above former ceiling',p.lifetime>start.lifetime&&p.balance>1e30);
 const beforeGolden=p.balance;p=(await req({kind:'golden'})).player;check('golden reward beyond old cap',p.balance>beforeGolden);
 p=await read();check('finite JSON readback beyond1e30',p.balance>1e30&&finite(p));
 seed({balance:1e34,lifetime:1e34,runEarned:1e34});
 const id=randomUUID(),results=await Promise.all([req({kind:'buy',building:16,quantity:10},id),req({kind:'buy',building:16,quantity:10},id)]);
 const cost=g.buildingPrice({...g.freshCookiePlayer(1000)},16,10);p=await read();check('retry UUID purchases new building exactly once',results.every(r=>r.player.buildings[16]===10)&&p.buildings[16]===10&&near(p.balance,1e34-cost));
 await req({kind:'upgrade',upgrade:'antimatter_double'});p=await read();check('new recipe persists',p.upgrades.includes('antimatter_double'));
 const beforeMission=p.balance;await req({kind:'mission',mission:'multiverse_m0'});p=await read();check('postcap mission claimed once',p.missions.includes('multiverse_m0')&&p.balance>beforeMission);await req({kind:'mission',mission:'multiverse_m0'},undefined,400);
 seed({balance:1e119,lifetime:1e120,runEarned:1e120,buildings:g.BUILDINGS.map((_,i)=>i===36?1:0)});
 p=(await req({kind:'buy',building:36,quantity:1})).player;check('last building purchasable and finite',p.buildings[36]===2&&finite(p));
 p=(await req({kind:'prestige'})).player;const stars=p.prestige;p=await read();check('huge prestige persists without nonfinite data',stars>1e50&&p.prestige===stars&&p.lifetime===g.COOKIE_CAP&&finite(p));
 seed({balance:1e32,lifetime:1e30,buildings:g.BUILDINGS.map(()=>0)});await req({kind:'buy',building:17,quantity:1},undefined,400);await req({kind:'buy',building:g.BUILDINGS.length,quantity:1},undefined,400);
}catch(error){issues.push({error:String(error),stack:error.stack});}
finally{
 if(owned){db('DELETE FROM cookie_actions WHERE author_key='+quote(key)+'; DELETE FROM cookie_players WHERE author_key='+quote(key));check('local fixture removed',db('SELECT author_key FROM cookie_players WHERE author_key='+quote(key))[0].results.length===0);}
 const summary={total:checks.length,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass)};await fs.writeFile('.sites-runtime/multiverse-integration-report.json',JSON.stringify({summary,checks,issues},null,2));console.log(JSON.stringify({summary,issues},null,2));if(issues.length||summary.failed.length)process.exitCode=1;
}
