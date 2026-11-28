# Proposal

## Why

The dashboard describes the Versatile Thermostat configuration flow with `shared/vtherm-config-schemas.json`, generated from the version pinned in `external-refs.txt` (10.6.4, configuration version 2.4). Versatile Thermostat 11.0.0 declares configuration version 2.5 and rewrote the Auto TPI forms, so the embedded description is stale: the Auto TPI tab would offer fields the form no longer has, and the package-major lock introduced by `vtherm-package-version-compat` cannot move from 10 to 11. This change refreshes the description and releases that lock.

## What Changes

- Reduce the `tpi` native tab to the two fields the Auto TPI form still has in 11.0.0: `heater_heating_time` (default 5) and `auto_tpi_continuous_kext` (default `False`). The second-level `auto_tpi_enable_advanced_settings` gate and the EMA / AVG forms it chose between disappear with the fields they selected.
- Remove the `autoTpiDefaults` helper and its call site. It injects the eleven keys that `async_migrate_entry` deletes from stored entries, so keeping it would re-introduce exactly the obsolete values the migration removes.
- Regenerate `shared/vtherm-config-schemas.json` from an 11.x reference. Two forms are removed, none added, one changed.
- Bump `external-refs.txt` from `10.6.4` to the 11.x reference the description is generated from, and update the drift-test procedure that depends on it.
- Move `SUPPORTED_VTHERM_MAJOR` from 10 to 11, so entries produced by Versatile Thermostat 11 become editable again.
- Move the declared configuration version from 2.4 to 2.5 wherever it is asserted or documented.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `core-native-plugins`: the requirement "Auto TPI" describes forms and fields that Versatile Thermostat 11 removed. It changes to describe the two fields the form still has.

## Impact

- `shared/vtherm-config-schemas.json`: regenerated; 42 top-level keys become 40, one form shrinks from seven fields to two.
- `frontend/src/native/tab-definitions.ts`: the `tpi` tab loses the obsolete `extra` form, the advanced-settings gate, and the EMA / AVG alternatives.
- `frontend/src/native/fields.ts`: `autoTpiDefaults` removed.
- `frontend/src/native/native-tab.ts`: the call site of `autoTpiDefaults` removed.
- `frontend/src/native/schemas.ts`: `SchemaName` is `keyof typeof description`, so the removed form names stop compiling. The tab must be reduced before the description is regenerated, never after.
- `custom_components/vtherm_dashboard/vtherm_config.py`: `SUPPORTED_VTHERM_MAJOR` 10 -> 11, `SUPPORTED_CONFIG_VERSION` 2.4 -> 2.5.
- `external-refs.txt`: new Versatile Thermostat pin.
- `frontend/test/fields.test.ts`: the two Auto TPI cases, one of which reads a removed form by name.
- Seven frontend tests and two Python tests assert `[2, 4]` and move to `[2, 5]`.
- `docs/reference/websocket-api.md`, `docs/contributing/config-flow-driver.md`: the declared version and the refresh procedure.
- Versatile Thermostat 11 entries become editable. Entries written by 11 but read by a dashboard still pinned to 10 stay read-only, which is the intended behaviour of `vtherm-package-version-compat`.

## Dependencies

Depends on `vtherm-package-version-compat`, which introduces `SUPPORTED_VTHERM_MAJOR` and the package-major condition this change re-targets. Both changes touch `vtherm_config.py` and the same two Python tests, so this one is applied after that one.

Deliberately out of scope: the preset write path in `presets.py`, which never consults `read_only_reason`. Versatile Thermostat 11 does not change the `_preset_` marker, so it needs its own change rather than a quiet fold into this one.
