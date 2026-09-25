# Voyages, compagnons et achats — v28

## Contenu

Les six destinations du carnet proposent une équipe de un à trois compagnons débloqués, deux décisions puis un retour à récupérer. Les étapes durent entre une et six minutes ; aucune décision n'expire. La récolte est créditée uniquement au retour, une seule fois. Six ingrédients et douze souvenirs sont à collectionner. Les voyages ne créent ni cookies historiques ni étoiles de prestige.

Chacun des 78 compagnons gagnés peut passer d'Éclosion à Éveil, puis à Légende. Deux puis huit retours sont nécessaires, avec un défi personnel de régions explorées, d'ingrédients rapportés ou de passages secrets. Les stades ajoutent des ingrédients aux voyages suivants. La forme légendaire possède un cadre et une animation ; le mode mouvement réduit les désactive. Le compagnon choisi dans le carnet habille l'atelier, sans remplacer le profil social.

Neuf recettes secrètes se découvrent en combinant deux ingrédients. Une seule peut être équipée à la fois : bonus de production ciblée, de clic manuel, de récolte ou de durée du cookie doré. Les effets de récolte et de durée sont capturés lors du lancement du voyage ou de la récolte dorée. Les changements de recette sont gratuits. Une combinaison invalide ne consomme rien.

Trois mondes prolongent la progression de 10¹²³ à 10¹⁴⁷ :

| Monde | Règle |
|---|---|
| Royaume des paradoxes | Choisir les bâtiments extérieurs ×2 ou le bâtiment central ×3 ; changement toutes les 60 secondes. |
| Four des origines | Équilibrer les trois bâtiments : +2 % par trio complet, jusqu'à +100 %. |
| Dernier banquet | Préparer trois services avec des ingrédients pour des multiplicateurs permanents ×1,25, ×1,5 puis ×2. |

Neuf bâtiments, 45 recettes classiques, 18 objectifs et 21 succès sont ajoutés. Les identifiants et rendements historiques restent compatibles. Le carnet, les ingrédients, les recettes secrètes, les évolutions et les services survivent au prestige ; les bâtiments et recettes classiques suivent leur remise à zéro habituelle.

## Achats instantanés et Max All

Les bâtiments, recettes individuelles, achats groupés de recettes et Max All s'affichent immédiatement. Une file sérialisée envoie les achats au serveur avec un UUID stable, un budget et une garde de fournée. Les clics manuels et le pilote ont des créneaux entre les achats. Les actions en attente sont conservées pour reprise ; une erreur définitive annule seulement l'achat concerné.

Les réponses contiennent les reçus des UUID demandés et le périmètre vérifié dans le même lot transactionnel que l'état du joueur. Une confirmation partielle conserve les achats affichés jusqu'à l'intégration atomique d'un état couvrant la file. Aucun revenu rétroactif ni succès n'est attribué par la projection locale.

**Max All se débloque à 10⁷⁵ cookies produits au total**, y compris après prestige. Il parcourt les bâtiments débloqués du plus avancé au plus ancien, achète le maximum possible par type et utilise le budget restant sur les suivants, dans la limite de 1 000 exemplaires par type. Le marchand ne réduit que le premier lot effectivement acheté. Une seule action serveur enregistre tout le plan. Les recettes conservent leur propre bouton « Tout acheter ».

## Stabilité et vérification

Le rail d'actualités garde une hauteur constante, même vide, et accueille aussi les erreurs de connexion. Les dialogues rendent le focus sans déplacer le défilement. Les fenêtres et le carnet restent défilables sur les écrans bas.

- `verify-voyages.cjs` : compatibilité avec v27, catalogue historique, six voyages, 78 évolutions, recettes, mondes et prestige.
- `verify-voyages-api.mjs` : persistance locale, UUID répétés, concurrence, révisions, reçus, budgets et seuil de Max All.
- `verify-purchases.cjs` : achats rapides, budget projeté, réduction marchande, anciennes fournées et plan Max All.
- `verify-cookie.mjs`, `verify-contracts.mjs` et `verify-cookie-buy-recipes.cjs` : régressions de l'économie existante.

Contrôles navigateur sur une identité locale jetable : expédition complète et récolte, création de recette, évolutions, règles des mondes, Max All, trois achats avec réponses retenues, reprise après coupure avec le même UUID, popup depuis une liste défilée, mobile 320/390/768 pixels et fenêtre en paysage 568 × 320. Le plein écran testé dans le navigateur intégré utilise le mode immersif de l'application.
