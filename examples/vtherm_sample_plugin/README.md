# Sample UI plugin
A complete UI plugin for the Versatile Thermostat dashboard. [Developing a UI plugin](../../docs/plugins/plugin-development.md) walks
through it, and every code block of that guide comes from these files.

| Path | What it is |
| --- | --- |
| `custom_components/vtherm_sample_plugin/` | The Home Assistant integration: it serves the built modules and declares the two plugins in Python. |
| `ui/src/` | The TypeScript of the plugins: elements, translations, and the two modules. |
| `ui/test/` | The tests, with the fake dashboard of the SDK. |
| `ui/vite.config.ts`, `ui/rollup.config.ts` | The build and the development server, with CORS. |

The plugin `vtherm_sample` adds a section after the TPI section of every thermostat, replaces the section "Sync device internal
temperature", adds a widget to the overview of a thermostat, and removes a widget that the plugin `vtherm_sample_extras` adds.

In this repository, the plugin is not a workspace of the root `package.json`: `npm run build` at the root does not build it. Install the SDK of the working copy in `ui/`, then run `npm run build` and `npm test` there: [the development environment](../../docs/contributing/development-environment.md#the-tests) gives the commands. The build writes into `custom_components/vtherm_sample_plugin/www/`.
