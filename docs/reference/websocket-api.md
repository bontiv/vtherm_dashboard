# WebSocket API

The dashboard adds WebSocket commands to Home Assistant. They are used by the dashboard frontend and are documented
here for contributors and plugin authors. Audience: contributors, plugin authors.

All commands require an authenticated connection, as every Home Assistant WebSocket command.

## `vtherm_dashboard/get_ui_plugins`

Returns the UI plugins to load, validated and sorted in load order, with the outcome of each plugin. The list is built
on each call from the plugins registered in `vtherm_api` (see the [Python API](../plugins/python-api.md)) and, for an
administrator, from the development entries of the request. The frontend imports the modules in the order received and
does not sort them again.

### Request

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `type` | `string` | yes | `vtherm_dashboard/get_ui_plugins` |
| `dev_plugins` | `list` of objects | no | Development entries of the browser, sent by an administrator. They are merged for this call and are not kept. |

A development entry has the fields below. If `id` is the identifier of a registered plugin, only `js_url` is used and
the registered metadata stay. Otherwise the entry is a complete declaration and `dashboard_version` is required.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `id` | `string` | yes | Identifier of the plugin. |
| `js_url` | `string` | yes | Absolute `http` or `https` URL of the module on the development server. |
| `dashboard_version` | `string` | for an unknown `id` | Constraint on the dashboard version. |
| `requires`, `load_after`, `load_before` | `list` of `string` | no | Load dependencies, for an unknown `id`. |

### Response

```json
{
  "dashboard_version": "0.1.0",
  "plugins": [
    {
      "id": "smartpi",
      "js_url": "/smartpi_static/ui.js",
      "dashboard_version": ">=0.1,<1.0",
      "requires": ["core"],
      "load_after": [],
      "load_before": [],
      "source": "installed",
      "state": "ready",
      "reason": null,
      "details": {},
      "order": 1
    }
  ]
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `dashboard_version` | `string` | Version of the dashboard, from the manifest of the integration. |
| `plugins` | `list` | Plugins to load first, in load order, then the other plugins ordered by identifier. Empty when no plugin is registered. |

Each plugin of `plugins` has these fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `string` | Identifier of the plugin. |
| `js_url` | `string` | URL of the module to import. |
| `dashboard_version` | `string` | Constraint declared by the plugin. Empty for a development entry that gave none. |
| `requires` | `list` of `string` | Plugins that must be ready. |
| `load_after` | `list` of `string` | Plugins to load before this one when they are present. |
| `load_before` | `list` of `string` | Plugins to load after this one when they are present. |
| `source` | `string` | `installed` (registered by an integration), `native` (a plugin of the dashboard) or `development` (a development entry). |
| `state` | `string` | Outcome of the server checks, see below. |
| `reason` | `string` or `null` | Code that refines the state, see below. |
| `details` | `object` | Data that explains the state. Empty when the plugin is ready. |
| `order` | `integer` or `null` | Rank in the load order, starting at 0. `null` when the plugin is not loaded. |

### States

Only a plugin whose `state` is `ready` has an `order` and is imported by the frontend. The frontend adds its own
states when an import fails (see the plugin status page of the dashboard).

| `state` | `reason` | `details` | Cause |
| --- | --- | --- | --- |
| `ready` | `null` | `{}` | The plugin is valid, compatible and its dependencies are ready. |
| `invalid` | `reserved_id` | `{}` | The identifier is `core` or starts with `core_` and does not belong to a native plugin. |
| `invalid` | `invalid_url` | `{"url": "<url>"}` | An installed plugin must give a path that starts with `/` and is not another host. A development entry must give an absolute `http` or `https` URL. A native plugin may also be on the development server of the frontend that Home Assistant was started with (`VTHERM_DASHBOARD_DEV_SERVER`), see [Development environment](../contributing/development-environment.md#the-development-server-of-the-frontend). |
| `invalid` | `invalid_constraint` | `{"fault": "<comparator>"}` | `dashboard_version` has an unsupported operator or an invalid version. `fault` is the faulty comparator. |
| `invalid` | `missing_constraint` | `{}` | A development entry for an unknown plugin has no `dashboard_version`. |
| `dashboard_incompatible` | `too_old` or `too_new` | `{"constraint": "<constraint>", "dashboard_version": "<version>"}` | The dashboard version does not satisfy the constraint. `too_old` means the dashboard is older than the plugin supports, `too_new` that it is more recent. |
| `missing_dependency` | `null` | `{"missing": ["<id>"]}` | A plugin of `requires` is absent or is not ready. The state spreads to the plugins that require it. |
| `cycle` | `null` | `{"plugins": ["<id>"]}` | The plugin belongs to a loop of load dependencies. `plugins` lists the plugins of the loop. |

The load order respects `requires`, `load_after` and `load_before`. A link to a plugin that is absent is ignored for
`load_after` and `load_before`. The `core` plugin is always first, and plugins without constraint between them are
ordered by identifier, so the order is the same on every call.

### Errors

| Error code | Cause |
| --- | --- |
| `unauthorized` | The request has `dev_plugins` and the user is not an administrator. |
| `invalid_format` | The request does not match the schema, for example `dev_plugins` is not a list of objects. |

## Configuration of Versatile Thermostat

These commands read and write the configuration of the thermostats and of the central configuration. They are reserved for
administrators: any other user gets the error `unauthorized`. The configuration is never written directly: the writing goes
through the config flow of Versatile Thermostat, see [driving the config flow](../contributing/config-flow-driver.md).

### `vtherm_dashboard/get_thermostats`

Lists the thermostats, ordered by name, and tells whether a central configuration exists.

| Field of the result | Type | Meaning |
| --- | --- | --- |
| `thermostats` | `list` | Each thermostat: `id` (identifier of its configuration entry), `name`, `type` (`over_switch`, `over_climate` or `over_valve`), `read_only`, and where it is in Home Assistant (see below). The central configuration is not in the list. |
| `has_central_config` | `boolean` | Whether the central configuration exists. |
| `central_config_id` | `string` or `null` | The identifier of the central configuration. |
| `supported_config_version` | `list` | The version and the minor version of configuration that the embedded schema describes, for example `[2, 4]`. It is not the editing rule. |
| `supported_vtherm_major` | `integer` | The major version of the Versatile Thermostat package that the dashboard has verified, for example `10`. A client of an older dashboard may not receive it. |

Where each thermostat is, read from the registries of Home Assistant. Every field is `null` when the registries do not have it, for
example for a thermostat that is not loaded.

| Field of a thermostat | Type | Meaning |
| --- | --- | --- |
| `device_id` | `string` or `null` | The device of the thermostat. |
| `climate_entity_id` | `string` or `null` | The climate entity of the thermostat. |
| `area_id` | `string` or `null` | The area of the thermostat: the area of its climate entity when it has one of its own, or else the area of its device, as Home Assistant gives an entity its area. |
| `area_name` | `string` or `null` | The name of the area when the list was read. The frontend shows the live name of `hass.areas` and only uses this one as a fallback. |
| `floor_name`, `floor_level` | `string`, `integer` or `null` | The floor of the area and its level, also a fallback for `hass.floors`. |

### `vtherm_dashboard/get_config`

Reads the configuration of an entry. Request: `entry_id`.

| Field of the result | Type | Meaning |
| --- | --- | --- |
| `id`, `name` | `string` | The entry. |
| `type` | `string` | `central`, `over_switch`, `over_climate` or `over_valve`. |
| `values` | `object` | The values of the configuration, by key of Versatile Thermostat. |
| `version`, `minor_version` | `integer` | The version of the configuration of the entry. |
| `read_only` | `boolean` | True when the dashboard cannot edit the entry. |
| `read_only_reason` | `string` or `null` | `config_version_newer`: the configuration major version is not the supported one, or the installed Versatile Thermostat package major version is not `supported_vtherm_major` or could not be read. The minor version of the configuration does not matter. The code is historical and covers both causes. Use the screens of Home Assistant, or update the dashboard. |

The error `not_found` means that no entry of Versatile Thermostat has this identifier.

### `vtherm_dashboard/get_central_config`

Reads the central configuration, with the same fields as `get_config`. The result is `null` when there is no central configuration.

### `vtherm_dashboard/get_presets`

Reads the preset temperatures of an entry. Request: `entry_id`. Versatile Thermostat keeps them in `number` entities, outside of the
configuration. The result has `presets`, a list ordered by name. Each preset has `preset` (for example `eco_temp`, `comfort_ac_temp`,
`frost_away_temp`), `entity_id`, `value`, `min`, `max`, `step` and `unit`. A thermostat that uses the central presets has none. The error
`not_found` means that the entry does not exist.

### `vtherm_dashboard/get_humidity_suggestion`

Suggests a humidity sensor for a temperature sensor. Request: `temperature_sensor`. The result is `{"entity_id": "..."}`, the humidity
sensor that Versatile Thermostat detects on the device of the temperature sensor, or `{"entity_id": null}` when it finds none. The
detection is the one of the config flow of Versatile Thermostat.

### `vtherm_dashboard/save_config`

Saves the draft of a configuration.

| Field of the request | Type | Required | Meaning |
| --- | --- | --- | --- |
| `entry_id` | `string` | yes | The entry to change. |
| `changes` | `object` | no | The changes by tab, then by key: `{"tpi": {"tpi_coef_int": 0.7}}`. A field of a changed tab that is not given keeps its value. `null` clears an optional field. |
| `presets` | `object` | no | The temperatures by preset: `{"eco_temp": 18}`. |

The tabs are saved all together or not at all. The presets are applied after the tabs, one by one, and only if the tabs were saved.

| Field of the result | Type | Meaning |
| --- | --- | --- |
| `ok` | `boolean` | True when the tabs and every preset were saved. |
| `config_saved` | `boolean` | True when the tabs were saved. |
| `entry_id` | `string` or `null` | The entry, when the tabs were saved. |
| `errors` | `list` | The errors of the tabs. Nothing was saved when there is one. |
| `preset_errors` | `list` | The presets that could not be applied. The tabs and the other presets are saved. |

### `vtherm_dashboard/create_config`

Creates a thermostat or the central configuration. Request: `thermostat_type` (`thermostat_over_switch`, `thermostat_over_climate`,
`thermostat_over_valve` or `thermostat_central_config`) and `changes`, as for `save_config`. The result has `ok`, `entry_id` (the new
entry) and `errors`. Nothing is created when there is an error.

### Errors of the configuration

An error has `tab` (the tab, or `null` for the whole configuration), `field` (the key, or `base` for the whole form) and `code`. The
dashboard translates the code. The codes of Versatile Thermostat are passed on unchanged.

| Code | Comes from | Cause |
| --- | --- | --- |
| `unknown_entity` | Versatile Thermostat | The field names an entity that has no state in Home Assistant. |
| `window_open_detection_method` | Versatile Thermostat | A window sensor and the thresholds of the automatic detection are used together. |
| `no_central_config` | Versatile Thermostat | An option "use the central configuration" is on and there is no central configuration. |
| `service_configuration_format` | Versatile Thermostat | A service of the central boiler does not have the expected format, or its template is not valid. |
| `lock_code_incorrect` | Versatile Thermostat | The lock code is not made of four digits. |
| `valve_regulation_nb_entities_incorrect` | Versatile Thermostat | The number of opening or closing entities differs from the number of underlying entities. |
| `sync_device_internal_temp_nb_entities_incorrect` | Versatile Thermostat | The number of synchronization entities differs from the number of underlying entities. |
| `min_opening_degrees_format`, `max_opening_degrees_format` | Versatile Thermostat | A list of opening degrees is not a list of numbers within the limits of the valves. |
| `min_max_opening_degrees_inconsistent` | Versatile Thermostat | A maximal opening is not greater than the minimal one. |
| `valve_control_parameters_cardinality_incorrect` | Versatile Thermostat | A list of opening degrees has more values than there are valves. |
| `vswitch_configuration_incorrect` | Versatile Thermostat | A custom command of a switch does not have the format `command[/argument[:value]]`, or the number of commands is wrong. |
| `configuration_not_complete` | Versatile Thermostat | A required element is missing, for example the name, the temperature sensor or an underlying entity. The configuration cannot be finished. |
| `unknown` | Versatile Thermostat | An unexpected error of the flow. |
| `required` | Dashboard | The form requires this field and no value was given. |
| `invalid_value` | Dashboard | The value is not of the kind that the form accepts. |
| `field_not_applicable` | Dashboard | No form of the tab asks for this field in the current configuration, for example the thresholds of the automatic window detection once a window sensor is saved. |
| `tab_unavailable` | Dashboard | The flow does not offer this tab for this configuration, for example the auto start and stop of a thermostat over a switch. |
| `unknown_tab` | Dashboard | The tab does not exist. |
| `not_found` | Dashboard | The entry does not exist. |
| `config_version_unsupported` | Dashboard | The entry is read-only, its configuration is newer than the dashboard supports. |
| `central_config_exists` | Dashboard | A central configuration already exists. There is only one. |
| `unknown_thermostat_type` | Dashboard | The type is not one of the four types. |
| `flow_failed` | Dashboard | The flow did not behave as expected. |

The errors of the presets have the tab `presets` and these codes: `out_of_range` (the temperature is outside the limits of the
preset), `unknown_preset` (the entry has no such preset), `preset_rejected` (Home Assistant refused the value) and `preset_not_applied`
(the thermostat was not ready and kept its previous value).

## Add-ons of Versatile Thermostat

### `vtherm_dashboard/get_complements`
Administrators only. Reads the catalog of add-ons and gives each one what Home Assistant knows about its integration. What HACS knows is
read by the browser, not by this command.

The server reads the catalog at `https://raw.githubusercontent.com/bontiv/vtherm-website/latest/pluginsdb/plugins.json`. It keeps the
copy for an hour, asks again with the entity tag (`If-None-Match`) once it has expired, and keeps the last valid copy in the storage of
Home Assistant (`vtherm_dashboard.complements`), so that the page works offline.

Request: `refresh` (optional boolean) skips the cache and asks the server again.

Response:

| Field | Content |
| --- | --- |
| `complements` | The add-ons, in the order of the catalog. |
| `fetched_at` | When the copy was read, in seconds since the epoch. |
| `stale` | True when the server could not be asked and the copy may be old. |
| `warnings` | The problems: `network`, `catalog_invalid`, and one text for each entry that was ignored. |
| `catalog_url` | The address of the catalog. |

Each add-on has:

| Field | Content |
| --- | --- |
| `id` | The `slug`, else the `url`, else the `name`. |
| `name`, `description`, `description_fr`, `description_de` | The texts. The descriptions are HTML and must be sanitized before they are shown. A missing description is an empty string. |
| `type`, `known_type` | `integration`, `interface`, `blueprint` or `addon`. `known_type` is false for any other value: the add-on is shown as a link. |
| `certification`, `family`, `author` | As the catalog gives them. `author` can be null. |
| `slug`, `url`, `ha_domain` | As the catalog gives them, null when absent. |
| `repository` | The GitHub repository `owner/name` in lower case, from the `slug` or from a GitHub `url`. |
| `link` | The address of the repository, else the `url`. |
| `hacs_category` | The category of the store (the Marketplace or HACS, which have the same categories) to install it: `integration` for an integration, `plugin` for an interface, the `hacs_category` of the catalog when it has one. Null when the dashboard does not install the add-on. |
| `ha` | `found` (the integration is in `custom_components`), `loaded`, `config_entries` (their number) and `config_flow` (the manifest declares one). |

Error: `catalog_unavailable` when the catalog cannot be read and there is no copy. `unauthorized` for a user who is not an administrator.

### `vtherm_dashboard/get_complement_readme`
Administrators only. Reads the README of the repository of an add-on of the catalog, with its relative links and images made absolute.

The command only reads the repository of an add-on that the catalog has: it takes the identifier of the add-on, never an address. The
parameter is `complement_id`, because `id` is the number of the message in the WebSocket protocol of Home Assistant.

Request:

| Parameter | Content |
| --- | --- |
| `complement_id` | The `id` of an add-on of the catalog. |
| `language` | The language tag of the user, for example `fr-CA`. |

The server reads from `https://raw.githubusercontent.com/<owner>/<repo>/HEAD/`, in this order: `README-<lang>.md`, `README.<lang>.md`,
`README_<lang>.md` (with the base language, `fr` for `fr-CA`; skipped for English), then `README.md`. When `README.md` does not exist,
`https://api.github.com/repos/<owner>/<repo>/readme` gives the real name and folder of the file.

Response:

| Field | Content |
| --- | --- |
| `markdown` | The README, with its links made absolute. |
| `language` | The language of the file that was chosen: `en` for the main README. |
| `source_url` | The page of the file on GitHub. |
| `fetched_at` | When the README was read, in seconds since the epoch. |

The links are made absolute as follows. A relative image (`![text](target)`, an HTML `src`) is read from
`https://raw.githubusercontent.com/<owner>/<repo>/HEAD/<folder of the README>/`. A relative link points to
`https://github.com/<owner>/<repo>/blob/HEAD/<folder of the README>/`. A target that is absolute (`http:`, `https:`, `mailto:`) or an
anchor (`#…`) is kept, except the page of an image on GitHub (`github.com/<owner>/<repo>/blob/<ref>/<path>`), which becomes the raw
image.

The server keeps the answer in memory for an hour, for each repository and each requested language. A failure is not kept. A README
larger than 512 KiB is refused.

Errors: `not_found` when the identifier is not in the catalog, or the add-on has no GitHub repository (GitHub is not contacted).
`readme_unavailable` when the README cannot be read: no file, an error of GitHub, a timeout or a file that is too large. `unauthorized`
for a user who is not an administrator.
