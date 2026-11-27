# Changelog
All notable changes of the dashboard and of the SDK `@vtherm/dashboard-sdk`, which share one version. The format follows
[Keep a Changelog](https://keepachangelog.com/) and the versions follow [Semantic Versioning](https://semver.org/).

Each version has a section **For plugin authors**: the changes of the contract of the plugins (the SDK, the hooks, the placements, the
WebSocket command that lists the plugins) and what to change in a plugin to follow them. See
[Developing a plugin](docs/plugins/plugin-development.md#10-a-new-major-version-of-the-dashboard).

## [Unreleased]

### Changed
- Only the widgets and the configuration tabs of the native plugins are limited to what the dashboard saves or shows. A widget of
  another plugin can call the services of Home Assistant and draw commands, and a configuration tab of another plugin can write its own
  data (for example the entities of its plugin) without going through the draft. The native widgets and tabs are checked by a test
  (`frontend/test/plugin-write-access.test.ts`).

### For plugin authors
- A widget (`global_widget`, `thermostat_widget`) can call `hass.callService` and draw commands, and a component of `general_config`
  or `thermostat_config` can write by itself, without the draft and without `save_config`. The dashboard does not stop them and does not
  count their writes in the draft: a tab that writes by itself shows its own state, its own error and its own undo. Nothing changes for
  a plugin that does not write.

## [0.1.0-beta4]
The fourth beta.

### Changed
- The tab **VT add-ons** opens on **Installed**, which is now the first entry of its menu, before **Catalog**.

### Fixed
- The add-ons pages work on Home Assistant 2026.11, where HACS is built into Home Assistant as the **Marketplace** and the commands
  `hacs/*` are unknown. The dashboard finds the Marketplace and installs, lists and follows the add-ons with its commands
  (`marketplace/*`), and keeps HACS on Home Assistant 2026.10 and older. The texts, the buttons ("Open in the Marketplace") and the links
  (`/marketplace/repository/<id>`) name the store that Home Assistant has. Without a store, the message names the Marketplace and links
  to its documentation instead of the installation of HACS (issue #1).
- With the Marketplace, the installation is off until the user accepted the warning of the Marketplace, and an add-on that is not in the
  Marketplace yet cannot be added until GitHub is connected there. The page says so and links to the Marketplace. A new integration with
  a config flow that the Marketplace loads at once is "To configure" without a restart.
- The warning banner of the add-ons pages has a single outline: the border and the padding are drawn only by the fallback without
  `ha-alert`, which draws its own.

### For contributors
- The Python tests run on Home Assistant 2026.11.0, pinned in `requirements-dev.txt`, with `pytest-homeassistant` (the test helpers of
  the core) instead of `pytest-homeassistant-custom-component`, which stops at 2026.10, as Versatile Thermostat does. Reinstall the
  requirements, and remove `pytest-homeassistant-custom-component` from an existing environment: its plugin no longer imports.
- The projects that the dashboard reads (Versatile Thermostat, `vtherm_api`, HACS) are located through the `VTHERM_*_DIR` variables
  instead of links in `external/`.
- `tests/test_marketplace_contract.py` records the answers of the real Marketplace in `shared/marketplace-answers.json`
  (`--update-marketplace-answers`), and `frontend/test/store-contract.test.ts` replays them, as for HACS.

### For plugin authors
- Nothing changes for plugins.

## [0.1.0-beta3]
The third beta.

### Added
- The page of an add-on shows the README of its repository in a **Documentation** card, in the language of the user when the
  repository has one, else the main README marked **(EN)**, with its relative links and images made absolute. The new administrator
  command `vtherm_dashboard/get_complement_readme` reads it for an add-on of the catalog only, and keeps it in memory for an hour.
- The Presets section shows the temperatures as a table: a row for each preset (frost, eco, comfort, boost) and a column for each
  situation (normal, away, air conditioning, air conditioning away), instead of up to fifteen fields in a list. The columns follow the
  presence feature and the AC mode, a cell without an entity shows "—", changed cells are marked, and a warning that does not block the
  save appears when the order frost ≤ eco ≤ comfort ≤ boost is not respected (the opposite in air conditioning). A thermostat that uses
  the central presets shows the table read-only, with a link to the presets of the general configuration, and a narrow card folds it into
  one block for each preset. The cells are compact number fields, not `ha-selector`, so that four columns fit on a card.
- Each section of a configuration shows its status in the menu, and in the drawer of a phone: a check mark when nothing required is
  missing, `Central` when it uses the central configuration, `N missing`, `Off` when its feature is off, `Error` after a save that refused
  one of its values. The status follows the draft before any save. After a refused save, the message above the actions offers to go to
  the first other section in error.
- The sections of the features that are off (window, motion, power, presence, auto start and stop, central boiler, heating failure
  detection) stay in the menu, in retreat, with an explanation of the feature and a switch that turns it on in the draft.
- Panels of estimation in the sections TPI, Window and Advanced of a thermostat, closed at first: what VT would do with the settings
  of the page, before saving. TPI: the heating share now, decomposed into the room and outdoor parts with a setpoint to try, then a
  replay over 24 h or 7 days of the share estimated against the one recorded by VT, with the time to reach the setpoint, the largest
  overshoot and the time within ±0.5°. Window: the replay of the detection by the drop of the temperature with the thresholds of the
  page. Advanced: the silences of the temperature sensors against the delay of the safety mode. The history is read from the recorder
  only while a panel is open, and every computed value is marked as an estimation.
- Help of the fields: each native field has a hint in plain language under its control, and a button (i) that opens, under the field,
  an explanation and a diagram of the setting, in English, French and German. The diagrams (cycle and formula of TPI, minimal delays,
  thresholds, curve of a valve, regulation, window, motion, safety, manual override, heating failure, spread of the switches) are drawn
  with the values of the draft and highlight the setting of the field that has the focus; the fields that share a diagram show it next
  to them.
- The overview of a thermostat shows seven cards, in display only: **Temperature** (gauge with the setpoint, outdoor temperature,
  requested → applied setpoint, regulated setpoint), **Mode and action** (with the reason, the sleep mode and the central mode),
  **Alerts** (messages, equipment unavailable, age of the measures against the safety delay, inhibition), **Heating** (TPI share and cycle),
  **Valve** (opening, and each valve), **Preset** (timed preset and manual override) and **Safety**. A card whose feature the thermostat
  does not have is hidden. The cards are in English, French and German, and none changes the thermostat.
- The overview of a thermostat shows six more cards, one for each feature that acts on it, in display only, after the base cards:
  **Window** (sensor, detection by the drop of temperature, bypass, and the effect now: off, eco, frost protection, fan only or none),
  **Motion** (with the preset of activity), **Load shedding**, **Auto start and stop** (automatic stop, feature enabled, accumulated
  error against its threshold, last switch), **Lock** and **Heating failure** (failures, probable cause with a link to the entity, check
  in progress, detection paused by its template). A feature that is off leaves no card.
- The overview of a thermostat shows seven cards of details, in display only, after the cards of the features: **Equipment** (state of
  each equipment, expected active but off, fan mode), **Auto TPI learning** (state, cycles, coefficients, confidence in percent, time
  constant, heating capacity, last status, start), **Central boiler** (whether the thermostat calls it), **Energy** (mean power with
  its curve over 24 h, energy used), **Humidity**, **Tracking of the equipment** (temperature sent, suspended tracking with its gaps)
  and, last, **Last 24 hours** on two columns (temperatures and heating share, read once the card is visible).
- The Overview page of the Dashboard tab shows seven cards, in display only: **Central mode**, **Presence**, **Thermostats** (how many
  heat, are idle, are off or are unavailable, and the thermostats in alert with a link to their overview), **Central boiler** (on or
  off, active devices against the threshold, the thermostats that call it, delayed activation, not ready), **Power asked of the boiler**
  (gauge with the threshold and curve over 24 h), **Power of the home** (power against the maximum, margin, total energy) and **Outdoor
  temperature** (value and curve over 24 h). A card whose feature is off or whose entity does not exist is hidden; with
  no thermostat and no central configuration, the page says that there is nothing to show yet. None changes the central mode or the
  presence.
- The grid of the widgets of the overview pages uses the width of the screen: a widget can take several columns or the whole row,
  and a minimal height; on a phone every card takes the whole width. Each widget is drawn in a card of Home Assistant. The common
  components of the native widgets (card, gauge, bars, icon of a state, row of a value, age of a measure) are ready; no widget is
  shown yet.

### Changed
- The add-ons pages are easier to read and to act on. The status of an add-on is an icon and a text with a contrast of at least 4.5:1,
  apart from its type, family and certification. A whole card opens the add-on and carries the action to do (**Configure**,
  **Restart Home Assistant**, **Open in HACS**). The versions ("1.2.0 → 1.3.0") and **Update available** come on top of the state.
  The label "Link only" is now **Manual install**.
- The lists of add-ons offer only the filter values that exist on the page, a **To handle** choice, a count, **Clear filters**, a
  sort (certification with headings, name, state), a summary of the add-ons that need an action, and on a phone the filters are behind
  a **Filters** button. The search, the filters and the sort are kept in the address.
- The page of an add-on is a header, an action card and a documentation card, side by side on a wide screen. It is shown as soon as the
  catalog is read, without waiting for HACS ("Reading HACS…"). A name with the `[EXPERIMENTAL]` prefix is shown without it and with a
  badge, and the page warns about it. The title of the tab starts with the name of the add-on. Descriptions keep their line breaks, and
  an English text shown to another language is marked **(EN)**.
- A blueprint is imported, and an add-on repository is added, with the windows of Home Assistant (My Home Assistant links), or with a
  copyable address when the integration `my` is not there. The window of confirmation of an installation shows the HACS category in
  the language of the user and the repository as a link.
- The breadcrumb of the dashboard centers its current segment, and keeps the last segment on one line on a phone.
- The fields of a native section are tiles on a grid that uses the width of the screen, on one column on a phone. The settings that
  are rarely changed are in a closed panel **Advanced settings (N)** at the end of their section, which opens by itself when one of
  them is refused or missing.
- The option "Use the central configuration" of a section is the switch **Customize for this thermostat**. The central values that a
  section uses are chips with the names of their entities, and a link opens the same section of the general configuration; without
  any central value, the section says that the defaults of Versatile Thermostat apply.
- The section Window asks how to detect an open window, with an opening sensor or by the drop of the temperature, and shows only the
  fields of that method. Choosing a method removes the values of the other one from the draft. Without a sensor, the method "Opening
  sensor" counts the sensor as missing.
- The Thermostats tab shows a tile for each thermostat, live: the temperature of the room and the setpoint, the action (heating,
  cooling, idle, off) with a dot of its color, the preset, and "Unavailable" when its climate entity is. The tiles keep the grouping by
  area, and the tile **New thermostat** at the end replaces the button **Create a thermostat**.
- Creating a thermostat or the central configuration is a page of configuration, like an existing one: a menu on the left, one
  section at a time, the draft kept from a section to another. A new thermostat first asks for its type on its own screen, with three cards (switch, climate, valve) that open the page of configuration when chosen, then has the sections Main attributes, Underlyings, TPI parameters when the type uses them, and Advanced parameters, so the TPI and advanced parameters that a thermostat without central configuration needs can be set at creation. The breadcrumb brings back the choice of the type. The central configuration has Main attributes, TPI parameters
  and Advanced parameters. **Create** and **Cancel** replace **Save** and **Discard**, and a warning at the top of the page, above the
  card, lists the missing fields by section until nothing is missing, and the required fields that are still empty are shown in red, marked "Required". Changing the type keeps the values that the new type accepts. The assistant of creation is gone, and the central
  configuration is no longer created at `/vtherm/<thermostats tab>/new/central`: **Create the central configuration** opens its sections
  in the Configuration tab.

- The menu of a thermostat and the sections of the central configuration are grouped under two headings, as the Configuration
  already was: **General settings** (main attributes, underlyings, features, presets, TPI parameters, valve regulation, advanced),
  then **Optional features** (central boiler, window, motion, power, presence, auto start and stop, synchronization of the
  temperature, lock, humidity, heating failure detection). The heading "Versatile Thermostat" of the Configuration is gone. The
  sections of the general settings no longer show a check mark when nothing is missing: they are always on.
- The section Humidity is `Off` while **Use humidity sensor** is unchecked, and the section Lock is `Off` while it blocks neither the
  users nor the automations. A thermostat that uses a central lock that blocks nothing shows `Central (off)`.
- The section Sync device internal temperature of a climate thermostat stays in the menu while the option is off, and turns it on in
  place, as the sections of the other features do.
- The tab "Advanced parameters" is now "Safety and manual override" ("Sécurité et dérogation", "Sicherheit und Übersteuerung"):
  it holds the safety mode, the manual override and the repair of an incorrect state, and its name no longer repeats the closed panel
  "Advanced settings (N)" of each section. Its description keeps the old name, which Versatile Thermostat still uses. Identifiers and
  addresses do not change.

- The inputs of a row of fields start at the same height: the fields and the switches of a row that holds an entity picker, whose
  name is above its input, move down to its input. A row without an entity picker keeps its height.
- The names of the fields fit on one line of their tile in English, French and German: the names of Versatile Thermostat that were
  too long, and whose second line covered the value (the safety delay, the thresholds of the window detection, the delays of the
  window, the power sensors, among others), have a short name in the dashboard; their hint keeps the details.

- The tab **Features** is gone from the menu of a thermostat and from the Configuration: each feature is turned on and off by the
  switch of its own section, in the group **Optional features**, which already showed the state of each one. The switch stays above
  the section while the feature is on, and the save actions are at the foot of its card while the feature is off, so a feature turned off
  in place is saved there. A value of the features that a save refuses puts the section of that feature in error. The values are saved in the
  step "features" of Versatile Thermostat, as before.

### Fixed
- The configuration flow of the dashboard no longer fails with "Invalid handler specified" when Home Assistant still runs a
  `vtherm_api` older than 0.11.0 after an update, since it only loads the new version at a restart. The dashboard now stays loadable
  and raises a repair that offers to restart Home Assistant.

### For contributors
- The tests are much faster in the dev container: `node_modules` is on volumes of the container (rebuild the container), the Python
  tests run in parallel with `pytest -n auto` and without the debug mode of the event loop outside the continuous integration
  (`VTHERM_ASYNCIO_DEBUG=1` turns it on), and the tests that run the real Versatile Thermostat have the marker `vtherm`
  (`pytest -m "not vtherm"` leaves them out). Measured in the dev container: Vitest from 72 s to about 8 s, pytest from 194 s to 19 s.
- `npm run test:docs` runs the checks of the documentation, which `npm test` now skips because they are long.
- The sample plugin (`examples/vtherm_sample_plugin/ui`) is no longer a workspace of the root `package.json`, so an SDK version that is not
  published yet can no longer make `npm ci` fail for the whole repository. The CI job `sample-plugin` builds the SDK, installs it in the
  sample from a tarball, then builds and tests the sample. When it fails, the run shows the warning "Sample plugin" and stays green. The
  release check of the version of the sample is unchanged.

### For plugin authors
- A configuration contribution (`general_config`, `thermostat_config`) can declare `status`, a pure function of its context that
  returns `complete`, `inherited` or `incomplete` with the number of missing values, shown in the menu; and `feature`, the key of the value
  that turns its feature on: while it is off, the section stays in the menu with the status `Off`, and its page shows the explanation
  `feature_intro.<feature>` of the catalog of the plugin with a switch drawn by the dashboard. `sectionStatusOf` and `isSectionStatus`
  read a status, and the fake host gives `host.status(entry, context)`. A message of `draft.messages` can carry an `action`. The change is
  compatible: a contribution without them shows only `Error` after a refused save.
- The help of a field is offered to the plugins: create the element `FIELD_HELP_ELEMENT` (`vtherm-field-help`) next to a field and
  give it `label`, `info`, and a diagram of the library (`diagram`, typed by `DiagramId`, with `values` and `highlight`) or your own SVG
  in its slot `diagram`. `defineFieldHelpMock()` of `@vtherm/dashboard-sdk/testing` simulates it in a test. The change is compatible.
- The SDK exports `CORE_MENU_GROUPS`, the groups of the menus that the core shares (`core:settings`, `core:features`): a section that
  declares one joins the heading of the native sections, which the dashboard translates. The prefix `core:` is reserved. `status` can
  also return `{ kind: "off" }`, for a section without `feature` that its values turn off, and `{ kind: "inherited", off: true }`,
  shown `Central (off)`. The native tabs follow a new order in the menus (see the page Native plugins): a tab placed `after` a native
  tab keeps its target, but its neighbors may change. The change is compatible.
- The title of the tab of `core_advanced` changes, not its contract: `core_advanced`, `core_advanced.tab.main`,
  `core_advanced.general.main`, the catalog key `title.advanced` and the keys of its fields stay, so a placement `after:core_advanced.tab.main`
  or a saved address keeps working. The change is compatible.
- **BREAKING**: the contributions `core.tab.features` and `core.general.features` no longer exist. A plugin placed `after:` or
  `before:` one of them gets the warning `target_missing` and goes last: place it relative to `core.tab.type` or `core.tab.main`.
- The SDK exports `getEntryEntities(hass, entryId)`, a pure and synchronous function that finds the entities of a configuration entry
  of Versatile Thermostat (a thermostat, or the central configuration) in the registries of `hass`: its `climate` entity, its entities
  by translation key (`byKey`) and every entity of its device. It calls nothing on the server and gives empty values when the entry or a
  registry is missing. `thermostatId` is the configuration entry, not the `climate` entity: a widget that read
  `hass.states[thermostatId]` read nothing, use `getEntryEntities(hass, thermostatId).climate`. The change is compatible.
- The type `Hass` describes, as optional and read-only, the registries `entities` and `devices` and the formatters
  `formatEntityState` and `formatEntityAttributeValue` of Home Assistant; `HassState` has the optional `entity_id`, `last_changed` and
  `last_updated`. The fake `hass` of `@vtherm/dashboard-sdk/testing` accepts `devices` and `entities`, and `setDevice` and `setEntity`
  fill them. The change is compatible.
- A `global_widget` receives `central`, the entry of the central configuration and its values (`{ entryId, values }`), in its
  properties and in the context of its visibility condition; it is absent when there is no central configuration. The change is
  compatible.
- The guide [Developing a plugin](docs/plugins/plugin-development.md#read-the-history) gives the recipe to read the history of an
  entity with `hass.callWS` and `history/history_during_period`, and the attributes of a thermostat whose history the recorder keeps.
- A `global_widget` or `thermostat_widget` can declare `size: { columns?: 1 | 2 | 3 | "full"; rows?: 1 | 2 | 3 }`. The grid of the
  widgets has as many columns of at least 280 px as its width holds, reduces a width to that number, gives `"full"` the whole row,
  gives a minimal height of `rows` × 140 px plus the gaps, has one column on a phone, and keeps the order of the placements (no dense
  filling). A wrong value, an unknown key or `size` on another hook is refused at registration with its path. The resolved entries
  carry `size` with its defaults (`resolveWidgetSize`). Each widget is drawn in a `ha-card`, and receives `narrow`. The change is
  compatible: a widget without `size` keeps one column and the height of its content.
- The page [Hooks and placement](docs/plugins/hooks-and-placement.md#conventions-of-the-widgets) gives the conventions of the
  widgets that the native widgets follow: identifier `<plugin>.widget.<name>`, title `widget.<name>.title`, hidden rather than empty,
  states of loading, empty and unavailable ("—", never 0), units and formats of Home Assistant, accessibility, theme, cost, and display
  only.

## [0.1.0-beta2]
The second beta.

### Added
- The project is under the Apache License 2.0 (`LICENSE`, `NOTICE`). The SDK `@vtherm/dashboard-sdk` carries both files: a plugin
  author, free or paid, keeps the licence and the notice of the author when the plugin includes the SDK.
- The list of the thermostats groups them by area of Home Assistant, ordered by floor then by name, with the thermostats without
  area at the end. **By area** and **By name** choose the order, remembered in
  the browser. The names of the areas and of the floors follow Home Assistant live. The selector of the menu orders the thermostats
  the same way and names each one with its area.
- `vtherm_dashboard/get_thermostats` gives the device, the climate entity, the area and the floor of each thermostat.

### Changed
- The Dashboard tab hides its menu while it has a single page, its overview, which then takes the full width.
- The dashboard is named "Versatile Thermostat" in the side menu and in its title, instead of "Home confort". An entry of the
  integration created before keeps its title until it is renamed in Home Assistant.
- The address of the dashboard is `/vtherm`, instead of `/home-confort`: update the links and bookmarks to its pages.
- Every control of the dashboard is a component of Home Assistant: entity pickers filtered by domain and device class, the
  underlyings in an ordered list, numbers with their unit, the switch commands with a service picker for each underlying, messages
  in `ha-alert`, confirmations in `ha-dialog` (leaving unsaved changes, installing and restarting in VT add-ons), cards, menus and
  spinners. An entity shown as text opens its card. Each control keeps a plain HTML fallback when Home Assistant does not load it.
- **Save** and **Discard** are at the foot of the card of each section, as in the configuration pages of Home Assistant: Discard on
  the left, Save on the right with the progress button of Home Assistant, which turns green with a check mark when the save succeeds
  and red with an alert icon when it fails. The bar that stayed at the bottom of the screen is gone, on a phone too: scroll to the
  foot of the card to save. The message "Saved." is gone; screen readers are still told.

### Fixed
- A thermostat can be created without a central configuration. The creation was refused with "no central configuration found":
  the fields that the user did not change were sent with the defaults of the forms of Versatile Thermostat (the central mode on),
  instead of the values that its flow proposes, as the screens of Home Assistant send them. The creation also sends the TPI and
  advanced parameters, with the defaults of Versatile Thermostat, that a thermostat without central configuration needs.
- Without a central configuration, every option that needs one is off and disabled, with its explanation: the control by the
  central mode and the central boiler, not only the use of the central configuration.
- The UI plugins are no longer lost when the central configuration of Versatile Thermostat is the only entry and is saved: the
  dashboard keeps the instance of `vtherm_api` that holds them.
- The panel follows the navigation again: Home Assistant set a property `route` on it that replaced the route of the panel.
- The dashboard is no longer empty when the user leaves it and comes back: the new panel gives the plugins whose modules the browser
  already evaluated to its registry again.

### For contributors
- `npm run dev` and `start-ha.sh --dev-frontend`: Home Assistant loads the panel and the native plugins from the TypeScript sources
  served by Vite (`VTHERM_DASHBOARD_DEV_SERVER`), so that a change is seen after a reload of the page, without a build or a restart.

### For plugin authors
- Every component receives `narrow`, true on a narrow screen such as a phone (`DisplayProps` in the SDK). The fake host of
  `@vtherm/dashboard-sdk/testing` gives `narrow: false` unless a test gives it. The change is compatible: nothing to migrate.
- The SDK has a contract for the fields of configuration (`FieldDefinition`, `selectorOf`) that gives the `ha-selector` of each
  field, and a loader of the components of Home Assistant (`ensureHaControls`, `haControlsStatus`). `@vtherm/dashboard-sdk/testing`
  adds `defineHaControlMocks`. The change is compatible: nothing to migrate.
- A configuration component (`general_config`, `thermostat_config`) receives `draft` (`DraftControls`): whether the draft has changes,
  whether a save is running, the translated messages to show above the actions, `save()` (which resolves to `success`, `error` or
  `partial`) and `discard()`. A contribution that draws the save actions at the foot of its own card declares
  `save_actions: "component"`; without it, the dashboard draws them in a card under the component. `ha-progress-button` is in
  `HA_CONTROLS`, and its simulated version in `defineHaControlMocks` records `actionSuccess()` and `actionError()`. The change is
  compatible: a plugin without `save_actions` keeps its save actions, under its component.

## [0.1.0]
The first version.

### For plugin authors
- The contract of the plugins starts here: seven hooks, six placements, typed translations, and the version constraint `dashboard_version`.
- A plugin is declared in Python with `register_ui_plugin` of `vtherm_api`, and contributes from a JavaScript module built with
  `@vtherm/dashboard-sdk`.
- Nothing to migrate.
