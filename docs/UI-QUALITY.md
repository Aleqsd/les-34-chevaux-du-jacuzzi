# Vérification UI — v27

Correctif ciblé sur les interactions et les débordements, sans modification des règles de jeu, des catalogues ou des données enregistrées.

## Corrections

- Le bouton de fermeture des notifications de déblocage reçoit les clics ; le reste de la notification laisse passer les interactions du jeu.
- Les commandes de talents restent dans leur carte à 320 px, avec des boutons de 44 px.
- La largeur intrinsèque des cartes d'avatars chargées à la demande ne force plus la galerie à dépasser sur téléphone ou tablette.
- Les trois cercles de l'aperçu rythmique restent séparés, indépendamment de la piste sélectionnée.
- La piste jouable et son HUD tiennent entièrement dans le dialogue en petit paysage, sans défilement pendant la partie.
- Le lancement d'un défi après un entraînement affiche immédiatement le bon mode.
- Un lancement ou résultat refusé définitivement affiche une erreur et permet un nouveau défi. Une tentative en attente après une panne réseau reste conservée et réutilise son UUID.
- Les boutons des révélations restent accessibles par défilement sur les écrans de faible hauteur.
- Le passage d'un seuil d'avatar transmet immédiatement la progression au vestiaire.
- L'enregistrement du profil a un délai réseau de 15 secondes, après lequel l'erreur rend les commandes à nouveau disponibles.
- La navigation principale revient en haut de page aussi lorsque les animations sont réduites.

## Validation locale

- Recettes, Maîtrise, Horizons, Objectifs, Prestige, Avatars et Rythme : contrôle des débordements à 320, 768 et 1440 px. Galerie corrigée puis revérifiée aux deux tailles affectées.
- QG, Cinéma, Programme, Idées et Récompenses : contrôle à 320 et 1440 px ; aucun débordement global ni erreur JavaScript observé pendant cette passe.
- Atelier en plein écran : téléphone, tablette et bureau ; accès aux achats par défilement. Le navigateur de test utilise le repli immersif, le plein écran natif n'y étant pas disponible.
- Piste rythmique à 568 × 320 : arène entière visible, hauteur du contenu égale à celle du dialogue. Après une erreur simulée, un nouveau défi termine avec 64 notes touchées, combo 64 et résultat sauvegardé (99,8 %).
- Erreur réseau simulée au lancement : nouvelle tentative et nouvelle requête distinguent correctement refus définitif et panne temporaire ; le retry de la panne conserve le même UUID.
- Conflit réel de cycle reproduit côté serveur local avant le lancement, puis pendant une partie : le refus est affiché, le joueur est resynchronisé et le bouton relance immédiatement un nouveau défi.
- Révélation à 667 × 375 : accès au bouton de confirmation auparavant coupé.
- Nouveau compagnon : passage de 99 à 100 cookies, ouverture du vestiaire environ une seconde après la réponse du clic, avatar Mochi pêche déjà disponible.
- Sauvegarde de profil suspendue simulée dans le navigateur : erreur de délai, bouton Enregistrer réactivé et dialogue refermable. Aucun profil envoyé au serveur par ce test.
- Notification de déblocage fermée par clic réel ; navigation depuis une position basse avec mouvement réduit vérifiée à `scrollY = 0`.
- TypeScript, 98 vérifications du rythme et 18 vérifications des achats groupés réussies. Les tests de navigateur n'utilisent que l'identité jetable Test UI sur localhost.

Ces contrôles ciblent les défauts reproduits ; ils ne constituent pas une garantie d'absence de bugs sur tous les appareils.
