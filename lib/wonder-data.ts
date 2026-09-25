import { database } from "@/lib/database";
import { wonderSummary } from "@/lib/cookie-game";

export async function readWonder(){
 const result=await database().prepare("SELECT author,author_key AS authorKey,json_extract(data,'$.wonder.completed') AS completed FROM cookie_players WHERE json_array_length(json_extract(data,'$.wonder.completed'))>0").all<{author:string;authorKey:string;completed:string}>();
 return wonderSummary(result.results.map(r=>({...r,completed:JSON.parse(r.completed) as number[]})));
}
