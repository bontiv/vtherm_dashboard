# Documentation

Documentation of the Versatile Thermostat dashboard ("Versatile Thermostat" in the side menu of Home Assistant). Every page of `docs/` is listed here with the
people it is written for: **User** (uses the dashboard), **Plugin author** (writes a UI plugin and the plugin package that ships it, see the [terminology](plugins/plugin-development.md#terminology)) and **Contributor**
(works on this repository).

| Page | Audience | Content |
| --- | --- | --- |
| [Using the dashboard](user/dashboard.md) | User | Open the dashboard, the tabs, the menu and the breadcrumb, a phone, and the status of the UI plugins. |
| [Configuring thermostats](user/configuration.md) | User | The draft and its save bar, the central configuration, creating a thermostat, and each section of the configuration. |
| [Add-ons for Versatile Thermostat](user/complements.md) | User | The catalog, the states of an add-on, the installation with HACS, the restart, the configuration, and the update and removal by HACS. |
| [Developing a UI plugin](plugins/plugin-development.md) | Plugin author | The terminology, then the whole procedure with the sample plugin package: project, declaration in Python, elements, translations, placements, development mode, tests, installation, publication and a new major version of the dashboard. |
| [Python API for UI plugins](plugins/python-api.md) | Plugin author | Declare a UI plugin with `register_ui_plugin`, its parameters, its errors and what the dashboard checks later. |
| [Native UI plugins](plugins/native-plugins.md) | Plugin author | The 16 native UI plugins, their load order, and the identifiers of their contributions that a UI plugin can use as a position. |
| [Loading and dependencies](plugins/loading-and-dependencies.md) | Plugin author | `requires`, `load_after` and `load_before`, the load order and the status of a UI plugin. |
| [Version constraints](plugins/version-constraints.md) | Plugin author | The grammar of `dashboard_version`, pre-releases and how to support a new major version. |
| [Translations](plugins/internationalization.md) | Plugin author | The English catalog, typed keys, language resolution and fallback, titles as keys, parameters, plurals and catalogs loaded on demand. |
| [Development mode](plugins/dev-mode.md) | Plugin author | The development mode: entries of the browser, the two kinds of entry, the servers of Vite and Rollup with CORS, the diagnosis of a failure, HTTPS and Safari, and the limits. |
| [Theming](plugins/theming.md) | Plugin author | Use the variables of the Home Assistant theme and no color of your own. |
| [Hooks and placement](plugins/hooks-and-placement.md) | Plugin author | The seven hooks, the menus, the six placements, how a position is resolved, visibility and the problems reported. |
| [Testing a UI plugin](plugins/testing.md) | Plugin author | The fake dashboard of `@vtherm/dashboard-sdk/testing`: register, resolve, render and check translations. |
| [WebSocket API](reference/websocket-api.md) | Contributor, Plugin author | The commands of the dashboard: the plugins to load, and the reading and writing of the configuration of Versatile Thermostat, with their errors. |
| [SDK reference](reference/sdk/index.md) | Plugin author | Generated reference of `@vtherm/dashboard-sdk`: types, `registerUiPlugin` and validation. Do not edit it, run `npm run docs:reference`. |
| [The add-ons feature](contributing/complements.md) | Contributor | The catalog on the server, the adapter of HACS and its fallback, the states, the restart, and the tested versions. |
| [Format of the catalog](reference/catalog-format.md) | Plugin author, Contributor | The fields of the catalog of add-ons, `hacs_category`, and how descriptions are sanitized. |
| [Continuous integration](contributing/ci.md) | Contributor | The workflows, the jobs, the coverage, the security analysis, the pinned actions and the settings of the repository to make on GitHub. |
| [Releasing](contributing/releasing.md) | Contributor | The steps to publish a version, the format and the branch of the tag, what the workflow does, and what to do when it fails. |
| [Publishing](contributing/publishing.md) | Contributor | The common version, the tag, what the release workflow does, the trusted publisher of npm and how to install a release. |
| [Architecture](contributing/architecture.md) | Contributor | The Python and TypeScript sides, the registry, the load order, the placement engine, the draft and the driving of the config flow. |
| [Development environment](contributing/development-environment.md) | Contributor | The dev container, the `VTHERM_*_DIR` variables that locate the projects read by the dashboard, running Home Assistant, the tests, the generated files, the preview and hassfest. |
| [Code conventions](contributing/code-conventions.md) | Contributor | English only, strict TypeScript and the list of JavaScript exceptions, the Python rules of Versatile Thermostat and the check command. |
| [Driving the config flow](contributing/config-flow-driver.md) | Contributor | How the configuration of Versatile Thermostat is validated and saved, the tabs and steps, the presets, the versions and the evolution planned. |
| [Setting insights](contributing/setting-insights.md) | Contributor | The rules of Versatile Thermostat ported for the estimation panels, from which file and function, the fixtures that check them, and what to do when `external-refs.txt` changes. |

## Rules for the documentation

- The pages are written in English. Code identifiers, API names, paths and commands are not translated.
- Code examples live in `docs/examples/` and are tested. A page shows them between the markers `<!-- example: path -->`
  and `<!-- /example -->`. Run `npm run docs:sync` to copy a changed example into its pages.
- `npm run docs:reference` generates the reference of the SDK in `docs/reference/sdk/` from the code, and `npm run check:reference` fails when it is out of date or when a public export has no documentation comment.
- `npm run check:docs` checks that every page is in this index with its audience, that every relative link and anchor
  leads somewhere, and that the examples of the pages equal their files.
