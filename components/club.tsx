"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clapperboard, Clock3, ExternalLink, Film, Heart, LoaderCircle, Plus, Search, ShieldCheck, Sparkles, Sun, Trophy, ThumbsDown, ThumbsUp, Users, Waves, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Combobox, ComboboxInput, ComboboxList, ComboboxItem } from "@/components/ui/combobox";
import { Toaster } from "@/components/ui/sonner";
import { ActivityEmojiBadge, ActivityEmojiPicker, ActivityEmojiEditor } from "@/components/activity-emoji";
import { VillaScene } from "@/components/villa-scene";
import { CinemaLounge } from "@/components/cinema-lounge";
import { DeleteMovie } from "@/components/delete-movie";
import { NextActivity } from "@/components/next-activity";
import { CrewLeaderboard } from "@/components/crew-leaderboard";
import { UnlockCelebration } from "@/components/unlock-celebration";
import { useCrewPresence } from "@/components/use-crew-presence";
import { RewardsPage } from "@/components/rewards-page";
import { useUnlocks } from "@/components/use-unlocks";
import type { CrewProgress } from "@/lib/club";
import { FeatureIdeas } from "@/components/feature-ideas";
import { WeeklyPlanner } from "@/components/weekly-planner";
import { reactAvatar } from "@/lib/appearance";
import { CrewCards, Discussion, ActivityPractical } from "@/components/crew-social";
import { SelectPlan, SelectedPlans, PlanReveal } from "@/components/plan-reveal";
import { AvatarContext, CrewAvatar, AvatarEditor } from "@/components/crew-avatar";
import { ClubEffects, celebrate } from "@/components/club-effects";
import { Flag, KeyRound, Lightbulb, Minus } from "lucide-react";
import { toast } from "sonner";
import { CREW, EMPTY_STATE, dateLabel, score, timeLabel, tripDays, type ClubState, type Movie, type Proposal, type SelectedPlan, type Vote } from "@/lib/club";

import { voterKey } from "@/lib/identity";

const COLORS = ["#dfff00", "#8ca9ff", "#ffb4d6", "#7edfc8", "#ffa270", "#cfb3ff", "#ffe6a1", "#9dd1ff", "#f7b4a4", "#96d6ae", "#c3cbff"];
const ACTIVITY_IDEAS = [
  { name:"Escape Game", title:"Escape Game — Le SAS, Béziers", url:"https://le-sas.com/", venue:"Le SAS · Béziers", theme:"escape", kicker:"LES CERVEAUX EN ÉQUIPE", description:"Des énigmes, une salle à thème et les théories très discutables du crew.", Icon:KeyRound },
  { name:"Karting", title:"Karting — Sun Karting, Sérignan", url:"https://sunkarting.fr/", venue:"Sun Karting · Sérignan", theme:"karting", kicker:"LES CHEVAUX SUR LA PISTE", description:"Un circuit, les copains et de quoi refaire la course toute la soirée.", Icon:Flag },
];
const cache = new Map<string, Movie[]>();
function initial(name: string) { return name.replace(/^Le /, "").slice(0,2).toUpperCase(); }
function memberColor(name: string) { const i = CREW.indexOf(name); return COLORS[i < 0 ? 0 : i]; }
function duration(n: number | null) { return n ? `${Math.floor(n/60)}h${String(n%60).padStart(2,"0")}` : "Durée non renseignée"; }
function localDay(iso: string) { return new Intl.DateTimeFormat("sv-SE", { timeZone:"Europe/Paris" }).format(new Date(iso)); }
function tilt(e: PointerEvent<HTMLElement>) { if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return; const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--rx", `${-(e.clientY-r.top-r.height/2)/r.height*7}deg`); e.currentTarget.style.setProperty("--ry", `${(e.clientX-r.left-r.width/2)/r.width*9}deg`);e.currentTarget.style.setProperty("--shine-x",`${(e.clientX-r.left)/r.width*100}%`);e.currentTarget.style.setProperty("--shine-y",`${(e.clientY-r.top)/r.height*100}%`); }
function sceneMove(e:PointerEvent<HTMLElement>){if(e.pointerType!=="mouse"||matchMedia("(prefers-reduced-motion: reduce)").matches)return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty("--scene-x",`${(e.clientX-r.left-r.width/2)/r.width*20}px`);e.currentTarget.style.setProperty("--scene-y",`${(e.clientY-r.top-r.height/2)/r.height*14}px`);}
function sceneReset(e:PointerEvent<HTMLElement>){e.currentTarget.style.setProperty("--scene-x","0px");e.currentTarget.style.setProperty("--scene-y","0px");}
function untilt(e: PointerEvent<HTMLElement>) { e.currentTarget.style.setProperty("--rx","0deg"); e.currentTarget.style.setProperty("--ry","0deg"); }
async function api<T>(url: string, options?: RequestInit): Promise<T> {
  let r:Response;
  try{r=await fetch(url,options);}catch(error){if((error as Error).name==="AbortError")throw error;throw new Error("Connexion interrompue. Vérifie ta connexion puis réessaie.");}
  let data:T & {error?:string};
  try{data=await r.json();}catch{throw new Error("Le serveur ne répond pas correctement. Réessaie dans un instant.");}
  if(!r.ok)throw new Error(data.error||"La connexion fait une pause. Réessaie.");return data;
}
const blankMovie = (title: string): Movie => ({ id:`manual-${crypto.randomUUID()}`,title,year:"",genre:"",director:"",runtime:null,poster:"",backdrop:"",sourceUrl:"",source:"Manuel" });

export default function Club() {
  const [view, setView] = useState("lobby");
  const [transition,setTransition]=useState("");
  const transitionTimers=useRef<ReturnType<typeof setTimeout>[]>([]);
  const [selectPlan,setSelectPlan]=useState<Proposal|null>(null);
  const [editingPlan,setEditingPlan]=useState<SelectedPlan|null>(null);
  const [revealId,setRevealId]=useState<string|null>(null);
  const [avatarOpen,setAvatarOpen]=useState(false);
  const goTo=(next:string)=>{if(next===view||transition)return;if(matchMedia("(prefers-reduced-motion: reduce)").matches){setView(next);return;}window.dispatchEvent(new Event("jacuzzi-dive"));setTransition(next);transitionTimers.current.push(setTimeout(()=>{setView(next);window.scrollTo({top:0,behavior:"instant"});},400),setTimeout(()=>setTransition(""),950));};
  useEffect(()=>{const id=new URLSearchParams(location.search).get("plan");if(id&&/^[0-9a-f-]{36}$/i.test(id))setRevealId(id);return()=>transitionTimers.current.forEach(clearTimeout);},[]);
  const [state,setState] = useState<ClubState>(EMPTY_STATE);
  const [loaded,setLoaded] = useState(false);
  const [loadError,setLoadError] = useState("");
  const [catalog,setCatalog] = useState<Movie[]>([]);
  const [catalogError,setCatalogError] = useState("");
  const [person,setPerson] = useState("");
  const presence=useCrewPresence(person,view);
  const peak=state.progress.find(p=>p.authorKey===voterKey(person))?.peakVotes??0;
  const unlocks=useUnlocks(person,peak,loaded);
  const [identityOpen,setIdentityOpen] = useState(false);
  const [nameDraft,setNameDraft] = useState("");
  const [searchOpen,setSearchOpen] = useState(false);
  const [query,setQuery] = useState("");
  const [results,setResults] = useState<Movie[]>([]);
  const [searching,setSearching] = useState(false);
  const [searchError,setSearchError] = useState("");
  const [detail,setDetail] = useState<Movie|null>(null);
  const [detailProposalId,setDetailProposalId] = useState<string|null>(null);
  const [detailLoading,setDetailLoading] = useState(false);
  const [detailError,setDetailError] = useState("");
  const [movieFeedback,setMovieFeedback] = useState<{kind:"loading"|"success"|"error";message:string;title:string}|null>(null);
  const [activityOpen,setActivityOpen] = useState(false);
  const [activityDetail,setActivityDetail] = useState<string|null>(null);
  const [slotFor,setSlotFor] = useState<Proposal|null>(null);
  const [editingActivity,setEditingActivity]=useState<Proposal|null>(null);
  const activitySaving=useRef(false);
  const [title,setTitle] = useState("");
  const [activityEmojiChoice,setActivityEmojiChoice]=useState<string|null>(null);
  const [url,setUrl] = useState("");
  const [day,setDay] = useState("2026-09-24");
  const [start,setStart] = useState("14:00");
  const [end,setEnd] = useState("16:00");
  const [formError,setFormError] = useState("");
  const [saving,setSaving] = useState(false);
  const [pendingVotes,setPendingVotes] = useState<string[]>([]);
  const voteInFlight=useRef(new Set<string>());
  const [filter,setFilter] = useState("all");
  const pendingAction = useRef<null | ((name: string)=>void)>(null);
  const detailRequest = useRef(0);
  const refreshRequest = useRef(0);
  const movieSaving = useRef(false);
  const movieConfirmation = useRef<HTMLDivElement>(null);
  useEffect(()=>{if(movieFeedback?.kind==="success"){movieConfirmation.current?.focus({preventScroll:true});movieConfirmation.current?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"center"});}},[movieFeedback]);
  const load = useCallback(async () => {
    const request = ++refreshRequest.current;
    try { const data = await api<ClubState>("/api/club"); if (request !== refreshRequest.current) return; setState(current=>({...EMPTY_STATE,...data,progress:(data.progress??[]).map(p=>({...p,peakVotes:Math.max(p.peakVotes,current.progress.find(old=>old.authorKey===p.authorKey)?.peakVotes??0)}))})); setLoadError(""); }
    catch(e) { if (request === refreshRequest.current) setLoadError((e as Error).message); }
    finally { if (request === refreshRequest.current) setLoaded(true); }
  },[]);
  const loadCatalog = useCallback(async () => { setCatalogError(""); try { const r = await api<{movies:Movie[]}>("/api/movies"); setCatalog(r.movies); } catch(e) { setCatalogError((e as Error).message); } },[]);
  useEffect(()=>{ try { const saved = localStorage.getItem("jacuzzi-prenom"); if(saved) {setPerson(saved);setNameDraft(saved);} } catch {} void load(); void loadCatalog();
    const timer=setInterval(()=>{if(!document.hidden)void load();},15000);
    const wake=()=>{if(!document.hidden)void load();}; document.addEventListener("visibilitychange",wake); return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",wake);};
  },[load,loadCatalog]);
  useEffect(()=>{
    if (!searchOpen) return;
    const q=query.trim(); setSearchError("");
    if(q.length<2){setResults(catalog);setSearching(false);return;}
    const key=q.toLocaleLowerCase("fr"); const cached=cache.get(key);
    if(cached){setResults(cached);setSearching(false);return;}
    setResults(catalog.filter(m=>m.title.toLocaleLowerCase("fr").includes(key)));setSearching(true);
    const controller=new AbortController();
    const timer=setTimeout(async()=>{try { const r=await api<{movies:Movie[]}>(`/api/movies?q=${encodeURIComponent(q)}`,{signal:controller.signal});cache.set(key,r.movies);if(!controller.signal.aborted)setResults(r.movies); }catch(e){if(!controller.signal.aborted)setSearchError((e as Error).message);}finally{if(!controller.signal.aborted)setSearching(false);}},180);
    return()=>{clearTimeout(timer);controller.abort();};
  },[query,searchOpen,catalog]);
  useEffect(()=>{
    const context=(document as unknown as {modelContext?:{registerTool:(tool:unknown,options:unknown)=>unknown}}).modelContext;
    if(!context?.registerTool)return; const lifecycle=new AbortController();
    const register=(tool:unknown)=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
    register({name:"read_crew_plans",description:"Lire les films proposés, activités, créneaux et votes du crew.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>api("/api/club")});
    register({name:"start_movie_proposal",description:"Ouvrir la recherche de films avec un titre. Cette action ne publie aucune proposition.",inputSchema:{type:"object",properties:{query:{type:"string",maxLength:150}},required:["query"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{const q=(input as {query?:unknown})?.query;if(typeof q!=="string"||q.length>150)throw new Error("Titre invalide");setView("cinema");setQuery(q);setSearchOpen(true);return{opened:true,query:q};}});
    return()=>lifecycle.abort();
  },[]);
  const identify = (action:(name:string)=>void) => {if(person){action(person);return;}pendingAction.current=action;setIdentityOpen(true);};
  const chooseName = (name:string) => {name=name.trim();if(!name)return;setPerson(name);setNameDraft(name);try{localStorage.setItem("jacuzzi-prenom",name);}catch{}setIdentityOpen(false);toast.success(`Bienvenue au QG, ${name} !`);reactAvatar(name);const action=pendingAction.current;pendingAction.current=null;if(action)setTimeout(()=>action(name),150);};
  const saveSocial=async(body:Record<string,unknown>)=>{const result=await api<{collection:keyof ClubState;record:Record<string,unknown>;deletedId?:string}>("/api/social",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});++refreshRequest.current;if(result.deletedId){setState(current=>({...current,featureIdeas:current.featureIdeas.filter(idea=>idea.id!==result.deletedId),ideaComments:current.ideaComments.filter(c=>c.ideaId!==result.deletedId),votes:current.votes.filter(v=>v.ideaId!==result.deletedId)}));void load();return result;}if(!result.record){void load();throw new Error("Cette donnée vient d’être supprimée.");}setState(current=>{const list=current[result.collection] as unknown as Record<string,unknown>[];const identity=(row:Record<string,unknown>)=>row.id??(row.planId?String(row.planId)+":"+row.authorKey:row.authorKey??row.proposalId);return {...current,[result.collection]:[...list.filter(row=>identity(row)!==identity(result.record)),result.record]};});void load();return result;};
  const social={state,person,identify,save:saveSocial};
  const retain=(p:Proposal)=>{setEditingPlan(null);setDetail(null);setActivityDetail(null);setSelectPlan(p);};
  const mutate = async (body:unknown) => {const result=await api<{ok:boolean;id:string;proposal?:Proposal}>("/api/club",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});await load();return result;};
  const vote = (id:string,value:number,slot:boolean|"idea"=false) => identify(async author=>{
    if(voteInFlight.current.has(id))return;
    const sameTarget=(v:Vote)=>(slot==="idea"?v.ideaId:slot?v.slotId:v.proposalId)===id;
    const previous=state.votes.find(v=>sameTarget(v)&&voterKey(v.author)===voterKey(author));
    voteInFlight.current.add(id);setPendingVotes(v=>[...v,id]);
    try{
      const result=await api<{vote:Vote;progress:CrewProgress}>("/api/club",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"vote",id:crypto.randomUUID(),[slot==="idea"?"ideaId":slot?"slotId":"proposalId"]:id,author,value})});
      ++refreshRequest.current;
      setState(current=>({...current,votes:[...current.votes.filter(v=>!(sameTarget(v)&&voterKey(v.author)===voterKey(author))),result.vote],progress:[...current.progress.filter(p=>p.authorKey!==result.progress.authorKey),{...result.progress,peakVotes:Math.max(result.progress.peakVotes,current.progress.find(p=>p.authorKey===result.progress.authorKey)?.peakVotes??0)}]}));
      void load();if(value!==0)celebrate(value===1?"yes":"no");reactAvatar(author,value===1?"yes":value===0?"hello":"no");toast.success(previous?.value===value?"Ton vote est confirmé.":previous?"Changement d’avis enregistré !":value===1?author+" est chaud ! Vote enregistré.":value===0?"C’est noté, "+author+". Vote neutre enregistré.":"C’est noté, "+author+". Vote contre enregistré.");
    }catch(e){void load();toast.error((e as Error).message);}finally{voteInFlight.current.delete(id);setPendingVotes(v=>v.filter(x=>x!==id));}
  });
  const moveActivity=async(p:Proposal,times:{start:string;end:string})=>{
    if(!person)throw Error("Choisis ton prénom avant de déplacer une activité.");
    try{
      const result=await api<{proposal:Proposal}>("/api/club",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"moveActivity",proposalId:p.id,author:person,expectedUpdated:p.updated??null,...times})});
      ++refreshRequest.current;setState(current=>({...current,proposals:current.proposals.map(row=>row.id===p.id?result.proposal:row)}));void load();
      toast.success("Activité déplacée au "+dateLabel(result.proposal.start!)+" !");reactAvatar(person,"yes");
    }catch(error){void load();throw error;}
  };
  const openMovie = async (movie:Movie,proposalId?:string) => {setSearchOpen(false);setDetail(movie);setDetailProposalId(proposalId||null);setDetailError("");setMovieFeedback(null);const request=++detailRequest.current;if(movie.runtime||movie.source==="Manuel"){setDetailLoading(false);return;}setDetailLoading(true);try{const r=await api<{movie:Movie}>(`/api/movies?id=${movie.id}`);if(request===detailRequest.current)setDetail(r.movie);}catch(e){if(request===detailRequest.current)setDetailError((e as Error).message);}finally{if(request===detailRequest.current)setDetailLoading(false);}};
  const proposeMovie = (movie:Movie) => identify(async author=>{
    if(movieSaving.current)return;movieSaving.current=true;setSaving(true);setMovieFeedback({kind:"loading",title:movie.title,message:"Ajout du film en cours…"});
    try{
      const result=await mutate({action:"propose",kind:"movie",title:movie.title,author,movie});
      // Keep the confirmed write visible even if the subsequent refresh is unavailable.
      if(result.proposal)setState(current=>current.proposals.some(p=>p.id===result.proposal!.id)?current:{...current,proposals:[result.proposal!,...current.proposals]});
      setDetail(null);setSearchOpen(false);setFilter("all");setView("cinema");setMovieFeedback({kind:"success",title:movie.title,message:`Ajouté par ${author}. Le crew peut voter !`});celebrate();toast.success(`${movie.title} rejoint la sélection !`);
    }catch(e){const message=(e as Error).message;setDetail(movie);setDetailProposalId(null);setDetailLoading(false);setMovieFeedback({kind:"error",title:movie.title,message});toast.error(message);}
    finally{movieSaving.current=false;setSaving(false);}
  });
  const openActivity = (date?:string,idea?:{title:string;url:string}) => {setEditingActivity(null);setActivityEmojiChoice(null);setSlotFor(null);setTitle(idea?.title||"");setUrl(idea?.url||"");setFormError("");setDay(date || (idea ? "" : "2026-09-24"));setStart(idea ? "" : "14:00");setEnd(idea ? "" : "16:00");setActivityOpen(true);};
  const openSlot = (p:Proposal) => {setEditingActivity(null);setActivityDetail(null);setSlotFor(p);setDay(p.start?localDay(p.start):"2026-09-24");setStart("17:00");setEnd("19:00");setFormError("");setActivityOpen(true);};
  const editActivity=(p:Proposal)=>{setActivityDetail(null);setEditingActivity(p);setSlotFor(null);setTitle(p.title);setUrl(p.url);setDay(localDay(p.start!));setStart(timeLabel(p.start!));setEnd(timeLabel(p.end!));setActivityEmojiChoice(p.emoji||null);setFormError("");setActivityOpen(true);};
  const saveActivity = (e:FormEvent) => {
    e.preventDefault();if(activitySaving.current)return;setFormError("");
    const form=new FormData(e.currentTarget as HTMLFormElement);
    const submittedDay=String(form.get("day")||"");const submittedStart=String(form.get("start")||"");const submittedEnd=String(form.get("end")||"");
    const submittedEmoji=activityEmojiChoice;
    const submittedTitle=String(form.get("title")||title);const submittedUrl=String(form.get("url")||url);
    setDay(submittedDay);setStart(submittedStart);setEnd(submittedEnd);setTitle(submittedTitle);setUrl(submittedUrl);
    if(submittedEnd<=submittedStart){setFormError("La fin doit être après le début.");return;}
    const times={start:`${submittedDay}T${submittedStart}:00+02:00`,end:`${submittedDay}T${submittedEnd}:00+02:00`};
    identify(async author=>{if(activitySaving.current)return;activitySaving.current=true;setSaving(true);try{const result=await mutate(slotFor?{action:"slot",proposalId:slotFor.id,author,...times}:editingActivity?{action:"editActivity",proposalId:editingActivity.id,author,title:submittedTitle,url:submittedUrl,emoji:submittedEmoji,expectedUpdated:editingActivity.updated??null,...times}:{action:"propose",kind:"activity",title:submittedTitle,url:submittedUrl,author,emoji:submittedEmoji,...times});if(result.proposal)setState(current=>({...current,proposals:[...current.proposals.filter(p=>p.id!==result.proposal!.id),result.proposal!]}));setActivityOpen(false);if(editingActivity)setActivityDetail(editingActivity.id);celebrate();toast.success(editingActivity?"Activité modifiée pour tout le crew !":slotFor?"Un autre créneau à départager !":"Le programme prend forme. Activité ajoutée !");}catch(err){setFormError((err as Error).message);}finally{activitySaving.current=false;setSaving(false);}});
  };
  const films=state.proposals.filter(p=>p.kind==="movie");
  const myLikes=new Set(state.votes.filter(v=>v.value===1&&voterKey(v.author)===voterKey(person)).map(v=>v.proposalId));
  const visibleFilms=films.filter(p=>filter!=="mine"||myLikes.has(p.id)).sort((a,b)=>score(state.votes,b.id).yes-score(state.votes,a.id).yes||a.title.localeCompare(b.title,"fr")||a.id.localeCompare(b.id));
  const activities=state.proposals.filter(p=>p.kind==="activity");
  const selectedActivity=activities.find(p=>p.id===activityDetail);
  const selectedFilm=detail ? films.find(p=>detailProposalId ? p.id===detailProposalId : p.movie?.id===detail.id) : null;
  const featured=catalog[0];
  const votedNames=new Set(state.votes.map(v=>voterKey(v.author)));
  function Votes({id,slot=false}:{id:string;slot?:boolean|"idea"}) {
    const v=score(state.votes,id,slot),mine=person?v.list.find(vote=>voterKey(vote.author)===voterKey(person)):undefined;
    const groups=[{value:1,label:"Pour",button:"Chaud",className:"yes",count:v.yes,Icon:ThumbsUp},{value:0,label:"Neutres",button:"Peu importe",className:"neutral",count:v.neutral,Icon:Minus},{value:-1,label:"Contre",button:"Pas trop",className:"no",count:v.no,Icon:ThumbsDown}];
    return <div className="vote-widget"><div className="vote-pair">{groups.map(group=><button key={group.value} className={`vote ${group.className}`} aria-pressed={mine?.value===group.value} aria-disabled={pendingVotes.includes(id)} aria-busy={pendingVotes.includes(id)} onClick={()=>vote(id,group.value,slot)} aria-label={`Voter ${group.value===0?"neutre":group.label.toLowerCase()} : ${group.count} votes`}><group.Icon size={16}/><span>{group.button}</span><b key={group.count}>{group.count}</b></button>)}</div>
      <p className="my-vote">{mine?<><Check size={12}/>Ton vote : {mine.value===1?"pour":mine.value===0?"neutre":"contre"} · Tu peux changer d’avis.</>:"Un vote par prénom."}</p><details className="vote-details"><summary><Users size={14}/><span>Qui a voté ?</span><b>{v.list.length}</b><ChevronRight size={14}/></summary><div className="vote-breakdown">{groups.map(group=><section key={group.value} className={`voters-${group.className}`} aria-label={`Votes ${group.label.toLowerCase()}`}><h4><group.Icon size={14}/> {group.label}<b>{group.count}</b></h4>{group.count?<ul>{v.list.filter(vote=>vote.value===group.value).map(vote=><li key={vote.id}><Avatar name={vote.author} small/><span>{vote.author}</span></li>)}</ul>:<p>Aucun vote {group.value===0?"neutre":group.label.toLowerCase()}.</p>}</section>)}</div></details>
    </div>;
  }
  function Avatar({name,small=false}:{name:string;small?:boolean}){return <CrewAvatar name={name} small={small}/>;}
  function MovieCard({movie,proposal,index}:{movie:Movie;proposal?:Proposal;index:number}){return <article key={proposal?.id||movie.id} className="movie-card enter" style={{"--delay":`${Math.min(index,7)*65}ms`} as CSSProperties}>
    <button className="poster" onClick={()=>void openMovie(movie,proposal?.id)} onPointerMove={tilt} onPointerLeave={untilt} aria-label={`Voir la fiche de ${movie.title}`}>
      {movie.poster?<img src={movie.poster} alt={`Affiche de ${movie.title}`} loading={index>3?"lazy":"eager"} onError={e=>{e.currentTarget.style.display="none";}}/>:<div className="poster-fallback"><Film size={38}/><strong>{movie.title}</strong><span>LE CINÉ-CLUB DU JACUZZI</span></div>}
      <div className="poster-shade"/><span className="poster-number">{String(index+1).padStart(2,"0")}</span>
      <span className="poster-label">{proposal?"AU VOTE":"À DÉCOUVRIR"}</span><span className="poster-open"><ArrowUpRight size={24}/></span>
      <div className="poster-caption"><span>{movie.genre||"CINÉMA"}</span><h3>{movie.title}</h3><p>{movie.year||"Année inconnue"}{movie.runtime?` · ${duration(movie.runtime)}`:""}</p></div>
    </button>
    <div className="movie-card-bottom">{proposal?<><div className="proposed"><Avatar name={proposal.author} small/><span>Proposé par <strong>{proposal.author}</strong></span></div>{Votes({id:proposal.id})}<button className="discussion-link" onClick={()=>void openMovie(movie,proposal.id)}>Discussion · {state.comments.filter(c=>c.proposalId===proposal.id).length} message(s)<ArrowUpRight size={14}/></button></>:<button className="add-film" onClick={()=>proposeMovie(movie)} disabled={saving}>{saving&&movieFeedback?.title===movie.title?<LoaderCircle size={17} className="spin"/>:<Plus size={17}/>} {saving&&movieFeedback?.title===movie.title?"Ajout en cours…":"Proposer au crew"} <ArrowUpRight size={16}/></button>}</div>
  </article>;}

  return <AvatarContext.Provider value={state.profiles}>
    <ClubEffects/>
    {transition&&<div className={`universe-transition to-${transition}`} aria-hidden="true"><span/><span/><b>{transition==="cinema"?"JACUZZI PICTURES":transition==="activities"?"ON SORT DU BAIN":transition==="ideas"?"LA BOÎTE À IDÉES":transition==="rewards"?"TES MOMENTS DE GLOIRE":"RETOUR AU QG"}</b></div>}
    <div className="ambient" aria-hidden="true"/>
    <Tabs value={view} onValueChange={goTo} className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Les 34 Chevaux du Jacuzzi, accueil"><span className="brand-symbol">34<Waves size={27}/></span><span>LES 34 CHEVAUX<small>DU JACUZZI</small></span></a>
        <TabsList className="main-nav"><TabsTrigger value="lobby"><Waves size={17}/>Le QG</TabsTrigger><TabsTrigger value="cinema"><Clapperboard size={17}/>Cinéma</TabsTrigger><TabsTrigger value="activities"><CalendarDays size={17}/>Programme</TabsTrigger><TabsTrigger value="ideas"><Lightbulb size={17}/>Idées</TabsTrigger><TabsTrigger value="rewards"><Trophy size={17}/>Récompenses</TabsTrigger></TabsList>
        <div className="header-right"><button className="crew-stack" onClick={()=>{pendingAction.current=null;setIdentityOpen(true);}} aria-label="Les 11 membres du crew">{CREW.slice(0,3).map(n=><Avatar key={n} name={n} small/>)}<span>+8</span></button><button className="identity-button" onClick={()=>{pendingAction.current=null;setIdentityOpen(true);}}>{person?<><Avatar name={person} small/><span>{person}</span></>:<><Users size={16}/><span>Qui es-tu ?</span></>}<ChevronRight size={14}/></button></div>
      </header>
      <main>
        <div className="edition-line"><span><span className="spark">✳</span> LE QG DU CREW</span><span>20 — 27 SEPTEMBRE 2026 <span className="edition-year">/ ÉDITION 01</span></span></div>
        <TabsContent value="lobby" className="view-panel lobby-panel">
          <NextActivity state={state} onProgramme={()=>goTo("activities")} onOpen={(id,planId)=>planId?setRevealId(planId):setActivityDetail(id)}/><VillaScene members={presence.members} profiles={state.profiles} online={presence.online} person={person} onMove={(room,action)=>identify(()=>presence.move(room,action))} onCinema={()=>goTo("cinema")} onProgramme={()=>goTo("activities")} onWardrobe={()=>identify(()=>setAvatarOpen(true))}/>
          {loadError&&<div className="error-banner" role="alert">{loadError}<button onClick={()=>void load()}>Réessayer</button></div>}
          <div className="lobby-strip"><span><b>{films.length}</b> films à départager</span><span><b>{activities.length}</b> plans à vivre</span><span><b>{state.votes.length}</b> votes exprimés</span><button onClick={()=>identify(()=>setAvatarOpen(true))}><CrewAvatar name={person||"Alex"} small/>Personnaliser mon avatar<ArrowUpRight size={16}/></button></div>
          <CrewLeaderboard state={state} person={person} onRewards={()=>goTo("rewards")}/><SelectedPlans state={state} onReveal={setRevealId}/>
        </TabsContent>
        <TabsContent value="cinema" className="view-panel">
          <section className="film-section">
            <div className="movie-discovery"><div className="movie-discovery-copy"><span className="eyebrow"><Clapperboard size={17}/>À TOI DE FAIRE L’AFFICHE</span><h1>Le prochain film ? <em>Ton idée.</em></h1><p>Un titre, un coup de cœur, et le crew décide.</p></div><button className="movie-discovery-search" onClick={()=>{setQuery("");setSearchOpen(true);}} aria-haspopup="dialog"><Search size={25}/><span><strong>Rechercher un film</strong><small>Explore le catalogue · zéro spoiler</small></span><span className="movie-discovery-arrow"><ArrowUpRight size={24}/></span></button><div className="movie-discovery-glow" aria-hidden="true"/></div>
            {movieFeedback?.kind==="success"&&<div className="movie-confirmation" role="status" tabIndex={-1} ref={movieConfirmation}><span className="confirmation-icon"><Check size={24}/></span><div><strong>{movieFeedback.title} a été ajouté !</strong><p>{movieFeedback.message}</p></div><button className="icon-button" onClick={()=>setMovieFeedback(null)} aria-label="Fermer la confirmation"><X size={17}/></button></div>}
            <div className="section-heading"><div><div className="eyebrow muted">LA SÉLECTION</div><h2>À l’affiche du crew<span className="count">{visibleFilms.length.toString().padStart(2,"0")}</span></h2></div><div className="section-tools"><button className={`text-filter ${filter==="all"?"active":""}`} aria-pressed={filter==="all"} onClick={()=>setFilter("all")}>Tous les films</button><button className={`text-filter ${filter==="mine"?"active":""}`} aria-pressed={filter==="mine"} onClick={()=>setFilter("mine")}><Heart size={14}/>Mes favoris</button><button className="icon-button" aria-label="Rechercher et proposer un film" onClick={()=>{setQuery("");setSearchOpen(true);}}><Search size={19}/></button></div></div><p className="film-sort-note">{filter==="mine"&&person?`Les likes de ${person} · `:""}Du plus liké au moins liké</p>
            {loadError&&<div className="error-banner" role="alert">{loadError}<button onClick={()=>void load()}>Réessayer</button></div>}{!loaded?<div className="loading-line"><LoaderCircle className="spin" size={18}/>Le rideau se lève…</div>:films.length===0?<div className="empty-selection"><span className="empty-icon"><Clapperboard size={23}/></span><div><strong>Le premier rôle est pour toi.</strong><p>Cherche ton coup de cœur avec le bouton ci-dessus.</p></div><button className="round-arrow" onClick={()=>{setQuery("");setSearchOpen(true);}} aria-label="Proposer le premier film"><ArrowUpRight size={22}/></button></div>:visibleFilms.length===0?<div className="empty-selection"><span className="empty-icon"><Heart size={23}/></span><div><strong>{person?"Tes coups de cœur t’attendent.":"À chacun ses favoris."}</strong><p>{person?`Vote « Chaud » pour un film : il apparaîtra ici pour ${person}.`:"Choisis ton prénom pour retrouver les films que tu aimes."}</p></div><button className="button secondary" onClick={()=>person?setFilter("all"):identify(()=>{})}>{person?"Voir tous les films":"Choisir mon prénom"}</button></div>:<div className="movies-grid">{visibleFilms.map((p,i)=>MovieCard({movie:p.movie||{...blankMovie(p.title),id:p.id},proposal:p,index:i}))}</div>}
          </section>

          <CinemaLounge {...social} onReveal={setRevealId}/>
          <section className="cinema-hero" onPointerMove={sceneMove} onPointerLeave={sceneReset}>
            <div className="hero-copy"><div className="eyebrow"><span className="line"/> 11 POTES. UNE TÉLÉ. ZÉRO SPOILER.</div><h1>ON SE FAIT<br/><em>UN FILM ?</em><span className="headline-dot">✳</span></h1><div className="hero-bottom"><button className="button primary" onClick={()=>{setQuery("");setSearchOpen(true);}}><Plus size={18}/>Proposer un film<ArrowUpRight size={18}/></button><p>Le choix est collectif.<br/>Le plaid est personnel.</p></div></div>
            <div className="hero-cinema-art" aria-hidden="true">
              {featured?.backdrop?<img className="hero-backdrop" src={featured.backdrop} alt=""/>:<img className="hero-backdrop" src="/jacuzzi.webp" alt=""/>}
              <div className="art-vignette"/>
              <div className="projector-beams"><span/><span/></div>
              <div className="film-orbit orbit-one"/><div className="film-orbit orbit-two"/>
              <div className="hero-film-stage">
              {catalog[2]?.poster&&<img className="floating-poster third" src={catalog[2].poster} alt=""/>}
              {catalog[1]?.poster&&<img className="floating-poster back" src={catalog[1].poster} alt=""/>}
              {featured?.poster&&<img className="floating-poster front" src={featured.poster} alt=""/>}
              </div>
              <span className="cinema-ticket"><Clapperboard size={16}/><b>ADMIT 11</b><span>UNE SÉANCE À NOUS.</span><i/></span>
              <span className="hero-sticker"><Sparkles size={22}/> LA SÉANCE<br/>C’EST NOUS.</span>
              <span className="art-coordinate">JACUZZI PICTURES™<br/>PRÉSENTE VOTRE PROCHAINE SOIRÉE</span>
            </div>
          </section>
          <div className="marquee" aria-hidden="true"><div>{Array.from({length:4},(_,i)=><span key={i}>LES BONS FILMS FONT LES BONNES SOIRÉES <span>✳</span> POP-CORN & DÉMOCRATIE <span>✳</span></span>)}</div></div>

          <section className="inspiration-section"><div className="section-heading"><div><div className="eyebrow muted">EN PANNE D’INSPIRATION ?</div><h2>Ça mérite un débat<span className="yellow-star">✳</span></h2></div><span className="section-note">Quelques idées, à vous de voter.<ArrowDown size={16}/></span></div>
            {catalogError?<div className="error-banner">{catalogError}<button onClick={()=>void loadCatalog()}>Réessayer</button></div>:!catalog.length?<div className="movies-grid">{[0,1,2,3].map(i=><div key={i} className="poster skeleton"/>)}</div>:<div className="movies-grid">{catalog.filter(m=>!films.some(p=>p.movie?.id===m.id)).map((m,i)=>MovieCard({movie:m,index:i}))}</div>}
          </section>
          <div className="cinema-note"><ShieldCheck size={18}/><p>Aucun résumé, aucune bande-annonce. La surprise reste entière.</p><span>JUSTE L’ESSENTIEL.</span></div>
        </TabsContent>

        <TabsContent value="activities" className="view-panel">
          <section className="planning-section"><div className="section-heading"><div><div className="eyebrow muted">LE PROGRAMME DES RÉJOUISSANCES</div><h2>Les prochains jours<span className="yellow-star">✳</span></h2></div><span className="date-pill"><CalendarDays size={16}/>24 — 27 sept. 2026</span></div><div className="planning-meta"><span>{activities.length} activité{activities.length!==1?"s":""} proposée{activities.length!==1?"s":""}</span><span>Heure de Paris · Créneaux ouverts au débat</span></div>
          {loadError&&<div className="error-banner" role="alert">{loadError}<button onClick={()=>void load()}>Réessayer</button></div>}
          <WeeklyPlanner activities={activities} canMove={!!person} onIdentify={()=>identify(()=>toast.info("Prénom choisi. Tu peux maintenant déplacer une activité."))} onOpen={setActivityDetail} onAdd={date=>openActivity(date)} onMove={moveActivity}/></section>
          <section className="activity-hero" onPointerMove={sceneMove} onPointerLeave={sceneReset}><img src="/jacuzzi.webp" alt="Un cheval chromé dans un jacuzzi bleu, l’emblème du crew"/><div className="pool-overlay"/><div className="pool-rings" aria-hidden="true"><i/><i/><span>34</span></div><div className="hero-copy"><div className="eyebrow"><span className="line"/> UNE SEMAINE. AUCUNE CHANCE DE S’ENNUYER.</div><h1>ON SORT<br/><em>DU JACUZZI ?</em></h1><button className="button primary" onClick={()=>openActivity()}><Plus size={18}/>Proposer une activité<ArrowUpRight size={18}/></button></div><span className="pool-sticker">11 POTES<br/><b>∞</b><br/>BONNES IDÉES</span></section>
          <div className="marquee activity-marquee" aria-hidden="true"><div>{Array.from({length:4},(_,i)=><span key={i}>LE CREW DÉCIDE <span>✳</span> LES SOUVENIRS RESTENT <span>✳</span> 34 CHEVAUX. AUCUN FREIN. <span>✳</span></span>)}</div></div>

          <section className="activity-section"><div className="section-heading"><div><div className="eyebrow muted">ON EN DIT QUOI ?</div><h2>Les plans du crew<span className="count">{activities.length.toString().padStart(2,"0")}</span></h2></div></div>{activities.length?<div className="activity-grid">{activities.map((p,i)=>{const slots=state.slots.filter(s=>s.proposalId===p.id);return <article className="activity-card enter" key={p.id} style={{"--delay":`${i*60}ms`,"--card-accent":COLORS[i%COLORS.length]} as CSSProperties}><div className="activity-top"><ActivityEmojiBadge proposal={p} className="activity-card-emoji"/><span className="activity-day">{p.start?dateLabel(p.start,{weekday:"short",day:"numeric"}):""}</span><ArrowUpRight size={25}/></div><h3><button onClick={()=>setActivityDetail(p.id)}>{p.title}</button></h3><div className="activity-time"><Clock3 size={16}/>{p.start&&timeLabel(p.start)} — {p.end&&timeLabel(p.end)}</div><div className="proposed"><Avatar name={p.author} small/><span>Une idée de <strong>{p.author}</strong></span></div>{Votes({id:p.id})}<button className="discussion-link" onClick={()=>setActivityDetail(p.id)}>Infos & discussion · {state.comments.filter(c=>c.proposalId===p.id).length} message(s)<ArrowUpRight size={14}/></button><div className="activity-edit-row"><button onClick={()=>editActivity(p)}><Clock3 size={15}/>Modifier l’activité</button></div><div className="activity-actions"><a href={p.url} target="_blank" rel="noopener noreferrer">Voir le lieu<ExternalLink size={14}/></a><button onClick={()=>openSlot(p)}>Autre créneau<Plus size={15}/></button></div>{slots.length>0&&<button className="alternatives-count" onClick={()=>setActivityDetail(p.id)}>{slots.length} autre{slots.length>1?"s":""} créneau{slots.length>1?"x":""} proposé{slots.length>1?"s":""}<ArrowRight size={15}/></button>}</article>;})}</div>:<div className="activity-empty"><Sparkles size={35}/><h3>Tout reste à inventer.</h3><p>Une rando, un resto, un escape game ?<br/>Un nom, un lien, un créneau. Le crew décide.</p><button className="button secondary" onClick={()=>openActivity()}>Lancer la première idée<Plus size={17}/></button></div>}</section>
          <section className="activity-ideas" aria-labelledby="activity-ideas-title">
            <div className="section-heading"><div><div className="eyebrow muted">ET SI ON TENTAIT ÇA ?</div><h2 id="activity-ideas-title">La boîte à bonnes idées<span className="yellow-star">✳</span></h2></div><span className="section-note">Choisis un créneau. Le crew décide.<ArrowDown size={16}/></span></div>
            <div className="activity-ideas-grid">{ACTIVITY_IDEAS.map((idea,i)=><article className={`idea-card idea-${idea.theme} enter`} key={idea.theme} onPointerMove={tilt} onPointerLeave={untilt} style={{"--delay":`${i*80}ms`} as CSSProperties}>
              <div className="idea-art" aria-hidden="true"><img className="idea-scene" src={idea.theme==="escape"?"/escape-game.webp":"/karting.webp"} alt="" width={1536} height={1024} loading="lazy"/><span className="idea-orbit"/><span className="idea-orbit second"/><idea.Icon className="idea-symbol" strokeWidth={1}/><span className="idea-checker"/></div>
              <div className="idea-top"><span className="eyebrow">{idea.kicker}</span><span className="idea-badge">À SUGGÉRER</span></div>
              <div className="idea-copy"><ActivityEmojiBadge proposal={{title:idea.name}} className="idea-emoji"/><h3>{idea.name}</h3><p>{idea.description}</p></div>
              <div className="idea-bottom"><a href={idea.url} target="_blank" rel="noopener noreferrer" aria-label={`Voir le site de ${idea.venue}`}>{idea.venue}<ExternalLink size={14}/></a><button className="button" onClick={()=>openActivity(undefined,idea)}><Plus size={17}/>Proposer {idea.name}<ArrowUpRight size={17}/></button></div>
            </article>)}</div>
            <p className="ideas-note">Ces lieux sont des pistes : choisis le jour et l’heure avant de proposer l’activité au crew.</p>
          </section>
        </TabsContent>
        <TabsContent value="ideas" className="view-panel"><FeatureIdeas {...social} renderVotes={id=>Votes({id,slot:"idea"})} loaded={loaded} error={loadError} onRetry={()=>void load()}/></TabsContent>
        <TabsContent value="rewards" className="view-panel"><RewardsPage person={person} peak={peak} currentVotes={state.votes.filter(v=>voterKey(v.author)===voterKey(person)).length} onReplay={unlocks.replay} onWardrobe={()=>identify(()=>setAvatarOpen(true))} onIdentify={()=>identify(()=>{})}/></TabsContent>
        <CrewCards state={state}/>
        <footer><a className="footer-brand" href="/">LES 34 CHEVAUX DU JACUZZI <Waves size={19}/></a><a className="contribute-link" href="https://github.com/Aleqsd/les-34-chevaux-du-jacuzzi" target="_blank" rel="noopener noreferrer"><img className="github-mark" src="/github.svg" alt="" width={19} height={19}/>Code ouvert · Viens contribuer<ArrowUpRight size={15}/></a><a className="tmdb-credit" href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer"><img src="/tmdb.svg" alt="TMDB"/>Données cinéma</a><p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p><p className="emoji-credit">Emojis : <a href="https://github.com/twitter/twemoji" target="_blank" rel="noopener noreferrer">Twemoji, Twitter et contributeurs</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></p></footer>
      </main>
    </Tabs>

    <Dialog open={identityOpen} onOpenChange={open=>{setIdentityOpen(open);if(!open)pendingAction.current=null;}}><DialogContent className="club-dialog identity-dialog"><div className="dialog-kicker"><Users size={18}/>LE CREW</div><DialogTitle>Tu es de la partie ?</DialogTitle><DialogDescription>Choisis ton nom. Pas de compte, juste les copains.</DialogDescription><div className="name-grid">{CREW.map(n=><button key={n} className={nameDraft===n?"selected":""} onClick={()=>chooseName(n)}><Avatar name={n} small/>{n}{person===n&&<Check size={15}/>}</button>)}</div><form onSubmit={e=>{e.preventDefault();chooseName(nameDraft);}}><label htmlFor="other-name">Ou un autre prénom</label><div className="name-input-row"><input id="other-name" value={nameDraft} maxLength={40} onChange={e=>setNameDraft(e.target.value)} placeholder="Ton prénom" required/><button className="button primary" type="submit" disabled={!nameDraft.trim()}>C’est moi<ArrowRight size={17}/></button></div></form><button className="button secondary full" onClick={()=>{setIdentityOpen(false);identify(()=>setAvatarOpen(true));}}><Sparkles size={17}/>Personnaliser mon avatar</button><p className="fine-print">Un vote par prénom et par proposition. Tu peux changer d’avis à tout moment.</p></DialogContent></Dialog>


    <Dialog open={searchOpen} onOpenChange={setSearchOpen}><DialogContent className="club-dialog search-dialog"><div className="dialog-kicker"><Clapperboard size={18}/>FAIS TON CINÉMA</div><DialogTitle>Le prochain coup de cœur.</DialogTitle><DialogDescription>Recherche un titre, ouvre sa fiche, puis propose-le au crew.</DialogDescription>
      <Combobox inline open items={results} value={null} filter={null} inputValue={query} onInputValueChange={value=>setQuery(value)} onValueChange={(m:Movie|null)=>{if(m)void openMovie(m);}} itemToStringLabel={(m:Movie)=>m.title}>
        <ComboboxInput className="movie-search-input" aria-label="Rechercher un film" placeholder="Interstellar, Le Dîner de cons…" showTrigger={false} showClear autoFocus/>
        <div className="search-status" role="status">{searching?<><LoaderCircle size={14} className="spin"/>Recherche dans le catalogue…</>:searchError?<span className="form-error">{searchError}</span>:<><ShieldCheck size={14}/>{results.length} film{results.length!==1?"s":""} · Choisis une fiche, sans spoiler.</>}</div>
        <ComboboxList className="movie-results-list" aria-label="Résultats de recherche de films">{(m:Movie)=><ComboboxItem key={m.id} value={m} className="movie-result">{m.poster?<img src={m.poster} alt=""/>:<Film size={25}/>}<span><strong>{m.title}</strong><small>{m.year}{m.genre?` · ${m.genre}`:""}</small></span><ArrowUpRight size={16}/></ComboboxItem>}</ComboboxList>
        {!results.length&&!searching&&<p className="search-empty">{searchError?"Réessaie la recherche ou ajoute le titre manuellement.":"Aucun film trouvé. Essaie un autre titre ou ajoute-le manuellement."}</p>}
      </Combobox>
      <button className="manual-add" disabled={!query.trim()} onClick={()=>void openMovie(blankMovie(query.trim()))}>Film introuvable ? Ajouter « {query.trim()||"ton titre"} » manuellement<Plus size={16}/></button>
    </DialogContent></Dialog>

    <Dialog open={!!detail} onOpenChange={open=>{if(!open){setDetail(null);detailRequest.current++;}}}><DialogContent className="club-dialog movie-detail">{detail&&<><div className="detail-backdrop">{detail.backdrop&&<img src={detail.backdrop} alt=""/>}<div/><span className="detail-tag"><ShieldCheck size={14}/>ZONE SANS SPOILER</span></div><div className="detail-main">{detail.poster?<img className="detail-poster" src={detail.poster} alt={`Affiche de ${detail.title}`}/>:<div className="detail-poster poster-fallback"><Film size={30}/></div>}<div className="detail-info"><span className="eyebrow">{detail.year||"LE CINÉ-CLUB"}</span><DialogTitle>{detail.title}</DialogTitle><DialogDescription>{detail.genre||"À découvrir ensemble"}</DialogDescription><div className="detail-facts"><span><Clock3 size={15}/>{detailLoading?"Chargement…":duration(detail.runtime)}</span>{detail.director&&<span>Un film de {detail.director}</span>}</div></div></div>{detailError&&<p role="alert" className="form-error">{detailError}</p>}<div className="detail-bottom">{movieFeedback?.kind==="error"&&movieFeedback.title===detail.title&&<div className="movie-add-error" role="alert"><strong>Le film n’a pas été ajouté.</strong><p>{movieFeedback.message}</p><span>Tu peux réessayer avec le bouton ci-dessous.</span></div>}{selectedFilm?<><div className="proposed"><Avatar name={selectedFilm.author} small/>Proposé par {selectedFilm.author}</div>{Votes({id:selectedFilm.id})}<p className="vote-note">{score(state.votes,selectedFilm.id).list.length} votes exprimés · Un vote par prénom.</p><button className="button primary full" onClick={()=>retain(selectedFilm)}><Sparkles size={17}/>Retenir ce film pour une soirée</button><Discussion {...social} proposal={selectedFilm} key={selectedFilm.id}/><DeleteMovie key={`delete-${selectedFilm.id}`} proposal={selectedFilm} identify={identify} onDelete={async author=>{const id=selectedFilm.id;await api("/api/club",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"deleteMovie",proposalId:id,author})});refreshRequest.current++;setState(previous=>{const planIds=new Set(previous.plans.filter(p=>p.proposalId===id).map(p=>p.id));const slotIds=new Set(previous.slots.filter(p=>p.proposalId===id).map(p=>p.id));return {...previous,proposals:previous.proposals.filter(p=>p.id!==id),votes:previous.votes.filter(v=>v.proposalId!==id&&!slotIds.has(v.slotId||"")),slots:previous.slots.filter(p=>p.proposalId!==id),comments:previous.comments.filter(p=>p.proposalId!==id),plans:previous.plans.filter(p=>p.proposalId!==id),participants:previous.participants.filter(p=>!planIds.has(p.planId)),activityDetails:previous.activityDetails.filter(p=>p.proposalId!==id)};});detailRequest.current++;setDetail(null);setDetailProposalId(null);setMovieFeedback(null);toast.success(`${selectedFilm.title} a été supprimé de la sélection.`);}}/></>:<button className="button primary full" disabled={saving||detailLoading} aria-busy={saving} onClick={()=>proposeMovie(detail)}>{saving?<LoaderCircle size={18} className="spin"/>:<Plus size={18}/>} {saving?"Ajout en cours…":"Proposer ce film au crew"}</button>}{detail.sourceUrl&&<a className="source-link" href={detail.sourceUrl} target="_blank" rel="noopener noreferrer">Fiche TMDB — peut contenir des spoilers<ExternalLink size={12}/></a>}</div></>}</DialogContent></Dialog>

    <Dialog open={activityOpen} onOpenChange={open=>{if(!saving)setActivityOpen(open);}}><DialogContent className="club-dialog"><div className="dialog-kicker"><Sun size={18}/>{editingActivity?"À VOUS DE JOUER":slotFor?"ON DÉCALE ?":"ON BOUGE ?"}</div><DialogTitle>{editingActivity?"On ajuste le programme." : slotFor?"Un autre moment." : "Une bonne idée, ça se partage."}</DialogTitle><DialogDescription>{editingActivity?"Tout le crew peut modifier cette activité. Les votes et la discussion restent en place.":slotFor?`Propose un autre créneau pour « ${slotFor.title} ». Le créneau initial reste au programme.`:"Un nom, un lien et un créneau. Les copains s’occupent du reste."}</DialogDescription><form onSubmit={saveActivity} className="activity-form"><fieldset className="activity-edit-fields" disabled={saving}>{!slotFor&&<><label htmlFor="activity-name">L’activité<input id="activity-name" name="title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Escape game, kayak, resto…" required maxLength={200}/></label><ActivityEmojiPicker title={title} value={activityEmojiChoice} onChange={setActivityEmojiChoice} disabled={saving}/><label htmlFor="activity-url">Le site web<input id="activity-url" name="url" type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…" required maxLength={1000}/></label></>}<label htmlFor="activity-date">Le jour<input id="activity-date" name="day" type="date" defaultValue={day} min="2026-09-20" max="2026-09-27" required/></label><div className="time-inputs"><label htmlFor="activity-start">Début<input id="activity-start" name="start" type="time" defaultValue={start} required/></label><ArrowRight size={18}/><label htmlFor="activity-end">Fin<input id="activity-end" name="end" type="time" defaultValue={end} required/></label></div></fieldset><div className="form-author"><span>{editingActivity?"Modifié par":"Proposé par"}</span><button type="button" onClick={()=>{pendingAction.current=null;setIdentityOpen(true);}}>{person||"Choisir mon prénom"}<ChevronRight size={14}/></button></div>{formError&&<p className="form-error" role="alert">{formError}</p>}<button className="button primary full" type="submit" disabled={saving}>{saving?<LoaderCircle size={18} className="spin"/>:<Plus size={18}/>} {editingActivity?"Enregistrer les modifications":slotFor?"Suggérer ce créneau":"Envoyer l’idée au crew"}</button><p className="fine-print">Heure de Paris · Du 20 au 27 septembre 2026</p></form></DialogContent></Dialog>

    <Dialog open={!!selectedActivity} onOpenChange={open=>{if(!open)setActivityDetail(null);}}><DialogContent className="club-dialog activity-detail">{selectedActivity&&<><div className="dialog-kicker"><Sun size={18}/>LE PLAN</div><ActivityEmojiEditor {...social} proposal={selectedActivity} key={selectedActivity.id}/><DialogTitle>{selectedActivity.title}</DialogTitle><DialogDescription>Une idée de {selectedActivity.author}</DialogDescription><button className="button secondary full edit-activity-button" onClick={()=>editActivity(selectedActivity)}><Clock3 size={17}/>Modifier l’activité et ses horaires</button>{selectedActivity.updatedBy&&<p className="fine-print">Dernière modification par {selectedActivity.updatedBy}.</p>}<div className="original-slot"><CalendarDays size={20}/><div><strong>{dateLabel(selectedActivity.start!)}</strong><span>{timeLabel(selectedActivity.start!)} — {timeLabel(selectedActivity.end!)}</span></div><a className="icon-button" href={selectedActivity.url} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir le site de l’activité"><ExternalLink size={18}/></a></div>{Votes({id:selectedActivity.id})}<ActivityPractical {...social} proposal={selectedActivity} key={selectedActivity.id}/><button className="button primary full" onClick={()=>retain(selectedActivity)}><Sparkles size={17}/>Retenir ce plan</button><div className="alternative-header"><h3>D’autres créneaux ?</h3><button className="icon-button" onClick={()=>openSlot(selectedActivity)} aria-label="Suggérer un autre créneau"><Plus size={18}/></button></div>{state.slots.filter(s=>s.proposalId===selectedActivity.id).map(s=><div key={s.id} className="alternative"><div><strong>{dateLabel(s.start,{weekday:"short",day:"numeric"})} · {timeLabel(s.start)} — {timeLabel(s.end)}</strong><span>Suggéré par {s.author}</span></div>{Votes({id:s.id,slot:true})}</div>)}{!state.slots.some(s=>s.proposalId===selectedActivity.id)&&<p className="fine-print">Pas encore d’alternative. Tu préfères un autre moment ?</p>}<button className="button secondary full" onClick={()=>openSlot(selectedActivity)}><Clock3 size={16}/>Suggérer un autre créneau</button><p className="vote-note">Un vote par prénom et par créneau. Les horaires alternatifs restent des suggestions.</p><Discussion {...social} proposal={selectedActivity} key={selectedActivity.id}/></>}</DialogContent></Dialog>
    <SelectPlan {...social} proposal={selectPlan} editing={editingPlan} onClose={()=>{setSelectPlan(null);setEditingPlan(null);}} onReveal={setRevealId}/>
    <PlanReveal key={revealId||"closed"} {...social} id={revealId} onEdit={plan=>{const p=state.proposals.find(p=>p.id===plan.proposalId);if(p){setRevealId(null);setEditingPlan(plan);setSelectPlan(p);}}} onClose={()=>{setRevealId(null);if(location.search.includes("plan="))history.replaceState(null,"",location.pathname);}}/>
    <AvatarEditor {...social} open={avatarOpen} onClose={()=>setAvatarOpen(false)}/>
    <UnlockCelebration reward={avatarOpen||identityOpen?null:unlocks.reward} onClose={unlocks.dismiss} onWardrobe={()=>{unlocks.dismiss();setAvatarOpen(true);}}/>
    <Toaster theme="dark" position="bottom-center" richColors closeButton/>
  </AvatarContext.Provider>;
}
