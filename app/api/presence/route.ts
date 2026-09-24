import { z } from "zod";
import { database } from "@/lib/database";
import { voterKey } from "@/lib/identity";
import { PRESENCE_TTL } from "@/lib/presence";
const payload=z.object({sessionId:z.string().uuid(),author:z.string().trim().min(1).max(40),room:z.enum(["villa","cinema","terrace","jacuzzi"]),action:z.enum(["walk","sit","bathe"]),revision:z.number().int().min(0).max(1000000000)});
async function roster(){const now=Date.now();const result=await database().prepare("WITH active AS (SELECT *,ROW_NUMBER() OVER (PARTITION BY author_key ORDER BY changed DESC,last_seen DESC,session_id) AS rn FROM presence WHERE last_seen>?) SELECT author_key AS authorKey,author,room,action,changed,last_seen AS lastSeen FROM active WHERE rn=1 ORDER BY author_key LIMIT 50").bind(now-PRESENCE_TTL).all();return Response.json({members:result.results,serverTime:now},{headers:{"Cache-Control":"no-store"}});}
export async function GET(){try{return await roster();}catch{return Response.json({error:"La présence est momentanément indisponible."},{status:503});}}
export async function POST(request:Request){try{
  const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return Response.json({error:"Origine non autorisée."},{status:403});
  const raw=await request.text();if(raw.length>2000)return Response.json({error:"Requête trop longue."},{status:413});
  const p=payload.parse(JSON.parse(raw)),now=Date.now(),db=database(),action=p.room==="jacuzzi"?"bathe":p.action==="bathe"?"walk":p.action;
  await db.batch([db.prepare("DELETE FROM presence WHERE last_seen<?").bind(now-86400000),db.prepare("INSERT INTO presence(session_id,author_key,author,room,action,revision,changed,last_seen) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(session_id) DO UPDATE SET author_key=excluded.author_key,author=excluded.author,room=CASE WHEN excluded.revision>presence.revision THEN excluded.room ELSE presence.room END,action=CASE WHEN excluded.revision>presence.revision THEN excluded.action ELSE presence.action END,changed=CASE WHEN excluded.revision>presence.revision THEN excluded.changed ELSE presence.changed END,revision=MAX(presence.revision,excluded.revision),last_seen=excluded.last_seen").bind(p.sessionId,voterKey(p.author),p.author,p.room,action,p.revision,now,now)]);
  return await roster();
}catch{return Response.json({error:"La présence n’a pas pu être synchronisée."},{status:400});}}
