# overview-widgets Specification

## Purpose
Montrer, dans les vues d'ensemble du dashboard et d'un thermostat, les éléments de fonctionnement de Versatile Thermostat (valeurs mesurées, états, alertes), par des widgets contribués par les plugins. Les widgets des plugins natifs sont en lecture seule ; ceux des autres plugins peuvent aussi écrire.

## Requirements

### Requirement: Carte de widget commune
Chaque widget natif SHALL montrer un titre traduit (clé `widget.<nom>.title` de son plugin) et un corps, et gérer trois états : chargement, vide (message qui dit pourquoi) et indisponible. Le conteneur SHALL dessiner chaque widget dans un `ha-card`, ou dans un élément de même apparence quand ce composant n'est pas défini.

#### Scenario: Titre traduit
- **WHEN** la langue de l'utilisateur est le français et qu'un widget natif est affiché
- **THEN** son titre est celui du catalogue français de son plugin

#### Scenario: Chargement
- **WHEN** un widget attend l'historique de son graphique
- **THEN** sa carte montre l'indicateur de progression et le titre, sans valeur

#### Scenario: Carte absente de Home Assistant
- **WHEN** le composant `ha-card` n'est pas défini
- **THEN** le widget est dessiné dans un élément qui a la même bordure, le même arrondi et le même fond, sans erreur

#### Scenario: Widget tiers existant
- **WHEN** un plugin tiers publié avant ce changement déclare un widget
- **THEN** son rendu garde la même bordure, le même arrondi et le même fond

### Requirement: Conventions d'identifiant et de masquage
Un widget natif SHALL avoir l'identifiant `<plugin>.widget.<nom>`. Un widget dont la fonctionnalité est éteinte, ou dont aucune entité source n'existe pour le thermostat, SHALL être masqué par sa condition `visible` et ne SHALL laisser aucune carte vide. La condition SHALL utiliser les valeurs effectives du thermostat (valeurs propres, et valeurs de la configuration centrale pour les sections qui l'héritent).

#### Scenario: Fonctionnalité éteinte
- **WHEN** la fonctionnalité d'un widget est éteinte pour le thermostat
- **THEN** aucune carte n'est dessinée et les autres widgets gardent leur place

#### Scenario: Fonctionnalité héritée de la configuration centrale
- **WHEN** le thermostat utilise la configuration centrale d'une fonctionnalité et que la configuration centrale l'active
- **THEN** le widget de cette fonctionnalité est affiché

#### Scenario: Entité source absente
- **WHEN** la fonctionnalité est active mais que l'entité source du widget n'existe pas dans Home Assistant
- **THEN** le widget est masqué

#### Scenario: Condition en erreur
- **WHEN** la condition de visibilité d'un widget lève une erreur
- **THEN** le widget est masqué et l'erreur est signalée dans l'état du plugin

### Requirement: Valeurs indisponibles
Un widget SHALL afficher « — » pour une valeur absente, `unavailable` ou `unknown`, avec la mention « indisponible » pour les lecteurs d'écran, et ne SHALL pas afficher « 0 » à la place d'une valeur inconnue.

#### Scenario: Capteur indisponible
- **WHEN** l'état d'une entité source est `unavailable`
- **THEN** la valeur correspondante affiche « — » et son nom accessible indique qu'elle est indisponible

#### Scenario: Attribut absent
- **WHEN** un attribut que le widget lit n'existe pas dans l'état de l'entité
- **THEN** la valeur affiche « — » et les autres valeurs du widget restent affichées

### Requirement: Unités et formats régionaux
Les valeurs SHALL être formatées par `hass.formatEntityState` ou `hass.formatEntityAttributeValue` quand ils existent, et sinon avec la langue de `hass.locale` et l'unité de l'entité ou de la température de Home Assistant. Un âge SHALL s'afficher en durée relative (« il y a 3 min »), avec la date complète dans l'infobulle.

#### Scenario: Formateur de Home Assistant
- **WHEN** `hass.formatEntityAttributeValue` est défini
- **THEN** la température affichée est celle qu'il renvoie, sans second formatage

#### Scenario: Repli sans formateur
- **WHEN** `hass.formatEntityAttributeValue` est absent, comme dans le harnais de test
- **THEN** la température est formatée avec `hass.locale` et l'unité de Home Assistant

#### Scenario: Séparateur décimal
- **WHEN** la langue est le français et qu'une température vaut 19,5
- **THEN** la valeur affichée est « 19,5 °C »

#### Scenario: Unité Fahrenheit
- **WHEN** Home Assistant est réglé en °F
- **THEN** les températures affichées portent l'unité « °F » et aucune conversion n'est faite par le widget

#### Scenario: Âge d'une mesure
- **WHEN** une date vieille de trois minutes est affichée
- **THEN** le texte est « il y a 3 minutes » en français et « 3 minutes ago » en anglais (format long de `Intl.RelativeTimeFormat`), et la date complète est dans l'infobulle

### Requirement: Composants de présentation
Le dashboard SHALL fournir aux widgets natifs une jauge (valeur, bornes, repère facultatif, unité), une barre simple, une barre segmentée, une icône d'état (icône, libellé, infobulle), une ligne de valeur (libellé, valeur, unité) et l'âge relatif. Chacun SHALL utiliser le composant de Home Assistant correspondant quand il est défini, et un dessin de repli sinon. Chaque composant SHALL exposer un nom accessible et une valeur textuelle.

#### Scenario: Jauge avec repère
- **WHEN** une jauge reçoit la valeur 19,5, les bornes 7 et 35 et le repère 21
- **THEN** la jauge indique la position de 19,5 et marque 21, et son nom accessible dit « 19,5 sur une plage de 7 à 35, consigne 21 »

#### Scenario: Barre segmentée
- **WHEN** une barre segmentée reçoit 186 s « actif » et 114 s « arrêt »
- **THEN** deux segments proportionnels sont dessinés avec leur libellé et leur valeur en texte

#### Scenario: Composant de Home Assistant absent
- **WHEN** `ha-gauge` n'est pas défini
- **THEN** la jauge est dessinée par le dessin de repli, avec le même nom accessible

### Requirement: Accessibilité
Un état SHALL toujours être donné par une icône et un texte, jamais par la seule couleur. Les infobulles SHALL être atteignables au clavier, et chaque icône qui porte un sens SHALL avoir un nom accessible traduit.

#### Scenario: État en alerte
- **WHEN** un widget montre une alerte
- **THEN** l'alerte a une icône, un texte et une couleur d'avertissement, et elle est annoncée par un lecteur d'écran

#### Scenario: Infobulle au clavier
- **WHEN** l'utilisateur atteint une icône avec la touche de tabulation
- **THEN** son infobulle s'affiche

### Requirement: Thème et écran étroit
Les widgets SHALL utiliser les variables de thème de Home Assistant et aucune couleur figée, et SHALL rester lisibles sans défilement horizontal jusqu'à 360 px de large.

#### Scenario: Thème sombre
- **WHEN** le thème de Home Assistant est sombre
- **THEN** les textes, les jauges et les barres utilisent les couleurs du thème et gardent un contraste lisible

#### Scenario: Écran étroit
- **WHEN** le dashboard est affiché à 375 px
- **THEN** les widgets occupent une colonne sans débordement horizontal

### Requirement: Coût de rendu
Un widget SHALL ne se redessiner que lorsque l'état de l'une de ses entités change. L'historique d'un widget SHALL ne se charger que lorsque sa carte est visible, et SHALL réutiliser le cache de 5 minutes du client d'historique.

#### Scenario: Changement d'une entité étrangère
- **WHEN** l'état d'une entité qu'un widget ne lit pas change
- **THEN** ce widget n'est pas redessiné

#### Scenario: Carte hors de l'écran
- **WHEN** la carte d'un graphique est sous la zone visible
- **THEN** aucune requête d'historique n'est envoyée avant qu'elle devienne visible

### Requirement: Éléments sans source dans Versatile Thermostat
Un widget ne SHALL pas afficher un élément que Versatile Thermostat ne publie pas : position dans le cycle TPI, délai restant de la détection de fenêtre, prochaine action de l'arrêt automatique, échéance du reverrouillage. Aucune estimation côté dashboard ne SHALL les remplacer.

#### Scenario: Élément exclu
- **WHEN** un thermostat a la détection de fenêtre active
- **THEN** le widget de fenêtre n'affiche aucun délai restant

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

### Requirement: Grille et taille des widgets
Le conteneur des widgets SHALL calculer le nombre de colonnes de la grille (colonnes de 280 px minimum), appliquer à chaque widget la largeur de sa `size` limitée à ce nombre (`"full"` pour toute la rangée) et une hauteur minimale de `rows` fois 140 px plus les écarts quand `rows` est déclaré. Sans `size`, un widget SHALL occuper une colonne sans hauteur minimale. Le conteneur SHALL ne pas réordonner les cartes pour combler les trous.

#### Scenario: Widget sur deux colonnes
- **WHEN** un widget déclare `columns: 2` et que la grille a quatre colonnes
- **THEN** sa carte occupe deux colonnes

#### Scenario: Largeur limitée à la grille
- **WHEN** un widget déclare `columns: 3` et que la grille n'a que deux colonnes
- **THEN** sa carte occupe deux colonnes et la grille ne déborde pas

#### Scenario: Toute la rangée
- **WHEN** un widget déclare `columns: "full"`
- **THEN** sa carte occupe toute la largeur de la grille, quel que soit le nombre de colonnes

#### Scenario: Hauteur minimale
- **WHEN** un widget déclare `rows: 2`
- **THEN** sa carte a une hauteur minimale de 280 px plus un écart, et elle grandit si son contenu est plus haut

#### Scenario: Widget sans taille
- **WHEN** un widget n'a pas de `size`
- **THEN** sa carte occupe une colonne et sa hauteur suit son contenu

#### Scenario: Écran étroit
- **WHEN** le dashboard est affiché à 375 px
- **THEN** toute largeur demandée est ramenée à une colonne et la hauteur minimale de `rows` reste appliquée

#### Scenario: Calcul du nombre de colonnes
- **WHEN** le conteneur mesure 1 440 px de large avec 16 px d'écart
- **THEN** la grille a quatre colonnes (partie entière de (1 440 + 16) / (280 + 16))

### Requirement: Ordre de lecture des widgets
Le conteneur des widgets SHALL garder l'ordre résolu des placements comme ordre du DOM, de lecture et de tabulation, quelle que soit la taille des widgets.

#### Scenario: Tabulation
- **WHEN** l'utilisateur parcourt les widgets avec la touche de tabulation
- **THEN** le focus suit l'ordre des placements, même si un widget large est suivi d'un widget étroit

#### Scenario: Pas de remplissage dense
- **WHEN** un widget de deux colonnes ne tient pas à la fin d'une rangée
- **THEN** il passe à la rangée suivante et les widgets suivants ne le dépassent pas

### Requirement: Widget Température
Le widget `core.widget.temperature` SHALL montrer sur une jauge (bornes `min_temp` et `max_temp`) la température courante de l'entité `climate` et la consigne en repère, puis la température extérieure du thermostat, avec l'unité de Home Assistant. Il SHALL montrer « demandée → appliquée » seulement quand ces consignes diffèrent, et la consigne régulée seulement quand son capteur existe.

#### Scenario: Valeurs affichées
- **WHEN** la température courante est 19,5, la consigne 21 et la température extérieure 6,2, en °C
- **THEN** la jauge montre 19,5 avec le repère 21 et la ligne extérieure affiche « 6,2 °C »

#### Scenario: Consigne modifiée par une fonction
- **WHEN** la consigne demandée est 21 et que la consigne appliquée est 17 à cause d'une fenêtre ouverte
- **THEN** le widget affiche « 21 → 17 °C »

#### Scenario: Consigne identique
- **WHEN** les consignes demandée et appliquée sont égales
- **THEN** le widget n'affiche pas la ligne « demandée → appliquée »

#### Scenario: Pas de capteur extérieur
- **WHEN** le thermostat n'a pas de température extérieure
- **THEN** la ligne extérieure affiche « — » et la jauge reste affichée

#### Scenario: Température indisponible
- **WHEN** l'état de l'entité `climate` est `unavailable`
- **THEN** la jauge affiche « — » avec la mention « indisponible »

### Requirement: Widget Mode et action
Le widget `core.widget.mode` SHALL montrer par une icône et un texte le mode HVAC (état de `climate`) et l'action HVAC (`hvac_action`), la raison du mode ou de l'arrêt (`hvac_off_reason`, `hvac_mode_reason`) en libellé traduit, la veille (`is_sleeping`) et le mode central appliqué (`last_central_mode`) seulement quand ils s'appliquent. Il SHALL ne dessiner aucun bouton.

#### Scenario: Chauffe en cours
- **WHEN** le mode est `heat` et l'action `heating`
- **THEN** le widget affiche l'icône de chauffe et les textes « Chauffage » et « En chauffe »

#### Scenario: Arrêt par une fenêtre
- **WHEN** le mode est `off` avec la raison `hvac_off_window_detection`
- **THEN** le widget affiche « Arrêt » et la raison « Fenêtre ouverte »

#### Scenario: Raison inconnue
- **WHEN** la raison est un code que le dashboard ne connaît pas
- **THEN** le widget affiche le code tel quel avec une icône générique

#### Scenario: Aucune commande
- **WHEN** le widget est affiché
- **THEN** il ne contient aucun bouton ni sélecteur de mode

### Requirement: Widget Alertes et raisons
Le widget `core.widget.alerts` SHALL lister les messages actifs (`messages`) chacun avec une icône et un texte traduit, le thermostat non prêt (`is_ready` faux), les équipements sous-jacents indisponibles ou non initialisés (liste en infobulle), l'âge de la dernière mesure intérieure et extérieure, et l'inhibition quand elle est utilisée. Quand rien n'est à signaler, il SHALL le dire avec une icône de validation.

#### Scenario: Message actif
- **WHEN** `messages` contient `overpowering_detected`
- **THEN** le widget affiche une alerte avec une icône, le texte « Délestage actif » et la couleur d'avertissement

#### Scenario: Mesure ancienne
- **WHEN** la dernière mesure intérieure date de 12 minutes et que le délai de sécurité effectif est de 5 minutes
- **THEN** le widget affiche « il y a 12 minutes » en couleur d'avertissement avec la date complète en infobulle

#### Scenario: Délai de sécurité inconnu
- **WHEN** aucun délai de sécurité n'est connu
- **THEN** l'âge de la mesure s'affiche sans couleur d'avertissement

#### Scenario: Équipement indisponible
- **WHEN** `unavailable_underlying_entities` contient `switch.radiateur_salon`
- **THEN** le widget montre une alerte dont l'infobulle liste `switch.radiateur_salon`

#### Scenario: Rien à signaler
- **WHEN** aucun message n'est actif, que le thermostat est prêt et que les mesures sont récentes
- **THEN** le widget affiche « Aucune alerte » avec une icône de validation et les deux âges

### Requirement: Widget Chauffe TPI
Le widget `core_tpi.widget.heating` SHALL montrer la puissance demandée (0 à 100 %) sur une barre et, quand elles existent, les durées ON et OFF du cycle sur une barre segmentée. Il SHALL être masqué quand l'algorithme n'est pas TPI ou qu'aucune source de la puissance n'existe, et ne SHALL pas afficher la position dans le cycle, que Versatile Thermostat ne publie pas.

#### Scenario: Valeurs affichées
- **WHEN** la puissance demandée est 62 %, la durée ON 186 s et la durée OFF 114 s
- **THEN** la barre montre « 62 % » et la barre segmentée montre « ON 186 s » et « OFF 114 s »

#### Scenario: Thermostat sur climate sans vanne
- **WHEN** le thermostat est de type `over_climate` sans régulation par vanne
- **THEN** le widget est masqué

#### Scenario: Durées absentes
- **WHEN** la puissance existe mais pas les durées du cycle
- **THEN** seule la barre de puissance est affichée

#### Scenario: Puissance indisponible
- **WHEN** la source de la puissance est `unavailable`
- **THEN** la barre affiche « — » avec la mention « indisponible »

### Requirement: Widget Vanne
Le widget `core_valve_regulation.widget.valve` SHALL montrer l'ouverture de la vanne (`valve_open_percent`, en %) sur une jauge, et une barre par vanne quand le thermostat en a plusieurs. Il SHALL être masqué quand aucune source de l'ouverture n'existe.

#### Scenario: Une vanne
- **WHEN** l'ouverture est 40 % pour une seule vanne
- **THEN** le widget montre une jauge à « 40 % » sans barre par vanne

#### Scenario: Plusieurs vannes
- **WHEN** le thermostat a deux vannes ouvertes à 30 % et 50 %
- **THEN** le widget montre la jauge et deux barres libellées avec le nom de chaque vanne

#### Scenario: Thermostat sans vanne
- **WHEN** le thermostat est sur interrupteur
- **THEN** le widget est masqué

### Requirement: Widget Preset et dérogation
Le widget `core_presets.widget.preset` SHALL montrer le preset courant (`preset_mode`) avec son icône, le preset temporisé actif avec le temps restant en texte et l'heure de fin, et la dérogation manuelle avec le preset de reprise. Il SHALL ne montrer ni barre de progression du temporisé, dont la durée totale n'est pas publiée, ni sélecteur de preset.

#### Scenario: Preset courant
- **WHEN** le preset est `eco`
- **THEN** le widget affiche l'icône et le texte « Éco »

#### Scenario: Preset temporisé
- **WHEN** un preset temporisé `boost` est actif avec 25 minutes restantes
- **THEN** le widget affiche « Boost » et « 25 min restantes » avec l'heure de fin, sans barre

#### Scenario: Dérogation manuelle
- **WHEN** `is_manual_override` est vrai et le preset de reprise `comfort`
- **THEN** le widget affiche « Dérogation manuelle » et « reprise : Confort »

#### Scenario: Sans preset
- **WHEN** le preset est `none`
- **THEN** le widget affiche « Aucun preset »

### Requirement: Widget Sécurité
Le widget `core_advanced.widget.safety` SHALL montrer par une icône et un texte si le mode sécurité est actif (`safety_state`), et, pendant la sécurité avec TPI, la part de chauffe imposée sur une barre colorée. Il SHALL être masqué quand la sécurité n'est pas configurée.

#### Scenario: Sécurité normale
- **WHEN** le capteur binaire `safety_state` est éteint
- **THEN** le widget affiche une icône de validation et « Normal »

#### Scenario: Sécurité déclenchée
- **WHEN** `safety_state` est allumé et que la part de chauffe imposée est 25 %
- **THEN** le widget affiche une icône d'alerte, « Mode sécurité actif » et une barre à « 25 % » en couleur d'avertissement

#### Scenario: Sécurité non configurée
- **WHEN** `is_safety_configured` est faux
- **THEN** le widget est masqué

#### Scenario: État indisponible
- **WHEN** `safety_state` vaut `unavailable`
- **THEN** le widget affiche « indisponible » et aucune alerte

### Requirement: Mise en page de la vue d'ensemble d'un thermostat
La vue d'ensemble d'un thermostat SHALL ranger les widgets de base dans cet ordre, par placements déclaratifs : température en premier, puis mode, alertes, chauffe, vanne, preset, sécurité. Un widget masqué SHALL garder sa place, et la vue SHALL transmettre aux conditions de visibilité les valeurs du thermostat et celles de la configuration centrale.

#### Scenario: Ordre par défaut
- **WHEN** un thermostat sur interrupteur a toutes les fonctions de base
- **THEN** les cartes sont, dans l'ordre : Température, Mode et action, Alertes, Chauffe, Preset, Sécurité

#### Scenario: Widget masqué
- **WHEN** la vanne est masquée parce que le thermostat est sur interrupteur
- **THEN** les cartes Preset et Sécurité gardent leur ordre relatif

#### Scenario: Insertion par un plugin tiers
- **WHEN** un plugin tiers déclare un widget `after: core.widget.mode`
- **THEN** sa carte est placée juste après Mode et action

#### Scenario: Fonctionnalité héritée
- **WHEN** la sécurité est configurée seulement dans la configuration centrale et que le thermostat l'utilise
- **THEN** le widget Sécurité est affiché

### Requirement: Langues, thème et écran étroit des widgets de base
Chaque widget de base SHALL avoir son titre et tous ses libellés en anglais, français et allemand, SHALL utiliser les couleurs du thème clair et sombre, et SHALL rester lisible à 375 px.

#### Scenario: Allemand
- **WHEN** la langue de l'utilisateur est l'allemand
- **THEN** les titres et les libellés des sept widgets sont ceux du catalogue allemand de leur plugin

#### Scenario: Langue non prise en charge
- **WHEN** la langue de l'utilisateur n'est pas prise en charge
- **THEN** les textes sont en anglais

#### Scenario: Thème sombre
- **WHEN** le thème est sombre
- **THEN** aucun texte ni icône ne garde une couleur figée du thème clair

#### Scenario: Mobile
- **WHEN** la vue d'un thermostat est affichée à 375 px
- **THEN** les cartes sont en une colonne et aucun texte n'est coupé

### Requirement: Taille des widgets de base
Les sept widgets de base SHALL occuper une colonne de la grille, sans hauteur minimale, et SHALL ne déclarer aucune `size`.

#### Scenario: Une colonne
- **WHEN** la vue d'un thermostat est affichée à 1 440 px
- **THEN** chacune des cartes de base occupe une seule colonne

#### Scenario: Écran étroit
- **WHEN** la vue est affichée à 375 px
- **THEN** les cartes sont en une colonne, dans le même ordre

### Requirement: Widget Mode central
Le widget `core.widget.central_mode` SHALL montrer le mode central actuel (`Auto`, `Stopped`, `Heat only`, `Cool only`, `Frost protection`) par une icône et un libellé traduit, et SHALL ne dessiner aucun sélecteur. Il SHALL être masqué quand l'entité du mode central n'existe pas.

#### Scenario: Mode affiché
- **WHEN** le mode central est `Frost protection`
- **THEN** le widget affiche l'icône hors-gel et le libellé « Hors-gel » en français

#### Scenario: Valeur inconnue
- **WHEN** l'état de l'entité est une option que le dashboard ne connaît pas
- **THEN** le widget affiche l'option telle quelle avec une icône générique

#### Scenario: Sans configuration centrale
- **WHEN** aucune configuration centrale n'existe
- **THEN** le widget est masqué

#### Scenario: Entité indisponible
- **WHEN** l'entité du mode central est `unavailable`
- **THEN** le widget affiche « — » avec la mention « indisponible »

### Requirement: Widget Résumé des thermostats
Le widget `core.widget.summary` SHALL montrer sur une barre segmentée le nombre de thermostats en chauffe, au repos, éteints et indisponibles, plus en climatisation quand il y en a au moins un, et lister, avec un lien vers sa vue, chaque thermostat en alerte (messages `safety_detected`, `overpowering_detected` ou `underlying_unavailable`, panne de chauffage ou de refroidissement, équipements indisponibles). Il SHALL ne dessiner aucun graphique.

#### Scenario: Répartition
- **WHEN** trois thermostats chauffent, cinq sont au repos et deux sont éteints
- **THEN** la barre montre 3, 5 et 2 avec leurs libellés et leurs valeurs en texte

#### Scenario: Thermostat en alerte
- **WHEN** le thermostat « Salon » a `safety_detected` dans ses messages
- **THEN** le widget liste « Salon » avec une icône d'alerte et un lien vers sa vue d'ensemble

#### Scenario: Aucune alerte
- **WHEN** aucun thermostat n'est en alerte
- **THEN** le widget affiche « Aucune alerte » avec une icône de validation

#### Scenario: Thermostat indisponible
- **WHEN** l'entité `climate` d'un thermostat est `unavailable`
- **THEN** il est compté comme indisponible et non comme éteint

#### Scenario: Trente thermostats
- **WHEN** l'état d'une entité qui n'appartient à aucun thermostat change
- **THEN** le widget n'est pas redessiné

### Requirement: Widget Température extérieure
Le widget `core.widget.outdoor` SHALL montrer la valeur du capteur extérieur de la configuration centrale et sa courbe sur 24 heures, avec l'unité de l'entité. Il SHALL être masqué quand la configuration centrale n'a pas de capteur extérieur ou que son entité n'existe pas.

#### Scenario: Valeur et courbe
- **WHEN** le capteur extérieur vaut 6,2 °C et que son historique existe
- **THEN** le widget affiche « 6,2 °C » et la courbe des 24 dernières heures avec un résumé textuel

#### Scenario: Historique indisponible
- **WHEN** la lecture de l'historique échoue
- **THEN** le widget affiche la valeur courante et un message « historique indisponible » à la place de la courbe

#### Scenario: Sans capteur extérieur
- **WHEN** la configuration centrale n'a pas de capteur extérieur
- **THEN** le widget est masqué

### Requirement: Widget Chaudière centrale
Le widget `core_central_boiler.widget.boiler` SHALL montrer si la chaudière est appelée (capteur binaire `central_boiler_state`), le nombre de thermostats demandeurs sur une jauge dont le repère est le seuil du nombre d'équipements, la liste des demandeurs avec un lien vers chacun, un sablier quand l'activation est différée et une alerte quand la chaudière n'est pas prête. Il SHALL être masqué quand le capteur binaire n'existe pas.

#### Scenario: Chaudière appelée
- **WHEN** la chaudière est allumée, avec 3 demandeurs pour un seuil de 2
- **THEN** le widget affiche l'icône de chaudière allumée, la jauge à « 3 » avec le repère 2 et les trois noms

#### Scenario: Activation différée
- **WHEN** `activation_scheduled` est vrai avec `delayed_activation_sec` à 30
- **THEN** le widget affiche un sablier et « activation dans 30 s »

#### Scenario: Chaudière non prête
- **WHEN** `is_central_boiler_ready` est faux
- **THEN** le widget affiche une alerte « Chaudière non prête »

#### Scenario: Fonction éteinte
- **WHEN** la chaudière centrale n'est pas activée dans la configuration centrale
- **THEN** le widget est masqué

### Requirement: Widget Puissance demandée à la chaudière
Le widget `core_central_boiler.widget.boiler_power` SHALL montrer la puissance totale demandée (capteur `total_power_active_boiler`) sur une jauge dont le repère est le seuil de puissance, et sa courbe sur 24 heures. Il SHALL être masqué quand ce capteur n'existe pas.

#### Scenario: Valeur et seuil
- **WHEN** la puissance demandée est 1 800 W et le seuil 1 000 W
- **THEN** la jauge affiche « 1 800 W » avec le repère « 1 000 W »

#### Scenario: Seuil de puissance inutilisé
- **WHEN** le capteur de puissance n'existe pas
- **THEN** le widget est masqué

#### Scenario: Unité kW
- **WHEN** le capteur est en kW
- **THEN** la valeur, le repère et la courbe sont en kW

### Requirement: Widget Puissance du logement
Le widget `core_power.widget.house_power` SHALL montrer la puissance courante et la puissance maximale du logement (`power_manager.current_power` et `current_max_power` d'un thermostat) sur une jauge, la marge calculée par le dashboard, et l'énergie totale des thermostats seulement quand tous les compteurs ont la même unité. Il SHALL être masqué quand aucun thermostat ne publie la puissance courante.

#### Scenario: Valeurs affichées
- **WHEN** la puissance courante est 4,1 kW pour un maximum de 6 kW
- **THEN** la jauge affiche « 4,1 / 6 kW » et la marge « 1,9 kW »

#### Scenario: Unités d'énergie différentes
- **WHEN** deux compteurs d'énergie ont des unités différentes
- **THEN** l'énergie totale n'est pas affichée et le reste du widget l'est

#### Scenario: Gestion de puissance éteinte
- **WHEN** aucun thermostat ne publie `power_manager.current_power`
- **THEN** le widget est masqué

#### Scenario: Dépassement
- **WHEN** la puissance courante dépasse le maximum
- **THEN** la jauge est en couleur d'avertissement et la marge affiche « dépassement de 0,4 kW »

### Requirement: Widget Présence
Le widget `core_presence.widget.presence` SHALL montrer la présence globale, lue sur le capteur de présence de la configuration centrale (`presence_sensor_entity_id`) comme Versatile Thermostat le lit (`on` ou `home` présent, `off` ou `not_home` absent, toute autre valeur inconnu), par une icône et un texte « présent », « absent » ou « inconnu », sans bouton. Il SHALL être masqué quand la configuration centrale n'a pas de capteur de présence ou que son entité n'existe pas.

#### Scenario: Présent
- **WHEN** le capteur est allumé
- **THEN** le widget affiche l'icône de présence et « Présent »

#### Scenario: Inconnu
- **WHEN** le capteur est `unknown`
- **THEN** le widget affiche « Inconnu » et non « Absent »

#### Scenario: Détection de présence éteinte
- **WHEN** la configuration centrale n'a pas de capteur de présence
- **THEN** le widget est masqué

### Requirement: Mise en page de la page Overview
La page Overview SHALL ranger les widgets globaux dans cet ordre, par placements déclaratifs : mode central, présence, résumé, chaudière, puissance de la chaudière, puissance du logement, température extérieure. Un widget masqué SHALL garder sa place.

#### Scenario: Ordre par défaut
- **WHEN** toutes les fonctions centrales sont actives
- **THEN** les cartes sont dans l'ordre : Mode central, Présence, Résumé, Chaudière, Puissance de la chaudière, Puissance du logement, Température extérieure

#### Scenario: Chaudière masquée
- **WHEN** la chaudière centrale est éteinte
- **THEN** les autres cartes gardent leur ordre relatif

### Requirement: Langues, thème et écran étroit des widgets globaux
Chaque widget global SHALL avoir son titre et tous ses libellés en anglais, français et allemand, SHALL utiliser les couleurs du thème clair et sombre, et SHALL rester lisible à 375 px.

#### Scenario: Allemand
- **WHEN** la langue de l'utilisateur est l'allemand
- **THEN** les titres, les libellés des modes centraux et les textes des sept widgets sont allemands

#### Scenario: Thème sombre
- **WHEN** le thème est sombre
- **THEN** la barre du résumé, les jauges et les courbes utilisent les couleurs du thème

#### Scenario: Mobile
- **WHEN** la page Overview est affichée à 375 px
- **THEN** les cartes sont en une colonne, et la liste des thermostats en alerte passe à la ligne sans débordement

### Requirement: Taille des widgets globaux
Les widgets Température extérieure et Puissance demandée à la chaudière SHALL occuper deux colonnes et deux lignes, le widget Chaudière centrale une colonne et deux lignes, et les widgets Mode central, Présence, Résumé des thermostats et Puissance du logement une colonne. Sur un écran étroit, chaque widget SHALL occuper une colonne.

#### Scenario: Résumé sur une colonne
- **WHEN** la page Overview est affichée à 1 440 px
- **THEN** la carte du résumé occupe une colonne, après le mode central et la présence

#### Scenario: Courbe sur deux colonnes
- **WHEN** la page Overview est affichée à 1 440 px
- **THEN** la carte de la température extérieure occupe deux colonnes et sa hauteur minimale est de deux lignes

#### Scenario: Écran étroit
- **WHEN** la page Overview est affichée à 375 px
- **THEN** toutes les cartes occupent une colonne et la carte de la chaudière garde sa hauteur minimale

### Requirement: Widget Fenêtre
Le widget `core_window.widget.window` SHALL montrer par une icône et un texte la fenêtre ouverte ou fermée (`window_state`), la détection automatique (`window_auto_state`) quand elle est configurée, le contournement actif (`window_bypass_state`) et l'effet en cours (arrêt, éco, hors-gel, ventilation ou aucun). Il SHALL ne dessiner aucun bouton ni délai restant, et SHALL être masqué quand la détection de fenêtre est éteinte.

#### Scenario: Fenêtre ouverte avec arrêt
- **WHEN** `window_state` est allumé et que la raison du mode est `hvac_off_window_detection`
- **THEN** le widget affiche l'icône de fenêtre ouverte, « Ouverte » et l'effet « Arrêt »

#### Scenario: Effet ventilation
- **WHEN** la raison du mode est `hvac_off_window_detection` et que le thermostat est en mode `fan_only`
- **THEN** le widget affiche l'effet « Ventilation »

#### Scenario: Effet hors-gel
- **WHEN** `messages` contient `target_temp_window_frost`
- **THEN** le widget affiche l'effet « Hors-gel »

#### Scenario: Contournement actif
- **WHEN** `window_bypass_state` est allumé alors que la fenêtre est ouverte
- **THEN** le widget affiche « Contournement actif » et l'effet « Aucun »

#### Scenario: Détection automatique non configurée
- **WHEN** `is_window_auto_configured` est faux
- **THEN** le widget n'affiche pas la ligne de détection automatique

#### Scenario: Fonction éteinte
- **WHEN** la détection de fenêtre est éteinte pour le thermostat
- **THEN** le widget est masqué

#### Scenario: Capteur inconnu
- **WHEN** `window_state` vaut `unknown`
- **THEN** le widget affiche « Inconnu » et l'effet « Aucun »

### Requirement: Widget Mouvement
Le widget `core_motion.widget.motion` SHALL montrer par une icône et un texte le mouvement détecté (`motion_state`) et, quand le message `target_temp_activity_detected` est actif, l'étiquette « preset d'activité en vigueur ». Il SHALL être masqué quand la détection de mouvement est éteinte.

#### Scenario: Mouvement détecté
- **WHEN** `motion_state` est allumé et que le message d'activité est actif
- **THEN** le widget affiche l'icône de mouvement, « Mouvement » et l'étiquette « preset d'activité »

#### Scenario: Pas de mouvement
- **WHEN** `motion_state` est éteint
- **THEN** le widget affiche « Aucun mouvement » sans étiquette

#### Scenario: Fonction éteinte
- **WHEN** la détection de mouvement est éteinte
- **THEN** le widget est masqué

### Requirement: Widget Délestage
Le widget `core_power.widget.overpowering` SHALL montrer par une icône et un texte si le délestage est actif (`overpowering_state`), en couleur d'alerte quand il l'est. Il SHALL être masqué quand la gestion de puissance est éteinte.

#### Scenario: Délestage actif
- **WHEN** `overpowering_state` est allumé
- **THEN** le widget affiche une icône d'alerte et « Délestage actif » en couleur d'avertissement

#### Scenario: Pas de délestage
- **WHEN** `overpowering_state` est éteint
- **THEN** le widget affiche une icône de validation et « Pas de délestage »

#### Scenario: Gestion de puissance éteinte
- **WHEN** la gestion de puissance est éteinte
- **THEN** le widget est masqué

### Requirement: Widget Arrêt et démarrage automatiques
Le widget `core_auto_start_stop.widget.auto_start_stop` SHALL montrer l'arrêt automatique détecté, la fonction activée ou non, l'erreur accumulée sur une jauge dont le repère est son seuil, et la date du dernier basculement en âge relatif. Il SHALL ne dessiner aucun interrupteur ni prochaine action prévue, et SHALL être masqué hors des thermostats `over_climate` qui ont la fonction.

#### Scenario: Valeurs affichées
- **WHEN** l'erreur accumulée est 4,2 pour un seuil de 10 et que l'arrêt est détecté
- **THEN** le widget affiche l'icône d'arrêt, « Arrêt automatique » et une jauge à 4,2 avec le repère 10

#### Scenario: Fonction désactivée
- **WHEN** `auto_start_stop_enable` est faux
- **THEN** le widget affiche « Désactivée » et reste affiché

#### Scenario: Dernier basculement
- **WHEN** le dernier basculement date de deux heures
- **THEN** le widget affiche « il y a 2 heures » avec la date complète en infobulle

#### Scenario: Thermostat sur interrupteur
- **WHEN** le thermostat est de type `over_switch`
- **THEN** le widget est masqué

### Requirement: Widget Verrouillage
Le widget `core_lock.widget.lock` SHALL montrer par une icône de cadenas et un texte si le thermostat est verrouillé (`is_locked`). Il SHALL ne dessiner aucun bouton ni échéance de reverrouillage, et SHALL être masqué quand le verrouillage n'est pas configuré.

#### Scenario: Verrouillé
- **WHEN** `is_locked` est vrai
- **THEN** le widget affiche un cadenas fermé et « Verrouillé »

#### Scenario: Libre
- **WHEN** `is_locked` est faux
- **THEN** le widget affiche un cadenas ouvert et « Libre »

#### Scenario: Verrouillage non configuré
- **WHEN** le verrouillage n'est pas configuré
- **THEN** le widget est masqué

### Requirement: Widget Panne de chauffage
Le widget `core_heating_failure.widget.failure` SHALL montrer la panne de chauffage et la panne de refroidissement (`heating_failure_state`, `cooling_failure_state`), le suivi en cours sur une barre de progression (écoulé sur écoulé plus restant), la cause probable avec un lien vers l'entité en cas de panne, et l'icône de détection suspendue par un modèle quand un modèle est configuré. Il SHALL rester affiché tant que la détection est active, et être masqué sinon.

#### Scenario: Panne active
- **WHEN** `heating_failure_state` est allumé avec `root_cause_entity_id` égal à `switch.radiateur`
- **THEN** le widget affiche une alerte « Panne de chauffage », la cause probable et un lien qui ouvre les informations de `switch.radiateur`

#### Scenario: Suivi en cours
- **WHEN** le suivi de chauffe a 6 minutes écoulées et 4 minutes restantes
- **THEN** la barre affiche 60 % avec « 6 min écoulées, 4 min restantes »

#### Scenario: Aucune panne
- **WHEN** aucune panne ni aucun suivi n'est actif
- **THEN** le widget affiche « Aucune panne » avec une icône de validation

#### Scenario: Détection suspendue
- **WHEN** `is_detection_enabled_by_template` est faux
- **THEN** le widget affiche l'icône « détection suspendue par le modèle »

#### Scenario: Thermostat sur climate sans vanne
- **WHEN** le thermostat est `over_climate` sans régulation par vanne
- **THEN** le widget est masqué

### Requirement: Place des widgets de fonctions
Les widgets de fonctions SHALL se placer après le widget Preset dans cet ordre, par placements déclaratifs : fenêtre, mouvement, délestage, arrêt et démarrage automatiques, verrouillage, panne de chauffage. Un widget masqué SHALL garder sa place.

#### Scenario: Ordre par défaut
- **WHEN** toutes les fonctions sont actives
- **THEN** les cartes de fonctions suivent la carte Preset dans l'ordre : Fenêtre, Mouvement, Délestage, Arrêt automatique, Verrouillage, Panne de chauffage

#### Scenario: Fenêtre masquée
- **WHEN** la détection de fenêtre est éteinte
- **THEN** Mouvement garde sa place relative après Preset

### Requirement: Langues, thème et écran étroit des widgets de fonctions
Chaque widget de fonction SHALL avoir son titre et tous ses libellés en anglais, français et allemand, SHALL utiliser les couleurs du thème clair et sombre, et SHALL rester lisible à 375 px.

#### Scenario: Allemand
- **WHEN** la langue de l'utilisateur est l'allemand
- **THEN** les titres et les libellés des six widgets sont allemands

#### Scenario: Thème sombre
- **WHEN** le thème est sombre
- **THEN** les icônes d'alerte, les jauges et les barres utilisent les couleurs du thème

#### Scenario: Mobile
- **WHEN** la vue d'un thermostat est affichée à 375 px
- **THEN** les six cartes tiennent en une colonne sans texte coupé

### Requirement: Taille des widgets de fonctions
Les six widgets de fonctions SHALL occuper une colonne de la grille, sans hauteur minimale, et SHALL ne déclarer aucune `size`.

#### Scenario: Une colonne
- **WHEN** la vue d'un thermostat est affichée à 1 440 px avec les six fonctions actives
- **THEN** chaque carte de fonction occupe une seule colonne

#### Scenario: Écran étroit
- **WHEN** la vue est affichée à 375 px
- **THEN** les cartes sont en une colonne, dans l'ordre des placements

### Requirement: Widget Historique 24 h
Le widget `core.widget.history` SHALL montrer sur 24 heures la température courante, la consigne et la température extérieure du capteur de la configuration effective du thermostat, puis la puissance TPI sur une seconde courbe quand elle existe, avec le composant de graphique du dashboard et un résumé textuel. Il SHALL charger l'historique seulement quand sa carte est visible, et n'offrir ni sélecteur de période ni commande.

#### Scenario: Courbes affichées
- **WHEN** l'historique de 24 heures existe pour la température, la consigne, un capteur extérieur et la puissance TPI
- **THEN** le widget montre une courbe de températures à trois séries et une courbe de puissance, avec leurs libellés et leurs unités

#### Scenario: Sans puissance TPI
- **WHEN** le thermostat n'a pas de source de puissance
- **THEN** seule la courbe des températures est affichée

#### Scenario: Sans capteur extérieur
- **WHEN** le thermostat n'a pas de capteur extérieur
- **THEN** la courbe n'a pas de série extérieure et la légende ne la cite pas

#### Scenario: Erreur d'historique
- **WHEN** la lecture de l'historique échoue
- **THEN** le widget affiche « historique indisponible » à la place des courbes

#### Scenario: Attribut imbriqué
- **WHEN** le widget cherche l'historique d'une valeur qui n'est pas enregistrée par Home Assistant
- **THEN** il n'affiche aucune série pour cette valeur et ne signale pas d'erreur

#### Scenario: Carte hors de l'écran
- **WHEN** la carte est sous la zone visible
- **THEN** aucune requête d'historique n'est envoyée avant qu'elle devienne visible

### Requirement: Widget Équipements
Le widget `core.widget.devices` SHALL montrer par une icône et le nom de l'entité l'état de chaque équipement sous-jacent, si l'équipement est actif ou devrait l'être (`is_device_active`, `should_device_be_active`, `nb_device_actives`) et le mode de ventilation (`fan_mode`) quand il existe. Il SHALL être masqué quand le thermostat n'a aucun équipement sous-jacent publié.

#### Scenario: Deux équipements
- **WHEN** un thermostat a deux interrupteurs, l'un allumé et l'autre éteint
- **THEN** le widget affiche deux icônes avec leur nom et leur état

#### Scenario: Équipement attendu actif mais éteint
- **WHEN** `should_device_be_active` est vrai et `is_device_active` est faux
- **THEN** le widget affiche une alerte « attendu actif, éteint »

#### Scenario: Équipement indisponible
- **WHEN** l'état d'un équipement sous-jacent est `unavailable`
- **THEN** son icône affiche « indisponible » et les autres équipements restent affichés

#### Scenario: Ventilation
- **WHEN** le thermostat `over_climate` a un `fan_mode` égal à `auto`
- **THEN** le widget affiche l'icône de ventilation et « Auto »

### Requirement: Widget Apprentissage Auto TPI
Le widget `core_tpi.widget.auto_tpi` SHALL montrer par une icône l'état de l'apprentissage (`disabled`, `off`, `bootstrap`, `active`), les cycles appris, les coefficients calculés, la confiance du modèle, la constante de temps thermique, l'état de la capacité de chauffe, le statut du dernier apprentissage et son début. Il SHALL ne dessiner aucun bouton, et SHALL être masqué hors de TPI, quand l'option Auto TPI est éteinte ou que l'état est `disabled`.

#### Scenario: Apprentissage actif
- **WHEN** l'état est `active` avec 42 cycles de chauffe, `calculated_coef_int` à 0,55 et `calculated_coef_ext` à 0,012
- **THEN** le widget affiche l'icône « actif », « 42 cycles » et « coef. int 0,55 · coef. ext 0,012 »

#### Scenario: Confiance du modèle
- **WHEN** `model_confidence` vaut 0,62 (Versatile Thermostat la publie de 0 à 1)
- **THEN** le widget affiche une barre de confiance à 62 %

#### Scenario: Statut du dernier apprentissage
- **WHEN** `last_learning_status` contient un motif d'arrêt
- **THEN** le widget affiche ce texte tel que Versatile Thermostat le donne

#### Scenario: Option éteinte
- **WHEN** l'option Auto TPI n'est pas activée
- **THEN** le widget est masqué

#### Scenario: Apprentissage arrêté
- **WHEN** l'état est `off`
- **THEN** le widget reste affiché avec « Arrêté » et les derniers résultats

### Requirement: Widget Humidité
Le widget `core_humidity.widget.humidity` SHALL montrer l'humidité de la pièce (`current_humidity` de l'entité `climate`) sur une jauge de 0 à 100 %. Il SHALL être masqué quand l'attribut n'existe pas, et ne SHALL pas dessiner de courbe.

#### Scenario: Valeur affichée
- **WHEN** l'humidité est 48,5
- **THEN** la jauge affiche « 48,5 % » (« 48,5 % » en français, « 48.5 % » en anglais)

#### Scenario: Pas de capteur
- **WHEN** l'attribut `current_humidity` est absent
- **THEN** le widget est masqué

#### Scenario: Valeur indisponible
- **WHEN** l'attribut vaut `unknown`
- **THEN** la jauge affiche « — » avec la mention « indisponible »

### Requirement: Widget Suivi de l'équipement
Le widget `core_sync_temp.widget.sync` SHALL montrer la température envoyée à chaque équipement, une alerte quand le suivi de la consigne est suspendu avec sa raison et son nombre de tentatives, et en infobulle l'écart entre la température envoyée et celle constatée par équipement. Il SHALL être masqué hors des thermostats `over_climate` qui publient ces données.

#### Scenario: Suivi suspendu
- **WHEN** `suspended` est vrai avec la raison `max_attempts` et 3 tentatives
- **THEN** le widget affiche une alerte avec la raison et « 3 tentatives »

#### Scenario: Température envoyée
- **WHEN** la température envoyée à `climate.clim_salon` est 20,5 °C
- **THEN** le widget affiche « climate.clim_salon : 20,5 °C »

#### Scenario: Thermostat sur interrupteur
- **WHEN** le thermostat est de type `over_switch`
- **THEN** le widget est masqué

### Requirement: Widget Demande à la chaudière
Le widget `core_central_boiler.widget.thermostat` SHALL montrer par une icône de flamme et un texte si ce thermostat demande la chaudière centrale (équipement actif, thermostat rattaché à la chaudière). Il SHALL être masqué quand le thermostat n'est pas rattaché à la chaudière centrale.

#### Scenario: Demande active
- **WHEN** le thermostat est rattaché à la chaudière et que son équipement est actif
- **THEN** le widget affiche une flamme et « Demande la chaudière »

#### Scenario: Pas de demande
- **WHEN** le thermostat est rattaché à la chaudière et que son équipement est éteint
- **THEN** le widget affiche « Ne demande pas la chaudière »

#### Scenario: Thermostat non rattaché
- **WHEN** le thermostat n'est pas rattaché à la chaudière centrale
- **THEN** le widget est masqué

### Requirement: Widget Énergie du thermostat
Le widget `core_power.widget.energy` SHALL montrer la puissance moyenne du cycle (capteur `mean_power_cycle`) sur une courbe de 24 heures et l'énergie consommée (capteur `energy`) en compteur avec l'unité du capteur. Il SHALL être masqué quand ni l'un ni l'autre capteur n'existe.

#### Scenario: Valeurs affichées
- **WHEN** la puissance moyenne du cycle est 420 W et l'énergie 12,4 kWh
- **THEN** le widget affiche « 420 W », « 12,4 kWh » et la courbe des 24 dernières heures

#### Scenario: Puissance de l'appareil non renseignée
- **WHEN** aucun capteur d'énergie ni de puissance moyenne n'existe
- **THEN** le widget est masqué

#### Scenario: Compteur indisponible
- **WHEN** le capteur d'énergie est `unavailable`
- **THEN** le compteur affiche « — » et la courbe reste affichée

### Requirement: Place des widgets de détail
Les widgets de détail SHALL se placer après les widgets de fonctions par placements déclaratifs : équipements, Auto TPI, demande à la chaudière, énergie, humidité, suivi de l'équipement, puis l'historique en dernier. Un widget masqué SHALL garder sa place.

#### Scenario: Ordre par défaut
- **WHEN** tous les widgets de détail sont visibles
- **THEN** les cartes sont dans l'ordre : Équipements, Auto TPI, Demande à la chaudière, Énergie, Humidité, Suivi de l'équipement, Historique 24 h

#### Scenario: Cible absente
- **WHEN** le widget Équipements est retiré par un plugin tiers
- **THEN** les autres cartes de détail gardent leur ordre relatif

### Requirement: Langues, thème et écran étroit des widgets de détail
Chaque widget de détail SHALL avoir son titre et tous ses libellés en anglais, français et allemand, SHALL utiliser les couleurs du thème clair et sombre, et SHALL rester lisible à 375 px, courbes comprises.

#### Scenario: Allemand
- **WHEN** la langue de l'utilisateur est l'allemand
- **THEN** les titres, les libellés et les axes des courbes des sept widgets sont allemands

#### Scenario: Thème sombre
- **WHEN** le thème est sombre
- **THEN** les courbes, les jauges et les icônes utilisent les couleurs du thème

#### Scenario: Mobile
- **WHEN** la vue d'un thermostat est affichée à 375 px
- **THEN** les courbes occupent la largeur de la carte sans débordement et gardent leur résumé textuel

### Requirement: Taille des widgets de détail
Le widget Historique 24 h SHALL occuper deux colonnes et deux lignes, les widgets Apprentissage Auto TPI et Énergie du thermostat une colonne et deux lignes, et les autres widgets de détail une colonne. Sur un écran étroit, chaque widget SHALL occuper une colonne en gardant sa hauteur minimale.

#### Scenario: Historique sur deux colonnes
- **WHEN** la vue d'un thermostat est affichée à 1 440 px
- **THEN** la carte de l'historique occupe deux colonnes et sa hauteur minimale est de deux lignes

#### Scenario: Auto TPI sur deux lignes
- **WHEN** le widget Apprentissage Auto TPI est affiché
- **THEN** sa carte occupe une colonne et sa hauteur minimale est de deux lignes

#### Scenario: Écran étroit
- **WHEN** la vue est affichée à 375 px
- **THEN** l'historique occupe une colonne et garde sa hauteur de deux lignes

#### Scenario: Un widget large ne bloque pas les suivants
- **WHEN** l'historique de deux colonnes ne tient pas dans la rangée en cours
- **THEN** il passe à la rangée suivante dans l'ordre des placements
