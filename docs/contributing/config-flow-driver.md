# Driving the config flow of Versatile Thermostat

How the dashboard validates and saves the configuration of Versatile Thermostat, its limits, and where it should go.
Audience: contributors.

## Principle

The dashboard does not have validation rules of its own. To save a configuration, it drives the config flow of Versatile
Thermostat on the server, through the public API of Home Assistant, as the screens of Home Assistant do:

1. It opens the flow: the options flow of the entry to change a configuration (`hass.config_entries.options`), or the config
   flow of `versatile_thermostat` to create one (`hass.config_entries.flow`), in which it first chooses the type.
2. For each tab that the draft changes, in the order of the menu, it chooses the step in the menu and submits the form. A form
   gets every field of its schema: the value of the draft when the tab changes it, otherwise the value that the form suggests (as
   the screens of Home Assistant send it), otherwise the current value; a field without any of them gets the default of the form.
   Versatile Thermostat suggests the values that it holds: without a central configuration, its options "use the central
   configuration" and "central mode" are suggested off, while the default of their schema is on. When a form leads
   to another one (the specific values when the inheritance of the central configuration is off, the settings of Auto TPI), the
   following forms are submitted the same way, until the flow is back at the menu.
3. It chooses `finalize`, which the menu only offers when the configuration is complete.

The flow writes the entry at `finalize` only. At the first error, the dashboard aborts the flow: nothing is written. The errors of the
flow come back on their field, with the code of Versatile Thermostat (see the [WebSocket API](../reference/websocket-api.md#errors-of-the-configuration)).
Versatile Thermostat reloads the entry when it changes; the dashboard does not reload anything.

The code is in `custom_components/vtherm_dashboard/config_flow_driver.py`. The rest of the dashboard only uses its interface
`ConfigWriter` (`async_update` and `async_create`).

## Tabs and steps

A tab of the dashboard is a step of the menu of the flow. The tabs are in `TAB_ORDER`. The first three come first because they change
which other tabs the menu offers:

| Tab | Step of the flow | Forms it can go through |
| --- | --- | --- |
| `main` | `main` | `main`, then the specific form when the central configuration is not used |
| `features` | `features` | `features` |
| `type` | `type` | `type`, with a schema for each type of thermostat |
| `tpi` | `tpi` | `tpi`, the specific TPI form, and the Auto TPI forms |
| `presets` | `presets` | `presets`; the temperatures are not in the flow, see below |
| `central_boiler` | `central_boiler` | `central_boiler`, in the central configuration |
| `window` | `window` | `window`, the specific form, then the form of `motion` that the flow shows next |
| `motion`, `power`, `presence`, `advanced`, `lock`, `heating_failure_detection` | same name | the step, then its specific form |
| `auto_start_stop`, `valve_regulation`, `sync_device_internal_temp`, `humidity` | same name | the step |

Rules that come from the flow:

- The menu only offers a tab when it applies: `auto_start_stop` only for a thermostat over a climate without valve regulation,
  `central_boiler` only in the central configuration, the tab of a feature only when the feature is on. A tab that the menu does not
  offer gives `tab_unavailable`.
- When a step leads to the form of another step (after the specific window form, the flow shows the motion form), that form is
  submitted with the current values, so nothing changes there.
- A field of the draft that no form of its tab asks for is refused with `field_not_applicable`, instead of being dropped by the flow
  without a word. The thresholds of the automatic window detection, once a window sensor is saved, are such a case.
- Turning a feature off in `features` makes the flow remove the values of the feature when it finalizes.

## The preset temperatures

The temperatures of the presets are `number` entities of Versatile Thermostat, not values of the flow. The dashboard finds them in
the entity registry, by the configuration entry and the unique identifier (`..._preset_<name>`), and changes them with the service
`number.set_value` (`presets.py`). When a draft has both, the flow is saved first, then each temperature is applied. A temperature
that fails does not undo the configuration, and is reported on its field.

## Versions of Versatile Thermostat

- An entry is editable when its configuration major version is `SUPPORTED_CONFIG_VERSION[0]` and the major version of the installed
  Versatile Thermostat package is `SUPPORTED_VTHERM_MAJOR` (`const.py`). The minor version of the configuration does not matter. Any other
  entry, or a package version that is absent or unreadable, is shown read-only (`config_version_newer`), and saving it gives
  `config_version_unsupported`. The package version comes from `async_get_integration` (`async_vtherm_major` in `vtherm_config.py`), so the
  WebSocket commands that read are asynchronous and pass the major to the builders.
- `SUPPORTED_CONFIG_VERSION` in `vtherm_config.py` is the version of configuration (`CONFIG_VERSION`, `CONFIG_MINOR_VERSION`) that the
  embedded schema describes. It is not the editing rule.
- A test compares this version, the domain and the types with the Versatile Thermostat of the folder of `VTHERM_VERSATILE_THERMOSTAT_DIR`.
- `shared/vtherm-config-schemas.json` describes every form of the flow (key, kind, default, limits). `tests/test_schema_drift.py`
  compares it with the forms of the Versatile Thermostat of the environment and names every field that was added, removed or changed.
- The integration tests (`tests/test_config_flow_driver.py`, `tests/test_presets.py`) run the real flow.

When Versatile Thermostat changes:

1. Update the folder of `VTHERM_VERSATILE_THERMOSTAT_DIR` and run the tests.
2. For each difference of `test_schema_drift.py`, update the native tab that shows the form.
3. Run `pytest tests/test_schema_drift.py --update-schemas` to write the new description, and commit it with the change of the tab.
4. If the version of configuration changed, review the migration of Versatile Thermostat, then update `SUPPORTED_CONFIG_VERSION`.
5. If the major version of the package changed, update `SUPPORTED_VTHERM_MAJOR`. A test compares it with the manifest of the checkout.

## Add a step

1. Add the step to `TAB_ORDER`, at its place in the menu of the flow.
2. Add the native tab that shows its fields, from `shared/vtherm-config-schemas.json`.
3. Add an integration test that saves the tab and one that gets an error of the step.

## Evolution planned

**Target.** The validation and the normalization of a configuration would be shared functions of `vtherm_api`: validate a tab,
normalize a configuration before it is saved (what `finalize` does), and tell whether a configuration is complete. The config flow of
Versatile Thermostat and the dashboard would both call them. The dashboard could then validate a draft and update the entry directly
(`async_update_entry`), with the same rules, without driving a flow.

**Path.** The rest of the dashboard only knows `ConfigWriter`. When `vtherm_api` has the shared functions and the oldest version of
Versatile Thermostat that the dashboard supports uses them, a second implementation of `ConfigWriter` is added, the tests are run on
both, then `FlowConfigWriter` is removed. The specifications describe the behavior, not the mechanism, so they do not change.

**What depends on the upstream repositories.**

- `vtherm_api`: the shared functions of validation, normalization and completeness.
- Versatile Thermostat: its config flow and its options flow use them, instead of the code that they have now.
- Until then, the creation of a thermostat needs a flow anyway, and driving the flow is the only way to apply the same rules.
