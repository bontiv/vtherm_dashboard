# Proposal

## Why
L'exigence « Contexte des composants de configuration » de la spec `ui-plugin-sdk` dit qu'un composant des hooks `general_config` et `thermostat_config` « ne SHALL pas écrire lui-même dans la configuration de Home Assistant : l'enregistrement est assuré par le dashboard ». Le dashboard passe par le brouillon et la commande `vtherm_dashboard/save_config`, qui écrit dans l'entrée de configuration du thermostat.

Cette règle convient aux onglets natifs, dont les paramètres vivent dans l'entrée de configuration de Versatile Thermostat. Elle ne convient pas à un plugin tiers dont les paramètres vivent ailleurs, par exemple dans les entités de son propre plugin : son onglet n'a pas le droit d'écrire lui-même, donc il ne peut pas se placer là où l'utilisateur cherche le réglage.

La règle voulue : les composants des plugins natifs (`core*`) passent par le brouillon et le dashboard. Les composants des autres plugins sont libres d'écrire leurs données comme ils veulent.

## What Changes
- **Spec `ui-plugin-sdk`** : l'exigence « Contexte des composants de configuration » ne garde l'interdiction d'écrire que pour les composants contribués par un plugin natif (identifiant commençant par `core`, réservé par `core-native-plugins`). Un composant d'un autre plugin peut écrire par ses propres moyens (service de Home Assistant, commande WebSocket de son plugin, entités). Le contexte transmis ne change pas : le brouillon et ses commandes restent disponibles pour qui veut les utiliser.
- Le brouillon et `save_config` ne sont ni retirés, ni modifiés : un onglet tiers qui écrit en dehors d'eux n'est pas compris dans l'état « modifié » du brouillon ni dans l'enregistrement du dashboard.
- Une vérification automatique garantit que les composants de configuration natifs n'écrivent pas eux-mêmes.
- Documentation : le guide de développement de plugins dit que cette interdiction ne concerne que les plugins natifs et explique ce qu'un onglet tiers qui écrit lui-même doit gérer.
- Aucun changement des types du SDK, aucun changement Python, aucune rupture pour les plugins existants.

## Capabilities

### New Capabilities

### Modified Capabilities
- `ui-plugin-sdk`: l'exigence « Contexte des composants de configuration » : l'interdiction d'écrire ne vaut que pour les composants des plugins natifs.

## Impact
- `openspec/specs/ui-plugin-sdk/spec.md` (via le delta de ce change).
- Un test Vitest sous `frontend/test/` qui parcourt les composants de configuration natifs.
- `docs/plugins/plugin-development.md` (section sur le brouillon et le contexte des composants de configuration), `CHANGELOG.md` (section « For plugin authors »).
- Aucun code Python, aucun changement de l'API du SDK.
