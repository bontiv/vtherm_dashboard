# Loading and dependencies

How the dashboard decides which UI plugins to load, in which order, and what it shows when a UI plugin does not load.
Audience: plugin authors. The terms are defined in the [terminology](plugin-development.md#terminology).

## Who does what

`vtherm_api` stores the declarations of the plugins and sorts nothing. Each time the dashboard opens, the dashboard
integration (on the server) builds the list: it validates every plugin, checks its `dashboard_version`, resolves its
dependencies and computes the load order. The browser then imports the modules of the ready plugins one after the other,
in that order. The list is described in the [WebSocket API](../reference/websocket-api.md).

A UI plugin that registers after the dashboard was opened is loaded the next time the page is loaded.

## Load dependencies

The Python code of your integration (the plugin package) calls `register_ui_plugin` (see the
[Python API](python-api.md)). It can pass three optional lists. Each list holds identifiers of other UI plugins, not of integrations or add-ons:

| Field | Meaning | If the other plugin is absent |
| --- | --- | --- |
| `requires` | The plugin needs the other one. It is loaded after it, and only if it loaded. | The plugin is not loaded, its status is `missing_dependency`. |
| `load_after` | Load after the other plugin when it is present. | Ignored. |
| `load_before` | Load before the other plugin when it is present. | Ignored. |

The order is only about the moment the modules run. The place of a contribution in a menu is a separate thing, declared
by its placement.

<!-- example: docs/examples/python/load_order.py -->
```python
"""Declare the load order of UI plugins."""

from homeassistant.core import HomeAssistant
from vtherm_api import VThermAPI


def register_plugins(hass: HomeAssistant) -> None:
    """Register four plugins that depend on each other."""
    api = VThermAPI.get_vtherm_api(hass)
    # "base" has no dependency.
    api.register_ui_plugin("base", "/base/ui.js", ">=0.1,<1.0")
    # "extra" cannot work without "base": it is not loaded when "base" is absent or fails.
    api.register_ui_plugin("extra", "/extra/ui.js", ">=0.1,<1.0", requires=["base"])
    # "themes" prefers to load after "extra", and works without it.
    api.register_ui_plugin("themes", "/themes/ui.js", ">=0.1,<1.0", load_after=["extra"])
    # "early" asks to load before "base" when "base" is present.
    api.register_ui_plugin("early", "/early/ui.js", ">=0.1,<1.0", load_before=["base"])
```
<!-- /example -->

These four plugins load in this order: `early`, `base`, `extra`, `themes`.

Rules of the order:

- The plugin `core` of the dashboard is always loaded first. A plugin cannot ask to load before it.
- Two plugins with no constraint between them are loaded in the order of their identifiers, so the order is the same on every load.
- A plugin that requires another one fails if the other one fails to import. Its status is then `missing_dependency`
  and it is not imported. The same goes for the plugins that require it.

## UI plugin status

The plugin status page of the dashboard (in the Configuration menu) lists every plugin with its state, the cause and its source.

| State | Cause | What to do |
| --- | --- | --- |
| `loaded` | The module was imported and the plugin registered its contributions. | Nothing. |
| `ready` | The checks of the server passed and the module is waiting to be imported. It is shown for a short time. | Nothing. |
| `missing_dependency` | A plugin of `requires` is absent, was refused or failed. The status names the missing plugins. | Install the missing plugin, or fix it. |
| `dashboard_incompatible` | The dashboard version does not satisfy `dashboard_version`. The module is not downloaded. The status gives the constraint, the dashboard version and whether the dashboard is too old (`too_old`) or too recent (`too_new`). | Read [version constraints](version-constraints.md). |
| `cycle` | The load dependencies form a loop, for example two plugins that `load_after` each other. The status lists the plugins of the loop. The other plugins still load. | Remove one of the links. |
| `invalid` | The declaration is not valid. The cause is `reserved_id` (the identifier is `core` or starts with `core_`), `invalid_url` (`js_url` is not a path of this instance that starts with `/`), `invalid_constraint` (the status quotes the faulty comparator) or `missing_constraint` (a development entry for an unknown plugin has no `dashboard_version`). | Fix the declaration. |
| `failed` | The module was downloaded but could not be used. The cause is `import_failed` (the file is missing, or the module raised an error: the message is shown) or `not_registered` (the module ran but did not call `registerUiPlugin` for the plugin). | Open the browser console, then fix the module. |

A failing plugin never prevents the dashboard or the other plugins from loading.

The source of a plugin is `installed` (registered by an integration), `native` (a plugin of the dashboard) or `development`
(a development entry of the browser, with the URL that was used).
