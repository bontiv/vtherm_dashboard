"""Tests for the version check that keeps the dashboard's `vtherm_api` requirement up to date."""

from __future__ import annotations

from importlib import metadata

import pytest
from homeassistant.core import HomeAssistant

from custom_components.vtherm_dashboard import compat


async def test_running_version_is_read_in_the_executor(hass: HomeAssistant, monkeypatch: pytest.MonkeyPatch) -> None:
    """The version is read outside the event loop, so that the blocking metadata access does not warn."""
    monkeypatch.setattr(metadata, "version", lambda _name: "0.2.0")

    assert await compat.async_running_vtherm_api_version(hass) == "0.2.0"


async def test_missing_package_gives_no_version(hass: HomeAssistant, monkeypatch: pytest.MonkeyPatch) -> None:
    """A missing `vtherm_api` reports no version instead of failing the setup."""

    def raise_not_found(_name: str) -> str:
        raise metadata.PackageNotFoundError

    monkeypatch.setattr(metadata, "version", raise_not_found)

    assert await compat.async_running_vtherm_api_version(hass) is None
