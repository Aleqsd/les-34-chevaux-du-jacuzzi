import type { Proposal } from "@/lib/club";
export function parisDay(iso:string){return new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Paris"}).format(new Date(iso));}
export function moveToDay(proposal:Proposal,day:string){
  if(!proposal.start||!proposal.end)throw Error("Cette activité n’a pas de créneau.");
  const delta=Date.parse(day+"T12:00:00Z")-Date.parse(parisDay(proposal.start)+"T12:00:00Z");
  return {start:new Date(Date.parse(proposal.start)+delta).toISOString(),end:new Date(Date.parse(proposal.end)+delta).toISOString()};
}
