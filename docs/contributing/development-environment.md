# Development environment
Audience: contributors.

How to get the repository running: Home Assistant with Versatile Thermostat and the dashboard, the tests and the checks.

## With the dev container
Open the repository in VS Code and "Reopen in Container", or create a Codespace. The container has Python 3.14, Node.js (LTS) and the
GitHub CLI. Its `postCreateCommand` runs `.devcontainer/post-create.sh`, which:

1. fetches the repositories that the dashboard depends on, with `scripts/fetch-external.sh`: Versatile Thermostat, `vtherm_api` and HACS. A project whose variable is set (see [Where the other projects are](#where-the-other-projects-are)) is not fetched;
2. installs the Python dependencies (`requirements-dev.txt`) and `vtherm_api` in editable mode, then `numpy` and `scipy`, which
   Versatile Thermostat needs;
3. installs the packages that the browser of Home Assistant needs at its start (voice assistants, cameras): without them the page stays
   on "Loading data", because Home Assistant does not install them for a development instance;
4. runs `npm ci` for the workspaces, into `node_modules` and `frontend/node_modules`, which are volumes of the container (see
   [Why the tests are fast](#why-the-tests-are-fast)), then builds the SDK and installs it in the sample plugin, which is not a workspace (see below);
5. copies `.devcontainer/configuration.yaml` to `config/configuration.yaml`, the configuration of the development instance.

Versatile Thermostat and HACS are cloned at the commit of `external-refs.txt`, the one that the continuous integration tests against (`scripts/fetch-external.sh`).
To use another repository or reference, set `VERSATILE_THERMOSTAT_REPO`, `VERSATILE_THERMOSTAT_REF`, `HACS_REPO` or `HACS_REF` before the container is created.
`vtherm_api` must have the registry of UI plugins. Until it is published, set `VTHERM_API_REPO` and `VTHERM_API_REF` (a branch or a tag) the same
way. An existing folder is never changed, so to use another branch, check it out there.

## Where the other projects are
The dashboard reads the code of Versatile Thermostat, `vtherm_api` and HACS (tests, catalogs, Home Assistant). The folder of each one is given by an
environment variable. When the variable is not set, or is empty or only spaces, the default applies. The default folders are fetched by
`scripts/fetch-external.sh` and ignored by git.

| Variable | Meaning | Default |
| --- | --- | --- |
| `VTHERM_VERSATILE_THERMOSTAT_DIR` | The folder of the Versatile Thermostat repository, which the tests, the catalogs and Home Assistant use. | `external/versatile_thermostat` |
| `VTHERM_API_DIR` | The folder of the `vtherm_api` repository, installed in editable mode by `post-create.sh`. | `external/vtherm_api` |
| `VTHERM_HACS_DIR` | The folder of the HACS repository, which the contract tests of the HACS adapter run. | `external/hacs` |

A relative value is resolved against the root of the project, whatever the current directory. A value that names a missing folder, or a file, is an
error that names the variable and the path: there is no fallback to the default. `fetch-external.sh` never fetches, reads or changes the
folder of a variable that is set.

To set a variable in the dev container, add it to `containerEnv` in `.devcontainer/devcontainer.json`, with an absolute path:

```json
"containerEnv": {
  "VTHERM_VERSATILE_THERMOSTAT_DIR": "/workspaces/versatile_thermostat"
}
```

To use a copy that is on your computer, mount it into the container and give the path of the mount to the variable. Both entries go together in
`devcontainer.json` (the source is the folder on the host):

```json
"mounts": [
  "type=bind,source=/path/to/versatile_thermostat,target=/mnt/versatile_thermostat"
],
"containerEnv": {
  "VTHERM_VERSATILE_THERMOSTAT_DIR": "/mnt/versatile_thermostat"
}
```

Do not commit a path of your computer: keep it in your own copy of `devcontainer.json`. Set the variables before the container is created, then rebuild it.

`npm run check:external` prints one line for each project, with the variable, the absolute folder that it resolves to, and `exists` or `missing`.
It changes nothing and exits with 1 when a folder is missing, so use it to check a path before you run the tests.

## Without the container
You need Python 3.14, Node.js 24 or later, git and bash:

```
git clone https://github.com/bontiv/vtherm_dashboard.git && cd vtherm_dashboard
bash .devcontainer/post-create.sh   # needs a virtual environment: python3.14 -m venv .venv && . .venv/bin/activate
```

The script uses `python -m pip`, so activate the virtual environment first. Later shells need `. .venv/bin/activate`.

## Run Home Assistant
The integration loads the frontend in one of two ways:

| Way | Start | After a change of the TypeScript code |
| --- | --- | --- |
| Development server (to work on the frontend, the native plugins or the SDK) | `npm run dev`, then `bash .devcontainer/start-ha.sh --dev-frontend` | Reload the page. |
| Built files (what a release contains) | `npm run build`, then `bash .devcontainer/start-ha.sh` | `npm run build` again, then reload the page. |

1. Start the frontend:
   - **Development server**: `npm run dev` in its own terminal. Vite serves the TypeScript sources of the panel, of the native
     plugins and of the SDK on port 5198, compiled when the browser asks for them. Nothing is written into `www/`.
   - **Built files**: `npm run build`. It writes the modules into `custom_components/vtherm_dashboard/www/`, which the integration
     refuses to start without ("The frontend module … is missing").
2. Start Home Assistant: `bash .devcontainer/start-ha.sh`, with `--dev-frontend` for the development server. The script links Versatile
   Thermostat and the dashboard into `config/custom_components/` and runs `hass --config config --debug` on port 8123.
3. At the first start, create the user in the browser (onboarding). To skip the login screen on your computer, add `trusted_networks` with
   `allow_bypass_login` to `auth_providers` in `config/configuration.yaml`, see the documentation of Home Assistant.
4. **Settings > Devices & services > Add integration**: add "Versatile Thermostat" (create a thermostat or the central
   configuration), then "VTherm Dashboard". "Versatile Thermostat" appears in the side menu.

A change of the Python code still needs a restart of Home Assistant. A restart asked from Home Assistant (Settings, the service
`homeassistant.restart`, or the restart of the add-ons in the dashboard) works: Home Assistant exits with the code 100 and `start-ha.sh`
starts it again.

### The development server of the frontend
`--dev-frontend` sets the environment variable `VTHERM_DASHBOARD_DEV_SERVER` of Home Assistant to `http://localhost:5198`. With it,
the integration:

- loads the module of the panel from `<server>/src/index.ts` instead of the built files;
- registers each native plugin with `<server>/src/native/plugins/<id>.ts`, with the same version constraint and dependencies. The
  list of plugins accepts this address for the native plugins only: a plugin of another integration must still give a path of Home
  Assistant;
- starts without `www/`, and does not serve it;
- writes a warning with the address of the server in the log, at each start.

The variable is read when the integration is set up: to switch between the two ways, restart Home Assistant. A value that is not an
absolute `http` or `https` URL is refused with an error in the log, and the integration uses the built files. Without the variable,
nothing changes. Plugins of other integrations and the entries of the [development mode of plugins](../plugins/dev-mode.md) keep their
addresses.

The value is the address of the server **as the browser sees it**, since the browser imports the modules:

- In the dev container, VS Code forwards port 5198 as it forwards 8123, so `http://localhost:5198` works on your computer. Vite listens
  on `127.0.0.1`, where the forwarding connects (`localhost` is only `::1` in the container).
- In a Codespace or from another computer, set the variable yourself to the forwarded address before starting:
  `VTHERM_DASHBOARD_DEV_SERVER=https://<name>-5198.app.github.dev bash .devcontainer/start-ha.sh --dev-frontend`, and run
  `npm run dev` with the same variable, so that Vite writes this address in its absolute URLs. Make the forwarded port public or
  reachable by your browser.
- A Home Assistant opened in `https` cannot import modules from an `http` server (mixed content): open Home Assistant in `http` on your
  computer, or use an `https` address for the server.

When a source changes, the server reloads the page by itself: the entry module connects the page to Vite (`import.meta.hot`, removed
by the build). If the page does not reload, for example because the WebSocket of Vite cannot pass through the forwarding, reload it by
hand. If the server is stopped, the panel does not load and the rest of Home Assistant works: start the server and reload the page.

Vite polls the sources for changes (every 300 ms) instead of waiting for file events: a dev container on a Windows host mounts the
repository through 9p, which sends none, and Vite would keep serving the old modules. A change of `vite.config.ts` needs a restart of
`npm run dev`.

The modules served one by one are not the bundles of the build. Before a pull request, check the built files once with `npm run build`
and a Home Assistant started without `--dev-frontend`. To keep the built files up to date while you work, without the server,
`npx vite build --watch` in `frontend/` rebuilds them at each change; reload the page afterwards.

`config/configuration.yaml` has a test switch (`input_boolean.dev_switch`) and a test number so that you can create thermostats without
hardware. The file is yours: git ignores `config/`.

Logs: `config/home-assistant.log`, with debug for `custom_components.vtherm_dashboard` and `vtherm_api`.

### A simulated week of history
The panels of estimation of the native tabs (the TPI replay, the replay of the open window detection, the silences of the sensors)
read the history of the recorder, and a development instance has almost none. `scripts/dev/seed_history.py` writes one simulated week
for one thermostat into the database of the recorder, `config/home-assistant_v2.db`:

- the room temperature sensor, which follows a simple thermal model (losses to the outdoor, a radiator with some inertia), reported
  every 3 to 7 minutes;
- the outdoor temperature sensor, with a daily cycle and a drift over the week, reported every 10 to 15 minutes;
- the climate entity: state `heat`, target temperature (attribute `temperature`) at 20 °C from 6:30 (8:00 on weekends) to 22:30 and
  17 °C at night, `current_temperature`, `hvac_action`, `power_percent`, and the other attributes it last recorded;
- the heating share sensor of Versatile Thermostat (`sensor.<name>_power_percent`, in %) and its slope sensor
  (`sensor.<name>_temperature_slope`, in °C/hour);
- two aerations (the room loses about 6 °C/hour for 15 and 12 minutes) and a silence of 70 minutes of the room sensor (no state at
  all). They are placed from the end of the period, so that the last 24 hours always have one aeration and the silence: an aeration at
  end − 4 days 2 hours, the silence at end − 14 hours, an aeration at end − 7 hours. The script prints their times.

**The data does not validate the calculations.** The "recorded" heating share is not recorded by Versatile Thermostat: the script
computes it with the TPI formula, the same one as the estimation of the dashboard (`coef_int × (target − room) + coef_ext × (target −
outdoor)`, clamped to 0..1, at the start of each cycle, without the thresholds and the caps of Versatile Thermostat), and the slope
with the formula of Versatile Thermostat. The week serves to develop the panels and to take screenshots; the calculations are checked by
the tests (`npm test`, `pytest`), not by this data.

| Argument | Meaning |
| --- | --- |
| `--climate` | The climate entity of the thermostat (required), for example `climate.living_room`. |
| `--room-sensor`, `--outdoor-sensor` | The room and outdoor temperature sensors of the thermostat (required). |
| `--power-sensor`, `--slope-sensor` | The heating share and slope sensors. By default `sensor.<name>_power_percent` and `sensor.<name>_temperature_slope`, `<name>` being the name of the climate entity without `climate.`. `--no-slope` leaves the slope sensor out. |
| `--db` | The database. By default `config/home-assistant_v2.db`. |
| `--end` | The end of the period, ISO 8601 (`2026-11-18T09:00`). By default now. Without an offset, in the time zone of Home Assistant. |
| `--days` | The length of the period, 7 by default. |
| `--time-zone` | The time zone of the schedule. By default the one of Home Assistant (`config/.storage/core.config`). |
| `--coef-int`, `--coef-ext`, `--cycle-min` | The TPI coefficients and the cycle of the simulated share: 0.6, 0.01 and 5 minutes by default. |
| `--seed` | The seed of the random noise: the same arguments give the same week. |
| `--dry-run` | Only read the database and print what would be written and replaced. Works while Home Assistant runs. |

The rows inside the period are **replaced**: the rows of these entities between the start and the end of the period are deleted (with
the attributes that no other row uses), then the simulated rows are written. The rows before and after the period are kept, and the
chain of previous states (`old_state_id`) is joined to them. Other entities are not touched. The rows are written as the recorder of
Home Assistant 2026.10 writes them (schema version 53: `states_meta`, `state_attributes` shared by hash, the timestamps
`last_updated_ts`, `last_changed_ts` and `last_reported_ts`, the chain `old_state_id`, a context per row). The script warns when the
database has another schema version, and refuses a database without the columns it writes.

Home Assistant must be stopped, since it keeps its own view of the database while it runs. The script takes the lock that Home
Assistant takes at its start (`config/.ha_run.lock`, next to the database): it refuses to write, without changing anything, while
Home Assistant holds it, and Home Assistant cannot start while the script holds it. There is no option to force it. In the container:

```
# 1. Stop Home Assistant: Ctrl+C in the terminal of start-ha.sh, and wait for its prompt.
python scripts/dev/seed_history.py --climate climate.living_room --room-sensor sensor.living_room_temperature \
    --outdoor-sensor sensor.outdoor_temperature --dry-run    # optional: check the entities and the counts
python scripts/dev/seed_history.py --climate climate.living_room --room-sensor sensor.living_room_temperature \
    --outdoor-sensor sensor.outdoor_temperature
# 2. Start Home Assistant again, with the same options as before.
bash .devcontainer/start-ha.sh --dev-frontend
```

Run it again later to move the week to the current time: the rows of the previous run inside the new period are replaced. To keep a
copy of the database, copy `config/home-assistant_v2.db` while Home Assistant is stopped. The script needs Linux (`fcntl`): run it in
the container, with any Python 3.

## The tests
| Command | What it runs |
| --- | --- |
| `pytest -n auto` | The Python tests, in parallel: the server, the config flow driver (with the real Versatile Thermostat of `VTHERM_VERSATILE_THERMOSTAT_DIR`), the registry, the catalog of add-ons. `pytest` alone runs them one after the other, which is better for one file or one test. |
| `pytest -n auto -m "not vtherm"` | The Python tests without the ones that run the real Versatile Thermostat (marker `vtherm`), for a quick loop while you work. Run the whole suite before a commit: the continuous integration always does. |
| `npm test` | The TypeScript tests (Vitest): the SDK, the frontend, the scripts and the examples. The sample plugin has its own tests: see below. The checks of the documentation (`frontend/test/docs.test.ts`) are skipped. |
| `npm run test:docs` | The checks of the documentation: each page that describes the plugins, the theme and the dashboard says what the code does. They are long, so they run apart, in the Vitest mode `docs`. |
| `npm run check` | Everything that is not a test: types, lint, no JavaScript, documentation, SDK reference, generated catalogs, Python format and pylint. |

Run all of them before a pull request. The tests that need the real Versatile Thermostat are skipped when the folder of `VTHERM_VERSATILE_THERMOSTAT_DIR`
is missing. A test file of the frontend runs in `happy-dom` (a comment `// @vitest-environment happy-dom` on its first line), or in `jsdom` when the
code needs a complete DOM, as the sanitizer of the add-ons does.

The sample plugin (`examples/vtherm_sample_plugin/ui`) is not a workspace of the root `package.json`, so `npm install`, `npm run build` and `npm test` at the root leave it out. It reads the SDK like the plugin of an author. Give it the SDK of your working copy, then build and test it from its folder:

```
npm run build -w packages/sdk
npm pack -w packages/sdk --ignore-scripts --pack-destination /tmp
cd examples/vtherm_sample_plugin/ui
npm install --no-save --ignore-scripts /tmp/vtherm-dashboard-sdk-*.tgz
npm run build && npm test
```

It uses Vite, Vitest and TypeScript from the root `node_modules`, so run `npm install` at the root first. In the continuous integration, the job `sample-plugin` does the same and only warns when it fails.

Useful variants: `npx vitest run frontend/test/panel.test.ts`, `pytest tests/test_plugin_list.py -k cycle`, `scripts/check-python.sh path.py`.

### Why the tests are fast
The dev container reads the sources from the folder of the host. On Windows, that mount is slow for many small files: reading the
thousands of files of `node_modules` through it made each file of Vitest tests start in about 16 s. So:

- `node_modules` and `frontend/node_modules` are volumes of the container (`mounts` of `.devcontainer/devcontainer.json`); the
  sources stay on the host. After this change, rebuild the container ("Rebuild Container"): `post-create.sh` gives the volumes to
  the user of the container and runs `npm ci`. The old `node_modules` folders of the host are hidden in the container: you can delete
  them on the host.
- The plugin `pytest-homeassistant` turns on the debug mode of the event loop in every test: every future then
  records the stack that created it, and reads each file of the stack. `tests/conftest.py` keeps the debug mode in the continuous
  integration (variable `CI`) and when `VTHERM_ASYNCIO_DEBUG=1`, and turns it off otherwise. Set the variable to see what the debug
  mode reports (slow callbacks, coroutines never awaited): `VTHERM_ASYNCIO_DEBUG=1 pytest`.
- A test that runs the real Versatile Thermostat gets the marker `vtherm` from `tests/conftest.py`, through the fixture `real_vtherm`
  or the mark `requires_vtherm`: nothing to declare in the file of the test. The orchestration of the command `save_config` (the tabs,
  then the presets) is tested with a fake `ConfigWriter` in `tests/test_save_command.py`; what Versatile Thermostat does stays tested
  with the real one.

### Generated files
| Command | Updates |
| --- | --- |
| `npm run docs:sync` | The code of the examples copied into the pages of `docs/`. |
| `npm run docs:reference` | `docs/reference/sdk/`, from the types of the SDK. |
| `npm run catalogs:generate` | The catalogs of the native tabs, from the translations of Versatile Thermostat. |
| `pytest tests/test_schema_drift.py --update-schemas` | `shared/vtherm-config-schemas.json`. |
| `pytest tests/test_hacs_contract.py --update-hacs-answers` | `shared/hacs-answers.json`, the answers of the real HACS that the adapter is tested against. |
| `pytest tests/test_marketplace_contract.py --update-marketplace-answers` | `shared/marketplace-answers.json`, the answers of the real Marketplace of Home Assistant that the adapter is tested against. |
| `UPDATE_NATIVE_DOCS=1 npx vitest run frontend/test/native-docs.test.ts` | The table of the contributions in [Native UI plugins](../plugins/native-plugins.md). |

### The preview
`npm run preview -w frontend` serves the panel on port 5199 with a fake Home Assistant, without Home Assistant (the development
server above, on port 5198, serves it to a real Home Assistant). The parameters of the
address are `theme` (the themes of `frontend/preview/themes.ts`), `path`, `drawer` and `empty`. `frontend/preview/frame.html?width=420&query=...`
shows a narrow screen. It is how the screenshots of the three themes are made.

### Checking a phone screen
The tests run without layout (happy-dom), so the sizes on a phone are checked in a browser. With the development server and Home
Assistant started with `--dev-frontend`, open the dashboard at the width of a phone (360 or 375 px, with the device mode of the browser),
then run in the console of the page:

```
await (await import("http://localhost:5198/preview/mobile-check.ts")).checkMobile()
```

`frontend/preview/mobile-check.ts` opens each native page in turn and returns, for each one, the elements wider than the screen and the
controls whose touch target is lower than 44 px. Every list must be empty. Pass other paths to check other pages, for example the
configuration of a thermostat: `checkMobile(["core.top.thermostats/climate.salon/core_tpi.tab.main"])`.

### hassfest
```
docker run --rm --platform linux/amd64 -v "$PWD":/github/workspace ghcr.io/home-assistant/hassfest
```
validates the manifest and the structure of the integration, as the continuous integration does.

## Where things are
See [Architecture](architecture.md). The conventions are in [Code conventions](code-conventions.md).
