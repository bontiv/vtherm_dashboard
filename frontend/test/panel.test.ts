// @vitest-environment happy-dom
import { CORE_TOP_TABS } from "@vtherm/dashboard-sdk";
import { afterEach, describe, expect, it, vi } from "vitest";

import manifest from "../../custom_components/vtherm_dashboard/manifest.json" with { type: "json" };

import { cleanup, find, findAll, mountPanel, nativePlugins, page, plugin, thermostats } from "./support/dashboard-harness.ts";
import { settle } from "./support/dashboard-harness.ts";
import type { TestPlugin } from "./support/dashboard-harness.ts";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const natives: TestPlugin[] = nativePlugins.map((definition) => ({ definition }));
const texts = (nodes: readonly HTMLElement[]) => nodes.map((node) => node.textContent?.trim());

describe("the frame", () => {
  it("shows the tabs of the plugins, the default page, the menu and the breadcrumb", async () => {
    const { panel } = await mountPanel();
    const bar = find(panel.shadowRoot as ShadowRoot, "vtherm-top-bar") as HTMLElement;
    expect(texts(findAll(bar.shadowRoot as ShadowRoot, "nav.start a"))).toEqual(["Dashboard", "Thermostats"]);
    expect(texts(findAll(panel.shadowRoot as ShadowRoot, "vtherm-breadcrumb li"))).toEqual(["Dashboard", "core.page.overview"]);
    expect(find(panel.shadowRoot as ShadowRoot, "core-page-overview-el")).not.toBeNull();
  });

  it("shows the configuration gear alone on the right, without text, with an accessible name and a tooltip", async () => {
    const { panel } = await mountPanel();
    const bar = find(panel.shadowRoot as ShadowRoot, "vtherm-top-bar") as HTMLElement;
    const gear = findAll(bar.shadowRoot as ShadowRoot, "nav.end a");
    expect(gear).toHaveLength(1);
    expect(gear[0]?.getAttribute("aria-label")).toBe("Configuration");
    expect(gear[0]?.getAttribute("title")).toBe("Configuration");
    expect(gear[0]?.textContent?.trim()).toBe("");
    expect(gear[0]?.querySelector("ha-icon")).not.toBeNull();
  });

  it("marks the current tab, and the current entry of the menu", async () => {
    const { panel } = await mountPanel({ path: `/vtherm/${CORE_TOP_TABS.configuration}/core.page.plugins` });
    const bar = find(panel.shadowRoot as ShadowRoot, "vtherm-top-bar") as HTMLElement;
    expect(findAll(bar.shadowRoot as ShadowRoot, 'a[aria-selected="true"]').map((tab) => tab.getAttribute("href"))).toEqual([`/vtherm/${CORE_TOP_TABS.configuration}`]);
    const menu = find(panel.shadowRoot as ShadowRoot, "vtherm-side-menu") as HTMLElement;
    expect(texts(findAll(menu.shadowRoot as ShadowRoot, 'a[aria-current="page"]'))).toEqual(["core.page.plugins"]);
    expect(texts(findAll(menu.shadowRoot as ShadowRoot, "h2"))).toEqual(["Versatile Thermostat", "Dashboard"]);
  });

  it("hides the menu of the Dashboard tab when it has a single page", async () => {
    const { panel } = await mountPanel();
    expect(find(panel.shadowRoot as ShadowRoot, "vtherm-side-menu")).toBeNull();
    expect(find(panel.shadowRoot as ShadowRoot, "aside")).toBeNull();
    expect(find(panel.shadowRoot as ShadowRoot, "core-page-overview-el")).not.toBeNull();
  });

  it("shows the menu of the Dashboard tab when it has several pages", async () => {
    const withPage = plugin("core_extra", { global_page: [page("core_extra.page.history")] });
    const { panel } = await mountPanel({ plugins: [...natives, { definition: withPage }] });
    const menu = find(panel.shadowRoot as ShadowRoot, "vtherm-side-menu") as HTMLElement;
    expect(texts(findAll(menu.shadowRoot as ShadowRoot, "a"))).toEqual(["core.page.overview", "core_extra.page.history"]);
  });

  it("scrolls the menu on its own and stays inside its column", async () => {
    const { panel } = await mountPanel({ path: `/vtherm/${CORE_TOP_TABS.configuration}` });
    const styles = (find(panel.shadowRoot as ShadowRoot, "vtherm-side-menu")?.constructor as { styles?: { cssText: string } | readonly { cssText: string }[] }).styles;
    const css = (Array.isArray(styles) ? styles : [styles]).map((style) => String(style?.cssText)).join("\n");
    expect(css).toContain("overflow-y: auto");
  });
});

describe("the routes", () => {
  it("opens a page when the user clicks its link, and the address changes", async () => {
    const { panel } = await mountPanel({ path: `/vtherm/${CORE_TOP_TABS.configuration}` });
    const menu = find(panel.shadowRoot as ShadowRoot, "vtherm-side-menu") as HTMLElement;
    const link = findAll<HTMLAnchorElement>(menu.shadowRoot as ShadowRoot, "a").find((anchor) => anchor.textContent?.trim() === "core.page.plugins") as HTMLAnchorElement;
    link.click();
    await settle(panel);
    expect(window.location.pathname).toBe(`/vtherm/${CORE_TOP_TABS.configuration}/core.page.plugins`);
    expect(find(panel.shadowRoot as ShadowRoot, "core-page-plugins-el")).not.toBeNull();
    expect(texts(findAll(panel.shadowRoot as ShadowRoot, "vtherm-breadcrumb li"))).toEqual(["Configuration", "core.page.plugins"]);
  });

  it("follows the address when Home Assistant gives its own route to the panel, as it does at each navigation", async () => {
    const { panel } = await mountPanel({ path: `/vtherm/${CORE_TOP_TABS.configuration}` });
    // Home Assistant sets `route` on every custom panel, before the panel reads the address.
    const fromHomeAssistant = panel as unknown as { route: unknown };
    fromHomeAssistant.route = { prefix: "/vtherm", path: `/${CORE_TOP_TABS.configuration}` };
    await settle(panel);
    expect(find(panel.shadowRoot as ShadowRoot, "core-general-main-el")).not.toBeNull();
    window.history.pushState(null, "", `/vtherm/${CORE_TOP_TABS.configuration}/core.page.plugins`);
    fromHomeAssistant.route = { prefix: "/vtherm", path: `/${CORE_TOP_TABS.configuration}/core.page.plugins` };
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    await settle(panel);
    expect(find(panel.shadowRoot as ShadowRoot, "core-page-plugins-el")).not.toBeNull();
    expect(texts(findAll(panel.shadowRoot as ShadowRoot, "vtherm-breadcrumb li"))).toEqual(["Configuration", "core.page.plugins"]);
  });

  it("goes back with the history of the browser", async () => {
    const { panel } = await mountPanel({ path: `/vtherm/${CORE_TOP_TABS.configuration}` });
    const menu = find(panel.shadowRoot as ShadowRoot, "vtherm-side-menu") as HTMLElement;
    findAll<HTMLAnchorElement>(menu.shadowRoot as ShadowRoot, "a")[1]?.click();
    await settle(panel);
    window.history.replaceState(null, "", `/vtherm/${CORE_TOP_TABS.configuration}/core.general.main`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await settle(panel);
    expect(find(panel.shadowRoot as ShadowRoot, "core-general-main-el")).not.toBeNull();
  });

  it("shows the same page again after a reload", async () => {
    const path = `/vtherm/${CORE_TOP_TABS.thermostats}/climate.salon/core_tpi.tab.main`;
    const { panel } = await mountPanel({ path });
    expect(texts(findAll(panel.shadowRoot as ShadowRoot, "vtherm-breadcrumb li"))).toEqual(["Thermostats", "Salon", "core_tpi.tab.main"]);
    expect(find(panel.shadowRoot as ShadowRoot, "core_tpi-tab-main-el")).not.toBeNull();
    expect(window.location.pathname).toBe(path);
  });

  it("shows the default page with a message for an address that designates nothing, and the message can be closed", async () => {
    const { panel } = await mountPanel({ path: "/vtherm/nothing.top/gone" });
    const notice = find(panel.shadowRoot as ShadowRoot, ".notice") as HTMLElement;
    expect(notice.textContent).toContain("does not exist");
    expect(find(panel.shadowRoot as ShadowRoot, "core-page-overview-el")).not.toBeNull();
    find(notice, "button")?.click();
    await settle(panel);
    expect(find(panel.shadowRoot as ShadowRoot, ".notice")).toBeNull();
  });

  it("opens the same page of another thermostat when it has it, and the overview when it does not", async () => {
    const withWindow = plugin("core_window", { thermostat_config: [page("core_window.tab.main", { visible: (context: { thermostatType: string }) => context.thermostatType === "over_switch" })] });
    const { panel } = await mountPanel({ plugins: [...natives, { definition: withWindow }], path: `/vtherm/${CORE_TOP_TABS.thermostats}/climate.salon/core_window.tab.main` });
    const select = find<HTMLSelectElement>(find(panel.shadowRoot as ShadowRoot, "vtherm-side-menu")?.shadowRoot as ShadowRoot, "select") as HTMLSelectElement;
    select.value = "climate.chambre";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(panel);
    expect(window.location.pathname).toBe(`/vtherm/${CORE_TOP_TABS.thermostats}/climate.chambre`);
    expect(find(panel.shadowRoot as ShadowRoot, "core-page-thermostat_overview-el")).not.toBeNull();
  });
});

describe("the thermostats tab", () => {
  it("shows the list of the thermostats in full width, without menu", async () => {
    const { panel } = await mountPanel({ path: `/vtherm/${CORE_TOP_TABS.thermostats}` });
    expect(find(panel.shadowRoot as ShadowRoot, "vtherm-side-menu")).toBeNull();
    const list = find(panel.shadowRoot as ShadowRoot, "vtherm-thermostat-list") as HTMLElement;
    // Without area, the thermostats are ordered by name.
    expect(texts(findAll(list.shadowRoot as ShadowRoot, ".name"))).toEqual(["Chambre", "Salon"]);
  });

  it("reads the list again when Home Assistant moves a thermostat to another area, and only then", async () => {
    let area = "living";
    const located = async (message: Record<string, unknown>) =>
      message["type"] === "vtherm_dashboard/get_thermostats"
        ? {
            thermostats: [
              { id: "climate.salon", name: "Salon", type: "over_switch", read_only: false, device_id: "device-salon", climate_entity_id: "climate.salon", area_id: area, area_name: null, floor_name: null, floor_level: null },
            ],
            has_central_config: false,
            central_config_id: null,
            supported_config_version: [2, 4], supported_vtherm_major: 10,
          }
        : undefined;
    const { panel, hass } = await mountPanel({ path: `/vtherm/${CORE_TOP_TABS.thermostats}`, realThermostats: true, handlers: [located] });
    const areas = { living: { area_id: "living", name: "Living room" }, office: { area_id: "office", name: "Office" } };
    const withDevice = (deviceArea: string) => ({ ...hass, areas, devices: { "device-salon": { area_id: deviceArea } }, entities: { "climate.salon": { area_id: null } } }) as never;
    const list = find(panel.shadowRoot as ShadowRoot, "vtherm-thermostat-list") as HTMLElement;
    panel.hass = withDevice("living");
    await settle(panel);
    const reads = () => hass.callWS.mock.calls.filter(([message]) => (message as Record<string, unknown>)["type"] === "vtherm_dashboard/get_thermostats").length;
    const before = reads();
    // Another state change of Home Assistant, with the same areas: the list is not read again.
    panel.hass = withDevice("living");
    await settle(panel);
    expect(reads()).toBe(before);
    expect(texts(findAll(list.shadowRoot as ShadowRoot, "h3 .area"))).toEqual(["Living room"]);
    // The user moves the device to the office: the server gives the new area.
    area = "office";
    panel.hass = withDevice("office");
    await vi.waitFor(() => expect(texts(findAll(list.shadowRoot as ShadowRoot, "h3 .area"))).toEqual(["Office"]));
    expect(reads()).toBe(before + 1);
  });

  it("shows a message when there is no thermostat", async () => {
    const { panel } = await mountPanel({ path: `/vtherm/${CORE_TOP_TABS.thermostats}`, thermostats: [] });
    const list = find(panel.shadowRoot as ShadowRoot, "vtherm-thermostat-list") as HTMLElement;
    expect(find(list.shadowRoot as ShadowRoot, ".empty")?.textContent).toContain("No Versatile Thermostat thermostat is available");
  });

  it("opens a thermostat from the list with a selector first in its menu, and its overview", async () => {
    const { panel } = await mountPanel({ path: `/vtherm/${CORE_TOP_TABS.thermostats}` });
    const list = find(panel.shadowRoot as ShadowRoot, "vtherm-thermostat-list") as HTMLElement;
    findAll<HTMLAnchorElement>(list.shadowRoot as ShadowRoot, "li a")[0]?.click();
    await settle(panel);
    const menu = find(panel.shadowRoot as ShadowRoot, "vtherm-side-menu") as HTMLElement;
    expect((menu.shadowRoot as ShadowRoot).querySelector("nav")?.firstElementChild?.tagName).toBe("SELECT");
    expect(find(panel.shadowRoot as ShadowRoot, "core-page-thermostat_overview-el")).not.toBeNull();
    expect(thermostats[0]?.id).toBe("climate.salon");
  });
});

describe("the language", () => {
  it("shows the frame in the language of the user", async () => {
    const { panel } = await mountPanel({ language: "fr", thermostats: [], path: `/vtherm/${CORE_TOP_TABS.thermostats}` });
    const list = find(panel.shadowRoot as ShadowRoot, "vtherm-thermostat-list") as HTMLElement;
    expect(find(list.shadowRoot as ShadowRoot, ".empty")?.textContent).toContain("Aucun thermostat");
  });

  it("changes the texts when the user changes language, without reloading", async () => {
    const { panel, hass } = await mountPanel({ thermostats: [], path: `/vtherm/${CORE_TOP_TABS.thermostats}` });
    const list = find(panel.shadowRoot as ShadowRoot, "vtherm-thermostat-list") as HTMLElement;
    expect(find(list.shadowRoot as ShadowRoot, ".empty")?.textContent).toContain("No Versatile");
    panel.hass = { ...hass, language: "de", locale: { language: "de" } } as never;
    await vi.waitFor(() => expect(find(list.shadowRoot as ShadowRoot, ".empty")?.textContent).toContain("Es ist kein"));
  });
});

describe("a panel created again", () => {
  it("shows the plugins again when the user comes back, although the browser does not evaluate their modules twice", async () => {
    // As the browser: a module is evaluated at its first import only, and the same function imports for every panel of the page.
    const evaluated = new Set<string>();
    let browser: ((url: string) => Promise<unknown>) | undefined;
    const importModule = (evaluate: (url: string) => void) =>
      (browser ??= async (url: string) => {
        if (!evaluated.has(url)) {
          evaluated.add(url);
          evaluate(url);
        }
      });
    const first = await mountPanel({ importModule, path: `/vtherm/${CORE_TOP_TABS.configuration}` });
    expect(first.panel.statuses.every((status) => status.state === "loaded")).toBe(true);
    // Home Assistant destroys the panel when the user opens another page, and creates a new one when the user comes back.
    first.panel.remove();
    const second = await mountPanel({ importModule, path: `/vtherm/${CORE_TOP_TABS.configuration}` });
    expect(second.panel.statuses.map((status) => [status.id, status.state])).toEqual(first.panel.statuses.map((status) => [status.id, "loaded"]));
    expect(find(second.panel.shadowRoot as ShadowRoot, "core-general-main-el")).not.toBeNull();
  });
});

describe("the version", () => {
  it("shows the version of the frontend on the panel, and warns when the server has another one", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { panel } = await mountPanel();
    expect(panel.dataset["version"]).toBe(manifest.version);
    expect(warning).not.toHaveBeenCalled();
    cleanup();

    const { hass } = await mountPanel({ plugins: [] });
    expect(hass).toBeDefined();
    warning.mockClear();
    const other = document.createElement("vtherm-dashboard-panel") as typeof panel;
    const answer = { dashboard_version: "9.9.9", plugins: [] };
    other.hass = { language: "en", locale: { language: "en" }, states: {}, callWS: vi.fn().mockResolvedValue(answer) } as never;
    document.body.append(other);
    await vi.waitFor(() => expect(warning).toHaveBeenCalledWith(expect.stringContaining("9.9.9")));
  });
});
