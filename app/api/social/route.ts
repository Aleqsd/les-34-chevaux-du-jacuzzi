import { database } from "@/lib/database";
import { z } from "zod";
const author=z.string().trim().min(1,"Choisis ton prénom.").max(40);
const uuid=z.string().uuid();
const schema=z.discriminatedUnion("action",[
  z.object({action:z.literal("comment"),id:uuid,proposalId:uuid,author,body:z.string().trim().min(1,"Écris un message.").max(1500,"1500 caractères maximum.")}),
  z.object({action:z.literal("details"),proposalId:uuid,author,costCents:z.number().int().min(0).max(1000000).nullable(),address:z.string().trim().max(300),travel:z.string().trim().max(200),capacity:z.number().int().min(1).max(10000).nullable(),pricing:z.string().trim().max(1500),notes:z.string().trim().max(3000)}),
  z.object({action:z.literal("duel"),id:uuid,firstId:uuid,secondId:uuid,chosenId:uuid,author}),
  z.object({action:z.literal("select"),id:uuid,proposalId:uuid,author,start:z.string().datetime({offset:true}),end:z.string().datetime({offset:true})}),
  z.object({action:z.literal("attend"),planId:uuid,author,attending:z.boolean()}),
  z.object({action:z.literal("profile"),author,avatar:z.number().int().min(0).max(11),imageUrl:z.string().trim().max(1000).refine(s=>!s||(()=>{try{return new URL(s).protocol==="https:";}catch{return false;}})(),"Utilise une image avec une URL https://.")}),
]);
export async function POST(request:Request){
  try{
    const origin=request.headers.get("origin");
    if(origin&&origin!==new URL(request.url).origin)return Response.json({error:"Origine non autorisée."},{status:403});
    const raw=await request.text();if(raw.length>12000)return Response.json({error:"Message trop long."},{status:413});
    const p=schema.parse(JSON.parse(raw));const db=database();const now=new Date().toISOString();
    if("proposalId" in p){
      const target=await db.prepare("SELECT kind FROM proposals WHERE id=?").bind(p.proposalId).first();
      if(!target)throw new Error("Cette proposition n’existe plus.");
      if(p.action==="details"&&target.kind!=="activity")throw new Error("Cette fiche doit être une activité.");
    }
    if(p.action==="comment")await db.prepare("INSERT OR IGNORE INTO comments (id,proposal_id,author,body,created) VALUES (?,?,?,?,?)").bind(p.id,p.proposalId,p.author,p.body,now).run();
    if(p.action==="details")await db.prepare("INSERT INTO activity_details (proposal_id,cost_cents,address,travel,capacity,pricing,notes,updated_by,updated) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(proposal_id) DO UPDATE SET cost_cents=excluded.cost_cents,address=excluded.address,travel=excluded.travel,capacity=excluded.capacity,pricing=excluded.pricing,notes=excluded.notes,updated_by=excluded.updated_by,updated=excluded.updated").bind(p.proposalId,p.costCents,p.address,p.travel,p.capacity,p.pricing,p.notes,p.author,now).run();
    if(p.action==="duel"){
      if(p.firstId===p.secondId||![p.firstId,p.secondId].includes(p.chosenId))throw new Error("Choisis deux films différents et un favori parmi eux.");
      const found=await db.prepare("SELECT id FROM proposals WHERE kind='movie' AND id IN (?,?)").bind(p.firstId,p.secondId).all();
      if(found.results.length!==2)throw new Error("Ces deux films doivent déjà être proposés au crew.");
      const [first,second]=[p.firstId,p.secondId].sort();
      await db.prepare("INSERT OR IGNORE INTO duel_votes (id,first_id,second_id,chosen_id,author,created) VALUES (?,?,?,?,?,?)").bind(p.id,first,second,p.chosenId,p.author,now).run();
    }
    if(p.action==="select"){
      if(new Date(p.end)<=new Date(p.start))throw new Error("La fin doit être après le début.");
      if(new Date(p.start)<new Date("2026-09-20T00:00:00+02:00")||new Date(p.end)>new Date("2026-09-28T00:00:00+02:00"))throw new Error("Le créneau doit être compris entre le 20 et le 27 septembre.");
      await db.prepare("INSERT OR IGNORE INTO selected_plans (id,proposal_id,start,end,selected_by,created) VALUES (?,?,?,?,?,?)").bind(p.id,p.proposalId,p.start,p.end,p.author,now).run();
    }
    if(p.action==="attend"){
      const plan=await db.prepare("SELECT id FROM selected_plans WHERE id=?").bind(p.planId).first();if(!plan)throw new Error("Ce rendez-vous n’existe plus.");
      const key=p.author.normalize("NFKC").toLocaleLowerCase("fr");
      await db.prepare("INSERT INTO plan_participants (plan_id,author_key,author,attending) VALUES (?,?,?,?) ON CONFLICT(plan_id,author_key) DO UPDATE SET author=excluded.author,attending=excluded.attending").bind(p.planId,key,p.author,p.attending?1:0).run();
    }
    if(p.action==="profile")await db.prepare("INSERT INTO profiles (author_key,author,avatar,image_url) VALUES (?,?,?,?) ON CONFLICT(author_key) DO UPDATE SET author=excluded.author,avatar=excluded.avatar,image_url=excluded.image_url").bind(p.author.normalize("NFKC").toLocaleLowerCase("fr"),p.author,p.avatar,p.imageUrl).run();
    // Return the stored row, including on a retried UUID. A failed follow-up
    // refresh must never hide a write that the server has already confirmed.
    let collection="",record:unknown;
    if(p.action==="comment"){collection="comments";record=await db.prepare("SELECT id,proposal_id AS proposalId,author,body,created FROM comments WHERE id=?").bind(p.id).first();}
    if(p.action==="details"){collection="activityDetails";record=await db.prepare("SELECT proposal_id AS proposalId,cost_cents AS costCents,address,travel,capacity,pricing,notes,updated_by AS updatedBy,updated FROM activity_details WHERE proposal_id=?").bind(p.proposalId).first();}
    if(p.action==="duel"){collection="duelVotes";record=await db.prepare("SELECT id,first_id AS firstId,second_id AS secondId,chosen_id AS chosenId,author,created FROM duel_votes WHERE id=?").bind(p.id).first();}
    if(p.action==="select"){collection="plans";record=await db.prepare("SELECT id,proposal_id AS proposalId,start,end,selected_by AS selectedBy,created FROM selected_plans WHERE id=?").bind(p.id).first();}
    if(p.action==="attend"){collection="participants";record=await db.prepare("SELECT plan_id AS planId,author_key AS authorKey,author,attending FROM plan_participants WHERE plan_id=? AND author_key=?").bind(p.planId,p.author.normalize("NFKC").toLocaleLowerCase("fr")).first();}
    if(p.action==="profile"){collection="profiles";record=await db.prepare("SELECT author_key AS authorKey,author,avatar,image_url AS imageUrl FROM profiles WHERE author_key=?").bind(p.author.normalize("NFKC").toLocaleLowerCase("fr")).first();}
    return Response.json({ok:true,collection,record,...("id" in p?{id:p.id}:{})},{status:201});
  }catch(error){
    if(error instanceof z.ZodError)return Response.json({error:error.issues[0]?.message||"Vérifie les informations."},{status:400});
    if(error instanceof SyntaxError)return Response.json({error:"Données invalides."},{status:400});
    const message=error instanceof Error?error.message:"";const known=/^(Cette|Ces|Ce rendez|Choisis|La fin|Le créneau)/.test(message);
    if(!known)console.error("social:write",error);
    return Response.json({error:known?message:"L’enregistrement a échoué. Réessaie, ton texte est conservé."},{status:known?400:503});
  }
}
