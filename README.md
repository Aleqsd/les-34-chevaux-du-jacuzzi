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
- Cookie Jacuzzi : 10 bâtiments, achats ×1/×10/×100, 20 améliorations, 12 objectifs rémunérés et 30 succès permanents. Bonus doré, production hors ligne limitée à 8 h et prestige cumulatif (+10 % par étoile). Six avatars gourmands à débloquer, notifications de déblocage non bloquantes (par lots de trois, sans interception des clics) et replay volontaire en grand. Icônes propres aux 10 bâtiments, 20 recettes et 30 succès ; recettes dans leur onglet dédié, prix toujours affichés. Sauvegarde serveur par prénom, requêtes idempotentes et reprise des actions en attente sur le même navigateur. Les achats attendent la sauvegarde en cours sans désactiver la boutique pendant les clics. Chaque clic ajoute 10 % de la production par seconde, puis 20 % et 35 % avec les recettes dédiées ; les bonus de base ×2 et ×3 arrivent dès 25 et 100 clics.
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

### Arcade v12

Le bouton Plein écran masque la navigation et utilise le plein écran natif lorsqu’il est disponible ; un mode immersif prend le relais sinon. Quitter le plein écran ou Échap ramène au site, sans recréer la partie.

Cookie Groove est une boucle originale synthétisée localement à 118 BPM : désactivée par défaut, volume réglable, pause quand l’onglet est masqué et arrêt à la sortie de l’Arcade. Aucune piste externe n’est téléchargée.

Le pilote automatique se débloque à 2 000 clics (2/s), puis 5 000 (4/s), 15 000 (6/s) et 50 000 (10/s). Son interrupteur est désactivé par défaut. Il fonctionne uniquement dans l’Arcade au premier plan ; les clics automatiques comptent pour les paliers et les succès. Le serveur limite le débit par joueur, y compris entre plusieurs onglets. Les paliers sont permanents.

### Préserver les progressions et publier

Ne jamais réinitialiser la base en publiant. Garder les identifiants de recettes, bâtiments, succès, avatars et les clés de sauvegarde ; les évolutions de données doivent accepter les anciennes parties. Les actions en attente conservent leur UUID et sont rejouées sans double crédit. Les clics en attente sont envoyés au masquage ou à la sortie et conservés localement pour réessayer si nécessaire.

Avant chaque modification de persistance : exécuter `node scripts/backup-progress.mjs`, puis les tests `node scripts/verify-cookie.mjs` sur localhost. La copie JSON vérifiée par SHA-256 reste dans le dossier ignoré `.sites-runtime/backups`. C’est une sauvegarde logique des données accessibles par les API, sans les reçus d’actions ni une garantie de cohérence transactionnelle ; elle ne remplace pas la base active. Toute restauration doit d’abord être validée dans une base isolée. Ne jamais publier ces fichiers sur GitHub.

Le numéro du pied de page vient de la version de package.json. Le build enregistre automatiquement la date et l’heure de préparation dans lib/site-release.json ; affichage en heure de Paris, identique pour tous les visiteurs. Incrémenter la version avant toute nouvelle publication.

### Arcade v13

Le plein écran utilise trois panneaux sur les grands écrans : cookie, bonus/pilote et production. La boutique défile indépendamment ; réserve et rendements restent dans la barre supérieure, y compris dans les recettes. Mobile et très petites hauteurs gardent un défilement de page simple.

Trois surprises traversent ponctuellement l’écran : Comète sucrée, Biscuit express et Cadeau du crew. Un passage toutes les 90–180 secondes après récolte/expiration ; 22 secondes visibles avec 2 secondes de tolérance réseau. Le serveur valide chaque récolte et la déduplique. La récompense dépend de la production de base, sans multiplier le bonus de fournée. Les événements manqués ne génèrent rien hors ligne. Le champ de sauvegarde nextEventAt est optionnel et initialisé uniquement par POST, jamais par GET.

Les événements ont un tintement à l’arrivée et un jingle à la récolte. Le bouton cloche coupe ces effets indépendamment de la musique ; le navigateur attend une interaction avec le jeu pour autoriser le son. En mode animations réduites, le bonus reste immobile.

La playlist originale contient Biscuit cosmique, Caramel disco, Jacuzzi néon et Goûter tropical. Elle change après quatre boucles de 16 mesures, soit toutes les 2 à 2 min 15 selon le tempo. Le morceau en cours est affiché ; une pause fige la rotation. La musique reste désactivée par défaut.
