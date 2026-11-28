"""WebSocket commands of the dashboard."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.loader import async_get_integration
from vtherm_api import VThermAPI

from .const import DATA_DEV_SERVER, DOMAIN, SUPPORTED_VTHERM_MAJOR
from .config_flow_driver import FlowConfigWriter, SaveResult
from .complements import (
    ERROR_NOT_FOUND,
    ERROR_README_UNAVAILABLE,
    ERROR_UNAVAILABLE as ERROR_CATALOG_UNAVAILABLE,
    CatalogUnavailableError,
    ComplementNotFoundError,
    ReadmeUnavailableError,
    async_complement_readme,
    async_complements,
)
from .plugin_list import build_plugin_list
from .presets import async_set_presets, read_presets
from .vtherm_config import SUPPORTED_CONFIG_VERSION, ConfigNotFoundError, async_vtherm_major, central_entry, list_thermostats, read_central_config, read_config

WS_GET_UI_PLUGINS = f"{DOMAIN}/get_ui_plugins"
"""The type of the command that returns the UI plugins to load."""


WS_GET_THERMOSTATS = f"{DOMAIN}/get_thermostats"
"""The type of the command that lists the thermostats."""

WS_GET_CONFIG = f"{DOMAIN}/get_config"
"""The type of the command that reads the configuration of an entry."""

WS_GET_CENTRAL_CONFIG = f"{DOMAIN}/get_central_config"
"""The type of the command that reads the central configuration."""

WS_GET_PRESETS = f"{DOMAIN}/get_presets"
"""The type of the command that reads the preset temperatures of an entry."""

WS_SAVE_CONFIG = f"{DOMAIN}/save_config"
"""The type of the command that saves the draft of a configuration."""

WS_CREATE_CONFIG = f"{DOMAIN}/create_config"
"""The type of the command that creates a thermostat or the central configuration."""

WS_GET_HUMIDITY_SUGGESTION = f"{DOMAIN}/get_humidity_suggestion"
"""The type of the command that suggests a humidity sensor for a temperature sensor."""

WS_GET_COMPLEMENTS = f"{DOMAIN}/get_complements"
"""The type of the command that returns the catalog of add-ons."""

WS_GET_COMPLEMENT_README = f"{DOMAIN}/get_complement_readme"
"""The type of the command that returns the README of an add-on of the catalog."""
CHANGES_SCHEMA = vol.Schema({str: dict})
PRESETS_SCHEMA = vol.Schema({str: vol.Coerce(float)})


@callback
def async_register_commands(hass: HomeAssistant) -> None:
    """Register the WebSocket commands of the dashboard."""
    websocket_api.async_register_command(hass, ws_get_ui_plugins)
    websocket_api.async_register_command(hass, ws_get_thermostats)
    websocket_api.async_register_command(hass, ws_get_config)
    websocket_api.async_register_command(hass, ws_get_central_config)
    websocket_api.async_register_command(hass, ws_get_presets)
    websocket_api.async_register_command(hass, ws_save_config)
    websocket_api.async_register_command(hass, ws_create_config)
    websocket_api.async_register_command(hass, ws_get_humidity_suggestion)
    websocket_api.async_register_command(hass, ws_get_complements)
    websocket_api.async_register_command(hass, ws_get_complement_readme)


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_GET_UI_PLUGINS,
        vol.Optional("dev_plugins"): [dict],
    }
)
@websocket_api.async_response
async def ws_get_ui_plugins(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Return the UI plugins, validated and sorted in load order, with their state.

    Any authenticated user can read the list. Only an administrator can join development entries.
    """
    dev_plugins = msg.get("dev_plugins")
    if dev_plugins and not connection.user.is_admin:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Development plugins are reserved for administrators")
        return
    dashboard_version = (await async_get_integration(hass, DOMAIN)).version
    registered = VThermAPI.get_vtherm_api(hass).get_ui_plugins()
    plugins = build_plugin_list(registered, str(dashboard_version), dev_plugins, hass.data.get(DOMAIN, {}).get(DATA_DEV_SERVER))
    connection.send_result(msg["id"], {"dashboard_version": str(dashboard_version), "plugins": [plugin.as_dict() for plugin in plugins]})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): WS_GET_THERMOSTATS})
@websocket_api.async_response
async def ws_get_thermostats(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """List the thermostats of Versatile Thermostat, and tell whether a central configuration exists."""
    central = central_entry(hass)
    vtherm_major = await async_vtherm_major(hass)
    connection.send_result(
        msg["id"],
        {
            "thermostats": [summary.as_dict() for summary in list_thermostats(hass, vtherm_major)],
            "has_central_config": central is not None,
            "central_config_id": None if central is None else central.entry_id,
            "supported_config_version": list(SUPPORTED_CONFIG_VERSION),
            "supported_vtherm_major": SUPPORTED_VTHERM_MAJOR,
        },
    )


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): WS_GET_CONFIG, vol.Required("entry_id"): str})
@websocket_api.async_response
async def ws_get_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Read the configuration of a thermostat, or of the central configuration, by the identifier of its entry."""
    try:
        connection.send_result(msg["id"], read_config(hass, msg["entry_id"], await async_vtherm_major(hass)).as_dict())
    except ConfigNotFoundError:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "No Versatile Thermostat configuration has this identifier")


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): WS_GET_CENTRAL_CONFIG})
@websocket_api.async_response
async def ws_get_central_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Read the central configuration. The result is null when there is none."""
    central = read_central_config(hass, await async_vtherm_major(hass))
    connection.send_result(msg["id"], None if central is None else central.as_dict())


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): WS_GET_PRESETS, vol.Required("entry_id"): str})
@websocket_api.async_response
async def ws_get_presets(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Read the preset temperatures of a thermostat or of the central configuration. The list is empty for a thermostat that uses the central presets."""
    try:
        read_config(hass, msg["entry_id"], await async_vtherm_major(hass))
    except ConfigNotFoundError:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "No Versatile Thermostat configuration has this identifier")
        return
    connection.send_result(msg["id"], {"presets": [preset.as_dict() for preset in read_presets(hass, msg["entry_id"])]})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_SAVE_CONFIG,
        vol.Required("entry_id"): str,
        vol.Optional("changes", default={}): CHANGES_SCHEMA,
        vol.Optional("presets", default={}): PRESETS_SCHEMA,
    }
)
@websocket_api.async_response
async def ws_save_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Save the draft of a configuration: the tabs through the flow of Versatile Thermostat, then the preset temperatures.

    The tabs are saved all together or not at all. The presets are applied only when the tabs were saved, one by one: a preset that
    fails keeps the saved tabs and the other presets.
    """
    result = await FlowConfigWriter(hass).async_update(msg["entry_id"], msg["changes"])
    preset_errors = await async_set_presets(hass, msg["entry_id"], msg["presets"]) if result.ok and msg["presets"] else []
    connection.send_result(
        msg["id"], {**result.as_dict(), "config_saved": result.ok, "preset_errors": [error.as_dict() for error in preset_errors], "ok": result.ok and not preset_errors}
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_CREATE_CONFIG,
        vol.Required("thermostat_type"): str,
        vol.Optional("changes", default={}): CHANGES_SCHEMA,
    }
)
@websocket_api.async_response
async def ws_create_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Create a thermostat or the central configuration through the flow of Versatile Thermostat."""
    result: SaveResult = await FlowConfigWriter(hass).async_create(msg["thermostat_type"], msg["changes"])
    connection.send_result(msg["id"], result.as_dict())


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): WS_GET_HUMIDITY_SUGGESTION, vol.Required("temperature_sensor"): str})
@callback
def ws_get_humidity_suggestion(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Suggest the humidity sensor that Versatile Thermostat detects for a temperature sensor, as its own config flow does.

    The result is `{"entity_id": null}` when there is no candidate, or when the version of Versatile Thermostat has no detection.
    """
    try:
        # pylint: disable-next=import-outside-toplevel,import-error,no-name-in-module
        from custom_components.versatile_thermostat.humidity import find_humidity_sensor_candidates
    except ImportError:
        connection.send_result(msg["id"], {"entity_id": None})
        return
    candidates = find_humidity_sensor_candidates(hass, msg["temperature_sensor"])
    connection.send_result(msg["id"], {"entity_id": candidates[0] if candidates else None})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): WS_GET_COMPLEMENTS, vol.Optional("refresh", default=False): bool})
@websocket_api.async_response
async def ws_get_complements(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Return the add-ons of the catalog, each with what Home Assistant knows about its integration."""
    try:
        connection.send_result(msg["id"], await async_complements(hass, msg["refresh"]))
    except CatalogUnavailableError as err:
        connection.send_error(msg["id"], ERROR_CATALOG_UNAVAILABLE, str(err))


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): WS_GET_COMPLEMENT_README, vol.Required("complement_id"): str, vol.Required("language"): str})
@websocket_api.async_response
async def ws_get_complement_readme(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Return the README of an add-on of the catalog, with its links made absolute.

    Only the repository of an add-on of the catalog is read. An identifier that is not in the catalog, or an add-on without a GitHub
    repository, is `not_found`, and GitHub is not contacted. The identifier of the add-on is `complement_id`: `id` is the number of the
    message in the WebSocket protocol of Home Assistant.
    """
    try:
        connection.send_result(msg["id"], await async_complement_readme(hass, msg["complement_id"], msg["language"]))
    except (ComplementNotFoundError, CatalogUnavailableError) as err:
        connection.send_error(msg["id"], ERROR_NOT_FOUND, str(err))
    except ReadmeUnavailableError as err:
        connection.send_error(msg["id"], ERROR_README_UNAVAILABLE, str(err))
