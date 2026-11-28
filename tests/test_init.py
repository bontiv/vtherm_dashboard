"""Tests for the setup of the dashboard integration."""

from __future__ import annotations

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant.common import MockConfigEntry, MockModule, mock_integration

from custom_components.vtherm_dashboard import panel
from custom_components.vtherm_dashboard.const import DOMAIN


def _add_versatile_thermostat(hass: HomeAssistant) -> None:
    """Make a fake Versatile Thermostat integration available as the dependency of the dashboard."""
    mock_integration(hass, MockModule("versatile_thermostat", partial_manifest={"version": "10.6.4"}))


@pytest.mark.usefixtures("frontend_module")
async def test_entry_loads_and_unloads(hass: HomeAssistant) -> None:
    """The entry is loaded when Versatile Thermostat is present, and can be unloaded."""
    _add_versatile_thermostat(hass)
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state is ConfigEntryState.LOADED

    assert await hass.config_entries.async_unload(entry.entry_id)
    assert entry.state is ConfigEntryState.NOT_LOADED


async def test_entry_is_not_loaded_without_versatile_thermostat(hass: HomeAssistant) -> None:
    """Home Assistant does not load the dashboard when its dependency Versatile Thermostat is absent."""
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)

    assert not await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state is not ConfigEntryState.LOADED


@pytest.mark.usefixtures("frontend_module")
async def test_config_flow_creates_a_single_entry(hass: HomeAssistant) -> None:
    """The user adds the dashboard once, and a second attempt is refused."""
    _add_versatile_thermostat(hass)

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(result["flow_id"], user_input={})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Versatile Thermostat"
    await hass.async_block_till_done()

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


async def test_entry_fails_when_the_frontend_is_not_built(hass: HomeAssistant, tmp_path, monkeypatch) -> None:
    """The entry reports a setup error when the frontend module has not been built."""
    monkeypatch.setattr(panel, "WWW_DIR", tmp_path)
    _add_versatile_thermostat(hass)
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)

    assert not await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state is ConfigEntryState.SETUP_ERROR
