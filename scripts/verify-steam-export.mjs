import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {retryLocalDb} from './local-db-retry.mjs';
const base=process.env.COOKIE_TEST_URL||'http://localhost:5173';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname))throw Error('Only localhost fixtures are permitted');
const author='TestSteamExport30',key='teststeamexport30',id=crypto.randomUUID();
function db(sql){const r=retryLocalDb(()=>spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--command',sql,'--json'],{encoding:'utf8'}));if(r.status!==0)throw Error(r.stderr||r.stdout);return JSON.parse(r.stdout);}
assert.equal(db("SELECT author_key FROM cookie_players WHERE author_key='"+key+"'")[0].results.length,0,'Refuse to overwrite an existing identity');
try{
 const missing=await fetch(base+'/api/cookie/export');assert.equal(missing.status,400);
 const absent=await fetch(base+'/api/cookie/export?author='+author);assert.equal(absent.status,404);
 const click=await fetch(base+'/api/cookie',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({author,id,action:{kind:'click',count:3}})});assert.equal(click.status,200);
 const before=db("SELECT data,version,updated FROM cookie_players WHERE author_key='"+key+"'")[0].results[0];
 const response=await fetch(base+'/api/cookie/export?author='+author);assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
 const exported=await response.json();assert.equal(exported.format,'cookie-jacuzzi-web');assert.equal(exported.formatVersion,1);assert.equal(exported.player.clicks,3);assert.equal(exported.player.version,before.version);assert.ok(Array.isArray(exported.entitlements));assert.ok(Number.isInteger(exported.wonder.stage));assert.equal(exported.author,undefined);
 const after=db("SELECT data,version,updated FROM cookie_players WHERE author_key='"+key+"'")[0].results[0];assert.deepEqual(after,before,'Export must not mutate the web save');
 console.log(JSON.stringify({passed:true,checks:['missing profile','absent profile','individual export','cache protection','cosmetics and decor envelope','read-only database'],gameVersion:exported.gameVersion}));
}finally{
 db("DELETE FROM cookie_actions WHERE author_key='"+key+"'; DELETE FROM cookie_players WHERE author_key='"+key+"';");
 assert.equal(db("SELECT author_key FROM cookie_players WHERE author_key='"+key+"'")[0].results.length,0);
}
