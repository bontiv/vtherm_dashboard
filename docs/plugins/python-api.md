# Python API for UI plugins

A UI plugin is a unit that adds screens to the Versatile Thermostat dashboard. It declares itself
in Python, through the `vtherm_api` package, and ships a JavaScript module that the dashboard loads.
This page describes the Python declaration, which runs in the integration of your plugin package. Audience: plugin authors. The terms are defined in the [terminology](plugin-development.md#terminology).

The registry lives in `vtherm_api` and is **passive**: it checks the structure of a declaration and the uniqueness
of its identifier, and keeps the declarations in registration order. It does not sort the plugins and does not
interpret their dependencies, URL or version constraint. The dashboard does that each time it builds the list of
plugins to load, and shows the outcome of each plugin in its plugin status page.

## Register a plugin

Get the API instance of the Home Assistant instance, then call `register_ui_plugin` when your integration is set up.
Call `unregister_ui_plugin` when it is unloaded.

<!-- example: docs/examples/python/register_ui_plugin.py -->
```python
"""Register a UI plugin in the Versatile Thermostat dashboard."""

from homeassistant.core import HomeAssistant
from vtherm_api import VThermAPI

PLUGIN_ID = "my_plugin"
JS_URL = "/my_plugin_static/my-plugin.js"


def register_my_ui_plugin(hass: HomeAssistant) -> None:
    """Declare the UI plugin when the integration is set up."""
    api = VThermAPI.get_vtherm_api(hass)
    api.register_ui_plugin(
        PLUGIN_ID,
        JS_URL,
        ">=1.0,<2.0",
        requires=["core"],
        load_after=["core_tpi"],
    )


def unregister_my_ui_plugin(hass: HomeAssistant) -> None:
    """Withdraw the UI plugin when the integration is unloaded."""
    VThermAPI.get_vtherm_api(hass).unregister_ui_plugin(PLUGIN_ID)
```
<!-- /example -->

Serve the JavaScript file yourself, with a static path of your integration, before you register the plugin.

## `register_ui_plugin`

```python
register_ui_plugin(plugin_id, js_url, dashboard_version, *, requires=None, load_after=None, load_before=None)
```

| Parameter | Type | Required | Default | Example | Meaning |
| --- | --- | --- | --- | --- | --- |
| `plugin_id` | `str` | yes | none | `"my_plugin"` | Unique identifier of the UI plugin. Surrounding spaces are removed. The identifiers `core` and `core_*` are reserved for the native UI plugins of the dashboard. |
| `js_url` | `str` | yes | none | `"/my_plugin_static/my-plugin.js"` | URL of the JavaScript module. It must be a path of your Home Assistant instance that starts with `/`. |
| `dashboard_version` | `str` | yes | none | `">=1.0,<2.0"` | Versions of the dashboard that the plugin supports. Comparators `>=`, `>`, `<=`, `<` and `==` separated by commas, all of which must be satisfied. `1.0` means `1.0.0`. |
| `requires` | `list[str]` | no | no dependency | `["core"]` | Plugins that must be present. If one is missing or fails, your plugin is not loaded. |
| `load_after` | `list[str]` | no | no dependency | `["core_tpi"]` | Plugins to load before yours when they are present. An absent plugin is ignored. |
| `load_before` | `list[str]` | no | no dependency | `["other_plugin"]` | Plugins to load after yours when they are present. An absent plugin is ignored. |

## `unregister_ui_plugin`

```python
unregister_ui_plugin(plugin_id)
```

Removes the plugin. An unknown identifier is ignored and nothing changes.

## `get_ui_plugins`

```python
get_ui_plugins() -> list[UiPlugin]
```

Returns the registered plugins in registration order, or an empty list. Each `UiPlugin` has the fields `id`, `js_url`,
`dashboard_version`, `requires`, `load_after` and `load_before` (tuples). Thermostat plugins that are not UI plugins
are not listed. The order is not a load order: a plugin that requires another one can come first.

## Errors

`register_ui_plugin` raises `ValueError` in these cases. Nothing is registered.

| Cause | Message |
| --- | --- |
| `plugin_id`, `js_url` or `dashboard_version` is missing, not a string, or empty | `The UI plugin field '<name>' is required and must be a non-empty string` |
| `requires`, `load_after` or `load_before` is not a list of non-empty strings | `The UI plugin field '<name>' must be a list of plugin identifiers` or `... must only contain non-empty strings, got <value>` |
| Another declaration with the same identifier is already registered (the existing one is kept) | `A UI plugin with the identifier '<id>' is already registered` |

Registering again a declaration equal to the registered one is not an error and changes nothing: Home Assistant can run
`async_setup_entry` again (a retry of the setup, one call per configuration entry) without unloading the entry first. The plugin
keeps its place in the order of registration.

## What the dashboard checks later

These checks are not done by `register_ui_plugin`. A plugin that fails one of them is registered but not loaded,
and its plugin status shows the cause.

| Plugin status | Cause |
| --- | --- |
| reserved identifier | The identifier is `core` or starts with `core_` and does not belong to a native plugin. |
| invalid URL | `js_url` is not a path that starts with `/`, for example `https://other-host/plugin.js`. |
| invalid constraint | `dashboard_version` uses an unsupported operator (`^1.0`, `~1.0`) or a version that is not a semantic version. The status quotes the faulty comparator. |
| dashboard incompatible | The dashboard version is too old or too recent for `dashboard_version`. |
| missing dependency | A plugin of `requires` is absent, incompatible or failed. |
| cycle | The load dependencies form a loop. |
