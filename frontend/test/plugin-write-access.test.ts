// @vitest-environment happy-dom
/**
 * Who may write: the widgets and the configuration components of the native plugins never write by themselves, while those of the
 * other plugins are free to. The native sources are checked statically, and a plugin that writes is run in the panel.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { CORE_TOP_TABS, resolveWidgetSize } from "@vtherm/dashboard-sdk";
import type { PlacedEntry, ShownContribution } from "@vtherm/dashboard-sdk";
import { createFakeHass } from "@vtherm/dashboard-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import "../src/components/widgets.ts";
import { TestElement, cleanup, find, mountPanel, nativePlugins, page, plugin } from "./support/dashboard-harness.ts";
import type { TestPlugin } from "./support/dashboard-harness.ts";
import { deepFindAll } from "./support/vtherm-runtime.ts";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const SOURCES = resolve(process.cwd(), "frontend/src");

/** The WebSocket messages that only read: the commands `get_*` of the dashboard, and the history of Home Assistant. */
const READS = /^(vtherm_dashboard\/get_|history\/)/;

/** The source without its comments, which can talk about the calls that they forbid. */
const withoutComments = (source: string): string => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/** What a source writes by itself: a call of a service, or a WebSocket message that is not a read. */
function writesIn(source: string): string[] {
  const code = withoutComments(source);
  const writes: string[] = [];
  if (/\bcallService\b/.test(code)) {
    writes.push("callService");
  }
  for (const match of code.matchAll(/\bcallWS\b/g)) {
    const message = /type:\s*["'`]([^"'`]+)["'`]/.exec(code.slice(match.index, match.index + 300));
    if (message === null) {
      writes.push("callWS with a type that is not a text");
    } else if (!READS.test(message[1] as string)) {
      writes.push(`callWS ${message[1]}`);
    }
  }
  return writes;
}

/** The TypeScript files under a directory, or the file itself. */
function filesUnder(path: string): string[] {
  if (!statSync(path).isDirectory()) {
    return [path];
  }
  return readdirSync(path).flatMap((name) => filesUnder(join(path, name)));
}

/** What the native sources write by themselves, by file. */
function nativeWrites(paths: readonly string[]): Record<string, string[]> {
  const found: Record<string, string[]> = {};
  const files = paths.flatMap((path) => filesUnder(join(SOURCES, path)));
  expect(files.length, "the sources to check are found").toBeGreaterThan(paths.length);
  for (const file of files) {
    const writes = writesIn(readFileSync(file, "utf8"));
    if (writes.length > 0) {
      found[relative(SOURCES, file)] = writes;
    }
  }
  return found;
}

describe("the check of a source", () => {
  it("finds a call of a service", () => {
    expect(writesIn(`this.hass.callService("light", "turn_on", {});`)).toEqual(["callService"]);
  });

  it("finds a WebSocket message that writes, and one whose type is not a text", () => {
    expect(writesIn(`await hass.callWS({ type: "vtherm_dashboard/save_config", entry_id: id });`)).toEqual(["callWS vtherm_dashboard/save_config"]);
    expect(writesIn(`await hass.callWS(message);`)).toEqual(["callWS with a type that is not a text"]);
  });

  it("lets the reads through, and ignores the comments", () => {
    expect(writesIn(`await hass.callWS<List>({ type: "vtherm_dashboard/get_thermostats" });\nawait hass.callWS<H>({\n  type: "history/history_during_period",\n});`)).toEqual([]);
    expect(writesIn(`// a widget never calls callService\n/** nor callService */\nconst a = 1;`)).toEqual([]);
  });
});

describe("the native widgets", () => {
  it("never call a service or write by a WebSocket message", () => {
    expect(nativeWrites(["native/widgets", "components/overview"])).toEqual({});
  });
});

describe("the native components of configuration", () => {
  it("never call a service, and only read by WebSocket messages: the dashboard saves the draft", () => {
    expect(nativeWrites(["native/native-tab.ts", "native/preset-table.ts", "native/fields.ts", "native/plugins"])).toEqual({});
  });
});

/** A component of a plugin that writes: a click calls a service of Home Assistant. */
class WritingElement extends TestElement {
  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("click", () => {
      void (this.hass as { callService(domain: string, service: string, data: unknown): unknown }).callService("number", "set_value", { entity_id: "number.smartpi_gain", value: 2 });
    });
  }
}
for (const tag of ["writer-widget-el", "writer-tab-el"]) {
  if (customElements.get(tag) === undefined) {
    customElements.define(tag, class extends WritingElement {});
  }
}

const natives: TestPlugin[] = nativePlugins.map((definition) => ({ definition }));
const root = (panel: HTMLElement) => panel.shadowRoot as ShadowRoot;
const writer = plugin("writer", {
  thermostat_config: [page("writer.tab")],
});

describe("a widget of another plugin", () => {
  it("calls a service of Home Assistant from the grid of the widgets, and the call is not blocked by the dashboard", async () => {
    const contribution = { id: "writer.widget", component: "writer-widget-el" } as ShownContribution;
    const entry: PlacedEntry = { id: "writer.widget", pluginId: "writer", hook: "global_widget", contribution, size: resolveWidgetSize(undefined) };
    vi.stubGlobal("ResizeObserver", class { observe(): void {} disconnect(): void {} });
    const hass = createFakeHass();
    const grid = document.createElement("vtherm-widgets") as HTMLElement & { entries: readonly PlacedEntry[]; hass: unknown; updateComplete: Promise<unknown> };
    Object.assign(grid, { entries: [entry], hass });
    document.body.append(grid);
    await grid.updateComplete;
    await vi.waitFor(() => expect(deepFindAll(grid, "writer-widget-el")).toHaveLength(1));
    const shown = deepFindAll(grid, "writer-widget-el")[0];
    expect(shown).not.toBeNull();
    shown?.click();
    expect(hass.serviceCalls).toEqual([{ domain: "number", service: "set_value", data: { entity_id: "number.smartpi_gain", value: 2 } }]);
  });
});

describe("a tab of configuration of another plugin", () => {
  it("writes by itself without touching the draft, and the dashboard saves nothing", async () => {
    const { panel, hass } = await mountPanel({ plugins: [...natives, { definition: writer }], path: `/vtherm/${CORE_TOP_TABS.thermostats}/climate.salon/writer.tab` });
    const shown = find(root(panel), "writer-tab-el") as TestElement & { draft?: { dirty: boolean } };
    expect(shown).not.toBeNull();
    shown.click();
    expect(hass.callService).toHaveBeenCalledExactlyOnceWith("number", "set_value", { entity_id: "number.smartpi_gain", value: 2 });
    expect(shown.draft?.dirty ?? false).toBe(false);
    const saves = hass.callWS.mock.calls.filter(([message]: [Record<string, unknown>]) => message["type"] === "vtherm_dashboard/save_config");
    expect(saves).toEqual([]);
  });
});
