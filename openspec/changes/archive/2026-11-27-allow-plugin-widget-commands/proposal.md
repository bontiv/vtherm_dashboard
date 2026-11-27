# Proposal

## Why
L'exigence « Affichage seul » de la spec `overview-widgets` interdit à **tout** widget d'appeler un service de Home Assistant et de dessiner un bouton de commande. Elle vient du change `overview-foundation`, dont le design range les commandes dans les non-objectifs au motif « première version en affichage seul ». Aucune raison technique ou de sécurité n'est donnée, et la règle ne distingue pas les widgets natifs des widgets de plugins tiers.

Conséquence : un plugin tiers ne peut pas contribuer un widget qui écrit (par exemple un widget qui change un paramètre). La règle voulue est plus étroite : seuls les widgets des plugins natifs (`core*`) restent en lecture seule. Les widgets des autres plugins sont libres.

## What Changes
- **Spec `overview-widgets`** : l'exigence « Affichage seul » ne vaut plus que pour les widgets contribués par un plugin natif (identifiant commençant par `core`, réservé par la spec `core-native-plugins`). Un widget contribué par un autre plugin peut appeler les services de Home Assistant et dessiner des commandes.
- Le dashboard n'impose aucune restriction d'exécution aux widgets des plugins tiers : le SDK n'ajoute ni capacité à déclarer ni filtre sur `hass.callService`.
- Une vérification automatique garantit que les widgets natifs n'appellent aucun service.
- Documentation : les conventions des widgets (`docs/plugins/hooks-and-placement.md`, `docs/user/dashboard.md`) disent que la lecture seule concerne les widgets natifs, et qu'un widget de plugin tiers peut écrire.
- Le Purpose de `overview-widgets` (« en lecture seule, par des widgets contribués par les plugins ») est corrigé à l'archivage.
- Aucun widget natif ne change, aucune rupture pour les plugins existants.

## Capabilities

### New Capabilities

### Modified Capabilities
- `overview-widgets`: l'exigence « Affichage seul » ne vaut que pour les widgets des plugins natifs ; un widget d'un plugin tiers peut écrire.

## Impact
- `openspec/specs/overview-widgets/spec.md` (via le delta de ce change).
- Un test Vitest sous `frontend/test/` qui parcourt les widgets natifs.
- `docs/plugins/hooks-and-placement.md`, `docs/user/dashboard.md`, `CHANGELOG.md` (section « For plugin authors »).
- Aucun code Python, aucun changement de l'API du SDK.
