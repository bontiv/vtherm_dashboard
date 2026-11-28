"""Pytest configuration: custom integrations of the repository are enabled in every test."""

import asyncio
import os
from collections.abc import Mapping
from types import SimpleNamespace

import pytest
from homeassistant import loader
from homeassistant.core import HomeAssistant
from vtherm_api import VThermAPI
from vtherm_api.const import DOMAIN as VTHERM_API_DOMAIN
from pytest_homeassistant.common import MockConfigEntry, MockModule, mock_integration

import custom_components
from custom_components.vtherm_dashboard import panel
from custom_components.vtherm_dashboard.const import DOMAIN

from .external_paths import LOCATIONS, locate, skip_reason

EXTERNAL_VTHERM = locate("versatile_thermostat") / "custom_components"
"""The Versatile Thermostat of the development environment. Tests that run its real code need it, see requires_vtherm."""

REQUIRES_VTHERM_REASON = f"{LOCATIONS['versatile_thermostat'].variable}: {locate('versatile_thermostat')} is not available"
"""The skip reason, fixed at import: it also identifies the tests that need the real Versatile Thermostat, whether it is there or not."""
requires_vtherm = pytest.mark.skipif(skip_reason("versatile_thermostat") is not None, reason=REQUIRES_VTHERM_REASON)


def asyncio_debug_wanted(environ: Mapping[str, str]) -> bool:
    """Whether the tests run the event loop in debug mode: in the continuous integration, or when VTHERM_ASYNCIO_DEBUG is 1.

    The debug mode makes every future record the stack that created it, which reads each file of the stack. Through the mount of the
    host in the devcontainer, that made the tests of the real Versatile Thermostat ten times slower.
    """
    return bool(environ.get("CI")) or environ.get("VTHERM_ASYNCIO_DEBUG") == "1"


@pytest.fixture(autouse=True)
async def enable_event_loop_debug() -> None:
    """Replace the fixture of pytest-homeassistant that always turns the debug mode of the event loop on."""
    asyncio.get_running_loop().set_debug(asyncio_debug_wanted(os.environ))


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    """Mark `vtherm` the tests that run the code of the real Versatile Thermostat: through the fixture real_vtherm, or requires_vtherm."""
    for item in items:
        uses_fixture = "real_vtherm" in getattr(item, "fixturenames", ())
        required = any(marker.kwargs.get("reason") == REQUIRES_VTHERM_REASON for marker in item.iter_markers("skipif"))
        if uses_fixture or required:
            item.add_marker(pytest.mark.vtherm)


@pytest.fixture(name="real_vtherm")
def real_vtherm_fixture(hass: HomeAssistant):
    """Let Home Assistant load the real Versatile Thermostat of its external folder, for the tests that run its code.

    The other tests must not see it: they check what happens when Versatile Thermostat is absent, or replace it by a fake.
    """
    path = str(EXTERNAL_VTHERM)
    custom_components.__path__.append(path)
    hass.data.pop(loader.DATA_CUSTOM_COMPONENTS, None)
    yield
    # The path of a namespace package has no remove(): its list is private.
    custom_components.__path__._path = [entry for entry in custom_components.__path__._path if entry != path]  # pylint: disable=protected-access,no-member
    hass.data.pop(loader.DATA_CUSTOM_COMPONENTS, None)


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):  # pylint: disable=unused-argument
    """Let Home Assistant load the integration from custom_components/."""
    yield


@pytest.fixture(name="frontend_module")
def frontend_module_fixture(tmp_path, monkeypatch):
    """Provide a built frontend module in a temporary www folder."""
    (tmp_path / panel.FRONTEND_MODULE).write_text("customElements.define('vtherm-dashboard-panel', class extends HTMLElement {});\n", encoding="utf-8")
    monkeypatch.setattr(panel, "WWW_DIR", tmp_path)
    return tmp_path


@pytest.fixture(name="setup_dashboard")
def setup_dashboard_fixture(hass: HomeAssistant, frontend_module):  # pylint: disable=unused-argument
    """Return a coroutine function that sets up the dashboard with a fake Versatile Thermostat dependency."""

    async def _setup() -> MockConfigEntry:
        if "versatile_thermostat" not in hass.config.components:
            # A fake dependency, unless the test set up the real Versatile Thermostat.
            mock_integration(hass, MockModule("versatile_thermostat", partial_manifest={"version": "10.6.4"}))
        entry = MockConfigEntry(domain=DOMAIN, data={})
        entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        return entry

    return _setup


def pytest_addoption(parser) -> None:
    """Options of the tests of the dashboard."""
    parser.addoption("--update-schemas", action="store_true", default=False, help="Write the description of the forms of Versatile Thermostat in shared/.")
    parser.addoption("--update-hacs-answers", action="store_true", default=False, help="Write the answers of the real HACS in shared/hacs-answers.json.")
    parser.addoption(
        "--update-marketplace-answers", action="store_true", default=False, help="Write the answers of the real Marketplace of Home Assistant in shared/marketplace-answers.json."
    )


@pytest.fixture(name="api")
def api_fixture():
    """Return a VThermAPI on a minimal Home Assistant-like object, and that object."""
    VThermAPI.reset_vtherm_api()
    hass = SimpleNamespace(data={VTHERM_API_DOMAIN: {}}, config=SimpleNamespace(time_zone="UTC"))
    yield VThermAPI.get_vtherm_api(hass), hass
    VThermAPI.reset_vtherm_api()
