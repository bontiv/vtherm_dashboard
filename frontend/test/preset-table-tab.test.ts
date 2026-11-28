// @vitest-environment happy-dom
/** The table of the preset temperatures in the tab of the presets. */
import type { PlacedEntry } from "@vtherm/dashboard-sdk";
import { defineHaControlMocks } from "@vtherm/dashboard-sdk/testing";
import type { FakeHost } from "@vtherm/dashboard-sdk/testing";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { NAVIGATE_EVENT } from "../src/components/events.ts";
import type { NavigateDetail } from "../src/components/events.ts";
import { NativeTabElement } from "../src/native/native-tab.ts";
import { find, findAll } from "./support/dashboard-harness.ts";
import { nativeHost } from "./support/native-host.ts";

let host: FakeHost;

beforeAll(async () => {
  defineHaControlMocks();
  ({ host } = await nativeHost());
});

afterEach(() => {
  document.body.innerHTML = "";
});

const SWITCH = { thermostat_type: "thermostat_over_switch", name: "Salon", proportional_function: "tpi", use_presets_central_config: false };
const CENTRAL = { thermostat_type: "thermostat_central_config" };

const preset = (name: string, value: number) => ({ preset: name, value, entity_id: `number.${name}`, min: 7, max: 35, step: 0.5, unit: "°C" });
const HEATING = [preset("frost_temp", 7), preset("eco_temp", 17), preset("comfort_temp", 20), preset("boost_temp", 22), preset("comfort_away_temp", 16)];

/** Answer the reading of the presets with a list. */
function answer(presets: readonly unknown[]): void {
  host.hass.setWebSocketHandler((message) => {
    if (message["type"] === "vtherm_dashboard/get_thermostats") {
      return { thermostats: [], has_central_config: true, central_config_id: "central", supported_config_version: [2, 4], supported_vtherm_major: 10 };
    }
    return { presets };
  });
}

/** Render the tab of the presets, and wait for the table. */
async function render(values: Record<string, unknown>, errors: Record<string, string> = {}) {
  const entry = host.resolved("thermostat_config").find((candidate: PlacedEntry) => candidate.id === "core_presets.tab.main") as PlacedEntry;
  const proposals: Record<string, unknown>[] = [];
  const hass = { ...host.hass, config: { unit_system: { temperature: "°C" } } };
  const props = { hass, thermostatId: "entry-1", values, centralValues: CENTRAL, errors, proposeChanges: (changes: Record<string, unknown>) => proposals.push(changes) };
  const element = await host.render<"thermostat_config">(entry, props as never);
  const root = element.shadowRoot as ShadowRoot;
  await vi.waitFor(() => expect(find(root, "table")).not.toBeNull());
  return { element, root, proposals };
}

const input = (root: ShadowRoot, name: string) => find(root, `#preset-${name}`) as HTMLInputElement;

/** Type a text in a cell, as the user does. */
function type(cell: HTMLInputElement, text: string): void {
  cell.value = text;
  cell.dispatchEvent(new Event("change"));
}

describe("the structure of the table", () => {
  it("has only the normal column for a simple thermostat, and the columns of the features that are on", async () => {
    answer(HEATING);
    const simple = await render({ ...SWITCH });
    expect(findAll(simple.root, "thead th[scope='col']").map((th) => th.textContent?.trim())).toEqual(["Preset", "Normal"]);
    expect(findAll(simple.root, "tbody th[scope='row']").map((th) => th.textContent?.trim())).toEqual(["Frost", "Eco", "Comfort", "Boost"]);
    document.body.innerHTML = "";
    answer(HEATING.slice(0, 4));
    const away = await render({ ...SWITCH, use_presence_feature: true });
    expect(findAll(away.root, "thead th[scope='col']").map((th) => th.textContent?.trim())).toEqual(["Preset", "Normal", "Away"]);
    expect(findAll(away.root, "td.empty")).toHaveLength(4);
    expect(find(away.root, ".note")?.textContent).toContain("once you save");
  });

  it("gives each cell the name of its preset and its situation, and its unit", async () => {
    answer(HEATING);
    const { root } = await render({ ...SWITCH, use_presence_feature: true });
    const cell = input(root, "comfort_away_temp");
    expect(cell.getAttribute("aria-label")).toBe("Comfort, Away");
    expect(root.getElementById(cell.getAttribute("aria-describedby") ?? "")?.textContent).toBe("°C");
    expect(cell.getAttribute("min")).toBe("7");
    expect(cell.getAttribute("max")).toBe("35");
    expect(cell.getAttribute("step")).toBe("0.5");
  });

  it("uses no fixed color, only the variables of the theme", () => {
    const css = (NativeTabElement.styles as unknown as { cssText: string }[]).map((style) => style.cssText ?? "").join("\n");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    expect(css).toContain("var(--input-fill-color");
  });

  it("folds into one block for each preset under 520 px of container, without a horizontal scroll", () => {
    const css = (NativeTabElement.styles as unknown as { cssText: string }[]).map((style) => style.cssText ?? "").join("\n");
    expect(css).toContain("container-type: inline-size");
    expect(css).toMatch(/@container \(max-width: 520px\)\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    expect(css).toContain("content: attr(data-label)");
  });
});

describe("the typing in the table", () => {
  it("reads a comma, marks the cell as changed and proposes the temperature", async () => {
    answer(HEATING);
    const { root, proposals } = await render({ ...SWITCH });
    type(input(root, "eco_temp"), "18,5");
    expect(proposals).toEqual([{ "preset:eco_temp": 18.5 }]);
  });

  it("marks a changed cell, which the draft gives", async () => {
    answer(HEATING);
    const { root } = await render({ ...SWITCH, "preset:eco_temp": 18 });
    expect(find(root, 'td[data-key="preset:eco_temp"]')?.classList.contains("changed")).toBe(true);
    expect(find(root, 'td[data-key="preset:comfort_temp"]')?.classList.contains("changed")).toBe(false);
  });

  it("refuses a value beyond the limit: the cell is invalid, the message is under the table and the draft has nothing", async () => {
    answer(HEATING);
    const { root, proposals } = await render({ ...SWITCH });
    type(input(root, "eco_temp"), "40");
    await vi.waitFor(() => expect(input(root, "eco_temp").getAttribute("aria-invalid")).toBe("true"));
    expect(find(root, ".field-error")?.textContent).toContain("between 7 and 35");
    expect(input(root, "eco_temp").value).toBe("40");
    expect(proposals).toEqual([]);
  });

  it("marks the cell that Home Assistant refused at the save and lists its message", async () => {
    answer(HEATING);
    const { root } = await render({ ...SWITCH }, { eco_temp: "unknown_error" });
    expect(input(root, "eco_temp").getAttribute("aria-invalid")).toBe("true");
    expect(input(root, "comfort_temp").getAttribute("aria-invalid")).toBe("false");
    expect(find(root, ".field-error")?.textContent).toContain("Eco, Normal");
  });

  it("warns, without blocking, when eco is warmer than comfort", async () => {
    answer(HEATING);
    const { root } = await render({ ...SWITCH, "preset:eco_temp": 21 });
    expect(find(root, ".order-warning")?.textContent).toContain("Normal: Eco is warmer than Comfort.");
    expect(findAll(root, ".field-error")).toEqual([]);
  });
});

describe("the presets of the central configuration", () => {
  it("are read only, with a link to the presets of the general configuration", async () => {
    answer(HEATING);
    const { element, root } = await render({ ...SWITCH, use_presets_central_config: true });
    await vi.waitFor(() => expect(find(root, "td")).not.toBeNull());
    expect(findAll(root, "input")).toEqual([]);
    expect(find(root, "tbody td")?.textContent).toContain("7 °C");
    const events: string[] = [];
    element.addEventListener(NAVIGATE_EVENT, (event) => events.push((event as CustomEvent<NavigateDetail>).detail.path));
    (find(root, "a") as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    expect(events).toEqual(["/vtherm/core.top.configuration/core_presets.general.main"]);
  });
});
