import { readWonder } from "@/lib/wonder-data";
export async function GET(){try{return Response.json(await readWonder(),{headers:{"Cache-Control":"no-store"}});}catch(error){console.error("wonder:read",error);return Response.json({error:"Le chantier ne répond pas. Réessaie dans un instant."},{status:503});}}
