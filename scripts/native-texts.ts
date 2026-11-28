/**
 * The texts of the native plugins that the translations of Versatile Thermostat do not have, in English, French and German.
 *
 * `generate-native-catalogs.ts` adds them to the texts that it takes from Versatile Thermostat. Keep the three languages complete.
 */

import { INSIGHT_COMMON, INSIGHT_SAFETY, INSIGHT_TPI, INSIGHT_WINDOW } from "./insight-texts.ts";
import {
  AUTO_START_STOP_WIDGET_TEXTS,
  AUTO_TPI_WIDGET_TEXTS,
  BOILER_DEMAND_WIDGET_TEXTS,
  BOILER_WIDGET_TEXTS,
  CORE_DETAIL_WIDGET_TEXTS,
  CORE_GLOBAL_WIDGET_TEXTS,
  CORE_WIDGET_TEXTS,
  ENERGY_WIDGET_TEXTS,
  FAILURE_WIDGET_TEXTS,
  HUMIDITY_WIDGET_TEXTS,
  LOCK_WIDGET_TEXTS,
  MOTION_WIDGET_TEXTS,
  OVERPOWERING_WIDGET_TEXTS,
  POWER_WIDGET_TEXTS,
  PRESENCE_WIDGET_TEXTS,
  PRESET_WIDGET_TEXTS,
  SAFETY_WIDGET_TEXTS,
  SYNC_WIDGET_TEXTS,
  TPI_WIDGET_TEXTS,
  VALVE_WIDGET_TEXTS,
  WINDOW_WIDGET_TEXTS,
} from "./widget-texts.ts";

/** A text in the three languages. */
export interface Text {
  readonly en: string;
  readonly fr: string;
  readonly de: string;
}

/**
 * The help of a field: a hint of one sentence, shown under the field, and an explanation of two to five sentences, shown on demand.
 *
 * The dashboard shows the hint, or the help of Versatile Thermostat when there is none. The panel shows the explanation, or the help
 * of Versatile Thermostat when it differs from the hint: so an explanation is only written when that help is not enough, or when the
 * field has a diagram, and it never repeats the hint.
 */
export interface FieldHelp {
  readonly hint: Text;
  readonly info?: Text;
}

/**
 * The help of the fields of the native plugins, by key of Versatile Thermostat. A field that several plugins show has the same help in
 * each of them; `helpOf` gives the keys of the catalog of a plugin.
 */
export const FIELD_HELP: Readonly<Record<string, FieldHelp>> = {
  // Main.
  name: {
    hint: {
      en: "Name of the thermostat in Home Assistant, such as the name of the room.",
      fr: "Nom du thermostat dans Home Assistant, par exemple celui de la pièce.",
      de: "Name des Thermostats in Home Assistant, etwa der Name des Raums.",
    },
  },
  temperature_sensor_entity_id: {
    hint: {
      en: "Measures the room: best in the middle of it, away from the heater and the windows.",
      fr: "Mesure la pièce : de préférence au milieu, loin du radiateur et des fenêtres.",
      de: "Misst den Raum: am besten in der Raummitte, fern von Heizkörper und Fenstern.",
    },
  },
  last_seen_temperature_sensor_entity_id: {
    hint: {
      en: "Optional date sensor that tells when the room sensor last reported.",
      fr: "Capteur de date facultatif qui indique quand le capteur de la pièce a donné signe de vie.",
      de: "Optionaler Datumssensor, der angibt, wann sich der Raumsensor zuletzt gemeldet hat.",
    },
    info: {
      en: "Some sensors only send a value when the temperature changes. If the room stays stable, the thermostat may believe that the sensor is lost and go into safety mode. Give here a sensor that holds the date of the last report of the room sensor, so that a stable temperature is not taken for a lost sensor.",
      fr: "Certains capteurs n'envoient une valeur que quand la température change. Si la pièce reste stable, le thermostat peut croire le capteur perdu et passer en mode sécurité. Indiquez ici un capteur qui contient la date du dernier envoi du capteur de la pièce, pour qu'une température stable ne soit pas prise pour un capteur perdu.",
      de: "Manche Sensoren senden nur dann einen Wert, wenn sich die Temperatur ändert. Bleibt der Raum stabil, kann das Thermostat den Sensor für verloren halten und in den Sicherheitsmodus wechseln. Geben Sie hier einen Sensor an, der das Datum der letzten Meldung des Raumsensors enthält, damit eine stabile Temperatur nicht als verlorener Sensor gilt.",
    },
  },
  external_temperature_sensor_entity_id: {
    hint: {
      en: "Measures the outdoor temperature, so that the heating gives more power when it is cold outside.",
      fr: "Mesure la température extérieure, pour que le chauffage donne plus de puissance quand il fait froid dehors.",
      de: "Misst die Außentemperatur, damit die Heizung bei Kälte draußen mehr Leistung gibt.",
    },
  },
  temp_min: {
    hint: {
      en: "Lowest target that can be set on the thermostat, for example 7°.",
      fr: "Consigne la plus basse que l'on peut régler sur le thermostat, par exemple 7°.",
      de: "Niedrigste Solltemperatur, die am Thermostat einstellbar ist, z. B. 7°.",
    },
  },
  temp_max: {
    hint: {
      en: "Highest target that can be set on the thermostat, for example 35°.",
      fr: "Consigne la plus haute que l'on peut régler sur le thermostat, par exemple 35°.",
      de: "Höchste Solltemperatur, die am Thermostat einstellbar ist, z. B. 35°.",
    },
  },
  step_temperature: {
    hint: {
      en: "Step by which the target goes up or down, for example 0.5° or 0.1°.",
      fr: "Pas de réglage de la consigne, par exemple 0,5° ou 0,1°.",
      de: "Schrittweite, in der sich die Solltemperatur ändert, z. B. 0,5° oder 0,1°.",
    },
  },
  cycle_min: {
    hint: {
      en: "Length of one heating cycle, over which the power is spread; 5 minutes suits most radiators.",
      fr: "Durée d'un cycle de chauffe, sur lequel la puissance est répartie ; 5 minutes conviennent à la plupart des radiateurs.",
      de: "Dauer eines Heizzyklus, auf den die Leistung verteilt wird; 5 Minuten passen zu den meisten Heizkörpern.",
    },
    info: {
      en: "At the start of each cycle, the thermostat computes a power and spreads it over the cycle: at 40 % of a 10-minute cycle, the heater is on for 4 minutes, then off for 6. For a valve, the opening is computed again at each cycle. A short cycle reacts faster but switches more often; a heating with a lot of inertia, such as underfloor heating, needs a longer cycle.",
      fr: "Au début de chaque cycle, le thermostat calcule une puissance et la répartit sur le cycle : à 40 % d'un cycle de 10 minutes, le radiateur chauffe 4 minutes puis s'arrête 6 minutes. Pour une vanne, l'ouverture est recalculée à chaque cycle. Un cycle court réagit plus vite mais commute plus souvent ; un chauffage à forte inertie, comme un plancher chauffant, demande un cycle plus long.",
      de: "Zu Beginn jedes Zyklus berechnet das Thermostat eine Leistung und verteilt sie über den Zyklus: Bei 40 % eines 10-Minuten-Zyklus heizt der Heizkörper 4 Minuten und ist dann 6 Minuten aus. Bei einem Ventil wird die Öffnung in jedem Zyklus neu berechnet. Ein kurzer Zyklus reagiert schneller, schaltet aber häufiger; eine träge Heizung wie eine Fußbodenheizung braucht einen längeren Zyklus.",
    },
  },
  device_power: {
    hint: {
      en: "Power of the heater, for the energy count and the load shedding; with several heaters, their total.",
      fr: "Puissance du radiateur, pour le suivi d'énergie et le délestage ; avec plusieurs radiateurs, leur total.",
      de: "Leistung des Heizgeräts, für die Energiezählung und den Lastabwurf; bei mehreren Geräten ihre Summe.",
    },
    info: {
      en: "Versatile Thermostat uses this power to estimate the energy used and, with the power management, to decide whether the heater can start without going over the limit of the home. When the thermostat drives several heaters, give the total of their powers. Its unit is set in the next field.",
      fr: "Versatile Thermostat utilise cette puissance pour estimer l'énergie consommée et, avec la gestion de la puissance, pour décider si le radiateur peut démarrer sans dépasser la limite du logement. Quand le thermostat commande plusieurs radiateurs, indiquez le total de leurs puissances. Son unité se règle dans le champ suivant.",
      de: "Versatile Thermostat nutzt diese Leistung, um den Energieverbrauch zu schätzen und, mit dem Leistungsmanagement, um zu entscheiden, ob das Gerät starten darf, ohne die Grenze des Hauses zu überschreiten. Steuert das Thermostat mehrere Geräte, geben Sie die Summe ihrer Leistungen an. Die Einheit wird im nächsten Feld eingestellt.",
    },
  },
  power_unit: {
    hint: {
      en: "Unit of the power of the heater: watts or kilowatts.",
      fr: "Unité de la puissance du radiateur : watts ou kilowatts.",
      de: "Einheit der Leistung des Heizgeräts: Watt oder Kilowatt.",
    },
  },
  use_main_central_config: {
    hint: {
      en: "Takes the outdoor sensor and the temperature limits from the central configuration.",
      fr: "Reprend le capteur extérieur et les limites de température de la configuration centrale.",
      de: "Übernimmt den Außensensor und die Temperaturgrenzen aus der zentralen Konfiguration.",
    },
  },
  use_central_mode: {
    hint: {
      en: "Lets the central mode stop this thermostat, or set it to frost protection, with all the others.",
      fr: "Permet au mode central d'arrêter ce thermostat, ou de le passer en hors-gel, avec tous les autres.",
      de: "Erlaubt dem zentralen Modus, dieses Thermostat mit allen anderen zu stoppen oder auf Frostschutz zu setzen.",
    },
  },
  used_by_controls_central_boiler: {
    hint: {
      en: "Starts the central boiler when this thermostat needs heat.",
      fr: "Démarre la chaudière centrale quand ce thermostat a besoin de chauffer.",
      de: "Startet den zentralen Heizkessel, wenn dieses Thermostat Wärme braucht.",
    },
  },
  // Features.
  use_window_feature: {
    hint: {
      en: "Turns the heating off, or down, while a window is open.",
      fr: "Coupe ou réduit le chauffage pendant qu'une fenêtre est ouverte.",
      de: "Schaltet die Heizung aus oder senkt sie ab, solange ein Fenster offen ist.",
    },
  },
  use_motion_feature: {
    hint: {
      en: "Switches between two presets depending on the movements in the room.",
      fr: "Passe d'un pré-réglage à l'autre selon les mouvements dans la pièce.",
      de: "Wechselt je nach Bewegung im Raum zwischen zwei Voreinstellungen.",
    },
  },
  use_power_feature: {
    hint: {
      en: "Sheds the heating when the home would draw more than its power limit.",
      fr: "Déleste le chauffage quand le logement dépasserait sa puissance maximale.",
      de: "Wirft die Heizung ab, wenn das Haus mehr als seine Leistungsgrenze ziehen würde.",
    },
  },
  use_presence_feature: {
    hint: {
      en: "Uses the away temperatures while nobody is at home.",
      fr: "Utilise les températures d'absence quand personne n'est à la maison.",
      de: "Verwendet die Abwesenheitstemperaturen, wenn niemand zu Hause ist.",
    },
  },
  use_auto_start_stop_feature: {
    hint: {
      en: "Turns the device off when it is no longer needed, and on again when it is.",
      fr: "Éteint l'appareil quand il n'est plus utile, et le rallume quand il le redevient.",
      de: "Schaltet das Gerät aus, wenn es nicht mehr gebraucht wird, und wieder ein, wenn doch.",
    },
  },
  use_heating_failure_detection_feature: {
    hint: {
      en: "Warns when the temperature does not follow the heating, as with a broken heater.",
      fr: "Prévient quand la température ne suit pas le chauffage, comme avec un radiateur en panne.",
      de: "Warnt, wenn die Temperatur der Heizung nicht folgt, wie bei einem defekten Heizkörper.",
    },
  },
  use_central_boiler_feature: {
    hint: {
      en: "Adds the control of a central boiler, started when a thermostat needs heat.",
      fr: "Ajoute la commande d'une chaudière centrale, démarrée quand un thermostat a besoin de chauffer.",
      de: "Fügt die Steuerung eines zentralen Heizkessels hinzu, der startet, wenn ein Thermostat Wärme braucht.",
    },
  },
  sync_device_internal_temp: {
    hint: {
      en: "Gives the room temperature to the device, whose own sensor is often wrong near the heat.",
      fr: "Transmet la température de la pièce à l'appareil, dont le capteur interne se trompe souvent près de la chaleur.",
      de: "Übergibt die Raumtemperatur an das Gerät, dessen eigener Sensor nahe der Wärme oft falsch misst.",
    },
  },
  // Type and underlyings.
  underlying_entity_ids: {
    hint: {
      en: "Devices that this thermostat drives: switches, valves or climates, at least one.",
      fr: "Appareils que ce thermostat commande : interrupteurs, vannes ou climates, au moins un.",
      de: "Geräte, die dieses Thermostat steuert: Schalter, Ventile oder Climates, mindestens eines.",
    },
    info: {
      en: "Choose switches for a thermostat over a switch, valves for one over a valve and climates for one over a climate. With several switches, each one heats for the same time in each cycle, but their starts are spread over the cycle: with two switches and a 10-minute cycle, the second one starts 5 minutes after the first. Fewer heaters are then on at the same time and the power drawn is smoother; when the power is high, their heating times overlap.",
      fr: "Choisissez des interrupteurs pour un thermostat sur interrupteur, des vannes pour un thermostat sur vanne et des climates pour un thermostat sur climate. Avec plusieurs interrupteurs, chacun chauffe le même temps à chaque cycle, mais leurs démarrages sont répartis sur le cycle : avec deux interrupteurs et un cycle de 10 minutes, le second démarre 5 minutes après le premier. Moins de radiateurs sont alors allumés en même temps et la puissance appelée est plus régulière ; quand la puissance est élevée, leurs temps de chauffe se chevauchent.",
      de: "Wählen Sie Schalter für ein Thermostat über einen Schalter, Ventile für eines über ein Ventil und Climates für eines über ein Climate. Bei mehreren Schaltern heizt jeder in jedem Zyklus gleich lange, aber ihre Starts werden über den Zyklus verteilt: Bei zwei Schaltern und einem 10-Minuten-Zyklus startet der zweite 5 Minuten nach dem ersten. So sind weniger Heizgeräte gleichzeitig an und die bezogene Leistung ist gleichmäßiger; bei hoher Leistung überschneiden sich ihre Heizzeiten.",
    },
  },
  proportional_function: {
    hint: {
      en: "Algorithm that computes the power; others can be added as plugins.",
      fr: "Algorithme qui calcule la puissance ; d'autres peuvent être ajoutés par des plugins.",
      de: "Algorithmus, der die Leistung berechnet; weitere lassen sich als Plugins hinzufügen.",
    },
  },
  heater_keep_alive: {
    hint: {
      en: "Sends the current command again at this interval, in seconds; leave empty if not needed.",
      fr: "Renvoie la commande en cours à cet intervalle, en secondes ; laissez vide si inutile.",
      de: "Sendet den aktuellen Befehl in diesem Abstand erneut, in Sekunden; leer lassen, wenn unnötig.",
    },
    info: {
      en: "Some switches turn themselves off for safety when they receive no command for a while. With a value, the thermostat sends the current on or off state to its switches again at this interval, for example every 300 seconds. Leave it empty, or at 0, if your switches do not need it.",
      fr: "Certains interrupteurs s'éteignent d'eux-mêmes par sécurité quand ils ne reçoivent aucune commande pendant un moment. Avec une valeur, le thermostat renvoie l'état allumé ou éteint en cours à ses interrupteurs à cet intervalle, par exemple toutes les 300 secondes. Laissez vide, ou à 0, si vos interrupteurs n'en ont pas besoin.",
      de: "Manche Schalter schalten sich aus Sicherheitsgründen selbst ab, wenn sie eine Weile keinen Befehl erhalten. Mit einem Wert sendet das Thermostat den aktuellen Ein- oder Aus-Zustand in diesem Abstand erneut an seine Schalter, z. B. alle 300 Sekunden. Lassen Sie das Feld leer oder auf 0, wenn Ihre Schalter das nicht brauchen.",
    },
  },
  inverse_switch_command: {
    hint: {
      en: "Swaps on and off, for a pilot wire driven through a diode.",
      fr: "Inverse marche et arrêt, pour un fil pilote commandé à travers une diode.",
      de: "Vertauscht Ein und Aus, für einen Steuerdraht (Fil Pilote), der über eine Diode geschaltet wird.",
    },
  },
  vswitch_on_command: {
    hint: {
      en: "Command that turns each device on, needed when it is not a plain switch.",
      fr: "Commande qui allume chaque appareil, nécessaire quand ce n'est pas un simple interrupteur.",
      de: "Befehl, der jedes Gerät einschaltet, nötig, wenn es kein einfacher Schalter ist.",
    },
    info: {
      en: "A switch is turned on with turn_on and off with turn_off. For another device, such as a select or a climate, give one command per device, in the order of the devices, in the form command/attribute:value: for example select_option/option:comfort, or set_hvac_mode/hvac_mode:heat. As soon as one device is not a switch, every device needs its commands, the switches included.",
      fr: "Un interrupteur s'allume avec turn_on et s'éteint avec turn_off. Pour un autre appareil, comme un select ou un climate, indiquez une commande par appareil, dans l'ordre des appareils, sous la forme commande/attribut:valeur : par exemple select_option/option:comfort, ou set_hvac_mode/hvac_mode:heat. Dès qu'un appareil n'est pas un interrupteur, tous les appareils ont besoin de leurs commandes, interrupteurs compris.",
      de: "Ein Schalter wird mit turn_on ein- und mit turn_off ausgeschaltet. Für ein anderes Gerät, etwa ein Select oder ein Climate, geben Sie einen Befehl pro Gerät an, in der Reihenfolge der Geräte, in der Form Befehl/Attribut:Wert: z. B. select_option/option:comfort oder set_hvac_mode/hvac_mode:heat. Sobald ein Gerät kein Schalter ist, brauchen alle Geräte ihre Befehle, auch die Schalter.",
    },
  },
  vswitch_off_command: {
    hint: {
      en: "Command that turns each device off, in the same order as the turn-on commands.",
      fr: "Commande qui éteint chaque appareil, dans le même ordre que les commandes d'allumage.",
      de: "Befehl, der jedes Gerät ausschaltet, in derselben Reihenfolge wie die Einschaltbefehle.",
    },
    info: {
      en: "Use the same form as for the turn-on commands, for example select_option/option:frost_protection or set_hvac_mode/hvac_mode:off. There must be as many turn-off commands as devices and as turn-on commands.",
      fr: "Utilisez la même forme que pour les commandes d'allumage, par exemple select_option/option:frost_protection ou set_hvac_mode/hvac_mode:off. Il faut autant de commandes d'extinction que d'appareils et que de commandes d'allumage.",
      de: "Verwenden Sie dieselbe Form wie für die Einschaltbefehle, z. B. select_option/option:frost_protection oder set_hvac_mode/hvac_mode:off. Es muss so viele Ausschaltbefehle wie Geräte und wie Einschaltbefehle geben.",
    },
  },
  ac_mode: {
    hint: {
      en: "Offers the cooling mode, for an air conditioner or a heat pump.",
      fr: "Propose le mode climatisation, pour un climatiseur ou une pompe à chaleur.",
      de: "Bietet den Kühlmodus an, für eine Klimaanlage oder eine Wärmepumpe.",
    },
  },
  auto_regulation_mode: {
    hint: {
      en: "How Versatile Thermostat corrects the target sent to the device, or drives its valve itself.",
      fr: "Comment Versatile Thermostat corrige la consigne envoyée à l'appareil, ou pilote lui-même sa vanne.",
      de: "Wie Versatile Thermostat die an das Gerät gesendete Solltemperatur korrigiert oder sein Ventil selbst steuert.",
    },
    info: {
      en: "The sensor of a device sits next to its heat, so the device often stops before the room reaches its target. Self-regulation shifts the target sent to the device by a correction that grows with the gap between the room and the target, with its duration and with the cold outside: up to 1.5° in light mode, 2° in medium mode and 3° in strong mode, while slow mode corrects from the average gap of the last day. Expert mode uses settings written in the configuration of Home Assistant. Valve control sets the opening of the valve directly with the TPI algorithm, and adds the section of the valve regulation. Start with light mode and go further only if the target is still not reached after a few days.",
      fr: "Le capteur d'un appareil est placé près de sa chaleur, si bien que l'appareil s'arrête souvent avant que la pièce atteigne sa consigne. L'auto-régulation décale la consigne envoyée à l'appareil d'une correction qui croît avec l'écart entre la pièce et la consigne, avec sa durée et avec le froid extérieur : jusqu'à 1,5° en mode léger, 2° en mode moyen et 3° en mode fort, tandis que le mode lent corrige d'après l'écart moyen de la dernière journée. Le mode expert utilise des réglages écrits dans la configuration de Home Assistant. Le contrôle de vanne règle directement l'ouverture de la vanne avec l'algorithme TPI, et ajoute la section de régulation de vanne. Commencez par le mode léger et n'allez plus loin que si la consigne n'est toujours pas atteinte après quelques jours.",
      de: "Der Sensor eines Geräts sitzt nahe an seiner Wärme, daher schaltet das Gerät oft ab, bevor der Raum seine Solltemperatur erreicht. Die Selbstregulierung verschiebt die an das Gerät gesendete Solltemperatur um eine Korrektur, die mit der Abweichung zwischen Raum und Sollwert, mit ihrer Dauer und mit der Kälte draußen wächst: bis zu 1,5° im leichten, 2° im mittleren und 3° im starken Modus, während der langsame Modus nach der mittleren Abweichung des letzten Tages korrigiert. Der Expertenmodus verwendet Einstellungen aus der Konfiguration von Home Assistant. Die Ventilsteuerung setzt die Öffnung des Ventils direkt mit dem TPI-Algorithmus und fügt den Abschnitt der Ventilregelung hinzu. Beginnen Sie mit dem leichten Modus und gehen Sie nur weiter, wenn der Sollwert nach einigen Tagen noch nicht erreicht wird.",
    },
  },
  auto_regulation_dtemp: {
    hint: {
      en: "Smallest change worth sending to the device: in ° for a climate, in % for a valve.",
      fr: "Plus petit changement qui vaut la peine d'être envoyé à l'appareil : en ° pour un climate, en % pour une vanne.",
      de: "Kleinste Änderung, die an das Gerät gesendet wird: in ° für ein Climate, in % für ein Ventil.",
    },
    info: {
      en: "To spare the device, a new target or a new opening is sent only when it differs from the last one sent by at least this value. For a climate, it is in degrees, 0.5° by default; for a valve, it is in percent of opening, 10 % by default. A larger value means fewer commands, and so a longer battery life, but a coarser regulation. With valve control, the opening threshold is raised to this value when it is lower.",
      fr: "Pour ménager l'appareil, une nouvelle consigne ou une nouvelle ouverture n'est envoyée que si elle diffère de la dernière envoyée d'au moins cette valeur. Pour un climate, elle est en degrés, 0,5° par défaut ; pour une vanne, en pourcentage d'ouverture, 10 % par défaut. Une valeur plus grande donne moins de commandes, donc des piles qui durent plus, mais une régulation plus grossière. Avec le contrôle de vanne, le seuil d'ouverture est relevé à cette valeur s'il est plus bas.",
      de: "Um das Gerät zu schonen, wird eine neue Solltemperatur oder Öffnung nur gesendet, wenn sie sich um mindestens diesen Wert von der zuletzt gesendeten unterscheidet. Für ein Climate ist er in Grad, standardmäßig 0,5°; für ein Ventil in Prozent der Öffnung, standardmäßig 10 %. Ein größerer Wert bedeutet weniger Befehle und damit längere Batterielaufzeit, aber eine gröbere Regelung. Mit Ventilsteuerung wird die Öffnungsschwelle auf diesen Wert angehoben, wenn sie niedriger ist.",
    },
  },
  auto_regulation_periode_min: {
    hint: {
      en: "Shortest time between two commands sent to the device, in minutes.",
      fr: "Temps minimal entre deux commandes envoyées à l'appareil, en minutes.",
      de: "Kürzeste Zeit zwischen zwei an das Gerät gesendeten Befehlen, in Minuten.",
    },
    info: {
      en: "After sending a new target or a new opening, the thermostat waits at least this time before sending another one, unless you change the target yourself. Some devices, such as thermostatic valves on battery or boilers, do not like frequent changes. 5 minutes is a good start; a longer time saves the battery but makes the regulation slower.",
      fr: "Après l'envoi d'une nouvelle consigne ou d'une nouvelle ouverture, le thermostat attend au moins ce temps avant d'en envoyer une autre, sauf si vous changez vous-même la consigne. Certains appareils, comme les têtes thermostatiques sur piles ou les chaudières, n'aiment pas les changements fréquents. 5 minutes est un bon départ ; un temps plus long ménage les piles mais rend la régulation plus lente.",
      de: "Nach dem Senden einer neuen Solltemperatur oder Öffnung wartet das Thermostat mindestens diese Zeit, bevor es eine weitere sendet, außer Sie ändern die Solltemperatur selbst. Manche Geräte, etwa batteriebetriebene Thermostatköpfe oder Heizkessel, mögen keine häufigen Änderungen. 5 Minuten sind ein guter Anfang; eine längere Zeit schont die Batterie, macht die Regelung aber langsamer.",
    },
  },
  auto_fan_mode: {
    hint: {
      en: "Fan speed switched on when a large heating or cooling effort is needed.",
      fr: "Vitesse de ventilation activée quand un gros effort de chauffage ou de refroidissement est nécessaire.",
      de: "Lüfterstufe, die bei großem Heiz- oder Kühlbedarf eingeschaltet wird.",
    },
  },
  auto_regulation_use_device_temp: {
    hint: {
      en: "Takes the device's own sensor into account to correct faster; rarely needed.",
      fr: "Tient compte du capteur interne de l'appareil pour corriger plus vite ; rarement utile.",
      de: "Berücksichtigt den eigenen Sensor des Geräts, um schneller zu korrigieren; selten nötig.",
    },
    info: {
      en: "When the sensor of the device reads much higher than the room, because it is next to the heat, the device may stop although the room is cold. With this option, the target sent to the device is shifted by the gap between its sensor and the room: with 22° on the device, 20° in the room and a target of 21°, the device receives 23°. Use it only if self-regulation alone is not enough.",
      fr: "Quand le capteur de l'appareil indique bien plus que la pièce, parce qu'il est près de la chaleur, l'appareil peut s'arrêter alors que la pièce est froide. Avec cette option, la consigne envoyée à l'appareil est décalée de l'écart entre son capteur et la pièce : avec 22° sur l'appareil, 20° dans la pièce et une consigne de 21°, l'appareil reçoit 23°. Ne l'utilisez que si l'auto-régulation seule ne suffit pas.",
      de: "Misst der Sensor des Geräts deutlich mehr als der Raum, weil er nahe an der Wärme sitzt, kann das Gerät abschalten, obwohl der Raum kalt ist. Mit dieser Option wird die an das Gerät gesendete Solltemperatur um die Abweichung zwischen seinem Sensor und dem Raum verschoben: Bei 22° am Gerät, 20° im Raum und einem Sollwert von 21° erhält das Gerät 23°. Verwenden Sie sie nur, wenn die Selbstregulierung allein nicht ausreicht.",
    },
  },
  // Valve.
  opening_degree_entity_ids: {
    hint: {
      en: "Entity that sets the opening of each valve: one per device, in the same order.",
      fr: "Entité qui règle l'ouverture de chaque vanne : une par appareil, dans le même ordre.",
      de: "Entität, die die Öffnung jedes Ventils einstellt: eine pro Gerät, in derselben Reihenfolge.",
    },
  },
  closing_degree_entity_ids: {
    hint: {
      en: "Optional entity that sets the closing of each valve: one per device, or none.",
      fr: "Entité facultative qui règle la fermeture de chaque vanne : une par appareil, ou aucune.",
      de: "Optionale Entität, die das Schließen jedes Ventils einstellt: eine pro Gerät oder keine.",
    },
  },
  opening_threshold_degree: {
    hint: {
      en: "Requested opening under which the valve stays closed, in %.",
      fr: "Ouverture demandée en dessous de laquelle la vanne reste fermée, en %.",
      de: "Angeforderte Öffnung, unter der das Ventil geschlossen bleibt, in %.",
    },
    info: {
      en: "When the opening requested by the algorithm is under this threshold, the valve is closed, as far as the maximum closing allows. From the threshold up, it opens at the minimum opening, then rises in a straight line to the maximum opening at a request of 100 %. 0, the default, opens the valve as soon as heat is needed. The thermostat counts as heating, also for the central boiler, only above this threshold.",
      fr: "Quand l'ouverture demandée par l'algorithme est sous ce seuil, la vanne est fermée, autant que la fermeture maximale le permet. À partir du seuil, elle s'ouvre à l'ouverture minimale, puis monte en ligne droite jusqu'à l'ouverture maximale pour une demande de 100 %. 0, la valeur par défaut, ouvre la vanne dès qu'il faut chauffer. Le thermostat n'est considéré comme en chauffe, y compris pour la chaudière centrale, qu'au-dessus de ce seuil.",
      de: "Liegt die vom Algorithmus angeforderte Öffnung unter dieser Schwelle, wird das Ventil geschlossen, so weit es das maximale Schließen erlaubt. Ab der Schwelle öffnet es mit der minimalen Öffnung und steigt dann geradlinig bis zur maximalen Öffnung bei einer Anforderung von 100 %. 0, der Standardwert, öffnet das Ventil, sobald Wärme gebraucht wird. Das Thermostat gilt erst oberhalb dieser Schwelle als heizend, auch für den zentralen Heizkessel.",
    },
  },
  min_opening_degrees: {
    hint: {
      en: "Opening as soon as the valve opens, in %: one value per valve, separated by commas.",
      fr: "Ouverture dès que la vanne s'ouvre, en % : une valeur par vanne, séparées par des virgules.",
      de: "Öffnung, sobald das Ventil öffnet, in %: ein Wert pro Ventil, durch Kommas getrennt.",
    },
    info: {
      en: "Many valves let no water through over their first percents. When heat is needed, the valve opens at least to this value, then further as the request grows. Give one value per valve, in the order of the devices, for example 15 or 20, 25, 30; the default is 0. Each value must be lower than the maximum opening of its valve.",
      fr: "Beaucoup de vannes ne laissent passer aucune eau sur leurs premiers pourcents. Quand il faut chauffer, la vanne s'ouvre au moins à cette valeur, puis davantage quand la demande augmente. Indiquez une valeur par vanne, dans l'ordre des appareils, par exemple 15 ou 20, 25, 30 ; la valeur par défaut est 0. Chaque valeur doit être inférieure à l'ouverture maximale de sa vanne.",
      de: "Viele Ventile lassen in ihren ersten Prozent kein Wasser durch. Wird Wärme gebraucht, öffnet das Ventil mindestens auf diesen Wert und dann weiter, wenn die Anforderung steigt. Geben Sie einen Wert pro Ventil an, in der Reihenfolge der Geräte, z. B. 15 oder 20, 25, 30; der Standardwert ist 0. Jeder Wert muss kleiner sein als die maximale Öffnung seines Ventils.",
    },
  },
  max_opening_degrees: {
    hint: {
      en: "Largest opening sent to the valve, in %: one value per valve, separated by commas.",
      fr: "Plus grande ouverture envoyée à la vanne, en % : une valeur par vanne, séparées par des virgules.",
      de: "Größte an das Ventil gesendete Öffnung, in %: ein Wert pro Ventil, durch Kommas getrennt.",
    },
    info: {
      en: "The valve never opens beyond this value, even at full request, which limits the flow of hot water. Give one value per valve, in the order of the devices, for example 80 or 80, 85, 90; the default is 100, the full opening. Each value must be higher than the minimum opening of its valve.",
      fr: "La vanne ne s'ouvre jamais au-delà de cette valeur, même à pleine demande, ce qui limite le débit d'eau chaude. Indiquez une valeur par vanne, dans l'ordre des appareils, par exemple 80 ou 80, 85, 90 ; la valeur par défaut est 100, l'ouverture complète. Chaque valeur doit être supérieure à l'ouverture minimale de sa vanne.",
      de: "Das Ventil öffnet nie über diesen Wert hinaus, auch nicht bei voller Anforderung, was den Durchfluss von Heizwasser begrenzt. Geben Sie einen Wert pro Ventil an, in der Reihenfolge der Geräte, z. B. 80 oder 80, 85, 90; der Standardwert ist 100, die volle Öffnung. Jeder Wert muss größer sein als die minimale Öffnung seines Ventils.",
    },
  },
  max_closing_degree: {
    hint: {
      en: "How far the valve may close, in %: 100 closes it fully, 90 always leaves 10 % open.",
      fr: "Jusqu'où la vanne peut se fermer, en % : 100 la ferme complètement, 90 laisse toujours 10 % ouverts.",
      de: "Wie weit das Ventil schließen darf, in %: 100 schließt es ganz, 90 lässt immer 10 % offen.",
    },
    info: {
      en: "When no heat is needed, the valve closes down to this value, and the opening sent never goes below 100 minus this value. 100, the default, closes the valve completely. A lower value keeps some water flowing, to protect the pump or to avoid the noise of a full closing.",
      fr: "Quand il ne faut pas chauffer, la vanne se ferme jusqu'à cette valeur, et l'ouverture envoyée ne descend jamais sous 100 moins cette valeur. 100, la valeur par défaut, ferme complètement la vanne. Une valeur plus basse laisse toujours circuler un peu d'eau, pour protéger le circulateur ou éviter le bruit d'une fermeture complète.",
      de: "Wird keine Wärme gebraucht, schließt das Ventil bis zu diesem Wert, und die gesendete Öffnung fällt nie unter 100 minus diesen Wert. 100, der Standardwert, schließt das Ventil vollständig. Ein niedrigerer Wert lässt immer etwas Wasser fließen, um die Pumpe zu schützen oder das Geräusch eines vollständigen Schließens zu vermeiden.",
    },
  },
  // TPI.
  use_tpi_central_config: {
    hint: {
      en: "Uses the TPI coefficients of the central configuration.",
      fr: "Utilise les coefficients TPI de la configuration centrale.",
      de: "Verwendet die TPI-Koeffizienten der zentralen Konfiguration.",
    },
  },
  tpi_coef_int: {
    hint: {
      en: "Power given for each degree that the room is under its target; 0.6 by default.",
      fr: "Puissance donnée pour chaque degré qui manque à la pièce pour atteindre sa consigne ; 0,6 par défaut.",
      de: "Leistung pro Grad, das dem Raum zur Solltemperatur fehlt; standardmäßig 0,6.",
    },
    info: {
      en: "At each cycle, the power is coef_int × (target − room) + coef_ext × (target − outdoor), kept between 0 and 100 %. With 0.6, a room 1° under its target gets 60 % of the cycle from this part; 0.6 suits a well-insulated room. Raise it if the room takes too long to reach its target; lower it if the temperature swings around the target.",
      fr: "À chaque cycle, la puissance vaut coef_int × (consigne − pièce) + coef_ext × (consigne − extérieur), limitée entre 0 et 100 %. Avec 0,6, une pièce à 1° sous sa consigne reçoit 60 % du cycle par cette partie ; 0,6 convient à une pièce bien isolée. Augmentez-le si la pièce met trop de temps à atteindre sa consigne ; baissez-le si la température oscille autour de la consigne.",
      de: "In jedem Zyklus beträgt die Leistung coef_int × (Sollwert − Raum) + coef_ext × (Sollwert − außen), begrenzt auf 0 bis 100 %. Mit 0,6 erhält ein Raum 1° unter seinem Sollwert durch diesen Teil 60 % des Zyklus; 0,6 passt zu einem gut gedämmten Raum. Erhöhen Sie ihn, wenn der Raum zu lange braucht, um den Sollwert zu erreichen; senken Sie ihn, wenn die Temperatur um den Sollwert schwankt.",
    },
  },
  tpi_coef_ext: {
    hint: {
      en: "Power added for each degree that it is colder outside than the target; 0.01 by default.",
      fr: "Puissance ajoutée pour chaque degré de moins dehors que la consigne ; 0,01 par défaut.",
      de: "Zusätzliche Leistung pro Grad, das es draußen kälter ist als der Sollwert; standardmäßig 0,01.",
    },
    info: {
      en: "At each cycle, the power is coef_int × (target − room) + coef_ext × (target − outdoor), kept between 0 and 100 %. This part makes up for the heat lost to the outside: with 0.01 and 15° less outside than the target, it adds 15 % of the cycle. Raise it if the room stays under its target once stable; lower it if the room stays above.",
      fr: "À chaque cycle, la puissance vaut coef_int × (consigne − pièce) + coef_ext × (consigne − extérieur), limitée entre 0 et 100 %. Cette partie compense la chaleur perdue vers l'extérieur : avec 0,01 et 15° de moins dehors que la consigne, elle ajoute 15 % du cycle. Augmentez-le si la pièce reste sous sa consigne une fois stable ; baissez-le si elle reste au-dessus.",
      de: "In jedem Zyklus beträgt die Leistung coef_int × (Sollwert − Raum) + coef_ext × (Sollwert − außen), begrenzt auf 0 bis 100 %. Dieser Teil gleicht die nach außen verlorene Wärme aus: Mit 0,01 und draußen 15° weniger als der Sollwert fügt er 15 % des Zyklus hinzu. Erhöhen Sie ihn, wenn der Raum im eingeschwungenen Zustand unter dem Sollwert bleibt; senken Sie ihn, wenn er darüber bleibt.",
    },
  },
  minimal_activation_delay: {
    hint: {
      en: "Shortest heating time worth starting, in seconds; shorter ones are skipped.",
      fr: "Temps de chauffe le plus court qui vaut la peine, en secondes ; les plus courts sont sautés.",
      de: "Kürzeste Heizzeit, die sich lohnt, in Sekunden; kürzere werden ausgelassen.",
    },
    info: {
      en: "When the heating time computed for a cycle is shorter than this delay, the heater stays off for the whole cycle: a very short burst warms nothing and wears the relay. With a 5-minute cycle and 10 seconds, a power of 3 %, or 9 seconds, gives no heating. 0 turns this limit off.",
      fr: "Quand le temps de chauffe calculé pour un cycle est plus court que ce délai, le radiateur reste éteint tout le cycle : une chauffe très brève ne réchauffe rien et use le relais. Avec un cycle de 5 minutes et 10 secondes, une puissance de 3 %, soit 9 secondes, ne donne aucune chauffe. 0 désactive cette limite.",
      de: "Ist die für einen Zyklus berechnete Heizzeit kürzer als diese Verzögerung, bleibt das Gerät den ganzen Zyklus aus: Ein sehr kurzer Heizstoß wärmt nichts und verschleißt das Relais. Bei einem 5-Minuten-Zyklus und 10 Sekunden ergibt eine Leistung von 3 %, also 9 Sekunden, kein Heizen. 0 schaltet diese Grenze ab.",
    },
  },
  minimal_deactivation_delay: {
    hint: {
      en: "Shortest pause worth making, in seconds; shorter ones are skipped and the heater stays on.",
      fr: "Pause la plus courte qui vaut la peine, en secondes ; les plus courtes sont sautées et le radiateur reste allumé.",
      de: "Kürzeste Pause, die sich lohnt, in Sekunden; kürzere entfallen und das Gerät bleibt an.",
    },
    info: {
      en: "When the pause computed for a cycle is shorter than this delay, the heater stays on for the whole cycle. With a 5-minute cycle and 30 seconds, a power of 92 %, which leaves a pause of 24 seconds, heats during the whole cycle. 0, the default, turns this limit off.",
      fr: "Quand la pause calculée pour un cycle est plus courte que ce délai, le radiateur reste allumé tout le cycle. Avec un cycle de 5 minutes et 30 secondes, une puissance de 92 %, qui laisse une pause de 24 secondes, chauffe pendant tout le cycle. 0, la valeur par défaut, désactive cette limite.",
      de: "Ist die für einen Zyklus berechnete Pause kürzer als diese Verzögerung, bleibt das Gerät den ganzen Zyklus an. Bei einem 5-Minuten-Zyklus und 30 Sekunden heizt eine Leistung von 92 %, die eine Pause von 24 Sekunden ließe, den ganzen Zyklus. 0, der Standardwert, schaltet diese Grenze ab.",
    },
  },
  tpi_threshold_low: {
    hint: {
      en: "Gap above the target under which the heating starts again, in °; 0 turns the thresholds off.",
      fr: "Écart au-dessus de la consigne sous lequel le chauffage reprend, en ° ; 0 désactive les seuils.",
      de: "Abstand über dem Sollwert, unter dem wieder geheizt wird, in °; 0 schaltet die Schwellen ab.",
    },
    info: {
      en: "Once the heating has stopped because the room went too far above its target, it starts again when the temperature falls back under the target plus this threshold. Example: target 20°, high threshold 2° and low threshold 1°: the heating stops above 22° and starts again under 21°. Both thresholds must be set, the high one above the low one; with one at 0, none applies.",
      fr: "Une fois le chauffage arrêté parce que la pièce a trop dépassé sa consigne, il reprend quand la température redescend sous la consigne plus ce seuil. Exemple : consigne 20°, seuil haut 2° et seuil bas 1° : le chauffage s'arrête au-dessus de 22° et reprend sous 21°. Les deux seuils doivent être réglés, le haut au-dessus du bas ; si l'un vaut 0, aucun ne s'applique.",
      de: "Wurde das Heizen gestoppt, weil der Raum zu weit über dem Sollwert lag, setzt es wieder ein, wenn die Temperatur unter Sollwert plus diese Schwelle fällt. Beispiel: Sollwert 20°, obere Schwelle 2° und untere Schwelle 1°: Das Heizen stoppt über 22° und setzt unter 21° wieder ein. Beide Schwellen müssen gesetzt sein, die obere über der unteren; ist eine 0, gilt keine.",
    },
  },
  tpi_threshold_high: {
    hint: {
      en: "Gap above the target over which the heating stops, in °; 0 turns the thresholds off.",
      fr: "Écart au-dessus de la consigne au-delà duquel le chauffage s'arrête, en ° ; 0 désactive les seuils.",
      de: "Abstand über dem Sollwert, ab dem das Heizen stoppt, in °; 0 schaltet die Schwellen ab.",
    },
    info: {
      en: "When the temperature rises above the target plus this threshold, the power is forced to 0, which stops the heating when the room overshoots. It starts again once the temperature falls back under the target plus the low threshold. Example: target 20°, high threshold 2° and low threshold 1°: the heating stops above 22° and starts again under 21°. Both thresholds must be set, the high one above the low one; with one at 0, none applies.",
      fr: "Quand la température monte au-dessus de la consigne plus ce seuil, la puissance est forcée à 0, ce qui arrête le chauffage quand la pièce dépasse sa consigne. Il reprend quand la température redescend sous la consigne plus le seuil bas. Exemple : consigne 20°, seuil haut 2° et seuil bas 1° : le chauffage s'arrête au-dessus de 22° et reprend sous 21°. Les deux seuils doivent être réglés, le haut au-dessus du bas ; si l'un vaut 0, aucun ne s'applique.",
      de: "Steigt die Temperatur über Sollwert plus diese Schwelle, wird die Leistung auf 0 gesetzt, was das Heizen stoppt, wenn der Raum überschwingt. Es setzt wieder ein, wenn die Temperatur unter Sollwert plus untere Schwelle fällt. Beispiel: Sollwert 20°, obere Schwelle 2° und untere Schwelle 1°: Das Heizen stoppt über 22° und setzt unter 21° wieder ein. Beide Schwellen müssen gesetzt sein, die obere über der unteren; ist eine 0, gilt keine.",
    },
  },
  // Auto TPI.
  auto_tpi_mode: {
    hint: {
      en: "Lets the thermostat learn its TPI coefficients; each learning session is started by hand.",
      fr: "Permet au thermostat d'apprendre ses coefficients TPI ; chaque session d'apprentissage se lance à la main.",
      de: "Lässt das Thermostat seine TPI-Koeffizienten lernen; jede Lernsitzung wird von Hand gestartet.",
    },
    info: {
      en: "Auto TPI watches how the room reacts to the heating and computes the two coefficients for you. Learning does not start by itself: start a session with the Auto TPI learning card or with the action set_auto_tpi_mode, after reading its documentation.",
      fr: "Auto TPI observe comment la pièce réagit au chauffage et calcule les deux coefficients pour vous. L'apprentissage ne démarre pas tout seul : lancez une session avec la carte d'apprentissage Auto TPI ou avec l'action set_auto_tpi_mode, après avoir lu sa documentation.",
      de: "Auto TPI beobachtet, wie der Raum auf das Heizen reagiert, und berechnet die beiden Koeffizienten für Sie. Das Lernen startet nicht von selbst: Starten Sie eine Sitzung mit der Auto-TPI-Lernkarte oder mit der Aktion set_auto_tpi_mode, nachdem Sie die Dokumentation gelesen haben.",
    },
  },
  auto_tpi_learning_type: {
    hint: {
      en: "Discovery for a first learning, Fine tuning to adjust coefficients that already work.",
      fr: "Découverte pour un premier apprentissage, Réglage fin pour ajuster des coefficients qui fonctionnent déjà.",
      de: "Entdeckung für ein erstes Lernen, Feinabstimmung für Koeffizienten, die schon funktionieren.",
    },
    info: {
      en: "Discovery quickly finds coefficients for a new installation, from a weighted average of the cycles. Fine tuning refines coefficients that already work, with a smoothed average that changes them slowly. If the coefficients drift or the comfort gets worse, start a new session in Discovery.",
      fr: "Découverte trouve vite des coefficients pour une nouvelle installation, par une moyenne pondérée des cycles. Réglage fin affine des coefficients qui fonctionnent déjà, par une moyenne lissée qui les change lentement. Si les coefficients dérivent ou si le confort se dégrade, relancez une session en Découverte.",
      de: "Entdeckung findet schnell Koeffizienten für eine neue Anlage, aus einem gewichteten Mittel der Zyklen. Feinabstimmung verfeinert Koeffizienten, die schon funktionieren, mit einem geglätteten Mittel, das sie langsam ändert. Driften die Koeffizienten oder sinkt der Komfort, starten Sie eine neue Sitzung im Modus Entdeckung.",
    },
  },
  auto_tpi_aggressiveness: {
    hint: {
      en: "Reduces the coefficients found, from 0.5 to 1, to limit overshooting the target.",
      fr: "Réduit les coefficients trouvés, de 0,5 à 1, pour limiter les dépassements de consigne.",
      de: "Verringert die gefundenen Koeffizienten, von 0,5 bis 1, um Überschwingen zu begrenzen.",
    },
    info: {
      en: "The coefficients learned are multiplied by this value: 1 keeps them as found, 0.8 keeps 80 % of them. Lower it, for example to 0.8, if the room often goes above its target after the learning.",
      fr: "Les coefficients appris sont multipliés par cette valeur : 1 les garde tels quels, 0,8 en garde 80 %. Baissez-la, par exemple à 0,8, si la pièce dépasse souvent sa consigne après l'apprentissage.",
      de: "Die gelernten Koeffizienten werden mit diesem Wert multipliziert: 1 behält sie unverändert, 0,8 behält 80 % davon. Senken Sie ihn, z. B. auf 0,8, wenn der Raum nach dem Lernen oft über den Sollwert steigt.",
    },
  },
  heater_heating_time: {
    hint: {
      en: "Time that the heater needs to reach its full power, in minutes.",
      fr: "Temps dont le radiateur a besoin pour atteindre sa pleine puissance, en minutes.",
      de: "Zeit, die das Heizgerät bis zur vollen Leistung braucht, in Minuten.",
    },
    info: {
      en: "Auto TPI uses it to tell the effect of the heating from its delay. Typical values: 5 minutes for an electric radiator, 15 for a water radiator, 30 for underfloor heating.",
      fr: "Auto TPI s'en sert pour distinguer l'effet du chauffage de son retard. Valeurs courantes : 5 minutes pour un radiateur électrique, 15 pour un radiateur à eau, 30 pour un plancher chauffant.",
      de: "Auto TPI unterscheidet damit die Wirkung des Heizens von seiner Verzögerung. Übliche Werte: 5 Minuten für einen Elektroheizkörper, 15 für einen Wasserheizkörper, 30 für eine Fußbodenheizung.",
    },
  },
  heater_cooling_time: {
    hint: {
      en: "Time that the heater needs to cool down after it stops, in minutes.",
      fr: "Temps dont le radiateur a besoin pour refroidir après son arrêt, en minutes.",
      de: "Zeit, die das Heizgerät nach dem Abschalten zum Abkühlen braucht, in Minuten.",
    },
    info: {
      en: "Auto TPI uses it to know how long the heater keeps warming the room after it stops. Typical values: 7 minutes for an electric radiator, 20 for a water radiator, 45 for underfloor heating.",
      fr: "Auto TPI s'en sert pour savoir combien de temps le radiateur chauffe encore la pièce après son arrêt. Valeurs courantes : 7 minutes pour un radiateur électrique, 20 pour un radiateur à eau, 45 pour un plancher chauffant.",
      de: "Auto TPI weiß damit, wie lange das Heizgerät den Raum nach dem Abschalten noch wärmt. Übliche Werte: 7 Minuten für einen Elektroheizkörper, 20 für einen Wasserheizkörper, 45 für eine Fußbodenheizung.",
    },
  },
  auto_tpi_heating_rate: {
    hint: {
      en: "How fast the heater warms the room, per hour; 0 lets the thermostat learn it.",
      fr: "Vitesse à laquelle le radiateur réchauffe la pièce, par heure ; 0 laisse le thermostat l'apprendre.",
      de: "Wie schnell das Heizgerät den Raum erwärmt, pro Stunde; 0 lässt das Thermostat es lernen.",
    },
    info: {
      en: "It is the rise of the room temperature per hour when the heater runs at full power. Leave 0: the thermostat then measures it from the history, or with a few heating cycles at full power at the start of the learning. Set it only if you know it.",
      fr: "C'est la montée de la température de la pièce par heure quand le radiateur chauffe à pleine puissance. Laissez 0 : le thermostat la mesure alors d'après l'historique, ou par quelques cycles à pleine puissance au début de l'apprentissage. Ne la réglez que si vous la connaissez.",
      de: "Das ist der Anstieg der Raumtemperatur pro Stunde, wenn das Heizgerät mit voller Leistung läuft. Lassen Sie 0: Das Thermostat misst ihn dann aus dem Verlauf oder mit einigen Zyklen bei voller Leistung zu Beginn des Lernens. Setzen Sie ihn nur, wenn Sie ihn kennen.",
    },
  },
  auto_tpi_continuous_kext: {
    hint: {
      en: "Keeps adjusting the outdoor coefficient between the learning sessions.",
      fr: "Continue d'ajuster le coefficient extérieur entre les sessions d'apprentissage.",
      de: "Passt den Außenkoeffizienten auch zwischen den Lernsitzungen weiter an.",
    },
    info: {
      en: "Once a learning session has measured the effect of the outdoor temperature, this option keeps correcting the outdoor coefficient little by little in normal use. It follows the seasons and the changes of the insulation without a new session. Its speed is set by the continuous Kext alpha.",
      fr: "Une fois qu'une session d'apprentissage a mesuré l'effet de la température extérieure, cette option continue de corriger peu à peu le coefficient extérieur en usage normal. Elle suit les saisons et les changements de l'isolation sans nouvelle session. Sa vitesse se règle avec l'alpha du Kext continu.",
      de: "Hat eine Lernsitzung die Wirkung der Außentemperatur gemessen, korrigiert diese Option den Außenkoeffizienten im normalen Betrieb nach und nach weiter. Sie folgt den Jahreszeiten und Änderungen der Dämmung ohne neue Sitzung. Ihre Geschwindigkeit wird mit dem Alpha des kontinuierlichen Kext eingestellt.",
    },
  },
  auto_tpi_enable_advanced_settings: {
    hint: {
      en: "Shows the fine settings of the learning: weight, alpha and decay.",
      fr: "Affiche les réglages fins de l'apprentissage : poids, alpha et décroissance.",
      de: "Zeigt die Feineinstellungen des Lernens: Gewicht, Alpha und Abnahme.",
    },
  },
  auto_tpi_avg_initial_weight: {
    hint: {
      en: "Weight of the current coefficients against the new ones, in Discovery.",
      fr: "Poids des coefficients actuels face aux nouveaux, en Découverte.",
      de: "Gewicht der aktuellen Koeffizienten gegenüber den neuen, im Modus Entdeckung.",
    },
    info: {
      en: "At 1, the coefficients found replace the current ones almost entirely: the learning is fast but sensitive to disturbances. At 50, the current coefficients weigh much more: the learning is very slow but stable. Keep 1 for a first learning; use about 25 to resume an interrupted learning without losing its progress.",
      fr: "À 1, les coefficients trouvés remplacent presque entièrement les actuels : l'apprentissage est rapide mais sensible aux perturbations. À 50, les coefficients actuels pèsent bien plus : l'apprentissage est très lent mais stable. Gardez 1 pour un premier apprentissage ; utilisez environ 25 pour reprendre un apprentissage interrompu sans perdre ses progrès.",
      de: "Bei 1 ersetzen die gefundenen Koeffizienten die aktuellen fast vollständig: Das Lernen ist schnell, aber störanfällig. Bei 50 wiegen die aktuellen Koeffizienten viel mehr: Das Lernen ist sehr langsam, aber stabil. Behalten Sie 1 für ein erstes Lernen; nehmen Sie etwa 25, um ein unterbrochenes Lernen fortzusetzen, ohne seinen Fortschritt zu verlieren.",
    },
  },
  auto_tpi_ema_alpha: {
    hint: {
      en: "How much each new cycle changes the coefficients in Fine tuning, from 0 to 1.",
      fr: "À quel point chaque nouveau cycle change les coefficients en Réglage fin, de 0 à 1.",
      de: "Wie stark jeder neue Zyklus die Koeffizienten in der Feinabstimmung ändert, von 0 bis 1.",
    },
    info: {
      en: "A higher value follows the recent changes faster, but reacts more to disturbances such as a sunny afternoon. 0.15, the default, is a good balance.",
      fr: "Une valeur plus haute suit plus vite les changements récents, mais réagit davantage aux perturbations, comme un après-midi ensoleillé. 0,15, la valeur par défaut, est un bon compromis.",
      de: "Ein höherer Wert folgt den jüngsten Änderungen schneller, reagiert aber stärker auf Störungen wie einen sonnigen Nachmittag. 0,15, der Standardwert, ist ein guter Kompromiss.",
    },
  },
  auto_tpi_ema_decay_rate: {
    hint: {
      en: "How fast the alpha decreases over time, to settle on stable coefficients.",
      fr: "Vitesse à laquelle l'alpha diminue avec le temps, pour se stabiliser sur des coefficients fiables.",
      de: "Wie schnell das Alpha mit der Zeit sinkt, um sich auf stabile Koeffizienten einzupendeln.",
    },
  },
  auto_tpi_continuous_kext_alpha: {
    hint: {
      en: "Speed of the continuous adjustment of the outdoor coefficient, from 0.005 to 0.2.",
      fr: "Vitesse de l'ajustement continu du coefficient extérieur, de 0,005 à 0,2.",
      de: "Geschwindigkeit der laufenden Anpassung des Außenkoeffizienten, von 0,005 bis 0,2.",
    },
    info: {
      en: "The default, 0.04, adapts in about 3 to 5 days. A higher value follows the changes of the weather faster, but reacts more to unusual days.",
      fr: "La valeur par défaut, 0,04, s'adapte en 3 à 5 jours environ. Une valeur plus haute suit plus vite les changements de météo, mais réagit davantage aux journées inhabituelles.",
      de: "Der Standardwert 0,04 passt sich in etwa 3 bis 5 Tagen an. Ein höherer Wert folgt Wetteränderungen schneller, reagiert aber stärker auf ungewöhnliche Tage.",
    },
  },
  // Presets.
  use_presets_central_config: {
    hint: {
      en: "Uses the preset temperatures of the central configuration.",
      fr: "Utilise les températures des pré-réglages de la configuration centrale.",
      de: "Verwendet die Temperaturen der Voreinstellungen der zentralen Konfiguration.",
    },
  },
  // Central boiler.
  central_boiler_activation_delay_sec: {
    hint: {
      en: "Wait before starting the boiler, in seconds, for example to let the valves open.",
      fr: "Attente avant de démarrer la chaudière, en secondes, par exemple pour laisser les vannes s'ouvrir.",
      de: "Wartezeit vor dem Start des Heizkessels, in Sekunden, z. B. damit die Ventile öffnen.",
    },
    info: {
      en: "When heat is needed, the boiler starts only after this delay; 0, the default, starts it at once. Some valves of underfloor heating take several minutes to open: a delay keeps the pump from running against closed valves.",
      fr: "Quand il faut chauffer, la chaudière ne démarre qu'après ce délai ; 0, la valeur par défaut, la démarre aussitôt. Certaines vannes de plancher chauffant mettent plusieurs minutes à s'ouvrir : un délai évite de faire tourner le circulateur contre des vannes fermées.",
      de: "Wird Wärme gebraucht, startet der Heizkessel erst nach dieser Verzögerung; 0, der Standardwert, startet ihn sofort. Manche Ventile einer Fußbodenheizung brauchen mehrere Minuten zum Öffnen: Eine Verzögerung verhindert, dass die Pumpe gegen geschlossene Ventile läuft.",
    },
  },
  central_boiler_activation_service: {
    hint: {
      en: "Action that starts the boiler, written entity/action, with an optional attribute.",
      fr: "Action qui démarre la chaudière, écrite entité/action, avec un attribut facultatif.",
      de: "Aktion, die den Heizkessel startet, geschrieben als Entität/Aktion, mit optionalem Attribut.",
    },
    info: {
      en: "Write entity/action[/attribute:value], for example switch.boiler_pump/switch.turn_on or climate.boiler/climate.set_hvac_mode/hvac_mode:heat. The value may be a Home Assistant template, rendered each time the command is sent.",
      fr: "Écrivez entité/action[/attribut:valeur], par exemple switch.pompe_chaudiere/switch.turn_on ou climate.chaudiere/climate.set_hvac_mode/hvac_mode:heat. La valeur peut être un modèle Home Assistant, calculé à chaque envoi de la commande.",
      de: "Schreiben Sie Entität/Aktion[/Attribut:Wert], z. B. switch.kesselpumpe/switch.turn_on oder climate.heizkessel/climate.set_hvac_mode/hvac_mode:heat. Der Wert kann ein Home-Assistant-Template sein, das bei jedem Senden des Befehls berechnet wird.",
    },
  },
  central_boiler_deactivation_service: {
    hint: {
      en: "Action that stops the boiler, written like the action that starts it.",
      fr: "Action qui arrête la chaudière, écrite comme l'action qui la démarre.",
      de: "Aktion, die den Heizkessel stoppt, geschrieben wie die Aktion zum Starten.",
    },
    info: {
      en: "Write entity/action[/attribute:value], for example switch.boiler_pump/switch.turn_off or climate.boiler/climate.set_hvac_mode/hvac_mode:off. It is sent when no thermostat needs heat any more.",
      fr: "Écrivez entité/action[/attribut:valeur], par exemple switch.pompe_chaudiere/switch.turn_off ou climate.chaudiere/climate.set_hvac_mode/hvac_mode:off. Elle est envoyée quand plus aucun thermostat n'a besoin de chauffer.",
      de: "Schreiben Sie Entität/Aktion[/Attribut:Wert], z. B. switch.kesselpumpe/switch.turn_off oder climate.heizkessel/climate.set_hvac_mode/hvac_mode:off. Sie wird gesendet, wenn kein Thermostat mehr Wärme braucht.",
    },
  },
  keep_alive_boiler_delay_sec: {
    hint: {
      en: "Sends the boiler command again at this interval, in seconds; 0 never resends it.",
      fr: "Renvoie la commande de la chaudière à cet intervalle, en secondes ; 0 ne la renvoie jamais.",
      de: "Sendet den Befehl an den Heizkessel in diesem Abstand erneut, in Sekunden; 0 nie.",
    },
  },
  // Window.
  use_window_central_config: {
    hint: {
      en: "Uses the window settings of the central configuration.",
      fr: "Utilise les réglages de fenêtre de la configuration centrale.",
      de: "Verwendet die Fenstereinstellungen der zentralen Konfiguration.",
    },
  },
  window_sensor_entity_id: {
    hint: {
      en: "Sensor that is on while the window is open, a binary sensor or a helper.",
      fr: "Capteur actif tant que la fenêtre est ouverte, un capteur binaire ou une entrée.",
      de: "Sensor, der eingeschaltet ist, solange das Fenster offen ist, ein Binärsensor oder ein Helfer.",
    },
    info: {
      en: "With the method Opening sensor, the thermostat reacts to this sensor: when it turns on, the heating waits for the opening delay, then applies the action of the window. Without a sensor, choose the method Temperature drop instead.",
      fr: "Avec la méthode Capteur d'ouverture, le thermostat réagit à ce capteur : quand il s'active, le chauffage attend le délai d'ouverture, puis applique l'action de la fenêtre. Sans capteur, choisissez plutôt la méthode Chute de température.",
      de: "Mit der Methode Öffnungssensor reagiert das Thermostat auf diesen Sensor: Schaltet er ein, wartet die Heizung die Öffnungsverzögerung ab und wendet dann die Fensteraktion an. Ohne Sensor wählen Sie stattdessen die Methode Temperaturabfall.",
    },
  },
  window_delay: {
    hint: {
      en: "Seconds that a window must stay open before the heating reacts.",
      fr: "Secondes pendant lesquelles une fenêtre doit rester ouverte avant que le chauffage réagisse.",
      de: "Sekunden, die ein Fenster offen bleiben muss, bevor die Heizung reagiert.",
    },
    info: {
      en: "When a window opens, the thermostat waits this time before acting, so that opening it briefly does not stop the heating. If the window is closed again during the delay, nothing changes. 30 seconds is the default.",
      fr: "Quand une fenêtre s'ouvre, le thermostat attend ce temps avant d'agir, pour qu'une ouverture brève n'arrête pas le chauffage. Si la fenêtre est refermée pendant ce délai, rien ne change. 30 secondes est la valeur par défaut.",
      de: "Öffnet sich ein Fenster, wartet das Thermostat diese Zeit, bevor es handelt, damit kurzes Öffnen die Heizung nicht stoppt. Wird das Fenster während der Verzögerung wieder geschlossen, ändert sich nichts. 30 Sekunden sind der Standardwert.",
    },
  },
  window_off_delay: {
    hint: {
      en: "Seconds that a window must stay closed before the heating resumes.",
      fr: "Secondes pendant lesquelles une fenêtre doit rester fermée avant que le chauffage reprenne.",
      de: "Sekunden, die ein Fenster geschlossen bleiben muss, bevor die Heizung weiterläuft.",
    },
    info: {
      en: "When the window is closed, the thermostat waits this time before going back to its mode and preset, so that a window opened and closed again several times does not restart the heating at each closing. Leave it empty to use the same value as the delay of opening.",
      fr: "Quand la fenêtre est refermée, le thermostat attend ce temps avant de revenir à son mode et à son pré-réglage, pour qu'une fenêtre ouverte et refermée plusieurs fois ne relance pas le chauffage à chaque fermeture. Laissez vide pour utiliser la même valeur que le délai d'ouverture.",
      de: "Wird das Fenster geschlossen, wartet das Thermostat diese Zeit, bevor es zu seinem Modus und seiner Voreinstellung zurückkehrt, damit ein mehrmals geöffnetes und geschlossenes Fenster die Heizung nicht bei jedem Schließen neu startet. Leer lassen, um denselben Wert wie die Öffnungsverzögerung zu verwenden.",
    },
  },
  window_auto_open_threshold: {
    hint: {
      en: "Drop of the temperature, in ° per hour, that reveals an open window; 3 to 10.",
      fr: "Baisse de la température, en ° par heure, qui révèle une fenêtre ouverte ; de 3 à 10.",
      de: "Temperaturabfall in ° pro Stunde, der ein offenes Fenster verrät; 3 bis 10.",
    },
    info: {
      en: "Without a window sensor, the thermostat watches how fast the temperature falls. When it falls faster than this value, in degrees per hour, a window is considered open. A lower value detects sooner but may react to normal drops: start with 3 and adjust while watching the slope sensor of the thermostat. Leave empty to turn the automatic detection off.",
      fr: "Sans capteur de fenêtre, le thermostat surveille la vitesse à laquelle la température baisse. Quand elle baisse plus vite que cette valeur, en degrés par heure, une fenêtre est considérée comme ouverte. Une valeur plus basse détecte plus tôt mais peut réagir à des baisses normales : commencez par 3 et ajustez en suivant le capteur de pente du thermostat. Laissez vide pour désactiver la détection automatique.",
      de: "Ohne Fenstersensor beobachtet das Thermostat, wie schnell die Temperatur fällt. Fällt sie schneller als dieser Wert, in Grad pro Stunde, gilt ein Fenster als offen. Ein niedrigerer Wert erkennt früher, kann aber auf normale Abfälle reagieren: Beginnen Sie mit 3 und passen Sie den Wert mit dem Steigungssensor des Thermostats an. Leer lassen, um die automatische Erkennung abzuschalten.",
    },
  },
  window_auto_close_threshold: {
    hint: {
      en: "Trend, in ° per hour, above which the window counts as closed again; 0 is typical.",
      fr: "Tendance, en ° par heure, au-dessus de laquelle la fenêtre est considérée comme refermée ; 0 en général.",
      de: "Trend in ° pro Stunde, über dem das Fenster wieder als geschlossen gilt; meist 0.",
    },
    info: {
      en: "After a detection, the window counts as closed when the temperature no longer falls as fast, that is when its trend goes above this value, in degrees per hour. 0, the recommended value, ends the detection as soon as the temperature stops falling.",
      fr: "Après une détection, la fenêtre est considérée comme refermée quand la température ne baisse plus aussi vite, c'est-à-dire quand sa tendance dépasse cette valeur, en degrés par heure. 0, la valeur conseillée, termine la détection dès que la température cesse de baisser.",
      de: "Nach einer Erkennung gilt das Fenster als geschlossen, wenn die Temperatur nicht mehr so schnell fällt, also wenn ihr Trend diesen Wert in Grad pro Stunde übersteigt. 0, der empfohlene Wert, beendet die Erkennung, sobald die Temperatur nicht mehr fällt.",
    },
  },
  window_auto_max_duration: {
    hint: {
      en: "Longest time that an automatic detection keeps the heating off, in minutes.",
      fr: "Durée maximale pendant laquelle une détection automatique coupe le chauffage, en minutes.",
      de: "Längste Zeit, die eine automatische Erkennung die Heizung aus lässt, in Minuten.",
    },
    info: {
      en: "Past this time, the thermostat goes back to its mode and preset even if the temperature still falls, so that a false detection does not leave the room cold. 30 to 60 minutes suit most rooms.",
      fr: "Passé ce temps, le thermostat revient à son mode et à son pré-réglage même si la température baisse encore, pour qu'une fausse détection ne laisse pas la pièce froide. 30 à 60 minutes conviennent à la plupart des pièces.",
      de: "Nach dieser Zeit kehrt das Thermostat zu seinem Modus und seiner Voreinstellung zurück, auch wenn die Temperatur weiter fällt, damit eine Fehlerkennung den Raum nicht kalt lässt. 30 bis 60 Minuten passen für die meisten Räume.",
    },
  },
  window_action: {
    hint: {
      en: "What the thermostat does while the window is open: off, fan, frost protection or eco.",
      fr: "Ce que fait le thermostat pendant que la fenêtre est ouverte : arrêt, ventilation, hors-gel ou éco.",
      de: "Was das Thermostat tut, solange das Fenster offen ist: Aus, Lüfter, Frostschutz oder Eco.",
    },
    info: {
      en: "Turn off stops the heating or the cooling. Fan only keeps the device ventilating, for the devices that can. Frost protection and Eco apply the temperature of that preset without changing the selected preset, so the target may differ from the preset shown.",
      fr: "Éteindre arrête le chauffage ou la climatisation. Ventilation seule laisse l'appareil ventiler, pour les appareils qui le peuvent. Hors-gel et Éco appliquent la température de ce pré-réglage sans changer le pré-réglage choisi, si bien que la consigne peut différer du pré-réglage affiché.",
      de: "Ausschalten stoppt das Heizen oder Kühlen. Nur Lüfter lässt das Gerät weiter lüften, sofern es das kann. Frostschutz und Eco wenden die Temperatur dieser Voreinstellung an, ohne die gewählte Voreinstellung zu ändern, sodass die Solltemperatur von der angezeigten Voreinstellung abweichen kann.",
    },
  },
  // Motion.
  use_motion_central_config: {
    hint: {
      en: "Uses the motion settings of the central configuration.",
      fr: "Utilise les réglages de mouvement de la configuration centrale.",
      de: "Verwendet die Bewegungseinstellungen der zentralen Konfiguration.",
    },
  },
  motion_sensor_entity_id: {
    hint: {
      en: "Sensor that is on while a movement is detected in the room.",
      fr: "Capteur qui est actif tant qu'un mouvement est détecté dans la pièce.",
      de: "Sensor, der aktiv ist, solange im Raum eine Bewegung erkannt wird.",
    },
  },
  motion_delay: {
    hint: {
      en: "Seconds of movement needed before switching to the motion preset.",
      fr: "Secondes de mouvement nécessaires avant de passer au pré-réglage de mouvement.",
      de: "Sekunden Bewegung, bevor zur Voreinstellung bei Bewegung gewechselt wird.",
    },
    info: {
      en: "A movement must still be detected after this delay for the thermostat to switch to the motion preset, so that walking quickly through the room changes nothing. It may be longer than the delay of your sensor. Motion detection only applies while the thermostat is on the Activity preset.",
      fr: "Un mouvement doit encore être détecté après ce délai pour que le thermostat passe au pré-réglage de mouvement, pour qu'un passage rapide dans la pièce ne change rien. Il peut être plus long que le délai de votre capteur. La détection de mouvement ne s'applique que lorsque le thermostat est sur le pré-réglage Activité.",
      de: "Nach dieser Verzögerung muss noch eine Bewegung erkannt werden, damit das Thermostat zur Voreinstellung bei Bewegung wechselt, sodass ein kurzes Durchqueren des Raums nichts ändert. Sie darf länger sein als die Verzögerung Ihres Sensors. Die Bewegungserkennung gilt nur, wenn das Thermostat auf der Voreinstellung Aktivität steht.",
    },
  },
  motion_off_delay: {
    hint: {
      en: "Seconds without movement before going back to the no motion preset.",
      fr: "Secondes sans mouvement avant de revenir au pré-réglage sans mouvement.",
      de: "Sekunden ohne Bewegung, bevor zur Voreinstellung ohne Bewegung gewechselt wird.",
    },
    info: {
      en: "Once nobody moves, the thermostat waits this time before switching to the no motion preset; a movement during this time keeps the motion preset. 300 seconds, 5 minutes, is the default.",
      fr: "Quand plus personne ne bouge, le thermostat attend ce temps avant de passer au pré-réglage sans mouvement ; un mouvement pendant ce temps garde le pré-réglage de mouvement. 300 secondes, soit 5 minutes, est la valeur par défaut.",
      de: "Bewegt sich niemand mehr, wartet das Thermostat diese Zeit, bevor es zur Voreinstellung ohne Bewegung wechselt; eine Bewegung in dieser Zeit behält die Voreinstellung bei Bewegung bei. 300 Sekunden, also 5 Minuten, sind der Standardwert.",
    },
  },
  motion_preset: {
    hint: {
      en: "Preset whose temperature applies while someone moves in the room.",
      fr: "Pré-réglage dont la température s'applique tant que quelqu'un bouge dans la pièce.",
      de: "Voreinstellung, deren Temperatur gilt, solange sich jemand im Raum bewegt.",
    },
  },
  no_motion_preset: {
    hint: {
      en: "Preset whose temperature applies when nobody has moved for a while.",
      fr: "Pré-réglage dont la température s'applique quand personne n'a bougé depuis un moment.",
      de: "Voreinstellung, deren Temperatur gilt, wenn sich eine Weile niemand bewegt hat.",
    },
  },
  // Power.
  use_power_central_config: {
    hint: {
      en: "Uses the temperature of shedding of the central configuration.",
      fr: "Utilise la température de délestage de la configuration centrale.",
      de: "Verwendet die Abwurftemperatur der zentralen Konfiguration.",
    },
  },
  power_temp: {
    hint: {
      en: "Target applied to a thermostat while its heating is shed.",
      fr: "Consigne appliquée à un thermostat pendant que son chauffage est délesté.",
      de: "Solltemperatur, die ein Thermostat erhält, solange seine Heizung abgeworfen ist.",
    },
  },
  power_sensor_entity_id: {
    hint: {
      en: "Sensor of the power that the whole home draws right now.",
      fr: "Capteur de la puissance que consomme tout le logement en ce moment.",
      de: "Sensor der Leistung, die das ganze Haus gerade bezieht.",
    },
  },
  max_power_sensor_entity_id: {
    hint: {
      en: "Sensor or helper that gives the highest power that the home may draw.",
      fr: "Capteur ou entrée qui donne la puissance maximale que le logement peut consommer.",
      de: "Sensor oder Helfer, der die höchste Leistung angibt, die das Haus beziehen darf.",
    },
    info: {
      en: "When the power drawn plus the power of a heater would go over this value, the heater is shed. Set it below the limit of your contract, to keep a margin for the other devices and for the delay of the readings. A helper lets an automation change the limit, for example while a car charges.",
      fr: "Quand la puissance consommée plus celle d'un radiateur dépasserait cette valeur, le radiateur est délesté. Réglez-la sous la limite de votre abonnement, pour garder une marge pour les autres appareils et pour le retard des mesures. Une entrée permet à une automatisation de changer la limite, par exemple pendant la recharge d'une voiture.",
      de: "Würden die bezogene Leistung plus die Leistung eines Heizgeräts diesen Wert überschreiten, wird das Gerät abgeworfen. Setzen Sie ihn unter die Grenze Ihres Vertrags, um Reserve für andere Geräte und für die Verzögerung der Messungen zu lassen. Mit einem Helfer kann eine Automatisierung die Grenze ändern, z. B. während ein Auto lädt.",
    },
  },
  // Presence.
  use_presence_central_config: {
    hint: {
      en: "Uses the away temperatures of the central configuration.",
      fr: "Utilise les températures d'absence de la configuration centrale.",
      de: "Verwendet die Abwesenheitstemperaturen der zentralen Konfiguration.",
    },
  },
  presence_sensor_entity_id: {
    hint: {
      en: "Sensor or person that is on, or home, while someone is at home.",
      fr: "Capteur ou personne qui est actif, ou présent, quand quelqu'un est à la maison.",
      de: "Sensor oder Person, der aktiv oder zu Hause ist, wenn jemand daheim ist.",
    },
  },
  // Auto start and stop.
  auto_start_stop_level: {
    hint: {
      en: "How quickly the device is stopped when not needed and started again; slower means fewer stops.",
      fr: "Rapidité de l'arrêt de l'appareil quand il n'est pas utile et de son redémarrage ; plus lent veut dire moins d'arrêts.",
      de: "Wie schnell das Gerät gestoppt wird, wenn es nicht gebraucht wird, und wieder startet; langsamer heißt seltener.",
    },
    info: {
      en: "The thermostat stops the device when the room has been warm enough for some time, and starts it again when the temperature is about to fall under the target. Very slow allows about 60 minutes between a stop and a restart, slow about 30, medium 15 and fast 7. None turns the function off.",
      fr: "Le thermostat arrête l'appareil quand la pièce est assez chaude depuis un moment, et le redémarre quand la température va passer sous la consigne. Très lent laisse environ 60 minutes entre un arrêt et un redémarrage, lent environ 30, moyen 15 et rapide 7. Aucun désactive la fonction.",
      de: "Das Thermostat stoppt das Gerät, wenn der Raum eine Weile warm genug war, und startet es wieder, wenn die Temperatur gleich unter den Sollwert fällt. Sehr langsam lässt etwa 60 Minuten zwischen Stopp und Neustart, langsam etwa 30, mittel 15 und schnell 7. Keine schaltet die Funktion ab.",
    },
  },
  // Synchronization of the temperature.
  sync_with_calibration: {
    hint: {
      en: "Corrects the device through its calibration offset instead of copying the room temperature.",
      fr: "Corrige l'appareil par son décalage de calibration au lieu de copier la température de la pièce.",
      de: "Korrigiert das Gerät über seinen Kalibrierungsversatz, statt die Raumtemperatur zu kopieren.",
    },
    info: {
      en: "Checked, the thermostat computes the gap between the room and the sensor of the device and writes it into the calibration offset of the device: 19° in the room and 21° on the device give −2°. Unchecked, it copies the room temperature into the entity of the device that takes an outside temperature. The entities given below must match this choice.",
      fr: "Coché, le thermostat calcule l'écart entre la pièce et le capteur de l'appareil et l'écrit dans le décalage de calibration de l'appareil : 19° dans la pièce et 21° sur l'appareil donnent −2°. Décoché, il copie la température de la pièce dans l'entité de l'appareil qui reçoit une température externe. Les entités indiquées ci-dessous doivent correspondre à ce choix.",
      de: "Aktiviert, berechnet das Thermostat die Abweichung zwischen Raum und Gerätesensor und schreibt sie in den Kalibrierungsversatz des Geräts: 19° im Raum und 21° am Gerät ergeben −2°. Deaktiviert, kopiert es die Raumtemperatur in die Entität des Geräts, die eine externe Temperatur entgegennimmt. Die unten angegebenen Entitäten müssen zu dieser Wahl passen.",
    },
  },
  sync_entity_ids: {
    hint: {
      en: "One entity per device: its calibration offset, or its input for an outside temperature.",
      fr: "Une entité par appareil : son décalage de calibration, ou son entrée de température externe.",
      de: "Eine Entität pro Gerät: ihr Kalibrierungsversatz oder ihr Eingang für eine externe Temperatur.",
    },
    info: {
      en: "Give them in the order of the devices. With calibration, choose the offset entity, often named local_temperature_calibration; without, the number entity that takes the outside temperature, such as external_temperature_input.",
      fr: "Indiquez-les dans l'ordre des appareils. Avec la calibration, choisissez l'entité du décalage, souvent nommée local_temperature_calibration ; sans, l'entité number qui reçoit la température externe, comme external_temperature_input.",
      de: "Geben Sie sie in der Reihenfolge der Geräte an. Mit Kalibrierung wählen Sie die Versatz-Entität, oft local_temperature_calibration genannt; ohne die Number-Entität, die die externe Temperatur entgegennimmt, etwa external_temperature_input.",
    },
  },
  // Advanced.
  use_advanced_central_config: {
    hint: {
      en: "Uses the safety and the other advanced settings of the central configuration.",
      fr: "Utilise la sécurité et les autres réglages avancés de la configuration centrale.",
      de: "Verwendet die Sicherheit und die übrigen erweiterten Einstellungen der zentralen Konfiguration.",
    },
  },
  safety_delay_min: {
    hint: {
      en: "Minutes without a temperature reading before the thermostat goes into safety mode.",
      fr: "Minutes sans mesure de température avant que le thermostat passe en mode sécurité.",
      de: "Minuten ohne Temperaturmessung, bevor das Thermostat in den Sicherheitsmodus wechselt.",
    },
    info: {
      en: "If the room sensor or the outdoor sensor has not reported for this time, while the heater runs at least at the minimum power for safety, the thermostat goes into safety mode and heats at the power for safety until a reading comes back. Set it above the usual interval of your sensors: 60 minutes, the default, suits most of them. A thermostat over a climate never goes into safety mode.",
      fr: "Si le capteur de la pièce ou le capteur extérieur n'a rien envoyé depuis ce temps, alors que le radiateur chauffe au moins à la puissance minimale de sécurité, le thermostat passe en mode sécurité et chauffe à la puissance de sécurité jusqu'au retour d'une mesure. Réglez-le au-dessus de l'intervalle habituel de vos capteurs : 60 minutes, la valeur par défaut, convient à la plupart. Un thermostat sur climate ne passe jamais en mode sécurité.",
      de: "Hat sich der Raum- oder der Außensensor so lange nicht gemeldet, während das Gerät mindestens mit der Mindestleistung für die Sicherheit heizt, wechselt das Thermostat in den Sicherheitsmodus und heizt mit der Sicherheitsleistung, bis wieder ein Messwert kommt. Setzen Sie ihn über das übliche Intervall Ihrer Sensoren: 60 Minuten, der Standardwert, passen für die meisten. Ein Thermostat über ein Climate wechselt nie in den Sicherheitsmodus.",
    },
  },
  safety_min_on_percent: {
    hint: {
      en: "Safety mode starts only if the heater was running at least at this power; 0.5 is 50 %.",
      fr: "Le mode sécurité ne démarre que si le radiateur chauffait au moins à cette puissance ; 0,5 vaut 50 %.",
      de: "Der Sicherheitsmodus startet nur, wenn das Gerät mindestens mit dieser Leistung lief; 0,5 sind 50 %.",
    },
    info: {
      en: "When the readings stop, a heater that was barely running is no risk, so it keeps its regulation. Safety mode starts only if the power computed was at least this value, given between 0 and 1: 0.5, the default, means 50 %. With 0, safety mode always starts when the readings stop.",
      fr: "Quand les mesures s'arrêtent, un radiateur qui chauffait à peine ne présente pas de risque : il garde sa régulation. Le mode sécurité ne démarre que si la puissance calculée valait au moins cette valeur, donnée entre 0 et 1 : 0,5, la valeur par défaut, vaut 50 %. Avec 0, le mode sécurité démarre toujours quand les mesures s'arrêtent.",
      de: "Bleiben die Messwerte aus, ist ein Gerät, das kaum heizte, kein Risiko: Es behält seine Regelung. Der Sicherheitsmodus startet nur, wenn die berechnete Leistung mindestens diesen Wert hatte, angegeben zwischen 0 und 1: 0,5, der Standardwert, sind 50 %. Mit 0 startet der Sicherheitsmodus immer, wenn die Messwerte ausbleiben.",
    },
  },
  safety_default_on_percent: {
    hint: {
      en: "Power used in safety mode; 0.1 is 10 %, and 0 turns the heater off.",
      fr: "Puissance utilisée en mode sécurité ; 0,1 vaut 10 %, et 0 éteint le radiateur.",
      de: "Leistung im Sicherheitsmodus; 0,1 sind 10 %, und 0 schaltet das Gerät aus.",
    },
    info: {
      en: "In safety mode the thermostat no longer knows the room temperature, so it heats at this fixed power until a reading comes back. Give it between 0 and 1: 0.1, the default, heats 10 % of each cycle, which keeps the room from getting too cold without overheating it.",
      fr: "En mode sécurité, le thermostat ne connaît plus la température de la pièce : il chauffe donc à cette puissance fixe jusqu'au retour d'une mesure. Indiquez-la entre 0 et 1 : 0,1, la valeur par défaut, chauffe 10 % de chaque cycle, ce qui évite que la pièce refroidisse trop sans la surchauffer.",
      de: "Im Sicherheitsmodus kennt das Thermostat die Raumtemperatur nicht mehr und heizt daher mit dieser festen Leistung, bis wieder ein Messwert kommt. Geben Sie sie zwischen 0 und 1 an: 0,1, der Standardwert, heizt 10 % jedes Zyklus, sodass der Raum nicht zu sehr auskühlt, ohne ihn zu überhitzen.",
    },
  },
  repair_incorrect_state: {
    hint: {
      en: "Sends the command again when a device is not in the state that the thermostat asked for.",
      fr: "Renvoie la commande quand un appareil n'est pas dans l'état demandé par le thermostat.",
      de: "Sendet den Befehl erneut, wenn ein Gerät nicht im vom Thermostat verlangten Zustand ist.",
    },
  },
  manual_override_duration_min: {
    hint: {
      en: "After a manual change of the target, minutes before going back to the preset; 0 never.",
      fr: "Après un changement manuel de la consigne, minutes avant de revenir au pré-réglage ; 0 jamais.",
      de: "Nach einer manuellen Änderung des Sollwerts Minuten bis zur Rückkehr zur Voreinstellung; 0 nie.",
    },
    info: {
      en: "When you change the target by hand, the thermostat keeps it for this time, then goes back to the preset that it had before. For example, with 60, raising the temperature for a film lasts one hour. 0, the default, keeps the manual target until the next change.",
      fr: "Quand vous changez la consigne à la main, le thermostat la garde pendant ce temps, puis revient au pré-réglage qu'il avait avant. Par exemple, avec 60, monter la température pour un film dure une heure. 0, la valeur par défaut, garde la consigne manuelle jusqu'au prochain changement.",
      de: "Ändern Sie die Solltemperatur von Hand, behält das Thermostat sie diese Zeit und kehrt dann zur vorherigen Voreinstellung zurück. Mit 60 hält z. B. ein Erhöhen der Temperatur für einen Film eine Stunde. 0, der Standardwert, behält die manuelle Solltemperatur bis zur nächsten Änderung.",
    },
  },
  // Lock.
  use_lock_central_config: {
    hint: {
      en: "Uses the lock settings of the central configuration.",
      fr: "Utilise les réglages de verrouillage de la configuration centrale.",
      de: "Verwendet die Sperreinstellungen der zentralen Konfiguration.",
    },
  },
  lock_code: {
    hint: {
      en: "Optional four-digit code asked to lock or unlock the thermostat.",
      fr: "Code facultatif à quatre chiffres demandé pour verrouiller ou déverrouiller le thermostat.",
      de: "Optionaler vierstelliger Code, der zum Sperren oder Entsperren des Thermostats verlangt wird.",
    },
  },
  lock_users: {
    hint: {
      en: "While locked, the changes made from the Home Assistant interface are refused.",
      fr: "Une fois verrouillé, les changements faits depuis l'interface de Home Assistant sont refusés.",
      de: "Im gesperrten Zustand werden Änderungen über die Oberfläche von Home Assistant abgelehnt.",
    },
  },
  lock_automations: {
    hint: {
      en: "While locked, the changes made by automations, scripts and schedulers are refused.",
      fr: "Une fois verrouillé, les changements faits par les automatisations, scripts et planificateurs sont refusés.",
      de: "Im gesperrten Zustand werden Änderungen durch Automatisierungen, Skripte und Zeitpläne abgelehnt.",
    },
  },
  auto_relock_sec: {
    hint: {
      en: "Locks the thermostat again this many seconds after an unlock; 0 never locks it again.",
      fr: "Reverrouille le thermostat ce nombre de secondes après un déverrouillage ; 0 ne le reverrouille jamais.",
      de: "Sperrt das Thermostat so viele Sekunden nach dem Entsperren wieder; 0 nie.",
    },
  },
  // Humidity.
  use_humidity_feature: {
    hint: {
      en: "Shows the humidity of a sensor on the thermostat; it does not change the heating.",
      fr: "Affiche l'humidité d'un capteur sur le thermostat ; elle ne change pas le chauffage.",
      de: "Zeigt die Feuchtigkeit eines Sensors am Thermostat an; sie ändert das Heizen nicht.",
    },
  },
  humidity_sensor_entity_id: {
    hint: {
      en: "Sensor of the humidity; leave empty to use the one of the device of the room sensor.",
      fr: "Capteur d'humidité ; laissez vide pour utiliser celui de l'appareil du capteur de la pièce.",
      de: "Feuchtigkeitssensor; leer lassen, um den des Geräts des Raumsensors zu verwenden.",
    },
  },
  // Heating failure detection.
  use_heating_failure_detection_central_config: {
    hint: {
      en: "Uses the detection settings of the central configuration.",
      fr: "Utilise les réglages de détection de la configuration centrale.",
      de: "Verwendet die Erkennungseinstellungen der zentralen Konfiguration.",
    },
  },
  heating_failure_threshold: {
    hint: {
      en: "Power above which the room must warm up; 0.9 is 90 %.",
      fr: "Puissance au-dessus de laquelle la pièce doit se réchauffer ; 0,9 vaut 90 %.",
      de: "Leistung, ab der sich der Raum erwärmen muss; 0,9 sind 90 %.",
    },
    info: {
      en: "When the heater runs at least at this power, given between 0 and 1, the temperature must rise. If it has not risen by the tolerance after the detection delay, a heating failure is reported, as with a heater that is off or broken. 0.9, the default, only checks the cycles at 90 % or more.",
      fr: "Quand le radiateur chauffe au moins à cette puissance, donnée entre 0 et 1, la température doit monter. Si elle n'a pas monté de la tolérance après le délai de détection, une panne de chauffage est signalée, comme avec un radiateur éteint ou en panne. 0,9, la valeur par défaut, ne vérifie que les cycles à 90 % ou plus.",
      de: "Heizt das Gerät mindestens mit dieser Leistung, angegeben zwischen 0 und 1, muss die Temperatur steigen. Ist sie nach der Erkennungsverzögerung nicht um die Toleranz gestiegen, wird ein Heizungsausfall gemeldet, wie bei einem ausgeschalteten oder defekten Heizkörper. 0,9, der Standardwert, prüft nur Zyklen mit 90 % oder mehr.",
    },
  },
  cooling_failure_threshold: {
    hint: {
      en: "Power at or under which the room must not warm up; 0 is 0 %.",
      fr: "Puissance à ou sous laquelle la pièce ne doit pas se réchauffer ; 0 vaut 0 %.",
      de: "Leistung, bei oder unter der sich der Raum nicht erwärmen darf; 0 sind 0 %.",
    },
    info: {
      en: "When the heater runs at this power or less, given between 0 and 1, the temperature should not rise. If it rises by more than the tolerance during the detection delay, a failure is reported, as with a relay stuck on. 0, the default, only checks while the heater is fully off. Another heat source, such as the sun or a stove, can also trigger it: the detection template can pause the check then.",
      fr: "Quand le radiateur chauffe à cette puissance ou moins, donnée entre 0 et 1, la température ne devrait pas monter. Si elle monte de plus que la tolérance pendant le délai de détection, une panne est signalée, comme avec un relais resté collé. 0, la valeur par défaut, ne vérifie que lorsque le radiateur est complètement éteint. Une autre source de chaleur, comme le soleil ou un poêle, peut aussi la déclencher : le modèle d'activation peut alors suspendre la vérification.",
      de: "Heizt das Gerät mit dieser Leistung oder weniger, angegeben zwischen 0 und 1, sollte die Temperatur nicht steigen. Steigt sie während der Erkennungsverzögerung um mehr als die Toleranz, wird ein Ausfall gemeldet, wie bei einem klemmenden Relais. 0, der Standardwert, prüft nur, wenn das Gerät ganz aus ist. Auch eine andere Wärmequelle wie die Sonne oder ein Ofen kann ihn auslösen: Das Aktivierungs-Template kann die Prüfung dann aussetzen.",
    },
  },
  heating_failure_detection_delay: {
    hint: {
      en: "Minutes to wait before checking that the temperature follows the heating.",
      fr: "Minutes d'attente avant de vérifier que la température suit le chauffage.",
      de: "Minuten Wartezeit, bevor geprüft wird, ob die Temperatur der Heizung folgt.",
    },
    info: {
      en: "The check starts when the power crosses one of the two thresholds; after this delay, the temperature is compared with its value at the start. A heating with a lot of inertia, such as underfloor heating, needs a longer delay than the default 15 minutes.",
      fr: "La vérification commence quand la puissance franchit l'un des deux seuils ; après ce délai, la température est comparée à sa valeur du début. Un chauffage à forte inertie, comme un plancher chauffant, demande un délai plus long que les 15 minutes par défaut.",
      de: "Die Prüfung beginnt, wenn die Leistung eine der beiden Schwellen überschreitet; nach dieser Verzögerung wird die Temperatur mit ihrem Wert zu Beginn verglichen. Eine träge Heizung wie eine Fußbodenheizung braucht eine längere Verzögerung als die standardmäßigen 15 Minuten.",
    },
  },
  temperature_change_tolerance: {
    hint: {
      en: "Smallest change of temperature that counts, in °, to ignore the noise of the sensor.",
      fr: "Plus petit changement de température pris en compte, en °, pour ignorer le bruit du capteur.",
      de: "Kleinste Temperaturänderung, die zählt, in °, um das Rauschen des Sensors zu ignorieren.",
    },
    info: {
      en: "Over the detection delay, a change smaller than this value is ignored: a rise below it counts as no rise while the heater runs, and a rise above it reveals a failure while the heater is off. 0.5°, the default, filters out the small swings of most sensors; raise it for a sensor that jumps a lot.",
      fr: "Sur le délai de détection, un changement plus petit que cette valeur est ignoré : une montée inférieure compte comme une absence de montée quand le radiateur chauffe, et une montée supérieure révèle une panne quand il est éteint. 0,5°, la valeur par défaut, filtre les petites variations de la plupart des capteurs ; augmentez-la pour un capteur qui saute beaucoup.",
      de: "Über die Erkennungsverzögerung wird eine Änderung unter diesem Wert ignoriert: Ein kleinerer Anstieg gilt als kein Anstieg, wenn das Gerät heizt, und ein größerer verrät einen Ausfall, wenn es aus ist. 0,5°, der Standardwert, filtert die kleinen Schwankungen der meisten Sensoren; erhöhen Sie ihn für einen stark springenden Sensor.",
    },
  },
  failure_detection_enable_template: {
    hint: {
      en: "Optional template that must be true for the detection to run, for example while a stove is off.",
      fr: "Modèle facultatif qui doit être vrai pour que la détection fonctionne, par exemple quand un poêle est éteint.",
      de: "Optionales Template, das wahr sein muss, damit die Erkennung läuft, z. B. solange ein Ofen aus ist.",
    },
  },
};

/** The central power unit is not the unit of the power of a heater: the plugin of the power management gives its own help. */
const CENTRAL_POWER_UNIT: FieldHelp = {
  hint: {
    en: "Unit of the power sensors of the home; Auto reads it from each sensor.",
    fr: "Unité des capteurs de puissance du logement ; Auto la lit sur chaque capteur.",
    de: "Einheit der Leistungssensoren des Hauses; Auto liest sie aus jedem Sensor.",
  },
};

/**
 * The keys `hint.<key>` and `info.<key>` of fields, for the catalog of a plugin.
 *
 * @param keys - The keys of the fields that the plugin shows.
 * @param own - Help that replaces the one of `FIELD_HELP` for this plugin, by key of field.
 */
function helpOf(keys: readonly string[], own: Readonly<Record<string, FieldHelp>> = {}): Record<string, Text> {
  const texts: Record<string, Text> = {};
  for (const key of keys) {
    const help = own[key] ?? FIELD_HELP[key];
    if (help === undefined) {
      throw new Error(`The field '${key}' has no help in FIELD_HELP.`);
    }
    texts[`hint.${key}`] = help.hint;
    if (help.info !== undefined) {
      texts[`info.${key}`] = help.info;
    }
  }
  return texts;
}

/** The texts of each plugin, by key. They come before the texts of Versatile Thermostat, so they can replace one. */
export const PLUGIN_TEXTS: Readonly<Record<string, Readonly<Record<string, Text>>>> = {
  core: {
    "label.power_unit": { en: "Power unit", fr: "Unité de puissance", de: "Leistungseinheit" },
    "top.dashboard": { en: "Dashboard", fr: "Tableau de bord", de: "Dashboard" },
    "top.thermostats": { en: "Thermostats", fr: "Thermostats", de: "Thermostate" },
    "top.configuration": { en: "Configuration", fr: "Configuration", de: "Konfiguration" },
    "page.overview": { en: "Overview", fr: "Vue d'ensemble", de: "Übersicht" },
    "page.thermostat_overview": { en: "Overview", fr: "Vue d'ensemble", de: "Übersicht" },
    "page.plugins": { en: "Plugins", fr: "Plugins", de: "Plugins" },
    "page.dev_plugins": { en: "Development", fr: "Développement", de: "Entwicklung" },
    "page.create_central": { en: "Central configuration", fr: "Configuration centrale", de: "Zentrale Konfiguration" },
    "group.dashboard": { en: "Dashboard", fr: "Tableau de bord", de: "Dashboard" },
    ...CORE_WIDGET_TEXTS,
    ...CORE_GLOBAL_WIDGET_TEXTS,
    ...CORE_DETAIL_WIDGET_TEXTS,
    "option.proportional_function.tpi": { en: "TPI", fr: "TPI", de: "TPI" },
    "option.thermostat_type.thermostat_over_switch": { en: "Over a switch", fr: "Sur un interrupteur", de: "Über einen Schalter" },
    "option.thermostat_type.thermostat_over_climate": { en: "Over a climate", fr: "Sur un climate", de: "Über ein Climate" },
    "option.thermostat_type.thermostat_over_valve": { en: "Over a valve", fr: "Sur une vanne", de: "Über ein Ventil" },
    "option.thermostat_type.thermostat_central_config": { en: "Central configuration", fr: "Configuration centrale", de: "Zentrale Konfiguration" },
    ...helpOf([
      "name", "temperature_sensor_entity_id", "last_seen_temperature_sensor_entity_id", "external_temperature_sensor_entity_id", "temp_min",
      "temp_max", "step_temperature", "cycle_min", "device_power", "power_unit", "use_main_central_config", "use_central_mode",
      "used_by_controls_central_boiler", "use_window_feature", "use_motion_feature", "use_power_feature", "use_presence_feature",
      "use_auto_start_stop_feature", "use_heating_failure_detection_feature", "use_central_boiler_feature", "sync_device_internal_temp",
      "underlying_entity_ids", "proportional_function", "heater_keep_alive", "inverse_switch_command", "vswitch_on_command", "vswitch_off_command",
      "ac_mode", "auto_regulation_mode", "auto_regulation_dtemp", "auto_regulation_periode_min", "auto_fan_mode", "auto_regulation_use_device_temp",
      "opening_threshold_degree", "min_opening_degrees", "max_opening_degrees", "max_closing_degree",
    ]),
  },
  core_tpi: {
    "option.proportional_function.tpi": { en: "TPI", fr: "TPI", de: "TPI" },
    ...TPI_WIDGET_TEXTS,
    ...AUTO_TPI_WIDGET_TEXTS,
    ...helpOf([
      "use_tpi_central_config", "tpi_coef_int", "tpi_coef_ext", "minimal_activation_delay", "minimal_deactivation_delay", "tpi_threshold_low",
      "tpi_threshold_high", "auto_tpi_mode", "auto_tpi_learning_type", "auto_tpi_aggressiveness", "heater_heating_time", "heater_cooling_time",
      "auto_tpi_heating_rate", "auto_tpi_continuous_kext", "auto_tpi_enable_advanced_settings", "auto_tpi_avg_initial_weight", "auto_tpi_ema_alpha",
      "auto_tpi_ema_decay_rate", "auto_tpi_continuous_kext_alpha",
    ]),
    ...INSIGHT_COMMON,
    ...INSIGHT_TPI,
  },
  core_valve_regulation: {
    "option.proportional_function.tpi": { en: "TPI", fr: "TPI", de: "TPI" },
    ...VALVE_WIDGET_TEXTS,
    ...helpOf([
      "opening_degree_entity_ids", "closing_degree_entity_ids", "proportional_function", "opening_threshold_degree", "min_opening_degrees",
      "max_opening_degrees", "max_closing_degree",
    ]),
  },
  core_auto_start_stop: {
    ...AUTO_START_STOP_WIDGET_TEXTS,
    "label.auto_start_stop_level": { en: "Auto start and stop level", fr: "Niveau d'allumage/extinction auto", de: "Stufe für Auto-Ein/Aus" },
    "feature_intro.use_auto_start_stop_feature": {
      en: "Turns the device off when the room is warm enough and on again when it needs heat, to save energy.",
      fr: "Éteint l'appareil quand la pièce est assez chaude et le rallume quand elle a besoin de chaleur, pour économiser de l'énergie.",
      de: "Schaltet das Gerät aus, wenn der Raum warm genug ist, und wieder ein, wenn er Wärme braucht, um Energie zu sparen.",
    },
    "field.auto_start_stop_level": { en: "Auto start and stop level", fr: "Niveau d'allumage et d'extinction automatiques", de: "Stufe für automatisches Ein- und Ausschalten" },
    ...helpOf(["auto_start_stop_level"]),
  },
  core_window: {
    ...WINDOW_WIDGET_TEXTS,
    "label.window_delay": { en: "Delay on opening (seconds)", fr: "Délai à l'ouverture (secondes)", de: "Verzögerung beim Öffnen (Sek.)" },
    "label.window_off_delay": { en: "Delay on closing (seconds)", fr: "Délai à la fermeture (secondes)", de: "Verzögerung beim Schliessen (Sek.)" },
    "label.window_auto_open_threshold": { en: "Opening threshold (°/h)", fr: "Seuil de détection (°/h)", de: "Erkennungsschwelle (°/h)" },
    "label.window_auto_close_threshold": { en: "Closing threshold (°/h)", fr: "Seuil de fin de détection (°/h)", de: "Endschwelle der Erkennung (°/h)" },
    "label.window_auto_max_duration": { en: "Maximum detection duration (min)", fr: "Durée maximale d'extinction (min)", de: "Maximale Abschaltdauer (min)" },
    "feature_intro.use_window_feature": {
      en: "Turns the heating off, or lowers it, while a window is open: with a window sensor, or by detecting the fast drop of the temperature.",
      fr: "Coupe ou réduit le chauffage pendant qu'une fenêtre est ouverte : avec un capteur d'ouverture, ou en détectant la baisse rapide de la température.",
      de: "Schaltet die Heizung aus oder senkt sie ab, solange ein Fenster offen ist: mit einem Fenstersensor oder durch Erkennen des schnellen Temperaturabfalls.",
    },
    "window_method.question": { en: "How to detect an open window?", fr: "Comment détecter une fenêtre ouverte ?", de: "Wie wird ein offenes Fenster erkannt?" },
    "window_method.sensor": { en: "Opening sensor", fr: "Capteur d'ouverture", de: "Öffnungssensor" },
    "window_method.drop": { en: "Temperature drop", fr: "Chute de température", de: "Temperaturabfall" },
    ...helpOf([
      "use_window_central_config", "window_sensor_entity_id", "window_delay", "window_off_delay", "window_auto_open_threshold",
      "window_auto_close_threshold", "window_auto_max_duration", "window_action",
    ]),
    ...INSIGHT_COMMON,
    ...INSIGHT_WINDOW,
  },
  core_motion: {
    ...MOTION_WIDGET_TEXTS,
    "feature_intro.use_motion_feature": {
      en: "Changes the preset when someone moves in the room: comfort while there is activity, eco after a while without it.",
      fr: "Change de pré-réglage selon les mouvements dans la pièce : confort tant qu'il y a de l'activité, éco après un moment sans.",
      de: "Wechselt die Voreinstellung je nach Bewegung im Raum: Komfort bei Aktivität, Eco nach einer Weile ohne.",
    },
    ...helpOf(["use_motion_central_config", "motion_sensor_entity_id", "motion_delay", "motion_off_delay", "motion_preset", "no_motion_preset"]),
  },
  core_power: {
    ...OVERPOWERING_WIDGET_TEXTS,
    ...ENERGY_WIDGET_TEXTS,
    "label.power_sensor_entity_id": { en: "Total power sensor", fr: "Capteur de puissance totale", de: "Gesamtleistungssensor" },
    "label.max_power_sensor_entity_id": { en: "Max power sensor", fr: "Capteur de puissance max", de: "Sensor der maximalen Leistung" },
    "feature_intro.use_power_feature": {
      en: "Sheds the heating when the power of the home would go above its limit, so that the main switch does not trip.",
      fr: "Déleste le chauffage quand la puissance du logement dépasserait sa limite, pour éviter que le disjoncteur ne saute.",
      de: "Wirft die Heizung ab, wenn die Leistung des Hauses ihre Grenze überschreiten würde, damit die Hauptsicherung nicht auslöst.",
    },
    ...helpOf(["use_power_central_config", "power_temp", "power_sensor_entity_id", "max_power_sensor_entity_id", "power_unit"], { power_unit: CENTRAL_POWER_UNIT }),
    ...POWER_WIDGET_TEXTS,
  },
  core_presence: {
    "feature_intro.use_presence_feature": {
      en: "Uses the away temperatures of the presets while nobody is at home.",
      fr: "Utilise les températures d'absence des pré-réglages quand personne n'est à la maison.",
      de: "Verwendet die Abwesenheitstemperaturen der Voreinstellungen, wenn niemand zu Hause ist.",
    },
    ...helpOf(["use_presence_central_config", "presence_sensor_entity_id"]),
    ...PRESENCE_WIDGET_TEXTS,
  },
  core_central_boiler: {
    "label.central_boiler_activation_delay_sec": { en: "Activation delay (seconds)", fr: "Délai d'activation (secondes)", de: "Aktivierungsverzögerung (Sekunden)" },
    "feature_intro.use_central_boiler_feature": {
      en: "Starts the central boiler when a thermostat needs heat and stops it when none does.",
      fr: "Démarre la chaudière centrale quand un thermostat a besoin de chauffer et l'arrête quand aucun n'en a besoin.",
      de: "Startet den zentralen Heizkessel, wenn ein Thermostat Wärme braucht, und stoppt ihn, wenn keiner sie braucht.",
    },
    ...helpOf([
      "central_boiler_activation_delay_sec", "central_boiler_activation_service", "central_boiler_deactivation_service",
      "keep_alive_boiler_delay_sec",
    ]),
    ...BOILER_WIDGET_TEXTS,
    ...BOILER_DEMAND_WIDGET_TEXTS,
  },
  core_heating_failure: {
    ...FAILURE_WIDGET_TEXTS,
    "feature_intro.use_heating_failure_detection_feature": {
      en: "Warns when the temperature does not rise while the thermostat heats, or rises while it does not, as a broken heater would.",
      fr: "Prévient quand la température ne monte pas alors que le thermostat chauffe, ou monte alors qu'il ne chauffe pas, comme le ferait un radiateur en panne.",
      de: "Warnt, wenn die Temperatur nicht steigt, obwohl das Thermostat heizt, oder steigt, obwohl es nicht heizt, wie bei einem defekten Heizkörper.",
    },
    ...helpOf([
      "use_heating_failure_detection_central_config", "heating_failure_threshold", "cooling_failure_threshold", "heating_failure_detection_delay",
      "temperature_change_tolerance", "failure_detection_enable_template",
    ]),
  },
  core_presets: {
    ...helpOf(["use_presets_central_config"]),
    ...PRESET_WIDGET_TEXTS,
  },
  core_sync_temp: {
    ...SYNC_WIDGET_TEXTS,
    "feature_intro.sync_device_internal_temp": {
      en: "Gives the room temperature to the device, so that its own regulation works with the temperature of the room instead of the one it measures.",
      fr: "Transmet la température de la pièce à l'appareil, pour que sa propre régulation travaille avec la température de la pièce plutôt qu'avec celle qu'il mesure.",
      de: "Gibt die Raumtemperatur an das Gerät weiter, damit seine eigene Regelung mit der Temperatur des Raums arbeitet statt mit der, die es selbst misst.",
    },
    ...helpOf(["sync_with_calibration", "sync_entity_ids"]),
  },
  core_advanced: {
    ...SAFETY_WIDGET_TEXTS,
    "label.safety_delay_min": { en: "Safety delay (min)", fr: "Délai max. sans mesure (min)", de: "Max. Zeit ohne Messung (min)" },
    "label.safety_min_on_percent": { en: "Minimum power for safety mode", fr: "Puissance minimale (mode sécurité)", de: "Mindestleistung (Sicherheitsmodus)" },
    "label.safety_default_on_percent": { en: "Power in safety mode", fr: "Puissance en mode sécurité", de: "Leistung im Sicherheitsmodus" },
    "label.manual_override_duration_min": { en: "Manual override duration (min)", fr: "Durée de la dérogation manuelle (min)", de: "Dauer der Übersteuerung (min)" },
    "title.advanced": {
      en: "Safety and manual override",
      fr: "Sécurité et dérogation",
      de: "Sicherheit und Übersteuerung",
    },
    "description.advanced": {
      en: "Safety settings (maximum delay between two measurements, minimum power and power in safety mode), manual override duration and repair of an incorrect state. Versatile Thermostat calls this tab \"Advanced parameters\". Leave the default values if you don't know what you are doing. These parameters can lead to very poor temperature control or bad power regulation",
      fr: "Réglages de sécurité (délai maximal entre deux mesures, puissance minimale et puissance en mode sécurité), durée de la dérogation manuelle et réparation de l'état incorrect. Versatile Thermostat appelle cet onglet « Paramètres avancés ». Laissez les valeurs par défaut si vous ne savez pas ce que vous faites. Ces paramètres peuvent induire des mauvais comportements du thermostat",
      de: "Sicherheitseinstellungen (maximale Zeitspanne zwischen zwei Messungen, Mindestleistung und Leistung im Sicherheitsmodus), Dauer der manuellen Übersteuerung und Reparatur des fehlerhaften Zustands. Versatile Thermostat nennt diesen Tab „Erweiterte Einstellungen\". Belassen Sie die Standardwerte, wenn Sie nicht wissen, was Sie tun. Diese Einstellungen können zu Fehlfunktionen des Thermostats führen.",
    },
    ...helpOf([
      "use_advanced_central_config", "safety_delay_min", "safety_min_on_percent", "safety_default_on_percent", "repair_incorrect_state",
      "manual_override_duration_min",
    ]),
    ...INSIGHT_COMMON,
    ...INSIGHT_SAFETY,
  },
  core_lock: {
    ...LOCK_WIDGET_TEXTS,
    ...helpOf(["use_lock_central_config", "lock_code", "lock_users", "lock_automations", "auto_relock_sec"]),
  },
  core_humidity: {
    ...HUMIDITY_WIDGET_TEXTS,
    ...helpOf(["use_humidity_feature", "humidity_sensor_entity_id"]),
  },
};

/**
 * The texts that every native plugin has: the states and the accessible names of the cards of the widgets and of their components. The
 * headings of the groups of the menus are texts of the dashboard, not of the plugins.
 */
export const COMMON_TEXTS: Readonly<Record<string, Text>> = {
  "widget.loading": { en: "Loading…", fr: "Chargement…", de: "Wird geladen…" },
  "widget.no_data": { en: "No data", fr: "Aucune donnée", de: "Keine Daten" },
  "widget.unavailable": { en: "unavailable", fr: "indisponible", de: "nicht verfügbar" },
  "widget.value_unavailable": { en: "{label}: unavailable", fr: "{label} : indisponible", de: "{label}: nicht verfügbar" },
  "widget.gauge.range": { en: "{value} on a range of {min} to {max}", fr: "{value} sur une plage de {min} à {max}", de: "{value} in einem Bereich von {min} bis {max}" },
  "widget.gauge.marker": { en: "{range}, {marker} {value}", fr: "{range}, {marker} {value}", de: "{range}, {marker} {value}" },
  "widget.history_unavailable": { en: "History unavailable", fr: "Historique indisponible", de: "Verlauf nicht verfügbar" },
  "widget.curve.summary": {
    en: "Over the last 24 hours: from {min} to {max}, last value {last}.",
    fr: "Sur les dernières 24 heures : de {min} à {max}, dernière valeur {last}.",
    de: "In den letzten 24 Stunden: von {min} bis {max}, letzter Wert {last}.",
  },
};

/** The messages of the error codes that the translations of Versatile Thermostat do not have, and the generic message. */
export const ERROR_TEXTS: Readonly<Record<string, Text>> = {
  generic: { en: "The value was refused ({code}).", fr: "La valeur a été refusée ({code}).", de: "Der Wert wurde abgelehnt ({code})." },
  lock_code_incorrect: { en: "The lock code must be made of four digits.", fr: "Le code de verrouillage doit comporter quatre chiffres.", de: "Der Sperrcode muss aus vier Ziffern bestehen." },
  configuration_not_complete: {
    en: "The configuration is not complete: a required element is missing.",
    fr: "La configuration est incomplète : un élément obligatoire manque.",
    de: "Die Konfiguration ist unvollständig: Ein erforderliches Element fehlt.",
  },
  required: { en: "This field is required.", fr: "Ce champ est obligatoire.", de: "Dieses Feld ist erforderlich." },
  invalid_value: { en: "This value is not valid.", fr: "Cette valeur n'est pas valide.", de: "Dieser Wert ist ungültig." },
  field_not_applicable: {
    en: "This field does not apply to this configuration and was not saved.",
    fr: "Ce champ ne s'applique pas à cette configuration et n'a pas été enregistré.",
    de: "Dieses Feld gilt nicht für diese Konfiguration und wurde nicht gespeichert.",
  },
  tab_unavailable: { en: "This section does not apply to this thermostat.", fr: "Cette section ne s'applique pas à ce thermostat.", de: "Dieser Abschnitt gilt nicht für dieses Thermostat." },
  unknown_tab: { en: "This section does not exist.", fr: "Cette section n'existe pas.", de: "Dieser Abschnitt existiert nicht." },
  not_found: { en: "This configuration no longer exists.", fr: "Cette configuration n'existe plus.", de: "Diese Konfiguration existiert nicht mehr." },
  config_version_unsupported: {
    en: "This configuration cannot be verified: the installed Versatile Thermostat version is not one this dashboard can edit, so it cannot be changed here.",
    fr: "Cette configuration ne peut pas être vérifiée : la version installée de Versatile Thermostat n'est pas une version que ce tableau de bord sait éditer, elle ne peut donc pas être modifiée ici.",
    de: "Diese Konfiguration kann nicht überprüft werden: Die installierte Version von Versatile Thermostat kann mit diesem Dashboard nicht bearbeitet werden, daher kann sie hier nicht geändert werden.",
  },
  central_config_exists: { en: "A central configuration already exists.", fr: "Une configuration centrale existe déjà.", de: "Es gibt bereits eine zentrale Konfiguration." },
  unknown_thermostat_type: { en: "This type of thermostat does not exist.", fr: "Ce type de thermostat n'existe pas.", de: "Dieser Thermostattyp existiert nicht." },
  flow_failed: {
    en: "Versatile Thermostat did not accept the configuration.",
    fr: "Versatile Thermostat n'a pas accepté la configuration.",
    de: "Versatile Thermostat hat die Konfiguration nicht angenommen.",
  },
  out_of_range: { en: "The temperature is outside the allowed range.", fr: "La température est hors des limites autorisées.", de: "Die Temperatur liegt außerhalb des zulässigen Bereichs." },
  unknown_preset: { en: "This preset does not exist.", fr: "Ce pré-réglage n'existe pas.", de: "Diese Voreinstellung existiert nicht." },
  preset_rejected: { en: "Home Assistant refused this temperature.", fr: "Home Assistant a refusé cette température.", de: "Home Assistant hat diese Temperatur abgelehnt." },
  preset_not_applied: {
    en: "The thermostat was not ready and kept its previous temperature.",
    fr: "Le thermostat n'était pas prêt et a gardé sa température précédente.",
    de: "Das Thermostat war nicht bereit und hat seine vorherige Temperatur behalten.",
  },
};
