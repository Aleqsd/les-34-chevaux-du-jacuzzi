import { env } from "cloudflare:workers";
export function database() { if (!env.DB) throw new Error("La base du crew est momentanément indisponible."); return env.DB; }
