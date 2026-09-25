# Cookie Jacuzzi — progression et équilibre

Les parties existantes sont la référence. Identifiants, statistiques, succès, avatars, améliorations achetées et reçus de requête ne sont jamais réinitialisés lors d’une mise à jour.

## Un prestige qui redémarre

Les étoiles utilisent toujours la formule historique : `floor(sqrt((banked + runEarned) / 1e9)) - prestige`. Chaque étoile ajoute 0,1 au multiplicateur de base. Le gain relatif affiché est `nouvelles étoiles / (étoiles actuelles + 10)` : passer de 100 à 101 étoiles apporte environ +0,9 % à atelier et recettes identiques.

Après un prestige, bâtiments et recettes repartent à zéro, comme auparavant. Le joueur reçoit maintenant une réserve de départ `min(1 000 000, floor(250 × (1 + étoiles × 0,1)))` et six objectifs propres à la fournée :

| Objectif courant | Prime de base |
|---|---:|
| 5 bâtiments | 500 |
| 1 recette | 500 |
| 25 bâtiments | 12 500 |
| 5 recettes | 25 000 |
| 50 bâtiments | 50 000 |
| 100 bâtiments | 250 000 |

Primes multipliées par `min(10, 1 + étoiles × 0,1)`, puis arrondies vers le bas. Ces aides augmentent seulement la réserve dépensable : ni production historique, ni score, ni progression de prestige. Elles ne peuvent donc pas donner directement des étoiles en boucle.

Les joueurs ayant déjà fait un prestige reçoivent l’aide une fois pour leur fournée actuelle, sans effacer quoi que ce soit. Les six objectifs lisent les bâtiments et recettes de l’atelier courant, jamais les records historiques. Les réclamations portent le numéro de fournée pour écarter les demandes d’un ancien onglet.

## Contrats

Déblocage à un million de cookies historiques. Trois voies sont disponibles, un seul contrat actif, aucune expiration. Les cibles et primes sont calculées après le règlement de la production déjà écoulée, puis figées à la signature.

`R = max(1, production de base + vitesse du pilote débloquée × gain normal d’un clic automatique)`

Le rush et le bonus manuel de l’Artisan sont exclus de R. Le pilote local peut être désactivé : la référence utilise sa vitesse débloquée, connue du serveur.

| Voie | Nouvelle progression demandée | Prime |
|---|---:|---:|
| Produire | ceil(600 × R) cookies | floor(60 × R) |
| Investir | ceil(600 × R) cookies dépensés | floor(60 × R) |
| Chasser | 2 surprises volantes attrapées | floor(30 × R) |

Production : fours, clics manuels et automatiques après signature. Les primes, cadeaux forfaitaires et bonus immédiats du cookie doré sont exclus. Le rush accélère bien la production réelle.

Investissement : montant effectivement payé, remise comprise, bâtiments et recettes. Aucun progrès pour un achat refusé. Chasse : événements volants acceptés par le serveur, pas le bouton doré.

Une signature toutes les 20 minutes au maximum. Le délai part de la signature, reste après un abandon, et ne constitue pas une réserve de contrats accumulée hors ligne. La prime finance uniquement les achats. Un contrat achevé demeure réclamable; si la réserve est au plafond, il reste disponible jusqu’à ce qu’il y ait de la place.

Les contrats actifs, leurs progrès, leurs délais et le parcours acquis survivent au prestige. Une cible devenue peu adaptée peut être abandonnée. Chaque contrat porte un cycle monotone; réclamation et abandon exigent cet identifiant. Un ancien onglet ne peut pas toucher le contrat suivant.

## Trois écoles

Choix à partir d’une étoile. Aucun choix automatique pour une ancienne sauvegarde. Un changement gratuit toutes les 20 minutes.

| École | Effet exact |
|---|---|
| Architecte | −8 % sur les bâtiments, avant arrondi du prix du lot. Recettes inchangées. |
| Artisan | +25 % au gain du clic manuel. Puissance et cadence du pilote inchangées. |
| Veilleur | Plafond de production hors ligne de 12 h au lieu de 8 h. Aucun clic automatique hors ligne. |

Les gains écoulés sont réglés avec l’ancienne école avant un changement. Choisir Veilleur au retour ne récupère pas rétroactivement quatre heures de production.

## Parcours permanent

Sceaux à 1, 5, 20, 60 et 150 contrats réclamés, avec cadres du compagnon et succès rejouables. Succès supplémentaires pour 3 puis 10 contrats de chaque voie, et 2 contrats dans chacune des trois écoles. L’école d’un contrat est celle choisie à sa signature : changer juste avant la prime ne change pas son attribution.

Les sceaux sont cosmétiques et n’ajoutent aucun multiplicateur caché. À cadence maximale de signature, 60 contrats représentent au moins 19 h 40 entre première et dernière signature, 150 au moins 49 h 40. Ce sont des minimums théoriques, pas une estimation du temps réel nécessaire pour les terminer.

## Horizons — version 17

Les dix bâtiments, quarante recettes et tous les identifiants historiques restent à leur place. Les anciennes sauvegardes reçoivent uniquement six compteurs de bâtiments à zéro. Aucun reset n’est déclenché. Les nouveaux accès reposent sur la production historique : ils restent ouverts après un prestige et ne demandent pas d’en avoir fait un.

| Nouveau bâtiment | Accès historique | Prix de départ | Production de base / s |
|---|---:|---:|---:|
| Four dimensionnel | 10¹⁴ | 2 × 10¹⁴ | 2 × 10⁸ |
| Écurie stellaire | 10¹⁷ | 3 × 10¹⁶ | 2 × 10¹⁰ |
| Jacuzzi cosmique | 10²⁰ | 5 × 10¹⁸ | 10¹² |
| Chronofour | 10²² | 2 × 10²⁰ | 2 × 10¹³ |
| Haras infini | 10²⁴ | 3 × 10²² | 2 × 10¹⁴ |
| Source des 34 | 10²⁶ | 5 × 10²⁴ | 10¹⁵ |

Chaque bâtiment possède trois recettes de doublement à 10, 25 et 50 exemplaires, et deux synergies. Une synergie ajoute 0,2 % de production du bâtiment cible par bâtiment source, jusqu’à +50 %. Les deux synergies s’additionnent ; elles ne se multiplient pas récursivement. Le catalogue compte donc 16 bâtiments et 70 recettes. Douze objectifs permanents et quatorze succès sont ajoutés ; les derniers paliers de production vont jusqu’à 10²⁸. Les plafonds numériques existants restent inchangés.

Simulation indicative avant publication : un profil avancé synthétique (39 445 étoiles, catalogue historique, pilote 10/s continu, solde initial nul, sans bonus ni nouveau prestige), avec achats gloutons toutes les dix secondes, atteint les accès Jacuzzi/Chronofour/Haras/Source autour de 38 min / 2 h 20 / 6 h 36 / 29 h 28. Ce n’est ni une promesse de durée ni une simulation hors ligne. La stratégie, le solde initial, les prestiges et les bonus changent fortement ces résultats.

### Épreuves de maître

Accès à 10¹² cookies historiques. Une tentative à la fois, avec numéro de tentative monotone. Trois scénarios à règles fixes et économie séparée : trois familles de bâtiments, clic manuel renforcé sans pilote, ou budget initial de 5 000 sans réinvestissement ni clic productif. Les étoiles, écoles, recettes, surprises et pilote du jeu principal n’y interviennent pas. L’atelier principal continue de produire normalement.

L’objectif de l’épreuve mesure uniquement sa production, hors réserve initiale. Chaque scénario a un objectif et des seuils Or/Argent explicites ; toute réussite donne Bronze. Aucun délai d’expiration ne fait perdre une partie. Le temps écoulé continue pendant l’absence et le serveur calcule le moment précis où la production passive franchit l’objectif. Meilleur temps et meilleure médaille ne régressent jamais. Une ancienne action d’un autre onglet ne peut pas toucher une nouvelle tentative.

Bronze débloque le décor du scénario, Argent son halo et Or sa couronne de compagnon. Le décor équipé est enregistré dans la sauvegarde et visible dans l’atelier normal comme en plein écran. Ces récompenses sont cosmétiques. La tentative en cours et les résultats survivent au prestige. Pour « Le dernier panier », une combinaison de quatre cuillères, neuf fours et deux cuisines coûte 4 979 cookies en lots et produit 127/s : le seuil Or de 450 secondes est atteignable.

### Merveille collective

Trois étapes durables, visibles dans Horizons et le QG. Une livraison représente 25 % d’une étape ; il faut quatre prénoms distincts par étape. Le plafond est par prénom normalisé, comme les autres fonctions du site : il ne s’agit pas d’identités authentifiées.

Chaque joueur peut commencer à 1 000 cookies historiques. Sa cible est figée à l’engagement : 600 fois sa production de base plus les gains du pilote débloqué. La production réelle des fours et des clics après engagement compte, y compris hors ligne pour les fours ; les primes, cadeaux et épreuves sont exclus. L’engagement ne prélève pas de cookies. Une livraison est définitive et ne peut pas être répétée, même depuis plusieurs onglets. Si le crew termine l’étape pendant une contribution, elle reste livrable à son étape d’origine et n’est jamais reportée automatiquement sur la suivante.

Contributions et participation active font partie de la sauvegarde D1 de chaque joueur ; la progression collective est calculée depuis ces contributions durables. Pas de nouvelle table ou de migration. Le contrôle de l’étape à l’engagement est également effectué dans la mise à jour atomique. La sauvegarde logique privée inclut ces champs avec les parties.

### Cadence des clics manuels

Le serveur autorise **12 clics/s soutenus**, avec une réserve maximale de **24 clics** pour absorber les envois groupés et les variations de réseau. C’est un quota à recharge continue, pas une fenêtre stricte de 12 clics dans chaque seconde glissante : une courte rafale de 24 est possible, mais ne peut pas être entretenue. Les anciennes réserves de clics sont plafonnées. Les clics excédentaires sont ignorés, sans sanction ni retrait des acquis. Plusieurs onglets partagent le même quota du joueur grâce à la mise à jour atomique et aux reçus UUID. Le pilote garde son propre quota ; les épreuves possèdent une réserve manuelle séparée à la même cadence, sans gains dans l’empire principal.

Le client limite aussi les saisies à 12/s et envoie les clics par lots. Les lots en attente sont repris après une interruption. Le seuil de 12/s est un choix de jeu permissif, pas un détecteur de personne humaine : une macro restant sous le plafond reste possible. À titre de repère, une [étude de tapping manuel (Scientific Reports)](https://www.nature.com/articles/s41598-020-80296-z) rapporte une plage de 3,07–8,43 Hz dans son échantillon ; les gestes et matériels de jeu peuvent différer. Aucun record antérieur n’est réécrit.

## Vérifier une modification

- `node scripts/verify-cookie.mjs` compare aussi le modèle au commit précédent.
- `node scripts/verify-contracts.mjs` couvre les sources de progression, spécialisations, changements d’onglet concurrents, signatures/réclamations UUID et conservation au prestige.
- `node scripts/verify-horizons.mjs` couvre les accès avancés, synergies, quota manuel, épreuves séparées, médailles atteignables, contributions collectives et requêtes concurrentes. `COOKIE_TEST_URL` peut choisir une autre URL de boucle locale uniquement.
- Les suites doivent tourner séquentiellement, sans joueur navigateur actif sur la même base locale, pour éviter les verrous SQLite de l’outil de test.
- Tester l’interface avec des prénoms de fixture locaux, puis nettoyer uniquement ces prénoms. Ne jamais faire de fixture dans la base publique.
- Avant publication : sauvegarde logique privée, TypeScript, suites pertinentes, vérification mobile et plein écran, build et version datée.

Les règles ci-dessus décrivent le jeu, pas une promesse de revenu ou de durée universelle : achats, rythme des clics et bonus changent fortement les parcours.

## Maîtrise et objectifs personnalisés (v18)

Un point de maîtrise par tranche de cinq succès connus et distincts (16 points maximum pour les 82 succès actuels). Les anciens exploits donnent immédiatement leurs points ; aucun succès ni score n’est retiré. Neuf talents à trois rangs dans trois branches, avec deux rangs dans le talent précédent pour accéder au suivant :

| Branche | Talent | Effet par rang |
|---|---|---|
| Synergies | Brigade variée | +0,25 % de production par type de bâtiment actuellement possédé |
| Synergies | Liens renforcés | +10 % à la partie bonus des synergies achetées, plafond augmenté proportionnellement |
| Synergies | Geste du maître | +4 % au clic manuel, sans effet sur le pilote |
| Surprises | Cadeaux généreux | +10 % aux cookies des événements volants |
| Surprises | Or prolongé | +3 s de rush pour le cookie doré et les surprises de rush |
| Surprises | Veille paisible | +1 h de production hors ligne, cumulée avec l’école |
| Reconstruction | Réserve du chef | +50 % à la réserve de départ du prochain prestige |
| Reconstruction | Retour organisé | +25 % aux six primes de reconstruction |
| Reconstruction | Plans réutilisables | −1 % sur les bâtiments, multiplié par la remise Architecte |

Allocation persistante dans le JSON du joueur. Révision monotone attendue : une ancienne action d’un onglet ne remplace pas une allocation plus récente. Le temps écoulé est réglé avec l’ancienne allocation avant changement. Ajouter des rangs est toujours possible avec assez de points ; diminuer un rang exige que le délai de redistribution de 20 minutes soit écoulé. Redistribution gratuite. Les essais restent indépendants et le quota manuel ne change pas.

Réserve de départ réellement offerte et multiplicateur des primes sont figés au début de chaque fournée. Une redistribution ne modifie donc pas les primes déjà proposées. Pour les anciennes fournées sans ces champs, le multiplicateur reste 1. Les aides ne sont jamais comptées comme production, contrats de production, merveille ou gain de prestige.

La carte d’objectif propose une récompense prête, un achat utile, le prochain bâtiment, une recette/synergie ou une prochaine médaille. Estimations de durée hors rush et clics manuels ; pilote inclus seulement s’il est activé. Le choix suivi est enregistré dans D1 avec sa propre révision et reste jusqu’à changement ou retrait. Un objectif de reconstruction devenu périmé après prestige, ou un ancien contrat, cède sa place à une suggestion actuelle. Une recommandation n’effectue jamais d’achat automatiquement.

Chaque bâtiment change visuellement aux quantités 1, 10, 25, 50 et 100 (premier atelier, artisan, expert, légendaire, astral). Les cadres, insignes et repères évoluent dans la boutique et Horizons. Ce stade suit les bâtiments de la fournée et ne donne pas de bonus supplémentaire.

### Performances et validation v18

Arcade, Horizons, Maîtrise et musique sont chargés à l’usage. Les catalogues inactifs ne sont plus construits à chaque rendu. Les listes de recettes/liens par bâtiment sont indexées une fois ; les impacts sont mémorisés pendant les mises à jour d’affichage. L’horloge visuelle est à 500 ms sur ordinateur, 1 s sur mobile, et suspendue en arrière-plan, indépendamment des clics/sauvegardes. Le QG reçoit au maximum une mise à jour de score toutes les cinq secondes (immédiate en cas de prestige). Le catalogue cinéma attend son ouverture ; le chantier ne se synchronise que sur ses surfaces visibles. Le mode léger automatique sur petit écran ou mouvement réduit limite particules et halos.

`node scripts/verify-mastery.mjs` couvre bonus, conservation, anciens profils sans talents, causalité, redistributions, primes figées, essais, recommandations et concurrence HTTP. Les mesures de sa boucle de calcul sont un microbenchmark local, pas une promesse de FPS sur téléphone.


## Tempo du jacuzzi

Arcade → Rythme : 64 cercles sur une piste fixe à 110 BPM (43 secondes), avec clic, tactile ou visée souris + Z/X. Entraînement sur la même piste à 70 % de vitesse, gratuit et sans récompense. Défi : 82 % de précision et au plus 8 ratés. Les fenêtres ±80/145/210 ms donnent 100/85/50 points ; chaque frappe à côté retire un point de précision. Les essais sont illimités. Une victoire sauvegardée accorde +25 % de production et de gains de clic manuel/automatique pendant 24 heures réelles. Le bonus reste après prestige et se combine aux autres bonus ; une nouvelle victoire pendant son activation ne le prolonge pas. Chaque expiration est intégrée séparément à la production hors ligne. Les règles et le score sont vérifiés côté serveur, avec cycle de partie et reçus UUID existants ; aucune migration D1. Changer d’onglet interrompt la partie. La musique d’ambiance se met en pause pendant la piste.
