"use client";
import { useRef, useState } from "react";
import { LoaderCircle, Trash2, X } from "lucide-react";
import type { Proposal } from "@/lib/club";

export function DeleteMovie({proposal,identify,onDelete}:{proposal:Proposal;identify:(work:(name:string)=>void)=>void;onDelete:(author:string)=>Promise<void>}){
  const [confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const guard=useRef(false);
  const remove=()=>identify(async author=>{if(guard.current)return;guard.current=true;setBusy(true);setError("");try{await onDelete(author);}catch(e){setError((e as Error).message);}finally{guard.current=false;setBusy(false);}});
  return <section className="delete-movie">{confirm?<div className="delete-movie-confirm" role="group" aria-label="Confirmer la suppression du film"><strong>Supprimer « {proposal.title} » ?</strong><p>Le film, ses votes, ses messages et ses séances retenues seront supprimés pour tout le crew.</p><div><button className="button secondary" disabled={busy} onClick={()=>{setConfirm(false);setError("");}}><X size={16}/>Annuler</button><button className="button delete-movie-action" disabled={busy} onClick={remove}>{busy?<LoaderCircle size={16} className="spin"/>:<Trash2 size={16}/>} {busy?"Suppression…":"Confirmer la suppression"}</button></div>{error&&<p className="form-error" role="alert">{error}</p>}</div>:<button className="delete-movie-trigger" onClick={()=>setConfirm(true)}><Trash2 size={16}/>Supprimer ce film de la sélection</button>}</section>;
}
