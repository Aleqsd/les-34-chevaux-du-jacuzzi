export const CREW = ["Alex", "Bimbo", "Penelop", "Telroshan", "TyNiTOoN", "Faufau", "FonograF", "Le Lucas", "Locky", "Solinca", "Tristan"];
export const TRIP_START = "2026-09-20";
export const TRIP_END = "2026-09-27";
export type Movie = { id: string; title: string; year: string; genre: string; runtime: number | null; director: string; poster: string; backdrop: string; sourceUrl: string; source: string };
export type Vote = { ideaId?:string|null; id: string; author: string; value: number; proposalId: string | null; slotId: string | null; authorKey?:string; created?:string };
export type Slot = { id: string; proposalId: string; author: string; start: string; end: string };
export type Proposal = { id: string; kind: "movie" | "activity"; title: string; author: string; url: string; movie: Movie | null; start: string | null; end: string | null; created: string; emoji?:string|null; updatedBy?:string|null; updated?:string|null };
export type ActivityDetails = { proposalId:string; costCents:number|null; address:string; travel:string; capacity:number|null; pricing:string; notes:string; updatedBy:string; updated:string };
export type Comment = { id:string; proposalId:string; author:string; body:string; created:string };
export type SelectedPlan = { id:string; proposalId:string; start:string; end:string; selectedBy:string; created:string; updatedBy?:string|null; updated?:string|null };
export type Participant = { planId:string; authorKey:string; author:string; attending:number };
export type Profile = { authorKey:string; author:string; avatar:number; imageUrl:string; hat?:string; eyewear?:string; floatie?:number; accessory?:string; animated?:number; positions?:string };
export type FeatureIdea={id:string;author:string;title:string;body:string;created:string};
export type CrewProgress={authorKey:string;author:string;peakVotes:number};
export type IdeaComment={id:string;ideaId:string;author:string;body:string;created:string};
export type ClubState = { progress:CrewProgress[]; ideaComments:IdeaComment[]; proposals: Proposal[]; votes: Vote[]; slots: Slot[]; activityDetails:ActivityDetails[]; comments:Comment[]; plans:SelectedPlan[]; participants:Participant[]; profiles:Profile[]; featureIdeas:FeatureIdea[] };
export const EMPTY_STATE: ClubState = { progress:[],ideaComments:[], proposals: [], votes: [], slots: [], activityDetails:[], comments:[], plans:[], participants:[], profiles:[], featureIdeas:[] };
export function score(votes: Vote[], id: string, slot:boolean|"idea" = false) {
  const list = votes.filter(v => slot==="idea"?v.ideaId===id:slot ? v.slotId === id : v.proposalId === id);
  return { yes: list.filter(v => v.value === 1).length, no: list.filter(v => v.value === -1).length, neutral:list.filter(v=>v.value===0).length, list };
}
export function dateLabel(value: string, options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "short" }) { return new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "Europe/Paris" }).format(new Date(value.length === 10 ? value + "T12:00:00+02:00" : value)); }
export function timeLabel(value: string) { return dateLabel(value, { hour: "2-digit", minute: "2-digit" }); }
export const tripDays = Array.from({ length: 8 }, (_, i) => `2026-09-${20 + i}`);
