"""Write the configuration of Versatile Thermostat by driving its own config flow.

The dashboard does not copy the validation rules of Versatile Thermostat. It opens the flow that Home Assistant would open (the
options flow of an entry, or the config flow for a new thermostat), goes to each step that the user changed, submits its values,
and finalizes. The flow validates and saves exactly as it does from the screens of Home Assistant, and it writes nothing before the
last step: the first error stops everything and the configuration is left as it was.

The rest of the dashboard only knows `ConfigWriter`, so that this mechanism can be replaced later, see docs/contributing/config-flow-driver.md.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType, InvalidData, UnknownFlow
from vtherm_api import get_vtherm_logger

from .vtherm_config import CENTRAL_TYPE, THERMOSTAT_TYPES, VTHERM_DOMAIN, async_vtherm_major, central_entry, entries, read_only_reason

_LOGGER = get_vtherm_logger(__name__)

TAB_ORDER: tuple[str, ...] = (
    "main",
    "features",
    "type",
    "tpi",
    "presets",
    "central_boiler",
    "window",
    "motion",
    "power",
    "presence",
    "auto_start_stop",
    "valve_regulation",
    "sync_device_internal_temp",
    "advanced",
    "lock",
    "humidity",
    "heating_failure_detection",
)
"""The tabs of the dashboard, which are the options of the menu of the flow. The order matters: `main`, `features` and `type` come
first because they decide which other tabs the menu offers."""

MAX_FORMS_PER_TAB = 12
"""A tab goes through a few forms (the tab, its specific form, the Auto TPI forms). More means that the flow is looping."""

# The codes that the dashboard adds to the ones of the flow.
ERROR_NOT_FOUND = "not_found"
ERROR_READ_ONLY = "config_version_unsupported"
ERROR_CENTRAL_EXISTS = "central_config_exists"
ERROR_UNKNOWN_TYPE = "unknown_thermostat_type"
ERROR_UNKNOWN_TAB = "unknown_tab"
ERROR_TAB_UNAVAILABLE = "tab_unavailable"
ERROR_NOT_COMPLETE = "configuration_not_complete"
ERROR_REQUIRED = "required"
ERROR_INVALID = "invalid_value"
ERROR_NOT_APPLICABLE = "field_not_applicable"
"""A changed field that no form of its tab asks for: the flow would drop it, so the save is refused instead."""
ERROR_FLOW = "flow_failed"

BASE = "base"
"""The field of an error that belongs to the whole form."""


@dataclass(frozen=True)
class FieldError:
    """An error on a field of a tab. The code is stable, the frontend translates it."""

    tab: str | None
    field: str
    code: str

    def as_dict(self) -> dict[str, Any]:
        """Return the error as a JSON-serializable dictionary."""
        return {"tab": self.tab, "field": self.field, "code": self.code}


@dataclass
class SaveResult:
    """The outcome of a save. When `ok` is False nothing was written."""

    ok: bool
    entry_id: str | None = None
    errors: list[FieldError] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        """Return the result as a JSON-serializable dictionary."""
        return {"ok": self.ok, "entry_id": self.entry_id, "errors": [error.as_dict() for error in self.errors]}


def failure(tab: str | None, field_name: str, code: str) -> SaveResult:
    """Build the result of a save that failed with one error."""
    return SaveResult(False, None, [FieldError(tab, field_name, code)])


class ConfigWriter(ABC):
    """Validate and save a configuration of Versatile Thermostat. This is the only way the dashboard writes it.

    A configuration is given as changes by tab: `{"tpi": {"tpi_coef_int": 0.7}}`. The tabs are the steps of the menu of the flow of
    Versatile Thermostat (see `TAB_ORDER`). A tab that is not in the changes is not touched, and a field of a tab that is in it keeps its
    current value unless the changes give another one. A value of `None` clears an optional field.
    """

    @abstractmethod
    async def async_update(self, entry_id: str, changes: Mapping[str, Mapping[str, Any]]) -> SaveResult:
        """Change the configuration of an entry: all of the changes, or none of them."""

    @abstractmethod
    async def async_create(self, thermostat_type: str, changes: Mapping[str, Mapping[str, Any]]) -> SaveResult:
        """Create a thermostat, or the central configuration, with all of its tabs, or create nothing."""


class FlowConfigWriter(ConfigWriter):
    """The writer that drives the config flow and the options flow of Versatile Thermostat."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Keep the Home Assistant instance whose flows are driven."""
        self._hass = hass

    @staticmethod
    def _unknown_tabs(changes: Mapping[str, Mapping[str, Any]]) -> list[FieldError]:
        return [FieldError(tab, BASE, ERROR_UNKNOWN_TAB) for tab in changes if tab not in TAB_ORDER]

    async def async_update(self, entry_id: str, changes: Mapping[str, Mapping[str, Any]]) -> SaveResult:
        """Open the options flow of the entry, go through the changed tabs and finalize."""
        entry = next((candidate for candidate in entries(self._hass) if candidate.entry_id == entry_id), None)
        if entry is None:
            return failure(None, BASE, ERROR_NOT_FOUND)
        if read_only_reason(entry, await async_vtherm_major(self._hass)) is not None:
            return failure(None, BASE, ERROR_READ_ONLY)
        if errors := self._unknown_tabs(changes):
            return SaveResult(False, None, errors)
        if not changes:
            return SaveResult(True, entry_id)

        manager = self._hass.config_entries.options
        result = await manager.async_init(entry_id)
        outcome = await self._drive(manager, result, dict(entry.data), changes)
        return SaveResult(outcome.ok, entry_id if outcome.ok else None, outcome.errors)

    async def async_create(self, thermostat_type: str, changes: Mapping[str, Mapping[str, Any]]) -> SaveResult:
        """Open the config flow, choose the type, go through the tabs and finalize."""
        if thermostat_type != CENTRAL_TYPE and thermostat_type not in THERMOSTAT_TYPES:
            return failure(None, "thermostat_type", ERROR_UNKNOWN_TYPE)
        if thermostat_type == CENTRAL_TYPE and central_entry(self._hass) is not None:
            return failure(None, "thermostat_type", ERROR_CENTRAL_EXISTS)
        if errors := self._unknown_tabs(changes):
            return SaveResult(False, None, errors)

        manager = self._hass.config_entries.flow
        known = {entry.entry_id for entry in entries(self._hass)}
        result = await manager.async_init(VTHERM_DOMAIN, context={"source": "user"})
        if result["type"] != FlowResultType.FORM or result["step_id"] != "user":
            await self._abort(manager, result)
            return failure(None, BASE, ERROR_FLOW)
        result, errors = await self._submit(manager, result, {"thermostat_type": thermostat_type}, {}, "user")
        if errors:
            await self._abort(manager, result)
            return SaveResult(False, None, errors)

        outcome = await self._drive(manager, result, {}, changes)
        created = [entry.entry_id for entry in entries(self._hass) if entry.entry_id not in known]
        return SaveResult(outcome.ok, created[0] if outcome.ok and created else None, outcome.errors)

    # One exit for each way the flow can stop.
    # pylint: disable-next=too-many-return-statements
    async def _drive(self, manager: Any, result: Any, baseline: Mapping[str, Any], changes: Mapping[str, Mapping[str, Any]]) -> SaveResult:
        """Go through the changed tabs from the menu, then finalize. The flow is aborted at the first error."""
        for tab in (name for name in TAB_ORDER if name in changes):
            if result["type"] != FlowResultType.MENU or tab not in _menu_options(result):
                await self._abort(manager, result)
                return failure(tab, BASE, ERROR_TAB_UNAVAILABLE)
            result = await manager.async_configure(result["flow_id"], {"next_step_id": tab})
            forms = 0
            asked: set[str] = set()
            while result["type"] == FlowResultType.FORM:
                forms += 1
                if forms > MAX_FORMS_PER_TAB:
                    await self._abort(manager, result)
                    return failure(tab, BASE, ERROR_FLOW)
                # A form of another step can follow: the flow of Versatile Thermostat sometimes goes on to the next feature.
                # It is submitted with the current values, so that nothing changes there.
                own_form = result["step_id"] == tab
                asked.update(str(marker) for marker in result["data_schema"].schema)
                result, errors = await self._submit(manager, result, changes[tab] if own_form else {}, baseline, tab if own_form else result["step_id"])
                if errors:
                    await self._abort(manager, result)
                    return SaveResult(False, None, errors)
            if result["type"] != FlowResultType.MENU:
                await self._abort(manager, result)
                return failure(tab, BASE, ERROR_FLOW)
            if dropped := [name for name in changes[tab] if name not in asked]:
                await self._abort(manager, result)
                return SaveResult(False, None, [FieldError(tab, name, ERROR_NOT_APPLICABLE) for name in sorted(dropped)])

        if result["type"] != FlowResultType.MENU or "finalize" not in _menu_options(result):
            # The menu only offers the end when the flow thinks that the configuration is complete.
            await self._abort(manager, result)
            return failure(None, BASE, ERROR_NOT_COMPLETE)
        result = await manager.async_configure(result["flow_id"], {"next_step_id": "finalize"})
        if result["type"] != FlowResultType.CREATE_ENTRY:
            await self._abort(manager, result)
            return failure(None, BASE, ERROR_FLOW)
        return SaveResult(True)

    async def _submit(self, manager: Any, result: Any, tab_changes: Mapping[str, Any], baseline: Mapping[str, Any], tab: str) -> tuple[Any, list[FieldError]]:
        """Fill the form with the values of the tab and send it.

        A form takes the keys of its schema. The value of a key is the one that the tab changes, otherwise the one that the form suggests,
        as the screens of Home Assistant send it, otherwise the current one. A key without any of them gets the default of the form.
        """
        schema = result["data_schema"]
        values: dict[str, Any] = {}
        for marker in schema.schema:
            name = str(marker)
            if name in tab_changes:
                value = tab_changes[name]
            else:
                value = _suggested_value(marker)
                if value is None:
                    value = baseline.get(name)
            if value is not None:
                values[name] = value
        try:
            new_result = await manager.async_configure(result["flow_id"], values)
        except InvalidData as err:
            return result, [FieldError(tab, str(name), _invalid_code(message)) for name, message in _invalid_fields(err)]
        if new_result["type"] == FlowResultType.FORM and new_result.get("errors"):
            return new_result, [FieldError(tab, name, str(code)) for name, code in new_result["errors"].items()]
        return new_result, []

    @staticmethod
    async def _abort(manager: Any, result: Any) -> None:
        """Stop the flow without saving. A flow that already ended is not an error."""
        try:
            manager.async_abort(result["flow_id"])
        except UnknownFlow:
            _LOGGER.debug("The flow %s already ended", result.get("flow_id"))


def _menu_options(result: Any) -> list[str]:
    """Return the options of a menu step, which Home Assistant gives as a list or as a dictionary."""
    return list(result["menu_options"])


def _suggested_value(marker: Any) -> Any:
    """Return the value that a form suggests for a key, or None.

    Versatile Thermostat suggests the values that it holds, for example its central options set to False when there is no central
    configuration, while the default of the schema can be True.
    """
    description = getattr(marker, "description", None)
    return description.get("suggested_value") if isinstance(description, Mapping) else None


def _invalid_fields(err: InvalidData) -> list[tuple[str, str]]:
    """Return the fields that the schema refused, with the reason."""
    return [(str(name), str(message)) for name, message in (err.schema_errors or {}).items()] or [(BASE, str(err.error_message))]


def _invalid_code(message: str) -> str:
    """Turn the message of the schema into a code: a missing value is `required`, anything else is `invalid_value`."""
    return ERROR_REQUIRED if "required key not provided" in message else ERROR_INVALID
