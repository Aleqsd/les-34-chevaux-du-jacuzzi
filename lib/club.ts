export const CREW = ["Alex", "Bimbo", "Penelop", "Telroshan", "TyNiTOoN", "Faufau", "FonograF", "Le Lucas", "Locky", "Solinca", "Tristan"];
export const TRIP_START = "2026-09-20";
export const TRIP_END = "2026-09-27";
export type Movie = { id: string; title: string; year: string; genre: string; runtime: number | null; director: string; poster: string; backdrop: string; sourceUrl: string; source: string };
export type Vote = { id: string; author: string; value: number; proposalId: string | null; slotId: string | null };
export type Slot = { id: string; proposalId: string; author: string; start: string; end: string };
export type Proposal = { id: string; kind: "movie" | "activity"; title: string; author: string; url: string; movie: Movie | null; start: string | null; end: string | null; created: string };
export type ActivityDetails = { proposalId:string; costCents:number|null; address:string; travel:string; capacity:number|null; pricing:string; notes:string; updatedBy:string; updated:string };
export type Comment = { id:string; proposalId:string; author:string; body:string; created:string };
export type DuelVote = { id:string; firstId:string; secondId:string; chosenId:string; author:string; created:string };
export type SelectedPlan = { id:string; proposalId:string; start:string; end:string; selectedBy:string; created:string };
export type Participant = { planId:string; authorKey:string; author:string; attending:number };
export type Profile = { authorKey:string; author:string; avatar:number; imageUrl:string };
export type ClubState = { proposals: Proposal[]; votes: Vote[]; slots: Slot[]; activityDetails:ActivityDetails[]; comments:Comment[]; duelVotes:DuelVote[]; plans:SelectedPlan[]; participants:Participant[]; profiles:Profile[] };
export const EMPTY_STATE: ClubState = { proposals: [], votes: [], slots: [], activityDetails:[], comments:[], duelVotes:[], plans:[], participants:[], profiles:[] };
export function score(votes: Vote[], id: string, slot = false) {
  const list = votes.filter(v => slot ? v.slotId === id : v.proposalId === id);
  return { yes: list.filter(v => v.value === 1).length, no: list.filter(v => v.value === -1).length, list };
}
export function dateLabel(value: string, options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "short" }) { return new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "Europe/Paris" }).format(new Date(value.length === 10 ? value + "T12:00:00+02:00" : value)); }
export function timeLabel(value: string) { return dateLabel(value, { hour: "2-digit", minute: "2-digit" }); }
export const tripDays = Array.from({ length: 8 }, (_, i) => `2026-09-${20 + i}`);
