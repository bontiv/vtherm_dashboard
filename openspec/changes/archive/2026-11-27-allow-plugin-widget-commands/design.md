# Design

## Context
- La spec `overview-widgets` impose « Affichage seul » à tous les widgets (appel de service interdit, aucun bouton de commande).
- `overview-foundation` (archivé) justifie seulement cette règle par « première version en affichage seul ».
- `core-native-plugins` impose que les plugins natifs soient enregistrés par les mêmes mécanismes que les plugins tiers, sans privilège, et réserve les identifiants commençant par `core` aux plugins natifs.
- Un widget reçoit déjà l'objet `hass` complet (`thermostat_widget` et `global_widget`), donc `hass.callService` est techniquement disponible pour tous.

## Goals / Non-Goals
**Goals:**
- Les widgets natifs restent en lecture seule.
- Un widget d'un plugin tiers peut appeler un service et dessiner des commandes.

**Non-Goals:**
- Aucun widget de commande natif.
- Aucune capacité, permission ou confirmation imposée par le dashboard aux widgets tiers.
- Aucun changement des types du SDK.

## Decisions

### La frontière est l'identifiant du plugin, pas un indicateur de widget
La règle s'appuie sur la réservation existante des identifiants `core*` pour les plugins natifs. Alternative écartée : un champ `writable: true` sur la contribution. Il ajouterait une API et une validation à maintenir pour une règle qui ne concerne que les widgets natifs, et le dashboard ne vérifierait pas son exactitude.

### Aucune application à l'exécution pour les widgets tiers
Le dashboard ne bloque ni n'enveloppe `hass.callService`. Un widget tiers s'exécute avec les droits de l'utilisateur de Home Assistant, comme tout plugin UI aujourd'hui. Alternative écartée : intercepter `callService` pour les widgets natifs seulement. C'est une protection contre une erreur des auteurs du dépôt, qu'un test statique couvre à moindre coût.

### Vérification des widgets natifs par un test
Un test Vitest parcourt les sources des composants de widgets natifs (plugins `core*`) et échoue s'ils contiennent `callService` ou un bouton de commande. L'emplacement exact de ces composants (probablement `frontend/src/native/` et `frontend/src/components/overview/`) est à confirmer à l'implémentation ; le test s'adapte à la structure réelle.

## Risks / Trade-offs
- Un widget tiers peut écrire sans confirmation du dashboard → acceptable, car le plugin est installé par l'administrateur ; la documentation le rappelle aux auteurs.
- Le test statique peut manquer un appel indirect (service appelé via une aide partagée) → il cherche aussi les aides communes de commande.
