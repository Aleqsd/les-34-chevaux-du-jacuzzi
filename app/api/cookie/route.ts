import { z } from "zod";
import { database } from "@/lib/database";
import { voterKey } from "@/lib/identity";
import { freshCookiePlayer,settle,applyCookieAction,type CookiePlayer } from "@/lib/cookie-game";
const author=z.string().trim().min(1).max(40),uuid=z.string().uuid();
const action=z.discriminatedUnion("kind",[z.object({kind:z.literal("sync")}),z.object({kind:z.literal("event"),eventAt:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)}),z.object({kind:z.literal("click"),count:z.number().int().min(1).max(25)}),z.object({kind:z.literal("auto"),count:z.number().int().min(1).max(25)}),z.object({kind:z.literal("buy"),building:z.number().int().min(0).max(9),quantity:z.number().int().min(1).max(1000)}),z.object({kind:z.literal("upgrade"),upgrade:z.string().max(40)}),z.object({kind:z.literal("golden")}),z.object({kind:z.literal("mission"),mission:z.string().max(10)}),z.object({kind:z.literal("rebuild"),mission:z.string().max(10),run:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)}),z.object({kind:z.literal("contractAccept"),contract:z.enum(["produce","spend","catch"]),cycle:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)}),z.object({kind:z.literal("contractClaim"),contractId:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)}),z.object({kind:z.literal("contractCancel"),contractId:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)}),z.object({kind:z.literal("specialize"),specialization:z.enum(["architect","artisan","watcher"]),expectedChangeAt:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)}),z.object({kind:z.literal("prestige")})]);
type Row={data:string;version:number;updated:number};
export async function GET(request:Request){try{const name=author.parse(new URL(request.url).searchParams.get("author")),row=await database().prepare("SELECT data,version,updated FROM cookie_players WHERE author_key=?").bind(voterKey(name)).first<Row>(),now=Date.now(),player=row?{...JSON.parse(row.data),version:row.version,updated:row.updated} as CookiePlayer:freshCookiePlayer(now);const offline=settle(player,now);return Response.json({player,offline},{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({error:"La sauvegarde du jeu est indisponible."},{status:503});}}
export async function POST(request:Request){try{
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return Response.json({error:"Origine non autorisée."},{status:403});
 const raw=await request.text();if(raw.length>3000)return Response.json({error:"Requête trop longue."},{status:413});
 const body=z.object({author,id:uuid,action}).parse(JSON.parse(raw)),key=voterKey(body.author),payload=JSON.stringify(body.action),db=database(),now=Date.now();
 await db.prepare("INSERT OR IGNORE INTO cookie_players(author_key,author,data,version,updated,last_action) VALUES(?,?,?,0,?,'')").bind(key,body.author,JSON.stringify(freshCookiePlayer(now)),now).run();
 for(let attempt=0;attempt<5;attempt++){
  const results=await db.batch([db.prepare("SELECT payload,result FROM cookie_actions WHERE author_key=? AND id=?").bind(key,body.id),db.prepare("SELECT data,version,updated FROM cookie_players WHERE author_key=?").bind(key)]);
  const prior=results[0].results[0] as {payload:string;result:string}|undefined;if(prior){if(prior.payload!==payload)return Response.json({error:"Cette requête a déjà un autre contenu."},{status:409});const saved=results[1].results[0] as Row;return Response.json({...JSON.parse(prior.result),player:{...JSON.parse(saved.data),version:saved.version,updated:saved.updated}});}
  const row=results[1].results[0] as Row;const player={...JSON.parse(row.data),version:row.version,updated:row.updated} as CookiePlayer;
  let detail;try{detail=applyCookieAction(player,body.action,Date.now());}catch(error){return Response.json({error:(error as Error).message},{status:400});}
  player.version=row.version+1;const result=JSON.stringify(detail),data=JSON.stringify(player);
  const committed=await db.batch([
   db.prepare("UPDATE cookie_players SET author=?,data=?,version=?,updated=?,last_action=? WHERE author_key=? AND version=? AND NOT EXISTS(SELECT 1 FROM cookie_actions WHERE author_key=? AND id=?)").bind(body.author,data,player.version,player.updated,body.id,key,row.version,key,body.id),
   db.prepare("INSERT OR IGNORE INTO cookie_actions(author_key,id,payload,result,created) SELECT author_key,?,?,?,? FROM cookie_players WHERE author_key=? AND version=? AND last_action=?").bind(body.id,payload,result,now,key,player.version,body.id),
   db.prepare("SELECT payload,result FROM cookie_actions WHERE author_key=? AND id=?").bind(key,body.id),
   db.prepare("SELECT data,version,updated FROM cookie_players WHERE author_key=?").bind(key)
  ]);
  const receipt=committed[2].results[0] as {payload:string;result:string}|undefined;if(receipt){if(receipt.payload!==payload)return Response.json({error:"Cette requête a déjà un autre contenu."},{status:409});const saved=committed[3].results[0] as Row;return Response.json({...JSON.parse(receipt.result),player:{...JSON.parse(saved.data),version:saved.version,updated:saved.updated}});}
 }
 return Response.json({error:"Un autre onglet joue aussi. Réessaie dans un instant."},{status:409});
 }catch(error){if(error instanceof z.ZodError||error instanceof SyntaxError)return Response.json({error:"Action de jeu invalide."},{status:400});console.error("cookie:write",error);return Response.json({error:"Sauvegarde interrompue. Réessaie pour conserver ta progression."},{status:503});}}
