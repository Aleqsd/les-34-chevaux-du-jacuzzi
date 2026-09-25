import {database} from '@/lib/database';
import {voterKey} from '@/lib/identity';
import {normalizeBuildings,settle,type CookiePlayer} from '@/lib/cookie-game';
import {readWonder} from '@/lib/wonder-data';
import {REWARDS} from '@/lib/rewards';
import release from '@/lib/site-release.json';

/** Read-only individual export. The web game's declared identity model is unchanged. */
export async function GET(request:Request){
 const author=new URL(request.url).searchParams.get('author')?.trim();
 if(!author||author.length>40)return Response.json({error:'Choisis ton profil avant d’exporter.'},{status:400});
 try{
  const db=database(),key=voterKey(author);
  const [rows,wonder]=await Promise.all([db.batch([
   db.prepare('SELECT data,version,updated FROM cookie_players WHERE author_key=?').bind(key),
   db.prepare('SELECT avatar,hat,eyewear,floatie,accessory,animated,accessory_positions AS positions FROM profiles WHERE author_key=?').bind(key),
   db.prepare('SELECT peak_votes FROM crew_progress WHERE author_key=?').bind(key),
  ]),readWonder()]);
  const row=rows[0].results[0] as {data:string;version:number;updated:number}|undefined;
  if(!row)return Response.json({error:'Commence une partie avant de l’exporter.'},{status:404});
  const player=normalizeBuildings({...JSON.parse(row.data),version:row.version,updated:row.updated} as CookiePlayer),now=Date.now();settle(player,now);
  const cosmetics=rows[1].results[0]??{avatar:0,hat:'none',eyewear:'none',accessory:'none',animated:1,floatie:0};
  const peak=(rows[2].results[0] as {peak_votes:number}|undefined)?.peak_votes??0;
  const entitlements=REWARDS.filter(r=>peak>=r.votes).flatMap(r=>r.items.map(item=>item.slot+':'+item.id));
  return Response.json({format:'cookie-jacuzzi-web',formatVersion:1,gameVersion:release.version,exportedAt:now,exportId:crypto.randomUUID(),player,cosmetics,entitlements,wonder:{stage:wonder.stage}},{headers:{'Cache-Control':'no-store, private','Content-Disposition':'attachment; filename="cookie-jacuzzi-steam.json"','X-Content-Type-Options':'nosniff'}});
 }catch{ return Response.json({error:'L’export est indisponible. Ta progression est conservée.'},{status:503}); }
}
