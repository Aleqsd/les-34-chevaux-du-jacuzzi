# Progression après 10³⁰ — v26

Le catalogue actuel compte **47 bâtiments, 225 recettes, 98 objectifs permanents, 162 succès et 78 avatars à gagner** (en plus des 60 avatars libres). La progression jouable atteint **10¹²⁰** ; le garde-fou numérique fini est placé à `1e150`, avec trente ordres de grandeur de réserve.

Après les chapitres de l'Aube ajoutés en v25 jusqu'à `1e90`, la v26 ajoute trois chapitres, dix bâtiments aux indices 37 à 46, cinquante recettes, vingt objectifs et vingt-sept succès. Les anciens IDs, indices, seuils et rendements restent inchangés.

- Les rivages du possible : Chambre des échos, Marée de lumière, Boussole des ailleurs.
- Les mondes à inventer : Atelier des songes éveillés, Verger des lendemains, Cathédrale des aurores, Océan des éternités.
- Le jubilé des 34 : Atlas des impossibles, Sanctuaire des 34, Jubilé du jacuzzi.

Les dix accès historiques vont de `1e93` à `1e120`, par facteurs de mille, avec des prix de base de `5e91` à `5e118`. Chaque bâtiment reçoit trois recettes de doublement (10/25/50 exemplaires) et deux synergies avec les précédents. Ces recettes entrent aussi dans l'achat groupé et les conseils de l'atelier.

**48 nouveaux avatars** répartis en quatre planches originales (cosmos, océan, forêt et pâtisserie) remplissent les intervalles de progression de `1e19` à `1e120`. Les indices 90 à 137 sont ajoutés sans déplacer les anciens. La galerie trie par seuil et propose Tous, Nouveautés, À débloquer et Débloqués ; le compagnon automatique suit le plus haut seuil atteint.

La compatibilité avec le modèle v25 est vérifiée par `node scripts/verify-jubilee.cjs` : préfixes de catalogues, anciennes sauvegardes, calculs de gains, achats, conseils et franchissement du précédent plafond. Les tests API décrits ci-dessous couvrent aussi l'extension.

## Historique de l'extension v23

Le plafond monétaire passe de `1e30` à `1e120`, une borne technique finie pour la sérialisation JSON. Les chapitres jouables vont jusqu’à `1e60`. Aucune migration SQL ni remise à zéro : les nouveaux bâtiments occupent les indices 16 à 26, ajoutés après les seize existants. Tous les anciens catalogues sont conservés en préfixe, y compris les recettes et leurs conditions.

Trois chapitres ajoutent onze bâtiments, trois recettes de production et deux synergies chacun. Leurs accès historiques s’étendent de `1e30` à `1e60` par facteurs de 1 000. Les prix commencent à `5e28` et suivent la même progression. Les productions augmentent environ comme la racine du seuil, pour tenir compte du prestige croissant. Les anciens rendements ne changent pas.

- Matière impossible : Forge d’antimatière, Rucher quantique, Verger des possibles, Bibliothèque des univers.
- Fabrique des réalités : Métier à constellations, Cœur des dimensions, Océan primordial, Horloge de l’infini.
- Banquet des origines : Jardin des réalités, Couronne des multivers, Banquet des origines.

Les 55 nouvelles recettes, 22 objectifs permanents et 26 succès utilisent de nouveaux IDs. Les synergies renforcent le bâtiment cible de 0,2 % par exemplaire source, jusqu’à 50 % par recette avant maîtrise. Les recettes de production doublent aux paliers 10, 25 et 50. Horizons propose un filtre par chapitre ; les nouvelles recettes ont une catégorie « Après 10³⁰ ».

Au-delà de la précision des étoiles individuelles, la prévision du prochain prestige affiche un palier de +10 % d’étoiles. Les grands multiplicateurs utilisent la notation scientifique. Les limites de 1 000 bâtiments, clics manuels, pilote et production hors ligne restent inchangées.

Les gains déjà écrêtés par l’ancienne version ne sont pas reconstitués : les sauvegardes ne permettent pas de les mesurer. Les prochaines productions dépassent normalement `1e30`.

Vérification locale : `COOKIE_TEST_URL=http://localhost:5173` puis `node scripts/verify-cookie.mjs`, `node scripts/verify-contracts.mjs`, `node scripts/verify-horizons.mjs` et `node scripts/verify-multiverse.mjs`, successivement. Les tests ne touchent qu’à leurs identités temporaires sur localhost. Le helper SQLite réessaie uniquement les blocages transitoires, sans ignorer les autres erreurs ni les assertions.
