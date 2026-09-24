"use client";
import {RadioGroup,RadioGroupItem} from "@/components/ui/radio-group";
export function CookieCatalogFilter({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string;count:number}[]}){
 return <RadioGroup className="cookie-catalog-filter" aria-label={label} value={value} onValueChange={onChange}>{options.map(o=><label key={o.value} className={value===o.value?"selected":""}><RadioGroupItem value={o.value}/><span>{o.label}</span><b>{o.count}</b></label>)}</RadioGroup>;
}
