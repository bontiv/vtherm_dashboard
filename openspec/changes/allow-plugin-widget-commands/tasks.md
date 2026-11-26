# Tasks

## 1. Garde-fou et vérification

- [ ] 1.1 Ajouter un test Vitest sous `frontend/test/` qui parcourt les composants de widgets des plugins natifs (`core*`) et échoue s'ils contiennent `callService` ou une aide de commande commune ; vérifier qu'il passe sur le code actuel et qu'il échoue sur un widget natif de test qui appelle un service
- [ ] 1.2 Ajouter un test du harnais de widgets (`packages/sdk/src/testing.ts`) : un widget de plugin tiers qui appelle `hass.callService` voit l'appel émis sans blocage ; vérifier que le test passe

## 2. Documentation

- [ ] 2.1 Corriger les conventions des widgets dans `docs/plugins/hooks-and-placement.md` et `docs/user/dashboard.md` : les widgets natifs sont en lecture seule, un widget de plugin tiers peut écrire (avec un rappel sur la responsabilité de l'auteur) ; vérifier `npm run check:docs`
- [ ] 2.2 Ajouter l'entrée de `CHANGELOG.md` (section « For plugin authors ») ; vérifier `npm run check:docs`

## 3. Vérification d'ensemble

- [ ] 3.1 Lancer les tests du dépôt (frontend et SDK) et les vérifications de documentation ; vérifier qu'ils passent

## Workflow follow-up
- À l'archivage, corriger le Purpose de `openspec/specs/overview-widgets/spec.md` (la lecture seule ne concerne que les widgets natifs).
