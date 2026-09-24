# Les 34 Chevaux du Jacuzzi ✳

[Ouvrir le site](https://les-34-chevaux-du-jacuzzi.aleqsd1.chatgpt.site/) · [Contribuer](CONTRIBUTING.md) · [Proposer une idée](https://github.com/Aleqsd/les-34-chevaux-du-jacuzzi/issues/new/choose)

**Les contributions sont les bienvenues !** Design, animations, accessibilité, fonctionnalités ou correction de bugs : viens améliorer le QG avec nous.

Le QG du séjour du **20 au 27 septembre 2026**, pour Alex, Bimbo, Penelop, Telroshan, TyNiTOoN, Faufau, FonograF, Le Lucas, Locky, Solinca et Tristan.

## Dans le jacuzzi

- QG 3D : cheval chromé animé, eau réactive au pointeur, bouée, transitions rideau et vague. Three.js est chargé à la demande ; la scène s’arrête hors écran et lorsque l’onglet est masqué.
- Onze cartes holographiques à retourner avec les contributions par prénom. Douze avatars kawaii au choix, ou image HTTPS personnalisée.
- Cinéma : recherche TMDB rapide en français, affiches, année, genres, durée, réalisation. Aucun synopsis ni bande-annonce. Ajout manuel possible.
- Votes pour/contre et détail nominatif. Un même prénom peut voter plusieurs fois. Chaque clic compte ; une répétition réseau du même envoi n’est pas comptée deux fois.
- Duels entre deux films proposés, votes séparés des votes pour/contre, jauges et choix nominatifs.
- Activités : nom, lien HTTP(S), créneau et alternatives horaires soumises au vote. Suggestions Escape Game et Karting.
- Fiches pratiques : tarif, adresse, trajet, capacité, conditions et notes. La durée vient du créneau ; les informations inconnues restent inconnues.
- Discussions chronologiques sur chaque proposition, avec brouillon conservé en cas d’erreur.
- Plans retenus avec créneau explicite, compte à rebours d’annonce, lien partageable, affiche PNG et confirmations de présence distinctes des votes.
- Stockage partagé D1. Actualisation toutes les 15 secondes quand la page est visible et après les actions. Identité libre par prénom.
- Interface mobile, clavier, réduction des animations et image de repli sans WebGL.

## Développement local

Node **22.13+** et npm. Le script de préparation crée les fichiers locaux sans accès à la production. Renseigne ensuite ta propre clé TMDB v3 dans `.env`. Ne la préfixe jamais par `NEXT_PUBLIC_`.

```sh
node scripts/setup-local.mjs
npm run install:ci
# Renseigner TMDB_API_KEY dans .env
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_fat_gamora.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_slimy_salo.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_wealthy_blur.sql
npm run dev
```

Applique ces migrations dans cet ordre, **une seule fois sur une base locale neuve**. Ouvre ensuite http://localhost:5173. Les changements de schéma passent par `npm run db:generate` ; les migrations déjà appliquées restent immuables.

## Vérification

```sh
node node_modules/typescript/bin/tsc --noEmit
npm run build
# Avec le serveur local en cours :
node scripts/verify-api.mjs
node scripts/verify-social.mjs
```

Les tests refusent une URL hors localhost/127.0.0.1 et créent des fixtures sous **Test API** en local. Ils couvrent recherche TMDB, propositions, URL et dates, votes répétés, idempotence, alternatives, duels, commentaires, fiches pratiques, rendez-vous, présences, avatars et rejet des écritures d’une autre origine.

Vérifie aussi les petits écrans, le clavier, les erreurs réseau et la réduction des animations. WebMCP expose `read_crew_plans` et `start_movie_proposal` (ouvre uniquement la recherche).

## Hébergement

Le site utilise **ChatGPT Sites / Cloudflare Workers et D1**, sans VPS. `TMDB_API_KEY` reste côté serveur. Les clés, bases locales, identifiants Sites et sorties de build sont exclus du dépôt GitHub.

Le script local crée `.openai/hosting.json` avec les seules liaisons de stockage de développement. Publier son propre exemplaire demande son propre projet Sites ou ses propres ressources Cloudflare. Les contributions GitHub ne déclenchent pas automatiquement un déploiement du site du crew.

Les prénoms sont déclaratifs et les votes répétés sont intentionnels : ce projet est conçu pour un groupe d’amis, sans garantie d’identité unique.

## Crédits

- Cheval 3D : **Quaternius**, CC0, via [Poly Pizza](https://poly.pizza/m/qvTrSG9pZF).
- Décors et avatars kawaii : créations originales ImageGen, optimisées en WebP. Prompts dans `docs/`. Les visuels de lieux sont imaginaires.
- Films et affiches : [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.
- Polices Manrope et Barlow Condensed ; icônes Lucide ; Three.js.

Code sous [licence MIT](LICENSE). Les ressources tierces conservent leurs licences : [notices](THIRD_PARTY_NOTICES.md).
