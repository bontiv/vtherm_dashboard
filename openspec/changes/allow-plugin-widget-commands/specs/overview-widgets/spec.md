## MODIFIED Requirements

### Requirement: Affichage seul
Les widgets contribués par un plugin natif (identifiant de plugin commençant par `core`) SHALL afficher l'état de fonctionnement sans le modifier : ils ne SHALL appeler aucun service de Home Assistant ni dessiner aucun bouton de commande. Les widgets contribués par un autre plugin SHALL pouvoir appeler les services de Home Assistant et dessiner des commandes, sans que le dashboard les en empêche.

#### Scenario: Aucun appel de service
- **WHEN** un widget d'un plugin natif est affiché et que l'utilisateur interagit avec lui
- **THEN** aucun appel `callService` n'est émis

#### Scenario: Widget natif sans commande
- **WHEN** un widget d'un plugin natif est affiché
- **THEN** aucun bouton de commande (mode, preset, verrou, contournement de fenêtre, mode central, apprentissage) n'est dessiné

#### Scenario: Widget de plugin tiers qui écrit
- **WHEN** un widget contribué par un plugin tiers appelle `hass.callService` à la suite d'une action de l'utilisateur
- **THEN** l'appel est émis vers Home Assistant sans être bloqué par le dashboard

#### Scenario: Widget de plugin tiers qui commande
- **WHEN** un plugin tiers contribue un widget qui dessine un bouton de commande
- **THEN** le widget est affiché avec son bouton
