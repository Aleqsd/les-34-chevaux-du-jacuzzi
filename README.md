# Les 34 Chevaux du Jacuzzi ✳

[Ouvrir le site](https://les-34-chevaux-du-jacuzzi.aleqsd1.chatgpt.site/) · [Contribuer](CONTRIBUTING.md) · [Proposer une idée](https://github.com/Aleqsd/les-34-chevaux-du-jacuzzi/issues/new/choose)

**Les contributions sont les bienvenues !** Design, animations, accessibilité, fonctionnalités ou correction de bugs : viens améliorer le QG avec nous.

Le QG du séjour du **20 au 27 septembre 2026**, pour Alex, Bimbo, Penelop, Telroshan, TyNiTOoN, Faufau, FonograF, Le Lucas, Locky, Solinca et Tristan.

## Dans le jacuzzi

- Île-jardin 3D interactive : salon cinéma, pergola, terrasse, végétation, cascade et jacuzzi avec cheval chromé. Orbite et zoom, objets cliquables, jets, fête, jour/nuit et bond du cheval ; gestes partagés (danse, coucou) et ambiance locale. Caméras animées, navigation par clic ou clavier, illustration de repli. Les scènes Three.js sont chargées à la demande et arrêtées hors écran ou en arrière-plan.
- Onze cartes holographiques à retourner avec les contributions par prénom. 60 avatars kawaii libres et 6 avatars exclusifs à gagner dans l’Arcade, ou image HTTPS personnalisée. Vestiaire partagé : chapeaux, lunettes, bouée, positions réglables par glissement ou flèches, poignées de redimensionnement de 50 à 180 %, proportions libres ou verrouillées et rotation directe, recentrage, danses au survol et réactions aux votes. Animations désactivables et respect du mouvement réduit.
- Salle de cinéma 3D pour chaque séance retenue : les personnes qui confirment leur présence prennent place avec leur avatar et leurs accessoires. Les votes ne valent jamais confirmation de présence.
- Cinéma : sélection en premier, Tous les films par défaut, tri par likes, recherche TMDB rapide en français, affiches, année, genres, durée, réalisation. Aucun synopsis ni bande-annonce. Ajout manuel possible.
- Votes pour/neutre/contre avec détail nominatif : un seul vote par prénom et par proposition ou créneau. Changer d’avis remplace le précédent choix. La casse, les espaces autour du prénom et les variantes Unicode équivalentes sont normalisés.
- Planning en tête de la page Programme, visible du 24 au 27 septembre, avec quatre colonnes larges. Déplacement des activités par poignée (souris, doigt, clavier ou sélection du jour), en conservant heure et durée. Les jours précédents restent stockés. Une modification concurrente annule le déplacement.
- Activités : nom, lien HTTP(S), créneau et alternatives horaires soumises au vote. Suggestions Escape Game et Karting.
- Tout le crew peut modifier le nom, le lien, l’emoji et les horaires des activités, ainsi que les créneaux des rendez-vous retenus. Votes, discussions et présences sont conservés. Les modifications concurrentes sont signalées.
- Emoji suggéré selon le nom pour chaque activité, modifiable et partagé. Visible dans le planning, les cartes, les fiches et les affiches.
- Fiches pratiques : tarif, adresse, trajet, capacité, conditions et notes. La durée vient du créneau ; les informations inconnues restent inconnues.
- Discussions chronologiques sur chaque proposition, avec brouillon conservé en cas d’erreur.
- Plans retenus avec créneau explicite, compte à rebours d’annonce, lien partageable, affiche PNG et confirmations de présence distinctes des votes.
- Boîte à idées partagée : propositions de fonctionnalités, votes pour/neutre/contre avec détail nominatif, commentaires et suppression confirmée avec nettoyage des votes/messages liés.
- QG vivant : avatars synchronisés toutes les 5 secondes, déplacements entre les pièces, promenade, position assise et bain. Heartbeat de 15 secondes, expiration après 60 secondes ; les onglets masqués ne sollicitent pas la présence.
- Prochaine activité en aperçu sur l’accueil, avec horaire et compte à rebours. Les rendez-vous retenus ont priorité sur le créneau initial de la même activité.
- Classement des 11 membres par votes et accessoires à 3, 7, 12, 20 et 34 votes. Le record est permanent ; changer un vote ne multiplie pas les points. Les votes existants sont repris. Page Récompenses avec collection, paliers et replay de chaque animation ; les succès non vus se révèlent à la visite, avec suivi local par prénom/appareil.
- Cookie Jacuzzi : 10 bâtiments, achats ×1/×10/×100, 20 améliorations, 12 objectifs rémunérés et 30 succès permanents. Bonus doré, production hors ligne limitée à 8 h et prestige cumulatif (+10 % par étoile). Six avatars gourmands à débloquer, révélations automatiques et replay. Sauvegarde serveur par prénom, requêtes idempotentes et reprise des actions en attente sur le même navigateur.
- Classement Cookie indépendant : podium, cookies produits au total, clics, prestige et position personnelle ; tri par production historique, puis clics et prénom. Les dépenses et prestiges ne font pas baisser le score. Les trophées de votes restent dans Récompenses ; succès et avatars du jeu restent dans Arcade.
- Badge DEV exclusif à Alex, y compris dans les scènes 3D.
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
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0007_fluffy_stingray.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0008_strange_slayback.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0009_secret_sway.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0010_amused_blue_marvel.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0011_old_war_machine.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0012_giant_redwing.sql
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
node scripts/verify-immersive.mjs
node scripts/verify-cookie.mjs
```

Le test Cookie utilise uniquement localhost et le prénom de fixture TestCookie : concurrence, reprise idempotente, achats, bonus, production hors ligne, prestige, avatars verrouillés et classement.

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

Les accessoires du vestiaire (dont la bouée) se choisissent dans trois catégories : chapeaux, lunettes et accessoires. Chaque élément peut être déplacé et redimensionné de 50 à 180 %. Les anciens looks sont conservés. Les emojis des accessoires, activités et affiches utilisent les mêmes SVG Twemoji sur tous les systèmes, y compris dans le cinéma 3D.

Le cinéma propose un accès au catalogue en tête de page. Depuis la fiche d’un film déjà ajouté, tout membre peut le supprimer après confirmation ; ses votes, messages, séances et présences liées sont retirés dans la même transaction. Les statistiques des cartes du crew sont affichées explicitement, indépendamment du support des faces 3D du navigateur.

« Tous les films » est le filtre initial, trié par nombre de votes positifs décroissant (titre comme départage). « Mes favoris » ne montre que les films aimés par le prénom sélectionné.
