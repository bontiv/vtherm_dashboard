# Design

## Context

See `proposal.md` — Why for the motivation.

Current state that shapes the approach:

- `read_only_reason(entry)` is synchronous and pure apart from the entry: it compares
  `(entry.version, entry.minor_version)` with the module constant `SUPPORTED_CONFIG_VERSION = (2, 4)`.
- It is called from two layers: the read path (`ThermostatSummary.read_only` /
  `ConfigView.read_only_reason`, built by `list_thermostats`, `read_config`, `read_central_config`,
  `view_of`) and the write path (`FlowConfigWriter.async_update`, returning `ERROR_READ_ONLY`).
- The whole read path is synchronous, and four websocket handlers (`ws_get_thermostats`, `ws_get_config`,
  `ws_get_central_config`, `ws_get_presets`) are declared `@callback`. Writing configuration is the only
  asynchronous handler today (`ws_save_config`, `websocket_api.async_response`).
- The Versatile Thermostat package version is only available in Home Assistant through
  `async_get_integration(hass, "versatile_thermostat")`, which is awaitable and raises
  `IntegrationNotFound`. The existing precedent is `ws_get_ui_plugins`, already `async def`.
- `version_constraints.py` already provides `parse_version` / `Version.major` and rejects unparsable text
  with `VersionConstraintError`.
- `SUPPORTED_CONFIG_VERSION` is also, and separately, the version whose schema
  `shared/vtherm-config-schemas.json` describes; a test compares it with the constants of the Versatile
  Thermostat checkout of the development environment.

## Goals / Non-Goals

**Goals:**

- One rule, expressed once, readable as a semver statement.
- The rule stays a pure function of its inputs, so it is unit-testable without a Home Assistant instance.
- The read path keeps its synchronous shape everywhere except the single place that must await.
- The published contract grows additively; no consumer has to change to keep working.

**Non-Goals:**

- Refreshing the frozen schema description, bumping `external-refs.txt`, or moving the verified major to
  `11`. Those belong to the deferred change named in the proposal.
- Making the write path validate the configuration against Versatile Thermostat's own schema. It delegates
  to Versatile Thermostat's options flow, and that does not change.
- Introducing a configurable compatibility matrix, or reading the version from anywhere else than the
  integration manifest.

## Decisions

### Two independent conditions, not one comparison

```
editable  <=>  entry.version == SUPPORTED_CONFIG_MAJOR          (configuration semver-compatible)
           AND vtherm_major == SUPPORTED_VTHERM_MAJOR           (installed package verified)
           AND vtherm_major is not None                         (version could be read and parsed)

otherwise  ->  READ_ONLY_NEWER_VERSION   (single published reason, unchanged)
```

The configuration minor version stops participating: any `2.x` entry is editable when the package is
verified. That is the whole point of the request — a semver-compatible configuration must not become
read-only.

**Alternative considered:** keep a `(major, minor)` ceiling and only loosen the lower side. Rejected: it
keeps the minor version as a tripwire, which is exactly the behaviour being removed.

**Alternative considered:** express the rule with `satisfies()` from `version_constraints.py`, as
`compat.py` does. Rejected: the constraint language cannot both bound the major and ignore the minor
without writing `>=2.0.0, <3.0.0` and then re-parsing the entry as a version string. Two integer
comparisons state the same thing without a parse on every call, and `parse_version` is still used where it
earns its keep — on the package version, where the text is external.

### The package major is resolved once, at the async boundary, and passed down

`read_only_reason` becomes `read_only_reason(entry, vtherm_major: int | None) -> str | None`, and every
builder that produces a read-only flag takes `vtherm_major` as a parameter:
`list_thermostats(hass, vtherm_major)`, `read_config(hass, entry_id, vtherm_major)`,
`read_central_config(hass, vtherm_major)`, `view_of(entry, vtherm_major)`.

Only the websocket layer awaits:

```
resolved_major = await resolve_vtherm_major(hass)      # once per request
        |
        +--> list_thermostats(hass, resolved_major)    # sync, unchanged shape
        +--> read_config(hass, entry_id, resolved_major)
        +--> ...
```

Consequence: the four `@callback` handlers become `async def` decorated with
`websocket_api.async_response`, matching `ws_save_config`. `ws_get_presets` also needs the major, because it
calls `read_config` to verify the entry exists.

**Alternative considered:** make the builders `async`. Rejected: it would spread asynchrony through pure
data-shaping code for one awaited value per request, and make the existing synchronous tests async.

**Alternative considered:** resolve the version once and cache it in `hass.data`, refreshed on a config-entry
update listener. Rejected: it adds an invalidation problem (integration reload, upgrade without restart) to
save one cached manifest lookup per request. `async_get_integration` is a cheap registry read.

**Alternative considered:** resolve the version lazily inside `read_only_reason` by accepting an awaitable
or a callable. Rejected: it makes a pure predicate impure and untestable without mocking.

### An unknown package version is read-only

`IntegrationNotFound`, an absent `version`, or a `VersionConstraintError` all resolve to `vtherm_major = None`
and therefore to read-only.

**Alternative considered:** accept unknown versions, as `compat.py:47-49` does for the minimum-API check.
Rejected by decision: that check only gates a feature availability warning, whereas this one gates writing
into somebody else's configuration. Not editing what cannot be verified is the safe default, and the two
checks are allowed to differ because they carry different consequences. This asymmetry is deliberate and
documented rather than accidental.

### One reason code, unchanged

`READ_ONLY_NEWER_VERSION = "config_version_newer"` keeps its value and is the only reason the read path can
return. The value is historical and no longer literally accurate in the package-mismatch case, but it is a
published contract: changing it would break every consumer and test that matches on it for no behavioural
gain.

**Alternative considered:** add a second code such as `vtherm_version_unverified` to distinguish the two
causes. Rejected by the spec delta — the reason announced by the read path must stay stable, because an
external consumer cannot be asked to learn a new value. The distinction between the two causes therefore
lives in the human message, which is recomputed at translation time and is not a machine contract, not in
the reason code. If a finer reason is ever needed, it is a separate additive change with a deprecation
window, not a silent widening of an existing field's range.

### The published contract grows by one field

`ws_get_thermostats` keeps `supported_config_version: [2, 4]` and adds `supported_vtherm_major: 10`.
`read_only` remains a boolean decided by the backend; the frontend only renders it.

`supported_config_version` keeps its value and stops being the rule: it now answers "which configuration
version is the embedded schema the description of?". That preserves the coherence test that compares it with
the development checkout, and it means the deferred schema refresh updates one constant without touching the
rule.

**Alternative considered:** publish the accepted configuration major as `[2]`. Rejected: it changes the
meaning of an existing field for a purely cosmetic gain, and it breaks the coherence test's premise.

### The read-only message says "could not be verified"

The three catalogs currently claim the configuration "comes from a newer version of Versatile Thermostat",
which becomes false for the package-mismatch case. Proposed rewording, in English, French and German:

> This configuration cannot be verified: the installed Versatile Thermostat version is not one this
> dashboard can edit. Edit it in the Home Assistant screens, or update the dashboard.

The technical reason code is not reworded, only the human text. The final wording is a translation detail and
does not affect the rule; it is recorded here so the change does not silently leave a false statement in the
UI.

### Defence in depth stays

Both layers keep enforcing the same predicate with the same inputs: the websocket read path for the UI, and
`FlowConfigWriter.async_update` for the write. The writer resolves the major itself rather than receiving it
from the caller, because it is the boundary that must refuse even if a caller got the flag wrong.

## Risks / Trade-offs

**Editing a 2.5 entry against a 2.4 schema** → The frozen schema is the description used to render the form
and to fill defaults, and it still declares three Auto-TPI fields that Versatile Thermostat 2.5 removed and
requires. An edit may therefore be refused upstream (`missingRequired`) or produced with obsolete keys
injected (`autoTpiDefaults`). This is the deliberate cost of not refreshing the schema in this change. It is
bounded: the write path delegates validation to Versatile Thermostat's own options flow, which rejects what
it no longer accepts, and the flow driver is all-or-nothing, so a refused edit changes nothing. Mitigation:
the deferred change refreshes the schema and the pinned checkout together.

**The verified major is a hand-maintained constant** → Nothing forces `SUPPORTED_VTHERM_MAJOR` to move when
the pinned checkout moves. Mitigation: keep the existing coherence test that compares the configuration
version constant with the development checkout, and add the equivalent assertion for the package major, so a
checkout bump that forgets the constant fails in the test suite.

**A user on 11.x stays read-only after this change** → Stated in the proposal. Mitigation: none inside this
change; the deferred schema refresh is the fix, and until then the message is accurate about why.

**The added scenario names the `2.4` pair as a literal** → The scenario "Version de configuration déclarée"
asserts the declared configuration version against `2.4` / minor `5`, which is the pinned checkout rather
than the rule. It becomes historical once `vtherm-11-schema-refresh` moves the pin to `2.5`. Accepted rather
than fixed: the scenario lives only in this unarchived delta, so the refresh cannot `MODIFY` it, and
rewording it now would describe a state no checkout in this project produces. The rule itself — major `2`,
package major equal to `SUPPORTED_VTHERM_MAJOR` — is version-agnostic and needs no edit for the refresh. The
proposal's "Dependency on the schema refresh" section records this for the second change.

**Four handlers stop being `@callback`** → Any test that calls them synchronously must await them.
Mitigation: the handlers are thin; update the affected tests in the same change and keep the payload shape
unchanged otherwise.

**Version resolution on every request** → One registry lookup per websocket call. Accepted: it is a cached
manifest read, and it removes any staleness question after an upgrade.

## Migration Plan

No data migration and no stored state. The change is behavioural and additive:

- Deploy: the backend and the frontend ship together in one release. A frontend built before the backend
  simply ignores the new `supported_vtherm_major` field, and a backend older than the frontend never sends
  it — the frontend must therefore treat the field as optional.
- Rollback: revert the commit. No migration to undo, no persisted format to reverse.
- Users see the effect immediately, without a restart beyond the integration reload the release implies.

## Open Questions

None blocking. The exact EN/FR/DE wording of the read-only message is settled at translation time and cannot
change the rule, the payload or the task breakdown.
