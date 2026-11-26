## MODIFIED Requirements

### Requirement: Contexte des composants de configuration
Un composant des hooks `general_config` et `thermostat_config` SHALL recevoir `hass`, les valeurs courantes de la configuration éditée, celles de la configuration centrale pour `thermostat_config`, les erreurs de validation de ses champs, un moyen de proposer des modifications du brouillon et l'état du brouillon avec ses commandes (modifié ou non, enregistrement en cours, enregistrer, annuler). Un composant contribué par un plugin natif (identifiant de plugin commençant par `core`) ne SHALL pas écrire lui-même dans la configuration de Home Assistant : l'enregistrement est assuré par le dashboard. Un composant contribué par un autre plugin SHALL pouvoir écrire ses données par ses propres moyens (service de Home Assistant, commande de son plugin, entités) ; le dashboard ne SHALL pas l'en empêcher.

#### Scenario: Modification du brouillon
- **WHEN** un composant propose la modification d'un champ
- **THEN** le brouillon du dashboard est mis à jour et la configuration réelle reste inchangée jusqu'à l'enregistrement

#### Scenario: Erreurs de validation
- **WHEN** l'enregistrement est refusé pour une valeur
- **THEN** le composant concerné reçoit l'erreur associée à son champ

#### Scenario: Configuration générale
- **WHEN** un composant du hook `general_config` est affiché
- **THEN** il ne reçoit pas d'identifiant de thermostat

#### Scenario: État du brouillon
- **WHEN** un composant de configuration propose une modification
- **THEN** il reçoit un état du brouillon marqué comme modifié, et la commande d'annulation remet les valeurs enregistrées

#### Scenario: Enregistrement demandé par le composant
- **WHEN** un composant appelle la commande d'enregistrement
- **THEN** le dashboard enregistre tout le brouillon de la configuration et le composant reçoit le résultat (réussi, refusé ou partiel) pour l'afficher sur son bouton

#### Scenario: Composant natif sans écriture directe
- **WHEN** un composant de configuration d'un plugin natif modifie une valeur
- **THEN** il passe par le brouillon et aucune écriture directe n'est émise avant l'enregistrement par le dashboard

#### Scenario: Onglet tiers qui écrit lui-même
- **WHEN** un composant d'un onglet `thermostat_config` contribué par un plugin tiers appelle un service de Home Assistant pour écrire un paramètre qui vit dans les entités de son plugin
- **THEN** l'appel est émis sans être bloqué par le dashboard, et le brouillon du dashboard n'est pas modifié par cet appel
