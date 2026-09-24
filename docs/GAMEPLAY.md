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

## Vérifier une modification

- `node scripts/verify-cookie.mjs` compare aussi le modèle au commit précédent.
- `node scripts/verify-contracts.mjs` couvre les sources de progression, spécialisations, changements d’onglet concurrents, signatures/réclamations UUID et conservation au prestige.
- Les suites doivent tourner séquentiellement, sans joueur navigateur actif sur la même base locale, pour éviter les verrous SQLite de l’outil de test.
- Tester l’interface avec des prénoms de fixture locaux, puis nettoyer uniquement ces prénoms. Ne jamais faire de fixture dans la base publique.
- Avant publication : sauvegarde logique privée, TypeScript, suites pertinentes, vérification mobile et plein écran, build et version datée.

Les règles ci-dessus décrivent le jeu, pas une promesse de revenu ou de durée universelle : achats, rythme des clics et bonus changent fortement les parcours.
