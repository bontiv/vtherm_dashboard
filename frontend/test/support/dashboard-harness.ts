/**
 * A dashboard in a test: the panel, a server that answers with a list of plugins, and plugins whose modules register themselves.
 */

import { CORE_TOP_TABS, defineTranslations, registerUiPlugin } from "@vtherm/dashboard-sdk";
import type { UiPluginDefinition } from "@vtherm/dashboard-sdk";
import { vi } from "vitest";

import "../../src/index.ts";
import type { ThermostatInfo } from "../../src/navigation.ts";
import type { VThermDashboardPanel } from "../../src/panel.ts";
import { uninstallRegistry } from "../../src/registry.ts";
import { DASHBOARD_VERSION } from "../../src/version.ts";

/** A plugin of the test: its definition, and the elements that its contributions show. */
export interface TestPlugin {
  readonly definition: UiPluginDefinition;
  /** The state that the server gives it. `ready` by default. */
  readonly state?: string;
  readonly reason?: string | null;
  readonly details?: Record<string, unknown>;
  readonly requires?: readonly string[];
  readonly source?: "installed" | "native" | "development";
}

const translations = defineTranslations({ title: "Title" });

/** A navigation contribution. The title is its identifier, which is also its key. */
export const page = (id: string, extra: Record<string, unknown> = {}) => ({ id, title: id, component: `${id.replace(/\./g, "-")}-el`, ...extra });

/** A contribution that shows a widget. */
export const widget = (id: string, extra: Record<string, unknown> = {}) => ({ id, component: `${id.replace(/\./g, "-")}-el`, ...extra });

/** A plugin definition. */
export function plugin(id: string, contributions: Record<string, unknown>): UiPluginDefinition {
  return { id, translations, contributions } as unknown as UiPluginDefinition;
}

/** The elements that the pages and widgets of the test show. They record the properties that they receive. */
export class TestElement extends HTMLElement {
  hass: unknown;
  thermostatId: string | undefined;
  values: unknown;
  connectedCallback(): void {
    this.textContent = `${this.localName} ${this.thermostatId ?? ""}`.trim();
  }
}

/** Define an element for every component that the definitions use, once. */
export function defineElements(definitions: readonly UiPluginDefinition[]): void {
  for (const definition of definitions) {
    for (const list of Object.values(definition.contributions)) {
      for (const contribution of list ?? []) {
        const tag = (contribution as { component?: string }).component;
        if (tag !== undefined && customElements.get(tag) === undefined) {
          try {
            customElements.define(tag, class extends TestElement {});
          } catch {
            // A test can use a name that is not a valid element name, to see how the dashboard reacts.
          }
        }
      }
    }
  }
}

/** The native plugins of the dashboard, as far as the panel is concerned. */
export const nativePlugins: readonly UiPluginDefinition[] = [
  plugin("core", {
    top_tab: [
      { id: CORE_TOP_TABS.dashboard, title: "Dashboard" },
      { id: CORE_TOP_TABS.thermostats, title: "Thermostats" },
      { id: CORE_TOP_TABS.configuration, title: "Configuration", zone: "end", icon: "mdi:cog" },
    ],
    global_page: [page("core.page.overview")],
    thermostat_config: [page("core.page.thermostat_overview")],
    general_config: [page("core.general.main", { group: "Versatile Thermostat" }), page("core.page.plugins", { group: "Dashboard" })],
  }),
  plugin("core_tpi", { thermostat_config: [page("core_tpi.tab.main")] }),
];

export const thermostats: readonly ThermostatInfo[] = [
  { id: "climate.salon", name: "Salon", type: "over_switch" },
  { id: "climate.chambre", name: "Chambre", type: "over_climate" },
];

/** The answer of the server for some plugins, which are all ready and in the order given unless a plugin says otherwise. */
export function serverAnswer(plugins: readonly TestPlugin[]) {
  let rank = 0;
  return {
    // The server gives the version of the dashboard under test, as the real one does: a pre-release included.
    dashboard_version: DASHBOARD_VERSION,
    plugins: plugins.map((item) => {
      const state = item.state ?? "ready";
      return {
        id: item.definition.id,
        js_url: `/${item.definition.id}/ui.js`,
        dashboard_version: `>=${DASHBOARD_VERSION}`,
        requires: item.requires ?? [],
        load_after: [],
        load_before: [],
        source: item.source ?? "installed",
        state,
        reason: item.reason ?? null,
        details: item.details ?? {},
        order: state === "ready" ? rank++ : null,
      };
    }),
  };
}

/** The configurations that the fake server knows, by entry. */
export type FakeConfigs = Record<string, { name: string; type: "central" | "over_switch" | "over_climate" | "over_valve"; values: Record<string, unknown>; read_only?: boolean }>;

/** How the fake server answers the creation of a configuration. */
export interface FakeServerOptions {
  /** The errors that the flow gives for every creation. Without errors, the creation succeeds. */
  readonly createErrors?: readonly { readonly tab: string | null; readonly field: string | null; readonly code: string }[];
}
const TYPES: Readonly<Record<string, FakeConfigs[string]["type"]>> = {
  thermostat_central_config: "central",
  thermostat_over_switch: "over_switch",
  thermostat_over_climate: "over_climate",
  thermostat_over_valve: "over_valve",
};
/**
 * A fake `hass` for the panel: it answers the commands of the dashboard. A save writes the changes into `configs`, and a creation adds
 * an entry `created_<n>` to `configs`.
 */
export function createHass(language = "en", answer?: unknown, configs: FakeConfigs = {}, server: FakeServerOptions = {}) {
  let created = 0;
  const centralOf = () => Object.entries(configs).find(([, config]) => config.type === "central")?.[0] ?? null;
  const merged = (changes: unknown) => Object.assign({}, ...Object.values((changes ?? {}) as Record<string, Record<string, unknown>>)) as Record<string, unknown>;
  const handle = async (message: Record<string, unknown>): Promise<unknown> => {
    switch (message["type"]) {
      case "vtherm_dashboard/get_ui_plugins":
        return answer;
      case "vtherm_dashboard/get_thermostats": {
        const centralId = centralOf();
        return {
          thermostats: Object.entries(configs)
            .filter(([, config]) => config.type !== "central")
            .map(([id, config]) => ({ id, name: config.name, type: config.type, read_only: config.read_only === true })),
          has_central_config: centralId !== null,
          central_config_id: centralId,
          supported_config_version: [2, 4], supported_vtherm_major: 10,
        };
      }
      case "vtherm_dashboard/get_config": {
        const config = configs[message["entry_id"] as string];
        if (config === undefined) {
          throw new Error("not_found");
        }
        return { id: message["entry_id"], name: config.name, type: config.type, values: config.values, version: 2, minor_version: 4, read_only: config.read_only === true, read_only_reason: config.read_only === true ? "config_version_newer" : null };
      }
      case "vtherm_dashboard/get_presets":
        return { presets: [] };
      case "vtherm_dashboard/save_config": {
        const config = configs[message["entry_id"] as string];
        if (config !== undefined) {
          config.values = { ...config.values, ...merged(message["changes"]) };
        }
        return { ok: true, config_saved: true, entry_id: message["entry_id"], errors: [], preset_errors: [] };
      }
      case "vtherm_dashboard/create_config": {
        if ((server.createErrors ?? []).length > 0) {
          return { ok: false, entry_id: null, errors: server.createErrors };
        }
        created += 1;
        const entryId = `created_${created}`;
        const values: Record<string, unknown> = { ...merged(message["changes"]), thermostat_type: message["thermostat_type"] };
        configs[entryId] = { name: String(values["name"] ?? entryId), type: TYPES[message["thermostat_type"] as string] ?? "over_switch", values };
        return { ok: true, entry_id: entryId, errors: [] };
      }
      default:
        return answer;
    }
  };
  return {
    language,
    locale: { language },
    states: {},
    user: { is_admin: true },
    callService: vi.fn(),
    callWS: vi.fn(handle),
  };
}

/** What `mountPanel` can be given. */
export interface MountOptions {
  readonly plugins?: readonly TestPlugin[];
  readonly language?: string;
  readonly thermostats?: readonly ThermostatInfo[];
  /** The modules that fail to import, by plugin identifier. */
  readonly failing?: Readonly<Record<string, Error>>;
  /** The address to open, which the test sets before mounting. */
  readonly path?: string;
  /** The configurations of Versatile Thermostat that the fake server knows. */
  readonly configs?: FakeConfigs;
  /** Give the thermostats from the fake server instead of `thermostats`. */
  readonly realThermostats?: boolean;
  /** How the fake server answers a creation. */
  readonly server?: FakeServerOptions;
  /** Answers in front of those of the fake server: the first one that gives something other than `undefined` wins. */
  readonly handlers?: readonly ((message: Record<string, unknown>) => Promise<unknown>)[];
  /** Whether the user is an administrator. By default, yes. */
  readonly admin?: boolean;
  /**
   * Build the way to import a module, from the function that evaluates a module of the test. The default evaluates the module at
   * each import; a test can give the same function to two panels, to behave as the browser, which evaluates a module once.
   */
  readonly importModule?: (evaluate: (url: string) => void) => (url: string) => Promise<unknown>;
}

/** Mount the panel with plugins and wait for it to be ready. */
export async function mountPanel(options: MountOptions = {}) {
  const plugins = options.plugins ?? nativePlugins.map((definition) => ({ definition }));
  defineElements(plugins.map((item) => item.definition));
  window.history.replaceState(null, "", options.path ?? "/vtherm");
  const byUrl = new Map(plugins.map((item) => [`/${item.definition.id}/ui.js`, item.definition]));
  const panel = document.createElement("vtherm-dashboard-panel") as VThermDashboardPanel;
  // Without configurations, each thermostat of the test has one, of its type.
  const configs: FakeConfigs =
    options.configs ??
    Object.fromEntries((options.thermostats ?? thermostats).map((item) => [item.id, { name: item.name, type: item.type, values: { thermostat_type: `thermostat_${item.type}`, name: item.name } }]));
  const hass = createHass(options.language ?? "en", serverAnswer(plugins), configs, options.server);
  if (options.handlers !== undefined) {
    const base = hass.callWS.getMockImplementation() as (message: Record<string, unknown>) => Promise<unknown>;
    hass.callWS.mockImplementation(async (message: Record<string, unknown>) => {
      for (const handler of options.handlers ?? []) {
        const answer = await handler(message);
        if (answer !== undefined) {
          return answer;
        }
      }
      return base(message);
    });
  }
  hass.user = { is_admin: options.admin ?? true };
  const evaluate = (url: string): void => {
    const failure = options.failing?.[url.split("/")[1] as string];
    if (failure !== undefined) {
      throw failure;
    }
    registerUiPlugin(byUrl.get(url) as UiPluginDefinition);
  };
  panel.importModule = options.importModule?.(evaluate) ?? (async (url) => evaluate(url));
  if (options.realThermostats !== true) {
    panel.thermostatProvider = async () => options.thermostats ?? thermostats;
  }
  panel.hass = hass as never;
  document.body.append(panel);
  await vi.waitFor(() => {
    if (panel.phase === "loading") {
      throw new Error("still loading");
    }
  });
  await settle(panel);
  return { panel, hass };
}

/** Wait until the panel shows its page: the configuration of the page is read, and the drawing is done. */
export async function settle(panel: VThermDashboardPanel): Promise<void> {
  await panel.updateComplete;
  await vi.waitFor(() => {
    const message = panel.shadowRoot?.querySelector(".message")?.textContent ?? "";
    if (message.includes("Loading the configuration") || message.includes("Chargement de la configuration") || message.includes("Konfiguration wird geladen")) {
      throw new Error("still loading the configuration");
    }
  });
  await panel.updateComplete;
}

/** Remove the panel and the registry from the page. */
export function cleanup(): void {
  document.body.innerHTML = "";
  uninstallRegistry();
  window.history.replaceState(null, "", "/");
}

/** Whether the selector is only the name of an element, which happy-dom cannot parse when it has an underscore. */
const isTagName = (selector: string): boolean => /^[a-z][a-z0-9_-]*$/.test(selector);

function matches(element: Element, selector: string): boolean {
  return isTagName(selector) ? element.localName === selector : element.matches(selector);
}

/** Find an element in the shadow roots of the panel, as a user sees them. */
export function find<Element extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): Element | null {
  return findAll<Element>(root, selector)[0] ?? null;
}

/**
 * The title of an entry of the left menu, without its status and without the words that only a screen reader says.
 *
 * @param link - The link of the entry, `a` or `ha-md-list-item`.
 */
export function linkTitle(link: Element): string {
  const title = link.querySelector(".title, [slot=headline]") ?? link;
  return [...title.childNodes]
    // The markers of Lit are comments: only the texts and the visible elements make the title.
    .filter((node) => node.nodeType === Node.TEXT_NODE || (node instanceof Element && !node.classList.contains("visually-hidden")))
    .map((node) => node.textContent ?? "")
    .join("")
    .trim();
}

/** Find all the elements that match in the shadow roots of the panel. */
export function findAll<Element extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): Element[] {
  const found: Element[] = [];
  for (const candidate of root.querySelectorAll("*")) {
    if (matches(candidate, selector)) {
      found.push(candidate as Element);
    }
    if (candidate.shadowRoot !== null) {
      found.push(...findAll<Element>(candidate.shadowRoot, selector));
    }
  }
  return found;
}
