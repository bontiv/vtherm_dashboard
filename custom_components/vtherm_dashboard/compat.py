"""Check that the running `vtherm_api` is recent enough for the dashboard.

Home Assistant installs the requirements of an integration at startup only when a different version is already imported, so after
an update of the dashboard the previous `vtherm_api` can still be running until Home Assistant restarts. This module must not
import `vtherm_api` or the other modules of the integration, so that the config flow still loads in that situation.
"""

from __future__ import annotations

from importlib import metadata

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN, ISSUE_RESTART_REQUIRED, MIN_VTHERM_API_VERSION
from .version_constraints import VersionConstraintError, satisfies


def _read_vtherm_api_version() -> str | None:
    """Read the installed version of `vtherm_api`, or None when it cannot be determined.

    This performs blocking filesystem access and must run in the executor, not in the event loop.
    """
    try:
        return metadata.version("vtherm_api")
    except metadata.PackageNotFoundError:
        return None


async def async_running_vtherm_api_version(hass: HomeAssistant) -> str | None:
    """Return the installed version of `vtherm_api`, or None when it cannot be determined.

    `importlib.metadata` scans the filesystem, so it is read in the executor to keep the event loop responsive.
    """
    return await hass.async_add_executor_job(_read_vtherm_api_version)


def is_vtherm_api_compatible(version: str | None) -> bool:
    """Return whether a `vtherm_api` version satisfies the minimum of the dashboard.

    An unknown or unparsable version is accepted, since the failure would then come from the real import.
    """
    if version is None:
        return True
    try:
        return satisfies(version, f">={MIN_VTHERM_API_VERSION}")
    except VersionConstraintError:
        return True


def create_restart_issue(hass: HomeAssistant, running_version: str) -> None:
    """Ask the user, in the repairs, to restart Home Assistant to load the required `vtherm_api`."""
    ir.async_create_issue(
        hass,
        DOMAIN,
        ISSUE_RESTART_REQUIRED,
        is_fixable=True,
        is_persistent=False,
        severity=ir.IssueSeverity.ERROR,
        translation_key=ISSUE_RESTART_REQUIRED,
        translation_placeholders={"running": running_version, "required": MIN_VTHERM_API_VERSION},
    )


def delete_restart_issue(hass: HomeAssistant) -> None:
    """Remove the repair issue, if any."""
    ir.async_delete_issue(hass, DOMAIN, ISSUE_RESTART_REQUIRED)
