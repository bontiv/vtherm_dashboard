# Architecture
Audience: contributors.

How the dashboard is made, from Home Assistant to the browser, and how a UI plugin gets from its declaration to the
screen.

## The pieces
```
 Home Assistant (Python)                                    Browser (TypeScript)
┌──────────────────────────────────────────────┐          ┌──────────────────────────────────────────┐
│ vtherm_api                                   │          │ panel (vtherm-dashboard-panel)           │
│   registry of UI plugins (passive)           │          │   bootstrap ──► loader ──► registry      │
│            ▲ register_ui_plugin              │          │                           │              │
│ integrations (native plugins, third parties) │          │              placement engine (SDK)      │
│            │                                 │          │                           │              │
│ vtherm_dashboard                             │ WebSocket│   top bar · menu · breadcrumb · pages    │
│   plugin_list: validate, check, sort ───────────────────►   plugins: core, core_*, third parties   │
│   websocket_api: get_ui_plugins, get_config, │◄─────────│   draft · save actions · creation        │
│     save_config, create_config, …            │          │                                          │
│   config_flow_driver ──► config flow of      │          └──────────────────────────────────────────┘
│     Versatile Thermostat                     │
│   complements ──► catalog (HTTP)             │          HACS: hacs/* commands, called by the browser
└──────────────────────────────────────────────┘
```

Python declares and decides. TypeScript contributes and shows. The two meet in WebSocket commands that carry codes, never text for
the user.

## Python
| Module | Role |
| --- | --- |
| `__init__.py` | Sets up the entry: the catalog, the commands, the panel and the native plugins. |
| `panel.py` | Serves `www/` under `/vtherm_dashboard_static` and adds the panel "Versatile Thermostat" to the side menu, for administrators only. |
| `dev_server.py` | Reads `VTHERM_DASHBOARD_DEV_SERVER`: the panel and the native plugins then load their sources from the development server of the frontend. See [Development environment](development-environment.md#the-development-server-of-the-frontend). |
| `native_plugins.py` | Registers the 16 native plugins in `vtherm_api`, in the order of the menu of the config flow, each one after the previous. |
| `api_keepalive.py` | Workaround: registers a feature manager factory that applies to no thermostat (`vtherm_dashboard_keepalive`), so that Versatile Thermostat keeps the instance of `vtherm_api`, and the UI plugins in it, when its last entry is recreated. To remove once Versatile Thermostat counts the UI plugins before dropping the instance. |
| `plugin_list.py` | Builds the list of plugins to load. See below. |
| `version_constraints.py` | The grammar of `dashboard_version`. |
| `websocket_api.py` | The commands. See the [WebSocket API](../reference/websocket-api.md). |
| `vtherm_config.py`, `config_flow_driver.py`, `presets.py`, `schema_description.py` | Reading and writing the configuration of Versatile Thermostat. |
| `complements.py` | The catalog of add-ons. |

### The registry and the load order
`vtherm_api` only stores the declarations (`register_ui_plugin`, `unregister_ui_plugin`, `get_ui_plugins`). It does not sort, check or
refuse anything beyond the shape of a call. This keeps it small and lets any integration register without importing the dashboard.

The dashboard decides. At each call of `vtherm_dashboard/get_ui_plugins`, `build_plugin_list` takes the declarations and the
development entries and:

1. refuses an invalid declaration, a bad URL and a reserved identifier (`core`, `core_*`) that is not native;
2. checks `dashboard_version` against the version of the dashboard;
3. checks `requires`, and finds the cycles of `requires`, `load_after` and `load_before`;
4. sorts the plugins that stay, and gives each one a state, a reason and an order.

The browser imports the ready plugins in that order and does not sort. See [Loading and dependencies](../plugins/loading-and-dependencies.md).

## TypeScript
| Folder | Role |
| --- | --- |
| `packages/sdk/` | `@vtherm/dashboard-sdk`: the types, `registerUiPlugin`, `defineTranslations`, the placement engine and the fake dashboard `testing`. |
| `frontend/src/` | The panel, the loader, the registry, the router and the navigation. |
| `frontend/src/components/` | The frame: top bar, side menu, breadcrumb, lists, the save actions. |
| `frontend/src/native/` | The native plugins and their tabs. |
| `frontend/src/config/` | The draft of a configuration, the session and the API. |
| `frontend/src/complements/`, `frontend/src/dev/` | The add-ons and the development mode. |

### Start
`index.ts` defines the panel element. When Home Assistant gives it `hass`, the panel:

1. loads the language;
2. asks the server for the plugin list (`bootstrap`), with the development entries of an administrator;
3. puts the registry in the page (`globalThis.VThermUiPluginRegistry`) before importing any module, since a module registers when it
   is evaluated, with `registerUiPlugin` of the SDK, which finds the registry there;
4. imports the modules in order (`loader`). An import that fails is isolated and kept in the status of the plugin. A module that the
   browser already evaluated in the page is not evaluated again: Home Assistant creates a new panel when the user comes back to it, and
   `bootstrap` gives the definitions that the module registered the first time to the new registry;
5. reads the thermostats and draws the page of the address.

### Registry and placement
The registry accepts a definition only for an identifier of the list. Each definition goes to the **placement engine** of the SDK,
which keeps the contributions of each hook and resolves their placements (`after`, `before`, `first`, `last`, `replace`, `remove`)
as plugins arrive, in load order. It records the problems (a missing target, a cycle of placements) as issues that the status page
shows. The same engine runs in the fake dashboard of the tests, so what a plugin sees in a test is what the dashboard does.

The navigation (`navigation.ts`) is a function of the route, the resolved contributions, the thermostats and the visibility of each
entry. The route is the address: `/vtherm/<tab>/<thermostat>/<entry>/...`, see `router.ts`.

### The native plugins
The dashboard is made of plugins, like any other. `core` gives the top tabs, the pages Overview, Plugins and Development and the
sections Main attributes, Features and Underlyings. Each other section of the config flow is a plugin (`core_tpi`, ...), and
`core_complements` gives the tab of add-ons. Their tabs are placed with `after` one another, so the order of the menu of the flow
comes from the placement engine and a third-party plugin can insert a tab anywhere. See [Native UI plugins](../plugins/native-plugins.md).

### Configuration and its draft
A native tab never writes. It reads `values` and proposes changes to the **draft** (`config/draft.ts`) of the thermostat or of the
central configuration. The panel keeps one draft for each configuration that was opened, and asks before leaving. It gives each
configuration component `draft` (`DraftControls`): its state and the commands save and discard. The native tabs draw the save actions
at the foot of their card (`components/card-actions.ts`); under a component of a plugin without `save_actions: "component"`, the
panel draws them in a card of its own. **Save** sends the changes by tab with `vtherm_dashboard/save_config`.

A creation is a configuration like the others, with a draft that is not read from the server. `ConfigSession.startCreation`
(`config/config-session.ts`) opens it under the key `new:thermostat` or `new:central`, and `entryOf` of the panel gives that key for
the route `/vtherm/<thermostats tab>/new/<section>` and, while the draft of the central configuration is open, for the Configuration
tab. The menu is limited to the sections of `CREATION_TABS` that apply (`native/tab-definitions.ts`): the navigation gets them with its
`creation` option, and the type is chosen at the top of the native section Type, which gives the draft `changeType`. **Create** is the
command `ConfigSession.create`, which sends an empty section for each section of the creation that applies, so that the flow gives
it the values that Versatile Thermostat proposes. Plugins of third parties have no section in a creation.

## Driving the config flow
The server saves the draft by driving the real config flow of Versatile Thermostat, tab by tab, and aborts at the first error. It
writes nothing itself, so the rules stay those of Versatile Thermostat. The preset temperatures are `number` entities, applied after
the flow. Everything is in [Driving the config flow](config-flow-driver.md), with the plan to move the validation to `vtherm_api`.

## Add-ons
The server reads the catalog and what Home Assistant knows about each integration. The browser talks to HACS with `hass.callWS`
through one adapter, deduces the state of each add-on and drives the installation. See [The add-ons feature](complements.md).

## Components of Home Assistant
The fields, buttons, messages, dialogs and lists of the dashboard are the components of Home Assistant (`ha-selector`, `ha-switch`,
`ha-button`, `ha-alert`, `ha-dialog`, `ha-card`, `ha-expansion-panel`, `ha-spinner`...), so that the dashboard looks and behaves like
the rest of Home Assistant. They were checked on Home Assistant 2026.10. `ensureHaControls()` of the SDK waits for them; a component
that is not defined after the wait is replaced by a plain HTML control (the fallback), so an older version still works.

## What is shared
- `shared/vtherm-config-schemas.json` describes the forms of the config flow. Python writes it, TypeScript reads it.
- `shared/version-constraints.json` is the table of tests of the grammar of `dashboard_version`. The grammar is only in Python.
- The version is in the manifest, and the build and the server give it to the frontend.
