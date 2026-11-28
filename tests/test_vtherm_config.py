"""Tests for the reading of the configuration of Versatile Thermostat."""

from __future__ import annotations

import json

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import floor_registry as fr
from pytest_homeassistant.common import MockConfigEntry, MockModule, mock_integration

from custom_components.vtherm_dashboard import vtherm_config
from custom_components.vtherm_dashboard.const import SUPPORTED_VTHERM_MAJOR
from custom_components.vtherm_dashboard.vtherm_config import (
    CENTRAL_TYPE,
    READ_ONLY_NEWER_VERSION,
    SUPPORTED_CONFIG_VERSION,
    VTHERM_DOMAIN,
    ConfigNotFoundError,
    central_entry,
    list_thermostats,
    read_central_config,
    read_config,
)

from .conftest import EXTERNAL_VTHERM, requires_vtherm

VTHERM_MAJOR = SUPPORTED_VTHERM_MAJOR
"""The package major version that the tests give to the Versatile Thermostat that is installed."""


def add_entry(hass: HomeAssistant, thermostat_type: str, name: str, version: int = 2, minor_version: int = 4, **data) -> MockConfigEntry:
    """Add a configuration entry of Versatile Thermostat."""
    entry = MockConfigEntry(domain=VTHERM_DOMAIN, title=name, data={"thermostat_type": thermostat_type, "name": name, **data}, version=version, minor_version=minor_version)
    entry.add_to_hass(hass)
    return entry


def test_no_entry(hass: HomeAssistant) -> None:
    """Without Versatile Thermostat entry, there is no thermostat and no central configuration."""
    assert list_thermostats(hass, VTHERM_MAJOR) == []
    assert central_entry(hass) is None
    assert read_central_config(hass, VTHERM_MAJOR) is None


def test_thermostats_are_listed_by_name_with_their_type_and_without_the_central_configuration(hass: HomeAssistant) -> None:
    """The list has the thermostats only, in alphabetical order, with the type that the dashboard names."""
    add_entry(hass, "thermostat_over_valve", "Bureau")
    add_entry(hass, "thermostat_over_switch", "chambre")
    add_entry(hass, "thermostat_over_climate", "Salon")
    add_entry(hass, CENTRAL_TYPE, "Central configuration")
    add_entry(hass, "thermostat_over_switch", "Cuisine")
    assert [(summary.name, summary.type) for summary in list_thermostats(hass, VTHERM_MAJOR)] == [
        ("Bureau", "over_valve"),
        ("chambre", "over_switch"),
        ("Cuisine", "over_switch"),
        ("Salon", "over_climate"),
    ]


def test_entries_of_other_integrations_are_ignored(hass: HomeAssistant) -> None:
    """Only the entries of Versatile Thermostat are read."""
    MockConfigEntry(domain="other", data={"thermostat_type": "thermostat_over_switch", "name": "Other"}).add_to_hass(hass)
    assert list_thermostats(hass, VTHERM_MAJOR) == []


def test_central_configuration(hass: HomeAssistant) -> None:
    """The central configuration is found, and read like a thermostat."""
    entry = add_entry(hass, CENTRAL_TYPE, "Central configuration", temp_min=7.0)
    assert central_entry(hass) is entry
    central = read_central_config(hass, VTHERM_MAJOR)
    assert central is not None
    assert (central.id, central.type, central.values["temp_min"], central.read_only_reason) == (entry.entry_id, "central", 7.0, None)


def test_read_the_configuration_of_an_entry(hass: HomeAssistant) -> None:
    """The view of an entry has its values, and changing them does not change the entry."""
    entry = add_entry(hass, "thermostat_over_switch", "Salon", cycle_min=5)
    view = read_config(hass, entry.entry_id, VTHERM_MAJOR)
    assert (view.id, view.name, view.type, view.values["cycle_min"], view.version, view.minor_version) == (entry.entry_id, "Salon", "over_switch", 5, 2, 4)
    view.values["cycle_min"] = 99
    assert entry.data["cycle_min"] == 5


def test_unknown_entry(hass: HomeAssistant) -> None:
    """An identifier that is not an entry of Versatile Thermostat is refused."""
    MockConfigEntry(domain="other").add_to_hass(hass)
    with pytest.raises(ConfigNotFoundError):
        read_config(hass, "no-such-entry", VTHERM_MAJOR)


@pytest.mark.parametrize(
    ("version", "minor_version", "vtherm_major", "read_only"),
    [
        (2, 4, 10, False),
        (2, 3, 10, False),
        (2, 0, 10, False),
        (2, 5, 10, False),
        (2, 99, 10, False),
        (2, 4, 11, True),
        (2, 5, 11, True),
        (2, 4, 9, True),
        (2, 4, None, True),
        (1, 9, 10, True),
        (3, 0, 10, True),
        (3, 9, 10, True),
    ],
)
def test_a_configuration_is_editable_for_the_supported_configuration_and_package_majors(hass: HomeAssistant, version, minor_version, vtherm_major, read_only) -> None:
    """An entry is editable when its configuration major and the package major are the supported ones, whatever its minor version."""
    entry = add_entry(hass, "thermostat_over_switch", "Salon", version=version, minor_version=minor_version)
    view = read_config(hass, entry.entry_id, vtherm_major)
    assert view.read_only_reason == (READ_ONLY_NEWER_VERSION if read_only else None)
    assert view.as_dict()["read_only"] is read_only
    assert list_thermostats(hass, vtherm_major)[0].read_only is read_only
    assert vtherm_config.read_only_reason(entry, vtherm_major) == view.read_only_reason


@pytest.mark.parametrize(("version", "expected"), [("10.6.4", 10), ("11.0.0", 11), ("10.0.0-beta1", 10), ("bad", None), ("", None), (None, None)])
async def test_the_package_major_is_read_from_the_manifest(hass: HomeAssistant, version, expected) -> None:
    """The major version comes from the manifest of the integration, and an absent or unreadable version is unknown."""
    partial = {} if version is None else {"version": version}
    mock_integration(hass, MockModule(VTHERM_DOMAIN, partial_manifest=partial), built_in=False)
    assert await vtherm_config.async_vtherm_major(hass) == expected


async def test_the_package_major_is_unknown_without_the_integration(hass: HomeAssistant) -> None:
    """Without Versatile Thermostat installed, the package version is unknown."""
    assert await vtherm_config.async_vtherm_major(hass) is None


def test_views_are_json_serializable(hass: HomeAssistant) -> None:
    """The views are sent through the WebSocket."""
    entry = add_entry(hass, "thermostat_over_switch", "Salon", underlying_entity_ids=["switch.a"], cycle_min=5)
    assert json.loads(json.dumps(read_config(hass, entry.entry_id, VTHERM_MAJOR).as_dict()))["values"]["underlying_entity_ids"] == ["switch.a"]
    assert json.dumps(list_thermostats(hass, VTHERM_MAJOR)[0].as_dict())


def test_the_supported_version_is_declared() -> None:
    """The dashboard declares the version of configuration that it supports."""
    assert SUPPORTED_CONFIG_VERSION == (2, 4)
    assert SUPPORTED_VTHERM_MAJOR == 10
    assert vtherm_config.READ_ONLY_NEWER_VERSION == "config_version_newer"


def add_device_and_climate(hass: HomeAssistant, entry: MockConfigEntry) -> tuple[dr.DeviceEntry, er.RegistryEntry]:
    """Add the device and the climate entity that Versatile Thermostat creates for a thermostat."""
    device = dr.async_get(hass).async_get_or_create(config_entry_id=entry.entry_id, identifiers={(VTHERM_DOMAIN, entry.entry_id)}, name=entry.title)
    climate = er.async_get(hass).async_get_or_create("climate", VTHERM_DOMAIN, entry.entry_id, config_entry=entry, device_id=device.id, has_entity_name=True)
    return device, climate


def move_climate(hass: HomeAssistant, climate: er.RegistryEntry, area_id: str) -> None:
    """Give the climate entity an area of its own. Home Assistant asks for a name of its own too, as a user does in its settings."""
    er.async_get(hass).async_update_entity(climate.entity_id, name="Thermostat", area_id=area_id)


def test_the_area_of_a_thermostat_is_the_area_of_its_device(hass: HomeAssistant) -> None:
    """A thermostat whose device is in an area is in that area, with the name of the area and of its floor."""
    floor = fr.async_get(hass).async_create("Ground floor", level=0)
    area = ar.async_get(hass).async_create("Bathroom", floor_id=floor.floor_id)
    entry = add_entry(hass, "thermostat_over_switch", "Towel rail")
    device, climate = add_device_and_climate(hass, entry)
    dr.async_get(hass).async_update_device(device.id, area_id=area.id)
    location = list_thermostats(hass, VTHERM_MAJOR)[0].as_dict()
    assert location == {
        "id": entry.entry_id,
        "name": "Towel rail",
        "type": "over_switch",
        "read_only": False,
        "device_id": device.id,
        "climate_entity_id": climate.entity_id,
        "area_id": area.id,
        "area_name": "Bathroom",
        "floor_name": "Ground floor",
        "floor_level": 0,
    }


def test_the_area_of_the_climate_entity_overrides_the_area_of_the_device(hass: HomeAssistant) -> None:
    """As in Home Assistant, an entity that has its own area is in that area, whatever the area of its device."""
    registry = ar.async_get(hass)
    office, living_room = registry.async_create("Office"), registry.async_create("Living room")
    entry = add_entry(hass, "thermostat_over_climate", "Heat pump")
    device, climate = add_device_and_climate(hass, entry)
    dr.async_get(hass).async_update_device(device.id, area_id=living_room.id)
    move_climate(hass, climate, office.id)
    summary = list_thermostats(hass, VTHERM_MAJOR)[0]
    assert (summary.location.area_id, summary.location.area_name, summary.location.floor_name, summary.location.floor_level) == (office.id, "Office", None, None)


def test_the_area_of_the_climate_entity_is_used_when_the_device_has_none(hass: HomeAssistant) -> None:
    """A thermostat whose device has no area is in the area of its climate entity."""
    office = ar.async_get(hass).async_create("Office")
    entry = add_entry(hass, "thermostat_over_valve", "Valve")
    _, climate = add_device_and_climate(hass, entry)
    move_climate(hass, climate, office.id)
    assert list_thermostats(hass, VTHERM_MAJOR)[0].location.area_name == "Office"


def test_a_thermostat_without_device_or_area_has_no_location(hass: HomeAssistant) -> None:
    """An entry that has no device and no entity yet, such as a thermostat that is not loaded, has no area."""
    add_entry(hass, "thermostat_over_switch", "Not loaded")
    entry = add_entry(hass, "thermostat_over_switch", "No area")
    device, climate = add_device_and_climate(hass, entry)
    by_name = {summary.name: summary.location.as_dict() for summary in list_thermostats(hass, VTHERM_MAJOR)}
    assert by_name["Not loaded"] == {"device_id": None, "climate_entity_id": None, "area_id": None, "area_name": None, "floor_name": None, "floor_level": None}
    assert (by_name["No area"]["device_id"], by_name["No area"]["climate_entity_id"], by_name["No area"]["area_id"]) == (device.id, climate.entity_id, None)


@requires_vtherm
def test_the_constants_are_those_of_the_versatile_thermostat_of_the_environment(real_vtherm) -> None:  # pylint: disable=unused-argument
    """When Versatile Thermostat changes its version of configuration or its types, this test fails so that the dashboard is reviewed."""
    # The real Versatile Thermostat is only importable once the fixture made it visible.
    from custom_components.versatile_thermostat import const  # pylint: disable=import-outside-toplevel,import-error,no-name-in-module

    assert (const.CONFIG_VERSION, const.CONFIG_MINOR_VERSION) == SUPPORTED_CONFIG_VERSION
    assert const.DOMAIN == VTHERM_DOMAIN
    manifest = json.loads((EXTERNAL_VTHERM / "versatile_thermostat" / "manifest.json").read_text(encoding="utf-8"))
    assert int(manifest["version"].split(".")[0]) == SUPPORTED_VTHERM_MAJOR
    assert const.CONF_THERMOSTAT_CENTRAL_CONFIG == CENTRAL_TYPE
    assert set(vtherm_config.THERMOSTAT_TYPES) == {const.CONF_THERMOSTAT_SWITCH, const.CONF_THERMOSTAT_CLIMATE, const.CONF_THERMOSTAT_VALVE}
    assert const.CONF_THERMOSTAT_TYPE == vtherm_config.CONF_THERMOSTAT_TYPE
    assert const.CONF_NAME == vtherm_config.CONF_NAME
