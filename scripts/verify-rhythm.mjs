import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import crypto from 'node:crypto';
const base=process.env.COOKIE_TEST_URL||'http://localhost:5183';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Local tests only');
const mod={exports:{}};new Function('exports','module',ts.transpileModule(await fs.readFile('lib/cookie-game.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports,mod);const g=mod.exports;
const checks=[],check=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)console.error('FAIL',name);},throws=fn=>{try{fn();return false;}catch{return true;}},near=(a,b)=>Math.abs(a-b)<Math.max(1e-7,Math.abs(b)*1e-10);
const hits=Array(64).fill(0),fresh=()=>g.freshCookiePlayer(1000),start=p=>g.applyCookieAction(p,{kind:'rhythmStart',cycle:p.rhythm?.cycle??0},p.updated),finish=(p,time=p.updated+g.RHYTHM_DURATION,values=hits)=>g.applyCookieAction(p,{kind:'rhythmFinish',runId:p.rhythm.active.id,hits:values,strays:0},time);
check('64 ordered notes with manageable bursts',g.RHYTHM_NOTES.length===64&&g.RHYTHM_NOTES.every((n,i)=>!i||n.at-g.RHYTHM_NOTES[i-1].at>=272));
check('perfect chart succeeds',g.rhythmScore(hits,0).passed);
check('consistent good timing succeeds',g.rhythmScore(Array(64).fill(110),0).passed);
check('eight misses can succeed',g.rhythmScore([...Array(8).fill(g.RHYTHM_MISS),...Array(56).fill(0)],0).passed);
check('nine misses fail despite high accuracy',!g.rhythmScore([...Array(9).fill(g.RHYTHM_MISS),...Array(55).fill(0)],0).passed);
check('weak timing fails',!g.rhythmScore(Array(64).fill(190),0).passed);
check('stray tapping is penalized',!g.rhythmScore(hits,19).passed);
const p=fresh();p.buildings[1]=10;p.clicks=2000;const legacy=structuredClone(p);start(p);check('start does not pay a reward',!p.rhythm.boostUntil&&p.balance===legacy.balance);
check('early completion rejected',throws(()=>finish(p,2000)));check('unknown run rejected',throws(()=>g.applyCookieAction(p,{kind:'rhythmFinish',runId:99,hits,strays:0},1000+g.RHYTHM_DURATION)));
check('malformed replay rejected',throws(()=>finish(p,1000+g.RHYTHM_DURATION,[0])));
const end=1000+g.RHYTHM_DURATION;finish(p,end);check('win grants exactly24h',p.rhythm.boostUntil===end+86400000&&p.rhythm.last.rewarded);
check('production is boosted25percent',near(g.production(p,end),g.production({...p,rhythm:undefined},end)*1.25));check('manual click boosted25percent',near(g.manualClickPower(p,end),g.manualClickPower({...p,rhythm:undefined},end)*1.25));check('pilot click boosted25percent',near(g.clickPower(p,end),g.clickPower({...p,rhythm:undefined},end)*1.25));
const expires=p.rhythm.boostUntil;check('expiry is exact',g.rhythmMultiplier(p,expires-1)===1.25&&g.rhythmMultiplier(p,expires)===1);
check('offline reward splits at expiry',near(g.passiveGain(p,expires-10000,expires+10000),g.baseProduction(p)*22.5));
const stacked={...p,rushUntil:expires-5000,eventBuffs:{steamUntil:expires+5000,manualMultiplier:2}};
check('offline integrates overlapping buffs at their own boundaries',near(g.passiveGain(stacked,expires-10000,expires+10000),g.baseProduction(stacked)*(5*7*1.25+5*3*1.25+5*3+5)));
const trialStack={...stacked,trialBoostUntil:expires+2000};
check('trial and rhythm bonuses expire independently',near(g.passiveGain(trialStack,expires-10000,expires+10000),g.baseProduction(trialStack)*(5*7*1.25*2+5*3*1.25*2+2*3*2+3*3+5)));
check('temporary rhythm reward does not inflate contract terms',JSON.stringify(g.contractTerms(p,'produce'))===JSON.stringify(g.contractTerms({...p,rhythm:undefined},'produce')));
check('no second claim for a finished run',throws(()=>g.applyCookieAction(p,{kind:'rhythmFinish',runId:1,hits,strays:0},end+1000)));
start(p);finish(p);check('repeated win never extends active bonus',p.rhythm.boostUntil===expires&&!p.rhythm.last.rewarded&&p.rhythm.wins===2);
const book=JSON.stringify(p.rhythm);p.runEarned=1e9;g.applyCookieAction(p,{kind:'prestige'},p.updated);check('prestige preserves record and bonus',JSON.stringify(p.rhythm)===book);
const failed=fresh();start(failed);finish(failed,1000+g.RHYTHM_DURATION,Array(64).fill(g.RHYTHM_MISS));check('failure recorded without a reward',failed.rhythm.last.misses===64&&!failed.rhythm.boostUntil&&!failed.rhythm.wins);start(failed);check('retry is free and immediate',failed.rhythm.cycle===2&&failed.balance===0);
const expired=fresh();start(expired);check('abandoned runs expire',throws(()=>finish(expired,1000+16*60000)));
const renewed=fresh();renewed.rhythm={cycle:0,boostUntil:999};start(renewed);finish(renewed);check('new win after expiry renews24h',renewed.rhythm.boostUntil===renewed.updated+86400000);
// Four immutable charts and per-track progress share one reward timer.
check('four unique chart IDs',g.RHYTHM_CHARTS.length===4&&new Set(g.RHYTHM_CHARTS.map(c=>c.id)).size===4);
const oldModule={exports:{}};new Function('exports','module',ts.transpileModule(spawnSync('git',['show','de0e0a5c30466b40a4d5b037b8d90b0217e2acf5:lib/cookie-game.ts'],{encoding:'utf8'}).stdout,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(oldModule.exports,oldModule);
check('original Groove timing is frozen',JSON.stringify(oldModule.exports.RHYTHM_NOTES)===JSON.stringify(g.rhythmChart('groove').notes)&&oldModule.exports.RHYTHM_DURATION===g.rhythmChart('groove').duration);
for(const chart of g.RHYTHM_CHARTS){
 check(chart.id+' ordered bounded64-note pattern',chart.notes.length===64&&chart.notes.every((n,i)=>Number.isFinite(n.at)&&n.x>=20&&n.x<=80&&n.y>=25&&n.y<=75&&(!i||n.at>chart.notes[i-1].at))&&chart.duration===chart.notes[63].at+1000);
 const t=fresh();g.applyCookieAction(t,{kind:'rhythmStart',cycle:0,chart:chart.id},1000);
 check(chart.id+' server stores selected immutable chart',t.rhythm.active.chart===chart.id&&t.rhythm.active.rules===2);
 check(chart.id+' own duration rejects early finish',throws(()=>finish(t,1000+chart.duration-1000)));
 for(const values of [Array(63).fill(0),Array(65).fill(0),Array(64).fill(210.5),Array(64).fill(NaN),Array(64).fill(Infinity),Array(64).fill(null)])check(chart.id+' malformed result rejected',throws(()=>finish(t,1000+chart.duration,values)));
 const burst=chart.notes.findIndex((n,i)=>i>0&&n.at-chart.notes[i-1].at<400);if(burst>0){const invalid=Array(64).fill(0);invalid[burst-1]=200;invalid[burst]=-200;check(chart.id+' overlapping hit chronology rejected',throws(()=>finish(t,1000+chart.duration,invalid)));}
 finish(t,1000+chart.duration);check(chart.id+' separate record and24h reward',t.rhythm.last.chart===chart.id&&t.rhythm.records[chart.id].best===100&&t.rhythm.records[chart.id].wins===1&&t.rhythm.records[chart.id].combo===64&&t.rhythm.boostUntil===t.updated+86400000);
}
check('unknown start chart rejected by model',throws(()=>g.applyCookieAction(fresh(),{kind:'rhythmStart',cycle:0,chart:'missing'},1000)));
const migrated=fresh();migrated.rhythm={cycle:4,best:96,wins:7,boostUntil:1e7,active:{id:4,startedAt:1000,rules:1}};finish(migrated,1000+g.RHYTHM_DURATION);check('legacy active run finishes and migrates its own records',migrated.rhythm.records.groove.best===100&&migrated.rhythm.records.groove.wins===8&&migrated.rhythm.boostUntil===1e7);
for(const chart of g.RHYTHM_CHARTS.slice(1)){g.applyCookieAction(migrated,{kind:'rhythmStart',cycle:migrated.rhythm.cycle,chart:chart.id},migrated.updated);finish(migrated,migrated.updated+chart.duration);check(chart.id+' does not borrow old records or extend bonus',migrated.rhythm.records[chart.id].wins===1&&migrated.rhythm.records.groove.wins===8&&migrated.rhythm.boostUntil===1e7);}
const preserved=JSON.stringify(migrated.rhythm);migrated.runEarned=1e9;g.applyCookieAction(migrated,{kind:'prestige'},migrated.updated);check('prestige keeps all four records',JSON.stringify(migrated.rhythm)===preserved);
const legacyBook={cycle:0,best:93,wins:5};check('UI reads legacy record only for Groove',g.rhythmRecord(legacyBook,'groove').wins===5&&g.rhythmRecord(legacyBook,'supernova')===undefined&&g.rhythmRecord({...legacyBook,records:{supernova:{best:100,wins:1}}},'groove')===undefined);
const quote=s=>"'"+String(s).replaceAll("'","''")+"'",name='TestRhythm'+crypto.randomUUID().slice(0,8),key=name.toLowerCase();let owned=false;
function db(sql){const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--command',sql,'--json'],{encoding:'utf8',maxBuffer:2e6});if(r.status!==0)throw Error(r.stderr||r.stdout);return JSON.parse(r.stdout);}
async function req(action,id=crypto.randomUUID()){const r=await fetch(base+'/api/cookie',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({author:name,id,action})});return {status:r.status,...await r.json()};}
try{
 if(db('SELECT author_key FROM cookie_players WHERE author_key='+quote(key))[0].results.length)throw Error('Existing fixture');
 const sync=await req({kind:'sync'});owned=sync.status===200;check('local sync',owned);
 const id=crypto.randomUUID(),begins=await Promise.all([req({kind:'rhythmStart',cycle:0},id),req({kind:'rhythmStart',cycle:0},id)]);check('duplicate start keeps one run',begins.every(r=>r.status===200&&r.player.rhythm.cycle===1));
 check('HTTP early replay rejected',(await req({kind:'rhythmFinish',runId:1,hits,strays:0})).status===400);
 check('HTTP invalid timing rejected',(await req({kind:'rhythmFinish',runId:1,hits:Array(64).fill(211),strays:0})).status===400);
 const state=begins[0].player;state.rhythm.active.startedAt=Date.now()-g.RHYTHM_DURATION-1000;db('UPDATE cookie_players SET data='+quote(JSON.stringify(state))+' WHERE author_key='+quote(key));
 const claimId=crypto.randomUUID(),action={kind:'rhythmFinish',runId:1,hits,strays:0},claims=await Promise.all([req(action,claimId),req(action,claimId)]);check('duplicate UUID pays once',claims.every(r=>r.status===200&&r.player.rhythm.wins===1)&&claims[0].player.rhythm.boostUntil===claims[1].player.rhythm.boostUntil);
 check('new UUID cannot claim again',(await req(action)).status===400);
 const reload=await(await fetch(base+'/api/cookie?author='+name)).json();check('reload keeps bonus and record',reload.player.rhythm.best===100&&reload.player.rhythm.boostUntil===claims[0].player.rhythm.boostUntil);
 const cycles=await Promise.all([req({kind:'rhythmStart',cycle:1}),req({kind:'rhythmStart',cycle:1})]);check('concurrent tabs cannot replace same cycle',cycles.filter(r=>r.status===200).length===1&&cycles.filter(r=>r.status===400).length===1);
 check('unknown chart HTTP rejected',(await req({kind:'rhythmStart',cycle:2,chart:'missing'})).status===400);
 let current=(await(await fetch(base+'/api/cookie?author='+name)).json()).player;const initialWins=current.rhythm.wins,initialExpiry=current.rhythm.boostUntil;
 for(const chart of g.RHYTHM_CHARTS.slice(1)){
  const startId=crypto.randomUUID(),a={kind:'rhythmStart',cycle:current.rhythm.cycle,chart:chart.id};const starts=await Promise.all([req(a,startId),req(a,startId)]);check(chart.id+' HTTP duplicate start locks selected chart',starts.every(r=>r.status===200&&r.player.rhythm.active.chart===chart.id));current=starts[0].player;
  check(chart.id+' HTTP early result rejected',(await req({kind:'rhythmFinish',runId:current.rhythm.active.id,hits,strays:0})).status===400);
  current.rhythm.active.startedAt=Date.now()-chart.duration-1000;db('UPDATE cookie_players SET data='+quote(JSON.stringify(current))+' WHERE author_key='+quote(key));
  const done={kind:'rhythmFinish',runId:current.rhythm.active.id,hits,strays:0,chart:'groove'},doneId=crypto.randomUUID();const ends=await Promise.all([req(done,doneId),req(done,doneId)]);check(chart.id+' HTTP finish uses server chart, retry pays once',ends.every(r=>r.status===200&&r.player.rhythm.records[chart.id].wins===1&&r.player.rhythm.last.chart===chart.id&&r.player.rhythm.boostUntil===initialExpiry));current=ends[0].player;
 }
 const stored=(await(await fetch(base+'/api/cookie?author='+name)).json()).player;check('all chart records persist through API reload',stored.rhythm.wins===initialWins+3&&g.RHYTHM_CHARTS.every(c=>stored.rhythm.records[c.id]?.best===100));
}finally{if(owned)db('DELETE FROM cookie_actions WHERE author_key='+quote(key)+'; DELETE FROM cookie_players WHERE author_key='+quote(key));}
const summary={total:checks.length,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass)};await fs.writeFile('.sites-runtime/rhythm-report.json',JSON.stringify({summary,checks},null,2));console.log(JSON.stringify(summary));if(summary.failed.length)process.exitCode=1;
