# Proposal

## Why

The dashboard decides whether a Versatile Thermostat configuration can be edited by comparing
`(entry.version, entry.minor_version)` against a hardcoded `SUPPORTED_CONFIG_VERSION = (2, 4)` with a plain
tuple comparison. That is not a semver rule: it has no notion of major compatibility, no lower bound, and it
compares the *configuration* pair instead of the *package* version. As soon as Versatile Thermostat ships a
newer configuration minor version, every entry becomes read-only even when it is perfectly editable, and the
user has no way to edit a thermostat that Home Assistant itself edits without trouble.

The same guard also blocks data that Versatile Thermostat has already migrated: its `async_migrate_entry`
rewrites an entry to `(2, 5)` and removes the obsolete Auto-TPI keys, so the dashboard refuses data that is
already normalised upstream.

## What Changes

- Replace the tuple comparison with an explicit two-condition rule: a configuration is editable when its
  configuration **major** version is the supported one **and** the installed Versatile Thermostat **package
  major** version is the supported one.
- Introduce a `SUPPORTED_VTHERM_MAJOR` constant (initial value `10`), read from the installed integration
  manifest rather than from a hardcoded configuration pair.
- Read the package version through `async_get_integration` at the websocket boundary and pass the resolved
  major down as a parameter; the builders and `read_only_reason` stay synchronous and become pure.
- An absent or unparsable package version is **read-only**: the dashboard does not edit what it cannot
  verify. This deliberately diverges from `compat.py`, which accepts unknown versions for the minimum-API
  check.
- Add `supported_vtherm_major` to the payload of `ws_get_thermostats`, alongside the existing
  `supported_config_version`. Not **BREAKING**: `supported_config_version` is kept and repurposed, it now
  describes the configuration version the embedded schema is the description of (`[2, 4]`) instead of acting
  as the rule.
- Reword the read-only message in English, French and German so it states that the installed version could
  not be verified, instead of claiming the configuration comes from a newer version. The reason code
  `config_version_newer` is kept unchanged.
- Update the affected tests, the websocket API reference and the config-flow driver documentation.

Out of scope, deliberately deferred to a separate change:

- Refreshing `shared/vtherm-config-schemas.json` from configuration version `2.4` to `2.5`, bumping
  `external-refs.txt` to a `11.x` Versatile Thermostat and moving `SUPPORTED_VTHERM_MAJOR` to `11`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `core-config-management`: the requirement "Compatibilité avec la version de Versatile Thermostat" changes
  from "the configuration version must not be newer than the supported pair" to "the configuration major
  version and the Versatile Thermostat package major version must both be the supported ones", and the
  read-only message changes meaning.

## Impact

- Backend: `custom_components/vtherm_dashboard/const.py` (`SUPPORTED_VTHERM_MAJOR`),
  `vtherm_config.py` (`read_only_reason`, `list_thermostats`, `read_config`, `read_central_config`,
  `view_of`), `websocket_api.py` (four `@callback` handlers become `async def`, new payload field,
  `IntegrationNotFound` treated as an unknown version), `config_flow_driver.py` (resolves the version
  before refusing to write).
- Frontend: `frontend/src/config/api.ts` (new field), `panel.ts`, `shell-translations.ts`,
  `native/catalogs/errors.ts` (rewording only).
- Tests: `tests/test_vtherm_config.py`, `tests/test_websocket_config.py`, six `frontend/test/*.ts` files
  providing the `ws_get_thermostats` fixture.
- Documentation: `docs/reference/websocket-api.md`, `docs/contributing/config-flow-driver.md`.
- Public API: one added websocket field; the meaning of `supported_config_version` changes but its type and
  presence do not.

## Known consequence

Until the separate schema refresh lands, an installation running Versatile Thermostat `11.x` stays
read-only, because its package major is not `10`. The lock is aligned on the version whose configuration the
embedded schema actually describes (`external-refs.txt` pins `10.6.4`, configuration `2.4`), which is the
honest statement of what this dashboard can verify, but it means the initial symptom is only removed by the
second change.
