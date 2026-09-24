import { database } from "@/lib/database";
import { z } from "zod";
import type { Proposal } from "@/lib/club";
const name = z.string().trim().min(1, "Choisis ton prénom.").max(40);
const safeUrl = z.string().trim().max(1000).refine(s => !s || /^https?:\/\//i.test(s) && (() => { try { return !!new URL(s).hostname; } catch { return false; } })(), "Utilise une URL en https:// ou http://.");
const movieSchema = z.object({ id: z.string().max(90), title: z.string().min(1).max(200), year: z.string().max(4), genre: z.string().max(100), runtime: z.number().min(0).max(2000).nullable(), director: z.string().max(150), poster: safeUrl, backdrop: safeUrl, sourceUrl: safeUrl, source: z.string().max(30) });
const range = { start: z.string().datetime({ offset: true }), end: z.string().datetime({ offset: true }) };
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("propose"), kind: z.enum(["movie", "activity"]), title: z.string().trim().min(1).max(200), author: name, url: safeUrl.default(""), movie: movieSchema.nullable().optional(), start: range.start.optional(), end: range.end.optional() }),
  z.object({ action: z.literal("vote"), id: z.string().uuid(), proposalId: z.string().uuid().optional(), slotId: z.string().uuid().optional(), author: name, value: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({ action: z.literal("slot"), proposalId: z.string().uuid(), author: name, ...range }),
]);
export async function GET() {
  try {
    const db = database();
    const result = await db.batch([
      db.prepare("SELECT * FROM proposals ORDER BY created DESC"),
      db.prepare("SELECT id, proposal_id as proposalId, slot_id as slotId, author, value FROM votes ORDER BY created"),
      db.prepare("SELECT id, proposal_id as proposalId, author, start, end FROM slots ORDER BY created"),
      db.prepare("SELECT proposal_id AS proposalId,cost_cents AS costCents,address,travel,capacity,pricing,notes,updated_by AS updatedBy,updated FROM activity_details"),
      db.prepare("SELECT id,proposal_id AS proposalId,author,body,created FROM comments ORDER BY created,id"),
      db.prepare("SELECT id,first_id AS firstId,second_id AS secondId,chosen_id AS chosenId,author,created FROM duel_votes ORDER BY created,id"),
      db.prepare("SELECT id,proposal_id AS proposalId,start,end,selected_by AS selectedBy,created FROM selected_plans ORDER BY start"),
      db.prepare("SELECT plan_id AS planId,author_key AS authorKey,author,attending FROM plan_participants ORDER BY author_key"),
      db.prepare("SELECT author_key AS authorKey,author,avatar,image_url AS imageUrl FROM profiles"),
    ]);
    return Response.json({ proposals: (result[0].results as Record<string,unknown>[]).map(p => ({ ...p, movie: p.movie ? JSON.parse(p.movie as string) : null })), votes: result[1].results, slots: result[2].results, activityDetails:result[3].results, comments:result[4].results, duelVotes:result[5].results, plans:result[6].results, participants:result[7].results, profiles:result[8].results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("club:read", error); return Response.json({ error: "Impossible de charger le QG. Réessaie dans un instant." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 12000) return Response.json({ error: "Proposition trop longue." }, { status: 413 });
    const p = schema.parse(JSON.parse(raw));
    const db = database(); const now = new Date().toISOString(); const id = crypto.randomUUID();
    let proposal: Proposal | undefined;
    if (p.action === "propose") {
      if (p.kind === "activity" && (!p.start || !p.end || !p.url)) throw new Error("Ajoute un lien et un créneau à ton activité.");
      if (p.start && p.end) validateRange(p.start, p.end);
      await db.prepare("INSERT INTO proposals (id,kind,title,author,url,movie,start,end,created) VALUES (?,?,?,?,?,?,?,?,?)").bind(id,p.kind,p.title,p.author,p.url,p.movie ? JSON.stringify(p.movie) : null,p.start ?? null,p.end ?? null,now).run();
      proposal={id,kind:p.kind,title:p.title,author:p.author,url:p.url,movie:p.movie??null,start:p.start??null,end:p.end??null,created:now};
    } else if (p.action === "slot") {
      validateRange(p.start,p.end);
      const target = await db.prepare("SELECT kind FROM proposals WHERE id=?").bind(p.proposalId).first();
      if (target?.kind !== "activity") throw new Error("Cette activité n’existe plus.");
      await db.prepare("INSERT INTO slots (id,proposal_id,author,start,end,created) VALUES (?,?,?,?,?,?)").bind(id,p.proposalId,p.author,p.start,p.end,now).run();
    } else {
      if (!!p.proposalId === !!p.slotId) throw new Error("Choisis un film, une activité ou un créneau.");
      const target = p.proposalId ? await db.prepare("SELECT id FROM proposals WHERE id=?").bind(p.proposalId).first() : await db.prepare("SELECT id FROM slots WHERE id=?").bind(p.slotId!).first();
      if (!target) throw new Error("Cette proposition n’existe plus.");
      await db.prepare("INSERT OR IGNORE INTO votes (id,proposal_id,slot_id,author,value,created) VALUES (?,?,?,?,?,?)").bind(p.id,p.proposalId ?? null,p.slotId ?? null,p.author,p.value,now).run();
    }
    return Response.json({ ok: true, id, ...(proposal ? {proposal} : {}) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message ?? "Vérifie les informations saisies." }, { status: 400 });
    if (error instanceof SyntaxError) return Response.json({ error: "Données invalides." }, { status: 400 });
    console.error("club:write", error);
    const message = error instanceof Error ? error.message : "";
    const known = /^(Ajoute|Choisis|Cette|La fin|Le créneau)/.test(message);
    return Response.json({ error: known ? message : "L’enregistrement a échoué. Ton formulaire est conservé, réessaie." }, { status: known ? 400 : 503 });
  }
}
function validateRange(start: string, end: string) {
  if (new Date(end) <= new Date(start)) throw new Error("La fin doit être après le début.");
  if (new Date(start) < new Date("2026-09-20T00:00:00+02:00") || new Date(end) > new Date("2026-09-28T00:00:00+02:00")) throw new Error("Le créneau doit être compris entre le 20 et le 27 septembre.");
}
