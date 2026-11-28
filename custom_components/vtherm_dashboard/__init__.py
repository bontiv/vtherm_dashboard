"""The Versatile Thermostat dashboard integration.

This module and `config_flow` must not import `vtherm_api` at the top level: when an older `vtherm_api` is still running after an
update, the import can fail, which would prevent Home Assistant from loading the config flow ("Invalid handler specified").
The modules that use `vtherm_api` are imported in the setup, once the version has been checked.
"""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryError
from homeassistant.loader import async_get_integration

from .compat import async_running_vtherm_api_version, create_restart_issue, delete_restart_issue, is_vtherm_api_compatible
from .const import DATA_DEV_SERVER, DOMAIN, MIN_VTHERM_API_VERSION

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:  # pylint: disable=unused-argument
    """Set up the dashboard from its configuration entry."""
    running_version = await async_running_vtherm_api_version(hass)
    if not is_vtherm_api_compatible(running_version):
        _LOGGER.error(
            "The dashboard needs vtherm_api %s or later but %s is running. Restart Home Assistant to load the new version",
            MIN_VTHERM_API_VERSION,
            running_version,
        )
        create_restart_issue(hass, str(running_version))
        raise ConfigEntryError(f"vtherm_api {MIN_VTHERM_API_VERSION} or later is required, {running_version} is running. Restart Home Assistant.")
    delete_restart_issue(hass)

    # pylint: disable=import-outside-toplevel  # these modules import vtherm_api, see the docstring of the module
    from .api_keepalive import register_api_keepalive
    from .complements import ComplementCatalog
    from .dev_server import read_dev_server_url
    from .native_plugins import register_native_plugins
    from .panel import async_register_panel
    from .websocket_api import async_register_commands

    hass.data.setdefault(DOMAIN, {})["catalog"] = ComplementCatalog(hass)
    async_register_commands(hass)
    dev_server = read_dev_server_url()
    hass.data[DOMAIN][DATA_DEV_SERVER] = dev_server
    if dev_server is not None:
        _LOGGER.warning("The frontend of the dashboard is loaded from the development server %s, not from the built files", dev_server)
    await async_register_panel(hass, dev_server)
    integration = await async_get_integration(hass, DOMAIN)
    register_native_plugins(hass, str(integration.version), dev_server)
    register_api_keepalive(hass)
    _LOGGER.info("The %s integration is set up", DOMAIN)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:  # pylint: disable=unused-argument
    """Unload the dashboard."""
    hass.data.get(DOMAIN, {}).pop("catalog", None)
    hass.data.get(DOMAIN, {}).pop(DATA_DEV_SERVER, None)
    if not is_vtherm_api_compatible(await async_running_vtherm_api_version(hass)):
        return True  # The setup stopped before registering anything.
    # pylint: disable=import-outside-toplevel  # these modules import vtherm_api, see the docstring of the module
    from .api_keepalive import unregister_api_keepalive
    from .native_plugins import unregister_native_plugins
    from .panel import remove_panel

    remove_panel(hass)
    unregister_native_plugins(hass)
    unregister_api_keepalive(hass)
    return True
