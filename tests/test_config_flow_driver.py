"""Tests for the writing of the configuration through the real config flow of Versatile Thermostat."""

from __future__ import annotations

from typing import Any

import pytest
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant.common import MockConfigEntry

from custom_components.vtherm_dashboard import config_flow_driver
from custom_components.vtherm_dashboard.config_flow_driver import (
    ConfigWriter,
    FlowConfigWriter,
    SaveResult,
)
from custom_components.vtherm_dashboard.vtherm_config import CENTRAL_TYPE, VTHERM_DOMAIN, central_entry, entries

from .conftest import requires_vtherm

pytestmark = requires_vtherm

OUTDOOR = "external_temperature_sensor_entity_id"
INDOOR = "temperature_sensor_entity_id"
UNDERLYING = "underlying_entity_ids"


@pytest.fixture(name="writer")
async def writer_fixture(hass: HomeAssistant, real_vtherm) -> ConfigWriter:  # pylint: disable=unused-argument
    """The real Versatile Thermostat, set up, with the entities that a configuration can point at."""
    for entity_id, state in {
        "sensor.outdoor": "10",
        "sensor.indoor": "19",
        "switch.heater": "off",
        "switch.heater2": "off",
        "binary_sensor.window": "off",
        "lock_placeholder.unused": "off",
    }.items():
        hass.states.async_set(entity_id, state)
    hass.states.async_set("climate.ac", "off", {"hvac_modes": ["off", "heat", "cool"], "min_temp": 7, "max_temp": 35})
    hass.states.async_set("climate.ac2", "off", {"hvac_modes": ["off", "heat", "cool"], "min_temp": 7, "max_temp": 35})
    for valve in ("number.valve", "number.valve2", "number.opening1", "number.opening2"):
        hass.states.async_set(valve, "0", {"min": 0, "max": 100})
    assert await async_setup_component(hass, VTHERM_DOMAIN, {})
    await hass.async_block_till_done()
    return FlowConfigWriter(hass)


async def create_central(hass: HomeAssistant, writer: ConfigWriter) -> ConfigEntry:
    """Create the central configuration."""
    # The TPI and the advanced tabs are submitted with their default values, as a user who opens them and saves.
    result = await writer.async_create(CENTRAL_TYPE, {"main": {OUTDOOR: "sensor.outdoor"}, "tpi": {}, "advanced": {}})
    assert result.ok, result.errors
    await hass.async_block_till_done()
    return central_entry(hass)  # type: ignore[return-value]


async def create_thermostat(hass: HomeAssistant, writer: ConfigWriter, thermostat_type: str, name: str, underlying: list[str], **type_values: Any) -> ConfigEntry:
    """Create a thermostat that uses the central configuration."""
    result = await writer.async_create(
        thermostat_type,
        {"main": {"name": name, INDOOR: "sensor.indoor"}, "type": {UNDERLYING: underlying, **type_values}},
    )
    assert result.ok, result.errors
    await hass.async_block_till_done()
    return next(entry for entry in entries(hass) if entry.entry_id == result.entry_id)


def codes(result: SaveResult) -> list[tuple[str | None, str, str]]:
    """The errors of a result as tuples."""
    return [(error.tab, error.field, error.code) for error in result.errors]


def flows_in_progress(hass: HomeAssistant) -> int:
    """The number of flows that are still open, of both kinds."""
    return len(hass.config_entries.flow.async_progress()) + len(hass.config_entries.options.async_progress())


# ---- creation


async def test_create_the_central_configuration(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """The central configuration is created by the flow, with its name and the values of the tab."""
    entry = await create_central(hass, writer)
    assert (entry.data["name"], entry.data[OUTDOOR], entry.data["thermostat_type"]) == ("Central configuration", "sensor.outdoor", CENTRAL_TYPE)
    assert flows_in_progress(hass) == 0


async def test_a_second_central_configuration_is_refused(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """There is one central configuration only."""
    await create_central(hass, writer)
    result = await writer.async_create(CENTRAL_TYPE, {"main": {OUTDOOR: "sensor.outdoor"}})
    assert (result.ok, codes(result)) == (False, [(None, "thermostat_type", "central_config_exists")])
    assert len([entry for entry in entries(hass) if entry.data["thermostat_type"] == CENTRAL_TYPE]) == 1


@pytest.mark.parametrize(
    ("thermostat_type", "underlying"),
    [("thermostat_over_switch", ["switch.heater"]), ("thermostat_over_climate", ["climate.ac"]), ("thermostat_over_valve", ["number.valve"])],
)
async def test_create_a_thermostat_of_each_type(hass: HomeAssistant, writer: ConfigWriter, thermostat_type, underlying) -> None:
    """A thermostat of each type is created with its name, its sensor and its underlying entities."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, thermostat_type, "Salon", underlying)
    assert (entry.data["name"], entry.data[INDOOR], entry.data[UNDERLYING], entry.data["thermostat_type"]) == ("Salon", "sensor.indoor", underlying, thermostat_type)
    assert entry.data["use_main_central_config"] is True
    assert flows_in_progress(hass) == 0


async def test_a_thermostat_without_underlying_entity_is_not_complete(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """The flow does not offer to finish: nothing is created and no flow stays open."""
    await create_central(hass, writer)
    before = len(entries(hass))
    result = await writer.async_create("thermostat_over_switch", {"main": {"name": "Salon", INDOOR: "sensor.indoor"}})
    assert (result.ok, codes(result)) == (False, [(None, "base", "configuration_not_complete")])
    assert len(entries(hass)) == before
    assert flows_in_progress(hass) == 0


async def test_a_thermostat_without_name_or_sensor_is_refused_with_the_missing_fields(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """The fields that the form requires are named in the errors."""
    await create_central(hass, writer)
    result = await writer.async_create("thermostat_over_switch", {"main": {}})
    assert set(codes(result)) == {("main", "name", "required"), ("main", INDOOR, "required")}
    assert flows_in_progress(hass) == 0


async def test_an_unknown_type_and_an_unknown_tab_are_refused_before_any_flow_opens(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """The dashboard checks what it can without opening a flow."""
    assert codes(await writer.async_create("thermostat_over_nothing", {})) == [(None, "thermostat_type", "unknown_thermostat_type")]
    assert codes(await writer.async_create("thermostat_over_switch", {"colors": {}})) == [("colors", "base", "unknown_tab")]
    assert flows_in_progress(hass) == 0


async def test_a_thermostat_cannot_use_the_central_configuration_when_there_is_none(writer: ConfigWriter) -> None:
    """The flow refuses the use of a central configuration that does not exist, and the error is on the field."""
    result = await writer.async_create("thermostat_over_switch", {"main": {"name": "Salon", INDOOR: "sensor.indoor", "use_main_central_config": True}})
    assert ("main", "use_main_central_config", "no_central_config") in codes(result)
    assert result.ok is False


CENTRAL_OPTIONS = (
    "use_main_central_config",
    "use_tpi_central_config",
    "use_window_central_config",
    "use_motion_central_config",
    "use_power_central_config",
    "use_presence_central_config",
    "use_presets_central_config",
    "use_advanced_central_config",
    "use_lock_central_config",
    "use_central_mode",
)


async def test_a_thermostat_is_created_without_central_configuration(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """The fields that the draft does not change get the values that the flow suggests: the central options are off, and the TPI and
    advanced tabs get the defaults of Versatile Thermostat."""
    result = await writer.async_create(
        "thermostat_over_switch",
        {
            "main": {"name": "Salon", INDOOR: "sensor.indoor", OUTDOOR: "sensor.outdoor", "use_main_central_config": False},
            "type": {UNDERLYING: ["switch.heater"]},
            "tpi": {},
            "advanced": {},
        },
    )
    assert result.ok, result.errors
    await hass.async_block_till_done()
    entry = next(entry for entry in entries(hass) if entry.entry_id == result.entry_id)
    assert {option: entry.data.get(option) for option in CENTRAL_OPTIONS} == dict.fromkeys(CENTRAL_OPTIONS, False)
    assert (entry.data["tpi_coef_int"], entry.data["tpi_coef_ext"]) == (0.6, 0.01)
    assert entry.data["safety_delay_min"] == 60
    assert flows_in_progress(hass) == 0


# ---- update


async def test_update_a_tab_and_keep_everything_else(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """The changed field is saved, and the values of the tab that were not changed stay as they were."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    before = dict(entry.data)
    result = await writer.async_update(entry.entry_id, {"main": {"cycle_min": 8}})
    await hass.async_block_till_done()
    assert (result.ok, result.entry_id, result.errors) == (True, entry.entry_id, [])
    assert entry.data["cycle_min"] == 8
    assert {key: value for key, value in entry.data.items() if key != "cycle_min"} == {key: value for key, value in before.items() if key != "cycle_min"}
    assert flows_in_progress(hass) == 0


async def test_a_change_of_name_keeps_the_central_options_and_the_cycle(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """The suggested values of the main form are the saved ones: the central options and the cycle do not move."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    before = {option: entry.data[option] for option in (*CENTRAL_OPTIONS, "cycle_min")}
    assert before["use_central_mode"] is True
    result = await writer.async_update(entry.entry_id, {"main": {"name": "Séjour"}})
    await hass.async_block_till_done()
    assert result.ok, result.errors
    assert entry.data["name"] == "Séjour"
    assert {option: entry.data[option] for option in before} == before


async def test_update_several_tabs_in_one_save_and_enable_a_feature_with_its_tab(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """A feature that is turned on in the same save opens its tab, which is filled in."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    result = await writer.async_update(
        entry.entry_id,
        {
            "window": {"use_window_central_config": False, "window_sensor_entity_id": "binary_sensor.window", "window_delay": 20},
            "features": {"use_window_feature": True},
            "main": {"cycle_min": 7},
        },
    )
    await hass.async_block_till_done()
    assert result.ok, result.errors
    assert (entry.data["cycle_min"], entry.data["use_window_feature"], entry.data["window_sensor_entity_id"], entry.data["window_delay"]) == (7, True, "binary_sensor.window", 20)


async def test_turning_a_feature_off_removes_its_values(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """The flow removes what belongs to a feature that is turned off."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    await writer.async_update(
        entry.entry_id, {"features": {"use_window_feature": True}, "window": {"use_window_central_config": False, "window_sensor_entity_id": "binary_sensor.window"}}
    )
    await hass.async_block_till_done()
    assert entry.data["window_sensor_entity_id"] == "binary_sensor.window"

    result = await writer.async_update(entry.entry_id, {"features": {"use_window_feature": False}})
    await hass.async_block_till_done()
    assert result.ok, result.errors
    assert "window_sensor_entity_id" not in entry.data
    assert entry.data["use_window_feature"] is False


async def test_stop_using_the_central_configuration_fills_the_specific_form(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """When the inheritance is turned off, the flow asks for the specific values, which the same tab carries."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    result = await writer.async_update(
        entry.entry_id, {"main": {"use_main_central_config": False, OUTDOOR: "sensor.indoor", "temp_min": 10, "temp_max": 30, "step_temperature": 0.5}}
    )
    await hass.async_block_till_done()
    assert result.ok, result.errors
    assert (entry.data["use_main_central_config"], entry.data[OUTDOOR], entry.data["temp_min"], entry.data["temp_max"], entry.data["step_temperature"]) == (
        False,
        "sensor.indoor",
        10,
        30,
        0.5,
    )


async def test_changes_of_nothing_do_not_open_a_flow(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """A save without change is a success that does nothing."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    result = await writer.async_update(entry.entry_id, {})
    assert (result.ok, result.entry_id) == (True, entry.entry_id)
    assert flows_in_progress(hass) == 0


# ---- errors: nothing is written, the flow is aborted


@pytest.mark.parametrize(
    ("changes", "tab", "field", "code"),
    [
        ({"main": {INDOOR: "sensor.does_not_exist"}}, "main", INDOOR, "unknown_entity"),
        ({"lock": {"use_lock_central_config": False, "lock_code": "12"}}, "lock", "base", "lock_code_incorrect"),
    ],
)
# pylint: disable-next=too-many-arguments,too-many-positional-arguments
async def test_an_error_of_the_flow_is_returned_on_its_field_and_nothing_is_written(hass: HomeAssistant, writer: ConfigWriter, changes, tab, field, code) -> None:
    """The flow refuses the value, the error comes back with its field, and the entry is as it was."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    before = dict(entry.data)
    result = await writer.async_update(entry.entry_id, {**changes, "main": {**changes.get("main", {}), "cycle_min": 9}})
    await hass.async_block_till_done()
    assert result.ok is False
    assert (tab, field, code) in codes(result)
    assert dict(entry.data) == before
    assert flows_in_progress(hass) == 0


async def test_the_valve_regulation_needs_as_many_opening_entities_as_underlying_entities(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """An over_climate with valve regulation and two opening entities for one underlying entity is refused."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_climate", "Chambre", ["climate.ac"])
    before = dict(entry.data)
    result = await writer.async_update(
        entry.entry_id,
        {"type": {"auto_regulation_mode": "auto_regulation_valve"}, "valve_regulation": {"opening_degree_entity_ids": ["number.opening1", "number.opening2"]}},
    )
    assert result.ok is False
    assert ("valve_regulation", "base", "valve_regulation_nb_entities_incorrect") in codes(result)
    assert dict(entry.data) == before


async def test_a_value_that_the_schema_refuses_is_reported_on_its_field(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """A value of the wrong kind is refused by the form before the flow validates it."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    result = await writer.async_update(entry.entry_id, {"main": {"cycle_min": "often"}})
    assert result.ok is False
    assert codes(result) == [("main", "cycle_min", "invalid_value")]


async def test_a_tab_that_the_menu_does_not_offer_is_refused(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """The window tab does not exist while the window feature is off."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    result = await writer.async_update(entry.entry_id, {"auto_start_stop": {"auto_start_stop_level": "auto_start_stop_fast"}})
    assert (result.ok, codes(result)) == (False, [("auto_start_stop", "base", "tab_unavailable")])
    assert flows_in_progress(hass) == 0


async def test_an_error_in_a_later_tab_keeps_the_earlier_tabs_unsaved(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """All of the changes are saved or none: the first tab was valid but the second is not."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    before = dict(entry.data)
    result = await writer.async_update(entry.entry_id, {"main": {"cycle_min": 12}, "lock": {"use_lock_central_config": False, "lock_code": "abc"}})
    assert result.ok is False
    await hass.async_block_till_done()
    assert dict(entry.data) == before


async def test_a_window_sensor_and_automatic_detection_are_refused_together(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """Once a window sensor is saved, the flow no longer asks for the thresholds of the automatic detection.

    The dashboard refuses the threshold instead of letting the flow drop it, and nothing is written.
    """
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    saved = await writer.async_update(entry.entry_id, {"window": {"use_window_central_config": False, "window_sensor_entity_id": "binary_sensor.window"}})
    await hass.async_block_till_done()
    assert saved.ok, saved.errors
    before = dict(entry.data)
    result = await writer.async_update(entry.entry_id, {"window": {"use_window_central_config": False, "window_auto_open_threshold": 4}})
    assert (result.ok, codes(result)) == (False, [("window", "window_auto_open_threshold", "field_not_applicable")])
    assert dict(entry.data) == before
    assert flows_in_progress(hass) == 0


async def test_a_changed_field_that_no_form_asks_for_is_refused(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """A field that the tab does not have would be dropped by the flow: the save is refused and names it."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    before = dict(entry.data)
    result = await writer.async_update(entry.entry_id, {"main": {"cycle_min": 6, "colour": "blue"}})
    assert codes(result) == [("main", "colour", "field_not_applicable")]
    assert dict(entry.data) == before


async def test_unknown_entry_and_unknown_tab(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """An update checks the entry and the tabs before it opens a flow."""
    await create_central(hass, writer)
    entry = await create_thermostat(hass, writer, "thermostat_over_switch", "Salon", ["switch.heater"])
    assert codes(await writer.async_update("no-such-entry", {"main": {}})) == [(None, "base", "not_found")]
    assert codes(await writer.async_update(entry.entry_id, {"colors": {}})) == [("colors", "base", "unknown_tab")]
    assert flows_in_progress(hass) == 0


@pytest.mark.parametrize(("version", "vtherm_major"), [(3, 10), (2, 11), (2, None)])
async def test_a_configuration_that_the_dashboard_cannot_verify_is_not_edited(
    hass: HomeAssistant, writer: ConfigWriter, monkeypatch: pytest.MonkeyPatch, version: int, vtherm_major: int | None
) -> None:
    """An entry whose configuration major or package major is not the supported one is read-only: no flow is opened."""

    async def fake_major(_hass: HomeAssistant) -> int | None:
        return vtherm_major

    monkeypatch.setattr(config_flow_driver, "async_vtherm_major", fake_major)
    # An entry that is not set up: the Versatile Thermostat of the tests would migrate it down.
    entry = MockConfigEntry(domain=VTHERM_DOMAIN, title="Future", data={"thermostat_type": "thermostat_over_switch", "name": "Future"}, version=version, minor_version=4)
    entry.add_to_hass(hass)
    result = await writer.async_update(entry.entry_id, {"main": {"cycle_min": 3}})
    assert codes(result) == [(None, "base", "config_version_unsupported")]
    assert flows_in_progress(hass) == 0


async def test_a_newer_minor_version_of_the_configuration_is_edited(hass: HomeAssistant, writer: ConfigWriter) -> None:
    """A 2.9 entry on the verified package is not refused as read-only: the flow of Versatile Thermostat is reached and judges the values."""
    entry = MockConfigEntry(domain=VTHERM_DOMAIN, title="Future", data={"thermostat_type": "thermostat_over_switch", "name": "Future"}, version=2, minor_version=9)
    entry.add_to_hass(hass)
    result = await writer.async_update(entry.entry_id, {"main": {"cycle_min": 3}})
    assert (None, "base", "config_version_unsupported") not in codes(result)
