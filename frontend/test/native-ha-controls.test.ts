// @vitest-environment happy-dom
/** The native tabs drawn with the components of Home Assistant, simulated by the harness of the SDK. */
import type { PlacedEntry } from "@vtherm/dashboard-sdk";
import { defineHaControlMocks } from "@vtherm/dashboard-sdk/testing";
import type { FakeHost, MockHaElement } from "@vtherm/dashboard-sdk/testing";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { find, findAll } from "./support/dashboard-harness.ts";
import { nativeHost } from "./support/native-host.ts";

let host: FakeHost;

beforeAll(async () => {
  defineHaControlMocks();
  ({ host } = await nativeHost());
  host.hass.setState("sensor.indoor", "19", { friendly_name: "Indoor", device_class: "temperature" });
  host.hass.setState("sensor.outdoor", "8", { friendly_name: "Outdoor", device_class: "temperature" });
  host.hass.setState("switch.heater", "off");
  host.hass.setState("climate.ac", "off");
});

afterEach(() => {
  document.body.innerHTML = "";
});

const SWITCH = { thermostat_type: "thermostat_over_switch", name: "Salon", proportional_function: "tpi" };
const CENTRAL = { thermostat_type: "thermostat_central_config", external_temperature_sensor_entity_id: "sensor.outdoor", temp_min: 7, temp_max: 35, step_temperature: 0.1 };

interface Rendered {
  element: HTMLElement;
  proposals: Record<string, unknown>[];
  root: ShadowRoot;
}

/** Render a native tab with values, as the dashboard does. */
async function render(contributionId: string, values: Record<string, unknown>, options: { central?: Record<string, unknown>; errors?: Record<string, string>; missing?: string[]; services?: Record<string, Record<string, unknown>> } = {}): Promise<Rendered> {
  const hook = contributionId.includes(".general.") ? "general_config" : "thermostat_config";
  const entry = host.resolved(hook).find((candidate: PlacedEntry) => candidate.id === contributionId) as PlacedEntry;
  const proposals: Record<string, unknown>[] = [];
  const hass = { ...host.hass, config: { unit_system: { temperature: "°C" } }, ...(options.services === undefined ? {} : { services: options.services }) };
  const props = { hass, thermostatId: "entry-1", values, centralValues: options.central ?? CENTRAL, errors: options.errors ?? {}, ...(options.missing === undefined ? {} : { missing: options.missing }), proposeChanges: (changes: Record<string, unknown>) => proposals.push(changes) };
  const element = await host.render<"thermostat_config">(entry, props as never);
  await (element as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return { element, proposals, root: element.shadowRoot as ShadowRoot };
}

/** The selector of a field. */
const selector = (root: ShadowRoot, key: string) => find<MockHaElement>(root, `.field[data-key="${key}"] ha-selector`) as MockHaElement;

describe("the required fields that a creation misses", () => {
  it("marks them as invalid and required, with a word as well as the color of the error of the theme, and no other field", async () => {
    const { root } = await render("core.tab.main", { ...SWITCH }, { missing: ["name"] });
    const field = find(root, '.field[data-key="name"]') as HTMLElement;
    expect(field.classList.contains("missing")).toBe(true);
    expect(selector(root, "name").getAttribute("aria-invalid")).toBe("true");
    expect(selector(root, "name").getAttribute("aria-describedby")).toBe("required-name");
    expect(find(root, "#required-name")?.textContent).toBe("Required");
    expect(find(root, '.field[data-key="cycle_min"]')?.classList.contains("missing")).toBe(false);
    expect(find(root, "#required-cycle_min")).toBeNull();
  });

  it("draws every field as usual when nothing is missing", async () => {
    const { root } = await render("core.tab.main", { ...SWITCH });
    expect(findAll(root, ".missing, .required-note")).toEqual([]);
  });
});

describe("the fields of the native tabs", () => {
  it("draws every field with ha-selector, not with a plain control", async () => {
    const { root } = await render("core.tab.main", { ...SWITCH, temperature_sensor_entity_id: "sensor.indoor", cycle_min: 5 });
    expect(findAll(root, "input, select, textarea")).toEqual([]);
    expect(findAll(root, "ha-selector").length).toBeGreaterThan(3);
  });

  it("draws a boolean with the switch of Home Assistant, with its label and its help", async () => {
    const { root, proposals } = await render("core.tab.main", { ...SWITCH, use_central_mode: false });
    const mode = selector(root, "use_central_mode");
    expect(mode.selector).toEqual({ boolean: {} });
    expect(mode.value).toBe(false);
    expect(mode.label).toContain("central");
    mode.change(true);
    expect(proposals).toEqual([{ use_central_mode: true }]);
  });

  it("disables and shows off every option that needs the central configuration when there is none, and turns the switch Customize on", async () => {
    const { root } = await render("core.tab.main", { ...SWITCH, use_main_central_config: false }, { central: {} });
    for (const key of ["use_central_mode", "used_by_controls_central_boiler"]) {
      expect(selector(root, key).disabled, key).toBe(true);
      expect(selector(root, key).value, key).toBe(false);
    }
    const customize = find<MockHaElement>(root, "ha-switch#customize-use_main_central_config") as MockHaElement;
    expect([customize.disabled, customize.checked]).toEqual([true, true]);
    expect(selector(root, "cycle_min").disabled).toBeFalsy();
  });

  it("draws a number with its limits, its step and its unit, and stores the delay as a number of that unit", async () => {
    const { root, proposals } = await render("core.tab.main", { ...SWITCH, cycle_min: 5 });
    expect(selector(root, "cycle_min").selector).toMatchObject({ number: { mode: "box", unit_of_measurement: "min" } });
    selector(root, "cycle_min").change(8);
    expect(proposals).toEqual([{ cycle_min: 8 }]);
  });

  it("draws a choice with the translated labels of its options", async () => {
    const { root } = await render("core.tab.type", { ...SWITCH });
    const options = (selector(root, "proportional_function").selector as { select: { options: { value: string; label: string }[] } }).select.options;
    expect(options.map((option) => option.value)).toContain("tpi");
    expect(options.every((option) => option.label !== "")).toBe(true);
  });

  it("filters the temperature sensor by domain and by class, and keeps a value that the filter would not offer", async () => {
    const { root, proposals } = await render("core.tab.main", { ...SWITCH, temperature_sensor_entity_id: "sensor.legacy_without_class" });
    const sensor = selector(root, "temperature_sensor_entity_id");
    expect(sensor.selector).toEqual({ entity: { filter: [{ domain: ["sensor"], device_class: ["temperature"] }, { domain: ["input_number", "number"] }] } });
    expect(sensor.value).toBe("sensor.legacy_without_class");
    sensor.change("");
    expect(proposals).toEqual([{ temperature_sensor_entity_id: null }]);
  });

  it("shows the error of the server on its field, with an alert of Home Assistant", async () => {
    const { root } = await render("core.tab.main", { ...SWITCH }, { errors: { temperature_sensor_entity_id: "unknown_entity", base: "vswitch_configuration_incorrect" } });
    const alert = find(root, '.field[data-key="temperature_sensor_entity_id"] ha-alert') as HTMLElement;
    expect(alert.getAttribute("alert-type")).toBe("error");
    expect(alert.textContent).not.toBe("");
    expect(find(root, "ha-alert.base-error")?.getAttribute("alert-type")).toBe("error");
  });

  it("puts the tab in a card of Home Assistant, with its title", async () => {
    const { root } = await render("core.tab.main", { ...SWITCH });
    expect((find(root, "ha-card") as MockHaElement).header).not.toBe("");
    expect(find(root, "div.card")).toBeNull();
  });
});

describe("the save actions of a native tab", () => {
  const draft = { dirty: false, saving: false, messages: [], save: async () => "success" as const, discard: () => undefined };

  it("are at the foot of the card of the tab, after its content", async () => {
    const { element, root } = await render("core.tab.main", SWITCH);
    Object.assign(element, { draft });
    await (element as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const card = find(root, "ha-card") as HTMLElement;
    expect([...card.children].map((child) => child.localName)).toEqual(["div", "vtherm-card-actions"]);
    expect(card.lastElementChild?.shadowRoot?.querySelector(".card-actions ha-progress-button.save")).not.toBeNull();
  });

  it("are not drawn without the state of the draft, as for a read-only configuration", async () => {
    const { root } = await render("core.tab.main", SWITCH);
    expect(find(root, "vtherm-card-actions")).toBeNull();
  });
});

describe("the underlyings", () => {
  it("are an ordered list of the entities that the type of the thermostat accepts", async () => {
    const climate = await render("core.tab.type", { thermostat_type: "thermostat_over_climate", underlying_entity_ids: ["climate.ac"] });
    expect(selector(climate.root, "underlying_entity_ids").selector).toEqual({ entity: { multiple: true, reorder: true, filter: [{ domain: ["climate"] }] } });
    const valve = await render("core.tab.type", { thermostat_type: "thermostat_over_valve" });
    expect(selector(valve.root, "underlying_entity_ids").selector).toEqual({ entity: { multiple: true, reorder: true, filter: [{ domain: ["number", "input_number"] }] } });
  });

  it("propose the list in the order of the picker, without a text with one entity per line", async () => {
    const { root, proposals } = await render("core.tab.type", { thermostat_type: "thermostat_over_climate", underlying_entity_ids: ["climate.ac"] });
    expect(find(root, "textarea")).toBeNull();
    selector(root, "underlying_entity_ids").change(["climate.b", "climate.ac"]);
    expect(proposals).toEqual([{ underlying_entity_ids: ["climate.b", "climate.ac"] }]);
  });
});

describe("the commands of a thermostat on switch", () => {
  const values = { ...SWITCH, underlying_entity_ids: ["switch.heater", "select.pilot"], vswitch_on_command: ["turn_on", "select_option/option:comfort"] };
  const rows = (root: ShadowRoot) => findAll(root, '.commands[data-key="vswitch_on_command"] .row');

  it("shows a service picker and the attribute in front of each underlying, required when it is not a switch", async () => {
    const { root } = await render("core.tab.type", values);
    const [heater, pilot] = rows(root);
    expect(find<MockHaElement>(heater as HTMLElement, "ha-service-picker")?.value).toBe("switch.turn_on");
    expect(find<MockHaElement>(pilot as HTMLElement, "ha-service-picker")?.value).toBe("select.select_option");
    expect(find<MockHaElement>(pilot as HTMLElement, "ha-selector")?.value).toBe("option:comfort");
    expect([heater?.textContent, pilot?.textContent].map((text) => (text?.includes("Required") ? "required" : "optional"))).toEqual(["optional", "required"]);
  });

  it("stores the service and the attribute at the position of the underlying, in the format of Versatile Thermostat", async () => {
    const { root, proposals } = await render("core.tab.type", values);
    const pilot = rows(root)[1] as HTMLElement;
    (find(pilot, "ha-service-picker") as MockHaElement).change("select.select_next");
    expect(proposals.at(-1)).toEqual({ vswitch_on_command: ["turn_on", "select_next/option:comfort"] });
    (find(pilot, "ha-selector") as MockHaElement).change("option:eco");
    expect(proposals.at(-1)).toEqual({ vswitch_on_command: ["turn_on", "select_option/option:eco"] });
  });

  it("shows a command that it cannot read, or a service that Home Assistant does not list, as it is in a text field", async () => {
    const { root, proposals } = await render(
      "core.tab.type",
      { ...values, vswitch_on_command: ["turn on now", "select_option/option:comfort"] },
      { services: { switch: { turn_on: {} }, select: { select_next: {} } } },
    );
    const [heater, pilot] = rows(root) as HTMLElement[];
    expect(find(heater as HTMLElement, "ha-service-picker")).toBeNull();
    expect(find<MockHaElement>(heater as HTMLElement, "ha-selector")?.value).toBe("turn on now");
    expect(find(pilot as HTMLElement, "ha-service-picker")).toBeNull();
    expect(find<MockHaElement>(pilot as HTMLElement, "ha-selector")?.value).toBe("select_option/option:comfort");
    (find(pilot as HTMLElement, "ha-selector") as MockHaElement).change("select_option/option:eco");
    expect(proposals).toEqual([{ vswitch_on_command: ["turn on now", "select_option/option:eco"] }]);
  });
});

describe("the services of the central boiler", () => {
  it("are an entity, a service and an attribute, stored as entity_id/service/attribute:value", async () => {
    const { root, proposals } = await render("core_central_boiler.general.main", { thermostat_type: "thermostat_central_config", use_central_boiler_feature: true, central_boiler_activation_service: "climate.boiler/set_temperature/temperature:21" });
    const field = find(root, '.boiler-service[data-key="central_boiler_activation_service"]') as HTMLElement;
    const [entity, attribute] = findAll<MockHaElement>(field, "ha-selector");
    expect(entity?.selector).toEqual({ entity: {} });
    expect(entity?.value).toBe("climate.boiler");
    expect(find<MockHaElement>(field, "ha-service-picker")?.value).toBe("climate.set_temperature");
    expect(attribute?.value).toBe("temperature:21");
    (attribute as MockHaElement).change("temperature:22");
    expect(proposals.at(-1)).toEqual({ central_boiler_activation_service: "climate.boiler/set_temperature/temperature:22" });
  });

  it("stores the delays as numbers of seconds", async () => {
    const { root } = await render("core_central_boiler.general.main", { thermostat_type: "thermostat_central_config", use_central_boiler_feature: true });
    expect(selector(root, "central_boiler_activation_delay_sec").selector).toMatchObject({ number: { unit_of_measurement: "s" } });
  });
});

describe("the groups, the entities and the presets", () => {
  it("opens the group of the settings of Auto TPI when one of its fields is refused", async () => {
    const values = { ...SWITCH, use_tpi_central_config: false, auto_tpi_mode: true };
    const closed = await render("core_tpi.tab.main", values);
    expect((find(closed.root, "ha-expansion-panel") as MockHaElement).expanded).toBe(false);
    const refused = await render("core_tpi.tab.main", values, { errors: { auto_tpi_aggressiveness: "out_of_range" } });
    const panel = find(refused.root, "ha-expansion-panel") as MockHaElement;
    expect(panel.expanded).toBe(true);
    expect(find(panel, 'ha-alert[alert-type="error"]')).not.toBeNull();
  });

  it("opens the card of an entity of the central configuration in Home Assistant, and of no unknown entity", async () => {
    const opened: unknown[] = [];
    window.addEventListener("hass-more-info", (event) => opened.push((event as CustomEvent).detail));
    const { root } = await render("core.tab.main", { ...SWITCH, use_main_central_config: true }, { central: { ...CENTRAL, external_temperature_sensor_entity_id: "sensor.outdoor" } });
    (find(root, ".chip-value .entity-link") as HTMLElement).click();
    expect(opened).toEqual([{ entityId: "sensor.outdoor" }]);
    const unknown = await render("core.tab.main", { ...SWITCH, use_main_central_config: true }, { central: { ...CENTRAL, external_temperature_sensor_entity_id: "sensor.gone" } });
    expect(find(unknown.root, ".chip-value .entity-link")).toBeNull();
  });

  it("shows the temperatures of the presets in compact cells of the table, not with the number selector, with their unit and limits", async () => {
    host.hass.setWebSocketHandler((message) => {
      if (message["type"] === "vtherm_dashboard/get_thermostats") {
        return { thermostats: [], has_central_config: true, central_config_id: "central", supported_config_version: [2, 4], supported_vtherm_major: 10 };
      }
      return { presets: [{ preset: "eco_temp", value: 17, entity_id: "number.eco", min: 7, max: 35, step: 0.1, unit: "°C" }] };
    });
    const { element, proposals } = await render("core_presets.tab.main", { ...SWITCH, use_presets_central_config: false });
    const root = element.shadowRoot as ShadowRoot;
    await vi.waitFor(() => expect(find(root, 'td[data-key="preset:eco_temp"] input')).not.toBeNull());
    const eco = find(root, 'td[data-key="preset:eco_temp"] input') as HTMLInputElement;
    expect(findAll(root, ".preset-table ha-selector")).toEqual([]);
    expect([eco.type, eco.getAttribute("min"), eco.getAttribute("max"), eco.getAttribute("step"), eco.value]).toEqual(["number", "7", "35", "0.1", "17"]);
    expect(find(root, "td .unit")?.textContent).toBe("°C");
    eco.value = "17.5";
    eco.dispatchEvent(new Event("change"));
    expect(proposals).toEqual([{ "preset:eco_temp": 17.5 }]);
  });

  it("offers the humidity sensor that Versatile Thermostat detects with a button of Home Assistant", async () => {
    host.hass.setWebSocketHandler(() => ({ entity_id: "sensor.salon_humidity" }));
    const { element, proposals } = await render("core_humidity.tab.main", { ...SWITCH, temperature_sensor_entity_id: "sensor.indoor", use_humidity_feature: true });
    const root = element.shadowRoot as ShadowRoot;
    await vi.waitFor(() => expect(find(root, "ha-button")).not.toBeNull());
    (find(root, "ha-button") as HTMLElement).click();
    expect(proposals).toEqual([{ humidity_sensor_entity_id: "sensor.salon_humidity" }]);
  });
});
