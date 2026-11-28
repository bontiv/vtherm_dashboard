# Spec Delta

## MODIFIED Requirements

### Requirement: Compatibilité avec la version de Versatile Thermostat
Le dashboard SHALL éditer une configuration seulement quand sa version majeure de configuration est celle qu'il supporte ET quand la version majeure du paquet Versatile Thermostat installé est celle qu'il a vérifiée. Une version absente ou illisible SHALL être traitée comme non vérifiée. Dans tous les autres cas la configuration SHALL être affichée en lecture seule, avec un message explicite, sans autoriser de modification.

#### Scenario: Version majeure de configuration supportée et paquet vérifié
- **WHEN** une entrée a une version majeure de configuration supportée et que le paquet Versatile Thermostat installé a la version majeure vérifiée
- **THEN** la configuration est modifiable, quelle que soit la version mineure de configuration de l'entrée

#### Scenario: Version de configuration plus récente
- **WHEN** une entrée a une version majeure de configuration supérieure à celle supportée
- **THEN** la configuration est en lecture seule et un message indique d'utiliser l'interface de Home Assistant ou de mettre à jour le dashboard

#### Scenario: Version majeure du paquet non vérifiée
- **WHEN** le paquet Versatile Thermostat installé a une version majeure différente de celle vérifiée par le dashboard
- **THEN** la configuration est en lecture seule et le message indique que la version installée n'est pas celle que le dashboard sait éditer, et d'utiliser l'interface de Home Assistant ou de mettre à jour le dashboard

#### Scenario: Version du paquet inconnue
- **WHEN** la version du paquet Versatile Thermostat ne peut pas être lue ou n'est pas analysable
- **THEN** la configuration est en lecture seule et le message indique que la version installée n'a pas pu être vérifiée

## ADDED Requirements

### Requirement: Versions déclarées au tableau de bord
Le dashboard SHALL déclarer, à la lecture de la liste des thermostats, la version majeure du paquet Versatile Thermostat qu'il a vérifiée et la version de configuration dont son schéma embarqué est la description. La version de configuration déclarée SHALL décrire l'origine du schéma et non la règle d'édition.

#### Scenario: Liste des thermostats
- **WHEN** l'administrateur lit la liste des thermostats
- **THEN** la réponse porte la version majeure vérifiée du paquet Versatile Thermostat et la version de configuration dont le schéma embarqué est la description

#### Scenario: Version de configuration déclarée
- **WHEN** le schéma embarqué décrit la version de configuration 2.4 alors que l'entrée éditée est en version mineure 5
- **THEN** la version déclarée reste 2.4, et l'édition n'est pas refusée pour autant

### Requirement: Lecture seule annoncée par une raison
Le dashboard SHALL annoncer chaque configuration en lecture seule avec une raison technique stable, et SHALL appliquer la même décision au chemin d'écriture qu'au chemin de lecture, de sorte qu'une écriture sur une configuration en lecture seule soit refusée avec la même raison.

#### Scenario: Écriture sur une configuration en lecture seule
- **WHEN** une écriture est demandée sur une configuration que le dashboard considère en lecture seule
- **THEN** l'écriture est refusée avec la raison annoncée par la lecture, et aucune modification n'est envoyée à Versatile Thermostat

#### Scenario: Raison inchangée pour une version non vérifiée
- **WHEN** une configuration est en lecture seule parce que la version du paquet n'a pas pu être vérifiée
- **THEN** la raison technique annoncée reste celle déjà publiée par le dashboard, afin de ne pas rompre ses consommateurs
