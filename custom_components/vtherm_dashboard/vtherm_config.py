"""Read the configuration of Versatile Thermostat.

The thermostats and the central configuration are configuration entries of the integration `versatile_thermostat`. This
module turns them into plain data for the dashboard. It does not write anything: the writing goes through the config flow of
Versatile Thermostat, see `config_flow_driver`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import floor_registry as fr
from homeassistant.loader import IntegrationNotFound, async_get_integration

from .const import SUPPORTED_VTHERM_MAJOR
from .version_constraints import VersionConstraintError, parse_version

VTHERM_DOMAIN = "versatile_thermostat"
"""The domain of Versatile Thermostat."""

SUPPORTED_CONFIG_VERSION: tuple[int, int] = (2, 4)
"""The version and the minor version of the configuration that the embedded schema describes. It is not the editing rule.

It is the `CONFIG_VERSION` and `CONFIG_MINOR_VERSION` of Versatile Thermostat that the dashboard was written for. A test compares them
with the Versatile Thermostat of the development environment, so a new version of the configuration is noticed.
"""

SUPPORTED_CONFIG_MAJOR = SUPPORTED_CONFIG_VERSION[0]
"""The major version of the configuration entries that the dashboard can edit. The minor version does not matter."""

CONF_THERMOSTAT_TYPE = "thermostat_type"
CONF_NAME = "name"

CENTRAL_TYPE = "thermostat_central_config"
"""The `thermostat_type` of the central configuration."""

THERMOSTAT_TYPES: dict[str, str] = {
    "thermostat_over_switch": "over_switch",
    "thermostat_over_climate": "over_climate",
    "thermostat_over_valve": "over_valve",
}
"""The `thermostat_type` of a thermostat of Versatile Thermostat, and the name that the dashboard gives to it."""

READ_ONLY_NEWER_VERSION = "config_version_newer"
"""The reason of a configuration that is read-only: its version, or the installed Versatile Thermostat, is not one that the dashboard can edit.

The value is historical and kept because it is published. The human message tells the two causes apart.
"""


def is_central(entry: ConfigEntry) -> bool:
    """Return whether the entry is the central configuration."""
    return entry.data.get(CONF_THERMOSTAT_TYPE) == CENTRAL_TYPE


def read_only_reason(entry: ConfigEntry, vtherm_major: int | None) -> str | None:
    """Return why the entry cannot be edited, or None when it can.

    An entry is editable when its configuration major version and the major version of the installed Versatile Thermostat package are
    the supported ones. The minor version of the configuration does not matter. A package version that is unknown (None) is not verified,
    so the entry is read-only.
    """
    if entry.version != SUPPORTED_CONFIG_MAJOR or vtherm_major != SUPPORTED_VTHERM_MAJOR:
        return READ_ONLY_NEWER_VERSION
    return None


async def async_vtherm_major(hass: HomeAssistant) -> int | None:
    """Return the major version of the installed Versatile Thermostat package, or None when it is absent or unreadable."""
    try:
        integration = await async_get_integration(hass, VTHERM_DOMAIN)
    except IntegrationNotFound:
        return None
    if integration.version is None:
        return None
    try:
        return parse_version(str(integration.version)).major
    except VersionConstraintError:
        return None


@dataclass(frozen=True)
class ThermostatLocation:
    """The device, the climate entity and the area of a thermostat, read from the registries of Home Assistant.

    The names of the area and of the floor are a fallback: the frontend reads them from the registries of `hass`, which change live.
    """

    device_id: str | None = None
    climate_entity_id: str | None = None
    area_id: str | None = None
    """The area of the climate entity, or else of the device, as Home Assistant resolves the area of an entity."""
    area_name: str | None = None
    floor_name: str | None = None
    floor_level: int | None = None

    def as_dict(self) -> dict[str, Any]:
        """Return the location as a JSON-serializable dictionary."""
        return {
            "device_id": self.device_id,
            "climate_entity_id": self.climate_entity_id,
            "area_id": self.area_id,
            "area_name": self.area_name,
            "floor_name": self.floor_name,
            "floor_level": self.floor_level,
        }


@dataclass(frozen=True)
class ThermostatSummary:
    """A thermostat, as the list of the thermostats shows it."""

    id: str
    """The identifier of the thermostat: the identifier of its configuration entry."""
    name: str
    type: str
    """`over_switch`, `over_climate` or `over_valve`."""
    read_only: bool
    """True when the configuration is newer than the dashboard supports."""
    location: ThermostatLocation = field(default_factory=ThermostatLocation)
    """Where the thermostat is in Home Assistant: its device, its climate entity and its area."""

    def as_dict(self) -> dict[str, Any]:
        """Return the summary as a JSON-serializable dictionary."""
        return {"id": self.id, "name": self.name, "type": self.type, "read_only": self.read_only, **self.location.as_dict()}


@dataclass(frozen=True)
class ConfigView:
    """The configuration of an entry, with what the dashboard needs to show it."""

    id: str
    name: str
    type: str
    """`central`, `over_switch`, `over_climate` or `over_valve`."""
    values: dict[str, Any] = field(default_factory=dict)
    """The values of the configuration, by key."""
    version: int = 0
    minor_version: int = 0
    read_only_reason: str | None = None
    """Why the configuration cannot be edited, or None."""

    def as_dict(self) -> dict[str, Any]:
        """Return the view as a JSON-serializable dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "values": self.values,
            "version": self.version,
            "minor_version": self.minor_version,
            "read_only": self.read_only_reason is not None,
            "read_only_reason": self.read_only_reason,
        }


class ConfigNotFoundError(LookupError):
    """There is no Versatile Thermostat configuration entry with this identifier."""


def entries(hass: HomeAssistant) -> list[ConfigEntry]:
    """Return the configuration entries of Versatile Thermostat, the central configuration included."""
    return hass.config_entries.async_entries(VTHERM_DOMAIN)


def central_entry(hass: HomeAssistant) -> ConfigEntry | None:
    """Return the central configuration, or None when there is none."""
    return next((entry for entry in entries(hass) if is_central(entry)), None)


def type_name(entry: ConfigEntry) -> str:
    """Return the type of an entry as the dashboard names it."""
    if is_central(entry):
        return "central"
    return THERMOSTAT_TYPES.get(str(entry.data.get(CONF_THERMOSTAT_TYPE)), "unknown")


def location_of(hass: HomeAssistant, entry: ConfigEntry) -> ThermostatLocation:
    """Find the device, the climate entity and the area of the thermostat of an entry.

    The area is the one of the climate entity when it has its own, or else the one of the device, which is how Home Assistant gives an
    entity its area. An entry without device or entity, such as a thermostat that is not loaded, has no area.
    """
    devices = dr.async_entries_for_config_entry(dr.async_get(hass), entry.entry_id)
    device = devices[0] if devices else None
    climate = next((entity for entity in er.async_entries_for_config_entry(er.async_get(hass), entry.entry_id) if entity.domain == "climate"), None)
    area_id = (climate.area_id if climate is not None else None) or (device.area_id if device is not None else None)
    area = ar.async_get(hass).async_get_area(area_id) if area_id is not None else None
    floor = fr.async_get(hass).async_get_floor(area.floor_id) if area is not None and area.floor_id is not None else None
    return ThermostatLocation(
        device_id=device.id if device is not None else (climate.device_id if climate is not None else None),
        climate_entity_id=climate.entity_id if climate is not None else None,
        area_id=area.id if area is not None else None,
        area_name=area.name if area is not None else None,
        floor_name=floor.name if floor is not None else None,
        floor_level=floor.level if floor is not None else None,
    )


def list_thermostats(hass: HomeAssistant, vtherm_major: int | None) -> list[ThermostatSummary]:
    """List the thermostats, without the central configuration, ordered by name, with where each one is."""
    summaries = [
        ThermostatSummary(
            entry.entry_id,
            str(entry.data.get(CONF_NAME, entry.title)),
            type_name(entry),
            read_only_reason(entry, vtherm_major) is not None,
            location_of(hass, entry),
        )
        for entry in entries(hass)
        if not is_central(entry)
    ]
    return sorted(summaries, key=lambda summary: summary.name.casefold())


def view_of(entry: ConfigEntry, vtherm_major: int | None) -> ConfigView:
    """Build the view of an entry."""
    return ConfigView(
        id=entry.entry_id,
        name=str(entry.data.get(CONF_NAME, entry.title)),
        type=type_name(entry),
        values=dict(entry.data),
        version=entry.version,
        minor_version=entry.minor_version,
        read_only_reason=read_only_reason(entry, vtherm_major),
    )


def read_config(hass: HomeAssistant, entry_id: str, vtherm_major: int | None) -> ConfigView:
    """Read the configuration of an entry.

    Raises:
        ConfigNotFoundError: There is no entry of Versatile Thermostat with this identifier.
    """
    entry = next((candidate for candidate in entries(hass) if candidate.entry_id == entry_id), None)
    if entry is None:
        raise ConfigNotFoundError(entry_id)
    return view_of(entry, vtherm_major)


def read_central_config(hass: HomeAssistant, vtherm_major: int | None) -> ConfigView | None:
    """Read the central configuration, or return None when there is none."""
    entry = central_entry(hass)
    return None if entry is None else view_of(entry, vtherm_major)
