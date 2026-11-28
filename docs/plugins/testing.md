# Testing a UI plugin

`@vtherm/dashboard-sdk/testing` is a fake dashboard. It lets you test a UI plugin without Home Assistant and without a browser
that runs the dashboard. Audience: plugin authors.

The fake dashboard uses the same code as the dashboard for the validation of a definition and for the resolution of the positions.
A plugin that passes here is accepted and placed the same way by the dashboard.

Import it in your tests only. The main entry point `@vtherm/dashboard-sdk` never imports it, so a plugin bundle that imports
only the main entry point does not contain it.

## The fake host

`createFakeHost(options)` returns the fake dashboard. Register the plugins that your plugin points at, then your plugin, in the
load order of the real dashboard.

| Member | Use |
| --- | --- |
| `registerPlugin(definition, relations?)` | Register a plugin like the dashboard. It throws `UiPluginValidationError` for an invalid definition, the same error as `registerUiPlugin`. It returns the problems of the placement. `relations` gives `requires` and `load_after`. |
| `resolved(hook)` | The contributions of a hook, resolved and in order. For `top_tab`, the zone `start` then the zone `end`. The entries of `global_widget` and `thermostat_widget` carry their `size` with its default values, `{ columns: 1, rows: 1 }` for a widget without size. |
| `menu(tabId)` | The left menu of a top tab, which holds the contributions of several hooks. |
| `visible(entries, context)` | The entries whose visibility condition is true for a context. |
| `render(entry, props)` | Shows the component of a contribution in the document with its properties, and waits for its first render. `hass` is the fake `hass`. It needs a DOM, such as the one of `happy-dom` or `jsdom`. |
| `hass` | The fake `hass` given to the components. |
| `install()` and `uninstall()` | Put the fake dashboard in the page, so that `registerUiPlugin` finds it. |
| `issues()` | Every problem of the placement since the start. |

Options: `dashboardVersion` is the version that the plugin reads with `getDashboardVersion()`, and `knownPlugins` lists the identifiers
registered in Python. When it is given, a plugin that is not in the list is refused, as the dashboard does.

## The fake hass

`createFakeHass(options)` is the state of Home Assistant that a component reads. `setState(entityId, state, attributes)` sets an entity,
`setLanguage(language)` changes the language of the user, `serviceCalls` lists the services the component called, and
`setWebSocketHandler(handler)` says what the server answers to `callWS`. By default `callWS` fails, so a test has to say what it expects.

The registries `devices` and `entities` are undefined until the test gives them, as in a Home Assistant that does not have them: pass
them to `createFakeHass({ devices, entities })`, or add them one by one with `setDevice(device)` and `setEntity(entity)`, also on
`host.hass`. A widget that uses `getEntryEntities` then finds its entities as in the dashboard, and an entry that the test does not
declare gives empty values. The fake `hass` has no formatter (`formatEntityState`): a widget formats its values with `hass.locale`. The
test of [Read the entities of a thermostat](plugin-development.md#read-the-entities-of-a-thermostat) is
`docs/examples/typescript/widget-entities.test.ts`; the one of the sizes of the widgets
([Size and grid](hooks-and-placement.md#size-and-grid)) is `docs/examples/typescript/widget-size.test.ts`.

## Example

This test registers stand-ins for the native UI plugins, then the UI plugin of the page [Hooks and placement](hooks-and-placement.md).
It checks the positions, the visibility condition and the properties of a rendered component.

<!-- example: docs/examples/typescript/plugin-test.test.ts -->
```typescript
// @vitest-environment happy-dom
import { createFakeHost } from "@vtherm/dashboard-sdk/testing";
import { expect, it } from "vitest";

import { nativePlugins } from "./base-plugins.ts";
import { definition } from "./hooks-and-placement.ts";

/** A host with the plugins of the dashboard, and the plugin under test registered after them. */
function hostWithPlugin() {
  const host = createFakeHost();
  for (const native of nativePlugins) {
    host.registerPlugin(native);
  }
  const issues = host.registerPlugin(definition, { requires: ["core"], load_after: ["core_tpi", "core_lock"] });
  return { host, issues };
}

it("replaces the TPI section and removes the lock section", () => {
  const { host, issues } = hostWithPlugin();
  expect(issues).toEqual([]);
  expect(host.resolved("thermostat_config").map((entry) => entry.id)).toEqual(["smartpi.tab.main"]);
});

it("places the tab after the Thermostats tab and keeps the configuration gear last", () => {
  const { host } = hostWithPlugin();
  expect(host.resolved("top_tab").map((entry) => entry.id)).toEqual(["core.top.dashboard", "core.top.thermostats", "smartpi.top", "core.top.configuration"]);
  expect(host.menu("smartpi.top").map((entry) => entry.id)).toEqual(["smartpi.page.overview"]);
});

it("shows the section only for the thermostats that use Smart TPI", () => {
  const { host } = hostWithPlugin();
  const sections = host.resolved("thermostat_config");
  const context = (use: boolean) => ({ hass: host.hass, thermostatId: "climate.salon", thermostatType: "over_switch" as const, values: { use_smartpi: use }, centralValues: {} });
  expect(host.visible(sections, context(true))).toHaveLength(1);
  expect(host.visible(sections, context(false))).toHaveLength(0);
});

it("shows the component with the properties that the dashboard gives it", async () => {
  class SmartTab extends HTMLElement {
    hass: unknown;
    thermostatId = "";
  }
  customElements.define("smartpi-tab", SmartTab);

  const { host } = hostWithPlugin();
  const [section] = host.resolved("thermostat_config");
  host.hass.setState("climate.salon", "heat");

  const element = (await host.render<"thermostat_config">(section as never, { thermostatId: "climate.salon", values: {}, centralValues: {}, errors: {}, proposeChanges: () => undefined })) as SmartTab;
  expect(element.thermostatId).toBe("climate.salon");
  expect(element.hass).toBe(host.hass);
});
```
<!-- /example -->

## The status of a section
`host.status(entry, context)` calls the `status` function of a configuration section as the menu of the dashboard does, and gives the
status that the menu shows, or `undefined`. A function that raises, or returns a value that is not a status, gives `undefined`, and
`host.statusErrors()` lists the problem. See
[Status of a configuration section](hooks-and-placement.md#status-of-a-configuration-section) and its test,
`docs/examples/typescript/section-status.test.ts`.

## The help of a field
`defineFieldHelpMock()` of `@vtherm/dashboard-sdk/testing` defines a simulated help of a field (`FIELD_HELP_ELEMENT`) in the page of
the test, so that a section can be tested without the dashboard. Read the element as a `MockFieldHelpElement`: it keeps the `label`,
`hint`, `info`, `diagram`, `values` and `highlight` that the section gave it, and shows its hint as text. An element that is already
defined is left as it is. See [Help of a field](plugin-development.md#help-of-a-field) and its test,
`docs/examples/typescript/field-help.test.ts`.

## The components of Home Assistant
A component that draws `ha-selector`, `ha-switch`, `ha-button` or another component of Home Assistant is tested without Home
Assistant: `defineHaControlMocks()` of `@vtherm/dashboard-sdk/testing` defines simulated components in the page of the test (it needs
`happy-dom` or `jsdom`). A simulated component keeps what it receives (`selector`, `value`, `label`, `helper`, `error`, `disabled`...),
and its method `change(value)` acts as the user: it sends `value-changed` with the new value (`change` for `ha-switch`). Call
`resetHaControls()` after each test, so that `ensureHaControls()` looks again at the components of the page.

The simulated `ha-progress-button` of the save actions keeps `progress`, `disabled` and `appearance`, and `result` tells what it was
asked to show: `success` after `actionSuccess()`, `error` after `actionError()`. Give the component a `draft` whose `save()` resolves to
the result to test (`success`, `error` or `partial`), click the button, and read `result`
(see [Save actions](plugin-development.md#save-actions) and its test, `docs/examples/typescript/save-actions.test.ts`).

<!-- example: docs/examples/typescript/config-fields.test.ts -->
```typescript
// @vitest-environment happy-dom
import { selectorOf } from "@vtherm/dashboard-sdk";
import { defineHaControlMocks, resetHaControls } from "@vtherm/dashboard-sdk/testing";
import type { MockHaElement } from "@vtherm/dashboard-sdk/testing";
import { afterEach, expect, it, vi } from "vitest";

import { FIELDS, MyPluginFields } from "./config-fields.ts";

customElements.define("my-plugin-fields", MyPluginFields);

afterEach(() => {
  document.body.replaceChildren();
  resetHaControls();
});

it("draws each field with ha-selector, and proposes the value that the user chose", async () => {
  // The page of the test has no Home Assistant: the simulated components stand for it.
  defineHaControlMocks();
  const proposed: Record<string, unknown>[] = [];
  const element = document.createElement("my-plugin-fields") as MyPluginFields;
  element.values = { my_plugin_heaters: ["climate.salon"] };
  element.proposeChanges = (changes) => void proposed.push(changes);
  document.body.append(element);
  await vi.waitFor(() => expect(element.querySelectorAll("ha-selector")).toHaveLength(FIELDS.length));

  const heaters = element.querySelectorAll<MockHaElement>("ha-selector")[1] as MockHaElement;
  expect(heaters.selector).toEqual(selectorOf(FIELDS[1]!));
  expect(heaters.value).toEqual(["climate.salon"]);
  heaters.change(["climate.salon", "climate.chambre"]);
  expect(proposed).toEqual([{ my_plugin_heaters: ["climate.salon", "climate.chambre"] }]);
});
```

## Check the translations

`assertCompleteTranslations(translations, languages)` fails when a catalog that must be complete omits a key of the English
catalog or has a key that does not exist. The error names the language and each faulty key. It loads a catalog that is loaded on
demand. `findTranslationProblems` returns the same information without throwing. The compiler already checks a catalog declared
with `satisfies CompleteCatalog`; this check also covers catalogs written without it.

```typescript
import { assertCompleteTranslations } from "@vtherm/dashboard-sdk/testing";
import { translations } from "./translations.ts";

it("has complete French and German catalogs", async () => {
  await assertCompleteTranslations(translations, ["fr", "de"]);
});
```
<!-- /example -->
