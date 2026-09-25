# Rythme du jacuzzi

Quatre pistes originales de 64 cercles numérotés, avec anneaux d'approche, trajectoires et mélodies distinctes :

| Piste | Tempo | Difficulté |
| --- | --- | --- |
| Balade des bulles | 90 BPM | Découverte |
| Groove du jacuzzi | 110 BPM | Intermédiaire |
| Pluie de météores | 145 BPM | Difficile |
| Supernova | 174 BPM | Expert |

Chaque piste propose un entraînement à 70 % de sa vitesse et un défi : au moins 82 % de précision, au maximum 8 ratés. Notes 100/85/50/0 aux fenêtres 80/145/210 ms ; une frappe hors cible retire un point de précision. Aucun coût ni délai entre les essais.

Une victoire accorde +25 % de production et de rendement des clics manuels/automatiques pendant 24 heures réelles. Le bonus ne se cumule pas et n'est pas prolongé tant qu'il est actif ; il survit au prestige. Les records de précision, victoires et combos sont mémorisés par piste, en plus du bilan global.

Le serveur fixe la piste au lancement, vérifie l'identité de la partie, sa durée et le replay borné, puis persiste le résultat avec les reçus UUID existants. Les anciennes parties et requêtes sans piste restent compatibles avec le Groove historique inchangé ; l'ancien record est attribué une seule fois à cette piste. La validation porte sur les règles du jeu, pas sur l'authenticité humaine des entrées.

Validation locale : `COOKIE_TEST_URL=http://localhost:5173 node scripts/verify-rhythm.mjs` (syntaxe shell POSIX ; définir la variable séparément dans PowerShell).
