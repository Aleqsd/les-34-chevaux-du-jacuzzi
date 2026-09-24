import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=new URL(process.argv[2]||'https://les-34-chevaux-du-jacuzzi.aleqsd1.chatgpt.site');
if(base.origin!=='https://les-34-chevaux-du-jacuzzi.aleqsd1.chatgpt.site'&&!['127.0.0.1','localhost'].includes(base.hostname))throw Error('Unknown backup source');
async function read(route){const r=await fetch(new URL(route,base),{signal:AbortSignal.timeout(30000),cache:'no-store'});if(!r.ok)throw Error('Backup read failed: HTTP '+r.status);const data=await r.json();if(data.error)throw Error('Backup endpoint returned an error');return data;}
const startedAt=new Date().toISOString(),club=await read('/api/club');
for(const key of ['proposals','votes','profiles','progress','cookieProgress'])if(!Array.isArray(club[key]))throw Error('Incomplete club backup: '+key);
const players=[];
for(let i=0;i<club.cookieProgress.length;i+=3){players.push(...await Promise.all(club.cookieProgress.slice(i,i+3).map(async standing=>{const result=await read('/api/cookie?author='+encodeURIComponent(standing.author));const p=result.player;if(!p||!Array.isArray(p.buildings)||!Array.isArray(p.upgrades)||!Array.isArray(p.achievements)||!Number.isFinite(p.lifetime)||!Number.isFinite(p.version))throw Error('Invalid player backup');if(p.lifetime<standing.lifetime)throw Error('Player lifetime unexpectedly regressed');return {author:standing.author,authorKey:standing.authorKey,...result};})));}
const backup={format:1,kind:'logical-read-only',source:base.origin,startedAt,completedAt:new Date().toISOString(),note:'API snapshot, not a transactionally consistent database dump. Cookie balances include accrued production projected by GET. Action receipts and transient presence are not included. Keep the production database and bindings intact.',club,players};
const folder=path.join(root,'.sites-runtime','backups');await fs.mkdir(folder,{recursive:true});
const file=path.join(folder,startedAt.replaceAll(':','-')+'-progress.json'),bytes=JSON.stringify(backup,null,2)+'\n';
await fs.writeFile(file,bytes,{flag:'wx'});
const digest=createHash('sha256').update(bytes).digest('hex');await fs.writeFile(file+'.sha256',digest+'  '+path.basename(file)+'\n',{flag:'wx'});
const reread=await fs.readFile(file);if(createHash('sha256').update(reread).digest('hex')!==digest)throw Error('Backup verification failed');
console.log(JSON.stringify({file,players:players.length,proposals:club.proposals.length,votes:club.votes.length,sha256:digest}));
