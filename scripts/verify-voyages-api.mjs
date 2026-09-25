import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {retryLocalDb} from './local-db-retry.mjs';
const base=process.env.COOKIE_TEST_URL||'http://localhost:5173',author='TestVoyageV28',key='testvoyagev28';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname))throw Error('Local tests only');
const m={exports:{}};new Function('exports','module',ts.transpileModule(fs.readFileSync('lib/cookie-game.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);const g=m.exports;
const db=sql=>{const r=retryLocalDb(()=>spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--command',sql,'--json'],{encoding:'utf8',maxBuffer:2e6}));if(r.status!==0)throw Error(r.stderr||r.stdout);return JSON.parse(r.stdout);};
const quote=s=>"'"+s.replaceAll("'","''")+"'",checks=[],failures=[];
function check(name,fn){try{fn();checks.push(name);}catch(e){failures.push({name,error:e.message});}}
async function action(action,id=crypto.randomUUID(),pendingIds=[]){const response=await fetch(base+'/api/cookie',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({author,id,action,pendingIds})});return {status:response.status,...await response.json()};}
async function read(){return (await fetch(base+'/api/cookie?author='+author)).json();}
function seed(p){db('UPDATE cookie_players SET data='+quote(JSON.stringify(p))+',updated='+p.updated+",version=version+1,last_action='' WHERE author_key='"+key+"'");}
const rich=()=>Object.assign(g.freshCookiePlayer(Date.now()),{lifetime:1e147,balance:1e140,runEarned:1e140,nextEventAt:Date.now()+3600000});
const getBook=()=>({revision:0,cycle:0,inventory:Object.fromEntries(g.INGREDIENT_IDS.map(id=>[id,100])),recipes:[],relics:[],companions:{}});
if(db("SELECT author_key FROM cookie_players WHERE author_key='"+key+"'")[0].results.length)throw Error('Existing test identity; refusing to overwrite');
try{
 const initial=await action({kind:'sync'});assert.equal(initial.status,200);
 const p=rich();seed(p);
 const startId=crypto.randomUUID(),start={kind:'voyageStart',destination:'grove',team:[60,61,62],cycle:0};
 const duplicate=await Promise.all([action(start,startId),action(start,startId)]);
 check('duplicate start UUID returns one run',()=>{assert(duplicate.every(r=>r.status===200));assert(duplicate.every(r=>r.player.voyages.cycle===1));});
 let r=await action(start);check('start stale cycle HTTP400',()=>assert.equal(r.status,400));
 r=await action({kind:'voyageClaim',runId:1});check('early claim rejected',()=>assert.equal(r.status,400));
 r=await action({kind:'voyageChoice',runId:1,step:0,choice:'study'});check('early choice rejected',()=>assert.equal(r.status,400));
 let current=(await read()).player;current.voyages.active.readyAt=Date.now()-1;seed(current);
 const choiceId=crypto.randomUUID(),choice={kind:'voyageChoice',runId:1,step:0,choice:'study'};
 const choices=await Promise.all([action(choice,choiceId),action(choice,choiceId)]);
 check('same UUID choice increments once',()=>{assert(choices.every(r=>r.status===200));assert(choices.every(r=>r.player.voyages.active.step===1));assert(choices.every(r=>r.player.voyages.active.cargo.cocoa===4));});
 r=await action(choice);check('stale choice cannot repeat',()=>assert.equal(r.status,400));
 current=(await read()).player;current.voyages.active.readyAt=Date.now()-1;seed(current);
 r=await action({kind:'voyageChoice',runId:1,step:1,choice:'secret'});check('second choice accepted',()=>assert.equal(r.status,200));
 current=r.player;current.voyages.active.readyAt=Date.now()-1;seed(current);
 const claimId=crypto.randomUUID(),claim={kind:'voyageClaim',runId:1};
 const claims=await Promise.all([action(claim,claimId),action(claim,claimId)]);claims.push(await action(claim));
 check('concurrent claims keep sameUUID idempotent, otherUUID rejected',()=>{assert.equal(claims[0].status,200);assert.equal(claims[1].status,200);assert.equal(claims[2].status,400);});
 current=(await read()).player;check('cargo and personal progress credited once',()=>{assert.equal(current.voyages.inventory.dew,5);assert.equal(current.voyages.inventory.cocoa,6);assert.equal(current.voyages.companions[60].returns,1);assert.equal(current.voyages.relics.length,2);assert(!current.voyages.active);});
 const craftSeed=rich();craftSeed.voyages=getBook();seed(craftSeed);
 const craftId=crypto.randomUUID(),craft={kind:'secretCraft',recipe:'galette',revision:0};
 const crafted=await Promise.all([action(craft,craftId),action(craft,craftId)]);
 check('duplicate craft one debit',()=>{assert(crafted.every(r=>r.status===200));assert(crafted.every(r=>r.player.voyages.inventory.dew===94&&r.player.voyages.inventory.cocoa===96));});
 r=await action({kind:'secretCraft',recipe:'nectar',revision:0});check('stale inventory revision rejected',()=>assert.equal(r.status,400));
 r=await action({kind:'secretEquip',recipe:'galette',revision:1});check('equip learned recipe accepted',()=>assert.equal(r.status,200));
 r=await action({kind:'secretEquip',recipe:'nectar',revision:2});check('equip unlearned recipe rejected',()=>assert.equal(r.status,400));
 const raceSeed=rich();raceSeed.voyages=getBook();seed(raceSeed);
 const crafts=await Promise.all([action({kind:'secretCraft',recipe:'galette',revision:0}),action({kind:'secretCraft',recipe:'nectar',revision:0})]);
 check('distinct concurrent crafts one accepts current revision',()=>{assert.equal(crafts.filter(r=>r.status===200).length,1);assert.equal(crafts.filter(r=>r.status===400).length,1);});
 const evolveSeed=rich();evolveSeed.voyages=getBook();evolveSeed.voyages.companions[60]={stage:1,returns:8,finds:100,secrets:12,regions:['grove','lagoon','archive']};seed(evolveSeed);
 r=await action({kind:'companionEvolve',companion:60,stage:3,revision:0});check('cannot skip evolution stage',()=>assert.equal(r.status,400));
 r=await action({kind:'companionEvolve',companion:60,stage:2,revision:0});check('stage2 persisted',()=>{assert.equal(r.status,200);assert.equal(r.player.voyages.companions[60].stage,2);});
 r=await action({kind:'companionEvolve',companion:60,stage:3,revision:1});check('stage3 persisted',()=>{assert.equal(r.status,200);assert.equal(r.player.voyages.companions[60].stage,3);});
 r=await action({kind:'companionEquip',companion:60,revision:2});check('equipped game companion persisted',()=>{assert.equal(r.status,200);assert.equal(r.player.voyages.equippedCompanion,60);});
 r=await action({kind:'banquetPrepare',course:0,revision:3});check('banquet service debit and bonus persisted',()=>{assert.equal(r.status,200);assert.equal(r.player.voyages.banquetCourse,1);assert.equal(r.player.voyages.inventory.pearl,96);});
 const before=structuredClone(r.player.voyages);r=await action({kind:'prestige'});check('prestige preserves full new book',()=>{assert.equal(r.status,200);assert.deepEqual(r.player.voyages,before);});
 r=await read();check('reload persists book',()=>assert.deepEqual(r.player.voyages,before));
 const purchaseSeed=rich();purchaseSeed.balance=1e9;seed(purchaseSeed);
 const purchaseId=crypto.randomUUID(),unknownId=crypto.randomUUID(),buy={kind:'buy',building:0,quantity:1,run:0};
 r=await action(buy,purchaseId,[purchaseId,unknownId]);check('receipt scope and membership match transaction snapshot',()=>{assert.equal(r.status,200);assert.deepEqual(r.receiptScope,[purchaseId,unknownId]);assert.deepEqual(r.acknowledged,[purchaseId]);assert.equal(r.player.buildings[0],1);});
 r=await action(buy,purchaseId,[purchaseId,unknownId]);check('repeated buy UUID no duplicate debit with receipt scope',()=>{assert.equal(r.player.buildings[0],1);assert.deepEqual(r.acknowledged,[purchaseId]);});
 r=await action({...buy,run:1},crypto.randomUUID(),[purchaseId,unknownId]);check('rejected buy includes authoritative state and scoped receipts',()=>{assert.equal(r.status,400);assert.equal(r.player.buildings[0],1);assert.deepEqual(r.acknowledged,[purchaseId]);assert.deepEqual(r.receiptScope,[purchaseId,unknownId]);});
 r=await action({kind:'upgrade',upgrade:g.UPGRADES[0].id,run:1});check('upgrade rejects stale prestige run',()=>assert.equal(r.status,400));
 const maxId=crypto.randomUUID(),max={kind:'buyAll',run:0,maxCost:9e7};const maxes=await Promise.all([action(max,maxId,[maxId]),action(max,maxId,[maxId])]);
 check('Max All duplicate UUID one atomic building batch',()=>{assert(maxes.every(r=>r.status===200));assert.deepEqual(maxes[0].player.buildings,maxes[1].player.buildings);assert(maxes[0].player.buildings.filter(n=>n>0).length>4);assert(maxes.every(r=>r.acknowledged.includes(maxId)));});
 r=await action({...max,run:1});check('Max All stale prestige rejected',()=>assert.equal(r.status,400));
 const locked=rich();locked.lifetime=1e74;seed(locked);r=await action(max);check('Max All server guards total threshold',()=>assert.equal(r.status,400));
 for(const bad of [{kind:'voyageStart',destination:'unknown',team:[60],cycle:0},{kind:'voyageStart',destination:'grove',team:[60,61,62,63],cycle:0},{kind:'voyageStart',destination:'grove',team:[60.5],cycle:0},{kind:'secretCraft',recipe:'invalid',revision:0},{kind:'companionEvolve',companion:60,stage:4,revision:0},{kind:'banquetPrepare',course:-1,revision:0}]){r=await action(bad);check('schema rejects '+JSON.stringify(bad),()=>assert.equal(r.status,400));}
}finally{db("DELETE FROM cookie_actions WHERE author_key='"+key+"'; DELETE FROM cookie_players WHERE author_key='"+key+"';");}
const report={passed:checks.length,failed:failures.length,failures};fs.writeFileSync('.sites-runtime/voyages-api-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(failures.length)process.exitCode=1;
