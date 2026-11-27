# ui-plugin-sdk Specification

## Purpose
Fournir aux auteurs de plugins UI un package npm typé pour déclarer leur plugin auprès du dashboard et accéder au contexte d'exécution du dashboard.

## Requirements

### Requirement: Package npm publié
Le projet SHALL publier sur npm le package `@vtherm/dashboard-sdk`, distribué en modules ES avec ses définitions de types TypeScript. Sa version SHALL être celle du dashboard avec lequel il est publié.

#### Scenario: Installation par un auteur de plugin
- **WHEN** un auteur de plugin installe `@vtherm/dashboard-sdk` dans un projet TypeScript
- **THEN** les types du contrat sont disponibles sans package de types supplémentaire

### Requirement: Fonction de déclaration d'un plugin
Le package SHALL exporter `registerUiPlugin(definition)`, qui enregistre les contributions du plugin auprès du dashboard. La définition contient l'`id` du plugin et ses contributions regroupées par hook.

#### Scenario: Enregistrement depuis le module du plugin
- **WHEN** le module JavaScript d'un plugin appelle `registerUiPlugin` avec une définition valide pendant son chargement par le dashboard
- **THEN** les contributions du plugin sont prises en compte par le dashboard

#### Scenario: Dashboard absent
- **WHEN** `registerUiPlugin` est appelé dans une page où le dashboard n'est pas chargé
- **THEN** l'appel échoue avec une erreur explicite indiquant que le dashboard est introuvable

#### Scenario: Plugin inconnu côté Python
- **WHEN** `registerUiPlugin` est appelé avec un `id` qui n'a ni été enregistré côté Python ni déclaré par une entrée du mode développement
- **THEN** l'appel est refusé avec une erreur explicite et aucune contribution n'est appliquée

### Requirement: Types du contrat
Le package SHALL exporter les types de la définition de plugin, des contributions, des positions, des hooks et des propriétés reçues par les composants de contribution. Le type de position SHALL n'autoriser qu'une seule forme (`first`, `last`, `before`, `after`, `replace` ou `remove`) et SHALL refuser toute valeur numérique d'ordre. Les propriétés communes à tous les composants SHALL comprendre `hass` et `narrow`, l'indication d'un affichage étroit.

#### Scenario: Position invalide à la compilation
- **WHEN** un auteur écrit une position contenant à la fois `after` et `before`
- **THEN** la compilation TypeScript échoue

#### Scenario: Propriétés d'un composant par thermostat
- **WHEN** un composant est déclaré pour le hook `thermostat_widget`
- **THEN** son type de propriétés inclut `hass` et `thermostatId`

#### Scenario: Indication d'écran étroit dans les types
- **WHEN** un auteur écrit le composant d'une contribution de n'importe quel hook
- **THEN** son type de propriétés inclut `narrow`, un booléen

### Requirement: Validation à l'enregistrement
`registerUiPlugin` SHALL valider la définition avec les mêmes règles que le dashboard (hook connu, identifiants préfixés par l'identifiant du plugin, forme de position valide) et SHALL signaler toute erreur avec le chemin de l'élément fautif.

#### Scenario: Identifiant mal préfixé
- **WHEN** une contribution du plugin `smartpi` a l'identifiant `autre.tab.main`
- **THEN** l'appel échoue avec une erreur qui désigne cette contribution

### Requirement: Types des contributions de navigation
Les types du package SHALL couvrir les sept hooks. Une contribution de navigation SHALL exiger un titre, une `top_tab` SHALL accepter une zone (`start` ou `end`), une `tab_page` SHALL exiger l'identifiant de son onglet cible, et une entrée de menu SHALL accepter un groupe facultatif.

#### Scenario: Titre manquant
- **WHEN** un auteur déclare une contribution `thermostat_config` sans titre
- **THEN** la compilation TypeScript échoue

#### Scenario: Onglet cible manquant
- **WHEN** un auteur déclare une `tab_page` sans `tab`
- **THEN** la compilation TypeScript échoue

#### Scenario: Zone invalide
- **WHEN** un auteur déclare une `top_tab` avec une zone autre que `start` ou `end`
- **THEN** la compilation TypeScript échoue

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

### Requirement: Registre unique côté dashboard
Le package SHALL déléguer l'enregistrement au registre du dashboard présent dans la page, et ne SHALL pas contenir de registre propre. Plusieurs plugins qui embarquent chacun une copie du package SHALL enregistrer leurs contributions dans le même registre.

#### Scenario: Deux plugins avec deux copies du SDK
- **WHEN** deux plugins, chacun avec sa propre copie du package, appellent `registerUiPlugin`
- **THEN** les deux plugins apparaissent dans le même registre du dashboard

### Requirement: Harnais de test
Le package SHALL fournir un point d'entrée séparé `@vtherm/dashboard-sdk/testing` avec un faux hôte, utilisable sans Home Assistant ni navigateur complet. Ce faux hôte SHALL appliquer les mêmes règles de validation et de positionnement que le dashboard, SHALL permettre de définir les états du faux `hass`, et SHALL retourner pour chaque hook la liste ordonnée des contributions résolues. Ce point d'entrée SHALL ne pas être importé par le point d'entrée principal.

#### Scenario: Test de position
- **WHEN** un test enregistre un plugin avec une contribution `after: core_tpi.tab.main` dans le faux hôte
- **THEN** la liste résolue du hook `thermostat_config` place la contribution juste après `core_tpi.tab.main`

#### Scenario: Rendu d'un composant
- **WHEN** un test affiche une contribution `thermostat_widget` avec un faux `hass` et un `thermostatId`
- **THEN** le composant est rendu avec ces propriétés

#### Scenario: Règles identiques
- **WHEN** une définition invalide est enregistrée dans le faux hôte
- **THEN** il retourne la même erreur que `registerUiPlugin` dans le dashboard

#### Scenario: Absence du harnais en production
- **WHEN** un plugin importe uniquement le point d'entrée principal du package
- **THEN** le code du harnais n'est pas inclus dans son bundle

### Requirement: Version du dashboard accessible
Le package SHALL exposer la version du dashboard en cours d'exécution, en lecture seule, pour permettre à un plugin d'adapter son comportement.

#### Scenario: Lecture de la version
- **WHEN** un plugin lit la version du dashboard via le package
- **THEN** il obtient la version semver du dashboard chargé dans la page

### Requirement: Contrat des types de champs
Le SDK SHALL exporter un contrat de champs de configuration où chaque type de champ correspond à un contrôle Home Assistant : booléen, nombre, entier, texte, texte long, entité (une ou plusieurs, avec domaines et classes d'appareil), choix, durée et gabarit. Le SDK SHALL fournir la fonction pure qui transforme une définition de champ en description de sélecteur de Home Assistant.

#### Scenario: Champ entité à plusieurs valeurs
- **WHEN** un plugin déclare un champ entité avec plusieurs valeurs et le domaine `climate`
- **THEN** la description de sélecteur obtenue est un sélecteur `entity` en mode liste avec le filtre de domaine `climate`

#### Scenario: Type de champ inconnu
- **WHEN** un plugin déclare un type de champ absent du contrat
- **THEN** la compilation TypeScript échoue

### Requirement: Chargeur des composants de Home Assistant
Le SDK SHALL exporter une fonction qui rend disponibles les composants de Home Assistant utilisés par le contrat de champs et qui indique, sans lever d'erreur, si le chargement a réussi et quels composants sont définis (par exemple `ha-spinner` ou `ha-circular-progress`). Le SDK ne fournit pas d'élément de formulaire partagé : chaque plugin rend ses champs avec le contrat. Plusieurs appels SHALL partager un seul chargement.

#### Scenario: Appels répétés
- **WHEN** deux plugins appellent le chargeur en même temps
- **THEN** un seul chargement a lieu et les deux appels reçoivent le même résultat

### Requirement: Composants Home Assistant dans le harnais de test
Le harnais de test SHALL permettre de tester un composant de plugin qui utilise les composants de Home Assistant, sans Home Assistant : il fournit des éléments simulés des composants du contrat qui reçoivent les propriétés et émettent `value-changed` comme les vrais.

#### Scenario: Test d'un champ entité
- **WHEN** un test change la valeur d'un sélecteur d'entités simulé
- **THEN** le composant du plugin propose le changement correspondant au brouillon

#### Scenario: Propriétés transmises
- **WHEN** un test lit un sélecteur simulé
- **THEN** il peut vérifier le sélecteur, la valeur, le libellé, l'aide et l'erreur transmis

### Requirement: Déclaration des actions d'enregistrement d'une contribution
Une contribution `general_config` ou `thermostat_config` SHALL pouvoir déclarer qu'elle dessine elle-même les actions d'enregistrement dans sa carte. Sans cette déclaration, le dashboard SHALL dessiner ces actions dans une carte sous le composant. Les contributions natives SHALL utiliser cette même déclaration. Une valeur invalide SHALL être rejetée par la validation, comme les autres champs de contribution.

#### Scenario: Plugin existant
- **WHEN** un plugin tiers publié avant ce changement déclare une contribution `thermostat_config` sans la nouvelle déclaration
- **THEN** il reste valide et ses pages de configuration affichent les actions dans la carte du dashboard

#### Scenario: Déclaration faite
- **WHEN** une contribution `thermostat_config` déclare dessiner elle-même les actions
- **THEN** le dashboard ne dessine pas de carte d'actions sous son composant

#### Scenario: Déclaration sur un autre hook
- **WHEN** un auteur ajoute cette déclaration à une contribution `global_page`
- **THEN** la compilation TypeScript échoue et la validation à l'enregistrement rejette la contribution

### Requirement: Statut et fonctionnalité des contributions de configuration
Les contributions `thermostat_config` et `general_config` SHALL accepter une fonction de statut facultative, pure, qui reçoit le contexte de visibilité et renvoie un statut typé (complète, héritée, héritée éteinte, éteinte, incomplète avec un nombre, ou aucun), et une clé de fonctionnalité facultative qui désigne la valeur booléenne qui active la section. Le dashboard SHALL calculer lui-même le statut refusée, et le statut éteinte quand la valeur de la fonctionnalité est fausse.

#### Scenario: Plugin tiers incomplet
- **WHEN** la fonction de statut d'un plugin tiers renvoie « incomplète, 2 »
- **THEN** son entrée affiche « 2 manquants » dans le menu

#### Scenario: Plugin tiers avec fonctionnalité
- **WHEN** un plugin tiers déclare la fonctionnalité `use_my_feature` et que sa valeur est fausse
- **THEN** son entrée a le statut éteinte et sa page montre l'interrupteur d'activation fourni par le dashboard

#### Scenario: Plugin tiers éteint par ses valeurs
- **WHEN** la fonction de statut d'un plugin tiers sans fonctionnalité renvoie « éteinte »
- **THEN** son entrée affiche « Off » et sa page s'affiche normalement, sans interrupteur d'activation

#### Scenario: Plugin tiers hérité éteint
- **WHEN** la fonction de statut d'un plugin tiers renvoie « héritée éteinte »
- **THEN** son entrée affiche « Central (off) »

#### Scenario: Statut invalide
- **WHEN** une fonction de statut lève une exception ou renvoie une valeur hors du type
- **THEN** l'entrée n'affiche pas de statut et le mode développement signale l'erreur du plugin

#### Scenario: Sans statut
- **WHEN** une contribution ne déclare ni statut ni fonctionnalité
- **THEN** son entrée n'affiche que les statuts calculés par le dashboard (refusée)

### Requirement: Contrat du composant d'aide de champ
Le SDK SHALL exporter le nom de l'élément du composant d'aide de champ fourni par le dashboard, le type de ses propriétés (indication, explication, libellé du champ, identifiant de schéma ou schéma fourni, valeurs des réglages illustrés, réglage mis en évidence) et l'union typée des identifiants des schémas de la bibliothèque. Le SDK SHALL rester sans dépendance de rendu : l'élément est défini par le dashboard.

#### Scenario: Identifiant de schéma typé
- **WHEN** un plugin TypeScript donne au composant d'aide un identifiant de schéma absent de l'union exportée
- **THEN** la compilation TypeScript échoue

#### Scenario: Composant disponible
- **WHEN** un plugin crée l'élément d'aide dont le SDK exporte le nom, une fois chargé par le dashboard
- **THEN** l'élément est défini et affiche l'aide du champ

### Requirement: Composant d'aide dans le harnais de test
Le harnais de test du SDK SHALL fournir une version simplifiée du composant d'aide de champ, qui expose ses propriétés reçues, pour qu'un plugin puisse vérifier l'aide de ses champs sans le dashboard.

#### Scenario: Vérification par un plugin
- **WHEN** un test de plugin monte son onglet dans le harnais
- **THEN** il peut lire l'indication, l'explication et l'identifiant de schéma passés au composant d'aide de chaque champ

### Requirement: Groupes partagés du cœur
Le SDK SHALL exposer les identifiants des groupes partagés « Paramètres généraux » et « Fonctionnalités », utilisables comme groupe d'une entrée de menu par tout plugin. Le dashboard SHALL traduire leurs intitulés en anglais, français et allemand, sans clé dans les catalogues du plugin.

#### Scenario: Usage typé
- **WHEN** un plugin TypeScript déclare comme groupe d'une section l'identifiant du groupe « Fonctionnalités » exposé par le SDK
- **THEN** la compilation réussit et la section apparaît sous l'intitulé du groupe des onglets natifs

### Requirement: Registres et formateurs dans le type de l'état
Le type `Hass` du SDK SHALL décrire, en lecture seule et comme facultatifs, les registres `entities` (identifiant d'entité, identifiant d'appareil, plateforme, clé de traduction) et `devices` (identifiant, identifiants `identifiers`, entrées de configuration), et les formateurs `formatEntityState` et `formatEntityAttributeValue`. Un plugin qui ne les lit pas SHALL rester valide sans changement.

#### Scenario: Plugin existant
- **WHEN** un plugin publié avant ce changement est compilé avec le nouveau SDK
- **THEN** la compilation réussit sans modification

#### Scenario: Registre absent
- **WHEN** un plugin lit `hass.entities` dans une version de Home Assistant qui ne le fournit pas
- **THEN** la valeur est `undefined` et le type l'a annoncé

### Requirement: Entités d'une entrée de configuration
Le SDK SHALL exporter `getEntryEntities(hass, entryId)`, fonction pure et synchrone qui trouve l'appareil d'une entrée de configuration de Versatile Thermostat par ses `identifiers` dans `hass.devices`, puis renvoie ses entités (identifiant, domaine, clé de traduction), sa première entité `climate` et un dictionnaire clé de traduction vers identifiant d'entité. Elle SHALL ne faire aucun appel réseau et SHALL renvoyer des valeurs vides, sans erreur, pour une entrée inconnue ou un registre absent.

#### Scenario: Thermostat connu
- **WHEN** un widget appelle la fonction avec l'identifiant de l'entrée de configuration d'un thermostat
- **THEN** il obtient l'entité `climate` du thermostat et, par clé de traduction (par exemple `power_percent`), le capteur de son appareil

#### Scenario: Configuration centrale
- **WHEN** un widget appelle la fonction avec l'identifiant de l'entrée de la configuration centrale
- **THEN** il obtient les entités de l'appareil central, dont le `select` du mode central par son domaine

#### Scenario: Identifiant qui n'est pas une entrée
- **WHEN** un plugin passe `climate.salon` au lieu de l'identifiant de l'entrée de configuration
- **THEN** la fonction renvoie des valeurs vides

#### Scenario: Registre absent
- **WHEN** `hass.devices` ou `hass.entities` est absent
- **THEN** la fonction renvoie des valeurs vides sans lever d'erreur

#### Scenario: Aucun appel réseau
- **WHEN** la fonction est appelée dans une condition de visibilité
- **THEN** aucun `callWS` n'est émis et le résultat est disponible au même instant

### Requirement: Configuration centrale pour les widgets globaux
Un composant `global_widget` et sa condition de visibilité SHALL recevoir `central`, l'identifiant de l'entrée de la configuration centrale et ses valeurs, absent quand il n'y a pas de configuration centrale. Les plugins existants SHALL rester valides.

#### Scenario: Configuration centrale présente
- **WHEN** une configuration centrale existe et qu'un widget global est affiché
- **THEN** le widget reçoit l'identifiant de l'entrée et ses valeurs, et sa condition de visibilité les reçoit aussi

#### Scenario: Sans configuration centrale
- **WHEN** aucune configuration centrale n'existe
- **THEN** `central` est absent

#### Scenario: Plugin existant
- **WHEN** un plugin tiers publié avant ce changement déclare un widget global
- **THEN** il reste valide et ne reçoit qu'une propriété de plus

### Requirement: Taille d'un widget
Les contributions `global_widget` et `thermostat_widget` SHALL pouvoir déclarer `size`, objet facultatif `{ columns?, rows? }` où `columns` vaut 1, 2, 3 ou `"full"` et `rows` vaut 1, 2 ou 3. Sans `size`, la taille SHALL être une colonne sans hauteur minimale. Une valeur hors de ces ensembles, une clé inconnue, ou `size` sur un autre hook SHALL être refusée à l'enregistrement avec le chemin de l'élément fautif, et la compilation TypeScript SHALL échouer pour ces cas.

#### Scenario: Plugin existant
- **WHEN** un plugin publié avant ce changement déclare un widget sans `size`
- **THEN** il reste valide et son widget occupe une colonne comme avant

#### Scenario: Taille valide
- **WHEN** un plugin déclare `size: { columns: 2, rows: 2 }` sur un `thermostat_widget`
- **THEN** la contribution est acceptée avec cette taille

#### Scenario: Colonnes invalides
- **WHEN** un plugin déclare `size: { columns: 4 }`
- **THEN** la compilation TypeScript échoue et `registerUiPlugin` refuse la contribution avec une erreur dont le chemin se termine par `size.columns`

#### Scenario: Clé inconnue
- **WHEN** un plugin déclare `size: { width: 2 }`
- **THEN** la contribution est refusée avec une erreur qui désigne `size`

#### Scenario: Autre hook
- **WHEN** un plugin déclare `size` sur une contribution `thermostat_config`
- **THEN** la compilation TypeScript échoue et la validation rejette la contribution

#### Scenario: Taille partielle
- **WHEN** un plugin déclare `size: { columns: "full" }`
- **THEN** `rows` prend la valeur 1

### Requirement: Harnais de test des widgets
Le faux `hass` du harnais de test SHALL accepter les registres `entities` et `devices`, pour tester un widget qui utilise `getEntryEntities` sans Home Assistant, et les contributions résolues d'un hook de widget SHALL porter leur taille normalisée (valeurs par défaut comprises).

#### Scenario: Test d'un widget
- **WHEN** un test déclare un appareil et un capteur `power_percent` dans le faux `hass` et affiche un widget
- **THEN** le widget lit ce capteur et le test peut vérifier la valeur affichée

#### Scenario: Entrée non déclarée
- **WHEN** un test affiche un widget pour une entrée absente des registres du faux `hass`
- **THEN** `getEntryEntities` renvoie des valeurs vides, comme dans le dashboard

#### Scenario: Taille résolue
- **WHEN** un test enregistre un widget sans `size`
- **THEN** la liste résolue du hook indique `columns: 1` et `rows: 1` pour lui

#### Scenario: Mêmes règles de validation
- **WHEN** un test enregistre un widget avec `size: { rows: 5 }` dans le faux hôte
- **THEN** il retourne la même erreur que `registerUiPlugin` dans le dashboard
