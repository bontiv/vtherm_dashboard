# Hooks and placement

A UI plugin adds things to the dashboard by contributing to hooks, and says where each contribution goes with a placement.
This page describes the seven hooks, the menus they build, the six placements and how they are resolved.
Audience: plugin authors. The terms are defined in the [terminology](plugin-development.md#terminology).

## The seven hooks

A hook is a place of the dashboard. A plugin gives its contributions grouped by hook, in `registerUiPlugin`.

| Hook | What it adds | Component properties |
| --- | --- | --- |
| `top_tab` | A tab of the top bar. It has no component: its pages are `tab_page` contributions. | none |
| `tab_page` | An entry of the left menu of a top tab, chosen with `tab`. | `hass`, `narrow` |
| `global_page` | An entry of the left menu of the Dashboard tab. | `hass`, `narrow` |
| `global_widget` | A widget of the Overview page. | `hass`, `narrow`, `central` |
| `general_config` | A section of the general configuration of Versatile Thermostat. | `hass`, `narrow`, `values`, `errors`, `proposeChanges`, `draft` |
| `thermostat_config` | An entry of the menu of a thermostat, in particular a configuration section. | `hass`, `narrow`, `thermostatId`, `values`, `centralValues`, `errors`, `proposeChanges`, `draft` |
| `thermostat_widget` | A widget of the overview of a thermostat. | `hass`, `narrow`, `thermostatId` |

`narrow` is true when the dashboard is shown on a narrow screen, such as a phone (under 700 px): the menu is then a drawer and the
page takes the whole width. It changes without a reload when the width of the window crosses the threshold, so draw again when it
changes, for example by declaring it as a reactive property of a Lit element. Visibility conditions do not receive it.

`thermostatId` is the identifier of the configuration entry of the thermostat, not its `climate` entity. `central`, given to the
widgets of the Overview page and to their visibility conditions, holds `entryId`, the entry of the central configuration, and `values`,
its values; it is absent when there is no central configuration. Find the entities of an entry with `getEntryEntities`, see
[Widgets](#widgets).

A contribution has an `id` that starts with the identifier of your plugin and a dot (`smartpi.tab.main`). The identifier
must be unique in its hook. A contribution that shows something also has a `component`, the tag name of a custom element
that your plugin defines. The dashboard creates it and sets its properties. The contributions of the navigation hooks
(`top_tab`, `tab_page`, `global_page`, `general_config`, `thermostat_config`) need a `title`, which is a key of your
[translation catalogs](internationalization.md), and can have an `icon` (`mdi:...`).

A configuration component of a native plugin (an identifier that starts with `core`) never writes the configuration itself. A component
of another plugin is free to write its data by its own means (a service of Home Assistant, a command of your plugin, the entities of your
plugin), for example when its settings are not in the configuration entry of the thermostat; see
[A tab that writes by itself](plugin-development.md#a-tab-that-writes-by-itself). The component reads `values` (and `centralValues` for a thermostat),
shows the `errors` of its fields, and calls `proposeChanges` to change the draft. The dashboard saves the draft when the user
saves. The save actions are at the foot of the card of the section: a contribution that draws them itself from `draft` declares
`save_actions: "component"`; otherwise (`"dashboard"`, the default) the dashboard draws them in a card under the component. Only
`general_config` and `thermostat_config` accept `save_actions`. See
[Save actions](plugin-development.md#save-actions).

## Widgets

The widgets are the contributions of `global_widget` (the Overview page) and `thermostat_widget` (the overview of a thermostat). The
dashboard draws each one in a card of a grid, in the order of their placements.

### What a widget reads
A widget reads the state of Home Assistant from `hass`, which has everything it needs without a call to the server:

- `getEntryEntities(hass, entryId)` gives the entities of a configuration entry from the registries `hass.devices` and `hass.entities`:
  the `climate` entity of a thermostat, its sensors by translation key (`byKey["power_percent"]`), and every entity of its device. Give
  it `thermostatId`, or `central.entryId` for the central configuration. It is pure and synchronous, so a visibility condition can call
  it, and it gives empty values when the entry or a registry is missing.
- `hass.states[entityId]` gives the state and the attributes of an entity.
- `hass.formatEntityState` and `hass.formatEntityAttributeValue`, when Home Assistant gives them, format a value with its unit and its
  precision. They are optional: format with `hass.locale` without them.
- `hass.callWS` reads the history from the recorder. See [Read the history](plugin-development.md#read-the-history).

`hass.entities` and `hass.devices` are optional in the type `Hass`, and read-only. A plugin that does not read them needs no change.
See [Read the entities of a thermostat](plugin-development.md#read-the-entities-of-a-thermostat) for an example.

### Size and grid
A widget can declare its `size` in the grid: `{ columns?: 1 | 2 | 3 | "full"; rows?: 1 | 2 | 3 }`. Only `global_widget` and
`thermostat_widget` accept it.

- **Columns.** The grid measures its width and has as many columns of at least 280 px as it holds:
  `floor((width + 16) / (280 + 16))`, at least one (four columns at 1 440 px, with a gap of 16 px). A widget takes `columns` of them,
  reduced to the number of columns of the grid: a widget of 3 columns in a grid of 2 takes 2, and the grid never overflows. `"full"`
  takes the whole row.
- **Rows.** `rows` gives the card a minimal height of `rows` units of 140 px (a gauge and two lines of text), plus the gaps between
  them: `rows: 2` is at least 296 px. The card grows when its content is higher. Without `rows`, the height follows the content.
- **Default.** Without `size`, a widget takes one column and the height of its content, as before the sizes. A widget that declares
  only one value gets the default of the other: `size: { columns: "full" }` resolves to `{ columns: "full", rows: 1 }`, with no minimal
  height.
- **Narrow screen.** On a phone (under 700 px), the grid has one column: every card takes it, whatever its `columns`, and keeps the
  minimal height of its `rows`.
- **Order.** The cards follow the order of the placements, which is the order of reading and of the keyboard. The grid never moves a
  card to fill a hole (no `grid-auto-flow: dense`): a wide widget that does not fit at the end of a row goes to the next row and leaves a
  hole. Order your widgets so that the rows fill.

The dashboard refuses at registration a size that is not an object, an unknown key (`size.width`), a value out of these sets
(`size.columns: 4`, `size.rows: 5`), and a `size` on another hook, with the path of the faulty value. TypeScript refuses them too. The
resolved entries of a widget hook carry the size with its default values (`entry.size`).

<!-- example: docs/examples/typescript/widget-size.ts -->
```typescript
import { defineTranslations } from "@vtherm/dashboard-sdk";
import type { UiPluginDefinition } from "@vtherm/dashboard-sdk";

/** A plugin whose widgets declare their size in the grid of the overview of a thermostat. */
export const definition: UiPluginDefinition = {
  id: "my_sizes",
  translations: defineTranslations({ "widget.chart.title": "Last 24 hours", "widget.gauge.title": "Heating share", "widget.alerts.title": "Alerts" }),
  contributions: {
    thermostat_widget: [
      // Two columns of the grid, and at least two units of 140 px high: room for a chart.
      { id: "my_sizes.widget.chart", component: "my-chart-widget", size: { columns: 2, rows: 2 } },
      // No size: one column, and the height of its content, as every widget written before the sizes.
      { id: "my_sizes.widget.gauge", component: "my-gauge-widget" },
      // The whole row, whatever the number of columns. Without `rows`, no minimal height.
      { id: "my_sizes.widget.alerts", component: "my-alerts-widget", size: { columns: "full" } },
    ],
  },
};
```
<!-- /example -->

Each widget is drawn in a `ha-card`, or in an element with the same border, radius and background when Home Assistant does not define
it. The card is the only border of the widget: do not draw a second one. The widgets receive `narrow`, as the pages do.

### Conventions of the widgets
The native widgets follow these rules, and a plugin that follows them looks like the dashboard:

- **Identifier.** `<plugin>.widget.<name>`, for example `core_window.widget.window`.
- **Title.** The key `widget.<name>.title` of the catalog of the plugin, in English, French and German for a native plugin.
- **Hidden, not empty.** A widget whose feature is off, or whose source entity does not exist, is hidden by its visibility condition:
  it never shows an empty card. The condition reads the effective values: the values of the thermostat, and the central values for
  the sections that use the central configuration (`centralValues`); and the presence of the entity with `getEntryEntities`. A
  condition that raises hides the widget and records `visibility_error`.
- **States.** A card that waits shows its title and an indicator of progress, without a value. A card with nothing to show says why. A
  value that is missing, `unavailable` or `unknown` is "—", said "unavailable" to a screen reader, and never 0. An attribute that is
  missing makes only its own value "—".
- **Units and formats.** Format with `hass.formatEntityState` and `hass.formatEntityAttributeValue` when they exist, else with
  `hass.locale` and the unit of the entity or of `hass.config.unit_system`. Never convert a temperature: show the unit of Home
  Assistant. An age is relative ("3 minutes ago"), with the full date in its tooltip.
- **Accessibility.** A state is an icon and a text, never a color alone. A tooltip can be reached with the keyboard. An icon that
  carries a meaning has a translated accessible name. An alert is announced by a screen reader.
- **Theme and phone.** Only the variables of the theme of Home Assistant, no color of your own. Nothing wider than the card: a widget
  stays readable at 360 px without a horizontal scroll.
- **Cost.** Draw again only when an entity that the widget reads changes, and read a history only once the card is visible.
- **Display only, for the native widgets.** A widget of a native plugin (an identifier that starts with `core`) shows how Versatile
  Thermostat works; it does not change it. It calls no service, and it draws no command (mode, preset, lock, window bypass, central
  mode, learning). A widget of another plugin can call the services of Home Assistant and draw commands: the dashboard does not stop
  it. It then runs with the rights of the user, so name what it changes and keep the confirmation of a risky action in the widget.

## The menus

The top bar has the Dashboard tab, the Thermostats tab, the tabs of the plugins, and the Configuration gear alone on the right.
Each tab has a left menu, which is the list of the contributions of several hooks:

| Top tab | Its menu holds |
| --- | --- |
| Dashboard (`core.top.dashboard`) | `global_page` and the `tab_page` that target it |
| Thermostats (`core.top.thermostats`) | `thermostat_config`. It does not accept `tab_page`: the dashboard refuses it and tells you to use `thermostat_config`. |
| Configuration (`core.top.configuration`) | `general_config` and the `tab_page` that target it |
| A tab of a plugin | the `tab_page` that target it |

The menu is a list: a contribution of one hook can be placed relative to a contribution of another hook of the same menu, and an
identifier is unique in the whole menu.

A `top_tab` has a `zone`: `start` (the default) or `end`. The gear is alone in `end`. A tab placed `last` in the zone `start` stays
before the gear. A position is resolved inside the zone of the tab; a target in the other zone counts as absent.

An entry of a menu can have a `group`, a key of your catalogs. The menu shows the group as a heading above each run of consecutive
entries of the same group. Two entries of one group that another group separates get a heading each. Entries without a group have no heading.

### Groups of the menus
The menus of a thermostat and of the general configuration put the native sections in two groups that the core shares, which the SDK
exports as `CORE_MENU_GROUPS`:

| Group | Value | Heading (en / fr / de) | Holds |
| --- | --- | --- | --- |
| `CORE_MENU_GROUPS.settings` | `core:settings` | General settings / Paramètres généraux / Allgemeine Einstellungen | The sections that cannot be turned off. The menu shows no check mark for them. |
| `CORE_MENU_GROUPS.features` | `core:features` | Optional features / Fonctionnalités / Zusatzfunktionen | The sections that can be off. |

A section of yours that declares one of these groups joins the heading of the native sections: placed between two native sections of
that group, it does not cut the heading in two. The dashboard translates these headings, so your catalogs do not hold them. The prefix
`core:` is reserved for the groups of the core: a key of your catalogs that starts with it is not used as a heading. The order of the
native sections is in [Native UI plugins](native-plugins.md#order-and-groups-of-the-menus).

### Status of a configuration section
Each entry of `thermostat_config` and `general_config` shows a status at the right of its title, in the menu and in the drawer of a
phone. When several apply, the first of this list is shown:

| Status | Shown as | Who knows it |
| --- | --- | --- |
| Refused | `Error` | The dashboard: the last save refused a value of the section. It goes away when the refused value changes or a save succeeds. |
| Off | `Off`, and the entry in retreat | The dashboard: the contribution declares a `feature` whose value is false. The contribution: `status` returns `{ kind: "off" }`. |
| Inherited off | `Central (off)`, and the entry in retreat | The contribution: `status` returns `{ kind: "inherited", off: true }`, when the central values that it uses turn it off. |
| Incomplete | `N missing` | The contribution: `status` returns `{ kind: "incomplete", missing: N }`. |
| Inherited | `Central` | The contribution: `status` returns `{ kind: "inherited" }`. |
| Complete | a check mark, except in the group `CORE_MENU_GROUPS.settings` | The contribution: `status` returns `{ kind: "complete" }`. |

- `status` is a pure function of the context that the visibility condition receives. It is called at each drawing of the menu, so it
  must be quick. It returns `undefined` when the section has nothing to say. A function that raises, or returns another value, shows no
  status, and the development mode reports the problem.
- `feature` is the key of the boolean value that turns the feature of the section on. While it is false, the section stays in the menu,
  and its page shows the explanation `feature_intro.<feature>` of your catalog with a switch drawn by the dashboard, instead of your
  component. The switch changes the value in the draft, in the step `features` of the flow, and stays above your component while the
  feature is on, to turn it off. While the feature is off, the dashboard draws the save actions at the foot of the card of the switch.
- `{ kind: "off" }` returned by `status` is for a section without `feature` whose values make it do nothing: the entry is off, and its
  page shows your component as usual, without the switch of the dashboard.
- Without `status` nor `feature`, the entry only shows `Error` after a refused save.
- In a test, `host.status(entry, context)` of the fake host gives the status as the menu reads it (see [Testing](testing.md)).

<!-- example: docs/examples/typescript/section-status.ts -->
```typescript
import { defineTranslations } from "@vtherm/dashboard-sdk";
import type { SectionStatus, UiPluginDefinition, VisibilityContext } from "@vtherm/dashboard-sdk";

/** The values that the section needs before the thermostat can use it. */
const REQUIRED = ["my_plugin_sensor", "my_plugin_target"];

/**
 * The status of the section in the menu: the dashboard shows `Off` while `use_my_plugin` is false and `Error` after a refused save; the
 * section says the rest. The function is pure and quick: it is called at each drawing of the menu.
 */
export function myPluginStatus(context: VisibilityContext<"thermostat_config">): SectionStatus {
  const missing = REQUIRED.filter((key) => context.values[key] === undefined || context.values[key] === null || context.values[key] === "").length;
  return missing > 0 ? { kind: "incomplete", missing } : { kind: "complete" };
}

export const definition: UiPluginDefinition = {
  id: "my_plugin",
  translations: defineTranslations({
    "tab.title": "My plugin",
    // Shown with the switch of the dashboard while the feature is off.
    "feature_intro.use_my_plugin": "My plugin adapts the setpoint to the forecast. Turn it on to set it up.",
  }),
  contributions: {
    thermostat_config: [{ id: "my_plugin.tab", title: "tab.title", component: "my-plugin-tab", feature: "use_my_plugin", status: myPluginStatus }],
  },
};
```
<!-- /example -->

A section that joins the optional features of the core, and that its values can turn off:

<!-- example: docs/examples/typescript/menu-groups.ts -->
```typescript
import { CORE_MENU_GROUPS, defineTranslations } from "@vtherm/dashboard-sdk";
import type { SectionStatus, UiPluginDefinition, VisibilityContext } from "@vtherm/dashboard-sdk";

/**
 * The status of a section without a feature switch, whose values can turn it off: `Off` when it would do nothing, `Central (off)` when
 * the central values that it uses turn it off. Its page stays as usual: only the switch of a `feature` replaces it.
 */
export function boostStatus(context: VisibilityContext<"thermostat_config">): SectionStatus {
  const inherited = Object.keys(context.centralValues).length > 0 && context.values["boost_use_central"] !== false;
  const minutes = inherited ? context.centralValues["boost_minutes"] : context.values["boost_minutes"];
  if (minutes === 0) {
    return inherited ? { kind: "inherited", off: true } : { kind: "off" };
  }
  return inherited ? { kind: "inherited" } : { kind: "complete" };
}

export const definition: UiPluginDefinition = {
  id: "my_boost",
  // The headings of the groups of the core are translated by the dashboard: the catalogs only hold the title.
  translations: defineTranslations({ "tab.title": "Boost" }),
  contributions: {
    thermostat_config: [
      {
        id: "my_boost.tab",
        title: "tab.title",
        component: "my-boost-tab",
        // Joins the heading "Optional features" of the native tabs, right after the presence detection.
        group: CORE_MENU_GROUPS.features,
        placement: { after: "core_presence.tab.main" },
        status: boostStatus,
      },
    ],
  },
};
```
<!-- /example -->

## Placements

`placement` says where the contribution goes in its list. It has exactly one of these forms, and a numeric order does not exist.

| Placement | Meaning |
| --- | --- |
| `{ first: true }` | At the start. |
| `{ last: true }` | At the end. This is the default. |
| `{ before: "id" }` | Just before the contribution `id`. |
| `{ after: "id" }` | Just after the contribution `id`. |
| `{ replace: "id" }` | In the place of the contribution `id`, which is no longer shown. |
| `{ remove: "id" }` | Removes the contribution `id`. The removal shows nothing, so it needs no title and no component. |

The plugin below uses every hook and every form.

<!-- example: docs/examples/typescript/hooks-and-placement.ts -->
```typescript
import { defineTranslations } from "@vtherm/dashboard-sdk";
import type { UiPluginDefinition } from "@vtherm/dashboard-sdk";

const translations = defineTranslations({
  "top.title": "Smart",
  "page.title": "Overview",
  "section.title": "Smart TPI",
  "section.group": "Algorithms",
});

/** A plugin that contributes to every hook, and uses every form of placement. */
export const definition: UiPluginDefinition = {
  id: "smartpi",
  translations,
  contributions: {
    // A tab of the top bar, just after the Thermostats tab. `zone` is "start" (default) or "end".
    top_tab: [{ id: "smartpi.top", title: "top.title", icon: "mdi:brain", placement: { after: "core.top.thermostats" } }],
    // An entry of the left menu of that tab. `tab` says which top tab it belongs to.
    tab_page: [{ id: "smartpi.page.overview", tab: "smartpi.top", title: "page.title", component: "smartpi-overview" }],
    // A page of the Dashboard tab, first in its menu.
    global_page: [{ id: "smartpi.page.global", title: "page.title", component: "smartpi-global", placement: { first: true } }],
    // A widget of the Overview page. Without a placement, it goes last.
    global_widget: [{ id: "smartpi.widget.global", component: "smartpi-widget" }],
    // A section of the general configuration, under a group heading.
    general_config: [{ id: "smartpi.general", title: "section.title", group: "section.group", component: "smartpi-general", placement: { after: "core_tpi.general" } }],
    thermostat_config: [
      {
        // Replace the TPI section of every thermostat, only for the thermostats that use Smart TPI.
        id: "smartpi.tab.main",
        title: "section.title",
        component: "smartpi-tab",
        placement: { replace: "core_tpi.tab.main" },
        on_missing: "skip",
        visible: (context) => context.values["use_smartpi"] === true,
      },
      // Remove a section of another plugin.
      { id: "smartpi.remove.lock", placement: { remove: "core_lock.tab.main" } },
    ],
    thermostat_widget: [{ id: "smartpi.widget.thermostat", component: "smartpi-thermostat-widget", placement: { before: "core.widget.cycle" } }],
  },
};
```
<!-- /example -->

## How a position is resolved

The position of a contribution is resolved when its plugin is loaded, against what the plugins loaded before it already put
in the list. So the [load order](loading-and-dependencies.md) matters when two plugins point at the same target.

- Several contributions that go `after` the same target chain in the order of loading, the latest being the closest to the
  target: with `A` then `B` loaded, the list is the target, `B`, `A`. The same goes for `before`.
- A contribution that is replaced is kept, hidden. The contributions that pointed at it with `before` or `after` follow the
  one that replaced it. A contribution that is removed is kept too, so that others can still point at it.
- A plugin that replaces or removes a contribution of another plugin should `require` it or `load_after` it. Otherwise the
  result depends on the load order, and the plugin gets the warning `undeclared_dependency`.

### A target that does not exist

When the target of `before`, `after` or `replace` does not exist, `on_missing` decides: `last` (the default) puts the contribution
at the end, `skip` does not show it. A warning `target_missing` is recorded in both cases. A `remove` whose target does not exist
removes nothing and records the same warning.

### Visibility

`visible` is a function that receives the context of the contribution (`hass`; the thermostat, its type, its values and the central
values for the thermostat hooks; `central` for `global_widget`) and
returns whether to show it. It is evaluated again at each change of the context, so a section can appear when a feature is
turned on. It must be a pure function. A hidden contribution keeps its place, so the others do not move. A condition that raises
an error hides the contribution and records `visibility_error`.

## Problems that the dashboard reports

A problem with a contribution never stops the plugin: the contribution is refused or placed with a warning, and the plugin
status page shows it.

| Code | Level | Cause |
| --- | --- | --- |
| `invalid_contribution` | error | The contribution is not valid (unknown hook, identifier that does not start with the plugin identifier, missing title or component, invalid placement). It is ignored. |
| `invalid_definition` | error | The definition has no identifier or no contributions. The plugin is refused. |
| `duplicate_id` | error | The identifier is already used in the hook or in the menu. The second contribution is refused. |
| `unknown_tab` | error | The `tab` of a `tab_page` is not a top tab. |
| `thermostats_tab` | error | A `tab_page` targets the Thermostats tab. Use `thermostat_config`. |
| `tab_removed` | warning | A tab was removed: its entries are not shown. |
| `target_missing` | warning | The target of a placement does not exist. |
| `undeclared_dependency` | warning | A `replace` or `remove` targets another plugin that is not required, or loaded before. |
| `visibility_error` | error | A visibility condition raised an error, the contribution is hidden. |
