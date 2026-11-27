# Design

## Context
- Les hooks `general_config` et `thermostat_config` donnent à un composant `hass`, les valeurs courantes, les erreurs de validation, un moyen de proposer des modifications du brouillon et l'état du brouillon avec ses commandes.
- La commande `vtherm_dashboard/save_config` enregistre le brouillon dans l'entrée de configuration du thermostat, puis applique les presets.
- `core-native-plugins` impose que les plugins natifs utilisent les mêmes mécanismes que les plugins tiers et réserve les identifiants `core*` aux plugins natifs.
- Rien n'empêche aujourd'hui, techniquement, un composant d'appeler `hass.callService` ou `hass.callWS` : l'interdiction n'existe que dans la spec.

## Goals / Non-Goals
**Goals:**
- Les composants de configuration natifs continuent de passer par le brouillon.
- Un composant d'un plugin tiers peut écrire ses données comme il veut.

**Non-Goals:**
- Aucune API nouvelle pour que des paramètres hors entrée de configuration (entités d'un plugin) passent par le brouillon.
- Aucune intégration des écritures tierces à l'état « modifié » du brouillon ni au bouton d'enregistrement du dashboard.
- Aucun changement de `save_config`.

## Decisions

### La frontière est l'identifiant du plugin
Même choix que pour les widgets (`allow-plugin-widget-commands`) : la réservation existante des identifiants `core*` sépare les plugins natifs des autres. Alternative écartée : une déclaration (`ownsPersistence: true`) sur la contribution. Elle ajouterait une API à maintenir pour une règle que le dashboard ne vérifie pas à l'exécution.

### Pas d'application à l'exécution pour les composants tiers
Le dashboard n'enveloppe ni ne bloque `hass`. Alternative écartée : intercepter les appels pour les composants natifs, car un test statique couvre l'erreur d'un auteur du dépôt à moindre coût.

### Le brouillon reste facultatif
Un onglet tiers qui écrit lui-même ne participe pas au brouillon. Il est responsable de son propre état (valeur affichée après écriture, erreur, annulation). Le dashboard ne l'affiche pas comme « modifié » et son écriture n'est pas annulée par la commande d'annulation.

### Vérification des composants natifs par un test
Un test Vitest parcourt les sources des composants de configuration des plugins `core*` et échoue s'ils contiennent un appel d'écriture direct (`callService`, ou `callWS` avec un type d'écriture). L'emplacement exact de ces composants sous `frontend/src/native/` est à confirmer à l'implémentation ; le test s'adapte à la structure réelle. Les appels de lecture et l'appel du dashboard à `save_config` restent permis.

## Risks / Trade-offs
- Un onglet tiers peut écrire sans que l'état du dashboard le sache (pas de « modifié », pas d'annulation, pas de partage de l'erreur d'enregistrement) → acceptable : l'auteur choisit entre le brouillon et sa propre écriture, et la documentation décrit la différence.
- Le test statique peut manquer une écriture passée par une aide partagée → il liste aussi les aides communes d'écriture.
