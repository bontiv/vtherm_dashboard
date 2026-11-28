# Native UI plugins
Audience: plugin authors. The terms are defined in the [terminology](plugin-development.md#terminology).

The dashboard itself is made of 16 native UI plugins, registered by Python like any other UI plugin. They are UI plugins only: they are not add-ons and not separate packages. A UI plugin of yours can place its
tabs, replace one of theirs or remove it, with the identifiers of this page. See [Hooks and placement](hooks-and-placement.md).

- `core`: the top tabs, the pages Overview, Plugins and Development, the overview of a thermostat, and the sections Main attributes,
  Features and Underlyings.
- One plugin for each other section of the config flow of Versatile Thermostat: `core_tpi`, `core_presets`, `core_central_boiler`,
  `core_window`, `core_motion`, `core_power`, `core_presence`, `core_auto_start_stop`, `core_valve_regulation`, `core_sync_temp`,
  `core_advanced`, `core_lock`, `core_humidity` and `core_heating_failure`.
- `core_complements`: the tab "VT add-ons" with its entries Catalog and Installed. See [Add-ons for Versatile Thermostat](../user/complements.md).

The identifiers `core` and `core_*` are reserved: the server leaves out a third-party plugin that uses one.

## Load order
`core` loads first, and every other native plugin requires it. Each native plugin loads after the one that comes before it in the
menu of the config flow.

## Order and groups of the menus
The menus of a thermostat and of the general configuration put the native tabs in two groups that the core shares
(`CORE_MENU_GROUPS`, see [Groups of the menus](hooks-and-placement.md#groups-of-the-menus)), in the order of `MENU_ORDER`
(`tab-definitions.ts`), which is not the order of the flow:

- **General settings** (`core:settings`), the tabs that cannot be turned off: main attributes, underlyings, presets, TPI, valve
  regulation, safety and manual override. The page that creates the central configuration is in this group too.
- **Optional features** (`core:features`), the tabs that can be off: central boiler, window, motion, power, presence, auto start and
  stop, synchronization of the temperature, lock, humidity, heating failure detection.

The overview of a thermostat stays first, without group; the group "Dashboard" of the Configuration comes after the two groups. Each
tab is placed `after` the closest tab before it in `MENU_ORDER` whose plugin is already loaded, so the order does not depend on the
load order. A tab of yours placed between two native tabs keeps the heading whole when it declares the same group.

## Identifiers of the contributions
A plugin with one tab names it `main`: `core_tpi.tab.main`. `core` has two tabs, named after them: `core.tab.main` and
`core.tab.type`. A section of the central configuration uses `general` instead of `tab`. There is no tab for the step `features` of the
flow: `core.tab.features` and `core.general.features` no longer exist (place your tab relative to `core.tab.type` or `core.tab.main`).

For example, `placement: { after: "core_tpi.tab.main" }` puts a tab right after the TPI tab, and `placement: { replace: "core_lock.tab.main" }`
puts yours in place of the lock tab.

### The widgets of the overview of a thermostat
Thirteen native plugins add widgets to the overview of a thermostat (`thermostat_widget`). They only show how Versatile Thermostat works;
none draws a command. Their order, from the placements, is:

| Order | Widget | Plugin | Placement | Shown when |
| --- | --- | --- | --- | --- |
| 1 | `core.widget.temperature` | `core` | `first` | the thermostat exists |
| 2 | `core.widget.mode` | `core` | after the temperature | the thermostat exists |
| 3 | `core.widget.alerts` | `core` | after the mode | the thermostat exists |
| 4 | `core_tpi.widget.heating` | `core_tpi` | after the alerts | the algorithm is TPI and the thermostat has a heating share |
| 5 | `core_valve_regulation.widget.valve` | `core_valve_regulation` | after the heating | the thermostat has an opening of valve |
| 6 | `core_presets.widget.preset` | `core_presets` | after the heating | the thermostat exists |
| 7 | `core_advanced.widget.safety` | `core_advanced` | after the preset | the thermostat has the sensor of the safety mode, and the safety mode is configured |
| 8 | `core_window.widget.window` | `core_window` | after the preset | the window detection is on (`use_window_feature`) and the binary sensor `window_state` exists |
| 9 | `core_motion.widget.motion` | `core_motion` | after the window | the motion detection is on (`use_motion_feature`) and the binary sensor `motion_state` exists |
| 10 | `core_power.widget.overpowering` | `core_power` | after the motion | the power management is on (`use_power_feature`) and the binary sensor `overpowering_state` exists |
| 11 | `core_auto_start_stop.widget.auto_start_stop` | `core_auto_start_stop` | after the load shedding | the thermostat is over a climate without valves, has the feature, and publishes `auto_start_stop_manager` |
| 12 | `core_lock.widget.lock` | `core_lock` | after the auto start and stop | the lock is configured (`is_lock_configured`) |
| 13 | `core_heating_failure.widget.failure` | `core_heating_failure` | after the lock | the detection is on and the binary sensor `heating_failure_state` exists, except over a climate without valves |
| 14 | `core.widget.devices` | `core` | `last` | the thermostat publishes its equipment (`underlying_entities`) |
| 15 | `core_tpi.widget.auto_tpi` | `core_tpi` | after the equipment | the algorithm is TPI, `auto_tpi_mode` is on and the sensor `auto_tpi_learning` is not `disabled` |
| 16 | `core_central_boiler.widget.thermostat` | `core_central_boiler` | after Auto TPI | the thermostat is used by the central boiler and the central boiler is on |
| 17 | `core_power.widget.energy` | `core_power` | after the boiler | the sensor `energy` or `mean_power_cycle` exists |
| 18 | `core_humidity.widget.humidity` | `core_humidity` | after the energy | the `climate` entity publishes `current_humidity` |
| 19 | `core_sync_temp.widget.sync` | `core_sync_temp` | after the energy | the thermostat is over a climate and publishes the tracking of its setpoint or a synchronisation |
| 20 | `core.widget.history` | `core` | `last` | the thermostat exists |

The valve and the preset are both placed after the heating: the valve, loaded after the presets, goes right after the heating, so before
the preset. The widgets of the features (8 to 13) are each placed after the one before them; the safety, loaded later, is placed after
the preset, so it comes before the window. When the preset is not there, the window goes last, and the other widgets of the features
follow it in their order. `core` loads first: it places the equipment and the history last, so the widgets of the other plugins, placed
after their targets, come before them. The tracking of the equipment is placed after the energy, and the humidity, loaded later, comes
in between. The history takes two columns and two rows, Auto TPI and the energy one column and two rows. A hidden widget keeps its place. Put a widget of yours between two of them with `after`, for example
`placement: { after: "core.widget.mode" }`, or take one away with `remove`. The other widgets declare no `size`: each takes one column.
The other native plugins have no widget in the overview of a thermostat.

### The widgets of the Overview page
Four native plugins add widgets to the Overview page (`global_widget`). They read the central configuration (`central`) and the entities
of the central device with `getEntryEntities(hass, central.entryId)`; none draws a command. Their order, from the placements, is:

| Order | Widget | Plugin | Placement | Size | Shown when |
| --- | --- | --- | --- | --- | --- |
| 1 | `core.widget.central_mode` | `core` | `first` | 1 column | the central device has the `select` of the central mode |
| 2 | `core_presence.widget.presence` | `core_presence` | after the central mode | 1 column | the presence sensor of the central configuration exists |
| 3 | `core.widget.summary` | `core` | after the central mode | 1 column | at least one thermostat exists |
| 4 | `core_central_boiler.widget.boiler` | `core_central_boiler` | after the summary | 1 column, 2 rows | the central boiler is on in the central configuration and the binary sensor `central_boiler_state` exists |
| 5 | `core_central_boiler.widget.boiler_power` | `core_central_boiler` | after the boiler | 2 columns, 2 rows | the central boiler is on in the central configuration and the sensor `total_power_active_boiler` exists |
| 6 | `core_power.widget.house_power` | `core_power` | after the power of the boiler | 1 column | a thermostat publishes `power_manager.current_power` |
| 7 | `core.widget.outdoor` | `core` | after the summary | 2 columns, 2 rows | the outdoor sensor of the central configuration exists |

`core` loads first, so it places the outdoor temperature after the summary: the boiler, its power and the power of the home, loaded
later, come in between; the presence, loaded last, comes right after the central mode. A hidden widget keeps its place. Put a widget
of yours between two of them with `after`, or take the place of one with `replace`, for example
`placement: { replace: "core_central_boiler.widget.boiler" }`: the others keep their order. Versatile Thermostat has no central presence
entity: the presence is the sensor `presence_sensor_entity_id` of the central configuration.

The table is generated from the code by `frontend/test/native-docs.test.ts`. Do not edit it: run `UPDATE_NATIVE_DOCS=1 npx vitest run frontend/test/native-docs.test.ts`.
The titles are those of the dashboard: the tab of `core_advanced`, "Safety and manual override", is the step that Versatile Thermostat
calls "Advanced parameters".

<!-- native-ids -->
| Plugin | Contribution | Where | Title |
| --- | --- | --- | --- |
| `core` | `core.top.dashboard` | `top_tab` | Dashboard |
| `core` | `core.top.thermostats` | `top_tab` | Thermostats |
| `core` | `core.top.configuration` | `top_tab` | Configuration |
| `core` | `core.page.plugins` | `tab_page` | Plugins |
| `core` | `core.page.dev_plugins` | `tab_page` | Development |
| `core` | `core.page.overview` | `global_page` | Overview |
| `core` | `core.general.create` | `general_config` | Central configuration |
| `core` | `core.general.main` | `general_config` | Main attributes |
| `core` | `core.page.thermostat_overview` | `thermostat_config` | Overview |
| `core` | `core.tab.main` | `thermostat_config` | Main attributes |
| `core` | `core.tab.type` | `thermostat_config` | Underlyings |
| `core` | `core.widget.temperature` | `thermostat_widget` | Temperature |
| `core` | `core.widget.mode` | `thermostat_widget` | Mode and action |
| `core` | `core.widget.alerts` | `thermostat_widget` | Alerts |
| `core` | `core.widget.devices` | `thermostat_widget` | Equipment |
| `core` | `core.widget.history` | `thermostat_widget` | Last 24 hours |
| `core` | `core.widget.central_mode` | `global_widget` | Central mode |
| `core` | `core.widget.summary` | `global_widget` | Thermostats |
| `core` | `core.widget.outdoor` | `global_widget` | Outdoor temperature |
| `core_tpi` | `core_tpi.tab.main` | `thermostat_config` | TPI parameters |
| `core_tpi` | `core_tpi.general.main` | `general_config` | TPI parameters |
| `core_tpi` | `core_tpi.widget.heating` | `thermostat_widget` | Heating |
| `core_tpi` | `core_tpi.widget.auto_tpi` | `thermostat_widget` | Auto TPI learning |
| `core_presets` | `core_presets.tab.main` | `thermostat_config` | Presets |
| `core_presets` | `core_presets.general.main` | `general_config` | Presets |
| `core_presets` | `core_presets.widget.preset` | `thermostat_widget` | Preset |
| `core_central_boiler` | `core_central_boiler.general.main` | `general_config` | Central boiler |
| `core_central_boiler` | `core_central_boiler.widget.boiler` | `global_widget` | Central boiler |
| `core_central_boiler` | `core_central_boiler.widget.boiler_power` | `global_widget` | Power asked of the boiler |
| `core_central_boiler` | `core_central_boiler.widget.thermostat` | `thermostat_widget` |  |
| `core_window` | `core_window.tab.main` | `thermostat_config` | Window detection |
| `core_window` | `core_window.general.main` | `general_config` | Window detection |
| `core_window` | `core_window.widget.window` | `thermostat_widget` | Window |
| `core_motion` | `core_motion.tab.main` | `thermostat_config` | Motion detection |
| `core_motion` | `core_motion.general.main` | `general_config` | Motion detection |
| `core_motion` | `core_motion.widget.motion` | `thermostat_widget` | Motion |
| `core_power` | `core_power.tab.main` | `thermostat_config` | Power management |
| `core_power` | `core_power.general.main` | `general_config` | Power management |
| `core_power` | `core_power.widget.house_power` | `global_widget` | Power of the home |
| `core_power` | `core_power.widget.overpowering` | `thermostat_widget` | Load shedding |
| `core_power` | `core_power.widget.energy` | `thermostat_widget` | Energy |
| `core_presence` | `core_presence.tab.main` | `thermostat_config` | Presence detection |
| `core_presence` | `core_presence.general.main` | `general_config` | Presence detection |
| `core_presence` | `core_presence.widget.presence` | `global_widget` | Presence |
| `core_auto_start_stop` | `core_auto_start_stop.tab.main` | `thermostat_config` | Auto start and stop |
| `core_auto_start_stop` | `core_auto_start_stop.widget.auto_start_stop` | `thermostat_widget` | Auto start and stop |
| `core_valve_regulation` | `core_valve_regulation.tab.main` | `thermostat_config` | Valve regulation configuration |
| `core_valve_regulation` | `core_valve_regulation.widget.valve` | `thermostat_widget` | Valve |
| `core_sync_temp` | `core_sync_temp.tab.main` | `thermostat_config` | Synchronize device temperature |
| `core_sync_temp` | `core_sync_temp.widget.sync` | `thermostat_widget` | Tracking of the equipment |
| `core_advanced` | `core_advanced.tab.main` | `thermostat_config` | Safety and manual override |
| `core_advanced` | `core_advanced.general.main` | `general_config` | Safety and manual override |
| `core_advanced` | `core_advanced.widget.safety` | `thermostat_widget` | Safety |
| `core_lock` | `core_lock.tab.main` | `thermostat_config` | Lock |
| `core_lock` | `core_lock.general.main` | `general_config` | Lock |
| `core_lock` | `core_lock.widget.lock` | `thermostat_widget` | Lock |
| `core_humidity` | `core_humidity.tab.main` | `thermostat_config` | Humidity |
| `core_humidity` | `core_humidity.widget.humidity` | `thermostat_widget` | Humidity |
| `core_heating_failure` | `core_heating_failure.tab.main` | `thermostat_config` | Heating failure detection |
| `core_heating_failure` | `core_heating_failure.general.main` | `general_config` | Heating failure detection |
| `core_heating_failure` | `core_heating_failure.widget.failure` | `thermostat_widget` | Heating failure |
| `core_complements` | `core_complements.top.complements` | `top_tab` | VT add-ons |
| `core_complements` | `core_complements.page.installed` | `tab_page` | Installed |
| `core_complements` | `core_complements.page.catalog` | `tab_page` | Catalog |
<!-- /native-ids -->

## The tabs and their values
A native tab reads and proposes values like any component of a plugin: it receives `hass`, `values`, `errors` and
`proposeChanges`, and for a thermostat `thermostatId` and `centralValues`. The values and the errors are those of the draft, by
the keys of the flow of Versatile Thermostat. Which fields a tab shows, and when it appears, follow the forms of the flow: see
[Driving the config flow](../contributing/config-flow-driver.md).

### The tabs of the features
The tabs of the features (window, motion, power, presence, auto start and stop, central boiler, synchronization of the temperature,
heating failure detection) declare the value that turns their feature on (`feature`: `use_window_feature`, `use_motion_feature`,
`use_power_feature`, `use_presence_feature`, `use_auto_start_stop_feature`, `use_central_boiler_feature`,
`sync_device_internal_temp`, `use_heating_failure_detection_feature`). While the feature is off, the tab stays in the menu with the
status `Off`; its page shows the explanation of the feature and the switch of the dashboard instead of its fields, with the save
actions at the foot of the same card. While the feature is on, the switch stays above the fields to turn it off. The switch is the only place to turn a
feature on or off: the step `features` of the flow has no tab. It changes, in the draft, the value of the step of the flow that holds
it (`featureStepOf`): `features`, or `type` for the synchronization of the temperature of a thermostat over a climate. A value of
the step `features` that a save refuses puts the tab of its feature in error.
A tab whose feature does not exist for the type of the thermostat is not in the menu: the auto start and stop for a thermostat over a
switch, the heating failure detection for a thermostat over a climate without valve regulation, as the form Features of
Versatile Thermostat decides, or the synchronization of the temperature for a thermostat that is not over a climate.

The humidity and the lock have no feature switch, but their values can turn them off (`off` of their `TabDefinition`): the humidity
while **Use humidity sensor** is unchecked, the lock while it blocks neither the users nor the automations. Their page stays as usual.
A thermostat that uses a central lock that blocks nothing shows `Central (off)`.

### The layout of the tabs
A native tab draws its fields on a grid that adds columns with the width (`repeat(auto-fill, minmax(min(300px, 100%), 1fr))`: a tile of at least 300 px, so that the name of a field fits on one line); a
list, a template, a text of several lines and the blocks of commands take the whole width (`isWideField`). Its card uses the width of
the page, up to 1240 px. The fields of `ADVANCED_FIELDS` (`tab-definitions.ts`) are in the panel **Advanced settings (N)**, closed,
open when one of them is refused or required without a value; a field that the list does not know, added by a new version of
Versatile Thermostat, stays out of the panel. The option of inheritance of a tab (`use_*_central_config`) is drawn as the switch
**Customize for this thermostat**, which writes its opposite, and the central values as chips with a link to the same section of the
general configuration. The tab of the window of a thermostat adds the choice of the method of detection (`windowMethod`), and shows
only the fields of the method that is chosen.

The inputs of a row of the grid start at the same height. The entity picker of Home Assistant shows its name above its input, the
other controls inside it: each tile takes two rows of the grid, a band for that name then the tile (`.label-band`, `.field-body`). A
tile whose control shows its name above (`labelAbove` in `fields.ts`: an entity picker of one entity) has a band of
`LABEL_ABOVE_HEIGHT` px (25, measured on the Home Assistant of the devcontainer) and moves its body up into it; the other tiles have
an empty band. So the band takes height only in a row that holds an entity picker, and the other inputs and switches of that row move
down to the inputs of the pickers. The button (i) of such a tile moves down by the same height (`::part(toggle)` of the help), so
that it stays at the height of its input.

The name of a field that is not wide fits on one line of a tile at its narrowest: at most `LABEL_MAX_LENGTH` characters (38), the
asterisk of a required field included. A longer name wraps inside the input of Home Assistant and covers the value. When the name of
Versatile Thermostat is longer, the catalog of the plugin gives a short name, `label.<key>`, which the tab and the list of the missing
fields of a creation show instead of `field.<key>` (`fieldLabelKey`); the hint and the explanation of the field keep the details. A
test of `frontend/test/native-plugins.test.ts` checks the names of every native field in English, French and German, and names the
field and the language that are too long.

### The help of the fields
Each field of a native tab has up to three levels of help, from the catalog of its plugin:

- `hint.<key>`: a hint of one sentence, given to the `helper` of its `ha-selector`. Without it, the help of Versatile Thermostat
  (`help.<key>`) is shown.
- `info.<key>`: the explanation of the panel of help. Without it, the panel shows the help of Versatile Thermostat when it is another
  text than the hint.
- a diagram of the library of the dashboard, which `FIELD_DIAGRAMS` (`field-diagrams.ts`) gives by key: `cycle_min` → `tpi_cycle`, the
  coefficients of TPI → `tpi_formula`, the openings of a valve → `valve_curve`, and so on. `stagger` illustrates only the switches of a
  thermostat over switch.

The button (i) of a field appears when it has an explanation or a diagram. The diagrams are drawn with the values of the draft, the
central ones for a section that inherits, and highlight the setting of the field that has the focus. `GROUP_DIAGRAMS` names the
groups of fields that share a diagram (the openings of a valve, the coefficients of TPI, the detection of a window): their diagram is
a tile of the grid after the last field of the group, on two columns when the grid has three, and after the chips of a section that
inherits. The fields of a group do not repeat it in their own panel, except a field of the group that is in the advanced settings.

### The status of the tabs
Each native tab gives its status to the menu: `Off` or `Central (off)` when its values turn it off, the number of the required fields
that it shows without a value (and the sensor of a window detected with a sensor), `Central` when it uses the central configuration,
otherwise a check mark, which the menu does not show for the tabs of the general settings: they are always on. The dashboard adds
`Off` for a feature that is off, and `Error`. See
[Status of a configuration section](hooks-and-placement.md#status-of-a-configuration-section).

### The controls
The native tabs draw their fields with the components of Home Assistant: one `ha-selector` per field, whose selector comes from the
contract of the SDK (`definitionOf` turns a field of the flow into a `FieldDefinition`, then `selectorOf` gives the selector), in a
`ha-card`, with `ha-alert` for the errors, `ha-expansion-panel` for the advanced settings, `ha-switch` for the switch Customize and
`ha-button` for the actions. The button (i) of the help of a field is a button of the dashboard with the icon `ha-svg-icon`, not
`ha-icon-button`, which gives neither the state of the panel nor the panel that it controls to the button inside it. The method of detection of a window is a `ha-selector` of type `select` in the mode `box`. The commands of
a thermostat on switch and the services of the central boiler use `ha-service-picker`. The units of the delays and the classes of
devices of the sensors are written by hand in `shared/vtherm-config-schemas.json` (`unit`, `device_classes`); the drift test keeps
them. When a component is not defined after `ensureHaControls()`, the tab draws plain HTML controls, the fallback, and writes one
warning in the console. Do the same in your UI plugin: see [Developing a UI plugin](plugin-development.md#fields-of-configuration).

## Texts
Each native plugin has English, French and German catalogs, generated from the translations of Versatile Thermostat with
`npm run catalogs:generate`. English is the default for any other language.
