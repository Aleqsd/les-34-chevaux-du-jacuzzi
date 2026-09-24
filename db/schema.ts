import { sqliteTable, text, integer, index, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";
export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(), kind: text("kind").notNull(), title: text("title").notNull(),
  author: text("author").notNull(), url: text("url").notNull().default(""),
  movie: text("movie"), start: text("start"), end: text("end"), created: text("created").notNull(), emoji:text("emoji"), updatedBy:text("updated_by"), updated:text("updated"),
});
export const slots = sqliteTable("slots", {
  id: text("id").primaryKey(), proposalId: text("proposal_id").notNull().references(() => proposals.id),
  author: text("author").notNull(), start: text("start").notNull(), end: text("end").notNull(), created: text("created").notNull(),
}, t => [index("idx_slots_proposal").on(t.proposalId)]);
export const votes = sqliteTable("votes", {
  id: text("id").primaryKey(), proposalId: text("proposal_id").references(() => proposals.id),
  slotId: text("slot_id").references(() => slots.id), author: text("author").notNull(),
  value: integer("value").notNull(), created: text("created").notNull(),
  authorKey:text("author_key").notNull().default(""), ideaId:text("idea_id").references(()=>featureIdeas.id),
}, t => [index("idx_votes_proposal").on(t.proposalId), index("idx_votes_slot").on(t.slotId),uniqueIndex("unique_vote_proposal_author").on(t.proposalId,t.authorKey),uniqueIndex("unique_vote_slot_author").on(t.slotId,t.authorKey),uniqueIndex("unique_vote_idea_author").on(t.ideaId,t.authorKey)]);
export const activityDetails = sqliteTable("activity_details", {
  proposalId:text("proposal_id").primaryKey().references(()=>proposals.id), costCents:integer("cost_cents"),
  address:text("address").notNull().default(""), travel:text("travel").notNull().default(""), capacity:integer("capacity"),
  pricing:text("pricing").notNull().default(""), notes:text("notes").notNull().default(""), updatedBy:text("updated_by").notNull(), updated:text("updated").notNull(),
});
export const comments = sqliteTable("comments", {
  id:text("id").primaryKey(), proposalId:text("proposal_id").notNull().references(()=>proposals.id), author:text("author").notNull(), body:text("body").notNull(), created:text("created").notNull(),
}, t=>[index("idx_comments_proposal").on(t.proposalId,t.created)]);
// Retired feature: keep the historical table for migration compatibility only.
export const duelVotes = sqliteTable("duel_votes", {
  id:text("id").primaryKey(), firstId:text("first_id").notNull().references(()=>proposals.id), secondId:text("second_id").notNull().references(()=>proposals.id), chosenId:text("chosen_id").notNull().references(()=>proposals.id), author:text("author").notNull(), created:text("created").notNull(),
},t=>[index("idx_duel_pair").on(t.firstId,t.secondId)]);
export const selectedPlans = sqliteTable("selected_plans", {
  id:text("id").primaryKey(), proposalId:text("proposal_id").notNull().references(()=>proposals.id), start:text("start").notNull(), end:text("end").notNull(), selectedBy:text("selected_by").notNull(), created:text("created").notNull(), updatedBy:text("updated_by"), updated:text("updated"),
});
export const planParticipants = sqliteTable("plan_participants", {
  planId:text("plan_id").notNull().references(()=>selectedPlans.id), authorKey:text("author_key").notNull(), author:text("author").notNull(), attending:integer("attending").notNull(),
},t=>[primaryKey({columns:[t.planId,t.authorKey]})]);
export const profiles=sqliteTable("profiles",{authorKey:text("author_key").primaryKey(),author:text("author").notNull(),avatar:integer("avatar").notNull(),imageUrl:text("image_url").notNull().default(""),hat:text("hat").notNull().default("none"),eyewear:text("eyewear").notNull().default("none"),floatie:integer("floatie").notNull().default(0),accessory:text("accessory").notNull().default(""),animated:integer("animated").notNull().default(1),positions:text("accessory_positions").notNull().default("{}")});

export const featureIdeas=sqliteTable("feature_ideas",{id:text("id").primaryKey(),author:text("author").notNull(),title:text("title").notNull(),body:text("body").notNull().default(""),created:text("created").notNull()});
export const ideaComments=sqliteTable("idea_comments",{id:text("id").primaryKey(),ideaId:text("idea_id").notNull().references(()=>featureIdeas.id),author:text("author").notNull(),body:text("body").notNull(),created:text("created").notNull()},t=>[index("idx_idea_comments").on(t.ideaId,t.created)]);
export const crewProgress=sqliteTable("crew_progress",{authorKey:text("author_key").primaryKey(),author:text("author").notNull(),peakVotes:integer("peak_votes").notNull().default(0)});
export const presence=sqliteTable("presence",{sessionId:text("session_id").primaryKey(),authorKey:text("author_key").notNull(),author:text("author").notNull(),room:text("room").notNull(),action:text("action").notNull(),revision:integer("revision").notNull(),changed:integer("changed").notNull(),lastSeen:integer("last_seen").notNull()},t=>[index("idx_presence_seen").on(t.lastSeen)]);
