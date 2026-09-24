// Free names remain declarative; normalize spelling variants for one vote each.
export function voterKey(name:string){return name.trim().normalize("NFKC").toLocaleLowerCase("fr");}
