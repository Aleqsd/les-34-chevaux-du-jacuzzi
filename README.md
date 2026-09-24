# Les 34 Chevaux du Jacuzzi ✳

[Ouvrir le site](https://les-34-chevaux-du-jacuzzi.aleqsd1.chatgpt.site/) · [Contribuer](CONTRIBUTING.md) · [Proposer une idée](https://github.com/Aleqsd/les-34-chevaux-du-jacuzzi/issues/new/choose)

**Les contributions sont les bienvenues !** Design, animations, accessibilité, fonctionnalités ou correction de bugs : viens améliorer le QG avec nous.

Le QG du séjour du **20 au 27 septembre 2026**, pour Alex, Bimbo, Penelop, Telroshan, TyNiTOoN, Faufau, FonograF, Le Lucas, Locky, Solinca et Tristan.

## Dans le jacuzzi

- QG 3D : cheval chromé animé, eau réactive au pointeur, bouée, transitions rideau et vague. Three.js est chargé à la demande ; la scène s’arrête hors écran et lorsque l’onglet est masqué.
- Onze cartes holographiques à retourner avec les contributions par prénom. 36 avatars kawaii au choix, ou image HTTPS personnalisée.
- Cinéma : recherche TMDB rapide en français, affiches, année, genres, durée, réalisation. Aucun synopsis ni bande-annonce. Ajout manuel possible.
- Votes pour/contre avec détail nominatif : un seul vote par prénom et par proposition ou créneau. Changer d’avis remplace le précédent choix. La casse, les espaces autour du prénom et les variantes Unicode équivalentes sont normalisés.
- Activités : nom, lien HTTP(S), créneau et alternatives horaires soumises au vote. Suggestions Escape Game et Karting.
- Tout le crew peut modifier le nom, le lien, l’emoji et les horaires des activités, ainsi que les créneaux des rendez-vous retenus. Votes, discussions et présences sont conservés. Les modifications concurrentes sont signalées.
- Emoji suggéré selon le nom pour chaque activité, modifiable et partagé. Visible dans le planning, les cartes, les fiches et les affiches.
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
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_flashy_grim_reaper.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0004_cooing_wendell_rand.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0005_flimsy_northstar.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0006_vote_guard.sql
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
node scripts/verify-event-edits.mjs
node scripts/verify-votes.mjs
```

Les tests refusent une URL hors localhost/127.0.0.1 et créent des fixtures sous **Test API** en local. Ils couvrent recherche TMDB, propositions, URL et dates, votes uniques et concurrents, normalisation des prénoms, nettoyage historique, alternatives, édition collaborative, commentaires, fiches pratiques, rendez-vous, présences, avatars et rejet des écritures d’une autre origine.

Vérifie aussi les petits écrans, le clavier, les erreurs réseau et la réduction des animations. WebMCP expose `read_crew_plans` et `start_movie_proposal` (ouvre uniquement la recherche).

## Hébergement

Le site utilise **ChatGPT Sites / Cloudflare Workers et D1**, sans VPS. `TMDB_API_KEY` reste côté serveur. Les clés, bases locales, identifiants Sites et sorties de build sont exclus du dépôt GitHub.

Le script local crée `.openai/hosting.json` avec les seules liaisons de stockage de développement. Publier son propre exemplaire demande son propre projet Sites ou ses propres ressources Cloudflare. Les contributions GitHub ne déclenchent pas automatiquement un déploiement du site du crew.

Les prénoms restent déclaratifs, sans compte ni vérification d’identité. La base impose un vote par prénom normalisé et par cible. La migration 0005 conserve le choix le plus récent (date, puis ordre d’insertion) et archive les lignes originales dans vote_cleanup_backup, non exposée par l’API. Les auteurs présents avant cette migration ont été audités comme ASCII ; un fork contenant déjà des noms Unicode doit adapter le backfill à la normalisation JavaScript.

## Crédits

- Cheval 3D : **Quaternius**, CC0, via [Poly Pizza](https://poly.pizza/m/qvTrSG9pZF).
- Décors et avatars kawaii : créations originales ImageGen, optimisées en WebP. Prompts dans `docs/`. Les visuels de lieux sont imaginaires.
- Films et affiches : [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.
- Polices Manrope et Barlow Condensed ; icônes Lucide ; Three.js.

Code sous [licence MIT](LICENSE). Les ressources tierces conservent leurs licences : [notices](THIRD_PARTY_NOTICES.md).
