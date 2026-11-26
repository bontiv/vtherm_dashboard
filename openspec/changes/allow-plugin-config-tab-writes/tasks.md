# Tasks

## 1. Garde-fou et vérification

- [x] 1.1 Ajouter un test Vitest sous `frontend/test/` qui parcourt les composants de configuration des plugins natifs (`core*`, hooks `general_config` et `thermostat_config`) et échoue s'ils contiennent une écriture directe (`callService`, ou `callWS` avec un type d'écriture) ; vérifier qu'il passe sur le code actuel et qu'il échoue sur un composant natif de test qui appelle un service
- [x] 1.2 Ajouter un test du harnais du SDK (`packages/sdk/src/testing.ts`) : un composant d'onglet tiers qui appelle `hass.callService` voit l'appel émis sans blocage et le brouillon reste inchangé ; vérifier que le test passe

## 2. Documentation

- [x] 2.1 Dans `docs/plugins/plugin-development.md`, dire que l'interdiction d'écrire lui-même ne concerne que les plugins natifs, et décrire ce qu'un onglet tiers qui écrit lui-même doit gérer (valeur affichée, erreur, pas d'état « modifié » ni d'annulation du dashboard) ; vérifier `npm run check:docs`
- [x] 2.2 Ajouter l'entrée de `CHANGELOG.md` (section « For plugin authors ») ; vérifier `npm run check:docs`

## 3. Vérification d'ensemble

- [x] 3.1 Lancer les tests du dépôt (frontend et SDK) et les vérifications de documentation ; vérifier qu'ils passent
