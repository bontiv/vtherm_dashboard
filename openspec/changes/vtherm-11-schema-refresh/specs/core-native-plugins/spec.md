# Spec Delta

## MODIFIED Requirements

### Requirement: Auto TPI
L'onglet TPI d'un thermostat SHALL proposer les seuls réglages Auto TPI que le formulaire de Versatile Thermostat conserve : le temps de chauffe du radiateur (défaut 5) et le Kext continu (désactivé par défaut). Les réglages retirés par Versatile Thermostat SHALL NOT être proposés : type d'apprentissage, agressivité, temps de refroidissement, taux de chauffe, méthode de calcul, paramètres avancés et leurs formes EMA et moyenne pondérée.

#### Scenario: Valeurs selon le type d'apprentissage
- **WHEN** une entrée écrite avant la version 2.5 de configuration est ouverte dans l'onglet TPI
- **THEN** les valeurs des réglages retirés ne sont ni proposées ni réinjectées, et les deux réglages conservés gardent leur valeur : temps de chauffe 5 et Kext continu désactivé

#### Scenario: Réglage fin
- **WHEN** l'onglet TPI est affiché
- **THEN** aucun réglage fin n'est proposé : ni méthode de calcul, ni alpha, ni décroissance, ni alpha du Kext continu

#### Scenario: Paramètres avancés
- **WHEN** l'onglet TPI est affiché
- **THEN** aucun basculement vers des paramètres avancés n'est proposé, la forme conservée se limitant au temps de chauffe et au Kext continu
