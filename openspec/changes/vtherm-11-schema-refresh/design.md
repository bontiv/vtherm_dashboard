# Design

## Context

`shared/vtherm-config-schemas.json` is a frozen description of the Versatile Thermostat config flow, generated from the version pinned in `external-refs.txt` (10.6.4) and checked against a live checkout by `tests/test_schema_drift.py`. `SchemaName` is derived from it (`SchemaName = keyof typeof description`, `frontend/src/native/schemas.ts:38`), so a form present in the description but absent upstream is invisible until someone looks, while a form absent from the description is a compile error.

Versatile Thermostat 11.0.0 declares configuration version 2.5 and rewrote Auto TPI. Measuring the delta was the first step, because it decides whether the refresh is a routine regeneration or a rewrite.

## Measured delta

AST-diffing `config_schema.py` at the current pin (`e0b0a2f8`, 10.6.4) against 11.0.0 (`5df466ba`):

| | 10.6.4 | 11.0.0 |
|---|---|---|
| `STEP_*` forms | 39 | 37 |
| Added | - | none |
| Removed | - | `STEP_AUTO_TPI_AVG_SETTINGS_SCHEMA`, `STEP_AUTO_TPI_EMA_SETTINGS_SCHEMA` |
| Changed | - | `STEP_AUTO_TPI_CONFIGURATION_SCHEMA` only |
| Identical | - | 36 of 37 common forms |

The embedded JSON has 42 top-level keys: the 39 `STEP_*` forms plus the three `build_*` factories. Re-checking by module-namespace diff rather than by pattern confirms exactly those two names are gone and nothing else vanished.

The one changed form keeps two fields (`config_schema.py:567-572`):

- `heater_heating_time`, default 5
- `auto_tpi_continuous_kext`, default `False`

and drops `auto_tpi_learning_type`, `auto_tpi_aggressiveness`, `heater_cooling_time`, `auto_tpi_heating_rate`, `auto_tpi_enable_advanced_settings`.

## Decision: the tab shrinks before the description is regenerated

`SchemaName` is a key type, so removing the two forms from the JSON makes every reference to them a compile error. That is a useful safety net but it forces an order: if the description is regenerated first, the build breaks in three files at once and the tab still describes a flow it can no longer name. The order used is:

1. Reduce the `tpi` tab in `tab-definitions.ts` to the surviving form.
2. Remove `autoTpiDefaults` and its call site.
3. Regenerate the description with `pytest tests/test_schema_drift.py --update-schemas`, preserving the hand-written `unit` and `device_classes` keys (`MANUAL_KEYS`).
4. Fix the assertions.

## Decision: keep the `auto_tpi_mode` gate, drop the advanced-settings gate

`auto_tpi_mode` is not part of the Auto TPI form. It lives in `STEP_TPI_DATA_SCHEMA` (`config_schema.py:336`) and survives unchanged in 11.0.0 — `STEP_CENTRAL_TPI_DATA_SCHEMA_CENTRAL` duplicates the block because central configuration hides the checkbox. So the tab's `isOn(values, "auto_tpi_mode")` gate stays valid as written; only what it reveals changes.

The inner gate on `auto_tpi_enable_advanced_settings` goes: the field is gone, and with it the choice between the EMA and weighted-average forms. Keeping a gate whose field no longer exists would leave a branch that can never be true.

## Decision: `autoTpiDefaults` is removed, not ported

`autoTpiDefaults` returns the eleven keys in `OBSOLETE_AUTO_TPI_KEYS` (`const.py:190-207`) — the exact list `async_migrate_entry` deletes from stored entries when migrating to 2.5. It is called from `applyChange` when the learning type changes, so its purpose disappears with that field. Porting it would re-introduce the values the migration removes; keeping it as dead code would leave a helper that contradicts the migration. It is removed with its wiring and its two tests.

## Decision: pin the 11.0.0 release tag, not HEAD

`external-refs.txt` records what the description was generated from, so it should name something a reviewer can check out. The tag `11.0.0.beta1` is `b0479dea895ef98d949cb753e8f0df851e16dfdb`, and both `config_schema.py` and `const.py` are identical between that tag and HEAD `5df466ba` — so for the schema the choice is immaterial, and the tag is the honest one: it is what the installed Versatile Thermostat runs and what HACS installs.

## Risk: a stale frontend writes keys Versatile Thermostat 11 rejects

The `tpi` tab shrinks, so an old frontend against a new backend would send `auto_tpi_learning_type` and friends. Three properties make this a clean refusal rather than corruption:

- Versatile Thermostat 11's forms declare no `extra=` and no `ALLOW_EXTRA`, so unknown keys are rejected rather than stored.
- `_submit` only sends keys the live `schema.schema` actually declared.
- `_drive` refuses a key that was sent but never asked for, reporting `ERROR_NOT_APPLICABLE`.

An unreadable form therefore surfaces as a refused write, never as an entry holding values upstream never asked for.

## Consequence for the version lock

This change is what lets `vtherm-package-version-compat` raise its package-major condition from 10 to 11: until the description matches 2.5, editing a 2.5 entry through tabs that offer removed fields is the failure the read-only guard exists to prevent. The two changes touch the same constant and the same tests, so this one is applied after that one, and the dependency is recorded in both.

Until both land, a Versatile Thermostat 11 install is read-only. That is intended, not a regression.

## Out of scope

`presets.py` is a second write path that never consults `read_only_reason`. It is unaffected by 11.0.0 — the `_preset_` unique-id marker is unchanged — and fixing it is a separate concern from refreshing the schema, so it stays out and is offered as its own change.
