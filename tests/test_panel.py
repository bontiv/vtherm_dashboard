"""Tests for the panel of the dashboard."""

from __future__ import annotations

import pytest
from homeassistant.components import frontend
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from pytest_homeassistant.common import MockConfigEntry, MockModule, mock_integration

from custom_components.vtherm_dashboard import panel as panel_module
from custom_components.vtherm_dashboard.const import DEV_SERVER_ENV, DOMAIN, FRONTEND_MODULE, PANEL_URL_PATH, STATIC_URL
from custom_components.vtherm_dashboard.dev_server import read_dev_server_url


async def test_panel_is_registered_for_administrators(hass: HomeAssistant, setup_dashboard) -> None:
    """The panel is added to the menu, requires an administrator and loads the frontend module."""
    await setup_dashboard()

    panel = hass.data[frontend.DATA_PANELS][PANEL_URL_PATH]
    assert panel.require_admin is True
    assert panel.sidebar_title == "Versatile Thermostat"
    assert panel.config["_panel_custom"]["name"] == "vtherm-dashboard-panel"
    assert panel.config["_panel_custom"]["module_url"].startswith(f"{STATIC_URL}/{FRONTEND_MODULE}?v=")


async def test_admin_sees_the_panel_and_a_regular_user_does_not(hass: HomeAssistant, setup_dashboard, hass_ws_client, hass_read_only_access_token) -> None:
    """The panel list sent to the browser contains the panel for an administrator only."""
    await setup_dashboard()

    admin_client = await hass_ws_client(hass)
    await admin_client.send_json({"id": 1, "type": "get_panels"})
    assert PANEL_URL_PATH in (await admin_client.receive_json())["result"]

    user_client = await hass_ws_client(hass, hass_read_only_access_token)
    await user_client.send_json({"id": 1, "type": "get_panels"})
    assert PANEL_URL_PATH not in (await user_client.receive_json())["result"]


async def test_frontend_module_is_served(setup_dashboard, hass_client) -> None:
    """The frontend module is served from the static path."""
    await setup_dashboard()

    client = await hass_client()
    response = await client.get(f"{STATIC_URL}/{FRONTEND_MODULE}")
    assert response.status == 200
    assert "vtherm-dashboard-panel" in await response.text()


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (None, None),
        ("", None),
        ("   ", None),
        ("http://localhost:5198", "http://localhost:5198"),
        ("http://localhost:5198/", "http://localhost:5198"),
        ("https://dev.example.org/frontend/", "https://dev.example.org/frontend"),
    ],
)
def test_the_development_server_is_read_from_the_environment(value, expected) -> None:
    """An absent or empty variable means the built files, a valid URL is returned without its final slash."""
    environ = {} if value is None else {DEV_SERVER_ENV: value}
    assert read_dev_server_url(environ) == expected


@pytest.mark.parametrize("value", ["localhost:5198", "javascript:alert(1)", "ftp://localhost/", "/src/index.ts", "http://"])
def test_an_invalid_development_server_is_refused_and_logged(value, caplog) -> None:
    """A value that is not an absolute http or https URL is ignored, and the log names it."""
    assert read_dev_server_url({DEV_SERVER_ENV: value}) is None
    assert DEV_SERVER_ENV in caplog.text
    assert repr(value) in caplog.text


async def _setup_without_build(hass: HomeAssistant, tmp_path, monkeypatch) -> MockConfigEntry:
    """Set up the dashboard with an empty www folder."""
    monkeypatch.setattr(panel_module, "WWW_DIR", tmp_path)
    mock_integration(hass, MockModule("versatile_thermostat", partial_manifest={"version": "10.6.4"}))
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_the_development_server_replaces_the_build(hass: HomeAssistant, tmp_path, monkeypatch, caplog) -> None:
    """With the variable, the entry loads without a build and the panel loads its module from the development server."""
    monkeypatch.setenv(DEV_SERVER_ENV, "http://localhost:5198/")
    entry = await _setup_without_build(hass, tmp_path, monkeypatch)

    assert entry.state is ConfigEntryState.LOADED
    panel_config = hass.data[frontend.DATA_PANELS][PANEL_URL_PATH]
    assert panel_config.config["_panel_custom"]["module_url"] == "http://localhost:5198/src/index.ts"
    assert panel_config.require_admin is True
    assert panel_config.sidebar_title == "Versatile Thermostat"
    assert panel_config.config["_panel_custom"]["name"] == "vtherm-dashboard-panel"
    assert "loaded from the development server http://localhost:5198" in caplog.text
    # The built files are not served: the folder may not exist.
    assert not hass.data.get(f"{DOMAIN}_static_registered")


async def test_the_panel_stays_for_administrators_with_the_development_server(hass: HomeAssistant, tmp_path, monkeypatch, hass_ws_client, hass_read_only_access_token) -> None:
    """A user who is not an administrator does not get the panel from the development server either."""
    monkeypatch.setenv(DEV_SERVER_ENV, "http://localhost:5198")
    await _setup_without_build(hass, tmp_path, monkeypatch)

    user_client = await hass_ws_client(hass, hass_read_only_access_token)
    await user_client.send_json({"id": 1, "type": "get_panels"})
    assert PANEL_URL_PATH not in (await user_client.receive_json())["result"]


async def test_an_invalid_development_server_still_needs_the_build(hass: HomeAssistant, tmp_path, monkeypatch) -> None:
    """A refused value behaves as no value: without the build, the entry fails."""
    monkeypatch.setenv(DEV_SERVER_ENV, "localhost:5198")
    entry = await _setup_without_build(hass, tmp_path, monkeypatch)
    assert entry.state is ConfigEntryState.SETUP_ERROR


async def test_unload_removes_the_panel_and_reload_works(hass: HomeAssistant, setup_dashboard) -> None:
    """Unloading removes the panel, and the entry can be loaded again."""
    entry = await setup_dashboard()

    assert await hass.config_entries.async_unload(entry.entry_id)
    assert PANEL_URL_PATH not in hass.data[frontend.DATA_PANELS]

    assert await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state is ConfigEntryState.LOADED
    assert PANEL_URL_PATH in hass.data[frontend.DATA_PANELS]
