import { database } from "@/lib/database";
import { z } from "zod";
import { isActivityEmoji } from "@/lib/activity-emoji";
import { HATS, EYEWEAR, EXTRAS, AVATAR_NAMES } from "@/lib/appearance";
import { MIN_ACCESSORY_SCALE, MAX_ACCESSORY_SCALE, readPositions, ACCESSORIES } from "@/lib/avatar-positions";
import { requiredVotes } from "@/lib/rewards";
const author=z.string().trim().min(1,"Choisis ton prénom.").max(40);
const uuid=z.string().uuid();
const scale=z.number().finite().min(MIN_ACCESSORY_SCALE).max(MAX_ACCESSORY_SCALE);
const position=z.object({x:z.number().finite().min(0).max(100),y:z.number().finite().min(0).max(100),scale:scale.optional(),scaleX:scale.optional(),scaleY:scale.optional(),rotation:z.number().finite().min(-180).max(180).optional(),lockRatio:z.boolean().optional()}).strict();
const positions=z.object({hat:position.optional(),eyewear:position.optional(),floatie:position.optional()}).strict();
const schema=z.discriminatedUnion("action",[
  z.object({action:z.literal("ideaComment"),id:uuid,ideaId:uuid,author,body:z.string().trim().min(1,"Écris un message.").max(1500)}),
  z.object({action:z.literal("deleteFeatureIdea"),id:uuid,author}),
  z.object({action:z.literal("featureIdea"),id:uuid,author,title:z.string().trim().min(1,"Donne un titre à ton idée.").max(120),body:z.string().trim().max(1500).default("")}),
  z.object({action:z.literal("activityEmoji"),proposalId:uuid,author,emoji:z.string().refine(isActivityEmoji,"Choisis un emoji dans la liste.").nullable()}),
  z.object({action:z.literal("comment"),id:uuid,proposalId:uuid,author,body:z.string().trim().min(1,"Écris un message.").max(1500,"1500 caractères maximum.")}),
  z.object({action:z.literal("details"),proposalId:uuid,author,costCents:z.number().int().min(0).max(1000000).nullable(),address:z.string().trim().max(300),travel:z.string().trim().max(200),capacity:z.number().int().min(1).max(10000).nullable(),pricing:z.string().trim().max(1500),notes:z.string().trim().max(3000)}),
  z.object({action:z.literal("select"),id:uuid,proposalId:uuid,author,start:z.string().datetime({offset:true}),end:z.string().datetime({offset:true})}),
  z.object({action:z.literal("editPlan"),planId:uuid,author,start:z.string().datetime({offset:true}),end:z.string().datetime({offset:true}),expectedUpdated:z.string().datetime({offset:true}).nullable()}),
  z.object({action:z.literal("attend"),planId:uuid,author,attending:z.boolean()}),
  z.object({action:z.literal("profile"),author,transformVersion:z.literal(2).optional(),avatar:z.number().int().min(0).max(AVATAR_NAMES.length-1),hat:z.string().refine(v=>HATS.some(h=>h.id===v)).optional(),eyewear:z.string().refine(v=>EYEWEAR.some(h=>h.id===v)).optional(),accessory:z.string().refine(v=>EXTRAS.some(h=>h.id===v)).optional(),floatie:z.boolean().optional(),animated:z.boolean().optional(),positions:positions.optional(),imageUrl:z.string().trim().max(1000).refine(s=>!s||(()=>{try{return new URL(s).protocol==="https:";}catch{return false;}})(),"Utilise une image avec une URL https://.")}),
]);
export async function POST(request:Request){
  try{
    const origin=request.headers.get("origin");
    if(origin&&origin!==new URL(request.url).origin)return Response.json({error:"Origine non autorisée."},{status:403});
    const raw=await request.text();if(raw.length>12000)return Response.json({error:"Message trop long."},{status:413});
    const p=schema.parse(JSON.parse(raw));const db=database();const now=new Date().toISOString();
    if(p.action==="deleteFeatureIdea"){
      await db.batch([db.prepare("DELETE FROM votes WHERE idea_id=?").bind(p.id),db.prepare("DELETE FROM idea_comments WHERE idea_id=?").bind(p.id),db.prepare("DELETE FROM feature_ideas WHERE id=?").bind(p.id)]);
      return Response.json({ok:true,collection:"featureIdeas",deletedId:p.id});
    }
    if(p.action==="ideaComment"){const target=await db.prepare("SELECT id FROM feature_ideas WHERE id=?").bind(p.ideaId).first();if(!target)throw new Error("Cette idée n’existe plus.");await db.prepare("INSERT OR IGNORE INTO idea_comments(id,idea_id,author,body,created) VALUES(?,?,?,?,?)").bind(p.id,p.ideaId,p.author,p.body,now).run();}
    if("proposalId" in p){
      const target=await db.prepare("SELECT kind FROM proposals WHERE id=?").bind(p.proposalId).first();
      if(!target)throw new Error("Cette proposition n’existe plus.");
      if(p.action==="details"&&target.kind!=="activity")throw new Error("Cette fiche doit être une activité.");
      if(p.action==="activityEmoji"&&target.kind!=="activity")throw new Error("Cette proposition doit être une activité.");
    }
    if(p.action==="featureIdea")await db.prepare("INSERT OR IGNORE INTO feature_ideas (id,author,title,body,created) VALUES (?,?,?,?,?)").bind(p.id,p.author,p.title,p.body,now).run();
    if(p.action==="comment")await db.prepare("INSERT OR IGNORE INTO comments (id,proposal_id,author,body,created) VALUES (?,?,?,?,?)").bind(p.id,p.proposalId,p.author,p.body,now).run();
    if(p.action==="activityEmoji")await db.prepare("UPDATE proposals SET emoji=?,updated_by=?,updated=? WHERE id=?").bind(p.emoji,p.author,now,p.proposalId).run();
    if(p.action==="details")await db.prepare("INSERT INTO activity_details (proposal_id,cost_cents,address,travel,capacity,pricing,notes,updated_by,updated) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(proposal_id) DO UPDATE SET cost_cents=excluded.cost_cents,address=excluded.address,travel=excluded.travel,capacity=excluded.capacity,pricing=excluded.pricing,notes=excluded.notes,updated_by=excluded.updated_by,updated=excluded.updated").bind(p.proposalId,p.costCents,p.address,p.travel,p.capacity,p.pricing,p.notes,p.author,now).run();
    if(p.action==="select"||p.action==="editPlan"){
      if(new Date(p.end)<=new Date(p.start))throw new Error("La fin doit être après le début.");
      if(new Date(p.start)<new Date("2026-09-20T00:00:00+02:00")||new Date(p.end)>new Date("2026-09-28T00:00:00+02:00"))throw new Error("Le créneau doit être compris entre le 20 et le 27 septembre.");
      if(p.action==="select")await db.prepare("INSERT OR IGNORE INTO selected_plans (id,proposal_id,start,end,selected_by,created) VALUES (?,?,?,?,?,?)").bind(p.id,p.proposalId,p.start,p.end,p.author,now).run();
      else{
        const plan=await db.prepare("SELECT id FROM selected_plans WHERE id=?").bind(p.planId).first();if(!plan)throw new Error("Ce rendez-vous n’existe plus.");
        const update=await db.prepare("UPDATE selected_plans SET start=?,end=?,updated_by=?,updated=? WHERE id=? AND updated IS ?").bind(p.start,p.end,p.author,now,p.planId,p.expectedUpdated).run();
        if(!update.meta.changes)throw new Error("Ce rendez-vous vient d’être modifié. Ferme puis rouvre son affiche pour récupérer le dernier créneau.");
      }
    }
    if(p.action==="attend"){
      const plan=await db.prepare("SELECT id FROM selected_plans WHERE id=?").bind(p.planId).first();if(!plan)throw new Error("Ce rendez-vous n’existe plus.");
      const key=p.author.normalize("NFKC").toLocaleLowerCase("fr");
      await db.prepare("INSERT INTO plan_participants (plan_id,author_key,author,attending) VALUES (?,?,?,?) ON CONFLICT(plan_id,author_key) DO UPDATE SET author=excluded.author,attending=excluded.attending").bind(p.planId,key,p.author,p.attending?1:0).run();
    }
    if(p.action==="profile"){
      const key=p.author.normalize("NFKC").toLocaleLowerCase("fr");
      const needed=Math.max(requiredVotes("hat",p.hat||"none"),requiredVotes("accessory",p.accessory||"none"));
      if(needed){const earned=await db.prepare("SELECT peak_votes FROM crew_progress WHERE author_key=?").bind(key).first<{peak_votes:number}>();if((earned?.peak_votes??0)<needed)throw new Error(`Choisis un accessoire débloqué : celui-ci demande ${needed} votes.`);}
      const accessory=p.accessory??null;
      const previous=p.transformVersion!==2?await db.prepare("SELECT accessory,accessory_positions AS positions FROM profiles WHERE author_key=?").bind(key).first<{accessory:string;positions:string}>():null;
      const floatie=accessory!==null?Number(accessory==="floatie"):previous?.accessory?Number(previous.accessory==="floatie"):p.floatie===undefined?null:Number(p.floatie);
      let savedPositions=p.positions;
      // Older open tabs do not know scales or the new accessory selector.
      if(previous&&p.positions){
        const merged=readPositions(previous.positions);
        for(const kind of ACCESSORIES){
          if(kind==="floatie"&&previous.accessory&&previous.accessory!=="floatie")continue;
          if(p.positions[kind])merged[kind]={...merged[kind],...p.positions[kind]!};
        }
        savedPositions=merged;
      }
      await db.prepare("INSERT INTO profiles (author_key,author,avatar,image_url,hat,eyewear,floatie,accessory,animated,accessory_positions) VALUES (?,?,?,?,COALESCE(?,'none'),COALESCE(?,'none'),COALESCE(?,0),COALESCE(?,''),COALESCE(?,1),COALESCE(?,'{}')) ON CONFLICT(author_key) DO UPDATE SET author=excluded.author,avatar=excluded.avatar,image_url=excluded.image_url,hat=COALESCE(?,profiles.hat),eyewear=COALESCE(?,profiles.eyewear),floatie=COALESCE(?,profiles.floatie),accessory=COALESCE(?,profiles.accessory),animated=COALESCE(?,profiles.animated),accessory_positions=COALESCE(?,profiles.accessory_positions)").bind(key,p.author,p.avatar,p.imageUrl,p.hat??null,p.eyewear??null,floatie,accessory,p.animated===undefined?null:Number(p.animated),savedPositions===undefined?null:JSON.stringify(savedPositions),p.hat??null,p.eyewear??null,floatie,accessory,p.animated===undefined?null:Number(p.animated),savedPositions===undefined?null:JSON.stringify(savedPositions)).run();
    }
    // Return the stored row, including on a retried UUID. A failed follow-up
    // refresh must never hide a write that the server has already confirmed.
    let collection="",record:unknown;
    if(p.action==="ideaComment"){collection="ideaComments";record=await db.prepare("SELECT id,idea_id AS ideaId,author,body,created FROM idea_comments WHERE id=?").bind(p.id).first();}
    if(p.action==="featureIdea"){collection="featureIdeas";record=await db.prepare("SELECT id,author,title,body,created FROM feature_ideas WHERE id=?").bind(p.id).first();}
    if(p.action==="activityEmoji"){collection="proposals";const row=await db.prepare("SELECT *,updated_by AS updatedBy FROM proposals WHERE id=?").bind(p.proposalId).first();record={...row,movie:null};}
    if(p.action==="comment"){collection="comments";record=await db.prepare("SELECT id,proposal_id AS proposalId,author,body,created FROM comments WHERE id=?").bind(p.id).first();}
    if(p.action==="details"){collection="activityDetails";record=await db.prepare("SELECT proposal_id AS proposalId,cost_cents AS costCents,address,travel,capacity,pricing,notes,updated_by AS updatedBy,updated FROM activity_details WHERE proposal_id=?").bind(p.proposalId).first();}
    if(p.action==="select"||p.action==="editPlan"){collection="plans";record=await db.prepare("SELECT id,proposal_id AS proposalId,start,end,selected_by AS selectedBy,created,updated_by AS updatedBy,updated FROM selected_plans WHERE id=?").bind(p.action==="select"?p.id:p.planId).first();}
    if(p.action==="attend"){collection="participants";record=await db.prepare("SELECT plan_id AS planId,author_key AS authorKey,author,attending FROM plan_participants WHERE plan_id=? AND author_key=?").bind(p.planId,p.author.normalize("NFKC").toLocaleLowerCase("fr")).first();}
    if(p.action==="profile"){collection="profiles";record=await db.prepare("SELECT author_key AS authorKey,author,avatar,image_url AS imageUrl,hat,eyewear,floatie,accessory,animated,accessory_positions AS positions FROM profiles WHERE author_key=?").bind(p.author.normalize("NFKC").toLocaleLowerCase("fr")).first();}
    if(!record)return Response.json({error:"Cette donnée vient d’être supprimée. Actualise la liste."},{status:409});
    return Response.json({ok:true,collection,record,...("id" in p?{id:p.id}:{})},{status:201});
  }catch(error){
    if(error instanceof z.ZodError)return Response.json({error:error.issues[0]?.message||"Vérifie les informations."},{status:400});
    if(error instanceof SyntaxError)return Response.json({error:"Données invalides."},{status:400});
    const message=error instanceof Error?error.message:"";const known=/^(Cette|Ces|Ce rendez|Choisis|La fin|Le créneau)/.test(message);
    if(!known)console.error("social:write",error);
    return Response.json({error:known?message:"L’enregistrement a échoué. Réessaie, ton texte est conservé."},{status:known?400:503});
  }
}
