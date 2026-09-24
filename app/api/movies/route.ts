import { env } from "cloudflare:workers";
import type { Movie } from "@/lib/club";
type TMDB = { adult?: boolean; id: number; title: string; release_date?: string; genres?: {name: string}[]; genre_ids?: number[]; runtime?: number; poster_path?: string; backdrop_path?: string; credits?: { crew: {job: string; name: string}[] } };
const GENRES: Record<number,string> = { 28:"Action",12:"Aventure",16:"Animation",35:"Comédie",80:"Crime",99:"Documentaire",18:"Drame",10751:"Famille",14:"Fantastique",36:"Histoire",27:"Horreur",10402:"Musique",9648:"Mystère",10749:"Romance",878:"Science-fiction",10770:"Téléfilm",53:"Thriller",10752:"Guerre",37:"Western" };
const memory = new Map<string,{data: unknown; expires: number}>();
const pending = new Map<string,Promise<unknown>>();
async function tmdb(path: string) {
  const cached = memory.get(path); if (cached && cached.expires > Date.now()) return cached.data;
  if (pending.has(path)) return pending.get(path);
  const task = (async () => {
    const apiKey = (env as unknown as Record<string,string>).TMDB_API_KEY || process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error("not_configured");
    const url = new URL(`https://api.themoviedb.org/3/${path}`); url.searchParams.set("language","fr-FR"); url.searchParams.set("api_key",apiKey);
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(response.status === 429 ? "busy" : "unavailable");
    const data = await response.json();
    if (memory.size > 200) memory.delete(memory.keys().next().value!);
    memory.set(path,{data,expires: Date.now()+3600000}); return data;
  })();
  pending.set(path, task); try { return await task; } finally { pending.delete(path); }
}
function normalize(m: TMDB): Movie { return { id: String(m.id), title: m.title, year: m.release_date?.slice(0,4) || "", genre: (m.genres?.map(g=>g.name) || m.genre_ids?.map(g=>GENRES[g]).filter(Boolean) || []).slice(0,2).join(" · "), runtime: m.runtime || null, director: m.credits?.crew.filter(c=>c.job==="Director").map(c=>c.name).join(", ") || "", poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "", backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : "", sourceUrl: `https://www.themoviedb.org/movie/${m.id}`, source:"TMDB" }; }
export async function GET(request: Request) {
  const url = new URL(request.url); const q = (url.searchParams.get("q") || "").trim().slice(0,150); const id = url.searchParams.get("id");
  try {
    if (id) {
      if (!/^\d{1,10}$/.test(id)) return Response.json({error:"Film invalide."},{status:400});
      const data = await tmdb(`movie/${id}?append_to_response=credits`) as TMDB;
      if (data.adult) return Response.json({error:"Film non disponible dans ce catalogue."},{status:404});
      return Response.json({ movie: normalize(data) }, { headers:{"Cache-Control":"public, max-age=86400"} });
    }
    if (q && q.length<2) return Response.json({ movies: [] });
    if (q) {
      const data = await tmdb(`search/movie?query=${encodeURIComponent(q)}&include_adult=false&page=1`) as {results: TMDB[]};
      return Response.json({movies:data.results.slice(0,12).map(normalize)}, {headers:{"Cache-Control":"public, max-age=3600"}});
    }
    const ids = [157336,693134,120467,545611,496243,546554,244786,9421];
    const results = await Promise.allSettled(ids.map(id=>tmdb(`movie/${id}?append_to_response=credits`)));
    const movies = results.filter(r=>r.status==="fulfilled").map(r=>normalize((r as PromiseFulfilledResult<TMDB>).value));
    if (!movies.length) throw new Error("unavailable");
    return Response.json({movies},{headers:{"Cache-Control":"public, max-age=3600"}});
  } catch { return Response.json({ error: "Le catalogue fait une petite pause. Réessaie, ou ajoute le titre manuellement." },{status:503}); }
}

