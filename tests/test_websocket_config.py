"""Tests for the WebSocket commands that read the configuration."""

from __future__ import annotations

import json

import pytest
from homeassistant import loader
from homeassistant.core import HomeAssistant
from pytest_homeassistant.common import MockConfigEntry, MockModule, mock_integration

from custom_components.vtherm_dashboard import vtherm_config
from custom_components.vtherm_dashboard.vtherm_config import CENTRAL_TYPE, VTHERM_DOMAIN

PREFIX = "vtherm_dashboard"


@pytest.fixture(name="client")
async def client_fixture(hass: HomeAssistant, setup_dashboard, hass_ws_client):
    """An administrator connected to a dashboard that is set up."""
    await setup_dashboard()
    return await hass_ws_client(hass)


def add_entry(hass: HomeAssistant, thermostat_type: str, name: str, **kwargs) -> MockConfigEntry:
    """Add an entry of Versatile Thermostat, in the supported configuration major version unless the test says otherwise."""
    kwargs.setdefault("version", 2)
    entry = MockConfigEntry(domain=VTHERM_DOMAIN, title=name, data={"thermostat_type": thermostat_type, "name": name, "cycle_min": 5}, **kwargs)
    entry.add_to_hass(hass)
    return entry


async def test_list_the_thermostats_and_say_whether_there_is_a_central_configuration(hass: HomeAssistant, client) -> None:
    """The list has the thermostats with their type, and the central configuration is signaled apart."""
    salon = add_entry(hass, "thermostat_over_climate", "Salon")
    central = add_entry(hass, CENTRAL_TYPE, "Central configuration")
    await client.send_json_auto_id({"type": f"{PREFIX}/get_thermostats"})
    result = (await client.receive_json())["result"]
    assert result["thermostats"] == [
        {
            "id": salon.entry_id,
            "name": "Salon",
            "type": "over_climate",
            "read_only": False,
            "device_id": None,
            "climate_entity_id": None,
            "area_id": None,
            "area_name": None,
            "floor_name": None,
            "floor_level": None,
        }
    ]
    assert (result["has_central_config"], result["central_config_id"]) == (True, central.entry_id)
    assert result["supported_config_version"] == [2, 4]
    assert result["supported_vtherm_major"] == 10
    json.dumps(result)


async def test_list_without_any_thermostat(hass: HomeAssistant, client) -> None:  # pylint: disable=unused-argument
    """Without thermostat, the list is empty and there is no central configuration."""
    await client.send_json_auto_id({"type": f"{PREFIX}/get_thermostats"})
    result = (await client.receive_json())["result"]
    assert (result["thermostats"], result["has_central_config"], result["central_config_id"]) == ([], False, None)


async def test_a_configuration_that_is_too_recent_is_listed_as_read_only(hass: HomeAssistant, client) -> None:
    """The list says that a configuration is read-only."""
    add_entry(hass, "thermostat_over_switch", "Future", version=3, minor_version=0)
    await client.send_json_auto_id({"type": f"{PREFIX}/get_thermostats"})
    assert (await client.receive_json())["result"]["thermostats"][0]["read_only"] is True


async def test_read_the_configuration_of_an_entry(hass: HomeAssistant, client) -> None:
    """The configuration of an entry has its values and says whether it can be edited."""
    entry = add_entry(hass, "thermostat_over_switch", "Salon")
    await client.send_json_auto_id({"type": f"{PREFIX}/get_config", "entry_id": entry.entry_id})
    result = (await client.receive_json())["result"]
    assert (result["name"], result["type"], result["values"]["cycle_min"], result["read_only"], result["read_only_reason"]) == ("Salon", "over_switch", 5, False, None)


async def test_a_newer_minor_version_of_the_configuration_is_editable(hass: HomeAssistant, client) -> None:
    """A 2.9 configuration on the verified package is editable: the minor version of the configuration is not a rule."""
    entry = add_entry(hass, "thermostat_over_switch", "Future", version=2, minor_version=9)
    await client.send_json_auto_id({"type": f"{PREFIX}/get_config", "entry_id": entry.entry_id})
    result = (await client.receive_json())["result"]
    assert (result["read_only"], result["read_only_reason"]) == (False, None)


async def test_a_configuration_of_a_newer_major_version_is_read_only(hass: HomeAssistant, client) -> None:
    """A configuration of a newer major version is sent with the reason that it is read-only."""
    entry = add_entry(hass, "thermostat_over_switch", "Future", version=3, minor_version=0)
    await client.send_json_auto_id({"type": f"{PREFIX}/get_config", "entry_id": entry.entry_id})
    result = (await client.receive_json())["result"]
    assert (result["read_only"], result["read_only_reason"]) == (True, "config_version_newer")


@pytest.mark.parametrize("version", ["11.0.0", "9.9.9", "not a version", None])
async def test_a_package_that_is_not_verified_makes_every_read_command_read_only(hass: HomeAssistant, client, version) -> None:
    """With another major version of the package, or a version that cannot be read, the configurations are read-only."""
    mock_integration(hass, MockModule(VTHERM_DOMAIN, partial_manifest={} if version is None else {"version": version}), built_in=False)
    salon = add_entry(hass, "thermostat_over_switch", "Salon")
    central = add_entry(hass, CENTRAL_TYPE, "Central configuration")
    await client.send_json_auto_id({"type": f"{PREFIX}/get_thermostats"})
    result = (await client.receive_json())["result"]
    assert (result["thermostats"][0]["read_only"], result["supported_vtherm_major"]) == (True, 10)
    await client.send_json_auto_id({"type": f"{PREFIX}/get_config", "entry_id": salon.entry_id})
    assert (await client.receive_json())["result"]["read_only_reason"] == "config_version_newer"
    await client.send_json_auto_id({"type": f"{PREFIX}/get_central_config"})
    assert (await client.receive_json())["result"]["read_only_reason"] == "config_version_newer"
    await client.send_json_auto_id({"type": f"{PREFIX}/get_presets", "entry_id": central.entry_id})
    assert (await client.receive_json())["success"] is True


async def test_a_missing_package_is_read_only(hass: HomeAssistant, client, monkeypatch: pytest.MonkeyPatch) -> None:
    """When Home Assistant does not know Versatile Thermostat, the configuration is read-only."""

    async def not_found(_hass: HomeAssistant, domain: str):
        raise loader.IntegrationNotFound(domain)

    monkeypatch.setattr(vtherm_config, "async_get_integration", not_found)
    entry = add_entry(hass, "thermostat_over_switch", "Salon")
    await client.send_json_auto_id({"type": f"{PREFIX}/get_config", "entry_id": entry.entry_id})
    assert (await client.receive_json())["result"]["read_only"] is True


async def test_unknown_entry(client) -> None:
    """An identifier that does not exist is an error."""
    await client.send_json_auto_id({"type": f"{PREFIX}/get_config", "entry_id": "nope"})
    response = await client.receive_json()
    assert (response["success"], response["error"]["code"]) == (False, "not_found")


async def test_read_the_central_configuration(hass: HomeAssistant, client) -> None:
    """The central configuration is null until it exists, then it is read."""
    await client.send_json_auto_id({"type": f"{PREFIX}/get_central_config"})
    assert (await client.receive_json())["result"] is None
    central = add_entry(hass, CENTRAL_TYPE, "Central configuration")
    await client.send_json_auto_id({"type": f"{PREFIX}/get_central_config"})
    result = (await client.receive_json())["result"]
    assert (result["id"], result["type"]) == (central.entry_id, "central")


@pytest.mark.parametrize("command", [{"type": f"{PREFIX}/get_thermostats"}, {"type": f"{PREFIX}/get_config", "entry_id": "x"}, {"type": f"{PREFIX}/get_central_config"}])
async def test_a_user_who_is_not_an_administrator_is_refused(hass: HomeAssistant, setup_dashboard, hass_ws_client, hass_read_only_access_token, command) -> None:
    """Every read command is reserved for the administrators."""
    await setup_dashboard()
    add_entry(hass, "thermostat_over_switch", "Salon")
    user = await hass_ws_client(hass, hass_read_only_access_token)
    await user.send_json_auto_id(command)
    response = await user.receive_json()
    assert (response["success"], response["error"]["code"]) == (False, "unauthorized")
