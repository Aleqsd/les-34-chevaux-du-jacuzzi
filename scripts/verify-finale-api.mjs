import fs from 'node:fs';
import ts from 'typescript';
import {spawnSync} from 'node:child_process';
import {retryLocalDb} from './local-db-retry.mjs';
const base=process.env.COOKIE_TEST_URL||'http://localhost:5173';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname))throw Error('Local tests only');
const m={exports:{}};new Function('exports','module',ts.transpileModule(fs.readFileSync('lib/cookie-game.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,m);const g=m.exports;
const name='TestFinale29',key=name.toLowerCase(),quote=s=>"'"+s.replaceAll("'","''")+"'";
const checks=[],check=(name,pass)=>checks.push({name,pass:!!pass});let owned=false;
function db(sql){const r=retryLocalDb(()=>spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--command',sql,'--json'],{encoding:'utf8',maxBuffer:2e6}));if(r.status)throw Error(r.stderr||r.stdout);return JSON.parse(r.stdout);}
async function post(path,body){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(body)});return {status:r.status,...await r.json()};}
const req=(action,id=crypto.randomUUID())=>post('/api/cookie',{author:name,id,action});
const avatar=()=>post('/api/social',{action:'profile',author:name,avatar:138,imageUrl:'',transformVersion:2});
try{
 if(db('SELECT author_key FROM cookie_players WHERE author_key='+quote(key)+' UNION SELECT author_key FROM profiles WHERE author_key='+quote(key))[0].results.length)throw Error('Pre-existing fixture; refusing overwrite');
 await req({kind:'sync'});owned=true;
 const p={...g.freshCookiePlayer(Date.now()+60000),lifetime:1e199,balance:1e190,runEarned:1e190,achievements:g.COOKIE_ACHIEVEMENTS.map(a=>a.id)};
 db('UPDATE cookie_players SET data='+quote(JSON.stringify(p))+',version=version+1 WHERE author_key='+quote(key));
 check('final profile blocked below cap',(await avatar()).status===400);
 check('final companion blocked below cap',(await req({kind:'companionEquip',companion:138,revision:0})).status===400);
 db("UPDATE cookie_players SET data=json_set(data,'$.lifetime',1e200),version=version+1 WHERE author_key="+quote(key));
 const ranks=Object.fromEntries(g.MASTERY_TALENTS.map(t=>[t.id,3])),id=crypto.randomUUID();
 const applied=await req({kind:'mastery',revision:0,ranks},id),retry=await req({kind:'mastery',revision:0,ranks},id);
 check('all 27 ranks accepted',applied.status===200&&g.masterySpent(applied.player)===27);
 check('retry keeps one allocation',retry.status===200&&retry.player.mastery.revision===1);
 check('full tree has zero excess points',g.masteryPoints(applied.player)-g.masterySpent(applied.player)===0);
 const equipped=await req({kind:'companionEquip',companion:138,revision:0});
 check('final companion accepted at cap',equipped.status===200&&equipped.player.voyages.equippedCompanion===138);
 const profile=await avatar();check('final profile accepted at cap',profile.status===201&&profile.record.avatar===138);
 const reb=await req({kind:'prestige'});check('full tree and finale survive prestige',reb.status===200&&g.masterySpent(reb.player)===27&&reb.player.lifetime===g.COOKIE_CAP&&g.companionRecord(reb.player,138).stage===3);
 const read=await(await fetch(base+'/api/cookie?author='+name)).json();check('persisted full tree and companion',g.masterySpent(read.player)===27&&g.masteryPoints(read.player)===27&&read.player.voyages.equippedCompanion===138);
}finally{if(owned)db('DELETE FROM cookie_actions WHERE author_key='+quote(key)+';DELETE FROM cookie_players WHERE author_key='+quote(key)+';DELETE FROM profiles WHERE author_key='+quote(key));}
const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({total:checks.length,passed:checks.length-failed.length,failed},null,2));if(failed.length)process.exitCode=1;

